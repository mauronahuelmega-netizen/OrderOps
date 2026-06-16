# Board / Orders Execution Area — Phase B8 — Tokens / Accessibility / Performance

## Objetivo

Cerrar el polish técnico del Board en tokens/CSS local, accesibilidad (teclado, semántica, focus) y performance/render hygiene — **sin cambiar UX funcional ni lógica operativa**.

## Contexto

- **B1–B7** cerraron contrato, view model, empty/context, lanes IA, cards, realtime hardening y responsive.
- **B8** prepara el Board para **B9 Final QA** con cambios seguros y localizados.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/admin-dashboard-orders.tsx` | Skip context metrics cuando panel no es full; `EMPTY_LANE_NAVIGATION_MODEL`; keyboard guard |
| `components/admin/orders/order-card.tsx` | `<article role="button">`; keyboard target guard |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Tipo keyboard `HTMLElement` |
| `components/admin/orders/lane-navigation-scanning.tsx` | `<nav>`; `aria-current`; `aria-label` por lane |
| `components/admin/orders/DashboardContextPanel.tsx` | `aria-labelledby` + `useId` en título |
| `lib/orders/lane-navigation-scanning.ts` | `EMPTY_LANE_NAVIGATION_MODEL`; removidas constantes empty muertas |
| `components/admin/orders/dashboard-filters.module.css` | Tokenización local + `focus-visible` |
| `components/admin/orders/dashboard-analytics-surfaces.module.css` | Tokens kpi/empty + `focus-visible` CTAs |
| `components/admin/orders/dashboard-kanban.module.css` | `var(--shadow-sm)` en lanes |
| `components/admin/orders/order-card.module.css` | Focus ring con accent token |
| `components/admin/orders/order-card-quick-actions.module.css` | Media query duplicada consolidada |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8.md` | Este documento |

## Cambios aplicados

1. **Token cleanup** — Filtros, empty states y kpi cards migrados a tokens existentes; focus-visible en triggers/filtros/CTAs.
2. **Card accessibility** — Wrapper semántico `<article>`; Enter/Space solo cuando el foco está en la card (no en botones internos); focus ring mejorado.
3. **Flow nav accessibility** — `<nav aria-labelledby>`; `aria-current="true"` en lane activa; `aria-label` descriptivo por chip (label + count + dominance).
4. **Context panel accessibility** — `aria-labelledby` enlazado al `<h2>` vía `useId`.
5. **Performance** — `shouldRenderFullContextPanel` evita summaries/insights/feed/recentActivity/dashboardInsights cuando el panel está en variant `empty` o no se renderiza.
6. **Lane nav model** — Usa `EMPTY_LANE_NAVIGATION_MODEL` exportado cuando `shouldRenderFlowNavigation` es false.
7. **Dead code** — Removidas `LANE_NAVIGATION_EMPTY_*` sin uso runtime.

## Tokens / CSS cleanup

| Archivo | Antes | Después |
|---------|-------|---------|
| `dashboard-filters.module.css` | rgba/hex legacy en triggers, filtros, empty | `var(--border-subtle/strong)`, `var(--bg-surface*)`, `var(--text-*)`, `var(--shadow-sm)` |
| `dashboard-analytics-surfaces.module.css` | rgba en kpiCard border | `var(--border-subtle)` |
| `dashboard-kanban.module.css` | box-shadow rgba hardcoded | `var(--shadow-sm)` |
| `order-card.module.css` | focus outline `--text-primary` | accent color-mix |

**Diferido (B):** sombras fallback en `order-card` (`var(--shadow-sm, rgba...)`) — fallback tolerado sin nuevo hex.

## Accessibility improvements

- Focus-visible consistente en filtros, empty CTAs, cards y lane nav (CSS existente en lane nav preservado).
- Empty operational mantiene `aria-live="polite"` (B3).
- Context empty hint mantiene `aria-live="polite"`.

## Card accessibility

- Patrón preservado: `<article role="button" tabIndex={0}>` con quick actions como `<button>` internos.
- `handleCardKeyDown` y handler local verifican `event.target === event.currentTarget` antes de abrir modal.
- Quick actions wrapper ya tenía `stopPropagation` en click/keydown (B5).

## Flow navigation accessibility

- Landmarks: `<nav aria-labelledby={headerLabelId}>`.
- Estado activo: `aria-current="true"` (reemplaza `aria-pressed`).
- Cada chip: `aria-label="{label}, {count} pedido(s), {dominanceLabel}"`.
- `type="button"` preservado; click/IntersectionObserver sin cambios.

## Context / empty accessibility

- Context panel: `section aria-labelledby={titleId}` + `h2 id={titleId}`.
- Filtered empty y operational empty: copy y live regions sin cambio funcional.

## Performance improvements

```txt
shouldRenderFullContextPanel =
  shouldRenderContextPanel && contextPanelVariant === "default"
```

Cuando false, retorna arrays vacíos / analytics mínimos sin construir:
- `operationalSummaries`
- `businessInsights`
- `operationalFeedItems`
- `operationalDashboardInsights`
- `recentActivity`

**Preservado siempre:**
- `operationalMetrics` (modal, lane metrics, risk)
- `orderRiskAssessments` (cards, lane metrics)
- `groupedLaneMetrics` / `filteredLaneMetrics`

Lane navigation usa `EMPTY_LANE_NAVIGATION_MODEL` cuando flow nav no se renderiza.

## Deferred performance decisions

| Tema | Decisión B8 |
|------|-------------|
| Search debounce / URL | Documentado — fuera de scope; UX unchanged |
| `useDeferredValue` | No introducido |
| Virtualización kanban | Solo auditoría — no implementada |
| Risk recompute en keystroke | Memoizado vía view model + `useMemo`; scoring sin mover |
| Image optimization | DEVX-3 / post-board |

## Dead code cleanup

- Removidas exportaciones `LANE_NAVIGATION_EMPTY_ARIA_LABEL`, `LANE_NAVIGATION_EMPTY_STATUS_LABEL`, `LANE_NAVIGATION_EMPTY_HINT_LABEL`.
- Consolidada media query duplicada en `order-card-quick-actions.module.css` (720–1023px).
- Variant `compact` del context panel **preservado** (API reservada, no cableada en dashboard).

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Search/filter igual.
- Lanes IA igual.
- Context panel data igual cuando variant `default`.
- Empty logic igual.
- Toolbar/top section/modal iguales.

## Qué NO se cambió

- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- route JSON
- toolbar
- top section
- modal/detail
- card data
- quick action behavior
- status/assignment logic
- completed/cancelled behavior
- image optimization / no-img-element
- hooks de realtime/reconciliation
- `app/theme-tokens.css` / `app/globals.css`

## Compatibilidad con B1/B2/B3/B4/B5/B6/B7

| Fase | B8 |
|------|-----|
| B2 view model | Sin alterar derivaciones |
| B3 empty/context | Performance guard sobre mismas ramas `renderMode` |
| B4 flow nav | Solo a11y/CSS; visibilidad intacta |
| B5 cards | Semántica + keyboard guard |
| B6 reconciliation | Sin tocar |
| B7 responsive | CSS tokens compatibles |

## Riesgos encontrados

- Tokenización de filtros puede shift visual leve vs legacy warm rgba — aceptable para consistencia.
- `buildAdminOrdersAnalytics([])` aún se invoca cuando context panel no es full (barato vs summaries/feed).
- `aria-current` en flow nav reemplaza `aria-pressed` — semánticamente más correcto para navegación por secciones.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass — Compiled successfully |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` |

## QA manual recomendado

### Accessibility

1. Tab por flow nav, cards, quick actions, Ver pedido.
2. Focus-visible claro.
3. Enter/Space en card abre modal; no desde botones internos.
4. Flow nav anuncia lane/count; lane activa con `aria-current`.
5. Context panel heading/scope claro.

### Visual/token

6. Desktop 1366+, iPad Mini, Galaxy A51 — sin restyle agresivo.

### Performance behavior

7. Search/filtros/modal/sync/realtime — sin loops ni reset.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- QA manual accesibilidad + visual.
- Search debounce (DEVX / post-board).
- Virtualización kanban (evaluar en B9+).
- Variant `compact` context panel sin cablear.
- 16 warnings `no-img-element` — DEVX-3.
- Semántica ideal: card como región clickeable separada de acciones (patrón actual es compromiso válido con nested buttons).

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
