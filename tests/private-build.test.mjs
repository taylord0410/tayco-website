import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {checkPrivateBuild} from '../scripts/check-private-build.mjs';
test('private build guard removes only generated copies and normalizes Windows traces',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'tayco-package-'));
 try {
  await mkdir(path.join(root,'.data'));await writeFile(path.join(root,'.data/auth.sqlite'),'SYNTHETIC ORIGINAL');
  const out=path.join(root,'.next-test');await mkdir(path.join(out,'standalone/.data'),{recursive:true});
  await writeFile(path.join(out,'standalone/.data/auth.sqlite'),'SYNTHETIC COPY');
  await writeFile(path.join(out,'standalone/.env'),'SYNTHETIC CONFIG');
  await writeFile(path.join(out,'route.nft.json'),JSON.stringify({version:1,files:['../../.data/auth.sqlite','..\\..\\.data\\auth.sqlite','../../.env.local','../../node_modules/safe.js']}));
  const result=await checkPrivateBuild(root,'.next-test');assert.equal(result.removedReferences,3);assert.equal(result.removedCopies,2);
  assert.equal(await readFile(path.join(root,'.data/auth.sqlite'),'utf8'),'SYNTHETIC ORIGINAL');
  await assert.rejects(access(path.join(out,'standalone/.data/auth.sqlite')));
  assert.deepEqual(JSON.parse(await readFile(path.join(out,'route.nft.json'),'utf8')).files,['../../node_modules/safe.js']);
  assert.equal((await checkPrivateBuild(root,'.next-test')).removedCopies,0);
  await assert.rejects(checkPrivateBuild(root,'../.data'),/Unsafe/);
 }finally{await rm(root,{recursive:true,force:true});}
});
