# PRODUCT-CUSTOMIZATION-ADMIN-1 — Groups & Options Admin

## Objetivo

Crear la superficie admin `/admin/products/customizations` para CRUD de grupos y opciones de Product Customization V1, sin conectar catálogo/carrito/checkout/dashboard ni activar el feature flag.

**Fecha:** 2026-07-12  
**Estado:** PASS WITH DEBT (CRUD autenticado browser pendiente de sesión manual)

---

## Contexto

| Fase | Resultado |
|------|-----------|
| AUDIT-1 / SPEC-1 | PASS |
| DB-1 / DB-APPLY-1 | PASS WITH DEBT — schema en prod |
| FLAG-1 | PASS — helper fail-closed |
| ADMIN-1 | Esta fase |

Flag: `product_customization_enabled` permanece **off** globalmente. No se activó ningún tenant.

---

## Scope

- Ruta protegida `/admin/products/customizations`
- Listar / crear / editar grupos
- Activar/desactivar grupos
- Crear / editar opciones
- Activar/desactivar opciones
- Validación single/multiple, required, min/max, `price_delta >= 0`
- `sort_order` numérico
- Aviso de flag apagado
- Link desde header de Productos

## Fuera de scope

Assignments, overrides, upsell, DnD, modal público, cart/checkout/RPC, dashboard, toggle de flag, migraciones/RLS, hard delete.

---

## Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `app/admin/(protected)/products/customizations/page.tsx` | Creado |
| `app/admin/(protected)/products/customizations/actions.ts` | Creado |
| `lib/product-customization/admin.ts` | Creado |
| `components/admin/product-customization/create-group-form.tsx` | Creado |
| `components/admin/product-customization/customization-group-card.tsx` | Creado |
| `components/admin/product-customization/product-customization-admin.module.css` | Creado |
| `components/admin/products/products-header-actions.tsx` | Link “Opcionales y extras” |
| `components/admin/admin-nav-config.ts` | matchPrefix explícito |
| `docs/CURRENT_PHASE.md` | Nota |
| `ORDEROPS_LIVING_MEMORY.md` | Changelog |

---

## Ruta creada

```txt
/admin/products/customizations
```

Protección: `requireAdminPermission("manageProducts")` (owner/manager).

---

## Server actions

En `actions.ts`:

- `createCustomizationGroupAction`
- `updateCustomizationGroupAction`
- `toggleCustomizationGroupAvailabilityAction`
- `createCustomizationOptionAction`
- `updateCustomizationOptionAction`
- `toggleCustomizationOptionAvailabilityAction`

Patrón: FormData + `ActionState` + `createSupabaseServerClient` + `business_id` server-side + ownership check + `revalidatePath`.

Sin hard delete.

---

## Data fetching

`getCustomizationGroupsForAdmin(businessId)` — dos queries (groups + options) agrupadas en memoria, orden `sort_order`, `created_at`.

Parsers: `parseCustomizationGroupInput`, `parseCustomizationOptionInput`.

---

## UI implementada

- Header Catálogo / Opcionales y extras
- Banner flag apagado/activo (informativo)
- Formulario crear grupo
- Cards de grupo con edición + toggle
- Opciones anidadas con crear/editar/toggle
- Empty state
- Feedback `admin-feedback` + `aria-live`

---

## Validaciones

Grupos: name, selection_type, required⇒min≥1, single⇒max=1, max≥min, sort≥0.  
Opciones: name, price_delta≥0 (numeric), ownership de grupo mismo business.

---

## Permisos / seguridad

- `manageProducts` en page y actions
- `business_id` solo desde `adminContext`
- Writes filtrados por `business_id`
- Verificación previa de ownership antes de update/toggle/option create

---

## Feature flag behavior

- Server-side `isProductCustomizationEnabled(businessId)` solo para badge/aviso
- No toggle UI
- No update a `business_settings`
- Configuración preparatoria permitida con flag off

---

## Backward compatibility

Catálogo/checkout/dashboard sin cambios. Customization no visible públicamente.

---

## Qué NO se tocó

```txt
create_order, catálogo, carrito, checkout, dashboard, realtime,
manual order, order_items logic, migrations, RLS, Vercel/deploy,
assignments/overrides/upsell, flag activation
```

---

## Validaciones ejecutadas

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — ruta `/admin/products/customizations` incluida |
| Browser QA | Ver sección QA |

---

## QA browser

Producción (`orderops.vercel.app`) **no** incluye este código hasta un deploy futuro (no se hizo deploy en esta fase).

Smoke automático local:

```txt
npm run start -p 3010
GET /admin/products/customizations → redirect /admin/login (protección OK)
```

CRUD autenticado (crear/editar/toggle) **pendiente** de sesión owner manual en local.

Checklist manual restante:

- [ ] Aviso flag apagado
- [ ] Empty state / listado
- [ ] Crear grupo single + multiple
- [ ] Editar / desactivar / activar grupo
- [ ] Crear opción price 0 y >0
- [ ] Editar / desactivar / activar opción
- [ ] Refresh conserva datos

Datos QA: prefijo `QA ADMIN-1`; dejar desactivados al final.

---

## Riesgos / deuda

| Ítem | Nota |
|------|------|
| Sin assignments | Grupos no afectan productos hasta ADMIN-2 |
| Sin DnD | sort_order numérico solamente |
| Build/deploy | Código admin no está en Vercel hasta próximo deploy |
| Historial migraciones CLI | Deuda DB-APPLY-1 intacta |

---

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-ADMIN-2 — Assignments, Overrides & Upsell**
