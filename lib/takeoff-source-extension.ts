import {createHash, randomUUID} from 'node:crypto';
import {lstatSync, openSync, readSync, fstatSync, closeSync, type Stats} from 'node:fs';
import {open} from 'node:fs/promises';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {TextDecoder} from 'node:util';
import {requireActor, revalidateRequestActor, requireRole, AuthError, type Actor} from './auth';

/** Private operator mechanism. No route, activation, grant or publication is provided here. */
export class SourceExtensionError extends Error {
  constructor(public status:number) {super('The reviewed source transition is unavailable or changed.');}
}
type ObjectRow=Record<string,unknown>;
type Identity={bundleId:string; manifestSha256:string; relationsId:string; relationsSha256:string};
export type SourceExtensionInput={
  parent:Identity & {mappingSha256:string}; candidate:Identity;
  projectId:string; expectedProjectVersion:number; contextKey:string;
};
type Row={id:string;kind:string;tenant_id:string;project_id:string;owner_id:string;payload:string;version:number;created_at:string;updated_at:string};
type Patch={id:string;version:number;beforeSha256:string;payload:ObjectRow};
type Addition={id:string;viewerDocumentId:string;payload:ObjectRow};
export type SourceExtensionPlan={
  planHash:string; tenantId:string; actorId:string; input:SourceExtensionInput;
  projectSha256:string; projects:{id:string;sha256:string}[]; patches:Patch[]; additions:Addition[];
  mapping:{tenantId:string;projectId:string;contextKey:string;documents:{viewerDocumentId:string;erpDocumentId:string}[]}[];
};
export type SourceExtensionReceipt={
  id:string;planHash:string;receivedAt:string;created:number;rebound:number;
  sourceAdmission:'erp_staged_not_activated';
};
export type SourceExtensionHooks={
  /** Trusted in-process fault observers, never deserialized from an operator body. */
  afterIO?:()=>void|Promise<void>;
  transaction?:(phase:'locked'|'afterWrite'|'beforeCommit')=>void;
};
type Witness={file:string;signature:string;sha?:string;max?:number};
type Asset={id:string;path:string;media_type:string;sha256:string;size_bytes:number};
type Doc={id:string;project_key:string;title:string;source_name:string;source_sha256:string;kind:string;asset_id:string;index_asset_id?:string|null;page_count?:number|null} & ObjectRow;
type Graph={manifest:ObjectRow;projects:Map<string,ObjectRow>;docs:Map<string,Doc>;assets:Map<string,Asset>;relations:ObjectRow};
type Sources={parent:Graph;candidate:Graph;mapping:SourceExtensionPlan['mapping'];witnesses:Witness[];environment:string;database:string};
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/,ERP=/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/,SHA=/^[a-f0-9]{64}$/;
const envKeys=['TAYCO_ERP_DB_PATH','TAYCO_AUTH_DB_PATH','TAYCO_TAKEOFF_MANIFEST_PATH','TAYCO_TAKEOFF_RELATIONS_PATH','TAYCO_TAKEOFF_MAPPING_PATH','TAYCO_SOURCE_EXTENSION_BUNDLE_PATH','TAYCO_SOURCE_EXTENSION_RELATIONS_PATH'];
const fail=(status=409):never=>{throw new SourceExtensionError(status);};
const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
function obj(v:unknown,keys?:string[]):ObjectRow {
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype) return fail(422);
  if(keys&&(Object.keys(v).length!==keys.length||Object.keys(v).some(k=>!keys.includes(k))))return fail(422);
  return v as ObjectRow;
}
function id(v:unknown,re=ID):string {if(typeof v!=='string'||!re.test(v))return fail(422);return v;}
function list(v:unknown,max:number):unknown[]{if(!Array.isArray(v)||v.length>max)return fail(422);return v;}
function ids(v:unknown,max=8192):string[]{const a=list(v,max).map(x=>id(x));if(new Set(a).size!==a.length)return fail(422);return a;}
function sorted(v:unknown){return [...ids(v)].sort();}
function canonical(v:unknown):string {
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+canonical(x)).join(',')+'}';
  // Payloads must survive a JSON round trip without silently changing numeric values.
  if(typeof v==='number'&&(!Number.isFinite(v)||Object.is(v,-0)||(!Number.isSafeInteger(v)&&Number.isInteger(v))))return fail(409);
  if(v===undefined||typeof v==='bigint')return fail(422);
  return JSON.stringify(v);
}
const same=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
function indexed<T>(a:T[],key:(x:T)=>string){const m=new Map<string,T>();for(const x of a){const k=key(x);if(m.has(k))return fail();m.set(k,x);}return m;}
function identity(v:unknown,mapping=false):Identity & {mappingSha256?:string}{
  const x=obj(v,['bundleId','manifestSha256','relationsId','relationsSha256',...(mapping?['mappingSha256']:[])]);
  return {bundleId:id(x.bundleId),manifestSha256:id(x.manifestSha256,SHA),relationsId:id(x.relationsId,/^relations-[a-f0-9]{64}$/),relationsSha256:id(x.relationsSha256,SHA),...(mapping?{mappingSha256:id(x.mappingSha256,SHA)}:{})};
}
function inputOf(v:unknown):SourceExtensionInput {
  const x=obj(v,['parent','candidate','projectId','expectedProjectVersion','contextKey']);
  if(!Number.isSafeInteger(x.expectedProjectVersion)||Number(x.expectedProjectVersion)<1)return fail(422);
  const input={parent:identity(x.parent,true) as SourceExtensionInput['parent'],candidate:identity(x.candidate),projectId:id(x.projectId,ERP),contextKey:id(x.contextKey),expectedProjectVersion:Number(x.expectedProjectVersion)};
  if(input.parent.bundleId===input.candidate.bundleId)return fail();
  return input;
}
function signature(s:Stats){return [s.dev,s.ino,s.mode,s.nlink,s.size,s.mtimeMs,s.ctimeMs].join(':');}
/** Checks every existing path component. Junctions and file hardlinks fail closed. */
function checked(file:string, directory=false):Stats {
  if(!path.isAbsolute(file)||path.resolve(file)!==file)return fail(503);
  const parsed=path.parse(file);let p=parsed.root;
  for(const part of file.slice(parsed.root.length).split(path.sep).filter(Boolean)){
    p=path.join(p,part);const s=lstatSync(p);
    if(s.isSymbolicLink()||(p!==file&&!s.isDirectory()))return fail(503);
  }
  const s=lstatSync(file);
  if(directory?!s.isDirectory():!s.isFile()||s.nlink!==1)return fail(503);
  return s;
}
function configured(key:string,directory=false){const p=process.env[key];if(!p||!path.isAbsolute(p))return fail(503);const f=path.resolve(p);checked(f,directory);return f;}
function jsonBytes(file:string,max:number):Buffer{
  checked(file);let fd:number|undefined;
  try{fd=openSync(file,'r');const before=fstatSync(fd);if(!before.isFile()||before.nlink!==1||before.size<1||before.size>max)return fail(503);
    const b=Buffer.alloc(before.size+1);let n=0;while(n<b.length){const r=readSync(fd,b,n,b.length-n,n);if(!r)break;n+=r;}
    if(n!==before.size||signature(before)!==signature(fstatSync(fd))||signature(before)!==signature(checked(file)))return fail();
    return b.subarray(0,n);
  }finally{if(fd!==undefined)closeSync(fd);}
}
function readJson(file:string,max:number,sha:string,w:Witness[]){
  const b=jsonBytes(file,max);if(hash(b)!==sha)return fail();
  const x=obj(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b)));canonical(x);
  w.push({file,signature:signature(checked(file)),sha,max});return x;
}
function label(v:unknown):string {if(typeof v!=='string'||!v.trim()||v.length>500||/[\u0000-\u001f\u007f]/.test(v))return fail();return v;}
function graph(m:ObjectRow,r:ObjectRow,pin:Identity):Graph {
  if(m.schema_version!=='takeoff-viewer-bundle/v1'||r.schemaVersion!=='takeoff-viewer-relations/v1'||m.bundle_id!==pin.bundleId||r.bundleId!==pin.bundleId||r.manifestSha256!==pin.manifestSha256||r.relationsId!==pin.relationsId)return fail();
  obj(r,['schemaVersion','bundleId','relationsId','manifestSha256','contexts','documents','assets']);
  const assets=indexed(list(m.assets,8192).map(v=>{
    const a=obj(v) as Asset;id(a.id);id(a.sha256,SHA);label(a.media_type);
    if(typeof a.path!=='string'||a.path.length>500||/[\\%?#:\u0000-\u001f]/.test(a.path)||a.path.split('/').some(p=>!p||p==='.'||p==='..')||!Number.isSafeInteger(a.size_bytes)||a.size_bytes<1||a.size_bytes>512*1024*1024)return fail();
    return a;
  }),a=>a.id);
  if(new Set([...assets.values()].map(a=>a.path.toLowerCase())).size!==assets.size)return fail();
  const docs=indexed(list(m.documents,4096).map(v=>{
    const d=obj(v) as Doc;id(d.id);id(d.project_key);id(d.asset_id);id(d.source_sha256,SHA);label(d.title);label(d.source_name);
    if(!['drawing_pdf','drawing_image','itb','specification','addendum','reference','processed_docx'].includes(d.kind))return fail();
    const primary=assets.get(d.asset_id);
    if(!primary||primary.sha256!==d.source_sha256)return fail();
    if(d.index_asset_id!=null&&(!assets.has(id(d.index_asset_id))||d.index_asset_id===d.asset_id))return fail();
    if(d.page_count!=null&&(!Number.isSafeInteger(d.page_count)||d.page_count<1))return fail();
    return d;
  }),d=>d.id);
  const projects=indexed(list(m.projects,512).map(v=>{const p=obj(v);id(p.key);label(p.display_name);ids(p.document_ids);if(!['resolved','unresolved'].includes(String(p.identity_status)))return fail();return p;}),p=>id(p.key));
  const contexts=indexed(list(r.contexts,512).map(v=>obj(v,['contextKey','displayName','identityStatus','documentIds'])),c=>id(c.contextKey));
  const rd=indexed(list(r.documents,4096).map(v=>obj(v,['documentId','contextKeys','assetIds','kind'])),d=>id(d.documentId));
  const ra=indexed(list(r.assets,8192).map(v=>obj(v,['assetId','documentIds'])),a=>id(a.assetId));
  if(!same([...projects.keys()].sort(),[...contexts.keys()].sort())||!same([...docs.keys()].sort(),[...rd.keys()].sort())||!same([...assets.keys()].sort(),[...ra.keys()].sort()))return fail();
  const refs=new Map<string,string[]>();
  for(const [key,p] of projects){
    const c=contexts.get(key)!;
    if(c.displayName!==p.display_name||c.identityStatus!==p.identity_status||!same(sorted(c.documentIds),sorted(p.document_ids)))return fail();
    for(const doc of ids(p.document_ids))if(docs.get(doc)?.project_key!==key)return fail();
  }
  for(const d of docs.values()){
    const rel=rd.get(d.id)!,as=[d.asset_id,...(d.index_asset_id?[d.index_asset_id]:[])];
    if(!projects.has(d.project_key)||!ids(projects.get(d.project_key)!.document_ids).includes(d.id)||!same(ids(rel.contextKeys),[d.project_key])||rel.kind!==d.kind||!same(sorted(rel.assetIds),as.sort()))return fail();
    for(const a of as){const all=refs.get(a)??[];all.push(d.id);refs.set(a,all);}
  }
  for(const [a,rel] of ra)if(!same(sorted(rel.documentIds),(refs.get(a)??[]).sort()))return fail();
  const counts=obj(m.counts);
  if(counts.projects!==projects.size||counts.documents!==docs.size||counts.unique_source_sha256!==new Set([...docs.values()].map(d=>d.source_sha256)).size)return fail();
  return {manifest:m,projects,docs,assets,relations:r};
}
async function verifyAssets(root:string,g:Graph,w:Witness[],fresh:()=>void){
  checked(root,true);w.push({file:root,signature:signature(checked(root,true))});
  let total=0;
  for(const a of g.assets.values()){
    total+=a.size_bytes;if(total>2*1024*1024*1024)return fail(413);
    const file=path.resolve(root,...a.path.split('/'));
    if(!file.startsWith(root+path.sep))return fail();
    const before=checked(file);if(before.size!==a.size_bytes)return fail();
    const handle=await open(file,'r');
    try{
      if(signature(await handle.stat())!==signature(before))return fail();
      const h=createHash('sha256'),b=Buffer.alloc(64*1024);let offset=0;
      while(offset<a.size_bytes){fresh();const {bytesRead}=await handle.read(b,0,Math.min(b.length,a.size_bytes-offset),offset);if(!bytesRead)return fail();h.update(b.subarray(0,bytesRead));offset+=bytesRead;}
      const extra=await handle.read(b,0,1,offset);
      if(extra.bytesRead||h.digest('hex')!==a.sha256||signature(before)!==signature(await handle.stat())||signature(before)!==signature(checked(file)))return fail();
      w.push({file,signature:signature(before)});
    }finally{await handle.close();}
  }
}
function lineage(p:Graph,c:Graph,input:SourceExtensionInput){
  const omit=(m:ObjectRow)=>Object.fromEntries(Object.entries(m).filter(([k])=>!['bundle_id','counts','projects','documents','assets'].includes(k)));
  if(!same(omit(p.manifest),omit(c.manifest)))return fail();
  if(!same([...p.projects.keys()].sort(),[...c.projects.keys()].sort()))return fail();
  for(const [key,old] of p.projects){
    const next=c.projects.get(key)!;
    const {document_ids:oldIds,...a}=old,{document_ids:newIds,...b}=next;
    if(!same(a,b)||ids(oldIds).some(id=>!ids(newIds).includes(id))||(key!==input.contextKey&&!same(sorted(oldIds),sorted(newIds))))return fail();
  }
  for(const [key,old] of p.docs)if(!c.docs.has(key)||!same(old,c.docs.get(key)))return fail();
  for(const [key,old] of p.assets)if(!c.assets.has(key)||!same(old,c.assets.get(key)))return fail();
  const added=[...c.docs.values()].filter(d=>!p.docs.has(d.id));
  if(!added.length||added.length>256||added.some(d=>d.project_key!==input.contextKey||!['drawing_pdf','reference'].includes(d.kind)||c.assets.get(d.asset_id)!.media_type!=='application/pdf'))return fail();
  // A source already received under any old identity cannot be added as another document.
  const shas=new Set([...p.docs.values()].map(d=>d.source_sha256));
  for(const d of added){if(shas.has(d.source_sha256))return fail();shas.add(d.source_sha256);}
}
function envSignature(){return canonical(Object.fromEntries(envKeys.map(k=>[k,process.env[k]??null])));}
async function sources(input:SourceExtensionInput,fresh:()=>void):Promise<Sources>{
  const environment=envSignature(),witnesses:Witness[]=[];
  const pm=configured('TAYCO_TAKEOFF_MANIFEST_PATH'),pr=configured('TAYCO_TAKEOFF_RELATIONS_PATH'),mp=configured('TAYCO_TAKEOFF_MAPPING_PATH');
  const root=configured('TAYCO_SOURCE_EXTENSION_BUNDLE_PATH',true),cr=configured('TAYCO_SOURCE_EXTENSION_RELATIONS_PATH');
  const cm=path.join(root,'manifest.json');
  if(path.dirname(pm)===root)return fail();
  const parent=graph(readJson(pm,10*1024*1024,input.parent.manifestSha256,witnesses),readJson(pr,5*1024*1024,input.parent.relationsSha256,witnesses),input.parent);
  const candidate=graph(readJson(cm,10*1024*1024,input.candidate.manifestSha256,witnesses),readJson(cr,5*1024*1024,input.candidate.relationsSha256,witnesses),input.candidate);
  lineage(parent,candidate,input);
  const mapping=readJson(mp,1024*1024,input.parent.mappingSha256,witnesses);
  obj(mapping,['schemaVersion','bundleId','relationsSha256','mappings','guestReviews']);
  if(!['tayco-takeoff-viewer-access/v1','tayco-takeoff-viewer-access/v2'].includes(String(mapping.schemaVersion))||mapping.bundleId!==input.parent.bundleId||mapping.relationsSha256!==input.parent.relationsSha256)return fail();
  list(mapping.guestReviews,2048);
  const seen=new Set<string>();
  const maps=list(mapping.mappings,2048).map(v=>{
    const m=obj(v,['tenantId','projectId','contextKey','documents']);
    const tenantId=id(m.tenantId,ERP),projectId=id(m.projectId,ERP),contextKey=id(m.contextKey);
    const documents=list(m.documents,4096).map(v=>{
      const d=obj(v,['viewerDocumentId','erpDocumentId']),viewerDocumentId=id(d.viewerDocumentId),erpDocumentId=id(d.erpDocumentId,ERP);
      if(seen.has(viewerDocumentId)||parent.docs.get(viewerDocumentId)?.project_key!==contextKey)return fail();
      seen.add(viewerDocumentId);return {viewerDocumentId,erpDocumentId};
    });
    return {tenantId,projectId,contextKey,documents};
  });
  if(new Set(maps.map(m=>canonical([m.tenantId,m.projectId,m.contextKey]))).size!==maps.length)return fail();
  if(!same([...seen].sort(),[...parent.docs.keys()].sort())||new Set(maps.flatMap(m=>m.documents.map(d=>d.erpDocumentId))).size!==seen.size)return fail();
  await verifyAssets(path.dirname(pm),parent,witnesses,fresh);await verifyAssets(root,candidate,witnesses,fresh);
  fresh();
  const database=configured('TAYCO_ERP_DB_PATH');
  if(environment!==envSignature())return fail();
  return {parent,candidate,mapping:maps,witnesses,environment,database};
}
function guard(s:Sources){
  if(s.environment!==envSignature()||s.database!==configured('TAYCO_ERP_DB_PATH'))return fail();
  for(const w of s.witnesses){
    const st=checked(w.file,w.file===path.dirname(configured('TAYCO_TAKEOFF_MANIFEST_PATH'))||w.file===configured('TAYCO_SOURCE_EXTENSION_BUNDLE_PATH',true));
    if(signature(st)!==w.signature||(w.sha&&hash(jsonBytes(w.file,w.max!))!==w.sha))return fail();
  }
}
function persisted(db:DatabaseSync,key:string,actor:Actor):Row{
  const row=db.prepare('SELECT * FROM records WHERE id=? AND length(payload)<=1048576').get(key) as Row|undefined;
  if(!row||row.tenant_id!==actor.tenantId||row.owner_id!==actor.id||!Number.isSafeInteger(row.version)||row.version<1)return fail();
  const p=obj(JSON.parse(row.payload));canonical(p);
  if(p.deletedAt||p.purgedAt||p.purgeState)return fail();
  return row;
}
function oldIdentity(d:ObjectRow):Identity {
  return {bundleId:id(d.bundleId),manifestSha256:id(d.manifestSha256,SHA),relationsId:id(d.relationsId,/^relations-[a-f0-9]{64}$/),relationsSha256:id(d.relationsSha256,SHA)};
}
function build(actor:Actor,input:SourceExtensionInput,s:Sources,db:DatabaseSync):SourceExtensionPlan{
  const project=persisted(db,input.projectId,actor),pd=obj(JSON.parse(project.payload));
  if(project.kind!=='project'||project.project_id!==project.id||project.version!==input.expectedProjectVersion||pd.sourceContextKey!==input.contextKey||pd.intakeKind!=='reference_collection')return fail();
  const patches:Patch[]=[],projects:{id:string;sha256:string}[]=[];
  for(const m of s.mapping){
    if(m.tenantId!==actor.tenantId)return fail();
    const target=persisted(db,m.projectId,actor),tp=obj(JSON.parse(target.payload));
    if(target.kind!=='project'||tp.sourceContextKey!==m.contextKey)return fail();
    projects.push({id:target.id,sha256:hash(canonical(target))});
    for(const item of m.documents){
      const row=persisted(db,item.erpDocumentId,actor),payload=obj(JSON.parse(row.payload)),doc=s.parent.docs.get(item.viewerDocumentId)!;
      if(row.kind!=='document'||row.project_id!==m.projectId||payload.storage!=='takeoff_viewer'||payload.viewerDocumentId!==doc.id||payload.contextKey!==m.contextKey||payload.sourceSha256!==doc.source_sha256||payload.sourceKind!==doc.kind||payload.contentType!==s.parent.assets.get(doc.asset_id)!.media_type||!same(oldIdentity(payload),oldIdentity(input.parent))||!['owner','client'].includes(String(payload.visibility))||payload.status!=='approved'||Object.hasOwn(payload,'blobPath'))return fail();
      const origin=payload.registeredSourceIdentity;
      if(origin!==undefined){const o=obj(origin);oldIdentity(o);if(o.contextKey!==undefined&&o.contextKey!==payload.contextKey)return fail();}
      patches.push({id:row.id,version:row.version,beforeSha256:hash(row.payload),payload:{...payload,...input.candidate,registeredSourceIdentity:origin??oldIdentity(payload)}});
    }
  }
  const additions=[...s.candidate.docs.values()].filter(d=>!s.parent.docs.has(d.id)).map(d=>{
    const key='takeoff-document-'+hash(JSON.stringify([actor.tenantId,project.id,input.candidate.bundleId,d.id]));
    const alias=db.prepare("SELECT id FROM records WHERE tenant_id=? AND kind='document' AND json_valid(payload) AND (json_extract(payload,'$.viewerDocumentId')=? OR json_extract(payload,'$.sourceSha256')=?)").all(actor.tenantId,d.id,d.source_sha256);
    if(alias.length||db.prepare('SELECT 1 FROM records WHERE id=?').get(key))return fail();
    return {id:key,viewerDocumentId:d.id,payload:{storage:'takeoff_viewer',viewerDocumentId:d.id,...input.candidate,contextKey:d.project_key,sourceSha256:d.source_sha256,name:d.title,sourceName:d.source_name,contentType:'application/pdf',type:'project',status:'approved',visibility:'owner',expiresAt:null,pageCount:d.page_count??null,sourceKind:d.kind,source:'takeoff_source_registration'}};
  }).sort((a,b)=>a.id.localeCompare(b.id));
  patches.sort((a,b)=>a.id.localeCompare(b.id));
  const mapping=s.mapping.map(m=>({...m,documents:[...m.documents]}));
  const selected=mapping.find(m=>m.projectId===project.id&&m.contextKey===input.contextKey);
  if(!selected)return fail();
  selected.documents.push(...additions.map(d=>({viewerDocumentId:d.viewerDocumentId,erpDocumentId:d.id})));
  const body={tenantId:actor.tenantId,actorId:actor.id,input,projectSha256:hash(canonical(project)),projects:projects.sort((a,b)=>a.id.localeCompare(b.id)),patches,additions,mapping};
  return {planHash:hash(canonical(body)),...body};
}
function syncHook(h:SourceExtensionHooks,phase:Parameters<NonNullable<SourceExtensionHooks['transaction']>>[0]){
  const result:unknown=h.transaction?.(phase);if(result&&typeof (result as unknown as Promise<unknown>).then==='function')return fail(503);
}
function connection(s:Sources,readOnly:boolean){checked(s.database);const db=new DatabaseSync(s.database,{readOnly});db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;'+(readOnly?'PRAGMA query_only=ON;':''));return db;}
async function context(request:Request,value:unknown){
  if(!(request instanceof Request))return fail(403);
  const actor=await requireActor(request);requireRole(actor,['admin']);
  const fresh=()=>{if(request.signal.aborted)return fail(408);const a=revalidateRequestActor(actor);requireRole(a,['admin']);return a;};
  const input=inputOf(value),s=await sources(input,fresh);return {actor,input,s,fresh};
}
async function protectedCall<T>(fn:()=>Promise<T>):Promise<T>{try{return await fn();}catch(e){if(e instanceof SourceExtensionError||e instanceof AuthError)throw e;return fail(503);}}
/** Full bytes verified, ERP query_only. Does not create tables, receipts or sources. */
export function planSourceExtension(request:Request,value:unknown,hooks:SourceExtensionHooks={}):Promise<SourceExtensionPlan>{
  return protectedCall(async()=>{const c=await context(request,value);await hooks.afterIO?.();c.fresh();guard(c.s);const db=connection(c.s,true);try{const plan=build(c.actor,c.input,c.s,db);c.fresh();guard(c.s);return plan;}finally{db.close();}});
}
type Stored={receipt:SourceExtensionReceipt;plan:SourceExtensionPlan;rows:Row[];resultSha256:string};
/** Transaction stages ERP delivery + new documents. Mapping/config/process activation is a separate operation. */
export function commitSourceExtension(request:Request,value:unknown,expectedPlanHash:string,hooks:SourceExtensionHooks={}):Promise<SourceExtensionReceipt>{
  return protectedCall(async()=>{
    id(expectedPlanHash,SHA);const c=await context(request,value);await hooks.afterIO?.();c.fresh();guard(c.s);
    const db=connection(c.s,false),key='source-extension:'+expectedPlanHash,requestHash=hash(canonical({input:c.input,expectedPlanHash}));
    let begun=false;
    try{
      db.exec('BEGIN IMMEDIATE');begun=true;
      syncHook(hooks,'locked');c.fresh();guard(c.s);
      const old=db.prepare('SELECT hash,result FROM commands WHERE tenant_id=? AND actor_id=? AND key=?').get(c.actor.tenantId,c.actor.id,key) as {hash:string;result:string}|undefined;
      if(old){
        if(old.hash!==requestHash)return fail();
        const stored=JSON.parse(old.result) as Stored;
        if(hash(canonical({receipt:stored.receipt,plan:stored.plan,rows:stored.rows}))!==stored.resultSha256||stored.receipt.id!=='source-extension-'+expectedPlanHash||stored.receipt.planHash!==expectedPlanHash||stored.receipt.sourceAdmission!=='erp_staged_not_activated')return fail();
        if(stored.plan.planHash!==expectedPlanHash||hash(canonical(Object.fromEntries(Object.entries(stored.plan).filter(([key])=>key!=='planHash'))))!==expectedPlanHash||!same(stored.plan.input,c.input))return fail();
        for(const expected of stored.rows){const actual=persisted(db,expected.id,c.actor);if(!same(actual,expected))return fail();}
        for(const p of stored.plan.projects)if(hash(canonical(persisted(db,p.id,c.actor)))!==p.sha256)return fail();
        const project=persisted(db,c.input.projectId,c.actor);if(hash(canonical(project))!==stored.plan.projectSha256)return fail();
        syncHook(hooks,'beforeCommit');c.fresh();guard(c.s);db.exec('COMMIT');return {...stored.receipt,created:0,rebound:0};
      }
      const plan=build(c.actor,c.input,c.s,db);if(plan.planHash!==expectedPlanHash)return fail();
      const at=new Date().toISOString();
      for(const patch of plan.patches){
        const current=persisted(db,patch.id,c.actor);
        if(current.version!==patch.version||hash(current.payload)!==patch.beforeSha256)return fail();
        const update=db.prepare('UPDATE records SET payload=?,version=version+1,updated_at=? WHERE id=? AND tenant_id=? AND version=? AND payload=?').run(JSON.stringify(patch.payload),at,patch.id,c.actor.tenantId,patch.version,current.payload);
        if(update.changes!==1)return fail();
      }
      for(const a of plan.additions)db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(a.id,'document',c.actor.tenantId,c.input.projectId,c.actor.id,JSON.stringify({...a.payload,registeredAt:at,registeredBy:c.actor.id}),at,at);
      const receipt:SourceExtensionReceipt={id:'source-extension-'+expectedPlanHash,planHash:expectedPlanHash,receivedAt:at,created:plan.additions.length,rebound:plan.patches.length,sourceAdmission:'erp_staged_not_activated'};
      db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(),c.actor.tenantId,c.actor.id,'takeoff_source.extended',receipt.id,at);
      const rows=[...plan.patches,...plan.additions].map(x=>persisted(db,x.id,c.actor));
      const stored={receipt,plan,rows,resultSha256:hash(canonical({receipt,plan,rows}))} satisfies Stored;
      db.prepare('INSERT INTO commands VALUES(?,?,?,?,?)').run(c.actor.tenantId,c.actor.id,key,requestHash,JSON.stringify(stored));
      syncHook(hooks,'afterWrite');c.fresh();guard(c.s);
      syncHook(hooks,'beforeCommit');c.fresh();guard(c.s);
      db.exec('COMMIT');return receipt;
    }catch(e){if(begun)db.exec('ROLLBACK');throw e;}finally{db.close();}
  });
}
