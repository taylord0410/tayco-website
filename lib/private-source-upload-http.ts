import { AuthError, assertSameOrigin, requireActor, requireRole, revalidateRequestActor, rateLimit, type Actor } from './auth';
import { SOURCE_UPLOAD_POLICY, SourceUploadError, startSourceUpload, sourceUploadStatus, appendSourceUpload, finishSourceUpload, cancelSourceUpload } from './private-source-upload';
import { noteReviewAuditFailure } from './review-request-audit';
export const SOURCE_UPLOAD_HTTP_POLICY = Object.freeze({ jsonBytes: 4096, timeoutMs: 60000, actorConcurrent: 4, tenantConcurrent: 8, controlActor: 600, controlTenant: 2400, chunkActor: 4096, chunkTenant: 16384, rateWindowSeconds: 900 });
type Operation = 'reserve' | 'status' | 'chunk' | 'finish' | 'cancel';
const methods: Record<Operation, string> = { reserve: 'POST', status: 'GET', chunk: 'PATCH', finish: 'POST', cancel: 'DELETE' };
const counts = new Map<string, number>();
function failure(status: number): never { throw new SourceUploadError(status, 'Upload request was not confirmed.'); }
function json(request: Request, value: unknown, status = 200) {
    const headers = new Headers({ 'Cache-Control': 'private, no-store', 'Pragma': 'no-cache', 'Vary': 'Cookie', 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow' });
    if (status === 429)
        headers.set('Retry-After', String(SOURCE_UPLOAD_HTTP_POLICY.rateWindowSeconds));
    if (status === 423)
        headers.set('Retry-After', '2');
    return new Response(request.method === 'HEAD' ? null : JSON.stringify(value), { status, headers });
}
function errorResponse(request: Request, error: unknown) {
    const known = error instanceof AuthError || error instanceof SourceUploadError;
    const status = known && [400, 401, 403, 404, 405, 408, 409, 410, 413, 415, 422, 423, 429, 503].includes(error.status) ? error.status : 503;
    const messages: Record<number, string> = { 400: 'Send a complete valid upload request.', 401: 'Sign in to continue.', 403: 'This account cannot perform this upload operation.', 404: 'Upload not found.', 405: 'This upload method is not supported.', 408: 'The upload request ended before confirmation. Inspect its status before retrying.', 409: 'Upload bytes or state conflict. Inspect its status before retrying.', 410: 'Upload expired. Generate a new reservation if needed.', 413: 'The request exceeds the upload body limit.', 415: 'Use the upload content type required by this operation.', 422: 'Check the upload metadata, offset and digest.', 423: 'Upload is busy. Inspect its status before retrying.', 429: 'Upload request limit reached. Retry after the indicated interval.', 503: 'Private upload is temporarily unavailable. No result is confirmed.' };
    noteReviewAuditFailure(error, status);
    return json(request, { error: messages[status] }, status);
}
function cancelBody(body: ReadableStream<Uint8Array> | null) {
    if (body && !body.locked)
        try {
            void body.cancel().catch(() => { });
        }
        catch { /* Cancellation is best effort, never an unbounded awaited response. */ }
}
export function sourceUploadMethodNotAllowed(request: Request) { cancelBody(request.body); return json(request, { error: 'This upload method is not supported.' }, 405); }
function slot(actor: Actor) {
    const keys = ['source-upload:actor:' + actor.tenantId + ':' + actor.id, 'source-upload:tenant:' + actor.tenantId];
    const limits = [SOURCE_UPLOAD_HTTP_POLICY.actorConcurrent, SOURCE_UPLOAD_HTTP_POLICY.tenantConcurrent];
    if (keys.some((key, i) => (counts.get(key) ?? 0) >= limits[i]))
        return failure(429);
    for (const key of keys)
        counts.set(key, (counts.get(key) ?? 0) + 1);
    return () => { for (const key of keys) {
        const next = (counts.get(key) ?? 1) - 1;
        if (next)
            counts.set(key, next);
        else
            counts.delete(key);
    } };
}
function declaredLength(request: Request, maximum: number) {
    const encoding = request.headers.get('content-encoding');
    if (encoding && encoding.toLowerCase() !== 'identity')
        return failure(415);
    const raw = request.headers.get('content-length');
    if (raw === null)
        return null;
    if (!/^(0|[1-9][0-9]{0,15})$/.test(raw))
        return failure(400);
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value > maximum)
        return failure(413);
    return value;
}
/** Await one IO operation with a detachable abort listener; late resolutions cannot authorize effects. */
async function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
    if (signal.aborted)
        return failure(408);
    let ended!: () => void;
    const abort = new Promise<never>((_, reject) => { ended = () => reject(new SourceUploadError(408, 'Upload request ended.')); signal.addEventListener('abort', ended, { once: true }); });
    try {
        return await Promise.race([promise, abort]);
    }
    finally {
        signal.removeEventListener('abort', ended);
    }
}
function bodyGate(request: Request, maximum: number, signal: AbortSignal, guard: () => void) {
    const declared = declaredLength(request, maximum), reader = request.body?.getReader();
    let bytes = 0, closed = false;
    const cleanup = () => { if (closed)
        return; closed = true; if (reader) {
        try {
            void reader.cancel().catch(() => { });
        }
        catch { }
        try {
            reader.releaseLock();
        }
        catch { }
    } };
    const next = async (): Promise<ReadableStreamReadResult<Uint8Array>> => {
        guard();
        const value = reader ? await abortable(reader.read(), signal) : { done: true as const, value: undefined };
        guard();
        if (value.done) {
            if (declared !== null && bytes !== declared)
                return failure(400);
            return { done: true, value: undefined };
        }
        if (!(value.value instanceof Uint8Array))
            return failure(400);
        bytes += value.value.byteLength;
        if (bytes > maximum)
            return failure(413);
        return value;
    };
    const stream = new ReadableStream<Uint8Array>({
        async pull(controller) { try {
            const value = await next();
            if (value.done) {
                controller.close();
                cleanup();
            }
            else
                controller.enqueue(value.value);
        }
        catch (error) {
            cleanup();
            controller.error(error);
        } },
        cancel() { cleanup(); }
    }, { highWaterMark: 0 });
    return { stream, cleanup };
}
async function consume(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader(), parts: Uint8Array[] = [];
    let bytes = 0;
    try {
        for (;;) {
            const value = await reader.read();
            if (value.done)
                break;
            parts.push(value.value);
            bytes += value.value.byteLength;
        }
        return Buffer.concat(parts, bytes);
    }
    finally {
        try {
            reader.releaseLock();
        }
        catch { }
    }
}
export async function handleSourceUpload(request: Request, operation: Operation, params?: Promise<{
    id: string;
}>) {
    const resolvedParams = params?.then(value => ({ ok: true as const, value }), () => ({ ok: false as const }));
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    request.signal.addEventListener('abort', onAbort, { once: true });
    if (request.signal.aborted)
        controller.abort();
    const timer = setTimeout(() => controller.abort(), SOURCE_UPLOAD_HTTP_POLICY.timeoutMs);
    timer.unref?.();
    const deadline = Date.now() + SOURCE_UPLOAD_HTTP_POLICY.timeoutMs;
    let release: (() => void) | undefined, cleanup: (() => void) | undefined;
    try {
        if (request.method !== methods[operation] && !(operation === 'status' && request.method === 'HEAD'))
            return sourceUploadMethodNotAllowed(request);
        const actor = await requireActor(request);
        requireRole(actor, ['admin']);
        const guard = () => { if (controller.signal.aborted || Date.now() >= deadline)
            return failure(408); revalidateRequestActor(actor); };
        guard();
        if (operation !== 'status')
            assertSameOrigin(request);
        if (new URL(request.url).search)
            return failure(422);
        release = slot(actor);
        const lane = operation === 'chunk' ? 'chunk' : 'control';
        // Use the existing durable 15-minute window; no shorter global cleanup of other auth limits.
        rateLimit('source-upload:' + lane + ':actor:' + actor.tenantId + ':' + actor.id, lane === 'chunk' ? SOURCE_UPLOAD_HTTP_POLICY.chunkActor : SOURCE_UPLOAD_HTTP_POLICY.controlActor);
        rateLimit('source-upload:' + lane + ':tenant:' + actor.tenantId, lane === 'chunk' ? SOURCE_UPLOAD_HTTP_POLICY.chunkTenant : SOURCE_UPLOAD_HTTP_POLICY.controlTenant);
        guard();
        const boundedRequest = new Request(request.url, { method: request.method, headers: request.headers, signal: controller.signal });
        let id = '';
        if (operation !== 'reserve') {
            if (!resolvedParams)
                return failure(404);
            guard();
            const resolved = await abortable(resolvedParams, controller.signal);
            guard();
            if (!resolved.ok)
                return failure(503);
            id = resolved.value.id;
            if (!/^su_[a-f0-9]{32}$/.test(id))
                return failure(404);
        }
        let value: unknown;
        if (operation === 'reserve') {
            if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? ''))
                return failure(415);
            const gate = bodyGate(request, SOURCE_UPLOAD_HTTP_POLICY.jsonBytes, controller.signal, guard);
            cleanup = gate.cleanup;
            const bytes = await consume(gate.stream);
            guard();
            let input: unknown;
            try {
                input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
            }
            catch {
                return failure(400);
            }
            value = await startSourceUpload(boundedRequest, input);
        }
        else if (operation === 'chunk') {
            if (request.headers.get('content-type')?.toLowerCase() !== 'application/octet-stream')
                return failure(415);
            const offset = request.headers.get('upload-offset'), sha = request.headers.get('upload-chunk-sha256');
            if (offset === null || !/^(0|[1-9][0-9]{0,15})$/.test(offset) || !Number.isSafeInteger(Number(offset)) || !sha || !/^[a-f0-9]{64}$/.test(sha))
                return failure(422);
            const gate = bodyGate(request, SOURCE_UPLOAD_POLICY.chunkBytes, controller.signal, guard);
            cleanup = gate.cleanup;
            value = await appendSourceUpload(boundedRequest, id, Number(offset), sha, gate.stream);
        }
        else {
            const gate = bodyGate(request, 0, controller.signal, guard);
            cleanup = gate.cleanup;
            await consume(gate.stream);
            guard();
            value = operation === 'status' ? await sourceUploadStatus(boundedRequest, id) : operation === 'finish' ? await finishSourceUpload(boundedRequest, id) : await cancelSourceUpload(boundedRequest, id);
        }
        guard();
        return json(request, value);
    }
    catch (error) {
        return errorResponse(request, error);
    }
    finally {
        cleanup?.();
        cancelBody(request.body);
        release?.();
        clearTimeout(timer);
        request.signal.removeEventListener('abort', onAbort);
    }
}
