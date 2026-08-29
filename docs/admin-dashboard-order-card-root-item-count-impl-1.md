# ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-IMPL-1

**Date:** 2026-08-27  
**Baseline commit:** 81b1162  
**Gate:** PASS — DASHBOARD CARD ROOT COUNT FROZEN

Targeted semantic fix. No CSS / DB / RPC / workspace / WhatsApp / commit / push / deploy.

---

## 1. Objective

Correct dashboard/Kanban OrderCard compact semantics so `item_count` and `item_summary` reflect **root products only**, excluding parent-linked upsell/Adicional children from count and compact summary.

## 2. Audit input

`docs/admin-dashboard-order-card-root-item-count-audit-1.md` — card scalars traced to `buildOrderOperationalSummary` over flat normalized rows; `order_items_preview` already carries `item_kind` / `parent_order_item_id`; recommended shared root-aware helper + admin/realtime call sites.

## 3. Product decision

```text
item_count = sum(quantity) of root order_items
item_summary = compact summary of root order_items only
```

Parent-linked upsell children excluded. Legacy null markers = roots. Orphan upsell follows `buildDashboardOrderItemTree`.

## 4. Before behavior

Fixture #0215 (`c1e031af-762a-429f-abca-4ffd03dd0215`):

```text
6 items · 2x Doble Smash · 1x BBQ Bacon · +2 mas
```

All flat `order_items` rows summed (including Coca Cola upsell children).

## 5. After behavior

```text
3 items · 2x Doble Smash · 1x BBQ Bacon
```

No `+2 mas` when hidden rows are upsell-only.

## 6. Source ownership before

| Layer | Owner |
|-------|-------|
| Card render | `order-card.tsx` |
| Count/summary | `presenter.ts` → `buildOrderOperationalSummary` + `buildItemsSummary` |
| Initial load | `admin.ts` → `normalizeListOrderItems` → presenter |
| Realtime | `realtime.ts` → presenter over `order_items_preview` |

## 7. Source ownership after

| Layer | Owner |
|-------|-------|
| Card render | `order-card.tsx` (unchanged — scalars only) |
| Count/summary | `lib/orders/dashboard-card-summary.ts` → `buildDashboardOrderCardSummary` |
| Tree alignment | `lib/product-customization/order-dashboard.ts` → `buildDashboardOrderItemTree` |
| Initial load | `admin.ts` → `normalizeDashboardOrderItems` → card summary helper |
| Hydrate | `getAdminDashboardOrderById` → same `buildAdminOrderDashboardItem` |
| Realtime | `realtime.ts` → `buildDashboardOrderCardSummary(order_items_preview)` |
| Customer/notes scalars | `buildOrderOperationalSummary` with `[]` items (unchanged customer fields) |

## 8. Root detection rule

Reuse `buildDashboardOrderItemTree(items)` — roots are tree top-level nodes. Child = `item_kind === "upsell"` with valid `parent_order_item_id` present in payload. No name heuristics.

## 9. Legacy fallback

Rows with null/undefined `item_kind` and null/undefined `parent_order_item_id` treated as roots (historical orders).

## 10. Orphan upsell behavior

`item_kind === "upsell"` without valid parent in payload → own root-like line per existing tree helper (not hidden).

## 11. Helper architecture

`buildDashboardOrderCardSummary(items: OrderItemLike[])`:

- Input preserves `id`, `product_name`, `quantity`, `item_kind`, `parent_order_item_id`
- Returns `{ itemCount, itemSummary }`
- Summary format preserved: `2x Name · … · +N mas` (ASCII `x`, legacy `mas` without accent)

## 12. Initial load mapping

`buildAdminOrderDashboardItem`:

```ts
const orderItemsPreview = normalizeDashboardOrderItems(order.order_items);
const cardSummary = buildDashboardOrderCardSummary(orderItemsPreview);
```

`item_count` / `item_summary` from `cardSummary`.

## 13. Hydrate path

`GET /admin/orders/[id]/summary` → `getAdminDashboardOrderById` → `buildAdminOrderDashboardItem` — root-aware.

## 14. Realtime path

`patchDashboardOrderFromRealtime` recomputes via `buildDashboardOrderCardSummary(nextBase.order_items_preview)`.

## 15. Natural search boundary

Unchanged. `natural-search.ts` does not use `item_count` / `item_summary`.

## 16. Workspace/modal boundary

Unchanged. Products still show Adicional hierarchy; preparation/WhatsApp/customer summary untouched.

## 17. WhatsApp/contact boundary

Unchanged. Structured summary still includes Adicional lines.

## 18. Pricing boundary

Unchanged. `total_price` and line economics unaffected.

## 19. Runtime fixture #0215

Authenticated dashboard @390px (La Burguesía):

- Card: `3 items` · `2x Doble Smash · 1x BBQ Bacon`
- Workspace Products: Adicional Coca Cola 500ml ×2 and ×1 present under respective roots

## 20. Verify matrix

`lib/orders/dashboard-card-summary.verify.ts` — 8 cases: #0215-like, simple, multi-root, root+many upsells, 3 roots+children, legacy, orphan, child-before-parent, missing parent.

## 21. Runtime QA

- Completed column #0215: PASS
- Workspace modal open/close with hydrate: card scalars remain root-aware while modal shows Adicional
- Pending card #8CBA: `2 items 2x BBQ Bacon` (no upsell inflation observed)

## 22. Static checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | EXECUTED — ESLint 9 circular JSON (known debt) |

## 23. Lint

Executed. Failure = known ESLint 9 config validator circular JSON only.

## 24. Files changed

| Category | Files |
|----------|-------|
| Runtime | `lib/orders/dashboard-card-summary.ts`, `lib/orders/admin.ts`, `lib/orders/realtime.ts` |
| Verify | `lib/orders/dashboard-card-summary.verify.ts` |
| CSS | NONE |
| DB/RPC | NONE |
| Docs | this file, audit follow-up, `CURRENT_PHASE.md`, forensic living audit, living memory |

`order-card.tsx` — **UNCHANGED** for this phase.

## 25. P0–P3

| Level | Finding |
|-------|---------|
| P0 | none |
| P1 | none |
| P2 | none |
| P3 | English `items` copy; `x` vs `×`; `mas` accent — deferred |

## 26. Hard boundaries

OrderCard JSX unchanged · CSS unchanged · workspace Products unchanged · preparation unchanged · WhatsApp/contact unchanged · customer summary unchanged · pricing unchanged · natural search unchanged · status unchanged · realtime architecture unchanged except summary derivation · DB unchanged · RPC unchanged · network +0

## 27. Gate

**ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-IMPL-1 = PASS — DASHBOARD CARD ROOT COUNT FROZEN**

Dashboard card root count: **IMPLEMENTED + FROZEN**  
Dashboard compact item summary: **ROOT-ONLY + FROZEN**  
Contact/workspace scopes: **REMAIN FROZEN**  
Dashboard overall polish: **OPEN**

No commit. No push. No deploy.
