# ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-AUDIT-1

**Date:** 2026-08-17  
**Status:** IMPLEMENTED BY `ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-1`  
**Scope:** Tenant-aware ON/OFF for order responsibility/assignment (admin only)  
**Runtime changes:** NONE (audit only)

**Product decision (locked):**
- Flag per business, default **OFF** for all existing businesses
- OFF → responsibility UX disappears entirely (no disabled placeholders)
- ON → current behavior preserved
- Data/schema/actions/realtime infra preserved; no customer-facing Settings toggle in v1

---

## 1. Executive conclusion

Order assignment is a **mature, admin-only subsystem** with DB columns (`orders.assigned_to`, `assigned_at`), one server action (`updateOrderAssignmentAction`), optimistic + realtime reconciliation, and ~15 UI touchpoints across dashboard cards, workspace, detail page, lane metrics, timeline, and risk.

**There is no tenant feature flag today** — assignment is available whenever `updateOrders` permission + active store session allow mutations.

**Recommended implementation:**
- Add `business_settings.order_assignment_enabled` (`BOOLEAN NOT NULL DEFAULT false`)
- Server helper `isOrderAssignmentEnabled()` (fail-closed, mirror `product_customization_enabled`)
- Resolve **`orderResponsibilityEnabled`** boolean on server pages; pass as prop (no raw DB field in UI)
- **UI-only gating** for presentation; **server-action hardening required** on `updateOrderAssignmentAction`
- **Do NOT** change realtime/reconciliation internals — fields continue to flow when OFF
- **ONE implementation phase** is feasible (manageable blast radius)

**READY FOR IMPLEMENTATION = YES** (one product decision on historical timeline copy — see §15)

---

## 2. Current architecture map

```text
DB: orders.assigned_to (uuid FK profiles) + assigned_at
    order_events: assignment_taken | assignment_released (+ transfer via payload)

Server load: lib/orders/admin.ts (select assigned_to/assigned_at on all admin order queries)

Mutation: app/admin/(protected)/orders/[id]/actions.ts
          updateOrderAssignmentAction(claim | release)
          permission: updateOrders + tenant + active store session

Labels/helpers: lib/orders/assignment.ts

Realtime: use-admin-orders-realtime.ts patches assigned_to/assigned_at
          pending assignment mutations (mark/resolve/suppress)

Reconciliation: lib/orders/dashboard-order-reconciliation.ts (first-class assignment)

Client optimistic: admin-dashboard-orders.tsx, order-detail-page-client.tsx,
                   admin-order-workspace-modal.tsx, order-assignment-controls.tsx

Permissions: updateOrders only (no assignOrders enum)
Client policy: canAssignOrders via resolveDashboardActionPolicy (review mode OFF)
```

---

## 3. UI surface inventory

| Surface | Component owner | CSS owner | Responsibility UI | OFF behavior recommended | Risk |
| --- | --- | --- | --- | --- | --- |
| Dashboard OrderCard | `order-card.tsx` | `order-card.module.css` | Meta line: Sin responsable / A tu cargo / A cargo de {name} | Hide meta line entirely | LOW |
| Kanban board | `DashboardKanbanBoard.tsx` | `dashboard-kanban.module.css` | Via OrderCard | Pass capability to OrderCard | LOW |
| Filtered list | `admin-dashboard-orders.tsx` | `dashboard-list.module.css` | Via OrderCard | Same | LOW |
| Lane metrics strip | `lane-metrics-layer.tsx` | `lane-metrics-layer.module.css` | Sin responsable, Asignados, unassigned alerts | Hide assignment metrics/alerts | MED |
| Workspace modal | `admin-order-workspace-modal.tsx` | modal + workspace modules | Claim panel, assignment controls, responsable copy | Hide assignment sections | MED |
| Order actions column | `order-actions-section.tsx` | `order-workspace.module.css` | Hosts assignment controls | Hide assignment block | LOW |
| Assignment controls | `order-assignment-controls.tsx` | `order-detail-surfaces.module.css` | Responsable label, Tomar/Liberar/Tomar igual | Hide entire component | LOW |
| Recommended action | `order-recommended-action-panel.tsx` | module + global tone classes | Pending+unassigned → Tomá el pedido | Hide claim branch | MED |
| Workspace overview | `order-workspace-overview.tsx` | `order-workspace-overview.module.css` | assignmentLabel line | Hide assignment line | LOW |
| Order detail page | `order-detail-page-client.tsx` | `order-detail-page.module.css` | Orchestrates workspace + assignment | Pass capability | MED |
| Presence pill | `operator-presence-pill.tsx` | `operator-presence-pill.module.css` | Assignee-specific phrasing | Keep presence; simplify copy | LOW |
| Risk panel / card chip | `order-risk-panel.tsx`, `order-card.tsx` | respective modules | Reasignado signal | Hide when OFF | LOW |
| Human timeline | `order-human-timeline.tsx` | `order-human-timeline.module.css` | Took/released/reassigned events | Hide assignment rows when OFF | MED |
| Toolbar/search | `DashboardToolbar.tsx`, `operational-search.tsx` | toolbar/search modules | No assignment filter UI today | N/A | NONE |
| Manual order modal | `manual-order-modal.tsx` | manual-order module | No assignment UI | N/A | NONE |

### ORDER CARD GATE OWNER

**`components/admin/orders/order-card.tsx`** — meta line driven by `order.assigned_to` via `buildOrderAssignmentOwnerLabel()`. Gate with `orderResponsibilityEnabled` from parent; card actions do not depend on assignment.

### WORKSPACE OWNER

**`admin-order-workspace-modal.tsx`** + **`order-actions-section.tsx`** + **`order-assignment-controls.tsx`**. Assignment is an isolated section; status actions independent.

### ORDER DETAIL OWNER

**`order-detail-page-client.tsx`** — must receive same flag as dashboard.

---

## 4. Actions / mutations

| Action | File | Mutation | Permission | Called from | Remain when OFF? |
| --- | --- | --- | --- | --- | --- |
| `updateOrderAssignmentAction` | `orders/[id]/actions.ts` | UPDATE assignment + order_events | `updateOrders` | `order-assignment-controls.tsx` | Code yes; **reject when OFF** |
| `updateOrderStatusAction` | same | status only | `updateOrders` | quick actions | YES unchanged |

**Server hardening: YES** — add `isOrderAssignmentEnabled(businessId)` to assignment action.

---

## 5. Permissions

Assignment uses **`updateOrders`** only. Feature flag = **additional gate** alongside permission and review-mode `canAssignOrders`.

---

## 6. Data model

- `orders.assigned_to` (uuid nullable FK profiles), `assigned_at` (timestamptz nullable)
- `order_events`: assignment_taken, assignment_released
- No status transition requires assignee; checkout/totals unaffected
- **Existing assigned orders while OFF: SAFE = YES**

---

## 7. Realtime / reconciliation

**REALTIME CHANGE REQUIRED = NO**  
**RECONCILIATION CHANGE REQUIRED = NO**

Fields may continue in payloads when OFF; UI won't render or mutate assignment.

---

## 8. business_settings flag pattern

Reference: `product_customization_enabled` + `lib/product-customization/flags.ts`

### RECOMMENDED FLAG COLUMN

**`order_assignment_enabled`**

**RATIONALE:** matches `_enabled` suffix; domain uses "assignment" throughout (`assigned_to`, `OrderAssignmentControls`).

---

## 9. Migration strategy

| Item | Value |
| --- | --- |
| Migration needed | YES |
| Type | `boolean not null default false` |
| Backfill | NO (DEFAULT applies) |
| New businesses | Update `create_default_business_settings()` |

---

## 10. Flag read path

```text
business_settings.order_assignment_enabled
  ↓
lib/orders/assignment-flags.ts → isOrderAssignmentEnabled()
  ↓
dashboard/page.tsx + orders/[id]/page.tsx
  ↓
orderResponsibilityEnabled: boolean
  ↓
admin-dashboard-orders.tsx | order-detail-page-client.tsx
  ↓
OrderCard, assignment controls, lane metrics, workspace
```

**RESOLVED CAPABILITY** (not raw DB field in UI).  
**Additional fetch:** YES — one settings read per orders page (cache helper for dedupe).  
**FUTURE SETTINGS OWNER:** `/admin/settings/operations` (no toggle in v1).

---

## 11. Route propagation

| Route | Needs flag? | Server source | UI owner |
| --- | --- | --- | --- |
| `/admin/dashboard` | YES | dashboard page | cards, modal, lane metrics |
| `/admin/orders/[id]` | YES | order detail page | workspace tree |
| Assignment action | YES (server) | inside action | N/A |
| Public catalog | NO | — | — |

---

## 12. OFF / ON contract

### MUST HIDE (OFF)

Card meta, assignment controls, claim CTAs, lane unassigned metrics, responsable copy, recommended claim panel, reassignment risk signal; **recommend** hiding assignment timeline rows.

### MUST REMAIN

DB columns, events, realtime fields, action code (gated), status/create_order/checkout, presence (non-assignment copy).

### ON

Current behavior **unchanged**.

---

## 13. Notifications / public

- **Notifications impact:** NONE (assignment does not trigger push/sound)
- **PUBLIC BLAST RADIUS:** NONE

---

## 14. Blast radius

**MUST TOUCH:** migration, `assignment-flags.ts`, dashboard + detail pages, assignment action gate, orchestrators, OrderCard, assignment controls, workspace/modal, lane metrics, recommended panel.

**HARD NO TOUCH:** realtime hooks internals, reconciliation logic, create_order, checkout, public catalog, column removal.

**Phasing:** ONE PHASE recommended.

---

## 15. Unresolved decisions

1. Hide vs neutralize assignment timeline events when OFF — **recommend hide**
2. Hide "Reasignado" risk signal when OFF — **recommend hide**

---

## 16. Checks (audit)

| Check | Result |
| --- | --- |
| `git diff --check` | PASS (docs only) |
