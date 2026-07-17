# PRODUCT-STOCK-RESTOCK-CANCEL-1 — Idempotent Cancel Restock via stock_movements

## Objetivo

Devolver stock al cancelar pedidos de forma transaccional e idempotente, usando `public.stock_movements` como fuente de verdad (`order_decrement` → `order_restock`).

## Contexto

| Fase previa | Estado |
|-------------|--------|
| PRODUCT-STOCK-DECREMENT-LEDGER-1 | **PASS** |

Tenant piloto: `demohamburgueseria` / `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` / `pkrsedmwxekbhlohhqds`.

Estado heredado:

- `create_order` descuenta `track_stock=true` y registra `order_decrement`
- `updateOrderStatusAction` solo cambiaba `orders.status` + timeline
- Cancelar no devolvía stock

## Alcance

- Migration RPC `transition_order_status`
- Wiring de `updateOrderStatusAction` al RPC
- Insert `order_restock` + incremento de `products.stock` solo con ledger
- Apply prod + QA cancel `#8B9A` / `#503E`
- Docs / CURRENT_PHASE / living memory

## Fuera de scope

- Modificar `create_order`
- Modificar schema/RLS de `stock_movements`
- Backfill históricos (`#9632`, `#8C2F`)
- Restock automático `completed → cancelled`
- Product Customization / checkout / cart / flags / sesión / deploy Vercel

## Autorización

```txt
AUTORIZO_STOCK_RESTOCK_CANCEL_LOCAL=yes
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_RESTOCK_CANCEL_READ_ONLY=yes
AUTORIZO_APPLY_STOCK_RESTOCK_CANCEL_TO_PROD=yes
AUTORIZO_CANCEL_STOCK_RESTOCK_QA_ORDER_8B9A=yes
AUTORIZO_CANCEL_STOCK_RESTOCK_QA_ORDER_503E=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría previa

### Código

| Aspecto | Hallazgo |
|---------|----------|
| Action | `app/admin/(protected)/orders/[id]/actions.ts` → `updateOrderStatusAction` |
| Validación status | `ORDER_STATUSES` = pending/preparing/ready/completed/cancelled |
| Update previo | `.from("orders").update({ status })` + `createOrderEvent(status_changed)` |
| Stock previo | **ninguno** |
| revalidatePath | no en esta action |
| Guard | `assertActiveStoreSessionForOrderMutation` + `requireAdminPermission("updateOrders")` |
| Ledger | unique parcial `order_restock` por `order_item_id` ya existía |

### DB read-only previa

| Recurso | Estado |
|---------|--------|
| Coca Cola 500ml | stock=**3**, available=true, track_stock=true |
| `#8B9A` `4ef1169a-…` | pending · 1 `order_decrement` Coca (-1, 4→3) · 0 restock |
| `#503E` `c9721e63-…` | pending · 0 movements |
| `#9632` `f34118c6-…` | pending · 0 movements |
| `#8C2F` `30c1b498-…` | cancelled · 0 movements |

## Migration creada

`supabase/migrations/20260717140000_product_stock_restock_cancel_1.sql`

- Crea `public.transition_order_status(p_order_id uuid, p_target_status text) returns jsonb`
- SECURITY DEFINER · `search_path = public`
- Grant execute a `authenticated`
- No modifica `create_order` ni schema de `stock_movements`
- No inserta/actualiza datos al aplicar

## RPC transaccional

`transition_order_status`:

1. Valida status permitido
2. Lockea order `FOR UPDATE`
3. Autoriza caller (`super_admin` o mismo `business_id` y role ≠ viewer)
4. No-op si `old_status = target`
5. Si target ≠ `cancelled`: solo update status
6. Si `pending|preparing|ready → cancelled`:
   - selecciona `order_decrement` sin `order_restock` y `track_stock=true`
   - lockea products
   - inserta `order_restock` (qty = abs(delta))
   - actualiza stock running + `is_available=true` si stock_after > 0
7. Update `orders.status`
8. Retorna `{ changed, order_id, previous_status, status, restocked_items }`

Errores: `INVALID_ORDER_STATUS`, `ORDER_NOT_FOUND`, `ORDER_BUSINESS_MISMATCH`, `RESTOCK_CONFLICT`.

## updateOrderStatusAction

- Conserva permisos, guard de sesión, no-op same-status, timeline `status_changed`
- Reemplaza UPDATE directo por `supabase.rpc("transition_order_status", …)`
- No muta stock desde la action
- Mapea `RESTOCK_CONFLICT` a mensaje UX específico
- Types: `types/database.ts` → `Functions.transition_order_status`

## Reglas de restock

| Transición | Restock |
|------------|---------|
| pending/preparing/ready → cancelled | Sí, si hay ledger |
| completed → cancelled | No (solo status) |
| cancelled → cancelled | No-op |
| cualquier target ≠ cancelled | Sin stock side effects |

Elegibles: `order_decrement` existente, sin `order_restock`, `product_id` not null, `track_stock=true`.

Cantidad: `abs(order_decrement.quantity_delta)` (no heurística de `order_items.quantity`).

## Idempotencia

- Unique parcial `stock_movements_order_item_restock_once_idx`
- Select solo decrements sin restock
- Insert restock **antes** de commit de stock (misma TX)
- `unique_violation` → `RESTOCK_CONFLICT` + rollback
- Re-cancel → `changed:false`, `restocked_items:0`

## Producción / apply

Aplicado con `apply_migration` name `product_stock_restock_cancel_1` en `pkrsedmwxekbhlohhqds`.

Verificado:

```txt
transition_order_status(p_order_id uuid, p_target_status text) → jsonb
```

## QA cancel #8B9A tracked

Vía RPC autenticado (admin profile piloto; deploy Vercel fuera de scope):

```txt
transition_order_status(4ef1169a-…, 'cancelled')
→ changed=true, previous=pending, restocked_items=1
```

| Check | Resultado |
|-------|-----------|
| status | pending → cancelled |
| Coca stock | **3 → 4** |
| order_restock | +1 · before=3 · after=4 · same order_item_id |
| metadata.decrement_movement_id | `4f8af7ac-…` |
| reason | `order_cancel` |

## QA idempotencia

```txt
transition_order_status(4ef1169a-…, 'cancelled')
→ changed=false, restocked_items=0
```

Coca sigue stock=4 · count `order_restock`=1.

## QA legacy #503E

```txt
transition_order_status(c9721e63-…, 'cancelled')
→ cancelled · restocked_items=0
```

0 movements · Coca intacta en 4.

## Históricos sin ledger

| Pedido | Status | movements | restocks |
|--------|--------|-----------|----------|
| `#9632` `f34118c6-…` | pending (no cancelado) | 0 | 0 |
| `#8C2F` `30c1b498-…` | cancelled | 0 | 0 |

## SQL de verificación

Coca post-QA: stock=4, available=true, track_stock=true.

`#8B9A` movements:

1. `order_decrement` -1 (4→3)
2. `order_restock` +1 (3→4)

## Browser sanity

| Ruta | Resultado |
|------|-----------|
| `/b/demohamburgueseria/catalogo` | carga · Coca Cola 500ml visible |
| Admin dashboard / products | no re-testeados en UI login (deploy action pendiente) |

## Compatibilidad legacy

- Pedidos sin `order_decrement` cancelan status sin tocar stock
- `track_stock=false` no se modifica
- Históricos pre-ledger no reciben restock automático

## Qué NO se tocó

- `create_order`
- schema/RLS `stock_movements`
- Product Customization
- checkout/cart/catalog (salvo lectura browser)
- flags / store session
- deploy Vercel
- backfill `#9632` / `#8C2F`

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (pre + post) |
| `npm run build` | PASS (precheck; post docs) |

## Riesgos / deuda

1. **Deploy debt:** la action local ya llama al RPC, pero Vercel sigue con el UPDATE directo hasta el próximo deploy. Cancels en UI prod **no** restockean hasta desplegar el código de action.
2. Timeline `createOrderEvent` sigue fuera del RPC (best-effort post-status, como antes).
3. `#9632` sigue pending con stock ya descontado pre-ledger (sin restock automático por diseño).

## Rollback plan

1. Restaurar `updateOrderStatusAction` al UPDATE directo previo
2. Dejar de llamar `transition_order_status`
3. Opcional: `drop function public.transition_order_status(uuid, text)`
4. No borrar `stock_movements` salvo incidente
5. No ajustar stock manualmente sin autorización de incidente

Si falla cancel con stock inconsistente: **INCIDENT — ACTION REQUIRED**.

## Resultado final

**PASS WITH DEBT** (deploy debt de action en Vercel).

La cancelación vía `transition_order_status` restockea de forma transaccional e idempotente solo items con `order_decrement`. QA `#8B9A` Coca 3→4 + `order_restock`; `#503E` sin movements; históricos sin ledger intactos.

## Próxima fase recomendada

1. Deploy del wiring `updateOrderStatusAction` (cuando haya autorización de deploy)
2. Smoke UI admin cancel en prod
3. Opcional: PRODUCT-STOCK-RESTOCK-QA / cleanup `#9632` manual autorizado
4. Opcional: política `completed → cancelled` / ajuste manual
