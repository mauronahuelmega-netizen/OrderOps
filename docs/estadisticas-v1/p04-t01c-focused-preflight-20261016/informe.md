# P04-T01C — resolución focalizada de preflight

**Estado final: BLOCKED.** No se autorizó ni ejecutó intervención, sustitución de IDs, SQL, restauración, instalación QA o T02. No se preparó una recreación nueva.

- **Tarea A:** [Diagnóstico de Kong](KONG_ATTRIBUTES_DIAGNOSIS.md). La discrepancia se reproduce en libc y syscall, con buffers distintos, sobre OverlayFS. Su filtrado explica el mecanismo; no se identificaron exhaustivamente los atributos ocultos y el preservador anterior no queda certificado para ellos.
- **Tarea B:** [Recuperabilidad](BACKUP_RECOVERABILITY.md). Respaldo externo real,1.436.037bytes, SHA b48f1ed8f4f6a6a75f946a2a55b388f88f20c6d05cc48fecf42cd166af1eecdc, idéntico a copia actual del contenedor y referencia histórica. TOC1.840entradas legible, sin restauración ni SQL. Integridad de archivo resuelta; completitud/recuperación pendientes.
- **Tarea C:** [Propuesta SQL](SQL_READONLY_PROPOSAL.md). Template/runner y manifest de cinco bloques SELECT preparados, con identidad Docker antes de conexión, marcador antes de lecturas, ledger124, READ ONLY/ROLLBACK,15s/3s y comparación estricta. Solo --review ejecutado offline.
- [Matriz y siguiente permiso](BLOCKERS_AND_RECOMMENDATION.md): autorizar primero el conjunto SQL read-only revisado, separado de inspección adicional de atributos y de restauración independiente. No solicitar todavía una ventana loopback.

Datos nuevos: kong-attributes.json, observation-tools.json y backup-inventory.json. Preservación, pruebas estáticas, inventario y SHA-256 en preservation.json, validation-results.json y evidence.json. Las referencias históricas y los seis cambios rastreados previos permanecen intactos. RPC pública, A+B/D1/C, gate QA, frontend, navegación, roles y finanzas no se modificaron.

Las observaciones se limitaron a los IDs DB/Kong originales y sus archivos/herramientas, sin reauditar toda infraestructura ni conectar servicios ajenos. El respaldo externo se inspeccionó solo para esta tarea. Los bundles previos se verificaron por hash, no se abrieron nuevos backups ni se reescribieron.

El alcance V1 de dos pestañas continúa vigente. Se detiene esta tarea, a la espera de autorización expresa para cualquier paso posterior.
