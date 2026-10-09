# Auditoría del repositorio — Commercial Core V1

Fecha: 2026-10-08. Modo: lectura. No se aplicaron migraciones ni se leyeron valores de `.env.local`.

Clasificación: `VERIFIED` (archivo o símbolo), `INFERRED`, `MISSING`, `CONFLICT`, `BLOCKED`.

## 1. Stack

| Hallazgo | Clase | Evidencia |
| --- | --- | --- |
| Next `^16.2.9`, React `^19.2.7`, TypeScript `^5.8.3` | VERIFIED | `package.json` |
| `@supabase/supabase-js` `^2.49.8`, `@supabase/ssr` `^0.5.2` | VERIFIED | `package.json` |
| `sharp` `^0.34.5`, `web-push` `^3.6.7` | VERIFIED | `package.json` |
| Scripts npm: `dev`, `build`, `start`, `lint`, `lint:fix` | VERIFIED | `package.json` |
| Sin script `test` ni `typecheck`. Sin Jest, Vitest ni Playwright | VERIFIED | `package.json` |
| Checks existentes: `*.verify.ts` con `node:assert/strict`, corridos con `npx tsx`. `tsx` no está declarado como dependencia | VERIFIED | por ejemplo `lib/product-customization/order-preparation.verify.ts` |
| App Router bajo `app/`. Alias `@/` | VERIFIED | estructura del repo y reglas de `.cursorrules` |

## 2. Autenticación y tenancy

| Hallazgo | Clase | Evidencia |
| --- | --- | --- |
| Login admin con `signInWithPassword` | VERIFIED | `loginAction` en `app/admin/login/actions.ts` |
| Middleware refresca sesión solo en `/admin/:path*` y `/b/:path*` | VERIFIED | `middleware.ts`, `updateSession` en `lib/supabase/middleware.ts` |
| Cliente servidor anon + cookies | VERIFIED | `lib/supabase/server.ts` |
| Cliente browser | VERIFIED | `lib/supabase/client.ts` |
| Service role sin sesión persistida | VERIFIED | `lib/supabase/service.ts`, variable `SUPABASE_SERVICE_ROLE_KEY` |
| Contexto admin exige usuario y `profiles.business_id` | VERIFIED | `getAdminContext` / `requireAdminContext` en `lib/admin/context.ts` |
| Super-admin: `profiles.role = super_admin`, `business_id` nullable | VERIFIED | `lib/super-admin/context.ts`, migración `20260427030000_super_admin_profiles_nullable_business.sql` |
| Catálogo público por slug, sin usuario final | VERIFIED | `lib/business/public.ts`, `app/b/[slug]/` |
| Pedidos públicos vía RPC `create_order` | VERIFIED | `types/database.ts` función `create_order` |
| Clave de tenant: `business_id`. No existe `tenant_id` | VERIFIED | `.cursorrules`, esquema |

`ProfileRole` en `types/database.ts`: `admin | owner | manager | operator | viewer | super_admin`. Check en `supabase/migrations/20260516201000_s1_business_roles.sql`. Una columna, un rol. No hay roles múltiples.

## 3. Permisos de comercio

`lib/admin/permissions.ts`:

| Permiso | Quién |
| --- | --- |
| `viewOrders` | todos los roles de negocio |
| `updateOrders` | todos menos `viewer` |
| `manageNotifications` | owner, manager, operator |
| `manageTeam` | owner |
| `manageProducts` | owner, manager |
| `managePublicSettings` | owner, manager |

`normalizeBusinessAdminRole` colapsa `super_admin`, `admin` y `owner` a `owner` en la capa de aplicación.

`INFERRED`: las políticas RLS de productos nombran roles SQL (`owner`, `admin`, `manager`, `super_admin`) en paralelo al mapa TypeScript. Ejemplo: `supabase/migrations/20260909040000_products_manage_role_rls.sql`. No es un bug del Commercial Core, pero el guard de onboarding tiene que vivir en server actions y en RLS de catálogo, no solo en la UI.

Mutaciones de producto: `requireAdminPermission("manageProducts")` en `app/admin/(protected)/products/actions.ts`, incluyendo `price`.

## 4. Organizaciones

Tabla `public.businesses`: `id`, `name`, `slug` único, `whatsapp_number`, `is_active`, branding, hero. Origen: `20260426214500_t1_businesses_profiles.sql` y migraciones de marca posteriores.

`public.profiles`: `id` → `auth.users`, `business_id` nullable, `role`, `notification_preferences`.

`public.business_settings`: flags de operación del comercio, incluido `finance_enabled`. No describe suscripción SaaS de OrderOps.

Super-admin UI: `app/super-admin/(protected)/` (`page.tsx`, `businesses/page.tsx`, `users/page.tsx`).

## 5. Qué no existe del Commercial Core

`MISSING` en `lib/`, `app/` y `types/database.ts`:

- leads, oportunidades, tareas comerciales, deduplicación
- promotores, contratos, monotributo
- atribuciones, disputas
- programa Founder, comisiones, liquidaciones de promotor, facturas de promotor
- suscripciones SaaS y cobranzas de OrderOps al comercio
- bandeja `notifications` de plataforma
- correo transaccional (no hay Resend, Nodemailer ni SMTP de aplicación)

La spec en `docs/commercial-core-v1/FUNCTIONAL_SPEC.md` declara que no es una implementación. Ese documento es la única fuente de esas entidades.

`CONFLICT` de nombres, no de datos:

- `push_subscriptions` (`20260518113000_u4_push_subscriptions.sql`) es Web Push del admin de pedidos.
- `settle_order_financials` (`20260926200000_finance_order_settlement.sql`) cierra la caja de un pedido del comercio.
- «Solicitar demo» en `components/marketing/marketing-action.tsx` abre WhatsApp (`getMarketingContactUrl`). No registra un lead.
- `scheduled_min_lead_time_hours` es plazo de entrega, no un lead comercial.

## 6. Auditoría, notificaciones, storage

| Capacidad | Clase | Evidencia |
| --- | --- | --- |
| `order_events` | VERIFIED | `lib/orders/events.server.ts`, migración `20260516233000_s4_order_events.sql` |
| `finance_audit_events` | VERIFIED | `20260926014000_finance_ledger.sql`. Escritura dentro de RPC de finanzas. Sin `.from("finance_audit_events")` en `lib/` |
| Auditoría transversal de plataforma | MISSING | — |
| Preferencias de notificación de pedidos | VERIFIED | `lib/notifications/preferences.ts` |
| Web Push de pedido nuevo | VERIFIED | `lib/notifications/web-push.server.ts`, `app/api/internal/orders/[id]/push/route.ts` |
| Correo de aplicación | MISSING | — |
| Bucket público `product-images` | VERIFIED | `20260426231500_t7_product_images_storage.sql`, `lib/products/product-image-storage.ts` |
| Bucket público `business-assets` | VERIFIED | `20260506001500_t10_business_assets_storage.sql` |
| Bucket privado de contratos, facturas y comprobantes | MISSING | — |

## 7. Entorno local

| Hallazgo | Clase | Evidencia |
| --- | --- | --- |
| `supabase/config.toml`, `project_id` OrderOps, API 54321, DB 54322, Studio 54323, Inbucket 54324, Postgres 17 | VERIFIED | `supabase/config.toml` |
| Seed configurado en `./seed.sql` | VERIFIED | `config.toml` |
| Archivo `supabase/seed.sql` | MISSING | no está en el repo |
| Scripts npm de supabase/migrate | MISSING | `package.json` |
| Bootstrap local que exige loopback y puerto 54321 | VERIFIED | `scripts/bootstrap-m2-local.mjs` |
| Rehearsal que usa `npx --yes supabase@2.119.0 db reset --local --no-seed` | VERIFIED | `scripts/migration-m3/` |
| Dockerfile / compose propios | MISSING | el CLI de Supabase usa Docker |
| Nombres en `.env.example`, valores vacíos | VERIFIED | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, VAPID, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `ORDEROPS_MARKETING_SITE_ORIGIN`, `ORDEROPS_MARKETING_WHATSAPP` |
| Si `.env.local` apunta a remoto | BLOCKED | no se leyó a propósito. `ORDEROPS_LIVING_MEMORY.md` sección 2.1 documenta hostname `*.supabase.co` para imágenes |
| Stripe, Resend, SendGrid activo, Mercado Pago SDK | MISSING | Mercado Pago aparece como tipo de cuenta de caja del comercio, no como cobro SaaS |
| SMTP de ejemplo comentado en `config.toml` | VERIFIED | no habilitado |

Hay 89 migraciones SQL en `supabase/migrations/` al momento de la auditoría. Ningún nombre contiene `invoice`, `commission`, `lead`, `promoter` ni `billing` de plataforma.

## 8. Clasificación de reutilización

| Módulo | Clase | Justificación |
| --- | --- | --- |
| Auth Supabase (`auth.users`, cookies SSR) | REUSE_AS_IS | Misma identidad. Roles nuevos en `commercial`, no en `profiles.role` |
| `profiles.role` y `lib/admin/permissions.ts` | DO_NOT_TOUCH | Son roles del comercio. Mezclarlos rompe RLS de pedidos y catálogo |
| Pedidos, realtime, pending mutations | DO_NOT_TOUCH | Fuera del circuito comercial. Regla de reconciliación defensiva |
| `finance_*`, `order_financials`, RPCs de settlement de pedido | DO_NOT_TOUCH | Contabilidad del local, no comisión de promotor |
| `businesses` | REUSE_AS_IS | Organización real al marcar Ganada (CC-10) |
| Alta de negocios en super-admin | EXTEND | La conversión debe poder vincular o crear un `businesses` existente sin duplicar el flujo de slug |
| Productos, categorías, imágenes | EXTEND | El owner sigue igual. Se agrega un guard de grant para contenido no sensible. Precio sigue en `manageProducts` |
| Web Push y preferencias de pedido | DO_NOT_TOUCH | Canal distinto. Notificaciones comerciales tienen tablas propias |
| Storage de imágenes de producto | REUSE_AS_IS | El grant de onboarding puede usar el bucket ya existente solo para imágenes de catálogo del `business_id` autorizado |
| Contratos, facturas, CBU, comprobantes | NEW_IMPLEMENTATION | Bucket privado `commercial-documents`. Los buckets actuales son públicos |
| Landing `MarketingAction` | EXTEND | Conservar el CTA de WhatsApp. Agregar formulario CC-35 |
| Auditoría de pedidos y finanzas de local | DO_NOT_TOUCH | `commercial.audit_events` es otro registro |
| Tests `*.verify.ts` | EXTEND | Mismo estilo para `lib/commercial/**/*.verify.ts`. Sumar SQL en `supabase/tests/commercial/` |
| Correo | NEW_IMPLEMENTATION | Adaptador local a Inbucket. Sin proveedor externo en V1 |
| Cobranzas SaaS | NEW_IMPLEMENTATION | No hay suscripción que extender |

## 9. Riesgos

- Acoplar comisiones a `order_financials` duplicaría conceptos y filtraría dinero del local hacia promotores.
- Poner `commercial` o `finance` dentro de `profiles.role` obliga a reescribir el check de seis valores y todas las políticas que lo usan.
- El middleware no cubre rutas nuevas. Sin actualizar el matcher, la sesión de `/commercial` y `/promoter` no se refresca.
- Service role en un formulario público saltea RLS. El alta de demo debe usar una RPC acotada o un server action que inserte solo columnas de captación.
- RLS de productos hoy autoriza por membresía del comercio. Un grant de onboarding que copie al promotor como `owner` viola CC-12 y CC-17.
- `db reset --local` borra datos locales. No es un paso automático.
- No hay CI de tests. Una fase «terminada» sin el comando de `TEST_STRATEGY.md` no cuenta.
- Operaciones no idempotentes ya visibles en el producto (pedidos) no se reutilizan como plantilla de cobranzas. El Commercial Core define sus propias claves únicas en `DATA_MODEL.md`.

## 10. Integraciones externas relevantes

Google Maps en checkout (`lib/maps/google-maps-loader.ts`): no participa del Commercial Core.

WhatsApp operativo y de marketing: enlaces, no API. V1 no automatiza WhatsApp (fuera de alcance de CC-39).

AFIP/ARCA: no existe cliente. La verificación de monotributo en V1 es un documento revisado por un interno, no una consulta fiscal.
