# Order Modal Phase 2B — Deduplication & Context Cleanup

## Objetivo

Limpiar el bloque `OrderWorkspaceOverview variant="workstation"` eliminando datos duplicados o poco útiles para operación on-demand, sin cambiar lógica operacional ni variants `page`/`modal`.

Referencias: Phase 1A–1C, Phase 2A, `docs/order-modal-audit.md`.

## Archivos modificados

- `components/admin/orders/order-customer-delivery-info.tsx`
- `components/admin/orders/order-workspace-overview.tsx`
- `components/admin/orders/order-workspace-overview.module.css`

## Archivos creados

- `docs/order-modal-phase-2b.md`

## Cambio principal aplicado

El branch workstation deja de renderizar fecha/hora, total y responsable. Solo muestra contexto esencial de cliente/entrega más link a detalle.

## Antes

```txt
Workstation overview:
- Fecha/hora
- Tipo entrega
- Cliente
- Teléfono
- Dirección
- Total
- Responsable
- Link detalle
```

## Después

```txt
Workstation overview:
- Tipo entrega
- Cliente
- Teléfono
- Dirección si aplica
- Link detalle
```

## Qué se removió del workstation overview

- Campo `Fecha / hora` y prop `deliveryScheduleLabel`
- Footer `Total` y prop `totalLabel`
- Párrafo de responsable y prop `assignmentLabel` en `OrderCustomerDeliveryInfo`
- Helper `formatDeliverySchedule` (solo usado por workstation)

## Qué se preservó

- Tipo de entrega, cliente, teléfono (fallback `"Sin telefono"`)
- Dirección solo si `delivery_method === "delivery"` y address con trim
- Link "Ver detalle completo" y `handleDetailNavigation`
- Total en `OrderItemsSection` (`showTotal`)
- Responsable en acciones/assignment controls
- Variants `page` y `modal` sin cambios
- Props públicas de `OrderWorkspaceOverview` (`assignmentLabel` sigue usándose en page/modal)

## Qué NO se tocó

- hydration/cache / `useOrderWorkspaceHydration`
- optimistic callbacks
- workspace route / server actions / realtime / DB
- status logic / assignment logic / WhatsApp logic
- risk logic / timeline rendering
- products list logic / notes logic
- `admin-order-workspace-modal.tsx`
- page/modal variants outside workstation
- texts/labels fuera del workstation overview

## Ajustes CSS realizados

- `.admin-order-workspace-overview--workstation`: `gap` 0.75rem → 0.5rem
- Grid workstation en ≥640px: `gap` 0.75rem → 0.5rem

Sin cambios de paleta, tipografía global, grid 60/40 ni command column.

## Confirmación de variants page/modal

- `variant="page"`: eyebrow con fecha, hero, assignment, badge, total — sin cambios
- `variant="modal"`: mismo header branch — sin cambios
- `/admin/orders/[id]` usa `variant="page"` — no afectado
- `OrderCustomerDeliveryInfo` solo lo consume workstation

## Deuda técnica restante

- Right panel sin recommended action panel
- WhatsApp/quick actions sin jerarquía premium
- Risk/timeline sin polish premium
- Mobile/tablet no rediseñado completamente
- Posible decisión futura sobre link detalle en workstation
- Posible compactación visual posterior del overview (grid 3 campos en 2×2 con celda vacía)

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ⚠️ ESLint no configurado — `npx next lint` abre setup interactivo (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa tras limpiar `.next` (fallo intermitente previo por cache, no relacionado con Phase 2B) |

## QA manual recomendado

1. Dashboard → pedido pendiente
2. Overview izquierda: NO fecha/hora, total, responsable
3. SÍ tipo entrega, cliente, teléfono, dirección (delivery), link detalle
4. Total junto a productos; responsable en acciones
5. Status, assignment, WhatsApp, Maps, riesgo, historial
6. `/admin/orders/[id]` sin regresión

## Próxima fase recomendada

**Phase 2C — Operational panel polish** (recommended action, jerarquía WhatsApp/quick actions) o **Phase 3 — Mobile/tablet layout** según prioridad de producto.
