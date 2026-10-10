-- AUD-P03-02: two overlapping confirm_attribution calls for one opportunity.

begin;
select set_config(
  'concurrency.token',
  :'harness_token',
  false
) is not null as token_initialized;
select concurrency_harness.cleanup_aud_p03_02();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'cc222222-2222-4222-8222-222222222201', 'authenticated', 'authenticated', 'aud-p03-02-a@concurrency.invalid', 'local-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cc222222-2222-4222-8222-222222222202', 'authenticated', 'authenticated', 'aud-p03-02-b@concurrency.invalid', 'local-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cc222222-2222-4222-8222-222222222203', 'authenticated', 'authenticated', 'aud-p03-02-p@concurrency.invalid', 'local-only', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('cc222222-2222-4222-8222-222222222211', 'cc222222-2222-4222-8222-222222222201', 'internal'),
  ('cc222222-2222-4222-8222-222222222212', 'cc222222-2222-4222-8222-222222222202', 'internal'),
  ('cc222222-2222-4222-8222-222222222213', 'cc222222-2222-4222-8222-222222222203', 'promoter');

insert into commercial.internal_role_assignments (account_id, role) values
  ('cc222222-2222-4222-8222-222222222211', 'superadmin'),
  ('cc222222-2222-4222-8222-222222222212', 'superadmin');

insert into commercial.promoters (id, account_id, public_code, legal_name, status, activated_at)
values (
  'cc222222-2222-4222-8222-222222222221',
  'cc222222-2222-4222-8222-222222222213',
  'cc-aud-p03-02',
  'Harness Promoter 02',
  'active',
  now()
);

insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('cc222222-2222-4222-8222-222222222231', 'Harness Business 02', 'harness business 02', 'promoter');

insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
values ('cc222222-2222-4222-8222-222222222241', 'cc222222-2222-4222-8222-222222222231', 'new');

insert into commercial.commercial_interactions (
  commercial_business_id, opportunity_id, kind, channel, origin, actor_account_id, occurred_at
) values (
  'cc222222-2222-4222-8222-222222222231',
  'cc222222-2222-4222-8222-222222222241',
  'meeting',
  'visit',
  'cc-aud-p03-02',
  'cc222222-2222-4222-8222-222222222213',
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
  if not commercial.promoter_has_substantive_activity(
    'cc222222-2222-4222-8222-222222222241',
    'cc222222-2222-4222-8222-222222222221'
  ) then
    raise exception 'AUD-P03-02 substantive activity fixture missing';
  end if;
  if (select count(*) from commercial.opportunity_attributions where opportunity_id = 'cc222222-2222-4222-8222-222222222241') <> 0 then
    raise exception 'AUD-P03-02 fixture was not empty';
  end if;
end;
$$;

create temporary table aud_p03_02_results on commit drop as
select slot, result
from concurrency_harness.race_pair(
  'aud_p03_02_a',
  'aud_p03_02_b',
  concurrency_harness.remote_call(
    'cc222222-2222-4222-8222-222222222201',
    'commercial.confirm_attribution(''cc222222-2222-4222-8222-222222222241''::uuid, ''cc222222-2222-4222-8222-222222222221''::uuid, null::uuid, ''harness overlap'')::text'
  ),
  concurrency_harness.remote_call(
    'cc222222-2222-4222-8222-222222222202',
    'commercial.confirm_attribution(''cc222222-2222-4222-8222-222222222241''::uuid, ''cc222222-2222-4222-8222-222222222221''::uuid, null::uuid, ''harness overlap'')::text'
  )
);

do $$
declare
  v_winner integer;
  v_loser integer;
  v_rows integer;
  v_a text;
  v_b text;
  v_payload text;
begin
  select result into v_a from aud_p03_02_results where slot = 'a';
  select result into v_b from aud_p03_02_results where slot = 'b';
  v_payload := jsonb_build_object('slot_a', v_a, 'slot_b', v_b)::text;
  select count(*) into v_winner
  from aud_p03_02_results
  where result ~ '"ok"[[:space:]]*:[[:space:]]*true'
    and result like '%attribution_id%'
    and result !~ 'attribution_exists';
  select count(*) into v_loser
  from aud_p03_02_results
  where result ~ '"commercial_error_code"[[:space:]]*:[[:space:]]*"attribution_exists"';
  if v_winner <> 1 or v_loser <> 1 then
    raise exception '%', format('AUD-P03-02 assertion failed HARNESS_RESULTS %s', v_payload);
  end if;
  select count(*) into v_rows
  from commercial.opportunity_attributions
  where opportunity_id = 'cc222222-2222-4222-8222-222222222241'
    and status = 'confirmed';
  if v_rows <> 1 then
    raise exception '%', format('AUD-P03-02 final confirmed attribution count is %s HARNESS_RESULTS %s', v_rows, v_payload);
  end if;
  raise notice '%', format('HARNESS_RESULTS %s', v_payload);
end;
$$;

select concurrency_harness.cleanup_aud_p03_02();
commit;
