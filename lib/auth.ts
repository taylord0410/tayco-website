import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { sealData, unsealData } from 'iron-session';

export type AuthRole = 'admin' | 'staff' | 'client' | 'vendor';
export interface Actor { id: string; email: string; role: AuthRole; tenantId: string; projectIds: string[]; vendorId?: string }
type UserRow = { id: string; email: string; password_hash: string; role: AuthRole; tenant_id: string; project_ids: string; vendor_id: string | null; disabled: number };
type InviteRow = { id: string; token_hash: string; email: string; role: AuthRole; tenant_id: string; project_ids: string; vendor_id: string | null; expires_at: number; revoked_at: number | null; accepted_at: number | null };
export class AuthError extends Error { constructor(message: string, public status = 401) { super(message); this.name = 'AuthError'; } }
export const SESSION_COOKIE = 'tayco_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
// OWASP's 32 MiB configuration balances password cost and the small site's memory budget.
const passwordKey = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
const digest = (s: string) => createHash('sha256').update(s).digest('hex');

function database() {
  const filename = process.env.TAYCO_AUTH_DB_PATH || path.join(process.cwd(), '.data', 'tayco-auth.sqlite');
  mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS auth_users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','staff','client','vendor')),tenant_id TEXT NOT NULL,project_ids TEXT NOT NULL,vendor_id TEXT,disabled INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES auth_users(id),expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_invites(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL,tenant_id TEXT NOT NULL,project_ids TEXT NOT NULL,vendor_id TEXT,expires_at INTEGER NOT NULL,revoked_at INTEGER,accepted_at INTEGER,created_by TEXT NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_rate_limits(bucket TEXT PRIMARY KEY,window_start INTEGER NOT NULL,hits INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_audit(id TEXT PRIMARY KEY,actor_id TEXT,event TEXT NOT NULL,subject_id TEXT,created_at INTEGER NOT NULL);`);
  return db;
}
function withDb<T>(fn: (db: DatabaseSync) => T): T { const db = database(); try { return fn(db); } finally { db.close(); } }
function audit(db: DatabaseSync, actor: string | null, event: string, subject: string | null = null) { db.prepare('INSERT INTO auth_audit VALUES(?,?,?,?,?)').run(randomUUID(), actor, event, subject, Date.now()); }
function actorOf(user: UserRow): Actor { return { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id, projectIds: JSON.parse(user.project_ids), ...(user.vendor_id ? { vendorId: user.vendor_id } : {}) }; }
function accessVersion(user: UserRow) { return digest(JSON.stringify([user.role, user.project_ids, user.vendor_id, user.disabled])); }
function secret() { const s = process.env.TAYCO_SESSION_SECRET; if (!s || s.length < 32) throw new AuthError('Account access is not configured. Please contact TAYCO.', 503); return s; }
export function normalizeEmail(value: unknown) { if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new AuthError('Enter a valid email address.', 400); return value.trim().toLowerCase(); }
function validatePassword(password: unknown): asserts password is string { if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new AuthError('Use a password with 12 to 128 characters.', 400); }
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  let expected: string;
  try { expected = new URL(process.env.TAYCO_APP_URL || (process.env.NODE_ENV === 'production' ? '' : request.url)).origin; } catch { throw new AuthError('Account access is not configured.', 503); }
  if (!origin || origin !== expected || request.headers.get('sec-fetch-site') === 'cross-site') throw new AuthError('Please reload this page and try again.', 403);
}
export function requireRole(actor: Actor, roles: AuthRole[]) { if (!roles.includes(actor.role)) throw new AuthError('You do not have permission to perform this action.', 403); }
export function requireProject(actor: Actor, projectId: string, tenantId: string) { if (actor.tenantId !== tenantId || (!['admin', 'staff'].includes(actor.role) && !actor.projectIds.includes(projectId))) throw new AuthError('You do not have access to this project.', 403); }
export function canAccessProject(actor: Actor, projectId: string, tenantId: string) { try { requireProject(actor, projectId, tenantId); return true; } catch { return false; } }
function rateLimit(bucket: string, max: number, windowMs = 15 * 60_000) {
  withDb(db => { const now = Date.now(); db.exec('BEGIN IMMEDIATE'); try { db.prepare('DELETE FROM auth_rate_limits WHERE window_start < ?').run(now - windowMs); const row = db.prepare('SELECT hits FROM auth_rate_limits WHERE bucket=?').get(bucket) as { hits: number } | undefined; if (row && row.hits >= max) throw new AuthError('Too many attempts. Please try again in 15 minutes.', 429); db.prepare('INSERT INTO auth_rate_limits VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1').run(bucket, now); db.exec('COMMIT'); } catch (error) { db.exec('ROLLBACK'); throw error; } });
}
async function hashPassword(password: string) { validatePassword(password); const salt = randomBytes(16).toString('hex'); const hash = await passwordKey(password, salt); return `scrypt$32768$8$3$${salt}$${hash.toString('hex')}`; }
async function verifyPassword(password: string, encoded: string) { const [algorithm, n, r, p, salt, hash] = encoded.split('$'); if (algorithm !== 'scrypt' || n !== '32768' || r !== '8' || p !== '3' || !salt || !hash || hash.length !== 128) return false; const actual = await passwordKey(password, salt); return timingSafeEqual(actual, Buffer.from(hash, 'hex')); }
// Unknown accounts still perform the same expensive password operation.
const DUMMY_HASH = `scrypt$32768$8$3$00000000000000000000000000000000$${'0'.repeat(128)}`;

export async function createSession(userId: string) {
  const password = secret(); const token = randomBytes(32).toString('base64url');
  const value = await sealData({ token }, { password, ttl: SESSION_TTL_SECONDS });
  withDb(db => { const user = db.prepare('SELECT disabled FROM auth_users WHERE id=?').get(userId) as { disabled: number } | undefined; if (!user || user.disabled) throw new AuthError('Account unavailable.'); const now = Date.now(); db.prepare('DELETE FROM auth_sessions WHERE expires_at<=?').run(now); db.prepare('INSERT INTO auth_sessions VALUES(?,?,?,?)').run(digest(token), userId, now + SESSION_TTL_SECONDS * 1000, now); audit(db, userId, 'session.created'); });
  return value;
}
function cookieValue(request: Request) { return request.headers.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1); }
async function sessionToken(request: Request) { const value = cookieValue(request); if (!value) return null; try { const payload = await unsealData<{ token?: string }>(decodeURIComponent(value), { password: secret(), ttl: SESSION_TTL_SECONDS }); return typeof payload.token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(payload.token) ? payload.token : null; } catch (e) { if (e instanceof AuthError) throw e; return null; } }
export async function getActor(request: Request): Promise<Actor | null> {
  const token = await sessionToken(request); if (!token) return null;
  return withDb(db => { const user = db.prepare('SELECT u.* FROM auth_users u JOIN auth_sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.disabled=0').get(digest(token), Date.now()) as UserRow | undefined; return user ? actorOf(user) : null; });
}
export async function requireActor(request: Request): Promise<Actor> { const actor = await getActor(request); if (!actor) throw new AuthError('Please sign in to continue.', 401); return actor; }
export async function signIn(emailInput: unknown, password: unknown) {
  secret(); const email = normalizeEmail(emailInput);
  rateLimit('login:global', 120); rateLimit(`login:${digest(email)}`, 8);
  if (typeof password !== 'string' || password.length > 128) throw new AuthError('Email or password is incorrect.');
  const user = withDb(db => db.prepare('SELECT * FROM auth_users WHERE email=?').get(email) as UserRow | undefined);
  const valid = await verifyPassword(password, user?.password_hash || DUMMY_HASH);
  if (!user || user.disabled || !valid) throw new AuthError('Email or password is incorrect.');
  return { actor: actorOf(user), cookie: await createSession(user.id) };
}
export async function signOut(request: Request) { const token = await sessionToken(request); if (token) withDb(db => { db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').run(digest(token)); }); }
export function sessionCookie(value: string, clear = false) { return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : SESSION_TTL_SECONDS}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`; }

function validateScope(scope: { role: AuthRole; tenantId: string; projectIds: string[]; vendorId?: string }) {
  if (!['admin','staff','client','vendor'].includes(scope.role) || !/^[a-zA-Z0-9_-]{1,100}$/.test(scope.tenantId)) throw new AuthError('Choose a valid role and company.', 400);
  if (!Array.isArray(scope.projectIds) || scope.projectIds.length > 100 || scope.projectIds.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id))) throw new AuthError('Choose valid project assignments.', 400);
  if (scope.role === 'vendor' && (!scope.vendorId || !/^[a-zA-Z0-9_-]{1,100}$/.test(scope.vendorId))) throw new AuthError('Assign a supplier record to this account.', 400);
  if (scope.role !== 'vendor' && scope.vendorId) throw new AuthError('Supplier assignments require the supplier role.', 400);
  if (scope.vendorId && !/^[a-zA-Z0-9_-]{1,100}$/.test(scope.vendorId)) throw new AuthError('Invalid supplier record.', 400);
}
export async function provisionAdmin(emailInput: unknown, password: string, tenantId = 'tayco_llc') {
  const email = normalizeEmail(emailInput); validateScope({ role: 'admin', tenantId, projectIds: [] }); const hash = await hashPassword(password);
  return withDb(db => { db.exec('BEGIN IMMEDIATE'); try { if ((db.prepare("SELECT count(*) AS count FROM auth_users WHERE role='admin'").get() as { count: number }).count) throw new AuthError('An administrator already exists. Use the recovery command.', 409); const id = randomUUID(); db.prepare('INSERT INTO auth_users VALUES(?,?,?,?,?,?,?,0,?)').run(id, email, hash, 'admin', tenantId, '[]', null, Date.now()); audit(db, id, 'admin.provisioned', id); db.exec('COMMIT'); return id; } catch (e) { db.exec('ROLLBACK'); throw e; } });
}
/** Private operator tooling only: database access is required; this is never an invitation or promotion. */
export async function provisionAdditionalAdminPrivately(emailInput: unknown, password: string, tenantId: string) {
  const email = normalizeEmail(emailInput);
  if (typeof tenantId !== 'string' || !tenantId || !/^[a-zA-Z0-9_-]{1,100}$/.test(tenantId)) throw new AuthError('Choose an explicit valid company for the additional administrator.', 400);
  validateScope({ role: 'admin', tenantId, projectIds: [] });
  const hash = await hashPassword(password);
  return withDb(db => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const existingAdmin = db.prepare("SELECT id FROM auth_users WHERE tenant_id=? AND role='admin' AND disabled=0 LIMIT 1").get(tenantId);
      if (!existingAdmin) throw new AuthError('An active administrator must already exist in this company. Use bootstrap or recovery first.', 409);
      if (db.prepare('SELECT id FROM auth_users WHERE email=?').get(email)) throw new AuthError('An account already exists for this email. No account was changed.', 409);
      const id = randomUUID();
      db.prepare('INSERT INTO auth_users VALUES(?,?,?,?,?,?,?,0,?)').run(id, email, hash, 'admin', tenantId, '[]', null, Date.now());
      // A database operator performed this action; do not impersonate an existing or newly created user.
      audit(db, null, 'admin.provisioned_by_operator', id);
      db.exec('COMMIT');
      return id;
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  });
}
export function createInvitation(actor: Actor, input: { email: unknown; role: AuthRole; tenantId: string; projectIds: string[]; vendorId?: string; expiresInHours?: number }) {
  requireRole(actor, ['admin']); validateScope(input); if (input.tenantId !== actor.tenantId || input.role === 'admin') throw new AuthError('This invitation is outside your account permissions.', 403);
  const email = normalizeEmail(input.email); const hours = input.expiresInHours ?? 48; if (!Number.isFinite(hours) || hours < 1 || hours > 168) throw new AuthError('Invitation expiry must be between 1 and 168 hours.', 400);
  const token = randomBytes(32).toString('base64url'); const id = randomUUID(); const now = Date.now();
  withDb(db => { db.prepare('INSERT INTO auth_invites VALUES(?,?,?,?,?,?,?,?,NULL,NULL,?,?)').run(id, digest(token), email, input.role, actor.tenantId, JSON.stringify([...new Set(input.projectIds)]), input.vendorId || null, now + hours * 3600_000, actor.id, now); audit(db, actor.id, 'invitation.created', id); });
  return { id, token, expiresAt: now + hours * 3600_000, path: `/login#invite=${token}` };
}
export function listInvitations(actor: Actor) { requireRole(actor, ['admin']); return withDb(db => db.prepare('SELECT id,email,role,project_ids AS projectIds,vendor_id AS vendorId,expires_at AS expiresAt,revoked_at AS revokedAt,accepted_at AS acceptedAt,created_at AS createdAt FROM auth_invites WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').all(actor.tenantId)); }
export function listAccounts(actor: Actor) {
  requireRole(actor, ['admin']);
  return withDb(db => (db.prepare('SELECT * FROM auth_users WHERE tenant_id=? ORDER BY email').all(actor.tenantId) as UserRow[]).map(row => ({ ...actorOf(row), accessVersion: accessVersion(row), disabled: Boolean(row.disabled), editable: row.id !== actor.id && row.role !== 'admin' })));
}
export function listAssignableStaff(actor: Actor): { id: string; email: string; role: AuthRole }[] {
  requireRole(actor, ['admin', 'staff']);
  return withDb(db => db.prepare("SELECT id,email,role FROM auth_users WHERE tenant_id=? AND disabled=0 AND role IN ('admin','staff') ORDER BY email").all(actor.tenantId).map(row => ({id:String(row.id),email:String(row.email),role:row.role as AuthRole})));
}
export function validateAssignableStaff(actor: Actor, id: string) {
  const member = listAssignableStaff(actor).find(user => user.id === id);
  if (!member) throw new AuthError('Choose an active TAYCO team member.', 422);
  return member;
}
/** Private operator tooling only: the process must already have access to the account database. */
export function notificationOperatorPrivately(emailInput: unknown): Actor {
  const email = normalizeEmail(emailInput);
  return withDb(db => {
    const user = db.prepare("SELECT * FROM auth_users WHERE email=? AND role='admin' AND disabled=0").get(email) as UserRow | undefined;
    if (!user) throw new AuthError('An active administrator is required for the notification worker.', 403);
    return actorOf(user);
  });
}
export function updateAccountAccess(actor: Actor, input: { id: string; role: AuthRole; projectIds: string[]; vendorId?: string; disabled: boolean; accessVersion: string }) {
  requireRole(actor, ['admin']); validateScope({ ...input, tenantId: actor.tenantId });
  if (input.role === 'admin' || input.id === actor.id || typeof input.disabled !== 'boolean') throw new AuthError('Administrator access must be managed by a verified operator.', 403);
  withDb(db => { db.exec('BEGIN IMMEDIATE'); try {
    const target = db.prepare('SELECT * FROM auth_users WHERE id=? AND tenant_id=?').get(input.id, actor.tenantId) as UserRow | undefined;
    if (!target) throw new AuthError('Account not found.', 404);
    if (target.role === 'admin') throw new AuthError('Administrator access must be managed by a verified operator.', 403);
    if (typeof input.accessVersion !== 'string' || input.accessVersion !== accessVersion(target)) throw new AuthError('This account changed. Reload and review its current access before saving.', 409);
    db.prepare('UPDATE auth_users SET role=?,project_ids=?,vendor_id=?,disabled=? WHERE id=? AND tenant_id=?').run(input.role, JSON.stringify([...new Set(input.projectIds)]), input.vendorId || null, input.disabled ? 1 : 0, input.id, actor.tenantId);
    db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(input.id);
    audit(db, actor.id, 'account.access_updated', input.id); db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; } });
}
export function revokeInvitation(actor: Actor, id: string) { requireRole(actor, ['admin']); withDb(db => { const result = db.prepare('UPDATE auth_invites SET revoked_at=? WHERE id=? AND tenant_id=? AND accepted_at IS NULL').run(Date.now(), id, actor.tenantId); if (!result.changes) throw new AuthError('Invitation not found or already used.', 404); audit(db, actor.id, 'invitation.revoked', id); }); }
export async function acceptInvitation(token: unknown, emailInput: unknown, password: unknown) {
  secret(); rateLimit('invite:global', 60); if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new AuthError('This invitation is invalid or no longer available.', 400);
  const email = normalizeEmail(emailInput); validatePassword(password); const hash = await hashPassword(password); const now = Date.now();
  const id = withDb(db => { db.exec('BEGIN IMMEDIATE'); try { const invite = db.prepare('SELECT * FROM auth_invites WHERE token_hash=?').get(digest(token)) as InviteRow | undefined; if (!invite || invite.email !== email || invite.revoked_at || invite.accepted_at || invite.expires_at <= now) throw new AuthError('This invitation is invalid or no longer available.', 400); if (db.prepare('SELECT id FROM auth_users WHERE email=?').get(email)) throw new AuthError('An account already exists. Sign in or contact TAYCO for help.', 409); const userId = randomUUID(); db.prepare('INSERT INTO auth_users VALUES(?,?,?,?,?,?,?,0,?)').run(userId, email, hash, invite.role, invite.tenant_id, invite.project_ids, invite.vendor_id, now); db.prepare('UPDATE auth_invites SET accepted_at=? WHERE id=?').run(now, invite.id); audit(db, userId, 'invitation.accepted', invite.id); db.exec('COMMIT'); return userId; } catch (e) { db.exec('ROLLBACK'); throw e; } });
  return { cookie: await createSession(id) };
}
async function replacePassword(emailInput: unknown, password: string, actorId: string | null, event: string) {
  const email = normalizeEmail(emailInput); const hash = await hashPassword(password);
  withDb(db => { db.exec('BEGIN IMMEDIATE'); try { const user = db.prepare('SELECT id FROM auth_users WHERE email=?').get(email) as { id: string } | undefined; if (!user) throw new AuthError('Account not found.', 404); db.prepare('UPDATE auth_users SET password_hash=? WHERE id=?').run(hash, user.id); db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(user.id); audit(db, actorId, event, user.id); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } });
}
export async function resetPasswordPrivately(emailInput: unknown, password: string) { await replacePassword(emailInput, password, null, 'password.recovered'); }
export function revokeUserSessionsPrivately(emailInput: unknown, disabled?: boolean) { const email = normalizeEmail(emailInput); withDb(db => { db.exec('BEGIN IMMEDIATE'); try { const user = db.prepare('SELECT id FROM auth_users WHERE email=?').get(email) as { id: string } | undefined; if (!user) throw new AuthError('Account not found.', 404); db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(user.id); if (typeof disabled === 'boolean') db.prepare('UPDATE auth_users SET disabled=? WHERE id=?').run(disabled ? 1 : 0, user.id); audit(db, null, typeof disabled === 'boolean' ? disabled ? 'account.disabled' : 'account.enabled' : 'sessions.revoked', user.id); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } }); }
export async function changePassword(actor: Actor, current: unknown, next: unknown) { validatePassword(next); const user = withDb(db => db.prepare('SELECT * FROM auth_users WHERE id=? AND disabled=0').get(actor.id) as UserRow | undefined); rateLimit(`password:${actor.id}`, 8); if (!user || typeof current !== 'string' || current.length > 128 || !await verifyPassword(current, user.password_hash)) throw new AuthError('Current password is incorrect.', 400); await replacePassword(actor.email, next, actor.id, 'password.changed'); }
