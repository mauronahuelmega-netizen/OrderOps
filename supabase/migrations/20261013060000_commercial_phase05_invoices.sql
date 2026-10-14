-- P05-T07: promoter invoice before a settlement can be paid. No fiscal authority.

create table commercial.promoter_invoices (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references commercial.promoter_settlements (id),
  promoter_id uuid not null references commercial.promoters (id),
  amount_cents bigint not null check (amount_cents >= 0),
  status text not null check (status in ('submitted', 'accepted', 'rejected')),
  document_path text not null,
  reviewed_by uuid references commercial.platform_accounts (id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default pg_catalog.now()
);

alter table commercial.promoter_invoices enable row level security;
alter table commercial.promoter_invoices force row level security;
revoke all on table commercial.promoter_invoices from public, anon, authenticated;
grant select on table commercial.promoter_invoices to authenticated;

create policy promoter_invoices_select on commercial.promoter_invoices
  for select to authenticated
  using (
    commercial.has_permission('collection.write')
    or promoter_id = commercial.current_promoter_id()
  );

create or replace function commercial.submit_invoice(
  p_settlement_id uuid,
  p_amount_cents bigint,
  p_document_path text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_promoter uuid;
  v_status text;
  v_settlement commercial.promoter_settlements%rowtype;
  v_id uuid;
  v_path text := btrim(coalesce(p_document_path, ''));
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select status into v_status from commercial.promoters where id = v_promoter;
  if v_status not in ('active', 'separated') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select * into v_settlement from commercial.promoter_settlements where id = p_settlement_id for update;
  if v_settlement.id is null or v_settlement.promoter_id is distinct from v_promoter or v_settlement.status <> 'approved' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_amount_cents is null or p_amount_cents < 0
     or v_path !~ ('^invoices/' || p_settlement_id::text || '/[^/]+$')
     or position('..' in v_path) > 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  insert into commercial.promoter_invoices (settlement_id, promoter_id, amount_cents, status, document_path)
  values (p_settlement_id, v_promoter, p_amount_cents, 'submitted', v_path)
  returning id into v_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    (select account_id from commercial.promoters where id = v_promoter),
    'promoter', 'invoice.submitted', 'commercial', 'promoter_invoices', v_id, p_settlement_id,
    jsonb_build_object('amount_cents', p_amount_cents, 'document_path', v_path)
  );

  return jsonb_build_object('ok', true, 'invoice_id', v_id, 'settlement_status', v_settlement.status);
end;
$$;

create or replace function commercial.review_invoice(p_invoice_id uuid, p_decision text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_invoice commercial.promoter_invoices%rowtype;
  v_total bigint;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_decision not in ('accepted', 'rejected') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select * into v_invoice from commercial.promoter_invoices where id = p_invoice_id for update;
  if v_invoice.id is null or v_invoice.status <> 'submitted' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select total_cents into v_total from commercial.promoter_settlements where id = v_invoice.settlement_id for update;
  if p_decision = 'accepted' and v_invoice.amount_cents is distinct from v_total then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'amount_mismatch');
  end if;
  if p_decision = 'rejected' and (p_reason is null or btrim(p_reason) = '') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  update commercial.promoter_invoices
  set status = p_decision,
      reviewed_by = v_actor,
      reviewed_at = pg_catalog.clock_timestamp(),
      rejection_reason = case when p_decision = 'rejected' then p_reason else null end
  where id = v_invoice.id;

  if p_decision = 'accepted' then
    update commercial.promoter_settlements set status = 'payable' where id = v_invoice.settlement_id;
  end if;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'invoice.reviewed', 'commercial', 'promoter_invoices', v_invoice.id, v_invoice.settlement_id,
    jsonb_build_object('decision', p_decision)
  );

  return jsonb_build_object('ok', true, 'invoice_id', v_invoice.id, 'status', p_decision);
end;
$$;

revoke all on function commercial.submit_invoice(uuid, bigint, text) from public, anon, authenticated, service_role;
revoke all on function commercial.review_invoice(uuid, text, text) from public, anon, authenticated, service_role;

create or replace function public.submit_invoice(p_settlement_id uuid, p_amount_cents bigint, p_document_path text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.submit_invoice(p_settlement_id, p_amount_cents, p_document_path); $$;

create or replace function public.review_invoice(p_invoice_id uuid, p_decision text, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.review_invoice(p_invoice_id, p_decision, p_reason); $$;

revoke all on function public.submit_invoice(uuid, bigint, text) from public, anon, service_role;
revoke all on function public.review_invoice(uuid, text, text) from public, anon, service_role;
grant execute on function public.submit_invoice(uuid, bigint, text) to authenticated;
grant execute on function public.review_invoice(uuid, text, text) to authenticated;
