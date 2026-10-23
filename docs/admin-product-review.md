# Revisión del producto administrativo · 2026-10-23

## Juicio y alcance

La administración sirve para mantener registros, revisar fuentes, coordinar trabajo y detectar próximos pasos. La integración entre procesos todavía es parcial: hay capacidades útiles y controles reales, pero el operador debe reconstruir contexto y trasladar datos entre varios módulos. Su utilidad como registro interno está mejor respaldada que su capacidad como sistema integral de gestión del negocio.

Revisión acotada a ExecutiveConsole, DCC, BusinessOverview, FinancialDashboard, OperationsModules, CorporateAgenda y navegación del portal; se consultaron contratos ERP relacionados. Complementa [los contratos existentes](product-flows.md) y [el mapa completo de administración](admin-product-flow-map.md); distingue sus aristas de fuente de las transiciones realmente observadas. No se realizaron entrevistas, medición de productividad ni una auditoría completa de infraestructura. No se asigna puntuación global, nivel L3 ni una calificación sobre diez.

### Qué significa la evidencia

| Marca | Alcance |
| --- | --- |
| **S — fuente** | Mecanismo o ausencia observados en el código revisado. Una arista de código no demuestra que un usuario complete el flujo. |
| **R — runtime local** | Caso realmente ejercido contra una compilación de producción local, con base y cuentas sintéticas aisladas. No significa despliegue de producción. |
| **D — documentado** | Recibo o procedimiento de otra verificación conservado en el repositorio; no repetido en esta revisión. |
| **U — sin verificar** | No existe evidencia suficiente en este alcance. No equivale automáticamente a fallo. |

**R:** la suite financiera final pasó diez grupos en `JOB_20261023_124534_3700`: fuentes fechadas, traspaso del mes, planes y cancelación, deduplicación, propuestas ponderadas, conflicto de versión, cierre con evidencia, límites de roles, prioridades/atrasos, detalle semanal y seis tamaños con teclado/tacto emulado. Su reporte tiene cero errores de navegador y cero desbordamiento de página en ambos paneles. La conciliación semanal ejercida fue un recibo sintético de 2505 centavos en la semana del 7 al 13 de septiembre. Nueve pruebas del modelo de agenda pasaron en `ac101eed-0a8a-4c2f-8f2a-01dac3cdd34d`.

El reporte privado está en `.data/certification/financial-dashboard-final-1792759532124/runtime-report.json`. [Verification](verification.md#interactive-client-dashboard-and-reusable-projects--2026-10-23) conserva los recibos adicionales. Los conteos prueban esos casos; no prueban todos los estados, la productividad del administrador, accesibilidad completa ni continuidad en el destino real.

## Hallazgos que afectan el trabajo

| Hallazgo | Evidencia y consecuencia | Corrección y comprobación útil |
| --- | --- | --- |
| **F1. KPI comercial sin su conjunto de origen** | **S:** [BusinessOverview:21](../components/workspace/BusinessOverview.tsx#L21) presenta propuestas aceptadas del mes; [su clic:27](../components/workspace/BusinessOverview.tsx#L27) transmite solo la vista. [OperationsModules:37](../components/workspace/OperationsModules.tsx#L37) filtra propuestas por estado, sin recibir el periodo. Pulsar una cifra mensual abre un registro más amplio que esa cifra. | Transportar mes, estado y proyecto al destino. Probar que el conjunto abierto reconcilia con la cifra pulsada, con registros de otros meses y estados como controles negativos. |
| **F2. La agenda pierde la identidad del registro al navegar** | **S:** [DCC:33](../components/workspace/DashboardCommandCenter.tsx#L33) descarta `recordId` al abrir vista/proyecto. [CorporateAgenda:56](../components/workspace/CorporateAgenda.tsx#L56) ya identifica cada tarjeta mediante `data-agenda-id`, pero no recibe un objetivo. En una lista grande el operador vuelve a buscar el elemento. No se encontró un destino inaccesible: el problema es localizarlo y conservar el contexto. | Navegación a un registro identificable, con foco o resaltado y retorno al filtro de origen. Probar dos registros de título parecido y fechas distintas, además de un destino ya inaccesible por cambio de permisos. |
| **F3. Traspaso comercial manual** | **S:** [CommercialRequests:39](../components/workspace/CommercialRequests.tsx#L39) edita estado/datos; [ERP:253](../lib/erp.ts#L253) exige un proyecto previo para crear propuesta y no conserva `leadId`. [ERP:267](../lib/erp.ts#L267) registra la decisión en la propuesta. Solicitud, alcance aceptado y proyecto requieren relación manual. La aceptación no debe inventar una factura ni una aprobación presupuestaria. | Añadir un traspaso guiado y explícito, con referencias de origen y confirmación humana de los datos que pasan al proyecto. Probar reintento, rechazo, revisión del alcance y ausencia de efectos contables implícitos. Es una brecha de capacidad para un CRM completo, no una transacción rota demostrada. |
| **F4. Varias superficies financieras y periodos independientes** | **S:** [ExecutiveConsole:56–57](../components/workspace/ExecutiveConsole.tsx#L56) monta DCC y BusinessOverview; la barra lateral ofrece Financial dashboard y Financial overview. [BusinessOverview:14](../components/workspace/BusinessOverview.tsx#L14) y [FinancialDashboard:24](../components/workspace/FinancialDashboard.tsx#L24) conservan meses locales. Cambiar el mes del informe inferior no cambia el contexto del superior. [Portal:222](../app/portal/PortalClient.tsx#L222) mantiene módulo/proyecto en estado local; recargar reinicia ese contexto. | Definir un punto de entrada financiero principal y una ruta clara hacia fuentes y planificación. Mantener o restaurar el periodo al volver de una corrección. Validar con tareas concretas; no asumir que menos tarjetas mejora por sí solo la productividad. |
| **F5. Nombres que sugieren una conexión no disponible** | **S:** [OperationsModules:124](../components/workspace/OperationsModules.tsx#L124) titula el registro “QuickBooks & purchase orders”; [ERP:187](../lib/erp.ts#L187) declara contabilidad/Takeoff sin configurar. La ayuda sí explica límites, pero el encabezado principal induce otra expectativa. | Nombrar la capacidad disponible —registro de órdenes— y mostrar el estado de conexión donde afecta una decisión. Una conexión futura necesita contrato, mapeos y recibos reales; cambiar la etiqueta no implementa integración. |

**F6. Encabezado público dentro del espacio privado — corregido y verificado en su alcance.** Las capturas anteriores mostraban navegación comercial además de la administrativa. La nueva [SiteFrame:7](../components/SiteFrame.tsx#L7), integrada en [layout:25](../app/layout.tsx#L25), monta Navbar/footer solo en páginas comerciales conocidas; las rutas privadas y de error conservan un shell enfocado. Se retiró la compensación superior y el sidebar comienza en cero. **R:** build `h_xlMVeTRUaefu04rKTke`, build `JOB_20261023_131823_7900` y lint `JOB_20261023_131826_6700` aprobados; la suite `JOB_20261023_132628_8900` pasó cinco grupos: DOM sin JavaScript en tres rutas privadas y tres 404 anidados, siete páginas públicas, siete transiciones cliente en el mismo documento, 132 navegaciones en seis tamaños, seis Refresh GET y 36 observaciones de cuenta/login por rol y diseño. `runtimeErrors: []`, `mutationAttempts: []`. El defecto SSR404 de la primera política por prefijos fue reproducido y corregido con la lista de páginas públicas conocidas. [Verification](verification.md#administration-shell-and-product-flow-review--2026-10-23) conserva recibos, hashes y límites. Root recorrió los 22 módulos con Daedalus y repitió un smoke del build final en portal privado y móvil, con Escape y devolución de foco. No se ejercieron logout ni mutaciones de cuenta en esta suite de solo lectura; no se ocultan controles públicos mediante CSS ni se presenta SiteFrame como autorización.

## VMOF Fast aplicado

1. **Clasificación y disposición.** Decisión de producto y continuidad del trabajo administrativo. Hay evidencia para elegir un siguiente bloque acotado; no hay mediciones para puntuar energía, ROI, rapidez de uso o satisfacción.
2. **Flow Quick.** Flujo principal: detectar asunto → abrir fuente exacta → decidir/corregir → confirmar → volver al contexto. Está en **RESISTENCIA** por F1/F2/F4; el reingreso manual de datos crea un **CUELLO** entre solicitudes y proyectos (F3). Añadir resúmenes sin resolver esos pasos puede producir **FUGA** de atención. No se afirma que el sistema entero esté ROTO.
3. **GENESIS Quick.** La consulta `flow dashboard workflow integration` recuperó `NEURONA_20260719_105803_A_QA_TOOL'S_VALUE_IS_REALIZED_ONLY_WHEN_WIRED_INTO_THE_WORKFLOW_THAT_CONSUMES_IT_—_UNUSED_=_FUGA`. Orienta a revisar el consumidor del resultado; no sustituye la evidencia del producto.
4. **Matriz compacta cualitativa.** Se comparan impacto, factibilidad y desbloqueo sin fabricar un total numérico:

| Opción | Qué desbloquea | Coste o límite observable | Decisión |
| --- | --- | --- | --- |
| Contexto y traspasos enfocados | Conecta indicadores, registros, decisiones y retorno; conserva referencias comerciales | Exige contratos y pruebas entre módulos, con alcance controlable | **Primera opción** |
| Rediseño grande | Podría unificar jerarquía e interacción | Más superficies y regresiones antes de validar las tareas más costosas | Posponer hasta observar esas tareas |
| Más gráficos | Amplía representación de datos ya disponibles | No corrige búsqueda, reingreso ni destinos demasiado amplios | No priorizar ahora |
| Solo encabezado | Reduce navegación duplicada y espacio inicial | No resuelve F1–F5 | Completar el ajuste solicitado; insuficiente como siguiente estrategia integral |

5. **Bloqueadores.** Falta evidencia de uso real y del destino operativo; las conexiones externas siguen pendientes. Esto limita afirmaciones de utilidad/continuidad, no impide diseñar el siguiente contrato.
6. **Primer paso.** Antes de otro bloque visual, demostrar un recorrido indicador mensual → registro exacto → edición con conflicto → regreso al mismo periodo. Luego cerrar un traspaso solicitud → propuesta/proyecto con procedencia explícita.
7. **Aprendizaje.** La unidad útil de integración es el contexto de una decisión y su efecto confirmado, no el número de módulos visibles.

**Cascadas relevantes:** pérdida de periodo/identidad → búsqueda manual → mayor posibilidad de revisar otro registro; reingreso comercial → divergencia de cliente/alcance/importe → presupuestos y reportes que no reconcilian; promesa de conexión → dependencia de un intercambio inexistente. Son riesgos razonados a partir de **S**, no frecuencias de error medidas.

## Aerospace proporcionado al riesgo administrativo

Se protegen integridad, autorización y continuidad de registros. No se propone redundancia aeronáutica ni automatización financiera para un registro interno.

| Capa | Protección observada | Límite y comprobación necesaria |
| --- | --- | --- |
| **A. Preflight** | **S/R:** permisos, fechas/importes, versiones, claves de idempotencia y rechazo de acciones externas en los casos ejercidos | Completar contratos de contexto de F1–F3. Los controles de UI no reemplazan la autorización del servidor. |
| **B. En operación** | **R:** actualización explícita, borradores conservados ante versión nueva; **D:** el journal retiene una solicitud incierta y limita otras escrituras | No se demostró disponibilidad sostenida ni escalado. Ejercitar contención de escritura, disco lleno y pérdida del volumen en un entorno aprobado; no duplicar una instancia sobre almacenamiento inadecuado. |
| **C. Emergencia y recuperación** | **R:** conflicto exige cargar valores actuales; **D:** replay de clave/cuerpo y restauración sintética documentados | [Data operations](data-operations.md#backup-and-restore) exige restauración aislada y volumen persistente. Recargar/cerrar toda la página queda fuera del journal en memoria; verificar recuperación operativa sin inventar una segunda transacción. |
| **D. Black box** | **S/R:** referencias, historial, evidencia y reportes de pruebas; **D:** auditoría y recibos operativos documentados | La auditoría local no es una copia independiente del dato. Verificar conservación y acceso a recibos después de un fallo del host o restauración. |
| **E. Aprendizaje controlado** | Las regresiones añadidas convierten fallos observados en casos repetibles | Recoger tareas fallidas y correcciones del administrador antes de automatizar. No inferir ML, mejora autónoma ni aprobación de importes a partir de pruebas que pasan. |

**Fallo común:** autenticación, ERP, auditoría y deduplicación locales dependen del almacenamiento del host. Varios controles sobre SQLite no constituyen varias capas de disponibilidad independientes. Una pérdida de disco/volumen o un bloqueo puede afectar simultáneamente la escritura y sus recibos. El respaldo SQLite tampoco conserva por sí solo los objetos Blob ni todos los journals/configuraciones: la recuperación debe cubrir el conjunto señalado en [Data operations](data-operations.md). Hay evidencia local de mecanismos; su recuperación en el destino real sigue **U** en esta revisión.

## Ocho dimensiones del perfil web

Referencia leída: [web-profiles.yaml](../../../STANDARDS/web-profiles.yaml), `meta.version: 1.4.0`. Se usan sus criterios para distinguir evidencia y brechas; no se completó su checklist heredada por niveles y no corresponde calcular el mínimo global. Los mecanismos específicos de PostgreSQL/Redis no se acreditan ni se exigen ciegamente a SQLite: su aplicabilidad requiere justificar el equivalente.

| Dimensión | Estado cualitativo en este alcance | Evidencia y brecha |
| --- | --- | --- |
| Security | **Parcial, local** | **R:** denegación por roles y aislamiento de fixture; **S:** autorización/validación. Revisión completa de controles, MFA, suministro de secretos y destino real: **U** aquí. No se certifica ausencia global de vulnerabilidades. |
| UX design | **Funcional con resistencia de integración** | **R:** controles, recuperación de borrador y recorridos definidos. F1–F6 afectan continuidad, jerarquía y correspondencia entre indicador y resultado. Productividad y aceptación del administrador: **U**. |
| Accessibility | **Parcialmente ejercida** | **R:** teclado, estados accesibles y tacto emulado en casos definidos. Cobertura completa WCAG, lector de pantalla y contraste automatizado de todas las superficies: **U** en esta revisión. |
| Performance | **Sin medir suficientemente** | La duración de una suite o la ausencia de errores no mide LCP/INP/CLS, p75, carga concurrente ni presupuesto de bundle. Los umbrales del perfil siguen **U**. |
| CSS/visual | **Verificación local acotada** | **R:** seis tamaños, paneles legibles y sin overflow de página. Encabezado nuevo separado con evidencia SSR/hidratada, seis tamaños y retorno de foco. Sistema visual completo, zoom 200% y dispositivos físicos: **U**. |
| Backend/API | **Mecanismos locales útiles; integración parcial** | **S/R:** validaciones, versión y operaciones idempotentes ejercidas. Destinos exactos, procedencia comercial, paginación/volumen, contratos externos y cobertura total: incompletos o **U**. |
| Data | **Integridad local parcial; recuperación de destino desconocida** | **R:** centavos, fechas, deduplicación y ausencia de facturas inventadas en casos concretos. **D:** backup/restore sintético. Restauración del conjunto operativo, carga y fallo de almacenamiento real: **U**. |
| Infrastructure | **Evidencia local; operación real sin acreditar aquí** | **D:** build, lint, pruebas y contenedor local documentados. TLS, persistencia, observación, alertas, restauración y comportamiento del despliegue real: **U** en este alcance. |

## Tres prioridades y criterio de aceptación

1. **Conservar contexto y origen.** Resolver F1/F2 y retorno de F4. Aceptar cuando periodo, estado, proyecto e identidad abran el conjunto correcto, una corrección preserve el contexto y un cambio de permisos produzca una salida clara. Incluir casos negativos, no solo coincidencia de totales.
2. **Cerrar el traspaso comercial explícito.** Resolver F3 con referencias de solicitud/propuesta/proyecto y aprobación humana de los valores trasladados. Aceptar con reintentos, cambios de alcance y ausencia de efectos contables automáticos.
3. **Simplificar la jerarquía y decir qué está conectado.** Conservar la separación ya verificada del encabezado; establecer un acceso financiero principal y fuentes secundarias; corregir F5. Aceptar mediante una tarea real de revisión mensual y una de coordinación, además de las pruebas visuales.

Para uso interno acotado, declarar quién mantiene registros, cómo se reconcilian y cómo se recuperan es parte del producto. Para prometer operación con clientes hacen falta pruebas del despliegue, accesos reales aprobados y recuperación del destino; para prometer envío de propuestas/invitaciones o contabilidad integrada hacen falta además esos mecanismos y recibos de sus proveedores. Los documentos actuales explican varias de estas fronteras. Esta revisión no convierte capacidad manual, una maqueta o un mock de proveedor en una conexión operativa.
