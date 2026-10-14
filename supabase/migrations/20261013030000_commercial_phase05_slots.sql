-- P05-T04: founder slots and service reactivation.
-- Does not reverse collections, settle, invoice, or pay.
-- Replaces accrual only to refuse a thirteenth recurring right. Historical migration files stay unchanged.

create table commercial.founder_slots (
  conversion_terms_id uuid not null references commercial.conversion_terms (id),
  slot int not null check (slot between 1 and 12),
  collection_id uuid not null unique references commercial.platform_collections (id),
  obligation_id uuid not null unique references commercial.platform_obligations (id),
  voided_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (conversion_terms_id, slot)
);

create table commercial.service_subscriptions (
  id uuid primary key default gen_random_uuid(),
  won_business_id uuid not null references public.businesses (id),
  conversion_terms_id uuid not null unique references commercial.conversion_terms (id),
  status text not null check (status in ('active', 'cancel_requested', 'ended', 'reactivated')),
  cancel_requested_at timestamptz,
  ended_at timestamptz,
  reactivated_at timestamptz,
  created_at timestamptz not null default pg_catalog.now()
);

alter table commercial.founder_slots enable row level security;
alter table commercial.founder_slots force row level security;
alter table commercial.service_subscriptions enable row level security;
alter table commercial.service_subscriptions force row level security;
revoke all on table commercial.founder_slots from public, anon, authenticated;
revoke all on table commercial.service_subscriptions from public, anon, authenticated;
grant select on table commercial.founder_slots to authenticated;
grant select on table commercial.service_subscriptions to authenticated;

create policy founder_slots_select on commercial.founder_slots
  for select to authenticated
  using (
    commercial.has_permission('collection.write')
    or exists (
      select 1
      from commercial.conversion_terms terms
      join commercial.opportunity_attributions attribution on attribution.id = terms.attribution_id
      where terms.id = founder_slots.conversion_terms_id
        and attribution.promoter_id = commercial.current_promoter_id()
    )
  );

create policy service_subscriptions_select on commercial.service_subscriptions
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function commercial.accrue_commissions_for_collection(p_collection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_collection commercial.platform_collections%rowtype;
  v_obligation commercial.platform_obligations%rowtype;
  v_terms commercial.conversion_terms%rowtype;
  v_promoter uuid;
  v_kind text;
  v_amount bigint;
  v_existing commercial.promoter_commissions%rowtype;
  v_id uuid;
  v_slot int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_collection_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_collection from commercial.platform_collections where id = p_collection_id for update;
  if v_collection.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_collection.status is distinct from 'posted'
    or v_collection.policy_status is distinct from 'nominal'
    or v_collection.eligible_base_cents is null then
    return jsonb_build_object('ok', true, 'accrued', false, 'commercial_error_code', 'policy_blocked');
  end if;

  select * into v_obligation from commercial.platform_obligations where id = v_collection.obligation_id;
  select * into v_terms from commercial.conversion_terms where id = v_obligation.conversion_terms_id;
  select attribution.promoter_id into v_promoter
  from commercial.opportunity_attributions attribution
  where attribution.id = v_terms.attribution_id;
  if v_obligation.id is null or v_terms.id is null or v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if v_obligation.kind = 'setup' then
    v_kind := 'setup';
    v_amount := v_terms.setup_commission_cents;
  elsif v_obligation.kind = 'subscription' then
    v_kind := 'recurring';
    v_amount := v_collection.eligible_base_cents * v_terms.recurring_bps / 10000;
  else
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_existing
  from commercial.promoter_commissions
  where collection_id = p_collection_id and right_kind = v_kind;
  if v_existing.id is not null then
    return jsonb_build_object(
      'ok', true, 'duplicate', true, 'accrued', false,
      'commission_id', v_existing.id, 'amount_cents', v_existing.amount_cents, 'status', v_existing.status
    );
  end if;

  if v_kind = 'recurring'
    and coalesce((select max(slot) from commercial.founder_slots where conversion_terms_id = v_terms.id), 0) >= v_terms.max_recurring_slots then
    return jsonb_build_object('ok', true, 'accrued', false, 'commercial_error_code', 'slot_exhausted');
  end if;

  select slot into v_slot from commercial.founder_slots where obligation_id = v_obligation.id and voided_at is null;

  begin
    insert into commercial.promoter_commissions (
      collection_id, right_kind, conversion_terms_id, promoter_id, slot, amount_cents, status, available_at
    ) values (
      p_collection_id, v_kind, v_terms.id, v_promoter, v_slot, v_amount, 'pending', null
    ) returning id into v_id;
  exception
    when unique_violation then
      select * into v_existing from commercial.promoter_commissions
      where collection_id = p_collection_id and right_kind = v_kind;
      return jsonb_build_object(
        'ok', true, 'duplicate', true, 'accrued', false,
        'commission_id', v_existing.id, 'amount_cents', v_existing.amount_cents, 'status', v_existing.status
      );
  end;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'commission.accrued', 'commercial', 'promoter_commissions', v_id, p_collection_id,
    jsonb_build_object('collection_id', p_collection_id, 'right_kind', v_kind, 'amount_cents', v_amount, 'status', 'pending', 'slot', v_slot)
  );

  return jsonb_build_object(
    'ok', true, 'duplicate', false, 'accrued', true,
    'commission_id', v_id, 'right_kind', v_kind, 'amount_cents', v_amount, 'status', 'pending', 'slot', v_slot
  );
end;
$$;

create or replace function commercial.satisfy_subscription_collection(p_collection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_collection commercial.platform_collections%rowtype;
  v_obligation commercial.platform_obligations%rowtype;
  v_terms commercial.conversion_terms%rowtype;
  v_existing commercial.founder_slots%rowtype;
  v_next int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  select * into v_collection from commercial.platform_collections where id = p_collection_id for update;
  if v_collection.id is null or v_collection.status is distinct from 'posted' or v_collection.policy_status is distinct from 'nominal' then
    return jsonb_build_object('ok', true, 'slotted', false, 'commercial_error_code', 'policy_blocked');
  end if;
  select * into v_obligation from commercial.platform_obligations where id = v_collection.obligation_id for update;
  if v_obligation.kind is distinct from 'subscription' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select * into v_terms from commercial.conversion_terms where id = v_obligation.conversion_terms_id for update;
  select * into v_existing from commercial.founder_slots where obligation_id = v_obligation.id;
  if v_existing.slot is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'slot', v_existing.slot, 'collection_id', v_existing.collection_id);
  end if;

  select coalesce(max(slot), 0) + 1 into v_next from commercial.founder_slots where conversion_terms_id = v_terms.id;
  if v_next > v_terms.max_recurring_slots then
    return jsonb_build_object('ok', true, 'slotted', false, 'commercial_error_code', 'slot_exhausted');
  end if;

  insert into commercial.founder_slots (conversion_terms_id, slot, collection_id, obligation_id)
  values (v_terms.id, v_next, v_collection.id, v_obligation.id);
  update commercial.promoter_commissions
  set slot = v_next
  where collection_id = v_collection.id and right_kind = 'recurring' and slot is null;
  insert into commercial.service_subscriptions (won_business_id, conversion_terms_id, status)
  values (v_terms.won_business_id, v_terms.id, 'active')
  on conflict (conversion_terms_id) do nothing;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'slot.assigned', 'commercial', 'founder_slots', v_collection.id, v_obligation.id,
    jsonb_build_object('slot', v_next, 'conversion_terms_id', v_terms.id)
  );
  return jsonb_build_object('ok', true, 'duplicate', false, 'slotted', true, 'slot', v_next);
end;
$$;

create or replace function commercial.end_service(
  p_terms_id uuid,
  p_cancel_requested_at timestamptz,
  p_ended_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_terms commercial.conversion_terms%rowtype;
  v_status text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select * into v_terms from commercial.conversion_terms where id = p_terms_id;
  if v_terms.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  v_status := case when p_ended_at is not null then 'ended' else 'cancel_requested' end;
  insert into commercial.service_subscriptions (
    won_business_id, conversion_terms_id, status, cancel_requested_at, ended_at
  ) values (
    v_terms.won_business_id, v_terms.id, v_status, p_cancel_requested_at, p_ended_at
  )
  on conflict (conversion_terms_id) do update
  set status = excluded.status,
      cancel_requested_at = coalesce(excluded.cancel_requested_at, commercial.service_subscriptions.cancel_requested_at),
      ended_at = coalesce(excluded.ended_at, commercial.service_subscriptions.ended_at);
  return jsonb_build_object('ok', true, 'status', v_status, 'conversion_terms_id', v_terms.id);
end;
$$;

create or replace function commercial.reactivate_service(p_terms_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_row commercial.service_subscriptions%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select * into v_row from commercial.service_subscriptions where conversion_terms_id = p_terms_id for update;
  if v_row.id is null or v_row.ended_at is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_now > v_row.ended_at + interval '180 days' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'reactivation_window_closed');
  end if;
  update commercial.service_subscriptions
  set status = 'reactivated', reactivated_at = v_now
  where id = v_row.id;
  return jsonb_build_object('ok', true, 'conversion_terms_id', p_terms_id, 'status', 'reactivated');
end;
$$;

revoke all on function commercial.satisfy_subscription_collection(uuid) from public, anon, authenticated, service_role;
revoke all on function commercial.end_service(uuid, timestamptz, timestamptz) from public, anon, authenticated, service_role;
revoke all on function commercial.reactivate_service(uuid) from public, anon, authenticated, service_role;

create or replace function public.satisfy_subscription_collection(p_collection_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.satisfy_subscription_collection(p_collection_id); $$;

create or replace function public.end_service(p_terms_id uuid, p_cancel_requested_at timestamptz, p_ended_at timestamptz)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.end_service(p_terms_id, p_cancel_requested_at, p_ended_at); $$;

create or replace function public.reactivate_service(p_terms_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.reactivate_service(p_terms_id); $$;

revoke all on function public.satisfy_subscription_collection(uuid) from public, anon, service_role;
revoke all on function public.end_service(uuid, timestamptz, timestamptz) from public, anon, service_role;
revoke all on function public.reactivate_service(uuid) from public, anon, service_role;
grant execute on function public.satisfy_subscription_collection(uuid) to authenticated;
grant execute on function public.end_service(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.reactivate_service(uuid) to authenticated;
