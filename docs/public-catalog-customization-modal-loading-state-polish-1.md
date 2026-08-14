# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-LOADING-STATE-POLISH-1

## Estado

PASS WITH THROTTLED LOADING QA — CUSTOMIZATION MODAL LOADING STATE POLISH-1 COMPLETE

## Contexto

Post MODAL-SHELL-QTY-VISUAL-POLISH-1. Modal shell full-height + sticky header/footer already in place. Loading body still showed plain “Cargando opciones…” and felt empty.

## Visual problem

Cold open of a customizable product left a sparse body with only loose loading text — not premium and not centered in the full-height sheet.

## Loading UX

- Sticky header remains (title / close; base price when ready).
- Body shows centered spinner + “Preparando opciones” + “Un momento…”.
- Footer CTA hidden while `loadState.status === "loading"`.
- Error / disabled / ready paths unchanged.

## Spinner implementation

CSS-only ring in `customization-modal.module.css`:

- ~40px (`2.5rem`) circle
- muted track via `color-mix` on `--customization-subtle`
- accent arc via `--business-primary` / catalog accent tokens
- `modalSpinnerSpin` 900ms linear infinite
- `contain: layout style paint`

## Accessibility

- Dialog `aria-busy={true}` while loading
- Loading region `role="status"` + `aria-live="polite"`
- Spinner `aria-hidden="true"`
- `aria-labelledby` preserved
- Close remains available during loading

## Reduced motion

`prefers-reduced-motion: reduce` sets `.loadingSpinner { animation: none }` (verified via CDP media emulation).

## Cache/performance guard

- No fetch/cache/dedupe changes
- No artificial permanent delay
- Cache-hit reopen: ready ~80ms, no loading UI, Papas/Salsas present
- Temporary `?qa_loading=1` visual override used only for cold-loading screenshot, then removed (no markers left)

## Files changed

- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/customization-modal.module.css`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`
- `docs/public-catalog-customization-modal-loading-state-polish-1.md` (this file)

## Validation

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- `npx tsx lib/product-customization/order-qty-helpers.verify.ts`: `ORDER_HELPER_QA = PASS`
- `npm run lint`: known ESLint 9 circular JSON/config-validator (P3 tooling; non-blocking)
- Browser: PASS WITH THROTTLED LOADING QA
- Markers: `QA_FORCE|qa_loading|forceLoadingUi|Cargando opciones` clean under app/components/lib

## Browser QA

- Loading UI (via temporary `qa_loading` flag for observability on localhost): centered spinner, copy, no footer, `aria-busy`, full-height shell
- Reduced motion: animation `none` when reduce; spin when no-preference
- Cache reopen BBQ Bacon: no long loading; options + footer present; `pageScrollY: 0`
- Old copy “Cargando opciones” absent
- No checkout submit

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
- temporary QA marker removed: yes

## Risks / Debt

- Localhost server actions often resolve before paint; visual loading frame may need throttle/`qa` override to observe — production latency still shows the state.
- ESLint 9 circular config remains P3 tooling.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-VISUAL-QA-1 = ALLOWED_WITH_THROTTLED_LOADING_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MODAL-LOADING-STATE-POLISH-1 = COMPLETE_WITH_THROTTLED_LOADING_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-LIMITS-GRID-COMMIT-DEPLOY-1 = BLOCKED_UNTIL_VISUAL_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-REAL-ENABLEMENT = BLOCKED_UNTIL_SAFE_ORDER_SUBMIT_QA_OR_OWNER_RISK_ACCEPTANCE
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-MIGRATION-HISTORY-RECONCILIATION = REQUIRED_BEFORE_NEXT_SUPABASE_DB_PUSH
```
