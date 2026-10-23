import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {mkdtempSync,readFileSync} from 'node:fs';import path from 'node:path';import os from 'node:os';
import {backupDatabases} from '../lib/backup';
test('WAL snapshots restore committed state, valid zero/empty values and private account records',async()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'tayco-backup-')),auth=path.join(root,'auth.sqlite'),erp=path.join(root,'erp.sqlite');
 for(const file of [auth,erp]){const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=WAL; CREATE TABLE fixture(id TEXT PRIMARY KEY,payload TEXT)');db.prepare('INSERT INTO fixture VALUES(?,?)').run('synthetic',JSON.stringify({zero:0,items:[],name:"O'Connor",version:2}));db.close();}
 const target=path.join(root,'backup');assert.equal((await backupDatabases(auth,erp,target)).verified,true);
 for(const filename of ['auth.sqlite','erp.sqlite']){const db=new DatabaseSync(path.join(target,filename),{readOnly:true});assert.deepEqual(JSON.parse(String(db.prepare('SELECT payload FROM fixture').get()!.payload)),{zero:0,items:[],name:"O'Connor",version:2});db.close();}
 assert.equal(Object.keys(JSON.parse(readFileSync(path.join(target,'manifest.json'),'utf8')).hashes).length,2);
 await assert.rejects(backupDatabases(auth,erp,target),/never overwritten/);
 await assert.rejects(backupDatabases(auth,path.join(root,'missing.sqlite'),path.join(root,'invalid')),/Both databases/);
});
