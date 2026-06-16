# Board Orders — Relative Time UI Heartbeat Brief Audit

## Objetivo

Identificar por qué los textos relativos de tiempo en las cards del kanban (`Recién ingresado`, `Hace 5 min`, `Hace 1 h`, etc.) permanecen estáticos hasta un refresh manual, sin modificar código ni implementar el fix.

## Archivos revisados

| Archivo | Rol en el flujo |
|---------|-----------------|
| `components/admin/orders/order-card.tsx` | Render del label de tiempo en card |
| `components/admin/orders/admin-dashboard-orders.tsx` | Estado `now`, interval heartbeat, pasa props a cards |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Propaga `now` al kanban |
| `lib/orders/presenter.ts` | Helpers `formatOperationalTime` / `buildOrderRelativeTimeLabel` |
| `lib/orders/dashboard-board-view-model.ts` | Agrupa orders; recibe `now` pero no recalcula labels |
| `lib/orders/activity.ts` | Actividad reciente (usa mismo helper, mismo patrón estático) |
| `lib/orders/operational-feed.ts` | Feed operacional; usa `now` para ventanas, no para labels de card |
| `components/admin/orders/order-card.module.css` | Solo estilos; sin lógica de tiempo |

Referencias cruzadas (fuera del scope de lectura pero relevantes para el dato):

- `lib/orders/admin.ts` — setea `relative_time_label` al normalizar pedidos (SSR/hydration/fetch).
- `lib/orders/realtime.ts` — recalcula `relative_time_label` solo en patch realtime (con `new Date()` del momento del evento).

## Hallazgo principal

**La card muestra un snapshot precomputado (`order.relative_time_label`) y no usa la prop `now` que ya recibe.** Aunque el dashboard tiene un heartbeat de 60s que actualiza `now` y el comparator de `React.memo` permite re-render cuando `now` cambia, el texto renderizado no se recalcula porque `OrderCard` nunca invoca el helper con `now`.

## Dónde se calcula el tiempo relativo

### Helper principal (cards)

```ts
// lib/orders/presenter.ts
formatOperationalTime({ created_at, now = new Date() })
buildOrderRelativeTimeLabel(input) → formatOperationalTime(input)
```

Salida según minutos transcuridos desde `created_at`:

| Rango | Label |
|-------|-------|
| `< 1 min` | `Recien ingresado` |
| `< 60 min` | `Hace ${n} min` |
| `< 24 h` | `Hace ${n} h` |
| `≥ 24 h` | `Hace ${n} d` |

> Nota: `Hace instantes` **no** sale de este helper en cards. Aparece en `lib/orders/activity.ts` y `lib/orders/events.shared.ts` (context panel / timeline), no en el label de card kanban.

### Dónde se asigna el valor que ve la card

```tsx
// order-card.tsx (línea ~122)
const timeLabel = order.relative_time_label ?? formatAdminOrderDate(order.delivery_date);
```

`relative_time_label` se calcula una vez en:

1. **Hydration / fetch** — `lib/orders/admin.ts` → `buildOrderRelativeTimeLabel({ created_at: order.created_at })` sin pasar `now` (usa `new Date()` del momento de normalización).
2. **Patch realtime** — `lib/orders/realtime.ts` → mismo patrón al actualizar el pedido.
3. **Manual sync / refresh** — vuelve a normalizar vía fetch → nuevo snapshot.

La card **no** llama a `buildOrderRelativeTimeLabel` en render.

## Qué timestamps usa la card

| Campo | Uso |
|-------|-----|
| `order.created_at` | Timestamp base del helper (vía snapshot `relative_time_label`) |
| `order.delivery_date` | Fallback solo si `relative_time_label` es null (fecha absoluta, no relativa) |
| Prop `now` | Recibida pero **no usada** en el cuerpo del componente |

No usa `updated_at`, `last_movement`, ni `assigned_at` para el label de tiempo en card.

## Por qué no se actualiza solo

Cadena causal:

```txt
1. Label se congela en hydration/fetch como relative_time_label estático.
2. OrderCard renderiza ese string; ignora now.
3. Heartbeat setNow cada 60s SÍ cambia now → memo permite re-render.
4. Re-render no cambia timeLabel porque sigue leyendo order.relative_time_label.
5. Solo avanza si: realtime patch, manual sync, optimistic (si toca created_at/status),
   filtro/search (re-mount), o refresh de página.
```

Además, `areOrdersEqualForCard` no incluye `relative_time_label` en la comparación de `order`; si el snapshot cambiara sin cambiar otros campos, memo podría bloquear el re-render (caso marginal hoy porque el snapshot casi nunca cambia solo).

### Re-render actual — cuándo sí se repinta la card

| Evento | ¿Re-render card? | ¿Label relativo avanza? |
|--------|------------------|-------------------------|
| Heartbeat `now` (60s) | Sí (memo compara `now`) | **No** |
| Realtime event | Sí | Sí (recalcula snapshot en patch) |
| Manual sync / refresh | Sí | Sí |
| Optimistic status change | Sí | Solo si el patch incluye nuevo snapshot |
| Filtro / search | Sí | No (mismo snapshot) |
| Refresh de página | Sí | Sí (nuevo hydration) |

## Heartbeat/tick existente

En `admin-dashboard-orders.tsx`:

| Mecanismo | Intervalo | Propósito actual |
|-----------|-----------|------------------|
| `now` + `setInterval` | `LIVE_PRESSURE_TICK_MS` = **60_000 ms** | Ventana operacional, métricas, risk map, board view model |
| `syncFreshnessTick` + `setInterval` | **60_000 ms** | Detectar sync operacional stale (toolbar), no labels |
| `setNow(new Date())` ad-hoc | — | Realtime recovery, visibility, manual sync success |

**No existe** `relativeTimeTick` ni interval dedicado a labels relativos.

**Reutilización recomendada para B8.10b:** el `now` existente ya tick cada 60s y ya se pasa a `OrderCard` / `DashboardKanbanBoard`. No hace falta un segundo interval salvo desacoplar explícitamente (opcional `relativeTimeTick` numérico).

Patrón de referencia en el mismo codebase: `order-risk-panel.tsx` tiene su propio `now` + interval 60s para recalcular risk en modal (no compartido con cards).

## Memoization / comparator

```tsx
const OrderCard = memo(OrderCardComponent, areOrderCardPropsEqual);
```

| Aspecto | Estado |
|---------|--------|
| `React.memo` | Sí, con comparator custom |
| Recibe `now` | Sí (`OrderCardProps.now: Date`) |
| Comparator incluye `now` | Sí: `previousProps.now.getTime() === nextProps.now.getTime()` |
| `relativeTimeTick` | No existe |
| `now` usado en render | **No** — no está en destructuring del componente |

**Conclusión:** memo **no bloquea** el heartbeat; el bloqueo es de **dato**, no de render. Cuando `now` avanza, la card se repinta pero muestra el mismo string.

Para forzar refresh liviano en B8.10b:

- Opción A (mínima): usar `now` ya recibida en `buildOrderRelativeTimeLabel({ created_at: order.created_at, now })` — comparator ya cubierto.
- Opción B: agregar `relativeTimeTick: number` incrementado cada 60s y compararlo en `areOrderCardPropsEqual` si se prefiere desacoplar de `liveOperationalNow` (que a veces se ajusta por sesión/pedidos).

## Fix mínimo recomendado

Implementación propuesta para **B8.10b** (sin aplicar en B8.10a):

```tsx
// order-card.tsx — reemplazar lectura de snapshot por cálculo live
import { buildOrderRelativeTimeLabel, formatAdminOrderDate } from "@/lib/orders/presenter";

function OrderCardComponent({ order, now, ... }: OrderCardProps) {
  const timeLabel =
    buildOrderRelativeTimeLabel({ created_at: order.created_at, now }) ??
    formatAdminOrderDate(order.delivery_date);
  // ...
}
```

Heartbeat:

- **Reutilizar** el interval existente de `now` en `admin-dashboard-orders.tsx` (60s).
- No crear fetch ni polling de datos.
- No tocar `lib/orders/admin.ts` ni `realtime.ts` para el fix UI (el snapshot en order puede quedar para SSR/listados; la card kanban usaría cálculo client-side).

Comparator:

- Con Opción A, **sin cambios** — `now` ya está en `areOrderCardPropsEqual`.
- Si se agrega `relativeTimeTick`, incluirlo en el comparator.

Cleanup:

- El interval de `now` ya limpia en unmount del dashboard; no duplicar.

Alcance opcional relacionado (fuera de card, misma causa):

- `lib/orders/activity.ts` línea ~55-57: `buildOrderRelativeTimeLabel({ created_at: event.created_at })` sin `now` → actividad reciente del context panel también estática entre ticks de `now` (aunque `buildRecentOperationalActivity` recibe `now` para filtrar ventana).

## Archivos que debería tocar B8.10b

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/order-card.tsx` | Usar `now` + `buildOrderRelativeTimeLabel` en render |
| `components/admin/orders/admin-dashboard-orders.tsx` | Probablemente **ninguno** si se reutiliza `now` existente |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Probablemente **ninguno** (ya pasa `now`) |
| `docs/board-orders-execution-area-phase-b8-10b.md` | Documentar fix (nueva fase) |

Opcional:

- `lib/orders/activity.ts` — pasar `now` al helper en actividad reciente (context panel).

No tocar en B8.10b:

- `lib/orders/admin.ts`, `lib/orders/realtime.ts`, server actions, DB.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Hydration mismatch SSR vs client si se calcula en render | Label relativo es derivado de `created_at` + `now`; ambos disponibles en client; SSR inicial puede diferir 1 min — aceptable o usar `suppressHydrationWarning` solo en span de tiempo si aparece warning |
| Granularidad 60s | Coincide con heartbeat actual; labels de minutos saltan cada minuto lógico al tick (aceptable para ops) |
| `liveOperationalNow` ≠ wall clock en edge cases | Usar `now` directo, no `liveOperationalNow`, para tiempo relativo de card |
| Doble interval | Evitar; reutilizar `now` existente |

## Qué NO debería tocarse

- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- toolbar
- modal
- card visual layout
- search/filter

## Próxima fase recomendada

**B8.10b — Relative Time UI Heartbeat Fix**
