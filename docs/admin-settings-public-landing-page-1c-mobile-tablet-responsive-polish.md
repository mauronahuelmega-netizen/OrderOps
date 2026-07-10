# Admin Settings Public Landing — SETTINGS-PAGE-1C Mobile/Tablet Responsive Polish

## Objetivo

Cerrar deuda responsive **L-05** (affordance del rail SettingsNavigation en mobile/tablet) y pulir densidad del editor landing en viewports estrechos, preservando desktop 1B.

## Contexto

- **1A:** overflow y color field corregidos.
- **1B:** layout editor + preview desktop.
- Estado inicial post-1B: sin overflow global; nav mobile con scroll interno sin affordance visual clara.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/settings-navigation.module.css` | Scroller wrapper, fade, scroll-snap, padding-end, touch targets 40px |
| `components/admin/settings/settings-navigation.tsx` | Wrapper `.scroller` presentacional |
| `components/admin/settings/public-settings.css` | Densidad mobile, tablet max-width, preview compacta |
| `docs/admin-settings-public-landing-forensic-audit-page-1a.md` | Follow-up 1C |
| `docs/admin-settings-v1-final-handoff.md` | Nota follow-up |

## Archivos creados

- `docs/admin-settings-public-landing-page-1c-mobile-tablet-responsive-polish.md` (este documento)

## Cambio principal aplicado

SettingsNavigation mobile ganó **scroller con fade lateral**, **scroll-snap**, **padding-inline-end** y scrollbar oculta; el landing editor recibió **ajustes de densidad** scoped bajo `.admin-settings-landing-editor`.

## SettingsNavigation mobile/tablet

- Wrapper `.scroller` con `::after` gradiente (`var(--bg-canvas)`) en `<768px`.
- `.list`: `scroll-snap-type: x proximity`, `scroll-padding-inline`, `padding-right: var(--space-md)`, `scrollbar-width: none`, `touch-action: pan-x`.
- Links: `min-height: 40px`, `scroll-snap-align: start`.
- Tablet/desktop `≥768px`: `flex-wrap`, sin fade, scrollbar thin restaurada.

## Scroll behavior

- `overscroll-behavior-x: contain` preservado.
- Scroll interno del rail no genera overflow de página (verificado CDP mobile).

## Mobile density

- Cards landing: padding `var(--space-md)`.
- Gaps reducidos entre secciones.
- Portada upload preview: 140px alto.
- Upload / preview link: min-height 44px.
- Pseudo-CTAs preview más compactos.

## Tablet polish

- Editor layout `max-width: 820px` centrado.
- Preview hero en 1 columna (no 2-col).
- Sin overflow (`scrollW 805 = clientWidth`).

## Preview responsive

- Padding reducido en mobile/tablet.
- Summary text con `line-clamp: 2` en mobile.
- Título preview ligeramente menor en mobile.

## Touch targets

| Elemento | Altura mínima |
|----------|---------------|
| Nav tabs | 40px |
| Upload buttons | 44px (mobile) |
| Ver landing pública (preview) | 44px (mobile, full width) |
| Pseudo-CTAs | 32px, no clickeables |

## Desktop preservation

| Check | Resultado |
|-------|-----------|
| Layout 2-col ≥1100px | `698px + 516px` |
| Sticky preview | Preservado |
| Overflow | No (`1440 = 1440`) |
| Nav wrap | `flex-wrap` en ≥768px |

## Regression checks

- `/admin/settings/public/catalogo` — no usa clases landing editor; SettingsNavigation mejorado globalmente.
- CSS landing scoped; catálogo no afectado.

## Browser QA desktop

**1440×900:** `scrollW 1440`, grid 2-col, nav wrap, sin regresión.

## Browser QA tablet

**820×1024:** `scrollW 805`, 1 columna, `max-width 820px`, sin overflow.

## Browser QA mobile

**390×844:**

| Métrica | Valor |
|---------|-------|
| Page overflow | No (`390 = 390`) |
| Nav scrollWidth | 620 vs client 358 |
| Scroll snap | `x proximity` |
| Fade | Presente |
| Tab height | 40px |

## Qué se preservó

- desktop editor + preview layout
- `updatePublicBusinessSettingsAction`
- upload logic
- bucket `business-assets`
- DB/RLS
- permissions
- route structure
- field names
- validation
- public landing route
- catalog route
- `SettingsShell`
- SettingsNavigation semantics

## Qué NO se cambió

- no server action changes
- no DB changes
- no RLS changes
- no storage changes
- no upload behavior changes
- no public landing real redesign
- no checkout changes
- no products changes

## Riesgos

- Fade usa `--bg-canvas`; si el fondo del contenedor settings difiere en alguna ruta, revisar contraste del gradiente.
- SettingsNavigation polish aplica a **todas** subpáginas settings (comportamiento deseado).

## Deuda restante

- **L-06** — sticky save bar (futuro)
- **L-10** — validación origen URL assets
- Preview sigue aproximada vs landing real completa

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9 circular config |

## Próxima fase recomendada

**SETTINGS-PAGE-1D — Public Landing Final QA & Handoff**
