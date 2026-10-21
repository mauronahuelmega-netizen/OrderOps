-- P01-T02 checks. Rolls back fixture users. Does not drop the founder seed.
begin;

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from commercial.commercial_programs
  where code = 'founder' and version = 1;

  if v_count <> 1 then
    raise exception 'founder seed count was %', v_count;
  end if;

  if exists (
    select 1
    from commercial.commercial_programs
    where code = 'founder'
      and version = 1
      and (setup_price_cents <> 29000000
        or monthly_price_cents <> 5500000
        or setup_commission_cents <> 12000000
        or recurring_bps <> 4000
        or max_recurring_slots <> 12)
  ) then
    raise exception 'founder seed amounts diverged';
  end if;
end;
$$;

do $$
begin
  begin
    insert into commercial.commercial_programs (
      code, version, setup_price_cents, monthly_price_cents, setup_commission_cents,
      recurring_bps, max_recurring_slots, effective_from
    ) values ('founder', 1, 1, 1, 1, 1, 1, date '2026-10-08');
    raise exception 'duplicate founder version was accepted';
  exception when unique_violation then
    null;
  end;

  begin
    update commercial.commercial_programs
    set setup_price_cents = setup_price_cents + 1
    where code = 'founder' and version = 1;
    raise exception 'program price update was accepted';
  exception when sqlstate 'P0001' then
    null;
  end;
end;
$$;

set local role authenticated;
do $$
declare
  v_programs int;
  v_accounts int;
begin
  select count(*) into v_programs from commercial.commercial_programs;
  select count(*) into v_accounts from commercial.platform_accounts;
  if v_programs <> 0 or v_accounts <> 0 then
    raise exception 'authenticated without account saw % programs and % accounts', v_programs, v_accounts;
  end if;
end;
$$;
reset role;

set local role anon;
do $$
begin
  begin
    perform count(*) from commercial.commercial_programs;
    raise exception 'anon commercial read was accepted';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

do $$
declare
  v_business uuid := gen_random_uuid();
  v_member uuid := gen_random_uuid();
  v_super uuid := gen_random_uuid();
  v_commercial uuid := gen_random_uuid();
  v_super_account uuid;
  v_commercial_account uuid;
  v_result jsonb;
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (v_business, 'Phase01 Fixture', 'phase01-fixture-' || left(v_business::text, 8), '5491100000099');

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    ('00000000-0000-0000-0000-000000000000', v_member, 'authenticated', 'authenticated', 'phase01-member@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_super, 'authenticated', 'authenticated', 'phase01-super@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_commercial, 'authenticated', 'authenticated', 'phase01-commercial@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.profiles (id, business_id, role)
  values (v_member, v_business, 'owner');

  begin
    insert into commercial.platform_accounts (user_id, kind)
    values (v_member, 'promoter');
    raise exception 'promoter with business membership was accepted';
  exception when sqlstate 'P0001' then
    null;
  end;

  insert into commercial.platform_accounts (id, user_id, kind)
  values (gen_random_uuid(), v_super, 'internal')
  returning id into v_super_account;

  insert into commercial.internal_role_assignments (account_id, role)
  values (v_super_account, 'superadmin');

  insert into commercial.platform_accounts (id, user_id, kind)
  values (gen_random_uuid(), v_commercial, 'internal')
  returning id into v_commercial_account;

  insert into commercial.internal_role_assignments (account_id, role, granted_by)
  values (v_commercial_account, 'commercial', v_super_account);

  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  v_result := commercial.revoke_internal_role(v_super_account, 'superadmin');
  if v_result->>'commercial_error_code' is distinct from 'unauthenticated' then
    raise exception 'missing session did not return unauthenticated';
  end if;

  perform set_config('request.jwt.claim.sub', v_commercial::text, true);
  v_result := commercial.revoke_internal_role(v_super_account, 'superadmin');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'commercial role was allowed to revoke';
  end if;

  perform set_config('request.jwt.claim.sub', v_super::text, true);
  v_result := commercial.revoke_internal_role(v_super_account, 'superadmin');
  if v_result->>'commercial_error_code' is distinct from 'last_superadmin' then
    raise exception 'last superadmin revoke returned %', v_result;
  end if;

  if exists (
    select 1 from commercial.internal_role_assignments
    where account_id = v_super_account and role = 'superadmin' and revoked_at is not null
  ) then
    raise exception 'last superadmin assignment was revoked';
  end if;
end;
$$;

rollback;
