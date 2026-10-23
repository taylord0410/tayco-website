import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {backupDatabases} from '../lib/backup';
import {getActor} from '../lib/auth';
import {snapshot} from '../lib/erp';
async function main(){
 const file=process.env.TAYCO_CERT_CONFIG;if(!file||!path.resolve(file).includes(path.sep+'certification-'))throw new Error('Synthetic certification config required.');
 const c=JSON.parse(readFileSync(file,'utf8')),target=path.join(path.dirname(file),'restore-'+Date.now());
 const backup=await backupDatabases(c.authDb,c.erpDb,target);
 Object.assign(process.env,{TAYCO_AUTH_DB_PATH:path.join(target,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(target,'erp.sqlite'),TAYCO_SESSION_SECRET:c.sessionSecret});
 const actor=await getActor(new Request(c.baseUrl,{headers:{cookie:'tayco_session='+encodeURIComponent(c.accounts.client.cookie)}}));
 assert.ok(actor);assert.equal(actor.role,'client');const data=snapshot(actor);
 assert.equal(data.entries.filter(e=>e.kind==='project').length,1);assert.equal(data.entries.find(e=>e.kind==='project')!.id,c.projects[0]);
 const result={verified:backup.verified,restoredSession:true,projectIsolation:true,scope:'Synthetic account and ERP databases restored into a new private path; no operational volumes replaced.'};
 writeFileSync(path.join(path.dirname(file),'restore-report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
main().catch(()=>{console.error('Synthetic restoration verification failed. Inspect private fixture paths.');process.exitCode=1;});
