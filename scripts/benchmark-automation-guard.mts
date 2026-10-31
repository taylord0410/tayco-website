import { performance } from 'node:perf_hooks';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ensureVisitor, guardCookieName } from '../lib/automation-guard';
import { inspectAutomationRequest } from '../lib/automation-guard-http';

if(process.env.NODE_ENV==='production')throw new Error('This benchmark is local only.');
const folder=mkdtempSync(path.join(tmpdir(),'tayco-guard-benchmark-'));
process.env.TAYCO_GUARD_DB_PATH=path.join(folder,'guard.sqlite');
process.env.TAYCO_APP_URL='http://127.0.0.1:3102';
const visitor=ensureVisitor().token;
const request=new Request('http://127.0.0.1:3102/',{headers:{accept:'text/html','sec-fetch-dest':'document',cookie:guardCookieName('visitor')+'='+visitor,'user-agent':'Mozilla/5.0 Chrome/131.0.0.0'}});
const samples:Record<string,number[]>={off:[],observe:[]};
try {
  for(const mode of ['off','observe','off','observe']){
    process.env.TAYCO_AUTOMATION_GUARD=mode;
    for(let i=0;i<20;i++)inspectAutomationRequest(request);
    for(let i=0;i<100;i++){
      const start=performance.now();
      const decision=inspectAutomationRequest(request);
      samples[mode].push(performance.now()-start);
      if(decision.response)throw new Error('The ordinary request was unexpectedly blocked.');
    }
  }
  const percentile=(values:number[],p:number)=>Number([...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1].toFixed(3));
  const result={
    generatedAt:new Date().toISOString(),node:process.version,platform:process.platform,
    scope:'Local synchronous guard decision only; public fast path performs no guard-store I/O. Not HTTP, whole-page latency, production or Web Vitals.',
    request:'Ordinary public document, existing visitor cookie, no incident; warmup20/round, paired off/observe/off/observe,100samples/round.',
    stats:Object.fromEntries(Object.entries(samples).map(([mode,v])=>[mode,{n:v.length,p50Ms:percentile(v,.5),p95Ms:percentile(v,.95),maxMs:Number(Math.max(...v).toFixed(3))}]))
  };
  if(process.argv[2]){const output=path.resolve(process.argv[2]);mkdirSync(path.dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');}
  console.log(JSON.stringify(result,null,2));
} finally {
  if(path.dirname(path.resolve(folder))!==path.resolve(tmpdir()))throw new Error('Unexpected benchmark cleanup target.');
  rmSync(folder,{recursive:true,force:true});
}
