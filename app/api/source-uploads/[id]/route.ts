import { withGuestRequestAudit } from '@/lib/review-request-audit';
import { handleSourceUpload, sourceUploadMethodNotAllowed } from '@/lib/private-source-upload-http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = {
    params: Promise<{
        id: string;
    }>;
};
export const GET = withGuestRequestAudit('document', (request: Request, context: Context) => handleSourceUpload(request, 'status', context.params));
export const PATCH = withGuestRequestAudit('document', (request: Request, context: Context) => handleSourceUpload(request, 'chunk', context.params));
export const DELETE = withGuestRequestAudit('document', (request: Request, context: Context) => handleSourceUpload(request, 'cancel', context.params));
export const HEAD = withGuestRequestAudit('document', (request: Request, context: Context) => handleSourceUpload(request, 'status', context.params));
export const POST = sourceUploadMethodNotAllowed;
export const PUT = sourceUploadMethodNotAllowed;
export const OPTIONS = sourceUploadMethodNotAllowed;
