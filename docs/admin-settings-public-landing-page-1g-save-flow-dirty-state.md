# SETTINGS-PAGE-1G — Save Flow / Dirty State

## Objetivo

Unificar la experiencia de edición y guardado en `/admin/settings/public/landing` para que el usuario siempre sepa si hay cambios pendientes, qué falta publicar y cuándo quedó guardado.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-settings-form.tsx` | Dirty state derivado, botón, aviso unificado, feedback post-save |
| `components/admin/settings/public-settings.css` | Estilos lista de cambios pendientes |
| `components/admin/settings/public-landing-readiness.tsx` | Helpers `getFieldReadinessStatus`, `getOptionalFieldReadinessStatus` |

## Archivos creados

| Archivo | Cambio |
|---------|--------|
| `docs/admin-settings-public-landing-page-1g-save-flow-dirty-state.md` | Este documento |

## Dirty state

Estado derivado único `hasPendingChanges` contempla:

| Señal | Comparación |
|-------|-------------|
| Logo pendiente | `pendingLogoFile` |
| Portada pendiente | `pendingCoverFile` |
| Color modificado | `normalizeHexColor(primaryColor) !== published` |
| Descripción modificada | `description !== initialValues.description` |
| Instagram modificado | `instagramUrl !== initialValues.instagramUrl` |

Lista `pendingChangeLabels` muestra solo ítems realmente modificados en el aviso lateral.

## Save flow

1. Sin cambios → botón deshabilitado.
2. Con cambios → **Guardar cambios** habilitado.
3. Submit → **Guardando...** / **Subiendo imágenes...** si hay assets.
4. Éxito + `router.refresh()` → valores publicados sincronizan vía `initialValues`.
5. Sin dirty state post-save → **Guardado** + feedback contextual.

No `beforeunload`, no router blockers, no toasts globales.

## Estados del botón

| Condición | Texto | Habilitado |
|-----------|-------|------------|
| Sin cambios | Sin cambios | No |
| Con cambios | Guardar cambios | Sí |
| `isPending` | Guardando... | No |
| `isUploadingAsset` | Subiendo imágenes... | No |
| Post-save sin dirty | Guardado | No |

## Feedback post-save

Mensaje contextual (no toast):

> Cambios publicados correctamente.

Visible cuando `state.success && !hasPendingChanges && !isPending`. Desaparece al editar de nuevo (dirty state vuelve).

## Cambios preservados

- `updatePublicBusinessSettingsAction` sin cambios
- Upload on-submit (1D)
- Brand palette (1E)
- Preview panel (1F)
- Checklist de readiness
- Field names y payloads

## Qué NO se tocó

- Server actions
- DB / RLS
- Storage bucket / upload helpers
- `components/public/**`
- Preview architecture
- Asset cards visual
- Palette visual
- Settings navigation / side panel
- `beforeunload` / confirmación al salir

## QA

**Desktop** (`localhost:3000`, sesión La Burguesía):

| Caso | Resultado |
|------|-----------|
| Estado inicial | Botón **Sin cambios** deshabilitado ✅ |
| Editar descripción | **Guardar cambios**, aviso • Descripción ✅ |
| Editar color + Instagram | Aviso • Color • Descripción • Instagram ✅ |
| Checklist | Descripción/Color/Instagram → Pendiente de guardar ✅ |
| Guardar | **Guardado**, feedback, sin aviso pendiente ✅ |
| Refresh | Descripción e Instagram persisten ✅ |

**Mobile:** no re-ejecutado en esta sesión; desktop sin overflow.

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9 circular `plugins.react` |

## Deuda restante

- Confirmación al salir con cambios sin guardar (fase futura)
- Sticky save bar (futuro)
- Save + refresh de assets (1D-QA pendiente histórico)
- QA mobile explícito

## Próxima fase

**SETTINGS-PAGE-1H — Unsaved Changes Guard** (beforeunload / router blocker) o cierre de handoff Public Landing V1.
