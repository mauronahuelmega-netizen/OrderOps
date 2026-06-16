# Board / Orders Execution Area — Phase B8.1 — Desktop Persistent Lanes & Internal Lane Scroll

## Objetivo

Corregir el kanban desktop para que muestre columnas persistentes del flujo operativo con ancho estable y scroll interno por lane, sin alterar lógica funcional.

## Contexto

- **B4** definió lanes IA (core/secondary) y flow navigation.
- **B7** definió stack vertical mobile.
- **B8** cerró tokens/a11y/performance.
- **B8.1** ajusta layout desktop antes de **B9 Final QA**.

## Problema detectado

El kanban renderizaba sólo lanes con pedidos. Con un único pedido `pending`, el board mostraba sólo **Pendientes** y perdía el mapa mental del flujo operativo (Pendientes → Preparando → Listos → Completados).

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/orders/dashboard-board-view-model.ts` | Lanes persistentes + `isPersistentLane` / `isEmpty` |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Empty lane state + data attributes mobile |
| `components/admin/orders/dashboard-kanban.module.css` | Columnas fijas desktop, scroll interno, mobile hide |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-1.md` | Este documento |

## Decisión IA aplicada

Desktop/tablet amplio debe mostrar columnas persistentes del flujo operativo como tablero fijo, no como lista que cambia de estructura según pedidos existentes.

## Persistent lanes

Siempre visibles en `renderMode === "kanban"`:

| Status | Label | laneKind |
|--------|-------|----------|
| `pending` | Pendientes | core |
| `preparing` | Preparando | core |
| `ready` | Listos | core |
| `completed` | Completados | secondary |

## Conditional lanes

| Status | Regla | laneKind |
|--------|-------|----------|
| `cancelled` | Solo si `orders.length > 0` | secondary |

## Empty lane state

- Copy: **Sin pedidos**
- Markup: `<p className={emptyLaneState}>` dentro de `laneBody`
- Sin CTA, sin `aria-live`, borde dashed sutil

## Desktop fixed lane layout

```css
@media (min-width: 1200px)
├─ .lane: flex 0 0 clamp(18rem, 24vw, 23rem); min 18rem; max 24rem
├─ .boardWrapper: max-height clamp(30rem, calc(100vh - 18rem), 44rem)
└─ Una sola lane ya no ocupa todo el ancho
```

## Internal lane scroll

- `.lane`: `flex-direction: column; min-height: 0`
- `.laneHeader`: `flex: 0 0 auto`
- `.laneBody`: `flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain`
- Scrollbar thin local (WebKit + `scrollbar-width`)

## Tablet behavior

768–1199px:

- Scroll horizontal preservado (B7)
- `laneBody` max-height `clamp(24rem, 58vh, 34rem)`
- Board max-height moderado

## Mobile behavior

≤767px (B7 preservado):

- Stack vertical
- `display: none` en lanes `[data-lane-empty="true"][data-lane-persistent="true"]`
- Lanes con pedidos y `cancelled` con pedidos siguen visibles

## Flow navigation impact

- Flow nav usa `groupedOrders` con counts reales (incluye 0)
- `shouldRenderFlowNavigation = renderMode === "kanban" && groupedOrders.length > 1` — con 4 persistent lanes, flow nav aparece en kanban
- No aparece en empty global/day-scope/filtered-empty/filtered-list (sin cambio)

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Search/filter igual.
- Context panel igual.
- Empty global/day-scope igual.
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
- card UX B5/B8
- quick action behavior
- status/assignment logic
- search/filter behavior
- image optimization / no-img-element

## Compatibilidad con B1/B2/B3/B4/B5/B6/B7/B8

| Fase | B8.1 |
|------|------|
| B2 view model | Extiende `groupedOrders`; `renderMode` intacto |
| B3 empty | Persistent lanes solo en `kanban` |
| B4 laneKind | core/secondary preservado |
| B5/B8 cards | Sin cambios |
| B6/B8 realtime | Sin tocar |
| B7 mobile | Stack + hide empty persistent |

## Riesgos encontrados

- Flow nav siempre visible en kanban (≥4 lanes) — esperado.
- `completed` empty visible en desktop puede sumar scroll horizontal — aceptable para mapa de flujo.
- Mobile oculta empty persistent — si solo hay pedidos en un status, otras lanes no aparecen (correcto).

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass — Compiled successfully (1er intento falló por JSON parse transitorio en page data) |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` |

## QA manual recomendado

### Desktop

1. Solo 1 pedido pending → 4 columnas + empty states.
2. Pendientes no ocupa todo el ancho.
3. Scroll interno con muchos pedidos en una lane.
4. Cancelled solo si hay pedidos cancelados.
5. Flow nav counts correctos.

### Tablet / Mobile

6. Tablet scroll horizontal + lane scroll interno.
7. Mobile stack B7; empty persistent ocultas.

### Functional

8. Quick actions, modal, sync, search/filter sin regresión.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- QA manual desktop/tablet/mobile.
- Label "Preparando" vs "En preparación" — sin cambio en B8.1.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
