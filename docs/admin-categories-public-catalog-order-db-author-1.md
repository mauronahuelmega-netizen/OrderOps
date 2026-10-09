# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-1

# Result

**PASS — CATEGORY ORDER DB CONTRACT AUTHORED / REMOTE APPLY REQUIRED**

# Scope

Database authoring only: one migration + focused verify + docs.  
No remote apply. No runtime UI/actions. No business data writes.

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | PRE-EXISTING Products package preserved |

# Target Identity

| Field | Value |
|-------|-------|
| project | OrderOps |
| ref | `pkrsedmwxekbhlohhqds` |
| status | ACTIVE_HEALTHY |
| identity | PROVEN via `get_project` |

# Decision Baseline

`ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1` — PASS / PRESERVED.

Canonical model: reuse `public.categories.position`; contiguous 0..n-1; append on create; atomic `save_category_display_order(uuid[])`; manageProducts authority.

# Live Schema Census

| Item | Live | Source agreement |
|------|------|------------------|
| columns | id, business_id, name, position integer **NULL**, created_at | matches `types/database.ts` + T2 migration |
| check | `categories_position_non_negative` (`NULL OR >= 0`) | match |
| unique | `(id, business_id)`, PK | match |
| FK | `business_id → businesses` RESTRICT | match |
| indexes | `categories_business_id_idx` + uniques | match |
| triggers | **none** | match |
| RPC collision | `save_category_display_order` **absent** | OK |
| append fn collision | absent | OK |

**SCHEMA DRIFT:** none material.

# Live RLS Census

RLS enabled; not forced.

| Policy | Command | Role gate today |
|--------|---------|-----------------|
| `categories_select_own_business` | SELECT | tenant + super_admin — **PRESERVE** |
| `categories_select_active_business_public` | SELECT | active business public — **PRESERVE** |
| `categories_insert_own_business` | INSERT | tenant OR super_admin — **NO manageProducts role** |
| `categories_update_own_business` | UPDATE | tenant OR super_admin — **NO manageProducts role** |
| `categories_delete_own_business` | DELETE | tenant OR super_admin — **NO manageProducts role** |

Gap confirmed: operator/viewer can raw-mutate categories inside own tenant today (app gates Create/Update; PostgREST does not).

# Live Position Census

| Metric | Value |
|--------|-------|
| categories | 8 |
| businesses with categories | 3 |
| null positions | 6 |
| non-null | 2 |
| negative | 0 |
| duplicate non-null (business, position) | 0 |
| mixed null/non-null tenants | 1 (La Burguesía: BEBIDAS@90 + 4 nulls) |

# Backfill Ambiguity Census

`GROUP BY business_id, position, name HAVING count(*) > 1` → **0 rows**.

**CURRENT ORDER KEYS: UNAMBIGUOUS**  
**BACKFILL PRESERVATION: PROVABLE**

# Backfill Simulation

Hypothetical `row_number()-1` over  
`position ASC NULLS LAST, name ASC, created_at ASC, id ASC`  
vs current loader order (`position NULLS LAST, name`):

| Metric | Value |
|--------|-------|
| businesses checked | 3 |
| categories checked | 8 |
| sequence delta | **0** |

Preview (La Burguesía): BEBIDAS→0, COMBOS→1, EMPANADAS→2, HAMBURGUESAS→3, PIZZAS→4.

# Migration

| Field | Value |
|-------|-------|
| file | `supabase/migrations/20260917182047_categories_public_catalog_order.sql` |
| remote applied | **NO** |

# Migration SHA

```
4bb35bec9da5981d0c58a1f9658cf8408d09b2286d44a2ec27ed1f90e0ece9e8
```

FROZEN for DB-APPLY pre/post hash check.

# Backward-Compatible Append Authority

| Item | Spec |
|------|------|
| function | `public.categories_assign_append_position()` |
| trigger | `tr_categories_assign_append_position` |
| timing | **BEFORE INSERT** |
| rule | `position = coalesce(max(position), -1) + 1` |
| empty tenant | `0` |
| client position | **OVERRIDDEN** (not authoritative) |
| security | SECURITY INVOKER + `search_path = ''` |
| EXECUTE | revoke public/anon; **grant authenticated** (required for BEFORE INSERT) |

Old deployed `createCategoryAction` omitting `position` remains compatible after APPLY.

# Append Concurrency

Locks `public.businesses` row `WHERE id = NEW.business_id FOR UPDATE` before computing max — same lock order as RPC.

# Position Backfill

All categories; partition by `business_id`; order keys as decision + created_at/id; contiguous ranks.

# NOT NULL Contract

`ALTER COLUMN position SET NOT NULL` after backfill.  
**No** `DEFAULT 0`. Append trigger is authority.

# Unique Position Contract

`categories_business_id_position_key UNIQUE (business_id, position) DEFERRABLE INITIALLY IMMEDIATE`

# Swap Safety

RPC: `SET CONSTRAINTS ... DEFERRED` → set-based ordinal UPDATE → `SET CONSTRAINTS ... IMMEDIATE`.  
Author verify mutation probe removes DEFERRABLE → FAIL → restore PASS.

# RPC Contract

```sql
public.save_category_display_order(p_ordered_category_ids uuid[]) RETURNS void
```

No `p_business_id`. No client numeric positions.

# RPC Authorization

| Check | Behavior |
|-------|----------|
| `auth.uid()` | required |
| roles | owner/admin/manager/super_admin |
| operator/viewer | `CATEGORY_ORDER_FORBIDDEN` |
| tenant | profile `business_id`; super_admin with NULL business derives single business from submitted ids then exact-set validates |

# RPC Exact-Set Validation

NULL array / null elements / duplicates → `CATEGORY_ORDER_INVALID_SET`  
cardinality or membership mismatch / foreign → `CATEGORY_ORDER_STALE_SET`  
empty array only if tenant has 0 categories.

# RPC Locking

1. BUSINESS row `FOR UPDATE`  
2. CATEGORY rows `ORDER BY id FOR UPDATE`

# RPC Concurrency

| Scenario | Outcome |
|----------|---------|
| create/create | serialize on business lock; distinct append positions |
| create/reorder | serialize; insert-first → RPC sees N+1 → stale reject; RPC-first → insert appends after |
| reorder/reorder | serialize; same membership → last writer wins |
| delete/reorder | row locks / stale set reject |

# RPC Idempotency

Same order twice: succeeds; `IS DISTINCT FROM` skips no-op row writes.

# Category RLS Role Enforcement

INSERT/UPDATE/DELETE rewritten to products manage-role pattern (`owner`/`admin`/`manager` + `super_admin`).  
SELECT policies unchanged. FK RESTRICT unchanged.

# Public / Admin Read Compatibility

Existing loaders (`position ASC NULLS LAST, name ASC`) remain valid; NULLS LAST becomes inert after NOT NULL.

# Rollout Compatibility

DB APPLY before app deploy is safe: append trigger + NOT NULL + unique + RLS; Create omitting position still works for authorized roles.

# Focused Verify

`lib/categories/admin-categories-public-catalog-order-db-author.verify.ts` — **PASS**

# Mutation Probes

| Probe | Result |
|-------|--------|
| backward_compat (remove BEFORE INSERT trigger) | FAIL_OK → PASS |
| swap_safety (remove DEFERRABLE) | FAIL_OK → PASS |
| rls_role (strip manage-role predicate) | FAIL_OK → PASS |
| exact_set (remove overlap check) | FAIL_OK → PASS |
| client_tenant (add `p_business_id`) | FAIL_OK → PASS |

# TypeScript

`npx tsc --noEmit` — **PASS**

# Diff

Phase-owned: migration + verify + docs (+ CURRENT_PHASE / living audit / memory).  
Runtime application source: **0** intentional edits.  
`git diff --check` on phase files — PASS.

# Remote Apply Safety

Remote schema/RLS/RPC/history/business mutations this phase: **0**.  
`apply_migration` not called.

# Data Safety

categories/products/orders/Storage mutations: **0**

# Runtime Delta

**0**

# Remaining Apply Work

`ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1`:

1. Re-run ambiguity + backfill simulation on live  
2. Apply migration  
3. Verify SHA pre/post  
4. Prove NOT NULL, unique DEFERRABLE, trigger, RPC ACL, RLS matrix  
5. Prove append without client position  
6. Prove swap reorder  
7. Prove operator/viewer deny  
8. No app feature yet

# Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1**

# Release

COMMIT/PUSH/DEPLOY: **PAUSED**
