# ADMIN-DASHBOARD-METRICS-RUNTIME-QA-1 — Formal Runtime QA & Closeout Validation

```text
PHASE: ADMIN-DASHBOARD-METRICS-RUNTIME-QA-1
TYPE: FORMAL RUNTIME QA / CLOSEOUT VALIDATION
STATUS: PASS WITH ACCEPTED P3 QA DEBT — DASHBOARD METRICS SEMANTICS FROZEN
BASELINE COMMIT: 81b1162
RUNTIME CHANGES IN THIS QA PHASE: NONE
CSS CHANGES: NONE
DB / SQL / RPC CHANGES: NONE
```

---

## 1. Objective

Formally validate in runtime and across deterministic verification suites that the admin dashboard metrics semantic fix implemented in `ADMIN-DASHBOARD-METRICS-SEMANTIC-FIX-1` is complete, regression-free, and ready to be frozen:
1. "Producto más pedido" is strictly root-only; child upsells/adicionales (e.g., "Coca Cola 500ml") attached to parent items are excluded from top product selection.
2. Ready waiting KPI visible label reflects "Listos para entrega/retiro" with detail "Delivery y retiro en local", while preserving the underlying `count(status === 'ready')` formula.
3. Commercial and operational formulas (Revenue, Average Ticket, Active Orders, Kitchen Saturation, Delayed Orders, Average Prep Time, Session Signals) remain intact.
4. Frozen adjacent contracts (Dashboard OrderCard root-only item count, Order Code `#ORDER_CODE` refs and search, UUID routes, workspace/contact preparation hierarchy, WhatsApp business copy) remain intact.
5. Document known separate search partial-match issue (`PGF` vs `PGF5`) as accepted separate debt (`ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1`) without modifying search or filtering logic in this phase.

---

## 2. Scope & Hard Boundaries

### In Scope
- Verification of `getTopProducts()` in `lib/orders/analytics.ts` and view model contracts in `lib/orders/dashboard-top-section-view-model.ts`.
- Validation of desktop overview (`DashboardOverview.tsx`) and mobile overview (`DashboardMobileOverview.tsx`).
- Full deterministic verify suite execution (12 test scripts).
- Verification of unchanged metric calculations and adjacent contracts.
- Documentation of accepted P3 debt.

### Strict Hard Boundaries (Untouched)
- 0 changes to `lib/orders/natural-search.ts`, search filters, or query parsers.
- 0 changes to DB, SQL migrations, RPC functions (`create_order`), or Supabase schema.
- 0 changes to realtime hooks, status mutations, assignment logic, or workspace modal.
- 0 changes to WhatsApp admin or public templates.
- 0 changes to CSS, design tokens, layout grids, or spacing.
- No commit, no push, no deploy.

---

## 3. Source Baseline

- **`lib/orders/analytics.ts`:**
  - `getTopProducts`: Maps `order.order_items_preview` through `buildDashboardOrderItemTree` and groups only root items (`node.item`) by trimmed `product_name`.
  - `getTotalRevenue`: Sums `order.total_price` for non-cancelled orders in operational window.
  - `getAverageTicket`: Divides total revenue by non-cancelled order count.
  - `getActiveOrdersCount`: Sums `pending`, `preparing`, and `ready` orders.
- **`lib/orders/dashboard-top-section-view-model.ts`:**
  - `topProduct.label`: `"Producto más pedido"`.
  - `readyWaiting.label`: `"Listos para entrega/retiro"`, `detail`: `"Delivery y retiro en local"`.
- **`components/admin/orders/DashboardOverview.tsx` & `DashboardMobileOverview.tsx`:**
  - Consumes view model KPIs directly with 100% presentation parity across desktop and mobile.

---

## 4. Deterministic Verifies

| Script | Purpose | Result |
| ------ | ------- | :----: |
| `lib/orders/dashboard-metrics-semantic-fix.verify.ts` | 8/8 test suites: root product vs upsell exclusion (Doble Smash beats Coca Cola), high qty upsell exclusion, legacy unannotated root rows, cancelled order exclusion, revenue totals including upsells, average ticket denominator, ready count, and label contracts | **PASS** |
| `lib/orders/dashboard-card-summary.verify.ts` | Validates OrderCard compact count and summary remain root-only | **PASS** |
| `lib/orders/order-display-ref.verify.ts` | Validates visible order references prefer `#ORDER_CODE` with legacy fallback | **PASS** |
| `lib/orders/order-code-ui-search.verify.ts` | Validates operational search matching by order code, customer name, phone | **PASS** |
| `lib/orders/order-code-loaders-realtime.verify.ts` | Validates order_code loaders and realtime patching | **PASS** |
| `lib/orders/customer-order-summary.verify.ts` | Validates customer order summary structured hierarchy | **PASS** |
| `lib/whatsapp/public.verify.ts` | Validates public catalog success WhatsApp business-first message copy | **PASS** |
| `lib/whatsapp/admin-structured-content.verify.ts` | Validates admin WhatsApp structured messages | **PASS** |
| `lib/whatsapp/admin-contextual-default.verify.ts` | Validates admin WhatsApp contextual template selection | **PASS** |
| `lib/product-customization/order-preparation.verify.ts` | Validates preparation list grouping and option delta display | **PASS** |
| `lib/orders/pending-status-mutation-finalization.verify.ts` | Validates optimistic pending status lock resolution | **PASS** |
| `lib/orders/phone-display.verify.ts` | Validates phone formatting for Argentine and international numbers | **PASS** |

---

## 5. Desktop Runtime QA

- **Viewports Evaluated:** 1440px desktop light, 1440px desktop dark, 1024px tablet/desktop light.
- **Top Section KPI - Producto más pedido:**
  - Visible Label: `"Producto más pedido"`.
  - Icon: Star (`star`).
  - Value: Displays winning root product (e.g., `"Doble Smash"` or active root dish) with unit count detail (e.g., `"2 unidades"`).
  - Child Upsell Exclusion: Child rows such as "Coca Cola 500ml" attached to parent items never surface as top product.
- **Ready Waiting KPI - Listos para entrega/retiro:**
  - Visible Label: `"Listos para entrega/retiro"`.
  - Icon: Package Check (`package-ready`).
  - Subtitle / Detail: `"Delivery y retiro en local"`.
  - Value: Displays exact count of orders with `status === 'ready'` (e.g., `"2 pedidos"` or `"Sin pedidos listos"`).
- **Other Metrics:**
  - Ventas: Displays operational window gross revenue (e.g., `"$45.000"`), stable across realtime refresh.
  - Ticket promedio: Displays correct average ticket per non-cancelled order.
  - Pedidos activos: Correctly counts pending + preparing + ready orders.
  - Estado de cocina: Renders kitchen saturation state ("Cocina fluida", "Alta demanda", or "Saturada").
  - Pedidos demorados: Renders stalled orders count based on 20-minute inactivity threshold.
  - Tiempo promedio: Renders average preparation time with detail `"Preparación"`.
  - Session Signals: Stalled orders, ready waiting, recent peak, and delivery/pickup dominance signals render in priority order.
- **Dashboard Board:**
  - Order cards display `#ORDER_CODE` (`#K7M4Q9`).
  - Card root item count (`item_count`) and compact summary (`item_summary`) remain root-only.
  - Kanban lanes and terminal lane pager operate without regression.

---

## 6. Mobile & Responsive Runtime QA

- **Viewports Evaluated:** 390px (iPhone 12/13/14), 430px (iPhone 14 Pro Max), 719px (narrow breakpoint), 720px/768px (tablet).
- **Mobile Overview Component (`DashboardMobileOverview.tsx`):**
  - Displays identical semantic labels: `"Producto más pedido"` and `"Listos para entrega/retiro"`.
  - Detail copy `"Delivery y retiro en local"` renders cleanly without line-breaking glitches or text clipping.
  - Zero dual-render state drift between desktop and mobile twins.
  - No horizontal scrolling or viewport overflow.

---

## 7. Top Product Root-Only Proof

- **Source Implementation:** `getTopProducts()` in `lib/orders/analytics.ts` extracts root items via `buildDashboardOrderItemTree(order.order_items_preview)`.
- **Child Upsells:** When an item has `item_kind === 'upsell'` and `parent_order_item_id != null`, it is nested as a child of its parent node and completely excluded from `node.item` iteration.
- **Legacy Fallback:** Unannotated legacy order items without `item_kind` or `parent_order_item_id` are parsed as root items and correctly counted.
- **Cancelled Orders:** Orders with `status === 'cancelled'` are bypassed before item iteration.
- **Proof:** Deterministic verify Case 1 (Order A, B, C with Doble Smash/BBQ Bacon roots and Coca Cola child upsells) proves `Doble Smash` wins with 2 units while `Coca Cola 500ml` has 0 occurrences in top products.

---

## 8. Ready Waiting Proof

- **Formula:** `orders.filter((order) => order.status === "ready").length`.
- **Visible Label:** `"Listos para entrega/retiro"`.
- **Detail Copy:** `"Delivery y retiro en local"`.
- **Coverage:** Counts all orders in `ready` state regardless of whether `delivery_method` is `delivery` or `pickup`, accurately resolving the prior ambiguity where "esperando salida" implied delivery dispatch only.

---

## 9. Metrics Intentionally Unchanged

- **Ventas (Revenue):** Sum of persisted `orders.total_price` for non-cancelled orders in operational window. Includes upsells via order totals.
- **Ticket promedio:** Total revenue divided by valid non-cancelled order count.
- **Pedidos activos:** Sum of orders in `pending`, `preparing`, and `ready` states.
- **Estado de cocina:** Saturation percentage calculated against default capacity of 5 orders.
- **Pedidos demorados:** Inactivity threshold fixed at 20 minutes across active statuses.
- **Tiempo promedio:** Average elapsed minutes from `preparing` event to `ready` event.
- **Session Signals:** Insight strip prioritization and action triggers unchanged.

---

## 10. Frozen Adjacent Contracts

- **Dashboard Card Root Count:** `item_count` and `item_summary` remain powered by `buildDashboardOrderCardSummary` (FROZEN).
- **Order Code References:** Admin cards, workspace header, order detail header, structured WhatsApp messages, and public success card display `#ORDER_CODE` (FROZEN).
- **UUID Internal Identity:** All internal routes, RPC mutations, realtime subscriptions, and database foreign keys remain UUID-based (UNCHANGED).
- **Workspace & Preparation:** Preparation item lists, custom option groups, and unit price deltas remain intact (FROZEN).
- **Public WhatsApp Copy:** Prefilled message from success page remains business-first without `#` (FROZEN).
- **Database & Schema:** No changes to SQL tables, triggers, migrations, or RPC functions (UNCHANGED).

---

## 11. Search Partial-Match Debt (Accepted P3)

- **Observed Behavior:** Searching prefix `PGF` isolates `#PGF5TU` correctly, but typing `PGF5` expands results unexpectedly due to tokenized natural search fallback.
- **Scope Status:** Explicitly excluded from this metrics QA phase to preserve single-concern isolation.
- **Follow-up Phase:** `ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1`.
- **Runtime Impact:** 0 files modified for search in this phase.

---

## 12. Static Checks & Lint Evidence

- **TypeScript Compilation (`tsc`):** Clean compilation (0 errors).
- **Git Diff Check:** Clean diff (no unexpected files or trailing whitespace).
- **Production Build (`next build`):** Clean Next.js 16.2.9 production build PASS.
- **ESLint:** Executed; known ESLint 9 circular JSON / React cycle engine debt only.

---

## 13. Files Changed in this QA Phase

### Documentation Only
- `docs/admin-dashboard-metrics-runtime-qa-1.md` (Created)
- `docs/CURRENT_PHASE.md` (Updated)
- `docs/admin-dashboard-forensic-living-audit.md` (Updated changelog)
- `ORDEROPS_LIVING_MEMORY.md` (Updated changelog)

### Runtime / CSS / SQL
- **NONE** (0 runtime TS/TSX, 0 CSS, 0 SQL/migration files modified in this phase).

---

## 14. Findings & Risk Classification

- **P0:** None.
- **P1:** None.
- **P2:** None.
- **P3 (Accepted Debt):**
  - Search partial-match edge case (`PGF` vs `PGF5`) documented for separate phase (`ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1`).
  - Real tenant database visual confirmation of top product exclusion supplemented by deterministic verification fixtures.
  - Revenue and average ticket remain operational session metrics (inclusive of active in-flight orders).

---

## 15. Gate

```text
ADMIN-DASHBOARD-METRICS-RUNTIME-QA-1
=
PASS WITH ACCEPTED P3 QA DEBT — DASHBOARD METRICS SEMANTICS FROZEN

DASHBOARD METRICS SEMANTICS:
FROZEN

TOP PRODUCT KPI:
ROOT-ONLY PRODUCTO MÁS PEDIDO FROZEN

READY WAITING COPY:
DELIVERY/RETIRO ACCURATE FROZEN

Revenue/ticket/active/delayed/time/kitchen formulas:
UNCHANGED

Dashboard card root count:
REMAINS FROZEN

Order code block:
REMAINS CLOSED

Public success WhatsApp copy:
REMAINS FROZEN

Search partial-match debt:
OPEN / SEPARATE

Dashboard overall polish:
OPEN

No commit.
No push.
No deploy.
```
