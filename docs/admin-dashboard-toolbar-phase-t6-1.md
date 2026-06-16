# Admin Dashboard Toolbar Phase T6.1 — Execution Toolbar Width Alignment Fix

## Objetivo

Corregir la alineación visual del bloque de ejecución para que toolbar, `Estados del flujo` y empty/result inmediato compartan el mismo content rail horizontal, sin cambiar comportamiento ni copy.

## Contexto

Post-T6 QA detectó que el toolbar se veía más compactado/angosto que `Estados del flujo` y el empty state. T3–T5 habían introducido padding interno en `.toolbar`; T6 añadió borde superior en lane nav. T6.1 alinea rails con fix CSS quirúrgico.

## Archivos modificados

- `components/admin/orders/dashboard-toolbar.module.css`
- `components/admin/orders/admin-dashboard-orders.module.css`
- `components/admin/orders/lane-navigation-scanning.module.css`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t6-1.md`

## Problema detectado en QA

El toolbar parecía “encajonado” respecto al contenido superior/inferior del bloque de ejecución: bordes izquierdo/derecho no coincidían con empty context ni con la franja `Estados del flujo`.

## Root cause visual

Combinación de:

1. **Padding horizontal extra en `.toolbar`** (`padding-inline: var(--space-lg)` / `var(--space-md)` mobile) mientras `admin-orders-execution-flow`, lane nav y empty context ocupan el rail completo del section wrapper sin ese inset.
2. **`.filtersWrapper` sin `width: 100%` / `justify-self: stretch`** en desktop grid, lo que reforzaba la sensación de grupo angosto en la columna izquierda de `.controlRow`.
3. **Wrappers de execution** sin `width: 100%` / `max-width: none` explícitos en chrome/controls/flow (heredaban bien en teoría, pero no garantizaban el mismo rail que siblings).

No hubo `width: fit-content` en el toolbar principal (sólo en `.syncButton`, aislado y correcto).

## Cambio principal

Eliminar padding horizontal del toolbar y forzar stretch del rail en wrappers de execution + filtros + lane nav.

## CSS aplicado

### `dashboard-toolbar.module.css`

- `.toolbar`: `padding-inline: 0`, `max-width: none`, `padding-block` vertical only.
- `.filtersWrapper`: `width: 100%`, `justify-self: stretch`, `box-sizing: border-box`.
- Desktop `.controlRow` / `.filtersWrapper`: stretch explícito en grid.
- Mobile: mismo `padding-inline: 0` (preserva layout T5/T6, sin rediseño).

### `admin-dashboard-orders.module.css`

- `.dashboardExecutionSection`, `.dashboardExecutionChrome`, `.admin-orders-controls`, `.admin-orders-execution-flow`: `width: 100%`, `max-width: none`, `min-width: 0`.

### `lane-navigation-scanning.module.css`

- `.admin-orders-lane-nav`: `max-width: none`, `padding-inline: 0`, `box-sizing: border-box`.
- Variante `--empty`: `padding-inline: 0`.

## Desktop alignment

Toolbar, filtros, search (max-width local 360px), session cluster, lane nav y empty context comparten el borde horizontal del execution section. Search sigue `justify-self: end` sin achicar el toolbar global.

## Estados del flujo alignment

Borde superior y contenido alineados al mismo rail que toolbar; sin inset horizontal adicional.

## Mobile/tablet preservation

- Sin rediseño mobile.
- `padding-inline: 0` también en mobile para consistencia con execution flow.
- Scroll horizontal de filtros/chips preservado.

## Qué se preservó

- search behavior
- filter URL sync
- session controls T4
- sync behavior
- scanning behavior
- empty/context behavior
- top section
- lanes/cards/modal

## Qué NO se tocó

- copy T7
- dead code cleanup T9
- search parser
- filters logic
- realtime internals
- server actions
- DB/Supabase
- order cards/modal internals
- audio unlock
- theme bootstrap
- TSX / handlers

## Comportamiento preservado

Sin cambios en handlers, condiciones de render, IntersectionObserver, scroll-to-lane, URL sync ni session sync.

## Riesgos encontrados

- Si el page layout padre agrega padding horizontal al execution section en el futuro, toolbar y flow seguirán alineados entre sí (ambos sin padding propio).

## Deuda técnica restante

- **T7:** empty/context copy.
- **T8:** mobile/tablet alignment final si hace falta padding de page rail unificado.
- **T9:** cleanup markup duplicado empty scanning.

## Validaciones ejecutadas

- `npx tsc --noEmit`: **pass** (exit 0)
- `npm run lint`: **no configurado** — `next lint` abre setup interactivo de ESLint; no se completó para evitar alterar configuración del proyecto
- `npm run build`: **pass** tras limpiar `.next` (compile + types + 19 páginas). Primer intento falló intermitente en `Collecting page data` (`PageNotFoundError` /admin/kitchen); no relacionado con T6.1

## QA manual recomendado

Ver checklist T6.1 §16 (desktop rail, mobile overflow, funcional no regresión).

## Próxima fase recomendada

**T7 — Empty State / Context Panel Copy Review**.
