# PRODUCT-CUSTOMIZATION-ADMIN-DND-1 — Sortable Groups & Options

## Objetivo

Ordenamiento visual (drag-and-drop + botones subir/bajar) en `/admin/products/customizations` para grupos, opciones y assignments, persistiendo `sort_order` sin depender solo de inputs numéricos.

**Fecha:** 2026-07-12  
**Estado:** PASS WITH DEBT (touch HTML5 DnD; keyboard ARIA avanzado; upsell items fuera de scope)

---

## Contexto

| Fase | Resultado |
|------|-----------|
| ADMIN-1 / ADMIN-2 / ADMIN-2-QA | PASS / PASS WITH DEBT |
| DND-1 | Esta fase |

Flag `product_customization_enabled` sigue **off**. Sin catálogo público, carrito, checkout, dashboard, migraciones ni deploy.

---

## Scope

1. DnD visual de grupos
2. DnD visual de opciones dentro de un grupo (sin cross-group)
3. DnD visual de assignments dentro del mismo target
4. Persistencia `sort_order` (incrementos de 10)
5. Feedback loading/success/error + revert visual si falla
6. Fallback accesible ↑/↓
7. Docs + `tsc`/`build`

## Fuera de scope

- Upsell items reorder (explícito: subfase futura)
- Catálogo/modal público, Cart V2, checkout/RPC, dashboard
- Feature flag UI / activación
- DB/migrations/RLS
- Reglas nuevas de herencia/overrides

---

## Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `lib/product-customization/shared.ts` | Parsers/helpers reorder (sin server-only) |
| `lib/product-customization/admin.ts` | Re-export `parseOrderedIdsJson` |
| `app/admin/(protected)/products/customizations/actions.ts` | 3 actions reorder |
| `app/admin/(protected)/products/customizations/page.tsx` | `SortableGroupsList` |
| `components/admin/product-customization/sortable-reorder-list.tsx` | Creado |
| `components/admin/product-customization/sortable-groups-list.tsx` | Creado |
| `components/admin/product-customization/customization-group-card.tsx` | Opciones sortable |
| `components/admin/product-customization/customization-assignments-section.tsx` | Assignments sortable |
| `components/admin/product-customization/product-customization-admin.module.css` | Estilos DnD |
| `docs/CURRENT_PHASE.md` | Registro |
| `ORDEROPS_LIVING_MEMORY.md` | Changelog |

---

## Estrategia DND elegida

**HTML5 Drag and Drop nativo** + botones ↑/↓.

Motivo: no había librería DnD en `package.json`; evitar dependencia nueva para un caso acotado (handle-only, listas cortas admin).

Handle `⋮⋮` inicia el drag (no el card entero) para no interferir con formularios.

---

## Server actions de reorder

| Action | Payload FormData |
|--------|------------------|
| `reorderCustomizationGroupsAction` | `orderedIdsJson` |
| `reorderCustomizationOptionsAction` | `groupId`, `orderedIdsJson` |
| `reorderCustomizationAssignmentsAction` | `targetType`, `targetId`, `orderedIdsJson` |

Todas:

- `requireAdminPermission("manageProducts")`
- `business_id` solo server-side
- validan ownership / mismo group / mismo target
- rechazan duplicados / IDs ajenos
- actualizan **solo** `sort_order`
- `revalidatePath` customizations + products
- sin updates parciales intencionales: si algún update falla → error (riesgo residual de atomicidad documentado)

---

## Grupos sortable

`SortableGroupsList` envuelve cards; auto-save al soltar / ↑↓.

## Opciones sortable

Dentro de cada grupo con ≥2 opciones; no se puede mover a otro grupo.

## Assignments sortable

Por target (categoría/producto); sin cross-target drag.

---

## Persistencia sort_order

Convención: **10, 20, 30…** (`CUSTOMIZATION_SORT_ORDER_STEP = 10`).

Queries existentes siguen `sort_order asc` (+ `created_at` donde aplica).

---

## Accesibilidad

- Handle con `aria-label`
- Botones ↑/↓ (fallback teclado/touch)
- `aria-live` en feedback / “Guardando orden...”
- Focus visible en handle/botones
- Deuda: **D1 — keyboard reorder completo tipo lista ARIA pendiente** (↑↓ cubre lo mínimo)

---

## Feedback / errores

- Éxito: “Orden de grupos/opciones/assignments actualizado.”
- Loading: “Guardando orden...”
- Error: mensaje claro + **revert** del orden visual local

---

## Feature flag behavior

Sin cambios. Banner de flag apagado se mantiene.

---

## Qué NO se tocó

`create_order`, catálogo público, carrito, checkout, dashboard, realtime, manual order, `order_items`, migraciones/RLS, upsell reorder, `business_settings`, deploy.

---

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

---

## QA browser

Sesión owner La Burguesía en `http://localhost:3000/admin/products/customizations`.

| Check | Resultado |
|-------|-----------|
| Ruta carga + flag off | PASS |
| Handles `⋮⋮` + ↑/↓ en grupos (≥2) | PASS |
| Reorder grupos (↑↓) + “Orden de grupos actualizado.” + refresh | PASS |
| Reorder opciones (↑↓) + persist (Plus→10, Opción0→20) | PASS |
| Assignments: 2 en HAMBURGUESAS → handles DnD visibles | PASS (UI); persist vía mismo `SortableReorderList` |
| Forms/toggles existentes | PASS |
| Touch HTML5 DnD | DEBT — usar ↑↓ |

---

## Datos QA usados

| Dato | Notas |
|------|--------|
| `QA ADMIN-2 Grupo 20260712-1726` + opciones | Reordenado (opciones + grupos) |
| `QA DND Grupo B 20260712-2345` | Creado para smoke grupos/assignments; desactivar si quedó activo |
| Assignment HAMBURGUESAS → Grupo B | Creado para DnD assignments |

Orden demo no restaurado al 100% (datos QA). Flag no activado.

---

## Riesgos / deuda

1. Updates `Promise.all` sin transacción SQL → posible inconsistencia parcial si falla a mitad (validación previa mitiga).
2. Touch HTML5 DnD frágil → fallback ↑↓.
3. Keyboard DnD avanzado pendiente (D1).
4. Upsell items reorder fuera de scope.
5. Assignment reorder smoke: UI confirmada; click persist bloqueado parcialmente por auto-review mid-flow (mismo path que grupos/opciones).

---

## Resultado final

**PASS WITH DEBT**

---

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-PUBLIC-1** (catálogo detrás del flag) **o** subfase **DND-2** (upsell items sortable) si se prioriza UX admin.
