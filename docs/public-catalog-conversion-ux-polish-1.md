# PUBLIC-CATALOG-CONVERSION-UX-POLISH-1 — Public Catalog Shopping Experience & Conversion Clarity

## 1. Estado

```txt
PASS WITH PREVIEW QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD base: `9fae258`  
Modo: polish UX local (sin commit/push/deploy)

## 2. Resumen ejecutivo

Se mejoró la claridad de compra del catálogo público: CTAs diferenciados (`Agregar` vs `Elegir opciones`), microcopy de “Desde”/personalización, estado operativo visible, modal con “Obligatorio”/“Agregar al pedido”, cart bar/sheet más comprensibles y empty states con acentos correctos. Pricing, cart schema, checkout, cache, corpus summary-lite, preview logic y scroll polish intactos. Preview local UNVERIFIED (auth).

## 3. Problema atacado

```txt
claridad de primer vistazo / CTA / Desde / opciones / carrito / empty states
```

## 4. Archivos modificados

**Componentes**

- `components/public/catalog/product-card.tsx`
- `components/public/catalog/product-detail-modal.tsx`
- `components/public/catalog/cart-bar.tsx`
- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/catalog-client.tsx`
- `components/product-customization/shared/customization-option-group.tsx` (label Obligatorio)

**CSS**

- `app/globals.css` (pricing hierarchy, status chip, tap target)
- `components/public/catalog/customization-modal.module.css` (basePrice line-height)

**Docs**

- `docs/public-catalog-conversion-ux-polish-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 5. UX audit

| Surface | Fricción actual | Impacto | Acción |
| ------- | --------------- | ------: | ------ |
| Hero | estado operativo poco visible; accents | medio | status chip open/closed + accents |
| Product card | CTA idéntico para simple/custom; Desde ambiguo | alto | Elegir opciones + hint + Desde muted |
| Detail modal | “Personalizar” / item(s) | alto | Elegir opciones + copy ES |
| Customization modal | “carrito” / Requerido | alto | Armá tu pedido / Obligatorio / Agregar al pedido |
| Cart bar | empty poco claro | medio | Carrito vacío + Total label |
| Cart sheet | path técnico `/b/.../checkout` | medio | Ir a confirmar pedido + helper human |
| Empty states | sin acentos | medio | copy corregido |

## 6. Product card improvements

- CTA: `Agregar` vs `Elegir opciones`
- Hint: `Personalizalo antes de agregar` cuando requiere modal
- `Desde` con peso tipográfico secundario
- `aria-label` descriptivos en CTA/qty/detalle

## 7. Customization modal improvements

- Eyebrow: `Armá tu pedido`
- Base price + guía de opciones obligatorias
- Groups: `Obligatorio` / `Opcional`
- CTA: `Agregar al pedido` / `Actualizar pedido`
- Hint incompleto alineado a “obligatorias”

## 8. Cart bar / cart sheet improvements

- Bar: `Carrito vacío` / `Total $X` / aria Ver pedido
- Sheet: `Revisá tu carrito` · empty explicativo · `Ir a confirmar pedido`
- Removido helper con path técnico `/b/{slug}/checkout`

## 9. Empty states / closed states

- Empty catálogo/categorías: acentos + tono claro
- Status operativo: `Estamos tomando pedidos` / `Por ahora no estamos tomando pedidos` vía `business.on_demand_mode_active` (fresco)

## 10. Accessibility / copy

- aria-labels en CTAs y qty
- status role en hero
- mojibake: no hallado en `components/public`
- accents corregidos en hero/empty fallbacks

## 11. Runtime QA público

Local `:3000` `/b/demohamburgueseria/catalogo`

| Check | Resultado |
|-------|-----------|
| Catálogo 16 productos / 5 categorías | PASS |
| Status “Estamos tomando pedidos” | PASS |
| BBQ/Doble Smash → Elegir opciones + hint | PASS |
| Modal Papas/Salsas/Agregados/Plus + Obligatorio | PASS |
| Cart bar Ver pedido | PASS |
| Cart sheet Revisá / Ir a confirmar | PASS |
| Sin cursor/pan público | PASS |
| Pedido real | **NO** |

## 12. Preview regression

```txt
UNVERIFIED — auth unavailable (local → /admin/login)
preview logic untouched
```

## 13. Checkout boundary

| Check | Resultado |
|-------|-----------|
| **Enviar pedido** visible | PASS |
| Items / adicionales | PASS |
| Pedido enviado | **NO** |

## 14. Mojibake / encoding

```txt
PASS — no matches Ã/Â/â€/� en components/public
```

## 15. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No checkout action
No create_order
No carrito schema
No Product Customization logic (solo labels UI)
No cache strategy
No corpus summary-lite
No image loader/transforms
No preview admin logic
No CSP changes
No pedidos reales
No commit/push/deploy
```

## 16. Resultado de comandos

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint circular histórico |

Dirty previo preservado: scroll polish CSS, corpus TS, transforms/infra docs.

## 17. Deuda residual

| Deuda | Severidad |
|-------|-----------|
| Preview auth smoke | P3 |
| ROADMAP deploy agrupado (scroll+corpus+UX+transforms docs) | P2 deploy |
| Image Transforms FeatureNotEnabled | P2 infra |
| Mutation cache/ordering QA | P3 |
| Lint circular | P3 |

## 18. Rollback

Revisar diff antes de restaurar para no borrar scroll polish / corpus:

```bash
# Solo archivos de esta fase (ajustar si compartidos):
git checkout -- \
  components/public/catalog/product-card.tsx \
  components/public/catalog/product-detail-modal.tsx \
  components/public/catalog/cart-bar.tsx \
  components/public/catalog/cart-sheet.tsx \
  components/public/catalog/customization-modal.tsx \
  components/public/catalog/catalog-client.tsx \
  components/product-customization/shared/customization-option-group.tsx

# globals.css / module.css: restaurar solo hunks de conversion UX, no scroll polish
rm -f docs/public-catalog-conversion-ux-polish-1.md
```

## 19. Próximo paso

```txt
PUBLIC-CATALOG-ROADMAP-DEPLOY-1
```

Alternativa: `PUBLIC-CATALOG-OBSERVABILITY-1`
