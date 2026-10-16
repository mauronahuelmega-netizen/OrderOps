-- E2E-08 security cases that fit one rolled-back session.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-969696969641', 'authenticated', 'authenticated', 'e2e08-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-969696969642', 'authenticated', 'authenticated', 'e2e08-promoter-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-969696969643', 'authenticated', 'authenticated', 'e2e08-promoter-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-969696969644', 'authenticated', 'authenticated', 'e2e08-support@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('96969696-9696-4969-8969-969696969651', '96969696-9696-4969-8969-969696969641', 'internal'),
  ('96969696-9696-4969-8969-969696969652', '96969696-9696-4969-8969-969696969642', 'promoter'),
  ('96969696-9696-4969-8969-969696969653', '96969696-9696-4969-8969-969696969643', 'promoter'),
  ('96969696-9696-4969-8969-969696969654', '96969696-9696-4969-8969-969696969644', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('96969696-9696-4969-8969-969696969651', 'finance'),
  ('96969696-9696-4969-8969-969696969654', 'support');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('96969696-9696-4969-8969-969696969661', '96969696-9696-4969-8969-969696969652', 'e2e08001', 'Promotor E2E A', 'active'),
  ('96969696-9696-4969-8969-969696969662', '96969696-9696-4969-8969-969696969653', 'e2e08002', 'Promotor E2E B', 'active');
insert into commercial.promoter_settlements (
  id, promoter_id, period_key, status, prepared_by, total_cents, due_on
) values (
  '96969696-9696-4969-8969-969696969671',
  '96969696-9696-4969-8969-969696969662',
  '2026-08', 'approved', '96969696-9696-4969-8969-969696969651', 2200000, '2026-09-10'
);

do $$
declare
  v_result jsonb;
  v_seen int;
begin
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '96969696-9696-4969-8969-969696969642', true);
  set local role authenticated;
  v_result := public.list_settlement_workspace();
  select count(*) into v_seen
  from jsonb_array_elements(v_result->'settlements') row
  where row->>'id' = '96969696-9696-4969-8969-969696969671';
  if v_result->>'ok' is distinct from 'true' or v_seen <> 0 then
    raise exception 'promoter A saw settlement %', v_result;
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', '96969696-9696-4969-8969-969696969654', true);
  set local role authenticated;
  v_result := public.approve_settlement('96969696-9696-4969-8969-969696969671');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'support approved %', v_result;
  end if;
end;
$$;

set local role anon;
do $$
begin
  perform public.record_settlement_payment(
    '96969696-9696-4969-8969-969696969671', 'e2e08-pay', 2200000, 'recorded', null, null
  );
  raise exception 'anon recorded a payment';
exception
  when insufficient_privilege then
    null;
end;
$$;

reset role;
set local role authenticated;
do $$
begin
  delete from commercial.promoter_commissions where false;
  raise exception 'authenticated deleted commissions';
exception
  when insufficient_privilege then
    null;
end;
$$;

rollback;
