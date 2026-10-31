# SG rev1 — Seguridad, rendimiento y experiencia de Tayco

Fecha: 2026-10-30. Propósito: que un visitante pueda explorar proyectos y solicitar un estimado con fluidez, manteniendo autorización estricta sobre datos y operaciones privadas. Diagramas manuales; este archivo es la fuente editable de esta vista. Es un diseño revisable, no evidencia de implementación ni una certificación de producción.

La solicitud de estimado conserva el formulario y las referencias seleccionadas; no se restablece un cálculo público de precios. La nota histórica sobre calculadora en product-flows.md no describe esta revisión.

El progreso corresponde al ledger25660. La evidencia del piloto corresponde al bloque25656. Se extienden los contratos [FA, FS y FE](product-flows.md) y el [mapa administrativo](admin-product-flow-map.md); no se redefine la autoridad de cuentas, proyectos o documentos.

## 1. Actores, límites e invariantes

- Visitante: navegación pública, galería, referencias visuales y envío de solicitud. Un envío nunca concede acceso privado.
- Usuario autenticado: operaciones únicamente dentro de su rol, empresa, proyecto y recurso permitido.
- Administrador: revisión de incidentes, autorizaciones acotadas de investigación y revocación.
- Investigador autorizado: excepción temporal al módulo de abuso; conserva los permisos normales de cuenta.
- Bot o cliente desconocido: señales no confiables. Una señal débil no demuestra abuso.
- Operador: configuración, secretos, reversión y recuperación, por interfaces administrativas verificadas.

Invariantes no negociables:
1. Ninguna puntuación de riesgo, cookie de navegación o token de investigación concede permisos sobre datos privados.
2. Sin sesión/permisos válidos o con su estado incierto, las operaciones privadas no revelan datos.
3. Un fallo de infraestructura no incrementa reintentos sospechosos.
4. Lo ya enviado al navegador puede inspeccionarse; no se promete ocultar JavaScript ni imágenes públicas.
5. Los secretos y documentos privados no entran en cachés públicas, URLs ni registros de tokens.
6. Un fallo de telemetría no interrumpe navegación pública. Auditoría obligatoria de cambios críticos sigue la política transaccional de la operación.
7. Un token cuyo estado de revocación no pueda comprobarse no autoriza una nueva excepción.
8. El interruptor de reversión del detector no desactiva autenticación, permisos, validación, protección de origen ni límites básicos.

## 2. Estado actual frente a propuesta

Actual inspeccionado: el piloto abre SQLite para consultar/actualizar estado; el frontend hace comprobaciones por ruta. Detecta señales limitadas, muestra aviso y cuenta recargas después de un incidente. No hay recuperación humana integrada, proveedor de desafío ni protección nueva en el perímetro. El filtro anterior mantiene reglas independientes por IP/UA. La transformación XOR de imágenes es ofuscación reversible.

~~~mermaid
flowchart TB
  subgraph ACTUAL["Actual · piloto local"]
    A0["Solicitud"] --> A1["Guard y estado SQLite síncrono"]
    A1 --> A2["Filtro anterior por IP y UA"]
    A2 --> A3["Página o API"]
    A3 --> A4["Comprobación del navegador"]
    A4 --> A5["Aviso → reintentos → bloqueo"]
    A5 --> A6["Token temporal o reinicio de laboratorio"]
  end
  subgraph PROP["Propuesto · pendiente de implementar"]
    P0["SG01 Entrada y proxy confiable"] --> P1["SG02 Límites baratos en el perímetro"]
    P1 --> P2{"SG03 Tipo de operación"}
    P2 -->|Pública cacheable| P3["SG04 Ruta rápida sin BD del guard"]
    P2 -->|Formulario o lectura dinámica| P4["SG05 Evaluación adaptativa"]
    P2 -->|Privada| P5["SG06 Sesión y permisos actuales"]
    P5 -->|Permitido| P4
    P5 -->|Denegado o incierto| P6["401 / 403 / 503 sin datos privados"]
    P4 --> P7{"Riesgo y estado disponibles"}
    P7 -->|Bajo| P8["SG08 Validar y ejecutar"]
    P7 -->|Sospecha suficiente| P9["SG07 Desafío accesible"]
    P7 -->|Abuso confirmado o límite| P10["SG09 Rechazo temporal acotado"]
    P9 -->|Verificado| P8
    P9 -->|3 reintentos confirmados y persiste| P10
    P9 -->|Proveedor falla| P11["SG11 Conservar formulario y ofrecer recuperación"]
    P3 -.-> P12["SG12 Métricas acotadas fuera del camino crítico"]
    P8 -.-> P12
    P10 -.-> P12
    P12 --> P13["SG13 Revisión humana de reglas y métricas"]
    P13 --> P14["SG14 Volver a observación si hay regresión"]
    P14 -.-> P4
  end
~~~

Los archivos públicos pueden entregarse desde caché tras controles baratos del perímetro. Esa ruta no promete confidencialidad. Si una política requiere negar un cliente conocido, se aplica antes de la entrega desde caché con alcance/TTL explícitos. Los límites del perímetro son propuestos: no se presupone Cloudflare ni un plan de Railway concreto.

## 3. Estados del módulo de riesgo

~~~mermaid
stateDiagram-v2
  [*] --> Normal
  Normal --> Observacion: SG05 señal débil
  Observacion --> Normal: señales se disipan
  Observacion --> Verificacion: señales suficientes según regla versionada
  Verificacion --> Normal: desafío válido
  Verificacion --> Verificacion: intento confirmado 1 a 3
  Verificacion --> BloqueoTemporal: cuarto intento confirmado y persiste la regla
  BloqueoTemporal --> Normal: vence penalización
  Verificacion --> Recuperacion: fallo del proveedor o posible falso positivo
  Recuperacion --> Verificacion: servicio recuperado y usuario reintenta
  Recuperacion --> Normal: revisión válida
  Verificacion --> Investigacion: SG10 token válido y no revocado
  BloqueoTemporal --> Investigacion: SG10 token válido y no revocado
  Investigacion --> Verificacion: vence o se revoca excepción con incidente vigente
  Investigacion --> Normal: vence excepción sin incidente vigente
~~~

- Tres reintentos son una tolerancia máxima para el mismo incidente, no tres recursos descargados.
- Cada intento tiene un ID idempotente ligado a sesión/incidente. Doble clic, reenvío de red, remontaje de React, pestaña duplicada o precarga no crean intentos nuevos.
- Recargar no borra el estado; por sí sola no constituye prueba de abuso. Este contrato revisa el piloto que contaba cada documento tras una detección.
- Las señales tienen caducidad y causa registrada. La ausencia de movimientos de ratón, abrir DevTools o una resolución de pantalla nunca bastan para denegar.
- Verificación, excepción de investigación y autenticación de cuenta son estados independientes.
- La recuperación no concede acceso privado. Proveedor/flujo accesible y mecanismo humano siguen por seleccionar e implementar.

## 4. Secuencia crítica: formulario sin pérdida ni duplicados

~~~mermaid
sequenceDiagram
  actor V as Visitante
  participant U as Formulario
  participant E as Perímetro
  participant R as Riesgo
  participant A as API de solicitud
  participant D as BD y outbox
  V->>U: Completa campos y selecciona referencias
  Note over U: Campos personales en memoria de la pestaña
  U->>E: SG08 Enviar con clave estable de intención
  E->>E: SG02 Límites de frecuencia y tamaño
  E->>R: SG05 Comprobación necesaria con plazo acotado
  alt Riesgo bajo o desafío válido
    R-->>E: Continuar, sin conceder identidad privada
    E->>A: Solicitud original
    A->>A: Origen, esquema y referencias permitidas
    A->>D: Transacción idempotente: guardar y crear outbox
    D-->>A: SG08 Referencia durable
    A-->>U: Confirmación de guardado, no de entrega externa
  else Desafío necesario
    R-->>U: SG07 Verificación manteniendo campos
    V->>U: Completa verificación o cancela
    U->>E: Reintentar misma intención tras verificación
  else Servicio de riesgo o verificación no disponible
    R-->>U: SG11 Error recuperable, sin penalización
    Note over U: Conservar campos; reintento explícito; no envío automático
  end
  opt Se pierde respuesta después de guardar
    U->>A: SG08 Reintento con la MISMA clave
    A->>D: Consultar resultado de la intención
    D-->>U: Mismo resultado, sin segunda solicitud
  end
~~~

No se muestra “enviado” sin recibo durable. Ante timeout el resultado puede ser incierto; detener la espera no deshace un commit. No se crean consultas públicas por email para recuperar recibos. Cancelar un desafío conserva el formulario en la pestaña. No se guardan datos personales automáticamente en localStorage; las referencias públicas pueden mantener su persistencia actual.

## 5. Contratos y autoridad por transición

| ID | Contrato y autoridad | Efecto y límite |
|---|---|---|
| SG01 | Operador configura origen HTTPS y proxy/hops confiables | IP desconocida queda desconocida; nunca se sustituye por localhost para obtener exenciones |
| SG02 | Perímetro aplica límites baratos por ruta, contexto y presupuesto | 429 y Retry-After; ninguna aprobación privada ni carga costosa antes de validar tamaños |
| SG03 | Servidor clasifica ruta/método/dato | Cabeceras aportadas por el cliente no convierten un recurso privado en público |
| SG04 | Solo contenido explícitamente público y sin personalización privada | Caché pública; 0 consultas síncronas al almacén del guard por recurso; ninguna promesa de secreto |
| SG05 | Regla de riesgo versionada; estado compartido solo cuando se necesita | Señal débil observa; sospecha suficiente solicita verificación; no usar puntajes como credenciales |
| SG06 | Auth existente FA03–FA06 comprueba sesión, rol y alcance | 401 sin sesión;403 sin permiso;503 si autoridad indisponible; no datos privados |
| SG07 | Proveedor/servicio valida desafío en servidor | Ticket corto de navegación, no rol privado; ID de intento evita dobles penalizaciones |
| SG08 | API conserva FS03/FS04 y FE01–FE03, revalida SG06 tras esperas/IO cuando el recurso es privado, valida y transacciona | Intención estable, referencias canónicas, recibo durable; reintento no duplica efectos |
| SG09 | Regla suficientemente fundada y contador autorizado por servidor | Bloqueo con causa, alcance, vencimiento y recuperación; nunca penalización global por un cliente |
| SG10 | Admin actual autoriza propósito, navegador/origen y duración | Canje único, cookie HttpOnly/Secure/Strict, revocación en autoridad; no bypass de SG06 |
| SG11 | Operador y política de fallos determinan degradación | Público básico disponible; mutaciones o accesos privados inciertos no ejecutan; campos conservados |
| SG12 | Telemetría acotada y auditoría crítica diferenciadas | Sin tokens, contraseñas ni campos personales; retención y colas limitadas |
| SG13 | Operador publica regla tras comparación y revisión humana | Cambios de umbral versionados, nunca aprendizaje que amplía permisos solo |
| SG14 | Operador revierte solo la capa de riesgo a observación | Auth, permisos, límites de cuerpos/origen e idempotencia siguen activos |

La investigación necesita comprobar revocación en línea al conceder una excepción; no se cachea una autorización que deba revocarse inmediatamente. La ruta pública rápida no depende de esa comprobación. El diseño no modifica todavía las reglas del filtro anterior.

## 6. VMOF Fast: revisión manual /20

Tipo META: proteger la conversión y datos de Tayco sin degradar lectura, galerías ni formulario. Estado: resistencia potencial, con un posible cuello si cada recurso espera al guard.

R1: un falso positivo puede bloquear una solicitud legítima. R2: SQLite/proveedor central en cada petición puede ser cuello. R3: sondeos y transformaciones que no aportan protección consumen CPU. R4: recargas y timeouts pueden crear un bucle de penalización. R5: ocultar código público no satisface confidencialidad privada. R6: proveedor de desafío, perímetro y almacenamiento compartido requieren capacidades verificadas.

GENESIS consultado: arquitectura Zero Trust, cascadas de recuperación/idempotencia y circuit breakers. Se usan como referencias de diseño, no como prueba del despliegue.

Escala 1–5 por dimensión: I impacto sobre propósito, F factibilidad en el proyecto, Flow continuidad/desbloqueo, HΦ integración entre seguridad/UX/operación. Son juicios relativos; NO porcentajes de seguridad, benchmarks ni aprobación del usuario.

| Alternativa | I | F | Flow | HΦ | /20 | Juicio |
|---|---:|---:|---:|---:|---:|---|
| A Más detección y popups en cliente | 2 | 5 | 1 | 1 | 9 | Poca autoridad real y más interrupciones |
| B Consultar/bloquear globalmente desde BD por solicitud | 4 | 3 | 2 | 2 | 11 | Introduce una dependencia general y costo repetido |
| C Ruta pública rápida y controles adaptativos con auth independiente | 4 | 3 | 5 | 5 | 17 | Arquitectura objetivo propuesta |
| D Guard en observación y refuerzo gradual de controles existentes | 3 | 5 | 4 | 4 | 16 | Primera etapa propuesta y control de comparación |

C y D están cerca: datos de abuso/latencia pueden justificar permanecer en D. La seguridad de datos y la revocación son condiciones mínimas: un puntaje alto de UX no compensa una violación de permisos.

Procedencia del motor: evaluate modeB rechazó cuatro dimensiones porque el runtime exige cinco; se preserva la matriz Fast manual sin inventar ROI. apply devolvió applied=false por alerta de fricción del harness. Por tanto NO hay aplicación automática registrada ni certificación del motor. Esta revisión conserva la recomendación para revisión humana, sin cambiar métricas ni reintentar ese gate.

Primer paso propuesto: medir la línea base local y completar SG01/SG06 (IP/secretos/permisos) con guard en observación. Introducir más complejidad solo si la evidencia aporta valor.

## 7. Aerospace: detectar, aislar y recuperar

| Fallo o condición latente | Detección | Aislamiento | Recuperación y UX | Prueba exigida |
|---|---|---|---|---|
| IP/cabeceras de proxy incorrectas | Comparar origen/hops con topología verificada | Ninguna exención localhost basada en cabecera externa | Identidad desconocida y límites conservadores | Cabeceras manipuladas no obtienen exención |
| Almacén de riesgo lento o caído | Deadline y circuit breaker por módulo | No bloquear caché pública ni usar permisos privados en caché obsoleta | Información pública básica disponible; acciones pendientes devuelven503 sin efectos | Inyectar timeout y pérdida del servicio por ruta |
| Auth o almacén de revocación no disponible | Comprobación autoritativa falla | Denegar acceso privado y nuevas excepciones | Mensaje recuperable; ningún dato ni éxito falso | Sesión/bypass no se aceptan sin validación |
| Proveedor de desafío caído | Timeout/error de proveedor, separado de intento inválido | No sumar penalizaciones ni bloquear el sitio entero | Conservar formulario; revisión accesible y reintento explícito | Proveedor falla antes/durante/después del desafío |
| Falso positivo en móvil o accesibilidad | Revisión de incidentes y pruebas con personas/automatización conocida | Ajustar regla y solo el incidente afectado | Volver al mismo punto, campos y foco | Teclado, lector, rotación, red lenta y pestaña duplicada |
| Doble clic, replay o carrera entre réplicas | ID estable y transacción atómica | Un intento/efecto por clave | Mismo recibo o rechazo coherente | Dos clientes concurrentes; canje de token una sola vez |
| Token robado, vencido o revocado | Estado, caducidad, vinculación y rate limit | No autorizar otros navegadores/orígenes ni datos privados | Invalidar excepción sin suspender la cuenta automáticamente | Expiry/replay/revoke + privado401/403 |
| Spam o saturación del propio guard | Cuotas en perímetro, CPU/latencia/tamaño del almacén | Rechazo barato antes de crear filas o locks | 429; cuotas por contexto; no agotar cupo global de visitantes | Ráfagas con cookies nuevas y muchas conexiones |
| Commit hecho y respuesta perdida | Clave de intención y recibo durable | No repetir efecto con clave nueva | Reintentar explícitamente misma intención | Cortar respuesta tras commit y comprobar una sola fila |
| Logs llenos o telemetría caída | Tamaño de cola, descarte y almacenamiento | Telemetría pública no bloquea; auditoría crítica conserva su contrato | Muestreo/descarte controlado sin secretos; alerta operativa | Cola llena, disco sin espacio y envío fallido |
| Regla nueva degrada UX | Comparación con control y métricas por versión | Desactivar solo regla/ruta afectada | SG14 volver a observación | Rollback ejercido manteniendo401/403 privados |

Capas aplicadas: preflight (configuración, permisos y cuerpos); operación (límites, deadlines y cachés separadas); emergencia (degradación por ruta y formulario conservado); registro (eventos mínimos/versiones/latencias); mejora (ajuste humano con evidencia). No se añade ML, TMR ni una migración de lenguaje como requisito del piloto.

## 8. Rendimiento: presupuestos propuestos, no resultados

| Medida | Presupuesto inicial para validar | Método |
|---|---|---|
| Costo del guard en ruta pública normal | p95 añadido <=10ms dentro del servidor;0 consultas síncronas al almacén del guard por recurso estático | Misma versión/hardware, control vs candidato, caché fría/caliente, al menos200 muestras por caso |
| Trabajo del navegador | Ningún escaneo DOM periódico;0 validaciones por imagen;ningún script de desafío bloquea el primer render normal | Perfil CPU/red/memoria; comparar bundle y tareas largas |
| Señales opcionales | Fuera del render crítico, deduplicadas, cola y tamaño limitados | Desconectar telemetría y verificar navegación idéntica |
| Experiencia de carga e interacción | LCP<=2.5s;INP<=200ms;CLS<=0.1 al p75 separado móvil/escritorio | Medición de campo; laboratorio sirve para regresión y no sustituye INP real |
| Formulario | Mismos campos y referencias después de desafío/error;0 duplicados;sin envío automático al recuperar | Flujo E2E con cortes de red y doble clic |
| Datos y autoridad | 0 accesos privados cruzados en la matriz de prueba | Casos negativos por rol/empresa/proyecto/recurso y token |
| Falsos positivos | 0 rechazos incorrectos en escenarios legítimos de aceptación; tasa real por medir en observación | Muestras etiquetadas con revisión humana, no solo score del detector |
| Recuperación | Vencimiento, tiempo de espera y Retry-After explícitos; bloqueo inicial15min revisable | Reloj controlado, error real y prueba de reversión |

Los umbrales Web Vitals proceden de [web.dev](https://web.dev/articles/vitals). Los demás son presupuestos internos provisionales; faltan línea base y capacidad del entorno. No se ha medido que Tayco los cumpla.

## 9. Superficies y paridad

| IDs | Superficie | Contrato y evidencia |
|---|---|---|
| SG04/07/11 | GUI/UX pública, requerida | Navegar sin modal en caso normal; verificación accesible y conservar campos. El piloto verificó solo aviso/reintentos/token/reset y tamaños390x844/844x390; nueva recuperación pendiente |
| SG05/07/10 | API, existente parcial | /api/automation-guard: estado, bootstrap, exchange, issue/revoke/events. Token/counter local probado en25656. Contratos adaptativos e idempotencia de intento propuestos |
| SG06/08 | API, existente | Reusar auth, /api/estimate y APIs privadas. Pruebas previas acotadas no certifican todos los roles/rutas; revisar casos afectados |
| SG10/13/14 | GUI admin, planificada | Revisar incidente, emitir/revocar excepción y regla versionada; interfaz aún no implementada |
| SG01/13/14 | CLI/operación, planificada | Configurar, observar, revertir y diagnosticar sin imprimir secretos. No inventar comandos que aún no existen |
| SG10/12 | MCP, no expuesto en esta revisión | Herramientas de navegador usan las mismas sesiones y autoridad que HTTP; no se crea endpoint MCP público ni bypass del host |
| Todos | UX, requerida | Persona reconoce espera/error/éxito y puede cancelar/reintentar; revisar con Randolf en teléfono, tablet y escritorio |

Stack de esta revisión: documentación de una capa sobre Next/TypeScript existente y sus contratos de auth; no implementa un nuevo vault/algoritmo ni decide migraciones de lenguaje. SQLite es evidencia local de persistencia, no una elección acreditada para réplicas independientes. No hay IA nueva en las decisiones de acceso.

## 10. Evidencia, contraste y secuencia de entrega propuesta

Verificado previamente y con alcance local:24 pruebas; aviso inicial,3reintentos/cuarto429,canje temporal y reset en navegador; límites de token y ausencia de acceso privado por ese token. Evidencia y capturas en ledger25656; no se vuelve a certificar su runtime en esta revisión documental.

Divergencias intencionales de este diseño: señal débil pasa a observación; reintentos pasan a ID idempotente; ruta pública se separa del almacén del guard; hay recuperación humana/accesible; logging/perímetro adquieren presupuestos. Nada de ello está implementado por dibujarlo.

Secuencia sugerida para convertir SG en bloques de implementación, sin estado de progreso duplicado:
1. Línea base y aislamiento de secretos/IP/permisos (SG01/02/06), guard en observación.
2. Ruta pública rápida, cuotas y telemetría acotada (SG03/04/05/12).
3. Desafío, formulario y recuperación idempotentes (SG07/08/09/11).
4. Operación administrativa de excepciones y reversión (SG10/13/14).
5. Inyectar fallos, validar matriz por roles/dispositivos y resolver empaquetado final antes de considerar canary.

Cada bloque requiere un caso sano, uno adverso y su recuperación. Los8estados Aerospace (reparado/optimizado/documentado/probado/ejecutado/supervisado/asegurado/estadofinal) se aplicarán al alcance implementado con artefactos propios. Esta revisión solo entrega documentación y análisis; no marca los ocho como cumplidos.

Despliegue propuesto: local → entorno de prueba → observación → enforcement acotado a rutas/reglas verificadas → ampliar solo con métricas y revisión humana. La reversión vuelve únicamente el módulo nuevo de riesgo a observación. No hay despliegue autorizado por este documento ni cambios de código runtime en esta tarea.

## Implementación local posterior

Bloques25663..25667: consultar docs/security-verification.md y los recibos en docs/verification/. Los diagramas anteriores describen la arquitectura objetivo; la entrega local no certifica proveedor, ingresoRailway, UXde campo, ni vulnerabilidades de dependencias. La recuperación humana normal se implementó separada de los tokens de investigación.
