# ADMIN-PRODUCTS-IMAGE-LIFECYCLE-1

## Result

**PASS WITH DB APPLY + MUTATION QA REQUIRED** (2026-09-10)

## Debts

PROD-P3-14: **IMPLEMENTED IN SOURCE** (staged `Quitar imagen`)  
PROD-P3-15: **FORWARD LIFECYCLE IMPLEMENTED / STORAGE DELETE POLICY APPLY REQUIRED**

## Previous Lifecycle

crop upload timing: eager Storage upload on crop  
Create path: `businessId/tmp-product-*/file`  
Edit: replace via eager upload + `image_url` string  
remove: none  
DELETE policy: absent

## New Lifecycle

crop: local `File` / object URL until Submit  
submit upload: once, outside SKU retry  
Create path: `businessId/productId/file` (draft UUID)  
keep / replace / remove: explicit `image_intent`  
replace: upload new → DB update → clean old  
remove: DB `image_url = null` → clean old  
cleanup: tenant parse + unreferenced guard; failure after save stays success

## Storage Census

objects: **49** · referenced: **18** · unreferenced: **31**  
tmp total: **2** · tmp referenced: **1** · tmp unreferenced: **1**  
missing references: **0** · shared refs: **0**  
Historical orphan cleanup: **DEFERRED**

## Migration

file: `supabase/migrations/20260910022504_product_images_delete_lifecycle.sql`  
policy: `product_images_delete_own_business` (owner/admin/manager + tenant folder)  
remote: **NOT APPLIED**

## Runtime

remove-discard @390: **PASS** (Quitar → placeholder; 0 Storage/product hits; Escape close)  
reopen original image: **PASS** (source contract: intent discarded on unmount; DB unchanged)  
crop local preview: source-proven (crop modal returns `File`; create/edit `processImage`/`handleCroppedImage` set pending only)  
pre-submit storage writes: **0** (source + verify)  
product/image mutations QA: **0**

## Verification

targeted: **PASS**  
mutation A (tmp-product): **FAIL then restored**  
mutation B (unreferenced guard): **FAIL then restored**  
tsc: **PASS**  
diff: **PASS**

## Safety

historical deletes: **0**  
product mutations: **0**  
image mutations during QA: **0**

## Remaining

historical orphan remediation: deferred  
image delivery/transforms: blocked separately  
DELETE policy live apply + mutation QA: next phase

## Next

**ADMIN-PRODUCTS-IMAGE-LIFECYCLE-DB-APPLY-1**
