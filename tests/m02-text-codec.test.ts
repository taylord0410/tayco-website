import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeM02UTF8,m02TextCorrections,applyM02TextCorrections} from '../lib/m02-text-codec';
test('UTF8 pipe decoder preserves Unicode and rejects invalid bytes instead of replacement',()=>{
 const text='Café — Ω 日本 🏗️ e\u0301',raw=Buffer.from(text);
 assert.equal(decodeM02UTF8(Buffer.concat([raw.subarray(0,9),raw.subarray(9,13),raw.subarray(13)])),text);
 for(const bytes of [[0x97],[0xc3],[0xe2,0x28,0xa1],[0xff]])assert.throws(()=>decodeM02UTF8(Uint8Array.from(bytes)));
});
test('legacy text recovery is narrow, immutable and preserves decimal strings',()=>{
 const before={archiveState:'created_verified',boqLines:[{description:'Caf� � source',rate:null,quantity:'9007199254740993'}],measurements:[{assumptions:['Scale � source'],quantity:'0.150'}]};
 const after={...structuredClone(before),archiveState:'existing_verified'};after.boqLines[0].description='Café — source';after.measurements[0].assumptions[0]='Scale × source';
 const raw=JSON.stringify(before),changes=m02TextCorrections(before,after);assert.equal(changes.length,2);
 const restored=applyM02TextCorrections(before,changes);assert.equal(restored.boqLines[0].description,'Café — source');assert.equal(restored.measurements[0].assumptions[0],'Scale × source');
 assert.equal(restored.boqLines[0].quantity,'9007199254740993');assert.equal(restored.measurements[0].quantity,'0.150');assert.equal(JSON.stringify(before),raw);
});
test('text recovery rejects numeric, role, unsupported Unicode and patch-target tamper',()=>{
 const before={archiveState:'created_verified',boqLines:[{description:'�',rate:null}],measurements:[{assumptions:['same'],quantity:'2'}]};
 const target={...structuredClone(before),archiveState:'existing_verified'};target.boqLines[0].description='—';
 const changes=m02TextCorrections(before,target);
 for(const mutate of [(x:typeof target)=>x.measurements[0].quantity='3',(x:typeof target)=>x.measurements[0].assumptions[0]='changed',(x:typeof target)=>x.boqLines[0].description='Ω']){
  const value=structuredClone(target);mutate(value);assert.throws(()=>m02TextCorrections(before,value));
 }
 for(const patch of [[...changes,...changes],[{...changes[0],beforeSha256:'0'.repeat(64)}],[{...changes[0],path:'/measurements/0/quantity'}],[{...changes[0],path:'/__proto__/polluted'}],[{...changes[0],path:'/boqLines/9999/description'}]])assert.throws(()=>applyM02TextCorrections(before,patch));
 assert.deepEqual(m02TextCorrections({...target,archiveState:'created_verified'},target),[]);
});
