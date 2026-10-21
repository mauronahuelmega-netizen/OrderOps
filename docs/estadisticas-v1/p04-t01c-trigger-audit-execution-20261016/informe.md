# P04-T01C — resultado de ejecución READ ONLY focalizada

**PASS focalizado. P04-T01C permanece BLOCKED.** La autorización de una ejecución quedó consumida. No hubo consultas adicionales, reintentos, modificaciones SQL o intervención Docker.

## 1. Identidad, hashes y ejecución única

Los tres SHA-256 coincidieron antes de ejecutar y se mantienen intactos después:

| Artefacto | SHA-256 autorizado |
|---|---|
|runner.proposed.mjs|aebf2d902ac2abf4a841d4d472cafa2f4a6ad6e2e998019c1851ee31d6b25674|
|verification.proposed.psql|61f076a61c4d4d8316afdcdabbca633b24b6bc353db040c2b1d9a6b93412720d|
|artifact-pins.json|db9310b204b3dbe41284c778abe66d01685982d20c5246ff7035c392fd6b36fa|

Los20 componentes asociados, incluidos SELECT, targets, validator y fuentes históricas, también coincidieron. Rama codex/estadisticas-v1, worktree OrderOps-Estadisticas, HEAD923300265323d411c5c91b7935472d5423d228d2. Baseline3.123 archivos previos preservado.

El runner aprobado verificó cinco IDs originales y hashes Config/HostConfig, red/volúmenes exclusivos, imágenes y salud exigida antes de invocar psql. El preflight usa la pipe Docker local fija y solo metadata global para descartar consumidores ajenos de sus recursos. No conecta a servicios de otros proyectos. Estas comprobaciones son las aserciones del runner aprobado que alcanzó la etapa SQL; no se guardó inspect bruto con variables privadas.

Destino DB: **592f44984962a26c6552ccb02937d56385a8db008eb8e7a27e8be2d932f77bd1**, proyecto orderops-statistics-v1-test-74718de66a41. Red original dfbf3cf0bf455393fd0c01a0f61438fd19fd18dfe5f4107c2bafc32589c476af; volúmenes supabase_db_orderops-statistics-v1-test-74718de66a41 y supabase_storage_orderops-statistics-v1-test-74718de66a41. API56321 y DB56322 validados como publicaciones actuales, todavía wildcard. No se probó ni modificó aislamiento LAN.

Una única invocación del runner, con intent exclusivo y sin overwrite/retry. psql se conectó por socket Unix dentro del DB original, base postgres, usuario postgres, PostgreSQL17.6. No host/URL remotos ni credenciales de producción. Inicio UTC de la transacción/proceso medido por el runner:2026-10-16T16:40:07.472Z; fin2026-10-16T16:40:07.733Z. Es trazabilidad del ensayo, no un benchmark ni SLA.

## 2. Marcador, clúster y ROLLBACK

| Control | Resultado |
|---|---|
|Marcador privado|markerVerified=true después del gate de token exacto y una sola fila; token no registrado.|
|Ledger como identidad|124 entradas, gate superado; no reauditoría de statements fuera del alcance.|
|Transacción|REPEATABLE READ, transaction_read_only=on.|
|Límites|15s/sentencia,3s/locks,90s/proceso, sin cambios.|
|search_path|Solo SET LOCAL dentro de la transacción.|
|system_identifier|Texto exacto **7695864922466676780**. Se mantuvo string, sin Number/redondeo.|
|ROLLBACK|**Confirmado**: marcador ROLLBACK_COMPLETED después del ROLLBACK explícito, parser completo y validación estricta exitosos.|
|Resultado proceso|exitCode0, runner concluido con CURRENT_REPRESENTATION_CONFIRMED_WITH_HISTORICAL_LIMITATIONS. Sin stderr inesperado/errores SQL aceptados.|

La nueva identidad exacta del clúster no sustituye ni corrige el número JSON histórico impreciso. No se usa ese registro anterior para afirmar igualdad exacta. El marcador privado y pins Docker siguen siendo controles independientes. No se abrió una conexión posterior para confirmar rollback ni se ejecutó otra consulta.

## 3. Resultado por trigger e identidad de función

**13/13 PASS.** Matriz individual con índices, nombres/tablas y OIDs en TRIGGER_RESULTS.md; textos completos y resultados de cada fila en per-trigger-results.json. La captura íntegra validada está en ../p04-t01c-trigger-audit-preparation-20261016/execution-observed.json; se creó como evidencia nueva, sin alterar referencias anteriores.

Todos los tgfoid y pg_proc.oid corresponden a **25370**, función **extensions.moddatetime()**, cero argumentos SQL, retorno trigger (OID2279), lenguaje c (OID13), SECURITY INVOKER, sin proconfig. Propietario actual supabase_admin; ACL capturada sin cambios entre frames. Una sola membresía en extensión moddatetime1.0, esquema extensions, OID25369 y dependencia e. Source/bin coinciden con moddatetime y $libdir/moddatetime, con huellas constantes; no se ejecutó esa función ni se leyeron sus bibliotecas físicas.

Los13 triggers tienen BEFORE UPDATE FOR EACH ROW (tgtype19), enabledO, tgnargs1 y argumento exacto updated_at+NUL (11bytes). Sin WHEN, transition tables, UPDATE OF, constraint, deferrable ni clone/parent. OIDs de tabla y trigger únicos y estables. Todas las propiedades capturadas y las huellas de implementación/definición/dueño/ACL/extensión coincidieron entre frames. Se preservaron los índices originales; no se renumeró ni ordenó para aparentar igualdad.

## 4. Representación A→B→A

| Frame | search_path | Resolución moddatetime() | Visibilidad | Definición en los13 |
|---|---|---|---|---|
|A|pg_catalog, public|NULL|false|extensions.moddatetime('updated_at')|
|B|pg_catalog, public, extensions|25370|true|moddatetime('updated_at')|
|A2|pg_catalog, public|NULL|false|extensions.moddatetime('updated_at')|

A reprodujo exactamente los textos calificados observados en la ejecución anterior; B reprodujo exactamente las referencias históricas no calificadas; A2 reprodujo A íntegramente en las filas. No se reemplazaron cadenas ni se normalizaron definiciones. La comparación de propiedades por campos es explícita y adicional a las comparaciones textuales completas.

**Conclusión demostrada:** en el snapshot actual, la diferencia textual se explica por el search_path y no por identidades o propiedades diferentes de los triggers entre observaciones. No se detectaron divergencias de catálogo en los13 objetos inspeccionados.

## 5. Límites históricos y bloqueos pendientes

No se afirma continuidad histórica de OIDs/configuración nunca capturados antes. La evidencia actual no demuestra que jamás existió un reemplazo previo conservando OID, ni verifica bytes de bibliotecas, efectos de disparo o autorización HTTP/Auth/RLS funcional. No hubo DDL/DML ni llamadas comerciales para probarlos.

El resultado **no convierte retroactivamente** el runner general anterior en PASS: su comparación literal y su veredicto BLOCKED se conservan. Este expediente explica focalizadamente la discrepancia con evidencia nueva y trazabilidad; cualquier aceptación operativa posterior corresponde al propietario.

Permanecen abiertos:

- Atributos ocultos de Kong y capacidad de preservación exhaustiva.
- Recuperabilidad demostrada mediante restauración independiente; el backup íntegro/TOC no la sustituye.
- Exposición wildcard/LAN, compatibilidad de intervención/replay y autorización de cambio de IDs.
- Ensayo/instalación QA de Productos y continuación T02: no autorizados por este PASS.

## 6. Preservación y detención

Preservation.json/evidence.json registran los3.123 archivos previos y los10 artefactos ignorados históricos preservados, hashes autorizados/asociados intactos, inventario nuevo y resultados. Solo se agregaron documentos/scripts de evidencia propios y los dos archivos intent/result previstos en el paquete aprobado. Sin commits, migraciones, cambios persistentes de configuración, roles, grants, RLS, red, volúmenes o contenedores; sin Auth HTTP ni otros proyectos.

Se recomienda revisar y aceptar este diagnóstico focalizado como explicación actual del texto, manteniendo los demás bloqueos. Cualquier inspección adicional de atributos, ensayo de recuperación o intervención necesita una decisión humana separada. **No se solicita ni inicia automáticamente otra ejecución. La tarea se detiene aquí.**
