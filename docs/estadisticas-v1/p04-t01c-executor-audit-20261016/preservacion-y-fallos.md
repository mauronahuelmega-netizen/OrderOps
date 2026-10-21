# Preservación, fallos y fronteras

## Universo cerrado

Únicos mutables propuestos: DB 592f44984962a26c6552ccb02937d56385a8db008eb8e7a27e8be2d932f77bd1 y Kong 313f159d75515e52b874369ace5b6f540a9bac833d2f5d644a8639e1a5b34e63 del proyecto orderops-statistics-v1-test-74718de66a41. Imágenes/config/HostConfig/payloads y rutas archivables fijados en approved-constants.mjs. Red dfbf3cf0bf455393fd0c01a0f61438fd19fd18dfe5f4107c2bafc32589c476af y dos volúmenes originales. Los otros tres IDs deben permanecer sin cambios.

No hay operaciones permitidas para servicios ajenos, URL remota, DELETE/prune/reset, SQL, Auth, grants, start de originales wildcard ni recreación de red. El inventario global negativo de compartición deberá obtenerse mediante una verificación de solo lectura autorizada; no se ejecutó aquí. Un ID devuelto por create que ya existía, o un objeto inesperado, produce HALT. El nombrado no sustituye validación de ID/label/configuración.

## Secuencia y cobertura

| Etapa | Invariantes / fallo |
|---|---|
| Preflight | Pins/hashes/imagen/IDs/recursos y atributos completos. Colisión, recursos ajenos o presión no aceptada: cero stop. |
| Stop Kong / DB | Espera sin SIGKILL automático, cliente acotado. Confirmar Exited. Timeout/error: estado incierto, no paso siguiente. |
| Recaptura DB / Kong | Solo originales detenidos; export raíz sin volumen; leaves por archive; metadata de dueño/modo/mtime completa. Truncamiento, PAX no soportado, bytes excedidos, archivo diferente: HALT. |
| Rename / detach | Solo IDs originales; nombres reservados sin colisión, endpoints propios, Force=false. No disconnect de peers ni modificación de red. |
| Create DB / Kong | Payload cifrado verificado, imagen por mismo digest, único cambio funcional HostIp. ID provisional no habilita operaciones adicionales. |
| Restore DB / Kong | Ambos originales detenidos y ninguna DB nueva activa. Tar exclusivamente de archivos/rutas fijadas y directorios sin recorrido recursivo. Verificación posterior obligatoria. |
| Start DB / Kong | DB solo tras restauración verificada; Kong solo con DB sana. Hashes de claves/certificados y config tras replay; alteraciones no aprobadas bloquean. |
| Postcheck | Cinco servicios activos, dos originales detenidos/detach, otros tres intactos, red/volúmenes originales, mapa de IDs nuevo explícito. No certifica red/SQL todavía. |
| Reversión manual | Stop únicamente IDs nuevos verificados, Kong y DB; no rm, restore de datos ni start de originales. Fallo de rollback también detiene. |

La suite cubre fallos antes/después de la primera operación backend por etapa y cortes en cada descriptor de solicitud de la secuencia modelada. Los cortes finos no se presentan como reproducción de cada posible comportamiento de Engine: la incertidumbre se conserva. La inyección después de efectos comprueba que no existe limpieza/reintento implícito.

## Filesystem y replay

Se validaron offline los 17 archivos cifrados enumerados en el paquete anterior, con bytes tar/checksum, nombre, UID/GID, modo, mtime y contenido. La captura anterior no se reescribió. Los demás bytes de imagen dependen de los mismos digests; PGDATA/Storage se preservan mediante sus volúmenes originales, no export/import ni nuevas bases.

El reader streaming conserva únicamente metadata/digests de las rutas seleccionadas. No extrae symlinks, dispositivos o datos de otras rutas. Rechaza duplicados, traversal, archivos especiales seleccionados, extensiones no soportadas, end markers incompletos y bytes ocultos tras el final. Los datos no seleccionados se descartan en memoria; no se crea un tar del rootfs en disco. Esto debe comprobarse con el comportamiento real de export antes de aceptarlo como witness.

Export resuelve el hueco de UID/GID de HEAD archive, sin exec sobre detenidos y sin recorrer el volumen montado. Los timestamps de directorios de la captura detenida son explícitamente nuevos; nunca se reetiquetan como idénticos a los anteriores. Los archivos preservan sus hashes y metadata aprobados; cualquier divergencia requiere revisión, no actualización silenciosa de pins.

ACL/xattrs/capabilities no soportados se rechazan, no se restauran parcialmente. El soporte actual exige ausencia verificada dentro del alcance aprobado; si existe metadata adicional, hace falta otro mecanismo y autorización, no una whitelist durante la ventana. Los casos de visibilidad incompleta bloquean antes de parar; diferencias aparecidas después vuelven a bloquear en recaptura.

El append de postgresql.conf se modela con el literal exacto de comentarios/blancos ya presente, usando el hash esperado nuevo del paquete previo. No se quitan campos, normalizan contenidos ni aceptan asignaciones activas. La regeneración de certificados se prueba como fallo. Los cambios naturales de mtime por los entrypoints se registran y verifican contra el replay explícito, sin prometer filesystem bit a bit idéntico después del arranque. No reinyectar PID, sockets, locks ni logs de una ejecución previa.

## Journal y crash

DurableIntentStore escribe únicamente metadata/hashes, con creación exclusiva, escrituras completas y fsync. Un ticket no puede emitirse antes del fsync, reutilizarse, pasarse a otro request ni promoverse desde simulación al nativo. Error de disco en cualquier punto deja el store inutilizable; no se intenta Engine. Los fixtures de journal están marcados como simulación.

Un journal hash-chain no es firma del propietario ni autorización; el head esperado debe conservarse fuera del contenido a verificar. fsync no garantiza supervivencia ante todo fallo físico de disco/controlador. Crash antes/después del envío puede dejar INTENT pendiente: solo revisión manual. No reconstruir un ID a partir de un prefijo ni repetir create “por si acaso”.

El núcleo simulado usa journal en memoria; el store durable y su ticket se prueban aparte. El adaptador nativo propuesto exige dicho ticket y está bloqueado incondicionalmente antes de consumirlo. No se ha certificado el comportamiento físico de filesystem/pipe ni la integración con Engine real.

## Alcance de la garantía

Este build no tiene una ruta habilitada de I/O Docker. Un eventual build autorizado solo podrá usar la pipe local fija y solicitudes emitidas por el codec. No usa DOCKER_HOST, credenciales remotas ni transportes inyectados. La capacidad del administrador local para ejecutar otros programas, cambiar el código o actuar sobre el mismo volumen no queda anulada por esta herramienta; la exclusión de terceros durante la ventana es un requisito explícito.
