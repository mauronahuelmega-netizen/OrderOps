-- ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-APPEND-LOCK-AUTHORITY-FIX-1
-- Final complete category-order DB contract.
-- Supersedes BEFORE APPLY (remote history 0):
--   20260917182047… SHA 4bb35bec… (POSITION_AUTHORITY_BYPASS)
--   20260917202554… SHA 18ef6307… (APPEND_LOCK_AUTHORITY_FAIL)
-- NOT APPLIED in this phase. Remote apply = next DB-APPLY-1 rerun.
--
-- Contract (ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1):
--   * reuse categories.position (no sort_order / parallel order table)
--   * backfill preserves current loader order:
--       position ASC NULLS LAST, name ASC (+ created_at, id after ambiguity=0)
--   * contiguous 0..n-1 per business; lower first
--   * BEFORE INSERT append for DB-before-app rollout (old Create omits position)
--   * UNIQUE (business_id, position) DEFERRABLE for swap-safe atomic reorder
--   * save_category_display_order(uuid[]) SECURITY DEFINER — exact tenant set
--   * category mutative RLS role-gated like products manageProducts
--   * POSITION WRITE AUTHORITY: authenticated UPDATE only (name);
--     numeric position UPDATE owned exclusively by DEFINER RPC (+ INSERT append trigger)
--   * APPEND LOCK AUTHORITY: append trigger SECURITY DEFINER with internal
--     auth.uid/profile role+tenant checks BEFORE businesses FOR UPDATE;
--     businesses RLS/grants UNCHANGED.

-- ---------------------------------------------------------------------------
-- 1. Backfill safety precondition
-- ---------------------------------------------------------------------------
-- Fail apply if current (business_id, position, name) keys are ambiguous —
-- deployed ORDER BY position NULLS LAST, name ASC would not fully specify order.

do $$
declare
  v_ambiguous integer;
begin
  select count(*)::integer
    into v_ambiguous
  from (
    select 1
    from public.categories
    group by business_id, position, name
    having count(*) > 1
  ) t;

  if v_ambiguous > 0 then
    raise exception 'CATEGORY_ORDER_BACKFILL_AMBIGUOUS_CURRENT_ORDER'
      using errcode = 'P0001',
            detail = format('ambiguous_groups=%s', v_ambiguous);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. DB-side append authority (BEFORE INSERT)
-- ---------------------------------------------------------------------------
-- Old deployed createCategoryAction inserts {business_id, name} only.
-- After position NOT NULL, inserts must still succeed and APPEND.
-- Client-supplied NEW.position is ignored — reorder owns ranks via RPC.
--
-- SECURITY DEFINER (not INVOKER): businesses UPDATE RLS is intentionally
-- admin-only and narrower than manageProducts. INVOKER FOR UPDATE would break
-- owner/manager/super_admin Category Create. Definer owner (postgres / bypassrls)
-- can lock businesses; internal auth.uid + profiles checks run BEFORE that lock.
-- Businesses RLS/grants are NOT modified.

create function public.categories_assign_append_position()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_role text;
  v_profile_business_id uuid;
begin
  -- 1–4: authorize ORIGINAL caller before any privileged businesses lock.
  if v_uid is null then
    raise exception 'CATEGORY_ORDER_APPEND_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  select p.role, p.business_id
    into v_role, v_profile_business_id
  from public.profiles p
  where p.id = v_uid;

  if v_role is null then
    raise exception 'CATEGORY_ORDER_APPEND_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  if v_role in ('owner', 'admin', 'manager') then
    if v_profile_business_id is null
       or v_profile_business_id is distinct from new.business_id then
      raise exception 'CATEGORY_ORDER_APPEND_FORBIDDEN'
        using errcode = '42501';
    end if;
  elsif v_role = 'super_admin' then
    -- Established global Category INSERT path (matches categories INSERT RLS).
    null;
  else
    raise exception 'CATEGORY_ORDER_APPEND_FORBIDDEN'
      using errcode = '42501';
  end if;

  -- 5: ONLY AFTER auth — same businesses mutex as save_category_display_order.
  perform 1
  from public.businesses b
  where b.id = new.business_id
  for update;

  if not found then
    raise exception 'CATEGORY_ORDER_APPEND_BUSINESS_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  -- 6–7: append rank; always override client-supplied NEW.position.
  select coalesce(max(c.position), -1) + 1
    into new.position
  from public.categories c
  where c.business_id = new.business_id;

  return new;
end;
$$;

comment on function public.categories_assign_append_position() is
  'BEFORE INSERT: SECURITY DEFINER append position=max+1. Authorizes auth.uid/profile manageProducts (+ tenant) BEFORE businesses FOR UPDATE. Overrides client position. Businesses RLS unchanged.';

create trigger tr_categories_assign_append_position
  before insert on public.categories
  for each row
  execute function public.categories_assign_append_position();

-- ---------------------------------------------------------------------------
-- 3. Contiguous backfill preserving current visible order
-- ---------------------------------------------------------------------------
-- All merchant categories participate (empty / unavailable-only / archived-only).

with ranked as (
  select
    c.id,
    (row_number() over (
      partition by c.business_id
      order by
        c.position asc nulls last,
        c.name asc,
        c.created_at asc,
        c.id asc
    ) - 1)::integer as new_position
  from public.categories c
)
update public.categories cat
set position = ranked.new_position
from ranked
where cat.id = ranked.id
  and cat.position is distinct from ranked.new_position;

-- ---------------------------------------------------------------------------
-- 4. position NOT NULL (no static DEFAULT 0 — append trigger is authority)
-- ---------------------------------------------------------------------------

alter table public.categories
  alter column position set not null;

-- Existing categories_position_non_negative (NULL OR >= 0) remains valid;
-- NULL paths are unreachable after NOT NULL. Effective invariant: position >= 0.

-- ---------------------------------------------------------------------------
-- 5. Swap-safe unique tenant position
-- ---------------------------------------------------------------------------
-- DEFERRABLE so A↔B swaps inside one transaction do not hit transient uniqueness.

alter table public.categories
  add constraint categories_business_id_position_key
  unique (business_id, position)
  deferrable initially immediate;

-- ---------------------------------------------------------------------------
-- 6. Atomic reorder RPC
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER: multi-row rewrite + SET CONSTRAINTS must not depend on
-- caller RLS for correctness; authorization is enforced inside the function.
-- No p_business_id. No client numeric positions.

create function public.save_category_display_order(
  p_ordered_category_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_profile_business_id uuid;
  v_business_id uuid;
  v_input_count integer;
  v_distinct_count integer;
  v_current_count integer;
  v_overlap_count integer;
begin
  if v_uid is null then
    raise exception 'CATEGORY_ORDER_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  select p.role, p.business_id
    into v_role, v_profile_business_id
  from public.profiles p
  where p.id = v_uid;

  if v_role is null then
    raise exception 'CATEGORY_ORDER_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  -- Mirrors canManageProducts / products mutative RLS allow-list
  -- (20260909040000_products_manage_role_rls.sql).
  if v_role not in ('owner', 'admin', 'manager', 'super_admin') then
    raise exception 'CATEGORY_ORDER_FORBIDDEN'
      using errcode = '42501';
  end if;

  if p_ordered_category_ids is null then
    raise exception 'CATEGORY_ORDER_INVALID_SET'
      using errcode = '22023';
  end if;

  v_input_count := coalesce(cardinality(p_ordered_category_ids), 0);

  if exists (
    select 1
    from unnest(p_ordered_category_ids) as x(id)
    where x.id is null
  ) then
    raise exception 'CATEGORY_ORDER_INVALID_SET'
      using errcode = '22023';
  end if;

  select count(distinct x.id)::integer
    into v_distinct_count
  from unnest(p_ordered_category_ids) as x(id);

  if v_input_count <> v_distinct_count then
    raise exception 'CATEGORY_ORDER_INVALID_SET'
      using errcode = '22023';
  end if;

  -- Tenant derivation (no client business_id).
  if v_role = 'super_admin' and v_profile_business_id is null then
    if v_input_count = 0 then
      raise exception 'CATEGORY_ORDER_INVALID_SET'
        using errcode = '22023';
    end if;

    select c.business_id
      into v_business_id
    from public.categories c
    where c.id = p_ordered_category_ids[1];

    if v_business_id is null then
      raise exception 'CATEGORY_ORDER_STALE_SET'
        using errcode = 'P0001';
    end if;

    if exists (
      select 1
      from unnest(p_ordered_category_ids) as x(id)
      left join public.categories c on c.id = x.id
      where c.id is null
         or c.business_id is distinct from v_business_id
    ) then
      raise exception 'CATEGORY_ORDER_STALE_SET'
        using errcode = 'P0001';
    end if;
  else
    if v_profile_business_id is null then
      raise exception 'CATEGORY_ORDER_FORBIDDEN'
        using errcode = '42501';
    end if;
    v_business_id := v_profile_business_id;
  end if;

  -- Lock order: BUSINESS ROW → CATEGORY ROWS (matches append trigger).
  perform 1
  from public.businesses b
  where b.id = v_business_id
  for update;

  if not found then
    raise exception 'CATEGORY_ORDER_STALE_SET'
      using errcode = 'P0001';
  end if;

  perform 1
  from public.categories c
  where c.business_id = v_business_id
  order by c.id
  for update;

  select count(*)::integer
    into v_current_count
  from public.categories c
  where c.business_id = v_business_id;

  if v_input_count <> v_current_count then
    raise exception 'CATEGORY_ORDER_STALE_SET'
      using errcode = 'P0001';
  end if;

  -- Exact set: every current tenant category present; no extras/foreign/missing.
  select count(*)::integer
    into v_overlap_count
  from public.categories c
  where c.business_id = v_business_id
    and c.id in (select x.id from unnest(p_ordered_category_ids) as x(id));

  if v_overlap_count <> v_current_count then
    raise exception 'CATEGORY_ORDER_STALE_SET'
      using errcode = 'P0001';
  end if;

  -- Empty tenant: empty array already matched (0=0). Idempotent no-op.
  if v_current_count = 0 then
    return;
  end if;

  set constraints public.categories_business_id_position_key deferred;

  update public.categories as c
  set position = (ordered.ordinality - 1)::integer
  from unnest(p_ordered_category_ids) with ordinality as ordered(category_id, ordinality)
  where c.id = ordered.category_id
    and c.business_id = v_business_id
    and c.position is distinct from (ordered.ordinality - 1)::integer;

  set constraints public.categories_business_id_position_key immediate;
end;
$$;

comment on function public.save_category_display_order(uuid[]) is
  'Atomic merchant category display order. SECURITY DEFINER. Input = ordered category ids only. Exact tenant set. Contiguous positions 0..n-1. No client business_id.';

revoke all on function public.save_category_display_order(uuid[]) from public;
revoke all on function public.save_category_display_order(uuid[]) from anon;
grant execute on function public.save_category_display_order(uuid[]) to authenticated;

-- Trigger function is not a general public API; EXECUTE is required for BEFORE INSERT.
revoke all on function public.categories_assign_append_position() from public;
revoke all on function public.categories_assign_append_position() from anon;
grant execute on function public.categories_assign_append_position() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Category mutative RLS — manageProducts role enforcement
-- ---------------------------------------------------------------------------
-- SELECT policies preserved:
--   categories_select_own_business
--   categories_select_active_business_public

drop policy if exists "categories_insert_own_business" on public.categories;
drop policy if exists "categories_update_own_business" on public.categories;
drop policy if exists "categories_delete_own_business" on public.categories;

create policy "categories_insert_own_business"
  on public.categories
  for insert
  to authenticated
  with check (
    (
      business_id = (
        select p.business_id
        from public.profiles p
        where p.id = auth.uid()
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner', 'admin', 'manager')
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

create policy "categories_update_own_business"
  on public.categories
  for update
  to authenticated
  using (
    (
      business_id = (
        select p.business_id
        from public.profiles p
        where p.id = auth.uid()
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner', 'admin', 'manager')
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  )
  with check (
    (
      business_id = (
        select p.business_id
        from public.profiles p
        where p.id = auth.uid()
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner', 'admin', 'manager')
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

create policy "categories_delete_own_business"
  on public.categories
  for delete
  to authenticated
  using (
    (
      business_id = (
        select p.business_id
        from public.profiles p
        where p.id = auth.uid()
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner', 'admin', 'manager')
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

-- ---------------------------------------------------------------------------
-- 8. Position write authority — column privilege allow-list
-- ---------------------------------------------------------------------------
-- Root cause of CATEGORY_ORDER_DB_APPLY_POSITION_AUTHORITY_BYPASS:
--   table-level UPDATE on authenticated authorizes UPDATE of every column,
--   including position. RLS is row-scoped and does not privatize columns.
--
-- PostgreSQL semantics:
--   GRANT UPDATE ON TABLE ⇒ UPDATE on all columns
--   REVOKE UPDATE(column) alone does NOT safely override retained table UPDATE
--   Therefore revoke broad table UPDATE first, then grant only legitimate columns.
--
-- Producer census: ordinary authenticated Category UPDATE writes only `name`
-- (updateCategoryAction). position UPDATE is RPC-only; INSERT position is
-- trigger-owned. Maintenance roles (postgres / elevated API roles) are
-- intentionally untouched.

revoke update on table public.categories from authenticated;
revoke update on table public.categories from anon;

-- Drop any effective/explicit per-column UPDATE grants derived from prior
-- table-level UPDATE (or explicit column grants) for client roles.
revoke update (
  id,
  business_id,
  name,
  position,
  created_at
) on table public.categories from authenticated;

revoke update (
  id,
  business_id,
  name,
  position,
  created_at
) on table public.categories from anon;

-- Ordinary Category rename only.
grant update (name) on table public.categories to authenticated;

-- Explicit denials documented by absence of grants:
--   authenticated: no UPDATE(position|id|business_id|created_at)
--   anon: no UPDATE on any categories column
-- Canonical numeric position UPDATE writer remains:
--   public.save_category_display_order (SECURITY DEFINER / function owner)
-- INSERT append writer remains:
--   tr_categories_assign_append_position (BEFORE INSERT)
