# Prueba independiente de recuperabilidad — detenida en preflight

**Resultado: RECOVERY_INCOMPLETE. P04-T01C = BLOCKED.**

La autorización fue leída y se verificó el manifest SHA-256 `790960c137c57c70d725cde4a7113165b15c6369662b2e2a52387623093dfd3f`, sus 13 artefactos y el respaldo fuente sin modificar. Rama `codex/estadisticas-v1`, HEAD `923300265323d411c5c91b7935472d5423d228d2`, worktree OrderOps-Estadisticas.

## Gate de recursos y detención

A las 2026-10-16T17:37:21.4675534Z se observaron CPU 26% y **1,036 GiB de memoria disponible**, sobre 15,888 GiB físicos. El plan exige CPU ≤35% y memoria disponible ≥4 GiB. **El gate de memoria falla y prohíbe crear/iniciar recursos.** No se esperó una condición favorable ni se repitió la medición para obtener PASS.

El acceso CIM/pipe inicial estaba restringido por el sandbox. Se efectuó únicamente una comprobación elevada de solo lectura. Los valores nulos/cero derivados del acceso denegado inicial no son mediciones del host. No hubo rechazo del revisor automático.

La consulta de colisión del nombre devolvió cero IDs. La inspección seleccionada de la imagen terminó con el error de plantilla «map has no entry for key Volumes»; no constituye una aceptación del digest/Volumes ni prueba de un volumen inesperado. No se corrigió el comando ni se repitió. Con el gate fallido no se continuó con otros controles ni etapas.

## Resultado y cobertura

| Etapa | Resultado |
|---|---|
|Manifest, 13 hashes y dump|PASS|
|Rama, HEAD y hashes anteriores|PASS|
|CPU disponible respecto del límite|PASS de la observación puntual|
|Memoria disponible|FAIL del gate; detener|
|Colisión de nombre nuevo|PASS, sin IDs coincidentes|
|Imagen/Volumes y presión/OOM|Sin confirmación completa|
|Creación/arranque/staging/initdb/roles/restore|NO EJECUTADOS|
|Comparación de objetos, roles, ACL, extensiones y 108 bloques/738 filas|NO EJECUTADA; inventario del dump previo no equivale a restauración|
|SQL, Auth, original, Kong, firewall, bindings|Sin operaciones|

No hay fallo demostrado del respaldo ni recuperación demostrada. RECOVERY_INCOMPLETE expresa ensayo no realizado por falta de capacidad y control pendiente; no es PASS ni evidencia de que el archivo sea irrecuperable. Se conserva la distinción entre contenido del dump y recuperación integral de Supabase. No se tocaron bases de otros proyectos.

## Recursos y limpieza

**IDs nuevos: ninguno. Recursos creados: cero. Laboratorios activos de esta prueba: ninguno.** No hay recursos de este ensayo que limpiar. No se detuvo PostgreSQL ni ningún contenedor. La autorización humana más reciente excluye detener el laboratorio; tampoco se ejecutó el paso de parada de PG propuesto en el paquete.

Si en una futura prueba se crea un laboratorio, la limpieza requerirá autorización separada con su ID íntegro y nueva comprobación de layout. Solo tras ella se propondrá detener/eliminar ese ID, sin -v/prune ni tocar imágenes, redes o volúmenes originales. No se ejecutó limpieza alguna ahora.

## Preservación y siguiente decisión

Se verificaron nuevamente 3138 archivos del baseline anterior y 26 archivos inventariados del paquete previo, los 13 artefactos autorizados y el dump. El estado rastreado Git coincide con la referencia previa; no hubo commits. No se modificaron fuentes, manifest ni evidencias históricas. Los resultados nuevos y sus hashes están en este directorio.

Recomendación: mantener BLOCKED y solicitar una nueva decisión humana antes de retomar. Hace falta capacidad verificable ≥4 GiB y autorizar la lectura robusta de metadata de la misma imagen para confirmar Volumes/digest, sin modificar el paquete aprobado ni aflojar límites. No cerrar otros servicios por iniciativa propia, no reintentar ni crear otro destino automáticamente. No reabrir SQL original, instalar QA, sustituir Kong o iniciar T02.
