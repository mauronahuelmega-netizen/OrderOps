# Estadísticas V1 — Diagnóstico P03-B.1

**Recomendación: READY_FOR_UI_WITH_LIMITATIONS.** El rendimiento permite implementar y verificar el Resumen sobre los contratos ya validados y los volúmenes pequeños probados. **No permite aprobar integración o lanzamiento:** con 500 pedidos, la RPC extendida alcanzó el límite diagnóstico de 15 segundos. Esa ruta y los volúmenes mayores deben resolverse antes de habilitar el producto para negocios reales. Esta recomendación no autoriza comenzar P03-C/D/E.

La causa principal demostrada es la lectura reiterada de composición y sus comprobaciones de autorización. El problema ya existe en el legacy y la extensión vuelve a recorrer los hechos. La alineación temporal y el cálculo de comparaciones aportan una parte pequeña del tiempo. No se implementó ninguna optimización.

## Método, seguridad y condiciones

- Worktree `OrderOps-Estadisticas`, rama `codex/estadisticas-v1`.
- Gate adversarial y live antes de cada lote: proyecto `orderops-statistics-v1-test-74718de66a41`, cinco contenedores saludables, misma red y dos volúmenes exclusivos, marca privada y ledger de 123 versiones.
- API `127.0.0.1:56321`, PostgreSQL `127.0.0.1:56322`. Solo el contenedor DB exclusivo; sin credenciales/configuraciones de otros proyectos.
- PostgreSQL 17.6; Docker/WSL declara 4 CPU y aproximadamente 7,70 GiB. Consultas seriales, sin generador de carga. CPU DB inicial 0,01%; memoria inicial aproximada 118 MiB. Las muestras de recursos propias quedan en cada archivo de volumen; no equivalen a medir capacidad libre global del host compartido.
- Fixtures de una empresa sintética: N pedidos, N líneas principales, N acuerdos de 10,00, N capturas y líneas analíticas; todos finalizados hoy fuera de sesión. Una línea por pedido, identidad de producto NULL y conocida por identidad de línea; sin clientes/datos reales ni historial inferido. Los dos negocios y doce perfiles originales permanecen.
- Cada volumen usa una conexión nueva, misma transacción de fixtures, rol `authenticated` y JWT claims del owner sintético. Se alterna orden legacy/extendida; una medición de calentamiento por RPC y tres repeticiones por modo. La RPC extendida incluye el resumen original internamente.
- Se usó `EXPLAIN (ANALYZE, BUFFERS, SETTINGS, FORMAT JSON)` sobre SELECT. Los tiempos son de ejecución PostgreSQL, no HTTP ni renderizado. No hay percentile de producción ni intervalo de confianza con tres muestras.
- Timeout de 30s durante preparación y 15s por SELECT medido; lock timeout 5s. Antes de cada lote se exige salud y CPU propia <50%, memoria propia <60%; también se detiene el escalamiento ante fallo o muestras >10s. No se ejecutó 1.000 tras el fallo con 500.
- JIT se desactivó solamente dentro de la transacción para una comparación. El perfilado usó `auto_explain` ya precargado y `track_functions` de sesión, sin instalar extensiones ni cambiar configuración persistente. No se reiniciaron ni alteraron contenedores.
- No se ejecutó ANALYZE de tablas ni se refrescaron estadísticas persistentes: los fixtures nuevos pueden tener estimaciones poco representativas. Esto se distingue de una garantía de rendimiento de producción.

Migración instalada y archivo conservan SHA-256:

```text
b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219
```

## Latencias por volumen

Valores en milisegundos. Mediana, mínimo/máximo y desviación estándar poblacional se calculan sobre tres muestras sin instrumentación interna; se excluye calentamiento.

| Pedidos | Legacy mediana | Legacy mínimo–máximo / σ | Extendida mediana | Extendida mínimo–máximo / σ | Resultado |
|---:|---:|---:|---:|---:|---|
| 50 | 338,213 | 329,300–342,031 / 5,334 | 569,014 | 552,344–578,626 / 10,858 | Completó |
| 200 | 1.527,236 | 1.280,183–1.995,354 / 296,580 | 2.267,348 | 2.108,534–2.345,865 / 98,721 | Completó |
| 500 | Sin serie de repeticiones | Calentamiento único: 4.440,928 | Cancelada | Alcanzó statement_timeout de 15s durante calentamiento | Lote detenido, rollback |
| 1.000 | No ejecutado | — | No ejecutado | — | Escalamiento suspendido por fallo en 500 |

Con 200 pedidos, la diferencia de medianas es 740,112 ms; con 50, 230,801 ms. Es una estimación del sobrecosto, no una medida aislada exacta de series: las consultas separadas tienen cortes temporales ligeramente distintos y variación de CPU/caché. Una segunda serie de 200 del perfilado previo a activar instrumentación resultó compatible con estas magnitudes; sus muestras se conservan separadas y no se mezclaron estadísticamente.

Se reproduce el orden de magnitud 2,01–2,63s reportado en P03-B. Las mediciones de hoy cubren `today`; los otros períodos de aquel informe no se extrapolan como medidos nuevamente aquí. El dataset actual tampoco acredita casos con varias líneas por pedido, negocios grandes históricos, sesiones complejas o cohort anterior no vacío.

## Separación medida del costo interno

Un SELECT legacy instrumentado tardó 1.378,514 ms. Un SELECT extendido tardó 2.320,656 ms. Los contadores `pg_stat_xact_user_functions` se tomaron antes/después en la misma conexión y se restaron: los valores de extendida siguientes son solo su llamada, no acumulados con el legacy previo.

| Función | Legacy: llamadas / tiempo total | Extendida: llamadas / tiempo total |
|---|---:|---:|
| `statistics_source_items` | 1.200 / 1.212,032 ms | 1.800 / 1.957,176 ms |
| `statistics_source_digest` | 1.200 / 72,682 ms | 1.800 / 124,151 ms |
| `statistics_can_read` | 3.601 / 495,351 ms | 5.201 / 780,838 ms |
| `statistics_metrics` | 15 / 7,228 ms | 147 / 76,197 ms |
| `statistics_local_cutoff` | 3 / 0,724 ms | 60 / 5,572 ms |
| `statistics_v1_series_delta` | No invocada | 56 / 2,990 ms |

Los tiempos totales son inclusivos: `source_items` incluye autorizaciones anidadas y los lectores incluyen sus hijos. **No deben sumarse estas filas.** `source_items` equivale a aproximadamente 88% del legacy y 84% de la extendida instrumentados. El lector legacy ejecutado *dentro* de la llamada extendida consumió 1.540,487 ms; la diferencia restante fue aproximadamente 780,125 ms.

Las funciones SQL que el planificador inlinea no aparecen necesariamente en esos contadores. Se correlacionaron contadores, planes y código, sin interpretar ausencia de contador como ausencia de trabajo. [Documentación PostgreSQL 17 sobre tracking](https://www.postgresql.org/docs/17/runtime-config-statistics.html).

## Planes relevantes y cuellos de botella demostrados

Los JSON completos están en `profile/volume-200.json`; `analysis.json` extrae nodos y consultas. El plan externo `Result` de una llamada a función no mostraba el costo interno. Se capturaron diez planes anidados con `auto_explain`, umbral 10ms, filas/buffers y timing por nodo desactivado para limitar sobrecosto. Los tiempos de estos planes no son muestras libres de instrumentación. [Documentación de auto_explain](https://www.postgresql.org/docs/17/auto-explain.html).

| Plan anidado | Duración instrumentada | Hallazgo |
|---|---:|---|
| Legacy: agregación `current_facts` | 691,339 ms standalone; 862,118 ms dentro de extendida | Revalida proyección, agrupa productos/categorías y métricas |
| Legacy: buckets con `facts` | 673,066 / 663,595 ms | Vuelve a materializar la misma proyección efectiva |
| Extensión: `effective` | 674,883 ms | Tercer recorrido de hechos efectivos en la misma petición |
| Extensión: plan/membership/comparaciones | 89,127 ms | Alineación y agregación de series sobre el JSON de hechos; costo menor |

**1. Revalidación repetida de composición.** La vista efectiva evalúa `statistics_source_digest(statistics_source_items(...))` para unidades, ventas y razones. En este dataset eso son tres lecturas por pedido y recorrido. El legacy hace dos recorridos (6N); la extendida hace tres (9N). Para 200 pedidos se midieron exactamente 1.200 y 1.800 llamadas. Cada lectura vuelve a aplicar joins de items, snapshots, identidad y autorización. MATERIALIZED existe dentro de cada consulta, pero no comparte esos resultados entre sentencias distintas del lector.

**2. Autorización y lectura por pedido con trabajo sobre todo el negocio.** Un plan interno real de `source_items` usa `order_items_order_id_idx` y devuelve una línea. También contiene un recorrido de `orders` por negocio que devuelve 200 filas, asociado a las condiciones RLS de la lectura. Repetir esta clase de lectura por cada pedido puede volver a construir el conjunto autorizado muchas veces. El multiplicador de llamadas está demostrado; no se asigna una ley asintótica exacta a producción a partir de esta muestra. La evaluación RLS forma parte de las consultas y debe preservarse al optimizar. [Documentación RLS](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

**3. Join financiero mal dimensionado en estos fixtures.** Los planes de los tres recorridos muestran `Seq Scan order_financials`: estimación 1 fila, aproximadamente 100 filas reales promedio por vuelta y 200 loops. Son alrededor de 20.000 filas producidas por ese nodo por recorrido, antes de resolver la unión. En `orders` también se estimó 1 y se observaron 200. Ya existen PK por `order_id`, unique `(order_id,business_id)` e índice por negocio: el defecto no se demuestra como falta de índice. La estimación y elección del join son sospechosas; no se probó que cambiar estadísticas o estrategia de join solucione el timeout, ni se modificaron para intentarlo.

**4. El timeout de 500 ocurre dentro del legacy.** El stack sitúa la cancelación en `statistics_can_read` → `statistics_source_items` → agregación `current_facts` del summary base llamado por la RPC extendida. La llamada cancelada no alcanzó la construcción principal de series. El límite diagnóstico impide atribuirle una duración final o asegurar que también fallaría con el timeout real de producción; sí acredita falta de respuesta dentro de 15s en este escenario permitido.

**5. JIT y disco no explican las muestras principales.** Los planes internos capturados no contienen JIT y sus costos estimados relevantes son inferiores al umbral 100.000. JIT OFF de sesión dio medianas legacy/extendida de 344,781/598,774 ms con 50, y 1.329,688/2.315,540 ms con 200. No hay mejora consistente de la extendida. Los planes capturados no muestran spill temporal; los buffers medidos son principalmente hits. Esto no demuestra que todos los escenarios futuros permanezcan en memoria.

## Optimizaciones propuestas, sin implementación

| Prioridad | Propuesta concreta | Impacto esperado | Riesgo / complejidad / aprobación |
|---|---|---|---|
| 1 | Leer la composición del cohort de forma conjunta y calcular una sola vez el digest vigente por pedido, materializando digest/validez para unidades, ventas y razones | Alto: atacar la operación que concentra 84–88% del tiempo y evitar 3 lecturas por proyección | Alto en semántica, complejidad alta. Reproducir identidad, orden de digest, upsells, cambios postfinalización, null y autorización exactos. Nuevo SQL propio sujeto a aprobación |
| 2 | Reutilizar ese conjunto efectivo en métricas legacy, productos/categorías, buckets y series dentro de una consulta coherente | Alto: evitar los tres recorridos medidos; compatible con MVCC común | Medio/alto, complejidad alta. Mantener todos los campos, firma y dinero exacto; demostrar igualdad JSON runtime. No eliminar campos legacy para acelerar |
| 3 | Revisar cardinalidades y estrategia de joins usando los índices existentes; validar estadísticas representativas y comparación controlada de planes en una autorización posterior | Medio/alto en escalabilidad, estimación no cuantificada | Medio. ANALYZE/ajustes aún no realizados; no asumir que el plan transaccional de fixture representa producción |
| 4 | Evaluar contexto de autorización calculado una vez por sentencia en los lectores/políticas propias y lecturas por cohort que permitan aplicar la RLS compartida una sola vez | Medio/alto según residuo tras 1–2 | Alto en seguridad. Mantener tenant verificado y roles originales; no bypass de RLS, caches globales ni confianza en negocio JSON. Si requiere tocar políticas/helpers compartidos, presentar diff y coordinar con Cursor antes |
| 5 | Revisar acceso a sesiones históricas con candidato `(business_id,commercial_date,opened_at)` en snapshots propios | Bajo en la muestra; posible utilidad con muchas sesiones | Bajo/medio, requiere medición específica y nueva aprobación SQL. No está demostrado por el fixture sin sesiones |
| 6 | Ajustar reconstrucciones JSON, cutoffs y deltas solo después de las anteriores | Bajo según tiempos actuales | Bajo/medio, preservar microsegundos/DST y comparación válida. No justifica cambiar contratos |

No se propone duplicar `order_items(order_id)`, `order_financials(order_id,business_id)` ni el índice parcial de completions por negocio/fecha/instante: ya existen. Cualquier índice sobre tablas operativas sería una superficie compartida y requeriría aprobación/compatibilidad con Cursor. Los beneficios indicados son hipótesis ordenadas por evidencia, **no resultados de una optimización implementada**.

## Implicación para Resumen e integración

P03-C/D pueden diseñarse e implementarse, con autorización posterior, sobre el contrato validado y con skeleton, error/reintento y período global aprobados. El cambio de indicador o la exploración de puntos debe consumir la respuesta ya obtenida; una sola RPC extendida entrega métricas y series. Consultar además el legacy duplicaría trabajo. Evitar solicitudes solapadas innecesarias es una condición técnica de la interfaz, no una solución del backend.

No se deben introducir límites silenciosos de pedidos/períodos, reducir el alcance, mostrar cero ante timeout ni inferir comparaciones para compensar la demora. Si un período no responde, debe conservar el estado explícito de error/carga conforme al contrato visual.

**Integración y lanzamiento quedan bloqueados por rendimiento para los volúmenes no cubiertos.** Antes de habilitar negocios reales: acordar un presupuesto de latencia, revisar/aprobar SQL optimizado, repetir igualdad legacy/tenant/roles/calidad/conservación y medir 50/200/500/1.000 con cohort e historial representativos. Exigir respuestas completas en el volumen objetivo, muestras repetidas sin timeout, evidencia de recursos y limpieza. El timeout de 500 impide declarar el backend actual listo para uso general, aunque no invalida construir la interfaz y sus estados sobre fixtures controlados.

## Limpieza, archivos y limitaciones

Todos los fixtures revirtieron, incluido el lote cancelado de 500 y un intento de perfilado con una opción de sesión mal escrita que se corrigió. Los SELECT de conteo posteriores confirmaron cero pedidos, items, financials, completions, completion items, snapshots de items, sesiones y auditorías creados por el diagnóstico. Antes/después se compararon definiciones de funciones e índices, hash instalado, recursos y contador de deadlocks: sin cambios ni deadlocks. Las opciones de sesión terminan con ROLLBACK/cierre; no se reseteó ningún contador global.

Archivo nuevo ejecutable: `scripts/statistics-v1/p03-b1-diagnose.mjs`; evidencias nuevas únicamente en esta carpeta y logs/SQL preparados dentro del runtime ignorado. No se editaron scripts P03-B, migraciones, contratos, políticas, navegación ni interfaz. La copia de fixture se construyó en memoria a partir del SQL sintético previo; los códigos de seis caracteres admiten hasta 1.000 casos sin colisión, aunque 1.000 no se ejecutó.

Limitaciones: muestra pequeña, una línea por pedido, productos sin identidad de catálogo, ningún cohort previo no vacío, rol owner, caché caliente, estadísticas de tablas no refrescadas, recursos CPU compartidos no aislados físicamente, tiempos de instrumentación separados de las muestras, y medición únicamente de hoy. No se hicieron pruebas de estrés, operaciones sobre otros proyectos ni cambios de esquema persistentes. Se preservaron cambios preexistentes y archivos sin seguimiento.

**P03-B.1 terminado.** Recomendación `READY_FOR_UI_WITH_LIMITATIONS`; esperar autorización expresa para UI o para implementar/probar optimizaciones. No se inició P03-C/D/E, integración, merge, rebase, push ni despliegue.
