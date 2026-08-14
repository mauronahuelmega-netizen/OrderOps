# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-LIMITS-GRID-POLISH-1

## Estado

PASS WITH LOCAL-ONLY GRID QA — MULTI-QUANTITY EXTRAS LIMITS GRID POLISH-1 COMPLETE

## Contexto

Post-deploy polish after `de89087` (`feat(public-catalog): support quantity extras in cart and orders`).

Quantity extras worked end-to-end, but `max_total_quantity` conflicted with per-option `max_quantity` (e.g. Bacon/Cheddar max 10 blocked by group total max 5). Quantity UI had drifted to full-width cards instead of the compact checkbox grid.

## Product decision

- `option.max_quantity` = effective per-option unit cap.
- `max_selections` / `min_selections` = distinct option counts (unchanged).
- `max_total_quantity` = **deprecated / no-op** (DB column kept; no migration; no backfill).
- No total-units group cap anywhere in public modal, selection helpers, or order validation.

## Admin config simplification

- Section editor: removed/hidden “Máximo de unidades en total”.
- Quantity-enabled multiple groups: toggle + helper that limits live on each option + distinct `max_selections`.
- Hidden `max_total_quantity=""` always submitted; `parseCustomizationGroupInput` always persists `maxTotalQuantity: null`.
- Existing non-null DB values are ignored at runtime; next save clears them via parser/actions.
- Option `max_quantity` editor unchanged.

## Public grid UX

- Quantity-enabled extras use 2-column compact tiles (checkbox-like grid), not full-width cards.
- Tile: name, unit price (`+$X c/u`), `Agregar` when qty=0, compact `[-] N [+]` when qty≥1, discreet `Máx. N` when option max > 1.
- Plus disabled only by option `maxQuantity`; new-option `Agregar` disabled when distinct `maxSelections` reached (existing selected options can still increase to their option max).
- Radio / non-qty checkbox / product qty / overlay motion / sticky CTA unchanged.

## Limit semantics

| Constraint | Effective |
|---|---|
| `option.max_quantity` | Yes |
| `max_selections` (distinct) | Yes |
| `min_selections` (distinct) | Yes |
| `group.max_total_quantity` | No (ignored) |

Example: Bacon×5 + Cheddar×5 + Huevo×3 OK when distinct max allows; Bacon×6 rejected by option max; three distinct options rejected only when `max_selections=2`.

## Selection V2 changes

- `getEffectiveMaxTotalQuantity` always returns `null`.
- Normalize / increment / set no longer clamp on total units.
- `canIncrementOptionQuantity` uses option max + distinct-max-for-new-option only.
- `isSelectionStrictlyWithinLimits` ignores total-units (via normalize).
- `formatQuantityGroupMeta`: `Opcional` / `Obligatorio` · `máx. N opciones` (no “unidades”).
- `getSelectedTotalUnits` retained for debug/display only.

## Order validation changes

- Server path continues to reject invalid qty, option over-max, single/non-qty qty>1, distinct over/under, unknown/cross-business options via `isSelectionStrictlyWithinLimits` + existing integrity checks.
- No reject path for `max_total_quantity`.
- No RPC / schema change.

## Snapshot compatibility

- New Snapshot V2 writes `max_total_quantity: null`.
- Readers still tolerate historical snapshots that stored a previous total value.
- Summary/pricing (`Bacon x2`, `price_delta × qty`) unchanged; V1 reader compatibility unchanged.

## QA

Local-only temporary fixture forced Agregados quantity-enabled (`maxTotalQuantity: 15` stale, Bacon/Cheddar max 5, Huevo max 3):

- Grid `display:grid` 2 columns (not full-width).
- Bacon Agregar → ×1 → plus to ×5 (plus disabled at 5).
- Cheddar also reached ×5 with Bacon already ×5 (no total-units block).
- No customer copy with “unidades” total.
- CTA pricing coherent (e.g. base + Bacon×5 + Cheddar×5).
- Fixture and markers removed after browser QA.

Production data / real qty enablement not mutated.

## Files changed

- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/customization-modal.module.css`
- `components/admin/product-customization/reusable-sections/section-edit-modal.tsx`
- `lib/product-customization/selection-v2.ts`
- `lib/product-customization/shared.ts`
- `lib/product-customization/public-shared.ts`
- `lib/product-customization/order-snapshot.ts`
- `lib/product-customization/order-qty-helpers.verify.ts`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`
- `docs/public-catalog-customization-multi-quantity-extras-limits-grid-polish-1.md` (this file)

Not required this phase: `option-edit-modal.tsx`, `actions.ts` (already persists `parsed.maxTotalQuantity` → null), `order-validation.ts` / `order-types.ts` / cart signature (already option-max / distinct based).

## Validation

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `npx tsx lib/product-customization/order-qty-helpers.verify.ts`: `ORDER_HELPER_QA = PASS`
- `git diff --check`: PASS
- `npm run lint`: known ESLint 9 circular JSON/config-validator (P3 tooling; non-blocking)
- Browser: PASS WITH LOCAL-ONLY GRID QA (fixture removed; markers clean for `QA_FORCE|forceQuantity|qaForceQuantity`)

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

- Legacy DB rows may still store non-null `max_total_quantity` until next group save (runtime no-op).
- Real quantity enablement still blocked until safe order-submit QA or owner risk acceptance.
- Migration history reconciliation still required before next `supabase db push`.
- ESLint 9 circular config tooling remains P3.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-LIMITS-GRID-POLISH-QA-1 = ALLOWED_WITH_LOCAL_ONLY_GRID_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-LIMITS-GRID-POLISH-1 = COMPLETE_WITH_LOCAL_ONLY_GRID_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-LIMITS-GRID-COMMIT-DEPLOY-1 = BLOCKED_UNTIL_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-REAL-ENABLEMENT = BLOCKED_UNTIL_SAFE_ORDER_SUBMIT_QA_OR_OWNER_RISK_ACCEPTANCE
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-MIGRATION-HISTORY-RECONCILIATION = REQUIRED_BEFORE_NEXT_SUPABASE_DB_PUSH
```
