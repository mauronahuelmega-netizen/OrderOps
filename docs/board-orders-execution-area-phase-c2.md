# Board / Orders Execution Area — Phase C2 — Last Closed Session Review Mode

## Objetivo

Mantener lectura de rendimiento de la última sesión operativa cerrada después de cerrar sesión, sin borrar KPIs/insights/board al volver a jornada vacía.

## Contexto

C1b corrigió scope puntual (queue pressure, close guard, copy). C1a/C1b documentaron que al cerrar sesión el dashboard caía a `business-window` y métricas podían ir a cero.

## Problema detectado

Al cerrar sesión activa, `getOperationalWindow` pasaba a jornada calendario (`business-window`). Si la sesión cruzaba medianoche o no había pedidos “hoy”, KPIs/insights/board quedaban vacíos aunque el turno recién cerrado tuvo actividad.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/store-sessions/admin.ts` | `getLastClosedStoreSession` |
| `lib/orders/analytics.ts` | `last-closed-store-session` source, scope copy helpers, window resolver |
| `app/admin/(protected)/dashboard/actions.ts` | Hydration retorna `lastClosedSession` |
| `app/admin/(protected)/dashboard/page.tsx` | SSR `initialLastClosedStoreSession` |
| `components/admin/orders/admin-dashboard-orders.tsx` | State, hydration, close/open transitions, labels |
| `components/admin/orders/use-admin-store-session-realtime.ts` | Fallback realtime para sesión cerrada |
| `lib/orders/dashboard-top-section-view-model.ts` | Copy por scope kind |
| `lib/orders/business-insights.ts` | `analyticsScopeKind` |
| `lib/orders/dashboard-board-view-model.ts` | Context label última sesión cerrada |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-c2.md` | Este documento |

## Decisión de producto aplicada

Cerrar sesión detiene la operación activa, pero mantiene la lectura de la última sesión cerrada para revisar caja/rendimiento.

## Scope resolution

```txt
active session > last closed session > business window fallback
```

`getOperationalWindow(now, config, activeStoreSession, lastClosedStoreSession)`:

| Prioridad | Source | Window |
|-----------|--------|--------|
| 1 | `store-session` | `opened_at` → `now` |
| 2 | `last-closed-store-session` | `opened_at` → `closed_at` |
| 3 | `business-window` | jornada calendario |

Cadena preservada: `visibleOperationalOrders` → `filteredOrders`.

## Store session hydration

- `getActiveStoreSessionHydrationAction` retorna `{ session, lastClosedSession }`.
- SSR page carga ambas en paralelo.
- Client state: `activeStoreSessionState`, `lastClosedStoreSessionState`.

## Realtime store session behavior

- INSERT open → active session.
- UPDATE closed → `active=null`, `lastClosed=session cerrada` (fallback si hydrate falla).

## Operational window changes

Nuevo `OperationalWindowSource`: `last-closed-store-session`.

Helpers: `resolveAnalyticsScopeKind`, `getAnalyticsScopeCopy`, `formatLastClosedSessionReviewLabel`.

## Orders fetch / refresh behavior

`getAdminOrders` sigue cargando todos los pedidos del tenant; el filtro por ventana ocurre client-side vía `getOrdersInOperationalWindow`. No se requirió cambio de route JSON ni query DB adicional para MVP.

## Top section behavior

Meta `sessionLabel`: “Última sesión cerrada” en review mode. KPIs/insights usan `visibleOperationalOrders` de la ventana cerrada.

## Board / context behavior

Kanban/cards/context usan `filteredOrders` dentro de la misma ventana. Context label: “Pedidos de la última sesión cerrada”.

## Copy / labels

| Scope | Top section | Toolbar session status |
|-------|-------------|------------------------|
| Active | Sesión activa | Sesión activa · desde HH:MM |
| Last closed | Última sesión cerrada | Sin sesión activa (operación cerrada) |
| Business window | Jornada actual | Jornada actual · rango |

Scope analítico en toolbar vía `operationalWindowLabel` / top section meta.

## Close session transition

`closeStoreSessionAction` success → `active=null`, `lastClosed=result.session`, `hydrateStoreSession`.

## Open session transition

Nueva sesión activa gana prioridad inmediata; `lastClosed` permanece en state pero no gobierna scope.

## Manual sync behavior

`handleManualOperationalResync` → `hydrateStoreSession` → reconcilia active + lastClosed.

## What was NOT implemented

- cierre de caja
- reportes/export
- selector/historial de sesiones
- política de bloqueo post-cierre

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions behavior igual.
- Realtime orders igual.
- Optimistic callbacks iguales.
- Manual sync UX igual.
- Search/filter igual.
- Kanban/cards layout igual.
- Modal/detail igual.

## Qué NO se cambió

- DB/schema
- server actions de pedidos
- toolbar layout
- top section layout
- card CSS/layout
- modal behavior
- status/assignment logic
- image optimization / no-img-element

## Riesgos encontrados

- `getAdminOrders` carga histórico completo del tenant (performance en tenants muy grandes).
- QA manual pendiente para refresh post-cierre y multi-tab.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Pass — compilación y typecheck Next OK |
| `npx tsc --noEmit` | Pass — exit 0 |
| `npm run lint` | Pass — 0 errors, 16 warnings (`no-img-element`, preexistentes) |

Fix TS en `use-admin-store-session-realtime.ts`: helpers tipados para payload `store_sessions` (`readStoreSessionRow`, `resolveStoreSessionFromChangePayload`).

## QA manual recomendado

Ver checklist prompt C2 (casos 1–6).

**Estado:** pendiente.

## Deuda técnica restante

- **C3 — Post-Closed Session Action Policy** (bloqueo opcional de acciones post-cierre).
- Fetch acotado por ventana operacional si crece volumen histórico.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness** o **C3 — Post-Closed Session Action Policy**
