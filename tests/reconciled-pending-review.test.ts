import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {randomBytes} from "node:crypto";
import {DatabaseSync} from "node:sqlite";
import {provisionAdmin,signIn,createInvitation,acceptInvitation,revokeInvitation,requireActor,AuthError,SESSION_COOKIE,type Actor} from "../lib/auth";
import {reviewForSession,ReviewGrantError} from "../lib/review-grants";

const password="Synthetic-pending-review-only-2026!";
const keys=["TAYCO_AUTH_DB_PATH","TAYCO_ERP_DB_PATH","TAYCO_SESSION_SECRET","TAYCO_APP_URL","TAYCO_INSURER_REVIEW_POLICY"] as const;
const request=(cookie:string)=>new Request("https://pending.synthetic.test/api/auth/session",{headers:{cookie:SESSION_COOKIE+"="+encodeURIComponent(cookie)}});
type Fixture={db:DatabaseSync;admin:Actor;guest:Actor;oldCookie:string;seed:(values?:{email?:string;tenant?:string;profile?:string;sha?:string})=>void};
async function fixture(run:(f:Fixture)=>Promise<void>){
 const root=mkdtempSync(path.join(tmpdir(),"tayco-pending-reconcile-"));
 const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 let db:DatabaseSync|undefined;
 try{
  Object.assign(process.env,{TAYCO_AUTH_DB_PATH:path.join(root,"auth.sqlite"),TAYCO_ERP_DB_PATH:path.join(root,"erp.sqlite"),TAYCO_SESSION_SECRET:randomBytes(48).toString("hex"),TAYCO_APP_URL:"https://pending.synthetic.test"});
  delete process.env.TAYCO_INSURER_REVIEW_POLICY;
  await provisionAdmin("admin@example.test",password);
  const admin=(await signIn("admin@example.test",password)).actor;
  const invite=createInvitation(admin,{email:"guest@example.test",role:"guest",tenantId:admin.tenantId,projectIds:[],creationRequestId:"synthetic-existing-review-0001"});
  assert.ok(invite.token);
  const accepted=await acceptInvitation(invite.token,"guest@example.test",password);
  const guest=await requireActor(request(accepted.cookie));
  db=new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
  const connection=db;
  const seed:Fixture["seed"]=(values={})=>{
   connection.prepare("INSERT INTO auth_pending_guest_reviews(email,tenant_id,created_by,recipient_profile,recipient_policy_sha256,created_at,claimed_grant_id,claimed_at) VALUES(?,?,?,?,?,?,NULL,NULL)")
    .run(values.email??guest.email,values.tenant??guest.tenantId,admin.id,values.profile??"company",values.sha??null,Date.now()-86400000);
  };
  await run({db,admin,guest,oldCookie:accepted.cookie,seed});
 }finally{
  db?.close();
  for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir())+path.sep));
  rmSync(root,{recursive:true,force:true});
 }
}
const count=(db:DatabaseSync,table:string)=>Number(db.prepare("SELECT count(*) AS n FROM "+table).get()!.n);
const pending=(db:DatabaseSync)=>db.prepare("SELECT * FROM auth_pending_guest_reviews WHERE email='guest@example.test'").get()!;
const grants=(db:DatabaseSync)=>JSON.stringify(db.prepare("SELECT * FROM auth_review_grants ORDER BY id").all());

test("committed pending intent creates no grant until signIn, then latches one fresh deadline without migrating old cookies",async()=>fixture(async f=>{
 const beforeGrants=grants(f.db),beforeInvites=count(f.db,"auth_invites");
 f.seed();assert.equal(grants(f.db),beforeGrants);assert.equal(pending(f.db).claimed_grant_id,null);
 const before=Date.now(),first=await signIn(f.guest.email,password),after=Date.now();
 const actor=await requireActor(request(first.cookie));assert.equal(actor.id,f.guest.id);
 assert.notEqual(actor.review?.id,f.guest.review?.id);assert.ok(actor.review);
 const row=f.db.prepare("SELECT * FROM auth_review_grants WHERE id=?").get(actor.review.id)!;
 assert.ok(Number(row.created_at)>=before&&Number(row.created_at)<=after);
 assert.equal(row.accepted_at,row.created_at);assert.equal(pending(f.db).claimed_at,row.created_at);
 assert.notEqual(row.created_at,pending(f.db).created_at);
 assert.equal(actor.review.expiresAt,row.expires_at);assert.equal(first.expiresAt,row.expires_at);
 assert.equal((await requireActor(request(f.oldCookie))).review?.id,f.guest.review?.id);
 assert.equal(count(f.db,"auth_invites"),beforeInvites+1);
 const frozen=JSON.stringify(row),next=await signIn(f.guest.email,password);
 assert.equal(next.actor.review?.id,actor.review.id);assert.equal(next.expiresAt,first.expiresAt);
 assert.equal(JSON.stringify(f.db.prepare("SELECT * FROM auth_review_grants WHERE id=?").get(actor.review.id)),frozen);
 assert.equal(count(f.db,"auth_invites"),beforeInvites+1);
 assert.throws(()=>reviewForSession(f.db,actor,actor.review!.id,actor.review!.expiresAt),e=>e instanceof ReviewGrantError&&e.reasonCode==="review_expired");
}));

test("wrong password cannot claim a pending intent or add a grant",async()=>fixture(async f=>{
 f.seed();const before=grants(f.db);
 await assert.rejects(signIn(f.guest.email,"Incorrect-synthetic-password!"),e=>e instanceof AuthError&&e.status===401);
 assert.equal(pending(f.db).claimed_grant_id,null);assert.equal(grants(f.db),before);
}));

test("disabled persisted account cannot claim a pending intent",async()=>fixture(async f=>{
 f.seed();const before=grants(f.db);
 f.db.prepare("UPDATE auth_users SET disabled=1 WHERE id=?").run(f.guest.id);
 await assert.rejects(signIn(f.guest.email,password),e=>e instanceof AuthError&&e.status===401);
 assert.equal(pending(f.db).claimed_grant_id,null);assert.equal(grants(f.db),before);
 await assert.rejects(requireActor(request(f.oldCookie)),e=>e instanceof AuthError&&e.status===401);
}));

for(const mismatch of ["email","tenant"] as const){
 test("pending "+mismatch+" mismatch cannot replace the existing persisted review",async()=>fixture(async f=>{
  f.seed(mismatch==="email"?{email:"different@example.test"}:{tenant:"different-company"});
  const before=grants(f.db),login=await signIn(f.guest.email,password);
  assert.equal(login.actor.review?.id,f.guest.review?.id);assert.equal(grants(f.db),before);
  assert.equal(f.db.prepare("SELECT claimed_grant_id FROM auth_pending_guest_reviews").get()!.claimed_grant_id,null);
 }));
}

test("non-guest persisted role never consumes its matching pending row",async()=>fixture(async f=>{
 f.seed({email:f.admin.email});const before=grants(f.db);
 const login=await signIn(f.admin.email,password);assert.equal(login.actor.role,"admin");assert.equal(login.actor.review,undefined);
 assert.equal(grants(f.db),before);assert.equal(f.db.prepare("SELECT claimed_grant_id FROM auth_pending_guest_reviews").get()!.claimed_grant_id,null);
}));

test("two actual signIns share one pending claim and immutable result",async()=>fixture(async f=>{
 f.seed();const before=count(f.db,"auth_review_grants");
 const [a,b]=await Promise.all([signIn(f.guest.email,password),signIn(f.guest.email,password)]);
 assert.ok(a.actor.review);assert.equal(a.actor.review.id,b.actor.review?.id);assert.equal(a.expiresAt,b.expiresAt);
 assert.equal(count(f.db,"auth_review_grants"),before+1);
 assert.equal((await requireActor(request(a.cookie))).review?.id,(await requireActor(request(b.cookie))).review?.id);
}));

test("revoking a claimed pending review denies reauthentication rather than minting a replacement",async()=>fixture(async f=>{
 f.seed();const login=await signIn(f.guest.email,password);assert.ok(login.actor.review);
 const row=f.db.prepare("SELECT invite_id,expires_at FROM auth_review_grants WHERE id=?").get(login.actor.review.id)!;
 const before=count(f.db,"auth_review_grants");
 revokeInvitation(f.admin,String(row.invite_id));
 await assert.rejects(signIn(f.guest.email,password),e=>e instanceof AuthError&&e.reasonCode==="review_revoked");
 await assert.rejects(requireActor(request(login.cookie)),e=>e instanceof AuthError&&e.status===401);
 assert.equal(count(f.db,"auth_review_grants"),before);assert.equal(pending(f.db).claimed_grant_id,login.actor.review.id);
 assert.equal(f.db.prepare("SELECT expires_at FROM auth_review_grants WHERE id=?").get(login.actor.review.id)!.expires_at,row.expires_at);
}));

test("SQL failure inside the pending claim rolls back its grant, invitation, marker and review audit",async()=>fixture(async f=>{
 f.seed();const before={grants:grants(f.db),invites:count(f.db,"auth_invites"),reviewAudit:count(f.db,"review_audit_events")};
 f.db.exec("CREATE TRIGGER synthetic_pending_invite_fault BEFORE INSERT ON auth_invites BEGIN SELECT RAISE(ABORT,'synthetic pending SQL fault'); END");
 await assert.rejects(signIn(f.guest.email,password),/synthetic pending SQL fault/);
 assert.equal(grants(f.db),before.grants);assert.equal(count(f.db,"auth_invites"),before.invites);
 assert.equal(count(f.db,"review_audit_events"),before.reviewAudit);assert.equal(pending(f.db).claimed_grant_id,null);
 f.db.exec("DROP TRIGGER synthetic_pending_invite_fault");
}));

test("pending insurer policy without a configured source fails closed at login; claim and session staging are separate boundaries",async()=>fixture(async f=>{
 f.seed({profile:"insurer-a",sha:"f".repeat(64)});
 const before={grants:count(f.db,"auth_review_grants"),sessions:count(f.db,"auth_sessions")};
 await assert.rejects(signIn(f.guest.email,password),e=>e instanceof AuthError&&(e.status===403||e.status===503));
 assert.equal((await requireActor(request(f.oldCookie))).review?.id,f.guest.review?.id);
 console.info(JSON.stringify({syntheticPendingDeniedLogin:true,stagedGrants:count(f.db,"auth_review_grants")-before.grants,stagedSessions:count(f.db,"auth_sessions")-before.sessions,limit:"No claim+cookie activation atomicity or recipient-release approval is asserted."}));
}));
