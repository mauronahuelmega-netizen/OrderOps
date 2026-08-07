# PUBLIC-CATALOG-CATEGORIES-GRID-CARDS-POLISH-1
## Flat Category Navigation, Aligned Product Grid and Shadowless Cards

## Estado

PASS WITH BROWSER INTERACTION QA DEBT - CATEGORIES GRID CARDS POLISH COMPLETE

## Archivos modificados

- `components/public/catalog/category-nav.tsx`
- `components/public/catalog/catalog-client.tsx` (solo display label de seccion)
- `components/public/catalog/product-card.tsx`
- `components/public/catalog/product-card.module.css`
- `app/globals.css` (selectores scoped de categorias, headings y grid)

## Categorias

- `nav`, scroll horizontal, callbacks, IDs, orden, scroll-spy, `aria-pressed`, `Todos` y semantica de filtro con query permanecen intactos.
- Chips flat: 44px, borde neutro, sin sombra, scrollbar oculto sin desactivar scroll y focus-visible con accent del negocio.
- `formatCatalogCategoryName` solo cambia nombres que llegan completamente en mayusculas, usando `es-AR`; chips y encabezados comparten la misma representacion visual sin mutar datos ni corpus de busqueda.

## Titulos, contadores y grilla

- Headings se presentan sin uppercase forzado, con peso semibold y contador muted en segunda linea.
- Grid conserva `repeat(2, minmax(0, 1fr))` en mobile y singleton de una sola columna. Se agrego `align-items: stretch` y gap consistente, sin reglas de expansion ni alturas rigidas.

## ProductCard

- Cards ahora ocupan la altura de su celda y usan flujo flex vertical; media/contenido se mantienen en hit area y precio/accion viven en footer normal, no absoluto.
- Se retiro la sombra de card, plus y quantity control; se preservan borde, surface, overflow, clamp, placeholder, 44px add target y dark mode mediante tokens.
- Quick add conserva `stopPropagation`; Enter/Space, cantidad legacy y ruta de personalizacion no cambiaron.

## Responsive y dark

- Chips, grid y card se apoyan en tokens existentes para light/dark; no hay paleta nueva.
- La estructura evita que titulos de una o dos lineas desplacen precios/acciones y conserva el comportamiento desktop de tres columnas existente.

## Validacion

| Control | Resultado |
| --- | --- |
| TypeScript | PASS - `tsc.cmd --noEmit` |
| Build | PASS - `npm.cmd run build` con acceso de red para `next/font` |
| Catalogo local | PASS - HTTP 200 en instancia preexistente `localhost:3000` |
| Checkout local | PASS - HTTP 200 |
| Success directo | PASS - HTTP 200, sin mutacion |
| Source scope | PASS - sin helpers de dominio, cart, actions, cache ni packages |

## Deuda

- Browser para chips, scroll horizontal, headings, singleton, alineacion de cards, light/dark y focus: UNVERIFIED.
- Quick add simple, apertura/cierre configurable, Cart FAB, network y consola: UNVERIFIED. No se altero localStorage ni se creo pedido.

## Invariantes

- Search/filtros locales, thresholds SMALL/MEDIUM/LARGE, categoria/scroll-spy, ordering, disponibilidad, loader/fallback, cache, customization, post-add, cart, checkout, preview y observabilidad permanecen intactos.
- No DB, migration, RLS/RPC, action, package, ruta QA temporal ni pedido real.

## Gate siguiente

```text
QUEUE_GATE: PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1 = ALLOWED
```
