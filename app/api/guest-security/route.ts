import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, requireActor, revalidateRequestActor } from '@/lib/auth';
import {
  GUEST_SECURITY_EVENT_TYPES,
  type GuestSecurityEventType,
  recordGuestServerEvent,
} from '@/lib/guest-security-log';
import { readAuthBody } from '@/lib/auth-http';
import type { GuestSecurityEventInput } from '@/lib/guest-security-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  Pragma: 'no-cache',
  Vary: 'Cookie',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await requireActor(request);
    if (actor.role !== 'guest' || !actor.review?.id) {
      return NextResponse.json({ ok: true, recorded: 0 }, { headers: privateHeaders });
    }
    const body = await readAuthBody(request).catch(() => null);
    revalidateRequestActor(actor);
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
      const allowedSurfaces: GuestSecurityEventInput['surface'][] = ['authentication','portal','workspace','excel','viewer','document','privacy','security'];
      const surface = allowedSurfaces.includes(item.surface as GuestSecurityEventInput['surface']) ? item.surface as GuestSecurityEventInput['surface'] : 'workspace';
      const targetId = typeof item.targetId === 'string' && item.targetId.trim() ? item.targetId.trim().slice(0, 160) : undefined;
      const detail = typeof item.detail === 'string' && item.detail.trim() ? item.detail.trim().slice(0, 240) : undefined;

      recordGuestServerEvent(actor, request.headers, {
        eventType,
        surface,
        targetId,
        detail,
        statusCode: 200,
      });

      // Client telemetry is not evidence of a server-authorized resource read.
      recorded += 1;
    }
    return NextResponse.json({ ok: true, recorded }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200, headers: privateHeaders });
  }
}
