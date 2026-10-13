-- P05-T02. Rolls back. Accrues nominal rights only when the RPC is called.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777701', 'authenticated', 'authenticated', 'phase05-finance-accrual@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777702', 'authenticated', 'authenticated', 'phase05-super-accrual@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777703', 'authenticated', 'authenticated', 'phase05-commercial-accrual@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777704', 'authenticated', 'authenticated', 'phase05-promoter-accrual@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('77777777-7777-4777-8777-777777777711', '77777777-7777-4777-8777-777777777701', 'internal'),
  ('77777777-7777-4777-8777-777777777712', '77777777-7777-4777-8777-777777777702', 'internal'),
  ('77777777-7777-4777-8777-777777777713', '77777777-7777-4777-8777-777777777703', 'internal'),
  ('77777777-7777-4777-8777-777777777714', '77777777-7777-4777-8777-777777777704', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('77777777-7777-4777-8777-777777777711', 'finance'),
  ('77777777-7777-4777-8777-777777777712', 'superadmin'),
  ('77777777-7777-4777-8777-777777777713', 'commercial');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('77777777-7777-4777-8777-777777777721', '77777777-7777-4777-8777-777777777714', 'pcom00000002', 'Promotor Accrual', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('77777777-7777-4777-8777-777777777731', 'Negocio Accrual A', 'negocio-accrual-a', '5491100000171');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('77777777-7777-4777-8777-777777777741', 'Lead Accrual A', 'lead accrual a', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('77777777-7777-4777-8777-777777777751', '77777777-7777-4777-8777-777777777741', 'demo_done', '77777777-7777-4777-8777-777777777714');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('77777777-7777-4777-8777-777777777761', '77777777-7777-4777-8777-777777777751', '77777777-7777-4777-8777-777777777721', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777702', true);

do $$
declare
  v_win jsonb;
  v_terms uuid;
  v_setup uuid;
  v_month uuid;
  v_blocked uuid;
  v_failed uuid;
  v_result jsonb;
  v_replay jsonb;
  v_row commercial.promoter_commissions%rowtype;
  v_count int;
begin
  v_win := commercial.win_opportunity(
    '77777777-7777-4777-8777-777777777751',
    '77777777-7777-4777-8777-777777777731',
    null
  );
  if v_win->>'status' is distinct from 'won' then
    raise exception 'win returned %', v_win;
  end if;
  if exists (select 1 from commercial.promoter_commissions) then
    raise exception 'win created a commission';
  end if;
  v_terms := (v_win->>'conversion_terms_id')::uuid;

  perform set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777701', true);
  v_result := public.open_obligation(v_terms, 'setup', null);
  v_setup := (v_result->>'obligation_id')::uuid;
  v_result := public.record_collection(v_setup, 'accrual-setup', 'posted', 29000000, 'setup-ref');
  if v_result->>'policy_status' is distinct from 'nominal' then
    raise exception 'setup collection returned %', v_result;
  end if;
  if exists (select 1 from commercial.promoter_commissions) then
    raise exception 'record_collection created a commission';
  end if;

  perform set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777703', true);
  v_result := public.accrue_commissions_for_collection((
    select id from commercial.platform_collections where idempotency_key = 'accrual-setup'
  ));
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'commercial accrue returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777701', true);
  v_result := public.accrue_commissions_for_collection((
    select id from commercial.platform_collections where idempotency_key = 'accrual-setup'
  ));
  if v_result->>'accrued' is distinct from 'true'
    or v_result->>'amount_cents' is distinct from '12000000'
    or v_result->>'status' is distinct from 'pending'
    or v_result->>'right_kind' is distinct from 'setup' then
    raise exception 'setup accrue returned %', v_result;
  end if;
  select * into v_row from commercial.promoter_commissions where id = (v_result->>'commission_id')::uuid;
  if v_row.slot is not null or v_row.available_at is not null or v_row.amount_cents <> 12000000 then
    raise exception 'setup row is %', v_row;
  end if;

  v_replay := public.accrue_commissions_for_collection(v_row.collection_id);
  if v_replay->>'duplicate' is distinct from 'true'
    or v_replay->>'commission_id' is distinct from v_row.id::text then
    raise exception 'replay returned %', v_replay;
  end if;
  select count(*) into v_count from commercial.promoter_commissions;
  if v_count <> 1 then
    raise exception 'replay duplicated rows: %', v_count;
  end if;

  begin
    insert into commercial.promoter_commissions (
      collection_id, right_kind, conversion_terms_id, promoter_id, amount_cents, status
    ) values (
      v_row.collection_id, 'setup', v_terms, '77777777-7777-4777-8777-777777777721', 1, 'pending'
    );
    raise exception 'direct second insert succeeded';
  exception
    when unique_violation then
      null;
  end;

  v_result := public.open_obligation(v_terms, 'subscription', 'sub:one');
  v_month := (v_result->>'obligation_id')::uuid;
  v_result := public.record_collection(v_month, 'accrual-month', 'posted', 5500000, 'month-ref');
  v_result := public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  if v_result->>'amount_cents' is distinct from '2200000' or v_result->>'right_kind' is distinct from 'recurring' then
    raise exception 'recurring accrue returned %', v_result;
  end if;
  if (select slot from commercial.promoter_commissions where id = (v_result->>'commission_id')::uuid) is not null then
    raise exception 'recurring received a slot in T02';
  end if;

  v_result := public.open_obligation(v_terms, 'subscription', 'sub:blocked');
  v_blocked := (v_result->>'obligation_id')::uuid;
  v_result := public.record_collection(v_blocked, 'accrual-blocked', 'posted', 5000000, 'blocked-ref');
  if v_result->>'policy_status' is distinct from 'blocked_pending_policy' then
    raise exception 'blocked collection returned %', v_result;
  end if;
  v_result := public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  if v_result->>'commercial_error_code' is distinct from 'policy_blocked' or v_result->>'accrued' is distinct from 'false' then
    raise exception 'blocked accrue returned %', v_result;
  end if;

  v_result := public.open_obligation(v_terms, 'subscription', 'sub:failed');
  v_failed := (v_result->>'obligation_id')::uuid;
  v_result := public.record_collection(v_failed, 'accrual-failed', 'failed', 5500000, 'failed-ref');
  v_result := public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  if v_result->>'commercial_error_code' is distinct from 'policy_blocked' then
    raise exception 'failed accrue returned %', v_result;
  end if;

  select count(*) into v_count from commercial.promoter_commissions;
  if v_count <> 2 then
    raise exception 'unexpected commission count %', v_count;
  end if;
  select count(*) into v_count from commercial.audit_events where action = 'commission.accrued';
  if v_count <> 2 then
    raise exception 'unexpected audit count %', v_count;
  end if;

  perform set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777704', true);
  select count(*) into v_count from commercial.promoter_commissions;
  if v_count <> 2 then
    raise exception 'promoter saw %', v_count;
  end if;
end;
$$;

set local role anon;
do $$
begin
  perform public.accrue_commissions_for_collection('77777777-7777-4777-8777-777777777799');
  raise exception 'anon executed accrue';
exception
  when insufficient_privilege then
    null;
end;
$$;
reset role;

rollback;
