# Board / Orders Execution Area — Phase B7 — Mobile / Tablet Board UX

## Objetivo

Optimizar la experiencia responsive del Board de pedidos para uso real en mobile (≤767px), tablet portrait/landscape (768–1199px) y preservar desktop (≥1200px), **sin alterar lógica funcional ni arquitectura de datos**.

## Contexto

- **B1–B6** cerraron contrato, view model, empty/context, lanes IA, card polish y hardening realtime/hydration/optimistic.
- **B7** aplica el contrato responsive acordado: kanban vertical en mobile, densidad tablet, flow nav táctil, context panel secundario, empty states y cards pulidos — mayormente CSS.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/dashboard-kanban.module.css` | Stack vertical mobile; tablet clamp; desktop explícito |
| `components/admin/orders/lane-navigation-scanning.module.css` | Rail compacto; touch targets ≥40px; tablet horizontal scroll |
| `components/admin/orders/admin-dashboard-orders.module.css` | Context panel responsive; empty execution padding mobile |
| `components/admin/orders/order-card.module.css` | Timeline compacto; chips overflow; footer mobile |
| `components/admin/orders/order-card-quick-actions.module.css` | Touch targets 2.5rem en viewport ≤389px |
| `components/admin/orders/dashboard-filters.module.css` | Filtered empty mobile legible |
| `components/admin/orders/dashboard-analytics-surfaces.module.css` | Empty context CTAs táctiles mobile |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b7.md` | Este documento |

## Cambios aplicados

1. **Mobile kanban vertical stack** — `.boardWrapper` pasa a `flex-direction: column`, sin `overflow-x` principal; lanes `width: 100%`, `min-width: 0`.
2. **Tablet kanban density** — lanes con `min-width: clamp(17rem, 42vw, 22rem)`, scroll horizontal con `scroll-snap-type: x proximity`, gaps/padding reducidos.
3. **Flow navigation responsive** — rail horizontal compacto en mobile/tablet; items `min-height: 2.5rem` (mobile) / `2.25rem` (tablet); overflow-x suave sin scrollbar visible.
4. **Context panel responsive** — mobile: secundario, borde superior, tipografía compacta, una columna; tablet 768–1199: una columna de strips, margen asociado al board.
5. **Empty states mobile** — filtered empty y operational empty con padding/tipografía/CTAs táctiles.
6. **Card mobile polish** — timeline más bajo, badges con `max-width: 100%`, footer wrap preservado.
7. **Touch targets** — quick actions y empty CTAs ≥2.5rem en mobile; flow nav chips ≥2.5rem.

## Mobile kanban behavior

```txt
@media (max-width: 767px)
├─ .boardWrapper: column, overflow-x/y visible, min-height 0
├─ .lane: width 100%, min-width 0, overflow visible
├─ .laneBody: sin max-height forzado, overflow-y visible
└─ Sin scroll horizontal del board como navegación principal
```

Cards ya eran `width: 100%` vía `.link`; lanes apilan en orden de `groupedOrders` sin cambiar grouping.

## Tablet kanban behavior

```txt
@media (min-width: 768px) and (max-width: 1199px)
├─ Kanban horizontal con scroll cómodo
├─ .lane: min-width clamp(17rem, 42vw, 22rem)
├─ scroll-snap proximity en boardWrapper
└─ completed/cancelled secondary siguen visibles (opacity sin cambio)
```

## Flow navigation responsive

- Mobile: strip flex nowrap, scroll horizontal, items 6.75rem × 2.5rem mínimo.
- Tablet 768–1199: mismo patrón de rail horizontal con targets 2.25rem.
- Desktop ≥1200: grid `auto-fit` preservado (sin regresión).
- Click behavior, IntersectionObserver, `scrollIntoView`, labels y `laneKind` B4 intactos.

## Context panel responsive

- Desktop ≥1024: columnas context 3 (sin cambio).
- Tablet 768–1199: `--admin-orders-context-columns: minmax(0, 1fr)` — strips apilados.
- Mobile ≤767: margen/borde superior, títulos más compactos, hint empty reducido.
- Data source, title, scope label, strips logic y variant `empty` sin cambio.

## Empty states responsive

- `emptyContext` (operational empty): CTAs `min-height: 2.5rem`, copy centrado legible.
- `admin-orders-filter-empty`: `min-height: auto`, padding 1rem, texto centrado.
- Global/day-scope empty sigue sin flow nav (lógica B3/B4 preservada).

## Card mobile adjustments

- Padding/gap ligeramente reducidos (B5 base + B7 timeline/header).
- Quick actions primary 2.75rem, secondary/whatsapp 2.5rem (incl. ≤389px).
- Ver pedido `min-height: 2.5rem`.

## Touch targets / accessibility

| Elemento | Mobile target |
|----------|---------------|
| Flow nav items | ≥2.5rem altura |
| Quick actions primary | 2.75rem |
| Quick actions secondary | 2.5rem |
| Empty CTAs | 2.5rem |
| Ver pedido | 2.5rem |
| Focus-visible | Preservado en nav y cards |

Semántica `div role=button` en card queda para B8.

## CSS adjustments

Breakpoints usados:

| Rango | Rol |
|-------|-----|
| ≤767px | Mobile |
| 768–1199px | Tablet |
| ≥1200px | Desktop (lane min-width 320px explícito) |
| ≤389px | Micro breakpoint chips (flow nav, card header) |

Tokens existentes únicamente (`--bg-surface`, `--border-subtle`, etc.). Sin nuevos hex ni cambios globales.

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Search/filter igual.
- Lanes IA igual.
- Context panel data igual.
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
- `DeliveryWorkflowLanes` / `PriorityRiskLanes`
- hooks, view model logic, reconciliation helpers
- TSX (sin cambios — CSS-only)

## Compatibilidad con B1/B2/B3/B4/B5/B6

| Fase | Compatibilidad B7 |
|------|-------------------|
| B2 view model | Sin tocar derivaciones |
| B3 empty/context | Layout responsive sobre mismas ramas `renderMode` |
| B4 flow nav / lanes IA | Solo CSS del rail; `shouldRenderFlowNavigation` intacto |
| B5 card polish | Ajustes mobile adicionales en CSS |
| B6 reconciliation | Sin cambios |

## Riesgos encontrados

- Tablet portrait (768px) comparte borde con mobile en flow nav: 768px usa reglas tablet (horizontal kanban + rail scroll), coherente con contrato.
- Context panel en 720–767px usa 2 columnas del breakpoint 720px existente; mobile ≤767 fuerza visual secundario pero no anula grid 720px — aceptable; tablet override a 1 col desde 768px.
- `min-height: calc(100vh - 140px)` del board desktop se anula en mobile (`min-height: 0`) — evita scroll vertical artificial.

## Validaciones ejecutadas

```bash
npm run build
npx tsc --noEmit
npm run lint
```

*(Resultados al cierre de B7:)*

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass — Compiled successfully; `/admin/categories` presente sin error |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` |

## QA manual recomendado

### Desktop (1366px+)

1. Confirmar kanban horizontal, lanes flex, context 3 columnas.
2. Flow nav grid sin regresión.

### Tablet

3. iPad Mini portrait (~768px): board legible, lanes clamp, flow nav usable.
4. Landscape 900–1199px: scroll horizontal cómodo, secondary lanes visibles.
5. Context panel asociado al board, una columna de strips.

### Mobile (360–430px)

6. Kanban vertical stack, sin overflow horizontal de página.
7. Flow nav compacto y táctil si hay >1 lane.
8. Cards full-width, quick actions táctiles.
9. Empty global/day sin flow nav; filtered empty claro.
10. Context panel compacto después del board.
11. Abrir pedido, cambiar estado, optimistic update, manual sync, search/filter no reset.

**Estado QA manual:** pendiente (sin sesión local verificada en este cierre).

## Deuda técnica restante

- QA manual responsive en dispositivos reales / DevTools.
- Semántica accesible de card (`button` vs `div role=button`) — B8.
- Tokenización legacy rgba en `dashboard-filters.module.css` — fuera de scope B7.
- `/admin/categories` PageNotFoundError preexistente si reaparece en build — no corregir en B7.

## Próxima fase recomendada

**B8 — Tokens / Accessibility / Performance**

- Semántica interactiva de cards
- Consolidación tokens en filtros legacy
- Performance passes (virtualización, memo) si aplica
