# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-POSITION-AUTHORITY-FIX-1

# Result

**PASS — CATEGORY POSITION WRITE AUTHORITY CLOSED / CORRECTED DB MIGRATION AUTHORED / REMOTE APPLY REQUIRED**

# Blocker Origin

| Field | Value |
|-------|-------|
| previous phase | ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1 |
| reason | `CATEGORY_ORDER_DB_APPLY_POSITION_AUTHORITY_BYPASS` |
| remote apply | NOT EXECUTED |
| remote delta | **0** |

# Remote Safety

| Check | Value |
|-------|-------|
| OrderOps `pkrsedmwxekbhlohhqds` | ACTIVE_HEALTHY |
| old migration in remote history | **ABSENT** |
| `save_category_display_order` live | ABSENT |
| append trigger live | ABSENT |
| position | integer NULL |
| unique `(business_id, position)` | ABSENT |
| ambiguity | **0** |
| backfill simulation delta | **0** |

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | PRE-EXISTING Products package preserved |

# Target Identity

OrderOps · `pkrsedmwxekbhlohhqds` · PROVEN · MauroDev not touched.

# Superseded Migration

| Field | Value |
|-------|-------|
| filename | `20260917182047_categories_public_catalog_order.sql` |
| SHA | `4bb35bec9da5981d0c58a1f9658cf8408d09b2286d44a2ec27ed1f90e0ece9e8` |
| remote history | **0** |
| status | **HISTORICAL AUTHORED / SUPERSEDED BEFORE APPLY** |
| active in `supabase/migrations/` | **REMOVED** |

# Current Privilege Census

| Role | SELECT | INSERT | UPDATE (table) | UPDATE columns (effective) | DELETE |
|------|--------|--------|----------------|----------------------------|--------|
| authenticated | YES | YES | **YES** | id, business_id, name, position, created_at | YES |
| anon | YES | YES | **YES** | all columns | YES |
| service_role | YES | YES | YES | all | YES |
| postgres | YES | YES | YES | all | YES |

Answers:

- A. authenticated table UPDATE: **YES**
- B. authenticated UPDATE(position): **YES (effective)**
- C. anon table UPDATE: **YES**
- D. anon UPDATE(position): **YES (effective)**
- E. service_role: maintenance authority preserved (untouched by fix)
- F. app needs: INSERT + UPDATE(name) + SELECT + DELETE (RLS)

# Category Update Producer Census

| Producer | Operation | Columns |
|----------|-----------|---------|
| `createCategoryAction` | INSERT | `business_id`, `name` (no position) |
| `updateCategoryAction` | UPDATE | **`name` only** |
| Products SKU / ownership helpers | SELECT | — |
| Customizations / catalog / admin loaders | SELECT | — |
| Super-admin business wipe | DELETE | via **service_role** |

Legitimate ordinary authenticated UPDATE allow-list: **`name` only**.

# Position Authority Root Cause

Table-level `UPDATE` on `authenticated` authorizes UPDATE of every column, including `position`. RLS is row-scoped and does not privatize columns. Column-only `REVOKE UPDATE(position)` is insufficient while table-level UPDATE remains.

# Selected Fix

Native PostgreSQL privilege allow-list:

1. `REVOKE UPDATE ON TABLE … FROM authenticated, anon`
2. `REVOKE UPDATE (id, business_id, name, position, created_at) … FROM authenticated, anon`
3. `GRANT UPDATE (name) ON TABLE … TO authenticated`

RPC remains SECURITY DEFINER (function owner writes `position`).  
BEFORE INSERT trigger remains INSERT append authority.

# Rejected Alternatives

| Alternative | Why rejected |
|-------------|--------------|
| Session-marker / GUC / `set_config` trigger | Hidden ambient authority; unnecessary when column privileges work |
| Thin patch migration after vulnerable one | Would create live bypass window if applied sequentially |
| In-place edit of frozen SHA `4bb35bec…` | Erases historical authorship evidence |

# PostgreSQL Privilege Semantics

- `GRANT UPDATE ON TABLE` ⇒ UPDATE on all columns
- Retained table-level UPDATE defeats column-only revoke for practical PostgREST clients
- Therefore revoke broad table UPDATE, then grant only approved columns
- SECURITY DEFINER RPC executes as owner → can UPDATE `position` without granting that privilege to callers
- RLS continues to gate which rows/roles may UPDATE `name`

# Authenticated Update Allow-List

`UPDATE (name)` only.

Denied: `position`, `id`, `business_id`, `created_at`.

# Anon Authority

All category UPDATE revoked (table + columns). Public SELECT policies preserved.

# Service Role / Owner Authority

Untouched. No privilege broadening.

# RLS Interaction

manageProducts INSERT/UPDATE/DELETE policies preserved from prior author contract.  
Privileges ∩ RLS:

| Actor | UPDATE(name) privilege | RLS | Effective rename |
|-------|------------------------|-----|------------------|
| owner/admin/manager | YES | ALLOW | ALLOW |
| operator/viewer | YES (column grant) | DENY | DENY |
| owner raw `position` | NO | n/a | DENY (privilege) |

# Create Compatibility

INSERT preserved. Append trigger overrides client `position`. Old Create omitting position remains valid.

# Rename Compatibility

`updateCategoryAction` → `.update({ name })` remains privilege-compatible.

# RPC Authority

`save_category_display_order(uuid[])` SECURITY DEFINER remains exclusive ordinary API writer for numeric `position`.

# Corrected Complete Migration

Standalone full contract: ambiguity guard → append trigger → backfill → NOT NULL → DEFERRABLE unique → RPC → RLS → **privilege hardening**.

# Migration Supersession

Old unapplied file removed from active chain. Exactly **one** active category-order migration.

# Backfill Recheck

ambiguity **0** · simulation delta **0**

# Corrected Migration SHA

```
18ef63079eca6afaf6b5d44013df13e0742f7810cd597f590236002aaf4dd8cf
```

File: `supabase/migrations/20260917202554_categories_public_catalog_order.sql`

# Focused Verify

`lib/categories/admin-categories-public-catalog-order-db-author.verify.ts` — **PASS**

# Mutation Probes

| Probe | Result |
|-------|--------|
| A table UPDATE grant | FAIL_OK → PASS |
| B UPDATE(position) grant | FAIL_OK → PASS |
| C remove UPDATE(name) | FAIL_OK → PASS |
| D anon UPDATE | FAIL_OK → PASS |
| E RPC invoker | FAIL_OK → PASS |
| F old migration active | FAIL_OK → PASS |
| G RLS role weaken | FAIL_OK → PASS |
| (+ append / swap / exact-set / client tenant) | FAIL_OK → PASS |

# TypeScript

`npx tsc --noEmit` — **PASS**

# Diff

Phase: corrected migration + verify + docs. Runtime application: **0**.  
`git diff --check` PASS.

# Remote Delta

schema / RLS / RPC / history / data: **ALL 0**

# Runtime Delta

**0**

# Data Safety

Category/product/order/Storage mutations: **0**

# Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1** (rerun from start against corrected SHA)

# Release

COMMIT/PUSH/DEPLOY: **PAUSED**
