# Estadísticas V1 — P03-A

> Actualización: la revisión correctiva, sus pruebas y hashes vigentes están en [p03-a-corrective/informe.md](../p03-a-corrective/informe.md). El texto siguiente conserva el informe inicial; la evidencia regenerada y el manifiesto actual lo complementan. No se ha ejecutado SQL.

**Veredicto: READY_FOR_ISOLATED_SQL_REVIEW.** SQL completo propuesto y código propio implementados; no se aplicó ninguna migración ni se ejecutó una consulta contra Supabase. Este veredicto habilita revisión, no ejecución ni P03-B. Fecha: 2026-10-13.

## Estado y límites

Worktree `OrderOps-Estadisticas`, rama `codex/estadisticas-v1`, HEAD `923300265323d411c5c91b7935472d5423d228d2`. Cero commits nuevos. Se conservaron los cambios preexistentes en `fase-01-evidencia.json` y los directorios sin seguimiento `.codex-remote-attachments/`, `docs/audits/` y `docs/estadisticas-v1/phase03-review/`. No se editaron los tres archivos compartidos de navegación/permisos, Commercial Core, Promotores, tipos generados, configuración común ni migraciones históricas. No se inició interfaz, servidor, contenedores, P03-B/C/D/E, Phase 04/05, merge, rebase, push o despliegue.

No se cargaron credenciales ni manifest secretos, ni se contactó API/DB. Destino de una ejecución futura, sujeto a verificación live: proyecto `orderops-statistics-v1-test-74718de66a41`, API `127.0.0.1:56321`, PostgreSQL `127.0.0.1:56322`. Este informe **no afirma** que los contenedores estén actualmente activos ni sustituye el verificador adversarial/live.

## Migración y diff

Migración completa: `supabase/migrations/20261013004000_statistics_v1_comparative_series.sql`. Diff completo de alta: `migration.diff` en este directorio. El anterior pliego protegido del paquete de revisión permanece intacto como antecedente; no es el SQL ejecutable actual.

La versión candidata sigue a las 119 base y las tres propias Phase 02. Hay 123 archivos locales contando esta propuesta, con versiones únicas. No colisiona con la referencia **local** Cursor inspeccionada (`0e430b08342b638b02392927ed560ea5e0950403`); falta contrastar la versión efectiva actual de Cursor antes de reservar/aplicar. No se consultó su checkout ni se hizo fetch.

Transacción explícita, `lock_timeout=3s`, `statement_timeout=60s`. Cuatro funciones privadas nuevas y reemplazo de la RPC propia, conservando firma/retorno/OID mediante CREATE OR REPLACE. Sin tablas, índices, triggers, políticas, ALTER sobre tablas operativas, backfill ni DML. Grants se revocan por defecto y se reinstalan explícitamente dentro de la misma transacción. Fallo debe revertir toda la instalación; esto todavía no se ensayó.

## Funciones, firmas y permisos

| Función | Firma / retorno | Propiedades y autorización |
|---|---|---|
| `private.statistics_v1_summary_base` | `(text,date,date,text,integer,jsonb) → jsonb` | PL/pgSQL STABLE INVOKER; cuerpo exacto Phase 02, guard auth.uid/perfil/negocio/rol original; search_path pg_catalog,public,private |
| `private.statistics_v1_series_response` | `(text,date,date,text,integer,jsonb) → jsonb` | PL/pgSQL STABLE INVOKER; guard explícito adicional, incluido rol null; negocio solo del perfil; argumentos tipados de solicitud, no JSON de contexto; mismo search_path |
| `private.statistics_v1_series_delta` | `(jsonb,jsonb,boolean,text) → jsonb` | SQL IMMUTABLE INVOKER; aritmética numeric pura, sin lecturas/tablas/IDs; search_path pg_catalog |
| `private.statistics_v1_series_instant` | `(timestamptz) → text` | SQL STABLE INVOKER; formato UTC canónico con seis decimales, sin tablas/IDs; search_path pg_catalog |
| `public.statistics_v1_summary` | `(text,date,date,text,integer,jsonb) → jsonb` | SQL STABLE INVOKER; delega al helper guardado, mismos nombres/defaults; search_path pg_catalog,private |

Las cinco funciones tienen EXECUTE únicamente para authenticated además de los privilegios inherentes del propietario PostgreSQL; se revocan PUBLIC, anon y service_role. Los dos helpers que **leen datos** autorizan exclusivamente owner/manager/admin sobre su negocio; no usan normalizaciones compartidas. Los helpers de formato y delta son utilidades puras permitidas a authenticated: operator/viewer/super_admin pueden calcular sobre valores que ellos mismos suministran, pero no consultar datos ni proporcionar un negocio. No tienen tabla ni contexto comercial que permita un bypass. Ningún helper nuevo es SECURITY DEFINER. Se mantienen las cinco tablas/RLS y vista invoker/barrier existentes. La efectividad runtime de grants/RLS sigue pendiente.

El planner se implementó **dentro** de `statistics_v1_series_response`, no como una función adicional que aceptara p_base JSON. Esta reducción de superficie elimina la posibilidad de falsificar negocio, revision, asOf, quality o disponibilidad raíz mediante JSON de contexto. p_cursor es el único argumento JSON de lectura y mantiene las verificaciones originales de Phase 02.

## Contrato y decoder implementados

- `lib/statistics/series-contracts.ts`: `STATISTICS_SERIES_CONTRACT_VERSION`, DTO `statistics.series.v1` y respuesta compuesta; se mantienen `statistics.v1`, sus campos y la respuesta configuration_required.
- `lib/statistics/series-read.ts`: decoder estricto y adaptador de lectura sobre el cliente RPC ya existente. Extensión ausente: `series_unavailable`, sin usar buckets legacy para inferir comparación. Versión/estructura/counters/precision/claves/referencias/snapshot/rangos/deltas inválidos: error de validación. configuration_required no admite series.
- `lib/statistics/series-temporal.ts`: instantes BigInt en microsegundos, pertenencia por límites, verificación de desplazamiento de fechas, exposición física, inversión civil segura y sizing previo a generación; no fuente comercial nueva.

El decoder verifica forma exacta de la extensión, series/período/revisión/corte, disponibilidad raíz y por métrica, dinero decimal, promedio de cohorte, suma de valores conocidos y counters, cobertura histórica global contada una vez, partición de fechas y continuidad de ventanas por **IDs y coordenadas explícitas**, independiente del orden de arrays. No empareja series por índice. Los valores desconocidos permanecen null. Un previo cero permite delta absoluto pero nunca porcentaje; ticket vacío sigue null.

Concreciones aditivas del diseño aprobado: `mapping.sessions` lista las parejas verificadas de sesiones en puntos de calendario; `slice.endCommercialDate` describe intervalos civiles agrupados; `interval_out_of_range` informa un límite UTC no representable en el dominio ISO admitido. Son campos/motivo de la extensión propia, sin cambiar QualityReason legacy ni atribución histórica. Los límites no representables conservan los hechos por fecha y deshabilitan comparación; no se convierten a ceros ni se inventa un timestamp. El helper UTC asegura claves/instantes precisos sin cambiar la timezone de la sesión SQL ni el comportamiento legacy.

## Algoritmo y coherencia

1. Resolver autorización y obtener base Phase 02 internamente. Configuration_required retorna idéntica, sin extensión.
2. Una exploración adicional MATERIALIZED de effective_facts para la serie, con filtros business/date/fiabilidad/asOf y mismos predicados de cohorte anterior/segmentos/corte civil. La función base conserva sus exploraciones originales: no se afirma que toda la RPC haga una sola exploración física.
3. Leer sesiones/snapshots una vez, validar apertura/cierre/zona/calidad y congelar parejas por fecha comercial y ordinal, con IDs reales. Ventanas nocturnas por tiempo físico transcurrido desde apertura; nunca cambiar la jornada a la fecha civil de madrugada.
4. Para un día verificable, bins horarios comunes dimensionados **antes** de generate_series, con cortes parciales físicos, colas unilaterales explícitas y endpoint inclusivo solo terminal. Carril exclusivamente fuera de sesión: bins físicos y FULL JOIN por extremos civiles cuya inversión es única. Fold/gap o contraparte ausente deshabilitan correspondencia, sin fabricar hora ni cero. Carriles mezclados/no verificables o ≥200 parejas se representan por fecha con motivo de resolución.
5. Varios días: bins de fechas/semanas/meses recortados; desplazamiento de fechas explícito a la ventana anterior. Coarsening antes de generación, máximo 200 puntos, sin enumerar cada hora/día de un rango milenario. Las fechas conservan los snapshots; los intervalos fuera de sesión conservan las zonas registradas. Cambio de zona o exposición desigual inhibe comparación.
6. JOIN relacional de pertenencia y GROUP BY una sola vez; los facts no se vuelven a consultar en DB por bucket. Se verifica cada hecho exactamente una vez, número de puntos/claves y coherencia de métricas/counters/calidad con la base. Subconsultas sobre metadata/facts materializados todavía requieren medir costo; no son una prueba de rendimiento.
7. Calidad individual y disponibilidad temporal separadas. totalAlignment exige exposición equivalente de toda la cohorte; totalComparisons se calcula del total original, no suma porcentajes o tickets. La lectura comercial futura consumirá estos deltas, pero **no fue implementada**.
8. Retorno `v_base || jsonb_build_object('series',...)`: todos los campos legacy provienen de la base intacta. Una única invocación RPC, funciones lectoras STABLE/INVOKER; todas sus lecturas utilizan el snapshot del comando que las invoca. No solicitudes HTTP separadas para pegar series/totales.

B1–B6 se mantienen: ventas solo effective_sales de acuerdo reconciliado Phase 02; descuentos/ajustes/envío no identificados siguen pendientes/unknown; upsell incluido una vez en dinero y excluido de unidades principales; último ciclo activo; fuera de sesión con fecha fiable conserva su fecha local, sin asociaciones retrospectivas; sin fecha queda fuera de períodos con cobertura explícita. No ampliar el reconocimiento limitado `copy_total_price` ni cambiar contratos financieros durante esta fase.

## Evidencia offline

| Verificación | Resultado / alcance |
|---|---|
| Nuevo suite puro | 268 aserciones PASS: cinco fixtures, contrato/legacy, errores, mock de transporte por seis roles, microsegundos/endpoints, sesión nocturna, orden invertido del array, precisión, fechas personalizadas/bisiesto, DST New York y Lord Howe, Kathmandu, sizing de 1–199 parejas |
| Parser de migración nueva | PASS: 11 sentencias exteriores y 11 cuerpos/consultas SQL embebidos; sin DML/superficies compartidas; cuerpo/signatura/defaults/retorno legacy preservados |
| Migraciones Phase 02 + SQL tests | Parser estático PASS, incluido `phase03-series.sql`; las tres migraciones históricas coinciden con HEAD |
| Suite dominio Phase 02 | PASS, incluidos 1111 casos de conservación monetaria y períodos/DST |
| Suite lector Phase 02 | PASS, autorización/tenant/errores, sin llamadas DB |
| TypeScript | `tsc --noEmit --incremental false`: PASS |
| Script propio ESLint | PASS con configuración propia; no modificar configuración Next compartida |
| Diff propuesto | `git apply --check --reverse migration.diff`: PASS de coincidencia con el archivo nuevo; nada aplicado |

`static-evidence.json`, `pure-evidence.json` y `verification.json` registran resultados y hashes. Las pruebas ejecutadas verifican el **decoder real y utilidades puras**, no emulan ni validan la ejecución del planner SQL. La equivalencia legacy comprobable sin SQL es estructural: cuerpo idéntico byte por byte, firma/defaults/retorno equivalentes en AST y round-trip de todos los campos de fixtures mediante los dos decoders. **No se afirma** igualdad runtime de respuestas SQL ni compilación PL/pgSQL/tipos contra catálogo. Se preparó su prueba futura de igualdad JSON en una misma sentencia SELECT.

## Pruebas SQL preparadas, no ejecutadas

`supabase/tests/statistics-v1/phase03-series.sql`: transacción con rollback, token de instancia y gate P03-B adicional, fixtures sintéticos no vacíos en ambos tenants con finalización y upsell, igualdad legacy para los ocho períodos, llamada directa a helpers lectores, seis roles, fuga multi-tenant, precisión/no-base/unknown, DST y grants anon/service_role. No inserta snapshots históricos inferidos: los fixtures pasan por la captura original de operaciones sintéticas actuales.

El flag GUC del test **no es una autorización** ni reemplaza un runner verificado: antes de ejecutarlo se necesita aprobación humana explícita, recibo específico ligado al SHA de esta migración, verificador adversarial/live y destino aislado. El recibo de Phase 02 no cubre P03-B. No se modificaron runners de escritura ni se ejecutó este test.

La matriz T01–T26 del diseño continúa como checklist P03-B: fixtures SQL de sesiones parciales/nocturnas/cerradas desiguales, DST/zonas/catálogos removidos, invariantes/coarsening con SQL real, cursor forged/stale, cambios de finanzas/estado, reapertura/cancelación/recompletado, rollback, schedules inversos/estrés, SET CONSTRAINTS ALL IMMEDIATE y performance 10k/100k. Las pruebas puras actuales no sustituyen esa cobertura de motor.

## Riesgos pendientes y gate de ejecución

- Compilación de dos cuerpos PL/pgSQL y resolución real de nombres/tipos, comportamiento del wrapper SQL y efectivo ACL/RLS/dependencias del baseline; parser no lo certifica.
- Deadlocks/SSI/esperas ante captura, reapertura, cancelación y cambio financiero concurrentes. No se agregan locks de filas/advisory ni escritores; DDL puede esperar locks de catálogo y debe fallar atómicamente por timeout.
- Memoria y costo de materializar JSON de toda la cohorte, digests del view existente, joins y metadata por punto. Faltan EXPLAIN ANALYZE BUFFERS, medidas p50/p95 y stress multinegocio. No rendimiento prometido sin medición.
- Conservadurismo deliberado: fuente/zona/exposición no verificables, ambiguas, distintas o límites no representables impiden comparaciones, aunque sus importes conocidos permanezcan en los totales. Calendario puede sustituir resolución horaria con motivo explícito. No distribuir diferencias para mejorar cobertura.
- Referencia Cursor local antigua; 119 base no equivale a Commercial Core final. Cualquier productor financiero/tabla operativa/contrato compartido incompatible requiere diff/aprobación separados, sin improvisación.

Para autorizar P03-B: revisar SQL y hash definitivo/diff/inventario; aprobar específicamente aplicación **solo** al proyecto aislado con API56321/DB56322; revalidar ramas/baseline/versiones e identidad adversarial/live, contenedores/red/volúmenes/conexiones exclusivos antes de toda escritura; instalar en transacción y comprobar catálogo/grants/RLS; ejecutar pruebas preparadas y checklist con cleanup/rollback sintéticos, registrar errores y correcciones propias, y detenerse. No modificar Cursor/producción ni usar reset global. SQL que requiera cambiar superficies comerciales debe detener esa parte y presentar propuesta.

No autorizar UI, navegación, integración a Commercial Core, nuevas fases ni despliegue de manera implícita. **P03-A termina con este informe.**

## Inventario de archivos propios nuevos

1. `supabase/migrations/20261013004000_statistics_v1_comparative_series.sql`
2. `lib/statistics/series-contracts.ts`
3. `lib/statistics/series-read.ts`
4. `lib/statistics/series-temporal.ts`
5. `lib/statistics/series.verify.ts`
6. `lib/statistics/fixtures/series-responses.json`
7. `scripts/statistics-v1/p03-a-static.verify.mjs`
8. `supabase/tests/statistics-v1/phase03-series.sql`
9. `docs/estadisticas-v1/p03-a/informe.md`
10. `docs/estadisticas-v1/p03-a/migration.diff`
11. `docs/estadisticas-v1/p03-a/static-evidence.json`
12. `docs/estadisticas-v1/p03-a/pure-evidence.json`
13. `docs/estadisticas-v1/p03-a/verification.json`

Ningún archivo existente fue modificado por P03-A. El único diff de archivo tracked que permanece es el cambio preexistente de `fase-01-evidencia.json`.
