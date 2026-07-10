# Admin Settings Public Landing — SETTINGS-PAGE-1A Forensic Audit

## Objetivo

Auditoría forense **solo lectura** de `/admin/settings/public/landing` para documentar arquitectura, data-flow, CSS/layout, QA visual (desktop/tablet/mobile) y deuda antes de la fase de implementación visual. **No se aplicaron fixes.**

## Contexto

- Fase: **SETTINGS-PAGE-1A-AUDIT** (AUDIT ONLY).
- App local: `http://localhost:3000`.
- Cuenta de prueba: owner de **La Burguesía** (`slug: demohamburgueseria`).
- Referencias leídas:
  - `docs/admin-settings-v1-final-handoff.md` — existe; arquitectura Settings V1 cerrada.
  - `docs/admin-settings-staging-qa-1-browser-qa.md` — existe; PASS WITH P2 DEBT en hub/settings general.
  - `docs/admin-settings-phase-settings-7-responsive-qa-final-handoff.md` — existe.
  - `docs/admin-settings-phase-settings-6-8-viewport-footer-anchoring-polish.md` — existe.
  - `docs/admin-settings-phase-settings-6-7-hub-light-density-final-polish.md` — existe.
  - `docs/admin-settings-phase-settings-4-public-presence-polish.md` — existe.
  - `docs/board-orders-execution-area-v1-final-handoff.md` — existe.
- QA manual previo reportó: scrollbar horizontal desktop, layout monolítico, preview enterrada, color de marca gigante, tabs cortadas en mobile.

## Ruta auditada

| Ruta | Propósito en auditoría |
|------|------------------------|
| `/admin/settings/public/landing` | **Principal** — formulario landing |
| `/admin/settings` | Hub índice; navegación relacionada |
| `/admin/settings/public` | Overview presencia pública |
| `/admin/settings/public/catalogo` | Form hermano; componentes compartidos |
| `/b/demohamburgueseria` | Landing pública real (comparación preview) |
| `/b/demohamburgueseria/catalogo` | Catálogo público (vínculo contextual) |

## Archivos auditados

### Rutas y server

| Archivo | Rol |
|---------|-----|
| `app/admin/(protected)/settings/public/landing/page.tsx` | Page route SSR |
| `app/admin/(protected)/settings/public/actions.ts` | Server actions (`updatePublicBusinessSettingsAction`) |
| `app/admin/(protected)/settings/public/page.tsx` | Overview presencia pública |
| `app/admin/(protected)/settings/public/catalogo/page.tsx` | Página catálogo (hermana) |
| `app/admin/(protected)/layout.tsx` | Import global de `public-settings.css` |
| `app/b/[slug]/page.tsx` | Render público `BusinessLandingPage` |

**Nota:** No existe `app/admin/(protected)/settings/public/landing/actions.ts`. Las mutations viven en el `actions.ts` del padre `public/`.

### Componentes

| Archivo | Rol |
|---------|-----|
| `components/admin/settings/public-settings-form.tsx` | Form client: estado, uploads, preview inline, submit |
| `components/admin/settings/public-settings.css` | Estilos form, preview, uploads, grids |
| `components/admin/settings/public-presence-panel.tsx` | Card wrapper con header + acción externa |
| `components/admin/settings/public-presence-panel.module.css` | Panel card CSS Module |
| `components/admin/settings/settings-shell.tsx` | Shell settings (header + nav + content) |
| `components/admin/settings/settings-shell.module.css` | Frame/content layout |
| `components/admin/settings/settings-navigation.tsx` | Tabs horizontales settings |
| `components/admin/settings/settings-navigation.module.css` | Nav scroll/wrap |
| `components/admin/settings/public-catalog-settings-form.tsx` | Form catálogo (no landing; comparte CSS) |
| `components/admin/admin-surfaces.css` | `.admin-field input { width: 100% }` — **conflicto overflow** |
| `components/ui/Input.tsx` | Campo color (`ui-input`) |
| `components/ui/Button.tsx` | Guardar cambios |
| `components/public/business/business-landing-page.tsx` | Landing pública real |

### Lib / types / storage

| Archivo | Rol |
|---------|-----|
| `lib/admin/context.ts` | `requireAdminPermission` |
| `lib/admin/permissions.ts` | `managePublicSettings` → owner \| manager |
| `lib/supabase/server.ts` | SSR fetch |
| `lib/supabase/client.ts` | Browser client uploads |
| `types/database.ts` | Columnas `businesses` |
| `supabase/migrations/20260506001500_t10_business_assets_storage.sql` | Bucket `business-assets` + RLS |

## Arquitectura actual

```
/admin/settings/public/landing (Server Component)
└── requireAdminPermission("managePublicSettings")
└── supabase.from("businesses").select(...)
└── SettingsShell [showNavigation=true]
    ├── AdminPageHeader (eyebrow/title/description)
    ├── SettingsNavigation (client, tabs filtradas)
    └── PublicPresencePanel (server)
        ├── header: business.name + "Ver landing pública" → /b/{slug}
        └── PublicSettingsForm (client)
            ├── uploads → Supabase Storage (browser)
            ├── preview inline (admin-settings-preview)
            └── submit → updatePublicBusinessSettingsAction
```

| Pieza | Archivo | Server/Client | Inputs | Outputs | Compartido | Riesgo |
|-------|---------|---------------|--------|---------|------------|--------|
| Page route | `landing/page.tsx` | Server | `adminContext.businessId` | HTML shell + form props | No | Bajo |
| Permission guard | `requireAdminPermission` | Server | `"managePublicSettings"` | context o redirect | Global admin | Bajo |
| Data load | `landing/page.tsx` | Server | `businesses` row | `initialValues` | No | Bajo |
| Shell | `settings-shell.tsx` | Server | title, nav flags | layout frame | Todas settings subpages | Bajo |
| Nav | `settings-navigation.tsx` | Client | pathname, permissions | tab links | Todas settings subpages | Medio (overflow mobile) |
| Panel | `public-presence-panel.tsx` | Server | title, actions, children | card surface | landing + catalogo | Bajo |
| Form | `public-settings-form.tsx` | Client | `businessId`, `initialValues` | form UI + preview | Solo landing | Medio (overflow, stretch) |
| Public render | `business-landing-page.tsx` | Server | `PublicBusiness`, slug | `/b/[slug]` | Público | N/A (referencia) |

## Data-flow

| Pregunta | Respuesta |
|----------|-----------|
| ¿De dónde salen logo, portada, color, descripción, Instagram? | Tabla `businesses`: `logo_url`, `cover_image_url`, `primary_color`, `description`, `instagram_url` |
| ¿Qué función carga la config? | SSR en `landing/page.tsx` vía `createSupabaseServerClient().from("businesses").select(...).eq("id", businessId)` |
| ¿Qué action guarda cambios? | `updatePublicBusinessSettingsAction` en `public/actions.ts` |
| ¿Qué action cambia logo/portada? | **No hay action dedicada.** Upload client-side a Storage; al guardar se persiste la URL en `logo_url` / `cover_image_url` |
| ¿Validación color? | Server: regex `^#[0-9A-Fa-f]{6}$` si no vacío. Client: sin validación inline |
| ¿Validación imagen? | Client: JPG/PNG/WebP, máx 5MB. Server: no re-valida tipo/tamaño de archivo |
| ¿Sin logo? | Preview: placeholder con inicial. Público: `business-landing-logo--placeholder` |
| ¿Sin portada? | Preview: placeholder "Imagen de portada". Público: `business-landing-cover--placeholder` |
| ¿Instagram vacío? | Se guarda `null`; landing pública no renderiza link Instagram |
| ¿Cache/revalidation? | `revalidatePath` tras save: `/admin/settings/public`, `/landing`, `/catalogo`, `/b/{slug}`, `/b/{slug}/catalogo` |
| ¿Nombre en preview? | Lee DOM `.admin-form-header h2` del panel (no prop directa) |

## Server actions / mutations

### `updatePublicBusinessSettingsAction`

- **Archivo:** `app/admin/(protected)/settings/public/actions.ts`
- **Guard:** `requireAdminPermission("managePublicSettings")`
- **Campos:** `description`, `primary_color`, `logo_url`, `cover_image_url`, `instagram_url`
- **Lógica URL assets:** Si hidden input vacío, conserva valor DB actual (`currentBusiness.logo_url` / `cover_image_url`)
- **Post-save:** Confirma persistencia comparando URLs entrantes vs DB; errores específicos logo/portada
- **Revalidación:** admin public paths + rutas públicas del slug

### Otras actions en el mismo archivo (no usadas por landing)

- `updateCatalogHeroSettingsAction` — catálogo
- `updateNotificationPreferencesAction` — notificaciones
- `savePushSubscriptionAction` / `revokePushSubscriptionAction` — push

## Upload / storage flow

1. Usuario elige archivo en `<input type="file" class="admin-settings-upload__input">`.
2. `handleAssetUpload` (client) valida tipo y 5MB.
3. `createSupabaseBrowserClient().storage.from("business-assets").upload({businessId}/{logo|cover}/{timestamp-uuid}.ext)`.
4. `getPublicUrl(filePath)` → URL pública.
5. Estado local + hidden inputs `logo_url` / `cover_image_url`.
6. Submit form → server persiste URLs en `businesses`.

**Bucket:** `business-assets` (público lectura). **RLS:** insert/update/delete solo paths `{business_id}/{logo|cover}/...` del perfil autenticado (`20260506001500_t10_business_assets_storage.sql`).

## Component map

| Componente/archivo | Tipo | Responsabilidad | Compartido con | Riesgo |
|--------------------|------|-----------------|----------------|--------|
| `landing/page.tsx` | Server page | Route + SSR data | — | LOCAL TO LANDING |
| `public-settings-form.tsx` | Client | Form completo landing | — | LOCAL TO LANDING |
| `public-settings.css` | Global CSS | Estilos form/preview/upload | catalogo (layout import) | SHARED SETTINGS |
| `public-presence-panel.tsx` | Server | Card wrapper | landing, catalogo | SHARED SETTINGS |
| `public-presence-panel.module.css` | CSS Module | Panel surfaces | landing, catalogo | SHARED SETTINGS |
| `settings-shell.tsx` | Server | Settings layout | todas subpages settings | SHARED SETTINGS |
| `settings-navigation.tsx` | Client | Tabs | todas subpages settings | SHARED SETTINGS |
| `settings-navigation.module.css` | CSS Module | Tab rail scroll/wrap | todas subpages settings | SHARED SETTINGS |
| `Input.tsx` / `Button.tsx` | Client UI | Campos y CTA | global | SHARED GLOBAL |
| `admin-surfaces.css` | Global CSS | `.admin-field` surfaces | admin forms | SHARED GLOBAL |
| `business-landing-page.tsx` | Server | Landing real | `/b/[slug]` | SHARED PUBLIC |
| `public-catalog-settings-form.tsx` | Client | Form catálogo | catalogo settings | SHARED SETTINGS (hermano) |
| `AdminPageHeader` / `AdminPageLayout` | Server | Page chrome | admin | SHARED GLOBAL |

## CSS / layout map

| Clase/archivo | Responsabilidad | Problema potencial | Recomendación |
|---------------|-----------------|--------------------|---------------|
| `.admin-settings-public-form` | Grid vertical secciones | Monolítico en desktop | Considerar layout 2-col form+preview |
| `.admin-settings-public-assets` | Grid 2-col logo+color ≥720px | `align-items: stretch` estira color | `align-items: start` o `align-self: start` en color |
| `.admin-settings-public-grid` | Grid 2-col descripción+IG ≥720px | OK en tablet | — |
| `.admin-settings-upload__input` | File input oculto | Anulado por `.admin-field input { width:100% }` | Mayor especificidad o `:not([type=file])` |
| `.admin-field input` (`admin-surfaces.css`) | Inputs admin full-width | Rompe sr-only de file input → **overflow horizontal** | Excluir file inputs |
| `.admin-settings-preview` | Preview inline | No replica landing real | Fase preview polish |
| `.admin-settings-form-actions` | Footer acciones form | Al final del scroll largo | Sticky o sidebar en desktop |
| `settings-navigation.module.css` `.list` | Tabs horizontales | Mobile: scroll interno pero page overflow residual | Fade/padding; verificar contain |
| `settings-shell.module.css` `.content` | `min-width: 0` | Correcto para flex/grid | Mantener |
| `public-presence-panel.module.css` `.body` | `min-width: 0` | Correcto | Mantener |
| `.ui-input` (`globals.css`) | Input color min-height ~46px | Estirado a 118px por grid stretch | Fix en grid identidad |

## Shared component impact

| Ruta | Componentes compartidos con landing |
|------|-------------------------------------|
| `/admin/settings/public` | `SettingsShell`, `SettingsNavigation` |
| `/admin/settings/public/catalogo` | `SettingsShell`, `SettingsNavigation`, `PublicPresencePanel`, `public-settings.css` |
| `/admin/settings/operations` | `SettingsShell`, `SettingsNavigation` |
| `/admin/settings/notifications` | `SettingsShell`, `SettingsNavigation` |
| `/admin/settings/team` | `SettingsShell`, `SettingsNavigation` |
| `/b/[slug]` | Datos mismos (`businesses`); render `BusinessLandingPage` (no componente admin) |
| `/b/[slug]/catalogo` | `primary_color`, `cover_image_url` (configurados en landing) |

## Desktop browser QA

**Viewport emulado:** 1440×900 (CDP `clientWidth` ≈ 1425 con sidebar).

| Elemento | Estado |
|----------|--------|
| Header + eyebrow "Configuración" | OK |
| SettingsNavigation | Tabs visibles; en paneles estrechos se trunca "Notificaciones" |
| Card `PublicPresencePanel` | OK; link "Ver landing pública" en header |
| Sección Identidad | Logo preview + upload OK |
| Color de marca | **P1:** input altura **118px** (esperado ~46px) |
| Portada | Preview + upload OK |
| Presentación | Descripción + Instagram en grid 2-col |
| Vista previa | Al final del formulario; requiere mucho scroll |
| Guardar cambios | Visible tras scroll; no sticky |
| Footer global | OK |
| Scroll vertical | Largo (formulario monolítico) |
| Scroll horizontal | **P1:** `documentElement.scrollWidth 1553` vs `clientWidth 1425` (+128px) |

## Tablet browser QA

**Viewport emulado:** 820×1024 (iPad Air class).

| Elemento | Estado |
|----------|--------|
| SettingsNavigation | `flex-wrap` activo ≥768px; usable |
| Grid identidad 2-col | Activo (≥720px); color stretch presente |
| Formulario | Largo pero razonable |
| Preview | Funcional; ocupa ancho completo |
| Overflow horizontal | **P1:** `scrollWidth 853` vs `805` (+48px) — file inputs |
| Touch targets | Botones upload ≥40px; OK |
| Dark/light | Toggle funciona |

**Severidad tablet:** P1 overflow; P2 densidad/preview placement.

## Mobile browser QA

**Viewport emulado:** 390×844 (Galaxy A51 class).

| Elemento | Estado |
|----------|--------|
| Header mobile + drawer | OK (sidebar colapsado) |
| SettingsNavigation | `scrollWidth 606` vs `clientWidth 358`; scroll interno en rail |
| Formulario | Single column; largo |
| Logo uploader | OK |
| Color input | Altura **46px** (normal — sin grid stretch) |
| Portada / preview | OK; preview alta (16:9) |
| Guardar cambios | Al final |
| Scroll horizontal página | **P1:** `scrollWidth 422` vs `390` (+32px) |
| Tabs affordance | Sin fade; últimas tabs requieren scroll sin indicador claro |

**Severidad mobile:** P1 overflow residual; P2 tabs affordance; P2 form length.

## Dark/light QA

- Toggle en sidebar: **funciona** (verificado light → dark en landing).
- Surfaces tokenizadas (`var(--bg-surface)`, `--border-subtle`) se adaptan.
- Preview usa `--preview-brand` inline desde color hex; legible en ambos modos.
- Sin regresión visual crítica detectada en landing entre modos.

## Overflow investigation

### Evidencia CDP (desktop 1440)

```json
{
  "cw": 1425,
  "docScroll": 1553,
  "hasHScroll": true,
  "fileInputs": [
    { "w": "1425px", "right": 1553 },
    { "w": "1425px", "right": 1553 }
  ]
}
```

### Causa raíz probable (P1)

1. **File inputs dentro de `.admin-field`** reciben `width: 100%` desde `components/admin/admin-surfaces.css` líneas 187–191.
2. Esa regla **gana** sobre `.admin-settings-upload__input { width: 1px }` por mayor especificidad (`.admin-field input` = clase + elemento).
3. Los `<input type="file">` quedan `position: absolute` pero con ancho calculado al 100% del contenedor (o viewport), extendiendo `getBoundingClientRect().right` más allá del viewport → scrollbar horizontal de página.
4. Contribución secundaria mobile: **SettingsNavigation** rail más ancho que viewport (`606px` vs `390px`), mitigado parcialmente por `overflow-x: auto` + `overscroll-behavior-x: contain` pero la página aún gana ~32px.

### No es causa principal

- `width: 100vw` — no encontrado en componentes landing.
- Imágenes preview — tienen `max-width: 100%`.
- Grid rígido — usa `minmax(0, 1fr)` correctamente.

## Color field investigation

### Evidencia CDP (desktop ≥720px)

```json
{
  "colorInputH": 118,
  "colorFieldH": 315,
  "assetsGrid": "604px 604px",
  "alignItems": "normal"
}
```

### Causa raíz (P1)

- En `@media (min-width: 720px)`, `.admin-settings-public-assets` es grid 2 columnas.
- Columna izquierda (logo): preview + upload control + hints ≈ **315px** altura.
- Columna derecha (color): `Input` en `.ui-field` con **stretch por defecto** del grid → el `<input class="ui-input">` se estira a ~118px (no es textarea; `type="text"`).
- En mobile (<720px) grid es 1 columna → color **46px** (normal).

### Recomendación

- `align-items: start` en `.admin-settings-public-assets`, o `align-self: start` en el wrapper del color.
- Opcional futuro: color picker visual (P3).

## Preview investigation

| Aspecto | Admin preview | `/b/demohamburgueseria` real |
|---------|---------------|------------------------------|
| Componente | Inline en `public-settings-form.tsx` (`.admin-settings-preview`) | `BusinessLandingPage` |
| Logo / nombre / descripción | Sí (estado local) | Sí (DB) |
| Color marca | CSS var `--preview-brand` | `getBusinessBrandStyles(primary_color)` |
| Portada | Imagen 16:9 simplificada | Hero showcase card + cover |
| CTAs | Pill "Tu marca en foco" | "Ver catálogo", WhatsApp |
| Instagram | **No mostrado** en preview | Link si `instagram_url` |
| Secciones extra | No | "Cómo funciona", steps, info cards |
| Layout | Bloque admin tokenizado | Layout marketing 2-col hero |

**Conclusión:** La preview es **aproximación parcial** del hero, no representación fiel de `/b/[slug]`. Datos coinciden en vivo (mismo estado React), pero estructura visual difiere.

**Recomendación visual:**

- Desktop: columna derecha sticky con preview ampliada o mini-frame de `BusinessLandingPage`.
- Mobile: preview debajo de identidad o colapsable, no al final de todo el form.

## UX copy audit

| Copy | Evaluación |
|------|------------|
| "Landing pública" | Claro |
| "Gestioná la portada, identidad y presentación pública del negocio." | Claro |
| "Identidad" / descripción | Claro |
| "Logo del negocio" + hints | Claro; algo largo en mobile |
| "Cambiar logo" / "Cambiar portada" | Claro |
| "Color de marca" + helper `#RRGGBB` | Claro; técnico pero apropiado |
| "Presentación" | Claro |
| "Descripción" + helper duplicado | Helper repite idea del placeholder — **redundante leve** |
| "Instagram del negocio" | Claro |
| "Vista previa" | Claro; podría aclarar que es aproximada |
| "Guardar cambios" | Claro |
| "Ver landing pública" | Claro; buena ubicación en panel header |
| Acentos | Correctos (gestioná, definí, usá, podés) |

## Security / permissions audit

| Control | Estado | Clasificación |
|---------|--------|---------------|
| `managePublicSettings` (owner/manager) | Server guard en page + action | SECURITY OK |
| RLS Storage `business-assets` | Path scoped a `business_id` del usuario | SECURITY OK |
| Validación color server-side | HEX regex | SECURITY OK |
| Validación URLs logo/portada en server | Solo equality post-save; **no valida dominio/path** | NEEDS FOLLOW-UP |
| Upload directo browser | RLS protege escritura; lectura pública del bucket | SECURITY OK |
| `instagram_url` | Sin validación formato URL server | SECURITY DEBT (bajo) |
| Permisos operator/viewer | No acceden a landing | SECURITY OK |

## Findings

| ID | Hallazgo | Ruta/archivo | Breakpoint | Severidad | Evidencia | Recomendación |
|----|----------|--------------|------------|-----------|-----------|---------------|
| L-01 | Scroll horizontal por file inputs con `width:100%` | `admin-surfaces.css` + `public-settings-form.tsx` | all (peor desktop) | **P1** | CDP: inputs `w:1425px`, `docScroll:1553` | Excluir `input[type=file]` de `.admin-field input`; reforzar sr-only |
| L-02 | Campo color estirado verticalmente en grid identidad | `public-settings.css` `.admin-settings-public-assets` | ≥720px | **P1** | CDP: `colorInputH:118` vs 46 mobile | `align-items: start` / `align-self: start` |
| L-03 | Layout monolítico; preview al final | `public-settings-form.tsx` | desktop | **P1/P2** | QA visual; mucho scroll | Layout 2-col form+preview sticky |
| L-04 | Preview no fiel a landing pública | `public-settings-form.tsx` vs `business-landing-page.tsx` | all | **P2** | Comparación componentes | Reusar subset público o iframe `/b/slug` |
| L-05 | Settings tabs sin affordance scroll mobile | `settings-navigation.module.css` | <768px | **P2** | `navSw:606` vs `390` | Fade edges + `scroll-padding` |
| L-06 | Guardar cambios no sticky | `public-settings-form.tsx` | all | **P2** | QA | Sticky footer acciones en fase polish |
| L-07 | Nombre preview vía DOM scrape | `public-settings-form.tsx` L84–91 | all | **P2** | Código | Pasar `businessName` como prop |
| L-08 | Copy helper descripción redundante | `public-settings-form.tsx` | all | **P3** | Copy audit | Acortar en polish copy |
| L-09 | Sin color picker visual | `Input type=text` | all | **P3** | UX | Swatch nativo o picker futuro |
| L-10 | Server no valida origen URL assets | `public/actions.ts` | — | **P2** | Código | Validar host Supabase storage (follow-up) |

## P0 findings

Ninguno. Carga, guardado, permisos y build funcionan.

## P1 findings

- **L-01** — Overflow horizontal (file inputs).
- **L-02** — Color de marca visualmente gigante en desktop/tablet.
- **L-03** — Jerarquía desktop deficiente (preview enterrada) — borde P1/P2.

## P2 findings

- **L-04** — Preview aproximada.
- **L-05** — Tabs mobile sin affordance.
- **L-06** — CTA guardar no sticky.
- **L-07** — Nombre preview por DOM.
- **L-10** — Validación URL assets.

## P3 findings

- **L-08** — Copy redundante.
- **L-09** — Color picker visual.

## Recommended implementation plan

Fases recomendadas **separadas** (alcance distinto, riesgo bajo por archivo):

### SETTINGS-PAGE-1A — Landing Layout & Overflow Fix

- Fix especificidad CSS file inputs (overflow).
- Fix grid stretch color (`align-items: start`).
- Verificar overflow 0 en desktop/tablet/mobile.
- **Archivos:** `public-settings.css`, posiblemente `admin-surfaces.css` (selector acotado).

### SETTINGS-PAGE-1B — Landing Preview & Form Hierarchy Polish

- Layout desktop 2 columnas: form izquierda, preview derecha sticky.
- Mejorar fidelidad preview (componente compartido o sección hero de `BusinessLandingPage`).
- Pasar `businessName` como prop.
- **Archivos:** `public-settings-form.tsx`, `landing/page.tsx`, posible nuevo wrapper CSS.

### SETTINGS-PAGE-1C — Landing Mobile/Tablet Responsive Polish

- Settings nav fade/padding en mobile.
- Densidad hints upload; preview colapsable o reordenada.
- Sticky "Guardar cambios" opcional.
- **Archivos:** `settings-navigation.module.css`, `public-settings.css`, `public-settings-form.tsx`.

### SETTINGS-PAGE-1D — Landing Functional QA & Handoff

- E2E save logo/portada/color.
- Permisos operator/viewer.
- Comparación `/b/slug` post-save.
- Doc handoff.

**No recomendar una sola fase** — L-01/L-02 son fixes CSS acotados y deben ir antes del polish estructural.

## Scope recommendation for next phase

**Inmediata:** `SETTINGS-PAGE-1A — Landing Layout & Overflow Fix`

## Files likely to modify next

- `components/admin/settings/public-settings.css`
- `components/admin/admin-surfaces.css` (solo si se excluye `input[type=file]` globalmente)
- Posiblemente `components/admin/settings/public-settings-form.tsx` (markup mínimo para align wrapper)

## Files to avoid modifying

- `app/admin/(protected)/settings/public/actions.ts` (salvo follow-up seguridad URL)
- `supabase/migrations/*`
- `components/public/business/business-landing-page.tsx`
- Rutas checkout/catálogo público
- `settings-navigation.tsx` (deferir a 1C salvo que overflow tabs persista tras L-01)
- Theme tokens globales

## Risks

- Cambiar `.admin-field input` en `admin-surfaces.css` afecta **todos** los forms admin — usar selector `:not([type=file])`.
- Layout 2-col preview (1B) puede chocar con `PublicPresencePanel` padding — probar en catalogo hermano.
- Fixes overflow deben validarse también en `/admin/settings/public/catalogo` (mismos upload patterns si los hubiera).

## Validation commands executed

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0); ruta `/admin/settings/public/landing` listada; nota `ƒ Proxy (Middleware)` |
| `npm run lint` | **FAIL** — flake conocido ESLint 9 circular JSON (`plugins.react`); no corregido |
| `rg` búsquedas obligatorias | Ejecutadas en codebase (landing, brand, upload, navigation, overflow, colors) |

## QA artifacts / notes

- Browser: Cursor IDE browser @ `localhost:3000`, sesión owner La Burguesía.
- CDP measurements documentadas en Overflow y Color sections.
- Screenshots: desktop landing (overflow visible), mobile (~577px panel) con tabs truncadas.
- Slug público validado en STAGING-QA-1: `demohamburgueseria`.
- Light/dark toggle verificado en landing.

## Final recommendation

La landing pública admin es **funcional y arquitectónicamente coherente** con Settings V1, pero acumula **deuda visual P1** por dos bugs CSS concretos (file input width cascade + grid stretch del color) y **deuda de jerarquía P2** (form monolítico, preview parcial al fondo).

**Próxima fase:** `SETTINGS-PAGE-1A — Landing Layout & Overflow Fix` → luego `1B` (preview/hierarchy) y `1C` (mobile polish) en secuencia.

## Follow-up: SETTINGS-PAGE-1A implemented

- L-01 fixed in `docs/admin-settings-public-landing-page-1a-layout-overflow-fix.md`
- L-02 fixed in `docs/admin-settings-public-landing-page-1a-layout-overflow-fix.md`
- Remaining: L-03/L-04/L-05 for follow-up phases.

## Follow-up: SETTINGS-PAGE-1B implemented

- L-03 addressed by `docs/admin-settings-public-landing-page-1b-preview-form-hierarchy-polish.md`
- L-04 partially addressed by admin preview polish.
- Remaining: L-05 tabs mobile affordance.

## Follow-up: SETTINGS-PAGE-1C implemented

- L-05 addressed by `docs/admin-settings-public-landing-page-1c-mobile-tablet-responsive-polish.md`

## Follow-up: SETTINGS-PAGE-1D implemented

- Asset upload UX improved in `docs/admin-settings-public-landing-page-1d-asset-upload-ux.md`
- Logo and cover upload now provide stronger pre-save confidence.

## Follow-up: SETTINGS-PAGE-1E implemented

- Brand color free input was replaced by a curated safe palette.
- Details: `docs/admin-settings-public-landing-page-1e-brand-palette-control-ux.md`

## Follow-up: SETTINGS-PAGE-1F implemented

- Preview accuracy and publish confidence improved.
- Details: `docs/admin-settings-public-landing-page-1f-preview-accuracy-publish-confidence.md`

## Follow-up: SETTINGS-PAGE-1G implemented

- Unified dirty state and save button flow.
- Details: `docs/admin-settings-public-landing-page-1g-save-flow-dirty-state.md`
