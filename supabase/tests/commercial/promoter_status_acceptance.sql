-- Status authorization for notes, commissions and tasks. Rolls back.
begin;

do $$
begin
  if not exists (select 1 from commercial.promoters where public_code = 'smoke-promoter-a' and status = 'active') then
    raise exception 'not the promoter smoke database or promoter A is not active';
  end if;
  if not exists (select 1 from commercial.promoters where public_code = 'smoke-promoter-b' and status = 'active') then
    raise exception 'promoter B is not active';
  end if;
end;
$$;

create temp table status_ids as
select id as promoter_id, account_id, public_code, status
from commercial.promoters
where public_code in ('smoke-promoter-a', 'smoke-promoter-b');

select set_config('status.opportunity', opportunity.id::text, true)
from commercial.commercial_opportunities opportunity
join commercial.promoters promoter on promoter.account_id = opportunity.owner_account_id
where promoter.public_code = 'smoke-promoter-a'
order by opportunity.created_at
limit 1;

update commercial.promoters
set status = 'suspended'
where public_code = 'smoke-promoter-a';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);

do $$
declare
  v_notes jsonb;
  v_groups jsonb;
  v_note jsonb;
  v_task jsonb;
begin
  v_notes := public.list_own_opportunity_notes(current_setting('status.opportunity')::uuid);
  if v_notes->>'ok' is distinct from 'true' then
    raise exception 'suspended read notes failed %', v_notes;
  end if;
  if v_notes::text not like '%Nota de cierre V1%' then
    raise exception 'suspended promoter lost own notes %', v_notes;
  end if;
  v_groups := public.list_own_commission_groups();
  if v_groups->>'ok' is distinct from 'true' then
    raise exception 'suspended commission read failed %', v_groups;
  end if;
  if jsonb_array_length(v_groups->'businesses') <> 0 then
    raise exception 'smoke should not persist commission contracts %', v_groups;
  end if;
  v_note := public.promoter_add_note(current_setting('status.opportunity')::uuid, 'nota suspendida');
  if v_note->>'commercial_error_code' is distinct from 'promoter_not_active' then
    raise exception 'suspended note write was accepted %', v_note;
  end if;
  v_task := public.promoter_upsert_task(
    current_setting('status.opportunity')::uuid, null, 'QA suspendida', 'cancelled', now(), 'motivo'
  );
  if v_task->>'commercial_error_code' is distinct from 'promoter_not_active' then
    raise exception 'suspended cancel was accepted %', v_task;
  end if;
end;
$$;

reset role;

update commercial.promoters
set status = 'separated'
where public_code = 'smoke-promoter-a';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);

do $$
declare
  v_note jsonb;
  v_task jsonb;
  v_groups jsonb;
begin
  v_note := public.promoter_add_note(current_setting('status.opportunity')::uuid, 'nota separada');
  v_task := public.promoter_upsert_task(
    current_setting('status.opportunity')::uuid, null, 'QA separada', 'open', now(), null
  );
  v_groups := public.list_own_commission_groups();
  if v_note->>'commercial_error_code' is distinct from 'promoter_not_active'
     or v_task->>'commercial_error_code' is distinct from 'promoter_not_active'
     or v_groups->>'ok' is distinct from 'true' then
    raise exception 'separated contract mismatch note % task % groups %', v_note, v_task, v_groups;
  end if;
end;
$$;

reset role;

do $$
begin
  if (select status from commercial.promoters where public_code = 'smoke-promoter-b') is distinct from 'active' then
    raise exception 'promoter B status changed';
  end if;
end;
$$;

rollback;
