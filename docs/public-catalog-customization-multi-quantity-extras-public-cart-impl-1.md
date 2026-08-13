# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1

## Estado

```text
PASS WITH LIVE QTY GROUP QA DEBT — MULTI-QUANTITY EXTRAS PUBLIC CART IMPL-1 COMPLETE
```

## Contexto

Schema/admin release `842c2fc` deployed quantity columns. This phase implements public modal + local cart only for quantity-enabled option groups (`selection_type=multiple` + `allows_option_quantity=true`).

Base pricing example (unit configured):

```text
Base $12.500
Bacon +$1.000 × 2
Cheddar +$500 × 1
Unit total = $15.000
```

## Scope

In scope: public loader fields, selection V2, modal steppers, pricing × qty, cart option quantity, signature with qty, cart summary `Bacon x2`, legacy localStorage hydrate.

Out of scope: checkout payload V2, `create_order`, snapshot V2, admin order/WhatsApp, commit/push/deploy, data mutation.

## Public data layer

`lib/product-customization/public.ts` selects:

- `customization_groups.allows_option_quantity`, `max_total_quantity`
- `customization_options.max_quantity`

Mapped into `PublicCustomizationGroup` / `PublicCustomizationOption` with defaults:

- `allowsOptionQuantity` effective false unless multiple + true
- `maxTotalQuantity` null when missing
- `maxQuantity` 1 when missing

## Selection state V2

Helper module: `lib/product-customization/selection-v2.ts`

```ts
type CustomizationSelectionStateV2 = Record<string, Record<string, number>>;
```

Includes normalize/legacy bridge, distinct/units helpers, increment/decrement guards, quantity group meta copy.

Modal keeps V2 internally; legacy `optionId[]` derived at edges for shared checkbox/radio path.

## Validation rules

| Mode | Rules |
|------|--------|
| Single | qty forced 1; ignores allows_option_quantity |
| Multiple non-qty | binary; qty 1; min/max = distinct |
| Multiple qty-enabled | min/max distinct + `max_total_quantity` units (bridge → `max_selections` if null) + per-option `max_quantity` |

Plus disabled when option max, total units max, or distinct max on first add.

## Modal UX

Non-qty groups: unchanged radio/checkbox via `CustomizationOptionGroup`.

Qty-enabled groups: full-width cards in `customization-modal` (`Agregar` → `[-] N [+]`, unit + line delta copy). Overlay motion / reduced-motion untouched (CSS only adds qty styles; exit animations preserved).

## Pricing

`computeVisualCustomizationTotal` and cart `customizationTotal` use `price_delta × quantity`. CTA shows unit configured price (product cart qty not applied in modal).

## Cart payload

`LocalCartSelectedOption.quantity?: number` (legacy missing → 1). New lines write explicit quantity. `LocalCartItem.quantity` remains product line qty.

## Cart signature

Format:

```text
product:{id}|groups:{groupId}:{optionId}x{qty},...;...|upsells:{ids}
```

`selectedOptionIds`-only callers still accepted as qty 1 each (order-validation bridge). Bacon×1 ≠ Bacon×2. Same config merges product quantity.

## Cart display / edit

`displaySummary`: `Bacon x2 (+$2.000)`; omits `x1`. Edit flow rehydrates via `selectionStateFromCartParent` → quantities map.

## Checkout / order guard

`buildCheckoutCartPayload` still emits legacy-safe unique `selectedOptionIds` (no qty expansion). Quantity remains local-cart-only until ORDER IMPL.

**Residual risk:** enabling quantity on real groups before ORDER IMPL can make client unit price diverge from server totals / signature expectations. Gate: COMMIT-DEPLOY blocked until ORDER IMPL + QA.

## Files changed

- `lib/product-customization/selection-v2.ts` (new)
- `lib/product-customization/public-shared.ts`
- `lib/product-customization/public.ts`
- `lib/cart/types.ts`
- `lib/cart/signature.ts`
- `lib/cart/local.ts`
- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/customization-modal.module.css`
- `components/public/catalog/catalog-client.tsx`
- docs (this file + CURRENT_PHASE)

## Validation

- `tsc --noEmit`: PASS
- `npm run build`: (recorded in session)
- `git diff --check`: PASS
- lint: ESLint 9 circular P3 accepted if present

## QA

### Current tenant (`demohamburgueseria`)

Expected unchanged while all groups `allows_option_quantity=false`: radio Papas, checkbox Salsas/Agregados, no steppers.

### Quantity path

```text
P3 LIVE_QTY_GROUP_BROWSER_QA_DEBT — quantity-enabled public path validated by helpers/static logic; no safe live quantity-enabled tenant without data mutation.
```

Covered statically: increment guards, pricing × qty, signature optionIdx{qty}, display xN, legacy quantity hydrate = 1.

## Safety

```text
production DB push: 0
data mutation: 0
quantity toggles activated: 0
create_order: 0
checkout/create_order/order/snapshot files: 0
admin/schema files: 0
commit/push/deploy: 0
```

## Risks / Debt

- LIVE_QTY_GROUP_BROWSER_QA_DEBT (P3)
- Migration history reconciliation still pending for future CLI `db push`
- ORDER IMPL required before production enablement of quantity groups
- Signature format now includes `x{qty}` for all new lines (legacy carts keep old signatures until edited)

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1 = ALLOWED_WITH_LIVE_QTY_GROUP_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 = COMPLETE_WITH_LIVE_QTY_GROUP_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 = PAUSED_UNTIL_PUBLIC_CART_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-COMMIT-DEPLOY-1 = BLOCKED_UNTIL_ORDER_IMPL_AND_QA
```
