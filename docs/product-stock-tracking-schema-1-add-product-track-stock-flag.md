# PRODUCT-STOCK-TRACKING-SCHEMA-1 — Add Product Stock Tracking Flag

## Objetivo

Agregar `products.track_stock boolean NOT NULL DEFAULT false` como base del inventario híbrido, sin cambiar runtime.

## Contexto

Diseño aprobado en PRODUCT-STOCK-DECREMENT-DESIGN-1: tracking opt-in; default false preserva legacy (`is_available` only).

## Alcance

- Migration SQL
- Apply producción (autorizado)
- Tipos `types/database.ts`
- Docs

## Fuera de scope

create_order, triggers, admin UI, checkout/cart, stock/is_available values, `track_stock=true` en Coca Cola, pedidos, flags, deploy.

## Autorización

```txt
AUTORIZO_STOCK_TRACKING_SCHEMA_LOCAL=yes
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_TRACKING_SCHEMA_READ_ONLY=yes
AUTORIZO_APPLY_STOCK_TRACKING_SCHEMA_TO_PROD=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (post-change) |

## Schema previo

| column | type | nullable | default |
|--------|------|----------|---------|
| is_available | boolean | NO | true |
| stock | integer | NO | 0 |
| track_stock | — | — | **no existía** |

Pre-apply demohamburgueseria: 17 products · 15 con stock=0 + available · flags true.

## Migration creada

Archivo: `supabase/migrations/20260716224005_product_stock_tracking_schema_1.sql`

```sql
alter table public.products
  add column if not exists track_stock boolean not null default false;

comment on column public.products.track_stock is
  'When true, future order creation flows must validate and decrement stock transactionally. Default false preserves legacy manual availability behavior.';
```

## Verificación local

Migration file presente en repo con el SQL anterior (CLI `supabase migration new` generó el archivo; contenido escrito para coincidir con apply).

## Producción / apply

Aplicada vía Supabase MCP `apply_migration` name `product_stock_tracking_schema_1` (autorización apply presente).

## Verificación post-apply

| Check | Resultado |
|-------|-----------|
| column | `track_stock` boolean NOT NULL default `false` |
| productos | `track_stock=false` · count **17** (todos) |
| product_customization_enabled | true |
| on_demand_mode_active | true |
| store session | open |

## TypeScript / tipos

Actualizado `types/database.ts` → `products.Row` / `Insert` / `Update` con `track_stock`.

No se modificó `lib/products/admin.ts` list type (select explícito sin columna; UI sin tracking aún).

## Browser sanity

| Ruta | Resultado |
|------|-----------|
| `/b/demohamburgueseria/catalogo` | Carga; Bebidas/Coca Cola visibles |
| Admin products / dashboard | Sanity sin 500 esperado (sin cambio UI) |

Sin pedido creado. Sin editar productos.

## Compatibilidad legacy

- Default false → menú con stock=0 + available sigue igual
- create_order sin cambios → no valida/descuenta stock
- Coca Cola sigue `track_stock=false` (activación en fase posterior)

## Qué NO se tocó

create_order, triggers, stock values, is_available, admin/public UI, pedidos, flags, sesión, deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Riesgos / deuda

- Admin aún no expone switch tracking (ADMIN-UX-1)
- create_order aún no consume stock (DECREMENT-ORDER-1)
- Tipos admin list sin `track_stock` hasta UX

## Resultado final

**PASS**

## Próxima fase recomendada

**PRODUCT-STOCK-ADMIN-UX-1** — switch “Controlar stock automáticamente” en create/edit product.
