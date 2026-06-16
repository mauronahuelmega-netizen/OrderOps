# OrderOps — Order Modal Audit

**Fecha:** 2026-06-12  
**Alcance:** Modal de pedido en dashboard (`AdminOrderWorkspaceModal`) y ecosistema directo/indirecto.  
**Tipo de trabajo:** Solo auditoría y documentación. Sin cambios funcionales.

---

## 1. Executive Summary

El modal de pedido de OrderOps es una **estación de trabajo operativa** montada sobre el dashboard (`/admin/dashboard`). Funciona correctamente para operar pedidos sin salir del tablero: cambiar estado, tomar/liberar responsable, comunicarse por WhatsApp, copiar datos, ver riesgo e historial reciente.

Arquitectónicamente es un **compositor delgado** (`AdminOrderWorkspaceModal`) sobre un **shell reutilizable** (`AdminOrderModalShell`) que renderiza vía portal. La lógica pesada vive en **subcomponentes compartidos** con la página de detalle (`/admin/orders/[id]`), diferenciados por props `variant` / `compact`.

**Fortalezas actuales:**
- Separación clara entre shell (a11y, overlay, cierre) y contenido operativo.
- Acciones (estado, ownership, WhatsApp, clipboard) encapsuladas en componentes dedicados con server actions.
- Flujo optimista bien cableado entre modal ↔ dashboard.
- Estilos del modal mayormente tokenizados (`var(--bg-surface)`, `--text-primary`, etc.) vía CSS Modules.
- Layout workstation 2 columnas (productos | acciones+contexto) con scroll independiente en desktop ≥1024px.

**Debilidades para evolución premium:**
- El modal **no está aislado del re-render del dashboard** (~2.9k LOC en `admin-dashboard-orders.tsx`).
- **Duplicación de datos** (total, responsable, badge de estado) entre header, overview, items y assignment.
- **Jerarquía visual ambigua**: botón primario real (Guardar estado / Tomar pedido) compite con grid de utilidades secundarias sin “acción recomendada”.
- **Mezcla layout + hidratación + optimistic orchestration** en un solo archivo modal.
- Algunos hardcodes visuales (`rgba` fijos, backdrop-filter en modal anidado de producto).
- Documento previo de performance (`docs/order-modal-performance-audit.md`) sigue parcialmente vigente; el layout cambió en Fases 11/11.1/11.2.

**Veredicto:** El modal es **funcionalmente sólido** y **parcialmente tokenizado**, pero **no está listo para un rediseño premium sin mapa de riesgos**. Esta auditoría habilita refactor por fases con blast radius controlado.

---

## 2. Scope Audited

### Incluido
- Apertura/cierre desde dashboard y URL `?order=`
- `AdminOrderWorkspaceModal` y árbol completo de hijos
- Shell, error boundary, presencia operador
- Secciones: productos, notas, acciones, overview, riesgo, timeline
- Modal anidado de producto (`OrderProductModal`)
- Libs: workspace, presenter, whatsapp, risk-detection, events, client-actions, assignment
- Server actions de status/assignment (solo como dependencia documentada)
- Endpoint `GET /admin/orders/[id]/workspace`
- CSS Modules del ecosistema modal
- Tokens en `app/theme-tokens.css` y clases globales `ui-*` / `admin-*`
- Comparación con página de detalle (`order-detail-page-client.tsx`)

### Excluido (por instrucción)
- Cambios de código, estilos, DB, realtime, server actions
- Dashboard fuera del flujo modal (salvo estado `selectedOrder*`)
- Kitchen view, checkout público, super-admin

---

## 3. Files Audited

| # | Archivo | Rol |
|---|---------|-----|
| 1 | `components/admin/orders/admin-dashboard-orders.tsx` | Orquestador: open/close, optimistic, mount modal |
| 2 | `components/admin/orders/admin-order-workspace-modal.tsx` | Contenido modal + hidratación + cache |
| 3 | `components/admin/orders/admin-order-modal-shell.tsx` | Portal, overlay, header, body |
| 4 | `components/admin/orders/admin-order-workspace-error-boundary.tsx` | Error boundary |
| 5 | `components/admin/orders/admin-order-modal.module.css` | Shell + grid workstation |
| 6 | `components/admin/orders/order-actions-section.tsx` | Status + assignment + external |
| 7 | `components/admin/orders/status-form.tsx` | Cambio de estado |
| 8 | `components/admin/orders/status-form.module.css` | Estilos form estado |
| 9 | `components/admin/orders/order-assignment-controls.tsx` | Claim/release responsable |
| 10 | `components/admin/orders/order-external-actions.tsx` | WhatsApp, clipboard, maps, share |
| 11 | `components/admin/orders/order-items-section.tsx` | Wrapper productos |
| 12 | `components/admin/orders/order-products-list.tsx` | Lista + modal item |
| 13 | `components/admin/orders/order-items.module.css` | Filas producto |
| 14 | `components/admin/orders/order-product-modal.tsx` | Modal anidado producto |
| 15 | `components/admin/orders/order-notes-section.tsx` | Notas |
| 16 | `components/admin/orders/order-workspace-overview.tsx` | Contexto cliente/entrega |
| 17 | `components/admin/orders/order-workspace-overview.module.css` | Estilos overview |
| 18 | `components/admin/orders/order-risk-panel.tsx` | Riesgo operacional |
| 19 | `components/admin/orders/order-risk-panel.module.css` | Estilos riesgo |
| 20 | `components/admin/orders/order-human-timeline.tsx` | Historial humano |
| 21 | `components/admin/orders/order-human-timeline.module.css` | Estilos timeline |
| 22 | `components/admin/orders/order-workspace.module.css` | Layout compartido `admin-detail-*` |
| 23 | `components/admin/orders/order-detail-surfaces.module.css` | Acciones externas, assignment, item modal |
| 24 | `components/admin/orders/operator-presence-pill.tsx` | Presencia en toolbar |
| 25 | `components/admin/orders/operator-presence-pill.module.css` | Estilos pill |
| 26 | `components/ui/Badge.tsx` | Badge estado |
| 27 | `components/ui/Button.tsx` | Botón base |
| 28 | `components/ui/Card.tsx` | Wrapper tarjeta (parcial en modal) |
| 29 | `lib/orders/workspace.ts` | Tipos + seed + patch helpers |
| 30 | `lib/orders/presenter.ts` | Formato fecha, moneda, tiempo relativo |
| 31 | `lib/orders/events.shared.ts` | Timeline + history summary |
| 32 | `lib/orders/risk-detection.ts` | Assess riesgo |
| 33 | `lib/orders/assignment.ts` | Labels ownership |
| 34 | `lib/whatsapp/admin.ts` | Templates + URLs WhatsApp/maps/tel |
| 35 | `lib/browser/client-actions.ts` | Clipboard + Web Share |
| 36 | `app/admin/(protected)/orders/[id]/actions.ts` | Server actions (dependencia) |
| 37 | `app/admin/(protected)/orders/[id]/workspace/route.ts` | Hydration API |
| 38 | `components/admin/orders/order-detail-page-client.tsx` | Superficie paralela (comparación) |
| 39 | `components/admin/orders/order-workspace.tsx` | Layout página (NO usado en modal) |
| 40 | `app/theme-tokens.css` | Tokens light/dark |
| 41 | `app/globals.css` | Clases `ui-button`, `ui-badge`, `admin-*` |
| 42 | `docs/order-modal-performance-audit.md` | Auditoría performance previa |

**Total archivos auditados:** 42

---

## 4. Component Map

### 4.1 AdminOrderWorkspaceModal
- **Archivo:** `components/admin/orders/admin-order-workspace-modal.tsx`
- **Tipo:** Client Component — Feature orchestrator
- **Responsabilidad:** Hidratar pedido, cache module-level, componer layout workstation, propagar optimistic callbacks
- **Importado en:** `admin-dashboard-orders.tsx` (dynamic)
- **Renderizado en:** Portal hijo cuando `selectedOrder != null`
- **Props recibe:** `order`, `isOpen`, `activeFilter`, `onClose`, `dashboardHref`, `canUpdateOrders`, `currentUserId`, `operationalMetrics`, `assignmentLabel`, `orderPresenceLabel`, `orderPresenceNames`, callbacks optimistic (status + assignment)
- **Props pasa:** Subcomponentes reciben `displayOrder` + handlers derivados
- **Estados internos:** `detail`, `loading`, `error`
- **Handlers:** `loadOrder`, `appendTimelineEvent`, `handleOptimistic*`, `handleStatusSuccess`
- **Dependencias:** fetch workspace, `buildAdminOrderInitialDetail`, `patchAdminOrderWorkspaceStatus`, presenter
- **Estilos:** `admin-order-modal.module.css`
- **Riesgos:** Mezcla hidratación + optimistic + layout; cache global `workspaceOrderCache`
- **Recomendación:** Extraer hook `useOrderWorkspaceHydration` en fase posterior

### 4.2 AdminOrderModalShell
- **Archivo:** `components/admin/orders/admin-order-modal-shell.tsx`
- **Tipo:** Client Component — UI shell
- **Responsabilidad:** Portal, overlay, Escape, scroll lock body/html, header, close
- **Props recibe:** `isOpen`, `onClose`, `title`, `headerLeading`, `headerMeta`, `variant`, `children`
- **Estados internos:** ref close button
- **Handlers:** Escape listener, body overflow lock
- **Estilos:** `admin-order-modal.module.css`
- **Riesgos:** Bajo; reutilizable
- **Recomendación:** Mantener como primitive de modal enterprise

### 4.3 AdminOrderWorkspaceErrorBoundary
- **Archivo:** `components/admin/orders/admin-order-workspace-error-boundary.tsx`
- **Tipo:** Client Component — Helper
- **Responsabilidad:** Capturar errores render hijos modal
- **Estilos:** `admin-order-modal.module.css` (state error)
- **Riesgos:** key=`displayOrder.id` (sin status) — cambio reciente correcto vs perf audit

### 4.4 OrderActionsSection
- **Archivo:** `components/admin/orders/order-actions-section.tsx`
- **Tipo:** Feature component
- **Responsabilidad:** Agrupa StatusForm + Assignment + ExternalActions
- **Variant workstation:** `<section>` sin Card
- **Props pasa:** callbacks optimistic a hijos
- **Estilos:** `order-workspace.module.css`, `order-detail-surfaces.module.css`

### 4.5 StatusForm
- **Archivo:** `components/admin/orders/status-form.tsx`
- **Tipo:** Client Feature
- **Responsabilidad:** Select estado + submit → `updateOrderStatusAction`
- **Estados:** `selectedStatus`, `isPending` (useTransition)
- **Optimistic:** change → rollback → settled
- **Estilos:** `status-form.module.css`, globals `admin-field`, `admin-primary-button`

### 4.6 OrderAssignmentControls
- **Archivo:** `components/admin/orders/order-assignment-controls.tsx`
- **Tipo:** Client Feature
- **Responsabilidad:** Mostrar responsable + claim/release → `updateOrderAssignmentAction`
- **Estilos:** `order-detail-surfaces.module.css`

### 4.7 OrderExternalActions
- **Archivo:** `components/admin/orders/order-external-actions.tsx`
- **Tipo:** Client Feature
- **Responsabilidad:** WhatsApp template picker, clipboard, maps, call, share
- **Estados:** `selectedTemplate`, `canShareOrder`
- **Dependencias:** `lib/whatsapp/admin`, `lib/browser/client-actions`, toast provider
- **Estilos:** `order-detail-surfaces.module.css`, globals `ui-button`

### 4.8 OrderItemsSection
- **Archivo:** `components/admin/orders/order-items-section.tsx`
- **Tipo:** Feature (memo)
- **Responsabilidad:** Card wrapper + header "Productos" + OrderProductsList
- **Props modal:** `compact`, `showTotal`
- **Estilos:** `order-workspace.module.css`, Card global

### 4.9 OrderProductsList
- **Archivo:** `components/admin/orders/order-products-list.tsx`
- **Tipo:** Client Feature
- **Responsabilidad:** Filas clickeables, total, modifiers inline (description), abre OrderProductModal
- **Estilos:** `order-items.module.css`

### 4.10 OrderProductModal
- **Archivo:** `components/admin/orders/order-product-modal.tsx`
- **Tipo:** Client — Nested modal
- **Responsabilidad:** Detalle item (imagen, descripción, precio)
- **z-index:** 24 (backdrop) vs shell 50
- **Estilos:** `order-detail-surfaces.module.css` — **hardcode** `rgba(9,9,11,0.42)` + `backdrop-filter`

### 4.11 OrderNotesSection
- **Archivo:** `components/admin/orders/order-notes-section.tsx`
- **Tipo:** Server-safe feature (no "use client")
- **Responsabilidad:** Render notas si existen; null si vacío
- **Estilos:** Card + workspace + detailStack

### 4.12 OrderWorkspaceOverview
- **Archivo:** `components/admin/orders/order-workspace-overview.tsx`
- **Tipo:** Client Feature
- **Responsabilidad:** Grid contexto (fecha, entrega, cliente, teléfono, dirección, total, link detalle)
- **Variant workstation:** sin badge estado (movido a header modal)
- **Estilos:** `order-workspace-overview.module.css`

### 4.13 OrderRiskPanel
- **Archivo:** `components/admin/orders/order-risk-panel.tsx`
- **Tipo:** Client Feature
- **Responsabilidad:** `assessOrderRisk`, render si level ≠ stable; interval 60s
- **Props modal:** `compact`
- **Estilos:** `order-risk-panel.module.css`

### 4.14 OrderHumanTimeline
- **Archivo:** `components/admin/orders/order-human-timeline.tsx`
- **Tipo:** Client Feature (memo)
- **Responsabilidad:** Timeline eventos; compact oculta history summary, max 5 eventos
- **Estilos:** `order-human-timeline.module.css`, workspace

### 4.15 OperatorPresencePill
- **Archivo:** `components/admin/orders/operator-presence-pill.tsx`
- **Tipo:** UI/Feature
- **Responsabilidad:** Toolbar "quién está viendo"
- **Estilos:** `operator-presence-pill.module.css`

### 4.16 Badge (UI)
- **Archivo:** `components/ui/Badge.tsx`
- **Tipo:** UI primitive
- **Responsabilidad:** Label estado (`Pendiente`, `Preparando`, etc.)
- **Estilos:** globals `.ui-badge--{status}`

### 4.17 Button (UI)
- **Archivo:** `components/ui/Button.tsx`
- **Tipo:** UI primitive
- **Variantes usadas en modal:** primary, secondary, accent, ghost

### 4.18 Card (UI)
- **Archivo:** `components/ui/Card.tsx`
- **Uso modal:** OrderItemsSection, OrderNotesSection; **no** en actions/timeline compact workstation

### 4.19 AdminDashboardOrders (indirecto)
- **Archivo:** `components/admin/orders/admin-dashboard-orders.tsx`
- **Responsabilidad:** Estado `selectedOrderId`, open/close, optimistic board sync, presence surface

**Total componentes relacionados identificados:** 19 directos + 3 UI primitives + 1 orquestador padre

---

## 5. Current TSX Structure

```
AdminDashboardPage (app/admin/(protected)/dashboard/page.tsx)
└── AdminDashboardOrders (admin-dashboard-orders.tsx)
    ├── DashboardKanbanBoard / OrderCard / operational-feed / insights
    │   └── onOpen(order) → openOrder()
    └── [selectedOrder ?]
        └── AdminOrderWorkspaceModal (dynamic, ssr: false)
            └── AdminOrderModalShell (variant="workstation", portal → body)
                ├── Header (inline JSX via headerLeading + headerMeta)
                │   ├── #XXXX - Cliente (inline)
                │   ├── Badge status
                │   ├── Tiempo: {relative} (tabular)
                │   └── Cerrar
                ├── Loading state (inline)
                ├── Error state (inline)
                └── AdminOrderWorkspaceErrorBoundary
                    ├── Toolbar presencia/refresh (inline, optional)
                    └── .workspaceGrid
                        ├── .executionColumn
                        │   ├── OrderItemsSection
                        │   │   └── OrderProductsList
                        │   │       └── OrderProductModal (nested, on row click)
                        │   └── OrderNotesSection
                        └── .commandColumn
                            ├── OrderActionsSection (workstation)
                            │   ├── StatusForm
                            │   ├── OrderAssignmentControls
                            │   └── OrderExternalActions
                            ├── OrderWorkspaceOverview (workstation)
                            ├── OrderRiskPanel (compact)
                            └── OrderHumanTimeline (compact)
```

**Nota:** `OrderWorkspace`, `OrderCustomerSection`, `OrderDeliverySection`, `OrderTotalSection` **no** participan en el modal dashboard.

---

## 6. Modal Opening / Closing Flow

| Pregunta | Respuesta |
|----------|-----------|
| Dónde se guarda el estado de apertura | `admin-dashboard-orders.tsx`: `selectedOrderId`, `selectedOrderSeed` |
| Variable controladora | `selectedOrderId !== null` → monta modal |
| Cómo se selecciona el pedido | `openOrder(order)` → `setSelectedOrderId`, `setSelectedOrderSeed`, `pushState` URL |
| Cómo se limpia | `closeOrder()` → null IDs + `replaceState` sin `?order=` |
| Cómo se cierra | Overlay click, botón Cerrar, Escape (shell), browser back (`popstate`) |
| Escape / click outside | Sí: shell overlay + Escape en shell |
| Side effects al cerrar | `persistScrollPosition()` sessionStorage; unmount modal; presence surface vuelve a `"dashboard"` |

**URL sync:**
- Param: `?order={uuid}` (+ `filter` opcional)
- Init: `initialOrderId = resolveOrderId(searchParams.get("order"), orders)`
- `popstate`: re-lee URL y actualiza `selectedOrderId` / seed

**Lazy load:** `dynamic(() => import(...), { ssr: false })` — bundle modal solo al primer open.

---

## 7. Order State Logic

| Pregunta | Respuesta |
|----------|-----------|
| Dónde se muestra estado | Header: `Badge`; StatusForm select; timeline eventos |
| Dónde se cambia | `StatusForm` → `updateOrderStatusAction` |
| Handler | `handleSubmit` en `status-form.tsx` |
| Estado local temporal | `selectedStatus` en form; `displayOrder.status` en modal vía optimistic patch |
| Submit explícito | Sí: botón "Guardar estado" |
| Optimistic update | Sí: modal `patchAdminOrderWorkspaceStatus` + dashboard `patchAdminOrderDashboardItemStatus` |
| Loading | `useTransition` → `isPending`, label "Sincronizando..." |
| Error handling | Toast error + rollback `selectedStatus` + `onOptimisticStatusRollback` |
| Rollback | Sí, en error de action o catch |
| Estados posibles | `pending`, `preparing`, `ready`, `completed`, `cancelled` |

**Post-success:** `handleStatusSuccess` → `loadOrder({ force: true })` refresca workspace desde API.

---

## 8. Ownership / Responsible Logic

| Pregunta | Respuesta |
|----------|-----------|
| Detección responsable | `order.assigned_to` vs `currentUserId` |
| Dónde se muestra | `OrderAssignmentControls` (label + botón); `OrderWorkspaceOverview` (assignmentLabel texto); dashboard computa `selectedOrderAssignmentLabel` |
| Acción | Claim (asignar a mí) / Release (liberar) |
| Handler | `OrderAssignmentControls.handleSubmit` → `updateOrderAssignmentAction` |
| Reasignación | Sí: puede tomar pedido aunque tenga otro responsable (nota UI) |
| Permisos | `canUpdateOrders` oculta botón y muestra nota solo lectura |
| Loading/error | useTransition + toast |
| Duplicación visual | Responsable en AssignmentControls **y** assignmentLabel en Overview |

**Labels:** `buildOrderAssignmentOwnerLabel`, `buildOrderAssignmentActionLabel` (`lib/orders/assignment.ts`)

---

## 9. WhatsApp / Communication Logic

| Pregunta | Respuesta |
|----------|-----------|
| Dónde se arma mensaje | `lib/whatsapp/admin.ts` — `buildOrderWhatsappMessage` |
| Templates | `received`, `preparing`, `ready_pickup`, `ready_delivery`, `on_the_way`, `confirm_address`, `summary` |
| Selección template | `<select>` en `OrderExternalActions`; filtrados por status + delivery_method |
| Cómo abre WhatsApp | `Button href={whatsappUrl}` → `https://wa.me/{digits}?text={encoded}` |
| Phone normalization | `normalizePhoneDigits` — strip non-digits |
| encodeURIComponent | Sí, en `buildAdminOrderWhatsappUrl` |
| Datos en mensaje | Nombre, items/resumen, total, dirección según template |
| Copiar tel/dirección/resumen | `copyTextToClipboard` + toast |

**Fuera del modal:** `order-card-quick-actions.tsx` usa `buildContextualOrderWhatsappUrl` one-click.

---

## 10. Phone / Maps / Clipboard Logic

| Acción | Implementación |
|--------|----------------|
| Copiar teléfono | `copyValue(order.phone)` → `copyTextToClipboard` |
| Llamar | `buildOrderCallUrl` → `tel:{digits}` via Button href |
| Copiar dirección | clipboard address string |
| Abrir Maps | `buildOrderMapsUrl` → Google Maps search URL |
| Copiar resumen | `buildOrderContactSummary(order)` |
| Compartir | `shareText` Web Share API (si disponible) |
| navigator.clipboard | Sí, con fallback `document.execCommand('copy')` |
| Feedback visual | Toast success/error vía `useAdminToast` |

---

## 11. Customer / Delivery Data Mapping

| Dato | Fuente en modal | Componente |
|------|-----------------|--------------|
| Fecha/hora entrega | `order.delivery_date`, `order.delivery_time` | OrderWorkspaceOverview — `formatAdminOrderDate` |
| Tipo entrega | `order.delivery_method` | Overview — `formatAdminDeliveryMethod` |
| Cliente | `order.customer_name` | Overview grid |
| Teléfono | `order.phone` | Overview + ExternalActions |
| Dirección | `order.address` | Overview (si delivery) + ExternalActions |
| Items | `order.order_items` | OrderProductsList (hydrated workspace o seed preview) |
| Total | `order.total_price` | OrderProductsList total row + Overview footer |
| Notas | `order.notes` | OrderNotesSection |
| Cantidad items | derivado en presenter | `buildOrderOperationalSummary` (overview/page variants) |
| Ref pedido header | `order.id` last 4 chars | inline `buildOrderDisplayRef` en modal |
| Tiempo transcurrido | `order.created_at` | Header — `buildOrderRelativeTimeLabel` |

**Seed vs hydrated:** Dashboard item → `buildAdminOrderInitialDetail`; full data → `GET /admin/orders/[id]/workspace`.

---

## 12. Risk Operational Logic

| Pregunta | Respuesta |
|----------|-----------|
| Dónde se calcula | `assessOrderRisk()` en `lib/orders/risk-detection.ts` |
| Dónde se recibe | `operationalMetrics` prop desde dashboard → `OrderRiskPanel` |
| Flags | `inactive`, `slow-preparation`, `regressive`, `many-changes`, `reassigned`, `stalled` |
| Levels | `stable` (hidden), `attention`, `warning` |
| Labels | `buildOrderRiskBadgeLabel`, signal chips traducidos en panel |
| Colores | CSS `--color-pending`, `--color-cancelled`, `--bg-*-subtle` via module |
| Condiciones | Solo pedidos activos (pending/preparing/ready); scoring por señales + thresholds |
| Último movimiento | Sí — `getOrderLastActivityTimestamp` |
| Cambio regresivo | Sí — detecta status backward en timeline |
| Estancamiento | Sí — `stalled`, inactive minutes thresholds |

**Render:** `null` si `level === "stable"`. Re-evalúa cada 60s (`setInterval`).

---

## 13. History / Timeline Logic

| Pregunta | Respuesta |
|----------|-----------|
| Dónde se renderiza | `OrderHumanTimeline` en commandColumn |
| Origen eventos | `displayOrder.order_events` (workspace API + append optimistic) |
| Estructura | `AdminOrderTimelineEvent`: id, event_type, payload, created_at, actor_label |
| Orden | `buildPresentedOrderTimelineEntries` — cronológico presentado |
| Formato tiempo | `buildOrderRelativeTimeLabel` / meta strings en entries |
| Labels | Por event_type: created, status_changed, assignment_* |
| Scroll interno | Column scroll (`commandColumn overflow-y: auto`) |
| Empty state | Fallback `buildFallbackOrderCreatedEvent` si no hay order_created |
| Modal compact | Sin history summary metrics; max 5 eventos; link "Ver historial completo" |

---

## 14. Current Visual Layout

### Zonas
1. **Overlay** — fullscreen dim
2. **Panel** — surface card, rounded, shadow
3. **Header** — single row: order ref + badge | tiempo | cerrar
4. **Toolbar** — presencia / refreshing (opcional)
5. **Grid** — 2 columnas desktop; stack mobile (command first via `order: -1`)
6. **Left** — productos + notas
7. **Right** — acciones + contexto + riesgo + timeline (fondo soft)

---

## 15. Overlay / Modal Container Audit

### Overlay
| Propiedad | Valor |
|-----------|-------|
| Componente | `.admin-order-modal-shell__overlay` (button) |
| Fondo | `rgba(0, 0, 0, 0.65)` |
| Opacity | 65% black |
| Blur | **No** en shell principal (removido en Fase 10.2) |
| z-index | 50 (shell) |
| Dark/light | Funciona igual ambos; no tokenizado (hardcode rgba) |

### Contenedor modal (`.admin-order-modal-shell__panel--workstation`)
| Propiedad | Valor |
|-----------|-------|
| Width mobile | `100%`, `max-width: 600px` |
| Width desktop ≥1024 | `95vw`, `max-width: 1200px` |
| Height desktop | `90vh` |
| Max-height | `90vh` |
| Border radius | `18px` |
| Border | `1px solid var(--border-subtle)` |
| Background | `var(--bg-surface)` |
| Shadow | `var(--shadow-premium)` |
| Overflow | `hidden` (panel); scroll en columnas |
| Responsive | Flex column stack <1024; grid 1.5fr/1fr ≥1024 |

---

## 16. Header Audit

| Elemento | Detalle |
|----------|---------|
| Orden visual | `#REF - Cliente` · Badge · (flex-grow implícito) · Tiempo · Cerrar |
| Clases | `admin-order-modal-shell__header--workstation`, `__workstation-title`, `__workstation-order-label`, `__header-meta--elapsed` |
| Tipografía | 0.92rem label, 0.82rem tiempo tabular-nums weight 700 |
| Botones | Cerrar — pill border subtle |
| Badges | `Badge` global ui-badge |
| Problemas | Badge compite visualmente con CTA de acciones; no hay subtítulo operativo ("qué hacer ahora") |

---

## 17. Left Column Audit

| Propiedad | Valor |
|-----------|-------|
| Width | ~60% grid (1.5fr) desktop |
| Contenido | Productos (Card transparente en workstation), Notas |
| Total | En OrderProductsList `.admin-total-row` |
| Scroll | `executionColumn overflow-y: auto` |
| Clases | `.executionColumn`, overrides `admin-order-modal-shell__body--workstation` |
| Separadores | Border-bottom por fila producto |
| Espacio vacío | Header "PRODUCTOS" uppercase pequeño; gap reducido Fase 11.1 |

---

## 18. Right Column Audit

| Propiedad | Valor |
|-----------|-------|
| Width | ~40% (1fr) desktop |
| Background | `var(--bg-surface-soft)` |
| Padding | `1.5rem` |
| Border radius | `12px` |
| Scroll | `overflow-y: auto` independiente |
| Sticky | Ninguno actualmente |
| Secciones | Actions → Overview → Risk → Timeline |
| Gap | `1rem` entre secciones |
| Mobile | `order: -1` (acciones arriba del stack) |

---

## 19. Buttons Audit

| Texto | Acción | Archivo | Variante | Clasificación | Problema |
|-------|--------|---------|----------|---------------|----------|
| Cerrar | close modal | shell | ghost/pill custom | Utility | OK |
| Guardar estado | submit status | status-form | primary (`admin-primary-button`) | Primary | Compite con assignment; no es CTA contextual por estado |
| Tomar pedido / Liberar | assignment | assignment-controls | primary o secondary | Primary/Secondary | Variant flip confuso |
| Abrir WhatsApp | external link | external-actions | accent | Primary visual en comms | OK en su contexto |
| Copiar teléfono | clipboard | external-actions | secondary | Utility | OK |
| Llamar | tel: link | external-actions | secondary | Utility | OK |
| Copiar dirección | clipboard | external-actions | secondary | Utility | OK |
| Abrir Maps | external | external-actions | secondary | Utility | OK |
| Copiar resumen | clipboard | external-actions | secondary | Utility | OK |
| Compartir | Web Share | external-actions | ghost | Utility | OK |
| Ver detalle completo | navigate | overview | admin-ghost-link | Ghost | OK |
| Product row click | open item modal | products-list | button row | Ambiguous | Parece lista, abre otro modal |

**Prioridad visual vs real:** No hay botón único "acción recomendada" (ej. "Marcar Listo" directo). El flujo real es select + Guardar.

---

## 20. Inputs / Selects Audit

| Input | Componente | Clases | Dark readiness |
|-------|------------|--------|----------------|
| Select estado | native `<select>` | `admin-field` global | Parcial — depende globals |
| Select WhatsApp template | native `<select>` | `admin-field`, `whatsappField` | Parcial |

No hay inputs de texto libres en el modal.

---

## 21. Badges / Status Audit

| Badge | Ubicación | Clases | Duplicación |
|-------|-----------|--------|-------------|
| Estado pedido | Header modal | `ui-badge ui-badge--{status}` | Antes también en overview workstation (removido) |
| Riesgo | OrderRiskPanel header | module signal chips | Distinto de dashboard card risk badge |
| Timeline signals | Solo page full mode | history summary | Oculto en modal compact |

**Labels estado:** Pendiente, Preparando, Listo, Completado, Cancelado (`Badge.tsx`).

---

## 22. CSS / Tailwind / Tokens Audit

### Enfoque del modal
- **Tailwind:** No usado en componentes modal
- **CSS Modules:** Sí — principal método
- **Globals:** `ui-button`, `ui-badge`, `ui-card`, `admin-field`, `admin-primary-button`, `admin-ghost-link`
- **Variables CSS:** `var(--bg-surface)`, `--text-primary`, `--border-subtle`, status tokens
- **Inline styles:** Solo fallback clipboard textarea (lib, no modal)

### Hardcodes importantes (modal ecosystem)

| Clase/valor | Archivo | Uso | Riesgo | Token sugerido |
|-------------|---------|-----|--------|----------------|
| `rgba(0, 0, 0, 0.65)` | admin-order-modal.module.css | Overlay | Medio | `--overlay-scrim` |
| `rgba(9, 9, 11, 0.42)` | order-detail-surfaces.module.css | Item modal backdrop | Medio | `--overlay-scrim-soft` |
| `backdrop-filter: blur(6px)` | order-detail-surfaces.module.css | Item modal | Medio perf | opcional token |
| `z-index: 24` | order-detail-surfaces | Item modal | Bajo | usar escala z-index doc |

### Patrones CSS frecuentes en modal
- `display: flex / grid`
- `gap: 0.5rem–1.5rem`
- `overflow-y: auto`, `overflow: hidden`
- `max-width`, `max-height`, `90vh`, `95vw`
- `border-radius: 12px–18px`
- `var(--shadow-premium)`

---

## 23. Dark Theme Readiness

| Elemento | Estado dark-ready | Problema | Recomendación |
|----------|-------------------|----------|---------------|
| Panel surface | Ready | — | — |
| Text primary/secondary | Ready | tokens theme-tokens dark block | — |
| Command column soft bg | Ready | `--bg-surface-soft` | — |
| Overlay scrim | Parcial | hardcode rgba | token `--overlay-scrim` |
| Item modal backdrop | Parcial | hardcode + blur | token + theme test |
| Status badges | Ready | ui-badge usa status tokens | — |
| Risk panel attention/warning | Ready | semantic color-mix | — |
| Native selects | Parcial | dependen browser + admin-field globals | audit globals select |
| External action grid | Ready | ui-button tokens | — |
| WhatsApp accent button | Ready | ui-button--accent | — |

**Partes que funcionan bien en dark:** Superficies, texto, badges, riesgo, column layout.

**Partes frágiles en light:** Mismo token system soporta light via `html[data-dashboard-theme="light"]` — modal debería funcionar, pero poco testeado visualmente vs dashboard legacy warm zones.

---

## 24. Responsive Readiness

| Breakpoint | Comportamiento |
|------------|----------------|
| <720px | Panel full width in shell padding; stack columns; command first |
| 720–1023px | Panel centered; max-width 600px workstation; single column stack |
| ≥1024px | 95vw × 1200px max; grid 60/40; dual scroll |

**Problemas:**
- Tablet (768–1023) permanece estrecho (600px) — diseño mobile-first KDS no aprovecha iPad landscape hasta 1024.
- `commandColumn order: -1` invierte prioridad visual en mobile (acciones antes que productos).

---

## 25. Mixed Responsibilities

| Responsabilidad | Dónde vive | Por qué extraer | Riesgo extraer | Prioridad |
|-----------------|------------|------------------|----------------|-----------|
| Workspace hydration + cache | admin-order-workspace-modal | Testabilidad, reuso | Medio — cache global | P1 |
| Optimistic orchestration | modal + dashboard | Duplicación callbacks | Alto | P1 |
| Header label building | modal useMemo | Presentational | Bajo | P2 |
| buildOrderDisplayRef | inline modal | Presenter utility | Bajo | P3 |
| Layout grid CSS | admin-order-modal.module.css | OK centralizado | Bajo | P3 |
| WhatsApp/templates | lib/whatsapp (OK) | Ya separado | Bajo | — |
| Risk assess | lib (OK) | Ya separado | Bajo | — |
| Timeline build | lib/events (OK) | Ya separado | Bajo | — |

**En un mismo componente conviven (modal):** fetch, cache, merge seed, optimistic patches, header JSX, layout composition — **demasiado para un solo archivo** (~550 LOC).

---

## 26. Component Extraction Candidates

### OrderModalHeader
- **Responsabilidad:** Ref, cliente, badge, tiempo, cerrar
- **Reemplaza:** headerLeading + headerMeta assembly en workspace modal
- **Props:** `orderRef`, `customerShortName`, `status`, `elapsedLabel`, `onClose`
- **Riesgo:** Bajo
- **Prioridad:** P2

### OrderProductsSummary
- **Responsabilidad:** Lista compacta + total
- **Reemplaza:** OrderItemsSection en modal context
- **Props:** `items`, `totalPrice`, `onItemClick`
- **Riesgo:** Bajo
- **Prioridad:** P2

### OrderCustomerDeliveryInfo
- **Responsabilidad:** Grid contexto workstation
- **Reemplaza:** workstation branch OrderWorkspaceOverview
- **Props:** order fields, assignmentLabel, detailHref
- **Riesgo:** Medio — variant divergence
- **Prioridad:** P1

### OrderPrimaryActionPanel
- **Responsabilidad:** CTA recomendado + status + ownership
- **Reemplaza:** top of OrderActionsSection
- **Props:** order, permissions, callbacks
- **Riesgo:** Alto — UX behavior change
- **Prioridad:** P1 (fase UX posterior)

### OrderCommunicationPanel
- **Responsabilidad:** WhatsApp + clipboard grid
- **Reemplaza:** OrderExternalActions
- **Props:** order
- **Riesgo:** Bajo — mostly move
- **Prioridad:** P2

### OrderRiskAlert
- **Responsabilidad:** Compact risk banner
- **Reemplaza:** OrderRiskPanel compact mode
- **Props:** order, metrics
- **Riesgo:** Bajo
- **Prioridad:** P3

### OrderTimeline
- **Responsabilidad:** Compact history list
- **Reemplaza:** OrderHumanTimeline compact
- **Props:** events, createdAt, status, detailHref
- **Riesgo:** Medio — memo equality
- **Prioridad:** P2

### useOrderWorkspaceHydration (hook)
- **Responsabilidad:** fetch, cache, merge, loading, error
- **Reemplaza:** state block in modal
- **Props:** order, isOpen
- **Riesgo:** Medio
- **Prioridad:** P1

**Total candidatos:** 8 componentes/hooks

---

## 27. Functional Risk Map

| Riesgo | Archivo | Por qué sensible | Minimal blast radius | Test manual |
|--------|---------|------------------|----------------------|-------------|
| Status update | status-form + actions.ts | Optimistic + board + cache | Extraer UI only; no tocar action | Cambiar estado y verificar board + timeline |
| Ownership update | assignment-controls | Multi-user conflict | Mantener action; test labels | Tomar/liberar con 2 usuarios |
| WhatsApp URL | lib/whatsapp/admin | Encoding/phone edge cases | No cambiar builder | Abrir WA con +54, espacios |
| Clipboard | client-actions | Permisos browser | No cambiar | Copiar teléfono Safari |
| History rendering | order-human-timeline | Memo + event identity | Visual-only changes | Pedido con 10+ eventos |
| Scroll behavior | admin-order-modal.module.css | Nested scroll UX | CSS-only isolated | Scroll productos vs columnas |
| selected order state | admin-dashboard-orders | URL sync | No tocar sin tests URL | Back button, deep link ?order= |
| Modal close | shell + closeOrder | History replaceState | Shell-only | Cerrar no deja ?order= |
| Optimistic UI | dashboard + modal | Dual patch paths | Feature flag per flow | Falla red mid-submit |
| Realtime sync | dashboard (not modal) | Board updates while modal open | Document only | OTRO usuario cambia estado |
| workspaceOrderCache | workspace modal | Stale data cross orders | Cache key audit | Abrir A, luego B, volver A |
| Nested product modal | order-product-modal | z-index focus trap | Defer | Click producto, Escape |

**Total riesgos funcionales documentados:** 12

---

## 28. Manual QA Checklist

| Caso | Resultado esperado | Observar visualmente | Puede romperse |
|------|-------------------|---------------------|----------------|
| Abrir pedido pendiente | Modal wide desktop, 2 cols | Header ref+badge, productos izq | Grid display, width |
| Cerrar modal | Unmount, URL limpia | Overlay gone | popstate, scroll restore |
| Cambiar estado | Optimistic + toast | Badge header updates | Rollback on error |
| Guardar estado sin cambio | Toast info | — | — |
| Tomar pedido | assigned_to = me | Label responsable | Concurrent claim |
| Abrir WhatsApp | Nueva pestaña wa.me | Template correcto | Phone normalize |
| Copiar teléfono | Toast success | — | clipboard deny |
| Llamar | tel: opens | — | desktop noop |
| Copiar dirección | Toast | — | empty address hidden |
| Abrir Maps | Google maps | — | encode URI |
| Copiar resumen | Clipboard multi-line | — | — |
| Compartir | Native share sheet mobile | — | desktop hidden |
| Ver riesgo | Panel visible si not stable | Colors attention/warning | null stable |
| Ver historial | Max 5 events compact | Dots minimal | summary hidden |
| Scroll interno | Cols scroll independent | No body scroll | wheel trap |
| Sin responsable | "Sin responsable" | Tomar = primary | — |
| Con responsable | Label + secondary tomar | Nota reasignación | — |
| Completado | Risk hidden | Status badge | actions read-only? |
| Cancelado | Risk hidden | — | — |
| Sin historial | Fallback created event | — | empty list |
| Sin teléfono | WA hidden, copy hidden | — | — |
| Sin dirección | Maps/copy hidden | — | delivery only |
| Con notas | Notes section | — | — |
| Sin notas | Notes absent | — | — |
| Loading hydrate | Seed visible, luego full | "Actualizando..." | flash content |
| Error hydrate | Error state if no seed | — | network |
| Presencia | Pill in toolbar | — | — |
| Ver detalle completo | Navigate full page | Modal closes via router | dashboardHref |
| Click producto | Nested modal | z-index stacking | double scroll lock |
| Escape | Closes workspace modal | — | nested modal order |
| Tablet 768px | Narrow 600px single col | Command first | layout |
| Desktop 1280px | 95vw wide 2-col | — | max-width |

---

## 29. Prioritized Findings

### P0 — Riesgo funcional o bloqueo de refactor
| ID | Hallazgo | Categoría |
|----|----------|-----------|
| F-01 | Dual optimistic path (modal cache + dashboard board) — fácil desync | Funcional |
| F-02 | Modal re-renderiza con todo el dashboard (tick `now`, realtime) | Arquitectura |
| F-03 | `workspaceOrderCache` module-level sin TTL/eviction | Funcional |

### P1 — Estructural importante
| ID | Hallazgo | Categoría |
|----|----------|-----------|
| F-04 | Sin componente "acción recomendada" — UX no guía operador | UX |
| F-05 | Duplicación total / responsable / contexto entre secciones | UX / Arquitectura |
| F-06 | Modal no usa OrderWorkspace — divergencia page vs modal | Arquitectura |
| F-07 | Tablet 768–1023 locked 600px — KDS subutilizado | Responsive |
| F-08 | admin-order-workspace-modal mezcla hydration + layout + handlers | Arquitectura |
| F-09 | CSS legacy selectors `.admin-order-modal-content--workstation` duplicados en module | CSS/tokens |

### P2 — Mejora visual/UX relevante
| ID | Hallazgo | Categoría |
|----|----------|-----------|
| F-10 | Jerarquía botones: Guardar estado no es CTA contextual | UX |
| F-11 | Grid utilidades WhatsApp 6 botones mismo peso visual | Visual |
| F-12 | Header denso pero sin resumen operativo (entrega/próxima acción) | UX |
| F-13 | Item modal backdrop hardcode + blur inconsistente con shell | Visual / Dark theme |
| F-14 | Mobile stack pone command antes que productos | UX |

### P3 — Polish menor
| ID | Hallazgo | Categoría |
|----|----------|-----------|
| F-15 | Overlay rgba no tokenizado | CSS/tokens |
| F-16 | Labels timeline sin acentos en UI ("ultimos", "Senales") | Accesibilidad |
| F-17 | Performance audit tree outdated (menciona OrderWorkspace en modal) | Documentación |

**Conteo:** P0: 3 | P1: 6 | P2: 5 | P3: 3 — **Total: 17 hallazgos**

---

## 30. Recommended Refactor Phases

### Phase 0 — Audit only ✅
Este documento.

### Phase 1 — Extract presentational subcomponents
- `OrderModalHeader`, `OrderCustomerDeliveryInfo`, hook-free wrappers
- Sin cambiar behavior

### Phase 2 — Reorganize layout (validar KDS)
- Confirmar grid 60/40 + widths en todos breakpoints
- Unificar selectors CSS workstation bajo `body--workstation`

### Phase 3 — Header hierarchy + badge system
- Acción contextual en header subtitle
- Un solo badge estado canonical

### Phase 4 — Rebuild right panel sections
- Recommended action → Status → Responsible → Communication → Risk → History
- OrderPrimaryActionPanel new

### Phase 5 — Improve left column
- Products ticket density
- Mover total a summary block coherente
- Customer/delivery inline si se quita duplicación

### Phase 6 — Normalize buttons/badges
- Design system variants
- Single primary per panel

### Phase 7 — Scroll/sticky behavior
- Eliminar scroll competidor
- Optional sticky actions header en command column

### Phase 8 — Dark/light token cleanup
- `--overlay-scrim`, remove hardcodes
- Select styling tokens

### Phase 9 — Manual QA + regression
- Checklist §28 completo
- Compare with order detail page parity

---

## 31. What Not To Touch Yet

- `app/admin/(protected)/orders/[id]/actions.ts` — server actions status/assignment
- `use-admin-orders-realtime.ts` — realtime dashboard (modal depende indirectamente)
- Supabase schema / RLS
- `workspace/route.ts` response shape
- Optimistic callback signatures en dashboard hasta Phase 1 complete
- `order-card-quick-actions.tsx` WhatsApp contextual (fuera modal pero relacionado)
- Kanban board / lane filters

---

## 32. Next Implementation Prompt Suggestion

```
Contexto: Phase 1 — Order Modal Presentational Extraction (zero behavior change).

Objetivo: Extraer OrderModalHeader y useOrderWorkspaceHydration desde 
admin-order-workspace-modal.tsx sin modificar props públicos ni callbacks optimistic.

Tareas:
1. Crear components/admin/orders/order-modal-header.tsx (+ module.css opcional)
   - Props: orderRef, customerShortName, status, elapsedLabel, onClose
   - Mover JSX de workstationHeaderLeading + meta tiempo

2. Crear hooks/use-order-workspace-hydration.ts
   - Mover workspaceOrderCache, loadOrder, detail/loading/error state
   - Retornar { displayOrder, loading, error, appendTimelineEvent, refresh }

3. AdminOrderWorkspaceModal debe reducirse a composición layout + wiring callbacks

Restricciones:
- NO cambiar server actions, API, optimistic signatures
- NO cambiar CSS layout grid
- NO cambiar textos visibles
- Ejecutar npm run build al final

Validación: Manual QA casos abrir/cerrar, cambiar estado, tomar pedido, WhatsApp.
```

---

## Validaciones de fase

```
No se modificó código funcional.
Sólo se creó documentación de auditoría.
No se requiere tsc para esta fase.
No se requiere lint para esta fase.
```

---

## Referencias cruzadas

- Performance audit previo: `docs/order-modal-performance-audit.md` (parcialmente desactualizado en árbol TSX post-Fase 11)
- Visual tokens: `app/theme-tokens.css`
- Z-index scale: `docs/visual-z-index-scale.md`
