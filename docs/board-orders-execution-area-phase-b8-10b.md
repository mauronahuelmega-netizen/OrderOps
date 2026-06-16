# Board / Orders Execution Area — Phase B8.10b — Relative Time UI Heartbeat Fix

## Objetivo

Hacer que los labels relativos de tiempo en las cards avancen automáticamente cada ~60s sin refresh manual, refetch ni cambios en datos.

## Contexto

Tras B8.7–B8.9, las cards muestran tiempo relativo en la esquina superior (`Recien ingresado`, `Hace X min`, etc.). B8.10a identificó que el texto quedaba congelado.

## Hallazgo de B8.10a

OrderCard recibía `now` y re-renderizaba cada 60s, pero seguía usando `order.relative_time_label`, un snapshot estático. Por eso el texto no avanzaba aunque la card se repintara.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/order-card.tsx` | Recalcular `timeLabel` con `buildOrderRelativeTimeLabel({ created_at, now })`; `suppressHydrationWarning` en span de tiempo |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-10b.md` | Este documento |

## Cambio aplicado

```tsx
const timeLabel =
  buildOrderRelativeTimeLabel({ created_at: order.created_at, now }) ??
  formatAdminOrderDate(order.delivery_date);
```

- `now` agregado al destructuring del componente.
- Import de `buildOrderRelativeTimeLabel` desde `@/lib/orders/presenter`.
- `order.relative_time_label` permanece en el tipo/datos (normalizers intactos); la card ya no lo usa como fuente de render.

## Before / after

| Antes | Después |
|-------|---------|
| `order.relative_time_label` (snapshot hydration/fetch/realtime) | `buildOrderRelativeTimeLabel({ created_at, now })` en cada render |
| Avanza solo en refresh/realtime/sync | Avanza cada tick de `now` (~60s) |
| `now` recibida pero ignorada | `now` usada para cálculo |

## Heartbeat strategy

Se reutiliza el `now` existente del dashboard (`LIVE_PRESSURE_TICK_MS` = 60s en `admin-dashboard-orders.tsx`). No se agregó interval nuevo, fetch, polling ni sync automático.

## Memoization

`areOrderCardPropsEqual` ya comparaba `previousProps.now.getTime() === nextProps.now.getTime()`. Sin cambios al comparator.

## Hydration considerations

Se aplicó `suppressHydrationWarning` solo al `<span className={styles.time}>` porque el label relativo puede diferir mínimamente entre SSR y primer paint client al calcular con `now` en render.

## Optional activity labels

No modificado en B8.10b. `lib/orders/activity.ts` sigue llamando al helper sin pasar `now` explícito, pero `buildRecentOperationalActivity` se re-ejecuta cuando `now` cambia en el dashboard y el helper usa `new Date()` por defecto en ese momento. Deuda menor: alinear pasando `now` explícito para consistencia.

## Comportamiento preservado

- Card layout B8.7 intacto.
- Visual hierarchy B8.9 intacta.
- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Search/filter igual.
- Modal/detail igual.

## Qué NO se cambió

- realtime
- hydration (lógica de datos)
- optimistic callbacks
- server actions
- DB/Supabase
- route JSON
- toolbar
- top section
- context panel visual
- modal/detail
- card data source
- card CSS
- status/assignment logic
- image optimization / no-img-element

## Compatibilidad con B8.7/B8.8/B8.9

Sin cambios de markup, clases ni layout. Solo fuente del string de tiempo.

## Riesgos encontrados

- Granularidad de labels atada al tick de 60s (aceptable para ops).
- Posible drift SSR/client mitigado con `suppressHydrationWarning` en el nodo de tiempo.

## Validaciones ejecutadas

- `npm run build`: pass
- `npx tsc --noEmit`: pass
- `npm run lint`: pass — 0 errors / 16 warnings `no-img-element` (sin cambio)

## QA manual recomendado

1. Abrir `/admin/dashboard` con pedido reciente.
2. Confirmar label inicial (`Recien ingresado` o `Hace X min`).
3. Esperar 60–90s sin refresh.
4. Confirmar avance del label.
5. Confirmar quick actions, optimistic, manual sync, modal sin regresiones.
6. Revisar consola por hydration warnings.

**Estado:** pendiente.

## Deuda técnica restante

- QA manual pendiente.
- Opcional: pasar `now` explícito en `lib/orders/activity.ts`.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
