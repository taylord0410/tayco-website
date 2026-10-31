import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectAutomationRequest} from '../lib/automation-guard-http';
import {admitGuardRequest} from '../lib/guard-budget';
test('public and private routes bypass unavailable risk DB regardless of forged headers/cookies',()=>{
 const keys=['TAYCO_AUTOMATION_GUARD','TAYCO_GUARD_DB_PATH','TAYCO_APP_URL'];const old=keys.map(k=>process.env[k]);
 try{process.env.TAYCO_AUTOMATION_GUARD='enforce';process.env.TAYCO_GUARD_DB_PATH=__filename+'/invalid/db';process.env.TAYCO_APP_URL='https://tayco.llc';
 for(const path of ['/','/estimate','/gallery','/logo.png','/_next/static/chunk.js','/api/visual-stream?p=/logo.png','/api/auth/session','/api/documents/private.pdf'])
  for(const method of ['GET','HEAD'])assert.deepEqual(inspectAutomationRequest(new Request('https://tayco.llc'+path,{method,headers:{accept:'text/html','user-agent':'HeadlessChrome',cookie:'__Host-tayco_guard_visitor='+'a'.repeat(43)}})),{});
 }finally{keys.forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);}
});
test('cheap quotas are finite and recover after expiry',()=>{
 const request=new Request('http://localhost/api/automation-guard',{headers:{cookie:'tayco_guard_visitor='+'b'.repeat(43)}});
 for(let i=0;i<60;i++)admitGuardRequest(request,10);
 assert.throws(()=>admitGuardRequest(request,11),e=>e instanceof Error && 'status' in e && e.status===429);
 assert.doesNotThrow(()=>admitGuardRequest(request,60_011));
});
