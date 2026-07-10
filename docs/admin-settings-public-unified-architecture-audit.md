# SETTINGS-PUBLIC-AUDIT-1 — Public Presence Unified Architecture Audit

## Objetivo

Determinar si **Landing** y **Catálogo** deben convertirse en un único editor de **Presencia Pública**, documentar la arquitectura actual y proponer la ideal **antes** de implementar cambios.

**Alcance:** auditoría 100% lectura. Sin modificaciones de código, rutas, DB, RLS ni navegación.

---

## Arquitectura actual

### Rutas admin

| Ruta | Rol | Permiso | Componente principal |
|------|-----|---------|----------------------|
| `/admin/settings/public` | Overview legacy — cards de acceso + links externos | `manageNotifications` (overview); cards públicas si `managePublicSettings` | `SettingsCard` grid |
| `/admin/settings/public/landing` | Editor landing | `managePublicSettings` | `PublicSettingsForm` |
| `/admin/settings/public/catalogo` | Editor textos hero catálogo | `managePublicSettings` | `PublicCatalogSettingsForm` |

### Puntos de entrada (redundancia)

Un usuario con permisos públicos puede llegar a los mismos editores por **tres vías**:

1. **Hub** `/admin/settings` → cards "Landing pública" / "Catálogo público"
2. **Overview** `/admin/settings/public` → cards "Editar landing" / "Editar catálogo"
3. **Nav sticky** → ítems "Landing pública" / "Catálogo público"

`/admin/settings/public` no tiene ítem propio en `SettingsNavigation`; su pathname cae en `resumen` (`getActiveKey`).

### Stack por página

```
SettingsShell
├── AdminPageHeader (título de sección)
├── SettingsNavigation (sticky)
└── Contenido
    ├── /public          → SettingsCard grid (sin form)
    ├── /public/landing  → PublicPresencePanel → PublicSettingsForm
    └── /public/catalogo → PublicPresencePanel → PublicCatalogSettingsForm
```

### Superficies públicas consumidoras

| Superficie | Ruta | Datos de `businesses` |
|------------|------|------------------------|
| Landing pública | `/b/{slug}` | `logo_url`, `cover_image_url`, `description`, `primary_color`, `instagram_url`, `name`, `whatsapp_number` |
| Catálogo público | `/b/{slug}/catalogo` | `cover_image_url`, `primary_color`, `catalog_hero_*`, `name` + `categories`/`products` (tablas separadas) |
| Header compartido | `public-business-header.tsx` | `logo_url`, `primary_color`, `name` |

**Productos y categorías** no se editan en settings públicos; viven en `/admin/products`.

---

## Flujo de datos

### Landing — campos editables

| Campo DB | UI | Upload | Action |
|----------|-----|--------|--------|
| `logo_url` | `PublicAssetUpload` | Client → Storage `business-assets` | `updatePublicBusinessSettingsAction` |
| `cover_image_url` | `PublicAssetUpload` | Client → Storage | `updatePublicBusinessSettingsAction` |
| `primary_color` | `BrandPaletteControl` | — | `updatePublicBusinessSettingsAction` |
| `description` | textarea | — | `updatePublicBusinessSettingsAction` |
| `instagram_url` | Input URL | — | `updatePublicBusinessSettingsAction` |
| `name` | Solo lectura (panel title) | — | No editable aquí |

### Catálogo — campos editables

| Campo DB | UI | Action |
|----------|-----|--------|
| `catalog_hero_headline` | textarea | `updateCatalogHeroSettingsAction` |
| `catalog_hero_badge` | input | `updateCatalogHeroSettingsAction` |
| `catalog_hero_microcopy` | textarea | `updateCatalogHeroSettingsAction` |

### Catálogo — campos leídos pero no editados

`catalogo/page.tsx` selecciona `cover_image_url` y `primary_color` pero **no los pasa al form**. El panel solo los menciona en copy: *"La portada y el color principal se configuran en Landing pública."*

### Clasificación de datos

| Clasificación | Campos |
|---------------|--------|
| **COMPARTIDO** (afecta landing + catálogo) | `logo_url` (header catálogo vía `public-business-header`), `cover_image_url`, `primary_color`, `name`, `slug` |
| **EXCLUSIVO LANDING** | `description`, `instagram_url` |
| **EXCLUSIVO CATÁLOGO** | `catalog_hero_headline`, `catalog_hero_badge`, `catalog_hero_microcopy` |
| **FUERA DE SCOPE PRESENCIA** | `categories`, `products`, `whatsapp_number`, reglas operativas |

---

## Flujo de server actions

| Action | Archivo | Campos | Revalida |
|--------|---------|--------|----------|
| `updatePublicBusinessSettingsAction` | `public/actions.ts` | logo, cover, color, description, instagram | `/admin/settings/public`, `/landing`, `/catalogo`, `/b/{slug}`, `/b/{slug}/catalogo` |
| `updateCatalogHeroSettingsAction` | `public/actions.ts` | headline, badge, microcopy | `/admin/settings/public`, `/catalogo`, `/b/{slug}/catalogo` |

### Uploads

- **Solo Landing** sube archivos (browser → Supabase Storage).
- Catálogo no tiene upload; depende visualmente de portada/color configurados en Landing.
- `updatePublicBusinessSettingsAction` ya revalida catálogo público al guardar landing (correcto: portada/color impactan hero del catálogo).

### Refresh

- Landing: `router.refresh()` en `state.success` + uploads previos en submit.
- Catálogo: `router.refresh()` en `state.success`.
- Ambos sincronizan `initialValues` vía props SSR post-refresh.

### Dirty state

| Form | Dirty state | Botón inteligente | Checklist |
|------|-------------|-------------------|-----------|
| `PublicSettingsForm` | Sí (1G) — logo, portada, color, descripción, Instagram | Sin cambios / Guardar / Guardando / Subiendo / Guardado | `PublicLandingReadiness` |
| `PublicCatalogSettingsForm` | **No** | Siempre "Guardar cambios" habilitado | **No** |

---

## Flujo visual (QA navegador)

### `/admin/settings/public`

- Grid de cards: Landing, Catálogo, Vista landing, Vista catálogo.
- Sin formulario, sin preview, sin dirty state.
- Sección "Avisos operativos" redirige a Notificaciones.
- Nav sticky presente; ítem activo: Resumen (pathname `/admin/settings/public` → `resumen`).

### `/admin/settings/public/landing`

- Layout **2 columnas** (`admin-settings-landing-editor__layout`): form + aside preview.
- Secciones: Identidad (logo + palette), Imagen de portada, Presentación.
- Aside: checklist readiness, aviso cambios pendientes, preview encabezado rica, link externo.
- Botón submit con estados 1G.
- Upload cards, brand palette de 16 colores.

### `/admin/settings/public/catalogo`

- Layout **1 columna** simple.
- Secciones: Textos del hero (3 campos), Vista previa (solo copy textual).
- Sin upload, sin color, sin portada en preview.
- Panel advierte dependencia de Landing para portada/color.
- Botón siempre activo; sin "Sin cambios" ni "Guardado".

### Comparación visual

| Aspecto | Landing | Catálogo |
|---------|---------|----------|
| `SettingsShell` + nav | Igual | Igual |
| `PublicPresencePanel` | Igual | Igual |
| Layout editor | 2 cols + sticky preview | 1 col |
| Secciones | 3 + aside | 2 |
| Preview | Rica (logo, portada, color, CTAs mock) | Mínima (eyebrow + textos) |
| Save flow | Enterprise (1G) | Básico |
| CSS compartido | `public-settings.css` | `public-settings.css` |

---

## Datos compartidos

| Dato | Editado en | Consumido en landing | Consumido en catálogo |
|------|------------|----------------------|------------------------|
| Logo | Landing | Sí | Sí (header) |
| Portada | Landing | Sí | Sí (hero media) |
| Color | Landing | Sí | Sí (`--business-primary`) |
| Descripción | Landing | Sí | No |
| Instagram | Landing | Sí | No |
| Hero texts | Catálogo | No | Sí |

**Conclusión:** la identidad visual es transversal; los textos narrativos están partidos por canal.

---

## Datos exclusivos

**Landing:** `description`, `instagram_url` (+ flujo upload logo/portada).

**Catálogo:** `catalog_hero_headline`, `catalog_hero_badge`, `catalog_hero_microcopy`.

**Ni landing ni catálogo settings editan:** productos, categorías, nombre del negocio, WhatsApp.

---

## Duplicaciones

| Elemento | Landing | Catálogo | Clasificación |
|----------|---------|----------|---------------|
| `SettingsShell` + header | Sí | Sí | **Aceptable** (shell global) |
| `PublicPresencePanel` | Sí | Sí | **Debe unificarse** (wrapper común ya existe; falta editor unificado) |
| `public-settings.css` secciones | Sí | Sí | **Aceptable** (design system) |
| Preview | Rica | Mínima | **Debe unificarse** (misma shell, tabs por superficie) |
| Save flow / dirty state | 1G completo | Ausente | **Debe unificarse** |
| Checklist readiness | Sí | No | **Debe unificarse** (ítems por sección) |
| Hub cards (×2 rutas) | Sí | Sí | **Duplicación innecesaria** entre `/settings` y `/settings/public` |
| Nav items separados | Landing + Catálogo | — | **Debe unificarse** en un ítem "Presencia pública" |
| Server actions | 2 distintas | 2 distintas | **Debe mantenerse separada** a corto plazo (distintos payloads); unificar opcional en fase posterior |
| Copy cross-reference | Logo hint menciona catálogo | Panel menciona Landing | **Aceptable** hoy; desaparece si hay un solo editor |

---

## Experiencia del usuario — flujo ideal

### Cambiar logo

- **Hoy:** ir a Landing (aunque el logo también aparece en header del catálogo).
- **Afecta catálogo:** sí (`public-business-header`).
- **Ideal:** sección **Identidad** dentro de **Presencia pública**; un solo lugar; preview muestra impacto en landing y header catálogo.

### Cambiar portada

- **Hoy:** Landing; catálogo la consume pero no la edita.
- **Afecta catálogo:** sí (hero media fullscreen).
- **Ideal:** misma sección **Identidad / Apariencia**; preview con tab "Catálogo" mostrando hero con portada.

### Cambiar color

- **Hoy:** solo Landing; catálogo hereda.
- **¿Duplicar en Catálogo?** **No.** Es deuda de UX actual, no de negocio.
- **Ideal:** un control; preview dual.

### Cambiar textos del hero catálogo

- **Hoy:** Catálogo settings.
- **Ideal:** sección **Catálogo** dentro del mismo editor; no requiere ruta separada.

### Cambiar descripción / Instagram

- **Hoy:** Landing.
- **Ideal:** sección **Landing** en editor unificado.

---

## Riesgos

### Si se fusiona

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Formulario muy largo en mobile | Media | Secciones colapsables / sub-nav interna |
| Dirty state cross-sección complejo | Media | Dirty por sección + save global o por bloque |
| Regresión upload + `startTransition` | Alta | No tocar upload path en fase 1 |
| Romper bookmarks `/landing`, `/catalogo` | Media | Redirects 308 o anchors |
| Mezclar dos actions en un submit | Media | Mantener 2 actions; orquestar en cliente o unificar server en fase 2 |
| Preview performance | Baja | Lazy render por tab |

### Si se mantiene separado

| Riesgo | Severidad |
|--------|-----------|
| Usuario no encuentra logo (busca en Catálogo) | Alta |
| Catálogo sin paridad 1G (dirty, guardado) | Media |
| Triple hub confuso | Media |
| Deuda de copy cruzado permanente | Baja |

### Deuda que desaparece al unificar

- Cross-reference copy entre páginas.
- Hub `/admin/settings/public` redundante.
- Dos ítems de nav para un dominio conceptual.
- Paridad manual Landing vs Catálogo.

### Deuda que aparece

- Editor compuesto más complejo.
- Preview multi-superficie.
- Tests/QA más amplios.
- Migración de rutas y docs.

---

## Oportunidades

1. **Un solo mental model:** "Presencia pública" = cómo me ven los clientes.
2. **Paridad 1G** para campos de catálogo (dirty, Guardado, checklist).
3. **Preview honesta** mostrando landing + hero catálogo con datos compartidos.
4. **Nav simplificada:** un ítem en lugar de dos.
5. **Readiness unificado:** logo, portada, color, textos landing, textos catálogo.
6. **Eliminar** `/admin/settings/public` como hub duplicado (redirect al editor o al resumen).

---

## Arquitectura propuesta

### Recomendación: **fusionar conceptualmente, implementar por fases**

No big-bang. Unificar **experiencia e IA**; preservar **actions** inicialmente.

```
Presencia pública                    [/admin/settings/public]
│
├── Identidad (compartida)
│   ├── Logo
│   ├── Color de marca
│   └── Portada
│
├── Landing (textos canal entrada)
│   ├── Descripción
│   └── Instagram
│
├── Catálogo (textos hero)
│   ├── Headline
│   ├── Badge
│   └── Microcopy
│
├── Estado
│   └── Checklist unificado (readiness)
│
└── Vista previa
    ├── Tab: Encabezado landing
    └── Tab: Hero catálogo
```

### Navegación propuesta

| Antes | Después |
|-------|---------|
| Landing pública + Catálogo público (2 ítems nav) | **Presencia pública** (1 ítem) |
| `/admin/settings/public` overview cards | Deprecar → redirect o absorber en editor |
| `/admin/settings/public/landing` | Redirect → `/admin/settings/public#landing` o sección |
| `/admin/settings/public/catalogo` | Redirect → `/admin/settings/public#catalogo` |

### Server layer (fase 1)

- Mantener `updatePublicBusinessSettingsAction` y `updateCatalogHeroSettingsAction`.
- Cliente: un `PublicPresenceEditor` con dirty state global y submit orquestado (identidad+landing primero upload, luego actions en transición).

### Server layer (fase 2 — opcional)

- `updatePublicPresenceAction` unificada con validación por bloque.

---

## Roadmap recomendado

| Fase | ID | Objetivo |
|------|-----|----------|
| 1 | **PUBLIC-1** | IA + navegación: un ítem "Presencia pública"; definir secciones internas; redirects suaves |
| 2 | **PUBLIC-2** | `PublicPresenceEditor` shell: unificar forms sin merge de actions |
| 3 | **PUBLIC-3** | Dirty state + botón 1G para campos catálogo |
| 4 | **PUBLIC-4** | Checklist readiness unificado |
| 5 | **PUBLIC-5** | Preview dual (landing header + catalog hero) |
| 6 | **PUBLIC-6** | Deprecar overview `/admin/settings/public`; actualizar hub cards |
| 7 | **PUBLIC-7** | Responsive QA + browser QA completo |
| 8 | **PUBLIC-8** (opcional) | Server action unificada |

---

## Qué NO se recomienda

- **No** fusionar gestión de productos/categorías en presencia pública.
- **No** eliminar rutas `/landing` y `/catalogo` sin redirects en la misma release.
- **No** unificar server actions antes de estabilizar dirty state y upload.
- **No** duplicar controles de portada/color en catálogo.
- **No** big-bang que mezcle upload + nuevos campos catálogo en un solo submit sin QA.
- **No** tocar `components/public/**` en fases de admin settings.

---

## Próxima fase

**PUBLIC-1 — Presencia Pública IA & Navigation Consolidation**

- Colapsar nav Landing + Catálogo en un ítem.
- Crear shell `PublicPresenceEditor` vacío con secciones (sin mover lógica aún).
- Definir redirects y anchors.
- Documentar contrato de dirty state cross-sección.

---

## QA visual (browser)

| Ruta | Hallazgos |
|------|-----------|
| `/admin/settings/public` | 4 cards públicas + notificaciones; sin editor; nav Resumen activo |
| `/admin/settings/public/landing` | Editor completo 2 cols; checklist; preview rica; botón "Sin cambios" |
| `/admin/settings/public/catalogo` | Editor simple 1 col; 3 campos; preview textual; botón siempre "Guardar cambios"; copy dependencia Landing |

**Redundancia confirmada:** tres puntos de entrada a los mismos editores; dos niveles de hub (settings + public overview).

---

## Archivos auditados

| Archivo | Rol |
|---------|-----|
| `app/admin/(protected)/settings/public/page.tsx` | Overview cards |
| `app/admin/(protected)/settings/public/landing/page.tsx` | Page landing |
| `app/admin/(protected)/settings/public/catalogo/page.tsx` | Page catálogo |
| `app/admin/(protected)/settings/public/actions.ts` | Server actions |
| `components/admin/settings/public-settings-form.tsx` | Form landing (1A–1G) |
| `components/admin/settings/public-catalog-settings-form.tsx` | Form catálogo |
| `components/admin/settings/public-presence-panel.tsx` | Wrapper compartido |
| `components/public/business/business-landing-page.tsx` | Consumidor landing |
| `components/public/catalog/catalog-client.tsx` | Consumidor catálogo |
| `lib/business/public.ts` | Tipo `PublicBusiness` |
