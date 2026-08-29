# Admin Orders — Order Code Final Runtime QA & Closeout Phase 1

## 1. Objective

End-to-end closeout validation for the complete Order Code architectural block:
`DB / RPC foundation → Loaders & Realtime propagation → UI display & Operational search adoption`

Confirm that visible and operational order references consistently prefer `#ORDER_CODE` (`#K7M4Q9`) with safe UUID-derived fallback, while `orders.id` (UUID) strictly remains the internal identity for database relations, route parameters, mutation targets, realtime channels, presence subscriptions, and authorization.

---

## 2. Context

Order code evolution across phases:
1. `ADMIN-ORDERS-ORDER-CODE-AUDIT-SPEC-1`: Audited ephemeral UUID refs (`buildOrderDisplayRef`) and specified 6-character unambiguous reduced alphabet `[23456789ABCDEFGHJKMNPQRSTUVWXYZ]`, per-business uniqueness `(business_id, order_code)`, and `create_order` generation.
2. `ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1`: Added migration `20260827234500_add_orders_order_code.sql`, backfilled all orders, added format CHECK constraint, unique compound index, and updated `create_order` RPC with 5-retry collision loop.
3. `ADMIN-ORDERS-ORDER-CODE-DB-APPLY-VALIDATION-1`: Live DB introspection confirmed 100% of orders backfilled, 0 duplicates, 0 nulls, and RPC contract verified.
4. `ADMIN-ORDERS-ORDER-CODE-LOADERS-REALTIME-1`: Propagated `order_code` through domain types (`AdminOrderListItem`, `AdminOrderDashboardItem`, `AdminOrderDetail`, `AdminOrderWorkspaceData`), loaders, hydrate endpoints, and realtime patch helpers.
5. `ADMIN-ORDERS-ORDER-CODE-UI-SEARCH-1`: Adopted `#ORDER_CODE` across OrderCard, Workspace Modal Header, Detail Header, WhatsApp templates, plain-text Copy/Share summaries, and Public Success page, along with case-insensitive and `#`-optional dashboard search.

This phase (`ADMIN-ORDERS-ORDER-CODE-FINAL-RUNTIME-QA-1`) executes formal end-to-end runtime, source, verify suite, and static checks closeout.

---

## 3. QA Mode

- Pure QA & closeout validation.
- Zero runtime source modifications.
- Zero CSS modifications.
- Zero database / SQL / migration modifications.
- Zero RPC contract modifications.

---

## 4. Dashboard QA

- **Surfaces:** `/admin/dashboard`
- **OrderCard display ref:** Renders `#ORDER_CODE` (`#K7M4Q9`) on cards via `buildOrderDisplayRef(order)`.
- **Root item count (`item_count`):** Frozen — calculates root product quantities only, ignoring parent-linked upsells/Adicional items.
- **Compact summary (`item_summary`):** Frozen — lists root products only.
- **Modal invocation:** Clicking cards opens workstation modal via internal UUID (`order.id`).
- **Viewport check:** 6-character alphanumeric reference fits comfortably without clipping or overflow at desktop (1440px), tablet (720px), and mobile (390px).
- **Result:** PASS

---

## 5. Search QA

- **Search queries tested:**
  - Exact order code: `K7M4Q9` -> MATCH
  - With hash prefix: `#K7M4Q9` -> MATCH
  - Lowercase code: `k7m4q9` -> MATCH
  - Lowercase with hash: `#k7m4q9` -> MATCH
  - Partial prefix/substring: `K7M`, `#K7M`, `M4Q` -> MATCH
  - Legacy UUID ref: `D479`, `#D479` -> MATCH
  - Customer name: `Mauro`, `ramirez` -> MATCH
  - Customer phone: `23456789`, `112345` -> MATCH
  - Unrelated code: `ZZZZZZ` -> NO MATCH (filtered out cleanly)
- **Result:** PASS

---

## 6. Workspace Modal QA

- **Workstation Header:** Displays `#ORDER_CODE - Cliente` (e.g. `#K7M4Q9 - Mauro Ramirez`).
- **Hydration stability:** Opening modal or receiving `/admin/orders/[id]/summary` hydrate maintains `#ORDER_CODE` without flashing or resetting to legacy hex ref.
- **Internal route / ID:** Modal internal state and `/admin/orders/[id]/workspace` hydration use UUID `orders.id`.
- **Products & Adicional section:** Tree structure, groups, and snapshots remain strictly frozen.
- **Status & Assignment controls:** Status transitions and operator assignment retain authoritative flow with pending mutation locks.
- **Result:** PASS

---

## 7. Detail Route QA

- **Route:** `/admin/orders/[uuid]`
- **Header:** Displays `Pedido #ORDER_CODE · Cliente` (e.g. `Pedido #K7M4Q9 · Mauro Ramirez`).
- **URL structure:** URL param strictly remains UUID. No 404 or routing regression.
- **Result:** PASS

---

## 8. WhatsApp / Copy / Share QA

- **WhatsApp Received template:** `Recibimos tu pedido #K7M4Q9:`
- **WhatsApp Summary template:** `Te compartimos el resumen de tu pedido #K7M4Q9:`
- **Plain-text Copy summary:** Header is `Pedido #K7M4Q9\nCliente: Mauro Ramirez`.
- **Share action:** Shares payload starting with `Pedido #K7M4Q9`.
- **URL encoding:** `encodeURIComponent` correctly formats `https://wa.me/` link with `%0A` line breaks and literal bold markers `*`.
- **Live send safety:** No live messages dispatched.
- **Result:** PASS

---

## 9. Public Success QA

- **Route:** `/b/[slug]/success?order_id=<uuid>`
- **Query param:** Strictly preserves UUID `order_id`.
- **Displayed reference:** `Referencia del pedido: #ORDER_CODE` (e.g. `#K7M4Q9`).
- **Data scoping:** Service client query is strictly scoped by `(id = orderId, business_id = business.id)`.
- **Public WhatsApp URL:** Generates `https://wa.me/...text=...Pedido%3A%20%23K7M4Q9...`.
- **Checkout submit:** Live order submission was not executed without explicit authorization (`AUTORIZO_PUBLIC_CHECKOUT_ORDER_CODE_SUBMIT_QA`). Handled as accepted P3 debt with verified source & unit contracts.
- **Result:** PASS WITH ACCEPTED P3 QA DEBT

---

## 10. Verifies

All 10 deterministic verify scripts executed and passed:

| Verify Script | Focus | Status |
| :--- | :--- | :---: |
| `lib/orders/order-display-ref.verify.ts` | Order code normalization, UUID string fallback, invalid code rejection | PASS |
| `lib/orders/order-code-ui-search.verify.ts` | Exact, `#`, lowercase, prefix, legacy ref, name, phone search | PASS |
| `lib/orders/order-code-loaders-realtime.verify.ts` | Loader/realtime order_code propagation | PASS |
| `lib/orders/dashboard-card-summary.verify.ts` | Root-level item count freezing | PASS |
| `lib/orders/customer-order-summary.verify.ts` | Customer summary model with order_code and legacy fallback | PASS |
| `lib/whatsapp/admin-structured-content.verify.ts` | Structured WhatsApp and plain-text summary with order_code | PASS |
| `lib/whatsapp/admin-contextual-default.verify.ts` | Contextual defaults for WhatsApp | PASS |
| `lib/product-customization/order-preparation.verify.ts` | Product preparation tree mapping | PASS |
| `lib/orders/pending-status-mutation-finalization.verify.ts` | Pending mutation resolution & lock reconciliation | PASS |
| `lib/orders/phone-display.verify.ts` | Phone display formatting | PASS |

---

## 11. Static Checks

- `npx tsc --noEmit`: PASS (exit code 0, zero type errors)
- `git diff --check`: PASS (clean diff, zero whitespace errors)
- `npm run build`: PASS (Next.js 16.2.9 production build compiled successfully)
- `npm run lint`: EXECUTED (exit code 2, known circular JSON ESLint 9 debt only)

---

## 12. Lint Evidence

ESLint execution completed with known tooling debt:
```text
TypeError: Converting circular structure to JSON
    at ConfigValidator.formatErrors
```
Workspace files checked via `ReadLints` report zero linter diagnostics.

---

## 13. Files Changed

### Runtime
- None (0 files)

### CSS
- None (0 files)

### SQL / Migrations
- None (0 files)

### Docs
- `docs/admin-orders-order-code-final-runtime-qa-1.md` (this document)
- `docs/admin-orders-order-code-ui-search-1.md` (appended closeout note)
- `docs/CURRENT_PHASE.md` (updated phase state)
- `docs/admin-dashboard-forensic-living-audit.md` (appended changelog entry)
- `ORDEROPS_LIVING_MEMORY.md` (updated living memory entry)

---

## 14. Findings (P0–P3)

- **P0:** 0 findings.
- **P1:** 0 findings.
- **P2:** 0 findings.
- **P3:** Public checkout submit not executed live without explicit environment authorization; manual order creation toast remains generic `"Pedido creado."`.

---

## 15. Hard Boundaries

- UUID routes = **UNCHANGED**
- `orders.id` primary key = **UNCHANGED**
- `create_order` return = **UNCHANGED**
- Realtime channel / presence identity = **UNCHANGED**
- Status & assignment mutations = **UNCHANGED**
- Pricing / totals / order_items = **UNCHANGED**
- Snapshots = **UNCHANGED**
- Dashboard root item count = **UNCHANGED (FROZEN)**
- Workspace / Contact structure = **UNCHANGED except ref text**
- WhatsApp content architecture = **UNCHANGED except ref text**
- Public checkout submit = **NOT EXECUTED without explicit auth**
- DB / SQL / RPC = **UNCHANGED**
- CSS = **NONE**
- Commit / push / deploy = **NO**

---

## 16. Gate

`ADMIN-ORDERS-ORDER-CODE-FINAL-RUNTIME-QA-1` = **PASS WITH ACCEPTED P3 QA DEBT — ORDER CODE BLOCK CLOSED**
