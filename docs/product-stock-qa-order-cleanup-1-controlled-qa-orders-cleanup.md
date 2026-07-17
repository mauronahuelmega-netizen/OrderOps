# PRODUCT-STOCK-QA-ORDER-CLEANUP-1 — Controlled QA Orders Cleanup

## Objetivo

Limpiar pedidos QA pendientes de fases Stock/Restock/Customization mediante cancelación controlada, sin deletes, sin backfill de ledger y sin ajuste manual de stock.

## Contexto

| Fase previa | Estado |
|-------------|--------|
| PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 | **PASS** |

Tenant: `demohamburgueseria` / `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` / `pkrsedmwxekbhlohhqds`.

Nota: no existe columna `orders.short_code`; códigos UI (`#9632`, etc.) = sufijo del UUID.

## Alcance

- Auditoría read-only de QA + Coca + movements
- Cancelación UI de pendientes QA autorizados
- Verificación stock/movements/dashboard
- Docs / CURRENT_PHASE / living memory

## Fuera de scope

- Deletes de orders/items/movements
- Modificar código/schema/RPC/action
- Backfill ledger / restock retroactivo `#9632`
- Ajuste manual de stock
- Deploy / flags / sesión / productos

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_STOCK_QA_ORDER_CLEANUP_READ_ONLY=yes
AUTORIZO_CANCEL_QA_PENDING_ORDERS=yes
AUTORIZO_CANCEL_QA_ORDER_9632=yes
AUTORIZO_CANCEL_QA_ORDERS_WITH_RPC_FALLBACK=yes
```

Sin `AUTORIZO_MANUAL_STOCK_RECONCILIATION_FOR_PRE_LEDGER_QA` → no se ajustó stock manualmente.

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría previa

| Recurso | Estado |
|---------|--------|
| Flags | customization=true, on_demand=true |
| Coca | stock=**4**, available, track_stock=true, price=3000 |
| `#754A` | cancelled · decrement+restock · no action |
| `#8B9A` | cancelled · decrement+restock · no action |
| `#503E` | cancelled · 0 movements · no action |
| `#8C2F` | cancelled · 0 movements · no action |
| `#9632` | **pending** · 0 movements · Coca upsell pre-ledger |
| `#9B25` | **pending** · 0 movements · Clásica legacy QA |

## Pedidos QA detectados

### Accionables (pending)

| UI | ID | Clasificación |
|----|-----|---------------|
| `#9632` | `f34118c6-…` | pending without ledger → cancel **sin** restock |
| `#9B25` | `d2489663-…` | pending without ledger (legacy no-tracked) → cancel sin stock side effects |

### Ya cerrados / no action

`#754A`, `#8B9A`, `#503E`, `#8C2F` cancelled. Completados QA históricos (`#213F`, `#6B7C`, etc.) no tocados.

## Plan de cleanup

```txt
cleanup = pending QA → cancelled vía UI admin (updateOrderStatusAction → transition_order_status)
```

Sin deletes. Sin SQL de status. RPC fallback autorizado pero no necesario.

## Cancelación #9632

UI: `/admin/orders/f34118c6-…` → Cancelado → Guardar.

| Check | Resultado |
|-------|-----------|
| status | pending → **cancelled** |
| Coca stock | **4** (sin cambio) |
| stock_movements | **0** (sin `order_restock`) |
| Items | Doble Smash + Coca upsell intactos |

Correcto por contrato: sin `order_decrement` no hay restock automático.

## Otros pedidos QA

`#9B25` cancelado vía UI admin.

| Check | Resultado |
|-------|-----------|
| status | pending → cancelled |
| movements | 0 |
| Coca | sin cambio (track_stock=false / sin ledger) |

## Stock / movements post-cleanup

Coca: stock=**4**, available=true, track_stock=true.

| Pedido | Movements |
|--------|-----------|
| `#754A` | decrement + restock |
| `#8B9A` | decrement + restock |
| `#503E` | ninguno |
| `#9632` | ninguno |
| `#9B25` | ninguno |
| `#8C2F` | ninguno |

Pending QA restantes: **0**.

## Dashboard sanity

`/admin/dashboard`:

- Pendientes: **Sin pedidos**
- Cancelados: `#754A`, `#8B9A`, `#503E`, `#9632`, `#9B25`, `#8C2F`
- Catálogo carga · Coca visible

## Compatibilidad inventario

El sistema respetó el ledger:

- Restock solo con `order_decrement` previo
- Pre-ledger `#9632` no infló stock al cancelar

### Deuda histórica documentada

`#9632` consumió 1 Coca en DECREMENT-ORDER-1 (5→4) **antes** del ledger. Al cancelarlo ahora el stock **no** vuelve. Queda 1 unidad histórica no reconciliada por diseño; no se corrigió manualmente (sin auth de reconciliación).

## Qué NO se tocó

Código, schema, RPC, action, products, flags, sesión, deletes, backfill, deploy, stock manual.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Riesgos / deuda

1. **Deuda stock pre-ledger:** 1 unidad Coca asociada a `#9632` no restockeable por contrato (stock actual 4 es correcto bajo reglas ledger).
2. Pedidos QA `completed` antiguos permanecen (intencional).
3. Frontend Plus Bebidas sigue dependiendo del WIP local no desplegado (fuera de esta fase).

## Resultado final

**PASS WITH DEBT** (deuda histórica pre-ledger de 1 Coca documentada; cleanup operativo completo).

## Próxima fase recomendada

1. Opcional: reconciliación manual de stock pre-ledger **solo** con auth explícita
2. Deploy WIP Product Customization (Plus UI)
3. Monitoreo live ops / handoff stock v1
