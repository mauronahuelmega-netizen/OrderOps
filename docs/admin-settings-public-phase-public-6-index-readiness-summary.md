# PUBLIC-6 — Public Index Readiness Summary

## Objetivo

Convertir `/admin/settings/public` en un resumen ejecutivo de Presencia pública con estado general, readiness compacto y accesos rápidos, sin convertir la ruta en editor ni fusionar formularios.

## Estado anterior

- Índice compacto con `PublicPresenceIndex` (cards Landing / Catálogo).
- Copy: "Elegí un editor".
- Sin datos de business ni readiness en la ruta índice.
- Sin estado general ni accesos públicos centralizados.

## Estado nuevo

- Dashboard compacto con:
  - **Estado general** (elementos principales + opcionales / pendientes).
  - **4 section cards** (Identidad, Landing, Catálogo, Publicación) con pills de estado y links de edición.
  - **`PublicPresenceReadiness` compact** (checklist detallado).
  - **Accesos rápidos** (editar Landing/Catálogo + ver URLs públicas).
- Una query Supabase en `page.tsx` (mismos campos que editores, sin productos/categorías).
- Lógica de readiness extraída a `public-presence-readiness-model.ts` (usable desde server).

## Archivos modificados

- `app/admin/(protected)/settings/public/page.tsx` — carga business + renderiza `PublicPresenceSummary`.
- `components/admin/settings/public-presence-readiness.tsx` — UI client; re-exporta modelo.
- `components/admin/settings/public-presence-summary.module.css` — estilos del overview.

## Archivos creados

- `components/admin/settings/public-presence-summary.tsx`
- `components/admin/settings/public-presence-readiness-model.ts`
- `docs/admin-settings-public-phase-public-6-index-readiness-summary.md`

## Datos usados

Query única en `businesses`:

```txt
slug, logo_url, description, primary_color, cover_image_url, instagram_url,
catalog_hero_headline, catalog_hero_badge, catalog_hero_microcopy
```

Derivados:

- `publicLandingHref` → `/b/{slug}`
- `publicCatalogHref` → `/b/{slug}/catalogo`

Permisos: `requireAdminPermission("manageNotifications")` + `canManagePublicSettings`.

## Modelo de resumen

### Elementos principales (6)

| ID | Campo |
|----|-------|
| logo | Logo |
| cover | Portada |
| brand-color | Color de marca |
| description | Descripción |
| headline | Título del catálogo |
| public-url | URL pública / slug |

### Opcionales (3)

Instagram, Badge, Microcopy.

### Estado general

- Primario: `N de M elementos principales listos`
- Secundario si completo: `K opcional(es) configurado(s)`
- Secundario si incompleto: `P pendiente(s)`

### Section cards

Cada sección muestra pill `X/Y listo` o `X/Y configurado`; Publicación usa `Lista` / `Pendiente`.

## Accesos rápidos

| Acción | Tipo | Destino |
|--------|------|---------|
| Editar Landing | Link interno | `/admin/settings/public/landing` |
| Editar Catálogo | Link interno | `/admin/settings/public/catalogo` |
| Ver Landing pública | `<a>` nueva pestaña | `/b/{slug}` si existe |
| Ver Catálogo público | `<a>` nueva pestaña | `/b/{slug}/catalogo` si existe |

Sin slug: acciones públicas deshabilitadas con hint "Pendiente de publicación".

## Responsive

- Section grid: 1 col mobile → 2 cols tablet → 4 cols desktop.
- Quick actions: 1 col mobile → 2 cols → 4 cols desktop.
- Sin overflow horizontal en smoke (390px).

## Accesibilidad

- Headings jerárquicos: h3 overview / quick actions, h4 section cards.
- Links con texto claro; públicos como `<a>`, edición como `<Link>`.
- Status pills con texto visible (no solo color).
- `focus-visible` en links y acciones.
- Acciones públicas deshabilitadas con `aria-disabled` en `<span>`.

## Qué se preservó

- Editores Landing y Catálogo sin cambios.
- `PublicPresenceReadiness` en editores.
- `PublicPresencePreview` (PUBLIC-5).
- Server actions, DB, rutas de editores.
- Sin dirty state global.

## Qué NO se tocó

- `public-settings-form.tsx`, `public-catalog-settings-form.tsx`, `public-presence-preview.tsx`
- Uploads, Brand Palette, `components/public/**`
- Server actions, DB, RLS, Storage
- Preview dual en índice

## QA

### Índice `/admin/settings/public`

- [x] Resumen de readiness visible
- [x] Estado general calculado (smoke: "6 de 6 elementos principales listos")
- [x] Secciones Identidad / Landing / Catálogo / Publicación
- [x] Accesos rápidos presentes
- [x] Sin hub anterior ("Elegí un editor")
- [x] Sin overflow (390px)

### Editores

No modificados en esta fase — validar manualmente shell/readiness/preview/save.

## Validaciones

```bash
npx tsc --noEmit   # ✅
npm run build      # ✅
npm run lint       # ❌ flake ESLint 9 (preexistente)
```

## Deuda restante

- Reintroducir `PublicPresencePanel` wrapper opcional si se desea card container único.
- Cross-route dirty state en índice (fuera de scope).
- Limpiar `PublicPresenceIndex` si queda sin usos.

## Próxima fase

Polish transversal del módulo (tokenización CSS legacy, limpieza de componentes deprecados) o features operativas fuera de Presencia pública.
