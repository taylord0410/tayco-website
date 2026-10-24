import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,cpSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {Worker} from 'node:worker_threads';
import {provisionAdmin,signIn,requireActor,revalidateRequestActor,createInvitation,acceptInvitation,SESSION_COOKIE,AuthError} from '../lib/auth';
import {database} from '../lib/erp';
import {receiveM02 as applyM02,planM02,measurementReview,M02IntakeError} from '../lib/m02-intake';
import {GET} from '../app/api/measurements/route';

test('M02 reception binds real sessions and existing sources without creating financial/project records',{skip:!process.env.TAYCO_M02_CONTRACT_ROOT},async t=>{
 const root=mkdtempSync(path.join(tmpdir(),'tayco-m02-reception-'));
 const keys=['TAYCO_AUTH_DB_PATH','TAYCO_ERP_DB_PATH','TAYCO_SESSION_SECRET','TAYCO_APP_URL','TAYCO_M02_INTAKE_ROOT','TAYCO_M02_BUNDLE_ROOT','TAYCO_M02_SOURCE_MANIFEST_SHA256','TAYCO_M02_ARCHIVE_ROOT','TAYCO_TAKEOFF_RELATIONS_PATH','TAYCO_TAKEOFF_MAPPING_PATH'];
 const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 let fixtureDb:DatabaseSync|undefined;
 const py=(code:string,extra:string[]=[])=>{
  const result=spawnSync(process.env.TAYCO_M02_PYTHON||'python',['-B','-c',code,root,...extra],{encoding:'utf8',timeout:20000,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
  assert.equal(result.status,0,result.stderr);return result.stdout;
 };
 try{
  py("import sys,shutil,json\nfrom pathlib import Path\nsys.path.insert(0,str(Path.cwd()/'tests'))\nimport test_m02_preflight as f\nx=f.PreflightProbes('test_wrong_rotation');x.setUp()\nr=Path(sys.argv[1]);shutil.copytree(x.package_root,r/'producer');shutil.copytree(x.bundle,r/'bundle');x.doCleanups()");
  const packageFile=path.join(root,'producer/package.json'),original=readFileSync(packageFile);
  const source=JSON.parse(readFileSync(path.join(root,'bundle/manifest.json'),'utf8'));
  const sourceManifestSha=createHash('sha256').update(readFileSync(path.join(root,'bundle/manifest.json'))).digest('hex');
  const delivery={...source,bundle_id:'synthetic-current-delivery'};
  cpSync(path.join(root,'bundle'),path.join(root,'delivery-bundle'),{recursive:true});
  writeFileSync(path.join(root,'delivery-bundle/manifest.json'),JSON.stringify(delivery));
  const deliverySha=createHash('sha256').update(JSON.stringify(delivery)).digest('hex');
  const relations={schemaVersion:'takeoff-viewer-relations/v1',bundleId:delivery.bundle_id,relationsId:'relations-'+'b'.repeat(64),manifestSha256:deliverySha,contexts:[{contextKey:'synthetic-context',displayName:'Synthetic source',identityStatus:'resolved',documentIds:['synthetic-doc']}],documents:[{documentId:'synthetic-doc',contextKeys:['synthetic-context'],assetIds:['synthetic-pdf'],kind:'drawing_pdf'}],assets:[{assetId:'synthetic-pdf',documentIds:['synthetic-doc']}]};
  const relationsRaw=JSON.stringify(relations),relationsSha=createHash('sha256').update(relationsRaw).digest('hex');
  writeFileSync(path.join(root,'relations.json'),relationsRaw);
  const mapping={schemaVersion:'tayco-takeoff-viewer-access/v2',bundleId:delivery.bundle_id,relationsSha256:relationsSha,mappings:[{tenantId:'tayco_llc',projectId:'existing-project',contextKey:'synthetic-context',documents:[{viewerDocumentId:'synthetic-doc',erpDocumentId:'existing-document'}]}],guestReviews:[]};
  writeFileSync(path.join(root,'mapping.json'),JSON.stringify(mapping));
  Object.assign(process.env,{TAYCO_AUTH_DB_PATH:path.join(root,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(root,'erp.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_APP_URL:'https://tayco.test',TAYCO_M02_INTAKE_ROOT:path.join(root,'producer'),TAYCO_M02_BUNDLE_ROOT:path.join(root,'bundle'),TAYCO_M02_SOURCE_MANIFEST_SHA256:sourceManifestSha,TAYCO_M02_ARCHIVE_ROOT:path.join(root,'archive'),TAYCO_TAKEOFF_RELATIONS_PATH:path.join(root,'relations.json'),TAYCO_TAKEOFF_MAPPING_PATH:path.join(root,'mapping.json')});
  const password='Synthetic-measurement-reception-only!';await provisionAdmin('m02-admin@example.test',password);
  const login=await signIn('m02-admin@example.test',password);
  const request=(cookie=login.cookie)=>new Request('https://tayco.test/api/measurements?projectId=existing-project',{headers:{cookie:SESSION_COOKIE+'='+encodeURIComponent(cookie)}});
  const admin=await requireActor(request()),db=database(),at='2026-10-24T00:00:00.000Z';
  fixtureDb=db;
  const project={name:'Synthetic measurement project',status:'planning',sourceContextKey:'synthetic-context',budgetUsd:null};
  const document={name:'Synthetic plan',storage:'takeoff_viewer',viewerDocumentId:'synthetic-doc',contextKey:'synthetic-context',sourceSha256:source.documents[0].source_sha256,sourceKind:'drawing_pdf',contentType:'application/pdf',status:'approved',visibility:'owner',bundleId:delivery.bundle_id,manifestSha256:deliverySha,relationsId:relations.relationsId,relationsSha256:relationsSha,registeredSourceIdentity:{bundleId:source.bundle_id,manifestSha256:sourceManifestSha,relationsId:'relations-'+'c'.repeat(64),relationsSha256:'d'.repeat(64)}};
  db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run('existing-project','project','tayco_llc','existing-project',admin.id,JSON.stringify(project),at,at);
  db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run('existing-document','document','tayco_llc','existing-project',admin.id,JSON.stringify(document),at,at);
  const beforeRecords=JSON.stringify(db.prepare('SELECT * FROM records ORDER BY id').all());
  const mutate=(mode:string,value='')=>py("import sys,json\nfrom pathlib import Path\nsys.path.insert(0,str(Path.cwd()/'scripts'))\nimport inspect_m02 as m\nr=Path(sys.argv[1]);p=r/'producer/package.json';d=json.loads(p.read_text());mode=sys.argv[2];v=sys.argv[3]\nif mode=='producer':d['producer']=v\nelif mode=='revision':d['revision']=v\nelif mode=='package':d['packageId']=v\nelif mode=='quantity':d['contexts'][0]['documents'][0]['pages'][0]['regions'][0]['measurements'][0]['quantity']=v\nelif mode=='bad_unit':d['contexts'][0]['documents'][0]['pages'][0]['regions'][0]['measurements'][0]['unit']='m2'\nelif mode=='bad_bounds':d['contexts'][0]['documents'][0]['pages'][0]['regions'][0]['measurements'][0]['geometry']['vertices'][0]['x']='1000'\nelif mode=='bad_pdf':d['contexts'][0]['documents'][0]['pdfSha256']='f'*64;d['contexts'][0]['documents'][0]['pages'][0]['regions'][0]['measurements'][0]['sourceEvidence'][0]['pdfSha256']='f'*64\nelif mode=='bad_page':d['contexts'][0]['documents'][0]['pages'][0]['pageNumber']=99;d['contexts'][0]['documents'][0]['pages'][0]['regions'][0]['measurements'][0]['sourceEvidence'][0]['pageNumber']=99\nelif mode=='bad_region':d['contexts'][0]['documents'][0]['pages'][0]['regions'][0]['measurements'][0]['calibrationRef']['revision']='wrong-region'\nelif mode=='bad_nominal':d['contexts'][0]['documents'][0]['pages'][0]['regions'][0]['calibration']['anchors'][0]['referenceKind']='nominal_scale'\nelif mode=='duplicate_scope':line=d['boqLines'][0].copy();line['lineId']='duplicate-physical-scope';d['boqLines'].append(line)\nelse:raise ValueError('fixture operation')\nc=d['contexts'][0];doc=c['documents'][0]\nfor page in doc['pages']:\n for reg in page['regions']:\n  for x in reg['measurements']:x['stableId']=m.load_contract(Path(__import__('os').environ['TAYCO_M02_CONTRACT_ROOT']))._record_id(d,c,doc,page,reg,x)\nd['boqLines'][0]['measurementRefs'][0]['stableId']=doc['pages'][0]['regions'][0]['measurements'][0]['stableId'];mod=m.load_contract(Path(__import__('os').environ['TAYCO_M02_CONTRACT_ROOT']));d['payloadDigest']=mod._digest({k:v for k,v in d.items() if k!='payloadDigest'});p.write_text(json.dumps(d))",[mode,value]);
  const receiveM02=async(req:Request,file:string,parent?:string)=>{const plan=await planM02(req,file,parent);return applyM02(req,file,plan.planHash,parent);};
  let receiptId='';
  await t.test('only exact authenticated administrator can receive; no actor-object forgery',async()=>{
   await assert.rejects(receiveM02(new Request('https://tayco.test/api/measurements'),packageFile),e=>e instanceof AuthError&&e.status===401);
   assert.throws(()=>revalidateRequestActor({...admin}),e=>e instanceof AuthError&&e.status===403);
   assert.equal(revalidateRequestActor(admin).id,admin.id);
  });
  await t.test('inspection is read-only and a changed reviewed plan cannot be applied',async()=>{
   const plan=await planM02(request(),packageFile);
   assert.equal(plan.archiveCreated,false);assert.equal(plan.operationalRecordsCreated,0);
   assert.equal(existsSync(path.join(root,'archive')),false);
   const cli=spawnSync(process.execPath,['--import','tsx','scripts/import-m02.ts','--package='+packageFile],{encoding:'utf8',timeout:30000,env:{...process.env,TAYCO_M02_ADMIN_EMAIL:'m02-admin@example.test',TAYCO_M02_ADMIN_PASSWORD:password}});
   assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).mode,'inspection');
   assert.equal(existsSync(path.join(root,'archive')),false);
   assert.equal(db.prepare("SELECT name FROM sqlite_schema WHERE name='takeoff_measurement_receipts'").get(),undefined);
   mutate('producer','changed-after-inspection');
   await assert.rejects(applyM02(request(),packageFile,plan.planHash),e=>e instanceof M02IntakeError&&e.status===409);
   writeFileSync(packageFile,original);assert.equal(existsSync(path.join(root,'archive')),false);
  });
  await t.test('actual preparation and transaction create one receipt, not another project or estimate',async()=>{
   const result=await receiveM02(request(),packageFile);receiptId=result.id;
   assert.equal(result.created,1);assert.equal(result.replayed,false);
   assert.equal(JSON.stringify(db.prepare('SELECT * FROM records ORDER BY id').all()),beforeRecords);
   assert.equal(Number(db.prepare('SELECT count(*) AS n FROM takeoff_measurement_receipts').get()!.n),1);
   const review=await measurementReview(request(),'existing-project');
   assert.equal(review.receipts[0].measurements[0].quantity,'2');assert.equal(review.receipts[0].boqLines[0].rate,null);
   assert.match(review.reviewBasis,/Producer reported/);assert.equal(review.receipts[0].current,true);
   assert.equal((await GET(request())).status,200);
  });
  await t.test('lost ACK replay and whitespace-only reserialization preserve the original receipt',async()=>{
   const first=db.prepare('SELECT archive_key,received_at FROM takeoff_measurement_receipts WHERE id=?').get(receiptId);
   writeFileSync(packageFile,Buffer.concat([original,Buffer.from(' \n')]));
   const result=await receiveM02(request(),packageFile);
   assert.equal(result.id,receiptId);assert.equal(result.replayed,true);assert.equal(result.created,0);
   assert.deepEqual(db.prepare('SELECT archive_key,received_at FROM takeoff_measurement_receipts WHERE id=?').get(receiptId),first);
   writeFileSync(packageFile,original);
  });
  await t.test('changed same-revision payload conflicts without partial receipt or financial mutation',async()=>{
   mutate('producer','synthetic-changed');
   await assert.rejects(receiveM02(request(),packageFile),e=>e instanceof M02IntakeError&&e.status===409);
   assert.equal(Number(db.prepare('SELECT count(*) AS n FROM takeoff_measurement_receipts').get()!.n),1);
   assert.equal(JSON.stringify(db.prepare('SELECT * FROM records ORDER BY id').all()),beforeRecords);
   writeFileSync(packageFile,original);
  });
  await t.test('insert failure rolls back receipt, bindings and audit while preparation stays separate',async()=>{
   mutate('package','synthetic-fault-case');
   db.exec("CREATE TRIGGER fixture_m02_failure BEFORE INSERT ON takeoff_measurement_bindings BEGIN SELECT RAISE(ABORT,'synthetic SQL fault'); END");
   const audits=Number(db.prepare("SELECT count(*) AS n FROM audit WHERE action='measurement_package.received'").get()!.n);
   await assert.rejects(receiveM02(request(),packageFile),/synthetic SQL fault/);
   assert.equal(Number(db.prepare('SELECT count(*) AS n FROM takeoff_measurement_receipts').get()!.n),1);
   assert.equal(Number(db.prepare("SELECT count(*) AS n FROM audit WHERE action='measurement_package.received'").get()!.n),audits);
   db.exec('DROP TRIGGER fixture_m02_failure');writeFileSync(packageFile,original);
  });
  await t.test('a source changed by an insert hook rolls back the whole receipt',async()=>{
   mutate('package','synthetic-scope-hook');
   const revoked=JSON.stringify({...document,revokedAt:at}).replaceAll("'","''");
   db.exec("CREATE TRIGGER fixture_m02_scope AFTER INSERT ON takeoff_measurement_receipts BEGIN UPDATE records SET payload='"+revoked+"' WHERE id='existing-document'; END");
   await assert.rejects(receiveM02(request(),packageFile));
   assert.equal(Number(db.prepare('SELECT count(*) AS n FROM takeoff_measurement_receipts').get()!.n),1);
   assert.equal(JSON.stringify(db.prepare('SELECT * FROM records ORDER BY id').all()),beforeRecords);
   db.exec('DROP TRIGGER fixture_m02_scope');writeFileSync(packageFile,original);
  });
  await t.test('wrong PDF/page/region/units/nominal/geometry and double inclusion never reach reception',async()=>{
   for(const mode of ['bad_pdf','bad_page','bad_region','bad_unit','bad_nominal','bad_bounds','duplicate_scope']){
    writeFileSync(packageFile,original);mutate(mode);
    await assert.rejects(receiveM02(request(),packageFile),e=>e instanceof M02IntakeError&&e.status===503);
    assert.equal(Number(db.prepare('SELECT count(*) AS n FROM takeoff_measurement_receipts').get()!.n),1);
   }
   writeFileSync(packageFile,original);
  });
  await t.test('new revisions require exact lineage; retained earlier revisions are never aggregated',async()=>{
   mutate('revision','P2');await assert.rejects(receiveM02(request(),packageFile),e=>e instanceof M02IntakeError&&e.status===409);
   const next=await receiveM02(request(),packageFile,receiptId);
   assert.equal((await receiveM02(request(),packageFile,receiptId)).created,0);
   const review=await measurementReview(request(),'existing-project');
   assert.equal(review.receipts.filter(r=>r.current).length,1);assert.equal(review.receipts.find(r=>r.id===receiptId)!.current,false);
   mutate('revision','P3');await assert.rejects(receiveM02(request(),packageFile,receiptId),e=>e instanceof M02IntakeError&&e.status===409);
   assert.ok(next.id!==receiptId);writeFileSync(packageFile,original);
  });
  await t.test('original identity and active delivery are both required; no lookalike project fallback',async()=>{
   for(const changed of [{...document,registeredSourceIdentity:{...document.registeredSourceIdentity,manifestSha256:'f'.repeat(64)}},{...document,bundleId:'synthetic-wrong-delivery'},{...document,sourceSha256:'f'.repeat(64)},{...document,sourceKind:'reference'},{...document,revokedAt:at}]){
    db.prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(changed),'existing-document');
    await assert.rejects(receiveM02(request(),packageFile));
    await assert.rejects(measurementReview(request(),'existing-project'));
   }
   db.prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(document),'existing-document');
   await assert.rejects(measurementReview(request(),'unknown-project'));
  });
  await t.test('staff may review; guests, another company and staff imports are denied',async()=>{
   const staffInvite=createInvitation(admin,{email:'m02-staff@example.test',role:'staff',tenantId:admin.tenantId,projectIds:[]});
   const staff=await acceptInvitation(staffInvite.token,'m02-staff@example.test',password);
   assert.ok((await measurementReview(request(staff.cookie),'existing-project')).receipts.length);
   await assert.rejects(receiveM02(request(staff.cookie),packageFile),e=>e instanceof AuthError&&e.status===403);
   const guestInvite=createInvitation(admin,{email:'m02-guest@example.test',role:'guest',tenantId:admin.tenantId,projectIds:[]});
   const guest=await acceptInvitation(guestInvite.token,'m02-guest@example.test',password);
   assert.equal((await GET(request(guest.cookie))).status,403);
   const auth=new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
   auth.prepare('UPDATE auth_users SET tenant_id=? WHERE id=?').run('other-company',(await requireActor(request(staff.cookie))).id);auth.close();
   await assert.rejects(measurementReview(request(staff.cookie),'existing-project'));
  });
  await t.test('revocation while waiting on an ERP write lock prevents the commit',async()=>{
   mutate('package','synthetic-lock-case');
   const archiveKey=createHash('sha256').update(readFileSync(packageFile)).digest('hex');
   const worker=new Worker(`const {workerData,parentPort}=require('node:worker_threads');const {DatabaseSync}=require('node:sqlite');const fs=require('node:fs');const erp=new DatabaseSync(workerData.erp);erp.exec('PRAGMA busy_timeout=5000;BEGIN IMMEDIATE');parentPort.postMessage('locked');const started=Date.now();const timer=setInterval(()=>{if(fs.existsSync(workerData.target)||Date.now()-started>15000){clearInterval(timer);setTimeout(()=>{const auth=new DatabaseSync(workerData.auth);auth.exec('DELETE FROM auth_sessions');auth.close();erp.exec('COMMIT');erp.close();parentPort.postMessage('revoked');},200);}},10);`,{eval:true,workerData:{erp:process.env.TAYCO_ERP_DB_PATH,auth:process.env.TAYCO_AUTH_DB_PATH,target:path.join(root,'archive',archiveKey,'received-package.json')}});
   const message=()=>new Promise(resolve=>worker.once('message',resolve));
   assert.equal(await message(),'locked');
   const before=Number(db.prepare('SELECT count(*) AS n FROM takeoff_measurement_receipts').get()!.n);
   await assert.rejects(receiveM02(request(),packageFile),e=>e instanceof AuthError&&e.status===401);
   await new Promise<void>((resolve,reject)=>{worker.once('exit',code=>code===0?resolve():reject(new Error('worker failed')));worker.once('error',reject);});
   assert.equal(Number(db.prepare('SELECT count(*) AS n FROM takeoff_measurement_receipts').get()!.n),before);
  });
 }finally{
  fixtureDb?.close();
  for(const key of keys){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}
  rmSync(root,{recursive:true,force:true});
 }
});
