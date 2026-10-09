-- P02-T06 and the part of E2E-09 that does not need promoters.
-- Two overlapping sessions are not available in this single psql harness.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '50505050-5050-4050-8050-505050505001', 'authenticated', 'authenticated',
  'phase02-merge@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);
insert into commercial.platform_accounts (id, user_id, kind)
values ('50505050-5050-4050-8050-505050505011', '50505050-5050-4050-8050-505050505001', 'internal');
insert into commercial.internal_role_assignments (account_id, role)
values ('50505050-5050-4050-8050-505050505011', 'commercial');
select set_config('request.jwt.claim.sub', '50505050-5050-4050-8050-505050505001', true);

do $$
declare
  v_same_name jsonb;
  v_same_phone jsonb;
  v_left jsonb;
  v_right jsonb;
  v_merged jsonb;
  v_empty jsonb;
  v_origins int;
begin
  if position('opportunity_attributions' in pg_get_functiondef('commercial.merge_commercial_businesses(uuid,uuid,text)'::regprocedure)) > 0 then
    raise exception 'merge function references attribution rows';
  end if;

  perform commercial.find_or_prepare_business('Nombre Igual', '11 5555-0401', null, 'organic');
  v_same_name := commercial.find_or_prepare_business('Nombre Igual', '11 5555-0402', null, 'organic');
  if v_same_name->>'classification' is distinct from 'probable' or not (v_same_name->>'created')::boolean then
    raise exception 'same name was merged automatically: %', v_same_name;
  end if;

  perform commercial.find_or_prepare_business('Nombre Uno', '11 5555-0403', null, 'organic');
  v_same_phone := commercial.find_or_prepare_business('Nombre Dos', '11 5555-0403', null, 'organic');
  if v_same_phone->>'classification' is distinct from 'probable' then
    raise exception 'same phone became %', v_same_phone;
  end if;

  v_left := commercial.find_or_prepare_business('Lead Izquierdo', '11 5555-0404', null, 'organic');
  v_right := commercial.find_or_prepare_business('Lead Derecho', '11 5555-0405', null, 'organic');
  insert into commercial.commercial_interactions (
    commercial_business_id, kind, channel, origin, occurred_at
  ) values
    ((v_left->>'business_id')::uuid, 'note', 'web', 'organic', now()),
    ((v_right->>'business_id')::uuid, 'call', 'phone', 'campaign-a', now());

  v_empty := commercial.merge_commercial_businesses((v_left->>'business_id')::uuid, (v_right->>'business_id')::uuid, '  ');
  if v_empty->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'empty reason returned %', v_empty;
  end if;

  v_merged := commercial.merge_commercial_businesses((v_left->>'business_id')::uuid, (v_right->>'business_id')::uuid, 'misma marca');
  if v_merged->>'ok' is distinct from 'true' then
    raise exception 'merge failed: %', v_merged;
  end if;

  select count(*) into v_origins
  from commercial.commercial_interactions
  where commercial_business_id = (v_left->>'business_id')::uuid
    and origin in ('organic', 'campaign-a');
  if v_origins <> 2 then
    raise exception 'origins were not both kept on the survivor: %', v_origins;
  end if;

  if not exists (
    select 1 from commercial.commercial_businesses
    where id = (v_right->>'business_id')::uuid
      and merged_into_id = (v_left->>'business_id')::uuid
  ) then
    raise exception 'absorbed business was not linked';
  end if;

  if not exists (
    select 1 from commercial.audit_events
    where entity_id = (v_merged->>'merge_id')::uuid
      and action = 'business.merged'
  ) then
    raise exception 'merge audit missing';
  end if;

  if (select count(*) from commercial.commercial_interactions where origin = 'campaign-a') <> 1 then
    raise exception 'an interaction was deleted';
  end if;
end;
$$;

rollback;
