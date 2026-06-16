# Admin Mobile Header & Drawer — MH4.1 Topbar Brand & Menu Icon Polish

## Objetivo

Microfase visual quirúrgica: pulir brand mark y botón menú del topbar mobile para alinearlos al estándar premium MH3/MH4, sin tocar drawer funcional ni a11y.

## Contexto

- **MH2–MH4:** drawer enterprise, tokens, logout Lucide, cleanup CSS.
- **QA visual:** logo cuadrado dentro de contenedor redondeado; hamburger manual desalineado del lenguaje Lucide del drawer.
- **MH4.1:** sólo topbar brand + menu icon (+ logo drawer compartido vía variant CSS).

## Archivos modificados

- `components/admin/admin-mobile-drawer.tsx`
- `components/admin/admin-mobile-drawer.css`
- `components/admin/admin-topbar.tsx`
- `components/admin/admin-topbar.css`
- `components/admin/layout/admin-brand.module.css`

## Archivos creados

- `docs/admin-mobile-header-drawer-phase-mh4-1-topbar-brand-menu-polish.md`

## Cambio principal aplicado

1. Hamburger manual (3 spans) → Lucide `Menu` con `strokeWidth={1.75}`.
2. Logo topbar/drawer: `padding: 0`, `overflow: hidden`, `object-fit: cover` — imagen llena el frame redondeado sin esquinas cuadradas visibles.
3. Topbar spacing: `56px` min-height, gap `12px`, wrapper `admin-topbar__menu-action`.

## Hamburger Lucide Menu

- Markup: `<Menu aria-hidden="true" />` dentro de `.admin-mobile-menu-button__icon`.
- Preservado: `type="button"`, `aria-label`, `aria-expanded`, `aria-controls`, `menuButtonRef`, `onClick`.
- CSS: 44×44 touch target, icono 22px, sin pill/shadow legacy; `:active` y `[aria-expanded="true"]` sutiles.

## Brand/logo polish

| Variant | Cambio |
|---------|--------|
| `topbar` | Frame 36px, sin padding interno, clip + `object-fit: cover` |
| `drawer` | Frame 38px, mismo patrón clip/cover |
| `sidebar` | **Sin cambios** (desktop module CSS intacto) |

Fallback inicial: llena frame (`width/height 100%`, `border-radius: 0` con clip del contenedor).

## Topbar spacing polish

- `admin-topbar__inner`: min-height 56px (antes 60px), gap 12px.
- Brand y menu action alineados verticalmente con flex.

## Drawer brand consistency

Drawer usa `AdminBrand variant="drawer"` — mismas reglas clip/cover aplicadas vía `.brandDrawer .logoFrame/.logo`. Nav/account/theme/logout sin cambios.

## A11y preservada

- Focus restore → `menuButtonRef` intacto.
- Focus trap, Escape, overlay, scroll lock, dialog semantics — sin cambios TSX de lógica drawer.
- Menu button: `focus-visible` ring preservado; touch target 44px.

## Qué se preservó

- focus trap
- Escape/overlay close
- restore focus
- scroll lock
- aria-expanded/aria-controls
- drawer role/aria-modal
- nav config compartida
- active route logic
- theme behavior
- logout behavior
- desktop sidebar behavior
- admin routes
- dashboard/products logic
- server actions
- DB/schema
- drawer visual MH3/MH4 (nav, footer, surface)

## Qué NO se cambió

- no route changes
- no permission changes
- no server changes
- no DB changes
- no dashboard/product changes
- no drawer redesign
- no nav/account/theme/logout changes
- no global token refactor
- no legacy CSS cleanup amplio
- desktop sidebar brand (`variant="sidebar"`)

## Riesgos / deuda restante

- `object-fit: cover` puede recortar logos muy horizontales — tradeoff intencional para app-icon feel; validar con logo real en QA.
- QA manual light/dark + tablet pendiente (MH5).

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass (2026-06-06) |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 17 warnings `@next/next/no-img-element` |

## QA manual recomendado

Checklist MH4.1 prompt §13 — **pendiente**.

## Próxima fase recomendada

**MH5 — Mobile Admin Nav Final QA & Handoff**

---

**Date:** 2026-06-06 (MH4.1)
