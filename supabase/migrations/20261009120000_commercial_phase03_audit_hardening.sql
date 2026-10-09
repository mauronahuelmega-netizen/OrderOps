-- Post-audit PHASE-03 hardening (AUD-P03-01, 02, 03, 04; partial 05).
-- Does not invent uniqueness of open disputes (see BLK-CRM-02).
-- Does not add Storage object policies (deny-by-default remains).
-- AUD-P03-06: demo form still passes fiscal null into find_or_prepare_business;
--   auto-referral is not granted on a comprobable fiscal contradiction (ENG-07 / null fiscal).

-- AUD-P03-04: helper is not a public API
revoke all on function commercial.promoter_has_substantive_activity(uuid, uuid)
  from public, anon, authenticated, service_role;

-- AUD-P03-01: concurrent provisional claim for same promoter+business
create or replace function commercial.create_claim(
  p_commercial_business_id uuid,
  p_opportunity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_status text;
  v_existing uuid;
  v_id uuid;
  v_until timestamptz;
  v_constraint text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select status into v_status from commercial.promoters where id = v_promoter;
  if v_status is distinct from 'active' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'promoter_not_active');
  end if;
  if not exists (
    select 1 from commercial.commercial_businesses
    where id = p_commercial_business_id and merged_into_id is null
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_opportunity_id is not null and not exists (
    select 1 from commercial.commercial_opportunities
    where id = p_opportunity_id and commercial_business_id = p_commercial_business_id
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select id into v_existing
  from commercial.attribution_claims
  where promoter_id = v_promoter
    and commercial_business_id = p_commercial_business_id
    and status = 'provisional';
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'claim_id', v_existing);
  end if;

  v_until := pg_catalog.now() + interval '30 days';
  begin
    insert into commercial.attribution_claims (
      promoter_id, commercial_business_id, opportunity_id, status, provisional_until
    ) values (
      v_promoter, p_commercial_business_id, p_opportunity_id, 'provisional', v_until
    )
    returning id into v_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint is distinct from 'attribution_claims_one_provisional_promoter_idx' then
        raise;
      end if;
      select id into v_existing
      from commercial.attribution_claims
      where promoter_id = v_promoter
        and commercial_business_id = p_commercial_business_id
        and status = 'provisional';
      if v_existing is not null then
        return jsonb_build_object('ok', true, 'duplicate', true, 'claim_id', v_existing);
      end if;
      raise;
  end;

  return jsonb_build_object('ok', true, 'duplicate', false, 'claim_id', v_id, 'status', 'provisional');
end;
$$;

revoke all on function commercial.create_claim(uuid, uuid)
  from public, anon, authenticated, service_role;

-- AUD-P03-02: concurrent confirmed attribution on same opportunity
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
  v_constraint text;
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

  begin
    insert into commercial.opportunity_attributions (
      opportunity_id, promoter_id, claim_id, status, method, reason, confirmed_by, confirmed_at
    ) values (
      p_opportunity_id, p_promoter_id, p_claim_id, 'confirmed', 'manual', btrim(p_reason), v_actor, pg_catalog.now()
    )
    returning id into v_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint is distinct from 'opportunity_attributions_one_confirmed_idx' then
        raise;
      end if;
      return jsonb_build_object('ok', false, 'commercial_error_code', 'attribution_exists');
  end;

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

revoke all on function commercial.confirm_attribution(uuid, uuid, uuid, text)
  from public, anon, authenticated, service_role;

-- AUD-P03-05 (partial): parties must be linked to the opportunity; no invented open-dispute uniqueness
create or replace function commercial.open_dispute(
  p_opportunity_id uuid,
  p_promoter_ids uuid[],
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
  v_promoter uuid;
  v_linked boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if commercial.current_promoter_id() is not null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'dispute_scope');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('crm.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_opportunity_id is null
    or p_promoter_ids is null
    or cardinality(p_promoter_ids) = 0
    or length(btrim(coalesce(p_reason, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if not exists (
    select 1 from commercial.commercial_opportunities
    where id = p_opportunity_id and archived_at is null
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  foreach v_promoter in array p_promoter_ids loop
    select exists (
      select 1 from commercial.attribution_claims
      where promoter_id = v_promoter
        and opportunity_id = p_opportunity_id
      union all
      select 1 from commercial.opportunity_attributions
      where promoter_id = v_promoter
        and opportunity_id = p_opportunity_id
        and status in ('confirmed', 'voided')
      union all
      select 1
      from commercial.attribution_claims claim
      join commercial.commercial_opportunities opportunity
        on opportunity.commercial_business_id = claim.commercial_business_id
      where claim.promoter_id = v_promoter
        and opportunity.id = p_opportunity_id
        and claim.status in ('provisional', 'confirmed', 'expired', 'rejected', 'superseded')
    ) into v_linked;
    if not coalesce(v_linked, false) then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'dispute_scope');
    end if;
  end loop;

  insert into commercial.attribution_disputes (opportunity_id, status, opened_by)
  values (p_opportunity_id, 'open', v_actor)
  returning id into v_id;

  foreach v_promoter in array p_promoter_ids loop
    insert into commercial.dispute_parties (dispute_id, promoter_id, role)
    values (v_id, v_promoter, 'party')
    on conflict do nothing;
  end loop;

  insert into commercial.dispute_events (dispute_id, kind, actor_account_id, body)
  values (v_id, 'opened', v_actor, btrim(p_reason));
  return jsonb_build_object('ok', true, 'dispute_id', v_id);
end;
$$;

revoke all on function commercial.open_dispute(uuid, uuid[], text)
  from public, anon, authenticated, service_role;

-- AUD-P03-03: validate evidence_path against DATA_MODEL prefixes; no Storage policies added
create or replace function commercial.submit_promoter_evidence(
  p_promoter_id uuid,
  p_kind text,
  p_evidence_path text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_promoter uuid;
  v_id uuid;
  v_path text;
  v_prefix text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  v_promoter := commercial.current_promoter_id();
  if v_promoter is not null then
    p_promoter_id := v_promoter;
  elsif v_actor is null or not commercial.has_permission('promoter.review') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_promoter_id is null or p_kind not in ('identity', 'cuit', 'monotributo', 'contract') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  v_path := nullif(btrim(coalesce(p_evidence_path, '')), '');
  if v_path is not null then
    if position('..' in v_path) > 0
      or v_path like '/%'
      or v_path like '%//%' then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    if p_kind = 'contract' then
      v_prefix := 'contracts/' || p_promoter_id::text || '/';
    else
      v_prefix := 'verifications/' || p_promoter_id::text || '/';
    end if;
    if left(v_path, length(v_prefix)) is distinct from v_prefix
      or length(v_path) <= length(v_prefix)
      or position('/' in substr(v_path, length(v_prefix) + 1)) > 0 then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
  end if;

  if p_kind = 'contract' then
    insert into commercial.promoter_contracts (promoter_id, version_label, accepted_at, document_path)
    values (
      p_promoter_id,
      'v1',
      case when v_promoter is not null or commercial.has_permission('promoter.review') then pg_catalog.now() else null end,
      v_path
    )
    returning id into v_id;
  else
    insert into commercial.promoter_verifications (promoter_id, kind, status, evidence_path)
    values (p_promoter_id, p_kind, 'pending', v_path)
    returning id into v_id;
  end if;

  return jsonb_build_object('ok', true, 'evidence_id', v_id);
end;
$$;

revoke all on function commercial.submit_promoter_evidence(uuid, text, text)
  from public, anon, authenticated, service_role;

-- Keep public wrappers; CREATE OR REPLACE of commercial.* does not change public grants.
-- Storage: intentionally no policies on storage.objects for commercial-documents (deny-by-default).
