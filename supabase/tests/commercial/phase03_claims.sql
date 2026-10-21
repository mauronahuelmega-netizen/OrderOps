-- P03-T03. Rolls back fixtures.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '63636363-6363-4363-8363-636363636301', 'authenticated', 'authenticated', 'phase03-claim-internal@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '63636363-6363-4363-8363-636363636302', 'authenticated', 'authenticated', 'phase03-claim-active@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '63636363-6363-4363-8363-636363636303', 'authenticated', 'authenticated', 'phase03-claim-registered@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('63636363-6363-4363-8363-636363636311', '63636363-6363-4363-8363-636363636301', 'internal'),
  ('63636363-6363-4363-8363-636363636312', '63636363-6363-4363-8363-636363636302', 'promoter'),
  ('63636363-6363-4363-8363-636363636313', '63636363-6363-4363-8363-636363636303', 'promoter');
insert into commercial.internal_role_assignments (account_id, role)
values ('63636363-6363-4363-8363-636363636311', 'commercial');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('63636363-6363-4363-8363-636363636321', '63636363-6363-4363-8363-636363636312', 'pactiveclaim01', 'Ana Claim', 'active'),
  ('63636363-6363-4363-8363-636363636322', '63636363-6363-4363-8363-636363636313', 'pregisteredclm', 'Luis Claim', 'registered');

insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('63636363-6363-4363-8363-636363636331', 'Pan Claim', 'pan claim', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
values ('63636363-6363-4363-8363-636363636341', '63636363-6363-4363-8363-636363636331', 'new');
insert into commercial.commercial_interactions (
  id, commercial_business_id, opportunity_id, kind, channel, origin, occurred_at
) values (
  '63636363-6363-4363-8363-636363636351', '63636363-6363-4363-8363-636363636331', '63636363-6363-4363-8363-636363636341',
  'meeting', 'web', 'internal', now()
);
insert into commercial.commercial_tasks (id, opportunity_id, title, status)
values ('63636363-6363-4363-8363-636363636361', '63636363-6363-4363-8363-636363636341', 'llamar', 'open');

do $$
declare
  v_registered jsonb;
  v_claim jsonb;
  v_again jsonb;
  v_extend jsonb;
  v_expired jsonb;
  v_count int;
begin
  perform set_config('request.jwt.claim.sub', '63636363-6363-4363-8363-636363636303', true);
  v_registered := commercial.create_claim('63636363-6363-4363-8363-636363636331', null);
  if v_registered->>'commercial_error_code' is distinct from 'promoter_not_active' then
    raise exception 'registered claim returned %', v_registered;
  end if;

  perform set_config('request.jwt.claim.sub', '63636363-6363-4363-8363-636363636302', true);
  v_claim := commercial.create_claim('63636363-6363-4363-8363-636363636331', '63636363-6363-4363-8363-636363636341');
  v_again := commercial.create_claim('63636363-6363-4363-8363-636363636331', '63636363-6363-4363-8363-636363636341');
  if v_claim->>'duplicate' is distinct from 'false' or v_again->>'duplicate' is distinct from 'true' then
    raise exception 'claim idempotency % / %', v_claim, v_again;
  end if;
  if v_claim->>'claim_id' is distinct from v_again->>'claim_id' then
    raise exception 'retry created another claim';
  end if;
  select count(*) into v_count from commercial.commercial_opportunities;
  if v_count <> 1 then
    raise exception 'claim created an opportunity';
  end if;

  perform set_config('request.jwt.claim.sub', '63636363-6363-4363-8363-636363636301', true);
  v_extend := commercial.extend_claim((v_claim->>'claim_id')::uuid, '63636363-6363-4363-8363-636363636361', 'solo una tarea');
  if v_extend->>'commercial_error_code' is distinct from 'extension_not_substantive' then
    raise exception 'task extension returned %', v_extend;
  end if;
  v_extend := commercial.extend_claim((v_claim->>'claim_id')::uuid, '63636363-6363-4363-8363-636363636351', 'reunion real');
  if v_extend->>'ok' is distinct from 'true' then
    raise exception 'meeting extension returned %', v_extend;
  end if;

  update commercial.attribution_claims
  set provisional_until = now() - interval '1 minute'
  where id = (v_claim->>'claim_id')::uuid;
  v_expired := commercial.expire_due_claims();
  if (v_expired->>'expired')::int <> 1 then
    raise exception 'expire returned %', v_expired;
  end if;
  if position('opportunity_attributions' in pg_get_functiondef('commercial.create_claim(uuid,uuid)'::regprocedure)) > 0 then
    raise exception 'create_claim writes attributions';
  end if;
end;
$$;

rollback;
