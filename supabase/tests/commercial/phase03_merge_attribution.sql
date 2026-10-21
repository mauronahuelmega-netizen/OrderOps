-- Merging businesses does not change an attribution promoter. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '68686868-6868-4868-8868-686868686801', 'authenticated', 'authenticated', 'phase03-merge-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '68686868-6868-4868-8868-686868686802', 'authenticated', 'authenticated', 'phase03-merge-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('68686868-6868-4868-8868-686868686811', '68686868-6868-4868-8868-686868686801', 'internal'),
  ('68686868-6868-4868-8868-686868686812', '68686868-6868-4868-8868-686868686802', 'promoter');
insert into commercial.internal_role_assignments (account_id, role)
values ('68686868-6868-4868-8868-686868686811', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status)
values ('68686868-6868-4868-8868-686868686821', '68686868-6868-4868-8868-686868686812', 'pmergeattr', 'Ana Merge', 'active');
insert into commercial.commercial_businesses (id, display_name, normalized_name, normalized_phone, initial_channel) values
  ('68686868-6868-4868-8868-686868686831', 'Pan Uno', 'pan uno', '+5491183000001', 'promoter'),
  ('68686868-6868-4868-8868-686868686832', 'Pan Dos', 'pan dos', '+5491183000002', 'organic');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage) values
  ('68686868-6868-4868-8868-686868686841', '68686868-6868-4868-8868-686868686832', 'new');
insert into commercial.commercial_interactions (
  commercial_business_id, opportunity_id, kind, channel, origin, occurred_at
) values (
  '68686868-6868-4868-8868-686868686832', '68686868-6868-4868-8868-686868686841', 'note', 'web', 'pmergeattr', now()
);
insert into commercial.opportunity_attributions (opportunity_id, promoter_id, status, method, reason)
values ('68686868-6868-4868-8868-686868686841', '68686868-6868-4868-8868-686868686821', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686801', true);

do $$
declare
  v_promoter uuid;
begin
  perform commercial.merge_commercial_businesses(
    '68686868-6868-4868-8868-686868686831',
    '68686868-6868-4868-8868-686868686832',
    'misma marca'
  );
  select promoter_id into v_promoter
  from commercial.opportunity_attributions
  where opportunity_id = '68686868-6868-4868-8868-686868686841';
  if v_promoter is distinct from '68686868-6868-4868-8868-686868686821' then
    raise exception 'merge changed attribution promoter to %', v_promoter;
  end if;
end;
$$;

rollback;
