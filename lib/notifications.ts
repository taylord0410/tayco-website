import { database, ErpError } from './erp';
import type {Actor} from './auth';
type Job={id:string;tenant_id:string;kind:string;payload:string;attempts:number;created_at:string};
export function notificationConfiguration() {
 const configured=Boolean(process.env.RESEND_API_KEY&&process.env.TAYCO_NOTIFY_EMAIL&&process.env.TAYCO_EMAIL_FROM);
 return {state:configured?'configured':'not_configured',configured,automaticWorker:'operator_managed'};
}
export async function processNotifications(actor:Actor, transport:typeof fetch=fetch, control:{shouldStop?:()=>boolean}={}) {
 if(actor.role!=='admin')throw new ErpError(403,'Only administrators can deliver pending notifications.');
 if(actor.tenantId!==(process.env.TAYCO_NOTIFICATION_TENANT_ID||process.env.TAYCO_PUBLIC_TENANT_ID||'tayco_llc'))throw new ErpError(403,'This delivery destination is not configured for your company.');
 const key=process.env.RESEND_API_KEY,to=process.env.TAYCO_NOTIFY_EMAIL,from=process.env.TAYCO_EMAIL_FROM;
 if(!key||!to||!from)throw new ErpError(503,'Notification delivery is not configured. Requests remain saved in the portal.');
 const db=database(),now=new Date().toISOString(),lease=new Date(Date.now()+300_000).toISOString();
 db.exec('CREATE TABLE IF NOT EXISTS notification_receipts(job_id TEXT PRIMARY KEY,provider_id TEXT NOT NULL,accepted_at TEXT NOT NULL)');
 db.prepare("UPDATE outbox SET status='pending' WHERE tenant_id=? AND status='processing' AND next_attempt_at<?").run(actor.tenantId,now);
  const jobs=db.prepare("SELECT id,tenant_id,kind,payload,attempts,created_at FROM outbox WHERE tenant_id=? AND status='pending' AND next_attempt_at<=? ORDER BY created_at LIMIT 10").all(actor.tenantId,now) as Job[];
 let delivered=0,failed=0;
 for(const job of jobs){
  if(control.shouldStop?.())break;
  // Bound retry age to the provider's idempotency retention window. Uncertain old deliveries require review.
  const age=Date.now()-Date.parse(job.created_at);
  if(!Number.isFinite(age)||age<0||age>23*3600_000){db.prepare("UPDATE outbox SET status='needs_attention',last_error='Delivery window invalid or elapsed; review provider receipt before retry.' WHERE id=? AND status='pending' AND attempts=?").run(job.id,job.attempts);failed++;continue;}
  const claimed=db.prepare("UPDATE outbox SET status='processing',next_attempt_at=?,attempts=attempts+1 WHERE id=? AND status='pending' AND attempts=?").run(lease,job.id,job.attempts);
  if(claimed.changes!==1)continue;
  try{
   const {referenceId,expiresAt}=JSON.parse(job.payload) as {referenceId:string;expiresAt?:string};
   const row=db.prepare('SELECT kind,payload FROM records WHERE id=? AND tenant_id=?').get(referenceId,actor.tenantId) as {kind:string;payload:string}|undefined;
   if(!row)throw new Error('record_missing');
   const data=JSON.parse(row.payload) as Record<string,unknown>;
   const renewal=['document_expiry','document_expiring','document_expired'].includes(job.kind);
   if(renewal&&(row.kind!=='document'||data.status!=='approved'||data.deletedAt||data.expiresAt!==expiresAt)){
    db.prepare("UPDATE outbox SET status='superseded',last_error=NULL WHERE id=? AND status='processing' AND attempts=? AND next_attempt_at=?").run(job.id,job.attempts+1,lease);continue;
   }
   if(!renewal&&job.kind!=='website_request')throw new Error('unsupported_notification_kind');
   const message=renewal?{subject:'TAYCO: document renewal needs review',text:'A document renewal needs review in your TAYCO portal.\nReference: '+referenceId+'\nExpiry: '+expiresAt+'\nSign in to review the current status. No document is attached.'}:{subject:'TAYCO: new '+row.kind+' request',text:'A request is saved in your TAYCO portal.\nReference: '+referenceId+'\nContact: '+String(data.fullName||data.businessName||'Website request')+'\nSign in to review details. Documents are available only through authorized portal access.'};
   const result=await transport('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':job.id},body:JSON.stringify({from,to:[to],...message}),signal:AbortSignal.timeout(10_000)});
   if(!result.ok)throw new Error('provider_rejected');
   const receipt=await result.json() as {id?:unknown};
   if(typeof receipt.id!=='string'||!receipt.id||receipt.id.length>256)throw new Error('provider_receipt_missing');
   db.exec('BEGIN IMMEDIATE');
   try {
    const finished=db.prepare("UPDATE outbox SET status='delivered',last_error=NULL WHERE id=? AND status='processing' AND attempts=? AND next_attempt_at=?").run(job.id,job.attempts+1,lease);
    if(finished.changes===1){db.prepare('INSERT INTO notification_receipts VALUES(?,?,?) ON CONFLICT(job_id) DO UPDATE SET provider_id=excluded.provider_id,accepted_at=excluded.accepted_at').run(job.id,receipt.id,new Date().toISOString());delivered++;}
    db.exec('COMMIT');
   }catch(error){db.exec('ROLLBACK');throw error;}
  }catch{
   const status=job.attempts>=4?'needs_attention':'pending';
   const finished=db.prepare("UPDATE outbox SET status=?,last_error=?,next_attempt_at=? WHERE id=? AND status='processing' AND attempts=? AND next_attempt_at=?").run(status,'Delivery not confirmed; request remains saved.',new Date(Date.now()+60_000*2**job.attempts).toISOString(),job.id,job.attempts+1,lease);if(finished.changes===1)failed++;
  }
 }
 return {delivered,failed,processed:delivered+failed};
}
