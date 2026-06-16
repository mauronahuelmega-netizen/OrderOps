create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint order_events_event_type_valid
    check (
      event_type in (
        'order_created',
        'status_changed',
        'assignment_taken',
        'assignment_released'
      )
    )
);

create index if not exists order_events_order_created_idx
on public.order_events (order_id, created_at desc);

create index if not exists order_events_business_created_idx
on public.order_events (business_id, created_at desc);

alter table public.order_events enable row level security;

drop policy if exists "order_events_select_own_business" on public.order_events;
drop policy if exists "order_events_insert_own_business" on public.order_events;

create policy "order_events_select_own_business"
  on public.order_events
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

create policy "order_events_insert_own_business"
  on public.order_events
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
