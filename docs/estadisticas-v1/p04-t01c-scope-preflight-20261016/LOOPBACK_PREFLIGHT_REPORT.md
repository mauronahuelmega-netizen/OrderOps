# Preflight loopback — solo lectura

2026-10-16. **P04-T01C = BLOCKED.** Resultados nuevos en live-resources.json, private-bundle-audit.json y xattr-audit.json. No SQL, Auth HTTP, intervención, nuevo PostgreSQL ni adopción de candidatos.

## Resultado por control

| Control | Resultado | Evidencia y límite |
|---|---|---|
|Worktree/rama/HEAD|PASS|OrderOps-Estadisticas; codex/estadisticas-v1; 923300265323d411c5c91b7935472d5423d228d2. 3.051 archivos iniciales preservados; seis modificaciones rastreadas previas, sin incorporarlas a commits.|
|Cinco IDs originales|PASS|IDs exactos abajo; hashes Config y HostConfig de los cinco coinciden con pins históricos.|
|Estado/salud|PASS con límite|Cinco running. DB/Kong/Auth/Storage healthy; REST NO_HEALTHCHECK. Esto no prueba funcionamiento REST/Auth, datos ni RPC.|
|Red/dos volúmenes|PASS|Misma red ID original, exactamente cinco endpoints, volúmenes originales. Inventario global de metadatos sin consumidores ajenos de red/volúmenes ni publicaciones ajenas de 56321/56322. No conexión a sus servicios.|
|Aislamiento por bindings|BLOCKED|HostIp vacío en HostConfig; publicaciones efectivas 0.0.0.0 y :: en ambos puertos. No son loopback.|
|Artefactos/checkpoint|PASS integridad|Inventario previo y baseline verificados sin reescritura; manifest, configuración, signing keys, instalador y bundles contrastados por hash. Evidencia final en preservation.json/evidence.json.|
|Bundle privado aprobado|PASS offline|DPAPI del usuario + AES-GCM; dos payloads y 17 archivos con checksums, propietario/modo y contenido. Dos requests cualificados rechazados por barrera nativa. Sin Engine ni plaintext persistido por el auditor.|
|Respaldo independiente recuperable|BLOCKED evidencia|Reporte del propietario conservado. Dump incluido en bundle, pero ubicación independiente actual, completitud lógica y restauración en otro entorno no demostradas aquí. No se confunde descifrado con recuperabilidad.|
|ACL/xattrs|BLOCKED|39 rutas consultadas. Cinco directorios Kong anuncian bytes y devuelven cero. No se acredita ausencia de atributos ocultos ni preservación exhaustiva.|
|Docker Engine/ejecutor|BLOCKED para intervención|Engine 29.1.3, API1.52, mínima1.44, linux/amd64. Adaptador propuesto conserva barrera incondicional; compatibilidad wire/replay/export real no probada. No habilitado.|
|Marcador/ledger/catálogo/RLS/datos|NO EJECUTADO|Referencia previa ledger124. No hay permiso SQL actual; identidad de recursos no demuestra identidad lógica ni invariancia de los datos. Propuesta separada en sql-readonly-proposal.md.|

## Identidad exacta

Proyecto: orderops-statistics-v1-test-74718de66a41. Prefijo de nombres: supabase_ + servicio + _ + proyecto.

| Servicio | ID | Salud |
|---|---|---|
|db|592f44984962a26c6552ccb02937d56385a8db008eb8e7a27e8be2d932f77bd1|healthy|
|kong|313f159d75515e52b874369ace5b6f540a9bac833d2f5d644a8639e1a5b34e63|healthy|
|auth|fe21c043f6fbdefe5124142137d61231755d36c8058a37354d2a01a635ab5a6c|healthy|
|rest|3229777e8e59a5183771b6b01320d3108e142c62e02b98b243d7c4bfc798e663|NO_HEALTHCHECK|
|storage|d91703176efac3032f8125fb4d42bfcc5cd359c42e4b5d00d79b62d274ba6a28|healthy|

Red supabase_network_orderops-statistics-v1-test-74718de66a41, ID dfbf3cf0bf455393fd0c01a0f61438fd19fd18dfe5f4107c2bafc32589c476af, bridge, IPv6 desactivado en esa red. Esto **no elimina** la publicación host IPv6 ::.

Volúmenes: supabase_db_orderops-statistics-v1-test-74718de66a41 y supabase_storage_orderops-statistics-v1-test-74718de66a41, driver local y etiqueta exclusiva. DB monta PGDATA original; Kong no tiene mounts. Digests de imagen y payloads permanecen iguales a pins.json, con comprobación nueva. El candidato de create conserva como único cambio funcional HostIp=127.0.0.1; la referencia Image usa el mismo digest resuelto.

56321 → Kong8000/tcp; 56322 → DB5432/tcp. Cada puerto publica 0.0.0.0 y ::. La solicitud desde teléfono a 192.168.0.108:56321 con respuesta de Kong es evidencia del propietario de acceso LAN, no una nueva prueba en esta tarea ni prueba de acceso a datos. 56322 no fue probado remotamente. No se volvió a conectar a API, Auth o PostgreSQL.

## Discrepancia de atributos y capas

| Ruta Kong | Bytes anunciados | Devueltos |
|---|---:|---:|
|/home|46|0|
|/home/kong|23|0|
|/usr|46|0|
|/usr/local|46|0|
|/usr/local/kong|23|0|

Se enumeraron nombres/conteos sin valores, con capacidades existentes de container-root, sin instalar herramientas. DB: 13 rutas visibles sin atributos; Kong: 26 rutas, cinco ambiguas. allZero describe lo visible, **no** equivale a ausencia exhaustiva. El nuevo clasificador marca BLOCKED_INCOMPLETE_ATTRIBUTE_VISIBILITY; no se cambió el verificador antiguo ni su resultado histórico.

docker diff conserva el mismo conjunto de 16 entradas DB y 31 Kong (47 total), sin añadidos ni eliminados. No es comprobación del contenido actual de cada archivo: diff informa cambios respecto de la imagen, no una huella del filesystem completo. El bundle demuestra integridad de la captura anterior, no recaptura detenida actual.

El dump capturado /tmp/orderops-estadisticas-recovered.dump tiene SHA histórico b48f1ed8f4f6a6a75f946a2a55b388f88f20c6d05cc48fecf42cd166af1eecdc. Es copia dentro del contenedor y de su bundle; no demuestra por sí sola un respaldo externo independiente. DPAPI depende del perfil Windows. No se restauró ni se abrió el dump con herramientas PostgreSQL.

## Compatibilidad y detención

El checkpoint anterior READY_FOR_LOOPBACK_INTERVENTION_REVIEW era offline. Sus 371 pruebas no se reejecutaron ni se presentan como pruebas Engine. La validación nueva del bundle sí se ejecutó y confirmó el bloqueo del adaptador incluso con payloads reales. El API instalado admite el rango numérico previsto, pero esto no prueba semántica de stop/export/restore/create ni aceptación de payloads.

Se detuvieron las comprobaciones live tras reproducir la visibilidad incompleta. Sin reintentos para forzar PASS. Los controles restantes son documentales/offline. No se modificaron contenedores, redes, volúmenes, servicios, bindings, firewall, RLS, grants ni archivos de otros proyectos. La inspección negativa global fue solo de metadata Docker; no se inspeccionaron sus aplicaciones ni bases.

La siguiente decisión no debe aprobar todavía una parada: resolver atributos y recuperabilidad, autorizar por separado integridad SQL read-only y revisar un nuevo build de intervención explícito. El actual sigue cerrado y la configuración QA/Productos continúa sin instalación por esta tarea.
