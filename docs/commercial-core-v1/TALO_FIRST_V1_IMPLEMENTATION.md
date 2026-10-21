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

NOT_VERIFIED (L2): alta real en sandbox de un cliente por negocio (sin URL HTTPS estable no se crea); ruta HTTP montada en Next contra QA; formato de alias aceptado por Talo; `X-Talo-Signature`.

## L3 — Lectura autenticada, evidencia e imputación de la activación

Migración `20261020120000_commercial_provider_read_imputation.sql`.

- `commercial.provider_read_evidence`: evidencia `provider_read` (API verificada, firma no verificada), con digest SHA-256 de la respuesta.
- `public.system_record_provider_read` (solo `service_role`), atómica: exige fila `processing`; estado distinto de `PROCESSED`, sin fecha, moneda distinta de ARS o importes incompletos vuelven a reintento sin crear recibo. Si no: actor system, `confirm_provider_receipt` con `observed_at` = fecha del proveedor, evidencia, imputación y bandeja `processed`.
- `commercial.impute_provider_read_receipt`: un solo `conversion_terms` por negocio (si no, `terms_missing`/`terms_ambiguous`). Activación sin cobrar y bruto = ARS 290.000: abre la obligación setup si falta, `record_collection` nominal con clave `provider-receipt:<id>` y devenga la comisión de alta ARS 120.000 en `pending` (regla propia de disponibilidad). No asigna slot ni crea derecho recurrente. Importe distinto: `amount_mismatch`. Con la activación ya cobrada: `subscription_not_automated` hasta L5.
- No modifica `impute_provider_receipt` (flujo de atestación manual).
- Worker: `lib/commercial/payments/talo-receipt-worker.ts` y `POST /api/commercial/talo/worker` con `Authorization: Bearer COMMERCIAL_WORKER_SECRET` (≥32 caracteres; si falta, 404). La fecha del proveedor debe traer zona explícita.

Pruebas: `phase10_provider_read.sql` PASS (reintentos sin recibo, imputación atómica, `recorded_by` system, auditoría `actor_kind = system`, sin slot, repetición sin doble cobro, conciliación por términos ambiguos o ausentes e importe, grants). Control negativo del arnés: un `raise` devuelve FAIL. Regresión PASS: `phase08_provider_receipts`, `phase08_impute_provider_receipt`, `phase10_system_actor`, `phase10_webhook_inbox`, `phase05_collections`, `phase05_slots`, `e2e_08`. `talo-receipt-worker.verify.ts` PASS; `tsc` sin errores.

NOT_VERIFIED (L3): lectura real contra la API sandbox desde el worker; programación periódica del worker (requiere despliegue, no autorizado).

## L4 — Calendario y acceso por negocio

Migración `20261020130000_commercial_service_access.sql`.

- `ba_date`/`ba_start`: día y medianoche de America/Argentina/Buenos_Aires.
- `founder_period_index(inicio, día)`: mayor n con `founder_period_on(inicio, n) <= día` (aniversario fijo desde el inicio, con día ajustado a fin de mes).
- `founder_period_covered`: cobranza `posted` y `nominal`; período 0 = activación. Revertidas o `blocked_pending_policy` no cubren.
- `business_service_access(negocio, instante)` (sin grants), con estos estados:
  - `exempt` y `no_terms` (bloquea);
  - `review_required` (más de un término; bloquea);
  - `pending_activation` (bloquea);
  - `active`, incluido el caso "inicio pendiente";
  - `grace`: período anterior cubierto y antes de inicio+7 días 00:00 BA;
  - `suspended` (bloquea).

  Devuelve período actual, próximo aniversario, apertura de renovación (T−10) y fin de gracia. Los meses impagos vencen sin deuda.
- `service_access_exemptions`: excepciones legacy expresas.

Pruebas: `phase10_service_access.sql` PASS, con estos casos:
- 31/1→28/2, 30/3 y 31/3; bisiesto 29/2; cambio de año; 30/8→28/2;
- medianoche BA = 03:00Z; gracia hasta 23 00:00 BA;
- reactivación por pago, dos impagos sin gracia;
- cobranza no nominal y cobranza revertida sin cobertura e historia conservada;
- términos dobles, sin términos, excepción y revocación; grants.

Pendiente detectado: una cobranza revertida deja la obligación `satisfied`. Para volver a cobrar ese período hace falta reabrirla. Se resuelve en L7, por Finanzas y sin borrar historia.

## L5/L6 — Mensualidad automática y momento del devengo

Migración `20261020140000_commercial_subscription_imputation.sql`. Reemplaza `commercial.impute_provider_read_receipt` (sin cambiar la rama de activación) y no toca `renewal_intents` ni puente.

- Destinos en el instante t (`subscription_destinations`):
  - el período actual n ≥ 1 si no está cubierto;
  - el siguiente, si t ≥ inicio − 10 días y no está cubierto.
- Se calculan a la fecha del proveedor y a la verificación. Con un solo destino, igual en ambos momentos, se imputa. Si no, la cobranza va a conciliación con uno de estos motivos: `eligibility_changed`, `no_eligible_period`, `ambiguous_period`, `amount_mismatch`, `service_start_required`, `period_not_open` o `activation_not_covered`.
- `impute_subscription_period` (compartida con la imputación manual de L7):
  - abre el período con `open_obligation` y registra la cobranza nominal;
  - si el período ya empezó, asigna slot, crea el derecho y lo deja disponible en `posted_at` + 15 días;
  - si no empezó, crea `deferred_accruals` con vencimiento en el inicio del período.
- `system_process_due_accruals`: devenga a la fecha, con disponibilidad = máx(inicio, `posted_at`) + 15 días. Cancela si la cobranza fue revertida antes. El worker `/api/commercial/talo/worker` la invoca después de las lecturas.

Pruebas: `phase10_subscription_imputation.sql` PASS, con estos casos:
- pago en gracia, imputado y devengado al instante, con reactivación;
- pago en T−10, con devengo diferido, sin slot ni derecho anticipado y período prepago cubierto;
- reversión antes del devengo, que lo cancela; worker idempotente;
- DT-04 con fecha previa a la ventana;
- dos destinos, ninguno, sin inicio, importe distinto y doble pago del mismo período;
- 13 meses dan 12 derechos y 12 slots, con el mes 13 cubierto; el período incluido no consume slot;
- grants.

Regresión PASS: `phase10_*` (L3 ajustado: la segunda transferencia de ARS 290.000 queda en `amount_mismatch`), `phase05_p0_cap`, `p0_voided`, `slots`, `availability`, `reversals`, `commissions`, `founder_schedule`, `founder_month_length`, `rev01` y `phase08_impute_provider_receipt`.

## L7 — Conciliación manual de Finanzas

Migración `20261020150000_commercial_finance_reconciliation.sql`. Todas exigen `collection.write` (finance o superadmin); no se agregaron permisos.

- `finance_impute_receipt(recibo, términos, período | null, nota)` toma recibos `reconciliation_required` con evidencia `provider_read`:
  - con `null` imputa la activación;
  - con fecha imputa ese período, que debe ser actual o siguiente, alineado al aniversario y sin cubrir. Los vencidos no se cobran;
  - usa la misma ruta que L5/L6 (slot, devengo inmediato o diferido) y, si algo falla, no deja efectos.
- `finance_close_receipt(recibo, 'refunded' | 'dismissed', nota, referencia)`:
  - registra una devolución hecha fuera, con referencia obligatoria, o un descarte;
  - sobre un recibo imputado, `reverse_collection` anula derecho y slot impagos, o genera ajuste negativo si ya estaba pagado. No hay neteo automático.
- `finance_reopen_obligation`: reabre un período cuya única cobranza fue revertida, para que pueda cobrarse de nuevo. La cobranza revertida queda.
- `finance_retry_webhook`: vuelve a encolar un aviso `dead`.

Prueba `phase10_finance_reconciliation.sql`: PASS, con estos casos:
- promotor, soporte y anónimo rechazados;
- período incluido, desalineado o de otro negocio rechazados sin efectos;
- imputación manual del período actual, que restaura el acceso; doble resolución rechazada;
- importe distinto no imputable, devolución sin referencia rechazada, con referencia aceptada; doble cierre rechazado;
- descarte;
- devolución de un recibo imputado: cobranza `reversed`, derecho `voided`, slot anulado, dos filas de historia, acceso perdido;
- reapertura y nuevo cobro del mismo período, con dos cobranzas en la obligación;
- reintento de un aviso muerto;
- grants.
