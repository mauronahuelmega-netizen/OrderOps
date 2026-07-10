# PUBLIC-4 — Unified Public Presence Readiness

## Objetivo

Reemplazar el checklist centrado solo en Landing (`PublicLandingReadiness`) por un readiness unificado de **Presencia pública** que cubra Identidad, Landing, Catálogo y Publicación, sin modificar la lógica de guardado existente.

## Estado anterior

- `PublicLandingReadiness` evaluaba solo campos de Landing: logo, portada, descripción, color de marca e Instagram.
- El copy visible decía "Estado de landing".
- Catálogo no tenía checklist de readiness.
- No había visibilidad cross-sección (p. ej. estado del catálogo desde Landing).

## Estado nuevo

- `PublicPresenceReadiness` centraliza el checklist del módulo con cuatro secciones: Identidad, Landing, Catálogo, Publicación.
- Copy unificado: **Estado de presencia pública** con subtítulo *Revisá qué partes de tu presencia pública ya están listas para tus clientes.*
- Landing integra el readiness completo con dirty state local.
- Catálogo integra variante `compact` con dirty state local de headline, badge y microcopy.
- `PublicLandingReadiness` queda como shim deprecado que re-exporta desde `public-presence-readiness`.

## Archivos modificados

- `components/admin/settings/public-settings-form.tsx` — usa `PublicPresenceReadiness`; recibe `publishedCatalog` y `publication`.
- `components/admin/settings/public-catalog-settings-form.tsx` — agrega `PublicPresenceReadiness` compact; recibe `publishedPresence` y `publication`.
- `components/admin/settings/public-landing-readiness.tsx` — shim deprecado (re-export).
- `components/admin/settings/public-landing-readiness.module.css` — deprecado; estilos movidos al nuevo módulo.
- `app/admin/(protected)/settings/public/landing/page.tsx` — select ampliado con campos de catálogo.
- `app/admin/(protected)/settings/public/catalogo/page.tsx` — select ampliado con campos de identidad/landing.

## Archivos creados

- `components/admin/settings/public-presence-readiness.tsx`
- `components/admin/settings/public-presence-readiness.module.css`
- `docs/admin-settings-public-phase-public-4-unified-readiness.md`

## Modelo de readiness

El componente recibe señales locales por sección:

| Sección | Campos | Fuente en Landing | Fuente en Catálogo |
|---------|--------|-------------------|-------------------|
| Identidad | Logo, Portada, Color de marca | Estado local + pending uploads/color | Valores publicados (server) |
| Landing | Descripción, Instagram | Estado local + pending | Valores publicados (server) |
| Catálogo | Título, Badge, Microcopy | Valores publicados (server) | Estado local + pending |
| Publicación | URL pública | slug + publicLandingHref | slug + publicCatalogHref |

Helpers reutilizados:

- `getFieldReadinessStatus` — campos obligatorios
- `getOptionalFieldReadinessStatus` — campos recomendados (Instagram, Badge, Microcopy)
- `getAssetReadinessStatus` — logo y portada
- `buildPublicPresenceReadinessSections` — deriva secciones desde props

Variantes:

- `panel` (default) — Landing editor
- `compact` — Catálogo editor (menos padding; oculta subtítulo en mobile)

## Estados soportados

| Estado interno | Label visible | Regla |
|----------------|---------------|-------|
| `ready` | Listo | Valor publicado o presente |
| `pending` | Pendiente | Falta valor obligatorio |
| `pending-save` | Pendiente de guardar | Dirty state local activo |
| `optional` | Opcional | Recomendado pero no obligatorio |

## Integración en Landing

`PublicSettingsForm` pasa:

- `identity`: `hasLogo`, `hasCover`, `primaryColor`, flags `pendingLogo`, `pendingCover`, `pendingColor`
- `landing`: `description`, `instagramUrl`, flags `pendingDescription`, `pendingInstagram`
- `catalog`: valores publicados desde `publishedCatalog` (sin dirty local)
- `publication`: `slug` y `publicUrl`

No se modificó submit, upload flow, Brand Palette, preview ni `useActionState` + `startTransition`.

## Integración en Catálogo

`PublicCatalogSettingsForm` renderiza `PublicPresenceReadiness variant="compact"` al inicio del `<form action={formAction}>`.

Pasa dirty flags para headline, badge y microcopy; identidad/landing desde `publishedPresence` del server.

## Qué se preservó

- Formularios separados (Landing y Catálogo).
- Server actions sin cambios.
- Rutas `/admin/settings/public/landing` y `/admin/settings/public/catalogo`.
- `PublicPresenceEditorShell` (PUBLIC-2).
- Dirty state local por formulario (PUBLIC-3 en Catálogo).
- Upload flow y Brand Palette en Landing.
- `<form action={formAction}>` en Catálogo.

## Qué NO se tocó

- `components/public/**`
- `public-asset-upload.tsx`, `brand-palette*`
- Server actions, DB, RLS, Storage
- Preview dual (PUBLIC-5)
- Dirty state global cross-route
- Índice `/admin/settings/public` (readiness compacto opcional — no implementado; requeriría query adicional)

## QA

### Landing (`/admin/settings/public/landing`)

- [ ] Título: "Estado de presencia pública"
- [ ] Secciones: Identidad, Landing, Catálogo, Publicación
- [ ] Cambiar descripción → Pendiente de guardar
- [ ] Cambiar color → Pendiente de guardar
- [ ] Seleccionar logo/portada → Pendiente de guardar
- [ ] Guardar → Pendiente de guardar desaparece; feedback OK
- [ ] Sin warning `useActionState`; upload y preview intactos

### Catálogo (`/admin/settings/public/catalogo`)

- [ ] Checklist visible (compact)
- [ ] Cambiar headline/badge/microcopy → Pendiente de guardar
- [ ] Guardar → estados actualizados; feedback OK
- [ ] `<form action={formAction}>` sin warning

### Índice (`/admin/settings/public`)

- [ ] Links a Landing y Catálogo funcionan
- [ ] Sin regresiones de navegación PUBLIC-1

## Validaciones

```bash
npx tsc --noEmit
npm run build
npm run lint
```

Nota: `npm run lint` puede fallar por flake conocido de ESLint 9 (circular config) — no corregir en esta fase.

## Deuda restante

- Readiness compacto en índice `/admin/settings/public` (opcional).
- Eliminar `public-landing-readiness.module.css` cuando no queden referencias.
- Coordinación cross-route de dirty state (futuro).
- Preview dual unificada (PUBLIC-5).

## Próxima fase

**PUBLIC-5** — Preview dual o experiencia de preview compartida entre Landing y Catálogo, sin fusionar formularios.
