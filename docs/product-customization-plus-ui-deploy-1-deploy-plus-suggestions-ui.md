# PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 — Deploy Plus Suggestions UI

## Objetivo

Desplegar y validar en producción el WIP de Product Customization Plus UI para que **Plus Bebidas / Coca Cola 500ml** vuelva a aparecer en el modal público de personalización de Doble Smash, con carrito parent+upsell, checkout, dashboard, decrement y restock al cancelar.

## Contexto

- Tenant piloto: `demohamburgueseria` / `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`
- Product Customization V1 live; inventario decrement/restock ya operativo
- Smoke previo `#754A` usó Coca como product line, no como Plus en modal
- Config DB correcta: upsell group `Bebidas` → Doble Smash → Coca Cola 500ml (`track_stock=true`, stock inicial 4)

## Alcance

- Auditoría WIP Plus UI
- Fix wiring public read model (service role) si summaries vacíos
- Deploy Vercel (`main`)
- Smoke catálogo/modal/carrito
- QA pedido real + cancel UI + ledger
- Docs / CURRENT_PHASE / living memory

## Fuera de scope

- Schema / migrations / RLS policies nuevas
- `create_order` / `transition_order_status` / `stock_movements` schema
- Stock manual, flags, store session, deletes, backfill

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_PLUS_UI_DEPLOY_LOCAL=yes
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PRODUCT_CUSTOMIZATION_PLUS_UI_DEPLOY_READ_ONLY=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_PLUS_UI_TO_VERCEL=yes
AUTORIZO_CREATE_PLUS_UI_DEPLOY_QA_ORDER=yes
AUTORIZO_CANCEL_PLUS_UI_DEPLOY_QA_ORDER=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría WIP local

- Deploy inicial Plus UI: commit `a284a23` (`feat(catalog): deploy Product Customization Plus UI`)
- Tras deploy, SSR mostraba `customizationEnabled: true` pero **todos** los `customizationSummary` vacíos (`hasCustomizations/hasUpsell=false`)
- Causa raíz: políticas public SELECT de `customization_*` / `upsell_*` hacen `EXISTS` sobre `business_settings`, pero **anon no puede leer** `business_settings` (solo miembros) → corpus vacío sin throw → summaries fail-closed
- Flag `isProductCustomizationEnabled` sí funciona (service role)
- Fix permitido (wiring frontend/read-model): `loadPublicCustomizationCorpus` usa `createSupabaseServiceClient()` tras gate del flag

## Auditoría producción previa

| Check | Esperado | Resultado |
|-------|----------|-----------|
| `product_customization_enabled` | true | true |
| `on_demand_mode_active` | true | true |
| Store session abierta | `closed_at` null | OK |
| Coca Cola 500ml | stock=4, available, track_stock | OK |
| Upsell Bebidas → Doble Smash → Coca | linked/available | OK |
| Assignments Papas/Salsas/Agregados | present | OK |

## Validación local

- tsc/build PASS
- Root cause reproducida vía REST anon: `customization_groups` / assignments → `[]`; `business_settings` no legible por anon
- Fix local en `lib/product-customization/public.ts`

## Deploy

| Campo | Valor |
|-------|-------|
| Commit Plus UI | `a284a23` |
| Commit fix read-model | `d1b8e7f` `fix(catalog): load public customization corpus with service role` |
| Remote | `origin/main` |
| URL | `https://orderops.vercel.app` |
| Vercel deploy | `dpl_EMCfXEsfsWWUZWwZ5XiECSe4C5cE` Ready (Production) |
| Hora aprox. | 2026-07-17 ~06:37 ART (deploy Ready) |

## Smoke producción catálogo/modal/carrito

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| Doble Smash summary | `hasCustomizations=true`, `hasPaidCustomizations=true`, `hasUpsell=true`, `priceFrom=12500` |
| Modal abre | PASS |
| Papas / Salsas / Agregados extra | PASS |
| Sección plus (“También podés sumar” / Bebidas) | PASS — Coca Cola 500ml visible |
| Selección Coca | PASS |
| Carrito parent + plus | PASS — `+ Coca Cola 500ml $ 3.000` asociado a Doble Smash |
| Total | PASS — $15.500 |
| Checkout carga + resumen plus | PASS |

Nota: el label UI del upsell group en DB es **Bebidas**; el modal muestra heading “También podés sumar” + descripción del grupo.

## QA pedido real Plus UI

| Campo | Valor |
|-------|-------|
| Order ID | `8508feb5-9a21-45d0-9152-9f4ff30576d4` |
| UI code | `#76D4` |
| Cliente | QA Plus UI Deploy |
| Notas | QA PLUS UI DEPLOY |
| Método | pickup / Retiro |
| Total | 15500 |
| Parent | Doble Smash `item_kind=product` + snapshot |
| Child | Coca `item_kind=upsell` `parent_order_item_id` = parent |
| Coca stock | **4 → 3** |
| Ledger | `order_decrement` delta=-1 before=4 after=3 `metadata.item_kind=upsell` |

## QA dashboard

| Check | Resultado |
|-------|-----------|
| Pedido en Pendientes | PASS `#76D4` QA Plus |
| Items | `1x Doble Smash · 1x Coca Cola 500ml` |
| Modal detalle | Papas chicas + badge **PLUS** Coca Cola · sin JSON raw |
| Total | $15.500 |

## QA cancel/restock

| Check | Resultado |
|-------|-----------|
| UI Cancelado → Guardar | PASS pending→cancelled |
| Sale de Pendientes / entra Cancelados | PASS |
| Coca stock | **3 → 4** |
| `order_restock` | +1 before=3 after=4 mismo `order_item_id` |
| Idempotencia re-Guardar | “No hubo cambios para guardar” · movements count decrement=1 restock=1 · stock sigue 4 |

## Verificación legacy

- Productos sin customizations siguen en catálogo (Agregar normal)
- Coca como product line en catálogo sigue visible
- No se creó pedido legacy adicional (no necesario)

## Browser sanity final

| Ruta | Resultado |
|------|-----------|
| `/admin/dashboard` | PASS |
| `/admin/products` | PASS (Coca visible, filtros stock OK) |
| `/b/demohamburgueseria/catalogo` | PASS |
| Modal Doble Smash + plus | PASS |

Audio unlock overlay en dashboard documentado (comportamiento previo); no regresión de esta fase.

## Stock / movements

Pedido `8508feb5-…`:

1. `order_decrement` Coca −1 (4→3) `source=create_order` `item_kind=upsell`
2. `order_restock` Coca +1 (3→4) `source=transition_order_status` mismo `order_item_id`

Coca final: **stock=4**, `track_stock=true`, `is_available=true`.

## Qué NO se tocó

- DB schema / migrations nuevas
- `create_order` / `transition_order_status` RPC
- RLS policies
- Stock manual / `track_stock` flags / store session
- Deletes de pedidos/order_items
- Vercel project config (solo deploy via git push)

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | no requerido |

## Riesgos / deuda

- Deuda de diseño RLS: public policies dependen de `business_settings` no legible por anon; mitigado con service role en read model server-only (mismo patrón que el flag). Futuro opcional: policy/`SECURITY DEFINER` helper sin service role.
- Label comercial “Plus Bebidas” vs group name `Bebidas` / UI “También podés sumar” — cosmético.

## Rollback plan

- Revertir `d1b8e7f` (y/o `a284a23` si se necesita quitar Plus UI)
- No tocar DB/RPC/stock_movements
- No borrar pedido QA `#76D4` (ya cancelled)
- Verificar catálogo legacy tras rollback

## Resultado final

**PASS**

Plus Bebidas quedó desplegado y validado en la UI pública productiva. El cliente puede agregar Coca Cola 500ml como plus dentro del modal de Doble Smash; checkout, dashboard, decremento de stock, ledger y restock al cancelar funcionan end-to-end.

## Próxima fase recomendada

- Opcional: hardening RLS public vs `business_settings` (sin service role)
- Opcional: copy UI “Plus Bebidas” alineado al nombre comercial
- Monitoreo piloto customization + stock tracked en pedidos reales no-QA
