import { randomUUID,createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Actor } from './auth';

export const REVIEW_AUDIT_KINDS = ['review.created','review.token_rotated','review.claimed','auth.session_started','auth.signout','review.revoked','review.expired_observed','access.allowed','access.denied','document.started','document.completed','document.cancelled','upstream.failed'] as const;
export const REVIEW_AUDIT_SURFACES = ['authentication','portal','workspace','summary','document','viewer','privacy','activity'] as const;
const REASONS = ['none','unauthenticated','expired','revoked','not_authorized','month_closed','invalid_request','unavailable','cancelled'] as const;
const RESPONSES = ['none','full','range','head','not_modified','redirect'] as const;
const TERMINAL = ['document.completed','document.cancelled','upstream.failed'];
const MAX_EVENTS=10_000;
export type ReviewAuditKind=typeof REVIEW_AUDIT_KINDS[number];
export type ReviewAuditContext={tenantId:string;reviewId:string;actorId:string;actorRole:'guest'|'admin'};
export type ReviewAuditInput={
  eventId?:string;kind:ReviewAuditKind;surface:typeof REVIEW_AUDIT_SURFACES[number];
  spanId?:string;statusCode?:number;reason?:typeof REASONS[number];responseKind?:typeof RESPONSES[number];
  resourceKind?:'project'|'document'|'asset'|'module';resourceId?:string;bytesSent?:number;
};
export class ReviewAuditError extends Error {
  constructor(message='The review audit is unavailable.',public status=503){super(message);}
}
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const opaque=(v:unknown,max=200):v is string=>typeof v==='string'&&new RegExp('^[A-Za-z0-9][A-Za-z0-9_-]{0,'+(max-1)+'}$').test(v);
function days(){
 const value=process.env.TAYCO_REVIEW_AUDIT_RETENTION_DAYS;
 if(value===undefined)return 90;
 if(!/^[1-9]\d{0,2}$/.test(value)||Number(value)>365)throw new ReviewAuditError();
 return Number(value);
}
/** Context is obtained from a verified server Actor, never from a client telemetry body.
 * Logging itself is not an authorization decision and may observe expiration/revocation later. */
export function auditContextForGuest(actor:Actor):ReviewAuditContext{
 if(actor.role!=='guest'||!actor.review)throw new ReviewAuditError('A verified guest review context is required.',403);
 return context({tenantId:actor.tenantId,actorId:actor.id,actorRole:'guest',reviewId:actor.review.id});
}
function context(value:ReviewAuditContext){
 if(!value||Object.keys(value).some(k=>!['tenantId','actorId','actorRole','reviewId'].includes(k))||
   !opaque(value.tenantId,100)||!opaque(value.actorId,100)||!opaque(value.reviewId,100)||
   !['guest','admin'].includes(value.actorRole))throw new ReviewAuditError('Invalid audit context.',400);
 return {tenantId:value.tenantId,reviewId:value.reviewId,actorId:value.actorId,actorRole:value.actorRole};
}
function normalized(value:ReviewAuditInput){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['eventId','kind','surface','spanId','statusCode','reason','responseKind','resourceKind','resourceId','bytesSent'].includes(k)))throw new ReviewAuditError('Invalid audit event.',400);
 if(!(REVIEW_AUDIT_KINDS as readonly string[]).includes(value.kind)||!(REVIEW_AUDIT_SURFACES as readonly string[]).includes(value.surface)||
  (value.eventId!==undefined&&!uuid(value.eventId))||(value.spanId!==undefined&&!uuid(value.spanId))||
  (value.statusCode!==undefined&&(!Number.isInteger(value.statusCode)||value.statusCode<100||value.statusCode>599))||
  (value.reason!==undefined&&!(REASONS as readonly string[]).includes(value.reason))||
  (value.responseKind!==undefined&&!(RESPONSES as readonly string[]).includes(value.responseKind))||
  (value.resourceKind!==undefined&&!['project','document','asset','module'].includes(value.resourceKind))||
  (value.resourceId!==undefined&&(!value.resourceKind||!opaque(value.resourceId)))||
  (value.bytesSent!==undefined&&(!Number.isSafeInteger(value.bytesSent)||value.bytesSent<0)))throw new ReviewAuditError('Invalid audit event.',400);
 if(value.kind==='access.denied'&&(value.resourceId!==undefined||!value.statusCode||value.statusCode<400||!value.reason||value.reason==='none'))throw new ReviewAuditError('Denied attempts cannot identify an unauthorized resource.',400);
 if(value.kind==='access.allowed'&&value.statusCode!==undefined&&value.statusCode>=400)throw new ReviewAuditError('Invalid access outcome.',400);
 const transport=value.kind==='document.started'||TERMINAL.includes(value.kind);
 if(transport&&(!value.spanId||!['document','asset'].includes(value.resourceKind??'')||!value.resourceId||!['full','range'].includes(value.responseKind??'')))throw new ReviewAuditError('Invalid document transport event.',400);
 if(value.kind==='document.completed'&&(value.bytesSent===undefined||![200,206].includes(value.statusCode??0)))throw new ReviewAuditError('Completion requires an observed successful transport.',400);
 if(value.kind==='document.started'&&value.bytesSent!==undefined&&value.bytesSent!==0)throw new ReviewAuditError('Start does not prove transferred bytes.',400);
 if(value.statusCode===206&&!['range','head'].includes(value.responseKind??''))throw new ReviewAuditError('A partial response must be marked as a range.',400);
 if(!transport&&value.bytesSent!==undefined)throw new ReviewAuditError('Byte counts belong to document transport.',400);
 return {kind:value.kind,surface:value.surface,spanId:value.spanId??null,statusCode:value.statusCode??null,
 reason:value.reason??'none',responseKind:value.responseKind??'none',resourceKind:value.resourceKind??null,
 resourceId:value.resourceId??null,bytesSent:value.bytesSent??null};
}
export function installReviewAuditSchema(db:DatabaseSync){
 db.exec(`CREATE TABLE IF NOT EXISTS review_audit_events(
  event_id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,review_id TEXT NOT NULL,actor_id TEXT NOT NULL,actor_role TEXT NOT NULL,
  kind TEXT NOT NULL,surface TEXT NOT NULL,span_id TEXT,status_code INTEGER,reason TEXT NOT NULL,response_kind TEXT NOT NULL,
  resource_kind TEXT,resource_id TEXT,bytes_sent INTEGER,created_at INTEGER NOT NULL,payload_hash TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS review_audit_tenant_time ON review_audit_events(tenant_id,created_at DESC);
  CREATE INDEX IF NOT EXISTS review_audit_span ON review_audit_events(tenant_id,review_id,span_id);
  CREATE UNIQUE INDEX IF NOT EXISTS review_audit_start ON review_audit_events(tenant_id,review_id,span_id) WHERE kind='document.started';
  CREATE UNIQUE INDEX IF NOT EXISTS review_audit_terminal ON review_audit_events(tenant_id,review_id,span_id) WHERE kind IN ('document.completed','document.cancelled','upstream.failed');
  CREATE TABLE IF NOT EXISTS review_audit_pruned(tenant_id TEXT PRIMARY KEY,retention_pruned INTEGER NOT NULL DEFAULT 0,cap_pruned INTEGER NOT NULL DEFAULT 0);`);
}
function prune(db:DatabaseSync,tenantId:string,now:number,retention:number){
 const expired=db.prepare('SELECT tenant_id,count(*) AS n FROM review_audit_events WHERE created_at<? GROUP BY tenant_id').all(now-retention*86400000);
 const add=db.prepare('INSERT INTO review_audit_pruned VALUES(?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET retention_pruned=retention_pruned+excluded.retention_pruned,cap_pruned=cap_pruned+excluded.cap_pruned');
 for(const row of expired)add.run(String(row.tenant_id),Number(row.n),0);
 db.prepare('DELETE FROM review_audit_events WHERE created_at<?').run(now-retention*86400000);
 const result=db.prepare('DELETE FROM review_audit_events WHERE rowid IN (SELECT rowid FROM review_audit_events WHERE tenant_id=? ORDER BY created_at DESC,rowid DESC LIMIT -1 OFFSET ?)').run(tenantId,MAX_EVENTS);
 if(result.changes)add.run(tenantId,0,Number(result.changes));
}
/** Can participate in the caller's auth transaction. A savepoint keeps each append/prune atomic.
 * Caller must supply trusted server context. This function does not grant access to any resource. */
export function appendReviewAudit(db:DatabaseSync,ctx:ReviewAuditContext,input:ReviewAuditInput,now=Date.now()){
 const bound=context(ctx);const data=normalized(input),retention=days();
 if(!Number.isSafeInteger(now)||now<0||now>8640000000000000)throw new ReviewAuditError('Invalid audit timestamp.',400);
 const id=input.eventId??randomUUID(),hash=createHash('sha256').update(JSON.stringify({context:bound,data})).digest('hex');
 db.exec('SAVEPOINT append_review_audit');
 try{
  const previous=db.prepare('SELECT payload_hash FROM review_audit_events WHERE event_id=?').get(id);
  if(previous){
   if(previous.payload_hash!==hash)throw new ReviewAuditError('The audit event reference conflicts with an existing event.',409);
   db.exec('RELEASE append_review_audit');return {eventId:id,duplicate:true};
  }
  if(TERMINAL.includes(input.kind)){
   const start=db.prepare("SELECT actor_id,actor_role,resource_id,resource_kind,response_kind,surface FROM review_audit_events WHERE tenant_id=? AND review_id=? AND span_id=? AND kind='document.started'").get(ctx.tenantId,ctx.reviewId,data.spanId!);
   if(!start||start.actor_id!==ctx.actorId||start.actor_role!==ctx.actorRole||start.resource_id!==data.resourceId||start.resource_kind!==data.resourceKind||start.response_kind!==data.responseKind||start.surface!==data.surface)throw new ReviewAuditError('A matching retained document start is required.',409);
   if(db.prepare("SELECT 1 FROM review_audit_events WHERE tenant_id=? AND review_id=? AND span_id=? AND kind IN ('document.completed','document.cancelled','upstream.failed')").get(ctx.tenantId,ctx.reviewId,data.spanId!))throw new ReviewAuditError('This document transport already has a terminal outcome.',409);
  }
  db.prepare('INSERT INTO review_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,ctx.tenantId,ctx.reviewId,ctx.actorId,ctx.actorRole,data.kind,data.surface,data.spanId,data.statusCode,data.reason,data.responseKind,data.resourceKind,data.resourceId,data.bytesSent,now,hash);
  prune(db,ctx.tenantId,now,retention);
  db.exec('RELEASE append_review_audit');return {eventId:id,duplicate:false};
 }catch(error){
  db.exec('ROLLBACK TO append_review_audit; RELEASE append_review_audit');
  if(error instanceof ReviewAuditError)throw error;
  throw new ReviewAuditError();
 }
}
function withDb<T>(run:(db:DatabaseSync)=>T):T{
 const filename=process.env.TAYCO_AUTH_DB_PATH||path.join(process.cwd(),'.data','tayco-auth.sqlite');
 try{
  mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});const db=new DatabaseSync(filename);
  try{db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');installReviewAuditSchema(db);return run(db);}
  finally{db.close();}
 }catch(error){if(error instanceof ReviewAuditError)throw error;throw new ReviewAuditError();}
}
export function recordReviewAudit(ctx:ReviewAuditContext,input:ReviewAuditInput){
 return withDb(db=>{
  db.exec('BEGIN IMMEDIATE');
  try{const result=appendReviewAudit(db,ctx,input);db.exec('COMMIT');return result;}
  catch(error){db.exec('ROLLBACK');throw error;}
 });
}
export function reviewAuditReport(actor:Pick<Actor,'role'|'tenantId'>,options:{reviewId?:string}={}){
 if(actor.role!=='admin')throw new ReviewAuditError('Administrator access is required.',403);
 if(!opaque(actor.tenantId,100)||Object.keys(options).some(k=>k!=='reviewId')||(options.reviewId!==undefined&&!opaque(options.reviewId,100)))throw new ReviewAuditError('Invalid audit report selection.',400);
 const now=Date.now(),retention=days(),cutoff=now-retention*86400000,params=[actor.tenantId,cutoff,options.reviewId??null,options.reviewId??null];
 return withDb(db=>{
  db.exec('BEGIN');
  try{
   const where='tenant_id=? AND created_at>=? AND (? IS NULL OR review_id=?)';
   const rows=db.prepare('SELECT * FROM review_audit_events WHERE '+where+' ORDER BY created_at DESC,rowid DESC LIMIT 200').all(...params);
   const counts=db.prepare('SELECT kind,count(*) AS count FROM review_audit_events WHERE '+where+' GROUP BY kind ORDER BY kind').all(...params);
   const incomplete=db.prepare("SELECT count(*) AS n FROM review_audit_events s WHERE s.tenant_id=? AND s.created_at>=? AND (? IS NULL OR s.review_id=?) AND s.kind='document.started' AND NOT EXISTS(SELECT 1 FROM review_audit_events t WHERE t.tenant_id=s.tenant_id AND t.review_id=s.review_id AND t.span_id=s.span_id AND t.kind IN ('document.completed','document.cancelled','upstream.failed'))").get(...params)!;
   const pruned=db.prepare('SELECT retention_pruned,cap_pruned FROM review_audit_pruned WHERE tenant_id=?').get(actor.tenantId);
   const events=rows.map(row=>({eventId:String(row.event_id),reviewId:String(row.review_id),actorId:String(row.actor_id),actorRole:String(row.actor_role),kind:String(row.kind),surface:String(row.surface),reason:String(row.reason),responseKind:String(row.response_kind),createdAt:new Date(Number(row.created_at)).toISOString(),
    ...(row.span_id!==null?{spanId:String(row.span_id)}:{}),...(row.status_code!==null?{statusCode:Number(row.status_code)}:{}),...(row.resource_kind!==null?{resourceKind:String(row.resource_kind)}:{}),...(row.resource_id!==null?{resourceId:String(row.resource_id)}:{}),...(row.bytes_sent!==null?{bytesSent:Number(row.bytes_sent)}:{})}));
   db.exec('COMMIT');
   return {events,counts:counts.map(r=>({kind:String(r.kind),count:Number(r.count)})),totalEvents:counts.reduce((n,r)=>n+Number(r.count),0),retentionDays:retention,maxRetainedEvents:MAX_EVENTS,windowStart:new Date(cutoff).toISOString(),generatedAt:new Date(now).toISOString(),
    coverage:{source:'server-observed' as const,provesHumanReading:false,retainedWindowOnly:true,pruningCounterScope:'company' as const,incompleteRetainedTransports:Number(incomplete.n),prunedByRetention:Number(pruned?.retention_pruned??0),prunedByCap:Number(pruned?.cap_pruned??0),unattributedAttempts:'Not assigned to a tenant review; not included in this report.'}};
  }catch(error){db.exec('ROLLBACK');throw error;}
 });
}
