alter table public.businesses
  add column if not exists description text,
  add column if not exists primary_color text,
  add column if not exists cover_image_url text,
  add column if not exists instagram_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_primary_color_hex'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_primary_color_hex
      check (
        primary_color is null
        or primary_color ~ '^#[0-9A-Fa-f]{6}$'
      );
  end if;
end
$$;
