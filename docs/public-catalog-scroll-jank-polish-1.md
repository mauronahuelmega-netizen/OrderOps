# PUBLIC-CATALOG-SCROLL-JANK-POLISH-1 — Public Catalog Mobile Scroll Smoothness & Glass Cost Reduction

## 1. Estado

```txt
PASS WITH DEVICE QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD base: `9fae258`  
Modo: QA + polish CSS local (sin commit/push/deploy)

## 2. Resumen ejecutivo

Se redujo el costo visual del catálogo público en mobile: `backdrop-filter` eliminado y sombras aligeradas en superficies sticky/fixed (header, category nav, cart bar, hero/cards, modal scrim/header/footer). Desktop restaura glass moderado (≥768px). Preferencias `prefers-reduced-transparency` / `prefers-reduced-motion` agregadas. Smoke local mobile 390px PASS (catálogo, scroll, modal, cart, checkout boundary). Preview local UNVERIFIED (auth). Sin DB/RLS/RPC/cache/checkout action/carrito schema/preview logic.

## 3. Problema atacado

```txt
P2 — scroll/jank glass
```

Costo de composición por blur + sombras grandes en elementos sticky/fixed durante scroll mobile.

## 4. Archivos modificados

**CSS**

- `app/globals.css` — mobile-first solid surfaces; desktop glass restore; a11y prefs
- `components/public/catalog/cart-sheet.module.css` — shadow más liviana en mobile
- `components/public/catalog/customization-modal.module.css` — shadow más liviana en mobile

**Docs**

- `docs/public-catalog-scroll-jank-polish-1.md` (este)
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

**Componentes TSX:** ninguno

## 5. Superficies auditadas

| Surface | Selector/Componente | Efecto costoso | Riesgo mobile | Acción |
| ------- | ------------------- | -------------- | ------------: | ------ |
| Header público | `.public-business-header` | sticky + blur 14px | alto | solid + blur none mobile |
| Hero catálogo | `.catalog-hero` | blur 18px + shadow grande | medio | solid + shadow ligera |
| Category nav | `.catalog-category-nav` | sticky + fade translucente | alto | fondo opaco mobile |
| Category chips | `.catalog-category-chip` | shadow 10/20 | medio | shadow 2/8 |
| Product card | `.catalog-product-card` | blur 18px + shadow | medio | solid + shadow ligera |
| Cart bar | `.catalog-cart-bar` | fixed + blur 18px | alto | solid + blur none |
| Modal overlay | `.catalog-modal-backdrop` | blur 10px | medio | scrim opaco |
| Modal sticky | `.catalog-modal__header/footer` | sticky + blur | medio | solid |
| Drawer overlay/sheet | header portal | blur 4–10px | medio | none mobile |
| Cart sheet / customization modal | `*.module.css` | `shadow-floating` | bajo | shadow reducida mobile |
| Preview pan/cursor | gated modules | n/a público | bajo | no tocado |

## 6. Cambios visuales aplicados

- Mobile-first: `backdrop-filter: none` en hero, cards, cart bar, modal, header, drawer.
- Fondos sólidos (`--catalog-surface-strong` / tokens opacos) en lugar de rgba glass.
- Sombras reducidas (cards/hero/cart/chips).
- Category nav sticky con fondo opaco (sin fade translucente en mobile).
- Desktop ≥768px: blur moderado 6–12px + surfaces translúcidas restauradas.
- `prefers-reduced-transparency: reduce` fuerza blur off.
- `prefers-reduced-motion: reduce` apaga transitions/animaciones no críticas del hero/header.

## 7. Mobile scroll strategy

```txt
fluidez > glass
sticky/fixed sin blur por frame
border + fondo sólido en cards
scrim opaco en modals
shadows pequeñas
```

Viewport emulado verificado: **390px** (`Emulation.setDeviceMetricsOverride`).

## 8. Desktop preservation

A ≥768px se restaura:

- hero/cards blur 12px + `--catalog-shadow`
- cart bar glass 12px
- modal backdrop blur 6px
- header glass 10px
- category nav fade suave

## 9. Preview admin boundary

```txt
No se modificó catalog-preview-mobile-feel / pan / shell / cursor hooks.
CSS público compartido en iframe puede verse más sólido en mobile width — esperado.
Local preview: UNVERIFIED — auth unavailable (/admin/login)
```

## 10. Runtime QA público

Local: `http://localhost:3000/b/demohamburgueseria/catalogo` (390px)

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| 16 productos / 5 categorías | PASS |
| Desde BBQ/Doble Smash | PASS |
| Cover/logo/thumbs | PASS |
| Category nav sticky | PASS |
| Scroll vertical | PASS (manual-observed, sin tirones obvios en emulación) |
| Computed: header/nav/hero/card/cart `backdrop-filter: none` | PASS |
| Modal Papas/Salsas/Agregados/Plus | PASS · backdrop none |
| Cart bar + Ver pedido sheet | PASS |
| Público sin cursor/pan | PASS |
| Pedido real | **NO** |

Viewports 414/768/1024/1440: source-inferred (CSS media + desktop restore); smoke interactivo enfocado en 390.

## 11. Checkout boundary

Local: `/b/demohamburgueseria/checkout`

| Check | Resultado |
|-------|-----------|
| **Enviar pedido** visible | PASS |
| Sin mensaje preview | PASS |
| Pedido enviado | **NO** |

## 12. Preview regression

```txt
UNVERIFIED — auth unavailable (local)
source-level: preview CSS/logic untouched
```

## 13. Performance / scroll sanity

| Señal | Clasificación |
|-------|---------------|
| Computed styles sin blur sticky/fixed mobile | measured |
| Scroll 2× ~600px sin error | manual-observed |
| FPS/long tasks DevTools | unavailable |
| TTFB/DCL claim | no reclamado |

```txt
source-inferred + manual-observed + measured (styles)
```

## 14. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No cache strategy
No cache invalidation
No checkout action
No carrito schema
No preview admin logic
No CSP changes
No pedidos reales
No commit/push/deploy
```

## 15. Resultado de comandos

| Check | Resultado |
|-------|-----------|
| `git branch` / HEAD | `main` @ `9fae258` |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint circular histórico |

## 16. Deuda residual

| ID | Deuda | Severidad |
|----|-------|-----------|
| — | Real Android/iOS device QA | P3 / device |
| — | Preview local auth smoke | P3 |
| — | Desktop glass residual (intencional premium) | P3 visual aceptada |
| P2 | corpus overfetch | P2 |
| P2 | Image Transforms 403 | P2 |
| P2 | slug rename / flag toggle UI | P2 |
| P3 | runtime mutation cache/ordering | P3 |
| P3 | lint circular | P3 |

## 17. Rollback

```bash
git checkout -- \
  app/globals.css \
  components/public/catalog/cart-sheet.module.css \
  components/public/catalog/customization-modal.module.css \
  docs/CURRENT_PHASE.md \
  ORDEROPS_LIVING_MEMORY.md

rm -f docs/public-catalog-scroll-jank-polish-1.md
```

Sin DB rollback.

## 18. Próximo paso

```txt
PUBLIC-CATALOG-SCROLL-JANK-DEPLOY-1
```

Alternativa: `PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1`
