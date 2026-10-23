import {setTimeout as delay} from 'node:timers/promises';
import {notificationOperatorPrivately} from '../lib/auth';
import {database} from '../lib/erp';
import {notificationConfiguration,processNotifications} from '../lib/notifications';
import {scanDocumentExpiry} from '../lib/document-lifecycle';

async function main() {
 const args=new Set(process.argv.slice(2));
 if([...args].some(a=>!['--send','--watch','--dry-run'].includes(a))||args.has('--send')&&args.has('--dry-run'))throw new Error('Use --dry-run (default), --send, and optionally --watch.');
 const email=process.env.TAYCO_NOTIFICATION_ADMIN_EMAIL;
 if(!email)throw new Error('Set TAYCO_NOTIFICATION_ADMIN_EMAIL privately to an active administrator.');
 const interval=Number(process.env.TAYCO_NOTIFICATION_INTERVAL_SECONDS||60);
 if(!Number.isInteger(interval)||interval<15||interval>3600)throw new Error('Notification interval must be an integer from15 to3600 seconds.');
 let stopping=false;const controller=new AbortController();const stop=()=>{stopping=true;controller.abort();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
 do {
  // Re-resolve current administrator on every pass; suspension stops unattended delivery.
  const actor=notificationOperatorPrivately(email);
  if(args.has('--send')) {
   scanDocumentExpiry(actor);
   console.log(JSON.stringify({mode:'send',result:await processNotifications(actor,fetch,{shouldStop:()=>stopping})}));
  } else {
   const queue=database().prepare('SELECT status,COUNT(*) AS count FROM outbox WHERE tenant_id=? GROUP BY status').all(actor.tenantId);
   console.log(JSON.stringify({mode:'dry_run',configuration:notificationConfiguration(),queue}));
  }
  if(!args.has('--watch')||stopping)break;
  try{await delay(interval*1000,undefined,{signal:controller.signal});}catch(error){if(!stopping)throw error;}
 }while(!stopping);
}
main().catch(()=>{console.error('Notification worker stopped. Check private administrator, storage and delivery configuration; no credentials were printed.');process.exitCode=1;});

