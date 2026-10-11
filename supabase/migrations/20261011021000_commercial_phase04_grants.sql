-- P04-T02: onboarding grants. Renewal is a new row. Separation revokes open grants.

create table commercial.onboarding_grants (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references commercial.promoters (id),
  business_id uuid not null references public.businesses (id),
  opportunity_id uuid references commercial.commercial_opportunities (id),
  status text not null check (status in ('pending_client', 'active', 'expired', 'revoked', 'completed')),
  requested_by uuid references commercial.platform_accounts (id),
  approved_by_profile_id uuid references public.profiles (id),
  exception_by_account_id uuid references commercial.platform_accounts (id),
  exception_reason text,
  starts_at timestamptz,
  ends_at timestamptz,
  revoked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  check (ends_at is null or starts_at is null or ends_at <= starts_at + interval '30 days'),
  check (
    status <> 'active'
    or (
      starts_at is not null
      and ends_at is not null
      and (
        approved_by_profile_id is not null
        or (exception_by_account_id is not null and exception_reason is not null and char_length(btrim(exception_reason)) > 0)
      )
    )
  )
);

create or replace function commercial.reject_onboarding_grant_extension()
returns trigger
language plpgsql
as $$
begin
  if old.ends_at is not null and new.ends_at is not null and new.ends_at > old.ends_at then
    raise exception 'grant_extension_forbidden' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger onboarding_grants_no_silent_extension
  before update on commercial.onboarding_grants
  for each row execute function commercial.reject_onboarding_grant_extension();

create table commercial.onboarding_grant_events (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references commercial.onboarding_grants (id),
  event_type text not null check (event_type in ('requested', 'approved', 'exception', 'rejected', 'revoked', 'completed', 'expired')),
  actor_account_id uuid,
  actor_profile_id uuid,
  reason text,
  created_at timestamptz not null default pg_catalog.now()
);

alter table commercial.onboarding_grants enable row level security;
alter table commercial.onboarding_grants force row level security;
alter table commercial.onboarding_grant_events enable row level security;
alter table commercial.onboarding_grant_events force row level security;
revoke all on commercial.onboarding_grants, commercial.onboarding_grant_events from public, anon, authenticated;

create or replace function commercial.business_catalog_approver(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.business_id = p_business_id
      and profile.role in ('owner', 'manager', 'admin')
  );
$$;
