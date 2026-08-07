# PRODUCT-CUSTOMIZATION-E2E-QA-1 — Flag-on Full Runtime Smoke

## Objetivo

Smoke end-to-end controlado de Product Customization V1 con flag temporal: datos QA → pedido V2 → SQL assert → dashboard → cleanup.

**Fecha:** 2026-07-14  
**Proyecto:** `pkrsedmwxekbhlohhqds`  
**Resultado:** **PASS WITH DEBT**

---

## Contexto

| Fase previa | Estado |
|-------------|--------|
| ORDER-1-DB-APPLY-QA | PASS WITH DEBT (cleanup cerrado; V2 assert pendiente) |
| DASHBOARD-1 | PASS WITH DEBT (render listo; V2 QA pendiente) |
| Esta fase | Cierra deuda de pedido V2 + SQL + dashboard render |

---

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
AUTORIZO_FLAG_ON_E2E_QA_TEMPORAL=yes
AUTORIZO_CREATE_REAL_QA_ORDER_V2=yes
AUTORIZO_REENABLE_QA_CUSTOMIZATION_DATA_TEMPORAL=yes
AUTORIZO_FLAG_OFF_CLEANUP=yes
```

---

## Entorno

| Item | Valor |
|------|--------|
| App | `http://localhost:3000` |
| Catálogo | `/b/demohamburgueseria/catalogo` |
| Dashboard | `/admin/dashboard` |
| Negocio | La Burguesía `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |

---

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` (pre + post) | PASS |
| `npm run build` | PASS (sin cambios de código en esta fase) |

---

## Precheck remoto SQL

| Check | Resultado |
|-------|-----------|
| Flag inicial | `false` |
| `create_order` has_snapshot/parent/item_kind | **true** |
| Columnas `order_items` customization | Presentes |

---

## Datos QA

Reactivados temporalmente (stamp ADMIN-2 `20260712-1726`):

| Recurso | ID |
|---------|-----|
| Grupo | `effed818-1b65-408a-9792-87d3987f61c8` |
| Assignment producto BBQ Bacon | `1b2421f8-a125-4d3d-ac0f-d1c910e14710` |
| Upsell producto | `a4b28e3d-7721-4d35-be43-ab01eeab9384` → Coca Cola 500ml |

---

## Reactivación temporal de datos QA

**PASS** — grupo/options/assignments/upsell reactivados.

---

## Activación temporal del flag

| Campo | Valor |
|-------|--------|
| `product_customization_enabled` | **true** |
| Timestamp | `2026-07-14 01:30:11.946385+00` |

---

## Catálogo flag-on

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| “Desde $X” visible | PASS (`Desde $ 13.500,00` etc.) |
| Modal → cart → checkout UI completo | **DEBT** — clicks browser interceptados / aprobación MCP interrumpida |

---

## Modal customization / Cart V2 / Checkout V2

Flujo UI público **no cerrado** end-to-end en browser (deuda).

Pedido V2 creado vía **RPC `create_order` autorizado** (`AUTORIZO_CREATE_REAL_QA_ORDER_V2`) con payload snapshot + upsell equivalente al checkout V2.

---

## Pedido creado

| Campo | Valor |
|-------|--------|
| `order_id` | `d3e5c903-d174-4d35-8c15-a9bfc5a88e6f` |
| Display ref | `#8E6F` |
| Cliente | `QA Customization E2E` / `1100000000` |
| Notas | `QA PRODUCT-CUSTOMIZATION-E2E-QA-1` |
| Método | pickup |
| Total | `16750.00` (13750 + 3000) |
| Created | `2026-07-14 02:46:58.752594+00` |
| Canal | SQL RPC `create_order` (autorizado) |

---

## SQL assert order_items

### Parent — `e22cd2f2-0500-4629-87d2-f5106173ddb6`

| Assert | Resultado |
|--------|-----------|
| `item_kind` | `product` |
| `parent_order_item_id` | null |
| `customization_snapshot` | not null |
| `version` | 1 |
| groups / pricing / summary | present |
| `unit_price` | `13750.00` (= 13500 + 250) |
| `quantity` | 1 |

### Upsell child — `7a53db95-cc9c-43e0-9106-b43c981d0a3b`

| Assert | Resultado |
|--------|-----------|
| `item_kind` | `upsell` |
| `parent_order_item_id` | `e22cd2f2-…` (parent) |
| `customization_snapshot` | null |
| `product_name` | Coca Cola 500ml |
| `unit_price` | `3000.00` |
| `quantity` | 1 (= parent) |

**PASS**

---

## Dashboard V2 smoke

`/admin/dashboard?order=d3e5c903-…`

| Check | Resultado |
|-------|-----------|
| Pedido en Pendientes `#8E6F` | PASS |
| Workspace Productos: parent BBQ Bacon | PASS |
| Summary customization debajo | PASS — `QA ADMIN-2 Grupo… Opción Plus (+$250)` |
| Upsell Plus indentado | PASS — `Plus + Coca Cola 500ml ×1 $3.000` |
| JSON raw | No |
| Acciones Tomar/Guardar estado | Visibles |
| Sin 500 | PASS |

---

## Legacy no-regression

| Check | Resultado |
|-------|-----------|
| `#2C00 QA Legacy` `1x Clásica` | PASS |
| Sin badges/summaries falsos en legacy | PASS |

---

## Cleanup final

| Acción | Resultado |
|--------|-----------|
| Flag → false | PASS (`2026-07-14 02:48:55.828447+00`) |
| Grupo/options/assignments/upsell soft-disabled | PASS |
| localStorage cart keys cleared (browser) | PASS |
| Pedidos QA no borrados | Confirmado |

---

## Flag final

`product_customization_enabled = false` para `demohamburgueseria`.

---

## Datos QA finales

Todos soft-disabled (mismo estado pre-fase).

---

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `tsc` | PASS |
| `build` | PASS |
| Código funcional | **No modificado** |

---

## Qué NO se tocó

- Código app / RPC source / migraciones / RLS  
- Deploy / Vercel / `db push`  
- Borrado de pedidos/productos  
- Flag permanente  

---

## Bugs encontrados

Ningún bug funcional de producto demostrado.  
**Fricción de automatización:** browser MCP bloqueó/interrumpió clicks del flujo catálogo→checkout; se usó RPC autorizado como canal de creación V2.

---

## Riesgos / deuda

1. Smoke UI público completo (modal→cart sheet→checkout client→server action) no ejecutado en esta corrida.  
2. Validación TypeScript `order-validation.ts` no ejercitada vía server action (sí RPC + dashboard).  

---

## Resultado final

**PASS WITH DEBT** — flag temporal OK; pedido V2 real con snapshot + upsell child; SQL assert PASS; dashboard V2 render PASS; legacy OK; cleanup flag-off **cerrado**. Deuda: E2E browser checkout path.

---

## Próxima fase recomendada

1. (Opcional) Smoke UI público checkout V2 asistido manualmente, **o**  
2. Cierre de Product Customization V1 / handoff a producción controlada por tenant, **o**  
3. Manual order customization V1.1 según roadmap.
