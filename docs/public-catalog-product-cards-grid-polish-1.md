# PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1 — Mobile 2-Column Product Cards & Quick Add Polish

## 1. Estado

**PASS WITH PREVIEW QA DEBT**

## 2. Resumen ejecutivo

Se implementó la segunda fase de conversión del catálogo público: cards mobile en 2 columnas, layout image-first, descripción clamp 2 líneas, tap de card abre detalle, acción rápida `+` (simple → add; customizable → modal), eliminación de “Ver detalle”, sizes de imagen actualizados y padding FAB ajustado. `tsc`/`build` PASS. Preview admin deep no re-validado. Sin DB/RLS/RPC/checkout/create_order/cart schema/cache/Product Customization server/image loader/env/CSP/deploy.

## 3. Contexto de entrada

- Shell/cart: PASS WITH PREVIEW QA DEBT (`PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1`)
- Spec closed: header hide, FAB icon+qty, empty cart hidden
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`

## 4. Preflight

| Campo | Valor |
| ----- | ----- |
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty tree | shell/cart + docs esperados; previousSlug fuera de scope |
| Runtime dirty inesperado | **no** (product-card limpio al inicio) |
| Últimos commits | `5dd9b41` … `fb19a3a` |

## 5. Source audit

**Antes:**

| Ítem | Estado |
| ---- | ------ |
| Layout | 1 col mobile; horizontal thumb 96×92 + copy |
| Memo | `memo(ProductCard)` sí |
| Detail | `role="button"` hit → `onOpenProduct` |
| Simple add | CTA “Agregar” → `onAddProduct` |
| Customizable | CTA “Elegir opciones” → `onAddProduct` → modal |
| Qty | stepper si `quantity > 0` && !custom |
| Ver detalle | botón secundario explícito |
| Image sizes | `114px` fijo |
| Grid | 2 col ≥768; 3 col ≥1024 |

**Baseline 390×844 (fase shell):** ~1 producto útil en primer viewport post-shell.

## 6. Implementación

| Pieza | Path |
| ----- | ---- |
| Card TSX | `components/public/catalog/product-card.tsx` |
| Card CSS module | `components/public/catalog/product-card.module.css` |
| Grid / legacy cleanup | `app/globals.css` |
| FAB padding | `.catalog-page--with-cart` → 100px |

## 7. Mobile 2-column grid

- Default: `repeat(2, minmax(0, 1fr))` gap 12px
- `<360px`: 1 columna
- `:has(> :only-child)`: 1 columna (evita card huérfana a media ancho)
- ≥768: 2 cols; ≥1024: 3 cols
- Sin overflow horizontal medido en 390

## 8. ProductCard image-first layout

- Imagen superior `aspect-ratio: 1 / 1`
- Copy debajo: nombre (clamp 2), descripción (clamp 2), precio
- Quick action absolute bottom-right
- Sin nested `<button>` en `<button>`: hit = `div[role=button]`; `+` sibling

## 9. Quick "+" action

- Lucide `Plus`, 44×44
- Simple: `aria-label="Agregar {name} al pedido"` → `onAddProduct`
- Customizable: `aria-label="Elegir opciones para {name}"` → `onAddProduct` → modal existente
- Si qty > 0 && simple: stepper compacto existente (adaptado visualmente); no stepper nuevo
- Confirmado QA: Combo Chicken add rápido; BBQ Bacon abre customization modal; FAB no incrementa en customizable

## 10. Card tap to detail

- Hit area (imagen/nombre/desc/precio) → `onOpenProduct`
- `+` / stepper: `stopPropagation`
- QA: Combo Clásico detail modal PASS

## 11. Remove "Ver detalle"

- Removido de `product-card.tsx`
- Grep `components/public/catalog` + `app`: **0 matches**
- Detail modal CTA internos intactos

## 12. Description clamp / metadata

- Descripción: `-webkit-line-clamp: 2`
- Nombre: clamp 2 (legibilidad en 2-col)
- Precio siempre visible

## 13. Image sizing / performance

```txt
sizes="(max-width: 359px) 100vw, (max-width: 767px) 50vw, (max-width: 1199px) 33vw, 260px"
```

- `fill` + aspect-ratio estable (sin CLS)
- Lazy default (sin `priority` en thumbs)
- Loader/transforms intactos
- `memo(ProductCard)` preservado

## 14. FAB overlap / shell compatibility

- Padding bottom con items: 100px (antes 88)
- FAB icon+qty sin rediseño
- Header hide / category sticky / hero shell no tocados funcionalmente

## 15. Product detail boundary

- Abre desde card tap; cierra; CTA interna intacta

## 16. Customization modal boundary

- `+` BBQ Bacon abre modal customization
- No add directo (FAB permanece en 2)
- Sin tocar internals del modal / repeated fetch (siguiente fase audit)

## 17. Preview admin boundary

**UNVERIFIED** (sin auth deep smoke esta fase). Source no toca cookie/CSP/guard/postMessage.

## 18. Checkout boundary

Local `/b/demohamburgueseria/checkout`:

- Enviar pedido visible (2 productos)
- No submit / no pedido real

## 19. Runtime/browser QA

| Check | Resultado |
| ----- | --------- |
| 390×844 2-col | PASS (`175px 175px`) |
| Sin Ver detalle | PASS |
| Clamp 2 | PASS |
| Card → detail | PASS |
| + simple add | PASS (FAB 1→2) |
| + customizable modal | PASS |
| FAB icon+qty | PASS |
| Checkout no submit | PASS |
| 360 / 414 / 768 / 1440 | CSS responsive; emulación parcial |
| Android real | deuda previa |
| Cards visibles post-nav multi-product | ~2 fully + partials |

## 20. Performance sanity

- Sin server calls nuevas / fetch por card / scroll
- Memo preservado
- Image sizes actualizados
- Sin framer-motion / deps nuevas

## 21. Accessibility

- `+` ≥44px + aria específica
- Hit `role=button` + keyboard Enter/Space
- Sin button-in-button
- Focus visible en hit y plus

## 22. Seguridad / no-regression

Checklist completo: no DB/RLS/RPC/checkout/create_order/cart schema/cache/customization server/pricing/stock/image loader/env/CSP/PWA/Places/upsell/deps/deploy/commit.

## 23. Resultado de comandos

| Comando | Resultado |
| ------- | --------- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (Compiled successfully) |
| lint | no ejecutado |

## 24. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P3 | Preview admin deep UNVERIFIED | sin auth smoke | Deuda documentada |
| P3 | Real device N/A | entorno | Deuda previa |
| P3 | Primer viewport con categoría 1 producto sigue limitado por hero | 1 card full vía `:only-child` | Cards grid mejora densidad en categorías ≥2 |
| Info | Stepper legacy se mantiene solo si qty>0 simple | adaptado compacto | OK por fase J |

## 25. Deuda residual actualizada

1. Preview admin deep smoke post cards
2. Real device Android
3. Customization modal perf audit → siguiente fase
4. previousSlug uncommitted (previa)
5. Image Transforms FeatureNotEnabled
6. Post-add upsell / checkout polish (roadmap)

## 26. Rollback plan

Revertir solo:

- `product-card.tsx`
- `product-card.module.css`
- cambios grid/padding en `app/globals.css`

No revertir shell/cart hide, cache, customization server, DB, checkout, image loader.

## 27. Próximo paso

**PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1**
