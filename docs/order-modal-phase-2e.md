# Order Modal Phase 2E — Risk / Timeline Premium Polish

## Objetivo

Elevar visualmente `OrderRiskPanel` y `OrderHumanTimeline` en la consola del modal workstation (y mejoras compatibles en otras vistas), sin cambiar lógica de riesgo, eventos ni timeline builders.

Referencias: Phase 1A–2D, `docs/order-modal-audit.md`.

## Archivos creados

- `docs/order-modal-phase-2e.md`

## Archivos modificados

- `components/admin/orders/order-risk-panel.tsx`
- `components/admin/orders/order-risk-panel.module.css`
- `components/admin/orders/order-human-timeline.tsx`
- `components/admin/orders/order-human-timeline.module.css`
- `components/admin/orders/admin-order-modal.module.css`

## Cambio principal aplicado

Polish visual premium en la parte inferior de la columna derecha: riesgo como alerta semántica compacta; historial compacto como actividad reciente con timeline legible.

## Antes

```txt
Riesgo e historial existentes, funcionales pero con polish visual pendiente.
- Risk: header plano, fondos fuertes en compact, strip transparente en command column
- Timeline: título "Historial", dots sueltos, metadata sin jerarquía clara
```

## Después

```txt
Riesgo como alerta semántica compacta (eyebrow + título + badge + chips).
Historial compacto como "Actividad reciente" con línea timeline y meta terciaria.
```

## Risk panel polish

- Estructura: eyebrow → título (`assessment.title`) → badge (`buildOrderRiskBadgeLabel`) → descripción → chips
- `data-level` en `<section>`
- Fondos más suaves (`color-mix` con tokens pending/cancelled)
- Compact: surface con border/radius (restaurada en command column vía `:global(.order-risk-panel)`)
- Global classes `order-risk-panel`, `order-risk-panel--attention/warning` para workstation

## Timeline polish

- Título **"Actividad reciente"** solo en `compact`; page/full mantiene **"Historial"**
- Marker wrapper + línea vertical entre eventos en modo `--bare`
- Clase `__meta-line` para timestamp/metadata más secundaria
- Header compacto uppercase alineado con otros grupos de la consola

## Qué se preservó

- `assessOrderRisk`, signals, thresholds, interval 60s
- Null cuando `level === "stable"`
- `buildOrderRiskBadgeLabel`, `formatRiskSignalLabel` (mismos textos)
- `buildPresentedOrderTimelineEntries`, max 5 eventos en compact, orden, fallback
- Link "Ver historial completo", history summary en non-compact
- Props, memo, callbacks — sin cambios

## Qué NO se tocó

- `lib/orders/risk-detection.ts`
- `lib/orders/events.shared.ts`
- risk scoring / signals / timeline event builders / event ordering / fallback event
- hydration/cache / optimistic callbacks / workspace route / server actions / realtime / DB
- status / assignment / WhatsApp logic
- products / notes / overview
- recommended action panel
- operational controls grouping
- communication hierarchy
- `admin-order-workspace-modal.tsx`

## Ajustes CSS realizados

**Risk:** nuevas clases header-copy, eyebrow, title, level-badge, description; fondos color-mix; chips compactos

**Timeline:** section-header compact, marker + línea vertical, meta-line terciaria, padding reducido en bare items

**Modal:** reemplazados overrides que anulaban surface del risk compact; restaurado `:global(.order-risk-panel*)` con tokens

## Compatibilidad con compact/page variants

| Componente | compact (modal) | page/full |
|------------|-----------------|-----------|
| Risk | Polish premium + surface en command column | Misma estructura JSX, estilos full panel |
| Timeline | "Actividad reciente" + timeline line | "Historial" + Card + summary metrics intactos |

## Confirmación de comportamiento preservado

- Mismas señales, mismos labels de riesgo desde assessment
- Mismo número y orden de eventos timeline
- Panel oculto si riesgo stable

## Deuda técnica restante

- Mobile/tablet no rediseñado completamente
- Posible iconografía futura para timeline/risk
- Posible "ver historial completo" más prominente
- Posible analytics/event tracking
- Posible unified alert/badge system global

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ⚠️ ESLint no configurado — `npx next lint` abre setup interactivo (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa (Next.js 15.3.0) |

## QA manual recomendado

1. Pedido con riesgo → alerta compacta con badge y chips
2. Pedido sin riesgo → panel oculto
3. Timeline compact → "Actividad reciente", max 5 eventos, línea vertical
4. Link historial completo si >5 eventos
5. Page `/admin/orders/[id]` → "Historial" + summary sin regresión
6. Acciones/comunicación/productos sin cambios

## Próxima fase recomendada

**Phase 3 — Mobile/tablet layout** o polish transversal de consola completa.
