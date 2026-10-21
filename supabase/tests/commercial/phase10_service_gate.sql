-- Talo First L8. Rolls back. Prospective order gate, exemptions, DT-06 client update guard, DT-07.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '60606060-6060-4060-8060-606060606001', 'authenticated', 'authenticated', 'p10gate-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '60606060-6060-4060-8060-606060606002', 'authenticated', 'authenticated', 'p10gate-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '60606060-6060-4060-8060-606060606003', 'authenticated', 'authenticated', 'p10gate-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '60606060-6060-4060-8060-606060606004', 'authenticated', 'authenticated', 'p10gate-owner@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('60606060-6060-4060-8060-606060606011', '60606060-6060-4060-8060-606060606001', 'internal'),
  ('60606060-6060-4060-8060-606060606012', '60606060-6060-4060-8060-606060606002', 'promoter'),
  ('60606060-6060-4060-8060-606060606013', '60606060-6060-4060-8060-606060606003', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('60606060-6060-4060-8060-606060606011', 'superadmin'),
  ('60606060-6060-4060-8060-606060606013', 'finance');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('60606060-6060-4060-8060-606060606021', '60606060-6060-4060-8060-606060606012', 'p10g000021', 'Promotor Gate', 'active');

create function pg_temp.id(p_kind int, p_n int) returns uuid language sql immutable as $$
  select ('60606060-6060-4060-8060-' || lpad(p_kind::text, 10, '0') || lpad(p_n::text, 2, '0'))::uuid
$$;

create function pg_temp.as_user(p_sub text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_sub, true);
end;
$$;

create function pg_temp.business(p_n int, p_won boolean, p_started date) returns uuid
language plpgsql as $$
declare v jsonb; v_terms uuid; v_setup uuid;
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (pg_temp.id(1, p_n), 'Negocio Gate ' || p_n, 'negocio-gate-' || p_n, '54911006060' || lpad(p_n::text, 2, '0'));
  if not p_won then
    return null;
  end if;
  insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
  values (pg_temp.id(2, p_n), 'Lead Gate ' || p_n, 'lead gate ' || p_n, 'promoter');
  insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id)
  values (pg_temp.id(3, p_n), pg_temp.id(2, p_n), 'demo_done', '60606060-6060-4060-8060-606060606012');
  insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason)
  values (pg_temp.id(4, p_n), pg_temp.id(3, p_n), '60606060-6060-4060-8060-606060606021', 'confirmed', 'manual', 'fixture');
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606001');
  v := commercial.win_opportunity(pg_temp.id(3, p_n), pg_temp.id(1, p_n), null);
  v_terms := (v->>'conversion_terms_id')::uuid;
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606003');
  v := public.open_obligation(v_terms, 'setup', null);
  v := commercial.record_collection((v->>'obligation_id')::uuid, 'p10gate-setup-' || p_n, 'posted', 29000000, 'fixture');
  v := public.record_founder_service_start(v_terms, p_started);
  perform pg_temp.as_user('');
  return v_terms;
end;
$$;

create function pg_temp.order_for(p_business uuid, p_code text) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.orders (business_id, customer_name, phone, delivery_date, delivery_method, total_price, order_code)
  values (p_business, 'Cliente Gate', '5491100000000', current_date + 1, 'pickup', 1000, p_code)
  returning id into v_id;
  return v_id;
end;
$$;

create function pg_temp.blocked(p_business uuid, p_code text) returns text language plpgsql as $$
declare v_detail text;
begin
  perform pg_temp.order_for(p_business, p_code);
  return null;
exception
  when sqlstate 'P0001' then
    get stacked diagnostics v_detail = pg_exception_detail;
    if sqlerrm <> 'service_access_blocked' then raise; end if;
    return v_detail;
end;
$$;

do $$
declare
  v_today date := commercial.ba_date(now());
  v jsonb;
  v_blocked int;
  v_order uuid;
  v_denied boolean;
begin
  perform pg_temp.business(1, true, v_today - 3);
  perform pg_temp.business(2, true, ((v_today - 10) - interval '2 months')::date);
  perform pg_temp.business(3, false, null);
  perform pg_temp.business(4, false, null);
  if commercial.business_service_access(pg_temp.id(1, 2), now())->>'state' <> 'suspended' then raise exception 'fixture suspended'; end if;

  -- Gate off by default: nothing is blocked and existing tenants keep working.
  if (select enforced_from from commercial.service_gate_config) is not null then raise exception 'gate must start off'; end if;
  if pg_temp.blocked(pg_temp.id(1, 3), 'GAAAA2') is not null then raise exception 'blocked while off'; end if;
  v_order := pg_temp.order_for(pg_temp.id(1, 2), 'GBBBB2');

  -- Only superadmin enables; only prospectively; only with a matching preflight count.
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606003');
  if public.set_service_gate(now(), 0)->>'commercial_error_code' <> 'forbidden' then raise exception 'finance enabled the gate'; end if;
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606002');
  if public.set_service_gate(now(), 0)->>'commercial_error_code' <> 'forbidden' then raise exception 'promoter enabled the gate'; end if;
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606001');
  if public.set_service_gate(now() - interval '1 hour', 0)->>'commercial_error_code' <> 'not_prospective' then raise exception 'retroactive'; end if;
  select count(*) into v_blocked from public.service_gate_preflight(now());
  if not exists (select 1 from public.service_gate_preflight(now()) where business_id = pg_temp.id(1, 3) and state = 'no_terms')
    or not exists (select 1 from public.service_gate_preflight(now()) where business_id = pg_temp.id(1, 2) and state = 'suspended')
    or exists (select 1 from public.service_gate_preflight(now()) where business_id = pg_temp.id(1, 1)) then
    raise exception 'preflight content';
  end if;
  v := public.set_service_gate(now(), v_blocked + 1);
  if v->>'commercial_error_code' <> 'preflight_mismatch' or (v->>'blocked')::int <> v_blocked then raise exception 'mismatch %', v; end if;
  if (select enforced_from from commercial.service_gate_config) is not null then raise exception 'mismatch enabled the gate'; end if;

  -- Exempt one legacy tenant before enabling.
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606003');
  if public.set_service_access_exemption(pg_temp.id(1, 4), 'tenant legacy autorizado', true)->>'commercial_error_code' <> 'forbidden' then
    raise exception 'finance exempted';
  end if;
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606001');
  v := public.set_service_access_exemption(pg_temp.id(1, 4), 'tenant legacy autorizado', true);
  if (v->>'ok')::boolean is not true then raise exception 'exempt %', v; end if;
  select count(*) into v_blocked from public.service_gate_preflight(now());
  v := public.set_service_gate(now(), v_blocked);
  if (v->>'ok')::boolean is not true then raise exception 'enable %', v; end if;
  perform pg_temp.as_user('');

  -- Enforced.
  if pg_temp.blocked(pg_temp.id(1, 1), 'GCCCC2') is not null then raise exception 'active blocked'; end if;
  if pg_temp.blocked(pg_temp.id(1, 2), 'GDDDD2') is distinct from 'suspended' then raise exception 'suspended allowed'; end if;
  if pg_temp.blocked(pg_temp.id(1, 3), 'GEEEE2') is distinct from 'no_terms' then raise exception 'no terms allowed'; end if;
  if pg_temp.blocked(pg_temp.id(1, 4), 'GFFFF2') is not null then raise exception 'exempt blocked'; end if;
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606001');
  perform public.set_service_access_exemption(pg_temp.id(1, 4), 'revocacion de prueba', false);
  perform pg_temp.as_user('');
  if pg_temp.blocked(pg_temp.id(1, 4), 'GHHHH2') is distinct from 'no_terms' then raise exception 'revoked exemption still allows'; end if;

  -- DT-07: an order accepted before the suspension can still be moved forward by its business.
  insert into public.profiles (id, business_id, role) values ('60606060-6060-4060-8060-606060606004', pg_temp.id(1, 2), 'owner');
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606004');
  execute 'set local role authenticated';
  v := public.transition_order_status(v_order, 'preparing');
  update public.orders set assigned_to = '60606060-6060-4060-8060-606060606004', assigned_at = now() where id = v_order;

  -- DT-06: a client session cannot change totals, status or identity directly.
  v_denied := false;
  begin
    update public.orders set total_price = 1 where id = v_order;
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'total_price editable'; end if;
  v_denied := false;
  begin
    update public.orders set status = 'completed' where id = v_order;
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'status editable'; end if;
  v_denied := false;
  begin
    update public.orders set business_id = '60606060-6060-4060-8060-000000000101' where id = v_order;
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'business editable'; end if;
  execute 'reset role';
  perform pg_temp.as_user('');

  if (select status from public.orders where id = v_order) <> 'preparing'
    or (select total_price from public.orders where id = v_order) <> 1000
    or (select assigned_to from public.orders where id = v_order) is distinct from '60606060-6060-4060-8060-606060606004' then
    raise exception 'order state %', (select row_to_json(o) from public.orders o where id = v_order);
  end if;

  -- Disabling is always allowed for superadmin.
  perform pg_temp.as_user('60606060-6060-4060-8060-606060606001');
  v := public.set_service_gate(null, null);
  if (v->>'ok')::boolean is not true then raise exception 'disable %', v; end if;
  perform pg_temp.as_user('');
  if pg_temp.blocked(pg_temp.id(1, 2), 'GJJJJ2') is not null then raise exception 'blocked after disable'; end if;
end;
$$;

do $$
begin
  if has_function_privilege('anon', 'public.set_service_gate(timestamptz, int)', 'execute')
    or has_function_privilege('anon', 'public.service_gate_preflight(timestamptz)', 'execute')
    or has_function_privilege('anon', 'public.set_service_access_exemption(uuid, text, boolean)', 'execute')
    or has_function_privilege('authenticated', 'commercial.set_service_gate(timestamptz, int)', 'execute')
    or has_table_privilege('authenticated', 'commercial.service_gate_config', 'update') then
    raise exception 'gate grants';
  end if;
end;
$$;

select 'phase10_service_gate: PASS' as result;
rollback;
