# PHASE-01 — Fundaciones y seguridad

- ID: PHASE-01
- Objetivo: dejar el esquema de plataforma cerrado, el programa Founder semilla y la autorización interna probados, sin CRM todavía.
- Alcance: gate local, cuentas, roles, auditoría, outbox, notificaciones vacías, privacidad, programas, RLS deny-by-default, tests de permiso.
- Depende de: paquete `docs/commercial-core-v1/` y pedido explícito de implementar.
- Prerrequisitos: Docker con Supabase local para aplicar SQL. Escribir los archivos SQL no exige el daemon; aplicarlos sí.
- Riesgos: apuntar a un proyecto remoto; relajar `profiles.role`; abrir `grant all` a `authenticated`.
- No incluye: formulario, promotores, comisiones, UI de negocio.

Contratos de esta fase: [DATA_MODEL.md](../DATA_MODEL.md) secciones 2 y 8, [SECURITY_MATRIX.md](../SECURITY_MATRIX.md) secciones 1, 2 y 4, ENG-01..03, ENG-05, ENG-10, ENG-11, ENG-13, ENG-20 en semilla de programa.

Errores: las RPC devuelven `commercial_error_code` (`forbidden`, `unauthenticated`, `last_superadmin`, `sod_violation`). No filtran SQL crudo al cliente.

## P01-T01 Gate de destino local

- Descripción: script de solo lectura que falla si el stack no es el Supabase local de este repo.
- Archivos: `scripts/commercial-core/assert-local-supabase.mjs`.
- Depende de: nada.
- Cambios: el script corre `npx supabase status -o json` (o el flag que esa CLI soporte) y exige API host loopback, puerto 54321, DB puerto 54322. Si `.env.local` existe, puede comprobar que `NEXT_PUBLIC_SUPABASE_URL` parsea a ese mismo host y puerto, sin imprimir la clave. Si el archivo no existe, el script lo dice y no falla por ausencia, pero sí falla si `status` no es local.
- Restricciones: no imprimir claves. No `db reset`. No migrar. No hacer `curl` con la service role.
- Tests: el script sale 0 contra un status local real; un test unitario del parser (string JSON fixture) sale distinto de 0 si el host es `db.xxx.supabase.co`.
- Aceptación: documentado el comando en `PROGRESS.md`. Host remoto no pasa.
- Evidencia: exit code y host/puerto, sin secretos.
- Recuperación: borrar el script. No hay estado de base.
- Bloqueo: si Docker no está, la tarea queda `blocked` con `BLK-ENV-01`. Se puede dejar el script y el parser testeados con fixture, y no se aplica P01-T02.

## P01-T02 Migración de fundaciones

- Descripción: crear esquema, tablas de plataforma, semilla Founder, RLS cerrada, RPC mínimas de rol.
- Archivos: `supabase/migrations/<timestamp>_commercial_phase01_foundations.sql`, `supabase/rollbacks/commercial_phase01_down.sql`, `supabase/tests/commercial/phase01_rls.sql`.
- Depende de: P01-T01 en verde contra el destino donde se aplica. Si el gate está blocked, el SQL se puede commitear solo si el usuario pidió implementar, y `db` queda sin aplicar.
- Cambios: objetos de [DATA_MODEL.md](../DATA_MODEL.md) sección 2. Semilla `founder` v1 con 29000000, 5500000, 12000000, 4000, 12. Trigger que impide UPDATE de esas columnas. Trigger que impide promotor si `profiles.business_id` no es null. RPC `grant_internal_role` y `revoke_internal_role` con `role.grant` y protección del último superadmin. Insert de `audit_events` dentro de esas RPC.
- Restricciones: no alterar tablas `public` salvo grants de ejecución. No datos de personas reales. `anon` sin DML directo.
- Tests: `phase01_rls.sql` como usuario authenticated sin cuenta ve 0 filas; semilla única; segundo update del precio del programa falla; no se puede borrar el último superadmin.
- Aceptación: migración registrada en local; tipos regenerados desde local en `types/database.ts` si el flujo del repo versiona ese archivo; rollback escrito y no ejecutado.
- Evidencia: nombre de migración, comando de apply, resultado del SQL test.
- Recuperación: si no hay fases posteriores, correr el down en local y sacar la fila de `schema_migrations` solo siguiendo la práctica ya usada en `scripts/migration-m3/`. Si eso no está claro, dejar la base y no improvisar un delete.

## P01-T03 Autorización de aplicación

- Descripción: resolver principal y permisos en TypeScript, alineado a la matriz.
- Archivos: `lib/commercial/auth/principal.ts`, `lib/commercial/auth/permissions.ts`, `lib/commercial/auth/authorization.verify.ts`, `scripts/commercial-core/verify-all.mjs`. `tsx` en devDependencies si el runner lo necesita.
- Depende de: P01-T02 aplicado, o de tipos escritos a mano marcados temporales hasta regenerar. Preferible tipos generados.
- Cambios: `hasCommercialPermission(roles, code)` con la tabla de la matriz, incluida la ausencia de `collection.write` en superadmin por defecto. SoD helpers puros. Verify que un set `{finance, superadmin}` igual exige actores distintos para aprobar. Verify de que `hasAdminPermission` del archivo existente no cambió sus seis claves.
- Restricciones: no editar `lib/admin/permissions.ts`. No llamar service role desde este módulo.
- Tests: `npx tsx lib/commercial/auth/authorization.verify.ts`.
- Aceptación: soporte no aprueba; finance no gana oportunidades; dos roles se acumulan; SoD no se apaga porque alguien tenga superadmin en el mismo objeto de roles sin el flag de excepción.
- Evidencia: exit 0.
- Recuperación: revertir el directorio `lib/commercial/auth`.

## P01-T04 Contrato de outbox sin envío

- Descripción: helper que inserta `outbox_events` en la misma transacción que el llamador le pase, y test de que un throw posterior no deja el evento.
- Archivos: `lib/commercial/notifications/outbox.ts`, `supabase/tests/commercial/phase01_outbox.sql`.
- Depende de: P01-T02.
- Cambios: función SQL `commercial.enqueue(event_name, payload, correlation_id)` usada por las RPC. El test abre una transacción, encola, fuerza error, rollback, cuenta 0. Otro test commit y cuenta 1. No hay dispatcher SMTP.
- Restricciones: no agregar worker infinito. No escribir a Inbucket en esta fase.
- Tests: el SQL anterior.
- Aceptación: el evento no sobrevive a un rollback (INV-17 al revés: el negocio y el evento caen juntos; el envío queda fuera).
- Evidencia: salida SQL.
- Recuperación: drop de la función en el down de fase 01 si todavía no hay fase 02. Si fase 02 ya existe, migración adelante que corrija la función.

## Hecho de fase

P01-T01..T04 `done`, RLS probada, programa inmutable, `implementation` de producto de pedidos no tocada. `next_task` pasa a P02-T01.
