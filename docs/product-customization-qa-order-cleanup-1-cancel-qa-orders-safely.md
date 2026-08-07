# PRODUCT-CUSTOMIZATION-QA-ORDER-CLEANUP-1 — Cancel QA Orders Safely

## Objetivo

Cancelar de forma segura el pedido QA `#8C2F` (`30c1b498-…`) sin borrar evidencia histórica (order/items/snapshot/upsell).

## Contexto

PLUS-BEBIDAS-QA-1 Retry creó el pedido desde UI (PASS WITH DEBT) y lo dejó `pending`. Sin auth de cancelación en esa fase.

## Alcance

- Auditoría pedido/items
- Cancelación vía UI admin real (`updateOrderStatusAction`)
- Verificación SQL + dashboard
- Docs

## Fuera de scope

Borrados, cambios de stock/productos/config/código/schema, SQL fallback (sin auth), reopen, deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_QA_ORDER_CLEANUP_READ_ONLY=yes
AUTORIZO_CANCEL_QA_ORDER_8C2F=yes
AUTORIZO_CANCEL_QA_ORDERS_SAFELY=yes
```

Sin `AUTORIZO_CANCEL_QA_ORDER_WITH_SQL_FALLBACK` — no se usó SQL directo.

## Estado live inicial

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |
| store session | open (`a01252b0-…`) |

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Precheck remoto SQL

Flags + sesión open: **PASS**.

## Snapshot previo del pedido

| Campo | Valor |
|-------|--------|
| id | `30c1b498-ab76-4d5b-afb6-cbeac24f8c2f` |
| short_code UI | `#8C2F` |
| customer_name | QA Plus Bebidas Retry |
| total_price | 15750.00 |
| status | **pending** |
| delivery_method | pickup |
| notes | QA PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 RETRY |
| created_at | 2026-07-16 21:26:52Z |

## Snapshot previo de order_items

| id | product | kind | unit | parent | snapshot |
|----|---------|------|------|--------|----------|
| `c559f4bf-…` | Doble Smash | product | 12750 | null | v1 |
| `9138e5f2-…` | Coca Cola 500ml | upsell | 3000 | `c559f4bf-…` | null |

Coca Cola stock antes: **5**, available true.

## Vía de cancelación usada

**Prioridad 1 — UI admin dashboard.**

1. Abrir `/admin/dashboard?order=30c1b498-…`
2. Confirmar detalle `#8C2F - QA Plus` + notes RETRY
3. Combobox Estado → **Cancelado** (`cancelled`)
4. Click **Guardar estado**
5. Server action existente: `updateOrderStatusAction` en `app/admin/(protected)/orders/[id]/actions.ts`
6. Payload: `order_id=30c1b498-…`, `status=cancelled`

No SQL fallback. No RPC nueva. No código nuevo.

## Cambio aplicado

`orders.status`: `pending` → `cancelled` vía UI/admin.

## Verificación SQL post-cancelación

| Campo | Valor |
|-------|--------|
| status | **cancelled** |
| total_price | 15750.00 (conservado) |
| customer_name | QA Plus Bebidas Retry |
| notes | RETRY note conservada |
| created_at | intacto |

**PASS**

## Verificación de order_items

Parent + upsell child siguen existiendo; `parent_order_item_id` correcto; snapshot v1 presente en parent; sin deletes.

**PASS**

## Verificación de total

```txt
total_price = 15750.00
calculated_items_total = 15750.00
```

**PASS**

## Verificación de stock

Coca Cola: stock **5**, `is_available=true` (sin cambio manual ni automático por cancel).

## Dashboard QA

| Check | Resultado |
|-------|-----------|
| Pendientes | Sin pedidos (ya no #8C2F) |
| Cancelados | `#8C2F QA Plus` visible |
| Detalle | “Pedido cancelado” · Papas/Salsas/Plus sin JSON raw |
| Otros pedidos | no tocados |

**PASS**

## Estado final live

```txt
product_customization_enabled = true
on_demand_mode_active = true
store session = open
#8C2F status = cancelled
order_items intactos
snapshot intacto
upsell child intacto
stock sin ajuste manual
dashboard operativo limpio (pendientes vacío de este QA)
```

## Rollback / reversión

No ejecutada. Reopen a pending requeriría `AUTORIZO_REOPEN_QA_ORDER_8C2F=yes`.

## Qué NO se tocó

Código, schema, migraciones, RLS, RPC, flags, sesión, productos, stock, customization/upsell config, borrados, otros pedidos.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Riesgos / deuda

- Stock decrement audit de create_order sigue pendiente (deuda previa)
- Pedido cancelado permanece en historial (intencional)
- Hydration warning / más bebidas / targets (fuera de scope)

## Resultado final

**PASS WITH DEBT**

## Próxima fase recomendada

Continuar roadmap Product Customization (más bebidas / ampliar targets / assignments) o auditoría de decremento de stock en `create_order`.
