-- Talo First L5/L6. Automatic imputation of monthly transfers and recurring accrual timing.
-- Eligible periods at instant t (Buenos Aires): the current period n >= 1 if uncovered, and the next
-- period if t is within ten days of its start and it is uncovered. Exactly one destination is imputed;
-- zero, two, or a different answer at the provider timestamp and at verification go to reconciliation.
-- Recurring rights accrue at the start of the paid period, or at imputation if it already started.
-- Availability is accrual + 15 days. The included period never consumes a slot.

create table commercial.deferred_accruals (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null unique references commercial.platform_collections (id),
  conversion_terms_id uuid not null references commercial.conversion_terms (id),
  period_on date not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'cancelled')),
  outcome text,
  processed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  constraint deferred_accruals_processed_chk check ((status = 'pending') = (processed_at is null)),
  constraint deferred_accruals_outcome_chk check (outcome is null or length(outcome) <= 80)
);

create index deferred_accruals_due_idx on commercial.deferred_accruals (due_at) where status = 'pending';

alter table commercial.deferred_accruals enable row level security;
alter table commercial.deferred_accruals force row level security;
revoke all on table commercial.deferred_accruals from public, anon, authenticated;
grant select on table commercial.deferred_accruals to authenticated;

create policy deferred_accruals_select on commercial.deferred_accruals
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function commercial.subscription_destinations(p_terms_id uuid, p_started date, p_at timestamptz)
returns int[]
language plpgsql
stable
set search_path = pg_catalog, public, commercial
as $$
declare
  v_day date := commercial.ba_date(p_at);
  v_n int := commercial.founder_period_index(p_started, v_day);
  v_result int[] := array[]::int[];
begin
  if p_started is null or p_at is null then
    return v_result;
  end if;
  if v_n >= 1 and not commercial.founder_period_covered(p_terms_id, p_started, v_n) then
    v_result := v_result || v_n;
  end if;
  if v_n + 1 >= 1
    and v_day >= commercial.founder_period_on(p_started, v_n + 1) - 10
    and not commercial.founder_period_covered(p_terms_id, p_started, v_n + 1) then
    v_result := v_result || (v_n + 1);
  end if;
  return v_result;
end;
$$;

-- Slot first, then the right, then the explicit availability date.
create or replace function commercial.accrue_subscription_collection(p_collection_id uuid, p_period_start timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_collection commercial.platform_collections%rowtype;
  v_satisfied jsonb;
  v_accrued jsonb;
  v_available timestamptz;
begin
  select * into v_collection from commercial.platform_collections where id = p_collection_id for update;
  if v_collection.status is distinct from 'posted' or v_collection.policy_status is distinct from 'nominal' then
    return jsonb_build_object('ok', true, 'accrued', false, 'commercial_error_code', 'collection_not_posted');
  end if;
  v_satisfied := commercial.satisfy_subscription_collection(p_collection_id);
  if (v_satisfied->>'ok')::boolean is not true then
    raise exception 'satisfy_rejected: %', coalesce(v_satisfied->>'commercial_error_code', 'unknown');
  end if;
  v_accrued := commercial.accrue_commissions_for_collection(p_collection_id);
  if (v_accrued->>'ok')::boolean is not true then
    raise exception 'accrual_rejected: %', coalesce(v_accrued->>'commercial_error_code', 'unknown');
  end if;
  v_available := greatest(p_period_start, v_collection.posted_at) + interval '15 days';
  if (v_accrued->>'accrued')::boolean is true then
    update commercial.promoter_commissions
    set available_at = v_available
    where id = (v_accrued->>'commission_id')::uuid and available_at is null;
  end if;
  return v_accrued || jsonb_build_object('slot_result', v_satisfied, 'available_at', v_available);
end;
$$;

-- Shared by automatic imputation and by Finance manual imputation.
create or replace function commercial.impute_subscription_period(p_receipt_id uuid, p_terms_id uuid, p_started date, p_index int)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_period date := commercial.founder_period_on(p_started, p_index);
  v_period_start timestamptz;
  v_opened jsonb;
  v_obligation uuid;
  v_posted jsonb;
  v_collection uuid;
  v_accrual jsonb;
  v_mode text;
begin
  if p_index < 1 or v_period is null then
    return commercial.route_receipt_to_reconciliation(p_receipt_id, 'no_eligible_period');
  end if;
  v_period_start := commercial.ba_start(v_period);
  v_opened := commercial.open_obligation(p_terms_id, 'subscription', v_period::text);
  if (v_opened->>'ok')::boolean is not true then
    raise exception 'subscription_obligation_rejected: %', coalesce(v_opened->>'commercial_error_code', 'unknown');
  end if;
  if v_opened->>'status' is distinct from 'open' then
    return commercial.route_receipt_to_reconciliation(p_receipt_id, 'period_not_open');
  end if;
  v_obligation := (v_opened->>'obligation_id')::uuid;
  v_posted := commercial.post_provider_read_collection(p_receipt_id, v_obligation);
  v_collection := (v_posted->>'collection_id')::uuid;

  if v_period_start <= pg_catalog.now() then
    v_mode := 'immediate';
    v_accrual := commercial.accrue_subscription_collection(v_collection, v_period_start);
  else
    v_mode := 'deferred';
    insert into commercial.deferred_accruals (collection_id, conversion_terms_id, period_on, due_at)
    values (v_collection, p_terms_id, v_period, v_period_start);
    v_accrual := jsonb_build_object('accrued', false, 'due_at', v_period_start);
  end if;

  return jsonb_build_object(
    'ok', true,
    'receipt_id', p_receipt_id,
    'status', 'imputed',
    'kind', 'subscription',
    'period_on', v_period,
    'collection_id', v_collection,
    'obligation_id', v_obligation,
    'accrual_mode', v_mode,
    'accrual', v_accrual,
    'economic_recognition', true
  );
end;
$$;

create or replace function commercial.impute_provider_read_receipt(p_receipt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_receipt commercial.provider_receipts%rowtype;
  v_link commercial.provider_customer_links%rowtype;
  v_terms commercial.conversion_terms%rowtype;
  v_terms_count int;
  v_setup commercial.platform_obligations%rowtype;
  v_opened jsonb;
  v_posted jsonb;
  v_accrued jsonb;
  v_started date;
  v_at_provider int[];
  v_at_verification int[];
begin
  select * into v_receipt from commercial.provider_receipts where id = p_receipt_id for update;
  if v_receipt.id is null or v_receipt.status <> 'confirmed' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'receipt_not_confirmed', 'economic_recognition', false);
  end if;
  if not exists (
    select 1 from commercial.provider_read_evidence evidence
    where evidence.receipt_id = v_receipt.id
      and evidence.provider_api_verified
      and evidence.gross_amount_cents = v_receipt.gross_amount_cents
      and evidence.net_amount_cents = v_receipt.net_amount_cents
      and evidence.provider_status = v_receipt.provider_status
  ) then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'evidence_mismatch');
  end if;
  if v_receipt.provider_status is distinct from 'PROCESSED' or v_receipt.currency is distinct from 'ARS' then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'provider_status_unconfirmed');
  end if;

  select * into v_link from commercial.provider_customer_links where id = v_receipt.link_id;
  select count(*) into v_terms_count from commercial.conversion_terms where won_business_id = v_link.won_business_id;
  if v_terms_count <> 1 then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, case when v_terms_count = 0 then 'terms_missing' else 'terms_ambiguous' end);
  end if;
  select * into v_terms from commercial.conversion_terms where won_business_id = v_link.won_business_id for update;

  select * into v_setup from commercial.platform_obligations where conversion_terms_id = v_terms.id and kind = 'setup' for update;
  if v_setup.id is null or (
    v_setup.status = 'open'
    and not exists (select 1 from commercial.platform_collections where obligation_id = v_setup.id and status = 'posted')
  ) then
    if v_receipt.gross_amount_cents is distinct from v_terms.setup_price_cents then
      return commercial.route_receipt_to_reconciliation(v_receipt.id, 'amount_mismatch');
    end if;
    if v_setup.id is null then
      v_opened := commercial.open_obligation(v_terms.id, 'setup', null);
      if (v_opened->>'ok')::boolean is not true then
        raise exception 'setup_obligation_rejected: %', coalesce(v_opened->>'commercial_error_code', 'unknown');
      end if;
      select * into v_setup from commercial.platform_obligations where id = (v_opened->>'obligation_id')::uuid for update;
    end if;
    v_posted := commercial.post_provider_read_collection(v_receipt.id, v_setup.id);
    v_accrued := commercial.accrue_commissions_for_collection((v_posted->>'collection_id')::uuid);
    if (v_accrued->>'ok')::boolean is not true then
      raise exception 'setup_accrual_rejected: %', coalesce(v_accrued->>'commercial_error_code', 'unknown');
    end if;
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', 'imputed',
      'kind', 'setup',
      'collection_id', v_posted->>'collection_id',
      'obligation_id', v_setup.id,
      'commission_id', v_accrued->>'commission_id',
      'economic_recognition', true
    );
  end if;

  if v_setup.status <> 'satisfied' then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'setup_not_open');
  end if;
  if not commercial.founder_period_covered(v_terms.id, null, 0) then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'activation_not_covered');
  end if;
  if v_receipt.gross_amount_cents is distinct from v_terms.monthly_price_cents then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'amount_mismatch');
  end if;
  select service_started_on into v_started from commercial.founder_service_starts where conversion_terms_id = v_terms.id;
  if v_started is null then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'service_start_required');
  end if;
  if v_receipt.observed_at is null then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'provider_timestamp_missing');
  end if;

  v_at_provider := commercial.subscription_destinations(v_terms.id, v_started, v_receipt.observed_at);
  v_at_verification := commercial.subscription_destinations(v_terms.id, v_started, pg_catalog.now());
  if v_at_provider is distinct from v_at_verification then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'eligibility_changed');
  end if;
  if cardinality(v_at_verification) = 0 then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'no_eligible_period');
  end if;
  if cardinality(v_at_verification) > 1 then
    return commercial.route_receipt_to_reconciliation(v_receipt.id, 'ambiguous_period');
  end if;
  return commercial.impute_subscription_period(v_receipt.id, v_terms.id, v_started, v_at_verification[1]);
end;
$$;

create or replace function public.system_process_due_accruals(p_limit int)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_prev text;
  v_row commercial.deferred_accruals%rowtype;
  v_result jsonb;
  v_done int := 0;
  v_cancelled int := 0;
begin
  v_prev := commercial.system_enter();
  for v_row in
    select * from commercial.deferred_accruals
    where status = 'pending' and due_at <= pg_catalog.now()
    order by due_at, id
    limit greatest(1, least(coalesce(p_limit, 50), 200))
    for update skip locked
  loop
    v_result := commercial.accrue_subscription_collection(v_row.collection_id, v_row.due_at);
    if v_result->>'commercial_error_code' = 'collection_not_posted' then
      update commercial.deferred_accruals
      set status = 'cancelled', outcome = 'collection_not_posted', processed_at = pg_catalog.now()
      where id = v_row.id;
      v_cancelled := v_cancelled + 1;
    else
      update commercial.deferred_accruals
      set status = 'done',
          outcome = case when (v_result->>'accrued')::boolean then 'accrued' else left(coalesce(v_result->>'commercial_error_code', 'not_accrued'), 80) end,
          processed_at = pg_catalog.now()
      where id = v_row.id;
      v_done := v_done + 1;
    end if;
  end loop;
  perform commercial.system_exit(v_prev);
  return jsonb_build_object('ok', true, 'done', v_done, 'cancelled', v_cancelled);
end;
$$;

revoke all on function commercial.subscription_destinations(uuid, date, timestamptz) from public, anon, authenticated, service_role;
revoke all on function commercial.accrue_subscription_collection(uuid, timestamptz) from public, anon, authenticated, service_role;
revoke all on function commercial.impute_subscription_period(uuid, uuid, date, int) from public, anon, authenticated, service_role;
revoke all on function commercial.impute_provider_read_receipt(uuid) from public, anon, authenticated, service_role;
revoke all on function public.system_process_due_accruals(int) from public, anon, authenticated;
grant execute on function public.system_process_due_accruals(int) to service_role;
