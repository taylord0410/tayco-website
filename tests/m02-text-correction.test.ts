import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {Worker} from 'node:worker_threads';
import {withM02TextFixture} from './fixtures/m02-text';
import {planM02,receiveM02,measurementReview,planM02TextCorrection,applyM02TextCorrection,M02IntakeError} from '../lib/m02-intake';
import {createInvitation,acceptInvitation,SESSION_COOKIE,AuthError} from '../lib/auth';
const permitted=Boolean(process.env.TAYCO_M02_CONTRACT_ROOT);
const denied=(status:number)=>(e:unknown)=>e instanceof AuthError&&e.status===status||e instanceof M02IntakeError&&e.status===status;
const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function until(check:()=>boolean){const end=Date.now()+15000;while(!check()){if(Date.now()>end)throw Error('Synthetic preparation marker missing.');await delay(10);}}
async function received(f:Parameters<Parameters<typeof withM02TextFixture>[0]>[0]){
 const plan=await planM02(f.request(),f.packageFile);return receiveM02(f.request(),f.packageFile,plan.planHash);
}
function legacy(db:DatabaseSync,id:string){
 // Simulate a pre-fix historical projection ONLY in this new SYNTHETIC database.
 const value=JSON.parse(String(db.prepare('SELECT projection FROM takeoff_measurement_receipts WHERE id=?').get(id)!.projection));
 value.boqLines[0].description='Caf� � source';value.measurements[0].assumptions[0]='Scale � source';
 db.prepare('UPDATE takeoff_measurement_receipts SET projection=? WHERE id=?').run(JSON.stringify(value),id);
 return JSON.stringify(db.prepare('SELECT * FROM takeoff_measurement_receipts WHERE id=?').get(id));
}
function overlayTable(db:DatabaseSync){db.exec('CREATE TABLE IF NOT EXISTS takeoff_measurement_text_overlays(receipt_id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,source_sha TEXT NOT NULL,original_sha TEXT NOT NULL,correction_sha TEXT NOT NULL,corrections TEXT NOT NULL,actor_id TEXT NOT NULL,created_at TEXT NOT NULL)');}
test('M02 UTF8 channel and append-only text correction',{skip:!permitted,timeout:180000},async t=>{
 await t.test('actual preparation overrides hostile locale and preserves CJK/emoji without a correction',()=>withM02TextFixture(async f=>{
  process.env.PYTHONIOENCODING='cp1252';process.env.PYTHONUTF8='0';
  const receipt=await received(f),review=(await measurementReview(f.request(),'existing-project')).receipts[0];
  assert.equal(review.boqLines[0].description,'Café — source 日本 🏗');
  assert.equal(review.measurements[0].assumptions[0],'Scale × source Ω 🏗');
  assert.equal(review.textIntegrity.state,'as_received');
  const plan=await planM02TextCorrection(f.request(),receipt.id,f.packageFile);assert.equal(plan.correctionCount,0);
  await assert.rejects(applyM02TextCorrection(f.request(),receipt.id,f.packageFile,plan.planHash),denied(422));
  assert.equal(f.db.prepare("SELECT name FROM sqlite_master WHERE name='takeoff_measurement_text_overlays'").get(),undefined);
 },true));
 await t.test('source-derived overlay restores legacy fields once and retains every original receipt byte',()=>withM02TextFixture(async f=>{
  const receipt=await received(f),before=legacy(f.db,receipt.id),raw=readFileSync(f.packageFile);
  const plan=await planM02TextCorrection(f.request(),receipt.id,f.packageFile);assert.equal(plan.correctionCount,2);
  assert.equal(f.db.prepare("SELECT name FROM sqlite_master WHERE name='takeoff_measurement_text_overlays'").get(),undefined);
  const corrected=await applyM02TextCorrection(f.request(),receipt.id,f.packageFile,plan.planHash),replay=await applyM02TextCorrection(f.request(),receipt.id,f.packageFile,plan.planHash);
  assert.equal(corrected.created,1);assert.equal(replay.created,0);assert.equal(replay.correctedAt,corrected.correctedAt);
  assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM takeoff_measurement_receipts WHERE id=?').get(receipt.id)),before);
  assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM records ORDER BY id').all()),f.beforeRecords);assert.ok(readFileSync(f.packageFile).equals(raw));
  const view=(await measurementReview(f.request(),'existing-project')).receipts[0];assert.equal(view.boqLines[0].description,'Café — source');assert.equal(view.measurements[0].assumptions[0],'Scale × source');assert.equal(view.measurements[0].quantity,'2');assert.equal(view.boqLines[0].rate,null);assert.equal(view.textIntegrity.correctedFields,2);
  assert.equal(f.db.prepare("SELECT count(*) AS n FROM audit WHERE action='measurement.text_corrected'").get()!.n,1);
 }));
 await t.test('wrong plans, unrelated numerical changes and stored overlay tamper fail closed',()=>withM02TextFixture(async f=>{
  const receipt=await received(f);legacy(f.db,receipt.id);const plan=await planM02TextCorrection(f.request(),receipt.id,f.packageFile);
  await assert.rejects(applyM02TextCorrection(f.request(),receipt.id,f.packageFile,'0'.repeat(64)),denied(409));
  const saved=String(f.db.prepare('SELECT projection FROM takeoff_measurement_receipts WHERE id=?').get(receipt.id)!.projection),changed=JSON.parse(saved);changed.measurements[0].quantity='999';
  f.db.prepare('UPDATE takeoff_measurement_receipts SET projection=? WHERE id=?').run(JSON.stringify(changed),receipt.id);await assert.rejects(planM02TextCorrection(f.request(),receipt.id,f.packageFile),denied(409));f.db.prepare('UPDATE takeoff_measurement_receipts SET projection=? WHERE id=?').run(saved,receipt.id);
  await applyM02TextCorrection(f.request(),receipt.id,f.packageFile,plan.planHash);f.db.prepare('UPDATE takeoff_measurement_text_overlays SET correction_sha=? WHERE receipt_id=?').run('0'.repeat(64),receipt.id);
  await assert.rejects(measurementReview(f.request(),'existing-project'),denied(503));await assert.rejects(applyM02TextCorrection(f.request(),receipt.id,f.packageFile,plan.planHash),denied(409));
 }));
 await t.test('actual roles and tenant guard run before private preparation',()=>withM02TextFixture(async f=>{
  const receipt=await received(f);legacy(f.db,receipt.id);
  await assert.rejects(planM02TextCorrection(new Request('https://tayco.test'),receipt.id,'C:/not-a-source'),denied(401));
  const invite=createInvitation(f.admin,{email:'text-staff@example.test',role:'staff',tenantId:f.admin.tenantId,projectIds:[]}),staff=await acceptInvitation(invite.token,'text-staff@example.test',f.password),request=new Request('https://tayco.test/api/measurements',{headers:{cookie:SESSION_COOKIE+'='+encodeURIComponent(staff.cookie)}});
  await assert.rejects(planM02TextCorrection(request,receipt.id,'C:/not-a-source'),denied(403));await assert.rejects(applyM02TextCorrection(request,receipt.id,'C:/not-a-source','0'.repeat(64)),denied(403));
  const auth=new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);auth.prepare('UPDATE auth_users SET tenant_id=? WHERE id=?').run('other-company',f.admin.id);auth.close();
  await assert.rejects(planM02TextCorrection(f.request(),receipt.id,'C:/not-a-source'),denied(404));
 }));
 await t.test('SQL faults, post-insert session revocation and source changes roll back overlay and audit',()=>withM02TextFixture(async f=>{
  const receipt=await received(f),before=legacy(f.db,receipt.id),plan=await planM02TextCorrection(f.request(),receipt.id,f.packageFile);overlayTable(f.db);
  f.db.exec("CREATE TRIGGER text_fault BEFORE INSERT ON takeoff_measurement_text_overlays BEGIN SELECT RAISE(ABORT,'synthetic text SQL fault'); END");
  await assert.rejects(applyM02TextCorrection(f.request(),receipt.id,f.packageFile,plan.planHash),/synthetic text SQL fault/);f.db.exec('DROP TRIGGER text_fault');
  f.db.function('invalidate_text_session',()=>{const auth=new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);auth.exec('DELETE FROM auth_sessions');auth.close();return 0;});
  f.db.exec('CREATE TRIGGER text_revoke AFTER INSERT ON takeoff_measurement_text_overlays BEGIN SELECT invalidate_text_session(); END');
  await assert.rejects(applyM02TextCorrection(f.request(),receipt.id,f.packageFile,plan.planHash),denied(401));f.db.exec('DROP TRIGGER text_revoke');
  const request=await f.newRequest(),document=JSON.parse(String(f.db.prepare("SELECT payload FROM records WHERE id='existing-document'").get()!.payload));document.revokedAt=new Date().toISOString();
  f.db.exec("CREATE TRIGGER text_source AFTER INSERT ON takeoff_measurement_text_overlays BEGIN UPDATE records SET payload='"+JSON.stringify(document).replaceAll("'","''")+"' WHERE id='existing-document'; END");
  await assert.rejects(applyM02TextCorrection(request,receipt.id,f.packageFile,plan.planHash),denied(409));f.db.exec('DROP TRIGGER text_source');
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM takeoff_measurement_text_overlays').get()!.n,0);assert.equal(f.db.prepare("SELECT count(*) AS n FROM audit WHERE action='measurement.text_corrected'").get()!.n,0);
  assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM records ORDER BY id').all()),f.beforeRecords);assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM takeoff_measurement_receipts WHERE id=?').get(receipt.id)),before);
 }));
 await t.test('session revoked during observed real Python IO cannot produce a correction plan',()=>withM02TextFixture(async f=>{
  const receipt=await received(f);legacy(f.db,receipt.id);
  const hook=path.join(f.root,'python-hook'),marker=path.join(f.root,'entered'),release=path.join(f.root,'release');mkdirSync(hook);
  writeFileSync(path.join(hook,'sitecustomize.py'),"from pathlib import Path\nimport time\np=Path("+JSON.stringify(marker)+");p.write_text('entered')\nr=Path("+JSON.stringify(release)+")\nend=time.time()+10\nwhile not r.exists() and time.time()<end:time.sleep(.01)\n");
  process.env.PYTHONPATH=hook;const pending=planM02TextCorrection(f.request(),receipt.id,f.packageFile);void pending.catch(()=>{});
  await until(()=>existsSync(marker));const auth=new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);auth.exec('DELETE FROM auth_sessions');auth.close();writeFileSync(release,'ok');
  await assert.rejects(pending,denied(401));assert.equal(f.db.prepare("SELECT name FROM sqlite_master WHERE name='takeoff_measurement_text_overlays'").get(),undefined);
 }));
 await t.test('revocation while ERP lock is held after actual preparation prevents commit',()=>withM02TextFixture(async f=>{
  const receipt=await received(f);legacy(f.db,receipt.id);const plan=await planM02TextCorrection(f.request(),receipt.id,f.packageFile);
  const hook=path.join(f.root,'python-exit-hook'),marker=path.join(f.root,'prepared');mkdirSync(hook);
  writeFileSync(path.join(hook,'sitecustomize.py'),"from pathlib import Path\nimport sys,atexit\nif sys.argv[0].endswith('prepare_m02.py'):atexit.register(lambda:Path("+JSON.stringify(marker)+").write_text('prepared'))\n");process.env.PYTHONPATH=hook;
  const worker=new Worker("const {workerData,parentPort}=require('node:worker_threads'),{DatabaseSync}=require('node:sqlite'),fs=require('node:fs');const db=new DatabaseSync(workerData.erp);db.exec('PRAGMA busy_timeout=5000;BEGIN IMMEDIATE');parentPort.postMessage('locked');const start=Date.now(),timer=setInterval(()=>{if(fs.existsSync(workerData.marker)){clearInterval(timer);setTimeout(()=>{const auth=new DatabaseSync(workerData.auth);auth.exec('DELETE FROM auth_sessions');auth.close();db.exec('COMMIT');db.close();parentPort.postMessage('revoked_after_preparation');},500);}else if(Date.now()-start>70000){clearInterval(timer);db.exec('COMMIT');db.close();parentPort.postMessage('timed_out');}},10);",{eval:true,workerData:{erp:process.env.TAYCO_ERP_DB_PATH,auth:process.env.TAYCO_AUTH_DB_PATH,marker}});
  const exited=new Promise<void>((resolve,reject)=>{worker.once('exit',n=>n===0?resolve():reject(Error('Own worker failed')));worker.once('error',reject);});void exited.catch(()=>{});
  const messages:string[]=[];worker.on('message',x=>messages.push(String(x)));await until(()=>messages.includes('locked'));
  await assert.rejects(applyM02TextCorrection(f.request(),receipt.id,f.packageFile,plan.planHash),denied(401));await exited;
  assert.ok(messages.includes('revoked_after_preparation'));assert.equal(f.db.prepare("SELECT count(*) AS n FROM audit WHERE action='measurement.text_corrected'").get()!.n,0);
 }));
});
