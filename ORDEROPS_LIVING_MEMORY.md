# OrderOps — Living Memory (Cerebro Inmutable)

> **Propósito:** Este archivo es la memoria viva y autoritativa del proyecto. Cualquier refactorización importante, cambio de esquema, nueva ruta, módulo o patrón arquitectónico **debe registrarse aquí** para preservar el contexto histórico entre sesiones de desarrollo y agentes IA.
>
> **Actualizar tras:** migraciones SQL, cambios en Realtime/RLS, nuevos módulos tenant, reestructuración de carpetas, introducción de feature flags, cambios en el flujo de pedidos o en el sistema de estilos.

**Última auditoría:** 2026-06-06  
**Stack:** Next.js 15.3 · React 19 · TypeScript 5.8 · Supabase SSR/JS 2.49

---

## 1. Resumen Arquitectónico

### Visión

OrderOps es un **SaaS multi-tenant** de operaciones de pedidos para negocios locales (catálogo público + panel admin operativo). Cada tenant es un `business` identificado por `business_id` en BD y `slug` en rutas públicas.

### Capas del sistema

```
┌─────────────────────────────────────────────────────────────┐
│  PÚBLICO (/b/[slug]/…)                                      │
│  Catálogo → Carrito (localStorage) → Checkout → RPC       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE (Postgres + Auth + RLS + Realtime + Storage)      │
│  businesses · profiles · orders · products · store_sessions  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ADMIN (/admin/…)                                           │
│  Dashboard operativo · Workspace · Team · Settings          │
│  Realtime + Presence + Push + Audio notifications           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPER-ADMIN (/super-admin/…)                               │
│  Gestión de negocios y usuarios plataforma                  │
└─────────────────────────────────────────────────────────────┘
```

### Estructura de carpetas

| Ruta | Responsabilidad |
|------|-----------------|
| `app/` | App Router: layouts, páginas, route handlers, `theme-tokens.css`, `globals.css` |
| `components/admin/` | UI admin: orders dashboard, shell, nav, notifications, products, team, settings |
| `components/public/` | Catálogo, checkout, landing, theme toggle |
| `components/super-admin/` | Forms de gestión plataforma |
| `components/ui/` | Primitivas compartidas (`Button`, `Badge`, `Input`, `EmptyState`, `Skeleton`) |
| `lib/orders/` | Cerebro operativo: queries, realtime, lanes, metrics, SLA/saturation BI, prescriptive actions, presenter, sorting |
| `lib/supabase/` | Clientes browser/server/middleware/service |
| `lib/admin/` | Context, permissions, team, action errors |
| `lib/store-sessions/` | Apertura/cierre/hidratación de sesiones de tienda |
| `lib/notifications/` | Audio, push, browser, preferences, dedupe |
| `lib/catalog/`, `lib/business/`, `lib/products/` | Catálogo y CRUD admin |
| `supabase/migrations/` | Esquema, RLS, RPC, publicaciones Realtime |
| `types/database.ts` | Tipos generados Supabase |
| `docs/` | Documentación de fases, auditorías y decisiones |

### Rutas principales

**Público**
- `/` — Landing marketing
- `/b/[slug]` — Landing del negocio
- `/b/[slug]/catalogo` — Catálogo
- `/b/[slug]/checkout` — Checkout → RPC `create_order`
- `/b/[slug]/success` — Confirmación

**Admin** (protegido por `requireAdminContext()`)
- `/admin/dashboard` — Dashboard operativo (SSR + `AdminDashboardOrders`)
- `/admin/orders/[id]` — Detalle profundo
- `/admin/products`, `/admin/categories`, `/admin/team`
- `/admin/settings/public/*` — Branding, catálogo hero, notificaciones

**API interna (reconciliación)**
- `GET /admin/dashboard/orders` — Silent refresh lista completa
- `GET /admin/orders/[id]/summary` — Hidratación completa post-Realtime
- `GET /admin/orders/[id]/workspace` — Hidratación workspace
- `POST /api/internal/orders/[id]/push` — Web push server-side

**Super-admin**
- `/super-admin/businesses`, `/super-admin/users`

### Auth y middleware

- `middleware.ts` → `lib/supabase/middleware.ts` refresca cookies en `/admin/*` y `/b/*`
- Admin: `profiles.business_id` + `role` → `lib/admin/context.ts`
- Super-admin: `role = 'super_admin'`, `business_id` nullable

### Patrón Realtime (Reconciliación Defensiva)

```
Evento Supabase → patch optimista → hidratación defensiva → silent refresh → estado convergente
```

**Canales activos:**
| Canal | Tabla/Evento | Hook |
|-------|--------------|------|
| `admin-orders:{businessId}` | `orders` INSERT/UPDATE | `use-admin-orders-realtime.ts` |
| `store-session-{businessId}` | `store_sessions` | `use-admin-store-session-realtime.ts` |
| `business-presence:{businessId}` | Presence | `use-admin-presence.ts` |

**Candados síncronos:** `pendingMutationsRef` (Map in-memory, TTL 8s) — no locks de BD.

**Cadena de derivación:**
```
orders → hydratedOrders → optimisticOrders → windowScopedOrders → filteredOrders → lanes/metrics/insights
```

### Sistema de estilos

| Capa | Archivo | Uso permitido |
|------|---------|---------------|
| Tokens semánticos | `app/theme-tokens.css` | Variables CSS Zinc/Índigo — light/dark vía `html[data-dashboard-theme]` + `localStorage` (`orderops-theme`) |
| Superficies compartidas | `components/admin/admin-surfaces.css` | `.oo-canvas`, `.oo-surface`, `.admin-status-badge*` — **congelado** |
| Dominio orders | `components/admin/orders/*.module.css` | **100% CSS Modules + tokens** — `orders-admin.css` **eliminado** |
| Dominio products | `components/admin/products/*.module.css` | **100% CSS Modules + tokens** — `products-admin.css` **eliminado** |
| Componentes | `*.module.css` | **Único destino para estilos nuevos** |

Paleta: Zinc (`#FAFAFB`, `#09090B`) + Índigo (`#4F46E5`, `#6366F1`). SVGs: `contain: paint layout`.

### Tenancy y permisos

- **Clave real:** `business_id` (no `tenant_id` en código ni BD)
- **Roles:** `owner`, `manager`, `operator`, `viewer`, `admin` (legacy), `super_admin`
- **Matriz:** `lib/admin/permissions.ts`
- **RLS:** subquery `profiles.business_id` en todas las tablas tenant

### Módulos y modos (estado)

| Feature | Estado | Notas |
|---------|--------|-------|
| Dashboard operativo + lanes | ✅ Producción | `admin-dashboard-orders.tsx` (~2700 líneas; orquestador + extracciones Fase 8) |
| Store Sessions | ✅ Producción | Ventana operativa `store-session` vs `business-window` |
| Assignment + Presence | ✅ Producción | `assigned_to`, heartbeat 30s, stale 90s |
| Order Events (timeline) | ✅ Producción | `order_events` append-only |
| Push + Audio + Browser notif. | ✅ Producción | `push_subscriptions`, audio unlock modal |
| **Gestión de Productos (admin)** | ✅ **Producción** | Módulo finalizado — ver §1.1 |
| Kitchen Mode | 🔮 Roadmap | Documentado en `docs/context.md` |
| Delivery Mode | 🔮 Roadmap | Lanes delivery parcialmente implementadas |
| On-Demand vs Programado | 🔮 Roadmap | Sin flags runtime; `delivery_date` existe en schema |

---

## 1.1 Módulo de Productos (Finalizado)

> **Estado:** ✅ **Producción** — 2026-06-11  
> **Ruta:** `/admin/products`  
> **Alcance:** CRUD de productos, filtros server-side, flyout de creación/edición, tabla de alta densidad, motor de imágenes y estados vacíos. Documentado como referencia arquitectónica para futuros módulos admin.

### Arquitectura de Datos — 2026-06-11

- **SKU autogenerado:** `createProductAction` genera SKU con formato `AAA-000` a partir del prefijo de la categoría cuando el campo se deja vacío (Fase 12.1).
- **Columnas operativas:** Migración `20260610103000_add_product_sku_stock.sql` — campos `sku` y `stock` en `products`.
- **Integridad SQL (Supabase):** Trigger `auto_suspend_out_of_stock_product()` (`20260610110000_auto_suspend_out_of_stock.sql`) — si `stock <= 0`, `is_available` pasa a `false` automáticamente para evitar sobreventas.
- **Capa de consulta:** `lib/products/admin.ts` — `getAdminProducts` con filtros compuestos (`q`, `categoryId`, `stock`, `status`); detalle bajo demanda vía `getAdminProductById` + Server Actions en `app/admin/(protected)/products/actions.ts`.

### UI de Alta Densidad — 2026-06-11

- **Tabla responsiva:** `ProductTableView` — desktop tabla / mobile grid (`product-table-view.tsx` + `.module.css`).
- **SKU apilado:** Código bajo el nombre del producto (sin columna SKU dedicada); fallback `SIN ASIGNAR`; tipografía monospace.
- **Columnas numéricas:** Precio y stock alineados a la derecha para escaneo rápido.
- **Toggle de disponibilidad:** `ProductAvailabilityToggle` con mutación optimista local (sin bloqueo global `isPending` en la lista).
- **Layout fluido:** Toolbar superior + grid expansivo (`dashboard-shell`, Fase 9–10); sin doble sidebar.

### Filtros Inteligentes — 2026-06-11

- **URL-Driven:** `ProductsToolbar` sincroniza `q`, `category`, `stock` y `status` con `searchParams` de Next.js.
- **Debounce en búsqueda:** Texto con retardo antes de navegar (nombre o SKU).
- **Filtrado server-side:** `getAdminProducts` aplica predicates en Postgres; sin filtrado client-side masivo.
- **Empty State restrictivo:** `ProductCatalogEmptyState` (wrapper) + primitiva global `<EmptyState />` con acción “Limpiar filtros” cuando la búsqueda no devuelve resultados (Fase 14 → Fase 2 UI).

### UX Premium — 2026-06-11

- **Motor de recorte 1:1:** `react-easy-crop` + `ImageCropModal` + util `lib/utils/cropImage.ts` (Canvas → `File` JPEG).
- **Subida directa:** Drag & drop en dropzone (`product-form.module.css`); upload a bucket `product-images` vía Supabase Storage (`businessId/productId/uuid.ext`).
- **Re-recorte sin re-upload:** Badge de tijera (`.editImageBadge`) intercepta clic y reabre `ImageCropModal` con la imagen actual; clic en el resto del dropzone abre explorador de archivos (Fase 19.1).
- **Formularios simétricos:** `CreateProductForm` y `EditProductForm` comparten `product-form.module.css` — CSS Grid, categoría inline (`createCategoryAction` + dialog), input de moneda con `$`, switch de disponibilidad.
- **Skeleton Loaders:** `ProductFormSkeleton` usa primitiva global `<Skeleton />`; reemplaza spinner genérico en flyout de edición; labels incluidos para evitar CLS (Fase 18–19 → Fase 2 UI).
- **Select de categoría pulido:** Flecha nativa oculta; chevron SVG custom con `padding-right: 2.5rem` (Fase 19.2).

### Estándar Enterprise — 2026-06-11

- **Flyout unificado:** `FlyoutPanel` + `ProductsManagementProvider` — creación, edición y categoría inline; scroll-lock (`useScrollLock`); panel 560px desktop.
- **Consistencia visual:** Modales de creación/edición con la misma grilla, dropzone, divider y acciones; shell compartido (`styles.formShell`, altura de controles 42px).
- **Consolidación visual (Fases 1–3):** Módulo 100% tokenizado — sin `products-admin.css`; grid móvil en `product-grid.module.css` + `product-card.module.css`; botones principales vía `<Button />` global.
- **Eliminación de redundancias:** Botón “+ Nueva categoría” removido del toolbar principal (`products-header-actions.tsx`); alta de categoría solo inline en formularios (Fase 17).
- **Estados vacíos y feedback:** Empty states, hints de búsqueda en toolbar, mensajes de error/éxito en formularios, overlay “Cambiar foto” + badge persistente en imagen (accesibilidad táctil).
- **Archivos clave:**

| Área | Archivos |
|------|----------|
| Estado global | `products-management-provider.tsx`, `flyout-panel.tsx` |
| Tabla / filtros | `product-table-view.tsx`, `products-toolbar.tsx`, `product-catalog-section.tsx` |
| Grid móvil | `product-grid-server.tsx`, `product-grid.module.css`, `product-card.tsx`, `product-card.module.css` |
| Formularios | `create-product-form.tsx`, `edit-product-form.tsx`, `product-form.module.css`, `product-form-skeleton.tsx` |
| Imágenes | `image-crop-modal.tsx`, `vendor/react-easy-crop.css`, `lib/utils/cropImage.ts` |
| UI global | `components/ui/empty-state.tsx`, `components/ui/skeleton.tsx` |
| Server | `lib/products/admin.ts`, `app/admin/(protected)/products/actions.ts`, `app/admin/(protected)/categories/actions.ts` |
| BD | `20260610103000_add_product_sku_stock.sql`, `20260610110000_auto_suspend_out_of_stock.sql` |

---

## 2. Esquema de Base de Datos (Resumen)

> Fuente de verdad: `supabase/migrations/` (25 migraciones). Tipos: `types/database.ts`.

### Diagrama relacional simplificado

```
businesses (1) ──┬── (N) profiles
                 ├── (N) categories ── (N) products
                 ├── (N) orders ──┬── (N) order_items
                 │                └── (N) order_events
                 ├── (N) store_sessions
                 └── (N) push_subscriptions
```

### Tablas

#### `businesses`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `name`, `slug` | text | `slug` único, formato `[a-z0-9-]+` |
| `whatsapp_number` | text | |
| `logo_url` | text? | |
| `is_active` | boolean | default true |
| `created_at` | timestamptz | |
| + branding | text? | `primary_color`, hero copy (migraciones t9/t10) |

#### `profiles`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK → `auth.users` | |
| `business_id` | uuid? → businesses | nullable solo para `super_admin` |
| `role` | text | `owner\|manager\|operator\|viewer\|admin\|super_admin` |
| `notification_preferences` | jsonb | Migración u1 |
| `created_at` | timestamptz | |

#### `categories` / `products`
- Ambas con `business_id`
- `products.category_id` + FK compuesta `(category_id, business_id)`
- `products`: `name`, `description`, `price`, `image_url`, `is_available`, **`sku`**, **`stock`** (migración `20260610103000`)
- `categories`: `name`, `position`
- **Trigger:** `auto_suspend_out_of_stock_product()` — `stock <= 0` → `is_available = false` (migración `20260610110000`)

#### `orders`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | **Índice tenant** |
| `customer_name`, `phone` | text | |
| `delivery_date` | date | |
| `delivery_time` | text? | |
| `delivery_method` | text | `delivery` \| `pickup` |
| `address` | text? | Requerido si delivery |
| `notes` | text? | |
| `total_price` | numeric(12,2) | Calculado server-side en RPC |
| `status` | text | `pending\|preparing\|ready\|completed\|cancelled` |
| `assigned_to` | uuid? → profiles | Migración s3 |
| `assigned_at` | timestamptz? | |
| `created_at` | timestamptz | |

**Status v2 (t9):** `in_progress` renombrado a `preparing`; agregado `ready`.

#### `order_items`
| Columna | Tipo | Notas |
|---------|------|-------|
| `order_id` | uuid FK | CASCADE delete |
| `product_id` | uuid? FK | Snapshot si producto eliminado |
| `product_name`, `unit_price`, `quantity` | | Snapshot inmutable |

#### `order_events`
| Columna | Tipo | Notas |
|---------|------|-------|
| `business_id`, `order_id` | uuid FK | |
| `actor_profile_id` | uuid? | |
| `event_type` | text | `order_created\|status_changed\|assignment_taken\|assignment_released` |
| `payload` | jsonb | |
| `created_at` | timestamptz | Append-only |

#### `store_sessions`
| Columna | Tipo | Notas |
|---------|------|-------|
| `business_id` | uuid FK | |
| `opened_at`, `closed_at` | timestamptz? | |
| `status` | text | `open\|closed` |
| `opened_by`, `closed_by` | uuid? → profiles | |
| Índice único | | Una sesión `open` por business |

#### `push_subscriptions`
| Columna | Tipo | Notas |
|---------|------|-------|
| `business_id`, `profile_id` | uuid FK | |
| `endpoint`, `p256dh`, `auth` | text | Web Push keys |
| `revoked_at` | timestamptz? | Soft revoke |

### RPC crítica

- **`create_order`** (`t8_create_order_rpc.sql`) — Security definer; valida productos, calcula total, inserta order + items en transacción.

### RLS (patrón universal)

```sql
business_id = (select p.business_id from profiles p where p.id = auth.uid())
-- o super_admin bypass
```

Tablas con RLS: `businesses`, `profiles`, `categories`, `products`, `orders`, `order_items`, `order_events`, `store_sessions`, `push_subscriptions`.

Lectura pública (sin auth): `categories`, `products`, `businesses` activos — migración `t6_public_catalog_read`.

### Realtime publication

| Tabla | Migración | Replica Identity |
|-------|-----------|------------------|
| `orders` | `t12_orders_realtime_publication` | FULL |
| `store_sessions` | `v63_store_sessions_realtime_publication` | FULL |

### Storage buckets

- `product-images` — imágenes de productos por `business_id`
- `business-assets` — logos y assets de branding

---

## 2.1 Configuración de Infraestructura

### Next.js `images.remotePatterns`

Archivo: `next.config.ts`

| Regla | Valor | Motivo |
|-------|-------|--------|
| `protocol` | `https` | Solo assets servidos por HTTPS |
| `hostname` | `**.supabase.co` | Dominio de Supabase Storage (proyecto) |
| `pathname` | `/storage/v1/object/public/**` | Solo objetos públicos del bucket; no API ni rutas auth |

**Uso:** `next/image` en admin (`ProductCard`) y futuras vistas de catálogo. URLs fuera de este patrón no pasan por el optimizador (fallback a placeholder en admin).

**Buckets cubiertos:** `product-images`, `business-assets` (ambos bajo `/storage/v1/object/public/...`).

### Next.js Image + Supabase Transformations

Archivos: `lib/supabase/image-loader.ts`, `next.config.ts` (`loader: "custom"`).

| Pieza | Detalle |
|-------|---------|
| `sharp` | Dependencia de producción para el pipeline de `next/image` (fallback local) |
| `getSupabaseImageLoader(src, width, quality)` | Convierte `/object/public/` → `/render/image/public/` con `width`, `quality`, `format=webp` |
| Custom loader global | Evita que Next descargue el origin completo; Supabase/imgproxy redimensiona en edge |

**Ejemplo de URL transformada:** `.../storage/v1/render/image/public/product-images/...?width=120&quality=80&format=webp`

---

## 3. Registro de Cambios Arquitectónicos (Changelog)

> Formato bitácora: `YYYY-MM-DD — [Área] Descripción`. Registrar de más antiguo a más reciente.

### 2026-04-26 — Fundación (T1–T8)

- **DB** `t1`: Tablas `businesses`, `profiles` — multi-tenant base con `slug` único.
- **DB** `t2`: `categories`, `products` con FK compuesta business-scoped.
- **DB** `t3`: `orders`, `order_items` con snapshot de producto y status v1.
- **DB** `t4`: Índices MVP (`business_id`, `delivery_date`).
- **DB** `t5`: RLS admin en todas las tablas tenant.
- **DB** `t6`: Lectura pública de catálogo sin autenticación.
- **DB** `t7`: Storage `product-images` con políticas por carpeta `business_id`.
- **DB** `t8`: RPC `create_order` security definer — totales server-side.

### 2026-04-27 — Super Admin + Storage fixes

- **Auth** `super_admin_roles_and_rls`: Rol `super_admin` con bypass RLS controlado.
- **Auth** `super_admin_profiles_nullable_business`: `business_id` nullable para super-admin.
- **Storage** Normalización políticas `product-images` y fix folder policy.

### 2026-05-05 — Branding tenant

- **DB** `t9_business_branding_fields`: Campos de marca en `businesses`.
- **DB** `t10_business_assets_storage`: Bucket `business-assets`.
- **DB** `t11_businesses_update_rls`: Política UPDATE para owners.

### 2026-05-06 — Catálogo hero

- **DB** `catalog_hero_copy_fields`: Campos de copy para hero del catálogo público.

### 2026-05-15 — Status v2 operativo

- **DB** `t9_order_status_v2`: `in_progress` → `preparing`; nuevo estado `ready`. Alineación con lanes operativas.

### 2026-05-16 — Realtime + Roles + Assignment + Events

- **Realtime** `t12_orders_realtime_publication`: `orders` en `supabase_realtime`, REPLICA IDENTITY FULL.
- **Auth** `s1_business_roles`: Roles granulares `owner/manager/operator/viewer`.
- **DB** `s3_order_assignment_fields`: `assigned_to`, `assigned_at` en orders.
- **DB** `s4_order_events`: Timeline append-only con RLS.

### 2026-05-18 — Notificaciones

- **DB** `u1_profile_notification_preferences`: JSONB preferencias por perfil.
- **DB** `u4_push_subscriptions`: Web Push endpoints por profile+business.

### 2026-06-04 — Store Sessions (V6.3)

- **DB** `v63_store_sessions`: Tabla `store_sessions` con una sesión abierta por business.
- **Realtime** `v63_store_sessions_realtime_publication`: Sync de sesiones en dashboard.
- **Ops** Ventana operativa dual: `store-session` vs `business-window` en `lib/orders/analytics.ts`.

### 2026-06-07 — Blindaje de desarrollo (esta auditoría)

- **DX** Creación de `.cursorrules` — reglas estrictas de estilos modulares, Realtime, tenancy.
- **DX** Creación de `ORDEROPS_LIVING_MEMORY.md` — cerebro inmutable del proyecto.
- **Nota** Confirmado: tenancy usa `business_id`; `tenant_id` es nomenclatura conceptual en docs legacy.
- **Nota** Kitchen Mode, On-Demand y Programado permanecen en roadmap — sin feature flags runtime.

### 2026-06-07 — Feature flags por tenant (`business_settings`)

- **DB** Tabla `business_settings` con PK/FK `business_id` → `businesses(id)` ON DELETE CASCADE; relación 1:1 estricta por tenant.
- **DB** Flags: `on_demand_mode_active` (default true), `scheduled_mode_active`, `kitchen_mode_active`, `delivery_mode_active` (default false).
- **Auth** RLS SELECT para miembros autenticados del tenant (+ bypass `super_admin`); UPDATE solo `owner`/`manager`.
- **DB** Trigger `on_business_created_create_settings` inserta fila por defecto al registrar un negocio; backfill para negocios existentes.
- Archivos: `supabase/migrations/20260607210325_business_settings.sql`, `types/database.ts`
- Breaking: no — negocios existentes reciben defaults vía backfill en migración.

### 2026-06-08 — Hook de feature flags por tenant

- **DX** Creación de hook `useBusinessSettings` para abstracción de flags por tenant.
- Archivos: `lib/business/use-business-settings.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — Propagación global de feature flags en AdminShell

- **DX** Integración de `useBusinessSettings` en AdminShell para propagación global de flags.
- Archivos: `components/admin/admin-shell.tsx`, `lib/business/use-business-settings.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — Guardrails de Kitchen Mode en admin

- **Ops** Implementación de guardrails (`notFound`) en ruta `/admin/kitchen` y blindaje de navegación.
- Archivos: `app/admin/(protected)/kitchen/page.tsx`, `components/admin/admin-nav-links.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — Blindaje On-Demand en pedidos públicos

- **Ops** Blindaje On-Demand: validación en RPC `create_order` y UI de checkout público.
- **DB** `create_order` rechaza pedidos si `business_settings.on_demand_mode_active = false`; política RLS pública de lectura de settings para negocios activos.
- Archivos: `supabase/migrations/20260608143000_on_demand_order_guardrails.sql`, `lib/business/public.ts`, `components/public/checkout/checkout-client.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — Blindaje Scheduled Mode en pedidos públicos

- **Ops** Blindaje Scheduled Mode: lógica de checkout condicional y validación en RPC `create_order`.
- **DB** `create_order` rechaza fechas futuras si `scheduled_mode_active = false`; valida que la fecha no sea pasada.
- **UI** Checkout oculta el selector de fecha cuando el modo programado está desactivado; envía fecha del día (on-demand).
- Archivos: `supabase/migrations/20260608153000_scheduled_mode_order_guardrails.sql`, `lib/business/public.ts`, `components/public/checkout/checkout-client.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — Reglas operativas Scheduled en business_settings

- **DB** Expansión de `business_settings` con reglas operativas (lead time, cutoff, inactive days) para el modo Scheduled.
- **DB** Columnas: `scheduled_min_lead_time_hours` (default 24), `scheduled_max_days_in_advance` (default 30), `scheduled_cutoff_time` (default 18:00), `inactive_working_days` (default `{}`).
- Archivos: `supabase/migrations/20260608160000_business_settings_operations.sql`, `types/database.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — UI de configuración operativa en admin

- **UI** Creación de `/admin/settings/operations` para configuración de modos operativos y Server Action de actualización.
- **UI** Secciones: suscripción de modos (solo lectura), control On-Demand (`toggleBusinessStatus`) y formulario Scheduled (`updateScheduledSettings`).
- Archivos: `app/admin/(protected)/settings/operations/page.tsx`, `operations-settings-client.tsx`, `operations-settings.module.css`, `actions.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — Blindaje Scheduled en checkout y RPC

- **Ops** Enlace de navegación para Settings Operativos y blindaje estricto de fechas Scheduled en Checkout y RPC `create_order`.
- **Ops** Validaciones: ventana máxima, días inactivos, lead time mínimo y hora de corte; checkout restringe selector con reglas de `business_settings`.
- Archivos: `components/admin/settings/public-settings-nav.tsx`, `lib/business/public.ts`, `lib/business/scheduled-delivery-rules.ts`, `components/public/checkout/checkout-client.tsx`, `supabase/migrations/20260608170000_scheduled_operational_rules_guardrails.sql`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — PR1 perf catálogo admin (React.cache + query lean)

- **DX/Perf** PR1: Implementación de `React.cache()` en `getAdminContext` y optimización de query lean en `getAdminProducts` para reducción de payload.
- **Perf** Nuevo `getAdminProductById` + Server Action para cargar detalle solo al abrir el modal de edición; grid usa `AdminProductListItem`.
- Archivos: `lib/admin/context.ts`, `lib/products/admin.ts`, `app/admin/(protected)/products/actions.ts`, `components/admin/products/product-catalog-panel.tsx`, `product-card.tsx`, `products-workspace.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — PR2 split SC/CC catálogo admin

- **UI/Perf** PR2: Split de `ProductGridServer` (Server Component) y `ProductsWorkspace` (Client), implementación de `next/dynamic` para formularios y Suspense boundaries.
- **UI/Perf** `ProductCatalogSection` async dentro de `<Suspense>`; `loading.tsx` con skeleton de catálogo; triggers cliente mínimos para edición y empty states.
- Archivos: `app/admin/(protected)/products/page.tsx`, `loading.tsx`, `components/admin/products/product-grid-server.tsx`, `product-catalog-section.tsx`, `products-workspace.tsx`, `products-header-actions.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — PR3 next/image y memoización catálogo admin

- **UI/Perf** PR3: Migración a `next/image` para optimización de assets, implementación de `remotePatterns` y memoización de `ProductCard`.
- **UI/Perf** `ProductEditTrigger` con handler estabilizado; contexto de acciones separado del estado en `ProductsWorkspace` para evitar re-render del grid al abrir modales.
- Archivos: `next.config.ts`, `lib/products/product-image.ts`, `components/admin/products/product-card.tsx`, `product-edit-trigger.tsx`, `products-workspace.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 — PR4 paginación server-side catálogo admin

- **Perf** PR4: Implementación de paginación server-side en `getAdminProducts` y controles de navegación en el catálogo administrativo.
- **Perf** Query con `.range()` + `count: "exact"`; URL `?page=N`; componente `ProductPagination` con links nativos de Next.js.
- Archivos: `lib/products/admin.ts`, `app/admin/(protected)/products/page.tsx`, `components/admin/products/product-catalog-section.tsx`, `product-grid-server.tsx`, `product-pagination.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — UX polish modal edición de productos

- **UI** UX Polish: Implementación de scroll-lock, modal responsive scrollable y AdminSpinner profesional en el flujo de edición.
- **UI** Hook `useScrollLock` en el contenedor del modal; `.admin-modal` con `max-height: 90vh` y scroll interno; spinner semántico con tokens del tema.
- Archivos: `hooks/use-scroll-lock.ts`, `components/ui/admin-spinner.tsx`, `components/admin/products/edit-product-form.module.css`, `products-admin.css`, `products-workspace.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Limpieza código muerto /admin/products (Fase 1)

- **DX/Cleanup** Limpieza de código muerto en `/admin/products` previa a migración de arquitectura: eliminados paneles obsoletos, funciones huérfanas y CSS legacy.
- Eliminados `create-product-panel.tsx`, `create-category-panel.tsx`, `getAdminProductsCount`, hook `useProductsWorkspace` y selectores CSS legacy (`.admin-products-layout`, `.admin-products-sidebar`, `.admin-products-list`, `.admin-products-create-panel`).
- Archivos: `lib/products/admin.ts`, `components/admin/products/products-workspace.tsx`, `products-admin.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Fase 2 ProductsManagementProvider y selectors

- **DX** Fase 2: Implementación de `ProductsManagementProvider` y extracción de lógica de selección a `lib/products/selectors.ts`.
- **DX** Estado centralizado (`flyoutMode`, `selectedProductId`, `viewMode`, `categories`, `totalCount`); eliminado `ProductCatalogStateSync`; consumidores migrados a `useProductsManagement()`.
- Archivos: `lib/products/selectors.ts`, `products-management-provider.tsx`, `products-workspace.tsx`, `page.tsx`, `product-catalog-section.tsx`, `product-grid-server.tsx`, `products-header-actions.tsx`, `product-empty-state-actions.tsx`, `product-edit-trigger.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Fase 3 DashboardShell (3-panel layout)

- **UI** Fase 3: Implementación de `DashboardShell` (3-panel layout) con Flyout Panel integrado y estado unificado.
- **UI** Grid `240px 1fr auto` con sidebar de filtros, grid central y flyout deslizable; lógica de edición/creación migrada de modal a `FlyoutPanel`; eliminado `ProductsWorkspace`.
- Archivos: `components/admin/layout/dashboard-shell.tsx`, `dashboard-shell.module.css`, `flyout-panel.tsx`, `products-dashboard-sidebar.tsx`, `page.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Conectividad ProductCard → FlyoutPanel

- **UI** Conectividad funcional: ProductCard habilitado como disparador de FlyoutPanel; sincronizado estado de selección con el provider.
- **UI** Fetch de producto centralizado en `ProductsManagementProvider` (`selectedProduct`, loading/error); transición suave del flyout refinada.
- Archivos: `product-card.tsx`, `products-management-provider.tsx`, `flyout-panel.tsx`, `product-grid-server.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Fase 4 AdminSidebar modular

- **UI** Fase 4: Creación de `AdminNavList` (compartido) y `AdminSidebar` (escritorio). Implementación de lógica modular de navegación reutilizando `admin-nav-config.ts`.
- **UI** Sidebar en preview oculto (`display: none`) dentro de `AdminShell`; nav horizontal legacy intacto.
- Archivos: `components/admin/layout/admin-nav-list.tsx`, `admin-sidebar.tsx`, `admin-sidebar.module.css`, `admin-nav-list.module.css`, `admin-shell.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Fase 5 Corte de navegación

- **UI** Fase 5: Corte de navegación. Implementación de `AdminShell` con Sidebar persistente (desktop) y migración de `MobileDrawer` a `AdminNavList` compartido. Eliminación de código nav legacy.
- **UI** Grid `240px 1fr` en desktop (≥900px); sidebar oculto en mobile; `AdminTopbar` slim (brand + acciones + hamburger); eliminado `admin-nav-links.tsx`.
- Archivos: `admin-shell.css`, `admin-shell.tsx`, `admin-topbar.tsx`, `admin-mobile-drawer.tsx`, `admin-header.css`, `admin-sidebar.tsx`, `admin-nav-list.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Fase 7 AdminBrand (identidad consolidada)

- **UI/Architecture** Fase 7: Consolidación de Identidad en `AdminBrand`. Extracción de branding desde Topbar/Drawer hacia AdminSidebar como Centro de Comando.
- **UI** `AdminBrand` presentacional (`logoUrl`, `name`); identidad en sidebar (desktop) y drawer (mobile); topbar sin logo, acciones alineadas a la derecha.
- Archivos: `components/admin/layout/admin-brand.tsx`, `admin-brand.module.css`, `admin-sidebar.tsx`, `admin-topbar.tsx`, `admin-mobile-drawer.tsx`, `admin-header.css`, `admin-mobile-drawer.css`, `admin-shell.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Fase 8 Responsive SaaS Standard

- **UI/Layout** Fase 8: Migración a Responsive SaaS Standard. Topbar eliminado en escritorio; sesión y logout unificados en el footer del AdminSidebar. Grid principal expandido a 100vh.
- **UI** Mobile (<900px): topbar con logo + hamburger; desktop (≥900px): sidebar full-height con identidad, nav y sesión; contenido principal con scroll vertical independiente.
- Archivos: `admin-sidebar.tsx`, `admin-sidebar.module.css`, `admin-shell.tsx`, `admin-shell.css`, `admin-topbar.tsx`, `admin-header.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 — Fase 9 Doble Sidebar Productos → Toolbar

- **UI/Layout** Fase 9: Desmantelamiento de Doble Sidebar en dominio de Productos. DashboardShell refactorizado a layout de columna (Toolbar superior + Grid expansivo), eliminando navegación lateral anidada para maximizar espacio en escritorio y evitar scroll doble en mobile.
- Archivos: `components/admin/products/dashboard-shell.tsx`, `dashboard-shell.module.css`, `products-toolbar.tsx`, `products-toolbar.module.css`, `app/admin/(protected)/products/page.tsx`; eliminados `layout/dashboard-shell.*`, `products-dashboard-sidebar.*`

### 2026-06-09 — Fase 10 Fluid Width

- **UI/Layout** Fase 10: Transición a Fluid Width. Eliminados los límites de max-width en admin-shell para aprovechar el 100% del espacio en escritorio tras la consolidación del Sidebar.
- **UI** Grid de productos con `repeat(auto-fill, minmax(280px, 1fr))`; padding lateral alineado entre toolbar y contenido (`var(--space-xl)` en desktop).
- Archivos: `admin-shell.css`, `admin-page-layout.css`, `products-toolbar.module.css`, `dashboard-shell.module.css`, `products-admin.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 — Fase 11 ProductTableView responsiva

- **DB/UI** Fase 11: Migración añadida para SKU/Stock en productos. Implementación de ProductTableView responsiva (Tabla en Desktop, Grid en Mobile) mediante CSS. Toggle manual de vista eliminado por UX.
- Archivos: `supabase/migrations/20260610103000_add_product_sku_stock.sql`, `types/database.ts`, `lib/products/admin.ts`, `products/actions.ts`, `product-table-view.tsx`, `product-catalog-views.tsx`, `product-catalog-section.tsx`, `products-toolbar.tsx`, `products-management-provider.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 — Fase 12 Paridad SKU/Stock en formularios

- **UI/API** Fase 12: Paridad de Datos. Formularios de creación y edición de productos (y sus Server Actions) actualizados para soportar los campos SKU y Stock.
- Archivos: `create-product-form.tsx`, `edit-product-form.tsx`, `app/admin/(protected)/products/actions.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 — Fase 12.1 SKU autogenerado

- **API/Ops** Fase 12.1: SKU Autogenerado. Implementada lógica en createProductAction para generar SKUs con formato AAA-000 basados en la categoría si el input se deja en blanco.
- Archivos: `app/admin/(protected)/products/actions.ts`, `create-product-form.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 — Fase 12.2 Trigger auto-suspensión por stock

- **DB/Ops** Fase 12.2: Trigger de seguridad implementado en Postgres. Cuando el stock de un producto <= 0, is_available pasa a false automáticamente para evitar sobreventas.
- Archivos: `supabase/migrations/20260610110000_auto_suspend_out_of_stock.sql`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 — Fase 13 Filtros Inteligentes

- **UI/API** Fase 13: Filtros Inteligentes. Implementados controles URL-Driven (Search, Categoría, Stock, Estado) en ProductsToolbar. Modificada capa de BD (getAdminProducts) para procesar filtrado compuesto del lado del servidor.
- Archivos: `products-toolbar.tsx`, `products-toolbar.module.css`, `lib/products/admin.ts`, `app/admin/(protected)/products/page.tsx`, `product-catalog-section.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 — Fase 14 Empty State y pulido de tabla

- **UI** Fase 14 completada: Pulido de tabla (alta densidad) y agregado de Empty State para búsquedas sin resultados.
- Archivos: `product-table-view.tsx`, `product-table-view.module.css`, `products-toolbar.module.css`, `product-empty-state.tsx`, `product-empty-state.module.css`, `product-catalog-section.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 — Fase 11.5 ProductAvailabilityToggle

- **UI/Ops** Fase 11.5: Componente ProductAvailabilityToggle extraído para evitar bloqueos masivos (global isPending) en listas. Implementada mutación optimista local y UI de switch moderno.
- Archivos: `product-availability-toggle.tsx`, `product-availability-toggle.module.css`, `product-table-view.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-11 — Fase 15–16 Formularios premium e Image Crop

- **UI/Storage** Fase 15–16: Rediseño de `CreateProductForm` con CSS Grid, dropzone drag & drop, categoría inline, input de moneda y validación `checkValidity`.
- **UI/Storage** Motor de recorte 1:1: `react-easy-crop`, `ImageCropModal`, `lib/utils/cropImage.ts`; CSS de crop vendido en `vendor/react-easy-crop.css` (Fase 3).
- Archivos: `create-product-form.tsx`, `product-form.module.css`, `image-crop-modal.tsx`, `image-crop-modal.module.css`, `lib/utils/cropImage.ts`, `vendor/react-easy-crop.css`, `flyout-panel.module.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-11 — Fase 17 Consolidación de modales

- **UI/DX** Fase 17: `EditProductForm` sincronizado con paridad total de `CreateProductForm` (dropzone, crop, categoría inline, grid, moneda, switch).
- **UI/DX** Eliminado botón redundante “+ Nueva categoría” del toolbar principal; alta de categoría solo inline en formularios.
- Archivos: `edit-product-form.tsx`, `products-header-actions.tsx`, `create-product-form.tsx`, `product-form.module.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-11 — Fase 18–19 Hyper-pulido de edición

- **UI** Fase 18: `ProductFormSkeleton` reemplaza `AdminSpinner` en flyout de edición; estructura replica grilla del formulario.
- **UI/A11y** Fase 19: Skeleton con labels anti-CLS; label “Imagen” en `sr-only`; badge persistente de edición; padding de moneda `2rem`.
- **UI/UX** Fase 19.1: Badge de tijera reabre `ImageCropModal` con imagen actual (`stopPropagation`); re-recorte sin re-upload.
- **UI** Fase 19.2: Select de categoría con `appearance: none` y chevron SVG custom (`padding-right: 2.5rem`).
- Archivos: `product-form-skeleton.tsx`, `flyout-panel.tsx`, `edit-product-form.tsx`, `create-product-form.tsx`, `product-form.module.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-11 — Módulo de Productos cerrado (Enterprise SaaS)

- **Ops/DX** Consolidación del módulo `/admin/products` en estado **Producción**. Referencia arquitectónica documentada en §1.1 — datos (SKU + triggers), tabla alta densidad, filtros URL-driven server-side, UX premium (crop + skeletons) y estándar enterprise (flyout, empty states, paridad create/edit).
- Archivos: ver tabla en §1.1 Módulo de Productos (Finalizado)
- Breaking: no

### 2026-06-06 — Consolidación Visual (Fases 1 a 3) — Productos 100% Tokenizado

- **DX/Auditoría** **Auditoría inicial:** Generación de `docs/orderops-visual-system-consolidation-audit.md` para separar el sistema legacy (warm/cream, hex fijos) del nuevo sistema semántico (tokens Zinc/Índigo + CSS Modules).
- **UI/DX** **Foundation (Z-Index & Tokens):** Creación de `docs/visual-z-index-scale.md` estandarizando capas de apilamiento (p. ej. crop modal `z-index: 60`). Centralización del icono chevron en `app/theme-tokens.css` (`--icon-chevron-down`) consumido por toolbars y formularios.
- **UI** **Arsenal UI global:** Extracción exitosa de `<EmptyState />` y `<Skeleton />` desde el dominio de productos hacia `components/ui/` para uso cross-módulo. `ProductCatalogEmptyState` y `ProductFormSkeleton` delegan en las primitivas; eliminados `product-empty-state.tsx` y animación `@keyframes pulse` duplicada en formularios.
- **UI** **Erradicación legacy:** Eliminación completa física y de referencias de `components/admin/products/products-admin.css` (import removido de `app/admin/(protected)/layout.tsx`). Estilos migrados a CSS Modules tokenizados; código muerto removido (`product-edit-trigger.tsx`, reglas `.admin-modal-*` huérfanas). `.admin-status-badge*` centralizado en `admin-surfaces.css`.
- **UI** **Mobile Grid:** Refactorización de la vista móvil de productos usando estrictamente CSS Modules (`product-grid.module.css`, `product-card.module.css`, `product-pagination.module.css`, `product-catalog-skeleton.module.css`) y tokens semánticos (`--bg-surface`, `--border-subtle`, `--text-primary`, hover `--bg-surface-hover` / `--border-strong`). Badge de estado y placeholder “Sin foto” preservados.
- **UI/DX** **Vendoring:** CSS de `react-easy-crop` vendido en `components/admin/products/vendor/react-easy-crop.css` e importado desde `image-crop-modal.tsx` — evita corrupción de typecheck por `.css.d.ts` inválido en `node_modules`.
- **UI** Adopción de primitivas `<Button />` en acciones principales (`products-header-actions`, `products-toolbar`, paginación, formularios). Página de categorías migrada a `categories-layout.module.css`.
- Archivos: `docs/orderops-visual-system-consolidation-audit.md`, `docs/visual-z-index-scale.md`, `app/theme-tokens.css`, `components/ui/empty-state.tsx`, `components/ui/skeleton.tsx`, `components/admin/products/*.module.css`, `components/admin/categories/categories-layout.module.css`, `components/admin/admin-surfaces.css`, `app/admin/(protected)/layout.tsx`, `image-crop-modal.tsx`
- Breaking: no — paridad visual mantenida

### 2026-06-06 — Consolidación Visual (Fase 4) - Orders Premium Pass

- **UI** Migración exitosa de la vista Kanban y Listas a CSS Modules (`dashboard-kanban.module.css`, `dashboard-list.module.css`).
- **UI/DX** Extracción de `<OrderCard />` a componente independiente tokenizado, eliminando 170 líneas de JSX inline (`order-card.tsx`, `order-card.module.css`, `order-card-quick-actions.module.css`).
- **UI** Refactor del Toolbar (filtros y búsqueda) consumiendo primitivas `<Button>` e `<Input>` (`dashboard-toolbar.module.css`, `operational-search.module.css`).
- **UI/DX** **Eliminación absoluta de `orders-admin.css`**, erradicando el último gran bloque de deuda técnica global; import removido de `app/admin/(protected)/layout.tsx`.
- **UI/DX** Fix de pureza CSS Modules (`:global()`) en superficies residuales analíticas y de detalle (`dashboard-analytics-surfaces.module.css`, `order-detail-surfaces.module.css`); componentes React actualizados a referencias modulares (`surfaceStyles.*`, `detailStyles.*`).
- Archivos: `components/admin/orders/dashboard-kanban.module.css`, `dashboard-list.module.css`, `dashboard-toolbar.module.css`, `dashboard-analytics-surfaces.module.css`, `order-detail-surfaces.module.css`, `order-card.tsx`, `admin-dashboard-orders.tsx`, `order-workspace.tsx`, `order-product-modal.tsx`, `app/admin/(protected)/layout.tsx`
- Breaking: no — paridad visual mantenida; lógica Realtime, filtros y reconciler intactos

### 2026-06-06 — Consolidación Visual (Fase Final) - Supabase Sidebar & Dark Theme

- **UI/Layout** Refactor del Sidebar a `position: fixed` colapsable (72px → 240px on hover) estilo Supabase, con patrón “ventana” (filas internas a 240px recortadas por overflow), iconos centrados matemáticamente y scroll horizontal erradicado (`admin-sidebar.module.css`, `admin-nav-list.tsx`, `admin-brand.tsx`).
- **UI/Layout** Resolución del layout shift del shell: rail fantasma de 72px en `admin-shell.tsx` + grid `72px minmax(0, 1fr)` en `admin-shell.css` para que el `<main>` no colapse con sidebar fixed.
- **UI/Perf** Paridad estructural de `<ProductCatalogSkeleton />`: esqueleto de **tabla** en desktop (8 filas, 7 columnas) y **grid** en mobile; prop `includeToolbar` para `loading.tsx` dentro de `DashboardShell` — erradica el salto visual grid→tabla durante la carga del catálogo.
- **UI/DX** Implementación de `<AdminThemeToggle />` (Client Component) en el footer del sidebar: persiste `orderops-theme` en `localStorage` e inyecta `data-dashboard-theme="dark"|"light"` en `<html>`; paleta oscura Zinc completada en `theme-tokens.css` (estados operativos legibles).
- **Ops/DX** **Cierre oficial de la deuda técnica visual del Admin.** Panel 100% CSS Modules + tokens semánticos; sin hojas globales de dominio (`orders-admin.css`, `products-admin.css` eliminados). Superficies congeladas limitadas a `admin-surfaces.css`.
- Archivos: `components/admin/layout/admin-sidebar.module.css`, `admin-sidebar.tsx`, `admin-theme-toggle.tsx`, `admin-shell.css`, `admin-shell.tsx`, `components/admin/products/product-catalog-skeleton.tsx`, `product-catalog-skeleton.module.css`, `app/admin/(protected)/products/loading.tsx`, `app/theme-tokens.css`
- Breaking: no

### 2026-06-06 — Refactor UI/Perf Dashboard (Operación Clean Slate)

- **UI/DX** **Fase 8.1 — Surface Cleansing:** Erradicación de clases globales legacy (`oo-surface`, `oo-panel`, `oo-surface-muted`) en `/admin/dashboard` a favor de CSS Modules tokenizados (`executionSection`, `contextSection` en `admin-dashboard-orders.module.css`). Aplanamiento de strips de contexto (`operational-summary-strip`, `business-insights-strip`, `operational-feed`) y tokenización de buscador/presencia para Dark Mode.
- **UI** **Fase 8.2 — Dark Mode Remediation (Kanban):** Migración estricta a tokens semánticos en `lane-navigation-scanning.module.css` y `lane-metrics-layer.module.css` — eliminados hex/rgba warm legacy; estados operativos vía `--bg-*-subtle`, `--text-*-strong`, `--border-subtle/strong`, `--shadow-sm`; contraste AA en light/dark.
- **UI/Perf** **Fase 8.3 — Desmembramiento del monolito:** Memoización estricta de `<OrderCard />` con comparación de campos operativos (`status`, `assigned_to`, `operational_aging`, etc.) y `optimisticOrdersRef` para estabilizar `handleCardKeyDown` y no invalidar memo en cada evento Realtime.
- **UI/Architecture** Extracción arquitectónica del JSX inline: `DashboardToolbar`, `DashboardKanbanBoard`, `DashboardMobileOverview`, `DashboardContextPanel`.
- **UI/Perf** Lazy Loading (`next/dynamic`, `ssr: false`) de `AdminOrderWorkspaceModal` con montaje condicional al abrir pedido — payload inicial del dashboard reducido (~225 kB → ~217 kB First Load JS).
- Archivos: `components/admin/orders/admin-dashboard-orders.tsx`, `DashboardToolbar.tsx`, `DashboardKanbanBoard.tsx`, `DashboardMobileOverview.tsx`, `DashboardContextPanel.tsx`, `DashboardOverview.tsx`, `order-card.tsx`, `lane-navigation-scanning.module.css`, `lane-metrics-layer.module.css`, `operational-search.module.css`, `operator-presence-pill.module.css`, `operational-summary-strip.module.css`, `business-insights-strip.module.css`, `operational-feed.module.css`, `admin-dashboard-orders.module.css`
- Breaking: no — paridad visual; lógica Realtime, hooks y reconciler intactos

### 2026-06-06 — Upgrade BI: SLA Tracker & Saturation Index

- **Ops/DX** **Limpieza de datos:** Centralización de reglas de negocio en `lib/orders/constants.ts` (`SLA_THRESHOLDS`, `SATURATION_THRESHOLDS`, `OPERATIONAL_THRESHOLDS`) y eliminación de memos muertos (`commercialInsights`, `operationalInsights`) en el orquestador principal — reduce recomputación innecesaria en cada render.
- **Ops/API** **Pipeline de promesa:** Inclusión de `delivery_time` en SELECTs de `getAdminOrders` / `getAdminDashboardOrderById`, tipos `AdminOrderListItem` / `AdminOrderDashboardItem` y builder `buildAdminOrderDashboardItem` — habilita SLA en tiempo real sobre `delivery_date` + `delivery_time`.
- **Ops** **Riesgo prescriptivo:** Creación de `lib/orders/prescriptive-actions.ts` (`buildPrescriptiveActions`) — evalúa pedidos activos vía `assessOrderRisk` y devuelve acción operativa (`Operacion fluida` / `Atencion requerida en N pedidos`) con tono semántico.
- **Ops/BI** **SLA Promise Tracker:** Implementación de `lib/orders/sla-metrics.ts` (`calculateSLACompliance`) — clasifica pedidos pending/preparing en `on-time`, `at-risk` (< 15 min) y `breached`; devuelve % de cumplimiento y conteos en vivo.
- **Ops/BI** **Saturation Index (Queue Pressure):** Implementación de `lib/orders/saturation-metrics.ts` (`calculateSaturationIndex`) — mide presión de cola de cocina: `(preparing × tiempo base) / (capacidad ideal × tiempo base)` con estados **Cocina fluida**, **Alta demanda** y **Saturacion / Cuello de botella**.
- **UI** **Operational Strip prescriptivo:** Evolución de `DashboardOverview` / `admin-dashboard-orders.tsx` — reemplazo de métricas pasivas (Estancados, Tiempo de preparación) por **Estado de cocina**, **Cumplimiento SLA** y **Riesgo operativo**; tonos semánticos (`success` / `attention` / `danger`) vía `data-tone` en `DashboardOverview.module.css`; paridad en vista móvil.
- Archivos: `lib/orders/constants.ts`, `lib/orders/prescriptive-actions.ts`, `lib/orders/sla-metrics.ts`, `lib/orders/saturation-metrics.ts`, `lib/orders/admin.ts`, `components/admin/orders/admin-dashboard-orders.tsx`, `components/admin/orders/DashboardOverview.tsx`, `components/admin/orders/DashboardOverview.module.css`, `components/admin/orders/DashboardMobileOverview.tsx`
- Breaking: no — métricas legacy (`averagePreparation`, `stalled`) permanecen en `overviewOperationalInsights` para otros consumidores; strip operativo usa claves `kitchenSaturation`, `slaCompliance`, `operationalRisk`

---

## 4. Convenciones de Actualización

Al registrar un cambio, incluir:

1. **Fecha** (YYYY-MM-DD)
2. **Área** — uno de: `DB`, `Realtime`, `Auth`, `UI`, `Ops`, `Storage`, `DX`, `API`
3. **Descripción** — qué cambió y por qué (1-2 líneas)
4. **Archivos/migraciones** afectados (si aplica)
5. **Breaking changes** — si los hay, documentar migración necesaria

### Plantilla

```markdown
### YYYY-MM-DD — Título breve
- **[Área]** Descripción del cambio.
- Archivos: `ruta/al/archivo.ts`, `supabase/migrations/...sql`
- Breaking: sí/no — detalle si aplica
```

---

## 5. Referencias Rápidas

| Documento | Contenido |
|-----------|-----------|
| `docs/ARCHITECTURE.md` | Arquitectura detallada |
| `docs/context.md` | Principios operativos y modos futuros |
| `docs/CURRENT_PHASE.md` | Fase actual de desarrollo |
| `docs/DECISIONS.md` | Decisiones técnicas registradas |
| `docs/CRITICAL_FILES.md` | Archivos de alto impacto |
| `docs/DB_SCHEMA_NOTES.md` | Notas de esquema y limitaciones |
| `docs/orderops-visual-system-consolidation-audit.md` | Auditoría sistema visual legacy vs semántico |
| `docs/visual-z-index-scale.md` | Escala de capas z-index admin |
| `AUDITORIA_COMPLETA_APP.md` | Auditoría completa en español (Jun 2026) |
| `.cursorrules` | Reglas del copiloto IA |

---

*Este documento es la fuente de verdad para contexto arquitectónico. Si contradice otro doc, prevalece este archivo tras confirmación en el Registro de Cambios.*
