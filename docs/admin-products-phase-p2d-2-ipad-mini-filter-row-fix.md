# Admin Products — Phase P2D.2 — iPad Mini Filter Row Fix

## Objetivo

Corregir únicamente la fila de filtros en **768–899px** para que iPad Mini portrait muestre los 3 selects en una sola fila (como iPad Air), sin reabrir cards, grid ni desktop.

## Contexto

- **P2D.1** fijó toolbar tablet portrait (search full-width + filtros debajo) y cards lista admin.
- QA visual detectó: iPad Air correcto (3 filtros en fila); iPad Mini (768px) mostraba categoría en fila separada por regla `768–819px` con `grid-column: 1 / -1` en primer select.
- **P2D.2** elimina ese split y fuerza `repeat(3, minmax(0, 1fr))` en todo el rango 768–899px.

Referencias: P2D, P2D.1, P2F, `admin-products-v1-visual-handoff.md`.

## Archivos modificados

- `components/admin/products/products-toolbar.module.css`

## Archivos creados

- `docs/admin-products-phase-p2d-2-ipad-mini-filter-row-fix.md`

## Cambio principal aplicado

En 768–899px, la toolbar mantiene search full-width y fuerza los 3 filtros en una sola fila, evitando el layout partido de iPad Mini.

## Toolbar tablet portrait

- `.controlsRow` → grid 1 columna (search arriba, filtros debajo).
- `.searchWrapper` → `width: 100%`, `max-width: none`.

## Filters cluster fix

- `.filtersCluster` → `grid-template-columns: repeat(3, minmax(0, 1fr))` para **todo** 768–899px.
- Eliminada regla `@media (min-width: 820px)` que solo aplicaba 3 cols desde 820px.
- Eliminado `grid-column: 1 / -1` en primer `.filterSelect`.
- `.filterSelect`: `min-width: 0`, padding horizontal reducido (`0.625rem` / `1.75rem`), chevron más compacto.
- `Limpiar filtros` sigue full width debajo cuando aplica (`grid-column: 1 / -1`).

## Mobile preservation

- Reglas `<768px` sin cambio (filtros apilados / grid mobile P2D).
- Media query P2D.2 limitada a `min-width: 768px`.

## Desktop preservation

- `≥900px` y `≥1024px` sin cambio.
- `ProductTableView`, cards P2D.1, header, acciones no tocados.

## Qué se preservó

- filtros URL
- búsqueda/debounce
- paginación funcional
- create/edit flyouts
- active/inactive behavior
- image pipeline
- cards P2D.1
- desktop table P2C
- header P2A
- toolbar P2B desktop
- AdminFooter global
- sidebar
- dashboard/kanban

## Qué NO se cambió

- DB/schema
- server actions
- product forms
- flyout internals
- checkout público
- dashboard/kanban
- theme tokens/global CSS
- ProductTableView
- ProductCard/ProductGrid behavior
- `products-toolbar.tsx` logic

## Validaciones ejecutadas

- `npm run build`: **pass** (1er intento).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / 16 warnings `@next/next/no-img-element` (baseline sin cambios).

## QA manual recomendado

### iPad Mini portrait / 768–899px

1. Search full width.
2. Tres filtros en **una** fila: categoría, stock, estado.
3. Selects legibles; sin segunda fila para categoría.
4. Cards P2D.1 sin cambio.

### iPad Air / 820–899px

5. Misma fila de 3 filtros.

### Mobile 390px

6. Filtros apilados (sin 3 columnas forzadas).

### Desktop ≥900px

7. Toolbar/desktop/table P2C intactos.

### Functional

8. Búsqueda, filtros, paginación, flyouts.

**Estado:** pendiente staging — no declarar ACCEPTED.

## Riesgos / deuda

- En 768px exacto, labels largos (`Todas las categorías`) pueden truncarse levemente — mitigado con padding/gap reducidos; validar en dispositivo.
- QA manual staging sigue pendiente.

## Próxima fase recomendada

**P2F.1 — Products Final QA Refresh** — validar iPad Mini + iPad Air filtros y promover a ACCEPTED si staging pass.

---

**Handoff date:** 2026-06-06 (P2D.2)
