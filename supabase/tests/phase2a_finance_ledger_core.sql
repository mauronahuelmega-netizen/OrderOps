-- Phase 2A ledger core coverage. Runs transactionally against local Supabase.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business_a constant uuid := '41000000-0000-4000-8000-000000000001';
  v_business_b constant uuid := '41000000-0000-4000-8000-000000000002';
  v_account_a1 constant uuid := '42000000-0000-4000-8000-000000000001';
  v_account_a2 constant uuid := '42000000-0000-4000-8000-000000000002';
  v_account_b constant uuid := '42000000-0000-4000-8000-000000000003';
  v_fund_source constant uuid := '43000000-0000-4000-8000-000000000001';
  v_fund_destination constant uuid := '43000000-0000-4000-8000-000000000002';
  v_fund_committed constant uuid := '43000000-0000-4000-8000-000000000003';
  v_fund_b constant uuid := '43000000-0000-4000-8000-000000000004';
  v_income_category constant uuid := '44000000-0000-4000-8000-000000000001';
  v_expense_category constant uuid := '44000000-0000-4000-8000-000000000002';
  v_category_b constant uuid := '44000000-0000-4000-8000-000000000003';
  v_order constant uuid := '45000000-0000-4000-8000-000000000001';
begin
  if exists (select 1 from public.finance_operations)
     or exists (select 1 from public.finance_transactions)
     or exists (select 1 from public.finance_transaction_entries)
     or exists (select 1 from public.finance_audit_events)
     or exists (select 1 from public.order_financials) then
    raise exception 'clean reset contains finance data';
  end if;

  insert into public.businesses (id, name, slug, whatsapp_number)
  values
    (v_business_a, 'Phase 2A A', 'phase-2a-a', '5491100000201'),
    (v_business_b, 'Phase 2A B', 'phase-2a-b', '5491100000202');

  if exists (
    select 1 from public.business_settings
    where business_id in (v_business_a, v_business_b) and finance_enabled
  ) then
    raise exception 'finance_enabled did not default to false';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
    email, 'test-only', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  from (values
    ('46000000-0000-4000-8000-000000000001'::uuid, 'owner@phase2a.test'),
    ('46000000-0000-4000-8000-000000000002'::uuid, 'admin@phase2a.test'),
    ('46000000-0000-4000-8000-000000000003'::uuid, 'manager@phase2a.test'),
    ('46000000-0000-4000-8000-000000000004'::uuid, 'operator@phase2a.test'),
    ('46000000-0000-4000-8000-000000000005'::uuid, 'viewer@phase2a.test'),
    ('46000000-0000-4000-8000-000000000006'::uuid, 'owner-b@phase2a.test')
  ) as users(id, email);

  insert into public.profiles (id, business_id, role)
  values
    ('46000000-0000-4000-8000-000000000001', v_business_a, 'owner'),
    ('46000000-0000-4000-8000-000000000002', v_business_a, 'admin'),
    ('46000000-0000-4000-8000-000000000003', v_business_a, 'manager'),
    ('46000000-0000-4000-8000-000000000004', v_business_a, 'operator'),
    ('46000000-0000-4000-8000-000000000005', v_business_a, 'viewer'),
    ('46000000-0000-4000-8000-000000000006', v_business_b, 'owner');

  insert into public.finance_accounts (id, business_id, name, kind)
  values
    (v_account_a1, v_business_a, 'Phase 2A cash', 'cash'),
    (v_account_a2, v_business_a, 'Phase 2A reserve', 'other'),
    (v_account_b, v_business_b, 'Phase 2A tenant B', 'cash');

  insert into public.finance_categories (id, business_id, name, area, kind)
  values
    (v_income_category, v_business_a, 'Phase 2A income', 'business', 'income'),
    (v_expense_category, v_business_a, 'Phase 2A expense', 'business', 'expense'),
    (v_category_b, v_business_b, 'Phase 2A tenant B income', 'business', 'income');

  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint
  ) values
    (v_fund_source, v_business_a, v_account_a1, 'Phase 2A source', 'business_operating', 'business'),
    (v_fund_destination, v_business_a, v_account_a2, 'Phase 2A destination', 'family', 'family'),
    (v_fund_b, v_business_b, v_account_b, 'Phase 2A tenant B fund', 'business_operating', 'business');

  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method,
    composition_status, total_price, order_code
  ) values (
    v_order, v_business_a, 'Committed fixture', '5491100000201', current_date,
    'pickup', 'legacy_unknown', null, 'P2ACMT'
  );
  insert into public.order_financials (order_id, business_id, agreed_total)
  values (v_order, v_business_a, 100);
  insert into public.business_finance_settings (business_id, protection_account_id)
  values (v_business_a, v_account_a2);
  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint, order_id
  ) values (
    v_fund_committed, v_business_a, v_account_a2, 'Phase 2A committed',
    'committed', 'business', v_order
  );
end;
$$;

set local role authenticated;

do $$
declare
  v_business_a constant uuid := '41000000-0000-4000-8000-000000000001';
  v_fund_source constant uuid := '43000000-0000-4000-8000-000000000001';
begin
  begin
    perform public.create_income(
      v_business_a, gen_random_uuid(), 'no-auth',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 1))
    );
    raise exception 'unauthenticated request was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '46000000-0000-4000-8000-000000000001', true);
  begin
    perform public.create_income(
      v_business_a, gen_random_uuid(), 'disabled',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 1))
    );
    raise exception 'finance-disabled request was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  if exists (select 1 from public.finance_operations where business_id = v_business_a) then
    raise exception 'rejected auth/feature requests left operations';
  end if;
end;
$$;

reset role;
update public.business_settings
set timezone = 'UTC', finance_enabled = true
where business_id = '41000000-0000-4000-8000-000000000001';
set local role authenticated;

do $$
declare
  v_business_a constant uuid := '41000000-0000-4000-8000-000000000001';
  v_business_b constant uuid := '41000000-0000-4000-8000-000000000002';
  v_account_a1 constant uuid := '42000000-0000-4000-8000-000000000001';
  v_account_a2 constant uuid := '42000000-0000-4000-8000-000000000002';
  v_fund_source constant uuid := '43000000-0000-4000-8000-000000000001';
  v_fund_destination constant uuid := '43000000-0000-4000-8000-000000000002';
  v_fund_committed constant uuid := '43000000-0000-4000-8000-000000000003';
  v_fund_b constant uuid := '43000000-0000-4000-8000-000000000004';
  v_income_category constant uuid := '44000000-0000-4000-8000-000000000001';
  v_expense_category constant uuid := '44000000-0000-4000-8000-000000000002';
  v_category_b constant uuid := '44000000-0000-4000-8000-000000000003';
  v_request_id uuid := gen_random_uuid();
  v_result jsonb;
  v_replay jsonb;
  v_operations_before bigint;
  v_transactions_before bigint;
  v_entries_before bigint;
  v_audits_before bigint;
  v_total_before numeric;
  v_total_after numeric;
begin
  perform set_config('request.jwt.claim.sub', '46000000-0000-4000-8000-000000000005', true);
  begin
    perform public.create_income(
      v_business_a, gen_random_uuid(), 'viewer',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 1))
    );
    raise exception 'viewer write was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '46000000-0000-4000-8000-000000000001', true);
  begin
    perform public.create_income(
      v_business_b, gen_random_uuid(), 'cross-tenant',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_b, 'amount', 1))
    );
    raise exception 'cross-tenant write was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  foreach v_result in array array[
    jsonb_build_object('amount', 0),
    jsonb_build_object('amount', -1)
  ]
  loop
    begin
      perform public.create_income(
        v_business_a, gen_random_uuid(), 'bad-amount-' || (v_result->>'amount'),
        jsonb_build_array(jsonb_build_object(
          'fund_id', v_fund_source, 'amount', (v_result->>'amount')::numeric
        ))
      );
      raise exception 'non-positive income was accepted' using errcode = 'ZX001';
    exception when sqlstate '22023' then null;
    end;
  end loop;

  begin
    perform public.create_income(
      v_business_a, gen_random_uuid(), 'wrong-kind',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 1)),
      v_expense_category
    );
    raise exception 'incompatible income category was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.create_income(
      v_business_a, gen_random_uuid(), 'cross-category',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 1)),
      v_category_b
    );
    raise exception 'cross-tenant category was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.create_income(
      v_business_a, gen_random_uuid(), 'committed-income',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_committed, 'amount', 1)),
      v_income_category
    );
    raise exception 'committed income was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  v_result := public.create_income(
    v_business_a, v_request_id, 'income-seed-v1',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 1000)),
    v_income_category
  );
  if (v_result->>'idempotent')::boolean
     or (v_result->>'total')::numeric <> 1000
     or public.finance_fund_balance(v_fund_source) <> 1000
     or public.finance_account_balance(v_account_a1) <> 1000 then
    raise exception 'income did not produce exact balances';
  end if;

  select count(*) into v_operations_before from public.finance_operations;
  select count(*) into v_transactions_before from public.finance_transactions;
  select count(*) into v_entries_before from public.finance_transaction_entries;
  select count(*) into v_audits_before from public.finance_audit_events;

  v_replay := public.create_income(
    v_business_a, v_request_id, 'income-seed-v1',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 1000)),
    v_income_category
  );
  if not (v_replay->>'idempotent')::boolean
     or v_replay->>'operation_id' <> v_result->>'operation_id'
     or (select count(*) from public.finance_operations) <> v_operations_before
     or (select count(*) from public.finance_transactions) <> v_transactions_before
     or (select count(*) from public.finance_transaction_entries) <> v_entries_before
     or (select count(*) from public.finance_audit_events) <> v_audits_before
     or public.finance_fund_balance(v_fund_source) <> 1000 then
    raise exception 'idempotent replay duplicated effects';
  end if;

  begin
    perform public.create_income(
      v_business_a, v_request_id, 'income-seed-v2',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 2)),
      v_income_category
    );
    raise exception 'idempotency conflict was accepted' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;
  if public.finance_fund_balance(v_fund_source) <> 1000 then
    raise exception 'idempotency conflict changed balance';
  end if;

  foreach v_result in array array[
    jsonb_build_object('amount', 0),
    jsonb_build_object('amount', -1)
  ]
  loop
    begin
      perform public.create_expense(
        v_business_a, gen_random_uuid(), 'bad-expense-' || (v_result->>'amount'),
        jsonb_build_array(jsonb_build_object(
          'fund_id', v_fund_source, 'amount', (v_result->>'amount')::numeric
        )),
        v_expense_category
      );
      raise exception 'non-positive expense was accepted' using errcode = 'ZX001';
    exception when sqlstate '22023' then null;
    end;
  end loop;

  v_result := public.create_expense(
    v_business_a, gen_random_uuid(), 'expense-v1',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 100)),
    v_expense_category
  );
  if (v_result->>'total')::numeric <> 100
     or public.finance_fund_balance(v_fund_source) <> 900 then
    raise exception 'expense did not reduce the fund exactly';
  end if;

  select count(*) into v_operations_before from public.finance_operations;
  select count(*) into v_transactions_before from public.finance_transactions;
  select count(*) into v_entries_before from public.finance_transaction_entries;
  select count(*) into v_audits_before from public.finance_audit_events;
  begin
    perform public.create_expense(
      v_business_a, gen_random_uuid(), 'insufficient',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_source, 'amount', 901)),
      v_expense_category
    );
    raise exception 'insufficient expense was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_operations_before
     or (select count(*) from public.finance_transactions) <> v_transactions_before
     or (select count(*) from public.finance_transaction_entries) <> v_entries_before
     or (select count(*) from public.finance_audit_events) <> v_audits_before
     or public.finance_fund_balance(v_fund_source) <> 900 then
    raise exception 'failed expense left partial effects';
  end if;

  begin
    perform public.create_expense(
      v_business_a, gen_random_uuid(), 'committed-expense',
      jsonb_build_array(jsonb_build_object('fund_id', v_fund_committed, 'amount', 1)),
      v_expense_category
    );
    raise exception 'committed expense was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  v_total_before := public.finance_account_balance(v_account_a1)
    + public.finance_account_balance(v_account_a2);
  v_result := public.create_transfer(
    v_business_a, gen_random_uuid(), 'transfer-v1',
    jsonb_build_array(
      jsonb_build_object('fund_id', v_fund_source, 'direction', 'out', 'amount', 200),
      jsonb_build_object('fund_id', v_fund_destination, 'direction', 'in', 'amount', 200)
    )
  );
  v_total_after := public.finance_account_balance(v_account_a1)
    + public.finance_account_balance(v_account_a2);
  if (v_result->>'total')::numeric <> 200
     or public.finance_fund_balance(v_fund_source) <> 700
     or public.finance_fund_balance(v_fund_destination) <> 200
     or v_total_before <> v_total_after then
    raise exception 'transfer did not preserve total managed balance';
  end if;
  if (select count(*) from public.finance_transaction_entries
      where transaction_id = (v_result->>'transaction_id')::uuid
        and fund_id = v_fund_source and direction = 'out' and amount = 200) <> 1
     or (select count(*) from public.finance_transaction_entries
         where transaction_id = (v_result->>'transaction_id')::uuid
           and fund_id = v_fund_destination and direction = 'in' and amount = 200) <> 1 then
    raise exception 'transfer did not create exactly one OUT and one IN entry';
  end if;

  foreach v_result in array array[
    jsonb_build_object('amount', 0),
    jsonb_build_object('amount', -1)
  ]
  loop
    begin
      perform public.create_transfer(
        v_business_a, gen_random_uuid(), 'bad-transfer-' || (v_result->>'amount'),
        jsonb_build_array(
          jsonb_build_object(
            'fund_id', v_fund_source, 'direction', 'out',
            'amount', (v_result->>'amount')::numeric
          ),
          jsonb_build_object(
            'fund_id', v_fund_destination, 'direction', 'in',
            'amount', (v_result->>'amount')::numeric
          )
        )
      );
      raise exception 'non-positive transfer was accepted' using errcode = 'ZX001';
    exception when sqlstate '22023' then null;
    end;
  end loop;

  select count(*) into v_operations_before from public.finance_operations;
  select count(*) into v_transactions_before from public.finance_transactions;
  select count(*) into v_entries_before from public.finance_transaction_entries;
  select count(*) into v_audits_before from public.finance_audit_events;
  begin
    perform public.create_transfer(
      v_business_a, gen_random_uuid(), 'transfer-insufficient',
      jsonb_build_array(
        jsonb_build_object('fund_id', v_fund_source, 'direction', 'out', 'amount', 701),
        jsonb_build_object('fund_id', v_fund_destination, 'direction', 'in', 'amount', 701)
      )
    );
    raise exception 'insufficient transfer was accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  if (select count(*) from public.finance_operations) <> v_operations_before
     or (select count(*) from public.finance_transactions) <> v_transactions_before
     or (select count(*) from public.finance_transaction_entries) <> v_entries_before
     or (select count(*) from public.finance_audit_events) <> v_audits_before
     or public.finance_fund_balance(v_fund_source) <> 700
     or public.finance_fund_balance(v_fund_destination) <> 200 then
    raise exception 'failed transfer left partial effects';
  end if;

  begin
    perform public.create_transfer(
      v_business_a, gen_random_uuid(), 'same-fund',
      jsonb_build_array(
        jsonb_build_object('fund_id', v_fund_source, 'direction', 'out', 'amount', 1),
        jsonb_build_object('fund_id', v_fund_source, 'direction', 'in', 'amount', 1)
      )
    );
    raise exception 'same-fund transfer was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  begin
    perform public.create_transfer(
      v_business_a, gen_random_uuid(), 'cross-fund',
      jsonb_build_array(
        jsonb_build_object('fund_id', v_fund_source, 'direction', 'out', 'amount', 1),
        jsonb_build_object('fund_id', v_fund_b, 'direction', 'in', 'amount', 1)
      )
    );
    raise exception 'cross-tenant transfer was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  foreach v_result in array array[
    jsonb_build_object('source', v_fund_committed, 'destination', v_fund_destination),
    jsonb_build_object('source', v_fund_source, 'destination', v_fund_committed)
  ]
  loop
    begin
      perform public.create_transfer(
        v_business_a, gen_random_uuid(), 'committed-transfer-' || (v_result->>'source'),
        jsonb_build_array(
          jsonb_build_object('fund_id', v_result->>'source', 'direction', 'out', 'amount', 1),
          jsonb_build_object('fund_id', v_result->>'destination', 'direction', 'in', 'amount', 1)
        )
      );
      raise exception 'committed transfer was accepted' using errcode = 'ZX001';
    exception when sqlstate 'P0001' then null;
    end;
  end loop;

  perform set_config('request.jwt.claim.sub', '46000000-0000-4000-8000-000000000002', true);
  perform public.create_income(
    v_business_a, gen_random_uuid(), 'admin-operate',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_destination, 'amount', 10)),
    v_income_category
  );

  perform set_config('request.jwt.claim.sub', '46000000-0000-4000-8000-000000000003', true);
  perform public.create_expense(
    v_business_a, gen_random_uuid(), 'manager-operate',
    jsonb_build_array(jsonb_build_object('fund_id', v_fund_destination, 'amount', 10)),
    v_expense_category
  );

  perform set_config('request.jwt.claim.sub', '46000000-0000-4000-8000-000000000004', true);
  perform public.create_transfer(
    v_business_a, gen_random_uuid(), 'operator-operate',
    jsonb_build_array(
      jsonb_build_object('fund_id', v_fund_destination, 'direction', 'out', 'amount', 5),
      jsonb_build_object('fund_id', v_fund_source, 'direction', 'in', 'amount', 5)
    )
  );

  perform set_config('request.jwt.claim.sub', '46000000-0000-4000-8000-000000000001', true);
  if exists (
    select 1
    from public.finance_operations o
    where o.operation_type not in ('income', 'expense', 'transfer')
  ) or exists (
    select 1
    from public.finance_transactions t
    where t.status <> 'posted' or t.order_id is not null
  ) or exists (
    select 1
    from public.finance_transaction_entries e
    where e.amount <= 0
  ) then
    raise exception 'ledger rows violate Phase 2A posting contract';
  end if;

  if (select count(*) from public.finance_audit_events)
     <> (select count(*) from public.finance_operations) then
    raise exception 'successful operations are not audited exactly once';
  end if;

  begin
    insert into public.finance_operations (
      business_id, operation_type, client_request_id, request_hash, created_by
    ) values (
      v_business_a, 'income', gen_random_uuid(), 'direct', auth.uid()
    );
    raise exception 'direct ledger insert was accepted' using errcode = 'ZX001';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.finance_operations set note = 'direct';
    raise exception 'direct ledger update was accepted' using errcode = 'ZX001';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.finance_operations;
    raise exception 'direct ledger delete was accepted' using errcode = 'ZX001';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', '46000000-0000-4000-8000-000000000006', true);
  if exists (
    select 1 from public.finance_operations where business_id = v_business_a
  ) then
    raise exception 'tenant B can read tenant A ledger';
  end if;
  begin
    perform public.finance_fund_balance(v_fund_source);
    raise exception 'tenant B can read tenant A balance' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform public.create_income(
      '41000000-0000-4000-8000-000000000001', gen_random_uuid(), 'anon',
      '[{"fund_id":"43000000-0000-4000-8000-000000000001","amount":1}]'::jsonb
    );
    raise exception 'anon execute was accepted' using errcode = 'ZX001';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

select extensions.pass('Phase 2A general ledger RPCs, balances, idempotency, locks, permissions, and atomicity');
select * from extensions.finish();
rollback;
