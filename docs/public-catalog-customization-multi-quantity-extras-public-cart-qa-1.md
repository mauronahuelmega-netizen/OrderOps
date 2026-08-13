# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1

## Estado

```text
QA COMPLETE WITH LOCAL-ONLY QTY FIXTURE — MULTI-QUANTITY EXTRAS PUBLIC CART QA-1 PASSED
```

## Contexto

QA formal de PUBLIC-CART-IMPL-1 (`selection-v2`, modal steppers, cart qty/signature/display) sobre branch `cursor-handoff-public-catalog-ui-redesign` @ `842c2fc` + uncommitted IMPL package.

Docker/local Supabase no disponible → Option A descartada. Option B: temporary in-memory fixture in `customization-modal.tsx` (Agregados extra → quantity-enabled), fully removed before gate close.

## Preflight

- Branch: `cursor-handoff-public-catalog-ui-redesign`
- HEAD: `842c2fc53e5de3e37165951a8fa2021a4d1a9db0`
- Dirty tree: PUBLIC-CART IMPL package only
- Boundary (checkout/success/orders/whatsapp/admin/migrations/globals/theme/package): empty

## Technical validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `npm run lint` | P3 ESLint 9 circular tooling |

## Current tenant regression QA

URL: `http://localhost:3000/b/demohamburgueseria/catalogo`
Product: Doble Smash

| Expectation | Result |
|-------------|--------|
| Papas radio | PASS (3 radios) |
| Salsas/Agregados checkbox | PASS (8 checkboxes post-cleanup) |
| No steppers / no option “Agregar” qty UI when flag off | PASS |
| CTA base path intact | PASS |
| No checkout submit / create_order | PASS |

`CURRENT_TENANT_REGRESSION = PASS` (also revalidated after fixture removal).

## Quantity path activation method

```text
Option B — Temporary local-only fixture override
```

- Forced in modal load path only (dev): Agregados `allowsOptionQuantity=true`, `maxTotalQuantity=5`, Bacon/Cheddar `maxQuantity=5`, Huevo `3`.
- No DB writes, no production SQL, no admin save.
- Fixture markers `QA_FORCE_PUBLIC_QTY_FIXTURE` / `qaForceQuantityExtras` removed.
- `rg QA_FORCE|forceQuantity|qaForceQuantity` → no matches.

## Quantity path browser QA

`QTY_VISUAL_PATH = PASS` (with local-only fixture)

Observed while fixture active:

- Agregados full-width qty cards; meta `Opcional · máx. 5 unidades`
- Bacon/Cheddar/Huevo show `Agregar` at qty 0
- Bacon → 1 → 2 with stepper; Cheddar qty 1
- Papas remained radio; Salsas remained checkbox (5)
- No checkbox on quantity cards for Agregados

## Pricing QA

Observed:

```text
Base $12.500
Bacon +$1.000 × 2
Cheddar +$500 × 1
CTA = Agregar · $15.000,00
```

PASS.

## Cart payload / signature QA

localStorage `orderops-cart-v2:{businessId}`:

- Line Bacon×2 + Cheddar: `finalUnitPrice=15000`, options `quantity:2` / `1`
- Signature includes `…x2` / `…x1` (`optionIdx{qty}`)
- Distinct Bacon×1 line: separate signature ending `…x1`, unit `13500`
- Same Bacon×2+Cheddar config merged to `quantity: 2` on product line

PASS (Bacon×1 ≠ Bacon×2; same config merges).

## Cart display / merge QA

Cart sheet summary:

```text
Agregados extra: Bacon x2 (+$2.000), Cheddar (+$500)
```

- Shows `x2`; omits `x1` on Cheddar
- Product qty stepper remains product-level

PASS.

## Legacy localStorage QA

By code + observed carts:

- `parseLocalCartV2Items` normalizes missing option `quantity` → 1
- Pre-existing line without `x{qty}` in signature still loads
- Display omits `x1`
- Edit hydrate via `selectionStateFromCartParent` includes `selectedQuantitiesByGroupId`

PASS (inspection + live legacy line coexistence).

## Checkout / order guard QA

- `buildCheckoutCartPayload` still emits unique `selectedOptionIds` only (no qty expansion)
- No checkout submit, no `create_order`
- ORDER IMPL still required before enabling quantity on real groups

PASS.

## Motion regression QA

By diff: only qty card/control styles added to `customization-modal.module.css`; overlay enter/exit + reduced-motion blocks preserved. Not re-broken in browser.

PASS (by diff + smoke open/close).

## Safety

```text
production DB push: 0
remote migration applied in this phase: 0
production data mutation: 0
quantity toggles activated in production: 0
local-only fixture data mutation: 0 (in-memory only)
create_order: 0
pedidos reales: 0
WhatsApp real: 0
checkout submit: 0
checkout/create_order/order/snapshot files changed: 0
admin/schema files changed: 0
motion files changed: 0
package/lockfile changes: 0
secrets logged: 0
commit/push/deploy: 0
temporary fixture removed: yes
final runtime diff clean of fixture markers: yes
```

## Findings

1. Local-only fixture successfully exercises qty UI without production mutation.
2. Pricing/signature/display/merge behave as SPEC.
3. Soft note: repeated CDP plus clicks at max were flaky once; core path (Agregar → x2, CTA $15.000, cart merge) already PASS.
4. ESLint 9 circular remains accepted P3 tooling.

## Risks / Debt

- ORDER IMPL still required before COMMIT-DEPLOY / enabling real quantity groups (checkout ID-only vs client unit price).
- Migration history reconciliation still pending for future CLI `db push`.
- Local QA cart may retain qty lines in browser localStorage (local only; not production DB).

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 = ALLOWED_WITH_LOCAL_ONLY_QTY_FIXTURE_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1 = COMPLETE_WITH_LOCAL_ONLY_QTY_FIXTURE
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 = COMPLETE_WITH_LIVE_QTY_GROUP_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-COMMIT-DEPLOY-1 = BLOCKED_UNTIL_ORDER_IMPL_AND_QA
```
