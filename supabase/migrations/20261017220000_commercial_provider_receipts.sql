-- T08-A. Durable provider receipts. Does not call record_collection.

create table commercial.provider_customer_links (
  id uuid primary key default gen_random_uuid(),
  won_business_id uuid not null references public.businesses (id),
  provider text not null check (provider = 'talo'),
  environment text not null check (environment in ('sandbox', 'production')),
  external_customer_id text not null,
  cvu text not null,
  alias text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint provider_customer_links_customer_chk check (
    length(btrim(external_customer_id)) between 1 and 128
  ),
  constraint provider_customer_links_cvu_chk check (length(btrim(cvu)) between 1 and 32),
  constraint provider_customer_links_alias_chk check (length(btrim(alias)) between 1 and 64)
);

create unique index provider_customer_links_external_uidx
  on commercial.provider_customer_links (provider, environment, external_customer_id);

create unique index provider_customer_links_business_uidx
  on commercial.provider_customer_links (won_business_id, provider, environment);

create table commercial.provider_receipts (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references commercial.provider_customer_links (id),
  provider text not null,
  environment text not null,
  external_customer_id text not null,
  external_transaction_id text not null,
  status text not null check (status in ('received', 'pending_review', 'confirmed')),
  currency text,
  provider_status text,
  gross_amount_cents bigint,
  net_amount_cents bigint,
  processing_difference_cents bigint,
  gross_source text,
  net_source text,
  review_reason text,
  observed_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint provider_receipts_transaction_chk check (length(btrim(external_transaction_id)) between 1 and 128),
  constraint provider_receipts_sources_chk check (
    (gross_source is null or gross_source in ('detail', 'list'))
    and (net_source is null or net_source in ('detail', 'list'))
  ),
  constraint provider_receipts_confirmed_chk check (
    status <> 'confirmed'
    or (
      currency = 'ARS'
      and provider_status is not null
      and length(btrim(provider_status)) > 0
      and gross_amount_cents is not null
      and net_amount_cents is not null
      and processing_difference_cents = gross_amount_cents - net_amount_cents
      and processing_difference_cents >= 0
      and gross_source in ('detail', 'list')
      and net_source in ('detail', 'list')
      and observed_at is not null
      and confirmed_at is not null
    )
  ),
  constraint provider_receipts_open_chk check (
    status = 'confirmed' or confirmed_at is null
  )
);

create unique index provider_receipts_external_uidx
  on commercial.provider_receipts (provider, environment, external_customer_id, external_transaction_id);

create index provider_receipts_link_idx
  on commercial.provider_receipts (link_id);

alter table commercial.provider_customer_links enable row level security;
alter table commercial.provider_customer_links force row level security;
alter table commercial.provider_receipts enable row level security;
alter table commercial.provider_receipts force row level security;

revoke all on table commercial.provider_customer_links from public, anon, authenticated;
revoke all on table commercial.provider_receipts from public, anon, authenticated;

grant select on table commercial.provider_customer_links to authenticated;
grant select on table commercial.provider_receipts to authenticated;

create policy provider_customer_links_select on commercial.provider_customer_links
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create policy provider_receipts_select on commercial.provider_receipts
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function commercial.link_provider_customer(
  p_business_id uuid,
  p_provider text,
  p_environment text,
  p_external_customer_id text,
  p_cvu text,
  p_alias text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_existing commercial.provider_customer_links%rowtype;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated', 'economic_recognition', false);
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden', 'economic_recognition', false);
  end if;
  if p_business_id is null or p_provider is distinct from 'talo' or p_environment not in ('sandbox', 'production') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false);
  end if;

  select * into v_existing
  from commercial.provider_customer_links
  where provider = p_provider
    and environment = p_environment
    and external_customer_id = p_external_customer_id;
  if found then
    if v_existing.won_business_id <> p_business_id or v_existing.cvu <> p_cvu or v_existing.alias <> p_alias then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'customer_link_conflict', 'economic_recognition', false);
    end if;
    return jsonb_build_object('ok', true, 'link_id', v_existing.id, 'idempotent', true, 'economic_recognition', false);
  end if;

  select * into v_existing
  from commercial.provider_customer_links
  where won_business_id = p_business_id
    and provider = p_provider
    and environment = p_environment;
  if found then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'customer_link_conflict', 'economic_recognition', false);
  end if;

  insert into commercial.provider_customer_links (
    won_business_id, provider, environment, external_customer_id, cvu, alias
  ) values (
    p_business_id, p_provider, p_environment, p_external_customer_id, p_cvu, p_alias
  )
  returning id into v_id;
  return jsonb_build_object('ok', true, 'link_id', v_id, 'idempotent', false, 'economic_recognition', false);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'customer_link_conflict', 'economic_recognition', false);
end;
$$;

create or replace function commercial.note_provider_receipt(
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
  if found then
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', v_receipt.status,
      'idempotent', true,
      'economic_recognition', false
    );
  end if;

  insert into commercial.provider_receipts (
    link_id, provider, environment, external_customer_id, external_transaction_id, status
  ) values (
    v_link.id, p_provider, p_environment, p_external_customer_id, p_external_transaction_id, 'received'
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
  if found and v_receipt.status = 'confirmed' then
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
  if found and v_receipt.status = 'confirmed' then
    return jsonb_build_object(
      'ok', true,
      'receipt_id', v_receipt.id,
      'status', 'confirmed',
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

revoke all on function commercial.link_provider_customer(uuid, text, text, text, text, text) from public, anon;
revoke all on function commercial.note_provider_receipt(uuid, text, text, text, text) from public, anon;
revoke all on function commercial.confirm_provider_receipt(uuid, text, text, text, text, text, text, bigint, bigint, text, text, timestamptz) from public, anon;
revoke all on function commercial.defer_provider_receipt(uuid, text, text, text, text) from public, anon;

grant execute on function commercial.link_provider_customer(uuid, text, text, text, text, text) to authenticated;
grant execute on function commercial.note_provider_receipt(uuid, text, text, text, text) to authenticated;
grant execute on function commercial.confirm_provider_receipt(uuid, text, text, text, text, text, text, bigint, bigint, text, text, timestamptz) to authenticated;
grant execute on function commercial.defer_provider_receipt(uuid, text, text, text, text) to authenticated;
