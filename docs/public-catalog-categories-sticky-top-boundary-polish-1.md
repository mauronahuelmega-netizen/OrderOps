# PUBLIC-CATALOG-CATEGORIES-STICKY-TOP-BOUNDARY-POLISH-1

**Fecha:** 2026-08-14
**Estado:** PASS WITH ANDROID DEVICE QA DEBT
**Commit / push / deploy:** no

## Contexto

QA visual en Android Chrome: con hero/copy y categories compartiendo la misma superficie crema, el inicio de la barra sticky no quedaba delimitado. Elevación inferior, bottom border, sticky/full-bleed/alignment ya estaban aprobados.

## Cambio

Agregar hairline superior de 1px a la superficie completa de `.catalog-category-nav`.

```css
border-top: 1px solid var(--catalog-border);
```

Token único: `var(--catalog-border)` (light/dark vía `.catalog-page`).

## Runtime

| Archivo | Cambio |
|---------|--------|
| `app/globals.css` | `+ border-top` en `.catalog-category-nav` |

Header / module / TSX / chips / hero / shadow / spacing / sticky / full-bleed: **untouched**.

## Arquitectura preservada

```text
HEADER = NORMAL FLOW (untouched)
CATEGORIES = STICKY TOP 0
FULL-BLEED = PRESERVED
VERTICAL CENTERING = PRESERVED
BOTTOM BORDER = PRESERVED
DOWNWARD SHADOW = UNCHANGED
```

## Box model

| | Before | After |
|--|--------|-------|
| border-top | 0 | 1px `var(--catalog-border)` |
| border-bottom | 1px | 1px (preserved) |
| height | 59px | 60px |
| delta | — | +1px |
| compensation | — | **NO** |

## QA

| Check | Resultado |
|-------|-----------|
| Flow: top hairline | PASS (local browser) |
| Sticky: top + bottom borders | PASS (local) |
| Shadow unchanged | PASS |
| Horizontal overflow | false |
| Android Chrome real | **PENDING** |

## Checks

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | deuda ESLint 9 circular JSON |

## Deuda documental previa

Fases chrome-elevation / followups / paint-stacking-audit pueden no tener doc dedicado en `/docs`; no se reconstruyeron aquí.
