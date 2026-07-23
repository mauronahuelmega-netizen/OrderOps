# PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 — Responsive Premium Polish

## Objetivo

Pulir la experiencia responsive/mobile de `/admin/products/customizations` a estándar enterprise/premium usable en mobile: ancho útil completo, sin overflow horizontal, tabs/cards/chips/modales/menús ⋮ y preview cómodos, sin tocar lógica operativa.

## Contexto

- PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 — **NEEDS POLISH** (P1: mobile usa mal el ancho / espacio lateral vacío)
- PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 — PASS
- PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 — PASS WITH HIERARCHY DEBT
- PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 — PASS
- PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 — PASS WITH REMOVE DEBT
- PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 — PASS

## Alcance

- CSS / layout responsive scoped al módulo Product Customization
- Ajuste mínimo de shell padding vía `:has(.admin-page-layout--customizations-mobile)` (solo esta ruta)
- Docs / CURRENT_PHASE / LIVING_MEMORY / deploy

## Fuera de scope

Migrations · schema · RLS · server actions · preview mapper · público/cart/checkout/create_order/stock · flags/sesión · refactor global del admin shell · cambios de comportamiento desktop ya aprobado · lógica de assignments/exceptions

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_RESPONSIVE_POLISH_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_RESPONSIVE_POLISH_BROWSER_QA=yes
AUTORIZO_GIT_COMMIT_PRODUCT_CUSTOMIZATION_ADMIN_RESPONSIVE_POLISH=yes
AUTORIZO_GIT_PUSH_PRODUCT_CUSTOMIZATION_ADMIN_RESPONSIVE_POLISH_TO_ORIGIN_MAIN=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_RESPONSIVE_POLISH_TO_VERCEL=yes
```

## Permisos operativos

Lectura/escritura CSS/UI scoped · docs · tsc/build · browser QA local · commit · push `origin/main` · deploy Vercel vía push.

## Precheck local

`tsc PASS` · `build PASS` (baseline limpio antes de cambios).

## Auditoría inicial

| Ítem | Hallazgo |
|------|----------|
| Contenedor | `AdminPageLayout` + `OwnerCustomizationBuilder` en `/admin/products/customizations` |
| Shell padding ≤719px | `var(--space-xl) var(--space-lg)` → ~24px / 16px laterales (causa principal de vacío lateral) |
| Grid workspace | Ya colapsa a 1 columna bajo 899px |
| Tablist | Overflow-x incompleto / touch targets bajos |
| Cards | Compactas OK en desktop; mobile necesitaba width 100% + chip wrap + ⋮ ≥40px |
| Modales | Mayoría ya `min(100% - 24px, …)`; faltaba scroll interno / footer sticky / densificación |
| Preview | En mobile se apila; padding/max-height a afinar |
| Público | Fuera de scope; smoke de no regresión |

## Problemas responsive detectados

1. **Ancho útil incompleto** — padding del `admin-shell__page-container` en ≤719px dejaba márgenes laterales grandes.
2. **Tabs** — 4 tabs no cabían; necesitaban scroll horizontal usable + altura táctil.
3. **Cards/chips** — riesgo de overflow / nowrap; acciones densas.
4. **Menús ⋮** — targets &lt;40px en algunos módulos.
5. **Modales** — footer podía quedar lejos del viewport en contenido largo; max-height/scroll incompleto en assignments.

## Cambios implementados

1. `page.tsx` — `className="admin-page-layout--customizations-mobile"` en `AdminPageLayout`.
2. `admin-shell.css` — padding scoped `:has(.admin-page-layout--customizations-mobile)` → `16px 12px 32px` (tokens `--space-lg` / `--space-md`) solo ≤719px.
3. `product-customization-admin.module.css` — tabs scroll-snap + min-height 40px; densificación ≤479px; cards/preview/chips/exception actions mobile.
4. `assignments.module.css` — dialog scroll/max-height; footer sticky; menus/chips/cards mobile.
5. `reusable-sections.module.css` / `plus-suggestions.module.css` — dialogs `100% - 24px`, scroll, sticky footers, ⋮ 40px, `menuPanel` acotado a viewport.

## Layout general

- Mobile ≤719px: contenido ~366px útiles en viewport 390 (padding 12px/lado).
- ≤899px: workspace 1 columna (selector → config → preview debajo).
- Desktop ≥1024: sin cambios de comportamiento; sidebar shell intacta.

## Tabs mobile

- `overflow-x: auto` + `scroll-snap-type: x proximity`
- Tabs `min-height: 40px` / scroll-snap-align start
- Nombres de tabs sin cambios
- QA 390: tablist `scrollWidth` 526 &gt; `clientWidth` 364 → scroll usable

## Por producto

- Selector full width arriba
- Summary / assignments / excepciones full width
- Preview apilada debajo; Papas/Salsas/Agregados/Plus visibles
- Menú ⋮ asignación 40×40

## Por categoría

- Categorías + empty state legibles
- Modal “Agregar sección” 352px @390 (fits viewport); footer Cancelar/Agregar in-view

## Secciones reutilizables

- Cards ~314–340px @390, sin overflow
- OptionsManagementModal Papas: 352×583, footer Cerrar in-view, ⋮ opción 40×40

## Plus sugeridos

- Card Bebidas full width útil
- Menú plus 40×40
- Sin overflow

## Modales

| Modal | Mobile QA |
|-------|-----------|
| AssignSectionModal | width 352, footer usable |
| OptionsManagementModal | width 352, scroll/max-height, Cerrar in-view |
| Section/Plus/Suggested | CSS alineado (`min(100% - 24px)`, sticky footer) |

## Menús y acciones

- Targets ⋮ sección/opción/plus/assignment: **40×40** en mobile
- `menuPanel` con `max-width: calc(100vw - 24px)`
- Sin cambio de acciones ni permisos

## Vista previa admin

- Apilada en columna única
- Conserva “Vista previa del cliente” + CTA deshabilitado
- Sin overflow; no cambia mapper/lógica

## Theme / tokens

- Padding shell: `--space-lg` / `--space-md`
- Resto: tokens existentes de superficies/texto/borde/focus
- Sin colores hardcoded nuevos
- Dark + light validados (sin overflow)

## Breakpoints validados

| Viewport | Overflow | Notas |
|----------|----------|-------|
| 390×844 | No | pad `16px 12px 32px`, content ~366 |
| 414×896 | No | pad mobile scoped |
| 768×1024 | No | pad shell tablet `28/24` |
| 1024×768 | No | sidebar shell esperada |
| 1440×900 | No | desktop baseline |

## Validación local admin

- Login demo → `/admin/products/customizations` (+ `?product=` Doble Smash)
- 4 tabs usables · cards · chips · ⋮ · AssignSection · OptionsManagement · preview
- Light + dark: sin overflow horizontal · sin errores console críticos

## Validación pública

`/b/demohamburgueseria/catalogo` @390:

- Catálogo carga · modal Doble Smash
- Papas / Salsas / Agregados extra / Sumá una bebida / Coca Cola 500ml
- Agregar al carrito · carrito muestra Doble Smash + ADICIONAL Coca
- Sin confirmar pedido · sin overflow

## No side effects

- no migrations / schema / RLS
- no server actions
- no preview mapper
- no cart/checkout/create_order/stock
- no pedidos QA / flags / datos productivos
- no cambios semánticos de assignments/exceptions

## Deploy

- Commit: `fa8265e` — `Polish Product Customization admin responsive layout`
- Push: `origin/main` (`1d2ead3..fa8265e`)
- Prod: https://orderops.vercel.app (Vercel auto-deploy)

## Browser QA

Local authenticated admin + public smoke (ver secciones arriba). Medición CDP: `scrollWidth === clientWidth` en breakpoints listados.

## Compatibilidad

Desktop aprobado preservado; ajuste shell solo vía `:has()` en esta página.

## Qué NO se tocó

Actions · mapper · DB · RLS · catálogo público (código) · cart/checkout · stock · copy aprobado · nombres de tabs · query `?product=`

## Validaciones CLI

`npx tsc --noEmit` · `npm run build` — PASS post-cambio.

## Riesgos / deuda

- Padding lateral residual del shell global fuera de customizations sigue siendo el default en otras rutas (fuera de scope).
- Drag handles DnD permanecen ~32px (no son el menú ⋮ de acciones; no se rediseñó DnD).
- Tab labels largos siguen truncando visualmente pero son scrolleables.

## Rollback plan

Revertir commit de esta fase (CSS + className page + docs). Sin migraciones que revertir.

## Resultado final

**PASS** — Responsive admin Product Customization corregido (ancho útil, tabs, cards, chips, modales, ⋮, preview) sin lógica operativa.

## Próxima fase recomendada

Monitor premium re-score / polish residual opcional (DnD touch targets, shell global si se prioriza), o handoff V1 cerrado según backlog monitor.
