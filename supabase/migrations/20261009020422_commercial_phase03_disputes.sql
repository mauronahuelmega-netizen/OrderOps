-- P03-T05: dispute files. No commission amounts.

create table commercial.attribution_disputes (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references commercial.commercial_opportunities (id),
  status text not null check (status in ('open', 'retained', 'decided', 'closed')),
  opened_by uuid not null references commercial.platform_accounts (id),
  assigned_to uuid references commercial.platform_accounts (id),
  decision text,
  decision_reason text,
  economic_effect text check (economic_effect is null or economic_effect in ('hold_unpaid_commissions', 'adjust_later', 'none')),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table commercial.dispute_parties (
  dispute_id uuid not null references commercial.attribution_disputes (id),
  promoter_id uuid not null references commercial.promoters (id),
  role text not null,
  primary key (dispute_id, promoter_id)
);

create table commercial.dispute_events (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references commercial.attribution_disputes (id),
  kind text not null,
  actor_account_id uuid references commercial.platform_accounts (id),
  body text,
  evidence_path text,
  created_at timestamptz not null default now()
);

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
  if p_opportunity_id is null or p_promoter_ids is null or cardinality(p_promoter_ids) = 0 or length(btrim(coalesce(p_reason, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  insert into commercial.attribution_disputes (opportunity_id, status, opened_by)
  values (p_opportunity_id, 'open', v_actor)
  returning id into v_id;

  foreach v_promoter in array p_promoter_ids loop
    insert into commercial.dispute_parties (dispute_id, promoter_id, role)
    values (v_id, v_promoter, 'party');
  end loop;

  insert into commercial.dispute_events (dispute_id, kind, actor_account_id, body)
  values (v_id, 'opened', v_actor, btrim(p_reason));
  return jsonb_build_object('ok', true, 'dispute_id', v_id);
end;
$$;

create or replace function commercial.decide_dispute(
  p_dispute_id uuid,
  p_decision text,
  p_reason text,
  p_economic_effect text,
  p_void_attribution boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_opportunity uuid;
  v_attribution uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if commercial.current_promoter_id() is not null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('dispute.decide') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0
    or p_economic_effect not in ('hold_unpaid_commissions', 'adjust_later', 'none') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select opportunity_id into v_opportunity
  from commercial.attribution_disputes
  where id = p_dispute_id and status in ('open', 'retained');
  if v_opportunity is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'dispute_scope');
  end if;

  update commercial.attribution_disputes
  set status = 'decided',
      decision = btrim(p_decision),
      decision_reason = btrim(p_reason),
      economic_effect = p_economic_effect,
      decided_at = pg_catalog.now()
  where id = p_dispute_id;

  if coalesce(p_void_attribution, false) then
    select id into v_attribution
    from commercial.opportunity_attributions
    where opportunity_id = v_opportunity and status = 'confirmed';
    if v_attribution is not null then
      update commercial.opportunity_attributions
      set status = 'voided', voided_at = pg_catalog.now()
      where id = v_attribution;
      insert into commercial.audit_events (
        actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, reason, correlation_id
      ) values (
        v_actor, 'internal', 'attribution.voided', 'commercial', 'opportunity_attributions', v_attribution,
        btrim(p_reason), p_dispute_id
      );
    end if;
  end if;

  insert into commercial.dispute_events (dispute_id, kind, actor_account_id, body)
  values (p_dispute_id, 'decided', v_actor, btrim(p_reason));
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, reason, correlation_id, after
  ) values (
    v_actor, 'internal', 'dispute.decided', 'commercial', 'attribution_disputes', p_dispute_id,
    btrim(p_reason), p_dispute_id, jsonb_build_object('economic_effect', p_economic_effect)
  );
  return jsonb_build_object('ok', true, 'status', 'decided');
end;
$$;

create or replace function commercial.read_dispute(p_dispute_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_row commercial.attribution_disputes%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  select * into v_row from commercial.attribution_disputes where id = p_dispute_id;
  if v_row.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if commercial.current_promoter_id() is not null and not exists (
    select 1 from commercial.dispute_parties
    where dispute_id = p_dispute_id and promoter_id = commercial.current_promoter_id()
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if commercial.current_promoter_id() is null
    and not (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial')) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  return jsonb_build_object(
    'ok', true,
    'dispute_id', v_row.id,
    'status', v_row.status,
    'economic_effect', v_row.economic_effect
  );
end;
$$;

alter table commercial.attribution_disputes enable row level security;
alter table commercial.attribution_disputes force row level security;
alter table commercial.dispute_parties enable row level security;
alter table commercial.dispute_parties force row level security;
alter table commercial.dispute_events enable row level security;
alter table commercial.dispute_events force row level security;
revoke all on commercial.attribution_disputes, commercial.dispute_parties, commercial.dispute_events from public, anon, authenticated;
grant select on commercial.attribution_disputes, commercial.dispute_parties, commercial.dispute_events to authenticated;

create policy attribution_disputes_select on commercial.attribution_disputes
  for select to authenticated
  using (
    commercial.has_internal_role('superadmin')
    or commercial.has_internal_role('commercial')
    or exists (
      select 1 from commercial.dispute_parties party
      where party.dispute_id = id and party.promoter_id = commercial.current_promoter_id()
    )
  );

create policy dispute_parties_select on commercial.dispute_parties
  for select to authenticated
  using (
    commercial.has_internal_role('superadmin')
    or commercial.has_internal_role('commercial')
    or promoter_id = commercial.current_promoter_id()
  );

create policy dispute_events_select on commercial.dispute_events
  for select to authenticated
  using (
    exists (
      select 1 from commercial.attribution_disputes dispute
      where dispute.id = dispute_id
        and (
          commercial.has_internal_role('superadmin')
          or commercial.has_internal_role('commercial')
          or exists (
            select 1 from commercial.dispute_parties party
            where party.dispute_id = dispute.id and party.promoter_id = commercial.current_promoter_id()
          )
        )
    )
  );

revoke all on function commercial.open_dispute(uuid, uuid[], text) from public, anon, authenticated, service_role;
revoke all on function commercial.decide_dispute(uuid, text, text, text, boolean) from public, anon, authenticated, service_role;
revoke all on function commercial.read_dispute(uuid) from public, anon, service_role;
grant execute on function commercial.read_dispute(uuid) to authenticated;

create or replace function public.open_dispute(p_opportunity_id uuid, p_promoter_ids uuid[], p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.open_dispute(p_opportunity_id, p_promoter_ids, p_reason); $$;

create or replace function public.decide_dispute(
  p_dispute_id uuid, p_decision text, p_reason text, p_economic_effect text, p_void_attribution boolean
)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.decide_dispute(p_dispute_id, p_decision, p_reason, p_economic_effect, p_void_attribution); $$;

create or replace function public.read_dispute(p_dispute_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.read_dispute(p_dispute_id); $$;

revoke all on function public.open_dispute(uuid, uuid[], text) from public, anon, service_role;
revoke all on function public.decide_dispute(uuid, text, text, text, boolean) from public, anon, service_role;
revoke all on function public.read_dispute(uuid) from public, anon, service_role;
grant execute on function public.open_dispute(uuid, uuid[], text) to authenticated;
grant execute on function public.decide_dispute(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.read_dispute(uuid) to authenticated;
