# Board / Orders Execution Area — Phase B8.9 — Semantic Lane Accents & Premium Contrast Pass

## Objetivo

Polish visual local: devolver color semántico y contraste premium al kanban sin reintroducir chips fuertes de estado en cards.

## Contexto

- B8.7 compactó cards.
- B8.8 unificó superficies y quitó status chip en kanban.
- Resultado: tablero funcional pero demasiado plano en light/dark.

## Problema detectado

Poca separación entre página, lanes y cards; casi sin color semántico; columnas poco diferenciadas; light mode muy blanco; dark mode con superficies similares.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardKanbanBoard.tsx` | `data-lane-status={group.status}` |
| `components/admin/orders/dashboard-kanban.module.css` | Accents, count badges, lane contrast |
| `components/admin/orders/order-card.module.css` | Card elevation, method/risk hierarchy |
| `components/admin/orders/order-card-quick-actions.module.css` | Primary action accent sutil |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-9.md` | Este documento |

## Decisión visual aplicada

El color semántico vuelve al nivel de columna mediante accents y count badges; la card mantiene estructura compacta y no repite status normal con chip fuerte.

```txt
Estado = columna
Urgencia = risk chip
Acción = botón
Detalle = modal
```

## Token strategy

Tokens reutilizados (sin editar `theme-tokens.css`):

| Status | Accent | Strong text |
|--------|--------|-------------|
| pending | `--color-pending` | `--text-pending-strong` |
| preparing | `--color-preparing` | `--text-preparing-strong` |
| ready | `--color-ready` | `--text-ready-strong` |
| completed | `color-mix(text-tertiary, border-strong)` | `--text-secondary` |
| cancelled | `color-mix(color-cancelled, text-tertiary)` | `--text-cancelled-strong` |

Superficies: `--bg-canvas`, `--bg-surface-soft`, `--bg-surface`, `--surface-elevated-bg`, `--border-subtle`, `--border-strong`, `--accent-primary`.

- No se editaron theme tokens globales.
- No se introdujeron tokens globales nuevos.
- No se usaron colores fuertes tipo referencia roja en fondos.

## Semantic lane accents

Top accent 2px vía `.lane::before` con `--lane-accent` por `data-lane-status`.

## Lane count badges

Background/border `color-mix` con accent (~12%/24%); texto `--lane-accent-strong`. Empty lane count más muted.

## Lane surface contrast

- Lane: `--bg-surface-soft` sobre `--bg-canvas`.
- Header: tint sutil + border-bottom.
- Card: `--surface-elevated-bg` sobre lane soft.

## Card surface contrast

Kanban cards: border más visible, shadow 1px sutil, hover con `--border-strong`.

## Method / risk hierarchy

- Method: chip con surface soft, border legible, no saturado.
- Risk attention/warning: tint `--bg-pending-subtle` / `--text-pending-strong` (prioridad sobre method).

## Primary action hierarchy

Primary compact: tint `--accent-primary` en border/background; Ver pedido más neutro (secondary/ghost).

## Completed / secondary lanes

Misma surface base; accent slate neutral; title secondary; cards legibles (B8.8 preserved).

## Light mode QA notes

Canvas gris suave → lane soft → card elevated white; accents 2px visibles.

## Dark mode QA notes

Lane soft más claro que canvas; card elevated; accents visibles sin glow.

## Accessibility preservation

Status chip visual no reintroducido; `aria-label` conserva estado (B8.8).

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions behavior igual.
- Optimistic callbacks iguales.
- Realtime/hydration igual.
- Manual sync igual.
- Search/filter igual.
- Modal/detail igual.
- Kanban persistent lanes igual.
- Card compaction B8.7 preservada.

## Qué NO se cambió

- realtime, hydration, optimistic callbacks, server actions, DB/Supabase, route JSON
- toolbar, top section, context panel, modal/detail
- card data source, status/assignment logic
- image optimization / no-img-element

## Compatibilidad con B8.7/B8.8

- B8.7 layout compacto intacto.
- B8.8 `showStatusBadge={false}` intacto.
- No chips fuertes de status en card.

## Riesgos encontrados

- QA visual light/dark pendiente en entorno real.
- `--accent-primary` en primary button asume token dashboard theme.

## Validaciones ejecutadas

- `npm run build`: pass (tras limpiar `.next` por error transiente de caché webpack)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass — 0 errors / 16 warnings `no-img-element` (sin cambio)

## QA manual recomendado

Ver checklist prompt B8.9.

**Estado:** pendiente.

## Deuda técnica restante

- QA manual pendiente.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
