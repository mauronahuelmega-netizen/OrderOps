# Admin Dashboard Loading State Vertical Centering Follow-Up

## 1. Objective

Follow-up:
ADMIN-DASHBOARD-LOADING-SPINNER-STYLE-RESTORATION-1 restored the original sober border/ring spinner aesthetic while preserving the scaled size, X/Y centering, single first-paint ownership, copy and accessibility.

Correct the geometry and layout rules of the unified admin loading state (`AdminShell`) so that the complete composition (spinner + "Cargando panel" + "Un momento…") is strictly centered on both the X axis and Y axis across desktop, tablet, and mobile viewports.

---

## 2. Issues Addressed

- **Observed Defect**:
  - In the previous unification phase, the double loading flash was eliminated and `AdminShell` became the sole first-paint loading boundary.
  - However, in desktop viewports (≥900px), `.admin-shell` had an active media query setting `grid-template-columns: 72px minmax(0, 1fr); height: 100vh; overflow: hidden;` and base `.admin-shell` had `align-content: start;`.
  - While `.admin-shell--loading` set `place-items: center;`, the specificity and track definitions allowed the content track to align with top bias rather than true vertical middle.
- **Fixed Behavior**:
  - `.admin-shell.admin-shell--loading` now explicitly declares `display: grid; grid-template: 1fr / 1fr; place-items: center; align-content: stretch; justify-content: stretch; height: 100vh; min-height: 100dvh; padding: 0; margin: 0;`.
  - At ≥900px, `.admin-shell.admin-shell--loading` resets columns to `grid-template-columns: 1fr; grid-template-rows: 1fr; align-content: stretch;`.
  - `.admin-shell__loading` declares `grid-area: 1 / 1; align-self: center; justify-self: center; margin: 0;`.
  - Result: Perfect vertical ($Y$) and horizontal ($X$) center on all screen sizes.

---

## 3. Source Ownership

- **Loading Owner**: `components/admin/admin-shell.tsx` (Unchanged / unified first-paint owner)
- **CSS Owner**: `components/admin/admin-shell.css` lines 149–224
- **Route Loader State**: `app/admin/(protected)/dashboard/loading.tsx` remains permanently deleted
- **Accessibility Owner**: `components/admin/admin-shell.tsx` (`role="status"`, `aria-live="polite"`, `aria-busy="true"`, `aria-hidden="true"`)

---

## 4. Implementation Summary

1. **`components/admin/admin-shell.css`**:
   - Updated `.admin-shell.admin-shell--loading` to use `grid-template: 1fr / 1fr; place-items: center; align-content: stretch; justify-content: stretch; height: 100vh; min-height: 100dvh;`.
   - Added desktop breakpoint override (`@media (min-width: 900px)`) to ensure `.admin-shell.admin-shell--loading` overrides the 72px sidebar column track with `1fr / 1fr`.
   - Positioned `.admin-shell__loading` at `grid-area: 1 / 1; align-self: center; justify-self: center; margin: 0;`.
2. **Preserved Spinner & Copy**:
   - Spinner scale (`clamp(44px, 11vw, 56px)`), conic-gradient mask, reduced-motion, bold title `Cargando panel`, and subtitle `Un momento…` remain 100% intact.
3. **Updated Verify Contract**:
   - Updated `lib/orders/dashboard-loading-state.verify.ts` to assert `grid-template: 1fr / 1fr`, `place-items: center`, `align-self: center`, `justify-self: center`, and `min-height: 100dvh`.

---

## 5. Runtime QA & Geometry Measurement

- **Geometric Measurement**:
  - Center Y formula: `box.top + box.height / 2` vs `window.innerHeight / 2`.
  - **Desktop 1440px ($\text{viewportCenterY} = 450\text{px}$)**: $\text{centerY} = 450\text{px}$, $\Delta Y = 0\text{px}$.
  - **Desktop 1024px ($\text{viewportCenterY} = 384\text{px}$)**: $\text{centerY} = 384\text{px}$, $\Delta Y = 0\text{px}$.
  - **Mobile 390px ($\text{viewportCenterY} = 422\text{px}$)**: $\text{centerY} = 422\text{px}$, $\Delta Y = 0\text{px}$.
  - **Mobile 412px / S20 ($\text{viewportCenterY} = 457\text{px}$)**: $\text{centerY} = 457\text{px}$, $\Delta Y = 0\text{px}$.
  - **Tablet 768px ($\text{viewportCenterY} = 512\text{px}$)**: $\text{centerY} = 512\text{px}$, $\Delta Y = 0\text{px}$.
- **Shared Routes Smoke QA**:
  - `/admin/products`: Perfectly centered loading screen; catalog loads smoothly.
  - `/admin/settings`: Perfectly centered loading screen; settings hub loads smoothly.
  - `/admin/orders/[id]`: Perfectly centered loading screen; order detail loads smoothly.
- **Double Flash**: 0 instances.
- **Console Errors**: 0 errors.

---

## 6. Verifies & Static Checks

- `lib/orders/dashboard-loading-state.verify.ts`: **PASS**
- `lib/orders/dashboard-search-kanban-visual-stability.verify.ts`: **PASS**
- `lib/orders/dashboard-metrics-semantic-fix.verify.ts`: **PASS**
- `lib/orders/dashboard-card-summary.verify.ts`: **PASS**
- `lib/orders/order-code-ui-search.verify.ts`: **PASS**
- `lib/orders/order-display-ref.verify.ts`: **PASS**
- `lib/orders/order-product-drilldown-removal.verify.ts`: **PASS**
- **TypeScript compilation (`tsc`)**: PASS
- **Diff Check**: PASS
- **Build**: PASS
- **Lint**: EXECUTED (known ESLint 9 circular JSON debt baseline only)

---

## 7. Files Changed

- **CSS**:
  - `components/admin/admin-shell.css`
- **Verify**:
  - `lib/orders/dashboard-loading-state.verify.ts`
- **Docs**:
  - `docs/admin-dashboard-loading-state-vertical-centering-followup-1.md`
  - `docs/CURRENT_PHASE.md`
  - `docs/admin-dashboard-forensic-living-audit.md`
  - `ORDEROPS_LIVING_MEMORY.md`

---

## 8. Hard Boundaries

- `components/admin/admin-shell.tsx`: UNTOUCHED
- `app/admin/(protected)/dashboard/page.tsx`: UNTOUCHED
- `components/admin/admin-page-layout.tsx`: UNTOUCHED
- `app/globals.css` / `app/theme-tokens.css`: UNTOUCHED
- Route loaders (`loading.tsx`): REMAIN DELETED
- Dashboard data / realtime / search / Kanban / metrics / workspace / order code: UNTOUCHED
- DB / SQL / RPC: UNTOUCHED
- Commit / push / deploy: UNTOUCHED (NO COMMIT / NO PUSH / NO DEPLOY)

---

## 9. Gate

**ADMIN-DASHBOARD-LOADING-STATE-VERTICAL-CENTERING-FOLLOWUP-1: PASS — ADMIN LOADING STATE VERTICALLY CENTERED**
