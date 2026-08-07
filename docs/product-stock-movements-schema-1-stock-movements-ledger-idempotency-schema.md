# PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 — Stock Movements Ledger & Idempotency Schema

## Objetivo

Crear `public.stock_movements` como ledger tenant-safe para movimientos de stock auditable e idempotente, sin registrar movimientos ni cambiar runtime.

## Contexto

| Fase previa | Estado |
|-------------|--------|
| PRODUCT-STOCK-RESTOCK-DESIGN-1 | PASS — recomienda ledger antes de restock |
| PRODUCT-STOCK-DECREMENT-ORDER-1 | PASS — create_order descuenta sin ledger |

Pre-fase: `stock_movements` ausente; Coca stock=4 tracked.

## Alcance

- Migration SQL
- Tabla + constraints + índices + unique parciales
- RLS SELECT tenant + super_admin
- `types/database.ts`
- Apply prod autorizado
- Docs

## Fuera de scope

create_order, updateOrderStatusAction, restock, inserts/backfill, stock/productos/pedidos, flags, UI, deploy.

## Autorización

```txt
AUTORIZO_STOCK_MOVEMENTS_SCHEMA_LOCAL=yes
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_MOVEMENTS_SCHEMA_READ_ONLY=yes
AUTORIZO_APPLY_STOCK_MOVEMENTS_SCHEMA_TO_PROD=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (pre + post types) |
| `npm run build` | PASS (final) |

## Auditoría previa

| Check | Resultado |
|-------|-----------|
| Tabla en prod | 0 rows / no exists |
| Patrón RLS | `business_id = (select profiles.business_id …)` + super_admin (como `order_events`) |
| Stub `supabase migration new` | Evitado (archivo creado directo; CLI hang histórico) |

## Migration creada

```txt
supabase/migrations/20260717120000_product_stock_movements_schema_1.sql
```

## Tabla stock_movements

Columnas: `id`, `business_id`, `product_id`, `order_id`, `order_item_id`, `movement_type`, `quantity_delta`, `stock_before`, `stock_after`, `reason`, `metadata`, `created_by`, `created_at`.

FK: businesses (cascade), products (restrict), orders/order_items (set null).

## Constraints

| Constraint | Regla |
|------------|-------|
| movement_type_check | order_decrement \| order_restock \| manual_adjustment |
| quantity_delta_nonzero | ≠ 0 |
| quantity_delta_direction | decrement &lt;0; restock &gt;0; manual ≠0 |
| stock_math | stock_after = stock_before + quantity_delta |
| stock_nonnegative | before/after ≥ 0 |
| order_context | order_* required for decrement/restock |

## Índices

Consulta: business/created_at, product/created_at, order_id, order_item_id, movement_type.

## Idempotencia

| Unique partial | Propósito |
|----------------|-----------|
| `stock_movements_order_item_decrement_once_idx` | un order_decrement por order_item |
| `stock_movements_order_item_restock_once_idx` | un order_restock por order_item |

## RLS / policies

- RLS enabled
- SELECT `stock_movements_select_own_business` para `authenticated` (tenant + super_admin)
- Sin INSERT/UPDATE/DELETE client-side (writes futuros vía SECURITY DEFINER / service role)

## Producción / apply

| Paso | Resultado |
|------|-----------|
| Método | `apply_migration` name `product_stock_movements_schema_1` |
| Resultado | Success |

## Verificación post-apply

| Check | Resultado |
|-------|-----------|
| count(*) | **0** |
| Unique decrement/restock indexes | presentes |
| RLS | true |
| SELECT policy | presente |
| Coca Cola | stock=**4**, available=true, track_stock=true |

## TypeScript / tipos

Agregado `stock_movements` Row/Insert/Update/Relationships en `types/database.ts` con `movement_type` union tipada.

## Browser sanity

| Ruta | Resultado |
|------|-----------|
| `/admin/products` | carga (sanity) |
| `/admin/dashboard` | carga (sanity) |
| Catálogo / Doble Smash | sin regresión esperada (sin cambio runtime) |
| Pedidos creados/cancelados | **ninguno** |

## Compatibilidad legacy

Tabla vacía; create_order sin cambios; productos/pedidos intactos; restock sigue sin implementar.

## Qué NO se tocó

create_order, updateOrderStatusAction, stock values, pedidos, flags, sesión, UI, deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| lint | No ejecutado (deuda ESLint 9 conocida) |

## Riesgos / deuda

- Decrementos ya hechos (#9632 Coca) **no** tienen `order_decrement` en ledger → restock futuro debe esperar DECREMENT-LEDGER-1 + bridge/cleanup documentado
- Sin policies de write: correcto para V1; RPC futuras deben usar definer/service role

## Resultado final

**PASS**

`public.stock_movements` creado como ledger tenant-safe con constraints e índices únicos parciales. Sin movimientos ni cambios de runtime.

## Próxima fase recomendada

**PRODUCT-STOCK-DECREMENT-LEDGER-1** — registrar `order_decrement` en `create_order` junto al UPDATE de stock.
