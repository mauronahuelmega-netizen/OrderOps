# PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 — Real Order Snapshot & Dashboard Validation

## Objetivo

Crear y validar un pedido QA real desde UI pública (`demohamburgueseria`) con Doble Smash + personalizaciones + Coca Cola 500ml como Plus/upsell, y validar SQL + dashboard.

## Contexto

Tras PLUS-BEBIDAS-2 (PASS WITH DEBT): producto Coca Cola y upsell item existían; faltaba pedido QA real.

## Alcance

- Precheck flags/sesión/producto/upsell
- Pedido UI real (si Plus disponible)
- Validación SQL + dashboard
- Docs

## Fuera de scope

Código, schema, migraciones, RLS, RPC, config de customization/upsell, cambios de productos, deploy, cancelar/borrar pedidos.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PLUS_BEBIDAS_QA_READ_ONLY=yes
AUTORIZO_CREATE_PLUS_BEBIDAS_QA_ORDER=yes
```

Sin autorización para reactivar productos.

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
| `npx tsc --noEmit` | PASS (`TSC_EXIT=0`) |
| `npm run build` | PASS (`BUILD_EXIT=0`) |

## Precheck remoto SQL

Flags + sesión open: **PASS**.

## Snapshot previo

### Coca Cola 500ml

| Campo | Valor |
|-------|--------|
| id | `c5d56371-629e-4883-a57c-1a2ba59c8485` |
| name | Coca Cola 500ml |
| price | 3000.00 |
| category | Bebidas (`91580431-…`) |
| stock | 0 |
| **is_available** | **false** ← bloqueante |

### Upsell Bebidas

| Campo | Valor |
|-------|--------|
| group | `3ef90826-…` Bebidas · available · target Doble Smash |
| item | `df1e56f4-…` · available · product Coca Cola |
| product_available | **false** |

Public loader filtra sugeridos con `.eq("is_available", true)` (`lib/product-customization/public.ts`) → Plus no se hidrata.

### Últimos pedidos (antes de QA)

Último: `3ef3591e-…` Mauro Nahuel · `$16200` · completed · `2026-07-15 15:42:58Z`  
(No se creó pedido nuevo en esta fase.)

## Pedido QA creado

**No creado.**

Motivo: Coca Cola 500ml no está disponible; no aparece en catálogo ni en sección Plus del modal. Crear pedido sin Plus violaría el objetivo de la fase. Reactivar el producto está **prohibido** sin auth explícita de cambio de producto.

## Selecciones usadas

N/A — pedido no enviado.

## Validación SQL order

N/A

## Validación SQL order_items

N/A

## Validación total

N/A

## Validación snapshot

N/A

## Dashboard QA

No aplicable al pedido nuevo. Live: dashboard no mutado.

## Browser evidencia (bloqueo)

| Check | Resultado |
|-------|-----------|
| Catálogo | Sin categoría Bebidas / sin Coca Cola standalone |
| Modal Doble Smash | Papas / Salsas / Agregados OK; **sin** “También podés sumar” / Coca Cola |

## Estado final live

```txt
product_customization_enabled = true
on_demand_mode_active = true
store session = open
Coca Cola 500ml is_available = false
upsell group/item siguen active en DB
pedido QA = no creado
```

## Rollback / limpieza

N/A — sin writes.

## Remediation recomendada (próximo intento)

Con autorización explícita, p.ej.:

```txt
AUTORIZO_REACTIVATE_COCA_COLA_FOR_PLUS_QA=yes
```

```sql
update products
set is_available = true
where id = 'c5d56371-629e-4883-a57c-1a2ba59c8485'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf'
returning id, name, price, is_available, stock;
```

Nota: el trigger `tr_auto_suspend_out_of_stock` suspende en INSERT/UPDATE de `stock` cuando stock=0; un UPDATE solo de `is_available` (como en PLUS-BEBIDAS-2) es suficiente si nadie vuelve a tocar stock. Investigar si un toggle admin o update de stock revirtió el estado.

Luego re-ejecutar esta fase QA (pedido UI + SQL + dashboard).

## Qué NO se tocó

Código · schema · productos · upsell · customization · flags · sesión · pedidos · deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| Pre `tsc` / `build` | PASS |
| Post `tsc` / `build` | PASS |

## Riesgos / deuda

1. **Bloqueo:** Coca Cola inactiva → Plus invisible  
2. Causa de la desactivación no auditada (posible toggle admin / stock)  
3. Pedido QA real sigue pendiente  
4. Upsell solo targetea Doble Smash · más bebidas · assignments

## Resultado final

**BLOCKED**

## Próxima fase recomendada

**PLUS-BEBIDAS-QA-1 Retry** tras reactivar Coca Cola con auth explícita, luego crear pedido UI y validar parent/upsell/snapshot/dashboard.
