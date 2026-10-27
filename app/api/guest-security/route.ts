import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, requireActor } from '@/lib/auth';
import {
  GUEST_SECURITY_EVENT_TYPES,
  type GuestSecurityEventType,
  recordGuestServerEvent,
} from '@/lib/guest-security-log';
import { recordReviewAudit } from '@/lib/review-audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  Pragma: 'no-cache',
  Vary: 'Cookie',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};

function sanitizeResourceId(prefix: string, raw?: string): string {
  const cleaned = `${prefix}_${String(raw ?? 'workspace').replace(/[^A-Za-z0-9_-]/g, '_')}`
    .replace(/^[^A-Za-z0-9]+/, 'm')
    .slice(0, 180);
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(cleaned) ? cleaned : 'module_event';
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await requireActor(request);
    if (actor.role !== 'guest' || !actor.review?.id) {
      return NextResponse.json({ ok: true, recorded: 0 }, { headers: privateHeaders });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid security event payload.' }, { status: 422, headers: privateHeaders });
    }
    const items = Array.isArray((body as { events?: unknown }).events)
      ? ((body as { events: unknown[] }).events)
      : [body];
    let recorded = 0;
    for (const raw of items.slice(0, 20)) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const eventType = String(item.eventType ?? '') as GuestSecurityEventType;
      if (!(GUEST_SECURITY_EVENT_TYPES as readonly string[]).includes(eventType)) continue;
      const surface = typeof item.surface === 'string' && item.surface.trim() ? item.surface.trim().slice(0, 64) : 'workspace';
      const targetId = typeof item.targetId === 'string' && item.targetId.trim() ? item.targetId.trim().slice(0, 160) : undefined;
      const detail = typeof item.detail === 'string' && item.detail.trim() ? item.detail.trim().slice(0, 240) : undefined;

      recordGuestServerEvent(actor, request.headers, {
        eventType,
        surface,
        targetId,
        detail,
        statusCode: 200,
      });

      try {
        const auditSurface = surface === 'viewer' ? 'viewer' : surface === 'projects' ? 'projects' : 'workspace';
        const resourceId = sanitizeResourceId(eventType.replace('.', '_'), targetId ?? surface);
        recordReviewAudit(actor, {
          kind: 'access.allowed',
          surface: auditSurface,
          statusCode: 200,
          resourceKind: 'module',
          resourceId,
          responseKind: 'none',
        });
      } catch {
        // Non-blocking fallback for secondary audit table.
      }
      recorded += 1;
    }
    return NextResponse.json({ ok: true, recorded }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200, headers: privateHeaders });
  }
}
