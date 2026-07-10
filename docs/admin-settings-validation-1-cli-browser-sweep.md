# SETTINGS-VALIDATION-1 — Settings CLI & Browser Validation Sweep

## Objetivo

Cerrar la deuda técnica de validación acumulada tras SETTINGS-TEAM-1 y SETTINGS-NOTIF-1 (ambas
**PASS WITH CLI DEBT**), confirmando que Settings completo sigue estable sin abrir nuevas features ni
rediseños.

## Contexto

Fases previas completadas:

- PUBLIC-HANDOFF-1 — Presencia pública V1 cerrada
- SETTINGS-NT-AUDIT-1 — Audit Notificaciones + Team
- SETTINGS-TEAM-1 — Team Visual & IA Polish
- SETTINGS-NOTIF-1 — Notifications Visual & IA Polish

Deuda acumulada antes de esta fase: `tsc`/`build`/`lint` no ejecutados (terminal irresponsivo);
preferencia demo **Sonido** en OFF tras smoke de autosave.

## Estado inicial

`git status --short` ejecutado con éxito (terminal recuperado con permisos `all`).

Cambios relevantes en working tree:

**Modificados (Team + Notificaciones + epic Settings previo):**

- `components/admin/notifications/notification-settings-card.tsx`
- `components/admin/notifications/push-device-settings.tsx`
- `components/admin/team/create-team-member-form.tsx`
- `components/admin/team/team-member-role-form.tsx`
- (+ otros archivos del epic Settings/Public previo, fuera del scope de microfix de esta fase)

**Creados (untracked):**

- `components/admin/notifications/notification-settings.module.css`
- `components/admin/team/admin-team-settings-view.tsx`
- `components/admin/team/team-settings.module.css`
- `app/admin/(protected)/settings/team/page.tsx`
- `app/admin/(protected)/settings/notifications/page.tsx`
- docs de Team, Notificaciones y epic Settings

**Eliminado:**

- `components/admin/notifications/notification-settings-card.module.css` (module local huérfano tras
  migración a `notification-settings.module.css`)

## Validaciones CLI

| Comando | Resultado | Notas |
|---------|-----------|-------|
| `npx tsc --noEmit` | **PASS** | Exit code 0 |
| `npm run build` | **PASS** | Exit code 0; rutas Settings incluidas en output |
| `npm run lint` | **FAIL (flake conocido)** | `TypeError: Converting circular structure to JSON` — ESLint 9.39.4; deuda DEVX preexistente |

No se requirieron microfixes de código: TypeScript y build pasaron sin errores propios de Team o
Notificaciones.

## QA Settings Hub

Ruta: `/admin/settings` — **PASS**

- Card única **Presencia pública** (sin cards legacy Landing/Catálogo separadas)
- Cards **Operación**, **Notificaciones** (badge "Activas"), **Equipo**
- Links: Presencia pública, Operaciones, Notificaciones, Equipo
- Sidebar: Resumen activo; navegación lateral intacta
- Sin errores de runtime visibles en snapshot

## QA Presencia pública

| Ruta | Resultado |
|------|-----------|
| `/admin/settings/public` | **PASS** — overview PUBLIC-6, readiness (Identidad/Landing/Catálogo/Publicación), accesos rápidos |
| `/admin/settings/public/landing` | **PASS** — editor shell, form, readiness, preview dual (tabs Landing/Catálogo), save "Sin cambios" |
| `/admin/settings/public/catalogo` | **PASS** — editor catálogo, readiness, preview dual (tab Catálogo), save "Sin cambios" |

Sin doble checklist ni doble preview detectado. No se ejecutó save ni upload.

## QA Operación

Ruta: `/admin/settings/operations` — **PASS**

- Carga correcta; secciones Suscripción de modos, Bajo demanda, Modo programado visibles
- Controles Abrir/Cerrar tienda presentes
- Sidebar Operación activo
- Sin impacto aparente por cambios de Team/Notificaciones

## QA Team

Ruta: `/admin/settings/team` — **PASS** (snapshot desktop)

- Summary superior "Resumen del equipo" visible
- "Usuarios internos" antes de "Nuevo usuario interno"
- Rol + "Guardar rol" asociados (combobox + botón en fila de operador@test.com)
- Inputs: Email, Contraseña temporal, Rol; hidden user_id preservado en código
- Copy con tildes (Administrá, Gestioná, Creá, Contraseña, Podés)
- Sidebar Equipo activo
- Usuario actual con restricción visible

Viewports 1440/820/390: no medidos con CDP en esta fase (evitado por cuelgue previo). QA previo de
SETTINGS-TEAM-1-QA reportó sin overflow en los tres viewports.

## QA Notificaciones

Ruta: `/admin/settings/notifications` — **PASS** (snapshot desktop)

- Summary "Resumen de notificaciones" con stats (avisos activos, permiso, notificación de pedidos)
- Estructura segmentada: Resumen / Avisos de nuevos pedidos / Dispositivo y permisos / Qué recibe tu
  equipo
- 4 checkboxes reales como switches accesibles
- Autosave verificado al restaurar Sonido (ver sección Demo data)
- Botón "Preparar este dispositivo" presente (local, no barra blanca global)
- Sidebar Notificaciones activo
- Sin solicitud automática de permiso del navegador observada

Viewports 1440/820/390: no medidos con CDP en esta fase. QA previo de SETTINGS-NOTIF-1 reportó sin
overflow.

## Responsive QA

Medición `scrollWidth === clientWidth` vía CDP **no ejecutada** (instrucción: evitar CDP por cuelgue
previo en `Runtime.evaluate`). Inspección vía browser snapshot en viewport desktop por defecto: todas
las rutas cargaron sin indicios de error de layout en el árbol de accesibilidad.

Deuda: re-medir 1440/820/390 en fase QA dedicada si se requiere evidencia formal.

## Console QA

Sin acceso a consola del navegador (CDP evitado). Snapshots no mostraron overlays de error de
Next.js ni mensajes de error en el árbol de accesibilidad. No se detectaron indicios de:

- `useActionState outside transition`
- hydration mismatch
- module not found

Validación de consola queda como inspección indirecta (runtime estable en todas las rutas).

## Sonido demo

**Restaurado a ON** durante esta fase:

- Método: click en fila "Sonido" vía `browser_click` (sin CDP `Runtime.evaluate`)
- Resultado: checkbox `checked`; mensaje "Preferencias de notificaciones actualizadas."; 4 de 4 avisos
  activos
- Autosave funcional confirmado

## Microfixes aplicados

**Ninguno.** No hubo errores de `tsc`/`build` ni imports rotos que requirieran corrección.

## Archivos modificados

Ninguno en código de producto durante SETTINGS-VALIDATION-1.

## Archivos creados

- `docs/admin-settings-validation-1-cli-browser-sweep.md` — este documento

## Qué se preservó

Server actions, DB, RLS, auth, permisos, roles, lógica push/browser permission, autosave, Team,
Public, Operations, uploads, Brand Palette.

## Qué NO se tocó

Server actions, `updateNotificationPreferencesAction`, `settings/public/actions.ts`, DB, RLS, auth,
push/service worker, middleware, Team/Public/Operations (código), `admin-surfaces.css` global,
reubicación de actions, cleanup CSS global.

## Riesgos restantes

- **Lint flake** (`Converting circular structure to JSON`) — deuda DEVX preexistente, no bloqueante.
- **Responsive formal** — no re-medido con CDP en esta fase; confianza en QA previo + snapshots.
- **Console formal** — no inspeccionada con DevTools; runtime estable en todas las rutas probadas.
- Deuda SETTINGS-CLEANUP-1: legacy `.admin-notification-settings-card__*` y reubicación de server
  action de notificaciones.

## Resultado final

**PASS**

- `tsc` PASS
- `build` PASS
- `lint` FAIL solo por flake conocido
- Settings hub, Public, Landing, Catálogo, Operations, Team, Notifications cargan correctamente
- Sonido restaurado a ON
- Sin microfixes requeridos
- Sin features nuevas ni rediseños

SETTINGS-TEAM-1 y SETTINGS-NOTIF-1 quedan **cerradas formalmente** a nivel validación técnica.

## Próxima fase recomendada

**SETTINGS-CLEANUP-1** — eliminar CSS legacy global (`.admin-notification-settings-card__*` en
`admin-surfaces.css`) y reubicar `updateNotificationPreferencesAction` a
`notifications/actions.ts`.
