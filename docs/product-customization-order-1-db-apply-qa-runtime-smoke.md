# PRODUCT-CUSTOMIZATION-ORDER-1-DB-APPLY-QA — Runtime Smoke

## Objetivo

Aplicar la migración RPC ORDER-1 en producción, validar legacy + V2 (flag temporal), y apagar el flag.

**Fecha:** 2026-07-13  
**Proyecto:** `pkrsedmwxekbhlohhqds` (OrderOps production)  
**Resultado:** **PASS WITH DEBT** (cleanup flag-off **cerrado**)

---

## Autorización recibida

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
AUTORIZO_APPLY_ORDER_1_RPC_MIGRATION=yes
AUTORIZO_FLAG_ON_QA_TEMPORAL=yes
```

Método apply: Supabase MCP `apply_migration` (dirigido; **no** `db push` masivo).

---

## Precheck

| Check | Resultado |
|-------|-----------|
| `tsc` / `build` (fase previa) | PASS |
| Migración objetivo | `20260713030000_product_customization_order_1_create_order_snapshot.sql` |
| Duplicado vacío CLI | Eliminado antes del apply |
| `order_items` columnas snapshot/parent/item_kind | Ya existían (DB-1) |
| `create_order` pre-apply (markers) | `has_snapshot/parent/item_kind = false` |
| Flag `demohamburgueseria` pre-apply | `false` |

---

## Apply RPC

| Item | Valor |
|------|--------|
| Migration name | `product_customization_order_1_create_order_snapshot` |
| MCP result | `success: true` |
| Post-verify `has_snapshot` | **true** |
| Post-verify `has_parent` | **true** |
| Post-verify `has_item_kind` | **true** |
| Post-verify `has_client_line_id` / `has_upsell` | **true** |

Sin cambios RLS/tablas; la migración solo reemplaza `create_order`.

---

## QA 1 — Legacy checkout (RPC)

| Campo | Valor |
|-------|--------|
| Order id | `4dc989bc-af43-4fd1-9451-b2456c572c00` |
| Cliente | `QA Legacy ORDER-1-DB-APPLY` / `1100000001` |
| Producto | Clásica `9e6da999-5386-4b07-b220-46446edd4631` |
| Assert | `item_kind=product`, `parent_order_item_id=null`, `customization_snapshot=null`, `unit_price=8500.00` |

**PASS**

---

## QA 2 — Flag on temporal

| Campo | Valor |
|-------|--------|
| `business_id` | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` (`demohamburgueseria`) |
| Activación | `2026-07-13 13:03:42.865961+00` |
| Datos QA reactivados | Grupo/opciones/assignment producto BBQ Bacon + upsell producto (stamp `20260712-1726`) |

**PASS** (activación). Cleanup **pendiente** (ver deuda crítica).

---

## QA 3 — Catálogo / carrito V2 (browser `localhost:3000`)

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| BBQ Bacon “Desde $ 13.500,00” | PASS |
| Modal Personalizar (grupo + opciones + upsell) | PASS |
| Selección Opción Plus (+$250) + Coca Cola upsell | PASS (vía JS evaluate tras bloqueo de `browser_click`) |
| Cart sheet jerárquico parent + upsell | PASS — `BBQ Bacon $13.750` + summary + `+ Coca Cola 500ml $3.000` |
| CTA “Continuar al checkout” (no bloqueo CART-1) | PASS (visible) |

Checkout browser completo: **no ejecutado** (aprobaciones UI rechazadas).

---

## QA 4 / QA 5 — Pedido V2 real + SQL assert

**NO PASS** — creación V2 vía SQL/RPC y checkout UI fueron rechazadas en el canal de aprobación MCP.

Evidencia parcial: carrito local muestra línea V2 correcta; no hay `order_id` V2 persistido en esta corrida.

---

## QA 6 — Flag off

**PASS** — cleanup ejecutado con `AUTORIZO_FLAG_OFF_CLEANUP=yes` (2026-07-13).

| Check | Resultado |
|-------|-----------|
| `product_customization_enabled` | **false** (`updated_at` `2026-07-13 23:09:32.226982+00`) |
| Grupo `effed818-…` `is_available` | **false** |
| Options del grupo todas soft-disabled | **true** |
| Assignments del grupo todos `is_enabled=false` | **true** |
| Upsell `a4b28e3d-…` `is_available` | **false** |

---

## QA 7 — Dashboard

| Check | Resultado |
|-------|-----------|
| `/admin/dashboard` carga | PASS (sesión admin activa) |
| UI premium customization en cards | No observada (esperado; DASHBOARD-1 pendiente) |

---

## No tocado

- Deploy / Vercel
- `db push` masivo
- RLS / tablas nuevas
- Dashboard customization UI
- Borrado de pedidos/productos QA

---

## Deuda

1. Pedido V2 end-to-end + assert SQL parent/snapshot/upsell child no cerrados en la corrida original (QA 4–5).
2. Próxima: **DASHBOARD-1** (o reintento QA 4–5 si se autoriza).

Cleanup QA 6: **cerrado**.

---

## Clasificación

**PASS WITH DEBT** — RPC aplicada y verificada; legacy OK; flag-on + catálogo/modal/carrito V2 OK; flag final **false** y QA data soft-disabled; deuda restante: assert pedido V2 persistido.
