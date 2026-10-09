-- P03-T03: provisional claims. A claim does not create an opportunity or an attribution.

create table commercial.attribution_claims (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references commercial.promoters (id),
  commercial_business_id uuid not null references commercial.commercial_businesses (id),
  opportunity_id uuid references commercial.commercial_opportunities (id),
  status text not null check (status in ('provisional', 'expired', 'rejected', 'confirmed', 'superseded')),
  provisional_until timestamptz not null,
  created_at timestamptz not null default now()
);

create index attribution_claims_provisional_business_idx
  on commercial.attribution_claims (commercial_business_id)
  where status = 'provisional';

create unique index attribution_claims_one_provisional_promoter_idx
  on commercial.attribution_claims (promoter_id, commercial_business_id)
  where status = 'provisional';

create table commercial.claim_extensions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references commercial.attribution_claims (id),
  extended_until timestamptz not null,
  interaction_id uuid not null references commercial.commercial_interactions (id),
  actor_account_id uuid not null references commercial.platform_accounts (id),
  reason text not null,
  created_at timestamptz not null default now(),
  check (char_length(btrim(reason)) > 0)
);

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
  insert into commercial.attribution_claims (
    promoter_id, commercial_business_id, opportunity_id, status, provisional_until
  ) values (
    v_promoter, p_commercial_business_id, p_opportunity_id, 'provisional', v_until
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'duplicate', false, 'claim_id', v_id, 'status', 'provisional');
end;
$$;

create or replace function commercial.extend_claim(
  p_claim_id uuid,
  p_interaction_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_kind text;
  v_business uuid;
  v_opportunity uuid;
  v_claim_business uuid;
  v_claim_opportunity uuid;
  v_until timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or commercial.current_promoter_id() is not null or not commercial.has_permission('crm.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'extension_not_substantive');
  end if;

  select kind, commercial_business_id, opportunity_id
  into v_kind, v_business, v_opportunity
  from commercial.commercial_interactions
  where id = p_interaction_id;

  if v_kind is null or v_kind not in ('call', 'whatsapp', 'email', 'meeting', 'demo_completed', 'follow_up') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'extension_not_substantive');
  end if;

  select commercial_business_id, opportunity_id
  into v_claim_business, v_claim_opportunity
  from commercial.attribution_claims
  where id = p_claim_id and status = 'provisional';
  if v_claim_business is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'claim_expired');
  end if;
  if v_business is distinct from v_claim_business
    and (v_claim_opportunity is null or v_opportunity is distinct from v_claim_opportunity) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'extension_not_substantive');
  end if;

  v_until := pg_catalog.now() + interval '30 days';
  update commercial.attribution_claims set provisional_until = v_until where id = p_claim_id;
  insert into commercial.claim_extensions (claim_id, extended_until, interaction_id, actor_account_id, reason)
  values (p_claim_id, v_until, p_interaction_id, v_actor, btrim(p_reason));
  return jsonb_build_object('ok', true, 'provisional_until', v_until);
end;
$$;

create or replace function commercial.expire_due_claims()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_claim record;
  v_count int := 0;
begin
  if auth.uid() is not null and not commercial.has_permission('crm.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  for v_claim in
    select id from commercial.attribution_claims
    where status = 'provisional' and provisional_until < pg_catalog.now()
  loop
    update commercial.attribution_claims set status = 'expired' where id = v_claim.id;
    perform commercial.enqueue('claim.expired', jsonb_build_object('claim_id', v_claim.id), v_claim.id);
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('ok', true, 'expired', v_count);
end;
$$;

alter table commercial.attribution_claims enable row level security;
alter table commercial.attribution_claims force row level security;
alter table commercial.claim_extensions enable row level security;
alter table commercial.claim_extensions force row level security;
revoke all on commercial.attribution_claims, commercial.claim_extensions from public, anon, authenticated;
grant select on commercial.attribution_claims, commercial.claim_extensions to authenticated;

create policy attribution_claims_select on commercial.attribution_claims
  for select to authenticated
  using (
    promoter_id = commercial.current_promoter_id()
    or commercial.has_internal_role('superadmin')
    or commercial.has_internal_role('commercial')
  );

create policy claim_extensions_select on commercial.claim_extensions
  for select to authenticated
  using (
    exists (
      select 1 from commercial.attribution_claims claim
      where claim.id = claim_id
        and (
          claim.promoter_id = commercial.current_promoter_id()
          or commercial.has_internal_role('superadmin')
          or commercial.has_internal_role('commercial')
        )
    )
  );

revoke all on function commercial.create_claim(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function commercial.extend_claim(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function commercial.expire_due_claims() from public, anon, authenticated, service_role;

create or replace function public.create_claim(p_commercial_business_id uuid, p_opportunity_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.create_claim(p_commercial_business_id, p_opportunity_id); $$;

create or replace function public.extend_claim(p_claim_id uuid, p_interaction_id uuid, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.extend_claim(p_claim_id, p_interaction_id, p_reason); $$;

create or replace function public.expire_due_claims()
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.expire_due_claims(); $$;

revoke all on function public.create_claim(uuid, uuid) from public, anon, service_role;
revoke all on function public.extend_claim(uuid, uuid, text) from public, anon, service_role;
revoke all on function public.expire_due_claims() from public, anon, service_role;
grant execute on function public.create_claim(uuid, uuid) to authenticated;
grant execute on function public.extend_claim(uuid, uuid, text) to authenticated;
grant execute on function public.expire_due_claims() to authenticated;
