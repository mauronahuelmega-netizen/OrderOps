# PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 — Retry / Real Order Snapshot & Dashboard Validation

## Objetivo

Crear y validar un pedido QA real desde UI pública (`demohamburgueseria`) con Doble Smash + personalizaciones + Coca Cola 500ml como Plus/upsell, y validar SQL + dashboard.

## Contexto

- QA-1 original: **BLOCKED** (Coca Cola `is_available=false`)
- AVAILABILITY-1: **PASS WITH DEBT** (Coca Cola visible, `stock=5`, sin pedido)
- Esta fase: retry del pedido QA runtime

## Alcance

- Precheck flags/sesión/producto/upsell
- Pedido UI real
- Validación SQL order / items / total / snapshot / stock
- Dashboard admin
- Docs

## Fuera de scope

Código, schema, migraciones, RLS, RPC, config customization/upsell, cambios de productos/stock, deploy, cancelar/borrar pedidos.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PLUS_BEBIDAS_QA_RETRY_READ_ONLY=yes
AUTORIZO_CREATE_PLUS_BEBIDAS_QA_ORDER=yes
```

Sin `AUTORIZO_CANCEL_PLUS_BEBIDAS_QA_ORDER_AFTER_VALIDATION` → pedido queda pending.

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

## Snapshot previo

### Coca Cola 500ml

| Campo | Valor |
|-------|--------|
| id | `c5d56371-629e-4883-a57c-1a2ba59c8485` |
| price | 3000 |
| is_available | true |
| stock | **5** (antes) |
| category | Bebidas |

### Upsell Bebidas

| Campo | Valor |
|-------|--------|
| group | Bebidas · available · target Doble Smash |
| item | `df1e56f4-…` · available |
| product | Coca Cola · available · stock 5 |

### Último pedido antes del QA

| Campo | Valor |
|-------|--------|
| id | `3ef3591e-daa1-42d5-9a40-0eeef8827d0a` |
| customer | Mauro Nahuel Ramirez Gonzalez |
| total_price | 16200 |
| status | completed |
| created_at | 2026-07-15 15:42:58Z |

Nota schema: `orders` usa `total_price` + `phone` (no `total_amount` / `short_code` columna).

## Pedido QA creado

| Campo | Valor |
|-------|--------|
| NEW_ORDER_ID | `30c1b498-ab76-4d5b-afb6-cbeac24f8c2f` |
| SHORT_CODE (UI) | `#8C2F` |
| customer_name | QA Plus Bebidas Retry |
| phone | 1100000000 |
| total_price | **15750.00** |
| status | pending |
| delivery_method | pickup |
| notes | QA PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 RETRY |
| created_at | 2026-07-16 21:26:52Z |
| success URL | `/b/demohamburgueseria/success?order_id=30c1b498-…` |

Creado desde UI pública (checkout), no vía RPC directo.

## Selecciones usadas

| Selección | Valor | Precio |
|-----------|--------|--------|
| Producto | Doble Smash | base 12500 |
| Papas | Papas chicas | +0 |
| Salsas | Salsa Big Mac | +250 |
| Agregados extra | ninguno | — |
| Plus | Coca Cola 500ml | +3000 |
| **Total esperado** | | **15750** |

## Validación SQL order

| Check | Resultado |
|-------|-----------|
| customer_name | QA Plus Bebidas Retry |
| notes | RETRY note presente |
| total_price | 15750 |
| status | pending |
| delivery_method | pickup |

**PASS**

## Validación SQL order_items

### Parent — Doble Smash

| Campo | Valor |
|-------|--------|
| id | `c559f4bf-59a3-4637-b03a-f152a6493794` |
| product_id | `e0de9b79-…` (Doble Smash) |
| item_kind | **product** |
| parent_order_item_id | null |
| quantity | 1 |
| unit_price | **12750** (12500+250) |
| customization_snapshot | presente, version 1 |

### Child — Coca Cola 500ml

| Campo | Valor |
|-------|--------|
| id | `9138e5f2-a4c6-4124-a797-8ac02c35be57` |
| product_id | `c5d56371-…` |
| item_kind | **upsell** |
| parent_order_item_id | `c559f4bf-…` (parent) |
| quantity | 1 |
| unit_price | **3000** |
| customization_snapshot | null |

**PASS**

## Validación total

```txt
total_price = 15750.00
calculated_items_total = 15750.00
```

**PASS**

## Validación snapshot

Parent `customization_snapshot`:

| Campo | Valor |
|-------|--------|
| version | 1 |
| source | public_checkout |
| groups | Papas (Papas chicas, delta 0), Salsas (Salsa Big Mac, delta 250) |
| Agregados extra | no presente (ninguna opción seleccionada) |
| pricing | base 12500 · customization_total 250 · final 12750 |
| summary | `Papas: Papas chicas`, `Salsas: Salsa Big Mac (+$250)` |
| configuration_signature | incluye upsell product id Coca Cola |

**PASS**

## Validación stock post-pedido

| Momento | stock | is_available |
|---------|-------|--------------|
| Antes | 5 | true |
| Después | **5** | true |

Stock **no decrementó** al vender 1 unidad. Documentado como deuda (no corregido en esta fase).

## Dashboard QA

| Check | Resultado |
|-------|-----------|
| Aparece en Pendientes | sí `#8C2F QA Plus` |
| Card summary | `2 items 1x Doble Smash · 1x Coca Cola 500ml` |
| Detalle: Papas / Salsas | sí, sin JSON raw |
| Detalle: Plus Coca Cola | `Plus + Coca Cola 500ml × 1 $ 3.000,00` |
| Estado | Pendiente |
| Workflow | Tomar / Guardar estado disponible |
| Movimiento de estado | **no** (sin auth de operación) |

**PASS**

## Estado final live

```txt
product_customization_enabled = true
on_demand_mode_active = true
store session = open
Coca Cola is_available = true
stock = 5 (sin decremento)
upsell Bebidas activo
pedido QA #8C2F pending
parent + upsell child validados
total / snapshot / dashboard OK
```

## Rollback / limpieza

No ejecutada. Sin auth de cancelación. Pedido queda `pending` para operación del negocio o cleanup futuro autorizado.

## Qué NO se tocó

Código, schema, migraciones, RLS, RPC, flags, sesión, productos, stock manual, customization/upsell config, precios, deploy. Pedido no cancelado/borrado.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Riesgos / deuda

- Stock de Coca Cola no decrementa en `create_order` (queda en 5)
- Pedido QA queda pending en lane operativa
- Una sola bebida en Plus
- Upsell solo target Doble Smash
- Hydration warning en catálogo público

## Resultado final

**PASS WITH DEBT**

## Próxima fase recomendada

- Cleanup/cancel QA order (con auth), o
- Ampliar bebidas/targets/assignments, o
- Investigar decremento de stock en create_order (fase de producto dedicada)
