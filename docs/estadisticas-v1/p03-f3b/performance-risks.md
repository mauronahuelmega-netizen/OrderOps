# Rendimiento: diseño, no medición de D1

Evidencia F3A, no resultado D1: 100pedidos, series101.772ms,235calls metrics,940metric; metrics91.420ms inclusivos incluye legacy+series. Fuente100 llamadas; núcleo156.945ms. No sumar inclusivos. MATERIALIZED busca reducir repetición, no eliminar trabajo de composición ni resolver historical/joins; A/B/C/rankings diferidos.

Riesgos: CTE materializado puede aumentar ancho/tuplestore y cambiar planificación, streaming y momento de evaluación. <=200puntos limita filas, no bytes ni memoria total. Dos métricas JSON por descriptor y p.*; work_mem por nodo/reader, concurrencia aumenta memoria. No spills/picos garantizados. No caché persistente ni reutilización entre usuario/negocio/petición; mismo statement MVCC. Comparaciones ausentes conservan CASE, quality diferente entre indicadores no se deduce de disponibilidad temporal.

Benchmark posterior preparado en application-plan: lectores3, warmup1+ al menos20muestras si seguro, rotación orden original/AB/D1, conservar TODOS outliers. p50/p95 nearest-rank/max/stddev/errores/buffers, condiciones y recursos. Instrumentadas fuera de distribución normal; PostgreSQL vs HTTP separados. HTTP privado requiere harness autenticado autorizado sin cambiar RPC pública/usar service role. No HTTP disponible => límite explícito.

Objetivos intactos: p95 extendida100<=500ms,500<=1000ms,1000<=1500ms,5000<=3000ms; 50y200 diagnósticos. 15squery/3slock; no subir timeout. CPU35% y mem40% gates previos de contenedor, max>=5s detiene escalamiento; snapshots recursos no equivalen a picos host. No carga que afecte ajenos. No mejora garantizada ni cumplimiento SLA por número de llamadas previsto.

