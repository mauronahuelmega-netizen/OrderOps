# Admin Products Delete Capability Audit — PD1

## Objetivo

Auditar de punta a punta la capacidad de **eliminar productos** en `/admin/products`: schema, RLS, FKs, pedidos históricos, server actions, UI modal, catálogo público, storage e imágenes — **sin implementar delete**.

## Contexto

- `/admin/products` soporta crear, editar, disponibilidad (`is_available`), stock y SKU.
- El modal lateral de edición (`FlyoutPanel` + `EditProductForm`) tiene CTA principal `Guardar cambios`; **no existe delete**.
- Hipótesis inicial (“probablemente no hay DELETE en DB”) **parcialmente incorrecta**: la policy RLS `products_delete_own_business` **sí existe** desde T5; falta server action + UI + endurecimiento de permisos por rol.

**Referencias leídas:** `docs/admin-products-visual-audit-p1.md`, `docs/admin-products-v1-visual-handoff.md`, fases P2a–P2f, `docs/board-orders-execution-area-v1-final-handoff.md`.

---

## Archivos revisados

| Área | Archivos |
|------|----------|
| Migrations | `supabase/migrations/20260426215500_t2_categories_products.sql`, `20260426221000_t3_orders_order_items.sql`, `20260426224000_t5_admin_rls.sql`, `20260426230000_t6_public_catalog_read.sql`, `20260426231500_t7_product_images_storage.sql`, `20260427021000_super_admin_roles_and_rls.sql`, `20260610103000_add_product_sku_stock.sql`, RPCs create_order |
| Types | `types/database.ts` |
| Server | `app/admin/(protected)/products/actions.ts`, `lib/products/admin.ts`, `lib/admin/permissions.ts` |
| UI | `components/admin/products/flyout-panel.tsx`, `edit-product-form.tsx`, `products-management-provider.tsx`, `product-card.tsx`, `product-table-view.tsx` |
| Público | `lib/catalog/public.ts`, `lib/cart/local.ts`, `components/public/catalog/catalog-client.tsx`, `components/public/checkout/checkout-client.tsx` |
| Orders | `lib/orders/admin.ts`, migrations order_items snapshots |
| Storage | migrations `product-images` bucket + policies |

**Búsquedas ejecutadas:** `deleteProduct`, `Trash`, `deleted_at`, `archiveProduct` → **0 matches**. `createProductAction` / `updateProductAction` → presentes. `products_delete_own_business` → presente en migrations.

---

## DB/schema audit

| Pregunta | Respuesta |
|----------|-----------|
| Tabla | `public.products` |
| Columnas clave | `id`, `business_id`, `category_id`, `name`, `description`, `price`, `image_url`, `is_available` (default true), `sku`, `stock`, `created_at` |
| Soft delete | **No** — sin `deleted_at`, `archived_at`, `is_deleted` |
| Disponibilidad | `is_available boolean NOT NULL DEFAULT true` — ya usado para ocultar del catálogo público |
| FK hacia products | `order_items.product_id` → `products(id)` **ON DELETE SET NULL** |
| FK desde products | `category_id` → `categories` **ON DELETE RESTRICT** (no impide borrar producto; impide borrar categoría con productos) |
| Snapshots en pedidos | `order_items.product_name`, `order_items.unit_price`, `quantity` — **NOT NULL** en `product_name` |
| Hard delete rompe pedidos | **No rompe filas** — `product_id` pasa a NULL; nombre/precio históricos preservados |
| Reportes | Agregaciones por nombre/precio snapshot siguen válidas; joins live a `products` para imagen/descripción en admin pierden enlace |
| Storage huérfano | `image_url` en fila se pierde con DELETE; objetos en bucket `product-images` **no se borran automáticamente** |

**Índice:** `order_items_product_id_idx` — permite consultar historial por producto eficientemente.

---

## RLS/policies audit

| Policy | Existe | Notas |
|--------|--------|-------|
| `products_select_own_business` | ✓ | authenticated + super_admin |
| `products_insert_own_business` | ✓ | idem |
| `products_update_own_business` | ✓ | idem |
| **`products_delete_own_business`** | **✓** | `for delete to authenticated` — business_id match **o** super_admin |
| `products_select_available_public` | ✓ | anon; `is_available = true` + business activo |

**Gap de seguridad (P1 futuro):** la policy DELETE **no restringe por rol** (`owner`/`manager`). Cualquier perfil autenticado del mismo `business_id` (incl. **operator**, **viewer**) podría ejecutar DELETE directo vía Supabase client si conociera el UUID — mientras la app usa `requireAdminPermission("manageProducts")` (solo owner/manager) en server actions actuales.

**Multi-tenant:** policies filtran por `profiles.business_id = products.business_id` — **safe** para tenant isolation.

**Storage `product-images`:** policies **insert/update/public read** — **no hay policy DELETE** en migrations revisadas. Cleanup de archivos requeriría service role, nueva policy, o job aparte.

---

## FK / historical data audit

```sql
-- order_items (t3)
product_id uuid references public.products(id) on delete set null
product_name text not null
unit_price numeric not null
quantity integer not null
```

**Create order RPCs** (`create_order`, guardrails on_demand/scheduled): validan producto existe, `business_id` match, `is_available = true`; insertan snapshot `product_name` + `unit_price` desde fila live.

**Implicaciones delete:**

| Escenario | Efecto |
|-----------|--------|
| Producto con pedidos históricos | DELETE permitido a nivel FK; `order_items.product_id` → NULL; snapshots intactos |
| Detalle pedido admin | `lib/orders/admin.ts` join opcional a `products` para `image_url` — **pierde imagen live** si producto borrado |
| Checkout con carrito stale | Cart en `localStorage` guarda `productId`; RPC falla con *invalid/unavailable products* si producto ya no existe |
| Manual order product picker | `getManualOrderProductOptions` filtra `is_available = true` — producto borrado desaparece |

**Conclusión FK:** hard delete **no corrompe** historial de pedidos; **sí** degrada enrichment live (imagen/descripción) en UI admin de órdenes antiguas.

---

## Server actions audit

**Ubicación:** `app/admin/(protected)/products/actions.ts`

| Action | Existe | Permiso | revalidatePath |
|--------|--------|---------|----------------|
| `getAdminProductByIdAction` | ✓ | `manageProducts` | — |
| `createProductAction` | ✓ | `manageProducts` | `/admin/products` |
| `updateProductAction` | ✓ | `manageProducts` | `/admin/products` |
| `setProductAvailabilityAction` | ✓ | `manageProducts` | `/admin/products` |
| **`deleteProductAction`** | **✗** | — | — |

**Patrones existentes:**
- `requireAdminPermission("manageProducts")` → owner/manager only (`lib/admin/permissions.ts`)
- Validación `business_id` en queries
- Errores vía `getActionErrorMessage` + `logActionFailure`
- **No** revalida rutas públicas `/b/[slug]/catalogo` (solo admin products path)

**Image upload:** client-side en `edit-product-form.tsx` / `create-product-form.tsx` — Supabase storage upload directo; no server action dedicada.

---

## Frontend/modal audit

| Elemento | Ubicación | Estado |
|----------|-----------|--------|
| Modal edición | `FlyoutPanel` (`role="dialog"`) + `EditProductForm` | ✓ |
| Apertura | `ProductsManagementProvider` — `flyoutMode: "edit"` | ✓ |
| Cierre | botón `Cerrar`, backdrop click, `onSuccess` post-save | ✓ |
| CTA principal | `Guardar cambios` — sticky footer `styles.actionsSticky` | ✓ |
| Delete UI | **Ausente** | — |
| Trash/Trash2 | **0 referencias** en products admin | — |
| Confirmación | `<dialog>` nativo usado solo para **nueva categoría** en edit form | patrón reutilizable |
| Tooltip system | **No** encontrado en products module | — |
| Toast | `admin-feedback` inline success/error en form | ✓ |
| Pending | `isPending` deshabilita submit | ✓ |
| Destructive styling | `admin-primary-button` / `admin-secondary-link`; sin token destructive dedicado en products | deuda visual |

**Permiso UI:** página protegida con `requireAdminPermission("manageProducts")` — operator/viewer no acceden a `/admin/products`; delete button no necesita hide extra salvo defensa en profundidad.

---

## Public catalog impact

- **Query:** `lib/catalog/public.ts` — `products` where `is_available = true`
- **Hard delete:** producto desaparece del catálogo inmediatamente (post revalidate/noStore)
- **Soft equivalente existente:** `is_available = false` ya oculta sin borrar fila
- **Rutas públicas:** `/b/[slug]/catalogo`, checkout — usan lista server-side; no slug por producto individual
- **Carrito:** `localStorage` `orderops-cart:{businessId}` — puede contener `productId` borrado → checkout falla en RPC (comportamiento aceptable)
- **Cache/ISR:** `getPublicCatalogByBusinessId` usa `noStore()` — dinámico; **revalidatePath público ausente** en actions de productos actuales (patrón existe en `dashboard/actions.ts` y `settings/public/actions.ts`)

**Recomendación revalidation mínima (PD3):**
```txt
revalidatePath("/admin/products")
revalidatePath(`/b/${slug}/catalogo`)
revalidatePath(`/b/${slug}`, "layout")  // opcional, si layout embeds catalog hints
```

---

## Storage/images impact

| Pregunta | Respuesta |
|----------|-----------|
| Bucket | `product-images` (public read) |
| Path convention | `{business_id}/{product_id}/{uuid}.{ext}` |
| URL en DB | `products.image_url` — public URL de Supabase |
| Delete storage al borrar producto | **No automatizado**; sin policy DELETE en bucket |
| Path único por producto | Carpeta por `product_id`; múltiples archivos posibles (upload genera nuevo UUID) |
| Imagen compartida | **No** — path incluye product_id |
| Soft delete | Conservar imagen y fila |
| Hard delete v1 | **Recomendado:** borrar fila DB; **defer** cleanup storage a PD5 o background job con service role |

---

## Cache/revalidation impact

- Admin list: `router.refresh()` en edit success + `revalidatePath("/admin/products")` en actions
- **Sin** realtime subscription en `products`
- Delete futuro debe: `revalidatePath` admin + catálogo público + cerrar flyout + refresh lista

---

## UX recommendation

**Placement recomendado: Opción A — Footer del modal (danger left, save right)**

```txt
[Eliminar producto]                    [Guardar cambios]
```

Alternativa aceptable: **Opción B — Danger zone** al final del formulario si copy legal/compliance requiere más contexto.

**No recomendar Opción C (Trash solo en header)** como acción primaria — compite con `Cerrar`; si se usa icono, debe ir con label visible + confirmación fuerte.

**Iconografía:** `Trash2` (Lucide) + label **"Eliminar producto"** — coherente con drawer/logout admin post-MH4.

---

## Confirmation modal recommendation

### Si delete permitido (sin historial) — hard delete

**Título:** Eliminar producto  
**Body:** ¿Seguro que querés eliminar "{productName}"? Esta acción es irreversible y el producto dejará de estar disponible en el catálogo.  
**Botones:** Cancelar | Eliminar producto (destructive)

### Si bloqueado por historial (Opción C recomendada)

**Título:** No se puede eliminar este producto  
**Body:** Este producto tiene pedidos asociados. Para preservar el historial, podés desactivarlo en lugar de eliminarlo.  
**Botones:** Entendido  
*(Opcional link/botón secundario: "Desactivar producto" → toggle `is_available`)*

### Si futuro soft delete (Opción B — no recomendado en PD2 MVP)

**Body:** ¿Seguro que querés eliminar "{productName}"? El producto dejará de aparecer en el catálogo y en la administración activa, pero se conservará su historial operativo.

---

## Security recommendation

| Regla | Recomendación |
|-------|---------------|
| Roles delete | **Solo owner/manager** — alinear RLS DELETE con `manageProducts` |
| Operator/viewer | **No delete** — endurecer policy + server action |
| Multi-tenant | Mantener filtro `business_id`; validar producto pertenece al negocio antes de DELETE |
| Frontend | Ocultar botón si no `manageProducts` (defensa); **nunca** confiar solo en UI |
| Server | `requireAdminPermission("manageProducts")` + count `order_items` guard |
| RLS | Migración PD2 para `products_delete` con subquery role IN ('owner','manager','admin',...) o helper SQL |

---

## Technical options

| Opción | Viabilidad PD1 | Pros | Contras |
|--------|----------------|------|---------|
| **A — Hard delete** | DB ready; FK SET NULL + snapshots | Simple; sin migración schema; limpia catálogo admin | Pierde join live en orders; storage huérfano; irreversible |
| **B — Soft delete** | Requiere migración `deleted_at` + filtros en todas las queries | Trazabilidad; reversibilidad; joins preservados | Scope amplio (admin list, public RLS, RPCs, types) |
| **C — Delete if unused** | **Sin migración** — guard en server action | Balance negocio/técnico; `is_available` para ocultar con historial | Dos caminos UX (delete vs deactivate) |
| **D — No delete yet** | Estado actual | Cero riesgo | No resuelve necesidad de borrar borradores/typos |

---

## Recommended path

**Opción C — Delete bloqueado si tiene historial; hard delete solo si nunca usado en pedidos**

**Justificación:**

1. FK + snapshots hacen hard delete **técnicamente seguro**, pero el negocio pierde enrichment admin (imagen producto en detalle pedido).
2. `is_available` ya cubre “sacar del catálogo” sin borrar — delete debe reservarse para productos de prueba/erróneos **sin** `order_items`.
3. **No requiere** migración schema en MVP (query `count(*)` en `order_items where product_id = ?`).
4. Endurecer RLS DELETE en la misma línea que `manageProducts` es **obligatorio** antes de exponer UI.
5. Soft delete (Opción B) queda como evolución si el negocio exige “eliminar” productos con historial sin perder fila — evaluar en PD2 alt.

---

## Required implementation phases

| Fase | Entrega |
|------|---------|
| **PD2 — RLS hardening + delete guard contract** | Migración policy DELETE limitada a owner/manager (+ super_admin); función SQL opcional `product_has_order_history(product_id)`; documentar decisión storage defer |
| **PD3 — Server action + validation** | `deleteProductAction(productId)` — permisos, ownership, block si `order_items` count > 0, supabase `.delete()`, revalidate admin + `/b/{slug}/catalogo` |
| **PD4 — Admin UI delete + confirmation** | Footer danger en `EditProductForm` o flyout; Lucide `Trash2` + label; `<dialog>` confirm; estados idle/confirm/deleting/success/error/blocked |
| **PD5 — QA / edge cases / catalog validation** | Carrito stale, order detail sin imagen post-delete, operator RLS negativo, light/dark destructive button, storage orphan audit, staging QA |

**PD2 alt (solo si negocio lo pide):** migración `deleted_at` + soft delete (Opción B) — scope mayor, posponer.

---

## Risks

| ID | Riesgo | Severidad |
|----|--------|-----------|
| R1 | RLS DELETE permite operator/viewer hoy | **P1** — corregir antes de UI |
| R2 | Storage orphans tras hard delete | P2 — aceptable v1 con defer |
| R3 | Carrito público con productId eliminado | P2 — checkout falla gracefully |
| R4 | Order admin UI pierde imagen si producto borrado con historial | P2 — motivo de Opción C block |
| R5 | Falta revalidate catálogo público en actions actuales | P2 — incluir en PD3 |
| R6 | Sin policy storage DELETE | P3 — cleanup manual/service role |

---

## Open questions

1. ¿El negocio acepta **nunca** borrar productos con pedidos, solo desactivar? (recomendado: sí)
2. ¿Se requiere cleanup automático de imágenes en bucket en v1 o v2?
3. ¿Super-admin debe poder hard delete productos con historial desde panel negocio?
4. ¿Delete debe registrar audit log / `order_events`? (no existe patrón product audit hoy)
5. ¿Soft delete unificado a futuro para alinear con categorías u otros módulos?

---

## What NOT to implement yet

- Migraciones `deleted_at` (salvo decisión explícita Opción B)
- `deleteProductAction` o UI Trash
- Cambios en modal visual más allá de futuro botón delete
- Storage DELETE policies / bucket cleanup jobs
- Cambios en checkout RPC o order_items schema
- Borrar productos reales en staging/prod durante audit

---

## Acceptance criteria for future implementation

Aceptar implementación delete (PD3–PD5) si:

- [ ] RLS DELETE restringida a owner/manager (+ super_admin)
- [ ] Server action valida `business_id`, permiso, y **bloquea** si `order_items` referencian el producto
- [ ] UI con confirmación explícita y estados loading/error/blocked
- [ ] `revalidatePath("/admin/products")` + catálogo público
- [ ] Operator/viewer no pueden delete (RLS + action + UI)
- [ ] QA: producto sin pedidos → delete OK; con pedidos → mensaje block + suggest deactivate
- [ ] Documentación PD5 con evidencia staging

---

**Date:** 2026-06-06 (PD1)  
**Type:** audit-only — sin cambios de código
