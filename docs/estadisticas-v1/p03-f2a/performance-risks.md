# Rendimiento: análisis estático y límites

Demostrado previamente F.1: 900 lecturas source_items para 100 pedidos en extendida; 923ms inclusivos sobre ~1323ms instrumentados; tres recorridos costosos de hechos; Seq Scan orders/finanzas repetidos y outliers/timeout a 200. **No se midió ninguna mejora del candidato.**

El diseño contiene un call site source_items, protegido por CASE not composition_conflict, dentro de digests MATERIALIZED. La PK completion.id y la unicidad de joins permiten proyectar una vez por completion elegible. No implica ejecución real demostrada: verificar loops/counters con planes. La composición se mantiene por pedido; C set-based no se implementa. Historical count, lecturas de sesiones y RLS siguen originales.

eligible y digests se unen 1:1 por id. orders por id/business y order_financials por order/business deben conservar claves únicas originales. Si una constraint cambia, una fila duplicada puede generar varias evaluaciones y multiplicar dinero: gate de catálogo y assert de cardinalidad obligatorio. El candidato no agrupa para ocultar duplicaciones.

Se materializa cohort current + previous admisible una vez, se agrega JSONB ancho y se recupera el composite en consumidores legacy y serie. Esto elimina lecturas operativas repetidas, pero mantiene pases JSON y parte del costo de serialización. Materializaciones relacionales pueden usar work_mem/spill; variables JSONB/agg/transición PLpgSQL no están necesariamente limitadas por work_mem ni pueden derramar igual. Memoria por conexión crece O(completions del rango + datos JSON), multiplicada por concurrencia. No hay límite silencioso de pedidos; periodos amplios deben medirse. Bundle permanece vivo mientras la serie se ensambla, por lo que coexisten legacy JSON, effective JSON y v_facts.

Riesgo de planes: stats del fixture no confirmado pueden favorecer Seq Scan correlacionado en eligible, aun con índices PK/período existentes. Reducir tres recorridos no elimina necesariamente complejidad cuadrática de los joins RLS. Evaluar visitas/loops, estimates, buffers y tiempo; no prometer index scan ni forzar planner. No se añaden índices ni ANALYZE a este candidato.

El tipo compuesto de vista evita definir tablas/tipos nuevos, pero depende de sus columnas/typmods. Roundtrip numeric debe mantener escala exacta; timestamptz debe conservar microsegundos y timezone de las reglas. La copia exacta del tramo temporal conserva fórmulas, no prueba su comportamiento tras recibir el nuevo cohort.

STABLE es necesario para compartir snapshot entre los lectores en una sentencia. No habilita cache cross-statement ni protege contra cambios de rol/GUC dentro de una función futura. Diferencias de orden físico pueden cambiar arrays no ordenados aunque métricas coincidan; la prueba no debe normalizarlos. Volatility de dependencias y definiciones/ACL se sellan antes de F.2B.

Los objetivos p95 100≤500ms, 500≤1000ms, 1000≤1500ms, 5000≤3000ms se mantienen, sin estimación de cumplimiento. No elevar timeout, eliminar outliers, ocultar errores con ceros ni reducir campos/pedidos para declarar éxito. Una llamada base_candidate prepara bundle completo; su sobrecosto JSON puede contrarrestar ahorro en una consulta legacy pequeña. Debe medirse también legacy, no solo serie.
