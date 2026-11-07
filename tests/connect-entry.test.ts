import test from 'node:test';
import assert from 'node:assert/strict';
import {GET} from '../app/connect/route';
test('Connect entry uses existing origin until custom DNS/TLS health succeeds',async()=>{
 const before=[process.env.TAYCO_CONNECT_ORIGIN,process.env.TAYCO_CONNECT_PUBLIC_ORIGIN];const original=globalThis.fetch;
 try{
  process.env.TAYCO_CONNECT_ORIGIN='https://old.example.test';process.env.TAYCO_CONNECT_PUBLIC_ORIGIN='https://connect.example.test';
  globalThis.fetch=async()=>{throw new Error('DNS pending')};assert.equal((await GET()).headers.get('location'),'https://old.example.test/');
  globalThis.fetch=async(input,init)=>{assert.equal(String(input),'https://connect.example.test/healthz');assert.equal(init?.redirect,'error');return new Response('{}',{status:200});};
  assert.equal((await GET()).headers.get('location'),'https://connect.example.test/');
  delete process.env.TAYCO_CONNECT_PUBLIC_ORIGIN;process.env.TAYCO_CONNECT_ORIGIN='https://user:password@example.test';assert.equal((await GET()).status,503);
 }finally{globalThis.fetch=original;for(const [i,k] of ['TAYCO_CONNECT_ORIGIN','TAYCO_CONNECT_PUBLIC_ORIGIN'].entries()){if(before[i]===undefined)delete process.env[k];else process.env[k]=before[i];}}
});
