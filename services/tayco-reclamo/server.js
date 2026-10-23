'use strict';
// tayco-reclamo: visor privado, de solo lectura, por invitación. Sin dependencias. Un solo réplica (estado en DATA_DIR).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const b64u = (b) => Buffer.from(b).toString('base64url');
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('en-US'));

function crear(cfg = {}) {
  const DATA = cfg.dataDir || process.env.DATA_DIR || path.join(__dirname, 'data');
  const ADMIN = cfg.adminToken ?? process.env.ADMIN_TOKEN ?? '';
  const SECRET = cfg.signingSecret || process.env.SIGNING_SECRET || crypto.randomBytes(32).toString('hex');
  const BASE = (cfg.baseUrl || process.env.BASE_URL || '').replace(/\/$/, '');
  const TTL_LINK = cfg.linkSeconds ?? 60;          // los enlaces de PDF viven 60 s
  const TTL_SESION = (cfg.sessionHours ?? 12) * 3600e3;
  const ahora = cfg.now || (() => Date.now());
  fs.mkdirSync(path.join(DATA, 'docs'), { recursive: true });
  const F_STATE = path.join(DATA, 'state.json');
  const F_LOG = path.join(DATA, 'acceso.log');
  let st = { invites: [], sessions: [] };
  try { st = JSON.parse(fs.readFileSync(F_STATE, 'utf8')); } catch { /* primera vez */ }
  const guardar = () => { const t = F_STATE + '.tmp'; fs.writeFileSync(t, JSON.stringify(st)); fs.renameSync(t, F_STATE); };
  const log = (o) => fs.appendFile(F_LOG, JSON.stringify({ t: new Date(ahora()).toISOString(), ...o }) + '\n', () => {});
  const intentos = new Map();

  const cabeceras = (extra = {}) => ({
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet', 'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    ...extra });
  const out = (res, code, body, tipo = 'text/plain; charset=utf-8', extra = {}) => { res.writeHead(code, cabeceras({ 'Content-Type': tipo, ...extra })); res.end(body); };
  const json = (res, code, o) => out(res, code, JSON.stringify(o), 'application/json');
  const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, v.join('=')]));

  function sesion(req) {
    const c = cookies(req).tr_s; if (!c) return null;
    const h = sha(c); const s = st.sessions.find((x) => x.hash === h); if (!s || s.expires < ahora()) return null;
    const inv = st.invites.find((i) => i.id === s.invite_id); if (!inv || inv.revoked || inv.expires < ahora()) return null;
    return { ...s, id: h, inv };
  }
  const firma = (hash, exp, sid) => b64u(crypto.createHmac('sha256', SECRET).update(`${hash}|${exp}|${sid}`).digest());
  const datos = () => { try { return JSON.parse(fs.readFileSync(path.join(DATA, 'oportunidades_v1.json'), 'utf8')); } catch { return null; } };
  const archivo = (hash) => path.join(DATA, 'docs', hash + '.pdf');
  const hex64 = (s) => /^[0-9a-f]{64}$/.test(s);

  function fila(r) {
    const docs = (r.documentos || []).map((d) => d.estado === 'disponible' && d.sha256 && fs.existsSync(archivo(d.sha256))
      ? `<li><a href="/go/${d.sha256}" rel="noopener noreferrer">${esc(d.nombre)}</a> <small>(${esc(d.tipo)} · sha256 ${d.sha256.slice(0, 12)}… · ${(d.bytes / 1e6).toFixed(1)} MB)</small></li>`
      : `<li>${esc(d.nombre)} <small>(${esc(d.tipo)} · pendiente)</small></li>`).join('');
    return `<article><h3>${esc(r.n)}. ${esc(r.nombre)}</h3><dl>
<dt>Tipo</dt><dd>${esc(r.tipo)}</dd><dt>Constructora</dt><dd>${esc(r.constructora)}</dd><dt>Ubicación</dt><dd>${esc(r.ubicacion)} — ${esc(r.direccion_exacta)}</dd>
<dt>Tamaño</dt><dd>${esc(r.tamano_sf)} SF <em>(${esc(r.rotulo_tamano)})</em></dd>
<dt>Valor estimado de la obra completa</dt><dd>${usd(r.precio_bajo_usd)} – ${usd(r.precio_alto_usd)} <em>(${esc(r.rotulo_precio)})</em>${r.nota ? '<br><strong>' + esc(r.nota) + '</strong>' : ''}</dd>
<dt>Fecha límite de presentación</dt><dd>${esc(r.fecha_limite)}</dd><dt>Fecha de expiración</dt><dd>${esc(r.fecha_expiracion)} <em>(${esc(r.rotulo_expiracion)})</em></dd>
<dt>Resultado</dt><dd>${esc(r.resultado)}</dd><dt>Motivo</dt><dd>${esc(r.motivo)}</dd></dl>
<ul class="docs">${docs || '<li>sin documentos</li>'}</ul></article>`;
  }
  function pagina() {
    const d = datos();
    if (!d) return '<p>Datos no disponibles.</p>';
    const t = d.octubre.totales_sin_autozone, s = d.sin_fecha_limite_en_el_documento.totales;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow, noarchive"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TAYCO LLC — oportunidades</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:0 auto;padding:16px;color:#16213a}h1{font-size:1.5rem}article{border:1px solid #d5d9e2;border-radius:8px;padding:12px 16px;margin:14px 0}dt{font-weight:600;margin-top:6px}dd{margin:0}em,small{color:#5b6477}.aviso{background:#fff7e0;border:1px solid #e3c766;padding:10px 14px;border-radius:8px}</style></head><body>
<h1>${esc(d.titulo_seccion)}</h1><p><strong>Motivo común:</strong> ${esc(d.motivo_comun)}.</p>
<p class="aviso">Los montos son el <strong>${esc(t.rotulo)}</strong>. No son ingresos de TAYCO ni una pérdida. Las filas «ESTIMADO» son rangos por tipo de obra, no precios de TAYCO. Las fechas de expiración son estimadas, no confirmadas.</p>
<h2>Octubre 2026 — ${t.filas} obras · ${usd(t.bajo_usd)} a ${usd(t.alto_usd)} <small>(sin AutoZone)</small></h2>${d.octubre.filas.filter((r) => r.publicar !== false).map(fila).join('')}
<h2>Sin fecha límite en el documento — ${s.filas} obras · ${usd(s.bajo_usd)} a ${usd(s.alto_usd)}</h2><p><em>${esc(d.sin_fecha_limite_en_el_documento.nota)}.</em></p>${d.sin_fecha_limite_en_el_documento.filas.filter((r) => r.publicar !== false).map(fila).join('')}
<h2>Oportunidad aún viva</h2>${fila(d.aun_vivo)}
<h2>Ingresos mensuales</h2><p><em>Pendiente: los pone Taylord con sus números reales y su respaldo. Octubre 2026 puede estar incompleto.</em></p>
<h2>Operarios bloqueados de trabajar</h2><p><em>${esc(d.segundo_dano_operarios_bloqueados.estado)}</em></p></body></html>`;
  }

  const admin = (req, res) => {
    if (!ADMIN) { json(res, 503, { error: 'admin deshabilitado' }); return false; }
    const a = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!eq(sha(a), sha(ADMIN))) { log({ evento: 'admin_denegado' }); json(res, 401, { error: 'no autorizado' }); return false; }
    return true;
  };
  const cuerpo = (req, max = 1e6) => new Promise((ok, no) => { const c = []; let n = 0; req.on('data', (b) => { n += b.length; if (n > max) { no(new Error('grande')); req.destroy(); } else c.push(b); }); req.on('end', () => ok(Buffer.concat(c))); req.on('error', no); });

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'); const p = u.pathname;
    try {
      if (p === '/healthz') return out(res, 200, 'ok');
      if (p === '/robots.txt') return out(res, 200, 'User-agent: *\nDisallow: /\n');
      // --- administración (token de operador) ---
      if (p.startsWith('/admin/')) {
        if (!admin(req, res)) return;
        if (p === '/admin/invites' && req.method === 'POST') {
          const b = JSON.parse((await cuerpo(req)).toString() || '{}'); const tok = b64u(crypto.randomBytes(32));
          const inv = { id: crypto.randomUUID(), hash: sha(tok), label: String(b.label || '').slice(0, 80), created: ahora(), expires: ahora() + (Number(b.ttl_hours) || 72) * 3600e3, revoked: false };
          st.invites.push(inv); guardar(); log({ evento: 'invitacion_creada', invite: inv.id });
          return json(res, 201, { id: inv.id, expires: new Date(inv.expires).toISOString(), url: `${BASE}/i/${tok}` });
        }
        if (p === '/admin/invites' && req.method === 'GET') return json(res, 200, st.invites.map(({ hash, ...r }) => r));
        let m = p.match(/^\/admin\/invites\/([0-9a-f-]{36})\/revoke$/);
        if (m && req.method === 'POST') { const i = st.invites.find((x) => x.id === m[1]); if (!i) return json(res, 404, {}); i.revoked = true; guardar(); log({ evento: 'invitacion_revocada', invite: i.id }); return json(res, 200, { revocada: i.id }); }
        m = p.match(/^\/admin\/upload\/([0-9a-f]{64})$/);
        if (m && req.method === 'PUT') { const off = Number(u.searchParams.get('offset') || 0); const b = await cuerpo(req, 64e6); const f = archivo(m[1]) + '.part'; if (off === 0) fs.writeFileSync(f, b); else { if (!fs.existsSync(f) || fs.statSync(f).size !== off) return json(res, 409, { error: 'offset', tamano: fs.existsSync(f) ? fs.statSync(f).size : 0 }); fs.appendFileSync(f, b); } return json(res, 200, { tamano: fs.statSync(f).size }); }
        m = p.match(/^\/admin\/upload\/([0-9a-f]{64})\/finish$/);
        if (m && req.method === 'POST') { const f = archivo(m[1]) + '.part'; if (!fs.existsSync(f)) return json(res, 404, {}); const h = crypto.createHash('sha256'); h.update(fs.readFileSync(f)); if (h.digest('hex') !== m[1]) { fs.unlinkSync(f); return json(res, 422, { error: 'sha256 no coincide; se descartó' }); } fs.renameSync(f, archivo(m[1])); return json(res, 200, { ok: true }); }
        if (p === '/admin/datos' && req.method === 'PUT') { const b = await cuerpo(req, 5e6); JSON.parse(b.toString()); fs.writeFileSync(path.join(DATA, 'oportunidades_v1.json'), b); return json(res, 200, { ok: true }); }
        return json(res, 404, {});
      }
      // --- invitación → sesión ---
      let m = p.match(/^\/i\/([A-Za-z0-9_-]{20,64})$/);
      if (m) {
        const ip = req.socket.remoteAddress || ''; const n = (intentos.get(ip) || []).filter((t) => t > ahora() - 60e3); n.push(ahora()); intentos.set(ip, n);
        if (n.length > 20) return out(res, 429, 'Demasiados intentos.');
        const h = sha(m[1]); const inv = st.invites.find((i) => i.hash === h);
        if (!inv || inv.revoked || inv.expires < ahora()) { log({ evento: 'invitacion_invalida' }); return out(res, 401, 'Acceso solo por invitación.'); }
        const sid = b64u(crypto.randomBytes(32)); st.sessions = st.sessions.filter((s) => s.expires > ahora());
        st.sessions.push({ hash: sha(sid), invite_id: inv.id, expires: Math.min(inv.expires, ahora() + TTL_SESION) }); guardar(); log({ evento: 'sesion_abierta', invite: inv.id });
        return out(res, 302, '', 'text/plain', { Location: '/', 'Set-Cookie': `tr_s=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(TTL_SESION / 1000)}${BASE.startsWith('https') ? '; Secure' : ''}` });
      }
      // --- todo lo demás exige sesión válida ---
      const s = sesion(req);
      if (!s) { log({ evento: 'sin_acceso', ruta: p.slice(0, 40) }); return out(res, 401, 'Acceso solo por invitación.'); }
      if (p === '/' && req.method === 'GET') { log({ evento: 'vista', invite: s.inv.id }); return out(res, 200, pagina(), 'text/html; charset=utf-8'); }
      m = p.match(/^\/go\/([0-9a-f]{64})$/);
      if (m) { const exp = ahora() + TTL_LINK * 1000; return out(res, 302, '', 'text/plain', { Location: `/d/${m[1]}?exp=${exp}&sig=${firma(m[1], exp, s.id)}` }); }
      m = p.match(/^\/d\/([0-9a-f]{64})$/);
      if (m) {
        const exp = Number(u.searchParams.get('exp')), sig = u.searchParams.get('sig') || '';
        if (!(exp > ahora()) || !eq(sig, firma(m[1], exp, s.id))) { log({ evento: 'enlace_vencido', invite: s.inv.id }); return out(res, 403, 'Enlace vencido o inválido.'); }
        const f = archivo(m[1]); if (!fs.existsSync(f)) return out(res, 404, 'Documento no disponible.');
        const tam = fs.statSync(f).size; const r = (req.headers.range || '').match(/^bytes=(\d*)-(\d*)$/);
        log({ evento: 'documento', invite: s.inv.id, sha256: m[1] });
        const base = { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline', 'Accept-Ranges': 'bytes' };
        if (r && (r[1] || r[2])) { const a = r[1] ? Number(r[1]) : tam - Number(r[2]), z = r[1] && r[2] ? Number(r[2]) : tam - 1; if (a > z || z >= tam) return out(res, 416, '', 'text/plain', { 'Content-Range': `bytes */${tam}` }); res.writeHead(206, cabeceras({ ...base, 'Content-Range': `bytes ${a}-${z}/${tam}`, 'Content-Length': z - a + 1 })); return fs.createReadStream(f, { start: a, end: z }).pipe(res); }
        res.writeHead(200, cabeceras({ ...base, 'Content-Length': tam })); return fs.createReadStream(f).pipe(res);
      }
      return out(res, 404, 'No encontrado.');
    } catch (e) { return out(res, 500, 'Error.'); }
  });
  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  crear().listen(port, '0.0.0.0', () => console.log('tayco-reclamo escuchando en', port));
}
module.exports = { crear, sha };
