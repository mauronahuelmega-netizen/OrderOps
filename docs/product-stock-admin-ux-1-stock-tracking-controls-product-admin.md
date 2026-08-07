# PRODUCT-STOCK-ADMIN-UX-1 — Stock Tracking Controls in Product Admin

## Objetivo

Permitir configurar visualmente `products.track_stock` en crear/editar producto del admin, sin implementar decremento automático en pedidos.

## Contexto

- `PRODUCT-STOCK-TRACKING-SCHEMA-1` → **PASS**: columna `track_stock boolean NOT NULL DEFAULT false` en prod.
- Runtime legacy intacto: `create_order` no descuenta stock.
- Modelo híbrido (DESIGN-1): tracking opt-in por producto.

## Alcance

- Create/edit product forms
- Server actions create/update product
- Tipo `AdminProduct.track_stock`
- Copy/helper + warning stock≤0
- Docs / CURRENT_PHASE / living memory

## Fuera de scope

- `create_order` / decremento
- Triggers / schema / migrations
- Mass `track_stock=true`
- Checkout / cart / catalog / dashboard / flags / store session
- Deploy / Vercel

## Autorización

```txt
AUTORIZO_STOCK_ADMIN_UX_LOCAL=yes
AUTORIZO_STOCK_ADMIN_UX_BROWSER_QA=yes
AUTORIZO_UPDATE_PRODUCT_TRACK_STOCK_QA=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status --short` | baseline con docs/tmp previos + cambios de esta fase |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Archivos auditados

- `components/admin/products/create-product-form.tsx`
- `components/admin/products/edit-product-form.tsx`
- `components/admin/products/product-form.module.css`
- `components/admin/products/product-availability-toggle.module.css`
- `app/admin/(protected)/products/actions.ts`
- `lib/products/admin.ts` (`getAdminProductById`, `AdminProduct`)
- `types/database.ts` (`track_stock` Row/Insert/Update ya presente)

## Implementación UI

### Crear producto

- Switch **Controlar stock automáticamente** (`name="track_stock"`, default OFF)
- Label stock → **Stock actual**
- Helper: prepara el producto para descuento futuro; fase posterior implementará el descuento
- Warning si ON y stock ≤ 0

### Editar producto

- Muestra valor actual de `track_stock`
- Conserva Disponible / stock editables como antes
- No muta `is_available` al cambiar `track_stock` en React
- Helper orientado a bebidas/postres + aviso de preparación
- Warning si ON y stock ≤ 0

## Implementación server actions

- `createProductAction`: `track_stock = formData.get("track_stock") === "on"` → insert explícito
- `updateProductAction`: mismo parse → update payload incluye `track_stock`
- Default efectivo false si el checkbox no viene (unchecked)
- No cambia `is_available` por el solo hecho de `track_stock`

## TypeScript / tipos

- `types/database.ts`: ya tenía `track_stock`
- `AdminProduct`: agregado `track_stock: boolean`
- `getAdminProductById`: select + map de `track_stock`

## QA browser admin

| Check | Resultado |
|-------|-----------|
| `/admin/products` carga | PASS |
| Crear: switch + copy + default OFF | PASS |
| Editar Coca Cola: switch + Disponible + Stock actual | PASS |
| Cancelar/cerrar create no modifica productos | PASS |
| Hidratación nueva en admin products | No observada |

## QA persistencia opcional

Autorizada. Acción sobre **Coca Cola 500ml**:

1. Activar `track_stock`
2. Guardar (sin cambiar nombre/precio/stock/disponibilidad)
3. Reabrir → `track_stock=true`, `stock=5`, `is_available=true`, `price=3000`, nombre intacto

Estado final documentado:

```txt
Coca Cola 500ml → track_stock=true (preparado para DECREMENT-ORDER)
stock=5 · is_available=true · price=3000
```

## Browser sanity público/dashboard

| Ruta | Resultado |
|------|-----------|
| `/admin/products` | PASS |
| `/b/demohamburgueseria/catalogo` | PASS (carga) |
| Doble Smash modal / personalización | PASS; Plus Bebidas / Coca visible en DOM |
| `/admin/dashboard` | PASS |
| Pedido creado | No |

Nota: overlay de hydration en catálogo público apunta a `public-catalog-page.tsx` (preexistente / fuera de scope); no causado por formularios admin de esta fase.

## Compatibilidad legacy

- Productos sin tracking siguen con comportamiento actual
- `create_order` sin cambios → no descuenta stock aunque Coca tenga `track_stock=true`
- Default create permanece false

## Qué NO se tocó

- `create_order`
- Triggers SQL / migrations
- Checkout / cart / catalog logic
- Flags / store sessions
- Deploy

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | No ejecutado (deuda conocida ESLint 9 circular JSON) |

## Riesgos / deuda

- `track_stock=true` en Coca Cola no tiene efecto runtime hasta DECREMENT-ORDER
- Warning UI es solo informativo (no bloquea venta)
- Hydration warning catálogo público: deuda previa

## Resultado final

**PASS**

El admin de productos permite configurar `track_stock` por producto, manteniendo legacy intacto y sin implementar decremento automático todavía.

## Próxima fase recomendada

**PRODUCT-STOCK-DECREMENT-ORDER-1** — validar y descontar stock en `create_order` para productos con `track_stock=true` (incl. upsell children).
