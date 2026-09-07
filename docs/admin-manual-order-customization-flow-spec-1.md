# Admin Manual Order Customization Flow — Spec 1

## 1. Objective

Design the full future flow so the admin **Nuevo pedido** modal can create the **same enriched order item model** as public checkout:

- simple products → quick add;
- customizable products → admin configurator;
- required/optional groups, qty-enabled extras, limits;
- upsells/Adicional as parent-linked child lines;
- correct preview pricing + server-authoritative `unit_price`;
- `customization_snapshot` V2 compatible with workspace / WhatsApp / contact;
- reuse existing `create_order` RPC **without signature changes**.

This phase is **SPEC ONLY**. No implementation.

## 2. Current state

| Surface | State |
| ------- | ----- |
| Manual modal ≤899 scroll | **SINGLE-SCROLL / FROZEN** (`body` owns overflow) |
| Simple products | **ALLOWED / RUNTIME VERIFIED** |
| Customizable products | **BLOCKED / RUNTIME VERIFIED** (UI + server gate) |
| Customization picker | **NOT IMPLEMENTED** |
| Local ticket | `{ productId, quantity }[]` only |
| Server payload | `{ product_id, quantity }` only |
| `create_order` RPC | **UNCHANGED** (accepts enriched `p_items` when present) |
| Public checkout | **UNCHANGED** |
| Workspace Products / contact | Expect persisted snapshot + tree |
| Dashboard root count / metrics | Tree-aware (exclude linked upsells) |

Baseline: safety gate remains active until a future implementation unblocks configured products safely.

## 3. Executive product decision

```text
Pedido manual completo debe producir el mismo modelo de pedido que el catálogo público.
```

| Decision | Verdict |
| -------- | ------- |
| Architecture | **Admin-native picker** + shared domain/validation/snapshot/signature helpers |
| Reuse public UI wholesale | **No** (route/theme/FAB/post-add/cart sheet assumptions) |
| Configurator placement | **In-modal subview/step** (Option 2) |
| Post-add upsell sheet | **Do not reuse** |
| Upsells in admin | **Optional Adicional section inside admin picker** (config `upsellGroup`) |
| Simple products | Keep current quick-add |
| Safety gate | Stay active until UI + server enriched path ship |
| RPC | No changes; map ticket → validated `p_items` via existing serializers |
| Snapshot `source` | Prefer widen type to `"admin_manual" \| "public_checkout"` in DOMAIN if parsers are source-agnostic; else wire-compatible `"public_checkout"` until widen is safe |

## 4. Public flow audit

| Public concern | Owner | Current behavior | Reusable for admin? | Risk |
| -------------- | ----- | ---------------- | ------------------- | ---- |
| Modal criterion | `productNeedsCustomizationModal` (`lib/product-customization/public-shared.ts`); flag `isProductCustomizationEnabled` | Modal only if `hasCustomizations`; upsell-only → quick-add; flag OFF → all simple | **Yes** (already used by safety gate) | Must stay aligned |
| Selection model | `CustomizationSelectionStateV2` (`selection-v2.ts`) | `groupId → optionId → qty`; single/multiple; qty extras via `allowsOptionQuantity`; soft normalize vs strict create limits | **Yes** | Soft UI clamp ≠ hard server reject |
| Cart line / signature | `LocalCartItemV2` + `buildCartConfigurationSignature` (`lib/cart/signature.ts`) | Signature includes product + option qtys + upsell IDs; **excludes** parent line quantity | Signature helpers **yes**; localStorage cart **no** | Collision / wrong merge |
| Quantity extras | selection-v2 + snapshot V2 | `price_delta × optionQty` in unit price | **Yes** | Under/over pricing |
| Upsell / Adicional | Post-add sheet after create; label `UPSELL_ASSOCIATED_LABEL`; modal confirm sends `selectedUpsellProductIds: []` | Decision helpers **yes**; sheet UI **no** | Admin should select Adicional in-picker |
| Order validation | `validateCheckoutCartForCreateOrder` (`order-validation.ts`) | Reloads config; validates groups/qty/upsells; forces upsell qty = parent qty; builds snapshot; recomputes prices | **Yes** (preferred server path) | Depends on public config loader |
| Snapshot | `buildCustomizationSnapshotV2` (`order-snapshot.ts`) | V2 groups + pricing + summary; `source: "public_checkout"` | **Mostly** | Source enum widen may be needed |
| RPC payload | `toCreateOrderRpcJson` → `p_items` | See §11 | **Yes** | Wrong omit of `unit_price` |
| Public UI shell | `customization-modal.tsx`, catalog-client, cart-bar/sheet, post-add sheet, `/b/[slug]/*` | Customer-facing flow | **No** | Theme/portal/FAB coupling |

## 5. Manual order current flow audit

| Manual concern | Owner | Current behavior | Change needed later? | Risk |
| -------------- | ----- | ---------------- | -------------------- | ---- |
| Product loader | `getManualOrderProductOptions` (`lib/products/admin.ts`) | Available products + eligibility flags | Extend with config/summary for picker | Low |
| Simple vs customizable | Eligibility helpers + `productNeedsCustomizationModal` | Flag-aware block when `hasCustomizations` | UI: open picker; server: reject bare customizable | Medium |
| Simple add | `addProduct` in `manual-order-modal.tsx` | Aggregate qty on same productId | Preserve | Low |
| Customizable block | Badge + disabled `+` + client/server gate | Hard block | Replace with configurator open | Low today |
| Local ticket | `SelectedManualOrderItem = { productId, quantity }` | Flat only | Rich lines + children | High if naively extended |
| Preview total | `Σ catalog.price × qty` | Base only | Include deltas + upsells | High misprice |
| Server payload | `CreateManualOrderInput.items` | `{ productId, quantity }` | Enriched checkout-compatible payload | High |
| Safety gate | `resolveManualOrderProductEligibilityMap` in `createManualOrderAction` | Rejects blocked products | Evolve to bare-vs-configured rules | Medium |
| `create_order` | Same RPC; legacy `p_items` | Works for simple | Call with validated enriched items | High if unvalidated |
| Hydration | `getAdminDashboardOrderById` → dashboard insert | Full order | Fine if RPC persists tree/snapshot | Medium |
| Single-scroll | CSS ≤899 body owner | FROZEN | Preserve across subview | Medium UX |

## 6. Downstream compatibility audit

| Downstream surface | Input expected | Manual customized order impact | Required compatibility |
| ------------------ | -------------- | ------------------------------ | ---------------------- |
| Workspace Products | Tree + `customization_snapshot` V1/V2 via `buildOrderPreparationItems` | Without snapshot → flat name only | Persist V2 snapshot + `item_kind` + parent link |
| WhatsApp / contact / Copy / Share | `buildCustomerOrderSummary` → formatters | Groups + Adicional children from tree/snapshot | Same persisted shape as public |
| Dashboard card root count | `buildDashboardOrderCardSummary` | Linked upsells excluded from root count | Never emit flat root upsells |
| Metrics top product | `getTopProducts` via item tree | Roots only | Same tree semantics |
| Order detail / realtime | Preview items with kind/snapshot | Hydration must include fields | Existing admin fetch already selects them |
| `order_code` / UUID | Identity unchanged | No change | Do not touch generators |

## 7. Recommended architecture

| Option | Verdict | Why | Future phase impact |
| ------ | ------- | --- | ------------------- |
| **C — Admin-native picker + shared helpers** | **RECOMMENDED** | Admin visual/scroll/focus control; reuses selection/validation/snapshot/signature; avoids public theme/FAB/post-add | DOMAIN extract/adapters → UI panel → SERVER payload |
| D — Embed public modal/flow | **REJECT** | Couples to `/b/[slug]`, public theme, cart FAB, post-add sheet, customer copy | High regression surface |
| Hybrid “import public modal CSS/portal” | **REJECT** | Nested dialog + scroll debt | Violates single-scroll freeze |

Principles:

1. Reuse **lib** contracts (`selection-v2`, `order-validation`, `order-snapshot`, `signature`, `public-shared`).
2. Build **admin** panel CSS (module) inside manual modal.
3. Do **not** import `components/public/**` for the picker.
4. Prefer adapting `CheckoutCartPayload` → `validateCheckoutCartForCreateOrder` → `toCreateOrderRpcJson` on the server rather than inventing a parallel validator.

## 8. UI flow specification

### Preferred shell (preserve single-scroll)

```text
ManualOrderModal
  Header (stable)
  Body (≤899 sole scroll)
    view = "compose" | "configure"
    compose:
      Cliente / Entrega
      Products (search + rows)
      Ticket (lines + notes)
    configure:
      Configurar {productName}
      Groups / options / Adicional
      Parent qty
  Footer CTA (compose: Cancelar / Crear; configure: Volver / Confirmar)
```

### Configurator placement

| UI option | Verdict | Reason |
| --------- | ------- | ------ |
| 1 Inline expanded row | Reject primary | List length + awkward on mobile |
| **2 In-modal subview/step** | **RECOMMENDED** | One scroll owner; clear back/confirm; no nested portal |
| 3 Nested portal/modal | Reject | Focus/scroll stack; bad ≤899 |

### Behavior

| Step | Behavior |
| ---- | -------- |
| Simple `+` | Add/aggregate ticket line; no subview |
| Customizable `+` | Switch body to configure subview; load product config |
| Incomplete required | Confirm disabled or inline error; no ticket mutation |
| Confirm | Add parent (+ optional Adicional children); return to compose |
| Volver / Cancel config | Discard draft; no ticket mutation |
| Ticket display | Parent name, qty, unit/line price, summary chips from snapshot/summary; nested Adicional |
| Remove parent | Removes attached children |
| Edit configured parent | **Include in UI phase** (reopen subview; replace-in-place like public `replaceCartLineId`) |
| Mobile/tablet | Preserve ≤899 single-scroll; footer coherent |
| Desktop | Dual-pane compose OK; configure subview may span workstation |

## 9. Local ticket model specification

Current:

```ts
{ productId, quantity }
```

Future conceptual model (exact TS names deferred to DOMAIN):

```ts
type ManualOrderTicketLine = {
  clientLineId: string;
  productId: string;
  productName: string;
  categoryName?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number; // unitPrice * quantity (preview)
  kind: "simple" | "customized" | "upsell";
  customizationSnapshot: CustomizationSnapshot | null;
  selectedGroups?: CheckoutCustomizedGroupPayload[]; // draft mirror for edit/resubmit
  parentClientLineId?: string | null;
  configurationSignature: string;
  displaySummary: string[]; // chips / lines for ticket UI
};
```

| Field | Purpose | Source | Required for RPC? | Required for UI? |
| ----- | ------- | ------ | ----------------- | ---------------- |
| `clientLineId` | Stable local identity; parent/child link | UUID at create | Yes (`client_line_id`) | Yes |
| `productId` | Product ref | Catalog | Yes | Yes |
| `productName` | Ticket label | Catalog/config | No (RPC uses DB) | Yes |
| `quantity` | Parent or child qty | UI | Yes | Yes |
| `unitPrice` | Preview unit | Validated selection / catalog | Customized parent yes; simple omit | Yes |
| `lineTotal` | Preview | Client calc | No | Yes |
| `kind` | simple / customized / upsell | Derived | Maps to `item_kind` | Yes |
| `customizationSnapshot` | Prep/WhatsApp parity | Builder V2 | Customized parent yes | Summary yes |
| `selectedGroups` | Edit/resubmit | Selection state | Via checkout payload | Edit |
| `parentClientLineId` | Upsell link | Parent id | Upsell yes | Nesting |
| `configurationSignature` | Merge/dedupe | Signature builder | Indirect (validation) | Merge |
| `displaySummary` | Human review | Snapshot summary | No | Yes |

### Rules

1. Simple products aggregate by `productId` (legacy signature).
2. Same customized signature → merge quantity (children remap to surviving parent id).
3. Same product, different signature → separate lines.
4. Upsell children stay attached to parent.
5. Remove parent → remove children.
6. Parent qty change → children qty track parent (public parity).
7. Edit configured parent included in UI phase (replace-in-place).
8. Ticket must show enough detail to review before submit.

## 10. Validation specification

| Validation | Client | Server | Error UX | Owner |
| ---------- | ------ | ------ | -------- | ----- |
| Required groups complete | Yes (disable Confirm / inline) | Yes (hard reject) | Field/group message | selection-v2 + validateCustomizationSelection |
| Option belongs to group/product | Soft | Hard via config reload | Generic invalid selection | order-validation |
| Max group / option qty | Soft clamp + block | `isSelectionStrictlyWithinLimits` | “Seleccionaste más…” style | selection-v2 |
| Disabled / unavailable option | Prevent select | Reject | Unavailable copy | config loader |
| Parent quantity 1..99 | Yes | Yes | Field error | modal + validation |
| Upsell allowlist | Show eligible only | Allowlist from `upsellGroup` | Reject unknown | resolve + validation |
| Bare customizable submit | Block in UI | Reject | Safety message | evolved gate |
| Price / snapshot | Preview only | Recompute | Silent recompute or reject | order-validation |
| Tenant / business | N/A | From admin context only | Auth error | createManualOrderAction |
| Client trust | Never authoritative | Never trust price/eligibility/tenant | — | Hard rule |

## 11. RPC payload specification

**Do not modify RPC.** Map ticket → same shapes public already sends via `toCreateOrderRpcJson`.

| Manual ticket line | RPC item fields | Notes |
| ------------------ | --------------- | ----- |
| Simple parent | `client_line_id`, `product_id`, `quantity`, `item_kind: "product"` | Prefer explicit `client_line_id`; legacy `{product_id,quantity}` still acceptable for simple-only path |
| Customized parent | + `customization_snapshot` (V2), `unit_price` (= final_unit_price) | Omit snapshot → wrong path; never fake snapshot |
| Upsell child | `client_line_id`, `product_id`, `quantity`, `item_kind: "upsell"`, `parent_client_line_id` | No snapshot; no `unit_price` (RPC prices from product); qty = parent qty |

Hard boundaries:

- no RPC signature changes;
- no migration;
- no `order_code` changes;
- no client-authoritative totals;
- no fake snapshots;
- server rebuilds/verifies snapshot before RPC.

## 12. Safety gate evolution

| Product type | Current behavior | Future behavior | Server rule |
| ------------ | ---------------- | --------------- | ----------- |
| Simple | Quick add | Quick add | Allow legacy simple |
| Customizable bare | Blocked | Still reject if submitted bare | Reject |
| Customizable configured | Impossible | Allow after validation | Allow enriched |
| Upsell child | Unsupported | Attach to parent | Require valid parent in same payload |

UI evolution: badge/disabled `+` → enabled `+` opens configure subview (only when picker shipped). Until then gate stays.

## 13. Upsell / Adicional specification

| Upsell concern | Decision | Owner / dependency |
| -------------- | -------- | ------------------ |
| Placement | **Inside admin picker** as optional Adicional section | `upsellGroup` from public config |
| Post-add sheet | **Do not reuse** | Avoid public cart lifecycle |
| Parent link | Child `parentClientLineId` / RPC `parent_client_line_id` | signature includes upsell IDs |
| Child item | `kind: "upsell"`, no snapshot | order-validation |
| Pricing | Product price × qty; qty tracks parent | RPC omits unit_price for upsell |
| Workspace | Render under parent as Adicional | order-preparation |
| WhatsApp/contact | Nested under parent | customer-order-summary |
| Dashboard root count | Exclude linked children | dashboard-card-summary |

## 14. Pricing / total semantics

| Price component | Formula | Client preview | Server authority |
| --------------- | ------- | -------------- | ---------------- |
| Base | `products.price` | Yes | Reload |
| Options | `Σ(price_delta × optionQty)` | Yes | Recompute |
| Qty extras | Included in option formula | Yes | Strict limits |
| Parent unit | `base + customization_total` | Yes | `unit_price` on RPC |
| Parent line | `unit × parentQty` | Yes | Order total via RPC |
| Upsell child | product price × qty (= parent qty) | Yes | RPC pricing |
| Ticket estimate | Σ line totals | Estimate only | Non-authoritative |
| Order total | Persisted by `create_order` | Never invent | Final authority |

After creation: never re-derive price from live config; use persisted snapshot/prices.

## 15. Compatibility matrix

| Surface | Expected after future impl | Required invariant |
| ------- | -------------------------- | ------------------ |
| Manual ticket preview | Shows config summary + Adicional + totals | Reviewable before submit |
| Dashboard card | Root products only in count/summary | Upsells not inflate roots |
| Order detail | Full items | Snapshot present |
| Workspace Products | Groups / options / Adicional hierarchy | Same as public |
| WhatsApp / Copy / Share | Structured content under parent | Snapshot-driven |
| Metrics top product | Roots only | Tree semantics |
| `order_code` | Visible refs unchanged | No generator change |
| UUID | Internal identity unchanged | — |
| Realtime hydration | Insert full order | Existing hydrate path |

## 16. Future phase breakdown

Fewer than six mega-phases would compress risk; recommended sequence remains phased:

| Future phase | Scope | Files likely touched | Gate |
| ------------ | ----- | -------------------- | ---- |
| **1. FLOW-SPEC-1** (this) | Spec only | docs | SPEC COMPLETE |
| **2. FLOW-DOMAIN-1** | Ticket types, adapters to `CheckoutCartPayload`, signature/merge helpers, snapshot source widen if needed, verifies | `manual-order-types.ts`, new `lib/orders/manual-order-customization-*.ts`, possibly thin wrappers around cart/order helpers | DOMAIN READY |
| **3. FLOW-UI-1** | Compose ↔ configure subview; selection UI; ticket display; edit/remove; preserve single-scroll; keep server gate blocking bare customizable | `manual-order-modal.tsx` + module CSS; new panel component + module CSS | UI READY (submit still gated or dry) |
| **4. FLOW-SERVER-PAYLOAD-1** | Evolve safety gate; validate via `validateCheckoutCartForCreateOrder` (or twin); `toCreateOrderRpcJson`; call `create_order`; no RPC changes | `actions.ts`, safety helpers | SERVER READY |
| **5. FLOW-RUNTIME-QA-1** | Authenticated matrix; limited safe fixture submit if authorized | docs | QA PASS |
| **6. FINAL-CLOSEOUT-1** | Mobile orders polish package closeout | docs / optional commit package | CLOSEOUT |

Principles: domain before UI; UI before allowlist change; server validation before unblocking submit; QA before closeout; **no deploy before full QA**.

**Next phase:** `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-DOMAIN-1`

## 17. File map

| File | Future role | Risk | Phase |
| ---- | ----------- | ---- | ----- |
| `components/admin/orders/manual-order-modal.tsx` | State machine compose/configure; ticket | Medium | UI |
| `components/admin/orders/manual-order-modal.module.css` | Preserve single-scroll; subview layout | Medium | UI |
| `components/admin/orders/manual-order-customization-panel.tsx` | Admin-native picker | Medium | UI |
| `components/admin/orders/manual-order-customization-panel.module.css` | Admin tokens only | Low | UI |
| `lib/orders/manual-order-types.ts` | Rich ticket + input types | Medium | DOMAIN |
| `lib/orders/manual-order-customization-payload.ts` | Ticket → CheckoutCartPayload | High | DOMAIN/SERVER |
| `lib/orders/manual-order-customization-eligibility.ts` | Evolve bare vs configured | Medium | SERVER |
| `lib/orders/manual-order-customization-safety.ts` | Server map evolution | High | SERVER |
| `lib/product-customization/order-validation.ts` | Reuse as-is | Low if reused | SERVER |
| `lib/product-customization/order-snapshot.ts` | Optional `source` widen | Low–Med | DOMAIN |
| `lib/product-customization/selection-v2.ts` | Reuse | Low | DOMAIN/UI |
| `lib/cart/signature.ts` / pure merge helpers | Reuse | Medium | DOMAIN |
| `app/admin/(protected)/orders/actions.ts` | Enriched create path | High | SERVER |
| `lib/products/admin.ts` | Config/summary for picker load | Medium | DOMAIN/UI |
| Verify scripts per phase | Contracts | Low | each |
| `components/public/**` | **Unchanged** | — | — |
| `create_order` / migrations | **Unchanged** | — | — |

## 18. QA plan

### Fixtures

- Coca Cola 500ml (simple)
- BBQ Bacon (customizable)
- Doble Smash (customizable)
- Product with required group
- Product with optional extras
- Qty-enabled extras (if fixture)
- Upsell/Adicional (if fixture)

### Scenarios

1. Simple add / qty / total
2. Customizable incomplete → Confirm blocked
3. Required complete → ticket line
4. Optional extras on/off
5. Qty extra 1→2→limit
6. Over-limit rejected
7. Upsell child attached
8. Same config merge
9. Different config separate line
10. Remove parent removes child
11. Edit parent updates signature/children
12. Submit only when authorized safe fixture
13. Workspace prep matches public structure
14. WhatsApp/copy/share matches snapshot
15. Dashboard root count excludes children
16. `order_code` visible works
17. Single-scroll ≤899 preserved
18. Desktop ≥900 compose dual-pane OK

### Viewports

360 / 390 / 412 / 430 / 719 / 768 / 899 / 900 / 1024 / 1440 — dark + light samples.

No production order unless explicitly authorized.

## 19. P0–P3 risks

| Risk | Finding | Mitigation | Future phase |
| ---- | ------- | ---------- | ------------ |
| P0 | Breaking `create_order` / RPC signature | Never change RPC; reuse serializers | SERVER |
| P0 | Wrong tenant / forged product IDs | Admin context + config reload | SERVER |
| P0 | Public checkout regression | Do not touch public paths | all |
| P1 | Required options omitted | Client + server validation | UI + SERVER |
| P1 | Underpricing / client price trust | Recompute `unit_price` server-side | SERVER |
| P1 | Stale/forged snapshot accepted | Rebuild snapshot from config | SERVER |
| P1 | Detached upsell / root inflation | Parent link + tree consumers | DOMAIN + QA |
| P1 | Workspace/WhatsApp mismatch | Persist V2 snapshot | SERVER + QA |
| P2 | Nested scroll returns | Preserve ≤899 body owner; subview not portal | UI |
| P2 | Ticket cannot review config | displaySummary chips | UI |
| P2 | Edit/remove unclear | Explicit edit + cascade remove | UI |
| P3 | Copy / animation polish | Later | closeout |
| P3 | Physical Android keyboard | Device QA | RUNTIME-QA |

## 20. Files inspected

**Public flow:** `public-shared.ts`, `selection-v2.ts`, `order-types.ts`, `order-validation.ts`, `order-snapshot.ts`, `lib/cart/local.ts`, `lib/cart/signature.ts`, checkout actions, public customization docs / post-add docs.

**Manual flow:** `manual-order-modal.tsx`, `.module.css`, `actions.ts` (`createManualOrderAction`), `manual-order-types.ts`, `lib/products/admin.ts`, eligibility/safety helpers, prior audit/safety/single-scroll docs.

**Downstream:** `order-preparation.ts`, `order-dashboard.ts`, `customer-order-summary.ts`, `lib/whatsapp/admin.ts`, dashboard card summary / metrics helpers, workspace prep + contact messaging docs.

**Docs:** CURRENT_PHASE, living audit, living memory, D3 audits, public multi-qty + post-add specs.

## 21. Files changed

| Kind | Paths |
| ---- | ----- |
| Runtime | **NONE** |
| CSS | **NONE** |
| SQL/migration | **NONE** |
| Docs | this file; `docs/CURRENT_PHASE.md`; `docs/admin-dashboard-forensic-living-audit.md`; `ORDEROPS_LIVING_MEMORY.md`; optional follow-up notes |

## 22. Hard boundaries

- No runtime / CSS / DB / SQL / RPC / package changes in this phase.
- No public catalog/checkout changes.
- No real orders.
- Current safety gate remains active.
- Manual single-scroll remains frozen.
- No commit / push / deploy.

## 23. Gate

`ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SPEC-1` — **SPEC COMPLETE — READY FOR PHASED IMPLEMENTATION**

Next: `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-DOMAIN-1`

**Follow-up (2026-09-06):** Domain helpers **IMPLEMENTED** — see `docs/admin-manual-order-customization-flow-domain-1.md`. Picker UI and server wiring still not implemented; safety gate remains active. Next: `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-UI-1`.

**Follow-up (2026-09-06):** UI picker **IMPLEMENTED / LOCAL ONLY** — see `docs/admin-manual-order-customization-flow-ui-1.md`. Enriched submit still blocked; next `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SERVER-PAYLOAD-1`.
