# Preparación de reanudación segura — P04-T01C

**Preparación offline terminada. P04-T01C = BLOCKED.** No se ejecutó el nuevo preflight live ni la recuperación. Los resultados de capacidad de la ejecución anterior no certifican la capacidad presente.

## Diagnóstico del error

La llamada anterior usó `docker image inspect --format '{{json .Id}} {{json .Config.Volumes}}' <imagen>`. El motor de plantillas terminó al resolver `.Config.Volumes` con `map has no entry for key Volumes`. Está demostrado un fallo de acceso a la clave en esa representación; no está demostrado el valor real de los volúmenes de la imagen. El error no acredita digest, ausencia de volúmenes ni compatibilidad del laboratorio.

No se repitió Docker para completar ese diagnóstico. Continúa desconocido si la omisión procede de la serialización de un campo opcional o de otra diferencia de metadata/API. No se confunden `Volumes` de la imagen con `Mounts` de un contenedor. Tampoco se modifica la evidencia anterior ni se convierte su resultado en PASS.

## Comprobación adicional propuesta

`preflight-readonly.proposed.mjs` y `preflight-policy.mjs` son artefactos nuevos, **fuera** del manifest ya aprobado. El modo predeterminado es revisión offline. El modo futuro `--execute-readonly` requiere autorización nueva y no se ejecutó.

Se sustituye la proyección mediante plantilla por **una lectura completa JSON** de `docker image inspect` de la única imagen fijada. La respuesta queda en memoria: no se exportan Config.Env ni stderr sin sanitizar. Se exigen claves presentes y tipos verificables. El JSON inválido, un comando no exitoso, stderr, una respuesta truncada/timeout o cualquier campo obligatorio ausente detienen la secuencia.

Distinciones intencionales:

- `Config.Volumes: null` explícito o `{}` explícito pueden acreditar que esa respuesta no declara volúmenes. Un objeto solo puede contener `/var/lib/postgresql/data`, con metadata vacía. Ese destino se cubriría con el tmpfs del plan original; aquí no se crea nada.
- **Clave Volumes ausente: BLOCKED.** No se inserta un valor por defecto ni se aplica `?? {}`. Si Docker omite la clave de nuevo, el helper no permitirá continuar. Será necesaria una decisión adicional para inspeccionar de forma independiente la configuración OCI original, sin descargar/arrancar imágenes ni reinterpretar la ausencia como PASS.
- El SHA aprobado `sha256:4255…` es el **ID de contenido de configuración local de imagen** utilizado por los pins. No se confunde con el digest de manifiesto de registro. `RepoDigests` debe estar presente como array válido: se registran sus valores; un array vacío se identifica expresamente como procedencia de repositorio no disponible. No se inventa una equivalencia histórica no fijada. La identidad autorizada sigue siendo el ID local exacto, no un tag mutable.
- Se validan Linux/amd64, Size, RootFS/layers y presencia/tipos de User, WorkingDir, Env, Entrypoint y Cmd. Se exportan solo huellas de configuración/comandos y cantidad de variables. Estos controles no demuestran por sí solos disponibilidad de binarios, permisos efectivos ni restaurabilidad; esos gates del paquete original siguen pendientes hasta una ejecución autorizada.

## Capacidad y colisiones

Una sola captura CIM: Win32_Processor.LoadPercentage y Win32_OperatingSystem.FreePhysicalMemory/TotalVisibleMemorySize. Se conserva la media aritmética por procesador usada en el control anterior, sin presentar esa observación puntual como presión sostenida WSL2/cgroup. Umbrales intactos: **CPU ≤35%; memoria libre ≥4 GiB**, con conversión exacta desde KiB, antes de redondear.

Campos nulos, faltantes, no numéricos, ventana de captura >30 segundos o datos inconsistentes bloquean. El fallo de capacidad se registra y detiene **antes de cualquier lectura Docker**. No hay polling, retries, espera hasta una lectura favorable ni acciones para liberar recursos. El registro del intento es exclusivo (`wx`); un intento previo, incluso fallido, impide una segunda invocación live automática. No se elimina ese registro para reintentar.

Se comprueba ausencia tanto del nombre exacto como de la etiqueta de recuperación entre todos los contenedores, incluidos detenidos. Un choque de nombre detiene antes de consultar etiqueta. No se planean redes ni volúmenes nuevos: no se inspeccionan bases ajenas ni se inventaría su contenido. Las consultas no reservan el nombre de forma atómica; una futura creación autorizada debe volver a protegerse contra colisión y detenerse ante respuesta ambigua, como exige el paquete original.

## Pruebas y alcance real

52 pruebas offline con fixtures sintéticos: bordes de capacidad, campos ausentes/null, CPU/RAM inválidas, metadata Volumes válida/ausente/adicional, ID incorrecto, tipos de configuración, colisiones, sanitización y modo default sin acceso live. No son mediciones de Docker ni pruebas de restauración.

No se ejecutaron CIM, Docker, SQL, staging, initdb, roles, restauraciones, Auth o mutaciones de recursos en esta preparación. Solo se crearon archivos propios y se leyeron archivos/Git. La comprobación final preserva hashes de los 3.170 archivos previos, manifest, 13 artefactos autorizados, respaldo y referencias históricas; ver preservation.json.

## Siguiente permiso necesario

Revisar APPROVAL_HASHES.md y autorizar, si corresponde, **una sola ejecución READ ONLY del helper adicional**, fijando sus hashes y el manifest original. Esa autorización no debe incluir recuperación, create/start, limpieza ni intervención de originales. El proceso tiene presupuesto máximo de 90 segundos para comandos externos, timeout CIM 30 segundos y Docker 15 segundos por consulta, sin ampliación automática.

Si el preflight pasa, solo acreditará los controles declarados, en su instante. La capacidad/presión/OOM restantes del plan y el layout real no pueden darse por comprobados con tests offline. Reanudar la restauración exige una decisión posterior con todos los controles previos demostrados. El paso de parada de PG propuesto en el paquete sigue subordinado a la prohibición humana posterior de detener el laboratorio; no se ejecutó ni queda autorizado por este helper.

No modificar el paquete anterior, aumentar recursos/límites, cerrar aplicaciones, parar servicios, instalar QA, sustituir Kong, reparar Docker/WSL ni iniciar T02 para superar un gate. Detenerse con evidencia ante cualquier error.
