# ADMIN-PRODUCTS-VERIFY-CORPUS-RECONCILIATION-1

## Result

**PASS — PRODUCTS VERIFY CORPUS RECONCILED**

Corpus: **12/12 PASS**  
Runtime permanent edits: **0**

---

## Baseline

Final QA: **PASS WITH ACCEPTED NON-BLOCKING DEBT** (`ADMIN-PRODUCTS-FINAL-FUNCTIONAL-VISUAL-QA-1`)  
corpus: **10/12 PASS** (historical evidence preserved in Final QA doc)  
stale failures:

1. `lib/products/admin-products-image-lifecycle.verify.ts`
2. `lib/products/admin-products-mobile-card-image-aspect-ratio-fix.verify.ts`

Classification (Final QA): **B — STALE ASSERTION**

---

## Reconciliation

### Image Lifecycle Verify

old assertion: staged `pendingImageFileRef` may be `croppedFile` / raw `file` (pre-optimizer contract)  
current contract: crop → `optimizeProductImage(croppedFile)` → stage `optimized` → Save-time upload only  
new assertion:

- Create/Edit `handleCroppedImage` must call `optimizeProductImage(croppedFile)`
- `pendingImageFileRef.current = optimized`
- forbid `pendingImageFileRef.current = croppedFile` inside crop handler
- no `.upload(` inside crop handler
- submit still reads `pendingImageFileRef.current` for upload
- KEEP / REMOVE / REPLACE + SKU-retry / no-eager-upload contracts preserved

Does **not** duplicate compression internals (owned by client-image-optimization verify).

### Card Aspect Verify

old assertion: absolute forbid of `.media { align-self: stretch }` (+ obsolete shell height forbid)  
current contract: height-derived square — stretch allowed; durable invariant is **1:1 + cover + bounded media**  
new assertion:

- `.media` declares `aspect-ratio: 1 / 1` + `max-*` bounds
- stretch allowed (not forbidden)
- `.imageShell` fills frame (`inset: 0` / 100%)
- `.image` uses `object-fit: cover` (no `contain`)
- collection / operational / interaction freezes unchanged

---

## Mutation Probes

lifecycle: temporary `pendingImageFileRef.current = croppedFile` in Create → **FAIL** → restored → **PASS**  
aspect: temporary removal of `.media` `aspect-ratio: 1 / 1` → **FAIL** → restored → **PASS**

---

## Full Corpus

passed: **12**  
failed: **0**

---

## Static

tsc: **PASS**  
diff: **PASS** (`git diff --check`)  
build: **NOT RUN** — Final QA PASS / runtime unchanged  
lint: **NOT RUN** — known tooling debt

---

## Runtime Safety

runtime source edits (permanent): **0**  
CSS edits (permanent): **0**  
DB: **UNCHANGED**  
browser QA: **NOT RUN**

---

## Docs

living audit: minimal current-debt close (verify corpus)  
living memory: handoff fact updated to 12/12  
dashboard audit: **NO CHANGE**  
Final QA doc: **UNCHANGED** (historical 10/12 preserved)

---

## Next

**ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1**

No commit. No push. No deploy.
