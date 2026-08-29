# ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-AUDIT-1

**Date:** 2026-08-27  
**Baseline commit:** 81b1162  
**Gate:** AUDIT COMPLETE — READY FOR IMPLEMENTATION

Audit only. No runtime / CSS / DB / RPC / commit / push / deploy.

---

## 1. Objective

Audit how dashboard/Kanban **OrderCard** computes the compact product count (`N items`) and summary string (`2x Doble Smash · 1x BBQ Bacon · +2 mas`), and determine whether upsell/Adicional child `order_items` are incorrectly included.

## 2. Product concern

Operators read the card at a glance to know how many **main products** an order has. When upsell children inflate the count (e.g. **6 items** instead of **3**), the card misrepresents operational load even though modal/preparation/WhatsApp/totals remain correct.

## 3. Current visual evidence

Fixture **#0215** (`c1e031af-762a-429f-abca-4ffd03dd0215`), La Burguesía — authenticated dashboard evidence:

- Card: **`6 items`** · `2x Doble Smash · 1x BBQ Bacon · +2 mas`
- Workspace Products: **2× Doble Smash** (with Adicional Coca ×2) + **1× BBQ Bacon** (with Adicional Coca ×1)
- Implied root quantity sum: **3** (2 + 1)

## 4. Source ownership

| Layer | Owner |
|-------|-------|
| Card render (`N items`, summary text) | `components/admin/orders/order-card.tsx` |
| Count + summary computation | `lib/orders/presenter.ts` → `buildOrderOperationalSummary` + private `buildItemsSummary` |
| Dashboard mapping (initial load) | `lib/orders/admin.ts` → `buildAdminOrderDashboardItem` |
| Realtime partial patch | `lib/orders/realtime.ts` → `patchDashboardOrderFromRealtime` (recomputes via same presenter) |
| Full hydrate | `getAdminDashboardOrderById` → `/admin/orders/[id]/summary` → same `buildAdminOrderDashboardItem` |
| Board view model | `lib/orders/dashboard-board-view-model.ts` — passes through precomputed fields; **does not recalculate** |
| Natural search | `lib/orders/natural-search.ts` — **does not use** item count/summary |
| Mobile list + desktop Kanban | Same `OrderCard` (`admin-dashboard-orders.tsx`, `DashboardKanbanBoard.tsx`) |
| Root/child tree (existing, not used for card) | `lib/product-customization/order-dashboard.ts` → `buildDashboardOrderItemTree` |
| DB precomputed column | **None** (`item_count` / `item_summary` not in `orders` table) |

## 5. Current count owner

```160:161:lib/orders/presenter.ts
  const itemCount = normalizedItems.reduce((total, item) => total + item.quantity, 0);
  const itemSummary = buildItemsSummary(normalizedItems);
```

**Definition:** sum of `quantity` across **every** flat `order_items` row passed in.

**Input path:** `normalizeListOrderItems(order.order_items)` strips each row to `{ product_name, quantity }` only — **no root/child filtering**.

## 6. Current summary owner

```342:355:lib/orders/presenter.ts
function buildItemsSummary(items: Array<{ productName: string; quantity: number }>) {
  // ...
  const visibleItems = items.slice(0, 2).map((item) => `${item.quantity}x ${item.productName}`);
  const hiddenItemsCount = items.length - visibleItems.length;
  if (hiddenItemsCount > 0) {
    visibleItems.push(`+${hiddenItemsCount} mas`);
  }
  return visibleItems.join(" · ");
}
```

**Definition:**

- Shows first **two rows** of the flat array (insertion/order-dependent).
- `+N mas` = **additional rows** beyond the first two (not additional root products, not hidden quantity).

## 7. Current data shape

| Field on card | Source |
|---------------|--------|
| `item_count` | Precomputed on `AdminOrderDashboardItem` |
| `item_summary` | Precomputed string |
| `order_items_preview` | Full `AdminOrderItem[]` with `item_kind`, `parent_order_item_id` — **available but unused for count/summary** |

Loader selects `item_kind` and `parent_order_item_id` from DB (`getAdminOrders`, `getAdminDashboardOrderById`).

Card component receives **only** scalars — cannot distinguish root vs child today without changing mapping layer.

## 8. Root/child markers available

At mapping boundary (`AdminOrderItem` / `order_items_preview`):

- `item_kind`: `"product" | "upsell" | null` (null = legacy)
- `parent_order_item_id`: `string | null`

Existing tree helper treats root as:

- not `(item_kind === "upsell" && parent_order_item_id)` → parent row
- upsell + parent → child attached to parent
- upsell without parent → orphan (still rendered as own node)

## 9. Fixture #0215 analysis

**Limitation:** persisted DB rows for this UUID were not queried in this audit; row order inferred from card copy + workspace tree.

| order | row (inferred) | product_name | quantity | item_kind | parent | root? | counted today? | should count? |
|-------|----------------|--------------|---------:|-----------|--------|------:|---------------:|--------------:|
| #0215 | 1 | Doble Smash | 2 | product | null | yes | yes (+2) | yes (+2) |
| #0215 | 2 | BBQ Bacon | 1 | product | null | yes | yes (+1) | yes (+1) |
| #0215 | 3 | Coca Cola 500ml | 2 | upsell | Doble parent | no | yes (+2) | no |
| #0215 | 4 | Coca Cola 500ml | 1 | upsell | BBQ parent | no | yes (+1) | no |

| Metric | Value |
|--------|------:|
| Current card count | **6** |
| Root line count | **2** |
| Root quantity sum (recommended) | **3** |
| Total quantity sum (all rows) | **6** |

Current summary **`2x Doble Smash · 1x BBQ Bacon · +2 mas`** matches 4 flat rows with roots listed first; **`+2 mas` = two upsell rows**, not two extra root products.

## 10. Additional fixture scenarios

| Scenario | Current behavior | Future expectation |
|----------|------------------|-------------------|
| Simple 1 root, no upsell | count = root qty | unchanged |
| Multi-root, no upsell | count = sum all qty | unchanged |
| Root + upsell (main case) | count includes child qty | exclude child qty |
| Multiple roots + multiple upsells | count sums all; `+N mas` may hide upsell rows | count roots only; summary lists roots only |
| Legacy (no kind/parent) | all rows treated equally | all rows = roots (safe fallback) |
| Orphan upsell (upsell, no parent) | counted like any row | treat as own line (same as tree orphan) — product confirm |

Reference synthetic fixture (`admin-structured-content.verify.ts` `richOrder`): 2 BBQ + 2 Coca upsell + 1 Doble → current count **5**, root qty **3**.

## 11. Current count semantics

**Definition D — total order_items quantity sum (roots + children).**  
**Includes children:** **YES**.  
**Source:** `buildOrderOperationalSummary` over `normalizeListOrderItems`.

## 12. Desired count semantics

**Root quantity sum** — sum of `quantity` for root/`product` lines only.  
Exclude: `item_kind === "upsell"` with valid `parent_order_item_id`.  
**Legacy fallback:** rows without upsell+parent markers count as roots (align with `buildDashboardOrderItemTree`).

## 13. Current `+N más` semantics

Additional **flat rows** after the first two, regardless of kind. Often upsell children when roots appear first in array order.

## 14. Desired compact summary semantics

List **root products only** (same root filter as count):

- Example target: **`3 items  2× Doble Smash · 1× BBQ Bacon`**
- No `+2 mas` when hidden rows are only upsells.
- If >2 **root** lines, `+N mas` counts hidden **root** lines only.
- Copy strings (`items`, `mas`) unchanged in this audit.

## 15. Legacy fallback

Recommend: **reuse tree classification** from `buildDashboardOrderItemTree`:

- Child: `item_kind === "upsell" && parent_order_item_id && parent exists in payload`
- Root: everything else (including `item_kind` null/legacy product rows and orphan upsells)

No name-based heuristics.

## 16. Realtime/hydrate impact

| Path | Recomputes count/summary? |
|------|---------------------------|
| Initial `getAdminOrders` | yes — `buildAdminOrderDashboardItem` |
| `/admin/orders/[id]/summary` hydrate | yes — same builder |
| `patchDashboardOrderFromRealtime` | yes — `buildOrderOperationalSummary(order_items_preview)` |
| Optimistic status patch | status only; items unchanged unless hydrate |

**Risk:** fix must update **presenter + both mapping/realtime call sites** together (same helper). Partial realtime row without items keeps stale preview — existing behavior.

## 17. Natural search impact

`matchesOperationalSearch` matches **customer name, phone, order ref only** — not `item_summary`, not product names.

**Risk if card summary excludes upsells:** **none for current search**.  
Future product-name search would need a separate searchable terms list including child names if desired.

## 18. Workspace/modal boundary

| Surface | Impact |
|---------|--------|
| Products / preparation | **unchanged** — uses `buildDashboardOrderItemTree` |
| WhatsApp / contact summary | **unchanged** — structured customer summary |
| Pricing / totals | **unchanged** |
| `order-workspace-overview` hero (page variant) | **also uses** `buildOrderOperationalSummary` today — out of card scope but same helper; optional follow-up |

## 19. Pricing boundary

Card count/summary are display-only. `total_price`, line totals, RPC `create_order` — **no audit change**.

## 20. Mobile/responsive boundary

Same `OrderCard` for Kanban (`showStatusBadge={false}`) and filtered mobile list (default badge). **Single fix applies to all columns** (pending/preparing/ready/completed/cancelled).

## 21. Implementation options

| Option | Pros | Cons |
|--------|------|------|
| **A — OrderCard display only** | Smallest diff | Card lacks structured items today; diverges from notifications/activity |
| **B — Fix dashboard view model** | Single card feed | VM doesn't own computation today |
| **C — Shared root-summary helper** | Testable; reusable | New pure module or extend presenter |
| **D — SQL/RPC aggregation** | Server canonical | High blast radius; unnecessary |

## 22. Recommended implementation path

**Option C + B (mapping layer):**

1. Add pure helper (e.g. `buildDashboardCardOperationalSummary(items: AdminOrderItem[])` or extend `buildOrderOperationalSummary` with optional root-only mode) that:
   - reuses root detection aligned with `buildDashboardOrderItemTree` (prefer calling tree or shared `isUpsellChild` export)
   - outputs `itemCount` (root qty sum) + `itemSummary` (root lines only)
2. Call from `buildAdminOrderDashboardItem` using **`normalizeDashboardOrderItems`** (not `normalizeListOrderItems`).
3. Call from `patchDashboardOrderFromRealtime` — already has `order_items_preview` with markers.
4. Add verify script with fixtures from `admin-structured-content.verify.ts` / upsell cases.
5. **Do not** change OrderCard.tsx except if copy formatting untouched.
6. **Optional follow-up:** notifications (`lib/notifications/browser.ts`), activity context, page overview hero — same fields.

**DB/RPC needed:** **NO**

## 23. Future verify plan

1. Root qty count excludes parent-linked upsell children.
2. Compact summary lists roots only; `+N mas` excludes upsell-only hidden rows.
3. Modal/preparation/WhatsApp payloads unchanged.
4. Natural search unchanged (no regression).
5. Legacy rows without markers → all roots.
6. No pricing change.
7. Realtime hydrate + partial patch stay consistent.

## 24. Severity

**P2** — semantic/trust issue at glance; full order data and economics remain correct in workspace/detail.

## 25. P0–P3

| Level | Finding |
|-------|---------|
| P0 | none |
| P1 | none |
| P2 | Card count/summary include upsell child quantities and rows |
| P3 | Page overview hero shares same helper; English `items` copy |

## 26. Files changed

**Runtime/CSS:** NONE  
**Docs:** this file + phase/changelog updates

## 27. Gate

**ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-AUDIT-1 = AUDIT COMPLETE — READY FOR IMPLEMENTATION**

Dashboard card root count: **AUDITED — NOT IMPLEMENTED**  
Contact/workspace scopes: **REMAIN FROZEN**  
Dashboard overall polish: **OPEN**

No commit. No push. No deploy.

---

## Implementation follow-up — 2026-08-27

**Phase:** ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-IMPL-1

**Final result:**

- root-aware card count implemented via `buildDashboardOrderCardSummary` (`lib/orders/dashboard-card-summary.ts`);
- root-only compact summary implemented; parent-linked upsell/Adicional children excluded from count and `+N mas`;
- initial load (`buildAdminOrderDashboardItem`), summary hydrate (`getAdminDashboardOrderById`), and realtime patch (`patchDashboardOrderFromRealtime`) use the same helper;
- workspace/modal Products, WhatsApp/contact structured summary, preparation, pricing/totals unchanged;
- DB/RPC unchanged;
- `OrderCard` JSX unchanged (still renders precomputed scalars).

Doc: `docs/admin-dashboard-order-card-root-item-count-impl-1.md`
