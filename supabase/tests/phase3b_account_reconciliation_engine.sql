-- Phase 3B account reconciliation engine coverage. Transactional, local-only fixtures.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business_a constant uuid := '91000000-0000-4000-8000-000000000001';
  v_business_b constant uuid := '91000000-0000-4000-8000-000000000002';
begin
  if exists (select 1 from public.finance_reconciliations)
     or exists (select 1 from public.finance_reconciliation_commands)
     or exists (select 1 from public.finance_reconciliation_fund_snapshots) then
    raise exception 'clean reset contains reconciliation data';
  end if;

  insert into public.businesses (id, name, slug, whatsapp_number)
  values
    (v_business_a, 'Phase 3B A', 'phase-3b-a', '5491100000701'),
    (v_business_b, 'Phase 3B B', 'phase-3b-b', '5491100000702');

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
    email, 'test-only', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  from (values
    ('96000000-0000-4000-8000-000000000001'::uuid, 'owner@phase3b.test'),
    ('96000000-0000-4000-8000-000000000002'::uuid, 'admin@phase3b.test'),
    ('96000000-0000-4000-8000-000000000003'::uuid, 'manager@phase3b.test'),
    ('96000000-0000-4000-8000-000000000004'::uuid, 'operator@phase3b.test'),
    ('96000000-0000-4000-8000-000000000005'::uuid, 'viewer@phase3b.test'),
    ('96000000-0000-4000-8000-000000000006'::uuid, 'owner-b@phase3b.test')
  ) users(id, email);

  insert into public.profiles (id, business_id, role)
  values
    ('96000000-0000-4000-8000-000000000001', v_business_a, 'owner'),
    ('96000000-0000-4000-8000-000000000002', v_business_a, 'admin'),
    ('96000000-0000-4000-8000-000000000003', v_business_a, 'manager'),
    ('96000000-0000-4000-8000-000000000004', v_business_a, 'operator'),
    ('96000000-0000-4000-8000-000000000005', v_business_a, 'viewer'),
    ('96000000-0000-4000-8000-000000000006', v_business_b, 'owner');

  insert into public.finance_accounts (id, business_id, name, kind)
  values
    ('92000000-0000-4000-8000-000000000001', v_business_a, 'MP', 'mercado_pago'),
    ('92000000-0000-4000-8000-000000000002', v_business_a, 'Bank', 'other'),
    ('92000000-0000-4000-8000-000000000003', v_business_a, 'Admin empty', 'other'),
    ('92000000-0000-4000-8000-000000000004', v_business_a, 'Manager empty', 'other'),
    ('92000000-0000-4000-8000-000000000005', v_business_a, 'Cash', 'cash'),
    ('92000000-0000-4000-8000-000000000006', v_business_b, 'Tenant B', 'other');

  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint, active
  ) values
    ('93000000-0000-4000-8000-000000000001', v_business_a, '92000000-0000-4000-8000-000000000001', 'Operating', 'business_operating', 'business', true),
    ('93000000-0000-4000-8000-000000000002', v_business_a, '92000000-0000-4000-8000-000000000001', 'Inactive', 'business_operating', 'business', true),
    ('93000000-0000-4000-8000-000000000003', v_business_a, '92000000-0000-4000-8000-000000000001', 'Family', 'family', 'family', true),
    ('93000000-0000-4000-8000-000000000004', v_business_a, '92000000-0000-4000-8000-000000000001', 'Reserve', 'protected_reserve', 'business', true),
    ('93000000-0000-4000-8000-000000000005', v_business_a, '92000000-0000-4000-8000-000000000002', 'Bank operating', 'business_operating', 'business', true),
    ('93000000-0000-4000-8000-000000000006', v_business_a, '92000000-0000-4000-8000-000000000005', 'Cash operating', 'business_operating', 'business', true),
    ('93000000-0000-4000-8000-000000000007', v_business_b, '92000000-0000-4000-8000-000000000006', 'Tenant B fund', 'business_operating', 'business', true);

  insert into public.finance_categories (id, business_id, name, area, kind)
  values
    ('94000000-0000-4000-8000-000000000001', v_business_a, 'Income', 'business', 'income'),
    ('94000000-0000-4000-8000-000000000002', v_business_a, 'Expense', 'business', 'expense');
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform public.create_finance_reconciliation(
      '91000000-0000-4000-8000-000000000001',
      '92000000-0000-4000-8000-000000000001',
      '2030-09-30 23:59:59+00', 0, null, gen_random_uuid(), 'no-auth'
    );
    raise exception 'unauthenticated reconciliation was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '96000000-0000-4000-8000-000000000006', true);
  begin
    perform public.create_finance_reconciliation(
      '91000000-0000-4000-8000-000000000002',
      '92000000-0000-4000-8000-000000000006',
      '2030-09-30 23:59:59+00', 0, null, gen_random_uuid(), 'disabled'
    );
    raise exception 'finance-disabled reconciliation was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;
end;
$$;
reset role;

update public.business_settings
set timezone = 'UTC', finance_enabled = true
where business_id = '91000000-0000-4000-8000-000000000001';

set local role authenticated;
do $$
declare
  v_business constant uuid := '91000000-0000-4000-8000-000000000001';
  v_account_mp constant uuid := '92000000-0000-4000-8000-000000000001';
  v_account_bank constant uuid := '92000000-0000-4000-8000-000000000002';
  v_cutoff constant timestamptz := '2030-09-30 23:59:59+00';
begin
  perform set_config('request.jwt.claim.sub', '96000000-0000-4000-8000-000000000004', true);
  begin
    perform public.create_finance_reconciliation(
      v_business, v_account_mp, v_cutoff, 0, null, gen_random_uuid(), 'operator'
    );
    raise exception 'operator reconciliation was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '96000000-0000-4000-8000-000000000005', true);
  begin
    perform public.create_finance_reconciliation(
      v_business, v_account_mp, v_cutoff, 0, null, gen_random_uuid(), 'viewer'
    );
    raise exception 'viewer reconciliation was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', '96000000-0000-4000-8000-000000000001', true);
  begin
    perform public.create_finance_reconciliation(
      '91000000-0000-4000-8000-000000000002',
      '92000000-0000-4000-8000-000000000006',
      v_cutoff, 0, null, gen_random_uuid(), 'cross-tenant'
    );
    raise exception 'cross-tenant reconciliation was accepted' using errcode = 'ZX001';
  exception when sqlstate '42501' then null;
  end;

  begin
    perform public.create_finance_reconciliation(
      v_business, '92000000-0000-4000-8000-000000000006',
      v_cutoff, 0, null, gen_random_uuid(), 'wrong-account'
    );
    raise exception 'foreign account was accepted' using errcode = 'ZX001';
  exception when sqlstate '22023' then null;
  end;

  -- Two additional empty accounts prove admin/manager capability independently.
  perform set_config('request.jwt.claim.sub', '96000000-0000-4000-8000-000000000002', true);
  perform public.create_finance_reconciliation(
    v_business, '92000000-0000-4000-8000-000000000003', v_cutoff, 0,
    'admin', gen_random_uuid(), 'admin-open'
  );
  perform set_config('request.jwt.claim.sub', '96000000-0000-4000-8000-000000000003', true);
  perform public.create_finance_reconciliation(
    v_business, '92000000-0000-4000-8000-000000000004', v_cutoff, 0,
    'manager', gen_random_uuid(), 'manager-open'
  );
end;
$$;

-- Build a varied ledger through real Phase 2A RPCs.
do $$
declare
  v_business constant uuid := '91000000-0000-4000-8000-000000000001';
  v_income_category constant uuid := '94000000-0000-4000-8000-000000000001';
  v_expense_category constant uuid := '94000000-0000-4000-8000-000000000002';
  v_result jsonb;
begin
  perform set_config('request.jwt.claim.sub', '96000000-0000-4000-8000-000000000001', true);
  perform public.create_income(v_business, gen_random_uuid(), 'base-income',
    jsonb_build_array(jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 100)),
    v_income_category, 'business', 'base', '2030-09-20 12:00+00');
  perform public.create_expense(v_business, gen_random_uuid(), 'base-expense',
    jsonb_build_array(jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 20)),
    v_expense_category, 'business', 'expense', '2030-09-21 12:00+00');
  perform public.create_income(v_business, gen_random_uuid(), 'inactive-income',
    jsonb_build_array(jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000002', 'amount', 10)),
    v_income_category, 'business', 'inactive', '2030-09-22 12:00+00');
  perform public.create_income(v_business, gen_random_uuid(), 'family-income',
    jsonb_build_array(jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000003', 'amount', 5)),
    null, 'family', 'family', '2030-09-23 12:00+00');
  perform public.create_income(v_business, gen_random_uuid(), 'reserve-income',
    jsonb_build_array(jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000004', 'amount', 5)),
    v_income_category, 'business', 'reserve', '2030-09-24 12:00+00');
  perform public.create_transfer(v_business, gen_random_uuid(), 'internal-transfer',
    jsonb_build_array(
      jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000001', 'direction', 'out', 'amount', 10),
      jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000003', 'direction', 'in', 'amount', 10)
    ), 'internal', '2030-09-25 12:00+00');
  perform public.create_transfer(v_business, gen_random_uuid(), 'cross-account-transfer',
    jsonb_build_array(
      jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000001', 'direction', 'out', 'amount', 15),
      jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000005', 'direction', 'in', 'amount', 15)
    ), 'cross', '2030-09-26 12:00+00');
  perform public.create_income(v_business, gen_random_uuid(), 'future-income',
    jsonb_build_array(jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 50)),
    v_income_category, 'business', 'future', '2030-10-01 12:00+00');

  v_result := public.create_income(v_business, gen_random_uuid(), 'voided-income',
    jsonb_build_array(jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 7)),
    v_income_category, 'business', 'void me', '2030-09-27 12:00+00');
  perform public.void_finance_operation(
    v_business, gen_random_uuid(), 'void-before-recon',
    (v_result->>'operation_id')::uuid, 'fixture void'
  );
end;
$$;
reset role;

-- A committed/order-linked balance is inserted as a controlled ledger fixture.
do $$
declare
  v_business constant uuid := '91000000-0000-4000-8000-000000000001';
  v_order constant uuid := '95000000-0000-4000-8000-000000000001';
  v_operation uuid := gen_random_uuid();
  v_transaction uuid := gen_random_uuid();
begin
  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method,
    composition_status, total_price, order_code
  ) values (
    v_order, v_business, 'Committed reconciliation', '5491100000701',
    current_date, 'pickup', 'legacy_unknown', null, 'P3BREC'
  );
  insert into public.order_financials (order_id, business_id, agreed_total)
  values (v_order, v_business, 30);
  insert into public.finance_funds (
    id, business_id, account_id, name, fund_type, area_hint, order_id
  ) values (
    '93000000-0000-4000-8000-000000000008', v_business,
    '92000000-0000-4000-8000-000000000001', 'Committed',
    'committed', 'business', v_order
  );
  insert into public.finance_operations (
    id, business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    v_operation, v_business, 'deposit', gen_random_uuid(), 'committed-fixture',
    'committed fixture', '96000000-0000-4000-8000-000000000001'
  );
  insert into public.finance_transactions (
    id, business_id, operation_id, status, order_id, occurred_at, note, created_by
  ) values (
    v_transaction, v_business, v_operation, 'posted', v_order,
    '2030-09-24 13:00+00', 'committed fixture',
    '96000000-0000-4000-8000-000000000001'
  );
  insert into public.finance_transaction_entries (
    business_id, transaction_id, fund_id, direction, amount
  ) values (
    v_business, v_transaction, '93000000-0000-4000-8000-000000000008', 'in', 30
  );
  update public.finance_funds set active = false
  where id = '93000000-0000-4000-8000-000000000002';
end;
$$;

set local role authenticated;
do $$
declare
  v_business constant uuid := '91000000-0000-4000-8000-000000000001';
  v_account constant uuid := '92000000-0000-4000-8000-000000000001';
  v_cutoff constant timestamptz := '2030-09-30 23:59:59+00';
  v_create_request constant uuid := '97000000-0000-4000-8000-000000000001';
  v_close_request constant uuid := '97000000-0000-4000-8000-000000000002';
  v_reconciliation uuid;
  v_result jsonb;
  v_replay jsonb;
  v_summary jsonb;
  v_tx uuid;
  v_internal_tx uuid;
  v_cross_tx uuid;
  v_internal_add_request uuid := gen_random_uuid();
  v_internal_remove_request uuid := gen_random_uuid();
  v_audits bigint;
  v_commands bigint;
  v_operations bigint;
  v_snapshots jsonb;
  v_order_summary_before jsonb;
  v_order_summary_after jsonb;
  v_next_reconciliation uuid;
begin
  perform set_config('request.jwt.claim.sub', '96000000-0000-4000-8000-000000000001', true);

  if public.finance_account_balance_at(v_account, v_cutoff) <> 115
     or public.finance_fund_balance_at('93000000-0000-4000-8000-000000000001', v_cutoff) <> 55
     or public.finance_account_balance_at(v_account, '2030-09-19 23:59+00') <> 0 then
    raise exception 'historical account/fund balances are incorrect';
  end if;

  v_result := public.create_finance_reconciliation(
    v_business, v_account, v_cutoff, 115, 'September', v_create_request, 'create-v1'
  );
  v_reconciliation := (v_result->>'reconciliation_id')::uuid;
  if (v_result->>'idempotent')::boolean
     or exists (
       select 1 from public.finance_reconciliation_fund_snapshots
       where reconciliation_id = v_reconciliation
     ) then
    raise exception 'open reconciliation created snapshots or wrong result';
  end if;
  v_replay := public.create_finance_reconciliation(
    v_business, v_account, v_cutoff, 115, 'September', v_create_request, 'create-v1'
  );
  if not (v_replay->>'idempotent')::boolean
     or v_replay->>'reconciliation_id' <> v_reconciliation::text then
    raise exception 'create reconciliation retry failed';
  end if;
  begin
    perform public.create_finance_reconciliation(
      v_business, v_account, v_cutoff, 114, 'conflict', v_create_request, 'create-v2'
    );
    raise exception 'create idempotency conflict accepted' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;
  begin
    perform public.create_finance_reconciliation(
      v_business, v_account, v_cutoff + interval '1 day', 115, null,
      gen_random_uuid(), 'duplicate-open'
    );
    raise exception 'duplicate open reconciliation accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  v_summary := public.finance_reconciliation_summary(v_reconciliation);
  if (v_summary->>'expected_balance')::numeric <> 115
     or (v_summary->>'difference')::numeric <> 0
     or (v_summary->>'pending_entry_count')::integer <> 9
     or jsonb_array_length(v_summary->'fund_snapshots') <> 0 then
    raise exception 'open reconciliation read model is incorrect: %', v_summary;
  end if;

  v_result := public.update_finance_reconciliation(
    v_business, v_reconciliation, 114, 'drift', gen_random_uuid(), 'update-drift'
  );
  if not (v_result->>'changed')::boolean then raise exception 'update did not change state'; end if;
  begin
    perform public.close_finance_reconciliation(
      v_business, v_reconciliation, gen_random_uuid(), 'close-drift'
    );
    raise exception 'nonzero difference close accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%RECONCILIATION_DIFFERENCE_NONZERO%' then raise; end if;
  end;
  if exists (
    select 1 from public.finance_reconciliation_fund_snapshots
    where reconciliation_id = v_reconciliation
  ) then raise exception 'failed drift close left snapshots'; end if;
  perform public.update_finance_reconciliation(
    v_business, v_reconciliation, 115, 'ready', gen_random_uuid(), 'update-ready'
  );

  -- Include every eligible transaction. Internal transfer contributes two entries;
  -- cross-account transfer contributes only the target-account side.
  for v_tx in
    select distinct t.id
    from public.finance_transactions t
    join public.finance_transaction_entries e on e.transaction_id = t.id and e.business_id = t.business_id
    join public.finance_funds f on f.id = e.fund_id and f.business_id = e.business_id
    where t.business_id = v_business and t.status = 'posted'
      and t.occurred_at <= v_cutoff and f.account_id = v_account
    order by t.id
  loop
    perform public.add_finance_reconciliation_transaction(
      v_business, v_reconciliation, v_tx, gen_random_uuid(), 'add-' || v_tx::text
    );
  end loop;

  select t.id into v_internal_tx from public.finance_transactions t
  join public.finance_operations o on o.id = t.operation_id and o.business_id = t.business_id
  where o.request_hash = 'internal-transfer';
  select t.id into v_cross_tx from public.finance_transactions t
  join public.finance_operations o on o.id = t.operation_id and o.business_id = t.business_id
  where o.request_hash = 'cross-account-transfer';
  if (select count(*) from public.finance_reconciliation_entries
      where reconciliation_id = v_reconciliation and transaction_id = v_internal_tx) <> 2
     or (select count(*) from public.finance_reconciliation_entries
      where reconciliation_id = v_reconciliation and transaction_id = v_cross_tx) <> 1 then
    raise exception 'transaction/account atomic membership failed';
  end if;

  v_result := public.add_finance_reconciliation_transaction(
    v_business, v_reconciliation, v_internal_tx, v_internal_add_request, 'add-noop'
  );
  if (v_result->>'changed')::boolean or (v_result->>'added_count')::integer <> 0 then
    raise exception 'new add command over reached state created false effects';
  end if;
  v_replay := public.add_finance_reconciliation_transaction(
    v_business, v_reconciliation, v_internal_tx, v_internal_add_request, 'add-noop'
  );
  if not (v_replay->>'idempotent')::boolean then
    raise exception 'add command retry was not idempotent';
  end if;

  begin
    perform public.add_finance_reconciliation_transaction(
      v_business, v_reconciliation,
      (select t.id from public.finance_transactions t
       join public.finance_operations o on o.id = t.operation_id and o.business_id = t.business_id
       where o.request_hash = 'future-income'),
      gen_random_uuid(), 'after-cutoff'
    );
    raise exception 'after-cutoff transaction was included' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  v_summary := public.finance_reconciliation_summary(v_reconciliation);
  if (v_summary->>'pending_entry_count')::integer <> 0
     or (v_summary->>'included_entry_count')::integer <> 9 then
    raise exception 'membership did not clear pending entries: %', v_summary;
  end if;

  perform public.remove_finance_reconciliation_transaction(
    v_business, v_reconciliation, v_internal_tx, v_internal_remove_request, 'remove-internal'
  );
  if (public.finance_reconciliation_summary(v_reconciliation)->>'pending_entry_count')::integer <> 2 then
    raise exception 'remove did not restore both internal-transfer entries to pending';
  end if;
  v_replay := public.remove_finance_reconciliation_transaction(
    v_business, v_reconciliation, v_internal_tx, v_internal_remove_request, 'remove-internal'
  );
  if not (v_replay->>'idempotent')::boolean then
    raise exception 'remove command retry was not idempotent';
  end if;
  v_result := public.remove_finance_reconciliation_transaction(
    v_business, v_reconciliation, v_internal_tx, gen_random_uuid(), 'remove-noop'
  );
  if (v_result->>'changed')::boolean or (v_result->>'removed_count')::integer <> 0 then
    raise exception 'new remove command over reached state created false effects';
  end if;
  perform public.add_finance_reconciliation_transaction(
    v_business, v_reconciliation, v_internal_tx, gen_random_uuid(), 'readd-internal'
  );

  -- A new eligible write while open becomes pending and blocks close.
  v_result := public.create_income(
    v_business, gen_random_uuid(), 'late-open-write',
    jsonb_build_array(jsonb_build_object(
      'fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 1
    )), '94000000-0000-4000-8000-000000000001', 'business',
    'late while open', '2030-09-28 12:00+00'
  );
  if (public.finance_reconciliation_summary(v_reconciliation)->>'pending_entry_count')::integer <> 1 then
    raise exception 'late open write did not become pending';
  end if;
  perform public.update_finance_reconciliation(
    v_business, v_reconciliation, 116, 'late included', gen_random_uuid(), 'update-116'
  );
  begin
    perform public.close_finance_reconciliation(
      v_business, v_reconciliation, gen_random_uuid(), 'close-pending'
    );
    raise exception 'pending close accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%RECONCILIATION_PENDING_ENTRIES%' then raise; end if;
  end;
  perform public.add_finance_reconciliation_transaction(
    v_business, v_reconciliation, (v_result->>'transaction_id')::uuid,
    gen_random_uuid(), 'add-late-open'
  );

  select count(*) into v_operations from public.finance_operations;
  select count(*) into v_audits from public.finance_audit_events;
  v_order_summary_before := public.order_financial_summary(
    '95000000-0000-4000-8000-000000000001'
  );
  v_result := public.close_finance_reconciliation(
    v_business, v_reconciliation, v_close_request, 'close-v1'
  );
  if (v_result->>'system_balance')::numeric <> 116
     or (select status from public.finance_reconciliations where id = v_reconciliation) <> 'closed'
     or (select closed_at is null or closed_by is null from public.finance_reconciliations where id = v_reconciliation)
     or (select count(*) from public.finance_reconciliation_fund_snapshots where reconciliation_id = v_reconciliation) <> 5
     or (select count(*) from public.finance_operations) <> v_operations then
    raise exception 'happy-path close contract failed';
  end if;
  v_order_summary_after := public.order_financial_summary(
    '95000000-0000-4000-8000-000000000001'
  );
  if v_order_summary_after is distinct from v_order_summary_before
     or not exists (
       select 1 from public.finance_reconciliation_fund_snapshots
       where reconciliation_id = v_reconciliation
         and fund_id = '93000000-0000-4000-8000-000000000002'
         and balance = 10
     )
     or not exists (
       select 1 from public.finance_reconciliation_fund_snapshots
       where reconciliation_id = v_reconciliation
         and fund_id = '93000000-0000-4000-8000-000000000008'
         and balance = 30
     ) then
    raise exception 'close changed order finance or omitted inactive/committed snapshots';
  end if;

  v_summary := public.finance_reconciliation_summary(v_reconciliation);
  v_snapshots := v_summary->'fund_snapshots';
  if v_summary->>'status' <> 'closed'
     or (v_summary->>'expected_balance')::numeric <> 116
     or (v_summary->>'difference')::numeric <> 0
     or (v_summary->>'pending_entry_count')::integer <> 0
     or jsonb_array_length(v_snapshots) <> 5 then
    raise exception 'closed read model is incorrect: %', v_summary;
  end if;

  select count(*) into v_commands from public.finance_reconciliation_commands;
  v_replay := public.close_finance_reconciliation(
    v_business, v_reconciliation, v_close_request, 'close-v1'
  );
  if not (v_replay->>'idempotent')::boolean
     or (select count(*) from public.finance_reconciliation_commands) <> v_commands
     or (select count(*) from public.finance_audit_events) <> v_audits + 1 then
    raise exception 'close retry duplicated command/audit';
  end if;
  begin
    perform public.close_finance_reconciliation(
      v_business, v_reconciliation, gen_random_uuid(), 'different-close'
    );
    raise exception 'different request closed an already closed reconciliation' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  begin
    perform public.update_finance_reconciliation(
      v_business, v_reconciliation, 116, 'closed edit', gen_random_uuid(), 'closed-update'
    );
    raise exception 'closed reconciliation update accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.add_finance_reconciliation_transaction(
      v_business, v_reconciliation, v_internal_tx, gen_random_uuid(), 'closed-add'
    );
    raise exception 'closed reconciliation add accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.remove_finance_reconciliation_transaction(
      v_business, v_reconciliation, v_internal_tx, gen_random_uuid(), 'closed-remove'
    );
    raise exception 'closed reconciliation remove accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  -- Backdating into the closed cutoff is rejected atomically; future writes remain valid.
  select count(*) into v_operations from public.finance_operations;
  begin
    perform public.create_income(
      v_business, gen_random_uuid(), 'closed-income',
      jsonb_build_array(jsonb_build_object(
        'fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 2
      )), '94000000-0000-4000-8000-000000000001', 'business',
      'blocked', '2030-09-29 12:00+00'
    );
    raise exception 'backdated income accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%FINANCE_CLOSED_PERIOD%' then raise; end if;
  end;
  if (select count(*) from public.finance_operations) <> v_operations then
    raise exception 'rejected backdated writer left partial operation';
  end if;

  begin
    perform public.create_transfer(
      v_business, gen_random_uuid(), 'closed-transfer',
      jsonb_build_array(
        jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000001', 'direction', 'out', 'amount', 1),
        jsonb_build_object('fund_id', '93000000-0000-4000-8000-000000000005', 'direction', 'in', 'amount', 1)
      ), 'blocked', '2030-09-29 12:00+00'
    );
    raise exception 'backdated cross-account transfer accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  perform public.create_income(
    v_business, gen_random_uuid(), 'future-after-close',
    jsonb_build_array(jsonb_build_object(
      'fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 3
    )), '94000000-0000-4000-8000-000000000001', 'business',
    'future allowed', '2030-10-02 12:00+00'
  );
  if public.finance_reconciliation_summary(v_reconciliation)->>'expected_balance' <> '116.00' then
    raise exception 'future write changed frozen closed summary';
  end if;

  select t.id into v_tx
  from public.finance_transactions t
  join public.finance_operations o on o.id = t.operation_id and o.business_id = t.business_id
  where o.request_hash = 'base-income';
  begin
    perform public.edit_finance_transaction_metadata(
      v_business, gen_random_uuid(), 'closed-metadata',
      (select operation_id from public.finance_transactions where id = v_tx),
      'blocked', '94000000-0000-4000-8000-000000000001', 'business',
      '2030-10-03 12:00+00'
    );
    raise exception 'metadata edit of reconciled transaction accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.void_finance_operation(
      v_business, gen_random_uuid(), 'closed-void',
      (select operation_id from public.finance_transactions where id = v_tx), 'blocked'
    );
    raise exception 'void of reconciled transaction accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  begin
    perform public.create_finance_correction(
      v_business, gen_random_uuid(), 'closed-correction',
      (select operation_id from public.finance_transactions where id = v_tx),
      jsonb_build_array(jsonb_build_object(
        'fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 90
      )), '94000000-0000-4000-8000-000000000001', 'business',
      'blocked', '2030-09-29 12:00+00'
    );
    raise exception 'backdated correction accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%closed reconciliation period%'
       and sqlerrm not like '%FINANCE_CLOSED_PERIOD%' then raise; end if;
  end;

  perform public.create_finance_correction(
    v_business, gen_random_uuid(), 'future-correction',
    (select operation_id from public.finance_transactions where id = v_tx),
    jsonb_build_array(jsonb_build_object(
      'fund_id', '93000000-0000-4000-8000-000000000001', 'amount', 90
    )), '94000000-0000-4000-8000-000000000001', 'business',
    'future correction', '2030-10-03 12:00+00'
  );

  begin
    perform public.create_finance_reconciliation(
      v_business, v_account, v_cutoff, 116, null, gen_random_uuid(), 'old-cutoff'
    );
    raise exception 'cutoff at previous closed boundary accepted' using errcode = 'ZX001';
  exception when sqlstate 'P0001' then null;
  end;

  v_result := public.create_finance_reconciliation(
    v_business, v_account, '2030-10-31 23:59:59+00', 159,
    'October', gen_random_uuid(), 'october-open'
  );
  v_next_reconciliation := (v_result->>'reconciliation_id')::uuid;
  v_summary := public.finance_reconciliation_summary(v_next_reconciliation);
  if (v_summary->>'previous_cutoff')::timestamptz <> v_cutoff
     or (v_summary->>'expected_balance')::numeric <> 159
     or (v_summary->>'pending_entry_count')::integer <> 3 then
    raise exception 'future period/correction read model is incorrect: %', v_summary;
  end if;

  begin
    perform public.add_finance_reconciliation_transaction(
      v_business, v_next_reconciliation, v_internal_tx, gen_random_uuid(), 'already-linked'
    );
    raise exception 'entry linked to a prior reconciliation was accepted again' using errcode = 'ZX001';
  exception when unique_violation then null;
  end;

  -- Cash uses the same account engine with physical count as statement balance.
  v_result := public.create_finance_reconciliation(
    v_business, '92000000-0000-4000-8000-000000000005', v_cutoff, 0,
    'physical count', gen_random_uuid(), 'cash-open'
  );
  perform public.close_finance_reconciliation(
    v_business, (v_result->>'reconciliation_id')::uuid, gen_random_uuid(), 'cash-close'
  );

  if to_regprocedure('public.reopen_finance_reconciliation(uuid,uuid,uuid,text)') is not null then
    raise exception 'reopen reconciliation RPC exists unexpectedly';
  end if;
  if position('lock_finance_accounts' in pg_get_functiondef(
       'private.lock_finance_funds(uuid,uuid[])'::regprocedure
     )) = 0 then
    raise exception 'ledger writers do not share the account lock through fund locking';
  end if;
end;
$$;

select extensions.pass('Phase 3B cutoff, history, membership, close, guards, locks and immutability hold');
select * from extensions.finish();
rollback;
