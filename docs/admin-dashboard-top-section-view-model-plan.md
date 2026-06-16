# Admin Dashboard Top Section View Model Plan

**Phase:** D2 — Presenter / View Model Design  
**Status:** Technical specification (documentation only)  
**Route:** `/admin/dashboard`  
**Functional SSOT:** `docs/admin-dashboard-top-section-product-contract.md` (D0)  
**Data SSOT:** `docs/admin-dashboard-top-section-data-map.md` (D1)  
**Visual reference:** `docs/admin-dashboard-top-section-token-audit.md`

---

## 1. Executive Summary

This document specifies the **pure presenter contract** for the redesigned dashboard top section. D3 will implement `buildDashboardTopSectionViewModel` and rewire TSX to consume a single **`DashboardTopSectionViewModel`** — without improvising shapes, copy, or metric rules.

**Core D2 decisions frozen:**

| Decision | Resolution |
|----------|------------|
| Primary input array | `sessionScopedOrders` (= current `visibleOperationalOrders`) |
| Business KPIs | 4 fixed IDs: `revenue`, `averageTicket`, `activeOrders`, `topProduct` |
| Operational KPIs | 4 fixed IDs: `kitchenStatus`, `delayedOrders`, `averageTime`, `readyWaiting` |
| Ticket denominator | Non-cancelled orders in session (pending + preparing + ready + completed) |
| Tiempo promedio | `averagePreparationMinutes` only |
| Más vendido | `getTopProducts(sessionScopedOrders)[0]` via `buildAdminOrdersAnalytics` |
| Listos esperando salida | Count where `status === "ready"` |
| Presence | `showPresence = onlineCount > 1`; never “Solo vos” |
| Insights | Up to 4 descriptive items; stable IDs + `futureActionKey` for D10 |

**Not in D2 scope:** TSX, CSS, tokens, lib implementation, UI polish, filters, mobile.

---

## 2. References

| Document / code | Use in D2 |
|-----------------|-----------|
| `docs/admin-dashboard-top-section-product-contract.md` | KPI set, copy intent, header rules, insight catalog |
| `docs/admin-dashboard-top-section-data-map.md` | P0 session scoping gap, partial data, existing functions |
| `docs/admin-dashboard-top-section-token-audit.md` | Current component props; D3 structure target |
| `lib/orders/analytics.ts` | `buildAdminOrdersAnalytics`, windows |
| `lib/orders/metrics.ts` | `buildOperationalMetrics`, stalled, preparation avg |
| `lib/orders/saturation-metrics.ts` | Kitchen saturation |
| `lib/orders/constants.ts` | Thresholds (stalled, dominance, peak) |
| `components/admin/orders/admin-dashboard-orders.tsx` | Real names: `visibleOperationalOrders`, `operationalWindow`, etc. |

---

## 3. Design Goals

1. **Single source of truth** — One presenter output drives header meta, status summary, both KPI grids, and insights row.
2. **Session alignment** — All metrics from the same scoped order array; label matches data when `source === "store-session"`.
3. **D0 compliance** — No Completados in grid; no dominant queue-pressure pill in meta; descriptive insights only.
4. **Stable IDs** — KPI and insight IDs survive D4–D10 (filters, analytics, tests).
5. **Pure function** — No React, DOM, fetch, or mutation; testable in isolation in D3+.
6. **Normalization layer** — All user-facing copy produced in presenter, not scattered in orchestrator formatters.

---

## 4. Non-Goals

- Rendering new UI or changing `DashboardOverview` CSS
- Implementing `.ts` presenter file (D3)
- Changing `getTotalRevenue`, DB queries, or realtime
- Insight click / filter behavior (D10)
- Mobile `DashboardMobileOverview` (post D9)
- Premium visual polish (D5+)
- Composite kitchen formula beyond documented priority rules (can evolve in D3 implementation with same output labels)

---

## 5. Presenter Responsibility

```ts
buildDashboardTopSectionViewModel(
  input: DashboardTopSectionViewModelInput
): DashboardTopSectionViewModel
```

| Responsibility | Owner |
|----------------|-------|
| Scope orders to session (caller) | `AdminDashboardOrders` passes `visibleOperationalOrders` |
| Compute / reuse analytics | Presenter (or precomputed injection — see §6) |
| Normalize labels, tones, fallbacks | Presenter |
| Compose status summary health | Presenter (`buildStatusSummary`) |
| Select up to 4 insights | Presenter (`buildTopSectionInsights`) |
| Map saturation → D0 kitchen labels | Presenter (`resolveKitchenStatus`) |
| Format currency / units | Presenter (via existing `formatAdminOrderCurrency`, local helpers) |
| Render JSX | D3 components only |

**Invariants:**

- Pure: same input → same output
- No side effects
- No imperative “do this now” copy in status summary or insights (D0)

---

## 6. Input Contract

### 6.1 Required input

```ts
type DashboardTopSectionViewModelInput = {
  /** Session-scoped orders. Real code: visibleOperationalOrders */
  orders: AdminOrderDashboardItem[];

  /** Window metadata for sessionLabel and scope context */
  operationalWindow: OperationalWindow;

  now: Date;

  /** From useAdminOrdersRealtime — e.g. "En vivo", "Reconectando" */
  liveLabel: string;

  /** Optional; for meta/debug — not required for MVP view model */
  realtimeStatus?: AdminOrdersRealtimeHealth;

  /** From useAdminPresence — presenceEntries.length */
  onlineCount: number;

  /** Ignored when onlineCount <= 1; caller may pass buildGlobalPresenceLabel result */
  presenceLabel?: string;
};
```

### 6.2 Real name mapping (admin-dashboard-orders.tsx)

| Plan name | Current code | D3 wiring |
|-----------|--------------|-----------|
| `orders` | `visibleOperationalOrders` | Pass directly |
| `operationalWindow` | `operationalWindow` | Unchanged |
| `now` | `now` | Unchanged |
| `liveLabel` | `topBarRealtimeLabel` | Unchanged |
| `realtimeStatus` | `realtimeStatus` from hook | Optional |
| `onlineCount` | `onlineCount` | Unchanged |
| `presenceLabel` | `globalPresenceLabel` | Only used if `onlineCount > 1` |

### 6.3 Session scoping rule (caller responsibility)

```txt
When operationalWindow.source === "store-session":
  input.orders MUST be getOrdersInOperationalWindow(optimisticOrders, operationalWindow)

When operationalWindow.source === "business-window":
  input.orders MAY be getOrdersInOperationalWindow(...) OR getOrdersInBusinessWindow(...)
  — prefer operational window filter for consistency (same function, different bounds)
```

**D2 rule:** Presenter **never** accepts `businessWindowOrders` when UI shows “Sesión activa”. Caller enforces scope before invoke.

### 6.4 Optional precomputed input (D3 decision)

```ts
type DashboardTopSectionViewModelPrecomputedInput = {
  commercialAnalytics?: AdminOrdersAnalytics;
  operationalMetrics?: AdminOperationalMetrics;
  saturationIndex?: SaturationIndexResult;
};
```

| Approach | Pros | Cons |
|----------|------|------|
| **A — Compute inside presenter** | Single place; easier tests | Recomputes if orchestrator also needs metrics |
| **B — Inject precomputed** | Avoid duplicate work in orchestrator | Two paths; drift risk |

**D2 recommendation for D3:** **Approach A** for first implementation (presenter calls existing lib functions on `input.orders`). Refactor to B only if profiling shows duplicate cost.

**Explicitly out of precomputed for top section:** `queuePressure`, `prescriptiveAction`, `slaCompliance` — not D0 top-section outputs (header pill removed; SLA not operational KPI).

---

## 7. Output Contract

```ts
type DashboardTopSectionViewModel = {
  meta: DashboardTopSectionMeta;
  statusSummary: DashboardStatusSummaryViewModel;
  businessKpis: DashboardTopSectionKpiViewModel[];      // length === 4
  operationalKpis: DashboardTopSectionKpiViewModel[];   // length === 4
  insights: DashboardTopSectionInsightViewModel[];      // length 1..4
};
```

| Field | Count | Order fixed |
|-------|-------|-------------|
| `businessKpis` | 4 | revenue → averageTicket → activeOrders → topProduct |
| `operationalKpis` | 4 | kitchenStatus → delayedOrders → averageTime → readyWaiting |
| `insights` | 1–4 | Sorted by `priority` ascending (lower = more urgent) |

---

## 8. Type Unions

### 8.1 Tone

```ts
type DashboardTopSectionTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";
```

Maps to existing semantic tokens (`--color-ready`, `--color-pending`, etc.) in D4 — not in D2/D3 logic changes.

### 8.2 Business KPI IDs

```ts
type DashboardBusinessKpiId =
  | "revenue"
  | "averageTicket"
  | "activeOrders"
  | "topProduct";
```

### 8.3 Operational KPI IDs

```ts
type DashboardOperationalKpiId =
  | "kitchenStatus"
  | "delayedOrders"
  | "averageTime"
  | "readyWaiting";
```

### 8.4 Insight IDs

```ts
type DashboardTopSectionInsightId =
  | "stalled-orders"
  | "delivery-dominance"
  | "pickup-dominance"
  | "ready-waiting"
  | "recent-peak"
  | "positive-operations";
```

### 8.5 Future action keys (D10)

```ts
type DashboardTopSectionFutureActionKey =
  | "filter-delayed"
  | "filter-delivery"
  | "filter-pickup"
  | "filter-ready"
  | "focus-recent"
  | null;
```

| Insight ID | futureActionKey |
|------------|-----------------|
| `stalled-orders` | `"filter-delayed"` |
| `delivery-dominance` | `"filter-delivery"` |
| `pickup-dominance` | `"filter-pickup"` |
| `ready-waiting` | `"filter-ready"` |
| `recent-peak` | `"focus-recent"` |
| `positive-operations` | `null` |

---

## 9. Meta View Model

```ts
type DashboardTopSectionMeta = {
  title: "Panel del Negocio";
  sessionLabel: string;
  liveLabel: string;
  showPresence: boolean;
  presenceLabel: string | null;
};
```

### Rules

| Field | Rule |
|-------|------|
| `title` | Literal `"Panel del Negocio"` |
| `sessionLabel` | `"Sesión activa"` if `operationalWindow.source === "store-session"`, else `"Jornada actual"` |
| `liveLabel` | Pass-through from input |
| `showPresence` | `onlineCount > 1` |
| `presenceLabel` | If `showPresence`: `` `${onlineCount} online` `` (or normalized presence string **without** “Solo vos”). If not: `null` |

### Pseudocode — `buildMeta`

```ts
function buildMeta(input: DashboardTopSectionViewModelInput): DashboardTopSectionMeta {
  const sessionLabel =
    input.operationalWindow.source === "store-session"
      ? "Sesión activa"
      : "Jornada actual";

  const showPresence = input.onlineCount > 1;

  return {
    title: "Panel del Negocio",
    sessionLabel,
    liveLabel: input.liveLabel,
    showPresence,
    presenceLabel: showPresence
      ? `${input.onlineCount} online`
      : null
  };
}
```

**Removed from meta vs current UI:** `queuePressure` pill — not part of view model (D0 §12, D8).

---

## 10. Status Summary View Model

```ts
type DashboardStatusSummaryViewModel = {
  label: "Estado del negocio";
  healthLabel: string;
  tone: DashboardTopSectionTone;
  detail: string;
  revenueLabel: string;
  supportingSignals: string[];
};
```

### D0-approved `healthLabel` values

`Cocina fluida` · `Atención requerida` · `Saturada` · `Sin actividad`

### Examples

**Calm session:**

```ts
{
  label: "Estado del negocio",
  healthLabel: "Cocina fluida",
  tone: "success",
  detail: "Ventas de sesión: $44.000,00",
  revenueLabel: "$44.000,00",
  supportingSignals: ["Sin demoras", "2 pedidos activos"]
}
```

**Under pressure:**

```ts
{
  label: "Estado del negocio",
  healthLabel: "Atención requerida",
  tone: "warning",
  detail: "Ventas de sesión: $44.000,00",
  revenueLabel: "$44.000,00",
  supportingSignals: ["2 pedidos demorados", "Preparación lenta"]
}
```

### Field derivation

| Field | Source |
|-------|--------|
| `revenueLabel` | `formatAdminOrderCurrency(commercial.revenue)` |
| `detail` | `` `Ventas de sesión: ${revenueLabel}` `` |
| `healthLabel` + `tone` | Priority rules §20 |
| `supportingSignals` | Up to 3 short strings from delayed count, preparation slow, ready count, active count — no imperatives |

---

## 11. Business KPI View Model

Shared shape (see §11 in prompt — same for operational):

```ts
type DashboardTopSectionKpiViewModel = {
  id: DashboardBusinessKpiId | DashboardOperationalKpiId;
  label: string;
  value: string;
  detail?: string;
  tone: DashboardTopSectionTone;
  priority: "primary" | "secondary";
  iconKey?: string;
};
```

### Fixed array (order immutable)

```ts
businessKpis: [
  {
    id: "revenue",
    label: "Ventas",
    value: "$44.000,00",           // formatAdminOrderCurrency(commercial.revenue)
    detail: "Sesión activa",       // or "Jornada actual" from operationalWindow.source
    tone: "neutral",
    priority: "primary",
    iconKey: "banknote"
  },
  {
    id: "averageTicket",
    label: "Ticket promedio",
    value: "$22.000,00",           // or "Sin datos"
    detail: "Por pedido",
    tone: "neutral",
    priority: "secondary",
    iconKey: "receipt"
  },
  {
    id: "activeOrders",
    label: "Pedidos activos",
    value: "2 pedidos",            // or "0 pedidos" / "1 pedido"
    detail: "Pendientes + preparación + listos",
    tone: "info",
    priority: "secondary",
    iconKey: "activity"
  },
  {
    id: "topProduct",
    label: "Más vendido",
    value: "BBQ Bacon",            // or "Sin ventas todavía"
    detail: "2 unidades",          // omitted when no sales
    tone: "neutral",
    priority: "secondary",
    iconKey: "star"
  }
]
```

### Rules

- **Ventas** is the only `priority: "primary"` business KPI.
- **Completados** must not appear.
- **Más vendido** replaces Completados in grid slot 4.
- Revenue scope: non-cancelled in session (= D0 active + completed); see ADR §15.

---

## 12. Operational KPI View Model

### Fixed array (order immutable)

```ts
operationalKpis: [
  {
    id: "kitchenStatus",
    label: "Estado de cocina",
    value: "Cocina fluida",        // resolveKitchenStatus()
    detail: "Ritmo estable",       // contextual subline from saturation level
    tone: "success",
    priority: "primary",
    iconKey: "chef"
  },
  {
    id: "delayedOrders",
    label: "Pedidos demorados",
    value: "Sin demoras",          // or "2 pedidos"
    detail: "Dentro del ritmo esperado",
    tone: "success",               // warning/danger when count > 0
    priority: "secondary",
    iconKey: "clock"
  },
  {
    id: "averageTime",
    label: "Tiempo promedio",
    value: "18 min",               // or "Sin datos"
    detail: "Preparación",
    tone: "neutral",               // warning if > PREPARATION_SLOW_MINUTES (25)
    priority: "secondary",
    iconKey: "timer"
  },
  {
    id: "readyWaiting",
    label: "Listos esperando salida",
    value: "1 pedido",             // or "Sin pedidos listos"
    detail: "En ready",
    tone: "info",                  // warning if count >= 2 (D2 threshold)
    priority: "secondary",
    iconKey: "package-ready"
  }
]
```

**Removed vs current strip:** `slaCompliance`, `operationalRisk` / prescriptive — not in D0 operational grid.

---

## 13. Insight View Model

```ts
type DashboardTopSectionInsightViewModel = {
  id: DashboardTopSectionInsightId;
  title: string;
  detail: string;
  tone: DashboardTopSectionTone;
  futureActionKey: DashboardTopSectionFutureActionKey;
  priority: number;
};
```

Insights are **descriptive**, not imperative (D0 §10–§11).

### Catalog with normalized copy

| id | title | detail pattern | tone | priority | futureActionKey |
|----|-------|----------------|------|----------|-----------------|
| `stalled-orders` | Revisar demorados | `{n} pedido(s) necesitan revisión` | warning | 10 | filter-delayed |
| `ready-waiting` | Pedidos listos | `{n} pedido(s) esperan salida` | warning | 20 | filter-ready |
| `recent-peak` | Pico reciente | `{n} pedidos en los últimos {window} min` | info | 30 | focus-recent |
| `delivery-dominance` | Delivery domina hoy | `{d} de {t} pedidos` | info | 40 | filter-delivery |
| `pickup-dominance` | Retiro domina hoy | `{p} de {t} pedidos` | info | 50 | filter-pickup |
| `positive-operations` | Buen ritmo operativo | See §21 | success | 90 | null |

### Examples

```ts
{
  id: "stalled-orders",
  title: "Revisar demorados",
  detail: "2 pedidos necesitan revisión",
  tone: "warning",
  futureActionKey: "filter-delayed",
  priority: 10
}
```

```ts
{
  id: "delivery-dominance",
  title: "Delivery domina hoy",
  detail: "2 de 2 pedidos",
  tone: "info",
  futureActionKey: "filter-delivery",
  priority: 40
}
```

```ts
{
  id: "positive-operations",
  title: "Buen ritmo operativo",
  detail: "Sin preparación lenta",
  tone: "success",
  futureActionKey: null,
  priority: 90
}
```

---

## 14. ADR — Session Scoped Input

**Status:** Accepted  
**Context:** D1 P0 — overview uses `businessWindowOrders` while UI says “Sesión activa”.  
**Decision:** Presenter input `orders` is always the session-scoped array (`visibleOperationalOrders`).  
**Consequences:**

- D3 changes one wiring line: overview presenter call uses `visibleOperationalOrders`, not `businessWindowOrders`.
- Fallback when no store session: same filter function with `business-window` bounds — presenter stays unchanged.
- `detail` on Ventas KPI reflects `sessionLabel` semantics.

**Rejected:** Passing both arrays and selecting inside presenter — adds complexity; caller owns scope.

---

## 15. ADR — Ticket Average Denominator

**Status:** Accepted  
**Decision:**

```txt
Ticket promedio = revenue / validOrdersCount
validOrdersCount = non-cancelled orders in sessionScopedOrders
  = pending + preparing + ready + completed
Excludes: cancelled
```

**Alignment with D0:** Same order set as Ventas (active + completed revenue base).

**Fallback:**

```txt
validOrdersCount === 0 → value = "Sin datos"
```

Not `$0,00` — average without orders is not a meaningful currency value.

**Implementation note:** Matches current `buildAdminOrdersAnalytics.averageTicket` **formula** once scoped to session orders.

---

## 16. ADR — Average Time Metric

**Status:** Accepted  
**Decision:**

```txt
Tiempo promedio (operational KPI) = averagePreparationMinutes
Source: buildOperationalMetrics(orders, now).averagePreparationMinutes
Formatter: formatOperationalMetricMinutes(value) → "18 min" | "Sin datos"
```

**Rationale:**

- Preparation time reflects **live kitchen rhythm**.
- `averageCompletionMinutes` depends on completed orders only — lagging, weak for active session.

**Excluded from top section:** `averageCompletionMinutes` (may remain in context panel / future reports).

**Tone rule (presenter):**

```txt
if averagePreparationMinutes > PREPARATION_SLOW_MINUTES (25):
  tone = "warning"
else if value is numeric:
  tone = "neutral" | "success" when low
else:
  tone = "neutral"
```

**Fallback:** `"Sin datos"` when null.

---

## 17. ADR — Top Product Source

**Status:** Accepted  
**Decision:**

```txt
topProduct = getTopProducts(sessionScopedOrders)[0]
            = buildAdminOrdersAnalytics(orders).topProduct
```

**Format:**

```txt
value = product.name
detail = `${quantity} unidad` | `${quantity} unidades`  (Spanish plural)
```

**Fallback:**

```txt
value = "Sin ventas todavía"
detail = undefined (omit in view model or null)
```

**Risk:** Relies on `order_items_preview` populated from full `order_items` at SSR (`normalizeDashboardOrderItems`). No new query in D3.

**Rejected:** Promoting `completedOrders` count — conflicts with D0.

---

## 18. ADR — Ready Waiting Count

**Status:** Accepted (MVP)  
**Decision:**

```txt
readyWaitingCount = count(orders where status === "ready")
Scope: sessionScopedOrders only
```

**Format:**

```txt
count === 0 → value "Sin pedidos listos"
count === 1 → value "1 pedido"
count > 1  → value "{n} pedidos"
```

**Tone (KPI):**

```txt
count >= 2 → tone "warning"
count === 1 → tone "info"
count === 0 → tone "success" | "neutral"
```

**Insight inclusion:** Include `ready-waiting` when `readyWaitingCount >= 2` (aligned with lane-metrics patterns).

**Deferred:** Age since ready via `order_events` — D10+ severity.

**Rejected for MVP:** Using `buildOrdersQueuePressure().readyCount` — uses `getTodayActiveOrders`, wrong scope.

---

## 19. Normalization Rules

| Current / legacy | Normalized (view model) | Applies to |
|------------------|-------------------------|------------|
| Activos | Pedidos activos | business KPI label |
| Completados | *(removed from top grid)* | — |
| `Sin datos` (topProduct) | Sin ventas todavía | topProduct value |
| `Name · 2` | value=`Name`, detail=`2 unidades` | topProduct |
| stalled / estancados | Pedidos demorados | operational KPI label |
| `N estancados` | `N pedido(s)` | delayedOrders value |
| `Sin demoras` | Sin demoras | delayedOrders value (keep) |
| Revisar pedidos demorados | Revisar demorados | insight title |
| Alta demanda / Alta demanda (N%) | Atención requerida | kitchenStatus value |
| Saturacion / Cuello de botella | Saturada | kitchenStatus value |
| Operacion fluida (prescriptive) | *(not in top KPI row)* | removed from strip |
| Sin promesas activas | *(not operational KPI)* | optional supporting signal only |
| `onlineCount <= 1` | showPresence=false | meta |
| Solo vos | never in top section | meta |
| Queue pressure header pill | not in view model | meta/header D8 |
| Delivery mix in KPI grid | insight only | business grid |
| `Entraron N pedidos en los ultimos 10 min` | Pico reciente + normalized detail | insight |
| calm-ops / stable-ops | positive-operations | insight id consolidation |

### Delivery / pickup dominance denominator (D2 ADR extension)

**Decision:** Ratio uses **non-cancelled** orders in `sessionScopedOrders` only (consistent with ticket ADR).

```txt
deliveryRatio = deliveryCount / (deliveryCount + pickupCount)
Threshold: DELIVERY_DOMINANCE_RATIO = 0.7
```

Cancel excluded from mix counts.

---

## 20. Status Summary Priority Rules

### Signals fed into composer

| Signal | Source |
|--------|--------|
| `delayedOrdersCount` | `operational.stalledCount` |
| `saturationLevel` | `saturation.level` (`fluid` \| `high_demand` \| `bottleneck`) |
| `averagePreparationMinutes` | `operational.averagePreparationMinutes` |
| `readyWaitingCount` | count ready |
| `activeOrdersCount` | `commercial.activeOrders` |
| `revenue` | `commercial.revenue` |

### Priority pseudocode

```ts
function buildStatusSummary(ctx): DashboardStatusSummaryViewModel {
  const {
    commercial,
    operational,
    saturation,
    operationalWindow
  } = ctx;

  const delayed = operational.stalledCount;
  const readyWaiting = countReady(ctx.orders);
  const active = commercial.activeOrders;
  const revenueLabel = formatAdminOrderCurrency(commercial.revenue);
  const supportingSignals = buildSupportingSignals(ctx); // max 3

  let healthLabel: string;
  let tone: DashboardTopSectionTone;

  // 1. Delayed orders dominate health
  if (delayed > 0) {
    healthLabel = "Atención requerida";
    tone = delayed >= 3 ? "danger" : "warning";
  }
  // 2. Bottleneck saturation
  else if (saturation.level === "bottleneck") {
    healthLabel = "Saturada";
    tone = "danger";
  }
  // 3. High demand without stalled
  else if (saturation.level === "high_demand") {
    healthLabel = "Atención requerida";
    tone = "warning";
  }
  // 4. No active orders
  else if (active === 0) {
    healthLabel = "Sin actividad";
    tone = "neutral";
  }
  // 5. Default calm
  else {
    healthLabel = "Cocina fluida";
    tone = "success";
  }

  return {
    label: "Estado del negocio",
    healthLabel,
    tone,
    detail: `Ventas de sesión: ${revenueLabel}`,
    revenueLabel,
    supportingSignals
  };
}
```

**Note:** `readyWaitingCount` influences `supportingSignals` and insights, not primary `healthLabel` in MVP (D0 de-prioritizes “listos hace mucho” as primary attention). May elevate in future phase.

---

## 21. Insight Prioritization Rules

### Generation order (evaluate all, then sort + slice)

1. **stalled-orders** — if `stalledCount > 0` (required when demora exists)
2. **ready-waiting** — if `readyWaitingCount >= 2`
3. **recent-peak** — if orders created in last `RECENT_PEAK_WINDOW_MINUTES` (10) ≥ `RECENT_PEAK_MIN_ORDERS` (3)
4. **delivery-dominance** — if delivery ratio ≥ 0.7 among non-cancelled
5. **pickup-dominance** — if pickup ratio ≥ 0.7
6. **positive-operations** — if no higher-priority insight selected OR as filler

### Quantity rules

```txt
Return 1..4 insights, sorted by priority ascending (10 = most urgent).
If no problem insights: return exactly 1 positive-operations insight minimum.
If stalledCount > 0: stalled-orders MUST be included.
If readyWaitingCount >= 2: ready-waiting SHOULD be included.
```

### Positive insight detail selection

```ts
if (averagePreparationMinutes is null OR <= PREPARATION_SLOW_MINUTES):
  detail = "Sin preparación lenta"
else if (stalledCount === 0):
  detail = "Sin demoras"
else:
  detail = "Operación estable"  // fallback when positive slot needed alongside warnings
```

**Port from existing builders:**

- Stall / delivery / pickup: logic from `buildOperationalDashboardInsights` with new copy + scope
- Recent peak: logic from `buildBusinessInsights` (`RECENT_PEAK_*` constants), scoped to `input.orders`

---

## 22. Pseudocode

### 22.1 Main composer

```ts
function buildDashboardTopSectionViewModel(
  input: DashboardTopSectionViewModelInput
): DashboardTopSectionViewModel {
  const orders = input.orders;

  const commercial = buildAdminOrdersAnalytics(orders);
  const operational = buildOperationalMetrics(orders, input.now);
  const saturation = calculateSaturationIndex(orders);

  const ctx = { input, orders, commercial, operational, saturation };

  return {
    meta: buildMeta(input),
    statusSummary: buildStatusSummary(ctx),
    businessKpis: buildBusinessKpis(ctx),
    operationalKpis: buildOperationalKpis(ctx),
    insights: buildTopSectionInsights(ctx)
  };
}
```

### 22.2 `resolveKitchenStatus`

```ts
function resolveKitchenStatus(saturation: SaturationIndexResult, activeCount: number) {
  if (activeCount === 0 && saturation.preparingCount === 0) {
    return { value: "Sin actividad", tone: "neutral", detail: "Sin pedidos en cocina" };
  }

  switch (saturation.level) {
    case "bottleneck":
      return { value: "Saturada", tone: "danger", detail: "Carga elevada" };
    case "high_demand":
      return { value: "Atención requerida", tone: "warning", detail: "Alta demanda" };
    case "fluid":
    default:
      return { value: "Cocina fluida", tone: "success", detail: "Ritmo estable" };
  }
}
```

Maps away legacy strings: `Alta demanda`, `Saturacion / Cuello de botella`.

### 22.3 `formatAverageTicketKpi`

```ts
function formatAverageTicketKpi(commercial: AdminOrdersAnalytics) {
  if (commercial.validOrdersCount === 0) {
    return { value: "Sin datos", tone: "neutral" };
  }
  return {
    value: formatAdminOrderCurrency(commercial.averageTicket),
    tone: "neutral"
  };
}
```

### 22.4 `formatTopProductKpi`

```ts
function formatTopProductKpi(topProduct: AdminOrdersAnalytics["topProduct"]) {
  if (!topProduct) {
    return { value: "Sin ventas todavía", detail: undefined, tone: "neutral" };
  }
  const units =
    topProduct.quantity === 1 ? "1 unidad" : `${topProduct.quantity} unidades`;
  return {
    value: topProduct.name,
    detail: units,
    tone: "neutral"
  };
}
```

### 22.5 `buildBusinessKpis`

```ts
function buildBusinessKpis(ctx): DashboardTopSectionKpiViewModel[] {
  const sessionDetail =
    ctx.input.operationalWindow.source === "store-session"
      ? "Sesión activa"
      : "Jornada actual";

  const ticket = formatAverageTicketKpi(ctx.commercial);
  const top = formatTopProductKpi(ctx.commercial.topProduct);
  const active = ctx.commercial.activeOrders;

  return [
    {
      id: "revenue",
      label: "Ventas",
      value: formatAdminOrderCurrency(ctx.commercial.revenue),
      detail: sessionDetail,
      tone: "neutral",
      priority: "primary",
      iconKey: "banknote"
    },
    {
      id: "averageTicket",
      label: "Ticket promedio",
      value: ticket.value,
      detail: "Por pedido",
      tone: ticket.tone,
      priority: "secondary",
      iconKey: "receipt"
    },
    {
      id: "activeOrders",
      label: "Pedidos activos",
      value: pluralizePedidos(active),
      detail: "Pendientes + preparación + listos",
      tone: "info",
      priority: "secondary",
      iconKey: "activity"
    },
    {
      id: "topProduct",
      label: "Más vendido",
      value: top.value,
      detail: top.detail,
      tone: top.tone,
      priority: "secondary",
      iconKey: "star"
    }
  ];
}
```

### 22.6 `buildOperationalKpis`

```ts
function buildOperationalKpis(ctx): DashboardTopSectionKpiViewModel[] {
  const kitchen = resolveKitchenStatus(ctx.saturation, ctx.commercial.activeOrders);
  const delayed = ctx.operational.stalledCount;
  const avgPrep = ctx.operational.averagePreparationMinutes;
  const readyCount = countReady(ctx.orders);

  return [
    {
      id: "kitchenStatus",
      label: "Estado de cocina",
      value: kitchen.value,
      detail: kitchen.detail,
      tone: kitchen.tone,
      priority: "primary",
      iconKey: "chef"
    },
    {
      id: "delayedOrders",
      label: "Pedidos demorados",
      value: delayed === 0 ? "Sin demoras" : pluralizePedidos(delayed),
      detail: delayed === 0 ? "Dentro del ritmo esperado" : "Superan umbral de inactividad",
      tone: delayed === 0 ? "success" : delayed >= 3 ? "danger" : "warning",
      priority: "secondary",
      iconKey: "clock"
    },
    {
      id: "averageTime",
      label: "Tiempo promedio",
      value: formatOperationalMetricMinutes(avgPrep),
      detail: "Preparación",
      tone: resolvePreparationTone(avgPrep),
      priority: "secondary",
      iconKey: "timer"
    },
    {
      id: "readyWaiting",
      label: "Listos esperando salida",
      value: readyCount === 0 ? "Sin pedidos listos" : pluralizePedidos(readyCount),
      detail: "En ready",
      tone: readyCount >= 2 ? "warning" : readyCount === 1 ? "info" : "success",
      priority: "secondary",
      iconKey: "package-ready"
    }
  ];
}
```

### 22.7 `buildTopSectionInsights`

```ts
function buildTopSectionInsights(ctx): DashboardTopSectionInsightViewModel[] {
  const candidates: DashboardTopSectionInsightViewModel[] = [];

  if (ctx.operational.stalledCount > 0) {
    candidates.push({
      id: "stalled-orders",
      title: "Revisar demorados",
      detail: `${ctx.operational.stalledCount} pedido(s) necesitan revisión`,
      tone: "warning",
      futureActionKey: "filter-delayed",
      priority: 10
    });
  }

  const readyCount = countReady(ctx.orders);
  if (readyCount >= 2) {
    candidates.push({
      id: "ready-waiting",
      title: "Pedidos listos",
      detail: `${readyCount} pedido(s) esperan salida`,
      tone: "warning",
      futureActionKey: "filter-ready",
      priority: 20
    });
  }

  const recentCount = countOrdersCreatedWithin(ctx.orders, ctx.input.now, RECENT_PEAK_WINDOW_MINUTES);
  if (recentCount >= RECENT_PEAK_MIN_ORDERS) {
    candidates.push({
      id: "recent-peak",
      title: "Pico reciente",
      detail: `${recentCount} pedidos en los últimos ${RECENT_PEAK_WINDOW_MINUTES} min`,
      tone: "info",
      futureActionKey: "focus-recent",
      priority: 30
    });
  }

  // delivery / pickup dominance on non-cancelled orders ...
  // push with priority 40 / 50

  candidates.sort((a, b) => a.priority - b.priority);

  let selected = candidates.slice(0, 4);

  if (selected.length === 0) {
    selected = [buildPositiveInsight(ctx)];
  }

  return selected;
}
```

### 22.8 Helpers (local to presenter module in D3)

```ts
function countReady(orders) {
  return orders.filter(o => o.status === "ready").length;
}

function pluralizePedidos(n: number): string {
  if (n === 1) return "1 pedido";
  return `${n} pedidos`;
}
```

---

## 23. D3 Implementation Boundaries

### D3 may

- Create `lib/orders/dashboard-top-section-view-model.ts` (or `presenter/`) with types + `buildDashboardTopSectionViewModel`
- Wire `AdminDashboardOrders` to call presenter with `visibleOperationalOrders`
- Refactor `DashboardOverview` props to accept `DashboardTopSectionViewModel` (or decomposed props from it)
- Replace `CORE_OVERVIEW_KPI_KEYS` / `dashboardOverviewOperationalMetrics` ad-hoc arrays with view model
- Add status summary JSX block (structure only — minimal CSS)
- Replace 3-col operational strip with 4 operational KPI cards from view model
- Replace passive micro-insights map with `insights` array
- Remove `queuePressure` from header props; apply meta presence rules
- Unit-test presenter with fixture orders

### D3 must not

- Deep CSS/token polish (D4–D5)
- Touch lanes, order cards, modal, toolbar, search, store session controls
- Implement insight filters / navigation (D10)
- Change Supabase queries, SSR `getAdminOrders`, or realtime subscriptions
- Change threshold constants without product sign-off
- Redesign mobile overview

### Suggested D3 file layout

```txt
lib/orders/dashboard-top-section-view-model.ts   // types + buildDashboardTopSectionViewModel
lib/orders/dashboard-top-section-view-model.test.ts  // optional in D3 or D3.1
components/admin/orders/admin-dashboard-orders.tsx   // wire presenter only
components/admin/orders/DashboardOverview.tsx        // prop shape change
```

---

## 24. Risks Remaining

| Risk | Phase | Mitigation |
|------|-------|------------|
| `order_items_preview` incomplete → wrong Más vendido | D3+ | Log empty preview in dev; document in QA checklist |
| Wiring still passes wrong array | D3 | Code review: assert `orders === visibleOperationalOrders` |
| Status summary composer untested edge cases | D3 | Fixture tests: empty session, bottleneck, stalled |
| No dedicated `countReady` in lib today | D3 | Trivial inline in presenter |
| `averagePreparationMinutes` null when no ready events | D3 | Show "Sin datos"; positive insight uses fallback copy |
| Insights fragmented across old builders | D3 | Single `buildTopSectionInsights`; deprecate overview-specific slice |
| Duplicate computation with context panel | D3+ | Accept for MVP; optimize later |
| Mobile still uses old KPI set | D9 | Explicitly out of D3 |
| Visual regression from structure change | D4–D5 | Token audit phases |
| D0 “15 min” example vs 10 min constant | D2 | Use code constant 10; update copy to match constant |

---

## 25. Acceptance Criteria for D3

D3 is complete when:

| # | Criterion |
|---|-----------|
| 1 | `buildDashboardTopSectionViewModel` exists as pure function matching §6–§7 |
| 2 | Input uses `visibleOperationalOrders` (session-scoped) |
| 3 | `businessKpis.length === 4` with IDs §8.2 in order §11 |
| 4 | `operationalKpis.length === 4` with IDs §8.3 in order §12 |
| 5 | `insights.length` between 1 and 4; includes stalled when applicable |
| 6 | `meta.showPresence === (onlineCount > 1)`; no “Solo vos” |
| 7 | No `queuePressure` in header |
| 8 | Status summary block rendered from `statusSummary` |
| 9 | Completados not in business grid; topProduct present |
| 10 | SLA / prescriptive not in operational KPI row |
| 11 | No lane/card/modal/toolbar logic changes |
| 12 | Presenter unit tests cover ADRs §15–§18 edge cases |

---

## Validaciones de esta fase

- No se modificó código funcional.
- No se modificó CSS.
- No se modificaron tokens.
- No se requiere tsc/build para esta fase.
