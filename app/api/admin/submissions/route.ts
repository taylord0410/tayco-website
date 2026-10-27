import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireActor, assertSameOrigin } from '@/lib/auth';
import { ErpError, listWebsiteSubmissions, updateWebsiteSubmissionStatus } from '@/lib/erp';
import { readJson } from '../../submission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function failure(error: unknown) {
  if (error instanceof AuthError || error instanceof ErpError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  console.error('TAYCO admin submissions operation failed', {
    type: error instanceof Error ? error.name : 'unknown',
  });
  return NextResponse.json(
    { success: false, error: 'Unable to complete this request.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor(request);
    if (actor.role !== 'admin') {
      throw new ErpError(403, 'Only an administrator can view website form submissions.');
    }
    const submissions = listWebsiteSubmissions(actor);
    return NextResponse.json(
      { success: true, websiteSubmissions: submissions },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActor(request);
    assertSameOrigin(request);
    if (actor.role !== 'admin') {
      throw new ErpError(403, 'Only an administrator can manage website form submissions.');
    }
    const body = await readJson(request);
    const action = String(body.action || '');
    if (!['mark_read', 'mark_unread', 'archive', 'mark_all_read'].includes(action)) {
      throw new ErpError(422, 'Invalid submission action.');
    }
    const submissions = updateWebsiteSubmissionStatus(actor, {
      action: action as 'mark_read' | 'mark_unread' | 'archive' | 'mark_all_read',
      id: typeof body.id === 'string' ? body.id : undefined,
    });
    return NextResponse.json(
      { success: true, websiteSubmissions: submissions },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return failure(error);
  }
}
