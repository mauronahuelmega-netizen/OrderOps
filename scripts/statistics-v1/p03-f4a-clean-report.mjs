import fs from 'node:fs';
const dir='docs/estadisticas-v1/p03-f4a',s=JSON.parse(fs.readFileSync(`${dir}/stability-benchmarks.json`));
const fmt=n=>n.toFixed(3);const rows=s.cohorts.map(c=>`| ${c.batch} | ${c.orders} | ${c.readers.original.n}/${c.readers.AB.n}/${c.readers.D1.n} | ${fmt(c.readers.original.p95)} | ${fmt(c.readers.AB.p95)} | ${fmt(c.readers.D1.p95)} | ${c.status} |`).join('\n');
fs.writeFileSync(`${dir}/informe.md`,`# P03-F.4A — Estabilidad y escalabilidad de D1

**Veredicto: PERFORMANCE_IMPROVED_WITH_LIMITATIONS.** D1 mejora al candidato A+B en los cinco lotes completos, pero no demuestra estabilidad suficiente para una revisión de adopción. La tercera tanda de 100 pedidos quedó incompleta y no es PASS.

## Resultados por tanda

Cada lote completo contiene 20 muestras normales por lector, más un calentamiento separado. Se alternaron los lectores y el orden de tamaños: 50/100, 100/50, 50/100. Los datasets se crearon en conexiones independientes con REPEATABLE READ y rollback; no se reiniciaron servicios ni se vaciaron cachés. El mismo cursor fija asOf para toda la cohorte y se exige JSON completo idéntico en cada lectura.

Los tiempos normales provienen de SELECT real con timing de psql: incluyen ejecución, serialización y comunicación local Unix. p50 y p95 usan rango más próximo. EXPLAIN y los perfiles instrumentados se guardan por separado; sus tiempos no se mezclan con estos cuantiles ni con los de F.3C, que usaban Execution Time de EXPLAIN.

| Tanda | Pedidos | Muestras original/AB/D1 | p95 original ms | p95 A+B ms | p95 D1 ms | Estado |
|---:|---:|---:|---:|---:|---:|---|
${rows}

Los cuantiles del lote incompleto son exploratorios; no acreditan el objetivo con menos de 20 muestras. Las distribuciones, p50, máximos y dispersión están completas en stability-benchmarks.json. Ningún outlier se descartó.

En 100 pedidos, D1 cumplió el objetivo de 500 ms en la primera tanda completa (476.775 ms), pero lo incumplió en la segunda (606.202 ms). La tercera se detuvo cuando el original tardó 9570.334 ms, superando el gate de avance de 5000 ms. Se conservaron los límites SQL de 15 segundos y de bloqueo de 3 segundos; no hubo un timeout SQL en ese caso.

El gate de variabilidad también falló: CV de D1 mayor de 0.5 en la segunda tanda de 100 y en la tercera de 50. **200, 500, 1000 y 5000 pedidos no se ejecutaron.** Sus objetivos quedan sin medir. La concurrencia y los checkpoints financieros paralelos preparados tampoco se ejecutaron tras fallar el gate serial.

## Costo residual y recursos

El perfil separado de 50 pedidos registró 279.339 ms inclusivos para D1 y 210.061 ms para su núcleo. statistics_can_read hizo 3976 llamadas con 124.868 ms propios. source_items conservó una evaluación por pedido: 50 llamadas, 44.868 ms inclusivos y 26.574 ms propios. statistics_metrics hizo 73 llamadas para los 23 puntos de esta ejecución, confirmando la materialización.

La consulta de rankings/categorías consumió 83.017 ms y 5050 shared hits; el conteo histórico, 35.682 ms; las series, 47.265 ms. Los tiempos inclusivos se solapan: no se suman padres e hijos. Los planes y tiempos apoyan investigar relaciones autorizadas y RLS como próximo frente, sin concluir que explican por sí solos el outlier de 9.57 segundos.

Se recogieron 58 snapshots de recursos. El máximo observado fue 149.62% de CPU del contenedor, equivalente a 37.405% de los cuatro CPU del motor; superó el gate activo normalizado de 35%. Memoria del contenedor: 2.15%; VmHWM del backend observado: 76736 KiB. VmHWM incluye memoria compartida mapeada y no es memoria privada asignada. No se observaron spills en los planes recogidos ni esperas de locks en las muestras, pero no hay plan ni timeline preciso del outlier. No se atribuye la dispersión a caché, JIT, otros proyectos o una causa no demostrada.

## HTTP, identidad y pruebas pendientes

La referencia HTTP autenticada pública completó 20 muestras por owner de ambos negocios sobre una base comprometida vacía. Owner, manager y admin fueron admitidos; operator, viewer y super_admin fueron denegados. Se probaron firma válida, expiración y solicitudes anónimas, con metadata falsa que no otorgó autoridad.

Los tokens stateless se firmaron con la clave ES256 exclusiva del proyecto aislado. No se usó service role ni se crearon sesiones; las huellas de Auth users, sessions y refresh tokens permanecieron intactas. Esto no certifica cookies SSR, refresh o revocación de una sesión Auth emitida.

El harness privado verifica identidad mediante Auth HTTP y después ejecuta D1 bajo el rol authenticated sobre cinco pedidos transaccionales. No crea una ruta, endpoint o servicio HTTP para D1. Registra por separado Auth HTTP, RPC wall, lectura del cuerpo, parseo, decoder, SQL wire y bridge wall. El RPC wall incluye trabajo del servidor y transporte; no se presenta una resta de medidas no emparejadas como costo de red exacto.

concurrency-results.json identifica expresamente las pruebas no ejecutadas: incremento de lectores, MVCC financiero entre conexiones, reapertura y recompletado en paralelo. La evidencia anterior de F.3C sigue siendo referencia previa, no una ejecución nueva de F.4A.

## Preservación y recomendación

Se revalidaron worktree OrderOps-Estadisticas, rama codex/estadisticas-v1, proyecto orderops-statistics-v1-test-74718de66a41, API 127.0.0.1:56321, DB 127.0.0.1:56322, los cinco contenedores, la red y los dos volúmenes exclusivos. Ledger: 124. Los hashes autorizados D1 y A+B, el catálogo, ACL, RLS, triggers, índices y archivos preexistentes permanecen intactos.

La RPC pública original sigue activa. No hubo DDL, migraciones, cambios de frontend/permisos, commits, servicios iniciados ni operaciones sobre Cursor, producción o Majo Pastelería. Todos los fixtures se revirtieron; las secuencias, WAL y estadísticas físicas pueden avanzar con rollback y no se resetearon.

Se propone revisar un experimento C de relaciones autorizadas materializadas para completion_items, rankings/categorías y cobertura histórica, conservando RLS y todas las reglas financieras. No se implementó. recommendation.md y limitations.md describen las condiciones y riesgos.

Los fallos del parser de EXPLAIN y del formato .ts del harness HTTP fueron corregidos solo en scripts propios. La primera medición y sus errores se conservaron; no se modificó SQL instalado. Todos los artefactos y scripts están inventariados en evidence.json.

**F.4A finalizada. Esperar autorización expresa; no adoptar D1.**
`);
