# PRODUCT-STOCK-DECREMENT-AUDIT-1 — Order Stock Consumption For Product/Upsell Items

## Objetivo

Auditar por qué el pedido QA `#8C2F` (Coca Cola upsell) no decrementó `products.stock`, y clasificar el modelo real de inventario vs disponibilidad.

## Contexto

Tras PLUS-BEBIDAS-QA-1 Retry + CLEANUP-1:

- Pedido `#8C2F` creado desde UI, validado (parent + upsell + snapshot), luego `cancelled`
- Coca Cola stock **5 → 5** (sin consumo)
- Trigger conocido: `tr_auto_suspend_out_of_stock`

## Alcance

Read-only: código, schema, triggers, RPC `create_order`, evidencia `#8C2F`, docs.

## Fuera de scope

Writes, fixes, migraciones, cambios de stock/productos/pedidos/flags, deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_DECREMENT_AUDIT_READ_ONLY=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Estado live inicial

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |
| store session | open (`a01252b0-…`) |

## Schema real de products

| column | type | nullable | default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| business_id | uuid | NO | — |
| category_id | uuid | NO | — |
| name | text | NO | — |
| description | text | YES | — |
| price | numeric | NO | — |
| image_url | text | YES | — |
| is_available | boolean | NO | true |
| created_at | timestamptz | NO | utc now() |
| sku | text | YES | — |
| stock | integer | NO | 0 |

- No `updated_at`
- Constraint histórica: `stock >= 0` (migración `20260610103000_add_product_sku_stock.sql`)

## Triggers de products

| Trigger | Evento | Función |
|---------|--------|---------|
| `tr_auto_suspend_out_of_stock` | BEFORE INSERT OR UPDATE OF **stock** | `auto_suspend_out_of_stock_product()` |

Comportamiento: si `NEW.stock <= 0` → `NEW.is_available := false`.

No re-activa cuando stock > 0. No corre en UPDATE de `is_available` solo. No corre en inserts de `order_items`.

Migración: `20260610110000_auto_suspend_out_of_stock.sql` (comentario: “evitar sobreventas”).

## Triggers de orders/order_items

Ningún trigger no-interno sobre `orders` ni `order_items` en producción.

## Funciones/RPCs auditadas

| Función | Rol stock |
|---------|-----------|
| `auto_suspend_out_of_stock_product` | Única función `*stock*` / `*inventory*` / `*available*` relevante |
| `create_order` | No menciona `stock`; no UPDATE products; no FOR UPDATE |
| `updateOrderStatusAction` (app) | Solo UPDATE `orders.status` — sin stock |

Stock en app: create/edit product admin (`app/admin/(protected)/products/actions.ts`) — escritura **manual** de `stock`.

## create_order vigente

Fuente repo: `supabase/migrations/20260713030000_product_customization_order_1_create_order_snapshot.sql`  
Live OID `17698` — verificado:

| Check | Resultado |
|-------|-----------|
| Literal `stock` en body | **false** |
| `UPDATE public.products` | **false** |
| `FOR UPDATE` | **false** |
| Valida `is_available = true` | **true** (parent + upsell) |

Flujo:

1. Inserta `orders` (total 0, status pending)
2. Pass 1: items `item_kind=product` → SELECT name/price WHERE available → INSERT order_items
3. Pass 2: items `item_kind=upsell` → mismo SELECT available → INSERT order_items + parent_order_item_id
4. UPDATE orders.total_price

**Conclusión:** `create_order` no descuenta stock ni para parent ni para upsell. Solo exige `is_available`.

## Evidencia pedido #8C2F

| Campo | Valor |
|-------|--------|
| id | `30c1b498-ab76-4d5b-afb6-cbeac24f8c2f` |
| status | **cancelled** |
| total_price | 15750 |
| customer | QA Plus Bebidas Retry |

Items:

| kind | product | qty | unit | parent |
|------|---------|-----|------|--------|
| product | Doble Smash | 1 | 12750 | null |
| upsell | Coca Cola 500ml | 1 | 3000 | parent id |

Items intactos post-cancel (CLEANUP-1). Cancelación no tocó stock.

## Evidencia Coca Cola 500ml

| Momento | stock | is_available |
|---------|-------|--------------|
| Pre-pedido (AVAILABILITY / QA Retry) | 5 | true |
| Post-pedido | 5 | true |
| Post-cancel | **5** | true |

Product id: `c5d56371-629e-4883-a57c-1a2ba59c8485`

## Auditoría de pedidos recientes

Limitación: no hay ledger histórico de stock → no se puede probar decremento mirando solo stock actual.

Hallazgo fuerte del catálogo live:

| Observación | Evidencia |
|-------------|-----------|
| Solo Coca Cola tiene stock > 0 | stock=5 |
| Resto del catálogo | stock=**0** y casi todos `is_available=true` (incl. Doble Smash) |
| Productos con stock=0 se venden | `#8C2F` parent Doble Smash (stock 0) + históricos QA previos |

Esto prueba que **ventas no dependen de stock positivo**; el gate operativo de venta es `is_available`.

## Auditoría de cancelación/restock

`updateOrderStatusAction` (`app/admin/(protected)/orders/[id]/actions.ts`):

- UPDATE `orders.status` únicamente
- No lee/escribe `products`
- Cancelar `#8C2F` no restauró ni alteró stock (sigue 5)

No existe decremento en `preparing` / `ready` / `completed` en código auditado.

## Hipótesis clasificada

### **H1 — Stock solo controla disponibilidad manual** (primaria)

```txt
products.stock existe y, al escribirse a <=0, el trigger fuerza is_available=false.
No hay consumo automático al crear pedidos (ni parent ni upsell).
create_order valida is_available, no stock.
Cancelación no restaura stock.
```

### Notas secundarias

- **H3** describe la deuda de diseño si se quiere inventario real (falta en create_order).
- **H5** aplica como inconsistencia de intención: la migración del trigger habla de “evitar sobreventas”, pero sin decremento no hay prevención automática.
- **H2** descartada: no hay lógica de decremento parcial que ignore upsells.
- **H4** descartada: status transitions no tocan stock.

## Riesgos detectados

1. Sobreventa posible si un operador pone stock>0 esperando inventario real (Coca Cola).
2. Catálogo vive con `stock=0` + `is_available=true` → stock no es fuente de verdad comercial hoy.
3. Insert con stock=0 fuerza unavailable (trigger); luego se puede reactivar `is_available` sin tocar stock → estado frágil.
4. Sin ledger, no hay auditoría de consumo histórico.

## Recomendación técnica

No implementar en esta fase. Para fase posterior:

```txt
Si se quiere inventario real:
1. Decrementar en create_order (misma transacción), SELECT … FOR UPDATE.
2. Incluir item_kind product + upsell con product_id not null.
3. Decrementar por quantity; fallar si stock insuficiente (cuando se active política).
4. Dejar que el trigger existente apague is_available si stock final <=0
   O setear explícitamente is_available en el mismo UPDATE.
5. Restock en cancelación: diseño explícito separado (solo pending/no-prepared?).
6. No backfill / no alterar pedidos históricos (#8C2F).
7. Definir política para productos legacy con stock=0 + available=true
   (opt-in track_stock, o migrar stock null/sentinel, o “stock no trackeado”).

Si NO se quiere inventario real aún:
- Documentar products.stock como campo operativo manual.
- Considerar no exigir stock positivo en create/edit defaults.
- Evitar marketing interno de “stock” como inventario automático.
```

Propuesta conservadora sugerida: fase de diseño/fix de decremento en `create_order` **solo tras** decidir política para productos con stock=0 actualmente vendibles.

## Fase posterior sugerida

**PRODUCT-STOCK-DECREMENT-DESIGN-1** (o FIX-1 tras diseño):

- Política track_stock / legacy stock=0
- Spec create_order + cancel restock
- Migración/RPC + tests; sin tocar pedidos históricos

## Qué NO se tocó

Código, schema, triggers, RPC, stock, productos, pedidos, flags, sesión, deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Resultado final

**PASS WITH DEBT**

Auditoría completa: `create_order` no consume stock; cancelación no restaura; stock es control manual + trigger de availability. Deuda: sin ledger histórico; pendiente diseño de inventario real.
