# Admin Dashboard Top Section Data Mapping Audit

**Phase:** D1 — Data Mapping Audit  
**Status:** Documentation only — no code changes  
**Route:** `/admin/dashboard`  
**Functional SSOT:** `docs/admin-dashboard-top-section-product-contract.md` (D0)  
**Visual/structure reference:** `docs/admin-dashboard-top-section-token-audit.md`

---

## 1. Executive Summary

This audit maps every D0-approved data point for the dashboard top section to its **current source code**, **consumption path**, **session scoping**, and **alignment with D0**.

**Critical finding (P0):** The top section **labels** the horizon as “Sesión activa” when a store session is open, but **computes** overview KPIs, operational metrics, and micro-insights from `businessWindowOrders` — orders filtered by **`getOrdersInBusinessWindow`** (default calendar window 00:00–24:00), **not** `visibleOperationalOrders` / **`getOrdersInOperationalWindow`**. Session-scoped analytics already exist (`dayScopedCommercialAnalytics` on `visibleOperationalOrders`) but are used only for search risk matching, not for `DashboardOverview`.

**Secondary findings:**
- Business KPI grid shows **Completados**, not **Más vendido** (D0 grid mismatch).
- Operational strip has **3** KPIs (Cocina, SLA, Riesgo), not D0’s **4** (Demorados, Tiempo, Listos missing from grid).
- **Status summary** block does not exist as a composed datum.
- **Más vendido** data exists via `getTopProducts()` / `topProduct` in extended insights but is not in `CORE_OVERVIEW_KPI_KEYS`.
- **Pico reciente** exists in `buildBusinessInsights` (context panel path), not in `buildOperationalDashboardInsights` (top micro-insights).
- **Listos esperando salida** count is derivable; no dedicated helper or top insight.
- **Presence** shows “Solo vos” when `onlineCount <= 1` — conflicts with D0 §13.

**Classification totals (18 audited data points):**

| Classification | Count |
|----------------|------:|
| READY | 0 |
| PARTIAL | 11 |
| MISSING | 3 |
| CONFLICTS_WITH_D0 | 4 |
| NEEDS_D2_NORMALIZATION | 7 |
| NEEDS_NEW_HELPER_LATER | 3 |
| OUT_OF_SCOPE | 0 |

No implementation was performed in D1.

---

## 2. References

| Document | Role |
|----------|------|
| `docs/admin-dashboard-top-section-product-contract.md` | Functional contract (D0) — must not be contradicted |
| `docs/admin-dashboard-top-section-token-audit.md` | Current components, CSS, visual debt |
| `lib/orders/analytics.ts` | Window scoping, revenue, ticket, top product |
| `lib/orders/metrics.ts` | Operational metrics, dashboard insights builder |
| `components/admin/orders/admin-dashboard-orders.tsx` | Wiring: which dataset feeds overview |

---

## 3. Scope Audited

### In scope

- 4 business KPIs (Ventas, Ticket promedio, Pedidos activos, Más vendido)
- 4 operational KPIs (Estado de cocina, Pedidos demorados, Tiempo promedio, Listos esperando salida)
- Status summary (health label, tone, session revenue)
- 6 insight categories from D0
- Session scoping (`operationalWindow`, `businessWindowOrders`, `visibleOperationalOrders`)
- Current data flow into `DashboardOverview` and passive micro-insights

### Out of scope

- Lanes, order cards, modal, toolbar, search/filter UI, mobile, DB, realtime implementation changes

---

## 4. Files Audited

| File | Relevance |
|------|-----------|
| `app/admin/(protected)/dashboard/page.tsx` | SSR: `getAdminOrders`, `getActiveStoreSession` |
| `components/admin/orders/admin-dashboard-orders.tsx` | Overview wiring, useMemo chains, props |
| `components/admin/orders/DashboardOverview.tsx` | Consumes KPI/operational props |
| `components/admin/orders/DashboardMobileOverview.tsx` | Mobile parity (same data props) |
| `lib/orders/analytics.ts` | Windows, revenue, ticket, top products, analytics builder |
| `lib/orders/metrics.ts` | Operational metrics, stalled, insights builder |
| `lib/orders/saturation-metrics.ts` | Estado de cocina candidate |
| `lib/orders/sla-metrics.ts` | SLA (current strip, not D0 operational KPI) |
| `lib/orders/prescriptive-actions.ts` | Riesgo operativo (current strip) |
| `lib/orders/queue-pressure.ts` | Header pill + readyCount (today-scoped) |
| `lib/orders/business-insights.ts` | Pico reciente (context panel) |
| `lib/orders/constants.ts` | Thresholds |
| `lib/orders/admin.ts` | `order_items_preview` population |
| `lib/orders/presenter.ts` | `formatAdminOrderCurrency` |
| `lib/orders/risk-detection.ts` | Prescriptive at-risk count |
| `lib/orders/events.shared.ts` | Timeline / reverted status |
| `components/admin/orders/use-admin-orders-realtime.ts` | Live label |
| `components/admin/orders/use-admin-presence.ts` | Presence count |

**Searched but low impact for top section:** `lib/orders/status.ts`, `lib/orders/workflow.ts` — no direct overview KPI builders.

---

## 5. Current Data Flow Map

```
AdminDashboardPage
  → getAdminOrders(businessId)           [all orders for business, SSR]
  → getActiveStoreSession(businessId)    [initial session seed]
  → AdminDashboardOrders

AdminDashboardOrders
  → optimisticOrders                     [realtime-patched copy of orders]
  → activeStoreSessionState              [client session state]
  → liveOperationalNow                   [now or latest order + 1s in open session]
  → operationalWindow                    [getOperationalWindow(...)]  ← session OR business fallback
  → businessWindowOrders                 [getOrdersInBusinessWindow]    ← ⚠ OVERVIEW DATA SOURCE
  → visibleOperationalOrders             [getOrdersInOperationalWindow] ← session-scoped, NOT used for overview KPIs

  Overview builders (all use businessWindowOrders unless noted):
  → overviewCommercialAnalytics          [buildAdminOrdersAnalytics]
  → overviewOperationalMetrics           [buildOperationalMetrics]
  → overviewSaturationIndex              [calculateSaturationIndex]
  → overviewSLACompliance              [calculateSLACompliance]
  → overviewPrescriptiveAction           [buildPrescriptiveActions]
  → overviewOperationalDashboardInsights [buildOperationalDashboardInsights]
  → overviewQueuePressure              [buildOrdersQueuePressure]     ← uses getTodayActiveOrders internally

  Derived for DashboardOverview:
  → dashboardOverviewKpiMetrics          [CORE_OVERVIEW_KPI_KEYS → overviewCommercialInsights]
  → dashboardOverviewOperationalMetrics  [3 items: kitchen, SLA, prescriptive]
  → overviewOperationalDashboardInsights [rendered as passive micro-insights]
  → topBarRealtimeLabel                  [useAdminOrdersRealtime]
  → dashboardSessionScopeLabel           [operationalWindow.source label only]
  → globalPresenceLabel / shouldShowGlobalPresence

  DashboardOverview props:
    liveLabel, sessionScopeLabel, showGlobalPresence, globalPresenceLabel,
    queuePressure, kpiMetrics, operationalMetrics

  Separate path (execution / context — not top overview grid):
  → filteredOrders                       [visibleOperationalOrders + filter + search]
  → commercialAnalytics / operationalMetrics / businessInsights / operationalSummaries
```

### Where data is computed vs consumed

| Stage | Location | Notes |
|-------|----------|-------|
| **Computed** | `lib/orders/analytics.ts`, `metrics.ts`, `saturation-metrics.ts`, etc. | Pure functions on order arrays |
| **Scoped** | `admin-dashboard-orders.tsx` L1414–1427 | Two parallel order sets; overview picks wrong one for D0 |
| **Labels formatted** | `formatOperationalInsightValue`, `formatStalledMetricValue`, `formatSaturationLabel`, `formatDashboardSnapshotLabel` | Mix of lib + inline formatters in orchestrator |
| **Tones assigned** | `saturation-metrics`, `sla-metrics`, `prescriptive-actions`, insight `tone` fields | Passed as `DashboardOverviewMetricTone` |
| **Top section consumes** | `DashboardOverview.tsx`, passive micro-insights JSX | No status summary |
| **Conflicts with D0** | Dataset scoping, KPI set, grid count, header badges, insight surface | See §11–§13 |

### Key useMemo / props (real names)

```tsx
// admin-dashboard-orders.tsx — overview consumption
<DashboardOverview
  liveLabel={topBarRealtimeLabel}
  sessionScopeLabel={dashboardSessionScopeLabel}
  showGlobalPresence={shouldShowGlobalPresence}        // onlineCount > 0
  globalPresenceLabel={globalPresenceLabel}            // "Solo vos" | "N online"
  queuePressure={overviewQueuePressure}
  kpiMetrics={dashboardOverviewKpiMetrics}           // revenue, activeOrders, completedOrders, averageTicket
  operationalMetrics={dashboardOverviewOperationalMetrics}  // 3 items only
/>
{overviewOperationalDashboardInsights.map(...)}        // passive micro-insights
```

`CORE_OVERVIEW_KPI_KEYS`: `revenue`, `activeOrders`, `completedOrders`, `averageTicket` — **excludes `topProduct`**.

---

## 6. Session Scoping Audit

### How `operationalWindow` is born

| Step | Code | Behavior |
|------|------|----------|
| 1 | `getOperationalWindow(liveOperationalNow, BUSINESS_WINDOW_CONFIG, activeStoreSessionState)` | If open store session → `{ start: openedAt, end: now, source: "store-session" }` |
| 2 | Fallback | `getCurrentBusinessWindow` → `{ source: "business-window" }` (default 00:00–24:00 local) |
| 3 | Order filter (session) | `getOrdersInOperationalWindow(orders, { start, end })` — **`created_at >= start && created_at < end`** |
| 4 | Order filter (business) | `getOrdersInBusinessWindow(orders, now, config)` — same timestamp rule, business window bounds |

### What `source === "store-session"` means

UI copy: `dashboardSessionScopeLabel` → `"Sesión activa"`.  
Data: **Overview metrics do not use `visibleOperationalOrders`**. They use `businessWindowOrders` (full-day window). **Label and data diverge.**

### Fallback when no active store session

- `operationalWindow.source === "business-window"`
- Label: `"Jornada actual"`
- D0 allows fallback; overview still uses `businessWindowOrders` — consistent with fallback label, **inconsistent when session is open**

### Which orders enter the dashboard

- SSR loads all business orders (`getAdminOrders`).
- Client keeps full list in `optimisticOrders`; realtime patches merge in.
- Overview subset: **`businessWindowOrders`** (today by default config).
- Kanban/search subset: **`visibleOperationalOrders`** then filters.

### Realtime and window edge cases

| Edge case | Current behavior | D0 expectation | Gap |
|-----------|------------------|------------------|-----|
| No active session | Business window orders; label “Jornada actual” | Fallback OK | None for fallback path |
| Session open | Label “Sesión activa”; data = full business window | Session-scoped orders only | **P0 CONFLICT** |
| Session opens while mounted | `operationalWindow` updates; `visibleOperationalOrders` shrinks; overview still full-day | Overview should rescope | **P0** |
| Session closes while mounted | Inverse | Overview should rescope | **P0** |
| Orders before session opened | Excluded from `visibleOperationalOrders` | Excluded from KPIs | Included in overview today |
| Orders after session (closed) | Depends on `created_at` vs window end | N/A in active session | Edge in D2 |
| Cancelled orders | Excluded from revenue/top product; counted in `cancelledCount` metric | Excluded from Ventas | OK in formulas |
| Realtime insert during session | Lands in `optimisticOrders`; included if `created_at` in window | Session scope | Overview may include if created “today” but before session open |

### Existing session-scoped analytics (unused for overview)

```tsx
const dayScopedCommercialAnalytics = useMemo(
  () => buildAdminOrdersAnalytics(visibleOperationalOrders),
  [visibleOperationalOrders]
);
```

Used only for `matchesOperationalSearch` average ticket reference — **proves session-scoped pipeline exists; overview does not use it.**

---

## 7. Business KPI Data Map

### 7.1 Ventas

| Field | Value |
|-------|-------|
| **Source function** | `getTotalRevenue(orders)` via `buildAdminOrdersAnalytics` → `overviewCommercialAnalytics.revenue` |
| **Formatter** | `formatOperationalInsightValue("revenue", …)` → `formatAdminOrderCurrency` (`es-AR` ARS) |
| **Current behavior** | Sums `total_price` for all orders where `status !== "cancelled"`. Order statuses in system: `pending`, `preparing`, `ready`, `completed`, `cancelled` — effectively **active + completed only**. |
| **Session scoped?** | **No** — input is `businessWindowOrders` (calendar business window), not `visibleOperationalOrders`. |
| **Consumed where** | `dashboardOverviewKpiMetrics` key `revenue`; mobile `daySummaryInsights` |
| **D0 alignment** | Status inclusion **matches** D0. Window scoping **conflicts** when store session active. Fallback `$0,00` when revenue=0 via currency formatter. |
| **Gaps** | Wrong order set for session mode; UI mislabels horizon. |
| **Recommended D2/D3** | Build overview from `visibleOperationalOrders` (or shared session-scoped array). Reuse `getTotalRevenue` on that array. |
| **Risk** | **P0** — overstated ventas vs “Sesión activa” |
| **Status** | **CONFLICTS_WITH_D0** |

---

### 7.2 Ticket promedio

| Field | Value |
|-------|-------|
| **Source function** | `buildAdminOrdersAnalytics` → `averageTicket` = `revenue / validOrdersCount` where `validOrdersCount` = count of non-cancelled orders |
| **Denominator** | All non-cancelled orders in input array (active + completed) |
| **Session scoped?** | **No** — `businessWindowOrders` |
| **Fallback** | `0` → formatted as `$0,00` via `formatAdminOrderCurrency` (not `"Sin datos"`) |
| **Consumed where** | `dashboardOverviewKpiMetrics` key `averageTicket` |
| **D0 alignment** | Denominator ambiguous in D0 (“pedidos considerados”); current = all non-cancelled in window. **Partial semantic match.** Window **conflicts** in session mode. |
| **Gaps** | Scope conflict; fallback policy vs D0 “Sin datos or $0,00” undecided in presenter |
| **Recommended D2/D3** | Session-scoped array + explicit presenter rule: `validOrdersCount === 0` → `"Sin datos"` |
| **Risk** | **P1** — wrong ticket in session mode; zero-edge copy |
| **Status** | **CONFLICTS_WITH_D0** |

---

### 7.3 Pedidos activos

| Field | Value |
|-------|-------|
| **Source function** | `getActiveOrdersCount(orders)` — `pending` + `preparing` + `ready` |
| **Session scoped?** | **No** — `businessWindowOrders` |
| **Formatter** | `` `${analytics.activeOrders} pedidos` `` |
| **Consumed where** | `dashboardOverviewKpiMetrics` key `activeOrders`; label shortened to snapshot via `formatDashboardSnapshotLabel` only for some keys — KPI label from insight is `"Activos"` not `"Pedidos activos"` |
| **D0 alignment** | Formula **READY**. Scope **CONFLICTS** in session mode. Label **NEEDS_D2_NORMALIZATION** → `"Pedidos activos"`. |
| **Gaps** | Scope; label copy |
| **Recommended D2/D3** | Session-scoped count; normalize label |
| **Risk** | **P1** |
| **Status** | **CONFLICTS_WITH_D0** (scope); formula otherwise READY |

---

### 7.4 Más vendido

| Field | Value |
|-------|-------|
| **Source function** | `getTopProducts(orders)` → `[0]` stored as `analytics.topProduct` |
| **Data source** | `order.order_items_preview` — populated from full `order.order_items` via `normalizeDashboardOrderItems` in `lib/orders/admin.ts` (not a truncated preview despite name) |
| **Cancelled** | Excluded |
| **Tie-break** | Quantity desc, then `name.localeCompare` |
| **Session scoped?** | **No** — `businessWindowOrders` |
| **In primary grid?** | **No** — exists in `overviewCommercialInsights` key `topProduct`, excluded from `CORE_OVERVIEW_KPI_KEYS` |
| **Formatter** | `` `${name} · ${quantity}` `` or `"Sin datos"` |
| **D0 fallback** | `"Sin ventas todavía"` — **not current copy** |
| **D0 example units** | `"BBQ Bacon · 2 unidades"` — current omits word `unidades` |
| **Confidence** | **Medium** — items come from SSR order load; empty `order_items` → no product; cancelled excluded; session scope wrong |
| **Gaps** | Not in KPI grid; scope; copy/units; edge empty items |
| **Recommended D2/D3** | Promote `topProduct` to business KPI slot; session scope; normalize fallback/format in presenter |
| **Risk** | **P1** |
| **Status** | **PARTIAL** |

---

## 8. Operational KPI Data Map

### 8.1 Estado de cocina

| Field | Value |
|-------|-------|
| **Current source candidates** | `calculateSaturationIndex(orders)` — preparing count vs ideal capacity; `buildOrdersQueuePressure`; `buildPrescriptiveActions`; `overviewOperationalMetrics.averagePreparationMinutes` |
| **Primary consumer today** | `dashboardOverviewOperationalMetrics[0]` — `overviewSaturationIndex.label` + `tone` |
| **Current labels** | `Cocina fluida` · `Alta demanda` / `Alta demanda (N%)` · `Saturacion / Cuello de botella` |
| **D0 approved labels** | `Cocina fluida` · `Atención requerida` · `Saturada` · `Sin actividad` |
| **Session scoped?** | Input `businessWindowOrders` — **conflicts in session mode** |
| **Composite formula** | **Not implemented** — saturation only today |
| **Conflicts** | Label set mismatch; no `Sin actividad`; no composite; SLA/Riesgo are separate columns today |
| **Recommended D2 normalization** | Map saturation levels → D0 labels; add `Sin actividad` when `preparingCount === 0 && activeCount === 0`; composite rules in **NEEDS_NEW_HELPER_LATER** (`resolveKitchenStatus` in D2 design, implement D3+) |
| **Status** | **NEEDS_D2_NORMALIZATION** + **NEEDS_NEW_HELPER_LATER** for composite |

---

### 8.2 Pedidos demorados

| Field | Value |
|-------|-------|
| **Source** | `buildOperationalMetrics` → `stalledCount` |
| **Threshold** | `STALLED_INACTIVE_MINUTES` = **20** (`OPERATIONAL_THRESHOLDS`) |
| **Definition** | Active orders (`pending`/`preparing`/`ready`) where minutes since last activity ≥ threshold |
| **Last activity** | Max of `created_at`, `assigned_at`, `order_events[].created_at` |
| **Formatter (extended)** | `formatStalledMetricValue` → `"Sin demoras"` or `"N estancados"` |
| **In overview grid?** | **No** — only in `overviewOperationalInsights` extended list and micro-insight `stalled-orders` |
| **Naming** | Code: stalled / estancados / demorados mixed |
| **Session scoped?** | **No** — `businessWindowOrders` |
| **Recommended D2** | Normalize to `"Pedidos demorados"` / `"Sin demoras"` / `"N pedidos"`; use `stalledCount` as MVP value |
| **Status** | **PARTIAL** |

---

### 8.3 Tiempo promedio

| Field | Value |
|-------|-------|
| **Candidates** | `averageCompletionMinutes` — avg time from `created_at` to `completed` event (completed orders only). `averagePreparationMinutes` — avg from `preparing` start to `ready` event (orders that reached ready). |
| **In overview strip today** | **Neither** — strip shows Cocina, SLA, Riesgo. Both averages exist in `overviewOperationalInsights` extended array only. |
| **Fallback** | `formatOperationalMetricMinutes(null)` → `"Sin datos"` |
| **Session scoped?** | **No** |
| **D0 recommendation (D1 opinion)** | **`averagePreparationMinutes`** better matches “ritmo operativo” for active kitchen; **`averageCompletionMinutes`** is lagging (completed only). For mixed active+completed session view, D2 should pick **one** primary metric and document secondary in view model notes. |
| **Threshold tones** | Not defined — D0 deferred |
| **Status** | **PARTIAL** — data exists, KPI slot and metric choice undecided |

---

### 8.4 Listos esperando salida

| Field | Value |
|-------|-------|
| **Count available** | **Yes** — derivable: `orders.filter(o => o.status === "ready").length` or `getOrdersByStatus(orders).ready` or `buildOrdersQueuePressure(...).readyCount` (but queue pressure filters **`getTodayActiveOrders`** — today business window, not session) |
| **Dedicated helper** | **No** |
| **In DashboardOverview** | **No** |
| **Age available** | **Partial** — can parse `order_events` for `to_status === "ready"` timestamp (same pattern as `getOrderPreparationMinutes`); no `ready_since` field |
| **Pickup/delivery split** | Not in existing count helpers |
| **Recommended MVP** | Count only from session-scoped orders in D2 presenter |
| **Future** | Age-based warning thresholds — out of D0/D1 |
| **Status** | **PARTIAL** — **NEEDS_NEW_HELPER_LATER** for reusable count + optional age in D3+ |

---

## 9. Status Summary Data Map

**D0 contract:** Unified block — health label, tone, session revenue line. **Not implemented today.**

| Field | Source candidates | Assessment |
|-------|-------------------|------------|
| **healthLabel** | `overviewSaturationIndex.label`, `buildPrescriptiveActions().label`, `formatStalledMetricValue`, queue `pressureLevel` | No single composer; prescriptive copy is imperative-adjacent (“Atención requerida en N pedidos”) — D0 says status summary must not be “Próxima acción” |
| **healthTone** | Saturation / prescriptive / stalled tones | Must be derived by priority rules in D2 (operational risk > calm) |
| **revenueLabel** | Same as Ventas KPI — `formatAdminOrderCurrency(overviewCommercialAnalytics.revenue)` with session fix | **PARTIAL** once scope fixed |
| **detail** (optional) | e.g. `"Ventas de sesión: $44.000,00"` | Format in presenter |

**Proposed D2 shape (documentation only — not implemented):**

```ts
statusSummary: {
  label: string       // e.g. "Estado del negocio"
  healthLabel: string // D0 kitchen/health vocabulary
  tone: "success" | "warning" | "danger" | "neutral"
  detail: string      // e.g. "Ventas de sesión: $44.000,00"
  revenueLabel: string
}
```

**Suggested D2 priority rules (design only):**

1. If `stalledCount > 0` → health tends warning; copy references demora
2. Else if saturation `bottleneck` / `high_demand` → `Saturada` / `Atención requerida`
3. Else if `preparingCount === 0 && activeOrders === 0` → `Sin actividad`
4. Else → `Cocina fluida`

**Status:** Block **MISSING**; inputs **PARTIAL**; composer **NEEDS_NEW_HELPER_LATER** (D2 design, D3+ implement)

---

## 10. Insight Data Map

### 10.1 Pedidos demorados

| Field | Value |
|-------|-------|
| **Exists?** | **Yes** — `buildOperationalDashboardInsights` id `"stalled-orders"` |
| **Title** | `"Revisar pedidos demorados"` (D0 example: `"Revisar demorados"`) |
| **Detail** | `"N pedido(s) sin movimiento"` |
| **Tone** | `warning` |
| **Scope** | `businessWindowOrders` |
| **Max insights** | `.slice(0, 3)` — may drop lower-priority insights |
| **Future filter** | D10 — stalled/delayed focus |
| **Status** | **PARTIAL** — **NEEDS_D2_NORMALIZATION** (copy) |

---

### 10.2 Delivery domina hoy

| Field | Value |
|-------|-------|
| **Exists?** | **Yes** — id `"delivery-dominance"` in `buildOperationalDashboardInsights` |
| **Threshold** | `DELIVERY_DOMINANCE_RATIO` = **0.7** (70%) |
| **Detail** | `` `${deliveryCount} de ${totalDeliveryMix} pedidos` `` |
| **Scope** | Orders in insight builder input (`businessWindowOrders`); counts **all** orders in array by delivery_method, not only active |
| **Status** | **PARTIAL** — scope + “hoy” wording vs session |

---

### 10.3 Retiro domina hoy

| Field | Value |
|-------|-------|
| **Exists?** | **Yes** — id `"pickup-dominance"` |
| **Same threshold** | 70% pickup ratio |
| **Status** | **PARTIAL** — same scope notes as delivery |

---

### 10.4 Muchos pedidos listos sin salida

| Field | Value |
|-------|-------|
| **In top insights?** | **No** |
| **Related copy elsewhere** | `lane-metrics.ts`, `delivery-workflow-lanes.ts` — lane-level messages, not overview insights |
| **Derivable?** | Yes from ready count; insight template in D0 not generated today |
| **Recommended D7** | New insight when `readyCount >= threshold` (threshold TBD D2) |
| **Status** | **MISSING** |

---

### 10.5 Pico de pedidos reciente

| Field | Value |
|-------|-------|
| **In top micro-insights?** | **No** |
| **Exists elsewhere** | `buildBusinessInsights` kind `"recent-peak"` |
| **Window** | `RECENT_PEAK_WINDOW_MINUTES` = **10** (D0 example: 15 min) |
| **Threshold** | `RECENT_PEAK_MIN_ORDERS` = **3** |
| **Input orders** | `filteredOrders` (context panel path), not overview dataset |
| **Title** | `"Pico reciente"` — matches D0 |
| **Recommended D7** | Port logic into top-section insight builder or share builder with session-scoped orders |
| **Status** | **PARTIAL** — **NEEDS_NEW_HELPER_LATER** or reuse `buildBusinessInsights` slice in D3 |

---

### 10.6 Insights positivos

| Current support | Location | D0 fit |
|-----------------|----------|--------|
| `Operacion tranquila` / `Operacion estable` | `buildOperationalDashboardInsights` fallback ids `calm-ops` / `stable-ops` | Partial — D0 mentions `Buen ritmo operativo` |
| `Sin demoras` | `formatStalledMetricValue` | Partial |
| `Cocina fluida` | Saturation label | Yes — but KPI not insight row today |
| `Operacion fluida` | `buildPrescriptiveActions` success | Partial |
| `Sin promesas activas` | `formatSLAComplianceMetric` | SLA demoted from D0 operational grid — optional positive insight only |
| `Sin pedidos activos demorados` | calm-ops detail | Partial |

**Gap:** Positive insights exist but fragmented; max 3 cap suppresses mix.  
**Recommended D7:** Explicit positive insight slots in presenter when no warnings.  
**Status** | **PARTIAL**

---

## 11. Current vs D0 Contract Alignment

| D0 requirement | Current state | Alignment |
|----------------|---------------|-----------|
| Session-scoped metrics | Overview uses `businessWindowOrders` | **Fail** when session open |
| 4 business KPIs incl. Más vendido | 4 KPIs incl. Completados, not Más vendido | **Fail** |
| 4 operational KPIs | 3 in strip (Cocina, SLA, Riesgo) | **Fail** |
| Status summary block | Absent | **Fail** |
| Hide “Solo vos” when alone | Shows when `onlineCount > 0` (includes 1) | **Fail** |
| No dominant “Requiere atención” pill | `overviewQueuePressure` in header | **Fail** (UI; data exists) |
| No comparatives | Not shown | **Pass** |
| Insights descriptive | Passive text, max 3 | **Partial** |
| Ventas = active + completed | Formula OK on statuses | **Pass** (formula only) |
| Pedidos activos formula | OK | **Pass** (formula only) |

---

## 12. Missing / Partial Data

| Data point | Gap type | Notes |
|------------|----------|-------|
| Session-scoped overview dataset | **Missing wiring** | `visibleOperationalOrders` exists |
| Status summary composer | **Missing** | No view model field |
| Más vendido in KPI grid | **Partial** | Data in extended insights |
| Listos esperando salida KPI | **Partial** | Count derivable |
| Listos insight | **Missing** | No builder entry |
| Pico in top insights | **Partial** | Only in `buildBusinessInsights` |
| Composite Estado de cocina | **Partial** | Saturation only |
| Tiempo promedio KPI slot | **Partial** | Metrics exist, not in strip |
| D0 label/copy normalization | **Partial** | Multiple naming systems |

---

## 13. Conflicts With D0

| ID | Conflict | Evidence |
|----|----------|----------|
| C-01 | **Session label vs data** | `dashboardSessionScopeLabel` = “Sesión activa” but KPIs use `businessWindowOrders` |
| C-02 | **Business KPI set** | `CORE_OVERVIEW_KPI_KEYS` includes `completedOrders`, excludes `topProduct` |
| C-03 | **Operational KPI count/content** | Strip has SLA + Riesgo instead of Demorados, Tiempo, Listos |
| C-04 | **Presence** | `shouldShowGlobalPresence = onlineCount > 0` shows “Solo vos” |
| C-05 | **Header attention** | `queuePressure.label` can be “Requiere atención” in header meta |
| C-06 | **Ventas/ticket/activos scope** | Same root as C-01 — metrics computed on wrong order set |

---

## 14. Recommended D2 View Model Inputs

D2 should design a presenter that accepts **one session-scoped order array** plus shared context:

```ts
// Inputs (conceptual — types created in D2, not D1)
{
  orders: AdminOrderDashboardItem[]     // visibleOperationalOrders equivalent
  operationalWindow: OperationalWindow
  now: Date
  realtimeHealth: AdminOrdersRealtimeHealth
  onlineCount: number
  // Optional pre-built lib outputs to avoid duplicate work:
  commercialAnalytics: AdminOrdersAnalytics
  operationalMetrics: AdminOperationalMetrics
  saturationIndex: SaturationIndexResult
}
```

**View model fields D2 should output:**

| Section | Fields |
|---------|--------|
| `meta` | `sessionLabel`, `liveLabel`, `showPresence`, `presenceLabel` |
| `statusSummary` | `healthLabel`, `tone`, `detail`, `revenueLabel` |
| `businessKpis[4]` | ventas, ticket, activos, masVendido — key, label, value, tone? |
| `operationalKpis[4]` | cocina, demorados, tiempo, listos |
| `insights[]` | id, title, detail, tone, futureActionKey? |

---

## 15. Recommended D2 Normalization Rules

| Area | Rule |
|------|------|
| **Order scope** | All top-section fields use session-scoped orders; fallback to business window when `source !== "store-session"` |
| **Ventas fallback** | `$0,00` via `formatAdminOrderCurrency(0)` |
| **Ticket fallback** | `validOrdersCount === 0` → `"Sin datos"`; else currency |
| **Activos label** | `"Pedidos activos"` not `"Activos"` |
| **Más vendido** | `` `${name} · ${n} unidades` `` or `"Sin ventas todavía"` |
| **Demorados** | `stalledCount === 0` → `"Sin demoras"`; else `` `${n} pedido(s)` `` |
| **Cocina labels** | Map saturation → D0 four-value set |
| **Tiempo promedio** | Pick `averagePreparationMinutes` as primary (D1 recommendation); document in D2 ADR |
| **Listos** | `` `${n} pedido(s)` `` / `"Sin pedidos listos"` |
| **Presence** | `showPresence = onlineCount > 1` |
| **Insights copy** | Align titles with D0 examples; remove max-3 truncation or raise cap in D7 design |
| **Insight ids** | Stable ids for D10 filters: `stalled-orders`, `delivery-dominance`, `pickup-dominance`, `ready-waiting`, `recent-peak` |

---

## 16. Risks and Open Questions

### Summary table

| Risk | Priority | Area | Why it matters | Recommended next phase |
|------|----------|------|----------------|------------------------|
| Overview uses business window while UI says session | **P0** | Session scoping | Wrong ventas/KPIs for active session | D2 presenter input + D3 wiring to `visibleOperationalOrders` |
| Más vendido on `order_items_preview` empty edge | **P1** | Más vendido | Silent “Sin datos” | D1 validation query in D2; optional SSR audit |
| Ticket denominator includes in-flight orders | **P1** | Ticket | May differ from operator mental model | D2 ADR: confirm non-cancelled vs completed-only |
| Two time averages — which is “Tiempo promedio”? | **P1** | Operational KPI | Wrong metric confuses ops | D2 pick preparation minutes |
| Estado de cocina labels ≠ D0 | **P1** | Normalization | Product contract drift | D2 mapping table |
| Composite kitchen status undefined in code | **P1** | Status summary | Health line inconsistent | D2 design helper spec; D3 implement |
| `buildOperationalDashboardInsights` max 3 | **P2** | Insights | Drops valid insights | D7 raise cap / prioritize |
| Pico 10 min vs D0 example 15 min | **P2** | Insights | Copy/threshold mismatch | D2 normalize window constant or copy |
| Presence “Solo vos” | **P1** | Header | D0 violation | D8 TSX condition |
| Queue pressure in header | **P1** | Header | D0 violation | D8 relocate to summary/KPIs |
| Delivery dominance counts all orders in array | **P2** | Insights | May include completed/cancelled in ratio | D2 define denominator (non-cancelled only?) |
| No active session fallback | **P2** | Session | “Jornada actual” = full day | Document in D2 meta |
| Realtime order before session open in same day | **P2** | Session | Included in overview, excluded from kanban scope | D3 align both paths |

### Open questions for D2

1. Should ticket denominator be **completed only** or **all non-cancelled in session**?
2. Should delivery/pickup dominance ratio use **all session orders** or **active only**?
3. Should `Sin actividad` require zero active orders globally or zero preparing?
4. Ready insight threshold: count ≥ 2 aligned with lane-metrics, or always show when ≥ 1?

---

## 17. What Not To Implement Yet

| Item | Phase |
|------|-------|
| `getReadyWaitingCount()` helper | D3+ |
| Composite `resolveKitchenStatus()` | D2 design → D3 implement |
| Status summary TSX/CSS | D3+ |
| Switch overview to session orders | D3 (after D2 view model) |
| Insight click filters | D10 |
| Comparatives / trends | Out of MVP |
| Mobile top section | Post D9 |
| New DB queries for full order_items | Only if D2 validation fails |
| Threshold changes (stalled minutes, peak window) | Explicit product decision |

---

## 18. Validation Notes

- No se modificó código funcional.
- No se modificó CSS.
- No se modificaron tokens.
- No se requiere tsc/build para esta fase.

---

## Appendix A — Master Data Map Table

| Data point | D0 contract | Current source | Current status | Session scoped | Gap | D1 classification |
|------------|-------------|----------------|----------------|----------------|-----|-------------------|
| Ventas | Active+completed revenue, session | `getTotalRevenue(businessWindowOrders)` → `overviewCommercialAnalytics` | In KPI grid | **No** | Wrong window when session open | **CONFLICTS_WITH_D0** |
| Ticket promedio | Session sales / considered orders | `buildAdminOrdersAnalytics.averageTicket` | In KPI grid | **No** | Scope + zero fallback | **CONFLICTS_WITH_D0** |
| Pedidos activos | pending+preparing+ready | `getActiveOrdersCount(businessWindowOrders)` | In KPI grid as “Activos” | **No** | Scope + label | **CONFLICTS_WITH_D0** |
| Más vendido | Top product by units, session | `getTopProducts` → `overviewCommercialInsights.topProduct` | Extended only, not grid | **No** | Not in grid; copy/units | **PARTIAL** |
| Estado de cocina | Composite 4 labels | `calculateSaturationIndex` | In 3-col strip | **No** | Labels + composite | **NEEDS_D2_NORMALIZATION** |
| Pedidos demorados | Stalled/delay threshold | `stalledCount` in `buildOperationalMetrics` | Extended + insight only | **No** | Not in grid; naming | **PARTIAL** |
| Tiempo promedio | Operational avg time | `averageCompletionMinutes` / `averagePreparationMinutes` | Extended insights only | **No** | Metric choice + grid slot | **PARTIAL** |
| Listos esperando salida | ready count | Derivable from status; `queue-pressure.readyCount` (today) | Not in overview | Partial | No helper; wrong scope in queue | **PARTIAL** |
| Status summary block | Health + session ventas | None composed | Absent | — | Entire block missing | **MISSING** |
| healthLabel | D0 kitchen/health copy | Saturation / prescriptive fragments | Fragmented | **No** | No composer | **NEEDS_NEW_HELPER_LATER** |
| healthTone | success/warning/danger/neutral | Multiple tone sources | Fragmented | **No** | Priority rules undefined | **NEEDS_NEW_HELPER_LATER** |
| session revenueLabel | Ventas de sesión line | Same as Ventas | Available via analytics | **No** | Scope | **PARTIAL** |
| Insight: demorados | Revisar demorados | `buildOperationalDashboardInsights` stalled-orders | Top micro-insights | **No** | Copy + scope | **PARTIAL** |
| Insight: delivery domina | 70% threshold | Same builder delivery-dominance | Top micro-insights | **No** | Scope + “hoy” | **PARTIAL** |
| Insight: retiro domina | 70% pickup | pickup-dominance | Top micro-insights | **No** | Scope | **PARTIAL** |
| Insight: listos sin salida | Ready waiting | None in top insights | Missing | — | No builder | **MISSING** |
| Insight: pico reciente | Recent spike | `buildBusinessInsights` recent-peak | Context panel only | Via filteredOrders | Not in top; 10 min window | **PARTIAL** |
| Insights positivos | Calm/stable copy | calm-ops, stable-ops, etc. | Fallback insight | **No** | Fragmented; max 3 cap | **PARTIAL** |
| Live label | En vivo | `useAdminOrdersRealtime` | Header | N/A | OK | **PARTIAL** |
| Presence | Hide if alone | `onlineCount > 0` | Header | N/A | Shows “Solo vos” | **CONFLICTS_WITH_D0** |
| Queue pressure pill | Not dominant header | `buildOrdersQueuePressure` | Header | Today-scoped | D0 header rule | **CONFLICTS_WITH_D0** |

---

## Appendix B — D2 View Model Field Table

| View model field | Source candidate | Needs normalization | Notes |
|------------------|------------------|---------------------|-------|
| `meta.sessionLabel` | `operationalWindow.source` | Yes | “Sesión activa” / “Jornada actual” |
| `meta.liveLabel` | `getRealtimeLabel(status)` | Minimal | Subtle header in D8 |
| `meta.showPresence` | `onlineCount > 1` | Yes | D0 rule |
| `meta.presenceLabel` | `buildGlobalPresenceLabel` | Yes | Never “Solo vos” in top |
| `statusSummary.healthLabel` | saturation + stalled + active counts | **Yes** | New composer D2/D3 |
| `statusSummary.tone` | Priority merge of tones | **Yes** | Operational risk first |
| `statusSummary.revenueLabel` | `formatAdminOrderCurrency(getTotalRevenue(sessionOrders))` | Yes | Fix scope first |
| `businessKpis[0] ventas` | `overviewCommercialAnalytics.revenue` on session orders | Scope fix | Primary KPI |
| `businessKpis[1] ticket` | `averageTicket` | Fallback copy | |
| `businessKpis[2] activos` | `getActiveOrdersCount` | Label | |
| `businessKpis[3] masVendido` | `topProduct` | Units + fallback | Promote from extended |
| `operationalKpis[0] cocina` | `calculateSaturationIndex` + future composite | **Yes** | D0 labels |
| `operationalKpis[1] demorados` | `stalledCount` | **Yes** | Rename copy |
| `operationalKpis[2] tiempo` | `averagePreparationMinutes` (recommended) | Metric ADR | |
| `operationalKpis[3] listos` | count `status === ready` | **Yes** | New presenter field |
| `insights[]` | `buildOperationalDashboardInsights` + port peak + ready | **Yes** | D7 surface; D10 actions |

---

## Appendix C — D2 Phase Entry Recommendations

1. **First decision:** Standardize on `visibleOperationalOrders` (or rename `sessionScopedOrders`) as the single input array for all top-section presenter functions.
2. **Second decision:** ADR for ticket denominator and tiempo promedio metric.
3. **Third:** Specify `buildDashboardTopSectionViewModel(input)` pure function signature — no React.
4. **Fourth:** Map normalization table (§15) to presenter unit tests in D2 doc only.
5. **Do not** change `admin-dashboard-orders.tsx` until D3 structure refactor.
