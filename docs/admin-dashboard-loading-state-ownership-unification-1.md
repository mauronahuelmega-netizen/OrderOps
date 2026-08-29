# Admin Dashboard Loading State Ownership Unification

## 1. Objective

Follow-up:
ADMIN-DASHBOARD-LOADING-STATE-VERTICAL-CENTERING-FOLLOWUP-1 corrected visual Y-axis centering after owner review found the unified loader was still top-biased.

Eliminate the sequential double-loading flash on `/admin/dashboard` by unifying the loading presentation directly at the authoritative first-paint boundary: `AdminShell`.

Per the forensic conclusions of `ADMIN-DASHBOARD-LOADING-STATE-OWNERSHIP-AUDIT-1`:
- `AdminShell` is the true first-paint boundary rendered immediately upon client hydration while `useBusinessSettings` resolves tenant settings.
- `app/admin/(protected)/dashboard/loading.tsx` mounted late as an internal segment Suspense fallback inside `<main>`, producing an unwanted second visual flash and mismatched spinner scaling.
- Option A was chosen: Upgrade shared `AdminShell` loading with the scaled mask spinner (`clamp(44px, 11vw, 56px)`) and two-tier typography (`Cargando panel` / `Un momento…`), and delete the redundant route-specific dashboard loading files.

---

## 2. Issues Addressed

- **Old Behavior**:
  1. T0–T1: Small 28px spinner + `Cargando panel…` inside full-viewport canvas.
  2. T2: Brief flash of large 56px mask spinner + `Cargando panel` / `Un momento…` inside route content area.
  3. T3: Dashboard orders interface mounted.
- **New Behavior**:
  - Instant, single, continuous loading state from the very first frame at T0 through dashboard resolution.
  - Scale-aligned conic-gradient mask spinner (`44–56px`), bold title `Cargando panel`, and muted subtitle `Un momento…`.
  - Zero second-stage flash or layout handoff.

---

## 3. Source Ownership

- **First-paint Loading Owner**: `components/admin/admin-shell.tsx` & `components/admin/admin-shell.css`
- **Removed Owner**: `app/admin/(protected)/dashboard/loading.tsx` & `app/admin/(protected)/dashboard/dashboard-loading.module.css` (deleted)
- **Spinner Owner**: `.admin-shell__loading-spinner` in `components/admin/admin-shell.css`
- **Copy Owner**: `.admin-shell__loading-title` (`Cargando panel`) & `.admin-shell__loading-subtitle` (`Un momento…`) in `components/admin/admin-shell.tsx`
- **CSS Owner**: `components/admin/admin-shell.css` lines 149–216
- **Accessibility Owner**: `components/admin/admin-shell.tsx` (`role="status"`, `aria-busy="true"`, `aria-live="polite"`, `aria-hidden="true"` on spinner)

---

## 4. Implementation Summary

1. **`components/admin/admin-shell.tsx`**:
   - Replaced single-line fallback markup with structured container:
     ```tsx
     <div className="admin-shell admin-shell--loading">
       <div
         className="admin-shell__loading"
         aria-busy="true"
         aria-live="polite"
         role="status"
       >
         <div className="admin-shell__loading-spinner" aria-hidden="true" />
         <p className="admin-shell__loading-title">Cargando panel</p>
         <p className="admin-shell__loading-subtitle">Un momento…</p>
       </div>
     </div>
     ```
2. **`components/admin/admin-shell.css`**:
   - Updated `.admin-shell__loading` to flex column with 12px gap and centered alignment.
   - Upgraded `.admin-shell__loading-spinner` to `width/height: clamp(44px, 11vw, 56px);` utilizing conic-gradient with radial mask.
   - Added `.admin-shell__loading-title` (`font-weight: 700; color: var(--text-primary); font-size: clamp(0.95rem, 2.6vw, 1.08rem);`).
   - Added `.admin-shell__loading-subtitle` (`color: var(--text-tertiary); font-size: clamp(0.78rem, 2.2vw, 0.88rem);`).
   - Added `@media (prefers-reduced-motion: reduce)` animation dampener.
3. **Deleted Redundant Files**:
   - Deleted `app/admin/(protected)/dashboard/loading.tsx`.
   - Deleted `app/admin/(protected)/dashboard/dashboard-loading.module.css`.
4. **Verified Source Contracts**:
   - `lib/orders/dashboard-loading-state.verify.ts` updated and validated.

---

## 5. Runtime QA

- **Dashboard Desktop (1440px / 1024px)**:
  - Immediate 56px spinner with clean two-tier copy on full-screen canvas.
  - Zero double flash; seamless single-state transition directly into the dashboard interface.
  - Both Light and Dark theme contrast verified.
- **Dashboard Mobile (390px / 412px / 430px) & Tablet (720px / 768px)**:
  - Fluidly scaled 44px spinner, centered vertically and horizontally.
  - 0 horizontal or vertical overflow.
- **Smoke QA Across Shared Admin Routes**:
  - `/admin/products`: Mounts smoothly with the unified shell loading.
  - `/admin/settings`: Mounts smoothly with the unified shell loading.
  - `/admin/orders/[id]`: Detail route renders without flash or console errors.
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
- **Diff Check**: PASS (strictly targeted files)
- **Build**: PASS
- **Lint**: EXECUTED (known ESLint 9 circular JSON debt baseline only)

---

## 7. Files Changed

- **Runtime**:
  - `components/admin/admin-shell.tsx`
- **CSS**:
  - `components/admin/admin-shell.css`
- **Deleted**:
  - `app/admin/(protected)/dashboard/loading.tsx`
  - `app/admin/(protected)/dashboard/dashboard-loading.module.css`
- **Verify**:
  - `lib/orders/dashboard-loading-state.verify.ts`
- **Docs**:
  - `docs/admin-dashboard-loading-state-ownership-unification-1.md`
  - `docs/CURRENT_PHASE.md`
  - `docs/admin-dashboard-forensic-living-audit.md`
  - `ORDEROPS_LIVING_MEMORY.md`

---

## 8. P0–P3 Findings

- **P0**: None. Single loading boundary eliminates double-render race condition.
- **P1**: None. Double flash eliminated; spinner and copy hierarchy unified.
- **P2**: None.
- **P3**: None.

---

## 9. Hard Boundaries

- `app/admin/(protected)/dashboard/page.tsx`: **UNTOUCHED**
- `components/admin/admin-page-layout.tsx`: **UNTOUCHED**
- `app/globals.css`: **UNTOUCHED**
- `app/theme-tokens.css`: **UNTOUCHED**
- Dashboard data loaders / realtime: **UNTOUCHED**
- Dashboard search / Kanban: **UNTOUCHED**
- Dashboard metrics semantics: **UNTOUCHED**
- Dashboard card root count: **UNTOUCHED**
- Workspace Products inline-only: **UNTOUCHED**
- Order code block: **UNTOUCHED**
- Public catalog: **UNTOUCHED**
- DB / SQL / RPC: **UNTOUCHED**
- Commit / push / deploy: **UNTOUCHED (NO COMMIT / NO PUSH / NO DEPLOY)**

---

## 10. Gate

**ADMIN-DASHBOARD-LOADING-STATE-OWNERSHIP-UNIFICATION-1: PASS — ADMIN LOADING STATE UNIFIED**
