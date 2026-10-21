# Equivalencia por expresiones

Referencia: reference-functions.sql (núcleo A+B y ensamblador D1). proposed-functions.sql difiere únicamente como functions.diff. La restauración textual inversa exacta consta en static-audit.json. No equivale a igualdad runtime del original/A+B/D1/C.

| Expresión / bloque original | Traslado C y obligación |
|---|---|
| guard profiles/auth.uid, businessId check | Copia literal en ambas nuevas funciones; SQLSTATE 42501 preservado |
| validación período/rango/sort/límite/cursor | Copia literal; ocho presets, 22023 y errores idénticos |
| timezone/configuration_required | Copia literal y retorno anticipado; no materializar items si configuración ausente |
| v_now/cursor asOf/revision/requestKey/offset | Copia literal; timestamp microsegundos y key originales, sin tomar nuevo reloj para cada lector |
| v_reference, v_start/end, v_ps/pe, v_partial | Copia literal; sesiones abiertas/nocturnas, DST y anterior recortado |
| histórico global NOT EXISTS | Copia literal, no filtro nuevo de fecha/asOf; pedidos sin finalización fiable afectan calidad y comparación |
| sesiones/pairs/cuts/v_segments/v_previous_cutoff | Copia literal, ramas no disponibles y SQLSTATE sin nuevos defaults |
| eligible orders/completions/current_agreement | Copia literal, status completed y active, joins/finanzas/autorización intactos |
| digests CASE not composition_conflict | Copia literal, una evaluación elegible A+B, no ejecutar rama conflictiva |
| effective_units / effective_sales | Copia literal del digest, main_units, agreed_total y current_agreement IS NOT DISTINCT FROM, breakdown_source y conflictos; NULL no se convierte en cero |
| reasons array_remove | Copia literal, orden de motivos y valores desconocidos intactos |
| current_facts / previous_facts | Copia literal, negocio/fecha/asOf y membership parcial; CTE nueva consume estos resultados, no inventa IDs |
| product_lines | Mismo i.* + effective_sales/effective_units/completed_at y join completion_id; solo cambia relación i |
| products group_key/identity/label | Copia literal; histórico de nombres y ORDER BY del array, sin identidad de producto actual |
| products main_units/has_main/net/partial | Copia literal; solo item_kind product suma unidades, upsells conservan net e identidad, mismos guards globales |
| ranked row_number/sort/slice/count | Copia literal incl. COLLATE C, NULLS LAST, limit/offset; no truncar pedidos |
| categories sum/label/percentage | Copia literal, solo ventas conocidas, monto exacto numeric/round al serializar, guards de porcentaje; solo cambia product_lines indirectamente |
| all_products UNION | Copia literal salvo relación i anterior; no UNION ALL aquí ni nueva identidad |
| ruleEvidence sums current/previous | Mismos filtros identity/product/effective_units, sum y coalesce condicionado por quality/comparison; solo relación i |
| current/previous metrics | Misma statistics_metrics y histórico; no frontend financial recalculation |
| legacy buckets y bounds | Copia literal; JSON-recordset y métricas/bins no se optimizan adicionalmente |
| v_result completo / bundle | Mismos campos, strings numéricos, NULL, arrays y orden explícito; schema decoder intacto |
| D1 facts/sessions/lanes/groups/point_metrics | Copia literal incluyendo MATERIALIZED, guards CASE availability, microsegundos y presupuesto 200 |
| D1 intervals/slices/points/partition checks | Copia literal, correspondence por claves/intervalos, sin emparejar índice; membership y errores de conservación iguales |
| D1 totalComparisons/coverage/series return | Copia literal, exactitud por indicador y comparación ausente/parcial |

**Evaluaciones eliminadas:** accesos repetidos de base completion_items en cuatro sitios, sujetos al plan efectivo. **Conservadas:** digest, métricas A+B/D1, guard de cada función, políticas RLS al leer tablas, histórico global, finanzas. **Nueva evaluación compartida:** filtro de negocio y EXISTS current/anterior materializado una vez por sentencia. No hay nuevas fuentes de ventas ni capturas.

Riesgos observables: ruleEvidence.products jsonb_agg no tiene ORDER BY y categorías pueden empatar amount/label; categoría array_agg puede empatar completed_at/completion_id. El planner nuevo puede exponer orden distinto aun con el mismo multiset. No se agrega ordenamiento ni se normaliza para conseguir igualdad. La exigencia es igualdad JSONB completa (objetos sin orden intrínseco; arrays sí); discrepancia = detener, conservar caso mínimo y pedir autorización del arreglo. También verificar errores/SQLSTATE por orden de evaluación de guards/RLS, empty/NULL aggregates, y datos con constraints diferidas dentro de una transacción: C no puede avalarse solo con FKs validadas en estado committed.
