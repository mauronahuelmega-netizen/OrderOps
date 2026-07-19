# PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 — Product & Category Hierarchy Premium Polish

## Objetivo

Mejorar la jerarquía visual, comprensión y sensación premium del admin de Product Customization en los tabs **Por producto** y **Por categoría**, sin cambiar lógica operativa.

## Contexto

Nace del diagnóstico `PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1` (**NEEDS POLISH**, Enterprise Readiness 3.1/5) y continúa después de `PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1` (**PASS**).

Confirmado desde docs previos:

- COPY-POLISH-1 ya reemplazó copy técnico owner-facing.
- Secciones reutilizables y Plus sugeridos ya están compactados.
- El monitor marcó P1 en jerarquía, densidad, categoría “sin secciones” y excepciones.
- Esta fase **no** resuelve EXCEPTIONS-UX-1, ASSIGNMENTS-COMPACT-1 ni RESPONSIVE-POLISH-1.

## Alcance

- `/admin/products/customizations`
- `/admin/products/customizations?product=<id>`
- Tabs foco: Por producto · Por categoría
- Tabs no regresión: Secciones reutilizables · Plus sugeridos · Vista previa admin
- Público smoke: `/b/demohamburgueseria/catalogo` (Doble Smash)

## Fuera de scope

- DB / schema / migrations / RLS
- Server actions
- Semántica de assignments / overrides
- Preview mapper
- Query param `?product=`
- Cart / checkout / create_order / stock
- Compactación completa de assignments
- Redesign completo de excepciones
- Responsive structural rewrite

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_HIERARCHY_POLISH_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_HIERARCHY_POLISH_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_HIERARCHY_POLISH_TO_VERCEL=yes
```

## Precheck local

- `npx tsc --noEmit` → PASS
- `npm run build` → PASS
- Working tree con docs/tmp no relacionados (no tocados)

## Auditoría inicial

| Pieza | Path |
|-------|------|
| Page header | `app/admin/(protected)/products/customizations/page.tsx` |
| Shell / tabs | `owner-customization-builder.tsx` |
| Assignments | `customization-assignments-section.tsx` |
| Excepciones | `product-customization-overrides-panel.tsx` |
| Preview | `admin-customization-live-preview.tsx` |
| CSS module | `product-customization-admin.module.css` |
| Presentation helpers (solo lectura) | `lib/product-customization/builder-presentation.ts` |

Mejorable sin tocar lógica: reordenar bloques, headers/subtítulos, summary cards con datos ya disponibles (`buildProductRows` / `buildCategoryRows`), empty states contextuales, peso visual secundario para excepciones/assignments avanzados, tokens de superficie.

## Cambios implementados

### Header general

- Título: **Opciones, extras y plus**
- Descripción orientada a impacto en el cliente
- Guía breve: secciones → categoría → excepciones por producto

### Por producto

Orden visual:

1. Selector de producto
2. Summary card (Cliente verá · Aplicado desde)
3. Secciones que verá el cliente (chips de origen)
4. Ajustes propios / excepciones (bloque secundario + badge Avanzado)
5. Assignments avanzados en `<details>`
6. Vista previa del cliente (soporte)

### Excepciones del producto

- Título: **Ajustes propios de este producto**
- Badge **Avanzado**
- Helper menos intimidante
- Empty state: “Sin excepciones todavía…”
- Flujo `?product=` sin cambios

### Por categoría

- Meta de lista: “sin secciones a nivel categoría”
- Summary de impacto + aclaración de capa por producto
- Empty: **Sin secciones asignadas directamente** + CTA a Por producto
- Assignments agrupados bajo “Asignar secciones a la categoría”

### Empty states

- Sin producto seleccionado
- Producto sin secciones
- Sin excepciones
- Categoría sin secciones a nivel categoría
- Preview sin producto

### Vista previa admin

- Título/subtítulo como soporte visual
- Sin cambios de mapper / selección / total

### Consistencia visual

- Superficies, chips y headers alineados al criterio de Secciones/Plus compactos
- Sin reescritura completa de assignments

## Theme / tokens

CSS module local con tokens existentes (`--surface-*`, `--text-*`, `--border-subtle`, etc.). Sin hardcoded colors. Sin cambios globales.

## Responsive

Sin rewrite estructural. No se empeoró layout mobile existente.

## Validación local admin

- Página carga · tabs OK
- Por producto (Doble Smash): summary Papas · Salsas · Agregados extra · Plus Bebidas; preview OK
- Por categoría (HAMBURGUESAS): empty contextualizado, no contradice por producto
- Secciones / Plus intactos
- Dark + light OK
- Preview no regresión

## Validación pública

`/b/demohamburgueseria/catalogo` — Doble Smash:

- Modal: Papas / Salsas / Agregados / Sumá una bebida / Coca Cola 500ml
- Total usable · Agregar al carrito OK
- Carrito: parent Doble Smash + Adicional Coca Cola 500ml
- Sin confirmar pedido

## No side effects

Confirmado: sin migrations, schema, RLS, actions, preview mapper, cart/checkout/create_order, stock, pedidos QA, flags, cambio de `?product=`, assignments compact completo, responsive rewrite.

## Deploy

Autorizado. Commit + push a `main` documentados en CURRENT_PHASE / living memory tras deploy.

## Browser QA

Local authenticated browser smoke PASS (admin + público).

## Compatibilidad

- Dark / light OK
- Tabs compactos previos intactos
- Público sin regresión

## Qué NO se tocó

- DB / RLS / actions / mapper
- Checkout / cart / create_order / stock
- Flujo completo de excepciones
- Compactación completa de assignments
- Responsive structural

## Validaciones CLI

- `npx tsc --noEmit` → PASS
- `npm run build` → PASS
- `npm run lint` → no requerido (opcional)

## Riesgos / deuda

- Assignments siguen densos (fase ASSIGNMENTS-COMPACT-1)
- Excepciones siguen requiriendo `?product=` (fase EXCEPTIONS-UX-1)
- Responsive estructural pendiente (RESPONSIVE-POLISH-1)

## Rollback plan

Revertir commit de hierarchy polish (solo UI/CSS/copy en admin customization). Sin rollback de DB.

## Resultado final

**PASS WITH HIERARCHY DEBT**

Jerarquía principal de Por producto / Por categoría mejorada y deployable; densidad restante pertenece a fases posteriores explícitas.

## Próxima fase recomendada

1. `PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1` — excepciones sin depender del query param
2. `PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1` — compactar assignments
3. `PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1` — layout mobile estructural
