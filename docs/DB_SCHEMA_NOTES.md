# DB Schema Notes

## Fuente

Estas notas salen de:

- `types/database.ts`
- migrations en `supabase/migrations/`

No modifican schema. Solo documentan.

## Tablas principales

### `businesses`

Campos relevantes:

- `id`
- `name`
- `slug`
- `whatsapp_number`
- `logo_url`
- `cover_image_url`
- `description`
- `primary_color`
- `catalog_hero_headline`
- `catalog_hero_badge`
- `catalog_hero_microcopy`
- `is_active`
- `created_at`

Uso:

- tenant principal
- branding publico
- resolucion por slug

### `profiles`

Campos relevantes:

- `id` -> `auth.users.id`
- `business_id`
- `role`
- `created_at`

Uso:

- link user -> tenant
- soporte admin / super_admin

### `categories`

Campos relevantes:

- `id`
- `business_id`
- `name`
- `position`
- `created_at`

### `products`

Campos relevantes:

- `id`
- `business_id`
- `category_id`
- `name`
- `description`
- `price`
- `image_url`
- `is_available`
- `created_at`

### `orders`

Campos relevantes:

- `id`
- `business_id`
- `customer_name`
- `phone`
- `delivery_date`
- `delivery_time`
- `delivery_method`
- `address`
- `notes`
- `total_price`
- `status`
- `created_at`

Notas:

- hoy no existe `updated_at` en el type generado
- eso limita reconciliacion fuerte de frescura para conflictos cross-session

### `order_items`

Campos relevantes:

- `id`
- `order_id`
- `product_id`
- `product_name`
- `unit_price`
- `quantity`

Uso:

- snapshot del pedido al momento de compra

## Relaciones importantes

- `profiles.business_id -> businesses.id`
- `categories.business_id -> businesses.id`
- `products.business_id -> businesses.id`
- `products.category_id + business_id -> categories(id, business_id)`
- `orders.business_id -> businesses.id`
- `order_items.order_id -> orders.id`
- `order_items.product_id -> products.id`

## Estado de migrations

Secuencia visible:

- T1: businesses + profiles
- T2: categories + products
- T3: orders + order_items
- T4: indexes MVP
- T5: admin RLS
- T6: public catalog read
- T7: product images storage
- T8: RPC `create_order`
- T9: branding / luego `order_status_v2`
- T10/T11/T12 y extras:
  - branding/public settings
  - ajustes RLS
  - realtime publication de `orders`
  - campos hero del catalogo
  - super_admin roles

## RLS

Detectado en migrations:

- RLS habilitado para tablas principales
- admins solo ven/modifican su negocio
- super_admin extiende permisos sobre multiples tenants
- `create_order` corre como `security definer`
  - pensado para publico / checkout

## Realtime

Detectado:

- migration `20260516183000_t12_orders_realtime_publication.sql`
- `public.orders` agregado a `supabase_realtime`
- `replica identity full`

## Pendiente de confirmar

- politica exacta de storage para business assets / product images conviene releer si se toca upload
- no se verifico desde aqui el estado actual remoto de todas las policies; se documenta el intent de migrations
