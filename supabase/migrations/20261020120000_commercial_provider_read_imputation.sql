-- Talo First L3. Authenticated provider read as evidence, and automatic imputation of the activation.
-- The read comes from the Talo API with OrderOps credentials. X-Talo-Signature is still not verified.
-- Subscription receipts are routed to reconciliation here; L5 replaces commercial.impute_provider_read_receipt.

create table commercial.provider_read_evidence (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null unique references commercial.provider_receipts (id),
  inbox_id uuid not null unique references commercial.provider_webhook_inbox (id),
  kind text not null default 'provider_read' check (kind = 'provider_read'),
  provider_api_verified boolean not null default true,
  webhook_signature_verified boolean not null default false,
  provider_status text not null,
  currency text not null,
  gross_amount_cents bigint not null,
  net_amount_cents bigint not null,
  gross_source text not null check (gross_source in ('detail', 'list')),
  net_source text not null check (net_source in ('detail', 'list')),
  provider_timestamp timestamptz not null,
  response_digest text not null,
  read_at timestamptz not null default pg_catalog.now(),
  constraint provider_read_evidence_api_chk check (provider_api_verified = true),
  constraint provider_read_evidence_signature_chk check (webhook_signature_verified = false),
  constraint provider_read_evidence_digest_chk check (response_digest ~ '^[0-9a-f]{64}$'),
  constraint provider_read_evidence_amounts_chk check (
    currency = 'ARS' and gross_amount_cents >= net_amount_cents and net_amount_cents >= 0
  )
);

alter table commercial.provider_read_evidence enable row level security;
alter table commercial.provider_read_evidence force row level security;
revoke all on table commercial.provider_read_evidence from public, anon, authenticated;
grant select on table commercial.provider_read_evidence to authenticated;

create policy provider_read_evidence_select on commercial.provider_read_evidence
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function commercial.route_receipt_to_reconciliation(p_receipt_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
begin
  update commercial.provider_receipts
  set status = 'reconciliation_required', review_reason = p_reason, updated_at = pg_catalog.now()
  where id = p_receipt_id and status = 'confirmed';
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    commercial.current_account_id(), 'internal', 'receipt.reconciliation_required', 'commercial', 'provider_receipts',
    p_receipt_id, p_receipt_id,
    jsonb_build_object('review_reason', p_reason, 'economic_recognition', false, 'provider_api_verified', true, 'webhook_signature_verified', false)
  );
  return jsonb_build_object('ok', true, 'receipt_id', p_receipt_id, 'status', 'reconciliation_required', 'review_reason', p_reason, 'economic_recognition', false);
end;
$$;

-- Records the collection against the obligation and accrues per the existing PHASE-05 rules.
create or replace function commercial.post_provider_read_collection(p_receipt_id uuid, p_obligation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_receipt commercial.provider_receipts%rowtype;
  v_key text;
  v_ref text;
  v_result jsonb;
  v_collection uuid;
begin
  select * into v_receipt from commercial.provider_receipts where id = p_receipt_id for update;
  v_key := 'provider-receipt:' || v_receipt.id::text;
  v_ref := v_receipt.provider || ':' || v_receipt.environment || ':' || v_receipt.external_customer_id || ':' || v_receipt.external_transaction_id;
  v_result := commercial.record_collection(p_obligation_id, v_key, 'posted', v_receipt.gross_amount_cents, v_ref);
  if (v_result->>'ok')::boolean is not true then
    raise exception 'impute_collection_rejected: %', coalesce(v_result->>'commercial_error_code', 'unknown');
  end if;
  if v_result->>'policy_status' is distinct from 'nominal' or v_result->>'obligation_status' is distinct from 'satisfied' then
    raise exception 'impute_refused_non_nominal';
  end if;
  v_collection := (v_result->>'collection_id')::uuid;

  update commercial.provider_receipts
  set status = 'imputed', collection_id = v_collection, obligation_id = p_obligation_id, updated_at = pg_catalog.now()
  where id = v_receipt.id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    commercial.current_account_id(), 'internal', 'receipt.imputed', 'commercial', 'provider_receipts', v_receipt.id, v_collection,
    jsonb_build_object(
      'collection_id', v_collection,
      'obligation_id', p_obligation_id,
      'idempotency_key', v_key,
      'external_ref', v_ref,
      'provider_api_verified', true,
      'webhook_signature_verified', false
    )
  );
  return jsonb_build_object('ok', true, 'collection_id', v_collection, 'obligation_id', p_obligation_id);
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
  return commercial.route_receipt_to_reconciliation(v_receipt.id, 'subscription_not_automated');
end;
$$;

create or replace function public.system_record_provider_read(
  p_inbox_id uuid,
  p_provider_status text,
  p_currency text,
  p_gross_amount_cents bigint,
  p_net_amount_cents bigint,
  p_gross_source text,
  p_net_source text,
  p_provider_timestamp timestamptz,
  p_response_digest text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_inbox commercial.provider_webhook_inbox%rowtype;
  v_link commercial.provider_customer_links%rowtype;
  v_prev text;
  v_confirm jsonb;
  v_receipt commercial.provider_receipts%rowtype;
  v_result jsonb;
begin
  select * into v_inbox from commercial.provider_webhook_inbox where id = p_inbox_id for update;
  if v_inbox.id is null or v_inbox.status <> 'processing' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'not_claimed');
  end if;
  if p_response_digest is null or p_response_digest !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_provider_status is distinct from 'PROCESSED' then
    return public.system_defer_provider_webhook(p_inbox_id, 'provider_status:' || left(coalesce(p_provider_status, 'missing'), 40))
      || jsonb_build_object('deferred', true, 'economic_recognition', false);
  end if;
  if p_provider_timestamp is null then
    return public.system_defer_provider_webhook(p_inbox_id, 'provider_timestamp_missing')
      || jsonb_build_object('deferred', true, 'economic_recognition', false);
  end if;
  if p_currency is distinct from 'ARS'
    or p_gross_amount_cents is null or p_net_amount_cents is null
    or p_net_amount_cents < 0 or p_gross_amount_cents < p_net_amount_cents
    or p_gross_source is null or p_gross_source not in ('detail', 'list')
    or p_net_source is null or p_net_source not in ('detail', 'list') then
    return public.system_defer_provider_webhook(p_inbox_id, 'read_incomplete')
      || jsonb_build_object('deferred', true, 'economic_recognition', false);
  end if;

  select * into v_link from commercial.provider_customer_links where id = v_inbox.link_id;
  v_prev := commercial.system_enter();

  v_confirm := commercial.confirm_provider_receipt(
    v_link.won_business_id, v_inbox.provider, v_inbox.environment, v_inbox.external_customer_id,
    v_inbox.external_transaction_id, p_provider_status, p_currency, p_gross_amount_cents, p_net_amount_cents,
    p_gross_source, p_net_source, p_provider_timestamp
  );
  if (v_confirm->>'ok')::boolean is not true then
    raise exception 'confirm_rejected: %', coalesce(v_confirm->>'commercial_error_code', 'unknown');
  end if;
  select * into v_receipt from commercial.provider_receipts where id = (v_confirm->>'receipt_id')::uuid for update;

  if v_receipt.status = 'confirmed' then
    insert into commercial.provider_read_evidence (
      receipt_id, inbox_id, provider_status, currency, gross_amount_cents, net_amount_cents,
      gross_source, net_source, provider_timestamp, response_digest
    ) values (
      v_receipt.id, v_inbox.id, p_provider_status, p_currency, p_gross_amount_cents,
      p_net_amount_cents, p_gross_source, p_net_source, p_provider_timestamp, p_response_digest
    )
    on conflict (receipt_id) do nothing;
    v_result := commercial.impute_provider_read_receipt(v_receipt.id);
  else
    v_result := jsonb_build_object('ok', true, 'receipt_id', v_receipt.id, 'status', v_receipt.status, 'idempotent', true, 'economic_recognition', false);
  end if;

  update commercial.provider_webhook_inbox
  set status = 'processed', processed_at = pg_catalog.now(), locked_at = null, last_error = null, receipt_id = v_receipt.id
  where id = v_inbox.id;

  perform commercial.system_exit(v_prev);
  return v_result || jsonb_build_object('inbox_id', v_inbox.id, 'provider_api_verified', true, 'webhook_signature_verified', false);
end;
$$;

revoke all on function commercial.route_receipt_to_reconciliation(uuid, text) from public, anon, authenticated, service_role;
revoke all on function commercial.post_provider_read_collection(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function commercial.impute_provider_read_receipt(uuid) from public, anon, authenticated, service_role;
revoke all on function public.system_record_provider_read(uuid, text, text, bigint, bigint, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.system_record_provider_read(uuid, text, text, bigint, bigint, text, text, timestamptz, text) to service_role;
