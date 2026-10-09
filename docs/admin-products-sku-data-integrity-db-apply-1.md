# ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-DB-APPLY-1

## Result

**PASS** (2026-09-09)

## Target

project: `pkrsedmwxekbhlohhqds` (`https://pkrsedmwxekbhlohhqds.supabase.co`; `.env.local` match)  
migration: `supabase/migrations/20260910010123_products_sku_unique_integrity.sql`  
hash: `8A493BC4BD1D196DD5F962518B922C4653AEE8FF798EECD256C196CB0DF2F10E` (pre = post)

## Pre-Apply Census

products: **20**  
null: **17**  
non-null: **3**  
blank / whitespace: **0**  
duplicates: **0**  
case-fold: **0** (informational)

## Source Alignment

new generator namespace: **business-wide** (`eq(business_id)` + pure prefix parse; not category-scoped)  
legacy producer: **HEAD `c9af635…` count+1 by category** (working tree undeployed)  
legacy immediate collisions: **0** (8 categories evaluated)  
duplicate-prefix groups: **0**  
transient legacy risk: category-local sequences can still converge until new runtime deploys; index prevents corruption

## Apply

status: **APPLIED** via single-migration API (`apply_migration`)  
remote history: `20260910014445_products_sku_unique_integrity` (**exactly once**)  
collateral migrations: **0**

## Index

name: `products_business_sku_uidx`  
columns: `business_id`, `sku`  
predicate: `sku IS NOT NULL`  
unique / valid / ready: **true / true / true**  
no `lower`/`upper`/`btrim` expression

## DB Matrix

| case | expected | result |
|------|----------|--------|
| 1 same-business first SKU | ALLOW | PASS |
| 2 same-business duplicate | DENY 23505 `products_business_sku_uidx` | PASS |
| 3 cross-business same SKU | ALLOW | PASS |
| 4 multiple NULL same business | ALLOW both | PASS |
| 5 `Case-Probe` vs `case-probe` | ALLOW both (exact) | PASS |

Forced `SKU_MATRIX_ROLLBACK_OK` abort → no commit.

## Data Safety

probe rows: **0**  
existing SKU mutations: **0**  
product count pre/post: **20 → 20** (null 17 / non-null 3 unchanged)

## Production Distinction

DB invariant: **LIVE**  
deployed producer: **legacy count+1** until release  
new producer source: **LOCAL / UNDEPLOYED**  
retry (3) + manual/edit domain errors: **LOCAL / UNDEPLOYED**

## Debt

PROD-P3-12: **CLOSED AT DATA-INTEGRITY LAYER**  
APP PRODUCER IMPROVEMENT: **IMPLEMENTED LOCALLY / DEPLOY PENDING**

## Verification

targeted: **PASS**  
diff: **PASS**  
migration hash: **unchanged**

## Next

Image lifecycle debts **PROD-P3-14** + **PROD-P3-15** (living audit). No named `ADMIN-PRODUCTS-IMAGE-LIFECYCLE-*` phase in roadmap; `ADMIN-PRODUCTS-IMAGE-DELIVERY-RECONCILIATION-1` remains **blocked** on transform auth tokens.
