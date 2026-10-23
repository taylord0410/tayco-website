import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { isValidUsdAmount } from './financial-values';
import { isFinancialDate } from './financial-periods';
import { parseProjectEstimate } from './project-estimates';
import { isForecastPercentage } from './financial-forecast';
import { CLASSIFICATION_HISTORY_LIMIT, COMPLIANCE_CATEGORY_OPTIONS, parseProjectClassificationInput, type ProjectClassification } from './project-classification';
import { listAssignableStaff, validateAssignableStaff, type Actor } from './auth';

export type Kind = 'project' | 'lead' | 'vendor' | 'document' | 'hours' | 'invoice' | 'note' | 'change' | 'bid' | 'purchase_order' | 'compliance' | 'estimate' | 'proposal' | 'corporate_meeting' | 'followup';
export type Data = Record<string, unknown>;
export type Entry = { id: string; kind: Kind; tenantId: string; projectId: string; ownerId: string; version: number; createdAt: string; updatedAt: string; data: Data };
type Row = { id: string; kind: Kind; tenant_id: string; project_id: string; owner_id: string; version: number; created_at: string; updated_at: string; payload: string };
export class ErpError extends Error { constructor(public status: number, message: string) { super(message); } }
const connections = new Map<string, DatabaseSync>();
export function database() {
  const file = process.env.TAYCO_ERP_DB_PATH || path.join(process.cwd(), '.data', 'tayco-erp.sqlite');
  if (connections.has(file)) return connections.get(file)!;
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,tenant_id TEXT NOT NULL,project_id TEXT NOT NULL DEFAULT '',owner_id TEXT NOT NULL DEFAULT '',payload TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS scoped_records ON records(tenant_id,kind,project_id);
    CREATE TABLE IF NOT EXISTS commands(tenant_id TEXT,actor_id TEXT,key TEXT,hash TEXT,result TEXT,PRIMARY KEY(tenant_id,actor_id,key));
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,tenant_id TEXT,actor_id TEXT,action TEXT,resource_id TEXT,created_at TEXT);
    CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,tenant_id TEXT,kind TEXT,payload TEXT,status TEXT DEFAULT 'pending',attempts INTEGER DEFAULT 0,next_attempt_at TEXT,created_at TEXT,last_error TEXT);
    CREATE TABLE IF NOT EXISTS legacy_archive(hash TEXT PRIMARY KEY,payload TEXT NOT NULL,imported_at TEXT NOT NULL);
    PRAGMA user_version=1;`);
  connections.set(file, db); return db;
}
const internal = (a: Actor) => a.role === 'admin' || a.role === 'staff';
function decode(r: Row): Entry { return { id:r.id, kind:r.kind, tenantId:r.tenant_id, projectId:r.project_id, ownerId:r.owner_id, version:r.version, createdAt:r.created_at, updatedAt:r.updated_at, data:JSON.parse(r.payload) }; }
function get(id: string) { const row = database().prepare('SELECT * FROM records WHERE id=?').get(id) as Row | undefined; return row ? decode(row) : null; }
function requireWorkspaceActor(actor: Actor) {
  if (!['admin', 'staff', 'client', 'vendor'].includes(actor.role)) throw new ErpError(403, 'This account can only view completed-month summaries.');
}
function allowed(actor: Actor, entry: Entry) {
  if (!['admin', 'staff', 'client', 'vendor'].includes(actor.role) || entry.tenantId !== actor.tenantId) return false;
  if (internal(actor)) return true;
  if(entry.kind==='compliance'||entry.kind==='estimate'||entry.kind==='proposal'||entry.kind==='corporate_meeting'||entry.kind==='followup')return false;
  if(entry.kind==='bid'||entry.kind==='purchase_order')return actor.role==='vendor'&&actor.projectIds.includes(entry.projectId)&&(entry.ownerId===actor.id||Boolean(actor.vendorId&&entry.data.vendorId===actor.vendorId));
  if (entry.kind === 'vendor') return entry.id === actor.vendorId || entry.ownerId === actor.id;
  if (entry.kind === 'document') return entry.ownerId === actor.id || (actor.role === 'client' && actor.projectIds.includes(entry.projectId) && entry.data.visibility === 'client');
  if (entry.kind === 'hours') return actor.role === 'vendor' && entry.ownerId === actor.id;
  if (entry.kind === 'invoice') return actor.role === 'vendor' ? entry.ownerId === actor.id : actor.projectIds.includes(entry.projectId) && entry.data.audience === 'client';
  if (entry.kind === 'change') return actor.role === 'client' && actor.projectIds.includes(entry.projectId);
  if (entry.kind === 'note') return actor.role === 'vendor' ? entry.ownerId === actor.id : actor.projectIds.includes(entry.projectId) && entry.data.visibility === 'client';
  return entry.kind === 'project' && actor.projectIds.includes(entry.projectId);
}
function requireEntry(actor: Actor, id: string, kind?: Kind) {
  const item = get(id);
  if (!item || (kind && item.kind !== kind) || !allowed(actor, item)) throw new ErpError(404, 'Record not found.');
  return item;
}
function requireInternal(actor: Actor) { if (!internal(actor)) throw new ErpError(403, 'This action requires a TAYCO team member.'); }
function projectClassification(actor:Actor,input:Data,previous?:unknown):ProjectClassification {
  let fields;
  try { fields=parseProjectClassificationInput(input); }
  catch(error) { throw new ErpError(422,error instanceof Error?error.message:'Check project classification.'); }
  const prior=previous&&typeof previous==='object'&&!Array.isArray(previous)?previous as Data:{};
  const history=prior.history??[];
  if(!Array.isArray(history)||history.some(item=>!item||typeof item!=='object'||Array.isArray(item)))throw new ErpError(409,'Classification history needs operator review before another change.');
  if(history.length>=CLASSIFICATION_HISTORY_LIMIT)throw new ErpError(422,'Review project classification history before another change.');
  const unknown=fields.contractType==='unknown'&&fields.fundingType==='unknown'&&fields.laborRegime==='unknown'&&!fields.jurisdiction&&!fields.source;
  if(previous===undefined&&unknown)return {...fields,reviewedAt:null,reviewedBy:null,history:[]};
  const review={...fields,reviewedAt:new Date().toISOString(),reviewedBy:actor.id};
  return {...review,history:[...history,review] as ProjectClassification['history']};
}
function text(v: unknown, label: string, max=500, required=true) {
  if (typeof v !== 'string' || (required && !v.trim()) || v.length > max) throw new ErpError(422, `Check ${label}.`);
  return v.trim();
}
function number(v: unknown, label: string, min: number, max: number) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new ErpError(422, `Check ${label}.`);
  return v;
}
function currencyAmount(v:unknown,label:string) {
 const amount=number(v,label,0,1e10),nearest=Math.round(amount*100);
 if(!isValidUsdAmount(amount))throw new ErpError(422,'Use at most two decimal places for '+label+'.');
 return nearest/100;
}
function choice(v: unknown, values: string[]) { if (typeof v !== 'string' || !values.includes(v)) throw new ErpError(422, 'Choose a valid status.'); return v; }
function calendarDate(v:unknown,label:string,optional=false) {
 const value=text(v??'',label,10,!optional);if(optional&&!value)return '';
 const date=new Date(value+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw new ErpError(422,'Use a valid calendar date for '+label+'.');
 return value;
}
function occurredDate(v:unknown,label:string) {const value=calendarDate(v,label);if(value>new Date().toISOString().slice(0,10))throw new ErpError(422,label+' cannot be in the future.');return value;}
type Payment = {id:string;amountUsd:number;occurredOn:string;reference:string;recordedAt:string;voidedAt?:string;voidReason?:string};
function invoicePayments(item:Entry):Payment[] {
 if(item.data.payments===undefined)return [];
 const payments=item.data.payments,ids=new Set<string>(),today=new Date().toISOString().slice(0,10);
 const timestamp=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&isFinancialDate(v.slice(0,10))&&Number.isFinite(Date.parse(v));
 if(!Array.isArray(payments)||payments.some(p=>{
   if(!p||typeof p!=='object'||!isValidUsdAmount(p.amountUsd)||p.amountUsd<=0||typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.reference!=='string'||!p.reference.trim()||!isFinancialDate(p.occurredOn)||p.occurredOn>today||!timestamp(p.recordedAt)||p.voidedAt!==undefined&&(!timestamp(p.voidedAt)||typeof p.voidReason!=='string'||!p.voidReason.trim()))return true;
   ids.add(p.id);return typeof item.data.issuedOn==='string'&&p.occurredOn<item.data.issuedOn;
 }))throw new ErpError(409,'Payment history needs operator review before another change.');
 return payments as Payment[];
}
function addInvoicePayment(actor:Actor,item:Entry,input:Data) {
 if(!Number.isInteger(input.version)||input.version!==item.version)throw new ErpError(409,'This invoice changed. Refresh and review its current version.');
 if(!['approved','paid'].includes(String(item.data.status)))throw new ErpError(409,'Approve the invoice before recording a payment.');
 if(!isValidUsdAmount(item.data.amountUsd))throw new ErpError(409,'Invoice amount needs review.');
 const payments=invoicePayments(item),cents=Math.round(currencyAmount(input.amountUsd,'payment amount')*100),paid=payments.filter(p=>!p.voidedAt).reduce((sum,p)=>sum+Math.round(p.amountUsd*100),0),total=Math.round(item.data.amountUsd*100);
 if(cents<=0||paid+cents>total)throw new ErpError(422,'Payment must be positive and cannot exceed the recorded outstanding amount.');
 const occurredOn=occurredDate(input.occurredOn,'Payment date'),reference=text(input.reference,'payment reference',200);
 if(typeof item.data.issuedOn==='string'&&occurredOn<item.data.issuedOn)throw new ErpError(422,'A payment date cannot precede the invoice issue date.');
 if(payments.length>=1000)throw new ErpError(422,'This payment history requires operator review before adding records.');
 if(payments.some(p=>!p.voidedAt&&p.reference.toLowerCase()===reference.toLowerCase()))throw new ErpError(409,'This payment reference is already recorded for the invoice.');
 const payment:Payment={id:randomUUID(),amountUsd:cents/100,occurredOn,reference,recordedAt:new Date().toISOString()};
 return update(actor,item,{payments:[...payments,payment],status:paid+cents===total?'paid':'approved'},input.version);
}
function create(actor: Actor, kind: Kind, data: Data, projectId='', ownerId=actor.id): Entry {
  const id = randomUUID(), at = new Date().toISOString();
  if (kind === 'project') projectId = id;
  database().prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(id,kind,actor.tenantId,projectId,ownerId,JSON.stringify(data),at,at);
  audit(actor, `create_${kind}`, id); return get(id)!;
}
function audit(actor: Actor, action: string, id: string) { database().prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(),actor.tenantId,actor.id,action,id,new Date().toISOString()); }
function update(actor: Actor, entry: Entry, data: Data, expected: unknown) {
  if (!Number.isInteger(expected) || expected !== entry.version) throw new ErpError(409, 'This record changed. Refresh and review the latest version.');
  const changed = database().prepare('UPDATE records SET payload=?,version=version+1,updated_at=? WHERE id=? AND tenant_id=? AND version=?').run(JSON.stringify({...entry.data,...data}),new Date().toISOString(),entry.id,actor.tenantId,entry.version);
  if (changed.changes !== 1) throw new ErpError(409, 'This record changed. Refresh before retrying.');
  audit(actor,`update_${entry.kind}`,entry.id); return get(entry.id)!;
}
function project(actor: Actor, id: unknown) { return requireEntry(actor,text(id,'project',100),'project'); }
function transact<T>(fn: () => T): T { const db=database();db.exec('BEGIN IMMEDIATE');try {const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;} }
function exposed(actor:Actor,e:Entry):Entry {
 const data={...e.data};delete data.blobPath;
  if(!internal(actor)&&e.kind==='purchase_order')for(const field of ['documentId','sheetRef','sourcingHistory'])delete data[field];
 if(!internal(actor)&&e.kind==='document'){for(const field of ['holdReason','holdChangedBy','deleteReason','deletedBy','purgeLastError','purgeAttempts','purgeLeaseUntil','purgeAttemptedAt','retentionDays','purgeAttemptToken'])delete data[field];}
 if(e.kind==='project'){
   if(!internal(actor)&&data.classification&&typeof data.classification==='object'&&!Array.isArray(data.classification)){const classification={...data.classification as Data};for(const field of ['source','history','reviewedBy'])delete classification[field];data.classification=classification;}
    if(!internal(actor))for(const field of ['teamMembers','forecastPlans','completionEvidence','completionHistory','completionRecordedAt'])delete data[field];
   if(actor.role==='vendor'){for(const field of ['budgetUsd','budgetSource','budgetApprovedOn','budgetUpdatedAt','clientEmail','clientName','clientPhone'])delete data[field];}
   if(!internal(actor)&&Array.isArray(data.contacts))data.contacts=data.contacts.filter(contact=>contact&&typeof contact==='object'&&((contact as Data).visibility==='project'||(actor.role==='client'&&(contact as Data).visibility==='client'))&&(contact as Data).status!=='archived');
 }
 return {...e,data};
}

export type Milestone = {id:string;title:string;dueDate:string;status:'planned'|'active'|'completed'|'cancelled';completedOn:string|null};
function staffAssignment(actor:Actor,id:unknown,previous?:Data) {
 const memberId=text(id??'','responsible team member',100,false);
 if(!memberId)return {assigneeId:null,assigneeEmail:null,assignedAt:null};
 const member=validateAssignableStaff(actor,memberId);
 return {assigneeId:member.id,assigneeEmail:member.email,assignedAt:previous?.assigneeId===member.id&&typeof previous.assignedAt==='string'?previous.assignedAt:new Date().toISOString()};
}
const agendaPriorities=['low','normal','high','urgent'];
function agendaFields(actor:Actor,input:Data,kind:'corporate_meeting'|'followup',previous?:Data):Data {
 const assigneeId=text(input.assigneeId,'responsible team member',100),assignment=staffAssignment(actor,assigneeId,previous);
 const common={title:text(input.title,'agenda title',200),notes:text(input.notes??'','agenda notes',4000,false),priority:choice(input.priority,agendaPriorities),...assignment};
 if(kind==='followup')return {...common,dueDate:calendarDate(input.dueDate,'follow-up due date')};
 const time=text(input.time??'','meeting time',5,false);
 if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new ErpError(422,'Use HH:MM for the meeting time, or leave it empty.');
 return {...common,date:calendarDate(input.date,'meeting date'),time,location:text(input.location??'','meeting location',500,false)};
}
function agendaHistory(actor:Actor,data:Data,action:string,previous?:Data):Data[] {
 const history=previous?.history??[];
 if(!Array.isArray(history)||history.some(item=>!item||typeof item!=='object'))throw new ErpError(409,'Agenda history needs review before another change.');
 if(history.length>=100)throw new ErpError(422,'Review this agenda history before another change.');
 const current={...data};delete current.history;
 return [...history,{...current,action,actorId:actor.id,recordedAt:new Date().toISOString()}];
}
function checkedProjectDates(start:unknown,end:unknown) {
 const plannedStart=calendarDate(start,'project start',true),plannedEnd=calendarDate(end,'project completion',true);
 if(Boolean(plannedStart)!==Boolean(plannedEnd))throw new ErpError(422,'Set both project dates or leave both empty.');
 if(plannedStart&&plannedStart>plannedEnd)throw new ErpError(422,'Project completion must be on or after its start.');
 return {plannedStart,plannedEnd};
}
function milestones(item:Entry):Milestone[] {return Array.isArray(item.data.milestones)?item.data.milestones as Milestone[]:[];}
function withinSchedule(item:Entry,dueDate:string) {
 const start=String(item.data.plannedStart||''),end=String(item.data.plannedEnd||'');
 if((start&&dueDate<start)||(end&&dueDate>end))throw new ErpError(422,'Milestone dates must fall within the project schedule.');
}
export function financialSummary(actor:Actor, projectId?:string) {
 requireWorkspaceActor(actor);
 if(projectId)project(actor,projectId);
 const scoped=(database().prepare('SELECT * FROM records WHERE tenant_id=? ORDER BY updated_at DESC').all(actor.tenantId) as Row[]).map(decode).filter(entry=>allowed(actor,entry)&&(!projectId||entry.projectId===projectId));
 const buckets={submitted:{count:0,amountUsd:0},approved:{count:0,amountUsd:0},paid:{count:0,amountUsd:0},returned:{count:0,amountUsd:0}};
 let excludedRecords=0,approvedOutstandingCents=0,approvedOutstandingNeedsReviewCount=0;
 for(const entry of scoped.filter(entry=>entry.kind==='invoice')){
   const amount=entry.data.amountUsd,status=entry.data.status;
   if(!isValidUsdAmount(amount)||typeof status!=='string'||!Object.hasOwn(buckets,status)){excludedRecords++;continue;}
   const bucket=buckets[status as keyof typeof buckets],cents=Math.round(amount*100);
   const sum=Math.round(bucket.amountUsd*100)+cents;
   if(!Number.isSafeInteger(sum))throw new ErpError(503,'Financial totals exceed the supported reporting range.');
   bucket.amountUsd=sum/100;bucket.count++;
   if(status==='approved'){
     try{
       const payments=invoicePayments(entry),paid=payments.filter(p=>!p.voidedAt).reduce((n,p)=>n+Math.round(p.amountUsd*100),0);
       if(!Number.isSafeInteger(paid)||paid>cents)throw new Error('Inconsistent recorded payments');
       const outstanding=approvedOutstandingCents+cents-paid;
       if(!Number.isSafeInteger(outstanding))throw new ErpError(503,'Financial totals exceed the supported reporting range.');
       approvedOutstandingCents=outstanding;
     }catch(error){if(error instanceof ErpError&&error.status===503)throw error;approvedOutstandingNeedsReviewCount++;}
   }
 }
 const projects=actor.role==='vendor'?[]:scoped.filter(entry=>entry.kind==='project').map(entry=>({projectId:entry.id,name:String(entry.data.name||'Project'),budgetUsd:isValidUsdAmount(entry.data.budgetUsd)?entry.data.budgetUsd:null,budgetNeedsReview:entry.data.budgetUsd!=null&&!isValidUsdAmount(entry.data.budgetUsd),budgetSource:typeof entry.data.budgetSource==='string'&&entry.data.budgetSource?entry.data.budgetSource:null,budgetApprovedOn:typeof entry.data.budgetApprovedOn==='string'&&entry.data.budgetApprovedOn?entry.data.budgetApprovedOn:null,budgetUpdatedAt:typeof entry.data.budgetUpdatedAt==='string'?entry.data.budgetUpdatedAt:entry.updatedAt}));
 return {currency:'USD' as const,asOf:new Date().toISOString(),source:'Recorded project budgets and invoices',scope:internal(actor)?'company':'assigned',projects,invoices:buckets,approvedOutstandingUsd:approvedOutstandingCents/100,approvedOutstandingNeedsReviewCount,paidRecordedUsd:buckets.paid.amountUsd,recordCount:Object.values(buckets).reduce((sum,bucket)=>sum+bucket.count,0),excludedRecords};
}
export function snapshot(actor: Actor) {
  requireWorkspaceActor(actor);
  const entries=(database().prepare('SELECT * FROM records WHERE tenant_id=? ORDER BY updated_at DESC').all(actor.tenantId) as Row[]).map(decode).filter(e=>allowed(actor,e)&&!(e.kind==='document'&&(e.data.deletedAt||e.data.purgedAt))).map(e=>exposed(actor,e));
  return { actor:{id:actor.id,email:actor.email,role:actor.role}, entries, updatedAt:new Date().toISOString(), integrations:{takeoff:'not_configured',accounting:'not_configured'},assignees:internal(actor)?listAssignableStaff(actor):[],finance:financialSummary(actor), delivery:internal(actor) ? database().prepare('SELECT status,COUNT(*) AS count FROM outbox WHERE tenant_id=? GROUP BY status').all(actor.tenantId).map(row=>({...row})):[], audit:internal(actor)?database().prepare('SELECT action,resource_id,created_at FROM audit WHERE tenant_id=? ORDER BY created_at DESC LIMIT 30').all(actor.tenantId).map(row=>({...row})):[] };
}
export function execute(actor: Actor, key: string, input: Data) {
  requireWorkspaceActor(actor);
  if (!/^[\w-]{16,100}$/.test(key)) throw new ErpError(422,'A valid request reference is required.');
  const hash=createHash('sha256').update(JSON.stringify({role:actor.role,projects:[...actor.projectIds].sort(),vendorId:actor.vendorId??null,input})).digest('hex');
  return transact(()=>{
    const previous=database().prepare('SELECT hash,result FROM commands WHERE tenant_id=? AND actor_id=? AND key=?').get(actor.tenantId,actor.id,key) as {hash:string;result:string}|undefined;
    if(previous){if(previous.hash!==hash)throw new ErpError(409,'Request reference already used for different data or access.');const cached=JSON.parse(previous.result) as Entry;requireEntry(actor,cached.id);return exposed(actor,cached);}
    const result=mutate(actor,input);
    database().prepare('INSERT INTO commands VALUES(?,?,?,?,?)').run(actor.tenantId,actor.id,key,hash,JSON.stringify(result));return exposed(actor,result);
  });
}
function mutate(actor: Actor, input: Data): Entry {
  const action=text(input.action,'action',60);
  if(['create_corporate_meeting','create_followup','update_corporate_meeting','update_followup','set_corporate_meeting_state','set_followup_state'].includes(action)) {
    requireInternal(actor);
    const kind=action.includes('corporate_meeting')?'corporate_meeting':'followup';
    if(action.startsWith('create_')) {
      if(input.status!==undefined)throw new ErpError(422,'Use the explicit state action after creating the record.');
      const projectId=text(input.projectId??'','agenda project',100,false);if(projectId)project(actor,projectId);
      const data={...agendaFields(actor,input,kind),status:kind==='corporate_meeting'?'scheduled':'open'};
      return create(actor,kind,{...data,history:agendaHistory(actor,data,action)},projectId);
    }
    const item=requireEntry(actor,text(input.id,'agenda record',100),kind);
    if(input.projectId!==undefined&&input.projectId!==item.projectId)throw new ErpError(422,'Agenda records cannot be moved between projects. Create a separate record with the correct scope.');
    if(action.startsWith('set_')) {
      const states=kind==='corporate_meeting'?['scheduled','completed','cancelled']:['open','in_progress','completed','cancelled'];
      const status=choice(input.status,states);
      if(status===item.data.status)throw new ErpError(409,'This agenda record already has the selected state.');
      const stateReason=text(input.stateReason,'state change note',1000),data:Data={...item.data,status,stateReason};delete data.history;
      const result=update(actor,item,{status,stateReason,history:agendaHistory(actor,data,action,item.data)},input.version);
      audit(actor,action,item.id);return result;
    }
    if(input.status!==undefined)throw new ErpError(422,'Use the explicit state action to change agenda status.');
    const fields=agendaFields(actor,input,kind,item.data),data={...item.data,...fields};delete data.history;
    return update(actor,item,{...fields,history:agendaHistory(actor,data,action,item.data)},input.version);
  }
  if(action==='restore_estimate_project') {
    if(actor.role!=='admin')throw new ErpError(403,'Only an administrator can recover an estimating project.');
    const slug=text(input.sourceProjectSlug,'estimating project',100);if(!/^[a-z0-9_]+$/.test(slug))throw new ErpError(422,'Invalid estimating project reference.');
    const existing=(database().prepare("SELECT * FROM records WHERE tenant_id=? AND kind='project'").all(actor.tenantId) as Row[]).map(decode).find(e=>e.data.sourceProjectSlug===slug);
    if(existing)return existing;
    return create(actor,'project',{name:text(input.name,'project name',200),status:'planning',progress:null,budgetUsd:null,source:'estimate_recovery',sourceProjectSlug:slug,nextAction:'Review the recovered estimate revisions and confirm the project baseline.'});
  }
  if(action==='import_project_estimate') {
    if(actor.role!=='admin')throw new ErpError(403,'Only an administrator can import estimate snapshots.');
    const p=project(actor,input.projectId);let estimate;
    try{estimate=parseProjectEstimate(input.estimate);}catch(error){throw new ErpError(422,error instanceof Error?error.message:'Invalid estimate snapshot.');}
    if(estimate.projectId!==p.id||estimate.sourceProjectSlug!==p.data.sourceProjectSlug)throw new ErpError(422,'Estimate project and source do not match the recovered project.');
    const previous=(database().prepare("SELECT * FROM records WHERE tenant_id=? AND kind='estimate' AND project_id=?").all(actor.tenantId,p.id) as Row[]).map(decode).find(e=>e.data.id===estimate.id||e.data.sourceSha256===estimate.sourceSha256);
    if(previous){
      const prior=parseProjectEstimate(previous.data);
      if(JSON.stringify({...prior,capturedAt:''})!==JSON.stringify({...estimate,capturedAt:''}))throw new ErpError(409,'This estimate source is already archived with different values. Import a distinct revision.');
      return previous;
    }
    return create(actor,'estimate',{...estimate},p.id);
  }
  if(action==='create_project') {
    requireInternal(actor);
    const budgetUsd=input.budgetUsd==null?null:currencyAmount(input.budgetUsd,'approved budget');
    const budgetSource=budgetUsd===null?'':text(input.budgetSource,'budget approval source',500);
    const budgetApprovedOn=budgetUsd===null?'':calendarDate(input.budgetApprovedOn,'budget approval date');
    if(budgetApprovedOn&&budgetApprovedOn>new Date().toISOString().slice(0,10))throw new ErpError(422,'A budget approval date cannot be in the future.');
    return create(actor,'project',{name:text(input.name,'project name',160),location:text(input.location??'','location',200,false),clientName:text(input.clientName??'','client name',160,false),status:'planning',progress:null,budgetUsd,budgetSource,budgetApprovedOn,...(budgetUsd===null?{}:{budgetUpdatedAt:new Date().toISOString()}),nextAction:text(input.nextAction??'','next action',500,false),source:'team',classification:projectClassification(actor,input)});
  }
  if(action==='create_lead') {requireInternal(actor);return create(actor,'lead',{name:text(input.name,'name',160),email:text(input.email,'email',254),details:text(input.details,'project details',4000),status:'new',source:'team',...staffAssignment(actor,input.assigneeId)});}
  if(action==='create_proposal') {
    requireInternal(actor);const p=project(actor,input.projectId),reference=text(input.reference,'proposal reference',100),issuedOn=occurredDate(input.issuedOn,'Proposal issue date'),validUntil=calendarDate(input.validUntil,'proposal validity',true);
    if(validUntil&&validUntil<issuedOn)throw new ErpError(422,'Proposal validity cannot precede its issue date.');
    const duplicate=(database().prepare("SELECT * FROM records WHERE tenant_id=? AND kind='proposal'").all(actor.tenantId) as Row[]).map(decode).some(e=>String(e.data.reference).toLowerCase()===reference.toLowerCase());
    if(duplicate)throw new ErpError(409,'This proposal reference is already recorded. Review the existing proposal.');
    return create(actor,'proposal',{title:text(input.title,'proposal title',200),reference,clientName:text(input.clientName,'client name',160),amountUsd:currencyAmount(input.amountUsd,'proposal amount'),currency:'USD',source:text(input.source,'proposal source',1000),issuedOn,validUntil:validUntil||null,status:'draft',sentOn:null,decidedOn:null,evidence:null},p.id);
  }
  if(action==='send_proposal') {
    requireInternal(actor);const item=requireEntry(actor,text(input.id,'proposal',100),'proposal'),sentOn=occurredDate(input.sentOn??new Date().toISOString().slice(0,10),'Proposal sending date');
    if(item.data.status!=='draft')throw new ErpError(409,'Only a draft proposal can be marked as sent.');
    if(typeof item.data.issuedOn!=='string'||sentOn<item.data.issuedOn)throw new ErpError(422,'Sending cannot precede the proposal issue date.');
    if(typeof item.data.validUntil==='string'&&item.data.validUntil<sentOn)throw new ErpError(409,'This proposal expired before the sending date. Record a new dated proposal.');
    return update(actor,item,{status:'sent',sentOn},input.version);
  }
  if(action==='decide_proposal') {
    requireInternal(actor);const item=requireEntry(actor,text(input.id,'proposal',100),'proposal'),status=choice(input.status,['accepted','declined','withdrawn']),decidedOn=occurredDate(input.decidedOn,'Proposal decision date');
    if(item.data.status!=='sent')throw new ErpError(409,'Only a sent proposal can receive a decision.');
    if(typeof item.data.sentOn!=='string'||decidedOn<item.data.sentOn)throw new ErpError(422,'A decision cannot precede the recorded sending date.');
    if(status==='accepted'&&typeof item.data.validUntil==='string'&&decidedOn>item.data.validUntil)throw new ErpError(409,'This proposal expired before the acceptance date. Record a new proposal.');
    return update(actor,item,{status,decidedOn,evidence:text(input.evidence,'decision evidence',2000),decisionRecordedAt:new Date().toISOString()},input.version);
  }
  if(action==='add_project_team_member'||action==='remove_project_team_member') {
    requireInternal(actor);const p=project(actor,input.id),memberId=text(input.memberId,'team member',100),members=(Array.isArray(p.data.teamMembers)?p.data.teamMembers:[]) as Data[];
    if(action==='add_project_team_member'){
      const member=validateAssignableStaff(actor,memberId),assignedOn=occurredDate(input.assignedOn,'Assignment date');
      if(members.some(m=>m.memberId===memberId&&!m.removedOn))throw new ErpError(409,'This team member is already assigned to the project.');
      if(members.some(m=>m.memberId===memberId&&typeof m.removedOn==='string'&&assignedOn<m.removedOn))throw new ErpError(422,'A new assignment cannot overlap this member\u0027s previous assignment.');
      if(members.length>=200)throw new ErpError(422,'Review the team history before adding more assignments.');
      return update(actor,p,{teamMembers:[...members,{memberId:member.id,email:member.email,responsibility:text(input.responsibility,'project responsibility',160),assignedOn,removedOn:null}]},input.version);
    }
    const active=members.find(m=>m.memberId===memberId&&!m.removedOn),removedOn=occurredDate(input.removedOn,'Assignment end date');
    if(!active)throw new ErpError(404,'Active project assignment not found.');
    if(typeof active.assignedOn!=='string'||removedOn<active.assignedOn)throw new ErpError(422,'An assignment cannot end before it starts.');
    return update(actor,p,{teamMembers:members.map(m=>m===active?{...m,removedOn}:m)},input.version);
  }
  if(action==='update_lead') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'lead');return update(actor,item,{status:choice(input.status,['new','reviewing','waiting','quoted','accepted','closed']),nextAction:text(input.nextAction??'','next action',500,false),...(input.assigneeId!==undefined?staffAssignment(actor,input.assigneeId,item.data):{})},input.version);}
  if(action==='update_project') {requireInternal(actor);const item=project(actor,input.id),status=choice(input.status,['planning','active','blocked','handover','closed']);return update(actor,item,{status,progress:input.progress===null?null:number(input.progress,'progress',0,100),nextAction:text(input.nextAction,'next action',500),...(status!=='closed'&&item.data.completedOn?{completedOn:null,completionEvidence:null}: {})},input.version);}
  if(action==='record_project_completion') {
    requireInternal(actor);const item=project(actor,input.id);
    if(item.data.status!=='closed')throw new ErpError(409,'Close the project state before recording its actual completion date.');
    const completedOn=occurredDate(input.completedOn,'Actual completion date'),evidence=text(input.evidence,'completion evidence',2000),at=new Date().toISOString(),history=(Array.isArray(item.data.completionHistory)?item.data.completionHistory:[]) as Data[];
    if(history.length>=100)throw new ErpError(422,'Review completion history before recording another correction.');
    return update(actor,item,{completedOn,completionEvidence:evidence,completionRecordedAt:at,completionHistory:[...history,{completedOn,evidence,recordedAt:at,actorId:actor.id}]},input.version);
  }
  if(action==='record_project_forecast') {
    requireInternal(actor);const item=project(actor,input.id),plans=(Array.isArray(item.data.forecastPlans)?item.data.forecastPlans:[]) as Data[],direction=choice(input.direction,['client_collection','vendor_payment','internal_cost']),linkedInvoiceId=text(input.linkedInvoiceId??'','linked invoice',100,false),amountUsd=currencyAmount(input.amountUsd,'planned amount');
    if(amountUsd<=0)throw new ErpError(422,'A planned amount must be greater than zero.');
    if(plans.length>=300)throw new ErpError(422,'Review the planning history before adding more sources.');
    if(linkedInvoiceId){
      if(direction==='internal_cost')throw new ErpError(422,'Internal invoice visibility does not establish a cost direction. Use a separate source-backed internal cost plan.');
      const invoice=requireEntry(actor,linkedInvoiceId,'invoice'),audience={client_collection:'client',vendor_payment:'vendor',internal_cost:'internal'}[direction];
      if(invoice.projectId!==item.id||invoice.data.audience!==audience)throw new ErpError(422,'The invoice must belong to this project and planning direction.');
      if(!isValidUsdAmount(invoice.data.amountUsd)||amountUsd>invoice.data.amountUsd)throw new ErpError(422,'A linked plan cannot exceed the invoice amount.');
      if(plans.some(p=>p.status==='planned'&&p.linkedInvoiceId===linkedInvoiceId))throw new ErpError(409,'This invoice is already linked to an active plan.');
    }
    const plan={id:randomUUID(),title:text(input.title,'planning title',200),direction,amountUsd,dueOn:calendarDate(input.dueOn,'planned date'),source:text(input.source,'planning source',1000),linkedInvoiceId:linkedInvoiceId||null,status:'planned',createdAt:new Date().toISOString()};
    return update(actor,item,{forecastPlans:[...plans,plan]},input.version);
  }
  if(action==='cancel_project_forecast') {
    requireInternal(actor);const item=project(actor,input.id),plans=(Array.isArray(item.data.forecastPlans)?item.data.forecastPlans:[]) as Data[],id=text(input.forecastId,'plan',100),old=plans.find(p=>p.id===id);
    if(!old)throw new ErpError(404,'Planning source not found.');
    if(old.status!=='planned')throw new ErpError(409,'This planning source is already cancelled.');
    const cancelReason=text(input.cancelReason,'cancellation reason',1000),cancelledAt=new Date().toISOString();
    return update(actor,item,{forecastPlans:plans.map(p=>p.id===id?{...p,status:'cancelled',cancelReason,cancelledAt}:p)},input.version);
  }
  if(action==='set_proposal_forecast'||action==='clear_proposal_forecast') {
    requireInternal(actor);const item=requireEntry(actor,text(input.id,'proposal',100),'proposal');
    if(!['draft','sent'].includes(String(item.data.status)))throw new ErpError(409,'Only a draft or pending sent proposal can change its forecasting assumptions.');
    const history=(Array.isArray(item.data.forecastHistory)?item.data.forecastHistory:[]) as Data[],at=new Date().toISOString();
    if(history.length>=100)throw new ErpError(422,'Review this proposal assumption history before another change.');
    if(action==='clear_proposal_forecast')return update(actor,item,{forecast:null,forecastHistory:[...history,{forecast:null,reason:text(input.reason,'removal reason',1000),recordedAt:at,actorId:actor.id}]},input.version);
    const expectedBillingOn=calendarDate(input.expectedBillingOn,'expected billing date');
    if(typeof item.data.issuedOn==='string'&&expectedBillingOn<item.data.issuedOn)throw new ErpError(422,'Expected billing cannot precede the proposal issue date.');
    if(item.data.status==='sent'&&typeof item.data.sentOn==='string'&&expectedBillingOn<item.data.sentOn)throw new ErpError(422,'Expected billing cannot precede the recorded sending date.');
    if(!isForecastPercentage(input.probabilityPercent)||!isForecastPercentage(input.allocationPercent))throw new ErpError(422,'Use a percentage from 0 to 100 with at most two decimals.');
    const forecast={expectedBillingOn,probabilityPercent:input.probabilityPercent,allocationPercent:input.allocationPercent,source:text(input.source,'forecast assumption source',1000),updatedAt:at};
    return update(actor,item,{forecast,forecastHistory:[...history,{forecast,recordedAt:at,actorId:actor.id}]},input.version);
  }
  if(action==='update_lead_details') {
    requireInternal(actor);const item=requireEntry(actor,text(input.id,'request',100),'lead'),estimatedValueUsd=input.estimatedValueUsd==null?null:currencyAmount(input.estimatedValueUsd,'estimated opportunity value');
    return update(actor,item,{location:text(input.location??'','location',200,false),estimatedValueUsd,estimateSource:estimatedValueUsd===null?null:text(input.estimateSource,'estimate source',1000)},input.version);
  }
  if(action==='update_project_classification') {
    requireInternal(actor);const item=project(actor,input.id);
    return update(actor,item,{classification:projectClassification(actor,input,item.data.classification??{})},input.version);
  }
  if(action==='update_project_details') {
   requireInternal(actor);const item=project(actor,input.id);
   const budgetUsd=input.budgetUsd==null?null:currencyAmount(input.budgetUsd,'approved budget');
   const budgetSource=budgetUsd===null?'':text(input.budgetSource,'budget approval source',500);
   const budgetApprovedOn=budgetUsd===null?'':calendarDate(input.budgetApprovedOn,'budget approval date');
   if(budgetApprovedOn&&budgetApprovedOn>new Date().toISOString().slice(0,10))throw new ErpError(422,'A budget approval date cannot be in the future.');
   return update(actor,item,{name:text(input.name,'project name',160),location:text(input.location??'','location',200,false),clientName:text(input.clientName??'','client name',160,false),budgetUsd,budgetSource,budgetApprovedOn,budgetUpdatedAt:new Date().toISOString()},input.version);
  }
  if(action==='set_project_schedule') {
   requireInternal(actor);const item=project(actor,input.id),dates=checkedProjectDates(input.plannedStart,input.plannedEnd);
   if(dates.plannedStart&&milestones(item).some(m=>m.status!=='cancelled'&&(m.dueDate<dates.plannedStart||m.dueDate>dates.plannedEnd)))throw new ErpError(422,'Review existing milestone dates before narrowing the project schedule.');
   return update(actor,item,dates,input.version);
  }
  if(action==='add_milestone') {
   requireInternal(actor);const item=project(actor,input.id),dueDate=calendarDate(input.dueDate,'milestone due date');withinSchedule(item,dueDate);
   const current=milestones(item);if(current.length>=100)throw new ErpError(422,'A project can have up to 100 milestones. Review its existing milestones.');
   const milestone:Milestone={id:randomUUID(),title:text(input.title,'milestone title',160),dueDate,status:'planned',completedOn:null};
   return update(actor,item,{milestones:[...current,milestone].sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.id.localeCompare(b.id))},input.version);
  }
  if(action==='update_milestone') {
   requireInternal(actor);const item=project(actor,input.id),milestoneId=text(input.milestoneId,'milestone',100),current=milestones(item),old=current.find(m=>m.id===milestoneId);
   if(!old)throw new ErpError(404,'Milestone not found.');
   const dueDate=calendarDate(input.dueDate,'milestone due date'),status=choice(input.status,['planned','active','completed','cancelled']) as Milestone['status'];
   if(status!=='cancelled')withinSchedule(item,dueDate);
   const completedOn=status==='completed'?calendarDate(input.completedOn,'actual completion date'):null;
   if(completedOn&&completedOn>new Date().toISOString().slice(0,10))throw new ErpError(422,'An actual completion date cannot be in the future.');
   return update(actor,item,{milestones:current.map(m=>m.id===milestoneId?{...m,title:text(input.title??old.title,'milestone title',160),dueDate,status,completedOn}:m).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.id.localeCompare(b.id))},input.version);
  }
  if(action==='save_project_contact') {
   requireInternal(actor);const item=project(actor,input.id),contactId=text(input.contactId??'','contact',100,false);
   const current=(Array.isArray(item.data.contacts)?item.data.contacts:[]) as Data[];
   if(contactId&&!current.some(contact=>contact.id===contactId))throw new ErpError(404,'Contact not found.');
   if(!contactId&&current.length>=32)throw new ErpError(422,'Review existing project contacts before adding more.');
   const email=text(input.email??'','contact email',254,false),phone=text(input.phone??'','contact phone',80,false);
   if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ErpError(422,'Enter a valid contact email.');
   if(!email&&!phone)throw new ErpError(422,'Provide a contact email or phone number.');
   const contact={id:contactId||randomUUID(),name:text(input.name,'contact name',160),email,phone,contactRole:text(input.contactRole??'','contact role',160,false),visibility:choice(input.visibility??'internal',['internal','client','project']),status:choice(input.status??'active',['active','archived'])};
   return update(actor,item,{contacts:contactId?current.map(c=>c.id===contactId?contact:c):[...current,contact]},input.version);
  }
  if(action==='add_note') {const p=project(actor,input.projectId);const visibility=internal(actor)?choice(input.visibility??'internal',['internal','client']):actor.role==='client'?'client':'internal';return create(actor,'note',{title:text(input.title,'title',160),details:text(input.details,'update',4000),visibility},p.id);}
  if(action==='request_change') {const p=project(actor,input.projectId);if(actor.role==='vendor')throw new ErpError(403,'Request the project manager to review scope changes.');return create(actor,'change',{title:text(input.title,'title',160),details:text(input.details,'scope change',4000),status:'requested'},p.id);}
  if(action==='review_change') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'change');return update(actor,item,{status:choice(input.status,['reviewing','proposed','declined']),response:text(input.response??'','response',2000,false)},input.version);}
  if(action==='decide_change') {if(actor.role!=='client')throw new ErpError(403,'The assigned client must record this decision.');const item=requireEntry(actor,text(input.id,'record',100),'change');if(item.data.status!=='proposed')throw new ErpError(409,'Only a proposed change can be accepted or declined.');return update(actor,item,{status:choice(input.status,['accepted','declined'])},input.version);}
  if(action==='log_hours') {if(actor.role==='client')throw new ErpError(403,'Not permitted.');const p=project(actor,input.projectId);return create(actor,'hours',{date:calendarDate(input.date,'work date'),hours:number(input.hours,'hours',0.1,24),trade:text(input.trade,'work performed',200),status:'submitted'},p.id);}
  if(action==='review_hours') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'hours');return update(actor,item,{status:choice(input.status,['approved','returned']),response:text(input.response??'','review note',1000,false)},input.version);}
  if(action==='record_invoice') {
   if(actor.role==='client')throw new ErpError(403,'Not permitted.');const p=project(actor,input.projectId),issuedOn=occurredDate(input.issuedOn??new Date().toISOString().slice(0,10),'Invoice issue date'),dueDate=calendarDate(input.dueDate,'due date',true);
   if(dueDate&&dueDate<issuedOn)throw new ErpError(422,'The due date cannot precede the invoice issue date.');
   return create(actor,'invoice',{reference:text(input.reference,'invoice reference',100),amountUsd:currencyAmount(input.amountUsd,'amount'),status:'submitted',audience:actor.role==='vendor'?'vendor':choice(input.audience??'client',['client','internal']),issuedOn,source:text(input.source??'Team record','invoice source',500),dueDate,payments:[]},p.id);
  }
  if(action==='update_invoice') {
   if(actor.role!=='admin')throw new ErpError(403,'Only an administrator can record financial approvals.');const item=requireEntry(actor,text(input.id,'record',100),'invoice'),status=choice(input.status,['approved','paid','returned']);
   if(status==='paid'){
    const paidOn=occurredDate(input.paidOn,'Payment date');
    if(typeof item.data.issuedOn==='string'&&paidOn<item.data.issuedOn)throw new ErpError(422,'A payment date cannot precede the invoice issue date.');
    if(item.data.amountUsd===0)return update(actor,item,{status:'paid',settledOn:paidOn},input.version);
    const existing=invoicePayments(item).filter(p=>!p.voidedAt).reduce((sum,p)=>sum+Math.round(p.amountUsd*100),0);
    return addInvoicePayment(actor,{...item,data:{...item.data,status:'approved'}},{...input,amountUsd:currencyAmount(item.data.amountUsd,'invoice amount')-existing/100,occurredOn:paidOn,reference:input.reference??('Recorded settlement '+item.id)});
   }
   return update(actor,item,{status},input.version);
  }
  if(action==='record_invoice_payment') {if(actor.role!=='admin')throw new ErpError(403,'Only an administrator can record payments.');return addInvoicePayment(actor,requireEntry(actor,text(input.invoiceId,'invoice',100),'invoice'),input);}
  if(action==='void_invoice_payment') {
   if(actor.role!=='admin')throw new ErpError(403,'Only an administrator can correct payments.');const item=requireEntry(actor,text(input.invoiceId,'invoice',100),'invoice'),payments=invoicePayments(item),id=text(input.paymentId,'payment',100),payment=payments.find(p=>p.id===id);
   if(!payment||payment.voidedAt)throw new ErpError(409,'Choose a current payment to correct.');
   const reason=text(input.reason,'correction reason',1000),at=new Date().toISOString();
   return update(actor,item,{payments:payments.map(p=>p.id===id?{...p,voidedAt:at,voidReason:reason}:p),status:item.data.status==='paid'?'approved':item.data.status},input.version);
  }
  if(action==='create_bid') {
   if(actor.role==='client')throw new ErpError(403,'Not permitted.');const p=project(actor,input.projectId);let vendorId='';
   if(actor.role==='vendor'){if(!actor.vendorId)throw new ErpError(403,'A linked provider account is required.');vendorId=actor.vendorId;if(input.vendorId&&input.vendorId!==vendorId)throw new ErpError(403,'Submit only your own offer.');}
   else if(input.vendorId)vendorId=requireEntry(actor,text(input.vendorId,'provider',100),'vendor').id;
   return create(actor,'bid',{supplierName:text(input.supplierName,'supplier name',200),scope:text(input.scope,'scope of work',2000),amountUsd:currencyAmount(input.amountUsd,'bid amount'),issuedOn:occurredDate(input.issuedOn,'Bid date'),source:text(input.source,'offer source',500),vendorId,status:'submitted'},p.id);
  }
  if(action==='review_bid') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'bid',100),'bid');return update(actor,item,{status:choice(input.status,['reviewing','shortlisted','accepted','declined']),response:text(input.response??'','review note',2000,false)},input.version);}
  if(action==='create_purchase_order') {
   requireInternal(actor);const p=project(actor,input.projectId),reference=text(input.reference,'purchase order reference',100),amountUsd=currencyAmount(input.amountUsd,'purchase order amount');
   const duplicate=(database().prepare("SELECT payload FROM records WHERE tenant_id=? AND kind='purchase_order'").all(actor.tenantId) as {payload:string}[]).some(row=>String(JSON.parse(row.payload).reference).toLowerCase()===reference.toLowerCase());
   if(duplicate)throw new ErpError(409,'This purchase order reference already exists in your company.');
   let vendorId=input.vendorId?requireEntry(actor,text(input.vendorId,'provider',100),'vendor').id:'',bidId='';
   if(input.bidId){const bid=requireEntry(actor,text(input.bidId,'accepted bid',100),'bid');if(bid.projectId!==p.id||bid.data.status!=='accepted'||bid.data.amountUsd!==amountUsd||(vendorId&&vendorId!==bid.data.vendorId)||text(input.supplierName,'supplier name',200)!==bid.data.supplierName)throw new ErpError(422,'Use the accepted bid, its project, supplier and amount.');bidId=bid.id;vendorId=String(bid.data.vendorId||'');
    const linked=(database().prepare("SELECT payload FROM records WHERE tenant_id=? AND kind='purchase_order'").all(actor.tenantId) as {payload:string}[]).some(row=>{const data=JSON.parse(row.payload);return data.bidId===bidId&&data.status!=='cancelled';});if(linked)throw new ErpError(409,'An active purchase order already uses this accepted bid.');
   }
   return create(actor,'purchase_order',{reference,supplierName:text(input.supplierName,'supplier name',200),description:text(input.description,'purchase description',4000),amountUsd,issuedOn:occurredDate(input.issuedOn,'Order date'),source:text(input.source,'order source',500),vendorId,bidId,status:'draft'},p.id);
  }
  if(action==='update_purchase_order') {
   requireInternal(actor);const item=requireEntry(actor,text(input.id,'purchase order',100),'purchase_order'),next=choice(input.status,['issued','acknowledged','received','cancelled','closed']);
   const transitions:Record<string,string[]>={draft:['issued','cancelled'],issued:['acknowledged','cancelled'],acknowledged:['received','cancelled'],received:['closed'],closed:[],cancelled:[]};
   if(!transitions[String(item.data.status)]?.includes(next))throw new ErpError(409,'Review the current purchase order stage before this change.');
   return update(actor,item,{status:next},input.version);
  }
  if(action==='update_purchase_order_details') {
    requireInternal(actor);const item=requireEntry(actor,text(input.id,'purchase order',100),'purchase_order');
    if(!['draft','issued','acknowledged'].includes(String(item.data.status)))throw new ErpError(409,'Order sourcing details can change only before receipt or cancellation.');
    const documentId=text(input.documentId??'','source document',100,false),quoteDate=calendarDate(input.quoteDate,'quote date',true),expectedDeliveryOn=calendarDate(input.expectedDeliveryOn,'expected delivery date',true),leadTimeDays=input.leadTimeDays==null?null:number(input.leadTimeDays,'lead time in days',0,3650);
    if(leadTimeDays!==null&&!Number.isInteger(leadTimeDays))throw new ErpError(422,'Lead time must be a whole number of days.');
    if(quoteDate&&quoteDate>new Date().toISOString().slice(0,10))throw new ErpError(422,'A received quote date cannot be in the future.');
    if(leadTimeDays!==null&&!quoteDate)throw new ErpError(422,'Record the quote date when recording its lead time.');
    if(expectedDeliveryOn&&((typeof item.data.issuedOn==='string'&&expectedDeliveryOn<item.data.issuedOn)||(quoteDate&&expectedDeliveryOn<quoteDate)))throw new ErpError(422,'Expected delivery cannot precede the order or quote date.');
    if(documentId){const document=requireEntry(actor,documentId,'document');if(document.projectId!==item.projectId||document.data.type!=='project'||document.data.deletedAt||document.data.purgedAt)throw new ErpError(422,'Use a current project source document from this project.');}
    const details={documentId:documentId||null,sheetRef:text(input.sheetRef??'','drawing sheet reference',120,false),quoteDate:quoteDate||null,leadTimeDays,expectedDeliveryOn:expectedDeliveryOn||null,quoteSource:text(input.quoteSource,'sourcing evidence',1000),recordedAt:new Date().toISOString()},history=(Array.isArray(item.data.sourcingHistory)?item.data.sourcingHistory:[]) as Data[];
    if(history.length>=100)throw new ErpError(422,'Review order sourcing history before another change.');
    return update(actor,item,{...details,sourcingHistory:[...history,details]},input.version);
  }
  if(action==='create_compliance') {requireInternal(actor);const p=project(actor,input.projectId);return create(actor,'compliance',{jurisdiction:text(input.jurisdiction,'jurisdiction',200),category:choice(input.category??'general',COMPLIANCE_CATEGORY_OPTIONS.map(option=>option.value)),authority:text(input.authority??'','requirement authority',200,false),topic:text(input.topic,'requirement to track',1000),source:text(input.source,'requirement source',1000),dueDate:calendarDate(input.dueDate,'review due date',true),status:'pending',evidence:'',reviewedOn:null},p.id);}
  if(action==='review_compliance') {
   requireInternal(actor);const item=requireEntry(actor,text(input.id,'review item',100),'compliance'),status=choice(input.status,['pending','in_review','complete','not_applicable','expired']),evidence=text(input.evidence??'','review evidence',4000,['complete','not_applicable'].includes(status)),reviewedOn=['complete','not_applicable'].includes(status)?occurredDate(input.reviewedOn,'Review date'):null;
   return update(actor,item,{status,evidence,reviewedOn},input.version);
  }
  if(action==='review_document') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'document');if(item.data.deletedAt||item.data.purgedAt)throw new ErpError(409,'This document was deleted. Refresh the document list.');const visibility=choice(input.visibility??'owner',['owner','client']);if(visibility==='client'&&(!item.projectId||item.data.type!=='project'))throw new ErpError(422,'Only project documents can be shared with the assigned client.');return update(actor,item,{status:choice(input.status,['approved','rejected']),response:text(input.response,'review note',1000),expiresAt:calendarDate(input.expiresAt,'expiry',true),visibility},input.version);}
  throw new ErpError(422,'Unknown action.');
}

export function registerDocument(actor:Actor, input:{blobPath:string;name:string;contentType:string;type:string;projectId?:string}) {
  if(!['admin','staff','vendor'].includes(actor.role))throw new ErpError(403,'Document submission is available to the assigned team and providers.');
  const projectId=input.projectId?project(actor,input.projectId).id:'';
  return transact(()=>create(actor,'document',{...input,status:'pending_review',visibility:'owner',expiresAt:null},projectId));
}
export function documentForActor(actor:Actor,id:string) {requireWorkspaceActor(actor);return requireEntry(actor,id,'document');}
export function validateInvitationAssignments(actor:Actor, projectIds:string[], vendorId?:string) {
  if(actor.role!=='admin')throw new ErpError(403,'Only administrators can assign access.');
  for(const id of projectIds)requireEntry(actor,id,'project');
  if(vendorId)requireEntry(actor,vendorId,'vendor');
}
export function validateDocumentProject(actor:Actor,id?:string) {if(id)project(actor,id);}
export function submitWebsite(kind:'estimate'|'investor'|'vendor',payload:Record<string,unknown>,key:string) {
  const actor={id:'website',email:'',role:'staff',tenantId:process.env.TAYCO_PUBLIC_TENANT_ID||'tayco_llc',projectIds:[]} as Actor;
  const hash=createHash('sha256').update(JSON.stringify({kind,payload})).digest('hex');
  if(!/^[\w-]{16,100}$/.test(key))throw new ErpError(422,'Invalid request reference.');
  return transact(()=>{
    const old=database().prepare('SELECT hash,result FROM commands WHERE tenant_id=? AND actor_id=? AND key=?').get(actor.tenantId,actor.id,key) as {hash:string;result:string}|undefined;
    if(old){if(old.hash!==hash)throw new ErpError(409,'Request reference already used.');return JSON.parse(old.result) as Entry;}
    // Preserve submitted fields exactly as validated. Unknown money, tax and document approval remain unknown.
    const item=create(actor,kind==='vendor'?'vendor':'lead',{...payload,kind,status:kind==='vendor'?'pending_review':'new',source:'website',estimatedValueUsd:null,takeoffProjectSlug:null});
    database().prepare('INSERT INTO outbox(id,tenant_id,kind,payload,next_attempt_at,created_at) VALUES(?,?,?,?,?,?)').run(randomUUID(),actor.tenantId,'website_request',JSON.stringify({referenceId:item.id,kind}),item.createdAt,item.createdAt);
    database().prepare('INSERT INTO commands VALUES(?,?,?,?,?)').run(actor.tenantId,actor.id,key,hash,JSON.stringify(item));return item;
  });
}
