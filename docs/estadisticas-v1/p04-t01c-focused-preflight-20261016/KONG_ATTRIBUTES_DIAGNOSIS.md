# Tarea A — diagnóstico focalizado de atributos Kong

2026-10-16. **Limitación residual: BLOCKED para certificar preservación exhaustiva.** No se alteró el clasificador ni el ejecutor previo.

## Evidencia nueva reproducible

observe-kong.mjs verifica primero ID, imagen, Config, HostConfig, red y salud contra pins existentes. Consulta únicamente /home, /home/kong, /usr, /usr/local y /usr/local/kong del Kong original 313f159d75515e52b874369ace5b6f540a9bac833d2f5d644a8639e1a5b34e63.

| Ruta | Consulta de tamaño | Lectura dimensionada | Lectura independiente de 65.536 bytes |
|---|---:|---:|---:|
|/home|46|0|0|
|/home/kong|23|0|0|
|/usr|46|0|0|
|/usr/local|46|0|0|
|/usr/local/kong|23|0|0|

Se obtuvo exactamente lo mismo por tres vías: libc llistxattr, libc listxattr y syscall llistxattr 195 directo, comprobando arquitectura x86_64. Son entradas distintas al mismo kernel, no tres testigos independientes del almacenamiento subyacente. Cero errno en las operaciones de enumeración. Esto descarta que la discrepancia dependa exclusivamente de LuaJIT/libc, de usar no-follow o de un buffer insuficiente en esos casos.

Se consultaron además **solo tamaños**, nunca valores, de 12 nombres candidatos por ruta (60 lecturas): namespaces trusted.overlay, user.overlay, security.capability, security.selinux y ACL POSIX access/default. Todos retornaron -1/ENODATA(61). No prueba ausencia en las capas inferiores: el filesystem puede ocultar o transformar namespaces/nombres. Tampoco es un inventario de todos los nombres posibles.

Contexto observado: raíz overlay; kernel 6.18.54.1-microsoft-standard-WSL2; CapEff 00000000a80425fb, sin CAP_SYS_ADMIN; Seccomp2. No se añadieron capacidades ni se cambió usuario del contenedor; la lectura se ejecutó como container-root con las capacidades ya existentes. La herramienta tar es BusyBox1.35.0. Su versión no acredita captura/restauración de ACL/xattrs. No se ejecutó tar de directorios recursivo, export ni extracción de capas.

## Mecanismo que explica el síntoma y límite de atribución

En el código de OverlayFS6.18, la consulta con size=0 retorna el tamaño subyacente antes de filtrar. Con buffer, elimina nombres privados de OverlayFS y restringe otros trusted según capacidad en el namespace inicial. Por eso un tamaño positivo puede acompañar una lista visible vacía. Este mecanismo concuerda con la raíz overlay y los tres métodos observados. [Código upstream v6.18](https://raw.githubusercontent.com/torvalds/linux/v6.18/fs/overlayfs/xattrs.c), [rama Microsoft WSL6.18](https://raw.githubusercontent.com/microsoft/WSL2-Linux-Kernel/linux-msft-wsl-6.18.y/fs/overlayfs/xattrs.c).

**Inferencia respaldada, no identificación de cada atributo:** el filtrado kernel es la explicación principal; no se demostró qué nombres suman exactamente23/46 bytes ni si todos son metadata privada del motor. La rama pública no es una verificación del binario exacto6.18.54.1 cargado. No se accedió a upperdir/lowerdir ni al namespace del daemon. No inferir nombres por longitud ni concluir «sin ACL/xattrs».

## ¿El mecanismo de preservación existente los representa?

El tar/stream parser estricto anterior representa contenido, tipo admitido, UID/GID, modo y mtime; rechaza metadata extendida no soportada. No ofrece un canal que inventarie y restaure todos los atributos ocultos. La captura de17 archivos y22 directorios previa no resuelve esto. Los atributos privados de OverlayFS no deben copiarse ciegamente a otra capa como si fueran metadata de aplicación; también falta demostrar que no hay otros trusted relevantes.

**Resultado:** mecanismo actual insuficientemente acreditado para todos los metadatos necesarios. Se entiende la discrepancia de interfaz, pero no se habilita la preservación ni se elimina el gate. No se transforma advertised!=returned en PASS ni se modifica evidencia histórica.

## Próxima comprobación necesaria, no ejecutada

Revisar una propuesta separada de inspección daemon-side estrictamente ligada a las cinco rutas y al layer ID original, sin modificaciones, que enumere nombres/tipos y diferencie metadata interna de aplicación. No pedir privilegios extra dentro del contenedor para forzar un resultado. Si ese alcance no puede acotarse sin acceso a recursos ajenos, dejarlo bloqueado y elegir otra estrategia de preservación bajo nueva autorización. Cualquier ampliación del parser/restaurador exige diseño, pruebas y revisión propios antes de autorizar una parada. No se preparó una nueva recreación.
