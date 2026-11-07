import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs, { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- the launcher helper is CommonJS.
const { prepareDataDir, APP_UID } = require('../scripts/data-dir.cjs') as {
  prepareDataDir: (options: Record<string, unknown>) => { dir: string; persistent: boolean; droppedPrivileges: boolean };
  APP_UID: number;
};

const notRoot = { platform: 'linux', getuid: () => 1001 };

function sandbox() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'tayco-data-dir-'));
  // A path under a regular file can never be created: stands in for Railway's root-owned volume.
  const blocker = path.join(root, 'not-a-dir');
  writeFileSync(blocker, '');
  return { root, unwritable: path.join(blocker, '.data'), fallback: path.join(root, 'tmp-data') };
}

test('on Railway an unwritable volume fails loudly instead of falling back to /tmp', () => {
  const s = sandbox();
  try {
    assert.throws(
      () => prepareDataDir({ env: { RAILWAY_ENVIRONMENT: 'product-review' }, proc: notRoot, preferred: s.unwritable, fallback: s.fallback }),
      /Refusing to fall back/,
    );
    assert.equal(existsSync(s.fallback), false, 'no ephemeral fallback directory may be created on Railway');
    assert.throws(
      () => prepareDataDir({ env: { RAILWAY_ENVIRONMENT_ID: 'id' }, proc: notRoot, preferred: s.unwritable, fallback: s.fallback }),
      /Refusing to fall back/,
    );
  } finally {
    rmSync(s.root, { recursive: true, force: true });
  }
});

test('off Railway (local preview) the ephemeral fallback is allowed and reported as not persistent', () => {
  const s = sandbox();
  try {
    const result = prepareDataDir({ env: {}, proc: notRoot, preferred: s.unwritable, fallback: s.fallback });
    assert.deepEqual(result, { dir: s.fallback, persistent: false, droppedPrivileges: false });
  } finally {
    rmSync(s.root, { recursive: true, force: true });
  }
});

test('a writable volume is persistent', () => {
  const s = sandbox();
  try {
    const preferred = path.join(s.root, 'volume');
    const result = prepareDataDir({ env: { RAILWAY_ENVIRONMENT: 'product-review' }, proc: notRoot, preferred, fallback: s.fallback });
    assert.deepEqual(result, { dir: preferred, persistent: true, droppedPrivileges: false });
  } finally {
    rmSync(s.root, { recursive: true, force: true });
  }
});

test('as root with the Docker image layout it hands the volume to UID 1001 and drops privileges before probing', () => {
  const s = sandbox();
  try {
    const preferred = path.join(s.root, 'volume');
    fs.mkdirSync(preferred);
    writeFileSync(path.join(preferred, 'tayco-auth.sqlite'), '');
    const calls: string[] = [];
    const fakeFs = {
      ...fs,
      statSync: (p: string) => (p.endsWith('package.json') ? { uid: APP_UID } : fs.statSync(p)),
      chownSync: (p: string, uid: number, gid: number) => { calls.push(`chown ${path.basename(p)} ${uid}:${gid}`); },
      writeFileSync: (p: string, data: string) => { calls.push(`probe ${path.basename(p)}`); fs.writeFileSync(p, data); },
    };
    const proc = {
      platform: 'linux',
      getuid: () => 0,
      setgroups: (g: number[]) => calls.push(`setgroups ${g.length}`),
      setgid: (id: number) => calls.push(`setgid ${id}`),
      setuid: (id: number) => calls.push(`setuid ${id}`),
    };
    const result = prepareDataDir({ env: { RAILWAY_ENVIRONMENT: 'product-review' }, fs: fakeFs, proc, appRoot: s.root, preferred, fallback: s.fallback });
    assert.deepEqual(result, { dir: preferred, persistent: true, droppedPrivileges: true });
    assert.deepEqual(calls, [
      'chown volume 1001:1001',
      'chown tayco-auth.sqlite 1001:1001',
      'setgroups 0',
      'setgid 1001',
      'setuid 1001',
      'probe .write-probe',
    ]);
  } finally {
    rmSync(s.root, { recursive: true, force: true });
  }
});

test('as root with a root-owned build (Railpack) it keeps privileges so the server can still read its files', () => {
  const s = sandbox();
  try {
    const preferred = path.join(s.root, 'volume');
    const calls: string[] = [];
    const fakeFs = { ...fs, statSync: () => ({ uid: 0 }) };
    const proc = { platform: 'linux', getuid: () => 0, setgroups: () => calls.push('setgroups'), setgid: () => calls.push('setgid'), setuid: () => calls.push('setuid') };
    const result = prepareDataDir({ env: {}, fs: fakeFs, proc, appRoot: s.root, preferred, fallback: s.fallback });
    assert.equal(result.droppedPrivileges, false);
    assert.deepEqual(calls, []);
  } finally {
    rmSync(s.root, { recursive: true, force: true });
  }
});

test('/api/health is not ready on Railway when the databases are not on the persistent volume', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'tayco-health-'));
  const keys = ['RAILWAY_ENVIRONMENT', 'RAILWAY_ENVIRONMENT_ID', 'TAYCO_DATA_PERSISTENT', 'TAYCO_SESSION_SECRET', 'TAYCO_APP_URL', 'TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH'] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  try {
    Object.assign(process.env, {
      TAYCO_SESSION_SECRET: 'x'.repeat(40),
      TAYCO_APP_URL: 'https://tayco.example',
      TAYCO_AUTH_DB_PATH: path.join(dir, 'tayco-auth.sqlite'),
      TAYCO_ERP_DB_PATH: path.join(dir, 'tayco-erp.sqlite'),
      RAILWAY_ENVIRONMENT: 'product-review',
    });
    const { GET } = await import('../app/api/health/route');

    process.env.TAYCO_DATA_PERSISTENT = '0';
    let res = GET();
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { status: 'unavailable' });

    delete process.env.TAYCO_DATA_PERSISTENT;
    assert.equal(GET().status, 503, 'a server started without the launcher is not ready on Railway');

    process.env.TAYCO_DATA_PERSISTENT = '1';
    res = GET();
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ready' });

    delete process.env.RAILWAY_ENVIRONMENT;
    delete process.env.TAYCO_DATA_PERSISTENT;
    assert.equal(GET().status, 200, 'local previews are unaffected');
  } finally {
    for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
    rmSync(dir, { recursive: true, force: true });
  }
});
