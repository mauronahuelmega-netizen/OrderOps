# Admin Footer & Board Bottom Area Audit — B9.5

## Objetivo

Auditar la zona inferior del dashboard operacional (`/admin/dashboard`), clasificar cada bloque (remove/move/keep/conditional/replace) y proponer contrato para un futuro `AdminFooter` reusable — **sin implementar cambios**.

## Contexto

Referencias revisadas:

| Documento | Estado |
|-----------|--------|
| `board-orders-execution-area-phase-b8-6.md` | ✓ — persistent empty kanban + `emptyBoardHelper` |
| `board-orders-execution-area-phase-b9-final-qa.md` | ✓ |
| `board-orders-execution-area-phase-b9-1.md` | ✓ |
| `board-orders-execution-area-phase-b9-2.md` | ✓ |
| `board-orders-execution-area-phase-b9-4.md` | ✓ — cleanup lane nav aplicado |
| `board-orders-cleanup-audit.md` | ✗ no existe |
| `board-orders-execution-area-phase-b9-3.md` | ✗ no existe |
| `admin-dashboard-top-section-phase-d10.md` | ✓ |
| `admin-dashboard-toolbar-phase-t10.md` | ✓ (referencia toolbar/context deuda) |

Hipótesis inicial parcialmente confirmada: la franja *“Todavía no hay pedidos…”* es redundante con lanes empty del kanban persistente, pero **no es la única zona inferior** — debajo del board también vive el **Context Panel** cuando hay pedidos en scope.

## Archivos revisados

**Dashboard / board**

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/admin-dashboard-orders.module.css`
- `components/admin/orders/DashboardContextPanel.tsx`
- `components/admin/orders/DashboardKanbanBoard.tsx`
- `components/admin/orders/dashboard-kanban.module.css`
- `components/admin/orders/DashboardToolbar.tsx`
- `components/admin/orders/operational-summary-strip.tsx`
- `components/admin/orders/business-insights-strip.tsx`
- `components/admin/orders/operational-feed.tsx`
- `components/admin/orders/dashboard-analytics-surfaces.module.css`

**View models / analytics**

- `lib/orders/dashboard-board-view-model.ts`
- `lib/orders/analytics.ts`
- `lib/orders/business-insights.ts`
- `lib/orders/operational-summaries.ts`
- `lib/orders/operational-feed.ts`

**Admin shell / layout**

- `app/admin/(protected)/layout.tsx`
- `app/admin/(protected)/dashboard/page.tsx`
- `components/admin/admin-shell.tsx`
- `components/admin/admin-page-layout.tsx`
- `components/admin/layout/admin-sidebar.tsx`
- `app/admin/(protected)/products/page.tsx`, `settings/*`, `orders/[id]/page.tsx`, `categories/page.tsx`, `team/page.tsx`, `kitchen/page.tsx`

**Búsquedas ejecutadas:** strings de empty helper, context panel, footer, empty states — vía ripgrep en repo.

## Hallazgo principal

El dashboard tiene **dos zonas inferiores distintas**, no una sola:

```txt
┌─ Top: DashboardOverview / DashboardMobileOverview (KPIs)
├─ Execution: Toolbar + Kanban
├─ A) emptyBoardHelper     ← sólo sin pedidos + filter=all + sin búsqueda
└─ B) DashboardContextPanel ← cuando hay pedidos en scope operativo
```

La franja que el operador percibe como “footer del board” depende del estado:

| Estado | Debajo del kanban |
|--------|-------------------|
| Sin pedidos (global empty, filter=Todos) | Kanban vacío + **emptyBoardHelper** |
| Con pedidos | **Context Panel** (Resumen operativo, Insights, Actividad reciente) |
| Búsqueda/filtro sin resultados | Kanban “Sin resultados” + Context Panel variant `empty` |
| Legacy path (`filter≠all` + global empty) | Caja grande `renderOperationalEmptyState` (sin kanban) |

No existe hoy un `AdminFooter` global de página. El admin shell sólo tiene **sidebar footer** (usuario, theme toggle, logout).

## Origen del bloque inferior actual

### A — `emptyBoardHelper` (franja compacta con CTAs)

| Pregunta | Respuesta |
|----------|-----------|
| Componente | Función inline `renderCompactEmptyBoardHelper()` en `admin-dashboard-orders.tsx` |
| CSS | `.emptyBoardHelper*` en `admin-dashboard-orders.module.css`; botones vía `dashboard-analytics-surfaces.module.css` → `.emptyContextAction` |
| Condición | `shouldRenderPersistentEmptyKanban === true` dentro de `renderKanbanBoard()` |
| `renderMode` | Sigue siendo `operational-empty` o `day-scope-empty` (semántica); presentación usa kanban + helper |
| Session scope | Copy day-scope varía con `operationalWindow.source` vía `emptyBoardKind` |
| Con pedidos | **No se muestra** |
| Sin pedidos | **Sí**, si `activeFilter === "all"` y sin búsqueda |

Introducido en **B8.6** para no reemplazar el kanban persistente por una caja horizontal.

### B — `DashboardContextPanel`

| Pregunta | Respuesta |
|----------|-----------|
| Componente | `DashboardContextPanel.tsx` |
| CSS | `admin-dashboard-orders.module.css` → `.contextSection*`, `.contextPanelHeader*` |
| Condición | `shouldRenderContextPanel = renderMode !== "operational-empty" && renderMode !== "day-scope-empty"` |
| Con pedidos | **Sí** — variant `default`, strips completos |
| Sin pedidos global | **Oculto** |
| Search/filter empty | **Sí** — variant `empty`, hint “No hay métricas ni actividad para esta vista.” |

### C — Legacy `renderOperationalEmptyState`

| Pregunta | Respuesta |
|----------|-----------|
| Origen | Pre-B8.6 empty principal |
| Cuándo | `shouldRenderKanbanBoard === false` y `renderMode` operational/day-scope empty |
| Caso típico | Global empty con `activeFilter !== "all"` (edge) |
| CSS | `dashboard-analytics-surfaces.module.css` → `.emptyContext` |

## Condiciones de render (resumen)

```ts
shouldRenderPersistentEmptyKanban =
  activeFilter === "all" &&
  !hasSearchQuery &&
  (isOperationalEmpty || isDayScopeEmpty);

shouldRenderKanbanBoard =
  renderMode === "kanban" || shouldRenderPersistentEmptyKanban;

shouldRenderContextPanel =
  renderMode !== "operational-empty" &&
  renderMode !== "day-scope-empty";

shouldRenderFullContextPanel =
  shouldRenderContextPanel && contextPanelVariant === "default";
```

## Valor operacional actual

| Bloque | Clasificación | Justificación |
|--------|---------------|---------------|
| `emptyBoardHelper` copy | **CONDITIONAL** / tendencia **REMOVE** | Lanes ya dicen “Sin pedidos”; copy duplica mensaje de espera |
| CTAs Ver catálogo / Gestionar productos | **CONDITIONAL** | Onboarding útil sin productos/pedidos; no pertenecen a un footer SaaS genérico |
| `DashboardContextPanel` (con pedidos) | **KEEP** (corto plazo) | Métricas/feed filtrados por vista; no duplicados 1:1 en top section |
| Context panel en mobile | **CONDITIONAL** | Debajo del fold; compite con scroll operacional |
| Legacy `renderOperationalEmptyState` | **REMOVE** (futuro) | Duplica helper + kanban path; edge case filter≠all |
| Footer global admin | **REPLACE_WITH_ADMIN_FOOTER** (nuevo) | Marca/discreción post-contenido; no sustituto directo del context panel |

## Empty state / CTA analysis

**CTAs “Ver catálogo” / “Gestionar productos”**

| Aspecto | Evaluación |
|---------|------------|
| Naturaleza | Onboarding / navegación secundaria para negocio sin actividad |
| No son | Acciones operativas del turno |
| Rutas reales | `catalogHref` → `/b/[slug]/catalogo`; productos → `/admin/products` |
| Permisos | `catalogHref` nullable; `canManageProducts` gate |
| Duplicación | Aparecen en helper B8.6 y en legacy empty; mismos destinos |

**Recomendación B9.6 (no implementar ahora):**

- Mantener CTAs **sólo** cuando no hay pedidos en scope **y** (opcional) negocio sin productos activos.
- No mover CTAs al footer SaaS global — footer debe ser estático/discreto.
- Eliminar copy redundante del helper; conservar CTAs en helper mínimo o mover a empty lane único si se unifica copy.

## Context panel analysis

**¿Se renderiza?** Sí, cuando hay pedidos en ventana operativa (o filtered/search empty).

**Contenido:**

| Strip | aria-label / meta | Fuente datos |
|-------|-------------------|--------------|
| Resumen operativo | `OperationalSummaryStrip` | `buildOperationalSummaries(filteredOrders, …)` |
| Insights del negocio | `BusinessInsightsStrip` | `buildBusinessInsights(…)` |
| Actividad reciente | `OperationalFeed` | `buildOperationalFeed(…)` |

**Scope:** Usa `filteredOrders` (respeta filtro + búsqueda + ventana operativa). Top section (`DashboardOverview`) usa `visibleOperationalOrders` vía presenter — **no es duplicado exacto** cuando hay filtro activo.

**Breakpoints:**

- ≥720px: context grid 2 columnas en structure
- Tablet 768–1199: context 1 columna, border-top separador
- Mobile ≤768: context panel visible, compact padding; top overview oculto en CSS (`admin-orders-section--overview { display: none }`) — mobile KPIs van en `DashboardMobileOverview`

**Debajo del fold:** En operación activa con muchos pedidos, el context panel queda lejos del kanban — riesgo de baja lectura.

**Duplicación con top section:** Parcial en insights/métricas a nivel sesión cuando `filter=all` y sin búsqueda; **menor duplicación** con filtro/búsqueda activos.

**Recomendación:** No retirar en B9.6 sin QA. Fase **B9.6c — Context Panel Relocation** para colapsar, mover a drawer, o reducir a feed-only en mobile.

## Admin footer proposal

### Placement options

| Opción | Ubicación | Pros | Contras |
|--------|-----------|------|---------|
| **A** | `app/admin/(protected)/layout.tsx` | Global real | QA amplio; páginas con layout propio |
| **B** | Solo `admin-dashboard-orders.tsx` | Bajo riesgo | No reusable hasta rollout |
| **C** | `components/admin/layout/admin-footer.tsx` + import gradual | Reusable controlado | Requiere adopción por página |

**Recomendación B9.5:** **Opción C**, con pilot **Opción B** en dashboard (**B9.6a**), luego rollout en `AdminShell` o layout (**B9.6b**).

Excluir: `/admin/login`, `super-admin/*` (layout distinto).

### Recommended footer contract

```tsx
// components/admin/layout/admin-footer.tsx

export type AdminFooterProps = {
  /** Marca visible; default "OrderOps" */
  brand?: string;
  /** Subtítulo opcional; default copy operacional */
  tagline?: string;
  /** Links opcionales; sólo rutas verificadas */
  links?: Array<{
    label: string;
    href: string;
  }>;
  /** Variante visual */
  variant?: "default" | "compact";
  /** className extra por página */
  className?: string;
};

export default function AdminFooter(props: AdminFooterProps): JSX.Element;
```

**Reglas:**

- No sticky.
- `margin-top: auto` sólo si el page layout usa flex column full-height (evaluar en B9.6).
- Tokens existentes (`--text-tertiary`, `--border-subtle`); no theme global nuevo.
- Sin analytics/event tracking en v1.

### Recommended initial content

**Minimal (recomendado v1):**

```txt
OrderOps · Panel operacional
```

**Opcional tagline (texto estático, no link):**

```txt
Operación en tiempo real para negocios gastronómicos
```

**Links opcionales v1 (rutas reales verificadas):**

| Label | Ruta | Notas |
|-------|------|-------|
| Productos | `/admin/products` | Existe |
| Configuración | `/admin/settings/operations` | Existe |
| Catálogo público | `/b/[slug]/catalogo` | Sólo si `catalogHref` disponible — prop dinámica en dashboard pilot |

**No incluir (no existen rutas):** Soporte, Estado del sistema, Documentación externa.

## Responsive considerations

- Footer: una línea en desktop; stack en mobile ≤480px si hay links.
- `emptyBoardHelper`: ya stack en mobile (CSS B8.6).
- Context panel: mayor deuda en mobile — footer no debe empeorar scroll total.

## Light/dark considerations

- Footer: `color: var(--text-tertiary)`, borde superior sutil `var(--border-subtle)`.
- Hereda `data-dashboard-theme` en `<html>` vía sidebar toggle — sin lógica extra.
- No competir con lane accents ni context strips.

## Risks

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Quitar `emptyBoardHelper` elimina CTAs útiles para negocio nuevo | P1 | Mantener CTAs condicionales antes de remover copy |
| Footer global rompe páginas con scroll corto (products, settings) | P2 | Pilot dashboard; `variant="compact"` |
| Footer aumenta scroll en dashboard operacional | P2 | Footer discreto 1 línea; no sticky |
| Retirar context panel pierde métricas filtradas | P1 | B9.6c separado; no mezclar con footer |
| Unificar empty paths rompe edge `filter≠all` | P2 | QA matrix antes de remove legacy empty |

## Classification table

| Elemento | Origen | Estado recomendado | Motivo | Riesgo | Próxima acción |
|----------|--------|-------------------|--------|--------|----------------|
| `emptyBoardHelper` copy | B8.6 `renderCompactEmptyBoardHelper` | **CONDITIONAL** → **REMOVE** copy | Redundante con lanes “Sin pedidos” | Bajo | B9.6a: reducir a CTAs-only o eliminar |
| CTAs Ver catálogo / Gestionar productos | Mismo + legacy empty | **CONDITIONAL** | Onboarding sin pedidos | Medio si se quitan | Mantener gated; no en footer global |
| `DashboardContextPanel` | B3 `DashboardContextPanel` | **KEEP** | Métricas/feed por vista filtrada | Alto si se retira sin reemplazo | B9.6c relocation |
| Context panel variant `empty` | B3/B8 search empty | **KEEP** | Feedback “sin métricas para esta vista” | Bajo | Revisar copy only |
| Legacy `renderOperationalEmptyState` | Pre-B8.6 | **REMOVE** | Duplica kanban+helper path | Medio | B9.6a unificar empty paths |
| Sidebar footer (user/theme) | `admin-sidebar.tsx` | **KEEP** | Navegación global distinta | — | No confundir con AdminFooter |
| `AdminFooter` (nuevo) | — | **REPLACE_WITH_ADMIN_FOOTER** | Marca/discreción post-contenido | Bajo | B9.6a pilot |

## Recommended next phase

**B9.6a — Dashboard Footer Pilot & Empty Helper Cleanup** (primero)

1. Crear `AdminFooter` (Opción C) e integrar **sólo** en dashboard.
2. Decidir contrato final de `emptyBoardHelper`: remover copy redundante o bloque entero.
3. Unificar legacy `renderOperationalEmptyState` con persistent empty kanban donde sea seguro.
4. QA: empty global, day-scope empty, con pedidos, mobile/tablet.

Luego:

- **B9.6b — Admin Layout Footer Rollout** — `AdminShell` o layout protegido.
- **B9.6c — Context Panel Relocation / Collapse** — mobile + duplicación top section.

## Files likely touched by B9.6

| Fase | Archivos probables |
|------|-------------------|
| B9.6a | `components/admin/layout/admin-footer.tsx`, `admin-footer.module.css`, `admin-dashboard-orders.tsx`, `admin-dashboard-orders.module.css` |
| B9.6b | `components/admin/admin-shell.tsx`, `app/admin/(protected)/layout.tsx`, otras pages admin |
| B9.6c | `DashboardContextPanel.tsx`, `admin-dashboard-orders.module.css`, posible collapse component |

## What NOT to implement yet

- Footer con links inexistentes (soporte, docs, status page)
- Footer sticky
- Analytics / event tracking en footer
- Rediseño de todas las páginas admin en un solo PR
- Remoción del context panel sin QA
- Cambios en empty states de lanes sin contrato producto
- Confundir footer de página con footer sticky del manual order modal
- Tocar theme tokens / globals.css

## QA recommendations

**Desktop**

1. Sin pedidos, filter=Todos → kanban vacío + helper; confirmar si copy aporta vs lanes.
2. Con pedidos → context panel visible; footer pilot no debe tapar kanban scroll.
3. Search sin resultados → kanban + context empty variant.

**Tablet / mobile**

4. Helper stack + CTAs full width.
5. Context panel debajo del fold — medir si operador lo usa.
6. Footer pilot no debe competir con toolbar “Nuevo pedido”.

**Regresión**

7. Legacy empty (`filter≠all`, zero orders) si se unifica en B9.6a.
8. Review mode / last closed session empty copy.

---

*B9.5 — audit only. Sin modificaciones de código.*
