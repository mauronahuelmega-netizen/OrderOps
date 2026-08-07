# PRODUCT-STOCK-DECREMENT-LEDGER-1 — Record Order Decrement Movements in create_order

## Objetivo

Registrar `stock_movements.order_decrement` dentro de `create_order` cada vez que se descuenta stock de productos con `track_stock=true`, en la misma transacción.

## Contexto

| Fase | Estado |
|------|--------|
| PRODUCT-STOCK-DECREMENT-ORDER-1 | PASS — descuenta sin ledger |
| PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 | PASS — ledger vacío |
| PRODUCT-STOCK-RESTOCK-DESIGN-1 | PASS — restock requiere ledger |

Pre-fase: Coca stock=4 · `stock_movements` count=0 · #9632 sin ledger (no backfill).

## Alcance

- Migration que recrea `create_order` con inserts a `stock_movements`
- QA tracked upsell + legacy
- Docs / CURRENT_PHASE / living memory

## Fuera de scope

Restock, updateOrderStatusAction, schema/RLS de stock_movements, backfill histórico, UI, flags, deploy.

## Autorización

```txt
AUTORIZO_STOCK_DECREMENT_LEDGER_LOCAL=yes
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_DECREMENT_LEDGER_READ_ONLY=yes
AUTORIZO_APPLY_STOCK_DECREMENT_LEDGER_TO_PROD=yes
AUTORIZO_CREATE_STOCK_DECREMENT_LEDGER_QA_ORDER=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría previa

| Check | Resultado |
|-------|-----------|
| create_order base | `20260717010500_product_stock_decrement_order_1.sql` |
| stock_movements count | 0 |
| Coca | stock=4, track_stock=true, available |
| Flags | customization=true, on_demand=true |

## Migration creada

```txt
supabase/migrations/20260717130000_product_stock_decrement_ledger_1.sql
```

Nota: archivo creado directo (evitar hang de `supabase migration new`).

## create_order antes/después

**Antes:** lock → validate → insert order/items → UPDATE products.stock.

**Después:** igual + captura `stock_before` por product en el lock + insert `stock_movements.order_decrement` por cada order_item tracked con running stock.

## Diseño implementado

1. Durante `FOR UPDATE`, guardar `v_stock_before_map[product_id] = stock`
2. Insert order + order_items (ORDER-1 intacto)
3. UPDATE products.stock agregado (DECREMENT-ORDER-1)
4. Loop order_items tracked (`item_kind product` luego `upsell`, `oi.id`):
   - `quantity_delta = -qty`
   - `stock_before` / `stock_after` running
   - `reason = order_create`
   - metadata `{source, item_kind, parent_order_item_id?}`
5. Si insert movement falla → rollback completo (sin ON CONFLICT DO NOTHING)

## Reglas de ledger

| Campo | Valor |
|-------|-------|
| movement_type | order_decrement |
| quantity_delta | negativo |
| Elegible | track_stock=true, product_id not null, qty>0 |
| No elegible | track_stock=false, options, históricos |

## Idempotencia

Unique parcial existente por `order_item_id` + `order_decrement`. INSERT estricto (conflicto = error real).

## Producción / apply

| Paso | Resultado |
|------|-----------|
| Método | `apply_migration` `product_stock_decrement_ledger_1` |
| Live def | has stock_movements + order_decrement |
| Comment | STOCK-DECREMENT-LEDGER-1… |

## QA tracked upsell + ledger

| Campo | Valor |
|-------|-------|
| Order | `4ef1169a-c803-4404-b2ed-721c46df8b9a` (#8B9A) |
| Total | 15500 |
| Parent | Doble Smash product (no tracked) |
| Child | Coca upsell `c39d4516-…` |
| Coca stock | **4 → 3** |
| Movement | 1 row `order_decrement`, delta=-1, before=4, after=3 |
| order_item_id | upsell Coca |
| metadata.item_kind | upsell |
| metadata.parent_order_item_id | parent Doble Smash |

## QA legacy no-tracked

| Campo | Valor |
|-------|-------|
| Order | `c9721e63-97c5-423c-aaef-11f47ccb503e` (#503E) |
| Producto | Clásica track_stock=false stock=0 |
| Movements | **0** |
| Stock Clásica | sin cambio |

## QA insufficient stock

Code review: `INSUFFICIENT_STOCK` sigue antes de insert order/items/movements (mismo bloque FOR UPDATE). No se forzó stock en prod.

## SQL de verificación

- Coca stock=3, available=true, track_stock=true
- Movements for `f34118c6-…` (#9632): **0** (no backfill)

## Browser sanity

Dashboard muestra `#8B9A` (Doble Smash + Coca) y `#503E` (Clásica) en Pendientes.

## Compatibilidad legacy

track_stock=false sin movements; customization parent/upsell intacto; restock no implementado.

## Qué NO se tocó

updateOrderStatusAction, stock_movements schema/RLS, UI, flags, sesión, deploy, backfill #9632.

## Validaciones CLI

`tsc` PASS · `build` PASS

## Riesgos / deuda

- Pedidos QA pending adicionales (#8B9A, #503E, previos #9632/#9B25) → cleanup futuro
- #9632 sigue sin ledger → no restock automático hasta bridge/cleanup
- Restock cancel pendiente (RESTOCK-CANCEL-1)

## Rollback plan

Restaurar `create_order` desde `20260717010500_product_stock_decrement_order_1.sql`. No borrar movements salvo incidente. No tocar stock salvo autorizado.

## Resultado final

**PASS**

`create_order` registra `order_decrement` en `stock_movements` para productos tracked en la misma TX, con legacy intacto.

## Próxima fase recomendada

**PRODUCT-STOCK-RESTOCK-CANCEL-1** — cancel con restock solo si existe `order_decrement` previo.
