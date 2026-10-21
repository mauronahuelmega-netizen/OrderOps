# P03-F.3C — Instalación y validación experimental D1

**PERFORMANCE_IMPROVED_WITH_LIMITATIONS**. D1 instalada y validada en casos ejecutados; no adopción pública ni lanzamiento.

SHA autorizado:9e8b793df40de1aeb6ecbb71c1ce4e828c717498e62340341d8784726ee78070. Proyecto aislado orderops-statistics-v1-test-74718de66a41; API127.0.0.1:56321,DB127.0.0.1:56322; ledger124 sin nueva versión. Worktree/branch/HEAD e identidad/resources en baseline/preservation.

## Resultados separados

- Instalación PASS: solo private.statistics_v1_summary_d1_candidate. Firma/defaults iguales a A+B, STABLE SECURITY INVOKER, search_path fijo; ACL nuevo owner+authenticated, sin PUBLIC/anon/service_role. Compilación e invocación real correctas. installation-evidence.json e installed-catalog.json.
- Seguridad PASS:12actores sintéticos por4helpers, roles owner/manager/admin vs operator/viewer/super_admin; NULL/unknown rechazados por constraints originales; perfiles ausente/sin negocio, claims metadata forjados y RLS dos negocios diferenciados. SQL-role tests, no certificación de firma JWT/HTTP. security.json y security-shapes.json.
- Equivalencia PASS en matriz ejecutada:JSON completo original=A+B=D1 en RR;8períodos,sort/cursor/asOf/revision/requestKey, productos/categorías, upsells/reconciliación, reopen/cancel/recomplete, histórico sin captura/fecha fiable, quality/NULL, nocturnas/partial/DST/microsegundos, configuración requerida y SQLSTATE+mensajes. Decoders existentes pasan sin cambios. differential-results.json describe límites.
- Reducción demostrada:246 llamadas metrics A+B →70 D1, con22puntos en esta ejecución; no exigir67 del diseño21puntos. Source_items D1=50/100 para50/100pedidos, coreA+B=1llamada porRPC. statistics_can_read conserva counts A+B/D1:3976 en50,10501 en100; D1 no optimiza autorización ni composición. Tiempos inclusivos/propios y planes separados en function-profile.json. No sumar inclusivos anidados.

## Latencias PostgreSQL normales

20muestras POR lector y volumen, warmup separado, orden rotativo y todos outliers conservados. Cada celda:p50/p95/máximo ms. Concurrencia1,15squery/3slock; no incrementar límites.

|Pedidos|Original|A+B|D1|
|---:|---:|---:|---:|
|50|939.653 / 3547.946 / 3671.983|352.183 / 1170.934 / 1328.159|252.359 / 1038.496 / 1226.815|
|100|1642.095 / 2716.850 / 2748.515|307.650 / 495.828 / 629.300|219.130 / 375.940 / 519.138|

Objetivos D1:100: MET_IN_THIS_ISOLATED_COHORT (objetivo500ms,medido375.940ms); 500: NOT_MEASURED_SUFFICIENTLY (objetivo1000ms); 1000: NOT_MEASURED_SUFFICIENTLY (objetivo1500ms); 5000: NOT_MEASURED_SUFFICIENTLY (objetivo3000ms). No declarar objetivos500/1000/5000 cumplidos sin medir. Interpretación comparativa en benchmarks.json; mejora de conteos no garantiza p95. D1 mejora p50 y p95 respecto de A+B en ambos volúmenes.

## Errores del harness y alcance

Se conservaron tres fallos de pruebas:bloque de16casos sobrepasó presupuesto15s, cliente síncrono agotó60s globales, rango UTC fue legítimamente rechazado por el original como futuro en fecha local. Correcciones exclusivamente del harness:casos separados, conexión async sin cambiar timeout SQL, fechas locales y anclas nocturnas sintéticas pasadas. Sin modificar archivoD1/hash ni reparar funciones. No divergencia de datos encontrada en casos completos finales; fallos anteriores no se borraron.

MVCC acotado PASS:dos conexiones, RR reader con captura sintética propia y writer de timezone sin commit; outputs triples iguales, sin dirty read, ambos rollback. No prueba de carrera de finanzas con commit. No HTTP, alta concurrencia, memoria pico ni cargas200+. Ninguna modificación de captura/finanzas/SQL operativos:solo fixtures transaccionales que ejercitan sus escritores existentes.

Recursos antes/después y planes/buffers/materialización en artefactos; snapshots de recursos no son máximos de host/backend. La materialización de métricas funciona, pero joins/composición/RLS/conteo histórico permanecen y pueden dominar costo residual. Ninguna optimización adicional implementada.

## Preservación y cierre

Funciones públicas originales activas; A+B y cuatro fuentes originales intactas, menú/frontend/permisos sin cambios, no Cursor/producción/Majo ni servicios iniciados. Fixtures rollback y fingerprints de settings/state/profiles, triggers/ACL/RLS/índices/ledger verificados. Secuencias/WAL/estadísticas pueden avanzar por pruebas revertidas; sin reset ni limpieza global. Archivos preexistentes SHA-preservados; ningún commit/merge/push/deploy.

Inventario completo de scripts/artefactos ySHA en evidence.json. D1 permanece objeto privado experimental. Detención P03-F.3C:esperar autorización expresa para cualquier adopción, integración u optimización.

Preparación de fixtures: presupuesto heredado de 30 segundos del harness F2B; instalación, validaciones y consultas medidas mantuvieron 15 segundos y lock timeout de 3 segundos. Esta diferencia de preparación queda explícita; no se usó para aprobar una consulta lenta. p50/p95 usan rango más próximo. La dispersión no monotónica entre 50 y 100 pedidos impide generalizar el resultado a un SLA.
