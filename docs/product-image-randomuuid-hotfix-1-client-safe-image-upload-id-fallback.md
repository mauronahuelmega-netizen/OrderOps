# PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 — Client-Safe Image Upload ID Fallback

## Problema

Crash al cargar/cropear imagen de producto en dev/mobile/LAN:

```txt
Runtime TypeError: crypto.randomUUID is not a function
```

Stack:

```txt
processImageFile → handleCroppedImage → onCropComplete → handleApplyCrop
```

Reportado al acceder vía origen no seguro, p.ej. `http://192.168.100.28:3000`.

## Causa probable

`crypto.randomUUID()` solo está garantizado en contextos seguros (`https:` o `localhost`). En HTTP sobre IP LAN, `globalThis.crypto` puede existir sin `randomUUID`, y el client code de upload/crop lo invocaba directo.

## Alcance

Hotfix defensivo de generación de IDs/filenames en cliente para flujos de imagen. Sin cambios de schema, storage policies, buckets ni rewrite del pipeline de imágenes.

## Implementación

Nuevo helper `lib/client/safe-random-id.ts` → `createClientSafeId(prefix)`:

1. `crypto.randomUUID()` si existe
2. UUID v4 vía `getRandomValues` si existe
3. Fallback `Date.now` + `Math.random`

Reemplazos:

| Archivo | Antes | Después |
|---------|-------|---------|
| `edit-product-form.tsx` | `crypto.randomUUID()` en path | `createClientSafeId("product-image")` |
| `create-product-form.tsx` | 2× `crypto.randomUUID()` | `createClientSafeId("tmp-product")` + `createClientSafeId("product-image")` |
| `public-settings-form.tsx` | logo/cover upload | `createClientSafeId("business-asset")` |

`lib/cart/local.ts` ya tenía guard propio; no se tocó (fuera del flujo de imagen).

## Archivos modificados

- `lib/client/safe-random-id.ts` (nuevo)
- `components/admin/products/edit-product-form.tsx`
- `components/admin/products/create-product-form.tsx`
- `components/admin/settings/public-settings-form.tsx`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`
- este doc

## QA desktop

| Check | Resultado |
|-------|-----------|
| `tsc` / `build` | PASS |
| `/admin/products` | PASS (sesión admin activa, listado OK) |
| Helper sin `randomUUID` | PASS — cae a UUID vía `getRandomValues` (`fallbackOk=true`) |
| Crop/upload end-to-end con archivo real | Manual en dispositivo — ver QA LAN |

## QA mobile/LAN

Validar en dispositivo:

```txt
http://192.168.100.28:3000/admin/products
```

Checklist:

- abrir editor de producto
- seleccionar imagen → crop → aplicar
- sin `crypto.randomUUID is not a function`
- preview + upload avanzan

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (`TSC_EXIT=0`) |
| `npm run build` | PASS (`BUILD_EXIT=0`) |

## Qué NO se tocó

Schema · migraciones · Storage policies/buckets · Product Customization · catálogo público · dashboard · deploy · Node `crypto` en client.

## Riesgos / deuda

- Filenames ahora llevan prefijo (`product-image-…`); paths de storage siguen válidos.
- `lib/cart/local.ts` mantiene fallback local (oportunidad de unificar con el helper).
- QA LAN/mobile end-to-end depende de verificación en dispositivo físico.

## Resultado final

**PASS WITH DEBT** — crash path eliminado en código de imagen; CLI PASS; confirmación LAN/mobile en dispositivo pendiente como deuda menor de QA.
