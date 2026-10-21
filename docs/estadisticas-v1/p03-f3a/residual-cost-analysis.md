# Costo residual medido

Original = public.statistics_v1_summary extendida activa. Candidato = private.statistics_v1_summary_candidate, sin tráfico público. Los labels crudos legacy/extended significan original/candidato, no legacy sin series.

| Pedidos | Original p50 ms | Original máximo ms | Candidato p50 ms | Candidato máximo ms |
|---:|---:|---:|---:|---:|
| 50 | 900.452 | 1343.508 | 287.770 | 651.807 |
| 100 | 1507.338 | 2054.178 | 288.888 | 307.580 |

Cinco muestras normales por función y volumen, una de calentamiento separada. p95 exploratorio = máximo con n=5; no sustituye F2B n=20 ni acredita el objetivo p95 de 500ms. Desviación poblacional del candidato: 50=143.504ms; 100=12.572ms. Instrumentadas: original/candidato 50=819.476/259.805ms; 100=1197.566/308.023ms. No combinar distribuciones instrumentadas y normales.

## Composición y autorización

Source_items original 450/900 llamadas frente a candidato 50/100. Digest candidato también 50/100. Confirmación empírica: una composición por finalización elegible en estos fixtures, un producto por pedido, sin conflicto, una jornada. El CASE omite composición en conflictos; este diagnóstico no certifica todas las combinaciones de calidad.

100 pedidos candidato: source_items inclusivo 115.770459ms, propio 62.571359ms; statistics_can_read 601 llamadas / 76.823009ms propios; digest 12.157730ms propios. La autorización incluye llamadas dentro de source_items: NO sumar su total a 115.770459ms. 50 candidato: source_items 57.892628ms inclusivos / 36.095137ms propios; autorización 1526 llamadas / 62.763812ms. No atribuir por conteos: la medición de tiempo demuestra impacto y los cambios de plan explican por qué los conteos no son lineales.

## Núcleo, joins y cobertura

Consulta eligible/digests/effective/jsonb_agg: 77.875ms y 50 pedidos; 156.945ms y 100, 3906 shared hits en el último caso. Incluye joins, autorización, composición y serialización; sus componentes NO son costos adicionales al padre.

En 100, orders y order_financials se recorren mediante Seq Scan dentro de 100 loops; Actual Rows promedio redondeado 50 por loop, aproximadamente 5000 filas emitidas por cada scan. Orders 597 shared hits, finanzas 300; completions usa Index Scan, 100 filas, 1 loop, 406 hits. En 50, ambos scans tienen 50 loops y promedio 26. Hay repetición demostrada; timing=off impide atribuir un tiempo propio exacto a cada scan. No afirmar que un índice nuevo resolverá esto: revisar primero materialización con RLS e índices existentes.

Historical count real en candidato de 50: 46.213ms, completions Seq Scan 50 loops / promedio 26 filas / 2650 hits. En 100 no aparece entre planes >=10ms; NO adjudicarle el costo de una sonda externa. La sonda SELECT equivalente de 100 genera otro plan y tarda 135.693–163.316ms, p50 148.570, 10446 hits. El parámetro obtenido con subconsulta de perfil cambia planificación frente al plan PL/pgSQL cacheado. Esto demuestra sensibilidad del conteo a la forma del plan, no que el candidato haya gastado 149ms allí. Mantener cobertura global fuera del filtro temporal.

## Series, JSON y rankings

Consulta series candidato 99.275ms (50) y 101.772ms (100), 0 shared hits, 0 temp writes. 235 calls statistics_metrics y 940 statistics_metric en AMBAS cohortes. En 100 metrics inclusivo 91.420493ms / propio 36.161461ms; metric propio 55.259032ms. Estos tiempos incluyen métricas legacy y series, no solo los 101.772ms de la consulta final. Costo fijo relevante incluso con pocos pedidos.

point_metrics no está MATERIALIZED y cm/pm se referencian en métricas y cuatro comparaciones. La combinación del SQL y 235 llamadas respalda evaluación repetida por inlining; el efecto causal de MATERIALIZED aún NO fue medido. El diseño para ese bloque deberá verificar 1 evaluación por lado disponible/descriptor; con 21 puntos y ambos lados disponibles se esperan aproximadamente 67 llamadas totales (21 buckets legacy + 2 resúmenes + 42 métricas de puntos + 2 checks), conservando checks independientes.

Sonda JSONB->composite y agregados simples: 2.631–3.017ms; deserialize+to_jsonb+jsonb_agg: 6.085–7.593ms, sin buffers de tablas. Incluyen parse del string GUC transaccional y no reproducen exactamente el costo de variables PL/pgSQL. Son proxies separados, NO sumables al núcleo. No justifican B como primer cambio. Bucket legacy candidato: 12.246/14.741ms; materializa facts desde JSONB una vez dentro de esa consulta. Rankings/categorías no superan 10ms como consulta aislada registrada; no cuantificar cero ni extrapolar a catálogo real: identidades sintéticas nulas dejan ruleEvidence vacío y no ejercitan su correlación por producto.

## Memoria, variabilidad y límites

Planes guardados incluyen materializaciones, sorts, hashes, loops y buffers. Sorts observados usan memoria (por ejemplo 25–35kB en series de 50); no hay temp blocks/spills observados. No mide toda memoria pico del backend ni memoria JSON de variables; no certificar work_mem ni concurrencia futura por estos tamaños. Recursos antes/después son snapshots, no máximos durante la ejecución. Sin deadlocks, errores ni timeouts. No 200+; no HTTP; no estrés ni paralelismo.

F2B p95 1251.597ms no tiene perfil propio. Hoy cinco consultas de 100 dieron 272.867–307.580ms y 50 alcanzó 651.807ms. Cambios de plan y costos repetidos están demostrados; la causa exacta de aquel outlier, JIT, contención de host u otros servicios no está demostrada. No declarar resuelto el p95.

