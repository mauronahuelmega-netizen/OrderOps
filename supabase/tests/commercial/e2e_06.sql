-- E2E-06 without money. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666601', 'authenticated', 'authenticated', 'phase03-sep-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666602', 'authenticated', 'authenticated', 'phase03-sep-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('66666666-6666-4666-8666-666666666611', '66666666-6666-4666-8666-666666666601', 'internal'),
  ('66666666-6666-4666-8666-666666666612', '66666666-6666-4666-8666-666666666602', 'promoter');
insert into commercial.internal_role_assignments (account_id, role)
values ('66666666-6666-4666-8666-666666666611', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status)
values ('66666666-6666-4666-8666-666666666621', '66666666-6666-4666-8666-666666666612', 'pseparated01', 'Ana Separada', 'active');
insert into commercial.promoter_contracts (promoter_id, version_label, accepted_at)
values ('66666666-6666-4666-8666-666666666621', 'v1', now());
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('66666666-6666-4666-8666-666666666631', 'Pan Protegido', 'pan protegido', 'promoter'),
  ('66666666-6666-4666-8666-666666666632', 'Pan Provisional', 'pan provisional', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('66666666-6666-4666-8666-666666666641', '66666666-6666-4666-8666-666666666631', 'new', '66666666-6666-4666-8666-666666666612'),
  ('66666666-6666-4666-8666-666666666642', '66666666-6666-4666-8666-666666666632', 'new', '66666666-6666-4666-8666-666666666612');
insert into commercial.opportunity_attributions (opportunity_id, promoter_id, status, method, reason)
values ('66666666-6666-4666-8666-666666666641', '66666666-6666-4666-8666-666666666621', 'confirmed', 'manual', 'fixture');
insert into commercial.attribution_claims (
  promoter_id, commercial_business_id, opportunity_id, status, provisional_until
) values (
  '66666666-6666-4666-8666-666666666621', '66666666-6666-4666-8666-666666666632',
  '66666666-6666-4666-8666-666666666642', 'provisional', now() + interval '30 days'
);
insert into commercial.commercial_interactions (
  commercial_business_id, opportunity_id, kind, channel, origin, occurred_at
) values (
  '66666666-6666-4666-8666-666666666631', '66666666-6666-4666-8666-666666666641',
  'meeting', 'web', 'pseparated01', now() - interval '1 hour'
);

select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666601', true);

do $$
declare
  v_result jsonb;
  v_status text;
  v_owner uuid;
  v_protections int;
  v_contracts int;
  v_claim jsonb;
  v_ends interval;
begin
  v_result := commercial.separate_promoter(
    '66666666-6666-4666-8666-666666666621',
    '66666666-6666-4666-8666-666666666611',
    'fin de relacion',
    null
  );
  if v_result->>'status' is distinct from 'separated' then
    raise exception 'separation returned %', v_result;
  end if;
  select status into v_status from commercial.promoters where id = '66666666-6666-4666-8666-666666666621';
  select owner_account_id into v_owner from commercial.commercial_opportunities where id = '66666666-6666-4666-8666-666666666641';
  select count(*) into v_protections from commercial.opportunity_protections where basis = 'confirmed_with_activity';
  select count(*) into v_contracts from commercial.promoter_contracts where promoter_id = '66666666-6666-4666-8666-666666666621';
  if v_status is distinct from 'separated' or v_owner is distinct from '66666666-6666-4666-8666-666666666611' or v_protections <> 1 or v_contracts <> 1 then
    raise exception 'separation state status % owner % protections % contracts %', v_status, v_owner, v_protections, v_contracts;
  end if;
  if exists (
    select 1 from commercial.opportunity_protections
    where opportunity_id = '66666666-6666-4666-8666-666666666642'
  ) then
    raise exception 'provisional claim created protection';
  end if;
  select ends_at - starts_at into v_ends from commercial.opportunity_protections limit 1;
  if v_ends <> interval '90 days' then
    raise exception 'protection window %', v_ends;
  end if;

  perform set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666602', true);
  v_claim := commercial.create_claim('66666666-6666-4666-8666-666666666631', null);
  if v_claim->>'commercial_error_code' is distinct from 'promoter_not_active' then
    raise exception 'separated claim returned %', v_claim;
  end if;
  if to_regclass('commercial.promoter_commissions') is not null then
    raise exception 'separation created commissions';
  end if;
end;
$$;

rollback;
