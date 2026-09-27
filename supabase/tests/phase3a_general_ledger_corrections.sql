-- Phase 3A general-ledger correction coverage. Runs transactionally.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business_a constant uuid := '81000000-0000-4000-8000-000000000001';
  v_business_b constant uuid := '81000000-0000-4000-8000-000000000002';
begin
  if exists (select 1 from public.finance_operations)
     or exists (select 1 from public.finance_reconciliation_entries) then
    raise exception 'clean reset contains finance data';
  end if;

  insert into public.businesses (id, name, slug, whatsapp_number)
  values
    (v_business_a, 'Phase 3A A', 'phase-3a-a', '5491100000601'),
    (v_business_b, 'Phase 3A B', 'phase-3a-b', '5491100000602');

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
    email, 'test-only', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  from (values
    ('86000000-0000-4000-8000-000000000001'::uuid, 'owner@phase3a.test'),
    ('86000000-0000-4000-8000-000000000002'::uuid, 'admin@phase3a.test'),
    ('86000000-0000-4000-8000-000000000003'::uuid, 'manager@phase3a.test'),
    ('86000000-0000-4000-8000-000000000004'::uuid, 'operator@phase3a.test'),
    ('86000000-0000-4000-8000-000000000005'::uuid, 'viewer@phase3a.test'),
    ('86000000-0000-4000-8000-000000000006'::uuid, 'owner-b@phase3a.test')
  ) as users(id, email);

  insert into public.profiles (id, business_id, role)
  values
    ('86000000-0000-4000-8000-000000000001', v_business_a, 'owner'),
    ('86000000-0000-4000-8000-000000000002', v_business_a, 'admin'),
    ('86000000-0000-4000-8000-000000000003', v_business_a, 'manager'),
    ('86000000-0000-4000-8000-000000000004', v_business_a, 'operator'),
    ('86000000-0000-4000-8000-000000000005', v_business_a, 'viewer'),
    ('86000000-0000-4000-8000-000000000006', v_business_b, 'owner');

  insert into public.finance_accounts (id, business_id, name, kind)
  values
    ('82000000-0000-4000-8000-000000000001', v_business_a, 'Phase 3A account A', 'cash'),
    ('82000000-0000-4000-8000-000000000002', v_business_a, 'Phase 3A account B', 'other'),
    ('82000000-0000-4000-8000-000000000003', v_business_b, 'Phase 3A account tenant B', 'cash');

  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint
  ) values
    ('83000000-0000-4000-8000-000000000001', v_business_a, '82000000-0000-4000-8000-000000000001', 'General A', 'business_operating', 'business'),
    ('83000000-0000-4000-8000-000000000002', v_business_a, '82000000-0000-4000-8000-000000000002', 'General B', 'business_operating', 'business'),
    ('83000000-0000-4000-8000-000000000003', v_business_a, '82000000-0000-4000-8000-000000000002', 'General C', 'business_operating', 'business'),
    ('83000000-0000-4000-8000-000000000004', v_business_a, '82000000-0000-4000-8000-000000000001', 'Negative void', 'business_operating', 'business'),
    ('83000000-0000-4000-8000-000000000005', v_business_b, '82000000-0000-4000-8000-000000000003', 'Tenant B', 'business_operating', 'business');

  insert into public.finance_categories (id, business_id, name, area, kind)
  values
    ('84000000-0000-4000-8000-000000000001', v_business_a, 'Income one', 'business', 'income'),
    ('84000000-0000-4000-8000-000000000002', v_business_a, 'Income two', 'business', 'income'),
    ('84000000-0000-4000-8000-000000000003', v_business_a, 'Expense one', 'business', 'expense'),
    ('84000000-0000-4000-8000-000000000004', v_business_b, 'Tenant B income', 'business', 'income');

  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method,
    composition_status, total_price, order_code
  ) values (
    '85000000-0000-4000-8000-000000000001', v_business_a, 'Protected',
    '5491100000601', current_date, 'pickup', 'legacy_unknown', null, 'P3AAAA'
  );
  insert into public.order_financials (order_id, business_id, agreed_total)
  values ('85000000-0000-4000-8000-000000000001', v_business_a, 100);
  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint, order_id
  ) values (
    '83000000-0000-4000-8000-000000000006', v_business_a,
    '82000000-0000-4000-8000-000000000002', 'Committed', 'committed', 'business',
    '85000000-0000-4000-8000-000000000001'
  );
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform public.void_finance_operation(
      '81000000-0000-4000-8000-000000000001', gen_random_uuid(), 'no-auth',
      gen_random_uuid(), 'no auth'
    );
    raise exception 'unauthenticated correction was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '86000000-0000-4000-8000-000000000001', true);
  begin
    perform public.void_finance_operation(
      '81000000-0000-4000-8000-000000000001', gen_random_uuid(), 'disabled',
      gen_random_uuid(), 'disabled'
    );
    raise exception 'finance-disabled correction was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;

reset role;
update public.business_settings
set timezone = 'UTC', finance_enabled = true
where business_id in (
  '81000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000002'
);

set local role authenticated;
do $$
declare
  v_business constant uuid := '81000000-0000-4000-8000-000000000001';
  v_fund_a constant uuid := '83000000-0000-4000-8000-000000000001';
  v_fund_b constant uuid := '83000000-0000-4000-8000-000000000002';
  v_fund_c constant uuid := '83000000-0000-4000-8000-000000000003';
  v_fund_negative constant uuid := '83000000-0000-4000-8000-000000000004';
  v_income_category constant uuid := '84000000-0000-4000-8000-000000000001';
  v_income_category_2 constant uuid := '84000000-0000-4000-8000-000000000002';
  v_expense_category constant uuid := '84000000-0000-4000-8000-000000000003';
  v_income jsonb;
  v_income_id uuid;
  v_income_tx uuid;
  v_edit_request constant uuid := '87000000-0000-4000-8000-000000000001';
  v_edit jsonb;
  v_replay jsonb;
  v_entries_before jsonb;
  v_entries_after jsonb;
  v_balance numeric;
  v_expense jsonb;
  v_void_request constant uuid := '87000000-0000-4000-8000-000000000002';
  v_void jsonb;
  v_negative_income jsonb;
  v_correction_request constant uuid := '87000000-0000-4000-8000-000000000003';
  v_correction jsonb;
  v_operations bigint;
  v_audits bigint;
  v_original_entry numeric;
  v_transfer jsonb;
  v_transfer_id uuid;
  v_transfer_negative jsonb;
  v_expense_correction jsonb;
begin
  perform set_config('request.jwt.claim.sub', '86000000-0000-4000-8000-000000000001', true);

  v_income := public.create_income(
    v_business, '88000000-0000-4000-8000-000000000001', 'original-income',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 1000)),
    v_income_category, 'business', 'original', now() + interval '2 days'
  );
  v_income_id := (v_income->>'operation_id')::uuid;
  v_income_tx := (v_income->>'transaction_id')::uuid;
  select jsonb_agg(to_jsonb(e) order by e.id) into v_entries_before
  from public.finance_transaction_entries e where e.transaction_id = v_income_tx;
  v_balance := public.finance_fund_balance(v_fund_a);

  v_edit := public.edit_finance_transaction_metadata(
    v_business, v_edit_request, 'metadata-v1', v_income_id,
    'edited', v_income_category_2, 'business', now() + interval '3 days'
  );
  select jsonb_agg(to_jsonb(e) order by e.id) into v_entries_after
  from public.finance_transaction_entries e where e.transaction_id = v_income_tx;
  if v_entries_after is distinct from v_entries_before
     or public.finance_fund_balance(v_fund_a) <> v_balance
     or not exists (
       select 1 from public.finance_transactions
       where id = v_income_tx and note = 'edited'
         and category_id = v_income_category_2 and area = 'business'
     )
     or not exists (
       select 1 from public.finance_operations
       where id = (v_edit->>'operation_id')::uuid
         and operation_type = 'metadata_edit'
         and target_operation_id = v_income_id
     ) then
    raise exception 'metadata edit changed economics or lost provenance';
  end if;
  if exists (
    select 1 from public.finance_transactions
    where operation_id = (v_edit->>'operation_id')::uuid
  ) then
    raise exception 'metadata edit created a transaction';
  end if;

  select count(*) into v_operations from public.finance_operations;
  select count(*) into v_audits from public.finance_audit_events;
  v_replay := public.edit_finance_transaction_metadata(
    v_business, v_edit_request, 'metadata-v1', v_income_id,
    'edited', v_income_category_2, 'business', now() + interval '3 days'
  );
  if not (v_replay->>'idempotent')::boolean
     or (select count(*) from public.finance_operations) <> v_operations
     or (select count(*) from public.finance_audit_events) <> v_audits then
    raise exception 'metadata retry duplicated effects';
  end if;

  foreach v_operations in array array[4::bigint, 5::bigint]
  loop
    perform set_config(
      'request.jwt.claim.sub',
      case v_operations when 4 then '86000000-0000-4000-8000-000000000004'
                        else '86000000-0000-4000-8000-000000000005' end,
      true
    );
    begin
      perform public.edit_finance_transaction_metadata(
        v_business, gen_random_uuid(), 'denied-role-' || v_operations, v_income_id,
        'forbidden', v_income_category_2, 'business', now() + interval '4 days'
      );
      raise exception 'operator/viewer metadata edit was accepted' using errcode = 'ZX001';
    exception when sqlstate '42501' then null;
    end;
  end loop;

  perform set_config('request.jwt.claim.sub', '86000000-0000-4000-8000-000000000002', true);
  perform public.edit_finance_transaction_metadata(
    v_business, gen_random_uuid(), 'admin-edit', v_income_id,
    'admin edited', v_income_category_2, 'business', now() + interval '3 days'
  );
  perform set_config('request.jwt.claim.sub', '86000000-0000-4000-8000-000000000003', true);
  perform public.edit_finance_transaction_metadata(
    v_business, gen_random_uuid(), 'manager-edit', v_income_id,
    'manager edited', v_income_category_2, 'business', now() + interval '3 days'
  );
  if not exists (
    select 1 from public.finance_transactions
    where id = v_income_tx and note = 'manager edited'
  ) then
    raise exception 'admin/manager correction capability failed';
  end if;

  perform set_config('request.jwt.claim.sub', '86000000-0000-4000-8000-000000000001', true);
  begin
    perform public.edit_finance_transaction_metadata(
      '81000000-0000-4000-8000-000000000002', gen_random_uuid(), 'cross-tenant',
      v_income_id, 'x', null, 'business', now()
    );
    raise exception 'cross-tenant metadata edit was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  v_expense := public.create_expense(
    v_business, '88000000-0000-4000-8000-000000000002', 'void-expense',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 100)),
    v_expense_category, 'business', 'void me', now() + interval '2 days'
  );
  v_balance := public.finance_fund_balance(v_fund_a);
  v_void := public.void_finance_operation(
    v_business, v_void_request, 'void-v1', (v_expense->>'operation_id')::uuid, 'mistake'
  );
  if public.finance_fund_balance(v_fund_a) <> v_balance + 100
     or exists (
       select 1 from public.finance_transactions
       where operation_id = (v_expense->>'operation_id')::uuid and status <> 'voided'
     )
     or not exists (
       select 1 from public.finance_transaction_entries
       where transaction_id = (v_expense->>'transaction_id')::uuid
     )
     or not exists (
       select 1 from public.finance_operations
       where id = (v_void->>'operation_id')::uuid
         and operation_type = 'void'
         and target_operation_id = (v_expense->>'operation_id')::uuid
     ) then
    raise exception 'whole-operation void contract failed';
  end if;

  v_balance := public.finance_fund_balance(v_fund_a);
  v_replay := public.void_finance_operation(
    v_business, v_void_request, 'void-v1', (v_expense->>'operation_id')::uuid, 'mistake'
  );
  if not (v_replay->>'idempotent')::boolean
     or public.finance_fund_balance(v_fund_a) <> v_balance then
    raise exception 'void retry duplicated effects';
  end if;
  begin
    perform public.void_finance_operation(
      v_business, v_void_request, 'void-conflict',
      (v_expense->>'operation_id')::uuid, 'different payload'
    );
    raise exception 'void idempotency conflict was accepted' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;
  begin
    perform public.void_finance_operation(
      v_business, gen_random_uuid(), 'second-void', (v_expense->>'operation_id')::uuid, 'again'
    );
    raise exception 'second void was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%ALREADY_VOIDED%' then raise; end if;
  end;

  v_negative_income := public.create_income(
    v_business, '88000000-0000-4000-8000-000000000003', 'negative-income',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_negative, 'amount', 100)),
    v_income_category, 'business', 'negative seed', now() + interval '2 days'
  );
  perform public.create_expense(
    v_business, '88000000-0000-4000-8000-000000000004', 'negative-spend',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_negative, 'amount', 80)),
    v_expense_category, 'business', 'spent', now() + interval '2 days'
  );
  select count(*) into v_operations from public.finance_operations;
  select count(*) into v_audits from public.finance_audit_events;
  begin
    perform public.void_finance_operation(
      v_business, gen_random_uuid(), 'negative-void',
      (v_negative_income->>'operation_id')::uuid, 'would go negative'
    );
    raise exception 'negative-result void was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%VOID_NEGATIVE_BALANCE%' then raise; end if;
  end;
  if public.finance_fund_balance(v_fund_negative) <> 20
     or (select count(*) from public.finance_operations) <> v_operations
     or (select count(*) from public.finance_audit_events) <> v_audits then
    raise exception 'failed void left partial effects';
  end if;

  v_balance := public.finance_fund_balance(v_fund_a);
  v_correction := public.create_finance_correction(
    v_business, v_correction_request, 'income-to-800', v_income_id,
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 800)),
    v_income_category_2, 'business', 'correct to 800', now() + interval '4 days'
  );
  if public.finance_fund_balance(v_fund_a) <> v_balance - 200
     or not exists (
       select 1 from public.finance_operations
       where id = (v_correction->>'operation_id')::uuid
         and operation_type = 'correction' and target_operation_id = v_income_id
     ) then
    raise exception 'income decrease correction failed';
  end if;
  v_balance := public.finance_fund_balance(v_fund_a);
  select count(*) into v_operations from public.finance_operations;
  select count(*) into v_audits from public.finance_audit_events;
  v_replay := public.create_finance_correction(
    v_business, v_correction_request, 'income-to-800', v_income_id,
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 800)),
    v_income_category_2, 'business', 'correct to 800', now() + interval '4 days'
  );
  if not (v_replay->>'idempotent')::boolean
     or public.finance_fund_balance(v_fund_a) <> v_balance
     or (select count(*) from public.finance_operations) <> v_operations
     or (select count(*) from public.finance_audit_events) <> v_audits then
    raise exception 'correction retry duplicated effects';
  end if;
  begin
    perform public.create_finance_correction(
      v_business, v_correction_request, 'income-conflict', v_income_id,
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 700)),
      v_income_category_2, 'business', 'different', now() + interval '4 days'
    );
    raise exception 'correction idempotency conflict was accepted' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;
  select e.amount into v_original_entry
  from public.finance_transaction_entries e where e.transaction_id = v_income_tx;
  if v_original_entry <> 1000 then
    raise exception 'correction rewrote original entries';
  end if;

  v_balance := public.finance_fund_balance(v_fund_a);
  perform public.create_finance_correction(
    v_business, '87000000-0000-4000-8000-000000000004', 'income-to-1200', v_income_id,
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 1200)),
    v_income_category_2, 'business', 'correct to 1200', now() + interval '5 days'
  );
  if public.finance_fund_balance(v_fund_a) <> v_balance + 400 then
    raise exception 'multiple corrections did not use effective current state';
  end if;

  select count(*) into v_operations from public.finance_operations;
  begin
    perform public.create_finance_correction(
      v_business, gen_random_uuid(), 'zero-delta', v_income_id,
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 1200)),
      v_income_category_2, 'business', 'no change', now() + interval '6 days'
    );
    raise exception 'zero-delta correction was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%NO_ECONOMIC_CHANGE%' then raise; end if;
  end;
  if (select count(*) from public.finance_operations) <> v_operations then
    raise exception 'zero-delta correction left an operation';
  end if;

  v_balance := public.finance_fund_balance(v_fund_a);
  v_replay := public.create_income(
    v_business, '88000000-0000-4000-8000-000000000001', 'original-income',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 1000)),
    v_income_category, 'business', 'original', now() + interval '2 days'
  );
  if not (v_replay->>'idempotent')::boolean
     or (v_replay->>'operation_id')::uuid <> v_income_id
     or public.finance_fund_balance(v_fund_a) <> v_balance then
    raise exception 'original create retry was broken by corrections';
  end if;
  begin
    perform public.void_finance_operation(
      v_business, gen_random_uuid(), 'void-corrected', v_income_id, 'not allowed'
    );
    raise exception 'void after correction was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  v_expense_correction := public.create_expense(
    v_business, '88000000-0000-4000-8000-000000000008', 'expense-correction-seed',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 100)),
    v_expense_category, 'business', 'expense 100', now() + interval '2 days'
  );
  v_balance := public.finance_fund_balance(v_fund_a);
  perform public.create_finance_correction(
    v_business, '87000000-0000-4000-8000-000000000008', 'expense-to-80',
    (v_expense_correction->>'operation_id')::uuid,
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_a, 'amount', 80)),
    v_expense_category, 'business', 'expense corrected', now() + interval '4 days'
  );
  if public.finance_fund_balance(v_fund_a) <> v_balance + 20 then
    raise exception 'expense decrease correction failed';
  end if;

  v_transfer := public.create_transfer(
    v_business, '88000000-0000-4000-8000-000000000005', 'transfer-seed',
    jsonb_build_array(
      jsonb_build_object('fund_id', v_fund_a, 'direction', 'out', 'amount', 100),
      jsonb_build_object('fund_id', v_fund_b, 'direction', 'in', 'amount', 100)
    ), 'transfer', now() + interval '2 days'
  );
  v_transfer_id := (v_transfer->>'operation_id')::uuid;
  perform public.create_finance_correction(
    v_business, '87000000-0000-4000-8000-000000000005', 'transfer-to-c', v_transfer_id,
    jsonb_build_array(
      jsonb_build_object('fund_id', v_fund_a, 'direction', 'out', 'amount', 100),
      jsonb_build_object('fund_id', v_fund_c, 'direction', 'in', 'amount', 100)
    ), null, null, 'destination correction', now() + interval '4 days'
  );
  if public.finance_fund_balance(v_fund_b) <> 0
     or public.finance_fund_balance(v_fund_c) <> 100 then
    raise exception 'transfer destination correction failed';
  end if;
  begin
    perform public.edit_finance_transaction_metadata(
      v_business, gen_random_uuid(), 'transfer-category', v_transfer_id,
      'bad', v_income_category, 'business', now() + interval '4 days'
    );
    raise exception 'transfer category/area edit was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  v_transfer_negative := public.create_transfer(
    v_business, '88000000-0000-4000-8000-000000000009', 'negative-transfer',
    jsonb_build_array(
      jsonb_build_object('fund_id', v_fund_a, 'direction', 'out', 'amount', 50),
      jsonb_build_object('fund_id', v_fund_b, 'direction', 'in', 'amount', 50)
    ), 'negative transfer', now() + interval '2 days'
  );
  perform public.create_expense(
    v_business, '88000000-0000-4000-8000-000000000010', 'spend-transfer-destination',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_b, 'amount', 40)),
    v_expense_category, 'business', 'spent destination', now() + interval '2 days'
  );
  begin
    perform public.void_finance_operation(
      v_business, gen_random_uuid(), 'negative-transfer-void',
      (v_transfer_negative->>'operation_id')::uuid, 'would make destination negative'
    );
    raise exception 'negative destination transfer void was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%VOID_NEGATIVE_BALANCE%' then raise; end if;
  end;
end;
$$;

reset role;

-- Create an explicitly order-linked ledger fixture and reconciliation fixtures as database owner.
do $$
declare
  v_business constant uuid := '81000000-0000-4000-8000-000000000001';
  v_order_op uuid := '89000000-0000-4000-8000-000000000001';
  v_order_tx uuid := '89000000-0000-4000-8000-000000000002';
  v_recon_op uuid;
  v_recon_tx uuid;
  v_recon_entry uuid;
  v_recon_open uuid := '89000000-0000-4000-8000-000000000003';
  v_recon_second uuid := '89000000-0000-4000-8000-000000000004';
  v_recon_closed uuid := '89000000-0000-4000-8000-000000000005';
begin
  insert into public.finance_operations (
    id, business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    v_order_op, v_business, 'deposit', gen_random_uuid(), 'order-fixture', 'order fixture',
    '86000000-0000-4000-8000-000000000001'
  );
  insert into public.finance_transactions (
    id, business_id, operation_id, status, order_id, note, created_by
  ) values (
    v_order_tx, v_business, v_order_op, 'posted',
    '85000000-0000-4000-8000-000000000001', 'order fixture',
    '86000000-0000-4000-8000-000000000001'
  );
  insert into public.finance_transaction_entries (
    business_id, transaction_id, fund_id, direction, amount
  ) values (
    v_business, v_order_tx, '83000000-0000-4000-8000-000000000006', 'in', 10
  );

  select (public.create_income(
    v_business, '88000000-0000-4000-8000-000000000006', 'recon-target',
    jsonb_build_array(jsonb_build_object(
      'fund_id', '83000000-0000-4000-8000-000000000001'::uuid, 'amount', 25
    )), '84000000-0000-4000-8000-000000000001', 'business', 'recon target', now()
  )->>'operation_id')::uuid into v_recon_op;
  select id into v_recon_tx from public.finance_transactions where operation_id = v_recon_op;
  select id into v_recon_entry from public.finance_transaction_entries where transaction_id = v_recon_tx;

  insert into public.finance_reconciliations (
    id, business_id, account_id, status, statement_balance, opened_by
  ) values (
    v_recon_open, v_business, '82000000-0000-4000-8000-000000000001',
    'open', 0, '86000000-0000-4000-8000-000000000001'
  );
  insert into public.finance_reconciliation_entries (
    business_id, reconciliation_id, transaction_id, entry_id
  ) values (v_business, v_recon_open, v_recon_tx, v_recon_entry);

  insert into public.finance_reconciliations (
    id, business_id, account_id, status, statement_balance, opened_by
  ) values (
    v_recon_second, v_business, '82000000-0000-4000-8000-000000000001',
    'open', 0, '86000000-0000-4000-8000-000000000001'
  );
  begin
    insert into public.finance_reconciliation_entries (
      business_id, reconciliation_id, transaction_id, entry_id
    ) values (v_business, v_recon_second, v_recon_tx, v_recon_entry);
    raise exception 'entry was linked to two reconciliations' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;

  perform public.create_income(
    v_business, '88000000-0000-4000-8000-000000000007', 'closed-period-target',
    jsonb_build_array(jsonb_build_object(
      'fund_id', '83000000-0000-4000-8000-000000000001'::uuid, 'amount', 15
    )), '84000000-0000-4000-8000-000000000001', 'business', 'closed period', now()
  );
  insert into public.finance_reconciliations (
    id, business_id, account_id, status, statement_balance,
    opened_by, closed_by, opened_at, closed_at
  ) values (
    v_recon_closed, v_business, '82000000-0000-4000-8000-000000000001',
    'closed', 0,
    '86000000-0000-4000-8000-000000000001',
    '86000000-0000-4000-8000-000000000001',
    now() - interval '1 day', now() + interval '1 day'
  );
end;
$$;

set local role authenticated;
do $$
declare
  v_business constant uuid := '81000000-0000-4000-8000-000000000001';
  v_recon_op uuid;
  v_closed_period_op uuid;
  v_balance numeric;
  v_paid numeric;
  v_released numeric;
  v_committed numeric;
  v_variance numeric;
begin
  perform set_config('request.jwt.claim.sub', '86000000-0000-4000-8000-000000000001', true);
  select id into v_recon_op from public.finance_operations where client_request_id = '88000000-0000-4000-8000-000000000006';
  select id into v_closed_period_op from public.finance_operations where client_request_id = '88000000-0000-4000-8000-000000000007';

  begin
    perform public.edit_finance_transaction_metadata(
      v_business, gen_random_uuid(), 'draft-edit', v_recon_op,
      'blocked', '84000000-0000-4000-8000-000000000001', 'business', now() + interval '2 days'
    );
    raise exception 'metadata edit with reconciliation link was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.void_finance_operation(
      v_business, gen_random_uuid(), 'draft-void', v_recon_op, 'blocked'
    );
    raise exception 'void with reconciliation link was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  -- A compensating correction remains valid despite the original draft link.
  v_balance := public.finance_fund_balance('83000000-0000-4000-8000-000000000001');
  perform public.create_finance_correction(
    v_business, gen_random_uuid(), 'linked-correction', v_recon_op,
    jsonb_build_array(jsonb_build_object(
      'fund_id', '83000000-0000-4000-8000-000000000001'::uuid, 'amount', 20
    )), '84000000-0000-4000-8000-000000000001', 'business', 'compensate', now() + interval '2 days'
  );
  if public.finance_fund_balance('83000000-0000-4000-8000-000000000001') <> v_balance - 5 then
    raise exception 'correction of reconciled-linked original failed';
  end if;

  begin
    perform public.create_finance_correction(
      v_business, gen_random_uuid(), 'correction-in-closed-period', v_recon_op,
      jsonb_build_array(jsonb_build_object(
        'fund_id', '83000000-0000-4000-8000-000000000001'::uuid, 'amount', 18
      )), '84000000-0000-4000-8000-000000000001', 'business', 'blocked', now()
    );
    raise exception 'correction in closed period was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%closed reconciliation period%' then raise; end if;
  end;
  begin
    perform public.edit_finance_transaction_metadata(
      v_business, gen_random_uuid(), 'metadata-closed-period', v_closed_period_op,
      'blocked', '84000000-0000-4000-8000-000000000001', 'business', now() + interval '2 days'
    );
    raise exception 'metadata edit of closed-period operation was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%closed reconciliation period%' then raise; end if;
  end;
  begin
    perform public.void_finance_operation(
      v_business, gen_random_uuid(), 'void-closed-period', v_closed_period_op, 'blocked'
    );
    raise exception 'void of closed-period operation was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%closed reconciliation period%' then raise; end if;
  end;

  select public.order_paid_net('85000000-0000-4000-8000-000000000001'),
         public.order_released_amount('85000000-0000-4000-8000-000000000001'),
         public.order_committed_amount('85000000-0000-4000-8000-000000000001'),
         public.order_protection_variance('85000000-0000-4000-8000-000000000001')
  into v_paid, v_released, v_committed, v_variance;

  foreach v_recon_op in array array[
    '89000000-0000-4000-8000-000000000001'::uuid
  ]
  loop
    begin
      perform public.edit_finance_transaction_metadata(
        v_business, gen_random_uuid(), 'order-edit', v_recon_op,
        'blocked', null, 'business', now()
      );
      raise exception 'order-linked metadata edit was accepted' using errcode = 'ZX001';
    exception when sqlstate 'P0001' then null;
    end;
    begin
      perform public.void_finance_operation(
        v_business, gen_random_uuid(), 'order-void', v_recon_op, 'blocked'
      );
      raise exception 'order-linked void was accepted' using errcode = 'ZX001';
    exception when sqlstate 'P0001' then null;
    end;
    begin
      perform public.create_finance_correction(
        v_business, gen_random_uuid(), 'order-correction', v_recon_op,
        jsonb_build_array(jsonb_build_object(
          'fund_id', '83000000-0000-4000-8000-000000000006'::uuid, 'amount', 10
        )), null, 'business', 'blocked', now()
      );
      raise exception 'order-linked correction was accepted' using errcode = 'ZX001';
    exception when sqlstate 'P0001' then null;
    end;
  end loop;

  if public.order_paid_net('85000000-0000-4000-8000-000000000001') <> v_paid
     or public.order_released_amount('85000000-0000-4000-8000-000000000001') <> v_released
     or public.order_committed_amount('85000000-0000-4000-8000-000000000001') <> v_committed
     or public.order_protection_variance('85000000-0000-4000-8000-000000000001') <> v_variance then
    raise exception 'general correction APIs changed order finance invariants';
  end if;
end;
$$;

select extensions.pass('Phase 3A metadata, void, correction, provenance, reconciliation and order boundaries hold');
select * from extensions.finish();
rollback;
