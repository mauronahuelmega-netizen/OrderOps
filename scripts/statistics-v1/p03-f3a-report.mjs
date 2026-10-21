import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const dir='docs/estadisticas-v1/p03-f3a';const load=f=>JSON.parse(fs.readFileSync(`${dir}/${f}`));const save=(f,x)=>fs.writeFileSync(`${dir}/${f}`,JSON.stringify(x,null,2)+'\n');const md=(f,x)=>fs.writeFileSync(`${dir}/${f}`,x+'\n');
fs.mkdirSync(`${dir}/plans`,{recursive:true});
const summarize=a=>{const s=[...a].sort((x,y)=>x-y),mean=a.reduce((x,y)=>x+y,0)/a.length;return {n:a.length,min:s[0],p50:s[Math.ceil(a.length*.5)-1],p95Exploratory:s[Math.ceil(a.length*.95)-1],max:s.at(-1),mean,stddev:Math.sqrt(a.reduce((x,y)=>x+(y-mean)**2,0)/a.length)};};
const nodes=(n,p='root')=>[{path:p,...Object.fromEntries(Object.entries(n).filter(([k])=>k!=='Plans'))},...(n.Plans??[]).flatMap((c,i)=>nodes(c,`${p}/${i}`))];
const cohorts=[];
for(const n of [50,100]){
 const x=load(`volume-${n}.json`);assert.equal(x.status,'PASS');assert.equal(x.rollback,true);
 const zero=x.functionStats.before,a=x.functionStats.legacy,b=x.functionStats.extended;
 const diff=(end,start)=>Object.fromEntries(Object.keys(end).map(k=>[k,Object.fromEntries(Object.keys(end[k]).map(c=>[c,Number((end[k][c]-(start[k]?.[c]??0)).toFixed(6))]))]));
 const functions={original:diff(a,zero),candidate:diff(b,a)};assert.equal(functions.candidate['private.statistics_source_items'].calls,n);
 let mode='original';const stages=[];
 for(const [i,p]of x.nestedPlans.entries()){
  const file=`${n}-${mode}-${i}.json`;save(`plans/${file}`,p);
  stages.push({mode,file,query:p.plan['Query Text'],inclusiveMs:p.durationMs,nodes:nodes(p.plan.Plan)});
  if(p.plan['Query Text']?.startsWith('EXPLAIN')&&p.plan['Query Text'].includes('SELECT public.statistics_v1_summary'))mode='candidate';
 }
 for(const [i,m]of x.measurements.entries())save(`plans/${n}-outer-${i}.json`,m.plan);
 cohorts.push({orders:n,normal:{original:summarize(x.measurements.filter(m=>/^legacy:[1-5]$/.test(m.label)).map(m=>m.executionMs)),candidate:summarize(x.measurements.filter(m=>/^extended:[1-5]$/.test(m.label)).map(m=>m.executionMs))},warmups:x.measurements.filter(m=>m.label.includes('warmup')),instrumented:x.measurements.filter(m=>m.label.endsWith('nested')).map(m=>({label:m.label,inclusiveMs:m.executionMs})),functions,stages,resourceBefore:x.resourceBefore,resourceAfter:x.resourceAfter});
}
const probes=load('component-probes.json');const probeSummary={};for(const name of ['historical','jsonRoundtrip','jsonReaggregate'])probeSummary[name]=summarize(probes.measurements.filter(m=>new RegExp(`^${name}:[1-5]$`).test(m.label)).map(m=>m.executionMs));for(const [i,m]of probes.measurements.entries())save(`plans/probe-${i}.json`,m.plan);
save('function-profile.json',{at:new Date().toISOString(),method:{normal:'EXPLAIN ANALYZE BUFFERS SETTINGS, default JIT, track_functions disabled; 1 warmup + 5 measured per RPC/cohort; alternating order; no HTTP measurement',instrumented:'One pair/cohort; transaction-local track_functions=all and auto_explain nested analyze buffers timing=off, notice JSON, minimum 10ms. Cumulative pg_stat_xact_user_functions differenced at execution boundaries; not global counters',inclusiveWarning:'Do not add parent/child inclusive times or parent/child buffer totals. selfMs is exclusive of tracked callees, not a complete attribution of SQL operator CPU. Timing instrumentation and logging change runtime.',p95Warning:'Five samples: exploratory nearest-rank p95 equals maximum; not an SLA certification.',limits:'Concurrency 1, query 15s, lock 3s. Fixture preparation retains existing 30s budget. CPU<=35%, container memory<=40% at gates; no host/global stress. Stop escalation at max>=5s. No 200+ planned.'},cohorts,probeSummary,probeMethod:probes.method,omitted:['200/500/1000/5000 by explicit bounded diagnostic scope','HTTP, parallel load and peak backend memory','Multi-product/modifier/upsell, previous-period facts, night/DST performance cohorts: not rerun; equivalence suite required before optimization','Queries below nested 10ms threshold are not individually attributed','Retrospective causal attribution of F2B 1251.597ms p95 cannot be recovered from uninstrumented samples']});
const c100=cohorts[1],c50=cohorts[0];const fmt=x=>x.toFixed(3);const table=cohorts.map(c=>`| ${c.orders} | ${fmt(c.normal.original.p50)} | ${fmt(c.normal.original.max)} | ${fmt(c.normal.candidate.p50)} | ${fmt(c.normal.candidate.max)} |`).join('\n');
md('residual-cost-analysis.md',`# Costo residual medido

Original = public.statistics_v1_summary extendida activa. Candidato = private.statistics_v1_summary_candidate, sin tráfico público. Los labels crudos legacy/extended significan original/candidato, no legacy sin series.

| Pedidos | Original p50 ms | Original máximo ms | Candidato p50 ms | Candidato máximo ms |
|---:|---:|---:|---:|---:|
${table}

Cinco muestras normales por función y volumen, una de calentamiento separada. p95 exploratorio = máximo con n=5; no sustituye F2B n=20 ni acredita el objetivo p95 de 500ms. Desviación poblacional del candidato: 50=${fmt(c50.normal.candidate.stddev)}ms; 100=${fmt(c100.normal.candidate.stddev)}ms. Instrumentadas: original/candidato 50=819.476/259.805ms; 100=1197.566/308.023ms. No combinar distribuciones instrumentadas y normales.

## Composición y autorización

Source_items original 450/900 llamadas frente a candidato 50/100. Digest candidato también 50/100. Confirmación empírica: una composición por finalización elegible en estos fixtures, un producto por pedido, sin conflicto, una jornada. El CASE omite composición en conflictos; este diagnóstico no certifica todas las combinaciones de calidad.

100 pedidos candidato: source_items inclusivo 115.770459ms, propio 62.571359ms; statistics_can_read 601 llamadas / 76.823009ms propios; digest 12.157730ms propios. La autorización incluye llamadas dentro de source_items: NO sumar su total a 115.770459ms. 50 candidato: source_items 57.892628ms inclusivos / 36.095137ms propios; autorización 1526 llamadas / 62.763812ms. No atribuir por conteos: la medición de tiempo demuestra impacto y los cambios de plan explican por qué los conteos no son lineales.

## Núcleo, joins y cobertura

Consulta eligible/digests/effective/jsonb_agg: 77.875ms y 50 pedidos; 156.945ms y 100, 3906 shared hits en el último caso. Incluye joins, autorización, composición y serialización; sus componentes NO son costos adicionales al padre.

En 100, orders y order_financials se recorren mediante Seq Scan dentro de 100 loops; Actual Rows promedio redondeado 50 por loop, aproximadamente 5000 filas emitidas por cada scan. Orders 597 shared hits, finanzas 300; completions usa Index Scan, 100 filas, 1 loop, 406 hits. En 50, ambos scans tienen 50 loops y promedio 26. Hay repetición demostrada; timing=off impide atribuir un tiempo propio exacto a cada scan. No afirmar que un índice nuevo resolverá esto: revisar primero materialización con RLS e índices existentes.

Historical count real en candidato de 50: 46.213ms, completions Seq Scan 50 loops / promedio 26 filas / 2650 hits. En 100 no aparece entre planes >=10ms; NO adjudicarle el costo de una sonda externa. La sonda SELECT equivalente de 100 genera otro plan y tarda ${fmt(probeSummary.historical.min)}–${fmt(probeSummary.historical.max)}ms, p50 ${fmt(probeSummary.historical.p50)}, 10446 hits. El parámetro obtenido con subconsulta de perfil cambia planificación frente al plan PL/pgSQL cacheado. Esto demuestra sensibilidad del conteo a la forma del plan, no que el candidato haya gastado 149ms allí. Mantener cobertura global fuera del filtro temporal.

## Series, JSON y rankings

Consulta series candidato 99.275ms (50) y 101.772ms (100), 0 shared hits, 0 temp writes. 235 calls statistics_metrics y 940 statistics_metric en AMBAS cohortes. En 100 metrics inclusivo 91.420493ms / propio 36.161461ms; metric propio 55.259032ms. Estos tiempos incluyen métricas legacy y series, no solo los 101.772ms de la consulta final. Costo fijo relevante incluso con pocos pedidos.

point_metrics no está MATERIALIZED y cm/pm se referencian en métricas y cuatro comparaciones. La combinación del SQL y 235 llamadas respalda evaluación repetida por inlining; el efecto causal de MATERIALIZED aún NO fue medido. El diseño para ese bloque deberá verificar 1 evaluación por lado disponible/descriptor; con 21 puntos y ambos lados disponibles se esperan aproximadamente 67 llamadas totales (21 buckets legacy + 2 resúmenes + 42 métricas de puntos + 2 checks), conservando checks independientes.

Sonda JSONB->composite y agregados simples: ${fmt(probeSummary.jsonRoundtrip.min)}–${fmt(probeSummary.jsonRoundtrip.max)}ms; deserialize+to_jsonb+jsonb_agg: ${fmt(probeSummary.jsonReaggregate.min)}–${fmt(probeSummary.jsonReaggregate.max)}ms, sin buffers de tablas. Incluyen parse del string GUC transaccional y no reproducen exactamente el costo de variables PL/pgSQL. Son proxies separados, NO sumables al núcleo. No justifican B como primer cambio. Bucket legacy candidato: 12.246/14.741ms; materializa facts desde JSONB una vez dentro de esa consulta. Rankings/categorías no superan 10ms como consulta aislada registrada; no cuantificar cero ni extrapolar a catálogo real: identidades sintéticas nulas dejan ruleEvidence vacío y no ejercitan su correlación por producto.

## Memoria, variabilidad y límites

Planes guardados incluyen materializaciones, sorts, hashes, loops y buffers. Sorts observados usan memoria (por ejemplo 25–35kB en series de 50); no hay temp blocks/spills observados. No mide toda memoria pico del backend ni memoria JSON de variables; no certificar work_mem ni concurrencia futura por estos tamaños. Recursos antes/después son snapshots, no máximos durante la ejecución. Sin deadlocks, errores ni timeouts. No 200+; no HTTP; no estrés ni paralelismo.

F2B p95 1251.597ms no tiene perfil propio. Hoy cinco consultas de 100 dieron ${fmt(c100.normal.candidate.min)}–${fmt(c100.normal.candidate.max)}ms y 50 alcanzó ${fmt(c50.normal.candidate.max)}ms. Cambios de plan y costos repetidos están demostrados; la causa exacta de aquel outlier, JIT, contención de host u otros servicios no está demostrada. No declarar resuelto el p95.
`);
md('alternatives.md',`# Alternativas sin implementar

## D1 — Materializar métricas de puntos (primera propuesta)

Causa medida: series ~102ms sin lecturas; 235 evaluaciones metrics con 100 y con 50, 91.420ms inclusivos para todas las métricas de 100. Cambio exacto previsto en la futura función privada nueva: cambiar exclusivamente \`), point_metrics as (\` por \`), point_metrics as materialized (\`; preservar SELECT, CASE ca/pa, cm/pm, joins descriptor+side y consumidores. No modificar membership, límites, orden de arrays, total checks ni private.statistics_metrics.

Beneficio esperado: evitar evaluación reiterada de las mismas expresiones puras por campo de JSON/delta. Cantidad prevista comprobable con contadores; milisegundos ahorrados hipotéticos, no prometer 65ms ni cumplimiento p95. Riesgo bajo relativo: metrics IMMUTABLE sobre rows ya agregadas, mismo statement MVCC; materialización cambia orden de evaluación, verificar SQLSTATE/NULL y ramas no disponibles. Sin cambios de autorización/RLS: trabaja sobre facts autorizados. Memoria por <=200 descriptores, dos JSON metrics y columnas del plan; ancho y pico aún desconocidos, no una tabla/caché. Más memoria por conexión, sin shared state. Compatible con candidato/original: nueva función paralela, no reemplazo ni RPC pública. Reversión: no adoptar; si se autoriza un lector posterior, restaurar definición/ruta mediante migración forward aprobada, sin borrar datos.

## A — Composición set-based

Causa medida: 100 source_items ~115.77ms inclusivos y 62.57 propios, más digest 12.16; ya se consiguió una llamada por pedido, pero cada una realiza lectura y joins autorizados. Diseño SQL previsto: reemplazar digests por CTEs materializados eligible_non_conflicted, source_lines, source_by_order, digests. source_lines copia EXACTAMENTE proyección de source_items: lineId, parent, kind, qty, precio/gross, identidad histórica/fallback, nombre/categoría y source_valid; unir una vez items con eligible.order_id+business_id, orders, snapshots activos y products manteniendo RLS. Agrupar \`jsonb_agg(line ORDER BY item_id)\` por order_id/business_id; LEFT JOIN a elegibles y COALESCE [] para pedidos sin líneas; invocar digest sobre ese JSON y conservar CASE de conflict. No volver a calcular finanzas desde esas líneas.

Beneficio hipotético: amortizar inicio de consulta, joins repetidos y comprobaciones explícitas repetidas; RLS sigue evaluándose en tablas leídas. No eliminar SECURITY DEFINER original de statistics_can_read ni sustituirlo por claims. Helper nuevo, si existiera, SECURITY INVOKER y guard propio con perfil original/negocio verificado; preferible CTE interno al lector guardado. Riesgo alto frente D1: exactamente mismos source_valid/parent same-order kind/product, snapshots activos, fallback, item omitido, orden/digest y semántica []/NULL. Cardinalidad: una fila por eligible completion y agregado por order+business, nunca unir ítems sin reagrupar ni contar upsells como unidades principales. Memoria O(total líneas elegibles), spill posible, concurrencia multiplica work_mem. Compatible mediante funciones privadas distintas y pruebas same-snapshot contra DOS referencias. Reversión sin datos: dejar originales/candidato previo activos, ninguna captura modificada. Prioridad segunda tras D1 y reevaluación de joins.

## C — Materializar ámbitos relacionales y anti-join histórico

Causa medida: orders/finance Seq Scan repetidos 100 veces; historical count 46.213ms en 50 y sonda100 135.693–163.316ms, pero menos de 10ms en ejecución candidato100. No sumar sonda a RPC.

Diseño SQL previsto: un scoped_orders MATERIALIZED \`SELECT id,business_id,status FROM public.orders WHERE business_id=v_business AND status='completed'\`; un reliable_active MATERIALIZED con la proyección order_id y EXACTO predicado original active/commercial_date/timezone/not date_conflict, bajo RLS; conteo global scoped_orders con NOT EXISTS sobre reliable_active, sin asOf ni período añadidos. No añadir negocio a la subconsulta original sin demostrar equivalencia por constraints/RLS. Para elegibles, usar scoped_orders y scoped_financials MATERIALIZED con SELECT order_id,business_id,agreed_total filtrado al negocio verificado y órdenes candidatas; unir por claves originales, preservar LEFT JOIN y IS NOT DISTINCT FROM. Capturas filtradas por reglas temporales originales antes del digest; cobertura global no limitada a esa cohorte. Confirmar unicidad active y finanzas antes de sustituir joins, no DISTINCT para ocultar multiplicación. Índices existentes solamente.

Beneficio incierto pero causa física demostrada: cambiar loops/anti-join hacia consultas de ámbito común; el planner puede seguir escogiendo nested loops y materializar puede empeorar negocios enormes. Memoria O(órdenes completadas globales + finanzas/capturas pertinentes); no limitar silenciosamente órdenes. Barreras RLS intactas, no prevalidación usada para bypass. Concurrencia/MVCC consistente, sin locks de escritura; snapshots grandes aumentan residencia. Compatible en núcleo privado nuevo, sin writers ni tipos compartidos. Pruebas de planes en 50/100, varios negocios, históricos sin fecha fuera de período y datos incoherentes antes de certificar. Reversión forward/restauración de routing aprobada; cero pérdida de datos. Prioridad tras D1, medir variante separada y no prometer beneficio en plan100 ya favorable al histórico.

## B — Agregación relacional sin roundtrip ancho JSONB

Causa medida/proxy: conversiones de 100 cuestan 2.631–3.017ms; conversión+reagregación 6.085–7.593ms. No dominan estas cohortes. Diseño previsto: núcleo relacional en UNA sentencia con facts MATERIALIZED, current/previous/product_lines/metrics/buckets/series consumiendo facts; construir solo JSON final. Es necesario reubicar consumidores ahora separados entre funciones PL/pgSQL, no compartir CTE entre sentencias ni usar temp tablas/cachés. Mantener validaciones/asOf/cursor/serieschecks y namespaces de helpers, guardar request metadata fuera de hechos financieros.

Beneficio hipotético mayor en 1000+ por evitar serialización de filas anchas; no medido aquí. Riesgo alto por refactor conjunto de contratos, orden de arrays no explícitamente garantizado, planificación y evaluación CASE; preservar orden efectivo original y comparar JSON sin normalizar. Memoria facts materializados, output JSON final todavía O(N); RLS sobre fuentes permanece activa, helpers invoker y guard propio. Concurrencia solo local a SELECT/STABLE, ningún shared cache. Compatibilidad paralela, no adopción pública. Reversión dejar original y candidato instalados intactos. Prioridad posterior salvo perfil que demuestre costo JSON dominante.

## D2 — Rankings, categorías y métricas relacionales

La cohorte actual no ejercita ruleEvidence con identidades reales de producto; no existe prueba para priorizar su refactor. Propuesta condicionada: agregar sumas por product_identity+side una vez y unir all_products, preservando NULL por historical/quality y no distinguir NULL inventando identidad. Para métricas, sustituir expansión JSON con aggregates relacionales solo tras demostrar equivalencia de razones, orden, redondeo, promedio y desconocidos. Riesgo monetario/NULL más alto que D1; memoria por grupos y ordenamientos, RLS en completion_items intacta. Reversión lector paralelo/forward. Exigir fixtures con productos, categorías, upsells y modificadores; no implementación en F3A.
`);
md('recommendation.md',`# Recomendación: segunda optimización privada, incremental

**READY_WITH_LIMITATIONS.** Preparar primero una variante privada paralela D1 que materialice point_metrics, conservando originales y candidato F2B. La causa medida es la repetición de métricas y ~102ms de la consulta de series, no el roundtrip JSONB. Segunda variante independiente: C para ámbitos orders/finanzas y conteo histórico, evaluada contra D1 y contra ambas referencias. A set-based requiere revisión semántica más extensa; preparar después si composición sigue siendo dominante. B y rankings sin evidencia de prioridad quedan diferidos.

No hay optimización instalada ni adopción. F3A no acredita p95 <=500ms en100; cinco muestras actuales no explican causalmente el p95 anterior de1251.597ms. No cambiar umbrales ni timeout15s.

## Entrada a una futura preparación, mediante autorización expresa

1. Autorizar diseño exacto D1 y funciones privadas nuevas; revisar nombres/versiones y hashes, sin sobreescribir cuatro originales ni candidato.
2. Mapa expresión por expresión: único cambio materialización; preservar firmas/defaults, SECURITY INVOKER, search_path, grants, guard propio raw profile y RLS. Ningún helper accesible confía en business JSON.
3. Preparar comparación completa JSON contra original y candidato F2B en mismo snapshot: ocho períodos, asOf/cursor, sort/paging, calidad/NULL, agreed_total/finanzas/upsells, historic coverage, reapertura/cancel/recomplete, DST/nocturnas, microsegundos/apertura/cierre/asOf, errores SQLSTATE, arrays sin normalizar. Reejecutar decoders sin cambios.
4. Seguridad primero: seis roles, desconocidos/NULL sujetos a constraints, ausencia/expiración, perfil sin negocio, claims manipulados, helpers directos y dos negocios. Cualquier ampliación de acceso detiene.
5. Solo con posterior hash autorizado instalar en aislado124+, con preflight adversarial/catálogo. Contadores instrumentados deben demostrar una metrics por lado disponible y descriptor, una source_items por elegible no conflictivo, checks de totales independientes. Contar también sesiones/DST/partial para que MATERIALIZED no active ramas inválidas.
6. Benchmarks normales separados: >=20 muestras si seguro, warmups alternados, p50/p95/max/stddev sin descartar outliers, 50/100 antes de200+; 15s query,3s lock,CPU35%/mem40% como gates, máximo>=5s impide escalar. Conservar p95 objetivos100<=500,500<=1000,1000<=1500,5000<=3000ms. Concurrencia acotada y memoria pico cuando haya autorización y capacidad; no incrementar timeout.
7. Detención por hash/identidad/catálogo divergente, leaks, JSON/SQLSTATE diferente, duplicación/membership/200puntos, errores, spills/degradación o recursos. No reparar automáticamente con otro hash.
8. Reversión segura: público sigue original; lectores privados previos intactos. Una eventual adopción y reversión de rutas requiere aprobación y forward migration específica, sin DROP/TRUNCATE/reset ni modificación de snapshots/datos.

La estimación de llamadas es verificable; el beneficio de latencia y p95 permanece hipotético hasta instalar y medir la variante autorizada. No agrupar A+B+C+D de una vez: impediría identificar causa y aumentaría riesgo.
`);
md('informe.md',`# P03-F.3A — Perfilado del costo residual

Veredicto **READY_WITH_LIMITATIONS**. Recomendación concreta: materializar point_metrics en una futura función privada paralela, antes de una reescritura amplia de JSON; evaluar por separado materialización de joins/conteo histórico y composición set-based.

Preflight y cierre: rama codex/estadisticas-v1, HEAD ${load('baseline.json').head}; proyecto exclusivo orderops-statistics-v1-test-74718de66a41, API127.0.0.1:56321 y DB127.0.0.1:56322, cinco contenedores sanos, red y dos volúmenes del manifest. Ledger124; candidato SHA fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9, fuentes/funciones/ACL/policies/constraints/índices iguales a F2B. RPC pública original activa. Ver baseline y final-preservation para identidad y catálogo completos.

| Pedidos | Original p50 ms | Original máximo ms | Candidato p50 ms | Candidato máximo ms |
|---:|---:|---:|---:|---:|
${table}

Cada valor usa cinco muestras normales seriales, warmup separado y timeout15s. p95 exploratorio coincide con máximo; no es certificación de objetivos. Funciones instrumentadas y planes anidados están separados en function-profile.json y plans/.

Hallazgos: candidato logra 50/100 composiciones para50/100 pedidos frente450/900 originales. En100 la composición inclusiva cuesta115.770ms y la consulta de series101.772ms; metrics se evalúa235veces independientemente del volumen. Núcleo156.945ms incluye composición y joins: no sumar al anterior. Scans de orders y finanzas100loops demuestran repetición. Historical count tiene sensibilidad al plan; candidato50=46.213ms, candidato100 por debajo del umbral10ms, mientras sonda100=135.693–163.316ms con plan diferente. JSONB proxies2.631–7.593ms: no prioridad inicial.

Pruebas ejecutadas: adversarial offline, identidad live por cohorte y cierre, catálogo124/candidato/original, dos transacciones fixture con14EXPLAIN cada una (2warmup+10normal+2instrumentadas), transacción de sondas100 con18EXPLAIN (3warmup+15normal). Queries autenticadas con usuario owner sintético; configuración track/auto_explain/jit solo LOCAL, sin persistencia ni instalación. Rollback y conteos vacíos comprobados tras cada cierre. Todas completaron sin timeout/error/deadlock.

No200+: alcance acotado50/100 suficiente para perfil; omisión deliberada, no atribuir a gate fallido. No estrés, HTTP ni múltiples lectores. No pico de memoria de backend; no spills observados en planes. No nuevas pruebas de equivalencia funcional ni seguridad completa: sin cambios SQL que certificar; deberán ejecutarse antes de adoptar otra variante. Fixture actual una línea producto sin identidad, misma jornada, comparación previa sin hechos; costos de categorías/ruleEvidence ricos y DST/períodos grandes siguen inciertos. No recuperar causalmente el outlierF2B ni declarar resuelto p95.

Preservación: cambios solo en documentación/scripts propios F3A y archivos runtime locales ignorados. Sin migraciones/DDL/grants/RLS, sin modificación de funciones instaladas ni RPC pública, sin commits ni servicios iniciados/reparados. Archivos anteriores hash-preservados, datos sintéticos rollback. Inventario completo y SHA en evidence.json; planes crudos y perfiles permanecen reproducibles, sin tokens ni credenciales en documentos.

Artefactos: baseline.json, function-profile.json, plans/, residual-cost-analysis.md, alternatives.md, recommendation.md, evidence.json; complementos before/after/results/volume50/100/component-probes/preservation/final-preservation. Scripts propios inventariados en evidence; reutilización de fixture F1 sin cambiarlo. Detención al finalizar F3A: ninguna adopción pública ni nueva optimización autorizada.
`);
console.log('Prepared profile, raw plans, analysis, alternatives and recommendation.');
