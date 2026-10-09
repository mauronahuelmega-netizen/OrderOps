# ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-AUTHOR-1

**Date:** 2026-09-16  
**Gate:** PASS — ARCHIVE LIFECYCLE DB MIGRATION AUTHORED / NOT APPLIED  
**Evidence:** STATIC (migration + focused verify + probes) · LIVE READ-ONLY introspection for baseline policies/grants

# Result

Migration authored for soft-archive schema/RLS foundation. **Remote apply = 0.** Runtime UI/actions = 0. Business-data mutations = 0.

# Preflight

- branch: `main`
- HEAD: `c9af635e27ad86e0731eea0a90b16b9b628d5aa6`
- Pre-existing Products dirty worktree: **preserved**
- This phase delta: migration + focused verify + docs only

# Approved Contract

From ADMIN-PRODUCTS-PRODUCT-REMOVAL-CONTRACT-DECISION-1 (PASS):

- V1 = **SOFT ARCHIVE + RESTORE**
- `archived_at timestamptz NULL`
- archive forces unavailable; restore clears `archived_at`, stays unavailable
- hard delete deferred
- SKU reserved across archive
- images/customizations/category preserved

# Current Schema Evidence

Live `products` had no `archived_at` (columns: id, business_id, category_id, name, description, price, image_url, is_available, created_at, sku, stock, track_stock).  
SKU index: `products_business_sku_uidx (business_id, sku) WHERE sku IS NOT NULL`.  
Stock trigger: `tr_auto_suspend_out_of_stock` (untouched).

# Current RLS Evidence

| Policy | Command | Role | Notes |
|--------|---------|------|-------|
| products_select_available_public | SELECT | anon | was `is_available` + active business |
| products_select_own_business | SELECT | authenticated | tenant / super_admin — **no archive filter** |
| products_insert_own_business | INSERT | authenticated | manageProducts roles |
| products_update_own_business | UPDATE | authenticated | manageProducts roles |
| products_delete_own_business | DELETE | authenticated | manageProducts — **removed in authored migration** |

Grants: `authenticated`/`anon` retain table-level DELETE privilege (Supabase default). With RLS on and **no DELETE policy**, ordinary sessions cannot delete. `service_role` bypasses RLS → maintenance DELETE retained.

# Migration Delta

path: `supabase/migrations/20260916180000_products_archive_lifecycle.sql`  
SHA256: `55f187f5b4362723ba1e4e3659a90769cc75d57ea61b615f79d2505e89db88bb`  
applied: **NO**

# archived_at

`timestamptz NULL` via `ADD COLUMN IF NOT EXISTS`. No backfill. Existing rows remain NULL (active).

# Lifecycle Check

`products_archived_requires_unavailable`:  
`CHECK (archived_at IS NULL OR is_available = false)`  
Forbidden: archived + available.

# Public SELECT

Recreated `products_select_available_public` with:

- `is_available = true`
- **`archived_at IS NULL`**
- active business exists

# Admin SELECT

`products_select_own_business` **not modified** — archived rows remain readable for Estado → Archivados.

# Hard DELETE

`DROP POLICY IF EXISTS "products_delete_own_business"`.  
No replacement authenticated DELETE policy/RPC.  
super_admin authenticated DELETE path also removed (acceptable under deferred purge).  
service_role maintenance DELETE: not broken (RLS bypass).

# UPDATE / INSERT

Unchanged (not dropped/recreated). Archive/restore will use role-gated UPDATE.

# SKU Reservation

`products_business_sku_uidx` untouched — **no** `archived_at` predicate. SKU remains reserved while archived.

# Index Decision

`products_business_created_at_active_idx` on `(business_id, created_at DESC) WHERE archived_at IS NULL`  
Justified by current admin list: tenant scope + `order("created_at", { ascending: false })`.  
No archive-view index (expected small cardinality).

# Foreign Keys

Unchanged (order_items SET NULL, stock_movements RESTRICT, overrides CASCADE, upsell RESTRICT, category RESTRICT, polymorphic assignments).

# Stock / Availability

Trigger/function not redefined. Coexists with CHECK.

# Unified Edit RPC Compatibility

`save_product_edit_draft` does not know `archived_at`. It can still UPDATE an archived product if called with a product_id (app will make archived Edit read-only in IMPLEMENTATION-1).  
If a caller sets `is_available=true` while `archived_at` set → **CHECK rejects**. Contained; no RPC edit in this phase.

# Images / Storage

No Storage policy or image_url mutation.

# Customizations / Assignments

No table mutations. Archive keeps product row → no cascade/orphan.

# Migration

Author-only forward file. Idempotent-friendly: `IF NOT EXISTS` column/index, `DROP POLICY IF EXISTS` + recreate public SELECT, drop delete policy.

# Focused Verification

`lib/products/admin-products-product-removal-archive-db-author.verify.ts` — **PASS**

# Mutation Probes

| Probe | Result |
|-------|--------|
| A remove public `archived_at IS NULL` | FAIL_OK → restore PASS |
| B SKU unique with archived reuse predicate | FAIL_OK → restore PASS |
| C reintroduce authenticated DELETE policy | FAIL_OK → restore PASS |
| D remove lifecycle CHECK | FAIL_OK → restore PASS |

# DB Apply Plan

Next phase **ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-APPLY-1** must prove:

1. `archived_at` live / nullable  
2. existing products preserved / `archived_at` NULL  
3. CHECK live  
4. archived+available rejected  
5. public available non-archived visible  
6. public archived invisible  
7. admin owner archived SELECT allowed  
8. manager archived SELECT allowed  
9. operator/viewer mutative deny unchanged as appropriate  
10. authenticated owner/admin/manager hard DELETE denied  
11. foreign tenant hard DELETE denied  
12. anon hard DELETE denied  
13. service-role DELETE semantics understood (bypasses RLS)  
14. archive atomic UPDATE possible (`archived_at=now()`, `is_available=false`)  
15. restore atomic UPDATE possible (`archived_at=null`, `is_available=false`)  
16. restore leaves unavailable  
17. SKU remains reserved while archived  
18. stock trigger unchanged  
19. category FK unchanged  
20. order_items FK unchanged  
21. stock_movements RESTRICT unchanged  
22. overrides preserved  
23. assignments preserved  
24. partial index present  
25. public policy exact  
26. no pre-existing row content changed (beyond NULL archived_at default)  
27. migration applied exactly once  
28. migration hash matches authored file  
29. no collateral migrations  
30. probe rows restored / net delta 0  

# Data Safety

products/order_items/stock_movements/overrides/assignments/upsells/categories/profiles/Storage/orders: **0**  
schema remote / RLS remote / migration history remote: **0**

# Runtime Changes = 0

No `.tsx` / app `.ts` / CSS edits.

# Next

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-APPLY-1**

# Release

COMMIT/PUSH/DEPLOY: **PAUSED**
