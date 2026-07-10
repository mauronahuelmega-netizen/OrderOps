# PUBLIC-3 — Catalog Dirty State Parity

## Objetivo

Aplicar paridad de experiencia de guardado al formulario de **Catálogo público**, alineado con el estándar de Landing (SETTINGS-PAGE-1G), limitado a `catalog_hero_headline`, `catalog_hero_badge` y `catalog_hero_microcopy`.

## Estado anterior

- Botón siempre "Guardar cambios" habilitado
- Sin dirty state derivado
- Sin aviso de cambios pendientes
- Feedback genérico "Cambios guardados." sin condición
- Sin estado "Sin cambios" / "Guardado"

## Estado nuevo

- `hasPendingChanges` derivado contra `initialValues`
- Aviso contextual con lista de campos modificados
- Botón: Sin cambios / Guardar cambios / Guardando... / Guardado
- Feedback: "Cambios publicados correctamente." post-save
- Submit nativo `<form action={formAction}>` (sin warning useActionState)

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-catalog-settings-form.tsx` | Dirty state, aviso, botón, feedback |
| `components/admin/settings/public-settings.css` | `.admin-settings-public-pending-notice` (reutiliza tokens Landing) |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/admin-settings-public-phase-public-3-catalog-dirty-state-parity.md` | Este documento |

## Dirty state

| Campo | Label en aviso |
|-------|----------------|
| `catalog_hero_headline` | Título del catálogo |
| `catalog_hero_badge` | Badge |
| `catalog_hero_microcopy` | Microcopy |

Comparación: valor actual vs `initialValues.* ?? ""`.

## Save flow

1. Sin cambios → botón deshabilitado "Sin cambios"
2. Con cambios → "Guardar cambios" + aviso
3. Submit → "Guardando..." (`isPending`)
4. Éxito + `router.refresh()` → "Guardado" + feedback
5. Nueva edición → oculta feedback; vuelve a "Guardar cambios"

## useActionState

- Mantiene `<form action={formAction}>`
- Sin `formAction(formData)` manual
- Sin `startTransition` (no requerido sin uploads previos)

## Feedback post-save

> Cambios publicados correctamente.

Visible cuando `state.success && !hasPendingChanges && !isPending`.

## Qué se preservó

- `updateCatalogHeroSettingsAction` sin cambios
- Controlled inputs existentes y nombres de campos
- Preview inline del catálogo
- `router.refresh()` post-success
- Rutas y shell PUBLIC-2

## Qué NO se tocó

- `public-settings-form.tsx` (Landing)
- Uploads, brand palette, readiness
- Server actions, DB, RLS, storage
- `components/public/**`
- Checklist unificado / preview dual

## QA

Ver entrega (browser + validaciones).

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | Ver entrega |
| `npm run build` | Ver entrega |
| `npm run lint` | Ver entrega (flake ESLint 9) |

## Deuda restante

- `statusLabel` en `PublicPresenceEditorShell` (opcional PUBLIC-4)
- Dirty state en resource links del módulo
- Checklist unificado `PublicPresenceReadiness`
- Preview dual landing + catálogo

## Próxima fase

**PUBLIC-4 — Unified readiness & preview** (o consolidación de status en shell).
