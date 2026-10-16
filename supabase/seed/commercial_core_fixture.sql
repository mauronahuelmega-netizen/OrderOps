-- Synthetic Commercial Core fixture. Refuses to run unless the caller set the QA project marker.
-- Not a global seed.sql. Does not truncate unrelated rows.

do $$
begin
  if current_setting('orderops.qa_project_id', true) is distinct from 'orderops-phase06-qa' then
    raise exception 'fixture_project_mismatch';
  end if;
end;
$$;

delete from commercial.commercial_interactions
where commercial_business_id in (
  select id from commercial.commercial_businesses where fixture_tag = 'commercial-core-v1-fixture'
);
delete from commercial.commercial_opportunities
where commercial_business_id in (
  select id from commercial.commercial_businesses where fixture_tag = 'commercial-core-v1-fixture'
);
delete from commercial.commercial_contacts
where commercial_business_id in (
  select id from commercial.commercial_businesses where fixture_tag = 'commercial-core-v1-fixture'
);
delete from commercial.commercial_businesses where fixture_tag = 'commercial-core-v1-fixture';
delete from commercial.promoters where id in (
  '96969696-9696-4969-8969-9696969696a1',
  '96969696-9696-4969-8969-9696969696a2'
);
delete from commercial.internal_role_assignments where account_id = '96969696-9696-4969-8969-9696969696b0';
delete from commercial.platform_accounts where id in (
  '96969696-9696-4969-8969-9696969696b0',
  '96969696-9696-4969-8969-9696969696b1',
  '96969696-9696-4969-8969-9696969696b2'
);
delete from auth.users where id in (
  '96969696-9696-4969-8969-9696969696c0',
  '96969696-9696-4969-8969-9696969696c1',
  '96969696-9696-4969-8969-9696969696c2'
);
delete from public.businesses where id = '96969696-9696-4969-8969-9696969696d1';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-9696969696c0', 'authenticated', 'authenticated', 'fixture.commercial@phase06.local', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-9696969696c1', 'authenticated', 'authenticated', 'promoter.one@phase06.local', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '96969696-9696-4969-8969-9696969696c2', 'authenticated', 'authenticated', 'promoter.two@phase06.local', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('96969696-9696-4969-8969-9696969696b0', '96969696-9696-4969-8969-9696969696c0', 'internal'),
  ('96969696-9696-4969-8969-9696969696b1', '96969696-9696-4969-8969-9696969696c1', 'promoter'),
  ('96969696-9696-4969-8969-9696969696b2', '96969696-9696-4969-8969-9696969696c2', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('96969696-9696-4969-8969-9696969696b0', 'commercial');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('96969696-9696-4969-8969-9696969696a1', '96969696-9696-4969-8969-9696969696b1', 'fx060001', 'Promotor Fixture Uno', 'active'),
  ('96969696-9696-4969-8969-9696969696a2', '96969696-9696-4969-8969-9696969696b2', 'fx060002', 'Promotor Fixture Dos', 'active');

insert into public.businesses (id, name, slug, whatsapp_number) values
  ('96969696-9696-4969-8969-9696969696d1', 'Negocio Fixture Ganado', 'negocio-fixture-phase06', '5491100096960');

insert into commercial.commercial_businesses (
  id, display_name, normalized_name, normalized_phone, initial_channel, initial_promoter_id, fixture_tag
) values
  ('96969696-9696-4969-8969-9696969696e1', 'Organico Fixture', 'organico fixture', '+5491100096961', 'organic', null, 'commercial-core-v1-fixture'),
  ('96969696-9696-4969-8969-9696969696e2', 'Referido Fixture', 'referido fixture', '+5491100096962', 'promoter', '96969696-9696-4969-8969-9696969696a1', 'commercial-core-v1-fixture'),
  ('96969696-9696-4969-8969-9696969696e3', 'Ganado Fixture', 'ganado fixture', '+5491100096963', 'promoter', '96969696-9696-4969-8969-9696969696a1', 'commercial-core-v1-fixture');

insert into commercial.commercial_opportunities (
  id, commercial_business_id, stage, owner_account_id, won_business_id, won_by_account_id, won_at
) values
  ('96969696-9696-4969-8969-9696969696f1', '96969696-9696-4969-8969-9696969696e1', 'new', '96969696-9696-4969-8969-9696969696b0', null, null, null),
  ('96969696-9696-4969-8969-9696969696f2', '96969696-9696-4969-8969-9696969696e2', 'contacting', '96969696-9696-4969-8969-9696969696b0', null, null, null),
  ('96969696-9696-4969-8969-9696969696f3', '96969696-9696-4969-8969-9696969696e3', 'won', '96969696-9696-4969-8969-9696969696b0', '96969696-9696-4969-8969-9696969696d1', '96969696-9696-4969-8969-9696969696b0', '2026-10-16 12:00:00+00');
