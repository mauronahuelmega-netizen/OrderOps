# Admin Manual Order Customization Safety Gate 1

## 1. Objective

Block admin manual-order creation of products that would open the public catalog customization flow, until an admin customization picker exists. Manual order remains **simple products only**.

## 2. Audit finding being addressed

From `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1`:

- Manual producer sends legacy `{ product_id, quantity }` only.
- No snapshots / required groups / upsells.
- Customizable products were ungated → P1 pricing/prep/WhatsApp risk.

## 3. Product decision

| Class | Manual order |
| ----- | ------------ |
| Simple products | Allowed |
| Products that open public customization modal | Blocked (UI + server) |
| Upsell-only (public quick-add) | Allowed (matches public modal criterion) |
| Customization picker | Not in this phase |
| Single-scroll polish | Deferred |

## 4. Source ownership

| Surface | Owner |
| ------- | ----- |
| Eligibility pure helper | `lib/orders/manual-order-customization-eligibility.ts` |
| Server eligibility map | `lib/orders/manual-order-customization-safety.ts` |
| Types | `lib/orders/manual-order-types.ts` |
| Loader | `lib/products/admin.ts` → `getManualOrderProductOptions` |
| UI | `manual-order-modal.tsx` + `.module.css` |
| Server gate | `createManualOrderAction` |
| Criterion reused | `productNeedsCustomizationModal` + `isProductCustomizationEnabled` + public summaries loader |

## 5. Manual order eligibility model

```text
flag OFF → eligible
flag ON  → ineligible iff productNeedsCustomizationModal(summary) === true
```

`summary.hasCustomizations` drives the public modal; upsell-only does not.

Fields on `ManualOrderProductOption`:

- `isManualOrderAvailable`
- `manualOrderUnavailableReason` (`"Requiere personalización"` when blocked)

## 6. UI safety gate

- Blocked rows: `--blocked` style, badge, short hint.
- `+` disabled with explanatory `aria-label`.
- `addProduct` no-ops when not available.
- Products remain searchable.
- No native alerts; no picker; no scroll architecture change.

## 7. Server action safety gate

Before `create_order`:

1. Recalculate eligibility for payload product IDs (server-side).
2. If any blocked → `VALIDATION_ERROR`, no RPC.
3. Error names product when possible.
4. Does not trust client flags.

## 8. RPC/DB boundary

`create_order` untouched. No migrations. No fake snapshots.

## 9. Runtime QA

Authenticated agent browser: session redirected to `/admin/login` (prior auth expired). Matrix not re-executed live.

Covered without mutation:

- Source/static verifies for UI disable + server-before-RPC gate.
- Pure eligibility unit verify (flag OFF / simple / customizable / upsell-only / null summary).
- Nested scroll debt unchanged (not touched).

**Debt:** live authenticated viewport matrix pending re-login by operator.

## 10. Verifies

```bash
npx tsx lib/orders/manual-order-customization-safety.verify.ts
npx tsx lib/orders/admin-manual-order-customization-safety-gate.verify.ts
# + footer/drawer/toolbar/terminal/search/metrics/order_code
```

All listed verifies: **PASS**

## 11. Static checks

- `tsc --noEmit` PASS
- `git diff --check` PASS
- `npm run build` PASS
- `npm run lint` → known ESLint 9 circular JSON debt only

## 12. Lint evidence

- Executed: `npm run lint`
- Exact: ESLint 9.39.4 `TypeError: Converting circular structure to JSON` (React plugin cycle)
- Known tooling debt only

## 13. Files changed

- `lib/orders/manual-order-types.ts`
- `lib/orders/manual-order-customization-eligibility.ts`
- `lib/orders/manual-order-customization-safety.ts`
- `lib/products/admin.ts`
- `components/admin/orders/manual-order-modal.tsx`
- `components/admin/orders/manual-order-modal.module.css`
- `app/admin/(protected)/orders/actions.ts`
- `lib/orders/manual-order-customization-safety.verify.ts`
- `lib/orders/admin-manual-order-customization-safety-gate.verify.ts`
- Docs: this file, CURRENT_PHASE, living audit, living memory, audit follow-ups

## 14. P0–P3 findings

- **P0:** none
- **P1 addressed:** ungated customizable manual adds
- **P2:** nested modal scrolls remain (deferred)
- **P3:** authenticated live viewport matrix pending re-login

## 15. Hard boundaries

No RPC/SQL/public/checkout/WhatsApp/workspace/dashboard polish/drawer/toolbar/footer/picker/scroll-fix. No commit/push/deploy.

## 16. Gate

`ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1` — **PASS WITH RUNTIME QA DEBT — MANUAL ORDER CUSTOMIZATION SAFETY GATE READY**

**Follow-up (2026-09-06):** `ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-RUNTIME-QA-1` — **PASS — RUNTIME QA CLOSED**. Authenticated matrix verified BBQ Bacon blocked / Coca Cola simple local add; no real orders. Doc: `docs/admin-manual-order-customization-safety-gate-runtime-qa-1.md`.

**Follow-up (2026-09-06):** Full customization flow **SPECIFIED** (safety gate remains active until picker + server enriched path). Doc: `docs/admin-manual-order-customization-flow-spec-1.md`. Next: `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-DOMAIN-1`.

**Follow-up (2026-09-06):** Domain helpers **IMPLEMENTED** without UI unblock — see `docs/admin-manual-order-customization-flow-domain-1.md`. Safety gate remains active until UI + server payload phases.

**Follow-up (2026-09-06):** UI picker **IMPLEMENTED** with submit guard — customizable products configurable locally; server gate still rejects bare customizable payloads; enriched create deferred to SERVER-PAYLOAD-1. Doc: `docs/admin-manual-order-customization-flow-ui-1.md`.

**Follow-up (2026-09-06 SERVER-PAYLOAD-1):** Safety gate evolved to bare-vs-configured. Configured customizable tickets validate via shared checkout validator and submit enriched `p_items`. Bare customizable still rejected. Doc: `docs/admin-manual-order-customization-flow-server-payload-1.md`.
