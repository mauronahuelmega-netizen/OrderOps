# P04-T01B — validación transaccional aislada

Veredicto: **NEEDS_FIX**. El SQL autorizado compila y produce respuestas reales compatibles en los casos ordinarios ejecutados, pero confirma dos riesgos: SQL-05 y SQL-07. No se certifica Productos ni se autoriza T02. No se corrigió ni ejecutó un segundo candidato.

## Preflight y fuente exacta

Worktree OrderOps-Estadisticas, rama codex/estadisticas-v1, HEAD `923300265323d411c5c91b7935472d5423d228d2`. Proyecto `orderops-statistics-v1-test-74718de66a41`; API 127.0.0.1:56321 y PostgreSQL 127.0.0.1:56322. Cinco contenedores ejecutándose y saludables donde existe healthcheck, red exclusiva y dos volúmenes coincidentes con el manifest privado. Se inspeccionaron recursos ajenos únicamente para descartar compartición de la red/volúmenes; no se conectó ninguna base ajena ni se inició servicio.

Verificador adversarial offline PASS; manifest/configuración/firma exclusiva comprobados; 119 archivos base byte-iguales al commit aprobado; hashes analíticos comprobados; identidad privada live y ledger 124 PASS. Funciones, ACL, políticas, índices, constraints, perfiles y conteos coinciden con la referencia instalada aprobada. Productos ausente antes; Resumen público original activo; A+B y D1 privados intactos; C ausente. Ninguna herramienta de migración usada.

Fuente autorizada: `docs/estadisticas-v1/p04-t01a-1/candidate-products-reviewed.sql`.

SHA-256: `a66ce3ea73bf4a4421c60b77376914f232b4470d41df7d661ee38142c4a29ba8`.

SHA-256 del harness final acotado: `56af055a7b853f3d39f3093392fb1d213a17c4f120488b136fa9bf6b2d0c9d03`. La batería completa de 60 checks está preservada en attempt-02 con su hash propio; el harness final ejecuta nueve checks acotados y no sustituye esas evidencias.

`harness-manifest.json` y los manifests de attempt-01 a attempt-04 registran el hash completo de cada harness y del payload. Se excluyeron únicamente las líneas BEGIN y COMMIT originales, con offsets explícitos. Las tres definiciones, defaults, settings y grants del payload permanecieron exactos; el hash del payload es común a todos los intentos. Una única transacción externa por ejecución, sin COMMIT; ROLLBACK final obligatorio. Los savepoints/subtransacciones pertenecen a esa transacción, no son instalaciones separadas.

## Compilación, catálogo y seguridad

Las tres funciones se crearon transitoriamente y se ejecutaron bajo authenticated. La ejecución con datos no vacíos resolvió CTE, tablas, columnas, vista, joins y funciones métricas; no es solo un parser offline. Catalog check_function_bodies estaba activo. El helper SQL puro se ejecutó también directamente.

| Función | Firma | Catálogo observado |
|---|---|---|
| private.statistics_products_metric | numeric,bigint,bigint,bigint,bigint DEFAULT 0 → jsonb | IMMUTABLE, invoker, propietario postgres, search_path pg_catalog |
| private.statistics_v1_products_reader | text,date DEFAULT NULL,date DEFAULT NULL,text DEFAULT units,integer DEFAULT 5,jsonb DEFAULT NULL → jsonb | STABLE, invoker, postgres, search_path pg_catalog,public,private |
| public.statistics_v1_products | mismos seis argumentos → jsonb | STABLE, invoker, postgres, search_path pg_catalog,private |

ACL exactas en los JSON de catálogo de sql-results: authenticated EXECUTE, anon/service_role sin EXECUTE, sin grant general PUBLIC. Las ACL solo existieron en la transacción sin confirmar. No se alteró ninguna función/grant/RLS existente; comparación exacta posterior PASS.

| Caso de seguridad | Resultado / alcance |
|---|---|
| owner, manager, admin, dos negocios; wrapper y reader directo | PASS, 12 combinaciones permitidas; businessId correcto. |
| operator, viewer, super_admin, dos negocios; ambas entradas | PASS, 12 combinaciones denegadas con 42501. |
| Sin sesión y perfil inexistente, ambas entradas | PASS, 42501. |
| Perfil con negocio ausente | PASS, prueba con super_admin sintético y negocio NULL; sin bypass. |
| Roles NULL/desconocido | PASS como rechazo de escritura por NOT NULL/23502 y CHECK/23514. No se debilitó schema para construir perfiles inválidos; esa rama del reader no se certifica mediante un perfil persistido imposible bajo constraints actuales. |
| Claims de metadata manipulados | PASS, no cambian rol original ni negocio. No se probó falsificación criptográfica de JWT. |
| Cursor ajeno/inválido | PASS, 22023; no obtiene datos del otro negocio. |
| Helper puro | PASS, unknown permanece NULL y unavailable, sin lectura de tablas. |
| RLS cross-tenant | PASS sobre orders, order_items a través de orders, order_financials, sesiones, snapshots, estado, completions/items, business_settings, products y categories bajo owner authenticated. |
| Profiles RLS / vista efectiva como consulta directa independiente | Políticas inventariadas, lector ejecutado; falta matriz dedicada completa de SELECT directo a esos dos objetos por todos los roles. No afirmar cobertura total de RLS. |

La página y endpoint G1 permanecen default-closed e intactos. El wrapper público podría ser accesible por authenticated si se confirmaran sus grants: el gate HTTP no protege directamente Supabase. No hubo COMMIT, publicación persistente, HTTP de Productos ni ruta alternativa. SET LOCAL de claims emula contexto SQL, no autenticación HTTP real.

## Exactitud ejecutada

| Contrato / escenario | Resultado |
|---|---|
| Ocho períodos | PASS: today/yesterday/this_week/this_month/previous_month/last_7_days/last_30_days/custom. |
| Diferencial con Resumen | PASS, ocho presets + sesión nocturna: siete campos de período idénticos en misma sentencia/snapshot; unidades y dinero exactos del subconjunto reconciliado iguales. No igualdad del JSON completo entre contratos distintos. |
| Dataset principal | Siete pedidos del negocio A, ocho líneas: ocho unidades principales y 90.00 de ingreso reconciliado; negocio B, un pedido, una unidad y 99.00, separado. |
| Homónimos | PASS, siete identidades distintas conservadas aunque etiquetas iguales. |
| Ranking unidades, paginación/empates | PASS, Top 5 y página siguiente de dos, posiciones estables; cursor inválido/ajeno rechazado. |
| Ranking ingresos | JSON real verificado offline: dos productos con 20.00 cada uno, desempate UUID ascendente. El assertion inicial esperaba erróneamente 30.00 en el padre y se conserva como error del harness; no se modifica ni reordena la respuesta. |
| Upsells | PASS: ingreso de la línea adicional conserva identidad, no duplica unidades; categoría solo upsell tiene unidades 0 y share 0.00. |
| Renombre/eliminación del catálogo | PASS: identidad/etiqueta capturada conservada; no reconstrucción por nombre actual. |
| Categorías verificadas, ausentes/desconocidas | PASS de contrato; evidencia sintética analítica explícita para Sin categoría. El catálogo vigente exige category_id NOT NULL, por lo que no se afirma que ese estado se pueda generar operacionalmente hoy sin otra fuente histórica verificada. NULL sin prueba produce desconocido. |
| Parcialidad financiera | PASS: agreed_total 31 vs captura 30 invalida atribución del pedido, sin distribuir la diferencia; subtotal conocido 60.00 y calidad parcial. No equivale a probar todas las modalidades de descuentos/ajustes/envío. |
| Sin líneas capturadas / histórico sin fecha | PASS: faltante de captura y cobertura global advertidos; histórico insertado completed no fabrica fecha ni ingresa al período. |
| Vacío | PASS, JSON real con métricas empty; unknown del helper no se vuelve cero. |
| Reapertura/cancelación/recompletado | PASS en sentencias separadas: seis pedidos durante reapertura/cancelación, siete al recompletar, una única finalización activa. |
| Jornada nocturna | PASS, sesión abierta el día comercial previo; pedido recompletado en fecha civil siguiente atribuido a esa jornada. Resumen coincide. |
| Microsegundos/asOf | PASS, evento asOf +1 µs excluido y exactamente asOf incluido, sin duplicación. |
| DST/timezone | PASS de fecha comercial almacenada sintética y de helper compartido que rechaza gap/fold NY. No certifica toda la captura operacional de sesiones en DST. |
| Revision | PASS, cambio de estado invalida cursor con 22023. |
| SQL-05 | **FAIL del candidato**: cambio de TimeZone y cambio independiente de DateStyle invalidan cursor que conserva negocio/revision/asOf. |
| SQL-07 | **FAIL del candidato**: fuente NaN produce pendingAgreedTotal='NaN'; decoder real lo rechaza. |

Decoder inalterado: 64 respuestas reales capturadas analizadas; 63 aceptadas y una rechazada (NaN). Incluye respuestas repetidas de los intentos; no son 64 escenarios independientes ni muestras de benchmark. No se eliminaron campos ni normalizaron/reordenaron arrays para forzar aceptación. JSON completo permanece en sql-results y logs.

## Errores del harness y límites de certificación

Todos los intentos se conservaron. Attempt-01: SELECT sin destino dentro de DO y categorías de dos negocios bajo un solo actor; 42501 del trigger detuvo fixtures y produjo 128 errores de transacción abortada. Attempt-02: tres assertions usaban in_progress, inexistente en catálogo vigente. Attempt-03: pruebas de control heredaban actor B. Attempt-04: una lectura dentro del mismo DO precedía por asOf a la nueva finalización clock_timestamp; la exclusión fue correcta. Attempt final separa escritura/lectura, usa preparing y actor explícito. Ninguna corrección modificó el SQL autorizado ni superficies compartidas.

El preflight propio tuvo dos errores offline de extracción de un template del verificador antiguo (final de línea y escapes del separador MD5); se corrigieron antes de la escritura candidata. La comparación con SQL correcto dio igualdad del ledger y catálogo: no fue una discrepancia real de migraciones instalada.

Pendientes: autenticación HTTP/refresh/expiry, perfiles inválidos bajo schema hipotético, RLS exhaustivo por objeto/rol, captura DST operacional completa, apertura/cierre con µs, rango personalizado multizona amplio, unavailable de panel completo, límites bigint/money máximos, descuento/ajuste/envío en todas sus variantes, pruebas con modificaciones concurrentes. No se ejecutaron benchmarks ni cargas. Estos límites impiden un PASS funcional integral incluso tras corregir SQL-05/07.

## Rollback y preservación

Cada intento terminó en ROLLBACK explícito; desde otra conexión READ ONLY se comprobó ausencia de las tres funciones. Catálogo completo, ACL, políticas, constraints, índices, ledger 124, fingerprint de perfiles y fingerprints de 15 tablas de datos coincidieron exactamente antes/después. También settings/state/productos/categorías/stock/triggers del inventario adicional permanecieron iguales. Las lecturas de comprobación terminaron igualmente con ROLLBACK. No hubo instalación persistente ni fixture sobreviviente.

La evidencia final registra hashes de los 2.772 archivos preexistentes actuales (incluidos los 2.752 del baseline anterior y todos los veinte artefactos de revisión). No se hizo commit, merge, rebase, push, deploy, adopción A+B/D1/C, modificación de captura o frontend. Solo archivos nuevos propios en este directorio.

Siguiente paso recomendado: autorización de revisión correctiva estática de SQL-05/07 y del harness, con nuevo candidato y hash separados; después nueva validación aislada antes de cualquier decisión T02. El candidato actual no debe confirmarse ni publicarse.
