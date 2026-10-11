-- P04-T01: win an opportunity onto an existing business and freeze program terms.
-- No collections, subscriptions, or commissions.

create table commercial.conversion_terms (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null unique references commercial.commercial_opportunities (id),
  program_id uuid not null references commercial.commercial_programs (id),
  program_code text not null,
  program_version int not null,
  setup_price_cents bigint not null,
  monthly_price_cents bigint not null,
  setup_commission_cents bigint not null,
  recurring_bps int not null,
  max_recurring_slots int not null,
  attribution_id uuid not null references commercial.opportunity_attributions (id),
  won_business_id uuid not null references public.businesses (id),
  frozen_at timestamptz not null default pg_catalog.now()
);

create or replace function commercial.reject_conversion_terms_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'terms_immutable' using errcode = 'P0001';
end;
$$;

create trigger conversion_terms_immutable
  before update or delete on commercial.conversion_terms
  for each row execute function commercial.reject_conversion_terms_mutation();

alter table commercial.conversion_terms enable row level security;
alter table commercial.conversion_terms force row level security;
revoke all on table commercial.conversion_terms from public, anon, authenticated;

create or replace function commercial.win_opportunity(
  p_opportunity_id uuid,
  p_won_business_id uuid,
  p_program_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_stage text;
  v_commercial_business uuid;
  v_attribution uuid;
  v_promoter uuid;
  v_promoter_status text;
  v_program record;
  v_terms uuid;
  v_linked uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('opportunity.win') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'won_forbidden');
  end if;
  if p_won_business_id is null or not exists (select 1 from public.businesses where id = p_won_business_id) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'won_requires_business');
  end if;

  select stage, commercial_business_id into v_stage, v_commercial_business
  from commercial.commercial_opportunities
  where id = p_opportunity_id and archived_at is null;
  if v_stage is null or v_stage in ('won', 'lost') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select attribution.id, attribution.promoter_id, promoter.status
    into v_attribution, v_promoter, v_promoter_status
  from commercial.opportunity_attributions attribution
  join commercial.promoters promoter on promoter.id = attribution.promoter_id
  where attribution.opportunity_id = p_opportunity_id
    and attribution.status = 'confirmed'
    and attribution.voided_at is null;
  if v_attribution is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'won_forbidden');
  end if;
  if v_promoter_status = 'separated' and not exists (
    select 1 from commercial.opportunity_protections protection
    where protection.opportunity_id = p_opportunity_id
      and protection.promoter_id = v_promoter
      and pg_catalog.now() >= protection.starts_at
      and pg_catalog.now() <= protection.ends_at
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'won_forbidden');
  end if;

  if p_program_id is null then
    select * into v_program from commercial.commercial_programs
    where code = 'founder' and version = 1;
  else
    select * into v_program from commercial.commercial_programs where id = p_program_id;
  end if;
  if v_program.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select linked_business_id into v_linked
  from commercial.commercial_businesses
  where id = v_commercial_business;
  if v_linked is not null and v_linked is distinct from p_won_business_id then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  insert into commercial.conversion_terms (
    opportunity_id, program_id, program_code, program_version,
    setup_price_cents, monthly_price_cents, setup_commission_cents,
    recurring_bps, max_recurring_slots, attribution_id, won_business_id
  ) values (
    p_opportunity_id, v_program.id, v_program.code, v_program.version,
    v_program.setup_price_cents, v_program.monthly_price_cents, v_program.setup_commission_cents,
    v_program.recurring_bps, v_program.max_recurring_slots, v_attribution, p_won_business_id
  ) returning id into v_terms;

  update commercial.commercial_opportunities
  set stage = 'won',
      won_business_id = p_won_business_id,
      won_by_account_id = v_actor,
      won_at = pg_catalog.now()
  where id = p_opportunity_id;

  update commercial.commercial_businesses
  set linked_business_id = p_won_business_id
  where id = v_commercial_business;

  insert into commercial.opportunity_stage_events (
    opportunity_id, from_stage, to_stage, actor_account_id, reason
  ) values (
    p_opportunity_id, v_stage, 'won', v_actor, null
  );

  perform commercial.enqueue(
    'conversion.terms_frozen',
    jsonb_build_object(
      'opportunity_id', p_opportunity_id,
      'conversion_terms_id', v_terms,
      'won_business_id', p_won_business_id,
      'program_code', v_program.code,
      'program_version', v_program.version
    ),
    v_terms
  );

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'opportunity.won', 'commercial', 'conversion_terms', v_terms, v_terms,
    jsonb_build_object('opportunity_id', p_opportunity_id, 'won_business_id', p_won_business_id)
  );

  return jsonb_build_object('ok', true, 'conversion_terms_id', v_terms, 'status', 'won');
end;
$$;

revoke all on function commercial.win_opportunity(uuid, uuid, uuid) from public, anon, authenticated, service_role;

create or replace function public.win_opportunity(
  p_opportunity_id uuid,
  p_won_business_id uuid,
  p_program_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.win_opportunity(p_opportunity_id, p_won_business_id, p_program_id);
$$;

revoke all on function public.win_opportunity(uuid, uuid, uuid) from public, anon, service_role;
grant execute on function public.win_opportunity(uuid, uuid, uuid) to authenticated;
