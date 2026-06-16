# Order Modal Phase 2I — Modal Hydration Skeleton Polish

## Objetivo

Eliminar el texto visible `"Actualizando..."` durante la hidratación del modal y reemplazarlo por skeletons premium, sutiles y alineados con las superficies actuales — sin cambiar lógica de hydration, cache ni fetch.

Referencias: Phase 1A–1B, 2F–2H, `docs/order-modal-audit.md`.

## Archivos creados

- `components/admin/orders/order-modal-skeleton.tsx`
- `components/admin/orders/order-modal-skeleton.module.css`
- `docs/order-modal-phase-2i.md`

## Archivos modificados

- `components/admin/orders/order-modal-workspace-toolbar.tsx`
- `components/admin/orders/order-modal-states.tsx`

## Cambio principal aplicado

Dos skeletons dedicados reemplazan copy técnico de loading:

| Caso | Condición | Antes | Después |
|------|-----------|-------|---------|
| **A — Initial** | `loading && !displayOrder` | Texto "Cargando pedido..." | `OrderModalWorkspaceSkeleton` |
| **B — Background refresh** | `loading && displayOrder` | Texto "Actualizando..." en toolbar | `OrderModalRefreshSkeleton` |

## Antes

```txt
Toolbar (background hydration):
  Actualizando...   [presence pill?]

Initial loading:
  Cargando pedido...
  Estamos trayendo el detalle...
```

## Después

```txt
Toolbar (background hydration):
  [ shimmer pill ] [ shimmer line ]   [presence pill?]

Initial loading:
  Skeleton completo left/right (productos, overview, timeline, consola)
```

## Skeletons creados

### `OrderModalRefreshSkeleton`

- Mini row: pill + line con shimmer
- `role="status"`, `aria-live="polite"`, `aria-label="Actualizando pedido"`
- `sr-only`: "Actualizando pedido"
- Sin texto técnico visible

### `OrderModalWorkspaceSkeleton`

- Layout `workspaceGrid` + `executionColumn` / `commandColumn` (clases del modal)
- Izquierda: product rows, total, overview grid, timeline card, notes
- Derecha: recommended panel, control operativo, comunicación + quick grid
- `role="status"`, `aria-busy="true"`, `aria-label="Cargando pedido"`
- `sr-only`: "Cargando pedido"

## Qué reemplazó al texto "Actualizando..."

- `order-modal-workspace-toolbar.tsx`: `<span>Actualizando...</span>` → `<OrderModalRefreshSkeleton />`
- Misma condición `loading === true`; presence pill sin cambios

## Qué se preservó

- Gate `loading && !displayOrder` → loading state
- Gate `loading && displayOrder` → toolbar refresh indicator
- `useOrderWorkspaceHydration` sin cambios
- Contenido seed visible durante background refresh
- Botones/acciones no bloqueados ni tapados
- Error state (`OrderModalErrorState`) intacto
- Layout desktop general (grid 54/46, orden de secciones)
- Operator presence en toolbar cuando aplica

## Qué NO se tocó

- hydration/cache
- `useOrderWorkspaceHydration`
- fetch workspace
- server actions
- optimistic callbacks
- realtime
- DB
- status logic
- assignment logic
- WhatsApp logic
- risk logic
- timeline logic
- products logic
- notes logic
- layout desktop general
- mobile/tablet redesign
- `admin-order-workspace-modal.tsx` (mismos gates/render)
- `app/theme-tokens.css` / `app/globals.css`

## Accesibilidad

- `OrderModalRefreshSkeleton`: `role="status"`, `aria-live="polite"`, `aria-label`, `sr-only`
- `OrderModalWorkspaceSkeleton`: `role="status"`, `aria-busy`, `aria-label`, `sr-only`
- Shapes decorativas: `aria-hidden="true"`
- `@media (prefers-reduced-motion: reduce)`: shimmer desactivado

## Ajustes CSS realizados

- Shimmer con `color-mix` sobre `--text-muted` / `--text-primary`
- Superficies alineadas con Phase 2H (bordes suaves, `bg-surface-soft`)
- Bones con border-radius coherentes (pill, 10px blocks)
- Reutiliza `workspaceGrid`, `executionColumn`, `commandColumn` del modal

## Validaciones ejecutadas

- `npx tsc --noEmit` — ✅ exit 0
- `npm run lint` — ⚠️ ESLint no configurado; Next.js abre setup interactivo — no se inventó resultado
- `npm run build` — ✅ exit 0, compiled successfully

## QA manual recomendado

1. `/admin/dashboard` → abrir pedido
2. No aparece `"Actualizando..."` visible
3. Skeleton sutil en toolbar durante background hydration
4. Contenido seed sigue visible y usable
5. Sin layout shift fuerte
6. Initial loading sin seed: skeleton completo
7. Error state sigue funcionando
8. `prefers-reduced-motion`: sin animación shimmer
9. Flujos: estado, asignación, WhatsApp, risk, timeline, cerrar modal

## Próxima fase recomendada

**Phase 3 — Mobile/tablet layout redesign** del modal workstation.
