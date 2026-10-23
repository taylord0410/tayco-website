import {readdirSync,readFileSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {del} from '@vercel/blob';
import {database} from '../lib/erp';
async function main(){
 const dir=path.join(path.dirname(process.env.TAYCO_ERP_DB_PATH||path.join(process.cwd(),'.data','tayco-erp.sqlite')),'upload-intents');
 const apply=process.argv.includes('--apply');let registered=0,orphaned=0,deferred=0,cleaned=0;
 let files:string[];try{files=readdirSync(dir);}catch{console.log(JSON.stringify({pending:0}));return;}
 for(const filename of files.filter(n=>/^[a-f0-9-]+\.json$/.test(n))){
  const file=path.join(dir,filename),intent=JSON.parse(readFileSync(file,'utf8')) as {blobPath:string;createdAt:string};
  if(!/^vendor-docs\/(w9|insurance|project)-[a-f0-9-]+\.(pdf|jpg|png)$/.test(intent.blobPath))throw new Error('Unexpected intent path; inspect privately.');
  const record=database().prepare("SELECT id FROM records WHERE kind='document' AND json_extract(payload,'$.blobPath')=?").get(intent.blobPath);
  if(record){registered++;if(apply)unlinkSync(file);continue;}
  if(!Number.isFinite(Date.parse(intent.createdAt))||Date.now()-Date.parse(intent.createdAt)<24*3600_000){deferred++;continue;}
  orphaned++;if(apply){await del(intent.blobPath);unlinkSync(file);cleaned++;}
 }
 console.log(JSON.stringify({dryRun:!apply,registered,orphaned,deferred,cleaned}));
}
main().catch(()=>{console.error('Upload reconciliation could not complete. Private intents retained.');process.exitCode=1;});
