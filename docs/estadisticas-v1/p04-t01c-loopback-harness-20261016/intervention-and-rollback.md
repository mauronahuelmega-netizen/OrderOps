# Procedimiento propuesto, todavía no autorizado

## Preparación reproducible ejecutada

Desde el worktree propio:

```powershell
node docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/adversarial.verify.mjs
node docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/harness.mjs --dry-run
node docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/replay-audit.mjs
node docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/prepare-request-plan.mjs
node docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/xattrs-readonly.mjs
```

Requieren lectura Docker y, para abrir el bundle privado, DPAPI del usuario Windows correcto fuera del sandbox restringido. No aceptan credenciales de producción ni JWT. Un dry-run nuevo crea otro bundle/runId: no sobrescribir los anteriores para simular continuidad. No son comandos de instalación.

## Gates para autorizar una ventana

1. Revisar hashes exactos de harness, policy, payloads y bundle; mantener originales/evidencias históricas inmutables. Autorizar explícitamente reemplazar los dos IDs activos y separar los endpoints originales de la red para evitar aliases duplicados. La aceptación técnica anterior no cumple esta autorización.
2. Acordar ventana de interrupción DB/API, operador y ausencia de otro actor de lifecycle/escritura; confirmar respaldo independiente recuperable y capacidad DPAPI. No montar un segundo DB para comprobarlo.
3. Completar/revisar el adaptador de ejecución y recaptura detenida. Este paquete entrega payloads completos y una secuencia declarativa exacta, **no un ejecutor de mutación habilitado**. La API local debe ser named pipe; no habilitar Docker TCP. Validar previamente su soporte de archive ownership y restauración de directorios. No usar comandos de copia de carpetas que incluyan el volumen DB.
4. Confirmar metadatos extendidos visibles y que no existe dato necesario omitido. Si cambian capas/atributos, no adaptar una whitelist durante la caída: detener para revisión.
5. Autorizar por separado las observaciones de red posteriores y SELECT READ ONLY de integridad lógica. Sin ese permiso no podrá declararse cierre de aislamiento/datos. No añadir Auth, QA install o ensayo Productos por inferencia.

## Intervención exacta propuesta

El archivo request-plan.proposed.json contiene métodos, paths y cuerpos/referencias. RUN_ID identifica la captura aprobada y evita colisiones. Cada paso depende del éxito del anterior y registra su resultado; no hay retries de mutación automáticos.

1. Revalidar estado/hash/IDs contra captura aprobada. Reservar nombres `NOMBRE.pre-loopback-RUN_ID` y `NOMBRE.loopback-failed-RUN_ID`; colisión bloquea.
2. POST `/containers/OLD_KONG/stop?t=60`, después OLD_DB. Confirmar Exited. No force kill si falla el cierre limpio. Equivalentes CLI: `docker stop --time 60 ID_KONG` y `docker stop --time 60 ID_DB`, con los IDs exactos del checkpoint, nunca por prefijos.
3. Recaptura **detenida** y sellado independiente, incluyendo archivos, permisos y directorios. Sin exec sobre detenidos, sin SQL ni volumen tar. Registrar hashes antes/después de cada lectura; el bundle live queda intacto. Diferencias no explicadas detienen.
4. POST rename de cada original hacia su nombre retenido; POST disconnect de esos dos endpoints con Force=false, en la misma red original. No eliminar ni recrear red. Conservar aliases originales para reversión.
5. POST create usando payload privado exacto aprobado y nombre original. Configuración idéntica salvo HostIp y referencia a la misma imagen por digest. Registrar newId de respuesta y comprobarlo mediante inspect; no confiar en nombres solamente. No pull, migration, reset o CLI start.
6. Restaurar metadata de directorios y archives leaf en reemplazos **detenidos**, verificar su integridad antes del arranque. No restaurar PID/sockets/logs ni escribir sobre PGDATA.
7. Arrancar únicamente newDB; salud acotada y stopped oldDB comprobados. Si falla, no arrancar newKong ni reparar automáticamente. Arrancar newKong y comprobar salud. Auth/REST/Storage mantienen sus tres IDs/configuración, aunque pueden registrar errores durante la ventana DB.
8. Verificar flota activa completa, dos retenidos Exited/detach, red/volúmenes originales, binds y listeners exactos, archivos críticos y hashes esperados tras replay. Comparar metadata original completa y hosts, con las únicas excepciones declaradas. No confundir cambios runtime de IP/endpoint/MAC con preservación de identidad: deben registrarse como nuevos.

## Checkpoint y journal

Mantener manifest.json y todas las evidencias anteriores sin editar. Crear un checkpoint de transición nuevo con proyecto, RUN_ID, autorización humana, hashes de código/bundle/payload, old IDs, new IDs reales, red y volúmenes, otros tres IDs, objetos retenidos y pruebas pendientes/completadas.

Journal append-only por evento: secuencia, UTC, previousEventHash, requestHash, resultado, old/new ID y hash de inspect sanitizado. Es evidencia de orden/integridad, no una firma del propietario ni autorización por sí mismo. Preservar el journal si una llamada queda con resultado incierto; consultar estado antes de cualquier reintento manual. Un timeout de create no autoriza volver a crear o borrar una colisión.

checkpoint.proposed.json conserva newId=null y PROPOSED_NOT_APPLIED. El validador puro de transición exige cinco IDs activos únicos, dos sustituciones reales, otros tres IDs/config inalterados, imágenes/config exactas, red/volúmenes originales y dos originales detenidos y desconectados. El resultado todavía necesita archivo/restauración, pruebas LAN y validación lógica: no basta para emitir PASS global.

## Red y consistencia posteriores

No se ejecutaron estas pruebas. Primero, Docker y Windows no deben mostrar binds/listeners 0.0.0.0, :: o IP LAN en 56321/56322. Cualquier forwarding auxiliar Desktop/WSL debe atribuirse y verificarse; no se ignora un wildcard residual.

Desde host, sin Auth/SQL:

```powershell
curl.exe --noproxy '*' --connect-timeout 3 --max-time 5 -i http://127.0.0.1:56321/
Test-NetConnection -ComputerName 127.0.0.1 -Port 56321
Test-NetConnection -ComputerName 127.0.0.1 -Port 56322
```

TCP loopback debe funcionar en ambos puertos. Un 404/error de ruta de Kong basta para transporte, no prueba autorización o datos. Sin publicación IPv6 adicional, comprobar `::1` y no asumir que debe responder: registrar resultado y listeners. El objetivo solicitado publica únicamente 127.0.0.1.

Desde otra computadora LAN, usando IP actual del host, sin proxy/VPN:

```powershell
Test-NetConnection -ComputerName 192.168.0.108 -Port 56321
Test-NetConnection -ComputerName 192.168.0.108 -Port 56322
```

Ambos deben fallar mientras loopback funciona. Repetir una comprobación acotada con fecha/dispositivo/IP registrados para descartar IP equivocada o aislamiento Wi-Fi. Desde teléfono abrir la API del host; cualquier respuesta HTTP, incluso 401/403/404, implica fallo de aislamiento. El navegador no prueba TCP PostgreSQL: usar una herramienta TCP o computadora para 56322. Si hay dirección IPv6 LAN enrutable, probar ambos puertos allí también; IPv4 negativo no certifica IPv6. Sin capacidad de probar una familia disponible, registrar pendiente y mantener BLOCKED.

La identidad privada, ledger 124, funciones/grants/RLS y huellas de datos se comparan mediante autorización posterior de SELECT READ ONLY + ROLLBACK, contra referencias inmutables. No crear checkpoints nuevos que sustituyan diferencias por baseline actualizado. El mismo volumen montado no prueba por sí solo preservación lógica. No pruebas Auth, RPC nuevas o sesiones.

## Reversión exacta y segura

Por defecto ante cualquier falla:

1. Detener newKong, luego newDB por sus IDs verificados. Si alguno no se creó, no adivinar IDs ni afectar contenedores con nombres parecidos. No start de oldDB mientras newDB esté running o su estado sea incierto.
2. Conservar los siete contenedores y sus capas, bundles, red y volúmenes. Sin rm/prune/reset/restore de base.
3. Mantener servicios afectados detenidos y P04-T01C BLOCKED. Esto es cierre seguro con indisponibilidad, no recuperación de servicio completada.

Solo si se autoriza devolver nombres: renombrar nuevos detenidos a `.loopback-failed-RUN_ID`, comprobar originales retenidos por oldId, devolverles sus nombres originales. Para reconectarlos, usar exactamente la red/aliases previos del checkpoint, sin recrear red ni modificar peers. Mantenerlos detenidos hasta decisión expresa.

**No arrancar originales como rollback automático:** conservan wildcard y reabrirían LAN. Recuperar servicio con ellos requiere una decisión específica sobre esa exposición o contención de red aprobada aparte. No hay cambio SQL que revertir; no restaurar el dump automáticamente ni cambiar datos para hacer coincidir una huella. No eliminar retenidos sin otra autorización.

## Evitar recurrencia por Supabase CLI

No modificar binario global, daemon.json, red o proyectos ajenos. El TOML actual no corrige HostIp y una nueva creación CLI 2.72.7 volvería al defecto.

Para este proyecto, registrar un launcher/checker propio que exija checkpoint de identidad y binds loopback antes/después de cualquier lifecycle futuro. Preferir inicio/reinicio de los IDs aprobados ya existentes, cuya HostConfig conserva el bind, únicamente bajo autorización futura. Cualquier rebuild debe usar el payload loopback revisado o una herramienta/versionado específico auditado; no invocar el launcher histórico que crea defaults.

El checker debe rechazar HostIp vacío/0.0.0.0/::/LAN, puertos adicionales, imágenes distintas, pérdida de claves o recursos desconocidos, y producir BLOCKED sin reparar ni parar automáticamente recursos. Un wrapper del proyecto no impide que una persona ejecute directamente el CLI global: esa limitación exige disciplina de operación y revisión de evidencias; no se promete enforcement global sin cambios adicionales. No instalar alias global ni automatización de lifecycle en esta preparación.
