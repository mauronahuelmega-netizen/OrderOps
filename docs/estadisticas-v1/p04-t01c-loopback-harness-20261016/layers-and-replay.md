# Auditoría de capas y restauración propuesta

El inventario por ruta, modo, UID/GID, tipo, tamaño y hash está en dry-run.json. El origen completo y tar originales están cifrados. Cobertura: todas las entradas A/C observadas de docker diff de DB y Kong, no una lectura de todos los volúmenes ni del filesystem Docker de otros proyectos. Una eliminación D, objeto especial persistente desconocido, hard link no resuelto o ruta nueva fuera de cobertura detiene el harness.

## Archivos que deben conservarse

DB, cuatro archivos:

- /etc/postgresql-custom/pgsodium_root.key
- /etc/postgresql.schema.sql
- /etc/postgresql/postgresql.conf
- /tmp/orderops-estadisticas-recovered.dump

Kong, trece archivos:

- /home/kong/custom_nginx.template
- /home/kong/kong.yml
- /home/kong/localhost.crt
- /home/kong/localhost.key
- /usr/local/kong/.kong_env
- /usr/local/kong/nginx-kong-stream.conf
- /usr/local/kong/nginx-kong.conf
- /usr/local/kong/nginx.conf
- /usr/local/kong/ssl/admin-kong-default-ecdsa.crt
- /usr/local/kong/ssl/admin-kong-default-ecdsa.key
- /usr/local/kong/ssl/admin-kong-default.crt
- /usr/local/kong/ssl/admin-kong-default.key
- /usr/local/kong/ssl/ffdhe2048.pem

Se preservan incluso los archivos regenerables: no se supone que una regeneración mantendrá una clave o certificado. El dump es material de recuperación, no se restaura sobre PGDATA ni se usa como seed. No se certificó su capacidad de restauración por leerlo y calcular su hash.

## Mecanismo

Captura de cada leaf con `docker cp OLD_ID:/ruta/exacta -`, sin -L ni extracción local. Tar conservado byte a byte dentro del bundle cifrado. Se validan checksum tar, rutas relativas sin traversal, tipos admitidos, UID/GID/modo contra stat y hash de contenido. El cifrado y su roundtrip comprueban integridad de la captura almacenada, no consistencia transaccional de datos. Límites: 32 MiB por archivo, 128 MiB total; excederlos detiene, no trunca.

Las imágenes base quedan fijadas a los IDs actuales: DB `sha256:4255b662ba3d774105cb34f623e410a3d7a860b68408ac6810f7e7e4b9781d5a`; Kong `sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d`. Lo no modificado depende de esas mismas imágenes, no de un tag futuro.

Restauración futura: crear reemplazo detenido; construir únicamente entradas tar de directorio con los modos/UID/GID registrados; luego PUT de cada tar leaf sobre el parent exacto mediante Engine API, con copyUIDGID y noOverwriteDirNonDir. No extraer sobre mounts de datos ni reemplazar directorios recursivamente. Verificar mediante GET archive antes de arrancar: tipo, contenido, UID/GID, modo y metadatos disponibles. Los timestamps de archivos están en el tar; la metadata completa de directorios debe volver a capturarse en el checkpoint detenido. No atribuir preservación completa de ACL/xattrs a la verificación de modo Unix.

Los directorios A/C se registran individualmente, sin copia recursiva. Incluyen /etc y sus directorios PostgreSQL, /var/lib/postgresql y ancestros, /run, /tmp, /home/kong y los directorios nginx/SSL/cache. /var/lib/postgresql/data es el volumen **excluido**: se reutiliza el mismo volumen; no se copia, inicializa ni monta desde un segundo PostgreSQL activo.

## Transitorios y retención

No reinyectar sockets/locks de /run/postgresql, PID de nginx, scratch /tmp/resty_* ni logs de proceso. Las entradas de log incluyen symlinks a stdout/stderr y un archivo vacío; restaurarlos desde una ejecución previa no es configuración persistente. No se borran: quedan en los contenedores originales retenidos y sus logs Docker. Los directorios necesarios conservan su metadata; el proceso crea sus transitorios propios al arrancar.

## Replay de entrypoint

replay-analysis.json analiza scripts sin ejecutarlos. Las sobreescrituras de schema/key DB y cuatro archivos de /home/kong coinciden exactamente con literales embebidos en los entrypoints originales. El append PostgreSQL agrega nuevamente un bloque de comentarios/blancos ya presente como sufijo: se registra el hash esperado posterior, distinto del previo. No se cambia el entrypoint para evitar ese append.

La preparación de nginx y SSL interna al proceso también puede escribir runtime/config generada. Prestar especial atención a mantener los certificados/keys SSL existentes y verificar sus hashes después del arranque. Si se sustituyen, fallar y detener: no aceptar certificados nuevos como equivalentes. No se ha ejecutado esa prueba.

## Consistencia y atributos

No capabilities informadas en los 17 leaves. Se enumeraron xattrs visibles en 13 rutas DB y 26 Kong; no se devolvieron atributos/ACL POSIX. Registrar la diferencia entre tamaño anunciado y devuelto en algunas rutas Kong, sin atribuir causa. La visibilidad está limitada al kernel/capacidades actuales. Si la recaptura detenida descubre atributos no capturados, detener hasta diseñar su archivo/restauración; no eliminar esos atributos ni instalar herramientas automáticamente.

Después de detener originales no usar `docker exec stat`: no funcionará. Usar sus archivos tar y metadata de archive API, recapturar leaves con docker cp y comparar con el inventario live; cualquier diferencia persistente no explicada bloquea. No ejecutar el harness live contra un estado detenido relajando su comprobación Running. La recaptura detenida y su adaptador se revisan como parte del siguiente gate, no están certificados por este dry-run.
