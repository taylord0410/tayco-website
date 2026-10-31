import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {ensureVisitor,flagVisitor,guardStatus,guardCookieName} from '../lib/automation-guard';
import {inspectAutomationRequest} from '../lib/automation-guard-http';
import {GET} from '../app/api/automation-guard/route';
test('SG B5 bounded capacity, degraded store and cheap rejection',async t=>{
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-guard-fault-')),origin='http://127.0.0.1:3102';
 const env={TAYCO_GUARD_DB_PATH:path.join(folder,'guard.sqlite'),TAYCO_APP_URL:origin,TAYCO_AUTOMATION_GUARD:'enforce'};const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));Object.assign(process.env,env);
 const req=(headers:Record<string,string>={})=>new Request(origin+'/api/estimate',{method:'POST',headers:{origin,'content-type':'application/json',...headers}});
 try{
 await t.test('missing or forged visitor starts a session but never executes a mutation',()=>{
  for(const cookie of ['',guardCookieName('visitor')+'='+'z'.repeat(43)]){const probe=inspectAutomationRequest(req({cookie}));assert.equal(probe.response?.status,428);assert.match(probe.cookie!,/HttpOnly/);}
 });
 await t.test('bad origin/type/oversize rejects before accessing an unavailable store',()=>{
  process.env.TAYCO_GUARD_DB_PATH=env.TAYCO_GUARD_DB_PATH+'/invalid';
  assert.equal(inspectAutomationRequest(req({origin:'https://attacker.test'})).response?.status,403);
  assert.equal(inspectAutomationRequest(req({'content-type':'text/plain'})).response?.status,415);
  assert.equal(inspectAutomationRequest(req({'content-length':'20001'})).response?.status,413);
  assert.throws(()=>inspectAutomationRequest(req()));
  assert.deepEqual(inspectAutomationRequest(new Request(origin+'/')),{});
  process.env.TAYCO_AUTOMATION_GUARD='observe';assert.deepEqual(inspectAutomationRequest(req()),{});
  process.env.TAYCO_AUTOMATION_GUARD='enforce';process.env.TAYCO_GUARD_DB_PATH=env.TAYCO_GUARD_DB_PATH;
 });
 await t.test('event cap trims old events; visitor capacity does not evict existing identities',()=>{
  const v=ensureVisitor().token,now=Date.now();const db=new DatabaseSync(env.TAYCO_GUARD_DB_PATH);
  try{db.exec('BEGIN');const event=db.prepare('INSERT INTO guard_events VALUES(?,?,?,?)');for(let n=0;n<5100;n++)event.run('fixture-event-'+n,'fixture','fixture',now-n);db.exec('COMMIT');}finally{db.close();}
  flagVisitor(v,'browser_automation');const check=new DatabaseSync(env.TAYCO_GUARD_DB_PATH);
  try{assert.equal(check.prepare('SELECT COUNT(*) AS n FROM guard_events').get()?.n,5000);check.exec('BEGIN');const add=check.prepare('INSERT INTO guard_visitors VALUES(?,NULL,0,0,0,?)');for(let n=0;n<9999;n++)add.run('fixture-'+n,now+60_000);check.exec('COMMIT');}finally{check.close();}
  assert.throws(()=>ensureVisitor(),e=>e instanceof Error&&'status'in e&&e.status===503);assert.equal(ensureVisitor(v).fresh,false);assert.equal(guardStatus(v,undefined,origin).state,'clear');
 });
 await t.test('SQLite lock waits are bounded and recover without punitive counters',async()=>{
  process.env.TAYCO_GUARD_DB_PATH=path.join(folder,'lock.sqlite');
  const token=ensureVisitor().token;
  const db=new DatabaseSync(process.env.TAYCO_GUARD_DB_PATH!);db.exec('BEGIN IMMEDIATE');
  try{const start=performance.now();const r=await GET(new Request(origin+'/api/automation-guard',{headers:{cookie:guardCookieName('visitor')+'='+token}}));assert.equal(r.status,503);assert.ok(performance.now()-start<2000);}finally{db.exec('ROLLBACK');db.close();}
  assert.equal(guardStatus(token,undefined,origin).retries,0);
 });
 }finally{for(const[k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}assert.equal(path.dirname(folder),tmpdir());rmSync(folder,{recursive:true,force:true});}
});
