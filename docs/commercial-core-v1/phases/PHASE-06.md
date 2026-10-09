# PHASE-06 — Consolidación local

- ID: PHASE-06
- Objetivo: el circuito local queda operable de punta a punta, con correo al catcher, semillas ficticias y la evidencia de E2E-01..10, sin despliegue.
- Alcance: dispatcher, archivo y privacidad operativa, seed, regresión, documentación viva, corrida local.
- Depende de: PHASE-01 a PHASE-05 done.
- Prerrequisitos: Inbucket en el puerto 54324 del `config.toml`. Gate loopback vigente.
- Riesgos: SMTP hacia un host que no sea loopback; seed contra remoto; borrar filas económicas; dar por cerrada la V1 con un E2E en rojo.
- No incluye: producción, ARCA, banco, cerrar los BLK económicos.

## P06-T01 Dispatcher y correo local

- Descripción: drenar el outbox hacia bandeja y, si el sink está encendido, hacia Inbucket.
- Archivos: `scripts/commercial-core/dispatch-outbox.mjs`, `lib/commercial/notifications/dispatch.ts`, `lib/commercial/notifications/email-sink.ts`.
- Depende de: P05-T08, P01-T04.
- Cambios: `FOR UPDATE SKIP LOCKED`, backoff, máximo 8 intentos, luego `dead`. Unique de delivery evita doble bandeja. El correo solo se abre si `COMMERCIAL_EMAIL_SINK=inbucket` y el host resuelto es `127.0.0.1` puerto 54324. Cualquier otro host: el script sale con error y no envía. Plantillas mínimas de los eventos CC-34. Preferencia: eventos de pago, disputa y seguridad ignoran el opt-out; el resto puede respetar un flag en `platform_accounts` o tabla chica `notification_preferences` agregada en esta migración si no existe.
- Restricciones: fallo de envío no actualiza oportunidades ni pagos. No usar Resend. No leer la lista de clientes reales.
- Tests: transacción de negocio commitida con outbox; matar el sink; el estado comercial permanece; segundo dispatch no duplica la fila de bandeja. Un env con host `smtp.gmail.com` hace fallar el proceso antes de conectar (test del parser).
- Aceptación: CC-34. INV-17.
- Evidencia: exit code y, si Inbucket está up, el mensaje visto en el puerto local. Si Inbucket está down, la bandeja interna igual debe pasar y el correo queda `failed` reintentable.
- Recuperación: dejar el outbox en `pending`. No reenviar a mano fuera del script.

## P06-T02 Archivo y privacidad

- Descripción: archivo lógico y trámite de solicitud, sin borrado económico.
- Archivos: RPC `archive_opportunity`, `open_privacy_request`, `resolve_privacy_request`, migración menor si falta un flag.
- Depende de: P02-T05, P05-T05.
- Cambios: archivar esconde de las listas operativas, no de auditoría. `resolve` de tipo `deletion` anonimiza nombre, email y teléfono del contacto indicado y escribe audit. No hay `DELETE` grant sobre comisiones, liquidaciones, pagos, terms ni audit. Contratos y facturas se conservan. La UI de superadmin lista solicitudes. Texto de la pantalla: los plazos legales no están definidos (`BLK-PRIV-01`).
- Restricciones: no job de purga por antigüedad. No anonimizar CBU de un pago ya snapshot si eso impide auditar; el CBU vigente sí puede deshabilitarse.
- Tests: `delete from commercial.promoter_commissions` como authenticated falla. Anonimizar un contacto deja la comisión con su `promoter_id`. Oportunidad archivada no sale en el listado default y sí en auditoría.
- Aceptación: CC-38 en el alcance local honesto.
- Evidencia: SQL.
- Recuperación: no hay undelete de PII si el test anonimizó un fixture; el fixture se recrea.

## P06-T03 Semilla ficticia

- Descripción: escenario recorrible para desarrollo.
- Archivos: `supabase/seed/commercial_core_fixture.sql` invocado a mano, no como `seed.sql` global si eso pisara otros flujos. Documentar el comando en este archivo cuando se escriba.
- Depende de: P06-T01 en código, fases 02–05 aplicadas.
- Cambios: comercios inventados (orgánico, referido, conflicto de dos promotores, ganado, onboarding, setup, doce meses solo si el SQL de E2E-04 ya es el lugar de eso — el seed puede ser el subconjunto chico: 1 orgánico, 1 referido, 2 promotores, 1 ganado sin cobrar). Contraseñas de auth local solo si el mecanismo de seed del CLI ya usado en el repo lo permite sin commitear secretos. Si crear usuarios auth desde SQL es frágil, el seed SQL no crea `auth.users` y un script `scripts/commercial-core/seed-local-users.mjs` los crea vía Admin API contra loopback, con claves fijas de desarrollo escritas en el script como literales de fixture (`promoter.one` / valor de dev) y el script se niega a correr si el URL no es loopback.
- Restricciones: no leer producción. No usar teléfonos reales. No correr este script en CI contra remoto. No reemplazar `scripts/bootstrap-m2-local.mjs`.
- Tests: correr dos veces el seed no duplica por idempotency keys fijas.
- Aceptación: un desarrollador puede entrar al panel local y ver el caso sin cargarlo a mano desde cero.
- Evidencia: segunda corrida exit 0 y conteos estables.
- Recuperación: el script no hace truncate global. Tiene `fixture_tag` y borra solo filas con ese tag, en orden de FK, y solo si el gate pasa.

## P06-T04 Corrida E2E y regresión

- Descripción: ejecutar la matriz.
- Archivos: `supabase/tests/commercial/e2e_01.sql` … `e2e_10.sql` si no se fueron creando en las fases; `scripts/commercial-core/verify-all.mjs` actualizado.
- Depende de: P06-T02 y fases anteriores.
- Cambios: ningún comportamiento nuevo salvo bugs que los E2E destapen. Esos bugs se corrigen en el módulo dueño, no se relaja el assert.
- Restricciones: no saltar E2E-08. No marcar passed si el exit code no es 0.
- Tests: G-01..G-17, E2E-01..10, verify de `hasAdminPermission`, guard de catálogo del owner.
- Aceptación: todos los comandos en `PROGRESS.md` con fecha y exit 0. Huecos de browser declarados.
- Evidencia: log resumido en `PROGRESS.md`.
- Recuperación: la tarea vuelve a `in_progress`. No se abre un «V1 done» parcial.

## P06-T05 Memoria viva y contratos

- Descripción: dejar el mapa arquitectónico al día.
- Archivos: `ORDEROPS_LIVING_MEMORY.md` (entrada de registro con fecha, esquema `commercial`, rutas `/commercial`, `/promoter`, `/demo`, bucket privado, y la advertencia de que no es billing del local). `docs/CURRENT_PHASE.md` solo si ese archivo sigue siendo el índice operativo; si hoy es una bitácora de QA de productos, agregar un puntero de pocas líneas, no reescribir el historial.
- Depende de: P06-T04.
- Cambios: documentación. Si algún E2E obligó a desviarse del modelo, `DATA_MODEL.md` ya tiene que estar corregido antes de esta tarea.
- Restricciones: no borrar historial de la memoria viva.
- Tests: lectura de consistencia: cada tabla que el SQL crea está nombrada en `DATA_MODEL.md`. Un verify corto puede listar `create table commercial.` y fallar si falta el nombre en el markdown.
- Aceptación: un agente nuevo entiende dónde vive el dominio sin leer el chat.
- Evidencia: el verify de nombres.
- Recuperación: revertir solo el párrafo agregado si quedó mal.

## P06-T06 Puesta en marcha local

- Descripción: una página de corrida en `docs/commercial-core-v1/LOCAL_RUN.md` con comandos concretos ya verificados en esta fase.
- Archivos: `docs/commercial-core-v1/LOCAL_RUN.md`.
- Depende de: P06-T03, P01-T01.
- Cambios: orden real: Docker, `supabase start`, gate, migraciones ya aplicadas, `npm run dev`, usuarios fixture, dispatcher, Inbucket URL `http://127.0.0.1:54324`, qué no correr (`db push` remoto, reset). Incluir el comando exacto que funcionó, no uno supuesto.
- Restricciones: sin secretos. Sin afirmar que `.env.local` es local si el gate no lo comprobó en esa máquina; escribir el resultado del gate de esa corrida (host y puerto).
- Tests: seguir el documento en una terminal limpia de instrucciones y llegar al panel. Si un paso falla, corregir el documento o el script antes de cerrar.
- Aceptación: otra persona puede levantar la V1 local con ese archivo y `PROGRESS.md`.
- Evidencia: checklist marcada en `LOCAL_RUN.md` con la fecha.
- Recuperación: el documento es la única superficie. No hace falta rollback de base.

## Hecho de V1 local

P06-T01..T06 `done`, E2E en verde, `BLK-ECO-01` y `BLK-ECO-02` siguen abiertos y el motor sigue fail-closed, ningún remoto fue migrado.

Eso cumple la sección 38 de la spec en desarrollo local. No autoriza producción. La frase de la spec sobre «autorización explícita de despliegue» queda sin cumplir a propósito: este plan no despliega.

## Orden de tareas y aislación

P06-T01 no se marca done sin la prueba de rechazo de host no local. P06-T04 no se saltea. Si `BLK-ENV-01` reaparece, la sesión se detiene en la tarea en curso. No se adelanta P06-T05 ni ninguna tarea posterior. Rige [EXECUTION_RULES.md](../EXECUTION_RULES.md).
