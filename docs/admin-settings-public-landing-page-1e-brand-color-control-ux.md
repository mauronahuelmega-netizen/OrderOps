# Admin Settings Public Landing — SETTINGS-PAGE-1E Brand Color Control UX

## Objetivo

Mejorar la UX del **Color de marca** en `/admin/settings/public/landing` con swatch visual, selector nativo, input HEX, presets rápidos, validación client-side y preview admin sincronizada — sin cambiar el contrato del server action.

## Contexto

- Fases previas: overflow (1A), editor+preview (1B), responsive (1C), asset upload (1D), interaction QA (1D-QA).
- Campo previo: `Input` texto plano con helper técnico `#RRGGBB`.
- Server action: `primary_color` con validación `/^#[0-9A-Fa-f]{6}$/`.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-settings-form.tsx` | Integra `BrandColorControl`, preview con color válido, validación en submit |
| `docs/admin-settings-public-landing-forensic-audit-page-1a.md` | Follow-up 1E |
| `docs/admin-settings-v1-final-handoff.md` | Nota follow-up |

## Archivos creados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/brand-color-control.tsx` | Control visual de color |
| `components/admin/settings/brand-color-control.module.css` | Estilos del control |
| `docs/admin-settings-public-landing-page-1e-brand-color-control-ux.md` | Este documento |

## Cambio principal aplicado

Nuevo componente `BrandColorControl` reemplaza el `Input` de texto del color de marca dentro de la card **Identidad**, junto al upload de logo.

## Brand color contract preservation

| Aspecto | Preservado |
|---------|------------|
| Field name | `primary_color` |
| Server action | `updatePublicBusinessSettingsAction` (sin cambios) |
| Validación server | `#RRGGBB` (`HEX_COLOR_PATTERN`) |
| Payload | `primary_color` en `FormData` |
| DB column | `businesses.primary_color` |
| Upload logic | Sin cambios (logo/portada on-submit) |
| Hidden fields | `logo_url`, `cover_image_url` intactos |

**Único input con `name`:** el campo HEX de texto. El `input[type="color"]` es auxiliar sin `name`.

**Normalización on-submit:** `formData.set("primary_color", normalizedUppercase ?? "")`.

## Color picker

- `input[type="color"]` compacto (44×40px desktop).
- Sincronizado con HEX; al elegir color actualiza estado local en uppercase.
- Sin `name` — no participa en submit directo.

## HEX input

- `input[name="primary_color"]` controlado.
- Placeholder `#C2410C`.
- Normalización on blur: agrega `#` si falta; uppercase si válido.
- Acepta escritura manual mientras se edita; valida al blur y en submit.

## Presets

| Label | HEX |
|-------|-----|
| Naranja | `#C2410C` |
| Rojo | `#DC2626` |
| Amarillo | `#F59E0B` |
| Negro | `#111827` |
| Verde | `#16A34A` |
| Azul | `#2563EB` |

- No guardan automáticamente.
- Estado activo con `aria-pressed` cuando coincide con color local válido.
- Swatch + label en cada botón; wrap en mobile.

## Validation

- Client: `normalizeHexColor()` / `isValidHexColor()` — sólo `#RRGGBB` (6 dígitos).
- Error: `Usá un color válido en formato #RRGGBB.`
- HEX inválido: preview usa último color válido o color publicado (no crashea).
- Submit bloqueado si hay valor no vacío e inválido.

## Preview sync

`previewBrandColor` en form:

```ts
normalizeHexColor(primaryColor) ??
normalizeHexColor(initialValues.primaryColor ?? "") ??
"var(--accent-primary)"
```

Preview admin (`--preview-brand`) actualiza al cambiar picker, preset o HEX válido — antes de guardar.

## Restore behavior

- Botón **Restaurar color publicado** visible cuando el valor local difiere del publicado (`initialValues.primaryColor`).
- Restaura estado local y preview; no guarda automáticamente.

## Mobile/tablet UX

- Grid swatch + HEX + picker con `minmax(0, 1fr)` — sin stretch full-width del 1A regression.
- Presets con `flex-wrap`; touch targets ≥36px (40px en mobile ≤389px).
- `align-self: start` en control para no estirar en grid 2-col.

## Browser QA desktop

**Entorno:** `localhost:3000`, sesión owner La Burguesía, 1440px.

| Check | Resultado |
|-------|-----------|
| Control visible (swatch, HEX, picker) | ✅ |
| Valor inicial `#C2410C` | ✅ |
| 6 presets | ✅ |
| Preset Azul → `#2563EB` + preview sync | ✅ |
| Sin overflow horizontal | ✅ |
| Copy de negocio visible | ✅ |

## Browser QA tablet

**Viewport:** 820×1024 (CDP `Emulation.setDeviceMetricsOverride`).

| Check | Resultado |
|-------|-----------|
| Control accesible | ✅ |
| Sin overflow global | ✅ |

## Browser QA mobile

**Viewport:** 390×844.

| Check | Resultado |
|-------|-----------|
| Control presente | ✅ |
| Presets presentes | ✅ |
| Sin overflow global | ✅ |

## Save smoke test

**Parcial** — sesión activa; preset Azul validado en preview. Refresh post-save no re-ejecutado de forma aislada en esta sesión (overlay dev Next.js interfirió con clicks). El flujo submit preserva `primary_color` normalizado; server action sin cambios.

**Pendiente opcional:** cambiar preset → Guardar → refresh → verificar persistencia → restaurar `#C2410C`.

## No regression checks

Fetch autenticado (200 OK):

- `/admin/settings/public/catalogo` ✅
- `/admin/settings/public` ✅
- `/admin/settings` ✅

## Qué se preservó

- `updatePublicBusinessSettingsAction`
- Form action y field name `primary_color`
- Upload logic (1D)
- Bucket `business-assets`
- DB/RLS
- Permissions y rutas
- Validación server-side HEX
- Landing pública y catálogo (sin cambios)
- `SettingsShell` / `SettingsNavigation`

## Qué NO se cambió

- No server action changes
- No DB changes
- No RLS changes
- No storage policy changes
- No upload behavior changes
- No public landing real redesign
- No checkout changes
- No products changes
- No `theme-tokens.css` / `globals.css`

## Riesgos

- Color vacío envía `null` al server (comportamiento previo preservado).
- `input[type="color"]` no soporta alpha — fuera de scope.

## Deuda restante

- SETTINGS-PAGE-1D-QA: save/refresh de assets aún pendiente
- Save smoke color aislado con refresh documentado como pendiente
- Sin contraste automático / paletas / color secundario (P3)
- SETTINGS-PAGE-1F — Preview Accuracy & Publish Confidence

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** (vía build TS step) |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9 circular `plugins.react` |

Warning conocido: middleware → proxy (Next 16).

## Próxima fase recomendada

**SETTINGS-PAGE-1F — Preview Accuracy & Publish Confidence**
