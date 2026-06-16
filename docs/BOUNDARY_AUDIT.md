# Boundary Audit

## 1. Que problema resuelve esta auditoria

Esta auditoria busca evitar errores de boundary entre server y client, especialmente casos como:

- `next/headers` importado en un arbol cliente
- `cookies()` o `createSupabaseServerClient()` filtrados hacia Client Components
- modulos mixtos que combinan helpers puros con acceso server-only
- contaminacion accidental entre App Router, server actions y componentes cliente

El disparador real fue el hotfix de S.4.1, donde un modulo mixto de eventos arrastraba `next/headers` hacia el timeline cliente.

## 2. Modulos marcados como server-only

Quedaron explicitamente o materialmente server-only:

- `lib/supabase/server.ts`
- `lib/supabase/service.ts`
- `lib/orders/events.server.ts`
- `lib/admin/context.ts`
- `lib/admin/team.ts`
- `lib/business/public.ts`
- `lib/catalog/public.ts`
- `lib/categories/admin.ts`
- `lib/products/admin.ts`
- `lib/super-admin/context.ts`
- `lib/super-admin/businesses.ts`
- `lib/super-admin/users.ts`

Tambien cuentan como server-only por naturaleza:

- `app/**/actions.ts`
- `app/**/route.ts`
- server pages que resuelven data antes de hidratar client components

## 3. Modulos shared / client-safe

Quedaron claramente client-safe o shared:

- `lib/orders/events.shared.ts`
- `lib/orders/presenter.ts`
- `lib/orders/assignment.ts`
- `lib/orders/realtime.ts`
- `lib/orders/sorting.ts`
- `lib/orders/queue-pressure.ts`
- `lib/orders/workspace.ts`
- `lib/admin/permissions.ts`
- `lib/cart/local.ts`
- `lib/browser/client-actions.ts`
- `lib/supabase/client.ts`

Estos modulos pueden contener:

- types
- labels
- formatters
- patch helpers puros
- transforms serializables
- APIs browser-only si viven en arbol cliente

## 4. Modulos separados en esta pasada

Separacion aplicada:

- antes:
  - `lib/orders/events.ts`
    - mezclaba acceso server-only con helpers consumidos por client

- despues:
  - `lib/orders/events.server.ts`
    - queries e inserts de eventos
  - `lib/orders/events.shared.ts`
    - tipos, labels, fallback y helpers puros de timeline

Este split elimina la fuga indirecta de `next/headers` hacia el timeline cliente.

## 5. Patrones peligrosos detectados

Patrones a vigilar:

- un mismo archivo exporta:
  - types para UI
  - y queries con `createSupabaseServerClient()`
- helpers de presentacion mezclados con `cookies()` o `headers()`
- barrels `index.ts` que reexportan modulos server-only junto con helpers shared
- client components importando modulos que "solo usan types", pero desde archivos que tambien hacen trabajo server-only
- modulos `lib/*` sin `server-only` aunque en la practica dependan de `next/headers` o service role

## 6. Ejemplos correctos e incorrectos

### Correcto

- `lib/orders/events.server.ts`
  - server-only
  - usa Supabase server/service
- `lib/orders/events.shared.ts`
  - tipos y formatters puros
- client components importan solo `events.shared`
- route handlers y server actions importan `events.server`

### Incorrecto

- `lib/orders/events.ts`
  - exporta `buildOrderTimelineEventLabel()`
  - y tambien `getOrderEventsForOrder()`
  - y ese modulo llega a `order-human-timeline.tsx`

### Correcto

- `lib/browser/client-actions.ts`
  - utilidades browser-only
  - no importa server clients

### Incorrecto

- un helper reusable para UI que adentro hace:
  - `await createSupabaseServerClient()`
  - o `cookies()`

## 7. Riesgos pendientes

Riesgos todavia visibles:

- `lib/orders/admin.ts` sigue siendo un modulo mixed-risk:
  - contiene queries server-side
  - y tambien exporta tipos usados por client via `import type`
  - hoy no rompe, pero no es la forma mas robusta de largo plazo
- otros modulos de `lib/*` pueden quedar "de facto" server-only aunque no siempre tengan split por `*.shared.ts`
- no hay una regla automatica de lint/CI que bloquee estos imports antes del build

## 8. Convenciones nuevas

Usar estas convenciones cuando un modulo cruce boundary:

- `*.server.ts`
  - queries server-side
  - Supabase SSR / service
  - `next/headers`
  - env privados

- `*.shared.ts`
  - types
  - labels
  - formatters
  - helpers puros
  - transforms serializables

- `*.client.ts`
  - utilidades browser-only
  - clipboard
  - share
  - `navigator`
  - `window`

## 9. Reglas arquitectonicas para futuros cambios

1. Si un modulo importa `next/headers`, `cookies()`, `createSupabaseServerClient()` o service role:
   - debe ser server-only
2. Si un helper necesita ser usado por Client Components:
   - no puede vivir en un modulo que haga acceso server-side
3. Si un archivo exporta tanto data access como formatters:
   - separar antes de que llegue a UI cliente
4. Evitar barrels que mezclen shared y server-only
5. Preferir `import type` para tipos compartidos, pero no confiar en eso como unica proteccion si el modulo sigue siendo mixto

## 10. Resultado de esta pasada

- se corrigio el leak real de `events`
- se endurecieron varios modulos server-only con `import "server-only"`
- no se hizo migracion masiva
- no se toco UX ni pipelines operativos
