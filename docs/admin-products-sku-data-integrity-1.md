# ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-1

## Result

**PASS WITH DB APPLY REQUIRED** (2026-09-09)

## Debt

exact PROD-P3 id: **PROD-P3-12**  
root cause: auto SKU used category product `count+1` with **no unique index** on `(business_id, sku)`

## Current Contract

nullable: **yes** (`sku text`)  
manual create: **yes** (form field; empty → auto)  
editable: **yes** (Edit SKU field)  
auto format: **`{PREFIX}-{NNN}`** — PREFIX = first 1–3 uppercase alphanumerics from category name (NFD strip; fallback `CAT`); NNN zero-padded to ≥3

## Live Census

project: `pkrsedmwxekbhlohhqds` (`.env.local` host match)  
total: **20**  
null: **17**  
not null: **3** (`BEB-002`, two `QA-RLS-OFF-*` manuals)  
blank / whitespace-only: **0**  
exact same-tenant duplicates: **0**  
case-fold duplicates: **0** (informational)

## Integrity Contract

Unique partial index: `(business_id, sku) WHERE sku IS NOT NULL`  
Cross-tenant same SKU: allowed  
Multiple NULL SKUs: allowed  
Case: exact stored value (no `lower(sku)` uniqueness)

## Implementation

generator: `lib/products/product-sku.ts` — max auto-sequence for category prefix + 1  
retry: auto-create only, **3** attempts on SKU unique violation  
manual duplicate: domain `"Ya existe un producto con ese SKU."`  
edit duplicate: same domain error; no silent rename  
exhausted auto: `"No pudimos generar un SKU único. Intentá nuevamente."`  
side effects: revalidate only after successful insert

## Migration

file: `supabase/migrations/20260910010123_products_sku_unique_integrity.sql`  
index: `products_business_sku_uidx`  
remote: **NOT APPLIED**

## Verification

targeted: **PASS**  
mutation-test: count-like generator **FAIL**; missing `business_id` index assert **FAIL**; restored **PASS**  
tsc: **PASS**  
diff: **PASS**  
local DB: **NOT RUN / .env.local → remote**

## Boundaries

No CSS/UI/flyout/collection. No RLS/stock. No existing SKU rewrite. No product mutations. No remote DDL.

## Next

**ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-DB-APPLY-1**
