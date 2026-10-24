import { withGuestRequestAudit } from '@/lib/review-request-audit';
import { handleSourceUpload, sourceUploadMethodNotAllowed } from '@/lib/private-source-upload-http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = {
    params: Promise<{
        id: string;
    }>;
};
export const POST = withGuestRequestAudit('document', (request: Request, context: Context) => handleSourceUpload(request, 'finish', context.params));
export const GET = sourceUploadMethodNotAllowed;
export const HEAD = sourceUploadMethodNotAllowed;
export const PATCH = sourceUploadMethodNotAllowed;
export const DELETE = sourceUploadMethodNotAllowed;
export const PUT = sourceUploadMethodNotAllowed;
export const OPTIONS = sourceUploadMethodNotAllowed;
