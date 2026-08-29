# ADMIN-ORDER-WORKSPACE-PREPARATION-PER-UNIT-TOTAL-ADDITIONAL-POLISH-1

**Date:** 2026-08-18  
**Status:** **PASS WITH VISUAL QA DEBT**  
**Baseline commit (living audit):** `81b1162` (unchanged — no commit this phase)

No commit / push / deploy.

Follow-up to: `docs/admin-order-workspace-product-preparation-visual-separation-polish-1.md`

---

## 1. Problem

Multi-unit orders lacked operational clarity:

- parent header showed only line total, not per-unit price;
- standard selections did not express coverage across parent units;
- quantity-enabled extras with parent qty > 1 omitted `×1 c/u` for qty=1 options;
- Adicional children looked like financial line items.

---

## 2. Approved target

```text
2× BBQ Bacon         $22.250 c/u         $44.500

Papas
  Papas grandes                           Ambas

Agregados extra
  Bacon             ×4 c/u              8 total
  Huevo             ×1 c/u              2 total

Adicional
  Coca Cola 500ml ×2
```

---

## 3. Product header qty = 1

`1× Doble Smash                       $21.000`

No duplicated unit price.

---

## 4. Product header qty > 1

Three-column layout (desktop):

`N× Product` | `$unitPrice c/u` | `$lineTotal`

Uses persisted `unitPrice` from order_items — not derived from lineTotal/qty.

Mobile: product + line total on first row; `$unitPrice c/u` secondary below.

---

## 5. Standard selection coverage

| Parent qty | Display |
|------------|---------|
| 1 | option name only |
| 2 | `Ambas` |
| >2 | `N total` |

Applies to V1 and V2 non-quantity-enabled groups.

---

## 6. `Ambas` rule

Only when parent qty = 2 and option is standard (not quantity-enabled).

---

## 7. Parent qty > 2

Numeric coverage: `3 total`, `8 total`, etc. No `Todas`.

---

## 8. Quantity-enabled V2 extras

Detection: snapshot `allows_option_quantity === true` on V2 group — **no name heuristics**.

| Parent qty | Display |
|------------|---------|
| 1, qty=1 | name only |
| 1, qty>1 | `×N` |
| >1 | `×N c/u` + `N total` (including `×1 c/u`) |

---

## 9. `×1 c/u`

Required for quantity-enabled options when parent qty > 1.

Example: `Huevo ×1 c/u` + `2 total`.

---

## 10. Operational totals

`operationalTotal = parentQuantity × quantityPerUnit` — presentation only.

---

## 11. Adicional integration

- Same preparation unit as parent
- Visible quantity: `Name ×N`
- **No visible child price** in renderer
- VM retains `lineTotal` for other consumers
- Parent line total unchanged (not aggregated with upsell)

---

## 12. Price rules

| Layer | Visible? |
|-------|----------|
| Parent unit price (qty>1) | YES |
| Parent line total | YES |
| Option deltas | NO |
| Adicional child price | NO |
| Order total | YES (authoritative) |

---

## 13. Responsive

- Desktop (≥720px): 3-column option grid + product header grid
- Mobile (<720px): stacked with readable meta lines
- Same DOM, CSS only

---

## 14. V1 / V2 / legacy

| Case | Behavior |
|------|----------|
| V1 | No fabricated option qty; coverage from parent qty |
| V2 standard | Same coverage rules as V1 |
| V2 qty-enabled | Per-unit + operational total |
| Legacy | Flat row; unit price when qty>1 |
| Malformed | Safe flat |
| Orphan upsell | Preserved; standalone price kept |

---

## 15. Mapper impact

**Minimal change:**

- `allowsOptionQuantity` on `PreparationGroup` from V2 snapshot flag
- `isQuantityEnabled` on `PreparationOption`
- Quantity-enabled parent>1: always set `quantityPerUnit` (including 1)

No pricing recalculation. No live config.

---

## 16. QA

| Case | Verify |
|------|--------|
| parent qty=1 | PASS (fixture) |
| parent qty=2 unit+line | PASS |
| standard Ambas path | PASS (renderer) |
| qty extras ×1 c/u | PASS |
| parent qty=3 | PASS |
| V1 no fake qty | PASS |
| upsell qty preserved | PASS |
| unit price persisted | PASS |

Authenticated viewport QA: **DEBT** (login required).

---

## 17. Checks

| Check | Result |
|-------|--------|
| verify | PASS |
| tsc | PASS |
| diff-check | PASS |
| build | PASS |
| lint | known ESLint 9 circular JSON |

---

## 18. Findings

| Severity | Finding |
|----------|---------|
| P0 | None |
| P1 | None |
| P2 | Authenticated viewport matrix pending |
| P3 | Product detail modal still flat summary |

---

## 19. Gate

**ADMIN-ORDER-WORKSPACE-PREPARATION-PER-UNIT-TOTAL-ADDITIONAL-POLISH-1** = **PASS WITH VISUAL QA DEBT**

---

## Follow-up

**ADMIN-ORDER-WORKSPACE-PREPARATION-COLUMN-ALIGNMENT-VISUAL-FIX-1** (2026-08-18)

Reason: semantic PASS; P2 column geometry (`×N c/u` glued to `N total`, header/body axis mismatch) required visual follow-up. See `docs/admin-order-workspace-preparation-column-alignment-visual-fix-1.md`.

---

## Files changed

| File | Change |
|------|--------|
| `lib/product-customization/order-preparation.ts` | V2 `allows_option_quantity` + qty-enabled semantics |
| `components/admin/orders/order-preparation-items.tsx` | Header unit price, coverage columns, Adicional no price |
| `components/admin/orders/order-items.module.css` | 3-column grids, mobile stack |
| `lib/product-customization/order-preparation.verify.ts` | Extended coverage |
