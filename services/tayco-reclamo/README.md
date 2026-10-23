# tayco-reclamo

Visor privado, de solo lectura, por invitación. Sin dependencias (Node >= 22). No contiene datos ni planos: viven en el volumen `/data`.

## Variables (solo en el servicio, nunca en Git)
`ADMIN_TOKEN` (operador), `SIGNING_SECRET` (aleatorio largo), `BASE_URL` (https exacto), `DATA_DIR=/data`.

## Seguridad
- Todo exige sesión de invitación, salvo `/healthz` y `/robots.txt`. Sin sesión: 401 sin contenido.
- Invitaciones: token de 256 bits; en disco solo su hash; vencen; se revocan y la sesión abierta cae al instante.
- PDF: `/go/<sha256>` → redirección a un enlace firmado de 60 s, atado a la sesión. No se comparte ni se puede alterar.
- `X-Robots-Tag: noindex`, `<meta robots>`, `robots.txt Disallow`, `no-store`, CSP estricta, sin recursos externos.
- Bitácora `acceso.log` (quién abrió qué; sin tokens).

## Operación (con `Authorization: Bearer $ADMIN_TOKEN`)
- `POST /admin/invites {"label":"...","ttl_hours":72}` → `{id, url}` (la URL se muestra una sola vez)
- `POST /admin/invites/<id>/revoke`
- `GET /admin/invites`
- Subida: `node subir.js <url> oportunidades_v1.json _descargas_wa.json` (por pedazos, verifica sha256)

## Pruebas
`npm test` (6 pruebas: sin invitación, con invitación y PDF, enlace vencido, noindex, revocación, vencimiento). `mutar.ps1` rompe el código a propósito para comprobar que las pruebas lo detectan.
