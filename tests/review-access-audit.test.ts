import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { AuthError,type Actor } from '../lib/auth';
import { ErpError } from '../lib/erp';
import { auditedGuestDocumentStream } from '../lib/review-access-audit';
import { reviewAuditReport } from '../lib/review-audit';

const actor:Actor={id:'guest-one',tenantId:'tenant-one',email:'synthetic@example.test',role:'guest',projectIds:[],
 review:{id:'review-one',createdAt:Date.now(),expiresAt:Date.now()+14400000,detailPeriod:'2026-10'}};
const admin={role:'admin' as const,tenantId:actor.tenantId};
const resource={kind:'asset' as const,id:'asset-one'};
async function fixture(run:(filename:string)=>Promise<void>){
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-audit-stream-')),filename=path.join(folder,'auth.sqlite'),old=process.env.TAYCO_AUTH_DB_PATH;
 process.env.TAYCO_AUTH_DB_PATH=filename;
 try{await run(filename);}finally{if(old===undefined)delete process.env.TAYCO_AUTH_DB_PATH;else process.env.TAYCO_AUTH_DB_PATH=old;rmSync(folder,{recursive:true,force:true});}
}
const report=()=>reviewAuditReport(admin);
const noop=async()=>{};
const source=()=>new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array([1,2]));c.enqueue(new Uint8Array([3]));c.close();}});
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(r=>{resolve=r;});return{resolve,promise};}
test('only actual EOF completes a full or Range response, with released byte counts and honest coverage',async()=>{
 await fixture(async()=>{
  for(const responseKind of ['full','range'] as const){
   const body=auditedGuestDocumentStream(source(),actor,'viewer',resource,{statusCode:responseKind==='range'?206:200,responseKind,recheck:noop});
   assert.equal(report().coverage.incompleteRetainedTransports,1);
   assert.deepEqual([...new Uint8Array(await new Response(body).arrayBuffer())],[1,2,3]);
   const end=report().events.find(e=>e.kind==='document.completed'&&e.responseKind===responseKind)!;
   assert.equal(end.bytesSent,3);assert.equal(end.resourceKind,'asset');
   assert.equal(report().coverage.incompleteRetainedTransports,0);assert.equal(report().coverage.provesHumanReading,false);
  }
  assert.equal(report().totalEvents,4);
 });
});
test('consumer cancellation before reading records cancellation with zero bytes and never completion',async()=>{
 await fixture(async()=>{
  let cancelled=0;const stream=new ReadableStream<Uint8Array>({cancel(){cancelled++;}},{highWaterMark:0});
  const body=auditedGuestDocumentStream(stream,actor,'viewer',resource,{statusCode:200,responseKind:'full',recheck:noop});
  await body.cancel('private client text must never be logged');
  assert.equal(cancelled,1);assert.equal(report().events[0].kind,'document.cancelled');assert.equal(report().events[0].bytesSent,0);
  assert.equal(report().events.some(e=>e.kind==='document.completed'),false);assert.equal(JSON.stringify(report()).includes('private client text'),false);
 });
});
test('request abort during a pending source read terminates once and releases no blocked chunk',async()=>{
 await fixture(async()=>{
  const waiting=deferred();let cancelled=0;
  const upstream=new ReadableStream<Uint8Array>({pull(){waiting.resolve();return new Promise(()=>{});},cancel(){cancelled++;}},{highWaterMark:0});
  const abort=new AbortController();
  const body=auditedGuestDocumentStream(upstream,actor,'viewer',resource,{statusCode:206,responseKind:'range',recheck:noop,signal:abort.signal});
  const pending=body.getReader().read();await waiting.promise;abort.abort();
  await assert.rejects(pending,/interrupted/);await Promise.resolve();
  const rows=report().events;assert.equal(rows.filter(e=>e.kind==='document.cancelled').length,1);
  assert.equal(rows.find(e=>e.kind==='document.cancelled')!.bytesSent,0);assert.equal(cancelled,1);assert.equal(rows.length,2);
 });
});
test('revocation after the upstream wait prevents a newly arriving chunk and logs cancelled rather than EOF',async()=>{
 await fixture(async()=>{
  const waiting=deferred(),release=deferred();let revoked=false;
  const upstream=new ReadableStream<Uint8Array>({async pull(c){waiting.resolve();await release.promise;c.enqueue(new Uint8Array([9,9]));}},{highWaterMark:0});
  const body=auditedGuestDocumentStream(upstream,actor,'viewer',resource,{statusCode:200,responseKind:'full',
   recheck:async()=>{if(revoked)throw new AuthError('Review revoked',403,'review_revoked');}});
  const pending=body.getReader().read();await waiting.promise;revoked=true;release.resolve();
  await assert.rejects(pending,/interrupted/);
  const end=report().events.find(e=>e.kind==='document.cancelled')!;assert.equal(end.bytesSent,0);assert.equal(end.reason,'revoked');assert.equal(end.statusCode,403);
 });
});
test('a scope change before a read cancels with the actual trusted guard status and no source read',async()=>{
 await fixture(async()=>{
  let pulls=0;
  const upstream=new ReadableStream<Uint8Array>({pull(){pulls++;}},{highWaterMark:0});
  const body=auditedGuestDocumentStream(upstream,actor,'document',{kind:'document',id:'doc-one'},
   {statusCode:200,responseKind:'full',recheck:async()=>{throw new ErpError(403,'Month closed');}});
  await assert.rejects(body.getReader().read(),/interrupted/);
  const end=report().events[0];assert.equal(end.kind,'document.cancelled');assert.equal(end.reason,'month_closed');assert.equal(end.bytesSent,0);assert.equal(pulls,0);
 });
});
test('upstream failure after a chunk records only bytes already released, without persisting the provider message',async()=>{
 await fixture(async()=>{
  let reads=0;const upstream=new ReadableStream<Uint8Array>({pull(c){if(reads++===0)c.enqueue(new Uint8Array([1,2,3,4]));else c.error(new Error('secret-provider-path-and-token'));}},{highWaterMark:0});
  const reader=auditedGuestDocumentStream(upstream,actor,'viewer',resource,{statusCode:200,responseKind:'full',recheck:noop}).getReader();
  assert.equal((await reader.read()).value!.byteLength,4);await assert.rejects(reader.read(),/interrupted/);
  const end=report().events[0];assert.equal(end.kind,'upstream.failed');assert.equal(end.bytesSent,4);
  assert.equal(JSON.stringify(report()).includes('secret-provider'),false);
 });
});
test('start audit failure cancels the source and prevents returning a body',async()=>{
 await fixture(async filename=>{
  // Install schema with an independent synthetic transport, then reject the next start.
  await new Response(auditedGuestDocumentStream(source(),actor,'viewer',resource,{statusCode:200,responseKind:'full',recheck:noop})).arrayBuffer();
  const db=new DatabaseSync(filename);try{db.exec("CREATE TRIGGER reject_start BEFORE INSERT ON review_audit_events WHEN NEW.kind='document.started' BEGIN SELECT RAISE(ABORT,'synthetic'); END;");}finally{db.close();}
  let cancelled=0;const upstream=new ReadableStream<Uint8Array>({cancel(){cancelled++;}},{highWaterMark:0});
  assert.throws(()=>auditedGuestDocumentStream(upstream,actor,'viewer',resource,{statusCode:200,responseKind:'full',recheck:noop}),/unavailable/i);
  await Promise.resolve();assert.equal(cancelled,1);assert.equal(report().totalEvents,2);
 });
});
test('terminal audit failure errors the response and leaves an explicitly incomplete retained start',async()=>{
 await fixture(async filename=>{
  const body=auditedGuestDocumentStream(new ReadableStream<Uint8Array>({start(c){c.close();}}),actor,'viewer',resource,{statusCode:200,responseKind:'full',recheck:noop});
  const db=new DatabaseSync(filename);try{db.exec("CREATE TRIGGER reject_end BEFORE INSERT ON review_audit_events WHEN NEW.kind='document.completed' BEGIN SELECT RAISE(ABORT,'synthetic'); END;");}finally{db.close();}
  await assert.rejects(new Response(body).arrayBuffer(),/interrupted/);
  assert.equal(report().totalEvents,1);assert.equal(report().coverage.incompleteRetainedTransports,1);
 });
});
