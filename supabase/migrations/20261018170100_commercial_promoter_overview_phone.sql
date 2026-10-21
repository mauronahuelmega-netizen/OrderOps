-- B4: add normalized_phone to businesses already returned by promoter_overview.
-- Body matches 20261009020811 except that one key. The WHERE is unchanged.
-- No welcome preference. No commercial_contacts grant.

create or replace function commercial.promoter_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_account uuid;
begin
  v_promoter := commercial.current_promoter_id();
  if auth.uid() is null or v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select account_id into v_account from commercial.promoters where id = v_promoter;
  return jsonb_build_object(
    'ok', true,
    'businesses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', business.id,
        'display_name', business.display_name,
        'normalized_phone', business.normalized_phone
      ) order by business.created_at)
      from commercial.commercial_businesses business
      where business.id in (
        select claim.commercial_business_id from commercial.attribution_claims claim where claim.promoter_id = v_promoter
        union
        select opportunity.commercial_business_id from commercial.commercial_opportunities opportunity where opportunity.owner_account_id = v_account
      )
    ), '[]'::jsonb),
    'opportunities', coalesce((
      select jsonb_agg(jsonb_build_object('id', opportunity.id, 'stage', opportunity.stage, 'business_id', opportunity.commercial_business_id) order by opportunity.created_at)
      from commercial.commercial_opportunities opportunity
      where opportunity.owner_account_id = v_account
        or opportunity.id in (
          select claim.opportunity_id from commercial.attribution_claims claim
          where claim.promoter_id = v_promoter and claim.opportunity_id is not null
        )
    ), '[]'::jsonb),
    'claims', coalesce((
      select jsonb_agg(jsonb_build_object('id', claim.id, 'status', claim.status, 'business_id', claim.commercial_business_id) order by claim.created_at)
      from commercial.attribution_claims claim
      where claim.promoter_id = v_promoter
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object('id', task.id, 'title', task.title, 'status', task.status, 'due_at', task.due_at, 'opportunity_id', task.opportunity_id))
      from commercial.commercial_tasks task
      where task.opportunity_id in (
        select opportunity.id from commercial.commercial_opportunities opportunity where opportunity.owner_account_id = v_account
      )
    ), '[]'::jsonb)
  );
end;
$$;
