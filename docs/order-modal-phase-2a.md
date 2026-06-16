# Order Modal Phase 2A — Information Architecture Reorganization

## Objetivo

Reorganizar la arquitectura de información del modal workstation moviendo el bloque cliente/entrega (`OrderCustomerDeliveryInfo` vía `OrderWorkspaceOverview variant="workstation"`) desde la columna derecha hacia la columna izquierda, sin cambiar lógica ni textos.

Referencias: `docs/order-modal-audit.md`, Phase 1A/1B/1C.

## Archivos modificados

- `components/admin/orders/admin-order-workspace-modal.tsx`
- `components/admin/orders/order-workspace-overview.module.css`

## Archivos creados

- `docs/order-modal-phase-2a.md`

## Cambio principal aplicado

`OrderWorkspaceOverview variant="workstation"` se renderiza en `executionColumn` entre productos y notas, en lugar de `commandColumn` entre acciones y riesgo.

## Antes

```txt
Left column: products + notes
Right column: actions + overview + risk + timeline
```

## Después

```txt
Left column: products + overview/customer delivery + notes
Right column: actions + risk + timeline
```

## Qué se movió

- `<OrderWorkspaceOverview variant="workstation" ... />` de `commandColumn` → `executionColumn` (después de `OrderItemsSection`, antes de `OrderNotesSection`)
- Props sin cambios: `order`, `assignmentLabel`, `detailHref`, `dashboardHref`, `variant`

## Qué NO se tocó

- hydration/cache / `useOrderWorkspaceHydration`
- optimistic callbacks
- workspace route / server actions / realtime / DB
- status logic / assignment logic / WhatsApp logic
- risk logic / timeline rendering
- products list logic / notes logic
- `order-workspace-overview.tsx` / `order-customer-delivery-info.tsx` (sin cambios de código)
- page/modal variants outside workstation
- texts/labels
- total / responsable / fecha-hora (mantenidos, duplicados incluidos)

## Confirmación de comportamiento preservado

- Mismos props y variant en overview
- Link "Ver detalle completo" y `handleDetailNavigation` intactos
- `variant="page"` en `/admin/orders/[id]` sin cambios
- Branch `modal` de overview sin cambios
- Acciones, riesgo, historial siguen en columna derecha con mismo orden relativo

## Ajustes CSS realizados

En `.admin-order-workspace-overview--workstation`:

- `width: 100%` — ocupa ancho de columna izquierda
- `padding-top: 0.75rem` + `border-top: 1px solid var(--border-subtle)` — separación visual mínima respecto a productos

Sin cambios en paleta, tipografía, grid 60/40, ni estilos de command column.

## Deuda técnica restante

- **Total duplicado** — productos (`showTotal`) + overview footer → Phase 2B
- **Responsable duplicado** — assignment controls + overview label → Phase 2B
- **Fecha/hora** — sigue visible en overview; decisión on-demand pendiente Phase 2B/2C
- Right panel sin recommended action panel
- WhatsApp/quick actions sin jerarquía premium
- Risk/timeline sin polish premium
- Mobile/tablet no rediseñado completamente (stack mobile: acciones arriba, detalle abajo — overview ahora viaja con productos)

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ⚠️ ESLint no configurado — `npx next lint` abre setup interactivo (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa (Next.js 15.3.0) |

## QA manual recomendado

1. Dashboard → abrir pedido pendiente
2. Izquierda: productos → overview (cliente/entrega/total/link) → notas
3. Derecha: acciones → riesgo → historial
4. Delivery con dirección / pickup sin dirección
5. Link detalle, status, assignment, WhatsApp, Maps, copiar teléfono
6. Cerrar modal (botón, Escape, overlay)
7. `/admin/orders/[id]` con `variant="page"` sin regresión

## Próxima fase recomendada

**Phase 2B — Deduplication & context cleanup**: eliminar total/responsable duplicados, decidir fecha/hora on-demand, posible compactación del overview en columna izquierda.
