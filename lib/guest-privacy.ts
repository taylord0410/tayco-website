import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { type Actor, requireRole } from './auth';
import { GUEST_PRIVACY_VERSION, type GuestPrivacy } from './guest-privacy-contract';

export class GuestPrivacyError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function installGuestPrivacy(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS guest_privacy(
    tenant_id TEXT NOT NULL,actor_id TEXT NOT NULL,review_id TEXT NOT NULL,version TEXT NOT NULL,
    optional_analytics INTEGER NOT NULL CHECK(optional_analytics IN (0,1)),updated_at INTEGER NOT NULL,
    PRIMARY KEY(tenant_id,actor_id,review_id));
    CREATE TABLE IF NOT EXISTS guest_privacy_choices(
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,actor_id TEXT NOT NULL,review_id TEXT NOT NULL,
    version TEXT NOT NULL,optional_analytics INTEGER NOT NULL CHECK(optional_analytics IN (0,1)),created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS guest_privacy_choice_time ON guest_privacy_choices(tenant_id,created_at);`);
}
function withDb<T>(run: (db: DatabaseSync) => T) {
  const filename=process.env.TAYCO_ERP_DB_PATH||path.join(process.cwd(),'.data','tayco-erp.sqlite');
  mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});
  const db=new DatabaseSync(filename);
  try { db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');installGuestPrivacy(db);return run(db); }
  finally { db.close(); }
}
function review(actor: Actor,now: number) {
  requireRole(actor,['guest']);
  if(!actor.review || actor.review.expiresAt<=now)throw new GuestPrivacyError('An active review is required.',403);
  return actor.review;
}
export function guestPrivacy(actor: Actor,now=Date.now()):GuestPrivacy {
  const grant=review(actor,now);
  return withDb(db=>{
    const row=db.prepare('SELECT version,optional_analytics FROM guest_privacy WHERE tenant_id=? AND actor_id=? AND review_id=?').get(actor.tenantId,actor.id,grant.id);
    return {version:GUEST_PRIVACY_VERSION,reviewId:grant.id,expiresAt:grant.expiresAt,asOf:now,
      optionalAnalytics:row?.version===GUEST_PRIVACY_VERSION?row.optional_analytics===1:null};
  });
}
/** Called under the activity insertion transaction so withdrawal and insertion are serialized. */
export function assertGuestAnalytics(db: DatabaseSync,actor: Actor,now=Date.now()) {
  const grant=review(actor,now);
  const row=db.prepare('SELECT version,optional_analytics FROM guest_privacy WHERE tenant_id=? AND actor_id=? AND review_id=?').get(actor.tenantId,actor.id,grant.id);
  if(row?.version!==GUEST_PRIVACY_VERSION||row.optional_analytics!==1)throw new GuestPrivacyError('Optional activity analytics are not enabled for this review.',403);
}
export function saveGuestPrivacy(actor: Actor,value: unknown,now=Date.now()):GuestPrivacy {
  const grant=review(actor,now);
  if(!value||typeof value!=='object'||Array.isArray(value))throw new GuestPrivacyError('Choose your privacy preferences.');
  const input=value as Record<string,unknown>;
  if(Object.keys(input).some(k=>!['version','optionalAnalytics'].includes(k))||input.version!==GUEST_PRIVACY_VERSION||typeof input.optionalAnalytics!=='boolean')throw new GuestPrivacyError('Use the current privacy notice and a valid optional analytics choice.');
  withDb(db=>{
    db.exec('BEGIN IMMEDIATE');
    try {
      review(actor,Date.now());
      const prior=db.prepare('SELECT version,optional_analytics FROM guest_privacy WHERE tenant_id=? AND actor_id=? AND review_id=?').get(actor.tenantId,actor.id,grant.id);
      const optional=input.optionalAnalytics?1:0;
      if(prior?.version!==GUEST_PRIVACY_VERSION||prior.optional_analytics!==optional){
        db.prepare('INSERT INTO guest_privacy VALUES(?,?,?,?,?,?) ON CONFLICT(tenant_id,actor_id,review_id) DO UPDATE SET version=excluded.version,optional_analytics=excluded.optional_analytics,updated_at=excluded.updated_at').run(actor.tenantId,actor.id,grant.id,GUEST_PRIVACY_VERSION,optional,now);
        db.prepare('INSERT INTO guest_privacy_choices VALUES(?,?,?,?,?,?,?)').run(randomUUID(),actor.tenantId,actor.id,grant.id,GUEST_PRIVACY_VERSION,optional,now);
      }
      db.prepare('DELETE FROM guest_privacy_choices WHERE created_at<?').run(now-90*86400000);
      db.prepare('DELETE FROM guest_privacy WHERE updated_at<?').run(now-90*86400000);
      db.prepare('DELETE FROM guest_privacy_choices WHERE rowid IN (SELECT rowid FROM guest_privacy_choices WHERE tenant_id=? ORDER BY created_at DESC,rowid DESC LIMIT -1 OFFSET 10000)').run(actor.tenantId);
      db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
  });
  return guestPrivacy(actor,now);
}
