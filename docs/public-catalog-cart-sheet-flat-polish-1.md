# PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1

## Estado

**PASS — CART SHEET FLAT POLISH VERIFIED**

## Problemas corregidos

| ID | Problema | Resolución |
|----|----------|------------|
| P2-1 | Dark parity ausente (sheet blanco) | Tokens locales `--cart-sheet-*` + override `:global(.catalog-page[data-theme="dark"])` |
| P2-2 | Sombras estáticas | `box-shadow: none`; separación vía backdrop + border |
| P2-3 | Escape / focus trap / foco inicial / return focus | Implementados en `cart-sheet.tsx` (patrón Customization) |
| P2-4 | `aria-describedby` ausente | Meta header como descripción del dialog |
| P2-5 | Hierarchy flat incompleta | Cards/header/footer/qty tokenizados |
| P2-6 | Children indent dark/light | Child rows con tokens `--cart-sheet-child-*` |
| P3-3 | CTA `#fff` hardcoded | `--cart-sheet-accent-foreground` |
| P3-4 | Densidad mobile | Padding/gaps alineados a Post-add |

## Archivos modificados

- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/cart-sheet.module.css`
- `docs/public-catalog-cart-sheet-flat-polish-1.md` (este archivo)

## Dark parity

- Tokens scoped en `.sheet` con fallbacks a `--catalog-*` / semánticos.
- Dark override usa `catalog-surface-strong` + mixes (mismo patrón que Post-add/Customization).
- QA CDP dark: surface oscura, texto `#f8f2e8`, sin superficies blancas internas.
- QA CDP light: `bg rgb(255,255,255)`, texto oscuro, `box-shadow: none`.

## Flat visual system

- Surfaces planas, borders sutiles, radii ~1.15rem / 0.9rem.
- Sin `box-shadow` / sin `--shadow-floating`.
- Backdrop tokenizado; dark backdrop `rgba(0,0,0,0.74)`.
- Icon buttons 2.75rem, precios `nowrap`, safe-area footer.

## Cart hierarchy

- Root card + `displaySummary` preservados (sin filtrar/reordenar).
- Count root-only intacto (`getCartItemCount`).
- Totales vía `getCartItemsTotal` intactos.

## Upsell children

- Label fuente `UPSELL_ASSOCIATED_LABEL` (“Adicional”, uppercase visual).
- Rows indent + accent tokenizado; trash ≥44px.
- Sin stepper child; `lineTotal` sin cambios semánticos.

## Actions / quantity

- Handlers intactos: edit/remove/qty parent/legacy.
- Controles flat tokenizados; focus-visible accent.

## Footer / checkout CTA

- Copy Total / Continuar / helper preservados.
- CTA accent + foreground token.
- `onCheckout` sin cambios (client navigation).

## Empty state

- Copy y “Seguir comprando” preservados; tokenizados dark/light.

## Accessibility

| Feature | Estado |
|---------|--------|
| `aria-labelledby` / `aria-describedby` | Sí |
| Foco inicial en X | Sí (rAF) |
| Escape cierra (once) | Sí |
| Focus trap Tab/Shift+Tab | Sí |
| Return focus | Sí vía `triggerRef` local (activeElement al mount); sin tocar `CatalogClient` |
| Scroll lock compartido | Preservado (`usePublicOverlayScrollLock`) |
| Backdrop close | Preservado |

## QA browser

URL: `http://localhost:3000/b/demohamburgueseria/catalogo`  
Viewport primario: 360×740. CSS responsive cubre 390/430/768/1440.

### Light

PASS — sheet claro, cards claras, CTA accent, sin shadow.

### Dark

PASS — sheet oscuro sólido, children/qty/footer dark, X visible, CTA accent.

### Flujos A-I

| Flujo | Resultado |
|-------|-----------|
| A/B/C | PASS — root + summary; 2 children; total 18400; count “1 producto” |
| D | PASS — remove Coca; Sprite + root permanecen; total 15400 |
| E | PASS — remove root → empty; sin huérfanos; FAB desaparece |
| F | PASS — qty 2 sync Sprite 5800 / total 30800; decrement OK |
| G | PASS — edit restaura selections; Actualizar; Sprite preservado; no post-add |
| H | PASS — `/checkout` navigation; sin pedido real |
| I | PASS — foco X; Escape cierra; overlay lock; describedby |

## Console/network

- Sin errores/hydration bloqueantes observados en flujos.
- Mutaciones cart: 0 server actions.
- Checkout: client navigation.
- Pedidos reales: 0.

## Validación

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS (warning CRLF CSS only) |
| HTTP catalogo/checkout/success | 200 / 200 / 200 |

## Contratos preservados

- Hierarchy / totals / count / signatures / storage scopes.
- `removeSingleCartLine` / `setV2ParentQuantity` / edit/merge semantics.
- Checkout payload no tocado; `CatalogClient` no modificado.
- DB/RPC/actions/packages: 0.

## Deuda aceptada

| Prioridad | Deuda |
|-----------|-------|
| P3 | Re-QA formal multi-viewport device matrix (390/430/768/1440) en session dedicada |
| P3 | Return focus exacto cuando el trigger se desmonta (p.ej. Listo post-add) — fallback seguro si `!isConnected` |
| P3 | Child qty hint visual cuando parent qty>1 (semántica intacta) |

## Gate siguiente

```text
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-FLAT-POLISH-1 = ALLOWED
```
