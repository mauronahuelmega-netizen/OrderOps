-- One open privacy request per subject and kind. Closes the select-then-insert race.

create unique index privacy_requests_one_open_idx
  on commercial.privacy_requests (subject_kind, subject_ref, request_kind)
  where status = 'open';

create or replace function commercial.open_privacy_request(
  p_subject_kind text,
  p_subject_ref text,
  p_request_kind text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid := commercial.current_account_id();
  v_id uuid;
begin
  if auth.uid() is null or v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if not commercial.has_permission('crm.write') and not commercial.has_permission('privacy.resolve') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_subject_kind is distinct from 'contact' or p_request_kind not in ('access', 'rectification', 'deletion') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_subject_ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select id into v_id
  from commercial.privacy_requests
  where subject_kind = p_subject_kind
    and subject_ref = p_subject_ref
    and request_kind = p_request_kind
    and status = 'open';
  if v_id is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'request_id', v_id);
  end if;

  begin
    insert into commercial.privacy_requests (
      subject_kind, subject_ref, request_kind, status, opened_by
    ) values (
      p_subject_kind, p_subject_ref, p_request_kind, 'open', v_actor
    ) returning id into v_id;
  exception
    when unique_violation then
      select id into v_id
      from commercial.privacy_requests
      where subject_kind = p_subject_kind
        and subject_ref = p_subject_ref
        and request_kind = p_request_kind
        and status = 'open';
      return jsonb_build_object('ok', true, 'duplicate', true, 'request_id', v_id);
  end;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'privacy.opened', 'commercial', 'privacy_requests', v_id, v_id,
    jsonb_build_object('request_kind', p_request_kind, 'subject_ref', p_subject_ref)
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'request_id', v_id);
end;
$$;
