# ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-FLOW-1

**Date:** 2026-08-19  
**Status:** PASS WITH VISUAL QA DEBT  
**Scope:** Workspace modal contextual status actions + activity compaction

---

## 1. Objective

Close the guidance/execution split: one-click contextual status transitions in the Estado section, manual selector as secondary escape hatch, remove standalone Próximo paso / Estado final panel from workspace.

---

## 2. Product decisions

- Remove standalone Próximo paso / Estado final from workspace modal
- Active statuses: one primary contextual CTA each
- Manual status select preserved (all options, no FSM)
- Terminal: no primary CTA; quiet context copy
- Activity: max 2 events in workspace; detail route unchanged
- WhatsApp smart default: deferred

---

## 3. Previous action flow

Próximo paso (guidance only) → Estado (select + Guardar estado). Normal progression required 2+ clicks. Activity showed last 5 events.

---

## 4. New action flow

Estado section: optional risk → terminal context → **primary contextual CTA** → manual correction (select + Guardar) → assignment if ON.

---

## 5. Contextual transition matrix

| Status | CTA | Target |
|--------|-----|--------|
| pending | Empezar preparación | preparing |
| preparing | Marcar como listo | ready |
| ready | Completar pedido | completed |
| completed | — | — |
| cancelled | — | — |

---

## 6. Mutation architecture

- Hook: `use-order-status-mutation.ts`
- Server action: `updateOrderStatusAction` (unchanged)
- RPC: `transition_order_status` (unchanged)
- Optimistic: existing workspace callbacks (unchanged)
- Duplicate mutation path: **none**

---

## 7. Manual escape hatch

Label: `Cambiar estado manualmente`. All status options preserved. Submit: `Guardar`. Visual hierarchy secondary to contextual CTA.

---

## 8. Terminal states

Quiet copy (`Pedido completado` / `Pedido cancelado`). No primary CTA. Manual correction remains.

---

## 9. Read-only / permissions

No contextual CTA when `canChangeStatus` false. Same permission path as manual form.

---

## 10. Responsibility interaction

Assignment under Estado unchanged. Status transitions do not require assignment.

---

## 11. Activity simplification

Workspace: `compactEventLimit={2}`, heading `Actividad`. Detail/full timeline: default limit 5, unchanged.

---

## 12. Mobile

Productos → Indicaciones → Estado/CTA → Cliente → Contacto → Actividad. One DOM.

---

## 13. Accessibility

Explicit button labels. Shared `isPending` disables CTA + manual controls. No tabindex hacks. No nested forms.

**DESKTOP CROSS-RAIL TAB ORDER = RESIDUAL DEBT**

---

## 14. Network

Additional reads: 0. Contextual transition uses same mutation request as manual save.

---

## 15. Functional QA

**REAL DATA COVERAGE = PARTIAL** — authenticated transition matrix not executed in this session. Source-level wiring verified; build/tsc pass.

---

## 16. Realtime/reconciliation regression

No changes to realtime hooks or reconciliation internals.

---

## 17. Visual QA

Authenticated viewport matrix pending (1440/1024/768/390, light/dark, all statuses).

---

## 18. P0–P3

| Severity | Status |
|----------|--------|
| P0/P1 | None |
| **CLOSED** | Guidance-only Próximo paso; select+save for linear flow; activity height (5→2) |
| **DEFERRED** | WhatsApp smart default |
| Residual | Cross-rail tab order; authenticated functional/visual QA |

---

## 19. Deferred WhatsApp

Smart default remains Phase B follow-up.

---

## 20. Checks

verify PASS · tsc PASS · diff-check PASS · build PASS · lint known ESLint 9 circular JSON

---

## 21. Gate

**ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-FLOW-1 = PASS WITH VISUAL QA DEBT**

---

## Validation follow-up — CONTEXTUAL-STATUS-ACTION-VALIDATION-1

**Date:** 2026-08-19  
**Result:** PASS WITH FOLLOW-UP DEBT  
**Gate:** RUNTIME MUTATION QA BLOCKED (login / no disposable tenant)

**Source validation PASS:**
- single mutation path via `use-order-status-mutation` → `updateOrderStatusAction` → RPC
- contextual CTA uses explicit `targetStatus`, not manual select (critical isolation)
- double-submit guarded by `isPending`
- terminal states: no primary CTA
- realtime/reconciliation/RPC/DB unchanged

**Runtime NOT EXECUTED:** pending→preparing→ready→completed matrix, network/event counts, two-client realtime, responsive visual QA.

**P2 follow-up (not blocking source freeze):** cancellation via undifferentiated manual Guardar (pre-existing); long-order CTA scroll-away; manual visual weight.

Doc: `docs/admin-order-workspace-contextual-status-action-validation-1.md`

---

## Runtime follow-up — STATUS-PENDING-MUTATION-FINALIZATION-FIX-1

**Date:** 2026-08-20  
**Result:** PASS WITH QA DEBT

Runtime QA exposed P1: post-success finalization crashed reading `expectedStatus` after in-place pending `status` clear. Fixed by snapshot-before-clear in `resolvePendingStatusMutation`. No action-flow redesign. Contextual CTA matrix unchanged. Authenticated transition matrix still pending login/safe tenant.

Doc: `docs/admin-order-workspace-status-pending-mutation-finalization-fix-1.md`

---

## Runtime closeout — CONTEXTUAL-STATUS-ACTION-RUNTIME-VALIDATION-RESUME-1

**Date:** 2026-08-20

Contextual status action flow **authenticated runtime validated** (pending→preparing→ready→completed + unsaved-select isolation). No action architecture change. P1 pending-mutation finalization fix runtime-confirmed.

Doc: `docs/admin-order-workspace-contextual-status-action-runtime-validation-resume-1.md`

