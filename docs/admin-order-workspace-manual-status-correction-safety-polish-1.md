# ADMIN-ORDER-WORKSPACE-MANUAL-STATUS-CORRECTION-SAFETY-POLISH-1

**Status:** PASS  
**Date:** 2026-08-20  
**Type:** Targeted functional UX safety polish — manual status correction hardening  
**Baseline commit (unchanged):** `81b1162`  
**No commit / push / deploy**

---

## 1. Objective

Eliminate accidental cancellation from the manual Estado selector while preserving:

- frozen contextual status CTA matrix;
- shared mutation path (`use-order-status-mutation` → `updateOrderStatusAction` → `transition_order_status`);
- optimistic UI, realtime/reconciliation, and non-linear manual correction.

## 2. Previous safety gap

Selecting `Cancelado` and pressing `Guardar` invoked the status mutation immediately.

Cancellation is semantically destructive; `transition_order_status` may restock tracked inventory when entering `cancelled` from active states. There was no explicit second confirmation.

**Severity:** P2 operational safety (accidental cancel / restock risk).

## 3. Product decision

- Keep `Cancelado` in the manual selector.
- Do not remove cancellation from the domain.
- Do not add a second cancel RPC / Server Action.
- Entering `cancelled` from a non-cancelled state requires an **inline** confirmation before the existing mutation runs.

## 4. Cancellation interception

Owner: `components/admin/orders/status-form.tsx`

Local UI state: `isCancellationConfirmationOpen`.

On form submit:

- if `selectedStatus === "cancelled"` **and** `initialStatus !== "cancelled"` → open confirmation, **return** (no mutation);
- otherwise → existing `submitManualChange()`.

## 5. Confirmation UX

Inline surface inside Estado (feature-local CSS in `status-form.module.css`):

- Heading: `Cancelar pedido`
- Body: stock-restock advisory (no “irreversible” claim)
- Safe: `Volver` (`type="button"`)
- Destructive: `Cancelar pedido` (`type="button"` → `submitStatusChange("cancelled")`)

No nested modal, `window.confirm`, toast confirmation, or global confirm primitive.

## 6. Mutation architecture

Unchanged:

```text
Cancelar pedido → submitStatusChange("cancelled")
  → use-order-status-mutation
  → updateOrderStatusAction
  → transition_order_status
```

No new FormData/RPC/server confirmation token.

## 7. First-submit no-mutation contract

First `Guardar` after selecting Cancelado from a non-cancelled status:

- opens confirmation only;
- status unchanged;
- no toast;
- no status_changed event;
- no Kanban movement.

## 8. Volver/reset contract

`Volver`:

1. closes confirmation;
2. no mutation / toast / event;
3. restores select to authoritative `initialStatus`.

Selection change away from `cancelled` also dismisses confirmation.

## 9. Final confirm contract

Only explicit `Cancelar pedido` mutates. Destructive control is not the form default submit path.

## 10. Non-cancel manual regression

Completado → Pendiente (and other non-cancel corrections): select → Guardar → immediate existing mutation. No confirmation.

## 11. Contextual CTA regression

One-click pending→preparing / preparing→ready preserved. Unsaved Cancelado + contextual CTA does not cancel; CTA wins and select syncs.

## 12. Pending/double-submit

Shared `isPending` disables select, Volver, and destructive confirm. Rapid double-click on confirm: one mutation path (pending guard). Observed Cancelando… + disabled controls during cancel of `#45E0`.

## 13. Failure path

No intentional failure exercised this session. Architecture reuses existing mutation error/toast/rollback; confirmation closes when `initialStatus` becomes `cancelled` or when selection/`orderId` resets.

## 14. Cross-order reset

Confirmation is local component state. Resets on `orderId` change, unmount (modal close), selection away from cancelled, and authoritative cancelled. Reopen of `#45E0` after cancel: no confirmation stuck open.

## 15. Permissions

`canChangeStatus === false` unchanged; confirmation UI only renders when `canChangeStatus`.

## 16. Stock side-effect boundary

Client does not calculate or reimplement stock. Stock logic / RPC untouched.  
**Direct stock verification:** NOT DIRECTLY VERIFIED (no safe inventory fixture inspection this session).

## 17. Runtime QA

Tenant: La Burguesía. Disposable QA order `#45E0` (`a0514bae-4edf-46e0-8013-c4b69d4045e0`).

| Test | Result |
| ---- | ------ |
| Cancelado visible in manual selector | PASS |
| First Guardar on Cancelado mutates | NO |
| Confirmation appears | PASS |
| Status unchanged before confirm | PASS |
| Event before confirm | 0 (Kanban/status unchanged) |
| Toast before confirm | 0 |
| Volver performs mutation | NO |
| Volver restores select | PASS |
| Change selection dismisses confirm | PASS |
| Explicit Cancelar pedido | PASS (preparing → cancelled) |
| Confirm mutation / Kanban | single move to Cancelados |
| Double confirm safe | PASS (pending disables) |
| Reopen cancelled authoritative | PASS |
| Non-cancel manual correction | PASS |
| Contextual CTA unaffected | PASS |
| Unsaved select isolation | PASS |
| Pending cleanup | PASS |
| Cross-order confirmation leak | NONE (unmount/`orderId` reset) |
| Workspace boundary | NONE |
| expectedStatus regression | NONE |
| Mobile overflow | NOT EXECUTED (CSS stacks ≤419px) |
| Desktop | PASS |
| Realtime hooks changed | NO |
| RPC changed | NO |

## 18. Mobile/desktop

Desktop: compact quiet destructive surface in Estado rail — PASS.  
Mobile viewport: NOT EXECUTED; CSS stacks confirm actions at `max-width: 419px`.

## 19. Accessibility

Real buttons; heading + body; `role="group"` with `aria-labelledby`; no auto-focus on destructive; Enter on first Guardar opens confirm only.

## 20. Network/events/toasts

| Step | Writes | Events | Toasts |
| ---- | ------ | ------ | ------ |
| First Guardar | 0 | 0 | 0 |
| Volver | 0 | 0 | 0 |
| Cancelar pedido | 1 (observed via Kanban/status) | +1 path (status_changed) | existing success |

Network panel not instrumented; behavioral proof used.

## 21. Realtime/reconciliation

No changes to realtime hooks, reconciliation, or pending finalization. Pending finalization verify re-run PASS.

## 22. Checks

| Check | Result |
| ----- | ------ |
| `pending-status-mutation-finalization.verify.ts` | PASS |
| `order-preparation.verify.ts` | PASS |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | known ESLint 9 circular JSON only |

## 23. P0–P3

- **P0:** none
- **P1:** none
- **P2:** none new (stock not directly verified — documentation debt only)
- **P3:** none blocking

## 24. Files changed

Runtime:

- `components/admin/orders/status-form.tsx`
- `components/admin/orders/status-form.module.css`

Docs:

- `docs/admin-order-workspace-manual-status-correction-safety-polish-1.md` (this file)
- `docs/CURRENT_PHASE.md`
- `docs/admin-dashboard-forensic-living-audit.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 25. Hard boundaries

Did **not** touch: contextual mapping (except freeze), realtime, reconciliation, RPC/migrations, WhatsApp, products/preparation, assignment flag, modal rails layout, global CSS/tokens.

## 26. Gate

```text
# ADMIN-ORDER-WORKSPACE-MANUAL-STATUS-CORRECTION-SAFETY-POLISH-1
PASS

Contextual status runtime gate: REMAINS CLOSED
Dashboard visual polish: OPEN
No commit. No push. No deploy.
```
