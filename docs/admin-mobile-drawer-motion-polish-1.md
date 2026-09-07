# Admin Mobile Drawer Motion Polish 1

## 1. Objective

Add a subtle, premium, reversible open/close motion to the admin mobile drawer: sheet enters from the right, exits to the right; backdrop fades; width/scrim/blur and a11y stay frozen.

## 2. Current issue

After width + backdrop polish, open/close still mounted/unmounted instantly (`isOpen` gated portal), so the sheet appeared/disappeared abruptly.

## 3. Product decision

- CSS `transform` on the sheet (X axis only) + overlay `opacity` fade.
- Minimal TSX delayed unmount (`closed` → `open` → `closing` → unmount).
- Open ~240ms, close ~180ms, `cubic-bezier(0.22, 1, 0.36, 1)`.
- No bounce/spring/scale; no width/left/right animation; no blur animation; no new deps.

## 4. Source ownership

| Surface | Owner |
| ------- | ----- |
| Drawer TSX | `components/admin/admin-mobile-drawer.tsx` |
| Drawer CSS | `components/admin/admin-mobile-drawer.css` |
| Portal / overlay / sheet | siblings in portal; `data-state` on portal |
| Desktop sidebar / shell | untouched |

## 5. Implementation summary

- TSX: `isRendered` + `motionState` (`closed` \| `open` \| `closing`); double rAF to enter `open`; close timeout `DRAWER_CLOSE_MS` (200); timer cleanup; reopen during closing cancels exit.
- CSS: `translate3d(calc(100% + 12px), 0, 0)` ↔ `translate3d(0,0,0)`; overlay opacity 0↔1; reduced-motion 1ms.
- Preserved width, rgba scrims, `blur(2px)`, Escape, focus trap/return, scroll-lock class, dialog semantics.

## 6. Motion behavior

Portal `data-state` drives sheet transform and overlay opacity. Portal itself never gets opacity.

## 7. Opening animation

Start off-screen right → end at approved position; ~240ms ease-out.

## 8. Closing animation

Approved position → off-screen right; ~180ms; unmount after timeout.

## 9. Backdrop fade

Overlay opacity 0 ↔ 1; background rgba tokens unchanged; blur constant `2px`.

## 10. Reduced motion

`@media (prefers-reduced-motion: reduce)` forces 1ms transitions.

## 11. Interaction/a11y preservation

Overlay/X/Escape/nav close; focus trap while open; focus return after unmount; scroll lock while rendered; `inert` on sheet while closing; `aria-expanded` while open/closing.

## 12. Runtime QA

Authenticated QA (`localhost:3000`, La Burguesía):

| Check | Result |
| ----- | ------ |
| 412 dark open settle | `data-state=open`, transform identity, overlay opacity 1, width 321 |
| Close X / Escape / overlay | `closing` then unmount; body scroll-lock cleared |
| Reopen during closing | recovers to `open` |
| 412 light | scrim `rgba(15,23,42,0.48)`, open transform identity |
| Focus return | menu button focused after close |
| 1024 desktop | portal/menu hidden; sidebar intact |
| Width / backdrop / blur | unchanged from prior D1 phases |

## 13. Verifies

```bash
npx tsx lib/orders/admin-mobile-drawer-motion.verify.ts  # PASS
npx tsx lib/orders/admin-mobile-drawer-backdrop-focus.verify.ts  # PASS
npx tsx lib/orders/admin-mobile-drawer-width-density.verify.ts  # PASS
# + toolbar / terminal / search-Kanban / metrics / order_code / display-ref PASS
```

## 14. Static checks

- `tsc --noEmit` PASS
- `git diff --check` PASS
- `npm run build` PASS
- `npm run lint` → known ESLint 9 circular JSON debt only

## 15. Lint evidence

- Executed: `npm run lint`
- Exact: ESLint 9.39.4 `TypeError: Converting circular structure to JSON`
- Known tooling debt only

## 16. Files changed

- `components/admin/admin-mobile-drawer.tsx`
- `components/admin/admin-mobile-drawer.css`
- `lib/orders/admin-mobile-drawer-motion.verify.ts`
- Docs: this file, CURRENT_PHASE, living audit, living memory, audit follow-up

## 17. P0–P3 findings

- **P0–P1:** none
- **P2:** none
- **P3:** enter frame briefly uses `data-state="closed"` before open (intentional for CSS transition)

## 18. Hard boundaries

Width/backdrop/blur frozen; no desktop sidebar/shell/dashboard/toolbar/footer/globals/theme/DB; no commit/push/deploy.

## 19. Gate

`ADMIN-MOBILE-DRAWER-MOTION-POLISH-1` — **PASS — ADMIN MOBILE DRAWER MOTION POLISHED**

- D1 width / backdrop / motion: **IMPLEMENTED / FROZEN**
