# Admin Products — Phase P2D.1 — iPad Mini Portrait Responsive Fix

## Objetivo

Corregir el estado intermedio roto en **768–899px** (iPad Mini portrait / tablet vertical) detectado post-P2D: toolbar partida y cards tipo catálogo público con imágenes banner comprimidas.

## Contexto

- **P2D** compactó mobile/tablet pero dejó 768–899px en un híbrido: toolbar row (search izquierda + filtros derecha) y grid 2 columnas con cards verticales/banner.
- **P2F** dejó Products en `READY FOR STAGING QA`; QA manual iPad Mini portrait reportó los problemas anteriores.
- **P2D.1** es fix quirúrgico CSS-only en el rango tablet portrait, sin reabrir desktop ni mobile.

Referencias: P2D, P2F, `admin-products-v1-visual-handoff.md`.

## Archivos modificados

- `components/admin/products/products-toolbar.module.css`
- `components/admin/products/product-grid.module.css`
- `components/admin/products/product-card.module.css`
- `components/admin/products/product-card.tsx` (solo `sizes` attr para thumb 96px)
- `components/admin/products/product-pagination.module.css`
- `components/admin/products/product-catalog-skeleton.module.css`

## Archivos creados

- `docs/admin-products-phase-p2d-1-ipad-mini-portrait-fix.md`

## Cambio principal aplicado

La vista 768–899px deja de quedar en un estado intermedio roto y adopta un patrón tablet portrait específico: search full-width, filtros debajo y cards/lista admin compacta.

## Toolbar tablet portrait fix

`@media (min-width: 768px) and (max-width: 899px)`:

- `.controlsRow` → `grid` 1 columna (anula `flex-direction: row` de ≥768px).
- `.searchWrapper` → `width: 100%`, `max-width: none`.
- Search sin shadow para integrarse a toolbar.

## Filters cluster tablet portrait fix

- `.filtersCluster` → grid integrado debajo del search.
- **768–819px:** categoría full width; stock/estado en 2 columnas.
- **820–899px:** 3 columnas (categoría + stock + estado en fila).
- `clearFilters` → `grid-column: 1 / -1` cuando aplica.
- Padding/gap reducidos; surface más ligera (no panel flotante).

## Product cards tablet portrait fix

- `.cardGrid` → `1fr` (anula grid 2 cols de ≥480px).
- `.card` → layout horizontal `6rem + 1fr`, `min-height: 6rem`.
- Imagen thumbnail lateral (no banner); `object-fit: cover` en altura fija.
- `.content` → grid admin: nombre arriba, precio + Gestionar en fila inferior.
- Badge activo/inactivo permanece en thumb (18px).
- `sizes` image hint: `96px` en ≤899px.

## Category/catalog tablet notes

- Categoría mantiene uppercase 0.8125rem; count muted alineado derecha.
- Métricas catálogo 0.75rem; gaps reducidos.
- Shell Catálogo compacto sin sobredimensionar título.

## Pagination/skeleton notes

- Paginación: row compacta, tipografía 0.75rem en 768–899px.
- Skeleton mobile grid: 1 columna, placeholders `6rem` altura (lista, no banner).

## Desktop preservation

- Breakpoint table/cards **900px** sin cambio.
- `ProductTableView` / `product-table-view.module.css` no tocados.
- Reglas P2B toolbar `≥1024px` y row layout desktop intactas fuera de 768–899px override.

## Mobile preservation

- `<768px` sin cambios de reglas (toolbar column, cards horizontales <480, grid 2 cols 480–767).
- Media queries P2D.1 limitadas a `min-width: 768px`.

## Qué se preservó

- filtros URL
- búsqueda/debounce
- paginación funcional
- create/edit flyouts
- active/inactive behavior
- image pipeline
- desktop table P2C
- header P2A desktop
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
- `products-toolbar.tsx` logic

## Validaciones ejecutadas

- `npm run build`: **pass** (1er intento).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / 16 warnings `@next/next/no-img-element` (baseline sin cambios).

## QA manual recomendado

### iPad Mini portrait / 768–899px

1. Toolbar: summary → search full width → filtros debajo (no layout partido).
2. Filtros legibles, integrados, no panel flotante.
3. Catálogo compacto; métricas inline.
4. Categorías compactas con count alineado.
5. Cards lista admin 1 columna; thumb lateral; sin banner comprimido.
6. Paginación alineada al shell; sin scroll horizontal.

### Mobile 390px regression

7. Toolbar mobile usable; CTA no hero.
8. Cards horizontales compactas.

### Desktop ≥900px regression

9. Tabla P2C, header P2A, toolbar P2B, data surface intactos.

### Functional

10. Búsqueda, filtros, paginación, flyouts, Gestionar, kebab, Ver catálogo.

**Estado:** pendiente staging — no declarar ACCEPTED sin QA manual.

## Riesgos / deuda

- 768–819px usa categoría full + stock/estado 2 cols (820+ usa 3 cols); validar en iPad Mini 768px exacto.
- `display: contents` en `.copy` tablet — verificar accesibilidad/lectores si QA lo reporta.
- QA manual staging sigue pendiente post-P2F.

## Próxima fase recomendada

**P2F.1 — Products Final QA Refresh** — re-ejecutar checklist iPad Mini portrait + promover a ACCEPTED si staging pass.

---

**Handoff date:** 2026-06-06 (P2D.1)
