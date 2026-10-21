# Comandos previstos y aceptación — NO ejecutarlos todavía

Estos comandos describen el procedimiento futuro sujeto a la excepción y gates de plan.md. No constituyen un script autónomo listo para ejecutar: falta construir/revisar el harness privado completo de creación y preservación de capas. No se han creado payloads con secretos ni realizado paradas.

## Observación previa/posterior (solo metadatos)

```powershell
docker container inspect supabase_db_orderops-statistics-v1-test-74718de66a41 supabase_kong_orderops-statistics-v1-test-74718de66a41 --format '{{.Name}} {{json .HostConfig.PortBindings}} {{json .NetworkSettings.Ports}}'
docker ps -a --filter label=com.supabase.cli.project=orderops-statistics-v1-test-74718de66a41 --format '{{.ID}} {{.Names}} {{.Status}} {{.Ports}}'
docker network inspect supabase_network_orderops-statistics-v1-test-74718de66a41 --format '{{.Id}} {{json .Options}}'
docker volume inspect supabase_db_orderops-statistics-v1-test-74718de66a41 supabase_storage_orderops-statistics-v1-test-74718de66a41 --format '{{.Name}} {{.Driver}} {{json .Labels}}'
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in @(56321,56322) } | Select-Object LocalAddress,LocalPort,OwningProcess
```

Las llamadas de inspección equivalentes se ejecutaron en esta auditoría. Las pruebas de conexión que siguen no se ejecutaron.

## Cambio futuro (prohibido hoy)

Solo después de captura privada, validación de capas, exclusividad y autorización de la ventana:

```powershell
docker stop --time 60 supabase_kong_orderops-statistics-v1-test-74718de66a41
docker stop --time 60 supabase_db_orderops-statistics-v1-test-74718de66a41
docker rename supabase_kong_orderops-statistics-v1-test-74718de66a41 supabase_kong_orderops-statistics-v1-test-74718de66a41.pre-loopback-20261016
docker rename supabase_db_orderops-statistics-v1-test-74718de66a41 supabase_db_orderops-statistics-v1-test-74718de66a41.pre-loopback-20261016
```

Tras cada comando: comprobar código de salida y estado/ID esperado; detener secuencia ante fallo. Nunca continuar con un original running. No ejecutar stop de proyecto ni stop de contenedores ajenos.

Creación por Engine API local, mediante adaptador a named pipe Docker revisado posteriormente (sin exponer socket TCP):

```text
POST /v1.52/containers/create?name=supabase_db_orderops-statistics-v1-test-74718de66a41
POST /v1.52/containers/create?name=supabase_kong_orderops-statistics-v1-test-74718de66a41

Payload = Config original + HostConfig original + NetworkingConfig reconstruida y revisada.
Únicos deltas de configuración permitidos:
 DB: HostConfig.PortBindings["5432/tcp"] = [{HostIp:"127.0.0.1",HostPort:"56322"}]
 Kong: HostConfig.PortBindings["8000/tcp"] = [{HostIp:"127.0.0.1",HostPort:"56321"}]
Image debe fijarse al digest observado, no a un tag mutable.
```

Config de inspect y API create no son documentos intercambiables completos: el adaptador debe separar campos válidos, eliminar información runtime/IDs de endpoint y reconstruir aliases, sin perder configuraciones. La revisión del payload final y de la preservación de capas es gate obligatorio, no detalle a improvisar durante una caída. No se publica Env ni Entrypoint completos en documentación.

Después de comprobar contenedores creados todavía detenidos y sus capas/configuración:

```powershell
docker start supabase_db_orderops-statistics-v1-test-74718de66a41
# Esperar salud de DB con observaciones acotadas; no ejecutar SQL ni init adicional implícito del CLI.
docker start supabase_kong_orderops-statistics-v1-test-74718de66a41
```

Si DB no pasa salud, no arrancar Kong ni intentar reparar/reiniciar automáticamente. No arrancar el original DB simultáneamente.

## Pruebas posteriores desde el host

Sin Auth, tokens, SQL ni llamadas RPC:

```powershell
curl.exe --noproxy '*' --connect-timeout 3 --max-time 5 -i http://127.0.0.1:56321/
Test-NetConnection -ComputerName 127.0.0.1 -Port 56321 -InformationLevel Detailed
Test-NetConnection -ComputerName 127.0.0.1 -Port 56322 -InformationLevel Detailed
```

Aceptación: TCP localhost verdadero en ambos; HTTP puede devolver el mismo error de ruta de Kong y aun así prueba transporte. TCP 56322 no certifica ledger ni autorización PostgreSQL. No enviar consultas ni credenciales. Si localhost falla, la corrección no cumple aunque LAN falle también.

Verificar listeners: ningún 0.0.0.0, :: o IP LAN para esos puertos. Bajo Desktop/WSL puede existir forwarding loopback auxiliar; cualquier listener extra exige atribución al proceso y demostrar su alcance. El binding Docker exacto 127.0.0.1 y los tests LAN deben coincidir; un listener wildcard residual no se ignora por conveniencia. IPv6 ::1 no es lo mismo que ::, pero el objetivo solicitado es 127.0.0.1 sin publicación adicional.

## Pruebas desde otro dispositivo en la misma LAN

Confirmar IP actual del host; `192.168.0.108` es la IP de la prueba informada y puede cambiar por DHCP. Sin VPN/proxy ni aislamiento Wi-Fi entre clientes; registrar hora UTC, IP/dispositivo y resultado. Usar solo los dos puertos propios, sin escaneo de red.

Desde teléfono: abrir nuevamente `http://192.168.0.108:56321/`. Debe fallar la conexión; **cualquier respuesta HTTP**, incluso 401/403/404 o el error de Kong, demuestra que la API sigue alcanzable y es FAIL de aislamiento.

Desde una computadora LAN con PowerShell:

```powershell
Test-NetConnection -ComputerName 192.168.0.108 -Port 56321 -InformationLevel Detailed
Test-NetConnection -ComputerName 192.168.0.108 -Port 56322 -InformationLevel Detailed
```

Ambos TcpTestSucceeded deben ser false mientras las pruebas localhost son true. Para PostgreSQL basta conexión TCP, sin login/SQL. Si solo se dispone del teléfono, usar herramienta de conexión TCP con destino único o declarar 56322 pendiente; una navegación HTTP a 56322 no demuestra cierre de PostgreSQL. Comprobar IPv6 LAN del host si existe una dirección enrutable; no inferir su cierre a partir del test IPv4. No usar localhost en el teléfono: apuntaría al teléfono.

No certificar con un timeout aislado: verificar red/IP/dispositivo correctos y registrar una segunda comprobación acotada con localhost operativo al mismo tiempo. No vaciar cachés ni forzar firewall. Si no hay dispositivo apropiado, marcar pendiente y mantener BLOCKED.

## Controles lógicos posteriores sujetos a autorización separada

Reutilizar SELECT de solo lectura con ROLLBACK de la referencia P04-T01C para marcador, ledger 124, funciones/ACL/políticas/triggers y huellas de las 15 tablas, más control de sesiones si se requiere. Ninguna sentencia SQL se ejecuta en esta tarea. No atribuir un PASS financiero a un puerto TCP disponible.

## Reversión prevista (no automática)

1. Detener reemplazos, sin eliminarlos ni tocar volúmenes. Mantener cierre y estado BLOCKED.
2. Si se autoriza devolver nombres: renombrar reemplazos con sufijo `.loopback-failed-20261016`, y originales retenidos nuevamente a nombres originales. Comprobar colisiones antes de cada rename. Permanecen detenidos por defecto.
3. Arrancar originales solo bajo decisión expresa: reabrirían wildcard/LAN y pueden necesitar contención autorizada por separado. No inventar rollback “seguro” que vuelva silenciosamente al riesgo confirmado.
4. Nunca ejecutar dos DB sobre el mismo volumen; no rm -v, prune, reset, restauración automática ni firewall global.
