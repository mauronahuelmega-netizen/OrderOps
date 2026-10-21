-- Talo First L9. Read model for the internal Finance billing screen. Read-only;
-- every write goes through the existing L7/L9 finance_* RPCs and record_founder_service_start.

create or replace function commercial.finance_billing_workspace()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
begin
  if commercial.finance_guard() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  return jsonb_build_object(
    'ok', true,
    'reconciliation_receipts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'business_id', l.won_business_id,
        'business_name', b.name,
        'environment', r.environment,
        'external_transaction_id', r.external_transaction_id,
        'gross_amount_cents', r.gross_amount_cents,
        'observed_at', r.observed_at,
        'review_reason', r.review_reason,
        'terms_id', (select t.id from commercial.conversion_terms t where t.won_business_id = l.won_business_id
                     and (select count(*) from commercial.conversion_terms t2 where t2.won_business_id = l.won_business_id) = 1)
      ) order by r.observed_at)
      from commercial.provider_receipts r
      join commercial.provider_customer_links l on l.id = r.link_id
      join public.businesses b on b.id = l.won_business_id
      where r.status = 'reconciliation_required'
        and not exists (select 1 from commercial.receipt_resolutions x where x.receipt_id = r.id)
    ), '[]'::jsonb),
    'imputed_receipts', coalesce((
      select jsonb_agg(recent.row_value order by recent.observed_at desc)
      from (
        select r.observed_at, jsonb_build_object(
          'id', r.id,
          'business_name', b.name,
          'external_transaction_id', r.external_transaction_id,
          'gross_amount_cents', r.gross_amount_cents,
          'observed_at', r.observed_at,
          'collection_id', r.collection_id
        ) as row_value
        from commercial.provider_receipts r
        join commercial.provider_customer_links l on l.id = r.link_id
        join public.businesses b on b.id = l.won_business_id
        where r.status = 'imputed'
          and not exists (select 1 from commercial.receipt_resolutions x where x.receipt_id = r.id and x.kind <> 'imputed_manually')
        order by r.observed_at desc
        limit 50
      ) recent
    ), '[]'::jsonb),
    'dead_webhooks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'business_name', b.name,
        'external_transaction_id', i.external_transaction_id,
        'attempts', i.attempts,
        'last_error', i.last_error,
        'last_received_at', i.last_received_at
      ) order by i.last_received_at)
      from commercial.provider_webhook_inbox i
      join commercial.provider_customer_links l on l.id = i.link_id
      join public.businesses b on b.id = l.won_business_id
      where i.status = 'dead'
    ), '[]'::jsonb),
    'reopenable_obligations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id,
        'business_name', b.name,
        'kind', o.kind,
        'period_on', o.period_key
      ) order by b.name, o.period_key)
      from commercial.platform_obligations o
      join public.businesses b on b.id = o.won_business_id
      where o.status = 'satisfied'
        and not exists (select 1 from commercial.platform_collections c where c.obligation_id = o.id and c.status = 'posted')
        and exists (select 1 from commercial.platform_collections c where c.obligation_id = o.id and c.status = 'reversed')
    ), '[]'::jsonb),
    'pending_service_starts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'terms_id', t.id,
        'business_id', t.won_business_id,
        'business_name', b.name
      ) order by b.name)
      from commercial.conversion_terms t
      join public.businesses b on b.id = t.won_business_id
      where commercial.founder_period_covered(t.id, null, 0)
        and not exists (select 1 from commercial.founder_service_starts s where s.conversion_terms_id = t.id)
    ), '[]'::jsonb),
    'businesses', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name) order by b.name)
      from public.businesses b
      where exists (select 1 from commercial.conversion_terms t where t.won_business_id = b.id)
    ), '[]'::jsonb),
    'fiscal_documents', coalesce((
      select jsonb_agg(recent.row_value order by recent.registered_at desc)
      from (
        select d.registered_at, jsonb_build_object(
          'id', d.id,
          'business_name', b.name,
          'kind', d.kind,
          'document_number', d.document_number,
          'issued_on', d.issued_on,
          'amount_cents', d.amount_cents,
          'voided_at', d.voided_at
        ) as row_value
        from commercial.business_fiscal_documents d
        join public.businesses b on b.id = d.business_id
        order by d.registered_at desc
        limit 50
      ) recent
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.finance_billing_workspace()
returns jsonb language sql stable security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.finance_billing_workspace() $$;

revoke all on function commercial.finance_billing_workspace() from public, anon, authenticated, service_role;
revoke all on function public.finance_billing_workspace() from public, anon, service_role;
grant execute on function public.finance_billing_workspace() to authenticated;
