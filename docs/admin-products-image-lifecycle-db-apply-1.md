# ADMIN-PRODUCTS-IMAGE-LIFECYCLE-DB-APPLY-1

# Result

**PASS** (2026-09-10) — resume after interrupt: remote apply already complete (Case A); no re-apply.

# Target

project: OrderOps `pkrsedmwxekbhlohhqds`  
migration (local): `supabase/migrations/20260910022504_product_images_delete_lifecycle.sql`  
hash: `83A48B1BFEDD98F9BC2469D6E33AC9E145E5B3ED2FEFE5D55C6533E40DAFC789` (pre = post)

# Policy

name: `product_images_delete_own_business`  
operation: DELETE  
bucket: `product-images` only  
tenant: folder `[1] = profiles.business_id` + folder shape length 2 + non-empty product folder/filename  
roles: `owner | admin | manager` (parity with live INSERT/UPDATE)  
history: remote `20260910040100_product_images_delete_lifecycle` exactly once · collateral **0**

# QA Probes

products: `__QA_IMAGE_LIFECYCLE_0910r1_A` / `_B` (unavailable, track_stock=false, stock=0)  
objects: `qa-a|b|c-0910r1.jpg` under canonical `businessId/productId/`  
public availability: **false** (never catalog-visible)

# Lifecycle Matrix

| case | expected | result |
|------|----------|--------|
| KEEP | image_url + OBJECT_A unchanged | **PASS** |
| REPLACE | upload B → DB→B → cleanup A | **PASS** |
| FAILED REPLACE | upload C → DB fail (SKU 23505) → keep B → cleanup C | **PASS** |
| SHARED REFERENCE | A null + cleanup → skipped_referenced; B keeps OBJECT_B | **PASS** |
| REMOVE | B DB null → cleanup OBJECT_B deleted | **PASS** |

# Ordering

replace: `UPLOAD:B` → `REPLACE:DB_NOW_B` → `REPLACE:CLEANUP_A=deleted`  
remove: `REMOVE:DB_NULL` → `REMOVE:CLEANUP=deleted`

# Cleanup

probe products: **0** remaining  
probe objects: **0** remaining  
product count pre/post: **20 → 20**  
product-images objects: **49 → 49**  
existing catalog (Coca Cola image / Sprite SKU): unchanged

# Debts

PROD-P3-14: **CLOSED**  
PROD-P3-15: **CLOSED FOR FORWARD LIFECYCLE**  
historical orphans: **DEFERRED / NOT EXECUTED** (prior census preserved: 49 / ref 18 / unref 31 / tmp 2)

# Production Distinction

policy: **LIVE** (DELETE authorization)  
new lifecycle source: **LOCAL / UNDEPLOYED**  
production runtime: **LEGACY UNTIL RELEASE**

# Verification

targeted lifecycle verify: **PASS**  
git diff --check: **PASS**  
migration hash immutable: **PASS**  
role predicate matrix (rolled back): owner/admin/manager **ALLOW**; operator/viewer/foreign/anon **DENY**  
DELETE vs UPDATE USING: semantic parity confirmed via `pg_policies`

# Boundaries

runtime edits this phase: **0**  
RLS products / stock / SKU: **UNCHANGED**  
public catalog / historical orphans: **UNTOUCHED**  
commit / push / deploy: **none**

# Next

**ADMIN-PRODUCTS-AVAILABILITY-TOGGLE-ERROR-FEEDBACK-1** (PROD-P3-16)
