# PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 — Plus UI + Stock + Public RLS Live Monitoring

## Objetivo

Monitorear el piloto live tras Plus UI, copy polish, stock/restock y public RLS hardening, sin writes ni deploy.

## Contexto

- Tenant: `demohamburgueseria` / `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`
- URL: `https://orderops.vercel.app`
- Última fase de implementación: **PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 — PASS**
- Esta fase: read-only + browser smoke

## Alcance

Auditoría SQL prod, validación anon REST, smoke catálogo/modal/carrito/checkout, smoke admin, docs.

## Fuera de scope

Pedidos, stock, flags, sesión, schema, RLS, código, deploy, reconciliación `#9632`.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PRODUCT_CUSTOMIZATION_PILOT_MONITOR_2_READ_ONLY=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_PILOT_MONITOR_2_BROWSER_SMOKE=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_PILOT_MONITOR_2_LOGS_READ_ONLY=yes
```

## Precheck local

```txt
tsc — PASS
build — PASS
git status — WIP docs/tmp previos fuera de scope (sin cambios de código en esta fase)
```

## Auditoría producción

Piloto estable: flags ON, sesión abierta, Coca stock=4, corpus/config OK, RLS helper activo, anon corpus OK, ledger sin duplicados, pending QA=0.

## Flags y sesión

| Campo | Valor |
|-------|-------|
| product_customization_enabled | true |
| on_demand_mode_active | true |
| store_session | abierta (`opened_at` 2026-07-14, `closed_at` null) |

## Coca Cola stock

| Campo | Valor |
|-------|-------|
| price | 3000 |
| stock | **4** |
| is_available | true |
| track_stock | true |

## Customization config

Grupos: Papas, Salsas, Agregados extra (todos available).

Opciones: Papas 3 · Salsas 5 · Agregados 3 (todas available). Sin opciones QA.

## Plus Bebidas config

| Campo | Valor |
|-------|-------|
| group | Bebidas |
| product | Coca Cola 500ml |
| price | 3000 |
| stock | 4 |
| track_stock | true |
| product_available | true |
| upsell_item_available | true |

## RLS helper y policies

- `is_public_product_customization_enabled(uuid)` — SECURITY DEFINER, returns boolean, pilot=`true`
- Public SELECT policies en customization/upsell usan el helper (`uses_helper=true`)
- `business_settings`: solo policies member/owner — **sin** SELECT público anon

## Validación anon

| Recurso | Count |
|---------|------:|
| business_settings | **0** |
| customization_groups | 3 |
| customization_options | 11 |
| customization_group_assignments | 6 |
| upsell_groups | 1 (Bebidas) |
| upsell_group_items | 1 |
| helper RPC | true |

## Stock movements sanity

Últimos 6 movimientos (Coca): pares decrement/restock coherentes en pedidos cancelados (`8508`, `2106`, `4ef1`) → stock vuelve a 4.

Idempotencia `(order_item_id, movement_type)` con `count > 1`: **0 rows**.

## Pedidos QA pendientes

Pending QA (nombre/notas `%QA%`): **0**.

Pending totales piloto: **0**.

QA históricos siguen en Cancelados (`#76D4`, `#754A`, `#8B9A`, `#9632`, etc.) — no contaminan Pendientes.

## Browser smoke público

- Catálogo carga
- Modal Doble Smash: Papas / Salsas / Agregados extra / **Sumá una bebida** / Coca +$3000
- Carrito: **Adicional** + Coca
- Checkout resumen: Papas + Adicional Coca
- Sin JSON raw / sin copy “upsell”
- Sin confirmar pedido

## Browser smoke admin

- `/admin/dashboard`: carga · Pendientes vacíos · QA solo en Cancelados
- `/admin/products`: carga · Coca visible

## Logs read-only

No revisados de forma concluyente (`gh`/Vercel CLI no disponible en el entorno). No bloquea el resultado: DB + browser smoke PASS.

## Hallazgos

1. Piloto estable post-RLS hardening.
2. Deuda histórica conocida: `#9632` pre-ledger sin restock (documentada; no reconciliar en esta fase).
3. Logs read-only inconclusos por tooling.
4. Test flag-OFF multi-tenant no ejecutado (sin tenant seguro).

## Riesgos / deuda

- Deuda stock histórica `#9632` (1 Coca) — no accionada.
- Logs debt menor.
- Flag-OFF anon negation no probada.

## Qué NO se tocó

Código, schema, RLS, stock, flags, sesión, pedidos, deploy.

## Validaciones CLI

```txt
npx tsc --noEmit — PASS
npm run build — PASS
```

## Resultado final

```txt
PASS
```

El piloto live se mantiene estable luego de Plus UI, copy polish, inventario tracked y public RLS hardening. Catálogo, modal, carrito, checkout, dashboard, stock Coca, ledger y corpus anon fueron validados sin writes.

## Próxima fase recomendada

- Seguir monitorizando el piloto en operación real.
- Opcional: reconciliación manual `#9632` solo con auth explícita.
- Opcional: tenant flag-OFF para negación anon.
- Opcional: unificar flag gate app con RPC helper.
