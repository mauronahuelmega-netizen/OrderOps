# ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-AUDIT-1

**Date:** 2026-08-18  
**Status:** AUDIT COMPLETE — READY FOR IMPLEMENTATION  
**Baseline commit (living audit):** `81b1162` (unchanged — no commit this phase)

Audit only. No runtime / CSS / DB / actions / commit / push / deploy.

Reference docs read:
- `docs/admin-dashboard-forensic-living-audit.md`
- `docs/admin-order-workspace-modal-hierarchy-polish-1.md`
- `docs/admin-order-workspace-modal-action-hierarchy-visual-fix-1.md`
- `docs/public-catalog-customization-multi-quantity-extras-order-impl-1.md` (path trace only)

---

## 1. Executive conclusion

| Gate | Result |
|------|--------|
| **STRUCTURED PREPARATION RENDERER** | **PARTIALLY SUPPORTED** |
| **READY FOR IMPLEMENTATION** | **YES** (presentation-only; no domain/DB changes) |

**Verdict breakdown by snapshot version:**

| Version | Structured comanda | Notes |
|---------|-------------------|-------|
| **V2** | Fully supported | `groups[] → selected_options[]` with `option_name`, `quantity`, `price_delta` (unit), `total_price_delta` (extended), `sort_order`; group `group_name`, `sort_order` |
| **V1** | Partially supported | Group + option names + unit `price_delta`; **no option quantity field** (binary selections → implicit qty 1 per configured unit is semantically safe) |
| **Legacy (no snapshot)** | Flat fallback only | `product_name`, `quantity`, `unit_price`; optional `products.description` split for dense/compact |
| **Upsell child** | Supported at line level | Separate `order_items` row; no customization snapshot |

The persisted snapshot **already preserves enough structure** for a preparation hierarchy without consulting live product/customization config and without parsing summary strings — **for V2 and structured V1**. Current UI **flattens** that structure to preformatted `summary[]` strings at render time; structured data remains in `customization_snapshot` and is parsed but not rendered hierarchically.

**Blocking concern (presentation, not data):** parent `unit_price` is the **final configured unit price** (base + all customization deltas). Showing option price deltas adjacent to that parent line price creates **visual double-count risk** unless price display strategy is chosen explicitly (recommended: strategy D — preparation-first, prices secondary at line edge only).

---

## 2. Current Products renderer

| Concern | Owner |
|---------|-------|
| Section title **Productos** | `components/admin/orders/order-items-section.tsx` |
| Parent product row, customization summary, Plus rows, item prices, **Total** | `components/admin/orders/order-products-list.tsx` |
| Tree + summary derivation | `lib/product-customization/order-dashboard.ts` (`buildDashboardOrderItemTree`, `getCustomizationSummaryLines`) |
| Item detail modal (same summary lines) | `components/admin/orders/order-product-modal.tsx` |

**Consumers**

| Surface | Path | Shared? |
|---------|------|---------|
| Workspace modal | `admin-order-workspace-modal.tsx` → `OrderItemsSection` (`compact showTotal`) | YES |
| Order detail page / detail modal | `order-workspace.tsx` → `OrderItemsSection` | YES |
| OrderCard | `order-card.tsx` — uses `item_summary` string only | NO (compact summary) |
| WhatsApp / copy | `lib/whatsapp/admin.ts` — `product_name × qty` only | NO customization detail |

**CSS owners**

| Layer | File |
|-------|------|
| List / rows / upsell / total | `components/admin/orders/order-items.module.css` |
| Section panel shell | `components/admin/orders/order-workspace.module.css` |
| Modal typography overrides | `components/admin/orders/admin-order-modal.module.css` (`:global(.admin-detail-panel--products)`, `.admin-item-row`, etc.) |

**SHARED WITH `/admin/orders/[id]`** = **YES** (same `OrderItemsSection` → `OrderProductsList`)  
**SHARED WITH OrderCard** = **NO**

---

## 3. Current data path

```text
app/b/[slug]/checkout/actions.ts
  validateCheckoutCartForCreateOrder (lib/product-customization/order-validation.ts)
    buildSelectedGroupsFromConfig + buildCustomizationSnapshotV2 (lib/product-customization/order-snapshot.ts)
    toCreateOrderRpcJson (lib/product-customization/order-types.ts)
  ↓
supabase.rpc("create_order", …)  — migrations: 20260713030000_product_customization_order_1_create_order_snapshot.sql
  ↓
order_items fields persisted:
  id, order_id, product_id, product_name, quantity, unit_price,
  item_kind, parent_order_item_id, customization_snapshot
  ↓
getAdminOrderById / getAdminOrders (lib/orders/admin.ts)
  SELECT order_items + optional products(image_url, description) join
  normalizeAdminOrderItemFields → AdminOrderItem[]
  ↓
AdminOrderWorkspaceData (lib/orders/workspace.ts)
  ↓
OrderItemsSection → OrderProductsList
  buildDashboardOrderItemTree(items)
    parseCustomizationSnapshot(item.customization_snapshot)
    getCustomizationSummaryLines(snapshot)  ← FLATTEN TO STRINGS HERE
  render customizationSummary as <li> per line
```

**Creation owner:** `validateCheckoutCartForCreateOrder` + RPC `create_order`  
**Snapshot serializer:** `buildCustomizationSnapshotV1/V2` + `buildDisplaySummaryFromSelectedGroups`  
**Admin loader:** `lib/orders/admin.ts` → `normalizeOrderItems`  
**Current renderer:** `order-products-list.tsx`

---

## 4. order_items fields (relevant subset)

| Field | Persisted? | Historical snapshot? | Needed for preparation renderer? | Notes |
|-------|------------|----------------------|----------------------------------|-------|
| `id` | YES | YES | YES | Tree key; upsell parent link target |
| `order_id` | YES | YES | NO (context) | Tenant scoped via orders |
| `product_id` | YES (nullable) | YES | NO for display | FK may be NULL if product deleted (`SET NULL` per T3 migration intent) |
| `product_name` | YES | YES | YES | Always snapshotted at order time; primary name source |
| `quantity` | YES | YES | YES | Parent/upsell line quantity |
| `unit_price` | YES | YES | YES (P3) | Final per-unit price for customized parents; catalog price for legacy |
| `item_kind` | YES | YES | YES | `"product"` \| `"upsell"` |
| `parent_order_item_id` | YES | YES | YES | Upsell → parent link |
| `customization_snapshot` | YES (jsonb) | YES | YES | V1/V2 structured payload; null for legacy/simple/upsell |
| Line total | **Derived** | Derived | YES (P3) | `quantity × unit_price` — not a separate column |
| Upsell metadata | Via child row | YES | YES | No snapshot on upsell; name/qty/price on child row |

---

## 5. Snapshot version matrix

| Version | Detection | Group name | Option name | Qty | Price delta | Ordering | Other |
|---------|-----------|------------|-------------|-----|-------------|----------|-------|
| **V1** | `version === 1` or missing → parser treats as V1 | `group_name` | `option_name` | **Absent** (implicit 1 per unit) | `price_delta` (per unit) | `sort_order` on groups + options | `selection_type`, min/max, `pricing.*`, `summary[]` |
| **V2** | `version === 2` | `group_name` | `option_name` | `quantity`, `total_price_delta` | `price_delta` = **unit** delta; `total_price_delta` = unit × qty | `sort_order` on groups + options | `allows_option_quantity`, `max_total_quantity`, `pricing.*`, `summary[]` |

Parser: `parseCustomizationSnapshot` in `order-dashboard.ts` — tolerant, returns `null` on corrupt root.

---

## 6. V1 findings

| Capability | Supported? | Evidence |
|------------|------------|----------|
| Group name | YES | `group_name` on each group |
| Option name | YES | `option_name` on selected_options |
| Selected option ids | YES | `option_id` |
| Option price delta | YES | `price_delta` (per unit, ≥ 0) |
| Option quantity | **NO field** | Binary/multiple selection only; each selected option = one unit of that extra **per configured product unit** |
| Group ordering | YES | `sort_order`; parser sorts ascending |
| Option ordering | YES | `sort_order`; parser sorts ascending |
| Selection mode | YES | `selection_type`, min/max persisted |
| Explicit version | YES | `version: 1` (missing version → V1) |

**Qty inference:** For V1, assuming `quantity = 1` per selected option **is semantically safe** — the pre-V2 model had no per-option quantity; duplicate selections were not representable as qty > 1 on one option row.

**Real DB sample (tenant `e21b8fc2…`, item `e22cd2f2…`):** V1 BBQ Bacon, one group, one option, `price_delta: 250`, `final_unit_price: 13750`.

---

## 7. V2 findings

| Capability | Supported? |
|------------|------------|
| Group → selections | YES — `groups[].selected_options[]` |
| Quantity field | `quantity` (integer ≥ 1) |
| Quantity semantics | **Per configured product unit** (see §8) |
| Unit delta | `price_delta` |
| Extended price | `total_price_delta` = `price_delta × quantity` (also recomputed on read if missing) |
| Display order | `sort_order` on groups and options |

**Inequívoco — Bacon qty=4, unit delta=$1.000:**

Snapshot stores **both**:
- `price_delta: 1000` (per unit of the option)
- `quantity: 4`
- `total_price_delta: 4000` (extended for that option on **one** configured unit)

Confirmed in `buildCustomizationSnapshotV2` (`order-snapshot.ts` L121–129) and live order item `71f5b9e3…`.

---

## 8. Quantity semantics

### Parent product quantity

- One `customization_snapshot` per order line; configuration is **shared across all units** on that line.
- Pricing: `lineTotal = finalUnitPrice × parentQuantity` (`order-validation.ts`, spec `public-catalog-customization-multi-quantity-extras-order-impl-1.md`).
- Cart contract: identical unit config merges; product quantity stacks on same signature.

**Parent qty > 1 means:** N identical configured units (same groups/options per unit).

### Custom option quantity (V2)

- Option qty applies **per configured product unit**, not as a one-time total for the whole line.
- **Example (mandatory):** parent qty = 2, Bacon qty = 4 → **8 bacon operationally** (4 per burger × 2 burgers).
- Source: `customizationDelta = Σ(price_delta × option.quantity)` once per unit; then `lineTotal = finalUnitPrice × productLineQuantity`.

### V1 extras with parent qty > 1

- Each selected option = 1 per unit. Parent qty = 2, Bacon selected → **2 bacon total** (1 per burger × 2).

### Upsell quantity

- CART-1: upsell qty **synced to parent** at validation (`normalizedUpsells.push({ quantity: item.quantity })`).

### Recommended preparation display

| Entity | Rule |
|--------|------|
| Parent | Always show `N× Product name` |
| V2 option qty | Show snapshot qty (per unit); if parent qty > 1, add operational total: e.g. `Bacon ×4` + muted `(8 total)` or `×4 c/u · 8 total` |
| V1 option | No ×1 noise; list option name only |
| Upsell | Show `×N` when qty > 1 (real units) |

---

## 9. Price semantics

| Layer | Stored value | Semantics | Can display safely? |
|-------|--------------|-----------|---------------------|
| Product base | `snapshot.pricing.base_unit_price` | Catalog base at order time | YES (informational) |
| Customization total | `snapshot.pricing.customization_total` | Sum of option deltas for **one unit** | YES (informational) |
| Product final (unit) | `order_items.unit_price` == `snapshot.pricing.final_unit_price` for customized | **Final configured unit price** (includes all deltas) | YES — use as line unit price |
| Option unit delta | `price_delta` | Per one option unit on one product unit | YES if not summed with final unit price |
| Option extended | `total_price_delta` (V2) | `price_delta × quantity` for one product unit | YES (informational) |
| Upsell | Child `unit_price` | Separate product price; not in parent snapshot | YES |
| Order total | `orders.total_price` | Authoritative | YES — do not recompute |

**Parent `unit_price` semantics:** **C — final unit price snapshot** (base + customization deltas for one unit).

**Double-count risk:** **YES** — displaying option `+$X` deltas next to parent line price that already includes those deltas would mislead unless labeled informational-only.

**Recommended strategy:** **D** — preparation hierarchy without inline option prices; show **line total** (right edge) + **order total**; optionally show base vs final in a collapsed/future accounting view. Zero-price options: **show nothing** (no `$0`, no “gratis”).

---

## 10. Upsell / parent-child semantics

| Concern | Value |
|---------|-------|
| **ITEM KIND VALUES** | `"product"`, `"upsell"` |
| **PARENT FIELD** | `parent_order_item_id` → parent `order_items.id` |
| Upsell `product_name` | Own snapshot on row |
| Upsell `quantity` | Own; synced to parent at order time |
| Upsell `unit_price` | Own catalog price at order time |
| Upsell `customization_snapshot` | **null** |
| Parent link if product deleted | Stable via UUID ids; orphan upsells surfaced by `buildDashboardOrderItemTree` (`isOrphanUpsell`) |

**RECOMMENDED DISPLAY LABEL:** **Adicional** (operational/neutral).  
**RATIONALE:** UI currently uses badge **Plus** (`order-products-list.tsx`); repo copy is mixed (“Plus”, “+”). “Adicional” fits preparation/comanda tone; rename is product copy, not audit blocker.

---

## 11. Historical safety

| Scenario | Safe without current product? |
|----------|-------------------------------|
| Name | **YES** — `product_name` |
| Quantity / unit price | **YES** |
| Customizations | **YES** — `customization_snapshot` |
| Upsell | **YES** — child row fields |
| Image / description fallback | **PARTIAL** — `products` join may miss if deleted; dense mode uses `description` split |

**HISTORICAL ORDER SAFE WITHOUT CURRENT PRODUCT** = **YES** for preparation content (PARTIAL for optional catalog join fallbacks).

**CURRENT ADMIN ORDER RENDER DEPENDS ON LIVE CUSTOMIZATION CONFIG** = **NO**  
Loader joins `products` for image/description only; customization display uses snapshot parser only.

---

## 12. Current flattening point

**SUMMARY SOURCE** = **D (hybrid)**

| Stage | What happens |
|-------|----------------|
| **Write (order time)** | `buildDisplaySummaryFromSelectedGroups` → persisted in `snapshot.summary[]` |
| **Read (admin tree)** | `buildDashboardOrderItemTree` → `getCustomizationSummaryLines` |
| **Preference** | If `snapshot.summary.length > 0`, return persisted strings **as-is** |
| **Fallback** | Rebuild from structured groups via `snapshotToDisplayGroups` → `buildSummaryFromDisplayGroups` |

**Structure loss for UI:** At `buildDashboardOrderItemTree` L415, only `customizationSummary: string[]` is passed to React. **`snapshot` is parsed and available on the node** but `OrderProductsList` renders only `customizationSummary` strings — **flattening is a presentation choice, not data loss**.

**Future mapper should consume:** `node.snapshot` (parsed) or `parseCustomizationSnapshot(item.customization_snapshot)` — **not** `getCustomizationSummaryLines` for structured path.

---

## 13. Structured vs legacy fallback

| Path | When | Behavior |
|------|------|----------|
| **Structured V2** | `parseCustomizationSnapshot` → version 2 | Render group → option → qty → optional price meta |
| **Structured V1** | version 1 | Render group → option; no qty column; no fabricated qty |
| **Legacy flat** | `customization_snapshot` null | Product row only; dense/compact may split `products.description` |
| **Malformed** | parser returns null | Product row + no customization block; never raw JSON |
| **Unknown version** | parser maps non-2 → V1 attempt | If parse fails → legacy flat |

**UNKNOWN SNAPSHOT FALLBACK:** Show product name + qty + line price; omit customization block; do not crash Products section (current parser already fail-safe).

---

## 14. Recommended preparation VM (conceptual contract)

```ts
/** Presentation-only; derived from persisted snapshot + order_items row. */
type PreparationOrderItem = {
  id: string;
  kind: "product" | "upsell";
  name: string;
  quantity: number;
  lineTotal: number;           // quantity × unit_price (display only)
  unitPrice: number;           // persisted unit_price
  groups: PreparationGroup[];  // empty for upsell / legacy
  children: PreparationOrderItem[];
  legacySummaryLines?: string[]; // only when structured path unavailable
  snapshotVersion?: 1 | 2 | null;
};

type PreparationGroup = {
  id: string;
  name: string;
  sortOrder: number;
  options: PreparationOption[];
};

type PreparationOption = {
  id: string;
  name: string;
  sortOrder: number;
  quantityPerUnit?: number;      // V2 only; omit for V1
  operationalTotal?: number;     // parentQty × quantityPerUnit when parentQty > 1
  unitPriceDelta?: number;       // optional P3; omit in default strategy D
  extendedPriceDelta?: number;   // V2 total_price_delta; optional P3
};
```

**Why minimal:** Matches fields actually persisted; no live config; no pricing recomputation.

---

## 15. Recommended ownership

| Concern | Recommendation |
|---------|----------------|
| **PREPARATION VM OWNER** | `lib/product-customization/order-preparation.ts` (new) **or** extend `order-dashboard.ts` with `mapToPreparationOrderItems` |
| **RATIONALE** | Reused by workspace + detail + future kitchen; pure functions; co-locate with `parseCustomizationSnapshot` / `snapshotToDisplayGroups` |
| **ADMIN SNAPSHOT DISPLAY HELPER (current)** | `lib/product-customization/order-dashboard.ts` + thin wrapper `lib/orders/customization-summary.ts` |
| **COMPONENT** | **B.** `OrderPreparationItems` (+ optional `OrderPreparationItem`) in `components/admin/orders/`; wire from `OrderProductsList` or replace list body |
| **Helper strategy** | **C + new mapper:** keep `getCustomizationSummaryLines` for legacy/WhatsApp; add structured preparation mapper |

---

## 16. Price display recommendation

**Strategy D** — hierarchy without option-level prices in default preparation view:
- Right-align **line total** per product/upsell
- Keep **order total** footer unchanged
- Do not show option `+$` deltas next to final unit price (double-count risk)

---

## 17. Quantity display recommendation

| Entity | qty = 1 | qty > 1 |
|--------|---------|---------|
| Parent product | `1× Name` | `N× Name` |
| V2 qty-enabled option | Name only (no `×1`) | `Name ×N` |
| V1 option | Name only | Name only (no per-option qty) |
| Upsell | `Adicional · Name` | `Adicional · Name ×N` |
| Parent qty > 1 + V2 option | Option per-unit qty + operational total annotation | Same |

---

## 18. Text mocks (from real capability)

### A. Simple (no snapshot)

```text
2× Coca Cola 500ml                    $6.000
────────────────────────────────────────────
Total                                 $6.000
```

### B. V1 customized (item `6e9a04e7…`, parent qty 2)

```text
2× Doble Smash                        $33.500

Papas
  Papas grandes

Salsas
  BBQ
  Salsa Big Mac

Agregados extra
  Bacon
  Cheddar
  Huevo
```

(Prices omitted in groups per strategy D; line total = 2 × $16.750.)

### C. V2 multi-group (item `71f5b9e3…`)

```text
1× Doble Smash                        $21.000

Papas
  Papas grandes

Salsas
  Big Mac

Agregados extra
  Bacon ×4
  Huevo
  Cheddar ×4
```

### D. V2 quantity extras (same snapshot)

Shows `×4` from persisted `quantity`; `total_price_delta` available if accounting view added later.

### E. Parent + upsell (order with `71f5b9e3…` + child `379fedc0…`)

```text
1× Doble Smash                        $21.000
  …groups…

Adicional
  Coca Cola 500ml ×1                  $3.000
────────────────────────────────────────────
Total                                 $24.000
```

### F. Parent qty > 1 + V2 (hypothetical from contract)

```text
2× Doble Smash                        $30.000

Agregados extra
  Bacon ×4 (8 total)
  Cheddar ×2 (4 total)
```

### G. Legacy / malformed fallback

```text
1× Papas Cheddar                      $6.500
────────────────────────────────────────────
Total                                 $6.500
```

No “Sin personalizaciones”. No raw JSON.

---

## 19. Blast radius

### MUST TOUCH (future implementation)
- `components/admin/orders/order-products-list.tsx` (or new `OrderPreparationItems`)
- `lib/product-customization/order-preparation.ts` (or extended `order-dashboard.ts`)
- Possibly `order-items.module.css` (out of scope for this audit)

### MAY TOUCH
- `order-items-section.tsx` (prop pass-through)
- `order-product-modal.tsx` (optional parity)

### SHOULD NOT TOUCH
- `admin-order-workspace-modal.tsx` layout rails
- OrderCard
- WhatsApp templates (first iteration)

### HARD NO TOUCH
- `use-admin-orders-realtime.ts`, reconciliation, `orders/[id]/actions.ts`
- `create_order`, checkout, `order-validation.ts` pricing path
- Public catalog / cart / snapshot creation
- DB schema / migrations
- Kanban / assignment / stock

**RED FLAG if needed:** None — structured data already persisted.

---

## 20. Implementation phasing

**ONE PHASE** — mapper + renderer swap in shared `OrderProductsList` path; V1/legacy fallbacks in same PR.

---

## 21. QA matrix (future)

| Case | Assert |
|------|--------|
| Simple legacy | Name, qty, line total, order total |
| V1 multi-group | Groups/options ordered by `sort_order`; no fake qty |
| V2 single/multiple groups | Group labels + options |
| V2 qty extras | `×N` from snapshot; operational total when parent qty > 1 |
| Upsell | Child under parent; label; separate line total |
| Multiple products | Visual separation (whitespace/divider); no nested cards |
| Parent qty > 1 | Product prefix; option operational totals |
| `product_id` null | Name from `product_name`; snapshot still renders |
| Unknown/malformed snapshot | No crash; graceful flat row |
| Mobile / dark / light | Readable hierarchy |
| **TOTAL BEFORE = TOTAL AFTER** | Order total unchanged |
| No live config fetch for customizations | Network tab / code path |

---

## 22. Unknowns / blockers

| Item | Status |
|------|--------|
| V2 + parent qty > 1 + qty extras in production DB | **NOT AVAILABLE** in dev sample (only V1 parent qty 2 found: `6e9a04e7…`); contract from spec + verify script is authoritative |
| Exact product copy Plus → Adicional | Product decision; not blocking |
| Authenticated viewport QA | Out of scope (visual implementation phase) |

No data gap requiring schema or checkout changes.

---

## 23. Final gate

| Check | Status |
|-------|--------|
| CURRENT PRODUCTS RENDER OWNER | IDENTIFIED |
| CURRENT SUMMARY SOURCE | IDENTIFIED (hybrid; flatten at UI) |
| FLATTENING POINT | IDENTIFIED (`getCustomizationSummaryLines` / list renders strings only) |
| ORDER_ITEMS MODEL | MAPPED |
| SNAPSHOT V1 / V2 | MAPPED |
| GROUP / OPTION / QTY / PRICE / ORDERING | KNOWN |
| PARENT / OPTION QUANTITY SEMANTICS | KNOWN |
| PARENT PRICE / DOUBLE-COUNT | KNOWN |
| UPSELL MODEL | KNOWN |
| PRODUCT_ID NULL | KNOWN (YES with partial join fallback) |
| NO LIVE CONFIG FOR CUSTOMIZATIONS | CONFIRMED |
| STRUCTURED + LEGACY FALLBACKS | DEFINED |
| NO STRING PARSING REQUIRED | CONFIRMED for V1/V2 structured path |
| PREPARATION VM OWNER | RECOMMENDED |
| WORKSPACE / DETAIL | SHOULD BOTH USE NEW RENDERER = **YES** (shared component) |
| ORDER CARD | NO CHANGE |
| WHATSAPP / COPY | NO CHANGE (first iteration) |
| TEXT MOCKS | COMPLETE |
| REALTIME / ACTIONS / DB / PUBLIC | NO CHANGE |

**ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-AUDIT-1** = **AUDIT COMPLETE — READY FOR IMPLEMENTATION**

---

**IMPLEMENTED BY:** `ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-1` (2026-08-18)

See `docs/admin-order-workspace-product-preparation-hierarchy-1.md` for implementation details. Historical audit findings above remain unchanged.


---

## Real data coverage (read-only QA)

Dev tenant `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` (`pkrsedmwxekbhlohhqds`):

| Case | Coverage |
|------|----------|
| Simple | YES (legacy lines, no snapshot) |
| V1 customized | YES (29 items; sample `e22cd2f2…`) |
| V2 customized | YES (12 items; sample `71f5b9e3…`) |
| Upsell | YES (38 upsell rows) |
| Qty extras V2 | YES (Bacon ×4 in `71f5b9e3…`) |
| Parent qty > 1 customized | V1 YES (`6e9a04e7…`, qty 2); V2 qty extras + parent qty > 1 **NOT AVAILABLE** |
| product_id null | YES (10 rows; e.g. `e33a7b17…` Papas Cheddar) |

---

## Visual hierarchy spec (no CSS)

| Level | Content | Priority |
|-------|---------|----------|
| L1 | Product row: `N× name` + line total | P1 |
| L2 | Group name (indented, quiet) | P2 |
| L3 | Option name (+ qty when V2 > 1) | P1 |
| L4 | Price/meta (line total only by default) | P3 |

Separate products with whitespace + subtle divider; no nested cards; no ticket monospace.

**SNAPSHOT ORDER STABLE** = **YES** (`sort_order` persisted at order time).  
**OPTION ORDER STABLE** = **YES** (`sort_order` on selected_options).

**REUSE POTENTIAL (kitchen / print)** = **HIGH** — same pure preparation VM.
