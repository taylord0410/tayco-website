import path from 'node:path';
import {backupDatabases} from '../lib/backup';
async function main(){
 if(!process.argv.includes('--maintenance-confirmed'))throw new Error('Stop writes and confirm maintenance with --maintenance-confirmed. Keep the private volume mounted.');
 const auth=process.env.TAYCO_AUTH_DB_PATH||path.join(process.cwd(),'.data','tayco-auth.sqlite');
 const erp=process.env.TAYCO_ERP_DB_PATH||path.join(process.cwd(),'.data','tayco-erp.sqlite');
 const target=process.env.TAYCO_BACKUP_DIR;if(!target)throw new Error('Set TAYCO_BACKUP_DIR to a new private backup directory.');
 console.log(JSON.stringify(await backupDatabases(auth,erp,target)));
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Backup failed.');process.exitCode=1;});
