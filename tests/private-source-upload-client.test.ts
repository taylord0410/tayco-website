import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { runPrivateSourceUpload, PrivateUploadClientError, PRIVATE_UPLOAD_CLIENT_POLICY as policy, privateUploadOrigin } from '../lib/private-source-upload-client';
import { uploadPrivateSourceCLI } from '../scripts/upload-private-source';
const hash = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
type Row = {
    id: string;
    requestKey: string;
    expectedBytes: number;
    sha256: string;
    createdAt: string;
    expiresAt: string;
    storedAt: string | null;
    state: string;
    bytes: Buffer;
    chunks: Map<number, Buffer>;
};
/** This synthetic protocol peer is only a client/parser oracle, not evidence of real server authentication. */
function peer() {
    const rows = new Map<string, Row>(), requests: {
        url: string;
        cookie: string | null;
    }[] = [];
    let actor = 'protocol-actor', extra = false, lostStart = false, lostChunk = false, lostFinish = false, redirect = false, largeLogin = false;
    const json = (x: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(x), { headers: { 'content-type': 'application/json', ...headers } });
    const dto = (r: Row, replayed = false) => ({ id: r.id, state: r.state, committedOffset: r.bytes.length, expectedBytes: r.expectedBytes, sha256: r.sha256, createdAt: r.createdAt, expiresAt: r.expiresAt, storedAt: r.storedAt, replayed, sourceAdmission: 'not_registered', verification: r.state === 'stored' ? 'size_and_sha256_only' : 'not_verified', ...(extra ? { filePath: '/private/response-canary' } : {}) });
    const transport: typeof fetch = async (input, init) => {
        const url = String(input), route = new URL(url).pathname, h = new Headers(init?.headers);
        requests.push({ url, cookie: h.get('cookie') });
        if (route === '/api/auth/logout')
            return json({ success: true });
        if (redirect)
            return new Response(null, { status: 307, headers: { location: 'https://evil.invalid/capture' } });
        if (route === '/api/auth/login')
            return largeLogin ? new Response('x'.repeat(policy.jsonBytes + 1), { headers: { 'content-type': 'application/json' } }) : json({ actor: { id: actor, tenantId: 'protocol-tenant', role: 'admin' } }, { 'set-cookie': 'tayco_session=Fe26.2*protocol-cookie-canary~2; Path=/; HttpOnly; SameSite=Lax; Secure' });
        assert.equal(h.get('origin'), 'https://trusted.example');
        assert.equal(h.get('cookie'), 'tayco_session=Fe26.2*protocol-cookie-canary~2');
        if (route === '/api/source-uploads') {
            const x = JSON.parse(String(init?.body)), old = rows.get(x.requestKey);
            let r = old;
            if (!r) {
                const now = Date.now();
                r = { id: 'su_' + randomUUID().replaceAll('-', ''), requestKey: x.requestKey, expectedBytes: x.expectedBytes, sha256: x.sha256, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 4 * 3600000).toISOString(), storedAt: null, state: 'reserved', bytes: Buffer.alloc(0), chunks: new Map() };
                rows.set(x.requestKey, r);
            }
            if (lostStart) {
                lostStart = false;
                throw new TypeError('lost start result, synthetic protocol only');
            }
            return json(dto(r, !!old));
        }
        const id = route.split('/')[3], r = [...rows.values()].find(x => x.id === id);
        assert.ok(r);
        if (route.endsWith('/finish')) {
            assert.equal(hash(r.bytes), r.sha256);
            r.state = 'stored';
            r.storedAt ??= new Date().toISOString();
            if (lostFinish) {
                lostFinish = false;
                throw new TypeError('lost finish result');
            }
            return json(dto(r));
        }
        if (init?.method === 'GET')
            return json(dto(r));
        if (init?.method === 'DELETE') {
            r.state = 'cancelled';
            return json(dto(r));
        }
        assert.equal(init?.method, 'PATCH');
        const offset = Number(h.get('upload-offset')), bytes = Buffer.from(await new Response(init?.body).arrayBuffer());
        assert.equal(h.get('upload-chunk-sha256'), hash(bytes));
        let replay = false;
        if (offset < r.bytes.length) {
            assert.ok(r.chunks.get(offset)?.equals(bytes));
            replay = true;
        }
        else {
            assert.equal(offset, r.bytes.length);
            r.chunks.set(offset, bytes);
            r.bytes = Buffer.concat([r.bytes, bytes]);
            r.state = 'uploading';
        }
        if (lostChunk) {
            lostChunk = false;
            throw new TypeError('lost chunk result');
        }
        return json(dto(r, replay));
    };
    return { transport, rows, requests, setActor(x: string) { actor = x; }, setExtra() { extra = true; }, setRedirect() { redirect = true; }, setLargeLogin() { largeLogin = true; }, loseAll() { lostStart = lostChunk = lostFinish = true; } };
}
test('private upload client parser and journal controls with a synthetic protocol peer', async (t) => {
    const root = mkdtempSync(path.join(tmpdir(), 'tayco-upload-client-unit-')), file = path.join(root, 'source.bin');
    writeFileSync(file, Buffer.alloc(policy.chunkBytes + 97, 31));
    const options = (journal: string, p: ReturnType<typeof peer>) => ({ origin: 'https://trusted.example', email: 'protocol@example.test', password: 'unit-fixture-not-a-real-account', file, journal: path.join(root, journal), transport: p.transport });
    try {
        await t.test('only explicit HTTPS origin or numeric loopback HTTP is accepted before network', async () => {
            for (const url of ['http://remote.example', 'http://localhost:3035', 'https://u:p@trusted.example', 'https://trusted.example/path', 'https://trusted.example/?x=1', 'file:///private'])
                assert.throws(() => privateUploadOrigin(url), e => e instanceof PrivateUploadClientError && e.code === 'untrusted_origin');
            assert.equal(privateUploadOrigin('http://127.0.0.1:3035'), 'http://127.0.0.1:3035');
            let calls = 0;
            const trap = t.mock.method(globalThis, 'fetch', async () => { calls++; throw new TypeError('Synthetic network trap'); });
            try {
                await assert.rejects(uploadPrivateSourceCLI(['--base-url=https://evil.invalid', '--file=' + file, '--journal=' + path.join(root, 'bad.json')], { TAYCO_APP_URL: 'https://trusted.example', TAYCO_UPLOAD_EMAIL: 'x@example.test', TAYCO_UPLOAD_PASSWORD: 'redacted' }), e => e instanceof PrivateUploadClientError && e.code === 'untrusted_origin');
                assert.equal(calls, 0);
                await assert.rejects(uploadPrivateSourceCLI(['--file=' + file, '--journal=' + path.join(root, 'control.json')], { TAYCO_APP_URL: 'https://trusted.example', TAYCO_UPLOAD_EMAIL: 'x@example.test', TAYCO_UPLOAD_PASSWORD: 'redacted' }), e => e instanceof PrivateUploadClientError && e.code === 'network_unconfirmed');
                assert.equal(calls, 1);
            }
            finally {
                trap.mock.restore();
            }
            await assert.rejects(uploadPrivateSourceCLI(['--password=DO-NOT-ECHO']), e => e instanceof PrivateUploadClientError && e.code === 'usage' && !e.message.includes('DO-NOT-ECHO'));
        });
        await t.test('lost reservation/chunk/finish results recover one binding and receipt', async () => {
            const p = peer();
            p.loseAll();
            const result = await runPrivateSourceUpload(options('loss.json', p));
            assert.equal(result.state, 'stored');
            assert.equal(result.sessionCleanup, 'confirmed');
            assert.equal(p.rows.size, 1);
            const r = [...p.rows.values()][0];
            assert.equal(r.bytes.length, policy.chunkBytes + 97);
            assert.equal(r.chunks.size, 2);
            assert.equal(result.sourceAdmission, 'not_registered');
            assert.ok(result.metrics.retries >= 3);
            assert.ok(result.metrics.hashBufferBytes <= policy.hashBufferBytes);
            assert.ok(result.metrics.chunkBufferBytes <= policy.chunkBytes);
            assert.ok(result.metrics.requestCopyBytes <= policy.chunkBytes);
            const text = readFileSync(path.join(root, 'loss.json'), 'utf8') + readFileSync(path.join(root, 'loss.json.receipt.json'), 'utf8');
            assert.doesNotMatch(text, /protocol-cookie|unit-fixture|email|password|filePath/);
            const storedAt = result.storedAt, again = await runPrivateSourceUpload(options('loss.json', p));
            assert.equal(again.storedAt, storedAt);
            assert.equal(r.chunks.size, 2);
        });
        await t.test('pause and fresh status resume from server, not a client offset cache', async () => {
            const p = peer(), o = options('resume.json', p);
            const paused = await runPrivateSourceUpload({ ...o, maxChunks: 1 });
            assert.equal(paused.clientPaused, true);
            assert.equal(paused.committedOffset, policy.chunkBytes);
            const identity = JSON.parse(readFileSync(o.journal, 'utf8'));
            assert.equal('committedOffset' in identity, false);
            assert.equal(statSync(o.journal + '.reservation.json').size < policy.journalBytes, true);
            const observed = await runPrivateSourceUpload({ ...o, action: 'status', file: undefined });
            assert.match(String(observed.observation), /metadata/);
            const done = await runPrivateSourceUpload(o);
            assert.equal(done.state, 'stored');
            assert.equal([...p.rows.values()][0].chunks.size, 2);
        });
        await t.test('concurrent clients share immutable identity and server idempotency', async () => {
            const p = peer(), o = options('concurrent.json', p);
            await runPrivateSourceUpload({ ...o, maxChunks: 1 });
            const results = await Promise.all([runPrivateSourceUpload(o), runPrivateSourceUpload(o)]);
            assert.ok(results.every(x => x.state === 'stored'));
            assert.equal(p.rows.size, 1);
            assert.equal([...p.rows.values()][0].chunks.size, 2);
        });
        await t.test('changed origin/source/account and corrupt journals fail without repair', async () => {
            const p = peer(), o = options('bound.json', p);
            await runPrivateSourceUpload({ ...o, maxChunks: 1 });
            const before = readFileSync(o.journal);
            await assert.rejects(runPrivateSourceUpload({ ...o, origin: 'https://other.example' }), e => e instanceof PrivateUploadClientError && e.code === 'untrusted_origin');
            p.setActor('other-protocol-actor');
            await assert.rejects(runPrivateSourceUpload(o), e => e instanceof PrivateUploadClientError && e.code === 'identity_changed');
            p.setActor('protocol-actor');
            const other = path.join(root, 'other.bin');
            writeFileSync(other, 'different');
            await assert.rejects(runPrivateSourceUpload({ ...o, file: other }), e => e instanceof PrivateUploadClientError && e.code === 'journal_conflict');
            assert.ok(readFileSync(o.journal).equals(before));
            const broken = path.join(root, 'broken.json');
            writeFileSync(broken, 'private original must not be overwritten');
            await assert.rejects(runPrivateSourceUpload({ ...o, journal: broken }));
            assert.equal(readFileSync(broken, 'utf8'), 'private original must not be overwritten');
        });
        await t.test('redirects, oversized JSON and unexpected private fields never escape the closed output', async () => {
            for (const mode of ['redirect', 'large', 'extra']) {
                const p = peer();
                if (mode === 'redirect')
                    p.setRedirect();
                else if (mode === 'large')
                    p.setLargeLogin();
                else
                    p.setExtra();
                await assert.rejects(runPrivateSourceUpload(options(mode + '.json', p)), e => e instanceof PrivateUploadClientError && !JSON.stringify(e).includes('/private/response-canary'));
                assert.ok(p.requests.every(x => x.url.startsWith('https://trusted.example/')));
            }
        });
        await t.test('cancel is explicit and unconfirmed reservation status cannot create a new upload', async () => {
            const p = peer(), o = options('cancel.json', p);
            await runPrivateSourceUpload({ ...o, maxChunks: 1 });
            const x = await runPrivateSourceUpload({ ...o, action: 'cancel', file: undefined });
            assert.equal(x.state, 'cancelled');
            assert.equal(p.rows.size, 1);
            const raw = JSON.parse(readFileSync(o.journal, 'utf8')), unconfirmed = path.join(root, 'unconfirmed.json');
            writeFileSync(unconfirmed, JSON.stringify({ ...raw, requestKey: randomUUID() }));
            const count = p.rows.size;
            await assert.rejects(runPrivateSourceUpload({ ...o, journal: unconfirmed, action: 'status', file: undefined }), e => e instanceof PrivateUploadClientError && e.code === 'reservation_unconfirmed');
            assert.equal(p.rows.size, count);
        });
    }
    finally {
        assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep));
        rmSync(root, { recursive: true, force: true });
    }
});
