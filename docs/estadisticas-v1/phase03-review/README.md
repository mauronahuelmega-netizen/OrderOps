# Phase 03 — paquete de revisión técnica

Fecha: 2026-10-13. **Veredicto: READY_FOR_TECHNICAL_REVIEW_WITH_LIMITATIONS.** Diseño propuesto; no autorización de implementación ni de ejecución SQL. Los bloqueos de producto D1–D4 tienen resolución; quedan las aprobaciones del diseño concreto, del parche compartido y las verificaciones de runtime indicadas abajo. No equivale a PASS de una migración ejecutada.

## Fuentes y límites de evidencia

Fuentes principales: `docs/estadisticas-v1/plan-definitivo.md`, contratos y código Phase 02, `validacion-sql-informe.md`, decisiones B1–B6 y D1–D4 del propietario, especificación adjunta `ORDEROPS_ESTADISTICAS_V1_PHASE03_SPEC_VISUAL_FUNCIONAL.md`. R01–R08 y V01–V05 se conservan completos. Prevalece V01 sobre la imagen: ventas ocupa mayor superficie que cada KPI secundario; no cuatro tarjetas equivalentes.

Worktree: `OrderOps-Estadisticas`; rama: `codex/estadisticas-v1`; HEAD inspeccionado: `923300265323d411c5c91b7935472d5423d228d2`. Se preservan sin editar ni incluir en el paquete: `docs/estadisticas-v1/fase-01-evidencia.json` modificado, `.codex-remote-attachments/` y `docs/audits/` sin seguimiento. No se accedió al checkout de Cursor. No se inspeccionaron secretos ni se contactó producción.

Este paquete contiene un contrato de diseño, ejemplos sintéticos, un **pliego SQL con envolvente DDL propuesta, deliberadamente no instalable**, un parche para revisión y pruebas offline. No contiene componentes visuales ni cambios en el código de aplicación. El SQL ejecutable completo se elaborará solo con autorización posterior de implementación; antes de aplicarlo tendrá otro control de diff, compilación y permisos. Esta distinción evita presentar pseudocódigo como una migración lista para aplicar.

## Inventario

| Archivo propio | Propósito |
|---|---|
| `contract.proposed.ts` | DTO extendido, sin modificar el contrato TypeScript activo |
| `examples.json` | Respuestas completas: exacta, corte temporal parcial, importe desconocido y comparación ausente |
| `temporal-and-sql.md` | Algoritmo temporal, semántica relacional y reconciliación |
| `20261013004000_statistics_v1_comparative_series.proposed.sql` | Versión candidata y envolvente SQL; fuera del directorio de migraciones activas |
| `navigation.proposed.patch` | Diff mínimo de los tres archivos compartidos, sin aplicar |
| `tests-and-execution.md` | Casos y secuencia de implementación con entradas/salidas |
| `verify-review.ts` | Validador offline de ejemplos, compatibilidad y permisos propuestos en memoria |
| `verification.json` | Resultados de verificaciones de este paquete |

## Decisión técnica de extensión

Mantener nombre, firma, `contractVersion: statistics.v1`, campos existentes, cursor y errores de `public.statistics_v1_summary(text,date,date,text,integer,jsonb)`. Agregar únicamente `series`, con `version: statistics.series.v1`. La respuesta `configuration_required` permanece intacta. La serie nueva no sustituye la autoridad monetaria ni los snapshots.

Propuesta de implementación: copiar literalmente el cuerpo Phase 02 a una función privada `statistics_v1_summary_base` y reemplazar **solo la RPC propia de Estadísticas** por un wrapper STABLE SECURITY INVOKER que llama a esa base y al constructor de serie. Mantener el OID y los grants del endpoint mediante CREATE OR REPLACE. Evita duplicar la lógica de períodos en frontend y conserva el resultado legacy. La copia es extracción de código, no otra fuente de datos: solo se consume la proyección efectiva existente. Exigir equivalencia byte a byte del cuerpo extraído y equivalencia JSON de todos los campos legacy en pruebas. No renombrar funciones existentes ni cambiar RPC financieras.

El constructor recibe la respuesta base generada internamente; nunca recibe JSON suministrado por el cliente. Valida negocio contra `auth.uid()`, corte, revisión y rango. Todos los SELECT pertenecen a **una sola sentencia RPC STABLE**, con el mismo snapshot MVCC. No usar READ COMMITTED en varias solicitudes para unir totales y puntos.

## Compatibilidad con TypeScript

`lib/statistics/read.ts` acepta campos adicionales: el decoder legacy puede seguir leyendo estas respuestas. `Metric`, `QualityReason`, los 8 períodos, `previousMetrics`, `comparison` y el cursor mantienen su semántica. No agregar motivos temporales a `QualityReason`: pertenecen a la extensión `series`.

La futura implementación añadirá un decoder propio de series: primero decoder legacy, luego validación estricta de versión, snapshot, claves únicas, límites, cobertura, referencias y deltas. Si la extensión falta, error de capacidad `series_unavailable`, sin emparejar el array legacy. También validará que una comparación raíz no disponible no tenga puntos comparables. La presencia de `series` no debe hacer que el decoder confíe en JSON sin validar. `StatisticsReadClient`, servidor y tipos generados compartidos no necesitan cambiar de firma; se añadirá un tipo estrecho propio. `configuration_required` continúa siendo una rama sin serie.

No convertir dinero a Number para calcular ni formatear cantidades grandes. SQL numeric/BigInt en pruebas; valores monetarios y deltas serializados como strings decimales. Cantidades de pedidos/unidades siguen strings enteros. Si se excede la capacidad segura de un contador JSON, rechazar respuesta, no redondear silenciosamente. Timestamps SQL conservan precisión de microsegundos en sus claves y límites; Date de JS no decide pertenencia.

## Lectura comercial D2

Función pura futura `describeMetric(metricKey, current, previous, totalComparison, period)`; no lee productos, ranking ni reglas de oportunidades. Usa **series.totalComparisons**, calculado de los totales legacy, validado por disponibilidad temporal raíz, exposición total y calidad individual; no suma porcentajes ni promedia tickets de puntos. Si cualquiera de los intervalos admitidos no tiene contraparte o exposición equivalente, totalAlignment=false y todos los deltas de totales nuevos quedan null, aunque comparison.available legacy sea true. Así no se cambia el contrato anterior ni se usa su gate menos estricto para inventar una lectura válida. Estructura: observación, evidencia, significado, sugerencia. Evidencia incluye indicador, valores, delta válido, período, corte y calidad. Aumento/disminución/sin cambio según delta absoluto firmado; anterior cero permite diferencia absoluta, porcentaje ausente y texto «sin base porcentual». Ticket promedio vacío es null, no cero.

Ejemplo ventas: «Las ventas comerciales aumentaron 12,40 %»; evidencia ambos importes; significado «El importe comercial acordado y reconciliado superó al del período comparable»; sugerencia «Revisá el detalle del período y los pedidos que aportaron al importe». Unidades se refiere exclusivamente a productos principales; pedidos a finalizaciones activas, nunca cantidad de pedidos creados. Ticket describe importe por pedido completado, no rentabilidad. Sin comparación o con calidad insuficiente: «No hay datos suficientes para una comparación válida», evidencia de lo conocido y aviso concreto; no porcentajes, diagnósticos causales ni sugerencias de upsell. No afirmar que un producto causó la variación. Sin IA generativa ni reglas Phase 05.

## Navegación y coordinación con Cursor

El parche propone exactamente: una nueva variante de `AdminPermission`, una rama del switch que compara el **rol original**, un elemento de menú y un ícono. No altera `normalizeBusinessAdminRole`, permisos ajenos, flags ni el objeto de seis permisos de `getAdminPermissions`. El negocio autorizado sigue siendo obligatorio en servidor/RPC/RLS; visibilidad del menú no constituye autorización.

| Superficie | Evidencia / propuesta | Conflicto y condición |
|---|---|---|
| `lib/admin/permissions.ts` | Blob HEAD `f1ba98dd0a52381ec74d530dd47c5172f4cae524` | Compartido; aprobar patch y revalidar 6 roles × permisos legacy; no normalizar super_admin para Estadísticas |
| `components/admin/admin-nav-config.ts` | Blob `b8b15312965d619a4636cdb415a537a56a317391` | Compartido; preservar orden/flags existentes, sumar Estadísticas antes de Configuración |
| `components/admin/layout/admin-nav-list.tsx` | Blob `ceb7ed3d486e26bd336a207eef8f895368a778d7` | Compartido; solo ChartColumn; comprobar sidebar/drawer |
| `types/database.ts`, contexto, normalizaciones | Sin diff propuesto | No modificar; nueva estructura propia de Estadísticas |
| Commercial Core / Promotores / RPC financieras | Solo dependencias leídas | Congelar contrato en baseline para pruebas; toda incompatibilidad se presenta antes de intervenir |
| orders, order_financials, items, store_sessions | Lectura mediante proyección propia y snapshots | La extensión no agrega triggers ni ALTER sobre estas tablas; mutaciones concurrentes deben incrementar la revisión según Phase 02 |
| 119 migraciones base + 3 de Estadísticas | Nuevas versiones solo después de verificar unión real de ramas | No asumir que el baseline equivale al trabajo actual de Cursor |
| shell, sidebar, topbar, tokens | Consumidores existentes; sin diff | Reusar en interfaz futura, no rediseñar navegación ni branding |

Referencia **local** Cursor inspeccionada: `cursor/commercial-core-v1-integration` = `0e430b08342b638b02392927ed560ea5e0950403`. Los tres blobs coinciden con HEAD. Resultado: **NO_CONFLICT_IN_INSPECTED_REFS**. No prueba ausencia de modificaciones sin commit ni de commits recientes externos. Antes de editar se requiere aprobación del patch y coordinación sobre la versión efectiva de Cursor; comparar hashes de los tres archivos en este worktree, revisar una referencia actual proporcionada sin operar su checkout. Si cambian, regenerar diff para revisión. No aplicar a ciegas ni usar merge automático.

El menú solo se habilitará cuando exista `/admin/statistics`, su guard por negocio/rol y el backend compatible validado. Durante Phase 03: Resumen activa; Productos y Oportunidades visibles con «Próximamente», controles sin href ni acción de navegación, semántica accesible. Período global en URL validada (`period`, `start`, `end`) del módulo; negocio como clave de estado; valores por defecto esta semana. Futuras pestañas lo consumirán; no crear pantallas ahora ni persistir datos de otro negocio.

## Riesgos y mitigaciones

| Riesgo | Mitigación / evidencia requerida |
|---|---|
| Consultas de totales y serie divergen | Un RPC STABLE y misma proyección/cohortes; comparar sums/counts y revisión; no consultas separadas |
| Captura concurrente/reapertura/cancelación | Sin escrituras nuevas ni locks explícitos en serie; comprobar lectura antes/después y no duplicar ciclos activos |
| DDL espera locks de funciones | Aplicación futura en entorno aislado con lock_timeout, statement_timeout y transacción; fallo revierte completo; no ejecutar sobre Cursor |
| Deadlocks | Lectura no usa FOR UPDATE ni advisory locks; mantener orden Phase 02 sin introducir locks; probar con captura y DDL separadamente |
| Repetir digests por punto / costo de JSON | Cohortes efectivas MATERIALIZED una vez, agrupar relacionalmente; ≤200 puntos, no 200 relecturas de la vista; benchmark obligatorio |
| Fechas enormes / sesiones extensas | Coarsening calculado antes de generate_series; no enumerar cada hora de 9999 años; límite 200 sin truncar datos |
| RLS bypass / helper invocable | Invoker, guard original, filtros business_id, grants mínimos y search_path fijo; helpers no aceptan tenant libre; pruebas JWT reales |
| Cambios de tz y DST | Congelar fecha/zona de snapshot; no recalcular atribución; ambigüedad deshabilita correspondencia; mostrar motivo |
| Calidad monetaria / upsells | Mantener effective_sales y descomposición Phase 02; no inferir componentes desconocidos ni sumar upsells otra vez |
| Contrato parcialmente desplegado | Decoder exige capacidad; estado recuperable, sin derivar comparación de buckets legacy |

Sin nuevos triggers, tablas, políticas ni escritores. Se mantienen las cinco estructuras analíticas y las RLS Phase 02. La base aislada esperada es `orderops-statistics-v1-test-74718de66a41`, API `127.0.0.1:56321`, DB `127.0.0.1:56322`. **Este paquete no realizó conexión a la base ni afirma una nueva verificación de runtime**; la evidencia anterior está en el informe SQL Phase 02. Antes de cualquier ejecución futura repetir verificador adversarial, identidad live, contenedores/red/volúmenes exclusivos y conexiones destino. No arrancar/reiniciar recursos en esta revisión.

## Condiciones de aprobación

Revisar el contrato, equivalencia temporal, política conservadora de intervalos ambiguos y el diff de los tres archivos. Autorizar explícitamente implementación de SQL/decoder propios; no implica autorización de aplicación. Tras SQL ejecutable completo, revisar su diff final y autorizar validación aislada por separado. Autorizar edición de compartidos solo con referencia Cursor vigente y ruta lista. Autorizar interfaz Phase 03 expresamente. La secuencia y aceptación por etapa están en `tests-and-execution.md`. No avanzar a Phase 04/05 ni integrar Commercial Core automáticamente.

## Resultado de esta revisión

- 722 comprobaciones offline aprobadas, incluyendo fixtures positivos/negativos, compatibilidad del decoder legacy, conservación de cantidades conocidas y gates de deltas, permiso nuevo por rol original y preservación de permisos/normalizaciones/nav preexistentes mediante ejecución en memoria.
- `git apply --check navigation.proposed.patch`: aprobado; patch no aplicado.
- `tsc --noEmit --incremental false`: exit 0. No se inició Next ni se hizo build/despliegue.
- 122 archivos SQL en el checkout (119 base + 3 propios). Versión candidata sin colisión en HEAD ni referencia local Cursor; pendiente inventario Cursor efectivo.
- Sin conexión nueva a DB/API, sin ejecución SQL ni comprobación live de puertos en este trabajo. Runtime de serie, SQL completo, pruebas de la matriz y medición de rendimiento quedan pendientes de autorización.
- Nueve archivos propios nuevos bajo este directorio; cero commits nuevos. Archivos compartidos, aplicación y migraciones activas sin diff. Cambios preexistentes conservados.

Las comprobaciones del validador son de los ejemplos y propuestas: **no constituyen una implementación ni validación del planner temporal futuro**. Evidencia detallada en `verification.json`.
