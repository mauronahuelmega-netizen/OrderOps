# Admin Manual Order Modal — Mobile Scroll & Customization Audit 1

## 1. Objective

Forensic audit of the admin **Nuevo pedido / Pedido manual** modal before any implementation:

1. Map exact mobile/tablet/desktop **scroll owners**.
2. Determine **customization parity** vs public checkout / workspace / WhatsApp.
3. Recommend a safe future phase sequence (no code changes in this phase).

## 2. Executive verdict

| Axis | Verdict |
| ---- | ------- |
| Scroll | **Confirmed nested scroll trap** on ≤899px: `products-scroll` + `summary-scroll` + often `workstation` |
| Customization | **INCOMPLETE** — simple `{product_id, quantity}` only; no picker, no snapshot, no required-group gate |
| Risk level | **P1 functional** (pricing / prep / WhatsApp) + **P2 UX** (nested scrolls) |
| Recommended next | **`ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1`** first; single-scroll only after gate or explicit simple-only product decision |

**Gate label:** AUDIT COMPLETE — MANUAL ORDER CUSTOMIZATION PATH DECISION REQUIRED

Scroll-only polish alone is **not** acceptable while customizable catalog products remain freely addable at base price.

## 3. Source ownership

| Surface | Owner |
| ------- | ----- |
| Modal UI | `components/admin/orders/manual-order-modal.tsx` |
| Modal CSS | `components/admin/orders/manual-order-modal.module.css` |
| Shell (portal/dialog) | `components/admin/orders/admin-order-modal-shell.tsx` + `admin-order-modal.module.css` |
| Mount | `components/admin/orders/admin-dashboard-orders.tsx` → `<ManualOrderModal />` |
| Open trigger | `DashboardToolbar` `onCreateManualOrder` → `handleOpenManualOrderModal` |
| Product options fetch | `getManualOrderProductOptionsAction` → `lib/products/admin.ts` `getManualOrderProductOptions` |
| Create action | `createManualOrderAction` in `app/admin/(protected)/orders/actions.ts` |
| Types | `lib/orders/manual-order-types.ts` (`ManualOrderProductOption`) |
| RPC | `public.create_order` (same as public checkout; enriched payload optional) |
| Public comparator | `app/b/[slug]/checkout/actions.ts` + `lib/product-customization/order-validation.ts` |
| Workspace/prep | `lib/product-customization/order-preparation.ts` / `order-dashboard.ts` |
| Contact/WhatsApp | `lib/orders/customer-order-summary.ts` + `lib/whatsapp/admin.ts` |

## 4. Current modal architecture

### Mount / shell

- Rendered only from admin dashboard orders surface.
- `AdminOrderModalShell` `variant="workstation"` via `createPortal` → `document.body`.
- `role="dialog"` `aria-modal="true"` `aria-label="Nuevo pedido"`.
- Overlay click closes; Escape closes; focuses close button.
- Body/html `overflow: hidden` while open (scroll lock). **No full focus trap** beyond initial close focus.
- Workstation shell body: `overflow: hidden` (does **not** scroll); scrolling is delegated inward.

### Props

`isOpen`, `onClose`, `onCreated`, `onSessionMutationBlocked`, `canCreateOrder`, `products`, `isProductsLoading`, `productsError`, `onRefreshProducts`.

### Local state

Customer name/phone, delivery method, address, notes, search query, `selectedItems: { productId, quantity }[]`, field errors, submit transition.

### Actions

- Local add/qty only until submit.
- Submit → `createManualOrderAction` → `create_order` RPC with legacy items.
- Success → `onCreated(order)` + close/reset.

### Breakpoints (CSS)

| Breakpoint | Effect |
| ---------- | ------ |
| Default / ≤639 | Stacked workstation; products `max-height: min(38vh,320px)`; summary `min(24vh,200px)`; footer full-width stacked |
| 640–899 | Products+summary max-height **180px**; denser padding |
| ≤899 | **`.workstation { overflow-y: auto }`** (third scroll owner) |
| ≥900 | 2-column workstation; products `max-height: none`; summary `min(32vh,220px)`; workstation overflow not forced |

## 5. Scroll owners map

| Owner | Selector | Mobile behavior (≤639 / typical phone) | Tablet 640–899 | Desktop ≥900 | Risk |
| ----- | -------- | -------------------------------------- | -------------- | ------------ | ---- |
| Shell panel body | `.admin-order-modal-shell__body--workstation` | `overflow: hidden` | same | same | Contains form; not a scroll owner |
| Form body | `.manual-order-modal__body` | `overflow: hidden` | same | same | Customer strip + workstation; no scroll |
| Workstation | `.manual-order-modal__workstation` | **`overflow-y: auto`** (≤899) — often active | often active | `visible` (dual pane) | **P2** outer nested scroll |
| Products list | `.manual-order-modal__products-scroll` | `overflow-y: auto`, max `min(38vh,320px)` | max **180px** | `auto`, max none | **P2** competing scroll; holds product rows |
| Ticket summary | `.manual-order-modal__summary-scroll` | `overflow-y: auto`, max `min(24vh,200px)` | max **180px** | `auto`, max ~220px | **P2** competing scroll; holds ticket lines |
| Notes textarea | native textarea | may scroll internally | same | same | Low |
| Footer / CTA | `.manual-order-modal__footer` | sticky bottom, outside body scroll | same | same | Generally visible; not inside nested lists |

**Prior finding confirmed:** `products-scroll + summary-scroll + workstation overflow ≤899`.

Why it feels “split”: two capped panes + outer workstation scroll create **three competing scroll gestures** on the same surface; customer fields sit above and do not share that scroll continuum.

**Future single-scroll target (visual only, after safety):**

- Preferred mobile owner: **one** vertical scroller on body/form (or workstation without nested max-heights).
- Collapse/remove nested `max-height` on products + summary for ≤899.
- Keep footer sticky / outside the scroll owner.

## 6. Runtime QA observations

Authenticated localhost; **no Create pedido**; Cancel close.

| Viewport | Observation |
| -------- | ----------- |
| 360 dark | 3 active scrollers: workstation + products + summary; footer visible; body locked |
| 390 dark | Same triple nest; add BBQ + Doble Smash local ticket OK; **no customization UI** |
| 412 / 430 | Triple nest confirmed |
| 719 | Dual nest products+summary (180px); workstation may idle if content fits |
| 768 / 899 | Triple nest + 180px caps — **awkward tablet** |
| 900 / 1024 / 1440 | Dual-pane; workstation visible; summary capped; products `overflow:auto` without mobile max — **acceptable ops layout** |
| 390 light | Same nest; closed via Cancelar; body scroll restored |

Also observed product catalog in picker: `BBQ Bacon`, `Doble Smash`, drinks, and labels like **`uno de BBQ Bacon` / `uno de Doble Smash`** (likely Adicional SKUs exposed as standalone available products) — still addable with base price only.

Keyboard: virtual keyboard not exercised on real Android (P3 debt). Overlay/Escape/Cancel OK. No submit.

## 7. Manual order data model

### Eligible product (`ManualOrderProductOption`)

`{ id, name, price, categoryName?, isAvailable }`

Loaded via `getManualOrderProductOptions`: all `products` with `is_available = true` for tenant. **Does not** select/filter `product_customization_enabled` or groups.

### Ticket item (client)

`{ productId, quantity }` only.

### Preview total

Client: `sum(product.price * quantity)` from base product price.

### Server validation

Same shape; no customization fields.

| Layer | Current fields | Customization fields present? | Risk |
| ----- | -------------- | ----------------------------- | ---- |
| Product option | id, name, price, category, availability | No | Lists customizable SKUs as simple |
| Selected item | productId, quantity | No | Can add required-customization parents bare |
| Action payload | customer + items[{productId,quantity}] | No | Omits snapshot/upsells |
| RPC legacy item | product_id, quantity | Optional snapshot ignored if absent | Base price only |
| order_items write | product fields + null snapshot | Snapshot null for manual | Prep/WA incomplete |

## 8. Create action / RPC contract

### `createManualOrderAction`

1. `requireAdminPermission("updateOrders")`
2. Validate customer/items
3. Active store session guard
4. `supabase.rpc("create_order", { … p_items: [{ product_id, quantity }] })`
5. Hydrate dashboard order by id

### Same RPC as public?

**Yes** — `create_order`. Public path builds enriched `p_items` via `validateCheckoutCartForCreateOrder` → `toCreateOrderRpcJson` (snapshots, unit_price, upsell children, client_line_id). Manual path uses **legacy-only** items.

### Totals owner

RPC: for items **without** snapshot, `unit_price = products.price`; total = Σ(unit × qty). Client preview is advisory.

### Snapshots / upsells

RPC **supports** `customization_snapshot`, `unit_price`, `item_kind=upsell`, `parent_client_line_id` (migration `20260713030000_…`). Manual action **never sends** them.

### order_code

Generated inside order creation path (separate from item shape). Manual use of same RPC **preserves** order_code behavior; do not casually alter RPC for this UX.

## 9. Public customization parity matrix

| Capability | Public checkout | Manual order current | Gap | Severity |
| ---------- | --------------- | -------------------- | --- | -------- |
| Simple products | Yes | Yes | None | — |
| Required groups | Validated + snapshot | Not prompted; addable bare | Large | **P1** |
| Optional groups | Yes | No | Large | **P1** |
| Single / multi choice | Yes | No | Large | **P1** |
| Qty-enabled extras | Yes | No | Large | **P1** |
| Group/option maxes | Yes | No | Large | **P1** |
| Upsells / Adicional | Child rows + parent link | Separate SKUs may appear as roots; no parent link | Large | **P1** |
| Pricing (extras) | Snapshot / unit_price | Base only | Underprice risk | **P1** |
| Snapshots V1/V2 | Yes | Null | Prep/WA/dashboard tree | **P1** |
| Workspace Products | Snapshot-driven inline | Name/qty only for manual creates | Incomplete prep | **P1** |
| WhatsApp / contact summary | Snapshot-aware | Product name only | Mismatch vs public | **P1** |
| Dashboard card / root count | Tree-aware | Roots without children | Count/summary drift | **P1**/P2 |
| UI gate for customizable | Cart blocks incomplete | **None** | Ungated | **P1** |

## 10. Workspace / preparation / contact impact

- `buildOrderPreparation` / dashboard tree / customer summary all tolerate `customization_snapshot: null` → fall back to product name lines.
- Manual order of a burger that **should** have required groups creates a **valid DB order** that is **operationally incomplete** (kitchen misses options; WA omits selections; totals may exclude paid extras).
- Not a crash bug — a **silent correctness** gap.

## 11. Safety risks

| Risk | Finding | Owner | Future phase |
| ---- | ------- | ----- | ------------ |
| P0 | Casual RPC/totals/RLS change could break all order creation | `create_order` | Do not touch in polish phases |
| P1 | Customizable products addable without required choices | Modal + types + action | `ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1` |
| P1 | Underpricing vs public (no extras in unit_price) | Action legacy payload | Safety gate → later customization flow |
| P1 | Null snapshots → incomplete prep / WA | Downstream consumers OK; producer gap | Customization flow impl |
| P2 | Nested scrolls ≤899; tablet 180px panes | Modal CSS | `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1` |
| P3 | Real Android keyboard QA not run | Runtime QA | Follow-up device QA |

## 12. Product options

| Option | Description | Verdict |
| ------ | ----------- | ------- |
| **A** Scroll-only | Fix nest only | **Reject alone** — green-washes P1 |
| **B** Safety gate | Block/warn `product_customization_enabled` (or groups) until picker exists; allow simple SKUs | **Recommended first** |
| **C** Admin customization picker | Full V2/required/qty/upsell/snapshot in modal | Correct long-term if manual must cover full catalog |
| **D** Reuse public flow internally | Reuse `order-validation` / snapshot builders without public routes | Viable later; avoid coupling to `/b/[slug]` UI |
| **E** Defer full customization | Explicit simple-only MVP | Acceptable **only with B** (communicated + gated) |

**Recommended option:** **B then scroll fix; C or D later via SPEC → IMPL → QA.**

## 13. Recommended future sequence

1. **`ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1`** (P1) — filter/disable/warn customizable products; document simple-only until picker.
2. **`ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1`** (P2) — single scroll owner ≤899; sticky footer; no functional change.
3. **`ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SPEC-1`** — choose C vs D; payload contract; reuse validation.
4. **`ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-IMPL-1`**
5. **`ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-QA-1`**

**Blocked/deferred:** shipping scroll-only as “D3 done”; casual `create_order` edits; public catalog / WhatsApp template changes.

## 14. Files inspected

- `components/admin/orders/manual-order-modal.tsx`
- `components/admin/orders/manual-order-modal.module.css`
- `components/admin/orders/admin-order-modal-shell.tsx`
- `components/admin/orders/admin-order-modal.module.css`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/DashboardToolbar.tsx`
- `app/admin/(protected)/orders/actions.ts`
- `lib/orders/manual-order-types.ts`
- `lib/products/admin.ts`
- `app/b/[slug]/checkout/actions.ts`
- `lib/product-customization/order-validation.ts`
- `lib/product-customization/order-preparation.ts` / `order-dashboard.ts` / shared types
- `lib/orders/customer-order-summary.ts`, `lib/whatsapp/admin.ts`
- `supabase/migrations/20260713030000_product_customization_order_1_create_order_snapshot.sql`
- `types/database.ts` (`create_order` Args)
- Prior debt audit / CURRENT_PHASE / living docs

## 15. Files changed

Docs only (this phase):

- `docs/admin-manual-order-modal-mobile-scroll-and-customization-audit-1.md`
- `docs/CURRENT_PHASE.md`
- `docs/admin-dashboard-forensic-living-audit.md`
- `ORDEROPS_LIVING_MEMORY.md`
- `docs/admin-dashboard-mobile-orders-final-visual-debt-audit-1.md` (D3 follow-up note)

Runtime / CSS / SQL: **NONE**

## 16. P0–P3 findings

- **P0:** none newly introduced; protect `create_order` from casual change.
- **P1:** ungated customizable products; no snapshots; base-price-only totals; prep/WA incompleteness.
- **P2:** nested mobile/tablet scrolls; tablet 180px panes.
- **P3:** Android keyboard QA debt; Adicional SKUs visible as root products (product-model smell).

## 17. Hard boundaries

No runtime/CSS/DB/RPC/public/checkout/WhatsApp/dashboard/drawer/toolbar/footer changes. No real orders. No commit/push/deploy.

## 18. Gate

`ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1` — **AUDIT COMPLETE — MANUAL ORDER CUSTOMIZATION PATH DECISION REQUIRED**

**Next phase:** `ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1` → then `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1`

**Follow-up (2026-09-06):** Safety gate **IMPLEMENTED** — see `docs/admin-manual-order-customization-safety-gate-1.md`. Customizable products blocked UI+server; single-scroll still pending.

**Follow-up (2026-09-06):** Single-scroll **FIXED** — see `docs/admin-manual-order-modal-mobile-single-scroll-fix-1.md`. ≤899 body-owned scroll; nested products/summary scrolls removed; desktop ≥900 dual-pane preserved; customization picker still not implemented.

**Follow-up (2026-09-06):** Full customization flow **SPECIFIED** — see `docs/admin-manual-order-customization-flow-spec-1.md`. Admin-native picker + shared domain helpers; safety gate remains until implementation; next `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-DOMAIN-1`.
