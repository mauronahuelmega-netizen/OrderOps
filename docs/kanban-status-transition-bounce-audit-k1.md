# Kanban Status Transition Bounce Audit — K1

## Objetivo

Auditar por qué al avanzar el estado de una card del kanban (ej. `pending → preparing`) la UI muestra un **bounce**: mueve al destino, vuelve brevemente al origen, y vuelve al destino. Identificar la capa que pisa el estado optimista y proponer fix para K2 — **sin cambiar código**.

## Bug observado

**Nombre:** Kanban Status Transition Bounce

**UI esperada:** la card aparece una vez en la lane destino y permanece.

**UI actual:**
```txt
Pendientes → (click Preparar) → Preparando → breve vuelta a Pendientes → Preparando
```

Patrón repetible en transiciones rápidas (`preparing → ready`, `ready → completed`).

## Contexto técnico

- Board V1.0 cerró con reconciliación optimista (B6), pending mutations en realtime hook, silent refresh con merge (`reconcileDashboardOrdersWithPendingMutations`).
- El audit previo (`board-orders-execution-area-audit.md`) ya documentó riesgo en `useEffect([orders])` sin reconciliación.
- K1 confirma el click path completo y clasifica sospechosos con evidencia de código.

**Docs leídos:** `board-orders-execution-area-v1-final-handoff.md`, `board-orders-execution-area-phase-b9-7.md`, `board-orders-execution-area-phase-b6.md`, `board-orders-execution-area-phase-c4.md`, `board-orders-execution-area-phase-c4-1.md`, `board-orders-execution-area-audit.md`.

**Docs no encontrados con nombres del prompt:** `use-dashboard-orders-realtime.ts`, `use-dashboard-orders-reconciliation.ts`, `use-dashboard-order-actions.ts` — equivalentes reales documentados abajo.

## Archivos revisados

```txt
components/admin/orders/admin-dashboard-orders.tsx
components/admin/orders/DashboardKanbanBoard.tsx
components/admin/orders/order-card.tsx
components/admin/orders/order-card-quick-actions.tsx
components/admin/orders/order-card-quick-actions.module.css
components/admin/orders/use-admin-orders-realtime.ts
components/admin/orders/use-admin-store-session-realtime.ts
components/admin/orders/use-order-workspace-hydration.ts
lib/orders/dashboard-board-view-model.ts
lib/orders/dashboard-order-reconciliation.ts
lib/orders/realtime.ts
lib/orders/admin.ts
lib/orders/workspace.ts
app/admin/(protected)/dashboard/page.tsx
app/admin/(protected)/orders/[id]/actions.ts
app/admin/(protected)/dashboard/orders/route.ts
```

## Reproducción

**Estado:** **pending** — no ejecutada en browser autenticado en esta sesión.

**Pasos recomendados:**
1. `/admin/dashboard` con sesión activa.
2. Pedido en `PENDIENTES`.
3. DevTools abierto (logs `DEBUG_REALTIME` en development).
4. Click acción rápida `Preparar`.
5. Observar lanes y correlacionar con timeline abajo.
6. Repetir `PREPARANDO → LISTOS`, `LISTOS → COMPLETADOS`.
7. Opcional: segunda tab con realtime.

**Snippets temporales sugeridos (no commiteados):**
```js
// En applyOptimisticStatusChange y useEffect([orders]):
console.debug("[K1-bounce]", { phase, orderId, status, source });
```

## Timeline observado

**Hipótesis reconstruida desde código** (pendiente confirmación visual):

```txt
T0 — SSR / props: orders[] incluye order con status=pending.
T1 — Usuario click "Preparar" en OrderCardQuickActions.
T2 — applyOptimisticStatusChange:
       markPendingStatusMutation(expected=preparing, previous=pending)
       setOptimisticOrders → status=preparing
       → groupedOrders recalcula → card en lane Preparando.
T3 — REVERT (bounce):
       props.orders cambia (típico: router.refresh() tras store-session hydration)
       useEffect([orders]) ejecuta setOptimisticOrders(orders) SIN reconcile pending
       → order vuelve status=pending en lane Pendientes.
T4 — CONVERGENCIA:
       a) finalizeOptimisticStatusChange tras updateOrderStatusAction success
          → resolvePendingMutation + patch finalStatus=preparing
       y/o b) realtime UPDATE (si pending ya cleared) → onOrderUpdate → summary/preparing
       → card vuelve a lane Preparando.
```

Si T3 no ocurre (sin `router.refresh` coincidente), bounce podría venir de `refreshOrdersSilently` post-conflict con snapshot stale **después** de `clearPendingMutation` — **POSSIBLE**, menos frecuente.

## Fuente de truth del dashboard

| Pregunta | Respuesta |
|----------|-----------|
| Fuente principal en UI | `optimisticOrders` (client state) |
| Origen inicial | SSR `getAdminOrders` → prop `orders` en `AdminDashboardOrders` |
| ¿Copia a client? | Sí: `useState(orders)` + **`useEffect([orders])` reemplazo completo** |
| ¿View model? | `buildDashboardBoardViewModel({ orders: optimisticOrders, ... })` — derivado, no segunda truth |
| ¿Múltiples estados locales? | `optimisticOrders` + `pendingMutationsRef` (Map en realtime hook, TTL 8s) + `selectedOrderSeed` |
| ¿Estado optimista separado? | No array separado; optimistic **es** patch sobre `optimisticOrders` + pending map para suppress/reconcile |

**Autoridad en client:** `optimisticOrders` para lanes. **Riesgo:** prop `orders` puede sobrescribir sin merge.

## Click path

```txt
OrderCard (onClick card → open; quick action isolated)
  → OrderCardQuickActions button type="button"
  → handleStatusAction(nextStatus)
       1. onOptimisticStatusChange(orderId, nextStatus, previousStatus)  [sync]
       2. startTransition(async () => updateOrderStatusAction(...))
       3. finally onOptimisticStatusSettled(orderId, resolution)

DashboardKanbanBoard props
  → applyOptimisticStatusChange / rollback / finalize  [admin-dashboard-orders.tsx]

Server
  → updateOrderStatusAction  [app/admin/(protected)/orders/[id]/actions.ts]
       FormData: order_id, status
       Supabase update orders.status
       createOrderEvent(status_changed)
       NO revalidatePath
```

**Siguiente status:** `resolvePrimaryStatusAction` en `order-card-quick-actions.tsx` (`pending→preparing`, etc.).

**Doble submit:** botones `type="button"`, `stopPropagation` en quick actions — **CLEARED**.

## Optimistic update path

**Archivo:** `admin-dashboard-orders.tsx` → `applyOptimisticStatusChange`

1. `markPendingMutation(orderId, nextStatus, previousStatus)` — pending map en hook realtime.
2. `setOptimisticOrders` — `patchAdminOrderDashboardItemStatus` por id.
3. Actualiza `selectedOrderSeed` si modal abierto.

**Campos actualizados:** `status`, `urgency_state`, `operational_aging`, `timeline_steps` (vía `patchAdminOrderDashboardItemStatus` en `lib/orders/workspace.ts`). No toca `updated_at` en client (no existe en dashboard item).

**Objeto completo:** sí, spread del order existente + campos derivados.

**Gap:** `useEffect([orders])` no consulta pending map al re-sync props.

## Server action path

**Action:** `updateOrderStatusAction` — **no** `revalidatePath`, **no** `router.refresh` directo.

**Retorno:** `{ success, changed, order: { id, status, assigned_to, assigned_at }, event? }` o `{ error }`.

**Latencia:** round-trip Supabase + evento timeline; durante espera UI queda en estado optimista si nada pisa `optimisticOrders`.

**Activity/timeline:** `createOrderEvent` best-effort; no invalida cache dashboard.

## Realtime path

**Hook:** `use-admin-orders-realtime.ts` — channel `admin-orders:{businessId}`, `postgres_changes` INSERT/UPDATE/DELETE en `orders`.

**UPDATE flow:**
1. `getActivePendingMutation(orderId)` — TTL 8s.
2. `shouldSuppressRealtimeUpdateForPendingMutation`:
   - echo expected status → **suppress** (no `onOrderUpdate`)
   - conflicto → suppress + guardar `externalStatus`
3. Si no suppress → `onOrderUpdate` en container.

**Container `onOrderUpdate`:**
- Prefer: `fetchDashboardOrderSummary` → `replaceRealtimeOrderInState`
- Fallback: `patchDashboardOrderFromRealtime`

**Durante pending con echo correcto:** realtime **no** mueve UI — no causa bounce directo.

**Tras `resolvePendingMutation`:** pending cleared; UPDATE ya consumido/suppressed no se re-entrega — convergencia depende de finalize o refresh.

## Hydration/reconciliation path

| Mecanismo | Reconcile pending? | Riesgo bounce |
|-----------|-------------------|---------------|
| `useEffect([orders])` línea 364–366 | **NO** | **ALTO** |
| `refreshOrdersSilently` | **SÍ** (`reconcileDashboardOrdersWithPendingMutations`) | Bajo mientras pending activo |
| `hydrateStoreSession` → `router.refresh()` | Indirecto: nuevo SSR `orders` → useEffect sin reconcile | **ALTO** si coincide con mutación |
| Store session interval/realtime | Puede disparar hydration + route refresh (throttle 2s/12s) | **MEDIO** |
| Visibility/online/reconnect refresh | Reconcile sí | Bajo |
| `finalizeOptimisticStatusChange` needsRefresh conflict | `refreshOrdersSilently("conflict")` con reconcile | Bajo en happy path |

**Código crítico:**
```tsx
// admin-dashboard-orders.tsx:364-366
useEffect(() => {
  setOptimisticOrders(sortOrdersForOperationalBoard(orders));
}, [orders]);
```

Documentado en audit: *"reemplazo completo al cambiar SSR props (p. ej. router.refresh() de sesión)"*.

**`router.refresh()` triggers:** `requestStoreSessionRouteRefresh` tras `hydrateStoreSession` con reason `realtime` o `manual-action` (throttle 12s).

**Heartbeat `now`:** interval 60s — solo re-render labels/metrics, **no** cambia status — **CLEARED**.

## View model/grouping path

```txt
optimisticOrders
  → buildDashboardBoardViewModel
  → visibleOperationalOrders (operational window)
  → filteredOrders (filter + search)
  → groupedOrders (lanes por status)
  → DashboardKanbanBoard
```

Memoizado con `[optimisticOrders, activeFilter, searchQuery, operationalWindow, now, currentUserId]`.

**Flicker:** si `optimisticOrders` bounce, lanes bounce — no hay segunda agrupación.

**Render mode:** kanban cuando `activeFilter === "all"`; search/filter no duplican estado de status.

## Double invocation audit

| Check | Resultado |
|-------|-----------|
| onClick + formAction duplicado | **CLEARED** — solo button onClick |
| Card click + quick action | **CLEARED** — stopPropagation |
| React Strict Mode doble server action | **UNLIKELY** en prod; dev podría duplicar effects mount, no patrón bounce triple |
| Doble realtime UPDATE | **POSSIBLE** pero suppress en pending; no explica vuelta a **previous** status sin stale snapshot |

## Session/review mode audit

- `canMutateOrdersInScope` bloquea optimistic en review mode (toast).
- Status change **no** dispara `hydrateStoreSession` directamente.
- Store session realtime **sí** puede correr en paralelo (independiente de orders table).
- Scope operativo (`operationalWindow`) no re-fetch orders en status click.

## Estado ownership map

| Capa | Archivo | Estado que maneja | Cuándo escribe | Riesgo pisar optimistic |
|------|---------|-------------------|----------------|-----------------------------|
| Server snapshot | `dashboard/page.tsx` + `getAdminOrders` | `orders` prop SSR | render / `router.refresh()` | **Alto** (vía useEffect) |
| Client list truth | `admin-dashboard-orders.tsx` | `optimisticOrders` | optimistic, realtime, refresh | Medio |
| Props sync | `admin-dashboard-orders.tsx:364-366` | reemplaza `optimisticOrders` | `orders` prop change | **Alto** |
| Pending guard | `use-admin-orders-realtime.ts` | `pendingMutationsRef` | click / settle / TTL | Bajo (protege realtime & silent refresh) |
| Optimistic patch | `applyOptimisticStatusChange` | status en array | click sync | Bajo |
| Settle | `finalizeOptimisticStatusChange` | status final | post server action | Bajo (mismo destino) |
| Realtime UPDATE | `use-admin-orders-realtime.ts` | suppress/apply | DB event | Bajo durante pending |
| Realtime apply | `onOrderUpdate` + `realtime.ts` | merge order | post-suppress | Medio post-settle |
| Silent refresh | `refreshOrdersSilently` | array reconciliado | reconnect/visibility/conflict/manual | Bajo con pending |
| View model | `dashboard-board-view-model.ts` | `groupedOrders` | derive render | Ninguno (read-only) |

## Sospechosos clasificados

### CONFIRMED

- **`useEffect([orders])` reemplazo total sin `reconcileDashboardOrdersWithPendingMutations`** — evidencia líneas 364–366; audit previo línea 280–282.

### LIKELY

- **`router.refresh()` por store-session hydration** durante mutación in-flight → SSR `orders` stale (status anterior) → dispara useEffect → bounce.
- **Secuencia optimistic → stale SSR → finalize/realtime** explica patrón triple observado.

### POSSIBLE

- **`refreshOrdersSilently` tras `needsRefresh`** si pending ya cleared y payload/server lag devuelve status viejo brevemente.
- **`fetchDashboardOrderSummary` stale** en `onOrderUpdate` si corre post-clear con read replica lag.
- **Coincidencia temporal** con store session realtime hydration (throttle 2s) en mismo window del click.

### UNLIKELY

- Realtime echo durante pending (está suppressed).
- Double click / form submit.
- View model re-group independiente.
- Heartbeat `now` interval.

### CLEARED

- `updateOrderStatusAction` no llama `revalidatePath`.
- Quick actions no duplican eventos.
- `refreshOrdersSilently` **sí** reconcilia pending (B6) — no es la vía del bounce si pending activo.
- React Strict Mode como causa principal del patrón en producción.

## Hallazgo principal

El bounce parece causado por **dos fuentes de truth compitiendo**: el patch optimista en `optimisticOrders` y el **re-sync ciego** del prop SSR `orders` vía `useEffect([orders])`, que **no** aplica `reconcileDashboardOrdersWithPendingMutations` a diferencia de `refreshOrdersSilently`. Cuando `orders` cambia mientras hay mutación pendiente (típicamente por `router.refresh()` de hidratación de sesión), la UI revierte al status del snapshot server (viejo), y luego converge por `finalizeOptimisticStatusChange` y/o realtime.

## Evidencia

1. `useEffect([orders])` — reemplazo sin reconcile (admin-dashboard-orders.tsx:364–366).
2. Audit B0/B6 documenta riesgo explícito de flash al refresh SSR durante mutación.
3. `refreshOrdersSilently` usa reconcile — paridad **no** aplicada al sync de props.
4. `updateOrderStatusAction` no revalida dashboard — bounce requiere otra vía de actualización de `orders` prop → `router.refresh()` encaja.
5. Pending mutation protege realtime y silent refresh pero **no** el useEffect de props.

## Riesgos

- Fix K2 que solo parchee realtime sin tocar `useEffect([orders])` **no** cerrará el bounce.
- `router.refresh()` necesario para sesión — no eliminar sin estrategia de merge.
- Órdenes con status+assignment pending simultáneo amplifican ventana de conflicto (B6 doc).

## Qué NO se cambió

- UI/visual
- server actions
- realtime
- hydration
- optimistic callbacks
- DB/schema
- Supabase policies
- dashboard layout
- order cards

## Recomendación K2

### Opción 1 (recomendada): Unificar reconcile en sync de props

**Cambio:** En `useEffect([orders])`, usar:
```ts
reconcileDashboardOrdersWithPendingMutations(orders, getPendingMutationPatch)
```
antes de `setOptimisticOrders`.

| | |
|--|--|
| Pros | Mínimo diff; alinea con B6 silent refresh; pending map ya existe |
| Riesgos | `getPendingMutationPatch` debe estar estable en deps; edge case TTL expired |
| Archivos | `admin-dashboard-orders.tsx` |
| Aceptación | Click `pending→preparing` sin vuelta a pending con `router.refresh` forzado en dev |

### Opción 2: Skip prop sync mientras pending activo

**Cambio:** Si `pendingMutationsRef` tiene entries, ignorar o diff-merge `orders` prop.

| Pros | Evita overwrite explícito |
| Riesgos | Props SSR pueden traer datos no-status (nuevos pedidos); skip total pierde inserts |
| Archivos | `admin-dashboard-orders.tsx` |
| Aceptación | Sin bounce; nuevos pedidos SSR durante pending deben seguir entrando por realtime |

### Opción 3: Version/timestamp guard

**Cambio:** `optimisticVersion` por orderId; rechazar snapshots más viejos.

| Pros | Generalizable |
| Riesgos | Requiere campo confiable (`updated_at` en dashboard item hoy no usado en patch) |
| Archivos | `lib/orders/admin.ts`, reconciliation, container |
| Aceptación | Snapshot stale nunca mueve lane backwards |

### Opción 4: Reducir `router.refresh()` en hydration

**Cambio:** Confiar en client session state + silent refresh para orders.

| Pros | Menos SSR churn |
| Riesgos | Desync session metadata; regresión C2/C4 |
| Archivos | `admin-dashboard-orders.tsx`, store session hooks |
| Aceptación | Menos refreshes sin perder copy review mode |

### Opción 5: Server action response apply before cualquier refresh

**Cambio:** Tras `updateOrderStatusAction`, patch local desde `result.order` antes de settle.

| Pros | Convergencia más rápida |
| Riesgos | No evita bounce si useEffect corre entre optimistic y response |
| Archivos | `order-card-quick-actions.tsx` o container |
| Aceptación | Complemento a Opción 1, no sustituto |

**K2 sugerida:** **Opción 1** como fix principal + **Opción 5** como endurecimiento. Instrumentar en K2 QA el timeline T0–T4 con logs temporales.

## Archivos probables para K2

```txt
components/admin/orders/admin-dashboard-orders.tsx          [principal]
lib/orders/dashboard-order-reconciliation.ts               [si extender helpers]
components/admin/orders/use-admin-orders-realtime.ts       [solo si ajustar TTL/clear timing]
docs/kanban-status-transition-bounce-fix-k2.md             [nuevo]
```

## Validaciones ejecutadas

**No ejecutadas** — fase doc-only; ningún archivo de código modificado.

## QA manual recomendado para K2

1. Reproducir bounce **antes** de fix (baseline video).
2. Aplicar fix Opción 1.
3. Click `pending→preparing→ready→completed` — sin bounce.
4. Forzar `router.refresh()` durante mutación (dev) — sin revert.
5. Silent refresh / reconnect con pending activo — sin revert.
6. Segunda tab realtime — convergencia única.
7. Review mode — sin mutación (regresión).
8. Assignment quick action — misma protección.

---

**Audit date:** 2026-06-06 (K1)  
**Related:** `board-orders-execution-area-phase-b6.md`, `board-orders-execution-area-audit.md`
