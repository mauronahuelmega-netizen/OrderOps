# PRODUCT-CUSTOMIZATION-ADMIN-UX-1 — Owner-Friendly Builder Shell

## Objetivo

Transformar `/admin/products/customizations` de un panel técnico (grupos / asignaciones / upsell) a un **builder owner-friendly** con navegación por intención de negocio, sin cambiar la lógica funcional core.

## Contexto

- Product Customization V1: **PASS WITH DEBT** (flag default `false`)
- Spec UX: `docs/product-customization-admin-ux-spec-1-owner-friendly-builder.md`
- Fase: **UX shell / reorganización de interfaz** sobre actions/DnD/forms existentes

## Scope

1. Header owner-friendly
2. Tabs: Por producto (default) · Por categoría · Secciones reutilizables · Plus sugeridos
3. Shell 3 zonas en desktop (producto)
4. Preview placeholder “Así lo verá el cliente”
5. Copy de negocio + empty states + “Avanzado”
6. Compatibilidad con forms/actions/DnD existentes
7. Documentación

## Fuera de scope

- DB / migraciones / RLS
- Checkout / cart / catálogo público / dashboard / RPC
- Activar `product_customization_enabled`
- Preview pública 100% funcional
- Wizard guiado / imágenes de opciones
- Cambiar validaciones o server actions funcionales

## Archivos creados/modificados

### Creados

- `components/admin/product-customization/owner-customization-builder.tsx`
- `components/admin/product-customization/customer-preview-panel.tsx`
- `lib/product-customization/builder-presentation.ts`
- `docs/product-customization-admin-ux-1-owner-friendly-builder-shell.md`

### Modificados

- `app/admin/(protected)/products/customizations/page.tsx`
- `components/admin/product-customization/product-customization-admin.module.css`
- `customization-assignments-section.tsx` (modes + copy)
- `create-group-form.tsx` (copy)
- `customization-group-card.tsx` (copy)
- `sortable-groups-list.tsx` (copy)
- `upsell-groups-section.tsx` (copy)
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## Nueva arquitectura visual

```txt
Header owner-friendly
Notice “Modo preparación” / “Visible para clientes”
Tabs de navegación
└─ Por producto → lista | qué puede elegir | preview
└─ Por categoría → lista categorías | assignments filtrados
└─ Secciones reutilizables → crear sección + SortableGroupsList
└─ Plus sugeridos → UpsellGroupsSection
```

Capa de presentación sobre componentes ADMIN-1/2/DnD existentes.

## Navegación / tabs

| Tab | Propósito |
|-----|-----------|
| Por producto (default) | Product-first: resumen + CTAs + preview |
| Por categoría | Assignments `target_type=category` |
| Secciones reutilizables | Groups/options |
| Plus sugeridos | Upsell |

## Vista Por producto

- Lista de productos (nombre, categoría, indicador con opciones/plus)
- Panel “Qué puede elegir el cliente” con secciones derivadas client-side
- CTAs: agregar sección, excepciones (`?product=`), plus
- Avanzado: assignments directos a producto
- Preview desktop sticky / mobile colapsable

## Vista Por categoría

- Lista de categorías + resumen de secciones
- `CustomizationAssignmentsSection` en `mode="category"`

## Vista Secciones reutilizables

- Create form (Nueva sección) + lista sortable existente

## Vista Plus sugeridos

- Misma sección funcional con copy de venta sugerida

## Lenguaje owner-friendly

| Antes | Ahora (UI) |
|-------|------------|
| Grupo | Sección |
| Asignaciones | Dónde aparecen / Agregar sección |
| Disponible | Visible para el cliente |
| Orden / sort_order | Orden de aparición (o Avanzado) |
| Upsell group | Venta sugerida / Plus sugeridos |
| Activar/Desactivar | Mostrar/Ocultar (assignments) |

## Preview del cliente

Placeholder orientativo: card producto + secciones/options + plus. Sin cart/checkout.

## Conceptos avanzados

- `sort_order` bajo details en create assignment/upsell
- Assignments producto bajo details en vista producto
- Excepciones vía panel existente con `?product=`

## Compatibilidad funcional

Actions/DnD sin cambios de contrato. Solo reubicación + copy. Sin deletes de features.

## Responsive / accesibilidad

- Desktop ≥1100px: 3 columnas en Por producto
- Mobile: tabs scroll, preview `<details>`
- Tabs `role="tab"` + `aria-selected`; focus-visible; botones con texto

## QA browser

| Check | Result |
|-------|--------|
| Load `/admin/products/customizations` sin 500 | PASS |
| Header owner-friendly | PASS |
| Tabs + default Por producto | PASS |
| Lista productos + panel + preview | PASS |
| Tab Por categoría | PASS |
| Tab Secciones (groups/options + DnD) | PASS |
| Tab Plus sugeridos | PASS (forms accesibles; smoke visual) |
| Flag notice “Modo preparación” / off | PASS |
| Acciones existentes accesibles | PASS (forms render; sin mutar QA) |

Responsive: desktop autenticado local; CSS mobile (preview colapsable) presente.

## Validaciones CLI

- `npx tsc --noEmit` → PASS (precheck + post)
- `npm run build` → PASS

## Qué NO se tocó

DB, migraciones, RLS, RPC, cart, checkout, catálogo público, dashboard, flag, storage, imágenes.

## Riesgos / deuda

1. Preview no refleja overrides de producto (solo assignments + groups cargados)
2. Formularios internos densos (cards ADMIN-1) aún mejorables; botones internos aún dicen “Activar grupo”
3. Mobile polish pendiente
4. Wizard guiado / preview real → fase futura
5. CTAs “Agregar sección” navegan a tabs; no wizard inline
6. Preview montado dos veces (desktop/mobile) en DOM

## Resultado final

**PASS WITH DEBT**

## Próxima fase recomendada

`PRODUCT-CUSTOMIZATION-ADMIN-UX-2` — densificar formularios / accordion secciones / preview más fiel  

o `PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1` para cerrar deuda P1 de V1.
