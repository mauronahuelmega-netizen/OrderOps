# PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1 — Header Hide, Sticky Categories & Compact Cart FAB

## 1. Estado

**PASS WITH PREVIEW QA DEBT**

## 2. Resumen ejecutivo

Se implementó el primer bloque de conversión del catálogo público: header hide-on-scroll, categorías sticky con offset dinámico al ocultar header, carrito vacío sin superficie visible, cart FAB compacto (ícono + cantidad, sin total) y hero mobile compacto/premium con copy sobre overlay. Se corrigió un override CSS legacy que pinneaba `category-nav` a `--public-business-header-offset` e ignoraba el estado hide. `tsc` y `build` PASS. Preview admin autenticado no re-validado en esta fase (deuda documentada). Sin DB/RLS/RPC/checkout/create_order/cart schema/cache/image/env/CSP/PWA/deploy/commit.

## 3. Contexto de entrada

- Spec previa: `PUBLIC-CATALOG-CONVERSION-SPEC-CLOSURE-1` → SPEC CLOSED
- Ancla: mobile 390×844 ~1 producto en primer viewport (header ~102 + hero ~404 + nav ~62 + empty cart ~72)
- Deploy base funcional: `fb19a3a`
- Live: `https://orderops.vercel.app`

## 4. Preflight

| Campo | Valor |
| ----- | ----- |
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty tree | docs esperados + patch `previousSlug` local en `app/super-admin/(protected)/actions.ts` + cambios de esta fase |
| Runtime dirty inesperado | **no** (fuera de scope: previousSlug pending OK) |
| Últimos commits | `5dd9b41` docs stamp → `55f866f` roadmap docs → `fb19a3a` polish catalog |

## 5. Source audit

**Antes (baseline audit / medición previa):**

| Superficie | Estado previo |
| ---------- | ------------- |
| Header | sticky; compact `--scrolled` (no hide) |
| Category nav | sticky; `top` ligado a `--public-business-header-offset` fijo |
| Cart empty | barra fija ~72px con “Carrito vacío” |
| Cart con items | bottom bar grande con total / “Ver pedido” |
| Hero mobile | ~404px efectivo |

**Después (390×844 local):**

| Métrica | Valor |
| ------- | ----- |
| Header height (top) | ~102–110px |
| Hero total | ~276px |
| Hero media | ~166px (antes ~404 cover stack) |
| Category nav | ~62px |
| Empty cart surface | **0** (no FAB, no bar) |
| Product headings visibles (aprox.) | ≥2 vs ~1 previo |
| FAB con 1 item | 70×52, texto `1`, aria `Ver pedido, 1 producto` |

## 6. Implementación

| Pieza | Path |
| ----- | ---- |
| Hook hide-on-scroll | `components/public/business/use-hide-on-scroll.ts` |
| CSS vars / event offset | `components/public/business/public-header-visibility.ts` |
| Header wiring | `components/public/business/public-business-header.tsx` + `.module.css` |
| Cart FAB | `components/public/catalog/cart-bar.tsx` + `.module.css` |
| Hero shell | `components/public/catalog/catalog-shell.module.css` + `catalog-client.tsx` |
| Sticky offset CSS | `app/globals.css` (`--public-catalog-category-top`, `--public-catalog-scroll-margin`, padding `--with-cart`) |

## 7. Header hide-on-scroll

- Passive `scroll` + rAF throttle; delta ≥7px; threshold ~36px
- Down → `translateY(-100% - 16px)`; up / near top → visible
- Menu open → hide disabled
- `aria-hidden` + `pointer-events: none` cuando oculto
- `prefers-reduced-motion`: sin transición
- No compact mode (se removió dependencia de compact scrolled para este flujo)

## 8. Category nav sticky / offset

- `--public-catalog-category-top`: header height cuando visible; `0px` cuando hidden
- `--public-catalog-scroll-margin` para `scroll-margin-top` de grupos
- `data-public-header-hidden` en `documentElement`
- **Fix:** override legacy `.catalog-category-nav { top: var(--public-business-header-offset) }` ahora usa `--public-catalog-category-top` (también en media ≥768)
- Active chip + `IntersectionObserver` conservados; tap categoría → título no queda bajo nav (ej. PIZZAS heading top ~226 con nav sticky)

## 9. Empty cart hidden

- `CartBar`: `if (count <= 0) return null`
- Sin “Carrito vacío”, sin FAB con 0, sin padding `--with-cart` cuando vacío
- Cart sheet puede abrirse vacío desde flujos previos; schema/localStorage intactos

## 10. Cart FAB compact

- Solo con `count > 0`
- Lucide `ShoppingCart` + cantidad
- **Sin total**
- `aria-label="Ver pedido, N producto(s)"`
- Tap → abre cart sheet
- Bottom-right; safe-area; min 52px; animación liviana + reduced-motion

## 11. Hero compact premium

**Implementado** (CSS/markup liviano en shell):

- Mobile: `aspect-ratio: 2/1`, `max-height: 220px`
- Copy sobre imagen con degradado (`heroOverlayCopy`)
- Sin CTA obligatorio; sin nuevos datos/imágenes/server calls
- ≥768: vuelve a 16/9 sin max-height forzado

## 12. Preview admin boundary

**UNVERIFIED** en esta fase (sin deep smoke auth re-run).

- Source: header/FAB/offsets no tocan preview cookie/CSP/guard/postMessage
- Deuda: re-smoke `/admin/products/preview` con auth

## 13. Checkout boundary

Local `/b/demohamburgueseria/checkout`:

- 200 / carga OK
- **Enviar pedido** visible con carrito (1× Clásica)
- **No submit** / no pedido real
- Esta fase no cambió checkout action ni `create_order`

## 14. Runtime/browser QA

| Viewport / check | Resultado |
| ---------------- | --------- |
| 390×844 empty cart | FAB ausente PASS |
| 390×844 add item | FAB icon+qty PASS |
| Header scroll down | hidden + `category-top: 0` PASS |
| Header scroll up | visible PASS |
| Category tap + active chip | PASS |
| Customization modal open | PASS (BBQ Bacon) |
| Checkout boundary | PASS (no submit) |
| 414 / 768 / 1440 | emulación parcial; CSS desktop offset fix aplicado |
| Android real | no disponible (deuda previa) |

## 15. Performance sanity

- Sin server calls nuevas del catálogo inicial
- Sin fetch por scroll
- Scroll listener passive + rAF
- Sin framer-motion / deps nuevas
- Cache / image loader / previousSlug wiring no tocados en esta fase (salvo dirty local previo fuera de scope)

## 16. Accessibility

| Check | Estado |
| ----- | ------ |
| FAB aria-label | PASS |
| FAB tap ≥44px | PASS (52px) |
| Header oculto `aria-hidden` + pointer-events none | PASS |
| Hamburguesa (menu open fuerza visible) | PASS |
| Category chips focusables | PASS |
| prefers-reduced-motion | PASS (CSS) |

## 17. Seguridad / no-regression

| Ítem | OK |
| ---- | -- |
| No DB / RLS / RPC / migrations | ✓ |
| No checkout action / create_order / pedidos reales | ✓ |
| No cart schema / localStorage keys | ✓ |
| No Product Customization logic / pricing / stock | ✓ |
| No cache strategy / tags / previousSlug (esta fase) | ✓ |
| No image loader/transforms / Supabase infra | ✓ |
| No Vercel env / CSP / PWA | ✓ |
| No Google Places / new deps / framer-motion | ✓ |
| No deploy / commit / push funcional | ✓ |

## 18. Resultado de comandos

| Comando | Resultado |
| ------- | --------- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (Compiled successfully; Finished TypeScript) |
| `npm run lint` | no ejecutado |

## 19. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P2 (fixed) | Override CSS legacy ignoraba `--public-catalog-category-top` | `globals.css` `top: var(--public-business-header-offset)` | Corregido a cascade con `--public-catalog-category-top` |
| P3 | Preview admin deep QA no re-ejecutado | sin auth smoke esta fase | Deuda → follow-up auth |
| P3 | Real device Android no disponible | entorno sin ADB/hardware | Deuda previa REAL-DEVICE |
| P3 | Cards 2-col / Ver detalle fuera de scope | por diseño | Próxima fase PRODUCT-CARDS-GRID |

## 20. Deuda residual actualizada

1. Preview admin deep smoke post shell/FAB
2. Real device Android Chrome
3. Product cards 2-col + quitar Ver detalle → siguiente fase
4. previousSlug local uncommitted (fase previa)
5. Image Transforms FeatureNotEnabled (infra auth)
6. Lint histórico circular (si aplica)

## 21. Rollback plan

Revertir solo:

- `use-hide-on-scroll.ts`, `public-header-visibility.ts`
- `public-business-header.tsx` + `.module.css`
- `cart-bar.tsx` + `.module.css`
- `catalog-shell.module.css` + cambios hero en `catalog-client.tsx`
- Ajustes `app/globals.css` de category-top / with-cart / scroll-margin

No revertir: cache strategy, Product Customization, DB, checkout.

## 22. Próximo paso

**PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1**
