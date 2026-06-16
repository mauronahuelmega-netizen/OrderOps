alter table public.businesses
  add column if not exists catalog_hero_headline text,
  add column if not exists catalog_hero_badge text,
  add column if not exists catalog_hero_microcopy text;
