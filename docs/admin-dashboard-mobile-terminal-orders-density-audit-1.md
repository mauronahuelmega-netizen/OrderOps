# Admin Dashboard Mobile Terminal Orders Density Audit & Product Spec

## 1. Objective

Conduct a comprehensive forensic audit of how orders are rendered in mobile stacked view on the Admin Dashboard (`/admin/dashboard`) and specify a safe, mobile-only density control strategy to prevent terminal order groups (`completed`, `cancelled`) from expanding the vertical viewport indefinitely.

---

## 2. Current Mobile Behavior

- **Desktop (≥1200px)**: Renders as a 4-column horizontal Kanban board (`grid-template-columns: repeat(4, minmax(0, 1fr))`). Each lane has independent vertical scroll (`overflow-y: auto`) constrained within a fixed board height (`clamp(40rem, calc(100dvh - 13rem), 48.75rem)`). Cancelled orders are accessed via a dedicated terminal lane pager without breaking horizontal grid geometry.
- **Tablet (768px–1199px)**: Renders as a 2-column grid (`repeat(2, minmax(0, 1fr))`) with constrained lane height (`clamp(16rem, 38vh, 26rem)` to `clamp(22rem, 52vh, 34rem)`) and internal per-lane scrolling (`overflow-y: auto`).
- **Mobile (≤767px)**:
  - Renders as a single vertical stacked column (`flex-direction: column`).
  - Section order: `Pendientes` → `Preparando` → `Listos` → `Completados` → `Cancelados`.
  - The lane container `.lane` and lane body `.laneBody` have `overflow-y: visible` and `max-height: none`.
  - Every order card is placed in natural document flow.
  - **The Defect**: While active statuses (`pending`, `preparing`, `ready`) typically have a low to moderate volume of orders, terminal statuses (`completed`, `cancelled`) accumulate over the operational window. In a busy session with 25 completed orders and 8 cancelled orders, 33 full `OrderCard` elements are rendered sequentially, forcing excessive vertical scrolling, burying Cancelados, and making the page bottom/footer virtually unreachable.

---

## 3. Source Ownership Map

| Concern | File | Current Behavior | Mobile? | Desktop? | Risk Level |
|---|---|---|---|---|---|
| Mobile order section rendering | `components/admin/orders/DashboardKanbanBoard.tsx` | Iterates `visibleGroups` and renders each `.lane` stacked vertically | Yes (≤767px) | No | High (UI layout) |
| Desktop Kanban rendering | `components/admin/orders/DashboardKanbanBoard.tsx` | Iterates 4-lane window (`primary` / `terminal`) in 4-column grid | No | Yes (≥1200px) | High (regression risk) |
| Grouped order derivation | `lib/orders/dashboard-board-view-model.ts` | `buildGroupedBoardOrders()` partitions orders by status into `DashboardBoardGroupedOrder[]` | Shared | Shared | High (contract boundary) |
| Search filtering | `lib/orders/natural-search.ts` | `applyOperationalSearch()` filters orders before grouping | Shared | Shared | Critical (must bypass cap) |
| Empty state copy | `components/admin/orders/admin-dashboard-orders.tsx` | Passes `hasSearchQuery ? "Sin resultados" : "Sin pedidos"` | Shared | Shared | Low |
| Cancelados terminal handling | `components/admin/orders/DashboardKanbanBoard.tsx` | Rendered as terminal lane in wide Kanban pager; rendered as 5th stacked section in mobile | Yes | Yes | High (pager invariant) |
| Completed order rendering | `components/admin/orders/DashboardKanbanBoard.tsx` | Rendered as 4th core/secondary lane with full list of orders | Yes | Yes | High (density hotspot) |
| Section counts / badges | `components/admin/orders/DashboardKanbanBoard.tsx` | `<span className={kanbanStyles.laneCount}>{group.orders.length}</span>` | Shared | Shared | Medium (must stay total) |
| Per-lane scroll desktop | `components/admin/orders/dashboard-kanban.module.css` | `.laneBody { overflow-y: auto }` inside fixed-height grid | No | Yes | Low |
| Mobile vertical scroll | `components/admin/orders/dashboard-kanban.module.css` | `.laneBody { overflow-y: visible; max-height: none }` | Yes | No | Low |

---

## 4. Desktop / Terminal Pager Invariants

Any mobile density adjustment must preserve 100% of the desktop/tablet Kanban guarantees:
1. **Fixed 4-Lane Desktop Window**: Desktop Kanban must never render 5 columns; it toggles between `primary` (`pending`, `preparing`, `ready`, `completed`) and `terminal` (`preparing`, `ready`, `completed`, `cancelled`) using the `lanePager`.
2. **Independent Desktop Scrolling**: Desktop lanes continue to scroll internally with their full order list; no truncation or "Mostrar más" buttons on desktop Kanban.
3. **Cancelados Search Stability**: When search is active, Cancelados lane remains structurally intact in the terminal window even with 0 matches (`data-search-empty="true"`).
4. **Metrics and KPIs Unaffected**: Overview metrics (`revenue`, `ticket`, `activeOrders`, `topProduct`, `delayedOrders`, `averagePreparationTime`) derive from `visibleOperationalOrders` in `lib/orders/analytics.ts` and are completely independent of UI rendering caps.
5. **Dashboard Card Root Count**: Order card summaries continue to reflect root items via `buildDashboardOrderCardSummary`.

---

## 5. Mobile Stacked Renderer Audit

- **Component Sharing**: Mobile and desktop share the exact same component: `DashboardKanbanBoard.tsx`.
- **Viewport Detection**:
  - Desktop wide-mode is detected via `useSyncExternalStore` observing `(min-width: 1200px)`.
  - When `!isWideKanban`, `visibleGroups` defaults to `groupedOrders` (all active + conditional cancelled groups).
  - On mobile (≤767px), CSS applies `flex-direction: column` and un-constrains height.
- **Empty Lane Behavior on Mobile**:
  - Persistent empty lanes on mobile are visually hidden via `.lane[data-lane-empty="true"][data-lane-persistent="true"] { display: none; }` unless `data-search-empty="true"`.
- **Order of Statuses**:
  - `PERSISTENT_BOARD_STATUSES`: `pending` (1) → `preparing` (2) → `ready` (3) → `completed` (4).
  - `CONDITIONAL_BOARD_STATUSES`: `cancelled` (5).
  - Terminal statuses (`completed` and `cancelled`) always sit at the bottom of the stack.

---

## 6. Runtime Observation Matrix

| Viewport | Layout Mode | Sections Rendered | Completed Count | Cancelled Count | Scroll Behavior | Density Issue |
|---|---|---|---|---|---|---|
| **390px** (Mobile) | Single Column Stack | All with orders | Full list (e.g. 25) | Full list (e.g. 8) | Long continuous page scroll | Severe: 33+ terminal cards push page height > 5000px |
| **412px / S20** | Single Column Stack | All with orders | Full list | Full list | Long continuous page scroll | Severe: excessive thumb travel required |
| **430px** (Mobile) | Single Column Stack | All with orders | Full list | Full list | Long continuous page scroll | Severe: terminal orders bury cancellation review |
| **719px** (Narrow Mobile) | Single Column Stack | All with orders | Full list | Full list | Long continuous page scroll | Severe: full-bleed cards dominate workspace |
| **720px–767px** | Single Column Stack | All with orders | Full list | Full list | Long continuous page scroll | Moderate/Severe |
| **768px–1199px** (Tablet) | 2-Column Grid | All with orders | Internal lane scroll | Internal lane scroll | Contained per-lane scroll | None: constrained by `clamp(16rem, 38vh, 26rem)` |
| **1440px** (Desktop Control)| 4-Column Grid + Pager | 4 lanes active | Internal lane scroll | Pager toggle | Contained 4-lane scroll | None: fixed desktop viewport |

---

## 7. Product Options Evaluated

### Option A: Truncate All Sections (Active + Terminal) to N
- *Drawback*: Active orders (`pending`, `preparing`, `ready`) represent immediate operational obligations. Truncating pending or kitchen preparation risks missing urgent customer orders during peak volume.
- *Verdict*: **REJECTED**.

### Option B: Mobile Collapsible Accordion for All Lanes
- *Drawback*: Requires constant tapping to monitor active kitchen flow; hides pending alerts and urgency states.
- *Verdict*: **REJECTED**.

### Option C: Mobile-Only Terminal Density Cap (Recommended)
- **Active Statuses (`pending`, `preparing`, `ready`)**: Render **all** orders (uncapped).
- **Terminal Statuses (`completed`, `cancelled`)**: Render initial **5** orders per section.
- If a terminal section has > 5 orders, display a progressive disclosure button:
  - Collapsed: `Mostrar X más` (where $X = \text{total} - 5$, e.g. `Mostrar 11 más`).
  - Expanded: `Mostrar menos` (collapses back to 5).
- **Search Exemption**: When an operational search query is present, the cap is **completely bypassed** so all matching orders appear immediately.
- *Verdict*: **ACCEPTED (RECOMMENDED)**.

---

## 8. Recommended Product Specification

1. **Target Statuses**:
   - `completed`: capped at 5 orders when collapsed.
   - `cancelled`: capped at 5 orders when collapsed.
   - `pending`, `preparing`, `ready`: **never capped** (always 100% visible).
2. **Cap Threshold**: Default `DEFAULT_TERMINAL_ORDERS_PREVIEW_LIMIT = 5`.
3. **Progressive Disclosure Action**:
   - When `orders.length > 5` and collapsed: button with label `Mostrar ${orders.length - 5} más`.
   - When expanded: button with label `Mostrar menos`.
   - Button appearance: quiet secondary operational control, full-width or centered, styled with semantic tokens (`var(--text-secondary)`, `var(--bg-surface-hover)`, `var(--border-subtle)`).
4. **Header Count Badge**:
   - The badge `<span className={kanbanStyles.laneCount}>` must **always display the total count** (e.g. `24`), regardless of whether the section is collapsed (showing 5) or expanded.
5. **Sorting Guarantee**:
   - Orders inside `completed` and `cancelled` are already sorted newest first (`sortOrdersForOperationalBoard`). The preview must display the **first 5 newest orders**.
   - No custom or secondary sort semantics.

---

## 9. Search Behavior Rule

- **Rule**: If `searchQuery.trim().length > 0` (or `hasSearchQuery === true`):
  - The terminal density cap is **automatically disabled**.
  - All matching completed and cancelled orders are displayed in full.
  - No "Mostrar más" button is shown during active search.
- **Why**: Searching by `order_code` (e.g. `PGF5TU`), customer name, or phone number must immediately reveal the targeted order without requiring the user to tap "Mostrar más" inside a collapsed section.

---

## 10. Breakpoint Decision

- The terminal density cap should apply exclusively when the dashboard is rendered in mobile stacked format.
- In `DashboardKanbanBoard.tsx`:
  - Desktop wide mode (`isWideKanban = true`, ≥1200px) already enforces independent column scrolling and terminal pager; cap is disabled.
  - To be clean, the component can use a responsive media-query hook/sync store (e.g. `(max-width: 767px)`) or CSS/client state to only enable the cap on mobile stacked viewports.
  - Tablet (768px–1199px) has internal lane scroll containers (`overflow-y: auto`), so cap is not strictly required there, keeping tablet behavior aligned with multi-column layout.
- **Recommended breakpoint**: Mobile stacked mode (`max-width: 767px`).

---

## 11. State Management Recommendation

- **State Location**: Component-level state inside `DashboardKanbanBoard.tsx` (or a lightweight helper hook `useMobileTerminalDensity`).
- **State Shape**:
  ```ts
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    completed: false,
    cancelled: false
  });
  ```
- **State Invariants**:
  - Local React state only.
  - No URL query parameters.
  - No `localStorage` or `sessionStorage`.
  - No server-side persistence or mutation.
  - Reset to collapsed on initial page load.
  - Preserves expanded state during local in-memory order updates/realtime events unless the user explicitly collapses or clears the page.

---

## 12. Edge Cases Evaluated

| Scenario | Expected Behavior |
|---|---|
| **0 terminal orders** | Section renders empty state (`Sin pedidos` or hidden by CSS on mobile). No button. |
| **1–5 terminal orders** | Section renders all 1–5 orders. No button shown. |
| **6+ terminal orders (collapsed)** | Renders first 5 newest orders. Button shows `Mostrar ${total - 5} más`. Total badge shows actual count (e.g. `6`). |
| **6+ terminal orders (expanded)** | Renders all orders. Button shows `Mostrar menos`. Total badge shows actual count. |
| **Active search with 15 completed matches** | Cap disabled. All 15 matches render immediately. No button. |
| **Active search with 0 matches** | Renders empty state `Sin resultados`. No button. |
| **Realtime INSERT into completed while collapsed** | Total badge increments (e.g. from `16` to `17`). Newest 5 orders update; button updates to `Mostrar 12 más`. |
| **User opens modal from order #4** | Modal opens normally via existing `onOpen`. Order selection is unchanged. |
| **User mutates active order → completed** | Order transitions to `completed`. Appears at top of completed list; total badge increments. |

---

## 13. Risk Assessment

- **P0 Risks (Blockers)**:
  - *Risk*: Hiding active orders (`pending`, `preparing`, `ready`). *Mitigation*: Hard contract that only `completed` and `cancelled` are subject to cap.
  - *Risk*: Hiding search results behind collapsed state. *Mitigation*: Hard rule that search bypasses cap completely.
  - *Risk*: Breaking desktop Kanban 4-lane grid or terminal pager. *Mitigation*: Desktop Kanban completely bypasses mobile cap.
- **P1 Risks**:
  - *Risk*: Lane badge showing `5` instead of total orders `16`. *Mitigation*: Badge explicitly reads `group.orders.length`.
- **P2 Risks**:
  - *Risk*: Verbose or awkward button copy on narrow phones. *Mitigation*: Standard concise copy `Mostrar X más` / `Mostrar menos`.
- **P3 Risks**:
  - Tooling/lint known debts (ESLint 9 circular JSON).

---

## 14. Recommended Next Phase

- **Phase Name**: `ADMIN-DASHBOARD-MOBILE-TERMINAL-ORDERS-DENSITY-POLISH-1`
- **Implementation Strategy**:
  1. Add mobile-only terminal preview limiting in `DashboardKanbanBoard.tsx` (5 orders max for `completed` and `cancelled` when not searching and on mobile).
  2. Add progressive disclosure action `Mostrar X más` / `Mostrar menos` in `DashboardKanbanBoard.tsx` and styles in `dashboard-kanban.module.css`.
  3. Create verify suite `lib/orders/dashboard-mobile-terminal-density.verify.ts` asserting cap rules, search bypass, active status uncapped, badge preservation, and desktop isolation.
- **Files Likely Touched**:
  - `components/admin/orders/DashboardKanbanBoard.tsx`
  - `components/admin/orders/dashboard-kanban.module.css`
  - `lib/orders/dashboard-mobile-terminal-density.verify.ts` (new)
- **Files to Avoid**:
  - `admin-dashboard-orders.tsx`
  - `lib/orders/dashboard-board-view-model.ts` (view model remains authoritative with full arrays)
  - `lib/orders/natural-search.ts`
  - `lib/orders/analytics.ts`
  - `components/admin/admin-shell.*`
  - `app/globals.css` / `app/theme-tokens.css`
  - DB / SQL / migrations

---

## 15. Files Changed in this Phase

- **Audit Doc**: `docs/admin-dashboard-mobile-terminal-orders-density-audit-1.md`
- **Current Phase**: `docs/CURRENT_PHASE.md`
- **Living Audit**: `docs/admin-dashboard-forensic-living-audit.md`
- **Living Memory**: `ORDEROPS_LIVING_MEMORY.md`

*Runtime files touched: NONE*
*CSS files touched: NONE*
*SQL / Migrations: NONE*

---

## 16. Gate

**ADMIN-DASHBOARD-MOBILE-TERMINAL-ORDERS-DENSITY-AUDIT-1**

=

**AUDIT COMPLETE — READY FOR MOBILE TERMINAL DENSITY IMPLEMENTATION**

- **MOBILE TERMINAL DENSITY**: AUDITED
- **IMPLEMENTATION**: NOT APPLIED (AUDIT ONLY)
- **RECOMMENDED STRATEGY**: Mobile-only terminal cap (5 items default) with "Mostrar X más" / "Mostrar menos"
- **ACTIVE STATUSES**: UNCAPPED
- **SEARCH ACTIVE**: UNCAPPED
- **DESKTOP KANBAN**: UNCHANGED
- **DASHBOARD SEARCH/KANBAN**: REMAINS FIXED
- **DASHBOARD METRICS SEMANTICS**: REMAIN FROZEN
- **DASHBOARD CARD ROOT COUNT**: REMAINS FROZEN
- **ORDER CODE BLOCK**: REMAINS CLOSED
- **WORKSPACE PRODUCTS INLINE-ONLY**: REMAINS FROZEN
- **DASHBOARD OVERALL POLISH**: OPEN

*No commit. No push. No deploy.*

---

## Follow-up Phase

- **Implemented in**: `docs/admin-dashboard-mobile-terminal-orders-density-polish-1.md` (`ADMIN-DASHBOARD-MOBILE-TERMINAL-ORDERS-DENSITY-POLISH-1`).
- Status: **PASS — MOBILE TERMINAL ORDER DENSITY POLISHED**.
