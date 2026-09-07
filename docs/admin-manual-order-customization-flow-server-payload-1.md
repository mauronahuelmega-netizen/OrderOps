# Admin Manual Order Customization Flow — Server Payload 1

## 1. Objective

Wire the admin manual-order create path so locally enriched customization tickets can be submitted safely: server validates selection intent, recomputes price/snapshot, and serializes `create_order`-compatible `p_items` without changing the RPC signature.

## 2. UI/domain prerequisites

| Phase | Status |
| ----- | ------ |
| DOMAIN-1 | Pure ticket + preview adapter |
| UI-1 | Admin-native picker + local ticket |
| SAFETY-GATE-1 | Bare customizable blocked |
| SERVER-PAYLOAD-1 (this) | Enriched submit + bare-vs-configured gate |

## 3. Product decision

| Concern | Decision |
| ------- | -------- |
| Simple products | Legacy/simple create remains allowed |
| Configured customizable | Server-validated enriched `p_items` |
| Bare customizable | Rejected before RPC |
| Upsells/Adicional | Child lines with `parent_client_line_id` |
| Client price/snapshot/tenant | Never authority |
| `create_order` | Unchanged |

## 4. Source ownership

| Concern | Owner |
| ------- | ----- |
| Server action | `app/admin/(protected)/orders/actions.ts` |
| Input types | `lib/orders/manual-order-types.ts` (`ManualOrderCreateTicketLineInput`) |
| Checkout cart builder | `lib/orders/manual-order-customization-payload.ts` |
| Shared validation | `validateCheckoutCartForCreateOrder` + `toCreateOrderRpcJson` |
| Safety eligibility | `resolveManualOrderProductEligibilityMap` → bare reject helper |
| Client submit | `manual-order-modal.tsx` via `manualTicketLinesToCreateInput` |
| Ticket selection intent | `selectedGroups` on customized `ManualOrderTicketLine` |
| Public checkout UI | Untouched |
| RPC SQL | Untouched |

## 5. Input contract

`CreateManualOrderInput`:

- **Legacy:** `items?: { productId, quantity }[]` (still supported).
- **Enriched (preferred):** `ticketLines?: ManualOrderCreateTicketLineInput[]`
  - `simple` | `customized` | `upsell`
  - customized carries `selectedGroups` + `configurationSignature`
  - upsell carries `parentClientLineId`

Accepted from client: productId, quantity, clientLineId, selectedGroups, configurationSignature, parent relation.

Ignored/recomputed: unitPrice, lineTotal, customizationSnapshot, product name/category, tenant/`business_id`.

Tenant always from `requireAdminPermission` → `adminContext.businessId`.

## 6. Server validation architecture

```text
ticketLines
  → manualCreateTicketLinesToCheckoutCart (structural)
  → rejectBareCustomizableProducts on legacyItems
  → validateCheckoutCartForCreateOrder (shared public validator)
  → toCreateOrderRpcJson
  → create_order(p_items) unchanged
```

Reuses public validator for required/optional groups, qty extras, max limits, upsells, parent/child qty sync, final unit price, snapshot V2. No parallel second validator.

Legacy `items` path: eligibility gate only + simple `{product_id, quantity}` RPC payload.

## 7. Safety gate evolution

| Case | Behavior |
| ---- | -------- |
| Simple product | Allow |
| Customizable as simple / bare | Reject (`VALIDATION_ERROR`) |
| Customizable configured | Validate then allow |
| Upsell orphan / wrong parent | Reject |
| Upsell on valid configured parent | Allow if config permits |

Spanish UX copies (examples):

- `Este producto requiere configuración antes de crear el pedido.`
- `La configuración del producto está incompleta o ya no está disponible.`
- `Hay un adicional sin producto principal. Revisá el ticket.`

## 8. RPC payload mapping

Via public `toCreateOrderRpcJson`:

- Simple → product/quantity (`legacy:{productId}` client_line_id from public serializer).
- Customized parent → `unit_price` + `customization_snapshot`.
- Upsell → `item_kind: "upsell"` + `parent_client_line_id`; no `unit_price`.
- Parent before child.
- RPC signature unchanged.

## 9. Client submit wiring

- Temporary UI guard removed for valid enriched tickets.
- Submit sends `ticketLines` only (never customized as bare `{productId,quantity}`).
- Client blocks incomplete configured / orphan upsell / bare customizable.
- Double-submit lock preserved.
- Preview totals remain UI-only.

## 10. Snapshot/source decision

Keep wire-compatible `source: "public_checkout"` from shared V2 builder.

**P2 follow-up:** widen to `admin_manual` only after parsers/types are source-agnostic.

## 11. Order creation result/hydration

`createManualOrderAction` still returns `{ ok: true, order: AdminOrderDashboardItem }` via `getAdminDashboardOrderById`. Dashboard insert/hydrate unchanged. `order_code` still from `create_order`.

## 12. Runtime no-submit QA

Authenticated browser smoke requested; **Crear pedido not clicked** in this phase by default.

Result: **CLOSED in FLOW-RUNTIME-QA-1 MODE A** — see `docs/admin-manual-order-customization-flow-runtime-qa-1.md`. MODE B submit still deferred until explicit authorization.

## 13. Optional submit QA status

| Field | Value |
| ----- | ----- |
| authorized | NO |
| order_code | N/A |
| result | DEFERRED TO FLOW-RUNTIME-QA-1 |

## 14. Verifies

- `lib/orders/admin-manual-order-customization-flow-server-payload.verify.ts` — PASS
- Domain/ticket/UI/safety/single-scroll + frozen shell verifies — PASS

## 15. Static checks

- `npx tsc --noEmit` — PASS (after Json cast alignment with public checkout)
- `git diff --check` — PASS (CRLF warnings only)
- `npm run build` / `npm run lint` — executed in phase closeout

## 16. Lint evidence

executed: YES (`npm run lint`)
exact result:

```text
TypeError: Converting circular structure to JSON
ESLint 9 / React plugin cycle
```

known debt only: YES

## 17. Files changed

| Area | Files |
| ---- | ----- |
| Server | `app/admin/(protected)/orders/actions.ts` |
| Types | `lib/orders/manual-order-types.ts` |
| Payload | `lib/orders/manual-order-customization-payload.ts` |
| Ticket | `lib/orders/manual-order-customization-ticket.ts` (`selectedGroups`) |
| UI | `components/admin/orders/manual-order-modal.tsx` |
| Verify | `admin-manual-order-customization-flow-server-payload.verify.ts` (+ domain/UI/safety asserts) |
| Docs | this file, CURRENT_PHASE, living audit, living memory |

Unchanged: SQL/migrations, public checkout/catalog, drawer/toolbar/footer, globals/theme, `create_order` signature.

## 18. P0–P3 findings

| Sev | Finding |
| --- | ------- |
| P0 | None |
| P1 | None |
| P2 | Snapshot `source` still `public_checkout` (intentional wire compatibility) |
| P3 | Interactive no-submit browser matrix deferred to RUNTIME-QA-1 |

## 19. Hard boundaries

No RPC signature change, no migrations, no public UI imports, no dashboard Kanban/search/metrics, no drawer/toolbar/footer, no real orders unless authorized, no commit/push/deploy.

## 20. Gate

**ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SERVER-PAYLOAD-1 = PASS — MANUAL ORDER CUSTOMIZATION SERVER PAYLOAD READY**

(with order-submit runtime QA deferred)

Next: `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-RUNTIME-QA-1`
