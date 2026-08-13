# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1

## Estado

QA COMPLETE WITH ACCEPTED ORDER SUBMIT QA DEBT — MULTI-QUANTITY EXTRAS ORDER QA-1 PASSED

## Contexto

Formal QA of ORDER-IMPL-1 on branch `cursor-handoff-public-catalog-ui-redesign` @ `842c2fc` (+ dirty PUBLIC-CART + ORDER-IMPL).

ORDER-IMPL claimed Case C (TS SoT), payload V2, Snapshot V2, admin V1/V2 readers, no SQL migration, no real submit.

Discrepancy resolved: `lib/product-customization/order-qty-helpers.verify.ts` exists (ORDER-IMPL validation artifact); not listed in ORDER-IMPL “Files changed” — now documented here and expanded for QA coverage.

## Preflight

| Check | Result |
|-------|--------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `842c2fc53e5de3e37165951a8fa2021a4d1a9db0` |
| Dirty tree | PUBLIC-CART + ORDER-IMPL package (expected) |
| verify script | EXISTS |
| Unexpected migrations / package / theme | none |
| Fixture markers | none |

## Technical validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `npm run lint` | P3 tooling only (ESLint 9 circular JSON) |

## Helper/static QA

`npx tsx lib/product-customization/order-qty-helpers.verify.ts` → **ORDER_HELPER_QA = PASS**

Covered:
- V2 normalize + prefer `selectedOptions` over bridge
- Legacy `selectedOptionIds` → qty 1
- Duplicate optionIds sum quantities
- Reject 0 / negative / non-integer / NaN / Infinity / string qty
- Reject qty>1 single + non-qty multiple (integrity gate)
- Reject option.max_quantity / max_total_quantity / max_selections via `isSelectionStrictlyWithinLimits`
- Bridge `max_total_quantity null` → `max_selections`
- Pricing 12500 + 1000×2 + 500 = 15000; line qty 2 = 30000
- Snapshot V2 version/quantity/total_price_delta/summary Bacon x2
- V1 + missing-version readers PASS

### P1 microfix applied during QA

**Finding:** `validateCustomizationSelection` clamps via `normalizeSelectionToV2` before checking limits, while `buildSelectedGroupsFromConfig` used the raw client quantities — over-max qty could pass validation and persist.

**Fix:** `isSelectionStrictlyWithinLimits` in `selection-v2.ts`; enforced in `order-validation.ts` before soft validate (reject over-limit; no silent clamp on create_order).

## Checkout payload V2 QA

`buildCheckoutCartPayload` audit PASS:
- `groupId` + `selectedOptions[{optionId,quantity}]` + unique `selectedOptionIds` bridge
- No duplicated IDs to fake x2
- Product line quantity orthogonal
- Upsells retained

## Server normalization QA

`checkout-payload-v2.ts` PASS:
- Prefer V2; legacy qty 1; sum duplicates; invalid qty reject

## Server validation QA

`order-validation.ts` PASS after P1 fix:
- Unknown group reject
- Single / non-qty qty>1 reject
- Strict limits reject (max option / total / distinct)
- Tenant-scoped config load
- Signature qty-aware compare
- Invalid → `{ok:false}` before RPC (no partial order path)

## Server pricing QA

PASS: `Σ price_delta × qty`; client totals not read from customized item payload for SoT.

## CustomizationSnapshotV2 QA

PASS: `version:2`, quantity, `total_price_delta`, summary `Bacon x2`, group qty metadata.

## Admin/dashboard display QA

`order-dashboard.ts` + `customization-summary.ts` PASS:
- V1 simple names
- V2 `Bacon x2`
- Rebuild when summary empty
- No dashboard/realtime redesign

## WhatsApp admin QA

`lib/whatsapp/admin.ts`: product lines only (`Nx product_name`). **P3 — WHATSAPP_ADMIN_EXTRAS_DISPLAY_DEBT**. Public WhatsApp untouched. No real send.

## Browser no-submit QA

**BROWSER_NO_SUBMIT_QA = PASS**

| URL | Result |
|-----|--------|
| `/b/demohamburgueseria` → catalogo | PASS |
| `/catalogo` BBQ Bacon modal | radios=3, checkboxes=8, steppers=0 (qty off) PASS |
| `/checkout` | loads (empty cart OK) PASS |
| `/success?order_id=invalid` | loads without crash PASS |
| create_order / submit | not exercised |

## Optional safe submit QA

**ORDER_SUBMIT_QA = NOT_EXERCISED_WITH_ACCEPTED_P3_DEBT**

- Docker Desktop / local Supabase unavailable
- Production / demohamburgueseria submit forbidden
- No disposable remote authorized

## Security/integrity QA

PASS (code + helper):
- Server recalculates prices
- Strict limits reject malicious qty
- Unknown group/option rejected
- Validation failure before RPC
- V2 preferred over bridge IDs

## Legacy compatibility QA

PASS: legacy IDs qty1; V1 + missing version parse; non-qty path intact.

## Migration history safety

- No new ORDER migration
- **MIGRATION_HISTORY_RECONCILIATION_REQUIRED** for `20260813010000` before future `supabase db push`
- No db push / repair in this phase

## Safety

```text
production data mutation: 0
production quantity toggles activated: 0
remote DB push: 0
remote migration applied: 0
checkout submit production: 0
create_order production: 0
pedidos reales production: 0
WhatsApp real: 0
admin/product data save: 0
commit: 0
push: 0
deploy: 0
secrets logged: 0
```

## Findings

| Sev | Finding | Disposition |
|-----|---------|-------------|
| P1 | Soft-clamp validate vs raw persist on create_order | Fixed in QA microfix |
| P3 | Order submit not exercised (no safe env) | Accepted debt |
| P3 | WhatsApp admin extras missing | Accepted debt |
| P3 | Migration history reconciliation | Carry-forward |
| P3 | ESLint 9 circular JSON tooling | Known; non-blocking |
| P3 | verify script omitted from ORDER-IMPL files list | Documented |

## Risks / Debt

1. **ORDER SUBMIT QA DEBT** — real create_order + persisted snapshot not exercised.
2. **REAL QUANTITY GROUP ENABLEMENT REMAINS BLOCKED UNTIL SAFE ORDER SUBMIT QA OR OWNER ACCEPTS PRODUCTION RISK.**
3. WhatsApp extras P3.
4. Migration history P3.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-COMMIT-DEPLOY-1 = ALLOWED_WITH_ACCEPTED_ORDER_SUBMIT_QA_DEBT_AND_REAL_ENABLEMENT_GUARD
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1 = COMPLETE_WITH_ACCEPTED_ORDER_SUBMIT_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 = COMPLETE_WITH_ORDER_SUBMIT_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1 = COMPLETE_WITH_LOCAL_ONLY_QTY_FIXTURE
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 = COMPLETE_WITH_LIVE_QTY_GROUP_QA_DEBT
```

Release guard: do not enable quantity on real production groups without safe submit QA or explicit owner risk acceptance.
