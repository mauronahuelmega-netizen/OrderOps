# ADMIN-DASHBOARD-KANBAN-TERMINAL-LANE-PAGER-1

**Date:** 2026-08-17  
**Status:** FUNCTIONAL PASS + VISUAL FOLLOW-UP CLOSED (`ADMIN-DASHBOARD-KANBAN-LANE-PAGER-VISUAL-FIX-1`)  
**Scope:** Desktop Kanban on `/admin/dashboard` (≥1200px)

---

## UX contract

Always show **exactly 4 visible lanes** on the desktop multi-lane grid.

### Primary window (default)

1. Pendientes  
2. Preparando  
3. Listos  
4. Completados  

`Cancelados` is never a fifth compressed column.

### When `cancelledCount > 0`

Show secondary pager in a compact board navigation row **above** the grid (right-aligned):

`Cancelados {N} →`

### Terminal window

1. Preparando  
2. Listos  
3. Completados  
4. Cancelados  

Left-aligned control in the same navigation row:

`← Pendientes`

---

## State owner

- Local UI state inside `DashboardKanbanBoard`: `"primary" | "terminal"`
- **Not** persisted in DB, localStorage, URL, server, realtime, or order view-model domain state
- Orchestrator (`admin-dashboard-orders.tsx`) untouched

---

## Lane windows

Derived from existing `groupedOrders` (board view-model unchanged):

| Window   | Statuses                                      |
| -------- | --------------------------------------------- |
| primary  | pending, preparing, ready, completed          |
| terminal | preparing, ready, completed, cancelled        |

Domain still builds cancelled as a conditional lane when count > 0. Presentation only chooses which four to render on desktop.

---

## Realtime invariant

- New cancelled via realtime does **not** auto-switch the window
- Primary stays primary; pager count updates
- Terminal stays terminal; content/count update
- If `cancelledCount` → 0 while in terminal → local reset to primary
- Realtime hooks / reconciliation / pending mutations: **untouched**

---

## Files changed

| File | Change |
| ---- | ------ |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Local window state + pager buttons + visible lane selection (≥1200px) |
| `components/admin/orders/dashboard-kanban.module.css` | `.boardShell` / `.lanePager`; desktop grid always `repeat(4, …)` |
| `docs/admin-dashboard-kanban-terminal-lane-pager-1.md` | This phase doc |
| `docs/admin-dashboard-forensic-living-audit.md` | Reconcile ownership + invariant + changelog |
| `docs/CURRENT_PHASE.md` | Phase status |

**Not changed:** realtime hooks, reconciliation, order-card, orchestrator, actions, DB, tenant logic.

---

## Responsive behavior

| Viewport | Behavior |
| -------- | -------- |
| ≥1200px | Fixed 4-column grid; terminal pager when cancelled > 0 |
| 768–1199px | Unchanged: 2-column grid; all `groupedOrders` lanes (incl. cancelled) |
| ≤767px | Unchanged: stacked lanes; cancelled still appears when present |

Pager controls render in a dedicated compact row **above** the grid at ≥1200px only. They are not mounted below that breakpoint (no empty strip). Visual placement: `docs/admin-dashboard-kanban-lane-pager-visual-fix-1.md`.

---

## Accessibility

- Semantic `<button type="button">`
- Visible labels sufficient (no extra `aria-label`)
- `:focus-visible` ring preserved
- Keyboard activatable; min-height ~2rem touch target

---

## QA matrix

| Case | Expected |
| ---- | -------- |
| A — 0 cancelled | 4 primary lanes; pager absent |
| B — 1+ cancelled | Primary 4 lanes + `Cancelados N →`; no 5-col compression |
| C — open terminal | preparing/ready/completed/cancelled + `← Pendientes` |
| D — back | Restore primary |
| E — realtime cancel in primary | Count updates; no auto-navigation |
| F — cancelled → 0 in terminal | Auto return to primary |

**Lane width stable = YES** (desktop always 4 tracks).

---

## Checks

Recorded at phase closeout (local):

| Check | Result |
| ----- | ------ |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS (LF/CRLF warnings only) |
| `npm run build` | PASS |
| `npm run lint` | FAIL — known ESLint 9 circular JSON (`plugins.react`); no new lint surface |
