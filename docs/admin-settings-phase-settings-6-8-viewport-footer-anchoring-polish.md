# Admin Settings — SETTINGS-6.8 Viewport & Footer Anchoring Polish

## Objetivo

Anclar el footer al fondo del viewport en `/admin/settings` cuando el contenido es corto, sin `position: fixed` ni cambios globales que rompan otras páginas.

## Contexto

SETTINGS-6.5–6.7 cerraron IA, grid, densidad y contraste del hub. QA detectó footer flotando arriba con espacio vacío debajo en desktop/tablet.

## Problema detectado en QA

- Footer flotando demasiado arriba
- Demasiado vacío debajo del footer
- Pantalla se siente cortada en desktop/tablet
- Mobile debe respetar footer al fondo cuando haya viewport libre

## Archivos modificados

- `app/admin/(protected)/settings/page.tsx`
- `components/admin/settings/settings-shell.tsx`
- `components/admin/settings/settings-shell.module.css`
- `components/admin/settings/settings-hub-index.module.css`
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `docs/admin-settings-phase-settings-6-8-viewport-footer-anchoring-polish.md`

## Cambio principal aplicado

Prop `anchorViewport` en `SettingsShell`, activada sólo en el hub root. Layout flex column con `flex: 1` en el shell y `margin-top: auto` en el footer global vía selector `:has([data-settings-hub-root])` local al módulo settings-shell.

## Layout audit

```
AdminShell
  admin-shell__page-container (flex column, min-height 100%)
    AdminPageLayout[data-settings-hub-root] (hubViewport, flex 1)
      AdminPageHeader
      frame (flex 1)
        content → SettingsHubIndex
    AdminFooter (margin-top: auto cuando hub root)
```

Footer vive en `admin-shell.tsx`, no en la page. El fix empuja el footer dentro del contenedor flex existente.

## Footer anchoring

- `:global(.admin-shell__page-container:has([data-settings-hub-root]) > footer) { margin-top: auto; }`
- Sin `position: fixed` ni `absolute`
- `anchorViewport` sólo en `/admin/settings` — subpáginas sin el atributo

## Viewport behavior

- Contenido corto: espacio flexible entre hub y footer; footer al fondo del área scrollable (`admin-shell__main`)
- Contenido largo: scroll natural; footer al final del contenido
- `min-height: 100%` en page-container cuando hub root

## Hub spacing

- Eliminado `padding-bottom` redundante en `.index`
- Desktop cards: `+4px` padding vertical en secciones (1024px+)

## Desktop notes

- `admin-shell__main` ya tiene `height: 100%` y scroll en ≥900px
- Hub ocupa altura restante; cards no crecen artificialmente

## Tablet notes

- Grid 2 columnas preservado
- Mismo anchoring flex en viewport intermedio

## Mobile notes

- Column grid `auto 1fr` en shell; main scrollable
- Footer al fondo si hay espacio; al final del scroll si contenido supera viewport

## Subpages regression

`anchorViewport` no se pasa en landing, catálogo, operations, notifications, team. Sin `data-settings-hub-root`, sin cambio de footer.

## Qué se preservó

- arquitectura del hub
- grid 3/2/1
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
- no new data fetches
- no fixed footer
- AdminFooter global sin cambios de componente/CSS

## Deuda restante

- ESLint circular config flake
- Next.js Proxy (Middleware) warning
- SETTINGS-7 — Responsive QA & final handoff

## Validaciones ejecutadas

- `npm run build`: pass
- `npx tsc --noEmit`: pass
- `npm run lint`: fail — flake conocido ESLint (`Converting circular structure to JSON` en config validator)

## QA manual recomendado

Desktop/tablet/mobile footer anchoring, subpáginas sin regresión, app regression.

## Próxima fase recomendada

**SETTINGS-7 — Responsive QA & final handoff**
