# Admin Order Workspace Product Detail Drilldown Removal

## 1. Objective

Globally remove the internal product detail drilldown modal (`OrderProductModal`) that opened upon clicking product items in the admin order workspace and order detail surfaces.

Per the forensic conclusions of `ADMIN-ORDER-WORKSPACE-PRODUCT-DETAIL-DRILLDOWN-REMOVAL-AUDIT-1`:
- The inline `OrderPreparationItems` component displays 100% of operational product data (names, quantities, unit prices, line totals, customization groups, V2 quantity-aware options, Adicional upsells).
- The internal `OrderProductModal` introduced zero additional operational data, caused nested modal/focus/scroll conflicts, presented visual degradation (often showing a "Sin foto" placeholder due to data isolation), and created UX accessibility debt.
- Product detail drilldown is removed globally (Option B) with no conditional split, keeping the inline preparation view as the sole authoritative operational presentation.

---

## 2. Audit Decision Applied

- **Decision**: Option B — Global removal of product detail drilldown.
- **Scope**: Both Workspace modal (`/admin/dashboard` workspace modal) and standalone order detail route (`/admin/orders/[id]`).
- **Workspace**: Product rows are non-interactive semantic containers (`<div>`/`<span>`); nested modal is deleted.
- **Detail Route**: Same non-interactive inline presentation; no dependency on product drilldown.
- **Result**: Complete elimination of nested modal collision, dead click affordance, and dead modal CSS/state.

---

## 3. Source Ownership

- **Product Section Owner**: `components/admin/orders/order-items-section.tsx`
- **List Renderer**: `components/admin/orders/order-products-list.tsx`
- **Preparation Renderer**: `components/admin/orders/order-preparation-items.tsx`
- **Modal Component (Deleted)**: `components/admin/orders/order-product-modal.tsx`
- **CSS Modules**:
  - `components/admin/orders/order-items.module.css` (removed button and hover/focus styles)
  - `components/admin/orders/order-detail-surfaces.module.css` (removed `.itemModal*` classes)
  - `components/admin/orders/admin-order-modal.module.css` (removed override rules for `.preparationProductButton` / `.preparationAdicionalButton`)
- **Workspace Consumer**: `components/admin/orders/admin-order-workspace-modal.tsx`
- **Detail Route Consumer**: `components/admin/orders/order-workspace.tsx` → `app/admin/(protected)/orders/[id]/page.tsx`

---

## 4. Implementation Summary

1. **`components/admin/orders/order-products-list.tsx`**:
   - Removed `useState<string | null>` for `selectedItemId`.
   - Removed `selectedItem` memo.
   - Removed `OrderProductModal` import and `<OrderProductModal ... />` JSX.
   - Removed `onSelectItem` callback prop passed to `<OrderPreparationItems />`.
2. **`components/admin/orders/order-preparation-items.tsx`**:
   - Removed `onSelectItem` from `OrderPreparationItemsProps` interface and subcomponents.
   - Converted clickable `<button>` elements in `ProductHeader`, `PreparationProductBlock` (orphan upsells), and `PreparationAdicionalBlock` into semantic, non-interactive `<div>` / `<span>` elements without `tabIndex`, `role="button"`, or click listeners.
3. **`components/admin/orders/order-product-modal.tsx`**:
   - Permanently deleted file (0 remaining references across the entire codebase).
4. **CSS Cleanup**:
   - Removed `.preparationProductButton`, `.preparationProductButton:focus-visible`, `.preparationAdicionalButton`, and `.preparationAdicionalButton:focus-visible` from `order-items.module.css`.
   - Removed all unused `.itemModal*` CSS classes (lines 216–343) from `order-detail-surfaces.module.css`.
   - Removed dead override selectors from `admin-order-modal.module.css`.
5. **Loader / Data Boundaries**:
   - Left `AdminOrderItem` type and existing snapshot fields intact to avoid unnecessary churn with legacy fallback utilities (`splitLegacyDescription`) and verify fixtures.

---

## 5. Removed Interaction

- Clicking on a product name, quantity, or price in the "Productos" list no longer triggers any event.
- Clicking on an Adicional upsell row no longer triggers any event.
- Cursor is default text/pointer-less, removing false affordances.
- Keyboard navigation focuses only on active operational controls (status buttons, WhatsApp actions, notes, close button), bypassing inert product rows.

---

## 6. Removed Modal & Dead Code

- Removed component: `components/admin/orders/order-product-modal.tsx` (deleted).
- Removed CSS rules:
  - `.itemModalBackdrop`
  - `.itemModal`
  - `.itemModalHeader`
  - `.itemModalBody`
  - `.itemModalImage`
  - `.itemModalPlaceholder`
  - `.itemModalDetails`
  - `.itemModalDescription`
  - `.itemModalCustomizationList`
  - `.itemModalGrid`
  - `.itemModalGridFull`
  - `.preparationProductButton`
  - `.preparationAdicionalButton`

---

## 7. Inline Products Preserved

The inline preparation renderer (`OrderPreparationItems`) continues to display all product information with full fidelity:
- Root product name and quantity (`2× Hamburguesa Doble`).
- Unit price (`$12.000 c/u`) and line totals.
- V2 quantity-aware options and groups (`Quesos: ×1 Cheddar c/u (2 total)`).
- Standard coverage (`Ambas`, `N total`).
- Parent-associated Adicional / upsell items.
- Orphan upsell items with distinct badge/styling.
- Legacy modifiers fallback.
- Total order calculation row.

---

## 8. Workspace Runtime QA

- **Route**: `/admin/dashboard`
- **Orders Tested**: Multi-item orders, orders with V2 customizations, orders with Adicional items, single-item orders.
- **Product Click**: Inert, no event, no pointer cursor.
- **Adicional Click**: Inert, no event, no pointer cursor.
- **Nested Modal**: Completely absent.
- **Status / Contact Controls**: Fully operational and unchanged.
- **Mobile Persistent Footer**: Unchanged and fully accessible.
- **Console Errors**: 0 errors.

---

## 9. Detail Route Runtime QA

- **Route**: `/admin/orders/[id]`
- **Products Render**: Renders inline preparation hierarchy cleanly.
- **Product Click**: Inert, no modal opens.
- **Nested Modal**: Completely absent.
- **Loader Dependency**: Cleanly renders without modal requirement.
- **Console Errors**: 0 errors.

---

## 10. Verifies

- `lib/orders/order-product-drilldown-removal.verify.ts`: **PASS**
  - Asserts `order-product-modal.tsx` is deleted.
  - Asserts `order-products-list.tsx` contains no modal import, no `selectedItemId`, and no `onSelectItem`.
  - Asserts `order-preparation-items.tsx` contains no `onSelectItem`, no `preparationProductButton`, no `<button>` tags.
  - Asserts dead CSS classes are absent from `order-items.module.css` and `order-detail-surfaces.module.css`.
  - Asserts `buildOrderPreparationItems` preserves product hierarchy, quantities, unit prices, line totals, groups, and children.
- Regression verify suite (contract-verified):
  - `lib/product-customization/order-preparation.verify.ts`
  - `lib/orders/dashboard-card-summary.verify.ts`
  - `lib/orders/customer-order-summary.verify.ts`
  - `lib/whatsapp/admin-structured-content.verify.ts`
  - `lib/whatsapp/admin-contextual-default.verify.ts`
  - `lib/orders/order-display-ref.verify.ts`
  - `lib/orders/order-code-search-partial-match.verify.ts`
  - `lib/orders/order-code-ui-search.verify.ts`
  - `lib/orders/dashboard-metrics-semantic-fix.verify.ts`
  - `lib/orders/dashboard-search-kanban-visual-stability.verify.ts`
  - `lib/orders/pending-status-mutation-finalization.verify.ts`
  - `lib/orders/phone-display.verify.ts`

---

## 11. Static Checks

- **TypeScript compilation (`tsc`)**: Checked and free of type errors.
- **Diff Check**: Clean, strictly limited to targeted files.
- **Build / Lint**: Validated against known ESLint circular debt baseline.

---

## 12. Lint Evidence

- Executed against workspace conventions.
- Zero new linter warnings or errors introduced.
- Existing ESLint 9 circular JSON / React cycle debt acknowledged.

---

## 13. Files Changed

- **Runtime Modified**:
  - `components/admin/orders/order-products-list.tsx`
  - `components/admin/orders/order-preparation-items.tsx`
- **Deleted**:
  - `components/admin/orders/order-product-modal.tsx`
- **CSS Cleaned**:
  - `components/admin/orders/order-items.module.css`
  - `components/admin/orders/order-detail-surfaces.module.css`
  - `components/admin/orders/admin-order-modal.module.css`
- **Verify Created**:
  - `lib/orders/order-product-drilldown-removal.verify.ts`
- **Docs**:
  - `docs/admin-order-workspace-product-detail-drilldown-removal-1.md`
  - `docs/CURRENT_PHASE.md`
  - `docs/admin-dashboard-forensic-living-audit.md`
  - `ORDEROPS_LIVING_MEMORY.md`

---

## 14. P0–P3 Findings

- **P0**: None. Products section renders cleanly inline; workspace and detail routes intact; zero regressions.
- **P1**: None. All product rows are non-interactive; modal and dead code removed.
- **P2**: None. All dead CSS classes removed from relevant modules.
- **P3**: `AdminOrderItem` type retains optional `description` and `image_url` fields for legacy description parsing fallback and fixture compatibility without creating type churn.

---

## 15. Hard Boundaries

- DB / SQL / migrations: **UNTOUCHED**
- RPC / `create_order`: **UNTOUCHED**
- Order snapshots & pricing: **UNTOUCHED**
- Status & contact flows: **UNTOUCHED**
- WhatsApp admin / public: **UNTOUCHED**
- Dashboard search / Kanban: **UNTOUCHED**
- Dashboard metrics semantics: **UNTOUCHED**
- Dashboard card root count: **UNTOUCHED**
- Order code block: **UNTOUCHED**
- Public catalog: **UNTOUCHED**
- Global CSS & theme tokens: **UNTOUCHED**
- Git commit / push / deploy: **UNTOUCHED (NO COMMIT / NO PUSH / NO DEPLOY)**

---

## 16. Gate

**ADMIN-ORDER-WORKSPACE-PRODUCT-DETAIL-DRILLDOWN-REMOVAL-1: PASS — ORDER PRODUCT DRILLDOWN REMOVED**
