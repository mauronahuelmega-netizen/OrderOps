# Admin Dashboard Toolbar Phase T5 — Search / Filter UX Polish

## Objetivo

Pulir UX, copy, accesibilidad y polish visual de search + filtros rápidos del toolbar, sin alterar parser, semántica de filtros ni comportamiento instantáneo.

## Contexto

- **T1** congeló copy de búsqueda con acentos, filtros `all|pending|…|pickup`, search instantáneo client-side.
- **T3** layout desktop (search fila 1, filtros fila 2).
- **T4** session cluster intacto.
- **T5** mejora affordance operacional de search y tabs.

## Archivos modificados

- `components/admin/orders/operational-search.tsx`
- `components/admin/orders/operational-search.module.css`
- `components/admin/orders/DashboardToolbar.tsx`
- `components/admin/orders/dashboard-toolbar.module.css`
- `lib/orders/dashboard-execution-view-model.ts`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t5.md`

## Cambio principal

Copy de search centralizado en el view model; input con icono `Search` (lucide), focus premium y clear accesible; grupo de filtros con contenedor visual y active/focus polish.

## Search copy aplicado

| Elemento | Copy |
|----------|------|
| Placeholder | `Buscar por cliente, estado o situación...` |
| Input aria | `Buscar por cliente, estado o situación` |
| Section aria | `Búsqueda operacional` |
| Clear visible | `Limpiar` |
| Clear aria | `Limpiar búsqueda` |

Corregidos: `situacion` → `situación`, `Busqueda` → `Búsqueda`, `busqueda` → `búsqueda`.

## Search visual polish

- Shell con borde tokenizado, `focus-within` con `--accent-primary`.
- Altura alineada a controles del toolbar (`min-height: 2.25rem`).
- Icono `Search` a la izquierda con padding compensado.
- Chips con wrap, `max-width: 100%`, gap tokenizado.

## Search icon / clear behavior

- `Search` de `lucide-react` (size 16), `aria-hidden`.
- Clear visible solo con query; handler `onChange("")` sin cambios.
- Clear con `focus-visible` y spacing que no superpone texto.

## Filter tabs polish

- `.filtersWrapper` con borde/fondo suave agrupando tabs.
- `.filterButtonActive` refuerza estado activo (inset shadow).
- `focus-visible` en botones de filtro.
- Labels e IDs sin cambios; `role="group"` + `aria-pressed` preservados.

## Accessibility improvements

- Aria labels con acentos desde view model.
- `filtersAriaLabel`: `Filtros de pedidos`.
- Search section/input/clear con labels explícitos.
- No conversión a `tablist` (button group baseline T1).

## Mobile/tablet preservation

- Search full-width; icon padding ajustado en breakpoints.
- Filtros con scroll horizontal y scrollbar oculto.
- Clear accesible en mobile; chips wrap.
- Layout T3/T4 sin mover session cluster.

## Qué se preservó

- search parser (`natural-search.ts` intacto)
- instant search behavior (sin debounce)
- filter IDs
- filter URL sync (container sin cambios)
- session controls T4
- sync behavior
- scanning behavior
- empty/context behavior
- top section

## Qué NO se tocó

- `natural-search.ts`
- debounce
- scanning copy T6
- empty/context copy T7
- dead code cleanup T9
- realtime internals
- server actions
- DB/Supabase
- order cards/modal
- audio unlock
- theme bootstrap
- `admin-dashboard-orders.tsx`

## Comportamiento preservado

- Parser y chips derivados sin cambios.
- Filtros siguen llamando `onFilterSelect` con mismos IDs.
- Search sigue siendo controlado instantáneo desde container.

## Riesgos encontrados

- `OperationalSearch` importa constantes del view model para defaults; otros consumidores futuros heredan copy T1 automáticamente.

## Deuda técnica restante

- **T6:** scanning copy integration.
- **T7:** empty/context copy.
- **T8:** mobile/tablet alignment final.
- **T9:** dead code cleanup.
- Debounce diferido salvo profiling demuestre necesidad.

## Validaciones ejecutadas

- `npx tsc --noEmit`: **pass** (exit 0)
- `npm run lint`: **no configurado** — `next lint` abre setup interactivo de ESLint; no se completó para evitar alterar configuración del proyecto
- `npm run build`: **pass** (Next.js 15.3.0, compiled successfully)

## QA manual recomendado

Ver checklist T5 §19 (search, filters, desktop, mobile, no regresión).

## Próxima fase recomendada

**T6 — Scanning Operacional Integration**.
