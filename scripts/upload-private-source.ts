import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPrivateSourceUpload, privateUploadOrigin, PrivateUploadClientError } from '../lib/private-source-upload-client';
export async function uploadPrivateSourceCLI(args = process.argv.slice(2), env: Record<string, string | undefined> = process.env) {
    const keys = new Map<string, string>(), flags = new Set<string>();
    for (const arg of args) {
        const match = /^--(file|journal|base-url|max-chunks)=(.+)$/.exec(arg);
        if (match) {
            if (keys.has(match[1]))
                throw new PrivateUploadClientError('usage');
            keys.set(match[1], match[2]);
        }
        else if (['--status', '--cancel'].includes(arg)) {
            if (flags.has(arg))
                throw new PrivateUploadClientError('usage');
            flags.add(arg);
        }
        else
            throw new PrivateUploadClientError('usage');
    }
    if (flags.size > 1 || !env.TAYCO_APP_URL || !env.TAYCO_UPLOAD_EMAIL || !env.TAYCO_UPLOAD_PASSWORD || !keys.get('journal'))
        throw new PrivateUploadClientError('usage');
    const origin = privateUploadOrigin(env.TAYCO_APP_URL);
    if (keys.has('base-url') && privateUploadOrigin(keys.get('base-url')!) !== origin)
        throw new PrivateUploadClientError('untrusted_origin');
    const action = flags.has('--status') ? 'status' : flags.has('--cancel') ? 'cancel' : 'upload';
    if (action !== 'upload' && keys.has('file'))
        throw new PrivateUploadClientError('usage');
    const maxChunks = keys.has('max-chunks') ? Number(keys.get('max-chunks')) : undefined;
    const controller = new AbortController(), ended = () => controller.abort();
    process.once('SIGINT', ended);
    process.once('SIGTERM', ended);
    try {
        return await runPrivateSourceUpload({ origin, email: env.TAYCO_UPLOAD_EMAIL, password: env.TAYCO_UPLOAD_PASSWORD, journal: keys.get('journal')!, file: keys.get('file'), action, maxChunks, signal: controller.signal });
    }
    finally {
        process.removeListener('SIGINT', ended);
        process.removeListener('SIGTERM', ended);
    }
}
if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
    uploadPrivateSourceCLI().then(value => console.log(JSON.stringify({ ok: true, ...value }))).catch(error => { const known = error instanceof PrivateUploadClientError; console.error(JSON.stringify({ ok: false, error: known ? error.code : 'network_unconfirmed', ...(known && error.status ? { status: error.status } : {}), sessionCleanup: known ? error.cleanup : 'not_confirmed', next: 'Inspect the owned upload status before retrying. No source admission is implied.' })); process.exitCode = 1; });
}
