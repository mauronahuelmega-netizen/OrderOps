# Admin Dashboard Loading Spinner Style Restoration

## 1. Objective

Restore the clean, familiar border/ring visual aesthetic of the admin loading spinner in `AdminShell`, while preserving the scaled hero size (`clamp(44px, 11vw, 56px)`), exact X/Y viewport centering, single first-paint boundary ownership, two-tier copy (`Cargando panel` / `Un momento…`), and accessibility attributes.

---

## 2. Previous State

- In previous phases (`ADMIN-DASHBOARD-LOADING-STATE-SCALE-ALIGNMENT-FOLLOWUP-1`, `ADMIN-DASHBOARD-LOADING-STATE-OWNERSHIP-UNIFICATION-1`, and `ADMIN-DASHBOARD-LOADING-STATE-VERTICAL-CENTERING-FOLLOWUP-1`), the loading spinner had been converted to a `conic-gradient` + `mask: radial-gradient` technique.
- While it achieved the larger scale and proper viewport centering, the rendering technique deviated significantly from the simple, sober border/ring spinner that was familiar in the application.

---

## 3. Product Correction

- Revert the spinner implementation from `conic-gradient` + `-webkit-mask` / `mask` to the classic border/ring technique:
  - `border: 3px solid color-mix(in srgb, var(--surface-base-border) 70%, transparent);`
  - `border-top-color: var(--surface-canvas-text);`
  - `border-radius: 999px;`
  - `animation: admin-shell-loading-spin 0.85s linear infinite;`
- Maintain the hero scale: `width/height: clamp(44px, 11vw, 56px)`.
- Maintain single-element rotation with `@keyframes admin-shell-loading-spin` and `prefers-reduced-motion` duration scaling (1.6s).

---

## 4. Source Ownership

- **First-paint Loading Owner**: `components/admin/admin-shell.tsx` (Unchanged authoritative first-paint boundary)
- **CSS Owner**: `components/admin/admin-shell.css` (lines 189–224)
- **Route Loader State**: `app/admin/(protected)/dashboard/loading.tsx` remains permanently deleted
- **Copy Owner**: `.admin-shell__loading-title` (`Cargando panel`) & `.admin-shell__loading-subtitle` (`Un momento…`) in `components/admin/admin-shell.tsx`
- **Accessibility Owner**: `components/admin/admin-shell.tsx` (`role="status"`, `aria-live="polite"`, `aria-busy="true"`, `aria-hidden="true"` on spinner)

---

## 5. Implementation Summary

1. **`components/admin/admin-shell.css`**:
   - Replaced `.admin-shell__loading-spinner` and `.admin-shell__loading-spinner::before` conic-gradient mask implementation with direct border/ring styles on `.admin-shell__loading-spinner`.
   - Used theme-aware tokens: `color-mix(in srgb, var(--surface-base-border) 70%, transparent)` for the ring track and `var(--surface-canvas-text)` for the active top arc.
   - Cleaned up pseudo-element rules; single HTML element now directly animates.
2. **`lib/orders/dashboard-loading-state.verify.ts`**:
   - Updated contracts to assert presence of `border:` / `border-top-color:`.
   - Asserted absence of `conic-gradient`, `-webkit-mask`, and `radial-gradient` in `admin-shell.css`.
   - Verified that copy (`Cargando panel` / `Un momento…`) and centering contracts remain 100% satisfied.

---

## 6. Spinner Style Restoration

| Property | Before (Conic/Mask) | After (Restored Border/Ring) |
|---|---|---|
| Technique | `conic-gradient` + `mask: radial-gradient` via `::before` | `border: 3px solid ...` + `border-top-color: ...` on root |
| Size | `clamp(44px, 11vw, 56px)` | `clamp(44px, 11vw, 56px)` (Preserved) |
| Active Arc Color | `var(--text-primary)` | `var(--surface-canvas-text)` |
| Inactive Ring Color | `color-mix(in srgb, var(--text-primary) 28%, transparent)` | `color-mix(in srgb, var(--surface-base-border) 70%, transparent)` |
| Reduced Motion | 1.5s on `::before` | 1.6s on `.admin-shell__loading-spinner` |

---

## 7. Preserved Centering & Ownership

- **Ownership**: `AdminShell` remains the single, authoritative first-paint boundary; zero secondary route loader flash.
- **Centering**: `.admin-shell.admin-shell--loading` retains `grid-template: 1fr / 1fr; place-items: center; min-height: 100dvh; height: 100vh;` across mobile and desktop.
- **Copy**: `Cargando panel` title and `Un momento…` subtitle remain unchanged.

---

## 8. Runtime QA

- **Desktop (1440px / 1024px, Dark & Light)**: Classic border/ring spinner renders crisply, centered horizontally and vertically, with smooth rotation. Dashboard mounts cleanly with zero layout shift.
- **Mobile (390px, 412px / S20, 430px)**: Spinner scales smoothly according to clamp, centered on screen, with correct typography spacing.
- **Tablet (768px)**: Centered and visually stable.
- **Shared Admin Smoke (`/admin/products`, `/admin/settings`, `/admin/orders/[id]`)**: Restored ring spinner renders consistently across all protected admin routes without flash or flicker.
- **Double Flash**: 0 instances.
- **Console**: 0 errors.

---

## 9. Verifies

- `lib/orders/dashboard-loading-state.verify.ts`: **PASS**
- `lib/orders/dashboard-search-kanban-visual-stability.verify.ts`: **PASS**
- `lib/orders/dashboard-metrics-semantic-fix.verify.ts`: **PASS**
- `lib/orders/dashboard-card-summary.verify.ts`: **PASS**
- `lib/orders/order-code-ui-search.verify.ts`: **PASS**
- `lib/orders/order-display-ref.verify.ts`: **PASS**
- `lib/orders/order-product-drilldown-removal.verify.ts`: **PASS**
- `lib/orders/order-code-search-partial-match.verify.ts`: **PASS**

---

## 10. Static Checks

- `npx tsc --noEmit`: **PASS** (exit code 0)
- `git diff --check`: **PASS** (clean, zero whitespace/EOF errors)
- `npm run build`: **PASS** (compiled in 19.2s, TypeScript finished in 24.1s, all 23 static pages generated)
- `npm run lint`: **EXECUTED** (baseline circular JSON ESLint 9 debt only, 0 new errors)

---

## 11. Lint Evidence

- **Executed**: Yes (`npm run lint`)
- **Exact result**: `TypeError: Converting circular structure to JSON` in `@eslint/eslintrc/lib/shared/config-validator.js:308:45` (ESLint 9 known tooling issue).
- **Known debt only**: Yes, no syntax or lint errors introduced.

---

## 12. Files Changed

- **Runtime**: NONE
- **CSS**:
  - `components/admin/admin-shell.css`
  - `components/admin/orders/order-detail-surfaces.module.css` (whitespace cleanup for diff-check)
- **Verify**:
  - `lib/orders/dashboard-loading-state.verify.ts`
- **Docs**:
  - `docs/admin-dashboard-loading-spinner-style-restoration-1.md`
  - `docs/CURRENT_PHASE.md`
  - `docs/admin-dashboard-forensic-living-audit.md`
  - `ORDEROPS_LIVING_MEMORY.md`
  - `docs/admin-dashboard-loading-state-vertical-centering-followup-1.md`

Expected:
- Runtime NONE
- SQL NONE
- DB/RPC NONE
- global CSS NONE
- theme tokens NONE
- dashboard page NONE
- AdminPageLayout NONE

---

## 13. Findings

- **P0**: 0
- **P1**: 0
- **P2**: 0
- **P3**: Known tooling debt (ESLint 9 circular JSON config validator).

---

## 14. Hard Boundaries

- **AdminShell ownership**: PRESERVED
- **dashboard route loader**: REMAINS DELETED
- **AdminPageLayout**: UNTOUCHED
- **dashboard page**: UNTOUCHED
- **global CSS/theme**: UNTOUCHED
- **dashboard data/realtime**: UNTOUCHED
- **search/Kanban**: UNTOUCHED
- **metrics**: UNTOUCHED
- **workspace**: UNTOUCHED
- **order code**: UNTOUCHED
- **DB/RPC**: UNTOUCHED
- **commit/push/deploy**: UNTOUCHED (0 commit, 0 push, 0 deploy)

---

## 15. Gate

**ADMIN-DASHBOARD-LOADING-SPINNER-STYLE-RESTORATION-1**

=

**PASS — ADMIN LOADING SPINNER STYLE RESTORED**

- **LOADING OWNER**: `AdminShell`
- **DOUBLE LOADER**: STILL FIXED
- **ROUTE LOADER**: STILL REMOVED
- **X AXIS**: CENTERED
- **Y AXIS**: CENTERED
- **SPINNER SIZE**: 44–56px PRESERVED
- **SPINNER STYLE**: ORIGINAL RING/BORDER RESTORED
- **COPY**: `Cargando panel` + `Un momento…` PRESERVED
- **Desktop**: PASS
- **Mobile/tablet**: PASS
- **Shared admin routes smoke**: PASS
- **Dashboard search/Kanban**: REMAINS FIXED
- **Dashboard metrics semantics**: REMAIN FROZEN
- **Workspace Products inline-only**: REMAINS FROZEN
- **Order code block**: REMAINS CLOSED
- **Dashboard overall polish**: OPEN

*No commit. No push. No deploy.*
