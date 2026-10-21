# Tarea C — propuesta ejecutable para revisión, no ejecutada

Archivos: verification.proposed.psql, readonly-query-manifest.json y readonly-verification.proposed.mjs. El modo **--review** se ejecutó offline; no abre conexiones ni llama Docker. El modo --execute-readonly queda exclusivamente como procedimiento propuesto para una **autorización humana nueva**. No está invocado por el builder, finalizer ni las verificaciones de esta tarea.

## Identidad antes de consultas

El runner comprueba rama/HEAD/worktree, manifest privado/config/signing keys y pins históricos. Usa exclusivamente la pipe local Docker fijada, cinco IDs originales, red/dos volúmenes exclusivos y hashes Config/HostConfig. Inspección negativa de compartición en metadata; no conecta a servicios ajenos. Comprueba publicaciones QA56321/56322 actuales. Aún no exige que sean loopback porque esta autorización futura sería integridad read-only **previa** a la intervención, no certificación de aislamiento LAN. Después de sustituir IDs/bindings el runner falla hasta nueva revisión; no se actualizan pins automáticamente.

Solo entonces podrá ejecutar psql -X -U postgres -d postgres dentro del ID DB original, por socket Unix. No usa URL, service role, host remoto ni contraseña en argumentos. No es una prueba TCP/HTTP de los puertos ni de cookies Auth. Antes de consultar datos/catalogo, el primer SELECT comprueba base/usuario y marcador privado exacto (un registro), sin imprimir el token. La identidad lógica necesariamente se consulta como primer SELECT; los controles previos son de destino Docker. Si falla, ROLLBACK y salida. Luego exige ledger count124 antes de los bloques de inspección.

El token se transmite únicamente en stdin desde memoria. VERBOSITY sqlstate y supresión de stderr bruto evitan registrar la sentencia o valores. No usar comandos de consola con el token ni guardar el SQL ya expandido.

## Transacción y alcance

- BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY.
- SET LOCAL statement_timeout15s, lock_timeout3s, UTC, DateStyle ISO/YMD, search_path pg_catalog,public (resolución de builtins segura manteniendo representación regclass histórica).
- Marcador y ledger como gates. Funciones de Estadísticas **no se invocan**, solo se inspeccionan sus definiciones, firmas, defaults, volatility, SECURITY, search_path y ACL.
- Cinco bloques SELECT: catálogo/ledger completo; huellas de15 tablas públicas; settings/state/productos/categorías/stock/triggers; privilegios efectivos y ausencia de Productos/QA; metadata PostgreSQL, pg_control_system de lectura y flags RLS/forceRLS de fuentes.
- Solo builtins de introspección/JSON/agregación/hash y lecturas de tablas/vistas de catálogo; no DDL/DML, secuencias, writers, funciones comerciales, dblink, Auth o instalación QA.
- ROLLBACK explícito al final y en cada rama de error o identidad/ledger inválidos; psql ON_ERROR_STOP off permite emitirlo tras error. No hay COMMIT en el payload.

Se conservan literalmente los cuatro SELECT aprobados anteriores, salvo quitar los delimitadores del privilegio para una única transacción externa. Manifest registra hash original y derivado. Las referencias originales no se copian sobre sí mismas ni se regeneran. Comparación estricta de todos los campos funcionales, sin ordenar arrays para ocultar diferencias. deadlocks y metadata de tiempo se registran, no se exigen iguales a contadores históricos. Los MD5 heredados son fingerprints de comparación, nunca autorización ni firma criptográfica del destino.

El quinto SELECT añade versión/identificador del clúster como observación nueva: no se inventa un system_identifier histórico para compararlo. La consulta se ejecutaría como postgres para inspección completa; flags/políticas/privilegios leídos **no constituyen pruebas de ejecución RLS bajo authenticated**. Eso requeriría un ensayo autorizado separado.

## Fallos, límites y preservación

Error SQL: ROLLBACK y salida con SQLSTATE. Fallo de transporte/cliente, timeout90s o resultado ambiguo: no afirmar ROLLBACK observado; PostgreSQL revierte al cerrar una conexión con transacción abierta, pero no usar esa expectativa como evidencia de cierre observado. No enviar otra consulta de diagnóstico ni retry automático. Registrar estado incierto para decisión humana. Presupuesto de salida12MiB y15s por sentencia, sin ampliar límites para lograr PASS. Lecturas pueden consumir CPU/I/O y tomar locks aunque no modifiquen datos.

Éxito exige todos los bloques JSON, marcador,124 entradas y coincidencia estricta de funciones/políticas/índices/constraints/conteos/huellas/ledger/grants previos. Productos/gate QA deben seguir ausentes, RPC original y candidatos privados sin adopción. Diferencia = BLOCKED, evidencia nueva separada, referencias intactas. El runner no persiste token ni stderr bruto; resultados nuevos solo en sql-readonly-observed.json dentro de este expediente. Ese archivo **no existe actualmente**.

## Comandos para la autorización posterior

Primero revisar SHA-256 de runner, template y manifest en evidence.json. Revisar también los cuatro SQL fuente y referencias fijados. El permiso debe mencionar esos hashes y permitir únicamente el modo read-only en el proyecto aislado; no basta la aprobación de este documento.

```powershell
# Ejecutado AHORA: revisión offline, sin Docker/SQL
node docs/estadisticas-v1/p04-t01c-focused-preflight-20261016/readonly-verification.proposed.mjs --review

# NO EJECUTADO. Requiere autorización humana posterior expresa:
node docs/estadisticas-v1/p04-t01c-focused-preflight-20261016/readonly-verification.proposed.mjs --execute-readonly
```

No equivale a ensayo transaccional de Productos, prueba de restauración, instalación QA ni permiso loopback. No crea fixtures ni altera sesiones.
