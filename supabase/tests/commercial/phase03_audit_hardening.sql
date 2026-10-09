-- Post-audit PHASE-03 hardening (AUD-P03-01..07). Rolls back fixtures.
-- Two-session concurrency uses dblink when the extension is available; otherwise
-- those blocks raise NOTICE and the unique-index / sequential probes still run.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '67676767-6767-4767-8767-676767676701', 'authenticated', 'authenticated', 'phase03-audit-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '67676767-6767-4767-8767-676767676702', 'authenticated', 'authenticated', 'phase03-audit-admin2@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '67676767-6767-4767-8767-676767676706', 'authenticated', 'authenticated', 'phase03-audit-commercial@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '67676767-6767-4767-8767-676767676703', 'authenticated', 'authenticated', 'phase03-audit-prom-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '67676767-6767-4767-8767-676767676704', 'authenticated', 'authenticated', 'phase03-audit-prom-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '67676767-6767-4767-8767-676767676705', 'authenticated', 'authenticated', 'phase03-audit-prom-c@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('67676767-6767-4767-8767-676767676711', '67676767-6767-4767-8767-676767676701', 'internal'),
  ('67676767-6767-4767-8767-676767676712', '67676767-6767-4767-8767-676767676702', 'internal'),
  ('67676767-6767-4767-8767-676767676716', '67676767-6767-4767-8767-676767676706', 'internal'),
  ('67676767-6767-4767-8767-676767676713', '67676767-6767-4767-8767-676767676703', 'promoter'),
  ('67676767-6767-4767-8767-676767676714', '67676767-6767-4767-8767-676767676704', 'promoter'),
  ('67676767-6767-4767-8767-676767676715', '67676767-6767-4767-8767-676767676705', 'promoter');

insert into commercial.internal_role_assignments (account_id, role) values
  ('67676767-6767-4767-8767-676767676711', 'superadmin'),
  ('67676767-6767-4767-8767-676767676712', 'superadmin'),
  ('67676767-6767-4767-8767-676767676716', 'commercial');

insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('67676767-6767-4767-8767-676767676721', '67676767-6767-4767-8767-676767676713', 'paudita01', 'Ana Audit', 'active'),
  ('67676767-6767-4767-8767-676767676722', '67676767-6767-4767-8767-676767676714', 'pauditb01', 'Luis Audit', 'active'),
  ('67676767-6767-4767-8767-676767676723', '67676767-6767-4767-8767-676767676715', 'pauditc01', 'Carla Audit', 'active');

insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('67676767-6767-4767-8767-676767676731', 'Pan Audit', 'pan audit', 'promoter');

insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
values ('67676767-6767-4767-8767-676767676741', '67676767-6767-4767-8767-676767676731', 'new');

insert into commercial.commercial_interactions (
  id, commercial_business_id, opportunity_id, kind, channel, origin, actor_account_id, occurred_at
) values (
  '67676767-6767-4767-8767-676767676751', '67676767-6767-4767-8767-676767676731',
  '67676767-6767-4767-8767-676767676741', 'meeting', 'web', 'paudita01',
  '67676767-6767-4767-8767-676767676713', now()
);

-- AUD-P03-04: authenticated cannot execute the internal helper
set local role authenticated;
do $$
begin
  begin
    perform commercial.promoter_has_substantive_activity(
      '67676767-6767-4767-8767-676767676741',
      '67676767-6767-4767-8767-676767676721'
    );
    raise exception 'authenticated executed promoter_has_substantive_activity';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Unique indexes still present
do $$
begin
  if to_regclass('commercial.attribution_claims_one_provisional_promoter_idx') is null then
    raise exception 'missing provisional claim unique index';
  end if;
  if to_regclass('commercial.opportunity_attributions_one_confirmed_idx') is null then
    raise exception 'missing confirmed attribution unique index';
  end if;
end;
$$;

-- AUD-P03-01: sequential idempotency + cross-promoter isolation
do $$
declare
  v_first jsonb;
  v_again jsonb;
  v_other jsonb;
  v_count int;
begin
  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676703', true);
  v_first := commercial.create_claim(
    '67676767-6767-4767-8767-676767676731',
    '67676767-6767-4767-8767-676767676741'
  );
  v_again := commercial.create_claim(
    '67676767-6767-4767-8767-676767676731',
    '67676767-6767-4767-8767-676767676741'
  );
  if v_first->>'duplicate' is distinct from 'false'
    or v_again->>'duplicate' is distinct from 'true'
    or v_first->>'claim_id' is distinct from v_again->>'claim_id' then
    raise exception 'claim race-safe idempotency % / %', v_first, v_again;
  end if;

  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676704', true);
  v_other := commercial.create_claim(
    '67676767-6767-4767-8767-676767676731',
    '67676767-6767-4767-8767-676767676741'
  );
  if v_other->>'ok' is distinct from 'true'
    or v_other->>'claim_id' is not distinct from v_first->>'claim_id' then
    raise exception 'cross-promoter claim isolation failed %', v_other;
  end if;

  select count(*) into v_count
  from commercial.attribution_claims
  where commercial_business_id = '67676767-6767-4767-8767-676767676731'
    and status = 'provisional';
  if v_count <> 2 then
    raise exception 'expected two provisional claims, got %', v_count;
  end if;
end;
$$;

-- AUD-P03-01 concurrency with two connections (optional dblink)
do $$
declare
  v_a text;
  v_b text;
  v_count int;
begin
  if not exists (select 1 from pg_extension where extname = 'dblink') then
    raise notice 'AUD-P03-01 two-session concurrency SKIPPED: dblink not installed';
    return;
  end if;

  delete from commercial.attribution_claims
  where commercial_business_id = '67676767-6767-4767-8767-676767676731';

  perform dblink_connect(
    'audit_claim_a',
    'dbname=' || current_database() || ' user=' || current_user
  );
  perform dblink_connect(
    'audit_claim_b',
    'dbname=' || current_database() || ' user=' || current_user
  );

  perform dblink_exec('audit_claim_a', 'begin');
  perform dblink_exec('audit_claim_b', 'begin');
  perform dblink_exec(
    'audit_claim_a',
    $sql$select set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676703', true)$sql$
  );
  perform dblink_exec(
    'audit_claim_b',
    $sql$select set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676703', true)$sql$
  );

  select r into v_a from dblink(
    'audit_claim_a',
    $sql$select commercial.create_claim(
      '67676767-6767-4767-8767-676767676731',
      '67676767-6767-4767-8767-676767676741'
    )::text$sql$
  ) as t(r text);
  select r into v_b from dblink(
    'audit_claim_b',
    $sql$select commercial.create_claim(
      '67676767-6767-4767-8767-676767676731',
      '67676767-6767-4767-8767-676767676741'
    )::text$sql$
  ) as t(r text);

  perform dblink_exec('audit_claim_a', 'commit');
  perform dblink_exec('audit_claim_b', 'commit');
  perform dblink_disconnect('audit_claim_a');
  perform dblink_disconnect('audit_claim_b');

  select count(*) into v_count
  from commercial.attribution_claims
  where commercial_business_id = '67676767-6767-4767-8767-676767676731'
    and promoter_id = '67676767-6767-4767-8767-676767676721'
    and status = 'provisional';
  if v_count <> 1 then
    raise exception 'concurrent create_claim left % provisional rows (a=% b=%)', v_count, v_a, v_b;
  end if;
exception
  when others then
    begin perform dblink_disconnect('audit_claim_a'); exception when others then null; end;
    begin perform dblink_disconnect('audit_claim_b'); exception when others then null; end;
    raise;
end;
$$;

-- AUD-P03-02: second confirmation is attribution_exists; self-confirm and commercial blocked
do $$
declare
  v_first jsonb;
  v_second jsonb;
  v_self jsonb;
  v_commercial jsonb;
begin
  delete from commercial.opportunity_attributions
  where opportunity_id = '67676767-6767-4767-8767-676767676741';

  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676701', true);
  v_first := commercial.confirm_attribution(
    '67676767-6767-4767-8767-676767676741',
    '67676767-6767-4767-8767-676767676721',
    null,
    'confirmacion audit'
  );
  if v_first->>'ok' is distinct from 'true' then
    raise exception 'first confirm returned %', v_first;
  end if;

  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676702', true);
  v_second := commercial.confirm_attribution(
    '67676767-6767-4767-8767-676767676741',
    '67676767-6767-4767-8767-676767676722',
    null,
    'segunda confirmacion'
  );
  if v_second->>'commercial_error_code' is distinct from 'attribution_exists' then
    raise exception 'second confirm returned %', v_second;
  end if;

  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676703', true);
  v_self := commercial.confirm_attribution(
    '67676767-6767-4767-8767-676767676741',
    '67676767-6767-4767-8767-676767676721',
    null,
    'yo'
  );
  if v_self->>'commercial_error_code' is distinct from 'cannot_self_confirm' then
    raise exception 'self confirm returned %', v_self;
  end if;

  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676706', true);
  v_commercial := commercial.confirm_attribution(
    '67676767-6767-4767-8767-676767676741',
    '67676767-6767-4767-8767-676767676722',
    null,
    'comercial'
  );
  if v_commercial->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'commercial confirm returned %', v_commercial;
  end if;
end;
$$;

-- AUD-P03-02 concurrency with two authorized sessions (optional dblink)
do $$
declare
  v_a text;
  v_b text;
  v_count int;
  v_opp uuid := '67676767-6767-4767-8767-676767676742';
begin
  if not exists (select 1 from pg_extension where extname = 'dblink') then
    raise notice 'AUD-P03-02 two-session concurrency SKIPPED: dblink not installed';
    return;
  end if;

  insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
  values (v_opp, '67676767-6767-4767-8767-676767676731', 'new');
  insert into commercial.commercial_interactions (
    commercial_business_id, opportunity_id, kind, channel, origin, actor_account_id, occurred_at
  ) values
    (
      '67676767-6767-4767-8767-676767676731', v_opp, 'meeting', 'web', 'paudita01',
      '67676767-6767-4767-8767-676767676713', now()
    ),
    (
      '67676767-6767-4767-8767-676767676731', v_opp, 'meeting', 'web', 'pauditb01',
      '67676767-6767-4767-8767-676767676714', now()
    );

  perform dblink_connect(
    'audit_attr_a',
    'dbname=' || current_database() || ' user=' || current_user
  );
  perform dblink_connect(
    'audit_attr_b',
    'dbname=' || current_database() || ' user=' || current_user
  );
  perform dblink_exec('audit_attr_a', 'begin');
  perform dblink_exec('audit_attr_b', 'begin');
  perform dblink_exec(
    'audit_attr_a',
    $sql$select set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676701', true)$sql$
  );
  perform dblink_exec(
    'audit_attr_b',
    $sql$select set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676702', true)$sql$
  );

  select r into v_a from dblink(
    'audit_attr_a',
    format(
      $sql$select commercial.confirm_attribution(%L::uuid, %L::uuid, null, 'race a')::text$sql$,
      v_opp, '67676767-6767-4767-8767-676767676721'
    )
  ) as t(r text);
  select r into v_b from dblink(
    'audit_attr_b',
    format(
      $sql$select commercial.confirm_attribution(%L::uuid, %L::uuid, null, 'race b')::text$sql$,
      v_opp, '67676767-6767-4767-8767-676767676722'
    )
  ) as t(r text);

  perform dblink_exec('audit_attr_a', 'commit');
  perform dblink_exec('audit_attr_b', 'commit');
  perform dblink_disconnect('audit_attr_a');
  perform dblink_disconnect('audit_attr_b');

  select count(*) into v_count
  from commercial.opportunity_attributions
  where opportunity_id = v_opp and status = 'confirmed';
  if v_count <> 1 then
    raise exception 'concurrent confirm left % confirmed (a=% b=%)', v_count, v_a, v_b;
  end if;
exception
  when others then
    begin perform dblink_disconnect('audit_attr_a'); exception when others then null; end;
    begin perform dblink_disconnect('audit_attr_b'); exception when others then null; end;
    raise;
end;
$$;

-- AUD-P03-05: linked party ok; unlinked party dispute_scope; archived opportunity validation
do $$
declare
  v_open jsonb;
  v_bad jsonb;
  v_archived jsonb;
  v_arch_opp uuid := '67676767-6767-4767-8767-676767676743';
begin
  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676701', true);

  v_open := commercial.open_dispute(
    '67676767-6767-4767-8767-676767676741',
    array['67676767-6767-4767-8767-676767676721']::uuid[],
    'parte vinculada'
  );
  if v_open->>'ok' is distinct from 'true' then
    raise exception 'linked open_dispute returned %', v_open;
  end if;

  v_bad := commercial.open_dispute(
    '67676767-6767-4767-8767-676767676741',
    array['67676767-6767-4767-8767-676767676723']::uuid[],
    'parte sin vinculo'
  );
  if v_bad->>'commercial_error_code' is distinct from 'dispute_scope' then
    raise exception 'unlinked party returned %', v_bad;
  end if;

  insert into commercial.commercial_opportunities (id, commercial_business_id, stage, archived_at)
  values (v_arch_opp, '67676767-6767-4767-8767-676767676731', 'lost', now());
  v_archived := commercial.open_dispute(
    v_arch_opp,
    array['67676767-6767-4767-8767-676767676721']::uuid[],
    'archivada'
  );
  if v_archived->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'archived opportunity dispute returned %', v_archived;
  end if;

  -- Open uniqueness not invented: a second open dispute on the same opportunity is still allowed
  -- until BLK-CRM-02 is decided. Documented expectation, not a uniqueness assertion.
  v_open := commercial.open_dispute(
    '67676767-6767-4767-8767-676767676741',
    array['67676767-6767-4767-8767-676767676721']::uuid[],
    'segundo expediente abierto permitido por contrato pendiente'
  );
  if v_open->>'ok' is distinct from 'true' then
    raise exception 'second open dispute unexpectedly failed %', v_open;
  end if;
end;
$$;

-- AUD-P03-03: evidence_path validation + storage deny-by-default
do $$
declare
  v_ok jsonb;
  v_bad jsonb;
  v_public boolean;
  v_policies int;
  v_promoter uuid := '67676767-6767-4767-8767-676767676721';
begin
  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676701', true);

  v_ok := commercial.submit_promoter_evidence(
    v_promoter, 'identity', 'verifications/' || v_promoter::text || '/doc-ok.pdf'
  );
  if v_ok->>'ok' is distinct from 'true' then
    raise exception 'valid evidence_path returned %', v_ok;
  end if;

  v_bad := commercial.submit_promoter_evidence(
    v_promoter, 'identity', 'commercial-documents/fixture/identity'
  );
  if v_bad->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'legacy bucket path returned %', v_bad;
  end if;

  v_bad := commercial.submit_promoter_evidence(
    v_promoter, 'identity', 'verifications/' || v_promoter::text || '/nested/bad.pdf'
  );
  if v_bad->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'nested evidence_path returned %', v_bad;
  end if;

  v_bad := commercial.submit_promoter_evidence(
    v_promoter, 'identity', '../secrets/x'
  );
  if v_bad->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'traversal evidence_path returned %', v_bad;
  end if;

  select public into v_public from storage.buckets where id = 'commercial-documents';
  if v_public is distinct from false then
    raise exception 'commercial-documents bucket is public';
  end if;

  select count(*) into v_policies
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and (
      qual::text ilike '%commercial-documents%'
      or with_check::text ilike '%commercial-documents%'
      or policyname ilike '%commercial%document%'
    );
  if v_policies <> 0 then
    raise exception 'unexpected storage.objects policies for commercial-documents: %', v_policies;
  end if;
end;
$$;

-- AUD-P03-07 / separation guard: transition cannot mark separated
do $$
declare
  v_sep jsonb;
begin
  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676701', true);
  v_sep := commercial.transition_promoter_status(
    '67676767-6767-4767-8767-676767676721',
    'separated'
  );
  if v_sep->>'ok' is not distinct from 'true' then
    raise exception 'transition_promoter_status allowed separated %', v_sep;
  end if;
end;
$$;

-- Bank secrecy still holds for the other promoter
do $$
declare
  v_read jsonb;
begin
  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676701', true);
  perform commercial.replace_bank_account(
    '67676767-6767-4767-8767-676767676721',
    '0000003100000000000099',
    'Ana Audit',
    'fixture audit'
  );
  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676704', true);
  v_read := commercial.read_own_bank();
  if v_read::text like '%0000003100000000000099%' then
    raise exception 'bank secrecy leaked to other promoter %', v_read;
  end if;
end;
$$;

rollback;
