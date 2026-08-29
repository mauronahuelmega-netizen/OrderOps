# ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-1

**Date:** 2026-08-17  
**Status:** PASS — VALIDATED (see `docs/admin-order-responsibility-feature-flag-validation-1.md`)  
**Scope:** Tenant ON/OFF for order responsibility/assignment (admin only)  
**Audit baseline:** `docs/admin-order-responsibility-feature-flag-audit-1.md`

No commit / push / deploy.

---

## Migration

| Item | Value |
| --- | --- |
| File | `supabase/migrations/20260817043000_order_assignment_enabled_business_settings.sql` |
| Column | `business_settings.order_assignment_enabled` |
| Type | `boolean not null default false` |
| Existing rows | `false` via DEFAULT |
| New businesses | `false` via DEFAULT + existing trigger |

---

## Flag architecture

```text
business_settings.order_assignment_enabled
  ↓
lib/orders/assignment-flags.ts → isOrderAssignmentEnabled()
  ↓
dashboard/page.tsx + orders/[id]/page.tsx (Promise.all)
  ↓
orderResponsibilityEnabled: boolean
  ↓
admin-dashboard-orders.tsx | order-detail-page-client.tsx (minimal pass-through)
  ↓
OrderCard, assignment controls, workspace/modal, lane metrics, timeline, risk
```

**Extra reads:** one settings read per dashboard/detail page load (fail-closed helper).

**Server hardening:** `updateOrderAssignmentAction` rejects when flag OFF.

---

## OFF contract (gated surfaces)

- OrderCard assignment meta (`Sin responsable`, owner labels)
- `OrderAssignmentControls` (not mounted)
- Recommended claim panel branch
- Workspace/modal responsable copy + controls
- Lane metrics: Sin responsable / Asignados / A mi cargo + unassigned/mine lanes
- Risk signal `Reasignado`
- Timeline: `assignment_taken` / `assignment_released` rows; Reasignaciones metric; Reasignado signal
- Presence assignee-specific phrasing (assignedTo omitted in label builder input)

**Preserved:** DB `assigned_to`/`assigned_at`, events, realtime fields, reconciliation, status/create_order.

---

## ON contract

Current behavior **unchanged** when `order_assignment_enabled = true`.

---

## Realtime / reconciliation

- Hooks changed = **NO**
- Reconciliation changed = **NO**

---

## QA matrix

| Case | Expected |
| --- | --- |
| Default OFF | No assignment UI anywhere; mutations blocked server-side |
| Flag ON (local test only) | Full current assignment UX |
| ON → OFF → ON | Assignment data preserved; UI reappears |

---

## Checks

Recorded at implementation closeout (local):

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS (LF/CRLF warnings only) |
| `npm run build` | PASS |
| `npm run lint` | FAIL — known ESLint 9 circular JSON (`plugins.react`) |

---

## Known debt

- No Settings toggle (DB/internal only until future phase)
- Future owner: `/admin/settings/operations`
