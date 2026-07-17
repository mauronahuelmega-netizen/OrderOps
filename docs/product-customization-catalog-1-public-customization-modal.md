# PRODUCT-CUSTOMIZATION-CATALOG-1 — Public Customization Modal

## Objetivo

Primera integración pública de Product Customization V1 en el catálogo: read model, flags livianos / “Desde $X”, intercept de add-to-cart y modal lazy-loaded — **sin** persistir customizations en carrito/checkout.

## Contexto

Fases previas: AUDIT → SPEC → DB → FLAG → ADMIN-1/2/QA → ADMIN-DND-1.

- Admin puede configurar grupos, opciones, assignments, overrides y upsell.
- Flag `product_customization_enabled` sigue **off** por defecto.
- Catálogo legacy intacto mientras el flag esté apagado.

## Scope

- Resolver flag server-side por `businessId`.
- Summary liviano por producto (`hasCustomizations`, `hasPaidCustomizations`, `hasUpsell`, `priceFrom`).
- UI “Desde $X” cuando aplica.
- Interceptar Agregar / Personalizar para productos configurables.
- `CustomizationModal` lazy (`next/dynamic`, `ssr: false`).
- Full config solo al abrir modal (server action).
- Herencia categoría + producto, overrides, upsell.
- Validación required/min/max y total visual en cliente.
- Seam explícito CART-1 (opción A: CTA “Continuar” no escribe carrito legacy).

## Fuera de scope

- Cart V2 / `LocalCartItem` storage definitivo.
- Checkout / `create_order` / RPC.
- Dashboard / pedidos manuales.
- Activar feature flag / UI de toggle.
- Migraciones / RLS.
- Persistencia de selección en pedido.

## Archivos creados/modificados

### Creados

- `lib/product-customization/public-shared.ts` — types + validación/precio puros (client-safe).
- `lib/product-customization/public.ts` — read model server-only.
- `app/b/[slug]/catalogo/actions.ts` — lazy load config.
- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/customization-modal.module.css`
- `docs/product-customization-catalog-1-public-customization-modal.md`

### Modificados

- `lib/catalog/public.ts` — `customizationSummary?` opcional en `PublicProduct`.
- `components/public/catalog/public-catalog-page.tsx` — flag + summaries SSR.
- `components/public/catalog/catalog-client.tsx` — intercept + modal lazy.
- `components/public/catalog/product-card.tsx` — “Desde $X” + CTA configurable.
- `components/public/catalog/product-detail-modal.tsx` — personalizar / Desde.
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## Feature flag behavior

```ts
const customizationEnabled = await isProductCustomizationEnabled(businessId)
```

- **false**: no summaries, no “Desde”, no modal, add-to-cart legacy exacto.
- **true**: summaries en SSR; productos configurables abren modal.
- No se activa el flag en esta fase.
- Fail-closed; sin service role en client.

## Public read model

`lib/product-customization/public.ts` (server-only):

- `getPublicCustomizationSummariesForProducts({ businessId, productIds })`
- `getPublicProductCustomizationConfig({ businessId, productId })`

Usa `createSupabaseServerClient` + RLS pública gated por flag. Solo datos del `businessId` pedido.

## Summary flags / Desde $X

`price_from = product.price + minimum_required_delta`

- Single requerido: menor `price_delta`.
- Multiple requerido / min > 0: N opciones más baratas.
- Opcionales y upsell **no** elevan `price_from`.

Mostrar “Desde $X” si hay customizations / paid / upsell / priceFrom. Fallback sin summary: precio legacy.

## Lazy load strategy

1. Bundle del modal: `next/dynamic(..., { ssr: false })` desde `catalog-client`.
2. Config completa: `getPublicProductCustomizationConfigAction` al montar el modal.
3. Initial catalog payload solo lleva summary liviano (si flag on).

## Customization modal

- Header: nombre, precio base, total en footer.
- Grupos: radio (single) / checkbox (multiple), required/min/max, `price_delta` si > 0.
- Upsell: “También podés sumar”, checkboxes opcionales sin cantidades.
- CTA “Continuar”: valida, arma draft, muestra mensaje CART-1 pending, **no** muta carrito.
- Error de load: mensaje + cerrar; no add legacy automático.

## Herencia y overrides

1. Assignments enabled de categoría + producto.
2. Producto gana si el mismo grupo viene por ambos.
3. Overrides `is_enabled=false` desactivan grupo/opción.
4. Orden: assignment.sort_order → group.sort_order → created_at.
5. Grupo sin opciones: ocultar si no requerido; si requerido → `isBlocked` (CTA deshabilitada).

## Upsell display

- Prioridad: upsell directo de producto > categoría.
- Items `is_available` + productos disponibles; excluye el producto padre.
- Selección 0..N; suma al total visual; sin persistencia.

## Add-to-cart interception

| Condición | Comportamiento |
|-----------|----------------|
| Flag off | Legacy `setProductQuantity` |
| Flag on + sin customization/upsell | Legacy |
| Flag on + configurable | Abre `CustomizationModal`; no escribe cart |

Detalle: CTA “Personalizar” en lugar de cantidad.

## Cart / checkout compatibility

- **No** se modifica `lib/cart/local.ts`.
- **No** se modifica checkout / `create_order`.
- Seam: `onConfirmCustomizationSelection` + TODO CART-1.
- Limitación documentada: selección no llega a checkout todavía.

## Error handling

- Summary batch falla → summaries vacíos → UI legacy-safe.
- Modal load falla → error en modal, catálogo intacto.
- Flag off mid-flight → action `enabled: false`.

## Validaciones CLI

- `npx tsc --noEmit`
- `npm run build`
- Lint opcional (ESLint 9 circular JSON conocido).

## Browser QA flag off

Ejecutado en `localhost:3000` (2026-07-13):

| Check | Resultado |
|-------|-----------|
| `/b/demohamburgueseria/catalogo` carga | PASS |
| Sin texto “Desde” | PASS (`desdeCount=0`) |
| Sin “Personalizar” / modal customization | PASS |
| Add-to-cart legacy (React onClick → qty + localStorage) | PASS |
| Precios legacy (`$ 2.500,00` …) | PASS |
| `/admin/dashboard` carga | PASS |
| Flag no activado | PASS |

Nota: el click automatizado del browser tool a veces es interceptado por el cart bar; el handler React de Agregar funciona correctamente.

Responsive 390/1440: no se revalidó viewport-by-viewport en esta corrida; layout catálogo existente sin cambios CSS de listado.

## Browser QA flag on

No ejecutado (sin autorización para activar `product_customization_enabled`).

## Qué NO se tocó

- `app/b/[slug]/checkout/actions.ts`
- `lib/cart/local.ts`
- RPC `create_order`
- Dashboard / order rendering
- `supabase/migrations` / RLS
- Activación de `product_customization_enabled`

## Riesgos / deuda

- Modal full QA requiere flag on + datos de assignments reales.
- CTA no agrega al carrito: correcto para CATALOG-1; UX temporal hasta CART-1.
- Summaries con flag on hacen queries extra en SSR del catálogo.
- Grupo requerido bloqueado (`isBlocked`) impide continuar — correcto, pero admin debe corregir opciones.

## Resultado final

**PASS WITH DEBT** — implementación completa detrás del flag; smoke flag-off + tsc/build; flag-on browser QA pendiente de autorización.

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-CART-1** — persistir `PublicCustomizationSelectionDraft` en carrito V2 sin romper checkout legacy hasta ORDER-1.
