create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists push_subscriptions_endpoint_key
on public.push_subscriptions(endpoint);

create index if not exists push_subscriptions_business_active_idx
on public.push_subscriptions(business_id)
where revoked_at is null;

create index if not exists push_subscriptions_profile_active_idx
on public.push_subscriptions(profile_id)
where revoked_at is null;

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own_profile" on public.push_subscriptions;
create policy "push_subscriptions_select_own_profile"
  on public.push_subscriptions
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    and business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "push_subscriptions_insert_own_profile" on public.push_subscriptions;
create policy "push_subscriptions_insert_own_profile"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "push_subscriptions_update_own_profile" on public.push_subscriptions;
create policy "push_subscriptions_update_own_profile"
  on public.push_subscriptions
  for update
  to authenticated
  using (
    profile_id = auth.uid()
    and business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
  )
  with check (
    profile_id = auth.uid()
    and business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "push_subscriptions_delete_own_profile" on public.push_subscriptions;
create policy "push_subscriptions_delete_own_profile"
  on public.push_subscriptions
  for delete
  to authenticated
  using (
    profile_id = auth.uid()
    and business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );
