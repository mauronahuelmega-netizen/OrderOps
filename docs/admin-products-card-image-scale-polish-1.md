# ADMIN-PRODUCTS-CARD-IMAGE-SCALE-POLISH-1

## Result

**READY FOR HUMAN VISUAL ACCEPTANCE** (2026-09-09)

## Problem

Initial fixed-px attempt (**88 / 96 / 48**) left thumbs visually undersized vs card/row height.

## Initial attempt

**REJECTED BY HUMAN VISUAL REVIEW**

| viewport | image | occupancy (approx) |
|----------|-------|--------------------|
| 390 | 88×88 | ~74% |
| 899 | 96×96 | ~82% |
| desktop | 48×48 | ~68% (row 71) |

## Follow-up strategy

- **Mobile:** height-derived square — `align-self: stretch` + `height: 100%` + `width: auto` + `aspect-ratio: 1 / 1` + `max-*: 7.5rem` ceiling. Content column drives height; media matches. Shell fills frame via `position: absolute; inset: 0`.
- **Desktop:** `60×60` inside existing row by reclaiming **FOTO-cell-only** vertical padding (`.table td.photoCell { padding-block: 0.25rem }`) — do not grow the table.

## Measurements (follow-up)

| surface | container usable H | image before | image now | occupancy |
|---------|--------------------|--------------|-----------|-----------|
| 390 card | inner 116.8 | 88 | **116.8×116.8** | **100% inner** (outer card H 118.8 unchanged) |
| 899 card | inner 115.5 | 96 | **115.5×115.5** | **100% inner** (outer 117.5 unchanged · 2 cols) |
| desktop row | row 69 · photo usable 61 | 48 | **60×60** | **87% row · 98% photo usable** |

Desktop row: **71 → 69** (not taller). Aspect Δ ≤ 1px. Fit: cover.

## Implementation

**mobile sizing strategy:** height-derived square from content track  
**desktop sizing strategy:** 60px square + FOTO-cell inset reclaim  
**aspect:** 1 / 1  
**fit:** cover  
**files:** `product-card.module.css`, `product-table-view.module.css`

## Runtime

**390:** height-derived full-bleed square · metadata/toggle intact · no overflow  
**899:** same · 2 columns preserved  
**desktop:** materially larger thumb · row not taller

## Verification

**targeted:** PASS  
**tsc:** (run at candidate close)  
**diff:** (run at candidate close)

## Boundaries

No TSX · no pipeline · no public · no hook/pagination · mutations 0

## Final status

**READY FOR HUMAN VISUAL ACCEPTANCE**

Not FROZEN. Human owner closes this phase.

## Next

**HUMAN VISUAL REVIEW** → after accept: **ADMIN-PRODUCTS-FLYOUT-FORM-INTERACTION-POLISH-1**
