-- P02-T02. Rolls back fixtures.
-- Concurrency limit: this session has one connection, so two transactions cannot overlap.
-- The function takes pg_advisory_xact_lock on the normalized phone. Two sequential calls prove one lead.
begin;

do $$
declare
  v_first jsonb;
  v_second jsonb;
  v_name jsonb;
  v_phone jsonb;
  v_fiscal jsonb;
  v_count int;
begin
  if position('pg_advisory_xact_lock' in pg_get_functiondef('commercial.find_or_prepare_business(text,text,text,text)'::regprocedure)) = 0 then
    raise exception 'find_or_prepare_business does not lock the phone';
  end if;

  v_first := commercial.find_or_prepare_business(U&'Panader\00eda Norte', '11 5555-0101', null, 'organic');
  v_second := commercial.find_or_prepare_business('panaderia norte', '+54 9 11 5555-0101', null, 'organic');
  if v_first->>'classification' is distinct from 'none'
    or v_second->>'classification' is distinct from 'high'
    or v_first->>'business_id' is distinct from v_second->>'business_id'
    or (v_second->>'created')::boolean then
    raise exception 'same name and phone did not collapse: % / %', v_first, v_second;
  end if;

  select count(*) into v_count
  from commercial.commercial_businesses
  where normalized_phone = '+5491155550101';
  if v_count <> 1 then
    raise exception 'high match created % businesses', v_count;
  end if;

  v_name := commercial.find_or_prepare_business(U&'Panader\00eda Norte', '11 5555-0199', null, 'organic');
  if v_name->>'classification' is distinct from 'probable' or not (v_name->>'created')::boolean then
    raise exception 'same name and other phone was %', v_name;
  end if;
  if v_name->>'business_id' = v_first->>'business_id' then
    raise exception 'name-only match reused the first business';
  end if;

  v_phone := commercial.find_or_prepare_business('Farmacia Sur', '11 5555-0101', null, 'organic');
  if v_phone->>'classification' is distinct from 'probable' or not (v_phone->>'created')::boolean then
    raise exception 'same phone and other name was %', v_phone;
  end if;

  v_fiscal := commercial.find_or_prepare_business(U&'Verduler\00eda Este', '11 5555-0188', '20111111112', 'organic');
  v_fiscal := commercial.find_or_prepare_business(U&'Verduler\00eda Este', '11 5555-0188', '20222222223', 'organic');
  if v_fiscal->>'classification' is distinct from 'probable' or not (v_fiscal->>'created')::boolean then
    raise exception 'contradictory fiscal id became %', v_fiscal;
  end if;

  if position('attribution_claims' in pg_get_functiondef('commercial.find_or_prepare_business(text,text,text,text)'::regprocedure)) > 0
    or to_regclass('commercial.promoter_commissions') is not null then
    raise exception 'dedup created claims or commissions';
  end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform commercial.find_or_prepare_business('Otro', '11 5555-0101', null, 'organic');
    raise exception 'anon find_or_prepare was accepted';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

rollback;
