# Admin Settings Public Landing — SETTINGS-PAGE-1D Asset Upload UX

## Objetivo

Mejorar la UX de carga de logo y portada en `/admin/settings/public/landing` con preview local pre-guardado, metadata de archivo, validación client-side y cancelación de selección, alineado al patrón de productos.

## Contexto

- Fases previas: overflow (1A), editor+preview (1B), responsive (1C).
- Upload previo: subía a Storage al seleccionar archivo.
- Nueva UX: seleccionar → preview local → guardar (upload + server action).

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-settings-form.tsx` | Pending files, upload on submit, preview sync |
| `components/admin/settings/public-settings.css` | Selector `input.admin-settings-upload__input` sr-only |
| `docs/admin-settings-public-landing-forensic-audit-page-1a.md` | Follow-up 1D |
| `docs/admin-settings-v1-final-handoff.md` | Nota follow-up |

## Archivos creados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-asset-upload.tsx` | Asset card + drag/drop |
| `components/admin/settings/public-asset-upload.module.css` | Estilos asset card |
| `docs/admin-settings-public-landing-page-1d-asset-upload-ux.md` | Este documento |

## Cambio principal aplicado

Nuevo componente `PublicAssetUpload` con estados **Publicado / Seleccionado / Subiendo / Sin imagen**, preview local vía `URL.createObjectURL`, metadata compacta y botón **Cancelar selección**. Upload a `business-assets` ocurre al hacer **Guardar cambios** (mismo bucket/path/validación).

## Product image pattern audit

Patrón en `edit-product-form.tsx`:
- Dropzone con drag/drop
- `URL.createObjectURL` para preview local
- Revoke en cleanup
- Upload a Supabase Storage tras procesar

**Adaptado para landing:** sin cropper; validación JPG/PNG/WebP 5MB; defer upload hasta save.

## Upload contract preservation

| Campo | Preservado |
|-------|------------|
| `logo_url` hidden input | Sí |
| `cover_image_url` hidden input | Sí |
| `updatePublicBusinessSettingsAction` | Sin cambios |
| Bucket `business-assets` | Sin cambios |
| Path `{businessId}/{logo\|cover}/{timestamp-uuid}.ext` | Sin cambios |
| Accept `image/jpeg,image/png,image/webp` | Sin cambios |
| Max 5 MB | Client + server |
| File input ids `logo-file` / `cover-file` | Sí |
| sr-only pattern (1A) | Sí (`admin-settings-upload__input`) |

**Cambio de timing:** upload pasa de on-select a on-submit (UX; misma función de storage).

## Logo asset UX

- Card con badge de estado
- Dropzone cuadrado con drag/drop
- Preview publicado o local
- Metadata al seleccionar: `nombre · tamaño · formato`
- Copy actualizado
- Cancelar selección restaura imagen publicada

## Cover asset UX

- Dropzone 16:9
- Metadata incluye dimensiones (`width×height`) cuando es posible
- Mismos estados y acciones que logo

## Local preview behavior

1. Usuario selecciona archivo → validación → `createObjectURL` → estado `selected`
2. No se sube a Storage hasta **Guardar cambios**
3. Cancelar → `revokeObjectURL`, limpiar input, volver a publicado
4. Guardar → upload pending files → `formAction(FormData)` con URLs

## Client-side validation

- Tipos: `image/jpeg`, `image/png`, `image/webp`
- Máximo: 5 MB
- Errores: "Formato no compatible…" / "La imagen supera 5 MB…"

## File metadata

Formato: `archivo.webp · 1.4 MB · WebP · 1600×900` (dimensiones solo portada)

## Preview sync

Vista previa admin usa `pendingPreviewUrl ?? publishedUrl` para logo y portada.

## Mobile UX

- Botones min-height 44px
- Metadata con `word-break`
- Dropzone usable en touch (label + htmlFor)

## Browser QA desktop

- Asset cards renderizadas (Publicado badge, Cambiar logo/portada)
- Layout 2-col preservado
- Sin overflow horizontal reportado en carga
- File inputs con clase sr-only restaurada tras fix wrapper

## Browser QA tablet

- Hereda polish 1C (1 columna, max-width 820px)

## Browser QA mobile

- Asset cards full-width
- Touch targets 44px en acciones

## No regression checks

- CSS landing scoped; catálogo no usa `PublicAssetUpload`
- SettingsNavigation sin cambios en esta fase

## Qué se preservó

- `updatePublicBusinessSettingsAction`
- form field names
- bucket `business-assets`
- DB/RLS
- permissions
- route structure
- server validation
- `SettingsShell` / `SettingsNavigation`

## Qué NO se cambió

- no server action changes
- no DB changes
- no RLS changes
- no storage policy changes
- no public landing real redesign
- no checkout/products changes

## Riesgos

- Upload on-save: si el usuario cierra la pestaña con selección pendiente, no se publica (comportamiento esperado).
- Archivos huérfanos en bucket reducidos vs upload-on-select.

## Deuda restante

- Sin cropper / compresión client-side
- Sin eliminar logo/portada persistente
- Sin progress bar de upload
- **SETTINGS-PAGE-1E** — Brand Color Control UX

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9 circular config |

## Follow-up QA

- Interaction QA executed in `docs/admin-settings-public-landing-page-1d-qa-asset-upload-interaction.md`
- Result: **PASS WITH P2 DEBT**
- P1 fix applied: clear file input on client validation failure

## Próxima fase recomendada

**SETTINGS-PAGE-1E — Brand Color Control UX**
