# SG B1 — Base de seguridad y línea de referencia local

Fuente de progreso: Soul Ledger, proyecto PROJ_00047_TAYCO_WEBSITE. Bloques: B1=25663 (fundación), B2=25664 (ruta pública), B3=25665 (verificación/formulario), B4=25666 (administración/reversión), B5=25667 (fallos y preparación de despliegue). Este documento describe el contrato y su evidencia, no un segundo dashboard.

## Contrato implementado

- client-network.ts es el adaptador común para el proxy, el flujo visual y los metadatos de seguridad.
- Sin TAYCO_TRUSTED_INGRESS=railway-public-edge, la identidad de IP es unknown. No se confía automáticamente en XFF, CF-Connecting-IP, Host, X-Railway-Edge ni variables informativas de plataforma.
- El modo explícito acepta únicamente un X-Real-IP con una sola IP válida. No adivina la topología ni toma posiciones de XFF. IPv4-mapped IPv6 se normaliza.
- Ese modo representa un contrato que el operador debe verificar: entrada HTTP pública de Railway, sin otro camino privado/TCP no confiable hacia el listener. La aplicación no puede demostrar esa procedencia por una cabecera. No se activó en producción ni en la instancia local.
- En producción, Host o una dirección loopback nunca conceden la exención de desarrollo. IP desconocida no entra en un bucket compartido que permitiría bloquear a todos por la acción de un escáner. Sin identidad confiable no se acredita limitación individual por IP; los demás controles de método/ruta/UA, cuenta y formulario conservan su función.
- IP unknown o redacted no aumenta distinctIpCount. Los datos históricos no reciben una nueva certificación de procedencia por esta corrección.

Referencia de plataforma: [Railway public networking](https://docs.railway.com/networking/public-networking/specs-and-limits). Es necesario verificar la configuración efectiva de Tayco antes de habilitar confianza o desplegar.

## Claves y datos

Se eliminaron claves literales de respaldo en registros de invitados y solicitudes web. La primera variable definida debe ser válida; un override vacío/corto no retrocede silenciosamente a otra clave. Mínimo32caracteres útiles. Se preservan bytes, precedencia y derivación de claves válidas.

Solicitudes web: TAYCO_DATA_ENCRYPTION_KEY → TAYCO_SESSION_SECRET → SESSION_SECRET. Registros de invitados: TAYCO_SUBMISSIONS_KEY → TAYCO_SESSION_SECRET. SESSION_SECRET es compatibilidad explícita existente, no una clave predeterminada.

Los formatos AES-256-GCM actuales se conservan. Las pruebas construyen ciphertext con la derivación anterior configurada y lo leen con el código nuevo. No hubo rotación, recifrado ni modificación de datos de producción.

Si se usó una antigua clave literal en datos existentes, este cambio NO los migra. Antes del despliegue se necesita comprobar claves efectivas y compatibilidad con copia de respaldo; no intentar una migración automática ni imprimir claves.

La ausencia de una clave rechaza escritura/lectura sensible con error de configuración. Un reporte de invitados no debe convertir ese fallo en “cero eventos”. El comportamiento genérico ante otros errores de almacenamiento se conserva y requiere una revisión separada de observabilidad.

Readiness devuelve503 genérico ante configuración de claves inválida. En producción también exige el contrato explícito de ingreso; no se considera listo un despliegue que perdería silenciosamente su identidad de red. Esta condición no equivale a verificar la topología. Autenticación, rol, empresa y proyecto conservan su autoridad independiente.

No se afirma que todos los metadatos del ERP estén cifrados: este bloque elimina claves de respaldo y conserva el cifrado existente; no rediseña el almacenamiento.

## Evidencia de esta revisión

- Regresión local:91/91 pruebas en13archivos, JOB_20261030_235409_0100, exit0. Incluye autenticación/revocación, permisos de invitados, documentos y cargas privadas, límites de cuerpos, formularios/referencias, token del guard y fundación nueva.
- Último ajuste de readiness:19/19 pruebas afectadas de fundación/backend, exit0. No se suman esos19 a los91 como cobertura distinta.
- Lint de módulos modificados:0errores; una advertencia previa por chUa sin uso en guest-security-log.ts. diff --check pasó.
- HTTP real local3102: Home200 con marca y canvas en SSR; readiness200; guard modeobserve; flujo público del logo200; sesión privada sin cuenta401; petición CLI con Host/forwardedloopback falsificados403.
- El logo transfiere1,850,832bytes en el flujo actual; candidato de B2, no optimizado en B1.
- Configuración local comprobada solo por booleanos: clave de sesión/solicitudes/logs válida, contrato de ingreso sin activar. Ningún valor secreto se imprimió.
- Instancia local reiniciada en observe, JOB_20261030_235535_7800. No se habilitó enforcement nuevo ni se cambiaron ajustes de Railway.
- El control CUA del navegador no estuvo disponible (browser.user unavailable). La evidencia HTTP no certifica un nuevo pase visual ni el dibujo del canvas en un dispositivo físico.
- No se vuelve a acreditar el empaquetado de producción: el último build del piloto generó37páginas y agotó300s en trazas. Ese trabajo permanece en B5.

## Línea de referencia para B2

[JSON medido](verification/security-foundation-baseline.json), generado por scripts/benchmark-automation-guard.mts sobre el árbol local completo del piloto. No es una medición de HTTP, de página completa, de producción ni de Core Web Vitals.

Node24.14.1/Windows, visitante existente sin incidente;20warmups por ronda y secuencia off/observe/off/observe,100muestras por ronda:
- off:200muestras,p50=0.002ms,p95=0.003ms,máximo0.072ms.
- observe:200muestras,p50=2.809ms,p95=4.879ms,máximo12.126ms.

Es una línea de referencia del guard síncrono, con acceso a SQLite en la ruta con cookie. No acredita que toda la página cumpla el presupuesto de10ms ni que el problema de consultas por recurso esté resuelto.

## Condiciones antes de producción

Verificar el ingreso real y su aislamiento antes de configurar la confianza; comprobar readiness y compatibilidad del cifrado sin cambiar claves; conservar pruebas negativas de datos privados; revisar cachés y rate limiting para desconocidos; resolver empaquetado y revisión visual; desplegar solo con autorización del destino. La reversión de la nueva detección no puede restaurar claves predeterminadas ni exenciones por cabeceras falsas.
