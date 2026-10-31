import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {provisionAdmin,signIn,sessionCookie,signOut,createInvitation,acceptInvitation} from '../lib/auth';
import {ensureVisitor,flagVisitor,guardStatus,requestGuardReview,exchangeDebugGrant,guardCookieName} from '../lib/automation-guard';
import {inspectAutomationRequest} from '../lib/automation-guard-http';
import {GET,POST} from '../app/api/admin/security/route';
import {GET as session} from '../app/api/auth/session/route';
test('SG B4 admin authority, browser-bound reviews, revocation and rollback',async t=>{
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-guard-admin-')),origin='http://127.0.0.1:3102';
 const env={TAYCO_GUARD_DB_PATH:path.join(folder,'guard.sqlite'),TAYCO_AUTH_DB_PATH:path.join(folder,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(folder,'erp.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_AUTOMATION_GUARD:'enforce',TAYCO_APP_URL:origin};
 const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));Object.assign(process.env,env);
 const request=(body?:unknown,cookie='',requestOrigin=origin)=>new Request(origin+'/api/admin/security',{method:body===undefined?'GET':'POST',headers:{origin:requestOrigin,'Content-Type':'application/json',cookie},...(body===undefined?{}:{body:JSON.stringify(body)})});
 try{
 const password='Synthetic-local-admin-test-only!';await provisionAdmin('security-admin@example.test',password);
 const logged=await signIn('security-admin@example.test',password),cookie=sessionCookie(logged.cookie).split(';')[0];
 const invitation=createInvitation(logged.actor,{email:'security-staff@example.test',role:'staff',tenantId:logged.actor.tenantId,projectIds:[]});await acceptInvitation(invitation.token,'security-staff@example.test',password);
 const staffCookie=sessionCookie((await signIn('security-staff@example.test',password)).cookie).split(';')[0];
 await t.test('anonymous, wrong role/company and cross-origin cannot administer',async()=>{
  assert.equal((await GET(request())).status,401);assert.equal((await GET(request(undefined,staffCookie))).status,403);const oldTenant=process.env.TAYCO_PUBLIC_TENANT_ID;process.env.TAYCO_PUBLIC_TENANT_ID='other-company';try{assert.equal((await GET(request(undefined,cookie))).status,403);}finally{if(oldTenant===undefined)delete process.env.TAYCO_PUBLIC_TENANT_ID;else process.env.TAYCO_PUBLIC_TENANT_ID=oldTenant;}
  assert.equal((await POST(request({op:'mode',mode:'observe'},cookie,'https://attacker.test'))).status,403);
 });
 const v=ensureVisitor().token;flagVisitor(v,'lab_simulation');const review=requestGuardReview(v,origin);
 assert.equal(requestGuardReview(v,origin).id,review.id);
 let grant:{id:string;token:string};
 await t.test('current admin issues for the requesting browser, and listings expose no bearer secrets',async()=>{
  const r=await POST(request({op:'issue',reviewId:review.id,purpose:'Synthetic browser investigation'},cookie));assert.equal(r.status,201);grant=await r.json();
  const snapshot=await (await GET(request(undefined,cookie))).json();assert.equal(snapshot.reviews[0].id,review.id);assert.equal(snapshot.grants[0].token,undefined);assert.equal(snapshot.grants[0].token_hash,undefined);
  assert.equal(JSON.stringify(snapshot).includes(v),false);assert.equal(JSON.stringify(snapshot).includes(grant.token),false);
  assert.throws(()=>exchangeDebugGrant(grant.token,ensureVisitor().token,origin));
 });
 const debug=exchangeDebugGrant(grant!.token,v,origin);
 await t.test('exception is online-revocable and grants no private account',async()=>{
  assert.equal(guardStatus(v,debug.session,origin).state,'authorized');
  const gc=guardCookieName('visitor')+'='+v+'; '+guardCookieName('debug')+'='+debug.session;
  assert.equal((await session(new Request(origin+'/api/auth/session',{headers:{cookie:gc}}))).status,401);
  assert.equal((await POST(request({op:'revoke',id:grant!.id},cookie))).status,200);assert.equal(guardStatus(v,debug.session,origin).state,'challenge');
  const bytes=readFileSync(env.TAYCO_GUARD_DB_PATH);assert.equal(bytes.includes(Buffer.from(grant!.token)),false);assert.equal(bytes.includes(Buffer.from(debug.session)),false);
 });
 await t.test('persisted rollback only disables risk enforcement, not account authorization',async()=>{
  const headers={cookie:guardCookieName('visitor')+'='+v};const req=new Request(origin+'/api/estimate',{method:'POST',headers});
  assert.equal(inspectAutomationRequest(req).response?.status,403);
  assert.equal((await POST(request({op:'mode',mode:'observe'},cookie))).status,200);
  assert.equal(inspectAutomationRequest(req).response,undefined);assert.equal(guardStatus(v,undefined,origin).mode,'observe');
  assert.equal((await session(new Request(origin+'/api/auth/session'))).status,401);
  assert.equal((await POST(request({op:'mode',mode:'enforce'},cookie))).status,200);assert.equal(inspectAutomationRequest(req).response?.status,403);
  process.env.TAYCO_AUTOMATION_GUARD='observe';assert.equal((await POST(request({op:'mode',mode:'enforce'},cookie))).status,409);process.env.TAYCO_AUTOMATION_GUARD='enforce';
 });
 await t.test('unavailable revocation authority fails closed; public browsing survives',async()=>{
  process.env.TAYCO_GUARD_DB_PATH=env.TAYCO_GUARD_DB_PATH+'/invalid';
  assert.equal((await GET(request(undefined,cookie))).status,503);assert.equal((await POST(request({op:'issue',reviewId:review.id,purpose:'Must fail'},cookie))).status,503);
  assert.throws(()=>exchangeDebugGrant(grant!.token,v,origin));assert.deepEqual(inspectAutomationRequest(new Request(origin+'/')),{});
  process.env.TAYCO_GUARD_DB_PATH=env.TAYCO_GUARD_DB_PATH;
 });
 await t.test('revoked administrator session cannot issue or switch mode',async()=>{
  await signOut(request({},cookie));assert.equal((await POST(request({op:'mode',mode:'observe'},cookie))).status,401);assert.equal((await GET(request(undefined,cookie))).status,401);
 });
 }finally{for(const[k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}assert.equal(path.dirname(folder),tmpdir());rmSync(folder,{recursive:true,force:true});}
});
