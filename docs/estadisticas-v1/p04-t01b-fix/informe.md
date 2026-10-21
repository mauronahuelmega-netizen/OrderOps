# P04-T01B-FIX — corrección y revalidación

Veredicto: **PASS_WITH_LIMITATIONS**. SQL-05 y SQL-07 corregidos y revalidados. Una transacción candidata, ROLLBACK obligatorio, sin instalación persistente ni publicación. Ninguna autorización para T02 se presupone.

## Fuente, candidato y diff

Fuente inmutable: `docs/estadisticas-v1/p04-t01a-1/candidate-products-reviewed.sql`, SHA-256 `a66ce3ea73bf4a4421c60b77376914f232b4470d41df7d661ee38142c4a29ba8`.

Candidato nuevo: `candidate-products-fixed.sql`, SHA-256 **`57395a7920d95cf63c1b67fb8191e40272a26aeb445a4abe7bec4d822b99c2c1`**.

`candidate-products.diff`: exactamente dos expresiones SQL cambiadas. Revertirlas reconstruye íntegramente la fuente inmutable, comprobado antes de cualquier conexión SQL. No se cambió firma, default, CTE, permiso, RLS, captura, financials, Resumen, frontend, decoder ni fuente comercial. Sin series/evolución individual y sin adopción A+B/D1/C.

## SQL-05

La clave conserva negocio, período, rango, sort, revision y timezone del negocio. Fechas: `to_char(date::timestamp,'YYYY-MM-DD')`; el cast explícito a timestamp sin zona evita conversiones implícitas dependientes de TimeZone. Instante: `to_char(v_now at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`. US conserva los seis dígitos de fracción de segundo (resolución 1 µs). No se truncó asOf ni se cambió el timestamp de corte.

JSON del cursor permanece igual: offset/revision/requestKey/asOf. Cambia el contenido de requestKey; los cursores del algoritmo anterior se rechazan 22023, sin fallback. Se debe reiniciar desde la primera página. No hay clientes publicados que requieran aceptar ese cursor. MD5 sigue siendo clave de continuidad, nunca permiso: perfil original y negocio verificados siguen siendo autoridad.

PASS de continuidad: TimeZone Pacific/Auckland solo; DateStyle SQL, DMY solo; ambos simultáneos. Segunda página conserva instante asOf a precisión completa y entrega dos productos restantes. Cursor del algoritmo anterior, cursor ajeno/inválido y revision obsoleta siguen rechazados.

## SQL-07

Solo cambió `coverage.pendingAgreedTotal`: BOOL_OR identifica NaN/Infinity/-Infinity sobre el conjunto íntegro de pedidos con effective_sales NULL. Si alguno es no finito, total diagnóstico NULL; si no, suma y redondeo originales. No se filtran pedidos para sumar un falso subtotal, ni se convierte a cero. Se preservan unresolvedOrders, unknownCount, calidad y razones existentes.

| Caso real ejecutado | Resultado |
|---|---|
| NaN en un pedido | pendingAgreedTotal NULL; unresolvedOrders 1; ingreso conocido parcial 80.00; una línea de ingreso desconocido. |
| NaN + acuerdo finito no reconciliado 31 | pendingAgreedTotal NULL; unresolvedOrders 2; ingreso conocido parcial 50.00; tres líneas desconocidas, incluido upsell del pedido no reconciliado. |
| Dos acuerdos finitos no reconciliados 31 y 11 | pendingAgreedTotal 42.00; unresolvedOrders 2. |
| Siete acuerdos NULL | pendingAgreedTotal NULL; unresolvedOrders 7; ingreso unavailable, valor NULL y ranking por ingresos vacío. |
| Sin pedidos pendientes | pendingAgreedTotal NULL; unresolvedOrders 0. |

NULL junto a unresolvedOrders > 0 significa importe no cuantificable; NULL no equivale a ausencia de pedidos ni a cero. La misma representación `string | null` existente es suficiente: no se aplicó cambio TypeScript ni decoder. Los ingresos desconocidos no se atribuyen a productos/categorías; el subconjunto conocido mantiene calidad parcial.

Infinity/-Infinity no son representables en la columna numeric(14,2) actual. La expresión se probó adicionalmente con esos valores como numeric sin typmod; no se alteró la columna ni constraints para forzar datos imposibles. NaN sí se probó a través de la tabla, vista y RPC candidatas.

## Gate estático y preflight

PASS antes de conexiones SQL: 183 comprobaciones estáticas, 25 assertions de la suite del decoder, parser del candidato, cuerpos SQL y SELECT relacional, grafo CTE acíclico, invariantes de firmas/tipos/ACL/dependencias, reversión de las dos expresiones y AST de las tres funciones idéntico entre candidato y harness. PL/pgSQL se compiló y ejecutó posteriormente, no se dedujo del parser.

Preflight adversarial offline y live PASS: rama codex/estadisticas-v1, HEAD `923300265323d411c5c91b7935472d5423d228d2`, proyecto `orderops-statistics-v1-test-74718de66a41`, API 127.0.0.1:56321, DB 127.0.0.1:56322; cinco contenedores con salud verificada, red y dos volúmenes exclusivos, sin compartición por otros contenedores; ledger 124, 119 base verificadas y migraciones propias/source hashes intactos. Catálogo/ACL/políticas/constraints/índices y datos coinciden con referencia aprobada. Productos ausente, público Resumen original activo, A+B/D1 privados intactos y C ausente. No conexión a recursos de Cursor, producción o Majo Pastelería.

## Harness y ejecución

Harness SHA-256 **`7555a8dab26783f079df8a21bd5682a7c45a4353c3f76058e17bf17ff2c77864`**.

Payload SHA-256 `d4cc433c57be38bcf7ad239bda4b80f53062070479debf0ac3f5a4691b8c09fb`. Se retiraron únicamente BEGIN/COMMIT del candidato con offsets explícitos; tres definiciones/ACL exactas. Una transacción externa REPEATABLE READ; statement_timeout 15 s, lock_timeout 3 s; ningún COMMIT. Savepoints/subtransacciones restauran datos de cada caso. El runner efectivo es `run-controlled.mjs`.

Primero metadata/compilación vacía y fixtures imprescindibles; después ocho regresiones SQL-05/07. Solo tras PASS el runner envía el resto de la batería. Fallo en esas regresiones habría terminado en rollback sin enviar pruebas restantes. Resultado **91/91 PASS**, sin errores PostgreSQL top-level, timeouts ni fallos del harness.

Correcciones del harness: preparing válido; actor explícito por caso y negocio; escrituras/relecturas de recompletado en sentencias diferentes; upsell propio (dos productos empatados en 20.00, sin 30.00 atribuido al padre); orden estable por UUID; lógica de evidencia histórica sintética identificada; assertions separan límites asOf válidos de defectos. Las evidencias previas de intentos no se reescribieron.

## Matriz ejecutada

| Grupo | Evidencia / resultado |
|---|---|
| Roles y acceso directo | owner/manager/admin de dos negocios permitidos; operator/viewer/super_admin denegados 42501 en wrapper y reader privado. Sin sesión/perfil/negocio denegados. NULL/desconocido rechazados por constraints sin debilitar schema. |
| Claims y RLS | Metadata de rol/negocio manipulada no cambia autorización. RLS cross-tenant de fuentes; SELECT directo a seis relaciones analíticas/vista para los seis roles y dos negocios; profiles directo para los tres roles autorizados de ambos negocios. 51 registros de seguridad incluyendo acceso directo/cursor ajeno. |
| Períodos y Resumen | Ocho presets y nocturna: nueve diferenciales, campos compartidos de período exactos, unidades y dinero exactos. Mismo snapshot de sentencia; contratos JSON completos distintos conservados. |
| Identidad/categorías | Homónimos por UUID; renombre/eliminación conserva captura; categorías verificadas, ausencia probada y desconocida separadas. Sin categoría se simula con evidencia analítica explícita, no reconstrucción por catálogo. |
| Finanzas/upsells | Fuente canónica; subtotal reconciliado exacto; acuerdos/ajustes no atribuibles quedan parciales; upsell conserva ingreso propio sin sumar unidades; categorías solo upsell tienen 0.00% probado, sin NULL inválido. |
| Paginación/cursores | Top 5 + segunda página; empates UUID; tres cambios de configuración; antiguo/ajeno/inválido/revision obsoleta rechazados. |
| unavailable | Sin acuerdos cuantificables y composición invalidada: valores NULL, calidad unavailable, ranking vacío, sin cero nominal. |
| Numéricos | Reader devuelve 4.294.967.300 unidades exactamente como string, con ingreso parcial sin inventar atribución; helper conserva bigint máximo 9.223.372.036.854.775.807 y dinero 999.999.999.999,99 como strings exactos. |
| Temporalidad/estados | asOf +1 µs excluido, corte exacto incluido; jornada nocturna capturada; DST gap/fold del helper compartido y fecha comercial sintética almacenada; reapertura/cancelación seis pedidos, recompletado siete y una finalización activa. |
| Decoder real | **54 respuestas completas capturadas PASS, cero rechazadas**; products-read.ts inalterado. Se validaron también las respuestas de segunda página y los nuevos estados unavailable/parcial/NULL. Sin eliminación de campos ni reordenamiento de arrays. |

Matrices completas: regressions.json, sql-results.json, security-matrix.json, financial-history-matrix.json, summary-differential.json y decoder-results.json. Los logs conservan resultados y SQLSTATE observados de denegaciones esperadas.

## MVCC, rollback y límites

Observador SQL authenticated en otra conexión, mientras la transacción escritora seguía abierta: candidato no visible, cero pedidos sintéticos no confirmados visibles, Resumen original vacío y coherente. Esto prueba aislamiento de ese escenario concreto y ausencia de publicación accidental, no llamadas paralelas a la función nueva ni estrés. La función sin confirmar no es invocable desde otra conexión; no se instaló para ampliar esa prueba.

ROLLBACK explícito PASS; otra conexión confirmó ausencia de las tres funciones, grants y fixtures transitorios. Comparación exacta antes/después: catálogo, ACL, políticas, funciones originales, índices, constraints, ledger 124, 15 fingerprints de tablas, configuración/estado/productos/categorías/stock/triggers. Las comprobaciones se ejecutaron en READ ONLY y terminaron igualmente con ROLLBACK.

Preservación de los 2.862 archivos preexistentes actuales, incluyendo los 2.772 del baseline P04-T01B y sus noventa artefactos nuevos. Ningún commit ni cambio en archivos compartidos, gate HTTP, SQL histórico, captura o decoders. Las funciones candidatas permanecen ausentes al cierre.

Limitaciones expresas: no HTTP real/refresh/expiry; NULL/roles desconocidos no pueden persistirse bajo constraints actuales; Sin categoría operativa no originable hoy desde catálogo NOT NULL; no captura operacional exhaustiva durante DST ni todos los bordes de apertura/cierre; sin prueba paralela del candidato ni modificaciones financieras confirmadas por otra sesión; máximo bigint solo helper, agregado real probado sobre int32; no >100 productos ni todas las variantes comerciales de envío/descuento/ajuste. No se reabrieron benchmarks ni se certificó rendimiento/SLA.

Recomendación: aceptar estas dos correcciones y revisar el nuevo hash para la decisión posterior de T02. El plan existente exige backend probado y disponible en QA para integración: esta validación deja las funciones ausentes. Antes de pruebas UI live, autorizar por separado una instalación exclusivamente aislada y su política de exposición RPC; mantener gate/publicación cerrados. T02 — shell/ranking, transporte/presentación propios y regresión de Resumen — requiere autorización expresa; no se inició aquí.
