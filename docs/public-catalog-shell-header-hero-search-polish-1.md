# PUBLIC-CATALOG-SHELL-HEADER-HERO-SEARCH-POLISH-1
## Flat Shell, Shared Header, Hero and Discovery Input

## Estado

PASS WITH BROWSER INTERACTION QA DEBT - SHELL HEADER HERO SEARCH POLISH COMPLETE

## Archivos modificados

- `components/public/business/public-business-header.tsx`
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/catalog-shell.module.css`
- `components/public/catalog/catalog-discovery-controls.tsx`
- `components/public/catalog/catalog-discovery-controls.module.css`
- `app/globals.css` (selectores estrictamente de canvas, hero y header)

## Header

- Se retiro `Pedido online` del header y su duplicado en el drawer.
- El logo ya no usa marco tipo tarjeta; conserva su radio visual.
- El header compartido ya no proyecta sombra y usa separador inferior tenue.
- Usa `business.on_demand_mode_active`, dato ya cargado, para un punto verde accesible cuando esta abierto o punto gris y texto `Cerrado` cuando no acepta pedidos.
- Hide-on-scroll, header estatico de checkout, rutas, menu, preview y theme persistence permanecen intactos.

## Hero

- Hero sin card/sombra externa: la media queda sobre el canvas con radio y borde tenue.
- Se retiro eyebrow, status pill, trust chip, overlay de contraste y copy redundante.
- El copy fijo bajo la media es: `Personaliza tu pedido y te lo confirmamos por WhatsApp.`
- `PublicStorageImage`, priority, sizes, loading skeleton y fallback no cambiaron.

## Search

- MEDIUM deja de tener trigger expandible; MEDIUM/LARGE renderizan el mismo input desde el inicio.
- SMALL conserva la ausencia de search DOM porque `shouldShowSearch` no cambio.
- Input unico con icono de lupa, label accesible `Buscar productos`, placeholder `Buscar productos o categorias`, clear accesible y contador solo con query.
- Query, Escape, filtros, empty state, focus de clear y busqueda local permanecen en `CatalogClient`; no se agregaron requests ni estado persistente.

## Dark y responsive

- Canvas, hero, input y header usan variables existentes; se agregaron overrides dark solo para la media del hero.
- El header mantiene `min-width: 0` y truncado del nombre para convivir con estado y hamburger. El input conserva altura de 44px y clear absoluto para no comprimirlo.

## Validacion

| Control | Resultado |
| --- | --- |
| TypeScript | PASS - `tsc.cmd --noEmit` |
| Build | PASS - `npm.cmd run build` con acceso de red para fuentes `next/font` |
| Catalogo local | PASS - HTTP 200 en instancia preexistente `localhost:3000` |
| Checkout local | PASS - HTTP 200 en instancia preexistente `localhost:3000` |
| Success directo | PASS - HTTP 200, sin mutacion |
| Source scope | PASS - sin helpers, actions, cart, checkout, cache o package changes propios |

## Deuda

- Browser visual e interaccion directa en `390x844`, `430x932`, `768px` y `1440x900`: UNVERIFIED.
- MEDIUM/LARGE en browser, light/dark visual, network funcional y consola: UNVERIFIED.
- El dev server temporal propio no fue usado como evidencia; se detuvo. La instancia `localhost:3000` ya existia y solo se consulto en modo read-only.

## Invariantes

- Search/filtros siguen locales y con cero requests; SMALL no renderiza search DOM.
- Categoria/scroll-spy, datos/ordering, cache, observabilidad, image loader/fallback, customization, post-add, cart, preview, checkout, telefono y autocomplete no se modificaron.
- No DB, migrations, RLS/RPC, actions, packages ni pedidos reales.

## Gate siguiente

```text
QUEUE_GATE: PUBLIC-CATALOG-CATEGORIES-GRID-CARDS-POLISH-1 = ALLOWED
```
