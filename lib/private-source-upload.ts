import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, closeSync, constants, existsSync, fstatSync, fsyncSync, ftruncateSync, lstatSync, mkdirSync, openSync, readSync, realpathSync, renameSync, unlinkSync, writeSync } from 'node:fs';
import path from 'node:path';
import { requireActor, requireRole, revalidateRequestActor, type Actor } from './auth';
import { database } from './erp';
export const SOURCE_UPLOAD_POLICY = Object.freeze({ chunkBytes: 1024 * 1024, fileBytes: 1024 ** 3, tenantBytes: 2 * 1024 ** 3, actorActive: 8, tenantActive: 16, lifetimeMs: 4 * 60 * 60 * 1000, leaseMs: 30000 });
export class SourceUploadError extends Error {
    constructor(public status: number, message: string) { super(message); this.name = 'SourceUploadError'; }
}
type Row = {
    id: string;
    tenant_id: string;
    creator_id: string;
    request_key: string;
    expected_size: number;
    sha256: string;
    media_type: string;
    root_hash: string;
    created_at: number;
    expires_at: number;
    state: string;
    offset: number;
    accounted_bytes: number;
    lease_token: string | null;
    lease_until: number | null;
    stored_at: number | null;
    version: number;
};
type Context = {
    actor: Actor;
    root: string;
    rootHash: string;
    db: ReturnType<typeof database>;
};
const SHA = /^[a-f0-9]{64}$/, UPLOAD = /^su_[a-f0-9]{32}$/, UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const fail = (status: number, message: string): never => { throw new SourceUploadError(status, message); };
const conflict = (): never => fail(409, 'This upload needs reconciliation or has conflicting bytes.');
function fresh(c: Context) { const actor = revalidateRequestActor(c.actor); requireRole(actor, ['admin']); return actor; }
function secureDirectory(directory: string, create = false) {
    const absolute = path.resolve(directory), parsed = path.parse(absolute);
    let current = parsed.root;
    for (const component of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
        if (['public', '.git', '.next', 'node_modules'].includes(component.toLowerCase()))
            fail(503, 'Private upload storage is unavailable.');
        current = path.join(current, component);
        if (!existsSync(current)) {
            if (create)
                mkdirSync(current, { mode: 0o700 });
            else
                fail(503, 'Private upload storage is unavailable.');
        }
        const stat = lstatSync(current);
        if (stat.isSymbolicLink() || !stat.isDirectory())
            fail(503, 'Private upload storage is unavailable.');
    }
    const actual = realpathSync(/* turbopackIgnore: true */ absolute);
    if (path.relative(absolute, actual) !== '')
        fail(503, 'Private upload storage is unavailable.');
    return actual;
}
function install() {
    const db = database();
    db.exec("CREATE TABLE IF NOT EXISTS source_uploads(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,creator_id TEXT NOT NULL,request_key TEXT NOT NULL,expected_size INTEGER NOT NULL,sha256 TEXT NOT NULL,media_type TEXT NOT NULL,root_hash TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,state TEXT NOT NULL,offset INTEGER NOT NULL,accounted_bytes INTEGER NOT NULL,lease_token TEXT,lease_until INTEGER,stored_at INTEGER,version INTEGER NOT NULL,UNIQUE(tenant_id,creator_id,request_key)); CREATE TABLE IF NOT EXISTS source_upload_chunks(upload_id TEXT NOT NULL REFERENCES source_uploads(id),byte_offset INTEGER NOT NULL,byte_length INTEGER NOT NULL,sha256 TEXT NOT NULL,PRIMARY KEY(upload_id,byte_offset));");
    return db;
}
async function context(request: Request): Promise<Context> {
    const actor = await requireActor(request);
    requireRole(actor, ['admin']);
    revalidateRequestActor(actor);
    const configured = process.env.TAYCO_SOURCE_UPLOAD_ROOT;
    if (!configured || !path.isAbsolute(configured))
        return fail(503, 'Private upload storage is unavailable.');
    const root = secureDirectory(configured, true), c = { actor, root, rootHash: hash(root), db: install() };
    fresh(c);
    return c;
}
function transaction<T>(c: Context, fn: () => T): T {
    c.db.exec('BEGIN IMMEDIATE');
    try {
        fresh(c);
        const value = fn();
        fresh(c);
        c.db.exec('COMMIT');
        return value;
    }
    catch (error) {
        c.db.exec('ROLLBACK');
        throw error;
    }
}
function event(c: Context, action: string, id: string) { c.db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(), c.actor.tenantId, c.actor.id, action, id, new Date().toISOString()); }
function owned(c: Context, id: string): Row {
    if (!UPLOAD.test(id))
        return fail(404, 'Upload not found.');
    const row = c.db.prepare('SELECT * FROM source_uploads WHERE id=? AND tenant_id=? AND creator_id=?').get(id, c.actor.tenantId, c.actor.id) as Row | undefined;
    if (!row)
        return fail(404, 'Upload not found.');
    if (row.root_hash !== c.rootHash)
        return fail(503, 'Private upload storage requires operator reconciliation.');
    return row;
}
function files(c: Context, row: Row) {
    secureDirectory(c.root);
    const folder = secureDirectory(path.join(c.root, hash(row.tenant_id)), true);
    return { part: path.join(folder, row.id + '.part'), stored: path.join(folder, row.id + '.bin') };
}
function checkedFile(file: string, required = true) {
    const stat = lstatSync(file, { throwIfNoEntry: false });
    if (!stat) {
        if (required)
            return conflict();
        return null;
    }
    if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1)
        return conflict();
    return stat;
}
function openPrivate(file: string, flags: number) {
    checkedFile(file);
    const fd = openSync(file, flags | (constants.O_NOFOLLOW || 0));
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) {
        closeSync(fd);
        return conflict();
    }
    return fd;
}
function active(row: Row) {
    if (['stored', 'cancelled', 'cancelling', 'corrupt'].includes(row.state))
        return fail(409, 'This upload is not accepting bytes.');
    if (row.expires_at <= Date.now())
        return fail(410, 'Upload expired. Its deadline cannot be extended.');
}
function noLease(row: Row) {
    if (row.lease_token && Number(row.lease_until) > Date.now())
        return fail(423, 'Upload is busy. Inspect status before retrying.');
}
function result(row: Row, replayed = false) {
    const state = !['stored', 'cancelled', 'cancelling', 'corrupt'].includes(row.state) && row.expires_at <= Date.now() ? 'expired' : row.state;
    return { id: row.id, state, committedOffset: row.offset, expectedBytes: row.expected_size, sha256: row.sha256, createdAt: new Date(row.created_at).toISOString(), expiresAt: new Date(row.expires_at).toISOString(), storedAt: row.stored_at === null ? null : new Date(row.stored_at).toISOString(), replayed, sourceAdmission: 'not_registered' as const, verification: row.state === 'stored' ? 'size_and_sha256_only' as const : 'not_verified' as const };
}
function fileState(c: Context, row: Row) {
    const p = files(c, row), part = checkedFile(p.part, false), stored = checkedFile(p.stored, false);
    return { recoveryRequired: row.state !== 'stored' && Boolean(stored || part && part.size > row.offset), corrupt: row.state === 'corrupt' ? true : row.state === 'cancelled' ? Boolean(part || stored) : row.state === 'stored' ? stored?.size !== row.expected_size : row.state === 'cancelling' ? false : !stored && (!part || part.size < row.offset) };
}
export async function startSourceUpload(request: Request, input: unknown) {
    const c = await context(request);
    if (!input || typeof input !== 'object' || Array.isArray(input))
        return fail(422, 'Check upload metadata.');
    const x = input as Record<string, unknown>;
    if (Object.keys(x).some(k => !['requestKey', 'expectedBytes', 'sha256', 'mediaType'].includes(k)) || typeof x.requestKey !== 'string' || !UUID.test(x.requestKey) || typeof x.expectedBytes !== 'number' || !Number.isSafeInteger(x.expectedBytes) || x.expectedBytes < 1 || x.expectedBytes > SOURCE_UPLOAD_POLICY.fileBytes || typeof x.sha256 !== 'string' || !SHA.test(x.sha256) || typeof x.mediaType !== 'string' || x.mediaType.length > 100 || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(x.mediaType))
        return fail(422, 'Check upload metadata and server limits.');
    const { requestKey, expectedBytes, sha256, mediaType } = x as {
        requestKey: string;
        expectedBytes: number;
        sha256: string;
        mediaType: string;
    };
    let createdFile: string | null = null;
    try {
        return transaction(c, () => {
            const prior = c.db.prepare('SELECT * FROM source_uploads WHERE tenant_id=? AND creator_id=? AND request_key=?').get(c.actor.tenantId, c.actor.id, requestKey) as Row | undefined;
            if (prior) {
                if (prior.expected_size !== expectedBytes || prior.sha256 !== sha256 || prior.media_type !== mediaType || prior.root_hash !== c.rootHash)
                    return conflict();
                return result(prior, true);
            }
            const quota = c.db.prepare("SELECT COALESCE(SUM(accounted_bytes),0) AS bytes,SUM(CASE WHEN state NOT IN ('stored','cancelled','corrupt') AND expires_at>? THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN creator_id=? AND state NOT IN ('stored','cancelled','corrupt') AND expires_at>? THEN 1 ELSE 0 END) AS actor_active FROM source_uploads WHERE tenant_id=?").get(Date.now(), c.actor.id, Date.now(), c.actor.tenantId) as {
                bytes: number;
                active: number | null;
                actor_active: number | null;
            };
            if (quota.bytes + expectedBytes > SOURCE_UPLOAD_POLICY.tenantBytes || Number(quota.active) >= SOURCE_UPLOAD_POLICY.tenantActive || Number(quota.actor_active) >= SOURCE_UPLOAD_POLICY.actorActive)
                return fail(429, 'Private upload quota is exhausted. Review existing uploads.');
            const now = Date.now(), row: Row = { id: 'su_' + randomUUID().replaceAll('-', ''), tenant_id: c.actor.tenantId, creator_id: c.actor.id, request_key: requestKey, expected_size: expectedBytes, sha256, media_type: mediaType, root_hash: c.rootHash, created_at: now, expires_at: now + SOURCE_UPLOAD_POLICY.lifetimeMs, state: 'reserved', offset: 0, accounted_bytes: expectedBytes, lease_token: null, lease_until: null, stored_at: null, version: 1 };
            const p = files(c, row);
            fresh(c);
            const fd = openSync(p.part, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
            createdFile = p.part;
            try {
                fsyncSync(fd);
            }
            finally {
                closeSync(fd);
            }
            c.db.prepare('INSERT INTO source_uploads VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(row.id, row.tenant_id, row.creator_id, row.request_key, row.expected_size, row.sha256, row.media_type, row.root_hash, row.created_at, row.expires_at, row.state, row.offset, row.accounted_bytes, null, null, null, 1);
            event(c, 'source_upload.created', row.id);
            active(owned(c, row.id));
            return result(row);
        });
    }
    catch (error) {
        if (createdFile) {
            try {
                checkedFile(createdFile);
                unlinkSync(createdFile);
            }
            catch { /* Own empty staging may remain unreceived after a filesystem fault. */ }
        }
        throw error;
    }
}
export async function sourceUploadStatus(request: Request, id: string) {
    const c = await context(request), row = owned(c, id), state = fileState(c, row);
    fresh(c);
    return { ...result(row), ...state };
}
async function boundedBody(c: Context, body: ReadableStream<Uint8Array>) {
    const reader = body.getReader(), parts: Buffer[] = [];
    let size = 0;
    try {
        for (;;) {
            fresh(c);
            const value = await reader.read();
            fresh(c);
            if (value.done)
                break;
            size += value.value.byteLength;
            if (size > SOURCE_UPLOAD_POLICY.chunkBytes) {
                await reader.cancel().catch(() => { });
                return fail(413, 'Chunk exceeds the server limit.');
            }
            parts.push(Buffer.from(value.value));
        }
        if (!size)
            return fail(422, 'Empty chunks are not accepted.');
        return Buffer.concat(parts, size);
    }
    catch (error) {
        await reader.cancel().catch(() => { });
        throw error;
    }
    finally {
        reader.releaseLock();
    }
}
export async function appendSourceUpload(request: Request, id: string, offset: number, chunkSha256: string, body: ReadableStream<Uint8Array>) {
    const c = await context(request);
    let row = owned(c, id);
    active(row);
    if (!Number.isSafeInteger(offset) || offset < 0 || typeof chunkSha256 !== 'string' || !SHA.test(chunkSha256))
        return fail(422, 'Check the chunk offset and digest.');
    const bytes = await boundedBody(c, body);
    fresh(c);
    if (hash(bytes) !== chunkSha256)
        return fail(422, 'Chunk digest does not match its bytes.');
    return transaction(c, () => {
        row = owned(c, id);
        active(row);
        noLease(row);
        const p = files(c, row);
        const fd = openPrivate(p.part, constants.O_RDWR);
        try {
            const size = fstatSync(fd).size;
            if (size < row.offset)
                return conflict();
            if (offset < row.offset) {
                const accepted = c.db.prepare('SELECT byte_length,sha256 FROM source_upload_chunks WHERE upload_id=? AND byte_offset=?').get(id, offset) as {
                    byte_length: number;
                    sha256: string;
                } | undefined;
                if (!accepted || accepted.byte_length !== bytes.length || accepted.sha256 !== chunkSha256)
                    return conflict();
                const stored = Buffer.alloc(bytes.length);
                if (readSync(fd, stored, 0, stored.length, offset) !== stored.length || !stored.equals(bytes))
                    return conflict();
                return result(row, true);
            }
            if (offset !== row.offset || offset + bytes.length > row.expected_size)
                return conflict();
            fresh(c);
            if (size > row.offset)
                ftruncateSync(fd, row.offset);
            let written = 0;
            while (written < bytes.length) {
                const count = writeSync(fd, bytes, written, bytes.length - written, offset + written);
                if (count <= 0)
                    return conflict();
                written += count;
            }
            fsyncSync(fd);
            fresh(c);
            c.db.prepare('INSERT INTO source_upload_chunks VALUES(?,?,?,?)').run(id, offset, bytes.length, chunkSha256);
            c.db.prepare("UPDATE source_uploads SET offset=?,state='uploading',lease_token=NULL,lease_until=NULL,version=version+1 WHERE id=?").run(offset + bytes.length, id);
            event(c, 'source_upload.chunk_committed', id);
            const committed = owned(c, id);
            active(committed);
            return result(committed);
        }
        finally {
            closeSync(fd);
        }
    });
}
function claim(c: Context, id: string, cancel = false) {
    return transaction(c, () => {
        const row = owned(c, id);
        if (row.state === 'stored') {
            if (cancel)
                return fail(409, 'Stored sources are not removed by cancelling an upload.');
            return { row, token: null };
        }
        if (row.state === 'cancelled') {
            if (cancel)
                return { row, token: null };
            return conflict();
        }
        if (!cancel) {
            active(row);
            if (row.offset !== row.expected_size)
                return conflict();
        }
        noLease(row);
        if (cancel && checkedFile(files(c, row).stored, false))
            return fail(409, 'Prepared sealed bytes require operator reconciliation; cancellation cannot delete them.');
        const token = randomUUID(), state = cancel ? 'cancelling' : 'finishing';
        c.db.prepare('UPDATE source_uploads SET state=?,lease_token=?,lease_until=?,version=version+1 WHERE id=?').run(state, token, Date.now() + SOURCE_UPLOAD_POLICY.leaseMs, id);
        return { row: owned(c, id), token };
    });
}
function lease(c: Context, id: string, token: string, expectedState = 'finishing', renew = true) {
    fresh(c);
    const row = owned(c, id);
    if (row.lease_token !== token || row.state !== expectedState || Number(row.lease_until) <= Date.now())
        return fail(423, 'Upload lease changed. Inspect status before retrying.');
    if (expectedState === 'finishing' && row.expires_at <= Date.now())
        return fail(410, 'Upload expired. Its deadline cannot be extended.');
    if (renew && Number(row.lease_until) - Date.now() < 10000) {
        transaction(c, () => {
            const current = owned(c, id);
            if (current.lease_token !== token || current.state !== expectedState || Number(current.lease_until) <= Date.now())
                return conflict();
            if (expectedState === 'finishing' && current.expires_at <= Date.now())
                return fail(410, 'Upload expired. Its deadline cannot be extended.');
            c.db.prepare('UPDATE source_uploads SET lease_until=? WHERE id=?').run(Date.now() + SOURCE_UPLOAD_POLICY.leaseMs, id);
            const renewed = owned(c, id);
            if (renewed.lease_token !== token || renewed.state !== expectedState || Number(renewed.lease_until) <= Date.now())
                return conflict();
            if (expectedState === 'finishing' && renewed.expires_at <= Date.now())
                return fail(410, 'Upload expired. Its deadline cannot be extended.');
        });
    }
    return row;
}
async function fullDigest(c: Context, id: string, token: string | null, file: string) {
    const guard = () => {
        if (token)
            lease(c, id, token);
        else {
            fresh(c);
            if (owned(c, id).state !== 'stored')
                return conflict();
        }
    };
    guard();
    const maximum = owned(c, id).expected_size;
    if (checkedFile(file)!.size > maximum)
        return conflict();
    const digest = createHash('sha256');
    let bytes = 0;
    const fd = openPrivate(file, constants.O_RDONLY);
    const stream = createReadStream(file, { fd, autoClose: true, highWaterMark: 64 * 1024 });
    try {
        for await (const part of stream) {
            guard();
            bytes += part.length;
            if (bytes > maximum)
                return conflict();
            digest.update(part);
        }
        guard();
        return { bytes, sha256: digest.digest('hex') };
    }
    finally {
        stream.destroy();
    }
}
export async function finishSourceUpload(request: Request, id: string) {
    const c = await context(request), chosen = claim(c, id);
    if (!chosen.token) {
        const actual = await fullDigest(c, id, null, files(c, chosen.row).stored);
        if (actual.bytes !== chosen.row.expected_size || actual.sha256 !== chosen.row.sha256)
            return conflict();
        fresh(c);
        return result(owned(c, id), true);
    }
    const token = chosen.token, row = chosen.row, p = files(c, row);
    let source: string;
    try {
        const stored = checkedFile(p.stored, false);
        if (stored) {
            if (checkedFile(p.part, false))
                return conflict();
            source = p.stored;
        }
        else {
            const fd = openPrivate(p.part, constants.O_RDWR);
            try {
                const size = fstatSync(fd).size;
                if (size < row.offset)
                    return conflict();
                lease(c, id, token);
                if (size > row.offset) {
                    ftruncateSync(fd, row.offset);
                    fsyncSync(fd);
                }
            }
            finally {
                closeSync(fd);
            }
            source = p.part;
        }
        const actual = await fullDigest(c, id, token, source);
        if (actual.bytes !== row.expected_size || actual.sha256 !== row.sha256) {
            transaction(c, () => { lease(c, id, token, 'finishing', false); c.db.prepare("UPDATE source_uploads SET state='corrupt',lease_token=NULL,lease_until=NULL,version=version+1 WHERE id=?").run(id); event(c, 'source_upload.corrupt', id); });
            return fail(422, 'Upload size or full digest does not match.');
        }
        return transaction(c, () => {
            lease(c, id, token, 'finishing', false);
            checkedFile(source);
            if (source === p.part) {
                if (existsSync(p.stored))
                    return conflict();
                fresh(c);
                renameSync(p.part, p.stored);
            }
            fresh(c);
            c.db.prepare("UPDATE source_uploads SET state='stored',stored_at=?,lease_token=NULL,lease_until=NULL,version=version+1 WHERE id=?").run(Date.now(), id);
            event(c, 'source_upload.stored', id);
            const committed = owned(c, id);
            if (committed.expires_at <= Date.now())
                return fail(410, 'Upload expired before its receipt was committed.');
            return result(committed);
        });
    }
    catch (error) {
        // Prepared bytes may survive SQL rollback; they are not a stored receipt.
        try {
            transaction(c, () => {
                const current = owned(c, id);
                if (current.lease_token === token && current.state === 'finishing')
                    c.db.prepare('UPDATE source_uploads SET lease_token=NULL,lease_until=NULL WHERE id=?').run(id);
            });
        }
        catch { /* A revoked caller cannot mutate recovery metadata. */ }
        throw error;
    }
}
export async function cancelSourceUpload(request: Request, id: string) {
    const c = await context(request), chosen = claim(c, id, true);
    if (!chosen.token) {
        fresh(c);
        return result(chosen.row, true);
    }
    const p = files(c, chosen.row), token = chosen.token;
    // Durable cancelling intent precedes physical deletion, so a crash cannot reopen it.
    return transaction(c, () => {
        lease(c, id, token, 'cancelling', false);
        if (checkedFile(p.stored, false))
            return conflict();
        if (checkedFile(p.part, false)) {
            fresh(c);
            unlinkSync(p.part);
        }
        fresh(c);
        c.db.prepare("UPDATE source_uploads SET state='cancelled',accounted_bytes=0,lease_token=NULL,lease_until=NULL,version=version+1 WHERE id=?").run(id);
        event(c, 'source_upload.cancelled', id);
        return result(owned(c, id));
    });
}
