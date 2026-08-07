# PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1 — Browser Checkout Validation

## Objetivo

Cerrar la deuda P1 de Product Customization V1 validando el flujo completo desde navegador real (sin bypass RPC):

`catálogo → modal → cart V2 → checkout UI → server action → create_order → order_items snapshot/child → dashboard`

**Fecha:** 2026-07-14  
**Proyecto:** `pkrsedmwxekbhlohhqds` (producción)  
**Resultado:** **PASS WITH DEBT**

---

## Contexto

| Fase previa | Estado |
|-------------|--------|
| V1-HANDOFF-1 | PASS WITH DEBT — deuda D1/D2: smoke UI checkout browser |
| E2E-QA-1 | Pedido V2 `#8E6F` vía RPC autorizado (no UI) |
| Esta fase | Primer pedido V2 creado desde checkout UI real |

---

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
AUTORIZO_FLAG_ON_CHECKOUT_UI_SMOKE_TEMPORAL=yes
AUTORIZO_CREATE_REAL_QA_ORDER_V2_FROM_UI=yes
AUTORIZO_REENABLE_QA_CUSTOMIZATION_DATA_TEMPORAL=yes
AUTORIZO_FLAG_OFF_CLEANUP=yes
```

---

## Entorno

| Item | Valor |
|------|--------|
| App local | `http://localhost:3000` |
| Catálogo | `/b/demohamburgueseria/catalogo` |
| Checkout | `/b/demohamburgueseria/checkout` |
| Dashboard | `/admin/dashboard` |
| Negocio | La Burguesía `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| DB remota | Supabase MCP `pkrsedmwxekbhlohhqds` |

---

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status` | Solo docs/tmp sin commit (fase QA) |
| `npx tsc --noEmit` (pre) | PASS |
| `npm run build` (pre) | PASS |

---

## Precheck remoto SQL

| Check | Resultado |
|-------|-----------|
| Flag inicial | `product_customization_enabled = false` |
| `create_order` has_snapshot/parent/item_kind | **true** / **true** / **true** |
| Columnas `order_items` V2 | Presentes (`customization_snapshot`, `parent_order_item_id`, `item_kind`) |

---

## Datos QA

| Recurso | ID |
|---------|-----|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| Grupo | `effed818-1b65-408a-9792-87d3987f61c8` |
| Producto parent | BBQ Bacon `1b2421f8-a125-4d3d-ac0f-d1c910e14710` |
| Opción Plus (+$250) | `66503482-fd73-4116-aad2-d6ae178bafa8` |
| Upsell group | `a4b28e3d-7721-4d35-be43-ab01eeab9384` |
| Upsell producto | Coca Cola 500ml `2e6b2b3b-290f-414d-99cd-d537a48955d6` |

---

## Reactivación temporal de datos QA

**PASS** — grupo, options, assignments y upsell reactivados para el smoke (stamp ADMIN-2 `20260712-1726`).

---

## Activación temporal del flag

| Campo | Valor |
|-------|--------|
| `product_customization_enabled` | **true** |
| Timestamp ON | `2026-07-14 04:44:05.827717+00` |

---

## Catálogo flag-on

| Check | Resultado |
|-------|-----------|
| Catálogo carga sin 500 | PASS |
| “Desde $X” en productos configurables | PASS (ej. burgers) |
| Productos legacy precio normal | PASS |
| Click abre modal personalización | PASS |
| Errores críticos consola | Ninguno bloqueante (warning hydration en catálogo — deuda menor) |

localStorage `orderops-cart*` limpiado antes del smoke.

---

## Modal customization

| Check | Resultado |
|-------|-----------|
| Modal lazy-loaded abre | PASS (BBQ Bacon) |
| Secciones/opciones visibles | PASS |
| price_delta modifica total | PASS — opción Plus (+$250) |
| Upsell “También podés sumar” | PASS — Coca Cola seleccionada |
| Confirmar “Agregar al carrito” | PASS |

Selección QA: opción Plus (+$250) + upsell Coca Cola 500ml.

---

## Cart V2 UI

| Check | Resultado |
|-------|-----------|
| Parent BBQ Bacon visible | PASS |
| Summary jerárquico opciones | PASS |
| Upsell child debajo del parent | PASS |
| Total visual | PASS — **$16.750** (13750 + 3000) |
| Checkout CTA habilitada | PASS |
| Mensaje “próxima fase” | No aparece |
| Dedup misma configuración | **NO PROBADO** (deuda menor) |
| Línea separada config distinta | **NO PROBADO** (deuda menor) |

Nota automatización: sticky cart bar / Next.js dev overlay interceptaron algunos clicks; resuelto parcialmente vía CDP `Runtime.evaluate`.

---

## Checkout UI

| Check | Resultado |
|-------|-----------|
| Navegación vía CTA carrito | PASS |
| Items V2 visibles | PASS |
| Sin guard CART-1 bloqueante | PASS |
| Total razonable | PASS |
| Submit “Enviar pedido” | PASS |
| Redirect success | PASS → `/b/demohamburgueseria/success?order_id=…` |

Datos QA enviados:

- Nombre: `QA Checkout UI Smoke`
- Teléfono: `1100000000`
- Nota: `QA PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1`

---

## Pedido creado desde UI

| Campo | Valor |
|-------|--------|
| `order_id` | `3b9f87a2-1bcb-4c82-b36d-ea3a57f25c7c` |
| Display ref | **#5C7C** |
| Cliente | `QA Checkout UI Smoke` |
| Método | pickup (flujo UI) |
| Total | `16750` |
| Origen | **Checkout UI real** — no RPC directo |

---

## SQL assert order_items

**Parent** (`599e07ab-bd38-4136-88f6-66dc8617a3ff`):

| Campo | Valor |
|-------|--------|
| product_name | BBQ Bacon |
| item_kind | `product` |
| parent_order_item_id | `null` |
| unit_price | `13750.00` |
| customization_snapshot.version | `1` |
| source | `public_checkout` |
| groups / pricing / summary | Presentes |
| customization_total | `250` (base 13500 → 13750) |

**Child upsell** (`c37a0ed1-4763-4dfd-a17c-4354f413a89f`):

| Campo | Valor |
|-------|--------|
| product_name | Coca Cola 500ml |
| item_kind | `upsell` |
| parent_order_item_id | `599e07ab-bd38-4136-88f6-66dc8617a3ff` |
| customization_snapshot | `null` |
| unit_price | `3000.00` |
| quantity | `1` |

**Resultado SQL:** PASS

---

## Dashboard V2

| Check | Resultado |
|-------|-----------|
| Dashboard carga sin 500 | PASS |
| Pedido `#5C7C` visible | PASS |
| Parent personalizado + summary opciones | PASS |
| Upsell indentado + badge Plus | PASS (Coca Cola) |
| JSON raw | No visible |
| Workflow actions | Visibles |
| Admin audio-unlock modal | Apareció; dismiss vía CDP (deuda UX automatización) |

---

## Legacy no-regression

| Check | Resultado |
|-------|-----------|
| Pedido legacy `#2C00` en lane completados | PASS — sin summary falso |
| Catálogo productos base | PASS (flag ya off post-cleanup) |

---

## Cleanup final

| Acción | Resultado |
|--------|-----------|
| Flag OFF | **PASS** — `2026-07-14 07:01:38.065255+00` |
| Soft-disable grupo/options/assignments/upsell QA | **PASS** |
| Browser localStorage cleanup | Documentado — limpieza previa al smoke; post-smoke vía sesión QA |
| Pedidos QA | **Conservados** (no borrados) |

Nota: cleanup inicial rechazado por aprobación MCP; re-ejecutado y verificado en cierre de fase.

---

## Flag final

```txt
product_customization_enabled = false
updated_at = 2026-07-14 07:01:38.065255+00
```

---

## Datos QA finales

| Recurso | is_available / is_enabled |
|---------|---------------------------|
| customization_groups `effed818-…` | `false` |
| customization_options (grupo) | `false` |
| customization_group_assignments | `false` |
| upsell_groups `a4b28e3d-…` | `false` |

---

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` (post) | PASS (sin cambios de código) |
| `npm run build` (post) | PASS |
| `npm run lint` | No ejecutado (opcional; ESLint 9 circular JSON conocido) |

---

## Qué NO se tocó

- Código funcional (checkout actions, RPC, cart, catálogo, dashboard)
- Migraciones / schema / RLS / policies
- Deploy / Vercel / `db push`
- Pedidos/productos/grupos existentes (solo soft-disable temporal QA)

---

## Bugs encontrados

Ninguno bloqueante en el flujo funcional V2.

Observaciones:

1. Hydration warning en `public-catalog-page.tsx` (no bloquea checkout)
2. Sticky cart bar + Next dev overlay interceptan clicks en automatización browser
3. Admin dashboard audio-unlock modal bloquea interacción hasta dismiss

---

## Riesgos / deuda

| ID | Deuda |
|----|--------|
| D3 | Dedup cart y línea separada por config distinta no probados en este smoke |
| D4 | Automatización browser frágil (CDP workarounds) — smoke manual repetible recomendado pre-rollout |
| D5 | Hydration warning catálogo — polish futuro |

Deudas P1 originales **D1/D2 cerradas** con este smoke.

---

## Resultado final

**PASS WITH DEBT**

Criterios PASS cumplidos salvo dedup/config-distinta no probados (deuda menor documentada).

Evidencia clave: pedido `#5C7C` / `3b9f87a2-…` creado desde UI checkout real con snapshot parent v1 + upsell child; dashboard render OK; flag y datos QA en estado fail-closed al cierre.

---

## Próxima fase recomendada

1. **Rollout pilot controlado** — activar `product_customization_enabled` en un tenant real con checklist de handoff V1  
2. **PRODUCT-CUSTOMIZATION-ADMIN-UX-2** — polish forms/preview (opcional, no bloqueante)  
3. Smoke repetible dedup/edit cart antes de rollout masivo (opcional)
