# Admin Mobile Header & Drawer — MH2 Functional Parity

## Objetivo

Paridad funcional y accesibilidad del mobile admin drawer: brand topbar visible, focus trap, theme toggle mobile, aria mejorado — sin rediseño visual enterprise (MH3).

## Contexto

- **MH1:** audit identificó focus trap ausente, brand topbar invisible, theme toggle solo desktop.
- **MH2:** fixes funcionales acotados; drawer visual light legacy se mantiene para MH3.

## Archivos modificados

- `components/admin/admin-mobile-drawer.tsx`
- `components/admin/admin-mobile-drawer.css`
- `components/admin/admin-topbar.tsx`
- `components/admin/layout/admin-brand.tsx`
- `components/admin/layout/admin-brand.module.css`
- `components/admin/layout/admin-nav-list.tsx`
- `components/admin/layout/admin-theme-toggle.tsx`
- `components/admin/layout/admin-sidebar.module.css`

## Archivos creados

- `docs/admin-mobile-header-drawer-phase-mh2-functional-parity.md`

## Cambio principal aplicado

1. `AdminBrand variant="topbar"` — texto visible en mobile header.
2. Focus trap Tab/Shift+Tab dentro del drawer + restore focus al hamburger.
3. `AdminThemeToggle layout="drawer"` en footer del drawer.
4. Aria labels en español consistentes; `aria-labelledby` en dialog.

## Brand/topbar fix

- Topbar usa `variant="topbar"` (module CSS tokenizado), no sidebar collapsed styles.
- Muestra logo + nombre + “Panel operacional”.

## Focus trap

- Al abrir: focus al botón cerrar.
- Tab / Shift+Tab ciclan focusables dentro del panel (`FOCUSABLE_SELECTOR`).
- Al cerrar: focus vuelve al hamburger (`menuButtonRef`).
- Sin dependencias externas.

## Escape / overlay / scroll lock

| Comportamiento | Estado |
|----------------|--------|
| Escape | ✓ `preventDefault` + `closeDrawer` |
| Overlay click | ✓ |
| Close button | ✓ |
| Body scroll lock | ✓ `admin-drawer-open` en html/body (preservado) |
| Route change close | ✓ `useEffect([pathname])` |

## Aria improvements

- Hamburger: `Abrir menú de administración`, `aria-expanded`, `aria-controls`.
- Dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby={ADMIN_MOBILE_DRAWER_TITLE_ID}`.
- Close/overlay: `Cerrar menú de administración`.
- Nav: `Navegación de administración` (sidebar + drawer).
- Active links: `aria-current="page"` (ya existía, preservado).

## Theme toggle mobile

- Reutiliza `AdminThemeToggle` con `layout="drawer"`.
- Misma lógica `localStorage` + `data-dashboard-theme` que desktop.
- Estilos mínimos `appearanceControlDrawer` en sidebar module (solo drawer layout).

## Nav parity / active state

- Misma config `admin-nav-config.ts` + filtros role/feature.
- `onNavigate={closeDrawer}` al click link (preservado/mejorado con `closeDrawer` estable).
- Iconos nav drawer: **deferred MH3** (text-only preservado).

## Account/logout parity

- Email en `<p className="admin-mobile-drawer__user-label">`.
- Logout via `LogoutButton` preservado.
- Avatar block: **deferred MH3**.

## Qué se preservó

- nav config compartida
- active route logic
- desktop sidebar behavior
- desktop theme behavior
- logout behavior
- admin routes
- dashboard/products logic
- server actions
- DB/schema
- drawer visual light (MH3)

## Qué NO se cambió

- no visual redesign enterprise
- no dark drawer polish
- no token pass global del drawer
- no legacy CSS cleanup amplio
- no route changes
- no permission changes
- no server changes
- no nav icons en drawer

## Riesgos / deuda

- `appearanceControlDrawer` usa colores hardcoded alineados al drawer light — MH3 tokenizará.
- Theme toggle drawer styling duplica pill nav visual — OK para MH2.
- Focus trap no usa `inert` en background — Tab trap suficiente para MH2.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass (2026-06-06) |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 17 warnings `@next/next/no-img-element` |

**Nota lint:** 17 warnings vs 16 baseline MH1 — +1 por `<img>` en `AdminBrand variant="topbar"` (mismo rule, preexistente en brand).

## QA manual recomendado

Ver checklist MH2 prompt §17 — **pendiente** en esta sesión.

## Próxima fase recomendada

**MH3 — Mobile Drawer Enterprise Visual Polish** (dark-aligned surface, nav icons, account block, token pass drawer).

---

**Date:** 2026-06-06 (MH2)
