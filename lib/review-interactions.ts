import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { AuthError,type Actor,requireRole,revalidateGuestRequestActor } from './auth';
import { installGuestPrivacy,assertGuestAnalytics,GuestPrivacyError } from './guest-privacy';
import { guestConsoleDocument,guestConsoleSnapshot } from './guest-workspace';
import { viewerScope } from './takeoff-viewer-access';
import { parseReviewInteraction,ReviewInteractionError,type ReviewInteractionInput } from './review-interaction-contract';
import {insurerReviewData} from './insurer-review';
export { ReviewInteractionError } from './review-interaction-contract';
function days(){
 const x=process.env.TAYCO_GUEST_ACTIVITY_RETENTION_DAYS;
 if(x===undefined)return 90;
 if(!/^[1-9]\d{0,2}$/.test(x)||Number(x)>365)throw new ReviewInteractionError('Interaction retention is not configured correctly.',503);
 return Number(x);
}
function withDb<T>(run:(db:DatabaseSync)=>T):T{
 const filename=process.env.TAYCO_ERP_DB_PATH||path.join(process.cwd(),'.data','tayco-erp.sqlite');
 mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});const db=new DatabaseSync(filename);
 try{
  db.exec(`PRAGMA busy_timeout=5000;PRAGMA journal_mode=WAL;
   CREATE TABLE IF NOT EXISTS review_interactions(
    tenant_id TEXT NOT NULL,review_id TEXT NOT NULL,actor_id TEXT NOT NULL,event_id TEXT NOT NULL,element_id TEXT NOT NULL,
    payload TEXT NOT NULL,payload_hash TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,review_id,event_id));
   CREATE INDEX IF NOT EXISTS review_interactions_time ON review_interactions(tenant_id,created_at);
   CREATE TABLE IF NOT EXISTS review_interaction_rate(
    tenant_id TEXT NOT NULL,review_id TEXT NOT NULL,actor_id TEXT NOT NULL,event_id TEXT NOT NULL,payload_hash TEXT NOT NULL,created_at INTEGER NOT NULL,
    PRIMARY KEY(tenant_id,review_id,event_id));
   CREATE INDEX IF NOT EXISTS review_interaction_rate_time ON review_interaction_rate(tenant_id,created_at);
   CREATE TABLE IF NOT EXISTS review_interaction_pruning(tenant_id TEXT PRIMARY KEY,retention_pruned INTEGER NOT NULL DEFAULT 0,cap_pruned INTEGER NOT NULL DEFAULT 0);`);
  installGuestPrivacy(db);return run(db);
 }catch(error){
  if(error instanceof ReviewInteractionError||error instanceof GuestPrivacyError||error instanceof AuthError)throw error;
  throw new ReviewInteractionError('Review interaction storage is unavailable.',503);
 }finally{db.close();}
}
function prune(db:DatabaseSync,tenant:string,now:number,retention:number){
 const removed=Number(db.prepare('DELETE FROM review_interactions WHERE tenant_id=? AND created_at<?').run(tenant,now-retention*86400000).changes);
 const capped=Number(db.prepare('DELETE FROM review_interactions WHERE rowid IN(SELECT rowid FROM review_interactions WHERE tenant_id=? ORDER BY created_at DESC,rowid DESC LIMIT -1 OFFSET 10000)').run(tenant).changes);
 db.prepare('INSERT INTO review_interaction_pruning VALUES(?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET retention_pruned=retention_pruned+excluded.retention_pruned,cap_pruned=cap_pruned+excluded.cap_pruned').run(tenant,removed,capped);
 db.prepare('DELETE FROM review_interaction_rate WHERE created_at<=?').run(now-60000);
}
function scope(actor:Actor,input:ReviewInteractionInput){
 if(actor.review?.recipient){
  if(!['review.visit','account.open','session.signout','review.section.select','opportunity.open'].includes(input.elementId)&&!input.elementId.startsWith('viewer.'))throw new ReviewInteractionError('This control is outside the recipient review.',403);
  if(input.elementId==='opportunity.open'&&!insurerReviewData(actor).rows.some(r=>r.id===input.opportunityId))throw new ReviewInteractionError('This opportunity is unavailable.',403);
 }
 if(!actor.review?.recipient&&['review.section.select','opportunity.open'].includes(input.elementId))throw new ReviewInteractionError('This control requires the recipient review.',403);
 if(input.elementId==='project.open'&&!guestConsoleSnapshot(actor,{section:'projects'}).projects.some(p=>p.id===input.projectId))throw new ReviewInteractionError('This project is unavailable for review.',403);
 if(input.elementId==='document.open'){
  try{guestConsoleDocument(actor,input.documentId!);}catch{throw new ReviewInteractionError('This document is unavailable for review.',403);}
 }
 if(input.elementId.startsWith('viewer.')){
  try{if(!viewerScope(actor).documentIds.includes(input.documentId!))throw new Error();}catch{throw new ReviewInteractionError('This reader document is unavailable for review.',403);}
 }
}
export function recordReviewInteraction(actor:Actor,value:unknown){
 requireRole(actor,['guest']);const input=parseReviewInteraction(value),retention=days();
 // A forged DTO cannot mint this memory-only server session capability.
 scope(revalidateGuestRequestActor(actor),input); // Initialize/read scope before taking the optional-store write lock.
 return withDb(db=>{
  db.exec('BEGIN IMMEDIATE');
  try{
   const fresh=revalidateGuestRequestActor(actor),now=Date.now(),review=fresh.review!;
   assertGuestAnalytics(db,fresh,now);scope(fresh,input);assertGuestAnalytics(db,revalidateGuestRequestActor(actor),Date.now());
   const payload=JSON.stringify(input),hash=createHash('sha256').update(payload).digest('hex');
   prune(db,fresh.tenantId,now,retention);
   const prior=db.prepare('SELECT actor_id,payload_hash FROM review_interactions WHERE tenant_id=? AND review_id=? AND event_id=?').get(fresh.tenantId,review.id,input.eventId)
    ??db.prepare('SELECT actor_id,payload_hash FROM review_interaction_rate WHERE tenant_id=? AND review_id=? AND event_id=?').get(fresh.tenantId,review.id,input.eventId);
   if(prior){
    if(prior.actor_id!==fresh.id||prior.payload_hash!==hash)throw new ReviewInteractionError('This event reference was used for different interaction.',409);
    assertGuestAnalytics(db,revalidateGuestRequestActor(actor),Date.now());
    db.exec('COMMIT');return{eventId:input.eventId,taxonomyVersion:2 as const,duplicate:true};
   }
   const actorRate=Number(db.prepare('SELECT count(*) AS n FROM review_interaction_rate WHERE tenant_id=? AND actor_id=?').get(fresh.tenantId,fresh.id)!.n);
   const companyRate=Number(db.prepare('SELECT count(*) AS n FROM review_interaction_rate WHERE tenant_id=?').get(fresh.tenantId)!.n);
   if(actorRate>=120||companyRate>=1200)throw new ReviewInteractionError('Too much optional activity. Please try again shortly.',429);
   db.prepare('INSERT INTO review_interactions VALUES(?,?,?,?,?,?,?,?)').run(fresh.tenantId,review.id,fresh.id,input.eventId,input.elementId,payload,hash,now);
   db.prepare('INSERT INTO review_interaction_rate VALUES(?,?,?,?,?,?)').run(fresh.tenantId,review.id,fresh.id,input.eventId,hash,now);
   prune(db,fresh.tenantId,now,retention);
   assertGuestAnalytics(db,revalidateGuestRequestActor(actor),Date.now());db.exec('COMMIT');
   return{eventId:input.eventId,taxonomyVersion:2 as const,duplicate:false};
  }catch(error){db.exec('ROLLBACK');throw error;}
 });
}
export function reviewInteractionReport(actor:Actor,options:{reviewId?:string}={}){
 requireRole(actor,['admin']);
 if(Object.keys(options).some(k=>k!=='reviewId')||(options.reviewId!==undefined&&!/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(options.reviewId)))throw new ReviewInteractionError('Choose a valid review reference.');
 const now=Date.now(),retention=days();
 return withDb(db=>{
  db.exec('BEGIN IMMEDIATE');try{
   prune(db,actor.tenantId,now,retention);const clause=options.reviewId===undefined?'':' AND review_id=?',args=options.reviewId===undefined?[actor.tenantId]:[actor.tenantId,options.reviewId];
   const rows=db.prepare('SELECT review_id,actor_id,payload,created_at FROM review_interactions WHERE tenant_id=?'+clause+' ORDER BY created_at DESC,rowid DESC LIMIT 200').all(...args);
   const counts=db.prepare('SELECT element_id,count(*) AS n FROM review_interactions WHERE tenant_id=?'+clause+' GROUP BY element_id ORDER BY element_id').all(...args).map(x=>({elementId:String(x.element_id),count:Number(x.n)}));
   const events=rows.map(x=>({...parseReviewInteraction(JSON.parse(String(x.payload)),Number(x.created_at)),reviewId:String(x.review_id),actorId:String(x.actor_id),createdAt:new Date(Number(x.created_at)).toISOString()}));
   const pruned=db.prepare('SELECT retention_pruned,cap_pruned FROM review_interaction_pruning WHERE tenant_id=?').get(actor.tenantId);
   db.exec('COMMIT');return{taxonomyVersion:2 as const,events,counts,totalEvents:counts.reduce((n,x)=>n+x.count,0),retentionDays:retention,windowStart:new Date(now-retention*86400000).toISOString(),generatedAt:new Date(now).toISOString(),
    coverage:{source:'optional-client-claims' as const,requiresConsent:true,provesHumanReading:false,provesDelivery:false,legacyV1NotIncluded:true,retainedWindowOnly:true,pruningCounterScope:'company' as const,prunedByRetention:Number(pruned?.retention_pruned??0),prunedByCap:Number(pruned?.cap_pruned??0)}};
  }catch(error){db.exec('ROLLBACK');throw error;}
 });
}
