import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Actor } from './auth';

export const REVIEW_TTL_MS = 4 * 60 * 60 * 1000;
export type ReviewAccess = { id: string; detailPeriod: string; createdAt: number; expiresAt: number };
export class ReviewGrantError extends Error {
  constructor(message: string, public status = 403, public reasonCode = 'review_required') { super(message); }
}
type Grant = { id:string; invite_id:string; tenant_id:string; email:string; user_id:string|null; detail_period:string; created_at:number; expires_at:number; accepted_at:number|null; revoked_at:number|null; request_hash:string;scope:string;policy_version:number };
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
const key=(value:string)=>{if(typeof value!=='string'||! /^[A-Za-z0-9_-]{16,100}$/.test(value))throw new ReviewGrantError('A valid request reference is required.',400,'invalid_request');return value;};
const emit=(db:DatabaseSync,actor:string,event:string,id:string,now:number)=>db.prepare('INSERT INTO auth_audit VALUES(?,?,?,?,?)').run(randomUUID(),actor,event,id,now);

export function installReviewSchema(db: DatabaseSync) {
  db.exec('BEGIN IMMEDIATE');
  try{
  db.exec(`CREATE TABLE IF NOT EXISTS auth_review_grants(
    id TEXT PRIMARY KEY,invite_id TEXT UNIQUE NOT NULL,tenant_id TEXT NOT NULL,email TEXT NOT NULL,
    user_id TEXT REFERENCES auth_users(id),detail_period TEXT NOT NULL,created_by TEXT NOT NULL,
    creation_key TEXT NOT NULL,request_hash TEXT NOT NULL,created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL CHECK(expires_at=created_at+14400000),accepted_at INTEGER,revoked_at INTEGER,
    scope TEXT NOT NULL DEFAULT 'company_readonly' CHECK(scope='company_readonly'),policy_version INTEGER NOT NULL DEFAULT 1 CHECK(policy_version=1),
    UNIQUE(tenant_id,created_by,creation_key));
    CREATE TABLE IF NOT EXISTS auth_review_rotations(grant_id TEXT NOT NULL,request_key TEXT NOT NULL,
    created_at INTEGER NOT NULL,PRIMARY KEY(grant_id,request_key));
    CREATE TRIGGER IF NOT EXISTS auth_review_deadline_immutable BEFORE UPDATE OF
    created_at,expires_at,detail_period,tenant_id,email,created_by,creation_key,request_hash,invite_id,scope,policy_version
    ON auth_review_grants BEGIN SELECT RAISE(ABORT,'Review origin and deadline are immutable'); END;`);
  for(const table of ['auth_sessions','auth_invites']) {
    const fields=db.prepare('PRAGMA table_info('+table+')').all();
    if(!fields.some(f=>f.name==='review_grant_id'))db.exec('ALTER TABLE '+table+' ADD COLUMN review_grant_id TEXT');
  }
  db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
}
function active(grant:Grant|undefined,now:number) {
  if(!grant)throw new ReviewGrantError('Review access is required. Contact TAYCO.');
  if(grant.scope!=='company_readonly'||grant.policy_version!==1)throw new ReviewGrantError('This review policy is unavailable. Contact TAYCO.');
  if(grant.revoked_at!==null)throw new ReviewGrantError('This review access has been revoked.',403,'review_revoked');
  if(grant.expires_at<=now)throw new ReviewGrantError('This review access has ended. Request a new review from TAYCO.',403,'review_expired');
  return grant;
}
function access(g:Grant):ReviewAccess{return {id:g.id,detailPeriod:g.detail_period,createdAt:g.created_at,expiresAt:g.expires_at};}
function transaction<T>(db:DatabaseSync,run:()=>T):T{db.exec('BEGIN IMMEDIATE');try{const result=run();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
export function createReviewInvitation(db:DatabaseSync,actor:Actor,email:string,requestKey:string,now=Date.now()) {
  if(actor.role!=='admin')throw new ReviewGrantError('Not authorized.',403);
  const creationKey=key(requestKey),fingerprint=digest(JSON.stringify({email,tenantId:actor.tenantId,role:'guest',scope:'company_readonly',policyVersion:1}));
  return transaction(db,()=>{
    const previous=db.prepare('SELECT * FROM auth_review_grants WHERE tenant_id=? AND created_by=? AND creation_key=?').get(actor.tenantId,actor.id,creationKey) as Grant|undefined;
    if(previous){
      if(previous.request_hash!==fingerprint)throw new ReviewGrantError('This request reference was used for another invitation.',409,'request_conflict');
      const state=previous.revoked_at!==null?'revoked':previous.expires_at<=now?'expired':previous.accepted_at!==null?'accepted':'link_not_recoverable';
      return {id:previous.invite_id,reviewGrantId:previous.id,expiresAt:previous.expires_at,createdAt:previous.created_at,detailPeriod:previous.detail_period,linkState:state};
    }
    const id=randomUUID(),grantId=randomUUID(),token=randomBytes(32).toString('base64url'),expiresAt=now+REVIEW_TTL_MS,period=new Date(now).toISOString().slice(0,7);
    db.prepare('INSERT INTO auth_review_grants(id,invite_id,tenant_id,email,user_id,detail_period,created_by,creation_key,request_hash,created_at,expires_at,accepted_at,revoked_at) VALUES(?,?,?,?,NULL,?,?,?,?,?,?,NULL,NULL)').run(grantId,id,actor.tenantId,email,period,actor.id,creationKey,fingerprint,now,expiresAt);
    db.prepare("INSERT INTO auth_invites(id,token_hash,email,role,tenant_id,project_ids,vendor_id,expires_at,revoked_at,accepted_at,created_by,created_at,review_grant_id) VALUES(?,?,?,'guest',?,'[]',NULL,?,NULL,NULL,?,?,?)").run(id,digest(token),email,actor.tenantId,expiresAt,actor.id,now,grantId);
    emit(db,actor.id,'review.created',grantId,now);
    return {id,token,path:'/login#invite='+token,reviewGrantId:grantId,expiresAt,createdAt:now,detailPeriod:period,linkState:'issued'};
  });
}
export function rotateReviewInvitation(db:DatabaseSync,actor:Actor,inviteId:string,requestKey:string,now=Date.now()){
  if(actor.role!=='admin')throw new ReviewGrantError('Not authorized.');
  key(requestKey);
  return transaction(db,()=>{
    const g=active(db.prepare('SELECT * FROM auth_review_grants WHERE invite_id=? AND tenant_id=?').get(inviteId,actor.tenantId) as Grant|undefined,now);
    if(g.accepted_at!==null)throw new ReviewGrantError('This review is already accepted. No replacement link was created.',409,'review_accepted');
    if(db.prepare('SELECT 1 FROM auth_review_rotations WHERE grant_id=? AND request_key=?').get(g.id,requestKey))return {id:inviteId,reviewGrantId:g.id,createdAt:g.created_at,expiresAt:g.expires_at,detailPeriod:g.detail_period,linkState:'link_not_recoverable'};
    const token=randomBytes(32).toString('base64url');
    const changed=db.prepare('UPDATE auth_invites SET token_hash=? WHERE id=? AND tenant_id=? AND accepted_at IS NULL AND revoked_at IS NULL').run(digest(token),inviteId,actor.tenantId);
    if(changed.changes!==1)throw new ReviewGrantError('This invitation changed. Reload before replacing its link.',409,'request_conflict');
    db.prepare('INSERT INTO auth_review_rotations VALUES(?,?,?)').run(g.id,requestKey,now);
    emit(db,actor.id,'review.token_rotated',g.id,now);
    return {id:inviteId,token,path:'/login#invite='+token,reviewGrantId:g.id,createdAt:g.created_at,expiresAt:g.expires_at,detailPeriod:g.detail_period,linkState:'issued'};
  });
}
export function revokeReviewInvitation(db:DatabaseSync,actor:Actor,inviteId:string,now=Date.now()){
  if(actor.role!=='admin')throw new ReviewGrantError('Not authorized.');
  return transaction(db,()=>{
    const g=db.prepare('SELECT * FROM auth_review_grants WHERE invite_id=? AND tenant_id=?').get(inviteId,actor.tenantId) as Grant|undefined;
    if(!g)throw new ReviewGrantError('Review invitation not found.',404);
    if(g.revoked_at===null){
      db.prepare('UPDATE auth_review_grants SET revoked_at=? WHERE id=?').run(now,g.id);
      db.prepare('UPDATE auth_invites SET revoked_at=? WHERE id=?').run(now,inviteId);
      db.prepare('DELETE FROM auth_sessions WHERE review_grant_id=?').run(g.id);
      emit(db,actor.id,'review.revoked',g.id,now);
    }
  });
}
/** Caller holds the account/claim transaction and has already verified the same identity. */
export function claimReviewGrant(db:DatabaseSync,grantId:string,inviteId:string,actor:Actor,now=Date.now()){
  const g=active(db.prepare('SELECT * FROM auth_review_grants WHERE id=? AND invite_id=?').get(grantId,inviteId) as Grant|undefined,now);
  if(actor.role!=='guest'||actor.tenantId!==g.tenant_id||actor.email!==g.email||(g.user_id!==null&&g.user_id!==actor.id))throw new ReviewGrantError('This review is not assigned to this account.',403,'review_identity');
  if(g.accepted_at===null){db.prepare('UPDATE auth_review_grants SET user_id=?,accepted_at=? WHERE id=? AND user_id IS NULL AND accepted_at IS NULL').run(actor.id,now,g.id);emit(db,actor.id,'review.accepted',g.id,now);}
  return access(g);
}
export function reviewForSession(db:DatabaseSync,actor:Actor,grantId:string|null|undefined,now=Date.now()):ReviewAccess{
  if(!grantId)throw new ReviewGrantError('Review access is required. Request a new review from TAYCO.');
  const g=active(db.prepare('SELECT * FROM auth_review_grants WHERE id=?').get(grantId) as Grant|undefined,now);
  if(actor.role!=='guest'||g.user_id!==actor.id||g.email!==actor.email||g.tenant_id!==actor.tenantId||g.accepted_at===null)throw new ReviewGrantError('This review is not assigned to this account.',403,'review_identity');
  return access(g);
}
export function latestClaimedReview(db:DatabaseSync,userId:string):string|undefined{
  return (db.prepare('SELECT id FROM auth_review_grants WHERE user_id=? AND accepted_at IS NOT NULL ORDER BY accepted_at DESC,created_at DESC,id DESC LIMIT 1').get(userId) as {id:string}|undefined)?.id;
}
