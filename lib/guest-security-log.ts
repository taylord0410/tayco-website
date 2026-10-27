import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Actor } from './auth';
import type { ReviewAuditContext } from './review-audit';

export const GUEST_SECURITY_EVENT_TYPES = [
  'auth.login',
  'portal.open',
  'workspace.section',
  'module.restricted_click',
  'excel.open',
  'excel.search',
  'excel.cell_inspect',
  'viewer.open',
  'viewer.document',
  'http.request',
  'security.print_screen',
  'security.snip_shortcut',
  'security.print_attempt',
  'security.save_attempt',
  'security.copy_attempt',
  'security.context_menu',
  'security.devtools_shortcut',
  'security.window_blur_with_doc',
] as const;

export type GuestSecurityEventType = typeof GUEST_SECURITY_EVENT_TYPES[number];

export interface GuestSecurityEventInput {
  eventType: GuestSecurityEventType;
  surface: 'authentication' | 'portal' | 'workspace' | 'excel' | 'viewer' | 'document' | 'privacy' | 'security';
  targetId?: string | null;
  detail?: string | null;
  statusCode?: number | null;
}

export interface RequestNetworkMetadata {
  clientIp: string;
  userAgent: string;
  deviceSummary: string;
  deviceFingerprint: string;
}

function openSecurityDb(): DatabaseSync {
  const preferred = process.env.TAYCO_AUTH_DB_PATH || path.join(process.cwd(), '.data', 'tayco-auth.sqlite');
  try {
    mkdirSync(path.dirname(preferred), { recursive: true, mode: 0o700 });
    return new DatabaseSync(preferred);
  } catch (error) {
    if (!process.env.RAILWAY_ENVIRONMENT) throw error;
    const fallback = path.join('/tmp', 'tayco-data', 'tayco-auth.sqlite');
    mkdirSync(path.dirname(fallback), { recursive: true, mode: 0o700 });
    return new DatabaseSync(fallback);
  }
}

export function installGuestSecuritySchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guest_security_events (
      event_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      review_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      surface TEXT NOT NULL,
      target_id TEXT,
      detail TEXT,
      status_code INTEGER,
      client_ip TEXT NOT NULL,
      device_fingerprint TEXT NOT NULL,
      device_summary TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_guest_security_tenant_time ON guest_security_events(tenant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_guest_security_actor_time ON guest_security_events(actor_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_guest_security_review_time ON guest_security_events(review_id, created_at DESC);
  `);
}

function getHeader(headers: Headers | Record<string, string | undefined> | null | undefined, name: string): string {
  if (!headers) return '';
  if (typeof (headers as Headers).get === 'function') {
    return ((headers as Headers).get(name) || '').trim();
  }
  const record = headers as Record<string, string | undefined>;
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase() === lower && typeof v === 'string') return v.trim();
  }
  return '';
}

export function parseDeviceSummary(ua: string, chPlatform: string, chMobile: string): string {
  const raw = ua || '';
  let os = 'Unknown OS';
  if (/iPhone|iPad|iPod/i.test(raw)) os = 'iOS';
  else if (/Android/i.test(raw)) os = 'Android';
  else if (/Windows NT 10\.0/i.test(raw) || /Windows/i.test(chPlatform)) os = 'Windows 10/11';
  else if (/Windows/i.test(raw)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(raw) || /macOS|Mac/i.test(chPlatform)) os = 'macOS';
  else if (/CrOS/i.test(raw)) os = 'ChromeOS';
  else if (/Linux/i.test(raw) || /Linux/i.test(chPlatform)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg\//i.test(raw)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(raw)) browser = 'Opera';
  else if (/Chrome\//i.test(raw) && !/Chromium/i.test(raw)) browser = 'Chrome';
  else if (/Firefox\//i.test(raw)) browser = 'Firefox';
  else if (/Safari\//i.test(raw) && /Version\//i.test(raw)) browser = 'Safari';
  else if (/node|PowerShell|curl/i.test(raw)) browser = 'API/Client';

  const isMobile = chMobile === '?1' || /Mobile|iPhone|Android/i.test(raw);
  const formFactor = isMobile ? 'Mobile' : 'Desktop';
  return `${os} · ${browser} · ${formFactor}`;
}

export function extractRequestNetworkMetadata(
  headers: Headers | Record<string, string | undefined> | null | undefined
): RequestNetworkMetadata {
  const xff = getHeader(headers, 'x-forwarded-for');
  const firstForwarded = xff ? xff.split(',')[0]?.trim() || '' : '';
  const realIp = getHeader(headers, 'x-real-ip') || getHeader(headers, 'cf-connecting-ip');
  const clientIp = (firstForwarded || realIp || 'local').slice(0, 80);

  const userAgent = getHeader(headers, 'user-agent').slice(0, 300) || 'unknown';
  const chUa = getHeader(headers, 'sec-ch-ua').slice(0, 160);
  const chPlatform = getHeader(headers, 'sec-ch-ua-platform').replace(/"/g, '').slice(0, 60);
  const chMobile = getHeader(headers, 'sec-ch-ua-mobile').slice(0, 10);
  const acceptLang = getHeader(headers, 'accept-language').split(',')[0]?.trim().slice(0, 35) || '';

  const deviceSummary = parseDeviceSummary(userAgent, chPlatform, chMobile);
  const rawFingerprint = JSON.stringify([deviceSummary, userAgent, acceptLang]);
  const deviceFingerprint = 'dev_' + createHash('sha256').update(rawFingerprint).digest('hex').slice(0, 12);

  return {
    clientIp,
    userAgent,
    deviceSummary,
    deviceFingerprint,
  };
}

export function recordGuestSecurityByContext(
  ctx: ReviewAuditContext,
  headers: Headers | Record<string, string | undefined> | null | undefined,
  input: GuestSecurityEventInput,
  now = Date.now()
) {
  if (ctx.actorRole !== 'guest') return null;
  try {
    const net = extractRequestNetworkMetadata(headers);
    const db = openSecurityDb();
    try {
      db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
      installGuestSecuritySchema(db);
      const eventId = randomUUID();
      const targetId = input.targetId ? String(input.targetId).slice(0, 160) : null;
      const detail = input.detail ? String(input.detail).slice(0, 400) : null;
      const statusCode = typeof input.statusCode === 'number' && Number.isInteger(input.statusCode) ? input.statusCode : null;
      db.prepare(
        `INSERT INTO guest_security_events(
          event_id, tenant_id, review_id, actor_id, event_type, surface,
          target_id, detail, status_code, client_ip, device_fingerprint,
          device_summary, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        eventId,
        ctx.tenantId,
        ctx.reviewId,
        ctx.actorId,
        input.eventType,
        input.surface,
        targetId,
        detail,
        statusCode,
        net.clientIp,
        net.deviceFingerprint,
        net.deviceSummary,
        net.userAgent,
        now
      );
      return { eventId, ...net };
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export function recordGuestServerEvent(
  actor: Actor | null | undefined,
  headers: Headers | Record<string, string | undefined> | null | undefined,
  input: GuestSecurityEventInput,
  now = Date.now()
) {
  if (!actor || actor.role !== 'guest' || !actor.review?.id) return null;
  return recordGuestSecurityByContext(
    {
      tenantId: actor.tenantId,
      reviewId: actor.review.id,
      actorId: actor.id,
      actorRole: 'guest',
    },
    headers,
    input,
    now
  );
}

export function guestSecurityReport(
  actor: Pick<Actor, 'role' | 'tenantId'>,
  options: { reviewId?: string } = {}
) {
  if (actor.role !== 'admin') {
    throw new Error('Administrator access is required.');
  }
  const now = Date.now();
  const cutoff = now - 90 * 86400000;
  try {
    const db = openSecurityDb();
    try {
      db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
      installGuestSecuritySchema(db);
      const params = [actor.tenantId, cutoff, options.reviewId ?? null, options.reviewId ?? null];
      const rows = db
        .prepare(
          `SELECT * FROM guest_security_events
           WHERE tenant_id = ? AND created_at >= ? AND (? IS NULL OR review_id = ?)
           ORDER BY created_at DESC, rowid DESC LIMIT 300`
        )
        .all(...params) as Record<string, unknown>[];

      const events = rows.map((r) => ({
        eventId: String(r.event_id),
        reviewId: String(r.review_id),
        actorId: String(r.actor_id),
        eventType: String(r.event_type),
        surface: String(r.surface),
        targetId: r.target_id !== null ? String(r.target_id) : null,
        detail: r.detail !== null ? String(r.detail) : null,
        statusCode: r.status_code !== null ? Number(r.status_code) : null,
        clientIp: String(r.client_ip),
        deviceFingerprint: String(r.device_fingerprint),
        deviceSummary: String(r.device_summary),
        userAgent: String(r.user_agent),
        createdAt: new Date(Number(r.created_at)).toISOString(),
      }));

      const byActorMap = new Map<
        string,
        {
          actorId: string;
          ips: Set<string>;
          devices: Map<string, { deviceFingerprint: string; deviceSummary: string; userAgent: string; firstSeenAt: string; lastSeenAt: string; count: number }>;
          excelMonthsOpened: Set<string>;
          sectionsVisited: Set<string>;
          documentsOpened: Set<string>;
          securityAlerts: { createdAt: string; eventType: string; targetId: string | null; detail: string | null; clientIp: string; deviceSummary: string }[];
          totalEvents: number;
        }
      >();

      for (const ev of events) {
        let entry = byActorMap.get(ev.actorId);
        if (!entry) {
          entry = {
            actorId: ev.actorId,
            ips: new Set(),
            devices: new Map(),
            excelMonthsOpened: new Set(),
            sectionsVisited: new Set(),
            documentsOpened: new Set(),
            securityAlerts: [],
            totalEvents: 0,
          };
          byActorMap.set(ev.actorId, entry);
        }
        entry.totalEvents++;
        entry.ips.add(ev.clientIp);
        const existingDev = entry.devices.get(ev.deviceFingerprint);
        if (!existingDev) {
          entry.devices.set(ev.deviceFingerprint, {
            deviceFingerprint: ev.deviceFingerprint,
            deviceSummary: ev.deviceSummary,
            userAgent: ev.userAgent,
            firstSeenAt: ev.createdAt,
            lastSeenAt: ev.createdAt,
            count: 1,
          });
        } else {
          existingDev.count++;
          if (ev.createdAt < existingDev.firstSeenAt) existingDev.firstSeenAt = ev.createdAt;
          if (ev.createdAt > existingDev.lastSeenAt) existingDev.lastSeenAt = ev.createdAt;
        }

        if (ev.eventType === 'excel.open' && ev.targetId) {
          entry.excelMonthsOpened.add(ev.targetId.replace(/^excel:/, ''));
        }
        if ((ev.eventType === 'workspace.section' || ev.eventType === 'portal.open') && ev.targetId) {
          entry.sectionsVisited.add(ev.targetId);
        }
        if ((ev.eventType === 'viewer.open' || ev.eventType === 'viewer.document' || ev.surface === 'viewer') && ev.targetId) {
          entry.documentsOpened.add(ev.targetId);
        }
        if (ev.eventType.startsWith('security.') || ev.eventType === 'module.restricted_click') {
          entry.securityAlerts.push({
            createdAt: ev.createdAt,
            eventType: ev.eventType,
            targetId: ev.targetId,
            detail: ev.detail,
            clientIp: ev.clientIp,
            deviceSummary: ev.deviceSummary,
          });
        }
      }

      const actors = [...byActorMap.values()].map((a) => ({
        actorId: a.actorId,
        totalEvents: a.totalEvents,
        distinctIpCount: a.ips.size,
        distinctIps: [...a.ips],
        distinctDeviceCount: a.devices.size,
        distinctDevices: [...a.devices.values()],
        excelMonthsOpened: [...a.excelMonthsOpened],
        sectionsVisited: [...a.sectionsVisited],
        documentsOpened: [...a.documentsOpened],
        securityAlertCount: a.securityAlerts.length,
        securityAlerts: a.securityAlerts,
      }));

      return {
        totalEvents: events.length,
        actors,
        guests: actors,
        events,
      };
    } finally {
      db.close();
    }
  } catch {
    return {
      totalEvents: 0,
      actors: [],
      guests: [],
      events: [],
    };
  }
}
