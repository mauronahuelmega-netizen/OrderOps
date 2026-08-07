# PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1
## Flat public menu, consistent navigation and overlay accessibility

## Estado

PARTIAL — BURGER MENU BROWSER QA INCOMPLETE

El cambio de source restaura el contrato de foco del overlay y simplifica la superficie visual. La validacion interactiva visual y de teclado queda pendiente: Playwright esta instalado, pero Chromium no esta disponible y esta fase no autoriza instalarlo.

## Problemas corregidos

- Se elimino el branding duplicado del sheet; el dialogo ahora tiene el titulo discreto `Menu`.
- Se redujeron el alto, padding, radios y sombra del sheet para que dependa de su contenido y no se perciba como una pagina vacia.
- La navegacion, Staff y preferencias usan filas flat consistentes; el activo tiene un indicador accent discreto.
- El boton de cierre mantiene un target de 44px, pero sin burbuja ni sombra decorativa pesada.
- El toggle conserva `ThemeToggle`, `data-catalog-theme` y la persistencia local existente, dentro de una fila compacta `Modo visual / Claro / Oscuro`.

## Accesibilidad del overlay

- `role="dialog"`, `aria-modal="true"` y un nombre accesible mediante `aria-labelledby`.
- Al abrir, el foco se mueve al boton `Cerrar menu`.
- Un unico listener en capture atiende `Escape` y el ciclo `Tab` / `Shift+Tab` dentro del sheet.
- `Escape` previene propagacion y cierra el menu; el cleanup retira el listener, restaura `body.style.overflow` y devuelve foco al trigger hamburguesa.
- El backdrop permanece clickable pero queda fuera del orden de tabulacion.

## Archivos

- `components/public/business/public-business-header.tsx`: refs y lifecycle de foco, markup del dialogo simplificado.
- `app/globals.css`: overrides scoped para el sheet, enlaces, cierre y preferencias flat, con tratamiento dark.

## Validacion

- Source contract: VERIFIED.
- Browser visual, keyboard, console y network: UNVERIFIED IN THIS RUN (`browserType.launch` no encontro el binario Chromium local).
- TypeScript: PASS.
- Build: PASS (`next build`, 151s).
- HTTP local: PASS para catalogo, checkout y success (`200`).
- `git diff --check`: PASS.
- No se modificaron DB, RPC, actions, packages, carrito, checkout ni pedidos reales.

## Gate

QUEUE_GATE: PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1 = BLOCKED

El gate solo puede habilitarse luego de QA browser completa: apertura, foco inicial, Tab, Shift+Tab, Escape, retorno al trigger, scroll lock, light/dark y viewports requeridos.
