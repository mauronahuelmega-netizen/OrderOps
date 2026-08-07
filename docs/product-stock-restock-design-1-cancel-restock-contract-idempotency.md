# PRODUCT-STOCK-RESTOCK-DESIGN-1 — Cancel Restock Contract & Idempotency

## Objetivo

Diseñar el contrato funcional y técnico para devolver stock al cancelar pedidos, con idempotencia y sin doble inventario. **Sin implementar restock.**

## Contexto

| Fase previa | Estado |
|-------------|--------|
| PRODUCT-STOCK-DECREMENT-ORDER-1 | **PASS** |
| PRODUCT-STOCK-ADMIN-UX-1 | PASS |
| PRODUCT-STOCK-TRACKING-SCHEMA-1 | PASS |

Tenant piloto: `demohamburgueseria` / `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` / `pkrsedmwxekbhlohhqds`.

## Alcance

- Auditoría read-only de código + DB
- Contrato de restock / transiciones / items
- Idempotencia y diseño de `stock_movements`
- Tratamiento de pedidos históricos y QA
- Fases posteriores
- Docs / CURRENT_PHASE / living memory

## Fuera de scope

Código funcional, schema/migrations, cancelar/reabrir pedidos, modificar stock, create_order, updateOrderStatusAction, flags, sesión, deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_RESTOCK_DESIGN_READ_ONLY=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Evidencia heredada de PRODUCT-STOCK-DECREMENT-ORDER-1

| Hecho | Evidencia |
|-------|-----------|
| `create_order` descuenta `track_stock=true` | Migration `20260717010500_…` + comment live STOCK-DECREMENT-ORDER-1 |
| Aplica a product + upsell | Demanda agregada por `product_id` |
| Coca 5→4 | Order `f34118c6-…` |
| Cancel no restock | Explícito fuera de scope de DECREMENT-ORDER-1 |
| Sin ledger | `stock_movements` no existe (`to_regclass` null) |

## Estado actual de stock/restock

### Live (read-only 2026-07-16/17)

| Recurso | Estado |
|---------|--------|
| Flags | customization=true, on_demand=true |
| Coca Cola 500ml | stock=**4**, track_stock=true, available=true, price=3000 |
| `stock_movements` | **ausente** |
| `create_order` | descuenta tracked; sin restock |
| `updateOrderStatusAction` | solo UPDATE `orders.status` + event; **sin stock** |

### Nota short_code

No hay columna `orders.short_code` en DB. El UI muestra `#9632` derivado del UUID (`f34118c6-…` → sufijo visible).

## Auditoría updateOrderStatusAction

**Ubicación:** `app/admin/(protected)/orders/[id]/actions.ts`

| Aspecto | Hallazgo |
|---------|----------|
| Status enum TS | `pending \| preparing \| ready \| completed \| cancelled` |
| DB constraint | `orders_status_valid` mismos 5 valores (`20260515173000_t9_order_status_v2.sql`) |
| Validación UI→action | Rechaza status fuera de `ORDER_STATUSES` |
| Transiciones | **No** valida grafo (cualquier status→cualquier otro permitido por lista) |
| No-op | Si `current === next` → success sin UPDATE |
| Side effects | `createOrderEvent` `status_changed`; guard sesión activa; **cero stock** |
| Transaccionalidad | Queries client Supabase separadas (load → update → event); no RPC/TX única |
| Errores | `getActionErrorMessage` / `OrderMutationErrorCode` |

Implicación: restock **no** debe pegarse como segundo UPDATE suelto desde la action; debe vivir en RPC/TX con lock de order.

## Auditoría pedidos QA pendientes

| ID | UI | Status | Notas | Stock relevance |
|----|-----|--------|-------|-----------------|
| `f34118c6-d537-408e-b0be-caac9d489632` | #9632 | **pending** | QA Stock Decrement Upsell · Doble Smash + Coca upsell · 15500 | Coca **sí** descontó (5→4) |
| `d2489663-eea9-4404-a994-f2271ca09b25` | #9B25 | **pending** | QA Stock Legacy · Clásica · 8500 | `track_stock=false` · sin descuento |
| `30c1b498-ab76-4d5b-afb6-cbeac24f8c2f` | #8C2F | **cancelled** | Plus Bebidas Retry · pre-decremento | **No** restock retroactivo |

Items `#9632` / `f34118c6-…`:

| item_kind | Producto | track_stock | qty |
|-----------|----------|-------------|-----|
| product | Doble Smash | false | 1 |
| upsell | Coca Cola 500ml | true | 1 |

Otros QA últimos 7 días: mayoría `completed` (rollout/e2e/live-ops). Deuda operativa: **2 pending** de STOCK-DECREMENT-ORDER-1.

## Problema de producto

Hoy el inventario tracked se consume al crear el pedido, pero cancelar **no** devuelve unidades. Eso deja stock “fantasma consumido” (ej. cancelar #9632 deja Coca en 4 aunque la venta no se cumplió).

Sin ledger, un restock ingenuo es peligroso:

1. Pedidos pre-decremento (#8C2F) podrían “devolver” stock que nunca se restó → inflación.
2. Doble click / retry de cancel → doble restock.
3. `track_stock=false` no debe tocarse.
4. `completed → cancelled` no es el mismo caso de negocio que `pending → cancelled`.

## Decisiones de contrato

| Pregunta | Decisión |
|----------|----------|
| ¿Cancelar debe devolver stock? | **Sí**, solo si hubo decremento tracked real |
| ¿Quién califica? | Solo items con evidencia de decremento (ledger futuro) + `track_stock=true` al momento del movimiento |
| ¿Históricos pre-DECREMENT-ORDER-1? | **No** restock automático |
| ¿Sin ledger aún? | **No** implementar restock en cancel hasta ledger + registro de decrement |
| ¿React / multi-query action? | **Prohibido** para mutar stock |

## Transiciones que restockean

Estados reales auditados: `pending`, `preparing`, `ready`, `completed`, `cancelled`.

| Transición | Restock automático V1 |
|------------|------------------------|
| pending → cancelled | **Sí** (si hay ledger decrement) |
| preparing → cancelled | **Sí** |
| ready → cancelled | **Sí** |
| completed → cancelled | **No** automático (ajuste manual / fase futura) |
| cancelled → cancelled | No-op |
| cancelled → pending (u otro) | Sin auto-restock ni auto-decrement en V1 |
| * → completed / preparing / ready | Sin restock |

## Items que califican para restock

Incluye (si elegibles):

- `item_kind = 'product'` con `product_id` y ledger `order_decrement`
- `item_kind = 'upsell'` igual

Excluye:

- `track_stock=false` (aunque tengan product_id)
- `product_id` null
- customization options / price_delta / snapshot-only
- items ya restockeados (`order_restock` existente)
- pedidos sin `order_decrement` en ledger

Cantidad: `sum(order_items.quantity)` por `product_id`.

## Idempotencia

Requisito: cancelar dos veces (o retry de action) no debe incrementar stock dos veces.

Fuente de verdad: **ledger + unique constraint**, no solo leer `orders.status`.

## Opciones evaluadas

### A — `orders.stock_restored_at`

- Pros: simple
- Contras: sin trazabilidad item/producto; no parcial; no prueba que hubo decremento

### B — `order_items.stock_restored_at`

- Pros: granular por item
- Contras: sin historial completo; no unifica decrement/restock/manual; frágil si se reescriben items

### C — `stock_movements` (recomendada)

- Pros: auditable; unique por `(order_item_id, movement_type)`; soporta decrement/restock/manual; base para restock “solo si hubo decrement”
- Contras: schema + instrumentar create_order + RPC cancel

## Decisión recomendada: stock_movements

**Opción C.** Con decremento real ya en prod, restock seguro exige prueba de consumo previo e idempotencia. Un timestamp en orders/items es insuficiente a mediano plazo.

Alternativa corta (no recomendada): `order_items.stock_restored_at` + cutoff `created_at >= apply DECREMENT-ORDER-1` — solo si se necesita un hotfix urgente; deuda de auditoría alta.

## Diseño propuesto de stock_movements

```sql
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  product_id uuid not null references public.products(id),
  order_id uuid references public.orders(id),
  order_item_id uuid references public.order_items(id),
  movement_type text not null
    check (movement_type in ('order_decrement', 'order_restock', 'manual_adjustment')),
  quantity_delta integer not null,
  stock_before integer not null,
  stock_after integer not null,
  reason text,
  created_by uuid null,
  created_at timestamptz not null default now()
);

-- Idempotencia restock
create unique index stock_movements_restock_once
  on public.stock_movements (order_item_id, movement_type)
  where movement_type = 'order_restock' and order_item_id is not null;

-- Idempotencia decrement futuro
create unique index stock_movements_decrement_once
  on public.stock_movements (order_item_id, movement_type)
  where movement_type = 'order_decrement' and order_item_id is not null;
```

RLS: políticas por `business_id` (mismo patrón tenant). Super-admin documentado aparte.

**Signos:** `order_decrement.quantity_delta` negativo (o positivo con convención fija documentada); `order_restock` inverso. Elegir una convención en SCHEMA-1 y no mezclar.

**Sin backfill histórico obligatorio** de decrementos previos al ledger.

## Contrato futuro para updateOrderStatusAction / RPC

No mutar stock en React ni con queries sueltas en la action.

**RPC recomendada:** `transition_order_status(p_order_id, p_target_status)` (o `cancel_order_with_restock` si se limita a cancel).

Contrato (misma TX):

1. Lock order `FOR UPDATE`
2. Leer status anterior
3. Si target ≠ `cancelled` → update status (comportamiento actual) sin restock
4. Si target = `cancelled` y from ∈ {pending, preparing, ready}:
   - Lock order_items + products tracked `FOR UPDATE` (order by product_id)
   - Para cada item elegible: si existe `order_decrement` y no existe `order_restock` → insert movement + `stock += qty`
   - Si `stock_after > 0` → `is_available = true` (reactivación controlada post-restock)
5. Update `orders.status = cancelled`
6. Return status final

La server action solo llama RPC + presenta eventos/timeline.

Bridge temporal (solo si se adelanta RESTOCK antes de instrumentar todos los decrementos): cutoff `order.created_at >= T_decrement_apply` **y** producto `track_stock=true` — marcar como deuda; retirar cuando ledger sea obligatorio.

## Tratamiento de pedidos históricos

| Clase | Política |
|-------|----------|
| Pre DECREMENT-ORDER-1 (ej. #8C2F) | **Sin** restock automático |
| Post decremento sin ledger (ej. #9632 hoy) | Esperar CLEANUP dedicado o bridge documentado; no restock ciego masivo |
| Post DECREMENT-LEDGER-1 | Restock solo con fila `order_decrement` |

## Tratamiento de pedidos QA actuales

**No cancelar en esta fase.**

| Pedido | Recomendación |
|--------|---------------|
| `f34118c6-…` (#9632) pending tracked | Fase `PRODUCT-STOCK-QA-ORDER-CLEANUP-1` **después** de RESTOCK-CANCEL-1 (o bridge explícito) para recuperar Coca 4→5 |
| `d2489663-…` pending legacy | Cleanup status-only; sin impacto stock |
| `30c1b498-…` (#8C2F) cancelled | Dejar; no restock |

Si se cancela #9632 **antes** de restock: Coca permanece en 4 (comportamiento actual; no ajustar stock manual en diseño).

## UX futura sugerida

Con restock activo:

```txt
Al cancelar este pedido, se devolverá el stock de los productos con control automático.
```

Sin restock (estado actual / bridge off):

```txt
Este pedido se cancelará. El stock no se ajustará automáticamente.
```

No implementar copy en esta fase.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Doble restock | Unique `(order_item_id, order_restock)` |
| Restock sin decremento previo | Exigir `order_decrement` |
| Inflación histórica | No backfill; no restock #8C2F |
| Race cancel concurrente | Lock order + products en RPC |
| Reactivar available indebido | Solo si `stock_after > 0` tras restock tracked |
| Action multi-query | Migrar a RPC |

## Fases posteriores propuestas

Secuencia segura (recomendada):

1. **PRODUCT-STOCK-MOVEMENTS-SCHEMA-1** — tabla + índices + RLS + types  
2. **PRODUCT-STOCK-DECREMENT-LEDGER-1** — `create_order` inserta `order_decrement` junto al UPDATE stock  
3. **PRODUCT-STOCK-RESTOCK-CANCEL-1** — RPC cancel/restock + wire `updateOrderStatusAction`  
4. **PRODUCT-STOCK-RESTOCK-QA-1** — pedido tracked Coca → cancel → stock vuelve  
5. **PRODUCT-STOCK-QA-ORDER-CLEANUP-1** — limpiar pending QA (#9632 / legacy) de forma controlada  

Alternativa corta (no recomendada): RESTOCK-CANCEL-1 con `order_items.stock_restored_at` + cutoff fecha apply.

## Qué NO se tocó

Código, schema, pedidos, stock, create_order, updateOrderStatusAction, flags, sesión, deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| lint | No ejecutado (deuda ESLint 9 conocida) |

## Resultado final

**PASS**

Contrato de restock diseñado. Se recomienda implementar `stock_movements` (y registrar `order_decrement` en create_order) **antes** de devolver stock automáticamente al cancelar, para garantizar idempotencia y trazabilidad.
