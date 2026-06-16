# Admin Dashboard Top Section Phase D10.1 — Empty State Insight Microcopy Fix

## Objetivo

Corregir el microcopy del insight positivo (`positive-operations`) para que empty state y sesión sin pedidos activos no muestren “Buen ritmo operativo” cuando no hay operación medible.

## Contexto

Post-D7/D9/D10, desktop y mobile comparten el mismo presenter. QA detectó que en sesión vacía el fallback positivo decía “Buen ritmo operativo · Sin demoras”, lo cual implica operación activa inexistente.

## Archivo modificado

- `lib/orders/dashboard-top-section-view-model.ts`

## Archivo creado

- `docs/admin-dashboard-top-section-phase-d10-1.md`

## Problema detectado

Cuando no hay pedidos en la sesión operacional, el insight fallback usaba siempre:

```txt
Buen ritmo operativo
Sin demoras
```

Eso es conceptualmente incorrecto en empty state total.

## Cambio aplicado

Helper local `buildPositiveOperationsInsightCopy` que elige title/detail/tone según conteos de sesión:

- `commercial.validOrdersCount` → pedidos no cancelados en scope
- `commercial.activeOrders` → pedidos activos operativos

`buildPositiveInsight` consume el helper sin cambiar id, priority ni `futureActionKey`.

## Reglas de microcopy

| Condición | Title | Detail | Tone |
|-----------|-------|--------|------|
| `validOrdersCount === 0` | Sin actividad operativa | Todavía no hay pedidos en curso | neutral |
| `validOrdersCount > 0 && activeOrders === 0` | Operación tranquila | Sin pedidos activos | success |
| `activeOrders > 0` | Buen ritmo operativo | Sin demoras / Sin preparación lenta / Operación estable | success |

La rama activa preserva la lógica previa de detail según `averagePreparationMinutes` y `stalledCount`.

## Casos cubiertos

1. Empty state total → Sin actividad operativa
2. Sesión con historial pero sin activos → Operación tranquila
3. Sesión con pedidos activos sin problemas → Buen ritmo operativo
4. Insights de riesgo (demorados, etc.) → sin cambios

## Qué se preservó

- Presenter shape
- Insight IDs (`positive-operations`)
- Insight priorities (90)
- `futureActionKey: null`
- Session scoping (`orders` input)
- KPI logic
- Condiciones de otros insights
- Desktop/mobile layout (sin cambios)

## Qué NO se tocó

- CSS / tokens / layout
- KPIs y thresholds
- Search/filter/tabs logic
- Lanes / cards / modal
- Realtime / server actions / DB/Supabase
- Insight filters clickables

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `npm run lint` | ⚠️ No configurado — `next lint` abre setup interactivo de ESLint |
| `npm run build` | ✅ Exit 0 — compilación y typecheck OK |

## QA manual recomendado

1. Empty state: `Sin actividad operativa` / `Todavía no hay pedidos en curso`
2. Sin activos con historial: `Operación tranquila` / `Sin pedidos activos`
3. Con activos sin demoras: `Buen ritmo operativo`
4. Con demorados: insights de riesgo intactos
5. Desktop/mobile layout sin cambios

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- `tone: neutral` en empty state usa dot gris en insights (D7) — validar contraste en dark/light
- `validOrdersCount` incluye completados; Case B requiere al menos un pedido no cancelado en sesión

## Próxima fase recomendada

Copy refinement opcional para operational KPI details (“En ready”, “Pendientes + preparación + listos”) en fase dedicada de microcopy.
