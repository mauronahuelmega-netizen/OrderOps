# ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-1

# Result

**PASS WITH HEIC REAL-DEVICE QA DEBT** (2026-09-10)

Owner roadmap insertion: authorized before PROD-P3-16.

# Baseline

image lifecycle: FROZEN / PRESERVED (local source)  
DELETE policy: `product_images_delete_own_business` LIVE / UNCHANGED  
production distinction: new lifecycle + optimizer **LOCAL / UNDEPLOYED**; production runtime **LEGACY UNTIL RELEASE**

# Architecture

normal images: File → crop (unchanged) → `optimizeProductImage` (decode → Pica resize → WebP) → staged File  
HEIC: lazy `import("heic-to")` before crop preview + same optimizer path after crop

# Dependencies

pica: `^10.0.3` — **MIT**  
HEIC decoder: `heic-to` `^1.5.2` — **LGPL-3.0** (preferred candidate; dynamically imported)  
`@types/pica`: `^9.0.5` (dev)

# Output Contract

format: `image/webp` / `*.webp`  
max dimension: 800 (then 720 / 640 bounded fallback)  
initial quality: 0.80 (floor ~0.60, ≤5 quality attempts / dimension)  
target: ≤90 KiB  
minimum size: **not enforced** / no padding  
metadata: re-encoded; EXIF/GPS not preserved

# Lifecycle Integration

crop: preserved (1:1 modal)  
staging: optimized WebP File in existing pending ref + object URL preview  
Save: existing upload once + lifecycle  
KEEP: no optimize / no upload  
REPLACE: optimize once on crop confirm / upload once on Save  
REMOVE: no optimize / no upload  
failed save: existing cleanup path unchanged  
SKU retry: optimization outside retry (staged File reused)

# Runtime QA

| fixture | input | output | dimensions | bytes | result |
|---------|-------|--------|------------|-------|--------|
| landscape JPEG | 2400×1800 · 77167 B | WebP File | 800×600 | 3052 B | PASS |
| portrait JPEG | 1200×1800 · 41821 B | WebP File | 533×800 | 3176 B | PASS |
| empty/invalid | 0 B | domain error | — | — | PASS |
| HEIC real device | — | — | — | — | **DEBT** |

Pre-submit Storage requests during optimize: **0**  
DB mutations during optimize: **0**

# Verification

targeted: **PASS**  
mutation A (800→1200): **FAIL then restored**  
mutation B (webp MIME→jpeg): **FAIL then restored**  
tsc: **PASS**  
diff-check: **PASS**  
browser bundle (esbuild + Chrome): **PASS** (pica + lazy HEIC import path)

# Boundaries

DB/RLS/Storage policies: **UNCHANGED**  
lifecycle migration: **UNTOUCHED**  
image delivery / next.config / ProductCard: **UNTOUCHED**  
historical images: **UNTOUCHED**  
commit/push/deploy: **none**

# QA Debt

HEIC real-device fixture QA: deferred  
`heic-to` LGPL-3.0: documented; keep monitoring commercial redistribution notes

# Next

**ADMIN-PRODUCTS-AVAILABILITY-TOGGLE-ERROR-FEEDBACK-1** (PROD-P3-16)
