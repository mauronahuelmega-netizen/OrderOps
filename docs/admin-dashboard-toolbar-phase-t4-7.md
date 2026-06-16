# Admin Dashboard Toolbar Phase T4.7 — Manual Operational Resync: Session + Orders

## Objetivo

Ampliar el botón manual de sync del toolbar para reconciliar el estado operativo completo: sesión real + pedidos del tablero, no sólo hydrate de sesión.

## Contexto

- **T4.6** hizo el sync offline-aware pero sólo hidrataba sesión.
- **T4.7** combina `hydrateStoreSession("manual-resync")` + `refreshOrdersSilently("manual-operational-resync")` en secuencia.
- `synced` sólo si ambas operaciones pasan.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `lib/orders/dashboard-execution-view-model.ts`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t4-7.md`

## Problema detectado

El sync manual confirmaba sesión pero no pedidos. El operador podía ver sesión “actualizada” mientras el tablero no convergía sin F5 o esperar realtime.

## Cambio principal

- Handler `handleManualOperationalResync`: offline guard → hydrate sesión → refresh silencioso de pedidos → éxito/error combinado.
- Estado T4.6 renombrado a operational: `operationalSyncError`, `lastSuccessfulOperationalSyncedAt`, `isOperationalSyncStale`, `isManualOperationalResyncing`.
- Copy del indicador pasa de “sesión sincronizada” a “estado operativo”.

## Orders refresh audit

| Aspecto | Hallazgo |
|---------|----------|
| Función existente | `refreshOrdersSilently` en `admin-dashboard-orders.tsx` |
| Endpoint | `GET /admin/dashboard/orders` (JSON `{ orders }`) |
| Estado actualizado | `optimisticOrders`, `selectedOrderSeed`, preserva pending mutations |
| Reutilizada | Sí, con nuevo reason `"manual-operational-resync"` |
| Retorno adaptado | `Promise<boolean>` (antes void implícito) |
| Cooldown | Bypass para manual-operational-resync |
| router.refresh | No usado para pedidos |

## Manual operational resync flow

1. Offline → `operationalSyncError = offline`, sin requests.
2. `setIsManualOperationalResyncing(true)`.
3. `sessionOk = await hydrateStoreSession("manual-resync")`.
4. `ordersOk = await refreshOrdersSilently("manual-operational-resync")`.
5. Si ambos OK → `lastSuccessfulOperationalSyncedAt = now`, clear error.
6. Si alguno falla → `operationalSyncError` con mensaje combinado.
7. `finally` → `isManualOperationalResyncing = false`.

Secuencial (no `Promise.all`) para depuración clara.

## Session hydrate result

- `hydrateStoreSession` ya no actualiza timestamps/errores operacionales.
- Retorna `true/false` para el handler combinado.
- Background hydrates (realtime, interval, manual-action post open/close) siguen actualizando sesión sin marcar sync operativo completo.

## Orders refresh result

- Manual reason bypass cooldown y guards de visibility/offline (offline ya bloqueado en handler).
- Respeta `isRefreshingRef` in-flight (evita duplicar fetch).
- Reconcilia pending optimistic status sin romper modal abierto.

## Combined success/error model

```txt
synced sólo si session hydrate OK + orders refresh OK.
```

Fallo parcial → `syncState = error`, no vuelve a verde.

## Offline behavior

Preservado de T4.6: offline priority, no requests, `RefreshCwOff`, tooltip sin conexión. Reconnect no auto-sync.

## Sync state / tooltip model

| Estado | Tooltip |
|--------|---------|
| synced | Estado operativo actualizado. Hacé click para sincronizar sesión y pedidos. |
| syncing | Sincronizando sesión y pedidos... |
| offline | Sin conexión. Volvé a conectarte para sincronizar. |
| stale | El estado operativo no fue verificado recientemente. Hacé click para actualizar. |
| error | No se pudo actualizar el estado operativo. Hacé click para reintentar. |

## Stale policy

- `OPERATIONAL_SYNC_STALE_AFTER_MS = 5 min`
- Tick 60s preservado
- Sólo `lastSuccessfulOperationalSyncedAt` en sync manual completo exitoso (+ SSR initial)

## Open/close interaction

Open/close T4.4 ya no marca sync operativo completo (`lastSuccessfulOperationalSyncedAt`). Tras open/close sólo `hydrateStoreSession("manual-action")` para sesión. Full operational sync queda para botón manual (Opción B).

## Behavior preservation

- Realtime sigue siendo vía principal para pedidos y sesión.
- Sync manual es fallback/reconciliación explícita.
- Sin reload completo, sin `router.refresh` para pedidos.

## What was intentionally not changed

- DB/Supabase schema
- server actions open/close
- search/filtros/scanning/empty/context
- order cards/modal internals
- realtime architecture
- audio unlock / theme bootstrap

## Risks

- `navigator.onLine` no detecta red degradada.
- Open/close deja sync en stale hasta click manual (intencional T4.7).
- Refresh manual comparte `isRefreshingRef` con recovery refreshes.

## Technical debt

- QA manual offline/reconnect + partial failure simulation
- Opcional: refresh pedidos post open/close si producto lo pide
- Auto-sync on reconnect (diferido)

## Validaciones ejecutadas

- `npx tsc --noEmit`: pass
- `npm run lint`: no configurado — setup interactivo ESLint
- `npm run build`: pass

## Manual QA recommended

Ver checklist §20 del prompt T4.7: online success, orders convergence, partial failure, offline, no regresión.

## Next recommended phase

**T7** empty/context polish o QA manual completo del sub-bloque session/sync.
