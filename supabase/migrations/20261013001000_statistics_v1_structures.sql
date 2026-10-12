-- PREPARED FOR REVIEW ONLY. Not authorized for execution, even on the isolated stack.
-- Five owned tables; no backfill, source columns, role changes or commercial objects.
create function private.statistics_can_read(p_business uuid) returns boolean language sql stable security definer
set search_path=pg_catalog,public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.business_id=p_business and p.role in ('owner','manager','admin'));
$$;
revoke all on function private.statistics_can_read(uuid) from public,anon,authenticated,service_role;
grant execute on function private.statistics_can_read(uuid) to authenticated;
create table public.business_statistics_state (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  instrumented_at timestamptz not null default clock_timestamp(),
  contract_version text not null default 'statistics.v1',
  revision bigint not null default 1 check (revision > 0)
);
create table public.store_session_statistics_snapshots (
  session_id uuid primary key references public.store_sessions(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  opened_at timestamptz not null,
  timezone text,
  commercial_date date,
  observed_closed_at timestamptz,
  source_quality text not null check (source_quality in ('exact','unavailable','conflict')),
  policy_version text not null default 'session-opening.v1',
  unique(session_id,business_id),
  check (source_quality <> 'exact' or (timezone is not null and commercial_date is not null))
);
create table public.order_item_statistics_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null references public.order_items(id) on delete cascade,
  order_id uuid not null,
  business_id uuid not null,
  generation bigint not null check (generation > 0),
  active boolean not null default true,
  product_identity uuid,
  product_name text not null,
  category_identity uuid,
  category_name text,
  source_kind text not null check (source_kind in ('line_insert','identity_replacement','identity_unknown')),
  captured_at timestamptz not null default clock_timestamp(),
  foreign key(order_id,business_id) references public.orders(id,business_id) on delete cascade,
  unique(source_item_id,generation)
);
create unique index statistics_item_active on public.order_item_statistics_snapshots(source_item_id) where active;
create index statistics_item_order on public.order_item_statistics_snapshots(business_id,order_id);
create table public.order_statistics_completions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  order_id uuid not null,
  cycle bigint not null check (cycle > 0),
  completed_at timestamptz not null,
  source_kind text not null default 'status_transition' check (source_kind='status_transition'),
  session_id uuid,
  session_key uuid,
  session_opened_at timestamptz,
  timezone text,
  commercial_date date,
  date_kind text not null check (date_kind in ('verified_session','outside_session','missing_timezone')),
  active boolean not null default true,
  invalidated_at timestamptz,
  invalidation_reason text,
  agreed_total numeric(14,2),
  products_net numeric(14,2),
  delivery numeric(14,2),
  breakdown_source text not null check (breakdown_source in ('copy_total_price','unresolved','missing_agreement')),
  agreement_evidence_id uuid,
  composition_status text not null,
  composition_digest text not null,
  gross_products numeric,
  main_units bigint,
  monetary_conflict boolean not null default false,
  composition_conflict boolean not null default false,
  date_conflict boolean not null default false,
  contract_version text not null default 'statistics.v1',
  foreign key(order_id,business_id) references public.orders(id,business_id) on delete cascade,
  foreign key(session_id,business_id) references public.store_session_statistics_snapshots(session_id,business_id) on delete set null (session_id),
  unique(order_id,cycle), unique(id,business_id),
  check (agreed_total is null or (agreed_total > 0 and agreed_total <> 'NaN'::numeric)),
  check (products_net is null or (products_net >= 0 and products_net <> 'NaN'::numeric)),
  check (delivery is null or (delivery >= 0 and delivery <> 'NaN'::numeric)),
  check (breakdown_source <> 'copy_total_price' or (products_net is not null and delivery=0 and agreed_total=products_net)),
  check (date_kind='missing_timezone' or (timezone is not null and commercial_date is not null)),
  check (date_kind <> 'verified_session' or (session_key is not null and session_opened_at is not null)),
  check (main_units is null or main_units >= 0),
  check ((active and invalidated_at is null) or (not active and invalidated_at is not null))
);
create unique index statistics_completion_active on public.order_statistics_completions(order_id) where active;
create index statistics_completion_period on public.order_statistics_completions(business_id,commercial_date,completed_at) where active;
create table public.order_statistics_completion_items (
  completion_id uuid not null,
  business_id uuid not null,
  line_key uuid not null,
  parent_line_key uuid,
  product_identity uuid,
  product_name text not null,
  category_identity uuid,
  category_name text,
  item_kind text not null check (item_kind in ('product','upsell')),
  quantity bigint not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0 and unit_price <> 'NaN'::numeric),
  gross numeric not null check (gross >= 0 and gross <> 'NaN'::numeric),
  net_amount numeric,
  primary key(completion_id,line_key),
  foreign key(completion_id,business_id) references public.order_statistics_completions(id,business_id) on delete cascade,
  foreign key(completion_id,parent_line_key) references public.order_statistics_completion_items(completion_id,line_key) deferrable initially deferred,
  check ((item_kind='product' and parent_line_key is null) or (item_kind='upsell' and parent_line_key is not null)),
  check (net_amount is null or (net_amount >= 0 and net_amount <> 'NaN'::numeric))
);
create index statistics_completion_product on public.order_statistics_completion_items(business_id,product_identity);
-- RLS is enabled immediately; permissions/policies are installed in the read migration.
alter table public.business_statistics_state enable row level security;
alter table public.store_session_statistics_snapshots enable row level security;
alter table public.order_item_statistics_snapshots enable row level security;
alter table public.order_statistics_completions enable row level security;
alter table public.order_statistics_completion_items enable row level security;
revoke all on public.business_statistics_state,public.store_session_statistics_snapshots,public.order_item_statistics_snapshots,public.order_statistics_completions,public.order_statistics_completion_items from public,anon,authenticated,service_role;
