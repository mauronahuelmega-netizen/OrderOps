# Admin Products — Phase P2B — Toolbar Surface Alignment

## Objetivo

Convertir la toolbar de `/admin/products` en una superficie enterprise alineada al lenguaje visual del dashboard, manteniendo intacta toda la lógica de filtros/búsqueda URL.

## Contexto

P1 auditó el gap visual legacy. P2A alineó ancho operacional, header compacto y acciones en header. P2B ataca la toolbar: surface tipo form box, tooltip emoji, selects duros y summary poco integrado.

Referencias: `admin-products-visual-audit-p1.md`, `admin-products-phase-p2a-shell-header-alignment.md`, handoff B9.7.

## Archivos modificados

- `components/admin/products/products-toolbar.tsx`
- `components/admin/products/products-toolbar.module.css`
- `app/admin/(protected)/products/loading.tsx`

## Archivos creados

- `docs/admin-products-phase-p2b-toolbar-surface-alignment.md`

## Cambio principal aplicado

ProductsToolbar pasa de caja funcional legacy a superficie de filtrado enterprise, sin cambiar lógica URL ni comportamiento.

## Toolbar surface

- Background `--bg-canvas` (consistente con dashboard toolbar).
- Borde inferior sutil (`color-mix` sobre `--border-subtle`).
- Sin box pesado ni padding horizontal redundante.
- Layout dos filas: summary arriba; controls row abajo (search + filters cluster).

## Summary polish

- `0.875rem`, `font-weight: 600`, `--text-secondary`.
- Sin KPI ni duplicación de header.

## Search polish

- Placeholder: **"Buscar producto o SKU..."**
- Icono `Search` (Lucide) integrado a la izquierda.
- Altura 2.25rem (2.75rem mobile), `border-radius: var(--radius-md)`.
- Focus ring al estilo operational search (`accent-primary` + shadow suave).
- `box-shadow: var(--shadow-sm)` en reposo.

## Filters/selects polish

- Selects nativos conservados (misma semántica y options).
- Agrupados en `.filtersCluster` con border/radius/background suave (patrón `filterCluster` dashboard).
- Hover/focus/active states refinados; active con inset ring sutil.
- Chevron 0.875rem vía `--icon-chevron-down`.

## Clear filters polish

- Estilo ghost pill (sin underline).
- `0.8125rem`, weight 600, hover surface sutil.
- Visible sólo con `hasActiveFilters` (sin cambio de lógica).

## Responsive behavior

| Viewport | Comportamiento |
|----------|----------------|
| Desktop ≥768px | Search flex max 22rem; filters cluster en fila |
| Mobile <768px | Search full width; filters stack en cluster; clear full width |
| Touch | Search min-height 2.75rem en mobile |

## Loading alignment

- `ProductsToolbarSkeleton` exportado desde `products-toolbar.tsx`.
- `loading.tsx` usa skeleton alineado a nueva estructura (summary + search + 3 filter blocks).
- Ya no usa `ProductCatalogSkeleton includeToolbar`.

## Qué se preservó

- filtros URL (`q`, `categoryId`, `stock`, `status`)
- búsqueda con debounce 300ms
- reset `page` al filtrar
- limpiar filtros → `router.push(pathname)`
- paginación
- create/edit flyouts
- Ver catálogo href (en header P2A)
- active/inactive toggle
- tabla/cards actuales
- AdminFooter global
- sidebar
- header operational P2A

## Qué NO se cambió

- DB/schema
- server actions
- product forms
- product table internals
- mobile cards internals
- image pipeline
- checkout público
- dashboard/kanban
- theme tokens/global CSS
- `product-catalog-skeleton.tsx` (toolbar path retirado en loading)

## Validaciones ejecutadas

- `npm run build`: **pass** (1er intento).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / 16 warnings `@next/next/no-img-element` (baseline sin cambios).

## QA manual recomendado

### Desktop

1. Toolbar premium bajo header P2A.
2. Summary sobrio; search con icono; selects legibles.
3. Sin tooltip emoji; limpiar no domina.
4. Tabla/footer sin regresión.

### Functional

5. Search, categoría, stock, estado, limpiar → URL params OK.
6. Paginación OK.

### Tablet/mobile

7. Sin overflow horizontal; search full width; filtros apilados.

**Estado:** pendiente.

## Riesgos / deuda

- Selects siguen siendo nativos (limitación visual cross-browser).
- `ProductCatalogSkeleton includeToolbar` legacy sin actualizar (solo loading migrado).
- Toolbar en desktop ≥768 usa search + cluster en misma fila; en viewports estrechos puede wrap.
- No se creó `AdminToolbarSurface` compartido (deuda extracción futura).

## Próxima fase recomendada

**P2C — Products Table/Data Surface Polish**
