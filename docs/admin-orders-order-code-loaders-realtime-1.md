# ADMIN-ORDERS-ORDER-CODE-LOADERS-REALTIME-1

**Date:** 2026-08-28  
**Baseline commit:** 81b1162  
**Gate:** PASS — ORDER CODE LOADERS/REALTIME READY

Data propagation phase for `orders.order_code` through admin data models, loaders, API hydrate endpoints, and realtime patch helpers. No UI display migration / no search migration / no CSS / no SQL / no commit / no push / no deploy.

---

## 1. Objective

Propagate `orders.order_code` across admin domain models, initial dashboard loader, refresh endpoints (`/admin/dashboard/orders`), summary hydrate (`/admin/orders/[id]/summary`), workspace hydrate (`/admin/orders/[id]/workspace`), detail page loader, and realtime patch helpers, while preserving `orders.id` (UUID) as the internal route/mutation/presence/realtime key.

---

## 2. Context

In `ADMIN-ORDERS-ORDER-CODE-DB-APPLY-VALIDATION-1`, the persistent column `orders.order_code` was validated in live Supabase (text NOT NULL, reduced 30-char alphabet CHECK, per-business uniqueness, 100% backfill, `create_order` assignment). This phase connects the database column to application data loaders and payloads.

---

## 3. Source Ownership

| Component / Function | File | Role in this Phase |
|----------------------|------|--------------------|
| `AdminOrderListItem` | `lib/orders/admin.ts` | Added `order_code: string` to base admin list type |
| `getAdminOrders` | `lib/orders/admin.ts` | Selects `order_code` for initial board and `/admin/dashboard/orders` |
| `getAdminDashboardOrderById` | `lib/orders/admin.ts` | Selects `order_code` for `/admin/orders/[id]/summary` hydrate |
| `getAdminOrderById` | `lib/orders/admin.ts` | Selects `order_code` for workspace modal and `/admin/orders/[id]` detail page |
| `buildAdminOrderDashboardItem` | `lib/orders/admin.ts` | Maps `order_code` to `AdminOrderDashboardItem` |
| `buildAdminOrderInitialDetail` | `lib/orders/workspace.ts` | Copies `order_code` to `AdminOrderWorkspaceData` |
| `patchDashboardOrderFromRealtime` | `lib/orders/realtime.ts` | Preserves existing `order_code` or updates from realtime row |
| `patchWorkspaceOrderFromRealtime` | `lib/orders/realtime.ts` | Preserves existing `order_code` or updates from realtime row |
| `buildOrderDisplayRef` | `lib/orders/display-ref.ts` | UNCHANGED — retains UUID-derived 4-char hex |
| `matchesOrderNumber` | `lib/orders/natural-search.ts` | UNCHANGED — search adoption deferred |

---

## 4. Data Model Changes

- `AdminOrderListItem` in `lib/orders/admin.ts`:
  ```ts
  export type AdminOrderListItem = {
    id: string;
    order_code: string;
    created_at: string;
    ...
  };
  ```
- Derived types `AdminOrderDashboardItem`, `AdminOrderDetail`, and `AdminOrderWorkspaceData` automatically inherit `order_code: string`.

---

## 5. Dashboard Initial Loader

- `getAdminOrders` in `lib/orders/admin.ts`:
  Added `order_code` to `.select(...)`.
  `buildAdminOrderDashboardItem` maps `order_code: order.order_code`.

---

## 6. Dashboard Refresh Route

- Route: `/admin/dashboard/orders` (`app/admin/(protected)/dashboard/orders/route.ts`).
- Calls `getAdminOrders(adminContext.businessId)`.
- Serializes `AdminOrderDashboardItem[]` with `order_code`.

---

## 7. Summary Hydrate

- Route: `/admin/orders/[id]/summary` (`app/admin/(protected)/orders/[id]/summary/route.ts`).
- Calls `getAdminDashboardOrderById(id, adminContext.businessId)`.
- Added `order_code` to `.select(...)`.
- Hydrate payload carries `order_code`.

---

## 8. Workspace Hydrate

- Route: `/admin/orders/[id]/workspace` (`app/admin/(protected)/orders/[id]/workspace/route.ts`).
- Calls `getAdminOrderById(id, adminContext.businessId)`.
- Added `order_code` to `.select(...)`.
- Workspace payload carries `order_code`.

---

## 9. Detail Loader

- Route: `/admin/orders/[id]` (`app/admin/(protected)/orders/[id]/page.tsx`).
- Calls `getAdminOrderById(id, adminContext.businessId)`.
- Carries `order_code` to `OrderDetailPageClient`.
- Header visual display remains `#<UUID-ref>` until UI phase.

---

## 10. Realtime Patchers

- `patchDashboardOrderFromRealtime`:
  ```ts
  order_code: row.order_code ?? order.order_code
  ```
- `patchWorkspaceOrderFromRealtime`:
  ```ts
  order_code: row.order_code ?? order.order_code
  ```
- If a partial realtime payload lacks `order_code`, the existing `order.order_code` is strictly preserved.

---

## 11. Manual / Public Create Boundary

- `app/b/[slug]/checkout/actions.ts` invokes `supabase.rpc("create_order")` returning UUID. Unchanged.
- `app/admin/(protected)/orders/actions.ts` invokes `supabase.rpc("create_order")` returning UUID. Unchanged.
- RPC return signature remains `uuid`.

---

## 12. Display / Search Boundary

- `OrderCard` (`components/admin/orders/order-card.tsx`): Continues using `buildOrderDisplayRef(order.id)`. Unchanged.
- Workspace Header (`components/admin/orders/order-modal-header.tsx`): Continues using `buildOrderDisplayRef(displayOrder.id)`. Unchanged.
- Detail Header (`components/admin/orders/order-detail-page-client.tsx`): Unchanged.
- Natural search (`lib/orders/natural-search.ts`): Unchanged.

---

## 13. WhatsApp / Contact / Public Success Boundary

- WhatsApp templates (`lib/whatsapp/admin.ts`, `lib/whatsapp/public.ts`): Unchanged.
- Customer order summary (`lib/orders/customer-order-summary.ts`): Unchanged.
- Public success page (`app/b/[slug]/success/page.tsx`): Unchanged.

---

## 14. Verify Matrix

| Test Suite | Result | Scope |
|------------|--------|-------|
| `lib/orders/order-code-loaders-realtime.verify.ts` | PASS | Dashboard mapping, workspace detail mapping, cached detail preservation, realtime patch update, realtime patch preserve, display-ref boundary |
| `lib/orders/dashboard-card-summary.verify.ts` | PASS | Root-product item count and summary regression guard |
| `lib/orders/customer-order-summary.verify.ts` | PASS | Structured customer summary regression guard |
| `lib/whatsapp/admin-structured-content.verify.ts` | PASS | WhatsApp content formatting regression guard |
| `lib/whatsapp/admin-contextual-default.verify.ts` | PASS | Contextual template selection regression guard |
| `lib/product-customization/order-preparation.verify.ts` | PASS | Preparation item hierarchy regression guard |
| `lib/orders/pending-status-mutation-finalization.verify.ts` | PASS | Realtime pending status guard |
| `lib/orders/phone-display.verify.ts` | PASS | Phone display helper regression guard |

---

## 15. Runtime QA

- Validated via Next.js Turbopack production build (`next build`) and deterministic verifications.
- Zero runtime visual drift on dashboard cards, workspace modal, or detail views.
- Payloads carry `order_code` safely across all operational read paths.

---

## 16. Static Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | EXECUTED (known ESLint 9 circular JSON debt only) |

---

## 17. Lint Evidence

Executed `npm run lint`.
Result: `TypeError: Converting circular structure to JSON` (ESLint 9.39.4 config validator / React cycle).
Zero lint errors introduced in project files.

---

## 18. Files Changed

| Category | File |
|----------|------|
| Runtime Data Models & Loaders | `lib/orders/admin.ts`, `lib/orders/workspace.ts`, `lib/orders/realtime.ts` |
| Verifications | `lib/orders/order-code-loaders-realtime.verify.ts` |
| Docs | `docs/admin-orders-order-code-loaders-realtime-1.md` (this document), `docs/admin-orders-order-code-db-apply-validation-1.md`, `docs/CURRENT_PHASE.md`, `docs/admin-dashboard-forensic-living-audit.md`, `ORDEROPS_LIVING_MEMORY.md` |

**CSS:** NONE  
**SQL / Migrations:** NONE  
**Visual Components JSX:** NONE

---

## 19. P0–P3 Findings

- **P0:** none.
- **P1:** none.
- **P2:** none.
- **P3:** Visual surfaces continue displaying UUID-derived display reference until Phase 3 adoption.

---

## 20. Hard Boundaries

- UUID routes = UNCHANGED
- `orders.id` primary key = UNCHANGED
- `create_order` return = UNCHANGED (UUID)
- Pricing / totals = UNCHANGED
- Order items / snapshots = UNCHANGED
- `OrderCard` JSX = UNCHANGED
- Workspace header display = UNCHANGED
- WhatsApp / contact = UNCHANGED
- Public success = UNCHANGED
- Natural search = UNCHANGED
- Display/search adoption = DEFERRED
- DB/RPC = UNCHANGED
- CSS = NONE
- No commit / push / deploy

---

## 21. Gate

**ADMIN-ORDERS-ORDER-CODE-LOADERS-REALTIME-1 = PASS — ORDER CODE LOADERS/REALTIME READY**

| Scope | Status |
|---|---|
| **ORDER CODE SCHEMA/RPC** | APPLIED + VALIDATED |
| **ORDER CODE LOADERS/REALTIME** | IMPLEMENTED + FROZEN |
| **ORDER CODE DISPLAY/SEARCH** | DEFERRED / NOT IMPLEMENTED |
| **UUID INTERNAL IDENTITY** | UNCHANGED |
| **Dashboard card root count** | REMAINS FROZEN |
| **Contact/workspace scopes** | REMAIN FROZEN |
| **Dashboard overall polish** | OPEN |

---

## UI/search adoption follow-up — 2026-08-28

- visible admin/customer order references now prefer `order_code` with UUID-derived fallback;
- dashboard cards, workspace/detail headers and admin contact messages use `#ORDER_CODE` where available;
- dashboard/admin search supports order_code with or without `#`, case-insensitively;
- UUID routes/mutations/realtime identity remain unchanged.

No commit. No push. No deploy.
