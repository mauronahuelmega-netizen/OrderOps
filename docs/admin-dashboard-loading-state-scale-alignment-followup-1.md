# Admin Dashboard Loading State Scale Alignment Follow-Up

## 1. Objective

Refine the admin dashboard (`/admin/dashboard`) loading state scale, copy hierarchy, and visual centering so it achieves the same quiet, designed, premium SaaS feel as the public catalog loading state ("Preparando opciones" / "Un momento…").

---

## 2. Previous Issue

In `ADMIN-DASHBOARD-LOADING-STATE-CENTERING-POLISH-1`, the loading copy was updated from `Cargando configuración...` to `Cargando panel…` within `AdminShell`. However:
- The spinner remained small (28px).
- The text presentation was single-line and felt like a technical fallback rather than an intentional, designed screen.
- The block did not possess the visual prominence and structure of the public catalog loading state.

---

## 3. Public Catalog Reference

In `components/public/catalog/customization-modal.tsx` and its CSS module:
- Spinner: Prominent circular conic-gradient mask spinner (scaled between 44px and 56px).
- Copy Hierarchy: Bold primary title (`Preparando opciones`) paired with a muted, smaller subtitle (`Un momento…`).
- Centering: Fully centered horizontally and vertically with generous padding and clean typography.

---

## 4. Source Ownership & Audit Table

| Concern | File | Current behavior | Target behavior | Change needed |
| :--- | :--- | :--- | :--- | :--- |
| Dashboard loading owner | `app/admin/(protected)/dashboard/loading.tsx` | Did not exist (relied on `AdminShell` fallback) | Route-specific Next.js loading surface | Create dedicated `loading.tsx` |
| Spinner size | `app/admin/(protected)/dashboard/dashboard-loading.module.css` | 28px (small fallback) | `clamp(44px, 11vw, 56px)` | Scale to protagonist dimension |
| Vertical centering | `dashboard-loading.module.css` | Full window center | Centered in available content area (`clamp(340px, 65vh, 75dvh)`) | Apply flex center + safe bounds |
| Copy hierarchy | `loading.tsx` + `dashboard-loading.module.css` | Single line | Title: `Cargando panel` (bold) + Subtitle: `Un momento…` (muted) | Implement two-tier typography |
| Theme support | `dashboard-loading.module.css` | Tokenized | Semantic tokens (`--text-primary`, `--text-tertiary`) | Dark/light contrast preserved |
| Mobile behavior | `dashboard-loading.module.css` | Fixed | Fluid scaling with CSS `clamp()` | Zero clipping or overflow |

---

## 5. Implementation Summary

1. **Created Route-Specific Loading Component**:
   - `app/admin/(protected)/dashboard/loading.tsx`: Renders structured `<section className={styles.dashboardLoading} role="status" aria-live="polite" aria-busy="true">` containing the scaled spinner, bold title `Cargando panel`, and secondary hint `Un momento…`.
2. **Created Route-Specific CSS Module**:
   - `app/admin/(protected)/dashboard/dashboard-loading.module.css`:
     - Container: `display: flex; flex: 1 1 auto; align-items: center; justify-content: center; min-height: clamp(340px, 65vh, 75dvh); width: 100%;`.
     - Spinner: `clamp(44px, 11vw, 56px)` with conic gradient mask animation and reduced-motion fallback.
     - Title: `color: var(--text-primary); font-size: clamp(0.95rem, 2.6vw, 1.08rem); font-weight: 700;`.
     - Subtitle: `color: var(--text-tertiary); font-size: clamp(0.78rem, 2.2vw, 0.88rem);`.
3. **Verified Source Contracts**:
   - `lib/orders/dashboard-loading-state.verify.ts` updated to validate route-specific loading presence, copy accuracy, accessibility attributes, and shell boundary integrity.

---

## 6. Scale & Spinner Adjustment

- **Scale**: `width: clamp(44px, 11vw, 56px); height: clamp(44px, 11vw, 56px);` ensuring it is prominent on desktop (56px) and well-proportioned on small mobile viewports (44px).
- **Mask Technique**: Conic-gradient with radial mask matches the refined aesthetic of the public catalog without external dependencies.

---

## 7. Copy Hierarchy

- **Main Title**: `Cargando panel` (font-weight: 700, primary text color, no trailing ellipsis).
- **Subtitle**: `Un momento…` (muted text tertiary color, subtle typography, trailing ellipsis).

---

## 8. Centering Strategy

- `.dashboardLoading` utilizes `display: flex; align-items: center; justify-content: center; min-height: clamp(340px, 65vh, 75dvh); margin: 0 auto;`.
- Sits squarely in the center of the viewport across all devices, eliminating top-bias without causing scrollbars or layout jumping.

---

## 9. Accessibility

- `role="status"` on the container section.
- `aria-live="polite"` and `aria-busy="true"`.
- `aria-hidden="true"` on the animated spinner.
- Fully readable text in light and dark themes with high contrast ratios.
- `@media (prefers-reduced-motion: reduce)` dampens the spin cycle to a slower 1.5s pace.

---

## 10. Runtime QA

- **Desktop 1440px / 1024px (Light & Dark)**: Centered vertically and horizontally; spinner scaled to 56px; title and subtitle clearly separated; tokenized canvas background.
- **Mobile 390px, 412px (S20 Ultra), 430px, 719px**: Spinner fluidly scales to ~44px; centered in viewport; 0 horizontal overflow; no clipping by mobile navigation.
- **Tablet 720px / 768px**: Centered; no scrollbars.
- **Console Errors**: 0 errors.

---

## 11. Verify

- `lib/orders/dashboard-loading-state.verify.ts`: **PASS**
  - Confirms route-specific `loading.tsx` exists.
  - Confirms forbidden tokens (`Cargando configuración`, `Cargando panel...`) are absent.
  - Confirms required copy (`Cargando panel`, `Un momento…`) is present.
  - Confirms accessibility attributes (`role="status"`, `aria-live="polite"`, `aria-hidden="true"`).
  - Confirms scaled spinner and module styles.
  - Confirms `AdminPageLayout`, `globals.css`, and `theme-tokens.css` remain untouched.

---

## 12. Static Checks

- **TypeScript compilation (`tsc`)**: PASS
- **Diff Check**: PASS (strictly isolated to dashboard route loading and verify files)
- **Build**: PASS

---

## 13. Lint Evidence

- Executed against workspace rules.
- 0 new linter warnings or errors introduced.
- Known ESLint 9 circular JSON debt baseline noted.

---

## 14. Files Changed

- **Runtime Created**:
  - `app/admin/(protected)/dashboard/loading.tsx`
- **CSS Created**:
  - `app/admin/(protected)/dashboard/dashboard-loading.module.css`
- **Verify Updated**:
  - `lib/orders/dashboard-loading-state.verify.ts`
- **Docs**:
  - `docs/admin-dashboard-loading-state-scale-alignment-followup-1.md`
  - `docs/CURRENT_PHASE.md`
  - `docs/admin-dashboard-forensic-living-audit.md`
  - `ORDEROPS_LIVING_MEMORY.md`

---

## 15. P0–P3 Findings

- **P0**: None. Dashboard route resolves seamlessly after loading.
- **P1**: None. Scale, centering, and copy hierarchy fully aligned with target.
- **P2**: None.
- **P3**: None.

---

## 16. Hard Boundaries

- DB / SQL / migrations: **UNTOUCHED**
- RPC / `create_order`: **UNTOUCHED**
- Dashboard data loaders / realtime: **UNTOUCHED**
- Dashboard search / Kanban: **UNTOUCHED**
- Dashboard metrics semantics: **UNTOUCHED**
- Dashboard card root count: **UNTOUCHED**
- Workspace Products inline-only: **UNTOUCHED**
- Order code block: **UNTOUCHED**
- Public catalog: **UNTOUCHED**
- Global CSS / theme tokens: **UNTOUCHED**
- `AdminShell` / `AdminPageLayout`: **UNTOUCHED**
- Commit / push / deploy: **UNTOUCHED (NO COMMIT / NO PUSH / NO DEPLOY)**

---

## 17. Gate

**ADMIN-DASHBOARD-LOADING-STATE-SCALE-ALIGNMENT-FOLLOWUP-1: PASS — DASHBOARD LOADING STATE SCALE ALIGNED**
