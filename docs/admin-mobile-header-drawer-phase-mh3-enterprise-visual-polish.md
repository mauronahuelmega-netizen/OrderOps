# Admin Mobile Header & Drawer — MH3 Enterprise Visual Polish

## Objetivo

Elevar el mobile admin drawer al nivel visual enterprise del sidebar desktop y del admin dark, manteniendo toda la funcionalidad/a11y de MH2.

## Contexto

- **MH1:** audit — drawer light hardcoded, nav sin iconos, account básico.
- **MH2:** focus trap, theme toggle, brand topbar, aria — visual light preservado a propósito.
- **MH3:** polish visual CSS-first; sin cambios de rutas, permisos ni behavior.

## Archivos modificados

- `components/admin/admin-mobile-drawer.tsx`
- `components/admin/admin-mobile-drawer.css`
- `components/admin/admin-topbar.tsx`
- `components/admin/admin-topbar.css` (creado)
- `components/admin/layout/admin-brand.module.css`
- `components/admin/layout/admin-nav-list.tsx`
- `components/admin/layout/admin-sidebar.module.css`

## Archivos creados

- `components/admin/admin-topbar.css`
- `docs/admin-mobile-header-drawer-phase-mh3-enterprise-visual-polish.md`

## Cambio principal aplicado

Reemplazo del look light legacy del drawer por superficie dark/admin-aligned con tokens locales (`--drawer-*` → `--bg-surface`, `--border-subtle`, etc.), nav con iconos Lucide compartidos con desktop, footer account block con avatar inicial, theme toggle y logout integrados al estilo sidebar.

## Drawer surface

- Panel: `var(--bg-surface)`, borde `var(--border-subtle)`, sombra con `color-mix`.
- Overlay: translúcido oscuro alineado a `--bg-canvas`.
- Ancho: `min(88vw, 320px)` — más cercano al rail desktop expandido.
- Header/footer con separadores sutiles y fondo footer elevado.

## Brand/header polish

- `AdminBrand variant="drawer"`: logo 38px, flex en header con close ghost integrado (36px, sin pill blanco).
- Header con `border-bottom` y padding compacto premium.

## Nav icons

- `AdminNavList variant="drawer"` renderiza los mismos iconos Lucide que sidebar (`SIDEBAR_NAV_ICONS` map por href).
- Labels preservados de `admin-nav-config.ts`.

## Nav states

- Estados mirror sidebar: hover `--bg-surface-hover`, active con inset border + barra lateral `::before`.
- Icon color acompaña active/hover.
- `focus-visible` con ring tokenizado.

## Theme toggle polish

- `appearanceControlDrawer` re-tokenizado: sin hex light; mismo patrón ghost row que nav/footer.
- Label “Tema” vía `::after` existente en `.appearanceLabel`.

## Account/logout polish

- Account row: avatar inicial (mismo patrón que `AdminSidebar.getUserInitial`) + email muted.
- Logout: `LogoutButton` sin cambios de lógica; estilos drawer override en CSS (row full-width, icon via mask SVG inline — deuda MH4).

## Topbar polish

- `admin-topbar.css`: spacing mobile menor (60px min-height, brand alineado).
- Hamburger: tokens admin (`--border-subtle`, `--bg-surface-hover`) en lugar de pill blanco.

## Tokenización local

Custom props en `.admin-mobile-drawer`:

| Local | Mapea a |
|-------|---------|
| `--drawer-bg` | `--bg-surface` |
| `--drawer-border` | `--border-subtle` |
| `--drawer-text*` | `--text-primary/secondary/muted` |
| `--drawer-hover-bg` | `--bg-surface-hover` |
| `--drawer-active-bg` | `color-mix(...)` sidebar pattern |
| `--drawer-overlay` | `color-mix` canvas + black |

**Hardcoded restante (MH4):** logout icon mask SVG data-uri; overlay fallback sin blur en ≤768px.

## A11y preservada

- Focus trap, Escape, overlay, close, restore focus, scroll lock — sin cambios TSX de lógica.
- `aria-expanded`, `aria-controls`, `aria-modal`, `aria-labelledby`, `aria-current` intactos.
- Theme toggle keyboard + `aria-pressed` intactos.

## Qué se preservó

- nav config compartida
- active route logic
- focus trap
- Escape/overlay close
- restore focus
- scroll lock
- theme behavior
- logout behavior
- desktop sidebar behavior
- admin routes
- dashboard/products logic
- server actions
- DB/schema

## Qué NO se cambió

- no route changes
- no permission changes
- no server changes
- no DB changes
- no dashboard/product changes
- no global token refactor (`app/theme-tokens.css` untouched)
- no legacy CSS cleanup amplio (`admin-header.css` `.admin-nav-link` dead code preserved)
- no focus trap rewrite
- no `LogoutButton` component changes

## Riesgos / deuda

- Logout icon en drawer usa CSS mask (no Lucide en markup) — MH4 puede unificar con componente drawer logout row.
- Drawer width 320px puede sentirse estrecho en tablets — ajustar en QA.
- Light theme admin: drawer usa tokens que responden a `data-dashboard-theme` vía CSS vars existentes — validar en QA manual.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass (2026-06-06) |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 17 warnings `@next/next/no-img-element` |

## QA manual recomendado

Checklist MH3 prompt §17 — **pendiente** en esta sesión.

## Próxima fase recomendada

**MH4 — Mobile Drawer Legacy CSS Cleanup & Token Pass** (eliminar dead CSS, unificar logout row, reducir duplicación drawer/sidebar styles).

---

**Date:** 2026-06-06 (MH3)
