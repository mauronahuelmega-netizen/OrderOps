-- P01-T04: enqueue an outbox row in the caller's transaction.
-- Does not send mail and does not start a worker.

alter table commercial.outbox_events
  add column correlation_id uuid not null;

create or replace function commercial.enqueue(
  p_event_name text,
  p_payload jsonb,
  p_correlation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_id uuid;
begin
  insert into commercial.outbox_events (
    event_name,
    payload,
    occurred_at,
    status,
    attempts,
    available_at,
    locked_at,
    correlation_id
  ) values (
    p_event_name,
    p_payload,
    pg_catalog.now(),
    'pending',
    0,
    pg_catalog.now(),
    null,
    p_correlation_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function commercial.enqueue(text, jsonb, uuid) from public, anon, authenticated;
