# ADMIN-DASHBOARD-SEARCH-KANBAN-VISUAL-STABILITY-FIX-1 — Visual Stability & Focus Fix

```text
PHASE: ADMIN-DASHBOARD-SEARCH-KANBAN-VISUAL-STABILITY-FIX-1
TYPE: TARGETED VISUAL / UX FIX
STATUS: PASS — DASHBOARD SEARCH/KANBAN VISUAL STABILITY FIXED
BASELINE COMMIT: 81b1162
RUNTIME CHANGES:
  - components/admin/orders/DashboardKanbanBoard.tsx
  - components/admin/orders/operational-search.module.css
  - lib/orders/dashboard-board-view-model.ts
CSS CHANGES: Feature-local only (operational-search.module.css)
DB / SQL / RPC CHANGES: NONE
GLOBAL CSS / THEME TOKEN CHANGES: NONE
NATURAL-SEARCH CHANGES: NONE
```

---

## 1. Objective

Address and resolve two post-search visual stability and presentation issues without altering search matching logic (`lib/orders/natural-search.ts` untouched):
1. **Cancelados Column Omission During Search:** When search was active and 0 cancelled orders matched the query, the `Cancelados` column disappeared entirely in terminal view instead of rendering as an empty lane with structural 4-column stability.
2. **Duplicated Search Input Focus Ring:** When focusing the operational search input, a double focus halo appeared due to `.ui-input:focus` in `globals.css` competing with `.admin-orders-search__field:focus-within`.

---

## 2. Visual Issues & Root Cause

### Issue A — Cancelados Lane Disappearance
- **Observed:** In terminal view (`laneWindow === "terminal"`), searching for a query with no matching cancelled orders (e.g. `PGF5TU`) caused `Cancelados` to vanish and the board layout to drop to 3 lanes or auto-reset to primary view.
- **Root Cause:**
  1. `buildGroupedBoardOrders` in `lib/orders/dashboard-board-view-model.ts` previously filtered conditional groups (`cancelled`) by `group.orders.length > 0` against `filteredOrders`. When 0 cancelled orders matched search, `cancelled` was omitted from `groupedOrders`.
  2. In `DashboardKanbanBoard.tsx`, `cancelledCount` was derived from `groupedOrders.find(g => g.status === "cancelled")?.orders.length ?? 0`. When `cancelledCount === 0`, `useEffect` auto-reset `laneWindow` to `"primary"`, and `usesLanePager` became `false`.

### Issue B — Duplicated Search Focus Halo
- **Observed:** Focusing the search input triggered a browser/global `.ui-input:focus` border and blue shadow (`rgba(37, 99, 235, 0.12)`) on the inner `<input>` element while `.admin-orders-search__field:focus-within` simultaneously drew an indigo border and outer ring on the container.
- **Root Cause:** Specificity cascade in `operational-search.module.css` did not explicitly suppress `.ui-input:focus` and `.ui-input:focus-visible` pseudo-classes on the nested input.

---

## 3. Source Ownership Table

| Concern | File | Pre-Fix Behavior | Risk | Change Applied |
| ------- | ---- | ---------------- | ---- | -------------- |
| **Cancelled lane visibility** | `lib/orders/dashboard-board-view-model.ts` | Omitted `cancelled` when `filteredOrders` had 0 cancelled orders | Layout shifts, column disappears on search | `buildGroupedBoardOrders` checks if `baseOrders` has cancelled orders, preserving group during search |
| **Kanban lane window pager** | `components/admin/orders/DashboardKanbanBoard.tsx` | Reset window to primary on `cancelledCount === 0` | Auto-navigated away from terminal view during search | Resets window only if `hasCancelledGroup` is false (0 cancelled in base scope) |
| **Empty state copy** | `components/admin/orders/admin-dashboard-orders.tsx`<br>`components/admin/orders/DashboardKanbanBoard.tsx` | `"Sin resultados"` on search; `"Sin pedidos"` without search | Visual inconsistency | Preserved and validated across all 5 lane statuses |
| **Search input focus** | `components/admin/orders/operational-search.module.css` | Inner `.ui-input:focus` blue box-shadow clashed with outer field | Visual noise, duplicated focus ring | Suppressed inner input outline/box-shadow/border; container `:focus-within` provides clean ring |
| **Clear button focus** | `components/admin/orders/operational-search.module.css` | Independent `:focus-visible` outline | Keyboard accessibility loss | Preserved `:focus-visible` with 2px offset |

---

## 4. Implementation Summary

### 1. View-Model Group Retention (`lib/orders/dashboard-board-view-model.ts`)
```typescript
function buildGroupedBoardOrders(
  activeFilter: OrdersFilter,
  baseOrders: AdminOrderDashboardItem[],
  filteredOrders: AdminOrderDashboardItem[]
): DashboardBoardGroupedOrders {
  if (activeFilter !== "all") {
    return [];
  }

  const persistentGroups = PERSISTENT_BOARD_STATUSES.map((status) =>
    buildBoardGroupedOrder(status, filteredOrders, true)
  );

  const conditionalGroups = CONDITIONAL_BOARD_STATUSES.map((status) => {
    const hasOrdersInBase = baseOrders.some((order) => order.status === status);
    if (!hasOrdersInBase) {
      return null;
    }
    return buildBoardGroupedOrder(status, filteredOrders, false);
  }).filter((group): group is DashboardBoardGroupedOrder => group !== null);

  return [...persistentGroups, ...conditionalGroups];
}
```

### 2. Pager & Window Stability (`components/admin/orders/DashboardKanbanBoard.tsx`)
```typescript
const cancelledGroup = useMemo(
  () => groupedOrders.find((group) => group.status === "cancelled"),
  [groupedOrders]
);
const cancelledCount = cancelledGroup?.orders.length ?? 0;
const hasCancelledGroup = Boolean(cancelledGroup);

useEffect(() => {
  if (laneWindow === "terminal" && !hasCancelledGroup) {
    setLaneWindow("primary");
  }
}, [hasCancelledGroup, laneWindow]);

const usesLanePager = isWideKanban && hasCancelledGroup;
const effectiveLaneWindow: DashboardKanbanLaneWindow =
  usesLanePager && laneWindow === "terminal" ? "terminal" : "primary";
```

### 3. Focus Refinement (`components/admin/orders/operational-search.module.css`)
```css
.admin-orders-search__input-shell :global(.ui-input),
.admin-orders-search__input-shell :global(.ui-input:focus),
.admin-orders-search__input-shell :global(.ui-input:focus-visible),
.admin-orders-search__input,
.admin-orders-search__input:focus,
.admin-orders-search__input:focus-visible {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.admin-orders-search__field:focus-within {
  border-color: color-mix(in srgb, var(--accent-primary) 45%, var(--border-subtle));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 16%, transparent);
}
```

---

## 5. Kanban Lane Stability Contract

- **Desktop Invariant:** Exactly 4 visible lanes rendered on desktop ($\ge 1200\text{px}$).
- **Primary Window:** `Pendientes`, `Preparando`, `Listos`, `Completados`.
- **Terminal Window:** `Preparando`, `Listos`, `Completados`, `Cancelados`.
- **During Search:** All 4 lanes remain structurally rendered in the grid. Empty lanes show `isEmpty: true` with text `"Sin resultados"`.

---

## 6. Empty State Copy Matrix

| Context | Empty Lane State | Active Filter Empty State |
| ------- | ---------------- | ------------------------- |
| **Search Inactive (`searchQuery === ""`)** | `"Sin pedidos"` | `"No hay pedidos en este filtro."` |
| **Search Active (`searchQuery !== ""`)** | `"Sin resultados"` | `"No hay pedidos que coincidan con esta busqueda o filtro."` |

---

## 7. Search Focus Treatment

- **Container:** `.admin-orders-search__field:focus-within` provides a single, high-contrast, SaaS-premium indigo ring and border.
- **Input:** Native / global `.ui-input:focus` outline and box-shadow suppressed.
- **Clear Button:** Dedicated `:focus-visible` outline for keyboard navigation (`Tab`).

---

## 8. Regression Coverage Matrix

| Case | Description | Result |
| ---- | ----------- | :----: |
| **Case 1** | Primary view keeps 4 lanes during search (`PGF5TU`), empty lanes render `"Sin resultados"` | **PASS** |
| **Case 2** | Terminal view keeps Cancelados lane with 0 matches when cancelled orders exist in base scope | **PASS** |
| **Case 3** | No-search view preserves empty copy `"Sin pedidos"`; omits cancelled lane if 0 cancelled in base scope | **PASS** |
| **Case 4** | Search clear restores normal board cards and `"Sin pedidos"` empty copy | **PASS** |
| **Case 5** | Monotonic code search (`PGF` $\to$ `PGF5` $\to$ `PGF5TU`) preserves structural 4-lane grid | **PASS** |

---

## 9. Deterministic Verifies Executed

- `lib/orders/dashboard-search-kanban-visual-stability.verify.ts` — **PASS**
- `lib/orders/order-code-search-partial-match.verify.ts` — **PASS**
- `lib/orders/order-code-ui-search.verify.ts` — **PASS**
- `lib/orders/order-display-ref.verify.ts` — **PASS**
- `lib/orders/dashboard-metrics-semantic-fix.verify.ts` — **PASS**
- `lib/orders/dashboard-card-summary.verify.ts` — **PASS**
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
- **Git diff check:** Clean (no whitespace or format issues).
- **Production build (`next build`):** Clean Next.js 16.2.9 production build PASS.
- **ESLint:** Executed; pre-existing ESLint 9 circular JSON engine cycle only.

---

## 11. Files Changed

### Runtime
- `components/admin/orders/DashboardKanbanBoard.tsx` (pager condition & lane window retention)
- `lib/orders/dashboard-board-view-model.ts` (base order check for conditional group retention)

### CSS
- `components/admin/orders/operational-search.module.css` (single quiet accessible focus-within treatment)

### Verification
- `lib/orders/dashboard-search-kanban-visual-stability.verify.ts` (new deterministic test suite)

### Documentation & Memory
- `docs/admin-dashboard-search-kanban-visual-stability-fix-1.md` (created)
- `docs/CURRENT_PHASE.md` (updated)
- `docs/admin-dashboard-forensic-living-audit.md` (updated changelog)
- `ORDEROPS_LIVING_MEMORY.md` (updated changelog)

### Invariant Unchanged Files
- `lib/orders/natural-search.ts` (UNTOUCHED)
- `lib/orders/analytics.ts` (UNTOUCHED)
- `lib/orders/dashboard-top-section-view-model.ts` (UNTOUCHED)
- `app/globals.css` / `app/theme-tokens.css` (UNTOUCHED)
- DB / SQL / migrations / RPC (UNTOUCHED)

---

## 12. Gate

```text
ADMIN-DASHBOARD-SEARCH-KANBAN-VISUAL-STABILITY-FIX-1
=
PASS — DASHBOARD SEARCH/KANBAN VISUAL STABILITY FIXED

DASHBOARD SEARCH/KANBAN VISUAL STABILITY:
FIXED

CANCELADOS LANE DURING SEARCH:
STABLE

SEARCH FOCUS:
SINGLE ACCESSIBLE FOCUS STATE

Dashboard order_code partial search:
REMAINS FIXED

Dashboard metrics semantics:
REMAIN FROZEN

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
