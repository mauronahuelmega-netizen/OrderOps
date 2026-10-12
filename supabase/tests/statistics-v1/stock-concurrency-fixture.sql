begin;
do $$ begin if current_setting('statistics.test_token',true) is distinct from (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED';end if;
perform set_config('request.jwt.claims',(select jsonb_build_object('sub',p.id,'role','authenticated')::text from public.profiles p join public.businesses b on b.id=p.business_id where b.slug='statistics-synthetic-a' and p.role='owner'),true);end $$;
update public.business_settings set on_demand_mode_active=true,scheduled_mode_active=false where business_id=(select id from public.businesses where slug='statistics-synthetic-a');
insert into public.categories(id,business_id,name) select 'f2050000-0000-4000-8000-000000000001',id,'Synthetic concurrent stock category' from public.businesses where slug='statistics-synthetic-a';
insert into public.products(id,business_id,category_id,name,price,track_stock,stock) select 'f2050000-0000-4000-8000-000000000002',id,'f2050000-0000-4000-8000-000000000001','Synthetic concurrent stock',10,true,20 from public.businesses where slug='statistics-synthetic-a';
select public.create_order(id,'SYNTHETIC STOCK CONCURRENCY CANCEL','0000000000',current_date,'pickup',null,null,'[{"product_id":"f2050000-0000-4000-8000-000000000002","quantity":2}]') from public.businesses where slug='statistics-synthetic-a';
commit;
