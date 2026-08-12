# PUBLIC-CATALOG-MOTION-OVERLAYS-SPEC-1

## Estado

```text
SPEC COMPLETE — PUBLIC CATALOG MOTION OVERLAYS READY FOR IMPL
```

Branch: `cursor-handoff-public-catalog-ui-redesign` @ `ebfa5b2`
Prerrequisitos: motion interactions audit/spec/impl/qa
Scope: SPEC only — sin runtime/CSS/implementación.

## Contexto

IMPL-1 cerró microinteracciones táctiles (press, badge, FAB, categorías). Los overlays del catálogo siguen montando/desmontando de forma **instantánea**. El header drawer público ya demuestra un lenguaje viable (always-mounted + `--open` + transitions + PRM).

Objetivo de overlays:

```text
premium + fluida + táctil + clara + mobile-first
```

Sin bounce teatral, blur, confetti ni Framer Motion por defecto.

## Preflight

| Check | Resultado |
|-------|-----------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `ebfa5b2` — tactile motion interactions |
| Working tree | limpio salvo `?? docs/public-catalog-motion-interactions-qa-1.md` (autorizado) |
| Runtime/CSS dirty | no |

## Files inspected

| Área | Archivos |
|------|----------|
| Cart | `cart-sheet.tsx` + `.module.css` |
| Custom | `customization-modal.tsx` + `.module.css` |
| Upsell | `post-add-upsell-sheet.tsx` + `.module.css` |
| Detail | `product-detail-modal.tsx` — **sin** `.module.css`; estilos `globals.css` `.catalog-modal*` |
| Orquestación | `catalog-client.tsx` |
| Scroll lock | `public-overlay-scroll-lock.ts` |
| Referencia | `public-business-header.tsx` + drawer en `globals.css` |
| Tokens | `app/theme-tokens.css` (`--motion-*`) |

## Overlay inventory

| Overlay | Archivo | Uso actual | Mount strategy actual | Motion actual | Motion recomendado | Técnica recomendada | Riesgo | Prioridad |
|---------|---------|------------|-----------------------|---------------|--------------------|---------------------|--------|-----------|
| CartSheet | `cart-sheet.*` | Público — FAB / post-confirm / post-upsell | `{cond ? <Sheet/> : null}` | Solo `:active` scale en botones; PRM off transform | Backdrop fade + sheet slide enter/exit; press transition | Delayed unmount **o** open-class; CSS transitions | Medio (scroll lock / focus) | **P1** |
| Customization modal | `customization-modal.*` | Público — product custom / + | Conditional + dynamic `ssr:false` | Solo `ctaPriceBump`; sin open/close | Overlay fade + sheet slide; option select; CTA press armonizado con price bump | Delayed unmount + CSS | Medio-alto (selection state) | **P1/P2** |
| Post-add upsell | `post-add-upsell-sheet.*` | Público — post custom confirm | Conditional + dynamic | PRM stub sin transitions reales | Alinear sheet enter/exit | Delayed unmount + CSS | Medio (handoff → cart) | **P2** |
| Product detail modal | `product-detail-modal.tsx` + globals | Público — open card simple | Conditional | Ninguno | Alinear modal enter/exit; qty press | Delayed unmount + globals mínimos o module nuevo | Bajo-medio (z-index 20) | **P2** |
| Header drawer | header + globals | Público (layout) | Always mounted + `--open` | Opacity + translateX 240–260ms | **Referencia — no tocar en overlays IMPL** | Ya resuelto | — | Ref |

### Preguntas 1–10 (respuestas)

1. **Overlays activos:** CartSheet, CustomizationModal, PostAddUpsellSheet, ProductDetailModal — todos en flujo público vía `catalog-client`.
2. **Mount/unmount:** los cuatro usan render condicional → unmount inmediato al cerrar. Header es always-mounted.
3. **Exit sin refactor grande:** **no** con el modelo actual; hace falta delayed unmount o open-class persistente.
4. **Delayed unmount:** recomendado para los cuatro catalog overlays (mínimo cambio de orquestación).
5. **CSS-only basta:** enter-on-mount sí; exit **no**; press/option feedback sí CSS-only.
6. **Scroll lock / focus:** `usePublicOverlayScrollLock` compartido; Tab trap + Escape + restore focus (upsell no restaura trigger). Sensible — no romper handoff de locks.
7. **Motion compartido:** backdrop opacity + surface `translateY` + fade corto; press `--transition-press`; PRM off.
8. **Fuera de IMPL overlays:** drag-to-close, swipe, row exit complejo, stagger largo, blur, checkout submit anim, Framer, create_order.
9. **PRM solo CSS:** casi; delayed unmount necesita `matchMedia` o saltar wait de exit bajo reduce.
10. **Framer Motion:** **no** por defecto — header prueba CSS; delayed unmount es suficiente.

## Current mount / unmount model

```text
catalog-client state → conditional JSX → mount = visible, unmount = gone
```

Exclusividad aproximada:

```text
customizationSession  → cierra product detail, cart sheet, post-add
postAddOpportunity    → bloquea cart sheet mientras abierto
finishPostAddUpsell   → null opportunity → open cart
```

Scroll lock: contador módulo + `setTimeout(0)` al unlock para handoff entre overlays.

## Current motion model

| Superficie | Motion |
|------------|--------|
| Catalog overlays open/close | **Ninguno** |
| Cart qty/icon | `:active` scale 0.97 **sin** transition |
| Custom CTA price | `ctaPriceBump` 180ms + PRM |
| Upsell | PRM `transition: none` sin transitions |
| Detail | Sin motion en `.catalog-modal*` |
| Header drawer | Referencia completa (opacity + translateX + visibility delay) |

Lenguaje IMPL-1 (press/pop/FAB) ya existe; overlays deben **alinearse** sin duplicar personalidad infantil.

## Decisions

| ID | Decisión |
|----|----------|
| **D1** | Alcance futuro: **C — Overlays complete** (Cart + Custom + Upsell + Detail), implementación **conservadora** |
| **D2** | Personalidad: premium sutil; enter suave; exit más rápido; sin bounce/confetti/blur/spring |
| **D3** | Técnica default: **delayed unmount** + CSS Modules (no open-class refactor masivo en v1) |
| **D4** | Shared language: backdrop fade + surface `translateY`/`opacity` |
| **D5** | Framer Motion: **NO** en overlays IMPL por defecto |
| **D6** | Naming siguiente fase: `PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1` (no reusar IMPL-2 genérico) |
| **D7** | División: CartSheet primero; luego custom/upsell/detail |
| **D8** | Header drawer: **no modificar** — solo referencia |

## Scope for next implementation

### PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1 (recomendada primero)

```text
IN:
- Shared delayed-unmount pattern (helper colocalizado mínimo si hace falta)
- CartSheet backdrop fade + sheet slide enter/exit
- CartSheet qty/icon/CTA press transitions (--transition-press)
- Reduced-motion baseline overlays
OUT:
- Customization / upsell / detail (IMPL-2 overlays)
- Drag/swipe dismiss
- Checkout submit animation
- Framer Motion
```

### PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-2

```text
IN:
- Customization modal open/close + option selected + CTA press (armonía con ctaPriceBump)
- Post-add upsell enter/exit alineado
- Product detail modal enter/exit (+ qty press sutil)
- PRM en cada superficie
```

Justificación del split: CartSheet es el overlay de mayor frecuencia y el más simple para validar delayed unmount + scroll-lock handoff antes de tocar customization (estado de selección) y la cadena post-add → cart.

## Out of scope

```text
- Framer Motion / GSAP / spring packages
- Drag-to-close / swipe gestures
- Row exit/reorder animations
- Stagger > 6 items / delays largos
- Blur/filter / box-shadow animado pesado
- Animar height/width/top/left
- Checkout submit / create_order / WhatsApp / success
- Cambiar lógica cart payload / pricing / overlay exclusivity rules (salvo lo mínimo para closing state)
- Header drawer rewrite
- ProductCard / FAB / category (ya IMPL-1)
```

## Shared overlay motion language

```text
Backdrop:
  enter opacity 0 → 1 · 160–220ms · ease
  exit 1 → 0 · 140–180ms

Surface (sheet from bottom):
  enter translateY(12–20px) → 0 + opacity · 200–260ms
  exit translateY(8–16px) + opacity · 140–200ms
  easing: ease-out enter; ease-in o standard exit

Press (buttons):
  scale 0.96–0.98 · --motion-fast / --transition-press

Tokens:
  Prefer --motion-fast / --motion-normal from theme-tokens.css
```

Reglas físicas:

```text
transform + opacity only
NO width/height/top/left
NO blur/filter
NO heavy animated shadow
```

Delayed unmount:

```text
requestClose → setClosing(true) → play exit → onTransitionEnd|timeout → parent onClose()
Under PRM: skip wait → immediate onClose
Guard: closingRef / ignore double close; keep pointer-events until exit ends OR disable interactivity while closing
```

## CartSheet contract

**Open:** backdrop fade + sheet slide up/fade; sin stagger largo de filas.

**Close:** sheet slide down corto + backdrop fade; Escape/backdrop/X siguen funcionando; no lost clicks.

**Internal (IMPL-1 overlays):**

```text
- qty / icon / primary CTA: transition en :active (no solo snap)
- row enter stagger: opcional, máx 4–6 filas, delay 24–36ms — solo si bajo riesgo
```

**Out:**

```text
row exit complejo, drag-to-close, swipe, checkout success anim, create_order
```

**CTA Continuar:** press scale sutil; navegación a checkout **sin cambio**; no success confetti.

## Customization modal contract

**Open/close:** mismo lenguaje sheet (z-index 80).

**Options:** selected feedback sutil (border/bg/check); sin bounce; no ocultar precio.

**CTA:** press + mantener `ctaPriceBump` existente; no apilar 3 animaciones.

**Close:** salida rápida; no reset accidental de selección por remount prematuro — delayed unmount debe conservar props hasta fin de exit.

**PRM:** sin slide; instant o opacity mínima.

## Post-add upsell contract

```text
- Mismo patrón sheet (z-index 75)
- Abrir tras add: conectado, no invasivo
- Primary/secondary press sutil
- Close → finishPostAddUpsell → cart: respetar handoff scroll-lock
- No forzar compra; no loop; no confetti
```

## Product detail modal contract

```text
- Alinear open/close al lenguaje modal/sheet
- Estilos hoy en globals .catalog-modal* — IMPL puede:
  a) transitions mínimas en globals (solo esas clases), o
  b) migrar a module.css colindante (preferible si el diff es acotado)
- Qty −/+ press sutil
- z-index 20: no pelear stacking con custom/upsell/cart; no subir z-index salvo bug demostrado
```

Prioridad P2 — incluir en OVERLAYS-IMPL-2, no bloquear CartSheet.

## Reduced motion contract

```text
prefers-reduced-motion: reduce:
- no translateY slide
- no stagger
- no bounce
- no long fade (opacity optional ≤ ~80ms or instant)
- delayed unmount wait = 0 / immediate parent close
- focus, Escape, scroll lock, labels intactos
```

CSS `@media (prefers-reduced-motion: reduce)` obligatorio en cada module tocado.
JS `matchMedia` solo para saltar delay de exit.

## Accessibility contract

```text
- Conservar role="dialog" + aria-modal
- Close button + Escape + backdrop dismiss (comportamiento actual)
- Focus trap + restore focus (mejorar upsell restore solo si bajo riesgo / mismo PR)
- No motion como única señal
- Touch targets ≥ actuales
- No romper Tab order durante closing (deshabilitar interacción o mantener trap hasta unmount)
```

## Performance contract

```text
- Solo transform/opacity
- No animar lista completa del cart si hay muchas líneas
- Stagger cap 4–6
- No timers pesados / no rAF loops
- No forzar re-render de toda la grilla del catálogo
- Respetar contain ya presente donde exista
```

## Dependency policy

```text
NO Framer Motion / GSAP / react-spring / auto-animate
NO package.json / lockfile changes
CSS Modules + keyframes/transitions + estado React mínimo (closing)
```

Reevaluación librería solo si delayed unmount falla en 2+ overlays con bugs P1 — fase:

```text
PUBLIC-CATALOG-MOTION-OVERLAYS-LIB-EVAL-1
```

## Component boundaries

### OVERLAYS-IMPL-1 permitidos

```text
components/public/catalog/cart-sheet.tsx
components/public/catalog/cart-sheet.module.css
components/public/catalog/catalog-client.tsx   # solo si hace falta wiring closing (mínimo)
# opcional helper colocalizado: public-overlay-motion.ts (si reduce duplicación)
```

### OVERLAYS-IMPL-2 permitidos

```text
customization-modal.*
post-add-upsell-sheet.*
product-detail-modal.tsx
(+ module nuevo o globals .catalog-modal* mínimo)
catalog-client.tsx  # wiring mínimo
```

### Prohibidos

```text
package.json / lockfiles / supabase / types/database.ts
app/b/[slug]/checkout/* / success/*
app/layout.tsx / app/admin/*
lib/cart/local.ts
create_order actions
public-business-header (salvo bug P0 demostrado — no esperado)
```

## Risks

| Riesgo | Severidad | Componente | Mitigación | Bloquea IMPL-2 overlays |
|--------|-----------|------------|------------|-------------------------|
| Scroll lock regression | P1 | todos | Reusar hook; test handoff custom→upsell→cart | No (mitigar) |
| Focus / Escape regression | P1 | todos | Preservar traps; QA Escape/backdrop | No |
| Closing invisible captura clicks | P1 | delayed unmount | `pointer-events: none` al cerrar o unmount inmediato PRM | No |
| Double close / lost click | P1 | cart/custom | `closingRef` (CartSheet ya tiene patrón cercano) | No |
| Anim vs add-to-cart race | P1 | custom/upsell | No retrasar mutación cart; solo UI exit | No |
| Selection reset por remount | P1 | custom | No unmount hasta exit; props estables | No |
| Checkout CTA / create_order | P0 | cart CTA | Solo press CSS; no tocar nav/submit | Prohibido |
| Perf / jank mobile | P2 | sheets | Timings cortos; no blur | No |
| CSS sprawl / globals abuse | P2 | detail | Prefer module; globals solo `.catalog-modal*` | No |
| PRM ignored | P1 | todos | Media + skip delay | No |
| Over-animated | P2 | todos | Escalas/duraciones de esta SPEC | No |

**Blockers para empezar OVERLAYS-IMPL-1:** ninguno.

## Recommended implementation plan

```text
1. PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1
   - delayed unmount pattern
   - CartSheet open/close + button press
   - PRM
   - QA local (open/close/Escape/scroll/PRM)
   → COMMIT-DEPLOY overlays-1 (fase separada)

2. PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-2
   - Customization + Post-add + Product detail
   - armonía ctaPriceBump
   - QA cadena custom → upsell → cart

3. PUBLIC-CATALOG-MOTION-OVERLAYS-COMMIT-DEPLOY-* según cada IMPL
```

`PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2` queda **SUPERSEDED** por este naming de overlays.

## Future phases

```text
PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1
PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-2
PUBLIC-CATALOG-MOTION-OVERLAYS-LIB-EVAL-1   # solo si necesario
```

Opcional polish: drag-to-dismiss, row exit — backlog explícito, no IMPL-1/2.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2 = SUPERSEDED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-COMMIT-DEPLOY-1 = PAUSED_UNTIL_IMPL
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

```text
SPEC COMPLETE — PUBLIC CATALOG MOTION OVERLAYS READY FOR IMPL
```
