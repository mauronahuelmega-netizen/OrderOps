# PRODUCT-STOCK-DECREMENT-ORDER-1 — Transactional Stock Consumption in create_order

## Objetivo

Implementar validación y decremento transaccional de stock en `create_order` solo para `products.track_stock = true`, incluyendo upsell child items.

## Contexto

| Fase previa | Estado |
|-------------|--------|
| STOCK-DECREMENT-AUDIT-1 | PASS WITH DEBT |
| STOCK-DECREMENT-DESIGN-1 | PASS |
| STOCK-TRACKING-SCHEMA-1 | PASS |
| STOCK-ADMIN-UX-1 | PASS |

Pre-fase (prod):

```txt
Coca Cola 500ml: track_stock=true, stock=5, is_available=true, price=3000
create_order: sin descuento de stock
```

## Alcance

- Migration / replace `create_order` (firma intacta)
- Lock + validate + decrement para `track_stock=true`
- Error `INSUFFICIENT_STOCK` + mapeo checkout/admin
- Pedidos QA autorizados
- Docs / CURRENT_PHASE / living memory

## Fuera de scope

- Restock en cancelación
- `stock_movements`
- Admin UX / schema columns nuevas
- Mass `track_stock=true`
- Deploy / Vercel
- Cambiar flags / store session

## Autorización

```txt
AUTORIZO_STOCK_DECREMENT_ORDER_LOCAL=yes
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_DECREMENT_ORDER_READ_ONLY=yes
AUTORIZO_APPLY_STOCK_DECREMENT_ORDER_TO_PROD=yes
AUTORIZO_CREATE_STOCK_DECREMENT_QA_ORDER=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (final) |

## Auditoría previa

| Pieza | Hallazgo |
|-------|----------|
| RPC vigente (pre) | `20260713030000_product_customization_order_1_create_order_snapshot.sql` / live sin `stock` |
| Firma | `(uuid, text, text, date, text, text, text, jsonb) → uuid` |
| Availability | Parent + upsell exigen `is_available=true` |
| Upsell | `item_kind=upsell` + `parent_client_line_id` |
| Error map | `mapCreateOrderRpcError` en checkout + admin orders |
| Flags | customization=true, on_demand=true |
| Trigger | `tr_auto_suspend_out_of_stock` sigue activo |

## Diseño implementado

1. Agrupar demanda `product_id → sum(quantity)` (product + upsell)
2. `SELECT … FOR UPDATE OF products` solo `track_stock=true`, `ORDER BY product_id`
3. Si `stock < demanda` → `raise exception 'INSUFFICIENT_STOCK'` **antes** de insert order
4. Insert orders + order_items (lógica ORDER-1 intacta)
5. `UPDATE products SET stock = stock - qty` (+ `is_available=false` si stock final ≤ 0)
6. `track_stock=false` no se toca

## Migration creada

```txt
supabase/migrations/20260717010500_product_stock_decrement_order_1.sql
```

Nota apply: se registró un version row MCP vacío `product_stock_decrement_order_1` (20260717010503) por un probe; el cuerpo real se aplicó con `execute_sql` (CREATE OR REPLACE). Live verificado con `INSUFFICIENT_STOCK` + `track_stock` en `pg_get_functiondef`.

## create_order antes/después

**Antes:** solo validaba `is_available`; no leía ni actualizaba `stock`.

**Después:** igual para legacy; para tracked: lock → validate → insert → decrement en la misma TX.

## Reglas de stock implementadas

| track_stock | Comportamiento |
|-------------|----------------|
| false | Solo `is_available`; stock ignorado (incluso stock=0) |
| true | `is_available` + stock ≥ demanda agregada + decremento |
| product + upsell | Ambos cuentan en la demanda |
| options/snapshots | No inventarian |
| stock final ≤ 0 | `is_available=false` (set explícito + trigger) |

## Error mapping

Checkout `app/b/[slug]/checkout/actions.ts`:

```txt
INSUFFICIENT_STOCK → Algunos productos ya no tienen stock suficiente. Revisá tu pedido antes de continuar.
```

Admin manual order `app/admin/(protected)/orders/actions.ts`: mismo mensaje (code `PRODUCT_UNAVAILABLE`).

## Producción / apply

| Paso | Resultado |
|------|-----------|
| Flags/sesión OK | customization=true, on_demand=true |
| Apply cuerpo RPC | PASS (`execute_sql`) |
| Live def contiene INSUFFICIENT_STOCK | true |
| Live comment | STOCK-DECREMENT-ORDER-1… |

## QA legacy no-tracked

| Campo | Valor |
|-------|-------|
| Order | `d2489663-eea9-4404-a994-f2271ca09b25` |
| Producto | Clásica (`track_stock=false`, stock=0, available=true) |
| Resultado | Pedido pending, total 8500 |
| Stock Clásica post | **0** (sin descuento) |

## QA tracked upsell Coca Cola

Vía `create_order` RPC (mismo path que checkout UI) con parent Doble Smash + upsell Coca:

| Campo | Valor |
|-------|-------|
| Order | `f34118c6-d537-408e-b0be-caac9d489632` |
| Customer | QA Stock Decrement Upsell |
| Total | 15500 (12500 + 3000) |
| Parent | Doble Smash `item_kind=product` + snapshot |
| Child | Coca Cola `item_kind=upsell`, `parent_order_item_id` correcto |
| Coca stock | **5 → 4** |
| Coca available | true |
| Doble Smash stock | 0 sin cambio (`track_stock=false`) |

## QA insufficient stock

Intento qty=99 de Coca Cola:

- Exception `INSUFFICIENT_STOCK`
- 0 orders con customer `QA Stock Insufficient`
- Coca permanece stock=4

## Cancelación / restock

No cancelado en esta fase. Restock **fuera de scope** (esperado V1: cancel no restaura).

## SQL de verificación

Coca post-QA:

```txt
stock=4, track_stock=true, is_available=true, price=3000
```

## Compatibilidad legacy

- Clásica stock=0 + available vende OK
- Doble Smash no descuenta
- Customization V2 parent/upsell intacto

## Qué NO se tocó

- `updateOrderStatusAction` / restock
- Admin product UX
- Schema columns (solo RPC)
- Flags / session
- Deploy

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| lint | No ejecutado (deuda ESLint 9 conocida) |

## Riesgos / deuda

- Migration history: row MCP vacío + apply real vía `execute_sql` (doc/local file es fuente de verdad del body)
- Pedidos QA quedan pending (cleanup fase posterior opcional)
- UI checkout no re-probado end-to-end en browser (RPC sí)
- Restock cancel pendiente

## Rollback plan

Restaurar `create_order` desde `20260713030000_product_customization_order_1_create_order_snapshot.sql`. No tocar pedidos creados. No revertir stock salvo incidente autorizado.

## Resultado final

**PASS**

`create_order` valida y descuenta stock transaccionalmente para `track_stock=true`, incluyendo upsell. Legacy `track_stock=false` intacto.

## Próxima fase recomendada

**PRODUCT-STOCK-RESTOCK-CANCEL-1** (o STOCK-MOVEMENTS) — restock idempotente al cancelar, con ledger.
