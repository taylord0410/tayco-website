'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { crear } = require('../server.js');

const REAL = process.env.OPORTUNIDADES || path.join(__dirname, 'fixtures', 'oportunidades_ejemplo.json'); // datos de EJEMPLO; con OPORTUNIDADES=<ruta> se prueba con los reales
const ADMIN = 'token-de-operador-de-prueba-' + crypto.randomBytes(8).toString('hex');
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n% prueba\n'), crypto.randomBytes(300000), Buffer.from('\n%%EOF\n')]);
const SHA = crypto.createHash('sha256').update(PDF).digest('hex');
let reloj = Date.now();

async function levantar() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reclamo-'));
  const d = JSON.parse(fs.readFileSync(REAL, 'utf8'));
  const fila = d.octubre.filas[0]; fila.documentos = [{ nombre: 'planos-de-prueba.pdf', tipo: 'planos del GC/arquitecto', sha256: SHA, bytes: PDF.length, estado: 'disponible' },
    { nombre: 'pendiente.pdf', tipo: 'planos del GC/arquitecto', sha256: null, bytes: null, estado: 'pendiente' }];
  fs.writeFileSync(path.join(dir, 'oportunidades_v1.json'), JSON.stringify(d));
  const srv = crear({ dataDir: dir, adminToken: ADMIN, signingSecret: 's'.repeat(32), baseUrl: 'http://127.0.0.1', linkSeconds: 60, now: () => reloj });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); srv.unref();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const ad = { Authorization: 'Bearer ' + ADMIN };
  // subir el PDF por pedazos, como se hará en producción
  const trozo = 100000;
  for (let o = 0; o < PDF.length; o += trozo) {
    const r = await fetch(`${base}/admin/upload/${SHA}?offset=${o}`, { method: 'PUT', headers: ad, body: PDF.subarray(o, o + trozo) });
    assert.equal(r.status, 200);
  }
  assert.equal((await fetch(`${base}/admin/upload/${SHA}/finish`, { method: 'POST', headers: ad })).status, 200);
  const nueva = async (ttl = 72) => { const r = await fetch(`${base}/admin/invites`, { method: 'POST', headers: { ...ad, 'Content-Type': 'application/json' }, body: JSON.stringify({ label: 'prueba', ttl_hours: ttl }) }); assert.equal(r.status, 201); return r.json(); };
  const entrar = async (url) => { const r = await fetch(url.replace('http://127.0.0.1', base), { redirect: 'manual' }); return { status: r.status, cookie: (r.headers.get('set-cookie') || '').split(';')[0] }; };
  return { srv, base, ad, nueva, entrar, dir, cerrar: () => new Promise((r) => srv.close(r)) };
}
const get = (base, p, cookie, extra = {}) => fetch(base + p, { redirect: 'manual', headers: { ...(cookie ? { Cookie: cookie } : {}), ...extra } });

test('PRUEBA 1 · sin invitación → 401 y nada de contenido', async () => {
  const t = await levantar();
  for (const p of ['/', '/go/' + SHA, '/d/' + SHA, '/admin/invites', '/api/lo-que-sea']) {
    const r = await get(t.base, p); const x = await r.text();
    assert.ok([401, 404].includes(r.status), `${p} → ${r.status}`);
    assert.ok(!/AutoZone|Kroger|Foot Locker|Oportunidad|Constructora|%PDF/.test(x), `${p} filtró contenido`);
  }
  const r = await get(t.base, '/', 'tr_s=' + 'a'.repeat(43)); assert.equal(r.status, 401);
  const inv = await fetch(t.base + '/i/' + 'X'.repeat(43), { redirect: 'manual' }); assert.equal(inv.status, 401);
  assert.equal((await fetch(t.base + '/admin/invites')).status, 401);
  assert.equal((await fetch(t.base + '/admin/invites', { headers: { Authorization: 'Bearer mal' } })).status, 401);
  await t.cerrar();
});

test('PRUEBA 2 · con invitación → carga la lista y abre un PDF', async () => {
  const t = await levantar(); const { url } = await t.nueva(); const { status, cookie } = await t.entrar(url);
  assert.equal(status, 302); assert.match(cookie, /^tr_s=/);
  const pg = await get(t.base, '/', cookie); const html = await pg.text(); assert.equal(pg.status, 200);
  assert.match(html, /Obras a las que TAYCO fue invitada y no pudo ofertar/); assert.match(html, /no es ingreso|No son ingresos de TAYCO ni una pérdida/i);
  assert.match(html, /Falta de cobertura de seguro/); assert.match(html, /pendiente/);
  assert.ok(!/AutoZone #11111/.test(html), 'AutoZone no debe publicarse');
  const g = await get(t.base, '/go/' + SHA, cookie); assert.equal(g.status, 302);
  const pdf = await get(t.base, g.headers.get('location'), cookie); const buf = Buffer.from(await pdf.arrayBuffer());
  assert.equal(pdf.status, 200); assert.equal(pdf.headers.get('content-type'), 'application/pdf'); assert.ok(buf.equals(PDF));
  const rg = await get(t.base, g.headers.get('location'), cookie, { Range: 'bytes=0-99' }); assert.equal(rg.status, 206); assert.equal((await rg.arrayBuffer()).byteLength, 100);
  await t.cerrar();
});

test('PRUEBA 3 · un enlace de PDF vencido o alterado no abre', async () => {
  const t = await levantar(); const { url } = await t.nueva(); const { cookie } = await t.entrar(url);
  const g = await get(t.base, '/go/' + SHA, cookie); const loc = g.headers.get('location');
  assert.equal((await get(t.base, loc, cookie)).status, 200);
  reloj += 61e3;                                                      // pasan 61 s
  assert.equal((await get(t.base, loc, cookie)).status, 403, 'el enlace vencido no debe abrir');
  const g2 = await get(t.base, '/go/' + SHA, cookie); const l2 = g2.headers.get('location');
  assert.equal((await get(t.base, l2.replace(/sig=./, 'sig=A'), cookie)).status, 403, 'firma alterada');
  assert.equal((await get(t.base, l2.replace(/exp=\d+/, 'exp=' + (reloj + 9e9)), cookie)).status, 403, 'exp alterado');
  const otra = await t.entrar((await t.nueva()).url);
  assert.equal((await get(t.base, l2, otra.cookie)).status, 403, 'el enlace es de una sola sesión: no se comparte');
  assert.equal((await get(t.base, l2)).status, 401, 'sin sesión no abre aunque la firma sea buena');
  await t.cerrar();
});

test('PRUEBA 4 · noindex en cabecera y meta; robots; ningún enlace público', async () => {
  const t = await levantar(); const { cookie } = await t.entrar((await t.nueva()).url);
  for (const [p, c] of [['/', cookie], ['/', null], ['/healthz', null], ['/robots.txt', null]]) {
    const r = await get(t.base, p, c); assert.match(r.headers.get('x-robots-tag'), /noindex/); assert.match(r.headers.get('cache-control'), /no-store/);
  }
  const html = await (await get(t.base, '/', cookie)).text(); assert.match(html, /<meta name="robots" content="noindex/);
  assert.match(await (await get(t.base, '/robots.txt')).text(), /Disallow: \//);
  const enlaces = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]); assert.ok(enlaces.every((h) => h.startsWith('/go/')), 'solo enlaces internos /go/');
  assert.ok(!/https?:\/\//.test(html), 'sin URLs absolutas ni recursos externos');
  assert.equal((await get(t.base, '/d/' + SHA + '?exp=1&sig=x')).status, 401);
  await t.cerrar();
});

test('PRUEBA 5 · revocar la invitación → deja de entrar (también la sesión abierta)', async () => {
  const t = await levantar(); const { id, url } = await t.nueva(); const { cookie } = await t.entrar(url);
  assert.equal((await get(t.base, '/', cookie)).status, 200);
  assert.equal((await fetch(`${t.base}/admin/invites/${id}/revoke`, { method: 'POST', headers: t.ad })).status, 200);
  assert.equal((await get(t.base, '/', cookie)).status, 401, 'la sesión abierta debe caer');
  assert.equal((await t.entrar(url)).status, 401, 'el enlace ya no sirve');
  await t.cerrar();
});

test('EXTRA · la invitación vence sola; la subida con sha256 falso se descarta', async () => {
  const t = await levantar(); const { url } = await t.nueva(1); const { cookie } = await t.entrar(url);
  assert.equal((await get(t.base, '/', cookie)).status, 200);
  reloj += 61 * 60e3; assert.equal((await get(t.base, '/', cookie)).status, 401); assert.equal((await t.entrar(url)).status, 401);
  const falso = 'f'.repeat(64);
  await fetch(`${t.base}/admin/upload/${falso}?offset=0`, { method: 'PUT', headers: t.ad, body: Buffer.from('no es el hash') });
  assert.equal((await fetch(`${t.base}/admin/upload/${falso}/finish`, { method: 'POST', headers: t.ad })).status, 422);
  assert.ok(!fs.existsSync(path.join(t.dir, 'docs', falso + '.pdf')));
  const reg = fs.readFileSync(path.join(t.dir, 'acceso.log'), 'utf8'); assert.ok(!reg.includes('tr_s=') && !/token|Bearer/.test(reg), 'el registro no guarda secretos');
  await t.cerrar();
});
