# ADMIN-PRODUCTS-FILTER-MENU-HARD-VISUAL-CLOSEOUT-1

## Result

**PASS — PRODUCT FILTER MENU VISUAL CLOSEOUT COMPLETE / ONE-TAP HANDOFF CERTIFIED / FILTER FAMILY FROZEN / CATEGORY ORDER FINAL QA NEXT**

## Trigger

Owner Android QA accepted the compact filter family architecture. Remaining visual debt:

1. “Ordenar categorías” read muted / almost disabled
2. Trailing-action vertical rhythm slightly tall/loose
3. Compact menu edge needed microscopic border/contact-shadow against white catalog surfaces

Plus mandatory 6/6 one-tap handoff certification.

## Scope

CSS-only polish on `compact-products-filter-menu.module.css`. No filter redesign, no Category Order changes, no DB/action/RPC, no real Save.

## Owner Android Visual Baseline

Accepted: closed triggers, alignment, open-trigger surface, chevron, option typography, selected soft-blue + left accent, radii, Stock/Estado density, Category width, start/end anchors, no checkmarks, no decorative icons.

## Frozen Filter Architecture

Category / Stock / Estado = compact menus · single toolbar `openFilter` · one-tap handoff · Category trailing Ordenar → order-only dialog · Subir/Bajar only · URL/server filtering unchanged.

## Source Ownership

| Concern | Owner |
|--------|--------|
| Trailing foreground / weight / height | `.trailingAction` |
| Separator rhythm | `.trailingRegion` |
| Menu border / shadow | `.menuShell` |
| Open state | `products-toolbar.tsx` `openFilter` (untouched) |

## Trailing Action Baseline

Before: `color: var(--text-secondary)`; weight 600; region `margin-top/padding-top: 0.375rem`.

## Trailing Action Contrast

After: `color: var(--text-primary)`; `font-weight: 500` (same family as options). Available secondary — not disabled, not primary CTA. Runtime computed light `rgb(9,9,11)` / dark `rgb(248,250,252)`.

## Trailing Action Rhythm

Region: `margin-top: 0.125rem`; `padding-top: 0.25rem`. Action `min-height: 2.75rem` (44px). Same horizontal inset as options (`0.75rem` / mobile `0.625rem`).

## Separator

Preserved `border-top: 1px solid var(--border-subtle)`. No section label.

## Popup Edge Definition

Border: `1px solid color-mix(... border-subtle 82%, text-primary 18%)`.  
Shadow: `var(--shadow-sm), var(--shadow-floating)` (contact + soft elevation). Not a new elevation tier.

## Filtered Closed State

Unchanged: applied filter labels via trigger text; open surface only while menu open (`filterSelectActive` for value presence preserved as prior contract).

## Pixel Alignment

412: trigger tops/bottoms/heights aligned (44px). Gaps equal flex thirds. Category start / Stock center-family / Estado end anchors unchanged.

## 899 / 900 Boundary

Both sides: triggers share top/bottom/height; overflowX 0. Layout chrome shift at desktop nav is expected; no intra-row 1px drift.

## Light Mode

PASS — trailing primary text, 1px edge, contact+floating shadow against white cards.

## Dark Mode

PASS — border mix, restrained multi-layer shadow without black halo; trailing primary text.

## Handoff 6/6

| Direction | Result |
|-----------|--------|
| Category→Stock | 1 TAP PASS |
| Category→Estado | 1 TAP PASS |
| Stock→Category | 1 TAP PASS |
| Stock→Estado | 1 TAP PASS |
| Estado→Category | 1 TAP PASS |
| Estado→Stock | 1 TAP PASS |

## Category → Order Handoff

1 TAP PASS — dialog open, URL unchanged, 0 writes.

## Outside / Search First Tap

PASS — Stock open → Search: menu closes, search focused, one tap.

## Rapid Handoff

Category → Stock → Estado → Category → final Category only. PASS.

## Accessibility

Trailing: button, not `role=option`, not `aria-selected`, text-only, focus-visible preserved.

## Runtime Visual QA

Chrome mobile emulation 412 + light/dark + 899/900. REAL ANDROID AUTOMATED BY CURSOR: NOT AVAILABLE.

## Network Safety

Menu open/close: 0 mutation. Filter selection: navigation only. Order action open/Cancel: 0 business write. Real Save: 0.

## Business Safety

categories / positions / products / orders / Storage: 0.

## Focused Verify

`lib/products/admin-products-filter-menu-hard-visual-closeout.verify.ts` — PASS

## Mutation Probes

A–J FAIL_OK → restore PASS.

## TypeScript

`npx tsc --noEmit` — PASS

## Build

`npm run build` — PASS

## Diff

`git diff --check` on phase files — PASS. Runtime delta: CSS + verify + docs.

## Functional Delta

Visual only (trailing contrast/rhythm + menu edge). Interaction architecture frozen.

## DB Delta

**0**

## Remaining

REAL CATEGORY ORDER SAVE + PERSISTENCE + PUBLIC/ADMIN E2E + EXACT RESTORE

## Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

## Release

COMMIT/PUSH/DEPLOY: **PAUSED**
