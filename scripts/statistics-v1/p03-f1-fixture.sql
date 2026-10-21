-- Explicit synthetic cohort; DML only, transaction-local, rollback on disconnect/error.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
do $$ begin
 if current_setting('statistics.test_token',true) is distinct from
  (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED'; end if;
 if (select count(*) from public.businesses where slug='statistics-synthetic-a')<>1 then raise exception 'SYNTHETIC_BUSINESS_REQUIRED';end if;
 if exists(select 1 from public.orders) then raise exception 'EMPTY_ORDERS_REQUIRED';end if;
end $$;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',p.id,'role','authenticated')::text from public.profiles p join public.businesses b on b.id=p.business_id where b.slug='statistics-synthetic-a' and p.role='owner'),true);
with cohort as (select md5('P03F1:synthetic:'||n)::uuid id,n from generate_series(1,__N__) n)
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status,order_code)
select o.id,b.id,'SYNTHETIC P03-F1 PERFORMANCE','0000000000',current_date,'pickup',10,'itemized',
 'P'||substr('23456789',1+(o.n/4096)%8,1)||substr('23456789',1+(o.n/512)%8,1)||substr('23456789',1+(o.n/64)%8,1)||substr('23456789',1+(o.n/8)%8,1)||substr('23456789',1+o.n%8,1)
from cohort o cross join public.businesses b where b.slug='statistics-synthetic-a';
insert into public.order_items(order_id,product_name,quantity,unit_price)
select md5('P03F1:synthetic:'||n)::uuid,'Synthetic diagnostic main',1,10 from generate_series(1,__N__) n;
insert into public.order_financials(order_id,business_id,agreed_total)
select o.id,o.business_id,10 from public.orders o where o.id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n);
insert into public.finance_audit_events(business_id,actor_id,event_type,entity_type,entity_id,payload)
select o.business_id,p.id,'order_financials_initialized','order_financials',o.id,'{"mode":"copy_total_price","agreed_total":10}'::jsonb
from public.orders o join public.profiles p on p.business_id=o.business_id and p.role='owner'
where o.id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n);
update public.orders set status='completed' where id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n);
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision immediate;
do $$ begin
 if (select count(*) from public.order_statistics_completions where active and order_id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n))<>__N__ then raise exception 'CAPTURE_COUNT';end if;
end $$;
