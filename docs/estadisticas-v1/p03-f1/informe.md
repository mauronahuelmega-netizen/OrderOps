# Estadísticas V1 — P03-F.1 diagnóstico y diseño

**Veredicto: READY_WITH_LIMITATIONS.** El diagnóstico demuestra repetición de composición, autorización y recorridos de hechos; permite revisar una propuesta A+B de núcleo compartido con digest único por pedido. No certifica una optimización ni los objetivos de lanzamiento. No se implementó/applicó SQL optimizado, DDL, índices, contratos, UI, permisos o integración.

## Baseline e aislamiento

Worktree OrderOps-Estadisticas, rama codex/estadisticas-v1, HEAD `923300265323d411c5c91b7935472d5423d228d2`, sin commits nuevos. Cinco modificaciones seguidas preexistentes: los tres archivos compartidos aprobados en E.1, fase-01-evidencia.json y next-env.d.ts; también permanecen los archivos sin seguimiento anteriores. Baseline de **2.035 archivos preexistentes** no ignorados, con SHA-256 y estado Git completo en baseline.json. El verificador final exige igualdad de todos esos hashes y HEAD.

Gates adversarial offline y live PASS antes de lotes y después: proyecto `orderops-statistics-v1-test-74718de66a41`, API `127.0.0.1:56321`, DB `127.0.0.1:56322`, cinco contenedores saludables con IDs coincidentes, networkId y dos volúmenes exclusivos registrados en before/after.json y evidence.json. Marca privada y ledger 123; ledger.json comprueba además los contenidos exactos instalados de las cuatro migraciones propias. No se cargaron servicios o credenciales ajenas; no se inició/reinició/reparó Docker/Supabase ni un servidor de aplicación.

| Migración propia | SHA-256 preservado |
|---|---|
| 20261013001000_statistics_v1_structures.sql | 5b28bc586ac76f2bcf19df36ecd610d780d26e609d153e8343e5c7b0ecba8828 |
| 20261013002000_statistics_v1_capture.sql | 58c3b995450dd84bcc4299453dc8a80c5c96e62b3b72fe4a46394ae05f9b0d19 |
| 20261013003000_statistics_v1_reads_security.sql | b42a4c961a5ae1ca6a7884af391b6faa36fe3e9e271ba0c570bb9bd3355a7678 |
| 20261013004000_statistics_v1_comparative_series.sql | b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219 |

PostgreSQL 17.6; Docker/WSL declara 4 CPU, 7,70 GiB. DB inicial 0,01% CPU y 122,8 MiB. work_mem 4096 kB, shared_buffers 16384 bloques (~128 MiB), effective_cache_size 16384 bloques; jit on, jit_above_cost 100000, random_page_cost 4, seq_page_cost 1, max_parallel_workers_per_gather 2, default_statistics_target 100, max_connections 100. Valores originales y estadísticas/index definitions en baseline.json. Capacidad declarada del host no garantiza recursos globales libres; solo se observaron métricas del contenedor propio y variación de tiempos.

No se ejecutó ANALYZE/VACUUM ni se forzó índices. Fixtures no confirmados carecen de estadísticas representativas de su distribución; la estimación del planner y los bloat/counters de rollback pueden variar entre lotes. Los conteos lógicos quedan iguales, no se afirma que el almacenamiento físico y contadores estadísticos sean idénticos.

## Método reproducible y seguridad

- Concurrencia 1, sin generador de estrés. Un calentamiento separado y cinco repeticiones por RPC con orden alternado. EXPLAIN (ANALYZE,BUFFERS,SETTINGS,FORMAT JSON) SELECT bajo authenticated y claims del owner sintético A. Fixtures por conexión/transacción y luego ROLLBACK; ningún service role en transporte.
- SQL de fixture exclusivamente DML, sin funciones/tablas temporales/DDL. IDs deterministas de cohort y marcador privado; solo empresas sintéticas A/B. Antes de empezar exige orders vacío y contexto sintético. Captura actual proviene de triggers operativos reales, no fechas inferidas.
- Gate de CPU propia ≤35%, memoria propia ≤40%, salud/identidad exactas; lock_timeout 3s, preparación por statement 30s y SELECT medido 15s. No escalar un lote si falló o si una muestra completada supera 5s. Esa comprobación ocurre al cerrar el lote; cada consulta dentro de este está además limitada a 15s. No iniciar un volumen mayor tras fallo.
- Se mantuvieron los outliers de 200. El timeout abortó esa transacción y su conexión se cerró; se verificó cleanup. Después se hicieron exclusivamente diagnósticos más pequeños: perfilado 100 con warmup y una pareja instrumentada, y forma compleja 50 con nuevo gate. No se retomó escalamiento.
- JIT off: tres repeticiones separadas mediante SET LOCAL, sin mezclar con default; no se cambia configuración instalada. No acredita una mejora estable ni se propone cambiar defaults.
- Perfilado con auto_explain ya precargado, track_functions de sesión, nodos timing off y buffers on. Duraciones/counters son instrumentados; no se mezclan en distribuciones normales y los costos inclusivos no se suman.
- p50/p95 nearest-rank; con cinco repeticiones, p95 equivale al máximo observado y es una estimación exploratoria muy débil de la población. Dispersión = desviación estándar poblacional de estas muestras, no intervalo de confianza.

## Latencias efectivas (ms PostgreSQL)

| Pedidos / dataset | RPC | N medido | p50 | p95 | Mínimo–máximo | σ |
|---|---|---:|---:|---:|---|---:|
| 50, A, una línea, today | legacy | 5 | 442,414 | 543,097 | 410,640–543,097 | 49,035 |
| Igual | extendida | 5 | 677,589 | 838,576 | 660,838–838,576 | 79,498 |
| 100, A, una línea, today | legacy | 5 | 628,511 | 697,182 | 626,657–697,182 | 28,906 |
| Igual | extendida | 5 | 1.046,503 | 1.251,968 | 989,976–1.251,968 | 93,715 |
| 200, A, una línea, today | legacy | 5 | 2.900,158 | 10.253,823 | 1.584,090–10.253,823 | 3.146,864 |
| Igual | extendida | 5 | 2.477,160 | 10.474,009 | 2.263,238–10.474,009 | 3.209,168 |
| 50 total A/B, dos líneas, jornadas/sesiones, calidad mixta, last_30_days; A ve 25 | legacy | 5 | 273,732 | 395,472 | 233,756–395,472 | 54,704 |
| Igual | extendida | 5 | 561,969 | 779,514 | 470,096–779,514 | 113,836 |
| 500 / 1.000 / 5.000 | ambas | 0 | — | — | NO EJECUTADO | — |

El lote de 200 completó las cinco parejas default y una legacy jit_off (10.969,519ms); la siguiente extendida jit_off alcanzó timeout 15s, sin duración exacta completada. No sustituir el timeout por una muestra de 15.000ms exacta ni excluirlo de la interpretación de estabilidad. No hay p95 finito estimado de ese modo incompleto. benchmarks.json contiene todas las muestras, warmups, modos, errores, recursos y escenarios omitidos. SQLSTATE/contexto del timeout en statistics_can_read identifica dónde se canceló; no demuestra que esa función sea la causa exclusiva del outlier.

El escenario complejo tiene dos negocios y 100 líneas (main 8 + upsell 2). Omitir evidencia copy_total_price en uno de cada tres pedidos genera reconciliación parcial conforme al contrato; no cambia agreed_total. A abre una sesión sintética la noche anterior, finaliza, cierra y abre otra sesión actual; un subconjunto reabre/recompleta con captures reales. Eso distribuye las jornadas comerciales actuales/anteriores sin backfill. B queda fuera de sesión. customization_snapshot contiene metadata de un modificador incluido en precio, no prueba exhaustiva de escritores de customización ni de adicionales tarifados distintos. No se consultaron ambos owners para generar latencias: el RPC medido es A y el tenant B es dataset de fondo.

HTTP **NO EJECUTADO**: PostgREST no puede ver fixtures sin confirmar en otra conexión. Se prefirió rollback y preservación a confirmar un cohort para HTTP. No se presentan tiempos de transporte/app de E.1 o resultados vacíos como equivalentes a estos datos. Una futura medición HTTP exige diseño de fixture persistente/limpieza/claims y autorización concreta.

## Cuellos de botella demostrados

Perfil nuevo a 100 pedidos: legacy instrumentada 852,669ms, extendida 1.322,999ms. Las estadísticas se restan por conexión entre before/legacy/extended, sin acumular la primera llamada en la segunda.

| Función | Legacy: calls / total ms | Extendida sola: calls / total ms |
|---|---|---|
| statistics_source_items | 600 / 602,918 | 900 / 923,196 |
| statistics_source_digest | 600 / 40,460 | 900 / 61,515 |
| statistics_can_read | 6.751 / 387,861 | 7.551 / 524,067 |
| statistics_metrics | 21 / 9,016 | 213 / 92,164 |
| statistics_local_cutoff | 3 / 0,681 | 84 / 6,561 |
| summary_base | 1 / 852,617 | 1 / 848,082 |

source_items consume alrededor de 70% de la extendida instrumentada, inclusive; su self time fue 540,344ms. Autorización total inclusive ~40%. **No sumar 70%+40%:** comparten trabajo anidado. Hay impacto temporal además de cantidad de llamadas; no se atribuye solo por counters.

Los planes anidados muestran tres recorridos costosos: legacy current/previous materializado ~307,769ms/8.009 shared hits; facts de buckets legacy ~395,039ms/7.608 hits; effective para series ~349,930ms/7.608 hits. El count histórico de pedidos cuesta ~128,219ms/10.444 hits en la llamada extendida. La agregación temporal JSON posterior cuesta ~102,673ms y cero buffers de tablas; local cutoff ~6,561ms. La extended ejecuta legacy internamente: su costo no desaparece por optimizar únicamente el gráfico.

La vista effective_facts invoker/barrier repite digest(source_items) en tres expresiones de calidad/ventas/unidades. Legacy la recorre por bloques distintos; extensión añade otro. Sus CTE MATERIALIZED están dentro de consultas separadas y no comparten evaluación entre sentencias. El materializado de la extensión ya comparte hechos entre buckets: no hay evidencia de un nuevo escaneo operativo por cada punto, aunque hay trabajo JSON/agregado por bucket. No se propone corregir una consulta N+1 por punto que no existe.

En los planes, statistics_completion_period sí filtra negocio/fecha (100 filas, un loop), y la PK de completion_items se usa en ranking. orders y order_financials aparecen como Seq Scan con 100 loops y ~50 filas promedio por loop, es decir ~5.000 visitas emitidas por recorrido para cada relación en ese plan. Esto acredita joins repetidos; timing off no permite asignarles milisegundos independientes. Hay índices operativos existentes; no se concluye que falte uno. profiles usa índice/Index Only Scan, pero su comprobación vuelve a ejecutarse en RLS y source helpers. Security barrier/policies/estimaciones explican restricciones potenciales del planner, no autorización para removerlas.

Los planes y buffers completos están en plans/, con relevant-summary.json y raw volume JSON en raíz/profile/shapes. No se observó evidencia de spills como causa principal en estos volúmenes; memoria/serialización a 5.000 quedan sin medir. No se midió costo HTTP de serialización final: costo PostgreSQL de JSON está incluido en las consultas. No se fuerza una atribución exclusiva de la cola lenta de 200: host compartido, planes, caches y stats no controlados completamente limitan ese diagnóstico.

## Escalabilidad y objetivos

Objetivos originales conservados: p95 extendida 100≤500ms, 500≤1000ms, 1000≤1500ms, 5000≤3000ms. A 100, p95 exploratorio 1.251,968ms incumple el objetivo. Los demás no se evalúan con datos nuevos. P03-B.1 ya había timeout a 500; se cita como antecedente aceptado, no medición de F.1. La variabilidad nueva a 200 refuerza la necesidad de optimización y validación de estabilidad; no extrapolar linealmente a 5.000.

La matriz planificada en equivalence-plan.md incluye un/varios negocios, 1/7/30/180 jornadas, 1/3/10 líneas, nocturnos/reopen/cancel y reconciliación exacta/parcial. F.1 ejecutó solo las cohortes expresamente detalladas. 500/1000/5000 se omitieron tras timeout y muestras >5s; no faltó un dato que pueda reemplazarse por estimación inventada. No se aumentó timeout ni se cambió el umbral p95.

## Propuesta y equivalencia

alternatives.md compara A digest único, B núcleo compartido, C composición set-based, D autorización request-local sin bypass, E índices/estadísticas y F settings. optimization-proposal.md prioriza A+B, mantiene captura y RLS intactas y evita nuevos objetos persistentes de datos. Beneficio esperado: menos lecturas duplicadas; no se garantizan p95 ni multiplicadores de mejora.

equivalence-plan.md define pares original/candidato dentro de una sola sentencia/snapshot, igualdad JSON completa incluidos series/cursors/calidad/cobertura, decoders y autorización de helpers. Cubre B1–B6, finanzas, NULL, unidades/upsells, jornadas, DST/microsegundos, ciclos, seis roles/tenants y errores. No existe candidato ejecutado y no se afirma equivalencia diferencial de una optimización todavía.

## Scripts adicionales e inventario

Todo nuevo dentro de archivos propios; inventario exacto y SHA-256 en evidence.json:

- p03-f1-prepare.mjs genera el ejecutor desde la suite diagnóstica anterior sin cambiar su fuente; p03-f1-fixture.sql contiene DML propio sin DDL.
- p03-f1-diagnose.mjs ejecuta progresión acotada y registra catálogos/recursos/planes.
- p03-f1-profile-prepare.mjs y p03-f1-profile-diagnose.mjs limitan el perfilado a 100.
- p03-f1-shapes-prepare.mjs, p03-f1-shapes-fixture.sql y p03-f1-shapes-diagnose.mjs cubren el escenario pequeño complejo.
- p03-f1-analyze.mjs calcula métricas/extracta planes; p03-f1-evidence.mjs valida baseline/preservación; p03-f1-ledger.mjs verifica ledger solo lectura; p03-f1-static.verify.mjs valida sintaxis, 5.000 códigos únicos de seis caracteres y ausencia de DDL en fixtures.

Reproducir únicamente con autorización sobre la misma instancia: baseline una vez antes de pruebas, prepare, gates, diagnose progresivo; perfil/shapes solo tras cleanup y nuevo gate; analyze, static y evidence finish. No usar las suites P03-B.1 originales: escribirían evidencia histórica y su fixture empleaba DDL temporal, excluido deliberadamente aquí. No ejecutar profile/shapes concurrentemente con un lote. Los logs/SQL con marcador privado se guardan en runtime ignorado; no exportar tokens ni credenciales.

## Errores, preservación y detención

Primer fixture: código de siete caracteres rechazado por check existente. Se cerró conexión, cleanup lógico quedó verificado y el caso se conserva en fixture-preflight-failure.json. Se corrigió únicamente el generador propio a seis caracteres; la prueba estática valida unicidad/formato hasta 5.000. No se alteró el constraint. El timeout posterior de 200 se conserva y provoca detención segura del escalamiento.

Antes/después de cada corrida los conteos de orders/items/financials/audit/captures/sessions propios vuelven a cero. Funciones e índices del catálogo quedan exactamente iguales y deadlocks no aumentaron. Los hashes de las cuatro migraciones y los 2.035 archivos preexistentes se preservaron; no se modificaron Cursor, Commercial Core, Promotores, Majo Pastelería ni producción. Ningún commit, merge, rebase, push, deploy, DDL, grant, policy, cache, job o activación del menú.

**Detención en P03-F.1.** Solicitar revisión del diseño antes de autorizar P03-F.2. No implementar el núcleo, aplicar SQL o índices, integrar ramas ni habilitar Estadísticas para negocios reales.
