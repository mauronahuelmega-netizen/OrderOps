# ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-LEGACY-OVERRIDE-CLEANUP-1

# Result

**PASS — LEGACY TRUE OVERRIDE CANONICALIZED**

Persistent mutation budget consumed: **exactly 1** `product_customization_overrides` DELETE.  
No RPC / migration / RLS / schema / history / app changes.

---

# Trigger

Hard blocker from `ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1`:

live `is_enabled = true` override row blocked PASS (RPC refuses intersection with true rows).

---

# Target Identity

| Item | Value |
|------|--------|
| project | OrderOps |
| ref | `pkrsedmwxekbhlohhqds` |
| URL | `https://pkrsedmwxekbhlohhqds.supabase.co` |
| proof | `get_project` ACTIVE_HEALTHY; `get_project_url` match; explicit ref on every MCP call |

---

# Exact Legacy Row

| Field | Value |
|-------|--------|
| id | `d08a0a85-4013-4e70-ba5c-c1d90fcac059` |
| business_id | `59db34de-a48f-4fa8-b7fd-7ed5cc48d6c4` |
| product_id | `cf6db112-cb10-467a-9947-60480eaf260f` |
| product | QA RLS OFF Burger / SKU `QA-RLS-OFF-BURGER` |
| override_type | group |
| group_id | `1e6cd71b-58fa-436e-aeaf-a856de3bbba8` |
| group | QA RLS OFF Extras |
| option_id | NULL |
| is_enabled | TRUE |
| created_at | 2026-07-17 18:33:35.854202+00 |
| updated_at | 2026-07-17 18:33:35.854202+00 |
| fixture classification | QA RLS OFF* artifacts from earlier RLS security testing (naming supports classification; semantic equivalence was the hard gate) |

---

# Pre-Cleanup Census

| Metric | Value |
|--------|--------|
| total | 3 |
| false | 2 |
| true | 1 |
| invalid shapes | 0 |

False rows (immutable / out of scope):

- `a2a401ca-231d-4038-b84b-fae7c089e5ea` (group, false)
- `b2fe14e6-78c3-4c7a-b3e9-b4b3e838d6cc` (option, false)

---

# Current Producer Semantics

Source: `app/admin/(protected)/products/customizations/actions.ts`

| Action | Behavior |
|--------|----------|
| disable group/option | INSERT or UPDATE with **`is_enabled: false` only** |
| restore group/option | **DELETE** row |

No active producer creates `is_enabled=true` override rows.

Resolvers (`lib/product-customization/public.ts` `resolveGroupsForProduct`, `lib/product-customization/admin-preview-mapper.ts`):

hide only when `is_enabled === false`.

Unified RPC (`save_product_edit_draft`): intersecting desired hidden ids with `is_enabled=true` → `SAVE_PRODUCT_EDIT_DRAFT_LEGACY_OVERRIDE_SHAPE` abort. **Not loosened.**

---

# Semantic Resolution Evidence

## True Override Meaning

Ignored by current resolvers (not in disabled set). Effective: **VISIBLE** if assignment + group available.

## Absence Meaning

Inherited / default: **VISIBLE** if assignment + group available (canonical model).

## Group Applicability

Product assignment `9d68f30f-81b8-4495-98d9-024a1044d950`:

- `target_type = product`
- `target_id = cf6db112-…`
- `group_id = 1e6cd71b-…`
- `is_enabled = true`

Group `is_available = true`. Option `4f2ce494-…` / `QA RLS OFF Option` present.

## Effective Visibility

| State | applicable | available | hidden_by_false | effective |
|-------|------------|-----------|-----------------|-----------|
| BEFORE (true row present) | true | true | false | **VISIBLE** |
| AFTER temp delete | true | true | false | **VISIBLE** |
| AFTER persistent delete | true | true | false | **VISIBLE / INHERITED** |

---

# Rollback-Only Simulation

## Before

true=1, false=2, target row present, visible=true

## Temporary Delete

Guarded DELETE inside `BEGIN` (sequential statements; not concurrent CTE snapshot).

## Effective State

true=0, false=2, product overrides=0, group_applicable=true, visible=true, option_count=1 unchanged

## Rollback

`ROLLBACK`

## Row Restored

Post-rollback census: total=3, true=1, false=2; exact target id present again.

---

# Cleanup Decision

**AUTHORIZED**

true ≡ absence for effective visibility; group remains applicable via product assignment; no option semantic dependency on true row; rollback equivalence PASS.

**NOT** true→false conversion.

---

# Persistent Delete

## Guard Predicate

```sql
DELETE FROM public.product_customization_overrides
WHERE id = 'd08a0a85-4013-4e70-ba5c-c1d90fcac059'
  AND business_id = '59db34de-a48f-4fa8-b7fd-7ed5cc48d6c4'
  AND product_id = 'cf6db112-cb10-467a-9947-60480eaf260f'
  AND override_type = 'group'
  AND group_id = '1e6cd71b-58fa-436e-aeaf-a856de3bbba8'
  AND option_id IS NULL
  AND is_enabled = true
RETURNING ...;
```

Mechanism: Supabase MCP `execute_sql` with explicit `project_id=pkrsedmwxekbhlohhqds` (server-side DB op; not browser/client).

## Affected Rows

**EXACTLY 1** (RETURNING returned the exact target id)

---

# Post-Cleanup Census

| Metric | Before | After |
|--------|--------|-------|
| total | 3 | **2** |
| false | 2 | **2** |
| true | 1 | **0** |
| invalid | 0 | **0** |

Target id: **ABSENT**

---

# Effective Behavior After

QA RLS OFF Extras: **APPLICABLE + VISIBLE / INHERITED**  
Semantic delta: **NONE**  
Representation delta: explicit legacy true → canonical absence

---

# Collateral Guard

| Surface | Result |
|---------|--------|
| false override `a2a401ca-…` | unchanged (same timestamps) |
| false override `b2fe14e6-…` | unchanged (same timestamps) |
| product fields | unchanged (stock 0, track_stock false, is_available false, sku, category) |
| group | unchanged |
| assignment `9d68f30f-…` | unchanged |
| option `4f2ce494-…` | unchanged |

---

# RPC / Migration Immutability

RPC fingerprint: `6d31d3050a938022242eae9348c52697c46b8528b4f7b3afd08f5f3ff422079a` (**unchanged**)  
prosecdef: false  
Migration SHA256: `42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631` (**unchanged**)  
Local migration file: **not edited**

---

# Migration History

Before: 11 entries; `products_edit_unified_draft_save_rpc` **ABSENT**  
After: same 11 entries  
Repaired: **NO**

---

# Persistent Mutation Budget

| Item | Count |
|------|-------|
| override DELETE | **1** |
| products | 0 |
| groups/options/assignments | 0 |
| categories/profiles/Storage/orders | 0 |
| schema/RLS/RPC/history | 0 |

---

# Recovery Record

Conceptual restore (NOT EXECUTED):

```sql
INSERT INTO public.product_customization_overrides (
  id, business_id, product_id, override_type, group_id, option_id, is_enabled, created_at, updated_at
) VALUES (
  'd08a0a85-4013-4e70-ba5c-c1d90fcac059',
  '59db34de-a48f-4fa8-b7fd-7ed5cc48d6c4',
  'cf6db112-cb10-467a-9947-60480eaf260f',
  'group',
  '1e6cd71b-58fa-436e-aeaf-a856de3bbba8',
  NULL,
  true,
  '2026-07-17 18:33:35.854202+00',
  '2026-07-17 18:33:35.854202+00'
);
```

---

# Verification

`git diff --check` on phase docs: run after write  
build / lint / tsc / browser: **NOT RUN**  
DB-APPLY matrices: **NOT RUN** (out of scope)

---

# Runtime Application Status

**STILL LEGACY MIXED PERSISTENCE**  
Unified draft implementation: **NOT STARTED**  
DB-APPLY: **READY TO RESUME / NOT YET PASS**

---

# Next

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1**  
**RESUME FROM LEGACY-CENSUS GATE**

COMMIT/PUSH/DEPLOY: **PAUSED**