# ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-THREE-TRACK-POLISH-1

**Date:** 2026-08-21  
**Type:** TARGETED MOBILE PREPARATION VISUAL POLISH  
**Result:** **PASS WITH REAL-DEVICE QA DEBT**  
**Commit / push / deploy:** NONE

---

## 1. Objective

On narrow mobile, render quantity-enabled preparation options as one operational row:

`label | per-unit | total`

without changing semantics, shell, header, desktop, or other workspace rails.

## 2. Previous mobile geometry

Quantity-enabled used intermediate two-track stack:

```text
Bacon                     ×4 c/u
                          8 total
```

## 3. Product decision

Locked final grammar for rows with both per-unit and operational total:

```text
Bacon          ×4 c/u          8 total
```

## 4. Semantic boundary

Mapper / snapshot / pricing / parent×option math unchanged. Presentation only.

## 5. Consumer audit

| Surface | Impact |
|---|---|
| `OrderPreparationItems` | shared workspace + detail |
| `order-items.module.css` | shared ≤719 rules |
| Strategy | A — intentional shared mobile improvement |

## 6. DOM structure

Existing three children preserved:

`preparationOptionName` · `preparationOptionPerUnit` · `preparationOptionTotal`

Minimal class when both metadata pieces exist: `preparationOptionQuantityEnabled`.

## 7. Three-track CSS

≤719 + `.preparationOptionQuantityEnabled`:

```css
grid-template-columns: minmax(0, 1fr) max-content max-content;
```

Default mobile rows remain `minmax(0,1fr) max-content`.

≤359: slightly tighter gap + metadata `0.72rem` (not speculative fallback away from 3 tracks).

## 8. Simple coverage rows

`Papas grandes | Ambas` — two-track, no empty middle column.

## 9. Simple quantity rows

`Bacon | ×4` — two-track; no fake `c/u` / total.

## 10. V2 quantity-enabled rows

Three-track; `×1 c/u` preserved; totals preserved.

## 11. Long labels

Label column `min-width: 0`; wrap preferred; metadata `nowrap`.

## 12–14. Viewport QA

| Viewport | Result |
|---|---|
| 360 | PASS — Bacon/Cheddar/Huevo same-row 3 tracks; no overflow |
| 390 | PASS — primary visual |
| 430 | PASS — compact metadata (not fragmented) |

## 15. Parent qty >1

`2× BBQ Bacon`: unit price, line total, Ambas, ×4 c/u, 8 total preserved.

## 16. Simple product

`1× Doble Smash`: Bacon/Cheddar `×4` remain two-track.

## 17. Light/dark

Token-based; no color edits. Dark 390 PASS (screenshot). Light inherits same geometry.

## 18. Desktop freeze

1440: preparation groups still 4-track subgrid (`140px 352px …`); panel 1200 / radius 18. **Delta: NONE.**

## 19. Order detail shared impact

Shared ≤719 CSS; intentional improvement; no detail layout damage expected.

## 20. Accessibility

DOM order remains name → per-unit → total; visual matches.

## 21. Console

No workspace boundary / expectedStatus observed during matrix.

## 22. Regression verifies

preparation / pending finalization / WhatsApp / tsc: **PASS**

## 23. Static checks

build / lint / diff-check: see gate run (lint = known ESLint 9 circular JSON only).

## 24. P0–P3

P0/P1/P2: none · P3: real Android NOT EXECUTED (accepted debt)

## 25. Files changed

- `order-preparation-items.tsx` — quantity-enabled class only
- `order-items.module.css` — mobile three-track
- docs

Shell/header/overview CSS: **NOT touched**.

## 26. Gate

```text
ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-THREE-TRACK-POLISH-1
= PASS WITH REAL-DEVICE QA DEBT

DESKTOP WORKSPACE: REMAINS FROZEN
MOBILE WORKSPACE: FROZEN
Dashboard overall polish: OPEN

No commit. No push. No deploy.
```

## Numeric gutter follow-up — 2026-08-21

Three-track architecture preserved (`label | per-unit | total`). Visual separation between per-unit and operational-total increased via asymmetric `margin-left` on the total track (mobile ≤719 only). No semantic, mapper, pricing, or desktop change.

Reference: `docs/admin-order-workspace-mobile-preparation-quantity-numeric-gutter-visual-fix-1.md`  
Phase: **ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-NUMERIC-GUTTER-VISUAL-FIX-1**
