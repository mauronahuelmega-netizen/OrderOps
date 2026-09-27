-- Phase 2B order-finance protection coverage. Runs transactionally on local Supabase.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business_a constant uuid := '51000000-0000-4000-8000-000000000001';
  v_business_b constant uuid := '51000000-0000-4000-8000-000000000002';
begin
  if exists (select 1 from public.order_financials)
     or exists (select 1 from public.finance_operations)
     or exists (select 1 from public.finance_funds) then
    raise exception 'clean reset contains financial domain data';
  end if;

  insert into public.businesses (id, name, slug, whatsapp_number)
  values
    (v_business_a, 'Phase 2B A', 'phase-2b-a', '5491100000301'),
    (v_business_b, 'Phase 2B B', 'phase-2b-b', '5491100000302');

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
    email, 'test-only', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  from (values
    ('56000000-0000-4000-8000-000000000001'::uuid, 'owner@phase2b.test'),
    ('56000000-0000-4000-8000-000000000002'::uuid, 'admin@phase2b.test'),
    ('56000000-0000-4000-8000-000000000003'::uuid, 'manager@phase2b.test'),
    ('56000000-0000-4000-8000-000000000004'::uuid, 'operator@phase2b.test'),
    ('56000000-0000-4000-8000-000000000005'::uuid, 'viewer@phase2b.test'),
    ('56000000-0000-4000-8000-000000000006'::uuid, 'owner-b@phase2b.test')
  ) as users(id, email);

  insert into public.profiles (id, business_id, role)
  values
    ('56000000-0000-4000-8000-000000000001', v_business_a, 'owner'),
    ('56000000-0000-4000-8000-000000000002', v_business_a, 'admin'),
    ('56000000-0000-4000-8000-000000000003', v_business_a, 'manager'),
    ('56000000-0000-4000-8000-000000000004', v_business_a, 'operator'),
    ('56000000-0000-4000-8000-000000000005', v_business_a, 'viewer'),
    ('56000000-0000-4000-8000-000000000006', v_business_b, 'owner');

  insert into public.finance_accounts (id, business_id, name, kind)
  values
    ('52000000-0000-4000-8000-000000000001', v_business_a, 'Phase 2B protection', 'mercado_pago'),
    ('52000000-0000-4000-8000-000000000002', v_business_a, 'Phase 2B cash', 'cash'),
    ('52000000-0000-4000-8000-000000000003', v_business_b, 'Phase 2B protection B', 'mercado_pago');

  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint
  ) values
    (
      '53000000-0000-4000-8000-000000000001', v_business_a,
      '52000000-0000-4000-8000-000000000001', 'Phase 2B weekly',
      'business_operating', 'business'
    ),
    (
      '53000000-0000-4000-8000-000000000002', v_business_a,
      '52000000-0000-4000-8000-000000000002', 'Phase 2B cash',
      'business_operating', 'business'
    ),
    (
      '53000000-0000-4000-8000-000000000003', v_business_b,
      '52000000-0000-4000-8000-000000000003', 'Phase 2B weekly B',
      'business_operating', 'business'
    );

  insert into public.business_finance_settings (
    business_id, protection_account_id, default_operating_fund_id
  ) values
    (
      v_business_a, '52000000-0000-4000-8000-000000000001',
      '53000000-0000-4000-8000-000000000001'
    ),
    (
      v_business_b, '52000000-0000-4000-8000-000000000003',
      '53000000-0000-4000-8000-000000000003'
    );

  insert into public.finance_categories (id, business_id, name, area, kind)
  values (
    '54000000-0000-4000-8000-000000000001', v_business_a,
    'Phase 2B sales', 'business', 'income'
  );

  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method,
    composition_status, total_price, order_code, status
  ) values
    ('55000000-0000-4000-8000-000000000001', v_business_a, 'Deposit', '5491100000301', current_date, 'pickup', 'itemized', 100, 'P2BAAA', 'pending'),
    ('55000000-0000-4000-8000-000000000002', v_business_a, 'Unquoted', '5491100000301', current_date, 'pickup', 'itemized', 200, 'P2BAAB', 'pending'),
    ('55000000-0000-4000-8000-000000000003', v_business_a, 'Legacy', '5491100000301', current_date, 'pickup', 'legacy_unknown', null, 'P2BAAC', 'pending'),
    ('55000000-0000-4000-8000-000000000004', v_business_a, 'Cash', '5491100000301', current_date, 'pickup', 'itemized', 100, 'P2BAAD', 'pending'),
    ('55000000-0000-4000-8000-000000000005', v_business_a, 'Historical', '5491100000301', current_date, 'pickup', 'itemized', 100, 'P2BAAE', 'pending'),
    ('55000000-0000-4000-8000-000000000006', v_business_a, 'Operator', '5491100000301', current_date, 'pickup', 'itemized', 50, 'P2BAAF', 'pending'),
    ('55000000-0000-4000-8000-000000000007', v_business_a, 'Closed finance', '5491100000301', current_date, 'pickup', 'itemized', 50, 'P2BAAG', 'pending'),
    ('55000000-0000-4000-8000-000000000008', v_business_a, 'Insufficient cash', '5491100000301', current_date, 'pickup', 'itemized', 1000, 'P2BAAH', 'pending'),
    ('55000000-0000-4000-8000-000000000009', v_business_b, 'Tenant B', '5491100000302', current_date, 'pickup', 'itemized', 100, 'P2BAAJ', 'pending');

  if exists (select 1 from public.order_financials) then
    raise exception 'orders created order_financials automatically';
  end if;
  if exists (select 1 from public.business_settings where finance_enabled) then
    raise exception 'finance_enabled did not remain false by default';
  end if;
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform public.initialize_order_financials(
      '51000000-0000-4000-8000-000000000001',
      '55000000-0000-4000-8000-000000000001',
      'copy_total_price'
    );
    raise exception 'unauthenticated initialization was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000001', true);
  begin
    perform public.initialize_order_financials(
      '51000000-0000-4000-8000-000000000001',
      '55000000-0000-4000-8000-000000000001',
      'copy_total_price'
    );
    raise exception 'finance-disabled initialization was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;
reset role;

update public.business_settings
set timezone = 'UTC', finance_enabled = true
where business_id = '51000000-0000-4000-8000-000000000001';

set local role authenticated;
do $$
declare
  v_business constant uuid := '51000000-0000-4000-8000-000000000001';
  v_order_deposit constant uuid := '55000000-0000-4000-8000-000000000001';
  v_order_unquoted constant uuid := '55000000-0000-4000-8000-000000000002';
  v_order_legacy constant uuid := '55000000-0000-4000-8000-000000000003';
  v_order_cash constant uuid := '55000000-0000-4000-8000-000000000004';
  v_order_historical constant uuid := '55000000-0000-4000-8000-000000000005';
  v_order_operator constant uuid := '55000000-0000-4000-8000-000000000006';
  v_order_closed constant uuid := '55000000-0000-4000-8000-000000000007';
  v_order_insufficient constant uuid := '55000000-0000-4000-8000-000000000008';
  v_weekly constant uuid := '53000000-0000-4000-8000-000000000001';
  v_cash constant uuid := '53000000-0000-4000-8000-000000000002';
  v_audits bigint;
  v_operations bigint;
  v_result jsonb;
begin
  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000001', true);
  v_result := public.initialize_order_financials(v_business, v_order_deposit, 'copy_total_price');
  if (v_result->>'agreed_total')::numeric <> 100
     or v_result->>'financial_status' <> 'open'
     or (v_result->>'idempotent')::boolean then
    raise exception 'itemized copy initialization failed';
  end if;

  select count(*) into v_audits from public.finance_audit_events;
  v_result := public.initialize_order_financials(v_business, v_order_deposit, 'unquoted');
  if not (v_result->>'idempotent')::boolean
     or (v_result->>'agreed_total')::numeric <> 100
     or (select count(*) from public.finance_audit_events) <> v_audits then
    raise exception 'repeated initialization overwrote or duplicated state';
  end if;

  begin
    perform public.initialize_order_financials(
      v_business, v_order_legacy, 'copy_total_price'
    );
    raise exception 'legacy order copied a technical total' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000004', true);
  begin
    perform public.initialize_order_financials(v_business, v_order_unquoted, 'unquoted');
    raise exception 'operator initialized order finance' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000005', true);
  begin
    perform public.initialize_order_financials(v_business, v_order_unquoted, 'unquoted');
    raise exception 'viewer initialized order finance' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000001', true);
  begin
    perform public.initialize_order_financials(
      '51000000-0000-4000-8000-000000000002',
      '55000000-0000-4000-8000-000000000009',
      'copy_total_price'
    );
    raise exception 'cross-tenant initialization was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000002', true);
  perform public.initialize_order_financials(v_business, v_order_unquoted, 'unquoted');

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000003', true);
  perform public.initialize_order_financials(v_business, v_order_legacy, 'unquoted');
  perform public.initialize_order_financials(v_business, v_order_cash, 'copy_total_price');

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000001', true);
  perform public.initialize_order_financials(v_business, v_order_historical, 'copy_total_price');
  perform public.initialize_order_financials(v_business, v_order_operator, 'copy_total_price');
  perform public.initialize_order_financials(v_business, v_order_closed, 'copy_total_price');
  perform public.initialize_order_financials(v_business, v_order_insufficient, 'copy_total_price');

  if (select agreed_total from public.order_financials where order_id = v_order_legacy) is not null
     or public.order_remaining(v_order_legacy) is not null then
    raise exception 'unquoted order did not preserve null contractual balance';
  end if;

  select count(*) into v_operations from public.finance_operations;
  v_result := public.set_order_agreed_total(v_business, v_order_unquoted, null);
  if (v_result->>'changed')::boolean then
    raise exception 'same null agreed_total was not a no-op';
  end if;
  begin
    perform public.set_order_agreed_total(v_business, v_order_unquoted, 0);
    raise exception 'zero agreed_total was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.set_order_agreed_total(v_business, v_order_unquoted, -1);
    raise exception 'negative agreed_total was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.set_order_agreed_total(v_business, v_order_unquoted, 'NaN'::numeric);
    raise exception 'NaN agreed_total was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000004', true);
  begin
    perform public.set_order_agreed_total(v_business, v_order_unquoted, 120);
    raise exception 'operator changed agreed_total' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000003', true);
  perform public.set_order_agreed_total(v_business, v_order_unquoted, 120);

  begin
    perform public.create_deposit(
      v_business, gen_random_uuid(), 'no-contract', v_order_legacy,
      1, v_weekly
    );
    raise exception 'payment without agreed_total was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'agreed_total_required' then raise; end if;
  end;

  perform public.set_order_agreed_total(v_business, v_order_legacy, 100);
  if (select total_price from public.orders where id = v_order_unquoted) <> 200
     or (select count(*) from public.finance_operations) <> v_operations then
    raise exception 'agreed_total mutation changed technical total or ledger';
  end if;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000001', true);
  perform public.create_income(
    v_business, gen_random_uuid(), 'phase2b-operating-seed',
    jsonb_build_array(jsonb_build_object('fund_id', v_weekly, 'amount', 1000))
  );
  if (select agreed_total from public.order_financials where order_id = v_order_legacy) <> 100 then
    raise exception 'legacy agreed_total setup failed';
  end if;
end;
$$;

-- Mark one fixture financially closed without introducing a public transition RPC.
reset role;
update public.order_financials
set financial_status = 'settled'
where order_id = '55000000-0000-4000-8000-000000000007';
set local role authenticated;

do $$
declare
  v_business constant uuid := '51000000-0000-4000-8000-000000000001';
  v_order_deposit constant uuid := '55000000-0000-4000-8000-000000000001';
  v_order_legacy constant uuid := '55000000-0000-4000-8000-000000000003';
  v_order_cash constant uuid := '55000000-0000-4000-8000-000000000004';
  v_order_historical constant uuid := '55000000-0000-4000-8000-000000000005';
  v_order_operator constant uuid := '55000000-0000-4000-8000-000000000006';
  v_order_closed constant uuid := '55000000-0000-4000-8000-000000000007';
  v_order_insufficient constant uuid := '55000000-0000-4000-8000-000000000008';
  v_weekly constant uuid := '53000000-0000-4000-8000-000000000001';
  v_cash constant uuid := '53000000-0000-4000-8000-000000000002';
  v_category constant uuid := '54000000-0000-4000-8000-000000000001';
  v_request uuid;
  v_result jsonb;
  v_replay jsonb;
  v_committed uuid;
  v_ops bigint;
  v_txs bigint;
  v_entries bigint;
  v_audits bigint;
  v_funds bigint;
  v_weekly_before numeric;
  v_cash_before numeric;
  v_total_before numeric;
  v_total_after numeric;
begin
  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000001', true);

  foreach v_result in array array[
    jsonb_build_object('amount', 0),
    jsonb_build_object('amount', -1)
  ]
  loop
    begin
      perform public.create_deposit(
        v_business, gen_random_uuid(), 'bad-deposit-' || (v_result->>'amount'),
        v_order_legacy, (v_result->>'amount')::numeric, v_weekly
      );
      raise exception 'non-positive deposit was accepted' using errcode = 'ZX001';
    exception when sqlstate '22023' then null;
    end;
  end loop;

  begin
    perform public.record_order_payment(
      v_business, v_order_legacy, gen_random_uuid(), 'bad-payment-zero',
      '[{"medium":"cash","amount":0}]'::jsonb
    );
    raise exception 'zero order payment was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.record_order_payment(
      '51000000-0000-4000-8000-000000000002',
      '55000000-0000-4000-8000-000000000009',
      gen_random_uuid(), 'cross-tenant-payment',
      '[{"medium":"mercado_pago","amount":1}]'::jsonb
    );
    raise exception 'cross-tenant payment was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  begin
    perform public.create_deposit(
      v_business, gen_random_uuid(), 'closed', v_order_closed, 1, v_weekly
    );
    raise exception 'closed order finance accepted a deposit' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  v_request := gen_random_uuid();
  v_result := public.create_deposit(
    v_business, v_request, 'deposit-20', v_order_deposit, 20, v_weekly,
    null, v_category
  );
  v_committed := (v_result->>'committed_fund_id')::uuid;
  if public.order_paid_net(v_order_deposit) <> 20
     or public.order_committed_amount(v_order_deposit) <> 20
     or public.order_remaining(v_order_deposit) <> 80
     or public.finance_fund_balance(v_weekly) <> 1000
     or (select count(*) from public.finance_funds where order_id = v_order_deposit and fund_type = 'committed' and active) <> 1 then
    raise exception 'direct deposit did not protect exactly once';
  end if;

  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_txs from public.finance_transactions;
  select count(*) into v_entries from public.finance_transaction_entries;
  select count(*) into v_audits from public.finance_audit_events;
  v_replay := public.create_deposit(
    v_business, v_request, 'deposit-20', v_order_deposit, 20, v_weekly,
    null, v_category
  );
  if not (v_replay->>'idempotent')::boolean
     or v_replay->>'operation_id' <> v_result->>'operation_id'
     or (select count(*) from public.finance_operations) <> v_ops
     or (select count(*) from public.finance_transactions) <> v_txs
     or (select count(*) from public.finance_transaction_entries) <> v_entries
     or (select count(*) from public.finance_audit_events) <> v_audits
     or public.order_paid_net(v_order_deposit) <> 20 then
    raise exception 'deposit retry duplicated effects';
  end if;

  begin
    perform public.create_deposit(
      v_business, v_request, 'deposit-20', v_order_deposit, 21, v_weekly,
      null, v_category
    );
    raise exception 'same request with different deposit payload was accepted' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;

  perform public.create_deposit(
    v_business, gen_random_uuid(), 'deposit-full', v_order_deposit, 80, v_weekly,
    null, v_category
  );
  if public.order_paid_net(v_order_deposit) <> 100
     or public.order_committed_amount(v_order_deposit) <> 100
     or public.order_remaining(v_order_deposit) <> 0
     or (select financial_status from public.order_financials where order_id = v_order_deposit) <> 'open'
     or (select status from public.orders where id = v_order_deposit) <> 'pending' then
    raise exception 'fully paid order did not remain operationally and financially open';
  end if;
  if public.order_financial_summary(v_order_deposit) <> jsonb_build_object(
    'order_id', v_order_deposit,
    'agreed_total', 100,
    'financial_status', 'open',
    'settled_at', null,
    'settled_by', null,
    'paid_net', 100,
    'released', 0,
    'committed', 100,
    'remaining', 0,
    'protection_variance', 0
  ) then
    raise exception 'order financial summary is not exact';
  end if;

  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_funds from public.finance_funds;
  begin
    perform public.create_deposit(
      v_business, gen_random_uuid(), 'deposit-overpay', v_order_deposit, 1, v_weekly
    );
    raise exception 'deposit overpay was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_ops
     or (select count(*) from public.finance_funds) <> v_funds
     or public.order_paid_net(v_order_deposit) <> 100 then
    raise exception 'deposit overpay left partial effects';
  end if;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000004', true);
  perform public.create_deposit(
    v_business, gen_random_uuid(), 'operator-deposit', v_order_operator, 10, v_weekly
  );
  if public.order_paid_net(v_order_operator) <> 10 then
    raise exception 'operator could not perform normal collection';
  end if;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000005', true);
  begin
    perform public.record_order_payment(
      v_business, v_order_legacy, gen_random_uuid(), 'viewer-payment',
      '[{"medium":"mercado_pago","amount":1}]'::jsonb
    );
    raise exception 'viewer recorded a payment' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000004', true);
  perform public.record_order_payment(
    v_business, v_order_legacy, gen_random_uuid(), 'operator-payment',
    '[{"medium":"mercado_pago","amount":10}]'::jsonb
  );
  if public.order_paid_net(v_order_legacy) <> 10
     or public.order_committed_amount(v_order_legacy) <> 10 then
    raise exception 'operator order payment was not protected';
  end if;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000001', true);
  v_weekly_before := public.finance_fund_balance(v_weekly);
  v_cash_before := public.finance_fund_balance(v_cash);
  v_request := gen_random_uuid();
  v_result := public.record_order_payment(
    v_business, v_order_cash, v_request, 'mixed-payment',
    '[{"medium":"mercado_pago","amount":20},{"medium":"cash","amount":30}]'::jsonb
  );
  if public.finance_fund_balance(v_cash) <> v_cash_before + 30
     or public.finance_fund_balance(v_weekly) <> v_weekly_before - 30
     or public.order_committed_amount(v_order_cash) <> 50
     or public.order_paid_net(v_order_cash) <> 50
     or public.order_remaining(v_order_cash) <> 50 then
    raise exception 'cash/non-cash payment semantics diverged or doubled paid_net';
  end if;

  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_audits from public.finance_audit_events;
  v_replay := public.record_order_payment(
    v_business, v_order_cash, v_request, 'mixed-payment',
    '[{"medium":"mercado_pago","amount":20},{"medium":"cash","amount":30}]'::jsonb
  );
  if not (v_replay->>'idempotent')::boolean
     or (select count(*) from public.finance_operations) <> v_ops
     or (select count(*) from public.finance_audit_events) <> v_audits
     or public.order_paid_net(v_order_cash) <> 50 then
    raise exception 'order payment retry duplicated effects';
  end if;
  begin
    perform public.record_order_payment(
      v_business, v_order_cash, v_request, 'mixed-payment',
      '[{"medium":"cash","amount":1}]'::jsonb
    );
    raise exception 'different payment payload reused a request id' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;

  perform public.record_order_payment(
    v_business, v_order_cash, gen_random_uuid(), 'cash-full',
    '[{"medium":"mercado_pago","amount":50}]'::jsonb
  );
  if public.order_paid_net(v_order_cash) <> 100
     or public.order_committed_amount(v_order_cash) <> 100
     or public.order_remaining(v_order_cash) <> 0
     or (select financial_status from public.order_financials where order_id = v_order_cash) <> 'open' then
    raise exception 'full order payment did not remain protected and open';
  end if;

  select count(*) into v_ops from public.finance_operations;
  begin
    perform public.record_order_payment(
      v_business, v_order_cash, gen_random_uuid(), 'payment-overpay',
      '[{"medium":"mercado_pago","amount":1}]'::jsonb
    );
    raise exception 'payment overpay was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_ops then
    raise exception 'payment overpay left an operation';
  end if;

  v_weekly_before := public.finance_fund_balance(v_weekly);
  v_cash_before := public.finance_fund_balance(v_cash);
  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_funds from public.finance_funds;
  begin
    perform public.record_order_payment(
      v_business, v_order_insufficient, gen_random_uuid(), 'cash-insufficient',
      jsonb_build_array(jsonb_build_object(
        'medium', 'cash', 'amount', v_weekly_before + 1
      ))
    );
    raise exception 'cash payment without coverage was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_ops
     or (select count(*) from public.finance_funds) <> v_funds
     or public.finance_fund_balance(v_cash) <> v_cash_before
     or public.finance_fund_balance(v_weekly) <> v_weekly_before
     or public.order_paid_net(v_order_insufficient) <> 0 then
    raise exception 'failed cash payment left partial effects';
  end if;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000004', true);
  begin
    perform public.create_historical_deposit(
      v_business, gen_random_uuid(), 'operator-historical', v_order_historical, 1
    );
    raise exception 'operator created historical deposit' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000003', true);
  begin
    perform public.create_historical_deposit(
      v_business, gen_random_uuid(), 'historical-zero', v_order_historical, 0
    );
    raise exception 'zero historical deposit was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;
  v_weekly_before := public.finance_fund_balance(v_weekly);
  v_total_before := v_weekly_before
    + public.finance_fund_balance(v_cash)
    + coalesce((
        select sum(public.finance_fund_balance(f.id))
        from public.finance_funds f
        where f.business_id = v_business and f.fund_type = 'committed'
      ), 0);
  v_request := gen_random_uuid();
  v_result := public.create_historical_deposit(
    v_business, v_request, 'historical-40', v_order_historical, 40
  );
  v_total_after := public.finance_fund_balance(v_weekly)
    + public.finance_fund_balance(v_cash)
    + coalesce((
        select sum(public.finance_fund_balance(f.id))
        from public.finance_funds f
        where f.business_id = v_business and f.fund_type = 'committed'
      ), 0);
  if public.finance_fund_balance(v_weekly) <> v_weekly_before - 40
     or public.order_committed_amount(v_order_historical) <> 40
     or public.order_paid_net(v_order_historical) <> 40
     or v_total_after <> v_total_before then
    raise exception 'historical deposit created revenue or incorrect protection';
  end if;

  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_audits from public.finance_audit_events;
  v_replay := public.create_historical_deposit(
    v_business, v_request, 'historical-40', v_order_historical, 40
  );
  if not (v_replay->>'idempotent')::boolean
     or (select count(*) from public.finance_operations) <> v_ops
     or (select count(*) from public.finance_audit_events) <> v_audits
     or public.order_paid_net(v_order_historical) <> 40 then
    raise exception 'historical retry duplicated effects';
  end if;
  begin
    perform public.create_historical_deposit(
      v_business, v_request, 'historical-40', v_order_historical, 41
    );
    raise exception 'different historical payload reused request id' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;

  begin
    perform public.set_order_agreed_total(v_business, v_order_historical, null);
    raise exception 'agreed_total cleared after payment' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.set_order_agreed_total(v_business, v_order_historical, 39);
    raise exception 'agreed_total lowered below paid_net' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  perform public.set_order_agreed_total(v_business, v_order_historical, 40);
  perform public.set_order_agreed_total(v_business, v_order_historical, 120);

  select count(*) into v_ops from public.finance_operations;
  select count(*) into v_txs from public.finance_transactions;
  select count(*) into v_entries from public.finance_transaction_entries;
  begin
    perform public.create_historical_deposit(
      v_business, gen_random_uuid(), 'historical-overpay', v_order_historical, 81
    );
    raise exception 'historical overpay was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_ops
     or (select count(*) from public.finance_transactions) <> v_txs
     or (select count(*) from public.finance_transaction_entries) <> v_entries
     or public.order_paid_net(v_order_historical) <> 40 then
    raise exception 'historical overpay left partial effects';
  end if;

  begin
    perform public.create_income(
      v_business, gen_random_uuid(), 'generic-committed-bypass',
      jsonb_build_array(jsonb_build_object(
        'fund_id', v_committed, 'amount', 1
      ))
    );
    raise exception 'generic income wrote to committed' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  if exists (
    select 1 from public.finance_operations
    where operation_type in ('release_deposit', 'void', 'correction')
  ) or exists (
    select 1 from public.order_financials
    where order_id <> v_order_closed and financial_status <> 'open'
  ) then
    raise exception 'Phase 2B introduced settlement, release, or correction behavior';
  end if;
end;
$$;

do $$
begin
  perform set_config('request.jwt.claim.sub', '56000000-0000-4000-8000-000000000006', true);
  begin
    perform public.order_financial_summary('55000000-0000-4000-8000-000000000001');
    raise exception 'tenant B read tenant A summary' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform public.record_order_payment(
      '51000000-0000-4000-8000-000000000001',
      '55000000-0000-4000-8000-000000000001',
      gen_random_uuid(), 'anon',
      '[{"medium":"mercado_pago","amount":1}]'::jsonb
    );
    raise exception 'anon executed order payment' using errcode = 'ZX001';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

do $$
declare
  v_function text;
begin
  foreach v_function in array array[
    'public.initialize_order_financials(uuid,uuid,text)',
    'public.set_order_agreed_total(uuid,uuid,numeric)',
    'public.create_deposit(uuid,uuid,text,uuid,numeric,uuid,uuid,uuid,text,timestamp with time zone)',
    'public.record_order_payment(uuid,uuid,uuid,text,jsonb,text,timestamp with time zone)',
    'public.create_historical_deposit(uuid,uuid,text,uuid,numeric,text,timestamp with time zone)',
    'public.order_financial_summary(uuid)'
  ]
  loop
    if not exists (
      select 1
      from pg_proc p
      where p.oid = to_regprocedure(v_function)
        and p.prosecdef
        and exists (
          select 1
          from unnest(p.proconfig) setting
          where replace(setting, ' ', '') = 'search_path=pg_catalog,public'
        )
    ) then
      raise exception 'missing SECURITY DEFINER/fixed search_path on %', v_function;
    end if;
    if has_function_privilege('anon', v_function, 'EXECUTE')
       or not has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'unexpected execute grant on %', v_function;
    end if;
  end loop;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_income', 'create_expense', 'create_transfer')
      and pg_get_function_arguments(p.oid) like '%order_id%'
  ) then
    raise exception 'generic Phase 2A RPC acquired order_id';
  end if;
end;
$$;

select extensions.pass('Phase 2B contracts, protected payments, reads, locking, and permissions');
select * from extensions.finish();
rollback;
