select set_config(
  'concurrency.token',
  :'harness_token',
  false
) is not null as token_initialized;
select concurrency_harness.assert_session();

do $$
declare
  v_operational integer;
  v_other_events integer;
  v_broken_actors integer;
  v_extra_accounts integer;
  v_extra_users integer;
begin
  select count(*) into v_operational
  from (
    select id from commercial.attribution_claims
    where promoter_id::text like 'cc%' or commercial_business_id::text like 'cc%'
    union all
    select id from commercial.opportunity_attributions
    where opportunity_id::text like 'cc%' or promoter_id::text like 'cc%'
    union all
    select id from commercial.attribution_disputes
    where opportunity_id::text like 'cc%' or opened_by::text like 'cc%'
    union all
    select dispute_id from commercial.dispute_parties
    where promoter_id::text like 'cc%'
    union all
    select id from commercial.dispute_events
    where actor_account_id::text like 'cc%'
    union all
    select id from commercial.commercial_interactions
    where commercial_business_id::text like 'cc%' or opportunity_id::text like 'cc%' or actor_account_id::text like 'cc%'
    union all
    select id from commercial.commercial_opportunities
    where id::text like 'cc%' or commercial_business_id::text like 'cc%'
    union all
    select id from commercial.commercial_businesses
    where id::text like 'cc%'
    union all
    select id from commercial.promoters
    where id::text like 'cc%' or account_id::text like 'cc%'
    union all
    select account_id from commercial.internal_role_assignments
    where account_id::text like 'cc%'
  ) operational;
  if v_operational <> 0 then
    raise exception 'operational concurrency fixtures still present: %', v_operational;
  end if;

  select count(*) into v_other_events
  from commercial.audit_events event
  where not (
    event.action = 'attribution.confirmed'
    and event.actor_kind = 'internal'
    and event.entity_schema = 'commercial'
    and event.entity_table = 'opportunity_attributions'
    and event.correlation_id = event.entity_id
    and event.reason = 'harness overlap'
    and event.after->>'method' = 'manual'
    and event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
    and event.after->>'promoter_id' = 'cc222222-2222-4222-8222-222222222221'
    and event.actor_account_id in (
      'cc222222-2222-4222-8222-222222222211',
      'cc222222-2222-4222-8222-222222222212'
    )
  );
  if v_other_events <> 0 then
    raise exception 'unexpected audit residue: %', v_other_events;
  end if;

  select count(*) into v_broken_actors
  from commercial.audit_events event
  where not exists (
    select 1
    from commercial.platform_accounts account
    join auth.users fixture_user on fixture_user.id = account.user_id
    where account.id = event.actor_account_id
      and account.kind = 'internal'
      and (account.id, account.user_id) in (
        ('cc222222-2222-4222-8222-222222222211', 'cc222222-2222-4222-8222-222222222201'),
        ('cc222222-2222-4222-8222-222222222212', 'cc222222-2222-4222-8222-222222222202')
      )
  );
  if v_broken_actors <> 0 then
    raise exception 'retained audit event is missing its actor account or user: %', v_broken_actors;
  end if;

  select count(*) into v_extra_accounts
  from commercial.platform_accounts account
  where account.id::text like 'cc%'
    and not exists (
      select 1
      from commercial.audit_events event
      where event.actor_account_id = account.id
        and event.action = 'attribution.confirmed'
        and event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
    );
  if v_extra_accounts <> 0 then
    raise exception 'unreferenced fixture accounts still present: %', v_extra_accounts;
  end if;

  select count(*) into v_extra_users
  from auth.users fixture_user
  where fixture_user.id::text like 'cc%'
    and not exists (
      select 1
      from commercial.platform_accounts account
      where account.user_id = fixture_user.id
        and (account.id, account.user_id) in (
          ('cc222222-2222-4222-8222-222222222211', 'cc222222-2222-4222-8222-222222222201'),
          ('cc222222-2222-4222-8222-222222222212', 'cc222222-2222-4222-8222-222222222202')
        )
        and exists (
          select 1
          from commercial.audit_events event
          where event.actor_account_id = account.id
            and event.action = 'attribution.confirmed'
            and event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
        )
    );
  if v_extra_users <> 0 then
    raise exception 'unreferenced fixture users still present: %', v_extra_users;
  end if;
end;
$$;

select 'retained_audit_events=' || count(*)::text
from commercial.audit_events event
where event.action = 'attribution.confirmed'
  and event.actor_kind = 'internal'
  and event.entity_schema = 'commercial'
  and event.entity_table = 'opportunity_attributions'
  and event.correlation_id = event.entity_id
  and event.reason = 'harness overlap'
  and event.after->>'method' = 'manual'
  and event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
  and event.after->>'promoter_id' = 'cc222222-2222-4222-8222-222222222221'
  and event.actor_account_id in (
    'cc222222-2222-4222-8222-222222222211',
    'cc222222-2222-4222-8222-222222222212'
  );

select 'retained_actor_accounts=' || count(distinct event.actor_account_id)::text
from commercial.audit_events event
where event.action = 'attribution.confirmed'
  and event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
  and event.actor_account_id in (
    'cc222222-2222-4222-8222-222222222211',
    'cc222222-2222-4222-8222-222222222212'
  );

select 'retained_actor_users=' || count(distinct account.user_id)::text
from commercial.platform_accounts account
where account.id in (
  'cc222222-2222-4222-8222-222222222211',
  'cc222222-2222-4222-8222-222222222212'
)
and exists (
  select 1
  from commercial.audit_events event
  where event.actor_account_id = account.id
    and event.action = 'attribution.confirmed'
    and event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
);
