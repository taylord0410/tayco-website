import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes,randomUUID } from 'node:crypto';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { type Actor, provisionAdmin,createInvitation,acceptInvitation,requireActor,sessionCookie,createSession,revokeInvitation } from '../lib/auth';
import { guestPrivacy,saveGuestPrivacy,GuestPrivacyError } from '../lib/guest-privacy';
import { GUEST_PRIVACY_VERSION } from '../lib/guest-privacy-contract';
import { recordGuestActivity,guestActivityReport } from '../lib/guest-activity';
import { GET,POST } from '../app/api/guest-privacy/route';
import { POST as activity } from '../app/api/guest-activity/route';
import { clearGuestAnalytics,installGuestPrivacyChoice,guestAnalyticsAllowed,validGuestPrivacy,externalPrivacyWithdrawal } from '../lib/guest-privacy-client';
const value=(optionalAnalytics:boolean)=>({version:GUEST_PRIVACY_VERSION,optionalAnalytics});
const event=()=>({eventId:randomUUID(),elementId:'review.visit'});
const denied=(status:number)=>(e:unknown)=>e instanceof GuestPrivacyError&&e.status===status;
async function fixture(run:(x:{actor:Actor;admin:Actor;cookie:string;adminCookie:string;filename:string;invitation:string})=>Promise<void>){
  const folder=mkdtempSync(path.join(tmpdir(),'tayco-privacy-'));
  const env={TAYCO_AUTH_DB_PATH:path.join(folder,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(folder,'erp.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_APP_URL:'https://tayco.test'};
  const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));Object.assign(process.env,env);
  try{
    const id=await provisionAdmin('admin@example.test','Synthetic-privacy-admin-password!','company-one');
    const admin:Actor={id,email:'admin@example.test',role:'admin',tenantId:'company-one',projectIds:[]};
    const invitation=createInvitation(admin,{email:'guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[]});
    const accepted=await acceptInvitation(invitation.token,'guest@example.test','Synthetic-privacy-guest-password!');
    const cookie=sessionCookie(accepted.cookie).split(';')[0],adminCookie=sessionCookie(await createSession(id)).split(';')[0];
    const actor=await requireActor(new Request('https://tayco.test',{headers:{cookie}}));
    await run({actor,admin,cookie,adminCookie,filename:env.TAYCO_ERP_DB_PATH,invitation:invitation.id});
  }finally{clearGuestAnalytics();for(const[k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}rmSync(folder,{recursive:true,force:true});}
}
function request(cookie?:string,body?:unknown,origin='https://tayco.test'){
 return new Request('https://tayco.test/api/guest-privacy',{method:body===undefined?'GET':'POST',headers:{...(cookie?{cookie}:{}),origin,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
test('unknown/rejected preferences prevent writes; explicit current choice allows future events; withdrawal blocks retry',async()=>{
 await fixture(async({actor,admin,filename})=>{
  assert.equal(guestPrivacy(actor).optionalAnalytics,null);
  assert.throws(()=>recordGuestActivity(actor,event()),denied(403));
  const accepted=saveGuestPrivacy(actor,value(true));assert.equal(accepted.optionalAnalytics,true);
  const sent=event();assert.deepEqual(recordGuestActivity(actor,sent),{duplicate:false});
  saveGuestPrivacy(actor,value(false));assert.throws(()=>recordGuestActivity(actor,sent),denied(403));assert.throws(()=>recordGuestActivity(actor,event()),denied(403));
  assert.equal(guestActivityReport(admin).totalEvents,1);
  const db=new DatabaseSync(filename);try{assert.equal(db.prepare('SELECT count(*) AS n FROM guest_privacy_choices').get()!.n,2);}finally{db.close();}
 });
});
test('preferences are isolated by tenant/account/review and invalidated by notice version',async()=>{
 await fixture(async({actor,filename})=>{
  saveGuestPrivacy(actor,value(true));saveGuestPrivacy(actor,value(true));
  for(const next of [{...actor,id:'other-actor'},{...actor,tenantId:'other-company'},{...actor,review:{...actor.review!,id:'new-review'}}])assert.equal(guestPrivacy(next).optionalAnalytics,null);
  const db=new DatabaseSync(filename);try{
   assert.equal(db.prepare('SELECT count(*) AS n FROM guest_privacy_choices').get()!.n,1);
   db.prepare("UPDATE guest_privacy SET version='old-notice'").run();
  }finally{db.close();}
  assert.equal(guestPrivacy(actor).optionalAnalytics,null);assert.throws(()=>recordGuestActivity(actor,event()),denied(403));
 });
});
test('closed preference schema rejects spoofed identity, text, secret URLs and stale versions',async()=>{
 await fixture(async({actor})=>{
  for(const input of [null,[],{},value(null as never),{...value(true),version:'old'},...['actorId','tenantId','reviewId','text','url','expiresAt'].map(k=>({...value(true),[k]:'forbidden'}))])assert.throws(()=>saveGuestPrivacy(actor,input),denied(400));
  assert.equal(guestPrivacy(actor).optionalAnalytics,null);
 });
});
test('privacy HTTP origin/auth/role guards precede body reads and choice is durable with private responses',async()=>{
 await fixture(async({cookie,adminCookie,actor})=>{
  const anonymous=request(undefined,value(true));assert.equal((await POST(anonymous)).status,401);assert.equal(anonymous.bodyUsed,false);
  const administrative=request(adminCookie,value(true));assert.equal((await POST(administrative)).status,403);assert.equal(administrative.bodyUsed,false);
  const csrf=request(cookie,value(true),'https://evil.test');assert.equal((await POST(csrf)).status,403);assert.equal(csrf.bodyUsed,false);
  assert.equal((await GET(request(adminCookie))).status,403);
  let res=await GET(request(cookie));assert.equal(res.headers.get('cache-control'),'no-store, private');assert.equal((await res.json()).privacy.optionalAnalytics,null);
  res=await POST(request(cookie,value(true)));assert.equal(res.status,200);assert.equal((await res.json()).privacy.reviewId,actor.review!.id);
  assert.equal((await (await GET(request(cookie))).json()).privacy.optionalAnalytics,true);
  const telemetry=new Request('https://tayco.test/api/guest-activity',{method:'POST',headers:{cookie,origin:'https://tayco.test','content-type':'application/json'},body:JSON.stringify(event())});
  assert.equal((await activity(telemetry)).status,200);
  await POST(request(cookie,value(false)));
  const deniedTelemetry=new Request(telemetry.url,{method:'POST',headers:telemetry.headers,body:JSON.stringify(event())});assert.equal((await activity(deniedTelemetry)).status,403);
 });
});
test('expiration and accepted revocation deny preference APIs without changing review access',async t=>{
 await fixture(async({actor,admin,cookie,invitation})=>{
  const before=actor.review!.expiresAt;saveGuestPrivacy(actor,value(true));assert.equal(guestPrivacy(actor).expiresAt,before);
  t.mock.method(Date,'now',()=>before+1);
  assert.throws(()=>saveGuestPrivacy(actor,value(false)),denied(403));assert.equal((await GET(request(cookie))).status,401);
  t.mock.restoreAll();revokeInvitation(admin,invitation);
  assert.equal((await POST(request(cookie,value(true)))).status,401);
 });
});
test('client analytics are off by default, bound to exact review/version and stop at the server deadline',t=>{
 clearGuestAnalytics();assert.equal(guestAnalyticsAllowed('review-one'),false);
 let elapsed=0;t.mock.method(performance,'now',()=>elapsed);
 const choice={version:GUEST_PRIVACY_VERSION,optionalAnalytics:true,reviewId:'review-one',asOf:1000,expiresAt:2000};
 assert.equal(validGuestPrivacy(choice),true);installGuestPrivacyChoice(choice);
 assert.equal(guestAnalyticsAllowed('review-one'),true);assert.equal(guestAnalyticsAllowed('other-review'),false);assert.equal(guestAnalyticsAllowed(null),false);
 elapsed=1000;assert.equal(guestAnalyticsAllowed('review-one'),false);
 installGuestPrivacyChoice({...choice,version:'old'});assert.equal(guestAnalyticsAllowed('review-one'),false);
 clearGuestAnalytics();assert.equal(guestAnalyticsAllowed('review-one'),false);
});

test('withdrawing optional analytics remains available when acceptance changes hit their rate limit',async()=>{
 await fixture(async({actor,cookie})=>{
  for(let i=0;i<30;i++)assert.equal((await POST(request(cookie,value(true)))).status,200);
  assert.equal((await POST(request(cookie,value(true)))).status,429);
  assert.equal((await POST(request(cookie,value(false)))).status,200);
  assert.equal(guestPrivacy(actor).optionalAnalytics,false);
 });
});
test('a preference-history storage fault rolls back the choice instead of acknowledging a partial save',async()=>{
 await fixture(async({actor,filename})=>{
  saveGuestPrivacy(actor,value(true));
  const db=new DatabaseSync(filename);try{db.exec("CREATE TRIGGER fail_privacy_history BEFORE INSERT ON guest_privacy_choices BEGIN SELECT RAISE(ABORT,'synthetic storage fault'); END;");}finally{db.close();}
  assert.throws(()=>saveGuestPrivacy(actor,value(false)),/synthetic storage fault/);
  assert.equal(guestPrivacy(actor).optionalAnalytics,true);
  const check=new DatabaseSync(filename);try{assert.equal(check.prepare('SELECT count(*) AS n FROM guest_privacy_choices').get()!.n,1);}finally{check.close();}
 });
});

test('a withdrawal signal ignores its originating page while other open pages stop collection',()=>{
 assert.equal(externalPrivacyWithdrawal({kind:'withdraw',source:'page-one'},'page-one'),false);
 assert.equal(externalPrivacyWithdrawal({kind:'withdraw',source:'page-one'},'page-two'),true);
 for(const invalid of [null,'withdraw',{}, {kind:'accept',source:'page-one'},{kind:'withdraw',source:123}])assert.equal(externalPrivacyWithdrawal(invalid,'page-two'),false);
});
