# Admin Sidebar Enterprise Polish — S1

## Objetivo

Elevar el sidebar admin a nivel visual premium SaaS enterprise, alineado con el dashboard operacional V1.0 — sin cambiar rutas, auth, permisos ni lógica de theme.

## Contexto

Post Board V1.0 el shell lateral debía comunicar identidad del negocio, navegación protegida y cuenta operador con el mismo cuidado que KPIs + Kanban + AdminFooter.

Referencias: `board-orders-execution-area-v1-final-handoff.md`, B9.7/B9.8.

## Archivos modificados

- `components/admin/layout/admin-sidebar.tsx`
- `components/admin/layout/admin-sidebar.module.css`
- `components/admin/layout/admin-theme-toggle.tsx` — control apariencia (parte del footer sidebar)
- `components/admin/layout/admin-brand.tsx` — copy `Panel operacional`
- `components/admin/layout/admin-brand.module.css` — drawer tenant header 40px + tokens

## Archivos creados

- `docs/admin-sidebar-enterprise-polish-s1.md`

## Cambios aplicados

| Área | Cambio |
|------|--------|
| Tenant header | Logo 40px, nombre semibold, subtitle `Panel operacional` |
| Nav active | Rail izquierdo sutil, surface tenue, sin bloque azul saturado |
| Theme toggle | `Apariencia` + switch ☀ track ● 🌙 (misma lógica storage/DOM) |
| Account block | Orden: avatar/email → apariencia → cerrar sesión |
| Spacing | Nav gap, footer block, header padding intencional |
| Collapsed | Iconos centrados; apariencia compacta sun/moon |

## Tenant identity header

- Desktop sidebar expandido: `brandIcon` 40×40px, `brandName` 650 weight, kicker muted.
- Mobile drawer: `AdminBrand` drawer variant actualizado a 40px y tokens `--border-subtle` / `--text-muted`.
- Copy: `Panel del negocio` → **`Panel operacional`**.

## Navigation active state

- Removido look `--nav-active-bg` azul genérico en favor de `color-mix` sobre `--text-primary`.
- Rail 2px izquierdo discreto.
- Iconos inactivos `--text-muted`; activos `--text-primary`.
- Hover surface suave en items inactivos.

## Theme toggle

- Ya no muestra `Modo Oscuro` / `Modo Claro` como nav item.
- Layout: `Apariencia` + íconos Sol + track + Luna.
- `localStorage("orderops-theme")` y `data-dashboard-theme` sin cambios.
- `aria-label`: `Cambiar a modo oscuro` / `Cambiar a modo claro`.

## Account block

```txt
[L] email@...
Apariencia      ☀ ● 🌙
Cerrar sesión
```

- Email truncado con `title` tooltip nativo.
- Logout sin avatar circular duplicado; icono inline muted.
- Hover logout sutil, no rojo agresivo.

## Iconography polish

- Nav icons 20px, stroke 1.8 (sin cambiar set Lucide).
- Alineación óptica 24px hit box.
- Consistencia stroke en logout/theme.

## Light/dark behavior

- Sidebar usa `--bg-surface`, `--border-subtle`, `--text-*` existentes.
- Active/hover con `color-mix` — legible en light y dark.
- Drawer brand deja hardcoded `#fff` por tokens en `admin-brand.module.css`.

## Mobile drawer notes

- Header tenant mejorado vía `admin-brand` drawer variant.
- Nav items del drawer siguen estilos `admin-mobile-drawer.css` (fuera scope S1) — **deuda**: active state drawer aún estilo legacy oscuro.
- Footer drawer (email + logout) sin theme toggle integrado todavía — **deuda**.

## Desktop collapsed notes

- Ancho 72px: nav/account/logout/appearance centrados icon-only.
- Labels ocultos hasta hover expand 240px.
- Theme: solo sol/luna visibles collapsed (track oculto).

## Qué se preservó

- rutas existentes (Pedidos, Productos, Equipo, Configuración)
- auth/logout behavior (`logoutAction`)
- theme toggle logic (storage + `data-dashboard-theme`)
- sidebar footer behavior funcional
- dashboard/kanban
- AdminFooter global
- server actions/realtime/DB

## Qué NO se cambió

- navegación IA
- permisos / feature flags nav
- DB/schema
- server actions
- realtime/hydration
- dashboard operativo
- manual order
- checkout público
- theme tokens/global CSS (`theme-tokens.css`, `globals.css`)
- AdminFooter

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass (1er intento) |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` |

## QA manual recomendado

### Desktop

1. Sidebar collapsed/expanded, active rail, theme toggle, logout, dashboard intacto.

### Mobile drawer

2. Header 40px + Panel operacional.
3. Nav touch targets.
4. Light/dark.

### Exclusions

5. Login/super-admin sin sidebar enterprise changes.

**Estado:** pendiente.

## Riesgos / deuda

- Mobile drawer nav/footer no unificados con account block S1 (archivos `admin-mobile-drawer.*` fuera scope).
- Drawer sin theme toggle en footer — sólo desktop sidebar.
- `admin-mobile-drawer.css` active links aún bloque oscuro saturado.

## Próxima fase recomendada

**S1b — Mobile Drawer Enterprise Polish** (opcional) o **Staging QA visual** → **Cash Closing / Session Reports**.
