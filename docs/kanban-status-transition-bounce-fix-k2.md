# Kanban Status Transition Bounce Fix — K2

## Objetivo

Eliminar el bounce visual al avanzar una card del kanban entre estados (`pending → preparing`, etc.) con el menor cambio posible, aplicando el hallazgo K1.

## Contexto

K1 auditó que `useEffect([orders])` en `admin-dashboard-orders.tsx` reemplazaba `optimisticOrders` con el snapshot SSR sin reconciliar pending mutations, mientras `refreshOrdersSilently` sí usaba `reconcileDashboardOrdersWithPendingMutations`.

Referencias: `kanban-status-transition-bounce-audit-k1.md`, B6 reconciliation, Board V1 handoff.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`

## Archivos creados

- `docs/kanban-status-transition-bounce-fix-k2.md`

## Hallazgo K1 aplicado

El `useEffect([orders])` reemplazaba `optimisticOrders` con el snapshot SSR sin reconciliar pending mutations.

## Cambio principal aplicado

El sync de props SSR ahora pasa por `reconcileDashboardOrdersWithPendingMutations` antes de `setOptimisticOrders`.

El effect se movió **después** de `useAdminOrdersRealtime` para acceder a `getPendingMutationPatch`.

## Antes

```tsx
useEffect(() => {
  setOptimisticOrders(sortOrdersForOperationalBoard(orders));
}, [orders]);
```

## Después

```tsx
const getPendingMutationPatchRef = useRef(getPendingMutationPatch);
getPendingMutationPatchRef.current = getPendingMutationPatch;

useEffect(() => {
  const reconciledOrders = reconcileDashboardOrdersWithPendingMutations(
    orders,
    (orderId) => getPendingMutationPatchRef.current(orderId)
  );
  setOptimisticOrders(sortOrdersForOperationalBoard(reconciledOrders));
}, [orders]);
```

## Dependency array

Solo `[orders]`. `getPendingMutationPatch` no está memoizado (nueva función cada render); incluirlo re-ejecutaría el effect en cada render y, tras `clearPendingMutation`, podría re-aplicar snapshot stale. Se usa `getPendingMutationPatchRef` para leer el pending map actual cuando `orders` cambia, sin warning `exhaustive-deps` ni loops.

## Por qué corrige el bounce

Cuando `router.refresh()` entrega `orders` SSR stale (status anterior) durante una mutación in-flight, el pending map indica el `expectedStatus`. `reconcileDashboardOrdersWithPendingMutations` aplica ese patch sobre el snapshot server antes de escribir `optimisticOrders`, evitando la vuelta breve a la lane origen.

## Qué se preservó

- optimistic status change
- pending mutation map
- realtime suppression
- silent refresh reconciliation
- server actions
- DB/schema
- kanban layout
- order cards
- toolbar/search/filter
- `sortOrdersForOperationalBoard`

## Qué NO se cambió

- `updateOrderStatusAction`
- Supabase realtime subscription
- DB/schema
- RLS/policies
- order-card quick actions
- `DashboardKanbanBoard` visual
- CSS/UI
- store-session hydration logic
- `refreshOrdersSilently`
- finalize/rollback/realtime handlers

## Riesgos / edge cases

- Pending TTL 8s expirado + SSR stale sin refresh posterior — comportamiento preexistente.
- Nuevos pedidos sólo en SSR refresh sin realtime — sin cambio vs antes.
- ESLint `exhaustive-deps` resuelto vía `getPendingMutationPatchRef` sin silenciar reglas.

## Validaciones ejecutadas

- `npm run build`: **pass** (1er intento).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / **16 warnings** (`no-img-element` baseline; sin nuevo `exhaustive-deps` tras ref pattern).

## QA manual recomendado

1. Click `PENDIENTES → PREPARANDO` sin bounce triple.
2. `PREPARANDO → LISTOS`, `LISTOS → COMPLETADOS`.
3. Race: tab switch / reconnect / manual resync durante mutación.
4. Dos tabs realtime.
5. Search/filter, review mode, assignment, manual order, modal.

**Estado:** pendiente staging.

## Criterios de aceptación

| Criterio | Estado |
|----------|--------|
| `useEffect([orders])` usa reconcile | ✓ |
| Pending no pisado por SSR stale | ✓ (código) |
| `sortOrdersForOperationalBoard` preservado | ✓ |
| Sin cambios server/realtime/DB/UI | ✓ |
| Build/tsc/lint | pendiente |

---

**Fix date:** 2026-06-06 (K2)
