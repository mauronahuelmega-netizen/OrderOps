-- Talo First L5/L6. Rolls back. Monthly imputation by eligibility window and recurring accrual timing.
-- Dates are relative to the transaction clock, because verification time is now().
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '40404040-4040-4040-8040-404040404001', 'authenticated', 'authenticated', 'p10sub-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '40404040-4040-4040-8040-404040404002', 'authenticated', 'authenticated', 'p10sub-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '40404040-4040-4040-8040-404040404003', 'authenticated', 'authenticated', 'p10sub-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('40404040-4040-4040-8040-404040404011', '40404040-4040-4040-8040-404040404001', 'internal'),
  ('40404040-4040-4040-8040-404040404012', '40404040-4040-4040-8040-404040404002', 'promoter'),
  ('40404040-4040-4040-8040-404040404013', '40404040-4040-4040-8040-404040404003', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('40404040-4040-4040-8040-404040404011', 'superadmin'),
  ('40404040-4040-4040-8040-404040404013', 'finance');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('40404040-4040-4040-8040-404040404021', '40404040-4040-4040-8040-404040404012', 'p10s000021', 'Promotor Mensual', 'active');

create function pg_temp.id(p_kind int, p_n int) returns uuid language sql immutable as $$
  select ('40404040-4040-4040-8040-' || lpad(p_kind::text, 10, '0') || lpad(p_n::text, 2, '0'))::uuid
$$;

create function pg_temp.read(p_customer text, p_tx text, p_gross bigint, p_observed timestamptz) returns jsonb
language plpgsql as $$
declare v jsonb; v_id uuid;
begin
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', p_customer, p_tx, false);
  v_id := (v->>'inbox_id')::uuid;
  update commercial.provider_webhook_inbox
  set status = 'processing', locked_at = now(), attempts = attempts + 1
  where id = v_id and status in ('pending', 'retry');
  return public.system_record_provider_read(v_id, 'PROCESSED', 'ARS', p_gross, p_gross - 100000, 'list', 'detail', p_observed, repeat('cd', 32));
end;
$$;

-- Won, linked and activated through the automatic flow; optional service start.
create function pg_temp.business(p_n int, p_started date) returns uuid
language plpgsql as $$
declare v jsonb; v_terms uuid;
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (pg_temp.id(1, p_n), 'Negocio Mensual ' || p_n, 'negocio-mensual-' || p_n, '54911004040' || lpad(p_n::text, 2, '0'));
  insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
  values (pg_temp.id(2, p_n), 'Lead Mensual ' || p_n, 'lead mensual ' || p_n, 'promoter');
  insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id)
  values (pg_temp.id(3, p_n), pg_temp.id(2, p_n), 'demo_done', '40404040-4040-4040-8040-404040404012');
  insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason)
  values (pg_temp.id(4, p_n), pg_temp.id(3, p_n), '40404040-4040-4040-8040-404040404021', 'confirmed', 'manual', 'fixture');
  perform set_config('request.jwt.claim.sub', '40404040-4040-4040-8040-404040404001', true);
  v := commercial.win_opportunity(pg_temp.id(3, p_n), pg_temp.id(1, p_n), null);
  v_terms := (v->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '', true);
  perform public.system_link_provider_customer(pg_temp.id(1, p_n), 'talo', 'sandbox', 'p10s-' || p_n, '00000000000000004040' || lpad(p_n::text, 2, '0'), 'p10s.' || p_n);
  v := pg_temp.read('p10s-' || p_n, 'setup-' || p_n, 29000000, now() - interval '40 days');
  if v->>'kind' is distinct from 'setup' then raise exception 'activation % %', p_n, v; end if;
  if p_started is not null then
    perform set_config('request.jwt.claim.sub', '40404040-4040-4040-8040-404040404003', true);
    v := public.record_founder_service_start(v_terms, p_started);
    if (v->>'ok')::boolean is not true then raise exception 'start % %', p_n, v; end if;
    perform set_config('request.jwt.claim.sub', '', true);
  end if;
  return v_terms;
end;
$$;

do $$
declare
  v_today date := commercial.ba_date(now());
  v jsonb;
  v_terms uuid;
  v_started date;
  v_collection uuid;
  v_commission commercial.promoter_commissions%rowtype;
  v_deferred commercial.deferred_accruals%rowtype;
begin
  -- A: current period 1 started two days ago and is in grace -> imputed now, accrued now.
  v_started := ((v_today - 2) - interval '1 month')::date;
  v_terms := pg_temp.business(1, v_started);
  if commercial.founder_period_index(v_started, v_today) <> 1 then raise exception 'fixture A index'; end if;
  if commercial.business_service_access(pg_temp.id(1, 1), now())->>'state' <> 'grace' then raise exception 'A not in grace'; end if;
  v := pg_temp.read('p10s-1', 'month-1', 5500000, now() - interval '1 hour');
  if v->>'kind' is distinct from 'subscription' or v->>'accrual_mode' is distinct from 'immediate'
    or (v->>'period_on')::date <> commercial.founder_period_on(v_started, 1) then
    raise exception 'A imputation %', v;
  end if;
  v_collection := (v->>'collection_id')::uuid;
  select * into v_commission from commercial.promoter_commissions where collection_id = v_collection;
  if v_commission.right_kind <> 'recurring' or v_commission.amount_cents <> 2200000 or v_commission.slot <> 1
    or v_commission.available_at <> (select posted_at from commercial.platform_collections where id = v_collection) + interval '15 days' then
    raise exception 'A commission %', row_to_json(v_commission);
  end if;
  if commercial.business_service_access(pg_temp.id(1, 1), now())->>'state' <> 'active' then raise exception 'A not reactivated'; end if;
  if (select count(*) from commercial.founder_slots where conversion_terms_id = v_terms) <> 1 then
    raise exception 'A slots: the included period must not consume one';
  end if;

  -- B: inside the T-10 window for period 1 -> imputed now, accrual deferred to the period start.
  v_started := ((v_today + 5) - interval '1 month')::date;
  v_terms := pg_temp.business(2, v_started);
  if commercial.founder_period_index(v_started, v_today) <> 0 then raise exception 'fixture B index'; end if;
  v := pg_temp.read('p10s-2', 'month-2', 5500000, now() - interval '1 hour');
  if v->>'accrual_mode' is distinct from 'deferred' then raise exception 'B imputation %', v; end if;
  v_collection := (v->>'collection_id')::uuid;
  select * into v_deferred from commercial.deferred_accruals where collection_id = v_collection;
  if v_deferred.status <> 'pending' or v_deferred.due_at <> commercial.ba_start(v_today + 5) then
    raise exception 'B deferred %', row_to_json(v_deferred);
  end if;
  if exists (select 1 from commercial.promoter_commissions where collection_id = v_collection)
    or exists (select 1 from commercial.founder_slots where collection_id = v_collection) then
    raise exception 'B accrued before the period start';
  end if;
  v := public.system_process_due_accruals(50);
  if exists (select 1 from commercial.promoter_commissions where collection_id = v_collection) then
    raise exception 'B accrued by an early worker run';
  end if;
  if (commercial.business_service_access(pg_temp.id(1, 2), commercial.ba_start(v_today + 5))->>'state') <> 'active' then
    raise exception 'B prepaid period not covered';
  end if;

  -- C: same shape, reversed before the period start -> the deferred accrual is cancelled.
  v_started := ((v_today + 5) - interval '1 month')::date;
  perform pg_temp.business(3, v_started);
  v := pg_temp.read('p10s-3', 'month-3', 5500000, now() - interval '1 hour');
  v_collection := (v->>'collection_id')::uuid;
  perform set_config('request.jwt.claim.sub', '40404040-4040-4040-8040-404040404003', true);
  v := commercial.reverse_collection(v_collection, 'fixture reversal before accrual');
  if (v->>'ok')::boolean is not true then raise exception 'C reverse %', v; end if;
  perform set_config('request.jwt.claim.sub', '', true);

  -- Make B and C due, then run the worker.
  update commercial.deferred_accruals set due_at = now() - interval '1 second'
  where collection_id in (
    select collection_id from commercial.provider_receipts where external_customer_id in ('p10s-2', 'p10s-3') and collection_id is not null
  ) and status = 'pending';
  v := public.system_process_due_accruals(50);
  if (v->>'done')::int < 1 or (v->>'cancelled')::int < 1 then raise exception 'worker %', v; end if;
  select * into v_commission from commercial.promoter_commissions
  where collection_id = (select collection_id from commercial.provider_receipts where external_transaction_id = 'month-2');
  if v_commission.id is null or v_commission.slot <> 1 or v_commission.amount_cents <> 2200000
    or v_commission.available_at < now() + interval '15 days' - interval '1 minute' then
    raise exception 'B commission %', row_to_json(v_commission);
  end if;
  if exists (
    select 1 from commercial.promoter_commissions
    where collection_id = (select collection_id from commercial.provider_receipts where external_transaction_id = 'month-3')
  ) or (select status from commercial.deferred_accruals where collection_id = (select collection_id from commercial.provider_receipts where external_transaction_id = 'month-3')) <> 'cancelled' then
    raise exception 'C reversal before accrual';
  end if;
  v := public.system_process_due_accruals(50);
  if (v->>'done')::int <> 0 or (v->>'cancelled')::int <> 0 then raise exception 'worker not idempotent %', v; end if;

  -- D: paid before the window, verified inside it -> eligibility differs -> reconciliation.
  v_started := ((v_today + 5) - interval '1 month')::date;
  perform pg_temp.business(4, v_started);
  v := pg_temp.read('p10s-4', 'month-4', 5500000, now() - interval '6 days');
  if v->>'review_reason' is distinct from 'eligibility_changed' then raise exception 'D %', v; end if;

  -- E: current period unpaid and next window open -> two destinations -> reconciliation.
  v_started := ((v_today + 5) - interval '2 months')::date;
  perform pg_temp.business(5, v_started);
  if commercial.founder_period_index(v_started, v_today) <> 1 then raise exception 'fixture E index'; end if;
  v := pg_temp.read('p10s-5', 'month-5', 5500000, now() - interval '1 hour');
  if v->>'review_reason' is distinct from 'ambiguous_period' then raise exception 'E %', v; end if;

  -- F: included period, next one far away -> nothing eligible.
  perform pg_temp.business(6, v_today - 3);
  v := pg_temp.read('p10s-6', 'month-6', 5500000, now() - interval '1 hour');
  if v->>'review_reason' is distinct from 'no_eligible_period' then raise exception 'F %', v; end if;

  -- G: no service start yet; H: wrong monthly amount.
  perform pg_temp.business(7, null);
  v := pg_temp.read('p10s-7', 'month-7', 5500000, now() - interval '1 hour');
  if v->>'review_reason' is distinct from 'service_start_required' then raise exception 'G %', v; end if;
  v := pg_temp.read('p10s-1', 'month-1b', 6500000, now() - interval '1 hour');
  if v->>'review_reason' is distinct from 'amount_mismatch' then raise exception 'H %', v; end if;

  -- A second valid monthly for an already covered period has no destination and is not double-imputed.
  v := pg_temp.read('p10s-1', 'month-1c', 5500000, now() - interval '1 hour');
  if v->>'status' is distinct from 'reconciliation_required' then raise exception 'double imputation %', v; end if;

  if exists (
    select 1 from commercial.provider_receipts receipt
    where receipt.external_customer_id like 'p10s-%' and receipt.status = 'reconciliation_required' and receipt.collection_id is not null
  ) then raise exception 'reconciliation with money effect'; end if;
end;
$$;

-- Twelve-slot cap through the shared imputation path: thirteen paid months, twelve recurring rights.
do $$
declare
  v_started date := (commercial.ba_date(now()) - interval '14 months')::date;
  v_terms uuid;
  v_prev text;
  v jsonb;
  v_last uuid;
  i int;
begin
  v_terms := pg_temp.business(8, v_started);
  v_prev := commercial.system_enter();
  for i in 1..13 loop
    v := commercial.confirm_provider_receipt(pg_temp.id(1, 8), 'talo', 'sandbox', 'p10s-8', 'cap-' || i, 'PROCESSED', 'ARS', 5500000, 5400000, 'list', 'detail', now());
    v := commercial.impute_subscription_period((v->>'receipt_id')::uuid, v_terms, v_started, i);
    if v->>'accrual_mode' is distinct from 'immediate' then raise exception 'cap % %', i, v; end if;
    v_last := (v->>'collection_id')::uuid;
  end loop;
  perform commercial.system_exit(v_prev);
  if (select count(*) from commercial.promoter_commissions where conversion_terms_id = v_terms and right_kind = 'recurring' and status <> 'voided') <> 12
    or (select count(*) from commercial.founder_slots where conversion_terms_id = v_terms) <> 12
    or exists (select 1 from commercial.promoter_commissions where collection_id = v_last) then
    raise exception 'twelve cap';
  end if;
  if not commercial.founder_period_covered(v_terms, v_started, 13) then raise exception 'month 13 not covered'; end if;
end;
$$;

do $$
begin
  if has_function_privilege('authenticated', 'public.system_process_due_accruals(int)', 'execute')
    or has_function_privilege('anon', 'public.system_process_due_accruals(int)', 'execute')
    or not has_function_privilege('service_role', 'public.system_process_due_accruals(int)', 'execute') then
    raise exception 'accrual worker grants';
  end if;
  if has_function_privilege('authenticated', 'commercial.impute_subscription_period(uuid, uuid, date, int)', 'execute')
    or has_function_privilege('service_role', 'commercial.accrue_subscription_collection(uuid, timestamptz)', 'execute') then
    raise exception 'internal grants';
  end if;
end;
$$;

select 'phase10_subscription_imputation: PASS' as result;
rollback;
