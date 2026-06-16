# Board / Orders Execution Area — Forensic Audit

## Objetivo

Auditar de forma forense el **Board / Orders Execution Area** de `/admin/dashboard`: arquitectura, flujo de datos, realtime, hydration, optimistic UX, lanes/cards, empty/context, CSS/tokens, responsive, performance, accessibility y deuda técnica — **sin modificar código**.

## Contexto

El bloque **Dashboard Execution Toolbar** está cerrado (T4.2–T10, DEVX-1/2). Esta épica aborda la zona operativa real del tablero.

Deuda heredada del toolbar/T10:

- `Estados del flujo` redundante en empty state
- Empty/context panel con integración pendiente
- Resumen operativo / actividad reciente requieren revisión
- Context panel débil en tablet/mobile
- Lanes/cards como núcleo operativo por auditar

## Alcance auditado

- Execution flow dentro de `/admin/dashboard` (board, lanes, cards, empty, context)
- Integración con toolbar (search/filter/sync/session) — lectura only
- SSR, route JSON, server actions relacionadas — lectura only
- Hooks realtime/hydration del container
- CSS modules del board y componentes de card/context/lanes

**Fuera de scope de fixes B0:** top section KPIs (solo dependencias), order modal internals (solo integración open), DB/migrations.

## Archivos revisados

### Container / orchestrator

| Archivo | Rol |
|---------|-----|
| `components/admin/orders/admin-dashboard-orders.tsx` | **~2,486 líneas** — container principal |
| `components/admin/orders/admin-dashboard-orders.module.css` | Layout execution + context (~310 líneas) |

### Board / lanes / cards

| Archivo | Rol |
|---------|-----|
| `components/admin/orders/DashboardKanbanBoard.tsx` | Kanban horizontal por status |
| `components/admin/orders/dashboard-kanban.module.css` | Lanes scroll horizontal |
| `components/admin/orders/lane-navigation-scanning.tsx` | Jump nav + IntersectionObserver |
| `components/admin/orders/lane-navigation-scanning.module.css` | Sticky lane nav |
| `components/admin/orders/lane-metrics-layer.tsx` | Métricas por lane |
| `components/admin/orders/order-card.tsx` | Card operativa |
| `components/admin/orders/order-card.module.css` | Estilos card |
| `components/admin/orders/order-card-quick-actions.tsx` | Acciones rápidas status |
| `components/admin/orders/order-assignment-controls.tsx` | Assignment (modal) |
| `components/admin/orders/order-external-actions.tsx` | WhatsApp/copy |
| `components/admin/orders/status-form.tsx` | Form status (modal/detail) |

### Context / empty

| Archivo | Rol |
|---------|-----|
| `components/admin/orders/DashboardContextPanel.tsx` | Resumen + insights + feed |
| `components/admin/orders/operational-summary-strip.tsx` | Strip resumen |
| `components/admin/orders/business-insights-strip.tsx` | Micro-insights |
| `components/admin/orders/operational-feed.tsx` | Actividad reciente |
| `components/admin/orders/dashboard-analytics-surfaces.module.css` | Empty context surfaces |
| `components/admin/orders/dashboard-filters.module.css` | Empty filtrado |

### Modal / detail (integración)

| Archivo | Rol |
|---------|-----|
| `components/admin/orders/admin-order-workspace-modal.tsx` | Modal desde card |
| `components/admin/orders/order-workspace.tsx` | Workspace sections |
| `components/admin/orders/order-detail-page-client.tsx` | Página detail |
| `components/admin/orders/order-detail-surfaces.module.css` | Surfaces detail |

### Hooks / realtime

| Archivo | Rol |
|---------|-----|
| `components/admin/orders/use-admin-orders-realtime.ts` | INSERT/UPDATE + pending mutations |
| `components/admin/orders/use-admin-store-session-realtime.ts` | Session hydration |
| `components/admin/orders/use-admin-presence.ts` | Presencia operadores |
| `components/admin/orders/use-order-workspace-hydration.ts` | Hydration modal |

### Lib / data

| Archivo | Rol |
|---------|-----|
| `lib/orders/admin.ts` | `getAdminOrders`, `AdminOrderDashboardItem` |
| `lib/orders/realtime.ts` | `patchDashboardOrderFromRealtime` |
| `lib/orders/workspace.ts` | Patches optimistic |
| `lib/orders/analytics.ts` | Operational window / session scope |
| `lib/orders/sorting.ts` | `sortOrdersForOperationalBoard` |
| `lib/orders/natural-search.ts` | Search parser |
| `lib/orders/lane-navigation-scanning.ts` | Model lane nav |
| `lib/orders/lane-metrics.ts` | Métricas por lane |
| `lib/orders/metrics.ts` | Operational metrics + insights |
| `lib/orders/risk-detection.ts` | Risk badges |
| `lib/orders/operational-summaries.ts` | Context summaries |
| `lib/orders/business-insights.ts` | Insights strip |
| `lib/orders/operational-feed.ts` | Feed items |
| `lib/orders/activity.ts` | Recent activity |
| `lib/orders/assignment.ts` | Assignment labels/patches |
| `lib/orders/presenter.ts` | Formatting, timeline, aging |
| `lib/orders/delivery-workflow-lanes.ts` | Model alternativo (no wired) |
| `lib/orders/priority-risk-lanes.ts` | Model alternativo (no wired) |

### Rutas / actions

| Archivo | Rol |
|---------|-----|
| `app/admin/(protected)/dashboard/page.tsx` | SSR orders + session |
| `app/admin/(protected)/dashboard/orders/route.ts` | Silent refresh JSON |
| `app/admin/(protected)/dashboard/actions.ts` | Store session actions |
| `app/admin/(protected)/orders/[id]/actions.ts` | `updateOrderStatusAction`, `updateOrderAssignmentAction` |

### Componentes alternativos no conectados

| Archivo | Estado |
|---------|--------|
| `components/admin/orders/delivery-workflow-lanes.tsx` | **No importado** en dashboard |
| `components/admin/orders/priority-risk-lanes.tsx` | **No importado** en dashboard |

## Resumen ejecutivo

| Área | Veredicto |
|------|-----------|
| Arquitectura | Funcional pero **monolítica** — container concentra demasiadas responsabilidades |
| Realtime | Sólido para INSERT/UPDATE con pending-mutation lock; **sin DELETE** |
| Hydration | `refreshOrdersSilently` bien diseñado con cooldowns + bypass manual |
| Optimistic UX | Status bien protegido; **assignment sin lock** |
| Lanes/workflow | Kanban por status hardcoded; nav scanning útil pero redundante en empty |
| Cards | Ricas en info; quick actions operativas; memoización custom |
| Empty/context | Tres niveles de empty claros; **context panel desacoplado visualmente** y ligado a `filteredOrders` |
| Performance | Muchos `useMemo` útiles; recálculo en cada keystroke de search; sin virtualización |
| Tests | **Cero** automatizados |
| CSS/tokens | Mix tokens + rgba hardcoded en módulos legacy |

**Recomendación:** proceder con **B1 Product Contract** antes de rediseño; priorizar **B3 Empty+Context** y **B6 Realtime hardening** en roadmap.

---

## Mapa de arquitectura actual

```txt
┌─────────────────────────────────────────────────────────────────┐
│ app/admin/(protected)/dashboard/page.tsx (SSR)                  │
│   getAdminOrders + getActiveStoreSession                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ props: orders[], initialActiveStoreSession
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ admin-dashboard-orders.tsx (CLIENT CONTAINER ~2486 LOC)         │
│                                                                 │
│  State: optimisticOrders, activeFilter, searchQuery, modal,     │
│         session, sync, newArrival, presence, pending mutations  │
│                                                                 │
│  Hooks: useAdminOrdersRealtime                                  │
│         useAdminStoreSessionRealtime                            │
│         useAdminPresence                                        │
│                                                                 │
│  Derived: visibleOperationalOrders → filteredOrders →            │
│           groupedOrders | list view                             │
│                                                                 │
│  Renders:                                                       │
│    DashboardOverview / MobileOverview (top — out of board scope)│
│    DashboardToolbar (closed — integration only)                 │
│    execution-flow: Kanban | list | empty states                 │
│    DashboardContextPanel (always)                               │
│    AdminOrderWorkspaceModal (dynamic)                           │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
  DashboardKanbanBoard          DashboardContextPanel
  + LaneNavigationScanning      + OperationalSummaryStrip
  + OrderCard[]                 + BusinessInsightsStrip
                                + OperationalFeed
```

### Container vs presentational

| Capa | Componentes | Responsabilidad |
|------|-------------|-----------------|
| **Container** | `admin-dashboard-orders.tsx` | Estado, realtime, recovery, routing, derivaciones, render condicional |
| **Presentational board** | `DashboardKanbanBoard`, `OrderCard`, `LaneNavigationScanning`, `LaneMetricsLayer` | Render puro con props |
| **Presentational context** | `DashboardContextPanel` + strips | Render puro; data ya derivada |
| **Semi-container** | `order-card-quick-actions.tsx` | Optimistic + server action inline |

`admin-dashboard-orders.tsx` **mezcla** container, view-model derivations, side effects (audio, notifications, scroll), session management y layout — **demasiado grande** para mantenimiento seguro.

---

## Mapa de flujo de datos

### Flujo principal

```txt
SSR page
  → getAdminOrders(businessId)
  → AdminOrderDashboardItem[]
  → props.orders

Client mount
  → useState(optimisticOrders) synced from props via useEffect
  → getOperationalWindow(activeStoreSessionState)
  → visibleOperationalOrders (day/session scope)

Toolbar filter (URL ?filter=)
  → activeFilter
  → baseFilteredOrders (status | delivery_method)

Toolbar search
  → searchQuery → parseOperationalSearch
  → matchesOperationalSearch
  → filteredOrders

activeFilter === "all"
  → groupedOrders (GROUP_ORDER: pending→cancelled, non-empty lanes)
  → DashboardKanbanBoard

activeFilter !== "all"
  → filteredOrders list + LaneMetricsLayer

Card action / quick action
  → optimistic patch + markPendingMutation
  → updateOrderStatusAction (server)
  → rollback | finalize | conflict refresh

Card click
  → openOrder → pushState ?order=id
  → AdminOrderWorkspaceModal
```

### Flujo realtime

```txt
Supabase channel admin-orders:{businessId}
  → INSERT → fetchDashboardOrderSummary → insertRealtimeOrderIntoState
           → new order UX (sound/toast/highlight) if visible

  → UPDATE → pending mutation check (hook)
           → if echo: ignore
           → if external during pending: suppress + store externalStatus
           → else: fetchDashboardOrderSummary (preferred)
                   or patchDashboardOrderFromRealtime (fallback)

Recovery (parent watches realtimeStatus)
  → reconnect | visibility | online
  → refreshOrdersSilently (cooldown 5s, guards)

Conflict settle
  → resolvePendingMutation.needsRefresh
  → refreshOrdersSilently("conflict")
```

### Flujo manual operational sync (T4.7)

```txt
Toolbar sync click
  → handleManualOperationalResync
  → offline guard
  → hydrateStoreSession("manual-resync")
  → refreshOrdersSilently("manual-operational-resync")  [bypass cooldown]
  → GET /admin/dashboard/orders
  → reconcile with pending mutations
  → setOptimisticOrders
  → UI convergence (no router.refresh for orders)
```

---

## SSR / Initial Load

**Archivo:** `app/admin/(protected)/dashboard/page.tsx`

| Dato | Fuente |
|------|--------|
| `orders` | `getAdminOrders(businessId)` |
| `initialActiveStoreSession` | `getActiveStoreSession(businessId)` |
| Permisos / prefs | `requireAdminContext()` |

El container inicializa `optimisticOrders` desde props y re-sincroniza en `useEffect([orders])` — **reemplazo completo** al cambiar SSR props (p. ej. `router.refresh()` de sesión).

**Riesgo:** flash o pérdida de estado optimista local si SSR refresh ocurre durante mutación pendiente (mitigado parcialmente por pending-mutation en silent refresh).

---

## Client State

### Fuente de verdad operativa

| Estado | Fuente de verdad | Notas |
|--------|------------------|-------|
| Lista de pedidos en board | `optimisticOrders` | Autoritativa en client; reconciliada por silent refresh |
| Filtro activo | URL `?filter=` + `activeFilter` state | Sync bidireccional |
| Búsqueda | `searchQuery` local | **No** en URL |
| Sesión activa | `activeStoreSessionState` | Hydration + open/close + realtime |
| Modal abierto | `selectedOrderId` + URL `?order=` | popstate sync parcial (order id, no filter) |
| Pending status mutation | `pendingMutationsRef` en realtime hook | TTL 8s |

### Transformaciones clave

```typescript
// Scope operativo (jornada vs sesión)
visibleOperationalOrders = getOrdersInOperationalWindow(optimisticOrders, operationalWindow)

// Filtro toolbar
baseFilteredOrders = filter by activeFilter

// Search
filteredOrders = matchesOperationalSearch(baseFilteredOrders, parsedSearchQuery)

// Kanban grouping (solo filter=all)
groupedOrders = GROUP_ORDER.map(status).filter(nonEmpty)
```

---

## Search / Filters Integration

| Control | Afecta | No afecta |
|---------|--------|-----------|
| `activeFilter` | `baseFilteredOrders`, kanban vs list, URL | Top section KPIs (usa `visibleOperationalOrders`) |
| `searchQuery` | `filteredOrders`, context panel derivations | URL, session |
| Manual sync T4.7 | Re-fetch orders + session | No resetea search/filter |
| Session open/close | `operationalWindow` → scope de `visibleOperationalOrders` | No cambia filter URL |

**Hallazgo:** context panel (summaries, insights, feed) deriva de **`filteredOrders`**, no de scope completo — al buscar/filtrar, el context panel refleja la vista filtrada, no el día/sesión completo.

---

## Lanes / Workflow

### Definición actual

| Lane | Origen | Visible en kanban |
|------|--------|-------------------|
| Pendientes | `status === "pending"` | Sí |
| Preparando | `status === "preparing"` | Sí |
| Listos | `status === "ready"` | Sí |
| Completados | `status === "completed"` | Sí (si hay pedidos) |
| Cancelados | `status === "cancelled"` | Sí (si hay pedidos) |

Hardcoded en `GROUP_ORDER` / `GROUP_LABELS` en `admin-dashboard-orders.tsx`.

### Filtros toolbar vs lanes

| Filtro | Comportamiento board |
|--------|---------------------|
| Todos | Kanban multi-lane |
| Pendientes/Preparando/Listos | Lista filtrada + lane metrics |
| Delivery/Retiro | Lista por `delivery_method` |

**No hay duplicación de pedidos entre lanes** — cada pedido tiene un solo `status`; grouping es exclusivo.

### Estados del flujo (lane navigation)

- `LaneNavigationScanning` renderiza jump buttons con `IntersectionObserver`
- En **empty global/day-scope**, se renderiza shell vacío con header **"Estados del flujo"** — **redundante** con empty copy debajo
- Componentes alternativos `DeliveryWorkflowLanes` / `PriorityRiskLanes` existen pero **no están cableados**

---

## Order Cards

### Datos mostrados (`order-card.tsx`)

- Delivery method, delivery date, notes flag, chip "Nuevo"
- `item_summary`, customer short name, item count, notes preview
- Assignment label (self/unassigned/other)
- Risk badge
- Last activity (active orders)
- Operational timeline steps
- Status badge, total price, "Ver pedido"

### Quick actions (`order-card-quick-actions.tsx`)

| Status | Acciones |
|--------|----------|
| pending | Preparar / Cancelar |
| preparing | Marcar listo / Completar |
| ready | Completar |
| completed/cancelled | Ninguna |

Flujo: optimistic → `updateOrderStatusAction` → rollback/settle.

### Memoización

Custom `areOrderCardPropsEqual` — evita re-renders si campos card-relevantes no cambian.

### Accesibilidad card

- `role="button"`, `tabIndex={0}`, Enter/Space via `onCardKeyDown`
- Timeline con `aria-label="Progreso operacional del pedido"`
- Quick action buttons — dependen de `Button` component (focus-visible vía UI kit)

---

## Empty State

### Tres niveles

| Boolean | Condición | UI |
|---------|-----------|-----|
| `isOperationalEmpty` | `optimisticOrders.length === 0` | Lane nav empty + "Todavia no hay pedidos" |
| `isDayScopeEmpty` | Hay orders pero fuera de window/session | Mismo shell + copy sesión/jornada |
| `isFilteredEmpty` | Scope OK pero filter/search vacío | `dashboard-filters` empty block |

### Render decision

```txt
isOperationalEmpty || isDayScopeEmpty → renderOperationalEmptyState()
isFilteredEmpty → renderFilteredEmptyState()
else activeFilter === "all" → DashboardKanbanBoard
else → filtered list
```

**Problema UX:** empty operacional incluye **Estados del flujo** nav vacío — redundante (deuda heredada T8/T10).

---

## Context Panel

**Siempre montado** — incluso cuando board está empty.

Compone:

1. `OperationalSummaryStrip` — KPIs derivados de `filteredOrders`
2. `BusinessInsightsStrip` — micro-insights con links a pedidos
3. `OperationalFeed` — actividad reciente

Data source: **`filteredOrders`** + métricas derivadas — **cambia con search/filter**.

**Problemas:**

- Visualmente separado del execution flow (CSS `contextSection` en grid aparte)
- En empty global, strips pueden quedar vacíos/sparse
- Tablet/mobile: layout context puede sentirse débil (breakpoints en `admin-dashboard-orders.module.css` 720/769/1024/1200/1440)

---

## Realtime

### Eventos escuchados

| Evento | Tabla | Handler |
|--------|-------|---------|
| INSERT | `orders` | `onOrderInsert` → summary fetch |
| UPDATE | `orders` | `onOrderUpdate` → pending check → summary/patch |

**DELETE: no suscrito** — pedidos eliminados/cancelados que salgan del scope no se remueven vía realtime DELETE.

### Pending mutation lock (status)

- TTL 8s (`PENDING_MUTATION_TTL_MS`)
- Echo suppression cuando `expectedStatus === row.status`
- External update during pending → stored, UPDATE suppressed until resolve
- `resolvePendingMutation` → optional `refreshOrdersSilently("conflict")`

### Recovery

| Trigger | Mechanism |
|---------|-----------|
| Realtime reconnect | `refreshOrdersSilently("reconnect")` |
| Tab visible | `refreshOrdersSilently("visibility")` |
| Browser online | `refreshOrdersSilently("online")` |
| Manual sync T4.7 | bypass all cooldowns |

Cooldown: **5s** (`REALTIME_REFRESH_COOLDOWN_MS`); insert guard **2s** for visibility refresh.

### Manual sync vs realtime

Compatible: manual resync no desactiva realtime; reconcilia vía fetch. No usa `router.refresh()` para pedidos.

---

## Hydration / Manual Refresh

### `refreshOrdersSilently` reasons

| Reason | Bypass cooldown |
|--------|-----------------|
| `reconnect` | No |
| `visibility` | No |
| `online` | No |
| `conflict` | No |
| `manual-operational-resync` | **Yes** |

Endpoint: `GET /admin/dashboard/orders` → `{ orders: AdminOrderDashboardItem[] }`

Reconciliation preserves pending optimistic status via `getPendingMutationStatus`.

### Modal abierto durante refresh

Silent refresh actualiza `selectedOrderSeed` si modal abierto — **converge** seed con server data.

---

## Optimistic Updates

| Acción | Optimistic | Pending lock | Server action |
|--------|------------|--------------|---------------|
| Status (card/modal) | Sí | Sí (`markPendingMutation`) | `updateOrderStatusAction` |
| Assignment (modal) | Sí | **No** | `updateOrderAssignmentAction` |
| Rollback | Sí | clear pending | — |

**Riesgo assignment:** realtime UPDATE de assignment puede pisar optimistic state sin el mismo lock que status.

---

## Server Actions / Routes

### Dashboard routes

| Route | Método | Retorno |
|-------|--------|---------|
| `/admin/dashboard` | SSR | HTML + initial orders |
| `/admin/dashboard/orders` | GET JSON | `{ orders }` o `{ error }` |

### Order mutations (fuera dashboard actions)

| Action | Archivo | Impacto board |
|--------|---------|---------------|
| `updateOrderStatusAction` | `orders/[id]/actions.ts` | Status change → realtime UPDATE |
| `updateOrderAssignmentAction` | `orders/[id]/actions.ts` | Assignment → realtime UPDATE |

### Session actions (toolbar integration)

| Action | Impacto board |
|--------|---------------|
| `openStoreSessionAction` / `closeStoreSessionAction` | Cambia `operationalWindow` scope |
| `getActiveStoreSessionHydrationAction` | Reconcilia session state |

Shape responses: session actions retornan `{ success, session?, error? }`; order actions retornan `{ changed?, error?, message? }` — **no unificado** pero funcional.

---

## Modal / Detail Integration

```txt
Card click / insight link / feed link
  → openOrder(order)
  → setSelectedOrderId + setSelectedOrderSeed
  → pushState ?order={id}&filter=...

AdminOrderWorkspaceModal (dynamic import, ssr: false)
  → order-workspace sections
  → status-form, assignment-controls, external-actions
  → optimistic callbacks wired to container

popstate
  → sync selectedOrderId from URL (filter via useSearchParams effect)
```

---

## CSS / Tokens

### Alineado a tokens

- `dashboard-kanban.module.css`: `var(--bg-canvas)`, `var(--bg-surface-soft)`, `var(--text-secondary)`, etc.
- `admin-dashboard-orders.module.css`: grid layout con breakpoints 720/769/1024/1200/1440

### Hardcoded (ejemplos)

| Archivo | Patrón |
|---------|--------|
| `dashboard-kanban.module.css` | `rgba(0,0,0,0.04)` shadows, `border-radius: 12px`, `min-width: 320px` |
| `dashboard-filters.module.css` | Extensive `rgba(...)` warm palette |
| `delivery-workflow-lanes.module.css` | `#382f27`, multiple rgba (component unused) |
| `dashboard-analytics-surfaces.module.css` | rgba borders |
| `order-detail-surfaces.module.css` | `rgba(9, 9, 11, 0.42)` overlay |

**Recomendación B7:** migrar módulos legacy (`dashboard-filters`, `delivery-workflow-lanes`) a tokens; kanban parcialmente alineado.

---

## Responsive Behavior

| Viewport | Comportamiento observado (CSS) |
|----------|-------------------------------|
| Desktop 1200+ | Grid context + execution; kanban horizontal scroll |
| Tablet 769–1023 | Breakpoints en `admin-dashboard-orders.module.css`; kanban `min-width: 320px` por lane → scroll horizontal |
| Mobile ≤768 | Top mobile overview visible; execution stack; lane nav sticky; cards full width en lane body |

### Riesgos responsive

- Kanban `overflow-x: auto` + `min-width: 320px` lanes — usable pero denso en 360px
- Context panel debajo del board — puede quedar lejos del flujo en mobile
- Empty state lane nav ocupa espacio vertical en mobile

---

## Accessibility

| Elemento | Estado |
|----------|--------|
| Order card keyboard | `role="button"`, tabIndex, Enter/Space |
| Lane nav | `aria-label` desde constants |
| Empty states | `aria-live="polite"` |
| Filter empty | `aria-live="polite"` |
| Quick actions | Botones nativos via `Button` |
| Risk badges | Visual + texto |
| Modal | Dynamic import; focus trap depende de modal shell (no auditado en profundidad B0) |

**Gaps:** card como `div[role=button]` vs `<button>`; quick actions dentro de card clickable — `stopPropagation` presente.

---

## Performance

### Observaciones

| Área | Evaluación |
|------|------------|
| `admin-dashboard-orders.tsx` | ~30 useMemo/useCallback — muchos **útiles**, algunos encadenados |
| Search keystroke | Re-parse + re-filter + re-risk + re-insights + re-feed **cada keystroke** |
| Risk assessment | `filteredOrders.map(assessOrderRisk)` en cada cambio de filtered set |
| Kanban | `memo(DashboardKanbanBoard)` + custom memo en `OrderCard` — **bueno** |
| Virtualización | **No** — listas completas renderizadas |
| Timers | `now` tick 60s; sync freshness 60s; new arrival 8s; pending mutation 8s TTL |
| Realtime cleanup | Channel unsubscribe en unmount — OK |

### Memory

- `newArrivalTimersRef` Map — cleanup en unmount (post DEVX-2 fix pattern)
- `pendingMutationsRef` — TTL expiry on access

**Sin virtualización:** aceptable para volúmenes SMB; riesgo con >100 pedidos activos.

---

## QA / Testing

| Tipo | Estado |
|------|--------|
| Unit tests | **No existen** |
| Integration tests | **No existen** |
| E2E | **No existen** |
| Fixture data | **No existen** |
| Manual QA checklist | Documentado en fases toolbar T4–T10; **board-specific pendiente** |

### QA mínima futura recomendada

- [ ] Status change optimistic + rollback
- [ ] Assignment optimistic + realtime race
- [ ] Realtime INSERT visible/hidden tab
- [ ] Manual sync + filter/search preserved
- [ ] Filter URL back/forward
- [ ] Mobile card quick actions touch
- [ ] Modal open during silent refresh
- [ ] Empty vs filtered empty vs day-scope empty
- [ ] Session open/close scope change on board

---

## Qué está bien

- Pipeline claro: scope → filter → search → render
- Realtime INSERT/UPDATE con pending-mutation lock para status
- Recovery multi-trigger (reconnect/visibility/online) con cooldowns sensatos
- Manual operational sync T4.7 integrado sin romper filter/search
- Tres niveles de empty state bien definidos en código
- OrderCard memoization custom reduce re-renders
- Kanban + lane nav + metrics coherentes operativamente
- Silent refresh preserva optimistic pending status
- Separación presentational en KanbanBoard/ContextPanel (aunque container es enorme)

---

## Qué está mal

- Container monolítico (~2,486 LOC) mezcla demasiadas responsabilidades
- Context panel atado a `filteredOrders` — confunde con vista global
- Empty operacional muestra "Estados del flujo" redundante
- Sin tests automatizados para flujos críticos
- Componentes alternativos de lanes (`delivery-workflow`, `priority-risk`) huérfanos
- DELETE realtime no manejado
- Assignment optimistic sin pending lock equivalente a status

---

## Riesgos principales

1. **Regresión alta** al tocar `admin-dashboard-orders.tsx` por tamaño y acoplamiento
2. **Race assignment vs realtime** sin lock
3. **Context panel misleading** bajo search/filter activo
4. **Cero tests** en realtime reconciliation y optimistic flows
5. **Mobile kanban density** con lanes 320px min

---

## Oportunidades de mejora

- Extraer view model del board (`buildDashboardBoardViewModel`)
- Separar hooks: `useDashboardOrdersState`, `useDashboardRecovery`, `useNewOrderEffects`
- Context panel con scope explícito (filtered vs operational scope)
- Ocultar lane nav en empty operacional
- Wire o delete alternate lane components
- Virtualización futura si volumen crece
- DELETE realtime handler o documentar que cancel/remove es vía UPDATE status

---

## Hallazgos P0

_Ninguno confirmado como bug crítico en producción sin QA manual con DB viva. El más cercano:_

### [P0][Realtime] Sin handler DELETE en orders realtime

**Archivo(s):**
- `components/admin/orders/use-admin-orders-realtime.ts`

**Qué pasa:**
Solo INSERT/UPDATE suscritos. Si un pedido se elimina físicamente de DB, permanece en `optimisticOrders` hasta silent refresh.

**Por qué importa:**
Operadores podrían actuar sobre pedidos fantasma.

**Evidencia:**
Channel setup lines 144–183: events INSERT + UPDATE only.

**Riesgo:**
Bajo si negocio nunca hard-deletes (solo status cancelled); **medio-alto** si hay deletes reales.

**Recomendación:**
Confirmar política DB; si no hay DELETE, documentar; si hay, handler en B6.

**Fase sugerida:** B6

---

## Hallazgos P1

### [P1][Architecture] Container monolítico admin-dashboard-orders.tsx

**Archivo(s):**
- `components/admin/orders/admin-dashboard-orders.tsx` (~2,486 LOC)

**Qué pasa:**
Un solo archivo concentra realtime, recovery, notifications, session, routing, derivaciones, renders.

**Por qué importa:**
Alto blast radius; dificulta B3–B7.

**Evidencia:**
79 imports/hooks/state/effects en un componente.

**Riesgo:**
Regresiones en cualquier cambio de board.

**Recomendación:**
Extraer view model + hooks en B2.

**Fase sugerida:** B2

---

### [P1][Optimistic UX] Assignment sin pending-mutation lock

**Archivo(s):**
- `components/admin/orders/admin-dashboard-orders.tsx` (`applyOptimisticAssignmentChange`)
- `components/admin/orders/use-admin-orders-realtime.ts`

**Qué pasa:**
Status usa `markPendingMutation`; assignment no.

**Por qué importa:**
Realtime UPDATE concurrente puede revertir assignment optimista incorrectamente.

**Evidencia:**
Pending map solo consulta `expectedStatus` en UPDATE handler.

**Riesgo:**
Confusión operador en pedidos compartidos.

**Recomendación:**
Extender lock o reconciliar en B6.

**Fase sugerida:** B6

---

### [P1][Context Panel] Derivaciones atadas a filteredOrders

**Archivo(s):**
- `components/admin/orders/admin-dashboard-orders.tsx` lines ~1540–1584
- `components/admin/orders/DashboardContextPanel.tsx`

**Qué pasa:**
Summaries, insights y feed usan `filteredOrders` (post search+filter).

**Por qué importa:**
Operador puede interpretar KPIs del board filtrado como KPIs del turno completo.

**Evidencia:**
`buildOperationalSummaries({ orders: filteredOrders, ... })`.

**Riesgo:**
Decisiones operativas basadas en subset.

**Recomendación:**
B1 contract: definir scope; B3 implementar.

**Fase sugerida:** B1, B3

---

### [P1][Empty State] Estados del flujo redundante en empty operacional

**Archivo(s):**
- `components/admin/orders/admin-dashboard-orders.tsx` `renderOperationalEmptyState`
- `components/admin/orders/lane-navigation-scanning.tsx`

**Qué pasa:**
Empty renderiza lane nav shell con header "Estados del flujo" sin lanes reales.

**Por qué importa:**
Ruido visual; deuda documentada desde T8/T10.

**Evidencia:**
Lines 2316–2337: lane nav `--empty` + emptyContext debajo.

**Riesgo:**
Confusión en onboarding.

**Recomendación:**
Ocultar nav en empty en B3.

**Fase sugerida:** B3

---

### [P1][DX/Maintainability] Cero tests automatizados

**Archivo(s):**
- Proyecto completo

**Qué pasa:**
No hay unit/integration/E2E para board flows.

**Por qué importa:**
Realtime/optimistic/recovery imposibles de validar en CI.

**Evidencia:**
No test files; `package.json` sin test runner.

**Riesgo:**
Regresiones silenciosas en B2–B9.

**Recomendación:**
Introducir tests mínimos en B6 o paralelo DEVX.

**Fase sugerida:** B6, B9

---

## Hallazgos P2

### [P2][Hydration] Dual path summary vs patch fallback

**Archivo(s):**
- `lib/orders/realtime.ts` — `patchDashboardOrderFromRealtime`
- `admin-dashboard-orders.tsx` — `fetchDashboardOrderSummary`

**Qué pasa:**
UPDATE prefiere full summary fetch; fallback patch puede omitir campos derivados server-side.

**Recomendación:**
Documentar campos; unificar en B6.

**Fase sugerida:** B6

---

### [P2][Workflow] Componentes alternativos de lanes no cableados

**Archivo(s):**
- `delivery-workflow-lanes.tsx`, `priority-risk-lanes.tsx`
- `lib/orders/delivery-workflow-lanes.ts`, `priority-risk-lanes.ts`

**Qué pasa:**
Código + CSS existen pero no se importan en dashboard.

**Recomendación:**
B4 decide IA de lanes; delete o wire.

**Fase sugerida:** B4

---

### [P2][Performance] Recálculo completo en cada keystroke de search

**Archivo(s):**
- `admin-dashboard-orders.tsx` — chain filteredOrders → metrics → risk → insights → feed

**Qué pasa:**
Sin debounce; cada tecla recompute risk/insights/feed.

**Recomendación:**
Debounce search o split derivations en B8.

**Fase sugerida:** B8

---

### [P2][Responsive] Kanban lane min-width 320px en mobile

**Archivo(s):**
- `dashboard-kanban.module.css` line 22

**Qué pasa:**
Scroll horizontal necesario; puede ser correcto pero denso.

**Recomendación:**
B7 mobile board UX review.

**Fase sugerida:** B7

---

### [P2][Context Panel] Siempre montado en empty global

**Archivo(s):**
- `admin-dashboard-orders.tsx` render — `DashboardContextPanel` outside empty branch

**Qué pasa:**
Strips vacíos/sparse cuando no hay pedidos.

**Recomendación:**
B3 integración empty + context.

**Fase sugerida:** B3

---

## Hallazgos P3

### [P3][Tokens/CSS] rgba hardcoded en módulos legacy

**Archivo(s):**
- `dashboard-filters.module.css`, `delivery-workflow-lanes.module.css`, etc.

**Recomendación:** B7 token pass.

**Fase sugerida:** B7

---

### [P3][Accessibility] Card como div role=button

**Archivo(s):**
- `order-card.tsx` lines 133–138

**Recomendación:** Evaluar `<button>` o roving tabindex en B8.

**Fase sugerida:** B8

---

### [P3][DX/Maintainability] Search no persiste en URL

**Archivo(s):**
- `admin-dashboard-orders.tsx` — `searchQuery` local only

**Recomendación:** Evaluar en B1 si es requisito producto.

**Fase sugerida:** B1

---

## Recomendación de roadmap

| Fase | Objetivo |
|------|----------|
| **B1** | Product contract: scope context panel, empty behavior, lane IA decision inputs |
| **B2** | View model boundary + hook extraction from monolith |
| **B3** | Empty + context panel integration (hide redundant lane nav, scope KPIs) |
| **B4** | Flow navigation / lanes IA (keep status kanban vs alt models) |
| **B5** | Order cards operational UX pass |
| **B6** | Realtime/hydration/optimistic hardening + tests mínimos |
| **B7** | Mobile/tablet board UX |
| **B8** | Tokens / accessibility / performance |
| **B9** | Final QA |

---

## Fases sugeridas (detalle)

### B1 — Board Product Contract & Scope Freeze
- Definir: context panel scope (filtered vs operational)
- Definir: empty states UX (sin "Estados del flujo" redundante)
- Definir: delivery/pickup vs status lanes
- Congelar integración toolbar-board

### B2 — Data Flow / View Model Boundary
- `buildDashboardBoardViewModel`
- Extraer hooks de recovery/notifications
- Reducir `admin-dashboard-orders.tsx` a wiring

### B3 — Empty + Context Panel Integration
- Unificar empty visual
- Context panel scope explícito
- Ocultar/sparse handling

### B4 — Flow Navigation / Lanes IA Decision
- Mantener kanban status vs wire/delete alt lane components

### B5 — Order Cards Operational UX Pass
- Jerarquía info, quick actions, mobile legibility

### B6 — Realtime / Hydration / Optimistic Hardening
- Assignment lock, DELETE policy, tests

### B7 — Mobile / Tablet Board UX
- Kanban density, context placement

### B8 — Tokens / Accessibility / Performance
- CSS migration, debounce search, a11y cards

### B9 — Final QA
- Checklist manual + CI gates

---

## Preguntas abiertas

1. ¿Existen hard DELETE de orders en producción o solo `status = cancelled`?
2. ¿Context panel debe reflejar vista filtrada o scope operativo completo?
3. ¿`DeliveryWorkflowLanes` / `PriorityRiskLanes` son roadmap activo o dead code?
4. ¿Volumen típico de pedidos activos justifica virtualización?
5. ¿Search debe persistir en URL como `?filter=`?
6. ¿Completed/cancelled lanes deben mostrarse por defecto en kanban o colapsarse?

---

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | **Pass** |
| `npx tsc --noEmit` | **Pass** (post-build) |
| `npm run lint` | **Pass with warnings** — 0 errors / 16 warnings (`@next/next/no-img-element`) |

No se modificó código en B0.

---

## Próxima fase recomendada

**B1 — Board Product Contract & Scope Freeze**

Definir contrato de producto para context panel scope, empty states, lane IA y límites de integración toolbar-board antes de implementar B2–B3.
