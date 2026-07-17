# PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-2 — Create Beverage Products & Enable Upsell

## Objetivo

Desbloquear Plus/Bebidas en `demohamburgueseria`: crear producto bebida vivo, poblar `upsell_group_items`, validar modal → cart V2 → checkout pre-submit.

## Contexto

PLUS-BEBIDAS-1 terminó **BLOCKED** (grupo Bebidas sin items; 0 productos bebida vivos).

## Alcance

- Crear categoría Bebidas + producto Coca Cola 500ml
- Insertar item en upsell group Bebidas
- Browser QA catálogo / modal / cart / checkout / dashboard
- Docs

## Fuera de scope

Código, schema, migraciones, RLS, RPC, customization names/options/assignments, precios de productos existentes, flags, sesión, pedido QA (sin auth de order), deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PLUS_BEBIDAS_2_READ_ONLY=yes
AUTORIZO_CREATE_BEVERAGE_PRODUCTS=yes
AUTORIZO_CREATE_BEVERAGE_CATEGORY=yes
AUTORIZO_UPDATE_UPSELL_GROUP_ITEMS=yes
AUTORIZO_ENABLE_REAL_BEVERAGE_UPSELL=yes
```

Sin `AUTORIZO_CREATE_PLUS_BEBIDAS_QA_ORDER` → QA hasta checkout pre-submit.

## Estado live inicial

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |
| store session | open |
| Bebidas upsell | `3ef90826-4708-42c2-a34b-6e9137c98f27` · target Doble Smash · 0 items |
| productos bebida vivos | 0 |

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (`BUILD_EXIT=0`) |

## Precheck remoto SQL

Flags + sesión open: **PASS**.

## Snapshot previo

- Upsell Bebidas exists, available, `target_type=product`, `target_id=e0de9b79-…` (Doble Smash)
- `upsell_group_items` = []
- Categorías: HAMBURGUESAS / COMBOS / PIZZAS / EMPANADAS — sin Bebidas
- Productos bebida vivos: 0

## Schema real usado para products/categories

### categories

`id`, `business_id`, `name`, `position` (nullable), `created_at`  
Sin `description` / `is_available` / `sort_order`.

### products

`id`, `business_id`, `category_id` (**NOT NULL**), `name`, `description`, `price` (numeric pesos), `image_url`, `is_available`, `sku`, `stock` (default 0), `created_at`  
Sin `sort_order`.

Trigger: `tr_auto_suspend_out_of_stock` — en INSERT con `stock=0` fuerza `is_available=false`. Workaround: UPDATE `is_available=true` post-insert (mismo patrón que productos existentes con stock 0).

Precios de referencia: Doble Smash `12500`, Clásica `8500` → Coca Cola histórica `3000` en pesos (no centavos).

## Productos bebida creados

| id | name | price | is_available | category |
|----|------|-------|--------------|----------|
| `c5d56371-629e-4883-a57c-1a2ba59c8485` | Coca Cola 500ml | 3000.00 | true | Bebidas |

Descripción: `Coca Cola fría de 500ml.`

## Categoría Bebidas

| id | name | position |
|----|------|----------|
| `91580431-8507-40fd-9ba5-99deee008de4` | Bebidas | 90 |

Creada porque `products.category_id` es NOT NULL.

## Upsell group Bebidas

| Campo | Valor |
|-------|--------|
| group id | `3ef90826-4708-42c2-a34b-6e9137c98f27` |
| item id | `df1e56f4-df7b-4837-9658-073ac67a9b76` |
| product | Coca Cola 500ml |
| sort_order | 10 |
| item/group/product available | true |

## Cambios aplicados

1. INSERT category Bebidas  
2. INSERT product Coca Cola 500ml (+ UPDATE `is_available=true` por trigger stock)  
3. INSERT `upsell_group_items` sort 10  

## Cambios no aplicados

- Más bebidas (Agua, etc.)
- Ampliar `target` más allá de Doble Smash
- Pedido QA
- Código / customization / flags / sesión

## Browser QA catálogo

PASS: carga OK; categoría Bebidas con Coca Cola 500ml; copy limpio; Doble Smash “Desde $…”.

## Browser QA modal

PASS (Doble Smash):

- Papas / Salsas / Agregados extra + descriptions
- Sección **También podés sumar** / `Sumá una bebida a tu burguer`
- Coca Cola 500ml `$ 3.000,00` seleccionable
- CTA OK

## Browser QA cart V2

PASS:

```txt
Doble Smash $12.750 c/u → línea $15.750
Papas: Papas chicas
Salsas: Salsa Big Mac (+$250)
+ Coca Cola 500ml $3.000
```

Cart limpiado al final.

## Browser QA checkout pre-submit

PASS: abre; acepta pedidos; submit habilitado; resumen con customizations + Coca Cola; **no** enviado.

## Dashboard QA

PASS: `#7D0A` / `#213F` / `#6B7C` visibles; sin mutaciones.

## Pedido QA opcional

No ejecutado (sin `AUTORIZO_CREATE_PLUS_BEBIDAS_QA_ORDER`).

## Estado final live

```txt
product_customization_enabled = true
on_demand_mode_active = true
store session = open
Coca Cola 500ml activa
Bebidas upsell con 1 item activo
modal/cart/checkout pre-submit OK
```

## Reversión disponible

No ejecutada. Soft-disable:

```sql
update upsell_group_items
set is_available = false, updated_at = now()
where id = 'df1e56f4-df7b-4837-9658-073ac67a9b76'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update products
set is_available = false
where id = 'c5d56371-629e-4883-a57c-1a2ba59c8485'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

-- categoría Bebidas (queda con producto; no desactivar salvo pedido)
-- update categories set position = null where id = '91580431-8507-40fd-9ba5-99deee008de4';
```

Nota: categories no tiene `is_available`.

IDs:

```txt
CREATED_CATEGORY_ID=91580431-8507-40fd-9ba5-99deee008de4
CREATED_PRODUCT_ID=c5d56371-629e-4883-a57c-1a2ba59c8485
CREATED_UPSELL_GROUP_ITEM_ID=df1e56f4-df7b-4837-9658-073ac67a9b76
```

## Qué NO se tocó

Código · schema · migraciones · RLS/RPC · customization · precios existentes · flags · sesión · pedidos históricos · deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| Pre `tsc` / `build` | PASS |
| Post `tsc` / `build` | PASS |

## Riesgos / deuda

- Solo 1 bebida (Agua / más SKUs opcionales)
- Upsell solo targetea **Doble Smash**
- Assignments customization limitados
- Pedido QA con parent+upsell child no creado
- Trigger stock=0 en INSERT (documentado; reactivado post-write)
- Coca Cola también aparece standalone en catálogo (aceptable)

## Resultado final

**PASS WITH DEBT**

## Próxima fase recomendada

1. Pedido QA real con plus (si se autoriza)  
2. Ampliar target upsell / más bebidas  
3. Expandir assignments customization  
4. ADMIN-UX-2 / OPTION-IMAGES-1
