# ADMIN-ORDER-WORKSPACE-STATUS-PENDING-MUTATION-FINALIZATION-FIX-1

**Date:** 2026-08-20  
**Status:** PASS WITH QA DEBT  
**Gate:** Fix + regression PASS; authenticated runtime matrix still blocked at `/admin/login`

---

## 1. Incident

After a normal workspace status transition (toast success, optimistic UI updated), the workspace error boundary fired with:

`Cannot read properties of undefined (reading 'expectedStatus')`

Stack: `resolvePendingStatusMutation` → `finalizeOptimisticStatusChange` (`AdminDashboardOrders`) → `AdminOrderWorkspaceModal` settled callback.

Domain transition often succeeded; post-success finalization crashed.

---

## 2. Runtime evidence

- Status header / optimistic UI could advance correctly
- Success toast could appear
- Then `[workspace-boundary] render failure`
- TypeError on `expectedStatus`

---

## 3. Reproduction

Source reconstruction (deterministic): every successful `resolvePendingStatusMutation` that reached the post-clear trace read `pendingMutation.status.expectedStatus` after in-place `delete pendingMutation.status`.

Authenticated browser reproduction this session: **blocked** (login gate). Prior operator report already established preparing→ready class failure.

---

## 4. Fresh-runtime reproduction

| Step | Result |
|------|--------|
| Clear `.next` | Not required for source proof; crash is deterministic in resolver |
| Auth session | Unavailable — redirected to `/admin/login` |
| Safe disposable mutation | Not established |

Regression verify reproduces the exact TypeError without needing live DB.

---

## 5. Pending mutation lifecycle

```text
markPendingStatusMutation(orderId, expected, previous)
  → pendingMutationsRef: Map<orderId, PendingOrderMutationState>
  → status: { expectedStatus, previousStatus }

applyOptimisticStatusChange
  → mark + patch optimisticOrders / selectedOrderSeed

server success (use-order-status-mutation)
  → toast
  → onSuccess → refresh({ force: true }) [workspace hydrate; does NOT clear pending]
  → finally onOptimisticStatusSettled
       → finalizeOptimisticStatusChange
            → resolvePendingStatusMutation

realtime echo (optional)
  → may suppress while pending; does not always clear status entry first

late resolve when entry already cleared
  → early return (idempotent no-op)
```

---

## 6. Register / apply / finalize paths

| Phase | Owner | Notes |
|-------|-------|-------|
| Register | `markPendingStatusMutation` in `use-admin-orders-realtime.ts` | Key = `orderId` |
| Apply | `applyOptimisticStatusChange` in `admin-dashboard-orders.tsx` | Via modal optimistic callback |
| Finalize | `finalizeOptimisticStatusChange` → `resolvePendingStatusMutation` | Server-success settle |
| Rollback | `rollbackOptimisticStatusChange` | Does not call resolve for success path |
| Clear | `clearPendingMutationKind(..., "status")` | **In-place `delete pending.status`** |

---

## 7. Realtime interaction

Realtime may suppress expected echoes while pending. It does not need to clear the entry before server-success finalize. Late confirmation after clear is already designed as no-op (`!pendingMutation?.status` early return). Broad realtime logic unchanged.

---

## 8. Defensive hydrate interaction

`refresh({ force: true })` reloads workspace detail only. Silent dashboard refresh reconciles **with** pending patches; it does not clear the pending registry. Not the crash source.

---

## 9. Root cause

**Not** a missing-entry race as primary crash.

`clearPendingMutationKind` mutates the **same object reference** held by `pendingMutation`:

```ts
delete pendingMutation.status;
```

Then the success-path trace did:

```ts
expectedStatus: pendingMutation.status.expectedStatus
```

→ `undefined.expectedStatus` → TypeError → error boundary.

Why toast appeared first: toast/`onSuccess` run before `finally` → `onOptimisticStatusSettled`.

---

## 10. Why `expectedStatus` became undefined

`pendingMutation.status` was deleted in place before the trace read. `expectedStatus` property access was on `undefined`, not a missing Map entry.

---

## 11. Fix decision

**Fix A (snapshot before clear)** in `resolvePendingStatusMutation`:

1. Capture `statusPending`, `expectedStatus`, `previousStatus`, `mutationId`, `externalStatus`
2. Resolve / stale checks using snapshots
3. Clear kind
4. Trace/debug using snapshots only

No silent `if (!pending) return` added as the primary “fix” for this crash (early missing-entry no-op already existed and is correct for late confirmation).

---

## 12. Idempotence decision

**YES — finalization remains idempotent for missing status entry.**

Evidence: late server-success after an earlier clear (or second settle) must not throw; protocol already returned safe no-op when `!pendingMutation?.status`. This fix preserves that and makes the **first** successful resolve non-throwing.

---

## 13. Regression coverage

`lib/orders/pending-status-mutation-finalization.verify.ts`

| Scenario | Result |
|----------|--------|
| Buggy post-clear `.expectedStatus` read | throws TypeError (documents crash) |
| Fixed snapshot path | PASS, registry cleaned |
| Double resolve (late confirmation) | safe no-op |
| Realtime-first then server-success | late no-op |
| Failure rollback snapshot | PASS |

---

## 14. Contextual CTA QA

Source: unchanged matrix. Runtime authenticated matrix: **NOT EXECUTED** (login).

---

## 15. Manual status QA

Same settle path (`onOptimisticStatusSettled` → finalize). Source: covered. Runtime: not executed.

---

## 16. Double-submit

Unchanged (`isPending`). Not re-run at runtime.

---

## 17. Unsaved-select isolation

Unchanged (`submitStatusChange(targetStatus)`). Not re-run at runtime.

---

## 18. Mobile QA

Not executed (auth).

---

## 19. Desktop QA

Login page only.

---

## 20. Events / DB confirmation

Not executed (no safe mutation session).

---

## 21. Console

No live transition observed this session. Crash class removed at source.

---

## 22. Network

No new permanent requests. Fix is lifecycle-only.

---

## 23. Realtime / reconciliation boundaries

| Surface | Changed? |
|---------|----------|
| `resolvePendingStatusMutation` body (snapshot before clear) | **YES — minimal** |
| Realtime subscribe / suppress | NO |
| `dashboard-order-reconciliation.ts` | NO |
| TTL | NO |
| Hydrate strategy | NO |
| RPC / DB / FSM | NO |

---

## 24. Checks

| Check | Result |
|-------|--------|
| pending-status-mutation-finalization.verify | PASS |
| order-preparation.verify | PASS |
| tsc | PASS |
| diff-check | PASS |
| build | PASS |
| lint | known ESLint 9 circular JSON |

---

## 25. P0–P3

| Severity | Item | Status |
|----------|------|--------|
| P0 | — | none |
| P1 | workspace crash on status finalization (`expectedStatus`) | **CLOSED** (source + regression) |
| P2 | prior deferred (cancel UX, WhatsApp, long-order CTA, etc.) | unchanged / separate |

**QA debt:** authenticated pending→preparing→ready→completed runtime matrix still required to close hard functional gate.

---

## 26. Runtime files changed

- `components/admin/orders/use-admin-orders-realtime.ts` (snapshot-before-clear in `resolvePendingStatusMutation`)
- `lib/orders/pending-status-mutation-finalization.verify.ts` (new)

CSS: NONE. Server action / RPC / modal layout: NONE.

---

## 27. Gate

**ADMIN-ORDER-WORKSPACE-STATUS-PENDING-MUTATION-FINALIZATION-FIX-1 = PASS WITH QA DEBT**

Hard authenticated runtime matrix remains open until disposable QA login is available.

---

## Authenticated runtime follow-up — CONTEXTUAL-STATUS-ACTION-RUNTIME-VALIDATION-RESUME-1

**Date:** 2026-08-20

| Transition | Result |
|------------|--------|
| pending → preparing | **PASS** |
| preparing → ready | **PASS** |
| ready → completed | **PASS** |
| `expectedStatus` crash | **NONE** |
| workspace boundary | **NONE** |

**RUNTIME CONFIRMED** for snapshot-before-clear fix on order `#AF33` (La Burguesía).

Doc: `docs/admin-order-workspace-contextual-status-action-runtime-validation-resume-1.md`
