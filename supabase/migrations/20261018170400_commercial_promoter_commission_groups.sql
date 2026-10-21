-- B1: promoter-owned commission groups. Reads stored terms and rows. Does not accrue.

create or replace function commercial.list_own_commission_groups()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commercial, public
as $$
declare
  v_promoter uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  return jsonb_build_object(
    'ok', true,
    'businesses', coalesce((
      select jsonb_agg(grouped.group_row order by grouped.group_row->>'display_name')
      from (
        select jsonb_build_object(
          'business_id', business.id,
          'display_name', business.name,
          'max_recurring_slots', terms.max_recurring_slots,
          'setup', (
            select jsonb_build_object(
              'amount_cents', commission.amount_cents,
              'status', commission.status,
              'available_at', commission.available_at,
              'created_at', commission.created_at
            )
            from commercial.promoter_commissions commission
            where commission.conversion_terms_id = terms.id
              and commission.promoter_id = v_promoter
              and commission.right_kind = 'setup'
            order by (commission.status = 'voided'), commission.created_at desc
            limit 1
          ),
          'slots', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'slot', slot_number,
              'commission', (
                select jsonb_build_object(
                  'right_kind', commission.right_kind,
                  'amount_cents', commission.amount_cents,
                  'status', commission.status,
                  'available_at', commission.available_at,
                  'created_at', commission.created_at
                )
                from commercial.promoter_commissions commission
                where commission.conversion_terms_id = terms.id
                  and commission.promoter_id = v_promoter
                  and commission.right_kind = 'recurring'
                  and commission.slot = slot_number
                order by (commission.status = 'voided'), commission.created_at desc
                limit 1
              )
            ) order by slot_number), '[]'::jsonb)
            from generate_series(1, terms.max_recurring_slots) as slot_number
          )
        ) as group_row
        from commercial.conversion_terms terms
        join commercial.opportunity_attributions attribution on attribution.id = terms.attribution_id
        join public.businesses business on business.id = terms.won_business_id
        where attribution.promoter_id = v_promoter
      ) grouped
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.list_own_commission_groups()
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$ select commercial.list_own_commission_groups(); $$;

revoke all on function commercial.list_own_commission_groups() from public, anon, authenticated, service_role;
revoke all on function public.list_own_commission_groups() from public, anon, service_role;
grant execute on function public.list_own_commission_groups() to authenticated;
