# Admin Dashboard Toolbar Phase T6 — Scanning Operacional Integration

## Objetivo

Integrar visual y semánticamente la franja de navegación por estados debajo del toolbar, reemplazando copy técnico por lenguaje operacional humano, sin alterar lane navigation behavior.

## Contexto

- **T1** congeló: `Estados del flujo`, `Esperando ingresos`, `Sin pedidos`; scanning = navegación auxiliar adjacent (Nivel 4).
- **T3/T5** consolidaron toolbar; T6 trabaja debajo sin mover toolbar.
- **T0** detectó micro-tipografía y copy duplicado en empty variant inline.

## Archivos modificados

- `components/admin/orders/lane-navigation-scanning.tsx`
- `components/admin/orders/lane-navigation-scanning.module.css`
- `components/admin/orders/admin-dashboard-orders.tsx` (empty scanning variant copy only)
- `lib/orders/lane-navigation-scanning.ts` (constantes de copy presentation-only)

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t6.md`

## Cambio principal

Copy unificado vía constantes exportadas; legibilidad de header/chips/pills mejorada; franja conectada al toolbar con borde superior sutil y spacing tokenizado.

## Copy aplicado

| Antes | Después |
|-------|---------|
| `Scanning operacional` | `Estados del flujo` |
| `Panel en escucha` | `Esperando ingresos` |
| `Saltos rapidos entre lanes visibles` | `Salto rápido entre columnas visibles` (subtitle; oculto en vista con pedidos) |
| `Sin pedidos` | `Sin pedidos` (sin cambio) |

Aria labels actualizados: `Estados del flujo`, `Estados del flujo sin pedidos`.

## Empty scanning variant

Opción A: inline en `renderOperationalEmptyState` preservado; copy via constantes compartidas con `LaneNavigationScanning`. Empty principal T7 sin cambios.

## Visual / CSS polish aplicado

- Header: `0.6875rem`, weight 700.
- Chips: `min-height 1.375rem`, label/count `0.6875rem`.
- Empty pills: `min-height 1.375rem`, `0.6875rem`.
- Root: `margin-top`, `padding-top`, `border-top` tokenizados.
- Mobile: strip con scroll horizontal y `scroll-snap`.
- `focus-visible` en chips.

## Accessibility improvements

- `aria-label` del grupo sin jerga técnica.
- `aria-pressed` preservado en chips.
- Botones mantienen semántica button; hit targets mejorados.

## Behavior preservation

- `buildLaneNavigationModel` sin cambios de lógica.
- IntersectionObserver thresholds/rootMargin intactos.
- `scrollIntoView({ behavior: "smooth", block: "start" })` intacto.
- Counts, lane IDs, suggested focus, tone classes preservados.

## Mobile/tablet preservation

- Chips con overflow-x horizontal en `≤768px`.
- Labels legibles sin inflar altura excesivamente.
- Sin overflow de página.

## Qué se preservó

- lane navigation behavior
- IntersectionObserver behavior
- scroll-to-lane behavior
- lane counts
- search behavior
- filter URL sync
- session controls T4
- toolbar T5
- empty/context behavior (principal T7)
- top section

## Qué NO se tocó

- empty/context copy T7 (principal)
- dead code cleanup T9
- search parser
- filters / toolbar
- realtime internals
- server actions
- DB/Supabase
- order cards/modal
- audio unlock
- theme bootstrap

## Riesgos encontrados

- Mobile strip pasó de grid 2-col a flex scroll horizontal (alineado con T6 mobile spec; chip click/scroll behavior sin cambios).

## Deuda técnica restante

- **T7:** empty/context copy review.
- **T8:** mobile/tablet alignment final.
- **T9:** deduplicar empty scanning markup en componente compartido.

## Validaciones ejecutadas

- `npx tsc --noEmit`: **pass** (exit 0)
- `npm run lint`: **no configurado** — `next lint` abre setup interactivo de ESLint; no se completó para evitar alterar configuración del proyecto
- `npm run build`: **compilación OK**, fallo intermitente en fase final de Next.js (`Collecting build traces` / `.nft.json` ENOENT en entorno local; no relacionado con cambios T6). Reintento tras limpiar `.next` generó las 19 páginas antes del error de traces.

## QA manual recomendado

Ver checklist T6 §17 (empty, kanban, desktop, mobile, no regresión).

## Próxima fase recomendada

**T7 — Empty State / Context Panel Copy Review**.
