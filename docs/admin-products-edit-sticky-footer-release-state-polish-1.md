# ADMIN-PRODUCTS-EDIT-STICKY-FOOTER-RELEASE-STATE-POLISH-1

## Result

**PASS** — Edit sticky footer release-state remnant under flyout header closed.

## Visual Finding

Owner-observed thin rounded blue horizontal remnant immediately below the Edit flyout header when scrolling into **Ajustes propios de este producto**.

Measured owner (with temporary scroll-room pad for tall customization):
- Element: `.admin-primary-button` (“Guardar cambios”)
- Color: `rgb(37, 99, 235)`
- Radius: `14px`
- Geometry: sticky `.editActions` released from `bottom: 0` and scrolling out the top of `.body`, leaving a clipped CTA capsule at the header seam

Pixel sample after fix (412 dark, classic thin-remnant scroll): **0 blue pixels** on seam rows y=70–120.

## Root Cause

**CASE A** (+ seam stacking): sticky footer/CTA remains partially visible after leaving its sticky range as it exits through the top of the flyout `.body` scrollport. The bright rounded CTA reads as a blue capsule remnant under the header.

Scroll-driven `animation-timeline: view()` on sticky chrome was tried and rejected — cover/exit progress does not advance usefully while sticky, so opacity stayed `1` at remnant frames.

## Before

| state | notes |
|-------|--------|
| MID | sticky footer at body bottom; CTA 48px fully visible |
| END | sticky releases with form; no trailing shell strip |
| CUSTOMIZATION ENTERED (thin remnant frame) | CTA straddles header seam; ~14–21px blue capsule visible under header |

## Fix

**Edit-only flyout header release lip** (feature-local CSS + mode class hook):

- `flyout-panel.tsx`: apply `headerReleaseClip` + `bodyReleaseClip` only when `flyoutMode === "edit"`
- `flyout-panel.module.css`:
  - `.headerReleaseClip::after` — opaque `var(--bg-surface)` lip `height: 32px` below header seam (covers measured remnant depth)
  - `.bodyReleaseClip` — `padding-top: 32px` so first paint clears the lip
- Create / category flyouts keep default header/body (Create frozen)

Why smallest owner: remnant is painted at the flyout header/body seam; product-form sticky alone cannot clip pixels once they exit `.body` top. No JS scroll observation. Customization panel internals untouched.

## After

| state | notes |
|-------|--------|
| MID | sticky + full-bleed + CTA 48; footerToBodyBottom ≈ 0 |
| END | no trailing strip; sticky still valid on base form |
| CUSTOMIZATION ENTERED (thin remnant frames) | `visibleCtaBelowLip = 0` for all frames with belowSeam &lt; 28px |
| SCROLL BACK UP | sticky footer restores at bottom; no permanent hide |

**visible blue remnant under header = 0** (pixel-proven)

## Footer Contract

sticky · full-bleed · CTA inset/full-width · safe-area · 100dvh · single `.body` scroll — **preserved**

## Dirty / Create / Customization Guards

| contract | status |
|----------|--------|
| Dirty-state UX | FROZEN / PRESERVED |
| Create mobile | FROZEN / no release-clip classes |
| Image KEEP/REMOVE/REPLACE | UNCHANGED |
| Customization panel internals | UNCHANGED |
| Stock / availability domain | UNCHANGED |

## Runtime QA

| viewport | result |
|----------|--------|
| 412 dark (primary) | PASS — remnant 0 |
| 390 | smoke PASS (same clip) |
| 360 / 899 / ≥961 | contract preserved (lip Edit-only; desktop CTA intrinsic unchanged) |
| overflow-x | 0 |

## Data Safety

products created/updated · availability · stock · Storage · customizations · orders: **0**  
DB/RLS/migrations: **unchanged** · Save not pressed

## Verification

| check | result |
|-------|--------|
| focused `admin-products-edit-sticky-footer-release-state-polish.verify.ts` | PASS |
| edit simple mobile visual parity | PASS |
| edit dirty state | PASS |
| flyout interaction | PASS |
| Create sticky footer end-state | PASS |
| Create required affordance | PASS |
| mutation probe (lip height → 0 → FAIL; restore → PASS) | PASS |
| `npx tsc --noEmit` | PASS |
| `git diff --check` (scoped) | PASS |
| full build / lint | NOT RUN (out of scope) |

## Runtime Scope

Permanent runtime files touched this phase:
- `components/admin/products/flyout-panel.tsx`
- `components/admin/products/flyout-panel.module.css`

Verify + docs:
- `lib/products/admin-products-edit-sticky-footer-release-state-polish.verify.ts`
- `docs/admin-products-edit-sticky-footer-release-state-polish-1.md`
- `docs/CURRENT_PHASE.md` · `docs/products-living-audit.md` · `ORDEROPS_LIVING_MEMORY.md`

## Historical note

`ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1` remains historically **PASS**. This microphase closes a residual owner-observed release-state visual artifact at the header seam.

## Decision

**EDIT BASE FORM: FINAL CLOSED / FROZEN**  
**NEXT:** `ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1`  
**THEN:** PRODUCT REMOVAL DECISION PHASE  
**COMMIT/PUSH/DEPLOY:** PAUSED
