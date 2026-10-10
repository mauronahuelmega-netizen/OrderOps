-- AUD-P03-01: two overlapping create_claim calls, same promoter and business.
-- Fixtures commit before the race. Both remote sessions start before either commits.

begin;
select set_config(
  'concurrency.token',
  :'harness_token',
  false
) is not null as token_initialized;
select concurrency_harness.cleanup_aud_p03_01();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'cc111111-1111-4111-8111-111111111101',
  'authenticated', 'authenticated', 'aud-p03-01@concurrency.invalid', 'local-only', now(),
  '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into commercial.platform_accounts (id, user_id, kind)
values ('cc111111-1111-4111-8111-111111111111', 'cc111111-1111-4111-8111-111111111101', 'promoter');

insert into commercial.promoters (id, account_id, public_code, legal_name, status, activated_at)
values (
  'cc111111-1111-4111-8111-111111111121',
  'cc111111-1111-4111-8111-111111111111',
  'cc-aud-p03-01',
  'Harness Promoter 01',
  'active',
  now()
);

insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('cc111111-1111-4111-8111-111111111131', 'Harness Business 01', 'harness business 01', 'organic');

insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
values ('cc111111-1111-4111-8111-111111111141', 'cc111111-1111-4111-8111-111111111131', 'new');

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
  if (select count(*) from commercial.promoters where id = 'cc111111-1111-4111-8111-111111111121' and status = 'active') <> 1 then
    raise exception 'AUD-P03-01 fixture promoter missing';
  end if;
  if (select count(*) from commercial.commercial_businesses where id = 'cc111111-1111-4111-8111-111111111131') <> 1 then
    raise exception 'AUD-P03-01 fixture business missing';
  end if;
  if (select count(*) from commercial.attribution_claims where commercial_business_id = 'cc111111-1111-4111-8111-111111111131') <> 0 then
    raise exception 'AUD-P03-01 fixture was not empty';
  end if;
end;
$$;

create temporary table aud_p03_01_results on commit drop as
select slot, result
from concurrency_harness.race_pair(
  'aud_p03_01_a',
  'aud_p03_01_b',
  concurrency_harness.remote_call(
    'cc111111-1111-4111-8111-111111111101',
    'commercial.create_claim(''cc111111-1111-4111-8111-111111111131''::uuid, ''cc111111-1111-4111-8111-111111111141''::uuid)::text'
  ),
  concurrency_harness.remote_call(
    'cc111111-1111-4111-8111-111111111101',
    'commercial.create_claim(''cc111111-1111-4111-8111-111111111131''::uuid, ''cc111111-1111-4111-8111-111111111141''::uuid)::text'
  )
);

do $$
declare
  v_winner integer;
  v_loser integer;
  v_claims integer;
  v_a text;
  v_b text;
  v_payload text;
begin
  select result into v_a from aud_p03_01_results where slot = 'a';
  select result into v_b from aud_p03_01_results where slot = 'b';
  v_payload := jsonb_build_object('slot_a', v_a, 'slot_b', v_b)::text;
  select count(*) into v_winner
  from aud_p03_01_results
  where result ~ '"duplicate"[[:space:]]*:[[:space:]]*false'
    and result !~ '"duplicate"[[:space:]]*:[[:space:]]*true';
  select count(*) into v_loser
  from aud_p03_01_results
  where result ~ '"duplicate"[[:space:]]*:[[:space:]]*true';
  if v_winner <> 1 or v_loser <> 1 then
    raise exception '%', format('AUD-P03-01 assertion failed HARNESS_RESULTS %s', v_payload);
  end if;
  select count(*) into v_claims
  from commercial.attribution_claims
  where promoter_id = 'cc111111-1111-4111-8111-111111111121'
    and commercial_business_id = 'cc111111-1111-4111-8111-111111111131'
    and status = 'provisional';
  if v_claims <> 1 then
    raise exception '%', format('AUD-P03-01 final provisional claim count is %s HARNESS_RESULTS %s', v_claims, v_payload);
  end if;
  raise notice '%', format('HARNESS_RESULTS %s', v_payload);
end;
$$;

select concurrency_harness.cleanup_aud_p03_01();
commit;
