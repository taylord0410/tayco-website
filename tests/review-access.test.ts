import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {provisionAdmin,signIn,createInvitation,acceptInvitation,rotateInvitation,revokeInvitation,getActor,requireActor,sessionCookie,AuthError,type Actor} from '../lib/auth';
import {POST as issueRoute,DELETE as revokeRoute} from '../app/api/auth/invitations/route';
import {POST as acceptRoute} from '../app/api/auth/accept-invite/route';
import {POST as loginRoute} from '../app/api/auth/login/route';
import {GET as sessionRoute} from '../app/api/auth/session/route';
import {REVIEW_TTL_MS} from '../lib/review-grants';
import {guestConsoleSnapshot} from '../lib/guest-workspace';
const password='Synthetic-review-password-2026!';
type Invitation=ReturnType<typeof createInvitation>;
const request=(cookie:string)=>new Request('http://tayco.local/portal',{headers:{cookie:'tayco_session='+encodeURIComponent(cookie)}});
const reviewId=(v:Invitation)=>{assert.ok('reviewGrantId' in v);return v.reviewGrantId;};
const fails=(status:number,reason?:string)=>(e:unknown)=>e instanceof AuthError&&e.status===status&&(!reason||e.reasonCode===reason);
async function fixture(run:(f:{admin:Actor;db:()=>DatabaseSync;now:()=>number;at:(v:number)=>void;invite:(email?:string,key?:string)=>Invitation})=>Promise<void>,initial?:number){
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-review-4h-')),old={auth:process.env.TAYCO_AUTH_DB_PATH,erp:process.env.TAYCO_ERP_DB_PATH,secret:process.env.TAYCO_SESSION_SECRET,app:process.env.TAYCO_APP_URL};
 const OriginalDate=Date;let clock=initial??OriginalDate.now();
 globalThis.Date=new Proxy(OriginalDate,{construct(target,args){return Reflect.construct(target,args.length?args:[clock]);},get(target,p,receiver){return p==='now'?()=>clock:Reflect.get(target,p,receiver);}}) as DateConstructor;
 process.env.TAYCO_APP_URL='https://tayco.test';process.env.TAYCO_AUTH_DB_PATH=path.join(folder,'auth.sqlite');process.env.TAYCO_ERP_DB_PATH=path.join(folder,'erp.sqlite');process.env.TAYCO_SESSION_SECRET='synthetic-four-hour-review-secret-'.repeat(3);
 try{
  await provisionAdmin('admin@example.test',password);
  const admin=(await signIn('admin@example.test',password)).actor;
  const db=()=>new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
  await run({admin,db,now:()=>clock,at:v=>{clock=v;},invite:(email='guest@example.test',key='request-reference-0001')=>createInvitation(admin,{email,role:'guest',tenantId:admin.tenantId,projectIds:[],creationRequestId:key})});
 }finally{
  globalThis.Date=OriginalDate;
  for(const [name,value] of Object.entries({TAYCO_AUTH_DB_PATH:old.auth,TAYCO_ERP_DB_PATH:old.erp,TAYCO_SESSION_SECRET:old.secret,TAYCO_APP_URL:old.app})){if(value===undefined)delete process.env[name];else process.env[name]=value;}
  rmSync(folder,{recursive:true,force:true});
 }
}
test('guest generation and retries retain exact four-hour origin; lost links require explicit rotation',async()=>{
 await fixture(async f=>{
  const start=f.now(),first=f.invite();assert.equal(first.expiresAt,start+REVIEW_TTL_MS);assert.ok(first.token&&first.path);
  f.at(start+2*3600_000);
  const retry=f.invite();assert.equal(retry.id,first.id);assert.equal(retry.expiresAt,first.expiresAt);assert.equal(retry.path,undefined);assert.equal(retry.linkState,'link_not_recoverable');
  assert.throws(()=>f.invite('other@example.test'),fails(409));
  const rotated=rotateInvitation(f.admin,first.id,'explicit-rotation-0001');assert.equal(rotated.reviewGrantId,reviewId(first));assert.equal(rotated.expiresAt,first.expiresAt);assert.notEqual(rotated.token,first.token);
  const repeat=rotateInvitation(f.admin,first.id,'explicit-rotation-0001');assert.equal(repeat.path,undefined);assert.equal(repeat.expiresAt,first.expiresAt);
  await assert.rejects(acceptInvitation(first.token,'guest@example.test',password),fails(400));
  const accepted=await acceptInvitation(rotated.token,'guest@example.test',password);assert.equal(accepted.expiresAt,first.expiresAt);
  assert.throws(()=>rotateInvitation(f.admin,first.id,'explicit-rotation-0002'),fails(409));
  const db=f.db();try{assert.throws(()=>db.prepare('UPDATE auth_review_grants SET expires_at=expires_at+1').run(),/immutable/);assert.equal(db.prepare('SELECT count(*) AS n FROM auth_review_grants').get()!.n,1);}finally{db.close();}
 });
});
test('late acceptance, login, cookie refresh and claim replay never extend access',async()=>{
 await fixture(async f=>{
  const start=f.now(),invite=f.invite();
  f.at(start+REVIEW_TTL_MS-0.5*3600_000);
  const first=await acceptInvitation(invite.token,'guest@example.test',password);
  assert.equal(first.expiresAt,start+REVIEW_TTL_MS);
  const actor=await requireActor(request(first.cookie));assert.equal(actor.review?.expiresAt,invite.expiresAt);
  assert.match(sessionCookie(first.cookie,false,first.expiresAt),/Max-Age=1800;/);
  const db=f.db();let originalHash:string;try{originalHash=String(db.prepare("SELECT password_hash FROM auth_users WHERE email='guest@example.test'").get()!.password_hash);}finally{db.close();}
  f.at(start+REVIEW_TTL_MS-0.25*3600_000);
  const replay=await acceptInvitation(invite.token,'guest@example.test',password),login=await signIn('guest@example.test',password);
  assert.equal(replay.expiresAt,invite.expiresAt);assert.equal(login.expiresAt,invite.expiresAt);assert.equal(login.actor.review?.id,actor.review?.id);
  const check=f.db();try{assert.equal(check.prepare("SELECT password_hash FROM auth_users WHERE email='guest@example.test'").get()!.password_hash,originalHash!);assert.equal(check.prepare('SELECT count(*) AS n FROM auth_users').get()!.n,2);const rows=check.prepare("SELECT expires_at FROM auth_sessions WHERE user_id=?").all(actor.id);assert.ok(rows.length>=3);assert.ok(rows.every(s=>s.expires_at===invite.expiresAt));}finally{check.close();}
  f.at(invite.expiresAt);
  assert.equal(await getActor(request(first.cookie)),null);
  await assert.rejects(requireActor(request(first.cookie)),fails(401));
  await assert.rejects(signIn('guest@example.test',password),fails(403,'review_expired'));
 });
});
test('existing guest claims a separate explicit review without changing credentials or migrating old sessions',async()=>{
 await fixture(async f=>{
  const first=f.invite(),old=(await acceptInvitation(first.token,'guest@example.test',password)).cookie;
  const oldActor=await requireActor(request(old));
  f.at(f.now()+3600_000);
  const second=f.invite('guest@example.test','request-reference-0002');
  await assert.rejects(acceptInvitation(second.token,'guest@example.test','Wrong-password-2026!'),fails(401));
  const newer=await acceptInvitation(second.token,'guest@example.test',password),newActor=await requireActor(request(newer.cookie));
  assert.equal(newActor.id,oldActor.id);assert.notEqual(newActor.review?.id,oldActor.review?.id);
  assert.equal((await requireActor(request(old))).review?.id,oldActor.review?.id);
  const adminInvite=f.invite('admin@example.test','request-reference-0003');
  await assert.rejects(acceptInvitation(adminInvite.token,'admin@example.test',password),fails(403));
 });
});
test('revocation cuts accepted sessions and never renews on reauthentication',async()=>{
 await fixture(async f=>{
  const invite=f.invite(),session=await acceptInvitation(invite.token,'guest@example.test',password);
  revokeInvitation(f.admin,invite.id);
  await assert.rejects(requireActor(request(session.cookie)),fails(401));
  await assert.rejects(signIn('guest@example.test',password),fails(403,'review_revoked'));
  revokeInvitation(f.admin,invite.id);
  const db=f.db();try{assert.equal(db.prepare("SELECT count(*) AS n FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE u.role='guest'").get()!.n,0);}finally{db.close();}
 });
});
test('valid session with unavailable grant returns 403; absent authentication wins with 401',async()=>{
 await fixture(async f=>{
  const invite=f.invite(),session=await acceptInvitation(invite.token,'guest@example.test',password);
  const db=f.db();try{db.prepare('UPDATE auth_review_grants SET revoked_at=? WHERE id=?').run(f.now(),reviewId(invite));}finally{db.close();}
  await assert.rejects(requireActor(request(session.cookie)),fails(403,'review_revoked'));
  await assert.rejects(requireActor(new Request('http://tayco.local')),fails(401));
 });
});
test('UTC rollover defaults to grant month summary and denies new-month detail',async()=>{
 await fixture(async f=>{
  const invite=f.invite(),session=await acceptInvitation(invite.token,'guest@example.test',password);
  f.at(Date.UTC(2027,0,1,0,15));
  const actor=await requireActor(request(session.cookie));assert.equal(actor.review?.detailPeriod,'2026-12');
  const summary=guestConsoleSnapshot(actor);assert.equal(summary.period,'2026-12');assert.equal(summary.currentPeriod,'2027-01');assert.equal(summary.detailAllowed,false);
  assert.throws(()=>guestConsoleSnapshot(actor,{period:'2027-01',section:'projects'}),/Not authorized/);
  assert.throws(()=>guestConsoleSnapshot(actor,{section:'projects'}),/Month closed/);
 },Date.UTC(2026,11,31,23,0));
});
test('failed atomic generation leaves no orphan grant, invite or creation audit',async()=>{
 await fixture(async f=>{
  const db=f.db();try{db.exec("CREATE TRIGGER fail_review_invite BEFORE INSERT ON auth_invites BEGIN SELECT RAISE(ABORT,'synthetic storage failure'); END;");}finally{db.close();}
  assert.throws(()=>f.invite(),/synthetic storage failure/);
  const check=f.db();try{assert.equal(check.prepare('SELECT count(*) AS n FROM auth_review_grants').get()!.n,0);assert.equal(check.prepare('SELECT count(*) AS n FROM auth_invites').get()!.n,0);assert.equal(check.prepare("SELECT count(*) AS n FROM auth_audit WHERE event='review.created'").get()!.n,0);}finally{check.close();}
 });
});


test('HTTP guest creation, lost response retry, rotation, late cookie and accepted revocation use the same deadline',async()=>{
 await fixture(async f=>{
  const cookie=sessionCookie((await signIn('admin@example.test',password)).cookie).split(';')[0];
  const req=(body:unknown,session='',method='POST')=>new Request('https://tayco.test/api/auth/invitations',{method,headers:{origin:'https://tayco.test','content-type':'application/json',...(session?{cookie:session}:{})},body:JSON.stringify(body)});
  const body={email:'http-guest@example.test',role:'guest',projectIds:[],creationRequestId:'http-review-request-0001'};
  assert.equal((await issueRoute(req({...body,creationRequestId:undefined},cookie))).status,400);
  assert.equal((await issueRoute(req({...body,expiresInHours:99},cookie))).status,400);
  const first=await issueRoute(req(body,cookie));assert.equal(first.status,201);const issued=(await first.json()).invitation;
  const retry=(await (await issueRoute(req(body,cookie))).json()).invitation;assert.equal(retry.id,issued.id);assert.equal(retry.expiresAt,issued.expiresAt);assert.equal(retry.path,undefined);
  const rotated=(await (await issueRoute(req({action:'rotate',id:issued.id,creationRequestId:'http-review-rotation-0001'},cookie))).json()).invitation;
  assert.equal(rotated.expiresAt,issued.expiresAt);assert.equal(rotated.reviewGrantId,issued.reviewGrantId);
  f.at(issued.expiresAt-20*60_000);
  const accepted=await acceptRoute(req({token:rotated.token,email:body.email,password}));
  assert.equal(accepted.status,200);assert.match(accepted.headers.get('set-cookie')!,/Max-Age=1200;/);
  const guestCookie=accepted.headers.get('set-cookie')!.split(';')[0];
  const current=await sessionRoute(new Request('https://tayco.test/api/auth/session',{headers:{cookie:guestCookie}}));assert.equal(current.status,200);assert.equal((await current.json()).actor.review.expiresAt,issued.expiresAt);
  assert.equal((await revokeRoute(req({id:issued.id},cookie,'DELETE'))).status,200);
  assert.equal((await sessionRoute(new Request('https://tayco.test/api/auth/session',{headers:{cookie:guestCookie}}))).status,401);
  const relogin=await loginRoute(req({email:body.email,password}));assert.equal(relogin.status,403);assert.equal((await relogin.json()).reasonCode,'review_revoked');
 });
});
