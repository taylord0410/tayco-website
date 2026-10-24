import { SESSION_COOKIE } from '../../lib/auth';
import { startSourceUpload, sourceUploadStatus, appendSourceUpload, finishSourceUpload } from '../../lib/private-source-upload';
async function main() {
    const input = JSON.parse(process.env.TAYCO_UPLOAD_TEST_COMMAND!);
    const req = new Request('https://tayco.test/operator', { headers: { cookie: SESSION_COOKIE + '=' + encodeURIComponent(process.env.TAYCO_UPLOAD_TEST_COOKIE!) } });
    try {
        let value: unknown;
        if (input.action === 'status')
            value = await sourceUploadStatus(req, input.id);
        else if (input.action === 'start')
            value = await startSourceUpload(req, input.metadata);
        else if (input.action === 'finish')
            value = await finishSourceUpload(req, input.id);
        else
            value = await appendSourceUpload(req, input.id, input.offset, input.sha, new ReadableStream({ start(c) { c.enqueue(Buffer.from(input.bytes, 'base64')); c.close(); } }));
        process.stdout.write(JSON.stringify({ ok: true, value }));
    }
    catch (error) {
        process.stdout.write(JSON.stringify({ ok: false, status: (error as {
                status?: number;
            }).status ?? 500 }));
    }
}
void main();
