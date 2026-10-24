import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes,randomUUID } from 'node:crypto';
import { mkdtempSync,rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { AuthError,type Actor,provisionAdmin,createSession,createInvitation,rotateInvitation,acceptInvitation,requireActor,revokeInvitation,signOut,signIn,sessionCookie } from '../lib/auth';
import { reviewAuditReport } from '../lib/review-audit';
import { GET } from '../app/api/review-audit/route';
async function fixture(run:(x:{admin:Actor;adminCookie:string;filename:string})=>Promise<void>){
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-audit-auth-'));
 const env={TAYCO_AUTH_DB_PATH:path.join(folder,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(folder,'erp.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_APP_URL:'https://tayco.test'};
 const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));Object.assign(process.env,env);
 try{
  const id=await provisionAdmin('admin@example.test','Synthetic-audit-admin-password!','tenant-one');
  const admin:Actor={id,email:'admin@example.test',role:'admin',tenantId:'tenant-one',projectIds:[]};
  const adminCookie=await createSession(id);await run({admin,adminCookie,filename:env.TAYCO_AUTH_DB_PATH});
 }finally{for(const[k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}rmSync(folder,{recursive:true,force:true});}
}
function request(cookie?:string,query=''){return new Request('https://tayco.test/api/review-audit'+query,{headers:cookie?{cookie:sessionCookie(cookie).split(';')[0]}:{}});}
const fails=(status:number)=>(e:unknown)=>e instanceof AuthError&&e.status===status;
const password='Synthetic-audit-guest-password!';
test('grant generation, rotation, claim replay, sessions, signout and accepted revoke persist per-review lifecycle events',async()=>{
 await fixture(async({admin,adminCookie})=>{
  const creationRequestId=randomUUID(),invitation=createInvitation(admin,{email:'guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[],creationRequestId});
  createInvitation(admin,{email:'guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[],creationRequestId});
  const rotated=rotateInvitation(admin,invitation.id,randomUUID());
  const first=await acceptInvitation(rotated.token!,'guest@example.test',password);
  const guest=await requireActor(request(first.cookie));
  assert.equal((await GET(request(first.cookie))).status,403);
  const second=await acceptInvitation(rotated.token!,'guest@example.test',password);
  await signOut(request(first.cookie));assert.equal(await requireActor(request(second.cookie)).then(x=>x.id),guest.id);
  revokeInvitation(admin,invitation.id);
  assert.equal((await GET(request(second.cookie))).status,401);
  const report=reviewAuditReport(admin);
  assert.equal(report.totalEvents,8);
  assert.deepEqual(report.counts,[
   {kind:'access.denied',count:1},{kind:'auth.session_started',count:2},{kind:'auth.signout',count:1},{kind:'review.claimed',count:1},
   {kind:'review.created',count:1},{kind:'review.revoked',count:1},{kind:'review.token_rotated',count:1},
  ]);
  assert.equal(report.events.every(e=>e.reviewId===guest.review!.id),true);
  const response=await GET(request(adminCookie,'?reviewId='+guest.review!.id));assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store, private');
  const serialized=JSON.stringify(await response.json());for(const forbidden of [password,'guest@example.test',rotated.token!])assert.equal(serialized.includes(forbidden),false);
  assert.equal((await GET(request(adminCookie,'?tenantId=foreign'))).status,422);
  assert.equal((await GET(request(adminCookie,'?reviewId=one&reviewId=two'))).status,422);
  assert.equal((await GET(request())).status,401);
 });
});
test('an audit insertion fault rolls back both grant generation and accepted revocation before acknowledging success',async()=>{
 await fixture(async({admin,filename})=>{
  let db=new DatabaseSync(filename);try{db.exec("CREATE TRIGGER fail_creation_audit BEFORE INSERT ON review_audit_events WHEN NEW.kind='review.created' BEGIN SELECT RAISE(ABORT,'synthetic creation fault'); END;");}finally{db.close();}
  assert.throws(()=>createInvitation(admin,{email:'guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[]}),fails(503));
  db=new DatabaseSync(filename);try{
   assert.equal(db.prepare('SELECT count(*) AS n FROM auth_review_grants').get()!.n,0);assert.equal(db.prepare('SELECT count(*) AS n FROM auth_invites').get()!.n,0);
   db.exec('DROP TRIGGER fail_creation_audit');
  }finally{db.close();}
  const invitation=createInvitation(admin,{email:'guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[]});
  const accepted=await acceptInvitation(invitation.token,'guest@example.test',password);
  db=new DatabaseSync(filename);try{db.exec("CREATE TRIGGER fail_revoke_audit BEFORE INSERT ON review_audit_events WHEN NEW.kind='review.revoked' BEGIN SELECT RAISE(ABORT,'synthetic revoke fault'); END;");}finally{db.close();}
  assert.throws(()=>revokeInvitation(admin,invitation.id),fails(503));
  assert.equal((await requireActor(request(accepted.cookie))).role,'guest');
  assert.equal(reviewAuditReport(admin).events.some(e=>e.kind==='review.revoked'),false);
  db=new DatabaseSync(filename);try{assert.equal(db.prepare('SELECT revoked_at FROM auth_review_grants').get()!.revoked_at,null);}finally{db.close();}
 });
});
test('a correctly authenticated expired guest records observed expiration without renewing or attributing wrong-password attempts',async t=>{
 await fixture(async({admin})=>{
  const invitation=createInvitation(admin,{email:'guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[]});
  const accepted=await acceptInvitation(invitation.token,'guest@example.test',password),guest=await requireActor(request(accepted.cookie));
  t.mock.method(Date,'now',()=>guest.review!.expiresAt+1);
  await assert.rejects(signIn('guest@example.test',password),fails(403));
  assert.equal(reviewAuditReport(admin).counts.find(x=>x.kind==='review.expired_observed')?.count,1);
  const before=reviewAuditReport(admin).totalEvents;
  await assert.rejects(signIn('guest@example.test','Wrong-synthetic-password!'),fails(401));
  assert.equal(reviewAuditReport(admin).totalEvents,before);
 });
});
test('report route requires a real administrator session and cannot switch the tenant with a selected review ID',async()=>{
 await fixture(async({admin,adminCookie,filename})=>{
  const invitation=createInvitation(admin,{email:'guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[]});
  await acceptInvitation(invitation.token,'guest@example.test',password);
  const otherId=randomUUID(),seed=new DatabaseSync(filename);
  try{seed.prepare('INSERT INTO auth_users VALUES(?,?,?,?,?,?,?,0,?)').run(otherId,'other-admin@example.test','unused-synthetic-fixture-hash','admin','tenant-two','[]',null,Date.now());}finally{seed.close();}
  const otherCookie=await createSession(otherId);
  const response=await GET(request(otherCookie));assert.equal(response.status,200);assert.equal((await response.json()).audit.totalEvents,0);
  assert.equal((await (await GET(request(adminCookie))).json()).audit.totalEvents,3);
  const db=new DatabaseSync(filename);try{assert.equal(db.prepare('SELECT count(*) AS n FROM auth_users').get()!.n,3);}finally{db.close();}
 });
});
