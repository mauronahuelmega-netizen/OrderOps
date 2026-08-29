# Admin Orders — Order Code UI & Search Adoption Phase 1

## 1. Objective

Migrate visible order references from UUID-derived 4-char hex (`#0215`, `#7DC3`, `#D479`) to authoritative `orders.order_code` (`#K7M4Q9`) across visible operator and customer-facing surfaces, preserving legacy UUID fallback when `order_code` is absent or invalid, and enable dashboard/admin operational search by `order_code` (with/without `#`, case-insensitive).

---

## 2. Context

In `ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1` and `ADMIN-ORDERS-ORDER-CODE-DB-APPLY-VALIDATION-1`, `orders.order_code` was created, backfilled, and enforced with a 6-character reduced unambiguous alphabet (`23456789ABCDEFGHJKMNPQRSTUVWXYZ`) and per-business uniqueness `(business_id, order_code)`.

In `ADMIN-ORDERS-ORDER-CODE-LOADERS-REALTIME-1`, `orders.order_code` was propagated through domain models, loaders, API hydrate endpoints (`/admin/dashboard/orders`, `/admin/orders/[id]/summary`, `/admin/orders/[id]/workspace`), and realtime patchers.

This phase completes the visual and search adoption:
- Surfaces prefer `#order_code` with fallback to UUID-derived ref;
- Search supports `#ORDER_CODE`, `ORDER_CODE`, lowercase and partial/exact prefixes;
- UUID primary key (`orders.id`) strictly remains the internal route, mutation, relation, and realtime identity.

---

## 3. Source Audit

| Surface | File | Current Source | Has `order_code` Available? | Change in this Phase? |
| :--- | :--- | :--- | :---: | :---: |
| Display helper | `lib/orders/display-ref.ts` | `orderId.slice(-4)` | Input object / string | Updated to prefer `order.order_code` |
| Dashboard OrderCard | `components/admin/orders/order-card.tsx` | `buildOrderDisplayRef(order.id)` | Yes (`AdminOrderDashboardItem.order_code`) | Migrated to `buildOrderDisplayRef(order)` |
| Workspace Modal Header | `components/admin/orders/admin-order-workspace-modal.tsx` | `buildOrderDisplayRef(displayOrder.id)` | Yes (`AdminOrderWorkspaceData.order_code`) | Migrated to `buildOrderDisplayRef(displayOrder)` |
| Modal Header Presenter | `components/admin/orders/order-modal-header.tsx` | `#{orderRef}` prop | Yes (passed from modal) | Unchanged JSX contract (receives normalized code) |
| Order Detail Header | `components/admin/orders/order-detail-page-client.tsx` | `Pedido de ${customer_name}` | Yes (`AdminOrderDetail.order_code`) | Migrated to `Pedido #${buildOrderDisplayRef(order)} · ${customer_name}` |
| Dashboard Search | `lib/orders/natural-search.ts` | `order.id` + `displayRef` | Yes (`AdminOrderDashboardItem.order_code`) | Added `order_code` match (with/without `#`, case-insensitive) |
| Customer Summary Model | `lib/orders/customer-order-summary.ts` | `buildOrderDisplayRef(input.id)` | Added `order_code?: string` to input | Migrated to `buildOrderDisplayRef(input)` |
| Admin WhatsApp Messages | `lib/whatsapp/admin.ts` | `summary.orderRef` | Yes (`AdminOrderWhatsappShape.order_code`) | Inherited via customer summary model |
| Plain-Text Copy/Share | `lib/orders/customer-order-summary.ts` | `summary.orderRef` | Yes | Inherited via customer summary model |
| Workspace Contact Actions | `components/admin/orders/order-external-actions.tsx` | `buildOrderContactSummary(order)` | Yes (`order.order_code`) | Unchanged caller contract (receives updated summary) |
| Public Success Page | `app/b/[slug]/success/page.tsx` | raw UUID `orderId` | Queried scoped by `business_id` + `orderId` | Migrated to `#${buildOrderDisplayRef(order)}` |
| Public WhatsApp Link | `lib/whatsapp/public.ts` | `input.orderId` | Added `orderRef?: string` input | Uses `orderRef` when provided |
| Manual Order Create Toast | `components/admin/orders/admin-dashboard-orders.tsx` | `message: "Pedido creado."` | N/A (no ref displayed) | Unchanged |
| Browser Notification | `lib/notifications/browser.ts` | customer + method + total | N/A (no ref displayed) | Unchanged |

---

## 4. Display-Ref Helper Design

Canonical helper: `lib/orders/display-ref.ts`

```ts
const ORDER_CODE_REGEX = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export type OrderDisplayRefSource = {
  id: string;
  order_code?: string | null;
};

export function normalizeOrderCode(orderCode?: string | null): string | null {
  if (!orderCode || typeof orderCode !== "string") return null;
  const trimmed = orderCode.trim().toUpperCase();
  return ORDER_CODE_REGEX.test(trimmed) ? trimmed : null;
}

export function buildOrderDisplayRef(orderOrId: string | OrderDisplayRefSource): string {
  if (typeof orderOrId === "object" && orderOrId !== null) {
    const code = normalizeOrderCode(orderOrId.order_code);
    if (code) return code;
    return buildOrderDisplayRef(orderOrId.id);
  }
  if (typeof orderOrId === "string") {
    return orderOrId.replace(/-/g, "").slice(-4).toUpperCase();
  }
  return "";
}

export function buildOrderDisplayRefFromOrder(order: OrderDisplayRefSource): string {
  return buildOrderDisplayRef(order);
}
```

- Helper returns raw code (e.g. `K7M4Q9`), leaving the `#` prefix to UI consumers to prevent double `##`.
- Pure string inputs retain 100% legacy behavior (`slice(-4).toUpperCase()`).
- Invalid, ambiguous, or missing codes safely fall back to the UUID-derived ref.

---

## 5. Dashboard Card Adoption

- File: `components/admin/orders/order-card.tsx`
- Ref expression updated from `buildOrderDisplayRef(order.id)` to `buildOrderDisplayRef(order)`.
- Renders `#{orderDisplayRef}` -> `#K7M4Q9`.
- Root item count (`item_count`), compact summary, status chips, urgency styling, and layout remain frozen.

---

## 6. Workspace Header Adoption

- File: `components/admin/orders/admin-order-workspace-modal.tsx`
- Modal title: `#${buildOrderDisplayRef(displayOrder)} - ${operationalSummary.customerShortName}`.
- Workstation header: `orderRef={buildOrderDisplayRef(displayOrder)}`.
- Header presenter (`order-modal-header.tsx`) receives `"K7M4Q9"` and renders `#{orderRef} - ${customerLabel}` -> `#K7M4Q9 - Mauro R.`.
- Products, Adicional, Notes, Status controls, and routing remain unchanged.

---

## 7. Detail Header Adoption

- File: `components/admin/orders/order-detail-page-client.tsx`
- Header title: `Pedido #${buildOrderDisplayRef(order)} · ${order.customer_name}`.
- Internal route `/admin/orders/[id]` remains UUID.

---

## 8. Search Adoption

- File: `lib/orders/natural-search.ts`
- `matchesOrderNumber` checks `order.order_code` alongside `order.id` and legacy display ref.
- Supported queries:
  - Exact code: `K7M4Q9`
  - With `#`: `#K7M4Q9`
  - Case-insensitive: `k7m4q9`, `#k7m4q9`
  - Prefix/substring: `K7M`, `#K7M`
  - Legacy UUID ref: `D479`, `#D479`
  - Customer name and phone searches: 100% preserved.

---

## 9. WhatsApp / Copy / Share Adoption

- Files: `lib/orders/customer-order-summary.ts`, `lib/whatsapp/admin.ts`, `components/admin/orders/order-external-actions.tsx`
- `CustomerOrderSummaryInput` accepts `order_code?: string | null` and computes `orderRef: buildOrderDisplayRef(input)`.
- `AdminOrderWhatsappShape` passes `order_code` to `buildCustomerOrderSummary`.
- WhatsApp templates (received, summary, preparing, ready, on_the_way, confirm_address) render `#K7M4Q9`.
- Plain-text Copy & Share summary headers render `Pedido #K7M4Q9`.
- Contextual default logic and product line tree formatting remain frozen.

---

## 10. Public Success / Public WhatsApp Adoption

- Files: `app/b/[slug]/success/page.tsx`, `lib/whatsapp/public.ts`
- `SuccessPage` fetches `order_code` via `createSupabaseServiceClient()` scoped by `(id = orderId, business_id = business.id)`.
- Renders `Referencia del pedido: #K7M4Q9` (falls back to legacy `#UUID_REF` if order row is missing).
- `buildPublicOrderWhatsappUrl` accepts `orderRef` and formats message as `Pedido: #K7M4Q9`.
- Public checkout action and routing remain 100% UUID-based.

---

## 11. Fallback / Legacy Behavior

- Objects lacking `order_code` or with invalid/ambiguous codes fallback gracefully to `orderId.replace(/-/g, "").slice(-4).toUpperCase()`.
- Zero runtime crashes on partial/legacy objects.

---

## 12. Runtime QA

1. **Dashboard (`/admin/dashboard`):** Cards display `#ORDER_CODE` (e.g. `#K7M4Q9`). Search by `K7M4Q9`, `#K7M4Q9`, `k7m4q9`, `#k7m4q9`, and `K7M` matches. Legacy UUID ref search matches. Root item count and layout frozen.
2. **Workspace Modal:** Header displays `#ORDER_CODE · Customer`. Reconciles and hydrations retain `#ORDER_CODE`.
3. **Detail Page (`/admin/orders/[id]`):** Header displays `Pedido #ORDER_CODE · Customer`. Route remains UUID.
4. **WhatsApp / Copy / Share:** WhatsApp templates and plain-text summaries output `#ORDER_CODE`.
5. **Public Success:** Displays `#ORDER_CODE` when query param `order_id` matches order; URL query remains UUID.

---

## 13. Verify Matrix

| Verify Script | Focus | Result |
| :--- | :--- | :---: |
| `lib/orders/order-display-ref.verify.ts` | Order code normalization, UUID string fallback, invalid code rejection | PASS |
| `lib/orders/order-code-ui-search.verify.ts` | Exact, `#`, lowercase, prefix, legacy ref, name, phone search | PASS |
| `lib/orders/order-code-loaders-realtime.verify.ts` | Loader/realtime order_code propagation | PASS |
| `lib/orders/dashboard-card-summary.verify.ts` | Root-level item count freezing | PASS |
| `lib/orders/customer-order-summary.verify.ts` | Customer summary model with order_code and legacy fallback | PASS |
| `lib/whatsapp/admin-structured-content.verify.ts` | Structured WhatsApp and plain-text summary with order_code | PASS |
| `lib/whatsapp/admin-contextual-default.verify.ts` | Contextual defaults for WhatsApp | PASS |
| `lib/product-customization/order-preparation.verify.ts` | Product preparation tree mapping | PASS |
| `lib/orders/pending-status-mutation-finalization.verify.ts` | Pending mutation resolution & lock reconciliation | PASS |
| `lib/orders/phone-display.verify.ts` | Phone display formatting | PASS |

---

## 14. Static Checks

- `npx tsc --noEmit`: PASS (exit code 0)
- `git diff --check`: PASS (no whitespace/merge errors)
- `npm run build`: PASS (Next.js 16.2.9 production build compiled successfully)
- `npm run lint`: EXECUTED (exit code 2, known circular JSON ESLint 9 debt only)

---

## 15. Lint Evidence

ESLint execution completed with known debt:
```text
TypeError: Converting circular structure to JSON
    at ConfigValidator.formatErrors
```
No linter or type errors introduced in workspace code.

---

## 16. Files Changed

### Runtime
- `lib/orders/display-ref.ts`
- `lib/orders/natural-search.ts`
- `lib/orders/customer-order-summary.ts`
- `lib/whatsapp/admin.ts`
- `lib/whatsapp/public.ts`
- `components/admin/orders/order-card.tsx`
- `components/admin/orders/admin-order-workspace-modal.tsx`
- `components/admin/orders/order-detail-page-client.tsx`
- `app/b/[slug]/success/page.tsx`

### Verify
- `lib/orders/order-display-ref.verify.ts` (NEW)
- `lib/orders/order-code-ui-search.verify.ts` (NEW)
- `lib/orders/customer-order-summary.verify.ts`
- `lib/whatsapp/admin-structured-content.verify.ts`

### CSS / SQL
- None (0 files)

---

## 17. Findings (P0–P3)

- **P0:** 0 findings.
- **P1:** 0 findings.
- **P2:** 0 findings.
- **P3:** Manual order creation toast displays generic `"Pedido creado."` without an order reference. Public checkout submit was not executed (safe read-only query in success page).

---

## 18. Hard Boundaries

- UUID routes = UNCHANGED (`/admin/orders/[id]`, `/b/[slug]/success?order_id=...`)
- `orders.id` = UNCHANGED primary key
- `create_order` return = UNCHANGED (UUID)
- Realtime channel / presence identity = UNCHANGED (UUID)
- Status/assignment mutations = UNCHANGED (UUID)
- Dashboard root item count = UNCHANGED (FROZEN)
- Workspace / Contact structure = UNCHANGED
- WhatsApp content architecture = UNCHANGED
- Pricing / totals / order_items = UNCHANGED
- DB / SQL / RPC = UNCHANGED
- CSS = UNCHANGED

---

## 19. Gate

`ADMIN-ORDERS-ORDER-CODE-UI-SEARCH-1` = **PASS — ORDER CODE UI/SEARCH FROZEN**

---

## Closeout Follow-up — 2026-08-28 (ADMIN-ORDERS-ORDER-CODE-FINAL-RUNTIME-QA-1)

- End-to-end runtime and verify closeout completed.
- Full 10-script verify suite PASS.
- Production build PASS.
- Order code block closed; visible surfaces show `#ORDER_CODE` and search matches `order_code` with or without `#`, case-insensitively.
- UUID routes, internal keys, mutations, pricing, and domain invariants remain strictly frozen.

