# Admin Dashboard Toolbar Phase T8 — Mobile / Tablet Alignment

## Objetivo

Cerrar el comportamiento responsive mobile/tablet del toolbar tras T4.8, sin cambiar lógica funcional.

## Contexto

- **T4.7** — sync operativo (sesión + pedidos).
- **T4.8** — arquitectura desktop en `operationalRow` + `viewControlsRow`.
- **T8** — polish responsive: orden search/filtros en mobile, touch targets, tablet stack seguro.

## Archivos modificados

- `components/admin/orders/dashboard-toolbar.module.css`
- `components/admin/orders/operational-search.module.css`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t8.md`

## Problemas observados

- Mobile necesitaba search full-width antes de filtros.
- Filtros requerían scroll horizontal más intencional.
- Session cluster necesitaba touch targets y wrap más seguro.
- Tablet requería evitar competencia entre search y filtros.

## Decisión responsive

| Viewport | Comportamiento |
|----------|----------------|
| Desktop ≥1200px | T4.8: filtros izquierda + search derecha (18–28rem) |
| Tablet 769–1199px | Dos filas; grid filtros + search; wrap session |
| Tablet 769–920px | Fila 2 en columna: search arriba, filtros abajo |
| Mobile ≤768px | Título → sesión → search → filtros scroll |

## Desktop behavior

Preservado T4.8 en `@media (min-width: 1200px)`:

- Fila 1: título + session cluster derecha.
- Fila 2: `grid` filtros + search (18–28rem).

## Tablet behavior

- `769px–1199px`: operational row con session wrap; grid `1fr / 16–22rem`.
- `769px–920px`: view controls en columna; search `order: 1`, filtros `order: 2`.
- Touch targets moderados en session/sync/filtros.

## Mobile behavior

- `operationalRow` en columna con gap `var(--space-md)`.
- Search full-width (`order: 1`) antes de filtros (`order: 2`).
- Filtros: scroll horizontal, padding lateral, scrollbar oculto.
- Session status con ellipsis si overflow; botones y sync 44px (`2.75rem`).

## Search / filters order

DOM sin cambios; orden visual mobile/tablet angosto vía CSS `order` en `.searchCluster` / `.filterCluster`.

## Session cluster behavior

- Mobile: wrap, gap consistente, status legible con ellipsis.
- Tablet: `flex-wrap` + `justify-content: flex-end` en fila 1.
- Sync siempre visible y `flex-shrink: 0`.

## Touch targets

| Control | Mobile | Tablet |
|---------|--------|--------|
| Filtros | min-height 2.5rem | 2.375rem |
| Search field | min-height 2.75rem | — |
| Abrir/Cerrar | min-height 2.75rem | 2.5rem |
| Sync | 2.75rem | 2.25rem |

## CSS changes

- Breakpoints: mobile ≤768, tablet 769–1199, stack 769–920, desktop ≥1200.
- `overflow-x: clip` en `.toolbar` para evitar scroll de página.
- `operational-search.module.css`: altura táctil mobile en field/input/clear.

## What was preserved

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

## What was intentionally not changed

- DB/Supabase
- server actions
- hydrate/refresh handlers
- refreshOrdersSilently
- search parser
- filters logic
- URL sync
- Estados del flujo
- empty/context
- top section
- order cards/modal
- DashboardToolbar.tsx logic

## Board area debt observed

- `Estados del flujo` se siente redundante en empty state.
- Empty/context panel pertenecen a futura épica del tablero.
- Actividad reciente/context panel puede requerir layout propio en tablet/mobile.

## Risks

- Session label largo truncado con ellipsis en mobile muy angosto.
- Tablet 921–1199 mantiene filtros a la izquierda y search a la derecha (puede apretar en landscape pequeño).

## Technical debt

- QA manual en dispositivos reales (Galaxy A51, iPad Mini).
- Épica Board / Orders Execution Area para Estados del flujo y empty/context.
- T9 cleanup CSS global.

## Validaciones ejecutadas

- `npx tsc --noEmit`: pass
- `npm run lint`: no configurado — setup interactivo ESLint
- `npm run build`: pass

## Manual QA recommended

Ver checklist §18 del prompt T8.

## Next recommended phase

**T9** — cleanup global del toolbar, o **T10** — QA final del execution block.
