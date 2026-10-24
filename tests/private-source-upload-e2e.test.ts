import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, openSync, writeSync, closeSync, fsyncSync, readFileSync, writeFileSync, rmSync, createReadStream, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { provisionAdmin, provisionAdditionalAdminPrivately, signIn, signOut, SESSION_COOKIE } from '../lib/auth';
import { database } from '../lib/erp';
import { runPrivateSourceUpload } from '../lib/private-source-upload-client';
type Owned = {
    child: ChildProcess;
    kind: 'server' | 'cli';
    cwd: string;
    script: string;
    done: boolean;
    out: string;
    err: string;
    completion: Promise<number | null>;
};
type Account = {
    email: string;
    password: string;
};
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
async function until(check: () => boolean | Promise<boolean>, ms = 15000) { const end = Date.now() + ms; while (Date.now() < end) {
    if (await check())
        return;
    await delay(25);
} throw new Error('Synthetic owned-operation probe timed out.'); }
async function fileHash(file: string) { const h = createHash('sha256'); for await (const b of createReadStream(file, { highWaterMark: 64 * 1024 }))
    h.update(b); return h.digest('hex'); }
test('operator CLI uses actual production Next socket, private storage and restart on 64MiB synthetic source', { skip: process.env.TAYCO_PRIVATE_UPLOAD_E2E !== '1', timeout: 300000 }, async (t) => {
    const project = process.cwd(), standalone = path.join(project, '.next', 'standalone'), serverScript = path.join(standalone, 'server.js'), probeScript = path.join(project, 'tests', 'fixtures', 'owned-process-probe.cjs'), cliScript = path.join(project, 'scripts', 'upload-private-source.ts');
    assert.ok(existsSync(serverScript), 'Build the current Next standalone output before this opt-in test.');
    if(process.env.TAYCO_UPLOAD_E2E_PROOF){const output=path.resolve(process.env.TAYCO_UPLOAD_E2E_PROOF);assert.ok(output.startsWith(path.resolve(project,'.data')+path.sep));writeFileSync(output,JSON.stringify({state:'running',startedAt:new Date().toISOString()}));}
    const root = mkdtempSync(path.join(tmpdir(), 'tayco-private-upload-e2e-')), authFile = path.join(root, 'auth.sqlite'), erpFile = path.join(root, 'erp.sqlite'), privateRoot = path.join(root, 'quarantine');
    const envKeys = ['TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_SESSION_SECRET', 'TAYCO_APP_URL', 'TAYCO_SOURCE_UPLOAD_ROOT'], old = Object.fromEntries(envKeys.map(k => [k, process.env[k]]));
    const osEnvironment: NodeJS.ProcessEnv = { NODE_ENV: "test" };
    for (const key of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'APPDATA', 'LOCALAPPDATA', 'USERPROFILE', 'PROGRAMFILES', 'ProgramFiles', 'PROGRAMFILES(X86)', 'ComSpec'])
        if (process.env[key])
            osEnvironment[key] = process.env[key];
    const port = await new Promise<number>((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const selected = (s.address() as net.AddressInfo).port; s.close(error => error ? reject(error) : resolve(selected)); }); });
    const origin = 'http://127.0.0.1:' + port, secret = randomBytes(48).toString('hex');
    const fixed = { TAYCO_AUTH_DB_PATH: authFile, TAYCO_ERP_DB_PATH: erpFile, TAYCO_SESSION_SECRET: secret, TAYCO_APP_URL: origin, TAYCO_SOURCE_UPLOAD_ROOT: privateRoot };
    Object.assign(process.env, fixed);
    const completedScenarios:string[]=[];
    async function scenario(name:string,body:()=>Promise<void>){await t.test(name,async()=>{await body();completedScenarios.push(name);});}
    const children: Owned[] = [], processProof: Record<string, unknown>[] = [], phases: Record<string, unknown>[] = [], clientMetrics: unknown[] = [];
    const bootstrap: Account = { email: 'operator-bootstrap@example.test', password: randomBytes(36).toString('base64url') };
    let server: Owned | undefined, erp: ReturnType<typeof database> | undefined, rawSession: Awaited<ReturnType<typeof signIn>> | undefined;
    function owners() {
        if (process.platform !== 'win32')
            return null;
        const result = spawnSync('netstat.exe', ['-ano', '-p', 'tcp'], { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
        assert.equal(result.status, 0, 'Owned port probe unavailable: '+String(result.error?.name ?? result.signal ?? result.status));
        return result.stdout.split(/\r?\n/).filter(line => line.includes('127.0.0.1:' + port + ' ') && /LISTENING|ESCUCHANDO/.test(line)).map(line => Number(line.trim().split(/\s+/).at(-1)));
    }
    function start(kind: 'server' | 'cli', args: string[], cwd: string, env: NodeJS.ProcessEnv) {
        const child = spawn(process.execPath, ['--import', pathToFileURL(probeScript).href, ...args], { cwd, env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
        const owned: Owned = { child, kind, cwd, script: kind === 'server' ? serverScript : cliScript, done: false, out: '', err: '', completion: Promise.resolve(null) };
        child.stdout?.on('data', data => { owned.out += data.toString(); assert.ok(owned.out.length < 1024 * 1024, 'Bounded CLI/server capture.'); });
        child.stderr?.on('data', data => { owned.err += data.toString(); assert.ok(owned.err.length < 1024 * 1024, 'Bounded private stderr capture.'); });
        owned.completion = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', code => { owned.done = true; resolve(code); }); });
        void owned.completion.catch(() => { });
        children.push(owned);
        return owned;
    }
    async function probe(owned: Owned) {
        if (owned.done)
            return null;
        const nonce = randomUUID();
        const value = await new Promise<Record<string, unknown>>((resolve, reject) => {
            const timeout = setTimeout(() => { owned.child.removeListener('message', message); reject(new Error('Owned IPC verification did not complete.')); }, 5000);
            const message = (data: unknown) => { const x = data as Record<string, unknown>; if (x?.nonce === nonce) {
                clearTimeout(timeout);
                owned.child.removeListener('message', message);
                resolve(x);
            } };
            owned.child.on('message', message);
            owned.child.send({ type: 'owned-process-probe', nonce });
        });
        assert.equal(value.pid, owned.child.pid);
        assert.equal(value.ppid, process.pid);
        assert.equal(path.resolve(String(value.cwd)), path.resolve(owned.cwd));
        const argv = value.argv as string[];
        assert.equal(path.resolve(argv[1]), path.resolve(owned.script));
        assert.ok(!JSON.stringify(argv).includes(bootstrap.password));
        processProof.push({ kind: owned.kind, pid: value.pid, parent: value.ppid, cwd: value.cwd, argv, memory: value.memory });
        return value;
    }
    async function launch() {
        assert.deepEqual(owners() ?? [], []);
        const child = start('server', [serverScript], standalone, { ...osEnvironment, ...fixed, PORT: String(port), HOSTNAME: '127.0.0.1', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' });
        await until(async () => { if (child.done)
            throw new Error('Owned Next process exited during startup.'); try {
            return (await fetch(origin + '/api/health', { signal: AbortSignal.timeout(1000) })).status === 200;
        }
        catch {
            return false;
        } }, 30000);
        await probe(child);
        const listeners = owners();
        if (listeners) assert.ok(listeners.every(pid => pid === child.child.pid) && listeners.length > 0);
        return child;
    }
    async function stop(owned: Owned, force = false) {
        if (owned.done)
            return;
        await probe(owned);
        const listeners = owned.kind === 'server' ? owners() : null;
        if (listeners) assert.ok(listeners.every(pid => pid === owned.child.pid), 'Never terminate a different port owner.');
        owned.child.kill(force ? 'SIGKILL' : 'SIGTERM');
        await owned.completion;
        if (owned.kind === 'server')
            await until(() => !owners()?.length, 10000);
    }
    async function account(label: string) { const value = { email: 'operator-' + label + '@example.test', password: randomBytes(36).toString('base64url') }; await provisionAdditionalAdminPrivately(value.email, value.password, 'tayco_llc'); return value; }
    function generate(name: string, bytes: number) {
        const file = path.join(root, name), fd = openSync(file, 'wx', 0o600), block = Buffer.alloc(64 * 1024, 71);
        let offset = 0;
        try {
            while (offset < bytes) {
                block.writeUInt32LE(offset >>> 0, 0);
                const size = Math.min(block.length, bytes - offset);
                let written=0;while(written<size){const n=writeSync(fd,block,written,size-written);assert.ok(n>0);written+=n;}
                offset += size;
            }
            fsyncSync(fd);
        }
        finally {
            closeSync(fd);
        }
        return file;
    }
    async function cli(a: Account, journal: string, file?: string, extra: string[] = []) {
        const args = ['--import', 'tsx', cliScript, '--journal=' + journal, ...(file ? ['--file=' + file] : []), ...extra];
        const owned = start('cli', args, project, { ...osEnvironment, TAYCO_APP_URL: origin, TAYCO_UPLOAD_EMAIL: a.email, TAYCO_UPLOAD_PASSWORD: a.password });
        const status = await owned.completion;
        assert.ok(!owned.out.includes(a.password) && !owned.err.includes(a.password) && !owned.out.includes(secret) && !owned.err.includes(secret));
        const raw = (owned.out.trim() || owned.err.trim().split(/\r?\n/).at(-1) || '');
        let value: Record<string, unknown>;
        try {
            value = JSON.parse(raw);
        }
        catch {
            throw new Error('Operator did not produce its closed JSON result.');
        }
        if (value.metrics)
            clientMetrics.push(value.metrics);
        return { status, value };
    }
    const cookie = () => SESSION_COOKIE + '=' + encodeURIComponent(rawSession!.cookie);
    async function raw(method: string, route: string, data?: unknown) {
        const response = await fetch(origin + route, { method, headers: { Origin: origin, Cookie: cookie(), ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}) }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}), redirect: 'manual' });
        return { status: response.status, value: await response.json() };
    }
    try {
        await provisionAdmin(bootstrap.email, bootstrap.password);
        erp = database();
        rawSession = await signIn(bootstrap.email, bootstrap.password);
        const records = JSON.stringify(erp.prepare('SELECT * FROM records').all());
        server = await launch();
        const large = generate('large-synthetic.bin', 64 * 1024 * 1024), largeSha = await fileHash(large), largeAccount = await account('large'), largeJournal = path.join(root, 'large.progress.json');
        await scenario('64MiB actual CLI pause, owned server hard restart, fresh status and resume are byte exact', async () => {
            const first = await cli(largeAccount, largeJournal, large, ['--max-chunks=16']);
            assert.equal(first.status, 0, JSON.stringify(first.value));
            assert.equal(first.value.clientPaused, true);
            assert.equal(first.value.committedOffset, 16 * 1024 * 1024);
            const originalBinding = readFileSync(largeJournal + '.reservation.json'), id = String(first.value.id), expiresAt = first.value.expiresAt, firstPid = server!.child.pid;
            await stop(server!, true);
            server = undefined;
            server = await launch();
            assert.notEqual(server.child.pid, firstPid);
            const current = await cli(largeAccount, largeJournal, undefined, ['--status']);
            assert.equal(current.status, 0);
            assert.equal(current.value.id, id);
            assert.equal(current.value.committedOffset, 16 * 1024 * 1024);
            assert.equal(current.value.expiresAt, expiresAt);
            const resumed = await cli(largeAccount, largeJournal, large);
            assert.equal(resumed.status, 0, JSON.stringify(resumed.value));
            assert.equal(resumed.value.state, 'stored');
            assert.equal(resumed.value.sourceAdmission, 'not_registered');
            assert.equal(resumed.value.sessionCleanup, 'confirmed');
            assert.ok(readFileSync(largeJournal + '.reservation.json').equals(originalBinding));
            const stored = path.join(privateRoot, hash('tayco_llc'), id + '.bin');
            assert.equal(statSync(stored).size, 64 * 1024 * 1024);
            assert.equal(await fileHash(stored), largeSha);
            assert.equal(await fileHash(large), largeSha);
            const chunks = Number(erp!.prepare('SELECT count(*) AS n FROM source_upload_chunks WHERE upload_id=?').get(id)!.n);
            assert.equal(chunks, 64);
            const replay = await cli(largeAccount, largeJournal, large);
            assert.equal(replay.status, 0);
            assert.equal(replay.value.storedAt, resumed.value.storedAt);
            assert.equal(erp!.prepare("SELECT count(*) AS n FROM audit WHERE action='source_upload.stored' AND resource_id=?").get(id)!.n, 1);
            phases.push({ case: '64MiB-socket-restart', id, bytes: 64 * 1024 * 1024, sha256: largeSha, firstPid, secondPid: server!.child.pid, chunkRows: chunks, storedEvents: 1, unchangedSource: true, immutableBinding: true });
        });
        await scenario('TCP disconnect after half a chunk preserves committed prefix and actual CLI resumes', async () => {
            const a = await account('disconnect'), file = generate('disconnect-synthetic.bin', 2 * 1024 * 1024), journal = path.join(root, 'disconnect.progress.json');
            const partial = await cli(a, journal, file, ['--max-chunks=1']);
            assert.equal(partial.status, 0);
            const id = String(partial.value.id);
            const signed = await signIn(a.email, a.password), pair = SESSION_COOKIE + '=' + encodeURIComponent(signed.cookie), second = Buffer.alloc(1024 * 1024);
            const fd = openSync(file, 'r');
            try {
                assert.equal(requireRead(fd, second, 1024 * 1024), second.length);
            }
            finally {
                closeSync(fd);
            }
            const closed = new Promise<void>((resolve, reject) => {
                const request = http.request(origin + '/api/source-uploads/' + id, { method: 'PATCH', headers: { Origin: origin, Cookie: pair, 'Content-Type': 'application/octet-stream', 'Content-Length': String(second.length), 'Upload-Offset': String(1024 * 1024), 'Upload-Chunk-SHA256': hash(second) } });
                request.on('error', () => { });
                request.on('close', () => resolve());
                request.on('response', () => reject(new Error('Incomplete body must not return a successful ACK.')));
                request.write(second.subarray(0, second.length / 2), async (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    try {
                        const auth = new DatabaseSync(authFile);
                        try {
                            await until(() => { const x = auth.prepare("SELECT hits FROM auth_rate_limits WHERE bucket=?").get('source-upload:chunk:actor:tayco_llc:' + signed.actor.id) as {
                                hits: number;
                            } | undefined; return Number(x?.hits) >= 2; }, 5000);
                        }
                        finally {
                            auth.close();
                        }
                        phases.push({ case: 'tcp-midbody-disconnect', bytesWritten: request.socket?.bytesWritten, declaredBytes: second.length, sentBodyBytes: second.length / 2 });
                        request.destroy();
                    }
                    catch (problem) {
                        request.destroy();
                        reject(problem);
                    }
                });
            });
            await closed;
            await signOut(new Request(origin, { headers: { Cookie: pair } }));
            assert.equal(erp!.prepare('SELECT offset FROM source_uploads WHERE id=?').get(id)!.offset, 1024 * 1024);
            const done = await cli(a, journal, file);
            assert.equal(done.status, 0, JSON.stringify(done.value));
            assert.equal(done.value.state, 'stored');
            assert.equal(erp!.prepare('SELECT count(*) AS n FROM source_upload_chunks WHERE upload_id=?').get(id)!.n, 2);
        });
        await scenario('discarded real response bodies after chunk and finish recover without duplicate bytes or receipt', async () => {
            const a = await account('lost-ack'), file = generate('lost-ack-synthetic.bin', 2 * 1024 * 1024), journal = path.join(root, 'lost-ack.progress.json');
            let chunkLost = false, finishLost = false;
            const transport: typeof fetch = async (input, init) => {
                const response = await fetch(input, init), url = String(input);
                if (response.ok && (!chunkLost && init?.method === 'PATCH' || !finishLost && url.endsWith('/finish'))) {
                    if (init?.method === 'PATCH')
                        chunkLost = true;
                    else
                        finishLost = true;
                    phases.push({ case: 'discarded-response-after-real-headers', operation: init?.method === 'PATCH' ? 'chunk' : 'finish', status: response.status, bodyUsed: response.bodyUsed });
                    if (response.body)
                        void response.body.cancel().catch(() => { });
                    throw new TypeError('Synthetic lost ACK after actual response headers.');
                }
                return response;
            };
            const result = await runPrivateSourceUpload({ origin, email: a.email, password: a.password, file, journal, transport });
            assert.equal(result.state, 'stored');
            assert.ok(chunkLost && finishLost);
            assert.ok(result.metrics.retries >= 2);
            clientMetrics.push(result.metrics);
            assert.equal(erp!.prepare('SELECT count(*) AS n FROM source_upload_chunks WHERE upload_id=?').get(result.id)!.n, 2);
            assert.equal(erp!.prepare("SELECT count(*) AS n FROM audit WHERE action='source_upload.stored' AND resource_id=?").get(result.id)!.n, 1);
        });
        await scenario('two actual CLI processes share one journal, upload and stored receipt', async () => {
            const a = await account('concurrent'), file = generate('concurrent-synthetic.bin', 2 * 1024 * 1024), journal = path.join(root, 'concurrent.progress.json');
            assert.equal((await cli(a, journal, file, ['--max-chunks=1'])).status, 0);
            const result = await Promise.all([cli(a, journal, file), cli(a, journal, file)]);
            assert.ok(result.every(x => x.status === 0), JSON.stringify(result));
            assert.equal(result[0].value.id, result[1].value.id);
            assert.equal(result[0].value.storedAt, result[1].value.storedAt);
            const id = String(result[0].value.id);
            assert.equal(erp!.prepare('SELECT count(*) AS n FROM source_upload_chunks WHERE upload_id=?').get(id)!.n, 2);
            assert.equal(erp!.prepare("SELECT count(*) AS n FROM audit WHERE action='source_upload.stored' AND resource_id=?").get(id)!.n, 1);
        });
        await scenario('aged synthetic reservation expires without a new upload; explicit cancellation reclaims only own part', async () => {
            const a = await account('expiry'), file = generate('expiry-synthetic.bin', 2 * 1024 * 1024), journal = path.join(root, 'expiry.progress.json'), first = await cli(a, journal, file, ['--max-chunks=1']);
            assert.equal(first.status, 0);
            const id = String(first.value.id), created = Date.now() - 5 * 3600000, expires = created + 4 * 3600000, binding = JSON.parse(readFileSync(journal + '.reservation.json', 'utf8'));
            // Age this newly generated synthetic row and corresponding immutable journal fixture, never the OS clock or a real grant.
            erp!.prepare('UPDATE source_uploads SET created_at=?,expires_at=? WHERE id=?').run(created, expires, id);
            binding.createdAt = new Date(created).toISOString();
            binding.expiresAt = new Date(expires).toISOString();
            writeFileSync(journal + '.reservation.json', JSON.stringify(binding));
            const count = erp!.prepare('SELECT count(*) AS n FROM source_uploads').get()!.n, expired = await cli(a, journal, file);
            assert.equal(expired.status, 1);
            assert.equal(expired.value.error, 'upload_expired');
            assert.equal(erp!.prepare('SELECT count(*) AS n FROM source_uploads').get()!.n, count);
            const observation = await cli(a, journal, undefined, ['--status']);
            assert.equal(observation.value.state, 'expired');
            assert.equal(observation.value.expiresAt, binding.expiresAt);
            const cancelled = await cli(a, journal, undefined, ['--cancel']);
            assert.equal(cancelled.status, 0);
            assert.equal(cancelled.value.state, 'cancelled');
            assert.equal(erp!.prepare('SELECT accounted_bytes FROM source_uploads WHERE id=?').get(id)!.accounted_bytes, 0);
            phases.push({ case: 'expiry', method: 'Only own synthetic SQL row and corresponding journal aged; no OS clock or real grant change', noNewUpload: true });
        });
        await scenario('real CLI quota failure is redacted and cannot allocate another reservation', async () => {
            const used = Number(erp!.prepare('SELECT COALESCE(sum(accounted_bytes),0) AS n FROM source_uploads WHERE tenant_id=?').get('tayco_llc')!.n), reserved: string[] = [];
            let left = 2 * 1024 ** 3 - used;
            try {
                while (left) {
                    const amount = Math.min(left, 1024 ** 3), x = await raw('POST', '/api/source-uploads', { requestKey: randomUUID(), expectedBytes: amount, sha256: '0'.repeat(64), mediaType: 'application/octet-stream' });
                    assert.equal(x.status, 200);
                    reserved.push(x.value.id);
                    left -= amount;
                }
                const count = erp!.prepare('SELECT count(*) AS n FROM source_uploads').get()!.n, a = await account('quota'), file = generate('quota-synthetic.bin', 1024), journal = path.join(root, 'quota.progress.json'), failed = await cli(a, journal, file);
                assert.equal(failed.status, 1);
                assert.equal(failed.value.status, 429);
                assert.equal(erp!.prepare('SELECT count(*) AS n FROM source_uploads').get()!.n, count);
            }
            finally {
                for (const id of reserved)
                    assert.equal((await raw('DELETE', '/api/source-uploads/' + id)).status, 200);
            }
        });
        assert.equal(completedScenarios.length,6,'Every socket scenario must complete before publishing proof.');
        assert.equal(JSON.stringify(erp.prepare('SELECT * FROM records').all()), records);
        assert.ok(clientMetrics.length > 0);
        for (const item of clientMetrics) {
            const m = item as Record<string, number>;
            assert.ok(m.hashBufferBytes <= 64 * 1024);
            assert.ok(m.chunkBufferBytes <= 1024 * 1024);
            assert.ok(m.requestCopyBytes <= 1024 * 1024);
            assert.ok(m.responseBytes <= 128 * 1024);
        }
        await signOut(new Request(origin, { headers: { Cookie: cookie() } }));
        rawSession = undefined;
        const auth = new DatabaseSync(authFile);
        const sessions = Number(auth.prepare('SELECT count(*) AS n FROM auth_sessions').get()!.n);
        auth.close();
        assert.equal(sessions, 0);
        const proof = { state:'completed',completedScenarios,kind: 'actual-local-socket-production-Next-synthetic-only', origin, sourceBytes: 64 * 1024 * 1024, sourceSha256: largeSha, sourceUnchanged: await fileHash(large) === largeSha, processProof, phases, clientMetrics, sessionsRemaining: sessions, operationalRecordsUnchanged: true, limits: ['No Railway/proxy/TLS/replica or power-loss proof', 'Expiry fixture ages only own synthetic row/journal; not OS clock', 'Lost ACK probes discard real response bodies after headers; separate test physically disconnects TCP mid-body', 'Explicit source/chunk/response buffer observations are not a bound on all V8/HTTP RSS', 'No real database/source copied, no source admission or grant'] };
        if (process.env.TAYCO_UPLOAD_E2E_PROOF) {
            const proofFile = path.resolve(process.env.TAYCO_UPLOAD_E2E_PROOF), allowed = path.resolve(project, '.data');
            assert.ok(proofFile.startsWith(allowed + path.sep));
            writeFileSync(proofFile, JSON.stringify(proof, null, 2));
        }
    }
    finally {
        if (process.env.TAYCO_UPLOAD_E2E_PROOF) {
            const diagnostic = children.map(x => ({ kind: x.kind, done: x.done, out: x.out, err: x.err }));
            assert.ok(!JSON.stringify(diagnostic).includes(secret) && !JSON.stringify(diagnostic).includes(bootstrap.password));
            writeFileSync(path.join(project, '.data/private-upload-operator-20261024/socket-process-diagnostic.json'), JSON.stringify(diagnostic, null, 2));
        }
        if (rawSession)
            try {
                await signOut(new Request(origin, { headers: { Cookie: cookie() } }));
            }
            catch { }
        for (const child of children)
            if (!child.done)
                await stop(child, true);
        erp?.close();
        for (const key of envKeys) {
            if (old[key] === undefined)
                delete process.env[key];
            else
                process.env[key] = old[key];
        }
        assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep));
        rmSync(root, { recursive: true, force: true });
        assert.ok(children.every(child => child.done));
        assert.deepEqual(owners() ?? [], []);
        if (process.env.TAYCO_UPLOAD_E2E_PROOF) writeFileSync(path.join(project, '.data/private-upload-operator-20261024/socket-cleanup-proof.json'), JSON.stringify({ownChildrenExited:children.map(x => ({kind:x.kind,pid:x.child.pid,done:x.done})),selectedPort:port,portOwners:owners(),syntheticTempRemoved:!existsSync(root)}, null, 2));
    }
});
function requireRead(fd: number, bytes: Buffer, offset: number) {
    // Bounded independent test read of one chunk, never the full source.
    return readSyncForTest(fd, bytes, 0, bytes.length, offset);
}
import { readSync as readSyncForTest } from 'node:fs';
