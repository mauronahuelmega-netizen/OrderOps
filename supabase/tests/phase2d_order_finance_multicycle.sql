-- Phase 2D reopen and multi-cycle settlement coverage. Runs transactionally.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business_a constant uuid := '71000000-0000-4000-8000-000000000001';
  v_business_b constant uuid := '71000000-0000-4000-8000-000000000002';
begin
  if exists (select 1 from public.order_financials)
     or exists (select 1 from public.finance_operations)
     or exists (select 1 from public.finance_funds) then
    raise exception 'clean reset contains financial domain data';
  end if;

  insert into public.businesses (id, name, slug, whatsapp_number)
  values
    (v_business_a, 'Phase 2D A', 'phase-2d-a', '5491100000501'),
    (v_business_b, 'Phase 2D B', 'phase-2d-b', '5491100000502');

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
    email, 'test-only', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  from (values
    ('76000000-0000-4000-8000-000000000001'::uuid, 'owner@phase2d.test'),
    ('76000000-0000-4000-8000-000000000002'::uuid, 'admin@phase2d.test'),
    ('76000000-0000-4000-8000-000000000003'::uuid, 'manager@phase2d.test'),
    ('76000000-0000-4000-8000-000000000004'::uuid, 'operator@phase2d.test'),
    ('76000000-0000-4000-8000-000000000005'::uuid, 'viewer@phase2d.test'),
    ('76000000-0000-4000-8000-000000000006'::uuid, 'owner-b@phase2d.test')
  ) as users(id, email);

  insert into public.profiles (id, business_id, role)
  values
    ('76000000-0000-4000-8000-000000000001', v_business_a, 'owner'),
    ('76000000-0000-4000-8000-000000000002', v_business_a, 'admin'),
    ('76000000-0000-4000-8000-000000000003', v_business_a, 'manager'),
    ('76000000-0000-4000-8000-000000000004', v_business_a, 'operator'),
    ('76000000-0000-4000-8000-000000000005', v_business_a, 'viewer'),
    ('76000000-0000-4000-8000-000000000006', v_business_b, 'owner');

  insert into public.finance_accounts (id, business_id, name, kind)
  values
    ('72000000-0000-4000-8000-000000000001', v_business_a, 'Phase 2D protection', 'mercado_pago'),
    ('72000000-0000-4000-8000-000000000002', v_business_a, 'Phase 2D cash', 'cash'),
    ('72000000-0000-4000-8000-000000000003', v_business_b, 'Phase 2D protection B', 'mercado_pago');

  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint
  ) values
    ('73000000-0000-4000-8000-000000000001', v_business_a, '72000000-0000-4000-8000-000000000001', 'Phase 2D weekly', 'business_operating', 'business'),
    ('73000000-0000-4000-8000-000000000002', v_business_a, '72000000-0000-4000-8000-000000000002', 'Phase 2D cash', 'business_operating', 'business'),
    ('73000000-0000-4000-8000-000000000003', v_business_a, '72000000-0000-4000-8000-000000000001', 'Phase 2D secondary', 'business_operating', 'business'),
    ('73000000-0000-4000-8000-000000000004', v_business_b, '72000000-0000-4000-8000-000000000003', 'Phase 2D weekly B', 'business_operating', 'business');

  insert into public.business_finance_settings (
    business_id, protection_account_id, default_operating_fund_id
  ) values
    (v_business_a, '72000000-0000-4000-8000-000000000001', '73000000-0000-4000-8000-000000000001'),
    (v_business_b, '72000000-0000-4000-8000-000000000003', '73000000-0000-4000-8000-000000000004');

  insert into public.finance_categories (id, business_id, name, area, kind)
  values ('74000000-0000-4000-8000-000000000001', v_business_a, 'Phase 2D sales', 'business', 'income');

  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method,
    composition_status, total_price, order_code, status
  ) values
    ('75000000-0000-4000-8000-000000000001', v_business_a, 'Main', '5491100000501', current_date, 'pickup', 'itemized', 100, 'P2DAAA', 'pending'),
    ('75000000-0000-4000-8000-000000000002', v_business_a, 'Cash', '5491100000501', current_date, 'pickup', 'itemized', 100, 'P2DAAB', 'pending'),
    ('75000000-0000-4000-8000-000000000003', v_business_a, 'Historical', '5491100000501', current_date, 'pickup', 'itemized', 100, 'P2DAAC', 'pending'),
    ('75000000-0000-4000-8000-000000000004', v_business_a, 'Mixed', '5491100000501', current_date, 'pickup', 'itemized', 100, 'P2DAAD', 'pending'),
    ('75000000-0000-4000-8000-000000000005', v_business_a, 'Bad reopen', '5491100000501', current_date, 'pickup', 'itemized', 100, 'P2DAAE', 'pending'),
    ('75000000-0000-4000-8000-000000000006', v_business_a, 'Bad settle', '5491100000501', current_date, 'pickup', 'itemized', 100, 'P2DAAF', 'pending'),
    ('75000000-0000-4000-8000-000000000007', v_business_a, 'Open', '5491100000501', current_date, 'pickup', 'itemized', 100, 'P2DAAG', 'pending'),
    ('75000000-0000-4000-8000-000000000008', v_business_a, 'Cancelled', '5491100000501', current_date, 'pickup', 'itemized', 100, 'P2DAAH', 'pending'),
    ('75000000-0000-4000-8000-000000000009', v_business_b, 'Tenant B', '5491100000502', current_date, 'pickup', 'itemized', 100, 'P2DAAJ', 'pending');

  if exists (select 1 from public.business_settings where finance_enabled) then
    raise exception 'finance_enabled did not remain false by default';
  end if;
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform public.reopen_order_financials(
      '71000000-0000-4000-8000-000000000001',
      '75000000-0000-4000-8000-000000000001',
      gen_random_uuid(), 'no-auth'
    );
    raise exception 'unauthenticated reopen was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000001', true);
  begin
    perform public.reopen_order_financials(
      '71000000-0000-4000-8000-000000000001',
      '75000000-0000-4000-8000-000000000001',
      gen_random_uuid(), 'finance-disabled'
    );
    raise exception 'finance-disabled reopen was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;
reset role;

update public.business_settings
set timezone = 'UTC', finance_enabled = true
where business_id in (
  '71000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000002'
);

set local role authenticated;
do $$
declare
  v_business constant uuid := '71000000-0000-4000-8000-000000000001';
  v_weekly constant uuid := '73000000-0000-4000-8000-000000000001';
  v_secondary constant uuid := '73000000-0000-4000-8000-000000000003';
  v_order uuid;
begin
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000001', true);
  perform public.create_income(
    v_business, gen_random_uuid(), 'phase2d-operating-seed',
    jsonb_build_array(
      jsonb_build_object('fund_id', v_weekly, 'amount', 5000),
      jsonb_build_object('fund_id', v_secondary, 'amount', 100)
    )
  );

  foreach v_order in array array[
    '75000000-0000-4000-8000-000000000001'::uuid,
    '75000000-0000-4000-8000-000000000002'::uuid,
    '75000000-0000-4000-8000-000000000003'::uuid,
    '75000000-0000-4000-8000-000000000004'::uuid,
    '75000000-0000-4000-8000-000000000005'::uuid,
    '75000000-0000-4000-8000-000000000006'::uuid,
    '75000000-0000-4000-8000-000000000007'::uuid,
    '75000000-0000-4000-8000-000000000008'::uuid
  ] loop
    perform public.initialize_order_financials(v_business, v_order, 'copy_total_price');
  end loop;

  perform public.record_order_payment(v_business, '75000000-0000-4000-8000-000000000001', gen_random_uuid(), 'main-full', '[{"medium":"mercado_pago","amount":100}]');
  perform public.record_order_payment(v_business, '75000000-0000-4000-8000-000000000002', gen_random_uuid(), 'cash-full', '[{"medium":"cash","amount":100}]');
  perform public.create_historical_deposit(v_business, gen_random_uuid(), 'historical-full', '75000000-0000-4000-8000-000000000003', 100);
  perform public.record_order_payment(v_business, '75000000-0000-4000-8000-000000000004', gen_random_uuid(), 'mixed-full', '[{"medium":"mercado_pago","amount":100}]');
  perform public.record_order_payment(v_business, '75000000-0000-4000-8000-000000000005', gen_random_uuid(), 'bad-reopen-full', '[{"medium":"mercado_pago","amount":100}]');
  perform public.record_order_payment(v_business, '75000000-0000-4000-8000-000000000006', gen_random_uuid(), 'bad-settle-full', '[{"medium":"mercado_pago","amount":100}]');

  if public.order_released_amount('75000000-0000-4000-8000-000000000001') <> 0
     or public.order_protection_variance('75000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'pre-settlement released/variance helper failed';
  end if;

  foreach v_order in array array[
    '75000000-0000-4000-8000-000000000001'::uuid,
    '75000000-0000-4000-8000-000000000002'::uuid,
    '75000000-0000-4000-8000-000000000003'::uuid,
    '75000000-0000-4000-8000-000000000004'::uuid,
    '75000000-0000-4000-8000-000000000005'::uuid
  ] loop
    perform public.settle_order_financials(v_business, v_order, gen_random_uuid(), 'first-settlement');
    if public.order_paid_net(v_order) <> 100
       or public.order_released_amount(v_order) <> 100
       or public.order_committed_amount(v_order) <> 0
       or public.order_protection_variance(v_order) <> 0 then
      raise exception 'first-cycle settlement semantics changed for %', v_order;
    end if;
  end loop;

  perform public.create_transfer(
    v_business, gen_random_uuid(), 'unrelated-transfer',
    jsonb_build_array(
      jsonb_build_object('fund_id', v_weekly, 'direction', 'out', 'amount', 10),
      jsonb_build_object('fund_id', v_secondary, 'direction', 'in', 'amount', 10)
    )
  );
  if public.order_released_amount('75000000-0000-4000-8000-000000000001') <> 100 then
    raise exception 'generic transfer counted as released order money';
  end if;

  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000006', true);
  perform public.initialize_order_financials(
    '71000000-0000-4000-8000-000000000002',
    '75000000-0000-4000-8000-000000000009',
    'copy_total_price'
  );
end;
$$;
reset role;

-- Controlled ledger inconsistencies: neither may be reclassified as a release.
do $$
declare
  v_operation uuid;
  v_transaction uuid;
  v_committed uuid;
begin
  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    '71000000-0000-4000-8000-000000000001', 'order_payment', gen_random_uuid(),
    'controlled-bad-reopen', 'controlled bad reopen',
    '76000000-0000-4000-8000-000000000001'
  ) returning id into v_operation;
  insert into public.finance_transactions (
    business_id, operation_id, status, order_id, note, created_by
  ) values (
    '71000000-0000-4000-8000-000000000001', v_operation, 'posted',
    '75000000-0000-4000-8000-000000000005', 'unprotected collection',
    '76000000-0000-4000-8000-000000000001'
  ) returning id into v_transaction;
  insert into public.finance_transaction_entries (
    business_id, transaction_id, fund_id, direction, amount
  ) values (
    '71000000-0000-4000-8000-000000000001', v_transaction,
    '73000000-0000-4000-8000-000000000001', 'in', 1
  );

  select id into strict v_committed
  from public.finance_funds
  where business_id = '71000000-0000-4000-8000-000000000001'
    and order_id = '75000000-0000-4000-8000-000000000006'
    and fund_type = 'committed' and active;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    '71000000-0000-4000-8000-000000000001', 'transfer', gen_random_uuid(),
    'controlled-bad-settle', 'controlled protection loss',
    '76000000-0000-4000-8000-000000000001'
  ) returning id into v_operation;
  insert into public.finance_transactions (
    business_id, operation_id, status, order_id, note, created_by
  ) values (
    '71000000-0000-4000-8000-000000000001', v_operation, 'posted',
    '75000000-0000-4000-8000-000000000006', 'controlled protection loss',
    '76000000-0000-4000-8000-000000000001'
  ) returning id into v_transaction;
  insert into public.finance_transaction_entries (
    business_id, transaction_id, fund_id, direction, amount
  ) values
    ('71000000-0000-4000-8000-000000000001', v_transaction, v_committed, 'out', 1),
    ('71000000-0000-4000-8000-000000000001', v_transaction, '73000000-0000-4000-8000-000000000001', 'in', 1);

  update public.order_financials
  set financial_status = 'cancelled'
  where order_id = '75000000-0000-4000-8000-000000000008';
end;
$$;

set local role authenticated;
do $$
declare
  v_business constant uuid := '71000000-0000-4000-8000-000000000001';
  v_main constant uuid := '75000000-0000-4000-8000-000000000001';
  v_weekly constant uuid := '73000000-0000-4000-8000-000000000001';
  v_request uuid := gen_random_uuid();
  v_result jsonb;
  v_retry jsonb;
  v_summary jsonb;
  v_ops integer;
  v_txs integer;
  v_entries integer;
  v_audits integer;
  v_weekly_before numeric;
begin
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000005', true);
  begin
    perform public.reopen_order_financials(v_business, v_main, gen_random_uuid(), 'viewer');
    raise exception 'viewer reopened order finance' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000004', true);
  begin
    perform public.reopen_order_financials(v_business, v_main, gen_random_uuid(), 'operator');
    raise exception 'operator reopened order finance' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000006', true);
  begin
    perform public.reopen_order_financials(
      '71000000-0000-4000-8000-000000000002', v_main, gen_random_uuid(), 'cross-tenant'
    );
    raise exception 'cross-tenant reopen succeeded' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000001', true);
  begin
    perform public.reopen_order_financials(
      v_business, '75000000-0000-4000-8000-000000000007', gen_random_uuid(), 'open'
    );
    raise exception 'open order finance was reopened' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.reopen_order_financials(
      v_business, '75000000-0000-4000-8000-000000000008', gen_random_uuid(), 'cancelled'
    );
    raise exception 'cancelled order finance was reopened' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.reopen_order_financials(
      v_business, '75000000-0000-4000-8000-000000000005', gen_random_uuid(), 'bad-reopen'
    );
    raise exception 'inconsistent settled finance was reopened' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.settle_order_financials(
      v_business, '75000000-0000-4000-8000-000000000006', gen_random_uuid(), 'bad-settle'
    );
    raise exception 'protection variance was settled' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_txs from public.finance_transactions;
  select count(*) into v_entries from public.finance_transaction_entries;
  select count(*) into v_audits from public.finance_audit_events;
  v_weekly_before := public.finance_fund_balance(v_weekly);

  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000003', true);
  v_result := public.reopen_order_financials(v_business, v_main, v_request, 'manager-reopen');
  if v_result->>'financial_status' <> 'open'
     or (select financial_status from public.order_financials where order_id = v_main) <> 'open'
     or (select settled_at from public.order_financials where order_id = v_main) is not null
     or (select settled_by from public.order_financials where order_id = v_main) is not null
     or public.order_paid_net(v_main) <> 100
     or public.order_released_amount(v_main) <> 100
     or public.order_committed_amount(v_main) <> 0
     or public.order_protection_variance(v_main) <> 0
     or public.finance_fund_balance(v_weekly) <> v_weekly_before
     or (select status from public.orders where id = v_main) <> 'pending'
     or (select count(*) from public.finance_operations) <> v_ops + 1
     or (select count(*) from public.finance_transactions) <> v_txs
     or (select count(*) from public.finance_transaction_entries) <> v_entries
     or (select count(*) from public.finance_audit_events) <> v_audits + 1 then
    raise exception 'manager reopen changed money or lifecycle contract';
  end if;

  v_retry := public.reopen_order_financials(v_business, v_main, v_request, 'manager-reopen');
  if not (v_retry->>'idempotent')::boolean
     or v_retry->>'operation_id' <> v_result->>'operation_id'
     or (select count(*) from public.finance_operations) <> v_ops + 1
     or (select count(*) from public.finance_audit_events) <> v_audits + 1 then
    raise exception 'reopen retry duplicated effects';
  end if;
  begin
    perform public.reopen_order_financials(v_business, v_main, v_request, 'different-payload');
    raise exception 'reopen request accepted different payload' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;

  -- Operator may perform the normal zero-delta settlement, but it creates no ledger rows.
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000004', true);
  v_ops := (select count(*) from public.finance_operations);
  v_txs := (select count(*) from public.finance_transactions);
  v_entries := (select count(*) from public.finance_transaction_entries);
  v_audits := (select count(*) from public.finance_audit_events);
  v_request := gen_random_uuid();
  v_result := public.settle_order_financials(v_business, v_main, v_request, 'zero-delta');
  if v_result->>'financial_status' <> 'settled'
     or (v_result->>'transaction_id') is not null
     or (select operation_type from public.finance_operations where id = (v_result->>'operation_id')::uuid) <> 'order_financial_settlement'
     or (select count(*) from public.finance_operations) <> v_ops + 1
     or (select count(*) from public.finance_transactions) <> v_txs
     or (select count(*) from public.finance_transaction_entries) <> v_entries
     or (select count(*) from public.finance_audit_events) <> v_audits + 1
     or public.order_paid_net(v_main) <> 100
     or public.order_released_amount(v_main) <> 100
     or public.order_committed_amount(v_main) <> 0 then
    raise exception 'zero-delta settlement invented monetary ledger';
  end if;
  v_retry := public.settle_order_financials(v_business, v_main, v_request, 'zero-delta');
  if not (v_retry->>'idempotent')::boolean
     or v_retry->>'operation_id' <> v_result->>'operation_id'
     or (select count(*) from public.finance_operations) <> v_ops + 1
     or (select count(*) from public.finance_transactions) <> v_txs
     or (select count(*) from public.finance_transaction_entries) <> v_entries
     or (select count(*) from public.finance_audit_events) <> v_audits + 1 then
    raise exception 'zero-delta settlement retry duplicated effects';
  end if;
  begin
    perform public.settle_order_financials(v_business, v_main, v_request, 'different-zero-payload');
    raise exception 'zero-delta request accepted different payload' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;

  -- Admin and owner share the same sensitive reopen capability.
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000002', true);
  perform public.reopen_order_financials(v_business, v_main, gen_random_uuid(), 'admin-reopen');
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000001', true);
  perform public.settle_order_financials(v_business, v_main, gen_random_uuid(), 'admin-cycle-close');
  perform public.reopen_order_financials(v_business, v_main, gen_random_uuid(), 'owner-reopen');

  perform public.set_order_agreed_total(v_business, v_main, 130);
  if public.order_paid_net(v_main) <> 100
     or public.order_released_amount(v_main) <> 100
     or public.order_committed_amount(v_main) <> 0
     or public.order_remaining(v_main) <> 30 then
    raise exception 'agreed_total increase moved historical money';
  end if;

  perform public.record_order_payment(
    v_business, v_main, gen_random_uuid(), 'second-cycle-mp',
    '[{"medium":"mercado_pago","amount":30}]'
  );
  v_summary := public.order_financial_summary(v_main);
  if public.order_paid_net(v_main) <> 130
     or public.order_released_amount(v_main) <> 100
     or public.order_committed_amount(v_main) <> 30
     or public.order_protection_variance(v_main) <> 0
     or v_summary->>'financial_status' <> 'open'
     or (v_summary->>'paid_net')::numeric <> 130
     or (v_summary->>'released')::numeric <> 100
     or (v_summary->>'committed')::numeric <> 30
     or (v_summary->>'remaining')::numeric <> 0 then
    raise exception 'new non-cash payment did not protect only the delta';
  end if;

  v_weekly_before := public.finance_fund_balance(v_weekly);
  v_result := public.settle_order_financials(v_business, v_main, gen_random_uuid(), 'second-cycle-close');
  v_summary := public.order_financial_summary(v_main);
  if public.finance_fund_balance(v_weekly) <> v_weekly_before + 30
     or public.order_paid_net(v_main) <> 130
     or public.order_released_amount(v_main) <> 130
     or public.order_committed_amount(v_main) <> 0
     or public.order_protection_variance(v_main) <> 0
     or v_summary->>'financial_status' <> 'settled'
     or (v_summary->>'released')::numeric <> 130
     or (v_summary->>'protection_variance')::numeric <> 0
     or (select status from public.orders where id = v_main) <> 'pending' then
    raise exception 'second settlement did not release exactly current protection';
  end if;

  begin
    perform public.order_released_amount('75000000-0000-4000-8000-000000000009');
    raise exception 'cross-tenant released read succeeded' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;
reset role;

set local role authenticated;
do $$
declare
  v_business constant uuid := '71000000-0000-4000-8000-000000000001';
  v_weekly constant uuid := '73000000-0000-4000-8000-000000000001';
  v_cash constant uuid := '73000000-0000-4000-8000-000000000002';
  v_category constant uuid := '74000000-0000-4000-8000-000000000001';
  v_order uuid;
  v_weekly_before numeric;
  v_cash_before numeric;
begin
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000001', true);

  -- Cash in a second cycle: cash receipt counts once; coverage is not released history.
  v_order := '75000000-0000-4000-8000-000000000002';
  perform public.reopen_order_financials(v_business, v_order, gen_random_uuid(), 'cash-reopen');
  perform public.set_order_agreed_total(v_business, v_order, 130);
  v_weekly_before := public.finance_fund_balance(v_weekly);
  v_cash_before := public.finance_fund_balance(v_cash);
  perform public.record_order_payment(v_business, v_order, gen_random_uuid(), 'cash-second', '[{"medium":"cash","amount":30}]');
  if public.order_paid_net(v_order) <> 130
     or public.order_released_amount(v_order) <> 100
     or public.order_committed_amount(v_order) <> 30
     or public.finance_fund_balance(v_weekly) <> v_weekly_before - 30
     or public.finance_fund_balance(v_cash) <> v_cash_before + 30 then
    raise exception 'cash second cycle doubled or misclassified money';
  end if;
  perform public.settle_order_financials(v_business, v_order, gen_random_uuid(), 'cash-second-close');
  if public.order_released_amount(v_order) <> 130
     or public.finance_fund_balance(v_weekly) <> v_weekly_before
     or public.finance_fund_balance(v_cash) <> v_cash_before + 30 then
    raise exception 'cash second settlement released wrong amount';
  end if;

  -- Historical money remains an internal move throughout the second cycle.
  v_order := '75000000-0000-4000-8000-000000000003';
  perform public.reopen_order_financials(v_business, v_order, gen_random_uuid(), 'historical-reopen');
  perform public.set_order_agreed_total(v_business, v_order, 130);
  v_weekly_before := public.finance_fund_balance(v_weekly);
  perform public.create_historical_deposit(v_business, gen_random_uuid(), 'historical-second', v_order, 30);
  if public.order_paid_net(v_order) <> 130
     or public.order_released_amount(v_order) <> 100
     or public.order_committed_amount(v_order) <> 30
     or public.finance_fund_balance(v_weekly) <> v_weekly_before - 30 then
    raise exception 'historical second cycle created revenue or release';
  end if;
  perform public.settle_order_financials(v_business, v_order, gen_random_uuid(), 'historical-second-close');
  if public.order_released_amount(v_order) <> 130
     or public.finance_fund_balance(v_weekly) <> v_weekly_before then
    raise exception 'historical second settlement did not restore internal coverage';
  end if;

  -- Mixed second-cycle payments reconcile lifetime paid, released, and protected.
  v_order := '75000000-0000-4000-8000-000000000004';
  perform public.reopen_order_financials(v_business, v_order, gen_random_uuid(), 'mixed-reopen');
  perform public.set_order_agreed_total(v_business, v_order, 130);
  perform public.record_order_payment(v_business, v_order, gen_random_uuid(), 'mixed-mp', '[{"medium":"mercado_pago","amount":10}]');
  perform public.record_order_payment(v_business, v_order, gen_random_uuid(), 'mixed-cash', '[{"medium":"cash","amount":10}]');
  perform public.create_historical_deposit(v_business, gen_random_uuid(), 'mixed-historical', v_order, 10);
  if public.order_paid_net(v_order) <> 130
     or public.order_released_amount(v_order) <> 100
     or public.order_committed_amount(v_order) <> 30
     or public.order_protection_variance(v_order) <> 0 then
    raise exception 'mixed second cycle failed reconciliation invariant';
  end if;
  perform public.settle_order_financials(v_business, v_order, gen_random_uuid(), 'mixed-second-close');
  if public.order_released_amount(v_order) <> 130
     or public.order_committed_amount(v_order) <> 0
     or public.order_protection_variance(v_order) <> 0 then
    raise exception 'mixed second settlement failed';
  end if;
end;
$$;
reset role;

do $$
declare
  v_settle text := pg_get_functiondef(
    'public.settle_order_financials(uuid,uuid,uuid,text,text)'::regprocedure
  );
  v_reopen text := pg_get_functiondef(
    'public.reopen_order_financials(uuid,uuid,uuid,text,text)'::regprocedure
  );
begin
  if position('v_financials := private.lock_order_financials' in v_settle) = 0
     or position('v_financials := private.lock_order_financials' in v_settle)
        > position('if v_financials.agreed_total' in v_settle)
     or position('array_agg(distinct x order by x)' in v_settle) = 0 then
    raise exception 'settlement lock ordering contract regressed';
  end if;
  if position('for update' in lower(v_reopen)) = 0
     or position('for update' in lower(v_reopen))
        > position('if v_financials.financial_status' in lower(v_reopen)) then
    raise exception 'reopen does not lock before state validation';
  end if;
  if has_function_privilege('anon', 'public.reopen_order_financials(uuid,uuid,uuid,text,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.reopen_order_financials(uuid,uuid,uuid,text,text)', 'EXECUTE') then
    raise exception 'reopen grants are incorrect';
  end if;
  if exists (
    select 1 from public.finance_transaction_entries where amount <= 0
  ) then
    raise exception 'zero/negative ledger entry exists';
  end if;
end;
$$;

select extensions.pass('Phase 2D reopen and multi-cycle settlement invariants hold');
select * from extensions.finish();
rollback;
