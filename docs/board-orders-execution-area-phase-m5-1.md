# Board / Orders Execution Area — Phase M5.1 — Manual Order Modal Enterprise Polish Pass

## Objetivo

Elevar el modal de pedido manual de workstation funcional a premium operational workstation, preservando toda la lógica M1–M5.

## Contexto

M5 reestructuró layout (cliente strip + productos | pedido + footer). M5.1 aplica polish visual: ticket vivo, superficies, estados y CTA integrado.

## Problema visual detectado

M5 corrigió la arquitectura del flujo, pero el modal todavía se veía plano y genérico. Faltaba calidad percibida enterprise: ticket vivo, superficies refinadas, producto más escaneable, estados vacíos más intencionales y CTA más integrado.

## Archivos modificados

- `components/admin/orders/manual-order-modal.tsx`
- `components/admin/orders/manual-order-modal.module.css`

## Archivos creados

- `docs/board-orders-execution-area-phase-m5-1.md`

## Cambio principal aplicado

Polish CSS-first con wrappers mínimos: panel Pedido como ticket elevado, filas de catálogo refinadas, segmented control de entrega, estados vacíos/warning/loading integrados, scrollbars sutiles, footer con backdrop.

## Ticket-style summary panel

- Surface elevada con sombra suave y borde más intencional.
- Header “Pedido” + subtítulo “Ticket en construcción”.
- Empty state: *Pedido vacío* + copy guía.
- Items con separadores suaves (sin cajas pesadas).
- Total como bloque de cierre con jerarquía activa/inactiva.

## Product row polish

- Nombre con peso 650, categoría muted, precio tabular alineado.
- Botón `+` circular con hover/focus/active.
- Fila seleccionada (`--selected`) con tint + badge “En pedido”.
- Hover suave en filas.

## Customer / delivery polish

- Strip en surface propia compacta.
- Labels más livianos (0.74rem, secondary).
- Retiro/Delivery como segmented control premium (radio visual oculto, accesible).
- Label *Dirección de entrega * cuando delivery.

## Header polish

- Badge “Pedido manual” más sutil (uppercase, tracking).
- Subtitle ligeramente reducido.

## Footer polish

- Border-top sutil + backdrop blur.
- Primary con min-width; secondary más liviano.
- CTA desktop `Crear pedido · $total` con `white-space: nowrap`.

## Scrollbar polish

Scrollbars thin en products list, summary list y workstation mobile (webkit + scrollbar-width).

## Empty / loading / error states

- Ticket empty surface dedicada.
- Alert `--warning` para refresh fallido.
- Alert `--loading` dashed para productos cargando.
- Field errors con surface sutil roja.

## Responsive polish

- 640–899px: gaps/padding reducidos, max-height panels 180px.
- Mobile: footer full width, product grid areas preservadas.

## Logic preserved

- `createManualOrderAction` intacta.
- Server pricing intacto.
- Product refresh on open intacto.
- Submit lock intacto.
- `NO_ACTIVE_SESSION` handling intacto.
- Local insertion/realtime dedupe intacto.
- Push best-effort intacto.

Validaciones funcionales sin cambio (mensajes de error de negocio preservados; label dirección es microcopy visual).

## What was NOT implemented

- payment method
- discounts/promos
- delivery fee
- modifiers/variants
- stock decrement
- customer CRM
- category tabs advanced
- resumen mobile colapsable
- wizard

## Comportamiento preservado

- M1–M5 flujo técnico intacto.
- C2/C3/C4/C4.1 intactos.
- Toolbar/realtime/checkout intactos.

## Qué NO se cambió

- DB/schema
- RLS
- RPC `public.create_order`
- server action contract
- pricing server-side
- toolbar behavior
- realtime internals
- checkout público
- status/assignment workflow
- theme tokens/global CSS

## Riesgos encontrados

- Badge “En pedido” puede truncarse en nombres muy largos (flex min-width 0 mitiga).
- Segmented control oculta radio visualmente — mantiene input para accesibilidad.

## Validaciones ejecutadas

- `npm run build`: pass (Next.js 15.3.0, compiled successfully; `/admin/categories` sin error).
- `npx tsc --noEmit`: pass (exit 0).
- `npm run lint`: pass — 0 errors / 16 warnings `no-img-element` (preexistentes, sin cambio).

## QA visual recomendado

Pendiente sin sesión local: ticket premium desktop, empty state, total activo, productos escaneables, mobile/tablet.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
