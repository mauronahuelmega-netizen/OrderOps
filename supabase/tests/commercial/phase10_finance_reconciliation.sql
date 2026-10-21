-- Talo First L7. Rolls back. Finance manual imputation, recorded refunds, dismissal, reopen and retry.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '50505050-5050-4050-8050-505050505001', 'authenticated', 'authenticated', 'p10fin-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50505050-5050-4050-8050-505050505002', 'authenticated', 'authenticated', 'p10fin-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50505050-5050-4050-8050-505050505003', 'authenticated', 'authenticated', 'p10fin-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50505050-5050-4050-8050-505050505004', 'authenticated', 'authenticated', 'p10fin-support@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('50505050-5050-4050-8050-505050505011', '50505050-5050-4050-8050-505050505001', 'internal'),
  ('50505050-5050-4050-8050-505050505012', '50505050-5050-4050-8050-505050505002', 'promoter'),
  ('50505050-5050-4050-8050-505050505013', '50505050-5050-4050-8050-505050505003', 'internal'),
  ('50505050-5050-4050-8050-505050505014', '50505050-5050-4050-8050-505050505004', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('50505050-5050-4050-8050-505050505011', 'superadmin'),
  ('50505050-5050-4050-8050-505050505013', 'finance'),
  ('50505050-5050-4050-8050-505050505014', 'support');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('50505050-5050-4050-8050-505050505021', '50505050-5050-4050-8050-505050505012', 'p10f000021', 'Promotor Conciliacion', 'active');

create function pg_temp.id(p_kind int, p_n int) returns uuid language sql immutable as $$
  select ('50505050-5050-4050-8050-' || lpad(p_kind::text, 10, '0') || lpad(p_n::text, 2, '0'))::uuid
$$;

create function pg_temp.read(p_customer text, p_tx text, p_gross bigint, p_observed timestamptz) returns jsonb
language plpgsql as $$
declare v jsonb; v_id uuid;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', p_customer, p_tx, false);
  v_id := (v->>'inbox_id')::uuid;
  update commercial.provider_webhook_inbox
  set status = 'processing', locked_at = now(), attempts = attempts + 1
  where id = v_id and status in ('pending', 'retry');
  return public.system_record_provider_read(v_id, 'PROCESSED', 'ARS', p_gross, p_gross - 100000, 'list', 'detail', p_observed, repeat('ef', 32));
end;
$$;

create function pg_temp.business(p_n int, p_started date) returns uuid
language plpgsql as $$
declare v jsonb; v_terms uuid;
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (pg_temp.id(1, p_n), 'Negocio Conciliacion ' || p_n, 'negocio-conciliacion-' || p_n, '54911005050' || lpad(p_n::text, 2, '0'));
  insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
  values (pg_temp.id(2, p_n), 'Lead Conciliacion ' || p_n, 'lead conciliacion ' || p_n, 'promoter');
  insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id)
  values (pg_temp.id(3, p_n), pg_temp.id(2, p_n), 'demo_done', '50505050-5050-4050-8050-505050505012');
  insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason)
  values (pg_temp.id(4, p_n), pg_temp.id(3, p_n), '50505050-5050-4050-8050-505050505021', 'confirmed', 'manual', 'fixture');
  perform set_config('request.jwt.claim.sub', '50505050-5050-4050-8050-505050505001', true);
  v := commercial.win_opportunity(pg_temp.id(3, p_n), pg_temp.id(1, p_n), null);
  v_terms := (v->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '', true);
  perform public.system_link_provider_customer(pg_temp.id(1, p_n), 'talo', 'sandbox', 'p10f-' || p_n, '00000000000000005050' || lpad(p_n::text, 2, '0'), 'p10f.' || p_n);
  v := pg_temp.read('p10f-' || p_n, 'setup-' || p_n, 29000000, now() - interval '70 days');
  if v->>'kind' is distinct from 'setup' then raise exception 'activation % %', p_n, v; end if;
  perform set_config('request.jwt.claim.sub', '50505050-5050-4050-8050-505050505003', true);
  v := public.record_founder_service_start(v_terms, p_started);
  perform set_config('request.jwt.claim.sub', '', true);
  return v_terms;
end;
$$;

create function pg_temp.as_user(p_sub text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_sub, true);
end;
$$;

do $$
declare
  v_today date := commercial.ba_date(now());
  v_started date := ((commercial.ba_date(now()) + 5) - interval '2 months')::date;
  v_terms uuid;
  v_other uuid;
  v jsonb;
  v_receipt uuid;
  v_mismatch uuid;
  v_far uuid;
  v_collection uuid;
  v_obligation uuid;
  v_current date;
  v_inbox uuid;
begin
  -- Current period unpaid and next window open: the automatic path refuses to choose.
  v_terms := pg_temp.business(1, v_started);
  v_other := pg_temp.business(2, v_today - 3);
  v_current := commercial.founder_period_on(v_started, 1);
  v := pg_temp.read('p10f-1', 'month-ambiguous', 5500000, now() - interval '1 hour');
  if v->>'review_reason' is distinct from 'ambiguous_period' then raise exception 'fixture ambiguous %', v; end if;
  v_receipt := (v->>'receipt_id')::uuid;

  -- Only finance/superadmin can resolve.
  perform pg_temp.as_user('50505050-5050-4050-8050-505050505002');
  if public.finance_impute_receipt(v_receipt, v_terms, v_current, 'promoter attempt')->>'commercial_error_code' <> 'forbidden' then raise exception 'promoter'; end if;
  perform pg_temp.as_user('50505050-5050-4050-8050-505050505004');
  if public.finance_impute_receipt(v_receipt, v_terms, v_current, 'support attempt')->>'commercial_error_code' <> 'forbidden' then raise exception 'support'; end if;
  perform pg_temp.as_user('');
  if public.finance_impute_receipt(v_receipt, v_terms, v_current, 'anonymous attempt')->>'commercial_error_code' <> 'forbidden' then raise exception 'anon'; end if;

  perform pg_temp.as_user('50505050-5050-4050-8050-505050505003');
  -- Expired, misaligned and foreign choices are rejected without effects.
  v := public.finance_impute_receipt(v_receipt, v_terms, v_started, 'included period is not billable');
  if v->>'commercial_error_code' <> 'period_not_eligible' then raise exception 'included %', v; end if;
  v := public.finance_impute_receipt(v_receipt, v_terms, v_current + 1, 'misaligned period day');
  if v->>'commercial_error_code' <> 'period_not_eligible' then raise exception 'misaligned %', v; end if;
  v := public.finance_impute_receipt(v_receipt, v_other, null, 'terms of another business');
  if v->>'commercial_error_code' <> 'terms_business_mismatch' then raise exception 'foreign terms %', v; end if;
  if (select status from commercial.provider_receipts where id = v_receipt) <> 'reconciliation_required' then
    raise exception 'rejected choice changed the receipt';
  end if;

  -- Finance chooses the current period: imputed, accrued now, access restored.
  v := public.finance_impute_receipt(v_receipt, v_terms, v_current, 'cliente indica que paga el periodo actual');
  if (v->>'ok')::boolean is not true or v->>'status' <> 'imputed' or v->>'accrual_mode' <> 'immediate' then raise exception 'manual impute %', v; end if;
  v_collection := (v->>'collection_id')::uuid;
  v_obligation := (v->>'obligation_id')::uuid;
  if commercial.business_service_access(pg_temp.id(1, 1), now())->>'state' <> 'active' then raise exception 'manual impute access'; end if;
  if not exists (select 1 from commercial.receipt_resolutions where receipt_id = v_receipt and kind = 'imputed_manually' and collection_id = v_collection) then
    raise exception 'resolution row';
  end if;
  v := public.finance_impute_receipt(v_receipt, v_terms, v_current, 'segundo intento sobre el mismo recibo');
  if v->>'commercial_error_code' <> 'receipt_not_reconcilable' then raise exception 'double manual %', v; end if;

  -- Wrong amount: cannot be imputed; refund recorded with an external reference.
  v := pg_temp.read('p10f-1', 'month-wrong', 6500000, now() - interval '1 hour');
  v_mismatch := (v->>'receipt_id')::uuid;
  perform pg_temp.as_user('50505050-5050-4050-8050-505050505003');
  v := public.finance_impute_receipt(v_mismatch, v_terms, v_current + 0, 'intento con importe distinto');
  if v->>'commercial_error_code' <> 'amount_mismatch' then raise exception 'amount %', v; end if;
  v := public.finance_close_receipt(v_mismatch, 'refunded', 'devolucion hecha en Talo', null);
  if v->>'commercial_error_code' <> 'validation' then raise exception 'refund without reference %', v; end if;
  v := public.finance_close_receipt(v_mismatch, 'refunded', 'devolucion hecha en Talo', 'TALO-REFUND-1');
  if v->>'resolution' <> 'refunded' then raise exception 'refund %', v; end if;
  v := public.finance_close_receipt(v_mismatch, 'dismissed', 'segundo cierre del mismo recibo', null);
  if v->>'commercial_error_code' <> 'receipt_already_closed' then raise exception 'double close %', v; end if;
  if exists (select 1 from commercial.platform_collections where external_ref like '%month-wrong') then raise exception 'refund created money'; end if;

  -- Dismissal of a receipt with nothing eligible.
  v := pg_temp.read('p10f-2', 'month-early', 5500000, now() - interval '1 hour');
  v_far := (v->>'receipt_id')::uuid;
  perform pg_temp.as_user('50505050-5050-4050-8050-505050505003');
  v := public.finance_close_receipt(v_far, 'dismissed', 'transferencia de prueba del cliente', null);
  if v->>'resolution' <> 'dismissed' then raise exception 'dismiss %', v; end if;

  -- Refund of an imputed receipt: the collection is reversed, the unpaid right and slot are voided.
  v := public.finance_reopen_obligation(v_obligation, 'no se puede reabrir con cobro vigente');
  if v->>'commercial_error_code' <> 'obligation_not_reopenable' then raise exception 'reopen posted %', v; end if;
  v := public.finance_close_receipt(v_receipt, 'refunded', 'devolucion solicitada por el cliente', 'TALO-REFUND-2');
  if v->>'resolution' <> 'refunded_after_imputation' then raise exception 'refund imputed %', v; end if;
  if (select status from commercial.platform_collections where id = v_collection) <> 'reversed'
    or (select status from commercial.promoter_commissions where collection_id = v_collection) <> 'voided'
    or (select voided_at from commercial.founder_slots where collection_id = v_collection) is null then
    raise exception 'reversal effects';
  end if;
  if (select count(*) from commercial.receipt_resolutions where receipt_id = v_receipt) <> 2 then raise exception 'resolution history'; end if;
  if commercial.business_service_access(pg_temp.id(1, 1), now())->>'state' = 'active' then raise exception 'reversed still covers'; end if;

  -- Reopen, then a new valid transfer for the same period is imputed automatically.
  v := public.finance_reopen_obligation(v_obligation, 'reabrir periodo tras devolucion');
  if v->>'status' <> 'open' then raise exception 'reopen %', v; end if;
  v := pg_temp.read('p10f-1', 'month-again', 5500000, now() - interval '1 hour');
  if v->>'review_reason' is distinct from 'ambiguous_period' then raise exception 'again expected ambiguity %', v; end if;
  perform pg_temp.as_user('50505050-5050-4050-8050-505050505003');
  v := public.finance_impute_receipt((v->>'receipt_id')::uuid, v_terms, v_current, 'nuevo pago del periodo reabierto');
  if v->>'status' <> 'imputed' or (v->>'obligation_id')::uuid <> v_obligation then raise exception 'reimpute %', v; end if;
  if commercial.business_service_access(pg_temp.id(1, 1), now())->>'state' <> 'active' then raise exception 'reimpute access'; end if;
  if (select count(*) from commercial.platform_collections where obligation_id = v_obligation) <> 2 then raise exception 'history kept'; end if;

  -- Dead notice retry.
  perform pg_temp.as_user('');
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', 'p10f-2', 'tx-dead', false);
  v_inbox := (v->>'inbox_id')::uuid;
  update commercial.provider_webhook_inbox set status = 'dead', attempts = 12, last_error = 'transaction_read_failed:503' where id = v_inbox;
  perform pg_temp.as_user('50505050-5050-4050-8050-505050505002');
  if public.finance_retry_webhook(v_inbox)->>'commercial_error_code' <> 'forbidden' then raise exception 'retry forbidden'; end if;
  perform pg_temp.as_user('50505050-5050-4050-8050-505050505003');
  v := public.finance_retry_webhook(v_inbox);
  if v->>'status' <> 'retry' or (select attempts from commercial.provider_webhook_inbox where id = v_inbox) <> 0 then raise exception 'retry %', v; end if;
  if public.finance_retry_webhook(v_inbox)->>'commercial_error_code' <> 'not_dead' then raise exception 'retry twice'; end if;
end;
$$;

do $$
begin
  if has_function_privilege('anon', 'public.finance_impute_receipt(uuid, uuid, date, text)', 'execute')
    or not has_function_privilege('authenticated', 'public.finance_impute_receipt(uuid, uuid, date, text)', 'execute')
    or has_function_privilege('anon', 'public.finance_close_receipt(uuid, text, text, text)', 'execute')
    or has_function_privilege('authenticated', 'commercial.finance_impute_receipt(uuid, uuid, date, text)', 'execute')
    or has_function_privilege('authenticated', 'commercial.finance_guard()', 'execute')
    or has_table_privilege('authenticated', 'commercial.receipt_resolutions', 'insert') then
    raise exception 'finance grants';
  end if;
end;
$$;

select 'phase10_finance_reconciliation: PASS' as result;
rollback;
