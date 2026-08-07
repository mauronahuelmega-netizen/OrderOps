# PRODUCT-STOCK-DECREMENT-DESIGN-1 — Inventory Consumption Contract

## Objetivo

Definir el contrato funcional y técnico del consumo de stock en OrderOps **antes** de implementar cambios. Sin writes.

## Contexto

`PRODUCT-STOCK-DECREMENT-AUDIT-1` (PASS WITH DEBT) confirmó:

- `create_order` no consume stock
- cancelación no restaura stock
- `products.stock` + trigger `tr_auto_suspend_out_of_stock` = control de availability al escribir stock
- sin ledger histórico
- `#8C2F` (Coca Cola upsell) dejó stock 5→5

## Alcance

Diseño de producto + contrato técnico + fases futuras. Confirmación mínima schema/triggers/código.

## Fuera de scope

Código, migraciones, schema, RPC, triggers, stock, pedidos, flags, sesión, deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_DECREMENT_DESIGN_READ_ONLY=yes
```

## Evidencia heredada de STOCK-DECREMENT-AUDIT-1

| Hallazgo | Evidencia |
|----------|-----------|
| create_order no toca stock | Live RPC: sin literal `stock`, sin UPDATE products, sin FOR UPDATE |
| Solo valida `is_available` | Parent + upsell SELECT … `is_available = true` |
| Cancel no restock | `updateOrderStatusAction` solo UPDATE `orders.status` |
| Trigger availability | `tr_auto_suspend_out_of_stock` BEFORE INSERT/UPDATE OF stock |
| Legacy | Catálogo con `stock=0` + `is_available=true` (vendible) |
| Caso upsell | `#8C2F` Coca Cola qty 1, stock sin cambio |

Confirmación DESIGN-1 (2026-07-16): trigger products sigue siendo el único; no triggers en orders/order_items.

Anclas código:

| Pieza | Ubicación |
|-------|-----------|
| create_order | `supabase/migrations/20260713030000_product_customization_order_1_create_order_snapshot.sql` (+ live RPC) |
| updateOrderStatusAction | `app/admin/(protected)/orders/[id]/actions.ts` |
| Admin stock UI | `create-product-form.tsx` / `edit-product-form.tsx` + `products/actions.ts` |
| Filtros stock admin | `products-toolbar.tsx` (out/low/in) — presenta stock como métrica operativa |

## Problema de producto

Hoy “stock” sugiere inventario, pero:

1. Los pedidos no reservan unidades.
2. Bebidas/plus con stock real no se protegen (sobreventa posible).
3. La mayoría del menú vive con `stock=0` y sigue vendiendo vía `is_available`.
4. Activar decremento global rompería el catálogo legacy.

## Opciones de contrato

### Opción A — Stock manual / disponibilidad

Solo `is_available`; stock referencia manual sin consumo.

- Pros: simple, no bloquea pedidos mal configurados
- Contras: sobreventa; confusión semántica; no sirve para bebidas limitadas

### Opción B — Inventario real para todos

Todo pedido descuenta stock siempre.

- Pros: evita sobreventa global
- Contras: rompe legacy `stock=0`+available; fuerza restock/UX inmediata

### Opción C — Híbrido `track_stock` (recomendada)

Opt-in por producto: sin tracking = disponibilidad manual; con tracking = validar + descontar.

- Pros: no rompe legacy; inventario real gradual (bebidas/postres); flexible
- Contras: migración + admin UX + ajuste create_order

## Decisión recomendada

**Opción C — Híbrido con `track_stock boolean NOT NULL DEFAULT false`.**

V1 de inventario real solo para productos con tracking activo. Resto del catálogo sin cambio de comportamiento.

## Significado de stock

| Contexto | Significado |
|----------|-------------|
| `track_stock = false` | Campo opcional/referencia; **no** gobierna venta. Venta = `is_available`. |
| `track_stock = true` | Unidades disponibles reales. Venta exige `is_available` **y** `stock >= qty` agregada. Consumo en create_order. |

El trigger existente (`stock <= 0` → `is_available=false`) sigue siendo útil cuando se escribe stock (manual o automático).

## Nuevo concepto propuesto: track_stock

```txt
products.track_stock boolean NOT NULL DEFAULT false
```

| track_stock | create_order |
|-------------|--------------|
| false | Solo `is_available`. No lee ni descuenta stock. |
| true | `is_available` + `stock >= qty` + decremento transaccional. Si stock final ≤ 0 → unavailable (trigger o set explícito). |

Default `false` en migración = zero-break para productos existentes.

Candidato piloto posterior: Coca Cola 500ml (`c5d56371-…`) con `track_stock=true` y stock positivo.

## Momento de descuento

**Al crear el pedido (`create_order`).**

Motivo: reserva la unidad al confirmar el carrito; evita carrera si se espera a preparing/completed.

No V1:

| Momento | Por qué no |
|---------|------------|
| Al tomar/asignar | Pedidos pending sin dueño siguen sobrevendiendo |
| Al preparar | Misma ventana de carrera |
| Al completar | Peor: stock se consume tarde |

## Items que descuentan stock

| Item | ¿Descuenta? |
|------|-------------|
| `item_kind = product` + `track_stock` | Sí, por quantity |
| `item_kind = upsell` + `track_stock` | Sí, por quantity |
| `product_id` null | No |
| Customization options (Cheddar, Bacon, …) | **No en V1** (price_delta, no SKU inventariable) |

Si el mismo `product_id` aparece como parent y upsell en el mismo cart: **agrupar cantidades** antes de validar/decrementar.

Deuda futura: inventario de ingredientes/options.

## Stock insuficiente

Si `track_stock=true` y stock insuficiente:

1. Fallar **antes** de insertar order/order_items (sin pedido parcial)
2. Error amigable al checkout
3. Cliente revisa carrito

Mensaje recomendado:

```txt
Algunos productos ya no tienen stock suficiente. Revisá tu pedido antes de continuar.
```

## Transaccionalidad requerida

Dentro del RPC `create_order` (SECURITY DEFINER), misma transacción:

1. Resolver product_ids (parent + upsell)
2. Agrupar qty por product_id
3. `SELECT … FOR UPDATE` solo productos `track_stock=true`
4. Validar available + stock
5. Recalcular precios server-side (ya existe)
6. Insert order + order_items
7. UPDATE stock (decrement)
8. stock final ≤ 0 → `is_available=false` (trigger al UPDATE stock o set explícito)
9. Return order_id

Cliente/admin nunca decrementan stock directamente en el flujo de pedido.

## Cancelación y restock

**V1 (decremento): sin restock automático al cancelar.**

Motivo: el riesgo inmediato es sobreventa; restock sin ledger/idempotencia puede duplicar stock.

| Enfoque | V1 | Posterior |
|---------|----|-----------|
| Cancel → no restock | Sí | — |
| Restock automático idempotente | No | STOCK-RESTOCK / STOCK-MOVEMENTS |
| Ajuste manual admin | Sí (ya existe) | Sí |

`#8C2F` y pedidos históricos: **no backfill**, no reabrir, no recalcular stock.

## Necesidad de ledger

| Fase | Ledger |
|------|--------|
| Decrementar en create_order | No obligatorio si UPDATE stock es atómico en la misma TX |
| Restock en cancel / auditoría | **Sí** — `stock_movements` |

Tabla futura (no crear ahora):

```txt
stock_movements:
  id, business_id, product_id, order_id, order_item_id,
  movement_type (decrement|restock|manual_adjustment),
  quantity_delta, stock_before, stock_after, reason, created_at
```

## Legacy data / compatibilidad

| Regla | Valor |
|-------|--------|
| `track_stock` default | **false** para todos los existentes |
| Productos `stock=0` + available | Siguen vendiendo (sin tracking) |
| Activación gradual | Admin opt-in por producto |
| Coca Cola piloto | Activar tracking en fase QA posterior, no en schema-only |

No migrar stock a null en V1 (columna hoy NOT NULL default 0). Tracking false ignora el valor.

## Admin UX requerido

En create/edit product:

- Switch: **“Controlar stock automáticamente”** → `track_stock`
- Input stock visible/requerido cuando ON
- Helper: “Si está activo, cada pedido descuenta unidades disponibles.”
- Warning si ON y stock=0: “Este producto se pausará / no se podrá vender hasta reponer stock.”
- Si OFF: disponibilidad vía “Disponible”; stock oculto o “referencia” (decisión copy: deuda menor)

Filtros toolbar actuales (out/low/in) deberían, en fase UX, considerar solo productos con tracking o relabelar para no sugerir inventario automático global.

## Public UX requerido

- No mostrar cantidad de stock al cliente en V1
- Productos `track_stock` + stock≤0 → unavailable (gate create_order + catálogo vía `is_available`)
- Error friendly si stock se agota entre add-to-cart y submit

## Contrato técnico create_order futuro

```txt
1. Recibir cart / p_items
2. Resolver product_id (product + upsell)
3. Agrupar cantidades por product_id
4. Lock products WHERE track_stock FOR UPDATE
5. Validar is_available=true (todos los items)
6. Validar stock >= qty agregada (solo track_stock)
7. Recalcular precios server-side
8. Insert order
9. Insert order_items (product + upsell + snapshot)
10. Decrementar stock track_stock
11. stock final <= 0 → is_available=false
12. Return order_id
```

Fallar en cualquier validación → rollback completo.

## Contrato técnico updateOrderStatusAction futuro

**STOCK-DECREMENT-ORDER-1: no modificar.**

Restock/cancel:

- fase `PRODUCT-STOCK-RESTOCK-DESIGN-1` / `PRODUCT-STOCK-MOVEMENTS-1`
- solo si `cancelled` y hubo decremento previo
- idempotente vía ledger (una restock por order_item/product)

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Romper menú con stock=0 | default track_stock=false |
| Carrera entre dos checkouts | FOR UPDATE en create_order |
| Restock doble | no restock V1; ledger después |
| Confusión UI “stock” | copy + switch tracking |
| Options sin inventario | fuera de V1 (deuda) |
| Pedidos históricos | no backfill |

## Fases posteriores propuestas

```txt
1. PRODUCT-STOCK-TRACKING-SCHEMA-1
   track_stock boolean default false (+ types)

2. PRODUCT-STOCK-ADMIN-UX-1
   Switch tracking + helpers en create/edit product

3. PRODUCT-STOCK-DECREMENT-ORDER-1
   create_order: validate + decrement product + upsell

4. PRODUCT-STOCK-DECREMENT-QA-1
   Coca Cola track_stock=true; pedido QA; assert stock--

5. PRODUCT-STOCK-RESTOCK-DESIGN-1
   Contrato cancel → restock

6. PRODUCT-STOCK-MOVEMENTS-1
   Ledger + restock idempotente
```

## Qué NO se tocó

Código, schema, migraciones, triggers, RPC, stock, productos, pedidos, flags, sesión, deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Resultado final

**PASS**

Contrato híbrido `track_stock` definido: decremento transaccional solo con tracking; upsells incluidos; cancel restock diferido; legacy seguro con default false.
