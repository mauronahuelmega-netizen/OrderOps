# PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-1 — Real Beverage Upsell Setup

## Objetivo

Poblar y validar el grupo de venta sugerida **Bebidas** en `demohamburgueseria` con productos reales existentes, para que el modal público sugiera bebidas como plus/upsell.

## Contexto

Tras GROUP-DESCRIPTIONS-1:

- Product Customization live
- Grupos: Papas / Salsas / Agregados extra (descriptions alineadas)
- Opciones: Cheddar / Salsa Big Mac
- Deuda principal: Plus Bebidas vacío

## Alcance

- Auditoría read-only de `upsell_groups` / `upsell_group_items` / productos bebida
- Poblar items **solo** si hay productos existentes + autorización de write
- Browser QA catálogo / modal / cart / checkout / dashboard (sin pedido QA)

## Fuera de scope

Código, schema, migraciones, RLS, RPC, precios, nombres de customization, assignments, flags, sesión, crear productos sin auth, deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PLUS_BEBIDAS_READ_ONLY=yes
AUTORIZO_UPDATE_UPSELL_GROUP_ITEMS=yes
AUTORIZO_ENABLE_REAL_BEVERAGE_UPSELL=yes
```

**Ausente (bloqueante):**

```txt
AUTORIZO_CREATE_BEVERAGE_PRODUCTS=yes
AUTORIZO_CREATE_PLUS_BEBIDAS_QA_ORDER=yes
```

## Estado live inicial

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |
| store session | open (`a01252b0-323c-4afd-95c2-4d56aaa854b8`) |

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (`TSC_EXIT=0`) |
| `npm run build` | PASS (`BUILD_EXIT=0`) |

## Precheck remoto SQL

Flags + sesión open: **PASS**.

## Snapshot previo

### Upsell groups

| id | name | description | target_type | target_id | is_available |
|----|------|-------------|-------------|-----------|--------------|
| `3ef90826-4708-42c2-a34b-6e9137c98f27` | Bebidas | Sumá una bebida a tu burguer | product | `e0de9b79-c238-4e52-adf4-92c05ead1764` (Doble Smash) | true |

### Upsell group items

```txt
[]  (vacío)
```

### Customization (contexto, intacto)

Papas / Salsas / Agregados extra activos; Cheddar / Salsa Big Mac OK.

## Productos bebida candidatos

### En catálogo actual (`products`)

```txt
NINGUNO
```

Búsqueda por nombre (`coca`, `cola`, `sprite`, `fanta`, `agua`, `bebida`) y por categoría: **0 filas**.

Categorías actuales: COMBOS / EMPANADAS / HAMBURGUESAS / PIZZAS — **no existe categoría Bebidas**.

### Evidencia histórica (order_items; product_id ya null)

| product_name | unit_price | nota |
|--------------|------------|------|
| Coca Cola 500ml | 3000 | usado en upsell QA (#213F / rollout) |
| Agua | 2500 | histórico |
| Agua con gas | 2500 | histórico |
| Coca Cola 1.5lt | 5500 | histórico |

Los productos fueron **eliminados** del catálogo; los pedidos conservan `product_name` en snapshot/line item, con `product_id = null`.

## Decisión aplicada

**No se aplicaron writes.**

Motivo:

1. `upsell_group_items.product_id` requiere FK a `products`.
2. No hay productos bebida vivos.
3. Crear productos requiere `AUTORIZO_CREATE_BEVERAGE_PRODUCTS=yes` (ausente).
4. Preferencia de fase: no inventar bebidas; no usar combos/hamburguesas como proxy.

Clasificación: **BLOCKED**.

## Cambios aplicados

Ninguno.

## Cambios no aplicados

- Insert/reactivación de `upsell_group_items`
- Creación de productos bebida / categoría Bebidas
- Cambio de `target_type` / `target_id` del upsell group
- Pedido QA
- Código / schema / flags / sesión

## Browser QA catálogo

PASS: catálogo carga; copy comercial limpio; Doble Smash / BBQ Bacon con “Desde $…”.

## Browser QA modal

PASS (sin plus):

- Doble Smash abre modal
- Papas / Salsas / Agregados extra + descriptions visibles
- **Sección Bebidas no aparece** — esperado: public loader exige `upsellGroup.products.length > 0` (`lib/product-customization/public.ts`)
- Grupo upsell existe y apunta a Doble Smash, pero sin items no se renderiza

## Browser QA cart V2

N/A — no hay bebida seleccionable. No se agregó carrito de plus.

## Browser QA checkout pre-submit

N/A para plus. Live sigue aceptando pedidos (sesión open + on_demand true); no se revalidó checkout completo en esta fase por falta de payload plus.

## Dashboard QA

PASS: dashboard carga; `#7D0A`, `#213F` (card aún muestra “Coca Cola 500ml” histórico), `#6B7C` visibles; sin mutaciones.

## Pedido QA opcional

No ejecutado — falta `AUTORIZO_CREATE_PLUS_BEBIDAS_QA_ORDER=yes` y además no hay productos bebida.

## Estado final live

```txt
product_customization_enabled = true
on_demand_mode_active = true
store session = open
upsell Bebidas = exists, available, target Doble Smash
upsell_group_items = 0
productos bebida vivos = 0
customization groups/options = intactos
```

## Reversión disponible

N/A — sin writes.

## Qué NO se tocó

Código · schema · migraciones · RLS/RPC · precios · customization · assignments · flags · sesión · pedidos · productos · deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| Pre `tsc` / `build` | PASS (`TSC_EXIT=0`, `BUILD_EXIT=0`) |
| Post `tsc` / `build` | PASS (`TSC_EXIT=0`, `BUILD_EXIT=0`) |

## Riesgos / deuda

1. **Bloqueo principal:** recrear productos bebida (mínimo Coca Cola 500ml @ $3000) + opcional categoría Bebidas
2. Luego poblar `upsell_group_items` en grupo `3ef90826-…`
3. Upsell hoy solo targetea **Doble Smash** (`target_type=product`); BBQ Bacon y otros no verán plus hasta ampliar target (auth separada)
4. Assignments customization limitados
5. ADMIN-UX-2 / imágenes

### Plan recomendado (próxima fase autorizada)

Con:

```txt
AUTORIZO_CREATE_BEVERAGE_PRODUCTS=yes
AUTORIZO_UPDATE_UPSELL_GROUP_ITEMS=yes
AUTORIZO_ENABLE_REAL_BEVERAGE_UPSELL=yes
```

1. Crear categoría `Bebidas` (si se desea visibilidad en catálogo) o producto sin categoría dedicada según UX owner
2. Crear al menos:

| name | price sugerido (histórico) |
|------|----------------------------|
| Coca Cola 500ml | 3000 |
| Agua | 2500 |

3. Insertar en `upsell_group_items` del grupo Bebidas (`sort_order` 10, 20…)
4. Browser QA modal → cart → checkout pre-submit
5. Pedido QA solo con `AUTORIZO_CREATE_PLUS_BEBIDAS_QA_ORDER=yes`

## Resultado final

**BLOCKED**

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-2** (o retry de esta fase) con autorización explícita para **crear productos bebida** y luego poblar `upsell_group_items`.
