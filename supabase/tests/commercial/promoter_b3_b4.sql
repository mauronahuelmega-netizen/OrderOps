-- B3/B4 acceptance against the isolated smoke data. Rolls back.
begin;

do $$
begin
  if not exists (select 1 from commercial.promoters where public_code = 'smoke-promoter-a') then
    raise exception 'not the promoter smoke database';
  end if;
  if has_table_privilege('authenticated', 'commercial.promoter_portal_preferences', 'DELETE') then
    raise exception 'authenticated can delete preferences';
  end if;
  if has_table_privilege('authenticated', 'commercial.promoters', 'UPDATE') then
    raise exception 'authenticated can update promoters';
  end if;
  if has_function_privilege('anon', 'public.read_own_welcome_preference()', 'EXECUTE') then
    raise exception 'anon can execute the welcome read';
  end if;
end;
$$;

insert into commercial.commercial_contacts (commercial_business_id, full_name, normalized_phone)
values ('434b745b-611e-4fa4-8335-67f303abe5af', 'Contacto smoke', '+5491155500199');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);

do $$
declare
  v_read jsonb;
  v_write jsonb;
begin
  v_read := public.read_own_welcome_preference();
  if v_read->>'ok' is distinct from 'true' or v_read->>'welcome_dismissed_at' is not null then
    raise exception 'absent preference %', v_read;
  end if;
  v_write := public.set_own_welcome_dismissed(false);
  v_read := public.read_own_welcome_preference();
  if v_write->>'ok' is distinct from 'true' or v_read->>'welcome_dismissed_at' is not null then
    raise exception 'explicit null % %', v_write, v_read;
  end if;
  v_write := public.set_own_welcome_dismissed(true);
  v_read := public.read_own_welcome_preference();
  if v_write->>'ok' is distinct from 'true' or v_read->>'welcome_dismissed_at' is null then
    raise exception 'dismiss did not persist % %', v_write, v_read;
  end if;
  if (select count(*) from commercial.promoter_portal_preferences) <> 1 then
    raise exception 'visible preference count is not one';
  end if;
  if (select count(*) from commercial.commercial_contacts) <> 0 then
    raise exception 'promoter A selected commercial_contacts';
  end if;
  v_write := public.set_own_welcome_dismissed(false);
  v_read := public.read_own_welcome_preference();
  if v_read->>'welcome_dismissed_at' is not null then
    raise exception 'reopen did not clear %', v_read;
  end if;
  perform public.set_own_welcome_dismissed(true);
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000b', true);

do $$
declare
  v_read jsonb;
begin
  v_read := public.read_own_welcome_preference();
  if v_read->>'ok' is distinct from 'true' or v_read->>'welcome_dismissed_at' is not null then
    raise exception 'B saw A preference %', v_read;
  end if;
  if (select count(*) from commercial.promoter_portal_preferences) <> 0 then
    raise exception 'B counted A preference';
  end if;
  begin
    insert into commercial.promoter_portal_preferences (promoter_id, welcome_dismissed_at)
    values ('d11ce001-0000-4000-8000-00000000000a', now());
    raise exception 'B inserted A preference';
  exception
    when insufficient_privilege then
      if SQLSTATE is distinct from '42501' then
        raise exception 'preference isolation sqlstate %', SQLSTATE;
      end if;
  end;
end;
$$;

reset role;
update commercial.promoters set status = 'suspended' where public_code = 'smoke-promoter-a';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);

do $$
declare
  v_write jsonb;
begin
  v_write := public.set_own_welcome_dismissed(false);
  if v_write->>'ok' is distinct from 'true' then
    raise exception 'suspended write %', v_write;
  end if;
end;
$$;

reset role;
update commercial.promoters set status = 'separated' where public_code = 'smoke-promoter-a';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);

do $$
declare
  v_write jsonb;
begin
  v_write := public.set_own_welcome_dismissed(true);
  if v_write->>'ok' is distinct from 'true' then
    raise exception 'separated rpc write %', v_write;
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);

do $$
declare
  v_read jsonb;
begin
  v_read := public.read_own_welcome_preference();
  if v_read->>'commercial_error_code' is distinct from 'unauthenticated' then
    raise exception 'missing session read %', v_read;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);

do $$
declare
  v_overview jsonb;
  v_ids jsonb;
  v_expected jsonb;
begin
  v_overview := public.promoter_overview();
  if v_overview::text like '%welcome_dismissed_at%' or v_overview::text like '%fiscal_id%' then
    raise exception 'overview leaked extra keys %', v_overview;
  end if;
  if v_overview::text not like '%+5491155500101%' or v_overview::text like '%+5491155500102%' then
    raise exception 'A phone set %', v_overview->'businesses';
  end if;
  select coalesce(jsonb_agg(item->>'id' order by item->>'id'), '[]'::jsonb) into v_ids
  from jsonb_array_elements(v_overview->'businesses') item;
  select coalesce(jsonb_agg(owned.business_id order by owned.business_id), '[]'::jsonb) into v_expected
  from (
    select claim.commercial_business_id::text as business_id
    from commercial.attribution_claims claim
    where claim.promoter_id = 'd11ce001-0000-4000-8000-00000000000a'
    union
    select opportunity.commercial_business_id::text
    from commercial.commercial_opportunities opportunity
    join commercial.promoters promoter on promoter.account_id = opportunity.owner_account_id
    where promoter.id = 'd11ce001-0000-4000-8000-00000000000a'
  ) owned;
  if v_ids is distinct from v_expected then
    raise exception 'business ids changed % expected %', v_ids, v_expected;
  end if;

  perform set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000b', true);
  v_overview := public.promoter_overview();
  if v_overview::text like '%+5491155500101%' or v_overview::text like '%434b745b-611e-4fa4-8335-67f303abe5af%' then
    raise exception 'B saw A business %', v_overview->'businesses';
  end if;
  if v_overview::text not like '%+5491155500102%' then
    raise exception 'B missed own phone %', v_overview->'businesses';
  end if;

  update commercial.commercial_businesses set normalized_phone = null where id = '434b745b-611e-4fa4-8335-67f303abe5af';
  perform set_config('request.jwt.claim.sub', 'a11ce001-0000-4000-8000-00000000000a', true);
  v_overview := public.promoter_overview();
  if (v_overview->'businesses'->0->>'normalized_phone') is not null then
    raise exception 'null phone %', v_overview->'businesses';
  end if;
  update commercial.commercial_businesses set normalized_phone = '+5411' where id = '434b745b-611e-4fa4-8335-67f303abe5af';
  v_overview := public.promoter_overview();
  if (v_overview->'businesses'->0->>'normalized_phone') is distinct from '+5411' then
    raise exception 'invalid phone was rewritten %', v_overview->'businesses';
  end if;
end;
$$;

rollback;
