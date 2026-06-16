# Admin Products — Phase P2D — Responsive/Mobile Polish

## Objetivo

Cerrar la deuda responsive/mobile de `/admin/products`: compactar header, acciones, toolbar y vista grid/cards en mobile/tablet sin romper desktop P2A/P2B/P2C.

## Contexto

P2E documentó mobile/tablet como pendiente (P2D no ejecutada). QA visual reportó experiencia mobile tipo catálogo público: header alto, CTA dominante, toolbar pesada, bloque Catálogo editorial, categorías hero, cards e-commerce grandes.

Referencias: P1, P2A, P2B, P2C, P2E, `admin-products-v1-visual-handoff.md`.

## Archivos modificados

- `components/admin/admin-page-header.css`
- `components/admin/products/products-header-actions.module.css`
- `components/admin/products/products-toolbar.module.css`
- `components/admin/products/product-grid-server.tsx`
- `components/admin/products/product-grid.module.css`
- `components/admin/products/product-card.tsx`
- `components/admin/products/product-card.module.css`
- `components/admin/products/product-pagination.module.css`
- `components/admin/products/product-catalog-skeleton.tsx`
- `components/admin/products/product-catalog-skeleton.module.css`

## Archivos creados

- `docs/admin-products-phase-p2d-responsive-mobile-polish.md`

## Cambio principal aplicado

`/products` deja de sentirse como catálogo público gigante en mobile/tablet y pasa a una consola admin responsive más compacta.

## Mobile header polish

- `admin-page-header--operational` ≤899px: gap 8px, título 1.25rem, descripción 0.8125rem, acciones con margin-top reducido.
- ≤719px: acciones stack gap 6px.

## Mobile actions polish

- Botones `min-height` 2.25rem / 2rem, font 0.8125rem.
- Mobile: primario full width sin hero height excesivo; ghost secundario full width debajo.
- Tablet 768–899px: acciones en fila.

## Mobile toolbar polish

- Summary 0.8125rem; gaps reducidos.
- `filtersCluster` grid 1 col (mobile) / 2 col stock+estado (≥480px); padding 6px; surface más ligera.
- Search 2.375rem (no 2.75rem); sin shadow mobile.
- Tablet 768–899px: cluster compacto integrado.

## Catalog section polish

- Header: `Catálogo` + subtitle `Por categorías` compacto.
- Métricas en línea con separadores `·`; copy acortado (`activos` / `inactivos` sin "en esta página").
- Shell data-surface style (border, inset highlight).

## Category section polish

- Nested `Card` removido → `<section>` ligero.
- Título uppercase 0.8125rem + count muted inline.
- Gap reducido entre secciones.

## Product card polish

- Mobile (<480px): layout horizontal compacto (thumb 4.5rem + body).
- Tablet: grid 2 cols, imagen ~5.5–6.25rem altura.
- Badge 18px; precio/nombre compactos; `Gestionar` discreto.
- Categoría oculta en card (redundante con header de sección).
- Sin hover lift en mobile.

## Pagination responsive alignment

- Wrapper `.paginationWrap` en grid shell con borde superior.
- `.mobilePagination` sin borde duplicado; tipografía 0.75rem ≤899px.

## Empty/loading responsive alignment

- Skeleton mobile: shell catálogo + header/metrics + grid 1–2 cols compacto.
- Placeholders 4.5rem altura mobile.

## Tablet notes

- 768–899px: 2-column card grid, categorías compactas, toolbar integrada, header balanceado.
- Breakpoint table/cards **sin cambio** (900px).

## Desktop preservation

- Media queries limitadas a `max-width: 899px` / `767px` para header, toolbar, grid, cards.
- Desktop table P2C (`≥900px`) no modificado.
- Toolbar desktop rules (`≥768px` row layout, `≥1024px`) preservadas.

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
- `product-table-view.*`
- `products-toolbar.tsx` logic
- `products-header-actions.tsx` logic

## Validaciones ejecutadas

- `npm run build`: **pass** (1er intento).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / 16 warnings `@next/next/no-img-element` (baseline sin cambios).

## QA manual recomendado

Ver checklist P2D prompt (mobile 390px, tablet 768px, desktop regression 1366px+, functional 30 items).

**Estado:** pendiente staging.

## Riesgos / deuda

- Cards horizontales en mobile muy estrecho (<360px) — validar en QA.
- Toggle iOS en tabla desktop sigue consumer (P3).
- `admin-form-card` + `catalogCard` doble clase — override CSS local.
- Copy métricas acortado (mismos datos).

## Próxima fase recomendada

**P2F — Products Final Cross-device QA & Handoff**
