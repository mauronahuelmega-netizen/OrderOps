# ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-800-FIRST-SELECTION-1

## Result

**PASS** — 800-first quality-preserving selection closed.

Preferred ≤90 KiB remains the target; ≤150 KiB is the quality-preserving outlier ceiling; largest valid dimension is kept before shrinking solely to chase ≤90.

## Previous Selection

Dimension ladder 800 → 720 → 640 with quality 0.80 → 0.60.

Algorithm chased ≤90 KiB across dimensions, then returned `bestOverall` (smallest size).

Consequence: an 800 / 720 candidate in the >90 and ≤150 band could still be discarded in favor of a smaller dimension that hit ≤90 (or a smaller `bestOverall`).

## New Selection Contract

Preferred target:
≤90 KiB (`PRODUCT_IMAGE_TARGET_BYTES`)

Outlier ceiling:
≤150 KiB (`PRODUCT_IMAGE_OUTLIER_MAX_BYTES`) — not a target

Dimension priority:
largest valid allowed dimension first (800 → 720 → 640; no upscale)

Quality priority:
at a dimension, try ≤90 across the quality ladder; if none, keep the **highest-quality** ≤150 candidate (first hit while qualities descend)

Hard miss behavior:
if every bounded candidate is >150, preserve existing `bestOverall` (no new throw / form rejection)

## Algorithm

Per dimension (descending):

1. Encode qualities high → low.
2. Track `bestOverall` (smallest size; tie → higher quality).
3. On size ≤90 → return immediately (preferred).
4. Else on first size ≤150 → remember as `bestAcceptableOutlier` (highest quality); keep searching for ≤90.
5. After ladder: if outlier remembered → return it (do not shrink).
6. Else try next smaller dimension.
7. Exhausted → return `bestOverall`.

Pure seam: `selectLargestDimensionFirstCandidate` in `lib/products/product-image-optimization.ts`.
Runtime encode path mirrors the same rules in `encodeBoundedWebp`.

## Deterministic Matrices

A:
800 reaches ≤90 at q.60 → **800 / 0.60 / preferred** (not early ≤150 outlier)

B:
800 has ≤150 outlier, 720 has ≤90 → **800 / 0.75 / outlier** (not 720)

C:
800 all >150; 720 reaches ≤90 → **720 / 0.60 / preferred**

D:
800/720 all >150; 640 highest-quality ≤150 → **640 / 0.80 / outlier**

E:
all >150 → **bestOverall** (smallest; here 640 / 0.60)

## Mutation Probes

A:
disable return of ≤150 outlier → fall through to smaller dim → focused verify **FAIL** (MATRIX B) → restored → **PASS**

B:
overwrite ≤150 outlier with lowest-quality instead of first/highest → verify **FAIL** (0.6 ≠ 0.75) → restored → **PASS**

C:
return first ≤150 immediately without finishing ≤90 search → verify **FAIL** (MATRIX A) → restored → **PASS**

## Runtime Photographic Reprobe

fixture:
`C:\Users\Oasis Desktop\Desktop\screenshots\image_1f4daa9.jpg` (1024×1024 · ~1.317 MiB)

old:
640×640 · 135.43 KiB WebP (prior strategy; chased ≤90 then `bestOverall`)

new:
640×640 · **146.56 KiB** WebP · ~2166 ms · band **outlier ≤150** · selected quality **0.70** (highest ≤150 at 640)

Candidate dump (Chrome / Pica / WebP):

| dim | q.80 | q.75 | q.70 | q.65 | q.60 |
|-----|------|------|------|------|------|
| 800 | 250.56 | 220.93 | 213.85 | 202.80 | 196.72 | all >150 |
| 720 | 212.29 | 186.64 | 178.95 | 171.20 | 165.08 | all >150 |
| 640 | 173.13 | 152.71 | **146.56** | 140.73 | 135.71 | first ≤150 at q.70 |

800 fallback **not** available (all 800 >150) — 640 retention is legitimate under the contract.

visual:
orientation correct; square crop plane; no black matte; fine relief detail preserved; merchant-usable catalog quality — **ACCEPTABLE / GOOD**

## Lifecycle Safety

pre-submit upload: **0 / preserved**
Save-time upload: **ONLY / preserved**
crop → optimize → staged optimized File: **unchanged**
Storage / DB: **0 mutations this phase**

## Verification

optimizer:
PASS (`admin-products-client-image-optimization.verify.ts`)

lifecycle:
PASS (`admin-products-image-lifecycle.verify.ts`)

tsc:
PASS (`npx tsc --noEmit`)

diff:
PASS (`git diff --check` on phase files)

## Accepted Debt

phone JPEG:
**DEFERRED / ACCEPTED NON-BLOCKING QA DEBT / NOT EXECUTED** — owner decision; not marked PASS

HEIC:
ACCEPTED QA DEBT

Image Delivery:
BLOCKED / ACCEPTED INFRA

historical orphans:
DEFERRED

ESLint:
KNOWN TOOLING DEBT

## Runtime Scope

MODIFIED:
- `lib/products/product-image-optimization.ts`
- `lib/products/admin-products-client-image-optimization.verify.ts`

DOCS:
- NEW `docs/admin-products-client-image-optimization-800-first-selection-1.md`
- `docs/CURRENT_PHASE.md`
- `docs/products-living-audit.md`
- `ORDEROPS_LIVING_MEMORY.md` (handoff: phone QA no longer blocks release)

UNCHANGED:
forms, CSS, actions, Storage helpers, image-loader, next.config, package.json/lockfile, DB, migrations, RLS

## Release Decision

**READY FOR ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1**

No commit. No push. No deploy in this phase.

## Next

`ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1`
