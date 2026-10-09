-- P03-T04: one confirmed attribution per opportunity. Promoters cannot confirm.

create table commercial.opportunity_attributions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references commercial.commercial_opportunities (id),
  promoter_id uuid not null references commercial.promoters (id),
  claim_id uuid references commercial.attribution_claims (id),
  status text not null check (status in ('confirmed', 'voided')),
  method text not null check (method in ('automatic_referral', 'manual')),
  reason text not null,
  confirmed_by uuid references commercial.platform_accounts (id),
  confirmed_at timestamptz not null default now(),
  voided_at timestamptz,
  check (char_length(btrim(reason)) > 0)
);

create unique index opportunity_attributions_one_confirmed_idx
  on commercial.opportunity_attributions (opportunity_id)
  where status = 'confirmed';

create or replace function commercial.promoter_has_substantive_activity(
  p_opportunity_id uuid,
  p_promoter_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select exists (
    select 1
    from commercial.commercial_interactions interaction
    join commercial.promoters promoter on promoter.id = p_promoter_id
    where interaction.opportunity_id = p_opportunity_id
      and interaction.kind in ('call', 'whatsapp', 'email', 'meeting', 'demo_completed', 'follow_up')
      and (
        interaction.actor_account_id = promoter.account_id
        or interaction.origin = promoter.public_code
      )
  )
$$;

create or replace function commercial.try_automatic_referral(
  p_opportunity_id uuid,
  p_origin text,
  p_business_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_claim uuid;
begin
  select id into v_promoter
  from commercial.promoters
  where public_code = p_origin
    and status = 'active';
  if v_promoter is null then
    return;
  end if;
  if exists (
    select 1 from commercial.opportunity_attributions
    where opportunity_id = p_opportunity_id and status = 'confirmed'
  ) then
    return;
  end if;

  insert into commercial.attribution_claims (
    promoter_id, commercial_business_id, opportunity_id, status, provisional_until
  ) values (
    v_promoter, p_business_id, p_opportunity_id, 'confirmed', pg_catalog.now() + interval '30 days'
  )
  returning id into v_claim;

  insert into commercial.opportunity_attributions (
    opportunity_id, promoter_id, claim_id, status, method, reason, confirmed_at
  ) values (
    p_opportunity_id, v_promoter, v_claim, 'confirmed', 'automatic_referral', 'demo referida de promotor activo', pg_catalog.now()
  );
exception
  when unique_violation then
    return;
end;
$$;

create or replace function commercial.confirm_attribution(
  p_opportunity_id uuid,
  p_promoter_id uuid,
  p_claim_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if commercial.current_promoter_id() is not null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'cannot_self_confirm');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('attribution.confirm') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_opportunity_id is null or length(btrim(coalesce(p_reason, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if exists (
    select 1 from commercial.opportunity_attributions
    where opportunity_id = p_opportunity_id and status = 'confirmed'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'attribution_exists');
  end if;
  if not commercial.promoter_has_substantive_activity(p_opportunity_id, p_promoter_id) then
    if p_claim_id is not null then
      update commercial.attribution_claims
      set status = 'rejected'
      where id = p_claim_id
        and promoter_id = p_promoter_id
        and status = 'provisional';
    end if;
    return jsonb_build_object('ok', false, 'commercial_error_code', 'extension_not_substantive');
  end if;

  insert into commercial.opportunity_attributions (
    opportunity_id, promoter_id, claim_id, status, method, reason, confirmed_by, confirmed_at
  ) values (
    p_opportunity_id, p_promoter_id, p_claim_id, 'confirmed', 'manual', btrim(p_reason), v_actor, pg_catalog.now()
  )
  returning id into v_id;

  if p_claim_id is not null then
    update commercial.attribution_claims
    set status = 'confirmed', opportunity_id = p_opportunity_id
    where id = p_claim_id and promoter_id = p_promoter_id and status = 'provisional';
  end if;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, reason, correlation_id, after
  ) values (
    v_actor, 'internal', 'attribution.confirmed', 'commercial', 'opportunity_attributions', v_id,
    btrim(p_reason), v_id, jsonb_build_object('opportunity_id', p_opportunity_id, 'promoter_id', p_promoter_id, 'method', 'manual')
  );

  return jsonb_build_object('ok', true, 'attribution_id', v_id);
end;
$$;

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
    v_business, v_opportunity, 'demo_request', 'web', v_origin,
    nullif(btrim(coalesce(p_needs, '')), ''), pg_catalog.now()
  );

  perform commercial.enqueue('demo.submitted', jsonb_build_object('submission_id', v_submission), v_submission);
  perform commercial.try_automatic_referral(v_opportunity, v_origin, v_business);

  return jsonb_build_object(
    'ok', true, 'duplicate', false,
    'submission_id', v_submission, 'business_id', v_business, 'opportunity_id', v_opportunity
  );
end;
$$;

alter table commercial.opportunity_attributions enable row level security;
alter table commercial.opportunity_attributions force row level security;
revoke all on commercial.opportunity_attributions from public, anon, authenticated;
grant select on commercial.opportunity_attributions to authenticated;

create policy opportunity_attributions_select on commercial.opportunity_attributions
  for select to authenticated
  using (
    promoter_id = commercial.current_promoter_id()
    or commercial.has_internal_role('superadmin')
    or commercial.has_internal_role('commercial')
  );

revoke all on function commercial.try_automatic_referral(uuid, text, uuid) from public, anon, authenticated, service_role;
revoke all on function commercial.confirm_attribution(uuid, uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function commercial.promoter_has_substantive_activity(uuid, uuid) from public, anon, service_role;
grant execute on function commercial.promoter_has_substantive_activity(uuid, uuid) to authenticated;

create or replace function public.confirm_attribution(
  p_opportunity_id uuid, p_promoter_id uuid, p_claim_id uuid, p_reason text
)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.confirm_attribution(p_opportunity_id, p_promoter_id, p_claim_id, p_reason); $$;

revoke all on function public.confirm_attribution(uuid, uuid, uuid, text) from public, anon, service_role;
grant execute on function public.confirm_attribution(uuid, uuid, uuid, text) to authenticated;
