# LIVE-OPS-GATE-1 — Store Session / On-Demand Acceptance Reconciliation

## Objetivo

Reconciliar `store_sessions` y `business_settings.on_demand_mode_active` para que el gate público y `create_order` no queden desincronizados al abrir/cerrar la operación del negocio.

## Contexto

Durante `PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 — Modo C Live Activation Retry` el flujo UI pasó:

```txt
catálogo → modal → cart V2 → checkout UI
```

pero el submit falló con *“El negocio no está aceptando pedidos”*.

Estado SQL del tenant demo en ese incidente (y reconfirmado read-only al inicio de esta fase):

```txt
store_sessions = open
business_settings.on_demand_mode_active = false
product_customization_enabled = false
```

Product Customization no era la causa.

## Causa raíz

Existían **dos gates** con criterios distintos:

| Gate | Fuente | Efecto en el incidente |
|------|--------|-------------------------|
| Público (`isBusinessAcceptingPublicOrders`) | solo `store_sessions` open | UI/checkout habilitados |
| `create_order` RPC | `business_settings.on_demand_mode_active` | rechazo → mensaje UX vía `mapCreateOrderRpcError` |

Factores que permitían el desync:

1. Gate público ignoraba la columna que RPC exige.
2. `toggleBusinessStatus` (settings Operations) llamaba RPC `set_business_on_demand_status` y **solo** mutaba la columna, sin abrir/cerrar `store_sessions`.
3. `closeStoreSession` forzaba `on_demand_mode_active=false` sin derivar de “¿queda alguna sesión open?”.
4. Sesiones abiertas fuera del flujo admin (SQL / desync previo) no se auto-curaban en el gate público.

## Scope

- Apertura/cierre de store sessions (admin helpers + actions).
- Sync/reconciliación de `on_demand_mode_active`.
- Gate público de aceptación de pedidos.
- Toggle “Bajo demanda” en Operations → mismo camino de sesión.
- Docs + CURRENT_PHASE + living memory.

## Fuera de scope

- Product Customization (flag, config QA, cart V2, modal, dashboard customizations).
- Modificar `create_order` RPC / schema / migraciones / RLS.
- Deploy / Vercel.
- Abrir/cerrar sesión remota o crear pedidos sin autorización de smoke DB.

## Auditoría técnica

### Apertura/cierre admin

| Pieza | Ubicación |
|-------|-----------|
| Toolbar dashboard | `admin-dashboard-orders.tsx` → `openStoreSessionAction` / `closeStoreSessionAction` |
| Actions | `app/admin/(protected)/dashboard/actions.ts` |
| Helpers | `lib/store-sessions/admin.ts` |
| Settings toggle | `operations-settings-client.tsx` → `toggleBusinessStatus` (ahora también abre/cierra sesión) |

### Gate público

| Pieza | Ubicación |
|-------|-----------|
| Catálogo/checkout business payload | `lib/business/public.ts` → mapea `on_demand_mode_active` desde `isBusinessAcceptingPublicOrders` |
| Checkout submit precheck | `app/b/[slug]/checkout/actions.ts` |
| Checkout client disable | `checkout-client.tsx` (`!onDemandModeActive`) |

### RPC (sin modificar)

`create_order` rechaza con `on_demand_mode is not active`.  
`mapCreateOrderRpcError` lo traduce a *“El negocio no está aceptando pedidos en este momento.”*

### Helper sync previo

Existía `syncOnDemandModeActive(boolean)` privado: escribía el booleano pedido por el caller, no lo derivaba de sesiones abiertas.

## Estado previo SQL

Tenant `demohamburgueseria` (read-only, inicio de fase):

| Campo | Valor |
|-------|--------|
| `has_open_session` | **true** |
| `on_demand_mode_active` | **false** |
| `product_customization_enabled` | false |

Mismatch detector: **FAIL** (sesión open / columna false).

## Implementación

1. Helper puro `computeOrderAcceptanceActive` (`lib/store-sessions/acceptance.ts`).
2. `reconcileOnDemandModeActiveFromSessions(businessId)`: cuenta sesiones open → escribe `on_demand_mode_active` = (count > 0); verifica el valor escrito; idempotente.
3. `openStoreSession` / `closeStoreSession` llaman reconcile tras mutación; open falla visible si sync no activa; rollback best-effort de la fila insertada si sync falla post-insert.
4. `closeStoreSession` ya no fuerza `false` ciegamente: deriva del estado real (soporta múltiples open).
5. `toggleBusinessStatus(true|false)` delega a open/close/reconcile (deja de usar solo RPC `set_business_on_demand_status`).
6. `isBusinessAcceptingPublicOrders` exige **columna true AND sesión open** (fallback: solo columna si falta tabla sesiones).

## Fuente efectiva de aceptación de pedidos

```txt
acepta = on_demand_mode_active=true
         AND (sesión open | tabla store_sessions ausente)
```

El admin debe dejar ambos en sync vía reconcile. El gate público ya no promete submit si la columna RPC está false.

## Cambios en apertura de sesión

Tras insert/reuse open → `reconcileOnDemandModeActiveFromSessions` → exige `active=true` o error.  
Si insert OK y sync fail → cierra la fila nueva best-effort y propaga error (no success).

## Cambios en cierre de sesión

Tras close → reconcile.  
`on_demand_mode_active=false` **solo** si no queda ninguna sesión open.

## Cambios en gate público / checkout

`isBusinessAcceptingPublicOrders` alineado con RPC (columna) + coherencia de sesión.  
Checkout/catálogo heredan el valor vía `getPublicBusinessBySlug` sin cambios de Product Customization.

## Idempotencia

- Reconcile recalcula desde sesiones; reintentos seguros.
- Open con sesión ya open: re-reconcile + return existing.
- Close de sesión ya closed: reconcile (no fuerza false si otra open).
- Toggle operations usa el mismo camino.

## Error handling

- Fallo de write/verify en columna → throw con mensaje On-Demand.
- Open action no marca success si on_demand no queda true.
- Logs en sync/rollback/count.

## Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `lib/store-sessions/acceptance.ts` | **nuevo** helper puro |
| `lib/store-sessions/public.server.ts` | gate AND columna+sesión |
| `lib/store-sessions/admin.ts` | reconcile derivado; open/close endurecidos |
| `app/admin/(protected)/dashboard/actions.ts` | toggle → open/close/reconcile |
| `app/admin/(protected)/settings/operations/operations-settings-client.tsx` | usa `onDemandModeActive` real del result |
| `docs/live-ops-gate-1-store-session-on-demand-reconciliation.md` | **nuevo** |
| `docs/CURRENT_PHASE.md` | registro fase |
| `ORDEROPS_LIVING_MEMORY.md` | changelog |

## QA SQL

### Baseline (antes del smoke remoto)

Mismatch detector:

| Campo | Valor |
|-------|--------|
| `has_open_session` | true |
| `on_demand_mode_active` | false |
| `product_customization_enabled` | false |

### Después de Cerrar sesión (admin toolbar)

| Campo | Valor |
|-------|--------|
| `has_open_session` | **false** |
| `on_demand_mode_active` | **false** |
| latest session | `closed @ 2026-07-14 19:03:54 UTC` |

### Después de Abrir sesión (admin toolbar)

| Campo | Valor |
|-------|--------|
| `has_open_session` | **true** |
| `on_demand_mode_active` | **true** |
| latest session | `a01252b0-…` open `@ 2026-07-14 19:04:58 UTC` |
| `product_customization_enabled` | false |

## QA browser

| Paso | Resultado |
|------|-----------|
| Admin → Cerrar sesión | PASS (SQL reconciliado) |
| Admin → Abrir sesión | PASS (SQL reconciliado) |
| Catálogo público | PASS — “Listo para pedir online”; sin bloqueo |
| Checkout submit habilitado | PASS |

## Pedido legacy QA, si aplica

**PASS** — autorizado y creado desde checkout UI:

| Campo | Valor |
|-------|--------|
| order_id | `1ef8a30a-4d5a-45d4-8941-2a850dd46b7c` |
| customer_name | QA Live Ops Gate |
| notes | QA LIVE-OPS-GATE-1 |
| item | Clásica `$8500` (legacy, flag customization off) |
| delivery | pickup |
| status | pending |
| create_order gate | **no rechazó** por negocio cerrado |

## Estado final del tenant demo

```txt
store_sessions=open (a01252b0-…)
on_demand_mode_active=true
product_customization_enabled=false
QA customization config soft-disabled (sin tocar)
```

Listo para **PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 — Modo C Live Activation Retry 2**.

## Qué NO se tocó

Product Customization, cart V2, modal, dashboard customizations, `create_order` RPC, schema, migraciones, RLS, deploy, borrado de pedidos/sesiones históricas.

## Riesgos / deuda

| ID | Deuda |
|----|--------|
| G4 | RPC `set_business_on_demand_status` sin callers admin principales (compat) |
| G5 | Realtime/hydration store sessions (deuda T4 previa) |
| G6 | Cart localStorage keyed por business_id (`orderops-cart:<uuid>`); automation debe limpiar keys scoped |

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| Pre `tsc` | PASS |
| Pre `build` | PASS |
| Post `tsc` | PASS |
| Post `build` | PASS |

## Resultado final

**PASS**

## Próxima fase recomendada

Ejecutar **PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 — Modo C Live Activation Retry 2** con el tenant ya reconciliado (`session open` + `on_demand=true` + customization flag off).
