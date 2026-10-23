import { assertSameOrigin, AuthError, listAccounts, requireActor, updateAccountAccess, type AuthRole } from '@/lib/auth';
import { authFailure, authJson, readAuthBody } from '@/lib/auth-http';
import { ErpError, validateInvitationAssignments } from '@/lib/erp';
export const runtime = 'nodejs';
export async function GET(request: Request) { try { return authJson({ accounts: listAccounts(await requireActor(request)) }); } catch (error) { return authFailure(error); } }
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request); const actor = await requireActor(request); const body = await readAuthBody(request);
    if (typeof body.id !== 'string' || typeof body.accessVersion !== 'string' || typeof body.role !== 'string' || !Array.isArray(body.projectIds) || body.projectIds.some(id => typeof id !== 'string') || typeof body.disabled !== 'boolean' || (body.vendorId !== undefined && typeof body.vendorId !== 'string')) throw new AuthError('Choose valid account assignments.', 400);
    validateInvitationAssignments(actor, body.projectIds as string[], body.vendorId as string | undefined);
    updateAccountAccess(actor, { id: body.id, role: body.role as AuthRole, projectIds: body.projectIds as string[], vendorId: body.vendorId as string | undefined, disabled: body.disabled, accessVersion: body.accessVersion });
    return authJson({ success: true, accounts: listAccounts(actor) });
  } catch (error) { return authFailure(error instanceof ErpError ? new AuthError(error.message, error.status) : error); }
}
