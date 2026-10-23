import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { isValidUsdAmount } from './financial-values';
import { isFinancialDate } from './financial-periods';
import { listAssignableStaff, validateAssignableStaff, type Actor } from './auth';

export type Kind = 'project' | 'lead' | 'vendor' | 'document' | 'hours' | 'invoice' | 'note' | 'change' | 'bid' | 'purchase_order' | 'compliance';
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
function allowed(actor: Actor, entry: Entry) {
  if (entry.tenantId !== actor.tenantId) return false;
  if (internal(actor)) return true;
  if(entry.kind==='compliance')return false;
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
 if(!internal(actor)&&e.kind==='document'){for(const field of ['holdReason','holdChangedBy','deleteReason','deletedBy','purgeLastError','purgeAttempts','purgeLeaseUntil','purgeAttemptedAt','retentionDays','purgeAttemptToken'])delete data[field];}
 if(e.kind==='project'){
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
  const entries=(database().prepare('SELECT * FROM records WHERE tenant_id=? ORDER BY updated_at DESC').all(actor.tenantId) as Row[]).map(decode).filter(e=>allowed(actor,e)&&!(e.kind==='document'&&(e.data.deletedAt||e.data.purgedAt))).map(e=>exposed(actor,e));
  return { actor:{id:actor.id,email:actor.email,role:actor.role}, entries, updatedAt:new Date().toISOString(), integrations:{takeoff:'not_configured',accounting:'not_configured'},assignees:internal(actor)?listAssignableStaff(actor):[],finance:financialSummary(actor), delivery:internal(actor) ? database().prepare('SELECT status,COUNT(*) AS count FROM outbox WHERE tenant_id=? GROUP BY status').all(actor.tenantId).map(row=>({...row})):[], audit:internal(actor)?database().prepare('SELECT action,resource_id,created_at FROM audit WHERE tenant_id=? ORDER BY created_at DESC LIMIT 30').all(actor.tenantId).map(row=>({...row})):[] };
}
export function execute(actor: Actor, key: string, input: Data) {
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
  if(action==='create_project') {requireInternal(actor);return create(actor,'project',{name:text(input.name,'project name',160),location:text(input.location??'','location',200,false),clientName:text(input.clientName??'','client name',160,false),status:'planning',progress:0,budgetUsd:input.budgetUsd==null?null:currencyAmount(input.budgetUsd,'approved budget'),nextAction:text(input.nextAction??'Confirm scope and schedule','next action',500),source:'team'});}
  if(action==='create_lead') {requireInternal(actor);return create(actor,'lead',{name:text(input.name,'name',160),email:text(input.email,'email',254),details:text(input.details,'project details',4000),status:'new',source:'team',...staffAssignment(actor,input.assigneeId)});}
  if(action==='update_lead') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'lead');return update(actor,item,{status:choice(input.status,['new','reviewing','waiting','quoted','accepted','closed']),nextAction:text(input.nextAction??'','next action',500,false),...(input.assigneeId!==undefined?staffAssignment(actor,input.assigneeId,item.data):{})},input.version);}
  if(action==='update_project') {requireInternal(actor);const item=project(actor,input.id);return update(actor,item,{status:choice(input.status,['planning','active','blocked','handover','closed']),progress:number(input.progress,'progress',0,100),nextAction:text(input.nextAction,'next action',500)},input.version);}
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
  if(action==='create_compliance') {requireInternal(actor);const p=project(actor,input.projectId);return create(actor,'compliance',{jurisdiction:text(input.jurisdiction,'jurisdiction',200),topic:text(input.topic,'requirement to track',1000),source:text(input.source,'requirement source',1000),dueDate:calendarDate(input.dueDate,'review due date',true),status:'pending',evidence:'',reviewedOn:null},p.id);}
  if(action==='review_compliance') {
   requireInternal(actor);const item=requireEntry(actor,text(input.id,'review item',100),'compliance'),status=choice(input.status,['pending','in_review','complete','not_applicable','expired']),evidence=text(input.evidence??'','review evidence',4000,['complete','not_applicable'].includes(status)),reviewedOn=['complete','not_applicable'].includes(status)?occurredDate(input.reviewedOn,'Review date'):null;
   return update(actor,item,{status,evidence,reviewedOn},input.version);
  }
  if(action==='review_document') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'document');if(item.data.deletedAt||item.data.purgedAt)throw new ErpError(409,'This document was deleted. Refresh the document list.');const visibility=choice(input.visibility??'owner',['owner','client']);if(visibility==='client'&&(!item.projectId||item.data.type!=='project'))throw new ErpError(422,'Only project documents can be shared with the assigned client.');return update(actor,item,{status:choice(input.status,['approved','rejected']),response:text(input.response,'review note',1000),expiresAt:calendarDate(input.expiresAt,'expiry',true),visibility},input.version);}
  throw new ErpError(422,'Unknown action.');
}

export function registerDocument(actor:Actor, input:{blobPath:string;name:string;contentType:string;type:string;projectId?:string}) {
  if(actor.role==='client')throw new ErpError(403,'Document submission is available to the assigned team and providers.');
  const projectId=input.projectId?project(actor,input.projectId).id:'';
  return transact(()=>create(actor,'document',{...input,status:'pending_review',visibility:'owner',expiresAt:null},projectId));
}
export function documentForActor(actor:Actor,id:string) {return requireEntry(actor,id,'document');}
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
