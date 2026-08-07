# PRODUCT-CUSTOMIZATION-ORDER-1 — RPC, Server Validation & Snapshot

## Objetivo

Desbloquear checkout V2 con validación server-side, recálculo de precios, evolución backward-compatible de `create_order`, persistencia de `customization_snapshot` y filas upsell hijas.

## Contexto

- CART-1: LocalCartItemV2, signature, sheet, guard artificial de checkout.
- Columnas `order_items.customization_snapshot`, `parent_order_item_id`, `item_kind` ya existen (DB-1).
- Flag sigue **off** por defecto.

## Scope

- Payload checkout legacy + V2.
- `lib/product-customization/order-validation.ts` (server-only).
- Snapshot v1 server-generated.
- Migración SQL `create_order` ORDER-1.
- Unlock cart sheet + checkout client.
- Limpieza dual cart post-success.

## Fuera de scope

- Dashboard render de snapshots (DASHBOARD-1).
- Activar flag / deploy / `db push` remoto.
- Admin customization / pedido manual V2.
- Tablas nuevas / RLS nuevas.

## Archivos creados/modificados

### Creados

- `lib/product-customization/order-types.ts`
- `lib/product-customization/order-snapshot.ts`
- `lib/product-customization/order-validation.ts`
- `supabase/migrations/20260713030000_product_customization_order_1_create_order_snapshot.sql`
- `docs/product-customization-order-1-rpc-server-validation-snapshot.md`

### Modificados

- `app/b/[slug]/checkout/actions.ts`
- `components/public/checkout/checkout-client.tsx`
- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/catalog-client.tsx`
- `lib/cart/local.ts` (`buildCheckoutCartPayload`)
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## Checkout payload

Cliente → action:

```ts
{
  legacyItems: [{ productId, quantity }],
  customizedItems: [{
    cartLineId, productId, quantity, configurationSignature,
    selectedGroups: [{ groupId, selectedOptionIds }],
    upsellItems: [{ cartLineId, productId, quantity, parentCartLineId }]
  }]
}
```

No se confía en nombres/precios del cliente.

## Server validation lib

`validateCheckoutCartForCreateOrder`:

1. Flag on si hay V2; si off + V2 → rechazo.
2. Legacy: product belongs + available (service client).
3. Custom: `getPublicProductCustomizationConfig` + required/min/max.
4. Recalcula deltas/precios desde DB/config.
5. Normaliza upsell qty = parent qty.
6. Recalcula signature; mismatch → rechazo.
7. Construye snapshot + RPC items.

## Pricing recalculation

```
customizationTotal = Σ price_delta (DB)
finalUnitPrice = product.price + customizationTotal
upsell.unit_price = products.price (RPC)
order.total_price = Σ (unit_price × quantity) post-insert
```

## Customization snapshot v1

Solo en parent `item_kind=product`. Incluye groups/options/pricing/summary/signature. Upsell **no** va en snapshot.

## Upsell child rows

- `item_kind='upsell'`
- `parent_order_item_id` vía mapa `client_line_id` → `order_items.id`
- `customization_snapshot = null`
- qty = parent qty

## create_order evolution

Misma firma. `p_items` acepta:

| Shape | Comportamiento |
|-------|----------------|
| `{product_id, quantity}` | Legacy idéntico |
| + `client_line_id`, `customization_snapshot`, `unit_price` | Parent personalizado |
| `item_kind=upsell` + `parent_client_line_id` | Child |

Transaccional: insert order → parents → children → update total.

## Backward compatibility

- Manual order sigue enviando solo `{product_id, quantity}`.
- Legacy checkout sin V2 intacto.
- Defaults: `item_kind=product`, snapshot null.

## Feature flag behavior

- Flag off + V2 payload → `"Los opcionales no están habilitados..."`.
- Flag off + legacy → OK.
- Flag no activado en esta fase.

## Error handling

Mensajes UX claros; sin stack/SQL al cliente. Fallo de validación → no crea order, no limpia carrito.

## Migration / DB validation

Migración local creada: `20260713030000_product_customization_order_1_create_order_snapshot.sql`.

**Deuda:** no aplicada a remoto (`db push` prohibido sin autorización). Sin Supabase local verificado en esta corrida → SQL runtime **no** fully verified.

## Browser QA flag off

Ejecutado en `localhost:3000` (2026-07-13):

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| Sin “Desde” | PASS |
| Add legacy + cart sheet | PASS |
| CTA “Continuar al checkout” habilitada | PASS |
| Sin mensaje CART-1 “próxima fase” | PASS |
| Pedido real con RPC ORDER-1 aplicado | Pendiente (migración no pushed) |

## Browser QA flag on

No ejecutado (sin autorización).

## SQL QA

Pendiente de apply + pedido demo.

## Datos QA

Ningún seed; flag no tocado.

## Qué NO se tocó

- Dashboard UI
- Admin customization
- RLS policies
- Activación de flag
- Deploy / Vercel / `db push` remoto
- Pedido manual (sigue legacy)

## Riesgos / deuda

1. **Migración no aplicada en remoto** — checkout V2 fallará en RPC hasta apply autorizado.
2. Validación custom usa read model público (anon RLS); requiere flag on (ya gated).
3. RPC confía en `unit_price`/`snapshot` del caller service-role (TS valida antes).
4. Flag-on E2E + SQL QA pendientes.
5. SPEC histórico “max 1 plus” vs CART-1 multi-upsell: ORDER-1 alinea con CART-1 (N upsells).

## Resultado final

**PASS WITH DEBT**

## Próxima fase recomendada

1. Autorizar apply de migración ORDER-1 (staging/prod).
2. QA flag-on controlado + SQL verify.
3. **PRODUCT-CUSTOMIZATION-DASHBOARD-1** — render snapshot/upsell en pedidos.
