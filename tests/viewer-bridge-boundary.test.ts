import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomBytes} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {GET,HEAD,POST} from '../app/api/takeoff-viewer/[[...path]]/route';
test('public legacy bridge signatures never replace account authorization',async()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-revoked-bridge-'));const names=['TAYCO_AUTH_DB_PATH','TAYCO_SESSION_SECRET','TAYCO_TAKEOFF_VIEWER_INTERNAL_URL'];const old=names.map(k=>process.env[k]);
 Object.assign(process.env,{TAYCO_AUTH_DB_PATH:path.join(folder,'auth.sqlite'),TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_TAKEOFF_VIEWER_INTERNAL_URL:'http://127.0.0.1:3023'});
 const previousFetch=globalThis.fetch;let upstreamCalls=0;globalThis.fetch=async()=>{upstreamCalls++;throw new Error('Unauthorized requests must never reach upstream.');};
 try{
  const url=new URL('https://tayco.test/api/takeoff-viewer/api/v1/documents/synthetic');
  // Revoked public key from the old implementation, retained only as a negative regression fixture.
  const legacy=createHmac('sha256','tayco-viewer-bridge-68ba5da0bcfc808a0404b57fe894db557f1fb1fae2c0724177acf68d66aeaaf2').update(url.pathname+url.search).digest('hex');
  for(const [method,handler]of [['GET',GET],['HEAD',HEAD],['POST',POST]] as const){const r=await handler(new Request(url,{method,headers:{'x-tayco-viewer-bridge':legacy}}));assert.equal(r.status,401);}
  assert.equal(upstreamCalls,0);
 }finally{globalThis.fetch=previousFetch;names.forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);assert.equal(path.dirname(folder),tmpdir());rmSync(folder,{recursive:true,force:true});}
});
