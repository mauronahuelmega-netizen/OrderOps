-- P03-T02. Rolls back fixtures.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '62626262-6262-4262-8262-626262626201', 'authenticated', 'authenticated',
  'phase03-verifier@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);
insert into commercial.platform_accounts (id, user_id, kind)
values ('62626262-6262-4262-8262-626262626211', '62626262-6262-4262-8262-626262626201', 'internal');
insert into commercial.internal_role_assignments (account_id, role)
values ('62626262-6262-4262-8262-626262626211', 'superadmin');
select set_config('request.jwt.claim.sub', '62626262-6262-4262-8262-626262626201', true);

do $$
declare
  v_ana jsonb;
  v_luis jsonb;
  v_ana_id uuid;
  v_luis_id uuid;
  v_user uuid;
  v_evidence jsonb;
  v_review jsonb;
  v_active jsonb;
  v_bank jsonb;
  v_again jsonb;
  v_disabled int;
  v_read jsonb;
  v_kind text;
begin
  v_ana := commercial.register_promoter('Ana Banco', 'phase03-ana-bank@local.test', '20111111112');
  v_luis := commercial.register_promoter('Luis Banco', 'phase03-luis-bank@local.test', '20222222223');
  v_ana_id := (v_ana->>'promoter_id')::uuid;
  v_luis_id := (v_luis->>'promoter_id')::uuid;
  perform commercial.transition_promoter_status(v_ana_id, 'pending_verification');

  foreach v_kind in array array['identity', 'cuit', 'contract'] loop
    v_evidence := commercial.submit_promoter_evidence(
      v_ana_id,
      v_kind,
      case
        when v_kind = 'contract' then 'contracts/' || v_ana_id::text || '/fixture-' || v_kind
        else 'verifications/' || v_ana_id::text || '/fixture-' || v_kind
      end
    );
    if v_kind <> 'contract' then
      v_review := commercial.review_verification((v_evidence->>'evidence_id')::uuid, 'verified', 'documento ficticio');
      if v_review->>'ok' is distinct from 'true' then
        raise exception 'review % returned %', v_kind, v_review;
      end if;
    end if;
  end loop;

  v_active := commercial.activate_promoter(v_ana_id);
  if v_active->>'commercial_error_code' is distinct from 'verification_incomplete' then
    raise exception 'activation without monotributo returned %', v_active;
  end if;

  v_evidence := commercial.submit_promoter_evidence(
    v_ana_id, 'monotributo', 'verifications/' || v_ana_id::text || '/fixture-monotributo'
  );
  perform commercial.review_verification((v_evidence->>'evidence_id')::uuid, 'verified', 'documento ficticio, no consulta fiscal');
  v_active := commercial.activate_promoter(v_ana_id);
  if v_active->>'status' is distinct from 'active' then
    raise exception 'activation returned %', v_active;
  end if;

  v_bank := commercial.replace_bank_account(v_ana_id, '0000003100000000000001', 'Ana Banco', 'fixture');
  v_again := commercial.replace_bank_account(v_ana_id, '0000003100000000000002', 'Ana Banco', 'reemplazo');
  select count(*) into v_disabled
  from commercial.promoter_bank_accounts
  where id = (v_bank->>'bank_account_id')::uuid
    and disabled_at is not null
    and is_current = false;
  if v_disabled <> 1 or (v_again->>'is_current')::boolean is distinct from true then
    raise exception 'bank replace returned % / %', v_bank, v_again;
  end if;

  perform commercial.replace_bank_account(v_luis_id, '0000003100000000000003', 'Luis Banco', 'ajeno');

  select account.user_id into v_user
  from commercial.promoters promoter
  join commercial.platform_accounts account on account.id = promoter.account_id
  where promoter.id = v_ana_id;
  perform set_config('request.jwt.claim.sub', v_user::text, true);
  v_read := commercial.read_own_bank();
  if v_read::text like '%0000003100000000000003%' or jsonb_array_length(v_read->'accounts') <> 2 then
    raise exception 'own bank leaked or missed rows %', v_read;
  end if;
end;
$$;

do $$
declare
  v_public boolean;
begin
  select public into v_public from storage.buckets where id = 'commercial-documents';
  if v_public is distinct from false then
    raise exception 'commercial-documents bucket is public';
  end if;
end;
$$;

set local role authenticated;
do $$
declare
  v_count int;
begin
  select count(*) into v_count from commercial.promoter_bank_accounts;
  if v_count <> 2 then
    raise exception 'promoter saw % bank rows', v_count;
  end if;
end;
$$;
reset role;

rollback;
