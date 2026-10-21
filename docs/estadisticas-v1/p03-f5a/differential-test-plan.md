# Plan preparado, no ejecutado

Gate previo: nueva autorización explícita de hash C e instalación aislada; identidad live, ledger124, hashes original/A+B/D1, catálogo/ACL/RLS y datos preservados. SQL timeout15s y lock3s; nada de stress, límites aumentados o credenciales ajenas.

Cuatro lectores: public.statistics_v1_summary, private.statistics_v1_summary_candidate (A+B), private.statistics_v1_summary_d1_candidate, private.statistics_v1_summary_c_candidate. Misma firma de seis argumentos. Comparar JSONB completo, arrays en orden original, sin borrar campos/reordenar/normalizar; decoder TypeScript existente debe aceptar las cuatro respuestas.

Procedimiento transaccional: BEGIN ISOLATION LEVEL REPEATABLE READ; SET LOCAL statement_timeout='15s'; SET LOCAL lock_timeout='3s'. Crear fixtures sintéticos propios con writer/captura originales; configurar claims de actor real y SET LOCAL ROLE authenticated. Obtener cursor offset0 a partir de una respuesta con paginación y asOf fijo; pasar exactamente el mismo cursor, período, rango, sort y limit a los cuatro lectores. Snapshot y transaction_timestamp compartidos. Evitar cursores fabricados que no correspondan a requestKey/revision. Si no hay siguiente página, sin cursor los lectores usan el mismo reloj transaccional; validar explícitamente. Guardar resultados y comparación a archivos propios desde cliente, rollback obligatorio en éxito/error. No crear funciones/tablas auxiliares ni rutas públicas.

| Grupo | Casos y criterio |
|---|---|
| Seguridad previa | owner/manager/admin perfiles originales; operator/viewer/super_admin/NULL/desconocido/sin sesión/sin perfil/sin negocio; dos negocios; claims role/business manipulados; llamada directa a core C y entry C; mismo 42501/ACL y sin filas cruzadas |
| Períodos | Ocho presets today/yesterday/this_week/this_month/previous_month/last_7_days/last_30_days/custom, verificados en el núcleo; rangos válidos/invertidos/excesivos, configuración sin timezone |
| Cursores | limit1/5/máximo, units/amount, empates, múltiples páginas, revision cambia, requestKey errónea, asOf futuro/infinito/malformado, offset inválido; JSON y SQLSTATE completos |
| Ventas | agreed_total exacto, descuento/ajuste identificados, envío, upsell/product parent, financiero alterado después, agreement NULL, unresolved, falta composición/conflict; monto exacto y motivos de calidad, no cero desconocido |
| Items/cardinalidad | productos repetidos, mismos nombres/diferente identidad, identidad NULL, categoría NULL, etiquetas históricas distintas/empates, muchos productos/upsells por pedido, línea histórica fuera de ventana, anterior vacío; FK diferida inconsistente reversible para detectar discrepancia |
| Estados | captura, reapertura, cancelación, recompletado, finalizaciones múltiples solo active elegible, rollback financiero; revision/cobertura/quality iguales |
| Tiempo | nocturna cruza fecha civil, varias sesiones/duración desigual, open/close/internal/asOf exacto y ±1 microsegundo, fuera de sesión, sin fecha fiable en negocio fuera de ventana, DST gap/fold y zonas distintas |
| Series | complete/partial/no comparison, 199/200 puntos, sesiones numerosas, métricas unknown individual, empty, orden y membership únicos, totales/conservación y NULL idénticos |
| Errores | Inputs inválidos y roles denegados: capturar error.message y SQLSTATE por lector en savepoints reversibles; diferencia detiene sin alterar decoder |

Contadores instrumentados por lector, resets locales permitidos solo si aprobados, no persistentes: delta calls/self/total de can_read/source_items/metrics; nested EXPLAIN(ANALYZE,BUFFERS) separado. Probar una composición por elegible no conflictivo como A+B, métricas de puntos igual D1 y menor acceso repetido items; no fijar número can_read sin plan. No sumar inclusive times anidados ni mezclar perfiles con normal samples.

Luego equivalencia: 50 y 100 pedidos, varias tandas independientes (mínimo tres), ≥20 muestras **por lector y tanda**, warmups separados, orden rotado, asOf/dataset idénticos. Guardar cada muestra/outlier/timeout; p50,p95,máximo, dispersión, recursos y buffers. Escalar 200→500→1.000→5.000 solo con recursos/estabilidad/equivalencia: tiempo SQL15s/lock3s, cualquier timeout/error/diferencia/CPU o memoria sobre gate previo F.4A detiene. Mantener también gate de latencia de 5s y CPU normalizada35% de F.4A; revisar gates exactos del harness previo antes de reutilizar, no relajar. Cohorte incompleta no PASS.

Después de serial: lectura concurrencia1→2 acotada, dos negocios y financiero sintético writer paralelo; snapshots antes/durante commit/rollback, reapertura/recompletado, waits/deadlocks, membership sin cruces. Fixtures propios en transacciones reversibles; si algún test requiere commits para observar entre conexiones, presentar primero plan selective cleanup y permiso, no improvisar.

HTTP: referencia RPC pública autenticada, C únicamente harness privado fuera de ruta pública (no REST export nuevo). Separar PostgreSQL/transport/auth/decode; pruebas anon/expiración/roles/negocio, sin service role de aplicación. Fixtures rollback no visibles a otra conexión HTTP: explicitar datasets vacíos o preparar datos sintéticos committed solo tras aprobar limpieza y necesidad. No atribuir harness PostgreSQL a latencia HTTP de C.

Artefactos futuros por test: ID, inputs, snapshot/asOf/revision, dataset fingerprint, outputs completos/hash y primera divergencia path/índice, SQLSTATE, permisos, tiempos brutos, recursos y rollback. Cualquier filtración es FAIL; cualquier diferencia detiene certificación; conservar caso mínimo sin reparar automáticamente candidato.
