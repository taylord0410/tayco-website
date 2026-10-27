'use client';

export type ClientGuestSecurityEventType =
  | 'excel.open'
  | 'module.restricted_click'
  | 'security.print_screen'
  | 'security.snip_shortcut'
  | 'security.print_attempt'
  | 'security.save_attempt'
  | 'security.copy_attempt'
  | 'security.context_menu'
  | 'security.devtools_shortcut'
  | 'security.window_blur_with_doc';

const recentDedupe = new Map<string, number>();

export function sendGuestSecuritySignal(
  eventType: ClientGuestSecurityEventType,
  surface: string,
  targetId?: string,
  detail?: string,
): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const dedupeKey = `${eventType}|${surface}|${targetId ?? ''}`;
  const minIntervalMs = eventType === 'security.window_blur_with_doc' ? 2500 : 600;
  const lastAt = recentDedupe.get(dedupeKey) ?? 0;
  if (now - lastAt < minIntervalMs) return;
  recentDedupe.set(dedupeKey, now);

  const payload = JSON.stringify({
    eventType,
    surface,
    ...(targetId ? { targetId } : {}),
    ...(detail ? { detail } : {}),
  });

  try {
    void fetch('/api/guest-security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: payload,
    }).catch(() => {});
  } catch {
    // Silent server-side telemetry only; never disrupts the guest UI.
  }
}
