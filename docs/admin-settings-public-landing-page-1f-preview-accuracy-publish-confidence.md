# Admin Settings Public Landing — SETTINGS-PAGE-1F Preview Accuracy & Publish Confidence

## Objetivo

Mejorar la confianza de publicación en `/admin/settings/public/landing` con preview honesta, checklist de completitud y mejor vínculo con la landing pública real — sin tocar `components/public/**` ni server actions.

## Contexto

- Fases previas: overflow (1A), editor+preview (1B), responsive (1C), asset upload (1D), interaction QA (1D-QA), paleta segura (1E).
- Preview previa prometía exactitud con copy “Así se verá tu landing pública”.

## Decisión de producto

La preview admin no debe prometer una réplica exacta de la landing pública. Debe funcionar como una vista de confianza del encabezado/hero y orientar al usuario a abrir la landing real para revisión completa.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-settings-form.tsx` | Checklist, copy preview, pending notice, CTA helper |
| `components/admin/settings/public-settings.css` | Estilos pending, CTA helper, mock label, actions caption |
| `docs/admin-settings-public-landing-forensic-audit-page-1a.md` | Follow-up 1F |
| `docs/admin-settings-v1-final-handoff.md` | Nota follow-up |

## Archivos creados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-landing-readiness.tsx` | Checklist de publicación |
| `components/admin/settings/public-landing-readiness.module.css` | Estilos checklist |
| `docs/admin-settings-public-landing-page-1f-preview-accuracy-publish-confidence.md` | Este documento |

## Cambio principal aplicado

Panel lateral de preview ahora incluye **Estado de landing** (checklist), aviso de cambios pendientes, copy honesto del encabezado y CTA con helper hacia la landing real.

## Preview accuracy

| Antes | Después |
|-------|---------|
| “Vista previa” / “Así se verá tu landing pública” | “Vista previa del encabezado” |
| Nota genérica al pie | Scope + nota sobre bloques de referencia |
| Pseudo-CTAs sin contexto | Caption “Botones de ejemplo” |
| — | Label “Encabezado público” en mock |

Copy secundario: *La landing completa puede incluir más secciones según la configuración pública.*

## Publish readiness checklist

5 ítems derivados de datos locales (sin fetch):

| Ítem | Estados posibles |
|------|------------------|
| Logo configurado | Listo / Pendiente / Pendiente de guardar |
| Portada configurada | Listo / Pendiente / Pendiente de guardar |
| Descripción cargada | Listo / Pendiente |
| Color de marca elegido | Listo / Pendiente |
| Instagram | Opcional (+ “Cargado” si hay URL) |

## Public landing CTA

- Link **Ver landing pública** preservado (`target="_blank"`, `rel="noopener noreferrer"`).
- Helper: *Abrí la versión real en una nueva pestaña para revisar cómo la ven tus clientes.*

## Pending changes communication

Banner cuando hay assets pendientes (`pendingLogoFile` / `pendingCoverFile`) o color distinto al publicado:

> **Cambios seleccionados.** Guardá cambios para publicarlos en tu landing pública.

Sin dirty-state global, sin interceptar navegación, sin sticky save bar.

## Brand palette regression

| Check | Resultado |
|-------|-----------|
| Paleta visible | ✅ |
| Hidden `primary_color` único | ✅ |
| Click Verde → preview `#15803D` | ✅ |
| Pending notice al cambiar color | ✅ |

## Asset upload regression

| Check | Resultado |
|-------|-----------|
| File inputs sr-only (1×1px) | ✅ |
| Upload cards presentes | ✅ (no re-test interacción completa) |

## Mobile/tablet UX

| Breakpoint | Resultado |
|------------|-----------|
| Desktop | Checklist + preview lateral, sin overflow |
| Tablet 820px | Checklist visible, sin overflow |
| Mobile 390px | Checklist compacta, sin overflow |

## Browser QA desktop

| Check | Resultado |
|-------|-----------|
| Título “Vista previa del encabezado” | ✅ |
| Checklist 5 ítems | ✅ |
| CTA helper | ✅ |
| Mock label “Encabezado público” | ✅ |
| Sin overflow | ✅ |
| Paleta sync | ✅ |

## Browser QA tablet

820px — checklist + preview OK, sin overflow ✅

## Browser QA mobile

390px — checklist compacta, sin overflow ✅

## No regression checks

| Ruta | HTTP |
|------|------|
| `/admin/settings` | 200 ✅ |
| `/admin/settings/public` | 200 ✅ |
| `/admin/settings/public/catalogo` | 200 ✅ |
| `/admin/settings/public/landing` | 200 ✅ |

## Qué se preservó

- `updatePublicBusinessSettingsAction`
- Form action y field names (`primary_color`, `logo_url`, `cover_image_url`, etc.)
- Brand palette contract (1E)
- Asset upload logic (1D)
- Bucket `business-assets`
- DB/RLS
- Permissions y rutas
- Landing pública y catálogo (sin cambios en `components/public/**`)
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
- No Settings side panel

## Riesgos

- Checklist no detecta cambios en descripción/Instagram como “pendiente de guardar” (deuda 1G).
- Preview sigue siendo aproximada por diseño.

## Deuda restante

- Save + refresh assets/color (1D-QA pendiente)
- Dirty-state global / sticky save bar → **SETTINGS-PAGE-1G**
- Descripción/Instagram en aviso de cambios pendientes

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9 circular `plugins.react` |

## Próxima fase recomendada

**SETTINGS-PAGE-1G — Save Flow / Dirty State**
