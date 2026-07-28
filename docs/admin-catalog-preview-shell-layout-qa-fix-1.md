# ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 — Two-Column Centering & Phone Frame Alignment

## 1. Estado

**PASS**

Fecha: 2026-07-28  
Branch: `main` @ `84c0c48` (dirty tree acumulado touch-pan / mobile-feel / shell polish — sin limpiar)

## 2. Resumen ejecutivo

Se corrigió el layout desktop del shell de preview: dos mitades equilibradas con el teléfono **centrado en la mitad derecha** (ya no `justify-self: end` / `flex-end`), y el phone frame pasó a **envolver** el viewport/iframe con padding simétrico y ancho definido, eliminando el colapso al intrinsic ~300px del iframe.

## 3. Bug visual detectado

1. Teléfono pegado al borde derecho por `justify-self: end` en `.phoneColumn` y `justify-content: flex-end` en `.stage`, con columna derecha estrecha (`minmax(320px, 440px)`).
2. Frame decorativo absoluto hermano del viewport → desalineación visual / offsets.
3. Cadena `fit-content` + `%` + intrinsic width del iframe (~300px) contraía el marco a ~334px.

## 4. Cambios realizados

- `catalog-preview-shell.tsx`: `iframeWrap` anidado dentro de `phoneFrame` (notch + viewport).
- `catalog-preview-shell.module.css`:
  - `.shell` `max-width: 1360px; margin-inline: auto`
  - ≥1024: `grid-template-columns: minmax(0, 1fr) minmax(420px, 1fr)`; `.phoneColumn` flex center
  - sticky con ancho definido `min(100%, var(--preview-phone-frame-width))` + `margin-inline: auto`
  - frame border-box con padding/borde simétricos; viewport 100% del content box
  - tokens CSS locales `--preview-phone-*`
  - mobile: una columna, sin chrome, sticky static, sin overflowX

Sin cambios a clear-cart, cookie, CSP, guard, carrito público, mobile-feel.

## 5. Layout dos mitades

| Viewport | Layout | Content / Phone col | Frame center Δ vs col |
|----------|--------|---------------------|------------------------|
| 1920 | grid | 652 / 652 | 0 |
| 1440 | grid | 619 / 619 | 0 |
| 1024 | grid | ~412 / 420 | 0 |
| 390 | flex column | full | centered |

Gap a borde derecho viewport (1440): ~146px. Gap dentro de columna derecha: ~99px c/lado.

## 6. Alineación phone frame / viewport

Medido (desktop chrome ≥768):

- Frame width: **422px** (`390 + 14×2 + 2×2`)
- Wrap: **390px**
- iframe: **~388px** (borde 1px wrap)
- `padL` / `padR` (wrap vs frame outer): **16 / 16** (padding 14 + border 2)

Sin transforms laterales. Notch centrado con `align-self: center`.

## 7. Sticky behavior

- ≥1024: `position: sticky; top: 96px`
- Centrado vía columna flex + `margin-inline: auto` (no `margin-left: auto` empujando a la derecha)
- &lt;1024: `position: static`

## 8. Responsive QA

| Breakpoint | Resultado |
|------------|-----------|
| 1440 / 1920 | Dos mitades; phone centrado en derecha; sin overflowX |
| 1024 | Grid balanceado; phone centrado; sticky |
| 768+ chrome | Frame visible; padding simétrico |
| 390 / 414 | Una columna; notch off; phone full-width centrado; sin overflowX |

## 9. Regression funcional

| Check | Resultado |
|-------|-----------|
| Vaciar carrito (click shell) | PASS — toast “Vaciando…”, botón re-habilitado |
| Toasts admin | PASS (clear flow) |
| postMessage / ACK / mobile-feel / checkout guard | No tocados; smoke no regresivo de layout |
| Público / cookie / CSP | No tocados |

No se crearon pedidos.

## 10. Deuda residual

| ID | Severidad | Nota |
|----|-----------|------|
| Clipboard success toast flaky en automation | P3 | Preexistente shell polish |
| Device touch / pressed feedback | P3 | Preexistente mobile-feel |
| Visión screenshot tool vs layout CDP en panel angosto | P3 | QA geometry vía CDP es fuente de verdad |

## 11. Rollback

Revertir únicamente:

- `components/admin/products/catalog-preview-shell.tsx`
- `components/admin/products/catalog-preview-shell.module.css`

a pre-LAYOUT-QA-FIX-1 (estado SHELL-PREMIUM-POLISH-1).

## 12. Próximo paso

**ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1**

---

## CLI

- `npx tsc --noEmit` → PASS
- `npm run build` → PASS
- `npm run lint` → FAIL preexistente (ESLint circular `configs.flat.plugins.react`)
