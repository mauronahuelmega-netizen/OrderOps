-- Phase 2C native settlement coverage. Runs transactionally on local Supabase.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business_a constant uuid := '61000000-0000-4000-8000-000000000001';
  v_business_b constant uuid := '61000000-0000-4000-8000-000000000002';
begin
  if exists (select 1 from public.order_financials)
     or exists (select 1 from public.finance_operations)
     or exists (select 1 from public.finance_funds) then
    raise exception 'clean reset contains financial domain data';
  end if;

  insert into public.businesses (id, name, slug, whatsapp_number)
  values
    (v_business_a, 'Phase 2C A', 'phase-2c-a', '5491100000401'),
    (v_business_b, 'Phase 2C B', 'phase-2c-b', '5491100000402');

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
    email, 'test-only', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  from (values
    ('66000000-0000-4000-8000-000000000001'::uuid, 'owner@phase2c.test'),
    ('66000000-0000-4000-8000-000000000002'::uuid, 'admin@phase2c.test'),
    ('66000000-0000-4000-8000-000000000003'::uuid, 'manager@phase2c.test'),
    ('66000000-0000-4000-8000-000000000004'::uuid, 'operator@phase2c.test'),
    ('66000000-0000-4000-8000-000000000005'::uuid, 'viewer@phase2c.test'),
    ('66000000-0000-4000-8000-000000000006'::uuid, 'owner-b@phase2c.test')
  ) as users(id, email);

  insert into public.profiles (id, business_id, role)
  values
    ('66000000-0000-4000-8000-000000000001', v_business_a, 'owner'),
    ('66000000-0000-4000-8000-000000000002', v_business_a, 'admin'),
    ('66000000-0000-4000-8000-000000000003', v_business_a, 'manager'),
    ('66000000-0000-4000-8000-000000000004', v_business_a, 'operator'),
    ('66000000-0000-4000-8000-000000000005', v_business_a, 'viewer'),
    ('66000000-0000-4000-8000-000000000006', v_business_b, 'owner');

  insert into public.finance_accounts (id, business_id, name, kind)
  values
    ('62000000-0000-4000-8000-000000000001', v_business_a, 'Phase 2C protection', 'mercado_pago'),
    ('62000000-0000-4000-8000-000000000002', v_business_a, 'Phase 2C cash', 'cash'),
    ('62000000-0000-4000-8000-000000000003', v_business_b, 'Phase 2C protection B', 'mercado_pago');

  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint
  ) values
    ('63000000-0000-4000-8000-000000000001', v_business_a, '62000000-0000-4000-8000-000000000001', 'Phase 2C weekly', 'business_operating', 'business'),
    ('63000000-0000-4000-8000-000000000002', v_business_a, '62000000-0000-4000-8000-000000000002', 'Phase 2C cash', 'business_operating', 'business'),
    ('63000000-0000-4000-8000-000000000003', v_business_b, '62000000-0000-4000-8000-000000000003', 'Phase 2C weekly B', 'business_operating', 'business');

  insert into public.business_finance_settings (
    business_id, protection_account_id, default_operating_fund_id
  ) values
    (v_business_a, '62000000-0000-4000-8000-000000000001', '63000000-0000-4000-8000-000000000001'),
    (v_business_b, '62000000-0000-4000-8000-000000000003', '63000000-0000-4000-8000-000000000003');

  insert into public.finance_categories (id, business_id, name, area, kind)
  values ('64000000-0000-4000-8000-000000000001', v_business_a, 'Phase 2C sales', 'business', 'income');

  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method,
    composition_status, total_price, order_code, status
  ) values
    ('65000000-0000-4000-8000-000000000001', v_business_a, 'Owner MP', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAA', 'pending'),
    ('65000000-0000-4000-8000-000000000002', v_business_a, 'Admin deposit', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAB', 'pending'),
    ('65000000-0000-4000-8000-000000000003', v_business_a, 'Manager historical', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAC', 'pending'),
    ('65000000-0000-4000-8000-000000000004', v_business_a, 'Operator cash', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAD', 'pending'),
    ('65000000-0000-4000-8000-000000000005', v_business_a, 'Partial', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAE', 'pending'),
    ('65000000-0000-4000-8000-000000000006', v_business_a, 'Unquoted', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAF', 'pending'),
    ('65000000-0000-4000-8000-000000000007', v_business_a, 'Cancelled', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAG', 'pending'),
    ('65000000-0000-4000-8000-000000000008', v_business_a, 'No financials', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAH', 'pending'),
    ('65000000-0000-4000-8000-000000000009', v_business_a, 'Bad protection', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAJ', 'pending'),
    ('65000000-0000-4000-8000-000000000010', v_business_a, 'Invalid default', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAK', 'pending'),
    ('65000000-0000-4000-8000-000000000011', v_business_a, 'Mixed', '5491100000401', current_date, 'pickup', 'itemized', 100, 'P2CAAN', 'pending'),
    ('65000000-0000-4000-8000-000000000012', v_business_b, 'Tenant B', '5491100000402', current_date, 'pickup', 'itemized', 100, 'P2CAAM', 'pending');

  if exists (select 1 from public.business_settings where finance_enabled) then
    raise exception 'finance_enabled did not remain false by default';
  end if;
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform public.settle_order_financials(
      '61000000-0000-4000-8000-000000000001',
      '65000000-0000-4000-8000-000000000001',
      gen_random_uuid(), 'no-auth'
    );
    raise exception 'unauthenticated settlement was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '66000000-0000-4000-8000-000000000001', true);
  begin
    perform public.settle_order_financials(
      '61000000-0000-4000-8000-000000000001',
      '65000000-0000-4000-8000-000000000001',
      gen_random_uuid(), 'finance-disabled'
    );
    raise exception 'finance-disabled settlement was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;
reset role;

update public.business_settings
set timezone = 'UTC', finance_enabled = true
where business_id = '61000000-0000-4000-8000-000000000001';

set local role authenticated;
do $$
declare
  v_business constant uuid := '61000000-0000-4000-8000-000000000001';
  v_weekly constant uuid := '63000000-0000-4000-8000-000000000001';
  v_category constant uuid := '64000000-0000-4000-8000-000000000001';
  v_order uuid;
begin
  perform set_config('request.jwt.claim.sub', '66000000-0000-4000-8000-000000000001', true);
  perform public.create_income(
    v_business, gen_random_uuid(), 'phase2c-operating-seed',
    jsonb_build_array(jsonb_build_object('fund_id', v_weekly, 'amount', 1000))
  );

  foreach v_order in array array[
    '65000000-0000-4000-8000-000000000001'::uuid,
    '65000000-0000-4000-8000-000000000002'::uuid,
    '65000000-0000-4000-8000-000000000003'::uuid,
    '65000000-0000-4000-8000-000000000004'::uuid,
    '65000000-0000-4000-8000-000000000005'::uuid,
    '65000000-0000-4000-8000-000000000007'::uuid,
    '65000000-0000-4000-8000-000000000009'::uuid,
    '65000000-0000-4000-8000-000000000010'::uuid,
    '65000000-0000-4000-8000-000000000011'::uuid
  ] loop
    perform public.initialize_order_financials(v_business, v_order, 'copy_total_price');
  end loop;
  perform public.initialize_order_financials(
    v_business, '65000000-0000-4000-8000-000000000006', 'unquoted'
  );

  perform public.record_order_payment(
    v_business, '65000000-0000-4000-8000-000000000001', gen_random_uuid(),
    'owner-mp-full', '[{"medium":"mercado_pago","amount":100}]'::jsonb
  );
  perform public.create_deposit(
    v_business, gen_random_uuid(), 'admin-deposit-full',
    '65000000-0000-4000-8000-000000000002', 100, v_weekly,
    null, v_category
  );
  perform public.create_historical_deposit(
    v_business, gen_random_uuid(), 'manager-historical-full',
    '65000000-0000-4000-8000-000000000003', 100
  );
  perform public.record_order_payment(
    v_business, '65000000-0000-4000-8000-000000000004', gen_random_uuid(),
    'operator-cash-full', '[{"medium":"cash","amount":100}]'::jsonb
  );
  perform public.record_order_payment(
    v_business, '65000000-0000-4000-8000-000000000005', gen_random_uuid(),
    'partial-payment', '[{"medium":"mercado_pago","amount":40}]'::jsonb
  );
  perform public.record_order_payment(
    v_business, '65000000-0000-4000-8000-000000000009', gen_random_uuid(),
    'bad-protection-full', '[{"medium":"mercado_pago","amount":100}]'::jsonb
  );
  perform public.record_order_payment(
    v_business, '65000000-0000-4000-8000-000000000010', gen_random_uuid(),
    'invalid-default-full', '[{"medium":"mercado_pago","amount":100}]'::jsonb
  );
  perform public.create_deposit(
    v_business, gen_random_uuid(), 'mixed-deposit',
    '65000000-0000-4000-8000-000000000011', 20, v_weekly,
    null, v_category
  );
  perform public.record_order_payment(
    v_business, '65000000-0000-4000-8000-000000000011', gen_random_uuid(),
    'mixed-cash', '[{"medium":"cash","amount":30}]'::jsonb
  );
  perform public.create_historical_deposit(
    v_business, gen_random_uuid(), 'mixed-historical',
    '65000000-0000-4000-8000-000000000011', 50
  );

  if exists (
    select 1 from public.order_financials
    where order_id in (
      '65000000-0000-4000-8000-000000000001',
      '65000000-0000-4000-8000-000000000002',
      '65000000-0000-4000-8000-000000000003',
      '65000000-0000-4000-8000-000000000004',
      '65000000-0000-4000-8000-000000000009',
      '65000000-0000-4000-8000-000000000010',
      '65000000-0000-4000-8000-000000000011'
    ) and financial_status <> 'open'
  ) then
    raise exception 'full payment auto-settled an order';
  end if;
end;
$$;
reset role;

-- Controlled inconsistent fixtures for atomic rejection tests.
update public.order_financials
set financial_status = 'cancelled'
where order_id = '65000000-0000-4000-8000-000000000007';

do $$
declare
  v_business constant uuid := '61000000-0000-4000-8000-000000000001';
  v_order constant uuid := '65000000-0000-4000-8000-000000000009';
  v_committed uuid;
  v_operation uuid;
  v_transaction uuid;
begin
  select id into strict v_committed
  from public.finance_funds
  where business_id = v_business and order_id = v_order
    and fund_type = 'committed' and active;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, created_by
  ) values (
    v_business, 'transfer', gen_random_uuid(), 'phase2c-controlled-drift',
    '66000000-0000-4000-8000-000000000001'
  ) returning id into v_operation;
  insert into public.finance_transactions (
    business_id, operation_id, status, order_id, created_by
  ) values (
    v_business, v_operation, 'posted', v_order,
    '66000000-0000-4000-8000-000000000001'
  ) returning id into v_transaction;
  insert into public.finance_transaction_entries (
    business_id, transaction_id, fund_id, direction, amount
  ) values
    (v_business, v_transaction, v_committed, 'out', 1),
    (v_business, v_transaction, '63000000-0000-4000-8000-000000000001', 'in', 1);
end;
$$;

set local role authenticated;
do $$
declare
  v_business constant uuid := '61000000-0000-4000-8000-000000000001';
  v_weekly constant uuid := '63000000-0000-4000-8000-000000000001';
  v_partial constant uuid := '65000000-0000-4000-8000-000000000005';
  v_bad constant uuid := '65000000-0000-4000-8000-000000000009';
  v_ops bigint;
  v_txs bigint;
  v_entries bigint;
  v_audits bigint;
  v_weekly_before numeric;
  v_committed_before numeric;
  v_invalid_order uuid;
begin
  perform set_config('request.jwt.claim.sub', '66000000-0000-4000-8000-000000000001', true);

  begin
    perform public.settle_order_financials(
      '61000000-0000-4000-8000-000000000002',
      '65000000-0000-4000-8000-000000000012', gen_random_uuid(), 'cross-tenant'
    );
    raise exception 'cross-tenant settlement was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '66000000-0000-4000-8000-000000000005', true);
  begin
    perform public.settle_order_financials(
      v_business, '65000000-0000-4000-8000-000000000001',
      gen_random_uuid(), 'viewer'
    );
    raise exception 'viewer settlement was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '66000000-0000-4000-8000-000000000001', true);
  foreach v_invalid_order in array array[
    '65000000-0000-4000-8000-000000000006'::uuid,
    '65000000-0000-4000-8000-000000000007'::uuid,
    '65000000-0000-4000-8000-000000000008'::uuid
  ] loop
    begin
      perform public.settle_order_financials(
        v_business, v_invalid_order, gen_random_uuid(), 'invalid-precondition'
      );
      raise exception 'invalid financial precondition was accepted' using errcode = 'ZX001';
    exception when sqlstate 'P0001' or sqlstate '22023' then null;
    end;
  end loop;

  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_txs from public.finance_transactions;
  select count(*) into v_entries from public.finance_transaction_entries;
  select count(*) into v_audits from public.finance_audit_events;
  v_weekly_before := public.finance_fund_balance(v_weekly);
  v_committed_before := public.order_committed_amount(v_partial);
  begin
    perform public.settle_order_financials(
      v_business, v_partial, gen_random_uuid(), 'partial'
    );
    raise exception 'partial order was settled' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_ops
     or (select count(*) from public.finance_transactions) <> v_txs
     or (select count(*) from public.finance_transaction_entries) <> v_entries
     or (select count(*) from public.finance_audit_events) <> v_audits
     or public.finance_fund_balance(v_weekly) <> v_weekly_before
     or public.order_committed_amount(v_partial) <> v_committed_before
     or (select financial_status from public.order_financials where order_id = v_partial) <> 'open' then
    raise exception 'partial settlement left effects';
  end if;

  select count(*) into v_ops from public.finance_operations;
  v_weekly_before := public.finance_fund_balance(v_weekly);
  v_committed_before := public.order_committed_amount(v_bad);
  begin
    perform public.settle_order_financials(
      v_business, v_bad, gen_random_uuid(), 'bad-protection'
    );
    raise exception 'inconsistent protection was settled' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_ops
     or public.finance_fund_balance(v_weekly) <> v_weekly_before
     or public.order_committed_amount(v_bad) <> v_committed_before
     or (select financial_status from public.order_financials where order_id = v_bad) <> 'open' then
    raise exception 'bad-protection rejection left effects';
  end if;
end;
$$;
reset role;

update public.business_finance_settings
set default_operating_fund_id = null
where business_id = '61000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$
declare
  v_business constant uuid := '61000000-0000-4000-8000-000000000001';
  v_order constant uuid := '65000000-0000-4000-8000-000000000010';
  v_ops bigint;
  v_committed numeric;
begin
  perform set_config('request.jwt.claim.sub', '66000000-0000-4000-8000-000000000001', true);
  select count(*) into v_ops from public.finance_operations;
  v_committed := public.order_committed_amount(v_order);
  begin
    perform public.settle_order_financials(
      v_business, v_order, gen_random_uuid(), 'missing-default'
    );
    raise exception 'settlement without default fund was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_ops
     or public.order_committed_amount(v_order) <> v_committed
     or (select financial_status from public.order_financials where order_id = v_order) <> 'open' then
    raise exception 'missing-default rejection left effects';
  end if;
end;
$$;
reset role;
update public.business_finance_settings
set default_operating_fund_id = '63000000-0000-4000-8000-000000000001'
where business_id = '61000000-0000-4000-8000-000000000001';

set local role authenticated;
do $$
declare
  v_business constant uuid := '61000000-0000-4000-8000-000000000001';
  v_weekly constant uuid := '63000000-0000-4000-8000-000000000001';
  v_cash constant uuid := '63000000-0000-4000-8000-000000000002';
  v_owner_order constant uuid := '65000000-0000-4000-8000-000000000001';
  v_request constant uuid := '67000000-0000-4000-8000-000000000001';
  v_result jsonb;
  v_retry jsonb;
  v_summary jsonb;
  v_weekly_before numeric;
  v_cash_before numeric;
  v_total_before numeric;
  v_total_after numeric;
  v_ops bigint;
  v_txs bigint;
  v_entries bigint;
  v_audits bigint;
  v_order uuid;
  v_actor uuid;
begin
  perform set_config('request.jwt.claim.sub', '66000000-0000-4000-8000-000000000001', true);

  -- Generic ledger RPCs still cannot access committed funds.
  select id into v_order
  from public.finance_funds
  where order_id = v_owner_order and fund_type = 'committed' and active;
  select count(*) into v_ops from public.finance_operations;
  begin
    perform public.create_income(
      v_business, gen_random_uuid(), 'generic-income-committed',
      jsonb_build_array(jsonb_build_object('fund_id', v_order, 'amount', 1))
    );
    raise exception 'generic income accessed committed' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.create_expense(
      v_business, gen_random_uuid(), 'generic-expense-committed',
      jsonb_build_array(jsonb_build_object('fund_id', v_order, 'amount', 1))
    );
    raise exception 'generic expense accessed committed' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.create_transfer(
      v_business, gen_random_uuid(), 'generic-transfer-committed',
      jsonb_build_array(
        jsonb_build_object('fund_id', v_order, 'direction', 'out', 'amount', 1),
        jsonb_build_object('fund_id', v_weekly, 'direction', 'in', 'amount', 1)
      )
    );
    raise exception 'generic transfer accessed committed' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_ops then
    raise exception 'generic bypass rejection left operations';
  end if;

  v_weekly_before := public.finance_fund_balance(v_weekly);
  v_cash_before := public.finance_fund_balance(v_cash);
  v_total_before := v_weekly_before + v_cash_before + public.order_committed_amount(v_owner_order);
  v_result := public.settle_order_financials(
    v_business, v_owner_order, v_request, 'owner-settlement'
  );
  v_total_after := public.finance_fund_balance(v_weekly)
    + public.finance_fund_balance(v_cash)
    + public.order_committed_amount(v_owner_order);
  v_summary := public.order_financial_summary(v_owner_order);

  if v_result->>'financial_status' <> 'settled'
     or (v_result->>'settled_at') is null
     or (v_result->>'settled_by')::uuid <> '66000000-0000-4000-8000-000000000001'
     or public.finance_fund_balance(v_weekly) <> v_weekly_before + 100
     or public.finance_fund_balance(v_cash) <> v_cash_before
     or public.order_paid_net(v_owner_order) <> 100
     or public.order_committed_amount(v_owner_order) <> 0
     or public.order_remaining(v_owner_order) <> 0
     or v_total_after <> v_total_before
     or (select status from public.orders where id = v_owner_order) <> 'pending'
     or v_summary->>'financial_status' <> 'settled'
     or (v_summary->>'settled_at') is null
     or (v_summary->>'settled_by')::uuid <> '66000000-0000-4000-8000-000000000001'
     or (v_summary->>'paid_net')::numeric <> 100
     or (v_summary->>'committed')::numeric <> 0
     or (v_summary->>'remaining')::numeric <> 0 then
    raise exception 'owner settlement contract failed';
  end if;

  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_txs from public.finance_transactions;
  select count(*) into v_entries from public.finance_transaction_entries;
  select count(*) into v_audits from public.finance_audit_events;
  v_retry := public.settle_order_financials(
    v_business, v_owner_order, v_request, 'owner-settlement'
  );
  if not (v_retry->>'idempotent')::boolean
     or v_retry->>'operation_id' <> v_result->>'operation_id'
     or (select count(*) from public.finance_operations) <> v_ops
     or (select count(*) from public.finance_transactions) <> v_txs
     or (select count(*) from public.finance_transaction_entries) <> v_entries
     or (select count(*) from public.finance_audit_events) <> v_audits
     or public.finance_fund_balance(v_weekly) <> v_weekly_before + 100 then
    raise exception 'settlement retry duplicated effects';
  end if;

  begin
    perform public.settle_order_financials(
      v_business, v_owner_order, v_request, 'different-payload'
    );
    raise exception 'settlement request id accepted different payload' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;
  begin
    perform public.settle_order_financials(
      v_business, v_owner_order, gen_random_uuid(), 'different-request'
    );
    raise exception 'settled order released twice' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  for v_order, v_actor in
    select order_id, actor_id
    from (values
      ('65000000-0000-4000-8000-000000000002'::uuid, '66000000-0000-4000-8000-000000000002'::uuid),
      ('65000000-0000-4000-8000-000000000003'::uuid, '66000000-0000-4000-8000-000000000003'::uuid),
      ('65000000-0000-4000-8000-000000000004'::uuid, '66000000-0000-4000-8000-000000000004'::uuid),
      ('65000000-0000-4000-8000-000000000011'::uuid, '66000000-0000-4000-8000-000000000001'::uuid)
    ) roles(order_id, actor_id)
  loop
    perform set_config('request.jwt.claim.sub', v_actor::text, true);
    v_cash_before := public.finance_fund_balance(v_cash);
    perform public.settle_order_financials(
      v_business, v_order, gen_random_uuid(), 'role-settlement'
    );
    if (select financial_status from public.order_financials where order_id = v_order) <> 'settled'
       or (select settled_by from public.order_financials where order_id = v_order) <> v_actor
       or public.order_paid_net(v_order) <> 100
       or public.order_committed_amount(v_order) <> 0
       or public.order_remaining(v_order) <> 0
       or public.finance_fund_balance(v_cash) <> v_cash_before then
      raise exception 'role settlement failed for actor %', v_actor;
    end if;
  end loop;

  if (select count(*) from public.finance_operations where operation_type = 'release_deposit') <> 5
     or (select count(*) from public.finance_audit_events where event_type = 'order_financials_settled') <> 5 then
    raise exception 'settlement operation/audit cardinality is wrong';
  end if;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform public.settle_order_financials(
      '61000000-0000-4000-8000-000000000001',
      '65000000-0000-4000-8000-000000000005',
      gen_random_uuid(), 'anon'
    );
    raise exception 'anon executed settlement' using errcode = 'ZX001';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

do $$
declare
  v_definition text;
begin
  select pg_get_functiondef(
    'public.settle_order_financials(uuid,uuid,uuid,text,text)'::regprocedure
  ) into v_definition;

  if position('private.lock_order_financials' in v_definition) = 0
     or position('private.lock_finance_funds' in v_definition) = 0
     or position('private.lock_order_financials' in v_definition)
        > position('insert into public.finance_operations' in v_definition)
     or position('private.lock_finance_funds' in v_definition)
        > position('insert into public.finance_operations' in v_definition) then
    raise exception 'settlement writes occur before required locks';
  end if;

  if not exists (
    select 1 from pg_proc p
    where p.oid = 'public.settle_order_financials(uuid,uuid,uuid,text,text)'::regprocedure
      and p.prosecdef
      and exists (
        select 1 from unnest(p.proconfig) setting
        where replace(setting, ' ', '') = 'search_path=pg_catalog,public'
      )
  ) then
    raise exception 'settlement lacks SECURITY DEFINER/fixed search_path';
  end if;

  if has_function_privilege(
       'anon', 'public.settle_order_financials(uuid,uuid,uuid,text,text)', 'EXECUTE'
     )
     or not has_function_privilege(
       'authenticated', 'public.settle_order_financials(uuid,uuid,uuid,text,text)', 'EXECUTE'
     ) then
    raise exception 'unexpected settlement execute grants';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('release_committed', 'release_deposit', 'move_committed_to_operating', 'reopen_order')
  ) then
    raise exception 'Phase 2C exposed standalone release/reopen';
  end if;

  if exists (
    select 1 from public.finance_operations
    where operation_type in ('void', 'correction')
  ) then
    raise exception 'Phase 2C introduced void/correction behavior';
  end if;
end;
$$;

select extensions.pass('Phase 2C atomic settlement, release, permissions, and regressions');
select * from extensions.finish();
rollback;
