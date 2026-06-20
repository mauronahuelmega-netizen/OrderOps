# PROD-4 — Public Checkout Anonymous Order Creation Fix

## Objetivo

Permitir que clientes públicos creen pedidos en `/b/[slug]/checkout` **sin sesión admin**, validando sesión operativa del negocio server-side.

## Contexto del incidente

- Dashboard admin y mutaciones corregidas (PROD-3).
- Checkout público cargaba catálogo y carrito.
- Sin login admin: mensaje “El negocio no está aceptando pedidos en este momento.” y submit bloqueado.
- Con login admin en el mismo navegador: pedido público sí entraba.

## Síntomas observados

```txt
- /b/[slug]/checkout accesible sin login admin.
- on_demand_mode_active false en UI para anon.
- Botón submit disabled cuando “cerrado”.
- RPC create_order desde browser anon fallaba o no se alcanzaba.
- Con cookies admin, business_settings visible vía RLS authenticated.
```

## Causa raíz

**CONFIRMED — AUTH COUPLED + RLS RISK en lectura de estado operativo.**

1. `getPublicBusinessBySlug` leía `business_settings` con `createSupabaseServerClient()` (cookies user-auth).
2. Para visitantes anónimos, RLS no devolvía settings (o error) → código forzaba `on_demand_mode_active: false`.
3. `CheckoutClient` usaba ese flag client-side para UI y bloqueo de submit.
4. `create_order` se invocaba desde **browser Supabase client** (anon), acoplado al contexto de cookies del navegador.

**CLEARED:** middleware no bloquea `/b/*`; no reutiliza actions admin; RPC no requiere `auth.uid()` (SECURITY DEFINER, grant anon).

## Archivos auditados

| Archivo | Hallazgo |
|---------|----------|
| `lib/business/public.ts` | settings vía user client; fallback false |
| `components/public/checkout/checkout-client.tsx` | RPC browser + flag SSR |
| `app/b/[slug]/checkout/page.tsx` | SSR business OK |
| `middleware.ts` | refresh session only; no admin gate en `/b` |
| `supabase/migrations/*` | policy public settings existe; prod puede fallar si anon sin row |
| `create_order` RPC | SECURITY DEFINER; valida `on_demand_mode_active` en DB |

## Búsquedas ejecutadas

```bash
rg "checkout|create_order|aceptando pedidos|on_demand" app components lib
rg "store_sessions|business_settings" app components lib
rg "createSupabaseBrowserClient|auth.getUser" components/public lib
```

## Flujo anterior

```txt
SSR checkout page
  → getPublicBusinessBySlug (user-auth server client)
  → business_settings RLS fail/null for anon
  → on_demand_mode_active = false
Client submit
  → guard client !onDemandModeActive → error / disabled
  → supabase.rpc("create_order") from browser anon client
```

## Flujo corregido

```txt
SSR checkout page
  → getPublicBusinessBySlug
  → business_settings via service role (server-only)
  → isBusinessAcceptingPublicOrders(businessId) via service role + store_sessions
  → on_demand_mode_active reflects operational open state (no admin auth)

Client submit
  → createPublicCheckoutOrderAction(slug, payload)
  → server validates slug, session operativa, payload, scheduled rules
  → service role supabase.rpc("create_order", ...)
  → returns orderId; client redirects to success
```

## Auth admin vs store session

| Concepto | Uso checkout público |
|----------|---------------------|
| Admin auth session | **No requerida** |
| Store operational session | **Sí** — `store_sessions` open row (service role) |
| `on_demand_mode_active` en UI | Derivado de sesión operativa activa |

Fallback si tabla `store_sessions` missing: `on_demand_mode_active` en `business_settings` (service role).

## Service role / server-side validation

- `createSupabaseServiceClient()` sólo en módulos `server-only`.
- Validación de payload duplicada server-side (nombre, teléfono, items, delivery, scheduled).
- Total calculado en RPC `create_order` (sin confiar en cliente).
- Logging: `[public-checkout:create-order:error]` sin PII completa.

## RLS / RPC audit

- **RPC `create_order`:** SECURITY DEFINER; grant `anon, authenticated`; no requiere `auth.uid()`.
- **Sin migration PROD-4:** service role invoca RPC server-side.
- **RLS sin cambios:** bypass controlado vía service role + validaciones.

## Middleware / proxy audit

```txt
matcher: /admin/:path*, /b/:path*
updateSession: refresh cookies only
/b/[slug]/checkout: NOT admin-protected ✓
```

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `lib/store-sessions/public.server.ts` | **nuevo** — `isBusinessAcceptingPublicOrders` (service role) |
| `lib/business/public.ts` | settings + operational flag vía service role |
| `app/b/[slug]/checkout/actions.ts` | **nuevo** — `createPublicCheckoutOrderAction` |
| `components/public/checkout/checkout-client.tsx` | server action en lugar de browser RPC |

## Logging agregado

- `[public-checkout:create-order:error]` — slug, itemCount, error metadata
- `[store-sessions:public]` — fallo lookup sesión
- `[public-business]` — fallo settings service lookup

## Qué se preservó

- dashboard admin auth
- admin order mutations
- session guards admin
- kanban/realtime/optimistic
- checkout visual (sin redesign)
- products/admin
- RLS/policies (sin relajar globalmente)
- instrumentación PROD-1

## Qué NO se cambió

- no DB/schema changes
- no migrations
- no RLS policy changes
- no admin auth changes
- no kanban changes
- no product admin changes
- no UI redesign
- middleware/proxy Next 16

## Validaciones ejecutadas

```txt
npm run build: pass (Next.js 16.2.9; warning middleware→proxy deprecado)
npx tsc --noEmit: pass
npm run lint: baseline 0 errors / 17 warnings no-img-element (o flake ESLint config en entorno agente)
```

## QA local recomendado

1. Incógnito → `/b/[slug]/catalogo` → agregar productos → checkout → enviar **sin login admin**.
2. Confirmar pedido en dashboard admin.
3. Cerrar sesión operativa admin → checkout debe mostrar “no aceptando pedidos”.
4. Carrito vacío, cantidades inválidas, productos no disponibles (RPC error mapping).

## QA producción recomendado

1. Incógnito en `https://orderops.vercel.app/b/[slug]/catalogo`.
2. Pedido con sesión operativa **abierta** → success.
3. Dashboard admin → pedido visible.
4. Cerrar sesión operativa → checkout bloqueado con copy correcto.
5. Vercel logs: sin auth-required; sin false closed por RLS anon.

## Riesgos / deuda restante

- Desync legacy `on_demand_mode_active=true` sin `store_sessions` → público bloqueado (intencional).
- QA producción pendiente post-deploy.
- `SUPABASE_SERVICE_ROLE_KEY` debe existir en Vercel Production.

## Próximo paso recomendado

Deploy + QA checklist producción checkout anónimo.

---

*PROD-4 — fix acotado checkout público anónimo.*
