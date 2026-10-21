# P04-T01C — propuesta mínima de bindings loopback

Estado: **BLOCKED / PLAN_ONLY**. No se ejecutó cambio alguno. P04-T01C no está listo para ensayo ni instalación de Productos.

## Evidencia y causa

El propietario confirmó desde un teléfono en la misma Wi-Fi que `http://192.168.0.108:56321/` respondió `{"message":"no Route matched with those values"}`. Es evidencia de alcance HTTP de la API desde LAN, aunque la ruta devuelva error. No demuestra acceso a datos ni una falla de autorización. Se registra como prueba externa informada por el propietario; no se repitió desde este proceso. PostgreSQL 56322 no fue probado remotamente: exposición potencial, no acceso remoto confirmado.

Nueva auditoría de metadatos: cinco contenedores/IDs, red y dos volúmenes coinciden con el manifiesto; rama codex/estadisticas-v1 y HEAD 923300265323d411c5c91b7935472d5423d228d2. No hubo SQL, Auth ni cambios de ciclo de vida. Ledger 124, datos y catálogo corresponden a la revalidación anterior; **no se consultaron nuevamente en esta tarea**.

| Origen | Hallazgo | Cambio propuesto futuro |
|---|---|---|
| scripts/statistics-v1/isolated-environment.mjs | `prepare` genera config desde template; `start` invoca Supabase CLI con --workdir privado y --exclude. No usa Compose propio ni define IP de publicación. | No ejecutar start/enable-storage/stop para esta reparación; no editar ahora. |
| supabase/statistics-v1-test/config.template.toml | api.port=56321 y db.port=56322; site_url/api_url loopback son URLs cliente, no bind del host. | No inventar api.host ni db.host. El contrato actual del validador tampoco acepta claves nuevas. |
| .runtime/supabase/config.toml | Hash coincide con manifiesto; configura números de puerto. | Mantener intacto para la alternativa selectiva. |
| Supabase CLI instalado | C:\Program Files\Supabase\supabase.exe, 2.72.7; start --help no ofrece bind-address. | No actualizar binario global: afectaría otros proyectos y no es necesario para esta propuesta. |
| Código CLI 2.72.7 | Kong: internal/start/start.go, PortBindings con HostPort desde Api.Port, sin HostIp. DB: internal/db/start/start.go, NewHostConfig, mismo patrón desde Db.Port. | Es el generador del HostIp vacío; no cambiar globalmente CLI. |
| Docker HostConfig live | DB 5432/tcp→HostIp vacío/56322; Kong 8000/tcp→HostIp vacío/56321. | Único delta de configuración requerido: HostIp="127.0.0.1" en esos dos bindings. |
| Docker NetworkSettings live | Expansión a 0.0.0.0 y :: para ambos puertos. Motor 29.1.3. | Exigir solo binding IPv4 explícito loopback; sin binding ::, 0.0.0.0 o IP LAN. |
| Red propia | IPv4=true, IPv6=false. | No cambiar red: deshabilitar IPv6 del bridge no impidió el listener IPv6 del host. |
| isolation-policy.mjs | Comprueba número de puerto y pertenencia a proyecto, pero no HostIp. validateEndpoints comprueba URLs cliente. | Proponer verificador adicional específico de loopback, con pruebas negativas; no relajar ni reescribir referencias anteriores. |

Fuentes primarias consultadas: [Kong/CLI 2.72.7](https://raw.githubusercontent.com/supabase/cli/v2.72.7/internal/start/start.go), [DB/CLI 2.72.7](https://raw.githubusercontent.com/supabase/cli/v2.72.7/internal/db/start/start.go), [publicación de puertos Docker](https://docs.docker.com/engine/network/port-publishing/), [docker container update](https://docs.docker.com/reference/cli/docker/container/update/). Docker documenta el binding loopback explícito; update no ofrece modificación de puertos publicados. La advertencia de Docker sobre alcance L2 con versiones anteriores a 28 no corresponde al motor 29.1.3 observado; igualmente se exige prueba externa, especialmente por Docker Desktop/WSL.

## Límite técnico y decisión necesaria

**No existe una modificación soportada de los bindings publicados de estos contenedores conservando sus mismos IDs.** Reiniciar los mismos contenedores conserva HostConfig. Cambiar únicamente el TOML o una URL cliente tampoco lo corrige.

Si “preservar los cinco contenedores” exige los cinco IDs originales activos e inalterados, el objetivo literal de bindings 127.0.0.1 no es ejecutable bajo esa condición. Debe permanecer BLOCKED. Un firewall podría filtrar tráfico conservando IDs, pero dejaría bindings wildcard y no satisface el objetivo literal; no se propone como corrección equivalente.

La recomendación, **solo si se autoriza una excepción explícita**, es recrear selectivamente DB y Kong con la misma configuración y contenido necesario, cambiando solo los dos HostIp. Mantener Auth, REST y Storage, red y volúmenes con IDs actuales. Conservar los dos contenedores originales detenidos y renombrados para recuperación, sin borrarlos. Resultado: cinco servicios activos y dos contenedores originales archivados; siete contenedores etiquetados del proyecto durante esa retención. Esto no se presenta como cinco contenedores totales ni como preservación de los dos IDs activos.

La autorización futura tendría que aceptar: dos nuevos IDs, parada breve de DB/API, retención de originales y un checkpoint de transición aprobado. Los verificadores antiguos de cinco IDs exactos fallarán legítimamente hasta que se apruebe ese nuevo estado. No actualizar el manifiesto original para esconderlo.

## Alcance mínimo del eventual cambio

Destino único: orderops-statistics-v1-test-74718de66a41. Binding objetivo:

```json
{
  "db": {"5432/tcp": [{"HostIp":"127.0.0.1","HostPort":"56322"}]},
  "kong": {"8000/tcp": [{"HostIp":"127.0.0.1","HostPort":"56321"}]}
}
```

No daemon.json, Docker Desktop settings, reglas globales, red nueva, cambio de puertos, grant, RLS, SQL, credenciales, RPC ni aplicación. Sin proxy adicional ni servicios auxiliares permanentes. No introducir un Compose reducido: omitiría configuración efectiva de los contenedores CLI.

## Secuencia propuesta — requiere autorización posterior

### 0. Preparación antes de cualquier parada

1. Aprobar la excepción anterior o mantener BLOCKED. Revalidar exclusividad, IDs, salud, hashes de archivos y configuración; ningún recurso ajeno puede compartir los dos volúmenes/red. Inventariar metadatos de otros proyectos solo como evidencia negativa, sin conectarse a sus bases ni alterar sus recursos.
2. Preparar y revisar un harness **nuevo** de recreación selectiva vía Docker Engine API; no existe un apply script aprobado en este paquete. Debe tener lista cerrada de dos IDs, dry-run, diff permitido exclusivamente PortBindings.HostIp, stop-on-error y ninguna llamada CLI start/stop/migration. No usar docker run con una lista manual incompleta de variables.
3. Guardar privadamente inspect completo y payload de creación de ambos contenedores; incluye secretos de Env/Entrypoint, por lo que no va a docs/Git/consola. Registrar únicamente hashes y metadatos sanitizados. Fijar imágenes por digest actual, no tags/latest ni pulls. Mantener Env, Cmd, Entrypoint, Healthcheck, User, WorkingDir, labels, límites, seguridad, mounts, logging y restart policy originales. No copiar IDs de endpoint dinámico como si fueran opciones de creación; conservar aliases/DNS de servicio sin colisiones.
4. Revisar el contenido necesario de las capas escribibles antes de aprobar ese harness. docker diff encontró configuración/root key de PostgreSQL fuera del volumen, y kong.yml/templates/certificados en Kong; el volumen DB por sí solo no preserva esas capas. Se encontró además `/tmp/orderops-estadisticas-recovered.dump` en DB. No se leyó su contenido. Capturar esos archivos de recuperación/configuración de forma privada y verificar sus hashes; no regenerar claves ni certificados por inferencia. Los sockets/PID temporales no se restauran como configuración. Si se requiere copiar/snapshot de capas, incluir comandos y artefactos exactos en la próxima revisión; no improvisar docker commit/export global ni afirmar que Config por sí sola conserva el filesystem.
5. Confirmar respaldo recuperable independiente, su alcance y hash. No ejecutar un nuevo dump, restauración o SQL dentro de esta autorización. Un respaldo lógico informado por el propietario no prueba preservación de root keys, configuración ni Storage.

### 1. Ventana controlada y cambio selectivo

Los comandos concretos de parada/renombrado se detallan en commands-and-tests.md. Son **previstos, no ejecutados**.

- Detener Kong y luego DB de forma limpia, sin force/rm. Auth/REST/Storage permanecen intactos; pueden registrar errores de conexión durante la ventana.
- Renombrar originales detenidos con sufijo `.pre-loopback-20261016`; no arrancarlos en paralelo con los reemplazos. Su restart policy debe quedar controlada y su estado detenido comprobado; no alterar políticas automáticamente.
- Crear reemplazos con los nombres originales mediante payloads completos revisados. Cambiar solo HostIp en HostConfig; reutilizar red/aliases originales y volumen DB exacto. No crear ni vaciar volúmenes. **Nunca dos procesos PostgreSQL sobre el mismo PGDATA.**
- Antes de arrancar, inspeccionar payload y contenedores detenidos: solo 127.0.0.1, mismos digests/mounts/configuración. Restaurar solo archivos de capa aprobados que no sean reproducibles byte a byte por el arranque original. Si no está demostrado, detener esta parte.
- Arrancar DB, comprobar salud; después Kong y su salud. No Supabase CLI start: además de los bindings por defecto, su flujo puede ejecutar inicializaciones y eliminar recursos propios ante fallos.
- No aplicar SQL de Productos, migraciones ni activaciones QA. El arranque normal de servicios escribe WAL/logs y puede ejecutar tareas internas habituales: no prometer identidad física bit a bit de un volumen activo. Exigir preservación lógica mediante controles posteriores separados.

### 2. Verificación y checkpoint

Comprobar localhost/LAN según commands-and-tests.md, nuevos bindings y listeners, cinco servicios activos, tres IDs no recreados, dos originales retenidos detenidos, red y dos volúmenes originales. Verificar exclusividad y ausencia de doble montaje activo DB.

Las comparaciones de marcador privado, ledger 124, funciones/grants/RLS y huellas de datos necesitarán **autorización futura de SELECT de solo lectura**, porque esta tarea prohíbe SQL. Deben usar READ ONLY/ROLLBACK y referencias antiguas inmutables. No declarar datos/ledger verificados tras una recreación únicamente por encontrar el mismo volumen.

Registrar transición explícita old→new IDs y hashes, manteniendo el manifiesto anterior. El verificador nuevo debe admitir solo esa transición aprobada y rechazar HostIp vacío, 0.0.0.0, ::, IP LAN, publicaciones adicionales y recursos ajenos. Su aprobación es previa a reanudar QA, no una actualización automática para producir PASS.

## Reversión y fallos

Reversión segura por defecto: detener únicamente los reemplazos; conservar originales, reemplazos, red y volúmenes. Mantener P04-T01C BLOCKED y los servicios afectados fuera de servicio. No borrar ni restaurar el volumen y no hacer reset/uninstall.

Volver a los originales requiere detener los reemplazos, renombrarlos y devolver los nombres a originales retenidos; antes de arrancar DB debe demostrarse que ningún otro proceso usa PGDATA. Esto restaura **también los bindings wildcard**. Por eso el arranque de originales no será rollback automático: requiere decisión expresa sobre la reapertura LAN o contención de red autorizada por separado. No presentar esa reversión como segura por sí sola. Se pueden devolver nombres conservando originales detenidos para mantener cierre.

La configuración/imagen original permanece disponible, no existe cambio de esquema que revertir. Restaurar backups solo sería recuperación ante corrupción demostrada y requeriría autorización específica; no es parte del rollback normal. No eliminar los originales archivados hasta otra autorización; nunca prune, rm -v, down -v o limpieza por prefijo.

## Riesgos y alternativas

| Alternativa / riesgo | Evaluación |
|---|---|
| Recreación selectiva DB+Kong | Menor superficie para el objetivo literal; requiere excepción de IDs, disponibilidad y revisión del filesystem/creación. Recomendación condicionada. |
| Firewall por puertos | Mantiene contenedores, pero no cambia binds y exige reglas IPv4/IPv6/interface/perfil efectivas. Solo alternativa de contención si se pide por separado. |
| IP por defecto en daemon/red | Efecto global o recreación de red; puede afectar otros proyectos. Descartada. |
| Modificar binario CLI global / supabase stop/start | Amplía superficie y puede recrear más servicios. Descartada para esta intervención. |
| Editar archivos internos Docker/WSL o metadatos de contenedores | No soportado y arriesga estado del motor. Descartado. |
| Proxy loopback dejando publicación original | La LAN seguiría accediendo al original. No corrige. |
| Nueva ejecución CLI futura | Podría recrear wildcard otra vez. Registrar prohibición de start/rebuild no verificado y exigir checker loopback antes de aceptar cualquier lifecycle futuro. |
| Fallo de pruebas externas | No reabrir QA por resultados locales; mantener BLOCKED. No atribuir un timeout aislado al bind sin confirmar dispositivo/red/IP correctos. |

## Decisión de salida

Se entregó diseño y auditoría de origen; no hay autorización ejecutiva. Para continuar, revisar si se acepta la recreación selectiva con retención de originales y nuevas identidades activas. Si no se acepta, mantener BLOCKED y evaluar contención firewall como objetivo distinto. Después se prepara el harness y su revisión exacta; la aplicación, los SELECT de preservación y las pruebas externas necesitan autorización explícita. No ensayo SQL, Auth, T02, publicación o adopción de candidatos por consecuencia de esta reparación.
