# Tarea B — respaldo independiente e inventario lógico

**Integridad de archivo: PASS. Completitud: evidencia parcial. Recuperación por restauración: NO DEMOSTRADA.**

Archivo leído: C:\Docker-Backup-OrderOps\orderops-estadisticas-recovered.dump. Tamaño **1.436.037 bytes**. SHA-256 **b48f1ed8f4f6a6a75f946a2a55b388f88f20c6d05cc48fecf42cd166af1eecdc**. Ruta real, mtime y condición de enlace registrados en backup-inventory.json. No es un symlink según lstat. Es un archivo externo al filesystem del contenedor; no se prueba independencia frente a fallo del mismo host/disco Windows.

Formato PGDMP/custom, versión1.16-0. Cabecera: base postgres, pg_dump17.6, PostgreSQL origen17.6, creación2026-10-16 04:53:12UTC. Se utilizó pg_restore17.6 **--list**, sin -d/--dbname ni servidor PostgreSQL adicional: lee el archivo por stdin y no se conecta a una base. El archivo externo y la copia actual /tmp/orderops-estadisticas-recovered.dump del DB original tienen idéntico SHA y tamaño, también coincidentes con la captura histórica del bundle. No se abrió ninguna conexión SQL para establecer correspondencia actual de datos.

## Inventario verificable

TOC completo: **1.840 entradas**, todas clasificadas tras incluir DEFAULT (no confundir sus dos entradas con objetos desconocidos). Inventario por TOC ID, clase, schema e identificador en backup-inventory.json; hash del TOC bruto sin persistir su contenido. No se volcaron datos, secretos ni cuerpos de funciones.

| Clase | Entradas |
|---|---:|
|Schemas|15|
|Funciones|275|
|Tablas / TABLE DATA|107 /108|
|Vista|1|
|Índices|160|
|Constraints / FK constraints|162 /190|
|Triggers|52|
|Políticas / ROW SECURITY|117 /97|
|Extensiones|7|
|ACL / DEFAULT ACL|414 /27|

Incluye schemas statistics_test_environment, supabase_migrations, private, public mediante sus objetos, auth y storage; marcador identity y tabla schema_migrations con entradas TABLE DATA. Las tablas estadísticas, el lector público de Resumen, A+B y D1 aparecen en el inventario. Esto no demuestra sus definiciones activas actuales ni que el ledger contenido tenga124 filas. Las entradas TABLE DATA no indican cantidad de filas y pueden incluir objetos administrados por extensiones; no equiparar su número al de tablas creadas por el dump.

## Respaldos previamente identificados

- Copia dentro del contenedor: hash actual comprobado, igual al externo. No es un segundo dominio de recuperación independiente del volumen/host.
- Bundle privado aprobado ae781e38: SHA f988c43bbc968bc95c0194b511afef28efe0154611ec827a9b93072bd1539508, intacto.
- Bundle anterior40249ac9: SHA0a88c88e5f2270db11d6a2263c5e84b2b1adb376231d30c7e60066c58ebd1412, intacto.
- El descifrado del bundle aprobado y sus17 archivos se verificó en la tarea anterior; no se reejecutó DPAPI aquí. Preservación de ambos archivos cifrados comprobada ahora. Los bundles contienen configuración/claves seleccionadas, no un backup completo de PGDATA ni del volumen Storage.
- No se investigaron directorios de otros proyectos ni se presume que existan backups adicionales. No se modificó ningún respaldo.

## Tres niveles de garantía

1. **Integridad verificable:** igualdad byte a byte por hash entre archivo externo, copia aislada y referencia histórica; cabecera y TOC legibles. No hay un checksum previo independiente adicional que certifique el momento de pg_dump más allá de estas referencias.
2. **Completitud:** el TOC contiene objetos esperados; no se leyeron/decomprimieron todas las secciones de datos, no se compararon filas del dump con la instancia ni se comprobaron large objects/globales/roles/extensiones/versiones de forma exhaustiva. pg_dump de una base no reemplaza respaldo de roles/globales ni de archivos de buckets/certificados. El marcador y ledger actuales siguen pendientes de SELECT autorizado.
3. **Recuperabilidad:** ninguna restauración ejecutada. No hay PASS de recuperación, permisos efectivos restaurados, arranque Auth/Storage ni consistencia de todas las dependencias. La integridad del archivo reduce una brecha, no cierra este gate.

## Procedimiento exacto propuesto para otra autorización

No ejecutar todavía. Destino: **VM Linux descartable independiente**, nunca el contenedor/volúmenes existentes ni otro proyecto. Sin ruta hacia producción ni los puertos actuales56321/56322; no se reutiliza PGDATA, red, roles ni credenciales activas. Esto es ensayo de recuperación separado, no una nueva recreación loopback.

Prerrequisitos de aprobación: imagen/snapshot de VM y ruta QA única, PostgreSQL17.6 con las siete extensiones del TOC y sus bibliotecas compatibles; manifiesto de roles sin contraseñas y propietarios necesarios; al menos memoria/disco presupuestados; snapshot vacío de referencia. Esos roles/versiones se deben obtener por consultas read-only autorizadas y/o manifiestos existentes antes de fijar los hashes finales de los inputs. Sin estos inputs no se promete restauración íntegra ni se improvisan extensiones o grants.

En esa VM exclusivamente, con binarios y hashes aprobados y como usuario de laboratorio sin privilegios del host:

```sh
set -eu
# Variables fijadas por la autorización futura; nunca apuntan al host OrderOps.
RECOVERY_ROOT=/srv/orderops-statistics-recovery-approved
PG_BIN=/opt/postgresql-17.6/bin
test ! -e "$RECOVERY_ROOT/pgdata"
test -d "$RECOVERY_ROOT/socket"
test -d "$RECOVERY_ROOT/private"
sha256sum "$RECOVERY_ROOT/input/orderops-estadisticas-recovered.dump"
"$PG_BIN/pg_restore" --list "$RECOVERY_ROOT/input/orderops-estadisticas-recovered.dump"
"$PG_BIN/initdb" -D "$RECOVERY_ROOT/pgdata" --auth-local=trust --auth-host=reject
"$PG_BIN/pg_ctl" -D "$RECOVERY_ROOT/pgdata" -o "-c listen_addresses='' -c unix_socket_directories='$RECOVERY_ROOT/socket' -p 56442" -l "$RECOVERY_ROOT/private/server.log" start
"$PG_BIN/psql" -X -h "$RECOVERY_ROOT/socket" -p 56442 -d postgres -v ON_ERROR_STOP=1 -f "$RECOVERY_ROOT/input/approved-roles.sql"
"$PG_BIN/createdb" -h "$RECOVERY_ROOT/socket" -p 56442 -T template0 statistics_recovery
"$PG_BIN/pg_restore" --exit-on-error --single-transaction -h "$RECOVERY_ROOT/socket" -p 56442 -d statistics_recovery "$RECOVERY_ROOT/input/orderops-estadisticas-recovered.dump"
"$PG_BIN/psql" -X -h "$RECOVERY_ROOT/socket" -p 56442 -d statistics_recovery -v ON_ERROR_STOP=1 -f "$RECOVERY_ROOT/input/approved-recovery-readonly.psql"
```

Las carpetas socket/private/input deben existir previamente con acceso exclusivo en la VM. Roles, archivos de validación y configuración son **inputs aún pendientes**, no scripts autorizados para ejecutarse ahora. La restauración conserva owner/ACL: no usar --no-owner/--no-privileges para ocultar fallas. Los eventos/funciones del dump se ejecutan solo en el laboratorio sin acceso externo, bajo revisión previa. Logs privados no se copian a documentación sin sanitizar. Si falta un rol/extensión, hay warning inesperado o error, detener y preservar; no reintentar con exclusiones para declarar PASS.

Comparar en READ ONLY+ROLLBACK marcador (solo booleano), ledger esperado, catálogo/definiciones/grants/RLS y huellas contra el snapshot original aprobado. Diferenciar datos posteriores al dump de corrupción: capturar referencia temporal, sin actualizarla para esconder cambios. Validar claves fuera de PGDATA y cobertura de Storage por expediente separado. Parada y eventual descarte de la VM requieren procedimiento autorizado; no ejecutar limpieza sobre los recursos originales.

Hasta ejecutar y aceptar esa prueba, **recuperabilidad sigue pendiente**. El permiso inmediato recomendado es verificación SQL original READ ONLY, no una intervención ni restauración automática.
