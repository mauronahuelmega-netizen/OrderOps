-- Post-audit correction. Rolls back fixtures.
begin;

do $$
declare
  v_result jsonb;
  v_public jsonb;
  v_businesses int;
  i int;
begin
  v_result := commercial.submit_demo_request(
    'Ana', 'Audit Norte', '11 7900-0001', 'panaderia', null, null, null, null, 'audit-no-ip', null
  );
  if v_result->>'commercial_error_code' is distinct from 'unavailable' then
    raise exception 'missing ip hash returned %', v_result;
  end if;

  for i in 1..5 loop
    v_result := commercial.submit_demo_request(
      'Ana', 'Audit Norte ' || i::text, '11 7900-010' || i::text, 'panaderia', null, null, null, null,
      'audit-ip-' || i::text, 'audit-same-ip'
    );
    if v_result->>'ok' is distinct from 'true' then
      raise exception 'same ip slot % returned %', i, v_result;
    end if;
  end loop;
  v_result := commercial.submit_demo_request(
    'Ana', 'Audit Norte 6', '11 7900-0199', 'panaderia', null, null, null, null, 'audit-ip-6', 'audit-same-ip'
  );
  if v_result->>'commercial_error_code' is distinct from 'rate_limited' then
    raise exception 'sixth same ip returned %', v_result;
  end if;

  for i in 1..5 loop
    v_result := commercial.submit_demo_request(
      'Ana', 'Audit Fijo', '11 7900-0201', 'panaderia', null, null, null, null,
      'audit-phone-' || i::text, 'audit-phone-ip-' || i::text
    );
    if v_result->>'ok' is distinct from 'true' then
      raise exception 'same phone slot % returned %', i, v_result;
    end if;
  end loop;
  v_result := commercial.submit_demo_request(
    'Ana', 'Audit Fijo', '11 7900-0201', 'panaderia', null, null, null, null, 'audit-phone-6', 'audit-phone-ip-6'
  );
  if v_result->>'commercial_error_code' is distinct from 'rate_limited' then
    raise exception 'sixth same phone returned %', v_result;
  end if;

  v_result := commercial.submit_demo_request(
    'Ana', 'Audit Replay', '11 7900-0301', 'panaderia', null, null, null, null, 'audit-replay', 'audit-replay-ip'
  );
  v_public := public.submit_demo_request(
    'Otra', 'Otro Comercio', '11 7900-0302', 'cafeteria', null, null, null, null, 'audit-replay', null
  );
  if v_public->>'ok' is distinct from 'true' or v_public->>'duplicate' is distinct from 'true' then
    raise exception 'public replay returned %', v_public;
  end if;
  if v_public ? 'submission_id' or v_public ? 'business_id' or v_public ? 'opportunity_id' then
    raise exception 'public replay exposed ids %', v_public;
  end if;
  select count(*) into v_businesses from commercial.commercial_businesses where normalized_phone = '+5491179000302';
  if v_businesses <> 0 then
    raise exception 'replay created another business';
  end if;
  select count(*) into v_businesses from commercial.demo_submissions where idempotency_key = 'audit-replay';
  if v_businesses <> 1 then
    raise exception 'replay submission count %', v_businesses;
  end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform public.list_open_opportunities();
    raise exception 'anon listed opportunities';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.opportunity_detail('00000000-0000-4000-8000-000000000001');
    raise exception 'anon read detail';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.transition_opportunity('00000000-0000-4000-8000-000000000001', 'contacting', null);
    raise exception 'anon transitioned';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.upsert_task('00000000-0000-4000-8000-000000000001', null, 'x', 'open', null, 'normal', null);
    raise exception 'anon upserted task';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.merge_commercial_businesses('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'x');
    raise exception 'anon merged';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.commercial_session();
    raise exception 'anon read session';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.submit_demo_request('Ana', 'X', '11 7900-0401', 'panaderia', null, null, null, null, 'audit-anon', 'hash');
    raise exception 'anon submitted demo';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role authenticated;
do $$
declare
  v_result jsonb;
begin
  v_result := public.list_open_opportunities();
  if v_result->>'commercial_error_code' is distinct from 'unauthenticated' then
    raise exception 'authenticated list returned %', v_result;
  end if;
  v_result := public.transition_opportunity('00000000-0000-4000-8000-000000000001', 'contacting', null);
  if v_result->>'commercial_error_code' is distinct from 'unauthenticated' then
    raise exception 'authenticated transition returned %', v_result;
  end if;
  begin
    perform public.submit_demo_request('Ana', 'X', '11 7900-0402', 'panaderia', null, null, null, null, 'audit-auth', 'hash');
    raise exception 'authenticated submitted demo';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role service_role;
do $$
declare
  v_result jsonb;
begin
  v_result := public.submit_demo_request(
    'Ana', 'Audit Service', '11 7900-0501', 'panaderia', null, null, null, null, 'audit-service', 'audit-service-ip'
  );
  if v_result->>'ok' is distinct from 'true' or v_result ? 'business_id' then
    raise exception 'service submit returned %', v_result;
  end if;
  begin
    perform public.merge_commercial_businesses('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'x');
    raise exception 'service role merged';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
