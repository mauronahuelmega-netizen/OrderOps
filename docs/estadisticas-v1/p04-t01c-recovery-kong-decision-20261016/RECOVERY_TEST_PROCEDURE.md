# Restauración independiente — procedimiento propuesto

**Checkpoint: READY_FOR_RECOVERY_TEST_APPROVAL, limitado al laboratorio descrito. P04-T01C sigue BLOCKED.** No es aprobación de restauración ni de intervención. Este documento sustituye como propuesta futura el bosquejo de VM con inputs pendientes; no modifica ese documento histórico.

## Objetivo y frontera

Restaurar el archivo verificado en un **nuevo clúster desechable** dentro de un contenedor nuevo, sin red, sin puertos, sin volúmenes persistentes ni mounts del host. Reutilizar únicamente la imagen binaria original fijada por digest, nunca PGDATA, entorno, claves o configuración del contenedor original. La independencia es de datos/procesos/namespaces; el motor Docker y el host físico seguirían compartidos. No se promete tolerancia a fallo físico de ese mismo host.

No se consultará ni modificará el PostgreSQL original. No se reejecutarán auditorías de los triggers ni runners SQL anteriores. La única entrada será C:\Docker-Backup-OrderOps\orderops-estadisticas-recovered.dump, SHA b48f1ed8f4f6a6a75f946a2a55b388f88f20c6d05cc48fecf42cd166af1eecdc,1.436.037bytes. Los comandos de COMMANDS_AND_GATES.md y restore.proposed.sh **no se ejecutaron**.

## Recursos, límites y costos

| Recurso temporal | Contrato |
|---|---|
|Contenedor|orderops-statistics-recovery-20261016-a; ID nuevo registrado desde create, nunca inventado ni ID original|
|Etiqueta|orderops.statistics.recovery=20261016-a; **sin** com.supabase.cli.project original|
|Imagen|sha256:4255b662ba3d774105cb34f623e410a3d7a860b68408ac6810f7e7e4b9781d5a; local y pull=never|
|Red/puertos|network none; ninguna publicación, host network o conexión a red original; PostgreSQL listen_addresses vacío, solo socket /qa/socket|
|Datos|PGDATA nuevo /qa/pgdata dentro de tmpfs /qa de1GiB. Sombra tmpfs1MiB sobre /var/lib/postgresql/data para impedir volumen anónimo heredado de la imagen|
|Volúmenes/binds|Cero persistentes, cero directorios del host, cero Docker socket dentro del laboratorio|
|Aislamiento|user postgres, rootfs read-only, cap-drop ALL, no-new-privileges, sin privileged, IPC privado, sin PID host|
|CPU/memoria|0,75CPU;2GiB memoria total incluyendo tmpfs, swap adicional deshabilitado,128PID; /dev/shm64MiB|
|Duración|initdb60s; arranque40s; roles30s; borrar DB bootstrap30s; restore180s; comparación90s por proceso. Ventana total objetivo10min, sin ampliación automática|
|SQL del laboratorio|15s por sentencia,3s locks. Un trabajador pg_restore, sin benchmarks/carga/HTTP|
|Retención|Sin --rm ni restart automático. Al finalizar exitosamente se para **solo el servidor PG del laboratorio**, dejando PID1 idle y tmpfs para revisión. Stop/rm del contenedor y pérdida deliberada del tmpfs requieren permiso de limpieza separado|

La imagen ya existe según evidencia anterior, pero debe comprobarse su disponibilidad/digest al autorizar la prueba. No descargar ni reconstruir si falta. Inspeccionar Config.Volumes: solo vacío o /var/lib/postgresql/data, que se sobrescribe con tmpfs. Cualquier volumen inesperado detiene antes de create. Gate de capacidad propuesto para el host compartido: CPU observada≤35%, memoria disponible≥4GiB y sin presión/OOM; si no puede medirse sin afectar otros proyectos, no iniciar. No parar otros proyectos para obtener capacidad. Costos son presupuestos, no mediciones: hasta225CPU-segundos de restore a0,75CPU,2GiB totales como máximo y memoria tmpfs retenida hasta cleanup. Sin almacenamiento de pago ni infraestructura cloud.

## Prerrequisitos exactos derivados del dump

Lectura offline del TOC1.16: **1.847 entradas internas**, de las cuales1.840 corresponden al inventario pg_restore --list anterior. Siete entradas adicionales son metadata inicial/base; el lector previo agrupó dos PUBLICATION TABLE bajo PUBLICATION. Se conservan las referencias antiguas; archive-prerequisites.json registra la precisión nueva. No es una diferencia nueva de la base.

Se identificaron12 roles referenciados: anon, authenticated, dashboard_user, pg_database_owner, pgbouncer, postgres, service_role, supabase_admin, supabase_auth_admin, supabase_etl_admin, supabase_functions_admin y supabase_storage_admin. El archivo lógico **no incluye sus atributos globales/passwords/membresías**. PostgreSQL aporta postgres/pg_database_owner en el clúster nuevo; role-prerequisites.proposed.sql crea los otros10 como auxiliares NOLOGIN. supabase_admin recibe SUPERUSER **solo en el laboratorio** porque es dueño de seis EVENT TRIGGER del dump; esto es un prerrequisito de restauración, no recuperación acreditada de sus flags históricos. No se recrean usuarios de red ni contraseñas reales. authenticator no aparece en esas referencias y no se inventa como rol recuperado.

Las siete extensiones son pg_net/extensions, moddatetime/extensions, pg_graphql/graphql, pg_stat_statements/extensions, pgcrypto/extensions, supabase_vault/vault y uuid-ossp/extensions. El dump no pide VERSION explícita en ninguna: usar los binarios/control files de la imagen fijada y **registrar las versiones resultantes**, sin atribuirlas retroactivamente al origen. Si no hay disponibilidad o pg_restore falla, detener; no instalar otra versión ni excluir extensiones para aprobar.

Se propone preload mínimo pg_stat_statements,pg_net y pg_net.database_name=template1, para no procesar la cola restaurada de postgres. Red none impide comunicación externa. Es configuración de seguridad del laboratorio, no restauración del PostgreSQL original. Dependencias/config de runtime aún no comprobadas: una incompatibilidad produce recuperación incompleta/error de prerequisito, no se corrige durante el ensayo. Nunca inyectar claves de pgsodium/Vault ni JWT del original sin otro permiso.

## Secuencia exacta futura

1. Revisión de hashes del paquete y del dump; recursos del laboratorio inexistentes, capacidad suficiente. Consultar solo metadata de imagen para validar digest/herramientas/Volumes; no arrancar ni inspeccionar SQL original.
2. Create del nuevo contenedor con COMMANDS_AND_GATES.md. Registrar ID íntegro nuevo. Gate assert-new-lab antes de start. Configuración distinta, colisión o consumidor ajeno = HALT.
3. Start solo del ID nuevo, PID1 idle. Gate de aislamiento otra vez. Staging binario sin bind del dump y dos archivos aprobados en /qa/input, propiedad del usuario postgres. No imprimir sus contenidos ni reutilizar variables originales.
4. Ejecutar restore.proposed.sh con ACK e ID nuevo. Comprueba usuario/hostname, herramientas, hash y ausencia de PGDATA; initdb nuevo; arranque solo socket. Ningún entrypoint del stack original se ejecuta.
5. Crear roles auxiliares en el clúster nuevo. Eliminar **solo la DB postgres vacía recién creada por initdb** para permitir --create. No usar --if-exists/--force como sustituto de la comprobación previa. La ruta socket/ID nuevo impide confundirla con el original.
6. pg_restore --create --exit-on-error --jobs=1 contra template1, que reconstruye postgres y su metadata de DB, owners/ACL incluidos. No combinar --create con --single-transaction, ni --clean/--no-owner/--no-acl/exclusiones/disable-triggers. La prueba no es atómica sobre todo el clúster: ante error queda un laboratorio parcial, jamás modifica el origen.
7. Comparación futura con compare-new-lab.proposed.mjs: valida identidad/layout del contenedor nuevo, clúster distinto, PGDATA=/qa/pgdata, sin listener TCP y READ ONLY. Crea un pg_dump custom seekable solo en /qa/private/restored.dump (tmpfs privado), luego lo lee por stdout **binario en memoria**, sin archivo plaintext en host/Git, y lo compara con la copia verificada. Solo guarda hashes/conteos/diferencias lógicas y metadata no secreta.
8. Si no hay fallos, exportar evidencia sanitizada y parar el PG nuevo con pg_ctl dentro del ID del laboratorio. No parar contenedor, borrar tmpfs o limpiar recursos. Ante fallo de cualquier etapa, HALT y revisión humana; no retries, reparación ni rollback/cleanup automático. Un timeout puede dejar procesos del laboratorio activos: registrar incertidumbre y requerir permiso para contención, sin tocar servicios ajenos.

## Comparación y cobertura real

comparison-model.mjs compara identidades lógicas (kind/schema/tag; owner también identifica DEFAULT ACL), owner, definición SQL exacta por hash, COPY, tablespace/access method y dependencias **entre objetos presentes en el TOC**. No compara OIDs/TOC IDs entre clústeres porque se reasignan. No normaliza definiciones para conseguir igualdad: cualquier diferencia exige revisión.

Se pudo descomprimir offline la totalidad de108 bloques COPY referenciados: **738 filas**, con huellas SHA-256/conteos en archive-data-fingerprints.json, sin valores exportados. Esto acredita lectura de esos bloques, no restauración. La comparación futura conserva NULL, escapes y el contenido de arrays/JSON de cada fila; compara multiconjuntos de filas con framing por longitud porque el orden de filas no es un contrato de pg_dump. Columnas/COPY deben coincidir exactamente. SEQUENCE SET está incluido en las definiciones TOC. No se recalculan finanzas.

Hay **64 referencias de dependencia a IDs no presentes en el TOC**, que no pueden alinearse por ID con otro clúster ni declararse históricamente iguales. Se registra ese límite; no se elimina del diagnóstico para afirmar recuperación completa. Restauración sin errores y existencia de objetos/constraints cubren su resolubilidad actual, no todos los atributos históricos de las dependencias implícitas. No volver a consultar la base original para rellenar huecos en esta prueba.

Owners y ACL expresados en el dump se comparan; los flags/credenciales/global memberships de los roles auxiliares no se consideran recuperados. Claves externas, configuración física, PGDATA/WAL/PITR, slots/config de replicación, binarios/versiones no fijadas, Storage de archivos, certificados, env/JWT y comportamiento de Auth/HTTP **no forman parte del PASS de este archivo lógico**. auth.users y otras filas sí pueden contener hashes/secretos dentro del dump: se conservan privados, no confundirlos con roles globales PostgreSQL.

## Resultados objetivos

- **PASS_DUMP_CONTENT_ONLY:** restore exit0 sin fallas omitidas, nuevo clúster independiente, objetos/owners/ACL/SQL y108 conjuntos de datos coincidentes dentro de la cobertura definida; metadata y versiones registradas. No significa servicio recuperado ni continuidad de OIDs.
- **FAIL:** destino/layout incorrecto, acceso ajeno, corrupción/decompresión fallida, pérdida/diferencia de datos, alteración del backup o violación de límites/aislamiento. Detener sin reparar.
- **RECOVERY_INCOMPLETE:** falta de rol/extensión/clave, metadata/owner/default/version no reproducida, warning no explicado, comparación estructural no demostrada, timeout/resultado parcial o dependencias fuera de cobertura requeridas para operación. No se convierte en PASS mediante exclusiones o normalización.

Incluso un PASS del contenido deja **recuperación operativa integral NO DEMOSTRADA** por los globales/archivos fuera del dump. El propietario decide si el PASS acotado satisface el gate de recuperabilidad pretendido o requiere un backup complementario. P04-T01C y Kong no se desbloquean automáticamente.

## Limpieza separada

Ningún cleanup está autorizado ahora ni implícito en aprobar el ensayo. La solicitud posterior debe identificar nuevo ID/label/imagen y confirmar evidencia preservada. Solo entonces: comprobar layout otra vez, detener únicamente ese contenedor y eliminar únicamente ese ID, sin -v (no debe haber volúmenes), sin prune ni borrado de imagen/red. Stop elimina el tmpfs y es destructivo para los datos del laboratorio; requiere aceptación explícita. Si aparece un volumen inesperado, no borrarlo. Mantener backup original, bundles, imagen compartida y recursos de todos los proyectos intactos.
