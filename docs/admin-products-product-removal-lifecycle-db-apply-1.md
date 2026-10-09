# ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-APPLY-1

# Result

**PASS — PRODUCT LIFECYCLE DB LIVE / PERMANENT DELETE RPC VALIDATED**

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` (matches expected baseline) |
| dirty | PRE-EXISTING Products package preserved; this phase = docs + CURRENT_PHASE / living audit / living memory only |

# Target Identity

| Proof | Value |
|-------|-------|
| project | OrderOps |
| ref | `pkrsedmwxekbhlohhqds` |
| URL | `https://pkrsedmwxekbhlohhqds.supabase.co` |
| list_projects | OrderOps ACTIVE_HEALTHY; MauroDev INACTIVE untouched |
| get_project_url | matches expected URL |

# Frozen Migration

| Field | Value |
|-------|-------|
| path | `supabase/migrations/20260916180000_products_removal_lifecycle.sql` |
| pre SHA | `5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57` |
| post SHA | `5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57` |
| unchanged | **YES** |
| old archive-only file | **ABSENT** (no dual pending migration) |

# Pre-Apply Remote State

| Object | State |
|--------|-------|
| archived_at | ABSENT |
| CHECK | ABSENT |
| active-list index | ABSENT |
| products_delete_own_business | PRESENT |
| delete_product_permanently | ABSENT |
| history 20260916180000 / removal | 0 |
| products / orders / order_items / stock_movements | 20 / 77 / 160 / 60 |
| archived_nonnull (n/a pre) | — |

# Apply Mechanism

- Supabase MCP `apply_migration`
- explicit `project_id = pkrsedmwxekbhlohhqds`
- name: `products_removal_lifecycle`
- exact frozen SQL (no edits)
- **NOT** `supabase db push`

# Apply Result

- success: **true**
- collateral migrations: **0**

# Migration History

| Field | Value |
|-------|-------|
| entry | `20260916195024_products_removal_lifecycle` |
| count for name | **1** |
| old archive_lifecycle | **0** |
| reconciliation | not required (API assign-time version; name matches) |

# Post-Apply Schema

| Object | Live |
|--------|------|
| archived_at | `timestamptz` nullable **YES** |
| existing rows archived_at | all **NULL** (archived_nonnull=0) |
| business row counts post-apply | products 20, orders 77, order_items 160, stock_movements 60 (**unchanged**) |

# Lifecycle Check

`products_archived_requires_unavailable`  
`CHECK (((archived_at IS NULL) OR (is_available = false)))`  
Runtime: archived+available UPDATE → CHECK violation **PASS**

# Index

`products_business_created_at_active_idx`  
`(business_id, created_at DESC) WHERE (archived_at IS NULL)`

SKU: `products_business_sku_uidx` unchanged — no `archived_at` predicate

Stock trigger: `tr_auto_suspend_out_of_stock` unchanged

# Public RLS

`products_select_available_public` includes:

- `is_available = true`
- `archived_at IS NULL`
- active business

Runtime: active+available visible; archived hidden **PASS**

# Admin RLS

`products_select_own_business` untouched (no archive filter)  
Runtime: admin can SELECT archived own product **PASS**

# Raw DELETE

`products_delete_own_business` **absent**  
delete policy count: **0**  
RLS enabled: **true**

# Permanent Delete RPC

## Live Signature

`public.delete_product_permanently(p_product_id uuid)`  
`RETURNS TABLE(deleted_product_id uuid, image_url text, deleted boolean)`

## Security Mode

**SECURITY DEFINER** (`prosecdef=true`)

## Owner

`postgres`

## Search Path

`search_path=""` (empty)

## ACL

| Role | EXECUTE |
|------|---------|
| PUBLIC | false |
| anon | false |
| authenticated | true |

## Auth / Roles / Tenant / Lock / Return

Live body matches authored migration: `auth.uid()`, profile lookup, owner/admin/manager/super_admin allow, FOR UPDATE, DB `image_url` capture, scoped cleanups, no Storage, no client business_id.

# Role Matrix

| Principal | Evidence |
|-----------|----------|
| owner | RUNTIME — raw DENY / RPC ALLOW (role toggle in rolled-back tx) |
| admin | RUNTIME — archive UPDATE + RPC delete ALLOW; raw DENY |
| manager | RUNTIME — RPC ALLOW (role toggle in rolled-back tx) |
| operator | RUNTIME — RPC FORBIDDEN; raw DENY |
| viewer | RUNTIME — RPC FORBIDDEN (role toggle); raw DENY |
| super_admin | SOURCE-LIVE — function allows + lock without business filter; no merchant role mutation |
| foreign manageProducts | RUNTIME — `deleted=false` non-leak; target unchanged |
| anon | RUNTIME — EXECUTE denied / permission denied |

# Archive Runtime QA

| Check | Result |
|-------|--------|
| update | PASS |
| availability forced false | PASS |
| preserved id/sku/stock/image | PASS |
| public hidden | PASS |
| admin readable | PASS |
| SKU reserved (unique violation) | PASS |

# Restore Runtime QA

| Check | Result |
|-------|--------|
| same id | PASS |
| availability remains false | PASS |
| sku/stock/image preserved | PASS |
| public still hidden while unavailable | PASS |

# SKU Archive Reservation

Same-business duplicate SKU while archived → `products_business_sku_uidx` unique violation **PASS**

# Raw Delete Runtime QA

owner/admin/manager semantics via admin+owner toggle, operator, anon → **0 rows deleted** **PASS**

# Permanent Delete — Active Runtime QA

| Check | Result |
|-------|--------|
| RPC deleted=true | PASS |
| image_url handoff exact | `qa://lifecycle/delete-handoff.png` |
| product gone | PASS |
| stock_movements gone | PASS |
| control stock preserved | PASS |
| overrides gone | PASS |
| product assignment gone | PASS |
| category assignment survives | PASS |
| shared customization groups survive | PASS |
| upsell items for target gone | PASS |
| product-target upsell group gone | PASS |
| category upsell survives | PASS |
| other upsell item survives | PASS |
| category preserved | PASS |
| control product preserved | PASS |
| SKU free after delete | PASS |

# Permanent Delete — Archived Runtime QA

Archive then RPC without restore → `deleted=true` **PASS**

# Historical Order Preservation

| Field | Result |
|-------|--------|
| order | exists |
| order_item | exists |
| product_id | NULL |
| product_name | `SNAPSHOT NAME KEEP` unchanged |
| unit_price | 12.50 unchanged |
| quantity | 2 unchanged |
| customization_snapshot | `{"qa":true,"note":"keep"}` unchanged |

# Customization Cleanup

product-target assignment removed; category-target assignment + group definitions preserved; overrides CASCADE removed.

# Upsell Cleanup

item refs to deleted product removed; product-targeted group removed; category-targeted group + other items preserved.

# Stock Movement Cleanup

product-scoped only; control product movement preserved.

# Image Handoff

RPC returned exact pre-delete synthetic URL. Storage uploads/deletes: **0**.

# Idempotency

Second RPC call → `deleted=false`, null ids/url, no error **PASS**

# Atomicity

| Field | Result |
|-------|--------|
| real RPC rollback | **PROVEN** (caught `ORDEROPS_EXPECTED_ATOMICITY_PROBE` after successful delete inside PL/pgSQL subtransaction) |
| internal mid-step failure injection | **NOT INJECTED** |
| fixture restored | product + stock + assignment + upsell + override + order_item **PASS** |

# Mixed Order Restock

| Check | Result |
|-------|--------|
| A deleted | PASS |
| A restock | 0 |
| B survives | PASS |
| B restock | stock 9→10 + `order_restock` movement; `restocked_items=1` |
| order cancel | SUCCESS via `transition_order_status` |

# Cancel After Delete

Order cancelled; deleted product not recreated; deleted-product stock/ledger not restored; surviving product restocked.

# Existing Data Safety

Migration business-row delta: **0**  
Existing merchant mutations: **0**  
Pre-existing QA RLS fixtures (`QA RLS OFF *`) left untouched (not created by this phase).

# Fixture Reconciliation

All destructive QA inside `BEGIN … ROLLBACK`  
Targeted QA fixture residue: **0**  
Global counts unchanged vs pre-apply: products 20, orders 77, order_items 160, stock_movements 60

# Migration Hash

pre = post = frozen = `5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57`

# Function Fingerprint

`md5(pg_get_functiondef)` = `81f2046de539d43db38aa583574d5486`

# Verification

| Check | Result |
|-------|--------|
| focused lifecycle db-author verify | PASS |
| manage-role RLS verify | PASS |
| git diff --check (migration) | PASS |
| migration SHA | identical |

# Persistent Data Delta

schema/RLS/RPC/history: expected lifecycle only  
QA residue: 0  
Storage: 0  
runtime source: 0  
commit/push/deploy: 0

# Runtime Changes = 0

No UI / actions / CSS / application feature implementation.

# Next

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-IMPLEMENTATION-1**

# Release

**COMMIT / PUSH / DEPLOY: PAUSED**
