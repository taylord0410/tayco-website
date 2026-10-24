import {withGuestRequestAudit} from '@/lib/review-request-audit';
import { requireActor, assertSameOrigin, requireRole, AuthError } from '@/lib/auth';
import { authJson, readAuthBody } from '@/lib/auth-http';
import { documentMaintenance, mutateDocumentLifecycle, purgeDocument, scanDocumentExpiry } from '@/lib/document-lifecycle';
import { ErpError } from '@/lib/erp';
export const runtime = 'nodejs';
function failure(error: unknown) { return authJson({ error: error instanceof ErpError || error instanceof AuthError ? error.message : 'Document maintenance is temporarily unavailable.' }, error instanceof ErpError || error instanceof AuthError ? error.status : 503); }
async function handleGET(request: Request) { try { const actor = await requireActor(request); requireRole(actor, ['admin', 'staff', 'client', 'vendor']); return authJson(documentMaintenance(actor)); } catch (error) { return failure(error); } }
async function handlePOST(request: Request) {
  try {
    const actor = await requireActor(request); requireRole(actor, ['admin', 'staff', 'client', 'vendor']); assertSameOrigin(request); const body = await readAuthBody(request);
    if (body.action === 'scan_expiry') return authJson(scanDocumentExpiry(actor));
    if (typeof body.id !== 'string' || !Number.isInteger(body.version)) throw new ErpError(422, 'Choose a document and refresh its current state.');
    if (body.action === 'purge') {
      if (body.apply !== true) throw new ErpError(422, 'Confirm permanent storage deletion explicitly.');
      return authJson({ result: await purgeDocument(actor, { id: body.id, version: body.version as number, apply: true }), ...documentMaintenance(actor) });
    }
    if (!['delete', 'restore', 'hold', 'retention'].includes(String(body.action))) throw new ErpError(422, 'Choose a valid document action.');
    const document = mutateDocumentLifecycle(actor, { id: body.id, version: body.version as number, action: body.action as 'delete' | 'restore' | 'hold' | 'retention', reason: typeof body.reason === 'string' ? body.reason : undefined, hold: typeof body.hold === 'boolean' ? body.hold : undefined, retentionDays: body.retentionDays as number | null | undefined });
    return authJson({ document, ...documentMaintenance(actor) });
  } catch (error) { return failure(error); }
}

export const GET=withGuestRequestAudit('document',handleGET);

export const POST=withGuestRequestAudit('document',handlePOST);
