# PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 — Deploy Status Action Wiring & UI Cancel Smoke

## Objetivo

Cerrar la deuda de deploy de `PRODUCT-STOCK-RESTOCK-CANCEL-1`: desplegar el wiring de `updateOrderStatusAction` y validar cancelación con restock desde UI admin productiva.

## Contexto

| Fase previa | Estado |
|-------------|--------|
| PRODUCT-STOCK-RESTOCK-CANCEL-1 | **PASS WITH DEBT** (RPC live; action local sin deploy) |

Tenant: `demohamburgueseria` / `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` / `pkrsedmwxekbhlohhqds`.

## Alcance

- Verificar wiring local → RPC
- Deploy a Vercel (push `main`)
- Crear pedido QA tracked desde UI pública
- Cancelar desde UI admin productiva
- Verificar ledger + idempotencia + dashboard/timeline
- Docs / CURRENT_PHASE / living memory

## Fuera de scope

- Modificar `create_order` / `transition_order_status` / schema `stock_movements`
- Backfill `#9632` / cancel `#8C2F`
- Cambiar flags / sesión / customization / stock manual

## Autorización

```txt
AUTORIZO_STOCK_RESTOCK_ACTION_DEPLOY_SMOKE_LOCAL=yes
…READ_ONLY=yes
AUTORIZO_DEPLOY_STATUS_ACTION_WIRING_TO_VERCEL=yes
AUTORIZO_CREATE_STOCK_RESTOCK_UI_SMOKE_QA_ORDER=yes
AUTORIZO_CANCEL_STOCK_RESTOCK_UI_SMOKE_QA_ORDER=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| Wiring `transition_order_status` en action | PASS |
| Sin UPDATE directo de status en camino UI | PASS |
| `npx tsc --noEmit` (pre-deploy) | PASS |
| `npm run build` (pre-deploy) | PASS |

## Auditoría wiring local

Archivo: `app/admin/(protected)/orders/[id]/actions.ts`

- Permisos + guard sesión + validación status + no-op same-status
- `supabase.rpc("transition_order_status", { p_order_id, p_target_status })`
- Timeline `createOrderEvent(status_changed)` post-RPC
- Reload select de order (sin UPDATE status)
- Mapeo `RESTOCK_CONFLICT` / errores RPC

## Auditoría producción previa

| Check | Resultado |
|-------|-----------|
| RPC `transition_order_status` | EXISTS `(uuid, text) → jsonb` |
| Coca stock | **4**, available, track_stock=true |
| Flags | customization=true, on_demand=true |
| Session | open (`closed_at` null) |

## Deploy

| Campo | Valor |
|-------|-------|
| Método | `git push origin main` (Vercel auto-deploy) |
| Commit | `b0bfddb5f2f043b9899c0bc40b5c7b919dc0baa6` |
| Mensaje | `fix(orders): route status updates through transition_order_status` |
| Archivos | action + types RPC + migration SQL + doc RESTOCK-CANCEL-1 |
| URL | `https://orderops.vercel.app` |
| Hora approx | 2026-07-17 ~01:56 ART (push) · smoke UI ~02:08 ART |
| Evidencia deploy efectivo | cancel UI insertó `order_restock` con `metadata.source=transition_order_status` |

## QA create tracked order

Pedido desde UI pública `/b/demohamburgueseria/catalogo` → checkout:

| Campo | Valor |
|-------|-------|
| order_id | `21064f2b-ba55-4fbd-a978-c9085702754a` |
| UI code | `#754A` |
| Cliente | QA Restock UI Smoke |
| Items | 1× Coca Cola 500ml (producto tracked; Plus Bebidas no disponible en frontend actual de main) |
| Método | pickup |
| Notas | QA RESTOCK UI SMOKE |
| Status | pending |
| Coca | **4 → 3** |
| Ledger | 1× `order_decrement` (−1, before=4, after=3) |

Nota: el pedido recomendado Doble Smash + Plus no fue posible en el build de `main` (modal sin Plus). Se usó Coca como línea `product` tracked — cubre el contrato de stock/restock.

## QA UI cancel tracked order

`/admin/orders/21064f2b-…` → Estado Cancelado → Guardar estado

| Check | Resultado |
|-------|-----------|
| status | pending → cancelled |
| Coca | **3 → 4** |
| order_restock | +1 · before=3 · after=4 · same order_item_id |
| metadata.source | `transition_order_status` |
| timeline | `status_changed` pending→cancelled |
| dashboard | `#754A` en Cancelados, fuera de Pendientes |

## QA idempotencia UI

Re-guardar Cancelado → toast “No hubo cambios para guardar”.

| Check | Resultado |
|-------|-----------|
| order_restock count | 1 |
| Coca stock | 4 |

## QA históricos sin ledger

| Pedido | restock_count |
|--------|---------------|
| `#9632` | 0 |
| `#8C2F` | 0 |

## SQL de verificación

Movements `#754A`:

1. `order_decrement` −1 (4→3)
2. `order_restock` +1 (3→4) · `reason=order_cancel`

## Browser sanity

| Ruta | Resultado |
|------|-----------|
| `/admin/dashboard` | PASS · `#754A` cancelado |
| `/admin/orders/[id]` | PASS · cancel + no-op |
| `/b/.../catalogo` | PASS · Coca visible |
| `/admin/products` | no re-testeado en esta pasada (dashboard/catalog OK) |

## Compatibilidad legacy

Pedidos sin ledger no reciben restock. Cancel UI usa RPC solo para cambios de status reales.

## Qué NO se tocó

- `create_order`
- cuerpo de `transition_order_status` (ya live)
- schema/RLS stock_movements
- flags / sesión / customization code
- stock manual / backfill

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| Pre-deploy tsc/build | PASS |
| Post-smoke | deploy verificado por comportamiento prod (restock vía RPC) |

## Riesgos / deuda

1. Frontend `main` aún no incluye modal Plus Bebidas (código local uncommitted). Smoke usó Coca como product line.
2. Gran cantidad de WIP local (customization/stock UX) sigue sin pushear — fuera de esta fase.
3. `#9632` pending pre-ledger sigue sin restock automático (por diseño).

## Rollback plan

1. Revertir commit `b0bfddb` (action vuelve a UPDATE directo)
2. Mantener RPC en DB
3. No borrar `stock_movements` ni ajustar stock salvo incidente

## Resultado final

**PASS**

El wiring de `updateOrderStatusAction` quedó desplegado y validado desde UI admin productiva. Cancelar `#754A` tracked devolvió Coca 3→4 vía `transition_order_status` con `order_restock` idempotente.

## Próxima fase recomendada

1. Commit/deploy del WIP de Product Customization (si se quiere Plus en UI prod)
2. Cleanup autorizado `#9632` / pedidos QA pending
3. Opcional: política `completed → cancelled` / ajustes manuales
