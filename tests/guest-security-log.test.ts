import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  provisionAdmin,
  createSession,
  createInvitation,
  acceptInvitation,
  sessionCookie,
  type Actor,
} from '../lib/auth';
import { POST as loginPOST } from '../app/api/auth/login/route';
import { POST as securityPOST } from '../app/api/guest-security/route';
import { GET as workspaceGET } from '../app/api/guest-workspace/route';
import { GET as auditGET } from '../app/api/review-audit/route';
import { NextRequest } from 'next/server';

async function fixture(
  run: (ctx: {
    admin: Actor;
    adminCookie: string;
    guestCookie: string;
    guestEmail: string;
    guestPassword: string;
  }) => Promise<void>,
) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-guest-security-'));
  const env = {
    TAYCO_AUTH_DB_PATH: path.join(folder, 'auth.sqlite'),
    TAYCO_ERP_DB_PATH: path.join(folder, 'erp.sqlite'),
    TAYCO_SESSION_SECRET: randomBytes(48).toString('hex'),
    TAYCO_APP_URL: 'https://tayco.test',
    TAYCO_TRUSTED_INGRESS: 'railway-public-edge', // Simulated public-edge fixture, not runtime auto-detection.
  };
  const old = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  Object.assign(process.env, env);
  try {
    const id = await provisionAdmin('admin@example.test', 'Admin-Secure-Pass-2026!', 'tenant-one');
    const admin: Actor = {
      id,
      email: 'admin@example.test',
      role: 'admin',
      tenantId: 'tenant-one',
      projectIds: [],
    };
    const adminCookie = await createSession(id);
    const guestEmail = 'guest.harper.sim@example.test';
    const guestPassword = 'Guest-Secure-Pass-2026!';
    const invite = createInvitation(admin, {
      email: guestEmail,
      role: 'guest',
      tenantId: admin.tenantId,
      projectIds: [],
    });
    const accepted = await acceptInvitation(invite.token, guestEmail, guestPassword);
    await run({ admin, adminCookie, guestCookie: accepted.cookie, guestEmail, guestPassword });
  } finally {
    for (const [k, v] of Object.entries(old)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    try {
      rmSync(folder, { recursive: true, force: true });
    } catch {
      // Windows SQLite WAL handle cleanup
    }
  }
}

test('tracks distinct IPs, distinct devices, Excel workbooks, restricted clicks, and screenshot/snipping signals 100% server-side without optionalAnalytics', async () => {
  await fixture(async ({ adminCookie, guestCookie, guestEmail, guestPassword }) => {
    const cookieHeader = sessionCookie(guestCookie).split(';')[0];

    // 1. Login from Device 1 (Windows 11 / Chrome) on IP 203.0.113.10
    const loginRes1 = await loginPOST(
      new Request('https://tayco.test/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://tayco.test',
          'x-real-ip': '203.0.113.10',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'sec-ch-ua-platform': '"Windows"',
        },
        body: JSON.stringify({ email: guestEmail, password: guestPassword }),
      }),
    );
    assert.equal(loginRes1.status, 200);

    // 2. Open September 2026 & October 2026 Excel Workbooks from Device 1 (Essential-only cookies, no optionalAnalytics)
    for (const [period, label] of [
      ['2026-09', 'September 2026 (96 projects)'],
      ['2026-10', 'October 2026 (22 projects)'],
    ] as const) {
      const excelRes = await securityPOST(
        new NextRequest('https://tayco.test/api/guest-security', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'https://tayco.test',
            cookie: cookieHeader,
            'x-real-ip': '203.0.113.10',
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            eventType: 'excel.open',
            surface: 'excel',
            targetId: `excel:${period}`,
            detail: label,
          }),
        }),
      );
      assert.equal(excelRes.status, 200);
    }

    // 3. Trigger Screenshot (PrintScreen) & Snipping Tool (Win+Shift+S) & Window Blur on Excel from Device 1
    for (const sig of [
      {
        eventType: 'security.print_screen',
        surface: 'excel',
        targetId: 'excel:2026-09',
        detail: 'PrintScreen on September 2026',
      },
      {
        eventType: 'security.snip_shortcut',
        surface: 'excel',
        targetId: 'excel:2026-09',
        detail: 'Snip shortcut on September 2026',
      },
      {
        eventType: 'security.window_blur_with_doc',
        surface: 'excel',
        targetId: 'excel:2026-09',
        detail: 'Window focus lost while September 2026 Excel open',
      },
      {
        eventType: 'module.restricted_click',
        surface: 'workspace',
        targetId: 'restricted:financial_dashboard',
        detail: 'Accounting',
      },
    ]) {
      const sigRes = await securityPOST(
        new NextRequest('https://tayco.test/api/guest-security', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'https://tayco.test',
            cookie: cookieHeader,
            'x-real-ip': '203.0.113.10',
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
          body: JSON.stringify(sig),
        }),
      );
      assert.equal(sigRes.status, 200);
    }

    // 4. Access from Device 2 (iPhone / Mobile Safari) on a different IP (198.51.100.25)
    const mobileRes = await securityPOST(
      new NextRequest('https://tayco.test/api/guest-security', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://tayco.test',
          cookie: cookieHeader,
          'x-real-ip': '198.51.100.25',
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        },
        body: JSON.stringify({
          eventType: 'security.copy_attempt',
          surface: 'workspace',
          targetId: 'view:summary:2026-10',
          detail: 'Clipboard copy event',
        }),
      }),
    );
    assert.equal(mobileRes.status, 200);

    // 5. Query GET /api/review-audit as Admin and verify the full report
    const adminCookieHeader = sessionCookie(adminCookie).split(';')[0];
    const reportRes = await auditGET(
      new Request('https://tayco.test/api/review-audit', {
        headers: { cookie: adminCookieHeader },
      }),
    );
    assert.equal(reportRes.status, 200);
    const payload = await reportRes.json();

    assert.ok(payload.security);
    assert.equal(payload.security.guests.length, 1);
    const guestSummary = payload.security.guests[0];

    // Multi-IP & Multi-Device verification
    assert.equal(guestSummary.distinctIpCount, 2);
    assert.deepEqual(guestSummary.distinctIps.sort(), ['198.51.100.25', '203.0.113.10']);
    assert.equal(guestSummary.distinctDeviceCount, 2);
    assert.equal(
      guestSummary.distinctDevices.some((d: { deviceSummary: string }) => d.deviceSummary.includes('Windows')),
      true,
    );
    assert.equal(
      guestSummary.distinctDevices.some((d: { deviceSummary: string }) => d.deviceSummary.includes('iOS')),
      true,
    );

    // Excel months opened verification
    assert.deepEqual(guestSummary.excelMonthsOpened.sort(), ['2026-09', '2026-10']);

    // Security alerts verification (includes restricted module clicks + screenshot/snipping/blur/copy signals)
    assert.equal(guestSummary.securityAlerts.length, 5);
    assert.deepEqual(
      guestSummary.securityAlerts.map((a: { eventType: string }) => a.eventType).sort(),
      [
        'module.restricted_click',
        'security.copy_attempt',
        'security.print_screen',
        'security.snip_shortcut',
        'security.window_blur_with_doc',
      ],
    );

    // Verify no email or password leaked in /api/review-audit response
    const serialized = JSON.stringify(payload);
    assert.equal(serialized.includes(guestEmail), false);
    assert.equal(serialized.includes(guestPassword), false);
  });
});

test('tracks workspace section visits, 3rd/4th devices (macOS Safari + Android Chrome), and print/save/contextmenu/devtools alerts', async () => {
  await fixture(async ({ adminCookie, guestCookie }) => {
    const cookieHeader = sessionCookie(guestCookie).split(';')[0];

    // Visit Projects & New Opportunities sections via /api/guest-workspace from macOS Safari
    for (const section of ['summary', 'projects', 'lead'] as const) {
      const wsRes = await workspaceGET(
        new NextRequest(`https://tayco.test/api/guest-workspace?period=2026-10&section=${section}`, {
          headers: {
            cookie: cookieHeader,
            'x-real-ip': '192.0.2.44',
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
          },
        }),
      );
      assert.equal(wsRes.status, 200);
    }

    // Trigger print, save, context_menu, and devtools alerts from Android Chrome on 198.51.100.99
    const batchRes = await securityPOST(
      new NextRequest('https://tayco.test/api/guest-security', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://tayco.test',
          cookie: cookieHeader,
          'x-real-ip': '198.51.100.99',
          'user-agent':
            'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
        },
        body: JSON.stringify({
          events: [
            { eventType: 'security.print_attempt', surface: 'workspace', targetId: 'view:projects:2026-10', detail: 'Ctrl+P' },
            { eventType: 'security.save_attempt', surface: 'workspace', targetId: 'view:projects:2026-10', detail: 'Ctrl+S' },
            { eventType: 'security.context_menu', surface: 'viewer', targetId: 'doc-blueprint-1', detail: 'Right-click in CAD viewer' },
            { eventType: 'security.devtools_shortcut', surface: 'workspace', targetId: 'view:summary:2026-10', detail: 'F12' },
          ],
        }),
      }),
    );
    assert.equal(batchRes.status, 200);

    const adminCookieHeader = sessionCookie(adminCookie).split(';')[0];
    const reportRes = await auditGET(
      new Request('https://tayco.test/api/review-audit', {
        headers: { cookie: adminCookieHeader },
      }),
    );
    const payload = await reportRes.json();
    const guestSummary = payload.security.guests[0];

    assert.equal(guestSummary.distinctIpCount, 2);
    assert.deepEqual(guestSummary.distinctIps.sort(), ['192.0.2.44', '198.51.100.99']);
    assert.equal(guestSummary.distinctDeviceCount, 2);
    assert.deepEqual(
      guestSummary.sectionsVisited.sort(),
      ['section:lead:2026-10', 'section:projects:2026-10', 'section:summary:2026-10'],
    );
    assert.equal(guestSummary.securityAlertCount, 4);
  });
});
