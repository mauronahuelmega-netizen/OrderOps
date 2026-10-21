# Alternativas de optimización — diseño exclusivamente

No se ejecutó ninguna variante optimizada. Los beneficios siguientes son hipótesis, no benchmarks. No se proponen cachés persistentes, tablas, jobs ni nuevos índices como primera intervención.

| Alternativa | Causa que resuelve | Beneficio esperado / incertidumbre | Riesgo y complejidad | Memoria/concurrencia | Reversión |
|---|---|---|---|---|---|
| A. Digest de composición único por pedido dentro de una consulta | La vista invoker calcula source_items/digest para unidades, ventas y motivos; una misma fila repite esas expresiones. | Reducir trabajo por recorrido; límite superior teórico 3→1 evaluaciones, sin prometer reducción global de 3x. Alta confianza en eliminar repetición; costo residual RLS desconocido. | Media: preservar exactamente fuente, orden y MD5, no sustituir validación con snapshot histórico sin comparación actual. | Materialización local O(pedidos + líneas). Spill si work_mem insuficiente; RLS sigue vigente. | Restaurar definición anterior de lectores mediante migración revisada, sin tocar captura ni datos. |
| B. Núcleo compartido legacy + series | Legacy y extensión releen la misma vista; incluso legacy tiene recorridos separados para métricas/rankings/buckets. | Mayor impacto conjunto con A: preparar hechos una vez y consumirlos varias veces. La proporción de tiempo de composición medida sugiere prioridad, no una garantía de p95. | Alta: conservar todo JSON legacy, paginación, revision/requestKey y calidad, además de series. Eliminar llamada legacy interna exige nuevo ensamblador equivalente. | Relación materializada por consulta, sin sharing entre usuarios; evitar duplicar JSON ancho en memoria. Mantener presupuesto de puntos. | Wrapper original y cuerpo original guardados como artefacto aprobado; forward migration de reversión sin drops de estructuras ni backfill. |
| C. Composición set-based desde claves de pedidos seleccionados | source_items ejecuta joins, RLS y agregación JSON repetidos por pedido. | Puede mejorar costo por línea y planificación, especialmente varias líneas; no se midió implementación. Requiere pruebas con nulos, parents/identidades y RLS. | Alta: un join mal condicionado multiplica líneas o permite identidad extranjera. Mantener source_items de captura intacta inicialmente. | O(líneas del período); materializar solo claves necesarias y digest. Hash/sort puede derramar; medir bytes y temp buffers con varios lectores. | Volver al lector anterior; no cambia capturas/finanzas. |
| D. Autorización estabilizada a nivel de request | statistics_can_read se repite por RLS y funciones. | Menos comprobaciones accesorias si A/B/C reducen filas/recorridos. Efecto residual desconocido; auth representó ~40% inclusive en perfil extendido. | Muy alta si se cambia RLS/definer. Primera propuesta conserva todas las políticas y evita bypass; cualquier cambio posterior de políticas exige revisión independiente. | No caché global; ninguna autorización proporcionada en JSON. Contención de profiles no demostrada. | No cambio de RLS en primera fase; futura reversión de políticas requeriría migración específica. |
| E. Nuevos índices o estadísticas | Escaneos secuenciales y estimaciones imprecisas en fixtures transaccionales. | No hay evidencia suficiente para un nuevo índice. Los índices de negocio/período/PK/identidad ya existen. Estadísticas frescas pueden cambiar planes, pero aquí no se aplicó ANALYZE. | Baja/alta según índice, con impacto en escritores y despliegue; no autorizar por observar Seq Scan en una tabla pequeña. | Más WAL, locks, storage y mantenimiento de captura si se añaden índices. | Ningún índice propuesto todavía; no hay reversión requerida. |
| F. JIT/settings | Potencial costo de compilación/configuración. | Los samples con jit_off no demuestran mejora estable. No explica por sí solo la repetición de composición ni el outlier. | Configuración compartida no autorizada; rechazada como solución principal. | No se alteraron defaults; SET LOCAL solo para diagnóstico. | Fin de conexión restaura settings de sesión. |

## Diseño SQL de A

Esquema relacional de diseño, no función/migración ejecutable. Los límites de ambos períodos, cortes de sesión y tenant se obtienen con las reglas actuales antes de seleccionar claves. Los nombres de relaciones locales no crean tablas.

```sql
WITH eligible AS MATERIALIZED (
  SELECT c.*, f.agreed_total AS current_agreement
  FROM public.order_statistics_completions c
  JOIN public.orders o ON o.id = c.order_id
    AND o.business_id = c.business_id AND o.status = 'completed'
  LEFT JOIN public.order_financials f ON f.order_id = c.order_id
    AND f.business_id = c.business_id
  WHERE c.business_id = v_business AND c.active
    AND c.completed_at <= v_as_of
    AND (c.commercial_date BETWEEN v_current_start AND v_current_end
      OR (v_compare AND c.commercial_date BETWEEN v_previous_start AND v_previous_end))
), digests AS MATERIALIZED (
  SELECT id, private.statistics_source_digest(
    private.statistics_source_items(order_id, business_id)) AS current_digest
  FROM eligible
), effective AS MATERIALIZED (
  SELECT e.*, d.current_digest
  FROM eligible e JOIN digests d USING (id)
)
SELECT * FROM effective;
```

El núcleo real debe mantener las condiciones date_reliable/date_conflict, comparación temporal habilitada y filas históricas sin fecha por vías separadas. El fragmento no pretende reemplazar esas reglas. Las expresiones de effective_units, effective_sales y reasons se trasladan literalmente y utilizan current_digest; no se simplifican NULL/IS DISTINCT FROM. Debe comprobarse mediante planes que el digest se evalúa una vez por pedido y que no se calcula para períodos/negocios descartados. Un LATERAL sin MATERIALIZED no garantiza esa propiedad: el planner puede inlinear y repetir expresiones.

## Diseño SQL de B y C

Una única expresión SQL invoker debe construir, en el mismo snapshot, `principal`, resolución temporal, `eligible`, `digests`, `effective`, asignación current/previous y conjuntos de líneas históricas. Sus consumidores construyen métricas, rankings/productos/categorías legacy y pertenencia a buckets; no vuelven a llamar a la vista ni a la RPC base. Alternativa inicial: función núcleo interna que devuelve el JSON final, wrappers legacy y público consumen ese resultado según el contrato. Nunca obtener datos mediante una segunda sentencia ejecutada fuera del mismo snapshot.

Para C, `selected_orders AS MATERIALIZED` contiene claves originales autorizadas; `live_lines AS MATERIALIZED` realiza los mismos joins orders/items/active identity snapshots/products, validación del parent y predicados de negocio de source_items. Una agregación por order_id produce el JSON idéntico ordenado por i.id y luego el mismo digest. No utilizar las líneas de completions como sustituto de validación de líneas operativas actuales: detectan cosas distintas. La finanza canónica continúa order_financials y el agreed_total capturado debe seguir reconciliándose con ella.

Los Seq Scan con 100 loops son un riesgo adicional: reducir llamadas lineales de composición no asegura eliminar joins con trabajo aproximadamente cuadrático. Diseñar relaciones locales MATERIALIZED de orders y finanzas elegibles por tenant y claves capturadas, con autorización invoker vigente, para consumir cada conjunto una vez. Revisar planes de joins/semi-joins e índices existentes con cardinalidades reales; no forzar hint/settings ni asumir que una CTE elige por sí sola un plan eficiente. El candidato debe demostrar reducción de loops/visitas y mantener la reconciliación con finanzas actuales. Materializar todas las finanzas de un negocio histórico sería otro riesgo: restringir claves/fechas antes y medir que no se amplía innecesariamente el conjunto.

## Índices existentes y filtros

Consultar las definiciones reales en baseline.json y los planes. Hay índices de completions por business_id/commercial_date/completed_at activos, identidad activa por source_item_id, order_items por orden, order_financials por clave y sessions por negocio/apertura. La propuesta primero filtra por tenant/fechas antes de leer composición. Un Seq Scan en una tabla de ~100 filas y stats desactualizadas puede ser correcto; no acredita ausencia de índice útil. No se obliga al planner ni se desactiva seqscan.

## Priorización

Proponer A+B como primera implementación revisable P03-F.2, manteniendo funciones/políticas de captura y permisos. C queda como segundo cambio si el perfil posterior demuestra necesidad y equivalencia diferencial. D/E se estudian solo con evidencia residual. No crear una migration única que mezcle refactor de lectores, cambios RLS e índices.
