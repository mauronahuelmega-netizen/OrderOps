# Checklist de revisión y autorización humana

Este documento no autoriza operaciones. P04-T01C = BLOCKED. El checkpoint del paquete es únicamente READY_FOR_LOOPBACK_INTERVENTION_REVIEW.

## A. Revisión del paquete actual

- [ ] Revisar approval-manifest.json y sus hashes; confirmar rama/HEAD y preservación de referencias anteriores.
- [ ] Revisar los dos payload hashes, bundle cifrado, pins de imágenes/configuración y rutas; los payloads privados no deben copiarse a Git, documentos o logs.
- [ ] Revisar las 371 pruebas, 160 escenarios por etapa, 46 límites de request y las pruebas de barrera/tickets/recuperación.
- [ ] Aceptar que son pruebas offline; no son compilación/validación de Engine, cierre LAN, prueba de restauración ni integridad lógica de PostgreSQL.
- [ ] Revisar el cambio de stop?t=60 a stop?t=-1 y la nueva lectura export acotada; no ejecutar comandos heredados con timeout de kill.

## B. Antes de autorizar una ventana

- [ ] Autorizar explícitamente verificación live **de solo lectura**, con proyecto/recursos originales, ausencia de compartición y colisiones. No se ejecutó en esta auditoría.
- [ ] Resolver la evidencia de atributos/visibilidad antes de stop. Las cinco rutas Kong con tamaños distintos no quedan aprobadas por un resultado simulado. Atributos presentes o desconocidos requieren nueva revisión del mecanismo.
- [ ] Revalidar ledger 124, marcador privado, RPC original, ACL/políticas y datos mediante SELECT READ ONLY solo si se autoriza separadamente. No aprobar por encontrar el mismo nombre de volumen.
- [ ] Confirmar API 56321/DB56322, cinco IDs originales, red y dos volúmenes exclusivos; no tocar OrderOps compartido, Ledger, Majo, Cursor o producción.
- [ ] Confirmar backup independiente recuperable, bundle DPAPI descifrable por el usuario adecuado y preservación de claves/config fuera de PGDATA. No usar una restauración de prueba sobre la base original.
- [ ] Definir ventana, operador, duración máxima y canal de reporte. Excluir otros actores de lifecycle/escritura sobre estos recursos; no parar proyectos ajenos para obtener exclusividad.
- [ ] Revisar presupuesto de export: hasta 1 GiB por contenedor y cliente 60 s; no guardar rootfs plaintext. Gates de CPU/memoria del entorno requieren observación autorizada, no se dan por medidos aquí. Exceso = detener, no ampliar límites.
- [ ] Autorizar expresamente dos nuevos IDs activos, retención de originales detenidos/renombrados y detach solo de sus dos endpoints. Cinco servicios activos + dos originales retenidos = siete contenedores etiquetados.
- [ ] Preparar un **build de intervención nuevo**, con diff mínimo explícito que retire las barreras solo bajo autorización. Este build siempre bloquea. Someter el hash nuevo y su manifest a revisión/aceptación antes de cualquier stop. Ni JSON de aprobación, variable ni tests habilitan este código.

## C. Orden autorizado futuro (no ejecutado)

1. Fresh preflight y captura de metadata/atributos live; hashes fijados en nuevo expediente, manteniendo los antiguos.
2. Persistir/fsync intención de stop Kong, luego DB. Usar StopSignal original, t=-1 y cliente acotado. Confirmar Exited; si el cliente falla, el daemon puede continuar deteniendo: HALT incierto.
3. Capturar leaves y export metadata de **los mismos IDs detenidos**, sin exec ni segundo PostgreSQL. Aceptar solo datos completos dentro del presupuesto. Sellar checkpoint nuevo, registrar diferencias explícitas y verificar propietarios/timestamps/atributos.
4. Rename y detach originales, con journal y verificación después de cada acción. Colisión o estado incierto = no avanzar.
5. Create con payloads aprobados; ID provisional solo permite inspect, sin restore/start hasta validar imagen/config/mounts/red/aliases. No pull ni inicialización de bases nuevas.
6. Restaurar directorios y leaves con ownership/times, verificar antes de arrancar; no escribir en PGDATA ni reinyectar transitorios.
7. Arrancar newDB, comprobar salud/replay y que oldDB permanece detenido; después newKong y sus hashes. No depender solamente de healthchecks.
8. Registrar mapa old→new real en nuevo checkpoint/journal; conservar originales y los otros tres servicios. No editar manifest histórico ni presentar continuidad ficticia de IDs.

Todos los envíos necesitan ticket durable de un solo uso. Una respuesta perdida, status inesperado, fallo de parseo, archivo diferente o journal no persistido impide pasos siguientes. No hay reintento, discovery o rollback automático después del fallo.

## D. Comprobaciones posteriores y decisión de aislamiento

- [ ] Docker HostConfig y NetworkSettings: solo 127.0.0.1:56321→Kong y 127.0.0.1:56322→DB. Sin 0.0.0.0/::/LAN/publicaciones adicionales.
- [ ] Windows/WSL: atribuir listeners y forwarding; ningún wildcard residual se ignora.
- [ ] Desde localhost: TCP ambos puertos y HTTP raíz de Kong sin Auth; un error de ruta prueba transporte, no datos.
- [ ] Desde otro dispositivo LAN: IP actual correcta, sin VPN/proxy/aislamiento Wi-Fi; ambos TCP deben fallar mientras localhost funciona. Cualquier respuesta HTTP de API sigue siendo exposición. No usar navegador como prueba de PostgreSQL.
- [ ] Probar IPv6 LAN si hay dirección enrutable. Ausencia de prueba en una familia disponible = pendiente, no PASS.
- [ ] Comparar catálogo/ledger/grants/RLS y datos contra referencias aprobadas mediante la autorización READ ONLY correspondiente. No migraciones ni nueva función Productos.
- [ ] Resolver cada diferencia y registrar evidencias; solo entonces considerar un checkpoint de aislamiento, separado del ensayo transaccional QA.

## E. Reversión y respuestas ambiguas

- [ ] Ante fallo: detener la secuencia, preservar journal y estado. Puede quedar un reemplazo activo en loopback; “HALT” no promete apagarlo automáticamente.
- [ ] Si se autoriza cierre manual: reconciliar IDs mediante lectura y detener únicamente newKong/newDB conocidos, sin borrar nada. Nunca adivinar IDs de un create que perdió su respuesta.
- [ ] Un fallo de rollback también detiene el rollback. Sin prune/reset/rm -v, red nueva, restauración automática del dump o manipulación de datos.
- [ ] Devolver nombres o reconectar endpoints originales exige decisión explícita; arrancarlos reabriría wildcard y no está incluido en la reversión segura. No montar ni iniciar un segundo DB sobre el volumen.
- [ ] Mantener P04-T01C BLOCKED hasta completar verificación y revisión. Ensayo con ROLLBACK, instalación QA persistente, Auth HTTP, Productos/T02 y publicación requieren otras autorizaciones.

## F. Recurrencia por lifecycle

lifecycle-policy.mjs está probado para aceptar como política únicamente start/restart de IDs ya verificados en un checkpoint fijado por hash y con bindings loopback exactos. No ejecuta nada en este build. Rechaza recreate, repair, comandos Supabase generales, checkpoint pendiente, puerto extra o wildcard.

Un futuro launcher exclusivo del proyecto debe usar ese gate antes/después de lifecycle y el transporte revisado; no invocar el CLI global para recrear el stack. El CLI 2.72.7 continúa generando HostIp vacío. No se modificó su binario, PATH, alias global, daemon, firewall ni otros proyectos. Una ejecución manual externa de Docker/Supabase puede saltarse el launcher: no se promete impedirla sin controles globales adicionales, fuera de alcance. Una recreación futura requiere otra revisión explícita y verifica todos los bindings nuevamente.
