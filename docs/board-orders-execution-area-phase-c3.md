# Board / Orders Execution Area — Phase C3 — Post-Closed Session Action Policy

## Objetivo

Bloquear acciones operativas mutantes cuando el dashboard está en modo `last-closed-store-session`, preservando lectura de KPIs/pedidos y utilidades no mutantes.

## Contexto

C2 introdujo **Last Closed Session Review Mode**: al cerrar sesión, KPIs/insights/board siguen mostrando la última sesión cerrada. C2 documentó deuda **C3 — Post-Closed Session Action Policy** porque las acciones operativas seguían disponibles.

## Problema detectado

Tras cerrar sesión, el operador podía cambiar estados, usar quick actions y tomar/liberar pedidos de una sesión ya cerrada, contradiciendo el flujo de revisión post-turno.

## Decisión de producto aplicada

Una sesión cerrada se revisa, no se opera.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/orders/analytics.ts` | `DashboardActionPolicy`, `resolveDashboardActionPolicy`, mensajes de bloqueo |
| `lib/orders/dashboard-board-view-model.ts` | `contextScopeHint` en modo revisión |
| `components/admin/orders/admin-dashboard-orders.tsx` | Policy central, guards en handlers, props a board/modal/toolbar |
| `components/admin/orders/order-card.tsx` | Prop `canUseQuickActions` |
| `components/admin/orders/order-card-quick-actions.tsx` | Bloqueo de quick actions mutantes |
| `components/admin/orders/admin-order-workspace-modal.tsx` | Status/assignment read-only con copy de sesión cerrada |
| `components/admin/orders/status-form.tsx` | Modo read-only con guard client-side |
| `components/admin/orders/order-assignment-controls.tsx` | Bloqueo de tomar/liberar con copy |
| `components/admin/orders/DashboardToolbar.tsx` | Hint "Modo revisión" |
| `components/admin/orders/dashboard-toolbar.module.css` | Estilos mínimos hint |
| `components/admin/orders/status-form.module.css` | Nota read-only |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-c3.md` | Este documento |

## Action policy

Resolución vía `resolveDashboardActionPolicy(operationalWindow.source)`:

**`last-closed-store-session` (review mode):**

- `canMutateOrders = false`
- `canChangeStatus = false`
- `canAssignOrders = false`
- `canUseQuickActions = false`
- `canOpenOrderDetail = true`
- `canUseNonMutatingUtilities = true`

**`store-session` (active mode):** comportamiento operativo actual (mutaciones permitidas si `canUpdateOrders`).

**`business-window` (passive fallback):** comportamiento actual sin bloqueo adicional en C3.

## Scope modes

| Source | Modo | Mutaciones |
|--------|------|------------|
| `store-session` | active | Permitidas (según permisos) |
| `last-closed-store-session` | review | Bloqueadas |
| `business-window` | passive | Sin cambio C3 |

## Board card behavior

- Quick actions mutantes ocultas (`canUseQuickActions = false`).
- "Ver pedido" sigue disponible.
- Guard en `applyOptimisticStatusChange` evita mutación vía callbacks.

## Modal/status behavior

- Selector de estado visible pero disabled en revisión.
- "Guardar estado" oculto; copy: "Sesión cerrada: estado bloqueado para revisión."
- Guard en submit de `StatusForm`.

## Assignment behavior

- Botón tomar/liberar oculto en revisión.
- Responsable actual visible.
- Copy: "Sesión cerrada: asignación bloqueada."
- Guard en handler + `applyOptimisticAssignmentChange`.

## Non-mutating utilities

Preservadas vía `OrderExternalActions` (WhatsApp, teléfono, maps, clipboard según implementación existente).

## Toolbar/context messaging

- Toolbar: "Sin sesión activa" + sublabel "Modo revisión" cuando aplica.
- Context panel: hint "Modo revisión: acciones operativas bloqueadas."

## Client-side mutation guards

Handlers principales en `admin-dashboard-orders.tsx`:

- `applyOptimisticStatusChange`
- `applyOptimisticAssignmentChange`

Toast informativo: "Estás revisando una sesión cerrada. Abrí una nueva sesión para operar pedidos."

## What was NOT implemented

- server-side mutation guard
- cierre de caja
- reportes/export
- selector/historial de sesiones
- roles/permisos nuevos

## Comportamiento preservado

- Last Closed Session Review Mode de C2 intacto.
- KPIs/insights/board siguen mostrando última sesión cerrada.
- Ver pedido sigue funcionando.
- Search/filter intactos.
- Realtime/hydration/optimistic intactos.
- Manual sync intacto.
- Card/kanban layout intacto.
- Modal/detail layout intacto.

## Qué NO se cambió

- DB/schema
- server actions
- realtime orders
- optimistic callbacks (lógica; sólo guards previos)
- status workflow server-side
- assignment server-side
- WhatsApp builders/templates/URLs
- clipboard/maps/tel logic
- theme tokens/global CSS

## Riesgos encontrados

- Enforcement sólo client-side: mutaciones vía API directa u otra UI no bloqueadas.
- QA manual pendiente para multi-tab y reopen session.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Pass — compilación y typecheck Next OK |
| `npx tsc --noEmit` | Pass — exit 0 |
| `npm run lint` | Pass — 0 errors, 16 warnings (`no-img-element`, preexistentes) |

## QA manual recomendado

Ver checklist prompt C3 (casos 1–6).

**Estado:** pendiente.

## Deuda técnica restante

- **C4 — Server-Side Session Mutation Guard**: validar sesión activa en server actions de estado/asignación.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness** o **C4 — Server-Side Session Mutation Guard**
