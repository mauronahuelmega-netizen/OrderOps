-- Talo First L8. Prospective order gate, legacy exemptions and order integrity (DT-06/DT-07).
-- The gate only blocks new orders: accepted and scheduled orders can still be finished (DT-07).
-- It is off until a superadmin sets enforced_from after a matching preflight (H6).

create table commercial.service_gate_config (
  id boolean primary key default true check (id),
  enforced_from timestamptz,
  updated_by uuid references commercial.platform_accounts (id),
  updated_at timestamptz not null default pg_catalog.now()
);
insert into commercial.service_gate_config (id, enforced_from) values (true, null);

alter table commercial.service_gate_config enable row level security;
alter table commercial.service_gate_config force row level security;
revoke all on table commercial.service_gate_config from public, anon, authenticated;
grant select on table commercial.service_gate_config to authenticated;

create policy service_gate_config_select on commercial.service_gate_config
  for select to authenticated
  using (commercial.has_permission('program.write') or commercial.has_permission('collection.write'));

create or replace function commercial.enforce_service_access_on_order()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_from timestamptz;
  v_access jsonb;
begin
  select enforced_from into v_from from commercial.service_gate_config where id;
  if v_from is null or pg_catalog.now() < v_from then
    return new;
  end if;
  v_access := commercial.business_service_access(new.business_id, pg_catalog.now());
  if (v_access->>'allows_orders')::boolean is not true then
    raise exception 'service_access_blocked'
      using errcode = 'P0001', detail = coalesce(v_access->>'state', 'unknown');
  end if;
  return new;
end;
$$;

create trigger orders_service_access_gate
  before insert on public.orders
  for each row execute function commercial.enforce_service_access_on_order();

-- DT-06: a client session may only change the assignment; status moves through
-- transition_order_status and totals only through create_order.
create or replace function commercial.guard_client_order_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if current_user in ('authenticated', 'anon')
    and (to_jsonb(new) - 'assigned_to' - 'assigned_at') is distinct from (to_jsonb(old) - 'assigned_to' - 'assigned_at') then
    raise exception 'order_update_not_allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger orders_client_update_guard
  before update on public.orders
  for each row execute function commercial.guard_client_order_update();

create or replace function commercial.service_gate_preflight(p_at timestamptz)
returns table (business_id uuid, business_name text, slug text, state text, orders_last_30_days bigint)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
begin
  if auth.uid() is null or not (commercial.has_permission('program.write') or commercial.has_permission('collection.write')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select b.id, b.name, b.slug, access.value->>'state',
    (select count(*) from public.orders o where o.business_id = b.id and o.created_at >= p_at - interval '30 days')
  from public.businesses b
  cross join lateral (select commercial.business_service_access(b.id, p_at) as value) access
  where (access.value->>'allows_orders')::boolean is not true
  order by 5 desc, b.name;
end;
$$;

-- Prospective: enforced_from must not be in the past, and the caller must confirm how many
-- businesses the preflight says would be blocked at that instant.
create or replace function commercial.set_service_gate(p_enforced_from timestamptz, p_expected_blocked int)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_blocked int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('program.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_enforced_from is not null then
    if p_enforced_from < pg_catalog.now() then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'not_prospective');
    end if;
    select count(*) into v_blocked from commercial.service_gate_preflight(p_enforced_from);
    if p_expected_blocked is distinct from v_blocked then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'preflight_mismatch', 'blocked', v_blocked);
    end if;
  end if;
  update commercial.service_gate_config
  set enforced_from = p_enforced_from, updated_by = v_actor, updated_at = pg_catalog.now()
  where id;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'service_gate.set', 'commercial', 'service_gate_config', v_actor, v_actor,
    jsonb_build_object('enforced_from', p_enforced_from, 'expected_blocked', p_expected_blocked)
  );
  return jsonb_build_object('ok', true, 'enforced_from', p_enforced_from, 'blocked', v_blocked);
end;
$$;

create or replace function commercial.set_service_access_exemption(p_business_id uuid, p_reason text, p_active boolean)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('program.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_business_id is null or p_active is null or v_reason is null or length(v_reason) not between 8 and 300
    or not exists (select 1 from public.businesses where id = p_business_id) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_active then
    insert into commercial.service_access_exemptions (business_id, reason, granted_by)
    values (p_business_id, v_reason, v_actor)
    on conflict (business_id) do update
    set reason = excluded.reason, granted_by = excluded.granted_by, granted_at = pg_catalog.now(), revoked_at = null, revoked_by = null;
  else
    update commercial.service_access_exemptions
    set revoked_at = pg_catalog.now(), revoked_by = v_actor
    where business_id = p_business_id and revoked_at is null;
  end if;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', case when p_active then 'service_exemption.granted' else 'service_exemption.revoked' end,
    'public', 'businesses', p_business_id, p_business_id, jsonb_build_object('reason', v_reason)
  );
  return jsonb_build_object('ok', true, 'business_id', p_business_id, 'active', p_active);
end;
$$;

create or replace function public.service_gate_preflight(p_at timestamptz)
returns table (business_id uuid, business_name text, slug text, state text, orders_last_30_days bigint)
language sql stable security definer set search_path = pg_catalog, public, commercial
as $$ select * from commercial.service_gate_preflight(p_at) $$;

create or replace function public.set_service_gate(p_enforced_from timestamptz, p_expected_blocked int)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.set_service_gate(p_enforced_from, p_expected_blocked) $$;

create or replace function public.set_service_access_exemption(p_business_id uuid, p_reason text, p_active boolean)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.set_service_access_exemption(p_business_id, p_reason, p_active) $$;

revoke all on function commercial.enforce_service_access_on_order() from public, anon, authenticated, service_role;
revoke all on function commercial.guard_client_order_update() from public, anon, authenticated, service_role;
revoke all on function commercial.service_gate_preflight(timestamptz) from public, anon, authenticated, service_role;
revoke all on function commercial.set_service_gate(timestamptz, int) from public, anon, authenticated, service_role;
revoke all on function commercial.set_service_access_exemption(uuid, text, boolean) from public, anon, authenticated, service_role;
revoke all on function public.service_gate_preflight(timestamptz) from public, anon, service_role;
revoke all on function public.set_service_gate(timestamptz, int) from public, anon, service_role;
revoke all on function public.set_service_access_exemption(uuid, text, boolean) from public, anon, service_role;
grant execute on function public.service_gate_preflight(timestamptz) to authenticated;
grant execute on function public.set_service_gate(timestamptz, int) to authenticated;
grant execute on function public.set_service_access_exemption(uuid, text, boolean) to authenticated;
