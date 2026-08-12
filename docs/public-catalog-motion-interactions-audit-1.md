# PUBLIC-CATALOG-MOTION-INTERACTIONS-AUDIT-1

## Estado

```text
AUDIT COMPLETE — PUBLIC CATALOG MOTION READY FOR SPEC
```

Branch: `cursor-handoff-public-catalog-ui-redesign` @ `0a71675`
Scope: audit + documentation only (no CSS/runtime implementation).

## Contexto

El catálogo público está visualmente sólido en producción. El producto quiere una capa de microinteracción:

```text
rápida + táctil + premium + divertida + mobile-first
```

Sin decoración aleatoria: cada motion debe reforzar causa → efecto (tap → add → carrito vivo), sin infantilizar ni degradar performance/accesibilidad.

## Preflight

| Check | Resultado |
|-------|-----------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `0a71675` — `feat(public): add tenant browser branding` |
| Working tree (inicio) | limpio |
| Runtime/CSS/commit/push/deploy | no ejecutados |

## Files inspected

| Área | Archivos |
|------|----------|
| Rutas | `app/b/[slug]/page.tsx`, `catalogo/page.tsx`, `layout.tsx` |
| Orquestador | `components/public/catalog/catalog-client.tsx` |
| Cards | `product-card.tsx` + `.module.css` |
| Nav / search | `category-nav.tsx`, `catalog-discovery-controls.tsx` + `.module.css` |
| Cart | `cart-bar.tsx` + `.module.css`, `cart-sheet.tsx` + `.module.css` |
| Custom / upsell | `customization-modal.tsx` + `.module.css`, `post-add-upsell-sheet.tsx` + `.module.css` |
| Detail | `product-detail-modal.tsx` |
| Header | `components/public/business/public-business-header.tsx` (+ globals drawer) |
| Cart lib | `lib/cart/local.ts` |
| Global / tokens | `app/globals.css`, `app/theme-tokens.css` |
| Packages | `package.json` — **sin** framer-motion / gsap / spring / anime |

## Current interaction map

| Componente | Acción | Archivo | Estado actual | Feedback actual | Oportunidad motion | CSS-only o React state | Riesgo | Prioridad |
|------------|--------|---------|---------------|-----------------|--------------------|------------------------|--------|-----------|
| ProductCard `+` | Quick-add / open custom | `product-card.tsx` | Funcional | Sin press/pop; solo focus-visible | Press scale + add pop | CSS + state mínimo | Bajo | **P1** |
| ProductCard badge | Qty visible | `product-card.module.css` | Estático | Aparece/cambia sin animar | Badge pop al cambiar qty | React state (key/class) | Bajo | **P1** |
| ProductCard open | Tap card / custom | `product-card.tsx` | Abre modal | Sin press en `.hit` | Press scale sutil en `.hit` | CSS-only | Bajo | **P2** |
| ProductCard imagen | Visual | `.media` | Estático | Ninguno | Micro zoom opcional | CSS-only | Medio (CLS) | **P3** |
| Category pills | Select + scroll | `category-nav.tsx` + globals | Active swap instantáneo | `scrollIntoView({smooth})` | Transition active pill | CSS-only | Bajo | **P1** |
| Search | Focus / clear | `catalog-discovery-controls.tsx` | Funcional | Outline focus; `aria-live` count | Focus/clear soft | CSS-only | Bajo | **P3** |
| Cart FAB | Open cart | `cart-bar.tsx` | Enter anim 200ms al montar | Sin pulse al incrementar | Count pop / pulse on add | React state | Bajo | **P1** |
| Cart count | Número | `.count` | Texto estático | Sin flip/pop | Scale pop al cambiar | React state | Bajo | **P1** |
| CartSheet | Open/close | `cart-sheet.tsx` | Mount/unmount | Instantáneo | Overlay fade + sheet slide | CSS + open class | Medio (scroll lock) | **P2** |
| CartSheet row | Qty +/− | `.qtyButton` | `:active` scale 0.97 **sin** transition | Instantáneo | Añadir `--transition-press` | CSS-only | Bajo | **P2** |
| CartSheet remove | Remove line | `.iconButton` | Idem | Instantáneo | Press + row exit opcional | CSS / state | Medio | **P2** |
| CartSheet CTA | Checkout nav | `onCheckout` | Navega a checkout | Sin press polish | Press scale (no success confetti) | CSS-only | Bajo | **P2** |
| Customization modal | Open/close | `customization-modal.tsx` | Instantáneo | Solo `ctaPriceBump` en precio | Sheet enter + option select | CSS/state | Medio | **P2** |
| Customization options | Select | shared option group | Toggle estado | Sin feedback motion | Selected check/scale | CSS-only | Bajo | **P2** |
| Customization CTA | Add to cart | `handleConfirm` | Cierra + add | Price bump existe | CTA press + success flash | CSS + state | Bajo | **P2** |
| Post-add upsell | Sheet | `post-add-upsell-sheet.tsx` | Funcional | PRM stub sin transitions reales | Enter/exit coherente con sheets | CSS | Medio | **P2** |
| Header menu | Drawer | `public-business-header` + globals | **Ya animado** | Overlay/sheet/links transitions | Mantener; no reinventar | — | — | **P3** (referencia) |
| Scroll-to-category | Smooth scroll | `catalog-client.tsx` | `behavior: "smooth"` | No gated por PRM | Respetar reduced-motion | JS check | Bajo | **P2** |
| Empty / no-results | States | `catalog-client` + globals | Estático | Ninguno | Fade sutil opcional | CSS | Bajo | **P3** |
| Product detail modal | Qty modal | `product-detail-modal.tsx` | Instantáneo | `aria-live` qty | Enter/exit alineado sheets | CSS | Medio | **P2** |
| Theme toggle | Theme | `theme-toggle` + globals | Thumb 180ms | Ya hay | No tocar en IMPL-1 | — | — | **P3** |

## Current motion / transition inventory

### Ya existe (lenguaje parcial)

| Lugar | Motion | Duración |
|-------|--------|----------|
| Cart FAB mount | `catalogCartFabIn` opacity+scale+translateY | 200ms |
| Customization CTA price | `ctaPriceBump` scale | 180ms |
| Hero cover | fade/scale + shimmer (loop skeleton) | ~220ms / 1.4s |
| Theme switch thumb | transform | 180ms |
| Public header drawer | overlay/sheet/menu — el más completo | ~160–260ms |
| CartSheet qty/icon | `:active { transform: scale(0.97) }` | **sin** `transition` |
| Tokens globales | `--motion-fast/normal/slow`, `--transition-hover/focus/press` en `theme-tokens.css` | 160/220/320ms |

### Gaps

- ProductCard / category chips / search: casi **cero** motion.
- Overlays (cart, customization, post-add, detail): mount/unmount **sin** enter/exit (header drawer es la excepción).
- Tokens de motion **existen** pero módulos de catálogo usan ms hardcodeados o nada.
- Lenguaje **disperso**, no centralizado en el catálogo; duraciones 160–260ms ya son un buen rango a unificar.

## Browser audit

Producción `https://orderops.vercel.app/b/demohamburgueseria/catalogo` — sin checkout submit / pedidos / WhatsApp.

| Acción | Observación |
|--------|-------------|
| Tap `+` Coca Cola | Qty badge aparece + FAB “Ver pedido, 1 producto”; **sin** press/pop perceptible |
| Causa→efecto | Estado correcto (a11y label actualiza) pero sensación **seca** |
| FAB | Aparece al primer item (enter animation sí); incrementos posteriores sin pulse |
| Categorías | Swap visual instantáneo; scroll smooth entre secciones |
| Custom BBQ Bacon | Abre modal (sin probar submit); open se siente abrupto vs header drawer |
| Cart FAB open | Sheet aparece de golpe (sin slide/fade) |

**Bien hoy:** claridad de estado, focus labels, header drawer premium, FAB enter, price bump en custom CTA.

**Seco:** quick-add, badge, category active, sheet open/close, option select.

**Confuso potencial si se exagera:** doble feedback (badge + FAB + toast) que parezca doble add.

**Calidad:** press táctil + pop de count es el mayor ROI.

**Molesto si se exagera:** bounce infantil, stagger largo en grids, loops, blur.

Checkout/success no animados en esta auditoría (fuera de scope de catálogo; visited only for boundary awareness).

## Motion opportunity matrix

| ID | Superficie | Acción | Problema UX | Motion recomendado | Tipo | Riesgo | Prioridad | Fase sugerida |
|----|------------|--------|-------------|--------------------|------|--------|-----------|---------------|
| M1 | ProductCard `+` | Quick-add | Tap sin respuesta táctil | Press scale 0.96–0.98 + brief pop | CSS + state | Bajo | P1 | **IMPL-1** |
| M2 | ProductCard badge | Qty change | Badge aparece “muerto” | Scale pop 1.06–1.08 al cambiar | State class | Bajo | P1 | **IMPL-1** |
| M3 | Cart FAB / count | Count up | Incremento no se siente | Pulse/count pop | State | Bajo | P1 | **IMPL-1** |
| M4 | Category pills | Active | Swap seco | Background/color transition | CSS | Bajo | P1 | **IMPL-1** |
| M5 | Reduced-motion baseline | Global catalog | Scroll smooth / futuros pops | Gate PRM + tokens | CSS/JS | Bajo | P1 | **IMPL-1** |
| M6 | CartSheet | Open/close | Instant mount | Overlay fade + sheet slide | CSS/state | Medio | P2 | **IMPL-2** |
| M7 | CartSheet qty | +/− | Active sin transition | `--transition-press` | CSS | Bajo | P2 | **IMPL-2** |
| M8 | Customization modal | Open/options/CTA | Abrupto; options secas | Enter + selected + CTA press | CSS/state | Medio | P2 | **IMPL-2** |
| M9 | Post-add upsell | Sheet | Sin enter real | Alinear a sheet language | CSS | Medio | P2 | **IMPL-2** |
| M10 | ProductCard `.hit` | Open | Sin press | Scale press sutil | CSS | Bajo | P2 | **IMPL-2** |
| M11 | Search | Focus/clear | Mínimo | Soft focus/clear | CSS | Bajo | P3 | **IMPL-3** |
| M12 | Empty states | Appear | Estático | Fade opcional | CSS | Bajo | P3 | **IMPL-3** |
| M13 | Image micro-zoom | Hover/press | — | Evitar en MVP mobile | CSS | Medio CLS | P3 | Optional |
| M14 | Checkout / create_order | Submit | — | **No animar** | — | P0 | **P0** | Out |

## CSS-only vs React-state classification

### CSS-only (MVP preferido)

- ProductCard / hit / `+` `:active` press (`transform` + `--transition-press`)
- Category active pill transition (globals o module colindante — SPEC debe respetar regla CSS modular)
- CartSheet / modal button press transitions
- Search focus ring soft
- Overlay enter/exit **si** se usa clase `data-open` / CSS `@starting-style` o mount con clase — SPEC elige patrón

### React state needed

- Badge pop cuando `quantity` cambia (class `is-popping` + timeout o CSS animation on key)
- Cart FAB / count pulse cuando `cartCount` incrementa
- “Last added” highlight opcional (no MVP)
- Sheet item enter stagger (IMPL-2, limitado)
- Modal add-success flash breve

### No packages

```text
No framer-motion / gsap / spring para MVP.
CSS modules + keyframes + estado mínimo React.
Reutilizar --motion-* / --transition-* de theme-tokens.css.
```

## Recommended motion principles

```text
1. Feedback < 200ms en taps (duration-fast ~120–160ms).
2. Solo transform + opacity (nunca width/height/top/left).
3. Escala press 0.96–0.98; pop 1.04–1.08.
4. Un “momento” por acción (no badge + FAB + confetti a la vez).
5. Divertido ≠ infantil: sin bounce excesivo, sin loops.
6. Unificar con tokens existentes (--motion-fast/normal/slow).
7. Mobile-first; desktop hover es plus, no requisito.
8. Reduced motion: estado instantáneo, sin pop/slide.
```

Tokens futuros (SPEC; pueden mapear a existentes):

```text
duration-fast: 120–160ms  → prefer --motion-fast
duration-base: 180–220ms  → --motion-normal
duration-soft: 240ms
duration-sheet: 260ms
ease-standard / ease-emphasized
scale-press: 0.96–0.98
scale-pop: 1.04–1.08
```

**Preferencia tokens:** reutilizar `theme-tokens.css` (ya hay `--motion-*`); módulos catalog importan variables, no hardcodean nuevos valores dispersos. No spamear `globals.css` con estilos de componente (regla del repo).

## Reduced motion findings

| Existe hoy | Dónde |
|------------|-------|
| Sí (parcial) | globals hero/header/theme; cart-bar FAB; cart-sheet active; customization price bump; product-card stub; post-add stub; header module |

Gaps:

- `scrollIntoView({ behavior: "smooth" })` **no** respeta PRM.
- ProductCard PRM solo quita `box-shadow` del `+` (no hay animaciones reales aún).
- Post-add declara `transition: none` sin transitions definidas.

Regla futura:

```text
Si prefers-reduced-motion: reduce
- sin bounce / pop / slide largo
- cambios de estado instantáneos
- FAB enter off (ya)
- scroll: behavior "auto"
- feedback mínimo: focus rings + estado textual / aria-live
```

## Performance analysis

| Sensible | Nota |
|----------|------|
| Grid 2 cols mobile | No animar lista completa; solo card tocada / badge |
| `CatalogClient` setCart | Re-render parent; `ProductCard` es `memo` — aprovechar; no forzar reflow global |
| Cart FAB fixed | OK animar transform; `contain: layout style paint` ya |
| Sheets / modal | Animar transform/opacity; no height; respetar scroll-lock existente |
| Category sticky | Transition color/bg barata; no layout |
| Search | Barata |
| Evitar | blur/filter animados, box-shadow animado pesado, width/height, stagger >5 items |

## Accessibility analysis

| Tema | Hallazgo / recomendación |
|------|--------------------------|
| focus-visible | Ya en ProductCard hit, FAB, varios botones — mantener |
| aria-live | Search results, cart qty, detail qty — **no** en badge ProductCard / FAB count; IMPL puede considerar live sutil o confiar en labels actualizados |
| Keyboard | Cards con keydown open; no romper |
| Touch targets | Qty 2.75rem OK |
| Color-only | Motion no debe ser única señal; badge número permanece |
| Reduced motion | Obligatorio en SPEC/IMPL |
| Vestibular | Sin parallax / loops / slides largos |

## Dark / light parity

- FAB / badge ya tienen variantes dark (`html[data-catalog-theme="dark"]`).
- Evitar glow/halo animado fuerte en dark (halo FAB ya existe estático — no pulsar con blur).
- Press/pop en `transform` es theme-agnostic — preferido.
- Contraste: no bajar opacity de CTAs durante feedback.
- Category active: transition de color/bg debe usar tokens `--business-primary` ya usados.

## Do-not-animate list

```text
P0 / out of scope:
- checkout submit / create_order RPC
- WhatsApp handoff
- éxito de pedido / success page (otra fase)
- animar precio/total de forma que parezca inconsistente
- skeleton loops nuevos que retrasen percepción de carga
- scroll hijacking / animaciones permanentes
- preview-only pan/cursor (admin) — no mezclar en public MVP
- confetti / partículas
```

## Risks

| Riesgo | Severidad | Componente | Mitigación | Bloquea spec |
|--------|-----------|------------|------------|--------------|
| Layout shift por animar size/top | P1 | ProductCard / sheets | Solo transform/opacity | No |
| Re-render + animar toda la grilla | P1 | CatalogClient | Animar badge/FAB local; memo | No |
| Reduced-motion roto | P1 | scroll + pops | Gate PRM en SPEC | No |
| Feedback = doble add percibido | P1 | + / FAB | Un pop primario por acción | No |
| Animar checkout/create_order | P0 | checkout | Fuera de scope | No (prohibido) |
| Exceso infantil | P2 | pops | Escalas cortas, 1 bounce max | No |
| Perf mobile baja | P2 | grid | Cap concurrent animations | No |
| CSS module sprawl / globals abuse | P2 | styles | Module CSS + tokens; no globals salvo category ya allí | No |
| Interferir scroll sheet/modal | P2 | overlays | No animar scrollTop; short enter | No |

**Blockers para SPEC:** ninguno.

## Recommended implementation phases

### SPEC siguiente

```text
PUBLIC-CATALOG-MOTION-INTERACTIONS-SPEC-1
```

### División IMPL (preferida)

```text
IMPL-1 — High-impact tactile (MVP):
- ProductCard + press / add pop
- quantity badge pop
- Cart FAB / count pulse on increment
- category active transition
- reduced-motion baseline (incl. scroll smooth gate)
- reutilizar theme-tokens --motion-*

IMPL-2 — Overlay polish:
- CartSheet open/close + qty press transitions
- Customization modal enter / option selected / CTA press
- Post-add upsell enter/exit alineado
- Product detail modal enter (opcional bundle)

IMPL-3 — Optional:
- search polish
- empty states fade
- card hit press / image micro (si no CLS)
```

No empaquetar todo en una sola IMPL: overlays + grid feedback aumentan riesgo de regresión scroll/lock.

## Out of scope

- Implementar animaciones en esta fase
- Checkout / create_order / WhatsApp / DB / packages
- Nuevas librerías de motion
- Commit / push / deploy
- Cambiar lógica de carrito o reconciliación

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-SPEC-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-1 = PAUSED_UNTIL_SPEC
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

```text
AUDIT COMPLETE — PUBLIC CATALOG MOTION READY FOR SPEC
```
