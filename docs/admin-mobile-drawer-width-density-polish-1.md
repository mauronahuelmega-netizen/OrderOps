# Admin Mobile Drawer Width Density Polish 1

## 1. Objective

Reduce the horizontal presence of the admin **mobile** drawer so it feels less invasive and more premium, while preserving navigation, theme toggle, logout, overlay/close behavior, tap targets, and the desktop sidebar.

## 2. Current issue

Audit (`ADMIN-DASHBOARD-MOBILE-ORDERS-FINAL-VISUAL-DEBT-AUDIT-1` / D1):

- Previous width: `--drawer-width: min(88vw, 360px)`
- On 390px ≈ 343px drawer; on 412/430px hits 360px cap
- Visually covers too much of the dashboard behind the sheet
- Nav/actions do not need that much horizontal room

Tablet override (768–899) previously used `min(88vw, 420px)`, which stayed aggressive.

## 3. Product decision

Approved compact formula (audit Option B):

```css
--drawer-width: min(78vw, 340px);
```

Tablet range (768–899), still mobile drawer (hidden ≥900px):

```css
--drawer-width: min(78vw, 360px);
```

Slightly wider than phone cap, still compact vs prior `88vw` / `420px`. Fallback `min(80vw, 344px)` was **not** needed after source review (labels use ellipsis/`title`; rows stay 44px).

Not applied: rigid “30% less” quota; fixed single width like `300px`.

## 4. Source ownership

| Surface | Owner |
| ------- | ----- |
| Mobile drawer TSX | `components/admin/admin-mobile-drawer.tsx` (portal + overlay; mounted from `admin-topbar.tsx`) |
| Mobile drawer CSS | `components/admin/admin-mobile-drawer.css` |
| Desktop sidebar | `components/admin/layout/admin-sidebar.tsx` + `.module.css` — **untouched** |
| Admin shell layout | `components/admin/admin-shell.tsx` / `.css` — **untouched** |
| Nav items (shared classes) | `admin-nav-list.tsx` variant `"drawer"` — **untouched** (consumes drawer CSS classes) |

Breakpoint: drawer portal/overlay hidden at `@media (min-width: 900px)`.

## 5. Implementation summary

- CSS-only width token change in `admin-mobile-drawer.css`
- Preserved full-height sheet, safe-area, transform animation, overlay, close, theme toggle, logout, scroll, `--drawer-row-min-height: 44px`
- No TSX change
- No AdminShell / sidebar / toolbar / footer / Kanban / globals / theme / DB changes

## 6. Mobile width behavior

| Viewport | Approx drawer (78vw / caps) |
| -------- | --------------------------- |
| 360 | ~281px |
| 390 | ~304px |
| 412 | ~321px |
| 430 | ~335px |
| ≥436 (phone formula) | 340px cap |
| 768–899 | `min(78vw, 360px)` |

## 7. Runtime QA

Authenticated browser QA on `localhost:3000` (demo tenant La Burguesía), dark + light:

| Viewport | Drawer width | Notes |
| -------- | ------------ | ----- |
| 360 dark | 281px | email unclipped; no H-overflow; ~79px visible behind |
| 390 dark | 304px | matches `78vw`; overlay present; nav 44px rows |
| 412 dark | 321px | PASS |
| 430 dark | 335px | PASS |
| 719 dark | 340px cap | PASS |
| 768 dark | 360px (`min(78vw, 360px)`) | tablet override PASS |
| 1024 dark | drawer portal/menu `display:none`; sidebar rail ~72px | desktop intact |
| 1440 dark | same | desktop intact |
| 390 light | 304px | theme toggle works; premium light sheet |

Smokes: `/admin/products`, `/admin/settings`, `/admin/orders/2ed41c20-…` — drawer opens; close (X) works; logout visible (not clicked). Console: no client error bag observed.

## 8. Verifies

```bash
npx tsx lib/orders/admin-mobile-drawer-width-density.verify.ts  # PASS
npx tsx lib/orders/dashboard-mobile-orders-toolbar-density.verify.ts  # PASS
npx tsx lib/orders/dashboard-mobile-terminal-density.verify.ts  # PASS
npx tsx lib/orders/dashboard-search-kanban-visual-stability.verify.ts  # PASS
npx tsx lib/orders/dashboard-metrics-semantic-fix.verify.ts  # PASS
npx tsx lib/orders/order-code-ui-search.verify.ts  # PASS
npx tsx lib/orders/order-display-ref.verify.ts  # PASS
```

Runtime-only remaining nuance: Escape/overlay click not separately timed beyond close-button close (overlay target exists; close X confirmed).

## 9. Static checks

- `npx tsc --noEmit` → PASS
- `git diff --check` → PASS
- `npm run build` → PASS
- `npm run lint` → known ESLint 9 circular JSON debt only

## 10. Lint evidence

- Executed: `npm run lint`
- Exact result: ESLint 9.39.4 `TypeError: Converting circular structure to JSON` (config-validator / React plugin cycle)
- Known tooling debt only — not fixed in this phase
- `tsc --noEmit` PASS; `git diff --check` PASS; `npm run build` PASS

## 11. Files changed

- `components/admin/admin-mobile-drawer.css`
- `lib/orders/admin-mobile-drawer-width-density.verify.ts`
- `docs/admin-mobile-drawer-width-density-polish-1.md`
- `docs/CURRENT_PHASE.md`
- `docs/admin-dashboard-forensic-living-audit.md`
- `docs/admin-dashboard-mobile-orders-final-visual-debt-audit-1.md` (follow-up note)
- `ORDEROPS_LIVING_MEMORY.md`

## 12. P0–P3 findings

- **P0:** none
- **P1:** none
- **P2:** none (authenticated matrix completed)
- **P3:** close control visual height ~36px (pre-existing; hit area still usable; rows remain 44px)

## 13. Hard boundaries

Untouched: desktop sidebar, AdminShell layout, dashboard toolbar (D2 frozen), Kanban/search/metrics, mobile terminal density, footer, manual order modal, order_code, workspace, public success, DB/RPC/realtime, `globals.css` / `theme-tokens.css`. No commit / push / deploy.

## 14. Gate

`ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1` — **PASS — ADMIN MOBILE DRAWER WIDTH POLISHED**

- D1 drawer width: **IMPLEMENTED**
- Mobile drawer: **COMPACT** / **FROZEN**
- Width: `min(78vw, 340px)` (+ tablet `min(78vw, 360px)`)
- Desktop sidebar: **UNCHANGED**
- D2 toolbar density: **REMAINS FROZEN**
- D3 manual modal: **NEEDS DEEPER AUDIT**
- D4 footer: **AUDITED / PENDING**
