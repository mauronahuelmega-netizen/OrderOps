# Manual Order Creation Audit — M0

## Objetivo

Auditar qué se necesita para implementar de forma segura un flujo de **creación manual de pedidos** desde el dashboard admin, sin implementar código en M0.

## Contexto

El producto ya tiene checkout público vía RPC `create_order`, dashboard operativo con sesiones (C2), política de acciones en review mode (C3), guard server-side para mutaciones (C4) y copy de review mode (C4.1).

Feature futura:

```txt
Botón "Nuevo pedido" → modal → cliente/teléfono → delivery/retiro → productos → crear pending → kanban/realtime
```

Regla de producto reforzada por C3/C4:

```txt
Nuevo pedido sólo con sesión activa.
Una sesión cerrada se revisa, no se opera.
```

## Archivos revisados

| Área | Archivos |
|------|----------|
| Schema | `types/database.ts`, `supabase/migrations/20260426221000_t3_orders_order_items.sql`, `20260515173000_t9_order_status_v2.sql`, `20260604143000_v63_store_sessions.sql`, `20260608143000_on_demand_order_guardrails.sql`, `20260608170000_scheduled_operational_rules_guardrails.sql`, `20260426234000_t8_create_order_rpc.sql` |
| Creación existente | `components/public/checkout/checkout-client.tsx`, `lib/cart/local.ts`, `lib/catalog/public.ts` |
| Admin orders | `lib/orders/admin.ts`, `app/admin/(protected)/orders/[id]/actions.ts`, `app/admin/(protected)/orders/[id]/summary/route.ts` |
| Dashboard | `components/admin/orders/admin-dashboard-orders.tsx`, `components/admin/orders/DashboardToolbar.tsx`, `components/admin/orders/use-admin-orders-realtime.ts` |
| Realtime | `lib/orders/realtime.ts`, `lib/orders/dashboard-order-reconciliation.ts` |
| Sesiones | `lib/store-sessions/admin.ts`, `lib/store-sessions/types.ts` |
| Productos | `lib/products/admin.ts`, `lib/catalog/public.ts` |
| RLS | `supabase/migrations/20260426224000_t5_admin_rls.sql`, `20260427021000_super_admin_roles_and_rls.sql` |
| Docs previas | `docs/board-orders-execution-area-phase-c2.md`, `c3.md`, `c4.md`, `c4-1.md` |

## Hallazgo principal

**Ya existe un único write path autoritativo para crear pedidos: la RPC PostgreSQL `public.create_order` (security definer).** No hay server action admin de creación ni INSERT directo permitido por RLS. El checkout público la invoca desde el browser; el admin debería invocarla **desde una server action** con guards adicionales de sesión activa y permisos.

Implicaciones críticas:

1. **`create_order` exige `business_settings.on_demand_mode_active = true`**, sincronizado con apertura/cierre de sesión (`openStoreSession` / `closeStoreSession`). En la práctica, crear pedidos manualmente alinea con sesión activa, pero el contrato actual es el flag operativo, no `store_sessions` directamente.
2. **No existe `store_session_id` ni `order_source` en `orders`.** La pertenencia a sesión se infiere por `created_at >= session.opened_at` (C4).
3. **El dashboard ya reconcilia INSERTs realtime** con dedupe por `order.id` y fetch a `/admin/orders/[id]/summary`.

## Schema orders

**Tabla:** `public.orders`

| Campo | Tipo / valores | Obligatorio | Notas |
|-------|----------------|-------------|-------|
| `id` | `uuid` PK | auto | `gen_random_uuid()` |
| `business_id` | `uuid` FK → `businesses` | sí | tenant scope |
| `customer_name` | `text` | sí | `trim` length > 0 |
| `phone` | `text` | sí | `trim` length > 0 |
| `delivery_date` | `date` | sí | validado en RPC (pasado, scheduled rules) |
| `delivery_time` | `text` | no | no lo setea `create_order` hoy |
| `delivery_method` | `delivery` \| `pickup` | sí | check constraint |
| `address` | `text` | condicional | obligatorio si `delivery_method = delivery` |
| `notes` | `text` | no | |
| `total_price` | `numeric(12,2)` | sí | ≥ 0; calculado server-side en RPC |
| `status` | enum lógico | sí, default `pending` | `pending`, `preparing`, `ready`, `completed`, `cancelled` |
| `assigned_to` | `uuid` FK → `profiles` | no | mutación separada |
| `assigned_at` | `timestamptz` | no | |
| `created_at` | `timestamptz` | auto | UTC default |

**No existen:** `store_session_id`, `order_source`, `source`, payment fields, delivery fee columns.

**Constraints relevantes:**

- `orders_delivery_method_valid`
- `orders_address_required_for_delivery`
- `orders_status_valid` (post T9)
- `orders_total_price_non_negative`

**Índices:** `business_id`, `delivery_date`.

## Schema order_items

**Tabla:** `public.order_items`

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `id` | `uuid` PK | auto | |
| `order_id` | `uuid` FK → `orders` ON DELETE CASCADE | sí | |
| `product_id` | `uuid` FK → `products` ON DELETE SET NULL | no | nullable snapshot-friendly |
| `product_name` | `text` | sí | snapshot al crear |
| `unit_price` | `numeric(12,2)` | sí | snapshot desde `products.price` |
| `quantity` | `integer` | sí | > 0 |

**No existen:** subtotal column (derivado), modifiers, variants, line notes.

**RPC `create_order` inserta items con snapshot** (`product_name`, `unit_price` desde `products` al momento de crear).

## Schema products

**Tabla:** `public.products`

| Campo | Notas |
|-------|-------|
| `id`, `business_id`, `category_id` | FK compuesta categoría/negocio |
| `name`, `price` | precio autoritativo en DB |
| `description`, `image_url` | opcionales |
| `is_available` | boolean; RPC exige `true` |
| `sku`, `stock` | agregados en migraciones recientes |
| `created_at` | |

**No existen:** variants, modifiers, delivery fee en producto.

**Disponibilidad:**

- Catálogo público: `lib/catalog/public.ts` filtra `is_available = true`.
- Admin products: `lib/products/admin.ts` lista todos; filtros opcionales `status=active|inactive`, `stock`.
- Trigger `auto_suspend_out_of_stock_product`: si `stock <= 0` → `is_available = false`. **No hay decremento de stock al crear pedido.**

## Existing order creation flow

### Único flujo de creación encontrado

| Aspecto | Detalle |
|---------|---------|
| **Archivo cliente** | `components/public/checkout/checkout-client.tsx` |
| **Mecanismo** | `supabase.rpc("create_order", payload)` desde browser (anon/authenticated) |
| **Input RPC** | `p_business_id`, `p_customer_name`, `p_phone`, `p_delivery_date`, `p_delivery_method`, `p_address?`, `p_notes?`, `p_items: [{ product_id, quantity }]` |
| **Output** | `uuid` (`order_id`) |
| **Status inicial** | `pending` |
| **Post-create** | best-effort `POST /api/internal/orders/{id}/push`; redirect a success page |

### Validaciones en RPC (versión actual ~ `20260608170000`)

1. Campos obligatorios y `delivery` → `address`.
2. `items` array no vacío; cada item `product_id` + `quantity > 0`.
3. Negocio activo (`businesses.is_active`).
4. **`on_demand_mode_active = true`** en `business_settings`.
5. Reglas scheduled si `scheduled_mode_active` (fechas futuras, lead time, cutoff, días inactivos).
6. Productos existen, pertenecen al negocio, **`is_available = true`**.
7. **Total server-side:** `sum(products.price * quantity)`.
8. Insert `orders` + `order_items` en transacción.

### Qué NO existe

- Server action admin `createOrderAction`.
- Helper `lib/orders/create*.ts`.
- INSERT directo admin vía Supabase client (RLS no permite INSERT en `orders`).
- WhatsApp/webhook intake de pedidos.
- `createOrderEvent` en creación (sólo en cambios de status/assignment).

### ¿Reutilizable para manual order?

**Parcialmente sí**, con reservas:

| Reutilizar | Reservas |
|------------|----------|
| RPC `create_order` para pricing + items snapshot | Requiere `on_demand_mode_active` (OK si sesión abierta) |
| Mismo shape de items `{ product_id, quantity }` | Scheduled rules pueden complicar `delivery_date` en manual |
| Mismo status inicial `pending` | No valida sesión activa explícitamente |
| Invocación desde **server action** (no browser) | Evaluar si scheduled guardrails aplican a pedidos manuales “para ya” |

**Recomendación M1:** server action admin que:

1. Valide permiso `updateOrders` + sesión activa (`assertActiveStoreSessionForOrderCreation`).
2. Normalice payload (delivery_date = hoy para MVP on-demand).
3. Llame RPC vía service/server client **o** fork RPC admin-specific si scheduled/on_demand rules no encajan.

## Pricing / totals

| Pregunta | Respuesta actual |
|----------|------------------|
| ¿Precio desde products? | Sí, en RPC join `products.price` |
| ¿Cliente envía precio? | No; checkout sólo `product_id` + `quantity` |
| ¿Snapshot? | Sí: `order_items.product_name`, `unit_price` |
| ¿Total? | `orders.total_price = sum(price * qty)` en RPC |
| ¿Delivery fee? | No |
| ¿Descuentos/promos? | No |
| ¿Variantes/modifiers? | No |
| ¿Redondeo? | `numeric(12,2)` |

**Regla cumplida hoy en checkout:** el server recalcula precios; el client no es fuente de verdad del total.

**M1 debe preservar esto:** la server action no debe confiar en totales del modal.

## Product availability

- RPC valida `is_available = true` y ownership por `business_id`.
- Stock **no** se valida ni decrementa al crear pedido.
- Productos agotados pueden quedar `is_available = false` vía trigger de stock.
- Para picker del modal manual: reutilizar query similar a `getPublicCatalogByBusinessId` (solo disponibles) o `getAdminProducts` filtrado `status=active`.

## Session active requirement

### Estado actual C4

- `assertActiveStoreSessionForOrderMutation` valida sesión activa + order existente en ventana (`created_at >= opened_at`).
- **No aplica a creación** (no hay order previo).

### Integración requerida para create

| Capa | Qué hacer |
|------|-----------|
| **C3 UI** | Botón visible/habilitado sólo si `orderActionPolicy.canMutateOrders` (sesión activa) |
| **C4 server** | Nuevo helper recomendado: `assertActiveStoreSessionForOrderCreation({ businessId })` → sólo `NO_ACTIVE_SESSION` / sesión válida |
| **RPC** | Hoy gatea `on_demand_mode_active`; al cerrar sesión se pone `false` → RPC falla aunque se saltee helper |
| **Race** | Modal abierto + cierre en otro tab → server action debe fallar; UI C3 + hydrate existente |

**No reutilizar tal cual** `assertActiveStoreSessionForOrderMutation` para create: necesita variante sin order, o función hermana.

### C2 scope

Pedido creado con `created_at = now()` durante sesión activa caerá en ventana operativa (`store-session`). Tras cierre, pasa a `last-closed-store-session` review scope automáticamente.

## C2/C3/C4 integration

| Fase | Integración manual create |
|------|---------------------------|
| **C2** | Pedido nuevo visible en sesión activa; tras cierre permanece en última sesión cerrada |
| **C3** | Botón/modal submit bloqueados en review mode; `canMutateOrders = false` |
| **C4** | Server action debe exigir sesión activa antes de RPC |
| **C4.1** | Sin impacto directo; copy review mode ya consistente |

**business-window fallback:** producto dice “Nuevo pedido sólo con sesión activa” → ocultar/deshabilitar botón aunque `canMutateOrders` sea true en passive mode hoy.

## Realtime integration

| Pregunta | Respuesta |
|----------|-----------|
| ¿INSERT en `orders` llega al dashboard? | Sí, `useAdminOrdersRealtime` suscrito a `orders` |
| ¿Incluye `order_items`? | No en payload realtime; se fetch `/admin/orders/{id}/summary` |
| Normalización | `getAdminDashboardOrderById` → `AdminOrderDashboardItem` |
| Dedupe | `onOrderInsert` ignora si `optimisticOrdersRef` ya tiene `id`; `insertRealtimeOrderIntoState` también |
| Efectos UX | Sonido/toast/browser notification en insert visible |

**Riesgo duplicado:** bajo si se usa dedupe por `id`. Si M2 inserta localmente el pedido confirmado **antes** de realtime, el handler ignora el segundo insert.

**Recomendación M3:**

```txt
server action retorna AdminOrderDashboardItem normalizado
→ insertRealtimeOrderIntoState(order) local confirmado
→ realtime INSERT dedupe por id
→ opcional: triggerNewOrderArrivalEffects si conviene UX interna
```

Push notification (`/api/internal/orders/{id}/push`): checkout lo dispara; manual debería replicar best-effort post-create.

## Optimistic/local insertion

Patrón actual para nuevos pedidos:

1. Realtime INSERT → fetch summary → `insertRealtimeOrderIntoState`.
2. Updates usan `patchDashboardOrderFromRealtime` o fetch completo.
3. Mutaciones status/assignment usan optimistic con pending locks (`dashboard-order-reconciliation`).

**No hay optimistic create hoy.** Para manual:

- **No recomendar** optimistic pre-confirmación (sin order id).
- **Sí recomendar** insert local post-respuesta server + dedupe realtime.
- Pending mutation locks no aplican a create.

Helpers existentes reutilizables:

- `getAdminDashboardOrderById` / summary route
- `insertRealtimeOrderIntoState`
- `sortOrdersForOperationalBoard`

## UI entry point recommendation

### Dónde poner “Nuevo pedido”

| Ubicación | Pros | Contras |
|-----------|------|---------|
| **`DashboardToolbar` `operationalRow`** junto a session cluster | Visible en zona operativa; cerca de Abrir/Cerrar sesión | Riesgo overflow mobile |
| Junto al título “Pedidos en curso” | Contexto claro | Compite con session controls |
| Top section “Panel del Negocio” | Alta visibilidad | Mezcla analytics con acción operativa |

**Recomendación M3:** `DashboardToolbar`, desktop: botón primary/secondary **“Nuevo pedido”** a la derecha del título o antes del session cluster. Condicionado por:

```ts
canUpdateOrders && orderActionPolicy.canMutateOrders && hasActiveStoreSession
```

En review mode: **oculto o disabled** con tooltip “Abrí una sesión para crear pedidos”.

### Flags C3/C4

| Scope | Botón |
|-------|-------|
| `store-session` | Habilitado (si permiso) |
| `last-closed-store-session` | Oculto/disabled |
| `business-window` | Oculto/disabled (producto: requiere sesión activa) |

## Modal fields recommendation (MVP)

Campos mínimos alineados con schema + RPC:

| Campo | MVP | Validación |
|-------|-----|------------|
| `customer_name` | sí | required, trim |
| `phone` | sí | required |
| `delivery_method` | sí | delivery \| pickup |
| `address` | sí si delivery | required |
| `notes` | opcional | |
| `delivery_date` | default **hoy** | server normaliza; evitar scheduled UX en M1 salvo requisito |
| `delivery_time` | omitir M1 | columna existe pero RPC no la setea |
| Items | product picker + qty | min 1 item; server recalcula precio |
| Total preview | read-only | calculado client-side **solo display**; server authoritative |

Post-submit: status `pending` → aparece lane Pendientes.

**Fuera de MVP:** payment, discounts, modifiers, stock decrement, CRM customer search, scheduled future dates.

## Mobile/tablet considerations

`DashboardToolbar` usa `operationalRow` flex-wrap + `sessionCluster` compacto.

| Viewport | Recomendación |
|----------|---------------|
| Desktop | Texto “Nuevo pedido” + ícono opcional |
| Mobile | Botón compacto “+ Pedido” o icon con `aria-label`; colocar en `operationalRow` antes de session cluster; validar overflow con filtros + search |
| Tablet | Mismo que desktop con wrap |

CSS existente en `dashboard-toolbar.module.css` ya maneja wrap en breakpoints (~286+). M3 debe probar con botón extra sin rediseño estructural.

## Risks

| Riesgo | Severidad | Mitigación M1+ |
|--------|-----------|----------------|
| Reutilizar RPC público con reglas scheduled/on_demand | Alta | Server action normaliza `delivery_date`; evaluar RPC admin fork |
| `on_demand_mode_active` desincronizado de sesión | Media | Reusar helpers store session; fail closed |
| Sin `store_session_id` | Media | `created_at` window; futuro schema opcional |
| Stock no decrementado | Media | Documentar; no vender productos sin stock en picker |
| Scheduled rules bloquean “pedido para hoy” edge cases | Media | Tests con `scheduled_mode_active` |
| Duplicado local + realtime | Baja | Dedupe por id existente |
| Permisos: sólo roles con `updateOrders` | Baja | Guard en server action |
| RPC callable desde browser admin si se expone igual que checkout | Media | Crear sólo vía server action authenticated |
| No timeline event “order_created” | Baja | Opcional post-MVP |

## Recommended implementation roadmap

### M1 — Manual Order Server Contract

**Objetivo:** Server action + guards + RPC invocation + respuesta normalizada.

**Archivos probables:**

- `app/admin/(protected)/dashboard/actions.ts` o `app/admin/(protected)/orders/actions.ts` (nuevo)
- `lib/store-sessions/admin.ts` (`assertActiveStoreSessionForOrderCreation`)
- `lib/orders/admin.ts` (helper `createManualOrder`, mapper a `AdminOrderDashboardItem`)
- Opcional: nueva migración RPC `create_manual_order` **solo si** reglas públicas no encajan (decisión documentada en M1)

**Riesgos:** scheduled/on_demand coupling; permisos; errores RPC opacos.

**Criterios de aceptación:**

- Create falla sin sesión activa (server).
- Create falla en review mode aunque UI bloquee.
- Total/items calculados server-side.
- Retorna `AdminOrderDashboardItem` o `{ orderId }` + fetch helper.
- No INSERT directo RLS.

### M2 — Manual Order Modal UI

**Objetivo:** Modal/form cliente + product picker + submit.

**Archivos probables:**

- Nuevo `components/admin/orders/manual-order-modal.tsx` (o similar)
- `components/admin/orders/admin-dashboard-orders.tsx` (state open/close, handler)
- Reutilizar patrones de `status-form` / checkout form
- Catálogo: route o server fetch products disponibles

**Riesgos:** UX mobile; validación client vs server; loading states.

**Criterios de aceptación:**

- Campos MVP completos.
- Disabled en review mode.
- Errores server mostrados con toast.
- No confiar en total client para persistir.

### M3 — Toolbar Integration & Reconciliation

**Objetivo:** Botón toolbar + insert local post-create + push opcional.

**Archivos probables:**

- `components/admin/orders/DashboardToolbar.tsx`
- `dashboard-toolbar.module.css` (mínimo)
- `admin-dashboard-orders.tsx` (`insertRealtimeOrderIntoState` tras create)

**Riesgos:** toolbar overflow; duplicate realtime.

**Criterios de aceptación:**

- Botón sólo sesión activa + permiso.
- Pedido aparece en kanban sin refresh full page.
- Realtime dedupe OK.
- Push best-effort opcional.

### M4 — Manual Order QA / Production Hardening

**Objetivo:** QA multi-tab, race session close, scheduled edge cases, roles, mobile.

**Criterios:** checklist producción; documentación operativa.

## Files likely touched by M1

- `lib/store-sessions/admin.ts`
- `lib/store-sessions/types.ts`
- `lib/orders/admin.ts`
- `app/admin/(protected)/dashboard/actions.ts` (o nuevo `orders/create/actions.ts`)
- Opcional: `supabase/migrations/*` **solo si** se decide RPC admin (fuera de scope M0; evaluar en M1)

## Files likely touched by M2

- `components/admin/orders/admin-dashboard-orders.tsx`
- Nuevo modal component + CSS module
- Posible route `GET` products for picker (o reuse server action)

## Files likely touched by M3

- `components/admin/orders/DashboardToolbar.tsx`
- `dashboard-toolbar.module.css`
- `admin-dashboard-orders.tsx` (wiring + local insert)

## What NOT to implement yet

- cierre de caja
- payment method
- discounts/promos
- delivery fee avanzado
- modifiers complejos / variants
- `store_session_id` migration
- stock decrement
- customer CRM / historial cliente en modal
- session selector / historial
- reports/export
- optimistic pre-create
- cambios a C2/C3/C4/C4.1 scope/copy/guards salvo extensión create guard

## QA recommendations

1. Crear pedido manual con sesión activa → pending en kanban.
2. Cerrar sesión → botón disabled; server reject si forzado.
3. Multi-tab: Tab B cierra sesión; Tab A submit → error controlado.
4. Producto no disponible → RPC error claro.
5. Delivery sin dirección → validation client + server.
6. Realtime + local insert → un solo card.
7. Roles viewer → botón oculto / server 403.
8. Mobile toolbar → sin overflow roto.

## Next phase recommendation

**M1 — Manual Order Server Contract**

Definir server action, helper de sesión activa para creación, contrato de respuesta normalizada y decisión RPC existente vs admin RPC fork antes de UI.
