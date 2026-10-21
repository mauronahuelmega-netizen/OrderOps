-- Post-audit correction for PHASE-02. Does not reopen the phase.
-- Requires a server-supplied IP hash for a new demo request.
-- Strips internal ids from the public wrapper.
-- Narrows execute grants on the public wrappers.

create or replace function commercial.submit_demo_request(
  p_contact_name text,
  p_trade_name text,
  p_whatsapp text,
  p_trade_category text,
  p_email text,
  p_needs text,
  p_promoter_ref text,
  p_campaign_ref text,
  p_idempotency_key text,
  p_ip_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_existing commercial.demo_submissions%rowtype;
  v_phone text := commercial.normalize_ar_phone(p_whatsapp);
  v_name text := commercial.normalize_name(p_trade_name);
  v_origin text;
  v_channel text;
  v_prepared jsonb;
  v_business uuid;
  v_opportunity uuid;
  v_submission uuid;
  v_hits int;
  v_window timestamptz := date_trunc('hour', pg_catalog.now());
  v_key text;
begin
  if length(btrim(coalesce(p_contact_name, ''))) = 0
    or v_name is null
    or v_phone is null
    or length(btrim(coalesce(p_trade_category, ''))) = 0
    or length(btrim(coalesce(p_idempotency_key, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_existing
  from commercial.demo_submissions
  where idempotency_key = btrim(p_idempotency_key);

  if found then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'submission_id', v_existing.id,
      'business_id', v_existing.resolved_business_id,
      'opportunity_id', v_existing.resolved_opportunity_id
    );
  end if;

  if nullif(btrim(coalesce(p_ip_hash, '')), '') is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unavailable');
  end if;

  foreach v_key in array array['phone:' || v_phone, 'ip:' || btrim(p_ip_hash)]
  loop
    insert into commercial.demo_rate_buckets (bucket_key, window_start, hits)
    values (v_key, v_window, 1)
    on conflict (bucket_key, window_start)
    do update set hits = commercial.demo_rate_buckets.hits + 1
    returning hits into v_hits;
    if v_hits > 5 then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'rate_limited');
    end if;
  end loop;

  v_origin := coalesce(nullif(btrim(coalesce(p_promoter_ref, '')), ''), 'organic');
  v_channel := case when v_origin = 'organic' then 'organic' else 'promoter' end;
  v_prepared := commercial.find_or_prepare_business(btrim(p_trade_name), p_whatsapp, null, v_channel);
  if v_prepared->>'ok' is distinct from 'true' then
    return v_prepared;
  end if;
  v_business := (v_prepared->>'business_id')::uuid;

  select id into v_opportunity
  from commercial.commercial_opportunities
  where commercial_business_id = v_business
    and stage not in ('won', 'lost')
    and archived_at is null
  order by created_at
  limit 1;

  if v_opportunity is null then
    insert into commercial.commercial_opportunities (commercial_business_id, stage)
    values (v_business, 'new')
    returning id into v_opportunity;
  end if;

  insert into commercial.demo_submissions (
    idempotency_key, contact_name, trade_name, whatsapp, trade_category, email, needs,
    source_channel, promoter_ref, campaign_ref, resolved_business_id, resolved_opportunity_id
  ) values (
    btrim(p_idempotency_key),
    btrim(p_contact_name),
    btrim(p_trade_name),
    v_phone,
    btrim(p_trade_category),
    nullif(btrim(coalesce(p_email, '')), ''),
    nullif(btrim(coalesce(p_needs, '')), ''),
    'web',
    nullif(btrim(coalesce(p_promoter_ref, '')), ''),
    nullif(btrim(coalesce(p_campaign_ref, '')), ''),
    v_business,
    v_opportunity
  ) returning id into v_submission;

  insert into commercial.commercial_interactions (
    commercial_business_id, opportunity_id, kind, channel, origin, body, occurred_at
  ) values (
    v_business,
    v_opportunity,
    'demo_request',
    'web',
    v_origin,
    nullif(btrim(coalesce(p_needs, '')), ''),
    pg_catalog.now()
  );

  perform commercial.enqueue(
    'demo.submitted',
    jsonb_build_object('submission_id', v_submission),
    v_submission
  );

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'submission_id', v_submission,
    'business_id', v_business,
    'opportunity_id', v_opportunity
  );
end;
$$;

create or replace function public.submit_demo_request(
  p_contact_name text,
  p_trade_name text,
  p_whatsapp text,
  p_trade_category text,
  p_email text,
  p_needs text,
  p_promoter_ref text,
  p_campaign_ref text,
  p_idempotency_key text,
  p_ip_hash text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.submit_demo_request(
    p_contact_name,
    p_trade_name,
    p_whatsapp,
    p_trade_category,
    p_email,
    p_needs,
    p_promoter_ref,
    p_campaign_ref,
    p_idempotency_key,
    p_ip_hash
  ) - 'submission_id' - 'business_id' - 'opportunity_id';
$$;

revoke all on function commercial.submit_demo_request(text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.submit_demo_request(text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_demo_request(text, text, text, text, text, text, text, text, text, text) to service_role;

revoke all on function public.commercial_session() from public, anon, service_role;
revoke all on function public.list_open_opportunities() from public, anon, service_role;
revoke all on function public.opportunity_detail(uuid) from public, anon, service_role;
revoke all on function public.transition_opportunity(uuid, text, text) from public, anon, service_role;
revoke all on function public.upsert_task(uuid, uuid, text, text, timestamptz, text, text) from public, anon, service_role;
revoke all on function public.merge_commercial_businesses(uuid, uuid, text) from public, anon, service_role;

grant execute on function public.commercial_session() to authenticated;
grant execute on function public.list_open_opportunities() to authenticated;
grant execute on function public.opportunity_detail(uuid) to authenticated;
grant execute on function public.transition_opportunity(uuid, text, text) to authenticated;
grant execute on function public.upsert_task(uuid, uuid, text, text, timestamptz, text, text) to authenticated;
grant execute on function public.merge_commercial_businesses(uuid, uuid, text) to authenticated;
