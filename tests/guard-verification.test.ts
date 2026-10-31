import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {NextRequest} from 'next/server';
import {ensureVisitor,flagVisitor,guardStatus,countGuardRetry} from '../lib/automation-guard';
import {verifyChallenge} from '../lib/guard-verification';
import {inspectAutomationRequest} from '../lib/automation-guard-http';
import {receive} from '../app/api/submission';
import {database} from '../lib/erp';
test('SG B3 provider failures, attempts, receipts and recovery',async t=>{
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-verify-'));const origin='http://127.0.0.1:3102';
 const env={TAYCO_GUARD_DB_PATH:path.join(folder,'guard.sqlite'),TAYCO_ERP_DB_PATH:path.join(folder,'erp.sqlite'),TAYCO_TURNSTILE_SECRET_KEY:'fixture-server-key',TAYCO_TURNSTILE_SITE_KEY:'fixture-site-key',TAYCO_AUTOMATION_GUARD:'enforce',TAYCO_APP_URL:origin,TAYCO_DATA_ENCRYPTION_KEY:randomBytes(32).toString('hex')};
 const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));Object.assign(process.env,env);
 const request=new Request(origin+'/api/automation-guard');
 const incident=()=>{const v=ensureVisitor().token;flagVisitor(v,'lab_simulation');return {v,id:guardStatus(v,undefined,origin).incidentId!};};
 const answer=(data:unknown)=>async()=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
 try{
 await t.test('weak signals and repeated navigation do not penalize',()=>{
  const v=ensureVisitor().token;flagVisitor(v,'browser_automation');assert.equal(guardStatus(v,undefined,origin).state,'clear');
  flagVisitor(v,'lab_simulation');for(let i=0;i<10;i++)inspectAutomationRequest(new Request(origin+'/',{headers:{cookie:'tayco_guard_visitor='+v}}));
  assert.equal(guardStatus(v,undefined,origin).retries,0);
  const id=randomUUID();countGuardRetry(v,undefined,origin,Date.now(),id);countGuardRetry(v,undefined,origin,Date.now(),id);assert.equal(guardStatus(v,undefined,origin).retries,1);
 });
 await t.test('network, internal, duplicate-provider and malformed errors never penalize',async()=>{
  const {v,id}=incident();
  for(const provider of [async()=>{throw new Error('offline');},answer({success:false,'error-codes':['internal-error']}),answer({success:false,'error-codes':['timeout-or-duplicate']}),answer({unexpected:true})]){
   await assert.rejects(()=>verifyChallenge(request,v,{incidentId:id,attemptId:randomUUID(),token:'opaque-fixture'},provider),e=>e instanceof Error&&'status'in e&&e.status===503);
   assert.equal(guardStatus(v,undefined,origin).retries,0);
  }
 });
 await t.test('concurrent duplicate requests call provider once and count once',async()=>{
  const {v,id}=incident(),input={incidentId:id,attemptId:randomUUID(),token:'fixture-token'};let finish!:(v:Response)=>void,calls=0;
  const pending=verifyChallenge(request,v,input,async()=>{calls++;return new Promise<Response>(r=>finish=r);});
  await assert.rejects(()=>verifyChallenge(request,v,input,answer({success:false,'error-codes':['invalid-input-response']})),e=>e instanceof Error&&'status'in e&&e.status===503);
  finish(new Response(JSON.stringify({success:false,'error-codes':['invalid-input-response']})));assert.equal(await pending,false);
  assert.equal(await verifyChallenge(request,v,input,async()=>{throw new Error('must not call provider');}),false);
  assert.equal(calls,1);assert.equal(guardStatus(v,undefined,origin).retries,1);
  await assert.rejects(()=>verifyChallenge(request,v,{...input,token:'different'},answer({success:true})),e=>e instanceof Error&&'status'in e&&e.status===409);
 });
 await t.test('three distinct invalid attempts tolerated, fourth temporarily rejects; foreign visitors denied',async()=>{
  const {v,id}=incident();
  for(let n=1;n<=4;n++){
   assert.equal(await verifyChallenge(request,v,{incidentId:id,attemptId:randomUUID(),token:'token-'+n},answer({success:false,'error-codes':['invalid-input-response']})),false);
   assert.equal(guardStatus(v,undefined,origin).state,n===4?'blocked':'challenge');
  }
  const other=ensureVisitor().token;
  await assert.rejects(()=>verifyChallenge(request,other,{incidentId:id,attemptId:randomUUID(),token:'foreign'},answer({success:true})),e=>e instanceof Error&&'status'in e&&e.status===409);
 });
 await t.test('valid server proof binds hostname/action/incident; cached receipt survives response loss',async()=>{
  const {v,id}=incident();
  for(const wrong of [{hostname:'other.test',action:'tayco_verify',cdata:id},{hostname:'127.0.0.1',action:'other',cdata:id}])assert.equal(await verifyChallenge(request,v,{incidentId:id,attemptId:randomUUID(),token:'wrong-'+randomUUID()},answer({success:true,...wrong})),false);
  const input={incidentId:id,attemptId:randomUUID(),token:'valid-fixture'};
  assert.equal(await verifyChallenge(request,v,input,answer({success:true,hostname:'127.0.0.1',action:'tayco_verify',cdata:id})),true);
  assert.equal(guardStatus(v,undefined,origin).state,'clear');
  assert.equal(await verifyChallenge(request,v,input,async()=>{throw new Error('no provider replay');}),true);
 });
 await t.test('unconfigured provider is explicit unavailable with zero penalty',async()=>{
  const {v,id}=incident();delete process.env.TAYCO_TURNSTILE_SECRET_KEY;
  await assert.rejects(()=>verifyChallenge(request,v,{incidentId:id,attemptId:randomUUID(),token:'fixture'}),e=>e instanceof Error&&'status'in e&&e.status===503);
  assert.equal(guardStatus(v,undefined,origin).retries,0);process.env.TAYCO_TURNSTILE_SECRET_KEY=env.TAYCO_TURNSTILE_SECRET_KEY;
 });
 await t.test('lost estimate responses and concurrent duplicate submissions preserve one receipt/outbox/quota',async()=>{
  const key=randomUUID(),body={fullName:'Synthetic recovery',phone:'5550100',email:'recovery@example.test',projectDetails:'Synthetic test; no outbound delivery.'};
  const req=(payload=body)=>new NextRequest(origin+'/api/estimate',{method:'POST',headers:{origin,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(payload)});
  const first=await receive(req(),'estimate');assert.equal(first.status,201);const receipt=await first.json();
  const retries=await Promise.all(Array.from({length:8},()=>receive(req(),'estimate')));
  for(const r of retries){assert.equal(r.status,201);assert.equal((await r.json()).referenceId,receipt.referenceId);}
  assert.equal(database().prepare('SELECT COUNT(*) AS n FROM website_submissions').get()?.n,1);
  assert.equal(database().prepare('SELECT COUNT(*) AS n FROM outbox').get()?.n,1);
  assert.equal(database().prepare("SELECT count FROM public_rate WHERE key='global'").get()?.count,1);
  assert.equal((await receive(req({...body,projectDetails:'Different request'}),'estimate')).status,409);
 });
 }finally{database().close();for(const[k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}assert.equal(path.dirname(folder),tmpdir());rmSync(folder,{recursive:true,force:true});}
});
