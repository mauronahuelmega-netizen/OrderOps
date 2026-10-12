-- Future write test setup. Persists synthetic rows ONLY in the approved isolated environment.
begin;
do $$ begin
  if current_setting('statistics.test_token',true) is distinct from (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED';end if;
  if exists(select 1 from public.orders where id in ('f2030000-0000-4000-8000-000000000001','f2030000-0000-4000-8000-000000000002')) then raise exception 'CONCURRENCY_FIXTURE_ALREADY_EXISTS';end if;
end $$;
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status)
select x.id,b.id,'SYNTHETIC CONCURRENCY','0000000000',current_date,'pickup',23,'legacy_unknown'
from public.businesses b cross join (values('f2030000-0000-4000-8000-000000000001'::uuid),('f2030000-0000-4000-8000-000000000002'::uuid)) x(id) where b.slug='statistics-synthetic-a';
insert into public.order_financials(order_id,business_id,agreed_total) select id,business_id,23 from public.orders where id in ('f2030000-0000-4000-8000-000000000001','f2030000-0000-4000-8000-000000000002');
insert into public.store_sessions(id,business_id,opened_at) select 'f2030000-0000-4000-8000-000000000004',id,clock_timestamp()-interval '1 hour' from public.businesses where slug='statistics-synthetic-a';
commit;
