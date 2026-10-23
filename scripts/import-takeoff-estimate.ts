import { readFileSync, mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { signIn, signOut } from '../lib/auth';
import { execute } from '../lib/erp';
import { takeoffEstimateSnapshots } from '../lib/takeoff-estimate-source';

export async function importTakeoffEstimate(args=process.argv.slice(2)){
 const apply=args.includes('--apply'),slug=args.find(arg=>arg.startsWith('--project='))?.slice(10);
 if(!slug||!/^[a-z0-9_]{1,100}$/.test(slug))throw new Error('Provide --project=<Takeoff project slug>; inspection is the default.');
 const root=process.env.TAYCO_ESTIMATE_SOURCE_ROOT;
 if(!root||!path.isAbsolute(root))throw new Error('Set the private absolute Takeoff source root.');
 const scenarioRef=`exports/workspaces/${slug}/.takeoff_scenario.json`,reportRef=`exports/REPORTE_EJECUTIVO_${slug.toUpperCase()}_BOQ_CSI32.html`;
 const apuRef=`exports/workspaces/${slug}/.takeoff_apu_procurement.json`;
 const sources=[scenarioRef,reportRef,apuRef].map(reference=>{const file=path.join(root,reference);if(statSync(file).size>10*1024*1024)throw new Error('Estimate source exceeds the supported size.');return {reference,bytes:readFileSync(file)};});
 const capturedAt=new Date().toISOString();
 const rows=takeoffEstimateSnapshots({projectId:'inspection-only',projectSlug:slug,scenario:sources[0],report:sources[1],apu:sources[2],capturedAt});
 if(!apply){console.log(JSON.stringify({mode:'inspection',project:slug,revisions:rows.map(row=>({version:row.version,sourceSha256:row.sourceSha256,estimatedOn:row.estimatedOn,amountUsd:row.amountUsd,directCostUsd:row.directCostUsd,breakdownReconciled:row.breakdownReconciled})),operationalRecordsCreated:0}));return;}
 const folder=process.env.TAYCO_ESTIMATE_ARCHIVE_DIR;
 if(!folder||!path.isAbsolute(folder))throw new Error('Set a private absolute estimate archive directory before applying.');
 const session=await signIn(process.env.TAYCO_ESTIMATE_ADMIN_EMAIL,process.env.TAYCO_ESTIMATE_ADMIN_PASSWORD);
 try{
  if(session.actor.role!=='admin')throw new Error('An active administrator is required.');
  mkdirSync(folder,{recursive:true,mode:0o700});
  for(const source of sources){
   const sha=createHash('sha256').update(source.bytes).digest('hex'),destination=path.join(folder,sha+path.extname(source.reference));
   if(!existsSync(destination))writeFileSync(destination,source.bytes,{flag:'wx',mode:0o600});
   if(createHash('sha256').update(readFileSync(destination)).digest('hex')!==sha)throw new Error('Private source archive verification failed. No estimate imported.');
  }
  const project=execute(session.actor,randomUUID(),{action:'restore_estimate_project',sourceProjectSlug:slug,name:rows[0].projectName});
  const imported=rows.map(row=>execute(session.actor,randomUUID(),{action:'import_project_estimate',projectId:project.id,estimate:{...row,projectId:project.id}}));
  console.log(JSON.stringify({mode:'applied',projectId:project.id,revisionCount:imported.length,privateArchiveVerified:true,financialTransactionsCreated:0,remoteSync:false}));
 }finally{await signOut(new Request('http://localhost/',{headers:{cookie:'tayco_session='+encodeURIComponent(session.cookie)}}));}
}
if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url))importTakeoffEstimate().catch(error=>{console.error(error instanceof Error?error.message:'Estimate recovery failed.');process.exitCode=1;});
