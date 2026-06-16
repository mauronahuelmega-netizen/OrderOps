# Admin Dashboard Toolbar Phase T3 — Desktop Layout Consolidation

## Objetivo

Consolidar el layout desktop del **Dashboard Execution Toolbar** en una unidad visual de consola operacional (dos filas lógicas), sin alterar comportamiento, copy visible de fases futuras ni semántica funcional.

## Contexto

- **T0** auditó el toolbar disperso (search flotante, scope en fila separada, session controls desconectados).
- **T1** congeló el contrato desktop: fila 1 título+scope + search; fila 2 filtros + session controls.
- **T2** estableció la frontera `viewModel` + handlers.
- **T3** reordena DOM/CSS para cumplir el contrato visual desktop, preservando mobile D10.

## Archivos modificados

- `components/admin/orders/DashboardToolbar.tsx`
- `components/admin/orders/dashboard-toolbar.module.css`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t3.md`

## Cambio principal

El toolbar deja de renderizarse como bloques sueltos (`topRow` + `filtersWrapper` + `scopeRow` separado) y pasa a una **única sección** con dos filas:

1. **primaryRow:** `titleCluster` (título + scope) + `searchCluster`
2. **controlRow:** `filtersWrapper` + `sessionCluster` (condicional)

El error de sesión queda dentro del mismo contenedor, ancho completo.

## Desktop layout aplicado

En `min-width: 769px`:

```txt
┌──────────────────────────────────────────────────────────────┐
│ Pedidos en curso + scope                         [ Search ]  │
│ [Todos][Pendientes][...]              sesión + refresh       │
└──────────────────────────────────────────────────────────────┘
```

- Grid fila 1: `minmax(0, 1fr) minmax(280px, 360px)`
- Grid fila 2: `minmax(0, 1fr) auto`
- Search alineado a la derecha, ancho útil hasta 360px
- Session cluster alineado a la derecha con wrap controlado

## DOM / wrappers agregados

| Clase | Rol |
|-------|-----|
| `.toolbar` | Contenedor único (antes split toolbar + scopeRow) |
| `.primaryRow` | Fila 1 título/scope + search |
| `.titleCluster` | Agrupa título y scope operacional |
| `.searchCluster` | Wrapper de `OperationalSearch` |
| `.controlRow` | Fila 2 filtros + sesión |
| `.sessionCluster` | Agrupa status + abrir/cerrar + refresh (antes `.sessionControls` en `.scopeRow`) |

Eliminados como bloques separados: `.topRow`, `.scopeRow`, `.searchWrapper`, `.sessionControls`.

## CSS aplicado

- Tokens `--space-*`, `--text-*`, `--bg-canvas` (sin hex nuevos; fallback de error usa token existente).
- Desktop grid en `.primaryRow` y `.controlRow`.
- Tablet `769–1024px`: search max 320px, control row con `align-items: start` y wrap de sesión.
- Mobile `≤768px`: columnas apiladas, search full-width, tabs con scroll horizontal, session cluster full-width.

## Mobile/tablet preservation

- Search full-width en mobile.
- Filtros con overflow-x y scrollbar oculto.
- Session controls apilados/legibles sin overflow horizontal.
- Padding mobile con `--space-md`.
- No se modificó `admin-dashboard-orders.module.css` ni top section D10.

## Qué se preservó

- search behavior
- filter URL sync
- filter IDs
- session open/close behavior
- manual session hydration behavior
- current visible copy (`Negocio abierto`, `Actualizar sesión`, etc.)
- scanning behavior
- empty states
- context panel
- top section

## Qué NO se tocó

- copy T4/T5/T6/T7
- refresh lucide migration
- dead code cleanup
- realtime internals
- server actions
- DB/Supabase
- order cards/modal
- audio unlock
- theme bootstrap
- `admin-dashboard-orders.tsx`
- `dashboard-execution-view-model.ts`
- `operational-search.tsx`

## Comportamiento preservado

- Mismos handlers y condiciones de render del view model T2.
- Mismos labels, variants de botones, aria-labels de scope/sync y filtros.
- Refresh inline SVG sin cambios.
- Sin duplicación del scope label.

## Riesgos encontrados

- Consolidar `scopeRow` en `titleCluster` cambia ubicación visual del scope en desktop (intencional T3); en mobile el scope queda bajo el título en la misma columna.
- Un solo contenedor `.toolbar` concentra padding antes repartido entre toolbar y scopeRow; compensado con padding uniforme en `.toolbar`.

## Deuda técnica restante

- **T4:** session controls polish + copy (`Sincronizar sesión`, etc.) + lucide refresh.
- **T5:** search/filter UX polish.
- **T6:** scanning integration.
- **T7:** empty/context copy.
- **T9:** dead code filter panel cleanup.

## Validaciones ejecutadas

- `npx tsc --noEmit`: **pass** (exit 0)
- `npm run lint`: **no configurado** — `next lint` abre setup interactivo de ESLint; no se completó para evitar alterar configuración del proyecto
- `npm run build`: **pass** (Next.js 15.3.0, compiled successfully)

## QA manual recomendado

### Desktop 1366+

1. Toolbar se ve como unidad.
2. `Pedidos en curso` alineado con search.
3. Search no flota demasiado chico.
4. Tabs alineados debajo del título.
5. Session controls agrupados a la derecha.
6. Refresh/resync visible e integrado.
7. Sin overflow horizontal.

### Desktop wide 1440–1920

8. Sin dispersión excesiva.
9. Search mantiene ancho útil.
10. Session controls no se separan demasiado.

### Tablet 769–1024

11. Grid estable.
12. Search no empuja controles fuera.
13. Session controls wrap sin romper.

### Mobile ≤768

14. Search full-width.
15. Tabs scroll horizontal.
16. Session controls legibles.
17. Sin overflow horizontal.
18. D10 containment preservado.

### Funcional

19–27. Search, tabs/URL, refresh, sesión, scanning, empty/context, top section, lanes/cards, modal sin regresión.

## Próxima fase recomendada

**T4 — Session Controls Polish** (copy contract + refresh icon lucide), sobre el layout consolidado de T3.
