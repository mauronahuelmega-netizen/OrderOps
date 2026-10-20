-- Talo First L1. Rolls back. System actor identity, grants and audit stamping.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10101010-1010-4101-8101-101010101001', 'authenticated', 'authenticated', 'p10-finance@local.test', 'local-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10101010-1010-4101-8101-101010101002', 'authenticated', 'authenticated', 'p10-super@local.test', 'local-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('10101010-1010-4101-8101-101010101011', '10101010-1010-4101-8101-101010101001', 'internal'),
  ('10101010-1010-4101-8101-101010101012', '10101010-1010-4101-8101-101010101002', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('10101010-1010-4101-8101-101010101011', 'finance'),
  ('10101010-1010-4101-8101-101010101012', 'superadmin');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('10101010-1010-4101-8101-101010101031', 'Negocio Sistema A', 'negocio-sistema-a', '5491100101031');

do $$
declare
  v_result jsonb;
  v_denied boolean;
  v_kind text;
begin
  if (select count(*) from commercial.platform_accounts where kind = 'system') <> 1 then
    raise exception 'expected exactly one system account';
  end if;
  if exists (
    select 1 from auth.users
    where id = 'c0000000-0000-4000-8000-000000000001'
      and (encrypted_password is not null or banned_until is distinct from 'infinity'::timestamptz)
  ) then
    raise exception 'system user can sign in';
  end if;
  begin
    insert into commercial.platform_accounts (user_id, kind) values ('10101010-1010-4101-8101-101010101002', 'system');
    raise exception 'second system account accepted';
  exception when unique_violation then null;
  end;

  -- System permission surface is collection.write only.
  perform set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000001', true);
  if not commercial.has_permission('collection.write') then raise exception 'system lacks collection.write'; end if;
  if commercial.has_permission('settlement.approve') or commercial.has_permission('payment.record')
    or commercial.has_permission('role.grant') or commercial.has_permission('audit.read_all') then
    raise exception 'system permission surface too wide';
  end if;

  -- Human permissions unchanged.
  perform set_config('request.jwt.claim.sub', '10101010-1010-4101-8101-101010101001', true);
  if not commercial.has_permission('collection.write') or commercial.has_permission('settlement.approve') is not true then
    raise exception 'finance permissions changed';
  end if;
  perform set_config('request.jwt.claim.sub', '10101010-1010-4101-8101-101010101002', true);
  if commercial.has_permission('collection.write') then raise exception 'superadmin gained collection.write'; end if;

  -- anon and authenticated cannot run system wrappers.
  perform set_config('request.jwt.claim.sub', '10101010-1010-4101-8101-101010101001', true);
  v_denied := false;
  begin
    execute 'set local role authenticated';
    perform public.system_link_provider_customer('10101010-1010-4101-8101-101010101031', 'talo', 'sandbox', 'p10-customer', '0000000000000000101031', 'p10.alias');
  exception when insufficient_privilege then v_denied := true;
  end;
  execute 'reset role';
  if not v_denied then raise exception 'authenticated ran system wrapper'; end if;
  v_denied := false;
  begin
    execute 'set local role anon';
    perform public.system_link_provider_customer('10101010-1010-4101-8101-101010101031', 'talo', 'sandbox', 'p10-customer', '0000000000000000101031', 'p10.alias');
  exception when insufficient_privilege then v_denied := true;
  end;
  execute 'reset role';
  if not v_denied then raise exception 'anon ran system wrapper'; end if;
  v_denied := false;
  begin
    execute 'set local role authenticated';
    perform commercial.system_enter();
  exception when insufficient_privilege then v_denied := true;
  end;
  execute 'reset role';
  if not v_denied then raise exception 'authenticated ran system_enter'; end if;

  -- service_role runs the wrapper; identity is restored afterwards.
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role service_role';
  v_result := public.system_link_provider_customer('10101010-1010-4101-8101-101010101031', 'talo', 'sandbox', 'p10-customer', '0000000000000000101031', 'p10.alias');
  execute 'reset role';
  if (v_result->>'ok')::boolean is not true then raise exception 'service_role link %', v_result; end if;
  if coalesce(current_setting('request.jwt.claim.sub', true), '') <> '' then
    raise exception 'system identity leaked after wrapper';
  end if;
  execute 'set local role service_role';
  v_result := public.system_link_provider_customer('10101010-1010-4101-8101-101010101031', 'talo', 'sandbox', 'p10-customer', '0000000000000000101031', 'p10.alias');
  execute 'reset role';
  if (v_result->>'idempotent')::boolean is not true then raise exception 'link not idempotent %', v_result; end if;

  -- Audit rows written with the system account are stamped as system.
  insert into commercial.audit_events (actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id)
  values ('c0000000-0000-4000-8000-000000000011', 'internal', 'p10.probe', 'commercial', 'platform_accounts', gen_random_uuid(), gen_random_uuid());
  select actor_kind into v_kind from commercial.audit_events where action = 'p10.probe';
  if v_kind is distinct from 'system' then raise exception 'audit actor_kind %', v_kind; end if;
  insert into commercial.audit_events (actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id)
  values ('10101010-1010-4101-8101-101010101011', 'internal', 'p10.human', 'commercial', 'platform_accounts', gen_random_uuid(), gen_random_uuid());
  select actor_kind into v_kind from commercial.audit_events where action = 'p10.human';
  if v_kind is distinct from 'internal' then raise exception 'human audit restamped %', v_kind; end if;

  raise notice 'phase10_system_actor: PASS';
end;
$$;

rollback;
