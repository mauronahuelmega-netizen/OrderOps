-- Talo First L9. Rolls back. Billing summary per role and tenant, fiscal documents registered by Finance.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', ('70707070-7070-4070-8070-7070707070' || lpad(n::text, 2, '0'))::uuid,
  'authenticated', 'authenticated', 'p10bill-' || n || '@local.test', 'local-only', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from generate_series(1, 9) n;
-- 01 superadmin, 02 promoter, 03 finance, 04 owner A, 05 manager A, 06 operator A, 07 viewer A, 08 owner B, 09 support
insert into commercial.platform_accounts (id, user_id, kind) values
  ('70707070-7070-4070-8070-707070707011', '70707070-7070-4070-8070-707070707001', 'internal'),
  ('70707070-7070-4070-8070-707070707012', '70707070-7070-4070-8070-707070707002', 'promoter'),
  ('70707070-7070-4070-8070-707070707013', '70707070-7070-4070-8070-707070707003', 'internal'),
  ('70707070-7070-4070-8070-707070707019', '70707070-7070-4070-8070-707070707009', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('70707070-7070-4070-8070-707070707011', 'superadmin'),
  ('70707070-7070-4070-8070-707070707013', 'finance'),
  ('70707070-7070-4070-8070-707070707019', 'support');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('70707070-7070-4070-8070-707070707021', '70707070-7070-4070-8070-707070707012', 'p10b000021', 'Promotor Billing', 'active');

create function pg_temp.id(p_kind int, p_n int) returns uuid language sql immutable as $$
  select ('70707070-7070-4070-8070-' || lpad(p_kind::text, 10, '0') || lpad(p_n::text, 2, '0'))::uuid
$$;

create function pg_temp.as_user(p_sub text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_sub, true);
end;
$$;

create function pg_temp.business(p_n int, p_started date) returns uuid
language plpgsql as $$
declare v jsonb; v_terms uuid;
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (pg_temp.id(1, p_n), 'Negocio Billing ' || p_n, 'negocio-billing-' || p_n, '54911007070' || lpad(p_n::text, 2, '0'));
  insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
  values (pg_temp.id(2, p_n), 'Lead Billing ' || p_n, 'lead billing ' || p_n, 'promoter');
  insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id)
  values (pg_temp.id(3, p_n), pg_temp.id(2, p_n), 'demo_done', '70707070-7070-4070-8070-707070707012');
  insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason)
  values (pg_temp.id(4, p_n), pg_temp.id(3, p_n), '70707070-7070-4070-8070-707070707021', 'confirmed', 'manual', 'fixture');
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707001');
  v := commercial.win_opportunity(pg_temp.id(3, p_n), pg_temp.id(1, p_n), null);
  v_terms := (v->>'conversion_terms_id')::uuid;
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707003');
  v := public.open_obligation(v_terms, 'setup', null);
  v := commercial.record_collection((v->>'obligation_id')::uuid, 'p10bill-setup-' || p_n, 'posted', 29000000, 'fixture');
  v := public.record_founder_service_start(v_terms, p_started);
  perform pg_temp.as_user('');
  return v_terms;
end;
$$;

create function pg_temp.summary(p_sub text) returns jsonb language plpgsql as $$
declare v jsonb;
begin
  perform pg_temp.as_user(p_sub);
  execute 'set local role authenticated';
  v := public.business_billing_summary('sandbox');
  execute 'reset role';
  perform pg_temp.as_user('');
  return v;
end;
$$;

do $$
declare
  v_today date := commercial.ba_date(now());
  v jsonb;
  v_doc uuid;
  v_setup_collection uuid;
  v_denied boolean;
begin
  perform pg_temp.business(1, v_today - 3);
  perform pg_temp.business(2, ((v_today - 10) - interval '2 months')::date);
  insert into public.profiles (id, business_id, role) values
    ('70707070-7070-4070-8070-707070707004', pg_temp.id(1, 1), 'owner'),
    ('70707070-7070-4070-8070-707070707005', pg_temp.id(1, 1), 'manager'),
    ('70707070-7070-4070-8070-707070707006', pg_temp.id(1, 1), 'operator'),
    ('70707070-7070-4070-8070-707070707007', pg_temp.id(1, 1), 'viewer'),
    ('70707070-7070-4070-8070-707070707008', pg_temp.id(1, 2), 'owner');
  insert into commercial.provider_customer_links (id, won_business_id, provider, environment, external_customer_id, cvu, alias)
  values (pg_temp.id(5, 1), pg_temp.id(1, 1), 'talo', 'sandbox', 'orderops-billing-1', '0000000000000000000001', 'oo0000000001');
  insert into commercial.provider_receipts (link_id, provider, environment, external_customer_id, external_transaction_id, status, observed_at)
  values (pg_temp.id(5, 1), 'talo', 'sandbox', 'orderops-billing-1', 'tx-billing-1', 'received', now());
  select c.id into v_setup_collection
  from commercial.platform_collections c
  join commercial.platform_obligations o on o.id = c.obligation_id
  where o.won_business_id = pg_temp.id(1, 1) and o.kind = 'setup';

  -- Owner and manager see the full summary of their own business.
  v := pg_temp.summary('70707070-7070-4070-8070-707070707004');
  if (v->>'ok')::boolean is not true or (v->>'restricted')::boolean
    or v->'access'->>'state' <> 'active'
    or v->'payment_destination'->>'cvu' <> '0000000000000000000001'
    or v->'payment_destination'->>'alias' <> 'oo0000000001'
    or jsonb_array_length(v->'receipts') <> 1
    or v->'receipts'->0 ? 'review_reason'
    or v->'history'->0->>'kind' <> 'setup'
    or v->'history'->0->'collections'->0->>'status' <> 'posted'
    or jsonb_array_length(v->'fiscal_documents') <> 0 then
    raise exception 'owner summary %', v;
  end if;
  v := pg_temp.summary('70707070-7070-4070-8070-707070707005');
  if (v->>'restricted')::boolean or v->'access'->>'state' <> 'active' then raise exception 'manager summary %', v; end if;

  -- Operator and viewer only get the generic notice.
  v := pg_temp.summary('70707070-7070-4070-8070-707070707006');
  if (v->>'restricted')::boolean is not true or v ? 'access' or v ? 'payment_destination' or (v->>'allows_orders')::boolean is not true then
    raise exception 'operator summary %', v;
  end if;
  v := pg_temp.summary('70707070-7070-4070-8070-707070707007');
  if (v->>'restricted')::boolean is not true or v ? 'receipts' then raise exception 'viewer summary %', v; end if;

  -- Tenant isolation: owner B sees only B (suspended, no CVU in sandbox, no receipts from A).
  v := pg_temp.summary('70707070-7070-4070-8070-707070707008');
  if v->'access'->>'state' <> 'suspended' or v->'payment_destination' <> 'null'::jsonb
    or jsonb_array_length(v->'receipts') <> 0 then
    raise exception 'owner B summary %', v;
  end if;

  -- Accounts without a business profile get nothing.
  v := pg_temp.summary('70707070-7070-4070-8070-707070707003');
  if v->>'commercial_error_code' <> 'no_business' then raise exception 'finance summary %', v; end if;
  v := pg_temp.summary('70707070-7070-4070-8070-707070707002');
  if v->>'commercial_error_code' <> 'no_business' then raise exception 'promoter summary %', v; end if;
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707004');
  if public.business_billing_summary('staging')->>'commercial_error_code' <> 'validation' then raise exception 'environment'; end if;
  perform pg_temp.as_user('');

  -- Only Finance registers fiscal documents.
  foreach v_doc in array array[
    '70707070-7070-4070-8070-707070707001'::uuid, '70707070-7070-4070-8070-707070707002'::uuid,
    '70707070-7070-4070-8070-707070707004'::uuid, '70707070-7070-4070-8070-707070707009'::uuid
  ] loop
    perform pg_temp.as_user(v_doc::text);
    v := public.finance_register_fiscal_document(pg_temp.id(1, 1), 'invoice', 'A-0001-00000001', v_today, 29000000, null,
      'fiscal/' || pg_temp.id(1, 1) || '/a-0001-00000001.pdf');
    if v->>'commercial_error_code' <> 'forbidden' then raise exception 'non-finance registered %', v_doc; end if;
  end loop;

  perform pg_temp.as_user('70707070-7070-4070-8070-707070707003');
  -- Path must be inside the business folder and a single pdf segment.
  v := public.finance_register_fiscal_document(pg_temp.id(1, 1), 'invoice', 'A-0001-00000001', v_today, 29000000, null,
    'fiscal/' || pg_temp.id(1, 2) || '/a-0001-00000001.pdf');
  if v->>'commercial_error_code' <> 'validation' then raise exception 'foreign folder %', v; end if;
  v := public.finance_register_fiscal_document(pg_temp.id(1, 1), 'invoice', 'A-0001-00000001', v_today, 29000000, null,
    'fiscal/' || pg_temp.id(1, 1) || '/../x.pdf');
  if v->>'commercial_error_code' <> 'validation' then raise exception 'traversal %', v; end if;
  v := public.finance_register_fiscal_document(pg_temp.id(1, 1), 'invoice', 'A-0001-00000001', v_today, 29000000, null,
    'fiscal/' || pg_temp.id(1, 1) || '/a.exe');
  if v->>'commercial_error_code' <> 'validation' then raise exception 'extension %', v; end if;
  -- A collection from another business cannot be linked.
  v := public.finance_register_fiscal_document(pg_temp.id(1, 2), 'invoice', 'A-0001-00000009', v_today, 29000000, v_setup_collection,
    'fiscal/' || pg_temp.id(1, 2) || '/a-0001-00000009.pdf');
  if v->>'commercial_error_code' <> 'collection_mismatch' then raise exception 'collection mismatch %', v; end if;

  v := public.finance_register_fiscal_document(pg_temp.id(1, 1), 'invoice', 'A-0001-00000001', v_today, 29000000, v_setup_collection,
    'fiscal/' || pg_temp.id(1, 1) || '/a-0001-00000001.pdf');
  if (v->>'ok')::boolean is not true then raise exception 'register %', v; end if;
  v_doc := (v->>'document_id')::uuid;
  v := public.finance_register_fiscal_document(pg_temp.id(1, 1), 'invoice', 'A-0001-00000001', v_today, 29000000, null,
    'fiscal/' || pg_temp.id(1, 1) || '/otro.pdf');
  if v->>'commercial_error_code' <> 'duplicate' then raise exception 'duplicate number %', v; end if;
  if not exists (select 1 from commercial.audit_events where entity_id = v_doc and action = 'fiscal_document.registered') then
    raise exception 'register audit';
  end if;
  perform pg_temp.as_user('');

  -- Owner A lists it and can resolve its path; owner B and operator A cannot.
  v := pg_temp.summary('70707070-7070-4070-8070-707070707004');
  if jsonb_array_length(v->'fiscal_documents') <> 1 or v->'fiscal_documents'->0 ? 'storage_path' then
    raise exception 'owner docs %', v->'fiscal_documents';
  end if;
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707004');
  v := public.business_fiscal_document_path(v_doc);
  if v->>'path' <> 'fiscal/' || pg_temp.id(1, 1) || '/a-0001-00000001.pdf' or v->>'bucket' <> 'commercial-business-documents' then
    raise exception 'owner path %', v;
  end if;
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707008');
  if public.business_fiscal_document_path(v_doc)->>'commercial_error_code' <> 'not_found' then raise exception 'cross tenant path'; end if;
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707006');
  if public.business_fiscal_document_path(v_doc)->>'commercial_error_code' <> 'not_found' then raise exception 'operator path'; end if;
  perform pg_temp.as_user('');
  if (pg_temp.summary('70707070-7070-4070-8070-707070707008')->'fiscal_documents') <> '[]'::jsonb then raise exception 'cross tenant list'; end if;

  -- Void hides it; history stays.
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707004');
  if public.finance_void_fiscal_document(v_doc, 'emitido por error')->>'commercial_error_code' <> 'forbidden' then raise exception 'owner voided'; end if;
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707003');
  if public.finance_void_fiscal_document(v_doc, 'corto')->>'commercial_error_code' <> 'validation' then raise exception 'short reason'; end if;
  if (public.finance_void_fiscal_document(v_doc, 'emitido por error')->>'ok')::boolean is not true then raise exception 'void'; end if;
  if public.finance_void_fiscal_document(v_doc, 'emitido por error')->>'commercial_error_code' <> 'already_voided' then raise exception 'double void'; end if;
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707004');
  if public.business_fiscal_document_path(v_doc)->>'commercial_error_code' <> 'not_found' then raise exception 'voided path'; end if;
  perform pg_temp.as_user('');
  if (pg_temp.summary('70707070-7070-4070-8070-707070707004')->'fiscal_documents') <> '[]'::jsonb then raise exception 'voided listed'; end if;
  if not exists (select 1 from commercial.business_fiscal_documents where id = v_doc and voided_at is not null) then raise exception 'void row'; end if;

  -- Clients cannot read the table or write it directly.
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707004');
  execute 'set local role authenticated';
  if exists (select 1 from commercial.business_fiscal_documents) then raise exception 'owner reads table'; end if;
  v_denied := false;
  begin
    delete from commercial.business_fiscal_documents;
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'delete allowed'; end if;
  execute 'reset role';
  perform pg_temp.as_user('');
end;
$$;

-- Finance read model for the internal billing screen.
do $$
declare
  v jsonb;
  v_sub text;
begin
  foreach v_sub in array array[
    '70707070-7070-4070-8070-707070707001', '70707070-7070-4070-8070-707070707002',
    '70707070-7070-4070-8070-707070707004', '70707070-7070-4070-8070-707070707009', ''
  ] loop
    perform pg_temp.as_user(v_sub);
    if public.finance_billing_workspace()->>'commercial_error_code' <> 'forbidden' then raise exception 'workspace open to %', v_sub; end if;
  end loop;

  -- A won business whose activation is covered but without a service start is listed for Finance.
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (pg_temp.id(1, 3), 'Negocio Billing 3', 'negocio-billing-3', '5491100707003');
  insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
  values (pg_temp.id(2, 3), 'Lead Billing 3', 'lead billing 3', 'promoter');
  insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id)
  values (pg_temp.id(3, 3), pg_temp.id(2, 3), 'demo_done', '70707070-7070-4070-8070-707070707012');
  insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason)
  values (pg_temp.id(4, 3), pg_temp.id(3, 3), '70707070-7070-4070-8070-707070707021', 'confirmed', 'manual', 'fixture');
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707001');
  v := commercial.win_opportunity(pg_temp.id(3, 3), pg_temp.id(1, 3), null);
  perform pg_temp.as_user('70707070-7070-4070-8070-707070707003');
  v := public.open_obligation((v->>'conversion_terms_id')::uuid, 'setup', null);
  v := commercial.record_collection((v->>'obligation_id')::uuid, 'p10bill-setup-3', 'posted', 29000000, 'fixture');

  v := public.finance_billing_workspace();
  if (v->>'ok')::boolean is not true
    or not (v->'pending_service_starts' @> jsonb_build_array(jsonb_build_object('business_id', pg_temp.id(1, 3))))
    or (v->'pending_service_starts' @> jsonb_build_array(jsonb_build_object('business_id', pg_temp.id(1, 1))))
    or not (v->'businesses' @> jsonb_build_array(jsonb_build_object('id', pg_temp.id(1, 1)), jsonb_build_object('id', pg_temp.id(1, 2))))
    or not (v->'fiscal_documents' @> jsonb_build_array(jsonb_build_object('document_number', 'A-0001-00000001')))
    or jsonb_typeof(v->'reconciliation_receipts') <> 'array'
    or jsonb_typeof(v->'dead_webhooks') <> 'array' then
    raise exception 'finance workspace %', v;
  end if;
  perform pg_temp.as_user('');
end;
$$;

do $$
begin
  if has_function_privilege('anon', 'public.finance_billing_workspace()', 'execute')
    or has_function_privilege('authenticated', 'commercial.finance_billing_workspace()', 'execute') then
    raise exception 'workspace grants';
  end if;
  if has_function_privilege('anon', 'public.business_billing_summary(text)', 'execute')
    or has_function_privilege('anon', 'public.business_fiscal_document_path(uuid)', 'execute')
    or has_function_privilege('anon', 'public.finance_register_fiscal_document(uuid, text, text, date, bigint, uuid, text)', 'execute')
    or has_function_privilege('authenticated', 'commercial.business_billing_summary(text)', 'execute')
    or has_function_privilege('authenticated', 'commercial.billing_reader_business()', 'execute')
    or has_table_privilege('authenticated', 'commercial.business_fiscal_documents', 'insert')
    or has_table_privilege('anon', 'commercial.business_fiscal_documents', 'select')
    or (select public from storage.buckets where id = 'commercial-business-documents') then
    raise exception 'billing grants';
  end if;
end;
$$;

select 'phase10_business_billing: PASS' as result;
rollback;
