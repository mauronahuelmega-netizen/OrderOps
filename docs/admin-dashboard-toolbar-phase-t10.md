# Admin Dashboard Toolbar Phase T10 — Final QA

## Objetivo

Cerrar oficialmente el bloque **Dashboard Execution Toolbar** con matriz QA final, validaciones técnicas y documentación de deuda no bloqueante.

## Contexto

Bloque completado en fases:

| Fase | Entrega |
|------|---------|
| T4.2 | Scope label redundante removido del title cluster |
| T4.3 | Sync icon-only + dot de estado |
| T4.4 | Open/close contra `store_sessions` real |
| T4.5 | QA estático session/sync (manual browser pendiente) |
| T4.6 | Offline / stale / error en sync operativo |
| T4.7 | Manual resync = hydrate session + refresh pedidos |
| T4.8 | IA desktop: `operationalRow` + `viewControlsRow` |
| T8 | Mobile/tablet alignment |
| T9 | Cleanup: naming operativo, estado muerto removido |

## Archivos modificados

- Ninguno (T10 no encontró bugs bloqueantes).

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t10.md`

## QA scope

- **In scope:** toolbar en `/admin/dashboard` — layout, search, filtros, sesión, sync manual/offline, no regresión del bloque execution chrome.
- **Out of scope:** Board Area (`Estados del flujo`, empty/context, KPIs polish), order cards/modal, server actions, DB, realtime architecture.

**Metodología T10:**

1. Auditoría estática de código contra contrato de fases T4.2–T9.
2. Revisión CSS responsive (breakpoints T8 / desktop T4.8).
3. Trazado handlers: open/close, manual operational resync, offline guards, URL filter sync.
4. Validaciones `npm run build`, `npx tsc --noEmit`, `npm run lint`.
5. Intento de QA visual en browser (`localhost:3001`) — **no completado** (error de conexión / auth requerida).

---

## Final QA matrix

| Área | Estado | Notas |
|------|--------|-------|
| Desktop layout | **Partial** | Código + CSS T4.8 verificados; QA visual 1366–1920px **Pending manual QA** |
| Mobile layout | **Partial** | CSS T8 verificado (search order:1, sync 2.75rem); **Pending manual QA** 360–430px |
| Tablet layout | **Partial** | Breakpoints 769–920 stack, 769+ grid; **Pending manual QA** iPad Mini |
| Search | **Pass** | Placeholder, parser, clear, filtrado local verificados en código |
| Filters | **Pass** | 6 filtros, URL `?filter=`, combina con search; sync vía `urlFilter` effect |
| Session open/close | **Partial** | Wiring T4.4 verificado; **Pending manual QA** con DB viva |
| Manual operational sync | **Pass** | Código: hydrate + fetch orders, combined success, sin reload |
| Offline sync | **Pass** | State machine T4.6 verificada; **Pending manual QA** DevTools offline |
| Realtime | **Partial** | Hook activo; manual sync no reemplaza realtime; **Pending manual QA** multi-tab |
| No regression | **Partial** | Sin cambios T10; Board Area debt documentada; **Pending manual QA** visual |

---

## Desktop QA

**Verificado (código + CSS ≥1200px):**

- [x] Arquitectura T4.8: `operationalRow` + `viewControlsRow`.
- [x] Fila 1: `Pedidos en curso` (`titleCluster`) + `sessionCluster` (`justify-content: flex-end`).
- [x] Fila 2: grid `minmax(0,1fr) | minmax(18rem,28rem)` — filtros izquierda, search derecha.
- [x] `overflow-x: clip` en `.toolbar`.
- [x] Sync icon 2rem desktop, compacto, `flex-shrink: 0`.
- [x] Sin clases legacy (`primaryRow`, `scopeIndicator`, etc.).

**Pending manual QA:**

- [ ] Confirmación visual en 1366 / 1440 / 1536 / 1920px.
- [ ] Session cluster sin wrapping raro con label largo.
- [ ] Touch/click targets en entorno real.

---

## Mobile QA

**Verificado (código + CSS ≤768px):**

- [x] `operationalRow` columna; título 1.25rem full width.
- [x] `sessionCluster` debajo del título; botón 2.75rem; sync 2.75rem (44px).
- [x] `searchCluster` `order: 1`, full width.
- [x] `filterCluster` `order: 2`, scroll horizontal, scrollbar oculto.
- [x] Search field min-height 2.75rem (`operational-search.module.css`).
- [x] Placeholder: `Buscar por cliente, estado o situación...`.

**Pending manual QA:**

- [ ] Galaxy A51/A71 (~360–412px): overflow horizontal de página, sidebar/nav, top section.
- [ ] Active filter visible al scroll horizontal.
- [ ] Placeholder truncado en viewport muy angosto.

---

## Tablet QA

**Verificado (código + CSS 769–1199px):**

- [x] Fila 1 row con session wrap (`flex-wrap` en 769–920).
- [x] 769–920: view controls en columna; search arriba (`order: 1`), filtros abajo.
- [x] 921–1199: grid filtros + search (16–22rem).
- [x] Touch targets tablet: session 2.5rem, sync 2.25rem, filtros 2.375rem.

**Pending manual QA:**

- [ ] iPad Mini portrait/landscape.
- [ ] Context panel débil — documentado como Board Area debt, no corregido.

---

## Search QA

**Verificado (código):**

| Check | Evidencia |
|-------|-----------|
| Placeholder correcto | `DASHBOARD_EXECUTION_SEARCH_PLACEHOLDER` en view model |
| Input acepta texto | `OperationalSearch` → `onSearchChange` → `setSearchQuery` |
| Clear funciona | Botón `Limpiar` → `onChange("")` |
| Filtra tablero | `filteredOrders` usa `matchesOperationalSearch` sobre `baseFilteredOrders` |
| No resetea sesión | `searchQuery` independiente de `activeStoreSessionState` |
| No resetea filtros | Search no modifica `activeFilter` |
| No rompe URL filter | `buildDashboardHref` preserva `filter` param |
| No afecta top section | `dashboardTopSectionViewModel` deriva de `visibleOperationalOrders`, no de `searchQuery` |
| Empty state filtrado | `isFilteredEmpty` + `renderFilteredEmptyState` cuando search/filter vacío |

**Pending manual QA:** interacción en browser con pedidos reales.

---

## Filters QA

**Verificado (código):**

| Filtro | Label | Lógica |
|--------|-------|--------|
| all | Todos | `visibleOperationalOrders` |
| pending | Pendientes | `order.status === "pending"` |
| preparing | Preparando | `order.status === "preparing"` |
| ready | Listos | `order.status === "ready"` |
| delivery | Delivery | `delivery_method === "delivery"` |
| pickup | Retiro | `delivery_method === "pickup"` |

| Check | Evidencia |
|-------|-----------|
| Active state | `aria-pressed`, `filterButtonActive`, variant primary |
| URL `?filter=` | `handleFilterChange` → `router.replace(buildDashboardHref(...))` |
| Back/forward | `useSearchParams` → `urlFilter` → effect sincroniza `activeFilter` |
| Search + filter | `baseFilteredOrders` luego `matchesOperationalSearch` |
| Mobile scroll | `.filterCluster` `overflow-x: auto`, botones `flex-shrink: 0` |
| Sin duplicados | Un solo `filterCluster` en `DashboardToolbar` |
| Top section | KPIs usan `visibleOperationalOrders` / day scope, no `activeFilter` del toolbar compact |

**Pending manual QA:** back/forward en browser, scroll + click en mobile.

---

## Session open/close QA

**Verificado (código — T4.4):**

### Sin sesión

- [x] `hasActiveStoreSession === false` → `sessionStatusLabel = "Sin sesión activa"`.
- [x] Botón `"Abrir sesión"`.
- [x] Sync visible si `showSessionControls`.

### Abrir sesión

- [x] `openStoreSessionAction()` (no `toggleBusinessStatus`).
- [x] Pending `"Abriendo..."`.
- [x] Success: `setActiveStoreSessionState(result.session)` sin F5.
- [x] Label: `formatSessionStartLabel` vía `operationalWindow.source === "store-session"`.
- [x] Post: `hydrateStoreSession("manual-action")`.

### Cerrar sesión

- [x] Confirm si `hasActiveOrdersInProgress`.
- [x] `closeStoreSessionAction(sessionId)`.
- [x] Pending `"Cerrando..."`.
- [x] Success: `setActiveStoreSessionState(null)`.

### Reload

- [x] `initialActiveStoreSession` desde SSR + `useEffect` sync.

**Pending manual QA:**

- [ ] Click real abrir/cerrar con Supabase.
- [ ] Top section alineado con toolbar en cada transición.
- [ ] Hard reload conserva estado.
- [ ] Consola sin errores.

---

## Manual operational sync QA

**Verificado (código — T4.7):**

```txt
handleManualOperationalResync:
  offline guard → setOperationalSyncError("offline") → return
  setIsManualOperationalResyncing(true) → syncState "syncing"
  sessionOk = hydrateStoreSession("manual-resync")  // bypass throttle
  ordersOk = refreshOrdersSilently("manual-operational-resync")  // bypass cooldown
  success only if sessionOk && ordersOk
  setLastSuccessfulOperationalSyncedAt on success
  finally: setIsManualOperationalResyncing(false)
```

| Check | Resultado |
|-------|-----------|
| No `window.location.reload` | Confirmado |
| No `router.refresh()` en manual resync | Confirmado (solo fetch `/admin/dashboard/orders`) |
| Combined failure → error | `OPERATIONAL_SYNC_FAILURE_MESSAGE` |
| No reset search/filtros | Handler no toca `searchQuery` ni `activeFilter` |
| Syncing disables button | `disabled={viewModel.isOperationalSyncing}` |

**Pending manual QA:** click con sesión real, modal abierto, verificar no duplicación de pedidos.

---

## Offline sync QA

**Verificado (código — T4.6):**

| Check | Evidencia |
|-------|-----------|
| Offline → `syncState = offline` | `!isOnline` primera prioridad en view model |
| Icono `RefreshCwOff` | `syncIcon === "refresh-off"` para offline/error/stale |
| Tooltip offline | `"Sin conexión. Volvé a conectarte para sincronizar."` |
| Click offline no requests | Guard en handler + `hydrateStoreSession` checks `navigator.onLine` |
| Click offline no falso synced | Setea `operationalSyncError = "offline"`, no limpia a synced |
| Reconnect no auto manual sync | No handler automático en `online` event para operational resync |
| Reconnect state | Limpia error offline; si >5min sin sync → `stale`, no auto-fetch operativo |

**Pending manual QA:** DevTools offline/online cycle visual.

---

## Realtime QA

**Verificado (código):**

- [x] `useAdminOrdersRealtime` activo en container.
- [x] `refreshOrdersSilently` usado para recovery (reconnect, visibility, online) — separado de manual sync.
- [x] Manual resync usa reason `"manual-operational-resync"` con bypass cooldown — no crea polling.
- [x] Optimistic updates vía `applyOptimisticStatusChange` — manual resync no resetea `optimisticOrders` directamente; fetch merge vía response handler.

**Pending manual QA:**

- [ ] Crear/cambiar pedido en otra pestaña.
- [ ] Confirmar convergencia realtime sin depender de sync manual.

---

## No regression QA

**Verificado (código — sin modificaciones T10):**

- [x] Toolbar scope limitado a `DashboardToolbar` + execution chrome wrapper.
- [x] No imports/cambios en `DashboardKanbanBoard`, `DashboardContextPanel`, `order-card`, modal.
- [x] `Estados del flujo` en `lane-navigation-scanning` — untouched.
- [x] Empty/context en `renderOperationalEmptyState` — untouched.
- [x] Top section: `DashboardOverview` / `DashboardMobileOverview` — untouched.

**Pending manual QA:** inspección visual sidebar, theme toggle, audio unlock.

---

## Bugs found

Ningún bug bloqueante identificado en auditoría estática T10.

Observaciones no bloqueantes:

1. **QA manual browser nunca ejecutado end-to-end** en este entorno (auth + DB viva) — heredado desde T4.5/T8.
2. **Tablet 921–1199px** puede sentirse apretado con filtros + search en una fila (documentado en T8).
3. **Session label mobile** usa ellipsis — timestamp puede truncarse en viewport muy angosto.

---

## Fixes applied

Ninguno. T10 no modificó código.

---

## Known non-blocking debt

| Deuda | Origen | Acción |
|-------|--------|--------|
| QA manual browser completo | T4.5, T8, T10 | Épica QA ops o T10 follow-up con credenciales |
| ESLint no configurado | Proyecto | Setup ESLint fuera de toolbar |
| Docs forenses desactualizados | Pre-T4.4 | Referencia histórica; runtime correcto |
| `scopeLabel` en view model sin render | T4.2/T9 | Futuro scope/jornada |
| Tablet landscape apretado 921–1199 | T8 | Board/toolbar polish futuro si aplica |

---

## Board Area debt moved out of toolbar

- **Estados del flujo** redundante en empty state (`lane-navigation-scanning` + empty copy).
- **Empty/context panel** integración pendiente en mobile/tablet.
- **Resumen operativo / actividad reciente** pueden requerir layout propio en épica Board.
- **Context panel** débil en tablet — no corregido en toolbar T10.

Board Area queda fuera del toolbar cleanup y se abordará en épica separada: **Board / Orders Execution Area**.

---

## What was preserved

- Desktop T4.8
- Mobile/tablet T8
- Cleanup T9
- Manual operational resync T4.7
- Offline-aware sync T4.6
- open/close session T4.4
- search behavior T5
- filter URL sync
- realtime
- optimistic UX

---

## What was intentionally not changed

- DB/Supabase
- server actions
- realtime architecture
- search parser
- filters logic
- URL sync
- Estados del flujo
- empty/context
- top section
- order cards/modal
- audio unlock
- theme bootstrap

---

## Validations executed

| Comando | Resultado |
|---------|-----------|
| `npm run build` | **Pass** |
| `npx tsc --noEmit` | **Pass** (ejecutado post-build) |
| `npm run lint` | **No configurado** — `next lint` abre setup interactivo ESLint |

---

## Final verdict

**Accepted with non-blocking debt**

El bloque **Dashboard Execution Toolbar** cumple contrato técnico T4.2–T9 verificado por auditoría estática y build/typecheck. No se encontraron bugs bloqueantes que justifiquen cambios de código en T10.

La deuda principal es **QA manual browser pendiente** (layout responsive, session/sync con DB viva, realtime multi-tab) y **Board Area visual** explícitamente fuera de scope.

---

## Next recommended phase

**Board / Orders Execution Area** — épica separada para:

- `Estados del flujo` vs empty state
- Context panel mobile/tablet
- Resumen operativo / actividad reciente
- QA manual end-to-end del dashboard completo

Opcional previo: ejecutar checklist manual T10 con sesión autenticada y documentar pass/fail por viewport.
