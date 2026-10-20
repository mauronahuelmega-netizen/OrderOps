# Talo First V1 — Registro de implementación

Worktree `cursor/commercial-talo-first-v1` sobre `8717e62`. QA canónico: `supabase_db_orderops-phase06-qa:56722`. Respaldo previo: bundle verificado `OrderOps-backups/commercial-core-v1-integration-8717e62.bundle` (SHA-256 `10531F76…F653`) y rama local `backup/commercial-core-v1-integration-8717e62`.

Herramienta: `node scripts/commercial-core/qa-psql.mjs [--migration] <file.sql>`; verifica el puerto 56722 antes de ejecutar y, con `--migration`, aplica archivo y fila de ledger en una transacción.

Línea base de regresión en QA: 3 pruebas antiguas fallan por aserciones de conteo global contra datos persistentes de QA (`phase01_rls`: superadmin fixture `…96b4`; `phase02_board` y `phase03_claims`: oportunidades fixture). No dependen de Talo First.

## L1 — Actor system

Migración `20261020100000_commercial_system_actor.sql`.

- Usuario `auth.users` `c0000000-…0001` sin contraseña y `banned_until = infinity`; cuenta `platform_accounts` `c0000000-…0011` con `kind = 'system'` (única por índice parcial).
- `has_permission`: la cuenta system solo obtiene `collection.write`. Roles humanos sin cambios.
- Trigger `audit_events_stamp_system_actor`: filas con la cuenta system quedan `actor_kind = 'system'`.
- `commercial.system_enter/system_exit`: cambian la identidad transaccional; sin grants.
- Wrappers `public.system_*`: `SECURITY DEFINER`, `search_path` fijo, `execute` solo para `service_role`. Primero: `system_link_provider_customer`.
- Prueba `phase10_system_actor.sql`: PASS (cuenta única, sin login, superficie de permisos, anon/authenticated denegados, identidad restaurada, idempotencia, sello de auditoría).
