# Board / Orders Execution Area — Phase B9.6b — Admin Layout Footer Rollout

## Objetivo

Extender `AdminFooter` desde el pilot local del dashboard hacia el layout admin protegido, con un único punto de montaje y sin duplicación.

## Contexto

Referencias revisadas:

| Documento | Estado |
|-----------|--------|
| `board-orders-execution-area-phase-b9-6.md` | ✓ — pilot en dashboard |
| `board-orders-execution-area-phase-b9-6c.md` | ✓ — cleanup inferior; deuda rollout global |
| `admin-footer-board-bottom-area-audit.md` | ✓ — recomendación Opción C + rollout gradual |
| `board-orders-execution-area-phase-b9-final-qa.md` | ✓ |

B9.6 creó `AdminFooter` y lo montó sólo en `admin-dashboard-orders.tsx`. B9.6c eliminó context panel y CTAs legacy; el footer pilot quedó como único elemento inferior del dashboard.

## Decisión de ubicación

**Opción A — `components/admin/admin-shell.tsx`** (elegida).

Motivos:

- `app/admin/(protected)/layout.tsx` renderiza `AdminShell` con `{children}` para todas las rutas bajo `(protected)`.
- `AdminPageLayout` es un wrapper opcional por página, no universal — montar ahí dejaría páginas sin footer.
- Montar en `(protected)/layout.tsx` duplicaría responsabilidad visual que ya vive en el shell (sidebar + topbar + main).
- Un solo import en shell evita footer página por página.

Ubicación exacta:

```tsx
<div className="admin-shell__page-container">
  {children}
  <AdminFooter variant="compact" />
</div>
```

Dentro de `admin-shell__main`, después del contenido, scroll normal (no sticky/fixed).

## Archivos modificados

- `components/admin/admin-shell.tsx`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/admin-dashboard-orders.module.css`

## Archivos creados

- `docs/board-orders-execution-area-phase-b9-6b.md`

## Pilot dashboard cleanup

- Removido `<AdminFooter className={styles.dashboardFooter} variant="compact" />` de `admin-dashboard-orders.tsx`.
- Removido import de `AdminFooter` en dashboard.
- Eliminada clase `.dashboardFooter` de `admin-dashboard-orders.module.css`.
- El dashboard recibe el footer desde el shell; no hay duplicado.

## AdminFooter rollout

- `AdminFooter` montado una vez en `AdminShell` con `variant="compact"`.
- Default conservado: `OrderOps · Panel operacional`.
- Sin links por defecto.
- Componente y CSS sin cambios funcionales (`admin-footer.tsx` / `admin-footer.module.css` intactos).

## Exclusions

| Ruta / área | Footer AdminFooter |
|-------------|-------------------|
| `/admin/login` | ✗ — fuera de `(protected)` |
| `/super-admin/*` | ✗ — layout propio (`app/super-admin`) |
| Sidebar footer (usuario/theme/logout) | ✗ — no modificado |

## Layout / spacing notes

- Footer dentro de `admin-shell__page-container` (flex column, padding existente del shell).
- `AdminFooter` mantiene `margin-top`, `border-top` y tokens `--border-subtle` / `--text-tertiary`.
- No se agregó `position: fixed` ni `sticky`.
- En dashboard, el footer queda al final del page container (después de overview + execution), no dentro de la sección kanban — spacing coherente con otras páginas admin.

## Rutas revisadas (estructura de archivos)

Rutas bajo `app/admin/(protected)/` que heredan `AdminShell` + footer:

- `/admin/dashboard`
- `/admin/products`
- `/admin/categories`
- `/admin/settings/operations`
- `/admin/settings/public` (+ subrutas `catalogo`, `landing`)
- `/admin/team`
- `/admin/kitchen`
- `/admin/orders/[id]`

## Qué se preservó

- dashboard KPIs
- toolbar/session controls
- Nuevo pedido
- search
- kanban persistente
- lane empty states
- tablet 2 columnas
- mobile stacked
- mobile filter compacto
- scroll chaining B9.1
- manual order flow
- realtime/hydration
- sidebar footer usuario/theme/logout

## Qué NO se cambió

- DB/schema
- server actions
- realtime
- hydration
- optimistic callbacks
- orders logic
- session logic
- manual order modal
- toolbar behavior
- cards behavior
- checkout público
- theme tokens/global CSS
- login
- super-admin

## Riesgos encontrados

- Footer global al final del page container puede quedar más abajo en dashboard que en el pilot (dentro de execution section) — aceptable para consistencia cross-page; validar en staging.
- Páginas con mucho scroll vertical muestran footer al final del contenido, no viewport-fixed (decisión de producto).

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass — dashboard 36.1 kB |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` (pre-existentes) |

## QA manual recomendado

### Dashboard

1. KPIs + toolbar + kanban intactos.
2. Footer una sola vez al final de la página.
3. Sin context panel ni CTAs inferiores.

### Otras páginas

4. `/admin/products`, `/admin/categories`, `/admin/settings/operations` — footer al final.

### Exclusions

5. `/admin/login` sin AdminFooter.
6. Super-admin sin AdminFooter.
7. Sidebar footer usuario/theme/logout intacto.

**Estado:** pendiente.

## Deuda técnica restante

- QA staging visual en dashboard vs otras páginas (spacing footer).
- Props `catalogHref` / `canManageProducts` sin uso en dashboard (deuda B9.6c).

## Próxima fase recomendada

**Staging QA final** del área Board / Orders Execution Area V1.0.
