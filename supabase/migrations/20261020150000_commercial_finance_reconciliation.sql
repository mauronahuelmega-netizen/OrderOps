-- Talo First L7. Finance manual reconciliation. Requires collection.write (finance/superadmin).
-- Nothing is deleted: resolutions are append-only, reversals keep the collection as 'reversed'.
-- Refunds are made outside OrderOps and only recorded here. No automatic netting.

create table commercial.receipt_resolutions (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references commercial.provider_receipts (id),
  kind text not null check (kind in ('imputed_manually', 'refunded', 'refunded_after_imputation', 'dismissed')),
  note text not null check (length(btrim(note)) between 8 and 500),
  external_reference text check (external_reference is null or length(btrim(external_reference)) between 1 and 128),
  collection_id uuid references commercial.platform_collections (id),
  resolved_by uuid not null references commercial.platform_accounts (id),
  resolved_at timestamptz not null default pg_catalog.now(),
  constraint receipt_resolutions_refund_reference_chk check (
    kind not in ('refunded', 'refunded_after_imputation') or external_reference is not null
  )
);

create unique index receipt_resolutions_receipt_kind_uidx on commercial.receipt_resolutions (receipt_id, kind);
create unique index receipt_resolutions_one_closure_uidx on commercial.receipt_resolutions (receipt_id)
  where kind <> 'imputed_manually';

alter table commercial.receipt_resolutions enable row level security;
alter table commercial.receipt_resolutions force row level security;
revoke all on table commercial.receipt_resolutions from public, anon, authenticated;
grant select on table commercial.receipt_resolutions to authenticated;

create policy receipt_resolutions_select on commercial.receipt_resolutions
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function commercial.finance_guard()
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
begin
  if auth.uid() is null then
    return null;
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return null;
  end if;
  return v_actor;
end;
$$;

-- p_period_on null imputes the activation; otherwise the subscription period starting that day.
create or replace function commercial.finance_impute_receipt(p_receipt_id uuid, p_terms_id uuid, p_period_on date, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid := commercial.finance_guard();
  v_receipt commercial.provider_receipts%rowtype;
  v_link commercial.provider_customer_links%rowtype;
  v_terms commercial.conversion_terms%rowtype;
  v_setup commercial.platform_obligations%rowtype;
  v_started date;
  v_n int;
  v_index int;
  v_opened jsonb;
  v_posted jsonb;
  v_accrued jsonb;
  v_result jsonb;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_receipt_id is null or p_terms_id is null or v_note is null or length(v_note) not between 8 and 500 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select * into v_receipt from commercial.provider_receipts where id = p_receipt_id for update;
  if v_receipt.id is null or v_receipt.status <> 'reconciliation_required'
    or exists (select 1 from commercial.receipt_resolutions where receipt_id = v_receipt.id) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'receipt_not_reconcilable');
  end if;
  if not exists (
    select 1 from commercial.provider_read_evidence evidence
    where evidence.receipt_id = v_receipt.id and evidence.provider_api_verified
      and evidence.gross_amount_cents = v_receipt.gross_amount_cents and evidence.provider_status = 'PROCESSED'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'provider_read_required');
  end if;
  select * into v_link from commercial.provider_customer_links where id = v_receipt.link_id;
  select * into v_terms from commercial.conversion_terms where id = p_terms_id for update;
  if v_terms.id is null or v_terms.won_business_id is distinct from v_link.won_business_id then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'terms_business_mismatch');
  end if;

  update commercial.provider_receipts set status = 'confirmed', review_reason = null, updated_at = pg_catalog.now()
  where id = v_receipt.id;

  if p_period_on is null then
    select * into v_setup from commercial.platform_obligations where conversion_terms_id = v_terms.id and kind = 'setup' for update;
    if v_receipt.gross_amount_cents is distinct from v_terms.setup_price_cents then
      raise exception 'finance_impute_rejected: amount_mismatch' using errcode = 'P0001';
    end if;
    if v_setup.id is null then
      v_opened := commercial.open_obligation(v_terms.id, 'setup', null);
      select * into v_setup from commercial.platform_obligations where id = (v_opened->>'obligation_id')::uuid for update;
    end if;
    if v_setup.status <> 'open' then
      raise exception 'finance_impute_rejected: setup_not_open' using errcode = 'P0001';
    end if;
    v_posted := commercial.post_provider_read_collection(v_receipt.id, v_setup.id);
    v_accrued := commercial.accrue_commissions_for_collection((v_posted->>'collection_id')::uuid);
    if (v_accrued->>'ok')::boolean is not true then
      raise exception 'finance_impute_rejected: accrual' using errcode = 'P0001';
    end if;
    v_result := v_posted || jsonb_build_object('kind', 'setup', 'status', 'imputed');
  else
    if v_receipt.gross_amount_cents is distinct from v_terms.monthly_price_cents then
      raise exception 'finance_impute_rejected: amount_mismatch' using errcode = 'P0001';
    end if;
    if not commercial.founder_period_covered(v_terms.id, null, 0) then
      raise exception 'finance_impute_rejected: activation_not_covered' using errcode = 'P0001';
    end if;
    select service_started_on into v_started from commercial.founder_service_starts where conversion_terms_id = v_terms.id;
    if v_started is null then
      raise exception 'finance_impute_rejected: service_start_required' using errcode = 'P0001';
    end if;
    v_n := commercial.founder_period_index(v_started, commercial.ba_date(pg_catalog.now()));
    v_index := commercial.founder_period_index(v_started, p_period_on);
    -- Expired periods are not billable; only the current or the next one can be chosen.
    if v_index < 1 or commercial.founder_period_on(v_started, v_index) is distinct from p_period_on
      or v_index not in (v_n, v_n + 1)
      or commercial.founder_period_covered(v_terms.id, v_started, v_index) then
      raise exception 'finance_impute_rejected: period_not_eligible' using errcode = 'P0001';
    end if;
    v_result := commercial.impute_subscription_period(v_receipt.id, v_terms.id, v_started, v_index);
    if v_result->>'status' is distinct from 'imputed' then
      raise exception 'finance_impute_rejected: %', coalesce(v_result->>'review_reason', 'not_imputed') using errcode = 'P0001';
    end if;
  end if;

  insert into commercial.receipt_resolutions (receipt_id, kind, note, collection_id, resolved_by)
  values (v_receipt.id, 'imputed_manually', v_note, (v_result->>'collection_id')::uuid, v_actor);
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'receipt.imputed_manually', 'commercial', 'provider_receipts', v_receipt.id, v_receipt.id,
    jsonb_build_object('terms_id', v_terms.id, 'period_on', p_period_on, 'note', v_note, 'collection_id', v_result->>'collection_id')
  );
  return v_result || jsonb_build_object('ok', true, 'resolution', 'imputed_manually');
exception
  when sqlstate 'P0001' then
    if sqlerrm like 'finance_impute_rejected: %' then
      return jsonb_build_object('ok', false, 'commercial_error_code', substr(sqlerrm, length('finance_impute_rejected: ') + 1));
    end if;
    raise;
end;
$$;

-- Records a refund made outside OrderOps, or dismisses a receipt. An imputed receipt is reversed first.
create or replace function commercial.finance_close_receipt(p_receipt_id uuid, p_kind text, p_note text, p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid := commercial.finance_guard();
  v_receipt commercial.provider_receipts%rowtype;
  v_kind text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_reference text := nullif(btrim(coalesce(p_reference, '')), '');
  v_reversal jsonb;
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_receipt_id is null or p_kind is null or p_kind not in ('refunded', 'dismissed')
    or v_note is null or length(v_note) not between 8 and 500
    or (p_kind = 'refunded' and v_reference is null) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select * into v_receipt from commercial.provider_receipts where id = p_receipt_id for update;
  if v_receipt.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if exists (select 1 from commercial.receipt_resolutions where receipt_id = v_receipt.id and kind <> 'imputed_manually') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'receipt_already_closed');
  end if;

  if v_receipt.status = 'imputed' then
    if p_kind <> 'refunded' then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'imputed_requires_refund');
    end if;
    v_reversal := commercial.reverse_collection(v_receipt.collection_id, 'refund: ' || v_note);
    if (v_reversal->>'ok')::boolean is not true then
      return jsonb_build_object('ok', false, 'commercial_error_code', coalesce(v_reversal->>'commercial_error_code', 'reversal_rejected'));
    end if;
    v_kind := 'refunded_after_imputation';
    insert into commercial.receipt_resolutions (receipt_id, kind, note, external_reference, collection_id, resolved_by)
    values (v_receipt.id, v_kind, v_note, v_reference, v_receipt.collection_id, v_actor);
  elsif v_receipt.status in ('reconciliation_required', 'pending_review', 'received') then
    v_kind := p_kind;
    insert into commercial.receipt_resolutions (receipt_id, kind, note, external_reference, resolved_by)
    values (v_receipt.id, v_kind, v_note, v_reference, v_actor);
  else
    return jsonb_build_object('ok', false, 'commercial_error_code', 'receipt_not_closable');
  end if;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'receipt.' || v_kind, 'commercial', 'provider_receipts', v_receipt.id, v_receipt.id,
    jsonb_build_object('note', v_note, 'external_reference', v_reference, 'collection_id', v_receipt.collection_id, 'reversal', v_reversal)
  );
  return jsonb_build_object('ok', true, 'receipt_id', v_receipt.id, 'resolution', v_kind, 'reversal', v_reversal);
end;
$$;

-- A period whose only posted collection was reversed can be collected again.
create or replace function commercial.finance_reopen_obligation(p_obligation_id uuid, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid := commercial.finance_guard();
  v_obligation commercial.platform_obligations%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_obligation_id is null or v_note is null or length(v_note) not between 8 and 500 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select * into v_obligation from commercial.platform_obligations where id = p_obligation_id for update;
  if v_obligation.id is null or v_obligation.status <> 'satisfied'
    or exists (select 1 from commercial.platform_collections where obligation_id = v_obligation.id and status = 'posted')
    or not exists (select 1 from commercial.platform_collections where obligation_id = v_obligation.id and status = 'reversed') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'obligation_not_reopenable');
  end if;
  update commercial.platform_obligations set status = 'open', updated_at = pg_catalog.now() where id = v_obligation.id;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'obligation.reopened', 'commercial', 'platform_obligations', v_obligation.id, v_obligation.id,
    jsonb_build_object('note', v_note, 'previous_status', v_obligation.status)
  );
  return jsonb_build_object('ok', true, 'obligation_id', v_obligation.id, 'status', 'open');
end;
$$;

create or replace function commercial.finance_retry_webhook(p_inbox_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid := commercial.finance_guard();
  v_row commercial.provider_webhook_inbox%rowtype;
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select * into v_row from commercial.provider_webhook_inbox where id = p_inbox_id for update;
  if v_row.id is null or v_row.status <> 'dead' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'not_dead');
  end if;
  update commercial.provider_webhook_inbox
  set status = 'retry', attempts = 0, next_attempt_at = pg_catalog.now()
  where id = v_row.id;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'webhook.retry_requested', 'commercial', 'provider_webhook_inbox', v_row.id, v_row.id,
    jsonb_build_object('last_error', v_row.last_error, 'attempts', v_row.attempts)
  );
  return jsonb_build_object('ok', true, 'inbox_id', v_row.id, 'status', 'retry');
end;
$$;

create or replace function public.finance_impute_receipt(p_receipt_id uuid, p_terms_id uuid, p_period_on date, p_note text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.finance_impute_receipt(p_receipt_id, p_terms_id, p_period_on, p_note) $$;

create or replace function public.finance_close_receipt(p_receipt_id uuid, p_kind text, p_note text, p_reference text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.finance_close_receipt(p_receipt_id, p_kind, p_note, p_reference) $$;

create or replace function public.finance_reopen_obligation(p_obligation_id uuid, p_note text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.finance_reopen_obligation(p_obligation_id, p_note) $$;

create or replace function public.finance_retry_webhook(p_inbox_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.finance_retry_webhook(p_inbox_id) $$;

revoke all on function commercial.finance_guard() from public, anon, authenticated, service_role;
revoke all on function commercial.finance_impute_receipt(uuid, uuid, date, text) from public, anon, authenticated, service_role;
revoke all on function commercial.finance_close_receipt(uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.finance_reopen_obligation(uuid, text) from public, anon, authenticated, service_role;
revoke all on function commercial.finance_retry_webhook(uuid) from public, anon, authenticated, service_role;
revoke all on function public.finance_impute_receipt(uuid, uuid, date, text) from public, anon, service_role;
revoke all on function public.finance_close_receipt(uuid, text, text, text) from public, anon, service_role;
revoke all on function public.finance_reopen_obligation(uuid, text) from public, anon, service_role;
revoke all on function public.finance_retry_webhook(uuid) from public, anon, service_role;
grant execute on function public.finance_impute_receipt(uuid, uuid, date, text) to authenticated;
grant execute on function public.finance_close_receipt(uuid, text, text, text) to authenticated;
grant execute on function public.finance_reopen_obligation(uuid, text) to authenticated;
grant execute on function public.finance_retry_webhook(uuid) to authenticated;
