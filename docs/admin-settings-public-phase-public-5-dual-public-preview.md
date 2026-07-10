# PUBLIC-5 — Dual Public Preview

## Objetivo

Agregar una vista previa administrativa compartida (`PublicPresencePreview`) con tabs **Landing** / **Catálogo** dentro del módulo Presencia pública, sin fusionar formularios ni cambiar la lógica de guardado.

## Estado anterior

- Landing tenía preview administrativa rica inline en `PublicSettingsForm` (solo encabezado landing).
- Catálogo tenía preview inline mínima (`admin-settings-public-preview-copy`) con headline/badge/microcopy.
- No había forma de ver el otro canal desde cada editor.
- Identidad visual (logo, portada, color) no se visualizaba en contexto catálogo desde el editor de Catálogo.

## Estado nuevo

- `PublicPresencePreview` reutilizable con tabs internos Landing / Catálogo.
- Copy honesto: **Vista previa aproximada** + helper sobre variación en dispositivo/productos.
- Landing integra preview dual reemplazando la preview anterior (sin duplicar).
- Catálogo integra preview dual en panel lateral (layout dos columnas) reemplazando preview inline.
- Default mode: `landing` en `/landing`, `catalog` en `/catalogo`.
- Productos de ejemplo ilustrativos en modo Catálogo (sin consultar DB).

## Archivos modificados

- `components/admin/settings/public-settings-form.tsx` — usa `PublicPresencePreview`; elimina preview inline.
- `components/admin/settings/public-catalog-settings-form.tsx` — layout lateral + `PublicPresencePreview`.
- `components/admin/settings/public-settings.css` — layout editor Catálogo (PUBLIC-5).
- `app/admin/(protected)/settings/public/landing/page.tsx` — pasa `publicCatalogHref`.
- `app/admin/(protected)/settings/public/catalogo/page.tsx` — pasa `businessName`, `publicLandingHref`.

## Archivos creados

- `components/admin/settings/public-presence-preview.tsx`
- `components/admin/settings/public-presence-preview.module.css`
- `docs/admin-settings-public-phase-public-5-dual-public-preview.md`

## Arquitectura del preview

```
PublicPresencePreview (client)
├── Tabs: Landing | Catálogo (role=tablist, no cambia rutas)
├── Tabpanel Landing → mock encabezado landing (reusa .admin-settings-preview--landing)
├── Tabpanel Catálogo → mock hero catálogo + bloques ejemplo
└── Link público contextual según tab activo
```

Props principales:

- Identidad: `businessName`, `logoUrl`, `coverImageUrl`, `primaryColor`
- `landing`: description, instagramUrl, publicUrl
- `catalog`: headline, badge, microcopy, publicUrl
- `defaultMode`: `"landing"` | `"catalog"`
- `catalogNeutralMessage`: fallback si no hay copy de catálogo configurado

Los formularios pasan valores efectivos (publicados + dirty local) directamente.

## Modo Landing

Muestra aproximadamente:

- Logo, nombre, portada, color de marca
- Descripción, Instagram (si existe)
- CTAs ilustrativos
- Bloques de referencia visual inferiores
- Link a landing pública

## Modo Catálogo

Muestra aproximadamente:

- Header con logo + nombre
- Portada, color de marca
- Eyebrow, headline, badge, microcopy
- Grid de productos **ejemplo** (2 cards ficticias)
- CTA ilustrativo "Ver productos"
- Link a catálogo público

Copy de productos: *Bloques de ejemplo para visualizar el encabezado del catálogo.*

## Datos usados

| Fuente | Landing editor | Catálogo editor |
|--------|----------------|-----------------|
| Identidad local | displayLogo/Cover, primaryColor, description, instagram | publishedPresence (server) |
| Catálogo | publishedCatalog (server) | headline/badge/microcopy (local state) |
| URLs | publicLandingHref, publicCatalogHref | publicCatalogHref, publicLandingHref |

No se consultan productos ni categorías.

## Pending/local state

| Editor | Preview reactiva a |
|--------|-------------------|
| Landing | pending logo/cover, color, description, instagram |
| Catálogo | headline, badge, microcopy dirty |

Identidad en Catálogo preview usa valores publicados (sin dirty cross-route — esperado).

## Accesibilidad

- `role="tablist"` / `role="tab"` / `role="tabpanel"`
- `aria-selected`, `aria-controls`, `tabIndex` roving
- Navegación teclado: ArrowRight (Landing→Catálogo), ArrowLeft (Catálogo→Landing)
- Active state con borde + fondo (no solo color)
- `focus-visible` en tabs y links
- Imágenes con `alt`; bloques decorativos con `aria-hidden`
- Links externos (`<a>`) para URLs públicas
- Microfix: `aside` landing usa `aria-label` en lugar de `aria-labelledby` duplicado

## Responsive

- Tabs en grid 2 columnas, min-height 40px (44px mobile)
- Catálogo editor: dos columnas ≥960px; preview arriba en mobile (`order: -1`)
- Product grid: 2 cols desktop, 1 col mobile
- Sin overflow horizontal en smoke browser (390px, 820px, 1440px)

## Qué se preservó

- Formularios separados Landing / Catálogo
- `PublicPresenceReadiness` en ambos editores
- Dirty state local, pending notices, save flows
- Upload flow, Brand Palette, `useActionState` + `startTransition` (Landing)
- `<form action={formAction}>` (Catálogo)
- Server actions, rutas, `components/public/**`

## Qué NO se tocó

- `components/public/**` (solo auditoría)
- Server actions, DB, RLS, Storage
- Uploads, Brand Palette internals
- Índice `/admin/settings/public`
- Preview pixel-perfect / iframe de páginas reales

## QA

### Landing

- [x] Preview dual visible
- [x] Tab Landing activo por defecto
- [x] Tab Catálogo alternable
- [x] Una sola preview (`Vista previa aproximada`)
- [x] Readiness visible
- [x] Sin overflow (390px smoke)

### Catálogo

- [x] Preview dual visible
- [x] Tab Catálogo activo por defecto
- [x] Headline dirty actualiza preview
- [x] Una sola preview
- [x] Readiness visible
- [x] Layout lateral desktop / apilado mobile

## Validaciones

```bash
npx tsc --noEmit   # ✅
npm run build      # ✅
npm run lint       # ❌ flake ESLint 9 (preexistente)
```

## Deuda restante

- Identidad dirty en preview Catálogo (requiere dirty state cross-route o editar desde Landing)
- Readiness + preview compacto en índice `/admin/settings/public` (opcional)
- Eliminar CSS legacy no usado (`admin-settings-public-preview-copy`, landing-preview-panel CTA si orphaned)

## Próxima fase

Consolidación opcional del índice de Presencia pública con resumen de readiness + links, o polish cross-route de identidad en preview Catálogo sin dirty state global.
