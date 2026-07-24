# Product Customization Admin V1 — Final Handoff

Documento autónomo de cierre técnico y de producto. Fuente de verdad para retomar el módulo sin reconstruir el historial completo.

**Fecha de cierre:** 2026-07-23  
**HEAD al iniciar handoff:** `0c33d59`  
**Branch:** `main`  
**Piloto:** La Burguesía · `demohamburgueseria` · `business_id=e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`

---

## 1. Resumen ejecutivo

Product Customization V1 permite configurar opciones, extras y productos adicionales reutilizables, aplicarlos por categoría o producto, crear excepciones por producto y visualizar el resultado en admin antes de publicarlo.

El flujo público conserva pricing y validación server-side (`create_order` + `lib/product-customization/order-validation.ts`), snapshots en `order_items`, stock con ledger y restock idempotente al cancelar.

Admin V1 está **premium-ready para piloto** (Enterprise Readiness **4.3/5**, P0=0, P1=0). Queda deuda P2/P3 no bloqueante (DnD touch ~32px, chips densos, feedback post-save).

---

## 2. Estado final

| Campo | Valor |
|-------|-------|
| Estado | **PREMIUM READY / V1 COMPLETE** |
| Enterprise Readiness | **4.3 / 5** (no recalculado en esta fase) |
| P0 | **0** |
| P1 | **0** |
| Deuda | P2/P3 no bloqueante |
| Runtime en esta fase | **Sin cambios** (docs-only) |

---

## 3. Enterprise readiness

| Dimensión (rescore) | Score |
|---------------------|-------|
| Claridad | 4.5 |
| Jerarquía visual | 4.3 |
| Densidad | 4.2 |
| Consistencia | 4.3 |
| Copy | 4.5 |
| Intuitividad | 4.4 |
| Responsive | 4.3 |
| Accesibilidad básica | 3.8 → mejorada post-A11Y (menús) |
| Confianza operacional | 4.4 |
| Premium feel | 4.2 |

**Baseline monitor:** 3.1/5 · **Rescore:** 4.3/5 · **Δ +1.2**  
Fuente: `docs/product-customization-admin-v1-premium-rescore-1-enterprise-readiness.md`

---

## 4. Alcance funcional entregado

Verificado en código y smoke:

- Grupos/secciones reutilizables (`customization_groups`)
- Opciones por sección (`customization_options`) con `price_delta`
- Selección `single` / `multiple`, required/optional, min/max
- Assignments por producto y categoría
- Reorder (groups, options, assignments) + DnD + ↑/↓
- Ocultar/mostrar (availability / `is_enabled`)
- Remove/unassign seguro de assignments
- Herencia categoría → producto + overrides de producto
- Plus sugeridos (`upsell_groups` / `upsell_group_items`)
- Preview admin sandbox (sin carrito/pedido)
- Catálogo público + modal de personalización
- Carrito parent + adicional (upsell)
- Checkout → RPC `create_order` con validación server-side
- Snapshots `customization_snapshot` / `item_kind` / `parent_order_item_id`
- Stock decrement en `create_order` (`track_stock`)
- Cancel restock vía `stock_movements` + `transition_order_status`
- Feature flag `business_settings.product_customization_enabled`

---

## 5. Fuera de alcance de V1

- Bundles/productos compuestos
- Disponibilidad por horario de opciones
- Stock por opción (solo productos tracked)
- Kitchen/delivery modes dedicados
- Analytics de selección
- Importación masiva
- Eliminación definitiva de grupos desde UI compacta (ocultar ≠ delete)
- Arrow-key roving completo en menús ⋮
- DnD touch target ≥40px (deuda opcional)

---

## 6. Arquitectura general

```txt
Admin configuration (OwnerCustomizationBuilder + actions)
        ↓
Supabase persistence (customization_* / upsell_* / overrides)
        ↓
Effective configuration resolver
  · public: lib/product-customization/public.ts
  · admin preview: lib/product-customization/admin-preview-mapper.ts
        ↓
Admin preview / public catalog modal
        ↓
Cart customization payload (client; no pricing authority)
        ↓
Server-side validation & pricing
  · lib/product-customization/order-validation.ts
  · RPC create_order
        ↓
Order snapshots (order_items)
        ↓
Inventory ledger / stock changes (stock_movements)
```

**Fuentes de verdad**

| Capa | Verdad |
|------|--------|
| Configuración | Tablas Supabase filtradas por `business_id` |
| Precio final | Server (`order-validation` + RPC) |
| Histórico pedido | Snapshots en `order_items` |
| Stock | `products.stock` + `stock_movements` |

---

## 7. Flujo end-to-end

1. Owner configura secciones/opciones/asignaciones/plus en admin.  
2. Persistencia multi-tenant en Supabase.  
3. Público lee corpus solo si flag on + RLS pública.  
4. Modal aplica config efectiva (assignments + overrides + upsell).  
5. Cliente arma payload de selección.  
6. Carrito muestra parent + líneas adicionales.  
7. Checkout envía payload a `create_order`.  
8. Server revalida config, precios, stock.  
9. Inserta order + items con snapshots.  
10. Decrementa stock tracked (product + upsell).  
11. Dashboard opera el pedido.  
12. Cancel → restock idempotente si hay ledger.

---

## 8. Rutas

| Ruta | Rol |
|------|-----|
| `/admin/products/customizations` | Builder admin |
| `/admin/products/customizations?product=<id>` | Compat focus producto / excepciones |
| `/b/[slug]/catalogo` | Catálogo + modal |
| `/b/[slug]/checkout` | Checkout (validación server) |

---

## 9. Componentes principales

| Pieza | Ubicación |
|-------|-----------|
| Page | `app/admin/(protected)/products/customizations/page.tsx` |
| Actions | `app/admin/(protected)/products/customizations/actions.ts` |
| Builder | `components/admin/product-customization/owner-customization-builder.tsx` |
| Preview | `admin-customization-live-preview.tsx` |
| Preview mapper | `lib/product-customization/admin-preview-mapper.ts` (`resolveAdminEffectivePreviewConfig`) |
| Assignments | `assignments/*`, `customization-assignments-section.tsx` |
| Excepciones | `product-customization-overrides-panel.tsx` |
| Secciones | `reusable-sections/*` |
| Plus | `plus-suggestions/*` |
| Menús a11y | `reusable-sections/actions-menu.tsx` |
| Público | `lib/product-customization/public.ts` + componentes catálogo |
| Order validation | `lib/product-customization/order-validation.ts` |

---

## 10. Modelo de datos

Tenant key universal: **`business_id`**.

### `customization_groups`
Secciones reutilizables. Campos clave: `name`, `description`, `selection_type`, `is_required`, `min_selections`, `max_selections`, `is_available`, `sort_order`.

### `customization_options`
Opciones de una sección. `price_delta`, `is_available`, `sort_order`, FK compuesta a group+business.

### `customization_group_assignments`
Asignación polimórfica `target_type` ∈ {`category`,`product`} + `target_id`. `is_enabled`, `sort_order`. Delete de fila = unassign (no borra group/options).

### `product_customization_overrides`
Excepciones por producto. `override_type` ∈ {`group`,`option`}. `is_enabled=false` = ocultar solo en ese producto.

### `upsell_groups` / `upsell_group_items`
Plus sugeridos: un grupo por target (`product`|`category`), items → `products`.

### `order_items` (extensiones)
`customization_snapshot` jsonb · `parent_order_item_id` · `item_kind` (`product`|`upsell`) · `product_name` / `unit_price` snapshots.

### `stock_movements`
Ledger idempotente (`order_decrement` / `order_restock`).

### Flag
`business_settings.product_customization_enabled` (default false).

Migración base: `supabase/migrations/20260712090000_product_customization_v1_schema.sql` (+ hardening RLS pública, order, stock).

---

## 11. RLS y seguridad multi-tenant

| Capa | Contrato |
|------|----------|
| Admin RLS | `business_id` = profile del `auth.uid()` (patrón estándar OrderOps) |
| Público RLS | Lectura solo si flag on + entidades available; hardening `20260717170000_product_customization_public_rls_hardening_1.sql` |
| Super-admin | Bypass documentado; no usar en paths tenant normales |

RLS ≠ permiso de app ≠ validaciones de action: las tres capas se aplican en serie.

---

## 12. Permisos de aplicación

| Aspecto | Valor |
|---------|-------|
| Auth | Sesión admin requerida |
| Permiso writes | `requireAdminPermission("manageProducts")` |
| Roles típicos | owner/manager con manageProducts; operator/viewer según matriz `lib/admin/permissions.ts` |
| Ownership | Actions validan pertenencia `business_id` + target/group |

---

## 13. Server actions

Archivo: `app/admin/(protected)/products/customizations/actions.ts`  
Todas: `manageProducts` + `revalidateCustomizationPaths()`.

| Action | Propósito | Entidad | Riesgo |
|--------|-----------|---------|--------|
| `createCustomizationGroupAction` | Crear sección | groups | Bajo |
| `updateCustomizationGroupAction` | Editar sección | groups | Medio |
| `toggleCustomizationGroupAvailabilityAction` | Ocultar/mostrar sección | groups | Medio |
| `createCustomizationOptionAction` | Crear opción | options | Bajo |
| `updateCustomizationOptionAction` | Editar opción | options | Medio |
| `toggleCustomizationOptionAvailabilityAction` | Ocultar/mostrar opción | options | Medio |
| `createCustomizationGroupAssignmentAction` | Asignar sección | assignments | Medio |
| `updateCustomizationGroupAssignmentAction` | Actualizar assignment | assignments | Medio |
| `toggleCustomizationGroupAssignmentAction` | Ocultar/mostrar assignment | assignments | Medio |
| `removeCustomizationGroupAssignmentAction` | Quitar assignment | assignments | Alto (confirm UI) |
| `reorderCustomizationGroupsAction` | Reordenar secciones | groups | Bajo |
| `reorderCustomizationOptionsAction` | Reordenar opciones | options | Bajo |
| `reorderCustomizationAssignmentsAction` | Reordenar assignments | assignments | Bajo |
| `disableProductCustomizationGroupOverrideAction` | Ocultar sección en producto | overrides | Medio |
| `restoreProductCustomizationGroupOverrideAction` | Restaurar sección | overrides | Medio |
| `disableProductCustomizationOptionOverrideAction` | Ocultar opción en producto | overrides | Medio |
| `restoreProductCustomizationOptionOverrideAction` | Restaurar opción | overrides | Medio |
| `createUpsellGroupAction` | Crear plus | upsell_groups | Medio |
| `updateUpsellGroupAction` | Editar plus | upsell_groups | Medio |
| `toggleUpsellGroupAction` | Ocultar/mostrar plus | upsell_groups | Medio |
| `addUpsellGroupItemAction` | Agregar producto sugerido | upsell_group_items | Medio |
| `updateUpsellGroupItemAction` | Editar item plus | upsell_group_items | Medio |
| `toggleUpsellGroupItemAction` | Ocultar/mostrar item | upsell_group_items | Medio |
| `loadProductCustomizationInheritanceAction` | Lectura herencia | read | Bajo |

No hay delete de groups/options en el flujo compacto principal.

---

## 14. Secciones reutilizables

Tab **Secciones reutilizables**: cards compactas + ⋮ + modales (crear/editar sección, gestionar opciones). Reorden DnD + ↑/↓. Disponibilidad Visible/Oculta para clientes.

---

## 15. Opciones y reglas de selección

- `selection_type`: single | multiple  
- `is_required`, `min_selections`, `max_selections`  
- `price_delta` ≥ 0  
- Opciones no available filtradas en público/preview  
- Required con 0 opciones → grupo bloqueado (`isBlocked`)

---

## 16. Assignments por producto

Tab **Por producto** → secciones propias (`target_type=product`). Cards compactas, modal Agregar, menú Ocultar/Quitar.

---

## 17. Assignments por categoría

Tab **Por categoría** → assignments directas de categoría. Empty state aclara “sin secciones asignadas directamente” y apunta a ajustes en Por producto.

---

## 18. Herencia efectiva

Orden verificado en `admin-preview-mapper.ts` / `public.ts`:

1. Assignments enabled de **categoría** del producto  
2. Assignments enabled de **producto** (ganan si mismo `group_id`)  
3. Overrides producto con `is_enabled=false` ocultan group/option  
4. Filtro `group.is_available` / `option.is_available`  
5. Sort por `assignment.sort_order` luego `created_at`

Upsell: match product-specific, luego category (mapper preview).

---

## 19. Excepciones por producto

Panel **Ajustes propios de este producto** (embed al seleccionar; `?product=` compat). Actions disable/restore group|option. No mutan categoría ni assignments.

---

## 20. Visibilidad versus quitar asignación

| Operación | Efecto |
|-----------|--------|
| Ocultar assignment | `is_enabled=false` — relación se conserva |
| Quitar assignment | DELETE fila assignment — group/options intactos |
| Ocultar sección reutilizable | `groups.is_available=false` — distinta |
| Override producto | Oculta solo en ese producto |

`removeCustomizationGroupAssignmentAction`: ownership + idempotente + revalidate.

---

## 21. Plus sugeridos

Tab **Plus sugeridos**: grupo Bebidas → Coca Cola 500ml sobre Doble Smash (piloto). Items son productos reales del catálogo; en pedido → `item_kind=upsell` + parent.

---

## 22. Vista previa admin

- Componente: `AdminCustomizationLivePreview`  
- Resolver: `resolveAdminEffectivePreviewConfig`  
- Sandbox local: selección/total estimado  
- CTA **disabled** — no agrega al carrito ni crea pedidos  
- Respeta overrides del producto seleccionado  

---

## 23. Catálogo público

`/b/[slug]/catalogo` carga corpus customization solo con flag on. Precios “Desde” / modal según config efectiva.

---

## 24. Modal público del producto

Grupos efectivos + plus. Validación cliente UX; **precio final no autoritativo**.

---

## 25. Carrito

Conserva línea parent + adicionales (upsell) con qty sincronizada al parent (norma CART-1 / order-validation).

---

## 26. Checkout y validación server-side

Checkout → RPC `create_order`. Server:

- Relee config pública efectiva  
- Valida selección (required/min/max/allowed options)  
- Valida upsells permitidos  
- Calcula `finalUnitPrice`  
- Rechaza payload manipulado  

---

## 27. Pricing

```txt
finalUnitPrice = baseUnitPrice + Σ price_delta opciones seleccionadas
```

Upsells: precio de producto adicional (línea propia). Cliente nunca fija precio final.

---

## 28. Snapshot del pedido

`customization_snapshot` en items `product`. Upsells: `item_kind=upsell`, `parent_order_item_id`, snapshot null típico. `product_name` / `unit_price` congelados.

---

## 29. Stock y ledger

- Decrement en `create_order` solo `track_stock=true` (product + upsell agregados por `product_id`)  
- Lock `FOR UPDATE`, error `INSUFFICIENT_STOCK`  
- Movimientos `order_decrement` en `stock_movements` (idempotencia)  
- Items históricos sin ledger no reciben restock automático  

---

## 30. Cancelación y restock

Cancel vía `transition_order_status` / wiring admin → `order_restock` idempotente. Pedidos pre-ledger: sin restock automático (por diseño).

---

## 31. UX admin final

| Tab | Propósito |
|-----|-----------|
| Por producto | Selector, resumen, assignments propias, herencia, excepciones, preview |
| Por categoría | Assignments en lote; empty states no ciegos |
| Secciones reutilizables | CRUD compacto de secciones/opciones |
| Plus sugeridos | Relaciones de adicionales |

---

## 32. Responsive

- Shell scoped `:has(.admin-page-layout--customizations-mobile)` pad 12px ≤719  
- Tabs scroll + snap; cards/chips wrap; dialogs `min(100%-24px)`  
- Breakpoints QA: 390 / 768 / 1440 (handoff) + 414 / 1024 (fases previas)  
- Sin overflow horizontal en smoke final  

---

## 33. Accesibilidad

- `ActionsMenu`: montaje condicional; menuitems **0** si cerrado  
- Triggers: `aria-haspopup`, `aria-expanded`, labels “Más acciones para …”  
- Escape / click fuera / foco al trigger  
- Confirm remove: labelledby + describedby  
- ⋮ ~40×40 mobile; DnD handle ~32px con ↑/↓ accesibles  

---

## 34. Copy owner-facing

Owner-facing: Vista previa, Ocultar/Mostrar para clientes, Ajustes propios, Quitar de este producto/categoría. Sin “Desactivar” / “Preview” EN en UI principal.

---

## 35. Estados vacíos y feedback

Empty states por tab. Feedback vía `admin-feedback` + refresh; toast rico aún deuda P2 menor.

---

## 36. Caso piloto validado

| Campo | Valor |
|-------|-------|
| Negocio | La Burguesía |
| Slug | demohamburgueseria |
| Producto | Doble Smash |
| Secciones | Papas, Salsas, Agregados extra |
| Plus | Sumá una bebida → Coca Cola 500ml |
| Flag | personalización activa |

---

## 37. QA ejecutado (esta fase)

**Admin (local):** 4 tabs · Doble Smash · preview · excepciones · ⋮ Escape · menuitems cerrados=0 · 390/768/1440 · light/dark · sin overflow  

**Público:** modal Papas/Salsas/Agregados/Sumá bebida/Coca · carrito parent + ADICIONAL · **sin confirmar pedido**

---

## 38. Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| Diff esta fase | **docs-only** |

---

## 39. Historial de fases

| Fase | Estado | Runtime commit | Docs commit |
|------|--------|----------------|-------------|
| Admin visual / button polish | PASS | `40366d6` / `5ea6264` | varios docs |
| Preview polish + cleanup + overrides | PASS | `2226256` / `34b0b55` / `dee486a` | docs |
| Reusable sections compact + cleanup | PASS | `a124459` / `5819460` | docs |
| Plus suggestions compact + cleanup | PASS | `a2a9b26` / `6b0e153` | docs |
| V1 Polish Monitor | NEEDS POLISH | — | docs |
| Copy polish | PASS | `40d4cd1` | `6eb74f2` |
| Hierarchy polish | PASS WITH DEBT* | `a16de09` | `5102e01` |
| Exceptions UX | PASS | `f4d5260` | `7de1194` |
| Assignments compact | PASS WITH REMOVE DEBT* | `4f6ebfe` | `b658e8d` |
| Assignments remove | PASS | `e8383e0` | `1d2ead3` |
| Responsive polish | PASS | `fa8265e` | `842705f` |
| Premium rescore | PASS WITH RESIDUAL | — | `469386b` |
| A11y polish | PASS WITH DND TOUCH DEBT | `128fac2` | `0c33d59` |
| **Final handoff** | **PASS** | — | (este commit) |

\* Deudas posteriores cerradas o mitigadas por fases siguientes.

---

## 40. Commits relevantes (cadena reciente)

```txt
128fac2 Polish Product Customization admin accessibility
fa8265e Polish Product Customization admin responsive layout
e8383e0 Add safe Product Customization assignment removal
4f6ebfe Compact Product Customization assignments UI
f4d5260 Polish Product Customization product exceptions UX
a16de09 Polish Product Customization admin hierarchy
40d4cd1 Polish Product Customization admin copy
dee486a Reflect Product Customization overrides in admin preview
2226256 Add interactive Product Customization admin preview
a124459 Compact reusable Product Customization sections
a2a9b26 Compact Product Customization plus suggestions
c76daaa Harden public Product Customization RLS
```

---

## 41. Invariantes de no regresión

1. Pricing final siempre se valida server-side.  
2. El cliente no decide el precio final.  
3. Los snapshots históricos deben preservarse.  
4. Remove assignment no elimina grupos ni opciones.  
5. Ocultar y quitar son operaciones distintas.  
6. Excepciones por producto no modifican la categoría.  
7. Plus no sustituye el producto parent.  
8. Carrito conserva parent + adicional.  
9. Checkout valida pertenencia al `business_id`.  
10. Stock solo cambia vía contratos autorizados (`create_order` / cancel restock).  
11. Cancelación no debe generar doble restock (ledger idempotente).  
12. Preview admin no crea pedidos ni muta carrito.  
13. Mutations admin requieren tenant + `manageProducts`.  
14. No acceso cross-tenant.  
15. Público ignora config no available / flag off.

---

## 42. Cambios que requieren auditoría especial

Schema · RLS · nuevos target types · pricing · stock · delete definitivo de grupos · bundles · horarios · stock por opción · kitchen/delivery · analytics · import masivo · nuevas clases de override.

---

## 43. Deuda residual aceptada

| ID | Severidad | Impacto | Workaround | Fase sugerida | Bloquea piloto |
|----|-----------|---------|------------|---------------|----------------|
| V1-DEBT-001 | P2 | DnD handle ~32px | Usar ↑/↓ | DND-TOUCH-POLISH-1 | No |
| V1-DEBT-002 | P2 | Chips densos (Mín/Máx) | Ignorar ruido | chip cleanup opcional | No |
| V1-DEBT-003 | P2 | Chips destino plus duplicados | Leer uno | plus cleanup | No |
| V1-DEBT-004 | P2 | Feedback post-save débil | Refresh | EMPTY-STATES-FINAL | No |
| V1-DEBT-005 | P3 | Tabs largos con scroll | Scroll horizontal | opcional | No |
| V1-DEBT-006 | P3 | Preview dual mount DOM | — | opcional | No |
| V1-DEBT-007 | P3 | Sin arrow-roving en menús | Tab entre items | opcional | No |

---

## 44. Riesgos conocidos

- Confusión categoría vs producto si se revierten empty states.  
- Pedidos pre-ledger sin restock.  
- Flag off oculta corpus público aunque exista data.  
- Manipulación de payload cliente — mitigada server-side.

---

## 45. Rollback

**Esta fase (docs):** revertir commit documental.  
**Runtime histórico:** revert commits de fase específica; migraciones de schema/RLS/RPC requieren plan DB separado.

---

## 46. Runbook para futuras modificaciones

1. Leer este handoff + `ORDEROPS_LIVING_MEMORY.md`.  
2. No tocar pricing/stock/RLS sin fase dedicada.  
3. UI admin: CSS modules + tokens; sin globals.  
4. Toda mutation: `business_id` server-side.  
5. Smoke: admin 4 tabs + Doble Smash público + carrito parent/adicional.  
6. No confirmar pedidos QA salvo autorización explícita.

---

## 47. Checklist para una nueva sección

1. Secciones reutilizables → Nueva sección  
2. Tipo / required / min-max  
3. Opciones + precios  
4. Visible  
5. Asignar producto o categoría  
6. Preview admin  
7. Público  
8. Pricing server (pedido real solo con autorización)

---

## 48. Checklist para una nueva asignación

1. Por producto o Por categoría  
2. Agregar sección (modal)  
3. Confirmar origen (propia / categoría)  
4. Preview + muestra pública  

---

## 49. Checklist para una excepción

1. Seleccionar producto  
2. Ajustes propios  
3. Ocultar / Volver a mostrar  
4. Preview refleja override  
5. Público refleja override  

---

## 50. Checklist para un nuevo plus sugerido

1. Plus sugeridos → crear/editar  
2. Destino product/category  
3. Productos sugeridos disponibles  
4. Preview + público + carrito parent/adicional  

---

## 51. Checklist de QA público

- [ ] Catálogo carga  
- [ ] Modal Doble Smash  
- [ ] Papas / Salsas / Agregados  
- [ ] Sumá una bebida / Coca  
- [ ] Total cambia  
- [ ] Agregar al carrito  
- [ ] Parent + ADICIONAL  
- [ ] No confirmar pedido  

---

## 52. Condiciones de cierre

- Score 4.3/5 · P0=0 · P1=0  
- Admin + público smoke PASS  
- tsc/build PASS  
- Handoff autónomo publicado  
- Diff docs-only  

---

## 53. Resultado final

**PASS** — Product Customization Admin V1 cerrado como **premium-ready para piloto**.

---

## 54. Próximas ampliaciones posibles

Ninguna fase de implementación obligatoria.

Opcionales:

1. `PRODUCT-CUSTOMIZATION-ADMIN-DND-TOUCH-POLISH-1`  
2. `PRODUCT-CUSTOMIZATION-PILOT-MONITOR-3` (operativo)  
3. Micro-polish chips / save feedback  

No iniciar PILOT-MONITOR-3 dentro de este handoff.
