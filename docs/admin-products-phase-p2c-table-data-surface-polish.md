# Admin Products — Phase P2C — Table/Data Surface Polish

## Objetivo

Convertir la tabla/listado de productos en una **data surface enterprise** alineada al shell/header/toolbar (P2A/P2B) y al lenguaje visual del dashboard, sin cambiar lógica de productos.

## Contexto

P1 auditó la deuda visual. P2A alineó ancho operacional y header. P2B pulió toolbar. P2C cierra el gap de la superficie de datos: table shell, rows, kebab, paginación integrada y empty/loading consistentes.

Referencias: `admin-products-visual-audit-p1.md`, `admin-products-phase-p2a-shell-header-alignment.md`, `admin-products-phase-p2b-toolbar-surface-alignment.md`.

## Archivos modificados

- `components/admin/products/product-table-view.tsx`
- `components/admin/products/product-table-view.module.css`
- `components/admin/products/product-pagination.tsx`
- `components/admin/products/product-pagination.module.css`
- `components/admin/products/product-catalog-empty-state.tsx`
- `components/admin/products/product-catalog-skeleton.tsx`
- `components/admin/products/product-catalog-skeleton.module.css`

## Archivos creados

- `docs/admin-products-phase-p2c-table-data-surface-polish.md`

## Cambio principal aplicado

ProductTableView pasa de tabla CRUD básica a data surface enterprise, sin cambiar lógica de productos ni acciones.

## Data surface shell

- Nuevo wrapper `.dataSurface`: border sutil, radius md, bg surface, inset highlight.
- `.tableWrap` sin borde propio (integrado en shell).
- Paginación dentro del mismo shell con footer de surface.

## Table header polish

- Headers 0.6875rem, weight 650, letter-spacing 0.06em.
- Background `color-mix` sutil sobre `--bg-surface`.
- Padding vertical compacto.

## Row hierarchy polish

- Row hover surface (`color-mix` 4%).
- Nombre 0.875rem/600 con ellipsis.
- SKU muted 0.6875rem mono, sin uppercase agresivo.
- Separadores de fila más suaves.

## Thumbnail polish

- Tamaño **42×42px**, radius `--radius-sm`, border/surface integrados.
- Placeholder "Sin foto" más compacto.

## Kebab/action polish

- Texto `"..."` reemplazado por **`MoreHorizontal`** (lucide-react, 18px).
- Icon button transparente con hover border/surface sutil.
- `aria-label` preservado.

## Status/toggle integration

- Wrapper `.statusCellInner` con flex align en celda.
- Sin modificar `ProductAvailabilityToggle` ni su CSS.

## Price/category/stock alignment

- `.categoryCell`: secondary 0.8125rem.
- `.priceCell`: tabular-nums, 650 weight.
- `.stockCell`: tabular-nums, 600 weight, secondary.

## Pagination alignment

- Integrada al borde inferior de `.dataSurface`.
- Prop opcional `className` en `ProductPagination`.
- Modificador `.paginationEmbedded` elimina borde duplicado.
- Controles flex compactos; summary muted 0.8125rem.

## Empty/loading alignment

- Empty states (tabla + filtros) dentro de `.dataSurface`.
- Skeleton envuelto en `.dataSurfaceShell` + pagination skeleton al pie.

## Responsive notes

- Breakpoint table/cards **sin cambios** (900px).
- `overflow-x: auto` preservado en table wrap.
- Paginación stack en mobile ≤640px.

## Qué se preservó

- filtros URL
- búsqueda/debounce
- paginación funcional
- create/edit flyouts
- active/inactive toggle behavior
- tabla/cards actuales en comportamiento
- image pipeline (`next/image`, loaders)
- AdminFooter global
- sidebar
- header P2A
- toolbar P2B

## Qué NO se cambió

- DB/schema
- server actions
- product forms
- flyout internals
- mobile cards internals
- checkout público
- dashboard/kanban
- theme tokens/global CSS
- `ProductAvailabilityToggle` component/CSS

## Validaciones ejecutadas

- `npm run build`: **pass** (1er intento).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / 16 warnings `@next/next/no-img-element` (baseline sin cambios).

## QA manual recomendado

### Desktop

1. Header P2A + toolbar P2B intactos.
2. Tabla premium integrada; rows legibles.
3. Kebab icon; toggle funciona; paginación al pie del shell.
4. Footer global una vez.

### Functional

5. Editar desde kebab → flyout.
6. Toggle activo/inactivo.
7. Filtros, búsqueda, paginación URL.

### Tablet/mobile

8. Sin overflow inesperado; cards mobile igual.

**Estado:** pendiente.

## Riesgos / deuda

- Toggle iOS-style sigue visual consumer (componente fuera de scope).
- Stock badges / status pills → P3.
- Mobile grid pagination sigue con estilo standalone fuera de data shell.
- `ProductCatalogEmptyState` importa CSS de `product-table-view` (acoplamiento local aceptable).

## Próxima fase recomendada

**P2D — Products Responsive/Mobile Polish**
