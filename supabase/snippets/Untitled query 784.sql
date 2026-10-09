select
  p.id,
  p.role,
  p.business_id,
  b.name,
  b.slug
from public.profiles p
join public.businesses b
  on b.id = p.business_id
where b.slug = 'demohamburgueseria';