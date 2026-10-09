-- E2E-02 and manual attribution conflicts. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '64646464-6464-4464-8464-646464646401', 'authenticated', 'authenticated', 'phase03-attr-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '64646464-6464-4464-8464-646464646402', 'authenticated', 'authenticated', 'phase03-attr-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '64646464-6464-4464-8464-646464646403', 'authenticated', 'authenticated', 'phase03-attr-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '64646464-6464-4464-8464-646464646404', 'authenticated', 'authenticated', 'phase03-attr-commercial@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('64646464-6464-4464-8464-646464646411', '64646464-6464-4464-8464-646464646401', 'internal'),
  ('64646464-6464-4464-8464-646464646412', '64646464-6464-4464-8464-646464646402', 'promoter'),
  ('64646464-6464-4464-8464-646464646413', '64646464-6464-4464-8464-646464646403', 'promoter'),
  ('64646464-6464-4464-8464-646464646414', '64646464-6464-4464-8464-646464646404', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('64646464-6464-4464-8464-646464646411', 'superadmin'),
  ('64646464-6464-4464-8464-646464646414', 'commercial');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('64646464-6464-4464-8464-646464646421', '64646464-6464-4464-8464-646464646412', 'pref-ana', 'Ana Ref', 'active'),
  ('64646464-6464-4464-8464-646464646422', '64646464-6464-4464-8464-646464646413', 'pref-luis', 'Luis Ref', 'active');

do $$
declare
  v_demo jsonb;
  v_method text;
  v_promoter uuid;
  v_self jsonb;
  v_commercial jsonb;
  v_organic jsonb;
  v_claim jsonb;
  v_first jsonb;
  v_second jsonb;
  v_commissions int;
begin
  v_demo := commercial.submit_demo_request(
    'Nora', 'Pan Referido', '11 8100-0001', 'panaderia', null, 'demo', 'pref-ana', null, 'e2e-02-key', 'e2e-02-ip'
  );
  if v_demo->>'ok' is distinct from 'true' then
    raise exception 'referral demo returned %', v_demo;
  end if;
  select method, promoter_id into v_method, v_promoter
  from commercial.opportunity_attributions
  where opportunity_id = (v_demo->>'opportunity_id')::uuid and status = 'confirmed';
  if v_method is distinct from 'automatic_referral' or v_promoter is distinct from '64646464-6464-4464-8464-646464646421' then
    raise exception 'automatic attribution % / %', v_method, v_promoter;
  end if;

  perform set_config('request.jwt.claim.sub', '64646464-6464-4464-8464-646464646402', true);
  v_self := commercial.confirm_attribution((v_demo->>'opportunity_id')::uuid, '64646464-6464-4464-8464-646464646421', null, 'yo');
  if v_self->>'commercial_error_code' is distinct from 'cannot_self_confirm' then
    raise exception 'self confirm returned %', v_self;
  end if;

  perform set_config('request.jwt.claim.sub', '64646464-6464-4464-8464-646464646404', true);
  v_commercial := commercial.confirm_attribution((v_demo->>'opportunity_id')::uuid, '64646464-6464-4464-8464-646464646422', null, 'comercial');
  if v_commercial->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'commercial confirm returned %', v_commercial;
  end if;

  v_organic := commercial.submit_demo_request(
    'Rita', 'Cafe Organico', '11 8100-0002', 'cafeteria', null, null, null, null, 'e2e-02-organic', 'e2e-02-ip-2'
  );
  perform set_config('request.jwt.claim.sub', '64646464-6464-4464-8464-646464646403', true);
  v_claim := commercial.create_claim((v_organic->>'business_id')::uuid, (v_organic->>'opportunity_id')::uuid);
  perform set_config('request.jwt.claim.sub', '64646464-6464-4464-8464-646464646401', true);
  v_first := commercial.confirm_attribution(
    (v_organic->>'opportunity_id')::uuid,
    '64646464-6464-4464-8464-646464646422',
    (v_claim->>'claim_id')::uuid,
    'claim tardio'
  );
  if v_first->>'commercial_error_code' is distinct from 'extension_not_substantive' then
    raise exception 'organic confirm returned %', v_first;
  end if;
  if exists (
    select 1 from commercial.opportunity_attributions
    where opportunity_id = (v_organic->>'opportunity_id')::uuid
  ) then
    raise exception 'organic lead was attributed';
  end if;

  insert into commercial.commercial_interactions (
    commercial_business_id, opportunity_id, kind, channel, origin, occurred_at
  ) values (
    (v_organic->>'business_id')::uuid, (v_organic->>'opportunity_id')::uuid,
    'meeting', 'web', 'pref-ana', now()
  );
  perform set_config('request.jwt.claim.sub', '64646464-6464-4464-8464-646464646402', true);
  perform commercial.create_claim((v_organic->>'business_id')::uuid, (v_organic->>'opportunity_id')::uuid);
  perform set_config('request.jwt.claim.sub', '64646464-6464-4464-8464-646464646401', true);
  v_first := commercial.confirm_attribution(
    (v_organic->>'opportunity_id')::uuid, '64646464-6464-4464-8464-646464646421', null, 'primera valida'
  );
  v_second := commercial.confirm_attribution(
    (v_organic->>'opportunity_id')::uuid, '64646464-6464-4464-8464-646464646422', null, 'segunda'
  );
  if v_first->>'ok' is distinct from 'true' or v_second->>'commercial_error_code' is distinct from 'attribution_exists' then
    raise exception 'two promoter confirm % / %', v_first, v_second;
  end if;

  select count(*) into v_commissions from pg_class where relname = 'promoter_commissions' and relnamespace = 'commercial'::regnamespace;
  if v_commissions <> 0 then
    raise exception 'attribution created commissions';
  end if;
end;
$$;

rollback;
