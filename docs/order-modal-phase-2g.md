# Order Modal Phase 2G — Desktop Layout Rebalance

## Objetivo

Rebalancear el layout desktop del modal workstation moviendo contexto (timeline) a la izquierda y señales operativas (riesgo) cerca de la acción recomendada, con proporción de columnas más equilibrada — sin cambiar lógica.

Referencias: Phase 1A–2F, `docs/order-modal-audit.md`.

## Archivos modificados

- `components/admin/orders/admin-order-workspace-modal.tsx`
- `components/admin/orders/admin-order-modal.module.css`
- `components/admin/orders/order-human-timeline.module.css`

## Archivos creados

- `docs/order-modal-phase-2g.md`

## Cambio principal aplicado

Reordenamiento de bloques en el grid workstation y ajuste de proporción desktop ~54/46.

## Antes

```txt
Left:
- Products
- Overview
- Notes

Right:
- Recommended action
- Operational controls
- Communication
- Risk
- Timeline
```

## Después

```txt
Left:
- Products
- Overview
- Timeline / Activity
- Notes

Right:
- Recommended action
- Risk
- Operational controls
- Communication
```

## Qué se movió

| Componente | Desde | Hacia |
|------------|-------|-------|
| `OrderHumanTimeline` | `commandColumn` (final) | `executionColumn` (después de overview, antes de notas) |
| `OrderRiskPanel` | Después de `OrderActionsSection` | Después de `OrderRecommendedActionPanel` |

Props sin cambios en ambos componentes.

## Ajustes de layout

- Grid desktop ≥1024px: `1.5fr 1fr` → `minmax(0, 1.08fr) minmax(360px, 0.92fr)` (~54% / 46%)
- Timeline en izquierda: separador `border-top` vía override en `executionColumn`
- Risk: `margin-top: 0` (flex gap entre recommended y risk; sin hueco si risk es `null`)

## Ajustes CSS realizados

- `admin-order-modal.module.css`: grid columns, timeline en execution column, risk margin
- `order-human-timeline.module.css`: reset `margin-top` en panel bare (separación delegada al modal)

## Qué se preservó

- Props de timeline y risk (`compact`, `detailHref`, `operationalMetrics`, etc.)
- Lógica `assessOrderRisk` / null si stable
- Event builders, max 5 compact, orden, fallback
- `OrderActionsSection` intacto (control + comunicación)
- Mobile stack (`commandColumn order: -1` <1024px sin rediseño)

## Qué NO se tocó

- hydration/cache / `useOrderWorkspaceHydration`
- optimistic callbacks / workspace route / server actions / realtime / DB
- status logic / assignment logic
- WhatsApp builders/templates/URLs / clipboard/share/maps/tel logic
- `lib/orders/risk-detection.ts` / `lib/orders/events.shared.ts`
- risk scoring/signals / timeline builders/events/order/fallback
- products logic / notes logic
- componentes hijos (StatusForm, ExternalActions, etc.)
- mobile/tablet redesign
- page detail (`/admin/orders/[id]`)

## Desktop QA notes

Validar 1024–1920px: derecha menos scroll, izquierda con timeline, risk bajo recommended, sin gap fantasma si risk stable.

## Deuda técnica restante

- Mobile/tablet layout (Phase 3)
- Posible sticky en consola operativa
- Iconografía / analytics
- Ajuste fino de `minmax(360px)` en viewports muy estrechos desktop

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ⚠️ ESLint no configurado — `npx next lint` abre setup interactivo (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa (Next.js 15.3.0) |

## QA manual recomendado

Checklist desktop 1366px+ según spec Phase 2G (timeline izquierda, risk bajo recommended, acciones/WhatsApp sin regresión, page detail intacto).

## Próxima fase recomendada

**Phase 3 — Mobile/tablet layout** para el modal workstation.
