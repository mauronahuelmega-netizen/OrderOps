-- E2E-01 and demo limits. Rolls back fixtures.
begin;

do $$
declare
  v_first jsonb;
  v_second jsonb;
  v_missing jsonb;
  v_ref jsonb;
  v_limited jsonb;
  v_businesses int;
  v_interactions int;
  v_opportunities int;
  v_events int;
  i int;
begin
  v_missing := commercial.submit_demo_request(
    'Ana', 'Pan Norte', '11 5555-0201', '', null, null, null, null, 'e2e-missing-category', null
  );
  if v_missing->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'missing category returned %', v_missing;
  end if;

  v_first := commercial.submit_demo_request(
    'Ana', 'Pan Norte', '11 5555-0201', 'panaderia', null, 'horno', null, null, 'e2e-01-key', 'e2e-ip-organic'
  );
  v_second := commercial.submit_demo_request(
    'Ana', 'Pan Norte', '11 5555-0201', 'panaderia', null, 'horno', null, null, 'e2e-01-key', null
  );
  if v_first->>'ok' is distinct from 'true' or v_second->>'duplicate' is distinct from 'true' then
    raise exception 'idempotency failed: % / %', v_first, v_second;
  end if;
  if v_first->>'submission_id' is distinct from v_second->>'submission_id' then
    raise exception 'idempotency created another submission';
  end if;

  select count(*) into v_businesses from commercial.commercial_businesses where normalized_phone = '+5491155550201';
  select count(*) into v_interactions
  from commercial.commercial_interactions
  where commercial_business_id = (v_first->>'business_id')::uuid
    and kind = 'demo_request'
    and origin = 'organic';
  select count(*) into v_opportunities
  from commercial.commercial_opportunities
  where id = (v_first->>'opportunity_id')::uuid
    and stage = 'new';
  select count(*) into v_events
  from commercial.outbox_events
  where event_name = 'demo.submitted'
    and correlation_id = (v_first->>'submission_id')::uuid;
  if v_businesses <> 1 or v_interactions <> 1 or v_opportunities <> 1 or v_events <> 1 then
    raise exception 'e2e counts businesses % interactions % opportunities % events %', v_businesses, v_interactions, v_opportunities, v_events;
  end if;

  v_ref := commercial.submit_demo_request(
    'Luis', 'Cafe Sur', '11 5555-0202', 'cafeteria', null, null, 'PUB-1', null, 'e2e-ref-key', 'e2e-ip-ref'
  );
  if not exists (
    select 1 from commercial.commercial_interactions
    where commercial_business_id = (v_ref->>'business_id')::uuid
      and origin = 'PUB-1'
  ) then
    raise exception 'promoter ref was not kept as interaction origin';
  end if;

  for i in 1..5 loop
    v_limited := commercial.submit_demo_request(
      'Rita', 'Rotiseria', '11 5555-0203', 'rotiseria', null, null, null, null, 'e2e-rate-' || i::text, 'ip-hash-1'
    );
    if v_limited->>'ok' is distinct from 'true' then
      raise exception 'rate slot % failed: %', i, v_limited;
    end if;
  end loop;
  v_limited := commercial.submit_demo_request(
    'Rita', 'Rotiseria', '11 5555-0203', 'rotiseria', null, null, null, null, 'e2e-rate-6', 'ip-hash-1'
  );
  if v_limited->>'commercial_error_code' is distinct from 'rate_limited' then
    raise exception 'sixth request returned %', v_limited;
  end if;

  if to_regclass('commercial.promoter_commissions') is not null then
    raise exception 'demo request created commission tables';
  end if;
  if exists (
    select 1 from commercial.opportunity_attributions attribution
    join commercial.commercial_opportunities opportunity on opportunity.id = attribution.opportunity_id
    join commercial.commercial_businesses business on business.id = opportunity.commercial_business_id
    where business.normalized_phone in ('+5491155550201', '+5491155550202', '+5491155550203')
  ) or exists (
    select 1 from commercial.attribution_claims claim
    join commercial.commercial_businesses business on business.id = claim.commercial_business_id
    where business.normalized_phone in ('+5491155550201', '+5491155550202', '+5491155550203')
  ) then
    raise exception 'organic demo created an attribution or claim';
  end if;
end;
$$;

rollback;
