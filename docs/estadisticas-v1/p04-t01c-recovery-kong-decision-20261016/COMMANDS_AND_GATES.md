# Comandos propuestos — NO ejecutados

Estos comandos describen exclusivamente una prueba nueva, no recreación de DB/Kong originales. Necesitan aprobación de los hashes del paquete, presupuesto, rol auxiliar SUPERUSER dentro del lab, initdb/restore y eliminación de la DB bootstrap **del lab nuevo**. No copiar/ejecutar por obtener READY. Limpieza del contenedor no está incluida.

## Antes de create

Revalidar el SHA del dump y scripts según evidence.json. Ventana reservada, CPU≤35%, memoria disponible≥4GiB, sin presión/OOM. No detener ni inspeccionar bases ajenas. Confirmar que el nombre no existe y que la imagen local tiene exactamente el digest previsto. `image inspect` solo de metadata de esa imagen, sin pull. Si Config.Volumes tiene algo distinto de /var/lib/postgresql/data o está fuera del conjunto permitido, HALT. No hacer descubrimiento/reparación automática.

```powershell
# SOLO TRAS AUTORIZACIÓN POSTERIOR
$qaDockerPipe = 'npipe:////./pipe/docker_engine'
$qaImage = 'sha256:4255b662ba3d774105cb34f623e410a3d7a860b68408ac6810f7e7e4b9781d5a'
$qaName = 'orderops-statistics-recovery-20261016-a'
function Invoke-LabDocker {
    param([string[]]$DockerArgs)
    $output = & docker --host $qaDockerPipe @DockerArgs
    if ($LASTEXITCODE -ne 0) { throw 'HALT; no retry' }
    return $output
}
$qaExisting = Invoke-LabDocker -DockerArgs @('ps','-aq','--filter',"name=^/$qaName`$")
if ($qaExisting) { throw 'HALT: name already exists; do not reuse/delete' }
$qaActualImage = Invoke-LabDocker -DockerArgs @('image','inspect','--format','{{.Id}}',$qaImage)
if ($qaActualImage.Trim() -ne $qaImage) { throw 'HALT: image mismatch' }
$qaImageVolumes = Invoke-LabDocker -DockerArgs @('image','inspect','--format','{{json .Config.Volumes}}',$qaImage)
# Revisar: null, {} o únicamente /var/lib/postgresql/data. Otro resultado: HALT.
```

La comprobación de Volumes no debe limitarse a una nota manual en una ejecución automatizada: el operador debe registrar el JSON revisado y su aceptación **antes** de create. No hay ejecutor de create habilitado por este paquete.

## Create, comprobación y start exclusivos del nuevo laboratorio

```powershell
$qaCreateArgs = @(
    'create','--pull=never','--name',$qaName,
    '--label','orderops.statistics.recovery=20261016-a',
    '--network','none','--restart','no','--no-healthcheck',
    '--user','postgres','--read-only','--cap-drop','ALL',
    '--security-opt','no-new-privileges','--ipc','private',
    '--memory','2147483648','--memory-swap','2147483648',
    '--cpus','0.75','--pids-limit','128','--shm-size','64m',
    '--tmpfs','/qa:rw,nosuid,nodev,noexec,size=1073741824,mode=1777',
    '--tmpfs','/var/lib/postgresql/data:rw,nosuid,nodev,noexec,size=1048576,mode=1777',
    '--entrypoint','/bin/sh',$qaImage,
    '-c','while :; do sleep 3600; done'
)
$qaNewId = (Invoke-LabDocker -DockerArgs $qaCreateArgs).Trim()
if ($qaNewId -notmatch '^[a-f0-9]{64}$') { throw 'HALT: ambiguous create response' }
# Registrar ID/UTC/nombre/label/imagen en expediente nuevo. No actualizar pins originales.
node docs/estadisticas-v1/p04-t01c-recovery-kong-decision-20261016/assert-new-lab.proposed.mjs --assert-new-lab $qaNewId
if ($LASTEXITCODE -ne 0) { throw 'HALT: layout not accepted' }
Invoke-LabDocker -DockerArgs @('start',$qaNewId)
node docs/estadisticas-v1/p04-t01c-recovery-kong-decision-20261016/assert-new-lab.proposed.mjs --assert-new-lab $qaNewId
if ($LASTEXITCODE -ne 0) { throw 'HALT: running layout changed' }
```

No -p/-P, --mount bind, -v, --volumes-from, --privileged, host network/PID, Supabase CLI ni imagen por tag. El gate exige mounts exclusivamente tmpfs, sin puertos y labels/ID nuevos; rechaza los cinco IDs originales. Respuesta incierta de create/start: detener, no repetir ni buscar/eliminar «algo parecido».

## Staging, restore y comparación

```powershell
node docs/estadisticas-v1/p04-t01c-recovery-kong-decision-20261016/stage-new-lab.proposed.mjs --stage-new-lab $qaNewId
if ($LASTEXITCODE -ne 0) { throw 'HALT: staging failed' }
# Copia binaria via stdin en memoria; solo /qa/input con chmod077, sin raw dump en logs/Git.
Invoke-LabDocker -DockerArgs @(
    'exec','--user','postgres',
    '-e','RECOVERY_PLAN_ACK=orderops-recovery-20261016-a',
    '-e',"RECOVERY_LAB_ID=$qaNewId",$qaNewId,
    'sh','/qa/input/restore.sh'
)
node docs/estadisticas-v1/p04-t01c-recovery-kong-decision-20261016/compare-new-lab.proposed.mjs --compare-new-lab $qaNewId
if ($LASTEXITCODE -ne 0) { throw 'HALT: recovery incomplete/failed' }
# Conservar resultado sanitizado/hashes y la autorización consumida en un expediente nuevo.
# Tras éxito, únicamente parar el NUEVO servidor PG; contenedor/tmpfs retenidos, sin cleanup.
Invoke-LabDocker -DockerArgs @('exec','--user','postgres',$qaNewId,
    'timeout','--signal=TERM','--kill-after=5s','40s',
    'pg_ctl','-D','/qa/pgdata','-m','fast','-w','-t','30','stop')
```

Los timeouts internos solo controlan procesos del lab nuevo; nunca se usa kill o stop sobre contenedores originales. Un fallo detiene la secuencia: no se recapturan fuentes, repite restore, cambia roles/extensiones ni limpia el lab. Los procesos y logs restantes quedan limitados al lab; pedir decisión de contención específica si queda activo. No eliminar el intent/registro para reintentar.

## Comprobaciones y evidencia

El gate antes de cada helper contrasta ID, nombre, imagen, label, usuario, red none, puertos vacíos, sin binds/volúmenes, readonly rootfs, tmpfs y límites. Antes de restore se verifican binarios y hash otra vez. El helper de comparación exige data_directory=/qa/pgdata, listen_addresses vacío y system_identifier textual **distinto** del original7695864922466676780. El origen no se consulta.

Guardar solo: create ID auténtico, inspección sanitizada/layout, retorno de cada etapa, hashes de inputs, versión de herramientas/extensiones, roles auxiliares sin passwords, conteos/huellas y diferencias de objetos/datos. No exportar logs privados completos de PG/restore, archivos SQL con filas, claves, tokens o redump bruto. Ante error, logs permanecen en /qa/private; una inspección posterior necesita permiso acotado, no «cat logs» a la conversación.

Los comandos de eliminación no se ejecutan ni forman parte del ensayo. La autorización posterior de cleanup debe fijar el ID nuevo y volver a comprobarlo; nunca usar nombre parcial, rm -v, prune, borrado de imagen o red. Detener/eliminar el contenedor borra su tmpfs: registrar aceptación de pérdida del laboratorio antes de hacerlo.
