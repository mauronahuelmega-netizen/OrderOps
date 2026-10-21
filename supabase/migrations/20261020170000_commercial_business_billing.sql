-- Talo First L9. Read-only billing summary for the business (owner/manager) and
-- fiscal documents issued outside OrderOps and registered by Finance (DT-09).
-- Files live in a private bucket without object policies; downloads use short
-- signed URLs minted server-side after business_fiscal_document_path authorizes.

insert into storage.buckets (id, name, public)
values ('commercial-business-documents', 'commercial-business-documents', false)
on conflict (id) do update set public = false;

create table commercial.business_fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  kind text not null check (kind in ('invoice', 'credit_note', 'receipt')),
  document_number text not null check (length(btrim(document_number)) between 1 and 60),
  issued_on date not null,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'ARS' check (currency = 'ARS'),
  collection_id uuid references commercial.platform_collections (id),
  storage_path text not null unique,
  registered_by uuid not null references commercial.platform_accounts (id),
  registered_at timestamptz not null default pg_catalog.now(),
  voided_at timestamptz,
  voided_by uuid references commercial.platform_accounts (id),
  void_reason text,
  constraint business_fiscal_documents_number_uq unique (business_id, kind, document_number),
  constraint business_fiscal_documents_path_chk check (
    storage_path ~ ('^fiscal/' || business_id::text || '/[A-Za-z0-9][A-Za-z0-9_-]{0,100}\.pdf$')
  ),
  constraint business_fiscal_documents_void_chk check (
    (voided_at is null and voided_by is null and void_reason is null)
    or (voided_at is not null and voided_by is not null and length(btrim(void_reason)) between 8 and 300)
  )
);

alter table commercial.business_fiscal_documents enable row level security;
alter table commercial.business_fiscal_documents force row level security;
revoke all on table commercial.business_fiscal_documents from public, anon, authenticated;
grant select on table commercial.business_fiscal_documents to authenticated;

create policy business_fiscal_documents_select on commercial.business_fiscal_documents
  for select to authenticated
  using (commercial.has_permission('collection.write'));

-- Business whose billing the caller may read: owner (incl. legacy admin), manager.
create or replace function commercial.billing_reader_business()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.business_id
  from public.profiles p
  where p.id = auth.uid()
    and p.business_id is not null
    and p.role in ('owner', 'admin', 'super_admin', 'manager')
$$;

create or replace function commercial.business_billing_summary(p_environment text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_business uuid;
  v_access jsonb;
  v_terms uuid;
  v_link commercial.provider_customer_links%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if p_environment is null or p_environment not in ('sandbox', 'production') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select p.business_id into v_business from public.profiles p where p.id = auth.uid();
  if v_business is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'no_business');
  end if;

  v_access := commercial.business_service_access(v_business, pg_catalog.now());
  if commercial.billing_reader_business() is distinct from v_business then
    return jsonb_build_object(
      'ok', true,
      'restricted', true,
      'allows_orders', coalesce((v_access->>'allows_orders')::boolean, false)
    );
  end if;

  v_terms := nullif(v_access->>'conversion_terms_id', '')::uuid;
  select * into v_link
  from commercial.provider_customer_links
  where won_business_id = v_business and provider = 'talo' and environment = p_environment;

  return jsonb_build_object(
    'ok', true,
    'restricted', false,
    'access', v_access,
    'payment_destination', case
      when v_link.id is null then null
      else jsonb_build_object('cvu', v_link.cvu, 'alias', v_link.alias)
    end,
    'receipts', coalesce((
      select jsonb_agg(recent.row_value order by recent.observed_at desc)
      from (
        select r.observed_at, jsonb_build_object(
          'id', r.id,
          'observed_at', r.observed_at,
          'gross_amount_cents', r.gross_amount_cents,
          'currency', r.currency,
          'status', r.status
        ) as row_value
        from commercial.provider_receipts r
        where r.link_id = v_link.id
        order by r.observed_at desc
        limit 24
      ) recent
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(obligations.row_value order by obligations.sort_key desc)
      from (
        select coalesce(o.period_key, '0000-00-00') as sort_key, jsonb_build_object(
          'obligation_id', o.id,
          'kind', o.kind,
          'period_on', o.period_key,
          'list_price_cents', o.list_price_cents,
          'status', o.status,
          'collections', coalesce((
            select jsonb_agg(jsonb_build_object(
              'status', c.status,
              'gross_cents', c.gross_cents,
              'nominal', c.policy_status = 'nominal',
              'posted_at', c.posted_at,
              'reversed_at', c.reversed_at
            ) order by c.created_at)
            from commercial.platform_collections c
            where c.obligation_id = o.id and c.status in ('posted', 'reversed')
          ), '[]'::jsonb)
        ) as row_value
        from commercial.platform_obligations o
        where v_terms is not null and o.conversion_terms_id = v_terms
      ) obligations
    ), '[]'::jsonb),
    'fiscal_documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'kind', d.kind,
        'document_number', d.document_number,
        'issued_on', d.issued_on,
        'amount_cents', d.amount_cents,
        'currency', d.currency
      ) order by d.issued_on desc, d.registered_at desc)
      from commercial.business_fiscal_documents d
      where d.business_id = v_business and d.voided_at is null
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function commercial.business_fiscal_document_path(p_document_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_business uuid := commercial.billing_reader_business();
  v_path text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if v_business is null or p_document_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'not_found');
  end if;
  select storage_path into v_path
  from commercial.business_fiscal_documents
  where id = p_document_id and business_id = v_business and voided_at is null;
  if v_path is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'not_found');
  end if;
  return jsonb_build_object('ok', true, 'bucket', 'commercial-business-documents', 'path', v_path);
end;
$$;

create or replace function commercial.finance_register_fiscal_document(
  p_business_id uuid,
  p_kind text,
  p_document_number text,
  p_issued_on date,
  p_amount_cents bigint,
  p_collection_id uuid,
  p_storage_path text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid := commercial.finance_guard();
  v_number text := nullif(btrim(coalesce(p_document_number, '')), '');
  v_id uuid;
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_business_id is null or p_kind is null or p_kind not in ('invoice', 'credit_note', 'receipt')
    or v_number is null or length(v_number) > 60 or p_issued_on is null
    or p_amount_cents is null or p_amount_cents <= 0 or p_storage_path is null
    or p_storage_path !~ ('^fiscal/' || p_business_id::text || '/[A-Za-z0-9][A-Za-z0-9_-]{0,100}\.pdf$') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if not exists (select 1 from public.businesses where id = p_business_id) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_collection_id is not null and not exists (
    select 1
    from commercial.platform_collections c
    join commercial.platform_obligations o on o.id = c.obligation_id
    where c.id = p_collection_id and o.won_business_id = p_business_id
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'collection_mismatch');
  end if;
  if exists (
    select 1 from commercial.business_fiscal_documents
    where storage_path = p_storage_path
      or (business_id = p_business_id and kind = p_kind and document_number = v_number)
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'duplicate');
  end if;

  insert into commercial.business_fiscal_documents (
    business_id, kind, document_number, issued_on, amount_cents, collection_id, storage_path, registered_by
  ) values (
    p_business_id, p_kind, v_number, p_issued_on, p_amount_cents, p_collection_id, p_storage_path, v_actor
  ) returning id into v_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'fiscal_document.registered', 'commercial', 'business_fiscal_documents', v_id, v_id,
    jsonb_build_object('business_id', p_business_id, 'kind', p_kind, 'document_number', v_number,
      'amount_cents', p_amount_cents, 'collection_id', p_collection_id)
  );
  return jsonb_build_object('ok', true, 'document_id', v_id);
end;
$$;

create or replace function commercial.finance_void_fiscal_document(p_document_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid := commercial.finance_guard();
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_row commercial.business_fiscal_documents%rowtype;
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_document_id is null or v_reason is null or length(v_reason) not between 8 and 300 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select * into v_row from commercial.business_fiscal_documents where id = p_document_id for update;
  if v_row.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'not_found');
  end if;
  if v_row.voided_at is not null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'already_voided');
  end if;
  update commercial.business_fiscal_documents
  set voided_at = pg_catalog.now(), voided_by = v_actor, void_reason = v_reason
  where id = v_row.id;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'fiscal_document.voided', 'commercial', 'business_fiscal_documents', v_row.id, v_row.id,
    jsonb_build_object('reason', v_reason)
  );
  return jsonb_build_object('ok', true, 'document_id', v_row.id, 'voided', true);
end;
$$;

create or replace function public.business_billing_summary(p_environment text)
returns jsonb language sql stable security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.business_billing_summary(p_environment) $$;

create or replace function public.business_fiscal_document_path(p_document_id uuid)
returns jsonb language sql stable security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.business_fiscal_document_path(p_document_id) $$;

create or replace function public.finance_register_fiscal_document(
  p_business_id uuid, p_kind text, p_document_number text, p_issued_on date,
  p_amount_cents bigint, p_collection_id uuid, p_storage_path text
)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.finance_register_fiscal_document(
  p_business_id, p_kind, p_document_number, p_issued_on, p_amount_cents, p_collection_id, p_storage_path
) $$;

create or replace function public.finance_void_fiscal_document(p_document_id uuid, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.finance_void_fiscal_document(p_document_id, p_reason) $$;

revoke all on function commercial.billing_reader_business() from public, anon, authenticated, service_role;
revoke all on function commercial.business_billing_summary(text) from public, anon, authenticated, service_role;
revoke all on function commercial.business_fiscal_document_path(uuid) from public, anon, authenticated, service_role;
revoke all on function commercial.finance_register_fiscal_document(uuid, text, text, date, bigint, uuid, text) from public, anon, authenticated, service_role;
revoke all on function commercial.finance_void_fiscal_document(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.business_billing_summary(text) from public, anon, service_role;
revoke all on function public.business_fiscal_document_path(uuid) from public, anon, service_role;
revoke all on function public.finance_register_fiscal_document(uuid, text, text, date, bigint, uuid, text) from public, anon, service_role;
revoke all on function public.finance_void_fiscal_document(uuid, text) from public, anon, service_role;
grant execute on function public.business_billing_summary(text) to authenticated;
grant execute on function public.business_fiscal_document_path(uuid) to authenticated;
grant execute on function public.finance_register_fiscal_document(uuid, text, text, date, bigint, uuid, text) to authenticated;
grant execute on function public.finance_void_fiscal_document(uuid, text) to authenticated;
