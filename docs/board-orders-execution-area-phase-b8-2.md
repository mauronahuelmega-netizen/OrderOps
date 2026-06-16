# Board / Orders Execution Area — Phase B8.2 — Desktop Board Simplification & Full Width Lanes

## Objetivo

Simplificar el Board desktop tras B8.1: ocultar controles redundantes (filtros + flow nav), full-width en 4 lanes y alinear el kanban con el toolbar — sin cambiar lógica funcional.

## Contexto

- **B8.1** introdujo lanes persistentes con scroll interno.
- **B8.2** corrige duplicación visual y scroll horizontal innecesario en desktop antes de **B9**.

## Problema detectado

Después de B8.1, desktop mostraba filtros, flow nav y columnas persistentes al mismo tiempo, duplicando la lectura del flujo. Además, el kanban generaba scroll horizontal en el caso normal de 4 lanes.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardToolbar.tsx` | Banner compacto filtro activo desktop |
| `components/admin/orders/dashboard-toolbar.module.css` | Ocultar filtros desktop; layout search; banner styles |
| `components/admin/orders/DashboardKanbanBoard.tsx` | `data-lane-count` en board wrapper |
| `components/admin/orders/dashboard-kanban.module.css` | Grid full-width 4 lanes; scroll solo 5 lanes; padding alineado |
| `components/admin/orders/lane-navigation-scanning.module.css` | Ocultar flow nav en desktop ≥1200px |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-2.md` | Este documento |

## Decisión IA aplicada

Desktop ≥1200px: el tablero de columnas persistentes reemplaza filtros de estado y “Estados del flujo” como navegación principal. Búsqueda + session/sync permanecen. Tablet/mobile conservan controles B4/B7.

## Desktop toolbar simplification

- `.filterCluster { display: none }` en ≥1200px
- `.searchCluster` ancho `min(32rem, 100%)`, alineado a la izquierda
- Session/sync sin cambios

## Active filter desktop safeguard

Si `activeFilter !== "all"` en desktop:

```txt
Vista filtrada: {label} · [Volver a Todos]
```

- Solo visible en ≥1200px (CSS)
- Handler: `onFilterSelect("all")` — misma lógica URL existente
- Mobile/tablet: filtros completos siguen visibles; banner oculto

## Flow navigation desktop behavior

```css
@media (min-width: 1200px) {
  .admin-orders-lane-nav { display: none; }
}
```

- DOM/IntersectionObserver intactos (componente sigue montado en kanban)
- Tablet/mobile: sin cambio

## Full width desktop lanes

```css
.boardWrapper[data-lane-count="4"] {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  overflow-x: visible;
}
```

- `padding-inline: 0` en desktop para alinear con toolbar
- Sin scroll horizontal en caso normal

## Cancelled lane / 5-lane behavior

```css
.boardWrapper[data-lane-count="5"] {
  grid-template-columns: repeat(5, minmax(15rem, 1fr));
  overflow-x: auto;
}
```

- Cancelled con pedidos no se oculta
- Scroll horizontal aceptable solo con 5 lanes

## Internal lane scroll preservation

- `.laneBody`: `overflow-y: auto`, `min-height: 0`, scrollbar thin (B8.1)
- `.boardWrapper` max-height clamp preservado
- Una lane con muchos pedidos no empuja altura de hermanas

## Mobile / tablet preservation

| Breakpoint | Comportamiento |
|------------|----------------|
| ≤767px | Stack B7; filtros visibles; flow nav si aplica |
| 768–1199px | Filtros + flow nav visibles; scroll horizontal tablet B8.1 |
| ≥1200px | Simplificación B8.2 |

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Search behavior igual.
- ActiveFilter logic igual.
- Context panel igual.
- Empty global/day-scope igual.
- Toolbar session/sync igual.
- Top section/modal iguales.

## Qué NO se cambió

- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- route JSON
- top section
- modal/detail
- card data
- card UX B5/B8
- quick action behavior
- status/assignment logic
- image optimization / no-img-element
- view model / groupedOrders persistent logic (B8.1)

## Compatibilidad con B1/B2/B3/B4/B5/B6/B7/B8/B8.1

| Fase | B8.2 |
|------|------|
| B8.1 persistent lanes | Full width en desktop |
| B7 mobile | Sin cambios |
| B4 flow nav | Oculto solo desktop CSS |
| B8 toolbar | Session/sync intactos |

## Riesgos encontrados

- Flow nav montado pero oculto en desktop — mínimo costo DOM; evita JS viewport.
- URL `?filter=pending` en desktop depende del banner para volver a Todos.
- 5 lanes con cancelled puede reintroducir scroll horizontal — intencional.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` |

## QA manual recomendado

1. Desktop 1366+: sin filtros, sin flow nav, 4 columnas full width, sin scroll horizontal.
2. `?filter=pending`: banner + Volver a Todos.
3. Cancelled con pedidos: 5 lanes OK.
4. Tablet/mobile: filtros y flow nav visibles.
5. Scroll interno lane + quick actions/modal/sync.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- QA manual completo pre-B9.
- Desmontar flow nav en desktop (optimización futura, no requerida B8.2).

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
