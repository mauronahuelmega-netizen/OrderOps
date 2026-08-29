# ADMIN-ORDER-WORKSPACE-CUSTOMER-DELIVERY-RAIL-REALIGNMENT-1

**Date:** 2026-08-19  
**Status:** PASS WITH VISUAL QA DEBT  
**Scope:** Workspace modal composition — move Cliente/Entrega to operational rail

---

## 1. Objective

Group customer/delivery context with contact and delivery actions on the right rail, so operators no longer cross-scan between left (data) and right (actions).

---

## 2. Visual evidence

Post–Phase A QA showed phone/address/modality on the left rail while Llamar, Copiar teléfono, Maps, and WhatsApp lived on the right — high cross-rail mental cost.

---

## 3. Mental model

**LEFT = COMANDA / EJECUCIÓN / HISTORIA**  
**RIGHT = OPERACIÓN / CLIENTE / ENTREGA / CONTACTO**

---

## 4. Previous rail ownership

| Section | Rail |
|---------|------|
| Productos | LEFT |
| Indicaciones | LEFT |
| Cliente / Entrega | LEFT |
| Actividad | LEFT |
| Próximo paso / Estado final | RIGHT |
| Estado (+ assignment) | RIGHT |
| Contacto | RIGHT |

---

## 5. New rail ownership

| Section | Rail |
|---------|------|
| Productos | LEFT |
| Indicaciones | LEFT |
| Actividad | LEFT |
| Próximo paso / Estado final | RIGHT |
| Estado (+ assignment) | RIGHT |
| Cliente / Entrega | RIGHT |
| Contacto | RIGHT |

---

## 6. Left rail final

1. Productos (+ Total)  
2. Indicaciones (if present)  
3. Actividad reciente  

---

## 7. Right rail final

1. Próximo paso / Estado final (+ risk if any)  
2. Estado (+ assignment if ON)  
3. Cliente / Entrega  
4. Contacto con el cliente (+ Más acciones)  

---

## 8. Cliente/Entrega placement

After Estado (+ assignment), before Contacto. Single instance — moved, not duplicated.

---

## 9. Contact proximity

Phone and address now sit in the same operational rail as Copiar teléfono, Llamar, WhatsApp, Copiar dirección, and Abrir Maps.

---

## 10. Header duplication

Header Delivery/Retiro + customer name unchanged. Modalidad and customer name remain in Cliente/Entrega section (intentional duplication).

---

## 11. Desktop

Pure composition move in `admin-order-workspace-modal.tsx`. Section separator via `.workspaceSectionContext` (same border-top convention as Estado/Contacto). Independent rails unchanged.

---

## 12. Mobile

CSS `order` updated — same DOM, no duplicate renderer:

Productos → Indicaciones → Próximo paso → Estado → Cliente/Entrega → Contacto → Actividad

---

## 13. Accessibility / tab order

No nested forms — Cliente/Entrega is sibling section after StatusForm, not inside `<form>`. No tabindex hacks.

**DESKTOP CROSS-RAIL TAB ORDER = RESIDUAL DEBT** (Activity history link may still precede right-rail controls in DOM focus order).

---

## 14. Independent rails regression

| Invariant | Result |
|-----------|--------|
| executionColumn / commandColumn | Unchanged |
| Left height does not control right | Preserved |
| Shared-row grid | Not restored |

---

## 15. Ratio freeze

`1.15fr / 0.85fr` — unchanged.

---

## 16. Functional boundaries

No changes to status, assignment, WhatsApp, quick actions, realtime, reconciliation, DB, preparation, header, Indicaciones.

---

## 17. QA

**REAL DATA COVERAGE = PARTIAL** — authenticated viewport matrix not executed in this session. Structural composition verified in source.

---

## 18. Checks

See Cursor output (verify, tsc, diff-check, build, lint).

---

## 19. P0–P3

| Severity | Status |
|----------|--------|
| P0 / P1 | None |
| **CLOSED THIS PHASE (P2)** | Customer/delivery data spatially separated from contact actions |
| **DEFERRED Phase B** | Próximo paso guidance-only; misleading terminal WhatsApp default |
| Residual | Cross-rail tab order; authenticated visual QA |

---

## 20. Deferred Phase B

Contextual CTA, smart WhatsApp default, manual select demotion — not implemented.

---

## 21. Gate

**ADMIN-ORDER-WORKSPACE-CUSTOMER-DELIVERY-RAIL-REALIGNMENT-1 = PASS WITH VISUAL QA DEBT**

---

## Follow-up — CONTEXTUAL-STATUS-ACTION-FLOW-1

Contextual status action flow simplified right rail above Cliente/Entrega. Customer/Delivery placement remained unchanged. Doc: `docs/admin-order-workspace-contextual-status-action-flow-1.md`.
