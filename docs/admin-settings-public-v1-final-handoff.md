# Admin Settings — Public Presence V1 Final Handoff

## Estado

**PUBLIC PRESENCE V1 — CLOSED**

Resultado: **PASS WITH DEBT** (deuda documentada abajo; sin bloqueos funcionales conocidos).

Fases completadas:

| Fase | Título | Estado |
|------|--------|--------|
| PUBLIC-1 | Unified Public Presence IA | ✅ |
| PUBLIC-2 | Public Presence Editor Shell | ✅ |
| PUBLIC-3 | Catalog Dirty State Parity | ✅ |
| PUBLIC-4 | Unified Public Presence Readiness | ✅ |
| PUBLIC-4-QA | Unified Readiness Browser Smoke | ✅ |
| PUBLIC-5 | Dual Public Preview | ✅ |
| PUBLIC-6 | Public Index Readiness Summary | ✅ |
| PUBLIC-CLEANUP-1 | Public Presence Legacy Cleanup | ✅ |
| PUBLIC-HANDOFF-1 | Public Presence V1 Final Handoff | ✅ |

## Resumen ejecutivo

Presencia pública V1 entrega una experiencia admin unificada para configurar la landing y el catálogo público del negocio: overview ejecutivo en `/admin/settings/public`, editores separados con shell común, readiness unificado de cuatro secciones (Identidad, Landing, Catálogo, Publicación), preview dual aproximada sin iframe, dirty state en ambos formularios y cleanup de componentes legacy.

No se implementó editor único, dirty state global, sticky save bar ni cambios en server actions / DB / storage.

## Objetivo del epic

Consolidar la IA y la experiencia de configuración de canales públicos (landing + catálogo) dentro de Admin Settings, con paridad de guardado, confianza de publicación (readiness) y preview orientativa, sin tocar el runtime público (`components/public/**`).

## Rutas finales

| Ruta | Rol | Permiso página |
|------|-----|----------------|
| `/admin/settings` | Hub Settings; card única **Presencia pública** → `/admin/settings/public` | `manageNotifications` |
| `/admin/settings/public` | Overview ejecutivo (PUBLIC-6) | `manageNotifications` (edición requiere `managePublicSettings`) |
| `/admin/settings/public/landing` | Editor Landing (logo, portada, color, descripción, Instagram) | `managePublicSettings` |
| `/admin/settings/public/catalogo` | Editor hero catálogo (headline, badge, microcopy) | `managePublicSettings` |

**Navegación Settings:** tab única **Presencia pública** → `/admin/settings/public` (no tabs separadas Landing/Catálogo en `SettingsNavigation`).

**Enlaces públicos:** `/b/[slug]` y `/b/[slug]/catalogo` cuando existe `slug`.

## Arquitectura final

```
SettingsShell
├── /admin/settings/public
│   └── PublicPresenceSummary (SSR business fields)
│
├── /admin/settings/public/landing
│   └── PublicPresenceEditorShell (activeSection: landing)
│       └── PublicSettingsForm
│           ├── PublicAssetUpload (logo, portada)
│           ├── BrandPaletteControl
│           ├── PublicPresenceReadiness
│           └── PublicPresencePreview (defaultTab: landing)
│
└── /admin/settings/public/catalogo
    └── PublicPresenceEditorShell (activeSection: catalog)
        └── PublicCatalogSettingsForm
            ├── PublicPresenceReadiness
            └── PublicPresencePreview (defaultTab: catalog)
```

**CSS compartido:** `public-settings.css` (formularios + preview landing). Módulos CSS por componente nuevo (shell, readiness, preview, summary).

**Eliminado en CLEANUP:** `PublicLandingReadiness`, `PublicPresencePanel`, `PublicPresenceIndex`, CSS preview legacy.

## Componentes principales

| Componente | Archivo | Rol |
|------------|---------|-----|
| `PublicPresenceSummary` | `public-presence-summary.tsx` | Overview índice: estado general, section cards, readiness compact, accesos rápidos |
| `PublicPresenceEditorShell` | `public-presence-editor-shell.tsx` | Wrapper común editores; nav Landing/Catálogo; link externo |
| `PublicPresenceReadiness` | `public-presence-readiness.tsx` | UI checklist unificado |
| `public-presence-readiness-model` | `public-presence-readiness-model.ts` | Lógica server-safe (summary + readiness) |
| `PublicPresencePreview` | `public-presence-preview.tsx` | Preview dual tabs Landing/Catálogo |
| `PublicSettingsForm` | `public-settings-form.tsx` | Form Landing + uploads + palette |
| `PublicCatalogSettingsForm` | `public-catalog-settings-form.tsx` | Form catálogo hero |
| `PublicAssetUpload` | `public-asset-upload.tsx` | Upload logo/portada (sin cambios en epic PUBLIC) |
| `BrandPaletteControl` | `brand-palette-control.tsx` | Selector color marca (sin cambios en epic PUBLIC) |

## Flujo de datos

1. **Páginas server** (`page.tsx`) cargan campos de `businesses` vía Supabase server client.
2. **Props iniciales** pasan a formularios client como `initialValues` / `publishedPresence`.
3. **Landing:** estado local + `useActionState` + `startTransition` para submit (incluye uploads previos en FormData).
4. **Catálogo:** estado local controlado + `<form action={formAction}>` + `useActionState` (sin `startTransition`).
5. **Post-save:** `router.refresh()` rehidrata `initialValues`; dirty state vuelve a limpio.
6. **Summary índice:** una query SSR; sin productos/categorías.

## Server actions involucradas

| Action | Archivo | Consumidor | Campos |
|--------|---------|------------|--------|
| `updatePublicBusinessSettingsAction` | `app/admin/(protected)/settings/public/actions.ts` | `PublicSettingsForm` | description, primary_color, logo_url, cover_image_url, instagram_url |
| `updateCatalogHeroSettingsAction` | idem | `PublicCatalogSettingsForm` | catalog_hero_headline, catalog_hero_badge, catalog_hero_microcopy |

**No modificar** sin fase dedicada: validación, revalidate paths, permisos `managePublicSettings`.

## Storage / uploads

- Uploads vía `PublicAssetUpload` + storage existente (fuera de scope PUBLIC epic).
- Landing dirty state incluye assets pendientes (logo/portada) con banner `admin-settings-landing-preview-panel__pending`.
- **HANDOFF QA:** upload real E2E no re-ejecutado (deuda P1 deploy QA).

## Readiness

Cuatro secciones evaluadas por `public-presence-readiness-model.ts`:

- **Identidad:** logo, portada, color
- **Landing:** descripción, Instagram (opcional)
- **Catálogo:** headline, badge, microcopy
- **Publicación:** slug / URL pública

Estados: `Listo`, `Opcional`, `Pendiente de guardar` (cuando hay dirty local en editor).

**Índice:** summary cards + checklist compacto. **Editores:** un checklist por página (no duplicado).

## Preview dual

- Componente `PublicPresencePreview` con tabs `Landing` / `Catálogo`.
- Alterna sin cambiar ruta; `defaultTab` según editor activo.
- Copy: "Vista previa aproximada" — no iframe, no fetch productos/categorías.
- Landing preview responde a cambios locales de landing; catálogo tab a cambios de hero catálogo.
- CTA externo "Ver landing/catálogo pública" en preview.

## Dirty state y save flow

### Landing (`public-settings-form.tsx`)

- Dirty: descripción, color, Instagram, assets pendientes.
- Submit: `startTransition` + `useActionState` (evita warning useActionState).
- Botón: Sin cambios → Guardar cambios → Guardando... → Guardado.
- Feedback: "Cambios publicados correctamente."

### Catálogo (`public-catalog-settings-form.tsx`)

- Dirty: headline, badge, microcopy vs `initialValues`.
- Submit: `<form action={formAction}>` nativo.
- Mismos estados de botón y feedback que Landing (PUBLIC-3 parity).

## Índice `/admin/settings/public`

`PublicPresenceSummary` muestra:

- Estado general (conteo elementos listos)
- Cards Identidad / Landing / Catálogo / Publicación con badges y links a editores
- Readiness compacto
- Accesos rápidos (editar + ver público)

No es un editor. No duplica el hub `/admin/settings` (hub = acceso global Settings; índice = detalle presencia pública).

## Responsive

**HANDOFF QA** (`scrollWidth === clientWidth`):

| Viewport | `/public` | `/landing` | `/catalogo` |
|----------|-----------|------------|-------------|
| 1440px | ✅ sin overflow | ✅ | ✅ |
| 820px | ✅ | ✅ | ✅ |
| 390px | ✅ | ✅ | ✅ |

Resource links, readiness, preview dual y botones guardar accesibles en mobile. Drawer/header mobile intactos.

## Accesibilidad

- Regions con `aria-label` en summary y readiness.
- Tabs preview con roles `tab` / `selected` / `focus` visible en QA.
- Sin warnings aria inválidos observados en sesión HANDOFF.
- Links externos con estilos `:focus-visible` en shell.

## QA final

### Rutas

| Ruta | Resultado |
|------|-----------|
| `/admin/settings` | ✅ Card única Presencia pública; sin cards Landing/Catálogo separadas |
| `/admin/settings/public` | ✅ Overview, secciones, readiness, accesos rápidos; no parece editor |
| `/admin/settings/public/landing` | ✅ Shell, readiness único, preview dual, save, uploads/palette visibles |
| `/admin/settings/public/catalogo` | ✅ Shell, readiness, preview dual (tab Catálogo), form action intacto |

### Guardado

**Landing — E2E HANDOFF:** ✅

1. Editar descripción → aviso dirty + readiness "Pendiente de guardar"
2. Guardar → Guardando... → Guardado
3. Feedback "Cambios publicados correctamente."
4. Readiness vuelve a Listo
5. Datos demo restaurados tras QA

**Catálogo — E2E HANDOFF:** ⏭ **PASS por PUBLIC-3** (no re-ejecutado E2E en esta sesión por limitación de automatización en inputs controlados). Código y UI de dirty/save verificados; pendiente reconfirmación manual en deploy QA (deuda P1).

### Preview dual

- ✅ Tabs alternan sin cambiar ruta
- ✅ Active state y focus visibles
- ✅ Preview identificada como aproximada
- ✅ Sin iframe
- ✅ Link externo cambia según tab activo

### Console QA

Rutas `/public`, `/landing`, `/catalogo`:

- ✅ Sin `useActionState` outside transition (save Landing ejecutado sin warning)
- ✅ Sin hydration mismatch observado
- ✅ Sin duplicate keys observados
- Sin auditoría exhaustiva de consola en las tres rutas; sin warnings nuevos atribuibles a PUBLIC en sesión activa

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** (rutas public presentes) |
| `npm run lint` | **FAIL** — flake ESLint 9 `Converting circular structure to JSON` (preexistente) |

## Qué se preservó

- Server actions y contratos FormData
- DB, RLS, storage, uploads, Brand Palette
- `components/public/**`, productos, categorías
- Rutas públicas `/b/[slug]/*`
- Formularios separados Landing / Catálogo
- Permisos `managePublicSettings` / `manageNotifications`

## Qué NO se tocó

- Server action logic
- Schema / migrations / RLS
- Storage buckets y políticas
- Brand Palette internals
- Middleware / proxy
- ESLint config
- Docs históricos PUBLIC-1…6 y CLEANUP (registro; no reescritos)

## Deuda restante

Priorizada:

| Prioridad | Item |
|-----------|------|
| **P1** | Upload real E2E logo/portada en QA final de deploy |
| **P1** | Reconfirmar save E2E catálogo en deploy QA (PUBLIC-3 cubre; HANDOFF no re-ejecutó) |
| **P2** | Sticky save bar / unsaved changes UX global |
| **P2** | Dirty state cross-route si `/public` se convierte en editor único |
| **P2** | CSS modularization: migrar `public-settings.css` a módulos |
| **P3** | Sweep documental docs históricos (referencias a componentes eliminados) |
| **DEVX** | ESLint 9 flat config circular JSON |
| **DEVX** | Next 16 middleware → proxy migration |

## Riesgos conocidos

| Riesgo | Mitigación |
|--------|------------|
| Preview aproximada ≠ pixel-perfect público | Copy explícito + link "Ver landing/catálogo pública" |
| `public-settings.css` global compartido | Documentado; modularizar en fase futura |
| Docs históricos mencionan `PublicPresencePanel` | No afecta runtime; handoff es fuente de verdad V1 |
| Upload E2E no revalidado en HANDOFF | P1 deploy QA |

## Próximas fases recomendadas

1. **Deploy / staging QA** — upload E2E + save catálogo E2E + multi-rol
2. **SETTINGS-8 o PUBLIC-7** — sticky save bar / beforeunload (producto)
3. **PUBLIC-CSS-1** — modularizar CSS legacy compartido
4. Continuar otros módulos Settings (Operaciones, Notificaciones, Equipo) sin tocar Presencia pública salvo bugfix

## Criterios de cierre

- [x] Handoff final creado
- [x] Handoff general Settings actualizado
- [x] QA rutas cuatro URLs
- [x] Save Landing E2E validado
- [x] Save Catálogo validado vía PUBLIC-3 + código (E2E HANDOFF deferred P1)
- [x] Preview dual validada
- [x] Readiness validado
- [x] Responsive 1440 / 820 / 390 sin overflow global
- [x] TypeScript y build PASS
- [x] Sin features nuevas ni cambios server/DB/storage
- [x] Sin warnings useActionState en save Landing ejecutado

## Instrucciones para futuros agentes

1. **No refactorizar** Presencia pública sin fase explícita; el epic está cerrado.
2. **No reintroducir** `PublicPresencePanel`, `PublicLandingReadiness` ni preview inline legacy.
3. **Editores:** mantener formularios separados; cualquier "editor único" es fase nueva con dirty global.
4. **Readiness:** extender solo vía `public-presence-readiness-model.ts` + UI en `public-presence-readiness.tsx`.
5. **Preview:** cambios solo en `public-presence-preview.tsx`; no iframe sin fase dedicada.
6. **Server actions:** cualquier cambio requiere fase con tests de regresión save + revalidate.
7. **QA mínimo** tras cambios: las cuatro rutas + save en ambos formularios + tabs preview.
