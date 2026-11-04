import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { AuthError, createSession, signIn } from '../lib/auth';

const HARPER_ID = '8dfa00f9-f0cc-4376-a436-45f3e50b5115';
const MARNIN_ID = 'a1d20a0b-5e4c-4f6d-9b7e-6c3d2f1e0a9b';
const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

test('harper is permanently blocked; Marnin and company guests get no-expiry sessions', async () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-guest-policy-'));
  const dataDir = path.join(folder, '.data'); mkdirSync(dataDir);
  const filename = path.join(dataDir, 'tayco-auth.sqlite');
  const keys = ['TAYCO_AUTH_DB_PATH', 'TAYCO_SESSION_SECRET', 'TAYCO_APP_URL', 'RAILWAY_ENVIRONMENT'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.TAYCO_AUTH_DB_PATH = filename;
  process.env.TAYCO_SESSION_SECRET = randomBytes(48).toString('hex');
  process.env.TAYCO_APP_URL = 'https://tayco.test';
  process.env.RAILWAY_ENVIRONMENT = 'production';
  try {
    // A previously active Harper account (old deployment) exists before the new release starts.
    const seed = new DatabaseSync(filename);
    seed.exec(`CREATE TABLE auth_users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','staff','client','vendor','guest')),tenant_id TEXT NOT NULL,project_ids TEXT NOT NULL,vendor_id TEXT,disabled INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);`);
    seed.prepare("INSERT INTO auth_users VALUES(?,?,?,'guest','tayco_llc','[]',NULL,0,?)").run(HARPER_ID, 'harper@tayco.llc', 'scrypt$32768$8$3$aa$bb', Date.now());
    seed.close();

    await assert.rejects(() => signIn('nobody@example.test', 'not-a-real-password-123'), (e: unknown) => e instanceof AuthError); // opens + seeds the database

    const db = new DatabaseSync(filename);
    const harper = db.prepare('SELECT disabled FROM auth_users WHERE id=?').get(HARPER_ID) as { disabled: number };
    assert.equal(harper.disabled, 1, 'harper stays disabled');
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM auth_pending_guest_reviews WHERE lower(email)=?').get('harper@tayco.llc') as { n: number }).n, 0);
    const marnin = db.prepare('SELECT role,disabled,email FROM auth_users WHERE id=?').get(MARNIN_ID) as { role: string; disabled: number; email: string };
    assert.deepEqual({ ...marnin }, { role: 'guest', disabled: 0, email: 'marnin@tayco.llc' });
    assert.equal((db.prepare('SELECT auto_renew AS a FROM auth_pending_guest_reviews WHERE email=?').get('marnin@tayco.llc') as { a: number }).a, 1);
    db.close();

    await assert.rejects(() => createSession(HARPER_ID), (e: unknown) => e instanceof AuthError && /unavailable/i.test(e.message));

    await createSession(MARNIN_ID);
    const check = new DatabaseSync(filename);
    const session = check.prepare('SELECT created_at,expires_at FROM auth_sessions WHERE user_id=?').get(MARNIN_ID) as { created_at: number; expires_at: number };
    assert.ok(session.expires_at - session.created_at >= TEN_YEARS_MS - 1000, 'guest session does not expire');
    const grant = check.prepare('SELECT created_at,expires_at,recipient_profile FROM auth_review_grants WHERE user_id=?').get(MARNIN_ID) as { created_at: number; expires_at: number; recipient_profile: string };
    assert.equal(grant.recipient_profile, 'company');
    assert.equal(grant.expires_at - grant.created_at, TEN_YEARS_MS);
    check.close();
  } finally {
    for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    rmSync(folder, { recursive: true, force: true });
  }
});
