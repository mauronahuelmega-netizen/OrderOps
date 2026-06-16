# Admin Dashboard Top Section Phase D6 — Operational KPI Polish

## Objetivo

Elevar la fila `Operación` del top section desktop para comunicar estado, severidad y ritmo con claridad premium — sin alertas crudas ni cambios de datos/presenter.

## Contexto

Post-D5, la fila `Negocio` ya tiene polish editorial. D6 aplica el mismo enfoque CSS-first a los 4 Operational KPIs, usando `data-section="operational"`, `data-kpi-id` y `data-tone` ya presentes en TSX.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardOverview.module.css` | Polish operational: severity rail, labels, typography, icon tones, tratamientos por KPI |

## Archivos creados

- `docs/admin-dashboard-top-section-phase-d6.md`

## Cambio principal aplicado

Sistema visual operacional con rail lateral sutil por tono, labels en sentence case, jerarquía editorial (label → value → detail), icon containers semánticos sobrios y tratamientos específicos por KPI ID.

## Operational KPI polish aplicado

- Labels sin uppercase agresivo
- Orden visual editorial alineado con business
- Details más legibles (`0.875rem`)
- Grid `align-items: stretch`
- Valores con tracking negativo moderado

## Severity system aplicado

Rail lateral `::before` (3px) en cards operacionales:

| Tone | Rail |
|------|------|
| success | `--color-ready` 45% mix |
| warning | `--color-pending` 50% mix |
| danger | `--color-cancelled` 52% mix |
| info | `--color-delivery` 45% mix |
| neutral | `--border-subtle` 60% mix |

Sin fondos de alerta en toda la card.

## Kitchen status treatment

`data-kpi-id="kitchenStatus"`:

- Value con tracking editorial (`-0.035em`)
- Hereda tono success del presenter + icon container verde sutil
- Detail legible como contexto de ritmo

## Delayed orders treatment

`data-kpi-id="delayedOrders"`:

- Warning/danger: value ligeramente mayor (`1.875rem`) sin glow ni borde rojo
- Success (`Sin demoras`): verde controlado, tono calmado
- Rail + icon container según `data-tone`

## Average time treatment

`data-kpi-id="averageTime"`:

- Value con tono semántico de ritmo (warning/info/success según presenter)
- Detail "Preparación" legible en `--text-secondary`
- Sin competir visualmente con demorados cuando ambos en warning

## Ready waiting treatment

`data-kpi-id="readyWaiting"`:

- Info/warning: value `1.625rem` (fricción visible, no dominante)
- Success: verde calmado cuando no hay pedidos listos
- Icon container info/warning sutil

Copy `En ready` preservado (presenter) — posible refinement futuro.

## Typography refinements

- Operational labels: `0.8125rem`, weight 600, sentence case
- Operational values: weight 700, `-0.035em` tracking, `line-height: 1.05`
- Operational details: `0.875rem`, `line-height: 1.35`

## Icon tone refinements

Icon containers operacionales con mix 8% color / 14% border por `data-tone` — success, warning, danger, info.

## Qué se preservó

- Presenter `buildDashboardTopSectionViewModel`
- View model y tipos
- Session scoping
- Business KPIs y polish D5
- Operational KPI IDs (`kitchenStatus`, `delayedOrders`, `averageTime`, `readyWaiting`)
- Insights (sin polish profundo)
- Surface system D4
- TSX sin cambios (atributos ya existían)

## Qué NO se tocó

- `lib/orders/dashboard-top-section-view-model.ts`
- Cálculos y thresholds
- lanes · order cards · modal
- toolbar/search/filtros · store session controls
- realtime · server actions · DB/Supabase
- tokens globales
- mobile/tablet
- insight filters / click behavior

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit code 0 |
| `npm run lint` | ⚠️ Exit code 1 — ESLint no configurado; `next lint` abre setup interactivo |
| `npm run build` | ✅ Exit code 0 — Next.js 15.3.0, compilación y tipos OK |

## QA manual recomendado

1. Fila `Negocio` intacta
2. Fila `Operación` más clara y premium
3. `Estado de cocina` como ancla operacional
4. `Pedidos demorados` riesgo controlado
5. `Tiempo promedio` como ritmo
6. `Listos esperando salida` como fricción
7. Labels sentence case
8. Rails de severidad sutiles
9. Sin fondos agresivos
10. Insights/lanes/toolbar sin cambios
11. Dark/light theme OK

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- Copy técnico en detail de `readyWaiting` ("En ready") — posible D6.1/D7
- Múltiples cards en warning pueden competir visualmente en escenarios de alta carga
- `order` CSS en flex puede diferir del orden DOM para lectores de pantalla

## Próxima fase recomendada

**Phase D7 — Insights Polish** — mini-cards, prioridad visual, copy refinement y preparación para future actions.
