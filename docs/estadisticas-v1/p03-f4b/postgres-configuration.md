# PostgreSQL observado, sin cambios

PostgreSQL17.6, imagen17.6.1.071; pg_settings y fuentes/unidades/pendingRestart completos en environment-baseline.json. Configuración:

| Parámetro | Valor efectivo | Implicación, no causalidad |
|---|---|---|
| shared_buffers |128MiB|Capacidad de buffer pool, no límite de memoria total |
| effective_cache_size |128MiB|Estimación para planner; no reserva ni cap de caché Linux |
| work_mem / hash_mem_multiplier |4MiB /2|Por operador, posible multiplicación concurrente |
| maintenance_work_mem |64MiB|No se ejecutó mantenimiento |
| JIT/provider |on/llvmjit|Habilitado no implica que una query compile JIT |
| jit_above_cost |100.000|Threshold por costo estimado de plan |
| jit_inline/optimize_above_cost |500.000/500.000|No atribuir compilación por duración observada |
| plan_cache_mode |auto|Posibles planes custom/generic internos, no demostrado cambio |
| max_parallel_workers_per_gather |2|Máximo habilitado, no workers efectivos usados |
| max_parallel_workers / max_worker_processes |8/8|Capacidad configurada sobre motor4CPU compartidas |
| random_page_cost / seq_page_cost |4/1|Sin calibración local, no cambiar unilateralmente |
| track_io_timing / track_functions |off/none|No hay atribución normal completa de I/O/funciones |
| statement_timeout / lock_timeout default |0/0|Defaults observados; benchmarks previos aplicaron LOCAL15s/3s |

No benchmark nuevo ni cambio de timeout, JIT o setting en F.4B. Los verificadores read-only existentes fueron usados para identidad/catálogo; configuración global fue observada, nunca modificada. Ninguna recomendación supone aumentar límites para alcanzar objetivos.

Planes externos F.4A: Result, costo0,26, PlanningTime≈0,021–0,048ms; no campo JIT. Esto no mide toda planificación de SQL interno PL/pgSQL ni excluye JIT anidado. Perfil anidado F.4A50 tampoco registra JIT, pero no corresponde al outlier9.570ms. Config jit=on no prueba impacto; falta experimento pareado observacional para el caso lento.

pg_stat_database / pg_stat_io son acumulativos, mezclan fixtures históricos, vacuums y lecturas de auditoría. Se conservan raw sin presentarlos como costo por consulta. n_dead_tup actual mayormente0 y autovacuum registrado después de varias tandas: no demuestra cómo estaban los heaps durante cada benchmark. Rollback preserva datos lógicos pero puede dejar versiones abortadas, espacio/estadísticas y cache footprint; candidato plausible del crecimiento de hits, no causalidad confirmada.
