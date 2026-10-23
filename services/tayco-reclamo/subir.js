'use strict';
// Sube los PDF al visor por pedazos (evita el 413/502 de subir todo de golpe) y el JSON de datos.
// uso:  ADMIN_TOKEN=... node subir.js https://<servicio>.up.railway.app <oportunidades_v1.json> <_descargas_wa.json>
// El token va SOLO por variable de entorno, nunca como argumento.
const fs = require('node:fs');
const crypto = require('node:crypto');
const [base, jsonPath, descPath] = process.argv.slice(2);
const TOKEN = process.env.ADMIN_TOKEN;
if (!base || !jsonPath || !descPath || !TOKEN) { console.error('uso: ADMIN_TOKEN=... node subir.js <url> <oportunidades_v1.json> <_descargas_wa.json>'); process.exit(2); }
const H = { Authorization: 'Bearer ' + TOKEN };
const TROZO = 16 * 1024 * 1024;

async function pedir(url, opt) { for (let i = 0; i < 4; i++) { try { const r = await fetch(url, opt); if (r.status < 500) return r; } catch { /* reintento */ } await new Promise((r) => setTimeout(r, 1500 * (i + 1))); } throw new Error('sin respuesta: ' + url); }

(async () => {
  const datos = fs.readFileSync(jsonPath);
  const d = JSON.parse(datos);
  const bajados = new Map(JSON.parse(fs.readFileSync(descPath, 'utf8')).filter((x) => x.sha256 && x.archivo).map((x) => [x.sha256, x.archivo]));
  const filas = [...d.octubre.filas, ...d.sin_fecha_limite_en_el_documento.filas, d.aun_vivo];
  const shas = [...new Set(filas.flatMap((r) => r.documentos).filter((x) => x.estado === 'disponible' && x.sha256).map((x) => x.sha256))];
  let ok = 0;
  for (const sha of shas) {
    const f = bajados.get(sha); if (!f || !fs.existsSync(f)) { console.log('FALTA el archivo local', sha.slice(0, 12)); continue; }
    const buf = fs.readFileSync(f);
    if (crypto.createHash('sha256').update(buf).digest('hex') !== sha) { console.log('sha256 local NO coincide, no se sube:', f); continue; }
    for (let off = 0; off < buf.length || off === 0; off += TROZO) {
      const r = await pedir(`${base}/admin/upload/${sha}?offset=${off}`, { method: 'PUT', headers: H, body: buf.subarray(off, off + TROZO) });
      if (r.status !== 200) throw new Error(`subida ${sha.slice(0, 12)} offset ${off}: HTTP ${r.status}`);
    }
    const r = await pedir(`${base}/admin/upload/${sha}/finish`, { method: 'POST', headers: H });
    if (r.status !== 200) throw new Error(`finish ${sha.slice(0, 12)}: HTTP ${r.status}`);
    ok++; console.log(`OK ${ok}/${shas.length}  ${(buf.length / 1e6).toFixed(1)} MB  ${sha.slice(0, 12)}…`);
  }
  const r = await pedir(`${base}/admin/datos`, { method: 'PUT', headers: H, body: datos });
  console.log('datos:', r.status, '| PDF subidos y verificados:', ok, 'de', shas.length);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
