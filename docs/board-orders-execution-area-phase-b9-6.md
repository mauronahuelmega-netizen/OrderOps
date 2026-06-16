# Board / Orders Execution Area — Phase B9.6 — Dashboard Bottom Cleanup & Admin Footer Pilot

## Objetivo

Cerrar visualmente el dashboard operativo para V1.0 eliminando redundancias debajo del kanban y agregando un footer admin discreto en modo pilot (sólo `/admin/dashboard`).

## Contexto

Referencias revisadas:

| Documento | Estado |
|-----------|--------|
| `admin-footer-board-bottom-area-audit.md` | ✓ — audit B9.5 |
| `board-orders-execution-area-phase-b9-final-qa.md` | ✓ |
| `board-orders-execution-area-phase-b9-2.md` | ✓ |
| `board-orders-execution-area-phase-b9-4.md` | ✓ |

B9.5 identificó dos zonas inferiores distintas debajo del kanban:

1. **`emptyBoardHelper`** — mensaje + CTAs cuando no hay pedidos (filter=Todos, sin búsqueda).
2. **`DashboardContextPanel`** — resumen operativo, insights y actividad reciente cuando hay pedidos en scope.

## Decisión producto

Para V1.0 se prioriza una experiencia operacional limpia:

**KPIs + Toolbar + Kanban + Footer.** El onboarding se resolverá manualmente por Activación Operacional.

- Remover ambas capas del dashboard operativo.
- No trasladar CTAs al footer.
- Crear `AdminFooter` reusable como pilot en dashboard únicamente.
- No rollout global todavía.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/admin-dashboard-orders.module.css`

## Archivos creados

- `components/admin/layout/admin-footer.tsx`
- `components/admin/layout/admin-footer.module.css`
- `docs/board-orders-execution-area-phase-b9-6.md`

## Bloques removidos del dashboard

- `emptyBoardHelper` (`renderCompactEmptyBoardHelper`)
- CTAs inferiores **Ver catálogo** / **Gestionar productos** (helper inferior)
- `DashboardContextPanel` debajo del kanban

## AdminFooter creado

Componente reusable en `components/admin/layout/admin-footer.tsx`:

- Props: `brand`, `tagline`, `links`, `variant`, `className`
- Default: `OrderOps · Panel operacional`
- Sin links por defecto
- No sticky; estilo discreto con tokens existentes (`--border-subtle`, `--text-tertiary`, `--space-*`)

## Ubicación del pilot

`<AdminFooter className={styles.dashboardFooter} variant="compact" />` al final de la sección execution en `admin-dashboard-orders.tsx`, después del kanban.

**No** importado en `layout.tsx`, `admin-shell.tsx` ni sidebar.

## Empty state behavior

- Kanban persistente preservado (`shouldRenderPersistentEmptyKanban`).
- Lanes empty: **Sin pedidos** (board vacío) / **Sin resultados** (búsqueda sin matches).
- Helper inferior removido; el board vacío ya comunica el estado vía lanes.

## Context panel decision

Se retira del dashboard operativo V1.0 para evitar redundancia con KPIs/top section y mantener foco en kanban. Los componentes/helpers se mantienen sólo si no es safe delete todavía:

- `DashboardContextPanel.tsx` — conservado (sin render en dashboard)
- Builders (`buildOperationalSummaries`, `buildBusinessInsights`, `buildOperationalFeed`, etc.) — conservados en lib; wiring local removido del dashboard
- CSS `.contextSection*` — conservado porque `DashboardContextPanel` aún lo referencia

## CTAs decision

No se trasladan al footer. Sus destinos siguen existiendo en navegación/pantallas dedicadas. Onboarding será por Activación Operacional.

**Nota:** `renderOperationalEmptyState()` (legacy path `filter≠all` + global empty) conserva CTAs catálogo/productos — deuda documentada, no tocado en B9.6.

## Qué se preservó

- top KPIs
- toolbar/session controls
- Nuevo pedido
- search
- kanban persistente
- lane empty states
- tablet 2 columnas
- mobile stacked
- mobile filter compacto
- scroll chaining B9.1
- manual order flow
- realtime/hydration

## Qué NO se cambió

- DB/schema
- server actions
- realtime
- hydration
- optimistic callbacks
- orders logic
- session logic
- manual order modal
- toolbar behavior
- cards behavior
- checkout público
- theme tokens/global CSS

## Riesgos encontrados

- `DashboardContextPanel` y CSS asociado quedan huérfanos de render — cleanup seguro en fase posterior (B9.6c).
- `renderOperationalEmptyState` mantiene CTAs en edge case legacy — inconsistencia menor hasta eliminación futura.
- Footer pilot sólo en dashboard; otras pantallas admin siguen sin footer de página.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass — compilación OK; dashboard 37.6 kB |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` (pre-existentes) |

## QA manual recomendado

### Desktop

1. Abrir `/admin/dashboard`.
2. Confirmar top KPIs, toolbar y kanban visibles.
3. Confirmar **no** aparecen: helper “Todavía no hay pedidos…”, CTAs inferiores, Resumen de la vista, Resumen operativo, Insights del negocio, Actividad reciente.
4. Confirmar footer: `OrderOps · Panel operacional`.
5. Footer no sticky; no compite con kanban.

### Empty board

6. Con cero pedidos: lanes **Sin pedidos**; sin helper inferior.

### With orders

7. Cards visibles; sin context panel.

### Tablet/mobile

8. Tablet 2 columnas; mobile stacked; footer adaptado; filtro compacto mobile visible.

### Manual order

9. Nuevo pedido abre modal; pedido aparece en Pendientes.

**Estado:** pendiente (no ejecutado en esta sesión).

## Deuda técnica restante

- Eliminar o reubicar `DashboardContextPanel` y builders huérfanos (B9.6c).
- Simplificar/eliminar `renderOperationalEmptyState` cuando legacy path esté cubierto.
- Rollout global `AdminFooter` tras QA (B9.6b).
- CSS `.contextSection*` en `admin-dashboard-orders.module.css` compartido con componente huérfano.

## Próxima fase recomendada

**B9.6b — Admin Layout Footer Rollout** (después de staging QA) o **B9.6c — Context Panel Relocation/Cleanup**.
