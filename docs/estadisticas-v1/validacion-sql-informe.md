# Estadísticas V1 — resultado de validación SQL aislada, Fase 02

Fecha: 12/10/2026. **Veredicto: PASS_WITH_LIMITATIONS.** Pasaron las migraciones y las pruebas ejecutadas en el entorno sintético aislado; permanecen límites de cobertura, escala e integración descritos abajo. No se autoriza ni realiza integración con Commercial Core, producción o Fase03.

Worktree `OrderOps-Estadisticas`, rama `codex/estadisticas-v1`. Estado inicial: HEAD `154509e`; modificación preexistente en `docs/estadisticas-v1/fase-01-evidencia.json` y `docs/audits/` untracked. Ambos quedan fuera de esta entrega y de sus commits. No se cambió el worktree de Cursor.

## Migraciones: resultados individuales

| Migración | Resultado | Evidencia |
|---|---|---|
| 20261013001000_statistics_v1_structures.sql | PASS | Cinco tablas, claves/checks/FK/índices; RLS habilitada inmediatamente, revocaciones y gate de perfiles. |
| 20261013002000_statistics_v1_capture.sql | PASS | Captura transaccional, identidades, sesiones, acuerdos, invalidación/ciclos y revisión diferida; ocho triggers nuevos. |
| 20261013003000_statistics_v1_reads_security.sql | PASS | Políticas/grants, helpers, vista invoker/barrier y RPC ejecutada en SQL y HTTP. |

Se aplicaron únicamente estos tres archivos, una transacción por archivo, con ON_ERROR_STOP, lock_timeout y statement_timeout, al contenedor exclusivo. El registro de cada versión se confirmó en la misma transacción. La DB contiene119 versiones base +3 de Estadísticas. Ninguna migración falló, se alteró o se reaplicó; no hubo cambios de funciones operativas/financieras ni migraciones históricas.

El SQL registrado en statements[1] coincide con el archivo propio mediante hash; las tres fuentes mantienen los hashes revisados originalmente. PostgreSQL tiene `check_function_bodies=on`. Se crearon las14 funciones y se ejecutaron con éxito los siete cuerpos PL/pgSQL en los caminos probados. Esto comprueba creación y ejecución efectiva; no implica cobertura de todas sus ramas posibles.

## Inventario real

| Objeto | Inventario observado |
|---|---|
| Tablas | business_statistics_state; store_session_statistics_snapshots; order_item_statistics_snapshots; order_statistics_completions; order_statistics_completion_items. Las cinco con RLS habilitada. |
| Vista | public.statistics_v1_effective_facts, security_invoker=true/security_barrier=true. No es una sexta tabla. |
| Funciones |14:13 privadas statistics_* y public.statistics_v1_summary. Siete LANGUAGE SQL y siete PL/pgSQL. |
| Triggers |8, sobre orders/order_items/order_financials/store_sessions: cuatro capturas y cuatro constraint triggers de revisión diferidos. |
| Políticas |5 SELECT authenticated con autorización de rol original y negocio; sin políticas de escritura de clientes. |
| Índices |14 totales de las cinco tablas, incluyendo PK/unique y cinco índices explícitos. |
| Constraints |41 constraints de las estructuras propias; definición exacta en inventario JSON. |
| Grants | SELECT authenticated en estructuras/vista y EXECUTE del RPC; writers privados revocados, sin acceso automático anon/service_role. Verificados en catálogo y suites. |

Funciones privadas observadas: statistics_agreement_changed, statistics_allocate_products, statistics_bump, statistics_can_read, statistics_item_changed, statistics_local_cutoff, statistics_metric, statistics_metrics, statistics_order_changed, statistics_revision_deferred, statistics_session_changed, statistics_source_digest, statistics_source_items. El JSON de inventario incluye argumentos, lenguajes, ACL, securityDefiner, DDL de triggers/índices/constraints, políticas, grants y definición/opciones de la vista.

## Resultados de pruebas

| Suite | Resultado / comprobaciones |
|---|---|
| capture-metrics.sql | PASS: captura en transición fiable, principal2+upsell1→unidades2 y ventas23, identidad de upsell/importe una vez, sesión nocturna→fecha de apertura, rename de categoría conservado, RPC con RLS, mismo status sin duplicación, reapertura/refinalización, rollback de ciclo, cambio de acuerdo/conflicto monetario, diferencia20 frente a bruto23 sin reparto ni cero inventado, conflicto de composición, cancelación, fallback fuera de sesión, importación sin fecha→cobertura desconocida, revisión diferida. Escrituras revertidas. |
| security-money.sql | PASS: centavos/residuos determinísticos, descuento identificado27 sobre10+20→9+18, entradas inválidas, DST ambiguo/gap, vacío conocido vs histórico desconocido. Dos tenants y doce perfiles, con filas no vacías en las cinco tablas; roles originales/RPC/helpers/RLS, ausencia de escritura, anon/service sin bypass. Escrituras revertidas. |
| regression.sql | PASS: create_order real decrementa stock, initialize_order_financials real produce evidencia copy_total_price e inicializa idempotentemente, transition_order_status real finaliza/reabre/refinaliza sin duplicar, set_order_agreed_total real marca conflicto. Cancelar completed conserva el contrato existente de no reposición; cancelar pending repone exactamente una vez y un movimiento de ledger. Siete presets estándar +custom, ramas hour/day/week/month y timezone ausente. Escrituras revertidas. |
| Concurrencia | PASS: cinco schedules coordinados en conexiones PostgreSQL independientes, barreras HELD/CAPTURED y espera Lock observada. Completar/completar→1 ciclo; reapertura/refinalización→2; acuerdo/finalización→3; cierre/finalización→4; en cada paso exactamente un activo y ciclos únicos. Schedule real create_order vs cancelación con stock→stock final19 y un único restock. Fixtures eliminados después de terminar sesiones. |
| API HTTP aislada | PASS:12 perfiles de dos negocios; owner/manager/admin200, operator/viewer/super_admin403; anonimato rechazado. Cada autorizado recibe el negocio propio. Firma JWT exclusiva de pruebas, sin login ni escritura de sesiones Auth. Solo API127.0.0.1:56321. |
| Contrato TypeScript real | PASS: las seis respuestas HTTP autorizadas decodifican con el decoder propio. |
| Funciones puras | PASS:1111 casos de conservación monetaria, períodos/DST, comparables/calidad/cero y decoder con cliente falso. |
| Regresiones puras existentes | PASS: dashboard-metrics-semantic-fix8/8, order-code-search-partial-match10/10, phone-display y order-preparation. No se editaron esos archivos. |
| Verificación estática | PASS: TypeScript sin emisión/incremental, ESLint propio, parser exterior y cuerpos SQL de las tres migraciones y siete archivos de pruebas. El parser estático no se utiliza como sustituto de la ejecución PostgreSQL. |

`pg_stat_database.deadlocks=0` al cierre. No se detectaron deadlocks ni timeouts en los schedules exitosos. Los locks realmente observados fueron esperas esperadas; no se asume solapamiento por un sleep. Sigue sin demostrarse ausencia de deadlocks en todos los órdenes/inversiones, cargas o transacciones con múltiples negocios.

## Errores encontrados y correcciones

No fue necesario cambiar las tres migraciones ni corregir código de captura/RPC de Estadísticas. Los errores estaban en diagnóstico/fixtures/expectativas:

1. Consulta de preflight usaba columna `value` inexistente en pg_settings. Se detuvo antes de escribir, se corrigió el diagnóstico propio y se repitió el preflight exitosamente. Se eliminó además cualquier interpretación del read-only de una conexión como atributo de las demás conexiones.
2. Fixture de categorías omitía contexto del owner y el guard heredado lo rechazaba. Se establecieron claims del usuario sintético antes de esas operaciones; no se desactivó el guard.
3. INSERT directo de pedidos omitía order_code obligatorio. Se agregaron códigos sintéticos válidos/únicos. El status antiguo in_progress detectado en los fixtures se sustituyó por preparing, vigente en baseline.
4. Fixture legacy_unknown usaba total numérico, infringiendo el contrato de total NULL. Se corrigió a NULL; no se debilitó la constraint ni se reinterpretó unknown como cero.
5. Nueva regresión suponía reposición al cancelar completed. La fuente existente restringe reposición a pending/preparing/ready. Se corrigió la expectativa y se agregó una cancelación pending separada para probar reposición/ledger idempotentes.
6. Limpieza del nuevo fixture de stock borraba pedidos antes del ledger. FK SET NULL chocaba con la constraint de contexto obligatorio de movimientos. La transacción de limpieza fallida revirtió íntegra; se recuperaron únicamente el producto/órdenes/ledger del fixture conocido, y el runner ahora elimina primero esos movimientos sintéticos y luego pedidos/producto/categoría. Se repitió el schedule completo con éxito. No se modificó la política de borrado del sistema.

La configuración sintética A de on-demand=true/scheduled=false se mantiene registrada, igual a B. Una primera limpieza fallida había dejado esa configuración habilitada; la recuperación conserva esa configuración explícita de pruebas. No se afirma una restauración de valores de configuración no registrados antes de ese intento. Los reintentos posteriores restauran los valores capturados al entrar en el schedule. No afecta recursos de Cursor ni producción.

Las correcciones se registraron en el recibo local ignorado bajo la autorización expresa del usuario para corregir archivos propios. Hash final del conjunto SQL/pruebas: `4eda220b1e80ba93f1f1c7b7af6354b31470cbc0f3c03ae2e5cc06df5b316854`. El cambio de hash procede de pruebas/runner nuevos o corregidos; las tres migraciones originales permanecen intactas.

## Aislamiento antes y después

- Antes: rama/worktree verificados, adversarial gate PASS, proyecto orderops-statistics-v1-test-74718de66a41,119 versiones base,0 pedidos, hash original aprobado coincidente. Se verificó que las tres versiones eran posteriores y sin colisión en refs locales/remotas conocidas; no se accedió al worktree de Cursor ni se hizo fetch/push.
- Después: misma identidad privada, cinco contenedores, misma red y dos volúmenes exclusivos DB/Storage. Se exige igualdad de IDs/recursos con la evidencia anterior, sin compartir volúmenes/red con contenedores ajenos. API127.0.0.1:56321 y PostgreSQL127.0.0.1:56322,119+3 versiones. Cero pedidos, productos, sesiones y movimientos de stock de fixtures al cierre; las estructuras y la revisión por negocio permanecen instaladas.
- Cada acceso SQL usa exclusivamente `docker exec` al contenedor identificado del proyecto propio. Cada acceso HTTP usa127.0.0.1:56321 validado. No se cargaron URLs/configuración/credenciales de Cursor o producción ni se abrió una conexión de escritura a esos destinos desde esta validación. No se afirma que Cursor deje de usar su propia DB durante su trabajo.
- No reset/reinicio, seed base, modificaciones de archivos comerciales/Promotores, ALTER de contratos operativos, cambios de RPC existentes o tipos compartidos. No datos reales, migraciones históricas alteradas, backfill inferido, merge/rebase/push/despliegue. No Fase03.

Evidencias versionadas: `validacion-sql-antes.json`, `validacion-sql-despues.json` (inventario), `validacion-sql-pruebas.json` (resultados/hash por suite) y `validacion-sql-api.json`. Tokens, claves y logs detallados permanecen en runtime ignorado, sin publicarse en estos archivos.

## Archivos nuevos/modificados y commits

Propios nuevos: scripts/statistics-v1/sql-validation.mjs, api-isolated.verify.mjs; lib/statistics/api-contract.verify.ts; supabase/tests/statistics-v1/regression.sql, stock-concurrency-fixture.sql, stock-fixture-recovery.sql; este informe y cuatro evidencias JSON.

Propios corregidos: runner sql-approved-tests.mjs y fixtures capture-metrics/concurrency-fixture/security-money. Documentación de preparación/README se referencia como estado anterior y se actualiza para distinguir la autorización SQL aislada vigente. Los commits locales separan tooling/fixtures/regresiones de informe/evidencia; sus hashes se entregan al finalizar. No se incluye la modificación preexistente de fase-01-evidencia.json ni docs/audits.

Commits de código/pruebas: `c5b9330` fixtures, regresiones y schedules; `89c1f1d` tooling de aplicación verificada/inventario y contrato real API. El commit del informe/evidencias se identifica en el mensaje final.

## Limitaciones y condiciones de integración

1. El baseline tiene119 migraciones del commit auditado, no el árbol combinado más reciente de Cursor. Las regresiones ejecutadas prueban esos RPC y sus contratos existentes; no equivalen a validar nuevos writers de Commercial Core/Promotores ni sus migraciones futuras. Hace falta fijar HEADs/diffs y reconstruir/actualizar una tercera instancia exclusiva del árbol combinado con autorización específica.
2. Ventas reconciliadas se habilitan solo para copy_total_price con evidencia y coincidencia completa. Productores de descuentos/ajustes/envío sin desglose aprobado siguen pendientes/no disponibles; el helper de reparto explícito está probado, sin convertir diferencias desconocidas en descuentos. Resolver ese productor requiere contrato/diff revisado y aprobación; no se modificó la fuente comercial.
3. Concurrencia cubre cinco schedules dirigidos, no estrés ni todos los schedules inversos. Revisar multi-negocio, SET CONSTRAINTS ALL IMMEDIATE, nuevos triggers diferidos, retries idempotentes y locks antes de integrar. No se autoriza cambiar stock/finanzas para resolver esa revisión.
4. Quedan pruebas ampliadas de borrado de catálogo/sesión/identidad reemplazada, FK compuestas en escenarios adversariales adicionales, cursors entre commits, suma de buckets/segundos próximos a límites, varios segmentos comparables y cambios de zonas. La suite actual verifica constraints reales en catálogo y los caminos mencionados, no exhaustividad de combinaciones.
5. No benchmark/EXPLAIN a escala real ni garantía de latencia/consumo bajo grandes volúmenes. Tampoco rollback de migraciones fallidas o upgrade con datos históricos voluminosos: las tres migraciones aplicadas pasaron en baseline sintético vacío.
6. UI, navegación compartida, motor de oportunidades y E2E de Fase03/fases posteriores permanecen fuera del alcance. Aplicar correctamente este SQL aislado no autoriza iniciar esas fases ni integrar/desplegar.

**Se detiene el trabajo después de esta entrega.** La autorización recibida se limita a la validación aislada; cualquier integración, producción o Fase03 requiere permiso expreso independiente.
