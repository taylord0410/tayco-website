import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { NextRequest } from 'next/server';
import { provisionAdmin, provisionAdditionalAdminPrivately, signIn, requireActor, createInvitation, acceptInvitation, revokeUserSessionsPrivately, SESSION_COOKIE } from '../lib/auth';
import { database } from '../lib/erp';
import { SOURCE_UPLOAD_POLICY } from '../lib/private-source-upload';
import { SOURCE_UPLOAD_HTTP_POLICY as policy } from '../lib/private-source-upload-http';
import { POST as reserve, GET as unsupported } from '../app/api/source-uploads/route';
import { GET as status, HEAD as head, PATCH as chunk, DELETE as cancel } from '../app/api/source-uploads/[id]/route';
import { POST as finish } from '../app/api/source-uploads/[id]/finish/route';
import { GET as documentGet } from '../app/api/documents/[id]/route';
const sha = (x: Uint8Array | string) => createHash('sha256').update(x).digest('hex');
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const stream = (bytes: Uint8Array) => new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bytes); c.close(); } }, { highWaterMark: 0 });
test('source-upload HTTP routes preserve current authority and bounded private transport', async (t) => {
    const root = mkdtempSync(path.join(tmpdir(), 'tayco-source-upload-http-'));
    const keys = ['TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_SESSION_SECRET', 'TAYCO_APP_URL', 'TAYCO_SOURCE_UPLOAD_ROOT'];
    const old = Object.fromEntries(keys.map(k => [k, process.env[k]]));
    Object.assign(process.env, { TAYCO_AUTH_DB_PATH: path.join(root, 'auth.sqlite'), TAYCO_ERP_DB_PATH: path.join(root, 'erp.sqlite'), TAYCO_SESSION_SECRET: randomBytes(48).toString('hex'), TAYCO_APP_URL: 'https://tayco.test', TAYCO_SOURCE_UPLOAD_ROOT: path.join(root, 'private') });
    const password = 'Synthetic-HTTP-source-upload-only!';
    let login: Awaited<ReturnType<typeof signIn>>, db: ReturnType<typeof database> | undefined;
    type Options = {
        cookie?: string | null;
        origin?: string | null;
        headers?: Record<string, string>;
        body?: string | ReadableStream<Uint8Array>;
        signal?: AbortSignal;
    };
    const req = (method: string, url: string, options: Options = {}) => {
        const h = new Headers(options.headers);
        if (options.cookie !== null)
            h.set('cookie', SESSION_COOKIE + '=' + encodeURIComponent(options.cookie ?? login.cookie));
        if (options.origin !== null)
            h.set('origin', options.origin ?? 'https://tayco.test');
        const init: RequestInit & {
            duplex: 'half';
        } = { method, headers: h, duplex: 'half', ...(options.body !== undefined ? { body: options.body } : {}), ...(options.signal ? { signal: options.signal } : {}) };
        return new Request('https://tayco.test' + url, init);
    };
    const post = (data: unknown, options: Options = {}) => req('POST', '/api/source-uploads', { ...options, headers: { 'content-type': 'application/json', ...options.headers }, body: options.body ?? JSON.stringify(data) });
    const metadata = (bytes: Uint8Array) => ({ requestKey: randomUUID(), expectedBytes: bytes.length, sha256: sha(bytes), mediaType: 'application/octet-stream' });
    const create = async (bytes: Uint8Array) => { const response = await reserve(post(metadata(bytes))); assert.equal(response.status, 200, await response.clone().text()); return await response.json() as {
        id: string;
        expiresAt: string;
        createdAt: string;
    }; };
    const patch = (id: string, bytes: Uint8Array, offset = 0, options: Options = {}) => req('PATCH', '/api/source-uploads/' + id, { ...options, headers: { 'content-type': 'application/octet-stream', 'upload-offset': String(offset), 'upload-chunk-sha256': sha(bytes), ...options.headers }, body: options.body ?? stream(bytes) });
    const statusReq = (id: string, options: Options = {}) => req('GET', '/api/source-uploads/' + id, options);
    const finishReq = (id: string, options: Options = {}) => req('POST', '/api/source-uploads/' + id + '/finish', options);
    const renew = async () => { login = await signIn('source-http-admin@example.test', password); };
    const rows = () => Number(db!.prepare('SELECT count(*) AS n FROM source_uploads').get()!.n);
    const privateReply = async (response: Response) => {
        assert.match(response.headers.get('cache-control') ?? '', /private/);
        assert.match(response.headers.get('cache-control') ?? '', /no-store/);
        assert.equal(response.headers.get('vary'), 'Cookie');
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        for (const header of ['location', 'set-cookie', 'content-range', 'content-disposition', 'access-control-allow-origin'])
            assert.equal(response.headers.has(header), false, header);
        const text = await response.clone().text();
        assert.ok(!text.includes(root));
        assert.ok(!text.includes(login.cookie));
        assert.ok(!text.includes(process.env.TAYCO_SESSION_SECRET!));
    };
    try {
        await provisionAdmin('source-http-admin@example.test', password);
        await renew();
        db = database();
        const actor = await requireActor(statusReq('su_' + 'a'.repeat(32))), before = JSON.stringify(db.prepare('SELECT * FROM records').all());
        await t.test('anonymous/bearer/staff/client/vendor/guest cannot start transport', async () => {
            let pulled = 0, cancelled = false;
            const body = new ReadableStream<Uint8Array>({ pull() { pulled++; }, cancel() { cancelled = true; } }, { highWaterMark: 0 });
            const a = await reserve(post({}, { cookie: null, body, headers: { authorization: 'Bearer not-a-console-session' } }));
            assert.equal(a.status, 401);
            await privateReply(a);
            assert.equal(pulled, 0);
            assert.equal(cancelled, true);
            for (const role of ['staff', 'client', 'vendor', 'guest'] as const) {
                const invite = createInvitation(actor, { email: 'source-http-' + role + '@example.test', role, tenantId: actor.tenantId, projectIds: [], ...(role === 'vendor' ? { vendorId: 'synthetic-vendor' } : {}) });
                const account = await acceptInvitation(invite.token, 'source-http-' + role + '@example.test', password);
                const response = await reserve(post(metadata(Buffer.from('a')), { cookie: account.cookie }));
                assert.equal(response.status, 403);
                await privateReply(response);
            }
            assert.equal(db!.prepare("SELECT name FROM sqlite_schema WHERE name='source_uploads'").get(), undefined);
        });
        await t.test('mutations require exact configured origin; Referer/forwarded headers do not authorize', async () => {
            for (const options of ([{ origin: null, headers: { referer: 'https://tayco.test/portal' } }, { origin: 'https://evil.test' }, { headers: { 'sec-fetch-site': 'cross-site' } }, { origin: 'https://evil.test', headers: { 'x-forwarded-host': 'tayco.test' } }] as Options[])) {
                const response = await reserve(post(metadata(Buffer.from('a')), options));
                assert.equal(response.status, 403);
                await privateReply(response);
            }
        });
        await t.test('reservation is closed JSON with immutable dedup identity and no admission', async () => {
            const m = metadata(Buffer.from('a')), a = await reserve(post(m)), first = await a.json(), b = await reserve(post(m)), again = await b.json();
            assert.equal(a.status, 200);
            assert.equal(b.status, 200);
            assert.equal(first.id, again.id);
            assert.equal(first.expiresAt, again.expiresAt);
            assert.equal(again.replayed, true);
            assert.equal(first.sourceAdmission, 'not_registered');
            const changed = await reserve(post({ ...m, sha256: sha('different') }));
            assert.equal(changed.status, 409);
            assert.equal((await reserve(post({ ...metadata(Buffer.from('a')), filePath: '../../private-canary' }))).status, 422);
            assert.equal((await reserve(post(metadata(Buffer.from('a')), { headers: { 'content-type': 'text/plain' } }))).status, 415);
            await cancel(req('DELETE', '/api/source-uploads/' + first.id), ctx(first.id));
        });
        await t.test('JSON length is measured independently of absent or dishonest Content-Length', async () => {
            const count = rows();
            for (const options of [
                { body: 'x'.repeat(policy.jsonBytes + 1) },
                { body: 'x'.repeat(policy.jsonBytes + 1), headers: { 'content-length': '1' } },
                { body: '{}', headers: { 'content-length': String(policy.jsonBytes + 1) } }
            ])
                assert.equal((await reserve(post({}, options))).status, 413);
            assert.equal((await reserve(post({}, { body: '{}', headers: { 'content-length': '1' } }))).status, 400);
            assert.equal((await reserve(post({}, { body: '{}', headers: { 'content-length': '20' } }))).status, 400);
            assert.equal((await reserve(post({}, { headers: { 'content-length': '-1' } }))).status, 400);
            assert.equal((await reserve(post({}, { body: '{broken' }))).status, 400);
            assert.equal((await reserve(post({}, { body: stream(Buffer.from([0xff])) }))).status, 400);
            assert.equal((await reserve(post({}, { headers: { 'content-encoding': 'gzip' } }))).status, 415);
            assert.equal(rows(), count);
        });
        await t.test('four MiB synthetic transfer stores exact bytes; duplicates/status/HEAD/finish recover one receipt', async () => {
            const bytes = Buffer.alloc(SOURCE_UPLOAD_POLICY.chunkBytes * 4, 43), a = await create(bytes);
            let response!: Response;
            for (let offset = 0; offset < bytes.length; offset += SOURCE_UPLOAD_POLICY.chunkBytes) {
                const part = bytes.subarray(offset, offset + SOURCE_UPLOAD_POLICY.chunkBytes);
                response = await chunk(patch(a.id, part, offset), ctx(a.id));
                assert.equal(response.status, 200);
                assert.equal((await response.json()).committedOffset, offset + part.length);
                if (offset === 0) {
                    const replay = await chunk(patch(a.id, part, offset), ctx(a.id));
                    assert.equal(replay.status, 200);
                    assert.equal((await replay.json()).replayed, true);
                }
            }
            const finished = await finish(finishReq(a.id), ctx(a.id));
            assert.equal(finished.status, 200);
            await privateReply(finished);
            const receipt = await finished.json();
            assert.equal(receipt.state, 'stored');
            assert.equal(receipt.sourceAdmission, 'not_registered');
            assert.equal(sha(readFileSync(path.join(root, 'private', sha(actor.tenantId), a.id + '.bin'))), sha(bytes));
            const retry = await finish(finishReq(a.id), ctx(a.id));
            assert.equal((await retry.json()).storedAt, receipt.storedAt);
            const observation = await status(statusReq(a.id), ctx(a.id));
            assert.equal(observation.status, 200);
            await privateReply(observation);
            const h = await head(req('HEAD', '/api/source-uploads/' + a.id), ctx(a.id));
            assert.equal(h.status, 200);
            assert.equal(await h.text(), '');
            assert.match(h.headers.get('cache-control')!, /no-store/);
        });
        await t.test('changed duplicates/gaps/offset syntax/content type/digest fail without resetting bytes', async () => {
            const a = await create(Buffer.from('abcdef'));
            assert.equal((await chunk(patch(a.id, Buffer.from('abc')), ctx(a.id))).status, 200);
            assert.equal((await chunk(patch(a.id, Buffer.from('xyz')), ctx(a.id))).status, 409);
            assert.equal((await chunk(patch(a.id, Buffer.from('def'), 4), ctx(a.id))).status, 409);
            assert.equal((await chunk(patch(a.id, Buffer.from('def'), 3, { headers: { 'upload-offset': '03' } }), ctx(a.id))).status, 422);
            assert.equal((await chunk(patch(a.id, Buffer.from('def'), 3, { headers: { 'upload-chunk-sha256': 'f'.repeat(64) } }), ctx(a.id))).status, 422);
            assert.equal((await chunk(patch(a.id, Buffer.from('def'), 3, { headers: { 'content-type': 'multipart/form-data' } }), ctx(a.id))).status, 415);
            assert.equal((await (await status(statusReq(a.id), ctx(a.id))).json()).committedOffset, 3);
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        await t.test('oversized binary streams cancel boundedly even without length or with non-settling cancel', { timeout: 5000 }, async () => {
            const a = await create(Buffer.from('abc'));
            let cancelled = false;
            const oversized = new ReadableStream<Uint8Array>({ pull(c) { c.enqueue(Buffer.alloc(SOURCE_UPLOAD_POLICY.chunkBytes + 1)); }, cancel() { cancelled = true; return new Promise(() => { }); } }, { highWaterMark: 0 });
            const response = await chunk(patch(a.id, Buffer.from('abc'), 0, { body: oversized, headers: { 'content-length': '1' } }), ctx(a.id));
            assert.equal(response.status, 413);
            assert.equal(cancelled, true);
            await privateReply(response);
            const noLength = await chunk(patch(a.id, Buffer.from('abc'), 0, { body: stream(Buffer.alloc(SOURCE_UPLOAD_POLICY.chunkBytes + 1)) }), ctx(a.id));
            assert.equal(noLength.status, 413);
            const misleading = await chunk(patch(a.id, Buffer.from('abc'), 0, { headers: { 'content-length': '2' } }), ctx(a.id));
            assert.equal(misleading.status, 400);
            assert.equal((await (await status(statusReq(a.id), ctx(a.id))).json()).committedOffset, 0);
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        await t.test('finish/cancel reject nonempty bodies and query strings without effects', async () => {
            const a = await create(Buffer.from('a'));
            assert.equal((await finish(finishReq(a.id, { body: 'x' }), ctx(a.id))).status, 413);
            assert.equal((await cancel(req('DELETE', '/api/source-uploads/' + a.id, { body: 'x' }), ctx(a.id))).status, 413);
            assert.equal((await status(req('GET', '/api/source-uploads/' + a.id + '?sha=' + sha('a')), ctx(a.id))).status, 422);
            assert.equal((await finish(finishReq(a.id, { origin: null }), ctx(a.id))).status, 403);
            assert.equal((await cancel(req('DELETE', '/api/source-uploads/' + a.id, { origin: 'https://evil.test' }), ctx(a.id))).status, 403);
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        await t.test('current ownership/tenant isolates every read and mutation', async () => {
            const a = await create(Buffer.from('a'));
            await provisionAdditionalAdminPrivately('source-http-second@example.test', password, 'tayco_llc');
            const second = await signIn('source-http-second@example.test', password);
            for (const call of [() => status(statusReq(a.id, { cookie: second.cookie }), ctx(a.id)), () => chunk(patch(a.id, Buffer.from('a'), 0, { cookie: second.cookie }), ctx(a.id)), () => finish(finishReq(a.id, { cookie: second.cookie }), ctx(a.id)), () => cancel(req('DELETE', '/api/source-uploads/' + a.id, { cookie: second.cookie }), ctx(a.id))]) {
                const response = await call();
                assert.equal(response.status, 404);
                await privateReply(response);
            }
            const auth = new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
            auth.prepare('UPDATE auth_users SET tenant_id=? WHERE email=?').run('synthetic-other', 'source-http-second@example.test');
            auth.close();
            const other = await signIn('source-http-second@example.test', password);
            assert.equal((await status(statusReq(a.id, { cookie: other.cookie }), ctx(a.id))).status, 404);
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        await t.test('request abort during body IO returns no ACK and does not mutate offset', async () => {
            const a = await create(Buffer.from('a')), abort = new AbortController();
            let pulled!: () => void, cancelled = false;
            const ready = new Promise<void>(r => pulled = r), pending = new ReadableStream<Uint8Array>({ pull() { pulled(); return new Promise(() => { }); }, cancel() { cancelled = true; } }, { highWaterMark: 0 });
            const operation = chunk(patch(a.id, Buffer.from('a'), 0, { body: pending, signal: abort.signal }), ctx(a.id));
            await ready;
            abort.abort();
            const response = await operation;
            assert.equal(response.status, 408);
            await privateReply(response);
            assert.equal(cancelled, true);
            assert.equal((await (await status(statusReq(a.id), ctx(a.id))).json()).committedOffset, 0);
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        await t.test('cooperative request deadline cancels a stalled reader without changing the OS clock', async (st) => {
            const a = await create(Buffer.from('a'));
            let pulled!: () => void;
            const ready = new Promise<void>(r => pulled = r), pending = new ReadableStream<Uint8Array>({ pull() { pulled(); return new Promise(() => { }); } }, { highWaterMark: 0 });
            st.mock.timers.enable({ apis: ['setTimeout'] });
            try {
                const operation = chunk(patch(a.id, Buffer.from('a'), 0, { body: pending }), ctx(a.id));
                await ready;
                st.mock.timers.tick(policy.timeoutMs + 1);
                assert.equal((await operation).status, 408);
            }
            finally {
                st.mock.timers.reset();
            }
            assert.equal((await (await status(statusReq(a.id), ctx(a.id))).json()).committedOffset, 0);
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        await t.test('revocation during delayed JSON and binary reads prevents reservation and ACK', async () => {
            const count = rows();
            let release!: (value: string) => void, jsonPulled!: () => void;
            const jsonReady = new Promise<void>(r => jsonPulled = r);
            const delayed = new ReadableStream<Uint8Array>({ async pull(c) { const v = await new Promise<string>(r => { release = r; jsonPulled(); }); c.enqueue(Buffer.from(v)); c.close(); } }, { highWaterMark: 0 });
            const operation = reserve(post({}, { body: delayed }));
            await jsonReady;
            revokeUserSessionsPrivately('source-http-admin@example.test');
            release(JSON.stringify(metadata(Buffer.from('a'))));
            assert.equal((await operation).status, 401);
            assert.equal(rows(), count);
            await renew();
            const a = await create(Buffer.from('a'));
            let unblock!: (value: Uint8Array) => void, binaryPulled!: () => void;
            const binaryReady = new Promise<void>(r => binaryPulled = r);
            const binary = new ReadableStream<Uint8Array>({ async pull(c) { const v = await new Promise<Uint8Array>(r => { unblock = r; binaryPulled(); }); c.enqueue(v); c.close(); } }, { highWaterMark: 0 });
            const transfer = chunk(patch(a.id, Buffer.from('a'), 0, { body: binary }), ctx(a.id));
            await binaryReady;
            revokeUserSessionsPrivately('source-http-admin@example.test');
            unblock(Buffer.from('a'));
            assert.equal((await transfer).status, 401);
            await renew();
            assert.equal((await (await status(statusReq(a.id), ctx(a.id))).json()).committedOffset, 0);
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        await t.test('abort after stored INSERT rolls back receipt while private prepared bytes recover through fresh finish', async () => {
            const a = await create(Buffer.from('a'));
            assert.equal((await chunk(patch(a.id, Buffer.from('a')), ctx(a.id))).status, 200);
            const abort = new AbortController();
            db!.function('fixture_abort_http', () => { abort.abort(); return 1; });
            db!.exec("CREATE TRIGGER fixture_abort_receipt AFTER UPDATE OF state ON source_uploads WHEN NEW.state='stored' BEGIN SELECT fixture_abort_http(); END");
            try {
                assert.equal((await finish(finishReq(a.id, { signal: abort.signal }), ctx(a.id))).status, 408);
                assert.equal(db!.prepare('SELECT state FROM source_uploads WHERE id=?').get(a.id)!.state, 'finishing');
            }
            finally {
                db!.exec('DROP TRIGGER fixture_abort_receipt');
            }
            db!.prepare('UPDATE source_uploads SET lease_until=0 WHERE id=?').run(a.id);
            assert.equal((await finish(finishReq(a.id), ctx(a.id))).status, 200);
        });
        await t.test('SQL/path failure details are redacted and no successful receipt is returned', async () => {
            const count = rows();
            db!.exec("CREATE TRIGGER fixture_private_failure BEFORE INSERT ON source_uploads BEGIN SELECT RAISE(ABORT,'/private/directory cookie-secret-body-canary'); END");
            try {
                const response = await reserve(post(metadata(Buffer.from('a'))));
                assert.equal(response.status, 503);
                await privateReply(response);
                assert.doesNotMatch(await response.text(), /directory|cookie-secret|canary|sqlite|stack/i);
                assert.equal(rows(), count);
            }
            finally {
                db!.exec('DROP TRIGGER fixture_private_failure');
            }
            const params = Promise.reject(new Error('/private/params-canary'));
            const response = await status(statusReq('su_' + 'a'.repeat(32)), { params });
            assert.equal(response.status, 503);
            assert.doesNotMatch(await response.text(), /params-canary/);
        });
        await t.test('known SHA and stored upload ID do not grant binary or document access', async () => {
            const bytes = Buffer.from('PRIVATE-SYNTHETIC-QUARANTINE-BINARY-CANARY'), a = await create(bytes);
            await chunk(patch(a.id, bytes), ctx(a.id));
            await finish(finishReq(a.id), ctx(a.id));
            const bySha = await status(statusReq(sha(bytes)), ctx(sha(bytes)));
            assert.equal(bySha.status, 404);
            const metadata = await status(statusReq(a.id), ctx(a.id));
            assert.doesNotMatch(await metadata.text(), /PRIVATE-SYNTHETIC-QUARANTINE|blobPath|filePath|quarantine/);
            for (const id of [a.id, sha(bytes)]) {
                const response = await documentGet(new NextRequest(statusReq(id)), ctx(id));
                assert.equal(response.status, 404);
                assert.doesNotMatch(await response.text(), /PRIVATE-SYNTHETIC-QUARANTINE/);
            }
            const response = unsupported(req('GET', '/api/source-uploads'));
            assert.equal(response.status, 405);
            await privateReply(response);
        });
        await t.test('persisted actor and tenant rate budgets return bounded Retry-After independently', async () => {
            const a = await create(Buffer.from('a')), auth = new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
            const actorBucket = 'source-upload:control:actor:' + actor.tenantId + ':' + actor.id, tenantBucket = 'source-upload:control:tenant:' + actor.tenantId;
            auth.prepare('INSERT INTO auth_rate_limits VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET window_start=excluded.window_start,hits=excluded.hits').run(actorBucket, Date.now(), policy.controlActor - 1);
            assert.equal((await status(statusReq(a.id), ctx(a.id))).status, 200);
            const limit = await status(statusReq(a.id), ctx(a.id));
            assert.equal(limit.status, 429);
            assert.equal(limit.headers.get('retry-after'), String(policy.rateWindowSeconds));
            await privateReply(limit);
            auth.prepare('DELETE FROM auth_rate_limits WHERE bucket=?').run(actorBucket);
            auth.prepare('INSERT INTO auth_rate_limits VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET window_start=excluded.window_start,hits=excluded.hits').run(tenantBucket, Date.now(), policy.controlTenant);
            assert.equal((await status(statusReq(a.id), ctx(a.id))).status, 429);
            auth.prepare('DELETE FROM auth_rate_limits WHERE bucket IN (?,?)').run(actorBucket, tenantBucket);
            auth.close();
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        await t.test('per-process in-flight admission bounds stalled bodies and releases all slots on abort', async () => {
            const operations: Promise<Response>[] = [], aborts: AbortController[] = [], readies: Promise<void>[] = [];
            for (let n = 0; n < policy.actorConcurrent; n++) {
                const abort = new AbortController();
                aborts.push(abort);
                let pulled!: () => void;
                readies.push(new Promise<void>(r => pulled = r));
                const pending = new ReadableStream<Uint8Array>({ pull() { pulled(); return new Promise(() => { }); } }, { highWaterMark: 0 });
                operations.push(reserve(post({}, { body: pending, signal: abort.signal })));
            }
            await Promise.all(readies);
            assert.equal((await reserve(post(metadata(Buffer.from('a'))))).status, 429);
            for (const a of aborts)
                a.abort();
            assert.ok((await Promise.all(operations)).every(x => x.status === 408));
            const a = await create(Buffer.from('a'));
            await cancel(req('DELETE', '/api/source-uploads/' + a.id), ctx(a.id));
        });
        assert.equal(JSON.stringify(db.prepare('SELECT * FROM records').all()), before);
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'takeoff_measurement_%'").get()!.n, 0);
    }
    finally {
        db?.close();
        for (const key of keys) {
            if (old[key] === undefined)
                delete process.env[key];
            else
                process.env[key] = old[key];
        }
        assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep));
        rmSync(root, { recursive: true, force: true });
    }
});
