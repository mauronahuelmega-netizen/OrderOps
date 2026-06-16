# Board / Orders Execution Area — Phase B9.1 — Kanban Lane Scroll Chaining Polish

## Objetivo

Permitir scroll chaining en columnas del kanban: cuando una lane llega al límite superior o inferior, la rueda/trackpad continúa scrolleando la página en lugar de quedar atrapada.

## Contexto

B8.1–B8.3b introdujeron lanes persistentes con scroll interno en `.laneBody`. B9 cerró el roadmap con deuda no bloqueante. B9.1 corrige fricción UX de scroll sin alterar layout ni lógica.

## Problema detectado

Las lanes tenían scroll interno correcto, pero cuando una lane llegaba al límite superior/inferior el scroll no continuaba hacia la página, generando sensación de scroll atrapado.

## Archivos modificados

- `components/admin/orders/dashboard-kanban.module.css`

## Archivos creados

- `docs/board-orders-execution-area-phase-b9-1.md`

## Hallazgo técnico

Auditoría en kanban + dashboard:

| Ubicación | Regla | Impacto |
|-----------|-------|---------|
| `.laneBody` (base) | `overscroll-behavior: contain` | Bloquea chaining vertical al documento |
| `.laneBody` (`@media min-width: 1200px`) | `overscroll-behavior: contain` | Mismo bloqueo en desktop persistent kanban |
| `DashboardKanbanBoard.tsx` | Sin `onWheel` / `preventDefault` | No hay bloqueo JS |
| `admin-dashboard-orders.tsx` | Sin handlers wheel en board | No hay bloqueo JS |
| Mobile `.laneBody` | `overflow-y: visible` | Scroll de página natural; no afectado |

`.laneBody` mantiene `overflow-y: auto` — scroll interno preservado.

## Cambio aplicado

Reemplazo en `.laneBody`:

```css
/* antes */
overscroll-behavior: contain;

/* después */
overscroll-behavior-y: auto;
```

Aplicado en regla base y en bloque desktop `@media (min-width: 1200px)`.

## CSS-first decision

Sí. `overscroll-behavior: contain` era la causa directa. El valor por defecto del eje Y (`auto`) permite que el overscroll se propague al ancestro scrollable (página) al alcanzar top/bottom de la lane.

No se requirió fallback JS.

## JS fallback

**No usado.** No existían handlers `onWheel` / `wheel` en el kanban. CSS fue suficiente.

## Desktop behavior

- Mouse/trackpad sobre columna con overflow: la lane scrollea primero.
- Al llegar al fondo o techo de la lane: el scroll continúa en la página.
- Lanes cortas/vacías (sin overflow interno): la rueda scrollea la página directamente.

## Mobile/tablet behavior

- **Mobile (≤767px):** `.laneBody` sigue con `overflow-y: visible` — sin cambio.
- **Tablet (768–1199px):** hereda `overscroll-behavior-y: auto` de regla base; touch scroll no alterado.
- No se modificaron media queries de altura ni layout.

## Qué se preservó

- scroll interno de lanes
- lanes persistentes
- alturas actuales
- kanban layout
- cards
- search/filter
- realtime/hydration
- manual order flow

## Qué NO se cambió

- DB/schema
- server actions
- realtime
- hydration
- optimistic callbacks
- orders logic
- session logic
- toolbar
- cards
- manual order modal
- checkout público

## Validaciones ejecutadas

- `npm run build`: **pass** (exit 0, Next.js 15.3.0)
- `npx tsc --noEmit`: **pass** (exit 0; primer intento falló por race con build en `.next/types` — reintento OK)
- `npm run lint`: **pass** — 0 errors / 16 warnings `no-img-element` (sin cambio)

## QA manual recomendado

Pendiente sin sesión local con columnas llenas:

1. Desktop: scroll wheel en lane hasta límite → página continúa.
2. Empty lane: wheel → página scrollea normal.
3. Trackpad: sin saltos bruscos.
4. Mobile/tablet: touch scroll sin regresión.

## Riesgos / deuda

- Comportamiento exacto puede variar levemente entre Chrome/Firefox/Safari con `overscroll-behavior-y: auto` (estándar).
- Si un ancestro futuro vuelve a poner `overscroll-behavior: contain`, el problema reaparecería — documentado aquí.

## Próxima fase recomendada

- Staging QA (checklist B9 + scroll chaining manual)
- Próximo roadmap: Cash Closing / Session Reports / Delivery Mode / Kitchen Mode
