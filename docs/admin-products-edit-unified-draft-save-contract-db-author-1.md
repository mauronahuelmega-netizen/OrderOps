# ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-AUTHOR-1

# Result

**PASS — RPC AUTHORED / NOT APPLIED**

Unified Edit Save RPC `public.save_product_edit_draft` authored as **SECURITY INVOKER**.  
Remote apply: **0**. Runtime application wiring: **0**. Business-data mutations: **0**.

---

# Preflight

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| Working tree | **PRE-EXISTING DIRTY** (large Products package + prior phase docs) |
| Historical migrations | **UNTOUCHED** |
| Remote DB write | **0** |
| `supabase db push` | **NOT RUN** |

---

# Delta Audit

| Artifact | Status |
|----------|--------|
| `supabase/migrations/20260915180000_products_edit_unified_draft_save_rpc.sql` | **NEW** |
| `lib/products/admin-products-edit-unified-draft-save-contract-db-author.verify.ts` | **NEW** |
| `docs/admin-products-edit-unified-draft-save-contract-db-author-1.md` | **NEW** |
| `docs/CURRENT_PHASE.md` | minimal update |
| `docs/products-living-audit.md` | minimal update |
| `ORDEROPS_LIVING_MEMORY.md` | changelog entry |
| Runtime app / CSS / server actions | **0** |

---

# Schema Evidence

## Products

- Columns used by RPC: `id`, `business_id`, `category_id`, `name`, `description`, `price`, `sku`, `stock`, `is_available`, `track_stock`, `image_url`
- Mutative RLS: role-gated owner/admin/manager (+ super_admin) — `20260909040000_products_manage_role_rls.sql`
- Stock/availability trigger: `tr_auto_suspend_out_of_stock` — **UNTOUCHED**; RPC uses normal `UPDATE`
- SKU uniqueness: `products_business_sku_uidx` `(business_id, sku) WHERE sku IS NOT NULL` — **UNTOUCHED**

## Override Table

- Table: `public.product_customization_overrides`
- Shape CHECK: group → `group_id` set / `option_id` null; option → `option_id` set / `group_id` null
- Unique partial indexes: `(business_id, product_id, group_id)` where group; `(business_id, product_id, option_id)` where option
- Canonical hide model: `is_enabled = false` row; restore = DELETE
- Legacy `is_enabled = true` intersecting desired ids → `SAVE_PRODUCT_EDIT_DRAFT_LEGACY_OVERRIDE_SHAPE` (abort; no silent normalize)

## Assignments / Inheritance

- Applicability via `customization_group_assignments` with `target_type in ('product','category')`
- Matches admin inheritance: product assignment OR category assignment using **persisted** `products.category_id`
- Options validated through `customization_options` → parent group must be applicable

## Relevant RLS / Grants

| Concern | Evidence |
|---------|----------|
| products UPDATE | RLS role allow-list (manageProducts-equivalent) |
| overrides SELECT/INSERT/UPDATE/DELETE | tenant `business_id` policies (no separate role gate) |
| authenticated grants | table DML available under RLS for authenticated |
| anon | denied by auth + grants + role gate |

---

# Security Mode Decision

## INVOKER Evaluation

| Concern | INVOKER |
|---------|---------|
| products UPDATE | OK via existing mutative RLS |
| override SELECT/INSERT/DELETE | OK via tenant RLS |
| role enforcement | products RLS + explicit in-function allow-list |
| tenant enforcement | product row + profile.business_id check + RLS |
| direct RPC abuse | auth.uid + role + applicability validation + grants |
| transaction capability | YES (function = txn boundary) |

## DEFINER Evaluation

| Concern | DEFINER |
|---------|---------|
| Needed for atomicity? | **NO** — false premise |
| Needed for grants gap? | **NO** — INVOKER can write under current policies |
| Would require? | Full hardening without privilege gain |

## Final Choice

**SECURITY INVOKER**

## Evidence

Atomicity is provided by the PL/pgSQL function invocation, not by DEFINER.  
Products mutative RLS already encodes manageProducts. Override writes are tenant-scoped.  
DEFINER would broaden execution privileges without a proven INVOKER blocker.

---

# RPC Contract

## Signature

```sql
public.save_product_edit_draft(
  p_product_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_sku text,
  p_stock integer,
  p_is_available boolean,
  p_track_stock boolean,
  p_image_intent text,   -- keep | replace | remove
  p_image_url text,      -- required when replace
  p_hidden_group_ids uuid[],
  p_hidden_option_ids uuid[]
) returns uuid
```

Security: `SECURITY INVOKER`  
`SET search_path = ''`  
`VOLATILE`

## Category Authority

- No `p_category_id`
- Load `products.category_id` under `FOR UPDATE`
- Never `SET category_id = ...`

## Tenant Authority

- No client `business_id`
- Business from locked product row; non-super_admin must match `profiles.business_id`

## Role Authority

- In-function allow-list: `owner | admin | manager | super_admin`
- operator / viewer / anon → deny
- RLS remains authoritative for table writes

## Product Validation

- name: non-empty after trim
- price: non-null, >= 0, finite
- stock: non-null integer >= 0
- sku / description: nullable after trim (`nullif`)
- availability / track_stock: required booleans
- effective availability mirrors tracked-stock <=0 → false (trigger remains defense-in-depth)

## Customization ID Validation

- NULL arrays rejected (use `{}`)
- NULL elements rejected
- DISTINCT canonicalize
- Groups must apply via assignments (product or persisted category)
- Options must belong to applicable group + same business
- Invalid → exception before commit

## Image Semantics

| Intent | SQL behavior |
|--------|----------------|
| `keep` | do not touch `image_url` |
| `remove` | `image_url = null` |
| `replace` | set `image_url`; soft check URL contains business_id + product_id |

Storage object lifecycle: **outside SQL** (Server Action compensation).

---

# Atomic Reconciliation

## Product Update

Same function invocation after override reconcile; normal `UPDATE public.products`.

## Group Overrides

- DELETE `is_enabled=false` group rows not in desired set
- INSERT desired group disables (`group_id`, `option_id` null) `ON CONFLICT … DO UPDATE is_enabled=false`

## Option Overrides

- DELETE `is_enabled=false` option rows not in desired set
- INSERT desired option disables (`option_id`, `group_id` null) `ON CONFLICT … DO UPDATE`

## Failure / Rollback

Any raise / constraint / trigger failure aborts entire call — product + overrides roll back together.

---

# Stock / Availability Preservation

Trigger **not** disabled / replicated / bypassed. Normal UPDATE preserves contract.

---

# SKU Preservation

Unique index remains sole authority. Duplicate → transaction failure. No retry/transform.

---

# Execute Grants

```sql
REVOKE ALL … FROM PUBLIC;
REVOKE ALL … FROM anon;
GRANT EXECUTE … TO authenticated;
```

`service_role` may still execute via Supabase role privileges; not granted to anon/PUBLIC. Document for DB-APPLY.

---

# Search Path / Function Hardening

- `SET search_path = ''`
- Fully qualified `public.*` + `auth.uid()`
- Explicit auth/role/tenant checks even under INVOKER (defense in depth)

---

# Migration

path: `supabase/migrations/20260915180000_products_edit_unified_draft_save_rpc.sql`  
SHA256: `42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631`  
Status: **AUTHORED / NOT APPLIED**

---

# Focused Verification

`npx tsx lib/products/admin-products-edit-unified-draft-save-contract-db-author.verify.ts` → **PASS**

---

# Mutation Probes

| Probe | Mutation | Expected | Restore |
|-------|----------|----------|---------|
| A | inject `p_category_id` + `category_id = …` write | FAIL | PASS |
| B | `SECURITY DEFINER` + GRANT EXECUTE to PUBLIC | FAIL | PASS |
| C | rename `INVALID_OPTION` marker | FAIL | PASS |

---

# Data Safety

| Surface | Mutations |
|---------|-----------|
| products | 0 |
| overrides | 0 |
| categories | 0 |
| Storage | 0 |
| orders / profiles | 0 |
| remote schema | 0 |
| remote migration history | 0 |

---

# Runtime Changes

**0**

---

# DB Apply Plan

Future **ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1** must prove:

A. migration applied exactly once; remote definition matches SHA256  
B. EXECUTE grants: authenticated only; PUBLIC/anon denied  
C. Role matrix as authenticated principals (not service_role bypass): owner/manager ALLOW; operator/viewer DENY; foreign tenant DENY; anon DENY; super_admin preserve current semantics  
D. category cannot be reassigned through RPC  
E. invalid group / option denied  
F. valid save accepted in rollback-safe probe; persistent mutations = 0  
G. Atomicity: induced late customization failure → product fields before == after; overrides before == after  
H. stock/availability trigger still fires / preserved  
I. SKU uniqueness still rejects duplicates  
J. probe rows restored/rolled back  

Do **not** execute in this phase.

---

# Next

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1**

COMMIT / PUSH / DEPLOY: **PAUSED**
