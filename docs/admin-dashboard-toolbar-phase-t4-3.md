# Admin Dashboard Toolbar Phase T4.3 — Manual Sync Indicator Model

## Objetivo

Reemplazar el botón textual permanente de sincronización de sesión por un control compacto icon-only con dot de estado, tooltips accesibles y modelo visual `synced / syncing / error`, sin cambiar el comportamiento funcional de hydrate manual.

## Contexto

- **T4** agregó `Sincronizar sesión` como label visible junto a `RefreshCw`.
- **T4.1** auditó que el copy es demasiado protagónico y no existía modelo `synced/stale/error`.
- **T4.2** quitó el scope label redundante bajo `Pedidos en curso`.
- **T4.3** refina únicamente el control manual de sync en el cluster de sesión.

## Archivos modificados

- `lib/orders/dashboard-execution-view-model.ts`
- `components/admin/orders/DashboardToolbar.tsx`
- `components/admin/orders/dashboard-toolbar.module.css`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t4-3.md`

## Problema detectado

El botón de sync ocupaba ancho permanente con texto (`Sincronizar sesión` / `Sincronizando sesión...`) aunque no es una acción principal ni refetch de pedidos. No comunicaba estados visuales más allá del spin durante hydrate.

## Cambio principal

Sync convertido a botón circular icon-only con:

- `RefreshCcw` en synced/syncing (spin en syncing)
- `RefreshCwOff` en error
- Dot de estado con breathing sutil en synced/syncing
- `aria-label` + `title` nativo por estado
- Sin label textual visible en idle

El handler sigue siendo `onManualStoreSessionResync` (hydrate session only).

## Sync state model

```ts
export type DashboardExecutionSyncState = "synced" | "syncing" | "error";
```

| Estado   | Regla |
|----------|-------|
| `syncing` | `isStoreSessionHydrating === true` |
| `error`   | `storeSessionError != null && !isStoreSessionHydrating` |
| `synced`  | fallback cuando no syncing ni error |
| `stale`   | **diferido** — no hay `lastSuccessfulHydrationAt` ni señal confiable todavía |

El estado `error` depende de `storeSessionError` existente; hydrate failures manuales pueden no surfacerse todavía.

## Lucide icon mapping

| Estado   | Icono |
|----------|-------|
| `synced`  | `RefreshCcw` |
| `syncing` | `RefreshCcw` + spin |
| `error`   | `RefreshCwOff` |

## Tooltip / aria model

| Estado   | aria-label / title |
|----------|-------------------|
| `synced`  | `Sesión sincronizada. Hacé click para actualizar manualmente.` |
| `syncing` | aria: `Sincronizando sesión` · title: `Sincronizando sesión...` |
| `error`   | `No se pudo sincronizar la sesión. Hacé click para reintentar.` |

## CSS / visual polish

- `.syncButton`: 2rem circular, border sutil, `data-sync-state` para variantes
- `.syncStatusDot`: posición top-right, `--color-success` en synced, accent mix en syncing, cancelled mix en error
- `@keyframes toolbar-sync-pulse` para breathing en synced/syncing
- `@keyframes toolbar-sync-spin` para icono en syncing
- Mobile: touch target 2.25rem

## Accessibility notes

- Iconos marcados `aria-hidden="true"`
- Acción expuesta vía `aria-label` y `title` nativo
- Botón `disabled` durante syncing para evitar doble click
- Dot decorativo con `aria-hidden="true"`

## Performance / reduced motion

- `@media (prefers-reduced-motion: reduce)` desactiva pulse y spin
- Animaciones livianas (opacity/scale/transform)

## Qué se preservó

- `onManualStoreSessionResync`
- hydrate session only
- open/close session behavior
- search behavior
- filter URL sync
- scanning behavior
- empty/context behavior
- top section

## Qué NO se tocó

- DB/Supabase
- server actions
- `toggleBusinessStatus`
- store_sessions reconciliation T4.4
- real timestamp reconciliation T4.4
- search/filtros
- scanning
- empty/context
- order cards/modal
- realtime internals
- audio unlock
- theme bootstrap

## Comportamiento preservado

- Click en sync llama hydrate manual de sesión, no refetch de pedidos
- Realtime, open/close, search, filtros y scanning sin cambios
- `storeSessionError` semantics sin modificar

## Riesgos encontrados

- El estado `error` solo refleja errores que ya setean `storeSessionError` (p. ej. open/close); fallos de hydrate manual pueden no mostrarse como error todavía
- Sin `stale`, el dot verde en `synced` no garantiza frescura temporal de datos

## Deuda técnica restante

- `stale` y timestamp de última sync exitosa (`lastSuccessfulHydrationAt`)
- Surfacing de errores de hydrate manual en `storeSessionError`
- Reconciliación store session / timestamps (**T4.4**)
- Tooltip nativo vs componente accesible en fase futura

## Validaciones ejecutadas

- `npx tsc --noEmit`: pass
- `npm run lint`: no configurado — `next lint` abre setup interactivo de ESLint
- `npm run build`: pass

## QA manual recomendado

En `/admin/dashboard`:

1. Idle: no aparece texto `Sincronizar sesión`; icon button compacto con `RefreshCcw` y dot
2. Syncing: spin + dot breathing; disabled; aria/title correctos
3. Error (si simulable): `RefreshCwOff`, dot muted, tooltip de reintento
4. Layout: cluster `[sessionStatusLabel] [Abrir/Cerrar] [sync icon]` compacto
5. Mobile: touch target razonable, sin overflow
6. No regresión en search, filtros, open/close, cards, modal

## Próxima fase recomendada

**T4.4** — store session reconciliation, timestamps reales y alineación open/close con `store_sessions`.
