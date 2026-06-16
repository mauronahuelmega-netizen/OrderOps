# Critical Files

## Dashboard / pedidos realtime

### [C:\Users\Oasis Desktop\Documents\New project 2\components\admin\orders\admin-dashboard-orders.tsx](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\admin\orders\admin-dashboard-orders.tsx)

Responsabilidad:

- state local del dashboard
- modal local-first
- filtros
- summary strip
- analytics strip
- queue pressure
- sync por realtime
- refresh silencioso
- dedupe de side effects

Tocar con mucho cuidado.

### [C:\Users\Oasis Desktop\Documents\New project 2\components\admin\orders\use-admin-orders-realtime.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\admin\orders\use-admin-orders-realtime.ts)

Responsabilidad:

- suscripcion Supabase realtime
- health status
- pending mutations
- conflicto cross-session

### [C:\Users\Oasis Desktop\Documents\New project 2\lib\orders\realtime.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\lib\orders\realtime.ts)

Responsabilidad:

- patch incremental desde payload realtime

### [C:\Users\Oasis Desktop\Documents\New project 2\lib\orders\sorting.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\lib\orders\sorting.ts)

Responsabilidad:

- regla unica de orden operacional

### [C:\Users\Oasis Desktop\Documents\New project 2\lib\orders\workspace.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\lib\orders\workspace.ts)

Responsabilidad:

- seed inicial del workspace
- patches de estado para dashboard / workspace

## Data loading de pedidos

### [C:\Users\Oasis Desktop\Documents\New project 2\lib\orders\admin.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\lib\orders\admin.ts)

Responsabilidad:

- queries server-side de pedidos
- shape del dashboard
- shape de detalle
- contexto de cliente
- summary por id

Archivo muy sensible: varios bugs de summary y client/server boundaries pasaron por aca.

### [C:\Users\Oasis Desktop\Documents\New project 2\app\admin\(protected)\orders\[id]\summary\route.ts](<C:\Users\Oasis Desktop\Documents\New project 2\app\admin\(protected)\orders\[id]\summary\route.ts>)

Responsabilidad:

- route puntual para INSERT realtime de nuevo pedido

### [C:\Users\Oasis Desktop\Documents\New project 2\app\admin\(protected)\dashboard\orders\route.ts](<C:\Users\Oasis Desktop\Documents\New project 2\app\admin\(protected)\dashboard\orders\route.ts>)

Responsabilidad:

- refresh silencioso del dashboard

## Modal / detalle profundo

### [C:\Users\Oasis Desktop\Documents\New project 2\components\admin\orders\admin-order-workspace-modal.tsx](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\admin\orders\admin-order-workspace-modal.tsx)

Responsabilidad:

- apertura instantanea
- hydration en background
- cache de workspace

### [C:\Users\Oasis Desktop\Documents\New project 2\components\admin\orders\order-detail-page-client.tsx](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\admin\orders\order-detail-page-client.tsx)

Responsabilidad:

- detalle profundo cliente
- realtime sobre pedido abierto

## Public catalog / checkout

### [C:\Users\Oasis Desktop\Documents\New project 2\components\public\catalog\catalog-client.tsx](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\public\catalog\catalog-client.tsx)

Responsabilidad:

- experiencia principal del catalogo
- carrito local

### [C:\Users\Oasis Desktop\Documents\New project 2\components\public\checkout\checkout-client.tsx](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\public\checkout\checkout-client.tsx)

Responsabilidad:

- formulario de checkout
- llamado RPC `create_order`

## Contexto / auth / tenant

### [C:\Users\Oasis Desktop\Documents\New project 2\lib\admin\context.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\lib\admin\context.ts)

Responsabilidad:

- resolver `businessId` del admin

### [C:\Users\Oasis Desktop\Documents\New project 2\lib\supabase\server.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\lib\supabase\server.ts)
### [C:\Users\Oasis Desktop\Documents\New project 2\lib\supabase\client.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\lib\supabase\client.ts)
### [C:\Users\Oasis Desktop\Documents\New project 2\lib\supabase\middleware.ts](C:\Users\Oasis%20Desktop\Documents\New%20project%202\lib\supabase\middleware.ts)

Responsabilidad:

- boundaries SSR / client de Supabase

## Estilos criticos

### [C:\Users\Oasis Desktop\Documents\New project 2\components\admin\orders-admin.css](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\admin\orders-admin.css)

Responsabilidad:

- casi toda la superficie visual del dashboard de pedidos

### [C:\Users\Oasis Desktop\Documents\New project 2\app\globals.css](C:\Users\Oasis%20Desktop\Documents\New%20project%202\app\globals.css)

Responsabilidad:

- base global publico/admin

## Antes de tocar X, revisar Y

- dashboard: `admin-dashboard-orders.tsx`, `use-admin-orders-realtime.ts`, `orders-admin.css`
- modal / workspace: `admin-order-workspace-modal.tsx`, `workspace.ts`, `order-workspace.tsx`
- checkout: `checkout-client.tsx`, migrations T3/T8
- realtime: `use-admin-orders-realtime.ts`, `dashboard/orders/route.ts`, `orders/[id]/summary/route.ts`, `sorting.ts`
- DB / schema: `types/database.ts`, `supabase/migrations/*`
