# ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1 — Targeted Search Fix

```text
PHASE: ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1
TYPE: TARGETED FUNCTIONAL SEARCH FIX
STATUS: PASS — DASHBOARD ORDER CODE PARTIAL SEARCH FIXED
BASELINE COMMIT: 81b1162
RUNTIME CHANGES: lib/orders/natural-search.ts
CSS CHANGES: NONE
DB / SQL / RPC CHANGES: NONE
```

---

## 1. Objective

Resolve the partial search matching bug observed in the admin dashboard when searching by alphanumeric order code:
- **Observed Bug:** Typing prefix `PGF` correctly isolated order `#PGF5TU`, but continuing to type `PGF5` caused the search results to unexpectedly expand and return orders with unrelated order codes.
- **Expected Behavior:** Progressive order code queries (`PGF`, `PGF5`, `PGF5T`, `PGF5TU`, `#PGF`, `#PGF5`, `#PGF5TU`, `pgf5`) must monotonically isolate `#PGF5TU` without broadening results when digits are introduced.
- **Scope & Boundaries:** Search logic only (`lib/orders/natural-search.ts`); 0 changes to DB, SQL, RPC, metrics, card root count, or CSS.

---

## 2. Bug Reproduction & Forensic Trace

### Scenario
Given three active orders in the database:
- **Order A:** `order_code = "PGF5TU"`, `phone = "+54 9 11 1111-1111"`, `customer_name = "Mauro Ramirez"`
- **Order B:** `order_code = "X9B97N"`, `phone = "+54 9 11 5555-5555"`, `customer_name = "Mauro Gomez"`
- **Order C:** `order_code = "EU86T4"`, `phone = "+54 9 11 5222-2222"`, `customer_name = "Mauro Lopez"`

### Trace
1. **Query `"PGF"`:**
   - `normalized = "pgf"`
   - `extractDigits("PGF") = ""` $\to$ `normalizedDigits = ""`
   - `matchesCustomerName` $\to$ `false`
   - `matchesCustomerPhone` $\to$ `false`
   - `matchesOrderNumber` $\to$ matches Order A (`"pgf5tu".includes("pgf")` is `true`); Order B and C are `false`.
   - **Result:** Isolates Order A only.
2. **Query `"PGF5"`:**
   - `normalized = "pgf5"`
   - Prior `parseOperationalSearch` ran `extractDigits("PGF5") = "5"`, setting `normalizedDigits = "5"`.
   - In `matchesOperationalSearch`:
     - `matchesCustomerPhone(order, "5")` ran `orderPhoneDigits.includes("5")`. Because Argentine phone numbers (`+54 9 11...`) and test phones contain the digit `5`, Order B and Order C returned `true`!
     - `matchesOrderNumber(order, "pgf5", "5")` ran `compactOrderId.includes("5")` and `displayRef.includes("5")`, returning `true` for ~87% of all UUIDs!
   - **Result:** Result set unexpectedly blew up from 1 order to virtually all orders in the database.

---

## 3. Root Cause

1. `parseOperationalSearch` naively extracted digits from the entire raw string (`extractDigits(raw) = raw.replace(/\D/g, "")`) without checking whether the digits were part of an alphanumeric word/code token.
2. When the user typed `PGF5`, the character `'5'` was isolated and treated as an independent phone/numeric query term, triggering phone substring matches and UUID hex digit matches across unrelated orders via the `||` logic in `matchesOperationalSearch`.

---

## 4. Source Ownership Map

| Layer | File / Module | Responsibility |
| ----- | ------------- | -------------- |
| **Search Parser & Matcher** | `lib/orders/natural-search.ts` | `parseOperationalSearch`, `matchesOperationalSearch`, `matchesOrderNumber`, `matchesCustomerName`, `matchesCustomerPhone` |
| **Board View Model Filter** | `lib/orders/dashboard-board-view-model.ts` | `applyOperationalSearch` filters `baseFilteredOrders` by `matchesOperationalSearch` |
| **Display Ref Helper** | `lib/orders/display-ref.ts` | `buildOrderDisplayRef` provides authoritative and legacy short ref fallback |
| **Deterministic Verifies** | `lib/orders/order-code-search-partial-match.verify.ts`<br>`lib/orders/order-code-ui-search.verify.ts` | Deterministic unit and regression test suites |

---

## 5. Implementation Summary

1. **Selective Digit Extraction in `parseOperationalSearch`:**
   ```typescript
   export function parseOperationalSearch(input: string): OperationalSearchQuery {
     const raw = input ?? "";
     const normalized = normalizeText(stripOrderNumberDecorators(raw));
     // Only extract normalizedDigits if the query does not contain letters,
     // preventing alphanumeric order codes like "PGF5" from falling through to single-digit phone matches.
     const hasLetters = /[a-zA-Z]/.test(raw);
     const normalizedDigits = hasLetters ? "" : extractDigits(raw);

     if (!normalized && !normalizedDigits) {
       return createEmptyOperationalSearchQuery(raw, "", "");
     }

     return createEmptyOperationalSearchQuery(raw, normalized, normalizedDigits);
   }
   ```
2. **Authoritative Code & Ref Matching in `matchesOrderNumber`:**
   - Removed broad `normalizedDigits` fallback from `matchesOrderNumber`.
   - Direct matching against `compactOrderCode`, `compactOrderId` (UUID), `legacyDisplayRef` (`buildOrderDisplayRef(order.id)`), and `authoritativeDisplayRef` (`buildOrderDisplayRef(order)`).
3. **Structured Dispatch in `matchesOperationalSearch`:**
   - **Explicit `#` Prefix:** Routes directly to order number / code / ref matching.
   - **Customer Name:** Exact or multi-token match on `customerSearchSpace`.
   - **Order Code / Ref:** Matches code / UUID / display ref.
   - **Phone Digits:** Only active when query is digit-only or phone-formatted (no letters).
   - **Multi-token Search:** Validates that every space-separated token matches at least one order attribute.

---

## 6. Order Code Candidate Rules & Intent

- **Starts with `#` (e.g. `#PGF5`, `#K7M`):** Unambiguous order code search intent; customer name and phone searches are bypassed.
- **Mixed Letters + Digits (e.g. `PGF5`, `K7M4`, `EU86`, `f47ac10b`):** Strong order code/ref intent; phone extraction is suppressed.
- **Pure Letters (e.g. `PGF`, `Mauro`, `Ramirez`):** Evaluated against both customer name and order code prefix/substring without generating phantom phone digits.
- **Pure Digits / Phone Formatted (e.g. `112345`, `23456789`, `+54 9 11...`):** Evaluated against phone numbers as well as numeric order codes and UUIDs.

---

## 7. Monotonic Code Match Invariant

For order-code-intent queries, typing additional characters from the target code strictly narrows or maintains the result set:
$$\text{Results}(\text{"PGF5TU"}) \subseteq \text{Results}(\text{"PGF5T"}) \subseteq \text{Results}(\text{"PGF5"}) \subseteq \text{Results}(\text{"PGF"})$$

In the test suite with `order_code = "PGF5TU"` and distractors containing digit `5`, all queries return exactly `[Order A]`.

---

## 8. Regression Coverage Matrix

| Category | Query | Target Field | Expected Outcome | Status |
| -------- | ----- | ------------ | ---------------- | :----: |
| **Bug Fix** | `PGF` $\to$ `PGF5` | `order_code` | Isolates `#PGF5TU`; no broadening with `5` | **PASS** |
| **Progressive Narrowing** | `PGF` $\to$ `PGF5` $\to$ `PGF5T` $\to$ `PGF5TU` | `order_code` | Exactly 1 order throughout | **PASS** |
| **Hash Prefix** | `#PGF5`, `#PGF5TU`, `#K7M` | `order_code` | Matches target code | **PASS** |
| **Case Insensitivity** | `pgf5`, `pgf5tu`, `k7m4` | `order_code` | Matches target code | **PASS** |
| **Substring Code** | `M4Q` (in `K7M4Q9`) | `order_code` | Matches target code | **PASS** |
| **Legacy Ref** | `D479`, `#D479`, `d479` | Legacy UUID ref | Matches legacy order | **PASS** |
| **UUID Prefix** | `f47ac10b` | `order.id` | Matches target order | **PASS** |
| **Customer Name** | `Mauro`, `Ramirez`, `Carlos` | `customer_name` | Matches customer orders | **PASS** |
| **Customer Phone** | `1111`, `23456789`, `+54 9 11...` | `phone` | Matches phone orders | **PASS** |
| **Multi-Token** | `Mauro 1111` vs `Mauro 9999` | Name + Phone | Matches when all tokens match; empty otherwise | **PASS** |
| **No Match** | `ZZZZZZ`, `#ZZZZZZ`, `99999999` | None | Returns 0 results | **PASS** |
| **Empty Query** | `""`, `"   "` | All | Returns all orders | **PASS** |

---

## 9. Deterministic Verifies Executed

- `lib/orders/order-code-search-partial-match.verify.ts` — **PASS (10/10 test suites)**
- `lib/orders/order-code-ui-search.verify.ts` — **PASS**
- `lib/orders/order-display-ref.verify.ts` — **PASS**
- `lib/orders/order-code-loaders-realtime.verify.ts` — **PASS**
- `lib/orders/dashboard-metrics-semantic-fix.verify.ts` — **PASS**
- `lib/orders/dashboard-card-summary.verify.ts` — **PASS**
- `lib/orders/customer-order-summary.verify.ts` — **PASS**
- `lib/whatsapp/public.verify.ts` — **PASS**
- `lib/whatsapp/admin-structured-content.verify.ts` — **PASS**
- `lib/whatsapp/admin-contextual-default.verify.ts` — **PASS**
- `lib/product-customization/order-preparation.verify.ts` — **PASS**
- `lib/orders/pending-status-mutation-finalization.verify.ts` — **PASS**
- `lib/orders/phone-display.verify.ts` — **PASS**

---

## 10. Static Checks & Lint Evidence

- **TypeScript compilation (`tsc`):** Clean (0 errors).
- **Git diff check:** Clean (no whitespace or syntax issues).
- **Production build (`next build`):** Clean Next.js 16.2.9 production build PASS.
- **ESLint:** Executed; pre-existing ESLint 9 circular JSON engine cycle only.

---

## 11. Files Changed

### Runtime
- `lib/orders/natural-search.ts` (updated `parseOperationalSearch`, `matchesOrderNumber`, `matchesSingleToken`, `matchesOperationalSearch`)

### Verification
- `lib/orders/order-code-search-partial-match.verify.ts` (new deterministic test suite)
- `lib/orders/order-code-ui-search.verify.ts` (added monotonic narrowing test case)

### Documentation & Memory
- `docs/admin-dashboard-order-code-search-partial-match-fix-1.md` (created)
- `docs/CURRENT_PHASE.md` (updated)
- `docs/admin-dashboard-forensic-living-audit.md` (updated changelog)
- `ORDEROPS_LIVING_MEMORY.md` (updated changelog)

### CSS / SQL / RPC
- **NONE** (0 CSS, 0 DB migrations, 0 SQL files touched).

---

## 12. Hard Boundaries & Invariants

- `orders.id` (UUID) remains internal primary key and realtime route identity.
- `orders.order_code` schema, format, generation, backfill, and RPC creation remain untouched.
- Dashboard overview metrics semantics remain frozen (`Producto más pedido`, `Listos para entrega/retiro`).
- Dashboard OrderCard root item count remains frozen.
- WhatsApp public and admin templates remain frozen.
- Status and assignment mutations remain untouched.
- Realtime channels and defensive reconciliation remain untouched.

---

## 13. Gate

```text
ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1
=
PASS — DASHBOARD ORDER CODE PARTIAL SEARCH FIXED

DASHBOARD ORDER_CODE PARTIAL SEARCH:
FIXED

PGF → PGF5 BROADENING:
CLOSED

Order code block:
REMAINS CLOSED

Dashboard metrics semantics:
REMAIN FROZEN

Dashboard card root count:
REMAINS FROZEN

Public success WhatsApp copy:
REMAINS FROZEN

Dashboard overall polish:
OPEN

No commit.
No push.
No deploy.
```
