# PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-1

## Estado

```text
PASS — PUBLIC CATALOG MOTION IMPL-1 COMPLETE
```

Branch: `cursor-handoff-public-catalog-ui-redesign` @ `0a71675` (+ working tree)
Refs: audit + spec motion docs.

## Contexto

IMPL-1 entrega feedback táctil premium en catálogo público (press, badge pop, FAB/count pulse, category transition, PRM), sin librerías ni overlays ni checkout.

## Scope

**IN:** ProductCard `+` press, quantity badge pop, Cart FAB/count pulse, category active transition, scroll PRM gate, reduced-motion.

**OUT:** CartSheet/customization/post-add/detail motion, search/empty/image zoom, Framer Motion, checkout/`create_order`.

## Implementation

| Área | Enfoque |
|------|---------|
| ProductCard press | CSS `:active` scale 0.97 + `--motion-fast` |
| Badge pop | `useEffect` qty↑ → `quantityPopKey`; class `quantityBadgePop` keyframes |
| Cart FAB | Pulse en superficie interna (`fabMotionSurface`) si `prevCount > 0 && count > prev`; skip en primer mount / 0→N (enter existente) |
| Category | `transition` bg/color/border/transform en `.catalog-category-chip` (globals) |
| Scroll | `getMotionAwareScrollBehavior()` en `catalog-client` |
| PRM | Media queries modules + globals; scroll `auto` |

## Files changed

| File | Change |
|------|--------|
| `product-card.tsx` | qty pop key effect |
| `product-card.module.css` | press + badge keyframes + PRM |
| `cart-bar.tsx` | increment pulse state (hooks antes de early return) |
| `cart-bar.module.css` | fabPulse / countPop + PRM |
| `catalog-client.tsx` | scroll behavior gate |
| `app/globals.css` | category chip transition + PRM |
| `docs/public-catalog-motion-interactions-impl-1.md` | este doc |

## ProductCard motion

- Press en `.plus` (custom y simple).
- Pop solo si `quantity > previousQuantity` tras mount (no pop en hydrate de carrito persistido).
- Custom path: press sí; sin pop si qty no sube (abre modal vía parent).

## Cart FAB / count motion

- Enter `catalogCartFabIn` se mantiene.
- Pulse en hijo interno para no pelear transform del enter.
- Pulse solo cuando FAB ya visible (`previousCount > 0`) y count sube.

## Category transition

- Transición suave en chips globales (ya vivían en `globals.css`).
- Sin sliding indicator / layout shift.
- `:active` scale 0.98; off bajo PRM.

## Reduced motion

| Control | Comportamiento |
|---------|----------------|
| CSS modules | pop/pulse/press off |
| globals chips | transition/transform off |
| scroll | `auto` si `matchMedia('(prefers-reduced-motion: reduce)')` |
| focus / aria / estado | intactos |

## Validation

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `npm run lint` | P3 tooling ESLint 9 circular (conocido) |
| Packages nuevos | 0 |
| Overlays / checkout / cart local | untouched |

## Browser QA

Local `http://localhost:3000/b/demohamburgueseria/catalogo` — sin submit/pedido/WhatsApp.

| Acción | Resultado |
|--------|-----------|
| Tap `+` Coca Cola (simple) | Qty label → 1; badge con clase `quantityBadgePop`; FAB count 2→3; clase `fabPulse` observada |
| Incremento con FAB ya montado | Pulse class aplicada |
| Tap custom BBQ Bacon | No incrementó count FAB (sin pulse falso) |
| Category CSS | Transition rules presentes; en este browser `prefers-reduced-motion: reduce === true` → computed `transition: none` (correcto) |
| Cart FAB open | No tocado sheet motion |
| `/` / admin | No modificados en diff |

**Reduced-motion QA:** entorno de automation reportó `prm: true`. Clases motion se aplican; animaciones CSS desactivadas por media query — comportamiento esperado. Gate JS de scroll presente en código.

## Safety

```text
create_order: 0
pedidos reales: 0
WhatsApp real: 0
DB writes: 0
secrets: 0
packages: 0
commit/push/deploy: 0
```

## Risks / Debt

| Item | Sev | Notas |
|------|-----|-------|
| Browser automation con PRM always-on | P3 | Validación visual de pops en device sin PRM recomendable en COMMIT-DEPLOY |
| ESLint 9 circular | P3 | Tooling |
| Overlays | — | IMPL-2 |

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-COMMIT-DEPLOY-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2 = PAUSED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-SPEC-1 = OPTIONAL_NEXT
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

```text
PASS — PUBLIC CATALOG MOTION IMPL-1 COMPLETE
```
