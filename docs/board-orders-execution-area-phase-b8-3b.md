# Board / Orders Execution Area — Phase B8.3b — Desktop Lane Stretch Propagation Fix

## Objetivo

Corregir propagación de altura desktop para que las lanes llenen el alto útil del board y eliminen el espacio muerto antes del Context Panel.

## Contexto

- **B8.3** definió altura desktop con `clamp` y `lane { height: 100% }`.
- **B8.3b** fix quirúrgico CSS sin cambios funcionales.

## Problema detectado

El board reservaba espacio vertical, pero las lanes internas quedaban con altura de contenido. Eso generaba espacio muerto entre el final de las columnas y el Context Panel.

## Diagnóstico

**Caso A:** `boardWrapper` alto, `.lane` corta.

Causas identificadas en CSS:

1. `grid-auto-rows` por defecto `auto` — filas grid no ocupan altura del contenedor.
2. `align-content: flex-start` heredado del `.boardWrapper` base (flex) — empaqueta filas arriba dejando hueco.
3. `.lane { max-height: 100% }` base sin fila grid definida — no estira contra contenedor alto.

Elemento **Caso C** mitigado: reglas desktop explícitas en `.laneBody` (`flex: 1`, `min-height: 0`, `overflow-y: auto`).

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/dashboard-kanban.module.css` | Grid row stretch + align + lane max-height reset |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-3b.md` | Este documento |

## Cambio aplicado

Desktop `@media (min-width: 1200px)`:

```css
.boardWrapper {
  align-content: stretch;
  align-items: stretch;
  grid-auto-rows: minmax(0, 1fr);
}
.lane {
  max-height: none;
  height: 100%;
  align-self: stretch;
  display: flex;
  flex-direction: column;
}
.laneBody {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
```

## Height propagation chain

```txt
.boardWrapper (height clamp)
  └─ grid row minmax(0, 1fr)
       └─ .lane (height 100%, flex column)
            ├─ .laneHeader (flex 0)
            └─ .laneBody (flex 1, scroll-y)
```

## Desktop behavior

- 4 lanes full-width B8.2 preservado.
- Lanes estiran hasta altura del board.
- Sin espacio muerto bajo columnas.
- Context Panel queda debajo del board (sin cambios en su CSS).

## Tablet / mobile preservation

- Reglas solo en `@media (min-width: 1200px)`.
- Tablet/mobile sin cambios.

## Internal lane scroll

- `overscroll-behavior: contain` preservado.
- Scrollbar thin local preservado.

## Comportamiento preservado

- 4 lanes full-width de B8.2.
- Micro-resumen eliminado en B8.3.
- Scroll interno por lane.
- Search visible desktop.
- Filtros desktop ocultos.
- Flow nav desktop oculto.
- Mobile stack B7.
- Realtime/hydration/optimistic sin cambios.

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
- TSX / view model

## Compatibilidad con B8.1/B8.2/B8.3

| Fase | B8.3b |
|------|-------|
| B8.2 full-width grid | Intacto |
| B8.3 height clamp | Completado con stretch |
| B8.3 header simplificado | Sin reabrir |

## Riesgos encontrados

- `100dvh` en clamp — min-height 34rem como piso en viewports bajos.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` |

## QA manual recomendado

1. Desktop: lanes estiradas, sin hueco antes de context panel.
2. Lane con muchos pedidos: scroll interno.
3. 5 lanes cancelled: stretch + scroll horizontal OK.
4. Mobile/tablet sin regresión.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- QA visual pre-B9.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
