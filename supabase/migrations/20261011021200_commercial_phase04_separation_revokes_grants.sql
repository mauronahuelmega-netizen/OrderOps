-- P04-T02: separating a promoter revokes open onboarding grants.

create or replace function commercial.separate_promoter(
  p_promoter_id uuid,
  p_owner_account_id uuid,
  p_reason text,
  p_exception_opportunity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_account uuid;
  v_effective timestamptz;
  v_separation uuid;
  v_row record;
  v_grant uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('promoter.separate') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 or p_owner_account_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if not exists (
    select 1 from commercial.platform_accounts
    where id = p_owner_account_id and kind = 'internal' and disabled_at is null
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select account_id into v_account from commercial.promoters where id = p_promoter_id and status <> 'separated';
  if v_account is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  v_effective := pg_catalog.now();
  insert into commercial.promoter_separations (promoter_id, effective_at, reason, actor_account_id)
  values (p_promoter_id, v_effective, btrim(p_reason), v_actor)
  returning id into v_separation;

  update commercial.promoters
  set status = 'separated', separated_at = v_effective
  where id = p_promoter_id;

  for v_grant in
    select id from commercial.onboarding_grants
    where promoter_id = p_promoter_id and status in ('pending_client', 'active')
  loop
    update commercial.onboarding_grants
    set status = 'revoked', revoked_at = v_effective
    where id = v_grant;
    insert into commercial.onboarding_grant_events (grant_id, event_type, actor_account_id, reason)
    values (v_grant, 'revoked', v_actor, 'promoter_separated');
  end loop;

  update commercial.commercial_opportunities
  set owner_account_id = p_owner_account_id
  where archived_at is null
    and stage not in ('won', 'lost')
    and (
      owner_account_id = v_account
      or id in (
        select opportunity_id from commercial.opportunity_attributions
        where promoter_id = p_promoter_id and status = 'confirmed'
      )
    );

  for v_row in
    select attribution.opportunity_id
    from commercial.opportunity_attributions attribution
    join commercial.promoters promoter on promoter.id = attribution.promoter_id
    where attribution.promoter_id = p_promoter_id
      and attribution.status = 'confirmed'
      and exists (
        select 1 from commercial.commercial_interactions interaction
        where interaction.opportunity_id = attribution.opportunity_id
          and interaction.occurred_at < v_effective
          and interaction.kind in ('call', 'whatsapp', 'email', 'meeting', 'demo_completed', 'follow_up')
          and (
            interaction.actor_account_id = promoter.account_id
            or interaction.origin = promoter.public_code
          )
      )
  loop
    insert into commercial.opportunity_protections (
      opportunity_id, promoter_id, separation_id, starts_at, ends_at, basis
    ) values (
      v_row.opportunity_id, p_promoter_id, v_separation, v_effective, v_effective + interval '90 days', 'confirmed_with_activity'
    );
  end loop;

  if p_exception_opportunity_id is not null then
    insert into commercial.opportunity_protections (
      opportunity_id, promoter_id, separation_id, starts_at, ends_at, basis
    ) values (
      p_exception_opportunity_id, p_promoter_id, v_separation, v_effective, v_effective + interval '90 days', 'exception'
    );
    insert into commercial.audit_events (
      actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, reason, correlation_id, after
    ) values (
      v_actor, 'internal', 'protection.exception', 'commercial', 'opportunity_protections', v_separation,
      btrim(p_reason), v_separation, jsonb_build_object('opportunity_id', p_exception_opportunity_id, 'basis', 'exception')
    );
  end if;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, reason, correlation_id, after
  ) values (
    v_actor, 'internal', 'promoter.separated', 'commercial', 'promoters', p_promoter_id,
    btrim(p_reason), v_separation, jsonb_build_object('owner_account_id', p_owner_account_id)
  );

  return jsonb_build_object('ok', true, 'status', 'separated', 'separation_id', v_separation);
end;
$$;


