import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type GuardMode = 'off' | 'observe' | 'enforce';
export type GuardState = { reviewCode?: string; ruleVersion?: string; state: 'clear' | 'challenge' | 'blocked' | 'authorized'; incidentId?: string; retries: number; remaining: number; blockedUntil: number; mode: GuardMode; lab: boolean };
type Visitor = { hash: string; incident: string | null; retries: number; window_end: number; blocked_until: number; expires: number };
const WINDOW = 10 * 60_000, BLOCK = 15 * 60_000, SESSION = 30 * 60_000, VISITOR_TTL = 24 * 60 * 60_000;
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const opaque = () => randomBytes(32).toString('base64url');
export const guardMode = (): GuardMode => ['observe', 'enforce'].includes(process.env.TAYCO_AUTOMATION_GUARD || '') ? process.env.TAYCO_AUTOMATION_GUARD as GuardMode : 'off';
export function guardOrigin(request: Request) {
  const configured = process.env.TAYCO_APP_URL;
  if (process.env.NODE_ENV === 'production' && !configured) throw new GuardError('Configure the public application origin.', 503);
  const origin = new URL(configured || request.url);
  if (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:') throw new GuardError('HTTPS is required.', 503);
  return origin.origin;
}
export function labEnabled(url: string) {
  const parsed = new URL(url);
  return process.env.NODE_ENV !== 'production' && process.env.TAYCO_SECURITY_LAB === '1' && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname);
}
export function guardCookieName(kind: 'visitor' | 'debug') { return (process.env.NODE_ENV === 'production' ? '__Host-' : '') + 'tayco_guard_' + kind; }
export function readGuardCookie(request: Request, kind: 'visitor' | 'debug') {
  const prefix = guardCookieName(kind) + '=';
  const value = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(prefix))?.slice(prefix.length);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : undefined;
}
export function guardCookie(kind: 'visitor' | 'debug', value: string) {
  return `${guardCookieName(kind)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${kind === 'visitor' ? 86400 : 1800}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export class GuardError extends Error { constructor(message: string, public status = 400) { super(message); } }
function withStore<T>(work: (db: DatabaseSync) => T): T {
  const file = process.env.TAYCO_GUARD_DB_PATH || path.join(process.cwd(), '.data', 'automation-guard.sqlite');
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  try {
    db.exec(`PRAGMA busy_timeout=100;
      CREATE TABLE IF NOT EXISTS guard_visitors(hash TEXT PRIMARY KEY,incident TEXT,retries INTEGER NOT NULL,window_end INTEGER NOT NULL,blocked_until INTEGER NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS guard_grants(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,visitor_hash TEXT NOT NULL,origin TEXT NOT NULL,issuer TEXT NOT NULL,purpose TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0,revoked INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS guard_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS guard_reviews(id TEXT PRIMARY KEY,visitor_hash TEXT UNIQUE NOT NULL,origin TEXT NOT NULL,created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS guard_attempts(visitor_hash TEXT NOT NULL,incident TEXT NOT NULL,id TEXT NOT NULL,token_hash TEXT NOT NULL,status TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(visitor_hash,id));
      CREATE TABLE IF NOT EXISTS guard_sessions(hash TEXT PRIMARY KEY,grant_id TEXT NOT NULL,visitor_hash TEXT NOT NULL,origin TEXT NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS guard_events(id TEXT PRIMARY KEY,visitor_hash TEXT NOT NULL,kind TEXT NOT NULL,created INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS guard_events_time ON guard_events(created);`);
    db.exec('BEGIN IMMEDIATE');
    try { const value = work(db); db.exec('COMMIT'); return value; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  } finally { db.close(); }
}
function cleanup(db: DatabaseSync, now: number) {
  db.prepare('DELETE FROM guard_visitors WHERE expires<=?').run(now);
  db.prepare('DELETE FROM guard_sessions WHERE expires<=?').run(now);
  db.prepare('DELETE FROM guard_grants WHERE expires<?').run(now - VISITOR_TTL);
  db.prepare('DELETE FROM guard_events WHERE created<?').run(now - VISITOR_TTL);
  db.prepare('DELETE FROM guard_attempts WHERE created<?').run(now - VISITOR_TTL);
  db.prepare('DELETE FROM guard_reviews WHERE created<?').run(now - VISITOR_TTL);
}
function note(db: DatabaseSync, hash: string, kind: string, now: number) {
  // Bounded retention; no user fields, raw cookies, tokens or payloads in events.
  const recent = db.prepare('SELECT 1 FROM guard_events WHERE visitor_hash=? AND kind=? AND created>? LIMIT 1').get(hash,kind,now-60_000);
  if (recent && kind === 'browser_automation') return;
  db.prepare('INSERT INTO guard_events VALUES(?,?,?,?)').run(randomUUID(), hash, kind, now);
  db.exec('DELETE FROM guard_events WHERE id IN (SELECT id FROM guard_events ORDER BY created DESC,id DESC LIMIT -1 OFFSET 5000)');
}
function load(db: DatabaseSync, token: string | undefined, now: number): Visitor | undefined {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  const row = db.prepare('SELECT * FROM guard_visitors WHERE hash=? AND expires>?').get(digest(token), now) as Visitor | undefined;
  if (row && row.window_end && row.window_end <= now && row.blocked_until <= now) {
    db.prepare('UPDATE guard_visitors SET incident=NULL,retries=0,window_end=0,blocked_until=0 WHERE hash=?').run(row.hash);
    return { ...row, incident: null, retries: 0, window_end: 0, blocked_until: 0 };
  }
  return row;
}
export function ensureVisitor(token?: string, now = Date.now()) {
  return withStore(db => {
    cleanup(db, now);
    if (load(db, token, now)) return { token: token!, fresh: false };
    if (Number((db.prepare('SELECT COUNT(*) AS n FROM guard_visitors').get() as {n:number}).n) >= 10_000) throw new GuardError('Security verification is temporarily unavailable.', 503);
    const value = opaque();
    db.prepare('INSERT INTO guard_visitors VALUES(?,NULL,0,0,0,?)').run(digest(value), now + VISITOR_TTL);
    return { token: value, fresh: true };
  });
}
function authorized(db: DatabaseSync, visitor: Visitor, session: string | undefined, origin: string, now: number) {
  if (!session || !/^[A-Za-z0-9_-]{43}$/.test(session)) return false;
  return Boolean(db.prepare(`SELECT 1 FROM guard_sessions s JOIN guard_grants g ON s.grant_id=g.id
    WHERE s.hash=? AND s.visitor_hash=? AND s.origin=? AND s.expires>? AND g.revoked=0`).get(digest(session), visitor.hash, origin, now));
}
export function guardStatus(visitorToken: string | undefined, debugToken: string | undefined, origin: string, lab = false, now = Date.now()): GuardState {
  return withStore(db => {
    const v = load(db, visitorToken, now);
    const override=db.prepare("SELECT value FROM guard_settings WHERE key='mode'").get() as {value:string}|undefined;
    const mode=guardMode()==='enforce'&&override?.value==='observe'?'observe':guardMode();
    const review=db.prepare('SELECT id FROM guard_reviews WHERE visitor_hash=? AND created>?').get(v?.hash||'',now-VISITOR_TTL) as {id:string}|undefined;
    const base = { ruleVersion:'SG-2026-10-31.1', reviewCode:review?.id, retries: v?.retries || 0, remaining: Math.max(0, 3 - (v?.retries || 0)), blockedUntil: v?.blocked_until || 0, mode, lab };
    if (!v) return { ...base, state: 'clear' };
    if (authorized(db, v, debugToken, origin, now)) return { ...base, state: 'authorized' };
    return { ...base, incidentId: v.incident || undefined, state: v.blocked_until > now ? 'blocked' : v.incident ? 'challenge' : 'clear' };
  });
}
/** Weak browser signals can request a challenge; only the server owns the counter. */
export function flagVisitor(visitorToken: string, kind: 'browser_automation' | 'lab_simulation', now = Date.now()) {
  return withStore(db => {
    const v = load(db, visitorToken, now);
    if (!v) throw new GuardError('Reload this page to start verification.', 409);
    if (kind === 'browser_automation') { note(db, v.hash, kind, now); return; }
    if (v.incident) return;
    db.prepare('UPDATE guard_visitors SET incident=?,window_end=? WHERE hash=?').run(randomUUID(), now + WINDOW, v.hash);
    note(db, v.hash, kind, now);
  });
}
/** Only a completed, explicit, provider-rejected attempt may consume tolerance. */
export function countGuardRetry(visitorToken: string, debugToken: string | undefined, origin: string, now = Date.now(), attemptId?: string) {
  if (!attemptId || !/^[a-f0-9-]{36}$/i.test(attemptId)) return;
  return withStore(db => {
    const v = load(db, visitorToken, now);
    if (!v?.incident || v.blocked_until > now || authorized(db,v,debugToken,origin,now)) return;
    const inserted=db.prepare("INSERT OR IGNORE INTO guard_attempts VALUES(?,?,?,?,?,?)").run(v.hash,v.incident,attemptId,'','invalid',now);
    if (!inserted.changes) return;
    const retries=v.retries+1;
    db.prepare('UPDATE guard_visitors SET retries=?,blocked_until=? WHERE hash=?').run(retries,retries>3?now+BLOCK:0,v.hash);
    note(db,v.hash,retries>3?'temporary_block':'challenge_retry',now);
  });
}
export function claimChallenge(visitorToken: string, incident: string, id: string, token: string, now=Date.now()) {
  if (!/^[a-f0-9-]{36}$/i.test(id) || !/^[a-f0-9-]{36}$/i.test(incident)) throw new GuardError('Restart verification.',422);
  return withStore(db=>{
    const v=load(db,visitorToken,now);
    const old=db.prepare('SELECT status,token_hash,incident,created FROM guard_attempts WHERE visitor_hash=? AND id=?').get(v?.hash||'',id) as {status:string;token_hash:string;incident:string;created:number}|undefined;
    if(old){
      if(v?.incident && v.incident!==incident)throw new GuardError('Restart verification.',409);
      if(old.token_hash!==digest(token)||old.incident!==incident)throw new GuardError('This attempt already belongs to another verification.',409);
      if(old.status==='valid'||old.status==='invalid')return old.status;
      if(old.status==='pending' && now-old.created<10_000)throw new GuardError('Verification is still pending. Retry shortly.',503);
    }
    if(!v?.incident||v.incident!==incident)throw new GuardError('Restart verification.',409);
    if(v.blocked_until>now)throw new GuardError('Please wait before retrying verification.',429);
    const count=db.prepare('SELECT COUNT(*) AS n FROM guard_attempts WHERE visitor_hash=? AND created>?').get(v.hash,now-WINDOW) as {n:number};
    if(!old&&count.n>=20)throw new GuardError('Please wait before retrying verification.',429);
    db.prepare("INSERT INTO guard_attempts VALUES(?,?,?,?,?,?) ON CONFLICT(visitor_hash,id) DO UPDATE SET status='pending',created=excluded.created").run(v.hash,incident,id,digest(token),'pending',now);
    return 'pending';
  });
}
export function finishChallenge(visitorToken: string, incident: string, id: string, outcome:'valid'|'invalid'|'unavailable', now=Date.now()) {
 return withStore(db=>{
  const v=load(db,visitorToken,now);if(!v)throw new GuardError('Restart verification.',409);
  const changed=db.prepare("UPDATE guard_attempts SET status=? WHERE visitor_hash=? AND id=? AND incident=? AND status='pending'").run(outcome,v.hash,id,incident);
  if(!changed.changes)return;
  if(v.incident!==incident)return;
  if(outcome==='valid'){
   db.prepare('UPDATE guard_visitors SET incident=NULL,retries=0,window_end=0,blocked_until=0 WHERE hash=?').run(v.hash);note(db,v.hash,'challenge_passed',now);
  } else if(outcome==='invalid'){
   const retries=v.retries+1;db.prepare('UPDATE guard_visitors SET retries=?,blocked_until=? WHERE hash=?').run(retries,retries>3?now+BLOCK:0,v.hash);note(db,v.hash,retries>3?'temporary_block':'challenge_retry',now);
  } else note(db,v.hash,'challenge_unavailable',now);
 });
}
export function issueDebugGrant(visitorToken: string, origin: string, issuer: string, purpose: string, now = Date.now()) {
  return withStore(db => {
    cleanup(db, now);
    const v = load(db, visitorToken, now);
    if (!v) throw new GuardError('An active browser verification session is required.', 409);
    if (!purpose.trim() || purpose.length > 160) throw new GuardError('Provide a short investigation purpose.');
    const token = opaque(), id = randomUUID();
    db.prepare('INSERT INTO guard_grants(id,token_hash,visitor_hash,origin,issuer,purpose,expires) VALUES(?,?,?,?,?,?,?)').run(id, digest(token), v.hash, origin, issuer, purpose.trim(), now + 3 * 60_000);
    note(db, v.hash, 'debug_grant_issued', now);
    return { id, token, expiresAt: now + 3 * 60_000 };
  });
}
export function exchangeDebugGrant(token: unknown, visitorToken: string | undefined, origin: string, now = Date.now()) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new GuardError('Invalid or expired authorization.', 403);
  return withStore(db => {
    const v = load(db, visitorToken, now);
    const grant = db.prepare('SELECT * FROM guard_grants WHERE token_hash=? AND visitor_hash=? AND origin=? AND expires>? AND used=0 AND revoked=0').get(digest(token), v?.hash || '', origin, now) as {id:string} | undefined;
    if (!v || !grant) throw new GuardError('Invalid or expired authorization.', 403);
    db.prepare('UPDATE guard_grants SET used=1 WHERE id=?').run(grant.id);
    const session = opaque();
    db.prepare('INSERT INTO guard_sessions VALUES(?,?,?,?,?)').run(digest(session), grant.id, v.hash, origin, now + SESSION);
    note(db, v.hash, 'debug_session_started', now);
    return { session, expiresAt: now + SESSION };
  });
}
export function revokeDebugGrant(id: string, now = Date.now()) {
  return withStore(db => {
    const grant = db.prepare('SELECT visitor_hash FROM guard_grants WHERE id=?').get(id) as {visitor_hash:string} | undefined;
    if (!grant) throw new GuardError('Authorization not found.', 404);
    db.prepare('UPDATE guard_grants SET revoked=1 WHERE id=?').run(id);
    note(db, grant.visitor_hash, 'debug_grant_revoked', now);
  });
}
export function resetLabVisitor(token: string) {
  return withStore(db => { db.prepare('UPDATE guard_visitors SET incident=NULL,retries=0,window_end=0,blocked_until=0 WHERE hash=?').run(digest(token)); db.prepare('DELETE FROM guard_sessions WHERE visitor_hash=?').run(digest(token)); });
}
export function listGuardEvents() {
  return withStore(db => db.prepare('SELECT id,kind,created FROM guard_events ORDER BY created DESC LIMIT 100').all());
}

export function requestGuardReview(token: string, origin: string, now=Date.now()) {
 return withStore(db=>{
  cleanup(db,now);const v=load(db,token,now);if(!v)throw new GuardError('Restart verification.',409);
  const old=db.prepare('SELECT id FROM guard_reviews WHERE visitor_hash=?').get(v.hash) as {id:string}|undefined;if(old)return {id:old.id};
  if(Number(db.prepare('SELECT COUNT(*) AS n FROM guard_reviews').get()?.n)>=1000)throw new GuardError('Review queue is busy. Contact TAYCO or retry later.',503);
  const id=randomUUID();db.prepare('INSERT INTO guard_reviews VALUES(?,?,?,?)').run(id,v.hash,origin,now);note(db,v.hash,'review_requested',now);return {id};
 });
}
export function issueReviewGrant(reviewId: string, origin: string, issuer: string, purpose: string, now=Date.now()) {
 if(guardMode()==='off')throw new GuardError('The operator must enable the risk module first.',409);
 if(!purpose.trim()||purpose.length>160)throw new GuardError('Provide a short investigation purpose.');
 return withStore(db=>{
  cleanup(db,now);
  const review=db.prepare('SELECT r.visitor_hash FROM guard_reviews r JOIN guard_visitors v ON v.hash=r.visitor_hash WHERE r.id=? AND r.origin=? AND r.created>? AND v.expires>?').get(reviewId,origin,now-VISITOR_TTL,now) as {visitor_hash:string}|undefined;
  if(!review)throw new GuardError('Active review not found.',404);
  if(Number(db.prepare('SELECT COUNT(*) AS n FROM guard_grants WHERE visitor_hash=? AND expires>? AND revoked=0').get(review.visitor_hash,now)?.n)>=5)throw new GuardError('Revoke an existing authorization before issuing another.',429);
  const token=opaque(),id=randomUUID();db.prepare('INSERT INTO guard_grants(id,token_hash,visitor_hash,origin,issuer,purpose,expires) VALUES(?,?,?,?,?,?,?)').run(id,digest(token),review.visitor_hash,origin,issuer,purpose.trim(),now+3*60_000);
  note(db,review.visitor_hash,'debug_grant_issued',now);return {id,token,expiresAt:now+3*60_000};
 });
}
export function guardAdminSnapshot(now=Date.now()) {
 return withStore(db=>{
  cleanup(db,now);
  const override=db.prepare("SELECT value FROM guard_settings WHERE key='mode'").get() as {value:string}|undefined;
  return {configuredMode:guardMode(),effectiveMode:guardMode()==='enforce'&&override?.value==='observe'?'observe':guardMode(),ruleVersion:'SG-2026-10-31.1',
   reviews:db.prepare('SELECT r.id,r.created,v.incident,v.retries,v.blocked_until FROM guard_reviews r JOIN guard_visitors v ON v.hash=r.visitor_hash WHERE v.expires>? ORDER BY r.created DESC LIMIT 100').all(now),
   grants:db.prepare('SELECT id,issuer,purpose,expires,used,revoked FROM guard_grants ORDER BY expires DESC LIMIT 100').all(),
   events:db.prepare('SELECT id,kind,created FROM guard_events ORDER BY created DESC LIMIT 100').all()};
 });
}
export function setGuardMode(mode: unknown, issuer: string, now=Date.now()) {
 if(mode!=='observe'&&mode!=='enforce')throw new GuardError('Choose observation or configured enforcement.');
 if(mode==='enforce'&&guardMode()!=='enforce')throw new GuardError('Enforcement must first be enabled by the operator configuration.',409);
 return withStore(db=>{
  db.prepare("INSERT INTO guard_settings VALUES('mode',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(mode);
  note(db,digest(issuer),'mode_'+mode,now);return {mode};
 });
}
