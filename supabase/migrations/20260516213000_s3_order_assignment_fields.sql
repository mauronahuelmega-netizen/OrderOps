alter table public.orders
  add column if not exists assigned_to uuid references public.profiles (id),
  add column if not exists assigned_at timestamptz;
