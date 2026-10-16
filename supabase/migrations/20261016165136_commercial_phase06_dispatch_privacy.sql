-- PHASE-06 local dispatch, archive, and privacy. Additive. No economic policy changes.

create table commercial.notification_preferences (
  account_id uuid primary key references commercial.platform_accounts (id),
  opt_out_noncritical boolean not null default false
);

alter table commercial.notification_preferences enable row level security;
alter table commercial.notification_preferences force row level security;
revoke all on table commercial.notification_preferences from public, anon, authenticated;

alter table commercial.commercial_businesses
  add column fixture_tag text;

create index commercial_businesses_fixture_tag_idx
  on commercial.commercial_businesses (fixture_tag)
  where fixture_tag is not null;

create or replace function commercial.outbox_requires_delivery(p_event_name text)
returns boolean
language sql
immutable
as $$
  select p_event_name in (
    'demo.submitted',
    'opportunity.assigned',
    'task.due',
    'attribution.confirmed',
    'attribution.rejected',
    'dispute.opened',
    'onboarding.authorized',
    'settlement.approved',
    'invoice.observed',
    'payment.recorded'
  )
$$;

create or replace function commercial.outbox_ignores_opt_out(p_event_name text)
returns boolean
language sql
immutable
as $$
  select p_event_name like 'payment.%'
    or p_event_name like 'dispute.%'
    or p_event_name like 'security.%'
$$;

create or replace function commercial.claim_outbox_batch(p_limit integer)
returns setof commercial.outbox_events
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 50 then
    raise exception 'validation' using errcode = 'P0001';
  end if;

  return query
  update commercial.outbox_events event
  set status = 'processing',
      locked_at = pg_catalog.now(),
      attempts = event.attempts + 1
  where event.id in (
    select candidate.id
    from commercial.outbox_events candidate
    where candidate.status = 'pending'
      and candidate.available_at <= pg_catalog.now()
    order by candidate.available_at, candidate.id
    for update skip locked
    limit p_limit
  )
  returning event.*;
end;
$$;

create or replace function commercial.record_inbox(
  p_event_id uuid,
  p_account_id uuid,
  p_title text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_event commercial.outbox_events%rowtype;
  v_opt_out boolean;
begin
  select * into v_event from commercial.outbox_events where id = p_event_id;
  if v_event.id is null then
    raise exception 'validation' using errcode = 'P0001';
  end if;

  select preference.opt_out_noncritical into v_opt_out
  from commercial.notification_preferences preference
  where preference.account_id = p_account_id;

  if coalesce(v_opt_out, false)
     and not commercial.outbox_ignores_opt_out(v_event.event_name) then
    return;
  end if;

  insert into commercial.notifications (
    recipient_account_id, event_name, outbox_event_id, title, body
  ) values (
    p_account_id, v_event.event_name, v_event.id, p_title, p_body
  )
  on conflict (outbox_event_id, recipient_account_id) do nothing;

  insert into commercial.notification_deliveries (
    outbox_event_id, channel, destination, status, attempt_count
  ) values (
    v_event.id, 'inbox', p_account_id::text, 'sent', 1
  )
  on conflict (outbox_event_id, channel, destination) do nothing;
end;
$$;

create or replace function commercial.record_email_result(
  p_event_id uuid,
  p_destination text,
  p_status text,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
begin
  if p_status not in ('sent', 'failed', 'dead') then
    raise exception 'validation' using errcode = 'P0001';
  end if;

  insert into commercial.notification_deliveries (
    outbox_event_id, channel, destination, status, attempt_count, last_error
  ) values (
    p_event_id, 'email', p_destination, p_status, 1, p_error
  )
  on conflict (outbox_event_id, channel, destination) do update
  set status = excluded.status,
      attempt_count = commercial.notification_deliveries.attempt_count + 1,
      last_error = excluded.last_error;
end;
$$;

create or replace function commercial.release_outbox(
  p_event_id uuid,
  p_outcome text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_attempts int;
begin
  select attempts into v_attempts from commercial.outbox_events where id = p_event_id;
  if v_attempts is null then
    raise exception 'validation' using errcode = 'P0001';
  end if;

  if p_outcome = 'delivered' then
    update commercial.outbox_events
    set status = 'delivered', locked_at = null
    where id = p_event_id;
  elsif v_attempts >= 8 then
    update commercial.outbox_events
    set status = 'dead', locked_at = null
    where id = p_event_id;
    update commercial.notification_deliveries
    set status = 'dead'
    where outbox_event_id = p_event_id
      and channel = 'email'
      and status = 'failed';
  elsif p_outcome = 'retry' then
    update commercial.outbox_events
    set status = 'pending',
        locked_at = null,
        available_at = pg_catalog.now() + make_interval(mins => attempts)
    where id = p_event_id;
  else
    raise exception 'validation' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function commercial.outbox_requires_delivery(text) from public, anon, authenticated;
revoke all on function commercial.outbox_ignores_opt_out(text) from public, anon, authenticated;
revoke all on function commercial.claim_outbox_batch(integer) from public, anon, authenticated;
revoke all on function commercial.record_inbox(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function commercial.record_email_result(uuid, text, text, text) from public, anon, authenticated;
revoke all on function commercial.release_outbox(uuid, text) from public, anon, authenticated;

create or replace function commercial.archive_opportunity(
  p_opportunity_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid := commercial.current_account_id();
  v_archived timestamptz;
begin
  if auth.uid() is null or v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if not commercial.has_permission('crm.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select archived_at into v_archived
  from commercial.commercial_opportunities
  where id = p_opportunity_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_archived is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'opportunity_id', p_opportunity_id);
  end if;

  update commercial.commercial_opportunities
  set archived_at = pg_catalog.now()
  where id = p_opportunity_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, reason, correlation_id
  ) values (
    v_actor, 'internal', 'opportunity.archived', 'commercial', 'commercial_opportunities',
    p_opportunity_id, p_reason, p_opportunity_id
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'opportunity_id', p_opportunity_id);
end;
$$;

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

  insert into commercial.privacy_requests (
    subject_kind, subject_ref, request_kind, status, opened_by
  ) values (
    p_subject_kind, p_subject_ref, p_request_kind, 'open', v_actor
  ) returning id into v_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'privacy.opened', 'commercial', 'privacy_requests', v_id, v_id,
    jsonb_build_object('request_kind', p_request_kind, 'subject_ref', p_subject_ref)
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'request_id', v_id);
end;
$$;

create or replace function commercial.resolve_privacy_request(
  p_request_id uuid,
  p_status text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid := commercial.current_account_id();
  v_request commercial.privacy_requests%rowtype;
  v_contact commercial.commercial_contacts%rowtype;
begin
  if auth.uid() is null or v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if not commercial.has_permission('privacy.resolve') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_status not in ('fulfilled', 'rejected') or nullif(btrim(coalesce(p_notes, '')), '') is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_request from commercial.privacy_requests where id = p_request_id for update;
  if v_request.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_request.status <> 'open' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'request_id', v_request.id);
  end if;

  if v_request.request_kind = 'deletion' and p_status = 'fulfilled' then
    if v_request.subject_kind is distinct from 'contact' then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    select * into v_contact
    from commercial.commercial_contacts
    where id = v_request.subject_ref::uuid
    for update;
    if v_contact.id is null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    update commercial.commercial_contacts
    set full_name = 'anonimizado',
        email = null,
        normalized_phone = null
    where id = v_contact.id;
  end if;

  update commercial.privacy_requests
  set status = p_status,
      resolved_by = v_actor,
      resolution_notes = p_notes
  where id = v_request.id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, reason, correlation_id, before, after
  ) values (
    v_actor, 'internal', 'privacy.resolved', 'commercial', 'privacy_requests', v_request.id, p_notes, v_request.id,
    jsonb_build_object('status', 'open'),
    jsonb_build_object('status', p_status, 'subject_ref', v_request.subject_ref)
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'request_id', v_request.id);
end;
$$;

create or replace function commercial.list_privacy_requests()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if not commercial.has_permission('privacy.resolve')
     and not exists (
       select 1 from public.profiles profile
       where profile.id = auth.uid() and profile.role = 'super_admin'
     ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  return jsonb_build_object(
    'ok', true,
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', request.id,
        'subject_kind', request.subject_kind,
        'request_kind', request.request_kind,
        'status', request.status,
        'created_at', request.created_at
      ) order by request.created_at desc)
      from commercial.privacy_requests request
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function commercial.archive_opportunity(uuid, text) from public, anon, authenticated;
revoke all on function commercial.open_privacy_request(text, text, text) from public, anon, authenticated;
revoke all on function commercial.resolve_privacy_request(uuid, text, text) from public, anon, authenticated;
revoke all on function commercial.list_privacy_requests() from public, anon, authenticated;

create or replace function public.archive_opportunity(p_opportunity_id uuid, p_reason text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.archive_opportunity(p_opportunity_id, p_reason);
$$;

create or replace function public.open_privacy_request(
  p_subject_kind text,
  p_subject_ref text,
  p_request_kind text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.open_privacy_request(p_subject_kind, p_subject_ref, p_request_kind);
$$;

create or replace function public.resolve_privacy_request(
  p_request_id uuid,
  p_status text,
  p_notes text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.resolve_privacy_request(p_request_id, p_status, p_notes);
$$;

create or replace function public.list_privacy_requests()
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.list_privacy_requests();
$$;

revoke all on function public.archive_opportunity(uuid, text) from public, anon;
revoke all on function public.open_privacy_request(text, text, text) from public, anon;
revoke all on function public.resolve_privacy_request(uuid, text, text) from public, anon;
revoke all on function public.list_privacy_requests() from public, anon;
grant execute on function public.archive_opportunity(uuid, text) to authenticated;
grant execute on function public.open_privacy_request(text, text, text) to authenticated;
grant execute on function public.resolve_privacy_request(uuid, text, text) to authenticated;
grant execute on function public.list_privacy_requests() to authenticated;
