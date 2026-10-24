import { createHash, randomUUID } from 'node:crypto';
import { read as readAsync, openSync, closeSync, readSync, fstatSync, lstatSync, realpathSync, mkdirSync, readFileSync, writeSync, fsyncSync, linkSync, unlinkSync, constants } from 'node:fs';
import path from 'node:path';
export const PRIVATE_UPLOAD_CLIENT_POLICY = Object.freeze({ chunkBytes: 1024 * 1024, fileBytes: 1024 ** 3, hashBufferBytes: 64 * 1024, jsonBytes: 128 * 1024, journalBytes: 16 * 1024, attempts: 3, timeoutMs: 65000 });
type ErrorCode = 'usage' | 'untrusted_origin' | 'source_unavailable' | 'source_changed' | 'journal_unavailable' | 'journal_conflict' | 'authentication_failed' | 'identity_changed' | 'network_unconfirmed' | 'invalid_response' | 'request_denied' | 'upload_busy' | 'upload_expired' | 'remote_conflict' | 'aborted' | 'reservation_unconfirmed';
export class PrivateUploadClientError extends Error {
    cleanup = 'not_confirmed';
    constructor(public code: ErrorCode, public status?: number) { super(code); this.name = 'PrivateUploadClientError'; }
}
type Identity = {
    schema: 'tayco-private-upload-client/v1';
    origin: string;
    actorId: string;
    tenantId: string;
    requestKey: string;
    expectedBytes: number;
    sha256: string;
    mediaType: 'application/octet-stream';
};
type Binding = {
    schema: 'tayco-private-upload-binding/v1';
    requestKey: string;
    id: string;
    createdAt: string;
    expiresAt: string;
    expectedBytes: number;
    sha256: string;
};
type Remote = {
    id: string;
    state: string;
    committedOffset: number;
    expectedBytes: number;
    sha256: string;
    createdAt: string;
    expiresAt: string;
    storedAt: string | null;
    sourceAdmission: 'not_registered';
    verification: string;
    replayed: boolean;
    corrupt?: boolean;
    recoveryRequired?: boolean;
};
type Actor = {
    id: string;
    tenantId: string;
};
type Metrics = {
    hashBufferBytes: number;
    chunkBufferBytes: number;
    requestCopyBytes: number;
    responseBytes: number;
    requests: number;
    retries: number;
};
export type PrivateUploadOptions = {
    origin: string;
    email: string;
    password: string;
    journal: string;
    file?: string;
    action?: 'upload' | 'status' | 'cancel';
    maxChunks?: number;
    signal?: AbortSignal;
    transport?: typeof fetch;
};
const SHA = /^[a-f0-9]{64}$/, UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/, ID = /^su_[a-f0-9]{32}$/;
const code = (value: ErrorCode, status?: number): never => { throw new PrivateUploadClientError(value, status); };
const digest = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
function stopped(signal?: AbortSignal) { if (signal?.aborted)
    return code('aborted'); }
export function privateUploadOrigin(value: string) {
    let url: URL;
    try {
        url = new URL(value);
    }
    catch {
        return code('untrusted_origin');
    }
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash || !['http:', 'https:'].includes(url.protocol) || url.protocol === 'http:' && url.hostname !== '127.0.0.1')
        return code('untrusted_origin');
    return url.origin;
}
function privateParent(file: string) {
    if (!path.isAbsolute(file))
        return code('journal_unavailable');
    const full = path.resolve(file), base = path.basename(full);
    if (!base || /[. ]$/.test(base) || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(base))
        return code('journal_unavailable');
    const directory = path.dirname(full), parsed = path.parse(directory);
    let current = parsed.root;
    for (const part of directory.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
        if (['public', '.git', '.next', 'node_modules'].includes(part.toLowerCase()))
            return code('journal_unavailable');
        current = path.join(current, part);
        let stat = lstatSync(current, { throwIfNoEntry: false });
        if (!stat) {
            mkdirSync(current, { mode: 0o700 });
            stat = lstatSync(current);
        }
        if (stat.isSymbolicLink() || !stat.isDirectory())
            return code('journal_unavailable');
    }
    if (path.relative(directory, realpathSync(directory)) !== '')
        return code('journal_unavailable');
    return full;
}
function record(file: string): unknown | undefined {
    try {
        const stat = lstatSync(file, { throwIfNoEntry: false });
        if (!stat)
            return undefined;
        if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size < 1 || stat.size > PRIVATE_UPLOAD_CLIENT_POLICY.journalBytes)
            return code('journal_unavailable');
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file)));
    }
    catch (error) {
        if (error instanceof PrivateUploadClientError)
            throw error;
        return code('journal_unavailable');
    }
}
/** Publish once, without rename-overwriting a concurrent operator's journal. */
function publish(file: string, value: unknown) {
    const existing = record(file);
    if (existing !== undefined)
        return existing;
    const raw = Buffer.from(JSON.stringify(value));
    if (raw.length > PRIVATE_UPLOAD_CLIENT_POLICY.journalBytes)
        return code('journal_unavailable');
    const temporary = path.join(path.dirname(file), '.private-upload-' + randomUUID() + '.tmp');
    let fd: number | undefined;
    try {
        fd = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
        let offset = 0;
        while (offset < raw.length) {
            const count = writeSync(fd, raw, offset, raw.length - offset);
            if (!count)
                return code('journal_unavailable');
            offset += count;
        }
        fsyncSync(fd);
        closeSync(fd);
        fd = undefined;
        try {
            linkSync(temporary, file);
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
                return code('journal_unavailable');
        }
    }
    finally {
        if (fd !== undefined)
            closeSync(fd);
        try {
            unlinkSync(temporary);
        }
        catch { /* An unpublished private temporary file never serves as a journal. */ }
    }
    return record(file);
}
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value))
    return code('invalid_response'); return value as Record<string, unknown>; }
function identity(value: unknown): Identity {
    const x = object(value), keys = ['schema', 'origin', 'actorId', 'tenantId', 'requestKey', 'expectedBytes', 'sha256', 'mediaType'];
    if (Object.keys(x).length !== keys.length || Object.keys(x).some(k => !keys.includes(k)) || x.schema !== 'tayco-private-upload-client/v1' || typeof x.origin !== 'string' || privateUploadOrigin(x.origin) !== x.origin || typeof x.actorId !== 'string' || !x.actorId || typeof x.tenantId !== 'string' || !x.tenantId || typeof x.requestKey !== 'string' || !UUID.test(x.requestKey) || !Number.isSafeInteger(x.expectedBytes) || Number(x.expectedBytes) < 1 || Number(x.expectedBytes) > PRIVATE_UPLOAD_CLIENT_POLICY.fileBytes || typeof x.sha256 !== 'string' || !SHA.test(x.sha256) || x.mediaType !== 'application/octet-stream')
        return code('journal_conflict');
    return x as Identity;
}
function binding(value: unknown): Binding {
    const x = object(value), keys = ['schema', 'requestKey', 'id', 'createdAt', 'expiresAt', 'expectedBytes', 'sha256'];
    if (Object.keys(x).length !== keys.length || Object.keys(x).some(k => !keys.includes(k)) || x.schema !== 'tayco-private-upload-binding/v1' || typeof x.id !== 'string' || !ID.test(x.id) || typeof x.requestKey !== 'string' || !UUID.test(x.requestKey) || typeof x.createdAt !== 'string' || typeof x.expiresAt !== 'string' || Date.parse(x.expiresAt) - Date.parse(x.createdAt) !== 4 * 3600000 || typeof x.sha256 !== 'string' || !SHA.test(x.sha256) || !Number.isSafeInteger(x.expectedBytes))
        return code('journal_conflict');
    return x as Binding;
}
function remote(value: unknown, who: Identity, bound?: Binding): Remote {
    const x = object(value), allowed = ['id', 'state', 'committedOffset', 'expectedBytes', 'sha256', 'createdAt', 'expiresAt', 'storedAt', 'sourceAdmission', 'verification', 'replayed', 'corrupt', 'recoveryRequired'];
    if (Object.keys(x).some(k => !allowed.includes(k)) || ('corrupt' in x && typeof x.corrupt !== 'boolean') || ('recoveryRequired' in x && typeof x.recoveryRequired !== 'boolean'))
        return code('invalid_response');
    if (typeof x.id !== 'string' || !ID.test(x.id) || !['reserved', 'uploading', 'finishing', 'stored', 'cancelling', 'cancelled', 'corrupt', 'expired'].includes(String(x.state)) || x.sourceAdmission !== 'not_registered' || !['not_verified', 'size_and_sha256_only'].includes(String(x.verification)) || typeof x.replayed !== 'boolean' || x.expectedBytes !== who.expectedBytes || x.sha256 !== who.sha256 || !Number.isSafeInteger(x.committedOffset) || Number(x.committedOffset) < 0 || Number(x.committedOffset) > who.expectedBytes || typeof x.createdAt !== 'string' || typeof x.expiresAt !== 'string' || Date.parse(x.expiresAt) - Date.parse(x.createdAt) !== 4 * 3600000 || !(x.storedAt === null || typeof x.storedAt === 'string' && Number.isFinite(Date.parse(x.storedAt))))
        return code('invalid_response');
    if (bound && (x.id !== bound.id || x.createdAt !== bound.createdAt || x.expiresAt !== bound.expiresAt || who.requestKey !== bound.requestKey || who.sha256 !== bound.sha256 || who.expectedBytes !== bound.expectedBytes))
        return code('remote_conflict');
    if (x.state === 'stored' && (x.committedOffset !== who.expectedBytes || x.storedAt === null || x.verification !== 'size_and_sha256_only'))
        return code('invalid_response');
    return x as Remote;
}
function same(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b); }
function fileSignature(fd: number) { const s = fstatSync(fd, { bigint: true }); return [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs].join(':'); }
async function source(file: string, metrics: Metrics, signal?: AbortSignal) {
    if (!path.isAbsolute(file))
        return code('source_unavailable');
    let fd: number;
    try {
        if (path.relative(path.dirname(file), realpathSync(path.dirname(file))) !== '')
            return code('source_unavailable');
        const stat = lstatSync(file);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size < 1 || stat.size > PRIVATE_UPLOAD_CLIENT_POLICY.fileBytes)
            return code('source_unavailable');
        fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
        const opened = fstatSync(fd);
        if (!opened.isFile() || opened.nlink !== 1 || opened.size !== stat.size) {
            closeSync(fd);
            return code('source_unavailable');
        }
    }
    catch (error) {
        if (error instanceof PrivateUploadClientError)
            throw error;
        return code('source_unavailable');
    }
    const signature = fileSignature(fd), size = fstatSync(fd).size;
    const unchanged = () => { stopped(signal); if (fileSignature(fd) !== signature)
        return code('source_changed'); };
    try {
        const hash = createHash('sha256'), block = Buffer.alloc(PRIVATE_UPLOAD_CLIENT_POLICY.hashBufferBytes);
        let count = 0;
        while (count < size) {
            unchanged();
            const read = await new Promise<number>((resolve, reject) => readAsync(fd, block, 0, Math.min(block.length, size - count), count, (error, bytes) => error ? reject(error) : resolve(bytes)));
            unchanged();
            if (!read)
                return code('source_changed');
            metrics.hashBufferBytes = Math.max(metrics.hashBufferBytes, read);
            hash.update(block.subarray(0, read));
            count += read;
        }
        unchanged();
        return { size, sha256: hash.digest('hex'), unchanged, close: () => closeSync(fd), chunk(offset: number) { unchanged(); const bytes = Buffer.alloc(Math.min(PRIVATE_UPLOAD_CLIENT_POLICY.chunkBytes, size - offset)); let read = 0; while (read < bytes.length) {
                const count = readSync(fd, bytes, read, bytes.length - read, offset + read);
                if (!count)
                    return code('source_changed');
                read += count;
            } unchanged(); metrics.chunkBufferBytes = Math.max(metrics.chunkBufferBytes, bytes.length); return bytes; } };
    }
    catch (error) {
        closeSync(fd);
        if (error instanceof PrivateUploadClientError)
            throw error;
        return code('source_unavailable');
    }
}
class Client {
    private cookie = '';
    private actor?: Actor;
    readonly metrics: Metrics = { hashBufferBytes: 0, chunkBufferBytes: 0, requestCopyBytes: 0, responseBytes: 0, requests: 0, retries: 0 };
    constructor(readonly origin: string, private transport: typeof fetch, private signal?: AbortSignal) { }
    async request(method: string, route: string, data?: Record<string, unknown> | Uint8Array, chunkOffset?: number, cleanup = false): Promise<{
        value: unknown;
        cookie: string | null;
    }> {
        if (!/^\/api\/(?:auth\/(?:login|logout)|source-uploads(?:\/su_[a-f0-9]{32}(?:\/finish)?)?)$/.test(route))
            return code('untrusted_origin');
        if (!cleanup)
            stopped(this.signal);
        const controller = new AbortController(), abort = () => controller.abort();
        if (!cleanup) {
            this.signal?.addEventListener('abort', abort, { once: true });
            if (this.signal?.aborted)
                controller.abort();
        }
        const timer = setTimeout(abort, cleanup ? 10000 : PRIVATE_UPLOAD_CLIENT_POLICY.timeoutMs);
        timer.unref?.();
        let response: Response | undefined, reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        try {
            const headers = new Headers({ Origin: this.origin, Accept: 'application/json' });
            if (this.cookie)
                headers.set('Cookie', this.cookie);
            let body: BodyInit | undefined;
            if (data instanceof Uint8Array) {
                const copy = new Uint8Array(data);
                body = copy.buffer;
                this.metrics.requestCopyBytes = Math.max(this.metrics.requestCopyBytes, copy.byteLength);
                headers.set('Content-Type', 'application/octet-stream');
                headers.set('Upload-Offset', String(chunkOffset));
                headers.set('Upload-Chunk-SHA256', digest(data));
            }
            else if (data) {
                body = JSON.stringify(data);
                headers.set('Content-Type', 'application/json');
            }
            this.metrics.requests++;
            response = await this.transport(this.origin + route, { method, headers, body, signal: controller.signal, redirect: 'manual' });
            if (response.status >= 300 && response.status < 400)
                return code('untrusted_origin');
            const rawCookie = route === '/api/auth/login' ? response.headers.getSetCookie().filter(x => x.startsWith('tayco_session=')) : [];
            if (rawCookie.length > 1)
                return code('invalid_response');
            const pair = rawCookie[0]?.split(';')[0] ?? null;
            if (pair) {
                if (!/^tayco_session=[A-Za-z0-9_%.*~-]{1,8192}$/.test(pair) || !rawCookie[0].toLowerCase().includes('httponly') || !rawCookie[0].toLowerCase().includes('path=/'))
                    return code('invalid_response');
                this.cookie = pair;
            }
            if (!response.ok) {
                const status = response.status;
                return code(route === '/api/auth/login' ? 'authentication_failed' : status === 410 ? 'upload_expired' : status === 423 ? 'upload_busy' : 'request_denied', status);
            }
            if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
                return code('invalid_response');
            const length = response.headers.get('content-length');
            if (length !== null && (!/^[0-9]+$/.test(length) || Number(length) > PRIVATE_UPLOAD_CLIENT_POLICY.jsonBytes))
                return code('invalid_response');
            reader = response.body?.getReader();
            if (!reader)
                return code('invalid_response');
            const parts: Uint8Array[] = [];
            let bytes = 0;
            for (;;) {
                if (controller.signal.aborted)
                    return code('network_unconfirmed');
                const pending = reader.read();
                const value = await new Promise<ReadableStreamReadResult<Uint8Array>>((resolve, reject) => { const ended = () => reject(new PrivateUploadClientError('network_unconfirmed')); controller.signal.addEventListener('abort', ended, { once: true }); pending.then(v => { controller.signal.removeEventListener('abort', ended); resolve(v); }, e => { controller.signal.removeEventListener('abort', ended); reject(e); }); });
                if (value.done)
                    break;
                bytes += value.value.byteLength;
                if (bytes > PRIVATE_UPLOAD_CLIENT_POLICY.jsonBytes)
                    return code('invalid_response');
                parts.push(value.value);
            }
            this.metrics.responseBytes = Math.max(this.metrics.responseBytes, bytes);
            let value: unknown;
            try {
                value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(parts, bytes)));
            }
            catch {
                return code('invalid_response');
            }
            return { value, cookie: pair };
        }
        catch (error) {
            if (error instanceof PrivateUploadClientError)
                throw error;
            if (this.signal?.aborted && !cleanup)
                return code('aborted');
            return code('network_unconfirmed');
        }
        finally {
            if (reader) {
                try {
                    void reader.cancel().catch(() => { });
                }
                catch { }
                try {
                    reader.releaseLock();
                }
                catch { }
            }
            else if (response?.body && !response.body.locked)
                try {
                    void response.body.cancel().catch(() => { });
                }
                catch { }
            clearTimeout(timer);
            if (!cleanup)
                this.signal?.removeEventListener('abort', abort);
        }
    }
    async login(email: string, password: string) {
        const result = await this.request('POST', '/api/auth/login', { email, password });
        const x = object(object(result.value).actor);
        if (!result.cookie || x.role !== 'admin' || typeof x.id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(x.id) || typeof x.tenantId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(x.tenantId))
            return code('authentication_failed');
        this.actor = { id: x.id, tenantId: x.tenantId };
        return this.actor;
    }
    async close() {
        if (!this.cookie)
            return 'not_confirmed';
        try {
            const x = await this.request('POST', '/api/auth/logout', undefined, undefined, true);
            return object(x.value).success === true ? 'confirmed' : 'not_confirmed';
        }
        catch {
            return 'not_confirmed';
        }
        finally {
            this.cookie = '';
            this.actor = undefined;
        }
    }
    async retry<T>(call: () => Promise<T>): Promise<T> {
        for (let attempt = 0;; attempt++)
            try {
                return await call();
            }
            catch (error) {
                if (!(error instanceof PrivateUploadClientError) || !['network_unconfirmed', 'upload_busy'].includes(error.code) && ![408, 503].includes(error.status ?? 0) || attempt + 1 >= PRIVATE_UPLOAD_CLIENT_POLICY.attempts)
                    throw error;
                this.metrics.retries++;
                stopped(this.signal);
                await new Promise(r => setTimeout(r, Math.min(200 * (attempt + 1), 600)));
            }
    }
}
export async function runPrivateSourceUpload(options: PrivateUploadOptions) {
    const origin = privateUploadOrigin(options.origin), action = options.action ?? 'upload';
    if (!['upload', 'status', 'cancel'].includes(action) || !options.email || !options.password || options.email.length > 254 || options.password.length > 128 || options.maxChunks !== undefined && (!Number.isSafeInteger(options.maxChunks) || options.maxChunks < 1 || action !== 'upload'))
        return code('usage');
    let journal: string;
    try {
        journal = privateParent(options.journal);
    }
    catch (error) {
        if (error instanceof PrivateUploadClientError)
            throw error;
        return code('journal_unavailable');
    }
    let prior: Identity | undefined;
    const saved = record(journal);
    if (saved !== undefined) {
        prior = identity(saved);
        if (prior.origin !== origin)
            return code('untrusted_origin');
    }
    if (action !== 'upload' && !prior)
        return code('journal_unavailable');
    const client = new Client(origin, options.transport ?? fetch, options.signal);
    let file: Awaited<ReturnType<typeof source>> | undefined;
    let result: (Remote & {
        clientPaused?: boolean;
        observation?: string;
    }) | undefined, error: unknown, cleanup = 'not_confirmed';
    try {
        if (action === 'upload') {
            if (!options.file)
                return code('usage');
            file = await source(options.file, client.metrics, options.signal);
            if (prior && (prior.expectedBytes !== file.size || prior.sha256 !== file.sha256))
                return code('journal_conflict');
        }
        const actor = await client.login(options.email, options.password);
        if (prior && (prior.actorId !== actor.id || prior.tenantId !== actor.tenantId))
            return code('identity_changed');
        if (!prior) {
            const candidate: Identity = { schema: 'tayco-private-upload-client/v1', origin, actorId: actor.id, tenantId: actor.tenantId, requestKey: randomUUID(), expectedBytes: file!.size, sha256: file!.sha256, mediaType: 'application/octet-stream' };
            prior = identity(publish(journal, candidate));
            if (prior.origin !== origin || prior.actorId !== actor.id || prior.tenantId !== actor.tenantId || prior.expectedBytes !== candidate.expectedBytes || prior.sha256 !== candidate.sha256)
                return code('journal_conflict');
        }
        const who = prior;
        let bound: Binding | undefined;
        const savedBinding = record(journal + '.reservation.json');
        if (savedBinding !== undefined)
            bound = binding(savedBinding);
        if (!bound && action !== 'upload')
            return code('reservation_unconfirmed');
        if (!bound) {
            const started = remote(await client.retry(async () => (await client.request('POST', '/api/source-uploads', { requestKey: who.requestKey, expectedBytes: who.expectedBytes, sha256: who.sha256, mediaType: who.mediaType })).value), who);
            const proposed: Binding = { schema: 'tayco-private-upload-binding/v1', requestKey: who.requestKey, id: started.id, createdAt: started.createdAt, expiresAt: started.expiresAt, expectedBytes: who.expectedBytes, sha256: who.sha256 };
            bound = binding(publish(journal + '.reservation.json', proposed));
            if (!same(bound, proposed))
                return code('journal_conflict');
        }
        const current = async () => remote((await client.retry(() => client.request('GET', '/api/source-uploads/' + bound!.id))).value, who, bound);
        let observed = await current();
        if (action === 'status')
            result = { ...observed, observation: 'server_metadata_not_new_content_verification' };
        else if (action === 'cancel') {
            observed = remote((await client.retry(() => client.request('DELETE', '/api/source-uploads/' + bound!.id))).value, who, bound);
            if (observed.state !== 'cancelled')
                return code('remote_conflict');
            const receipt = { ...bound, schema: 'tayco-private-upload-cancel/v1', state: 'cancelled', sourceAdmission: 'not_registered' };
            if (!same(publish(journal + '.cancelled.json', receipt), receipt))
                return code('journal_conflict');
            result = observed;
        }
        else {
            let committed = 0;
            while (observed.committedOffset < who.expectedBytes) {
                if (observed.state === 'expired')
                    return code('upload_expired', 410);
                if (!['reserved', 'uploading', 'finishing'].includes(observed.state) || observed.corrupt)
                    return code('remote_conflict');
                if (options.maxChunks !== undefined && committed >= options.maxChunks)
                    break;
                const offset = observed.committedOffset, bytes = file!.chunk(offset);
                let accepted = false;
                for (let attempt = 0; attempt < PRIVATE_UPLOAD_CLIENT_POLICY.attempts; attempt++) {
                    try {
                        const ack = remote((await client.request('PATCH', '/api/source-uploads/' + bound.id, bytes, offset)).value, who, bound);
                        if (ack.committedOffset < offset + bytes.length)
                            return code('invalid_response');
                        observed = ack;
                        accepted = true;
                        break;
                    }
                    catch (problem) {
                        if (!(problem instanceof PrivateUploadClientError) || !['network_unconfirmed', 'upload_busy'].includes(problem.code) && ![408, 409, 503].includes(problem.status ?? 0))
                            throw problem;
                        client.metrics.retries++;
                        const status = await current();
                        if (status.committedOffset < offset || status.corrupt)
                            return code('remote_conflict');
                        observed = status;
                        if (status.committedOffset > offset) {
                            accepted = true;
                            break;
                        }
                        if (attempt + 1 >= PRIVATE_UPLOAD_CLIENT_POLICY.attempts)
                            throw problem;
                        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
                    }
                }
                if (!accepted)
                    return code('remote_conflict');
                committed++;
                file!.unchanged();
            }
            if (observed.committedOffset === who.expectedBytes) {
                file!.unchanged();
                observed = remote((await client.retry(() => client.request('POST', '/api/source-uploads/' + bound!.id + '/finish'))).value, who, bound);
                if (observed.state !== 'stored')
                    return code('invalid_response');
                const receipt = { ...bound, schema: 'tayco-private-upload-receipt/v1', state: 'stored', storedAt: observed.storedAt, sourceAdmission: 'not_registered', verification: 'size_and_sha256_only' };
                if (!same(publish(journal + '.receipt.json', receipt), receipt))
                    return code('journal_conflict');
                result = observed;
            }
            else
                result = { ...observed, clientPaused: true };
        }
    }
    catch (problem) {
        error = problem;
    }
    finally {
        try {
            file?.close();
        }
        catch { }
        cleanup = await client.close();
    }
    if (error) {
        const safe = error instanceof PrivateUploadClientError ? error : new PrivateUploadClientError('journal_unavailable');
        safe.cleanup = cleanup;
        throw safe;
    }
    if (!result)
        return code('invalid_response');
    return { ...result, sessionCleanup: cleanup, metrics: client.metrics, notice: 'Stored transport bytes are not a registered source, document, grant or approval.' };
}
