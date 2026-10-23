import {DatabaseSync,backup} from 'node:sqlite';
import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
export async function backupDatabases(authPath:string,erpPath:string,destination:string){
 if(!existsSync(authPath)||!existsSync(erpPath))throw new Error('Both databases must exist. No partial backup is accepted.');
 if(existsSync(destination))throw new Error('Choose a new backup directory; existing backups are never overwritten.');
 mkdirSync(destination,{recursive:true,mode:0o700});
 const hashes:Record<string,string>={};
 for(const [name,source] of [['auth.sqlite',authPath],['erp.sqlite',erpPath]]){
  const db=new DatabaseSync(source,{readOnly:true});const target=path.join(destination,name);
  try{await backup(db,target);}finally{db.close();}
  const restored=new DatabaseSync(target,{readOnly:true});
  try{const row=restored.prepare('PRAGMA quick_check').get();if(row?.quick_check!=='ok')throw new Error('Backup integrity check failed.');}finally{restored.close();}
  hashes[name]=createHash('sha256').update(readFileSync(target)).digest('hex');
 }
 writeFileSync(path.join(destination,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),hashes,scope:'Account and ERP SQLite snapshots. Run during confirmed maintenance for cross-database consistency. Blob objects and private upload-intent journals require separate retention.'},null,2),{mode:0o600});
 return {verified:true,files:Object.keys(hashes)};
}
