# Board / Orders Execution Area — Phase M5 — Manual Order Modal UX Re-architecture

## Objetivo

Reestructurar el modal de pedido manual de formulario lineal a workstation operacional de carga rápida, preservando toda la lógica M1–M4.

## Contexto

M1–M4 entregaron contrato server, toolbar, refresh de productos, submit lock, dedupe realtime y push best-effort. M5 actúa solo sobre layout, jerarquía visual y densidad operacional.

## Problema visual detectado

El modal funcionaba técnicamente, pero se sentía como formulario largo. Productos y resumen no tenían jerarquía suficiente, notas dominaba demasiado y el operador podía perder contexto del pedido.

## Archivos modificados

- `components/admin/orders/manual-order-modal.tsx`
- `components/admin/orders/manual-order-modal.module.css`

## Archivos creados

- `docs/board-orders-execution-area-phase-m5.md`

## Decisión UX aplicada

El modal pasa a una workstation: catálogo operativo a la izquierda, pedido en construcción a la derecha, datos de cliente/entrega compactos arriba.

## Before / after

**Before:** Cliente → Entrega → Notas → Productos → Resumen → Footer (scroll lineal).

**After:** Header compacto → Cliente/Entrega strip → [Productos | Pedido] → Footer sticky con CTA contextual.

## Layout workstation

- `manual-order-modal__workstation` — grid dos columnas desde 900px.
- `products-panel` (~60%) — búsqueda + lista scrolleable.
- `summary-panel` (~40%) — items, notas, total.

Mobile/tablet: una columna (productos arriba, pedido abajo).

## Customer / delivery strip

Grid compacto:

- Desktop: nombre | teléfono; retiro/delivery | dirección (si delivery).
- Inputs más bajos (36px).
- Una sola sección “Cliente / Entrega”.

## Products panel

- Search protagonista con hint *Seleccioná productos para armar el pedido.*
- Filas compactas: nombre, categoría muted, precio alineado, botón `+` con `aria-label`.
- Lista scrollea internamente.

## Summary panel

- Título “Pedido”.
- Líneas `qty × producto` + subtotal + controles +/-.
- Notas compactas (2 filas) debajo de items.
- Total estimado siempre visible al pie del panel.

## Notes relocation

Notas movidas del flujo principal al panel derecho, textarea 2 filas, opcional.

## Footer CTA

- Desktop con items: `Crear pedido · $XX.XXX`
- Mobile: `Crear pedido` (total visible en panel).
- Sticky, accesible en pantallas bajas.

## Responsive behavior

| Breakpoint | Comportamiento |
|------------|----------------|
| ≥ 900px | Dos columnas, scroll interno por panel |
| < 900px | Columna única, scroll controlado |
| < 640px | Campos apilados, footer full width |

## Logic preserved

- `createManualOrderAction` intacta.
- Server pricing intacto.
- Product refresh on open intacto (props sin cambio).
- Submit lock intacto.
- `NO_ACTIVE_SESSION` handling intacto.
- Local insertion/realtime dedupe intacto.
- Push best-effort intacto (dashboard, sin cambios M5).

## What was NOT implemented

- payment method
- discounts/promos
- delivery fee
- modifiers/variants
- stock decrement
- customer CRM
- category tabs avanzados
- resumen mobile colapsable
- wizard

## Comportamiento preservado

- M1 server contract intacto.
- M2 modal intacto (presentación).
- M3 toolbar/reconciliation intactos.
- C2/C3/C4/C4.1 intactos.
- Checkout público intacto.
- Pricing server-side intacto.
- Status/assignment workflow intacto.

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

- En viewports intermedios (640–899px) el scroll puede requerir algo más de desplazamiento que en desktop ancho.
- Badge “Pedido manual” depende de `headerMeta` del shell existente.

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA visual recomendado

Pendiente sin sesión local: layout desktop dos columnas, strip compacto, notas en panel pedido, footer sticky, mobile apilado, crear pedido funcional.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness** — QA end-to-end manual + checkout en staging.
