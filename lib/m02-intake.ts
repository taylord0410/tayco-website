import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { requireActor, requireRole, revalidateRequestActor, type Actor } from './auth';
import { database, type Entry } from './erp';
import { viewerScope } from './takeoff-viewer-access';

export class M02IntakeError extends Error {
 constructor(public status:number,message:string){super(message);this.name='M02IntakeError';}
}
type DocumentIdentity={contextKey:string;documentId:string;pdfSha256:string;documentRevision:string};
export type Measurement=DocumentIdentity&{stableId:string;measurementId:string;revision:string;pageNumber:number;viewportId:string;method:string;unit:string;reviewStatus:string;physicalScopeId:string;scopeRelation:string;additive:boolean;quantity:string|null;pendingReason:string|null;assumptions:string[];evidence:{evidenceId:string;kind:string;pageNumber:number;artifactRef:string}[]};
export type BoqLine={lineId:string;revision:string;scope:string;description:string;unit:string;measurementRefs:{stableId:string;revision:string}[];aggregationRule:string;inclusionStatus:string;pricingState:string;quantity:string|null;rate:string|null;currency:string|null;priceSourceRef:Record<string,unknown>|null};
type Prepared={schemaVersion:'tayco-m02-prepared/v1';archiveKey:string;archiveState:string;receipt:{packageId:string;revision:string;payloadDigest:string;packageSha256:string;sourceBundleId:string;sourceManifestSha256:string;contractManifestSha256:string};documents:DocumentIdentity[];measurements:Measurement[];boqLines:BoqLine[];reviewBasis:string};
type Binding={contextKey:string;viewerDocumentId:string;pdfSha256:string;erpDocumentId:string;projectId:string};
type ReceiptRow={id:string;tenant_id:string;package_id:string;revision:string;payload_digest:string;package_sha:string;archive_key:string;received_at:string;actor_id:string;supersedes_id:string|null;projection:string;summary:string;bindings:string};
const SHA=/^[a-f0-9]{64}$/, ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const bad=():never=>{throw new M02IntakeError(503,'Verified measurement preparation is unavailable.');};
const changed=():never=>{throw new M02IntakeError(409,'The measurement source or existing project binding changed. Review it before receiving.');};
function exactActor(actor:Actor,roles:('admin'|'staff')[]){const fresh=revalidateRequestActor(actor);requireRole(fresh,roles);return fresh;}
function install(){
 const db=database();
 db.exec(`CREATE TABLE IF NOT EXISTS takeoff_measurement_receipts(
 id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,package_id TEXT NOT NULL,revision TEXT NOT NULL,
 payload_digest TEXT NOT NULL,package_sha TEXT NOT NULL,archive_key TEXT NOT NULL,
 received_at TEXT NOT NULL,actor_id TEXT NOT NULL,supersedes_id TEXT UNIQUE REFERENCES takeoff_measurement_receipts(id),
 projection TEXT NOT NULL,summary TEXT NOT NULL,bindings TEXT NOT NULL,UNIQUE(tenant_id,package_id,revision));
 CREATE TABLE IF NOT EXISTS takeoff_measurement_bindings(
 receipt_id TEXT NOT NULL REFERENCES takeoff_measurement_receipts(id),tenant_id TEXT NOT NULL,
 project_id TEXT NOT NULL,erp_document_id TEXT NOT NULL,context_key TEXT NOT NULL,viewer_document_id TEXT NOT NULL,
 PRIMARY KEY(receipt_id,context_key,viewer_document_id));
 CREATE INDEX IF NOT EXISTS measurement_project_receipts ON takeoff_measurement_bindings(tenant_id,project_id,receipt_id);`);
 return db;
}
function preparedOf(raw:string):Prepared{
 try{
  const value=JSON.parse(raw) as Prepared;
  if(!value||value.schemaVersion!=='tayco-m02-prepared/v1'||!SHA.test(value.archiveKey)||!value.receipt||
   value.receipt.packageSha256!==value.archiveKey||![value.receipt.payloadDigest,value.receipt.sourceManifestSha256,value.receipt.contractManifestSha256].every(x=>typeof x==='string'&&SHA.test(x))||
   ![value.receipt.packageId,value.receipt.revision,value.receipt.sourceBundleId].every(x=>typeof x==='string'&&x.length>0&&x.length<=300)||
   !Array.isArray(value.documents)||value.documents.length<1||value.documents.length>64||
   !Array.isArray(value.measurements)||value.measurements.length>10000||!Array.isArray(value.boqLines)||value.boqLines.length>10000||
   value.reviewBasis!=='producer_reported_not_independently_approved')return bad();
  for(const d of value.documents)if(!d||!ID.test(d.contextKey)||!ID.test(d.documentId)||!SHA.test(d.pdfSha256))return bad();
  for(const m of value.measurements)if(!m||!SHA.test(m.pdfSha256)||typeof m.stableId!=='string'||!/^m02_[a-f0-9]{32}$/.test(m.stableId)||
   !(m.quantity===null||typeof m.quantity==='string'&&m.quantity.length<=1024)||!Number.isSafeInteger(m.pageNumber)||m.pageNumber<1||
   !['verified','candidate','pending','conflicting','rejected','superseded'].includes(m.reviewStatus)||
   ['pending','conflicting'].includes(m.reviewStatus)&&m.quantity!==null)return bad();
  for(const line of value.boqLines)if(!line||!(line.quantity===null||typeof line.quantity==='string')||
   !(line.rate===null||typeof line.rate==='string')||!Array.isArray(line.measurementRefs))return bad();
  return value;
 }catch{return bad();}
}
function configured(name:string){const value=process.env[name];if(!value||!path.isAbsolute(value))return bad();return value;}
async function runPreparation(packagePath:string,archive:boolean):Promise<string>{
 const intake=realpathSync(/* turbopackIgnore: true */ configured('TAYCO_M02_INTAKE_ROOT'));
 if(!path.isAbsolute(packagePath)||lstatSync(packagePath).isSymbolicLink())return bad();
 const file=realpathSync(/* turbopackIgnore: true */ packagePath),relative=path.relative(intake,file);
 if(relative.startsWith('..')||path.isAbsolute(relative)||!statSync(file).isFile())return bad();
 const manifest=process.env.TAYCO_M02_SOURCE_MANIFEST_SHA256;if(!manifest||!SHA.test(manifest))return bad();
 const args=['-B',path.join(process.cwd(),'scripts',archive?'prepare_m02.py':'inspect_m02.py'),'--package',file,
  '--contract-root',configured('TAYCO_M02_CONTRACT_ROOT'),'--bundle-root',configured('TAYCO_M02_BUNDLE_ROOT'),
  '--manifest-sha256',manifest,...(archive?['--archive-root',configured('TAYCO_M02_ARCHIVE_ROOT')]:[])];
 const raw=await new Promise<string>((resolve,reject)=>execFile(/* turbopackIgnore: true */ process.env.TAYCO_M02_PYTHON||'python',args,{windowsHide:true,timeout:60000,maxBuffer:16*1024*1024,encoding:'utf8'},(error,stdout)=>error?reject(new M02IntakeError(503,'Measurement preparation did not complete. No ERP receipt was confirmed.')):resolve(stdout)));
 return raw;
}
function operationPlanHash(actor:Actor,receipt:Prepared['receipt'],bindings:Binding[],supersedes?:string){return hash(JSON.stringify([actor.tenantId,actor.id,receipt.packageId,receipt.revision,receipt.payloadDigest,receipt.packageSha256,bindings,supersedes??null]));}
/** Read-only inspection before any archive or receipt mutation. */
export async function planM02(request:Request,packagePath:string,supersedesReceiptId?:string){
 const actor=await requireActor(request);requireRole(actor,['admin']);exactActor(actor,['admin']);
 if(supersedesReceiptId!==undefined&&!/^m02r_[a-f0-9]{64}$/.test(supersedesReceiptId))throw new M02IntakeError(422,'Choose an exact predecessor receipt.');
 let inspected:{documents:DocumentIdentity[];packageSha256:string;packageId:string;revision:string;payloadDigest:string;sourceBundleId:string;sourceManifestSha256:string;contractManifestSha256:string;producerReportedMeasurementStates:Record<string,number>};
 try{inspected=JSON.parse(await runPreparation(packagePath,false));}catch(error){if(error instanceof M02IntakeError)throw error;return bad();}
 if(!inspected||!Array.isArray(inspected.documents)||inspected.documents.length<1||inspected.documents.length>64||![inspected.packageSha256,inspected.payloadDigest,inspected.sourceManifestSha256,inspected.contractManifestSha256].every(v=>typeof v==='string'&&SHA.test(v)))return bad();
 const fresh=exactActor(actor,['admin']);const bindings=bindingsFor(fresh,{documents:inspected.documents,receipt:inspected});
 exactActor(actor,['admin']);return {mode:'inspection' as const,planHash:operationPlanHash(fresh,inspected,bindings,supersedesReceiptId),packageSha256:inspected.packageSha256,payloadDigest:inspected.payloadDigest,packageId:inspected.packageId,revision:inspected.revision,bindings,producerReportedStates:inspected.producerReportedMeasurementStates,operationalRecordsCreated:0,archiveCreated:false,quantityApproval:false};
}
function row(id:string,tenant:string):Entry{
 const item=database().prepare('SELECT * FROM records WHERE id=? AND tenant_id=?').get(id,tenant) as {id:string;kind:Entry['kind'];tenant_id:string;project_id:string;owner_id:string;version:number;created_at:string;updated_at:string;payload:string}|undefined;
 if(!item)return changed();
 const data=JSON.parse(item.payload);
 if(!data||data.deletedAt||data.purgedAt||data.revokedAt||data.purgeState||data.expiresAt&&(!Number.isFinite(Date.parse(String(data.expiresAt)))||Date.parse(String(data.expiresAt))<=Date.now()))return changed();
 return {id:item.id,kind:item.kind,tenantId:item.tenant_id,projectId:item.project_id,ownerId:item.owner_id,version:item.version,createdAt:item.created_at,updatedAt:item.updated_at,data};
}
function bindingsFor(actor:Actor,prepared:Pick<Prepared,'documents'|'receipt'>):Binding[]{
 const scope=viewerScope(actor);
 const relationsPath=process.env.TAYCO_TAKEOFF_RELATIONS_PATH;
 if(!relationsPath||lstatSync(relationsPath).isSymbolicLink()||statSync(relationsPath).size>5*1024*1024)return changed();
 const relationsSha=createHash('sha256').update(readFileSync(relationsPath)).digest('hex');
 const mappingPath=process.env.TAYCO_TAKEOFF_MAPPING_PATH;
 if(!mappingPath||lstatSync(mappingPath).isSymbolicLink()||statSync(mappingPath).size>1024*1024)return changed();
 const config=JSON.parse(readFileSync(mappingPath,'utf8')) as {bundleId:string;relationsSha256:string;mappings:{tenantId:string;projectId:string;contextKey:string;documents:{viewerDocumentId:string;erpDocumentId:string}[]}[]};
 if(config.bundleId!==scope.bundleId||config.relationsSha256!==relationsSha||!Array.isArray(config.mappings))return changed();
 const bindings=new Map<string,Binding>();
 for(const source of prepared.documents){
  if(!scope.documents.some(d=>d.id===source.documentId&&d.contextKey===source.contextKey))return changed();
  const matching=config.mappings.filter(m=>m.tenantId===actor.tenantId&&m.contextKey===source.contextKey).flatMap(m=>m.documents.filter(d=>d.viewerDocumentId===source.documentId).map(d=>({projectId:m.projectId,erpDocumentId:d.erpDocumentId})));
  if(matching.length!==1)return changed();
  const document=row(matching[0].erpDocumentId,actor.tenantId),d=document.data;
  const project=row(matching[0].projectId,actor.tenantId);
  if(document.kind!=='document'||document.projectId!==project.id||project.kind!=='project'||project.projectId!==project.id||d.storage!=='takeoff_viewer'||d.viewerDocumentId!==source.documentId||
   d.status!=='approved'||d.sourceKind!=='drawing_pdf'||d.contentType!=='application/pdf'||
   d.sourceSha256!==source.pdfSha256||d.contextKey!==source.contextKey||
   project.data.sourceContextKey!==undefined&&project.data.sourceContextKey!==source.contextKey||
   d.bundleId!==scope.bundleId||d.manifestSha256!==scope.manifestSha256||d.relationsId!==scope.relationsId||d.relationsSha256!==relationsSha)return changed();
  const original=(d.registeredSourceIdentity??d) as Record<string,unknown>;
  if(original.bundleId!==prepared.receipt.sourceBundleId||original.manifestSha256!==prepared.receipt.sourceManifestSha256||(original.contextKey!==undefined&&original.contextKey!==source.contextKey))return changed();
  const binding={contextKey:source.contextKey,viewerDocumentId:source.documentId,pdfSha256:source.pdfSha256,erpDocumentId:document.id,projectId:project.id};
  const key=JSON.stringify([source.contextKey,source.documentId]);if(bindings.has(key)&&JSON.stringify(bindings.get(key))!==JSON.stringify(binding))return changed();bindings.set(key,binding);
 }
 return [...bindings.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
function summary(prepared:Prepared){
 const byState:Record<string,number>={},prices:Record<string,number>={};
 for(const m of prepared.measurements)byState[m.reviewStatus]=(byState[m.reviewStatus]??0)+1;
 for(const line of prepared.boqLines)prices[line.pricingState]=(prices[line.pricingState]??0)+1;
 return {measurementCount:prepared.measurements.length,producerReportedStates:byState,boqLineCount:prepared.boqLines.length,producerReportedPricingStates:prices,reviewBasis:prepared.reviewBasis};
}
/** Private operator entry. No HTTP endpoint accepts a package path or caller-authored receipt. */
export async function receiveM02(request:Request,packagePath:string,expectedPlanHash:string,supersedesReceiptId?:string){
 const actor=await requireActor(request);requireRole(actor,['admin']);exactActor(actor,['admin']);
 if(typeof expectedPlanHash!=='string'||!SHA.test(expectedPlanHash))throw new M02IntakeError(422,'Review an exact inspection plan before receiving.');
 const plan=await planM02(request,packagePath,supersedesReceiptId);if(plan.planHash!==expectedPlanHash)return changed();
 const prepared=preparedOf(await runPreparation(packagePath,true));exactActor(actor,['admin']);
 if(prepared.receipt.packageSha256!==plan.packageSha256)return changed();
 if(supersedesReceiptId!==undefined&&!/^m02r_[a-f0-9]{64}$/.test(supersedesReceiptId))throw new M02IntakeError(422,'Choose an exact predecessor receipt.');
 const db=install();db.exec('BEGIN IMMEDIATE');
 try{
  const fresh=exactActor(actor,['admin']),bindings=bindingsFor(fresh,prepared),r=prepared.receipt;
  if(operationPlanHash(fresh,r,bindings,supersedesReceiptId)!==expectedPlanHash)return changed();
  const existing=db.prepare('SELECT * FROM takeoff_measurement_receipts WHERE tenant_id=? AND package_id=? AND revision=?').get(fresh.tenantId,r.packageId,r.revision) as ReceiptRow|undefined;
  if(existing){
   if(existing.payload_digest!==r.payloadDigest||existing.supersedes_id!==(supersedesReceiptId??null))throw new M02IntakeError(409,'This package identity/revision already has a different payload or lineage.');
   if(existing.bindings!==JSON.stringify(bindings))return changed();
   exactActor(actor,['admin']);db.exec('COMMIT');
   return {id:existing.id,replayed:true,created:0,receivedAt:existing.received_at,...JSON.parse(existing.summary)};
  }
  const previous=db.prepare('SELECT id FROM takeoff_measurement_receipts WHERE tenant_id=? AND package_id=? LIMIT 1').get(fresh.tenantId,r.packageId);
  if(Boolean(previous)!==Boolean(supersedesReceiptId))throw new M02IntakeError(409,'A new revision must explicitly supersede the current receipt.');
  if(supersedesReceiptId){
   const parent=db.prepare('SELECT id FROM takeoff_measurement_receipts WHERE id=? AND tenant_id=? AND package_id=?').get(supersedesReceiptId,fresh.tenantId,r.packageId);
   const child=db.prepare('SELECT id FROM takeoff_measurement_receipts WHERE supersedes_id=?').get(supersedesReceiptId);
   if(!parent||child)throw new M02IntakeError(409,'Choose the current receipt in this package lineage.');
  }
  const id='m02r_'+hash(JSON.stringify([fresh.tenantId,r.packageId,r.revision])),at=new Date().toISOString(),reviewSummary=summary(prepared);
  db.prepare('INSERT INTO takeoff_measurement_receipts VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,fresh.tenantId,r.packageId,r.revision,r.payloadDigest,r.packageSha256,prepared.archiveKey,at,fresh.id,supersedesReceiptId??null,JSON.stringify(prepared),JSON.stringify(reviewSummary),JSON.stringify(bindings));
  for(const binding of bindings)db.prepare('INSERT INTO takeoff_measurement_bindings VALUES(?,?,?,?,?,?)').run(id,fresh.tenantId,binding.projectId,binding.erpDocumentId,binding.contextKey,binding.viewerDocumentId);
  db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(),fresh.tenantId,fresh.id,'measurement_package.received',id,at);
  exactActor(actor,['admin']);if(JSON.stringify(bindingsFor(fresh,prepared))!==JSON.stringify(bindings))return changed();
  db.exec('COMMIT');
  return {id,replayed:false,created:prepared.measurements.length,receivedAt:at,...reviewSummary};
 }catch(error){db.exec('ROLLBACK');throw error;}
}
export async function measurementReview(request:Request,projectId:string){
 const actor=await requireActor(request);requireRole(actor,['admin','staff']);const fresh=exactActor(actor,['admin','staff']);
 if(!ID.test(projectId))throw new M02IntakeError(422,'Select an existing project.');
 const project=row(projectId,fresh.tenantId);if(project.kind!=='project')return changed();
 const db=install();
 const rows=db.prepare(`SELECT r.* FROM takeoff_measurement_receipts r WHERE r.tenant_id=? AND EXISTS(
 SELECT 1 FROM takeoff_measurement_bindings b WHERE b.receipt_id=r.id AND b.tenant_id=? AND b.project_id=?) ORDER BY r.received_at DESC,r.id LIMIT 21`).all(fresh.tenantId,fresh.tenantId,projectId) as ReceiptRow[];
 const receipts=rows.slice(0,20).map(receipt=>{
  if(receipt.projection.length>16*1024*1024)return bad();
  const prepared=preparedOf(receipt.projection);
  const projectBindings=(JSON.parse(receipt.bindings) as Binding[]).filter(b=>b.projectId===projectId);
  const documents=prepared.documents.filter(d=>projectBindings.some(b=>b.contextKey===d.contextKey&&b.viewerDocumentId===d.documentId));
  const actual=bindingsFor(fresh,{documents,receipt:prepared.receipt});
  if(JSON.stringify(actual)!==JSON.stringify(projectBindings))return changed();
  const measurements=prepared.measurements.filter(m=>documents.some(d=>d.contextKey===m.contextKey&&d.documentId===m.documentId));
  const measurementIds=new Set(measurements.map(m=>m.stableId));
  const lines=prepared.boqLines.filter(line=>line.measurementRefs.length>0&&line.measurementRefs.every(ref=>measurementIds.has(ref.stableId)));
  const current=!db.prepare('SELECT id FROM takeoff_measurement_receipts WHERE supersedes_id=? AND tenant_id=?').get(receipt.id,fresh.tenantId);
  return {id:receipt.id,packageId:receipt.package_id,revision:receipt.revision,receivedAt:receipt.received_at,current,supersedesId:receipt.supersedes_id,summary:JSON.parse(receipt.summary),measurements:measurements.slice(0,200).map(m=>({...m,documentHref:'/api/documents/'+encodeURIComponent(projectBindings.find(b=>b.contextKey===m.contextKey&&b.viewerDocumentId===m.documentId)!.erpDocumentId)})),measurementCount:measurements.length,boqLines:lines.slice(0,200),boqLineCount:lines.length,partial:measurements.length>200||lines.length>200};
 });
 exactActor(actor,['admin','staff']);
 return {projectId,name:String(project.data.name??'Project'),asOf:new Date().toISOString(),receipts,partial:rows.length>20,reviewBasis:'Producer reported quantities and price evidence; not independent approval, an approved estimate or a contract.'};
}
