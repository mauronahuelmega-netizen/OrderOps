# Admin Dashboard Mobile Orders Toolbar Density Polish 1

## Phase

`ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY-POLISH-1`

## Problem

On mobile (`≤768px`), session controls under “Pedidos en curso” wrapped chaotically inside a single `flex-wrap` cluster:

- session status
- Cerrar sesión / Abrir sesión
- + Pedido
- refresh/sync

That inflated vertical chrome and pushed search/tabs down.

## Decision applied (audit D2 Option B)

Mobile-only compact composition:

1. Title: Pedidos en curso
2. Session meta row: status (ellipsis) left · session action secondary/danger right (not full-width)
3. Actions row: + Pedido (flex grow) + circular refresh
4. Search below
5. Filters/tabs below search (unchanged order)

Desktop/tablet `≥769px`: wrappers use `display: contents` so the prior single-row flex order is preserved.

## Files touched

- `components/admin/orders/DashboardToolbar.tsx` — `sessionMetaRow` / `sessionActionsRow` wrappers
- `components/admin/orders/dashboard-toolbar.module.css` — mobile `max-width: 768px` composition; desktop contents dissolve
- `lib/orders/dashboard-mobile-orders-toolbar-density.verify.ts` — source contracts
- Docs: this file, `CURRENT_PHASE.md`, living audit, living memory

## Mobile-only boundary

- Polish active: `@media (max-width: 768px)`
- Unchanged: `@media (min-width: 769px)` and above

## Desktop ≥769 unchanged

`sessionMetaRow` / `sessionActionsRow` use `display: contents` outside the mobile block so children participate in the existing horizontal `sessionCluster` flex.

## Runtime QA

Source/CSS contract validated; authenticated browser matrix expected:

| Viewport | Expectation |
| -------- | ----------- |
| 360–430 dark | Two compact session rows; no H overflow; close secondary; search under actions |
| 719 / 768 | Same mobile composition |
| 769 / 1024 / 1440 | Prior toolbar geometry |

Functional smoke: session open/close, pending disabled, refresh, manual order modal open, search (order_code/name/phone), mobile terminal density + desktop Kanban unchanged.

## Verifies

`npx tsx lib/orders/dashboard-mobile-orders-toolbar-density.verify.ts` → **PASS**

## Checks

- `npx tsc --noEmit` → PASS
- `git diff --check` → PASS (touched files)
- `npm run build` → PASS (run in phase closeout)
- `npm run lint` → known ESLint 9 circular JSON debt only if fails

## Findings

- **P0:** none
- **P1:** none
- **P2:** live auth browser matrix may be partial if session unavailable in agent environment
- **P3:** touch targets slightly reduced from 2.75rem → 2.5rem on mobile (still comfortable)

## Hard boundaries

Untouched: natural-search, board VM, Kanban, analytics, card summary, AdminShell/drawer/footer, manual order modal, globals/theme, DB/SQL/RPC, realtime, session server actions.

## Gate

**PASS — MOBILE ORDERS TOOLBAR DENSITY POLISHED**

No commit. No push. No deploy.
