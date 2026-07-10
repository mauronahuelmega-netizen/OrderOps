# SETTINGS-CLEANUP-1 — Settings Legacy CSS Cleanup

## Objetivo

Eliminar CSS legacy huérfano de Settings (Team y Notificaciones) en `admin-surfaces.css`, sin alterar
comportamiento, UX visible ni lógica funcional. Cierre de deuda documentada tras SETTINGS-TEAM-1,
SETTINGS-NOTIF-1 y SETTINGS-VALIDATION-1.

## Contexto

Team y Notificaciones migraron a CSS modules propios:

- `components/admin/team/team-settings.module.css`
- `components/admin/notifications/notification-settings.module.css`

Quedaron bloques globales en `components/admin/admin-surfaces.css` sin consumidores TSX/TS activos.

## Alcance

- Eliminar solo clases con **0 consumidores** en `*.tsx` / `*.ts` / `*.jsx` / `*.js`
- No tocar server actions, rutas, formularios, push, autosave
- No reubicar `updateNotificationPreferencesAction` (SETTINGS-ACTIONS-1)

## Auditoría de referencias

| Patrón | Resultado | Decisión |
|--------|-----------|----------|
| `admin-notification-settings-card` | Solo `admin-surfaces.css` + docs | **Eliminar** |
| `admin-notification-settings-card__*` | Solo `admin-surfaces.css` + docs; 0 TSX/TS | **Eliminar** |
| `admin-team-layout` | Solo `admin-surfaces.css`; 0 TSX/TS | **Eliminar** |
| `admin-team-list` | Solo `admin-surfaces.css`; 0 TSX/TS | **Eliminar** |
| `admin-team-row` (+ `__*`) | Solo `admin-surfaces.css`; 0 TSX/TS | **Eliminar** |
| `admin-team-role-chip` | Solo `admin-surfaces.css`; 0 TSX/TS | **Eliminar** |
| `admin-team` (TSX/TS) | Solo import path `admin-team-settings-view.tsx` | **No aplica** (no es clase CSS) |
| `admin-primary-button` | Usado en orders, super-admin, audio-unlock, etc. | **Conservar** |
| `admin-feedback` | Usado en super-admin, categories, audio-unlock-modal | **Conservar** |
| `admin-inline-feedback` | Usado en categories, super-admin forms | **Conservar** |
| `admin-form-card`, `admin-field` | Usado en múltiples módulos admin | **Conservar** |
| `notification-settings.module.css` | Importado por card + push-device-settings | **Conservar** (module activo) |
| `team-settings.module.css` | Importado por team components | **Conservar** (module activo) |
| `admin-surfaces.css` import | `app/globals.css` | **Conservar** (global activo) |

Comandos ejecutados: `rg "admin-notification-settings-card"`, `rg "admin-team-"` en TSX/TS (0 matches de
clases), `rg "admin-team"` en CSS (solo `admin-surfaces.css`).

## CSS eliminado

De `components/admin/admin-surfaces.css` (~165 líneas):

**Team legacy:**

- `.admin-team-layout`, `.admin-team-list`
- `.admin-team-row` (+ `:first-child`, `__copy`, `__controls`, `__form`, `__headline`, `__meta`, `__note`, `__actions`)
- `.admin-team-role-chip`
- `@media (min-width: 900px) { .admin-team-row { ... } }`

**Notificaciones legacy:**

- `.admin-notification-settings-card__status`, `__meta`, `__actions`
- `.admin-notification-settings-card__section`, `__section-header`, `__list`, `__copy`
- `.admin-notification-settings-card__item` (+ `:first-child`, `input`)

## CSS conservado intencionalmente

- `.admin-primary-button`, `.admin-secondary-link`, `.admin-feedback`, `.admin-inline-feedback`
- `.admin-form-card`, `.admin-field`, `.admin-empty-state`
- `.oo-*` superficies compartidas
- Clases usadas por orders, products, super-admin, categories, audio-unlock-modal
- CSS modules activos de Team y Notificaciones (sin cambios)

## Archivos modificados

- `components/admin/admin-surfaces.css` — eliminación de bloques legacy Team + Notificaciones
- `docs/admin-settings-v1-final-handoff.md` — nota mínima SETTINGS-CLEANUP-1

## Archivos creados

- `docs/admin-settings-cleanup-1-legacy-css-cleanup.md` — este documento

## Archivos no tocados

- `components/admin/team/*` (TSX/CSS modules)
- `components/admin/notifications/*` (TSX/CSS modules)
- `app/admin/(protected)/settings/*`
- `settings/public/actions.ts`, server actions, DB, RLS, auth
- `components/public/**`, orders, products

## QA

Browser smoke vía snapshots (sin CDP):

| Ruta | Resultado |
|------|-----------|
| `/admin/settings` | PASS — hub con Presencia pública, Operación, Notificaciones, Equipo |
| `/admin/settings/team` | PASS — summary, usuarios, form intactos |
| `/admin/settings/notifications` | PASS — summary segmentado, 4 switches, Sonido ON |
| `/admin/settings/operations` | PASS (sesión previa SETTINGS-VALIDATION-1) |
| `/admin/settings/public` | PASS (sesión previa SETTINGS-VALIDATION-1) |

Sin overlays de error Next.js; sin indicios de CSS roto en árbol de accesibilidad.

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0) |
| `npm run lint` | **FAIL** — flake conocido `Converting circular structure to JSON` (ESLint 9.39.4) |

## Qué se preservó

UX visible, comportamiento, server actions, push/autosave, formularios, permisos, CSS compartido activo,
modules de Team y Notificaciones.

## Qué NO se tocó

Server actions, `updateNotificationPreferencesAction`, DB, RLS, auth, roles, permisos, push logic,
service worker, rutas, componentes TSX (salvo que no fue necesario), Brand Palette, Public editors.

## Riesgos

- **Bajo:** eliminación acotada con evidencia `rg` de 0 consumidores TSX/TS.
- CSS compartido (`admin-primary-button`, etc.) intacto — sin regresión cross-módulo esperada.

## Deuda restante

- **SETTINGS-ACTIONS-1** — reubicar `updateNotificationPreferencesAction` a `notifications/actions.ts`
- Lint flake ESLint 9 (deuda DEVX global, no bloqueante)
- `audio-unlock-modal.tsx` sigue usando `admin-feedback` global (fuera de scope; opcional migrar a module en fase futura)

## Próxima fase recomendada

**SETTINGS-ACTIONS-1 — Notifications Action Relocation**
