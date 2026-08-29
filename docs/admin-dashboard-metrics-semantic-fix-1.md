# ADMIN-DASHBOARD-METRICS-SEMANTIC-FIX-1 — Targeted Runtime Semantic Fix

```text
PHASE: ADMIN-DASHBOARD-METRICS-SEMANTIC-FIX-1
TYPE: TARGETED RUNTIME SEMANTIC FIX
STATUS: PASS — DASHBOARD METRICS SEMANTICS FIXED
BASELINE COMMIT: 81b1162
RUNTIME CHANGES: lib/orders/analytics.ts, lib/orders/dashboard-top-section-view-model.ts
CSS CHANGES: NONE
DB / SQL / RPC CHANGES: NONE
```

---

## 1. Objective

Implement the targeted runtime semantic fix for OrderOps admin dashboard metrics based on the product decisions established in `ADMIN-DASHBOARD-METRICS-SEMANTIC-AUDIT-1`:
1. Change visible KPI label from "Más vendido" to "Producto más pedido".
2. Fix top product calculation in `getTopProducts()` to count root products only, excluding parent-linked upsells/adicionales (such as "Coca Cola 500ml").
3. Update ready waiting copy from "Listos esperando salida" to "Listos para entrega/retiro" (detail: "Delivery y retiro en local").
4. Add comprehensive deterministic verification coverage (`lib/orders/dashboard-metrics-semantic-fix.verify.ts`).
5. Strictly preserve all other metric formulas, DB/RPC/realtime, and dashboard card root count invariants.

---

## 2. Product Decisions Applied

| Metric / Area | Product Decision | Applied Implementation |
| ------------- | ---------------- | ---------------------- |
| **Ventas (Revenue)** | Keep current formula: $\sum \text{total\_price}$ of non-cancelled orders in session window. | Intentionally unchanged (`getTotalRevenue`). |
| **Ticket promedio** | Keep current formula: $\text{Revenue} / \text{ValidOrdersCount}$ in session window. | Intentionally unchanged (`getAverageTicket`). |
| **Pedidos activos** | Keep current formula: Count of `pending` + `preparing` + `ready`. | Intentionally unchanged (`getActiveOrdersCount`). |
| **Producto más pedido** | Count root products only. Exclude parent-linked child upsells/adicionales. | Updated `getTopProducts()` in `lib/orders/analytics.ts` to consume `buildDashboardOrderItemTree(order.order_items_preview)`. |
| **Top Product Label** | Relabel to "Producto más pedido". | Updated label in `lib/orders/dashboard-top-section-view-model.ts`. |
| **Listos** | Relabel to "Listos para entrega/retiro", detail: "Delivery y retiro en local". Keep formula: $\text{Count}(\text{status} === \text{'ready'})$. | Updated label and detail in `lib/orders/dashboard-top-section-view-model.ts`. |
| **Pedidos demorados** | Keep current 20-minute uniform inactivity threshold. | Intentionally unchanged (`buildOperationalMetrics`). |
| **Tiempo promedio** | Keep preparation duration (preparing $\to$ ready). | Intentionally unchanged (`buildOperationalMetrics`). |
| **Estado de cocina** | Keep fixed default capacity (5 orders). | Intentionally unchanged (`calculateSaturationIndex`). |
| **Señales de sesión** | Keep operational insight rules and priorities. | Intentionally unchanged (`buildTopSectionInsights`). |

---

## 3. Source Ownership

- **Analytics Engine:** `lib/orders/analytics.ts` (`getTopProducts`, `buildAdminOrdersAnalytics`)
- **Top Section View Model:** `lib/orders/dashboard-top-section-view-model.ts` (`buildBusinessKpis`, `buildOperationalKpis`)
- **Desktop Overview Component:** `components/admin/orders/DashboardOverview.tsx` (consumes `viewModel.businessKpis` and `viewModel.operationalKpis`)
- **Mobile Overview Component:** `components/admin/orders/DashboardMobileOverview.tsx` (consumes `viewModel.businessKpis` and `viewModel.operationalKpis`)
- **Deterministic Verify:** `lib/orders/dashboard-metrics-semantic-fix.verify.ts`

---

## 4. Top Product Root-Only Semantics

### Before
`getTopProducts()` iterated directly over flat `order.order_items_preview ?? []`. When customers attached "Coca Cola 500ml" across multiple different burgers/dishes, the child upsell rows aggregated to a higher quantity than any individual main food item, causing beverages/sides to displace main dishes.

### After
```typescript
export function getTopProducts(orders: AdminOrderDashboardItem[]) {
  const products = new Map<string, number>();

  for (const order of orders) {
    if (order.status === "cancelled") {
      continue;
    }

    const rootItems = buildDashboardOrderItemTree(order.order_items_preview ?? []).map(
      (node) => node.item
    );

    for (const item of rootItems) {
      const productName = item.product_name.trim();

      if (!productName) {
        continue;
      }

      products.set(productName, (products.get(productName) ?? 0) + item.quantity);
    }
  }

  return [...products.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((left, right) => right.quantity - left.quantity || left.name.localeCompare(right.name));
}
```

- **Root Detection:** `parent_order_item_id == null` and `item_kind !== 'upsell'`.
- **Upsell Exclusion:** `item_kind === 'upsell'` and `parent_order_item_id != null` are excluded from the top product grouping.
- **Legacy Handling:** Unannotated items without `item_kind` or `parent_order_item_id` are treated as root products.
- **Orphan Handling:** Standalone orphan upsells without a parent in the order are preserved as root-like lines (matching `buildDashboardOrderItemTree`).
- **Cancelled Orders:** Excluded from calculation.

---

## 5. Label and Copy Changes

### Desktop and Mobile Overview
1. **Top Product KPI Card:**
   - Label: `"Producto más pedido"` (formerly `"Más vendido"`).
   - Value: Name of the winning root product or `"Sin ventas todavía"`.
   - Detail: `"{N} unidades"` or `"1 unidad"`.
2. **Ready Waiting KPI Card:**
   - Label: `"Listos para entrega/retiro"` (formerly `"Listos esperando salida"`).
   - Detail: `"Delivery y retiro en local"` (formerly `"En ready"`).
   - Value: `"{N} pedidos"` or `"Sin pedidos listos"`.

---

## 6. Metrics Intentionally Unchanged

- **Ventas (Revenue):** Unchanged. Sums persisted `order.total_price` for non-cancelled orders in operational window.
- **Ticket promedio:** Unchanged. Divides total revenue by non-cancelled order count.
- **Pedidos activos:** Unchanged. Counts `pending`, `preparing`, and `ready` orders.
- **Estado de cocina:** Unchanged. Evaluates saturation load percentage against kitchen capacity (5 orders $\times$ 15 min base).
- **Pedidos demorados:** Unchanged. Evaluates active orders with $\ge 20$ minutes of inactivity.
- **Tiempo promedio:** Unchanged. Measures average duration between `preparing` event and `ready` event.
- **Session Signals:** Unchanged. Preserves alert rules for stalled orders, ready buildup, recent peak, delivery/pickup dominance, and positive operations.

---

## 7. Dashboard Card Root Count Invariants

- Dashboard OrderCard compact count (`item_count`) and summary (`item_summary`) continue to use `buildDashboardOrderCardSummary`.
- Upsell children remain excluded from card scalar counts.
- Order code display (`#ORDER_CODE`) and search capabilities remain strictly frozen.

---

## 8. Verify Matrix

Deterministic test suite: `lib/orders/dashboard-metrics-semantic-fix.verify.ts`

| Case | Scenario | Expected Outcome | Status |
| ---- | -------- | ---------------- | ------ |
| **Case 1** | Root product beats child upsell exclusion (Doble Smash with Coca Cola upsells vs BBQ Bacon with Coca Cola upsells) | `Doble Smash` wins with 2 units; `Coca Cola 500ml` excluded from top products | **PASS** |
| **Case 2** | High quantity child upsell (1x Burger Simple + 5x Coca Cola child upsell) | `Burger Simple` wins with 1 unit; `Coca Cola` excluded | **PASS** |
| **Case 3** | Legacy rows without `item_kind` / `parent_order_item_id` | Counted as root products | **PASS** |
| **Case 4** | Cancelled order exclusion | Large quantity root product in cancelled order does not win | **PASS** |
| **Case 5** | Revenue calculation | Persisted `total_price` sums correctly including attached upsells | **PASS** |
| **Case 6** | Average ticket calculation | Divides revenue by non-cancelled order count | **PASS** |
| **Case 7** | Ready waiting order count | Correctly sums all orders with `status === 'ready'` | **PASS** |
| **Case 8** | View model label contract | `topProduct.label === "Producto más pedido"`, `readyWaiting.label === "Listos para entrega/retiro"`, `readyWaiting.detail === "Delivery y retiro en local"` | **PASS** |

---

## 9. Regression Verifies

- `lib/orders/dashboard-metrics-semantic-fix.verify.ts` — **PASS**
- `lib/orders/dashboard-card-summary.verify.ts` — **PASS**
- `lib/orders/order-display-ref.verify.ts` — **PASS**
- `lib/orders/order-code-ui-search.verify.ts` — **PASS**
- `lib/orders/order-code-loaders-realtime.verify.ts` — **PASS**
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
- **Git diff check:** Clean (no whitespace errors or uncommitted syntax issues).
- **Next.js Production Build:** Clean build PASS.
- **ESLint:** Executed; only known circular JSON / React cycle debt present.

---

## 11. Files Changed

### Runtime
- `lib/orders/analytics.ts` (updated `getTopProducts` to filter root products via `buildDashboardOrderItemTree`)
- `lib/orders/dashboard-top-section-view-model.ts` (updated `topProduct` label and `readyWaiting` label/detail)

### Verification
- `lib/orders/dashboard-metrics-semantic-fix.verify.ts` (new deterministic test suite)

### Documentation & Memory
- `docs/admin-dashboard-metrics-semantic-fix-1.md` (new phase doc)
- `docs/CURRENT_PHASE.md` (updated current phase)
- `docs/admin-dashboard-forensic-living-audit.md` (updated living audit and changelog)
- `ORDEROPS_LIVING_MEMORY.md` (updated changelog)

### CSS / SQL / RPC
- **NONE** (0 CSS, 0 DB migrations, 0 SQL files touched).

---

## 12. Hard Boundaries & Invariants

- `orders.id` (UUID) remains internal primary key and realtime route identity.
- `orders.order_code` format, generation, display, and search remain unchanged.
- Public success WhatsApp business copy remains frozen.
- Admin WhatsApp and contact messaging architecture remain unchanged.
- OrderCard root count helper and scalar badges remain unchanged.
- Status and assignment mutations remain unchanged.

---

## 13. Gate

```text
ADMIN-DASHBOARD-METRICS-SEMANTIC-FIX-1
=
PASS — DASHBOARD METRICS SEMANTICS FIXED

DASHBOARD METRICS SEMANTICS:
IMPLEMENTED / READY FOR QA

TOP PRODUCT KPI:
ROOT-ONLY PRODUCTO MÁS PEDIDO

READY WAITING COPY:
DELIVERY/RETIRO ACCURATE

Dashboard card root count:
REMAINS FROZEN

Order code block:
REMAINS CLOSED

Public success WhatsApp copy:
REMAINS FROZEN

Dashboard overall polish:
OPEN

No commit.
No push.
No deploy.
```
