# P04-T01C — preparación del harness loopback

**P04-T01C = BLOCKED.** Preparación y dry-run completados; no se autoriza ni ejecuta sustitución de IDs. El harness ejecutable admite exclusivamente `--dry-run`. La secuencia de mutación está renderizada como solicitudes propuestas, sin un ejecutor habilitado. No se presenta como intervención ya aprobada ni como instalación de QA.

## Resultado verificable

- Rama codex/estadisticas-v1, HEAD 923300265323d411c5c91b7935472d5423d228d2. Originales DB/Kong, los otros tres servicios, red y volúmenes siguen coincidiendo con el manifiesto.
- Dry-run final: **PASS_DRY_RUN_ONLY**. 47 entradas de docker diff clasificadas; 17 archivos archivados (DB 4, Kong 13), 1.556.480 bytes de tar. Ningún volumen de datos recorrido ni copiado.
- Pruebas adversariales: **46 PASS offline**. Rechazan pérdida de Env/entrypoint/comando, imagen distinta, puertos nuevos o wildcard, alias perdido, mounts ajenos, nuevas opciones de privilegio, cambios de límites/reinicio, recursos compartidos, colisiones, tar inseguro y transición con segundo escritor PostgreSQL.
- Payloads completos conservados cifrados; no se imprimieron variables, comandos completos, claves, certificados o contenido de archivos. Config y HostConfig originales comparados nuevamente al terminar la captura.
- La comparación permite exactamente HostIp por binding y una normalización explícita: Image pasa del nombre/tag original al **mismo ID de imagen resuelto**, comprobado mediante image inspect. Esto cambia la representación JSON, no la imagen ejecutada. No se oculta como igualdad literal del documento entero.
- No SQL, Auth HTTP, DDL, migración, parada, rename, creación, eliminación, cambio de red/firewall/ACL ni lifecycle. Los procesos internos usados fueron stat, getcap, Python y LuaJIT para lectura; sin instalaciones ni escrituras de aplicación.

## Artefactos principales

| Archivo | Función |
|---|---|
| harness.mjs | Dry-run, validación de flota, creación de payloads, captura leaf-by-leaf y sellado privado. Rechaza cualquier modo de mutación antes de contactar Docker. |
| policy.mjs | Reglas de igualdad, pertenencia, aliases, tar y transición. |
| adversarial.verify.mjs / adversarial-results.json | Matriz offline ejecutada. |
| dry-run.json / dry-run-RUN_ID.json | Evidencia sanitizada final; historial de capturas separado. |
| replay-audit.mjs / replay-analysis.json | Descifrado solo en memoria y análisis estático de heredocs; no ejecuta scripts capturados. |
| xattrs-readonly.mjs / xattr-audit.json | Enumeración de nombres/conteos de atributos, sin valores. |
| capability-audit.json | getcap no informó capabilities en los 17 archivos capturados. |
| prepare-request-plan.mjs / request-plan.proposed.json | Secuencia exacta propuesta de Engine API y referencias a cuerpos privados; **no envía solicitudes**. |
| checkpoint.proposed.json | Mapa old→new todavía con newId=null y estado PROPOSED_NOT_APPLIED. |
| layers-and-replay.md | Inventario completo de preservación y límites. |
| intervention-and-rollback.md | Gates, comandos, reversión y pruebas posteriores. |
| preservation.json / evidence.json | Preservación e inventario SHA-256. |

## Almacenamiento privado

Los payloads, inspect completos y archivos tar están en un bundle bajo `.runtime/loopback-bundles/RUN_ID/sealed.json`, ruta ignorada por Git comprobada antes de escribir. Cada bundle tiene AES-256-GCM, nonce aleatorio y AAD proyecto/runId; su clave aleatoria se protege con Windows DPAPI CurrentUser. Se verificó descifrado y equivalencia en memoria. No hay copias plaintext en disco, documentación ni logs. El nombre, tamaño y hash del bundle figuran en dry-run.json; las evidencias públicas no contienen su clave.

DPAPI no sustituye un backup portátil: perder el perfil/secretos DPAPI de Windows puede impedir abrir el bundle. Debe comprobarse capacidad de descifrado antes de una intervención y conservar un respaldo independiente recuperable. No se exportaron claves DPAPI ni se cambiaron ACL. El descifrado requirió ejecución fuera del sandbox; un intento restringido falló sin exponer material sensible.

## Intentos conservados y correcciones del harness

Tres intentos dry-run bloqueados quedaron en failure-*.json, sin cambios en contenedores:

1. Suposición incorrecta de alias completo. Corregido para exigir los aliases explícitos reales: DB `db`, `db.supabase.internal`; Kong `kong`, `api.supabase.internal`. El nombre completo es DNS automático de Docker.
2. Assertion con etapa todavía apuntando al último archivo, sin diagnóstico sensible. No se atribuye una causa exacta a ese intento; se añadieron etapas específicas y comparación del conjunto de rutas de diff independiente del orden de salida.
3. Archivo temporal resty desaparecido durante observación. Se excluye solo `/tmp/resty_[A-Za-z0-9]+` de Kong como scratch transitorio; no se excluye el dump de DB ni archivos de claves/configuración. Adiciones/borrados persistentes nuevos siguen bloqueando.

También se conservaron dos resultados iniciales de lectura de xattrs con problemas de formato/lectura del harness. La enumeración final registra conteos reales y cambios de tamaño de la lista. Las referencias anteriores del proyecto no fueron editadas.

## Límites y gates pendientes

La captura live no es atómica. El conjunto de rutas persistentes y la configuración no cambiaron durante la captura; ello no demuestra un snapshot detenido de todos los bytes ni preservación lógica de PostgreSQL. La recaptura de los originales **después de una parada autorizada** es obligatoria. El harness live usa stat en contenedores running; no se debe invocarlo fingiendo que sirve para contenedores detenidos. La recaptura detenida se especifica mediante docker cp/archivo API y requiere un ejecutor posterior revisado.

Las siete escrituras heredoc analizadas tienen seis sobreescrituras literales que coinciden con sus archivos capturados y un append de DB a postgresql.conf. El bloque añadido ya es sufijo del archivo; no contiene líneas activas, solo comentarios/blancos. Su reproducción cambiaría el hash del archivo, como se calcula en replay-analysis.json, sin añadir asignaciones GUC. No se normalizará ese cambio para fingir igualdad byte a byte. La inicialización real de las imágenes, certificados generados internamente y metadata de directorios todavía exigen comprobación posterior.

La lectura listxattr cubrió 39 rutas persistentes bajo las capacidades actuales del contenedor: no devolvió atributos visibles ni ACL POSIX. Algunos directorios Kong anunciaron un tamaño distinto del devuelto; queda registrado por ruta. Esto no prueba ausencia de namespaces ocultos/no soportados. Antes de restaurar, debe confirmarse esa visibilidad y repetir la enumeración sobre el checkpoint detenido. Si aparecen ACL/xattrs, no basta el tar básico: capturarlos/restaurarlos explícitamente o detenerse para revisar el mecanismo. No se añade CAP_SYS_ADMIN ni modo privilegiado para forzar una prueba.

El reemplazo de los dos IDs activos, detach de sus endpoints originales y la ventana de interrupción **no están aprobados**. El plan contempla cinco servicios activos y dos originales archivados/detenidos/detach, siete contenedores del proyecto. No se rebajan verificadores históricos ni se modifica manifest.json. Un nuevo checkpoint debe coexistir con esas referencias.

No se repitieron SQL, HTTP, pruebas LAN o benchmarks. La exposición LAN informada previamente sigue vigente como riesgo: API confirmada, DB potencial. No se ha aplicado una mitigación.

## Recomendación

Revisar el bundle y la secuencia propuesta. La siguiente autorización debe identificar hashes exactos, aceptar expresamente los dos nuevos IDs y el detach selectivo, definir la ventana, autorizar recaptura detenida/restauración y exigir fallo cerrado. Antes de ejecutar se necesita revisar/habilitar el adaptador de mutación y completar los gates de intervención indicados; no hay un `--apply` disponible en este paquete. La comprobación lógica con SELECT READ ONLY, las pruebas de red y cualquier recuperación de servicios wildcard deben tener alcance explícito. El ensayo de Productos, instalación, Auth, T02 y publicación siguen siendo autorizaciones separadas.
