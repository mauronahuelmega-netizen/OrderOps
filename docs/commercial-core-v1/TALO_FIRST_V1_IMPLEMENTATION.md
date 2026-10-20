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

## L2 — Cliente/CVU por negocio y bandeja de avisos

Migración `20261020110000_commercial_provider_webhook_inbox.sql`: tabla `commercial.provider_webhook_inbox` y wrappers `system_enqueue_provider_webhook`, `system_claim_provider_webhooks` (`FOR UPDATE SKIP LOCKED`), `system_defer_provider_webhook` y `system_provider_customer_link`, solo `service_role`.

- `lib/commercial/payments/talo-runtime.ts`: `COMMERCIAL_TALO_ENABLED` + `COMMERCIAL_TALO_ENVIRONMENT`. `production` devuelve `production_not_authorized`; solo el origen sandbox. `webhook_url` solo desde `COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL` HTTPS sin ruta.
- `talo-webhook-inbox.ts` + `app/api/commercial/talo/webhook/route.ts`: valida el aviso y lo encola. 200 encolado o duplicado; 202 cliente desconocido sin persistir; 400 malformado; 429 límite; 404 apagado; 503 base no disponible. Nunca reconoce dinero.
- `talo-provisioning.ts` + `talo-provisioning-store.ts`: `customer_id = orderops-<won_business_id>`. Reusa el vínculo existente sin red; si se perdió, recupera el cliente existente sin crear otro; rechaza duplicados en Talo; no crea clientes sin `webhook_url` estable (Talo solo la documenta en el alta).
- `talo-customer-webhook.ts`: expone `readTaloWebhookNotice` (sin cliente fijo) y `transferFromRead`. El flujo sandbox previo no cambia.

Pruebas: `phase10_webhook_inbox.sql` PASS en QA; `talo-webhook-inbox.verify.ts` y `talo-provisioning.verify.ts` PASS con fetch y RPC falsos; `verify-all` 29/29; `tsc --noEmit` sin errores.

NOT_VERIFIED: alta real en sandbox de un cliente por negocio (sin URL HTTPS estable no se crea); ruta HTTP montada en Next contra QA; formato de alias aceptado por Talo; `X-Talo-Signature`.
