import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Actor } from '../lib/auth';
import { appendReviewAudit,auditContextForGuest,installReviewAuditSchema,recordReviewAudit,reviewAuditReport,ReviewAuditError,type ReviewAuditContext,type ReviewAuditInput } from '../lib/review-audit';
const ctx:ReviewAuditContext={tenantId:'tenant-one',reviewId:'review-one',actorId:'guest-one',actorRole:'guest'};
const admin={role:'admin' as const,tenantId:ctx.tenantId};
const event=(extra:Partial<ReviewAuditInput>={}):ReviewAuditInput=>({eventId:randomUUID(),kind:'access.allowed',surface:'workspace',statusCode:200,...extra});
const fails=(status:number)=>(e:unknown)=>e instanceof ReviewAuditError&&e.status===status;
function fixture(run:(filename:string)=>void){
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-review-audit-')),filename=path.join(folder,'auth.sqlite');
 const old=process.env.TAYCO_AUTH_DB_PATH,retention=process.env.TAYCO_REVIEW_AUDIT_RETENTION_DAYS;
 process.env.TAYCO_AUTH_DB_PATH=filename;delete process.env.TAYCO_REVIEW_AUDIT_RETENTION_DAYS;
 try{run(filename);}finally{if(old===undefined)delete process.env.TAYCO_AUTH_DB_PATH;else process.env.TAYCO_AUTH_DB_PATH=old;if(retention===undefined)delete process.env.TAYCO_REVIEW_AUDIT_RETENTION_DAYS;else process.env.TAYCO_REVIEW_AUDIT_RETENTION_DAYS=retention;rmSync(folder,{recursive:true,force:true});}
}
test('server guest context requires a bound review and never accepts a caller-selected role or identity field',()=>{
 const actor:Actor={id:ctx.actorId,tenantId:ctx.tenantId,email:'synthetic@example.test',role:'guest',projectIds:[],review:{id:ctx.reviewId,createdAt:0,expiresAt:1,detailPeriod:'2026-10'}};
 assert.deepEqual(auditContextForGuest(actor),ctx); // Historical audit context grants no access.
 for(const role of ['admin','staff','client','vendor'] as const)assert.throws(()=>auditContextForGuest({...actor,role}),fails(403));
 assert.throws(()=>auditContextForGuest({...actor,review:undefined}),fails(403));
 fixture(()=>assert.throws(()=>recordReviewAudit({...ctx,url:'https://secret.test'} as never,event()),fails(400)));
});
test('stable server event references deduplicate independent of context property order and reject conflicts',()=>{
 fixture(()=>{
  const input=event();assert.equal(recordReviewAudit(ctx,input).duplicate,false);
  assert.equal(recordReviewAudit({actorRole:'guest',actorId:ctx.actorId,reviewId:ctx.reviewId,tenantId:ctx.tenantId},input).duplicate,true);
  assert.throws(()=>recordReviewAudit(ctx,{...input,surface:'summary'}),fails(409));
  assert.throws(()=>recordReviewAudit({...ctx,tenantId:'other-tenant'},input),fails(409));
  const report=reviewAuditReport(admin);assert.equal(report.totalEvents,1);
  assert.equal('payloadHash' in report.events[0],false);assert.equal('tenantId' in report.events[0],false);
  assert.equal(JSON.stringify(report).includes('synthetic@example.test'),false);
 });
});
test('administrator reports isolate tenants and explicit review selection; other roles cannot read',()=>{
 fixture(()=>{
  recordReviewAudit(ctx,event());recordReviewAudit({...ctx,reviewId:'review-two'},event());recordReviewAudit({...ctx,tenantId:'other-tenant'},event());
  assert.equal(reviewAuditReport(admin).totalEvents,2);
  assert.equal(reviewAuditReport(admin,{reviewId:ctx.reviewId}).totalEvents,1);
  assert.equal(reviewAuditReport({...admin,tenantId:'other-tenant'}).totalEvents,1);
  assert.equal(reviewAuditReport(admin,{reviewId:'foreign-review'}).totalEvents,0);
  for(const role of ['guest','staff','client','vendor'] as const)assert.throws(()=>reviewAuditReport({...admin,role}),fails(403));
  assert.throws(()=>reviewAuditReport(admin,{tenantId:'other-tenant'} as never),fails(400));
 });
});
test('closed audit events reject private payloads and denied attempts cannot identify an unauthorized resource',()=>{
 fixture(()=>{
  for(const field of ['url','cookie','token','email','searchText','documentContent','ip','userAgent'])assert.throws(()=>recordReviewAudit(ctx,{...event(),[field]:'private'} as never),fails(400));
  for(const input of [
   event({kind:'access.denied',statusCode:403,reason:'not_authorized',resourceKind:'document',resourceId:'foreign-document'}),
   event({resourceKind:'document',resourceId:'private/path.pdf'}),event({bytesSent:123}),
   event({kind:'document.completed',spanId:randomUUID(),resourceKind:'document',resourceId:'doc-one',responseKind:'head',statusCode:200,bytesSent:0}),
   event({kind:'document.started',spanId:randomUUID(),resourceKind:'document',resourceId:'doc-one',responseKind:'full',bytesSent:1}),
   event({statusCode:206,responseKind:'full'}),
  ])assert.throws(()=>recordReviewAudit(ctx,input),fails(400));
  recordReviewAudit(ctx,event({kind:'access.denied',statusCode:403,reason:'not_authorized'}));
  const report=reviewAuditReport(admin);assert.equal(report.totalEvents,1);assert.equal('resourceId' in report.events[0],false);
 });
});
test('range EOF is a transport completion only; missing start, changed resource and double terminal are refused',()=>{
 fixture(()=>{
  const spanId=randomUUID(),base={spanId,resourceKind:'document' as const,resourceId:'doc-one',responseKind:'range' as const,statusCode:206,surface:'viewer' as const};
  assert.throws(()=>recordReviewAudit(ctx,event({...base,kind:'document.completed',bytesSent:32})),fails(409));
  recordReviewAudit(ctx,event({...base,kind:'document.started'}));
  assert.equal(reviewAuditReport(admin).coverage.incompleteRetainedTransports,1);
  assert.throws(()=>recordReviewAudit(ctx,event({...base,kind:'document.completed',resourceId:'other-doc',bytesSent:32})),fails(409));
  assert.throws(()=>recordReviewAudit(ctx,event({...base,kind:'document.completed',surface:'document',bytesSent:32})),fails(409));
  recordReviewAudit(ctx,event({...base,kind:'document.completed',bytesSent:32}));
  assert.throws(()=>recordReviewAudit(ctx,event({...base,kind:'document.cancelled',bytesSent:32,reason:'cancelled'})),fails(409));
  const report=reviewAuditReport(admin);assert.equal(report.totalEvents,2);assert.equal(report.coverage.incompleteRetainedTransports,0);assert.equal(report.coverage.provesHumanReading,false);
  assert.equal(report.events[0].responseKind,'range');assert.equal(report.events[0].bytesSent,32);
 });
});
test('the audit append joins the outer auth transaction and its rollback leaves neither mutation nor audit',()=>{
 const db=new DatabaseSync(':memory:');try{
  installReviewAuditSchema(db);db.exec('CREATE TABLE synthetic_auth(id TEXT PRIMARY KEY); BEGIN IMMEDIATE;');
  db.prepare('INSERT INTO synthetic_auth VALUES(?)').run('claimed');
  appendReviewAudit(db,ctx,event({kind:'review.claimed',surface:'authentication',statusCode:undefined}));
  db.exec('ROLLBACK');
  assert.equal(db.prepare('SELECT count(*) AS n FROM review_audit_events').get()!.n,0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM synthetic_auth').get()!.n,0);
 }finally{db.close();}
});
test('storage failure is explicit and does not acknowledge an event or partially prune other evidence',()=>{
 fixture(filename=>{
  recordReviewAudit(ctx,event());
  const db=new DatabaseSync(filename);try{db.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON review_audit_events BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;");}finally{db.close();}
  assert.throws(()=>recordReviewAudit(ctx,event()),fails(503));
  assert.equal(reviewAuditReport(admin).totalEvents,1);
 });
});
test('retention, company cap, recent report bound and pruning counters preserve honest coverage',()=>{
 fixture(filename=>{
  recordReviewAudit(ctx,event());const now=Date.now(),db=new DatabaseSync(filename);
  try{
   db.exec('BEGIN IMMEDIATE');
   const insert=db.prepare('INSERT INTO review_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
   for(let i=0;i<10002;i++)insert.run(randomUUID(),ctx.tenantId,ctx.reviewId,ctx.actorId,'guest','access.allowed','workspace',null,200,'none','none',null,null,null,now-20000+i,'synthetic-only');
   insert.run(randomUUID(),'other-tenant','other-review','other-guest','guest','access.allowed','workspace',null,200,'none','none',null,null,null,now-100,'synthetic-only');
   for(const tenant of [ctx.tenantId,'other-tenant'])insert.run(randomUUID(),tenant,'old-review','old-guest','guest','access.allowed','workspace',null,200,'none','none',null,null,null,now-91*86400000,'synthetic-only');
   db.exec('COMMIT');
  }finally{db.close();}
  recordReviewAudit(ctx,event());
  const report=reviewAuditReport(admin);assert.equal(report.totalEvents,10000);assert.equal(report.events.length,200);assert.equal(report.coverage.retainedWindowOnly,true);
  assert.equal(report.coverage.prunedByCap,4);assert.equal(report.coverage.prunedByRetention,1);
  const other=reviewAuditReport({...admin,tenantId:'other-tenant'});assert.equal(other.totalEvents,1);assert.equal(other.coverage.prunedByRetention,1);assert.equal(other.coverage.prunedByCap,0);
 });
});
test('invalid retention configuration fails explicitly rather than silently changing storage policy',()=>{
 fixture(()=>{
  for(const value of ['','0','366','-1','x','1.5']){process.env.TAYCO_REVIEW_AUDIT_RETENTION_DAYS=value;assert.throws(()=>recordReviewAudit(ctx,event()),fails(503));}
  process.env.TAYCO_REVIEW_AUDIT_RETENTION_DAYS='1';recordReviewAudit(ctx,event());assert.equal(reviewAuditReport(admin).retentionDays,1);
 });
});
