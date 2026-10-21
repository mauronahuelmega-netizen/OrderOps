# Decisión de intervención

**BLOCKED — no se cumplen todas las precondiciones exigibles antes de parar.**

P04-T01C permanece BLOCKED. No se emite READY_FOR_HUMAN_INTERVENTION_APPROVAL ni READY_FOR_TRANSACTIONAL_QA_REHEARSAL. El checkpoint anterior de preparación offline se conserva íntegro.

## Bloqueos previos a cualquier parada

1. Visibilidad incompleta de atributos en cinco directorios Kong, reproducida. El ejecutor debe rechazar metadata desconocida; no se puede posponer esta resolución a después de destruir o sustituir la capa.
2. Recuperabilidad independiente no acreditada con ubicación, integridad y ensayo de restauración en destino separado. Un bundle descifrable no prueba restauración lógica ni independencia de fallo del perfil DPAPI.
3. Marcador privado, ledger124, catálogo, ACL/RLS y datos no revalidados actualmente porque SQL está prohibido. Hace falta autorización separada acotada, sin cambiar referencias por diferencias.
4. El build actual **no puede intervenir**. Requiere nuevo build/diff/hash y revisión humana específica; permisos de preparación no pueden retirar la barrera. La compatibilidad real de wire, creación y replay permanece pendiente y debe distinguirse de la coincidencia de versión API.
5. Acordar ventana exclusiva, operador, presupuesto, criterios HALT y tratamiento manual de estados inciertos. No existe autorización de sustituir IDs ni prueba de ausencia de otro administrador actuando durante una futura ventana.

La exposición wildcard sigue activa; no se ha mitigado con esta auditoría. Ningún resultado de identidad, salud o integridad del bundle compensa estos bloqueos.

## Solo durante una intervención expresamente autorizada

- Parada limpia con StopSignal conservado, stop?t=-1 y deadline de cliente separado. Timeout/respuesta incierta = HALT, sin retry ni rollback automático.
- Recaptura de los mismos IDs detenidos, export metadata acotado (sin volúmenes) y prueba completa de propietarios/tiempos/contenido. Presupuesto y atributos aprobados previamente; sin plaintext ni pérdida de claves.
- Retención de originales, rename/detach exclusivamente autorizados; create con IDs provisionales y validación antes de restore/start. Nunca dos PostgreSQL sobre PGDATA.
- Verificación de aceptación del payload por Engine, restauración y replay sin cambios efectivos inesperados. Diferencias no justificadas detienen la secuencia.
- Checkpoint append-only old-ID→new-ID con respuesta real verificada. No cambiar evidencias históricas, manifest antiguo ni IDs simulados para aparentar continuidad.

## Solo después, con autorización correspondiente

- Publicaciones exactas 127.0.0.1:56321/56322, sin wildcard IPv4/IPv6; listeners/forwarding host y pruebas localhost más otro dispositivo LAN. Probar ambos TCP y HTTP API, sin Auth. IPv6 cuando exista ruta disponible; no probado no significa cerrado.
- Salud y consistencia de cinco servicios; catálogo/ledger/RLS/grants/datos comparados por SELECT autorizado. Replay de archivos comparado de forma explícita, incluido append conocido de postgresql.conf.
- Preservación de volúmenes, archivos y tres IDs no sustituidos, bundle y backups. Solo entonces reconsiderar aislamiento y autorización del ensayo QA transaccional, nunca instalación/publicación automática.

## Reversión y recurrencia

Conservar el procedimiento anterior de reversión manual: reconciliar journal y IDs, detener solo nuevos IDs verificados bajo autorización, no rm/prune/reset ni iniciar un segundo escritor. Arrancar los originales reabriría wildcard y necesita decisión explícita; no se ejecuta automáticamente como rollback.

Un futuro launcher privado debe rechazar recreaciones Supabase generales y wildcard; comprobar checkpoint y bindings antes/después. La política offline existente no impide a un administrador usar CLI externo. No modificar binario global, daemon, firewall ni proyectos ajenos para resolver esa limitación.

**Próximo paso recomendado:** revisar este dictamen y autorizar un alcance separado para resolver la evidencia de atributos/backup y para SELECT READ ONLY. Aún no autorizar intervención. Cualquier sustitución de IDs, ensayo QA o instalación persistente requerirá decisiones posteriores diferentes. Esta tarea termina aquí sin iniciar T02.
