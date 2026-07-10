# Admin Settings — SETTINGS-6.6 Hub Layout & Density Polish

## Objetivo

Mejorar layout y densidad del hub `/admin/settings` para un **Settings Control Center** compacto, escaneable y que aproveche el ancho en desktop.

## Contexto

SETTINGS-6.5 eliminó tabs redundantes e introdujo índice agrupado. QA visual detectó columna angosta, grupos apilados con espacio vacío a la derecha, cards altas en tablet/mobile y headings demasiado fuertes.

## Problema detectado en QA

- Desktop subutiliza ancho (`max-width: 52rem` en columna única)
- Grupos apilados en columna angosta pese al espacio disponible
- Mobile mejoró pero sigue demasiado alto (padding y cards grandes)
- Items no se sienten como filas de settings compactas (acción debajo del título en mobile)
- Headings uppercase demasiado fuertes para Settings

## Archivos modificados

- `components/admin/settings/settings-hub-index.tsx`
- `components/admin/settings/settings-hub-index.module.css`
- `components/admin/settings/settings-shell.module.css`
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `docs/admin-settings-phase-settings-6-6-hub-layout-density-polish.md`

## Cambio principal aplicado

Grid responsive **3 / 2 / 1 columnas** con `max-width` ampliado (72rem tablet, 80rem desktop). Items reestructurados como filas clickeables: título + acción/chevron en la misma fila, descripción debajo. Headings en title case con tipografía más sutil.

## Desktop width usage

- `.index` pasa de `max-width: 52rem` single-column a `max-width: 80rem` con 3 columnas desde `1024px`
- Contenedor shell `.content` con `width: 100%` para alinear con el ancho operacional del shell admin

## Responsive grid

| Breakpoint | Columnas |
|------------|----------|
| `< 640px` | 1 |
| `640px – 1023px` | 2 |
| `≥ 1024px` | 3 |

Grupos: Presencia pública · Operación · Administración (según permisos).

## Mobile density

- Padding de sección reducido (`space-sm` / `space-md`)
- Sin `box-shadow` en mobile
- Gap entre grupos reducido
- Descripciones con `caption` size y line-height compacto
- Touch targets mantenidos vía padding en `.item`

## Clickable rows

- Grid interno por item: headline + acción en fila 1, descripción en fila 2 (full width)
- `display: contents` en `.itemCopy` para layout de fila sin anidar interactives
- Desktop: `Editar →` / `Configurar →` / `Administrar →` alineados a la derecha
- Mobile: sólo chevron visible; label en `aria-label` y sr-only clip
- Hover/active con `--bg-surface-soft` y `--accent-muted`

## Typography / headings

- Eliminado `text-transform: uppercase` y letter-spacing fuerte
- Title case natural del copy existente
- Color `--text-secondary` / `--text-muted` para no competir con header "Resumen"

## Footer alignment

Footer global (`AdminFooter`) vive en `admin-shell__page-container` (max 1600px operational). Al expandir el índice a `width: 100%`, el hub y el footer comparten el mismo contenedor de página sin columna angosta intermedia.

## Light/dark notes

Sólo tokens existentes: `--bg-surface`, `--bg-surface-soft`, `--bg-elevated`, `--border-subtle`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--accent-muted`, `--shadow-sm`, `--focus-ring`.

## Qué se preservó

- rutas settings existentes
- `/admin/settings/team`
- `/admin/team` redirect
- SettingsNavigation en subpáginas
- server actions
- DB/schema
- RLS/policies
- permissions
- dashboard/orders/products
- checkout público

## Qué NO se cambió

- no server action changes
- no DB changes
- no RLS changes
- no route changes
- no team logic changes
- no notification logic changes
- no operations logic changes
- no public presence logic changes

## Deuda restante

- Estados opcionales Landing/Catálogo/Equipo (fetch extra — SETTINGS-8)
- ESLint circular config flake en entorno agent
- Next.js `Proxy (Middleware)` deprecation warning
- SETTINGS-7 — Responsive QA & final handoff

## Validaciones ejecutadas

- `npm run build`: pass
- `npx tsc --noEmit`: pass
- `npm run lint`: fail — flake conocido ESLint (`Converting circular structure to JSON` en config validator)

## QA manual recomendado

### Desktop

1. Abrir `/admin/settings`
2. Confirmar contenido usa más ancho (3 columnas)
3. Presencia pública · Operación · Administración
4. Footer alineado al contenedor
5. Cada item es fila clickeable con acción a la derecha
6. Hover/focus visibles

### Tablet

1. 2 columnas o 1 si estrecho
2. Sin overflow horizontal
3. Densidad cómoda

### Mobile

1. Lista compacta 1 columna
2. Sin cards gigantes
3. Título + chevron en misma fila
4. Navegación correcta
5. Sin scroll horizontal
6. Footer OK

### Subpáginas regression

Landing, catálogo, operations, notifications, team mantienen SettingsNavigation.

### App regression

Dashboard, products, `/admin/team` redirect, checkout público.

## Próxima fase recomendada

**SETTINGS-7 — Responsive QA & final handoff**
