# PUBLIC-CATALOG-HERO-ASPECT-RATIO-16x9-FIX-1
## Preserve Uploaded Public Catalog Hero Crop Ratio

## Estado

PARTIAL — HERO 16:9 QA INCOMPLETE

## Causa y corrección

- `catalog-shell.module.css` imponía `aspect-ratio: 2 / 1` y `max-height: 176px` en mobile, anulando el contrato `16 / 9` del wrapper visual.
- `heroMedia` ahora usa únicamente `aspect-ratio: 16 / 9` en todos los viewports.
- No quedan reglas mobile de altura fija o `max-height` que contradigan la proporción. La imagen conserva el wrapper de ancho completo, `object-fit: cover`, rail y radio existentes.

## Mediciones

- Ratio contractual por source: `16 / 9` (`1.778`) en mobile y desktop.
- La automatización browser local no pudo finalizar mediciones de cajas antes de expirar durante la compilación Dev. No se declara verificación visual de viewport ni edge del rail en esta corrida.

## Validación

- TypeScript: PASS.
- Build: PASS (`npm.cmd run build`, 206.7s).
- Sin cambios a header, categorías, search, ProductCard, cart, checkout, customization, cache, actions, DB/RPC o packages.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1 = BLOCKED
```

Falta medir el Hero renderizado en un browser estable a `390x844`, `412x914`, `430x932`, `768px` y `1440x900`.
