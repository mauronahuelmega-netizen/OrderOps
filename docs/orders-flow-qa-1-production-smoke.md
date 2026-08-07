# ORDERS-FLOW-QA-1 — Production Orders Flow Smoke

## Objetivo

Validar en producción el flujo crítico operativo de pedidos: login admin, dashboard, creación de pedido QA, aparición en lanes, tomar pedido, transiciones de estado, realtime básico, cierre del pedido y sanity del catálogo público — **sin modificar código ni configuración**.

## Entorno auditado

| Campo | Valor |
|-------|-------|
| URL | `https://orderops.vercel.app` |
| Fecha/hora auditoría | 2026-07-09 ~23:15 ART (UTC-3) |
| Commit esperado (referencia DEPLOY-QA-2) | `97321ba` — Settings V1 |
| Commit SHA remoto verificado | **No** — no disponible vía CLI/dashboard en esta sesión |
| Coincidencia con deploy anterior | **Asumida** — marcadores Settings V1 y tenant demo coherentes con `97321ba` |
| HTTP precheck | `200` en `/admin/dashboard` (HEAD sin sesión → redirect login vía `X-Matched-Path: /admin/login`) |
| Tenant demo | La Burguesía — slug `demohamburgueseria` |

## Usuario / rol usado

| Campo | Valor |
|-------|-------|
| Usuario | `laburguesia@demo.com` |
| Rol | **owner** |
| Tipo de sesión | Sesión existente del browser QA (no logout/login fresco en esta fase) |
| Resultado login | PASS — redirección directa a `/admin/dashboard`, sin auth loop ni 500 |

## Rutas auditadas

- `/` — precheck accesibilidad
- `/admin/dashboard` — dashboard operativo, detalle pedido `?order=3fae4857-f4fd-4f78-b76d-18fed037a323`
- `/b/demohamburgueseria/catalogo` — catálogo público post-QA
- **No auditado E2E:** `/b/demohamburgueseria/checkout` (pedido público)

## Login/session QA

| Check | Resultado |
|-------|-----------|
| App accesible | PASS |
| Pantalla blanca / 500 inicial | PASS — no observado |
| Login disponible | PASS (sesión reutilizada) |
| `/admin/dashboard` sin 500 | PASS |
| Auth loop | PASS — no observado |

## Dashboard initial state

| Campo | Valor |
|-------|-------|
| Lanes activas | Pendientes / Preparando / Listos — **vacías** al inicio |
| Completados | ~15 pedidos históricos visibles |
| Header / métricas / búsqueda | Visibles y usables |
| Navegación Settings / Productos | Accesible desde sidebar |
| Overlay Next.js / server action error | No observado |
| Store session | Operación habilitada — botón "Crear nuevo pedido manual" disponible; catálogo público muestra "Listo para pedir online" |

## Store/session state

| Check | Resultado |
|-------|-----------|
| Sesión de tienda activa | **Inferida PASS** — creación manual permitida; catálogo público acepta pedidos |
| Mensaje tienda cerrada | No observado |
| Acción requerida | Ninguna — no se modificaron horarios ni config |

## Public order creation

| Campo | Valor |
|-------|-------|
| Ruta | **No ejecutada** — omitida por riesgo WhatsApp/pago externo |
| Motivo | Se priorizó flujo manual admin como vía segura para QA |
| Catálogo pre-check | PASS — productos visibles, checkout link "Ver pedido" presente |
| Clasificación | **NOT TESTED** (deuda documentada) |

## Manual order creation

| Campo | Valor |
|-------|-------|
| Ruta | `/admin/dashboard` → "Crear nuevo pedido manual" |
| Cliente | `QA Smoke Order` |
| Teléfono | `1199990001` (demo) |
| Método | Retiro (pickup) |
| Producto | 1× Agua con gas — $2.500,00 |
| Notas | `ORDERS-FLOW-QA-1 — borrar/cerrar` |
| Resultado | **PASS** — pedido creado sin error |
| ID visible | **#A323** (UUID: `3fae4857-f4fd-4f78-b76d-18fed037a323`) |

## Dashboard appearance

| Check | Resultado |
|-------|-----------|
| Pedido aparece en Pendientes | **PASS** — sin refresh manual tras crear |
| Lane / estado inicial | Pendientes — Retiro — "Sin responsable" |
| Datos (nombre, producto, total) | PASS — QA Smoke, 1× Agua con gas, $2.500 |
| Notas QA | PASS — visibles en detalle |
| Realtime (aparición) | **PASS** |

## Ownership / tomar pedido

| Campo | Valor |
|-------|-------|
| Acción | "Tomar pedido" en panel detalle (`/admin/dashboard?order=...`) |
| Estado previo | Sin responsable |
| Resultado | **PASS** — feedback "Sincronizando...", card → "A tu cargo" |
| Persistencia | PASS — tras sync, botón cambia a "Liberar"; recomendación → "Prepará el pedido" |
| Server action error | No observado |
| Nota histórica | Bug histórico de tomar pedidos — **no reproducido** en esta auditoría |

## Status transitions

| Desde | Hacia | Acción | Resultado | Persistió tras UI update |
|-------|-------|--------|-----------|--------------------------|
| pending | preparing | Selector estado + "Guardar estado" | PASS | PASS — lane Preparando |
| preparing | ready | Selector estado + "Guardar estado" | PASS | PASS — lane Listos |
| ready | completed | Selector estado + "Guardar estado" | PASS | PASS — lane Completados, lanes activas vacías |

Transiciones vía quick actions en card ("Preparar pedido", "Marcar listo"): **no probadas** — clicks interceptados por overlay del panel detalle en automatización (ver deuda).

Estado final del pedido QA: **completed**.

## Realtime / multi-tab

| Escenario | Resultado |
|-----------|-----------|
| Aparición pedido nuevo sin refresh | **PASS** |
| Movimiento entre lanes sin refresh | **PASS** (pending→preparing→ready→completed) |
| Dos tabs simultáneas | **NOT TESTED** |

## Notifications / audio

| Check | Resultado |
|-------|-----------|
| Modal "Preparar sonido" | Aparece en navegación fresca al dashboard |
| Unlock vía "Preparar sonido" | PASS — modal se deshabilita |
| Sonido al crear pedido | **NOT TESTED** — no se validó reproducción |
| Errores UI notificaciones | No observados |

## Public catalog sanity

Post-cierre pedido QA en `/b/demohamburgueseria/catalogo`:

| Check | Resultado |
|-------|-----------|
| Productos visibles | PASS — 6 categorías, botones Agregar |
| Carrito / Ver pedido | PASS — link presente |
| Estado corrupto | No observado |
| 500 / error | No observado |

## Responsive QA

| Viewport | Ruta | Resultado |
|----------|------|-----------|
| 390px | `/admin/dashboard` | PASS — layout mobile (filtros, hamburger), `scrollWidth === clientWidth` (390) |
| 390px | `/b/demohamburgueseria/catalogo` | PASS — categorías, productos, menú móvil |
| 1440px | `/admin/dashboard` | PASS — lanes desktop, detalle pedido usable (flujo principal ejecutado en desktop) |
| 390px | checkout público | **NOT TESTED** |

## Console / Network / Logs

| Check | Resultado |
|-------|-----------|
| 500 en flujo QA | No observado |
| 401/403 inesperado | No observado |
| Server action error visible | No observado |
| RLS denied / order insert failed | No observado |
| Realtime subscription error | No observado en UI |
| Vercel logs | No consultados en esta sesión |

## Pedido QA creado

| Campo | Valor |
|-------|-------|
| Número visible | **#A323** |
| UUID | `3fae4857-f4fd-4f78-b76d-18fed037a323` |
| Cliente | QA Smoke Order |
| Teléfono demo | 1199990001 |
| Método | Retiro |
| Producto | 1× Agua con gas ($2.500) |
| Notas | ORDERS-FLOW-QA-1 — borrar/cerrar |
| Estado final | **Completado** |
| Asignado a | Usuario owner demo ("A tu cargo") |
| Visible en historial | Sí — lane Completados |

## Datos demo modificados/restaurados

| Dato | Acción | Estado final |
|------|--------|--------------|
| Pedido #A323 | Creado vía UI manual, cerrado a Completado | Cerrado — permanece en historial demo (esperado) |
| Horarios / store session | Sin cambios | — |
| Config / roles / permisos | Sin cambios | — |
| Assets públicos | Sin cambios | — |

## Bugs encontrados

### Sin bugs críticos (FAIL)

Ningún bloqueador del flujo operativo core.

### Observaciones menores (deuda / UX)

1. **Quick actions en card con detalle abierto** — En automatización, botones "Preparar pedido" / "Marcar listo" en la card pueden quedar interceptados por el panel detalle (`role=dialog`). Workaround operativo: usar selector de estado en el panel. Clasificar como fricción UX/automation, no validado como bug de producción para operadores sin panel abierto.

2. **Modal audio unlock** — Reaparece en cargas frescas; requiere interacción antes de otras acciones. Comportamiento esperado del producto; no bloquea QA tras dismiss.

## Resultado final

### **PASS WITH DEBT**

Flujo crítico operativo en producción **sano**:

- Dashboard carga sin 500
- Pedido QA creado (manual)
- Aparición + realtime en single-tab
- Tomar pedido funciona
- Transiciones completas hasta Completado
- Pedido QA cerrado
- Catálogo público usable post-QA

## Deuda restante

| ID | Item | Prioridad |
|----|------|-----------|
| D1 | Checkout público E2E (`/b/demohamburgueseria` → checkout → pedido) | P1 |
| D2 | Multi-tab realtime (2 dashboards) | P2 |
| D3 | Validación audio en nuevo pedido | P3 |
| D4 | Verificar commit SHA remoto en Vercel | P3 |
| D5 | Quick actions card vs panel detalle — QA manual operador | P3 |

## Próxima fase recomendada

**ORDERS-FLOW-QA-2 — Public Checkout Production Smoke** (o **ORDERS-FLOW-FIX-1** solo si D5 se confirma como bug real en QA manual humano).

Alternativa: **ORDERS-REALTIME-QA-1** para multi-tab y reconvergencia defensiva bajo dos sesiones operador.
