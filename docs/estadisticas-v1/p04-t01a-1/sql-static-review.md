# P04-T01A.1 — revisión correctiva estática

Veredicto: **READY_WITH_LIMITATIONS**. El candidato corregido es revisable para una futura validación aislada con autorización nueva de su hash. No está instalado, compilado ni certificado en runtime. Se mantiene la detención antes de T01B/T02.

## Identidad y alcance de evidencia

- Worktree: `OrderOps-Estadisticas`; rama `codex/estadisticas-v1`.
- HEAD: `923300265323d411c5c91b7935472d5423d228d2`.
- Original confirmado: `99a5d3e9dd879bb11b92abebc377a5cbdc7ebc08d75b9eed8280f88e4f5e2f23`.
- Revisado: `a66ce3ea73bf4a4421c60b77376914f232b4470d41df7d661ee38142c4a29ba8`.
- Copia íntegra de todos los nueve artefactos originales en `original/`. No se sobrescribe el SQL ni su evidencia anterior.
- La evidencia anterior `PASS_STATIC_ONLY` comprobaba gramática, pero no vinculaba nombres ni detectaba la dependencia circular. Esa etiqueta no demostraba compilación. Se conserva como evidencia histórica, con esta corrección explícita.
- Fuentes: migraciones locales reales, lector, contratos y decoder existentes. Ninguna conexión a PostgreSQL, API, Docker o producción. El catálogo live anterior no prueba el catálogo actual; deberá revalidarse en la futura fase autorizada.

## Hallazgos clasificados

| ID | Severidad / estado | Hallazgo y tratamiento |
|---|---|---|
| SQL-01 | Bloqueante de compilación / corregido | `totals` se referenciaba dentro de su definición no recursiva. Nuevo `missing_counts`, anterior e independiente, cuenta pedidos sin líneas mediante `NOT EXISTS`. Todos sus consumidores leen ese único escalar. |
| SQL-02 | Alta, incompatibilidad JSON / corregido | Un grupo solo de upsells puede tener unidades verificadamente vacías y `SUM(units_value)=NULL`. Con denominador positivo su métrica decía `0` y su participación `NULL`, rechazado por el decoder. Se usa el valor de la métrica para categorías y cero únicamente probado para ranking. Desconocidos conservan `NULL`. |
| SQL-03 | Seguridad de publicación / pendiente antes de instalación persistente general | Los grants propuestos a `authenticated` exponen la RPC de Productos por PostgREST independientemente del gate HTTP. No se modificaron; estrategia restringida en el informe de seguridad. |
| SQL-04 | Limitación de evidencia / pendiente runtime | Parser de gramática y revisión de fuentes no equivalen a compilación PL/pgSQL, resolución en catálogo, ACL o RLS efectivas. |
| SQL-05 | Compatibilidad de cursor / riesgo conservado | `requestKey` incluye representaciones textuales de fecha/instante dependientes de TimeZone/DateStyle de la conexión. Cambios entre páginas pueden rechazar un cursor válido; no se cambia ese contrato aquí. Exigir parámetros constantes y prueba cruzada antes de aceptar paginación. MD5 es una clave de continuidad, no una firma de autorización. |
| SQL-06 | Escalabilidad / no medido | Vista efectiva original puede reevaluar composición; rankings/categorías agregan todas las líneas elegibles. Límite de página 20 no limita silenciosamente el universo. No se adopta ninguna optimización. |
| SQL-07 | Robustez de fuente / pendiente runtime | `order_financials` admite importes que su CHECK positivo no excluye explícitamente como NaN. Ventas capturadas exigen evidencia finita, pero un importe no reconciliado NaN podría llegar a `pendingAgreedTotal` y ser rechazado por el decoder. No se convierte a cero ni se cambia el contrato financiero. Preparar prueba y elevar cualquier corrección de fuente por separado. |

## Diff y dependencias entre CTE

`candidate-products.diff` contiene exclusivamente cambios en una nueva copia. Se mantienen idénticos el preámbulo, firmas/defaults, autenticación, períodos, asOf, revisión, cursor, histórico global, wrapper y ACL propuestos.

Grafo acíclico revisado:

| CTE | Fuentes / columnas relevantes |
|---|---|
| facts | Vista `public.statistics_v1_effective_facts`; `f.*`; negocio, fecha comercial fiable, período inclusivo y `completed_at <= asOf`. |
| lines | facts + completion_items + lateral item_snapshots; `i.*`, `completed_at`, `units_value`, `income_value`, `category_key_identity`, `category_kind`. |
| missing_counts | facts + lines; una fila, `missing bigint`, incluso con cero hechos. No depende de grouped/totals/ranked/categories. |
| grouped | lines; identidad, etiqueta, sumas y cuatro conteos. |
| totals | lines + missing_counts; métricas, denominadores y missing. Aggregate sin GROUP BY garantiza una fila. |
| ranked | grouped; posición y filtro positivo del indicador seleccionado. |
| categories | lines + missing_counts; clave, etiqueta, métricas y sumas. |
| SELECT final | totals, facts, lines, missing_counts, ranked, categories; ninguna referencia hacia un CTE posterior dentro de su propia definición. |

El parser extrae RangeVar del árbol de cada CTE y verifica precedencia; el original falla deliberadamente como control negativo. El chequeo no implementa el binder de PostgreSQL.

Ámbitos revisados manualmente: `f`/`i`/`proof` en lines; `s` en lateral, correlacionado a `i.line_key` y `f.order_id/completed_at`; `f` y `l` en NOT EXISTS; `g` en ranked; `t` en SELECT final; `r` en agregado de ranking; `l` correlacionado a `r.product_identity`; `x` proyecta category_kind/category_identity; `c` en agregado de categorías. Las columnas derivadas se consumen solo desde CTE posteriores. Los nombres sin alias en grouped/totals/categories pertenecen a lines; no se reutiliza un alias SELECT dentro de su misma proyección.

## Firmas y fuentes reales

| Objeto | Contrato usado / prueba en fuentes |
|---|---|
| profiles | `id uuid` PK, `business_id uuid` nullable para perfiles de plataforma, `role text`; consulta por `auth.uid()`, sin normalización de rol. Base `20260426214500_t1_businesses_profiles.sql`, rol añadido en `20260427021000_super_admin_roles_and_rls.sql`, negocio nullable en `20260427030000_super_admin_profiles_nullable_business.sql`, restricciones de roles en `20260516201000_s1_business_roles.sql`. |
| business_settings | `business_id uuid` PK; timezone text añadido en `20260926010000_shared_core_expand.sql`, validación IANA. Sin fila/NULL devuelve configuración requerida. |
| store_sessions | id PK, business_id uuid, opened_at/closed_at timestamptz, status text. Índice único `store_sessions_one_open_per_business_idx` por negocio donde open y closed_at NULL. No se encontró eliminación posterior del índice en migraciones locales. |
| session_snapshots | session_id PK; business_id uuid; commercial_date date, opened_at timestamptz, source_quality text. PK + índice operativo prueban cero/una sesión verificable, sin selección arbitraria. |
| completions | id PK; order_id/business_id uuid, completed_at timestamptz, commercial_date date, timezone text, active/date_conflict boolean; agreed_total numeric(14,2), main_units bigint. Índice único activo por pedido. |
| completion_items | PK(completion_id,line_key); business_id uuid; identidad/categoría uuid nullable, etiquetas text; item_kind text product/upsell; quantity bigint; net_amount numeric nullable; FK completion_id/business_id. |
| item_snapshots | source_item_id/order_id/business_id uuid; generation bigint; captured_at timestamptz; identidad/categoría/etiquetas/source_kind. UNIQUE(source_item_id,generation). |
| order_financials | order_id PK y UNIQUE(order_id,business_id); agreed_total numeric(14,2). No multiplicación en el LEFT JOIN financiero. |
| effective_facts | `c.*` + current_agreement numeric(14,2), date_reliable boolean, effective_units bigint nullable, effective_sales numeric(14,2) nullable, reasons text[]. Vista security_invoker/security_barrier definida en `20261013003000_statistics_v1_reads_security.sql`. |

Las cinco estructuras y sus columnas se extraen también del AST de la migración de estructuras, registradas en `static-tests.json`. Esto confirma las definiciones fuente, no la presencia live.

Funciones propuestas, sin cambios de firma:

1. `private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint DEFAULT 0) RETURNS jsonb`; SQL IMMUTABLE, invoker, search_path pg_catalog. Función pura sin lectura de datos.
2. `private.statistics_v1_products_reader(text,date DEFAULT NULL,date DEFAULT NULL,text DEFAULT 'units',integer DEFAULT 5,jsonb DEFAULT NULL) RETURNS jsonb`; PL/pgSQL STABLE, invoker, search_path pg_catalog,public,private.
3. `public.statistics_v1_products` con la misma firma de seis argumentos; SQL STABLE, invoker, search_path pg_catalog,private; delega al lector.

## Cardinalidad, temporalidad y determinismo

- Hechos: una finalización activa por pedido; orders PK y financials PK conservan una fila por finalización. RLS puede excluir filas; no amplifica joins.
- Líneas: PK completion_id/line_key y FK compuesta impiden duplicación. Lateral devuelve cero/una evidencia mediante LIMIT 1; generation es única por source_item_id. Filtros de pedido, negocio y captured_at impiden evidencia posterior o de otro negocio. Ausencia de prueba produce desconocido.
- COUNT faltante: pedidos sin ninguna línea; no suma líneas, unidades ni histórico global al mismo contador. NOT EXISTS no multiplica filas. `missing_counts` tiene una fila sin GROUP BY.
- Ranking: GROUP BY UUID, nunca por nombre; valor seleccionado DESC y UUID textual COLLATE C resuelven empates. Posiciones ROW_NUMBER bigint, paginación tras agregación/filtro, máximo 20. Los productos sin importe positivo conocido no se inventan como ventas cero.
- Categorías: GROUP BY kind/UUID; orden explícito kind/UUID; etiquetas históricas seleccionadas por completed_at DESC, completion_id, line_key. Esos desempates son únicos. El selector y la futura agrupación Otras deben operar sobre la lista completa, preservando especiales; no se altera SQL para implementar una UI.
- Sesión abierta: unicidad probada en DDL, no por orden fortuito. Sesiones nocturnas atribuidas a commercial_date capturada, no a la fecha civil de cada línea. No reconstrucción por proximidad.
- asOf: timestamp con microsegundos, `<=` incluye exactamente el corte; ni date_trunc ni cast a milisegundos sobre completed_at. Cursor conserva el mismo asOf. Fecha comercial BETWEEN inclusivo sin buckets ni series individuales; DST proviene de timezone y snapshot verificado, sin nuevo cálculo de horarios ambiguos.
- Revisión: corresponde al estado actual; cursor incompatible se rechaza 22023. No promete reconstruir un snapshot histórico tras modificaciones. STABLE conserva snapshot MVCC de la sentencia; una página posterior es otra sentencia y exige continuidad validada, no una transacción histórica guardada.
- Histórico sin fecha: count global deliberadamente no acotado por período/asOf; advierte cobertura desconocida y no fabrica pertenencia temporal. Reaperturas/cancelaciones salen del universo activo; recompletado utiliza el ciclo nuevo.

## Finanzas, unidades, denominadores y cobertura

- Ingreso por línea únicamente si effective_sales disponible, desde net_amount capturado. La vista original exige agreed_total canónico igual al capturado, desglose copy_total_price, composición vigente y ausencia de conflictos. Captura original exige reconciliación completa, delivery cero y suma exacta; descuentos/ajustes/envío no atribuibles dejan ingresos no disponibles. No se distribuye residual ni se reemplaza por precio nominal.
- Unidades solo item_kind=product y effective_units disponible. Upsells aportan ingreso propio una vez y nunca unidades principales. No se suma importe del padre al hijo ni se reprecian personalizaciones. FK del padre no participa en una expansión del join.
- SUM(bigint) devuelve numeric entero exacto, serializado text; dinero SUM(numeric), ROUND(...,2) y texto, sin float. Conteos/posiciones bigint van a JSON como números: decoder exige safeInteger y falla explícitamente si se excede; no truncamiento ni redondeo silencioso.
- Denominadores incluyen todas las líneas verificadas del período, incluso identidad de producto desconocida. Las categorías particionan todas las líneas. Ranking no representa por sí solo el total; unidentified expone lo no atribuible a producto.
- Porcentajes: numerador del subtotal disponible / denominador positivo de la misma métrica, numeric exacto con redondeo a dos decimales. No equivalen a participación sobre ventas comerciales totales cuando cobertura parcial. Si denominador NULL/cero o valor de métrica desconocido, participación NULL. Redondeo por categoría puede impedir sumar exactamente 100, sin redistribución.
- Corrección SQL-02: valor vacío probado 0 produce share 0.00 con base positiva. Con desconocidos, historia sin fecha o pedidos sin captura, sum NULL permanece NULL; subtotal conocido parcial se conserva como parcial. No se reinterpretan desconocidos como cero.
- knownCount/unknownCount cuentan líneas por métrica (principales para unidades; todas para ingresos); missingCapturedOrders cuenta pedidos; historicalWithoutDate cuenta pedidos globales. Se mantienen dimensiones separadas y motivos unverified_lines/historical_without_date/uncaptured_orders.
- Calidad individual de producto/categoría recibe también advertencia global de histórico/faltantes: expresa cobertura general no atribuible, no demuestra que ese producto concreto existía en los pedidos desconocidos. unknownProductLines/unknownCategoryLines cuentan líneas de identidad desconocida, no necesariamente dinero/unidades conocidos.
- Categoría verificada exige UUID y nombre históricos. Sin categoría exige evidencia de snapshot anterior o contemporáneo, source_kind line_insert/identity_replacement, producto UUID reconocido coincidente, categoría y nombre NULL, nombre de producto coincidente. Capturador valida la existencia del producto en el negocio antes de guardar esa evidencia. NULL aislado, identity_unknown, prueba eliminada o discrepante → Sin atribución fiable. Nunca se consulta catálogo actual desde el lector para reconstruir categoría pasada.

## Pruebas realizadas y condiciones pendientes

`node docs/estadisticas-v1/p04-t01a-1/verify-static.mjs`: PASS, 183 comprobaciones estáticas (incluye revisión de ausencia de eliminación del índice en cada migración local) y 25 assertions de la suite existente del decoder. Parser outer SQL, ambos cuerpos SQL puros, SELECT relacional, grafo CTE y control negativo original, invariantes de fuentes/ACL/firma, regresión del decoder y fixtures sintéticos en memoria. Resultados detallados en static-tests.json y decoder-tests.json.

Se agregaron casos de main+upsell con producto/categoría propios, participación vacía conocida vs NULL incompatible, cinco conjuntos de pedidos sin líneas, desconocido sin cero, captura faltante y cinco casos puros de publicación. La suite original del decoder se ejecuta en memoria y su reporte se redirige al nuevo directorio; no sobrescribe evidencia previa. Los fixtures son modelos del contrato, **no resultados obtenidos del SQL**.

Antes de T01B: nueva autorización del hash y del modo de instalación restringida; identidad adversarial + live del aislado; comparar DDL/catálogo/ACL/índices actuales contra fuentes; confirmar firma ausente y colisiones; compilar PL/pgSQL y ejecutar SQL sintético en rollback; validar los ocho períodos, categoría ausente/desconocida, shares vacíos/parciales, unidades bigint, monetario exacto, cursor/asOf/microsegundos/DST, reopen/cancel/recomplete, roles originales y dos negocios, acceso directo, errores/SQLSTATE, decoder real y limpieza. No afirmar ninguna de estas pruebas runtime como ejecutada.
