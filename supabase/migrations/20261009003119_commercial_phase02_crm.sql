-- P02-T01: CRM tables. No dedup, no public form, no pipeline RPC, no merge RPC.
-- initial_promoter_id is informational and has no foreign key.
-- Support sees no CRM rows: grant and onboarding relations do not exist yet.

create table commercial.commercial_businesses (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  normalized_name text not null,
  trade_category text,
  normalized_phone text,
  email text,
  fiscal_id text,
  brand_name text,
  branch_label text,
  initial_channel text not null check (initial_channel in ('organic', 'promoter', 'campaign', 'internal')),
  initial_promoter_id uuid,
  linked_business_id uuid references public.businesses (id),
  merged_into_id uuid references commercial.commercial_businesses (id),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index commercial_businesses_phone_active_idx
  on commercial.commercial_businesses (normalized_phone)
  where normalized_phone is not null and merged_into_id is null;

create index commercial_businesses_dedup_idx
  on commercial.commercial_businesses (normalized_name, normalized_phone);

create table commercial.commercial_contacts (
  id uuid primary key default gen_random_uuid(),
  commercial_business_id uuid not null references commercial.commercial_businesses (id),
  full_name text not null,
  role_label text,
  normalized_phone text,
  email text,
  created_at timestamptz not null default now()
);

create table commercial.commercial_opportunities (
  id uuid primary key default gen_random_uuid(),
  commercial_business_id uuid not null references commercial.commercial_businesses (id),
  stage text not null check (stage in ('new', 'contacting', 'qualified', 'demo_scheduled', 'demo_done', 'follow_up', 'won', 'lost')),
  owner_account_id uuid references commercial.platform_accounts (id),
  lost_reason text,
  won_business_id uuid references public.businesses (id),
  won_by_account_id uuid references commercial.platform_accounts (id),
  won_at timestamptz,
  lost_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint commercial_opportunities_lost_reason_chk check (
    stage <> 'lost'
    or (lost_reason is not null and length(btrim(lost_reason)) > 0)
  ),
  constraint commercial_opportunities_won_chk check (
    (stage = 'won' and won_business_id is not null and won_at is not null)
    or (stage <> 'won' and won_at is null)
  )
);

create unique index commercial_opportunities_one_open_idx
  on commercial.commercial_opportunities (commercial_business_id)
  where stage not in ('won', 'lost') and archived_at is null;

create table commercial.commercial_interactions (
  id uuid primary key default gen_random_uuid(),
  commercial_business_id uuid not null references commercial.commercial_businesses (id),
  opportunity_id uuid references commercial.commercial_opportunities (id),
  kind text not null check (kind in (
    'demo_request', 'call', 'whatsapp', 'email', 'meeting', 'demo_completed',
    'note', 'promoter_registration', 'follow_up', 'document', 'other'
  )),
  channel text not null,
  origin text not null,
  actor_account_id uuid references commercial.platform_accounts (id),
  body text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table commercial.demo_submissions (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  contact_name text not null,
  trade_name text not null,
  whatsapp text not null,
  trade_category text not null,
  email text,
  needs text,
  source_channel text not null,
  promoter_ref text,
  campaign_ref text,
  resolved_business_id uuid references commercial.commercial_businesses (id),
  resolved_opportunity_id uuid references commercial.commercial_opportunities (id),
  created_at timestamptz not null default now()
);

create table commercial.opportunity_stage_events (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references commercial.commercial_opportunities (id),
  from_stage text,
  to_stage text not null,
  actor_account_id uuid references commercial.platform_accounts (id),
  reason text,
  created_at timestamptz not null default now()
);

create table commercial.commercial_tasks (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references commercial.commercial_opportunities (id),
  kind text,
  title text not null,
  description text,
  assignee_account_id uuid references commercial.platform_accounts (id),
  due_at timestamptz,
  priority text check (priority in ('low', 'normal', 'high')),
  status text not null check (status in ('open', 'done', 'cancelled')),
  cancel_reason text,
  completed_at timestamptz,
  created_by uuid references commercial.platform_accounts (id),
  created_at timestamptz not null default now(),
  constraint commercial_tasks_cancel_reason_chk check (
    status <> 'cancelled'
    or (cancel_reason is not null and length(btrim(cancel_reason)) > 0)
  )
);

create table commercial.commercial_merges (
  id uuid primary key default gen_random_uuid(),
  survivor_id uuid not null references commercial.commercial_businesses (id),
  absorbed_id uuid not null references commercial.commercial_businesses (id),
  actor_account_id uuid references commercial.platform_accounts (id),
  reason text not null,
  created_at timestamptz not null default now(),
  constraint commercial_merges_distinct_chk check (survivor_id <> absorbed_id)
);

revoke all on table
  commercial.commercial_businesses,
  commercial.commercial_contacts,
  commercial.commercial_interactions,
  commercial.demo_submissions,
  commercial.commercial_opportunities,
  commercial.opportunity_stage_events,
  commercial.commercial_tasks,
  commercial.commercial_merges
from public, anon, authenticated;

grant select on table
  commercial.commercial_businesses,
  commercial.commercial_contacts,
  commercial.commercial_interactions,
  commercial.demo_submissions,
  commercial.commercial_opportunities,
  commercial.opportunity_stage_events,
  commercial.commercial_tasks,
  commercial.commercial_merges
to authenticated;

alter table commercial.commercial_businesses enable row level security;
alter table commercial.commercial_contacts enable row level security;
alter table commercial.commercial_interactions enable row level security;
alter table commercial.demo_submissions enable row level security;
alter table commercial.commercial_opportunities enable row level security;
alter table commercial.opportunity_stage_events enable row level security;
alter table commercial.commercial_tasks enable row level security;
alter table commercial.commercial_merges enable row level security;

alter table commercial.commercial_businesses force row level security;
alter table commercial.commercial_contacts force row level security;
alter table commercial.commercial_interactions force row level security;
alter table commercial.demo_submissions force row level security;
alter table commercial.commercial_opportunities force row level security;
alter table commercial.opportunity_stage_events force row level security;
alter table commercial.commercial_tasks force row level security;
alter table commercial.commercial_merges force row level security;

create policy commercial_businesses_select on commercial.commercial_businesses
  for select to authenticated
  using (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial'));

create policy commercial_contacts_select on commercial.commercial_contacts
  for select to authenticated
  using (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial'));

create policy commercial_interactions_select on commercial.commercial_interactions
  for select to authenticated
  using (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial'));

create policy demo_submissions_select on commercial.demo_submissions
  for select to authenticated
  using (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial'));

create policy commercial_opportunities_select on commercial.commercial_opportunities
  for select to authenticated
  using (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial'));

create policy opportunity_stage_events_select on commercial.opportunity_stage_events
  for select to authenticated
  using (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial'));

create policy commercial_tasks_select on commercial.commercial_tasks
  for select to authenticated
  using (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial'));

create policy commercial_merges_select on commercial.commercial_merges
  for select to authenticated
  using (commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial'));
