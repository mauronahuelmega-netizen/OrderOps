# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-MODAL-SHELL-QTY-VISUAL-POLISH-1

## Estado

PASS WITH LOCAL-ONLY VISUAL QA — MODAL SHELL QTY VISUAL POLISH-1 COMPLETE

## Contexto

Post LIMITS-GRID-POLISH-1 visual follow-up on `de89087` + dirty LIMITS-GRID package.

Quantity extras already used a 2-col grid with option-max limits, but the modal still felt like a tall floating card and quantity tiles were heavier than checkbox tiles.

## Visual problem

- Modal `max-height: 92dvh` left top/bottom gaps on mobile.
- Header sticky only mattered inside a non-full-height sheet.
- Quantity tiles looked heavier than Salsas checkbox tiles (stronger Agregar / denser meta).
- Copy `+$1.000,00 c/u · Máx. 5` felt noisy.
- Section meta competed with the title via `space-between`.

## Product decision

Mobile customization modal = full-height sheet: fixed header + internal scroll body + fixed footer.

Quantity tiles = compact evolution of checkbox tiles (same grid gap/radius/surface/selected accent; secondary controls).

## Modal full-height shell

Mobile (default):

- `.backdrop` stretch, no padding.
- `.modal` `height/max-height: 100dvh` with `100svh` fallback, `border-radius: 0`, full width.
- Flex column: header/footer `flex: 0 0 auto`, body `flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain`.

Desktop (`min-width: 640px`):

- Centered modal preserved (`max-height: min(92dvh, 52rem)`, rounded card).

## Sticky header/footer

- Header: solid tokenized surface, tighter padding, `safe-area-inset-top`, `z-index: 2`, bottom border.
- Footer: solid surface, `safe-area-inset-bottom`, `z-index: 2`, top border; CTA/pricing handlers unchanged.
- Body scrolls; background page scroll stays locked (`pageScrollY: 0` in QA).

## Quantity tile visual polish

- Grid gap/radius/surface/selected accent aligned with shared checkbox compact tiles.
- Quieter `Agregar` (secondary surface, muted text — not primary CTA).
- Compact stepper (~36–38px targets), muted value weight.
- Copy: `+$1.000 · máx. 5` (strip trailing `,00`, drop `c/u`, lowercase máx.).

## Section meta polish

- Quantity header uses `justify-content: flex-start` + wrap (no large space-between gap).
- Meta pill matches Salsas badge language (`border-radius: 999px`).

## Behavior preserved

- Radio Papas / checkbox Salsas / quantity Agregados semantics unchanged.
- Option max, distinct maxSelections, pricing `price_delta × qty`, cart/order/signature/validation/snapshot untouched.
- Dialog a11y, close, Escape/focus trap/scroll lock, reduced motion preserved.

## Files changed

- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/customization-modal.module.css`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`
- `docs/public-catalog-customization-multi-quantity-extras-modal-shell-qty-visual-polish-1.md` (this file)

Accumulated from LIMITS-GRID-POLISH-1 (unchanged this phase beyond docs): admin section editor, selection-v2, shared/public-shared, order-snapshot, verify script, limits-grid doc.

## Validation

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- `npx tsx lib/product-customization/order-qty-helpers.verify.ts`: `ORDER_HELPER_QA = PASS`
- `npm run lint`: known ESLint 9 circular JSON/config-validator (P3 tooling; non-blocking)
- Browser: PASS WITH LOCAL-ONLY VISUAL QA (fixture removed; markers clean)

## Browser QA

Viewport 412×915 (S20 Ultra-like) on `http://localhost:3000/b/demohamburgueseria/catalogo` → Doble Smash.

Local-only fixture forced Agregados quantity-enabled (Bacon/Cheddar max 5, Huevo max 3).

CDP metrics:

- dialog `top:0`, `height:915` = viewport, `border-radius:0`
- header stays `top:0` after body scroll; footer `bottom gap:0`
- body `overflow-y: auto`; `pageScrollY:0`
- qty grid 2-col; meta `+$ 1.000 · máx. 5`; group meta pill
- Bacon×5 (plus disabled) + Cheddar×5; CTA `$ 20.000,00` (= 12500 + 5000 + 2500)
- last option clearance above footer ~17px
- no checkout submit

Fixture removed; markers clean.

## Safety

- production data mutation: 0
- production quantity toggles activated: 0
- remote DB push: 0
- remote migration applied: 0
- checkout submit production: 0
- create_order production: 0
- pedidos reales production: 0
- WhatsApp real: 0
- admin/product data save production: 0
- commit: 0
- push: 0
- deploy: 0
- secrets logged: 0
- temporary fixture removed: yes
- runtime markers clean: yes

## Risks / Debt

- Quantity tiles remain taller than checkboxes by necessity (control row); density tuned, not identical height.
- Real qty enablement still blocked until safe submit QA / owner risk accept.
- LIMITS-GRID formal QA paused until this visual polish QA gate.
- ESLint 9 circular config remains P3 tooling.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-MODAL-SHELL-QTY-VISUAL-POLISH-QA-1 = ALLOWED_WITH_LOCAL_ONLY_VISUAL_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-MODAL-SHELL-QTY-VISUAL-POLISH-1 = COMPLETE_WITH_LOCAL_ONLY_VISUAL_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-LIMITS-GRID-POLISH-QA-1 = PAUSED_UNTIL_MODAL_SHELL_QTY_VISUAL_POLISH_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-LIMITS-GRID-COMMIT-DEPLOY-1 = BLOCKED_UNTIL_VISUAL_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-REAL-ENABLEMENT = BLOCKED_UNTIL_SAFE_ORDER_SUBMIT_QA_OR_OWNER_RISK_ACCEPTANCE
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-MIGRATION-HISTORY-RECONCILIATION = REQUIRED_BEFORE_NEXT_SUPABASE_DB_PUSH
```
