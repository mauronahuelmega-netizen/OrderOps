-- Notes, cancellation and commission groups. Rolls back. Smoke data only.
begin;

do $$
begin
  if not exists (select 1 from commercial.promoters where public_code = 'smoke-promoter-a') then
    raise exception 'not the promoter smoke database';
  end if;
end;
$$;

create temp table v1_ids as
select promoter.id as promoter_id,
       promoter.account_id,
       opportunity.id as opportunity_id,
       opportunity.commercial_business_id,
       business.id as won_business_id,
       program.id as program_id,
       program.code as program_code,
       program.version as program_version,
       program.setup_price_cents,
       program.monthly_price_cents,
       program.setup_commission_cents,
       program.recurring_bps,
       program.max_recurring_slots
from commercial.promoters promoter
join commercial.commercial_opportunities opportunity on opportunity.owner_account_id = promoter.account_id
join public.businesses business on business.slug = 'negocio-smoke-a'
join commercial.commercial_programs program on true
where promoter.public_code = 'smoke-promoter-a'
order by opportunity.created_at, program.effective_from
limit 1;

insert into commercial.commercial_interactions (
  commercial_business_id, opportunity_id, kind, channel, origin, actor_account_id, body, occurred_at
)
select commercial_business_id, opportunity_id, 'note', 'web', 'v1-test', account_id, 'nota propia', now()
from v1_ids;
insert into commercial.commercial_interactions (
  commercial_business_id, opportunity_id, kind, channel, origin, actor_account_id, body, occurred_at
)
select commercial_business_id, opportunity_id, 'call', 'phone', 'v1-test', account_id, 'llamada ajena al historial', now()
from v1_ids;

select set_config('v1.opportunity', opportunity_id::text, true) from v1_ids;
select set_config('v1.slots', max_recurring_slots::text, true) from v1_ids;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);

do $$
declare
  v_notes jsonb;
  v_missing jsonb;
  v_groups jsonb;
  v_cancel jsonb;
  v_opportunity uuid;
begin
  select current_setting('v1.opportunity')::uuid into v_opportunity;
  v_notes := public.list_own_opportunity_notes(v_opportunity);
  if v_notes->>'ok' is distinct from 'true' or v_notes::text not like '%nota propia%' or v_notes::text like '%llamada ajena%' then
    raise exception 'A notes %', v_notes;
  end if;
  v_missing := public.list_own_opportunity_notes('00000000-0000-4000-8000-000000000099');
  if v_missing->>'ok' is distinct from 'true' or v_missing->'notes' <> '[]'::jsonb then
    raise exception 'unknown opportunity notes %', v_missing;
  end if;

  v_cancel := public.promoter_upsert_task(v_opportunity, null, 'QA cancelar', 'cancelled', null, null);
  if v_cancel->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'empty reason %', v_cancel;
  end if;
  v_cancel := public.promoter_upsert_task(v_opportunity, null, 'QA cancelar', 'cancelled', null, '  ');
  if v_cancel->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'blank reason %', v_cancel;
  end if;
  v_cancel := public.promoter_upsert_task(v_opportunity, null, 'QA cancelar', 'cancelled', null, 'Cliente no sigue');
  if v_cancel->>'ok' is distinct from 'true' then
    raise exception 'cancel %', v_cancel;
  end if;
end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1 from commercial.commercial_tasks task
    join v1_ids ids on ids.opportunity_id = task.opportunity_id
    where task.title = 'QA cancelar' and task.status = 'cancelled' and task.cancel_reason = 'Cliente no sigue'
  ) then
    raise exception 'cancelled task was not stored';
  end if;
end;
$$;

reset role;

insert into commercial.opportunity_attributions (opportunity_id, promoter_id, status, method, reason)
select opportunity_id, promoter_id, 'confirmed', 'manual', 'v1 test'
from v1_ids;
insert into commercial.conversion_terms (
  opportunity_id, program_id, program_code, program_version,
  setup_price_cents, monthly_price_cents, setup_commission_cents, recurring_bps,
  max_recurring_slots, attribution_id, won_business_id
)
select ids.opportunity_id, ids.program_id, ids.program_code, ids.program_version,
       ids.setup_price_cents, ids.monthly_price_cents, ids.setup_commission_cents, ids.recurring_bps,
       ids.max_recurring_slots, attribution.id, ids.won_business_id
from v1_ids ids
join commercial.opportunity_attributions attribution on attribution.opportunity_id = ids.opportunity_id and attribution.reason = 'v1 test';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);

do $$
declare
  v_groups jsonb;
  v_slots int;
begin
  v_groups := public.list_own_commission_groups();
  select current_setting('v1.slots')::int into v_slots;
  if v_groups->>'ok' is distinct from 'true' then
    raise exception 'groups %', v_groups;
  end if;
  if v_groups::text not like '%Negocio Smoke A%' then
    raise exception 'A missed business %', v_groups->'businesses';
  end if;
  if jsonb_array_length(v_groups->'businesses'->0->'slots') is distinct from v_slots then
    raise exception 'slot count % expected %', v_groups->'businesses'->0->'slots', v_slots;
  end if;
  if (v_groups->'businesses'->0->'slots'->0->>'commission') is not null then
    raise exception 'empty slot was filled %', v_groups->'businesses'->0->'slots'->0;
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000b', true);

do $$
declare
  v_notes jsonb;
  v_groups jsonb;
  v_cancel jsonb;
  v_opportunity uuid;
begin
  select current_setting('v1.opportunity')::uuid into v_opportunity;
  v_notes := public.list_own_opportunity_notes(v_opportunity);
  if v_notes->'notes' <> '[]'::jsonb then
    raise exception 'B saw notes %', v_notes;
  end if;
  v_groups := public.list_own_commission_groups();
  if v_groups::text like '%Negocio Smoke A%' then
    raise exception 'B saw A commission group %', v_groups;
  end if;
  v_cancel := public.promoter_upsert_task(v_opportunity, null, 'Ajena', 'cancelled', null, 'No corresponde');
  if v_cancel->>'ok' is distinct from 'false' then
    raise exception 'B cancelled A task %', v_cancel;
  end if;
end;
$$;

rollback;
