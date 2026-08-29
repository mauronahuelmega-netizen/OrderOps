# ADMIN-ORDER-WORKSPACE-PREPARATION-NUMERIC-DENSITY-VISUAL-POLISH-1

**Date:** 2026-08-19  
**Status:** PASS WITH VISUAL QA DEBT  
**Scope:** Presentation-only — body numeric density and tabular alignment

---

## 1. Problem

Authenticated QA after header/body track fixes showed residual body P2:

- Operational columns felt too dispersed (option track absorbed spare card width)
- Numeric quantities (`×4`, `×1`, `8`, `2`) lacked stable digit alignment
- Option names and per-unit/total meta read detached across wide cards

Header and semantics were correct. Only body geometry/typography needed refinement.

---

## 2. QA evidence

Real order (parent qty=2 + qty=1): body `×N c/u` / `N total` separation acceptable, but rows like:

```text
Agregados extra    Bacon                     ×4 c/u     8 total
```

felt horizontally stretched. Digit columns appeared ragged without tabular numerals.

---

## 3. Density strategy

**COMPACT OPERATIONAL MATRIX, NOT FULL-WIDTH JUSTIFICATION**

- Preserve four semantic tracks: GROUP | OPTION | PER UNIT | TOTAL/COVERAGE
- Replace elastic option track `minmax(0, 1fr)` with capped `minmax(0, 22rem)`
- Per-unit/total tracks: `max-content` only
- Grid `justify-content: start` — spare card width remains acceptable on the right
- Column gap refined to `0.85rem` (per-unit ↔ total still clearly separated)

---

## 4. Tabular numerals

Mechanism: `font-variant-numeric: tabular-nums` via `.preparationNumeric`

Scope: operational quantity digits in body per-unit and total spans only

- `×{N} c/u` — digit tabular; `×` and ` c/u` normal
- `{N} total` — digit tabular; ` total` normal
- `Ambas` — no numeric styling

No new font. No monospace UI.

---

## 5. Numeric markup

Refactored option display to structured VM (not string parsing):

- `perUnit: { quantity, showCu } | { quantity, simple } | null`
- `total: { kind: operational | ambas | standard, quantity? } | null`

Rendered with `<span className={preparationNumeric}>{quantity}</span>` using existing numeric values.

---

## 6. Body track refinement

| Track | Before | After |
|-------|--------|-------|
| Group | `minmax(6.75rem, 8.75rem)` | unchanged |
| Option | `minmax(0, 1fr)` | `minmax(0, 22rem)` |
| Per-unit | `minmax(5.5rem, max-content)` | `max-content` |
| Total | `minmax(4.75rem, max-content)` | `max-content` |
| Gap | `1rem` | `0.85rem` |

Subgrid alignment model preserved.

---

## 7. Option-track max/fitted behavior

Option column wraps long names within 22rem cap. Does not stretch to card edge. Numeric zone sits closer to option content.

---

## 8. Per-unit/total spacing

Explicit grid gap maintained. No glued `×4 c/u8 total`. No per-row margin hacks.

---

## 9. Standard rows / Ambas

`Ambas` remains terminal coverage track, text-only, right-aligned. Standard `N total` uses tabular digit + ` total` suffix.

---

## 10. Responsive

| Viewport | Behavior |
|----------|----------|
| ≥720px | Denser 4-track body grid |
| <720px | Stacked body unchanged; tabular numerals active |

Header responsive rules untouched.

---

## 11. Header freeze

No header grid, markup, or geometry changes in this phase.

---

## 12. Modal ratio freeze

Modal ~60/40 information/operations split unchanged. No shell/layout edits.

---

## 13. Real QA

| Check | Status |
|-------|--------|
| Real order structural | CSS/VM verified |
| Light theme | pending authenticated |
| Dark theme | pending authenticated |
| Card still too wide after compacting | **Reduced internally**; outer card width unchanged; modal ratio follow-up **not required yet** (document as optional P3 if still perceived wide after auth QA) |

---

## 14. Checks

| Check | Result |
|-------|--------|
| `order-preparation.verify.ts` | PASS |
| `tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | known ESLint 9 circular JSON |

---

## 15. Findings (P0–P3)

| Severity | Finding |
|----------|---------|
| P0 | None |
| P1 | None |
| P2 body density/numeric raggedness | **CLOSED** (in code) |
| P2 | Authenticated viewport matrix pending |
| P3 | Modal 60/40 may still feel wide — optional future follow-up only |

---

## 16. Remaining modal width assessment

Internal body matrix is now compact-left. Outer product card still fills the left rail. If authenticated QA still finds the card excessively wide, recommend separate `MODAL RAIL RATIO POLISH` phase — not in scope here.

---

## 17. Gate

**ADMIN-ORDER-WORKSPACE-PREPARATION-NUMERIC-DENSITY-VISUAL-POLISH-1** = **PASS WITH VISUAL QA DEBT**

---

## Follow-up

**ADMIN-ORDER-WORKSPACE-INDEPENDENT-RAILS-LAYOUT-FIX-1** (2026-08-19)

Reason: Products body reached acceptable density, but real QA exposed parent workspace vertical coupling — long left Products pushed right-side operational controls downward. See `docs/admin-order-workspace-independent-rails-layout-fix-1.md`.

---

## Files changed

| File | Change |
|------|--------|
| `components/admin/orders/order-items.module.css` | Denser body tracks, tabular numeric class, justify-start |
| `components/admin/orders/order-preparation-items.tsx` | Structured numeric spans from VM values |
