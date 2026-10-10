-- Applied only inside orderops_concurrency, after dblink exists.
-- Two sessions are started before either result is committed.

create or replace function concurrency_harness.assert_session()
returns void
language plpgsql
stable
as $$
declare
  v_token text;
  v_marker text;
  v_name text;
  v_disposable boolean;
begin
  if current_database() is distinct from 'orderops_concurrency' then
    raise exception 'refusing database %', current_database() using errcode = 'P0001';
  end if;
  if inet_server_addr() is not null
    and host(inet_server_addr()) not in ('127.0.0.1', '::1') then
    raise exception 'refusing non-local server address' using errcode = 'P0001';
  end if;
  v_token := current_setting('concurrency.token', true);
  select identity.token, identity.container_name, identity.disposable
    into v_marker, v_name, v_disposable
  from concurrency_harness.identity identity
  where identity.id = 1;
  if v_disposable is distinct from true
    or v_marker is null
    or v_token is distinct from v_marker
    or v_name is null
    or v_name !~ '^orderops_concurrency_discard_[a-z0-9]{8}$'
    or v_name ~* 'majo|supabase_db_orderops' then
    raise exception 'disposable marker rejected' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function concurrency_harness.race_pair(
  p_conn_a text,
  p_conn_b text,
  p_sql_a text,
  p_sql_b text
)
returns table(slot text, result text)
language plpgsql
as $$
declare
  v_first text;
  v_second text;
  v_first_result text;
  v_second_result text;
  v_tries integer := 0;
begin
  perform concurrency_harness.assert_session();
  perform set_config('statement_timeout', '45s', true);
  begin
    perform dblink_disconnect(p_conn_a);
  exception
    when others then null;
  end;
  begin
    perform dblink_disconnect(p_conn_b);
  exception
    when others then null;
  end;
  perform dblink_connect(p_conn_a, 'dbname=orderops_concurrency user=postgres');
  perform dblink_connect(p_conn_b, 'dbname=orderops_concurrency user=postgres');
  perform dblink_exec(p_conn_a, 'begin');
  perform dblink_exec(p_conn_b, 'begin');
  perform dblink_exec(p_conn_a, 'set local lock_timeout = ''3s''');
  perform dblink_exec(p_conn_b, 'set local lock_timeout = ''3s''');
  perform dblink_exec(p_conn_a, 'set local statement_timeout = ''15s''');
  perform dblink_exec(p_conn_b, 'set local statement_timeout = ''15s''');
  if dblink_send_query(p_conn_a, p_sql_a) <> 1 or dblink_send_query(p_conn_b, p_sql_b) <> 1 then
    raise exception 'failed to send concurrent queries' using errcode = 'P0001';
  end if;

  loop
    v_tries := v_tries + 1;
    exit when dblink_is_busy(p_conn_a) = 0 or dblink_is_busy(p_conn_b) = 0 or v_tries > 200;
    perform pg_sleep(0.05);
  end loop;
  if dblink_is_busy(p_conn_a) = 1 and dblink_is_busy(p_conn_b) = 1 then
    raise exception 'neither concurrent session finished before the wait limit' using errcode = 'P0001';
  end if;

  if dblink_is_busy(p_conn_a) = 0 then
    v_first := 'a';
    v_second := 'b';
  else
    v_first := 'b';
    v_second := 'a';
  end if;

  if v_first = 'a' then
    select t.r into v_first_result from dblink_get_result(p_conn_a) as t(r text);
    perform dblink_get_result(p_conn_a);
    perform dblink_exec(p_conn_a, 'commit');
  else
    select t.r into v_first_result from dblink_get_result(p_conn_b) as t(r text);
    perform dblink_get_result(p_conn_b);
    perform dblink_exec(p_conn_b, 'commit');
  end if;

  if v_second = 'a' then
    select t.r into v_second_result from dblink_get_result(p_conn_a) as t(r text);
    perform dblink_get_result(p_conn_a);
    perform dblink_exec(p_conn_a, 'commit');
  else
    select t.r into v_second_result from dblink_get_result(p_conn_b) as t(r text);
    perform dblink_get_result(p_conn_b);
    perform dblink_exec(p_conn_b, 'commit');
  end if;

  slot := 'a';
  result := case when v_first = 'a' then v_first_result else v_second_result end;
  return next;
  slot := 'b';
  result := case when v_first = 'b' then v_first_result else v_second_result end;
  return next;

  perform dblink_disconnect(p_conn_a);
  perform dblink_disconnect(p_conn_b);
exception
  when others then
    begin perform dblink_disconnect(p_conn_a); exception when others then null; end;
    begin perform dblink_disconnect(p_conn_b); exception when others then null; end;
    raise;
end;
$$;

create or replace function concurrency_harness.remote_call(p_user_id uuid, p_body text)
returns text
language sql
stable
as $$
  select format(
    'select call.result from (select set_config(%L, %L, true), set_config(%L, %L, true)) cfg cross join lateral (select concurrency_harness.assert_session()) guard cross join lateral (select %s as result) call',
    'request.jwt.claim.sub',
    p_user_id::text,
    'concurrency.token',
    current_setting('concurrency.token', true),
    p_body
  );
$$;

create or replace function concurrency_harness.cleanup_aud_p03_01()
returns void
language plpgsql
as $$
begin
  perform concurrency_harness.assert_session();
  delete from commercial.attribution_claims
  where commercial_business_id = 'cc111111-1111-4111-8111-111111111131'
     or promoter_id = 'cc111111-1111-4111-8111-111111111121';
  delete from commercial.commercial_interactions
  where commercial_business_id = 'cc111111-1111-4111-8111-111111111131';
  delete from commercial.commercial_opportunities
  where id = 'cc111111-1111-4111-8111-111111111141'
     or commercial_business_id = 'cc111111-1111-4111-8111-111111111131';
  delete from commercial.commercial_businesses
  where id = 'cc111111-1111-4111-8111-111111111131';
  delete from commercial.promoters
  where id = 'cc111111-1111-4111-8111-111111111121';
  delete from commercial.platform_accounts
  where id = 'cc111111-1111-4111-8111-111111111111';
  delete from auth.users
  where id = 'cc111111-1111-4111-8111-111111111101';
end;
$$;

create or replace function concurrency_harness.cleanup_aud_p03_02()
returns void
language plpgsql
as $$
begin
  perform concurrency_harness.assert_session();

  if exists (
    select 1
    from commercial.audit_events event
    where (
      event.actor_account_id in (
        'cc222222-2222-4222-8222-222222222211',
        'cc222222-2222-4222-8222-222222222212',
        'cc222222-2222-4222-8222-222222222213'
      )
      or event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
      or event.after->>'promoter_id' = 'cc222222-2222-4222-8222-222222222221'
    )
    and not (
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
    )
  ) then
    raise exception 'unexpected audit dependency blocks AUD-P03-02 cleanup' using errcode = 'P0001';
  end if;

  delete from commercial.opportunity_attributions
  where opportunity_id = 'cc222222-2222-4222-8222-222222222241';
  delete from commercial.commercial_interactions
  where opportunity_id = 'cc222222-2222-4222-8222-222222222241'
     or commercial_business_id = 'cc222222-2222-4222-8222-222222222231';
  delete from commercial.commercial_opportunities
  where id = 'cc222222-2222-4222-8222-222222222241';
  delete from commercial.commercial_businesses
  where id = 'cc222222-2222-4222-8222-222222222231';
  delete from commercial.promoters
  where id = 'cc222222-2222-4222-8222-222222222221';
  delete from commercial.internal_role_assignments
  where account_id in (
    'cc222222-2222-4222-8222-222222222211',
    'cc222222-2222-4222-8222-222222222212'
  );
  delete from commercial.platform_accounts as account
  where account.id in (
    'cc222222-2222-4222-8222-222222222211',
    'cc222222-2222-4222-8222-222222222212',
    'cc222222-2222-4222-8222-222222222213'
  )
  and not exists (
    select 1
    from commercial.audit_events event
    where event.actor_account_id = account.id
      and event.action = 'attribution.confirmed'
      and event.actor_kind = 'internal'
      and event.entity_table = 'opportunity_attributions'
      and event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
  );
  delete from auth.users as fixture_user
  where fixture_user.id in (
    'cc222222-2222-4222-8222-222222222201',
    'cc222222-2222-4222-8222-222222222202',
    'cc222222-2222-4222-8222-222222222203'
  )
  and not exists (
    select 1
    from commercial.platform_accounts account
    where account.user_id = fixture_user.id
  );

  if exists (
    select 1
    from commercial.platform_accounts account
    where account.id in (
      'cc222222-2222-4222-8222-222222222211',
      'cc222222-2222-4222-8222-222222222212',
      'cc222222-2222-4222-8222-222222222213'
    )
    and not exists (
      select 1
      from commercial.audit_events event
      where event.actor_account_id = account.id
        and event.action = 'attribution.confirmed'
        and event.after->>'opportunity_id' = 'cc222222-2222-4222-8222-222222222241'
    )
  ) then
    raise exception 'AUD-P03-02 cleanup left an unreferenced fixture account' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function concurrency_harness.cleanup_blk_crm_02()
returns void
language plpgsql
as $$
begin
  perform concurrency_harness.assert_session();
  delete from commercial.dispute_events
  where dispute_id in (
    select id from commercial.attribution_disputes
    where opportunity_id = 'cc333333-3333-4333-8333-333333333341'
  );
  delete from commercial.dispute_parties
  where dispute_id in (
    select id from commercial.attribution_disputes
    where opportunity_id = 'cc333333-3333-4333-8333-333333333341'
  );
  delete from commercial.attribution_disputes
  where opportunity_id = 'cc333333-3333-4333-8333-333333333341';
  delete from commercial.opportunity_attributions
  where opportunity_id = 'cc333333-3333-4333-8333-333333333341';
  delete from commercial.commercial_opportunities
  where id = 'cc333333-3333-4333-8333-333333333341';
  delete from commercial.commercial_businesses
  where id = 'cc333333-3333-4333-8333-333333333331';
  delete from commercial.promoters
  where id = 'cc333333-3333-4333-8333-333333333321';
  delete from commercial.internal_role_assignments
  where account_id in (
    'cc333333-3333-4333-8333-333333333311',
    'cc333333-3333-4333-8333-333333333312'
  );
  delete from commercial.platform_accounts
  where id in (
    'cc333333-3333-4333-8333-333333333311',
    'cc333333-3333-4333-8333-333333333312',
    'cc333333-3333-4333-8333-333333333313'
  );
  delete from auth.users
  where id in (
    'cc333333-3333-4333-8333-333333333301',
    'cc333333-3333-4333-8333-333333333302',
    'cc333333-3333-4333-8333-333333333303'
  );
end;
$$;
