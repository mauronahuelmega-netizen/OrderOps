# PUBLIC-CATALOG-HERO-CONTENT-HIERARCHY-POLISH-1
## Restore Tenant Headline and Align Hero With Product Grid

## Estado

PARTIAL — HERO CONTENT OR VISUAL QA INCOMPLETE

## Contrato recuperado

- `catalog_hero_headline` vuelve como `h1` con fallback exacto `Listo para pedir.`.
- El copy fijo es `Personalizá tu pedido y te lo confirmamos por WhatsApp.`.
- Badge, microcopy configurable, eyebrow, overlay y estado operativo siguen eliminados del Hero.

## Alineación y responsive

- Hero y grilla usan el mismo wrapper público sin padding ni inset propio.
- Browser `390x844`: `heroLeft=14`, `gridLeft=14`, `heroRight=376`, `gridRight=376`.
- Headline con máximo visual de dos líneas, escala `22px` mobile y `28–32px` desktop; copy muted debajo.
- Cover, loader, fallback, alt y geometría mobile de 176px permanecen intactos.

## Validación

- Browser: headline configurado `Hamburguesas smash, papas y extras a tu gusto.` y copy fijo confirmados; HTTP 200.
- TypeScript: PASS.
- Build: PASS, `npm.cmd run build` en 241.7s.
- No se reintrodujeron requests, loaders, campos badge/microcopy ni estado duplicado.

## Dev local browser QA closure

- `BROWSER QA ENVIRONMENT = NEXT DEV LOCAL` mediante `http://localhost:3000/b/demohamburgueseria/catalogo`; la URL alternativa no fue necesaria.
- `390x844` dark: `heroLeft=14`, `heroRight=376`, `gridLeft=14`, `gridRight=376`, media `176px`, sin overflow horizontal y headline en dos líneas visuales.
- `1440x900` light y dark: `heroLeft=180`, `heroRight=1260`, `gridLeft=180`, `gridRight=1260`, sin overflow horizontal.
- El modo se cambió desde el control real de la aplicación y persistió tras recarga. Headline, copy, chip activo, search, cards y contraste light/dark se observaron correctamente.
- El fallback visual de cover se mantuvo dentro de la media; no se reintrodujeron `catalog_hero_badge`, `catalog_hero_microcopy`, `Pedí online`, trust chip, estado operativo ni texto superpuesto configurable.
- Category navigation, búsqueda local y quick add se ejercitaron en una sesión aislada. Abrir `Doble Smash` no alteró el Hero.
- El hallazgo P2 de `Escape` se transfirió a `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-ESCAPE-REGRESSION-FIX-1`. El listener, focus trap y retorno al trigger fueron restaurados; queda una verificación dark-mode del modal por completar en esa fase.
- Console: sin `pageerror`, React ni hydration errors. Se observaron errores `ERR_NETWORK_ACCESS_DENIED` de recursos externos en el sandbox; no se atribuyen al Hero. El único POST observado correspondió a abrir la configuración de `Doble Smash`, no a categorías, búsqueda ni quick add.

## Invariantes y gate

- Sin cambios a cache, admin, DB, actions, preview, categorías, cards, cart, checkout ni success.
- DB changes: 0. RPC/action changes: 0. Package changes: 0. Real orders: 0.
- Commit: no. Push: no. Deploy: no.

```text
QUEUE_GATE: PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1 = BLOCKED
```

El cierre visual de Hero está documentado. El gate permanece bloqueado hasta completar la QA dark-mode del modal de personalización en la fase de regresión transferida.
