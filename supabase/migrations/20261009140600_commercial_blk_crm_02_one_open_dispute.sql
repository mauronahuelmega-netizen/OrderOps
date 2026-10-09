-- BLK-CRM-02 (human decision 2026-10-09):
-- At most one attribution_disputes row with status = 'open' per opportunity_id.
-- Multiple decided/closed/retained historical rows for the same opportunity remain allowed.
-- Does not invent statuses. Does not destroy or auto-close existing rows.

do $$
declare
  v_conflict_count int;
begin
  select count(*) into v_conflict_count
  from (
    select opportunity_id
    from commercial.attribution_disputes
    where status = 'open'
    group by opportunity_id
    having count(*) > 1
  ) conflicts;

  if v_conflict_count > 0 then
    raise exception
      using errcode = 'P0001',
            message = format(
              'BLK-CRM-02 blocked: %s opportunity_id value(s) already have multiple open disputes; human resolution required before creating attribution_disputes_one_open_per_opportunity_idx',
              v_conflict_count
            );
  end if;
end;
$$;

create unique index attribution_disputes_one_open_per_opportunity_idx
  on commercial.attribution_disputes (opportunity_id)
  where status = 'open';

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
  v_constraint text;
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

  -- Controlled duplicate: do not return the existing dispute_id (read rules stay separate).
  if exists (
    select 1 from commercial.attribution_disputes
    where opportunity_id = p_opportunity_id and status = 'open'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'dispute_open_exists');
  end if;

  begin
    insert into commercial.attribution_disputes (opportunity_id, status, opened_by)
    values (p_opportunity_id, 'open', v_actor)
    returning id into v_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint is distinct from 'attribution_disputes_one_open_per_opportunity_idx' then
        raise;
      end if;
      return jsonb_build_object('ok', false, 'commercial_error_code', 'dispute_open_exists');
  end;

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

-- public.open_dispute wrapper and its grants are unchanged (CREATE OR REPLACE of commercial.* only).
