-- T09. Durable Mobbex intents and synthetic events. Does not confirm payment or call record_collection.
-- event_key format: synthetic:<delivery>:<logical-name>
-- The same key is a repeat. A different logical name or delivery is a different event.

create table commercial.provider_payment_intents (
  id uuid primary key default gen_random_uuid(),
  won_business_id uuid not null references public.businesses (id),
  provider text not null default 'mobbex',
  environment text not null default 'sandbox',
  purpose text not null,
  commercial_reference text not null,
  checkout_id text,
  subscription_id text,
  expected_amount_cents bigint not null,
  currency text not null,
  status text not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint provider_payment_intents_provider_chk check (provider = 'mobbex'),
  constraint provider_payment_intents_environment_chk check (environment = 'sandbox'),
  constraint provider_payment_intents_purpose_chk check (purpose in ('setup_checkout', 'subscription')),
  constraint provider_payment_intents_reference_chk check (length(btrim(commercial_reference)) between 8 and 120),
  constraint provider_payment_intents_amount_chk check (expected_amount_cents >= 0 and currency = 'ARS'),
  constraint provider_payment_intents_checkout_chk check (checkout_id is null or length(btrim(checkout_id)) between 1 and 128),
  constraint provider_payment_intents_subscription_chk check (subscription_id is null or length(btrim(subscription_id)) between 1 and 128),
  constraint provider_payment_intents_status_chk check (status in ('reserved', 'created', 'response_ambiguous')),
  constraint provider_payment_intents_identity_chk check (
    (
      status in ('reserved', 'response_ambiguous')
      and checkout_id is null
      and subscription_id is null
    )
    or (
      status = 'created'
      and purpose = 'setup_checkout'
      and checkout_id is not null
      and subscription_id is null
    )
    or (
      status = 'created'
      and purpose = 'subscription'
      and subscription_id is not null
      and checkout_id is null
    )
  )
);

create unique index provider_payment_intents_reference_uidx
  on commercial.provider_payment_intents (won_business_id, environment, purpose, commercial_reference);

create unique index provider_payment_intents_checkout_uidx
  on commercial.provider_payment_intents (provider, environment, checkout_id)
  where checkout_id is not null;

create unique index provider_payment_intents_subscription_uidx
  on commercial.provider_payment_intents (provider, environment, subscription_id)
  where subscription_id is not null;

create table commercial.provider_payment_events (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid references commercial.provider_payment_intents (id),
  event_key text not null,
  source text not null default 'synthetic',
  delivery text not null,
  status text not null default 'pending_unverified',
  created_at timestamptz not null default pg_catalog.now(),
  constraint provider_payment_events_source_chk check (source = 'synthetic'),
  constraint provider_payment_events_delivery_chk check (delivery in ('browser_return', 'webhook_body')),
  constraint provider_payment_events_status_chk check (status = 'pending_unverified'),
  constraint provider_payment_events_key_chk check (
    event_key ~ '^synthetic:(browser_return|webhook_body):[a-z0-9_-]{1,120}$'
    and (
      (delivery = 'browser_return' and event_key like 'synthetic:browser_return:%')
      or (delivery = 'webhook_body' and event_key like 'synthetic:webhook_body:%')
    )
  )
);

create unique index provider_payment_events_matched_uidx
  on commercial.provider_payment_events (intent_id, source, event_key)
  where intent_id is not null;

create unique index provider_payment_events_unmatched_uidx
  on commercial.provider_payment_events (source, event_key)
  where intent_id is null;

alter table commercial.provider_payment_intents enable row level security;
alter table commercial.provider_payment_intents force row level security;
alter table commercial.provider_payment_events enable row level security;
alter table commercial.provider_payment_events force row level security;
revoke all on table commercial.provider_payment_intents from public, anon, authenticated;
revoke all on table commercial.provider_payment_events from public, anon, authenticated;
grant select on table commercial.provider_payment_intents to authenticated;
grant select on table commercial.provider_payment_events to authenticated;

create policy provider_payment_intents_select on commercial.provider_payment_intents
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create policy provider_payment_events_select on commercial.provider_payment_events
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function commercial.reserve_provider_payment_intent(
  p_business_id uuid,
  p_purpose text,
  p_commercial_reference text,
  p_expected_amount_cents bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_reference text;
  v_existing commercial.provider_payment_intents%rowtype;
  v_id uuid;
  v_constraint text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated', 'economic_recognition', false);
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden', 'economic_recognition', false);
  end if;
  v_reference := nullif(btrim(coalesce(p_commercial_reference, '')), '');
  if p_business_id is null or p_purpose not in ('setup_checkout', 'subscription')
    or v_reference is null or length(v_reference) < 8 or length(v_reference) > 120
    or p_expected_amount_cents is null or p_expected_amount_cents < 0
    or p_currency is distinct from 'ARS'
    or not exists (select 1 from public.businesses where id = p_business_id) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false);
  end if;

  select * into v_existing
  from commercial.provider_payment_intents
  where won_business_id = p_business_id
    and environment = 'sandbox'
    and purpose = p_purpose
    and commercial_reference = v_reference
  for update;
  if found then
    if v_existing.expected_amount_cents = p_expected_amount_cents and v_existing.currency = p_currency then
      return jsonb_build_object('ok', true, 'intent_id', v_existing.id, 'status', v_existing.status, 'idempotent', true, 'economic_recognition', false);
    end if;
    return jsonb_build_object('ok', false, 'commercial_error_code', 'reference_conflict', 'economic_recognition', false);
  end if;

  insert into commercial.provider_payment_intents (
    won_business_id, provider, environment, purpose, commercial_reference, expected_amount_cents, currency, status
  ) values (
    p_business_id, 'mobbex', 'sandbox', p_purpose, v_reference, p_expected_amount_cents, 'ARS', 'reserved'
  )
  returning id into v_id;
  return jsonb_build_object('ok', true, 'intent_id', v_id, 'status', 'reserved', 'idempotent', false, 'economic_recognition', false);
exception
  when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    select * into v_existing
    from commercial.provider_payment_intents
    where won_business_id = p_business_id
      and environment = 'sandbox'
      and purpose = p_purpose
      and commercial_reference = v_reference;
    if v_existing.id is not null and v_existing.expected_amount_cents = p_expected_amount_cents then
      return jsonb_build_object('ok', true, 'intent_id', v_existing.id, 'status', v_existing.status, 'idempotent', true, 'economic_recognition', false);
    end if;
    return jsonb_build_object('ok', false, 'commercial_error_code', 'reference_conflict', 'constraint', v_constraint, 'economic_recognition', false);
end;
$$;

create or replace function commercial.complete_provider_payment_intent(
  p_intent_id uuid,
  p_outcome text,
  p_checkout_id text,
  p_subscription_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_intent commercial.provider_payment_intents%rowtype;
  v_checkout text;
  v_subscription text;
  v_constraint text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated', 'economic_recognition', false);
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden', 'economic_recognition', false);
  end if;
  v_checkout := nullif(btrim(coalesce(p_checkout_id, '')), '');
  v_subscription := nullif(btrim(coalesce(p_subscription_id, '')), '');
  if p_intent_id is null or p_outcome not in ('created', 'ambiguous') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false);
  end if;

  select * into v_intent from commercial.provider_payment_intents where id = p_intent_id for update;
  if v_intent.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false);
  end if;

  if p_outcome = 'ambiguous' then
    if v_checkout is not null or v_subscription is not null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false);
    end if;
    if v_intent.status = 'response_ambiguous' then
      return jsonb_build_object('ok', true, 'intent_id', v_intent.id, 'status', v_intent.status, 'idempotent', true, 'economic_recognition', false);
    end if;
    if v_intent.status <> 'reserved' then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'intent_conflict', 'economic_recognition', false);
    end if;
    update commercial.provider_payment_intents
    set status = 'response_ambiguous', updated_at = pg_catalog.now()
    where id = v_intent.id;
    return jsonb_build_object('ok', true, 'intent_id', v_intent.id, 'status', 'response_ambiguous', 'idempotent', false, 'economic_recognition', false);
  end if;

  if v_intent.status = 'response_ambiguous' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'ambiguous_unresolved', 'economic_recognition', false);
  end if;
  if v_intent.purpose = 'setup_checkout' and (v_checkout is null or v_subscription is not null) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false);
  end if;
  if v_intent.purpose = 'subscription' and (v_subscription is null or v_checkout is not null) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false);
  end if;
  if v_intent.status = 'created' then
    if v_intent.checkout_id is not distinct from v_checkout and v_intent.subscription_id is not distinct from v_subscription then
      return jsonb_build_object('ok', true, 'intent_id', v_intent.id, 'status', 'created', 'idempotent', true, 'economic_recognition', false);
    end if;
    return jsonb_build_object('ok', false, 'commercial_error_code', 'intent_conflict', 'economic_recognition', false);
  end if;

  update commercial.provider_payment_intents
  set status = 'created', checkout_id = v_checkout, subscription_id = v_subscription, updated_at = pg_catalog.now()
  where id = v_intent.id;
  return jsonb_build_object('ok', true, 'intent_id', v_intent.id, 'status', 'created', 'idempotent', false, 'economic_recognition', false);
exception
  when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    return jsonb_build_object(
      'ok', false,
      'commercial_error_code', case
        when v_constraint = 'provider_payment_intents_subscription_uidx' then 'subscription_conflict'
        else 'checkout_conflict'
      end,
      'economic_recognition', false
    );
end;
$$;

create or replace function commercial.record_provider_payment_event(
  p_business_id uuid,
  p_purpose text,
  p_commercial_reference text,
  p_event_key text,
  p_delivery text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_reference text;
  v_key text;
  v_intent commercial.provider_payment_intents%rowtype;
  v_existing commercial.provider_payment_events%rowtype;
  v_status text;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated', 'economic_recognition', false);
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden', 'economic_recognition', false);
  end if;
  v_reference := nullif(btrim(coalesce(p_commercial_reference, '')), '');
  v_key := nullif(btrim(coalesce(p_event_key, '')), '');
  if p_delivery not in ('browser_return', 'webhook_body') or v_key is null
    or v_key !~ ('^synthetic:' || p_delivery || ':[a-z0-9_-]{1,120}$')
    or (v_reference is not null and p_purpose not in ('setup_checkout', 'subscription')) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation', 'economic_recognition', false);
  end if;

  if v_reference is not null then
    select * into v_intent
    from commercial.provider_payment_intents
    where won_business_id = p_business_id
      and environment = 'sandbox'
      and purpose = p_purpose
      and commercial_reference = v_reference;
  end if;
  v_status := v_intent.status;

  insert into commercial.provider_payment_events (intent_id, event_key, source, delivery, status)
  values (v_intent.id, v_key, 'synthetic', p_delivery, 'pending_unverified')
  returning id into v_id;

  if v_intent.id is not null and (select status from commercial.provider_payment_intents where id = v_intent.id) is distinct from v_status then
    raise exception 'event_changed_intent_status';
  end if;
  return jsonb_build_object(
    'ok', true,
    'event_id', v_id,
    'intent_id', v_intent.id,
    'matched', v_intent.id is not null,
    'status', 'pending_unverified',
    'idempotent', false,
    'economic_recognition', false
  );
exception
  when unique_violation then
    if v_intent.id is null then
      select * into v_existing
      from commercial.provider_payment_events
      where intent_id is null and source = 'synthetic' and event_key = v_key;
    else
      select * into v_existing
      from commercial.provider_payment_events
      where intent_id = v_intent.id and source = 'synthetic' and event_key = v_key;
    end if;
    if v_existing.id is null or v_existing.delivery is distinct from p_delivery or v_existing.status is distinct from 'pending_unverified' then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'event_conflict', 'economic_recognition', false);
    end if;
    return jsonb_build_object(
      'ok', true,
      'event_id', v_existing.id,
      'intent_id', v_existing.intent_id,
      'matched', v_existing.intent_id is not null,
      'status', 'pending_unverified',
      'idempotent', true,
      'economic_recognition', false
    );
end;
$$;

create or replace function public.reserve_provider_payment_intent(
  p_business_id uuid,
  p_purpose text,
  p_commercial_reference text,
  p_expected_amount_cents bigint,
  p_currency text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.reserve_provider_payment_intent(p_business_id, p_purpose, p_commercial_reference, p_expected_amount_cents, p_currency);
$$;

create or replace function public.complete_provider_payment_intent(
  p_intent_id uuid,
  p_outcome text,
  p_checkout_id text,
  p_subscription_id text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.complete_provider_payment_intent(p_intent_id, p_outcome, p_checkout_id, p_subscription_id);
$$;

create or replace function public.record_provider_payment_event(
  p_business_id uuid,
  p_purpose text,
  p_commercial_reference text,
  p_event_key text,
  p_delivery text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.record_provider_payment_event(p_business_id, p_purpose, p_commercial_reference, p_event_key, p_delivery);
$$;

revoke all on function commercial.reserve_provider_payment_intent(uuid, text, text, bigint, text) from public, anon, authenticated, service_role;
revoke all on function commercial.complete_provider_payment_intent(uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.record_provider_payment_event(uuid, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.reserve_provider_payment_intent(uuid, text, text, bigint, text) from public, anon, service_role;
revoke all on function public.complete_provider_payment_intent(uuid, text, text, text) from public, anon, service_role;
revoke all on function public.record_provider_payment_event(uuid, text, text, text, text) from public, anon, service_role;
grant execute on function public.reserve_provider_payment_intent(uuid, text, text, bigint, text) to authenticated;
grant execute on function public.complete_provider_payment_intent(uuid, text, text, text) to authenticated;
grant execute on function public.record_provider_payment_event(uuid, text, text, text, text) to authenticated;
