import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync,rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { provisionAdmin,createSession,createInvitation,acceptInvitation,requireActor,sessionCookie,type Actor } from '../lib/auth';
import { authFailure } from '../lib/auth-http';
import { reviewAuditReport } from '../lib/review-audit';
import { withGuestRequestAudit,withGuestRenderAudit,noteReviewAuditFailure } from '../lib/review-request-audit';

async function fixture(run:(x:{admin:Actor;adminCookie:string;guestCookies:string[];filename:string})=>Promise<void>){
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-request-audit-'));
 const env={TAYCO_AUTH_DB_PATH:path.join(folder,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(folder,'erp.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_APP_URL:'https://tayco.test'};
 const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));Object.assign(process.env,env);
 try{
  const id=await provisionAdmin('admin@example.test','Synthetic-request-admin-password!','tenant-one');
  const admin:Actor={id,email:'admin@example.test',role:'admin',tenantId:'tenant-one',projectIds:[]},adminCookie=await createSession(id),guestCookies=[];
  for(const email of ['one@example.test','two@example.test']){
   const invite=createInvitation(admin,{email,role:'guest',tenantId:admin.tenantId,projectIds:[]});
   guestCookies.push((await acceptInvitation(invite.token,email,'Synthetic-request-guest-password!')).cookie);
  }
  await run({admin,adminCookie,guestCookies,filename:env.TAYCO_AUTH_DB_PATH});
 }finally{for(const[k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}rmSync(folder,{recursive:true,force:true});}
}
function request(cookie?:string,method='GET'){return new Request('https://tayco.test/private?reviewId=forged-review&tenantId=foreign&secret=untrusted-url',{method,headers:cookie?{cookie:sessionCookie(cookie).split(';')[0]}:{}});}
test('concurrent real guest sessions retain separate trusted review contexts across interleaved awaits',async()=>{
 await fixture(async({admin,guestCookies})=>{
  let unblock!:()=>void;const barrier=new Promise<void>(r=>{unblock=r;});let entered=0;
  const handler=withGuestRequestAudit('workspace',async(req:Request)=>{
   await requireActor(req);if(++entered===2)unblock();await barrier;await Promise.resolve();return new Response('ok');
  });
  const actors=await Promise.all(guestCookies.map(c=>requireActor(request(c))));
  const responses=await Promise.all(guestCookies.map(c=>handler(request(c))));assert.equal(responses.every(r=>r.status===200),true);
  const events=reviewAuditReport(admin).events.filter(e=>e.kind==='access.allowed');
  assert.equal(events.length,2);
  for(const actor of actors)assert.equal(events.some(e=>e.reviewId===actor.review!.id&&e.actorId===actor.id),true);
  const text=JSON.stringify(events);for(const forbidden of ['forged-review','foreign','untrusted-url','example.test'])assert.equal(text.includes(forbidden),false);
 });
});
test('HEAD206 records metadata only, and anonymous or admin requests create no invented guest observations',async()=>{
 await fixture(async({admin,adminCookie,guestCookies})=>{
  const handler=withGuestRequestAudit('viewer',async(req:Request)=>{try{await requireActor(req);return new Response(null,{status:206});}catch(error){return authFailure(error);}});
  assert.equal((await handler(request(guestCookies[0],'HEAD'))).status,206);
  assert.equal((await handler(request(adminCookie,'HEAD'))).status,206);assert.equal((await handler(request(undefined,'HEAD'))).status,401);
  const events=reviewAuditReport(admin).events.filter(e=>e.kind.startsWith('access.'));
  assert.equal(events.length,1);assert.equal(events[0].responseKind,'head');assert.equal(events.some(e=>e.kind==='document.completed'),false);
 });
});
test('a guest denial is logged without raw paths or caller-selected resource IDs',async()=>{
 await fixture(async({admin,guestCookies})=>{
  const handler=withGuestRequestAudit('document',async(req:Request)=>{await requireActor(req);return new Response('hidden',{status:404});});
  assert.equal((await handler(request(guestCookies[0]))).status,404);
  const event=reviewAuditReport(admin).events.find(e=>e.kind==='access.denied')!;assert.equal(event.reason,'not_authorized');assert.equal('resourceId'in event,false);assert.equal('url'in event,false);
 });
});
test('audit storage failure cancels the original body before release and strips private success headers',async()=>{
 await fixture(async({admin,guestCookies,filename})=>{
  const db=new DatabaseSync(filename);try{db.exec("CREATE TRIGGER reject_http BEFORE INSERT ON review_audit_events WHEN NEW.kind='access.allowed' BEGIN SELECT RAISE(ABORT,'synthetic'); END;");}finally{db.close();}
  let cancelled=0;
  const handler=withGuestRequestAudit('viewer',async(req:Request)=>{
   await requireActor(req);
   return new Response(req.method==='HEAD'?null:new ReadableStream<Uint8Array>({cancel(){cancelled++;}},{highWaterMark:0}),
    {status:200,headers:{'Set-Cookie':'private-cookie','Location':'/private-target','Content-Range':'bytes 0-2/4','Content-Security-Policy':"frame-ancestors 'self'",'Content-Length':'4'}});
  });
  const response=await handler(request(guestCookies[0]));assert.equal(response.status,503);await Promise.resolve();assert.equal(cancelled,1);
  for(const header of ['set-cookie','location','content-range','content-length'])assert.equal(response.headers.has(header),false);
  assert.equal(response.headers.get('content-security-policy'),"frame-ancestors 'self'");assert.equal(response.headers.get('cache-control'),'private, no-store');
  const head=await handler(request(guestCookies[0],'HEAD'));assert.equal(head.status,503);assert.equal(await head.text(),'');
  assert.equal(reviewAuditReport(admin).events.some(e=>e.kind==='access.allowed'),false);
 });
});

test('server render observations distinguish guard panels from permitted projections and fail before returning private data',async()=>{
 await fixture(async({admin,guestCookies,filename})=>{
  const cookie=guestCookies[0];
  assert.deepEqual(await withGuestRenderAudit('portal',async()=>{await requireActor(request(cookie));return {approved:true};}),{approved:true});
  await withGuestRenderAudit('portal',async()=>{await requireActor(request(cookie));noteReviewAuditFailure(new Error('Month closed'),403);return {denialPanel:true};});
  const events=reviewAuditReport(admin).events.filter(e=>e.kind.startsWith('access.'));
  assert.equal(events.length,2);assert.equal(events.some(e=>e.kind==='access.allowed'),true);
  assert.equal(events.some(e=>e.kind==='access.denied'&&e.reason==='month_closed'),true);
  const db=new DatabaseSync(filename);try{db.exec("CREATE TRIGGER reject_render BEFORE INSERT ON review_audit_events WHEN NEW.kind='access.allowed' BEGIN SELECT RAISE(ABORT,'synthetic'); END;");}finally{db.close();}
  let returned=false;
  await assert.rejects(withGuestRenderAudit('portal',async()=>{await requireActor(request(cookie));return {privateProjection:'not returned'};}).then(()=>{returned=true;}),/unavailable/i);
  assert.equal(returned,false);
 });
});

test('a session invalidated during audit insertion cannot release a successful HTTP body or RSC projection',async()=>{
 await fixture(async({admin,guestCookies,filename})=>{
  const db=new DatabaseSync(filename);
  try{db.exec("CREATE TRIGGER close_during_audit AFTER INSERT ON review_audit_events WHEN NEW.kind='access.allowed' BEGIN DELETE FROM auth_sessions WHERE user_id=NEW.actor_id; END;");}finally{db.close();}
  const handler=withGuestRequestAudit('workspace',async(req:Request)=>{await requireActor(req);return new Response('private-projection-that-must-not-leave');});
  const response=await handler(request(guestCookies[0]));assert.equal(response.status,401);
  assert.equal((await response.text()).includes('private-projection'),false);
  await assert.rejects(withGuestRenderAudit('portal',async()=>{await requireActor(request(guestCookies[1]));return {privateProjection:true};}),
   (error:unknown)=>error instanceof Error&&'status'in error&&error.status===401);
  const events=reviewAuditReport(admin).events.filter(e=>e.kind==='access.denied');
  assert.equal(events.length,2);assert.equal(events.every(e=>e.reason==='unauthenticated'&&!('resourceId'in e)),true);
 });
});
