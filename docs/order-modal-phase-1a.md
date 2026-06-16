# Order Modal Phase 1A — Presentational Extraction

## Objetivo

Reducir la complejidad visual de `AdminOrderWorkspaceModal` extrayendo JSX presentacional (header, toolbar, loading/error) a componentes pequeños hook-free, **sin cambiar UI, layout, comportamiento ni lógica de negocio**.

Referencia: `docs/order-modal-audit.md` (Sections 4.1, 5, 16, 25, 26, 27, 31).

## Archivos modificados

- `components/admin/orders/admin-order-workspace-modal.tsx`

## Archivos creados

- `components/admin/orders/order-modal-header.tsx`
- `components/admin/orders/order-modal-workspace-toolbar.tsx`
- `components/admin/orders/order-modal-states.tsx`
- `docs/order-modal-phase-1a.md`

## Qué se extrajo

| Componente | Origen | Responsabilidad |
|------------|--------|-----------------|
| `OrderModalHeaderLeading` | `workstationHeaderLeading` useMemo JSX | Ref pedido, cliente, badge estado |
| `OrderModalHeaderMeta` | `headerMeta` inline span | Label `Tiempo: {elapsed}` |
| `OrderModalWorkspaceToolbar` | Toolbar presencia/refresh inline | "Actualizando..." + `OperatorPresencePill` |
| `OrderModalLoadingState` | Loading block pre-content | Textos de carga inicial |
| `OrderModalErrorState` | Error block pre-content | Error de hidratación sin seed |

## Qué NO se tocó

- hydration/cache (`loadOrder`, `workspaceOrderCache`, `buildAdminOrderInitialDetail`)
- optimistic callbacks (`handleOptimistic*`, props del dashboard)
- server actions (`updateOrderStatusAction`, `updateOrderAssignmentAction`)
- realtime
- DB / RLS
- workspace route (`GET /admin/orders/[id]/workspace`)
- dashboard board logic (`admin-dashboard-orders.tsx`)
- CSS visual layout (`admin-order-modal.module.css` sin cambios)
- status actions (`status-form.tsx`)
- assignment actions (`order-assignment-controls.tsx`)
- WhatsApp actions (`order-external-actions.tsx`)
- risk logic (`order-risk-panel.tsx`, `risk-detection.ts`)
- timeline logic (`order-human-timeline.tsx`, `events.shared.ts`)
- `AdminOrderModalShell` contrato (title, headerLeading, headerMeta, onClose)
- Subcomponentes de layout (items, overview, actions, risk, timeline)

## Confirmación de comportamiento preservado

- Mismas clases CSS importadas desde `admin-order-modal.module.css`
- Mismos textos visibles
- Mismo orden visual en header: `#REF - Cliente` · Badge · Tiempo · Cerrar (shell)
- Toolbar: loading muestra "Actualizando..."; sin loading muestra presencia si existe
- Loading/error gates: `loading && !displayOrder`, `error && !displayOrder`
- Cálculo de `modalTitle`, `headerElapsedTime`, `workstationHeaderLeading` permanece en el orquestador

## Riesgos revisados

| Riesgo | Estado |
|--------|--------|
| Duplicar botón Cerrar | Evitado — sigue en shell |
| Cambiar contrato shell | Evitado — headerLeading/headerMeta intactos |
| Mover hydration a hook | Evitado — fuera de scope |
| Alterar optimistic flow | Evitado — handlers sin cambios |
| Toolbar branch logic | Preservado — misma bifurcación loading vs presence |

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `npm run lint` | ⚠️ No configurado — Next.js abrió prompt interactivo de setup ESLint (config preexistente ausente). No se inventó resultado. |
| `npm run build` | ✅ Exit 0 — compile + typecheck + lint interno de Next OK |

## Próxima fase recomendada

**Phase 1B — `useOrderWorkspaceHydration` hook extraction**

Extraer `detail`/`loading`/`error`, `loadOrder`, `workspaceOrderCache`, `appendTimelineEvent` a un hook dedicado sin cambiar API pública del modal. Mantener presentational components creados en 1A.

Opcionalmente después: `OrderCustomerDeliveryInfo` (workstation overview branch) como extracción presentacional pura.
