# Admin Dashboard Toolbar Phase T4.4 — Real Store Session Start Time Reconciliation

## Objetivo

Reconciliar abrir/cerrar sesión del toolbar con la tabla real `store_sessions`, alineando `on_demand_mode_active`, `activeStoreSessionState` y `sessionStatusLabel` para que `Sesión activa · desde HH:MM` use `store_sessions.opened_at` real.

## Contexto

- **T4.1** auditó que el toolbar usaba `toggleBusinessStatus` (solo `business_settings.on_demand_mode_active`) mientras el label de hora venía de `store_sessions.opened_at`.
- **T4.2/T4.3** refinan scope y sync visual sin corregir el wiring funcional.
- **T4.4** cablea `openStoreSessionAction` / `closeStoreSessionAction` existentes al toolbar.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `lib/orders/dashboard-execution-view-model.ts`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t4-4.md`

## Problema raíz

El toolbar usaba `toggleBusinessStatus` para abrir/cerrar, pero el label de hora venía de `store_sessions.opened_at` vía `activeStoreSessionState` → `getOperationalWindow` → `formatSessionStartLabel`.

Esto permitía estados mixtos: `onDemandModeActive = true` sin fila open real, o sesión DB open con cluster mostrando `Sin sesión activa`.

## Cambio principal

- **Abrir sesión:** `openStoreSessionAction()` → crea/reutiliza fila `store_sessions` open + sincroniza `on_demand_mode_active = true` (helper existente).
- **Cerrar sesión:** `closeStoreSessionAction(sessionId)` → cierra fila open + sincroniza `on_demand_mode_active = false`.
- **View model:** `sessionStatusLabel` y botones open/close usan `hasActiveStoreSession` (sesión real), no `onDemandModeActive`.
- **Hydration/realtime:** convergen `activeStoreSessionState` y `onDemandModeActive` post-hydrate y en payload fallback.

## Server actions wiring

Se reutilizaron acciones existentes sin duplicar lógica:

| Action | Helper | Efecto |
|--------|--------|--------|
| `openStoreSessionAction` | `openStoreSession` | Insert/reuse open row + `syncOnDemandModeActive(true)` |
| `closeStoreSessionAction` | `closeStoreSession` | Update closed + `syncOnDemandModeActive(false)` |
| `getActiveStoreSessionHydrationAction` | `getActiveStoreSession` | Devuelve sesión open real |

`toggleBusinessStatus` se preserva para otros usos (p. ej. settings); el toolbar ya no lo invoca.

## Open session flow

1. Guard: `canManageStoreSession && !pending && !hasActiveStoreSession`
2. `setPendingStoreSessionAction("opening")`
3. `openStoreSessionAction()`
4. On error → `storeSessionError`, no cambio optimista de estado
5. On success → `setOnDemandModeActive(true)`, `setActiveStoreSessionState(result.session)`
6. `hydrateStoreSession("manual-action")` para convergencia + route refresh throttled
7. `finally` → limpiar pending

## Close session flow

1. Guard: `canManageStoreSession && !pending && hasActiveStoreSession`
2. Confirm si hay pedidos activos (preservado)
3. `closeStoreSessionAction(activeStoreSessionState.id)`
4. On error → `storeSessionError`
5. On success → `setOnDemandModeActive(false)`, `setActiveStoreSessionState(null)`
6. `hydrateStoreSession("manual-action")`
7. `finally` → limpiar pending

## Store session timestamp source

`Sesión activa · desde HH:MM` usa `store_sessions.opened_at` real:

```txt
activeStoreSessionState → getOperationalWindow(source: "store-session") → formatSessionStartLabel(start)
```

No se cambió copy ni parser de hora.

## View model reconciliation

Input `onDemandModeActive` reemplazado por `hasActiveStoreSession`:

```ts
if (hasActiveStoreSession) {
  sessionStatusLabel = operationalWindowLabel; // Sesión activa · desde HH:MM
} else if (canManageStoreSession) {
  sessionStatusLabel = "Sin sesión activa";
} else {
  sessionStatusLabel = operationalWindowLabel; // jornada fallback
}
```

## Hydration/realtime convergence

- Post open/close: estado local inmediato + `hydrateStoreSession("manual-action")`
- Hydrate exitoso: actualiza `activeStoreSessionState` y `onDemandModeActive` según sesión open real
- Realtime payload fallback: alinea ambos estados
- `router.refresh()` vía throttle existente en hydrate manual-action/realtime

## Error handling

- Errores de action → `storeSessionError` visible
- Sin updates optimistas en fallo
- `pendingStoreSessionAction` siempre se limpia en `finally`

## Backwards compatibility

- `toggleBusinessStatus` intacto en `actions.ts`
- Helpers `openStoreSession` / `closeStoreSession` sin cambios de contrato
- Reutiliza sesión open existente si ya hay una (evita huérfanas múltiples)

## Qué se preservó

- confirm al cerrar con pedidos activos
- pending labels (`Abriendo...` / `Cerrando...`)
- sync indicator T4.3
- search behavior
- filter URL sync
- scanning behavior
- empty/context behavior
- top section
- order cards/modal

## Qué NO se tocó

- search/filtros
- scanning
- empty/context T7
- sync visual T4.3
- order cards/modal
- realtime orders internals
- DB schema/migrations
- audio unlock
- theme bootstrap

## Comportamiento preservado

- Manual sync sigue siendo hydrate session only
- Search, filtros URL, scanning, empty/context sin cambios
- Top section, cards, modal intactos

## Riesgos encontrados

- Si `store_sessions` migration no está aplicada, open/close fallan con error explícito del helper
- `syncOnDemandModeActive` usa update directo a `business_settings`, no RPC `set_business_on_demand_status` (comportamiento preexistente del helper)

## Deuda técnica restante

- Unificar `syncOnDemandModeActive` con RPC `set_business_on_demand_status` si se requiere paridad exacta de side effects
- Surfacing de errores de hydrate manual en sync indicator (T4.3 deuda)
- Estado `stale` / `lastSuccessfulHydrationAt` para sync indicator
- Cleanup `.scopeIndicator` CSS (T9)

## Validaciones ejecutadas

- `npx tsc --noEmit`: pass
- `npm run lint`: no configurado — `next lint` abre setup interactivo de ESLint
- `npm run build`: pass

## QA manual recomendado

Ver checklist en prompt T4.4 §23: estado inicial, abrir, cerrar, sync, no regresión en `/admin/dashboard`.

## Próxima fase recomendada

**T4.5** — QA pass dedicado o **T7** empty/context polish según roadmap del toolbar.
