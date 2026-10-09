-- P01-T04. Proves enqueue shares the caller transaction. Removes its own fixture rows.
-- Does not run the phase rollback.

do $$
declare
  v_count int;
begin
  perform commercial.enqueue(
    'phase01.outbox.fail',
    '{}'::jsonb,
    '33333333-3333-4333-8333-333333333333'
  );
  raise exception 'forced_failure';
exception
  when others then
    if sqlerrm is distinct from 'forced_failure' then
      raise;
    end if;
end;
$$;

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from commercial.outbox_events
  where correlation_id = '33333333-3333-4333-8333-333333333333';
  if v_count <> 0 then
    raise exception 'failed transaction kept % outbox rows', v_count;
  end if;
end;
$$;

begin;
select commercial.enqueue(
  'phase01.outbox.rollback',
  '{}'::jsonb,
  '11111111-1111-4111-8111-111111111111'
);
rollback;

do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from commercial.outbox_events
  where correlation_id = '11111111-1111-4111-8111-111111111111';
  if v_count <> 0 then
    raise exception 'rolled back enqueue left % rows', v_count;
  end if;
end;
$$;

begin;
select commercial.enqueue(
  'phase01.outbox.commit',
  '{"source":"phase01"}'::jsonb,
  '22222222-2222-4222-8222-222222222222'
);
select commercial.enqueue(
  'phase01.outbox.commit',
  '{"source":"phase01-retry"}'::jsonb,
  '44444444-4444-4444-8444-444444444444'
);
commit;

do $$
declare
  v_count int;
  v_status text;
  v_attempts int;
  v_locked timestamptz;
begin
  select count(*) into v_count
  from commercial.outbox_events
  where correlation_id in (
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444'
  );
  if v_count <> 2 then
    raise exception 'committed enqueue count was %', v_count;
  end if;

  select status, attempts, locked_at
  into v_status, v_attempts, v_locked
  from commercial.outbox_events
  where correlation_id = '22222222-2222-4222-8222-222222222222';

  if v_status is distinct from 'pending' or v_attempts is distinct from 0 or v_locked is not null then
    raise exception 'committed outbox row was not left pending';
  end if;
end;
$$;

delete from commercial.outbox_events
where correlation_id in (
  '22222222-2222-4222-8222-222222222222',
  '44444444-4444-4444-8444-444444444444'
);

begin;
set local role authenticated;
do $$
begin
  begin
    perform commercial.enqueue('phase01.outbox.denied', '{}'::jsonb, gen_random_uuid());
    raise exception 'authenticated enqueue was accepted';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
rollback;
