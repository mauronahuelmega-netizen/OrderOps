# PUBLIC-CATALOG-NAV-DRAWER-VISUAL-POLISH-1

## Estado

```text
PASS — ANDROID REAL-DEVICE QA COMPLETE
```

**Fecha:** 2026-08-15
**Commit / push / deploy:** closeout with tenant footer
**Base audit:** `docs/public-catalog-chrome-drawer-footer-audit-1.md`

---

## Objetivo

Convertir el menú público de card flotante a side-sheet flush-right full-height, left radii only, safe-area interna. CSS-only. Footer no incluido en esta microfase.

---

## Preflight

| Selector | Owner |
|----------|-------|
| `.public-business-header__portal` | `fixed; inset: 0; z-index: 34` |
| `.public-business-header__overlay` | full portal; click-to-close |
| `.public-business-header__sheet` | geometry (cascada: base → compact override → MQ ≥768) |
| open | `.portal--open .sheet { transform: translateX(0) }` |
| `.sheet-stack` | internal scroll — untouched |
| Desktop MQ | `@media (min-width: 768px)` — updated same phase |

**Archivo modificado:** `app/globals.css` only (runtime TSX untouched).

---

## Geometry final

| Property | Value |
|----------|-------|
| `top` | `0` |
| `right` | `0` |
| `bottom` | `0` |
| `left` | `auto` |
| `width` | `min(82vw, 348px)` |
| `border-radius` | `22px 0 0 22px` |
| external margins | **0** |
| `min-height` / `max-height` dvh | removed / neutralized (`min-height: 0`; `max-height: none`) |

Height derives from top+bottom pin inside fixed portal.

---

## Safe area

**Before:** `top/right/bottom: max(10px, env(safe-area-inset-*))` — panel floated inward.
**After:** panel flush; padding:

```css
padding-top: max(14px, env(safe-area-inset-top));
padding-right: max(14px, env(safe-area-inset-right));
padding-bottom: max(14px, env(safe-area-inset-bottom));
padding-left: 14px;
```

Principle: SAFE AREA = CONTENT PADDING, not panel margin.

---

## Motion

| State | Transform |
|-------|-----------|
| Closed | `translateX(100%)` (was `calc(100% + 22px)`) |
| Open | `translateX(0)` |

Timings/easing **unchanged:** `260ms cubic-bezier(0.22, 1, 0.36, 1)`.

---

## Accessibility

| Gate | Status |
|------|--------|
| dialog semantics | YES — TSX unchanged |
| focus trap | YES |
| Escape | YES |
| focus return | YES |
| scroll lock | YES — hook untouched |
| focus-visible | YES — not degraded |

---

## Responsive (CSS expected)

| Viewport | Width ≈ |
|----------|---------|
| 360 | ~295px |
| 390 | ~320px |
| 412 | ~338px |
| ≥768 | same formula, flush-right (no 420px card) |

---

## Android Chrome

**PASS** — product owner, Android Chrome real device (2026-08-15). Flush-right full-height; left radii only; open/close/backdrop/theme/Staff OK.

---

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **PASS** (closeout) |
| `git diff --check` | **PASS** (closeout) |
| `npm run build` | **PASS** (closeout) |
| `npm run lint` | **KNOWN DEBT** — ESLint 9 circular JSON (`plugins.react`) |

---

## Out of scope

Footer · ProductCard · categories · modals · checkout · DB · content redesign · theme tokens · backdrop redesign.
