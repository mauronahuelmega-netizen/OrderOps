# PRODUCT-CUSTOMIZATION-DASHBOARD-1 — Render Customization Snapshot & Upsell Children

## Objetivo

Renderizar en el dashboard operacional las customizations persistidas (`customization_snapshot`) y los upsell hijos (`parent_order_item_id` / `item_kind`) de forma legible, tolerante a legacy y sin tocar workflow, RPC ni checkout.

**Fecha:** 2026-07-13  
**Resultado:** **PASS WITH DEBT**

---

## Contexto

| Fase | Resultado |
|------|-----------|
| ORDER-1 + DB-APPLY-QA | PASS WITH DEBT — RPC aplicada; flag demo off; sin pedido V2 persistido assert |
| Esta fase (DASHBOARD-1) | Presentational/read-only |

Flag `product_customization_enabled` permanece **false**. Sin creación de pedidos V2 ni QA SQL assert en esta fase.

---

## Scope

1. Type guard / parser `customization_snapshot` v1  
2. Normalizador jerárquico parent → children  
3. Render summary (o fallback groups/options)  
4. Render upsell debajo del parent + orphan “Plus”  
5. Selects read-only con nuevos campos  
6. Browser smoke legacy  
7. Documentación  

---

## Fuera de scope

- `create_order` / RPC / migraciones / RLS  
- Checkout, cart, catálogo público, admin customization  
- Flag on / pedido V2 real  
- Realtime subscriptions / workflow / status actions  
- Deploy / `db push`

---

## Archivos creados/modificados

### Creados

- `lib/product-customization/order-dashboard.ts`
- `docs/product-customization-dashboard-1-render-snapshot-upsell-children.md`

### Modificados

- `lib/orders/admin.ts` — tipo `AdminOrderItem` + selects + normalizers  
- `components/admin/orders/order-products-list.tsx`  
- `components/admin/orders/order-product-modal.tsx`  
- `components/admin/orders/order-items-section.tsx` (memo equality)  
- `components/admin/orders/order-items.module.css`  
- `components/admin/orders/order-detail-surfaces.module.css`  
- `docs/CURRENT_PHASE.md`  
- `ORDEROPS_LIVING_MEMORY.md`

---

## Snapshot parsing

`parseCustomizationSnapshot(unknown)`:

- Exige `version === 1`; si no → `null`  
- Tolera groups/summary/pricing parciales  
- Nunca expone JSON crudo al operador  
- `getCustomizationSummaryLines`: usa `summary[]` si hay strings; si no, construye desde groups/options (+ delta si `price_delta > 0`)

Módulo **sin** `server-only` / Supabase — usable en client components.

---

## Order item hierarchy

`buildDashboardOrderItemTree(items)`:

| Caso | Comportamiento |
|------|----------------|
| Parent (`item_kind !== 'upsell'` o sin parent) | Nodo raíz + children agrupados |
| Child (`item_kind === 'upsell'` + `parent_order_item_id`) | Debajo del parent matching `id` |
| Orphan upsell (parent ausente o sin parent id) | Nodo raíz con badge **Plus** |
| Legacy (kind/snapshot null) | Parent plano sin summary |

---

## Legacy compatibility

- Pedidos sin snapshot / sin `item_kind` se ven como antes  
- `renderItemModifiers(description)` se mantiene cuando no hay summary de snapshot (modo dense)  
- `unit_price * quantity` sin recálculo de negocio  

---

## Customized parent rendering

Debajo del nombre del producto:

- líneas compactas de `customizationSummary`  
- tipografía terciaria / indent leve  
- total línea = `quantity * unit_price` (precio final ya persistido)

---

## Upsell child rendering

- Lista indentada con borde sutil  
- Prefijo `+` + badge **Plus**  
- Click abre el mismo modal de detalle  

---

## Data fetching changes

Selects read-only en `getAdminOrders`, `getAdminDashboardOrderById`, `getAdminOrderById` ahora incluyen:

```txt
order_items.item_kind
order_items.parent_order_item_id
order_items.customization_snapshot
```

Sin cambios de filters, ownership ni mutations.

---

## Realtime compatibility

- **No** se modificaron subscriptions ni pending mutations  
- Hidratación vía `/admin/orders/[id]/summary` usa `getAdminDashboardOrderById` → nuevos campos llegan en reconcile  
- `patchDashboardOrderFromRealtime` solo parchea fila `orders`; los items siguen viniendo del summary hydrate (sin cambio de flujo)

---

## Error/fallback behavior

| Input | Fallback |
|-------|----------|
| Snapshot corrupt / versión ≠ 1 | Ignore snapshot → legacy |
| Summary vacío + groups | Construir líneas desde options |
| Pricing ausente | No rompe |
| Child sin parent | Badge Plus standalone |
| Item sin `id` | Key estable derivada; no crashea |

---

## Browser QA legacy

| Check | Resultado |
|-------|-----------|
| `/admin/dashboard` carga | **PASS** |
| Lanes / cards legacy | **PASS** (`#2C00 QA Legacy` → `1x Clásica`) |
| Workspace Productos legacy | **PASS** — `1x Clásica` / `$8.500` / Total sin JSON raw |
| Acciones Preparar / Ver pedido | Visibles / operativas (no rotas) |
| Flag on / pedido V2 creado | No (prohibido) |

Pedido: `4dc989bc-af43-4fd1-9451-b2456c572c00` (`item_kind=product`, snapshot null).

---

## Browser QA V2

**Pendiente** — no hay filas con `customization_snapshot` ni `item_kind='upsell'` en demo al momento de esta fase (deuda ORDER-1 SQL assert).

Checklist cuando exista pedido V2:

1. Abrir workspace del pedido  
2. Parent muestra summary  
3. Upsell debajo del parent  
4. Acciones de estado disponibles  
5. Sin JSON raw  

---

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | No ejecutado |

---

## Qué NO se tocó

- RPC `create_order`, migraciones, RLS  
- Checkout / cart / catálogo / admin customizations  
- Feature flag  
- Realtime hooks / audio / notifications  
- Deploy  

---

## Riesgos / deuda

1. **V2 real dashboard QA** pendiente hasta existir pedido V2 persistido  
2. Card compacta sigue usando `item_summary` plano (nombres); el detalle jerárquico está en el panel Productos del workspace  
3. Sin tests unitarios del normalizer (no se agregó framework)  

---

## Resultado final

**PASS WITH DEBT** — render listo para V2; legacy preservado; selects extendidos; smoke legacy OK; QA V2 real documentado como deuda.

---

## Próxima fase recomendada

1. Cerrar deuda ORDER-1 (pedido V2 + SQL assert) con autorización, **o**  
2. QA dashboard V2 cuando exista dato real, **o**  
3. Continuación operacional distinta (manual order V1.1 / kitchen display) según prioridad producto.
