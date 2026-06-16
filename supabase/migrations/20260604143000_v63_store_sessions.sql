create table if not exists public.store_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'open',
  opened_by uuid references public.profiles(id) on delete set null,
  closed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_sessions_status_valid check (status in ('open', 'closed'))
);

create index if not exists store_sessions_business_opened_idx
on public.store_sessions (business_id, opened_at desc);

create unique index if not exists store_sessions_one_open_per_business_idx
on public.store_sessions (business_id)
where status = 'open' and closed_at is null;

alter table public.store_sessions enable row level security;

drop policy if exists "store_sessions_select_own_business" on public.store_sessions;
drop policy if exists "store_sessions_insert_own_business" on public.store_sessions;
drop policy if exists "store_sessions_update_own_business" on public.store_sessions;

create policy "store_sessions_select_own_business"
  on public.store_sessions
  for select
  to authenticated
  using (
    business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

create policy "store_sessions_insert_own_business"
  on public.store_sessions
  for insert
  to authenticated
  with check (
    business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

create policy "store_sessions_update_own_business"
  on public.store_sessions
  for update
  to authenticated
  using (
    business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  )
  with check (
    business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );
