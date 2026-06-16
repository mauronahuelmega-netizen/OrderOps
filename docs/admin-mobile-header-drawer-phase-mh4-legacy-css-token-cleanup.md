# Admin Mobile Header & Drawer — MH4 Legacy CSS Cleanup & Token Pass

## Objetivo

Limpieza segura de deuda CSS post-MH2/MH3: tokenización local completa, eliminación de CSS mask logout, reducción de duplicación drawer/sidebar, sin cambiar UX visual ni funcionalidad/a11y.

## Contexto

- **MH2:** funcionalidad/a11y.
- **MH3:** polish visual dark + `--drawer-*` tokens + logout icon vía CSS mask SVG (deuda).
- **MH4:** cleanup acotado; no rediseño.

## Archivos modificados

- `components/admin/admin-mobile-drawer.tsx`
- `components/admin/admin-mobile-drawer.css`
- `components/admin/admin-topbar.tsx`
- `components/admin/layout/admin-nav-list.tsx`
- `components/admin/layout/admin-sidebar.module.css`
- `components/admin/layout/admin-brand.module.css`

## Archivos creados

- `docs/admin-mobile-header-drawer-phase-mh4-legacy-css-token-cleanup.md`

## Preflight cleanup audit

| Archivo | Clase/regla | Clasificación | Acción | Motivo |
|---------|-------------|----------------|--------|--------|
| `admin-mobile-drawer.css` | `.admin-mobile-drawer` duplicado (2 bloques) | SAFE SIMPLIFY | Merge en un bloque | Duplicación MH3 |
| `admin-mobile-drawer.css` | `.admin-mobile-drawer__footer-action` + mask `::before` | SAFE DELETE | Eliminado | Reemplazado por logout Lucide |
| `admin-mobile-drawer.css` | `rgb(0 0 0 / …)` overlay/shadow | SAFE SIMPLIFY | Tokenizado vía `--drawer-overlay-scrim` / `--drawer-shadow-color` | MH4 token pass |
| `admin-header.css` | `.admin-nav-link` (+ variants) | DEFER | No tocado | Fuera de scope MH4; 0 consumidores TSX confirmados |
| `admin-sidebar.module.css` | `.appearanceControlDrawer` valores fijos | SAFE SIMPLIFY | Usa `--drawer-row-*` heredados | Reduce duplicación drawer/sidebar |
| `admin-brand.module.css` | `.logoFallback color: #fff` | SAFE SIMPLIFY | `var(--bg-surface)` | Token existente |
| `admin-nav-list.tsx` | `SIDEBAR_NAV_ICONS` | SAFE SIMPLIFY | Renombrado `ADMIN_NAV_ICONS` | Claridad compartida sidebar/drawer |
| `admin-mobile-drawer.tsx` | `footerAction` prop | SAFE DELETE | Eliminado | Logout drawer inline con `logoutAction` |
| `admin-nav-list.module.css` | — | KEEP | N/A | Archivo no existe |

## SAFE DELETE aplicado

- `.admin-mobile-drawer__footer-action` y overrides `.admin-secondary-link` + CSS mask SVG.
- Prop `footerAction` en `AdminMobileDrawer`.
- Import/uso `LogoutButton` en `admin-topbar.tsx` (logout sólo en drawer footer, igual que antes funcionalmente).

## SAFE SIMPLIFY aplicado

- Bloques `.admin-mobile-drawer` fusionados; tokens row compartidos (`--drawer-row-*`, `--drawer-active-*`).
- Overlay/sombra sin `rgb()` raw — `color-mix` con `--text-primary` / `--bg-canvas`.
- `appearanceControlDrawer` consume vars heredadas del panel drawer.
- Icon map renombrado `ADMIN_NAV_ICONS`.
- Ancho drawer: `360px` mobile; `420px` en tablet (`768px–899px`).

## KEEP decisions

- Todas las clases drawer activas en TSX (`__header`, `__nav`, `__link`, `__account`, etc.).
- `admin-topbar.css` overrides mobile (spacing).
- Desktop sidebar rules intactas (incl. `rgba` en hover shadow thumb — preexistente, no drawer).
- Focus trap / portal / scroll lock markup sin cambios estructurales.

## DEFER decisions

- `.admin-nav-link` dead CSS en `admin-header.css` — fuera de scope; eliminar en fase posterior con cambio explícito a `admin-header.css`.
- Duplicación parcial nav row styles drawer vs `.navLink` sidebar — requiere refactor compartido mayor; vars row mitigan duplicación numérica.
- `admin-shell.css` `rgba(31,26,20,0.05)` mobile header — global, fuera scope.
- Light theme QA manual — tokens responden vía CSS vars existentes; validación visual pendiente.

## Tokenización local

Tokens añadidos/refinados en `.admin-mobile-drawer`:

| Token | Uso |
|-------|-----|
| `--drawer-row-min-height/padding/gap` | Nav links, theme toggle, logout |
| `--drawer-active-bg-hover` | Active hover |
| `--drawer-active-accent` | Barra lateral active |
| `--drawer-overlay-scrim` | Overlay sin rgb raw |
| `--drawer-shadow-color` | Sombra panel |
| `--drawer-bg-header` | Header surface |
| `--drawer-width` | Ancho responsive |

## Logout icon cleanup

**Opción A aplicada:** Lucide `<LogOut />` en markup drawer + `logoutAction` directo (mismo patrón que `AdminSidebar`). CSS mask SVG eliminado.

## Drawer width / tablet notes

- Default: `min(88vw, 360px)`.
- Tablet vertical (`768px–899px`): `min(88vw, 420px)`.
- Mobile estrecho (360–390): sigue usando `88vw` — no regresión.

## Light theme notes

Drawer/topbar usan `--bg-surface`, `--text-primary`, etc. que cambian con `data-dashboard-theme`. Sin hardcodes light legacy restantes en drawer CSS. Contraste light: **preserved by tokens** — QA manual recomendado.

## A11y preservada

- Focus trap, Escape, overlay, close, restore focus, scroll lock — lógica TSX intacta.
- Logout: `type="submit"`, texto visible, icon `aria-hidden`.
- `focus-visible` en logout button añadido al selector compartido.
- `aria-*` dialog/nav sin cambios.

## Qué se preservó

- nav config compartida
- active route logic
- focus trap
- Escape/overlay close
- restore focus
- scroll lock
- theme behavior
- logout behavior (`logoutAction`, submit form)
- desktop sidebar behavior
- admin routes
- dashboard/products logic
- server actions
- DB/schema
- polish visual MH3 (superficie dark, iconos, estados)

## Qué NO se cambió

- no route changes
- no permission changes
- no server changes
- no DB changes
- no dashboard/product changes
- no global token refactor (`app/theme-tokens.css` untouched)
- no visual redesign
- no focus trap rewrite
- `admin-header.css` legacy `.admin-nav-link` (DEFER)
- `components/admin/logout-button.tsx` (desktop/other usages intactos)

## Riesgos / deuda restante

- `.admin-nav-link` dead CSS en `admin-header.css` (~30 líneas).
- Nav row styles aún duplicados conceptualmente drawer CSS vs sidebar module — vars row reducen pero no unifican selectores.
- QA manual light/tablet/desktop pendiente.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass (2026-06-06) |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 17 warnings `@next/next/no-img-element` |

## QA manual recomendado

Checklist MH4 prompt §15 — **pendiente**.

## Próxima fase recomendada

**MH5 — Mobile Admin Nav Final QA & Handoff** (QA manual completo, eliminar `.admin-nav-link` dead CSS, handoff doc).

---

**Date:** 2026-06-06 (MH4)
