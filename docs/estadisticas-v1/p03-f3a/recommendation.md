# Recomendación: segunda optimización privada, incremental

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

