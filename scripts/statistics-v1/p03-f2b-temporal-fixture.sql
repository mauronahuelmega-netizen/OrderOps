-- Append to 10-order DML fixture. Explicit synthetic test instants, not historical backfill.
update public.business_settings set timezone='America/New_York' where business_id=(select id from public.businesses where slug='statistics-synthetic-a');
insert into public.store_sessions(id,business_id,opened_at,closed_at,status)
select md5('F2B:night:'||side)::uuid,b.id,(current_date-shift+time '22:00') at time zone 'America/New_York',
 ((current_date-shift+time '22:00') at time zone 'America/New_York')+interval '3 hours','closed'
from public.businesses b cross join (values('current',1),('previous',2)) s(side,shift) where b.slug='statistics-synthetic-a';
with instants as (
 select n,case when n<=5 then 'current' else 'previous' end side,
 case (n-1)%5 when 0 then interval '0' when 1 then interval '1 hour'-interval '1 microsecond'
 when 2 then interval '1 hour' when 3 then interval '1 hour'+interval '1 microsecond' else interval '3 hours' end delta
 from generate_series(1,10) n
)
update public.order_statistics_completions c set session_id=s.id,session_key=s.id,session_opened_at=s.opened_at,
 completed_at=s.opened_at+i.delta,timezone='America/New_York',commercial_date=(s.opened_at at time zone 'America/New_York')::date,
 date_kind='verified_session',date_conflict=false
from instants i join public.store_sessions s on s.id=md5('F2B:night:'||i.side)::uuid
where c.order_id=md5('P03F1:synthetic:'||i.n)::uuid and c.active;
set constraints statistics_v1_session_revision,statistics_v1_order_revision immediate;
