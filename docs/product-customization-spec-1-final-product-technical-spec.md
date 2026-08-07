# PRODUCT-CUSTOMIZATION-SPEC-1 — Final Product & Technical Spec

## Objetivo

Congelar la especificación **ejecutable** de **Product Customization V1** para OrderOps: grupos reutilizables, opciones/extras, herencia category → product con overrides, plus sugerido como producto real, carrito con signature, checkout con validación server-side, snapshot histórico en pedidos y display operativo en dashboard.

**Esta fase es documentación únicamente.** No implementa UI, DB, RLS, RPC ni código productivo.

**Fecha spec:** 2026-07-11  
**Estado:** APROBADA para fases DB-1 → QA-1

---

## Fuentes

| Documento | Estado | Uso |
|-----------|--------|-----|
| `docs/product-customization-audit-1-options-extras-upsell-architecture.md` | ✅ Existe | Auditoría read-only; baseline arquitectónico |
| `docs/CURRENT_PHASE.md` | ✅ Existe | Contexto de fase del proyecto |
| `docs/orders-flow-qa-1-production-smoke.md` | ✅ Existe | Flujo pedidos producción validado |
| `docs/admin-settings-v1-final-handoff.md` | ✅ Existe | Patrón UX admin / settings shell |

**Confirmaciones de repo (read-only, 2026-07-11):**

| Artefacto | Estado actual |
|-----------|---------------|
| RPC `create_order` | Único punto de inserción `orders` + `order_items`; `p_items` = `[{ product_id, quantity }]` |
| `order_items` | `product_name`, `unit_price`, `quantity`; sin `customization_snapshot`, `parent_order_item_id`, `item_kind` |
| `LocalCartItem` (`lib/cart/local.ts`) | Dedup por `productId`; snapshot de `price` base |
| `products.price` | `numeric(12,2)`; CHECK ≥ 0 |
| Realtime dashboard | Canal `orders`; hidratación vía `/admin/orders/[id]/summary` |
| Admin nav Productos | `matchPrefixes`: `/admin/products`, `/admin/categories` |
| `business_settings` | Flags modulares (`on_demand_mode_active`, etc.); sin flag customization aún |

---

## Contexto

OrderOps no tiene modelo de customization hoy. El carrito público agrega productos planos; el RPC recalcula precio base desde `products.price`; el dashboard parsea `products.description` como pseudo-modifiers (legacy). Product Customization V1 introduce configuración reutilizable multi-tenant, personalización en checkout público, persistencia histórica en pedido y display operativo — **sin romper pedidos legacy ni el flujo de pedido manual plano en V1**.

---

## Decisiones de producto ya tomadas

Resumen congelado (no reabrir salvo bloqueo técnico demostrado):

| # | Decisión |
|---|----------|
| Modelo mental | Grupo reutilizable + override por producto |
| Asignación | Grupos a categoría, producto, o ambos |
| Herencia | Producto hereda grupos de su categoría; puede override |
| Overrides V1 | Desactivar grupo heredado; desactivar opción heredada; agregar grupos propios al producto |
| Fuera V1 overrides | Price override por producto; name override por producto; condicionales |
| Tipos grupo | single/multi × required/optional vía `selection_type` + `is_required` + min/max |
| Precio opciones | `price_delta >= 0` únicamente |
| Catálogo | "Desde $X" si hay opciones con `price_delta > 0` |
| Extras cantidad | No — seleccionada / no seleccionada |
| Campos texto | Fuera de V1 |
| Plus | Producto real del catálogo; max 1 grupo plus por target |
| Plus UI | Dentro del modal de personalización, al final, antes de confirmar |
| Carrito display | Línea jerárquica con opciones, extras y plus |
| Dashboard display | Compacto desde snapshot; plus como hijo o línea indentada |
| Orden | `sort_order` obligatorio en DB desde DB-1; DnD visual en fase dedicada |
| Disponibilidad | `is_available` en grupo/opción/plus item; sin stock por extra |
| Multi-tenant | `business_id` obligatorio en tablas propias |
| Admin UX | Sección `/admin/products/customizations` + panel ligero en modal producto |

---

## Decisiones finales D1–D8

### D1 — Pedido manual en V1

**Decisión:** **No.** Customization en pedido manual queda para **V1.1**.

**Comportamiento V1 (pedido manual admin):**

- Sigue agregando productos base vía `createManualOrderAction` → RPC `create_order` con payload legacy.
- **No bloquea** productos que tienen customization configurada (agrega línea plana sin opciones).
- **No permite** elegir extras/opciones/plus en el modal manual.
- Limitación operacional documentada en UI admin (tooltip/nota en manual order modal).
- No rompe dashboard ni `order_items`: líneas manuales tienen `customization_snapshot = null`, `item_kind = 'product'`.
- Operadores pueden tomar pedidos por teléfono con producto base; cliente final usa catálogo público para personalizar.

**V1.1:** Reutilizar `CustomizationModal` admin-side con permiso `updateOrders`.

---

### D2 — Plus como producto real

**Decisión:** **Sí.** Plus se persiste como **fila hija** en `order_items`.

| Campo | Valor |
|-------|-------|
| `item_kind` | `'product'` (línea principal) \| `'upsell'` (plus hijo) |
| `parent_order_item_id` | `uuid` nullable; FK self → `order_items.id` |
| Plus en snapshot padre | **No** — plus vive en fila hija; snapshot del padre solo cubre grupos/opciones |

**Reglas:**

- Hijo upsell referencia `products.id` real; `unit_price` = precio del producto al momento del pedido.
- Máximo 1 plus por línea padre en V1 (1 producto sugerido seleccionado).
- Dashboard agrupa hijos bajo padre por `parent_order_item_id`.

**ON DELETE `parent_order_item_id`:** **`ON DELETE CASCADE`**

- Si se elimina la línea padre (dentro del mismo pedido, operación futura), el plus hijo se elimina.
- Coherente con integridad referencial; pedidos completos ya CASCADE vía `order_id`.

---

### D3 — Snapshot

**Decisión:** **`customization_snapshot jsonb` versionado en `order_items`** (columna nullable).

| Criterio | Elección |
|----------|----------|
| Tabla separada analytics | Post-MVP (V2+) |
| Nullable | Sí — pedidos legacy y manual V1 |
| Autoridad | Generado **solo server-side** en ORDER-1 |
| Plus | **No** dentro del snapshot; fila hija separada |

---

### D4 — Cart signature

**Decisión:** Deduplicar por **`configuration_signature`**, no por `productId` solo.

**Algoritmo canonical (implementación futura en CART-1):**

```txt
configuration_signature =
  SHA256(
    productId
    + "|"
    + sorted(selectedOptionIds).join(",")
    + "|"
    + sorted(selectedUpsellProductIds).join(",")
  )
```

**Reglas:**

| Escenario | Resultado |
|-----------|-----------|
| Mismo producto + mismas opciones + mismo plus | **Fusionar** — incrementar `quantity` |
| Mismo producto + opciones distintas | **Líneas separadas** (`cartLineId` distinto) |
| Mismo producto + plus distinto | **Líneas separadas** |
| Editar línea | Reabrir modal con prefill; al confirmar, **reemplazar** línea por `cartLineId` (nueva signature si cambió selección) |
| Eliminar padre con plus hijo | Eliminar **ambas** líneas del carrito local (padre + hijo vinculado por `parentCartLineId`) |
| Eliminar solo plus | Eliminar línea hijo; padre permanece |

Cada línea tiene `cartLineId` (uuid client-side) estable hasta edición/eliminación.

---

### D5 — Lazy load

**Decisión:** **Lazy load** al abrir modal de personalización.

**Catálogo listado (SSR/query ligera):** incluir metadata por producto cuando sea viable:

```typescript
{
  has_customizations: boolean
  has_paid_customizations: boolean  // alguna opción price_delta > 0 en grupos aplicables
  has_upsell: boolean
  price_from: number | null         // base + min positive deltas; null si no aplica "Desde"
}
```

**Endpoint futuro sugerido:** `GET /b/[slug]/catalogo/customization/[productId]` o server action `getProductCustomizationConfigAction`.

**No eager-load** todas las opciones de todos los productos en SSR del catálogo.

---

### D6 — Server-side pricing

**Decisión:** Cliente envía **IDs únicamente**; servidor recalcula **100%** desde DB.

**Cliente NO envía (confiables):** `price_delta`, `unit_price`, `final_unit_price`, `order_total`.

**Cliente SÍ envía:** `product_id`, `quantity`, `group_id` + `option_ids[]`, `item_kind`, `parent_client_line_id` (plus).

---

### D7 — RPC / order creation strategy

**Decisión:** **Evolucionar `create_order` existente** de forma **backward-compatible**. No crear RPC paralelo permanente.

| Aspecto | Spec |
|---------|------|
| Nombre función | Mantener `public.create_order` |
| Compatibilidad legacy | `p_items` con `[{ "product_id": "uuid", "quantity": 1 }]` sigue funcionando idéntico |
| Payload V1 | Mismo array `p_items`; items enriquecidos con campos opcionales (ver sección RPC) |
| Validación | **Doble capa:** (1) TS en `checkout/actions.ts` para errores UX; (2) RPC SECURITY DEFINER como autoridad final |
| Recálculo total | **Dentro del RPC** — suma `unit_price × quantity` de todas las filas insertadas |
| Snapshot | RPC inserta `customization_snapshot` en filas padre; null en hijos upsell |
| Rollback | Feature flag off → checkout envía payload legacy; RPC ignora campos nuevos |
| Migración | Una migración SQL documentada como "create_order customization v5 logic" |

**Alternativa descartada:** `create_order_v2` separado — duplica mantenimiento con solo 2 call sites (`checkout/actions.ts`, `orders/actions.ts`).

**Flujo ORDER-1:**

```txt
CheckoutClient
  → createPublicCheckoutOrderAction (valida + resuelve grupos TS)
  → service client RPC create_order (recalcula + inserta snapshots + hijos)
```

---

### D8 — Feature flag / rollout

**Decisión:** **Sí.** Rollout controlado por tenant.

| Aspecto | Spec |
|---------|------|
| Flag conceptual | `product_customization_enabled` |
| Ubicación DB | Columna boolean en `business_settings` (migración DB-1 o FLAG-1) |
| Default | `false` para negocios existentes en producción |
| Demo/test | `true` para tenant demo (`demohamburgueseria`) en staging tras QA |
| No mezclar con roles | Flag es capability de negocio, no permiso de usuario |
| Comportamiento flag off | Catálogo: add-to-cart plano (ignora grupos); admin: sección customization oculta o read-only según fase |
| Comportamiento flag on | Flujo V1 completo |

Documentar en `ORDEROPS_LIVING_MEMORY.md` al implementar FLAG-1.

---

## Scope final V1

- Grupos reutilizables (`customization_groups`)
- Opciones por grupo (`customization_options`)
- Tipos: single/multi × required/optional
- `min_selections` / `max_selections`
- `price_delta >= 0`
- `is_available` en grupo, opción, plus item
- `sort_order` en grupo, opción, asignación
- Asignación a categoría y producto
- Herencia category → product
- Override: desactivar grupo heredado en producto
- Override: desactivar opción heredada en producto
- Agregar grupos directos a producto
- Plus sugerido como producto real del catálogo
- Máximo 1 grupo de plus activo por target (categoría o producto)
- Carrito con `configuration_signature`
- Checkout público con customizations
- Validación server-side completa
- `customization_snapshot` jsonb versionado
- `parent_order_item_id` + `item_kind` para plus
- Dashboard compact display desde snapshot
- Feature flag por tenant
- Lazy load customization en modal público
- Metadata `has_customizations` / `price_from` en listado catálogo
- Permisos admin: `manageProducts` para CRUD customization

---

## Fuera de scope V1

- Stock por opción/extra
- Reglas condicionales ("si X entonces Y")
- "Gratis hasta N y luego cobrar"
- Precios negativos / descuentos
- Cantidad por extra (qty del extra independiente)
- Campos de texto personalizados
- Plantillas por rubro
- Combos
- Analytics de extras
- Impresión comandera
- Edición avanzada de customization en pedido manual (V1.1)
- Price override por producto
- Option name override por producto
- Inventario por plus
- Pagos/cobros externos
- Integración WhatsApp nueva
- Drag-and-drop visual (fase ADMIN-DND-1 separada)
- Tabla separada `order_item_customizations` para reporting
- Realtime en canal `order_items`
- Múltiples grupos plus por target
- Múltiples plus seleccionados por línea (max 1 plus V1)

---

## Modelo conceptual

```txt
Business
  └── CustomizationGroup (reutilizable)
        └── CustomizationOption (price_delta >= 0)
  └── CustomizationGroupAssignment → Category | Product
  └── ProductCustomizationOverride → disable inherited group | option
  └── UpsellGroup (max 1 por target)
        └── UpsellGroupItem → Product (real)

Product (en categoría)
  └── Hereda grupos de Category
  └── + Grupos directos Product
  └── − Overrides (grupo/opción desactivados)
  └── + UpsellGroup (heredado o directo, max 1 efectivo)

Checkout line (padre)
  └── customization_snapshot (opciones elegidas, pricing histórico)
  └── order_items hijo (upsell product real)
```

**Resolución de grupos aplicables (orden):**

1. Grupos asignados a `product.category_id` (herencia)
2. Grupos asignados directamente al `product.id`
3. Filtrar `is_available = false` en grupo/opción
4. Aplicar overrides de producto (grupo/opción desactivados)
5. Ordenar por `assignment.sort_order`, luego `group.sort_order`
6. Resolver upsell: assignment directo producto > herencia categoría (producto gana)

---

## Modelo DB final propuesto

### Elección de nomenclatura: **Opción A — nombres compactos**

| Opción | Veredicto |
|--------|-----------|
| A — `customization_groups`, `customization_options`, … | **✅ Recomendada** |
| B — `product_customization_groups`, … | Descartada — redundante; módulo ya vive bajo dominio productos |

**Justificación:** Alineada a auditoría, menos verbosa, sin colisión con tablas existentes (`products`, `categories`, `order_items`). Prefijo `customization_` / `upsell_` es suficientemente explícito en migraciones y RLS.

---

### Tablas nuevas

#### 1. `customization_groups`

| Propósito | Grupo reutilizable de opciones (ej. "Tamaño de papas", "Aderezos") |
|-----------|---------------------------------------------------------------------|

| Columna | Tipo | Constraints |
|---------|------|-------------|
| `id` | uuid PK | `gen_random_uuid()` |
| `business_id` | uuid NOT NULL | FK → `businesses(id)` ON DELETE CASCADE |
| `name` | text NOT NULL | CHECK `length(trim(name)) > 0` |
| `description` | text NULL | |
| `selection_type` | text NOT NULL | CHECK IN (`'single'`, `'multiple'`) |
| `is_required` | boolean NOT NULL DEFAULT false | |
| `min_selections` | integer NOT NULL DEFAULT 0 | CHECK `>= 0` |
| `max_selections` | integer NULL | CHECK `IS NULL OR >= min_selections` |
| `is_available` | boolean NOT NULL DEFAULT true | |
| `sort_order` | integer NOT NULL DEFAULT 0 | |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz NOT NULL DEFAULT now() | |

**Constraints lógicos (CHECK o trigger):**

```txt
selection_type = 'single'  → max_selections IS NULL OR max_selections <= 1
is_required = true       → min_selections >= 1
selection_type = 'single' AND is_required → min_selections = 1, max_selections = 1
```

**Índices:** `(business_id)`, `(business_id, is_available, sort_order)`

**RLS:** patrón tenant estándar; admin CRUD; anon SELECT where `is_available AND business active`

**Participación:** admin ✓ | catálogo público ✓ (read) | pedido ✓ (validación)

---

#### 2. `customization_options`

| Propósito | Opción dentro de un grupo |

| Columna | Tipo | Constraints |
|---------|------|-------------|
| `id` | uuid PK | |
| `business_id` | uuid NOT NULL | FK → `businesses(id)` ON DELETE CASCADE |
| `group_id` | uuid NOT NULL | FK → `customization_groups(id)` ON DELETE CASCADE |
| `name` | text NOT NULL | CHECK `length(trim(name)) > 0` |
| `description` | text NULL | |
| `price_delta` | numeric(12,2) NOT NULL DEFAULT 0 | CHECK `>= 0` |
| `is_available` | boolean NOT NULL DEFAULT true | |
| `sort_order` | integer NOT NULL DEFAULT 0 | |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz NOT NULL DEFAULT now() | |

**FK compuesta (recomendada):** `(group_id, business_id)` consistente con `(customization_groups.id, customization_groups.business_id)` — previene cross-tenant leaks.

**Índices:** `(group_id, sort_order)`, `(business_id, is_available)`

**RLS:** igual patrón tenant; anon SELECT available

---

#### 3. `customization_group_assignments`

| Propósito | Asignar grupo a categoría o producto |

| Columna | Tipo | Constraints |
|---------|------|-------------|
| `id` | uuid PK | |
| `business_id` | uuid NOT NULL | FK → `businesses(id)` ON DELETE CASCADE |
| `group_id` | uuid NOT NULL | FK → `customization_groups(id)` ON DELETE CASCADE |
| `target_type` | text NOT NULL | CHECK IN (`'category'`, `'product'`) |
| `target_id` | uuid NOT NULL | Polimórfico — ver nota |
| `sort_order` | integer NOT NULL DEFAULT 0 | |
| `is_enabled` | boolean NOT NULL DEFAULT true | |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |

**UNIQUE:** `(business_id, group_id, target_type, target_id)`

**Índices:** `(business_id, target_type, target_id)`, `(group_id)`

**Riesgo FK polimórfica:** `target_id` no tiene FK declarativa única. Mitigación V1:

- Validación en server actions al insertar (verificar target existe y pertenece a `business_id`)
- Trigger opcional DB-1: validar existencia según `target_type`
- Alternativa futura: split en dos tablas si integridad estricta lo exige

**Participación:** admin ✓ | catálogo ✓ | pedido ✓

---

#### 4. `product_customization_overrides`

| Propósito | Desactivar grupo u opción heredada para un producto específico |

**Elección:** **tabla única** con `override_type` (coherente con auditoría; V1 solo tiene disable).

| Columna | Tipo | Constraints |
|---------|------|-------------|
| `id` | uuid PK | |
| `business_id` | uuid NOT NULL | FK → `businesses(id)` ON DELETE CASCADE |
| `product_id` | uuid NOT NULL | FK → `products(id)` ON DELETE CASCADE |
| `override_type` | text NOT NULL | CHECK IN (`'group'`, `'option'`) |
| `group_id` | uuid NULL | FK → `customization_groups(id)` ON DELETE CASCADE |
| `option_id` | uuid NULL | FK → `customization_options(id)` ON DELETE CASCADE |
| `is_enabled` | boolean NOT NULL DEFAULT false | `false` = desactivado para este producto |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |

**CHECK:**

```sql
(override_type = 'group' AND group_id IS NOT NULL AND option_id IS NULL)
OR
(override_type = 'option' AND option_id IS NOT NULL AND group_id IS NULL)
```

**UNIQUE parcial:**

- `(business_id, product_id, group_id)` WHERE `override_type = 'group'`
- `(business_id, product_id, option_id)` WHERE `override_type = 'option'`

**Nota:** V1 solo usa `is_enabled = false` (disable). No hay overrides de precio/nombre.

---

#### 5. `upsell_groups`

| Propósito | Grupo de plus sugeridos (ej. "¿Sumás algo?") |

| Columna | Tipo | Constraints |
|---------|------|-------------|
| `id` | uuid PK | |
| `business_id` | uuid NOT NULL | FK → `businesses(id)` ON DELETE CASCADE |
| `name` | text NOT NULL | |
| `target_type` | text NOT NULL | CHECK IN (`'category'`, `'product'`) |
| `target_id` | uuid NOT NULL | Polimórfico |
| `is_available` | boolean NOT NULL DEFAULT true | |
| `sort_order` | integer NOT NULL DEFAULT 0 | |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz NOT NULL DEFAULT now() | |

**UNIQUE:** `(business_id, target_type, target_id)` — **max 1 grupo plus por target (regla V1)**

---

#### 6. `upsell_group_items`

| Propósito | Productos sugeridos dentro del grupo plus |

| Columna | Tipo | Constraints |
|---------|------|-------------|
| `id` | uuid PK | |
| `business_id` | uuid NOT NULL | FK → `businesses(id)` ON DELETE CASCADE |
| `upsell_group_id` | uuid NOT NULL | FK → `upsell_groups(id)` ON DELETE CASCADE |
| `product_id` | uuid NOT NULL | FK → `products(id)` ON DELETE RESTRICT |
| `sort_order` | integer NOT NULL DEFAULT 0 | |
| `is_available` | boolean NOT NULL DEFAULT true | |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |

**UNIQUE:** `(upsell_group_id, product_id)`

**Precio:** **no duplicar** — siempre leer `products.price` al crear pedido.

**ON DELETE product:** RESTRICT si hay upsell items activos; o CASCADE soft via `is_available` — preferir RESTRICT + admin desactiva primero.

---

### Cambios en `order_items`

| Columna nueva | Tipo | Default | Notas |
|---------------|------|---------|-------|
| `customization_snapshot` | jsonb NULL | NULL | Solo líneas padre con opciones |
| `parent_order_item_id` | uuid NULL | NULL | FK → `order_items(id)` ON DELETE **CASCADE** |
| `item_kind` | text NOT NULL | `'product'` | CHECK IN (`'product'`, `'upsell'`) |

**Reglas insert:**

| Tipo línea | product_id | customization_snapshot | parent_order_item_id | item_kind |
|------------|------------|------------------------|----------------------|-----------|
| Producto base personalizado | ✓ | ✓ (si hay selecciones) o null | null | `product` |
| Producto base sin extras | ✓ | null | null | `product` |
| Plus hijo | ✓ | null | ✓ padre | `upsell` |
| Legacy / manual V1 | ✓ | null | null | `product` |

**`unit_price` semántica V1:**

- Línea padre: `products.price + Σ price_delta opciones seleccionadas`
- Línea upsell hijo: `products.price` del plus (sin deltas de customization en V1)

---

### Constraints (resumen global)

```txt
price_delta >= 0
min_selections >= 0
max_selections IS NULL OR max_selections >= min_selections
single → max_selections <= 1
is_required → min_selections >= 1
business_id consistente en toda cadena group → option → assignment
max 1 upsell_group por (business_id, target_type, target_id)
item_kind = 'upsell' → parent_order_item_id IS NOT NULL
item_kind = 'product' → parent_order_item_id IS NULL
customization_snapshot IS NOT NULL → item_kind = 'product'
```

---

### Indexes (adicionales recomendados)

```txt
order_items(order_id)
order_items(parent_order_item_id) WHERE parent_order_item_id IS NOT NULL
customization_group_assignments(business_id, target_type, target_id)
product_customization_overrides(business_id, product_id)
upsell_group_items(upsell_group_id, sort_order)
```

---

### RLS esperada

Patrón estándar OrderOps para tablas admin:

```sql
business_id = (
  SELECT p.business_id FROM profiles p WHERE p.id = auth.uid()
)
OR (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) = 'super_admin'
```

| Tabla | Admin | Anon público |
|-------|-------|--------------|
| `customization_groups` | CRUD | SELECT `is_available = true` + business `is_active` |
| `customization_options` | CRUD | SELECT available + group available |
| `customization_group_assignments` | CRUD | SELECT `is_enabled = true` |
| `product_customization_overrides` | CRUD | SELECT (resolver herencia en server) |
| `upsell_groups` | CRUD | SELECT available |
| `upsell_group_items` | CRUD | SELECT available + product available |
| `order_items` (nuevas cols) | Sin cambio — INSERT solo vía RPC SECURITY DEFINER |

**Público:** anon nunca INSERT/UPDATE customization tables. Resolución en server action / route handler con service role o query filtrada.

---

### Backward compatibility

- Pedidos existentes: columnas nuevas nullable/default; render legacy OK
- RPC legacy payload: sin cambios de comportamiento
- Carrito localStorage V1: bump key o version field → invalidar carritos viejos al deploy CART-1 (`orderops-cart-v2:{businessId}` recomendado)
- Productos sin grupos: flujo idéntico al actual

---

## JSON schema customization_snapshot v1

### Schema conceptual

```typescript
type CustomizationSnapshotV1 = {
  version: 1
  source: "public_checkout" | "manual_order"  // manual_order solo V1.1+
  groups: Array<{
    group_id: string
    group_name: string
    selection_type: "single" | "multiple"
    is_required: boolean
    min_selections: number
    max_selections: number | null
    sort_order: number
    options: Array<{
      option_id: string
      option_name: string
      price_delta: number
      sort_order: number
    }>
  }>
  pricing: {
    base_unit_price: number
    customization_total: number
    final_unit_price: number
  }
  summary: string[]  // líneas human-readable para dashboard compacto
}
```

### Ejemplo real

```json
{
  "version": 1,
  "source": "public_checkout",
  "groups": [
    {
      "group_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "group_name": "Tamaño de papas",
      "selection_type": "single",
      "is_required": true,
      "min_selections": 1,
      "max_selections": 1,
      "sort_order": 10,
      "options": [
        {
          "option_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          "option_name": "Papas grandes",
          "price_delta": 900,
          "sort_order": 10
        }
      ]
    },
    {
      "group_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "group_name": "Aderezos",
      "selection_type": "multiple",
      "is_required": false,
      "min_selections": 0,
      "max_selections": 3,
      "sort_order": 20,
      "options": [
        {
          "option_id": "d4e5f6a7-b8c9-0123-def0-234567890123",
          "option_name": "Ketchup",
          "price_delta": 0,
          "sort_order": 10
        },
        {
          "option_id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
          "option_name": "Barbacoa",
          "price_delta": 0,
          "sort_order": 20
        }
      ]
    }
  ],
  "pricing": {
    "base_unit_price": 8000,
    "customization_total": 900,
    "final_unit_price": 8900
  },
  "summary": [
    "Tamaño de papas: Papas grandes",
    "Aderezos: Ketchup, Barbacoa"
  ]
}
```

### Reglas snapshot

| Regla | Detalle |
|-------|---------|
| Histórico | Guarda nombres y `price_delta` al momento del pedido |
| Autonomía | Dashboard renderiza **sin joins** a customization tables |
| Null | `customization_snapshot IS NULL` → display legacy |
| Plus | **No** en snapshot; representado como `order_items` hijo `item_kind='upsell'` |
| Version | Campo `version: 1` obligatorio; futuras versiones migran presenter |
| Source | Trazabilidad origen del pedido |

---

## Cart item shape V2

### TypeScript (implementación futura — `lib/cart/local.ts`)

```typescript
export type LocalCartItemV2 = {
  cartLineId: string
  productId: string
  productName: string
  categoryId: string
  imageUrl: string | null
  baseUnitPrice: number
  quantity: number
  selectedGroups: Array<{
    groupId: string
    selectedOptionIds: string[]
  }>
  customizationTotal: number
  finalUnitPrice: number
  configurationSignature: string
  itemKind: "product" | "upsell"
  parentCartLineId?: string
  displaySummary: string[]
}
```

### Generación `configurationSignature`

```typescript
function buildConfigurationSignature(input: {
  productId: string
  selectedOptionIds: string[]
  upsellProductId?: string | null
}): string {
  const options = [...input.selectedOptionIds].sort().join(",")
  const upsell = input.upsellProductId ?? ""
  const raw = `${input.productId}|${options}|${upsell}`
  return sha256(raw) // implementación CART-1
}
```

### Reglas carrito

| Acción | Comportamiento |
|--------|----------------|
| Agregar configuración nueva | Buscar línea con misma signature → incrementar qty; si no existe → nueva línea |
| Editar | Modal prefill → al guardar, eliminar línea vieja por `cartLineId`, insertar nueva |
| Qty +/- en línea personalizada | Solo afecta esa línea (signature fija) |
| Eliminar padre | Eliminar padre + todos los hijos con `parentCartLineId === cartLineId` |
| Eliminar plus | Eliminar solo línea hijo |
| Storage key | `orderops-cart-v2:{businessId}` — invalida V1 al deploy |
| Display | Ver ejemplo producto 4.15 del brief |

**Ejemplo display:**

```txt
Hamburguesa clásica
- Papas grandes +$900
- Aderezos: ketchup, barbacoa
- Extra: bacon +$900
- Plus: Coca 500ml +$1.800
Total item: $11.600
```

---

## RPC / order creation input V1

### Input legacy actual (sin cambios)

```json
{
  "p_business_id": "uuid",
  "p_customer_name": "string",
  "p_phone": "string",
  "p_delivery_date": "YYYY-MM-DD",
  "p_delivery_method": "delivery|pickup",
  "p_address": "string|null",
  "p_notes": "string|null",
  "p_items": [
    { "product_id": "uuid", "quantity": 2 }
  ]
}
```

### Input V1 futuro (`p_items` enriquecido)

```json
{
  "p_items": [
    {
      "client_line_id": "line-1",
      "product_id": "uuid-hamburguesa",
      "quantity": 1,
      "customizations": [
        { "group_id": "uuid-grupo-papas", "option_ids": ["uuid-papas-grandes"] },
        { "group_id": "uuid-grupo-aderezos", "option_ids": ["uuid-ketchup", "uuid-barbacoa"] }
      ]
    },
    {
      "client_line_id": "line-2",
      "product_id": "uuid-coca",
      "quantity": 1,
      "item_kind": "upsell",
      "parent_client_line_id": "line-1"
    }
  ]
}
```

### Reglas mapeo

| Campo cliente | Uso server |
|---------------|------------|
| `client_line_id` | Mapa temporal client_line_id → `order_items.id` insertado |
| `parent_client_line_id` | Resuelve `parent_order_item_id` post-insert padre |
| `customizations` | Ignorado si item_kind = upsell |
| `item_kind` | Default `'product'` si ausente |
| Precios ausentes | RPC lee DB |

### Compatibilidad

- Items sin `customizations`, sin `client_line_id` → path legacy idéntico
- Feature flag off → action strip campos V1 antes de RPC
- Manual order V1 → siempre payload legacy

### Total recalculado

```txt
order.total_price = Σ (line.unit_price × line.quantity) para todas las filas
```

---

## Server-side validation

### Pipeline (orden estricto)

1. Resolver `business_id` desde contexto server (slug admin / checkout).
2. Verificar feature flag si aplica.
3. Cargar productos por IDs (incluye plus).
4. Validar pertenencia a `business_id`.
5. Validar `is_available` productos.
6. Por cada línea padre: resolver grupos aplicables (categoría + producto − overrides).
7. Validar grupos required presentes.
8. Validar `min_selections` / `max_selections`.
9. Validar `selection_type` (single → max 1 option_id por grupo).
10. Validar cada `option_id` pertenece al `group_id`.
11. Validar opciones `is_available`.
12. Leer `price_delta` desde DB; calcular `customization_total`.
13. Calcular `final_unit_price` = base + customization_total.
14. Validar upsell: producto existe, en `upsell_group_items` del target resuelto, available, parent existe.
15. Validar max 1 upsell hijo por padre.
16. Calcular `order_total`.
17. Construir `customization_snapshot` por línea padre con selecciones.
18. INSERT `orders`.
19. INSERT `order_items` padre(s).
20. INSERT `order_items` hijo(s) upsell con `parent_order_item_id`.

### Códigos de error (TS + RPC)

| Código | HTTP sugerido | Descripción |
|--------|---------------|-------------|
| `INVALID_PRODUCT` | 400 | product_id inexistente o wrong tenant |
| `PRODUCT_UNAVAILABLE` | 400 | producto no disponible |
| `CUSTOMIZATION_GROUP_REQUIRED` | 400 | grupo required sin selección |
| `CUSTOMIZATION_MIN_SELECTION` | 400 | opciones < min_selections |
| `CUSTOMIZATION_MAX_SELECTION` | 400 | opciones > max_selections |
| `CUSTOMIZATION_OPTION_INVALID` | 400 | option_id no pertenece al group_id |
| `CUSTOMIZATION_OPTION_UNAVAILABLE` | 400 | opción desactivada |
| `UPSELL_NOT_ALLOWED` | 400 | plus no permitido para este producto |
| `PRICE_RECALCULATION_FAILED` | 500 | error interno recálculo |

**Módulos futuros:** `lib/orders/customization/{resolve-applicable-groups,validate-selections,compute-line-price,build-snapshot,serialize-for-rpc}.ts`

---

## Pricing rules

```txt
base_unit_price     = products.price
customization_total = Σ customization_options.price_delta (seleccionadas)
final_unit_price    = base_unit_price + customization_total
line_total          = final_unit_price × quantity
upsell_line_total   = upsell_product.price × quantity
order_total         = Σ line_total (padres + hijos)
```

| Aspecto | Spec |
|---------|------|
| Moneda | ARS (actual — `Intl.NumberFormat("es-AR")`) |
| DB type | `numeric(12,2)` |
| TS type | `number` |
| Cliente | Display only; nunca autoridad |
| Float JS | OK en carrito UI; server usa numeric |
| Formato UI | `formatAdminOrderCurrency` / equivalente público |
| price_delta = 0 | Opción incluida ("Papas chicas incluido") |
| Negativos | Rechazados en DB CHECK y validación |

**"Desde $X" (catálogo):**

```txt
price_from = base_unit_price + MIN(price_delta) WHERE price_delta > 0 entre opciones aplicables
```

Si todas las opciones son `price_delta = 0`, no mostrar "Desde" — mostrar precio base.

---

## Herencia y overrides

### Algoritmo `resolveApplicableGroups(productId)`

```txt
INPUT: product P with category_id C, business_id B

1. assignments = 
     SELECT * FROM customization_group_assignments
     WHERE business_id = B AND is_enabled = true
       AND (
         (target_type = 'category' AND target_id = C)
         OR (target_type = 'product' AND target_id = P.id)
       )

2. groups = JOIN customization_groups WHERE is_available = true

3. overrides = SELECT * FROM product_customization_overrides
     WHERE product_id = P.id AND is_enabled = false

4. FOR EACH override_type = 'group':
     REMOVE group from applicable set

5. FOR EACH group G in applicable:
     options = available options of G
     FOR EACH override_type = 'option' targeting option in G:
       REMOVE option

6. SORT by assignment.sort_order, group.sort_order

OUTPUT: applicable groups with filtered options
```

### Overrides permitidos V1

| Operación | Mecanismo |
|-----------|-----------|
| Desactivar grupo heredado | `product_customization_overrides` override_type=group, is_enabled=false |
| Desactivar opción heredada | override_type=option, is_enabled=false |
| Agregar grupo propio | `customization_group_assignments` target_type=product |

### No permitido V1

- Cambiar `price_delta` por producto
- Renombrar opción por producto
- Condicionales entre grupos

---

## Upsell / plus rules

| Regla | Valor V1 |
|-------|----------|
| Plus es | Producto real (`products.id`) |
| Max grupos plus por target | 1 |
| Max plus seleccionados por línea padre | 1 |
| Precio plus | `products.price` al momento del pedido |
| UI posición | Final del modal, antes de "Agregar al carrito" |
| Persistencia | Fila hija `item_kind='upsell'` |
| Resolución target | Assignment directo producto > herencia categoría |
| Validación | Plus product_id ∈ upsell_group_items del grupo resuelto |
| Snapshot padre | No incluye plus |

---

## Public catalog UX

### Flujo decisión

```txt
IF NOT has_customizations AND NOT has_upsell:
  → Agregar directo (flujo actual)
ELSE:
  → Abrir CustomizationModal (lazy load)
```

### CustomizationModal

| Elemento | Comportamiento |
|----------|----------------|
| Header | Nombre, imagen, precio base |
| Grupos | Ordenados por sort_order; radio (single) / checkbox (multi) |
| Validación | Inline required/min/max; botón disabled hasta válido |
| Total en vivo | base + deltas seleccionados (+ plus si marcado) |
| Plus section | Al final; checkbox(es) productos reales con precio |
| CTA | "Agregar al carrito · $X" |
| Loading | Skeleton mientras lazy fetch |
| Error | Retry + mensaje; no agregar al carrito |

### Product card

- Precio base o **"Desde $X"** si `has_paid_customizations`
- Badge opcional "Personalizable" si `has_customizations || has_upsell`

### Edición desde carrito

- Tap "Editar" → reabre modal con state prefill
- Confirmar → reemplaza línea por signature

---

## Cart / checkout UX

| Pantalla | Comportamiento |
|----------|----------------|
| Cart bar / drawer | Líneas con `displaySummary`; expandible |
| Checkout summary | Misma jerarquía; total = Σ finalUnitPrice × qty |
| Submit | Envía IDs only; loading state |
| Error servidor | Mostrar código traducido; no vaciar carrito |
| Legacy cart | Invalidar al detectar schema v1 en storage |

---

## Admin UX

### Ruta

**`/admin/products/customizations`**

Extender `admin-nav-config.ts`:

```txt
matchPrefixes: ["/admin/products", "/admin/categories", "/admin/products/customizations"]
```

Label nav sugerido: **Opcionales y extras** (sub-item o tab dentro de Productos).

### Sección dedicada — capacidades

| Feature | Fase |
|---------|------|
| Listado grupos | ADMIN-1 |
| CRUD grupo (nombre, tipo, min/max, required) | ADMIN-1 |
| CRUD opciones (nombre, price_delta, available) | ADMIN-1 |
| Orden manual sort_order (inputs numéricos / ↑↓) | ADMIN-1 |
| Asignación categoría/producto | ADMIN-2 |
| Configuración upsell | ADMIN-2 |
| Empty states, validaciones, toast save | ADMIN-1/2 |
| Permisos | `manageProducts` |

### Fases admin

| Fase | Scope |
|------|-------|
| **ADMIN-1** | CRUD grupos + opciones + sort_order manual |
| **ADMIN-2** | Assignments, overrides panel producto, upsell |
| **ADMIN-DND-1** | Drag-and-drop visual grupos/opciones (post ADMIN-1) |

**DnD recomendación:** `sort_order` en DB-1 es **obligatorio**; UI drag-and-drop visual entra en **ADMIN-DND-1** (subfase dedicada), **no** bloquea ADMIN-1/2. Fallback temporal en ADMIN-1: controles subir/bajar o input numérico `sort_order`.

---

## Product modal UX

Panel colapsable **Personalización** en flyout edit product (`edit-product-form.tsx`):

| Elemento | Tipo |
|----------|------|
| Grupos heredados | Read-only label "Desde categoría {name}" |
| Toggle desactivar grupo | Override ligero |
| Toggle desactivar opción | Override ligero |
| Grupos directos | Lista con toggle |
| Agregar grupo existente | Picker modal |
| Link | "Administrar grupos →" `/admin/products/customizations` |

**Prohibido en V1:** editor completo de opciones dentro del flyout.

---

## Dashboard UX

### Card compacta (`order-card.tsx` / `buildItemsSummary`)

```txt
Hamburguesa clásica
Papas: Grandes
Aderezos: ketchup, barbacoa
+ Coca 500ml
```

- Fuente: `customization_snapshot.summary` (primeras 2 líneas truncadas) + hijos upsell
- Sin snapshot: comportamiento actual (`2x Pizza · 1x Coca`)
- **No parsear** `products.description`

### Detail panel (`order-products-list.tsx`)

```txt
Hamburguesa clásica x1
- Tamaño de papas: Papas grandes (+$900)
- Aderezos: Ketchup, Barbacoa
- Extra: Bacon (+$900)
Plus:
- Coca 500ml x1 (+$1.800)
```

- Padre: snapshot groups + pricing
- Plus: query hijos `item_kind='upsell'` OR agrupar por `parent_order_item_id`
- Legacy: lista plana sin sub-líneas

### Helpers futuros

```txt
lib/orders/presenter.ts:
  formatCustomizationSummary(snapshot)
  formatCustomizationDetailLines(snapshot)
  groupOrderItemsWithUpsells(items)
```

---

## Realtime impact

| Pregunta | Respuesta V1 |
|----------|--------------|
| ¿Escuchar `order_items`? | **No** |
| ¿Funciona con canal `orders`? | **Sí** — INSERT/UPDATE dispara hydration |
| Mecanismo | `fetch /admin/orders/[id]/summary` incluye items con nuevos campos |
| Requisito | `getAdminDashboardOrderById` / summary route SELECT `customization_snapshot`, `parent_order_item_id`, `item_kind` |
| PATCH fallback | No actualiza items — ya mitigado por hydration preferida (patrón existente) |
| Nuevo pedido personalizado | Dashboard recibe order completa tras hydration; render snapshot OK |

**Acción DASHBOARD-1:** verificar summary route trae campos nuevos; no cambiar canal realtime.

---

## Migration strategy

| Etapa | Acción |
|-------|--------|
| DB-1 | Tablas + columnas order_items + RLS + types |
| FLAG-1 | `product_customization_enabled` default false |
| ADMIN-1/2 | Configuración sin impacto público hasta flag on |
| CATALOG-1 + CART-1 | Modal + carrito v2; flag off = bypass |
| ORDER-1 | RPC evolucionado; legacy path intacto |
| DASHBOARD-1 | Render snapshot; legacy null OK |
| QA-1 | E2E tenant demo con flag on |
| Rollout prod | Enable flag por negocio tras QA |

**Carrito:** invalidar storage v1 — no migrar automáticamente.

**Pedidos viejos:** `customization_snapshot null` → display legacy permanente.

---

## Testing / QA matrix

| # | Caso | Esperado |
|---|------|----------|
| 1 | Producto sin customization | Agregar directo |
| 2 | Single required | Botón disabled hasta elegir |
| 3 | Multi max | No permite exceder max_selections |
| 4 | price_delta > 0 | Total en vivo actualiza |
| 5 | Mismo producto, opciones distintas | Dos líneas carrito |
| 6 | Mismo producto, mismas opciones | Fusionar qty |
| 7 | Plus seleccionado | Línea hijo en pedido |
| 8 | Eliminar padre carrito | Elimina plus hijo |
| 9 | Checkout | Total server-side correcto |
| 10 | Manipular precio cliente | Server ignora; total DB correcto |
| 11 | Dashboard pedido nuevo | Muestra snapshot |
| 12 | Pedido viejo sin snapshot | Visible sin error |
| 13 | Grupo heredado categoría | Aparece en modal producto |
| 14 | Grupo heredado desactivado | No aparece en modal |
| 15 | Opción heredada desactivada | No seleccionable |
| 16 | Feature flag off | Flujo plano legacy |
| 17 | Manual order V1 | Producto base sin extras |
| 18 | Upsell no permitido | Error UPSELL_NOT_ALLOWED |
| 19 | "Desde $X" | Visible solo con paid customizations |

---

## Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| RPC regression | Alta | Backward compat; QA legacy payload; staging first |
| RLS leaks en 6 tablas | Alta | Plantilla existente; smoke por tenant |
| FK polimórfica assignments | Media | Validación server + trigger DB-1 |
| Scope creep admin flyout | Media | Sección dedicada; panel mínimo |
| Performance lazy modal | Baja | Single product fetch; cache corto opcional |
| Carrito storage migration | Baja | New storage key v2 |
| Manual order operadores confundidos | Baja | Copy UI limitación V1 |
| Float display vs numeric | Baja | Server authoritative |
| DnD bloquea admin | Baja | ADMIN-DND-1 separado; fallback ↑↓ |
| Snapshot schema drift | Media | Version field; presenter por version |

---

## Decisiones postergadas

| Decisión | Fase |
|----------|------|
| Manual order customization | V1.1 |
| Tabla analytics customization | V2+ |
| Campo cache `products.price_from` | Evaluar en CATALOG-1 (on-read vs trigger) |
| Múltiples plus por línea | V2 |
| Condicionales | V2+ |
| Combos | V2+ |
| Impresión comandera | Roadmap separado |
| WhatsApp summary extendido | DASHBOARD-1 o follow-up |
| Límite max multi-select global | Default sin cap DB; UI puede soft-cap 20 |

---

## Roadmap quirúrgico final

### PRODUCT-CUSTOMIZATION-DB-1 — Schema, RLS & Types

**Objetivo:** Crear tablas customization/upsell, extender `order_items`, RLS, regenerar `types/database.ts`.

**Scope:**
- Migración timestamp en `supabase/migrations/`
- 6 tablas nuevas + 3 columnas `order_items`
- Policies admin + anon SELECT
- Índices y CHECK constraints
- Opcional: `business_settings.product_customization_enabled`

**Fuera de scope:** RPC, UI, server actions.

**Archivos candidatos:**
- `supabase/migrations/YYYYMMDD_product_customization_v1_schema.sql`
- `types/database.ts`

**Validaciones:** FK business_id; CHECK price_delta; UNIQUE upsell per target; self-FK order_items.

**QA:** Insert/select admin; anon read available; pedido legacy legible.

**Criterios de aceptación:** Migración aplicable en staging; RLS smoke PASS; types regenerados; `tsc --noEmit` PASS.

---

### PRODUCT-CUSTOMIZATION-FLAG-1 — Tenant Rollout Guard

**Objetivo:** Flag `product_customization_enabled` en `business_settings` + helper `isProductCustomizationEnabled(businessId)`.

**Scope:** Migración columna; lib helper; documentar en LIVING_MEMORY.

**Fuera de scope:** UI toggle settings (puede ser SUPER-ADMIN manual en V1).

**Archivos:** migración, `lib/admin/business-settings.ts`, `types/database.ts`

**QA:** Default false; demo tenant true en staging.

**Criterios de aceptación:** Helper usable desde catalog/checkout actions.

---

### PRODUCT-CUSTOMIZATION-ADMIN-1 — Groups & Options Admin

**Objetivo:** CRUD grupos y opciones en `/admin/products/customizations`.

**Scope:**
- Ruta + page + shell
- Listado grupos
- Create/edit grupo (selection_type, is_required, min/max)
- CRUD opciones inline
- sort_order manual (↑↓ o numeric)
- Toggle is_available
- Permiso manageProducts

**Fuera de scope:** Assignments, overrides, upsell, DnD visual.

**Archivos candidatos:**
- `app/admin/(protected)/products/customizations/page.tsx`
- `components/admin/customization/*`
- `lib/admin/customization/groups.ts`
- `app/admin/(protected)/products/customizations/actions.ts`
- `components/admin/admin-nav-config.ts`

**Validaciones:** Tenant isolation; CHECK constraints reflejados en form.

**QA:** Crear multi-required; opciones price_delta; desactivar grupo.

**Criterios de aceptación:** CRUD completo grupos/opciones funcional en staging.

---

### PRODUCT-CUSTOMIZATION-ADMIN-2 — Assignments, Overrides & Upsell

**Objetivo:** Asignar grupos a categorías/productos; overrides en edit product; upsell 1 grupo/target.

**Scope:**
- UI assignments (category + product pickers)
- Panel personalización en `edit-product-form.tsx`
- Upsell group + items picker
- Herencia resolver preview (read-only)

**Fuera de scope:** Catálogo público; RPC.

**Archivos candidatos:**
- `lib/admin/customization/assignments.ts`
- `lib/admin/customization/overrides.ts`
- `lib/admin/customization/upsell.ts`
- `components/admin/products/edit-product-form.tsx`
- `components/admin/categories/edit-category-form.tsx` (tab opcional)

**QA:** Herencia category→product; disable grupo/opción; upsell max 1; producto directo override categoría upsell.

**Criterios de aceptación:** Config end-to-end en admin sin catálogo público aún.

---

### PRODUCT-CUSTOMIZATION-ADMIN-DND-1 — Sortable Groups & Options

**Objetivo:** Drag-and-drop visual para reorder grupos, opciones y assignments.

**Scope:** DnD UI con persistencia sort_order; accesible keyboard fallback.

**Fuera de scope:** Lógica CRUD (ya en ADMIN-1/2).

**Archivos:** componentes sortable en `components/admin/customization/`

**QA:** Reorder persiste refresh; mobile fallback ↑↓.

**Criterios de aceptación:** DnD funcional desktop; fallback mobile.

**Nota:** No bloquea ADMIN-1/2 — sort_order manual suficiente hasta esta fase.

---

### PRODUCT-CUSTOMIZATION-CATALOG-1 — Public Customization Modal

**Objetivo:** Modal lazy-loaded; intercept add-to-cart; "Desde $X".

**Scope:**
- API/action `getProductCustomizationConfig`
- `CustomizationModal` component
- Metadata en query catálogo
- Feature flag guard

**Fuera de scope:** RPC order; carrito signature (CART-1).

**Archivos candidatos:**
- `components/public/catalog/customization-modal.tsx`
- `lib/catalog/customization-public.ts`
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/product-card.tsx`
- `lib/catalog/public.ts`

**QA:** Required validation; live price; lazy load < 500ms staging.

**Criterios de aceptación:** Modal funcional end-to-end hasta add (pre-cart V2).

---

### PRODUCT-CUSTOMIZATION-CART-1 — Cart Signature, Pricing & Display

**Objetivo:** `LocalCartItemV2`; signature dedup; display jerárquico; edit from cart.

**Scope:**
- `lib/cart/local.ts` v2 + storage key
- Cart UI components
- Checkout summary display (client-side)

**Fuera de scope:** Server persistence.

**Archivos:** `lib/cart/local.ts`, `components/public/catalog/cart-bar.tsx`, checkout client summary

**QA:** Casos 5, 6, 8 de QA matrix; localStorage persist.

**Criterios de aceptación:** Carrito v2 funcional con modal CATALOG-1.

---

### PRODUCT-CUSTOMIZATION-ORDER-1 — RPC, Server Validation & Snapshot

**Objetivo:** Evolucionar `create_order`; lib validación; snapshots + hijos upsell.

**Scope:**
- `lib/orders/customization/*`
- Migración RPC
- `app/b/[slug]/checkout/actions.ts`
- Error codes

**Fuera de scope:** Manual order; dashboard display.

**Archivos candidatos:**
- `supabase/migrations/YYYYMMDD_create_order_customization_v5.sql`
- `lib/orders/customization/*.ts`
- `app/b/[slug]/checkout/actions.ts`

**QA:** Casos 9, 10, 18; legacy payload regression.

**Criterios de aceptación:** Pedido público con customization persiste snapshot + total correcto.

---

### PRODUCT-CUSTOMIZATION-DASHBOARD-1 — Operational Customization Display

**Objetivo:** Render customization en card + detalle; agrupar upsell hijos.

**Scope:**
- Extend queries `lib/orders/admin.ts`
- Presenter helpers
- `order-products-list.tsx`, `order-card.tsx`
- Summary route fields

**Fuera de scope:** Impresión; WhatsApp (opcional stretch).

**QA:** Casos 11, 12, 17; realtime hydration.

**Criterios de aceptación:** Dashboard legible con y sin snapshot.

---

### PRODUCT-CUSTOMIZATION-QA-1 — End-to-End Smoke

**Objetivo:** Smoke staging/producción flujo completo.

**Scope:** QA doc; checklist 19 casos; tenant demo.

**Fuera de scope:** Feature code salvo hotfixes críticos en fase fix separada.

**Entregable:** `docs/product-customization-qa-1-e2e-smoke.md`

**Criterios de aceptación:** PASS en flujo admin → público → dashboard → completar pedido.

---

## Recomendación final

Product Customization V1 es **implementable incrementalmente** sobre la arquitectura actual de OrderOps:

1. **Schema compacto (Opción A)** + overrides unificados + upsell con target embebido.
2. **Snapshot JSONB versionado** en padre; **plus como fila hija** real.
3. **RPC evolucionado** backward-compatible — no fork permanente.
4. **Carrito signature** — cambio crítico de identidad de línea.
5. **Lazy load** + feature flag — rollout seguro.
6. **Manual order sin customization** en V1 — reduce riesgo operacional.
7. **DnD visual separado** en ADMIN-DND-1 — no bloquea entrega core.

Los tres entregables bloqueantes del camino crítico: **DB-1 → ORDER-1 → CATALOG-1 + CART-1**.

---

## Próxima fase

**PRODUCT-CUSTOMIZATION-DB-1 — Schema, RLS & Types**

Ejecutar migración de tablas `customization_*`, `upsell_*`, columnas `order_items`, RLS anon/admin, regenerar `types/database.ts`, smoke policies staging.

Opcional en misma migración o FLAG-1 inmediato: `business_settings.product_customization_enabled boolean NOT NULL DEFAULT false`.

---

## Validaciones ejecutadas (SPEC-1)

| Validación | Resultado |
|------------|-----------|
| Modificación código productivo | **No** |
| Migraciones creadas | **No** |
| DB / RLS / actions tocados | **No** |
| Documento spec creado | **Sí** — este archivo |
| `npx tsc --noEmit` | **PASS** (exit 0, 2026-07-11) |
| Commits | **No** (per instrucción fase) |
