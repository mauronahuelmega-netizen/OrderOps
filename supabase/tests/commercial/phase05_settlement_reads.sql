-- Settlement reads stay on a public RPC. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '94949494-9494-4949-8949-949494949601', 'authenticated', 'authenticated', 'read-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '94949494-9494-4949-8949-949494949604', 'authenticated', 'authenticated', 'read-promoter-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '94949494-9494-4949-8949-949494949605', 'authenticated', 'authenticated', 'read-promoter-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '94949494-9494-4949-8949-949494949609', 'authenticated', 'authenticated', 'read-owner@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('94949494-9494-4949-8949-949494949611', '94949494-9494-4949-8949-949494949601', 'internal'),
  ('94949494-9494-4949-8949-949494949614', '94949494-9494-4949-8949-949494949604', 'promoter'),
  ('94949494-9494-4949-8949-949494949615', '94949494-9494-4949-8949-949494949605', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('94949494-9494-4949-8949-949494949611', 'finance');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('94949494-9494-4949-8949-949494949621', '94949494-9494-4949-8949-949494949614', 'pread0001', 'Lectura A', 'active'),
  ('94949494-9494-4949-8949-949494949622', '94949494-9494-4949-8949-949494949615', 'pread0002', 'Lectura B', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('94949494-9494-4949-8949-949494949631', 'Negocio Lectura', 'negocio-lectura-rpc', '5491100000949');
insert into public.profiles (id, business_id, role) values
  ('94949494-9494-4949-8949-949494949609', '94949494-9494-4949-8949-949494949631', 'owner');
insert into commercial.promoter_settlements (
  id, promoter_id, period_key, status, prepared_by, total_cents, due_on
) values
  ('94949494-9494-4949-8949-949494949641', '94949494-9494-4949-8949-949494949621', '2026-01', 'approved', '94949494-9494-4949-8949-949494949611', 2200000, '2026-02-10'),
  ('94949494-9494-4949-8949-949494949642', '94949494-9494-4949-8949-949494949622', '2026-05', 'draft', '94949494-9494-4949-8949-949494949611', 2200000, '2026-06-10');

do $$
declare
  v_result jsonb;
begin
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '94949494-9494-4949-8949-949494949601', true);
  set local role authenticated;
  v_result := public.list_settlement_workspace();
  if v_result->>'ok' is distinct from 'true'
     or (
       select count(*)
       from jsonb_array_elements(v_result->'settlements') row
       where row->>'promoter_id' in (
         '94949494-9494-4949-8949-949494949621',
         '94949494-9494-4949-8949-949494949622'
       )
         and (row->>'total_cents')::bigint = 2200000
     ) <> 2 then
    raise exception 'finance read %', v_result;
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', '94949494-9494-4949-8949-949494949604', true);
  set local role authenticated;
  v_result := public.list_settlement_workspace();
  if v_result->>'ok' is distinct from 'true'
     or (select count(*) from jsonb_array_elements(v_result->'settlements')) <> 1
     or v_result->'settlements'->0->>'promoter_id' is distinct from '94949494-9494-4949-8949-949494949621' then
    raise exception 'promoter read %', v_result;
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', '94949494-9494-4949-8949-949494949609', true);
  set local role authenticated;
  v_result := public.list_settlement_workspace();
  if v_result->>'ok' is distinct from 'true'
     or jsonb_array_length(v_result->'settlements') <> 0 then
    raise exception 'owner read %', v_result;
  end if;
end;
$$;

set local role anon;
do $$
begin
  perform public.list_settlement_workspace();
  raise exception 'anon executed the read';
exception
  when insufficient_privilege then
    null;
end;
$$;

rollback;
