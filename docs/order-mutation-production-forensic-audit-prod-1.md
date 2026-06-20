# PROD-1 — Order Mutation Production Forensic Audit

## Objetivo

Identificar con evidencia de código por qué en **producción Vercel** fallan las mutaciones de pedidos existentes (cambio de estado y asignación) mientras la creación manual funciona. Esta fase es **solo diagnóstico**: no aplica fixes funcionales.

## Contexto del incidente

Dashboard operativo en `/admin/dashboard`. Usuario autenticado, sesión visible, pedido manual creado y visible en kanban. Al mutar estado o tomar pedido, la UI entra en estado de carga y termina en toast de error. Vercel registra `POST /admin/dashboard` con status **500** en ~16–17 ms. Middleware y Auth responden correctamente.

## Síntomas observados

```txt
1. Login en producción OK.
2. Dashboard carga OK.
3. Sesión operativa visible en UI.
4. Crear pedido manual OK; aparece en kanban.
5. “Preparar” / quick action → “Actualizando...” → toast error.
6. Modal “Guardar estado” falla igual.
7. “Tomar pedido” falla.
8. Toast genérico: “No pudimos actualizar el pedido” (status) / “No pudimos actualizar el responsable” (assignment).
9. Vercel Runtime Logs: POST /admin/dashboard → 500.
10. Middleware 200; /auth/v1/user OK.
11. Latencia ~16–17 ms (fallo temprano, no timeout).
```

## Archivos auditados

| Área | Archivos |
|------|----------|
| Server actions mutación | `app/admin/(protected)/orders/[id]/actions.ts` |
| Server actions creación | `app/admin/(protected)/orders/actions.ts` |
| Dashboard / sesión | `app/admin/(protected)/dashboard/actions.ts`, `page.tsx` |
| Guards sesión | `lib/store-sessions/admin.ts`, `lib/store-sessions/types.ts` |
| Supabase clients | `lib/supabase/server.ts`, `lib/supabase/service.ts`, `lib/env.ts` |
| Auth / permisos | `lib/admin/context.ts`, `lib/admin/action-errors.ts` |
| Orders read model | `lib/orders/admin.ts`, `lib/orders/events.server.ts` |
| UI callers (solo lectura) | `order-card-quick-actions.tsx`, `status-form.tsx`, `order-assignment-controls.tsx` |
| RLS / RPC / schema | `supabase/migrations/*` (orders UPDATE, store_sessions, create_order, assignment, order_events) |
| Middleware | `middleware.ts` |
| Docs previas | K1–K5 kanban, `manual-order-creation-audit.md`, `board-orders-execution-area-phase-m5-1.md`, `board-orders-execution-area-v1-final-handoff.md` |

**Docs referenciados ausentes:** ninguno bloqueante (todos los `docs/kanban-*.md` listados existen).

## Búsquedas ejecutadas

```bash
rg "updateOrderStatusAction|updateOrderAssignmentAction" app components lib
rg "assertActiveStoreSession|NO_ACTIVE_SESSION|ORDER_OUTSIDE_ACTIVE_SESSION|store_session" app lib components
rg "createManualOrderAction|create_order|ManualOrder" app components lib
rg "SUPABASE|NEXT_PUBLIC_SUPABASE|SERVICE_ROLE|process.env" app lib components middleware.ts
rg "orders_update|store_sessions_select" supabase app lib
rg "business_id|updateOrders|requireAdminPermission" app lib components
```

**Símbolos expandidos:** `create_order` (SECURITY DEFINER), `orders_update_own_business`, `getActiveStoreSession`, `logActionFailure`, `getAdminDashboardOrderById`.

## Camino que funciona: creación manual

**Action:** `createManualOrderAction` (`app/admin/(protected)/orders/actions.ts`)

```txt
1. requireAdminPermission("updateOrders")
2. validateCreateManualOrderInput(...)
3. assertActiveStoreSessionForOrderCreation({ businessId })
      → resolveOpenActiveStoreSession → getActiveStoreSession
      → requiere fila store_sessions status=open, closed_at null
      → NO valida ventana created_at del pedido (aún no existe)
4. createSupabaseServerClient() (user-auth + cookies)
5. supabase.rpc("create_order", { p_business_id, items, ... })
      → función SECURITY DEFINER (bypass RLS en INSERT)
      → valida on_demand_mode_active en business_settings
6. getAdminDashboardOrderById(orderId) para hidratar card
7. Retorna { ok: true, order } o { ok: false, code, error } — sin throw en guard/RPC
```

**Datos escritos:** `orders` + `order_items` vía RPC. No se persiste `store_session_id` (columna no existe). Pertenencia a sesión inferida por `created_at >= session.opened_at` en mutaciones posteriores.

## Caminos que fallan: status y assignment

**Actions:** `updateOrderStatusAction`, `updateOrderAssignmentAction` (`app/admin/(protected)/orders/[id]/actions.ts`)

Flujo compartido:

```txt
1. requireAdminPermission("updateOrders")
2. createSupabaseServerClient()
3. SELECT orders (id, created_at, status, assigned_to, assigned_at)
      filtrado por id + business_id del profile
4. assertActiveStoreSessionForOrderMutation({ businessId, order })
      → misma sesión abierta que creación
      → ADEMÁS isOrderWithinActiveSession:
           order.created_at >= session.openedAt
           (o store_session_id match si existiera — no existe en schema)
5. UPDATE directo supabase.from("orders").update(...)
      → cliente user-auth, sujeto a RLS orders_update_own_business
6. createOrderEvent(...) (fallo no bloquea; errores tragados)
7. return { success, order, event } o { error, code }
```

**POST a `/admin/dashboard`:** esperado. Las actions viven en `orders/[id]/actions.ts` pero se invocan desde componentes del dashboard; Next.js postea al route de la página que las llama.

## Comparación creación vs mutación

| Aspecto | Creación manual | Status / Assignment |
|---------|-----------------|---------------------|
| Permiso | `updateOrders` | `updateOrders` (igual) |
| Cliente Supabase | `createSupabaseServerClient` | Igual |
| Guard sesión | `assertActiveStoreSessionForOrderCreation` | `assertActiveStoreSessionForOrderMutation` (+ ventana pedido) |
| Write path | RPC `create_order` SECURITY DEFINER | `UPDATE` directo con RLS |
| Validación `on_demand_mode_active` | En RPC | No en UPDATE (solo guard store_sessions) |
| `assigned_to` / `assigned_at` | No requeridos al crear | SELECT + UPDATE incluyen columnas |
| Error handling | `{ ok: false, code, error }` estructurado | `throw` interno → catch → `{ error }` genérico |
| Logging prod | RPC error vía `logActionFailure` (solo dev) | Igual + ahora instrumentación PROD-1 |

**Validaciones compartidas:** permiso `updateOrders`, cliente user-auth, existencia de sesión abierta en `store_sessions`.

**Solo en mutación:** SELECT del pedido actual; `isOrderWithinActiveSession`; UPDATE con RLS; eventos opcionales.

**Dato que mutación requiere y creación no:** pedido existente con `created_at` comparable a `session.opened_at`; columnas `assigned_to`/`assigned_at` en SELECT/UPDATE.

**Query antes del UPDATE:** `SELECT` orders + `SELECT` store_sessions (guard) + luego `UPDATE`.

**Error antes de request visible:** `getSupabaseEnv()` si faltan vars (afectaría también creación — descartado si create OK). `getActiveStoreSession` puede **throw** si error DB no es “tabla missing” (propaga al catch de la action).

## Guard de sesión activa

**Ubicación:** `lib/store-sessions/admin.ts`

### Creación — `assertActiveStoreSessionForOrderCreation`

1. Consulta `store_sessions` (`status=open`, `closed_at` null) por `business_id`.
2. Espera fila abierta; si no → `NO_ACTIVE_SESSION`.
3. Usa `business_id` del profile (parámetro), no del pedido.
4. **Try/catch:** errores → `UNKNOWN` + log (no throw).

### Mutación — `assertActiveStoreSessionForOrderMutation`

1. Valida `order.business_id === businessId` si viene informado.
2. Misma resolución de sesión abierta.
3. **`isOrderWithinActiveSession`:** `order.created_at >= session.openedAt` (timestamptz).
4. Códigos: `NO_ACTIVE_SESSION`, `ORDER_OUTSIDE_ACTIVE_SESSION`, `UNAUTHORIZED`.
5. **Sin try/catch propio:** si `getActiveStoreSession` throw, sube a la action.

### `getActiveStoreSession`

- Tabla missing → `null` + `console.warn` (guards fallan `NO_ACTIVE_SESSION`).
- Otro error PostgREST/RLS → **throw** `Failed to load active store session: ...`

### Escenarios producción plausibles

| Escenario | Creación | Mutación |
|-----------|----------|----------|
| Solo `on_demand_mode_active` sin fila `store_sessions` | Falla guard (si código actual desplegado) | Falla guard |
| Pedido anterior a `session.opened_at` (sesión reabierta) | N/A | `ORDER_OUTSIDE_ACTIVE_SESSION` |
| Tabla `store_sessions` no migrada | Ambos fallan guard | Ambos fallan guard |
| RLS bloquea SELECT `store_sessions` | Throw en getActiveStoreSession | Throw (mutación sin try en guard) |
| Pedido recién creado en misma sesión | OK | Debería pasar ventana |

**Errores ocultos:** `logActionFailure` solo corre si `NODE_ENV === "development"` (`lib/admin/action-errors.ts`). En producción los catch devolvían mensaje genérico **sin log server-side** hasta PROD-1.

**UI vs guard:** la UI puede mostrar sesión activa vía `on_demand_mode_active` / hydration aunque el guard consulte `store_sessions`. Si creación funciona con guard actual, debe existir sesión coherente en DB (o deploy desactualizado en un camino).

## Supabase clients

| Action | Cliente | Auth | Env vars |
|--------|---------|------|----------|
| `createManualOrderAction` | `createSupabaseServerClient` | User JWT vía cookies | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `updateOrderStatusAction` | Igual | Igual | Igual |
| `updateOrderAssignmentAction` | Igual | Igual | Igual |
| Guards `getActiveStoreSession` | Igual | Igual | Igual |
| `createOrderEvent` | Igual | Igual | Igual |
| `getOrderEventsForOrder` (no en mutación) | service client | Service role | + `SUPABASE_SERVICE_ROLE_KEY` |

**Mutaciones NO usan service role.** Creación vía RPC usa `SECURITY DEFINER` en Postgres (no service role en app).

**Si falta env:** `getSupabaseEnv()` throw al crear cliente — afectaría todas las server actions por igual.

## Variables de entorno requeridas

| Variable | Usada en | Requerida para | Público/Server | Riesgo si falta |
|----------|----------|----------------|----------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/env.ts`, clients | Crear, mutar, guards, auth | Público (build) | Throw al crear cliente; dashboard inoperable |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/env.ts`, clients | Crear, mutar, guards | Público (build) | Igual |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/service.ts` | Timeline con emails, push admin | Server only | No en path crítico de mutación kanban |
| `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` | push client | Notificaciones browser | Público | No afecta mutación |
| `WEB_PUSH_VAPID_PRIVATE_KEY` | `web-push.server.ts` | Envío push | Server | No afecta mutación |
| `WEB_PUSH_CONTACT` | web-push | VAPID contact | Server | No afecta mutación |
| `NODE_ENV` | `logActionFailure` | Habilita logs dev | Runtime | En prod ocultaba errores de actions |

**No aparecen en repo:** `INTERNAL_API_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` (no usados en paths auditados).

## RLS / policies audit

### `orders` (repo: `20260427021000_super_admin_roles_and_rls.sql`)

| Policy | Operación | Condición |
|--------|-----------|-----------|
| `orders_select_own_business` | SELECT | `business_id` = profile.business_id OR super_admin |
| `orders_update_own_business` | UPDATE | USING + WITH CHECK mismo criterio business_id / super_admin |
| INSERT directo | — | No policy INSERT para authenticated (creación vía RPC) |

### `create_order` RPC

- `SECURITY DEFINER` + `grant execute to anon, authenticated`
- Inserta en `orders` / `order_items` **sin pasar por RLS del cliente user**

### Implicación forense

**Creación puede funcionar aunque el rol user no tenga UPDATE RLS efectivo en producción**, si:

- La migración `orders_update_own_business` no está aplicada en prod, o
- Hay drift de schema (columnas assignment), o
- UPDATE devuelve 0 filas por RLS (Supabase: sin error, `data` null)

### `store_sessions`

- SELECT/INSERT/UPDATE por `business_id` del profile (`20260604143000_v63_store_sessions.sql`)

### `order_events`

- INSERT policy `order_events_insert_own_business` — fallo no bloquea mutación (try/catch interno).

**Verificación DB real:** needs Supabase dashboard verification.

### Checklist SQL lectura (manual)

```sql
-- Policies UPDATE en orders
select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
join pg_class on pg_class.oid = polrelid
where relname = 'orders';

-- Columnas assignment
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
  and column_name in ('assigned_to', 'assigned_at');

-- Sesión abierta del negocio (reemplazar :business_id)
select id, status, opened_at, closed_at
from public.store_sessions
where business_id = :business_id and status = 'open' and closed_at is null;

-- Pedido vs ventana sesión (reemplazar :order_id)
select o.id, o.created_at, s.opened_at,
       o.created_at >= s.opened_at as within_session
from public.orders o
cross join lateral (
  select opened_at from public.store_sessions
  where business_id = o.business_id and status = 'open' and closed_at is null
  order by opened_at desc limit 1
) s
where o.id = :order_id;
```

## Error handling actual

### Server actions mutación

1. **`logActionFailure`:** solo en development — **sin `console.error` en producción** (pre-PROD-1).
2. **Errores Supabase en UPDATE:** `throw new Error("No pudimos actualizar...")` → catch → `getActionErrorMessage` → `{ error }` con mensaje genérico (pierde `code`/`details` de PostgREST).
3. **Guard:** retorna `{ error, code }` sin throw — mensaje específico de sesión.
4. **`createOrderEvent`:** error loggeado en `events.server.ts` con `console.error` (sí en prod), no propaga.

### Cliente UI

| Componente | `result.error` | `catch` (HTTP/throw) |
|------------|----------------|---------------------|
| `order-card-quick-actions` | Muestra `result.error` | “No pudimos actualizar el pedido” |
| `status-form` | Muestra `result.error` + session blocked UX | Igual genérico |
| `order-assignment-controls` | Muestra `result.error` + session blocked | “No pudimos actualizar el responsable” |

**Toast genérico “No pudimos actualizar el pedido”** puede venir de:

- `catch` del cliente (típico si HTTP **500** en server action), o
- `result.error` cuando el catch server devuelve el mismo texto tras `throw` interno.

**Códigos internos expuestos al cliente:** `code` en guard (`NO_ACTIVE_SESSION`, etc.); no en errores de UPDATE/SELECT genéricos.

## Instrumentación agregada

**Archivos modificados (solo logging):**

- `app/admin/(protected)/orders/[id]/actions.ts`
  - `[order-mutation:status:error]` / `[order-mutation:assignment:error]`
  - `[order-mutation:status:guard]` / `[order-mutation:assignment:guard]`
  - `[order-mutation:status:empty-update]` / `[order-mutation:assignment:empty-update]`
  - Metadata Supabase: `details`, `hint`, `status` (sin secrets)
- `lib/store-sessions/admin.ts`
  - `[store-session-guard:error]` en fallos de guard y antes de throw en `getActiveStoreSession`

**No se loggea:** cookies, tokens, keys, env values, PII de cliente.

## Hipótesis evaluadas

| ID | Hipótesis | Estado | Evidencia | Próximo paso |
|----|-----------|--------|-----------|--------------|
| A | Env var faltante en Vercel | **CLEARED** | Create + dashboard auth usan mismas vars | — |
| B | Vercel → Supabase project distinto | **POSSIBLE** | No verificable desde repo | Comparar project ref URL vs Supabase dashboard |
| C | Variable server-side inexistente en prod | **CLEARED** | Mutación no usa vars extra vs creación | — |
| D | Guard sesión rechaza mutación | **LIKELY** | Mutación usa guard estricto + sin try/catch vs creación | Logs `[store-session-guard:error]` / `:guard` |
| E | Pedido fuera de ventana sesión | **LIKELY** | `created_at >= opened_at`; sesión reabierta bloquea viejos | SQL checklist; logs `ORDER_OUTSIDE_ACTIVE_SESSION` |
| F | Profile/business_id/role distinto | **POSSIBLE** | Mismo permiso `updateOrders` para create | Verificar profile en prod |
| G | RLS UPDATE / drift migrations | **LIKELY** | RPC definer vs UPDATE user client; policy en repo | SQL policies; logs `empty-update` o update error |
| H | Throw antes de Supabase / logging oculto | **CONFIRMED** | `logActionFailure` dev-only; throw en SELECT/UPDATE | Leer logs PROD-1 en Vercel |
| I | Next 16 server actions runtime | **POSSIBLE** | POST 500 ~16ms; Next 16.2.9 | Correlacionar con logs instrumentados |
| J | Columnas `assigned_to` missing | **CLEARED*** | *Si create + kanban hidratan assignment fields | Confirmar schema prod |
| J2 | Desync `on_demand` vs `store_sessions` | **POSSIBLE** | UI puede reflejar flag; guard usa tabla | Verificar fila `store_sessions` si create OK con guard actual |

## Responsable probable

**Clasificación principal: LIKELY — capa común de mutación (guard de sesión + UPDATE user-auth/RLS), no UI ni quick action aislado.**

Jerarquía:

1. **LIKELY G** — Divergencia **RPC SECURITY DEFINER (create)** vs **UPDATE con RLS user client (mutate)**. Explica create OK + mutate fail sin fallo de auth/env.
2. **LIKELY D/E** — Guard de mutación más estricto (`ORDER_OUTSIDE_ACTIVE_SESSION`) si el pedido no cae en ventana de `opened_at` actual.
3. **CONFIRMED H** — Ausencia de logging en producción impidió confirmar cuál de las capas anteriores falla en runtime.

**No CONFIRMED** hasta reproducir con logs Vercel post-deploy diagnóstico.

## Evidencia

```txt
- updateOrderStatusAction y updateOrderAssignmentAction comparten SELECT + assertActiveStoreSessionForOrderMutation + UPDATE.
- createManualOrderAction usa assertActiveStoreSessionForOrderCreation (sin ventana) + rpc create_order SECURITY DEFINER.
- orders_update_own_business existe en migraciones repo; INSERT user directo no existe.
- POST /admin/dashboard es el endpoint esperado para actions invocadas desde kanban.
- Cliente usa catch genérico en fallo HTTP 500 (order-card-quick-actions.tsx L201-206).
- logActionFailure silenciado en production (action-errors.ts L17-18).
```

## Qué se preservó

- Lógica de negocio, guards, RLS, schema, UI, optimistic, realtime, kanban, modal, manual order creation.
- Comportamiento funcional de mutaciones (solo logs adicionales).

## Qué NO se cambió

```txt
components/admin/orders/*
supabase/migrations/*
types/database.ts
package.json / lock
RLS / policies
optimistic UI / realtime / hydration
```

## Validaciones ejecutadas

```txt
npm run build: pass (Next.js 16.2.9; warning middleware→proxy deprecado — deuda conocida)
npx tsc --noEmit: pass
npm run lint: pass en corrida previa — 0 errors / 17 warnings no-img-element
            (corrida post-cambio: fallo transitorio ESLint config validator en entorno local;
             sin errores en archivos editados vía IDE linter)
```

## Próximo paso recomendado

1. **Deploy** commit con instrumentación diagnóstica a Vercel Production.
2. Reproducir “Preparar” y “Tomar pedido”.
3. En Runtime Logs buscar prefijos:
   - `[order-mutation:status:error]`
   - `[order-mutation:assignment:error]`
   - `[order-mutation:status:guard]` / `[order-mutation:assignment:guard]`
   - `[store-session-guard:error]`
   - `[order-mutation:status:empty-update]` (RLS silent deny)
4. Ejecutar checklist SQL en Supabase prod.
5. **Solo después** aplicar fix acotado (RLS migration, guard, o error surfacing) según log confirmado.

## Checklist Vercel/Supabase manual

### Vercel

```txt
- [ ] Confirmar deployment commit == último commit local (incluye guards C4 + PROD-1 logs).
- [ ] Confirmar env vars Production: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
- [ ] Confirmar project ref en URL coincide con Supabase esperado.
- [ ] SUPABASE_SERVICE_ROLE_KEY presente si se usan features con service client (no crítico para mutación).
- [ ] Redeploy después de cambiar env vars.
- [ ] Reproducir error y leer Runtime Logs con prefijos PROD-1.
- [ ] Correlacionar timestamp POST /admin/dashboard 500 con líneas de log.
```

### Supabase

```txt
- [ ] Project ref coincide con Vercel.
- [ ] Usuario admin en auth.users; profile con business_id correcto.
- [ ] Migraciones aplicadas: store_sessions, assigned_to/assigned_at, orders_update policy, order_events.
- [ ] business_settings.on_demand_mode_active vs fila store_sessions abierta.
- [ ] Pedido de prueba: created_at >= opened_at de sesión activa.
- [ ] Policies UPDATE orders visibles (ver SQL arriba).
- [ ] Role del usuario y permiso updateOrders (código: role en profiles).
```

---

*PROD-1 — diagnóstico forense. No constituye fix de producción.*
