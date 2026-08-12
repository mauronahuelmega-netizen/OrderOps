# PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1

## Estado

PASS — PUBLIC CATALOG MOTION OVERLAYS IMPL-1 COMPLETE

## Contexto

Fase previa `PUBLIC-CATALOG-MOTION-OVERLAYS-SPEC-1` aprobó motion de overlays empezando por **CartSheet** únicamente. Base commit: `ebfa5b2` (`feat(public-catalog): add tactile motion interactions`). Técnica: CSS Modules + estado React mínimo; sin Framer Motion; sin tocar Customization / Post-add upsell / Product detail.

## Scope

**IN**

- CartSheet backdrop fade enter/exit
- CartSheet surface slide/fade enter/exit
- Delayed unmount mínimo (`CART_SHEET_EXIT_MS = 180`)
- Press transitions en botones internos del CartSheet
- Reduced-motion baseline (CSS + cierre inmediato)
- Preservar scroll lock, Escape, backdrop close, CTA checkout

**OUT**

- Customization modal, Post-add upsell, Product detail modal
- Drag/swipe dismiss, Framer Motion, checkout submit / `create_order`
- `catalog-client.tsx` (no fue necesario)

## Implementation

Delayed close interno en `CartSheet`:

1. `requestClose()` — si `prefers-reduced-motion: reduce` → `onClose()` inmediato; si no → `isClosing=true` + timer 180ms → `finishClose()` → `onClose()`
2. Backdrop click, botón X, Escape y CTA vacío “Seguir comprando” usan `requestClose`
3. CTA “Continuar al checkout” permanece en `onCheckout` (sin delay de exit)
4. `closingRef` evita doble close; cleanup de timer en unmount
5. Clases `backdropClosing` / `sheetClosing` + `data-closing`; `pointer-events: none` durante exit

## Files changed

| File | Change |
|------|--------|
| `components/public/catalog/cart-sheet.tsx` | Delayed unmount + closing classes |
| `components/public/catalog/cart-sheet.module.css` | Enter/exit keyframes, press transitions, PRM |
| `docs/public-catalog-motion-overlays-impl-1.md` | Este documento (nuevo) |

Docs previos untracked (sin tocar runtime):

- `docs/public-catalog-motion-interactions-qa-1.md`
- `docs/public-catalog-motion-overlays-spec-1.md`

## CartSheet delayed unmount

- Constante: `CART_SHEET_EXIT_MS = 180` (rango 140–200ms)
- Helper: `prefersReducedMotion()`
- Estado: `isClosing`, `closingRef`, `closeTimerRef`
- Parent sigue montando/desmontando vía `onClose`; no wiring en `catalog-client.tsx`

## CartSheet enter / exit motion

Clases / keyframes:

- `.backdrop` → `catalogCartSheetBackdropIn` (`--motion-fast`)
- `.sheet` → `catalogCartSheetIn` (`--motion-normal`, `translateY(18px)` → `0` + opacity)
- `.backdropClosing` → `catalogCartSheetBackdropOut` + `pointer-events: none`
- `.sheetClosing` → `catalogCartSheetOut` (`translateY(0)` → `12px` + opacity)

Solo `transform` + `opacity`.

## CartSheet press transitions

Aplicado a `.iconButton`, `.qtyButton`, `.secondaryButton`, `.primaryButton`:

- Transition: transform / background-color / border-color / color (`--motion-fast`)
- `:active` scale `0.97` (primary excluye `:disabled`)

## Reduced motion

CSS `@media (prefers-reduced-motion: reduce)`:

- Animaciones overlay/sheet/closing → `none`
- Transitions de botones → `none`
- `:active` transform → `none`

JS: `requestClose` llama `onClose` inmediato sin timer.

## Scroll lock / focus / Escape

- `usePublicOverlayScrollLock()` sin cambios; lock se mantiene hasta unmount post-exit
- Escape / backdrop / X → `requestClose`
- Focus trap Tab sin cambios estructurales
- Durante closing: `pointer-events: none` (sin `aria-hidden` en exit)

## Validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS (vía `next build` TypeScript + comando) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `npm run lint` | P3 tooling — ESLint 9 circular JSON/`config-validator` (conocido, no bloquea) |
| Otros overlays diff | Vacío |
| `catalog-client.tsx` | Sin diff |

## Browser QA

Ruta: `http://localhost:3000/b/demohamburgueseria/catalogo` (dev server existente).

| Caso | Resultado |
|------|-----------|
| Abrir CartSheet (FAB) | PASS — enter animations presentes (`BackdropIn` / `CartSheetIn`), body `overflow: hidden` |
| Cerrar X | PASS — `data-closing=true`, exit anims, PE none; aún montado ~100ms; unmount ~180–260ms; overflow unlock |
| Backdrop close | PASS |
| Escape | PASS |
| Qty +/− | PASS — cantidad correcta; transition press en botones |
| CTA checkout | PASS — navega a `/b/demohamburgueseria/checkout` sin submit |
| Reduced motion | PASS — anim `none`; cierre inmediato (~27ms); overflow unlock |
| `/` y checkout smoke | PASS (sin branding regression observada) |

Nota: overlay de hydration de Next.js en `public-catalog-page.tsx` (cart SSR/localStorage) es deuda preexistente; fuera de scope IMPL-1.

## Safety

| Item | Count |
|------|-------|
| `create_order` | 0 |
| Pedidos reales | 0 |
| WhatsApp real | 0 |
| DB writes / RPC / actions | 0 |
| Packages / lockfiles | 0 |
| Secrets logged | 0 |
| Checkout submit | 0 |

## Risks / Debt

- P3: ESLint 9 circular config (tooling)
- P3: Hydration warning preexistente en catálogo público (no introducido aquí)
- OVERLAYS-IMPL-2 pendiente para Customization / Upsell / Detail
- Emulación CDP de `prefers-reduced-motion` requerida en automation browser

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-COMMIT-DEPLOY-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-2 = PAUSED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2 = SUPERSEDED
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

Sin commit. Sin push. Sin deploy.
