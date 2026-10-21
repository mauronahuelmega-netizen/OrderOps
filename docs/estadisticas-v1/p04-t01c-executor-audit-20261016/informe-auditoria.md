# P04-T01C — auditoría del ejecutor loopback

**Checkpoint de preparación: READY_FOR_LOOPBACK_INTERVENTION_REVIEW.**

**P04-T01C continúa BLOCKED.** No es autorización de intervención ni `READY_FOR_TRANSACTIONAL_QA_REHEARSAL`. La sustitución de IDs no está aprobada y el build no puede enviar solicitudes reales. Ningún control live se repitió en esta tarea; se usaron referencias preservadas y el bundle ya existente.

## Resultado

Se implementaron el codec de solicitudes/respuestas, la máquina de estados simulada, el adaptador nativo propuesto con barrera incondicional, recaptura/restauración verificable, lector streaming de metadata detenida, validación de bundle, journal durable y política de lifecycle.

- **371 controles offline PASS**, con detalle en offline-results.json.
- 160 escenarios de falla: 16 etapas × antes/después de la primera operación × cinco clases (timeout, error, conflicto, fallo servidor y respuesta malformada).
- 46 cortes adicionales, uno por límite de solicitud renderizada en la simulación satisfactoria. No se continúa con otra operación ni se hace rollback automático.
- Bundle real: dos payloads cualificados y 17 archivos verificados offline; claves/variables/payloads completos solo en memoria. Native confirmó su bloqueo también para esos descriptores reales.
- Cero llamadas Docker Engine, comandos Docker, SQL, Auth o consultas a los otros entornos durante esta tarea. Solo Node, Git de lectura y DPAPI local para abrir el material cifrado previo.

Las simulaciones usan configuración/filesystem sintéticos con IDs originales fijados y nuevos IDs **ficticios**. No demuestran ejecución en Engine ni sustituciones reales. Los IDs nuevos del checkpoint operativo siguen siendo null.

## Correcciones respecto del plan anterior

| Hallazgo | Resolución en este paquete |
|---|---|
| stop?t=60 puede terminar en SIGKILL | Se propone stop?t=-1, conservando StopSignal de la imagen y límite independiente del cliente de 60 s. Timeout del cliente = resultado incierto y HALT; no se reintenta ni se fuerza kill. |
| HEAD archive no contiene UID/GID | Lector streaming propuesto de export del contenedor detenido, sin extracción ni retención del rootfs completo; selecciona metadata/digests exactos. HEAD queda como contraste adicional, no como prueba de propietario. |
| Directorios sin timestamps completos en la captura anterior | El export detenido será testigo nuevo y explícito de sus tiempos, UID/GID/modo. Los tiempos posteriores al cierre limpio pueden cambiar y se registran, sin sobrescribir referencias históricas. |
| Copiar archivos sin garantizar ownership/timestamps | Tar estricto y tar de directorios únicamente; UID/GID/modo/mtime y contenido comprobados. Soporte de mtime fraccional con PAX, sin convertirlo a float. |
| ACL/xattrs desconocidos o no representables | Cierre por defecto. Se rechaza visibilidad incompleta y metadata extendida no soportada. No se descarta ni se convierte a “sin atributos”. |
| create devuelve un ID todavía no verificado | ID provisional: solo GET inspect del ID devuelto, nuevo respecto del inventario previo. Sin start/restore hasta comparar nombre, imagen, configuración, mounts, red y aliases. |
| Requests sintéticos podrían confundirse con candidatos | Autoridad separada. El nativo exige descriptores del candidato ligados a hashes compilados; fixtures no pueden promoverse a esa autoridad. |
| Cambios después de validar el request | Descriptores congelados, marca privada WeakMap, rehash antes de entrega y comprobación de la copia del body. Pins compilados congelados recursivamente. |
| Crash/timeout con estado incierto | Journal de intención con write completo + fsync antes de emitir ticket de un solo uso; ticket ligado al request exacto. Sin ticket durable no hay envío. Recuperación solo produce decisión de revisión manual. |

Docker documenta que un stop con tiempo finito termina forzosamente si el proceso no sale, y que -1 espera sin ese plazo. [Docker stop](https://docs.docker.com/reference/cli/docker/container/stop/).

Docker export excluye los contenidos de volúmenes montados. Se propone exclusivamente para metadata del rootfs detenido, con selección de rutas y presupuesto; no es backup de PGDATA. [Docker export](https://docs.docker.com/reference/cli/docker/container/export/).

Se contrastó la forma del endpoint de archive y sus opciones en código primario Moby 28.3.3. Esto documenta el mecanismo, **no certifica compatibilidad runtime del motor 29.1.3**: debe comprobarse en la ventana autorizada. [Archive router](https://raw.githubusercontent.com/moby/moby/v28.3.3/api/server/router/container/copy.go), [PathStat sin UID/GID](https://raw.githubusercontent.com/moby/moby/v28.3.3/api/types/container/container.go).

## Prueba de ausencia de una ruta accidental de mutación

1. CLI admite exclusivamente --simulate; apply/execute, flags adicionales y variables DOCKER_HOST/REAL_MUTATIONS_ENABLED no habilitan nada.
2. El core simulado no importa transporte, procesos ni filesystem. Su grafo de imports se inspecciona mediante AST; rechaza eval, Function, import dinámico y acceso a process/globalThis.
3. Un WeakSet interno permite únicamente el backend en memoria; no se acepta un transporte inyectado.
4. Los dos entrypoints públicos del adaptador nativo llaman, como primera sentencia, a una función privada que **siempre lanza error**. La importación de node:http está dentro de un método privado posterior a esa barrera. No hay enable, configuración o callback que la anule.
5. Pruebas con tripwire interceptan red/procesos y confirman que ni simulación ni llamada al nativo atraviesan la barrera.
6. Incluso el código de wire actualmente inaccesible usa solo named pipe local fijo; no acepta hostname, URL, proxy, contexto remoto, service role o credenciales. Además requiere descriptor cualificado y ticket durable de un solo uso.

La etiqueta interna APPROVED_CANDIDATE significa coincidencia con los hashes técnicos fijados; no acredita autorización humana de sustitución, ejecución, instalación o publicación.

La garantía aplica a estos archivos/hashes bajo un runtime confiable. No pretende restringir a un administrador que cambie el código o use Docker directamente. Retirar la barrera constituye un cambio nuevo, con nuevo hash y autorización/revisión antes de cualquier operación.

## Límites reales, sin PASS heredados

El wire nativo se revisó estáticamente y compiló; **no se probó contra una pipe/Engine real**, ni se retiró su barrera para probarlo. Los códigos HTTP, efectos y filesystem de las simulaciones son modelos, no mediciones Docker. No hubo benchmark ni presión de carga real.

La captura previa es live. Todavía se necesita nueva verificación live de identidad, salud, ledger/catálogo y exclusividad; cualificar metadata/atributos antes de detener; recaptura detenida; restauración y replay reales; pruebas localhost/LAN IPv4/IPv6. La prueba LAN previa continúa siendo evidencia del propietario de exposición, no una mitigación aplicada.

El export propuesto añade lectura del rootfs completo y costo de I/O/CPU aun cuando se descartan los bytes ajenos a las rutas seleccionadas. Límite de 1 GiB por contenedor y 60 s por solicitud; exceder cualquiera provoca HALT. CPU/memoria requieren observación autorizada y gates del operador; no se afirma que estén monitorizados automáticamente por este build. Si ese presupuesto no alcanza, no se amplía durante la caída.

El export no sustituye una auditoría de atributos visibles/aplicables. Las cinco rutas Kong con tamaño anunciado/devuelto distinto en la evidencia previa siguen requiriendo aclaración o evidencia nueva suficiente. No se inferirá ausencia de metadata oculta. Una evidencia incompleta debe bloquear en preflight, **antes de stop**.

No puede garantizarse exclusión de un segundo escritor frente a otro administrador Docker actuando simultáneamente. El código no arranca dos DB y comprueba escritores/IDs en cada etapa; se exige ventana exclusiva sobre estos recursos y ausencia de otro actor de lifecycle. No se detienen proyectos ajenos para obtenerla.

## Entrega y próximo paso

approval-manifest.json contiene hashes de código, pruebas, checklist y referencias privadas sanitizadas que deben revisarse. preservation.json verifica los 3.005 archivos previos, evidencia ignorada registrada y manifiesto/configuración privados. No se editaron verificadores o referencias anteriores para obtener PASS.

Revisar el paquete y los gates de human-checklist.md. Una autorización posterior debe distinguir: validación live de solo lectura, build de intervención con diff/hash explícito, sustitución de dos IDs/endpoints, ventana, recaptura/export y reversión manual. Este checkpoint no instala Productos, no abre QA y no habilita el nativo por haber pasado pruebas.
