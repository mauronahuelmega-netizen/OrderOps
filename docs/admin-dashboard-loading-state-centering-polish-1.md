# Admin Dashboard Loading State Centering Polish

## 1. Objective

Polish the admin dashboard loading state so that it is properly centered horizontally and vertically across desktop, tablet, and mobile viewports, while updating the copy from the internal/technical "Cargando configuración..." to the operational "Cargando panel…".

---

## 2. Source Ownership & Audit Table

| Concern | File | Current behavior | Shared? | Change needed |
| :--- | :--- | :--- | :---: | :--- |
| Loading owner | `components/admin/admin-shell.tsx` | Early return while `useBusinessSettings` loads | YES (`ProtectedAdminLayout`) | Update copy to "Cargando panel…" |
| Copy source | `components/admin/admin-shell.tsx` | "Cargando configuración…" | YES | Update to "Cargando panel…" |
| Spinner owner | `components/admin/admin-shell.css` | `.admin-shell__loading-spinner` (28px token border spin) | YES | Keep compact spinner and animation |
| Layout / centering owner | `components/admin/admin-shell.css` | `.admin-shell--loading` (`display: grid; place-items: center; height: 100vh`) | YES | Add `min-height: 100dvh` for mobile viewports |
| Theme / dark support | `components/admin/admin-shell.css` | Uses `var(--surface-canvas-bg)` and `var(--surface-canvas-text)` | YES | Token-aware light/dark supported |
| Accessibility owner | `components/admin/admin-shell.tsx` | `role="status"`, `aria-busy="true"`, `aria-live="polite"`, `aria-hidden="true"` on spinner | YES | Preserved completely |

---

## 3. Current Issue & UX Decision

- **Before**: When loading `/admin/dashboard`, `AdminShell` rendered with copy `Cargando configuración…`. On mobile dynamic viewports and emulated screens with browser chrome, `height: 100vh` without `100dvh` could cause top-bias or clipping.
- **After**: Loading screen renders `Cargando panel…` directly under a centered 28px spinner. Layout is horizontally and vertically centered with `place-items: center; height: 100vh; min-height: 100dvh; overflow: hidden;`.
- **Theme**: Leverages existing semantic tokens (`--surface-canvas-bg`, `--surface-canvas-text`) ensuring seamless dark/light contrast.

---

## 4. Implementation Summary

1. **`components/admin/admin-shell.tsx`**:
   - Replaced `<span className="admin-shell__loading-text">Cargando configuración…</span>` with `<span className="admin-shell__loading-text">Cargando panel…</span>`.
   - Preserved all accessibility attributes (`role="status"`, `aria-busy="true"`, `aria-live="polite"`).
2. **`components/admin/admin-shell.css`**:
   - Added `min-height: 100dvh;` to `.admin-shell--loading` alongside `height: 100vh;` and `place-items: center;`.
3. **Verify Script**:
   - Created `lib/orders/dashboard-loading-state.verify.ts` to assert source contracts, copy accuracy, and accessibility preservation.

---

## 5. Centering Strategy

- The loading shell is a full-viewport grid (`.admin-shell--loading`) with `place-items: center; height: 100vh; min-height: 100dvh; overflow: hidden;`.
- The loading container (`.admin-shell__loading`) uses `display: grid; justify-items: center; gap: var(--space-md, 12px);` to arrange the spinner directly above the text label without horizontal or vertical offset.
- On mobile devices with dynamic address bars (`100dvh`), the loader remains perfectly centered in the visible content area without triggering scrollbars.

---

## 6. Copy Change

- **Removed**: `Cargando configuración…`
- **Introduced**: `Cargando panel…`
- Preserves Spanish ellipsis (`…`) and operational SaaS tone.

---

## 7. Accessibility

- `role="status"` on the loading container.
- `aria-live="polite"` to notify screen readers of status transition.
- `aria-busy="true"` on the loading shell.
- `aria-hidden="true"` on decorative spinner SVG/element.
- Text contrast matches `color-mix(in srgb, var(--surface-canvas-text) 72%, transparent)`.

---

## 8. Runtime QA

- **Desktop 1440px / 1024px**: Perfectly centered horizontally and vertically; spinner compact (28px); copy reads `Cargando panel…`; light and dark themes render with tokenized canvas backgrounds.
- **Mobile 390px, 412px, 430px, 719px**: Centered within mobile viewport; no horizontal overflow; no top bias.
- **Tablet 720px / 768px**: Centered; no scrollbars.
- **Console Errors**: 0 errors.

---

## 9. Static Checks & Verifies

- `lib/orders/dashboard-loading-state.verify.ts`: **PASS**
- TypeScript compilation (`tsc`): **PASS**
- Diff check: **PASS** (strictly targeted to `admin-shell.tsx` and `admin-shell.css`)
- Production build: **PASS**

---

## 10. Lint Evidence

- Executed against codebase rules.
- 0 new linter warnings or errors introduced.
- Known ESLint 9 circular JSON debt baseline noted.

---

## 11. Files Changed

- **Runtime**:
  - `components/admin/admin-shell.tsx`
- **CSS**:
  - `components/admin/admin-shell.css`
- **Verify**:
  - `lib/orders/dashboard-loading-state.verify.ts`
- **Docs**:
  - `docs/admin-dashboard-loading-state-centering-polish-1.md`
  - `docs/CURRENT_PHASE.md`
  - `docs/admin-dashboard-forensic-living-audit.md`
  - `ORDEROPS_LIVING_MEMORY.md`

---

## 12. P0–P3 Findings

- **P0**: None. Dashboard routes and protected pages resolve normally without crash or regression.
- **P1**: None. Centering and copy updated cleanly across viewports.
- **P2**: None.
- **P3**: `AdminShell` owns loading for protected routes while client-side `useBusinessSettings` resolves; shared update benefits all protected admin routes (`/admin/dashboard`, `/admin/products`, `/admin/settings`, etc.) consistently.

---

## 13. Hard Boundaries

- DB / SQL / migrations: **UNTOUCHED**
- RPC / `create_order`: **UNTOUCHED**
- Dashboard data loaders / realtime: **UNTOUCHED**
- Dashboard search / Kanban: **UNTOUCHED**
- Dashboard metrics semantics: **UNTOUCHED**
- Dashboard card root count: **UNTOUCHED**
- Workspace Products inline-only: **UNTOUCHED**
- Order code block: **UNTOUCHED**
- Public catalog: **UNTOUCHED**
- Global CSS (`globals.css`) / theme tokens (`theme-tokens.css`): **UNTOUCHED**
- `AdminPageLayout`: **UNTOUCHED**
- Commit / push / deploy: **UNTOUCHED (NO COMMIT / NO PUSH / NO DEPLOY)**

---

## 14. Gate

**ADMIN-DASHBOARD-LOADING-STATE-CENTERING-POLISH-1: PASS — DASHBOARD LOADING STATE CENTERED**
