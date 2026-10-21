-- Run against a disposable local database after all Phase 1A migrations.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business_a uuid := gen_random_uuid();
  v_business_b uuid := gen_random_uuid();
  v_order_itemized uuid := gen_random_uuid();
  v_order_legacy uuid := gen_random_uuid();
  v_account_a uuid := gen_random_uuid();
  v_category uuid := gen_random_uuid();
  v_product uuid := gen_random_uuid();
  v_owner uuid := gen_random_uuid();
  v_created_order uuid;
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values
    (v_business_a, 'Phase 1A A', 'phase-1a-a', '5491100000001'),
    (v_business_b, 'Phase 1A B', 'phase-1a-b', '5491100000002');

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_owner,
    'authenticated',
    'authenticated',
    'fixture-owner@phase1a.test',
    'test-only',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  insert into public.profiles (id, business_id, role)
  values (v_owner, v_business_a, 'owner');

  perform set_config('request.jwt.claim.sub', v_owner::text, true);

  if exists (
    select 1 from public.business_settings
    where business_id in (v_business_a, v_business_b)
      and (finance_enabled or timezone is not null)
  ) then
    raise exception 'new businesses must default to finance disabled and timezone null';
  end if;

  if exists (select 1 from public.order_financials)
     or exists (select 1 from public.finance_operations)
     or exists (select 1 from public.finance_transactions)
     or exists (select 1 from public.finance_transaction_entries) then
    raise exception 'Phase 1A finance structures must start empty';
  end if;

  begin
    update public.business_settings
    set finance_enabled = true
    where business_id = v_business_a;
    raise exception 'finance enabled without timezone was accepted';
  exception when check_violation then null;
  end;

  insert into public.categories (id, business_id, name)
  values (v_category, v_business_a, 'Phase 1A category');

  insert into public.products (id, business_id, category_id, name, price)
  values (v_product, v_business_a, v_category, 'Phase 1A product', 125);

  begin
    perform public.create_order(
      v_business_a, 'Empty order', '5491100000001', current_date,
      'pickup', null, null, '[]'::jsonb
    );
    raise exception 'create_order accepted an empty item list';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'items must not be empty' then
      raise;
    end if;
  end;

  v_created_order := public.create_order(
    v_business_a,
    'Created order',
    '5491100000001',
    current_date,
    'pickup',
    null,
    null,
    jsonb_build_array(jsonb_build_object(
      'product_id', v_product,
      'quantity', 2,
      'item_kind', 'product',
      'client_line_id', 'phase-1a-line'
    ))
  );

  if not exists (
    select 1
    from public.orders o
    where o.id = v_created_order
      and o.composition_status = 'itemized'
      and o.total_price = 250
      and exists (
        select 1 from public.order_items oi
        where oi.order_id = o.id and oi.quantity = 2 and oi.unit_price = 125
      )
  ) then
    raise exception 'create_order did not preserve itemized calculated-total behavior';
  end if;

  begin
    update public.business_settings
    set timezone = 'Not/A_Real_Zone'
    where business_id = v_business_a;
    raise exception 'invalid timezone was accepted';
  exception when check_violation then null;
  end;

  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date,
    delivery_method, total_price, order_code
  ) values (
    v_order_itemized, v_business_a, 'Itemized', '5491100000001', current_date,
    'pickup', 100, 'PAAABC'
  );

  if not exists (
    select 1 from public.orders
    where id = v_order_itemized and composition_status = 'itemized' and total_price = 100
  ) then
    raise exception 'itemized defaults were not preserved';
  end if;

  begin
    update public.orders set total_price = null where id = v_order_itemized;
    raise exception 'itemized order accepted null total';
  exception when check_violation then null;
  end;

  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date,
    delivery_method, composition_status, total_price, order_code
  ) values (
    v_order_legacy, v_business_a, 'Legacy', '5491100000001', current_date,
    'pickup', 'legacy_unknown', null, 'PAAABD'
  );

  begin
    update public.orders set total_price = 100 where id = v_order_legacy;
    raise exception 'legacy_unknown order accepted a technical total';
  exception when check_violation then null;
  end;

  insert into public.order_financials (order_id, business_id, agreed_total)
  values (v_order_legacy, v_business_a, null);

  begin
    update public.order_financials set agreed_total = 0 where order_id = v_order_legacy;
    raise exception 'zero agreed_total was accepted';
  exception when check_violation then null;
  end;

  insert into public.finance_accounts (id, business_id, name)
  values (v_account_a, v_business_a, 'Account A');

  begin
    insert into public.finance_funds (
      business_id, account_id, name, fund_type, area_hint
    ) values (
      v_business_b, v_account_a, 'Cross tenant', 'family', 'family'
    );
    raise exception 'cross-tenant account/fund relationship was accepted';
  exception when foreign_key_violation then null;
  end;
end;
$$;

-- Guard and RLS matrix. Fixed UUIDs keep auth claims deterministic.
insert into public.businesses (id, name, slug, whatsapp_number)
values
  ('10000000-0000-4000-8000-000000000001', 'Security A', 'phase-1a-security-a', '5491100000011'),
  ('10000000-0000-4000-8000-000000000002', 'Security B', 'phase-1a-security-b', '5491100000012');

update public.business_settings
set timezone = 'UTC'
where business_id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  id,
  'authenticated',
  'authenticated',
  email,
  'test-only',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, 'owner@phase1a.test'),
  ('20000000-0000-4000-8000-000000000002'::uuid, 'admin@phase1a.test'),
  ('20000000-0000-4000-8000-000000000003'::uuid, 'manager@phase1a.test'),
  ('20000000-0000-4000-8000-000000000004'::uuid, 'operator@phase1a.test'),
  ('20000000-0000-4000-8000-000000000005'::uuid, 'viewer@phase1a.test')
) as users(id, email);

insert into public.profiles (id, business_id, role)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'admin'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'manager'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'operator'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'viewer');

insert into public.finance_accounts (id, business_id, name)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Visible A'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Hidden B');

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);

do $$
begin
  perform private.require_finance_permission(
    '10000000-0000-4000-8000-000000000001', 'read'
  );

  begin
    perform private.require_finance_permission(
      '10000000-0000-4000-8000-000000000001', 'operate'
    );
    raise exception 'disabled finance allowed a write permission';
  exception when sqlstate '42501' then null;
  end;

  if (select count(*) from public.finance_accounts) <> 1 then
    raise exception 'tenant-scoped finance read leaked another business';
  end if;

  begin
    insert into public.finance_accounts (business_id, name)
    values ('10000000-0000-4000-8000-000000000001', 'Direct write');
    raise exception 'authenticated direct finance write was accepted';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.finance_audit_events (business_id, event_type, entity_type)
    values ('10000000-0000-4000-8000-000000000001', 'direct', 'test');
    raise exception 'authenticated direct audit write was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
update public.business_settings
set finance_enabled = true
where business_id = '10000000-0000-4000-8000-000000000001';
set local role authenticated;

do $$
declare
  v_business uuid := '10000000-0000-4000-8000-000000000001';
begin
  perform set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
  perform private.require_finance_permission(v_business, 'admin');
  perform private.require_finance_permission(v_business, 'correct');

  perform set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
  perform private.require_finance_permission(v_business, 'admin');
  perform private.require_finance_permission(v_business, 'correct');

  perform set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000003', true);
  perform private.require_finance_permission(v_business, 'operate');
  perform private.require_finance_permission(v_business, 'reconcile');
  perform private.require_finance_permission(v_business, 'correct');
  begin
    perform private.require_finance_permission(v_business, 'admin');
    raise exception 'manager received finance admin permission';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000004', true);
  perform private.require_finance_permission(v_business, 'operate');
  begin
    perform private.require_finance_permission(v_business, 'reconcile');
    raise exception 'operator received reconciliation permission';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000005', true);
  perform private.require_finance_permission(v_business, 'read');
  begin
    perform private.require_finance_permission(v_business, 'operate');
    raise exception 'viewer received write permission';
  exception when sqlstate '42501' then null;
  end;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform count(*) from public.finance_accounts;
    raise exception 'anon finance read was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

select extensions.pass('Phase 1A schema, order contract, tenant FKs, guards, and RLS contract');
select * from extensions.finish();
rollback;
