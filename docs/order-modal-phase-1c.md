# Order Modal Phase 1C — Context / Overview Presentational Extraction

## Objetivo

Extraer JSX presentacional del contexto cliente/entrega del overview workstation hacia componentes reutilizables, preparando Phase 2A (reorganización visual) **sin cambiar UI, layout, textos ni lógica de negocio**.

Referencias: `docs/order-modal-audit.md`, `docs/order-modal-phase-1a.md`, `docs/order-modal-phase-1b.md`.

## Archivos creados

- `components/admin/orders/order-overview-field.tsx`
- `components/admin/orders/order-customer-delivery-info.tsx`
- `docs/order-modal-phase-1c.md`

## Archivos modificados

- `components/admin/orders/order-workspace-overview.tsx`

## Componentes extraídos

| Componente | Responsabilidad |
|------------|-----------------|
| `OrderOverviewField` | Celda label/value del context grid (`Fecha / hora`, etc.) |
| `OrderCustomerDeliveryInfo` | Bloque workstation: grid, dirección, total, responsable, link detalle |

## Qué JSX se movió

Desde `OrderWorkspaceOverview` branch `variant="workstation"`:

- Context grid (4 campos)
- Párrafo de dirección (delivery)
- Footer total
- Assignment label
- Link "Ver detalle completo"

## Qué quedó en OrderWorkspaceOverview

- Props públicas sin cambios (`order`, `detailHref`, `dashboardHref`, `variant`, `assignmentLabel`)
- Helpers: `formatDeliverySchedule`, formatting via presenter
- `handleDetailNavigation` (router)
- Branches `modal` y `page` (header + badge + hero title) intactos
- Root className workstation wrapper (`admin-order-workspace-overview--workstation`)

## Qué quedó en AdminOrderWorkspaceModal

Sin cambios — sigue usando `<OrderWorkspaceOverview variant="workstation" ... />`.

## Confirmación de comportamiento preservado

- Mismos labels: Fecha / hora, Tipo de entrega, Cliente, Telefono, Total, etc.
- Mismo fallback `"Sin telefono"`
- Dirección solo si `delivery_method === "delivery"` y address trim
- Mismas clases CSS (`order-workspace-overview.module.css`)
- Link detalle con mismo `onDetailNavigation`
- Variants modal/page sin tocar

## Qué NO se tocó

- hydration/cache / `useOrderWorkspaceHydration`
- optimistic callbacks
- workspace route / server actions / realtime / DB
- status / assignment / WhatsApp / risk / timeline logic
- CSS visual layout (sin cambios en `.module.css`)
- texts/labels / responsive behavior
- `admin-order-workspace-modal.tsx`
- Column placement (customer info sigue en columna derecha)

## Riesgos revisados

| Riesgo | Mitigación |
|--------|------------|
| Cambiar visibilidad dirección | Misma condición en parent al pasar `address` |
| Romper link detalle | `onDetailNavigation` pasado desde overview |
| Rombar page variant | Solo extrajo branch workstation |
| CSS module scope | Mismo archivo CSS importado |

## Deuda técnica restante

- Total duplicado (items + overview) — Phase 2
- Responsable duplicado (assignment controls + overview) — Phase 2
- Fecha/hora en overview workstation — decidir en Phase 2A/on-demand
- `OrderWorkspaceOverview` aún con formatting + branching modal/page
- Customer/delivery info sigue en columna derecha hasta Phase 2A
- Variants modal/page no usan `OrderCustomerDeliveryInfo` aún

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ⚠️ Sin script/config ESLint dedicado en el proyecto (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa (Next.js 15.3.0) |

## QA manual recomendado

1. Modal workstation: grid 2×2, dirección delivery, total, responsable, link
2. Pedido pickup: sin dirección
3. Pedido sin teléfono: "Sin telefono"
4. Página detalle `variant="page"`: sin regresión
5. Status, assignment, WhatsApp, risk, timeline sin cambios

## Próxima fase recomendada

**Phase 2A — Modal visual reorganization**: mover customer/delivery a columna izquierda, deduplicar total/responsable, acción recomendada — usando `OrderCustomerDeliveryInfo` ya extraído.
