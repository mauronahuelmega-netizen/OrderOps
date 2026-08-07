# PRODUCT-CUSTOMIZATION-ADMIN-2 — Assignments, Overrides & Upsell

## Objetivo

Extender el admin de Product Customization para assignments (categoría/producto), herencia + overrides livianos en edición de producto, y upsell/plus sugeridos — sin conectar catálogo público ni activar el flag.

**Fecha:** 2026-07-12  
**Estado:** PASS WITH DEBT (smoke autenticado: ver `docs/product-customization-admin-2-qa-authenticated-browser-smoke.md`)

---

## Contexto

| Fase | Resultado |
|------|-----------|
| AUDIT-1 / SPEC-1 | PASS |
| DB-1 / DB-APPLY-1 | PASS WITH DEBT — schema en prod |
| FLAG-1 | PASS |
| ADMIN-1 | PASS WITH DEBT — grupos/opciones |
| ADMIN-2 | Esta fase |

Flag: `product_customization_enabled` permanece **off**. No se activó ningún tenant.

---

## Scope

1. Asignar grupos a categorías y productos (`customization_group_assignments`)
2. Listar / activar-desactivar / editar `sort_order` de assignments
3. Panel de herencia en edit product (categoría → producto + directos)
4. Overrides V1: desactivar/restaurar grupo u opción (restaurar = delete override)
5. Upsell groups/items (máx. 1 grupo por target vía unique DB)
6. Documentación

## Fuera de scope

DnD, catálogo público, modal público, Cart V2, checkout/RPC, dashboard, pedido manual customization, toggle/activación de flag, price/name override, stock por opción, migraciones/RLS, deploy.

---

## Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `app/admin/(protected)/products/customizations/page.tsx` | Extendido (assignments + upsell + `?product=`) |
| `app/admin/(protected)/products/customizations/actions.ts` | Actions assignments/overrides/upsell + load inheritance |
| `lib/product-customization/admin.ts` | Data helpers + herencia |
| `lib/product-customization/shared.ts` | Tipos/parsers cliente-seguros |
| `components/admin/product-customization/customization-assignments-section.tsx` | Creado |
| `components/admin/product-customization/upsell-groups-section.tsx` | Creado |
| `components/admin/product-customization/product-customization-overrides-panel.tsx` | Creado |
| `components/admin/product-customization/product-customization-admin.module.css` | Extendido |
| `components/admin/products/edit-product-form.tsx` | Panel overrides |
| `docs/CURRENT_PHASE.md` | Registro |
| `ORDEROPS_LIVING_MEMORY.md` | Changelog |

---

## Ruta actualizada

```txt
/admin/products/customizations
/admin/products/customizations?product=<productId>
```

Protección: `requireAdminPermission("manageProducts")`.

---

## Server actions

Además de ADMIN-1:

- `createCustomizationGroupAssignmentAction`
- `updateCustomizationGroupAssignmentAction`
- `toggleCustomizationGroupAssignmentAction`
- `disableProductCustomizationGroupOverrideAction`
- `restoreProductCustomizationGroupOverrideAction`
- `disableProductCustomizationOptionOverrideAction`
- `restoreProductCustomizationOptionOverrideAction`
- `createUpsellGroupAction`
- `updateUpsellGroupAction`
- `toggleUpsellGroupAction`
- `addUpsellGroupItemAction`
- `updateUpsellGroupItemAction`
- `toggleUpsellGroupItemAction`
- `loadProductCustomizationInheritanceAction` (lectura para panel producto)

`business_id` siempre desde contexto server. Revalidate: `/admin/products/customizations` + `/admin/products`.

---

## Data fetching

- `getCustomizationAdminConfig(businessId)` — groups, assignments, upsell, products
- `getCustomizationAssignmentsForAdmin`
- `getUpsellGroupsForAdmin`
- `getProductCustomizationInheritanceForAdmin`
- `getCatalogProductsForCustomizationAdmin`

`server-only` en `admin.ts`. Client usa solo `shared.ts` + actions.

---

## Assignments

- `target_type`: `category` | `product`
- Unique `(business_id, group_id, target_type, target_id)` → create con error claro si duplicado
- Soft disable vía `is_enabled` (sin hard delete)
- Ownership de group + target validado server-side

---

## Product overrides

- Solo `is_enabled = false` para desactivar
- Restaurar = **delete** de la fila override
- Shape DB: group override (`group_id` set, `option_id` null); option override (`option_id` set, `group_id` null)
- No se crea override si el grupo no aplica al producto

### Resolución de herencia

1. Assignments de categoría (`product.category_id`) + assignments de producto
2. Si el mismo `group_id` aparece en ambos: **prioriza assignment de producto** (sort/source)
3. Orden: `assignment.sort_order` → `group.sort_order` → `created_at`

---

## Upsell groups/items

- Unique DB `(business_id, target_type, target_id)` → **máximo 1 grupo por destino** (activo o no)
- Create falla con mensaje claro si ya existe
- Items referencian `products` reales; precio de referencia desde `products.price`
- No self-upsell cuando `target_type = product`
- No precio custom en items

---

## Product edit integration

- Panel `ProductCustomizationOverridesPanel` debajo del form de edición (flyout)
- Link a `/admin/products/customizations?product=…`
- No crea grupos/upsell desde el modal; solo disable/restore

---

## Feature flag behavior

- `isProductCustomizationEnabled` solo lectura
- Banner: preparación interna; no se muestra en catálogo hasta rollout
- Sin toggle UI; sin writes a `business_settings`

---

## Permisos / seguridad

- Auth + `manageProducts` (owner/manager)
- Ownership por `business_id` server-side en cada write
- No se confía en `business_id` del cliente

---

## Validaciones

| Área | Reglas |
|------|--------|
| Assignment | target/group required, sort ≥ 0, ownership, no duplicado |
| Override group/option | product+group aplican; option ∈ group; restore = delete |
| Upsell group | name, target ownership, ≤1 por target |
| Upsell item | ownership, no duplicado, no self en target product |

---

## QA browser

Pendiente de sesión autenticada local (sin deploy en esta fase). Checklist:

- [ ] `/admin/products/customizations` carga + banner flag off
- [ ] Assignment categoría / producto
- [ ] Toggle + sort assignment; duplicado → error
- [ ] Upsell create + item; segundo grupo mismo target → error
- [ ] Edit product: herencia, disable/restore grupo y opción
- [ ] Catálogo/carrito/checkout/dashboard sin cambios

---

## Datos QA creados/restaurados

Ninguno en esta corrida (sin smoke autenticado / sin writes a prod desde el agente).

---

## Qué NO se tocó

- `create_order`, `order_items`, catálogo público (`app/b/`), carrito, checkout, dashboard, realtime, migraciones/RLS, flag activation, Vercel/deploy

---

## Riesgos / deuda

1. Smoke browser autenticado pendiente (igual que ADMIN-1)
2. Unique upsell por target es más estricto que “máx. 1 activo”: no se puede tener un segundo grupo desactivado para el mismo destino
3. Panel de producto carga herencia vía server action (extra round-trip en flyout)
4. Layout de customizations creció (grupos + assignments + upsell); posible UX de tabs en fase futura

---

## Resultado final

**PASS WITH DEBT** — implementación completa de ADMIN-2; `tsc` PASS; `build` PASS; smoke autenticado pendiente.

---

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-PUBLIC-1** (o ADMIN polish) — solo cuando se autorice conectar resolución de herencia al catálogo público detrás del flag, sin activar tenants todavía.
