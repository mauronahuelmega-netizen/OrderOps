# Admin Manual Order Customization Flow — Domain 1

## 1. Objective

Implement pure domain helpers/types/adapters so a future admin manual-order customization UI and server path can produce the same enriched order item model as public checkout — without wiring UI, unblocking the safety gate, or changing `create_order`.

## 2. Spec being implemented

`docs/admin-manual-order-customization-flow-spec-1.md` — DOMAIN phase only:

- enriched ticket line model;
- simple / customized / upsell helpers;
- merge / remove / quantity / total rules;
- pure `p_items` adapter;
- reuse signature + snapshot V2 helpers.

## 3. Source ownership

| Concern | Owner |
| ------- | ----- |
| Ticket domain | `lib/orders/manual-order-customization-ticket.ts` |
| RPC adapter | `lib/orders/manual-order-customization-payload.ts` |
| Signature | `buildCartConfigurationSignature` (`lib/cart/signature.ts`) |
| Snapshot V2 | `buildCustomizationSnapshotV2` (`lib/product-customization/order-snapshot.ts`) |
| RPC JSON shape | mirrored from `toCreateOrderRpcJson` (no import of server-only `order-validation.ts`) |
| Safety gate / modal / action | **unchanged** |

## 4. Domain files added

| File | Role |
| ---- | ---- |
| `lib/orders/manual-order-customization-ticket.ts` | Types + ticket helpers |
| `lib/orders/manual-order-customization-payload.ts` | Pure `p_items` adapter |
| `lib/orders/manual-order-customization-ticket.verify.ts` | Ticket + adapter unit verifies |
| `lib/orders/admin-manual-order-customization-flow-domain.verify.ts` | Boundary contracts |

`lib/orders/manual-order-types.ts` left unchanged (product option type remains product-loader owned).

## 5. Ticket line model

`ManualOrderTicketLine`:

- `clientLineId`, `kind` (`simple` \| `customized` \| `upsell`)
- product labels, `quantity`, `unitPrice`, `lineTotal`
- `signature` (excludes parent line quantity)
- `customizationSnapshot` (V2 for customized; null otherwise)
- `parentClientLineId` (upsells)
- `displaySummary`

## 6. Simple line helper

`createManualSimpleTicketLine` → kind `simple`, snapshot null, parent null, signature via empty groups/upsells cart signature, `lineTotal = unitPrice × qty`.

## 7. Configured parent helper

`createManualConfiguredTicketLine` / `createManualConfiguredTicketBundle`:

- builds signature with selected groups + upsell product ids;
- unit price = base + Σ(option delta × option qty);
- snapshot via `buildCustomizationSnapshotV2` (wire-compatible `source: "public_checkout"`);
- upsell product prices stay on child lines, not parent unit.

## 8. Upsell child helper

`createManualUpsellTicketLine`:

- requires `parentClientLineId`;
- qty defaults to parent qty;
- snapshot null;
- child signature `upsell:{productId}|parent:{parentClientLineId}`.

## 9. Merge / remove / quantity rules

| Helper | Rules |
| ------ | ----- |
| `mergeManualTicketLine` | simple by productId; customized by productId+signature; upsell attach if parent exists; no simple↔customized merge |
| `mergeManualConfiguredSelection` | parent+children bundle merge |
| `removeManualTicketLine` | parent remove cascades children; child remove keeps parent |
| `updateManualTicketLineQuantity` | clamp 1..99; parent update syncs child qty; direct child qty edits ignored |

## 10. Estimated total helper

`getManualTicketEstimatedTotal` sums all `lineTotal` values (parents + upsells). Pure number; no currency formatting.

## 11. RPC payload adapter

`toManualOrderCreateOrderItems(lines)`:

| Line | RPC fields |
| ---- | ---------- |
| simple | `client_line_id`, `product_id`, `quantity`, `item_kind: "product"` |
| customized | + `unit_price`, `customization_snapshot` |
| upsell | `item_kind: "upsell"`, `parent_client_line_id` (no `unit_price`, matching public serializer) |

Parents emit before children. Orphans / missing snapshots → `{ ok: false }`. Not wired to `createManualOrderAction`.

## 12. Snapshot / signature reuse

| Helper | Reused? |
| ------ | ------- |
| `buildCartConfigurationSignature` | Yes |
| `buildCustomizationSnapshotV2` | Yes |
| `buildDisplaySummaryFromSelectedGroups` | Yes |
| `toCreateOrderRpcJson` | Mirrored locally (server-only module) |
| Public UI / cart storage / React | No |

## 13. Boundary preservation

- Safety gate UI strings + server eligibility remain.
- Modal TSX/CSS untouched by this phase.
- `createManualOrderAction` still maps legacy `{ product_id, quantity }` only.
- Public checkout/catalog, RPC, migrations, drawer/toolbar/footer untouched.

## 14. Verifies

All PASS:

- `manual-order-customization-ticket.verify.ts`
- `admin-manual-order-customization-flow-domain.verify.ts`
- safety / single-scroll / footer / tap / drawer trio / toolbar / terminal / search-Kanban / metrics / order_code / display

## 15. Static checks

- `npx tsc --noEmit` PASS
- `git diff --check` PASS (CRLF warnings only)
- `npm run build` PASS
- `npm run lint` known ESLint 9 circular JSON debt only

## 16. Lint evidence

Executed: `npm run lint`

Exact result: ESLint 9.39.4 failed with `TypeError: Converting circular structure to JSON` (configs → flat → plugins → react cycle). Known tooling debt only.

## 17. Runtime / boundary QA

No UI/server wiring → browser QA not required. Domain verifies + boundary source contracts cover this phase. Current modal behavior (simple allowed / customizable blocked) unchanged by construction.

## 18. Files changed

| Kind | Paths |
| ---- | ----- |
| Domain | `manual-order-customization-ticket.ts`, `manual-order-customization-payload.ts` |
| Verify | ticket + domain verifies |
| Docs | this file + CURRENT_PHASE + living audit + living memory + optional follow-ups |
| UI / CSS / actions / SQL | **NONE** |

## 19. P0–P3 findings

- **P0–P1:** none in domain layer
- **P2:** snapshot `source` still `"public_checkout"` (wire-compatible; widen to `admin_manual` deferred)
- **P3:** serializer mirror vs `toCreateOrderRpcJson` must stay in sync when public serializer changes

## 20. Hard boundaries

No UI unblock, no picker, no server wiring, no RPC/DB/migrations, no public catalog changes, no real orders, no commit/push/deploy.

## 21. Gate

`ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-DOMAIN-1` — **PASS — MANUAL ORDER CUSTOMIZATION DOMAIN HELPERS READY**

Next: `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-UI-1`

**Follow-up (2026-09-06):** UI picker **IMPLEMENTED / LOCAL ONLY** — see `docs/admin-manual-order-customization-flow-ui-1.md`. Customized submit still blocked until `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SERVER-PAYLOAD-1`.
