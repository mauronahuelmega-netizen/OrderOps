# Board / Orders Execution Area — Phase B8.8 — Enterprise Kanban Visual Hierarchy Pass

## Objetivo

Polish visual/IA de jerarquía: kanban y cards más premium, sobrios y enterprise. Sin cambios funcionales.

## Contexto

- B8.7 compactó cards como tarjetas de despacho.
- El tablero funcionaba bien pero chips de estado repetían información de columna y competían con señales operativas.

## Problema detectado

La card del kanban acumulaba acentos visuales redundantes: chip de status coloreado dentro de una lane que ya comunica estado, tonalidades distintas entre columnas y demasiados badges para información normal.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/order-card.tsx` | `showStatusBadge`; aria-label con estado en español; `data-order-card-surface="kanban"` |
| `components/admin/orders/order-card.module.css` | Superficie kanban sobria; chips neutros; completed muted sin opacity global |
| `components/admin/orders/DashboardKanbanBoard.tsx` | `showStatusBadge={false}` |
| `components/admin/orders/dashboard-kanban.module.css` | Lanes unificadas `bg-surface` + border; secondary sin opacity |
| `components/admin/orders/order-card-quick-actions.module.css` | Primary button enterprise (menos chillón) |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-8.md` | Este documento |

## Decisión visual aplicada

```txt
Columna = estado.
Card = identidad + acción.
Color fuerte = riesgo, acción primaria, alerta real.
Estado normal = omitido visualmente en kanban.
```

## Status signal strategy

- El estado normal lo comunica la columna.
- La card kanban no repite estado con chip fuerte (`showStatusBadge={false}` en kanban).
- Filtered list conserva badge (`showStatusBadge` default `true`).
- El estado permanece en `aria-label` y en modal.

## Method signal strategy

- Delivery/Retiro se mantiene porque aporta operación.
- Chip neutro: transparent background, peso 600, sin acento de color.

## Risk signal strategy

- Riesgo sólo cuando `level !== "stable"`.
- Warning sin fondo pending-subtle; borde/texto sobrios.
- No duplicar risk en meta.

## Lane surface unification

- Todas las lanes: `background: var(--bg-surface)`, `border: 1px solid var(--border-subtle)`.
- Secondary lanes: misma superficie; título/count muted.
- Removido `opacity: 0.86` en secondary.

## Completed / secondary lane treatment

- Cards resolved en kanban: texto muted, sin opacity de card completa.
- Ver pedido y interacción preservados.

## Card header hierarchy

```txt
#REF · Cliente                    tiempo
[Delivery] [Risk] [Nuevo]
items · summary
assignment
total · [acción] · Ver pedido
```

## Accessibility preservation

- `aria-label`: `Pedido #REF de cliente, Delivery, estado pendiente.`
- `role="button"`, keyboard guard, focus-visible, stopPropagation intactos.

## CSS adjustments

- Kanban cards: shadow reducido en reposo.
- Lane body gap: `0.75rem`.
- Empty lane: fondo transparente.

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Optimistic callbacks iguales.
- Realtime/hydration igual.
- Manual sync igual.
- Search/filter igual.
- Modal/detail igual.
- Kanban persistent lanes igual.

## Qué NO se cambió

- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- route JSON
- toolbar
- top section
- context panel
- modal/detail
- card data source
- status/assignment logic
- image optimization / no-img-element

## Compatibilidad con B5/B8/B8.7

- B8.7 layout compacto: intacto.
- B8 a11y: aria-label mejorado.
- B5 quick actions: behavior intacto, polish visual primary.

## Riesgos encontrados

- Filtered list sigue mostrando status badge (intencional).
- PriorityRiskLanes/DeliveryWorkflowLanes fuera de scope (usan renderOrderCard sin showStatusBadge=false si se reactivaran).

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA manual recomendado

Ver checklist prompt B8.8.

**Estado:** pendiente.

## Deuda técnica restante

- QA manual pendiente.
- `badgeClassName` operational_aging sólo aplica en filtered list con status badge.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
