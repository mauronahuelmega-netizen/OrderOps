# Admin Dashboard Toolbar Phase T9 — Cleanup Pass

## Objetivo

Limpiar deuda técnica acumulada del toolbar tras T4.2–T4.8 y T8, sin cambiar UX, layout, copy visible ni lógica funcional.

## Contexto

- **T4.8** — arquitectura `operationalRow` + `viewControlsRow`.
- **T8** — responsive mobile/tablet final.
- **T4.7** — sync operativo (sesión + pedidos).
- **T4.6** — estados offline/stale/error.
- **T4.5** — identificó `onDemandModeActive` como posible estado muerto tras T4.4.
- **T9** — cleanup controlado: CSS redundante, naming legacy, estado muerto, documentación.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/DashboardToolbar.tsx`
- `components/admin/orders/dashboard-toolbar.module.css`
- `components/admin/orders/operational-search.module.css`
- `lib/orders/dashboard-execution-view-model.ts`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t9.md`

## Cleanup ejecutado

| Categoría | Acción |
|-----------|--------|
| CSS muerto legacy | Ninguna clase `.scopeIndicator`, `.primaryRow`, `.controlRow`, `.filtersWrapper` en código TS/CSS (ya removidas en T4.8) |
| CSS redundante | Eliminadas reglas mobile duplicadas en toolbar y search |
| Imports muertos | Removido `useAdminBusinessSettings` (solo alimentaba estado muerto) |
| Naming view model | `syncSessionAriaLabel` → `operationalSyncAriaLabel`, `syncSessionTitle` → `operationalSyncTitle`, `isSyncingSession` → `isOperationalSyncing` |
| Naming handler prop | `onManualStoreSessionResync` → `onManualOperationalResync` |
| Estado muerto | Removidos `onDemandModeActive` / `setOnDemandModeActive` y `isStoreSessionHydrating` / `setIsStoreSessionHydrating` |
| Comentarios | Sync state priority en view model; header search CSS actualizado |

## CSS cleanup

### `dashboard-toolbar.module.css`

- Eliminado bloque mobile redundante `.toolbar { gap, padding }` (igual al base).
- Eliminado `.sessionError { margin-top }` mobile (duplicaba regla base).

### `operational-search.module.css`

- Eliminado `.admin-orders-search { width: 100% }` en mobile (base ya define `width: 100%`).
- Comentario de cabecera actualizado (referencia legacy removida).

## TSX cleanup

### `DashboardToolbar.tsx`

- Prop renombrada: `onManualOperationalResync`.
- Referencias view model alineadas a nombres operativos T4.7.

### `admin-dashboard-orders.tsx`

- Removido hook `useAdminBusinessSettings` y effect de sync `on_demand_mode_active`.
- Removidos setters de `onDemandModeActive` en hydrate, realtime fallback, open/close.
- Removido flag `isStoreSessionHydrating` (escrito pero nunca leído).
- Prop toolbar: `onManualOperationalResync={handleManualOperationalResync}`.

## View model cleanup

Renombrados campos del toolbar view model para reflejar semántica T4.7 (estado operativo completo):

- `operationalSyncAriaLabel`
- `operationalSyncTitle`
- `isOperationalSyncing`

Comentario añadido en `buildDashboardExecutionSyncPresentation` sobre prioridad de estados (offline → syncing → error → stale → synced).

`scopeLabel` se mantiene en el tipo (T4.2: no renderizado; reservado para futuro scope/jornada).

## State cleanup

### Removido — `onDemandModeActive`

- **Evidencia:** escrito en hydrate, realtime fallback, open/close y effect de settings; **nunca leído** tras T4.4.
- **Fuente real:** `activeStoreSessionState` → `hasActiveStoreSession` → view model.

### Removido — `isStoreSessionHydrating`

- **Evidencia:** `setIsStoreSessionHydrating` en `hydrateStoreSession`; **nunca leído** (T4.7 usa `isManualOperationalResyncing` para sync UI).

## Handler naming cleanup

| Antes | Después |
|-------|---------|
| `onManualStoreSessionResync` (prop) | `onManualOperationalResync` |
| `handleManualOperationalResync` (container) | Sin cambio (ya correcto) |

Flujo preservado: offline guard → `hydrateStoreSession("manual-resync")` → `refreshOrdersSilently("manual-operational-resync")` → éxito/error combinado.

## Qué se mantuvo intencionalmente

- `scopeLabel` en view model (no renderizado; deuda/futuro documentada).
- `OrdersFilter` deprecated alias en view model (compatibilidad container).
- Board Area sin cambios (Estados del flujo, empty/context, top section).
- Breakpoints y reglas responsive T8 intactos.
- Copy visible y tooltips T4.7 sin cambios.

## Qué se preservó

- Desktop T4.8
- Mobile/tablet T8
- Manual operational resync T4.7
- Offline-aware sync T4.6
- open/close session T4.4
- search behavior T5
- filter URL sync
- realtime
- optimistic UX
- scanning
- empty/context
- top section
- order cards/modal

## Qué NO se tocó

- DB/Supabase
- server actions
- hydrate/refresh behavior
- refreshOrdersSilently behavior
- search parser
- filters logic
- URL sync
- Estados del flujo
- empty/context
- top section
- order cards/modal
- mobile/tablet visual behavior

## Riesgos encontrados

- Ninguno funcional identificado; cambios limitados a naming interno y estado no leído.
- Docs históricas (T4.3–T4.6) aún mencionan nombres legacy — referencia histórica, no runtime.

## Deuda técnica restante

- **Board Area:** `Estados del flujo` redundante en empty state; context panel/tablet con integración pendiente — épica Board / Orders Execution Area.
- **Docs forenses:** auditorías previas referencian `onDemandModeActive` y `toggleBusinessStatus` en toolbar (obsoletos post T4.4/T9).
- **ESLint:** no configurado en el proyecto.
- **QA manual:** smoke regression pendiente en dispositivos reales.

Board Area queda fuera del toolbar cleanup y se abordará en épica separada.

## Validaciones ejecutadas

- `npx tsc --noEmit`: pass (tras `npm run build` si `.next/types` ausentes)
- `npm run lint`: no configurado — setup interactivo ESLint
- `npm run build`: pass

## QA manual recomendado

Smoke regression (sin cambio UX esperado):

1. Desktop: layout T4.8, search, filtros, URL `?filter=`, open/close, sync manual, offline si aplica.
2. Mobile/tablet T8: search antes de filtros, full-width, scroll filtros, session cluster usable.
3. No regresión: Estados del flujo, empty/context, top section, order cards/modal.

## Próxima fase recomendada

**T10** — QA final del execution block (checklist completo desktop + mobile + tablet + offline).
