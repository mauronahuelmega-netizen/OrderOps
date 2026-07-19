# PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 — Compact Plus Suggestions UI

## Objetivo

Compactar la pestaña **Plus sugeridos** con cards de lectura, menú ⋮ y modales de edición, eliminando formularios inline extensos.

## Contexto

Spec: `PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1` — PASS.  
Actions create/update/toggle group + add/update/toggle item ya existían; no hay delete/remove ni reorder RPC.

## Alcance

- UI compacta del tab Plus sugeridos
- Modales create/edit plus y gestionar/agregar/editar productos sugeridos
- ↑↓ de ítems vía `updateUpsellGroupItemAction`
- Wiring en `owner-customization-builder`
- Docs / CURRENT_PHASE / LIVING_MEMORY

## Fuera de scope

DB · RLS · migrations · delete/remove · duplicate · crear producto · stock · cart/checkout/create_order · catálogo público · pedidos QA

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_PLUS_SUGGESTIONS_COMPACT_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_PLUS_SUGGESTIONS_COMPACT_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_PLUS_SUGGESTIONS_COMPACT_TO_VERCEL=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría inicial

| Pieza | Estado previo |
|-------|---------------|
| Tab | `UpsellGroupsSection` monolítico |
| Create/edit/add | Formularios inline siempre abiertos |
| Actions | `create/update/toggleUpsellGroup*` + `add/update/toggleUpsellGroupItem*` |
| Reorder RPC | No existe |
| Legacy post-wire | `upsell-groups-section.tsx` queda sin uso (cleanup futuro) |

## Arquitectura implementada

```txt
components/admin/product-customization/plus-suggestions/
  PlusSuggestionsTab
  PlusSuggestionCard
  PlusEditModal
  SuggestedProductsModal
  SuggestedProductRow
  SuggestedProductEditModal
  plus-suggestions.module.css
```

Reutiliza `ActionsMenu` de `reusable-sections/`.  
Wiring: `owner-customization-builder` → `PlusSuggestionsTab`.

## Pantalla principal compacta

- Header + CTA `+ Nuevo plus`
- Lista “Tus ventas sugeridas” con cards
- Sin create/edit/add forms inline

## Card compacta de plus

- Nombre, descripción, chips (destino, N productos, Visible/Oculto)
- Preview: Coca Cola 500ml · +$ 3.000
- Menú ⋮

## Menú de plus

Editar plus · Gestionar productos sugeridos · Ocultar/Mostrar plus

## Modal Crear plus

Nombre, descripción, destino (producto/categoría), visible, orden avanzado. Máx. 1 por destino (mensaje action).

## Modal Editar plus

Nombre, descripción, visible, orden avanzado. Destino **read-only** (`Producto · Doble Smash`).

## Modal Gestionar productos sugeridos

Lista compacta + `+ Agregar producto` + Cerrar.

## Row compacta de producto sugerido

Nombre · categoría · precio · Visible/Oculto · ↑↓ · ⋮

## Menú de producto sugerido

Editar producto sugerido · Ocultar/Mostrar producto

## Modal Agregar producto sugerido

Select producto (filtrado), visible, orden. No crea productos.

## Modal Editar producto sugerido

Producto read-only; orden + visible vía `updateUpsellGroupItemAction`.

## Reordenamiento

↑↓ swap/`sort_order` con `updateUpsellGroupItemAction` (sin RPC nuevo). Con 1 ítem los botones quedan disabled.

## Estados pending/error

`useActionState` en modales/toggles; `useTransition` en reorder; feedback `admin-feedback`.

## Theme / tokens

Module CSS con tokens surface/text/border/accent (mismo ritmo que Secciones).

## Responsive

Cards full width; modales `min(100%-24px, 560/720)`; footer sticky; chips wrap.

## Accesibilidad

`dialog` nativo, ⋮ `aria-label`, Escape/Cancelar sin guardar, chips Visible/Oculto con texto.

## Validación local admin

- Card Bebidas + Doble Smash + Coca +$3.000
- Create/edit modals OK; destino read-only en edit
- Gestionar productos + Coca row + ↑↓ disabled (1 ítem)
- Sin forms inline largos

## Validación otros tabs

Secciones compactas OK; tabs cambian.

## Validación pública

Doble Smash: Papas/Salsas/Agregados + Sumá una bebida + Coca. Sin confirmar pedido.

## No side effects

Sin migrations/schema/RLS/actions nuevas/cart/checkout/stock/pedidos/flags.

## Deploy

Autorizado y ejecutado.

- Commit: `a2a9b26` — `Compact Product Customization plus suggestions`
- Push: `origin/main`
- App: https://orderops.vercel.app

## Browser QA

Local PASS (admin + secciones + público).

## Compatibilidad

Plus público y preview admin sin cambios de código; solo admin shell.

## Qué NO se tocó

DB · RLS · actions semantics · public modal · cart · checkout · stock · delete

## Validaciones CLI

`tsc PASS` · `build PASS`

## Riesgos / deuda

| Deuda | Notas |
|-------|-------|
| Legacy `upsell-groups-section.tsx` | Sin imports runtime → CLEANUP-1 |
| Stock en row | No en `AdminCatalogProductOption` → omitido |
| Nested dialogs | Add/edit sobre manage — OK Chromium |

## Rollback plan

Revertir commit; restaurar `UpsellGroupsSection` en builder.

## Resultado final

**PASS**

## Próxima fase recomendada

`PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1` — eliminar `upsell-groups-section.tsx` si sigue sin uso.
