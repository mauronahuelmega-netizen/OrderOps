# PROD-2 — Order Mutation Production Runtime Reproduction & Dispatch Audit

## Objetivo

Reproducir y aislar en runtime el error de producción donde crear pedido manual funciona pero mutaciones de estado/asignación fallan con `POST /admin/dashboard → 500`, sin aplicar fixes funcionales.

## Contexto

- **PROD-1** identificó capa común de mutación (guard + UPDATE user-auth/RLS) e instrumentó `console.error` con prefijos forenses.
- Incidente reportado: logs PROD-1 **no aparecen** en Vercel Runtime Logs summary; sólo request 500.
- Commit de diagnóstico en `main`: `6e7918e` — *Add production order mutation diagnostics*.

## Preflight Git

```txt
Branch: main (up to date with origin/main)
HEAD / origin/main: 6e7918ef1050da315a0e83b41ed723358db7f714
Último commit: 6e7918e Add production order mutation diagnostics
Cambios locales no commiteados: next-env.d.ts, tsconfig.tsbuildinfo (artefactos build; no funcionales)
```

No hay cambios funcionales pendientes fuera de artefactos generados.

## Preflight instrumentation

Búsqueda en repo — prefijos PROD-1 presentes:

| Prefijo | Archivo | Líneas (aprox.) |
|---------|---------|-----------------|
| `[order-mutation:status:error]` | `app/admin/(protected)/orders/[id]/actions.ts` | helper `logSupabaseActionError` |
| `[order-mutation:status:guard]` | idem | guard fail |
| `[order-mutation:status:empty-update]` | idem | UPDATE 0 rows |
| `[order-mutation:assignment:error]` | idem | helper |
| `[order-mutation:assignment:guard]` | idem | guard fail |
| `[order-mutation:assignment:empty-update]` | idem | UPDATE 0 rows |
| `[store-session-guard:error]` | `lib/store-sessions/admin.ts` | guard + `getActiveStoreSession` throw |

**Gap de instrumentación:** no hay log en la **primera línea** de la action (pre-`requireAdminPermission`). Si el fallo es dispatch/runtime antes del cuerpo, ningún prefijo aparecerá — coherente con síntoma reportado.

## Validaciones locales

| Comando | Resultado |
|---------|-----------|
| `npm run build` | **pass** — Next.js 16.2.9 (Turbopack); warning `middleware` → `proxy` deprecado (deuda conocida) |
| `npx tsc --noEmit` | **pass** (ejecutado vía build TS step + corrida explícita sin errores) |
| `npm run lint` | **intermitente** — fallo ESLint circular config en un entorno; baseline previa **0 errors / 17 warnings** `no-img-element` |

## Local production test — npm run start

| Paso | Resultado |
|------|-----------|
| `npm run build` + `npm run start` | **pass** — servidor en `http://localhost:3000` (Ready ~647ms) |
| `/admin/login` | **pass** — formulario Email/Contraseña renderiza |
| Flujo autenticado (sesión → crear → tomar → preparar → modal) | **NOT EXECUTED** |

**Motivo NOT EXECUTED:** `.env.local` existe y está en `.gitignore`, pero **no contiene** `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`. Las credenciales QA referidas por el usuario no están disponibles en el entorno del agente (no se leen ni persisten valores de `.env.local`).

**Interpretación:** Caso **indeterminado** localmente. Servidor production local levanta; falta login QA para clasificar Caso A/B/C.

**Acción recomendada al operador:** agregar temporalmente en `.env.local` (gitignored):

```env
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
```

y repetir flujo manual observando terminal `npm run start` por prefijos PROD-1.

## Production canonical URL test

**URL:** `https://orderops.vercel.app/admin/login`

| Paso | Resultado |
|------|-----------|
| Login page | **pass** — renderiza panel admin |
| `/admin/dashboard` sin auth | redirect a login (esperado) |
| Flujo autenticado completo | **NOT EXECUTED** — sin credenciales QA en entorno seguro |

**Resultado mutations:** **NOT EXECUTED** (bloqueado por auth).

## Production deployment URL test

| Item | Estado |
|------|--------|
| Deployment URL específica (`order-r65a1g3n2-...`) | **NOT EXECUTED** — sin acceso a Vercel Deployments UI / `gh` CLI no instalado |
| Comparación alias vs deployment | **NOT EXECUTED** |

**Evidencia indirecta:** `origin/main` = `6e7918e`; si Vercel auto-deploy desde `main`, el alias debería servir ese commit. Falta confirmación en dashboard Vercel.

## Vercel deployment verification

| Campo | Valor conocido / pendiente |
|-------|---------------------------|
| Commit esperado | `6e7918e` |
| Branch | `main` |
| URL canónica probada | `https://orderops.vercel.app` |
| Deployment ID | **pendiente** — verificar en Vercel UI |
| Environment | Production (asumido) |
| `gh` CLI | no disponible en entorno Windows del agente |

## Vercel runtime logs

| Pregunta | Estado |
|----------|--------|
| ¿Aparecen prefijos PROD-1? | **no verificado** — sin acceso a Vercel Logs en esta sesión |
| ¿Sólo summary 500? | **reportado por operador** en PROD-1 (síntoma previo) |
| Stack trace / digest Next | **pendiente** — revisar en Vercel tras repro con auth |
| “Failed to find Server Action” | **pendiente** — buscar texto exacto en logs |

**Hipótesis si 500 sin prefijos:** fallo **antes** del cuerpo de business action (dispatch, action ID stale, o error Next runtime no loggeado por summary view).

## Env vars audit

### Local (`.env.local` — solo nombres de clave, sin valores)

| Variable | Presente local |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | yes |
| `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` | yes |
| `WEB_PUSH_VAPID_PRIVATE_KEY` | yes |
| `WEB_PUSH_CONTACT` | yes |
| `NEXT_PUBLIC_SITE_URL` | no |
| `INTERNAL_API_SECRET` | no |
| `CRON_SECRET` | no |
| `E2E_ADMIN_EMAIL` | no |
| `E2E_ADMIN_PASSWORD` | no |

### Vercel Production / Preview

| Variable | Production | Preview | Observación |
|----------|------------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **pendiente** | **pendiente** | verificar project ref en Vercel UI (sin pegar valor) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **pendiente** | **pendiente** | |
| `SUPABASE_SERVICE_ROLE_KEY` | **pendiente** | **pendiente** | no crítico para mutación kanban |
| `NEXT_PUBLIC_SITE_URL` | **pendiente** | **pendiente** | no referenciado en paths auditados |
| `INTERNAL_API_SECRET` | **pendiente** | **pendiente** | no en repo |
| `CRON_SECRET` | **pendiente** | **pendiente** | no en repo |

**Nota:** auditoría Vercel requiere acceso manual a Project → Settings → Environment Variables.

## Supabase consistency check

**Estado:** **NOT EXECUTED** — Supabase MCP (`plugin-supabase-supabase`) en error en Cursor; sin acceso dashboard en esta sesión.

Checklist manual (solo SELECT; usar placeholders):

```sql
-- Usuario QA (no guardar email en docs si es sensible)
select id, email from auth.users where email = '<email QA>';

-- Profile (ajustar columna user id según schema real: profiles.id = auth.users.id)
select id, business_id, role from public.profiles where id = '<user_id>';

-- Sesiones recientes
select id, business_id, opened_at, closed_at, status
from public.store_sessions
where business_id = '<business_id>'
order by opened_at desc limit 5;

-- Pedidos recientes
select id, business_id, status, created_at, assigned_to
from public.orders
where business_id = '<business_id>'
order by created_at desc limit 5;

-- Policies UPDATE orders
select polname from pg_policy p
join pg_class c on c.oid = p.polrelid
where c.relname = 'orders' and polcmd = 'w';
```

**Schema note:** `orders` **no tiene** `store_session_id` — pertenencia por `created_at >= session.opened_at` (C4).

## Server Action dispatch audit

### Imports y call sites

| Action | Definida en | Importada desde | Invocación |
|--------|-------------|-----------------|------------|
| `updateOrderStatusAction` | `app/admin/(protected)/orders/[id]/actions.ts` | `order-card-quick-actions.tsx`, `status-form.tsx` | `startTransition` + `await action({}, formData)` |
| `updateOrderAssignmentAction` | idem | `order-assignment-controls.tsx` | idem |
| `createManualOrderAction` | `app/admin/(protected)/orders/actions.ts` | `manual-order-modal.tsx` | `await createManualOrderAction({...})` |

**No** se usan `formAction=` ni props de server action desde Server Components. Patrón: **import directo en Client Components** del dashboard.

### POST target

Invocaciones desde kanban en `/admin/dashboard` → Next.js postea a **`POST /admin/dashboard`** (comportamiento esperado; no es bug de routing por sí solo).

### Diferencia estructural relevante

```txt
Creación (funciona en prod):  orders/actions.ts          — ruta ESTÁTICA
Mutación (falla en prod):     orders/[id]/actions.ts     — ruta con segmento DINÁMICO [id]
```

Ambas se importan en client components del mismo dashboard. **PROD-1 modificó sólo** `orders/[id]/actions.ts` → los **action IDs** de mutación cambian en cada deploy que toque ese archivo; `createManualOrderAction` no cambió → ID estable.

### Respuestas audit

```txt
¿Actions desde archivo correcto?        Sí — imports explícitos verificados.
¿Props a Client Components?             No — import directo + startTransition.
¿formAction?                            No.
¿Usadas desde /admin/dashboard?         Sí — componentes montados en AdminDashboardOrders.
¿Next 16 / Turbopack bundle issue?      POSIBLE — action ID mismatch post-deploy.
¿Mezcla deployment viejo + cliente nuevo? LIKELY si usuario no hard-refreshed tras 6e7918e.
```

### Server Action dispatch suspicion

**¿Activada?** **yes** — condición parcialmente cumplida:

```txt
POST /admin/dashboard → 500
prefijos PROD-1 no en summary (reportado)
create manual OK (action file distinto, no recompiled ID en PROD-1)
```

**Clasificación:** **LIKELY** — runtime/dispatch o cliente stale **antes o alrededor** de ejecutar mutación, **además de** hipótesis business-layer de PROD-1 (guard/RLS).

**Matiz:** si tras incógnito + commit 6e7918e confirmado siguen sin prefijos, priorizar búsqueda de digest `"Failed to find Server Action"` en logs completos (no summary).

## Hipótesis evaluadas

| ID | Hipótesis | Estado | Evidencia |
|----|-----------|--------|-----------|
| A | Fallo antes de server actions | **LIKELY** | 500 sin logs PROD-1; create (otro module) OK |
| B | Fallo en guard sesión | **POSSIBLE** | Requiere logs `[store-session-guard:error]` — no capturados aún |
| C | Fallo en UPDATE directo | **POSSIBLE** | PROD-1 LIKELY; requiere `[order-mutation:*:empty-update]` o error metadata |
| D | RLS en Supabase prod | **POSSIBLE** | RPC create bypass; UPDATE no — pendiente SQL |
| E | Stale client / deployment mismatch | **LIKELY** | PROD-1 cambió sólo mutate actions; create sin cambio funciona |
| F | Problema sólo Vercel | **UNKNOWN** | Local auth test no ejecutado |
| G | También local `npm run start` | **UNKNOWN** | NOT EXECUTED (sin credenciales QA) |

## Responsable probable

| Sospechoso | Estado | Evidencia | Próximo paso |
|------------|--------|-----------|--------------|
| Server Action dispatch / stale action ID | **LIKELY** | Mutate en `[id]/actions.ts` recompilado en 6e7918e; create OK; 500 sin prefijos | Incógnito + hard refresh; buscar "Failed to find Server Action" en Vercel |
| RLS UPDATE vs RPC create | **LIKELY** | PROD-1; create SECURITY DEFINER | SQL policies en prod; logs `empty-update` |
| Guard ORDER_OUTSIDE_ACTIVE_SESSION | **POSSIBLE** | Mutación más estricta que creación | Logs `:guard`; SQL ventana created_at |
| Env vars Vercel | **UNKNOWN** | No auditado sin dashboard | Checklist Vercel presence |
| Supabase project mismatch | **UNKNOWN** | No verificado | Comparar project ref URL vs Vercel |
| Logging no visible en summary | **CONFIRMED** | Vercel summary puede omitir `console.error` | Abrir log stream completo / función |

**Responsable probable (síntesis):** **LIKELY E + LIKELY A** (dispatch/stale client o runtime antes de business logs), con **LIKELY G** (RLS/guard) como capa business si dispatch se descarta tras repro autenticada.

## Evidencia

```txt
- git HEAD = 6e7918e en main/origin.
- Instrumentación PROD-1 presente en código desplegado esperado.
- createManualOrderAction: orders/actions.ts (estático).
- updateOrderStatusAction / updateOrderAssignmentAction: orders/[id]/actions.ts (dinámico; modificado PROD-1).
- Cliente: catch genérico en HTTP 500 (order-card-quick-actions, status-form).
- Producción canónica responde; dashboard exige auth.
- npm run start local OK; flujo autenticado no ejecutado.
- gh / Vercel Logs / Supabase MCP no disponibles en sesión agente.
```

## Qué se preservó

- Sin cambios de lógica, UI, DB, RLS, realtime, optimistic.
- Sin credenciales en docs, commits ni logs.
- `.env.local` no leído ni documentado con valores.

## Qué NO se cambió

Código de aplicación sin modificaciones en PROD-2 (doc-only + QA parcial).

## Riesgos / deuda

```txt
- P1 I-9 abierto: mutaciones prod rotas.
- QA autenticada bloqueada sin E2E vars locales.
- Vercel env presence no verificado automáticamente.
- ESLint flake intermitente en entorno agente.
- middleware→proxy warning Next 16 (deuda conocida).
```

## Próximo paso recomendado

1. **Operador:** agregar `E2E_ADMIN_*` a `.env.local` (gitignored) o ejecutar repro manual con credenciales QA.
2. **Local:** `npm run build && npm run start` → flujo completo → capturar terminal.
3. **Prod:** incógnito en `https://orderops.vercel.app` → confirmar deploy `6e7918e` en Vercel UI → repetir mutaciones.
4. **Vercel Logs:** filtro texto `order-mutation` y `Failed to find Server Action` (log completo, no summary).
5. **Supabase:** ejecutar SQL checklist (policies UPDATE, ventana sesión).
6. **Si dispatch confirmado:** considerar mover mutate actions a `orders/actions.ts` o `dashboard/actions.ts` en fase fix (fuera PROD-2).
7. **Si guard/RLS confirmado:** fix acotado según log específico (PROD-3).

---

*PROD-2 — reproducción runtime y dispatch audit. Sin fix funcional.*
