# Variabilidad: medición, hipótesis y desconocidos

Tabla completa en latency-table.md; muestras brutas, warmups y métodos separados en measurement-results.json. F.3C usa ExecutionTime de EXPLAIN ANALYZE; F.4A usa timing de SELECT por psql, con serialización/transporte local incluidos. Son poblaciones de distinta ventana y método: no restar medianas para calcular overhead Docker, ni mezclar ambas para p95.

F.3C, milisegundos de EXPLAIN, N=20 por lector/cohorte:

| Pedidos | Lector | p50 | p95 | Máximo |
|---|---|---|---|---|
|50|Original|939,653|3.547,946|3.671,983|
|50|A+B|352,183|1.170,934|1.328,159|
|50|D1|252,359|1.038,496|1.226,815|
|100|Original|1.642,095|2.716,850|2.748,515|
|100|A+B|307,650|495,828|629,300|
|100|D1|219,130|375,940|519,138|

En F.3C D1/A+B tienen menor p95 a100 que a50; no implica mejor complejidad con más datos. Ventanas, calentamiento y planes no están controlados entre volúmenes como para atribuir la inversión a una causa. Tampoco garantiza375,940ms a100 en siguientes tandas SELECT. Este comportamiento sustenta investigar condiciones además del costo SQL.

D1 a50 F.4A: p50 158,031/144,341/298,803ms y p95 229,598/335,459/442,549ms; máximos257,943/367,267/1.123,682ms. p50 no monotónica en orden de las tandas, p95 aumenta1,93× entre extremos. A100: tandas completas p50 327,388/361,615 y p95 476,775/606,202, con máximo1.384,104ms; tercera incompleta no certificable. Una meta exploratoria puede cumplirse en una tanda y no en otra; no basta la media.

Original50 post-benchmark EXPLAIN pasa de12.268 shared hits (660,740ms) a111.112(1.545,237) y110.486(1.387,663). A+B/D1 pasan4.243→19.878→19.556hits. Los planes son posteriores a las muestras: no explican el tiempo exacto de cada una, pero demuestran distinto volumen de trabajo lógico a igual N nominal. El shape externo Result tiene el mismo hash y no revela joins/caches/planes internos. N pedidos igual no asegura mismo heap, estadísticas, número de sesiones, estado del plan cache o costo físico tras fixtures rollback.

Original100 entre tandas1/2 mantiene33.686hits, mientras p95 SELECT1.744,053→2.549,766ms. Planes posteriores1.226,530→1.125,911ms: evidencia de que el EXPLAIN puntual no reproduce la cola de latencias normales. Original100 tanda3 max9.570,334ms detuvo por gate≥5s. No plan de ese outlier; no afirmar que hash plan externo constante excluye cambio interno.

En los quince planes externos F.4A recopilados: shared reads0 y tempread/write0; no campo JIT, sin spills registrados. Solo cubren esos planes, no cada muestra. Buffer hits pueden incluir repeticiones de las mismas páginas, no páginas únicas ni bytes físicos; no convertir111.112hits en tamaño de dataset.

Recursos F.4A58 snapshots: CPU raw máximo149,62% (~37,405% de4CPU), memoria2,15%, backend HWM76.736KiB con mappings compartidos; waits observados ClientRead/null. No muestras exactas start/end por query, no timeline hostCPU/outlier, no relación causal cuantificable. No calcular Pearson sobre cohortes como si fueran queries pareadas.

Hipótesis pendientes: plan interno custom/generic, heap/cache/tuplas abortadas y vacuum, presión scheduling WSL/host, I/O de VM, compilación/planificación interna, overhead CLI/HTTP. Estado measured: reducción de trabajo entre lectores A+B/D1, variación de hits entre tandas y presión Linux ambiental actual. Estado unknown: quién o qué explica outlier9.570ms y cómo se distribuye costo durante él.

HTTP F.4A de RPC original midió actores sintéticos sobre datos committed vacíos, no cohorte50/100 reversible visible entre conexiones. Harness D1 fue privado con PostgreSQL local, no un endpoint HTTP nuevo. No usar esas cifras para extrapolar HTTP production50/100 ni inferir red es el residual dominante.
