# ADMIN-ORDER-WORKSPACE-INFORMATION-HIERARCHY-POLISH-1

**Date:** 2026-08-19  
**Status:** PASS WITH VISUAL QA DEBT  
**Scope:** Information architecture + presentation hierarchy — workspace modal only

---

## 1. Objective

Align workstation information order with the operator mental model:

CONTEXT → EXECUTION → ACTION → HISTORY

without changing action mechanics (no contextual status CTA, no WhatsApp default fix, no FSM).

---

## 2. Product decisions closed

| Decision | Resolution |
|----------|------------|
| Notes label | Workspace copy = `Indicaciones`; field remains `notes` |
| Placement | After Productos, before Cliente / Entrega |
| Empty notes | Hide section entirely |
| Header modality | Promote `Delivery` / `Retiro` |
| Cliente/Entrega modality | Keep (intentional duplication) |
| Terminal eyebrow | `Estado final` for `completed` / `cancelled` |
| Terminal panel | Stay visible; status select remains available |
| FSM | Not implemented |
| Scheduled delivery fields | Not shown |
| Activity | Compact, last left-rail section |
| Total | Stays in Productos |

---

## 3. Previous information flow

Desktop left: Productos → Cliente / Entrega → Actividad → Notas  
Mobile: Productos → Cliente → Próximo paso → Estado → Contacto → Actividad → Notas  
Header: `#REF · Customer` + status | age

---

## 4. New mental model

**HEADER:** `#REF · Customer · Delivery|Retiro · Status | age`

**LEFT — EXECUTION:** Productos → Indicaciones (if present) → Cliente / Entrega → Actividad

**RIGHT — ACTION:** Próximo paso / Estado final → Estado → assignment if ON → Contacto → Más acciones

---

## 5. Header context

`OrderModalHeaderLeading` (workspace-only consumer) now accepts optional `deliveryMethod`. Detail route unchanged.

---

## 6. Delivery/Retiro presentation

Canonical helper: `formatAdminDeliveryMethod()` in `lib/orders/presenter.ts`.

Quiet local pill (`.admin-order-modal-shell__delivery-context`) — not a status badge. Status `Badge` remains the stronger semantic chip.

---

## 7. Indicaciones semantics

`orders.notes` remains free-form / potentially operational. Presentation-only rename in workstation variant.

---

## 8. Indicaciones placement

Left rail DOM: after Productos, before Cliente / Entrega.

---

## 9. Empty behavior

`OrderNotesSection` still returns `null` for null / undefined / whitespace. Workstation **does not wrap an empty `<section>`**, so no phantom gap.

---

## 10. Left rail final order

1. Productos (+ Total)  
2. Indicaciones — if `notes.trim()`  
3. Cliente / Entrega  
4. Actividad reciente  

---

## 11. Mobile final order

CSS `order` on the same semantic DOM (rails `display: contents`):

1. Productos  
2. Indicaciones (if present)  
3. Cliente / Entrega  
4. Próximo paso / Estado final  
5. Estado (+ assignment if ON)  
6. Contacto  
7. Actividad  

Duplicate renderers: **none**.

---

## 12. Terminal `Estado final`

`buildRecommendedOrderAction()` uses eyebrow `Estado final` when status is `completed` or `cancelled` (including read-only terminal orders). Titles/bodies unchanged. Panel remains visible.

---

## 13. Non-terminal freeze

`pending` / `preparing` / `ready` keep `Próximo paso` copy. No CTA buttons added. Generic read-only non-terminal still uses `Próximo paso` + `Modo lectura`.

---

## 14. Activity

Last 5 events + `Ver historial completo` — logic unchanged. Placement: last left-rail section.

**DESKTOP CROSS-RAIL TAB ORDER = RESIDUAL DEBT:** left rail (including Activity link) still precedes right-rail controls in DOM. No tabindex hacks.

---

## 15. Total

Unchanged. Still inside Productos via `OrderItemsSection showTotal`.

---

## 16. Independent rails regression

| Invariant | Result |
|-----------|--------|
| `executionColumn` / `commandColumn` | Unchanged |
| `1.15fr / 0.85fr` | Unchanged |
| Shared-row coupling | Not restored |
| Sticky / nested-scroll / ratio | Not introduced by this phase |

---

## 17. Responsive QA

**REAL DATA COVERAGE = PARTIAL** — authenticated viewport matrix (1440 / 1024 / 768 / 390, light/dark, notes present/absent, delivery/pickup, completed/cancelled) was not executed in this session.

Structural CSS/DOM order implemented; visual balance of header badges and Indicaciones callout remains **visual QA debt**.

---

## 18. Light/dark

Indicaciones callout uses `--accent-soft`, `--accent-primary` mix, `--border-subtle`, `--bg-surface`, `--text-primary` / `--text-tertiary`. Delivery pill uses `--border-subtle`, `--bg-surface-hover`, `--text-secondary`. No new global tokens.

---

## 19. Functional boundaries

No changes to status mutation, assignment, WhatsApp, quick actions, realtime, reconciliation, loaders, checkout, DB, RPC, Kanban, preparation mapper.

---

## 20. Deferred Phase B

- Contextual status CTA  
- Smart WhatsApp default  
- Manual select demotion  

---

## 21. Checks

See CURRENT_PHASE / Cursor output after `tsc` / `verify` / `build` / `lint` / `git diff --check`.

---

## 22. P0–P3

| Severity | Status |
|----------|--------|
| P0 | None |
| P1 | None |
| P2 closed this phase | Notes behind Activity |
| P3 closed this phase | Header lacked Delivery/Retiro; terminal `Próximo paso` label |
| P2 deferred Phase B | Guidance-only Próximo paso; WhatsApp default on terminal delivery |
| Residual | Desktop cross-rail tab order; authenticated visual QA |

---

## 23. Gate

**ADMIN-ORDER-WORKSPACE-INFORMATION-HIERARCHY-POLISH-1 = PASS WITH VISUAL QA DEBT**

---

## Follow-up — CUSTOMER-DELIVERY-RAIL-REALIGNMENT-1

Authenticated visual QA showed Cliente/Entrega was better grouped with Contacto and delivery/customer actions.

**Updated mental model:**

- LEFT: Productos → Indicaciones → Actividad  
- RIGHT: Próximo paso/Estado final → Estado → Cliente/Entrega → Contacto  

Header Delivery/Retiro remains. Status/WhatsApp/action mechanics unchanged. Doc: `docs/admin-order-workspace-customer-delivery-rail-realignment-1.md`.

## Follow-up — CONTEXTUAL-STATUS-ACTION-FLOW-1

Standalone Próximo paso/Estado final superseded by contextual Status action surface. Customer/Delivery placement unchanged. Doc: `docs/admin-order-workspace-contextual-status-action-flow-1.md`.

## Follow-up — MOBILE-INFORMATION-HIERARCHY-CLEANUP-1 (2026-08-21)

* Indicaciones remains after Products but presentation is quieter (neutral note, not accent callout).
* Activity workspace presentation removed by later product decision.
* Full order history remains available outside workspace (`/admin/orders/[id]` timeline).
* Cliente/Entrega uses compact order-owned values without redundant visible micro-labels.
* Doc: `docs/admin-order-workspace-mobile-information-hierarchy-cleanup-1.md`.
