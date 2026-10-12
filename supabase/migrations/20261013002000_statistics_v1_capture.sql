-- PREPARED, NOT EXECUTED. Capture functions never mutate operational/financial values.
create function private.statistics_bump(p_business uuid) returns void language sql security definer
set search_path=pg_catalog,public as $$
  insert into public.business_statistics_state(business_id)
  select p_business where exists(select 1 from public.businesses where id=p_business)
  on conflict(business_id) do update set revision=public.business_statistics_state.revision+1;
$$;
revoke all on function private.statistics_bump(uuid) from public,anon,authenticated,service_role;

create function private.statistics_source_items(p_order uuid,p_business uuid) returns jsonb language sql stable
set search_path=pg_catalog,public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'line_key',i.id,'parent_line_key',i.parent_order_item_id,'item_kind',i.item_kind,
    'quantity',i.quantity,'unit_price',i.unit_price,'gross',i.quantity*i.unit_price,
    'product_identity',coalesce(s.product_identity,case when p.business_id=p_business then i.product_id end),
    'product_name',coalesce(s.product_name,i.product_name),'category_identity',s.category_identity,'category_name',s.category_name,
    'source_valid',(i.product_id is null or p.business_id=p_business) and
      (i.parent_order_item_id is null or exists(select 1 from public.order_items parent where parent.id=i.parent_order_item_id and parent.order_id=p_order and parent.item_kind='product'))
  ) order by i.id),'[]'::jsonb)
  from public.order_items i join public.orders o on o.id=i.order_id and o.business_id=p_business
  left join public.order_item_statistics_snapshots s on s.source_item_id=i.id and s.active and s.business_id=p_business
  left join public.products p on p.id=i.product_id where i.order_id=p_order and (current_user='postgres' or private.statistics_can_read(p_business));
$$;
revoke all on function private.statistics_source_items(uuid,uuid) from public,anon,authenticated,service_role;

create function private.statistics_source_digest(p_items jsonb) returns text language sql immutable
set search_path=pg_catalog as $$
  select md5(coalesce(jsonb_agg(jsonb_build_object('id',x->'line_key','parent',x->'parent_line_key','kind',x->'item_kind','quantity',x->'quantity','price',x->'unit_price','identity',x->'product_identity') order by x->>'line_key'),'[]'::jsonb)::text)
  from jsonb_array_elements(p_items) x;
$$;
revoke all on function private.statistics_source_digest(jsonb) from public,anon,authenticated,service_role;

create function private.statistics_item_changed() returns trigger language plpgsql security definer
set search_path=pg_catalog,public,private as $$
declare v_order uuid; v_business uuid; v_product public.products%rowtype; v_category text; v_generation bigint;
begin
  v_order:=case when tg_op='DELETE' then old.order_id else new.order_id end;
  select business_id into v_business from public.orders where id=v_order;
  if v_business is null then return null; end if;
  if tg_op='UPDATE' and new.order_id is distinct from old.order_id then
    raise exception 'STATISTICS_LINE_ORDER_IMMUTABLE' using errcode='23514';
  end if;
  if tg_op='INSERT' or (tg_op='UPDATE' and new.product_id is not null and new.product_id is distinct from old.product_id) then
    if new.product_id is not null then
      select * into v_product from public.products where id=new.product_id and business_id=v_business;
      if not found then raise exception 'STATISTICS_ITEM_TENANT_MISMATCH' using errcode='23514'; end if;
      select name into v_category from public.categories where id=v_product.category_id and business_id=v_business;
    end if;
    if new.parent_order_item_id is not null and not exists(select 1 from public.order_items where id=new.parent_order_item_id and order_id=v_order and item_kind='product') then
      raise exception 'STATISTICS_PARENT_ORDER_MISMATCH' using errcode='23514';
    end if;
    select coalesce(max(generation),0)+1 into v_generation from public.order_item_statistics_snapshots where source_item_id=new.id;
    update public.order_item_statistics_snapshots set active=false where source_item_id=new.id and active;
    insert into public.order_item_statistics_snapshots(source_item_id,order_id,business_id,generation,product_identity,product_name,category_identity,category_name,source_kind)
    values(new.id,v_order,v_business,v_generation,new.product_id,new.product_name,v_product.category_id,v_category,
      case when new.product_id is null then 'identity_unknown' when tg_op='INSERT' then 'line_insert' else 'identity_replacement' end);
  end if;
  -- SET NULL caused by catalog deletion preserves historical identity; source digest also ignores catalog labels.
  if tg_op='DELETE' or tg_op='INSERT' or (tg_op='UPDATE' and
    (new.quantity,new.unit_price,new.item_kind,new.parent_order_item_id) is distinct from
    (old.quantity,old.unit_price,old.item_kind,old.parent_order_item_id)) or
    (tg_op='UPDATE' and new.product_id is not null and new.product_id is distinct from old.product_id) then
    update public.order_statistics_completions set composition_conflict=true where order_id=v_order and active;
  end if;
  return null;
end;
$$;
revoke all on function private.statistics_item_changed() from public,anon,authenticated,service_role;
create trigger statistics_v1_item_capture after insert or update or delete on public.order_items
for each row execute function private.statistics_item_changed();

create function private.statistics_session_changed() returns trigger language plpgsql security definer
set search_path=pg_catalog,public,private as $$
declare v_timezone text;
begin
  if tg_op='INSERT' then
    select timezone into v_timezone from public.business_settings where business_id=new.business_id;
    insert into public.store_session_statistics_snapshots(session_id,business_id,opened_at,timezone,commercial_date,observed_closed_at,source_quality)
    values(new.id,new.business_id,new.opened_at,v_timezone,case when v_timezone is not null then (new.opened_at at time zone v_timezone)::date end,new.closed_at,
      case when new.closed_at<new.opened_at then 'conflict' when v_timezone is not null then 'exact' else 'unavailable' end);
  else
    if (new.business_id,new.opened_at) is distinct from (old.business_id,old.opened_at) then
      update public.store_session_statistics_snapshots set source_quality='conflict' where session_id=new.id;
      update public.order_statistics_completions set date_conflict=true where session_key=new.id and active;
    else
      update public.store_session_statistics_snapshots set observed_closed_at=new.closed_at where session_id=new.id;
      if new.closed_at is not null then
        if new.closed_at<new.opened_at then update public.store_session_statistics_snapshots set source_quality='conflict' where session_id=new.id; end if;
        update public.order_statistics_completions set date_conflict=true where session_key=new.id and active and completed_at>new.closed_at;
      end if;
    end if;
  end if;
  return null;
end;
$$;
revoke all on function private.statistics_session_changed() from public,anon,authenticated,service_role;
create trigger statistics_v1_session_capture after insert or update on public.store_sessions
for each row execute function private.statistics_session_changed();

create function private.statistics_agreement_changed() returns trigger language plpgsql security definer
set search_path=pg_catalog,public,private as $$
declare v_business uuid; v_order uuid;
begin
  if tg_op='UPDATE' and new.agreed_total is not distinct from old.agreed_total then return null; end if;
  v_business:=case when tg_op='DELETE' then old.business_id else new.business_id end;
  v_order:=case when tg_op='DELETE' then old.order_id else new.order_id end;
  -- Financial writers already own the financial row. Never lock orders or sessions here.
  update public.order_statistics_completions set monetary_conflict=true where order_id=v_order and active;
  return null;
end;
$$;
revoke all on function private.statistics_agreement_changed() from public,anon,authenticated,service_role;
create trigger statistics_v1_agreement_capture after insert or update or delete on public.order_financials
for each row execute function private.statistics_agreement_changed();

create function private.statistics_order_changed() returns trigger language plpgsql security definer
set search_path=pg_catalog,public,private as $$
declare v_items jsonb; v_session record; v_timezone text; v_now timestamptz; v_agreed numeric;
  v_evidence uuid; v_gross numeric; v_units bigint; v_valid boolean; v_cycle bigint; v_id uuid; v_reconciled boolean;
begin
  -- Inserts are not proof of a historical completion; record coverage start, not an invented date.
  if tg_op='INSERT' then return null; end if;
  if new.status is not distinct from old.status then return null; end if;
  if old.status='completed' then
    update public.order_statistics_completions set active=false,invalidated_at=clock_timestamp(),invalidation_reason=new.status
    where order_id=new.id and active;
  end if;
  if new.status='completed' then
    -- The source UPDATE already serializes this order. NO FOR UPDATE on financials or items.
    select s.id,s.opened_at,snap.timezone,snap.commercial_date into v_session
    from public.store_sessions s join public.store_session_statistics_snapshots snap on snap.session_id=s.id and snap.business_id=s.business_id
    where s.business_id=new.business_id and s.status='open' and s.closed_at is null and snap.source_quality='exact' and s.opened_at=snap.opened_at
    for share of s;
    v_now:=clock_timestamp();
    select timezone into v_timezone from public.business_settings where business_id=new.business_id;
    if v_session.id is not null and v_session.opened_at>v_now then v_session.id:=null; end if;
    -- One statement freezes monetary agreement AND complete line composition at one MVCC snapshot.
    select f.agreed_total,private.statistics_source_items(new.id,new.business_id) into v_agreed,v_items
    from (values(1)) anchor(n) left join public.order_financials f on f.order_id=new.id and f.business_id=new.business_id;
    select sum((x->>'gross')::numeric),sum(case when x->>'item_kind'='product' then (x->>'quantity')::bigint else 0 end),bool_and((x->>'source_valid')::boolean)
      into v_gross,v_units,v_valid from jsonb_array_elements(v_items) x;
    v_valid:=coalesce(v_valid,false) and new.composition_status::text='itemized';
    select e.id into v_evidence from public.finance_audit_events e where e.business_id=new.business_id and e.entity_id=new.id
      and e.entity_type='order_financials' and e.event_type='order_financials_initialized' and e.payload->>'mode'='copy_total_price'
      and case when jsonb_typeof(e.payload->'agreed_total')='number' then (e.payload->>'agreed_total')::numeric end=v_agreed
      and not exists(select 1 from public.finance_audit_events changed where changed.business_id=new.business_id and changed.entity_id=new.id and changed.event_type='order_agreed_total_changed')
      order by e.created_at,e.id limit 1;
    v_reconciled:=v_valid and v_agreed is not null and v_evidence is not null and v_agreed=v_gross and v_gross=new.total_price;
    select coalesce(max(cycle),0)+1 into v_cycle from public.order_statistics_completions where order_id=new.id;
    insert into public.order_statistics_completions(business_id,order_id,cycle,completed_at,session_id,session_key,session_opened_at,timezone,commercial_date,date_kind,agreed_total,products_net,delivery,breakdown_source,agreement_evidence_id,composition_status,composition_digest,gross_products,main_units,composition_conflict)
    values(new.business_id,new.id,v_cycle,v_now,v_session.id,v_session.id,v_session.opened_at,
      case when v_session.id is not null then v_session.timezone else v_timezone end,
      case when v_session.id is not null then v_session.commercial_date when v_timezone is not null then (v_now at time zone v_timezone)::date end,
      case when v_session.id is not null then 'verified_session' when v_timezone is not null then 'outside_session' else 'missing_timezone' end,
      v_agreed,case when v_reconciled then v_agreed end,case when v_reconciled then 0 end,
      case when v_agreed is null then 'missing_agreement' when v_reconciled then 'copy_total_price' else 'unresolved' end,
      v_evidence,new.composition_status::text,private.statistics_source_digest(v_items),v_gross,case when v_valid then v_units end,not v_valid)
    returning id into v_id;
    if v_valid then
      insert into public.order_statistics_completion_items(completion_id,business_id,line_key,parent_line_key,product_identity,product_name,category_identity,category_name,item_kind,quantity,unit_price,gross,net_amount)
      select v_id,new.business_id,x.line_key,x.parent_line_key,x.product_identity,x.product_name,x.category_identity,x.category_name,x.item_kind,x.quantity,x.unit_price,x.gross,
        case when v_reconciled then x.gross end
      from jsonb_to_recordset(v_items) as x(line_key uuid,parent_line_key uuid,product_identity uuid,product_name text,category_identity uuid,category_name text,item_kind text,quantity bigint,unit_price numeric,gross numeric);
    end if;
  end if;
  return null;
end;
$$;
revoke all on function private.statistics_order_changed() from public,anon,authenticated,service_role;
create trigger statistics_v1_order_capture after insert or update of status on public.orders
for each row execute function private.statistics_order_changed();

-- Never hold the per-business revision lock before create_order finishes stock work.
-- Deferred revision is committed atomically with facts; no operation follows it in our helpers.
create function private.statistics_revision_deferred() returns trigger language plpgsql security definer
set search_path=pg_catalog,public,private as $$
declare v_business uuid;
begin
  if tg_table_name='order_items' then
    select business_id into v_business from public.orders where id=case when tg_op='DELETE' then old.order_id else new.order_id end;
  else v_business:=case when tg_op='DELETE' then old.business_id else new.business_id end; end if;
  if v_business is not null then perform private.statistics_bump(v_business); end if;
  return null;
end;
$$;
revoke all on function private.statistics_revision_deferred() from public,anon,authenticated,service_role;
create constraint trigger statistics_v1_order_revision after insert or update or delete on public.orders deferrable initially deferred for each row execute function private.statistics_revision_deferred();
create constraint trigger statistics_v1_item_revision after insert or update or delete on public.order_items deferrable initially deferred for each row execute function private.statistics_revision_deferred();
create constraint trigger statistics_v1_financial_revision after insert or update or delete on public.order_financials deferrable initially deferred for each row execute function private.statistics_revision_deferred();
create constraint trigger statistics_v1_session_revision after insert or update or delete on public.store_sessions deferrable initially deferred for each row execute function private.statistics_revision_deferred();

-- Exact proportional allocation for an EXPLICITLY IDENTIFIED product-net input.
-- Not a producer or a silent interpretation of the agreement/composition difference.
create function private.statistics_allocate_products(p_net numeric,p_lines jsonb) returns jsonb language plpgsql immutable
set search_path=pg_catalog as $$
declare v_total numeric; v_result jsonb;
begin
  if p_net is null or p_net<0 or p_net<>round(p_net,2) or p_net in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) then raise exception 'INVALID_PRODUCT_NET'; end if;
  if p_lines is null or jsonb_typeof(p_lines)<>'array' then raise exception 'INVALID_ALLOCATION_LINES'; end if;
  if exists(select 1 from jsonb_array_elements(p_lines) x where jsonb_typeof(x)<>'object' or x->>'gross' is null or x->>'gross' !~ '^[0-9]+([.][0-9]{1,2})?$' or x->>'id' is null or x->>'id'='') then raise exception 'INVALID_ALLOCATION_LINE'; end if;
  if (select count(*) from jsonb_array_elements(p_lines))<>(select count(distinct x->>'id') from jsonb_array_elements(p_lines) x) then raise exception 'DUPLICATE_ALLOCATION_ID'; end if;
  select coalesce(sum((x->>'gross')::numeric),0) into v_total from jsonb_array_elements(p_lines) x;
  if v_total=0 and p_net>0 then raise exception 'NO_DISTRIBUTION_BASE'; end if;
  with weights as (select x->>'id' id,(x->>'gross')::numeric*100 weight from jsonb_array_elements(p_lines) x),
  floors as (select *,case when v_total=0 then 0 else floor(p_net*100*weight/(v_total*100)) end base,
    case when v_total=0 then 0 else mod(p_net*100*weight,v_total*100) end remainder from weights),
  ranked as (select *,row_number() over(order by remainder desc,id collate "C") rank,p_net*100-sum(base) over() residual from floors)
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'net',((base+case when rank<=residual then 1 else 0 end)/100)::numeric(30,2)::text) order by id collate "C"),'[]'::jsonb) into v_result from ranked;
  return v_result;
end;
$$;
revoke all on function private.statistics_allocate_products(numeric,jsonb) from public,anon,authenticated,service_role;
