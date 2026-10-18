-- T08-B. Impute one attested setup receipt. Does not accrue commissions or slots.
-- Operator attestation is not a Talo API verification and not a webhook signature check.

alter table commercial.provider_receipts
  add column collection_id uuid references commercial.platform_collections (id),
  add column obligation_id uuid references commercial.platform_obligations (id);

alter table commercial.provider_receipts drop constraint provider_receipts_status_check;
alter table commercial.provider_receipts add constraint provider_receipts_status_check
  check (status in ('received', 'pending_review', 'confirmed', 'imputed', 'reconciliation_required'));

alter table commercial.provider_receipts drop constraint provider_receipts_open_chk;
alter table commercial.provider_receipts add constraint provider_receipts_open_chk
  check (
    (status in ('received', 'pending_review') and confirmed_at is null)
    or (status in ('confirmed', 'imputed', 'reconciliation_required') and confirmed_at is not null)
  );

alter table commercial.provider_receipts add constraint provider_receipts_imputed_chk
  check (
    status <> 'imputed'
    or (
      collection_id is not null
      and obligation_id is not null
      and currency = 'ARS'
      and provider_status is not null
      and gross_amount_cents is not null
      and net_amount_cents is not null
      and processing_difference_cents = gross_amount_cents - net_amount_cents
      and processing_difference_cents >= 0
    )
  );

alter table commercial.provider_receipts add constraint provider_receipts_unimputed_chk
  check (
    (status = 'imputed' and collection_id is not null and obligation_id is not null)
    or (status <> 'imputed' and collection_id is null and obligation_id is null)
  );

alter table commercial.provider_receipts add constraint provider_receipts_reconciliation_chk
  check (
    status <> 'reconciliation_required'
    or (review_reason is not null and length(btrim(review_reason)) > 0 and collection_id is null)
  );

create unique index provider_receipts_collection_uidx
  on commercial.provider_receipts (collection_id)
  where collection_id is not null;

create table commercial.provider_receipt_evidence (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null unique references commercial.provider_receipts (id),
  kind text not null check (kind = 'operator_attestation'),
  actor_account_id uuid not null references commercial.platform_accounts (id),
  movement_consultation text not null,
  obligation_id uuid not null references commercial.platform_obligations (id),
  talo_authorization text not null,
  gross_amount_cents bigint not null,
  net_amount_cents bigint not null,
  processing_difference_cents bigint not null,
  provider_status text not null,
  currency text not null,
  provider_api_verified boolean not null default false,
  webhook_signature_verified boolean not null default false,
  attested_at timestamptz not null default pg_catalog.now(),
  constraint provider_receipt_evidence_consultation_chk check (length(btrim(movement_consultation)) between 8 and 500),
  constraint provider_receipt_evidence_authorization_chk check (length(btrim(talo_authorization)) between 8 and 500),
  constraint provider_receipt_evidence_not_api_chk check (provider_api_verified = false),
  constraint provider_receipt_evidence_not_signature_chk check (webhook_signature_verified = false),
  constraint provider_receipt_evidence_amounts_chk check (
    currency = 'ARS'
    and provider_status = 'PROCESSED'
    and gross_amount_cents >= net_amount_cents
    and processing_difference_cents = gross_amount_cents - net_amount_cents
  )
);

alter table commercial.provider_receipt_evidence enable row level security;
alter table commercial.provider_receipt_evidence force row level security;
revoke all on table commercial.provider_receipt_evidence from public, anon, authenticated;
grant select on table commercial.provider_receipt_evidence to authenticated;

create policy provider_receipt_evidence_select on commercial.provider_receipt_evidence
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function commercial.confirm_provider_receipt(
  p_business_id uuid,
  p_provider text,
  p_environment text,
  p_external_customer_id text,
  p_external_transaction_id text,
  p_provider_status text,
  p_currency text,
  p_gross_amount_cents bigint,
  p_net_amount_cents bigint,
  p_gross_source text,
  p_net_source text,
  p_observed_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_link commercial.provider_customer_links%rowtype;
  v_receipt commercial.provider_receipts%rowtype;
  v_status text;
  v_difference bigint;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated', 'economic_recognition', false);
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden', 'economic_recognition', false);
  end if;

  select * into v_link
  from commercial.provider_customer_links
  where provider = p_provider
    and environment = p_environment
    and external_customer_id = p_external_customer_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'customer_link_missing', 'economic_recognition', false);
  end if;
  if v_link.won_business_id <> p_business_id then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'customer_link_conflict', 'economic_recognition', false);
  end if;

  v_status := 'pending_review';
  v_difference := null;
  if p_currency = 'ARS'
    and p_provider_status is not null
    and length(btrim(p_provider_status)) > 0
    and p_gross_amount_cents is not null
    and p_net_amount_cents is not null
    and p_gross_amount_cents >= p_net_amount_cents
    and p_gross_source in ('detail', 'list')
    and p_net_source in ('detail', 'list')
    and p_observed_at is not null then
    v_status := 'confirmed';
    v_difference := p_gross_amount_cents - p_net_amount_cents;
  end if;

  select * into v_receipt
  from commercial.provider_receipts
  where provider = p_provider
    and environment = p_environment
    and external_customer_id = p_external_customer_id
    and external_transaction_id = p_external_transaction_id
  for update;
  if found and v_receipt.status in ('confirmed', 'imputed', 'reconciliation_required') then
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', v_receipt.status,
      'idempotent', true,
      'amount_preserved', v_receipt.gross_amount_cents is distinct from p_gross_amount_cents
        or v_receipt.net_amount_cents is distinct from p_net_amount_cents,
      'economic_recognition', false
    );
  end if;

  if found then
    update commercial.provider_receipts
    set status = v_status,
        currency = case when v_status = 'confirmed' then p_currency else null end,
        provider_status = case when v_status = 'confirmed' then p_provider_status else null end,
        gross_amount_cents = case when v_status = 'confirmed' then p_gross_amount_cents else null end,
        net_amount_cents = case when v_status = 'confirmed' then p_net_amount_cents else null end,
        processing_difference_cents = case when v_status = 'confirmed' then v_difference else null end,
        gross_source = case when v_status = 'confirmed' then p_gross_source else null end,
        net_source = case when v_status = 'confirmed' then p_net_source else null end,
        review_reason = case when v_status = 'confirmed' then null else 'confirmation_incomplete' end,
        observed_at = case when v_status = 'confirmed' then p_observed_at else null end,
        confirmed_at = case when v_status = 'confirmed' then pg_catalog.now() else null end,
        updated_at = pg_catalog.now()
    where id = v_receipt.id
    returning * into v_receipt;
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', v_receipt.status,
      'idempotent', false,
      'economic_recognition', false
    );
  end if;

  insert into commercial.provider_receipts (
    link_id, provider, environment, external_customer_id, external_transaction_id,
    status, currency, provider_status, gross_amount_cents, net_amount_cents,
    processing_difference_cents, gross_source, net_source, review_reason, observed_at, confirmed_at
  ) values (
    v_link.id, p_provider, p_environment, p_external_customer_id, p_external_transaction_id,
    v_status,
    case when v_status = 'confirmed' then p_currency else null end,
    case when v_status = 'confirmed' then p_provider_status else null end,
    case when v_status = 'confirmed' then p_gross_amount_cents else null end,
    case when v_status = 'confirmed' then p_net_amount_cents else null end,
    case when v_status = 'confirmed' then v_difference else null end,
    case when v_status = 'confirmed' then p_gross_source else null end,
    case when v_status = 'confirmed' then p_net_source else null end,
    case when v_status = 'confirmed' then null else 'confirmation_incomplete' end,
    case when v_status = 'confirmed' then p_observed_at else null end,
    case when v_status = 'confirmed' then pg_catalog.now() else null end
  )
  returning * into v_receipt;
  return jsonb_build_object(
    'ok', true,
    'receipt_id', v_receipt.id,
    'status', v_receipt.status,
    'idempotent', false,
    'economic_recognition', false
  );
exception
  when unique_violation then
    select * into v_receipt
    from commercial.provider_receipts
    where provider = p_provider
      and environment = p_environment
      and external_customer_id = p_external_customer_id
      and external_transaction_id = p_external_transaction_id;
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', v_receipt.status,
      'idempotent', true,
      'economic_recognition', false
    );
end;
$$;

create or replace function commercial.defer_provider_receipt(
  p_business_id uuid,
  p_provider text,
  p_environment text,
  p_external_customer_id text,
  p_external_transaction_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_link commercial.provider_customer_links%rowtype;
  v_receipt commercial.provider_receipts%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated', 'economic_recognition', false);
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden', 'economic_recognition', false);
  end if;

  select * into v_link
  from commercial.provider_customer_links
  where provider = p_provider
    and environment = p_environment
    and external_customer_id = p_external_customer_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'customer_link_missing', 'economic_recognition', false);
  end if;
  if v_link.won_business_id <> p_business_id then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'customer_link_conflict', 'economic_recognition', false);
  end if;

  select * into v_receipt
  from commercial.provider_receipts
  where provider = p_provider
    and environment = p_environment
    and external_customer_id = p_external_customer_id
    and external_transaction_id = p_external_transaction_id
  for update;
  if found and v_receipt.status in ('confirmed', 'imputed', 'reconciliation_required') then
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', v_receipt.status,
      'idempotent', true,
      'economic_recognition', false
    );
  end if;
  if found then
    update commercial.provider_receipts
    set status = 'pending_review',
        review_reason = 'temporary_failure',
        confirmed_at = null,
        updated_at = pg_catalog.now()
    where id = v_receipt.id
    returning * into v_receipt;
  else
    insert into commercial.provider_receipts (
      link_id, provider, environment, external_customer_id, external_transaction_id, status, review_reason
    ) values (
      v_link.id, p_provider, p_environment, p_external_customer_id, p_external_transaction_id, 'pending_review', 'temporary_failure'
    )
    returning * into v_receipt;
  end if;
  return jsonb_build_object(
    'ok', true,
    'receipt_id', v_receipt.id,
    'status', v_receipt.status,
    'idempotent', false,
    'economic_recognition', false
  );
exception
  when unique_violation then
    select * into v_receipt
    from commercial.provider_receipts
    where provider = p_provider
      and environment = p_environment
      and external_customer_id = p_external_customer_id
      and external_transaction_id = p_external_transaction_id;
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', v_receipt.status,
      'idempotent', true,
      'economic_recognition', false
    );
end;
$$;

create or replace function commercial.attest_provider_receipt(
  p_receipt_id uuid,
  p_obligation_id uuid,
  p_movement_consultation text,
  p_talo_authorization text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_receipt commercial.provider_receipts%rowtype;
  v_link commercial.provider_customer_links%rowtype;
  v_obligation commercial.platform_obligations%rowtype;
  v_existing commercial.provider_receipt_evidence%rowtype;
  v_consultation text;
  v_authorization text;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  v_consultation := nullif(btrim(coalesce(p_movement_consultation, '')), '');
  v_authorization := nullif(btrim(coalesce(p_talo_authorization, '')), '');
  if p_receipt_id is null or p_obligation_id is null
    or v_consultation is null or length(v_consultation) < 8 or length(v_consultation) > 500
    or v_authorization is null or length(v_authorization) < 8 or length(v_authorization) > 500 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  select * into v_receipt from commercial.provider_receipts where id = p_receipt_id for update;
  if v_receipt.id is null or v_receipt.status <> 'confirmed' or v_receipt.provider_status is distinct from 'PROCESSED' or v_receipt.currency is distinct from 'ARS' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'receipt_not_attestable', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  select * into v_link from commercial.provider_customer_links where id = v_receipt.link_id for update;
  if v_link.id is null
    or v_link.provider is distinct from v_receipt.provider
    or v_link.environment is distinct from v_receipt.environment
    or v_link.external_customer_id is distinct from v_receipt.external_customer_id then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'provider_inconsistent', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  select * into v_obligation from commercial.platform_obligations where id = p_obligation_id for update;
  if v_obligation.id is null or v_obligation.won_business_id is distinct from v_link.won_business_id then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'obligation_business_mismatch', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  select * into v_existing from commercial.provider_receipt_evidence where receipt_id = p_receipt_id;
  if v_existing.id is not null then
    if v_existing.obligation_id = p_obligation_id
      and v_existing.movement_consultation = v_consultation
      and v_existing.talo_authorization = v_authorization
      and v_existing.gross_amount_cents = v_receipt.gross_amount_cents
      and v_existing.net_amount_cents = v_receipt.net_amount_cents then
      return jsonb_build_object('ok', true, 'evidence_id', v_existing.id, 'idempotent', true, 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
    end if;
    return jsonb_build_object('ok', false, 'commercial_error_code', 'evidence_conflict', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  insert into commercial.provider_receipt_evidence (
    receipt_id, kind, actor_account_id, movement_consultation, obligation_id, talo_authorization,
    gross_amount_cents, net_amount_cents, processing_difference_cents, provider_status, currency,
    provider_api_verified, webhook_signature_verified
  ) values (
    v_receipt.id, 'operator_attestation', v_actor, v_consultation, v_obligation.id, v_authorization,
    v_receipt.gross_amount_cents, v_receipt.net_amount_cents, v_receipt.processing_difference_cents,
    v_receipt.provider_status, v_receipt.currency, false, false
  )
  returning id into v_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'receipt.operator_attested', 'commercial', 'provider_receipt_evidence', v_id, v_receipt.id,
    jsonb_build_object(
      'receipt_id', v_receipt.id,
      'obligation_id', v_obligation.id,
      'movement_consultation', v_consultation,
      'talo_authorization', v_authorization,
      'gross_amount_cents', v_receipt.gross_amount_cents,
      'net_amount_cents', v_receipt.net_amount_cents,
      'provider_status', v_receipt.provider_status,
      'provider_api_verified', false,
      'webhook_signature_verified', false
    )
  );

  return jsonb_build_object('ok', true, 'evidence_id', v_id, 'idempotent', false, 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
end;
$$;

create or replace function commercial.impute_provider_receipt(p_receipt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_receipt commercial.provider_receipts%rowtype;
  v_evidence commercial.provider_receipt_evidence%rowtype;
  v_link commercial.provider_customer_links%rowtype;
  v_obligation commercial.platform_obligations%rowtype;
  v_reason text;
  v_matches int;
  v_result jsonb;
  v_ref text;
  v_key text;
  v_collection uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;
  if p_receipt_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  select * into v_receipt from commercial.provider_receipts where id = p_receipt_id for update;
  if v_receipt.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;
  if v_receipt.status = 'imputed' then
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'collection_id', v_receipt.collection_id,
      'obligation_id', v_receipt.obligation_id,
      'status', 'imputed',
      'idempotent', true,
      'economic_recognition', exists (
        select 1 from commercial.platform_collections
        where id = v_receipt.collection_id and status = 'posted' and policy_status = 'nominal'
      ),
      'provider_api_verified', false,
      'webhook_signature_verified', false
    );
  end if;
  if v_receipt.status = 'reconciliation_required' then
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', 'reconciliation_required',
      'review_reason', v_receipt.review_reason,
      'idempotent', true,
      'economic_recognition', false,
      'provider_api_verified', false,
      'webhook_signature_verified', false
    );
  end if;
  if v_receipt.status <> 'confirmed' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'receipt_not_confirmed', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  select * into v_evidence from commercial.provider_receipt_evidence where receipt_id = v_receipt.id for update;
  if v_evidence.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'evidence_missing', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;
  if v_evidence.kind is distinct from 'operator_attestation'
    or v_evidence.provider_api_verified
    or v_evidence.webhook_signature_verified
    or v_evidence.gross_amount_cents is distinct from v_receipt.gross_amount_cents
    or v_evidence.net_amount_cents is distinct from v_receipt.net_amount_cents
    or v_evidence.processing_difference_cents is distinct from v_receipt.processing_difference_cents
    or v_evidence.provider_status is distinct from v_receipt.provider_status
    or v_evidence.currency is distinct from v_receipt.currency then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'evidence_mismatch', 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false);
  end if;

  select * into v_link from commercial.provider_customer_links where id = v_receipt.link_id for update;
  select * into v_obligation from commercial.platform_obligations where id = v_evidence.obligation_id for update;
  v_reason := null;
  if v_link.id is null
    or v_receipt.provider is distinct from v_link.provider
    or v_receipt.environment is distinct from v_link.environment
    or v_receipt.external_customer_id is distinct from v_link.external_customer_id then
    v_reason := 'provider_inconsistent';
  elsif v_obligation.id is null or v_obligation.won_business_id is distinct from v_link.won_business_id then
    v_reason := 'obligation_business_mismatch';
  elsif v_receipt.provider_status is distinct from 'PROCESSED' or v_receipt.currency is distinct from 'ARS' then
    v_reason := 'provider_status_unconfirmed';
  elsif v_obligation.kind is distinct from 'setup' then
    v_reason := 'subscription_due_not_defined';
  elsif v_obligation.status is distinct from 'open' then
    v_reason := 'obligation_not_open';
  elsif v_obligation.list_price_cents is distinct from v_receipt.gross_amount_cents then
    v_reason := 'amount_mismatch';
  else
    select count(*) into v_matches
    from commercial.platform_obligations
    where won_business_id = v_link.won_business_id
      and status = 'open'
      and kind = 'setup'
      and list_price_cents = v_receipt.gross_amount_cents;
    if v_matches <> 1 then
      v_reason := case when v_matches = 0 then 'no_eligible_obligation' else 'ambiguous_obligation' end;
    elsif exists (
      select 1 from commercial.platform_collections
      where obligation_id = v_obligation.id and status = 'posted'
    ) then
      v_reason := 'obligation_already_collected';
    end if;
  end if;

  if v_reason is not null then
    update commercial.provider_receipts
    set status = 'reconciliation_required', review_reason = v_reason, updated_at = pg_catalog.now()
    where id = v_receipt.id;
    insert into commercial.audit_events (
      actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
    ) values (
      v_actor, 'internal', 'receipt.reconciliation_required', 'commercial', 'provider_receipts', v_receipt.id, v_receipt.id,
      jsonb_build_object('review_reason', v_reason, 'economic_recognition', false, 'provider_api_verified', false, 'webhook_signature_verified', false)
    );
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', 'reconciliation_required',
      'review_reason', v_reason,
      'idempotent', false,
      'economic_recognition', false,
      'provider_api_verified', false,
      'webhook_signature_verified', false
    );
  end if;

  v_key := 'provider-receipt:' || v_receipt.id::text;
  v_ref := v_receipt.provider || ':' || v_receipt.environment || ':' || v_receipt.external_customer_id || ':' || v_receipt.external_transaction_id;
  v_result := commercial.record_collection(v_obligation.id, v_key, 'posted', v_receipt.gross_amount_cents, v_ref);
  if (v_result->>'ok')::boolean is not true then
    raise exception 'impute_collection_rejected';
  end if;
  if v_result->>'policy_status' is distinct from 'nominal' or v_result->>'obligation_status' is distinct from 'satisfied' then
    raise exception 'impute_refused_non_nominal';
  end if;
  v_collection := (v_result->>'collection_id')::uuid;

  update commercial.provider_receipts
  set status = 'imputed',
      collection_id = v_collection,
      obligation_id = v_obligation.id,
      updated_at = pg_catalog.now()
  where id = v_receipt.id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'receipt.imputed', 'commercial', 'provider_receipts', v_receipt.id, v_collection,
    jsonb_build_object(
      'collection_id', v_collection,
      'obligation_id', v_obligation.id,
      'idempotency_key', v_key,
      'external_ref', v_ref,
      'provider_api_verified', false,
      'webhook_signature_verified', false
    )
  );

  return jsonb_build_object(
    'ok', true,
    'receipt_id', v_receipt.id,
    'collection_id', v_collection,
    'obligation_id', v_obligation.id,
    'status', 'imputed',
    'idempotent', coalesce((v_result->>'duplicate')::boolean, false),
    'economic_recognition', true,
    'provider_api_verified', false,
    'webhook_signature_verified', false
  );
end;
$$;

create or replace function public.attest_provider_receipt(
  p_receipt_id uuid,
  p_obligation_id uuid,
  p_movement_consultation text,
  p_talo_authorization text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.attest_provider_receipt(p_receipt_id, p_obligation_id, p_movement_consultation, p_talo_authorization);
$$;

create or replace function public.impute_provider_receipt(p_receipt_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.impute_provider_receipt(p_receipt_id);
$$;

revoke all on function commercial.attest_provider_receipt(uuid, uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.impute_provider_receipt(uuid) from public, anon, authenticated, service_role;
revoke all on function public.attest_provider_receipt(uuid, uuid, text, text) from public, anon, service_role;
revoke all on function public.impute_provider_receipt(uuid) from public, anon, service_role;
grant execute on function public.attest_provider_receipt(uuid, uuid, text, text) to authenticated;
grant execute on function public.impute_provider_receipt(uuid) to authenticated;
