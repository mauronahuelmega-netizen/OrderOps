-- P03-T05. Rolls back fixtures.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '65656565-6565-4565-8565-656565656501', 'authenticated', 'authenticated', 'phase03-dispute-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '65656565-6565-4565-8565-656565656502', 'authenticated', 'authenticated', 'phase03-dispute-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '65656565-6565-4565-8565-656565656503', 'authenticated', 'authenticated', 'phase03-dispute-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('65656565-6565-4565-8565-656565656511', '65656565-6565-4565-8565-656565656501', 'internal'),
  ('65656565-6565-4565-8565-656565656512', '65656565-6565-4565-8565-656565656502', 'promoter'),
  ('65656565-6565-4565-8565-656565656513', '65656565-6565-4565-8565-656565656503', 'promoter');
insert into commercial.internal_role_assignments (account_id, role)
values ('65656565-6565-4565-8565-656565656511', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('65656565-6565-4565-8565-656565656521', '65656565-6565-4565-8565-656565656512', 'pdisputea', 'Ana Disputa', 'active'),
  ('65656565-6565-4565-8565-656565656522', '65656565-6565-4565-8565-656565656513', 'pdisputeb', 'Luis Disputa', 'active');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('65656565-6565-4565-8565-656565656531', 'Pan Disputa', 'pan disputa', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
values ('65656565-6565-4565-8565-656565656541', '65656565-6565-4565-8565-656565656531', 'new');
insert into commercial.opportunity_attributions (
  id, opportunity_id, promoter_id, status, method, reason
) values (
  '65656565-6565-4565-8565-656565656551', '65656565-6565-4565-8565-656565656541',
  '65656565-6565-4565-8565-656565656521', 'confirmed', 'manual', 'fixture'
);

select set_config('request.jwt.claim.sub', '65656565-6565-4565-8565-656565656501', true);

do $$
declare
  v_open jsonb;
  v_promoter jsonb;
  v_other jsonb;
  v_decision jsonb;
  v_status text;
begin
  perform set_config('request.jwt.claim.sub', '65656565-6565-4565-8565-656565656502', true);
  v_promoter := commercial.decide_dispute('65656565-6565-4565-8565-656565656561', 'x', 'motivo', 'none', false);
  if v_promoter->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'promoter decision returned %', v_promoter;
  end if;

  perform set_config('request.jwt.claim.sub', '65656565-6565-4565-8565-656565656501', true);
  v_open := commercial.open_dispute(
    '65656565-6565-4565-8565-656565656541',
    array['65656565-6565-4565-8565-656565656521']::uuid[],
    'conflicto de referido'
  );
  perform set_config('request.jwt.claim.sub', '65656565-6565-4565-8565-656565656502', true);
  v_promoter := commercial.read_dispute((v_open->>'dispute_id')::uuid);
  if v_promoter->>'ok' is distinct from 'true' or v_promoter ? 'commissions' then
    raise exception 'party read returned %', v_promoter;
  end if;
  perform set_config('request.jwt.claim.sub', '65656565-6565-4565-8565-656565656503', true);
  v_other := commercial.read_dispute((v_open->>'dispute_id')::uuid);
  if v_other->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'other promoter read returned %', v_other;
  end if;

  perform set_config('request.jwt.claim.sub', '65656565-6565-4565-8565-656565656501', true);
  v_decision := commercial.decide_dispute((v_open->>'dispute_id')::uuid, 'mantener', 'la primera confirmacion queda', 'none', false);
  if v_decision->>'status' is distinct from 'decided' then
    raise exception 'decision returned %', v_decision;
  end if;
  select status into v_status from commercial.opportunity_attributions where id = '65656565-6565-4565-8565-656565656551';
  if v_status is distinct from 'confirmed' then
    raise exception 'decision deleted attribution history';
  end if;
  if to_regclass('commercial.promoter_commissions') is not null then
    raise exception 'dispute created commissions';
  end if;
end;
$$;

rollback;
