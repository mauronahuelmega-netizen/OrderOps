begin;

insert into public.businesses (
  id,
  name,
  slug,
  whatsapp_number,
  is_active
)
values (
  'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf',
  'La Burguesía',
  'demohamburgueseria',
  '5491100000000',
  true
)
on conflict (slug)
do update set
  name = excluded.name,
  whatsapp_number = excluded.whatsapp_number,
  is_active = true;

insert into public.profiles (
  id,
  business_id,
  role
)
select
  'fdefa0c6-5a1e-495b-b896-a7a71d7f34fd'::uuid,
  b.id,
  'owner'
from public.businesses b
where b.slug = 'demohamburgueseria'
on conflict (id)
do update set
  business_id = excluded.business_id,
  role = excluded.role;

commit;