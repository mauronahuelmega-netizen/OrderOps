# Admin Mobile Drawer Backdrop Focus Polish 1

## 1. Objective

Strengthen the admin mobile drawer backdrop/scrim so the compact drawer remains the clear focus while the dashboard behind stays contextual but subordinate.

## 2. Current issue

After `ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1`, more dashboard remains visible behind the sheet. The previous overlay treatment was too weak on mobile:

- Overlay tokens lived on `.admin-mobile-drawer` while the overlay is a **sibling** inside the portal, so `--drawer-overlay` often failed to resolve on the backdrop.
- Mobile ≤768 already disabled `backdrop-filter`, leaving an effectively transparent scrim.
- Tablet still used heavy `blur(8px)` (forbidden by this phase’s blur policy).

Result: metrics/cards behind competed with the drawer for attention.

## 3. Product decision

- Strengthen **backdrop color/opacity only** (no width change, no dashboard/shell edits).
- Light: `rgba(15, 23, 42, 0.48)` (within 0.38–0.48; max after visual QA).
- Dark: `rgba(2, 6, 23, 0.64)` (within 0.56–0.64; max after visual QA).
- Prefer opacity/color over blur; after max approved scrim still left metric text competitive in QA, apply documented minimal `blur(2px)` (≤2px; prior `blur(8px)` removed).
- Never apply `opacity` to portal/root (would dim the drawer).

## 4. Source ownership

| Surface | Owner |
| ------- | ----- |
| Drawer TSX | `components/admin/admin-mobile-drawer.tsx` (portal + overlay button + sheet) |
| Drawer CSS | `components/admin/admin-mobile-drawer.css` |
| Backdrop element | `.admin-mobile-drawer-overlay` (sibling of `.admin-mobile-drawer`) |
| Desktop sidebar | `admin-sidebar.*` — untouched |
| AdminShell | `admin-shell.*` — untouched |

## 5. Implementation summary

- Moved `--drawer-overlay` to `.admin-mobile-drawer-portal` so the sibling overlay resolves it.
- Theme-aware dark override via `.dark` / `html[data-dashboard-theme="dark"]`.
- Explicit light/dark rgba scrims at max approved range after visual QA.
- Removed heavy `blur(8px)`; documented minimal `blur(2px)` after opacity alone was insufficient.
- Explicit stacking: overlay `z-index: 0`, sheet `z-index: 1` inside portal `z-index: 60`.
- Width tokens unchanged (`min(78vw, 340px)` / tablet `min(78vw, 360px)`).
- TSX untouched.

## 6. Backdrop/scrim behavior

| Item | Behavior |
| ---- | -------- |
| Element | Separate full-bleed `.admin-mobile-drawer-overlay` button |
| Background | `var(--drawer-overlay)` from portal |
| Click | Closes drawer (existing handler) |
| Blur | documented `blur(2px)` only (≤2px; opacity primary) |
| Portal opacity | never applied |

## 7. Light/dark visual treatment

- Light: slate scrim `rgba(15, 23, 42, 0.48)` — dashboard recognizable, not comfortably readable.
- Dark: near-navy scrim `rgba(2, 6, 23, 0.64)` — cards/typography subordinated without flattening the sheet.
- Assist: documented `blur(2px)` after max opacity still left metric text competitive in first QA pass.

## 8. Width preservation

Unchanged:

```css
--drawer-width: min(78vw, 340px);
```

Tablet 768–899: `min(78vw, 360px)`.

## 9. Interaction/a11y preservation

Preserved: backdrop click close, X close, Escape, focus trap, focus return, scroll lock, theme toggle, logout, nav, z-order drawer > backdrop > dashboard.

## 10. Runtime QA

Authenticated QA on `localhost:3000` (La Burguesía):

| Viewport | Overlay | Width | Notes |
| -------- | ------- | ----- | ----- |
| 360–430 dark | `rgba(2,6,23,0.64)` + `blur(2px)` | compact 78vw/340 | drawer focus; Escape/overlay/X close |
| 719–768 dark | same tokens | 340 / 360 tablet | PASS |
| 390/412 light | `rgba(15,23,42,0.48)` + `blur(2px)` | unchanged | PASS |
| 1024/1440 | portal/menu `display:none` | n/a | desktop sidebar intact |

Smokes: `/admin/products` (drawer opens), `/admin/settings`, `/admin/orders/[id]` prior phase id — interactions preserved. Console clean.

## 11. Verifies

```bash
npx tsx lib/orders/admin-mobile-drawer-backdrop-focus.verify.ts  # PASS
npx tsx lib/orders/admin-mobile-drawer-width-density.verify.ts  # PASS
# + toolbar / terminal / search-Kanban / metrics / order_code / display-ref (prior PASS)
```

## 12. Static checks

- `tsc --noEmit` PASS
- `git diff --check` PASS
- `npm run build` PASS
- `npm run lint` → known ESLint 9 circular JSON debt only

## 13. Lint evidence

- Executed: `npm run lint`
- Exact: ESLint 9.39.4 `TypeError: Converting circular structure to JSON`
- Known tooling debt only

## 14. Files changed

- `components/admin/admin-mobile-drawer.css`
- `lib/orders/admin-mobile-drawer-backdrop-focus.verify.ts`
- Docs: this file, CURRENT_PHASE, living audit, living memory, audit follow-up

## 15. P0–P3 findings

- **P0–P1:** none
- **P2:** none
- **P3:** dashboard remains faintly recognizable through max approved scrim (intentional context); portal `overflow: visible` to allow blur sampling

## 16. Hard boundaries

No drawer width change; no desktop sidebar; no AdminShell layout; no dashboard/toolbar/Kanban/metrics/footer/manual modal; no globals/theme tokens; no DB/RPC/realtime; no commit/push/deploy.

## 17. Gate

`ADMIN-MOBILE-DRAWER-BACKDROP-FOCUS-POLISH-1` — **PASS — ADMIN MOBILE DRAWER BACKDROP FOCUS POLISHED**

- D1 width: **IMPLEMENTED / FROZEN**
- D1 backdrop focus: **IMPLEMENTED / FROZEN**
- Width: **UNCHANGED / COMPACT** (`min(78vw, 340px)`)
