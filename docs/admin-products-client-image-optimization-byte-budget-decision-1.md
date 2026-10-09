# ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-BYTE-BUDGET-DECISION-1

## Result

**PASS — BYTE BUDGET CONTRACT DECIDED**

Runtime source changes: **0**  
Verify changes: **0**  
DB / Storage: **UNCHANGED**

---

## Trigger

| Field | Value |
|-------|-------|
| real photo | architectural relief JPEG · 1024×1024 · 1.317 MiB |
| output | WebP **640×640 · 135.43 KiB** after full fallback 800→720→640 |
| visual | ACCEPTABLE / GOOD |
| previous contract (QA gate) | treated ≤90 KiB as hard release gate → Real-Asset QA **BLOCKED** |

Historical evidence preserved in:
`docs/admin-products-client-image-optimization-real-asset-qa-1.md`  
(result remains **REAL-ASSET QA BLOCKED** under the old gate).

---

## Decision

| Level | Rule |
|-------|------|
| Preferred target | **≤90 KiB** — optimizer continues attempting this first |
| Accepted quality-preserving outlier | **>90 KiB and ≤150 KiB** — only after existing bounded strategy is exhausted |
| Hard miss | **>150 KiB** — not silently accepted; requires a future scoped decision |

90 KiB is a **preferred / normal target**, not a universal hard maximum.  
150 KiB is an **outlier ceiling**, not the new optimizer aim.

---

## Quality Floor

| Floor | Value | Authorization |
|-------|-------|---------------|
| dimension | **640px** (`PRODUCT_IMAGE_MIN_DIMENSION_FALLBACK`) | frozen — no 576/512 |
| quality | **0.60** (`PRODUCT_IMAGE_MIN_QUALITY`) | frozen — no lower floor |
| reason | Real-Asset QA produced a merchant-usable 135.43 KiB image at this floor |

Further degradation requires a separate product decision.

---

## Interpretation of Previous QA

**135.43 KiB @ 640×640** → **ACCEPTED UNDER NEW CONTRACT**  
(quality-preserving outlier: >90 and ≤150)

Pipeline itself was never broken (synthetic 10.3 MiB → 34.54 KiB; heavy PNG → 36.86 KiB; pre-submit Storage 0).

---

## Architecture

| Topic | Decision |
|-------|----------|
| single optimized object | **preserved** |
| dual derivative (thumb + detail) | **DEFERRED / NOT INTRODUCED** |
| delivery transforms / billing | separate — `ADMIN-PRODUCTS-IMAGE-DELIVERY-RECONCILIATION-1` remains **BLOCKED / ACCEPTED INFRA** |

---

## Runtime Compatibility

Inspected `lib/products/product-image-optimization.ts`:

- `PRODUCT_IMAGE_TARGET_BYTES = 90 * 1024` (preferred attempt)
- dimensions `[800, 720, 640]`; qualities `[0.8 … 0.6]`
- if target missed: returns **`bestOverall`** (smallest blob) — does **not** throw/reject on >90 KiB

Inspected `admin-products-client-image-optimization.verify.ts`:

- asserts preferred target constant and bounded steps
- does **not** hard-require every runtime output ≤90 KiB

**No contract-fix phase required.**

---

## Remaining QA

| Debt | Status |
|------|--------|
| Real phone JPEG ~3–10 MiB (e.g. ~2296×4080 / ~8.5 MB) | **STILL OPEN** → `ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-REAL-ASSET-QA-2` |
| HEIC real-device | **ACCEPTED QA DEBT** |

---

## Runtime

| Area | Result |
|------|--------|
| source changes | **0** |
| verify changes | **0** |
| DB / RLS | **UNCHANGED** |
| Storage policies | **UNCHANGED** |

---

## Next

**ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-REAL-ASSET-QA-2**  
(genuine phone-class JPEG ~3–10+ MiB; apply two-level byte contract)

Then, if PASS: **ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1**

No commit. No push. No deploy.
