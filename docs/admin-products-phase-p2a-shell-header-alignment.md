# Admin Products — Phase P2A — Shell & Header Alignment

## Objetivo

Alinear la composición superior de `/admin/products` con el estándar visual enterprise del dashboard V1.0: ancho operacional, header compacto, acciones en header y menor doble chrome — sin cambiar lógica de productos.

## Contexto

P1 (`docs/admin-products-visual-audit-p1.md`) documentó que Products funciona bien pero quedó visualmente atrasado: header display landing, shell 1280px vs 1600px operacional, acciones en toolbar y padding redundante.

P2A acota el scope a shell, header, ubicación de acciones y ritmo vertical superior. Toolbar/table polish queda para P2B+.

Referencias: handoff B9.7, sidebar S1/S1.1.

## Archivos modificados

- `app/admin/(protected)/products/page.tsx`
- `app/admin/(protected)/products/loading.tsx`
- `components/admin/admin-page-header.tsx`
- `components/admin/admin-page-header.css`
- `components/admin/admin-page-layout.css`
- `components/admin/products/dashboard-shell.module.css`
- `components/admin/products/products-toolbar.tsx`
- `components/admin/products/products-toolbar.module.css`
- `components/admin/products/products-header-actions.tsx`
- `components/admin/products/products-header-actions.module.css`

## Archivos creados

- `docs/admin-products-phase-p2a-shell-header-alignment.md`

## Cambio principal aplicado

`/products` pasa de composición tipo landing/admin legacy a page shell compacto enterprise alineado visualmente con dashboard V1.0.

## Layout width alignment

- `AdminPageLayout size="wide"` → **`size="operational"`** en products + loading.
- Activa `admin-shell__page-container` **max-width: 1600px** (mismo patrón que dashboard).
- Gap vertical del layout operational reducido: 16px → 18px → 20px (vs 24/28/32 default).

## Header alignment

- Nuevo `AdminPageHeader variant="operational"` (opt-in; default sin cambios).
- Título **1.5rem / 700** (sans), no `--type-display-size` (hasta 3.2rem).
- Eyebrow más muted (0.6875rem).
- Descripción **0.875rem** compacta.
- Acciones alineadas con fila del título en desktop (`padding-top` compensa eyebrow).

## Header actions relocation

- `ProductsHeaderActions` movido a `AdminPageHeader actions`.
- Mismos handlers: `openCreateProduct` / `closeFlyout`, `Ver catálogo` href `/b/{slug}/catalogo`.
- `ProductsToolbar` ya no recibe `businessSlug` ni renderiza `rightActions`.

## Toolbar impact

- Toolbar sólo summary + filtros/búsqueda.
- Eliminado `justify-content: space-between` y columna `rightActions`.
- Padding horizontal del toolbar removido (0 inline) para alinear con shell full width.
- Gap interno summary/filtros reducido (`space-sm`).

## Loading alignment

- `loading.tsx` usa `operational` layout + header `variant="operational"` + copy actualizado.
- Sin acciones en skeleton (no hay provider en loading route).

## Responsive notes

| Viewport | Comportamiento |
|----------|----------------|
| Desktop ≥720px | Título + acciones en fila; acciones alineadas al título |
| Mobile <720px | Acciones stack full width bajo copy |
| Toolbar | Sigue apilando filtros en mobile sin acciones duplicadas |

## Qué se preservó

- lógica de productos
- filtros URL
- búsqueda
- paginación
- create/edit flyouts
- Ver catálogo href
- active/inactive toggle
- tabla/cards actuales
- AdminFooter global
- sidebar

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
- AdminFooter
- Otros usos de `AdminPageHeader` (default variant)

## Validaciones ejecutadas

- `npm run build`: **pass** (1er intento).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / 16 warnings `@next/next/no-img-element` (baseline sin cambios).

## QA manual recomendado

### Desktop

1. `/admin/products` vs `/admin/dashboard` — ancho alineado.
2. Header compacto; acciones en header.
3. Toolbar sin duplicados; filtros/search OK.
4. Tabla visible; footer global alineado.

### Tablet/mobile

5. Acciones sin overflow.
6. Toolbar apila correctamente.
7. Grid mobile OK; sin scroll horizontal inesperado.

### Functional

8. Nuevo producto → flyout.
9. Ver catálogo → href correcto.
10. Filtros URL + paginación + toggle estado.

**Estado:** pendiente.

## Riesgos / deuda

- `AdminPageHeader variant="operational"` disponible para otras páginas; no aplicado fuera products aún.
- Toolbar surface sigue estilo legacy (P2B).
- Table box + padding inferior pendiente (P2C).
- Loading sin skeleton de acciones en header.

## Próxima fase recomendada

**P2B — Products Toolbar Surface Alignment**
