# Admin Dashboard Mobile Terminal Orders Density Polish (Phase 1)

## 1. Objective

Implement targeted, mobile-only progressive disclosure for terminal order lanes (`Completados` and `Cancelados`) on the Admin Dashboard (`/admin/dashboard`) in mobile stacked view (`≤767px`), capping their default visible cards to 5 while keeping active statuses (`Pendientes`, `Preparando`, `Listos`) 100% uncapped, ensuring active searches bypass the cap, and leaving tablet/desktop Kanban layouts entirely untouched.

---

## 2. Problem & Context

- **Previous State**: In mobile stacked view (`≤767px`), each status lane is rendered vertically one after another in natural document flow. For high-volume sessions with 20+ completed and 8+ cancelled orders, the page height extended beyond 5,000px. This created extreme thumb-scroll fatigue, pushed the `Cancelados` lane out of easy reach, and buried the page footer.
- **Root Constraint**: Desktop Kanban (≥1200px) and Tablet Kanban (768px–1199px) have fixed-height containers with internal per-lane scrolling (`overflow-y: auto`) and a dedicated terminal pager for `Cancelados`. They must not have their order lists capped.
- **Search Requirement**: When operators search by `order_code` (e.g. `PGF5TU`), customer name, or phone number, all matching orders must appear immediately without being hidden behind a "Mostrar más" action.

---

## 3. Product Specification & Implementation

### 3.1 Mobile Detection & Scoping
- Evaluated via `useSyncExternalStore` in `components/admin/orders/DashboardKanbanBoard.tsx` listening to `MOBILE_STACKED_MEDIA_QUERY = "(max-width: 767px)"`.
- Only triggers when `isMobileStacked === true`.
- Tablet (768px–1199px) and Desktop (≥1200px) remain completely uncapped.

### 3.2 Terminal Lanes Preview Cap
- Defined constants:
  - `MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT = 5`
  - `MOBILE_TERMINAL_ORDER_STATUSES = new Set(["completed", "cancelled"])`
- Active statuses (`pending`, `preparing`, `ready`): **Never capped** (100% visible at all times).
- Terminal statuses (`completed`, `cancelled`):
  - If `orders.length <= 5`: Render all orders; no button.
  - If `orders.length > 5`:
    - Collapsed (default): Renders first 5 newest orders. Displays button `Mostrar ${orders.length - 5} más`.
    - Expanded: Renders all orders. Displays button `Mostrar menos`.

### 3.3 Search Bypass
- Detected via `hasActiveSearch = emptyLaneLabel === "Sin resultados" || Boolean(isSearchEmpty)`.
- When search is active, the cap is disabled: all matching completed and cancelled orders are rendered in full, and no disclosure button is displayed.

### 3.4 Badge Counts Preservation
- Section header badge `<span className={kanbanStyles.laneCount}>{group.orders.length}</span>` continues to display the true total count (e.g. `16` or `24`), preserving instant operational visibility.

### 3.5 Local State & Accessibility
- Local React state in `DashboardKanbanBoard.tsx`:
  ```ts
  const [expandedTerminalSections, setExpandedTerminalSections] = useState<Record<string, boolean>>({
    completed: false,
    cancelled: false
  });
  ```
- Button attributes:
  - `type="button"`
  - `className={kanbanStyles.mobileTerminalDisclosure}`
  - `aria-expanded={isExpanded}`

### 3.6 CSS Styling
- Styled in `components/admin/orders/dashboard-kanban.module.css` with semantic tokens (`var(--border-subtle)`, `var(--bg-surface)`, `var(--text-secondary)`, `var(--bg-surface-hover)`, `var(--text-primary)`, `var(--border-strong)`).
- Minimum touch target: `min-height: 2.5rem;` (40px).
- Hidden on tablet/desktop via `@media (min-width: 768px) { .mobileTerminalDisclosure { display: none; } }`.

---

## 4. Verification & QA Matrix

### 4.1 Automated Deterministic Suite
- Created `lib/orders/dashboard-mobile-terminal-density.verify.ts`.
- Validates:
  1. Active statuses (`pending`, `preparing`, `ready`) are never capped.
  2. Terminal statuses (`completed`, `cancelled`) cap to 5 preview items when collapsed.
  3. Expanded terminal section renders all orders.
  4. Active search disables the terminal cap so all matching terminal orders are rendered.
  5. Section lane badge count always displays the total order count.
  6. Desktop and tablet modes do not apply the terminal cap.
  7. Boundary thresholds (0–5 items: no button; 6+ items: button displayed).
  8. Hidden count button label formatting (`Mostrar X más` / `Mostrar menos`).
  9. Preservation of newest-first sort order.
  10. Static source code contracts for TSX and CSS modules.

### 4.2 Viewport QA Summary
- **Mobile (390px, 412px, 430px, 719px, 767px)**:
  - Single column stack.
  - Active queues (`Pendientes`, `Preparando`, `Listos`) fully visible.
  - Completed (e.g. 18 orders) displays 5 newest + `Mostrar 13 más`.
  - Cancelled (e.g. 7 orders) displays 5 newest + `Mostrar 2 más`.
  - Tapping `Mostrar 13 más` expands Completed to 18 and changes label to `Mostrar menos`.
  - Tapping `Mostrar menos` collapses back to 5.
  - Page footer is easily reachable.
- **Search Active Mobile (e.g. query `PGF5TU` or `#PGF5`)**:
  - Cap disabled; all matches in Completed/Cancelled appear immediately without truncation.
- **Tablet (768px, 1024px, 1199px)**:
  - 2-column grid layout preserved; internal per-lane scroll intact; no disclosure buttons rendered.
- **Desktop (1200px, 1440px)**:
  - Fixed 4-lane Kanban grid preserved; terminal pager for `Cancelados` intact; zero layout shift.

---

## 5. Files Changed

- `components/admin/orders/DashboardKanbanBoard.tsx`: Added mobile stacked media query store, preview limit constant, local expanded state, and progressive disclosure button.
- `components/admin/orders/dashboard-kanban.module.css`: Added `.mobileTerminalDisclosure` styling with responsive guard.
- `lib/orders/dashboard-mobile-terminal-density.verify.ts`: Deterministic verification suite.
- `docs/admin-dashboard-mobile-terminal-orders-density-polish-1.md`: Phase documentation.
- `docs/CURRENT_PHASE.md`: Updated current phase.
- `docs/admin-dashboard-forensic-living-audit.md`: Updated living audit changelog.
- `ORDEROPS_LIVING_MEMORY.md`: Updated architectural changelog.
- `docs/admin-dashboard-mobile-terminal-orders-density-audit-1.md`: Added follow-up note.

---

## 6. Gate Status

**ADMIN-DASHBOARD-MOBILE-TERMINAL-ORDERS-DENSITY-POLISH-1**

=

**PASS — MOBILE TERMINAL ORDER DENSITY POLISHED**

- **MOBILE TERMINAL DENSITY**: IMPLEMENTED
- **MOBILE BREAKPOINT**: ≤767px stacked mode
- **COMPLETADOS**: 5 INITIAL + SHOW MORE / SHOW LESS
- **CANCELADOS**: 5 INITIAL + SHOW MORE / SHOW LESS
- **ACTIVE STATUSES**: UNCAPPED
- **SEARCH ACTIVE**: UNCAPPED
- **DESKTOP/TABLET KANBAN**: UNCHANGED
- **TERMINAL PAGER**: UNCHANGED
- **DASHBOARD SEARCH/KANBAN**: REMAINS FIXED
- **DASHBOARD ORDER_CODE PARTIAL SEARCH**: REMAINS FIXED
- **DASHBOARD METRICS SEMANTICS**: REMAIN FROZEN
- **DASHBOARD CARD ROOT COUNT**: REMAINS FROZEN
- **WORKSPACE PRODUCTS INLINE-ONLY**: REMAINS FROZEN
- **ORDER CODE BLOCK**: REMAINS CLOSED
- **DASHBOARD OVERALL POLISH**: OPEN

*No commit. No push. No deploy.*
