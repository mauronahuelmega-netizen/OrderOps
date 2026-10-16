-- PHASE-06 archive and privacy. Rolls back. Synthetic rows only.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-969696969602', 'authenticated', 'authenticated', 'privacy-commercial@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-969696969603', 'authenticated', 'authenticated', 'privacy-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('96969696-9696-4969-8969-969696969612', '96969696-9696-4969-8969-969696969602', 'internal'),
  ('96969696-9696-4969-8969-969696969613', '96969696-9696-4969-8969-969696969603', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('96969696-9696-4969-8969-969696969612', 'commercial'),
  ('96969696-9696-4969-8969-969696969613', 'superadmin');
insert into commercial.commercial_businesses (
  id, display_name, normalized_name, initial_channel, fixture_tag
) values (
  '96969696-9696-4969-8969-969696969631', 'Comercio Fixture', 'comercio fixture', 'organic', 'phase06-privacy'
);
insert into commercial.commercial_contacts (
  id, commercial_business_id, full_name, normalized_phone, email
) values (
  '96969696-9696-4969-8969-969696969632',
  '96969696-9696-4969-8969-969696969631',
  'Contacto Fixture',
  '+5491100000000',
  'contacto.fixture@local.test'
);
insert into commercial.commercial_opportunities (
  id, commercial_business_id, stage
) values (
  '96969696-9696-4969-8969-969696969633',
  '96969696-9696-4969-8969-969696969631',
  'new'
);
do $$
declare
  v_result jsonb;
  v_visible int;
  v_name text;
  v_promoter uuid;
begin
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '96969696-9696-4969-8969-969696969602', true);

  v_result := public.archive_opportunity('96969696-9696-4969-8969-969696969633', 'archivo de prueba');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'archive %', v_result;
  end if;
  v_result := public.archive_opportunity('96969696-9696-4969-8969-969696969633', 'archivo de prueba');
  if v_result->>'duplicate' is distinct from 'true' then
    raise exception 'archive replay %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '96969696-9696-4969-8969-969696969602', true);
  select count(*) into v_visible
  from jsonb_array_elements(public.list_open_opportunities()->'opportunities') row
  where row->>'id' = '96969696-9696-4969-8969-969696969633';
  if v_visible <> 0 then
    raise exception 'archived opportunity stayed visible';
  end if;
  if not exists (
    select 1 from commercial.audit_events
    where entity_id = '96969696-9696-4969-8969-969696969633'
      and action = 'opportunity.archived'
  ) then
    raise exception 'archive audit missing';
  end if;

  v_result := public.open_privacy_request('contact', '96969696-9696-4969-8969-969696969632', 'deletion');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'open privacy %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '96969696-9696-4969-8969-969696969603', true);
  v_result := public.resolve_privacy_request((v_result->>'request_id')::uuid, 'fulfilled', 'solicitud local de supresion');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'resolve privacy %', v_result;
  end if;
  select full_name into v_name from commercial.commercial_contacts
  where id = '96969696-9696-4969-8969-969696969632';
  if v_name is distinct from 'anonimizado' then
    raise exception 'contact stayed named %', v_name;
  end if;
end;
$$;

set local role authenticated;
do $$
begin
  delete from commercial.promoter_commissions
  where id = '96969696-9696-4969-8969-969696969634';
  raise exception 'authenticated deleted a commission';
exception
  when insufficient_privilege then
    null;
end;
$$;

rollback;
