# PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 — Product Exceptions Guided UX

## Objetivo

Convertir **Excepciones del producto** en una experiencia guiada para el producto seleccionado en Por producto, sin depender de que el owner entienda `?product=`.

## Contexto

Nace de:

- `PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1` — NEEDS POLISH
- `PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1` — PASS
- `PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1` — PASS WITH HIERARCHY DEBT

Confirmado:

- Copy owner-facing ya mejorado.
- Jerarquía Por producto / Por categoría ya mejorada.
- Excepciones seguían como deuda UX (panel solo si `initialProductId === selectedProduct.id`).
- Assignments compact y responsive estructural siguen fuera de scope.

## Alcance

- `/admin/products/customizations`
- `/admin/products/customizations?product=<id>`
- Tab foco: Por producto
- Componentes: `owner-customization-builder.tsx`, `product-customization-overrides-panel.tsx`, CSS module; wiring menor en `edit-product-form.tsx` (`productName`)

## Fuera de scope

- DB / migrations / RLS
- Server actions / semántica de overrides
- Preview mapper
- Cart / checkout / create_order / stock
- Assignments compact completo
- Responsive structural rewrite
- Delete / remove / duplicate

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_EXCEPTIONS_UX_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_EXCEPTIONS_UX_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_EXCEPTIONS_UX_TO_VERCEL=yes
```

## Precheck local

- `npx tsc --noEmit` → PASS
- `npm run build` → PASS

## Auditoría inicial

| Tema | Antes |
|------|--------|
| Selección de producto | Lista en Por producto (`selectedProductId`) |
| Panel de excepciones | Solo si `initialProductId === selectedProduct.id` |
| Rol de `?product=` | Flujo principal para “abrir” excepciones |
| Actions | `disable/restore` group/option + `loadProductCustomizationInheritanceAction` (sin cambios) |
| Resumen | No existía |
| Mejora segura | Mostrar panel siempre para producto seleccionado; summary desde `isDisabledForProduct` |

## Cambios implementados

### Flujo de producto seleccionado

- El panel de ajustes propios se renderiza siempre para el producto seleccionado.
- Se eliminó el CTA “Abrir excepciones del producto” que forzaba navegación con query.
- Empty state sin producto: “Elegí un producto para revisar sus ajustes…”.

### Relación con query param product

- `?product=` sigue inicializando selección (deep link / share).
- Al seleccionar un producto, se sincroniza la URL con `history.replaceState` (sin remount RSC).
- El owner no necesita manipular ni entender el query param.

### Panel de excepciones

- Header con nombre del producto + badge Avanzado.
- Helper: “Esto no cambia la configuración de otros productos.”
- Resumen de excepciones activas.
- Stacks separados: **Secciones** / **Opciones**.
- Chips: Visible en este producto / Oculta solo aquí.
- Origen: Aplicado desde categoría / Propia de este producto.

### Resumen de excepciones

Calculado desde inheritance ya cargada:

- `0 excepciones activas` + “Usa configuración general”
- `N excepción(es) activa(s)` + “Oculto solo aquí: …”

### Estados visuales

- Visible en este producto
- Oculta solo aquí
- Aplicado desde categoría / Propia de este producto
- Sin excepciones todavía
- No hay secciones disponibles para ajustar

### Empty states

- Sin producto seleccionado
- Sin excepciones
- Sin secciones disponibles para ocultar

### Acciones owner-friendly

- “Ocultar solo en este producto”
- “Volver a mostrar en este producto”
- Sin “override” / “Desactivar” owner-facing

### Vista previa admin

- Sin cambios de mapper.
- Tras hide/restore + `router.refresh()`, preview refleja excepción (BBQ oculto/restaurado validado).

## Theme / tokens

CSS module local: surfaces muted/elevated, soft chips, exception rows/actions. Sin hardcoded de marca fuera de tokens / `color-mix`.

## Responsive

Sin rewrite estructural.

## Validación local admin

- Por producto: panel aparece al seleccionar (sin CTA query).
- Deep link `?product=` sigue inicializando.
- Resumen y acciones owner-friendly OK.
- Hide BBQ → summary “Oculto solo aquí BBQ” → preview sin BBQ → restore.
- Por categoría / Secciones / Plus: no regresión.

## Validación pública

`/b/demohamburgueseria/catalogo` — Doble Smash:

- Modal: Papas / Salsas / Agregados / Sumá una bebida / Coca / BBQ restaurado
- Sin confirmar pedido

## No side effects

Sin migrations, schema, RLS, actions, mapper, cart/checkout/stock, flags, assignments compact, responsive rewrite.

## Deploy

Autorizado. Commit + push a `main` documentados en CURRENT_PHASE.

## Browser QA

Local authenticated smoke PASS (admin + público).

## Compatibilidad

- Dark/light OK
- Edit product form sigue embebendo el panel (`productName` opcional)
- Tabs compactos intactos

## Qué NO se tocó

- Actions de override
- Preview mapper
- Assignments compact
- Responsive structural

## Validaciones CLI

- `tsc` PASS
- `build` PASS

## Riesgos / deuda

- Assignments en `<details>` siguen densos → ASSIGNMENTS-COMPACT-1
- Responsive estructural → RESPONSIVE-POLISH-1
- Tras `router.refresh()`, el query puede perderse visualmente en la barra; la selección en UI se mantiene y `replaceState` la reescribe al cambiar producto

## Rollback plan

Revertir commit de exceptions UX (solo UI). Sin rollback DB.

## Resultado final

**PASS**

## Próxima fase recomendada

1. `PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1`
2. `PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1`
