# P03-F.4C — Observabilidad sincronizada

Veredicto: **MIXED_EVIDENCE**. Se demuestra trabajo SQL repetido y un cambio de acceso relacional entre cohortes. Dentro de cada lector/cohorte, los contadores normales se mantuvieron iguales mientras variaba la latencia; varios intervalos lentos coincidieron con mayor PSI CPU. La muestra no permite declarar una causa dominante de la variabilidad ni explicar el outlier histórico de9.570ms.

Preflight PASS: worktree/rama/HEAD aprobados, proyecto orderops-statistics-v1-test-74718de66a41, API56321/DB56322, ledger124, cinco contenedores/red/dos volúmenes exclusivos, hashes A+B/D1 originales, RPC pública original y C ausente. Se verificó el hash C preparado, sin instalarlo ni ejecutarlo. Catálogo completo/ACL/RLS/grants/constraints, datos y archivos se preservaron.

Batería ejecutada y finalizada, sin extender muestras: **18 SELECT normales** (3 por lector y cohorte50/100), 6 warmups separados y12 perfiles instrumentados (2 por lector/cohorte). Orden alternado, concurrencia de lectores1, fixtures sintéticos en REPEATABLE READ con rollback y asOf fijo por cohorte. Los24 outputs completos de SELECT/warmup son iguales dentro de su cohorte; no se eliminaron campos ni reordenaron arrays. Perfil/EXPLAIN no se mezcló con tiempos normales. No p95, SLA ni certificación de rendimiento.

| Pedidos | Lector | SELECT local mínimo–máximo ms | N normales |
|---|---|---|---|
|50|Original|624,562–692,463|3|
|50|A+B|230,481–301,001|3|
|50|D1|215,571–329,886|3|
|100|Original|1.096,003–1.826,447|3|
|100|A+B|205,239–253,647|3|
|100|D1|195,794–308,026|3|

UTC inicio/fin y wall de cada SELECT en synchronized-measurements.json. Tiempo psql incluye serialización/transporte local; wall incluye envío/recepción y detección de finalización. Recursos antes/durante/después se capturaron fuera/concurrentemente; el observador añade overhead y sus intervalos abarcan más que el SELECT. CPU es cgroup del contenedor derivada de usage_usec; PSI es global de la VM, no CPU de la query. I/O se conserva por dispositivo como delta, sin atribuir toda escritura de fondo al SELECT.

Resultados principales:

- Original realiza9N llamadas source_items en perfiles; A+B/D1 realizanN. A50:450 versus50; a100:900 versus100. No se suman tiempos inclusivos.
- completion_items a50:50 seq scans /2.500 tuples por consulta; a100:100 index scans /100tuples. Esto reduce can_read en A+B/D1 desde3.976 a601 llamadas en perfiles pese al mayor N. El costo no escala solo con número de pedidos; C debe evaluarse en ambos caminos, sin garantizar ahorro donde ya se usa índice.
- Original100 normal3 tarda1.826,447ms frente a1.096,003ms en normal1, con iguales contadores de scans/tuples y PSI CPU de intervalo35,67% frente a7,45%. Coincidencia temporal, no causalidad demostrada. D1 presenta una asociación similar en esta ventana.
- Los perfiles originales pasan de predicados con constantes a parámetros $ y gates Result en la segunda captura, compatible con custom→generic en plan_cache_mode=auto. A+B/D1 mantienen fingerprints de las consultas compartidas capturadas. Esto no prueba que el cambio de plan cause una muestra normal lenta.
- Planes capturados sin shared reads ni temp read/write; no campo JIT en planes externos/anidados registrados. No se demuestra un costo JIT relevante. No hubo timeout, gate≥5s, CPU/memoria excesivos u OOM observados.

Limitación reconocida: el observador de pg_stat_activity mantuvo una transacción con snapshot de estadísticas sin refresco; queryStartedUTC permaneció antiguo. Sus estados/esperas **no se usan como evidencia fiable por consulta**, y están marcados NOT_AVAILABLE. Raw preservado, propuesta de corrección preparada, sin repetir automáticamente la batería. Buffers/counters de funciones de SELECT normal son NOT_AVAILABLE; se obtienen en perfiles separados y no se imputan a cada normal.

Recomendación: revisar F.5B como próximo experimento SQL posible, primero corrigiendo el observador y conservando controles50/100 y gates. No se justifica cambiar recursos/JIT o reiniciar servicios por una causa aún no demostrada. La autorización de F.5B sigue pendiente; C no se instala aquí. No se concluye que esta batería cumpla metas p95 o sea representativa de producción.

Archivos y hashes: evidence.json; archivos previos y ocho logs antiguos intactos, dos logs nuevos privados identificados por hash. Instrumentación exclusivamente LOCAL en la transacción: track_functions/auto_explain para perfiles, revertidos al cerrar. Sin SQL operativo, DDL, grants, configuración persistente, RPC, frontend, finanzas compartidas o commits. F.4C termina aquí.
