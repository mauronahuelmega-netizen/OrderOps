# Admin Loading + Operational Alerts Phase A1 — Theme-Safe Admin Loading Screen

## Objetivo

Eliminar el flash blanco al recargar `/admin/dashboard` (y rutas admin) cuando el usuario tiene dark theme guardado en `localStorage`.

## Contexto

Phase A0 identificó que `AdminShell` muestra `Cargando configuración…` con tokens CSS correctos, pero `<html>` arranca sin `data-dashboard-theme` hasta que monta `AdminThemeToggle` en el sidebar — que no existe durante el loading state.

## Archivos modificados

- `app/layout.tsx`
- `components/admin/layout/admin-theme-toggle.tsx`

## Archivos creados

- `docs/admin-loading-operational-alerts-phase-a1.md`

## Root cause aplicado

```txt
THEME_BOOTSTRAP_DELAY + LOADING_OUTSIDE_THEME_TOGGLE + DEFAULT_LIGHT_TOKENS
```

## Cambio principal

Script inline mínimo en el root layout que, solo en rutas `/admin/*`, lee `localStorage("orderops-theme")` y aplica `data-dashboard-theme` + `colorScheme` en `<html>` antes del paint de React/`AdminShell`.

## Theme bootstrap implementation

- Ubicación: primer hijo de `<body>` en `app/layout.tsx`
- Guard: `pathname.startsWith("/admin")`
- Storage: `orderops-theme` → `"dark"` | `"light"`
- Atributo DOM: `data-dashboard-theme` (mismo selector que `theme-tokens.css`)
- `suppressHydrationWarning` en `<html>` para evitar warnings por atributo client-only
- No SSR de theme (sin cookie); solo client pre-paint

## AdminThemeToggle sync

- `getInitialTheme()` lee en orden: DOM attribute → localStorage → fallback `"light"`
- Estado inicial `useState` alineado con theme ya bootstrapped
- `useEffect` re-sincroniza attribute + `colorScheme` sin cambiar UX del botón
- Storage key y labels/icons preservados

## AdminShell loading CSS

Sin cambios. `admin-shell.css` ya usa:

```css
background: var(--surface-canvas-bg);
color: var(--surface-canvas-text);
```

Con bootstrap pre-paint, esos tokens resuelven a paleta dark/light correctamente.

## Qué se preservó

- Storage key `orderops-theme`
- `data-dashboard-theme`
- AdminThemeToggle behavior (toggle light/dark)
- AdminShell loading flow
- business settings fetch
- dashboard content

## Qué NO se tocó

- Audio unlock modal
- Audio unlock logic
- Realtime
- Server actions
- DB/Supabase
- Top section
- Toolbar/search/filtros
- Lanes/cards/modal de pedido
- Tokens globales (`theme-tokens.css`, `globals.css`)

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `npm run lint` | ⚠️ No configurado — `next lint` abre setup interactivo de ESLint |
| `npm run build` | ✅ Exit 0 |

## QA manual recomendado

1. Dark reload — loading oscuro, sin flash blanco
2. Light reload — loading claro
3. Sin `orderops-theme` en localStorage — fallback light
4. Toggle persistencia tras reload
5. Dashboard, top section, toolbar, lanes intactos
6. Modal avisos operativos puede aparecer; no modificado en A1
7. Sin hydration warnings en consola

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- Script en root layout afecta todas las rutas `/admin/*` (intencional)
- Rutas públicas no ejecutan bootstrap (guard pathname)
- Modal de avisos sigue con superficie hardcoded (A2)

## Próxima fase recomendada

**A2 — Operational Alerts Modal Tokenization + Microcopy**
