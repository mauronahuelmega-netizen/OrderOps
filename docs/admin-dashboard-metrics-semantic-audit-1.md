# ADMIN-DASHBOARD-METRICS-SEMANTIC-AUDIT-1 — Forensic Audit & Product Semantic Specification

```text
PHASE: ADMIN-DASHBOARD-METRICS-SEMANTIC-AUDIT-1
TYPE: FORENSIC AUDIT + PRODUCT SEMANTIC SPECIFICATION
STATUS: AUDIT COMPLETE — READY FOR PRODUCT DECISION
BASELINE COMMIT: 81b1162
RUNTIME CHANGES: NONE
CSS CHANGES: NONE
DB / SQL / RPC CHANGES: NONE
```

---

## 1. Objective

Perform a deep forensic audit of all admin dashboard metrics and KPI calculations in OrderOps to establish:
1. Exact mathematical formulas, source fields, and execution paths currently powering each metric.
2. Label vs. semantic accuracy across business KPIs, operational metrics, and session signals.
3. Item tree handling (root products vs. upsell/adicional children), identifying why items like "Coca Cola 500ml" surface as "Más vendido".
4. Operational time-window and status filtering invariants.
5. Concrete architectural and product recommendations for future correction phases (`ADMIN-DASHBOARD-METRICS-SEMANTIC-FIX-1` / `ADMIN-DASHBOARD-METRICS-RUNTIME-QA-1`).

---

## 2. Context & Architectural Baseline

- **Dashboard overall polish:** OPEN.
- **Dashboard card root count:** FROZEN (uses `buildDashboardOrderCardSummary` / `buildDashboardOrderItemTree`).
- **Order Code block:** CLOSED (`orders.order_code` persistent, UI/search active, UUID identity preserved).
- **Public success WhatsApp copy:** FROZEN (business-first copy active).
- **Hard boundary:** Strictly audit-only; no runtime TS/TSX, CSS, DB, RPC, or realtime modifications.

---

## 3. Source Ownership Map

| Layer | File / Component | Role & Scope |
| ----- | ---------------- | ------------ |
| **Desktop Overview Component** | `components/admin/orders/DashboardOverview.tsx` | Renders the top dashboard KPI cards and session signal strip from `viewModel`. |
| **Mobile Overview Component** | `components/admin/orders/DashboardMobileOverview.tsx` | Mobile-responsive twin rendering the identical `DashboardTopSectionViewModel`. |
| **Dashboard Orchestrator** | `components/admin/orders/admin-dashboard-orders.tsx` | Feeds `visibleOperationalOrders` and session context into `buildDashboardTopSectionViewModel`. |
| **Top Section View Model** | `lib/orders/dashboard-top-section-view-model.ts` | Primary view model builder; assembles `meta`, `statusSummary`, `businessKpis`, `operationalKpis`, and `insights`. |
| **Commercial Analytics Engine** | `lib/orders/analytics.ts` | Calculates `revenue`, `averageTicket`, `activeOrders`, `completedOrders`, and `topProduct`. |
| **Operational Metrics Engine** | `lib/orders/metrics.ts` | Calculates `stalledCount`, `averagePreparationMinutes`, `averageCompletionMinutes`, and `longestInactiveMinutes`. |
| **Saturation Engine** | `lib/orders/saturation-metrics.ts` | Calculates kitchen load percentage and saturation state (`fluid`, `high_demand`, `bottleneck`). |
| **Operational Window Engine** | `lib/orders/analytics.ts` + `lib/store-sessions/admin.ts` | Computes active store session / last closed session / business window boundaries (`getOrdersInOperationalWindow`). |
| **Board View Model** | `lib/orders/dashboard-board-view-model.ts` | Segregates `visibleOperationalOrders` (window-scoped) from UI lane filters/search queries. |
| **Server Data Loader** | `lib/orders/admin.ts` (`getAdminOrders`) | Fetches full order dataset with `order_items` and `order_events` per tenant (`business_id`). |

---

## 4. Current Visible Metrics & Formulas

| Metric ID | Visible Label | Subtitle / Detail | Component | Source Helper | Data Fields Used | Current Formula | Time Window | Status Filter | Includes Cancelled? | Includes Upsells? | Risk Level |
| --------- | ------------- | ----------------- | --------- | ------------- | ---------------- | --------------- | ----------- | ------------- | ------------------- | ----------------- | ---------- |
| `revenue` | **Ventas** | Dynamic session label (e.g., "Sesión activa", "Hoy") | `DashboardOverview` | `getTotalRevenue` in `analytics.ts` | `orders.total_price`, `orders.status`, `orders.created_at` | $\sum \text{total\_price}$ for non-cancelled orders | Operational Window | `status != 'cancelled'` | **No** | **Yes** (via `total_price`) | **P2** |
| `averageTicket` | **Ticket promedio** | "Por pedido" | `DashboardOverview` | `getAverageTicket` in `analytics.ts` | `orders.total_price`, `orders.status`, `orders.created_at` | $\text{Revenue} / \text{ValidOrdersCount}$ (where valid = non-cancelled) | Operational Window | `status != 'cancelled'` | **No** | **Yes** (via `total_price`) | **P2** |
| `activeOrders` | **Pedidos activos** | "Pendientes + preparación + listos" | `DashboardOverview` | `getActiveOrdersCount` in `analytics.ts` | `orders.status`, `orders.created_at` | Count of orders with `status` in `('pending', 'preparing', 'ready')` | Operational Window | `pending`, `preparing`, `ready` | **No** | **N/A** (order-level) | **P3** |
| `topProduct` | **Más vendido** | `"{N} unidades"` or `"Sin datos"` | `DashboardOverview` | `getTopProducts` in `analytics.ts` | `order_items_preview.product_name`, `order_items_preview.quantity`, `orders.status` | Flat item aggregation: $\sum \text{quantity}$ grouped by trimmed `product_name` | Operational Window | `status != 'cancelled'` | **No** | **YES** (Counts child upsells) | **P1 (Critical)** |
| `kitchenStatus` | **Estado de cocina** | Load percentage / saturation label | `DashboardOverview` | `calculateSaturationIndex` in `saturation-metrics.ts` | `orders.status` (`'preparing'`) | $\frac{\text{Count}(\text{preparing}) \times 15}{\text{Capacity}(5) \times 15} \times 100$ | Operational Window | `preparing` | **No** | **N/A** | **P2** |
| `delayedOrders` | **Pedidos demorados** | "Dentro del ritmo esperado" / "Superan umbral de inactividad" | `DashboardOverview` | `buildOperationalMetrics` in `metrics.ts` | `order_events`, `assigned_at`, `created_at`, `status` | Active orders with $(now - \text{lastActivityAt}) \ge 20\text{ min}$ | Operational Window | `pending`, `preparing`, `ready` | **No** | **N/A** | **P2** |
| `averageTime` | **Tiempo promedio** | "Preparación" | `DashboardOverview` | `buildOperationalMetrics` in `metrics.ts` | `order_events` (`status_changed` to `ready`, `preparing`), `created_at` | Mean duration between `preparing` start and `ready` event | Operational Window | Orders transitioned to `ready` | **No** | **N/A** | **P2** |
| `readyWaiting` | **Listos esperando salida** | "En ready" | `DashboardOverview` | `countReady` in `dashboard-top-section-view-model.ts` | `orders.status` | Count of orders with `status === 'ready'` | Operational Window | `ready` | **No** | **N/A** | **P2** |

---

## 5. Deep-Dive Semantic Audits

### 5.1 Ventas (Revenue)
- **Current Formula:** Sum of `order.total_price` across all non-cancelled orders within the active `operationalWindow`.
- **Data Source:** Persistent column `orders.total_price` (calculated and locked by PostgreSQL RPC `create_order`).
- **Inclusions:** Includes root product costs, selected customization options, attached upsells/adicionales, and delivery fees.
- **Order State Inclusions:** Includes in-flight active orders (`pending`, `preparing`, `ready`) as well as `completed` orders.
- **Exclusions:** Strictly excludes `cancelled` orders.
- **Risk (P2):** Revenue reflects *gross in-flight session volume*. If a pending order is cancelled later in the shift, session revenue decreases. This is standard for operational shift monitoring, but should be documented as operational gross revenue rather than settled accounting revenue.
- **Recommendation:** Keep formula intact; revenue is real and upsells represent genuine income.

### 5.2 Ticket promedio (Average Ticket)
- **Current Formula:** $\text{Total Revenue} / \text{Non-cancelled Orders Count}$. If count is 0, returns 0.
- **Inclusions:** Divides by all non-cancelled orders in the window (including active pending, preparing, and ready orders).
- **Risk (P2):** In early session shifts with few completed orders and several pending orders, the average ticket incorporates in-flight orders. If an order with a large total is pending and subsequently cancelled, the ticket average fluctuates.
- **Recommendation:** Maintain current session-level denominator for operational pacing, or add tooltip clarifying "Promedio sobre pedidos activos y completados del turno".

### 5.3 Pedidos activos (Active Orders)
- **Current Formula:** Sum of orders with `status === "pending" || status === "preparing" || status === "ready"`.
- **Exclusions:** Excludes `completed` and `cancelled`.
- **UI Label:** "Pedidos activos", subtitle: "Pendientes + preparación + listos".
- **Risk (P3):** No semantic drift. The subtitle explicitly communicates the exact 3 statuses included.

### 5.4 Más vendido (Best Seller / Top Product) — Core Forensic Finding
- **Current Formula (`lib/orders/analytics.ts:getTopProducts`):**
  ```typescript
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.order_items_preview ?? []) {
      const productName = item.product_name.trim();
      if (!productName) continue;
      products.set(productName, (products.get(productName) ?? 0) + item.quantity);
    }
  }
  ```
- **The Forensic Cause of "Coca Cola 500ml":**
  1. In OrderOps, order items are stored in `order_items` table.
  2. When an upsell/adicional item (like a beverage or extra side) is added to a burger or main product, it is inserted as a child row with `item_kind = 'upsell'` and `parent_order_item_id = '<parent_item_id>'`.
  3. `getTopProducts()` iterates over flat `order_items_preview` without checking `item_kind` or `parent_order_item_id`.
  4. If 5 customers order different main dishes (e.g. 2 Doble Burger, 2 Triple Smash, 1 Veggie) and each attaches a "Coca Cola 500ml", the aggregation produces:
     - `Coca Cola 500ml`: 5 units (Winner)
     - `Doble Burger`: 2 units
     - `Triple Smash`: 2 units
     - `Veggie`: 1 unit
- **Risk (P1 - High Semantic Ambiguity):** A merchant looking at "Más vendido" expects to identify their top revenue-driving main food item/dish, but currently sees cross-sell condiments/beverages because child upsells are counted flatly alongside main items.
- **Semantic Options:**
  - **Option A (Recommended for Primary Metric):** "Producto más pedido" (Root products only: `parent_order_item_id == null` and `item_kind !== 'upsell'`).
  - **Option B:** "Ítem más vendido" (Keep flat rows, but relabel metric to avoid misunderstanding).
  - **Option C:** "Adicional más vendido" (Upsell children only).
  - **Option D (Split Presentation):** Primary card = "Producto más pedido" (Root), Secondary subtitle/badge = "Adicional top: Coca Cola 500ml".

### 5.5 Estado de cocina (Kitchen Status)
- **Current Formula:** Evaluates `preparing` orders against fixed kitchen capacity (`IDEAL_KITCHEN_CAPACITY = 5`, base 15 min prep).
  - Load $\le 79\%$: "Cocina fluida" (success)
  - Load $80\% - 100\%$: "Alta demanda (X%)" (warning)
  - Load $> 100\%$: "Saturada / Cuello de botella" (danger)
  - Active orders $= 0$: "Sin actividad" (neutral)
- **Risk (P2):** Hardcoded capacity of 5 orders across all tenants without tenant-level customization. Also ignores backlogged `pending` orders waiting to be started.
- **Recommendation:** Retain current formula for SaaS baseline; schedule tenant capacity configuration for future phases.

### 5.6 Pedidos demorados (Delayed Orders)
- **Current Formula:** Evaluates active orders (`pending`, `preparing`, `ready`) where $(now - \text{lastActivityAt}) \ge \text{STALLED\_INACTIVE\_MINUTES (20 min)}$.
- **Data Basis:** `lastActivityAt = max(order.created_at, order.assigned_at, ...order_events.created_at)`.
- **Risk (P2):** 20 minutes is evaluated uniformly across all statuses. While 20 minutes of inactivity in `pending` is a severe failure (order unacknowledged), 20 minutes in `preparing` might be expected for complex orders.
- **Recommendation:** Maintain current unified threshold for session baseline; introduce state-aware thresholds in future enhancements.

### 5.7 Tiempo promedio (Average Time)
- **Current Formula:** Averages preparation duration for all orders in the window that have reached `ready` status:
  $$\text{Duration} = \text{Timestamp}(\text{event: ready}) - \text{Timestamp}(\text{event: preparing or created\_at})$$
- **Subtitle:** "Preparación".
- **Risk (P2):** Labeled "Tiempo promedio", with subtitle "Preparación". If an order was created directly in ready (e.g. manual offline order) or lacks timeline events, duration cannot be computed.
- **Recommendation:** The formula correctly computes preparation duration as stated in the subtitle. Keep subtitle prominent.

### 5.8 Listos esperando salida (Ready Waiting for Dispatch)
- **Current Formula:** Count of all orders with `status === 'ready'`.
- **Inclusions:** Includes both `delivery_method === 'delivery'` and `delivery_method === 'pickup'`.
- **Risk (P2):** The wording "esperando salida" suggests delivery dispatch only, but counter pickup orders waiting for customer arrival are also counted.
- **Recommendation:** Relabel to "Listos para entrega/retiro" or keep "Listos esperando salida" with subtitle "Delivery y retiro en local".

---

## 6. Session Signals Audit

The insight strip in `DashboardOverview` evaluates real-time rules in priority order:

| Signal Key | Visible Title | Trigger Condition | Tone | Actionable CTA | Risk | Recommendation |
| ---------- | ------------- | ----------------- | ---- | -------------- | ---- | -------------- |
| `stalled-orders` | **Revisar demorados** | `operational.stalledCount > 0` | `warning` | Filters lane to delayed | Low | High value; keep as P10 priority. |
| `ready-waiting` | **Pedidos listos** | $\text{Count}(\text{ready}) \ge 2$ | `warning` | Filters lane to ready | Low | Alerts dispatchers of buildup. |
| `recent-peak` | **Pico reciente** | $\ge 3$ orders created in last 10 min | `info` | Highlights recent orders | Low | Proactive traffic surge alert. |
| `delivery-dominance` | **Delivery domina la sesión** | $\frac{\text{Delivery}}{\text{Total}} \ge 70\%$ (min 1 order) | `neutral` | Filters lane to delivery | Low | Logistics resource planning signal. |
| `pickup-dominance` | **Retiro domina la sesión** | $\frac{\text{Pickup}}{\text{Total}} \ge 70\%$ (min 1 order) | `neutral` | Filters lane to pickup | Low | Front counter resource planning signal. |
| `positive-operations` | **Operación al día** | Fallback when 0 delays & active orders $> 0$ | `success` | None | Low | Positive operational feedback. |

---

## 7. Order Item & Upsell Semantics

OrderOps currently has two distinct ways order items are consumed:

1. **Dashboard Order Cards (Frozen):**
   - Uses `buildDashboardOrderCardSummary` / `buildDashboardOrderItemTree`.
   - Filters out child rows (`item_kind === 'upsell' && parent_order_item_id != null`).
   - Counts only root parent items for card badge (e.g., "1x Doble Smash" instead of "3 items").
2. **Dashboard Overview Metrics (`analytics.ts:getTopProducts`):**
   - Consumes raw flat `order_items_preview`.
   - Does NOT use `buildDashboardOrderItemTree`.
   - Treats root products and child upsells identically.

**Architecture Alignment Recommendation:**
`getTopProducts()` should be updated in a future phase to use the same tree model as `buildDashboardOrderItemTree`, counting root products for "Producto más pedido" and optionally exposing child upsells as a separate analytical dimension.

---

## 8. Time Window & Session Semantics

| Metric | Current Time Window | Recommended Time Window | Rationale |
| ------ | ------------------- | ----------------------- | --------- |
| **Ventas** | `operationalWindow` (Session start $\to$ now) | Same | Shift revenue must strictly align with current store session. |
| **Ticket promedio** | `operationalWindow` | Same | Accurately reflects current shift spend behavior. |
| **Pedidos activos** | `operationalWindow` | Same | Active orders within current operational window. |
| **Más vendido** | `operationalWindow` | Same | Reflects shift top performers. |
| **Estado de cocina** | `operationalWindow` | Same | Current operational load. |
| **Pedidos demorados** | `operationalWindow` | Same | Inactive orders in active shift. |
| **Tiempo promedio** | `operationalWindow` | Same | Average prep time of current shift. |
| **Listos esperando** | `operationalWindow` | Same | Orders waiting in current shift. |

---

## 9. Status Inclusion Matrix

| Status | Ventas (Revenue) | Ticket Promedio | Pedidos Activos | Pedidos Demorados | Tiempo Promedio | Listos Esperando | Más Vendido |
| ------ | :--------------: | :-------------: | :-------------: | :---------------: | :-------------: | :--------------: | :---------: |
| `pending` | Yes | Yes | **Yes** | **Yes** (if inactive $\ge 20$m) | No | Yes |
| `preparing` | Yes | Yes | **Yes** | **Yes** (if inactive $\ge 20$m) | Partial (start time) | No | Yes |
| `ready` | Yes | Yes | **Yes** | **Yes** (if inactive $\ge 20$m) | **Yes** (end time) | **Yes** | Yes |
| `completed` | Yes | Yes | **No** | **No** | **Yes** (if had ready) | **No** | Yes |
| `cancelled` | **No** | **No** | **No** | **No** | **No** | **No** | **No** |

---

## 10. Risk Classification (P0–P3)

- **P0 (Blocker):** None.
- **P1 (High Semantic Ambiguity):** `topProduct` ("Más vendido") aggregates flat child upsells and root products interchangeably, causing items like "Coca Cola 500ml" to displace main dishes.
- **P2 (Operational Nuance):**
  - `readyWaiting` ("Listos esperando salida") includes both delivery and counter pickup orders.
  - `kitchenStatus` uses hardcoded capacity of 5 orders without tenant scaling.
  - `delayedOrders` uses a flat 20-minute threshold across all active statuses.
- **P3 (Accepted / Documented Behavior):**
  - `revenue` and `averageTicket` include in-flight active orders (standard for live operational shift dashboard).

---

## 11. Recommended Implementation Plan

1. **Phase 1: `ADMIN-DASHBOARD-METRICS-SEMANTIC-FIX-1`**
   - Update `getTopProducts()` in `lib/orders/analytics.ts` to filter by root products (`parent_order_item_id == null` / `item_kind !== 'upsell'`).
   - Clarify label to `"Producto más pedido"`.
   - Update `readyWaiting` subtitle/label to explicitly mention delivery + pickup.
2. **Phase 2: `ADMIN-DASHBOARD-METRICS-RUNTIME-QA-1`**
   - Execute deterministic verification tests against complex order trees (multi-root with upsells, combos, orphan items, zero-orders sessions).
   - Validate desktop and mobile overview synchronization.
3. **Phase 3 (Optional Feature): `ADMIN-DASHBOARD-METRICS-ADDITIONALS-SPLIT-1`**
   - Add secondary KPI or badge for "Adicional top" alongside "Producto más pedido".

---

## 12. Verification & Files Changed

### Files Changed (Docs Only)
- `docs/admin-dashboard-metrics-semantic-audit-1.md` (Created)
- `docs/CURRENT_PHASE.md` (Updated)
- `docs/admin-dashboard-forensic-living-audit.md` (Updated changelog)
- `ORDEROPS_LIVING_MEMORY.md` (Updated changelog)

### Runtime Changes
- **NONE** (0 runtime TS/TSX, 0 CSS, 0 DB/SQL/RPC files modified).

---

## 13. Gate

```text
ADMIN-DASHBOARD-METRICS-SEMANTIC-AUDIT-1
STATUS: PASS — AUDIT COMPLETE — READY FOR PRODUCT DECISION
DASHBOARD METRICS SEMANTICS: AUDITED / NOT IMPLEMENTED
DASHBOARD CARD ROOT COUNT: REMAINS FROZEN
ORDER CODE BLOCK: REMAINS CLOSED
PUBLIC SUCCESS WHATSAPP COPY: REMAINS FROZEN
DASHBOARD OVERALL POLISH: OPEN
```
