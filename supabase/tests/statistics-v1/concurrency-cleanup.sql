begin;
do $$ begin if current_setting('statistics.test_token',true) is distinct from (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED';end if;end $$;
delete from public.orders where id in ('f2030000-0000-4000-8000-000000000001','f2030000-0000-4000-8000-000000000002') and business_id=(select id from public.businesses where slug='statistics-synthetic-a');
delete from public.store_sessions where id='f2030000-0000-4000-8000-000000000004' and business_id=(select id from public.businesses where slug='statistics-synthetic-a');
commit;
