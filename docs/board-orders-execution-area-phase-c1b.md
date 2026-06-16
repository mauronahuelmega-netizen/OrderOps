# Board / Orders Execution Area — Phase C1b — Session Scope Metrics Fix

## Objetivo

Corregir desalineaciones puntuales de scope operativo detectadas en C1a, sin rediseñar dashboard ni cambiar split top/context.

## Contexto

Cadena operativa:

```txt
optimisticOrders → visibleOperationalOrders → filteredOrders
```

## Hallazgo de C1a

El top section ya usa `visibleOperationalOrders`; el P0 histórico con `businessWindowOrders` está resuelto. Quedaban desalineaciones puntuales: queue pressure con doble filtro calendario, close guard con `optimisticOrders` completo y copy “hoy/del día” en superficies session-scoped.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/orders/queue-pressure.ts` | `getActiveOrdersInScope`; sin `getTodayOrders` en pressure |
| `components/admin/orders/admin-dashboard-orders.tsx` | Close guard + `isStoreSession` en business insights |
| `lib/orders/dashboard-top-section-view-model.ts` | Copy delivery/pickup sesión vs jornada |
| `lib/orders/business-insights.ts` | Copy alineado con `isStoreSession` |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-c1b.md` | Este documento |

## Cambios aplicados

### Queue pressure session-safe fix

- Nuevo `getActiveOrdersInScope(orders)` filtra `pending | preparing | ready` sobre el array recibido.
- `buildOrdersQueuePressure` usa scope directo; eliminado re-filtro calendario vía `getTodayOrders`.
- `getTodayActiveOrders` queda como alias deprecated → `getActiveOrdersInScope`.

### Session close guard scoped fix

- `hasActiveOrdersInProgress` ahora usa `visibleOperationalOrders.some(active)` en lugar de `optimisticOrders`.

### Top section copy alignment

- Insights delivery/pickup: “domina la sesión” vs “domina hoy” según `isStoreSession`.

### Business insights copy alignment

- Nuevo input opcional `isStoreSession`.
- Ticket alto: “ticket promedio de la sesión/jornada”.
- Delivery/retiro dominance y sales momentum alineados al scope.

## Scope contract preserved

| Superficie | Input |
|------------|-------|
| Top section | `visibleOperationalOrders` (sin cambio) |
| Context panel | `filteredOrders` (sin cambio) |
| Kanban/cards | `filteredOrders` (sin cambio) |

Top section resume sesión/jornada completa. Context panel resume vista actual del board.

## What remains intentionally unchanged

- Split top vs context (filter/search no afectan top section).
- Thresholds de queue pressure.
- Fórmulas de métricas e insights.

## What was NOT implemented

- No se implementó last closed session analytics scope.
- No se implementó cierre de caja.
- No se implementó selector de sesiones.

## Comportamiento preservado

- Top section sigue usando `visibleOperationalOrders`.
- Context panel sigue usando `filteredOrders`.
- Kanban/cards siguen usando `filteredOrders`.
- Realtime/hydration/optimistic intactos.
- Manual sync intacto.
- Search/filter intactos.
- Modal/detail intacto.

## Qué NO se cambió

- realtime, hydration, optimistic callbacks, server actions, DB/Supabase, route JSON
- toolbar logic, modal behavior, card layout / CSS, search/filter logic
- kanban grouping, status/assignment workflow

## Compatibilidad con roadmap B

Sin impacto en B7–B10 (cards, kanban, relative time). C1b es capa métricas/scope.

## Riesgos encontrados

- Queue pressure puede subir en sesiones nocturnas (comportamiento correcto).
- Close guard más estricto al scope operativo visible.

## Validaciones ejecutadas

- `npm run build`: pass
- `npx tsc --noEmit`: pass
- `npm run lint`: pass — 0 errors / 16 warnings `no-img-element` (sin cambio)

## QA manual recomendado

Ver checklist prompt C1b (queue pressure medianoche, close guard, copy sesión/jornada).

**Estado:** pendiente.

## Deuda técnica restante

- QA manual pendiente.
- `getTodayActiveOrders` deprecated; eliminar en cleanup futuro si no hay consumidores externos.

## Próxima fase recomendada

**C2 — Last Closed Session Review Mode** (o **B9 — Final QA / Production Readiness** si no hay blockers de producto)
