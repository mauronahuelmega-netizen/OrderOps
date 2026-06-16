# Admin Dashboard Toolbar Phase T4.6 — Offline-aware Sync State & Hydrate Result Surfacing

## Objetivo

Hacer honesto el indicador manual de sync del toolbar: reflejar conectividad del navegador y resultado real de hidratación, sin mostrar `synced` cuando no hubo confirmación con servidor.

## Contexto

- **T4.3** introdujo `synced / syncing / error` visual, pero `synced` era fallback cuando no había `syncing` ni `storeSessionError` de open/close.
- **T4.5** confirmó que eso no prueba verificación real contra servidor.
- **T4.6** agrega detección online/offline, timestamp de último hydrate exitoso, errores de sync separados y estado `stale`.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `lib/orders/dashboard-execution-view-model.ts`
- `components/admin/orders/dashboard-toolbar.module.css`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t4-6.md`

## Problema detectado

Al desconectar internet y tocar sync, el botón podía volver a estado `synced` aunque no hubiera confirmado nada con servidor. `hydrateStoreSession` traga fallos (`!result.ok` / catch) y no surfacing error de sync.

## Cambio principal

- Detección `navigator.onLine` + listeners `online` / `offline`.
- `storeSessionSyncError` separado de `storeSessionError` (open/close).
- `lastSuccessfulStoreSessionHydratedAt` actualizado solo en hydrate exitoso, open/close server-confirmed o realtime fallback.
- Modelo sync ampliado: `synced | syncing | offline | stale | error`.
- Manual sync offline: guard antes de network; no intenta request.
- Stale después de 5 minutos sin hydrate exitoso (tick cada 60s).

## Online/offline detection

```ts
const [isBrowserOnline, setIsBrowserOnline] = useState(true);

useEffect(() => {
  const updateOnlineState = () => {
    const online = typeof navigator === "undefined" ? true : navigator.onLine;
    setIsBrowserOnline(online);
    if (online) {
      setStoreSessionSyncError((current) =>
        current === "offline" ? null : current
      );
    }
  };
  updateOnlineState();
  window.addEventListener("online", updateOnlineState);
  window.addEventListener("offline", updateOnlineState);
  ...
}, []);
```

Al volver online: no marca `synced` automáticamente; puede quedar `stale` hasta manual sync exitoso.

## Hydrate result surfacing

`hydrateStoreSession` ahora:

- Retorna `false` offline sin request (manual reasons setean error offline).
- Setea `storeSessionSyncError` en fallo de `manual-resync` / `manual-action`.
- Setea `lastSuccessfulStoreSessionHydratedAt` + limpia sync error en éxito.
- Background realtime/interval failures no contaminan sync error (silenciosos como antes).

## Sync state model

Prioridad en view model:

```ts
if (!isOnline) → offline
else if (isStoreSessionHydrating) → syncing
else if (storeSessionSyncError) → error
else if (isStoreSessionSyncStale) → stale
else → synced
```

| Estado | Regla | Icono | Tooltip |
|--------|-------|-------|---------|
| `offline` | `!isOnline` | `RefreshCwOff` | Sin conexión. Volvé a conectarte para sincronizar. |
| `syncing` | `isStoreSessionHydrating` | `RefreshCcw` + spin | Sincronizando sesión... |
| `error` | `storeSessionSyncError` presente | `RefreshCwOff` | No se pudo sincronizar la sesión. Hacé click para reintentar. |
| `stale` | >5 min sin hydrate exitoso | `RefreshCwOff` | La sesión no fue verificada recientemente. Hacé click para actualizar manualmente. |
| `synced` | online + hydrate reciente OK | `RefreshCcw` | Sesión sincronizada. Hacé click para actualizar manualmente. |

## Stale policy

- `STORE_SESSION_SYNC_STALE_AFTER_MS = 5 * 60 * 1000`
- Initial `lastSuccessfulStoreSessionHydratedAt = Date.now()` (SSR recién cargado cuenta como verificado).
- `syncFreshnessTick` cada 60s para re-evaluar stale sin interacción.

## Tooltip / aria model

Copy operacional en español rioplatense; sin términos técnicos (`hydrate`, `stale`, etc.) en UI.

## CSS / visual states

- `offline` / `stale` / `error`: opacity 0.82, dot muted vía `color-mix` con tokens existentes.
- `synced` / `syncing`: dot verde + breathing (sin cambio T4.3).
- `prefers-reduced-motion`: sin animaciones (preservado).

## Behavior preservation

- Manual sync sigue llamando `hydrateStoreSession("manual-resync")` only.
- No `refreshOrdersSilently` en sync.
- Open/close T4.4 intactos; post-success actualizan timestamp sync.

## Error handling

| Escenario | Comportamiento |
|-----------|----------------|
| Sync offline click | `offline` state, no request |
| Hydrate `!result.ok` manual | `error` + mensaje fijo |
| Hydrate catch manual | `error` + message |
| Open/close error | `storeSessionError` (sin mezclar sync) |
| Reconnect | Limpia error offline; no auto-sync |

## Performance notes

- Stale tick: 60s interval (no 1s polling).
- Online listeners: 2 eventos estándar, cleanup en unmount.

## Qué se preservó

- hydrate session only
- open/close session behavior T4.4
- sync icon-only T4.3
- search behavior
- filter URL sync
- scanning behavior
- empty/context behavior
- top section

## Qué NO se tocó

- DB/Supabase
- server actions open/close
- store_sessions schema
- search/filtros
- scanning
- empty/context
- order cards/modal
- realtime orders internals
- audio unlock
- theme bootstrap

## Riesgos encontrados

- `navigator.onLine` puede reportar online con red degradada (limitación browser estándar).
- Stale de 5 min puede ser agresivo en dashboards poco activos; ajustable en constante.

## Deuda técnica restante

- QA manual browser offline/reconnect checklist
- Posible auto-hydrate on reconnect (diferido a fase futura)
- Remover `onDemandModeActive` dead state (T9)

## Validaciones ejecutadas

- `npx tsc --noEmit`: pass
- `npm run lint`: no configurado — `next lint` abre setup interactivo de ESLint
- `npm run build`: pass

## QA manual recomendado

Ver checklist §21 del prompt T4.6: online synced, manual success, offline, reconnect → stale, hydrate failure, no regresión open/close/search.

## Próxima fase recomendada

**T7** empty/context polish, o QA manual completo del sub-bloque session/sync antes de avanzar.
