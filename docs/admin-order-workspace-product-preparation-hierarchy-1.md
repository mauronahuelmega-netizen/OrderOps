# ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-1

**Date:** 2026-08-18  
**Status:** **PASS WITH VISUAL QA DEBT**  
**Baseline commit (living audit):** `81b1162` (unchanged — no commit this phase)

No commit / push / deploy.

Audit source: `docs/admin-order-workspace-product-preparation-hierarchy-audit-1.md`

---

## 1. Result

**PASS WITH VISUAL QA DEBT**

Structured preparation hierarchy implemented for workspace modal + order detail via shared `OrderProductsList` path. Pure mapper + renderer; no domain/DB/network changes. Authenticated viewport QA not completed (login required).

---

## 2. Previous vs new presentation

| Before | After |
|--------|-------|
| Flat summary strings (`Papas: Papas grandes (+$1.500)`) | Group → option hierarchy |
| Plus badge + inline upsell rows | **Adicional** section with child name × qty + line total |
| Option price deltas visible in summary | Option prices **omitted** (strategy D) |
| Product name without consistent qty prefix | Always `N× Product name` |

---

## 3. Mapper architecture

```text
order_items (persisted)
  → buildDashboardOrderItemTree (tree + upsells)
  → buildOrderPreparationItems (order-preparation.ts)
  → PreparationOrderItem[]
  → OrderPreparationItems
  → OrderProductsList (workspace + detail)
```

- **NO** string parsing of summary lines
- **NO** live product/customization config
- **NO** price recomputation for order total

---

## 4. V1 behavior

- Renders `group_name` → `option_name` from structured snapshot
- **No** fabricated option quantity
- **No** option price deltas
- Uses persisted `sort_order` for groups and options

---

## 5. V2 behavior

- Same as V1 plus quantity semantics
- `quantityPerUnit` shown when > 1 and parent qty = 1: `Bacon ×4`
- Parent qty > 1 + option qty > 1: `Bacon ×4 c/u` + `8 total`
- Parent qty > 1 + option qty = 1: `Huevo` + `2 total`

---

## 6. Quantity semantics

| Case | Display |
|------|---------|
| Parent qty | Always `N×` prefix |
| V2 option qty = 1, parent = 1 | Name only |
| V2 option qty > 1, parent = 1 | `Name ×N` |
| V2 parent > 1 | Per-unit + operational total meta |

---

## 7. Parent qty > 1

Fixture-tested: parent=2, Bacon qty=4 → `Bacon ×4 c/u` + `8 total`.

V1 parent=2: options listed without fabricated qty; parent prefix communicates N units.

---

## 8. Price strategy

**Strategy D — preparation-first**

- Parent line total: `quantity × unit_price` (display only)
- Order total: unchanged authoritative `orders.total_price` prop
- Option deltas: **not rendered**
- Double-count visual risk: **resolved**

---

## 9. Upsell → Adicional

- Internal `item_kind = "upsell"` unchanged
- Presentation label: **Adicional**
- Child: `Name ×N` + separate line total
- Orphan upsells: standalone Adicional row preserved

---

## 10. Legacy / malformed fallback

| Case | Behavior |
|------|----------|
| No snapshot | Flat product row |
| Malformed snapshot | Flat product row, no crash |
| Dense + description | Legacy modifier chips (no snapshot only) |

---

## 11. product_id null

Renderer uses persisted `product_name`, `quantity`, `unit_price`, `customization_snapshot` only. No product lookup.

---

## 12. Workspace / detail parity

Both consume `OrderItemsSection → OrderProductsList → OrderPreparationItems`. Single shared implementation.

---

## 13. Untouched surfaces

| Surface | Changed? |
|---------|----------|
| OrderCard | NO |
| WhatsApp / copy | NO |
| Action rail | NO |
| order-product-modal | NO (PRODUCT MODAL PARITY = DEBT) |

---

## 14. Visual QA

Authenticated browser QA: **NOT COMPLETED** (auth required).

Static/verify QA: **PASS**

---

## 15. Functional boundaries

| Area | Changed? |
|------|----------|
| Realtime | NO |
| Reconciliation | NO |
| Actions | NO |
| Checkout / create_order | NO |
| DB | NO |
| Public catalog | NO |
| Kanban | NO |
| Assignment / status | NO |

Additional network requests: **0**

---

## 16. Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npx tsx lib/product-customization/order-preparation.verify.ts` | PASS |
| `npm run lint` | Known ESLint 9 circular JSON (pre-existing) |

---

## 17. Findings

| Severity | Finding |
|----------|---------|
| P0 | None |
| P1 | None |
| P2 | Authenticated viewport matrix pending |
| P3 | `order-product-modal.tsx` still uses flat summary lines |

---

## 18. Accepted debt

- **AUTHENTICATED VISUAL QA DEBT** — workspace modal + `/admin/orders/[id]` at 1440/768/390 dark/light
- **PRODUCT MODAL PARITY** — item detail modal still flat summary

---

## 19. Gate

**ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-1** = **PASS WITH VISUAL QA DEBT**

---

## FOLLOW-UP

**IMPLEMENTED BY:** `ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-VISUAL-SEPARATION-POLISH-1` (2026-08-18)

Structured data, mapper, quantity, and price contract unchanged. Visual separation of product units, groups, options, and Adicional refined. See `docs/admin-order-workspace-product-preparation-visual-separation-polish-1.md`.


---

## Files changed (this phase)

| File | Role |
|------|------|
| `lib/product-customization/order-preparation.ts` | Pure preparation mapper |
| `lib/product-customization/order-preparation.verify.ts` | Static QA |
| `components/admin/orders/order-preparation-items.tsx` | Structured renderer |
| `components/admin/orders/order-products-list.tsx` | Delegates to preparation renderer |
| `components/admin/orders/order-items.module.css` | Preparation hierarchy styles; removed orphan flat-summary/upsell selectors |
| `components/admin/orders/admin-order-modal.module.css` | Modal typography targets preparation classes |

## CSS orphans removed

- `.admin-item-row`, `.admin-item-row--button`, `.admin-item-title--compact`, `.admin-item-quantity`
- `.orderItemNode`, `.orderItemCustomizationSummary`, `.orderItemCustomizationLine`
- `.orderItemUpsellChildren`, `.orderItemUpsell`, `.orderItemUpsellButton`, `.orderItemUpsellLabel`, `.orderItemUpsellBadge`
- `.orderItemSnapshotFallback`
