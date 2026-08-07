# PRODUCT-CUSTOMIZATION-DB-1 — Schema, RLS & Types

## Objetivo

Crear la base persistente de **Product Customization V1** (tablas, constraints, indexes, RLS, feature flag, extensiones de `order_items` y tipos TypeScript) **sin cambiar el comportamiento runtime** de la app.

**Fecha:** 2026-07-12  
**Estado:** Completada (migración lista; no aplicada a producción en esta fase)

---

## Contexto

Fases previas:

| Fase | Resultado |
|------|-----------|
| PRODUCT-CUSTOMIZATION-AUDIT-1 | PASS — `docs/product-customization-audit-1-options-extras-upsell-architecture.md` |
| PRODUCT-CUSTOMIZATION-SPEC-1 | PASS — `docs/product-customization-spec-1-final-product-technical-spec.md` |

Modelo elegido: **Opción A — nombres compactos**.  
D7: `create_order` **no** se toca en esta fase.  
D8: flag `product_customization_enabled` default **false**.

---

## Fuentes

| Documento | Uso |
|-----------|-----|
| `docs/product-customization-spec-1-final-product-technical-spec.md` | Spec congelada (schema, RLS, D1–D8) |
| `docs/product-customization-audit-1-options-extras-upsell-architecture.md` | Auditoría |
| `supabase/migrations/20260426215500_t2_categories_products.sql` | Patrones FK compuesta / price numeric |
| `supabase/migrations/20260427021000_super_admin_roles_and_rls.sql` | RLS admin |
| `supabase/migrations/20260426230000_t6_public_catalog_read.sql` | RLS anon catálogo |
| `supabase/migrations/20260607210325_business_settings.sql` | Flag table + moddatetime |

### Precheck esquema confirmado

| Aspecto | Valor real del repo |
|---------|---------------------|
| UUID | `gen_random_uuid()` |
| `products.price` / `order_items.unit_price` | `numeric(12,2)` → `price_delta` usa el mismo |
| `business_id` | `uuid` FK → `businesses` |
| `business_settings` | Existe; PK `business_id` |
| `order_items.id` | `uuid` PK |
| `updated_at` helper | `extensions.moddatetime` (usado en business_settings) |
| GIN JSONB indexes | **No** existen en el repo → GIN omitido en V1 |
| Types gen script | **No** hay script en `package.json` → `types/database.ts` actualizado a mano |

---

## Cambios realizados

1. Migración nueva `supabase/migrations/20260712090000_product_customization_v1_schema.sql`
2. `types/database.ts` extendido (flag, order_items, 6 tablas)
3. Este documento
4. Entrada en `ORDEROPS_LIVING_MEMORY.md`

**Sin cambios** en UI, actions, RPC, catálogo, carrito, dashboard.

---

## Migración creada

```txt
supabase/migrations/20260712090000_product_customization_v1_schema.sql
```

Tamaño: **36406 bytes**. Única migración customization de esta fase.

### Duplicado vacío eliminado

Durante el intento inicial, `supabase migration new` se colgó y creó:

```txt
supabase/migrations/20260712061401_product_customization_v1_schema.sql
```

Ese archivo estaba **100% vacío (0 bytes)** y fue **eliminado**. No se tocaron migraciones históricas.

Idempotencia parcial: `create table if not exists`, `add column if not exists`, `create index if not exists`, `drop policy if exists` + recreate.

**No aplicada a producción** en esta fase. No se ejecutó `supabase db push` ni `db reset`.

---

## Feature flag

```sql
alter table public.business_settings
  add column if not exists product_customization_enabled boolean not null default false;
```

| Aspecto | Valor |
|---------|-------|
| Default | `false` para todos los negocios |
| Seed / enable | **No** |
| UI toggle | **No** (futuro FLAG-1 / settings) |
| Anon RLS | Incluye `product_customization_enabled = true` |

Con flag off, anon no lee tablas de customization aunque existan filas.

---

## order_items extensions

| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| `customization_snapshot` | jsonb null | null | Snapshot v1; legacy = null |
| `parent_order_item_id` | uuid null | null | FK self ON DELETE **CASCADE** |
| `item_kind` | text not null | `'product'` | `'product'` \| `'upsell'` |

Constraints adicionales:

- `order_items_item_kind_check`
- `order_items_parent_kind_consistency_check` (upsell ⇒ parent NOT NULL; product ⇒ parent NULL)
- `order_items_snapshot_only_on_product_check`

Índices: `order_items_parent_order_item_id_idx`, `order_items_item_kind_idx`.

**GIN omitido:** no hay queries JSONB operativas en V1; deuda documentada para analytics.

**Policies de order_items:** sin cambios (INSERT sigue vía RPC SECURITY DEFINER).

---

## Tablas nuevas

### customization_groups

Grupos reutilizables por negocio.  
`selection_type` ∈ (`single`,`multiple`); `min/max`; `is_required`; `is_available`; `sort_order`.  
UNIQUE `(id, business_id)` para FK compuesta.

### customization_options

Opciones del grupo.  
`price_delta numeric(12,2) >= 0`.  
FK compuesta `(group_id, business_id)` → `customization_groups`.

### customization_group_assignments

Asignación polimórfica `target_type` ∈ (`category`,`product`) + `target_id`.  
UNIQUE `(business_id, group_id, target_type, target_id)`.  
**Sin FK en `target_id`** (limitación polimórfica).

### product_customization_overrides

Disable de grupo u opción heredada por producto.  
Shape SPEC-1: group ⇒ `group_id` + `option_id` null; option ⇒ `option_id` + `group_id` null.  
Unique parciales por tipo.  
`is_enabled` default `false` (= desactivado).

### upsell_groups

Plus sugerido; target embebido (`target_type` + `target_id` NOT NULL).  
UNIQUE `(business_id, target_type, target_id)` — max 1 grupo por target.  
`target_id` polimórfico sin FK.

### upsell_group_items

Productos reales sugeridos.  
UNIQUE `(business_id, upsell_group_id, product_id)`.  
`product_id` ON DELETE **RESTRICT**.  
Sin columna de precio (sale de `products.price` en ORDER-1).

---

## Constraints

| Nombre | Tabla |
|--------|-------|
| `customization_groups_selection_type_check` | groups |
| `customization_groups_min_selections_check` | groups |
| `customization_groups_max_selections_check` | groups |
| `customization_groups_single_max_check` | groups |
| `customization_groups_required_min_check` | groups |
| `customization_options_price_delta_check` | options |
| `customization_group_assignments_target_type_check` | assignments |
| `product_customization_overrides_type_check` / `_shape_check` | overrides |
| `upsell_groups_target_type_check` / `_one_per_target_unique` | upsell |
| `order_items_item_kind_check` + parent/snapshot consistency | order_items |

---

## Indexes

Principales creados según spec DB-1:

- groups: business / available / sort
- options: business / group / business+group / group+sort / available
- assignments: business / group / target / target+enabled + unique constraint
- overrides: product / product+type + unique parciales group/option
- upsell: business / target / available; items: group / product / unique / sort
- order_items: parent / item_kind

---

## RLS policies

### Admin policies

Patrón idéntico a `products`/`categories` (authenticated + same `business_id` OR `super_admin`):

- SELECT / INSERT / UPDATE / DELETE por tabla nueva

### Public/anon policies

`to anon` SELECT con:

1. business `is_active = true`
2. `business_settings.product_customization_enabled = true`
3. `is_available` / `is_enabled` según tabla
4. options: grupo padre available
5. upsell items: grupo + producto available

**Nunca** `using (true)`.

### Service/RPC considerations

- INSERT `order_items` sigue solo vía `create_order` (SECURITY DEFINER) — sin cambio.
- ORDER-1 usará estas tablas para validar IDs y recalcular precios.
- No se crearon funciones RPC nuevas en esta fase.

---

## Types

| Acción | Detalle |
|--------|---------|
| Regeneración CLI | No disponible / no hay script en package.json |
| Actualización | Manual en `types/database.ts` |
| Campos nuevos | `business_settings.product_customization_enabled` |
| order_items | `customization_snapshot`, `parent_order_item_id`, `item_kind` |
| Tablas | 6 tablas nuevas tipadas con Relationships |

`npx tsc --noEmit` → **PASS** (exit 0) tras el cambio.

---

## Backward compatibility

| Escenario | Resultado |
|-----------|----------|
| Pedidos existentes | `item_kind='product'`, snapshot/parent null |
| `create_order` actual | Sin cambios; inserta filas compatibles |
| Dashboard / catálogo / carrito | Sin cambios de código |
| Feature flag | Off → anon no ve customization |
| Pedido manual | Sin cambios |

---

## Qué NO se tocó

- UI / components / app routes
- Server actions
- RPC `create_order`
- Catálogo, carrito, checkout, dashboard
- Realtime
- Seed data
- Deploy / `db push` a producción
- Activación de flag en ningún tenant

---

## Validaciones ejecutadas

| Validación | Resultado |
|------------|-----------|
| `git status --short` (precheck) | Docs previos untracked; sin código productivo previo de esta fase |
| `npx tsc --noEmit` (precheck) | PASS exit 0 |
| `npx tsc --noEmit` (post / validation continue) | PASS exit 0 |
| Migraciones customization en carpeta | **1 sola:** `20260712090000_product_customization_v1_schema.sql` (36406 bytes) |
| Duplicado vacío `20260712061401_...` | Eliminado (0 bytes, creado por `supabase migration new` colgado) |
| Review SQL checklist | PASS — flag, order_items, 6 tablas, constraints, indexes, RLS admin+anon |
| `create_order` en migración | **No modificado** (solo comentario) |
| Seed / UPDATE masivo / flag ON | **Ausentes** |
| Policies `orders` / `order_items` | **Sin cambios** |
| `supabase migration list` | **No ejecutado con éxito** — CLI 2.72.7 sin `supabase link` (`Cannot find project ref`) |
| `supabase db reset` | **No ejecutado** — no hay stack local seguro/descartable confirmado |
| `supabase db push` / deploy | **No ejecutado** (prohibido en fase) |
| `supabase gen types` | **No disponible** — sin script en `package.json`; proyecto no linked; types actualizados a mano (patrón del repo) |
| `git diff -- types/database.ts` | +344 líneas solo en flag / order_items / 6 tablas nuevas |
| `npm run build` | Omitido — schema/types only; `tsc` PASS suficiente |
| UI smoke | No obligatorio (sin UI) |

### Supabase local validation not executed

```txt
Supabase local validation not executed: proyecto sin `supabase link`;
migration list falla con "Cannot find project ref";
no hay contenedores Supabase locales activos para db reset seguro.
```

### Confirmaciones explícitas de no-touch

```txt
No se modificó create_order.
No se modificó UI.
No se modificó catálogo.
No se modificó carrito.
No se modificó dashboard.
No se aplicó migración a producción.
No se activó feature flag.
No se ejecutó supabase db push.
No se creó otra migración en esta validación.
```

### Resultado de validación continua (2026-07-12)

**PASS WITH DEBT** — deuda: migración no aplicada/ejecutada contra DB local ni remota; types manuales (sin gen CLI).

---

## Riesgos / deuda técnica

| Riesgo | Severidad | Mitigación / deuda |
|--------|-----------|--------------------|
| FK polimórfica `target_id` | Media | Validar en ADMIN-2 server actions; sin trigger cross-table |
| Override option sin `group_id` | Baja | SPEC-1; resolución vía `option.group_id` join |
| GIN snapshot ausente | Baja | Agregar si analytics JSONB lo requiere |
| Types manuales vs gen | Media | Documentado; regenerar cuando haya CLI linked |
| Unique upsell 1 por target (incluye disabled) | Baja | Para reasignar hay que update/delete el row existente |
| Migración no aplicada aún a staging/prod | Alta (operativa) | Aplicar en entorno controlado antes de ADMIN-1 |
| Options `business_id` sync | Baja | FK compuesta `(group_id, business_id)` lo garantiza |
| Validación SQL runtime ausente | Media | `db reset`/`migration up` en staging antes de admin UI |

---

## Próxima fase recomendada

**Antes de ADMIN-1 (recomendado):** aplicar `20260712090000_product_customization_v1_schema.sql` en **staging** y smoke de policies/flag off.

Luego: **PRODUCT-CUSTOMIZATION-ADMIN-1 — Groups & Options Admin**

CRUD de grupos/opciones en `/admin/products/customizations`, con `sort_order` manual (↑↓), sin assignments/upsell (ADMIN-2) y sin tocar catálogo público.

Opcional paralelo: **PRODUCT-CUSTOMIZATION-FLAG-1** si se quiere helper TS `isProductCustomizationEnabled` antes del admin UI.
