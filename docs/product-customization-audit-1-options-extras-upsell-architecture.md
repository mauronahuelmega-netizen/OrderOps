# PRODUCT-CUSTOMIZATION-AUDIT-1 — Options, Extras & Upsell Architecture Audit

## Objetivo

Auditar la arquitectura actual de OrderOps para diseñar **Product Customization V1** (grupos reutilizables, opciones/extras, overrides por producto, plus sugerido como producto real) **sin implementar código**. Este documento indica qué existe hoy, qué habría que tocar, riesgos, modelo DB candidato, impacto en precios/carrito/pedidos/dashboard y un roadmap quirúrgico por fases.

**Alcance de esta fase:** solo lectura + documentación.  
**Fecha auditoría:** 2026-07-11.

---

## Contexto de producto

### Modelo mental V1 (definido por producto)

```txt
Grupo reutilizable + override por producto
```

- Grupos asignables a **categorías**, **productos**, o **ambos**.
- Productos **heredan** grupos de su categoría.
- Overrides core V1:
  - desactivar grupo heredado por producto;
  - desactivar opción heredada por producto;
  - agregar grupos propios al producto.

### Tipos de grupo mínimos

| Tipo | Reglas |
|------|--------|
| single select requerido | min=1, max=1 |
| single select opcional | min=0, max=1 |
| multi select opcional | min=0, max=N |
| multi select requerido | min≥1, max=N |

### Plus sugerido (upsell)

- Producto **real** del catálogo.
- Máximo **1 grupo de plus** por producto/categoría.
- 1+ productos sugeridos dentro del grupo.
- UI: dentro del modal de personalización, al final, antes de confirmar.

### Precio

```txt
precio final línea = precio base + Σ price_delta opciones + Σ precio productos plus
```

Catálogo: **"Desde $X"** si hay opciones con `price_delta > 0`.  
Modal: recálculo en vivo.

---

## Decisiones ya tomadas

| Decisión | Detalle |
|----------|---------|
| Overrides | Parte del core V1, no post-MVP |
| Plus | Producto real del catálogo, no pseudo-opción |
| Precio delta | Solo ≥ 0; sin descuentos ni negativos en V1 |
| Snapshot histórico | Obligatorio en pedido; no alcanza con IDs vivos |
| Admin UX | Sección dedicada **Productos → Opcionales y extras**; modal producto solo para overrides/asignación ligera |
| Drag and drop | `sort_order`/`position` en DB desde V1; DnD UI puede postergarse |

---

## Fuera de V1

- Stock por extra
- Reglas condicionales ("si elegís X, mostrar Y")
- Gratis hasta N y luego cobra
- Cantidad por extra (más allá de qty del producto padre)
- Campos de texto personalizados
- Plantillas por rubro
- Combos/descuentos
- Analytics de extras
- Impresión comandera
- Customization en pedido manual admin (recomendado V1.1 — ver sección Manual Order)

---

## Rutas y áreas auditadas

| Área | Rutas / módulos |
|------|-----------------|
| Admin Products | `/admin/products`, `components/admin/products/*`, `lib/products/admin.ts` |
| Admin Categories | `/admin/categories`, `components/admin/categories/*`, `lib/categories/admin.ts` |
| Public Catalog | `/b/[slug]/catalogo`, `components/public/catalog/*`, `lib/catalog/public.ts` |
| Cart / Checkout | `lib/cart/local.ts`, `components/public/checkout/*`, `app/b/[slug]/checkout/*` |
| Order creation | RPC `create_order`, `app/b/[slug]/checkout/actions.ts`, `app/admin/(protected)/orders/actions.ts` |
| Dashboard | `components/admin/orders/*`, `lib/orders/admin.ts`, `lib/orders/presenter.ts` |
| Realtime | `use-admin-orders-realtime.ts`, `lib/orders/realtime.ts` |
| DB / RLS | `supabase/migrations/*`, `types/database.ts` |
| Money | `formatAdminOrderCurrency`, `numeric(12,2)` en Postgres |

---

## Mapa de archivos

### DB / migrations

| Archivo | Responsabilidad | Riesgo futuro |
|---------|-----------------|---------------|
| `supabase/migrations/20260426215500_t2_categories_products.sql` | CREATE `categories`, `products` | Alta — FK compuesta product↔category |
| `supabase/migrations/20260426221000_t3_orders_order_items.sql` | CREATE `orders`, `order_items` | **Crítica** — extender `order_items` o RPC |
| `supabase/migrations/20260426224000_t5_admin_rls.sql` | RLS base admin | Alta — nuevas tablas necesitan mismo patrón |
| `supabase/migrations/20260426230000_t6_public_catalog_read.sql` | Anon read catálogo | Media — lectura pública de grupos/opciones |
| `supabase/migrations/20260426234000_t8_create_order_rpc.sql` | RPC inicial | **Crítica** |
| `supabase/migrations/20260608170000_scheduled_operational_rules_guardrails.sql` | RPC `create_order` actual | **Crítica** — único punto de inserción order_items |
| `supabase/migrations/20260516183000_t12_orders_realtime_publication.sql` | Realtime `orders` | Baja — customization no cambia canal |
| `types/database.ts` | Tipos generados Supabase | Alta — regenerar tras migraciones |

### Products admin

| Archivo | Tipo | Lee DB | Escribe DB | Precio | Riesgo |
|---------|------|--------|------------|--------|--------|
| `app/admin/(protected)/products/page.tsx` | Server | ✓ | — | — | Media |
| `app/admin/(protected)/products/actions.ts` | Server actions | ✓ | ✓ products | ✓ valida price | Alta |
| `lib/products/admin.ts` | Server lib | ✓ | — | — | Media |
| `components/admin/products/create-product-form.tsx` | Client | — | via action | ✓ | Media |
| `components/admin/products/edit-product-form.tsx` | Client | — | via action | ✓ | **Alta** — punto de overrides UI |
| `components/admin/products/dashboard-shell.tsx` | Client | — | — | — | Media — nav a nueva sección |
| `components/admin/products/flyout-panel.tsx` | Client | — | — | — | Media |

### Categories admin

| Archivo | Tipo | Lee DB | Escribe DB | Riesgo |
|---------|------|--------|------------|--------|
| `app/admin/(protected)/categories/page.tsx` | Server | ✓ | — | Media |
| `app/admin/(protected)/categories/actions.ts` | Server actions | ✓ | ✓ categories | **Alta** — asignación grupos por categoría |
| `lib/categories/admin.ts` | Server lib | ✓ | — | Media |
| `components/admin/categories/create-category-form.tsx` | Client | — | via action | Media |
| `components/admin/categories/edit-category-form.tsx` | Client | — | via action | Media |

### Public catalog

| Archivo | Tipo | Precio | Carrito | Riesgo |
|---------|------|--------|---------|--------|
| `app/b/[slug]/catalogo/page.tsx` | Server | — | — | Media |
| `lib/catalog/public.ts` | Server | ✓ products.price | — | **Alta** — query debe incluir metadata "desde" |
| `components/public/catalog/catalog-client.tsx` | Client | ✓ cartTotal | ✓ localStorage | **Crítica** — dedup líneas, abrir modal |
| `components/public/catalog/product-card.tsx` | Client | display | add/increment | Alta |
| `components/public/catalog/product-detail-modal.tsx` | Client | display | qty editor | **Crítica** — reemplazar/ampliar con customization modal |
| `components/public/catalog/cart-bar.tsx` | Client | display | — | Media |

### Cart / checkout

| Archivo | Tipo | Precio | Riesgo |
|---------|------|--------|--------|
| `lib/cart/local.ts` | Client lib | snapshot price en item | **Crítica** — shape `LocalCartItem` |
| `components/public/checkout/checkout-client.tsx` | Client | Σ price×qty display | Alta |
| `app/b/[slug]/checkout/actions.ts` | Server action | RPC recalcula | **Crítica** — payload items enriquecido |
| `lib/store-sessions/public.server.ts` | Server | — | Baja |

### Order creation

| Archivo | Tipo | Insert orders/items | Riesgo |
|---------|------|---------------------|--------|
| `create_order` RPC (migration latest) | SECURITY DEFINER | ✓ única vía | **Crítica** |
| `app/b/[slug]/checkout/actions.ts` | Server | via RPC | Crítica |
| `app/admin/(protected)/orders/actions.ts` | Server | via RPC (`createManualOrderAction`) | Alta |

### Manual order admin

| Archivo | Riesgo |
|---------|--------|
| `components/admin/orders/manual-order-modal.tsx` | Alta si V1 incluye customization |
| `lib/orders/manual-order-types.ts` | Media |
| `lib/products/admin.ts` → `getManualOrderProductOptions` | Media |

### Dashboard / order display

| Archivo | order_items | Riesgo |
|---------|-------------|--------|
| `lib/orders/admin.ts` | query + normalize | **Crítica** — incluir snapshot en selects |
| `lib/orders/presenter.ts` | `buildItemsSummary` | **Alta** — card compacta |
| `components/admin/orders/order-card.tsx` | item_summary | Alta |
| `components/admin/orders/order-products-list.tsx` | lista detalle | **Crítica** — hoy parsea `description` como modifiers (hack) |
| `components/admin/orders/order-items-section.tsx` | wrapper | Media |
| `lib/whatsapp/admin.ts` | resumen WhatsApp | Media |

### Realtime

| Archivo | Escucha | Riesgo |
|---------|---------|--------|
| `components/admin/orders/use-admin-orders-realtime.ts` | `orders` INSERT/UPDATE/DELETE | Media |
| `components/admin/orders/use-admin-store-session-realtime.ts` | `store_sessions` | Baja |
| `lib/orders/realtime.ts` | patch fallback | Media |

### Shared utils

| Archivo | Uso |
|---------|-----|
| `lib/orders/presenter.ts` | `formatAdminOrderCurrency`, summaries |
| `lib/admin/context.ts` | tenancy `business_id` |
| `lib/admin/permissions.ts` | `manageProducts`, `updateOrders` |

---

## DB actual

### Products

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK → businesses | Tenancy |
| `category_id` | uuid FK compuesta → categories | Obligatorio |
| `name` | text | |
| `description` | text nullable | Hoy usado como pseudo-modifiers en dashboard (parseo) |
| `price` | numeric(12,2) | Base price; CHECK ≥ 0 |
| `image_url` | text nullable | |
| `is_available` | boolean | Trigger auto-off si stock ≤ 0 |
| `sku` | text nullable | |
| `stock` | integer | |
| `created_at` | timestamptz | |

**No existe:** `sort_order` en products (orden implícito por query).  
**No existe:** ningún campo de customization.

### Categories

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `name` | text | |
| `position` | integer nullable | Orden manual (no DnD en UI hoy) |
| `created_at` | timestamptz | |

**No existe:** relación a grupos de personalización.

### Orders

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `customer_name`, `phone` | text | |
| `delivery_date` | date | |
| `delivery_time` | text nullable | No poblado por RPC actual |
| `delivery_method` | delivery \| pickup | |
| `address` | text nullable | Requerido si delivery |
| `notes` | text nullable | |
| `total_price` | numeric(12,2) | Calculado en RPC |
| `status` | pending…cancelled | |
| `assigned_to`, `assigned_at` | uuid/timestamptz | Ownership |
| `created_at` | timestamptz | |

### Order items

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `order_id` | uuid FK CASCADE | |
| `product_id` | uuid nullable FK SET NULL | |
| `product_name` | text | **Snapshot** |
| `unit_price` | numeric(12,2) | **Snapshot** (= products.price hoy, sin extras) |
| `quantity` | integer | CHECK > 0 |

**Ausente hoy (gaps V1):**

- `customization_snapshot` (JSONB)
- `parent_order_item_id` (plus hijo)
- `item_source` (main \| plus \| manual)
- `line_subtotal` explícito (se deriva unit_price × quantity)
- Cualquier tabla hija de customizations

### RPC `create_order` (autoridad de precio)

**Input actual (`p_items` JSONB):**

```json
[{ "product_id": "uuid", "quantity": 1 }]
```

**Insert order_items:**

```sql
SELECT v_order_id, p.id, p.name, p.price, pi.quantity
FROM parsed_items pi JOIN products p ...
```

**Implicaciones:**

- Precio **nunca** confía en cliente; solo IDs + qty.
- `unit_price` = precio base del producto, sin extras.
- Toda customization requiere **nueva versión del RPC** (v5+) con validación server-side.

---

## RLS / Security actual

### Patrón estándar tenant

```sql
business_id = (select p.business_id from profiles p where p.id = auth.uid())
-- OR role = 'super_admin'
```

### Por tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE | Anon |
|-------|--------|--------|--------|--------|------|
| products | admin + super | admin | admin | admin | available + business active |
| categories | admin + super | admin | admin | admin | business active |
| orders | admin + super | **RPC only** | admin | — | — |
| order_items | admin (via order join) | **RPC only** | — | — | — |

### RLS necesaria para customization V1 (propuesta)

| Tabla nueva | Admin | Anon público |
|-------------|-------|--------------|
| `customization_groups` | CRUD tenant | SELECT where `is_available` + business active |
| `customization_options` | CRUD tenant | SELECT where available + group available |
| `customization_group_assignments` | CRUD tenant | SELECT (para resolver herencia en catálogo) |
| `product_customization_overrides` | CRUD tenant | SELECT |
| `upsell_groups` / `upsell_group_items` | CRUD tenant | SELECT |

**Recomendación:** inserts de snapshot en pedido **solo vía `create_order` SECURITY DEFINER** — anónimo nunca INSERT directo en `order_items`. Validación y snapshot generados server-side en RPC o capa TS previa al RPC con payload enriquecido ya validado.

---

## Types actuales

| Tipo | Ubicación | Uso |
|------|-----------|-----|
| `Database["public"]["Tables"]["products"]["Row"]` | `types/database.ts` | Admin + generated |
| `PublicProduct` | `lib/catalog/public.ts` | Catálogo público |
| `LocalCartItem` | `lib/cart/local.ts` | Carrito client |
| `AdminOrderItem` | `lib/orders/admin.ts` | Dashboard/detalle |
| `CreatePublicCheckoutOrderInput` | checkout actions | Solo `{ productId, quantity }[]` |
| `CreateManualOrderInput` | orders actions | Idem |
| `ManualOrderProductOption` | manual-order-types | id, name, price |

**Gap:** no hay tipos `CustomizationGroup`, `CustomizationOption`, `CartCustomizationSelection`, `OrderItemCustomizationSnapshot`. Conviene definirlos en `lib/catalog/customization-types.ts` (fase SPEC) antes de DB.

---

## Admin Products audit

### Estado actual

- Ruta: `/admin/products` con flyout create/edit.
- Actions: `createProductAction`, `updateProductAction`, `setProductAvailabilityAction`.
- Campos: name, price, category_id, description, image, sku, stock, is_available.
- Nav: `admin-nav-config.ts` agrupa Productos + Categorías bajo `/admin/products` y `/admin/categories`.

### Respuestas

| Pregunta | Recomendación |
|----------|---------------|
| ¿Nueva subpágina **Opcionales y extras**? | **Sí** — `/admin/products/customizations` o `/admin/customizations` bajo matchPrefix Productos |
| ¿Asignación de grupos en modal producto? | Solo: ver heredados, toggle disable grupo/opción, "Agregar grupo existente" — **no** editor completo |
| Archivos afectados ADMIN-1 | Nueva ruta + shell + listado grupos |
| Archivos afectados ADMIN-2 | `edit-product-form.tsx` panel overrides; `lib/products/admin.ts` queries herencia |

**Riesgo:** meter editor completo de grupos dentro del flyout de producto → modal gigante (explicitamente fuera de V1 UX deseada).

---

## Admin Categories audit

### Estado actual

- Ruta: `/admin/categories`.
- `position` para orden; sin drag-and-drop en UI.
- `category_id` **obligatorio** en products (FK compuesta).

### Punto de extensión

- Página categoría o tab "Personalización" para asignar grupos reutilizables + upsell de categoría.
- Herencia: productos de la categoría reciben grupos salvo override.

---

## Public Catalog audit

### Flujo actual add-to-cart

1. `ProductCard` → `onAdd` incrementa qty **sin modal** (o abre `ProductDetailModal` para ver detalle).
2. `setProductQuantity` en `catalog-client.tsx` — **dedup por `productId` únicamente**.
3. `LocalCartItem` guarda snapshot de `price` al agregar.

### Punto exacto para customization modal

**Interceptar antes de persistir en carrito:**

- Si producto tiene ≥1 grupo aplicable (directo + heredado − overrides) **o** upsell configurado → abrir **CustomizationModal** en lugar de `setProductQuantity` directo.
- Punto de hook: `onAdd` / `setProductQuantity` en `catalog-client.tsx` y confirmación desde `product-detail-modal.tsx`.

### Performance

| Estrategia | Pros | Contras |
|----------|------|---------|
| Eager: cargar grupos de todos los productos en SSR | Sin latency al abrir modal | Payload grande; N+1 queries |
| **Lazy (recomendado V1)** | Catálogo liviano | 1 fetch al abrir modal por producto |
| Híbrido: flags `has_customizations`, `price_from` en listado | Permite "Desde $X" sin cargar opciones | Requiere vista/materialized helper o campos derivados |

**Recomendación V1:** lazy load al abrir modal + metadata ligera en listado (`has_customizations`, `min_price` calculado server-side o cached).

---

## Cart / Checkout audit

### Shape actual `LocalCartItem`

```typescript
{
  productId, categoryId, name, description, imageUrl,
  price: number,  // base snapshot
  quantity: number
}
```

### Gaps para V1

| Gap | Solución propuesta |
|-----|-------------------|
| Dedup incorrecto | **Cart line ID** (uuid) o hash(canonical selections); misma productId + distintas opciones = líneas separadas |
| Precio incompleto | `unitPrice` = base + deltas + plus; guardar `basePrice`, `selections[]`, `plusItems[]` |
| Display | Render jerárquico grupo → opciones |
| Checkout payload | Enviar `{ productId, quantity, selections, plusProductIds }` — **no precios** |
| Editar item personalizado | Re-abrir modal desde carrito con state prefill |

### Plus asociado al item principal

**Opción A (recomendada):** plus dentro del snapshot del item padre + filas hijas en pedido con `parent_order_item_id`.  
**Opción B:** solo snapshot JSON sin filas hijas — más simple insert, peor reporting.

---

## Public Order Creation audit

### Flujo

```
CheckoutClient → createPublicCheckoutOrderAction → service client → create_order RPC
```

### Validaciones actuales

- Tenant activo, store session / on_demand_mode
- Scheduled rules (fecha futura)
- Productos existen, available, mismo business_id

### Dónde validar customization (propuesto)

| Validación | Capa |
|------------|------|
| Grupos aplicables al producto | `lib/orders/customization/resolve-applicable-groups.ts` |
| min/max, required | misma lib |
| Overrides herencia | resolver combina category + product assignments − overrides |
| price_delta real | leer DB, recalcular |
| plus permitido | upsell config |
| snapshot | generar en server antes de RPC |
| total | RPC o TS previo — **debe coincidir** con insert |

**Archivos afectados:** `checkout/actions.ts`, RPC `create_order`, nueva lib `lib/orders/customization/*`.

---

## Manual Order Admin audit

### Estado actual

- Modal simple: pick product + qty, sin modal intermedio.
- Mismo RPC con `{ product_id, quantity }`.
- Total estimado client-side; autoridad server.

### Recomendación V1

| Opción | Veredicto |
|--------|-----------|
| Incluir customization en manual order V1 | **No recomendado** — duplica UX compleja; modal ya denso |
| Comportamiento V1 | Manual sigue **producto plano**; customization solo flujo público |
| V1.1 | Paridad manual con mismo modal reutilizable admin-side |

Si negocio exige manual V1: reutilizar componente `CustomizationModal` en admin con permiso `updateOrders`.

---

## Dashboard / Order Display audit

### Card compacta (`order-card.tsx`)

- Usa `item_summary` = `"2x Pizza · 1x Coca · +1 mas"` vía `buildItemsSummary`.
- **No muestra** customizations hoy.

### Detalle (`order-products-list.tsx`)

- Muestra `product_name`, qty, `unit_price`, line total.
- **Hack existente:** `renderItemModifiers` parsea `products.description` por comas — **no es customization real**.

### Propuesta display

**Card:** append corto si snapshot existe, ej. `"Hamburguesa (+extras)"` o primera línea `"Papas: Grandes"`.

**Detalle:**

```txt
Hamburguesa clásica · 1× · $8.500
  Papas: Grandes (+$900)
  Aderezos: ketchup, barbacoa
  Plus: Coca 500ml (+$3.000)
```

**Migración mínima dashboard:** incluir `customization_snapshot` en queries de `lib/orders/admin.ts`; extender `AdminOrderItem` type; presenter helpers `formatCustomizationLines(snapshot)`.

### Realtime

- Escucha **`orders`**, no `order_items`.
- INSERT/UPDATE → fetch `/admin/orders/[id]/summary` (incluye items).
- **Conclusión:** si snapshot vive en `order_items` y summary fetch trae items anidados, **realtime existente alcanza** sin escuchar `order_items` directamente.
- Verificar que summary route incluya nuevos campos tras migración.

---

## Realtime audit

| Pregunta | Respuesta |
|----------|-----------|
| ¿Escuchar order_items? | **No necesario V1** si INSERT order dispara summary hydration |
| ¿Snapshot llega completo? | Sí, si `getAdminDashboardOrderById` selecciona `customization_snapshot` |
| Riesgo | PATCH fallback (`patchDashboardOrderFromRealtime`) no actualiza items — ya mitigado por hydration preferida |

---

## Price / Money audit

| Aspecto | Estado |
|---------|--------|
| DB type | `numeric(12,2)` |
| TS type | `number` |
| Formato | `Intl.NumberFormat("es-AR", ARS)` |
| Client cart | Suma float JS — display only |
| Autoridad | RPC `create_order` |
| Riesgo float | Mitigar recalculando en server con numeric/decimal |
| price_delta | Sumar en server; validar ≥ 0 |

**Regla V1:** `unit_price` del order_item padre = base + Σ deltas del item (plus en filas hijas o incluido según decisión — ver Snapshot).

---

## Gaps para Product Customization V1

| # | Gap | Severidad |
|---|-----|-----------|
| G1 | No existen tablas de grupos/opciones/asignaciones | Bloqueante |
| G2 | `order_items` sin snapshot JSONB | Bloqueante |
| G3 | RPC solo acepta product_id + quantity | Bloqueante |
| G4 | Carrito dedup por productId | Bloqueante |
| G5 | Catálogo sin "Desde $X" | Alta |
| G6 | Dashboard sin render customization | Alta |
| G7 | Admin sin sección grupos | Alta |
| G8 | Sin lazy API customization por producto | Media |
| G9 | Manual order sin customization | Aceptable V1 |
| G10 | Sin drag-and-drop (solo position DB) | Baja V1 |

---

## Modelo DB candidato

> Nombres alineados a convenciones OrderOps: `business_id`, snake_case, RLS por tenant, FK compuestas donde aplique.

### 1. `customization_groups`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| business_id | uuid FK | |
| name | text | "Elegí tamaño de papas" |
| selection_type | text | `single_required` \| `single_optional` \| `multi_required` \| `multi_optional` |
| min_select | int | default 0 |
| max_select | int | default 1 |
| sort_order | int | DnD futuro |
| is_available | boolean | |
| created_at | timestamptz | |

**Constraints:** min/max coherentes con selection_type; CHECK name not empty.

### 2. `customization_options`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| business_id | uuid FK | denormalizado para RLS |
| group_id | uuid FK → customization_groups | ON DELETE CASCADE |
| name | text | |
| price_delta | numeric(12,2) | CHECK ≥ 0 |
| sort_order | int | |
| is_available | boolean | |
| created_at | timestamptz | |

### 3. `customization_group_assignments`

Asigna un grupo a categoría **o** producto.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| business_id | uuid FK | |
| group_id | uuid FK | |
| target_type | text | `category` \| `product` |
| target_id | uuid | categories.id o products.id |
| sort_order | int | |
| created_at | timestamptz | |

**UNIQUE:** `(business_id, group_id, target_type, target_id)`  
**Index:** `(target_type, target_id)` para resolver herencia.

### 4. `product_customization_overrides`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| business_id | uuid FK | |
| product_id | uuid FK | |
| group_id | uuid FK nullable | override a nivel grupo |
| option_id | uuid FK nullable | override a nivel opción |
| is_enabled | boolean | false = desactivar heredado |
| created_at | timestamptz | |

**CHECK:** exactamente uno de group_id u option_id NOT NULL.

### 5. `upsell_groups`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| business_id | uuid FK | |
| name | text | "¿Sumás algo?" |
| target_type | text | `category` \| `product` |
| target_id | uuid | |
| sort_order | int | |
| is_available | boolean | |
| created_at | timestamptz | |

**UNIQUE parcial:** `(business_id, target_type, target_id)` — max 1 upsell group por target (regla V1).

### 6. `upsell_group_items`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| business_id | uuid FK | |
| upsell_group_id | uuid FK | |
| product_id | uuid FK → products | producto real sugerido |
| sort_order | int | |
| is_available | boolean | |

### 7. Extensión `order_items`

| Columna nueva | Tipo | Notas |
|---------------|------|-------|
| customization_snapshot | jsonb nullable | Ver sección Snapshot |
| parent_order_item_id | uuid nullable FK → order_items | Plus hijo |
| item_kind | text | `standard` \| `plus` default standard |

**Alternativa simplificada (menos tablas assignment):** combinar category+product assignments en una sola tabla con `target_type` (propuesta arriba) en lugar de tablas separadas `category_*` y `product_*` — reduce joins y matches patrón upsell.

---

## Snapshot recomendado

### Comparación

| Criterio | A. JSONB en order_items | B. Tabla order_item_customizations |
|----------|-------------------------|-------------------------------------|
| Velocidad implementación | **Alta** | Media-baja |
| Dashboard display | **Simple** — 1 query | Join extra |
| Reporting futuro | Media — parse JSON | **Mejor** |
| Insert complexity | **Baja** en RPC | Multi-row insert |
| Realtime | **OK** con summary fetch | OK |
| Migración | 1 columna | Nueva tabla + FK |
| Plus hijo | `parent_order_item_id` complementa | Igual |

### Recomendación V1: **A + parent_order_item_id para plus**

**`customization_snapshot` schema (versionado):**

```json
{
  "v": 1,
  "base_product_name": "Hamburguesa clásica",
  "base_unit_price": 8500,
  "groups": [
    {
      "group_id": "uuid",
      "group_name": "Elegí tamaño de papas",
      "options": [
        { "option_id": "uuid", "name": "Papas grandes", "price_delta": 900 }
      ]
    }
  ],
  "plus": [
    { "product_id": "uuid", "product_name": "Coca 500ml", "unit_price": 3000, "quantity": 1 }
  ],
  "computed_unit_price": 12400
}
```

**`order_items.unit_price`:** = `computed_unit_price` (base + deltas; plus puede ir en hijos).

**Plus como producto real:**

- Insert fila hija: `product_id`, `product_name`, `unit_price` del plus, `parent_order_item_id`, `item_kind='plus'`.
- Dashboard agrupa hijos bajo padre al renderizar.

---

## Server validation propuesta

### Módulos sugeridos

```
lib/orders/customization/
  types.ts
  resolve-applicable-groups.ts    # herencia category + product − overrides
  validate-selections.ts          # min/max, required, available
  compute-line-price.ts           # base + deltas + plus
  build-snapshot.ts               # JSONB versionado
  serialize-for-rpc.ts            # payload → create_order v5

lib/admin/customization/
  groups.ts                       # CRUD queries
  assignments.ts
  upsell.ts
```

### Pipeline create order (público y futuro manual)

1. Resolver `business_id` desde slug/context — **nunca desde cliente**.
2. Por cada línea: cargar producto + grupos aplicables.
3. Validar selecciones contra reglas V1.
4. Validar plus ⊆ upsell permitido.
5. Recalcular precios desde DB.
6. Construir snapshot server-side.
7. Llamar RPC con payload enriquecido (interno) o extender RPC para aceptar snapshot pre-validado bajo SECURITY DEFINER.

**Regla crítica:** cliente envía IDs de opciones/plus; **nunca** price_delta ni totales.

---

## Admin UX propuesta

### Nueva sección: Productos → Opcionales y extras

| Elemento | Detalle |
|----------|---------|
| Ruta sugerida | `/admin/products/customizations` |
| Nav | Extender `matchPrefixes` de Productos en `admin-nav-config.ts` |
| Listado grupos | Nombre, tipo, # opciones, asignaciones, available toggle |
| Editor grupo | Nombre, selection_type, min/max, opciones inline |
| Opciones | Lista ordenable (`sort_order`; DnD post-MVP) |
| Asignaciones | Tab "Por categoría" / "Por producto" — picker multi |
| Upsell | Sub-sección o tab — 1 grupo por target, picker productos |
| Empty states | "Creá tu primer grupo de extras" |

### Modal producto (edit flyout)

Panel colapsable **Personalización**:

- Grupos heredados (read-only label "Desde categoría X") + toggle desactivar.
- Opciones heredadas con toggle desactivar.
- Botón "Agregar grupo existente" → picker.
- Link "Administrar grupos" → nueva sección.

**No incluir:** editor completo de opciones dentro del flyout.

---

## Public UX propuesta

### Cuándo abrir modal

- Producto con `has_customizations=true` OR upsell configurado → modal obligatorio en "Agregar".
- Producto plano → flujo actual (add directo).

### Modal contenido

1. Header producto (nombre, imagen, base price).
2. Grupos ordenados por `sort_order` — radio/checkbox según tipo.
3. Validación inline required/min/max.
4. Sección plus al final (checkboxes productos reales con precio).
5. Footer sticky: total en vivo + "Agregar al carrito · $X".

### Carrito

- Línea expandible con sub-líneas grupo/opción/plus.
- Editar → reabre modal.
- Deduplicar: hash estable de selecciones ordenadas.

### "Desde $X"

- Server: `min_price = base + min(positive deltas)` por producto publicado.
- Opcional campo cache `products.price_from` mantenido por trigger/job — evaluar en SPEC.

---

## Dashboard UX propuesta

### Card compacta

- Mantener `item_summary` actual para producto base.
- Si snapshot: segunda línea truncada `"Papas Grandes · +1 extra"` (max 40 chars).

### Detalle expandido

- Componente `OrderItemCustomizationLines` leyendo snapshot.
- Plus hijos indentados bajo padre (via `parent_order_item_id` o snapshot.plus).

### WhatsApp (`lib/whatsapp/admin.ts`)

- Extender `buildOrderSummaryText` para incluir líneas de customization desde snapshot.

---

## Riesgos técnicos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Migración RPC `create_order` | Alto — producción depende de RPC | Versión v5 paralela; rollout con feature flag tenant |
| RLS multi-tenant en 6+ tablas nuevas | Alto | Plantilla policies existente; tests por business_id |
| Performance catálogo | Medio | Lazy load modal; flags ligeros en listado |
| Precio manipulado cliente | **Crítico** | Recalcular 100% server-side |
| Snapshots inconsistentes | Alto | Snapshot solo server; schema versionado `v:1` |
| Plus como producto real | Medio | Filas hijas + validar product_id tenant |
| parent_order_item_id | Medio | FK self-reference ON DELETE CASCADE |
| Pedidos manuales sin customization | Bajo | Documentar limitación V1 |
| Realtime payload | Bajo | Summary hydration ya implementada |
| UI admin scope creep | Medio | Sección dedicada; flyout mínimo |
| Drag and drop | Bajo | sort_order manual V1; DnD en ADMIN-3 |
| Compatibilidad pedidos legacy | Medio | snapshot nullable; UI fallback sin snapshot |
| Floating point JS en cart | Bajo | Display only; server numeric |

---

## Decisiones abiertas

Requieren confirmación del usuario antes de SPEC-1:

| # | Decisión | Opciones |
|---|----------|----------|
| D1 | Manual order customization en V1 | **Recomendado: V1.1** |
| D2 | Plus: fila hija vs solo snapshot | **Recomendado: fila hija + snapshot** |
| D3 | `unit_price` incluye plus o solo base+deltas | **Recomendado: padre = base+deltas; plus en hijos** |
| D4 | Campo cache `price_from` en products | Calcular on-read vs trigger |
| D5 | Ruta admin exacta | `/admin/products/customizations` vs `/admin/customizations` |
| D6 | Feature flag por tenant | `business_settings.customization_enabled` JSON |
| D7 | Drag and drop UI en V1 | **Recomendado: postergar** — sort_order numérico |
| D8 | Límite max opciones multi-select | Default 10? |

---

## Roadmap quirúrgico propuesto

### PRODUCT-CUSTOMIZATION-SPEC-1 — Final Product & Technical Spec

**Objetivo:** Cerrar spec escrita con schema JSON snapshot, wireframes admin/public/dashboard, resolver decisiones D1–D8.

**Scope:** Documentación, tipos TypeScript en draft (sin wiring).

**Fuera de scope:** Migraciones, UI, RPC.

**Entregables:** `docs/product-customization-v1-spec.md`, tipos draft en `lib/orders/customization/types.ts` (opcional read-only).

**Riesgos:** Scope creep en reglas condicionales.

**QA:** Review producto + checklist compatibilidad pedidos legacy.

---

### PRODUCT-CUSTOMIZATION-DB-1 — Schema, RLS & Types

**Objetivo:** Migraciones para tablas customization + columnas `order_items` + RLS + regenerar `types/database.ts`.

**Scope:** `supabase/migrations/*`, policies, indexes, grants SELECT anon donde aplique.

**Fuera de scope:** RPC, UI.

**Archivos candidatos:** nueva migración timestamp; `types/database.ts`.

**Validaciones:** `supabase db lint`; policies por business_id; FK compuestas.

**QA:** Insert/select admin y anon en staging; pedidos legacy sin snapshot siguen legibles.

**Criterios aceptación:** Migración aplicable; RLS pasa smoke; types regenerados.

---

### PRODUCT-CUSTOMIZATION-ADMIN-1 — Customization Groups Admin

**Objetivo:** CRUD grupos y opciones en `/admin/products/customizations`.

**Scope:** Nueva ruta, server actions admin, listado + editor grupo, sort_order manual.

**Fuera de scope:** Asignaciones, overrides producto, upsell.

**Archivos:** `app/admin/(protected)/products/customizations/*`, `components/admin/customization/*`, `lib/admin/customization/groups.ts`, actions.

**Validaciones:** manageProducts permission; tenant isolation.

**QA:** Crear grupo multi-required; opciones con price_delta; toggle available.

---

### PRODUCT-CUSTOMIZATION-ADMIN-2 — Assignments, Overrides & Upsell

**Objetivo:** Asignar grupos a categorías/productos; overrides en edit product; upsell 1 grupo por target.

**Scope:** Assignment UI, product flyout panel, upsell picker.

**Fuera de scope:** Catálogo público.

**Archivos:** `edit-product-form.tsx`, `categories/*`, `lib/admin/customization/assignments.ts`, `upsell.ts`.

**QA:** Herencia category→product; disable grupo/opción; upsell max 1.

---

### PRODUCT-CUSTOMIZATION-CATALOG-1 — Public Customization Modal

**Objetivo:** Modal público lazy-loaded; intercept add-to-cart; "Desde $X" en cards.

**Scope:** API/route handler product customization config; `CustomizationModal`; metadata en catalog query.

**Fuera de scope:** Checkout RPC changes.

**Archivos:** `catalog-client.tsx`, `product-card.tsx`, `lib/catalog/customization-public.ts`, optional `app/b/[slug]/catalogo/customization/[productId]/route.ts`.

**QA:** Required validation; live price; lazy load perf.

---

### PRODUCT-CUSTOMIZATION-CART-1 — Cart Pricing & Display

**Objetivo:** Extender `LocalCartItem`; dedup por signature; display jerárquico; edit from cart.

**Scope:** `lib/cart/local.ts`, cart UI, checkout summary display.

**Fuera de scope:** Server persistence.

**QA:** Dos líneas mismo producto distintas opciones; persist localStorage; total display.

---

### PRODUCT-CUSTOMIZATION-ORDER-1 — Order Creation Snapshot

**Objetivo:** RPC `create_order` v5; server validation lib; checkout + payload enriquecido; snapshots + plus hijos.

**Scope:** `lib/orders/customization/*`, migration RPC, `checkout/actions.ts`.

**Fuera de scope:** Manual order; dashboard display.

**QA:** Manipulación precio cliente rechazada; snapshot persisted; total correcto.

---

### PRODUCT-CUSTOMIZATION-DASHBOARD-1 — Operational Display

**Objetivo:** Render customization en card + detalle + WhatsApp summary.

**Scope:** `lib/orders/admin.ts`, `order-products-list.tsx`, `presenter.ts`, `whatsapp/admin.ts`.

**Fuera de scope:** Impresión.

**QA:** Pedido legacy sin snapshot OK; pedido con extras legible en card y detalle.

---

### PRODUCT-CUSTOMIZATION-QA-1 — End-to-End Smoke

**Objetivo:** Smoke producción/staging flujo completo público + dashboard.

**Scope:** QA documentación; no code unless bugs críticos en fase fix separada.

**QA:** Crear grupo → asignar → pedido público con extras + plus → dashboard → completar pedido QA.

---

## Recomendación final

OrderOps tiene **bases sólidas** para Product Customization V1:

- Tenancy y RLS consistentes (`business_id`).
- Snapshot parcial ya existe (`product_name`, `unit_price`).
- **Single choke point** de creación de pedidos (`create_order` RPC) facilita validación server-side.
- Catálogo y carrito están modularizados (`LocalCartItem`, `catalog-client`).

**Los tres cambios más críticos** son:

1. **Schema** — tablas customization + `order_items.customization_snapshot` + `parent_order_item_id`.
2. **RPC v5** — aceptar selecciones, validar, recalcular, persistir snapshot.
3. **Cart line identity** — dejar de deduplicar solo por `productId`.

**Estrategia de rollout:** feature flag por tenant; pedidos legacy sin snapshot siguen renderizando; manual order sin customization en V1.

**Snapshot:** JSONB versionado en `order_items` + filas hijas para plus (producto real).

**Performance:** lazy load customization al abrir modal; flags `has_customizations` / `price_from` en listado.

---

## Próxima fase sugerida

**PRODUCT-CUSTOMIZATION-SPEC-1** — cerrar decisiones abiertas (D1–D8), congelar JSON schema snapshot v1, y wireframes mínimos admin/public/dashboard antes de tocar migraciones.

---

## Validaciones ejecutadas

| Validación | Resultado |
|------------|-----------|
| Modificación código | **No** — solo lectura |
| Migraciones creadas | **No** |
| `npx tsc --noEmit` | Ejecutado en sesión de auditoría (baseline referencial; sin cambios de código) |
| Producción tocada | **No** |
