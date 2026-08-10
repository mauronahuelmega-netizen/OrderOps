# PUBLIC-CATALOG-PRODUCT-CARD-CUSTOMIZED-QUANTITY-BADGE-AUDIT-1

## Estado

AUDIT COMPLETE — CUSTOMIZED PRODUCT QUANTITY BADGE READY FOR FIX

## Contexto

QA visual: productos simples (Sprite/Coca) muestran badge en el `+` del ProductCard cuando quantity > 0; productos con opciones (Doble Smash / BBQ Bacon) aparecen en CartSheet pero el ProductCard sigue mostrando solo `+` sin badge.

Hipótesis confirmada: el contador que alimenta ProductCard solo suma líneas **legacy** (`schemaVersion` 1), no parents V2 customizados.

## Git preflight

- Branch: `cursor-handoff-public-catalog-ui-redesign`
- HEAD: `b2321b0`
- Working tree dirty por fases previas (checkout/success/FAB/ProductCard/header/category nav) — no tocado en esta auditoría
- Sin commit/push/deploy

## Documentos revisados

| Documento | Estado |
|-----------|--------|
| `docs/public-catalog-product-card-active-quick-add-badge-float-restore-1.md` | Leído |
| `docs/public-catalog-product-card-active-quick-add-badge-clip-fix-1.md` | Referenciado (existe) |
| `docs/public-catalog-product-card-active-quick-add-compact-followup-1.md` | Leído — badge si `quantity > 0`; custom vía modal |
| `docs/public-catalog-product-card-quantity-stepper-overlay-fix-1.md` | Referenciado (existe) |
| `docs/public-catalog-category-nav-dark-active-accent-fix-1.md` | Referenciado (existe) |
| `docs/public-catalog-cart-fab-accent-fill-followup-1.md` | Referenciado (existe) |
| `docs/public-catalog-cart-fab-contrast-polish-1.md` | Referenciado (existe) |
| `docs/public-catalog-checkout-flat-polish-1.md` | Referenciado (existe) |
| `docs/public-catalog-ui-redesign-cursor-handoff-2026-08-06.md` | Referenciado (existe) |
| `docs/public-catalog-ux-ui-redesign-spec-closure-1.md` | Referenciado (existe) |

## Archivos inspeccionados

- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/product-card.tsx`
- `components/public/catalog/product-card.module.css` (solo lectura; badge CSS intacto)
- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/customization-modal.tsx`
- `lib/cart/local.ts`
- `lib/cart/types.ts`
- `lib/product-customization/public-shared.ts`
- Storage keys en browser: `orderops-cart:*`, `orderops-cart-v2:*`, `orderops-preview-cart:*`

## ProductCard quantity source

| Pregunta | Evidencia |
|----------|-----------|
| Prop | `quantity: number` en `product-card.tsx` |
| Quién calcula | `catalog-client.tsx` → `quantityByProductId` |
| Cómo | `getLegacyQuantityForProduct(cartItems, product.id)` por cada producto |
| ¿Por product.id? | Sí, key del Map |
| ¿Por signature? | **No** — solo legacy match por `productId` |
| ¿Excluye custom? | **De facto sí**: V2 parents nunca entran en `getLegacyQuantityForProduct` |
| Múltiples configs | No se suman hoy; ni siquiera se cuentan |

Código crítico:

```189:195:components/public/catalog/catalog-client.tsx
  const quantityByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      map.set(product.id, getLegacyQuantityForProduct(cartItems, product.id));
    }
    return map;
  }, [cartItems, products]);
```

```243:251:lib/cart/local.ts
export function getLegacyQuantityForProduct(
  items: LocalCartItem[],
  productId: string
): number {
  const legacy = items.find(
    (item) => isLocalCartLegacyItem(item) && item.productId === productId
  );
  return legacy?.quantity ?? 0;
}
```

ProductCard **sí renderiza badge** cuando `quantity > 0` (independiente de `requiresCustomization`):

```59:60:components/public/catalog/product-card.tsx
  const hasQuantity = quantity > 0;
  const canInlineIncrement = !requiresCustomization && hasQuantity;
```

Por tanto el bug no está en el CSS/markup del badge: llega `quantity === 0` para customizados.

## Simple product flow

1. `handleAddProductById` → si no requiere custom → `setLegacyProductQuantity(..., 1)`.
2. Persistencia en `orderops-cart:{businessId}` (legacy array).
3. `quantityByProductId` lee legacy qty → ProductCard badge + aria “Agregar otra unidad… N en el carrito”.
4. Increment: `handleIncrementProductById` → legacy qty+1.
5. FAB: `getCartItemCount` suma roots jerárquicos (legacy + V2 parents).

Browser: Coca con badge `3`; tras agregar Sprite, path legacy confirmado (misma familia de aria/badge).

## Customized product flow

1. `requiresCustomization` vía `productNeedsCustomizationModal(summary)` → `summary.hasCustomizations` (`public-shared.ts`).
2. `+` / increment en custom → `openCustomizationModal` (no increment legacy).
3. Modal confirma → `buildCartLinesFromCustomizationSelection` → `mergeCustomizedSelectionIntoCart`.
4. Persistencia V2 en `orderops-cart-v2:{businessId}`: parent `itemKind: "product"`, `parentCartLineId: null`, `configurationSignature`, qty.
5. CartSheet muestra fila jerárquica (p.ej. Doble Smash + “Papas: Papas chicas”).
6. ProductCard: `quantityByProductId` sigue 0 → aria fijo `Elegir opciones para {name}` → **sin badge**.

Browser:

| Momento | CartSheet / FAB | ProductCard Doble Smash |
|---------|-----------------|-------------------------|
| Tras add (Papas chicas) | FAB 7→8; V2 parent qty=1; sheet lista Doble Smash | aria `Elegir opciones…`; `hasBadge: false` |
| Tras decrease a 0 | FAB 8→7; línea removida | sigue sin badge (qty prop 0) |

## Cart signature model

- V2 parent lleva `configurationSignature` (grupos + opciones + upsells adjuntos).
- Misma signature al re-agregar → `merge` incrementa `existingParent.quantity` (`local.ts` ~664–686).
- Signature distinta → `created` (nueva línea).
- Edit con conflict → `signature_conflict` (“Ya tenés esta combinación…”).
- Badge futuro debe sumar **quantities de V2 parents** por `productId` base (todas las signatures), no por signature única.

## Root vs child/adicional items

| Tipo | Representación | Cuenta FAB (`getCartItemCount`) | Debería contar badge ProductCard standalone |
|------|----------------|----------------------------------|---------------------------------------------|
| Legacy line | schema 1 | Sí (root) | Sí |
| V2 parent | `itemKind: "product"`, `parentCartLineId: null` | Sí | Sí (faltante hoy) |
| Upsell child | `itemKind: "upsell"`, `parentCartLineId` set | No (solo parent qty) | **No** |

Children sincronizan qty con el parent; tienen `productId` propio (p.ej. Coca adicional) pero no deben inflar el badge de Coca standalone si solo existen como nested. Si Coca también está como legacy root, el badge standalone debe reflejar solo roots (legacy + V2 parent de Coca), no children de otro parent.

## requiresCustomization behavior

| Acción | Simple | Custom (`hasCustomizations`) |
|--------|--------|------------------------------|
| Primer `+` | legacy qty=1 | abre modal |
| `+` con qty>0 | `onIncrementProduct` (legacy +1) | `canInlineIncrement=false` → `onAddProduct` → **abre modal otra vez** (no clona última config) |
| Aria con qty | incluye “N en el carrito” | siempre “Elegir opciones…” (aunque hubiera qty) |
| Badge UI | si quantity>0 | si quantity>0 (pero quantity nunca llega) |

Fix futuro puede mostrar badge **sin** cambiar click: custom sigue abriendo modal.

## CartSheet decrement

- Legacy: `onChangeLegacyQuantity(productId, qty±1)` → `setLegacyProductQuantity`.
- V2 parent: `onChangeParentQuantity(parentCartLineId, qty±1)` → `setV2ParentQuantity` (children sync).
- Remove línea: `onRemoveLine` (parent remueve familia; child se puede quitar solo).
- ProductCard no tiene `-` (contrato grilla = sumar; sheet = editar/restar). Intactos.

## Browser QA

### Simple product

PASS — Coca badge `3` / aria con cantidad; legacy storage.

### Customized product

PASS (bug reproducido) — Doble Smash en CartSheet + V2 parent qty=1; ProductCard sin badge; aria sin cantidad.

### Multiple configurations

Auditado en código (merge vs create por signature). No se ejecutó un segundo config distinto en browser en esta pasada; comportamiento cubierto por `mergeCustomizedSelectionIntoCart` + tests `post-add-upsell-contract.verify.ts`.

### Decrement from CartSheet

PASS — Disminuir Doble Smash elimina línea (qty 1→0); FAB 8→7; ProductCard sin cambio visible (ya estaba en 0).

### Nested additional item

No se adjuntó upsell en la sesión (post-add no quedó abierto / sin attach). Contrato documentado desde `attachUpsellChild` / `getCartItemCount` / tipos V2: child no debe sumar al badge standalone.

### Light / dark

Problema es de **derivación de quantity**, no de tema visual. Badge CSS light/dark ya existe; custom nunca recibe qty > 0.

## Console / network QA

- `create_order` resource hits: 0
- Pedidos reales: 0
- Sin dialog de hidratación observado en el flujo

## Hallazgos

| Área | Hallazgo | Severidad | Evidencia | Recomendación |
|------|----------|-----------|-----------|---------------|
| ProductCard quantity prop | Prop `quantity` correcta; valor siempre 0 para V2 | P1 | `product-card.tsx` + browser Doble Smash | Fix en derivación upstream |
| simple product count | Legacy count OK | — | Coca badge 3 | Preservar |
| custom product count | Solo `getLegacyQuantityForProduct` | P1 | `catalog-client.tsx` 189–195; `local.ts` 243–251 | Sumar V2 parents por productId |
| cart signature | Count por signature no; items V2 por signature | P2 (UX) | `mergeCustomizedSelectionIntoCart` | Badge = suma roots productId |
| root vs child | FAB ya root-only; badge no incluye V2 roots | P1 | `getCartItemCount` vs `quantityByProductId` | Alinear badge a roots |
| requiresCustomization | Modal path OK; badge no bloqueado en UI | P2 | `canInlineIncrement`; aria sin qty | Badge + aria qty; click modal intacto |
| CartSheet decrement | Por lineId/signature family OK | — | sheet + `setV2ParentQuantity` | No cambiar |
| FAB count relationship | FAB cuenta V2; card no | P2 | FAB 8 con Doble Smash; card sin badge | Alinear card a roots |
| preview/cart scope | Keys `orderops-cart` / `v2` / `preview` separadas | P3 | localStorage audit | Fix en scope activo del catalog client |
| accessibility label | Custom nunca menciona cantidad | P2 | aria `Elegir opciones…` | Incluir total roots cuando >0 |
| future fix risk | Bajo si solo se cambia el Map de display qty | — | sin tocar signatures/storage/payload | Fix acotado en catalog-client (+ aria) |

## Recomendación para PUBLIC-CATALOG-PRODUCT-CARD-CUSTOMIZED-QUANTITY-BADGE-FIX-1

Implementar (fase posterior, no esta):

1. En `catalog-client.tsx`, reemplazar/ampliar `quantityByProductId` con `displayQuantityByProductId`:
   - sumar `getLegacyQuantityForProduct` **+** cantidad de cada `isV2ParentCartItem` con el mismo `productId`;
   - **excluir** `itemKind === "upsell"` / children;
2. Pasar ese valor a `<ProductCard quantity={...} />`.
3. Badge: ya aparece si `quantity > 0` (simples y custom).
4. Click:
   - simple: increment legacy;
   - custom: sigue abriendo modal (no auto-duplicar última config).
5. Mejorar `aria-label` custom cuando displayQty > 0 (informar total sin cambiar acción).
6. Decremento solo CartSheet.
7. No cambiar signatures, storage keys, merge rules, CartSheet, checkout payload, create_order.

### No hacer

- No clonar automáticamente la última configuración.
- No sumar children/adicionales al badge standalone.
- No cambiar cart signature / storage / CartSheet qty logic / checkout / orders.

## Fuera de alcance

- Runtime/CSS/TSX changes (esta fase)
- Closeout UI redesign
- Maps / public_order_code
- Commit / push / deploy

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-PRODUCT-CARD-CUSTOMIZED-QUANTITY-BADGE-FIX-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 = PAUSED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
