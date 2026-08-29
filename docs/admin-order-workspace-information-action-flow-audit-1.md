# ADMIN-ORDER-WORKSPACE-INFORMATION-ACTION-FLOW-AUDIT-1

**Date:** 2026-08-19  
**Status:** AUDIT COMPLETE — PRODUCT DECISIONS REQUIRED  
**Scope:** Functional + UX + information architecture — workspace modal only (read-only audit)

---

## 1. Executive verdict

| Question | Answer |
|----------|--------|
| **CURRENT INFORMATION/ACTION FLOW** | **PARTIALLY OPTIMIZED** (leaning **OPERATIONALLY MISALIGNED** on action path) |
| **READY FOR IMPLEMENTATION** | **PRODUCT DECISIONS REQUIRED** |

**Summary:** Independent rails and preparation hierarchy are architecturally sound. The operator mental model breaks down in three areas: (1) **execution-critical notes appear after activity** on the left rail; (2) **Próximo paso is guidance-only** — no wired CTA despite clear next-state semantics; (3) **contact defaults are list-order-driven**, producing misleading templates on terminal/delivery orders (e.g. completed + `Confirmar dirección` as first option).

Technical foundation for contextual status CTAs is **strong** (`updateOrderStatusAction` + optimistic hooks already exist; RPC allows direct transitions). WhatsApp template logic is **status- and delivery-aware** but default selection uses `templates[0]`, not `buildContextualOrderWhatsappUrl` preferred logic.

---

## 2. Current mental flow

### Desktop left rail (DOM order)

1. Productos (+ Total) — `OrderItemsSection`
2. Cliente / Entrega — `OrderWorkspaceOverview` → `OrderCustomerDeliveryInfo`
3. Actividad reciente — `OrderHumanTimeline` (compact, last 5)
4. Notas — `OrderNotesSection` (hidden if empty)

### Desktop right rail (DOM order)

1. Próximo paso — `OrderRecommendedActionPanel` + optional `OrderRiskPanel`
2. Estado — `StatusForm` + `OrderAssignmentControls` (if flag ON)
3. Contacto con el cliente — `OrderExternalActions` (WhatsApp + Más acciones)

### Mobile visible order (CSS `order`, single column)

1. Productos → 2. Cliente → 3. Próximo paso → 4. Estado → 5. Contacto → 6. Actividad → 7. Notas

### Tab order (desktop)

Left rail DOM first, then right rail: Products → Cliente → **Activity → Notes** → Próximo paso → Estado → Contacto.

| Comparison | Match? |
|------------|--------|
| Visible mobile order | Interleaved (operational mid-flow) ✓ |
| Desktop tab order | Left-then-right; **Activity/Notes before right-rail actions** ✗ vs task order |
| Mental task order | **Partial mismatch** — notes too late; actions disconnected from Próximo paso |

### Header (shell)

`#REF · Customer` + status badge | elapsed (`created_at` age, not status age)

Delivery method **not** in workstation header.

---

## 3. Component / data ownership

| Surface | Component owner | Data source | Interactive? | Current priority |
|---------|-----------------|-------------|--------------|------------------|
| Modal header ref/customer | `order-modal-header.tsx` | `displayOrder.id`, `customer_name` | No | P1 context |
| Status badge (header) | `OrderModalHeaderLeading` + `Badge` | `order.status` | No | P1 (duplicate of Estado) |
| Elapsed time | `OrderModalHeaderMeta` | `buildOrderRelativeTimeLabel(created_at)` | No | P2 urgency |
| Presence pill | `order-modal-workspace-toolbar.tsx` | dashboard presence props | No | P3 |
| Productos | `order-items-section.tsx` → `order-products-list.tsx` | `order_items`, snapshots | Product rows clickable (modal) | P1 execution |
| Total | `order-products-list.tsx` | `order.total_price` | No | P2 |
| Cliente / Entrega | `order-workspace-overview.tsx` → `order-customer-delivery-info.tsx` | `customer_name`, `phone`, `delivery_method`, `address` | No | P1–P2 context |
| Notas | `order-notes-section.tsx` | `orders.notes` | No | **P1 when present** (currently P3 placement) |
| Actividad | `order-human-timeline.tsx` | `order_events`, `created_at` | Link to detail | P3 history |
| Próximo paso | `order-recommended-action-panel.tsx` | `buildRecommendedOrderAction()` | **No button** | P1 copy / P3 action |
| Riesgo | `order-risk-panel.tsx` | `assessOrderRisk()` | No | P2 when visible |
| Estado select + Guardar | `status-form.tsx` | `updateOrderStatusAction` | Yes | P1 action (2-click) |
| Assignment | `order-assignment-controls.tsx` | `updateOrderAssignmentAction` | Yes (flag ON) | P2 |
| WhatsApp template + Abrir | `order-external-actions.tsx` | `getWhatsappTemplatesForOrder()` | Yes | P2 |
| Más acciones grid | `order-external-actions.tsx` | order fields | Yes | P3 |
| Copiar teléfono / Llamar | same | `order.phone` | Yes | P2 |
| Copiar dirección / Maps | same | `order.address` | Yes (if address) | P2 delivery |
| Copiar resumen / Compartir | same | `buildOrderContactSummary()` | Yes | P3 |

---

## 4. Order data fields (workspace-relevant)

| Field | Available? | Persisted | Current surface | Operational importance |
|-------|------------|-----------|-----------------|------------------------|
| `id` / short ref | Yes | Yes | Header `#REF` | P1 |
| `status` | Yes | Yes | Header badge, Estado, Próximo paso | P1 |
| `created_at` | Yes | Yes | Header elapsed | P2 |
| `customer_name` | Yes | Yes | Header, Cliente | P1 |
| `phone` | Yes | Yes | Cliente, contact actions | P1–P2 |
| `delivery_method` | Yes (`delivery` \| `pickup`) | Yes | Cliente/Entrega only (workstation) | **P1 — under-surfaced** |
| `address` | Yes (nullable) | Yes | Entrega (delivery only in UI) | P1 delivery |
| `delivery_date` / `delivery_time` | Yes | Yes | **Not shown in workstation** | P2/P3 (scheduled mode roadmap) |
| `notes` | Yes (nullable) | Yes | Notas (late) | **P1 when present** |
| `total_price` | Yes | Yes | Products Total | P2 |
| `order_items` | Yes | Snapshot | Productos | P1 |
| `assigned_to` / `assigned_at` | Yes | Yes | Assignment (flag ON) | P2 |
| `order_events` | Yes | Yes | Actividad | P3 |
| Payment / paid | **No** | — | — | N/A |
| Cancellation reason | **No dedicated field** | — | — | DATA GAP |

---

## 5. Header context

### Current

`#REF · CustomerShortName` + status badge | `Hace N min/h/d` from **`created_at`** (order age, not time-in-status).

Workstation variant **omits** delivery method, phone, assignment, notes indicator.

### Recommended

**HEADER SHOULD CONTAIN:** order ref, customer short name, status badge, order-age elapsed, **delivery method badge** (`Delivery` / `Retiro`).

**HEADER SHOULD NOT CONTAIN:** full address, product list, notes body, WhatsApp controls, assignment controls, payment (unavailable).

**PRODUCT DECISION REQUIRED:** whether `delivery_date/time` should appear in header for scheduled orders (field exists but workstation ignores it today).

---

## 6. Notes

| Aspect | Finding |
|--------|---------|
| **Source** | `orders.notes` (nullable text), set at public checkout (`checkout-client.tsx` optional textarea) |
| **Semantics** | **FREE-FORM / POTENTIALLY OPERATIONAL** — no schema restriction; can contain prep or delivery instructions |
| **Current placement** | Left rail **after Actividad** (4th left section) |
| **Empty behavior** | Section **hidden** (`OrderNotesSection` returns null) ✓ |
| **Recommended placement** | **Immediately after Productos** (before Cliente/Entrega) |
| **Recommended label** | **`Notas`** (repo-consistent) or **`Indicaciones`** — **COPY DECISION REQUIRED** |
| **Visual emphasis** | **P1 when present** — recommend quiet callout/highlight strip (future); not error styling |
| **Immutability** | No admin edit path in workspace; treat as **order-time snapshot** unless future edit feature added |
| **Realtime** | Notes not in optimistic/realtime patch paths observed — static after load |

---

## 7. Activity / timeline

| Aspect | Finding |
|--------|---------|
| **Owner** | `order-human-timeline.tsx` + `lib/orders/events.shared.ts` |
| **Source** | `order_events` + synthetic created entry |
| **Compact behavior** | Last **5** entries; meta + **`Ver historial completo`** → `/admin/orders/[id]` |
| **Priority** | **TERTIARY / historical** — not execution-critical |
| **Compactable** | **YES** — already compact; detail route owns full history |
| **Responsibility** | Assignment events filtered when flag OFF |
| **Recommended** | Keep compact 5 + link; **move below Notas/Cliente** on left rail |

---

## 8. Status model

| Value | Label (UI) | Terminal? | RPC transition |
|-------|------------|-----------|----------------|
| `pending` | Pendiente | No | Any → any valid enum (no FSM) |
| `preparing` | Preparando | No | Same |
| `ready` | Listo | No | Same |
| `completed` | Completado | Yes* | Same |
| `cancelled` | Cancelado | Yes* | Same + cancel restock side effects |

\*Terminal for **operational UX**, but **server allows transition out** — no hard lock in `transition_order_status`.

### Mutation path

```
StatusForm submit
  → updateOrderStatusAction (requireAdminPermission updateOrders)
  → store session guard
  → RPC transition_order_status
  → createOrderEvent (status_changed)
  → optimistic hooks in workspace modal
```

**Permissions:** `viewer` blocked at RPC; dashboard review mode blocks via action policy.

**Contextual CTA reuse:** **YES / PARTIAL** — same action + optimistic callbacks; UI must pick target status explicitly. No second mutation path required.

**Realtime/reconciliation:** Existing optimistic path in `admin-order-workspace-modal.tsx` — **no hook changes required** if CTA calls same handlers.

---

## 9. Próximo paso

**Owner:** `order-recommended-action-panel.tsx` → `buildRecommendedOrderAction()`

| Status | Eyebrow | Title | Body | Maps to transition | Current clicks |
|--------|---------|-------|------|-------------------|----------------|
| read-only | Próximo paso | Modo lectura | … | — | 0 |
| `cancelled` | Próximo paso | Pedido cancelado | no action | — | 0 |
| `completed` | Próximo paso | Pedido completado | closed | — | 0 |
| `pending` (flag ON, unassigned) | Próximo paso | Tomá el pedido | assign | assignment action | 1+ (separate) |
| `pending` | Próximo paso | Prepará el pedido | → Preparando | `preparing` | **2+** (select + Guardar) |
| `preparing` | Próximo paso | Marcá cuando esté listo | → Listo | `ready` | **2+** |
| `ready` | Próximo paso | Cerrá la operación | → Completado | `completed` | **2+** |

**Critical gap:** `ctaKind` (`claim` | `status-guidance`) is computed but **no interactive CTA is rendered** — only optional `ctaLabel` hint text (never set today).

**Terminal semantics issue:** Eyebrow remains **"Próximo paso"** on completed/cancelled — semantically weak.

---

## 10. Contextual CTA feasibility

| Question | Answer |
|----------|--------|
| One-click transitions safe? | **YES** at server level (any status allowed) |
| Recommended architecture | **C — dedicated wrapper** invoking existing `updateOrderStatusAction` via shared submit helper or StatusForm callback injection |
| Avoid | B (hidden form submit) — fragile; D — new mutation path |
| Manual select role | **Secondary escape hatch** — demote visually; keep for non-linear jumps |
| Risk | **LOW–MEDIUM** (presentation + wiring only) |
| Realtime changes | **None expected** |
| Assignment dependency | Status transitions **do not require** assignment (verified — separate actions) |

---

## 11. Contact / WhatsApp

**Owner:** `order-external-actions.tsx` + `lib/whatsapp/admin.ts`

### Template inventory

| Key | Label | Status gate | Delivery gate |
|-----|-------|-------------|---------------|
| `received` | Pedido recibido | `pending` | — |
| `preparing` | Avisar preparación | `preparing` | — |
| `ready_pickup` | Listo para retirar | `ready` | pickup |
| `ready_delivery` | Listo para delivery | `ready` | delivery |
| `on_the_way` | En camino | — | delivery (always appended) |
| `confirm_address` | Confirmar dirección | — | delivery (always appended) |
| `summary` | Enviar resumen | always | — |

### Default selection logic

**Current:** `useEffect` sets `selectedTemplate` to **`whatsappTemplates[0].key`** when template list changes.

**NOT using:** `buildContextualOrderWhatsappUrl()` preferred-template logic (status-aware).

**Completed + delivery example:** templates = `[confirm_address, on_the_way, summary]` → default **`Confirmar dirección`** — **operationally misleading**.

**Cross-order stale state:** **LOW risk** — `useEffect([whatsappTemplates])` resets on order change. Stale selection within same order if user changes template then status updates without remount — edge case only.

**StatusForm stale state:** `useEffect([initialStatus])` resets select on status change ✓

---

## 12. Quick actions

| Action | Delivery-only? | Status-specific? | Current gating |
|--------|----------------|------------------|----------------|
| Copiar teléfono | No | No | if `phone` |
| Llamar | No | No | if `phone` |
| Copiar dirección | Yes (implicit) | No | if `address.trim()` |
| Abrir Maps | Yes | No | if address |
| Copiar resumen | No | No | always |
| Compartir | No | No | if Web Share API |

**Gating assessment:** **CONTEXTUAL / PARTIAL** — address actions correctly hidden without address; pickup hides address in Cliente section but resumen still mentions método.

**Pickup:** address field null → Maps/copy address hidden ✓

---

## 13. Status × delivery method matrix (summary)

| Status | Delivery — primary action | Pickup — primary action | Contact default (recommended) | Terminal panel |
|--------|---------------------------|-------------------------|-------------------------------|----------------|
| pending | → preparing | → preparing | `received` | Próximo paso |
| preparing | → ready | → ready | `preparing` | Próximo paso |
| ready | → completed | → completed | `ready_delivery` / `ready_pickup` | Próximo paso |
| completed | none (manual select possible) | none | **`summary` or none** — not `confirm_address` | **Estado final** (recommended) |
| cancelled | none | none | `summary` optional | closure summary |

Full matrix in wireframes section below.

---

## 14. Cliente / Entrega

Workstation uses simplified `OrderCustomerDeliveryInfo` (no duplicate header hero).

**Duplication inventory:**

| Item | Classification |
|------|----------------|
| Customer name (header + Cliente) | USEFUL CONTEXT |
| Status (header + Estado) | USEFUL — header = scan; Estado = control |
| Phone (Cliente + quick actions) | USEFUL — context vs action |
| Delivery method (Entrega only) | **Should also appear in header** |
| Total (Products only in workstation) | OK |

---

## 15. Total

**Priority:** P2 — authoritative in Products; not duplicated elsewhere in workstation.

**Recommendation:** **Keep** in Products section; do not promote to header.

---

## 16. Payment

**PAYMENT CONTEXT = NOT AVAILABLE IN CURRENT WORKSPACE DATA**

---

## 17. Completed / ready semantics

| Status | Current semantic contract |
|--------|---------------------------|
| `ready` | Kitchen/ops finished; **manual** completion when delivered or picked up |
| `completed` | Operation closed — **no logistics sub-states** (no dispatched/delivered tracking) |
| `cancelled` | Closed; stock restock on cancel from operational states |

No payment or delivery confirmation fields.

---

## 18. Responsibility flag

| Flag | Behavior |
|------|----------|
| **OFF** (MVP default) | Assignment UI hidden; pending recommendation skips "Tomá el pedido" |
| **ON** | Assignment in Estado section; claim recommendation on unassigned pending |

**Recommended placement when ON:** remain in **action rail** under Estado (not header).

---

## 19. Information priority model

### P1 — act now / execute

Order ref, status, Products, notes (when present), delivery method, Próximo paso guidance, primary status transition (future CTA), phone (for contact)

### P2 — context during execution

Customer name, address (delivery), Total, risk panel, WhatsApp, assignment (flag ON), elapsed age

### P3 — history / utilities

Actividad, Copiar resumen, Compartir, Notas placement today (wrong tier), presence pill

---

## 20. Recommended desktop flow

### Header

`#REF · Customer · Delivery|Retiro · StatusBadge` | `Hace N min`

### Left rail

1. Productos (+ Total)
2. **Notas / Indicaciones** (if present; COPY DECISION)
3. Cliente / Entrega
4. Actividad reciente (compact)

### Right rail

1. Próximo paso (+ risk if any)
2. **Primary contextual CTA** (future — e.g. Marcar como Preparando)
3. Estado (demoted select + Guardar) + assignment if ON
4. Contacto / WhatsApp (contextual default)
5. Más acciones

---

## 21. Recommended mobile flow

1. Productos (+ Total)
2. Notas (if present)
3. Cliente / Entrega
4. Próximo paso (+ risk)
5. **Contextual CTA**
6. Estado (+ assignment)
7. Contacto / Más acciones
8. Actividad (compact)

Optimizes **act-now** before history.

---

## 22. Conditional visibility matrix

| Item | Rule |
|------|------|
| Productos, Total | ALWAYS |
| Notas | IF `notes.trim()` |
| Address, Maps, Copiar dirección | DELIVERY + address present |
| Assignment | RESPONSIBILITY ON |
| Risk panel | IF assessment ≠ stable |
| WhatsApp block | IF phone + templates |
| Próximo paso panel | NON-TERMINAL; terminal → **Estado final** label (PRODUCT DECISION) |
| Contextual CTA | NON-TERMINAL + canUpdateOrders |
| Guardar estado | canUpdateOrders; demote when terminal |

---

## 23. Wireframes (text)

### Pending — Delivery

```text
#AF33 · Mauro · DELIVERY · Pendiente          Hace 16 min
─────────────────────────────────────────────────────────
PRODUCTOS
2× BBQ Bacon …                                    Total $XX

[NOTAS if present — highlighted strip]

CLIENTE / ENTREGA
Modalidad Delivery · Dirección …

──────────────── RIGHT ────────────────
PRÓXIMO PASO
Prepará el pedido
[ Marcar como Preparando ]    ← future primary

Estado ▾ Pendiente  [Guardar]  ← secondary

CONTACTO — default: Pedido recibido
[Abrir WhatsApp]  Más acciones…
```

### Pending — Pickup

Same; no address row; contact default `received`; no Maps.

### Preparing

Próximo paso → `Marcá cuando esté listo` → CTA `Marcar como Listo`; template `Avisar preparación`.

### Ready — Delivery

CTA → Completado; template default `Listo para delivery`; Maps/address relevant.

### Ready — Pickup

CTA → Completado; template `Listo para retirar`; no address actions.

### Completed

```text
ESTADO FINAL (recommended eyebrow)
Pedido completado
No requiere acción operativa

Estado ▾ Completado [Guardar — quiet]

CONTACTO — default: Enviar resumen (not Confirmar dirección)
```

### Cancelled

Closure summary; optional summary template; status select still available (server allows).

### Notes absent

No Notas section — no placeholder.

---

## 24. Blast radius

### MUST TOUCH (future implementation)

- `order-recommended-action-panel.tsx` (CTA wiring)
- `status-form.tsx` or thin wrapper (shared mutation invoke)
- `order-external-actions.tsx` (default template selection)
- `admin-order-workspace-modal.tsx` (section reorder)
- `admin-order-modal.module.css` (presentation only)
- `order-modal-header.tsx` (delivery badge — optional Phase A)

### MAY TOUCH

- `order-notes-section.tsx` (label/emphasis)
- `order-workspace-overview.tsx` (workstation header context)
- `lib/whatsapp/admin.ts` (export preferred default helper for UI)

### SHOULD NOT TOUCH

- Preparation mapper/renderer
- Modal shell scroll/focus
- Modal width/ratio
- Kanban / OrderCard

### HARD NO TOUCH

- Realtime hooks, reconciliation internals
- `transition_order_status` / DB (unless product mandates FSM — **PRODUCT DECISION**)
- Checkout, public catalog
- create_order

---

## 25. Implementation phasing

**MULTIPLE PHASES recommended:**

| Phase | Scope | Risk |
|-------|-------|------|
| **A — Information hierarchy** | Reorder left rail (notes up, activity down), header delivery badge, terminal panel copy, notes callout, activity unchanged | LOW |
| **B — Contextual action flow** | Wire Próximo paso CTA → status mutation; smart WhatsApp default; optional select demotion | LOW–MEDIUM |

Phase B should **not** require realtime/reconciliation changes.

---

## 26. Product decisions required

1. Notes label: `Notas` vs `Indicaciones`
2. Terminal right-rail eyebrow: keep `Próximo paso` vs `Estado final` / hide panel
3. Header delivery promotion (recommended YES)
4. Whether to add **status transition FSM** at RPC level (currently absent — allows jumps)
5. Modal 60/40 ratio reassessment after Phase A (optional future)

---

## 27. Data / capability gaps

- Payment status: not in workspace
- Cancellation reason: not surfaced
- Scheduled delivery window: fields exist, workstation does not show
- `buildContextualOrderWhatsappUrl` exists but unused in UI

---

## 28. P0–P3 findings

| Severity | Finding |
|----------|---------|
| **P0** | None |
| **P1** | None (audit-only) |
| **P2** | Notes after Activity; Próximo paso not actionable; misleading WhatsApp default on terminal delivery; desktop tab order reaches history before actions |
| **P3** | Header lacks delivery method; Total prominence acceptable; Activity could move lower; `Próximo paso` label on terminal states |

---

## 29. Real data coverage

**REAL DATA COVERAGE = PARTIAL** — audit from source; authenticated multi-status browser matrix not executed in this session.

---

## 30. Detail route vs modal

| Surface | Layout |
|---------|--------|
| Workspace modal | Independent rails (this audit) |
| `/admin/orders/[id]` | `OrderWorkspace` linear layout + full timeline below |

**INFORMATION/ACTION FLOW SHOULD BE SHARED = PARTIAL** — action components shared (`StatusForm`, `OrderExternalActions`); **layout/ordering should diverge** by surface purpose.

---

## 31. Gate

**ADMIN-ORDER-WORKSPACE-INFORMATION-ACTION-FLOW-AUDIT-1 = AUDIT COMPLETE — PRODUCT DECISIONS REQUIRED**

Hard gate checklist: status values ✓, transitions ✓, terminal semantics ✓, action path ✓, permissions ✓, events ✓, CTA reuse path ✓, notes ✓, templates ✓, default logic ✓, quick actions ✓, matrix ✓, flows defined ✓, **no runtime changes** ✓

---

## Product decision closure — 2026-08-19

Closed by Product Owner for implementation (do not reopen in Phase A):

- workspace copy = `Indicaciones` (data field remains `orders.notes`);
- move notes directly after Products, before Cliente / Entrega;
- hide when empty / null / whitespace — no “Sin indicaciones”;
- promote Delivery / Retiro to workstation header; keep modalidad in Cliente / Entrega (intentional duplication);
- terminal eyebrow = `Estado final`; keep terminal panel visible;
- keep terminal status selector available (server still allows leaving terminal states);
- no FSM now;
- no scheduled `delivery_date` / `delivery_time` context now;
- Activity remains compact (max 5) + `Ver historial completo` at end of left rail;
- Total unchanged inside Productos.

Implementation follow-up:

**ADMIN-ORDER-WORKSPACE-INFORMATION-HIERARCHY-POLISH-1** — implemented (presentation/information architecture only). Contextual CTA, WhatsApp smart-default, and FSM remain Phase B / separate domain decisions.

**Post-Phase-A refinement (2026-08-19):** Visual evidence refined grouping — Cliente/Entrega belongs to operational rail, not execution rail. Implemented in **ADMIN-ORDER-WORKSPACE-CUSTOMER-DELIVERY-RAIL-REALIGNMENT-1**. Does not invalidate original audit; product/layout refinement only.

## Implementation follow-up — 2026-08-19

**ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-FLOW-1**

- standalone Próximo paso / Estado final removed from workspace;
- active statuses now expose one-click contextual transition;
- manual status selector preserved as correction escape hatch;
- terminal states have no primary contextual action;
- workspace Activity reduced to 2 recent events;
- same `updateOrderStatusAction` path reused;
- no FSM/realtime/reconciliation changes;
- smart WhatsApp remains deferred.

## Implementation follow-up — 2026-08-20

**ADMIN-ORDER-WORKSPACE-WHATSAPP-CONTEXTUAL-DEFAULT-POLISH-1**

- implemented contextual WhatsApp default selection in workspace Contacto;
- matrix: pending→received, preparing→preparing, ready→ready_delivery/ready_pickup, completed/cancelled→summary;
- preference helper: `getPreferredWhatsappTemplateKeyForOrder` + `resolveWhatsappTemplateKey` in `lib/whatsapp/admin.ts`;
- UI opt-in: `contextualTemplateDefault` on `OrderExternalActions` (workspace only);
- default ≠ filtering — `confirm_address` / `on_the_way` remain manually selectable where listed;
- original P2 **misleading WhatsApp default on terminal delivery** = **CLOSED**.

## Closure — 2026-08-21

**ADMIN-ORDER-WORKSPACE-FINAL-VISUAL-UX-QA-1**

Original workspace action/information recommendations implemented and final integrated visual/UX/operational QA completed. Workspace visual/UX = **FROZEN**. Doc: `docs/admin-order-workspace-final-visual-ux-qa-1.md`.

## Follow-up — CONTACT MESSAGING CONTENT AUDIT — 2026-08-21

**ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-CONTENT-AUDIT-1**

Contact messaging content received a dedicated later audit because Product Customization V1/V2 evolved beyond the original flat WhatsApp product summary (`- Nx product_name`). Contextual template **default** selection remains a separate closed concern. Doc: `docs/admin-order-workspace-contact-messaging-content-audit-1.md`.

## Implementation follow-up — CONTACT STRUCTURED CONTENT — 2026-08-22

**ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-STRUCTURED-CONTENT-IMPL-1**

Contact message-content gap documented in the later audit was implemented through structured persisted-order summaries (Option B). No visual Contacto regrouping yet. Doc: `docs/admin-order-workspace-contact-messaging-structured-content-impl-1.md`.

## Visual hierarchy follow-up — 2026-08-22

Contact messaging is now presented as its own communication action group: template + WhatsApp + Copiar resumen + Compartir (workspace only via `presentation="workspace"`). Phone/call/address/maps remain secondary utilities under Más acciones. No status/content-domain changes. Doc: `docs/admin-order-workspace-contact-messaging-visual-hierarchy-polish-1.md`.
