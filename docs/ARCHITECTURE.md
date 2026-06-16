# Arquitectura

## Stack actual

- Next.js 15 App Router
- React 19
- TypeScript
- Supabase SSR + Supabase JS
- CSS modular por superficies compartidas, sin framework de UI pesado

## Estructura principal de carpetas

- `app/`
  - rutas publicas
  - rutas admin
  - rutas super-admin
  - route handlers y server actions
- `components/`
  - `admin/`
  - `public/`
  - `super-admin/`
  - `ui/`
- `lib/`
  - `orders/`
  - `catalog/`
  - `business/`
  - `products/`
  - `categories/`
  - `admin/`
  - `supabase/`
  - `whatsapp/`
  - `browser/`
- `supabase/migrations/`
- `types/database.ts`
- `public/`
  - incluye assets como `/sounds/new-order-sound.mp3`

## Flujo publico

### Catalogo

- ruta principal por negocio: `/b/[slug]/catalogo`
- negocio resuelto via `requirePublicBusinessBySlug`
- categorias y productos leidos desde `lib/catalog/public.ts`
- carrito persistido en `localStorage`

### Checkout

- ruta: `/b/[slug]/checkout`
- cliente arma payload y llama RPC `create_order`
- el total se calcula server-side en la RPC
- al terminar redirige a `/b/[slug]/success?order_id=...`

## Flujo admin

### Auth / shell

- `middleware.ts` actualiza sesion para `/admin/*` y `/b/*`
- `lib/admin/context.ts` resuelve el `businessId` del usuario autenticado
- `app/admin/(protected)/layout.tsx` monta:
  - `AdminShell`
  - `AdminToastProvider`

### Dashboard de pedidos

- `app/admin/(protected)/dashboard/page.tsx`
- carga inicial server-side via `getAdminOrders(businessId)`
- hidrata `AdminDashboardOrders` como cliente

### Workspace y detalle

- modal instantaneo:
  - `components/admin/orders/admin-order-workspace-modal.tsx`
- vista profunda:
  - `app/admin/(protected)/orders/[id]/page.tsx`
  - `components/admin/orders/order-detail-page-client.tsx`

## Flujo de pedidos

### Datos base

- `lib/orders/admin.ts`
  - carga dashboard items
  - carga detail page
  - carga summary por id
  - carga contexto de cliente

### Presentacion / derivaciones

- `lib/orders/presenter.ts`
  - moneda
  - delivery labels
  - aging
  - timeline
  - summaries operativos

### Realtime

- `components/admin/orders/use-admin-orders-realtime.ts`
  - subscribe a `public.orders`
  - escucha `INSERT` y `UPDATE`
  - tracking de pending mutations
  - health status del canal

### Orden / reconciliacion

- `lib/orders/sorting.ts`
- `lib/orders/realtime.ts`
- `lib/orders/workspace.ts`

## Multitenancy

La app es multi-tenant por `business_id`.

Patrones:

- datos publicos filtrados por `slug` de negocio
- datos admin filtrados por `business_id` tomado del perfil del usuario
- RLS y helpers server-side refuerzan aislamiento

## Realtime

Base actual:

- tabla `public.orders` publicada en `supabase_realtime`
- realtime solo para `orders`
- `INSERT` y `UPDATE` sincronizan dashboard
- no hay polling global
- no hay `router.refresh()` para cambios operativos normales

Reconciliation actual:

- optimistic updates primero
- realtime / silent refresh reconcilian despues
- hay manejo basico de conflicto cross-session

## Server / client boundaries

### Server

- carga de datos iniciales
- route handlers
- server actions
- acceso Supabase server client

### Client

- dashboard operacional
- realtime subscriptions
- local storage del carrito
- history API para modal
- toasts
- audio
- share / clipboard / maps

Nota importante:

No importar modulos server-only dentro de componentes cliente. Ya hubo un bug real por esto en la fase M.2.

## Supabase usage

Supabase se usa para:

- auth
- tablas base (`businesses`, `profiles`, `categories`, `products`, `orders`, `order_items`)
- RPC `create_order`
- realtime de `orders`
- storage / branding / imagenes segun migrations

Archivos clave:

- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/service.ts`

## Pendientes de confirmar

- no hay evidencia en este repo de tests automaticos e2e
- el soporte exacto de storage branding/product images debe releerse si se lo toca upload
