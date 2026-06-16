# Admin Sidebar Enterprise Polish — S1.1 — Theme Control & Collapsed Alignment Fix

## Objetivo

Corregir dos problemas visuales post-S1: copy y compactación del control de tema, y centrado óptico del sidebar colapsado (nav, cuenta, rail activo).

## Contexto

Tras S1, el footer del sidebar mostraba `Apariencia` demasiado largo, el switch light/dark quedaba empujado al borde derecho, los iconos sol/luna eran pequeños, y en rail colapsado (72px) los iconos se veían desplazados a la izquierda por labels ocultos que aún reservaban espacio en flex.

Referencia: `docs/admin-sidebar-enterprise-polish-s1.md`.

## Archivos modificados

- `components/admin/layout/admin-sidebar.module.css`

## Archivos creados

- `docs/admin-sidebar-enterprise-polish-s1-1.md`

## Cambios aplicados

- “Apariencia” cambiado a “Tema”.
- Switch light/dark recompactado.
- Iconos sol/luna aumentados o refinados.
- Iconos collapsed centrados.
- Active rail ajustado para no desplazar iconos.

## Theme label

- Label visual `Apariencia` → **`Tema`** vía `::after` en `.appearanceLabel` (sin tocar lógica del toggle ni `admin-theme-toggle.tsx`).
- `aria-label` del botón se mantiene: `Cambiar a modo oscuro` / `Cambiar a modo claro`.

## Theme switch polish

- `.appearanceControl`: `justify-content: flex-start` + `gap: 0.75rem` (eliminado `space-between` que empujaba el switch al extremo).
- `.appearanceLabel` y `.themeSwitch`: `flex: 0 0 auto` — se leen como un solo control.
- Iconos sol/luna: **18px**, opacidad inactive/active diferenciada (0.62 / 1.0).
- Gap del switch expandido: 8px.

## Collapsed alignment

- `.brandContainer` colapsado: ancho 72px, padding horizontal 0, logo centrado; `.brandText` oculto.
- Nav / account / logout / theme: ancho 56px, `margin-inline: auto`, `gap: 0`, `justify-content: center`.
- `.navText` y `.userInfo` ocultos con `display: none` (no solo `opacity: 0`) para no reservar espacio flex.
- Icon wrappers: `display: grid; place-items: center`.

## Account block alignment

- Avatar, theme (sol/luna compacto sin track), logout icon centrados en el rail colapsado.
- Theme colapsado: label oculto; switch sun/moon visible y centrado.

## Qué se preservó

- navegación existente
- auth/logout behavior
- theme toggle logic
- dashboard/kanban
- AdminFooter global
- server actions/realtime/DB

## Qué NO se cambió

- Rutas, auth, logout handlers
- Theme provider / `localStorage` / `data-dashboard-theme`
- `admin-theme-toggle.tsx` (lógica y DOM label source)
- `admin-shell`, dashboard, kanban, AdminFooter
- DB, server actions, realtime, permisos
- Theme tokens / `globals.css`

## Validaciones ejecutadas

- `npm run build`: **pass** (1er intento, sin flake en `/admin/categories` / `/admin/kitchen`).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / 16 warnings `@next/next/no-img-element` (baseline sin cambios).

## QA manual recomendado

### Drawer abierto (hover desktop / mobile drawer futuro)

1. Abrir `/admin/dashboard`.
2. Expandir sidebar (hover desktop).
3. Confirmar label `Tema`.
4. Confirmar switch compacto junto al label.
5. Confirmar sol/luna legibles (18px).
6. Confirmar switch no pegado al extremo derecho.
7. Email legible; logout usable.

### Collapsed desktop

8. Colapsar sidebar (sin hover).
9. Logo centrado.
10. Nav icons centrados; active icon centrado.
11. Active rail visible sin desplazar icono.
12. Avatar, theme, logout centrados.

### Functional

13. Toggle light/dark funciona.
14. Logout funciona.
15. Nav links funcionan.

**Estado:** pendiente en entorno local/staging.

## Riesgos / deuda

- Label DOM interno sigue diciendo `Apariencia` en `admin-theme-toggle.tsx`; visible es `Tema` vía CSS. Mejora futura: cambiar copy en TSX + `aria-hidden` en label decorativo.
- Mobile drawer footer aún sin theme toggle (deuda S1).
- Build flake ocasional en `/admin/categories` y `/admin/kitchen` (conocido B9.7).

## Próxima fase recomendada

- Staging QA visual del sidebar (expanded + collapsed).
- Mobile drawer parity (theme + active rail).
- Cash Closing / Session Reports (roadmap operacional).
