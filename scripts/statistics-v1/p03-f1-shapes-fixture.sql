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
from cohort o cross join public.businesses b where b.slug=case when o.n%2=1 then 'statistics-synthetic-a' else 'statistics-synthetic-b' end;
insert into public.order_items(id,order_id,product_name,quantity,unit_price,customization_snapshot)
select md5('P03F1:main:'||n)::uuid,md5('P03F1:synthetic:'||n)::uuid,'Synthetic main with modifier metadata',1,8,'{"version":1,"groups":[],"syntheticModifier":"included"}'::jsonb from generate_series(1,__N__) n;
insert into public.order_items(id,order_id,product_name,quantity,unit_price,item_kind,parent_order_item_id)
select md5('P03F1:extra:'||n)::uuid,md5('P03F1:synthetic:'||n)::uuid,'Synthetic upsell',1,2,'upsell',md5('P03F1:main:'||n)::uuid from generate_series(1,__N__) n;
insert into public.order_financials(order_id,business_id,agreed_total)
select o.id,o.business_id,10 from public.orders o where o.id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n);
insert into public.finance_audit_events(business_id,actor_id,event_type,entity_type,entity_id,payload)
select o.business_id,p.id,'order_financials_initialized','order_financials',o.id,'{"mode":"copy_total_price","agreed_total":10}'::jsonb
from public.orders o join public.profiles p on p.business_id=o.business_id and p.role='owner'
where o.id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n where n%3<>0);
insert into public.store_sessions(id,business_id,opened_at,opened_by)
select md5('P03F1:night')::uuid,b.id,((current_timestamp at time zone s.timezone)::date-1+time '22:00') at time zone s.timezone,p.id from public.businesses b join public.business_settings s on s.business_id=b.id join public.profiles p on p.business_id=b.id and p.role='owner' where b.slug='statistics-synthetic-a';
update public.orders set status='completed' where id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n);
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision immediate;
do $$ begin
 if (select count(*) from public.order_statistics_completions where active and order_id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n))<>__N__ then raise exception 'CAPTURE_COUNT';end if;
end $$;

-- Genuine synthetic reopen/recompletion after a new verified session, no backfill.
update public.store_sessions set status='closed',closed_at=clock_timestamp() where id=md5('P03F1:night')::uuid;
insert into public.store_sessions(id,business_id,opened_at,opened_by)
select md5('P03F1:day')::uuid,b.id,clock_timestamp(),p.id from public.businesses b join public.profiles p on p.business_id=b.id and p.role='owner' where b.slug='statistics-synthetic-a';
update public.orders set status='pending' where id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n where n%4=1);
update public.orders set status='completed' where id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n where n%4=1);
update public.store_sessions set status='closed',closed_at=clock_timestamp() where id=md5('P03F1:day')::uuid;
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision,statistics_v1_session_revision immediate;
