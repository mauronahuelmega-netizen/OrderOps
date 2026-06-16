# Order Modal Phase 1B — Hydration Hook Extraction

## Objetivo

Extraer la lógica de hidratación, cache, loading/error y timeline append de `AdminOrderWorkspaceModal` hacia `useOrderWorkspaceHydration`, **sin cambiar comportamiento, UX, contrato público ni API workspace**.

Referencias: `docs/order-modal-audit.md`, `docs/order-modal-phase-1a.md`.

## Archivos creados

- `components/admin/orders/use-order-workspace-hydration.ts`
- `docs/order-modal-phase-1b.md`

## Archivos modificados

- `components/admin/orders/admin-order-workspace-modal.tsx`

## Qué lógica se movió al hook

| Responsabilidad | Antes | Ahora |
|-----------------|-------|-------|
| `workspaceOrderCache` (Map module-level) | modal | hook |
| `detail` / `loading` / `error` state | modal | hook |
| `initialDetail` / `displayOrder` derivación | modal | hook |
| `loadOrder` + fetch workspace | modal | hook |
| `useEffect` open + AbortController | modal | hook |
| `useEffect` merge dashboard order into detail | modal | hook |
| `appendTimelineEvent` | modal | hook |
| Cache read/write en hydration | modal | hook |

## API del hook

```ts
useOrderWorkspaceHydration({
  order: AdminOrderDashboardItem | null;
  isOpen: boolean;
})

// Returns:
{
  displayOrder: AdminOrderWorkspaceData | null;
  detail: AdminOrderWorkspaceData | null;       // activeDetail (id match)
  initialDetail: AdminOrderWorkspaceData | null;
  loading: boolean;
  error: string | null;
  refresh: (options?: { force?: boolean }) => Promise<void>;
  appendTimelineEvent: (event: AdminOrderTimelineEvent) => void;
  updateWorkspaceDetail: (nextDetail: AdminOrderWorkspaceData) => void;
}
```

- `refresh({ force: true })` reemplaza `loadOrder(undefined, { force: true })`.
- `updateWorkspaceDetail` encapsula `workspaceOrderCache.set` + `setDetail` para optimistic patches desde el modal.

## Qué quedó dentro de AdminOrderWorkspaceModal

- Props públicas (sin cambios)
- `useOrderWorkspaceHydration({ order, isOpen })`
- Optimistic handlers (status + assignment) — coordinación modal ↔ dashboard
- `handleStatusSuccess` → `refresh({ force: true })`
- Header/title useMemo + presentational components Phase 1A
- Layout workstation grid + wiring hijos operativos
- `buildOrderDisplayRef` (presentational label helper)

## Confirmación de comportamiento preservado

- Mismo Map cache keyed por `order.id`
- Mismo endpoint `GET /admin/orders/{id}/workspace`
- Misma lógica cache-fresh skip fetch
- Mismo seed via `buildAdminOrderInitialDetail`
- Mismos mensajes error (`No pudimos actualizar/cargar el pedido.`)
- Mismo AbortController en open effect
- Mismo merge effect cuando cambia prop `order`
- Misma deduplicación timeline por `event.id`
- Optimistic handlers conservan orden: patch local → callback dashboard

## Qué NO se tocó

- API workspace route
- server actions
- realtime
- DB / Supabase / RLS
- optimistic callback signatures (props del modal)
- dashboard board logic
- status action logic (`status-form.tsx`)
- assignment action logic (`order-assignment-controls.tsx`)
- WhatsApp logic
- risk logic
- timeline rendering
- CSS visual layout
- texts/labels
- Phase 1A presentational components
- `lib/orders/workspace.ts`

## Riesgos revisados

| Riesgo | Mitigación |
|--------|------------|
| Stale closure en `loadOrder` / `hasUsableSeed` | Mismas deps que antes |
| Loop infinito en effects | Mismas deps `[isOpen, loadOrder, order]` |
| Optimistic sin cache sync | `updateWorkspaceDetail` replica set+cache |
| `appendTimelineEvent` sin initialDetail | Misma closure dep `[initialDetail, order]` |
| Exponer `setDetail` crudo | Evitado — helper `updateWorkspaceDetail` |

## Deuda técnica restante

- Cache module-level sin TTL/eviction (intencional — no scope 1B)
- Optimistic orchestration sigue en modal (Phase 2+)
- Dashboard re-render cascade sigue afectando modal (audit F-02)
- Duplicación total/responsable entre secciones (audit F-05)
- `updateWorkspaceDetail` es API temporal hasta extraer optimistic patches al hook o coordinator

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `npm run lint` | ⚠️ No ejecutado standalone — ESLint no configurado (prompt interactivo en Phase 1A) |
| `npm run build` | ✅ Exit 0 — compile + typecheck OK |

## QA manual recomendado

1. Abrir pedido → seed inmediato → hydration completa
2. Cerrar/reabrir mismo pedido → cache behavior
3. Cambiar pedido A → B → volver A
4. Cambiar estado + guardar → optimistic + refresh force
5. Tomar/liberar pedido
6. Timeline append post settled
7. Error sin seed (simular network fail)
8. Escape / overlay / back con `?order=`

## Próxima fase recomendada

**Phase 2A — Optimistic coordinator extraction** (opcional) o **Phase 2 — Layout/UX premium** según roadmap audit Section 30.

Alternativa incremental: **Phase 1C — `OrderCustomerDeliveryInfo`** presentational extraction (workstation overview branch).
