-- B2: own-note read. Does not replace the internal interactions policy.

create or replace function commercial.promoter_owns_opportunity(p_opportunity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select exists (
    select 1
    from commercial.commercial_opportunities opportunity
    join commercial.promoters promoter
      on promoter.account_id = opportunity.owner_account_id
    where opportunity.id = p_opportunity_id
      and promoter.id = commercial.current_promoter_id()
  );
$$;

revoke all on function commercial.promoter_owns_opportunity(uuid) from public, anon, authenticated, service_role;
grant execute on function commercial.promoter_owns_opportunity(uuid) to authenticated;

create policy commercial_interactions_select_own_notes
  on commercial.commercial_interactions
  for select to authenticated
  using (
    kind = 'note'
    and commercial.promoter_owns_opportunity(opportunity_id)
  );

create or replace function public.list_own_opportunity_notes(p_opportunity_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, commercial
as $$
declare
  v_promoter uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null or p_opportunity_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if not commercial.promoter_owns_opportunity(p_opportunity_id) then
    return jsonb_build_object('ok', true, 'notes', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'ok', true,
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', interaction.id,
        'body', interaction.body,
        'occurred_at', interaction.occurred_at
      ) order by interaction.occurred_at desc)
      from commercial.commercial_interactions interaction
      where interaction.kind = 'note'
        and interaction.opportunity_id = p_opportunity_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_own_opportunity_notes(uuid) from public, anon, authenticated, service_role;
grant execute on function public.list_own_opportunity_notes(uuid) to authenticated;
