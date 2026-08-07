# PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-AVAILABILITY-1 — Reactivate Beverage Product for Upsell QA

## Objetivo

Desbloquear Plus/Bebidas reactivando Coca Cola 500ml de forma compatible con el modelo real de disponibilidad/stock, validar modal/cart/checkout pre-submit, **sin crear pedido**.

## Contexto

PLUS-BEBIDAS-QA-1 quedó **BLOCKED** porque Coca Cola 500ml tenía `is_available=false` y el public read model filtra sugeridos con `.eq("is_available", true)`.

## Alcance

- Auditoría schema/triggers de `products`
- Snapshot + decisión de reactivación
- Write solo si el producto sigue unavailable (auth presente)
- Browser QA catálogo/modal/cart/checkout pre-submit
- Docs

## Fuera de scope

Pedido QA, código, schema, migraciones, RLS, RPC, flags, sesión, precios, otros productos, customization groups/options/assignments, upsell targets, deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PLUS_BEBIDAS_AVAILABILITY_READ_ONLY=yes
AUTORIZO_REACTIVATE_COCA_COLA_FOR_PLUS_QA=yes
AUTORIZO_UPDATE_COCA_COLA_STOCK_FOR_PLUS_QA=yes
```

## Estado live inicial

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| slug | demohamburgueseria |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |
| store session | open (`a01252b0-323c-4afd-95c2-4d56aaa854b8`) |

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status --short` | working tree con cambios previos de customization (fuera de scope) |
| `npx tsc --noEmit` | PASS (`TSC_EXIT=0`) |
| `npm run build` | PASS (`BUILD_EXIT=0`) |

## Precheck remoto SQL

Flags + sesión open: **PASS**.

## Schema real de products

Columnas reales (`public.products`):

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

No existen: `stock_quantity`, `inventory`, `track_stock`, `manage_stock`, `sold_out`, `status`, `updated_at`.

## Triggers / stock availability

### Trigger

```txt
tr_auto_suspend_out_of_stock
BEFORE INSERT OR UPDATE OF stock ON public.products
→ auto_suspend_out_of_stock_product()
```

### Función

Si `NEW.stock <= 0` → fuerza `NEW.is_available := false`.

No re-activa automáticamente cuando stock > 0; solo suspende en stock ≤ 0 al tocar `stock` (INSERT o UPDATE OF stock).

### Causa raíz del bloqueo QA-1

1. PLUS-BEBIDAS-2 insertó Coca Cola con `stock` default `0` → trigger forzó `is_available=false`.
2. Luego se reactivó con `UPDATE is_available=true` dejando `stock=0` (válido: el trigger solo corre en INSERT/UPDATE OF stock).
3. En QA-1 el producto volvió a `is_available=false` con `stock=0` (posible toggle admin / UPDATE de stock que re-disparó el trigger).
4. En esta fase, al auditar, el producto **ya estaba** `is_available=true` con `stock=5` e `image_url` cargada — reactivación externa (admin/ops) entre QA-1 y AVAILABILITY-1.

## Snapshot previo (esta fase)

### Coca Cola 500ml (`c5d56371-629e-4883-a57c-1a2ba59c8485`)

| Campo | Valor al auditar |
|-------|------------------|
| name | Coca Cola 500ml |
| price | 3000.00 |
| category_id | `91580431-8507-40fd-9ba5-99deee008de4` (Bebidas) |
| is_available | **true** |
| stock | **5** |
| image_url | presente (storage product-images) |
| sku | null |

Referencia QA-1 (bloqueante): `is_available=false`, `stock=0`.

### Categoría Bebidas

| Campo | Valor |
|-------|--------|
| id | `91580431-…` |
| name | Bebidas |
| position | 90 |

### Upsell Bebidas item

| Campo | Valor |
|-------|--------|
| item | `df1e56f4-…` · `is_available=true` · sort_order 10 |
| group | Bebidas `3ef90826-…` · available · target Doble Smash |
| product_is_available | true |
| stock | 5 |

## Decisión aplicada

**Caso B parcial / no-op write:** el modelo real usa columna `stock` + trigger `stock<=0 → is_available=false`.

Al encontrar `is_available=true` y `stock=5` (compatible y durable frente a futuros UPDATE de stock con valor positivo), **no se ejecutó UPDATE** para evitar writes innecesarios en producción.

Auth de reactivación/stock estaba presente; no se usó porque el estado ya cumplía el objetivo.

## Cambios aplicados

Ningún write SQL en esta fase.

## Cambios no aplicados

- `UPDATE products SET stock=20, is_available=true` (no necesario; stock ya positivo)
- Soft-disable / reversión
- Pedido QA
- Cambios de código/schema/flags/sesión

## Verificación SQL post-write

N/A write. Estado confirmado post-auditoría:

| Check | Resultado |
|-------|-----------|
| Coca Cola `is_available` | true |
| Coca Cola `stock` | 5 |
| price | 3000 |
| upsell group/item available | true / true |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |

## Browser QA catálogo

`http://localhost:3000/b/demohamburgueseria/catalogo`

- Carga sin 500
- Categoría Bebidas + Coca Cola visible
- Negocio acepta pedidos (checkout posterior OK)
- Hydration warning Next.js conocido (deuda previa)

## Browser QA modal

Doble Smash → Personalizar:

- Papas / Salsas / Agregados extra visibles con descriptions
- Sección **También podés sumar** / “Sumá una bebida a tu burguer”
- **Coca Cola 500ml $ 3.000,00** visible y seleccionable
- CTA “Agregar al carrito” habilitado tras elegir Papas

## Browser QA cart V2

- Parent: Doble Smash
- Child plus: `+ Coca Cola 500ml $ 3.000,00`
- Total línea `$ 15.500,00` (12500 + 3000)
- Sin JSON raw
- localStorage cart limpiado al final

## Browser QA checkout pre-submit

`/b/demohamburgueseria/checkout`

- Checkout abre
- No aparece “no está aceptando pedidos”
- Resumen: Doble Smash + Papas chicas + Coca Cola
- Botón “Enviar pedido” presente/habilitado
- **No se envió pedido**

## Dashboard sanity

`/admin/dashboard` carga (sesión admin existente). Pedidos históricos visibles. No se movieron/crearon pedidos.

## Estado final live

```txt
product_customization_enabled = true
on_demand_mode_active = true
store session = open
Coca Cola 500ml is_available = true
stock = 5
upsell Bebidas item activo
modal muestra Coca Cola como plus
cart V2 muestra Coca Cola asociada
checkout pre-submit disponible
pedido QA no creado
```

## Reversión disponible

No ejecutada. Si se requiere soft-disable:

```sql
-- PREVIOUS_IS_AVAILABLE (QA-1 bloqueante) = false
-- PREVIOUS_STOCK (QA-1) = 0
-- CURRENT_STOCK = 5

update products
set stock = 0,
    is_available = false
where id = 'c5d56371-629e-4883-a57c-1a2ba59c8485'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';
-- Nota: UPDATE OF stock con 0 dispara trigger y fuerza is_available=false.
```

Para volver al estado actual:

```sql
update products
set stock = 5,
    is_available = true
where id = 'c5d56371-629e-4883-a57c-1a2ba59c8485'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';
```

## Qué NO se tocó

Código funcional, schema, migraciones, RLS, RPC, flags, store session, precios, nombre/descripción Coca Cola, otros productos, customization groups/options/assignments, upsell targets/items, pedidos.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (pre + post) |
| `npm run build` | PASS (pre + post) |

## Riesgos / deuda

- Pedido QA real con Plus pendiente (retry PLUS-BEBIDAS-QA-1)
- Solo una bebida en el grupo
- Upsell target solo Doble Smash
- Hydration warning en layout público (deuda conocida)
- Productos con `stock=0` + `is_available=true` son frágiles ante cualquier UPDATE de `stock`
- Reactivación entre fases no quedó auditada a nivel actor (admin UI vs SQL externo)

## Resultado final

**PASS WITH DEBT**

Coca Cola 500ml quedó disponible y compatible con el modelo stock/trigger; Plus/Bebidas vuelve a aparecer en modal y cart; checkout pre-submit OK; sin pedido QA.

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 Retry** — pedido QA real parent + Coca Cola plus + snapshot SQL + dashboard.
