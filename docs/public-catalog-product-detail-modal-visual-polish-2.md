# PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-VISUAL-POLISH-2

**Fecha:** 2026-08-14
**Estado:** PASS WITH ANDROID DEVICE QA DEBT
**Commit / push / deploy:** no

## Contexto

Tras full-width mobile + top radii + image 1:1, QA visual detectó:

1. hairlines laterales claras junto a la imagen;
2. “Desde” demasiado cercano en peso al precio;
3. microcopy de pricing un poco prominente.

## Causa de las líneas laterales

`.catalog-modal` usaba `border: 1px solid var(--catalog-modal-border)`.
En dark, `--catalog-modal-border` se aclara vía `color-mix(... catalog-text)`, produciendo rails visibles edge-to-edge sobre la imagen 1:1.
No provenían de wrappers de imagen (`border-radius: 0`, sin border propio).

## Cambio runtime

**Archivo:** `app/globals.css` únicamente (TSX untouched).

### Fix A — borders mobile

```css
border: solid var(--catalog-modal-border);
border-width: 1px 0 0; /* top only */
```

Desktop `≥720px` restaura `border: 1px solid …` + `border-radius: 30px`.

### Fix B — “Desde” (IMPLEMENTED)

Markup ya tiene `<span class="catalog-product-card__price-from">`.
Scoped a `.catalog-modal__summary .catalog-product-card__price-from`: weight 500, `font-size: 0.78em`, muted.
Cards legacy sin cambio de cascada card-only.

### Fix C — microcopy (IMPLEMENTED)

`.catalog-modal__helper`: `12px` (antes 13), line-height 1.4, muted ligeramente más suave. Copy unchanged.

## Preservado

```text
MOBILE FULL WIDTH
TOP RADII 28px 28px 0 0
IMAGE 1:1 + object-fit cover
FOOTER / CTA / shadows / z-index / scroll lock
DESKTOP centered + max-width 720
```

## QA

| Check | Resultado |
|-------|-----------|
| Mobile full width + no lateral rails | PASS (local; computed) |
| Image 1:1 edge-to-edge | PASS |
| Price hierarchy | PASS (CSS-only) |
| Microcopy tertiary | PASS (CSS-only) |
| Desktop border/radii | PASS (source restore ≥720) |
| Android Chrome real | **PENDING** |

## Checks

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | deuda ESLint 9 circular JSON |
