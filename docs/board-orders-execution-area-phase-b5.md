# Board / Orders Execution Area — Phase B5 — Order Cards Operational UX Pass

## Objetivo

Mejorar la card como unidad operativa principal del Board: jerarquía visual, lectura rápida (<3 s), densidad y accesibilidad — **sin cambiar lógica funcional**.

## Contexto

- **B1–B4** cerraron contrato, view model, empty/context, lanes IA.
- **B5** aplica Operational Card Polish Pass sobre `order-card` y quick actions.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/order-card.tsx` | Reestructura visual: header signals, identity, operational meta, footer simplificado |
| `components/admin/orders/order-card.module.css` | Jerarquía primaria/secundaria, chips, meta block, mobile polish |
| `components/admin/orders/order-card-quick-actions.tsx` | `aria-label` por acción; sin cambio de acciones |
| `components/admin/orders/order-card-quick-actions.module.css` | Botones más táctiles, primary más evidente, loading claro, mobile full-width |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b5.md` | Este documento |

## Cambios aplicados

1. **Header row** — método (chip), status badge, risk, nuevo; timestamp a la derecha.
2. **Identity block** — cliente destacado + resumen de items (sin duplicar item_summary en header).
3. **Operational meta** — assignment en bloque soft; señales cliente, notas y últ. mov. como secundario.
4. **Timeline** — más muted (tertiary/secondary).
5. **Footer** — total secundario + Ver pedido; status movido al header.
6. **Quick actions** — mayor min-height, primary con `--bg-surface-soft`, mobile stack táctil, `aria-label` descriptivos.
7. **Accesibilidad** — `aria-label` en card y botones; `focus-visible` en acciones y Ver pedido.

## Card hierarchy

| Nivel | Contenido |
|-------|-----------|
| Primario | Cliente, status, item summary, método, assignment, risk (si aplica), acción primary |
| Secundario | Total, señales cliente, notas, últ. mov., timeline, acciones secundarias |

## Header / status / method

- Chip de Delivery/Retiro.
- Badge de status junto a señales (antes en footer).
- Risk chip: `warning` más visible, `attention` más sutil.
- Chip `Nuevo` cuando corresponde.

## Customer / item summary

- Cliente: `font-weight 700`, `0.9375rem`.
- Item count + summary en una línea con truncado seguro.
- Eliminada duplicación previa (item_summary en “orderId” del header).

## Assignment / risk / operational meta

- Assignment en bloque `operationalMeta` con tonos self/unassigned/other.
- Risk solo en header (no duplicado en meta).
- Notas con label `Nota` en estilo secundario.

## Quick actions

- Mismas acciones por status (pending/preparing/ready/completed/cancelled).
- `stopPropagation` preservado.
- Primary más evidente visualmente.
- Mobile: primary full-width, min-height ~2.75rem.

## Mobile card behavior

- Padding y gaps ajustados.
- Header stack en viewport muy estrecho (<389px).
- Footer wrap seguro; botón Ver pedido más alto.

## Accessibility

- Card: `role="button"`, `tabIndex={0}`, `aria-label` compuesto.
- Quick actions: `aria-label` por acción + `aria-busy` en loading.
- `focus-visible` en botones de acción y Ver pedido.

## CSS adjustments

Tokens usados: `--bg-surface`, `--bg-surface-soft`, `--bg-surface-hover`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--border-subtle`, `--border-strong`, `--shadow-sm`.

Sin nuevos hex. Fallback rgba solo en `var(--shadow-sm, …)` donde el archivo ya usaba sombras.

## Comportamiento preservado

- Status transitions iguales.
- Assignment behavior igual.
- Quick actions disponibles iguales.
- Card click abre modal igual.
- Search/filter/lanes/context igual.
- Realtime/hydration/optimistic no cambian.
- Manual sync no cambia.

## Qué NO se cambió

- status logic
- assignment logic
- quick action behavior (acciones/disabled/server)
- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- toolbar
- top section
- context panel
- empty states
- lanes IA
- modal/detail
- route JSON
- WhatsApp/Maps URLs

## Compatibilidad con B1/B2/B3/B4

- Card consistente en core y secondary lanes (sin variant por lane).
- `data-order-card-active` / `data-order-card-resolved` preservados para quick actions CSS.
- No toca container, view model ni flow nav.

## Riesgos encontrados

- Status badge en header puede ocupar más espacio en mobile con muchos chips — mitigado con flex-wrap.
- Primary full-width en mobile puede aumentar altura de card — intencional para táctil.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Pass (exit 0) |
| `npx tsc --noEmit` | Pass (exit 0) |
| `npm run lint` | Pass — 0 errors / 16 warnings `@next/next/no-img-element` |

## QA manual recomendado

1. Cards legibles en <3 s con filter=all.
2. Método, status, assignment, risk escaneables.
3. Quick actions sin abrir modal; card click sí abre modal.
4. Enter/Space en card.
5. Optimistic status change + manual sync.
6. completed/cancelled sin quick actions de status.
7. Mobile táctil.
8. Sin regresión context/empty/flow nav.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- Card sigue siendo `div` clickable (no `<button>`) por nested buttons — evaluar en B8.
- WhatsApp sigue en quick actions secundarias (sin cambio B5).
- Duplicados menores en media queries de quick-actions CSS (preexistentes parcialmente consolidados).

## Próxima fase recomendada

**B6 — Realtime / Hydration / Optimistic Hardening**
