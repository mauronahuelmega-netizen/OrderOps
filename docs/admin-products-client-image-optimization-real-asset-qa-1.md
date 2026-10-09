# ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-REAL-ASSET-QA-1

## Result

**REAL-ASSET QA BLOCKED — BYTE BUDGET MICROFIX/DECISION REQUIRED**

Runtime source edits: **0**  
Repo image fixtures added: **0**  
No commit / push / deploy.

Primary business gate (real photographic JPEG ≤90 KiB) **FAILED** after full bounded fallback.

---

## Baseline

- Final QA: PASS WITH ACCEPTED NON-BLOCKING DEBT (real camera JPEG debt open)
- Verify corpus reconciliation: PASS / 12/12
- Client optimizer: FROZEN (Pica → WebP ≤800; normal target ≤90 KiB; Save-time upload only)
- Image lifecycle: FROZEN

---

## Fixtures

All fixtures copied under `%TEMP%\\orderops-real-asset-qa` (outside repo).

### JPEG — heavy (user / Desktop `10mb-example-jpg.jpg`)

| Field | Value |
|-------|-------|
| source | ExampleFile.com synthetic banner (NOT a camera photograph) |
| MIME | image/jpeg |
| dimensions | 11384 × 4221 |
| bytes | 10 809 064 (10.308 MiB) |
| real camera | **NO** |
| orientation | landscape graphic (correctly decoded) |

### JPEG — real photographic (Desktop `screenshots/image_1f4daa9.jpg`)

| Field | Value |
|-------|-------|
| source | Real architectural/sculptural relief photograph (high spatial frequency) |
| MIME | image/jpeg |
| dimensions | 1024 × 1024 |
| bytes | 1 380 954 (1.317 MiB) |
| real camera / photo | **YES** (photographic; not phone 3–10 MiB class) |
| orientation | square / correct |

### PNG — heavy

| Field | Value |
|-------|-------|
| source | Device UI screenshot (admin products), visually complex |
| MIME | image/png |
| dimensions | 1082 × 12637 |
| bytes | 7 597 701 (7.246 MiB) |
| ALPHA | **NOT EXERCISED** (opaque UI capture) |

No genuine phone-camera JPEG in the 3–10 MiB class was available without scanning personal photo libraries.

---

## JPEG Result — synthetic heavy (pipeline stress)

| Field | Value |
|-------|-------|
| crop | center 1:1 → 4221 × 4221 |
| output format | image/webp (`.webp`) |
| output dimensions | **800 × 800** |
| output bytes | 35 366 (**34.54 KiB**) |
| compression | 99.67% reduction |
| processing time | ~1384 ms (ACCEPTABLE) |
| visual quality | GOOD for graphic (text/logo readable at preview) |
| byte target ≤90 KiB | **PASS** |
| pre-submit writes | **0** (optimizer path; no Supabase) |

Cannot close “real camera JPEG 3–10 MB” debt (synthetic).

---

## JPEG Result — real photographic (business gate)

| Field | Value |
|-------|-------|
| crop | 1:1 (already square) → 1024 × 1024 |
| output format | image/webp (`.webp`) |
| output dimensions | **640 × 640** (dimension fallback engaged: 800 → 720 → 640) |
| output bytes | 138 684 (**135.43 KiB**) |
| compression | 89.96% reduction |
| processing time | ~2286 ms (ACCEPTABLE) |
| visual quality | **ACCEPTABLE / GOOD** — fine relief detail preserved; no grayscale/black matte; merchant-usable catalog thumb |
| byte target ≤90 KiB | **FAIL — BYTE BUDGET MISS** |
| pre-submit writes | **0** |

**BYTE BUDGET MISS:** bounded quality/dimension fallback ran to completion; smallest encoded WebP still **>90 KiB**.

Classification: realistic high-frequency photography cannot meet the certified normal target under current knobs without a product decision / microfix.

---

## PNG Result

| Field | Value |
|-------|-------|
| crop | center 1:1 → 1082 × 1082 |
| output format | image/webp |
| output dimensions | 800 × 800 |
| output bytes | 37 748 (**36.86 KiB**) |
| compression | 99.50% reduction |
| processing time | ~434 ms (EXCELLENT) |
| visual quality | ACCEPTABLE |
| byte target | PASS |
| pre-submit writes | **0** |
| browser stability | PASS |

---

## Lifecycle Safety

| Check | Result |
|-------|--------|
| Storage upload before Save | **0** (optimizer has no Storage; Create opened then Escape discarded) |
| committed uploads | **0** |
| DB / product mutations | **0** |
| Save | **NOT CLICKED** |
| discard | Create Escape after open |

Create UI native file-picker automation was blocked by CDP `DOM.setFileInputFiles` deny; measurements used the same certified `optimizeProductImage` bundle in system Chrome (prior proven method). No eager-upload code path exists in crop/optimize owners.

---

## Verification

| Gate | Result |
|------|--------|
| optimizer verify | **PASS** |
| lifecycle verify | **PASS** |
| diff-check | **PASS** |
| full 12/12 / tsc / build | NOT RUN (runtime unchanged) |

---

## Remaining Debt

| Debt | Status |
|------|--------|
| Real camera JPEG 3–10 MB QA | **STILL OPEN** (+ no phone-class 3–10 MiB fixture) |
| Byte budget on complex photography | **NEW BLOCKER finding** — decision/microfix required |
| HEIC real-device | ACCEPTED QA DEBT |
| Image Delivery Reconciliation | BLOCKED / ACCEPTED INFRA |
| Historical orphans | DEFERRED |
| ESLint tooling | KNOWN DEBT |

---

## Release Decision

**NOT READY FOR ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1**

Blocked on byte-budget decision for real photographic assets.

Suggested next:

**ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-BYTE-BUDGET-DECISION-1**

Options for owner (do not implement here):

1. Raise normal target (e.g. 120–150 KiB) for complex photos  
2. Add further dimension/quality fallback below 640 / 0.6  
3. Explicitly document ≤90 KiB as soft target with allowed quality-preservation outlier (codify acceptance criteria)  
4. Dual-quality path (thumb vs detail)

---

## Next

`ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-BYTE-BUDGET-DECISION-1`

No commit. No push. No deploy. No runtime edits.
