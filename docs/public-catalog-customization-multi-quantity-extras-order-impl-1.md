# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1

## Estado

PASS WITH ORDER SUBMIT QA DEBT — MULTI-QUANTITY EXTRAS ORDER IMPL-1 COMPLETE

## Contexto

PUBLIC-CART IMPL/QA already store option quantities in local cart, signature, and display. Checkout/`create_order` still needed a V2 payload path, server normalization/validation/pricing, Snapshot V2, and V1-compatible admin readers before enabling quantity on real groups.

HEAD baseline: `842c2fc` (`feat(public-catalog): add quantity extras schema admin config`). Working tree includes prior PUBLIC-CART package + this ORDER IMPL.

## Scope

In scope:
- Checkout payload V2 (`selectedOptions` + legacy `selectedOptionIds` bridge)
- Server normalize / validate / price × qty
- CustomizationSnapshotV2
- Admin/dashboard summary readers V1+V2
- Docs / CURRENT_PHASE

Out of scope:
- Public modal UI changes
- Schema/admin config
- Real checkout submit / create_order / WhatsApp / DB push
- Commit / push / deploy
- Enabling quantity on production groups

## Checkout payload V2

`buildCheckoutCartPayload` (`lib/cart/local.ts`) now emits:

```ts
selectedGroups: [{
  groupId,
  selectedOptions: [{ optionId, quantity }],
  selectedOptionIds: string[] // unique IDs, legacy bridge
}]
```

Rules:
- New carts send quantities (no duplicated option IDs to fake qty)
- Legacy cart lines without quantity hydrate as `quantity: 1`
- Product line quantity remains orthogonal to option quantity

## Server normalization

`lib/product-customization/checkout-payload-v2.ts`:
- Prefer `selectedOptions` when present
- Else map `selectedOptionIds` → quantity 1
- Sum duplicate `optionId` quantities, then validate limits
- Reject non-integer / <1 / NaN / Infinity quantities

## Server validation

`validateCheckoutCartForCreateOrder` (`order-validation.ts`):
- Loads live public product customization config (tenant-scoped)
- Normalizes groups via V2 helper
- Rejects unknown groups/options via existing selection validate
- Rejects `quantity > 1` on `single` and non-quantity-enabled groups
- Quantity-enabled groups: option max, distinct max_selections, total units / max_total_quantity (with existing bridge to max_selections)
- Required/min uses distinct options with qty ≥ 1
- Signature compared server-side with qty-aware format (`optionIdx{qty}`)

## Server pricing

Recalculated only from DB deltas:

```text
customizationDelta = Σ price_delta × option.quantity
finalUnitPrice = basePrice + customizationDelta
lineTotal = finalUnitPrice × productLineQuantity  (RPC quantity × unit_price)
```

Client `finalUnitPrice` / `customizationTotal` are not trusted.

Example: base 12500 + bacon 1000×2 + cheddar 500×1 → unit 15000; qty 2 → line 30000.

## CustomizationSnapshotV2

Built for every new customized parent line:
- `version: 2`
- `allows_option_quantity`, `max_total_quantity` on groups
- `quantity` + `total_price_delta` on selected options
- `summary` includes `Bacon x2` when qty > 1

V1 snapshots are never migrated. Missing version → V1.

## create_order / RPC strategy

**Case C (hybrid) — TypeScript is source of truth for customization qty.**

Flow:
1. `createPublicCheckoutOrderAction` → `validateCheckoutCartForCreateOrder` (TS)
2. Snapshot V2 + `unit_price` attached to RPC items
3. Supabase RPC `create_order` persists items / snapshots as JSON

No new SQL migration in this phase (RPC already accepts snapshot + unit_price JSON).
`MIGRATION_HISTORY_RECONCILIATION_REQUIRED` remains for prior schema migration `20260813010000` before any release that adds further migrations / `db push`.

## Checkout summary

Checkout UI (`checkout-client.tsx`) already renders `parent.displaySummary` from cart. Cart display already formats `Bacon x2` / line deltas. No layout redesign. Payload V2 is what the server receives on submit (not exercised here).

## Admin order display

`parseCustomizationSnapshot` / `getCustomizationSummaryLines` (`order-dashboard.ts`):
- Parse V1 and V2
- Rebuild summary with `xN` and `total_price_delta` when summary missing
- V1 orders continue to show names without qty

Helper: `lib/orders/customization-summary.ts` (thin wrapper).

## WhatsApp admin

`lib/whatsapp/admin.ts` summarizes product lines only (`Nx product_name`) — **does not include extras today**.

**P3 display debt:** do not expand WhatsApp extras scope in this phase. Documented only.

Public WhatsApp untouched.

## Legacy compatibility

| Path | Behavior |
|------|----------|
| Legacy `selectedOptionIds[]` | qty 1 |
| Legacy carts without quantity | qty 1 |
| Snapshot V1 | still parses/renders |
| Non-qty group qty>1 | rejected |
| Single group qty>1 | rejected |
| Unknown option/group | rejected |

## Files changed

Modified:
- `lib/cart/local.ts` — checkout payload V2
- `lib/product-customization/order-types.ts` — V2 types
- `lib/product-customization/order-snapshot.ts` — Snapshot V2 builder
- `lib/product-customization/order-validation.ts` — normalize/validate/price/snapshot V2
- `lib/product-customization/order-dashboard.ts` — V1/V2 readers
- `docs/CURRENT_PHASE.md`

Created:
- `lib/product-customization/checkout-payload-v2.ts`
- `lib/orders/customization-summary.ts`
- `lib/product-customization/order-qty-helpers.verify.ts` (static helper QA; expanded in ORDER-QA-1)
- `docs/public-catalog-customization-multi-quantity-extras-order-impl-1.md`

Prior dirty (PUBLIC-CART, not reopened for UI):
- public modal/css/catalog-client, cart types/signature, selection-v2, public-shared/public, cart QA/impl docs

## Validation

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- `npm run lint`: P3 tooling only (ESLint 9 circular JSON/config-validator) — not code regression
- Helper static QA: `npx tsx lib/product-customization/order-qty-helpers.verify.ts` → PASS (payload normalize, $15.000 unit, snapshot Bacon x2, V1 reader)

## QA

Static/helper:
- Payload builder emits `selectedOptions` + bridge IDs
- Normalizer accepts V2 + legacy
- Validation rejects malicious qty on non-qty/single
- Pricing × qty in snapshot `pricing` + `total_price_delta`
- Admin summary helper formats `Bacon x2`

Browser no-submit:
- Catalog (`/b/demohamburgueseria` → `/catalogo`) loads — PASS
- Checkout loads (empty cart OK) — PASS
- Success `?order_id=invalid` loads without crash — PASS
- No create_order / no real WhatsApp

Order submit QA: **deferred** (debt) — no production mutation.

## Safety

- production data mutation: 0
- remote DB push: 0
- checkout submit real: 0
- create_order real: 0
- WhatsApp real: 0
- commit/push/deploy: 0
- public modal not reopened for ORDER IMPL
- no quantity enabled on real commercial groups

## Risks / Debt

1. **ORDER SUBMIT QA DEBT (accepted):** end-to-end create_order with live qty group not exercised.
2. **WhatsApp admin extras P3:** product lines only; no extras/`xN` in templates.
3. **MIGRATION_HISTORY_RECONCILIATION_REQUIRED:** `20260813010000` applied via SQL Editor; reconcile before release `db push`.
4. **Live qty group still off** on real tenant data — intentional until ORDER QA + COMMIT-DEPLOY.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1 = ALLOWED_WITH_ORDER_SUBMIT_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 = COMPLETE_WITH_ORDER_SUBMIT_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1 = COMPLETE_WITH_LOCAL_ONLY_QTY_FIXTURE
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 = COMPLETE_WITH_LIVE_QTY_GROUP_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-COMMIT-DEPLOY-1 = BLOCKED_UNTIL_ORDER_QA
```
