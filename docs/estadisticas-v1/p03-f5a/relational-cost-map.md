# Mapa relacional y costo

Fuente medida: ../p03-f4a/profile/volume-50.json, perfil D1; nestedPlans[13] histórico, [14] cohorte/digest, [15] ensamblador legacy, [17] series, [18] lector. Referencia agregada: ../p03-f4a/resource-profile.json. No son mediciones nuevas.

| Relación / trabajo | Sitios originales | Tratamiento C | Evidencia / límite |
|---|---|---|---|
| profiles | guard del ensamblador, guard del core, policies/helper | Sin cambio | Perfil original y negocio; imprescindibles en invocaciones directas |
| orders + completions | histórico global, elegibilidad | Sin cambio | Histórico 35,682 ms / 2.654 hits; dos semánticas distintas |
| order_financials | join de elegibilidad, fuente agreement | Sin cambio | A+B ya comparte current_agreement; sin desglose de costo financiero aislado |
| source_items / digest | una composición por elegible no conflictivo | Sin cambio | D1 50 source_items; composición temporal/financiera intacta |
| effectiveFacts | JSON → recordsets en núcleo, buckets, serie | Sin cambio | Roundtrip no perfilado aisladamente; evitar cambios adicionales |
| completion_items | product_lines, previous all_products, sumas correlacionadas current/previous por producto | Una relación autorizada materializada para cuatro sitios | Legacy consumer 83,017 ms / 5.050 hits incluye otros operadores y RLS; no atribuir todo a items |
| product_lines | productos y categorías | Misma CTE y expresiones | PostgreSQL puede ya materializar por referencias múltiples |
| ruleEvidence | recorridos por identidad | Misma correlación sobre CTE | Reduce accesos base potenciales, no la complejidad O(productos × líneas) |
| session snapshots/store_sessions | comparación y intervalos | Sin cambio | 47,265 ms series incluye métricas D1, sin reducción nueva |
| statistics_can_read | explicit eligible, source_items, políticas de tablas | Todas las barreras conservadas | 3.976 llamadas / 124,868 ms propios en D1, no atribución por tabla completa |

En nestedPlans[15], el nodo Seq Scan de completion_items que alimenta product_lines tiene Actual Loops=50, Actual Rows=50 por loop, Shared Hit Blocks=5.050 y Filter=statistics_can_read(business_id). Esto demuestra relecturas incluso dentro del primer sitio: 2.500 filas devueltas entre scans, antes de su join, no 2.500 líneas distintas. Los otros tres scans aparecen con loops=0 en ese caso concreto. Por tanto no se atribuye costo medido a ramas no ejecutadas; datasets con comparación válida y unidades conocidas deben ejercitarlas. El nuevo barrier MATERIALIZED pretende impedir este rescan base además de compartir los cuatro sitios.

La autorización repetida de la misma fila al releer completion_items puede evitarse reutilizando **el resultado del SELECT RLS**, nunca sustituyendo la política por un booleano cliente. La materialización conserva una barrera por acceso a la tabla base; el planner determina cuántas filas evalúa y cuántas llamadas efectivas quedan. No se promete exactamente una llamada por línea.

La CTE recibe filtros antes de materializar: business_id verificado y EXISTS en current_facts/previous_facts. Esos facts ya aplican active/status, fecha fiable, asOf, fechas comerciales y recortes parciales. No se agregan filtros de calidad financiera: las líneas de ventas desconocidas deben seguir participando en calidad/unidades cuando corresponde. EXISTS evita multiplicación aunque un ID aparezca en ambos lados; UNION ALL solo se usa dentro de EXISTS y no expande filas.

El FK (completion_id,business_id) → completions(id,business_id) prueba que el filtro adicional business_id no descarta una línea de un fact autorizado válido. PK (completion_id,line_key) conserva cardinalidad original. No se une por order_id, que podría agrupar múltiples ciclos; no se incorpora una reapertura inactiva. Constraints históricas deben revalidarse live antes de instalar.

El histórico es deliberadamente global: completed orders sin finalización activa de fecha fiable, independiente de asOf y ventana. Limitarlo ocultaría cobertura desconocida. Mejorarlo exige demostrar plan/índices y misma semántica; C lo deja intacto. El conjunto retenido de items está acotado lógicamente, pero un scan físico completo sigue siendo posible. No se cambian índices para ocultar esa limitación.
