# PR #7 — revisión de integración

Revisión técnica de `7916089177d09f37272f89fd792734f43e77cc89` (sin merge ni despliegue).

**Decisión de integración:** conservar una sola consola. Recomiendo reutilizar la carga privada y comprobación SHA detrás del gateway y la autorización existentes de TAYCO; no integrar esta segunda página ni su sistema independiente de invitaciones tal como están. Mantener el PR en borrador mientras se corrigen los puntos siguientes.

1. **[P1] Autorizar el documento antes de firmarlo y nuevamente al entregarlo.** `server.js:125-136` acepta cualquier SHA válido para una sesión de invitación, sin comprobar que pertenezca a una fila publicable o a su concesión. Prueba independiente con datos exclusivamente sintéticos: un documento asociado a una fila no publicable, ausente del HTML, obtuvo 302 en `/go` y 200 con sus 39 bytes en `/d`. Se requiere conocer el SHA; no se está suponiendo que se pueda adivinar. Ocultar la fila no revoca un checksum conocido. Aplicar la concesión fresca de proyecto/documento en GET, HEAD y Range, antes de firmar y servir.

2. **[P2] Recuperar una subida cuando se pierde el acuse de un chunk.** `server.js:104-106` / `subir.js:13,26-31`: tras aceptar offset=3 con tres bytes, repetir el mismo chunk responde409 con tamaño6; el cliente trata ese409 como fallo definitivo. También un segundo finish encuentra que ya no existe .part. Añadir estado de subida y comprobación del tramo ya escrito, o recibos idempotentes para chunk/finalización; no duplicar ni truncar bytes al recuperar. El caso independiente se reprodujo con seis bytes sintéticos.

3. **[P2] Ejecutar el contenedor como usuario sin privilegios.** `Dockerfile:1-7` no declara USER. Definir UID/GID y permisos explícitos del volumen, y comprobar que el usuario no privilegiado puede crear, promover y leer temporales. Inspección estática; no he construido ni desplegado este contenedor.

4. **[P2] Evitar retener el PDF completo al validar la carga.** `server.js:106` usa readFileSync para el hash; `subir.js:24` también carga cada archivo completo. Usar hash/lectura por streams, límites totales y por archivo, cuotas y limpieza de temporales. La revisión no certifica aún el paquete real ni el comportamiento bajo presión de memoria.

**Paridad pendiente con el contrato del portal:** esta versión genera invitaciones por defecto de72h (`server.js:96`), sesiones de12h y una interfaz separada en español. No implementa por sí sola el acceso absoluto de4h desde generación, la consola compartida en inglés ni la proyección por destinatario. Sus cabeceras también impiden incrustar la página (`X-Frame-Options: DENY` / `frame-ancestors 'none'`); no se deben relajar globalmente para integrarla. Extraer el servicio de documentos preservando el control del gateway.

**Validación independiente:** los seis tests originales pasan. Dos pruebas adicionales con datos sintéticos y servidor loopback fallan por los puntos1 y2. Fuentes inspeccionadas antes de ejecutarlas; no se utilizaron documentos reales, no se crearon enlaces externos y no se modificó Railway. Esto revisa el código recibido, no aprueba una publicación.
