# Kong — alternativa recomendada y límites de preservación

**Recomendación única: reconstrucción declarativa del estado de aplicación desde la imagen fijada, con original íntegro retenido y ensayo de clon aislado antes de sustitución.** No se recomienda continuar intentando un traslado bit a bit de metadata OverlayFS con el tar actual. La recomendación es de diseño: **Kong sigue BLOCKED para intervención** y no se habilita el ejecutor ni se alteran sus políticas.

## Qué se conoce

Kong original313f159d75515e52b874369ace5b6f540a9bac833d2f5d644a8639e1a5b34e63, sin mounts de datos, imagen sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d. Bundle cifrado aprobado conserva Config/HostConfig/payload y13 archivos Kong, además de metadata de13 directorios. El inventario conocido tiene31 cambios:13 archivos,13 directorios y5 transitorios. Es una captura anterior live, no recaptura detenida.

Las cinco rutas /home, /home/kong, /usr, /usr/local y /usr/local/kong mostraron23/46bytes anunciados y lista visible vacía por tres métodos. El filtrado OverlayFS explica el mecanismo, pero los nombres concretos no se enumeraron. **No se declara que todos sean internos/irrelevantes ni que no existan otros trusted.** El nuevo diseño no cambia esa evidencia.

## Clasificación del estado

| Clase | Elementos | Tratamiento propuesto |
|---|---|---|
|Configuración indispensable|Config/Env, Cmd/Entrypoint, usuario, imagen, working dir, healthcheck, límites/restart, puertos internos, aliases/red, plugins y servicios/rutas declarados|Restaurar desde payload privado íntegro validado. Solo HostIp externo podrá cambiar con otra autorización. No imprimir Env/config privada.|
|Inputs indispensables|/home/kong/kong.yml, custom_nginx.template, localhost.crt y localhost.key|Preservar bytes exactos, UID/GID/modo y relación certificado/clave. No generar nuevas identidades TLS. El replay literal previo coincide, pero debe validarse en clon real.|
|Estado generado que también debe conservarse/compararse|.kong_env; nginx.conf/nginx-kong.conf/nginx-kong-stream.conf; cinco archivos en /usr/local/kong/ssl|Guardar las13 hojas completas. Probar regeneración por entrypoint; no asumir que un archivo «generado» es prescindible. Cualquier diferencia de clave, certificado o configuración efectiva no aprobada bloquea.|
|Metadata operacional POSIX|Tipo/ruta, UID/GID, modo, setgid de /home/kong, permisos de /usr/local/kong, symlinks, ownership de directorios de prefix y acceso de usuario100/gid65533|Reproducir los valores medidos necesarios, sin copiar árboles de sistema completos ni alterar modos por «hardening» incidental. Contrastar vistas lógicas antes/después. Registrar mtimes nuevos del replay sin falsificar identidad histórica.|
|Transitorios|PID, sockets, locks y symlinks de logs a stdio; directorios temporales|No reinyectar PID/socket viejo. Conservar relación de logs/permisos; generar runtime nuevo con trazabilidad. Datos inesperados no se clasifican automáticamente como temporales.|
|Metadata interna de implementación del filesystem|Whiteouts/origin/opaque/redirect y otros atributos privados cuando estén identificados como tales|No trasladarlos manualmente a otra capa: expresan relaciones del filesystem antiguo. La imagen + writes aprobados deja que Engine cree su propia metadata. No extender esta categoría por longitud de nombre o lista vacía.|
|Metadata aún desconocida|Los nombres ocultos no identificados y cualquier cambio no explicado|Se conserva íntegra en el contenedor/capa original; no se «aprueba su pérdida». Sigue limitando la certificación y exige revisión del contrato antes de sustituir.|

OverlayFS usa metadata para representar eliminaciones, directorios opacos y relaciones entre capas; copiarla ciegamente puede cambiar la vista lógica de archivos. [Documentación del kernel](https://docs.kernel.org/filesystems/overlayfs.html). Una reconstrucción de aplicación desde imagen no equivale a clonar esos internals ni prueba que todo lo oculto sea interno.

## Comparación de alternativas

| Aspecto | Estrategia actual: replay exhaustivo de capa/atributos | Recomendada: imagen + estado declarado + original retenido |
|---|---|---|
|Pretensión|Continuidad de todas las hojas/metadata seleccionadas|Equivalencia operacional explícita de inputs/config/identidad de aplicación; no igualdad de capas Engine|
|Bloqueo actual|No puede enumerar/representar todos los atributos; requiere ausencia demostrada|No copia internals; necesita cierre del manifiesto de estado lógico, prueba de clon y aceptación de límites|
|Riesgo|Omitir atributos ocultos o reinyectar metadata incompatible|Dependencia funcional no detectada, archivo generado divergente o cobertura insuficiente|
|Recuperación|Tar parcial no prueba clonado total|Original detenido completo sigue como referencia; no rm/prune/reset ni GC autorizado|
|Revisión necesaria|Nuevo acceso a capas/namespace o mecanismo completo, no disponible ahora|Nuevo contrato de preservación de aplicación, comparador/twin y pruebas antes de ventana; sin cambios actuales|

La opción recomendada evita depender técnicamente de copiar atributos privados de otra capa, **pero no elimina por suposición el riesgo desconocido**. Conservar original significa preservar esa información en su lugar, no migrarla ni asegurar independencia frente a fallo del host. Si el propietario exige equivalencia forense de toda metadata oculta, esta alternativa no la satisface: no continuar con sustitución y solicitar un mecanismo de snapshot soportado y probado. No presentar una prueba HTTP como prueba forense.

## Evidencia mínima antes de pedir sustitución

1. Aprobar explícitamente el contrato de preservación de aplicación y retención del original, separado del viejo contrato de ausencia de xattrs del ejecutor. Este paquete **no cambia** el gate actual ni introduce una excepción automática.
2. Inventario fresco y cerrado de cambios respecto de la imagen: rutas/tipos/bytes/UID/GID/modos/symlinks, sin eliminaciones o objetos nuevos inexplicados. Comparar la vista lógica de los árboles relevantes de original y clon para detectar efectos de opaque/whiteouts/redirect (no solo los13 hashes conocidos). Presupuesto de lectura y cobertura aprobados; truncamiento o subtree omitido se informa, no PASS.
3. Con permiso separado, probar un clon desde el digest y bundle verificado, sin conexiones a servicios reales, ni puertos publicados. Reproducir templates, prefix y TLS; comprobar que certificados/claves no se regeneren y que renderización/estado efectivo sean los esperados. La retención del contenedor original no autoriza detenerlo para probar.
4. Validar configuración con herramientas de la misma imagen (disponibilidad/comandos concretos deberán revisarse antes del ensayo), arranque sin errores, permisos bajo el mismo usuario/capacidades, rutas/plugins/headers/métodos, denegaciones, límites y TLS con upstreams sintéticos. Requests solo internos al clon y con fixtures explícitos; **no Auth HTTP real** por este permiso.
5. Comparar fingerprints/configuración efectiva y logs sanitizados; cubrir cada ruta/plugin declarado. Inventariar diferencias naturales de proceso/mtime/ID por separado, sin normalizar claves, certificados, permisos o datos. Un diff no explicado o una ruta sin test bloquea. Las pruebas funcionales son necesarias, no demuestran por sí solas irrelevancia de toda metadata oculta.
6. Solo tras aceptación: solicitar ventana de intervención distinta, recaptura detenida y preservación del original con IDs/metadata reales, no volver a escribir históricos. Conservar también la imagen/bundle y prohibir limpieza del original hasta aceptación humana final. No iniciar originales wildcard como rollback automático.

## Criterio de no continuar

No autorizar sustitución si hay contenido lógico no explicado, ACL/capabilities/etiquetas funcionales necesarias sin restaurador, fallos TLS/entrypoint/plugins, clon sin pruebas suficientes, retención original no garantizada, backup no aceptado o diferencias ocultadas. Si los nombres de atributos siguen desconocidos, registrar ese residual en la decisión y exigir contrato/aceptación explícitos; no afirmar «sin pérdida». Por ahora la acción defendible es probar la recuperabilidad independiente y preparar después el ensayo de clon, **no intervenir Kong**.
