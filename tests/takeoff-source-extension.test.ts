import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,linkSync,symlinkSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createHash,randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {fork,type ChildProcess} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {provisionAdmin,signIn,requireActor,SESSION_COOKIE} from '../lib/auth';
import {database} from '../lib/erp';
import {viewerScope} from '../lib/takeoff-viewer-access';
import {planSourceExtension,commitSourceExtension,SourceExtensionError,type SourceExtensionInput,type SourceExtensionHooks} from '../lib/takeoff-source-extension';

const sha=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
const keys=['TAYCO_AUTH_DB_PATH','TAYCO_ERP_DB_PATH','TAYCO_SESSION_SECRET','TAYCO_APP_URL','TAYCO_TAKEOFF_MANIFEST_PATH','TAYCO_TAKEOFF_RELATIONS_PATH','TAYCO_TAKEOFF_MAPPING_PATH','TAYCO_SOURCE_EXTENSION_BUNDLE_PATH','TAYCO_SOURCE_EXTENSION_RELATIONS_PATH'];
type Fixture=Awaited<ReturnType<typeof fixture>>;
async function fixture(oldCount=2,newCount=1){
 const root=mkdtempSync(path.join(tmpdir(),'tayco-source-extension-'));
 const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 for(const d of ['parent','candidate'])mkdirSync(path.join(root,d,'assets'),{recursive:true});
 Object.assign(process.env,{TAYCO_AUTH_DB_PATH:path.join(root,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(root,'erp.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_APP_URL:'https://tayco.test',TAYCO_TAKEOFF_MANIFEST_PATH:path.join(root,'parent/manifest.json'),TAYCO_TAKEOFF_RELATIONS_PATH:path.join(root,'parent-relations.json'),TAYCO_TAKEOFF_MAPPING_PATH:path.join(root,'mapping.json'),TAYCO_SOURCE_EXTENSION_BUNDLE_PATH:path.join(root,'candidate'),TAYCO_SOURCE_EXTENSION_RELATIONS_PATH:path.join(root,'candidate-relations.json')});
 const pw='Synthetic-source-extension-only!';await provisionAdmin('extension@example.test',pw);const login=await signIn('extension@example.test',pw);
 const request=(signal?:AbortSignal)=>new Request('https://tayco.test/operator',{headers:{cookie:SESSION_COOKIE+'='+encodeURIComponent(login.cookie)},signal});
 const actor=await requireActor(request());
 const doc=(n:number)=>{const content=Buffer.from('%PDF-1.7\nSynthetic '+n+'\n%%EOF'),hash=sha(content);return {d:{id:'doc'+n,project_key:'collection',title:'Synthetic plan '+n,source_name:'Synthetic '+n+'.pdf',source_sha256:hash,kind:'drawing_pdf',asset_id:'asset'+n,page_count:1,metadata:{reviewHold:n===3}},a:{id:'asset'+n,path:'assets/'+n+'.pdf',sha256:hash,media_type:'application/pdf',size_bytes:content.length},content};};
 const items=Array.from({length:oldCount+newCount},(_,n)=>doc(n+1));
 function bundle(side:'parent'|'candidate'){
   const docs=items.slice(0,side==='parent'?oldCount:oldCount+newCount),bundle_id='bundle-'+side;
   for(const x of docs)writeFileSync(path.join(root,side,x.a.path),x.content);
   const manifest={schema_version:'takeoff-viewer-bundle/v1',bundle_status:'synthetic-review',bundle_id,counts:{projects:1,documents:docs.length,unique_source_sha256:docs.length},projects:[{key:'collection',display_name:'Synthetic refs',identity_status:'resolved',document_ids:docs.map(x=>x.d.id),metadata:{kind:'reference_collection'}}],documents:docs.map(x=>x.d),assets:docs.map(x=>x.a)};
   const raw=JSON.stringify(manifest);writeFileSync(path.join(root,side,'manifest.json'),raw);
   const relations={schemaVersion:'takeoff-viewer-relations/v1',bundleId:bundle_id,relationsId:'relations-'+sha(side),manifestSha256:sha(raw),contexts:[{contextKey:'collection',displayName:'Synthetic refs',identityStatus:'resolved',documentIds:docs.map(x=>x.d.id)}],documents:docs.map(x=>({documentId:x.d.id,contextKeys:['collection'],assetIds:[x.a.id],kind:x.d.kind})),assets:docs.map(x=>({assetId:x.a.id,documentIds:[x.d.id]}))};
   const rr=JSON.stringify(relations);writeFileSync(path.join(root,side+'-relations.json'),rr);
   return {bundleId:bundle_id,manifestSha256:sha(raw),relationsId:relations.relationsId,relationsSha256:sha(rr)};
 }
 const parent=bundle('parent'),candidate=bundle('candidate');
 const mapping={schemaVersion:'tayco-takeoff-viewer-access/v2',bundleId:parent.bundleId,relationsSha256:parent.relationsSha256,mappings:[{tenantId:actor.tenantId,projectId:'refs',contextKey:'collection',documents:items.slice(0,oldCount).map((_,n)=>({viewerDocumentId:'doc'+(n+1),erpDocumentId:'old'+(n+1)}))}],guestReviews:[]};
 const raw=JSON.stringify(mapping);writeFileSync(process.env.TAYCO_TAKEOFF_MAPPING_PATH!,raw);
 const input:SourceExtensionInput={parent:{...parent,mappingSha256:sha(raw)},candidate,projectId:'refs',contextKey:'collection',expectedProjectVersion:6};
 const db=database(),at='2026-10-24T00:00:00.000Z';
 const insert=(id:string,kind:string,projectId:string,data:unknown,version=1)=>db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?,?,?)').run(id,kind,actor.tenantId,projectId,actor.id,JSON.stringify(data),version,at,at);
 insert('refs','project','refs',{name:'Synthetic refs',sourceContextKey:'collection',intakeKind:'reference_collection',budgetUsd:null},6);
 const origin={bundleId:'old-origin',manifestSha256:'a'.repeat(64),relationsId:'relations-'+'b'.repeat(64),relationsSha256:'c'.repeat(64)};
 for(let n=1;n<=oldCount;n++)insert('old'+n,'document','refs',{storage:'takeoff_viewer',viewerDocumentId:'doc'+n,contextKey:'collection',sourceSha256:items[n-1].d.source_sha256,sourceKind:'drawing_pdf',contentType:'application/pdf',status:'approved',visibility:n===1?'client':'owner',name:'Original — intact '+n,...parent,...(n<=(oldCount===2?1:oldCount-6)?{registeredSourceIdentity:origin}:{}),other:{financialValue:null}},n+1);
 // Sentinel payloads stand for the independent M02/finance tables, not a real database copy.
 for(const table of ['takeoff_measurement_receipts','takeoff_measurement_bindings','takeoff_measurement_text_overlays','finance_sentinel']){db.exec('CREATE TABLE '+table+'(id TEXT PRIMARY KEY,payload TEXT)');db.prepare('INSERT INTO '+table+' VALUES(?,?)').run('original',JSON.stringify({price:null,quantity:'3.25',sha:'d'.repeat(64)}));}
 insert('note','note','refs',{body:'Unrelated'});
 const snapshot=()=>JSON.stringify({records:db.prepare('SELECT * FROM records ORDER BY id').all(),commands:db.prepare('SELECT * FROM commands ORDER BY key').all(),audit:db.prepare('SELECT * FROM audit ORDER BY id').all(),sentinels:['takeoff_measurement_receipts','takeoff_measurement_bindings','takeoff_measurement_text_overlays','finance_sentinel'].map(t=>db.prepare('SELECT * FROM '+t).all())});
 const auth=()=>new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
 const revoke=()=>{const a=auth();try{a.exec('DELETE FROM auth_sessions');}finally{a.close();}};
 const mutate=(id:string,fn:(p:Record<string,unknown>)=>void)=>{const row=db.prepare('SELECT payload FROM records WHERE id=?').get(id) as {payload:string};const p=JSON.parse(row.payload);fn(p);db.prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(p),id);};
 const cleanup=()=>{db.close();for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}rmSync(root,{recursive:true,force:true});};
 return {root,actor,request,cookie:login.cookie,input,db,auth,revoke,mutate,snapshot,cleanup,origin,items};
}
async function run(fn:(f:Fixture)=>Promise<void>){const f=await fixture();try{await fn(f);}finally{f.cleanup();}}
const conflict=(e:unknown)=>e instanceof SourceExtensionError&&e.status===409;

test('source extension: readonly plan, atomic staged receipt, exact history and failclosed cohort',()=>run(async f=>{
 const before=f.snapshot(),plan=await planSourceExtension(f.request(),f.input);
 assert.equal(f.snapshot(),before);assert.equal(plan.patches.length,2);assert.equal(plan.additions.length,1);
 assert.deepEqual(plan.patches.find(p=>p.id==='old1')!.payload.registeredSourceIdentity,f.origin);
 assert.deepEqual(plan.patches.find(p=>p.id==='old2')!.payload.registeredSourceIdentity,{bundleId:f.input.parent.bundleId,manifestSha256:f.input.parent.manifestSha256,relationsId:f.input.parent.relationsId,relationsSha256:f.input.parent.relationsSha256});
 const sourcePins=keys.slice(4).map(k=>process.env[k]);
 assert.deepEqual(viewerScope(f.actor,'refs').documentIds.sort(),['doc1','doc2']);
 const original=f.db.prepare("SELECT * FROM records WHERE id IN ('refs','note') ORDER BY id").all();
 const sentinels=f.db.prepare('SELECT * FROM takeoff_measurement_receipts').all();
 const r=await commitSourceExtension(f.request(),f.input,plan.planHash);
 assert.deepEqual([r.created,r.rebound,r.sourceAdmission],[1,2,'erp_staged_not_activated']);
 assert.deepEqual(f.db.prepare("SELECT * FROM records WHERE id IN ('refs','note') ORDER BY id").all(),original);
 assert.deepEqual(f.db.prepare('SELECT * FROM takeoff_measurement_receipts').all(),sentinels);
 assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM records WHERE kind='project'").get()!.n,1);
 const after=f.snapshot(),replay=await commitSourceExtension(f.request(),f.input,plan.planHash);
 assert.deepEqual(replay,{...r,created:0,rebound:0});assert.equal(f.snapshot(),after);
 // The new planner rejects the mixed cohort. The pre-existing admin reader still
 // resolves its old two-document mapping: this mechanism does not retrofit its guard.
 await assert.rejects(planSourceExtension(f.request(),f.input),conflict);
 assert.deepEqual(viewerScope(f.actor,'refs').documentIds.sort(),['doc1','doc2']);
 assert.deepEqual(keys.slice(4).map(k=>process.env[k]),sourcePins);
 const data=JSON.parse((f.db.prepare("SELECT payload FROM records WHERE id='old1'").get() as {payload:string}).payload);
 assert.equal(data.name,'Original — intact 1');assert.equal(data.visibility,'client');assert.equal(data.other.financialValue,null);
 assert.deepEqual(data.registeredSourceIdentity,f.origin);
 f.mutate('old1',p=>{p.name='changed after receipt';});
 await assert.rejects(commitSourceExtension(f.request(),f.input,plan.planHash),conflict);
}));

test('source extension: exact request identity, role, tenant, ownership and closed input',async t=>{
 for(const mode of ['none','clone','role','tenant','owner','input','unknownField','projectVersion','docVersion','mappingCohort','originContext','candidatePin','parentPin','abort'] as const){
  await t.test(mode,()=>run(async f=>{
   const plan=await planSourceExtension(f.request(),f.input);
   let request=f.request();
   if(mode==='none')request=new Request('https://tayco.test');
   if(mode==='clone'){await assert.rejects(planSourceExtension(f.actor as unknown as Request,f.input));return;}
   if(mode==='role'||mode==='tenant'){const a=f.auth();a.prepare('UPDATE auth_users SET '+(mode==='role'?'role':'tenant_id')+'=? WHERE id=?').run(mode==='role'?'staff':'other-tenant',f.actor.id);a.close();}
   if(mode==='owner')f.db.prepare("UPDATE records SET owner_id='other' WHERE id='old1'").run();
   if(mode==='input')(f.input as unknown as Record<string,unknown>).projectId='../refs';
   if(mode==='unknownField')(f.input as unknown as Record<string,unknown>).path=f.root;
   if(mode==='projectVersion')f.db.prepare("UPDATE records SET version=version+1 WHERE id='refs'").run();
   if(mode==='docVersion')f.db.prepare("UPDATE records SET version=version+1 WHERE id='old1'").run();
   if(mode==='mappingCohort')f.mutate('old1',p=>{p.bundleId='another-delivery';});
   if(mode==='originContext')f.mutate('old1',p=>{p.registeredSourceIdentity={...f.origin,contextKey:'another'};});
   if(mode==='candidatePin')f.input.candidate.manifestSha256='e'.repeat(64);
   if(mode==='parentPin')f.input.parent.relationsSha256='f'.repeat(64);
   if(mode==='abort'){const c=new AbortController();c.abort();request=f.request(c.signal);}
   const before=f.snapshot();await assert.rejects(commitSourceExtension(request,f.input,plan.planHash));assert.equal(f.snapshot(),before);
  }));
 }
});

test('source extension: session and source freshness around IO and transactional writes',async t=>{
 for(const mode of ['revokeIO','revokeLocked','revokeAfterWrite','revokeBeforeCommit','sourceIO','sourceLocked','sourceAfterWrite','envIO','faultAfterWrite','asyncHook'] as const){
  await t.test(mode,()=>run(async f=>{
   const p=await planSourceExtension(f.request(),f.input),before=f.snapshot();
   const drift=()=>writeFileSync(path.join(f.root,'candidate/assets/3.pdf'),Buffer.from('%PDF-mutated-content'));
   const hooks:SourceExtensionHooks={afterIO:()=>{if(mode==='revokeIO')f.revoke();if(mode==='sourceIO')drift();if(mode==='envIO')process.env.TAYCO_SOURCE_EXTENSION_BUNDLE_PATH=path.join(f.root,'parent');},transaction:phase=>{
    if(mode==='revokeLocked'&&phase==='locked'||mode==='revokeAfterWrite'&&phase==='afterWrite'||mode==='revokeBeforeCommit'&&phase==='beforeCommit')f.revoke();
    if(mode==='sourceLocked'&&phase==='locked'||mode==='sourceAfterWrite'&&phase==='afterWrite')drift();
    if(mode==='faultAfterWrite'&&phase==='afterWrite')throw new Error('Synthetic rollback');
    if(mode==='asyncHook'&&phase==='locked')return Promise.resolve() as unknown as void;
   }};
   await assert.rejects(commitSourceExtension(f.request(),f.input,p.planHash,hooks));
   assert.equal(f.snapshot(),before);
  }));
 }
});

test('source extension: materialized lineage, graph pins, bytes and links',async t=>{
 for(const mode of ['corruptSameSize','short','hardlink','junction','traversal','inheritedDoc','inheritedMetadata','duplicateSha','wrongContext','missingAsset','graph','extraAsset','unsafeNumber'] as const){
  await t.test(mode,()=>run(async f=>{
   const file=path.join(f.root,'candidate/manifest.json'),rr=path.join(f.root,'candidate-relations.json');
   const m=JSON.parse(readFileSync(file,'utf8')),r=JSON.parse(readFileSync(rr,'utf8')),asset=path.join(f.root,'candidate/assets/3.pdf');
   if(mode==='corruptSameSize'){const b=readFileSync(asset);b[9]^=1;writeFileSync(asset,b);}
   if(mode==='short')writeFileSync(asset,'x');
   if(mode==='hardlink'){linkSync(asset,path.join(f.root,'same-bytes-hardlink.pdf'));}
   if(mode==='junction'){const assets=path.join(f.root,'candidate/assets');rmSync(assets,{recursive:true});symlinkSync(path.join(f.root,'parent/assets'),assets,'junction');}
   if(mode==='traversal')m.assets[2].path='../parent/assets/1.pdf';
   if(mode==='inheritedDoc')m.documents[0].title='changed title';
   if(mode==='inheritedMetadata')m.projects[0].metadata.kind='changed';
   if(mode==='duplicateSha'){m.documents[2].source_sha256=m.documents[0].source_sha256;m.assets[2].sha256=m.assets[0].sha256;writeFileSync(asset,f.items[0].content);m.assets[2].size_bytes=f.items[0].content.length;m.counts.unique_source_sha256=2;}
   if(mode==='wrongContext')m.documents[2].project_key='another';
   if(mode==='missingAsset')m.assets.pop();
   if(mode==='graph')r.assets[0].documentIds=['doc3'];
   if(mode==='extraAsset')m.assets.push({...m.assets[0],id:'unused',path:'assets/unused.pdf'});
   if(mode==='unsafeNumber')m.documents[0].metadata.quantity=9007199254740992;
   if(!['corruptSameSize','short','hardlink','junction'].includes(mode)){writeFileSync(file,JSON.stringify(m));f.input.candidate.manifestSha256=sha(readFileSync(file));r.manifestSha256=f.input.candidate.manifestSha256;writeFileSync(rr,JSON.stringify(r));f.input.candidate.relationsSha256=sha(readFileSync(rr));}
   const before=f.snapshot();await assert.rejects(planSourceExtension(f.request(),f.input));assert.equal(f.snapshot(),before);
  }));
 }
});

const require=createRequire(import.meta.url),tsx=pathToFileURL(require.resolve('tsx')).href;
function child(){
 const c=fork(path.join(process.cwd(),'tests/source-extension-worker.ts'),[],{execArgv:['--import',tsx],silent:true,env:{...process.env}});
 let stderr='';c.stderr?.on('data',b=>{stderr+=b.toString();});c.stdout?.resume();
 const exit=new Promise<void>((resolve,reject)=>{c.once('error',reject);c.once('exit',code=>code===0?resolve():reject(new Error('Synthetic child exit '+code+': '+stderr)));});
 return {c,exit};
}
function message(c:ChildProcess,kind:string):Promise<Record<string,unknown>>{
 return new Promise((resolve,reject)=>{const listen=(v:Record<string,unknown>)=>{if(v.kind===kind||v.kind==='error'){c.off('message',listen);c.off('exit',closed);if(v.kind==='error')reject(new Error(String(v.message)));else resolve(v);}};const closed=()=>{c.off('message',listen);reject(new Error('Child ended before '+kind));};c.on('message',listen);c.once('exit',closed);});
}

test('source extension: two OS writers share one durable result; lost result retry',()=>run(async f=>{
 const p=await planSourceExtension(f.request(),f.input),workers=[child(),child()];
 try{
  const answers=workers.map(w=>message(w.c,'result'));
  for(const w of workers)w.c.send({mode:'commit',input:f.input,planHash:p.planHash,cookie:f.cookie});
  const results=(await Promise.all(answers)).map(x=>x.result as {created:number;rebound:number;id:string;receivedAt:string});
  await Promise.all(workers.map(w=>w.exit));
  assert.deepEqual(results.map(x=>x.created).sort(),[0,1]);assert.equal(new Set(results.map(x=>x.id)).size,1);assert.equal(new Set(results.map(x=>x.receivedAt)).size,1);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM commands').get()!.n,1);
  const before=f.snapshot(),again=await commitSourceExtension(f.request(),f.input,p.planHash);
  assert.equal(again.created,0);assert.equal(f.snapshot(),before);
 }finally{for(const w of workers)if(w.c.exitCode===null)w.c.kill();await Promise.allSettled(workers.map(w=>w.exit));}
}));

test('source extension: persisted session is checked after an actual held ERP lock',()=>run(async f=>{
 const p=await planSourceExtension(f.request(),f.input),before=f.snapshot(),worker=child();
 try{
  const locked=message(worker.c,'locked');worker.c.send({mode:'lock-revoke'});await locked;
  await assert.rejects(commitSourceExtension(f.request(),f.input,p.planHash));
  await worker.exit;assert.equal(f.snapshot(),before);
 }finally{if(worker.c.exitCode===null)worker.c.kill();await Promise.allSettled([worker.exit]);}
}));

test('source extension: replay requires exact project and delivery state',async t=>{
 for(const mode of ['project','document','source'] as const)await t.test(mode,()=>run(async f=>{
  const p=await planSourceExtension(f.request(),f.input);await commitSourceExtension(f.request(),f.input,p.planHash);
  if(mode==='project')f.db.prepare("UPDATE records SET version=version+1 WHERE id='refs'").run();
  if(mode==='document')f.db.prepare("DELETE FROM records WHERE id='old2'").run();
  if(mode==='source')writeFileSync(path.join(f.root,'candidate/assets/3.pdf'),'changed source');
  const before=f.snapshot();await assert.rejects(commitSourceExtension(f.request(),f.input,p.planHash));assert.equal(f.snapshot(),before);
 }));
});



test('source extension: complete 42 inherited / 6 added cohort and both origin classes',async()=>{
 const f=await fixture(42,6);
 try{
  const p=await planSourceExtension(f.request(),f.input);
  assert.equal(p.patches.length,42);assert.equal(p.additions.length,6);
  const before=f.db.prepare("SELECT id,payload,owner_id,project_id,version FROM records WHERE kind='document' ORDER BY id").all() as {id:string;payload:string;owner_id:string;project_id:string;version:number}[];
  const result=await commitSourceExtension(f.request(),f.input,p.planHash);
  assert.deepEqual([result.created,result.rebound],[6,42]);
  let literal=0,frozen=0;
  for(const old of before){
   const actual=f.db.prepare('SELECT * FROM records WHERE id=?').get(old.id) as {payload:string;owner_id:string;project_id:string;version:number};
   const a=JSON.parse(old.payload),b=JSON.parse(actual.payload);
   assert.equal(actual.owner_id,old.owner_id);assert.equal(actual.project_id,old.project_id);assert.equal(actual.version,old.version+1);
   assert.deepEqual(b.registeredSourceIdentity,a.registeredSourceIdentity??{bundleId:a.bundleId,manifestSha256:a.manifestSha256,relationsId:a.relationsId,relationsSha256:a.relationsSha256});
   assert.equal(Object.hasOwn(b.registeredSourceIdentity,'contextKey'),false);
   if(a.registeredSourceIdentity)literal++;else frozen++;
   for(const k of Object.keys(a))if(!['bundleId','manifestSha256','relationsId','relationsSha256'].includes(k))assert.deepEqual(b[k],a[k]);
  }
  assert.deepEqual([literal,frozen],[36,6]);
  const after=f.snapshot();assert.equal((await commitSourceExtension(f.request(),f.input,p.planHash)).created,0);assert.equal(f.snapshot(),after);
 }finally{f.cleanup();}
});

test('source extension: independent mapped project CAS and context stay scoped',()=>run(async f=>{
 for(const side of ['parent','candidate'] as const){
  const mp=path.join(f.root,side,'manifest.json'),rp=path.join(f.root,side+'-relations.json');
  const m=JSON.parse(readFileSync(mp,'utf8')),r=JSON.parse(readFileSync(rp,'utf8'));
  m.documents.find((d:{id:string})=>d.id==='doc1').project_key='secondary-context';
  m.projects[0].document_ids=m.projects[0].document_ids.filter((id:string)=>id!=='doc1');
  m.projects.push({...m.projects[0],key:'secondary-context',display_name:'Synthetic secondary',document_ids:['doc1']});m.counts.projects=2;
  writeFileSync(mp,JSON.stringify(m));f.input[side].manifestSha256=sha(readFileSync(mp));r.manifestSha256=f.input[side].manifestSha256;
  r.documents.find((d:{documentId:string})=>d.documentId==='doc1').contextKeys=['secondary-context'];
  r.contexts[0].documentIds=r.contexts[0].documentIds.filter((id:string)=>id!=='doc1');
  r.contexts.push({contextKey:'secondary-context',displayName:'Synthetic secondary',identityStatus:'resolved',documentIds:['doc1']});
  writeFileSync(rp,JSON.stringify(r));f.input[side].relationsSha256=sha(readFileSync(rp));
 }
 const mappingFile=path.join(f.root,'mapping.json'),m=JSON.parse(readFileSync(mappingFile,'utf8'));
 m.relationsSha256=f.input.parent.relationsSha256;
 const document=m.mappings[0].documents.shift();
 m.mappings.push({tenantId:f.actor.tenantId,projectId:'secondary',contextKey:'secondary-context',documents:[document]});
 writeFileSync(mappingFile,JSON.stringify(m));f.input.parent.mappingSha256=sha(readFileSync(mappingFile));
 f.db.prepare('INSERT INTO records SELECT ?,kind,tenant_id,?,owner_id,?,3,created_at,updated_at FROM records WHERE id=?').run('secondary','secondary',JSON.stringify({name:'Synthetic secondary',sourceContextKey:'secondary-context'}),'refs');
 for(const n of [1,2])f.mutate('old'+n,p=>{Object.assign(p,{bundleId:f.input.parent.bundleId,manifestSha256:f.input.parent.manifestSha256,relationsId:f.input.parent.relationsId,relationsSha256:f.input.parent.relationsSha256,...(n===1?{contextKey:'secondary-context'}:{})});});
 f.db.prepare("UPDATE records SET project_id='secondary' WHERE id='old1'").run();
 const p=await planSourceExtension(f.request(),f.input);assert.equal(p.projects.length,2);
 f.db.prepare("UPDATE records SET version=4 WHERE id='secondary'").run();const before=f.snapshot();
 await assert.rejects(commitSourceExtension(f.request(),f.input,p.planHash),conflict);assert.equal(f.snapshot(),before);
 f.db.prepare("UPDATE records SET version=3 WHERE id='secondary'").run();
 const projectRows=f.db.prepare("SELECT * FROM records WHERE kind='project' ORDER BY id").all();
 const result=await commitSourceExtension(f.request(),f.input,p.planHash);assert.equal(result.created,1);
 assert.deepEqual(f.db.prepare("SELECT * FROM records WHERE kind='project' ORDER BY id").all(),projectRows);
 assert.equal(f.db.prepare("SELECT project_id FROM records WHERE id='old1'").get()!.project_id,'secondary');
 assert.equal(JSON.parse((f.db.prepare("SELECT payload FROM records WHERE id='old1'").get() as {payload:string}).payload).contextKey,'secondary-context');
}));

test('source extension: actual SQL receipt failure rolls back all staged writes',()=>run(async f=>{
 const p=await planSourceExtension(f.request(),f.input),before=f.snapshot();
 f.db.exec("CREATE TRIGGER synthetic_receipt_failure BEFORE INSERT ON commands BEGIN SELECT RAISE(ABORT,'synthetic receipt fault'); END");
 await assert.rejects(commitSourceExtension(f.request(),f.input,p.planHash));assert.equal(f.snapshot(),before);
 f.db.exec('DROP TRIGGER synthetic_receipt_failure');
 assert.equal((await commitSourceExtension(f.request(),f.input,p.planHash)).created,1);
}));

test('source extension: materialized bytes cross multiple 64KiB hash windows',()=>run(async f=>{
 const file=path.join(f.root,'candidate/assets/3.pdf'),mp=path.join(f.root,'candidate/manifest.json'),rp=path.join(f.root,'candidate-relations.json');
 const bytes=Buffer.alloc(192*1024+37,7);Buffer.from('%PDF-1.7').copy(bytes);writeFileSync(file,bytes);
 const m=JSON.parse(readFileSync(mp,'utf8')),r=JSON.parse(readFileSync(rp,'utf8')),digest=sha(bytes);
 Object.assign(m.assets.find((a:{id:string})=>a.id==='asset3'),{size_bytes:bytes.length,sha256:digest});m.documents.find((d:{id:string})=>d.id==='doc3').source_sha256=digest;
 writeFileSync(mp,JSON.stringify(m));f.input.candidate.manifestSha256=sha(readFileSync(mp));r.manifestSha256=f.input.candidate.manifestSha256;writeFileSync(rp,JSON.stringify(r));f.input.candidate.relationsSha256=sha(readFileSync(rp));
 const p=await planSourceExtension(f.request(),f.input);assert.equal(p.additions[0].payload.sourceSha256,digest);
 const result=await commitSourceExtension(f.request(),f.input,p.planHash);assert.equal(result.created,1);
 assert.equal((await commitSourceExtension(f.request(),f.input,p.planHash)).created,0);
 bytes[65536]^=1;writeFileSync(file,bytes);const before=f.snapshot();
 await assert.rejects(commitSourceExtension(f.request(),f.input,p.planHash));assert.equal(f.snapshot(),before);
}));
