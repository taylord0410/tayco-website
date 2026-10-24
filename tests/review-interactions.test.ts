import { database } from '../lib/erp';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes,randomUUID } from 'node:crypto';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { type Actor,AuthError,provisionAdmin,createSession,createInvitation,acceptInvitation,requireActor,sessionCookie,signOut } from '../lib/auth';
import { saveGuestPrivacy } from '../lib/guest-privacy';
import { GUEST_PRIVACY_VERSION } from '../lib/guest-privacy-contract';
import { parseReviewInteraction,ReviewInteractionError } from '../lib/review-interaction-contract';
import { recordReviewInteraction,reviewInteractionReport } from '../lib/review-interactions';
import { POST } from '../app/api/guest-activity/route';
import { GET } from '../app/api/review-audit/route';
const password='Synthetic-interaction-password!';
const input=(extra:Record<string,unknown>={})=>({taxonomyVersion:2,eventId:randomUUID(),elementId:'review.visit',...extra});
function request(cookie:string,body?:unknown,query=''){
 return new Request('https://tayco.test/api/guest-activity'+query,{method:body===undefined?'GET':'POST',
  headers:{cookie:sessionCookie(cookie).split(';')[0],origin:'https://tayco.test','Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
async function fixture(run:(x:{admin:Actor;guest:Actor;cookie:string;adminCookie:string;erpFile:string;authFile:string})=>Promise<void>){
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-interactions-'));
 const env={TAYCO_AUTH_DB_PATH:path.join(folder,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(folder,'erp.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_APP_URL:'https://tayco.test'};
 const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));Object.assign(process.env,env);
 try{
  const id=await provisionAdmin('admin@example.test',password,'tenant-one'),admin:Actor={id,tenantId:'tenant-one',email:'admin@example.test',role:'admin',projectIds:[]};
  const adminCookie=await createSession(id),invite=createInvitation(admin,{email:'guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[]});
  const cookie=(await acceptInvitation(invite.token,'guest@example.test',password)).cookie,guest=await requireActor(request(cookie));
  await run({admin,guest,cookie,adminCookie,erpFile:env.TAYCO_ERP_DB_PATH,authFile:env.TAYCO_AUTH_DB_PATH});
 }finally{database().close();for(const[k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}rmSync(folder,{recursive:true,force:true});}
}
const enable=(guest:Actor)=>saveGuestPrivacy(guest,{version:GUEST_PRIVACY_VERSION,optionalAnalytics:true});
const fails=(status:number)=>(e:unknown)=>e instanceof ReviewInteractionError&&e.status===status;
test('v2 contract is canonical and closed; control metadata cannot become typed text or identity',()=>{
 const eventId=randomUUID();
 assert.deepEqual(parseReviewInteraction({section:'plans',elementId:'module.select',taxonomyVersion:2,eventId}),{taxonomyVersion:2,eventId,elementId:'module.select',section:'plans'});
 for(const bad of [
  input({taxonomyVersion:1}),input({taxonomyVersion:3}),input({eventId:'x'}),input({elementId:'unlisted.click'}),
  input({tenantId:'foreign'}),input({reviewId:'forged'}),input({actorId:'other'}),input({text:'typed-private'}),
  input({url:'/private/file'}),input({cookie:'private'}),input({elementId:'module.select',section:'invented'}),
  input({elementId:'viewer.page.go',documentId:'doc-one',pageNumber:0}),input({elementId:'viewer.page.go',documentId:'doc-one',pageNumber:1.5}),
  input({elementId:'viewer.zoom.in',documentId:'private/path'}),input({elementId:'viewer.tab.select',documentId:'doc-one',pane:'private text'}),
  input({elementId:'module.select',section:'plans',documentId:'not-needed'}),input({elementId:'year.select',year:9999}),
 ])assert.throws(()=>parseReviewInteraction(bad),fails(400));
});
test('v2 explicit ACK, replay and conflicts bind to the authenticated review while unknown consent remains off',async()=>{
 await fixture(async({admin,guest,cookie})=>{
  const event=input({elementId:'module.select',section:'plans'});
  assert.equal((await POST(request(cookie,event))).status,403);assert.equal(reviewInteractionReport(admin).totalEvents,0);
  enable(guest);
  const first=await POST(request(cookie,event));assert.equal(first.status,200);
  assert.deepEqual(await first.json(),{success:true,eventId:event.eventId,taxonomyVersion:2,duplicate:false});
  assert.deepEqual(await(await POST(request(cookie,{section:'plans',eventId:event.eventId,taxonomyVersion:2,elementId:'module.select'}))).json(),
   {success:true,eventId:event.eventId,taxonomyVersion:2,duplicate:true});
  assert.equal((await POST(request(cookie,{...event,section:'finance'}))).status,409);
  const report=reviewInteractionReport(admin);assert.equal(report.totalEvents,1);assert.equal(report.events[0].reviewId,guest.review!.id);assert.equal(report.events[0].actorId,guest.id);
  assert.equal(report.coverage.provesHumanReading,false);assert.equal(report.coverage.legacyV1NotIncluded,true);
 });
});
test('withdrawing consent stops new writes and retries; a serialized Actor cannot mint a session capability',async()=>{
 await fixture(async({admin,guest,cookie})=>{
  enable(guest);const event=input();recordReviewInteraction(guest,event);
  assert.throws(()=>recordReviewInteraction(JSON.parse(JSON.stringify(guest)),input()),(e:unknown)=>e instanceof AuthError&&e.status===403);
  saveGuestPrivacy(guest,{version:GUEST_PRIVACY_VERSION,optionalAnalytics:false});
  assert.equal((await POST(request(cookie,event))).status,403);assert.equal((await POST(request(cookie,input()))).status,403);
  assert.equal(reviewInteractionReport(admin).totalEvents,1);
 });
});
test('revoking only the exact request session denies its retained Actor even when a second session remains valid',async()=>{
 await fixture(async({admin,guest,cookie})=>{
  enable(guest);const second=await createSession(guest.id,guest.review!.id);await signOut(request(cookie));
  assert.throws(()=>recordReviewInteraction(guest,input()),(e:unknown)=>e instanceof AuthError&&e.status===401);
  const fresh=await requireActor(request(second));recordReviewInteraction(fresh,input());assert.equal(reviewInteractionReport(admin).totalEvents,1);
 });
});
test('revocation during request body wait prevents an optional write and acknowledgement',async()=>{
 await fixture(async({admin,guest,cookie})=>{
  enable(guest);let release!:()=>void,waiting!:()=>void;const ready=new Promise<void>(r=>{waiting=r;}),held=new Promise<void>(r=>{release=r;});
  const body=new ReadableStream<Uint8Array>({async pull(c){waiting();await held;c.enqueue(new TextEncoder().encode(JSON.stringify(input())));c.close();}},{highWaterMark:0});
  const req=new Request('https://tayco.test/api/guest-activity',{method:'POST',headers:{cookie:sessionCookie(cookie).split(';')[0],origin:'https://tayco.test','Content-Type':'application/json'},body,duplex:'half'} as RequestInit);
  const pending=POST(req);await ready;await signOut(request(cookie));release();
  assert.equal((await pending).status,401);assert.equal(reviewInteractionReport(admin).totalEvents,0);
 });
});
test('resource selections require current server scope and denied IDs never enter optional evidence',async()=>{
 await fixture(async({admin,guest,cookie})=>{
  enable(guest);
  for(const event of [input({elementId:'project.open',projectId:'foreign-project'}),input({elementId:'document.open',documentId:'foreign-document'}),input({elementId:'viewer.zoom.change',documentId:'foreign-viewer-document'})]){
   const response=await POST(request(cookie,event));assert.equal(response.status,403);
  }
  assert.equal(reviewInteractionReport(admin).totalEvents,0);
 });
});
test('rate limits remain bounded and stable ACK retries succeed even after reaching the actor rate limit',async()=>{
 await fixture(async({admin,guest})=>{
  enable(guest);const first=input();recordReviewInteraction(guest,first);
  for(let i=1;i<120;i++)recordReviewInteraction(guest,input());
  assert.throws(()=>recordReviewInteraction(guest,input()),fails(429));
  assert.deepEqual(recordReviewInteraction(guest,first),{eventId:first.eventId,taxonomyVersion:2,duplicate:true});
  assert.equal(reviewInteractionReport(admin).totalEvents,120);
 });
});
test('optional insert failure has no ACK or partial evidence; retry can reuse the original event reference',async()=>{
 await fixture(async({admin,guest,cookie,erpFile})=>{
  enable(guest);reviewInteractionReport(admin);let db=new DatabaseSync(erpFile);
  try{db.exec("CREATE TRIGGER fail_interaction BEFORE INSERT ON review_interactions BEGIN SELECT RAISE(ABORT,'synthetic'); END;");}finally{db.close();}
  const event=input();assert.equal((await POST(request(cookie,event))).status,503);assert.equal(reviewInteractionReport(admin).totalEvents,0);
  db=new DatabaseSync(erpFile);try{assert.equal(db.prepare('SELECT count(*) AS n FROM review_interaction_rate').get()!.n,0);db.exec('DROP TRIGGER fail_interaction');}finally{db.close();}
  assert.equal((await POST(request(cookie,event))).status,200);assert.equal(reviewInteractionReport(admin).totalEvents,1);
 });
});
test('protected combined report isolates review and tenant, retains legacy v1 separately and bounds cap/retention evidence',async()=>{
 await fixture(async({admin,guest,cookie,adminCookie,erpFile})=>{
  enable(guest);recordReviewInteraction(guest,input());const db=new DatabaseSync(erpFile),now=Date.now();
  try{
   db.exec('BEGIN IMMEDIATE');const add=db.prepare('INSERT INTO review_interactions VALUES(?,?,?,?,?,?,?,?)');
   for(let i=0;i<10002;i++){const event=input();add.run(admin.tenantId,guest.review!.id,guest.id,event.eventId,event.elementId,JSON.stringify(event),'synthetic',now-10000+i);}
   const old=input();add.run(admin.tenantId,guest.review!.id,guest.id,old.eventId,old.elementId,JSON.stringify(old),'synthetic',now-91*86400000);
   const foreign=input();add.run('tenant-two','foreign-review','foreign-guest',foreign.eventId,foreign.elementId,JSON.stringify(foreign),'synthetic',now);
   db.exec('COMMIT');
  }finally{db.close();}
  const report=reviewInteractionReport(admin);assert.equal(report.totalEvents,10000);assert.equal(report.events.length,200);assert.equal(report.coverage.prunedByCap,3);assert.equal(report.coverage.prunedByRetention,1);
  assert.equal(reviewInteractionReport(admin,{reviewId:'foreign-review'}).totalEvents,0);
  const response=await GET(request(adminCookie,undefined,'?reviewId='+guest.review!.id));assert.equal(response.status,200);assert.equal((await response.json()).interactions.totalEvents,10000);
  assert.equal((await GET(request(cookie))).status,403);assert.equal((await GET(request(adminCookie,undefined,'?tenantId=tenant-two'))).status,422);
  for(const role of ['guest','staff','client','vendor'] as const)assert.throws(()=>reviewInteractionReport({...admin,role}),(e:unknown)=>e instanceof AuthError&&e.status===403);
 });
});

test('revocation observed after optional insertion rolls back its event and ACK before commit',async t=>{
 await fixture(async({admin,guest,cookie,authFile})=>{
  enable(guest);const original=DatabaseSync.prototype.prepare;
  t.mock.method(DatabaseSync.prototype,'prepare',function(this:DatabaseSync,sql:string){
   const statement=original.call(this,sql);
   if(sql.startsWith('INSERT INTO review_interactions VALUES')){
    const run=statement.run.bind(statement);
    statement.run=(...args:unknown[])=>{
     const result=Reflect.apply(run,statement,args) as ReturnType<typeof statement.run>,auth=new DatabaseSync(authFile);
     try{auth.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(guest.id);}finally{auth.close();}
     return result;
    };
   }
   return statement;
  });
  assert.equal((await POST(request(cookie,input()))).status,401);
  assert.equal(reviewInteractionReport(admin).totalEvents,0);
 });
});
