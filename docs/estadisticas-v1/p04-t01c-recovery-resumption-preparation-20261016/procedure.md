# Procedimiento propuesto — solo lectura, pendiente de autorización

## Preparación sin ejecutar comandos live

1. Revisar los nuevos artefactos y hashes de APPROVAL_HASHES.md. El manifest original debe seguir siendo `790960c137c57c70d725cde4a7113165b15c6369662b2e2a52387623093dfd3f`.
2. Obtener autorización humana nueva para una única invocación del helper de solo lectura. No reutilizar la autorización de restauración detenida ni tomar PASS offline como permiso.
3. Confirmar el worktree/HEAD esperados y la ventana. Si falta acceso CIM/Docker, solicitar el acceso necesario dentro de ese permiso; no convertir el error de acceso en medición cero. No ejecutar comandos de mantenimiento.
4. Antes de invocar, verificar por SHA-256 el helper, su módulo de política y manifest adicional; no regenerar ninguno para obtener coincidencia. El helper vuelve a verificar los 13 archivos originales y el dump, pero no sustituye la comprobación externa de sus propios hashes.

## Única invocación futura propuesta (NO ejecutada)

Desde el worktree aprobado:

```powershell
node docs/estadisticas-v1/p04-t01c-recovery-resumption-preparation-20261016/preflight-readonly.proposed.mjs --execute-readonly
```

La secuencia fija es: registro exclusivo del intento → hashes originales → rama/HEAD → una captura de capacidad → image inspect JSON completo → consulta por nombre exacto → consulta por etiqueta. Se detiene al primer error; no ejecuta Docker mutante ni procesos SQL y no tiene un paso de recuperación.

La lectura futura equivalente de imagen es:

```powershell
docker --host npipe:////./pipe/docker_engine image inspect sha256:4255b662ba3d774105cb34f623e410a3d7a860b68408ac6810f7e7e4b9781d5a
```

Usarla a través del helper para no imprimir configuración/env potencialmente privados. No añadir `--format`, pull, inspecciones ajenas ni reemplazos de campos ausentes.

## Resultado y detención

- `READONLY_CHECKS_PASS_ONLY`: todos los controles declarados verificados; **no** habilita restore ni desbloquea P04-T01C.
- `BLOCKED`: incluye requisito insuficiente, campo obligatorio ausente, colisión, timeout/error, stdout no válido, acceso denegado, registro de intento previo o hash distinto. No borrar el registro para reintentar.
- Campos de presión sostenida, OOM y capacidad interna no medidos se mantienen como pendientes del plan, no como cero ni como PASS implícito.

Preservar `future-readonly-attempt.json` y sus hashes; cualquier continuación requiere revisión humana. No iniciar el laboratorio ni cambiar los límites aun si se obtiene PASS. No detener servicios para liberar los 4 GiB. Los artefactos live no existen en esta entrega; las únicas salidas medidas ahora son pruebas offline.
