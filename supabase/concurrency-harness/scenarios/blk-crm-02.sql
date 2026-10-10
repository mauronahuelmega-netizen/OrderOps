-- BLK-CRM-02: two overlapping open_dispute calls for one opportunity.

begin;
select set_config(
  'concurrency.token',
  :'harness_token',
  false
) is not null as token_initialized;
select concurrency_harness.cleanup_blk_crm_02();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'cc333333-3333-4333-8333-333333333301', 'authenticated', 'authenticated', 'blk-crm-02-a@concurrency.invalid', 'local-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cc333333-3333-4333-8333-333333333302', 'authenticated', 'authenticated', 'blk-crm-02-b@concurrency.invalid', 'local-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cc333333-3333-4333-8333-333333333303', 'authenticated', 'authenticated', 'blk-crm-02-p@concurrency.invalid', 'local-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('cc333333-3333-4333-8333-333333333311', 'cc333333-3333-4333-8333-333333333301', 'internal'),
  ('cc333333-3333-4333-8333-333333333312', 'cc333333-3333-4333-8333-333333333302', 'internal'),
  ('cc333333-3333-4333-8333-333333333313', 'cc333333-3333-4333-8333-333333333303', 'promoter');

insert into commercial.internal_role_assignments (account_id, role) values
  ('cc333333-3333-4333-8333-333333333311', 'superadmin'),
  ('cc333333-3333-4333-8333-333333333312', 'superadmin');

insert into commercial.promoters (id, account_id, public_code, legal_name, status, activated_at)
values (
  'cc333333-3333-4333-8333-333333333321',
  'cc333333-3333-4333-8333-333333333313',
  'cc-blk-crm-02',
  'Harness Promoter 03',
  'active',
  now()
);

insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('cc333333-3333-4333-8333-333333333331', 'Harness Business 03', 'harness business 03', 'internal');

insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
values ('cc333333-3333-4333-8333-333333333341', 'cc333333-3333-4333-8333-333333333331', 'new');

insert into commercial.opportunity_attributions (
  opportunity_id, promoter_id, status, method, reason, confirmed_by, confirmed_at
) values (
  'cc333333-3333-4333-8333-333333333341',
  'cc333333-3333-4333-8333-333333333321',
  'confirmed',
  'manual',
  'harness link',
  'cc333333-3333-4333-8333-333333333311',
  now()
);

commit;

begin;
select set_config(
  'concurrency.token',
  :'harness_token',
  false
) is not null as token_initialized;
select concurrency_harness.assert_session();

do $$
begin
  if (select count(*) from commercial.opportunity_attributions
      where opportunity_id = 'cc333333-3333-4333-8333-333333333341'
        and promoter_id = 'cc333333-3333-4333-8333-333333333321'
        and status = 'confirmed') <> 1 then
    raise exception 'BLK-CRM-02 linked attribution fixture missing';
  end if;
  if (select archived_at from commercial.commercial_opportunities where id = 'cc333333-3333-4333-8333-333333333341') is not null then
    raise exception 'BLK-CRM-02 opportunity is archived';
  end if;
  if (select count(*) from commercial.attribution_disputes where opportunity_id = 'cc333333-3333-4333-8333-333333333341') <> 0 then
    raise exception 'BLK-CRM-02 fixture was not empty';
  end if;
end;
$$;

create temporary table blk_crm_02_results on commit drop as
select slot, result
from concurrency_harness.race_pair(
  'blk_crm_02_a',
  'blk_crm_02_b',
  concurrency_harness.remote_call(
    'cc333333-3333-4333-8333-333333333301',
    'commercial.open_dispute(''cc333333-3333-4333-8333-333333333341''::uuid, array[''cc333333-3333-4333-8333-333333333321''::uuid], ''harness overlap'')::text'
  ),
  concurrency_harness.remote_call(
    'cc333333-3333-4333-8333-333333333302',
    'commercial.open_dispute(''cc333333-3333-4333-8333-333333333341''::uuid, array[''cc333333-3333-4333-8333-333333333321''::uuid], ''harness overlap'')::text'
  )
);

do $$
declare
  v_winner integer;
  v_loser integer;
  v_rows integer;
  v_loser_text text;
  v_a text;
  v_b text;
  v_payload text;
begin
  select result into v_a from blk_crm_02_results where slot = 'a';
  select result into v_b from blk_crm_02_results where slot = 'b';
  v_payload := jsonb_build_object('slot_a', v_a, 'slot_b', v_b)::text;
  select count(*) into v_winner
  from blk_crm_02_results
  where result ~ '"ok"[[:space:]]*:[[:space:]]*true'
    and result like '%dispute_id%';
  select count(*) into v_loser
  from blk_crm_02_results
  where result ~ '"commercial_error_code"[[:space:]]*:[[:space:]]*"dispute_open_exists"';
  select result into v_loser_text
  from blk_crm_02_results
  where result ~ '"commercial_error_code"[[:space:]]*:[[:space:]]*"dispute_open_exists"';
  if v_winner <> 1 or v_loser <> 1 or v_loser_text like '%dispute_id%' then
    raise exception '%', format('BLK-CRM-02 assertion failed HARNESS_RESULTS %s', v_payload);
  end if;
  select count(*) into v_rows
  from commercial.attribution_disputes
  where opportunity_id = 'cc333333-3333-4333-8333-333333333341'
    and status = 'open';
  if v_rows <> 1 then
    raise exception '%', format('BLK-CRM-02 final open dispute count is %s HARNESS_RESULTS %s', v_rows, v_payload);
  end if;
  raise notice '%', format('HARNESS_RESULTS %s', v_payload);
end;
$$;

select concurrency_harness.cleanup_blk_crm_02();
commit;
