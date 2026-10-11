-- P04-T02 RPCs.

create or replace function commercial.request_onboarding_grant(
  p_promoter_id uuid,
  p_business_id uuid,
  p_opportunity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_grant uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if commercial.current_promoter_id() is distinct from p_promoter_id
    and not commercial.has_internal_role('superadmin')
    and not commercial.has_internal_role('commercial') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if not exists (select 1 from public.businesses where id = p_business_id)
    or not exists (select 1 from commercial.promoters where id = p_promoter_id) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  insert into commercial.onboarding_grants (promoter_id, business_id, opportunity_id, status, requested_by)
  values (p_promoter_id, p_business_id, p_opportunity_id, 'pending_client', v_actor)
  returning id into v_grant;
  insert into commercial.onboarding_grant_events (grant_id, event_type, actor_account_id)
  values (v_grant, 'requested', v_actor);
  return jsonb_build_object('ok', true, 'grant_id', v_grant, 'status', 'pending_client');
end;
$$;

create or replace function commercial.respond_onboarding_grant(
  p_grant_id uuid,
  p_decision text,
  p_ends_at timestamptz,
  p_exception_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_grant commercial.onboarding_grants%rowtype;
  v_actor uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_exception boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  select * into v_grant from commercial.onboarding_grants where id = p_grant_id;
  if v_grant.id is null or v_grant.status <> 'pending_client' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if commercial.current_promoter_id() = v_grant.promoter_id then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_decision = 'reject' then
    if not commercial.business_catalog_approver(v_grant.business_id)
      and not commercial.has_internal_role('superadmin') then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
    end if;
    update commercial.onboarding_grants set status = 'revoked', revoked_at = pg_catalog.now() where id = p_grant_id;
    insert into commercial.onboarding_grant_events (grant_id, event_type, actor_account_id, actor_profile_id, reason)
    values (p_grant_id, 'rejected', v_actor, auth.uid(), nullif(btrim(coalesce(p_exception_reason, '')), ''));
    return jsonb_build_object('ok', true, 'status', 'revoked');
  end if;
  if p_decision is distinct from 'approve' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  v_exception := commercial.has_internal_role('superadmin') and not commercial.business_catalog_approver(v_grant.business_id);
  if v_exception then
    if length(btrim(coalesce(p_exception_reason, ''))) = 0 then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
  elsif not commercial.business_catalog_approver(v_grant.business_id) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  v_start := pg_catalog.now();
  v_end := coalesce(p_ends_at, v_start + interval '30 days');
  if v_end > v_start + interval '30 days' or v_end <= v_start then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  update commercial.onboarding_grants
  set status = 'active', starts_at = v_start, ends_at = v_end,
      approved_by_profile_id = case when v_exception then null else auth.uid() end,
      exception_by_account_id = case when v_exception then v_actor else null end,
      exception_reason = case when v_exception then btrim(p_exception_reason) else null end
  where id = p_grant_id;
  insert into commercial.onboarding_grant_events (grant_id, event_type, actor_account_id, actor_profile_id, reason)
  values (p_grant_id, case when v_exception then 'exception' else 'approved' end, v_actor,
    case when v_exception then null else auth.uid() end,
    case when v_exception then btrim(p_exception_reason) else null end);
  return jsonb_build_object('ok', true, 'status', 'active');
end;
$$;

create or replace function commercial.revoke_onboarding_grant(p_grant_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_grant commercial.onboarding_grants%rowtype;
  v_actor uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  select * into v_grant from commercial.onboarding_grants where id = p_grant_id;
  if v_grant.id is null or v_grant.status not in ('pending_client', 'active') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if not commercial.business_catalog_approver(v_grant.business_id) and not commercial.has_internal_role('superadmin') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  update commercial.onboarding_grants set status = 'revoked', revoked_at = pg_catalog.now() where id = p_grant_id;
  insert into commercial.onboarding_grant_events (grant_id, event_type, actor_account_id, actor_profile_id, reason)
  values (p_grant_id, 'revoked', v_actor, auth.uid(), nullif(btrim(coalesce(p_reason, '')), ''));
  return jsonb_build_object('ok', true, 'status', 'revoked');
end;
$$;

create or replace function commercial.complete_onboarding(p_grant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_grant commercial.onboarding_grants%rowtype;
  v_actor uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  select * into v_grant from commercial.onboarding_grants where id = p_grant_id;
  if v_grant.id is null or v_grant.status <> 'active' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if not commercial.business_catalog_approver(v_grant.business_id) and not commercial.has_internal_role('superadmin') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  update commercial.onboarding_grants set status = 'completed', completed_at = pg_catalog.now() where id = p_grant_id;
  insert into commercial.onboarding_grant_events (grant_id, event_type, actor_account_id, actor_profile_id)
  values (p_grant_id, 'completed', v_actor, auth.uid());
  return jsonb_build_object('ok', true, 'status', 'completed');
end;
$$;

revoke all on function commercial.request_onboarding_grant(uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function commercial.respond_onboarding_grant(uuid, text, timestamptz, text) from public, anon, authenticated, service_role;
revoke all on function commercial.revoke_onboarding_grant(uuid, text) from public, anon, authenticated, service_role;
revoke all on function commercial.complete_onboarding(uuid) from public, anon, authenticated, service_role;

create or replace function public.request_onboarding_grant(p_promoter_id uuid, p_business_id uuid, p_opportunity_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.request_onboarding_grant(p_promoter_id, p_business_id, p_opportunity_id); $$;
create or replace function public.respond_onboarding_grant(p_grant_id uuid, p_decision text, p_ends_at timestamptz, p_exception_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.respond_onboarding_grant(p_grant_id, p_decision, p_ends_at, p_exception_reason); $$;
create or replace function public.revoke_onboarding_grant(p_grant_id uuid, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.revoke_onboarding_grant(p_grant_id, p_reason); $$;
create or replace function public.complete_onboarding(p_grant_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.complete_onboarding(p_grant_id); $$;

revoke all on function public.request_onboarding_grant(uuid, uuid, uuid) from public, anon, service_role;
revoke all on function public.respond_onboarding_grant(uuid, text, timestamptz, text) from public, anon, service_role;
revoke all on function public.revoke_onboarding_grant(uuid, text) from public, anon, service_role;
revoke all on function public.complete_onboarding(uuid) from public, anon, service_role;
grant execute on function public.request_onboarding_grant(uuid, uuid, uuid) to authenticated;
grant execute on function public.respond_onboarding_grant(uuid, text, timestamptz, text) to authenticated;
grant execute on function public.revoke_onboarding_grant(uuid, text) to authenticated;
grant execute on function public.complete_onboarding(uuid) to authenticated;
