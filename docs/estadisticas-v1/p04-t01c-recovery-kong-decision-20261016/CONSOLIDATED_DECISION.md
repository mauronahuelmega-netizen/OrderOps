# Decisión consolidada de preservación

**READY_FOR_RECOVERY_TEST_APPROVAL**, exclusivamente para solicitar permiso de la prueba independiente acotada. **P04-T01C = BLOCKED.** No es autorización de restauración, create/start, cambios de Kong, instalación QA o T02.

## Matriz de decisión

| Tema | Estado aceptado / evidencia | Mínimo adicional | Riesgo / no continuar |
|---|---|---|---|
|Identidad/ledger/catálogo/datos del QA original|Marcador y ledger124 verificados; referencias de catálogo/huellas conservadas en ejecución anterior.|Ninguna repetición SQL para este paquete.|No actualizar referencias ni ampliar el ensayo al original.|
|13 triggers|PASS_FOCALIZADO aceptado: mismo tgfoid/propiedades, texto A/B/A; captura textual exacta de system_identifier7695864922466676780.|No volver a probarlo.|Continuidad histórica de OIDs nunca capturados sigue no demostrada; runner general anterior conserva BLOCKED.|
|Respaldo externo|SHA/tamaño/cabecera/TOC verificados; lectura offline nueva validó108 bloques COPY/738 filas sin restaurar.|Restore nuevo y comparaciones definidas, dentro del lab.|Archivo alterado/corrupto, payload no verificable o datos distintos = FAIL.|
|Restaurabilidad del contenido|No ejecutada. Procedimiento, scripts/roles auxiliares/comparador/layout preparados.|Permiso humano sobre hashes y presupuesto para un único lab independiente.|Falta extensión/permiso/global o metadatos divergentes = RECOVERY_INCOMPLETE; sin reparación automática.|
|Recuperación de servicio completo|Globales, claves/env, Storage externo y configuración física no incluidos en el dump.|Backup/manifiesto complementario si se exige recuperación integral.|Un PASS_DUMP_CONTENT_ONLY no certifica Auth/servicio ni restaura flags globales históricos.|
|Metadata desconocida de Kong|Filtrado explicado; nombres ocultos sin inventario exhaustivo; original conserva información.|Contrato de estado de aplicación, inventario lógico cerrado y ensayo de clon antes de ventana.|No asumir todo oculto como OverlayFS interno; cualquier diferencia no explicada bloquea.|
|Estrategia Kong|Se recomienda imagen fijada +13 hojas/config declarada +original retenido, no replay exhaustivo actual.|Autorización posterior para diseñar/validar clon; todavía sin sustitución.|Si se exige identidad forense o no puede garantizarse retención/cobertura, no continuar.|
|Bindings/operación|Wildcard y exposición LAN conocidos siguen vigentes; no intervención realizada.|Ventana/build/recaptura detenida/replay/postchecks localhost+LAN IPv4/IPv6 separados.|No cerrar aislamiento por esta documentación o por un PASS SQL.|

## Opción exacta propuesta para recuperar

Un contenedor nuevo con nombre/label de laboratorio, imagen DB original por digest, network none, cero puertos/binds/volúmenes, PGDATA nuevo tmpfs y límites0,75CPU/2GiB/128PID. No se ejecuta el entrypoint original; initdb y PG17.6 nuevos, solo socket Unix. Todo el SQL de creación/restauración futura se limita al clúster nuevo, incluyendo roles auxiliares y borrado de su DB bootstrap vacía para --create. Mantener propietarios/ACL y no filtrar objetos para aprobar. Tras restaurar, comparar archivo reextraído en memoria contra el fuente; solo evidencia sanitizada. Original intacto y sin nuevas consultas.

El laboratorio conserva12 nombres PostgreSQL referenciados;10 se crean como auxiliares NOLOGIN, supabase_admin como SUPERUSER únicamente para ownership de EVENT TRIGGER. No es el rol de aplicación super_admin, no es un bypass de Estadísticas ni una modificación de un rol existente. No se recuperan atributos globales por deducción; el laboratorio carece de publicación/autenticación de aplicación.

## Solicitud humana mínima siguiente

Revisar RECOVERY_TEST_PROCEDURE.md, COMMANDS_AND_GATES.md, restore.proposed.sh, role-prerequisites.proposed.sql, los tres helpers propuestos y sus módulos/plan/hashes. Autorizar expresamente:

1. Una nueva creación/start del lab indicado, sin otros recursos ni pull; presupuesto y ausencia de colisión comprobados antes de create.
2. Staging privado del archivo verificado y scripts aprobados, sin mounts compartidos.
3. Initdb/roles/restore/consultas de comparación **solo dentro del lab**, con los límites y GLOBAL_ROLE_SCOPE conocidos.
4. Exportar únicamente evidencia sanitizada. Parar solo el servidor PG nuevo tras éxito; mantener el contenedor idle y datos tmpfs para revisión. Si algo falla, detener la secuencia y pedir contención separada, sin operaciones ajenas.
5. Mantener stop/rm del contenedor, eliminación de datos tmpfs, intervención de originales y limpieza global **fuera** de ese permiso, sujetos a una autorización posterior exacta.

No se requieren nuevas consultas SQL al QA original ni auditoría completa de infraestructura para autorizar este ensayo. Los gates de imagen/capacidad/recursos son verificaciones previas del propio ensayo, no permiso para reparar el motor o parar otros servicios.

## Condiciones de detención

Hash cambiado, imagen ausente/versión no prevista, VOLUME inesperado, capacidad insuficiente, nombre ocupado, create ambiguo, layout no exacto, UID/binarios no disponibles, PGDATA preexistente, red/puerto/volumen/host path inesperado, identidad de clúster no nueva, error/timeout en restore/comparación o proceso fuera del presupuesto: HALT. No aumentar límites ni modificar roles/extensiones/SQL para obtener PASS. No lanzar un segundo intento o limpiar recursos sin decisión.

La conclusión puede ser PASS del contenido que realmente cubre el dump y al mismo tiempo recuperación operativa incompleta. Deben informarse ambos alcances. Una discrepancia estructural por rol/creador/defaults de extensión no se «normaliza» silenciosamente para aprobar; se presenta con hashes/identidad lógica, sin valores secretos.

## Detención de esta tarea

No se ejecutaron Docker, SQL, restores, Auth HTTP ni servicios. Únicamente análisis offline del archivo sintético y fuentes/evidencias existentes, preparación de scripts/documentación y pruebas offline. No se creó laboratorio ni se cambió la estrategia operativa del ejecutor previo. El siguiente permiso solicitado es **la prueba independiente de recuperabilidad**, no una intervención loopback.
