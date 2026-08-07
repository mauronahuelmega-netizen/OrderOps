# PRODUCT-CUSTOMIZATION-V1-HANDOFF-1 — Final Handoff & V1 Closure

## 1. Resumen ejecutivo

**Product Customization V1** queda cerrado como **PASS WITH DEBT**.

El sistema permite:

- configurar opcionales / extras / plus en admin;
- exponerlos detrás de `product_customization_enabled`;
- personalizar en catálogo (modal lazy + “Desde $X”);
- persistir carrito V2 con signature;
- crear pedidos con validación server-side;
- guardar `customization_snapshot` en `order_items` parent;
- asociar upsell como child rows (`item_kind='upsell'`, `parent_order_item_id`);
- renderizar customizations en dashboard (workspace Productos).

**El flag permanece apagado por defecto** (`false`).  
**El rollout debe ser controlado por tenant** (activar un negocio a la vez, con rollback SQL listo).

Deuda restante: principalmente QA/UI (smoke checkout browser completo) y mejoras V1.1 — **no es bloqueo estructural del modelo**.

**Fecha handoff:** 2026-07-14  
**Proyecto remoto de referencia:** `pkrsedmwxekbhlohhqds`

---

## 2. Estado final

| Área | Estado |
|------|--------|
| DB schema | PASS WITH DEBT |
| Feature flag | PASS |
| Admin groups/options | PASS |
| Assignments/overrides/upsell | PASS WITH DEBT |
| DnD admin | PASS WITH DEBT |
| Catalog modal | PASS WITH DEBT |
| Cart V2 | PASS WITH DEBT |
| Order/RPC | PASS WITH DEBT |
| Dashboard render | PASS WITH DEBT |
| E2E runtime | PASS WITH DEBT |
| **Handoff V1** | **PASS WITH DEBT** |

| Runtime | Valor |
|---------|--------|
| Flag `demohamburgueseria` | **false** (cleanup E2E `2026-07-14 02:48:55 UTC`) |
| RPC `create_order` ORDER-1 | Aplicada (markers snapshot/parent/item_kind) |
| Pedido V2 evidencia | `d3e5c903-d174-4d35-8c15-a9bfc5a88e6f` (`#8E6F`) |

---

## 3. Alcance V1 completado

- grupos reutilizables;
- opciones con `price_delta` (≥ 0);
- assignments categoría / producto;
- overrides por producto (disable grupo/opción);
- upsell/plus sugerido (producto real del catálogo);
- `sort_order` visual + DnD admin (grupos/opciones/assignments);
- feature flag por negocio;
- “Desde $X” en catálogo;
- modal lazy-loaded;
- required / min / max;
- total visual en modal;
- `LocalCartItemV2` + `configurationSignature`;
- dedup por configuración;
- display jerárquico de carrito;
- edit from cart;
- checkout V2 (legacy + customized);
- validación server-side (`validateCheckoutCartForCreateOrder`);
- snapshot JSONB v1;
- upsell child row;
- dashboard render (summary + Plus indentado).

---

## 4. Fuera de alcance V1

- manual order customization (admin);
- stock por opción;
- quantity por extra;
- text fields libres;
- descuentos / `price_delta` negativo;
- templates verticales;
- analytics de customizations;
- UI admin para toggle del flag;
- card compacta del dashboard con jerarquía completa (solo `item_summary` plano);
- DnD de upsell items;
- keyboard/touch DnD avanzado;
- checkout browser automation E2E completo (deuda E2E-QA-1).

---

## 5. Fases ejecutadas

| Fase | Resultado | Documento |
|------|-----------|-----------|
| PRODUCT-CUSTOMIZATION-AUDIT-1 | PASS | `docs/product-customization-audit-1-options-extras-upsell-architecture.md` |
| PRODUCT-CUSTOMIZATION-SPEC-1 | PASS | `docs/product-customization-spec-1-final-product-technical-spec.md` |
| PRODUCT-CUSTOMIZATION-DB-1 | PASS WITH DEBT | `docs/product-customization-db-1-schema-rls-types.md` |
| PRODUCT-CUSTOMIZATION-FLAG-1 | PASS | `docs/product-customization-flag-1-tenant-rollout-guard.md` |
| PRODUCT-CUSTOMIZATION-DB-APPLY-1 | PASS WITH DEBT | `docs/product-customization-db-apply-1-staging-migration-schema-smoke.md` |
| PRODUCT-CUSTOMIZATION-ADMIN-1 | PASS | `docs/product-customization-admin-1-groups-options-admin.md` |
| PRODUCT-CUSTOMIZATION-ADMIN-2 | PASS WITH DEBT | `docs/product-customization-admin-2-assignments-overrides-upsell.md` |
| PRODUCT-CUSTOMIZATION-ADMIN-2-QA | PASS WITH DEBT | `docs/product-customization-admin-2-qa-authenticated-browser-smoke.md` |
| PRODUCT-CUSTOMIZATION-ADMIN-DND-1 | PASS WITH DEBT | `docs/product-customization-admin-dnd-1-sortable-groups-options.md` |
| PRODUCT-CUSTOMIZATION-CATALOG-1 | PASS WITH DEBT | `docs/product-customization-catalog-1-public-customization-modal.md` |
| PRODUCT-CUSTOMIZATION-CART-1 | PASS WITH DEBT | `docs/product-customization-cart-1-cart-signature-pricing-display.md` |
| PRODUCT-CUSTOMIZATION-ORDER-1 | PASS WITH DEBT | `docs/product-customization-order-1-rpc-server-validation-snapshot.md` |
| PRODUCT-CUSTOMIZATION-ORDER-1-DB-APPLY-QA | PASS WITH DEBT | `docs/product-customization-order-1-db-apply-qa-runtime-smoke.md` |
| PRODUCT-CUSTOMIZATION-DASHBOARD-1 | PASS WITH DEBT | `docs/product-customization-dashboard-1-render-snapshot-upsell-children.md` |
| PRODUCT-CUSTOMIZATION-E2E-QA-1 | PASS WITH DEBT | `docs/product-customization-e2e-qa-1-flag-on-full-runtime-smoke.md` |
| PRODUCT-CUSTOMIZATION-V1-HANDOFF-1 | PASS WITH DEBT | este documento |

Todos los documentos de fase listados **existen** en el repo al momento del handoff.

---

## 6. Arquitectura final

```txt
Admin config (/admin/products/customizations + overrides en edit product)
        ↓
Public read model (lib/product-customization/public.ts, flag-gated)
        ↓
Catalog summary / “Desde $X”
        ↓
Lazy CustomizationModal
        ↓
Cart V2 (orderops-cart-v2 + signature)
        ↓
Checkout server action (legacy + customizedItems)
        ↓
validateCheckoutCartForCreateOrder (server-only)
        ↓
create_order RPC (ORDER-1)
        ↓
order_items: snapshot parent + upsell children
        ↓
Dashboard parse/tree + workspace Productos render
```

**Principios:** multi-tenant por `business_id`; fail-closed en flag; precios server-side; snapshot histórico; legacy intacto.

---

## 7. Feature flag y rollout

| Item | Valor |
|------|--------|
| Columna | `business_settings.product_customization_enabled` |
| Default | `false` |
| Comportamiento | Fail-closed: sin flag → catálogo/cart legacy; V2 checkout debe rechazarse |
| Rollout | Tenant por tenant |

### Verificar

```sql
select
  b.slug,
  bs.product_customization_enabled,
  bs.updated_at
from business_settings bs
join businesses b on b.id = bs.business_id
where b.slug = '<business_slug>';
```

### Activación controlada (solo con autorización)

```sql
update business_settings bs
set product_customization_enabled = true,
    updated_at = now()
from businesses b
where b.id = bs.business_id
  and b.slug = '<business_slug>';
```

### Rollback

```sql
update business_settings bs
set product_customization_enabled = false,
    updated_at = now()
from businesses b
where b.id = bs.business_id
  and b.slug = '<business_slug>';
```

**Helper:** `isProductCustomizationEnabled` en `lib/product-customization/flags.ts`.

---

## 8. Modelo de datos

### Tablas / columnas V1

| Artefacto | Rol |
|-----------|-----|
| `customization_groups` | Grupos reutilizables |
| `customization_options` | Opciones + `price_delta` |
| `customization_group_assignments` | Target categoría/producto |
| `product_customization_overrides` | Disable por producto |
| `upsell_groups` / `upsell_group_items` | Plus sugerido |
| `business_settings.product_customization_enabled` | Flag |
| `order_items.customization_snapshot` | JSONB histórico (parent) |
| `order_items.parent_order_item_id` | FK hijo → padre |
| `order_items.item_kind` | `'product'` \| `'upsell'` |

### Reglas

- snapshot **solo** en parent product;
- upsell = child row (`item_kind='upsell'`, snapshot null);
- legacy: snapshot null; `item_kind` null/product tratado como product;
- RLS por `business_id` (ver migración DB-1).

### Migraciones

- `supabase/migrations/20260712090000_product_customization_v1_schema.sql`
- `supabase/migrations/20260713030000_product_customization_order_1_create_order_snapshot.sql`

---

## 9. Admin customization

| Item | Detalle |
|------|---------|
| Ruta | `/admin/products/customizations` |
| Actions | `app/admin/(protected)/products/customizations/actions.ts` |
| UI | `components/admin/product-customization/*` |
| Lib | `lib/product-customization/admin.ts`, `shared.ts` |
| Overrides | panel en `edit-product-form` |

Incluye: groups/options CRUD, assignments, overrides, upsell (máx. 1 grupo por target), sort_order, DnD HTML5 + ↑/↓.

**Deudas admin:** touch/keyboard DnD avanzado; upsell items DnD fuera de scope; unique upsell = 1 fila/target.

---

## 10. Catálogo público

| Item | Detalle |
|------|---------|
| Summaries SSR | `getPublicCustomizationSummariesForProducts` |
| Config modal | `getPublicProductCustomizationConfig` + `catalogo/actions.ts` |
| Campos summary | `hasCustomizations`, `hasPaidCustomizations`, `hasUpsell`, `priceFrom` |
| UI | product-card / product-detail / catalog-client |

Con flag off: comportamiento legacy (sin intercept modal, sin “Desde”).

Helpers cliente: `public-shared.ts` (`productNeedsCustomizationModal`, `shouldShowPriceFrom`, etc.).

---

## 11. Modal de personalización

| Item | Detalle |
|------|---------|
| Componente | `components/public/catalog/customization-modal.tsx` (+ module CSS) |
| Carga | Lazy desde catálogo |
| Draft | `PublicCustomizationSelectionDraft` |
| Validación UI | required/min/max + total visual + price_delta |
| Upsell | sección “También podés sumar” |
| Edit | `initialSelection` desde cart V2 |

---

## 12. Carrito V2

| Item | Detalle |
|------|---------|
| Storage | `orderops-cart-v2:{businessId}` (+ legacy `orderops-cart:`) |
| Tipo | `LocalCartItemV2` (`lib/cart/types.ts`) |
| Signature | `lib/cart/signature.ts` → `configurationSignature` |
| Persistencia | `lib/cart/local.ts` (dedup, parent/children, qty sync upsell) |
| UI | `cart-sheet.tsx`, `cart-bar.tsx` |
| Post-success | dual clear legacy + V2 |

---

## 13. Checkout y validación server-side

| Item | Detalle |
|------|---------|
| Client | `checkout-client.tsx` — payload `legacyItems` + `customizedItems` |
| Action | `app/b/[slug]/checkout/actions.ts` |
| Validation | `validateCheckoutCartForCreateOrder` (`order-validation.ts`, server-only) |

Validaciones: flag on para V2; ownership/availability; required/min/max; signature; upsell permitido; precios recalculados server-side; fail-closed; no confiar en nombres/deltas del cliente.

---

## 14. RPC `create_order`

| Item | Detalle |
|------|---------|
| Migración | `20260713030000_product_customization_order_1_create_order_snapshot.sql` |
| Remoto | Aplicada en `pkrsedmwxekbhlohhqds` (ORDER-1-DB-APPLY-QA) |
| Compat | Legacy `[{product_id, quantity}]` intacto |
| V2 | parent + children via `client_line_id` / `parent_client_line_id` |

**Componente crítico:** no modificar sin fase dedicada + autorización producción.

---

## 15. Snapshots y order_items

Forma v1 (server-generated):

```json
{
  "version": 1,
  "source": "public_checkout",
  "configuration_signature": "product:...",
  "product": { "id": "...", "name": "..." },
  "groups": [],
  "pricing": {
    "base_unit_price": 0,
    "customization_total": 0,
    "final_unit_price": 0
  },
  "summary": []
}
```

- dashboard **no** recalcula precios;
- snapshot es histórico (cambios futuros de opciones no alteran pedidos viejos);
- builders: `order-snapshot.ts`.

---

## 16. Upsell como child row

| Campo | Valor esperado |
|-------|----------------|
| `item_kind` | `'upsell'` |
| `parent_order_item_id` | id del parent product |
| `customization_snapshot` | null |
| `unit_price` | precio server-side del producto |
| `quantity` | sincronizada con parent (CART-1 / ORDER-1) |

---

## 17. Dashboard rendering

| Helper | Archivo |
|--------|---------|
| `parseCustomizationSnapshot` | `lib/product-customization/order-dashboard.ts` |
| `getCustomizationSummaryLines` | idem |
| `buildDashboardOrderItemTree` | idem |

Selects read-only (`lib/orders/admin.ts`) incluyen `item_kind`, `parent_order_item_id`, `customization_snapshot`.

UI: `order-products-list.tsx`, `order-product-modal.tsx`, CSS en `order-items.module.css` / `order-detail-surfaces.module.css`.

Orphan upsell → badge Plus standalone. Legacy sin snapshot → vista previa.

**Card compacta:** sigue con `item_summary` plano; jerarquía completa en panel Productos del workspace.

---

## 18. Compatibilidad legacy

- productos base / add-to-cart plano;
- checkout legacy;
- pedido manual admin (sin customization en V1);
- dashboard legacy;
- `order_items` snapshot null;
- storage cart legacy separado.

Evidencia: pedido `#2C00` QA Legacy (`1x Clásica`) intacto durante E2E.

---

## 19. Seguridad y validaciones

- no confiar en cliente para precios/nombres;
- `business_id` desde contexto server;
- flag validation fail-closed;
- availability de grupos/opciones/productos;
- required/min/max server-side;
- upsell must be permitted for product/category;
- ownership cross-tenant bloqueado;
- sin pedido parcial esperado si falla validación.

---

## 20. QA ejecutado

| Capacidad | Evidencia |
|-----------|-----------|
| CLI tsc/build | Múltiples fases + handoff |
| Admin browser | ADMIN-2-QA |
| Catalog flag-off | CATALOG-1 / CART-1 baseline |
| Catalog flag-on “Desde” | E2E-QA-1 |
| ORDER-1 apply + legacy RPC | ORDER-1-DB-APPLY-QA |
| Pedido V2 SQL + dashboard | E2E-QA-1 |
| Flag cleanup | E2E-QA-1 |

---

## 21. Evidencia runtime

| Campo | Valor |
|-------|--------|
| Order V2 | `d3e5c903-d174-4d35-8c15-a9bfc5a88e6f` |
| Code | `#8E6F` |
| Cliente | QA Customization E2E / 1100000000 |
| Parent | BBQ Bacon — `unit_price` **13750** — snapshot **v1** |
| Child | Coca Cola 500ml upsell — `parent_order_item_id` → parent — `unit_price` **3000** |
| Total | **16750** |
| Dashboard | summary + Plus indentado |
| Canal creación | RPC `create_order` autorizado (no browser checkout UI) |
| Flag final | **false** at `2026-07-14 02:48:55 UTC` |
| Legacy smoke | `#2C00` QA Legacy |

---

## 22. Deudas aceptadas

| ID | Deuda | Prioridad |
|----|-------|-----------|
| D1 | Flujo browser catálogo→modal→cart→checkout no automatizado completo | **P1** |
| D2 | Server-action validation path completo pendiente de smoke UI/manual | **P1** |
| D3 | Dashboard card compacta = `item_summary` plano; jerarquía en workspace | **P2** |
| D4 | Historial remoto migraciones Supabase / reconcile CLI | **P2** |
| D5 | ESLint 9 circular JSON (DEVX) si aplica | **P3** |
| D6 | DnD touch/keyboard avanzado | **P3** |
| D7 | Upsell items DnD fuera de scope | **P3** |
| D8 | Manual order customization → V1.1 | **P2** |

**Antes de cliente real:** cerrar D1/D2 con smoke UI manual (`CHECKOUT-UI-SMOKE-1`).

---

## 23. Riesgos conocidos

- activar flag sin configuración útil ≈ UX “Vacío / sin extras”;
- config incompleta (required) puede fallar validación en checkout;
- V2 depende de `create_order` evolucionado en el remoto;
- precios en UI son visuales — server es verdad;
- rollback principal = apagar flag (no borrar pedidos);
- no activar en hora pico sin smoke previo.

---

## 24. Checklist de rollout controlado

### Antes de activar

- [ ] Confirmar `tsc` / `build` PASS.
- [ ] Confirmar markers `create_order` (snapshot/parent/item_kind).
- [ ] Confirmar flag actual `false`.
- [ ] Confirmar grupos/opciones disponibles.
- [ ] Confirmar assignments correctos.
- [ ] Confirmar producto configurable visible.
- [ ] Confirmar upsell opcional si aplica.
- [ ] Smoke catálogo + modal + cart + checkout.
- [ ] Tener SQL rollback listo.

### Activación

- [ ] Activar flag para **un solo** tenant.
- [ ] Probar catálogo (“Desde”).
- [ ] Probar modal.
- [ ] Probar cart V2.
- [ ] Probar checkout.
- [ ] Confirmar `order_items` (parent/child).
- [ ] Confirmar dashboard.

### Después de activar

- [ ] Monitorear errores / logs.
- [ ] Monitorear pedidos.
- [ ] Confirmar operadores ven resumen.
- [ ] Confirmar no hay pedidos parciales.

---

## 25. Checklist de rollback

- [ ] Apagar `product_customization_enabled`.
- [ ] Confirmar flag `false` por SELECT.
- [ ] Limpiar localStorage `orderops-cart` / `orderops-cart-v2` en browsers QA.
- [ ] Dejar datos admin intactos (no borrar grupos).
- [ ] No borrar pedidos creados.
- [ ] Documentar hora y motivo.

---

## 26. Operación post-rollout

1. Activar primero en negocio demo.  
2. Luego un negocio piloto.  
3. Monitorear checkout y dashboard operadores.  
4. Evitar activación en hora pico.  
5. Mantener rollback SQL listo.  
6. No deploy paralelo innecesario del módulo (ya está en código; solo flag).

---

## 27. Roadmap V1.1

| Fase propuesta | Objetivo |
|----------------|----------|
| PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1 | Validación browser checkout manual (cerrar D1/D2) |
| PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 | Activación controlada negocio piloto |
| PRODUCT-CUSTOMIZATION-MANUAL-ORDER-1 | Customization en pedido manual admin |
| PRODUCT-CUSTOMIZATION-DASHBOARD-COMPACT-1 | Resumen jerárquico en card |
| PRODUCT-CUSTOMIZATION-UPSELL-DND-1 | Sortable upsell items |
| PRODUCT-CUSTOMIZATION-ROLLOUT-UI-1 | Toggle flag en admin |
| PRODUCT-CUSTOMIZATION-DEVX-MIGRATIONS-1 | Reconcile historial migraciones |
| PRODUCT-CUSTOMIZATION-ANALYTICS-1 | Attach rate extras/upsell |

---

## 28. Archivos principales

### Admin

- `app/admin/(protected)/products/customizations/page.tsx`
- `app/admin/(protected)/products/customizations/actions.ts`
- `components/admin/product-customization/*`
- `components/admin/products/edit-product-form.tsx`
- `components/admin/products/products-header-actions.tsx`
- `components/admin/admin-nav-config.ts`
- `lib/product-customization/admin.ts`
- `lib/product-customization/shared.ts`

### Catalog

- `app/b/[slug]/catalogo/actions.ts`
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/public-catalog-page.tsx`
- `components/public/catalog/product-card.tsx`
- `components/public/catalog/product-detail-modal.tsx`
- `components/public/catalog/customization-modal.tsx`
- `lib/product-customization/public.ts`
- `lib/product-customization/public-shared.ts`
- `lib/catalog/public.ts` (wiring summaries)

### Cart

- `lib/cart/types.ts`
- `lib/cart/signature.ts`
- `lib/cart/local.ts`
- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/cart-bar.tsx`

### Checkout / order

- `app/b/[slug]/checkout/actions.ts`
- `components/public/checkout/checkout-client.tsx`
- `lib/product-customization/order-validation.ts`
- `lib/product-customization/order-types.ts`
- `lib/product-customization/order-snapshot.ts`
- `lib/product-customization/flags.ts`

### Dashboard

- `lib/product-customization/order-dashboard.ts`
- `lib/orders/admin.ts`
- `components/admin/orders/order-products-list.tsx`
- `components/admin/orders/order-product-modal.tsx`
- `components/admin/orders/order-items-section.tsx`
- `components/admin/orders/order-items.module.css`
- `components/admin/orders/order-detail-surfaces.module.css`

### DB / types

- `supabase/migrations/20260712090000_product_customization_v1_schema.sql`
- `supabase/migrations/20260713030000_product_customization_order_1_create_order_snapshot.sql`
- `types/database.ts`

### Docs

- Todos los `docs/product-customization-*.md` listados en §5 + este handoff.

---

## 29. Qué NO se debe tocar sin nueva fase

- `create_order` (RPC / migración);
- `order-validation.ts`;
- cart V2 schema / signature;
- feature flag semantics (fail-closed);
- shape snapshot v1;
- modelo parent/child `order_items`;
- `order-dashboard` hierarchy parser;
- DB schema / RLS;
- deploy sin checklist de rollout.

---

## 30. Resultado final

**Product Customization V1 queda cerrado como PASS WITH DEBT.**

El flujo core está implementado y validado con pedido V2 real (`#8E6F`) vía RPC autorizado, SQL assert (parent snapshot + upsell child) y dashboard render. La deuda restante es principalmente QA/UI manual y mejoras V1.1, **no un bloqueo estructural**.

Flag demo: **off**. Rollout: **opt-in por tenant**.

---

## 31. Próxima fase recomendada

**Opción A (preferida):** `PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1`  
— cerrar D1/D2 con validación browser checkout antes de cliente real.

**Opción B:** `PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1`  
— solo si se acepta smoke UI/manual ya hecho fuera de agente.

**Opción C:** volver al roadmap principal Outside Product Customization.

**Recomendación:** **PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1**.

No hay fase funcional activa hasta nueva autorización.
