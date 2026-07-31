# PUBLIC-CATALOG-CART-SHEET-USABILITY-1 — Mobile Cart Sheet Hierarchy, Controls & Checkout Readiness

## 1. Estado

**PASS WITH PREVIEW QA DEBT**

## 2. Resumen ejecutivo

Se transformó el cart sheet público en una superficie mobile compacta y clara: header “Tu pedido” + conteo, filas jerárquicas (simple / V2 parent + `displaySummary` / upsell child), controles iconográficos (lucide ya instalado), stepper tocable, footer sticky con Total + “Continuar al checkout”, y empty state “Tu pedido está vacío” + “Seguir comprando”. Callbacks, cart schema, pricing y checkout destination se preservaron. Acciones locales: **0** Next-Action POST. Preview admin deep: UNVERIFIED.

## 3. Preflight

| Campo | Valor |
| ----- | ----- |
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty esperado | shell/cards/modal perf+ux/docs |
| Prior known | `app/super-admin/(protected)/actions.ts` |
| Dirty checkout/create_order/migrations/lib/cart | **no** |

## 4. Source audit

| Pregunta | Hallazgo |
| -------- | -------- |
| Open/close | FAB → `setIsCartSheetOpen(true)`; backdrop / X / Seguir comprando → `onClose` |
| Item count FAB | `getCartItemCount(items)` = suma de `quantity` de todas las líneas |
| Total | `getCartItemsTotal` (legacy `price*qty`, V2 `lineTotal`) |
| Simple vs V2 | `buildHierarchicalCartRows` → `legacy` \| `customized` |
| Parent config | `parent.displaySummary` customer-facing |
| Upsell | children `itemKind=upsell` bajo parent; label `UPSELL_ASSOCIATED_LABEL` (“Adicional”) |
| Qty=1 decrement | legacy/`setV2ParentQuantity` con `quantity<=0` elimina línea (y children si parent) |
| Edit | `handleEditParent` → modal con `editingCartLineId` + `selectionStateFromCartParent` |
| Checkout | `router.push(/b/{slug}/checkout)` o preview path |
| Preview | cart scope `preview`; checkout CTA disabled server-side en preview |
| Icons | `lucide-react` ya en uso (cart-bar, product-card) |

## 5. Modelo de carrito encontrado

Sin cambios. `LocalCartItem` / `LocalCartItemV2`, signatures, localStorage keys y `mergeCustomizedSelectionIntoCart` intactos.

## 6. Archivos creados

- `docs/public-catalog-cart-sheet-usability-1.md`

## 7. Archivos modificados

- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/cart-sheet.module.css`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 8. Sheet shell

Bottom sheet existente · max-height · scroll interno · header/footer flex-shrink · safe-area · sin drag handle falso · sin blur costoso · tokens semánticos.

## 9. Header

- Título: **Tu pedido**
- Meta: `N productos` vía `getCartItemCount` (misma semántica FAB) o “Sin productos”
- Close: icono X · `aria-label="Cerrar carrito"` · 44×44

## 10. Jerarquía de items

Cards por raíz · nombre + line total · summary secondary · upsell subordinado · acciones + stepper. Sin JSON/IDs.

## 11. Producto simple

Nombre · total · `qty>1` → `N × $unit` · trash · stepper. Sin editar.

## 12. Producto personalizado

Nombre · groupTotal · `displaySummary` · pencil + trash · stepper. Edit restaura selections; Actualizar no duplicó (8 productos estables).

## 13. Upsells/Plus

Child bajo parent · `formatUpsellAssociatedLine` · trash `Eliminar {name} del pedido` · sin stepper en upsell · remove 0 POST · FAB 10→9. Label “Adicional” en código (`UPSELL_ASSOCIATED_LABEL`).

## 14. Quantity stepper

`[−] n [+]` · callbacks existentes · qty value ancho estable · 0 fetch.

## 15. Edit / remove controls

lucide Pencil/Trash2 · aria contextual · legacy remove = `onChangeLegacyQuantity(id, 0)`.

## 16. Precios

Formatter existente · line total principal · unit hint solo si inequívoco (legacy o V2 sin children).

## 17. Footer y CTA

Sticky · Total · **Continuar al checkout** · helper · mismo `onCheckout`. Footer omitido si empty.

## 18. Empty state

Al eliminar último ítem con sheet abierto: “Tu pedido está vacío” · “Seguir comprando” cierra sheet · FAB desaparece · sin autocierre forzado · 0 POST.

## 19. Responsive

Layout mobile-first · wrap nombres · `@media (max-width:359px)` apila acciones · desktop sheet centrado. Android real = DEVICE debt.

## 20. Accessibility

`role=dialog` · título · close aria · icon buttons aria · focus-visible · reduced-motion · hit ≥44px · no nested buttons. Focus trap: no afirmado (no implementado/validado).

## 21. Performance

Open sheet / qty / remove: **0** Next-Action POST. Edit reusa modal cache (0 POST en reopen session). Sin deps nuevas / framer / blur.

## 22. Preview boundary

UNVERIFIED (sin auth). Guard checkout preview no tocado.

## 23. Checkout boundary

`/b/demohamburgueseria/checkout`: carrito hidratado (Coca) · **Enviar pedido** visible · **NO** submit · **NO** pedido real.

## 24. Runtime/browser QA

| Caso | Resultado |
| ---- | --------- |
| A Simple Coca | PASS — qty/unit hint/trash/0 fetch |
| B BBQ personalizado | PASS — summary/edit/Actualizar sin duplicar |
| C Upsell child | PASS — remove child 0 POST; hierarchy subordinada |
| D Mixto | PASS — footer sticky / 8–10 productos |
| E Empty | PASS — empty copy + Seguir comprando + FAB gone |
| F Preview | UNVERIFIED |
| G Checkout | PASS boundary sin submit |

## 25. Resultado de comandos

| Command | Result |
| ------- | ------ |
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `git diff --check` (cart-sheet) | **PASS** |
| lint | no ejecutado |

## 26. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| Info | Preview admin deep sin auth | no login | PREVIEW QA DEBT |
| Info | Android real no medido | browser only | DEVICE QA DEBT menor |
| Info | Focus trap no validado | no trap explícito | documentado |

## 27. Deuda residual

1. Preview admin iframe QA.
2. Device Android real.
3. Post-add upsell (fuera de scope).
4. Checkout conversion polish.
5. Dirty tree acumulado + super-admin actions prior.

## 28. Rollback plan

Revertir solo `cart-sheet.tsx` / `cart-sheet.module.css` + docs de esta fase. No tocar cart schema, localStorage, checkout, create_order, modal, cache.

## 29. Próximo paso

**PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1** (alt: `PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1`)
