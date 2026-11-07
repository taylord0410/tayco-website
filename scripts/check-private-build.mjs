import {lstat, readdir, readFile, writeFile, unlink, realpath} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const privatePath = value => value.replaceAll('\\','/').split('/').some(part => part === '.data' || part.startsWith('.env') || /\.(sqlite3?|db)(-wal|-shm|-journal)?$/i.test(part));
export async function checkPrivateBuild(project, dist = '.next') {
  if (!/^\.next(?:-[a-zA-Z0-9-]+)?$/.test(dist)) throw new Error('Unsafe build directory');
  const base=await realpath(project), root=path.join(base,dist);
  if ((await lstat(root)).isSymbolicLink() || await realpath(root)!==root) throw new Error('Build directory must be local');
  const files=[];
  async function walk(dir) {
    for (const entry of await readdir(dir,{withFileTypes:true})) {
      const item=path.join(dir,entry.name);
      if (entry.isSymbolicLink()) throw new Error('Build symlinks require explicit review');
      if(entry.isDirectory()) await walk(item); else if(entry.isFile()) files.push(item);
    }
  }
  await walk(root);
  let removedReferences=0,removedCopies=0,manifests=0;
  for(const file of files.filter(f=>f.endsWith('.nft.json'))) {
    const data=JSON.parse(await readFile(file,'utf8'));
    if(!Array.isArray(data.files) || data.files.some(f=>typeof f!=='string')) throw new Error('Invalid trace manifest');
    const safe=data.files.filter(f=>!privatePath(f));
    removedReferences+=data.files.length-safe.length;manifests++;
    if(safe.length!==data.files.length) await writeFile(file,JSON.stringify({...data,files:safe}));
  }
  const standalone=path.join(root,'standalone');
  for(const file of files) {
    const relative=path.relative(standalone,file);
    if(relative.startsWith('..') || path.isAbsolute(relative) || !privatePath(relative)) continue;
    if((await lstat(file)).isSymbolicLink() || await realpath(file)!==file) throw new Error('Private copy boundary changed');
    await unlink(file);removedCopies++;
  }
  if(!manifests) throw new Error('No build traces found');
  for(const file of files.filter(f=>f.endsWith('.nft.json'))) {
    if(JSON.parse(await readFile(file,'utf8')).files.some(privatePath)) throw new Error('Private trace remains');
  }
  return {manifests,removedReferences,removedCopies,privateReferences:0};
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await checkPrivateBuild(process.cwd(),process.env.NEXT_DIST_DIR||'.next')));
}
