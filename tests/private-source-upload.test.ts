import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, truncateSync, existsSync, rmSync, linkSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { provisionAdmin, provisionAdditionalAdminPrivately, signIn, requireActor, createInvitation, acceptInvitation, revokeUserSessionsPrivately, SESSION_COOKIE, AuthError } from '../lib/auth';
import { database } from '../lib/erp';
import { startSourceUpload as start, sourceUploadStatus as status, appendSourceUpload as append, finishSourceUpload as finish, cancelSourceUpload as cancel, SourceUploadError, SOURCE_UPLOAD_POLICY as policy } from '../lib/private-source-upload';
const sha = (x: Uint8Array | string) => createHash('sha256').update(x).digest('hex');
const body = (bytes: Uint8Array) => new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bytes); c.close(); } });
const errorStatus = (n: number) => (e: unknown) => e instanceof SourceUploadError && e.status === n;
test('private upload core uses persisted sessions, exact bytes and recoverable SQL/filesystem seams', async (t) => {
    const root = mkdtempSync(path.join(tmpdir(), 'tayco-private-upload-'));
    const keys = ['TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_SESSION_SECRET', 'TAYCO_APP_URL', 'TAYCO_SOURCE_UPLOAD_ROOT'];
    const old = Object.fromEntries(keys.map(k => [k, process.env[k]]));
    Object.assign(process.env, { TAYCO_AUTH_DB_PATH: path.join(root, 'auth.sqlite'), TAYCO_ERP_DB_PATH: path.join(root, 'erp.sqlite'), TAYCO_SESSION_SECRET: randomBytes(48).toString('hex'), TAYCO_APP_URL: 'https://tayco.test', TAYCO_SOURCE_UPLOAD_ROOT: path.join(root, 'quarantine') });
    const password = 'Synthetic-upload-fixtures-only-2026!';
    let db: ReturnType<typeof database> | undefined;
    const request = (cookie: string) => new Request('https://tayco.test/operator', { headers: { cookie: SESSION_COOKIE + '=' + encodeURIComponent(cookie) } });
    const makeMetadata = (bytes: Uint8Array, extra = {}) => ({ requestKey: randomUUID(), expectedBytes: bytes.length, sha256: sha(bytes), mediaType: 'application/octet-stream', ...extra });
    let login: Awaited<ReturnType<typeof signIn>>;
    const renew = async () => { login = await signIn('upload-admin@example.test', password); return request(login.cookie); };
    const req = () => request(login.cookie);
    const upload = async (bytes: Uint8Array) => start(req(), makeMetadata(bytes));
    const privateFile = (id: string, extension = 'part') => path.join(process.env.TAYCO_SOURCE_UPLOAD_ROOT!, sha('tayco_llc'), id + '.' + extension);
    const child = (command: Record<string, unknown>) => new Promise<{
        ok: boolean;
        status?: number;
        value: Record<string, unknown>;
    }>((resolve, reject) => {
        const p = spawn(process.execPath, ['--import', 'tsx', 'tests/fixtures/private-upload-worker.ts'], { env: { ...process.env, TAYCO_UPLOAD_TEST_COOKIE: login.cookie, TAYCO_UPLOAD_TEST_COMMAND: JSON.stringify(command) }, stdio: ['ignore', 'pipe', 'pipe'] });
        let output = '', err = '';
        p.stdout.on('data', x => output += x);
        p.stderr.on('data', x => err += x);
        p.once('error', reject);
        p.once('close', code => {
            if (code !== 0)
                reject(new Error(err));
            else {
                try {
                    resolve(JSON.parse(output));
                }
                catch {
                    reject(new Error('Worker did not return a bounded result.'));
                }
            }
        });
    });
    try {
        await provisionAdmin('upload-admin@example.test', password);
        await renew();
        db = database();
        const actor = await requireActor(req()), records = JSON.stringify(db.prepare('SELECT * FROM records').all());
        await t.test('anonymous and staff are denied before upload storage is initialized', async () => {
            await assert.rejects(start(new Request('https://tayco.test/operator'), makeMetadata(Buffer.from('a'))), e => e instanceof AuthError && e.status === 401);
            const invite = createInvitation(actor, { email: 'upload-staff@example.test', role: 'staff', tenantId: actor.tenantId, projectIds: [] });
            const staff = await acceptInvitation(invite.token, 'upload-staff@example.test', password);
            await assert.rejects(start(request(staff.cookie), makeMetadata(Buffer.from('a'))), e => e instanceof AuthError && e.status === 403);
            assert.equal(existsSync(process.env.TAYCO_SOURCE_UPLOAD_ROOT!), false);
        });
        await t.test('reservation dedup preserves deadline; changed metadata conflicts and closed input rejects paths', async () => {
            const m = makeMetadata(Buffer.from('hello')), a = await start(req(), m), b = await start(req(), m);
            assert.equal(a.id, b.id);
            assert.equal(b.replayed, true);
            assert.equal(a.expiresAt, b.expiresAt);
            assert.equal(a.verification, 'not_verified');
            await assert.rejects(start(req(), { ...m, expectedBytes: 99 }), errorStatus(409));
            await assert.rejects(start(req(), { ...m, fileName: '../secret.pdf' }), errorStatus(422));
            await assert.rejects(status(req(), '../../secret'), errorStatus(404));
            await cancel(req(), a.id);
        });
        await t.test('chunks, duplicate/lost ACK, offset zero, gaps and full finish are exact', async () => {
            const a = await upload(Buffer.from('helloworld'));
            const one = await append(req(), a.id, 0, sha('hello'), body(Buffer.from('hello')));
            const replay = await append(req(), a.id, 0, sha('hello'), body(Buffer.from('hello')));
            assert.equal(one.committedOffset, 5);
            assert.equal(replay.replayed, true);
            await assert.rejects(append(req(), a.id, 0, sha('other'), body(Buffer.from('other'))), errorStatus(409));
            await assert.rejects(append(req(), a.id, 7, sha('x'), body(Buffer.from('x'))), errorStatus(409));
            assert.equal(readFileSync(privateFile(a.id)).toString(), 'hello');
            await append(req(), a.id, 5, sha('world'), body(Buffer.from('world')));
            const stored = await finish(req(), a.id), again = await finish(req(), a.id);
            assert.equal(stored.state, 'stored');
            assert.equal(stored.verification, 'size_and_sha256_only');
            assert.equal(again.storedAt, stored.storedAt);
            assert.equal(again.replayed, true);
            assert.equal(readFileSync(privateFile(a.id, 'bin')).toString(), 'helloworld');
            assert.equal(stored.sourceAdmission, 'not_registered');
            await assert.rejects(cancel(req(), a.id), errorStatus(409));
            const restarted = await child({ action: 'status', id: a.id });
            assert.equal(restarted.value.state, 'stored');
            assert.equal(restarted.value.committedOffset, 10);
        });
        await t.test('body bound, empty, digest mismatch and declared length cannot advance offset', async () => {
            const a = await upload(Buffer.from('a'));
            let cancelled = false;
            const tooLarge = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(Buffer.alloc(policy.chunkBytes + 1)); }, cancel() { cancelled = true; } });
            await assert.rejects(append(req(), a.id, 0, sha('a'), tooLarge), errorStatus(413));
            assert.equal(cancelled, true);
            await assert.rejects(append(req(), a.id, 0, sha('a'), body(Buffer.alloc(0))), errorStatus(422));
            await assert.rejects(append(req(), a.id, 0, sha('a'), body(Buffer.from('b'))), errorStatus(422));
            await assert.rejects(append(req(), a.id, 0, sha('ab'), body(Buffer.from('ab'))), errorStatus(409));
            assert.equal((await status(req(), a.id)).committedOffset, 0);
            await cancel(req(), a.id);
        });
        await t.test('wrong owner and another persisted tenant cannot read, mutate or cancel', async () => {
            const a = await upload(Buffer.from('a'));
            await provisionAdditionalAdminPrivately('upload-second@example.test', password, 'tayco_llc');
            const second = await signIn('upload-second@example.test', password);
            for (const call of [() => status(request(second.cookie), a.id), () => cancel(request(second.cookie), a.id), () => append(request(second.cookie), a.id, 0, sha('a'), body(Buffer.from('a')))])
                await assert.rejects(call(), errorStatus(404));
            // Only this new synthetic persisted account changes tenant, then performs a real sign-in.
            const auth = new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
            auth.prepare('UPDATE auth_users SET tenant_id=? WHERE email=?').run('synthetic_other', 'upload-second@example.test');
            auth.close();
            const other = await signIn('upload-second@example.test', password);
            await assert.rejects(status(request(other.cookie), a.id), errorStatus(404));
            await cancel(req(), a.id);
        });
        await t.test('cancel is idempotent and expiry never releases retained bytes or extends lifetime', async () => {
            const a = await upload(Buffer.from('a'));
            await cancel(req(), a.id);
            assert.equal((await cancel(req(), a.id)).replayed, true);
            assert.equal((await status(req(), a.id)).corrupt, false);
            const b = await upload(Buffer.from('b'));
            db!.prepare('UPDATE source_uploads SET expires_at=? WHERE id=?').run(Date.now() - 1, b.id);
            assert.equal((await status(req(), b.id)).state, 'expired');
            await assert.rejects(append(req(), b.id, 0, sha('b'), body(Buffer.from('b'))), errorStatus(410));
            await assert.rejects(finish(req(), b.id), errorStatus(410));
            assert.equal(db!.prepare('SELECT accounted_bytes FROM source_uploads WHERE id=?').get(b.id)!.accounted_bytes, 1);
            await cancel(req(), b.id);
            assert.equal(existsSync(privateFile(b.id)), false);
        });
        await t.test('tenant byte and actor active quotas are transactional, including reservations', async () => {
            const big = makeMetadata(Buffer.from('a'), { expectedBytes: policy.fileBytes });
            const a = await start(req(), big);
            await assert.rejects(start(req(), { ...big, requestKey: randomUUID() }), errorStatus(429)); // stored hello bytes also count.
            await cancel(req(), a.id);
            const active = [];
            for (let i = 0; i < policy.actorActive; i++)
                active.push(await upload(Buffer.from('a')));
            await assert.rejects(upload(Buffer.from('a')), errorStatus(429));
            for (const x of active)
                await cancel(req(), x.id);
            const lastSlot = [];
            for (let i = 0; i < policy.actorActive - 1; i++)
                lastSlot.push(await upload(Buffer.from('a')));
            const racing = await Promise.all([child({ action: 'start', metadata: makeMetadata(Buffer.from('a')) }), child({ action: 'start', metadata: makeMetadata(Buffer.from('a')) })]);
            assert.equal(racing.filter(x => x.ok).length, 1);
            assert.equal(racing.filter(x => x.status === 429).length, 1);
            for (const x of lastSlot)
                await cancel(req(), x.id);
            for (const x of racing)
                if (x.ok)
                    await cancel(req(), String(x.value.id));
        });
        await t.test('all creators share the tenant unfinished limit and root binding cannot silently migrate', async () => {
            const accounts = [];
            for (let n = 0; n < 2; n++) {
                const email = 'upload-quota-' + n + '@example.test';
                await provisionAdditionalAdminPrivately(email, password, 'tayco_llc');
                accounts.push(await signIn(email, password));
            }
            const slots = [];
            for (const account of accounts)
                for (let n = 0; n < policy.actorActive; n++)
                    slots.push({ cookie: account.cookie, row: await start(request(account.cookie), makeMetadata(Buffer.from('q'))) });
            await assert.rejects(upload(Buffer.from('q')), errorStatus(429));
            const row = slots[0].row, previous = process.env.TAYCO_SOURCE_UPLOAD_ROOT!;
            process.env.TAYCO_SOURCE_UPLOAD_ROOT = path.join(root, 'another-private-root');
            try {
                await assert.rejects(status(request(slots[0].cookie), row.id), errorStatus(503));
            }
            finally {
                process.env.TAYCO_SOURCE_UPLOAD_ROOT = previous;
            }
            for (const slot of slots)
                await cancel(request(slot.cookie), slot.row.id);
        });
        await t.test('SQL chunk failure leaves only an uncommitted tail; authorized retry reconciles it', async () => {
            const a = await upload(Buffer.from('abc'));
            db!.exec("CREATE TRIGGER fail_chunk BEFORE INSERT ON source_upload_chunks BEGIN SELECT RAISE(ABORT,'synthetic chunk fault'); END");
            await assert.rejects(append(req(), a.id, 0, sha('abc'), body(Buffer.from('abc'))), /synthetic chunk fault/);
            assert.equal((await status(req(), a.id)).committedOffset, 0);
            assert.equal((await status(req(), a.id)).recoveryRequired, true);
            assert.equal(readFileSync(privateFile(a.id)).length, 3);
            db!.exec('DROP TRIGGER fail_chunk');
            await append(req(), a.id, 0, sha('abc'), body(Buffer.from('abc')));
            assert.equal(readFileSync(privateFile(a.id)).toString(), 'abc');
            await finish(req(), a.id);
        });
        await t.test('committed short bytes and same-size corrupt stored bytes are rejected without repair', async () => {
            const a = await upload(Buffer.from('abc'));
            await append(req(), a.id, 0, sha('abc'), body(Buffer.from('abc')));
            truncateSync(privateFile(a.id), 2);
            assert.equal((await status(req(), a.id)).corrupt, true);
            await assert.rejects(finish(req(), a.id), errorStatus(409));
            assert.equal(readFileSync(privateFile(a.id)).length, 2);
            await cancel(req(), a.id);
            const b = await upload(Buffer.from('xyz'));
            await append(req(), b.id, 0, sha('xyz'), body(Buffer.from('xyz')));
            await finish(req(), b.id);
            writeFileSync(privateFile(b.id, 'bin'), 'bad');
            await assert.rejects(finish(req(), b.id), errorStatus(409));
            assert.equal(readFileSync(privateFile(b.id, 'bin')).toString(), 'bad');
            writeFileSync(privateFile(b.id, 'bin'), 'oversized');
            assert.equal((await status(req(), b.id)).corrupt, true);
            await assert.rejects(finish(req(), b.id), errorStatus(409));
        });
        await t.test('full hash mismatch is quarantined; incomplete finish does not promote bytes', async () => {
            const a = await start(req(), makeMetadata(Buffer.from('a'), { sha256: sha('b') }));
            await assert.rejects(finish(req(), a.id), errorStatus(409));
            await append(req(), a.id, 0, sha('a'), body(Buffer.from('a')));
            await assert.rejects(finish(req(), a.id), errorStatus(422));
            assert.equal((await status(req(), a.id)).state, 'corrupt');
            assert.equal((await status(req(), a.id)).corrupt, true);
            assert.equal(existsSync(privateFile(a.id, 'bin')), false);
            await cancel(req(), a.id);
        });
        await t.test('promote then SQL fault leaves unpublished sealed bytes and retry adopts exactly once', async () => {
            const a = await upload(Buffer.from('prepared'));
            await append(req(), a.id, 0, sha('prepared'), body(Buffer.from('prepared')));
            db!.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON audit WHEN NEW.action='source_upload.stored' BEGIN SELECT RAISE(ABORT,'synthetic receipt fault'); END");
            await assert.rejects(finish(req(), a.id), /synthetic receipt fault/);
            assert.equal((await status(req(), a.id)).state, 'finishing');
            assert.equal((await status(req(), a.id)).recoveryRequired, true);
            assert.equal(readFileSync(privateFile(a.id, 'bin')).toString(), 'prepared');
            await assert.rejects(cancel(req(), a.id), errorStatus(409));
            db!.exec('DROP TRIGGER fail_receipt');
            await finish(req(), a.id);
            assert.equal(db!.prepare("SELECT count(*) AS n FROM audit WHERE action='source_upload.stored' AND resource_id=?").get(a.id)!.n, 1);
        });
        await t.test('cancel intent survives deletion plus SQL fault; upload cannot reopen', async () => {
            const a = await upload(Buffer.from('a'));
            db!.exec("CREATE TRIGGER fail_cancel BEFORE INSERT ON audit WHEN NEW.action='source_upload.cancelled' BEGIN SELECT RAISE(ABORT,'synthetic cancel fault'); END");
            await assert.rejects(cancel(req(), a.id), /synthetic cancel fault/);
            assert.equal((await status(req(), a.id)).state, 'cancelling');
            assert.equal(existsSync(privateFile(a.id)), false);
            await assert.rejects(append(req(), a.id, 0, sha('a'), body(Buffer.from('a'))), errorStatus(409));
            db!.exec('DROP TRIGGER fail_cancel');
            db!.prepare('UPDATE source_uploads SET lease_until=0 WHERE id=?').run(a.id);
            assert.equal((await cancel(req(), a.id)).state, 'cancelled');
        });
        await t.test('two processes deduplicate chunks/reservations; live durable lease blocks mutations', async () => {
            const a = await upload(Buffer.from('abc'));
            const cmd = { action: 'append', id: a.id, offset: 0, sha: sha('abc'), bytes: Buffer.from('abc').toString('base64') };
            const results = await Promise.all([child(cmd), child(cmd)]);
            assert.ok(results.every(x => x.ok));
            assert.equal(results.filter(x => x.value.replayed).length, 1);
            const metadata = makeMetadata(Buffer.from('q')), reservations = await Promise.all([child({ action: 'start', metadata }), child({ action: 'start', metadata })]);
            assert.equal(reservations[0].value.id, reservations[1].value.id);
            await cancel(req(), String(reservations[0].value.id));
            db!.prepare("UPDATE source_uploads SET state='finishing',lease_token='synthetic-lease',lease_until=? WHERE id=?").run(Date.now() + 30000, a.id);
            await assert.rejects(append(req(), a.id, 0, sha('abc'), body(Buffer.from('abc'))), errorStatus(423));
            await assert.rejects(finish(req(), a.id), errorStatus(423));
            const otherProcessLease=await child({action:'finish',id:a.id});
            assert.equal(otherProcessLease.ok,false);assert.equal(otherProcessLease.status,423);
            db!.prepare('UPDATE source_uploads SET lease_until=0 WHERE id=?').run(a.id);
            assert.equal((await finish(req(), a.id)).state, 'stored');
        });
        await t.test('renewable leases stay valid across IO and do not nest SQL transactions at finish', async () => {
            const a = await upload(Buffer.from('lease'));
            await append(req(), a.id, 0, sha('lease'), body(Buffer.from('lease')));
            const near = Date.now() + 5000;
            db!.exec("CREATE TRIGGER fixture_near_lease AFTER UPDATE OF lease_until ON source_uploads WHEN NEW.state='finishing' AND NEW.lease_token IS NOT NULL BEGIN UPDATE source_uploads SET lease_until=" + near + " WHERE id=NEW.id; END");
            try {
                assert.equal((await finish(req(), a.id)).state, 'stored');
            }
            finally {
                db!.exec('DROP TRIGGER fixture_near_lease');
            }
        });
        await t.test('lease renewal rechecks expiry after a SQL hook before receiving any receipt', async () => {
            const a = await upload(Buffer.from('lease'));
            await append(req(), a.id, 0, sha('lease'), body(Buffer.from('lease')));
            const near = Date.now() + 5000;
            db!.exec("CREATE TRIGGER fixture_expire_renew AFTER UPDATE OF lease_until ON source_uploads WHEN OLD.lease_token IS NOT NULL AND NEW.lease_token=OLD.lease_token BEGIN UPDATE source_uploads SET expires_at=0 WHERE id=NEW.id; END");
            db!.exec("CREATE TRIGGER fixture_claim_near AFTER UPDATE OF state ON source_uploads WHEN NEW.state='finishing' BEGIN UPDATE source_uploads SET lease_until=" + near + " WHERE id=NEW.id; END");
            try {
                await assert.rejects(finish(req(), a.id), errorStatus(410));
                assert.notEqual(db!.prepare('SELECT state FROM source_uploads WHERE id=?').get(a.id)!.state, 'stored');
            }
            finally {
                db!.exec('DROP TRIGGER fixture_expire_renew; DROP TRIGGER fixture_claim_near');
            }
            await cancel(req(), a.id);
        });
        await t.test('hard links and forbidden roots cannot become storage authority', async () => {
            const a = await upload(Buffer.from('a')), alias = path.join(root, 'alias');
            linkSync(privateFile(a.id), alias);
            await assert.rejects(append(req(), a.id, 0, sha('a'), body(Buffer.from('a'))), errorStatus(409));
            rmSync(alias);
            await cancel(req(), a.id);
            const previous = process.env.TAYCO_SOURCE_UPLOAD_ROOT!;
            process.env.TAYCO_SOURCE_UPLOAD_ROOT = path.join(root, 'public', 'uploads');
            await assert.rejects(upload(Buffer.from('x')), errorStatus(503));
            process.env.TAYCO_SOURCE_UPLOAD_ROOT = previous;
        });
        await t.test('dangling sealed-file links are rejected without replacing them when supported', async (st) => {
            const a = await upload(Buffer.from('a')), file = privateFile(a.id, 'bin');
            try {
                symlinkSync(path.join(root, 'absent-target'), file, 'file');
            }
            catch (error) {
                await cancel(req(), a.id);
                st.skip('Host cannot create the real test file link: ' + (error as NodeJS.ErrnoException).code);
                return;
            }
            try {
                await assert.rejects(status(req(), a.id), errorStatus(409));
                await assert.rejects(finish(req(), a.id), errorStatus(409));
            }
            finally {
                rmSync(file);
                await cancel(req(), a.id);
            }
        });
        await t.test('real directory symlink is rejected when the host supports creating it', async (st) => {
            const linked = path.join(root, 'linked-root');
            try {
                symlinkSync(process.env.TAYCO_SOURCE_UPLOAD_ROOT!, linked, 'junction');
            }
            catch (error) {
                st.skip('Host cannot create the real test directory link: ' + (error as NodeJS.ErrnoException).code);
                return;
            }
            const previous = process.env.TAYCO_SOURCE_UPLOAD_ROOT!;
            process.env.TAYCO_SOURCE_UPLOAD_ROOT = linked;
            try {
                await assert.rejects(upload(Buffer.from('x')), errorStatus(503));
            }
            finally {
                process.env.TAYCO_SOURCE_UPLOAD_ROOT = previous;
            }
        });
        await t.test('session revoked during delayed body IO commits no bytes', async () => {
            const a = await upload(Buffer.from('a'));
            let release!: (value: Uint8Array) => void;
            const delayed = new ReadableStream<Uint8Array>({ async pull(c) { const bytes = await new Promise<Uint8Array>(r => release = r); c.enqueue(bytes); c.close(); } });
            const operation = append(req(), a.id, 0, sha('a'), delayed);
            await new Promise(r => setImmediate(r));
            revokeUserSessionsPrivately('upload-admin@example.test');
            release(Buffer.from('a'));
            await assert.rejects(operation, e => e instanceof AuthError && e.status === 401);
            assert.equal(readFileSync(privateFile(a.id)).length, 0);
            await renew();
            await cancel(req(), a.id);
        });
        await t.test('fresh session and upload deadline checks after SQL hooks prevent partial success', async () => {
            const a = await upload(Buffer.from('abc'));
            const auth = new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
            db!.function('fixture_revoke_upload', () => { auth.exec('DELETE FROM auth_sessions'); return 1; });
            db!.exec("CREATE TRIGGER revoke_after_chunk AFTER INSERT ON source_upload_chunks BEGIN SELECT fixture_revoke_upload(); END");
            await assert.rejects(append(req(), a.id, 0, sha('abc'), body(Buffer.from('abc'))), e => e instanceof AuthError && e.status === 401);
            assert.equal(db!.prepare('SELECT offset FROM source_uploads WHERE id=?').get(a.id)!.offset, 0);
            assert.equal(db!.prepare('SELECT count(*) AS n FROM source_upload_chunks WHERE upload_id=?').get(a.id)!.n, 0);
            db!.exec('DROP TRIGGER revoke_after_chunk');
            auth.close();
            await renew();
            db!.exec("CREATE TRIGGER expire_after_chunk AFTER INSERT ON source_upload_chunks BEGIN UPDATE source_uploads SET expires_at=0 WHERE id=NEW.upload_id; END");
            await assert.rejects(append(req(), a.id, 0, sha('abc'), body(Buffer.from('abc'))), errorStatus(410));
            assert.equal(db!.prepare('SELECT offset FROM source_uploads WHERE id=?').get(a.id)!.offset, 0);
            db!.exec('DROP TRIGGER expire_after_chunk');
            await cancel(req(), a.id);
        });
        await t.test('revocation during streaming full hash cannot commit a stored receipt', async () => {
            const bytes = Buffer.alloc(policy.chunkBytes * 2, 17), a = await upload(bytes);
            for (let i = 0; i < 2; i++) {
                const part = bytes.subarray(i * policy.chunkBytes, (i + 1) * policy.chunkBytes);
                await append(req(), a.id, i * policy.chunkBytes, sha(part), body(part));
            }
            const finishing = finish(req(), a.id);
            await new Promise(r => setImmediate(r));
            revokeUserSessionsPrivately('upload-admin@example.test');
            await assert.rejects(finishing, e => e instanceof AuthError && e.status === 401);
            assert.notEqual(db!.prepare('SELECT state FROM source_uploads WHERE id=?').get(a.id)!.state, 'stored');
            await renew();
            db!.prepare('UPDATE source_uploads SET lease_until=0 WHERE id=?').run(a.id);
            await cancel(req(), a.id);
        });
        await t.test('revocation while waiting for SQL lock prevents reservation/FS side effects', async () => {
            const before = Number(db!.prepare('SELECT count(*) AS n FROM source_uploads').get()!.n);
            const worker = new Worker(`const {workerData,parentPort}=require('node:worker_threads');const {DatabaseSync}=require('node:sqlite');const erp=new DatabaseSync(workerData.erp);erp.exec('PRAGMA busy_timeout=5000;BEGIN IMMEDIATE');parentPort.postMessage('locked');setTimeout(()=>{const auth=new DatabaseSync(workerData.auth);auth.exec('DELETE FROM auth_sessions');auth.close();erp.exec('COMMIT');erp.close();},300);`, { eval: true, workerData: { erp: process.env.TAYCO_ERP_DB_PATH, auth: process.env.TAYCO_AUTH_DB_PATH } });
            const exited = new Promise<void>((resolve, reject) => { worker.once('exit', code => code === 0 ? resolve() : reject(new Error('SQL lock worker failed'))); worker.once('error', reject); });
            await new Promise(resolve => worker.once('message', resolve));
            await assert.rejects(upload(Buffer.from('a')), e => e instanceof AuthError && e.status === 401);
            await exited;
            assert.equal(Number(db!.prepare('SELECT count(*) AS n FROM source_uploads').get()!.n), before);
            await renew();
        });
        assert.equal(JSON.stringify(db.prepare('SELECT * FROM records').all()), records);
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'takeoff_measurement_%'").get()!.n, 0);
    }
    finally {
        db?.close();
        for (const k of keys) {
            if (old[k] === undefined)
                delete process.env[k];
            else
                process.env[k] = old[k];
        }
        assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep));
        rmSync(root, { recursive: true, force: true });
    }
});
