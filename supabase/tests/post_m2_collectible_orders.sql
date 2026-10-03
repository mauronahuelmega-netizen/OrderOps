begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business constant uuid := 'ac000000-0000-4000-8000-000000000001';
  v_user constant uuid := 'ac000000-0000-4000-8000-000000000002';
  v_account constant uuid := 'ac000000-0000-4000-8000-000000000003';
  v_operating constant uuid := 'ac000000-0000-4000-8000-000000000004';
  v_open constant uuid := 'ac000000-0000-4000-8000-000000000010';
  v_partial constant uuid := 'ac000000-0000-4000-8000-000000000011';
  v_cancelled constant uuid := 'ac000000-0000-4000-8000-000000000012';
  v_settled constant uuid := 'ac000000-0000-4000-8000-000000000013';
  v_cancelled_refund constant uuid := 'ac000000-0000-4000-8000-000000000014';
  v_settled_refund constant uuid := 'ac000000-0000-4000-8000-000000000015';
  v_dashboard jsonb;
  v_summary jsonb;
  v_committed uuid;
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (v_business, 'Collectible regression', 'collectible-regression', '5491100000990');
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user, 'authenticated',
    'authenticated', 'collectible@test.local', 'test-only', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );
  insert into public.profiles (id, business_id, role) values (v_user, v_business, 'owner');
  update public.business_settings set timezone = 'UTC', finance_enabled = true
  where business_id = v_business;
  insert into public.finance_accounts (id, business_id, name, kind)
  values (v_account, v_business, 'Collectible account', 'mercado_pago');
  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint
  ) values (
    v_operating, v_business, v_account, 'Collectible operating',
    'business_operating', 'business'
  );
  insert into public.business_finance_settings (
    business_id, protection_account_id, default_operating_fund_id
  ) values (v_business, v_account, v_operating);
  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method,
    composition_status, total_price, order_code, status
  ) values
    (v_open, v_business, 'Open', '5491100000990', current_date, 'pickup', 'itemized', 30000, 'CAAAAA', 'pending'),
    (v_partial, v_business, 'Partial', '5491100000990', current_date, 'pickup', 'itemized', 30000, 'CAAAAB', 'completed'),
    (v_cancelled, v_business, 'Cancelled', '5491100000990', current_date, 'pickup', 'itemized', 30000, 'CAAAAC', 'pending'),
    (v_settled, v_business, 'Settled', '5491100000990', current_date, 'pickup', 'itemized', 120, 'CAAAAD', 'pending'),
    (v_cancelled_refund, v_business, 'Cancelled refund', '5491100000990', current_date, 'pickup', 'itemized', 100, 'CAAAAE', 'pending'),
    (v_settled_refund, v_business, 'Settled refund', '5491100000990', current_date, 'pickup', 'itemized', 100, 'CAAAAF', 'pending');

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform public.create_income(
    v_business, gen_random_uuid(), 'collectible-seed',
    jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 1000))
  );
  perform public.initialize_order_financials(v_business, v_open, 'copy_total_price');
  perform public.initialize_order_financials(v_business, v_partial, 'copy_total_price');
  perform public.initialize_order_financials(v_business, v_cancelled, 'copy_total_price');
  perform public.initialize_order_financials(v_business, v_settled, 'copy_total_price');
  perform public.initialize_order_financials(v_business, v_cancelled_refund, 'copy_total_price');
  perform public.initialize_order_financials(v_business, v_settled_refund, 'copy_total_price');

  perform public.record_order_payment(
    v_business, v_partial, gen_random_uuid(), 'partial',
    '[{"medium":"mercado_pago","amount":10000}]'
  );
  perform public.cancel_order_financials(
    v_business, v_cancelled, gen_random_uuid(), 'cancel-unpaid'
  );
  perform public.record_order_payment(
    v_business, v_settled, gen_random_uuid(), 'settled-payment',
    '[{"medium":"mercado_pago","amount":120}]'
  );
  perform public.settle_order_financials(
    v_business, v_settled, gen_random_uuid(), 'settle'
  );

  perform public.record_order_payment(
    v_business, v_cancelled_refund, gen_random_uuid(), 'cancel-refund-payment',
    '[{"medium":"mercado_pago","amount":100}]'
  );
  select id into strict v_committed from public.finance_funds
  where business_id = v_business and order_id = v_cancelled_refund and active;
  perform public.cancel_order_financials(
    v_business, v_cancelled_refund, gen_random_uuid(), 'cancel-with-refund',
    jsonb_build_array(jsonb_build_object('fund_id', v_committed, 'amount', 100)),
    100, 0, 0
  );

  perform public.record_order_payment(
    v_business, v_settled_refund, gen_random_uuid(), 'settled-refund-payment',
    '[{"medium":"mercado_pago","amount":100}]'
  );
  perform public.settle_order_financials(
    v_business, v_settled_refund, gen_random_uuid(), 'settle-before-refund'
  );
  perform public.create_order_refund(
    v_business, v_settled_refund, gen_random_uuid(), 'refund-after-settlement',
    jsonb_build_array(jsonb_build_object('fund_id', v_operating, 'amount', 25)),
    0, 25
  );

  v_dashboard := public.finance_dashboard_summary(v_business);
  if (v_dashboard->>'collectible_order_remaining')::numeric <> 50000
     or (v_dashboard->>'order_remaining')::numeric <> 50000
     or (v_dashboard->>'contractual_order_remaining')::numeric <> 80000 then
    raise exception 'dashboard collectible/contractual totals are incorrect: %', v_dashboard;
  end if;

  v_summary := public.order_financial_exception_summary(v_open);
  if (v_summary->>'remaining')::numeric <> 30000
     or (v_summary->>'collectible_remaining')::numeric <> 30000 then
    raise exception 'open collectible mismatch';
  end if;
  v_summary := public.order_financial_exception_summary(v_partial);
  if (v_summary->>'remaining')::numeric <> 20000
     or (v_summary->>'collectible_remaining')::numeric <> 20000 then
    raise exception 'partially paid collectible mismatch';
  end if;
  v_summary := public.order_financial_exception_summary(v_cancelled);
  if (v_summary->>'remaining')::numeric <> 30000
     or (v_summary->>'collectible_remaining')::numeric <> 0
     or (select status from public.orders where id = v_cancelled) <> 'pending' then
    raise exception 'cancelled contract remained collectible or changed operational status';
  end if;
  if (public.order_financial_exception_summary(v_settled)->>'collectible_remaining')::numeric <> 0
     or (public.order_financial_exception_summary(v_cancelled_refund)->>'collectible_remaining')::numeric <> 0
     or (public.order_financial_exception_summary(v_settled_refund)->>'collectible_remaining')::numeric <> 0 then
    raise exception 'closed/refunded order became collectible';
  end if;
end;
$$;

select extensions.pass('collectible balance includes only open financial contracts and preserves contractual remaining');
select * from extensions.finish();
rollback;
