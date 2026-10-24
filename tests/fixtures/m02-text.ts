import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {provisionAdmin,signIn,requireActor,SESSION_COOKIE,type Actor} from '../../lib/auth';
import {database} from '../../lib/erp';
type Fixture={root:string;packageFile:string;original:Buffer;db:ReturnType<typeof database>;admin:Actor;request:()=>Request;newRequest:()=>Promise<Request>;beforeRecords:string;password:string};
export async function withM02TextFixture(action:(f:Fixture)=>Promise<void>,fullUnicode=false){
 const root=mkdtempSync(path.join(tmpdir(),'tayco-m02-text-'));
 const keys=['PYTHONIOENCODING','PYTHONUTF8','PYTHONPATH','TAYCO_AUTH_DB_PATH','TAYCO_ERP_DB_PATH','TAYCO_SESSION_SECRET','TAYCO_APP_URL','TAYCO_M02_INTAKE_ROOT','TAYCO_M02_BUNDLE_ROOT','TAYCO_M02_SOURCE_MANIFEST_SHA256','TAYCO_M02_ARCHIVE_ROOT','TAYCO_TAKEOFF_RELATIONS_PATH','TAYCO_TAKEOFF_MAPPING_PATH','TAYCO_TAKEOFF_MANIFEST_PATH'];
 const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 let fixtureDb:DatabaseSync|undefined;
 const py=(code:string,extra:string[]=[])=>{
  const result=spawnSync(process.env.TAYCO_M02_PYTHON||'python',['-X','utf8','-B','-c',code,root,...extra],{encoding:'utf8',timeout:20000,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',PYTHONIOENCODING:'utf-8:strict',PYTHONUTF8:'1'}});
  assert.equal(result.status,0,result.stderr);return result.stdout;
 };
 try{
  py("import sys,shutil,json\nfrom pathlib import Path\nsys.path.insert(0,str(Path.cwd()/'tests'))\nimport test_m02_preflight as f\nx=f.PreflightProbes('test_wrong_rotation');x.setUp()\nr=Path(sys.argv[1]);shutil.copytree(x.package_root,r/'producer');shutil.copytree(x.bundle,r/'bundle');x.doCleanups()");
  const packageFile=path.join(root,'producer/package.json');
  py("import sys,json,os\nfrom pathlib import Path\nsys.path.insert(0,str(Path.cwd()/'scripts'))\nimport inspect_m02 as m\np=Path(sys.argv[1])/'producer/package.json';d=json.loads(p.read_text());c=d['contexts'][0];doc=c['documents'][0];page=doc['pages'][0];reg=page['regions'][0];row=reg['measurements'][0];row['assumptions']=['Scale '+chr(215)+' source'];d['boqLines'][0]['description']='Caf'+chr(233)+' '+chr(8212)+' source'\nif sys.argv[2]=='full':row['assumptions'][0]+=' '+chr(937)+' '+chr(0x1f3d7);d['boqLines'][0]['description']+=' '+chr(26085)+chr(26412)+' '+chr(0x1f3d7)\nmod=m.load_contract(Path(os.environ['TAYCO_M02_CONTRACT_ROOT']));row['stableId']=mod._record_id(d,c,doc,page,reg,row);d['boqLines'][0]['measurementRefs'][0]['stableId']=row['stableId'];d['payloadDigest']=mod._digest({k:v for k,v in d.items() if k!='payloadDigest'});p.write_text(json.dumps(d,ensure_ascii=False),encoding='utf8')",[fullUnicode?'full':'legacy']);
  const original=readFileSync(packageFile);
  const source=JSON.parse(readFileSync(path.join(root,'bundle/manifest.json'),'utf8'));
  const sourceManifestSha=createHash('sha256').update(readFileSync(path.join(root,'bundle/manifest.json'))).digest('hex');
  const delivery={...source,bundle_id:'synthetic-current-delivery',projects:[{key:'synthetic-context',display_name:'Synthetic source',identity_status:'resolved',document_ids:['synthetic-doc']}],documents:source.documents.map((doc:Record<string,unknown>)=>({...doc,kind:'drawing_pdf'}))};
  cpSync(path.join(root,'bundle'),path.join(root,'delivery-bundle'),{recursive:true});
  writeFileSync(path.join(root,'delivery-bundle/manifest.json'),JSON.stringify(delivery));
  const deliverySha=createHash('sha256').update(JSON.stringify(delivery)).digest('hex');
  const relations={schemaVersion:'takeoff-viewer-relations/v1',bundleId:delivery.bundle_id,relationsId:'relations-'+'b'.repeat(64),manifestSha256:deliverySha,contexts:[{contextKey:'synthetic-context',displayName:'Synthetic source',identityStatus:'resolved',documentIds:['synthetic-doc']}],documents:[{documentId:'synthetic-doc',contextKeys:['synthetic-context'],assetIds:['synthetic-pdf'],kind:'drawing_pdf'}],assets:[{assetId:'synthetic-pdf',documentIds:['synthetic-doc']}]};
  const relationsRaw=JSON.stringify(relations),relationsSha=createHash('sha256').update(relationsRaw).digest('hex');
  writeFileSync(path.join(root,'relations.json'),relationsRaw);
  const mapping={schemaVersion:'tayco-takeoff-viewer-access/v2',bundleId:delivery.bundle_id,relationsSha256:relationsSha,mappings:[{tenantId:'tayco_llc',projectId:'existing-project',contextKey:'synthetic-context',documents:[{viewerDocumentId:'synthetic-doc',erpDocumentId:'existing-document'}]}],guestReviews:[]};
  writeFileSync(path.join(root,'mapping.json'),JSON.stringify(mapping));
  Object.assign(process.env,{TAYCO_AUTH_DB_PATH:path.join(root,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(root,'erp.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_APP_URL:'https://tayco.test',TAYCO_M02_INTAKE_ROOT:path.join(root,'producer'),TAYCO_M02_BUNDLE_ROOT:path.join(root,'bundle'),TAYCO_M02_SOURCE_MANIFEST_SHA256:sourceManifestSha,TAYCO_M02_ARCHIVE_ROOT:path.join(root,'archive'),TAYCO_TAKEOFF_MANIFEST_PATH:path.join(root,'delivery-bundle/manifest.json'),TAYCO_TAKEOFF_RELATIONS_PATH:path.join(root,'relations.json'),TAYCO_TAKEOFF_MAPPING_PATH:path.join(root,'mapping.json')});
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
  const newRequest=async()=>request((await signIn('m02-admin@example.test',password)).cookie);
  await action({root,packageFile,original,db,admin,request,newRequest,beforeRecords,password});
 }finally{
  fixtureDb?.close();
  for(const key of keys){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}
  assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir())+path.sep));rmSync(root,{recursive:true,force:true});
 }
}
