# Board / Orders Execution Area — Phase B8.7 — Order Card Compaction Contract & Implementation

## Objetivo

Compactar la card del kanban como tarjeta de despacho operativo: decidir rápido y actuar. El modal conserva el detalle completo.

## Contexto

- Board con kanban persistente, búsqueda integrada, empty states B8.6.
- Modal robusto para detalle operativo.
- Cards acumulaban información propia del modal y limitaban pedidos visibles por columna.

## Problema detectado

La card del kanban acumulaba detalle propio del modal: timeline visual, assignment block grande, múltiples acciones secundarias y total destacado. Esto aumentaba la altura y reducía la cantidad de pedidos visibles por columna.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/order-card.tsx` | Layout compacto; timeline/meta block removidos; `#REF · cliente` |
| `components/admin/orders/order-card.module.css` | Padding/gaps reducidos; clases compactas |
| `components/admin/orders/order-card-quick-actions.tsx` | `variant="compact"`; sólo acción primaria |
| `components/admin/orders/order-card-quick-actions.module.css` | Estilos compact inline |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-7.md` | Este documento |

## Decisión IA aplicada

```txt
Card = decidir rápido y actuar.
Modal = entender y operar el pedido en detalle.
```

## Card information contract

### Information kept in card

- order number / fallback id (`#` + últimos 4 chars UUID, B8.5)
- customer name
- method
- status
- relative time
- item count + summary
- compact assignment
- risk only if meaningful (`level !== "stable"`)
- primary next action
- Ver pedido
- compact total (terciario en action row)

### Information moved to modal

- full products/prices
- full timeline
- WhatsApp
- phone/address/maps/share/copy
- destructive/secondary actions
- detailed assignment/workspace controls

## Removed / compacted sections

- Timeline visual Recibido/Preparando/Listo
- Bloque `operationalMeta` (cliente nuevo, últ. mov., notas)
- WhatsApp en card
- Cancelar / Completar secundario desde preparing
- Footer grande con total protagonista

## Order number display

Campo: **`order.id`** (UUID) → `buildOrderDisplayRef`: últimos 4 caracteres sin guiones, uppercase.

Formato card: `#AB12 · Mauro Nahuel` (mismo criterio B8.5 / modal).

## Assignment compaction

Una línea via `buildOrderAssignmentOwnerLabel`:

- Sin responsable
- A tu cargo
- A cargo de {nombre}

Sin bloque bordered ni señales secundarias.

## Risk display

Chip sólo cuando `riskAssessment.level !== "stable"`. Labels sin cambio (`buildOrderRiskBadgeLabel`).

## Quick actions compaction

`variant="compact"` en kanban:

| Status | Acción primaria |
|--------|-----------------|
| pending | Preparar |
| preparing | Marcar listo |
| ready | Completar |
| completed/cancelled | ninguna |

Removido del kanban: Cancelar, WhatsApp, Completar secundario desde preparing.

Server actions y optimistic callbacks sin cambio.

## Total / footer behavior

Total compacto (`0.6875rem`, tertiary) en action row izquierda. Ver pedido + acción primaria a la derecha.

## CSS compaction

- Card padding `0.625rem 0.75rem`, gap `~0.44rem`
- Sin timeline CSS
- Action row horizontal con border-top dashed
- Objetivo altura: ~145–175px normal (sin height rígido)

## Accessibility preservation

- `article role="button"` + keyboard guard B8
- `aria-label`: `Pedido #REF de cliente, método, estado`
- stopPropagation en botones internos
- focus-visible preservado

## Mobile behavior

Action row wrap; Ver pedido y primary full-width en ≤389px. Sin horizontal overflow.

## Performance / memoization

`areOrderCardPropsEqual` sin cambios de contrato. Imports muertos removidos (`buildLastActivityLabel`).

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
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

## Compatibilidad con B5/B8/B8.1–B8.6

- B5 quick actions táctiles: primary preservado.
- B8 a11y card: preservada.
- Kanban B8.1–B8.6: sin cambios estructurales.

## Riesgos encontrados

- `variant="default"` en quick-actions ya no incluye WhatsApp (sólo se usa `compact`).
- Notas/cliente nuevo ya no visibles en card (modal/context).

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA manual recomendado

Ver checklist prompt B8.7 (densidad, acciones, interacción, functional, responsive).

**Estado:** pendiente.

## Deuda técnica restante

- QA manual pendiente.
- CSS WhatsApp/secondary en quick-actions.module.css (legacy default) podría limpiarse en fase posterior.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
