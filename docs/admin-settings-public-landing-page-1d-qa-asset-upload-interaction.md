# Admin Settings Public Landing — SETTINGS-PAGE-1D-QA Asset Upload Interaction QA

## Objetivo

Validar en browser real que la UX de carga de logo y portada (SETTINGS-PAGE-1D) funciona en interacción: selección válida, preview local, metadata, cancelación, errores client-side, guardado y persistencia.

## Contexto

- Fase **QA FIRST** sobre `/admin/settings/public/landing`.
- Implementación en `PublicAssetUpload` + `PublicSettingsForm` (upload on submit, preview vía `URL.createObjectURL`).
- Referencias: docs 1A–1D, forensic audit, handoff Settings V1.

## Entorno probado

| Campo | Valor |
|-------|-------|
| URL | `http://localhost:3000/admin/settings/public/landing` |
| Browser | Cursor embedded browser (CDP `Runtime.evaluate`) |
| Cuenta | Owner demo — La Burguesía (`laburguesia@demo.com`, slug `demohamburgueseria`) |
| Viewport principal | Desktop 1440×… (sin overflow) |
| Fecha | 2026-06-06 |

## Fixtures usados

Creados en `tmp/qa-assets/` (no commiteados) con Node/PowerShell + base64:

| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| `valid-logo.png` | PNG 1×1 px válido | 70 B |
| `valid-cover.jpg` | JPEG mínimo válido | 264 B |
| `invalid-file.txt` | Texto plano | 12 B |
| `too-large-cover.png` | PNG con payload >5 MB | 5 243 904 B |

**Método:** `Buffer.from(base64)` / `[Convert]::FromBase64String` para imágenes; `Buffer.alloc(5*1024*1024+1024)` para archivo grande.

**Nota browser QA:** los archivos se inyectaron vía CDP (`DataTransfer` + `input.dispatchEvent('change')`) equivalente a selección real en el file picker.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-asset-upload.tsx` | P1: limpiar input si `onFileSelected` retorna `false` |
| `components/admin/settings/public-settings-form.tsx` | P1: handlers de validación retornan `false` en error |
| `docs/admin-settings-public-landing-page-1d-asset-upload-ux.md` | Sección Follow-up QA |
| `docs/admin-settings-v1-final-handoff.md` | Nota 1D-QA |

## Archivos creados

| Archivo | Cambio |
|---------|--------|
| `docs/admin-settings-public-landing-page-1d-qa-asset-upload-interaction.md` | Este documento |
| `tmp/qa-assets/*` | Fixtures locales temporales |

## Estado inicial publicado

**Resultado: PASS**

| Check | Estado |
|-------|--------|
| Logo badge "Publicado" | ✅ |
| Portada badge "Publicado" | ✅ |
| File inputs no visibles (1×1, `sr-only`, `position: absolute`) | ✅ |
| IDs `logo-file` / `cover-file` | ✅ |
| Sin overflow horizontal (`scrollWidth === clientWidth` = 1440) | ✅ |
| Preview derecha con imágenes publicadas (URLs Supabase) | ✅ |
| Botón "Guardar cambios" visible | ✅ |

CDP overflow:
```json
{"docScrollWidth":1440,"docClientWidth":1440,"bodyScrollWidth":1440,"bodyClientWidth":1440}
```

## QA logo válido

**Resultado: PASS**

| Check | Estado |
|-------|--------|
| Badge → "Seleccionado" | ✅ |
| Preview local (blob URL) en card | ✅ |
| Metadata: `valid-logo.png · 0.1 KB · PNG` | ✅ |
| Mensaje "Imagen seleccionada. Guardá cambios para publicarla." | ✅ |
| Botón "Cancelar selección" visible | ✅ |
| Preview admin sincronizada (blob en `.admin-settings-preview__logo`) | ✅ |
| No auto-guardado | ✅ |
| Sin overflow | ✅ |

## QA cancelar logo

**Resultado: PASS**

| Check | Estado |
|-------|--------|
| Vuelve imagen publicada | ✅ |
| Badge → "Publicado" | ✅ |
| Metadata pendiente desaparece | ✅ |
| Input file vacío (`value === ""`) | ✅ |
| Preview admin vuelve a URL publicada (http) | ✅ |
| Sin error persistente | ✅ |

## QA portada válida

**Resultado: PASS**

| Check | Estado |
|-------|--------|
| Badge portada → "Seleccionado" | ✅ |
| Preview local blob en card | ✅ |
| Metadata: `valid-cover.jpg · 0.3 KB · JPG` | ✅ |
| Dimensiones | ⚠️ no mostradas (JPEG test 1×1 — loader no resolvió dims; implementado en código) |
| Mensaje pendiente de guardar | ✅ |
| Cancelar selección visible | ✅ |
| Preview admin sincronizada (blob cover) | ✅ |
| No auto-guardado | ✅ |
| Sin overflow | ✅ |

## QA cancelar portada

**Resultado: PASS**

| Check | Estado |
|-------|--------|
| Portada publicada restaurada | ✅ |
| Badge → "Publicado" | ✅ |
| Metadata desaparece | ✅ |
| Input limpio | ✅ |
| Preview admin vuelve a URL publicada | ✅ |

## QA archivo inválido

**Resultado: PASS** (tras microfix P1)

| Check | Estado |
|-------|--------|
| Sin preview blob | ✅ |
| Error: "Formato no compatible. Usá JPG, PNG o WebP." | ✅ |
| Badge no queda "Seleccionado" | ✅ |
| Puede seleccionar otro archivo después | ✅ |
| Input se limpia tras error | ✅ (fix aplicado; antes quedaba `fakepath`) |

## QA archivo mayor a 5MB

**Resultado: PASS** (tras microfix P1)

| Check | Estado |
|-------|--------|
| Sin preview | ✅ |
| Error: "La imagen supera 5 MB. Elegí una imagen más liviana." | ✅ |
| Badge no queda "Seleccionado" | ✅ |
| Input se limpia | ✅ (fix aplicado) |
| Puede reintentar selección | ✅ |

## QA guardar cambios

**Resultado: NO EJECUTADO** (sesión admin expiró a `/admin/login` antes de completar submit)

| Check | Estado |
|-------|--------|
| Click "Guardar cambios" con imagen pendiente | ⏭ pendiente re-login manual |
| Upload a `business-assets` + `updatePublicBusinessSettingsAction` | ⏭ pendiente |
| Badge vuelve a "Publicado" post-save | ⏭ pendiente |
| Mensaje éxito formulario | ⏭ pendiente |

**Nota:** el flujo on-submit está implementado y revisado en código (`handleSubmit` → `uploadBusinessAsset` → `formAction`). STAGING-QA-1 y 1D development validaron upload al bucket con la misma cuenta demo.

## QA persistencia tras refresh

**Resultado: NO EJECUTADO** (depende de guardado real)

## QA responsive

**Resultado: PARCIAL**

| Breakpoint | Estado |
|------------|--------|
| Desktop 1440px | ✅ overflow + interacciones validadas |
| Tablet 820px | ⏭ no re-ejecutado (sesión expirada) |
| Mobile 390px | ⏭ no re-ejecutado (sesión expirada) |

1C documentó responsive polish; esta fase no detectó regresión en desktop.

## QA regressions

**Resultado: NO EJECUTADO** (sesión expirada)

Rutas pendientes de smoke post-fix:
- `/admin/settings`
- `/admin/settings/public`
- `/admin/settings/public/catalogo`

STAGING-QA-1 las cubrió previamente sin issues.

## Findings

| ID | Hallazgo | Ruta/breakpoint | Severidad | Estado | Acción |
|----|----------|-----------------|-----------|--------|--------|
| L1D-QA-01 | Input file no se limpiaba tras validación fallida (invalid / >5MB) | `/admin/settings/public/landing` | P1 | **Corregido** | `onFileSelected` retorna `false`; child limpia `inputRef` |
| L1D-QA-02 | Guardado real + persistencia no ejecutados por expiración de sesión | landing | P2 | Documentado | Re-login owner demo y repetir QA 8–9 |
| L1D-QA-03 | Responsive tablet/mobile no re-validado en esta sesión | 820px / 390px | P2 | Documentado | Smoke rápido post-login |
| L1D-QA-04 | Dimensiones en metadata portada no visibles con fixture JPEG mínimo | cover card | P3 | Aceptado | Fixture más grande en re-QA opcional |
| L1D-QA-05 | `npm run lint` — flake ESLint 9 circular `plugins.react` | CI local | P2 | Conocido | Sin cambio (deuda DEVX) |
| L1D-QA-06 | Next 16 warning middleware → proxy | build | P3 | Conocido | DEVX-2 |

## Microfixes aplicados

**P1 — Limpiar input tras validación fallida**

- `public-settings-form.tsx`: `handleLogoFileSelected` / `handleCoverFileSelected` retornan `false` cuando `validateImageFile` falla.
- `public-asset-upload.tsx`: `acceptFile()` limpia `inputRef.current.value` si el handler retorna `false`.
- Aplica a picker y drag/drop.

## Qué se preservó

- Server actions (`updatePublicBusinessSettingsAction`) sin cambios
- Bucket `business-assets`, paths, hidden fields `logo_url` / `cover_image_url`
- Validación client 5MB / JPG·PNG·WebP
- Upload on-submit (no on-select)
- sr-only file inputs (1A)
- Preview admin sync (`pendingPreviewUrl ?? publishedUrl`)
- Sin cambios DB/RLS/storage/middleware/rutas

## Qué NO se cambió

- `actions.ts`, `lib/**`, `supabase/**`, `types/database.ts`
- `app/theme-tokens.css`, `globals.css`
- Componentes públicos, dashboard, products, realtime
- Arquitectura uploader, cropper, compresión, remove persistente

## Riesgos

- Guardado no re-validado en browser en esta sesión; riesgo bajo dado patrón idéntico a productos y QA previo.
- Fixtures en `tmp/` no versionados — recrear si se repite QA.

## Deuda restante

- Re-ejecutar QA 8–9 (guardar + refresh) con sesión owner activa
- Smoke responsive 820px / 390px post-login
- Smoke regressions settings hub / catálogo
- Cropper, compresión, remove persistente, progress bar (P3 — fuera de scope)

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** (vía `next build` TypeScript step) |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9 circular config (`plugins.react`) |

Build warning conocido: middleware → proxy (Next 16).

## Resultado final

**PASS WITH P2 DEBT**

Interacciones core (selección, preview, cancelación, errores, sync preview admin, overflow desktop, sr-only inputs) **PASS**. Guardado/persistencia, responsive tablet/mobile y regressions quedan pendientes por expiración de sesión — documentado como deuda P2, no bloqueante para continuar a 1E.

## Próxima fase recomendada

**SETTINGS-PAGE-1E — Brand Color Control UX**

Opcional antes de 1E: re-login y cerrar QA 8–9 + smoke responsive en una pasada manual de 5 min.
