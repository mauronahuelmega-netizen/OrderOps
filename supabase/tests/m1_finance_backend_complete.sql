-- M1 Finance Backend Complete: refunds, retention, cancellation, and payment reversal.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business constant uuid := 'a1000000-0000-4000-8000-000000000001';
  v_business_b constant uuid := 'a1000000-0000-4000-8000-000000000002';
begin
  if exists (select 1 from public.finance_order_outflow_allocations) then
    raise exception 'clean reset contains M1 finance data';
  end if;
  insert into public.businesses (id, name, slug, whatsapp_number) values
    (v_business, 'M1 A', 'm1-a', '5491100000901'),
    (v_business_b, 'M1 B', 'm1-b', '5491100000902');
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) select '00000000-0000-0000-0000-000000000000', id,
    'authenticated', 'authenticated', email, 'test-only', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  from (values
    ('a6000000-0000-4000-8000-000000000001'::uuid, 'owner@m1.test'),
    ('a6000000-0000-4000-8000-000000000002'::uuid, 'admin@m1.test'),
    ('a6000000-0000-4000-8000-000000000003'::uuid, 'manager@m1.test'),
    ('a6000000-0000-4000-8000-000000000004'::uuid, 'operator@m1.test'),
    ('a6000000-0000-4000-8000-000000000005'::uuid, 'viewer@m1.test'),
    ('a6000000-0000-4000-8000-000000000006'::uuid, 'owner-b@m1.test')
  ) users(id, email);
  insert into public.profiles (id, business_id, role) values
    ('a6000000-0000-4000-8000-000000000001', v_business, 'owner'),
    ('a6000000-0000-4000-8000-000000000002', v_business, 'admin'),
    ('a6000000-0000-4000-8000-000000000003', v_business, 'manager'),
    ('a6000000-0000-4000-8000-000000000004', v_business, 'operator'),
    ('a6000000-0000-4000-8000-000000000005', v_business, 'viewer'),
    ('a6000000-0000-4000-8000-000000000006', v_business_b, 'owner');
  insert into public.finance_accounts (id, business_id, name, kind) values
    ('a2000000-0000-4000-8000-000000000001', v_business, 'M1 protection', 'mercado_pago'),
    ('a2000000-0000-4000-8000-000000000002', v_business, 'M1 cash', 'cash'),
    ('a2000000-0000-4000-8000-000000000003', v_business_b, 'M1 B account', 'mercado_pago');
  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint
  ) values
    ('a3000000-0000-4000-8000-000000000001', v_business, 'a2000000-0000-4000-8000-000000000001', 'M1 operating', 'business_operating', 'business'),
    ('a3000000-0000-4000-8000-000000000002', v_business, 'a2000000-0000-4000-8000-000000000002', 'M1 cash', 'business_operating', 'business'),
    ('a3000000-0000-4000-8000-000000000004', v_business, 'a2000000-0000-4000-8000-000000000002', 'M1 empty cash', 'family', 'family'),
    ('a3000000-0000-4000-8000-000000000003', v_business_b, 'a2000000-0000-4000-8000-000000000003', 'M1 B operating', 'business_operating', 'business');
  insert into public.business_finance_settings (
    business_id, protection_account_id, default_operating_fund_id
  ) values
    (v_business, 'a2000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001'),
    (v_business_b, 'a2000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000003');
  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method,
    composition_status, total_price, order_code, status
  ) select id, business_id, customer, phone, current_date, 'pickup',
    'itemized', total, code, status
  from (values
    ('a5000000-0000-4000-8000-000000000001'::uuid, v_business, 'Unpaid', '5491100000901', 100::numeric, 'M2AAA2', 'pending'),
    ('a5000000-0000-4000-8000-000000000002'::uuid, v_business, 'Refund', '5491100000901', 100::numeric, 'M2AAA3', 'pending'),
    ('a5000000-0000-4000-8000-000000000003'::uuid, v_business, 'Retain', '5491100000901', 100::numeric, 'M2AAA4', 'pending'),
    ('a5000000-0000-4000-8000-000000000004'::uuid, v_business, 'Partial', '5491100000901', 100::numeric, 'M2AAA5', 'pending'),
    ('a5000000-0000-4000-8000-000000000005'::uuid, v_business, 'Settled', '5491100000901', 100::numeric, 'M2AAA6', 'completed'),
    ('a5000000-0000-4000-8000-000000000006'::uuid, v_business, 'Cash', '5491100000901', 100::numeric, 'M2AAA7', 'ready'),
    ('a5000000-0000-4000-8000-000000000007'::uuid, v_business, 'Reverse', '5491100000901', 100::numeric, 'M2AAA8', 'pending'),
    ('a5000000-0000-4000-8000-000000000008'::uuid, v_business, 'Multicycle', '5491100000901', 100::numeric, 'M2AAA9', 'preparing'),
    ('a5000000-0000-4000-8000-000000000010'::uuid, v_business, 'Historical', '5491100000901', 40::numeric, 'M2AABA', 'pending'),
    ('a5000000-0000-4000-8000-000000000009'::uuid, v_business_b, 'Tenant B', '5491100000902', 100::numeric, 'M2AABB', 'pending')
  ) orders(id, business_id, customer, phone, total, code, status);
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform public.cancel_order_financials(
      'a1000000-0000-4000-8000-000000000001',
      'a5000000-0000-4000-8000-000000000001', gen_random_uuid(), 'no-auth'
    );
    raise exception 'unauthenticated cancellation accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000001', true);
  begin
    perform public.cancel_order_financials(
      'a1000000-0000-4000-8000-000000000001',
      'a5000000-0000-4000-8000-000000000001', gen_random_uuid(), 'finance-disabled'
    );
    raise exception 'finance-disabled cancellation accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;
reset role;

update public.business_settings set timezone = 'UTC', finance_enabled = true
where business_id in (
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002'
);

set local role authenticated;
do $$
declare
  v_business constant uuid := 'a1000000-0000-4000-8000-000000000001';
  v_operating constant uuid := 'a3000000-0000-4000-8000-000000000001';
  v_cash constant uuid := 'a3000000-0000-4000-8000-000000000002';
  v_order uuid;
  v_payment jsonb;
  v_result jsonb;
  v_request uuid;
  v_before_status text;
  v_before_cash numeric;
  v_before_operating numeric;
  v_audits bigint;
begin
  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000001', true);
  perform public.create_income(
    v_business, gen_random_uuid(), 'm1-seed',
    jsonb_build_array(
      jsonb_build_object('fund_id', v_operating, 'amount', 2000),
      jsonb_build_object('fund_id', v_cash, 'amount', 500)
    )
  );
  foreach v_order in array array[
    'a5000000-0000-4000-8000-000000000001'::uuid,
    'a5000000-0000-4000-8000-000000000002'::uuid,
    'a5000000-0000-4000-8000-000000000003'::uuid,
    'a5000000-0000-4000-8000-000000000004'::uuid,
    'a5000000-0000-4000-8000-000000000005'::uuid,
    'a5000000-0000-4000-8000-000000000006'::uuid,
    'a5000000-0000-4000-8000-000000000007'::uuid,
    'a5000000-0000-4000-8000-000000000008'::uuid,
    'a5000000-0000-4000-8000-000000000010'::uuid
  ] loop
    perform public.initialize_order_financials(v_business, v_order, 'copy_total_price');
  end loop;

  -- Case A/L: unpaid financial cancellation is lifecycle-only and operationally independent.
  select status into v_before_status from public.orders where id = 'a5000000-0000-4000-8000-000000000001';
  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000003', true);
  v_request := gen_random_uuid();
  v_result := public.cancel_order_financials(
    v_business, 'a5000000-0000-4000-8000-000000000001',
    v_request, 'cancel-unpaid'
  );
  if v_result->>'financial_status' <> 'cancelled'
     or (select status from public.orders where id = 'a5000000-0000-4000-8000-000000000001') <> v_before_status
     or public.order_paid_net('a5000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'unpaid cancellation contract failed';
  end if;
  v_audits := (select count(*) from public.finance_audit_events where event_type = 'order_financials_cancelled' and entity_id = 'a5000000-0000-4000-8000-000000000001');
  v_result := public.cancel_order_financials(
    v_business, 'a5000000-0000-4000-8000-000000000001',
    v_request, 'cancel-unpaid'
  );
  if not (v_result->>'idempotent')::boolean
     or (select count(*) from public.finance_audit_events where event_type = 'order_financials_cancelled' and entity_id = 'a5000000-0000-4000-8000-000000000001') <> v_audits then
    raise exception 'financial cancellation retry duplicated effects';
  end if;
  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000001', true);

  -- Cases B/C/D: full refund, full retention, and atomic partial disposition.
  perform public.record_order_payment(v_business, 'a5000000-0000-4000-8000-000000000002', gen_random_uuid(), 'pay-refund', '[{"medium":"mercado_pago","amount":30}]');
  perform public.cancel_order_financials(
    v_business, 'a5000000-0000-4000-8000-000000000002', gen_random_uuid(), 'cancel-refund',
    jsonb_build_array(jsonb_build_object(
      'fund_id', (select id from public.finance_funds where order_id = 'a5000000-0000-4000-8000-000000000002' and active),
      'amount', 30
    )), 30, 0, 0
  );
  if public.order_refunded_amount('a5000000-0000-4000-8000-000000000002') <> 30
     or public.order_committed_amount('a5000000-0000-4000-8000-000000000002') <> 0
     or public.order_protection_variance('a5000000-0000-4000-8000-000000000002') <> 0 then
    raise exception 'full protected refund failed';
  end if;

  perform public.record_order_payment(v_business, 'a5000000-0000-4000-8000-000000000003', gen_random_uuid(), 'pay-retain', '[{"medium":"mercado_pago","amount":30}]');
  perform public.cancel_order_financials(
    v_business, 'a5000000-0000-4000-8000-000000000003',
    gen_random_uuid(), 'cancel-retain', null, 0, 0, 30
  );
  if (public.order_financial_exception_summary('a5000000-0000-4000-8000-000000000003')->>'retained_amount')::numeric <> 30
     or public.order_released_amount('a5000000-0000-4000-8000-000000000003') <> 30 then
    raise exception 'retained deposit semantics failed';
  end if;
  perform public.create_order_refund(
    v_business, 'a5000000-0000-4000-8000-000000000003',
    gen_random_uuid(), 'delayed-refund-after-cancel',
    jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 5)),
    0, 5
  );
  if public.order_refunded_amount('a5000000-0000-4000-8000-000000000003') <> 5
     or (select financial_status from public.order_financials where order_id = 'a5000000-0000-4000-8000-000000000003') <> 'cancelled' then
    raise exception 'delayed refund after cancellation failed';
  end if;

  perform public.record_order_payment(v_business, 'a5000000-0000-4000-8000-000000000004', gen_random_uuid(), 'pay-partial', '[{"medium":"mercado_pago","amount":30}]');
  perform public.cancel_order_financials(
    v_business, 'a5000000-0000-4000-8000-000000000004', gen_random_uuid(), 'cancel-partial',
    jsonb_build_array(jsonb_build_object(
      'fund_id', (select id from public.finance_funds where order_id = 'a5000000-0000-4000-8000-000000000004' and active),
      'amount', 10
    )), 10, 0, 20
  );
  if public.order_refunded_amount('a5000000-0000-4000-8000-000000000004') <> 10
     or (public.order_financial_exception_summary('a5000000-0000-4000-8000-000000000004')->>'retained_amount')::numeric <> 20
     or public.order_protection_variance('a5000000-0000-4000-8000-000000000004') <> 0 then
    raise exception 'partial refund/retention failed';
  end if;

  -- Cases E/F/N: settled refund is a new outflow, not a settlement reversal.
  perform public.record_order_payment(v_business, 'a5000000-0000-4000-8000-000000000005', gen_random_uuid(), 'pay-settled', '[{"medium":"mercado_pago","amount":100}]');
  perform public.settle_order_financials(v_business, 'a5000000-0000-4000-8000-000000000005', gen_random_uuid(), 'settle');
  v_request := gen_random_uuid();
  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000002', true);
  v_result := public.create_order_refund(
    v_business, 'a5000000-0000-4000-8000-000000000005', v_request, 'refund-settled',
    jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 25)),
    0, 25
  );
  v_audits := (select count(*) from public.finance_audit_events where event_type = 'order_refund_created' and entity_id = 'a5000000-0000-4000-8000-000000000005');
  v_result := public.create_order_refund(
    v_business, 'a5000000-0000-4000-8000-000000000005', v_request, 'refund-settled',
    jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 25)),
    0, 25
  );
  if not (v_result->>'idempotent')::boolean
     or public.order_paid_net('a5000000-0000-4000-8000-000000000005') <> 100
     or public.order_refunded_amount('a5000000-0000-4000-8000-000000000005') <> 25
     or public.order_refundable_amount('a5000000-0000-4000-8000-000000000005') <> 75
     or public.order_released_amount('a5000000-0000-4000-8000-000000000005') <> 100
     or (select count(*) from public.finance_audit_events where event_type = 'order_refund_created' and entity_id = 'a5000000-0000-4000-8000-000000000005') <> v_audits
     or (select financial_status from public.order_financials where order_id = 'a5000000-0000-4000-8000-000000000005') <> 'settled'
     or (select status from public.orders where id = 'a5000000-0000-4000-8000-000000000005') <> 'completed' then
    raise exception 'settled refund/idempotency semantics failed';
  end if;
  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000001', true);
  begin
    perform public.create_order_refund(
      v_business, 'a5000000-0000-4000-8000-000000000005', v_request, 'different',
      jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 25)), 0, 25
    );
    raise exception 'refund idempotency conflict accepted' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;
  begin
    perform public.create_order_refund(
      v_business, 'a5000000-0000-4000-8000-000000000005', gen_random_uuid(), 'insufficient',
      jsonb_build_array(jsonb_build_object('fund_id', 'a3000000-0000-4000-8000-000000000004', 'amount', 10)),
      0, 10
    );
    raise exception 'refund with insufficient payout balance accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if public.order_refunded_amount('a5000000-0000-4000-8000-000000000005') <> 25 then
    raise exception 'failed refund left partial effects';
  end if;
  begin
    perform public.create_order_refund(
      v_business, 'a5000000-0000-4000-8000-000000000005', gen_random_uuid(), 'over-refund',
      jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 76)),
      0, 76
    );
    raise exception 'over-refund was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if public.order_refunded_amount('a5000000-0000-4000-8000-000000000005') <> 25 then
    raise exception 'over-refund left partial effects';
  end if;

  -- A closed account cutoff rejects backdated refund activity without rewriting history.
  v_result := public.create_finance_reconciliation(
    v_business, 'a2000000-0000-4000-8000-000000000002',
    now() - interval '1 day', 0, 'M1 closed cutoff',
    gen_random_uuid(), 'm1-cutoff-create'
  );
  perform public.close_finance_reconciliation(
    v_business, (v_result->>'reconciliation_id')::uuid,
    gen_random_uuid(), 'm1-cutoff-close'
  );
  begin
    perform public.create_order_refund(
      v_business, 'a5000000-0000-4000-8000-000000000005', gen_random_uuid(), 'closed-period',
      jsonb_build_array(jsonb_build_object('fund_id', v_cash, 'amount', 5)),
      0, 5, null, now() - interval '2 days'
    );
    raise exception 'backdated refund entered a closed period' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  -- Cancel the settled contract later and refund the remaining released value.
  perform public.cancel_order_financials(
    v_business, 'a5000000-0000-4000-8000-000000000005', gen_random_uuid(), 'cancel-settled',
    jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 75)),
    0, 75, 0
  );
  if public.order_refunded_amount('a5000000-0000-4000-8000-000000000005') <> 100
     or (select financial_status from public.order_financials where order_id = 'a5000000-0000-4000-8000-000000000005') <> 'cancelled'
     or (select status from public.orders where id = 'a5000000-0000-4000-8000-000000000005') <> 'completed' then
    raise exception 'settled cancellation/refund boundary failed';
  end if;

  -- Case I: cash refund unwinds digital protection without double-counting collection.
  perform public.record_order_payment(v_business, 'a5000000-0000-4000-8000-000000000006', gen_random_uuid(), 'pay-cash', '[{"medium":"cash","amount":20}]');
  v_before_cash := public.finance_fund_balance(v_cash);
  v_before_operating := public.finance_fund_balance(v_operating);
  perform public.create_order_refund(
    v_business, 'a5000000-0000-4000-8000-000000000006', gen_random_uuid(), 'refund-cash',
    jsonb_build_array(jsonb_build_object('fund_id', v_cash, 'amount', 20)), 20, 0
  );
  if public.finance_fund_balance(v_cash) <> v_before_cash - 20
     or public.finance_fund_balance(v_operating) <> v_before_operating + 20
     or public.order_paid_net('a5000000-0000-4000-8000-000000000006') <> 20
     or public.order_committed_amount('a5000000-0000-4000-8000-000000000006') <> 0 then
    raise exception 'cash protected refund coverage failed';
  end if;

  -- Case K: a mistaken payment is reversed, not classified as a refund.
  v_payment := public.record_order_payment(v_business, 'a5000000-0000-4000-8000-000000000007', gen_random_uuid(), 'pay-wrong', '[{"medium":"mercado_pago","amount":50}]');
  v_request := gen_random_uuid();
  v_result := public.reverse_order_payment(
    v_business, 'a5000000-0000-4000-8000-000000000007',
    (v_payment->>'operation_id')::uuid, v_request, 'reverse-wrong',
    jsonb_build_array(jsonb_build_object(
      'fund_id', (select id from public.finance_funds where order_id = 'a5000000-0000-4000-8000-000000000007' and active),
      'amount', 50
    )), 50, 0
  );
  if public.order_paid_net('a5000000-0000-4000-8000-000000000007') <> 0
     or public.order_refunded_amount('a5000000-0000-4000-8000-000000000007') <> 0
     or public.order_remaining('a5000000-0000-4000-8000-000000000007') <> 100
     or public.order_protection_variance('a5000000-0000-4000-8000-000000000007') <> 0 then
    raise exception 'specialized payment reversal failed';
  end if;
  v_audits := (select count(*) from public.finance_audit_events where event_type = 'order_payment_reversed' and entity_id = 'a5000000-0000-4000-8000-000000000007');
  v_result := public.reverse_order_payment(
    v_business, 'a5000000-0000-4000-8000-000000000007',
    (v_payment->>'operation_id')::uuid, v_request, 'reverse-wrong',
    jsonb_build_array(jsonb_build_object(
      'fund_id', (select id from public.finance_funds where order_id = 'a5000000-0000-4000-8000-000000000007' order by created_at desc limit 1),
      'amount', 50
    )), 50, 0
  );
  if not (v_result->>'idempotent')::boolean
     or (select count(*) from public.finance_audit_events where event_type = 'order_payment_reversed' and entity_id = 'a5000000-0000-4000-8000-000000000007') <> v_audits then
    raise exception 'payment reversal retry duplicated effects';
  end if;

  -- Historical money is refunded externally while its protected allocation is unwound.
  perform public.create_historical_deposit(
    v_business, gen_random_uuid(), 'historical-payment',
    'a5000000-0000-4000-8000-000000000010', 40
  );
  perform public.create_order_refund(
    v_business, 'a5000000-0000-4000-8000-000000000010', gen_random_uuid(), 'historical-refund',
    jsonb_build_array(jsonb_build_object(
      'fund_id', (select id from public.finance_funds where order_id = 'a5000000-0000-4000-8000-000000000010' and active),
      'amount', 40
    )), 40, 0
  );
  if public.order_paid_net('a5000000-0000-4000-8000-000000000010') <> 40
     or public.order_refunded_amount('a5000000-0000-4000-8000-000000000010') <> 40
     or public.order_committed_amount('a5000000-0000-4000-8000-000000000010') <> 0 then
    raise exception 'historical refund semantics failed';
  end if;

  -- Cases G/H: explicit mixed lifecycle allocation after reopen.
  perform public.record_order_payment(v_business, 'a5000000-0000-4000-8000-000000000008', gen_random_uuid(), 'multi-first', '[{"medium":"mercado_pago","amount":100}]');
  perform public.settle_order_financials(v_business, 'a5000000-0000-4000-8000-000000000008', gen_random_uuid(), 'multi-settle');
  perform public.reopen_order_financials(v_business, 'a5000000-0000-4000-8000-000000000008', gen_random_uuid(), 'multi-reopen');
  perform public.set_order_agreed_total(v_business, 'a5000000-0000-4000-8000-000000000008', 120);
  perform public.record_order_payment(v_business, 'a5000000-0000-4000-8000-000000000008', gen_random_uuid(), 'multi-second', '[{"medium":"mercado_pago","amount":20}]');
  perform public.create_order_refund(
    v_business, 'a5000000-0000-4000-8000-000000000008', gen_random_uuid(), 'multi-refund',
    jsonb_build_array(
      jsonb_build_object(
        'fund_id', (select id from public.finance_funds where order_id = 'a5000000-0000-4000-8000-000000000008' and active),
        'amount', 20
      ),
      jsonb_build_object('fund_id', v_operating, 'amount', 30)
    ), 20, 30
  );
  if public.order_paid_net('a5000000-0000-4000-8000-000000000008') <> 120
     or public.order_refunded_amount('a5000000-0000-4000-8000-000000000008') <> 50
     or public.order_refundable_amount('a5000000-0000-4000-8000-000000000008') <> 70
     or public.order_released_amount('a5000000-0000-4000-8000-000000000008') <> 100
     or public.order_committed_amount('a5000000-0000-4000-8000-000000000008') <> 0
     or public.order_protection_variance('a5000000-0000-4000-8000-000000000008') <> 0 then
    raise exception 'mixed multi-cycle refund failed';
  end if;

  -- Capability and tenant boundaries.
  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000004', true);
  begin
    perform public.create_order_refund(
      v_business, 'a5000000-0000-4000-8000-000000000005', gen_random_uuid(), 'operator',
      jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 1)), 0, 1
    );
    raise exception 'operator refund accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000005', true);
  begin
    perform public.create_order_refund(
      v_business, 'a5000000-0000-4000-8000-000000000006', gen_random_uuid(), 'viewer',
      jsonb_build_array(jsonb_build_object('fund_id', v_cash, 'amount', 1)), 0, 1
    );
    raise exception 'viewer refund accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
  perform set_config('request.jwt.claim.sub', 'a6000000-0000-4000-8000-000000000001', true);
  begin
    perform public.cancel_order_financials(
      'a1000000-0000-4000-8000-000000000002',
      'a5000000-0000-4000-8000-000000000009', gen_random_uuid(), 'cross-tenant'
    );
    raise exception 'cross-tenant cancel accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;
reset role;

select extensions.pass('M1 order finance exception engine preserves ledger and lifecycle invariants');
select * from extensions.finish();
rollback;
