# Admin Sidebar — S1.2 Collapsed Theme Active Icon Polish

## Objetivo

Reducir ruido visual del control de tema en el **sidebar desktop colapsado**, mostrando sólo el ícono del tema activo (Sol/Luna) en lugar del switch completo.

## Contexto

- S1/S1.1 pulieron sidebar desktop (hover expand 72px → 240px).
- MH2–MH4.1 pulieron mobile drawer/topbar con toggle completo.
- El sidebar colapsado usa `:not(:hover)` en CSS; no hay state JS de collapsed.

## Problema visual

En columna angosta (72px) el footer mostraba:

```txt
avatar
Sol + toggle track + Luna
logout
```

Demasiado contenido para el ancho colapsado; sensación menos premium.

## Cambios aplicados

**Archivo:** `components/admin/layout/admin-sidebar.module.css`

Dentro de `@media (min-width: 900px)` + `.sidebar:not(:hover)`:

- Ocultar ícono inactivo (`.themeSwitchIcon:not(.themeSwitchIconActive)`).
- Mantener oculto toggle track (ya existía).
- Ocultar label “Tema” (ya existía).
- Centrar ícono activo; tamaño 20px; hit area mín. 40×40px.
- Sin cambios en TSX ni lógica de theme.

## Sidebar colapsado

| Theme | Visible |
|-------|---------|
| light | Sol únicamente |
| dark | Luna únicamente |

- Toggle track: oculto.
- Ícono inactivo: oculto.
- Clic en el botón: alterna theme (mismo handler).
- `aria-label`: “Cambiar a modo oscuro/claro” preservado.

## Sidebar desplegado (hover)

Sin cambios:

- Label “Tema”
- Sol + toggle + Luna
- Email, avatar, logout

## Mobile drawer

Sin cambios — `AdminThemeToggle layout="drawer"` usa `.appearanceControlDrawer`; reglas collapsed no aplican.

## A11y

- `button type="button"` preservado.
- `aria-pressed={isDark}` preservado.
- `aria-label` dinámico preservado.
- `focus-visible` en `.appearanceControl` preservado.
- Ícono inactivo oculto sólo visualmente (`display: none`); control sigue siendo un único botón con label accesible.

## Archivos modificados

- `components/admin/layout/admin-sidebar.module.css`

## Archivos creados

- `docs/admin-sidebar-collapsed-theme-active-icon-s1-2.md`

## Qué se preservó

- theme behavior
- theme persistence (`orderops-theme` localStorage)
- desktop sidebar navigation
- logout behavior
- mobile drawer theme toggle (completo)
- admin topbar
- dashboard/checkout/products
- server actions
- DB/Supabase

## Qué NO se cambió

- `admin-theme-toggle.tsx` (lógica/markup)
- `admin-sidebar.tsx`
- mobile drawer / topbar
- theme tokens globales
- rutas / permisos

## Validaciones ejecutadas

```txt
npm run build: pass (Next.js 16.2.9; warning middleware→proxy deprecado)
npx tsc --noEmit: pass
npm run lint: baseline 0 errors / 17 warnings no-img-element (flake ESLint config posible en entorno agente)
```

## QA manual recomendado

### Desktop expanded (hover sidebar)

1. `/admin/dashboard` — sidebar hover → Sol + toggle + Luna.
2. Cambiar tema → persiste.

### Desktop collapsed

1. Sidebar sin hover → light: sólo Sol; dark: sólo Luna.
2. Sin track ni ícono inactivo.
3. Click alterna theme.

### Mobile drawer

1. Toggle completo Tema + Sol + toggle + Luna.

## Riesgos / deuda restante

- QA manual no ejecutada en sesión agente.
- Collapsed detectado por `:hover`, no por state persistente — comportamiento preexistente.

## Próxima fase recomendada

- QA manual S1.2 en desktop + mobile regression.
- S1.3+ polish sidebar footer spacing si aplica.

---

*S1.2 — micro-polish visual sidebar colapsado.*
