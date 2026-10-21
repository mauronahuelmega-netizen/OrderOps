import fs from 'node:fs';
const dir='docs/estadisticas-v1/p03-f3b';const write=(f,s)=>fs.writeFileSync(`${dir}/${f}`,s+'\n');const audit=JSON.parse(fs.readFileSync(`${dir}/static-audit.json`));
write('semantic-map.md',`# Mapa expresión por expresión

Referencia exacta: función private.statistics_v1_summary_candidate extraída del SQL A+B SHA fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9. functions.diff tiene dos cambios: nombre nuevo y materialización. Invertir ambos reproduce el texto completo byte por byte. No se reutiliza texto rediseñado ni se normaliza JSON para certificar igualdad.

| Expresión o bloque | D1 y efecto semántico previsto |
|---|---|
| Firma/defaults | text,date=NULL,date=NULL,text='units',integer=5,jsonb=NULL; retorna jsonb; iguales |
| STABLE / SECURITY INVOKER / search_path | Iguales, pg_catalog,public,private; sin nueva autoridad |
| profiles WHERE id=auth.uid() | Conservada; raw role owner/manager/admin; NULL/negocio ausente denegados |
| auth.uid/role NULL y excepción42501 | Conservadas antes de cualquier lectura del núcleo |
| v_bundle := read_core_candidate(...) | Única llamada al núcleo A+B, sin copiarlo/reemplazarlo |
| v_base y configuración requerida | Mismo bundle->legacy y retorno temprano; nunca evalúa puntos sin configuración |
| businessId mismatch | Mismo chequeo42501; el negocio sale del perfil, no del JSON del cliente |
| período/asOf/revision/cursor | Delegados sin cambio al núcleo; mismo statement_timestamp y snapshot |
| effective/v_facts | Mismos filtros, fechas, calidad y campos; no nueva composición ni finanzas |
| sessions/pairs y ordinal | Identidad y emparejamiento backend conservados; no arrays por índice |
| cn/pn, sizing y lanes | Iguales; mismo presupuesto200, segundos exactos y cortes microsegundos |
| calendar_plan/session_plan/outside_plan | Iguales, DST, zonas, jornadas, nocturnas y parciales |
| plan MATERIALIZED | Ya existente, permanece; mismos descriptor, basis, ca/pa, mapping y reason |
| membership MATERIALIZED | Igual CASE por side, >=apertura, <cierre con inclusión terminal condicionada; no filas agregadas/omitidas |
| groups MATERIALIZED | Igual GROUP BY descriptor,side y jsonb_agg ORDER BY date,at,id |
| point_metrics p.* y LEFT JOIN groups | Iguales, cardinalidad una por fila de plan si groups único descriptor/side; no DISTINCT nuevo |
| CASE WHEN ca THEN statistics_metrics(coalesce(c.rows,[]),v_historical) END cm | Texto idéntico; una evaluación por fila con ca=true; ca=false/NULL conserva NULL y no ejecuta metrics |
| CASE WHEN pa THEN statistics_metrics(coalesce(b.rows,[]),0) END pm | Texto idéntico; una evaluación por fila con pa=true; no convertir NULL previo en0 |
| point_metrics AS MATERIALIZED | Único cambio de cálculo: almacena cm/pm por descriptor/fila de plan, reutiliza en métricas y comparaciones; antes el planner podía inlinearlos y repetir llamadas |
| intervals/cslices/pslices | Iguales; metadatos y timestamps no se materializan/rediseñan adicionalmente |
| key/md5 y label | Mismas entradas, orden jsonb_build_array, mapping, zonas y descriptor |
| current/previous CASE ca/pa | Iguales; salida ausente sigue NULL; availability temporal separada de calidad |
| comparisons unnest cuatro indicadores | Iguales; delta usa cm/pm materializados; métricas iguales no producen nuevas diferencias |
| jsonb_agg(points ORDER BY sort_date,sort_time NULLS FIRST,descriptor) | Igual orden; no sorting/normalización adicional en pruebas |
| bool_and/alignment/reason elegido | Iguales, mismo ORDER BY para primer reason |
| current_check/previous_check statistics_metrics | Conservados e independientes del materializado; siguen verificando cohortes completas |
| v_bad/membership counts/200/keys | Todos conservados; mismas excepciones22023 |
| metrics legacy mismatch y comparisons totales | Conservadas; no confiar en promedios ni totales para construir puntos |
| salida base || series | Exactos campos, string numéricos, NULL, calidad/reasons y cobertura |

Evaluaciones eliminadas por diseño: repeticiones del MISMO cm/pm al ser referenciado en métricas de salida y cuatro deltas. No eliminar métricas de buckets legacy, resumen, checks de conservación ni llamadas por lados distintos. No compartir métricas entre descriptores por semejanza de JSON: su identidad temporal sigue separada.

MATERIALIZED puede adelantar cm/pm respecto a consumidores, pero dentro de sus CASE idénticos. statistics_metrics es IMMUTABLE y sus entradas son rows ya construidas por groups y v_historical validado; no accede a finanzas ni depende de reloj. Esto no equivale a prueba runtime: entrada malformada/errores podrían cambiar el momento o precedencia de una excepción. Comparar SQLSTATE y mensaje, estado vacío/configuración/calidad/pa=false/DST inválido; cualquier divergencia bloquea certificación. No anticipar un pa ausente como disponible ni retirar CASE.
`);
write('security-audit.md',`# Seguridad offline

Objeto nuevo único: private.statistics_v1_summary_d1_candidate(text,date,date,text,integer,jsonb), STABLE SECURITY INVOKER, search_path=pg_catalog,public,private. Propietario futuro el mismo rol de migración aislada aprobado; comprobar catálogo real, no asumirlo del archivo.

Guarda idéntica al lector A+B: perfil verificado auth.uid(), negocio del perfil, rol ORIGINAL owner/manager/admin. Sin fallback administrativo, claims metadata, businessId recibido o bypass super_admin. NULL/unknown/operator/viewer/super_admin denegados. Núcleo A+B repite su guarda; D1 preserva tenant mismatch. Helpers existentes conservan ACL y autorizaciones, no se conceden derechos nuevos sobre ellos.

SQL propuesto revoca PUBLIC/anon/authenticated/service_role en la función NUEVA y concede EXECUTE solo authenticated; owner implícito queda sujeto al rol de instalación. No grants en preexistentes, esquemas/tablas o políticas. No SECURITY DEFINER, ALTER RLS, funciones reemplazadas, nuevas tablas/índices/cache/jobs ni routing público.

RLS se ejecuta en tablas leídas por núcleo y lectores de series: profiles/business_settings/business_statistics_state, orders/order_financials/order_items, completions/completion_items, snapshots de ítems/sesiones, store_sessions y products según composición. La materialización local ocurre sobre hechos ya autorizados; no eludir ni eliminar statistics_can_read. Ver catálogo/RLS de todas las dependencias como F2B antes y después de una futura instalación.

Pendiente: compilación PL/pgSQL, ACL efectivos y llamadas directas. Preparar seguridad para tres lectores y TODOS helpers candidatos: seis roles en dos negocios, sesión ausente/expirada, perfil ausente/sin negocio, metadata/claims de negocio falsos con JWTsub del actor real, y helper directo. Cambiar sub por otro usuario usando conexión postgres no demuestra seguridad JWT: el transporte debe verificar firma/sesión; distinguir test SQL de claims del test HTTP real. No usar service role de aplicación. RolesNULL/unknown no admitidos por constraints se prueban mediante rechazo de fixture más pruebas del gate, sin alterar constraints para fabricarlos.

La existencia de la función privada con grant authenticated no es un gate de menú/lanzamiento; no exponer por PostgREST ni modificar RPC pública. No certificación efectiva hasta ejecución autorizada. Cualquier acceso cruzado o ampliación de grants detiene con FAIL.
`);
write('differential-plan.md',`# Equivalencia de tres lectores preparada, no ejecutada

Referencias: public.statistics_v1_summary original extendida, private.statistics_v1_summary_candidate A+B, private.statistics_v1_summary_d1_candidate D1. Usar BEGIN ISOLATION LEVEL REPEATABLE READ y un SELECT con tres invocaciones para cada entrada; mismos parámetros/asOf/actor y datos. Preservar igualdad original=A+B=D1 JSONB completo, arrays en orden, números y strings exactos; sin quitar series/campos/reasons ni reconstruir outputs. La igualdad JSONB no prueba igualdad textual de orden de keys: ese orden no pertenece al contrato. Decoders existentes se usan sin cambio sobre los tres outputs.

Ejecutable preparado: differential-three-readers.sql, incluye96 comparaciones iniciales (6actores autorizados ×8períodos ×2sorts), nextCursor solo cuando exista/no sea JSONnull, errores SQLSTATE+mensaje. Ejecutar con distintas variantes de fixture; esto no cubre por sí solo la matriz completa. Instrumentation.sql prepara los contadores; no instalar funciones de prueba.

| Escenario/fixture | Entradas y aserciones adicionales obligatorias |
|---|---|
| Base50/100 | F1fixture, 8períodos, límites1/5/20, sorts units/amount; JSON completo y decode |
| Productos/categorías | F2B products, varias identidades y NULL; suficientes filas para dos páginas; reutilizar mismo nextCursor en tres lectores, paginar hasta final con asOf fijo |
| Finanzas | F2B shapes: agreed_total, copy_total_price, unresolved/missing/reconciliación parcial, ajustes/descuentos/envío identificables, adicional/upsell/modificador; comparación exacta sin reinterpretar NULL |
| Ciclo de vida | F2B state-tests: captura, pending(reapertura), cancel, completed(recompletado), cambio agreement/composición; triple comparación después de CADA checkpoint y constraints inmediatos; no solo estado final |
| Nocturnas/partial | F2B temporal fixture; custom fechas exactas del fixture, apertura±1us, interno±1us, cierre±1us, asOf±1us; current3/previous3 en parcial; misma construcción requestKey/revision/offset del test F2B |
| DST/zonas | F2B dst-tests Lord_Howe2026-04-05 y2026-10-04, Kathmandu; custom días del fixture; gap/fold, previous cutoffNULL, razones y ausencia de rama inválida; no limitar al custom last30d |
| Calidad/histórico | F2B shapes: completado sin captura/fecha confiable, outsideSession fiable y NULL, source_conflict/monetary_conflict y mainUnitsNULL; historical global fuera de período debe mantenerse |
| Vacío/configuración | Ningún pedido, período sin facts, timezone ausente dentro de transacción; no point_metrics con configuración requerida; comparar exact/partial/unavailable por indicador |
| Errores | Invalid period/sort/limit/range, JSONnull cursor, time inválido, future/nonfinite asOf, stale revision/requestKey, offset inválido; mismos SQLSTATE y mensaje; no comparar errores como datos |
| Multi-tenant | F2B two-business shapes, seis roles, direct helpers; claims metadata falsos, sin sesión/perfil/negocio; outputs solo negocio de perfil, failclosed |
| Sesiones/200puntos | Múltiples/nocturnas/cortas/desiguales,199/200, período parcial; mapeo/intervalos/quality/cantidad y pertenencia exactamente iguales |
| Concurrencia | Reader RR compara tres mientras writer sintético cambia estado/finanzas sin commit y con commit en transacción distinta; no mezcla dentro del snapshot, nuevo snapshot ve cambio. Fixtures writer selectivamente limpiados tras aprobar diseño; nunca rollback global/reset |

Antes de probar, adaptar en archivos propios el harness F2B de pares a triples, incluir tercera respuesta en todos los checkpoints, y validar expectativas del fixture (cuenta/fechas) para evitar tests vacuos. Este paquete no contiene un runner live automático; instalación y adaptación live requieren aprobación posterior. No ejecutar los scripts F2B que instalan o sobrescriben evidencias previas.

Contadores: activar track_functions=all LOCAL solo tras seed/warmup; consultar pg_stat_xact_user_functions antes/después de CADA ejecución y restar por función; separar inclusive/self, no sumar padres e hijos. Desactivar para benchmark normal; nested auto_explain solo si ya preloaded, sin LOAD/DDL ni cambios persistentes. Identificar descriptores y contar ca/pa disponibles desde metadata/plan, contrastar con llamadas metrics descontando buckets/resumen/checks. Con F3A21puntos se estiman ~67 frente235; es predicción de diseño, no resultado medido. Conservar una source_items por elegible no conflictivo y checks independientes. Variar ambos lados ausentes/presentes, partial/no comparison/DST para demostrar que CASE no evalúa ramas inválidas.

Fallo: guardar parámetros/actorfixture/outputs completos/SQLSTATE y caso mínimo dentro de artefactos nuevos; detener certificación. No normalizar divergencias ni cambiar decoder.
`);
write('performance-risks.md',`# Rendimiento: diseño, no medición de D1

Evidencia F3A, no resultado D1: 100pedidos, series101.772ms,235calls metrics,940metric; metrics91.420ms inclusivos incluye legacy+series. Fuente100 llamadas; núcleo156.945ms. No sumar inclusivos. MATERIALIZED busca reducir repetición, no eliminar trabajo de composición ni resolver historical/joins; A/B/C/rankings diferidos.

Riesgos: CTE materializado puede aumentar ancho/tuplestore y cambiar planificación, streaming y momento de evaluación. <=200puntos limita filas, no bytes ni memoria total. Dos métricas JSON por descriptor y p.*; work_mem por nodo/reader, concurrencia aumenta memoria. No spills/picos garantizados. No caché persistente ni reutilización entre usuario/negocio/petición; mismo statement MVCC. Comparaciones ausentes conservan CASE, quality diferente entre indicadores no se deduce de disponibilidad temporal.

Benchmark posterior preparado en application-plan: lectores3, warmup1+ al menos20muestras si seguro, rotación orden original/AB/D1, conservar TODOS outliers. p50/p95 nearest-rank/max/stddev/errores/buffers, condiciones y recursos. Instrumentadas fuera de distribución normal; PostgreSQL vs HTTP separados. HTTP privado requiere harness autenticado autorizado sin cambiar RPC pública/usar service role. No HTTP disponible => límite explícito.

Objetivos intactos: p95 extendida100<=500ms,500<=1000ms,1000<=1500ms,5000<=3000ms; 50y200 diagnósticos. 15squery/3slock; no subir timeout. CPU35% y mem40% gates previos de contenedor, max>=5s detiene escalamiento; snapshots recursos no equivalen a picos host. No carga que afecte ajenos. No mejora garantizada ni cumplimiento SLA por número de llamadas previsto.
`);
write('application-plan.md',`# Procedimiento futuro — requiere autorización de hash y aplicación

Este archivo no autoriza ni ejecuta SQL. SHA candidato D1 ${audit.candidateSha256}. Archivo docs/estadisticas-v1/p03-f3b/candidate-d1.sql, fuera de discovery de migraciones. No asignar versión/ledger de migración hasta revisar versiones propias y Cursor disponible en solo lectura durante futura autorización.

1. Revalidar worktree/branch/HEAD/estado y hashes de preexistentes, cuatro originales y A+B. Verificador offline y live: project orderops-statistics-v1-test-74718de66a41, API127.0.0.1:56321, DB127.0.0.1:56322, cinco contenedores sanos, red/dos volúmenes exclusivos, private identity/token y ledger124 con fuentes aprobadas. Sin reparación/reinicio. Este paquete NO revalidó live porque F3B es exclusivamente offline.
2. Registrar funciones/ACL/search_path/volatility/policies/RLS/índices/constraints y fingerprints/conteos de datos sintéticos; original público y tres A+B iguales al cierreF2B/F3A. D1 debe estar ausente: CREATE sin OR REPLACE aborta colisión.
3. Solo con autorización expresa aplicar EXACTO hash en una transacción al aislado, con mecanismo dedicado que no descubre archivos pendientes. WrapperBEGIN/COMMIT tiene15sinstall/3slock. Registrar fuente en ledger solo si versión/procedimiento adicional queda autorizado; no inventar ni aplicar una migración ajena. Error compila => rollback y detener, nunca parchear hash silenciosamente.
4. Ver catálogo: solo D1 añadido, SECURITY INVOKER/STABLE/fixed search_path, misma firma/defaults; ACL nuevo owner+authenticated y PUBLIC/anon/service_role sinEXECUTE. Todas las funciones anteriores/RPC pública y grants/policies/índices/constraints intactos. Comprobación check_function_bodies+invocación sintética posterior: parse offline NO compila cuerpoPL/pgSQL.
5. Seguridad y triple equivalencia antes de benchmark. Fixtures own sintéticos, transacciones RR+rollback con state constraints verificadas; matriz differential-plan completa. RLS multi-tenant y directhelpers, exactJSON/money/arrays/decode/SQLSTATE. Ampliación de acceso=FAIL. Divergencia bloquea y guarda repro.
6. Instrumentar por actor/entrada: countersdelta, propios/inclusivos, planes anidados preloaded, counts membership y disponibilidad; demostrar reducción metrics, no presuponer67 universal. Lectores normal no instrumentados; no llamadas legacy adicionales en transporte de aplicación.
7. Benchmark progresivo50/100/200/500/1000/5000, concurrencia1inicial, warmups separados y20+muestras POR lector si gates pasan. Rotarorden, errores/timeouts youtliers retenidos, p50/p95/max/stddev/BUFFERS/temp/memoria disponible/capacidad. Mantener timeout15s; ni afirmarPASS con5samples ni extrapolar5000 no medidos.
8. Parar si identidad/hash/catálogo/ACL cambia, leak/JSONdiff/SQLSTATEdif, duplicación/>200/finanzas/NULL inválidos, timeout/error/deadlock/spill preocupante, recursos fuera gates o max>=5s. Documentar omitidos; no escalar200+ si riesgo. No aplicar nuevas optimizaciones con mismo permiso.
9. Limpieza rollback/close por fixture y conteos/fingerprints, no reset/TRUNCATE/DROP ni reseedglobal. Secuencias/WAL/estadísticas pueden avanzar aun con rollback, no reiniciarlas. Revalidar aislamiento/catálogo/hashes después y preservar evidencia.
10. Reversión sin pérdida: original público y A+B permanecen activos e intactos. Si D1 falla, no usarlo; dejar objetoexperimental sin tráfico mientras se revisa. No DROP automático. Una eventual corrección/reversión de definición o routing requiere forwardSQL nuevo y hash aprobado; ningún cambio de captura/datos. Adopción pública e integración/lanzamiento requieren autorización independiente.
`);
write('informe.md',`# P03-F.3B — D1 propuesta sin instalación

**READY_FOR_SQL_REVIEW.** Nueva función privada única private.statistics_v1_summary_d1_candidate, reutiliza private.statistics_v1_read_core_candidate A+B. SQL completo en candidate-d1.sql; no es una migración aplicada ni se encuentra en supabase/migrations.

SHA-256: **${audit.candidateSha256}**.

Dos diferencias frente al lector A+B: nombre nuevo y point_metrics AS MATERIALIZED. Firma/defaults/cuerpo restante idénticos; igualdad textual reversible comprobada. No se cambia fuente financiera, captura, membership, sizing200, límitesmicrosegundos, cursores/asOf, salidaJSON o decoder. CASEca/pa intactos evita ejecutar metrics para lado ausente; el momento de evaluación/materialización exige pruebas runtime de errores y partial.

Pruebas offline: rama/HEAD/root, hashes de cuatro originales+A+B, copia exacta inversa, parseAST del candidato/propuestas/testsSQL, sintaxisNode, comprobaciones invoker/search_path/guard/núcleo/ACLnuevo. **No compilación PL/pgSQL, equivalencia runtime, ACL efectivos ni benchmark D1 ejecutados.** Ninguna conexiónDB/Docker/API, servicios, instalación o commits. Último catálogo live corresponde a F3A; no afirmar identidad live nueva.

Preparado: diferencial triple de8períodos/2sorts/6actores, cursor y errores; instrumentación separada porlector; matriz completa para finanzas/adicionales/quality/NULL/histórico/reapertura/cancel/recomplete/nocturnas/DST/microsegundos/dosnegocios/concurrencia. Falta adaptación y ejecución del harness live para checkpoints ricos, solo después de autorizar instalación. Expectativa~67metrics en fixtureF3A21puntos frente235 no es medición ni garantía p95.

Seguridad: SECURITYINVOKER/STABLE, search_path fijo, rawprofile auth.uid/negocio, owner/manager/admin únicamente, guard núcleo repetido y tenantcheck. SQL concedeEXECUTE únicamente en objetoD1nuevo; no altera RLS/grants anteriores. Público original sigueintacto y no hay adopción del A+B.

Artefactos obligatorios: informe.md, candidate-d1.sql, functions.diff, semantic-map.md, differential-plan.md, security-audit.md, performance-risks.md, application-plan.md, evidence.json. Complementos inventariados: reference-ab-function.sql, proposed-d1-function.sql, baseline-preexisting.json, static-audit.json, differential-three-readers.sql e instrumentation.sql y scripts propios build/docs/evidence. Evidencia contiene hashes de TODOS nuevos archivos y preservación de preexistentes.

Detención: esperar revisión y autorización expresa del SHA antes de cualquier aplicación SQL. Sin optimizaciones C/A/B ni frontend/navegación/permisos, sin Phase04/05.
`);
console.log('Prepared semantic/security/differential/performance/application review documents.');
