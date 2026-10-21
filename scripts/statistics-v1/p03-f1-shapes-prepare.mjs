import fs from 'node:fs';
let fixture=fs.readFileSync('scripts/statistics-v1/p03-f1-fixture.sql','utf8');
fixture=fixture.replace("where b.slug='statistics-synthetic-a';", "where b.slug=case when o.n%2=1 then 'statistics-synthetic-a' else 'statistics-synthetic-b' end;");
fixture=fixture.replace('insert into public.order_items(order_id,product_name,quantity,unit_price)\nselect md5(\'P03F1:synthetic:\'||n)::uuid,\'Synthetic diagnostic main\',1,10 from generate_series(1,__N__) n;',`insert into public.order_items(id,order_id,product_name,quantity,unit_price,customization_snapshot)
select md5('P03F1:main:'||n)::uuid,md5('P03F1:synthetic:'||n)::uuid,'Synthetic main with modifier metadata',1,8,'{"version":1,"groups":[],"syntheticModifier":"included"}'::jsonb from generate_series(1,__N__) n;
insert into public.order_items(id,order_id,product_name,quantity,unit_price,item_kind,parent_order_item_id)
select md5('P03F1:extra:'||n)::uuid,md5('P03F1:synthetic:'||n)::uuid,'Synthetic upsell',1,2,'upsell',md5('P03F1:main:'||n)::uuid from generate_series(1,__N__) n;`);
fixture=fixture.replace("where o.id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n);\nupdate public.orders", "where o.id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n where n%3<>0);\ninsert into public.store_sessions(id,business_id,opened_at,opened_by)\nselect md5('P03F1:night')::uuid,b.id,((current_timestamp at time zone s.timezone)::date-1+time '22:00') at time zone s.timezone,p.id from public.businesses b join public.business_settings s on s.business_id=b.id join public.profiles p on p.business_id=b.id and p.role='owner' where b.slug='statistics-synthetic-a';\nupdate public.orders");
fixture+=`\n-- Genuine synthetic reopen/recompletion after a new verified session, no backfill.
update public.store_sessions set status='closed',closed_at=clock_timestamp() where id=md5('P03F1:night')::uuid;
insert into public.store_sessions(id,business_id,opened_at,opened_by)
select md5('P03F1:day')::uuid,b.id,clock_timestamp(),p.id from public.businesses b join public.profiles p on p.business_id=b.id and p.role='owner' where b.slug='statistics-synthetic-a';
update public.orders set status='pending' where id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n where n%4=1);
update public.orders set status='completed' where id in(select md5('P03F1:synthetic:'||n)::uuid from generate_series(1,__N__) n where n%4=1);
update public.store_sessions set status='closed',closed_at=clock_timestamp() where id=md5('P03F1:day')::uuid;
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision,statistics_v1_session_revision immediate;
`;
fs.writeFileSync('scripts/statistics-v1/p03-f1-shapes-fixture.sql',fixture);
let source=fs.readFileSync('scripts/statistics-v1/p03-f1-diagnose.mjs','utf8')
 .replace("profileOnly?'docs/estadisticas-v1/p03-f1/profile':'docs/estadisticas-v1/p03-f1'","'docs/estadisticas-v1/p03-f1/shapes'")
 .replace("'scripts/statistics-v1/p03-f1-fixture.sql'","'scripts/statistics-v1/p03-f1-shapes-fixture.sql'")
 .replace("profileOnly?[200]:[50,100,200,500,1000,5000]","[50]")
 .replaceAll("summary_base('today')","summary_base('last_30_days')").replaceAll("summary('today')","summary('last_30_days')");
fs.writeFileSync('scripts/statistics-v1/p03-f1-shapes-diagnose.mjs',source);
console.log('Prepared low-volume two-tenant/night/reopened/mixed-quality scenario; no DDL');
