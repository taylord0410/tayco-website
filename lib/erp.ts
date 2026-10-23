import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Actor } from './auth';

export type Kind = 'project' | 'lead' | 'vendor' | 'document' | 'hours' | 'invoice' | 'note' | 'change';
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
function choice(v: unknown, values: string[]) { if (typeof v !== 'string' || !values.includes(v)) throw new ErpError(422, 'Choose a valid status.'); return v; }
function calendarDate(v:unknown,label:string,optional=false) {
 const value=text(v??'',label,10,!optional);if(optional&&!value)return '';
 const date=new Date(value+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw new ErpError(422,'Use a valid calendar date for '+label+'.');
 return value;
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
 if(actor.role==='vendor'&&e.kind==='project'){delete data.budgetUsd;delete data.clientEmail;delete data.clientName;}
 return {...e,data};
}

export function snapshot(actor: Actor) {
  const entries=(database().prepare('SELECT * FROM records WHERE tenant_id=? ORDER BY updated_at DESC').all(actor.tenantId) as Row[]).map(decode).filter(e=>allowed(actor,e)).map(e=>exposed(actor,e));
  return { actor:{id:actor.id,email:actor.email,role:actor.role}, entries, updatedAt:new Date().toISOString(), integrations:{takeoff:'not_configured',accounting:'not_configured'}, delivery:internal(actor) ? database().prepare('SELECT status,COUNT(*) AS count FROM outbox WHERE tenant_id=? GROUP BY status').all(actor.tenantId).map(row=>({...row})):[], audit:internal(actor)?database().prepare('SELECT action,resource_id,created_at FROM audit WHERE tenant_id=? ORDER BY created_at DESC LIMIT 30').all(actor.tenantId).map(row=>({...row})):[] };
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
  if(action==='create_project') {requireInternal(actor);return create(actor,'project',{name:text(input.name,'project name',160),location:text(input.location??'','location',200,false),clientName:text(input.clientName??'','client name',160,false),status:'planning',progress:0,budgetUsd:input.budgetUsd==null?null:number(input.budgetUsd,'approved budget',0,1e10),nextAction:text(input.nextAction??'Confirm scope and schedule','next action',500),source:'team'});}
  if(action==='create_lead') {requireInternal(actor);return create(actor,'lead',{name:text(input.name,'name',160),email:text(input.email,'email',254),details:text(input.details,'project details',4000),status:'new',source:'team'});}
  if(action==='update_lead') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'lead');return update(actor,item,{status:choice(input.status,['new','reviewing','waiting','quoted','accepted','closed']),nextAction:text(input.nextAction??'','next action',500,false)},input.version);}
  if(action==='update_project') {requireInternal(actor);const item=project(actor,input.id);return update(actor,item,{status:choice(input.status,['planning','active','blocked','handover','closed']),progress:number(input.progress,'progress',0,100),nextAction:text(input.nextAction,'next action',500)},input.version);}
  if(action==='add_note') {const p=project(actor,input.projectId);const visibility=internal(actor)?choice(input.visibility??'internal',['internal','client']):actor.role==='client'?'client':'internal';return create(actor,'note',{title:text(input.title,'title',160),details:text(input.details,'update',4000),visibility},p.id);}
  if(action==='request_change') {const p=project(actor,input.projectId);if(actor.role==='vendor')throw new ErpError(403,'Request the project manager to review scope changes.');return create(actor,'change',{title:text(input.title,'title',160),details:text(input.details,'scope change',4000),status:'requested'},p.id);}
  if(action==='review_change') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'change');return update(actor,item,{status:choice(input.status,['reviewing','proposed','declined']),response:text(input.response??'','response',2000,false)},input.version);}
  if(action==='decide_change') {if(actor.role!=='client')throw new ErpError(403,'The assigned client must record this decision.');const item=requireEntry(actor,text(input.id,'record',100),'change');if(item.data.status!=='proposed')throw new ErpError(409,'Only a proposed change can be accepted or declined.');return update(actor,item,{status:choice(input.status,['accepted','declined'])},input.version);}
  if(action==='log_hours') {if(actor.role==='client')throw new ErpError(403,'Not permitted.');const p=project(actor,input.projectId);return create(actor,'hours',{date:calendarDate(input.date,'work date'),hours:number(input.hours,'hours',0.1,24),trade:text(input.trade,'work performed',200),status:'submitted'},p.id);}
  if(action==='review_hours') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'hours');return update(actor,item,{status:choice(input.status,['approved','returned']),response:text(input.response??'','review note',1000,false)},input.version);}
  if(action==='record_invoice') {if(actor.role==='client')throw new ErpError(403,'Not permitted.');const p=project(actor,input.projectId);return create(actor,'invoice',{reference:text(input.reference,'invoice reference',100),amountUsd:number(input.amountUsd,'amount',0,1e10),status:'submitted',audience:actor.role==='vendor'?'vendor':choice(input.audience??'client',['client','internal']),dueDate:calendarDate(input.dueDate,'due date',true)},p.id);}
  if(action==='update_invoice') {if(actor.role!=='admin')throw new ErpError(403,'Only an administrator can record financial approvals.');const item=requireEntry(actor,text(input.id,'record',100),'invoice');return update(actor,item,{status:choice(input.status,['approved','paid','returned'])},input.version);}
  if(action==='review_document') {requireInternal(actor);const item=requireEntry(actor,text(input.id,'record',100),'document');const visibility=choice(input.visibility??'owner',['owner','client']);if(visibility==='client'&&(!item.projectId||item.data.type!=='project'))throw new ErpError(422,'Only project documents can be shared with the assigned client.');return update(actor,item,{status:choice(input.status,['approved','rejected']),response:text(input.response,'review note',1000),expiresAt:calendarDate(input.expiresAt,'expiry',true),visibility},input.version);}
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
