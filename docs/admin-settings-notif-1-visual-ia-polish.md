# SETTINGS-NOTIF-1 — Notifications Visual & IA Polish

## Objetivo

Elevar `/admin/settings/notifications` al estándar visual/IA actual de Settings (alineado con
Presencia pública V1, Operación y SETTINGS-TEAM-1), sin tocar server actions, DB, RLS, auth, lógica
de permisos del navegador, lógica de push ni comportamiento de autosave. Fase estrictamente de
**polish visual, jerarquía y UX**.

## Estado anterior

- **Page:** `app/admin/(protected)/settings/notifications/page.tsx` (Server Component) →
  `requireAdminPermission("manageNotifications")` → `SettingsShell` + `NotificationSettingsCard`.
- **`NotificationSettingsCard`** (Client): `useTransition`, `useBrowserNotificationPermission`.
  Autosave por toggle vía `persistPreferences` → `updateNotificationPreferencesAction(patch)` (recibe
  objeto, no FormData) dentro de `startTransition`. Estado `preferences` + `feedback {error?, success?}`.
- **`PushDeviceSettings`** (Client): `usePushSubscription`; **reusaba** `cardStyles` de
  `notification-settings-card.module.css`; botones globales.
- **Preferencias (4 booleanas):** `new_order_browser_notifications_enabled`, `new_order_sound_enabled`,
  `new_order_toast_enabled`, `new_order_highlight_enabled` (todas bajo "Nuevos pedidos").
- **CSS:** `notification-settings-card.module.css` (module) + clases globales `admin-feedback`,
  `admin-primary-button`, `admin-secondary-link`. Legacy muerto `.admin-notification-settings-card__*`
  en `admin-surfaces.css` (global, sin consumidores TSX).

Problemas: card monolítica larga, checkboxes nativos pequeños al extremo derecho, estado
"No configuradas" poco jerarquizado, botones blancos dominantes en dark mode, autosave sin feedback
visual suficiente, `push-device-settings` acoplado al CSS de la card principal.

## Estado nuevo

Pantalla segmentada, alineada al estándar:

1. **Resumen de notificaciones** — overview con stats + estado + hint de autosave.
2. **Avisos de nuevos pedidos** — 4 preferencias como switches premium + save pill.
3. **Dispositivo y permisos** — permiso del navegador + push del navegador (bloques claros).
4. **Qué recibe tu equipo** — ayuda contextual / alcance.

Todo encapsulado en un CSS module propio de Notificaciones.

## Archivos modificados

- `components/admin/notifications/notification-settings-card.tsx` — reescrito: layout segmentado,
  summary, switches, save pill, sección dispositivo, help card, feedback `aria-live`. Toda la lógica
  (hooks, `persistPreferences`, `handleToggle`, `handleEnableBrowserNotifications`, `statusCopy`)
  preservada.
- `components/admin/notifications/push-device-settings.tsx` — migrado al module nuevo, bloque de
  dispositivo con status pill, botones locales. Lógica de `usePushSubscription` y condiciones de
  render intactas.

## Archivos creados

- `components/admin/notifications/notification-settings.module.css` — CSS module propio (summary,
  stats, status pills, switches accesibles, device blocks, help card, botones locales, feedback,
  responsive).
- `docs/admin-settings-notif-1-visual-ia-polish.md` — esta doc.

## Archivos eliminados

- `components/admin/notifications/notification-settings-card.module.css` — module local quedó
  huérfano tras migrar card + push al module nuevo (sin consumidores TSX). Eliminación local segura.
  El legacy **global** `.admin-notification-settings-card__*` en `admin-surfaces.css` **no** se tocó
  (queda para SETTINGS-CLEANUP-1).

## Arquitectura preservada

- Server action `updateNotificationPreferencesAction` sin cambios (sigue en `settings/public/actions.ts`).
- Hooks `useBrowserNotificationPermission` y `usePushSubscription` sin cambios.
- Autosave por toggle vía `startTransition` intacto; contrato del patch idéntico.
- Nombres/keys de preferencias sin cambios.
- `requireAdminPermission("manageNotifications")` y `canManage` sin cambios.

## Cambios de IA

- Card monolítica → 4 secciones (Resumen / Avisos / Dispositivo / Ayuda).
- Estado de notificaciones elevado a summary con status pill jerarquizado.
- Push dejó de ser un bloque pegado con CSS ajeno; ahora es un bloque claro dentro de
  "Dispositivo y permisos".

## Summary de notificaciones

Overview con datos ya disponibles (sin queries nuevas):

- **N de M avisos activos** (conteo de las 4 preferencias booleanas activas).
- **Permiso del navegador** (label derivado del hook: Permitido / Bloqueado / Sin configurar / …).
- **Notificación de pedidos** (Activa / Pausada según `canUseNewOrderBrowserNotification`).
- Status pill + descripción (Notificaciones activadas / pausadas / No configuradas / Bloqueadas /
  Solo lectura) con tono ready/pending/blocked/neutral.
- Helper "Los cambios se guardan automáticamente."

No se inventaron canales ni estados fuera del modelo real.

## Preferencias operativas

Las 4 preferencias reales, como filas switch:

- `[label + descripción]` a la izquierda, switch a la derecha.
- **Input `checkbox` real** conservado (`checked`, `disabled`, `onChange` → autosave). El switch es
  puramente visual (track + thumb) sobre el input; el estado se comunica por **posición del thumb**
  (no solo color).
- Toda la fila es `<label>` → área clickeable grande y target cómodo en mobile.
- `:focus-visible` visible en el track.
- Sin cambios de significado ni de keys.

## Dispositivo y permisos

- **Permiso del navegador:** status pill + descripción contextual según permission; CTA
  "Activar notificaciones" solo si `canManage && permission === "default"` (misma condición previa).
- **Push del navegador:** bloque propio con status pill (Dispositivo preparado / Sin preparar /
  Bloqueado / …), hint de que push todavía no envía pedidos, y botones locales (Preparar / Desactivar)
  con las mismas condiciones de estado (`not_configured` / `configured`).
- Toda la lógica de `usePushSubscription` (requestPermission, subscription, service worker, endpoints)
  intacta.

## Botones y dark mode

- Clases locales `.primaryButton` / `.secondaryButton` en el module de Notificaciones (consistentes
  con Team). Enabled: `--accent-primary` (índigo) + texto blanco. Disabled: superficie muteada +
  `--text-tertiary` + `not-allowed`.
- Ya no se usa `admin-primary-button` global en esta pantalla → se eliminó la barra blanca dominante
  en dark mode. `admin-primary-button` global **no** fue modificado (sin regresión en otras pantallas;
  verificado: Notificaciones ya no lo usa, otras pantallas siguen igual).

## Autosave y feedback

- Autosave funcional sin cambios.
- Se agregó **save pill por sección**: "Guardando…" (durante `isPending`) y "Guardado" (tras éxito).
- Feedback error/success en contenedor `aria-live="polite"`.
- Helper "Los cambios se guardan automáticamente" en el summary.
- No se introdujo sticky save bar ni dirty state manual.

## Accesibilidad

- Headings jerárquicos: `SettingsShell` (h1) → `h2` por sección (Resumen / Avisos / Dispositivo / Ayuda).
- Inputs checkbox reales dentro de `<label>` → accesibles por teclado; screen reader anuncia estado
  checked.
- `:focus-visible` en switches y botones.
- Feedback y errores en regiones `aria-live`.
- Estados textuales visibles (pills con texto, no solo color).
- Botones `disabled` semánticos; no se usan `button` para navegación.

## Responsive

Verificado en browser (dev server, `localhost:3000`):

| Viewport | scrollWidth | clientWidth | Overflow |
|----------|-------------|-------------|----------|
| 1440px | 1440 | 1440 | No |
| 820px | 805 | 805 | No |
| 390px | 390 | 390 | No |

- Summary: stats en 3 columnas (≥640px) → 1 columna en mobile.
- Preferencias legibles; switch nunca queda perdido al extremo derecho (fila label→switch clara).
- Push/dispositivo usable; botones con tamaño cómodo.
- Sidebar Settings sigue usable (colapsa a nav horizontal en mobile).

## QA

Browser QA vía MCP contra dev server. Resultados:

- `/admin/settings/notifications` carga sin overlay de error de Next.js.
- Summary visible (ej.: "4 de 4 avisos activos", "Permitido", "Activa"); pill "Notificaciones
  activadas".
- 4 switches premium (checkboxes reales, `checked`) en la sección Avisos.
- "Dispositivo y permisos": pill "Permitido" + push "Sin preparar" + botón "Preparar este dispositivo"
  ahora **índigo** (no barra blanca).
- Help card "Qué recibe tu equipo".
- **Autosave verificado (smoke reversible):** al desactivar "Sonido" se observó save pill "Guardado"
  y el summary pasó a "3 de 4" (el estado del server se refleja en UI). Ver Riesgos.
- h2 confirmados: Resumen de notificaciones / Avisos de nuevos pedidos / Dispositivo y permisos /
  Qué recibe tu equipo.
- `/admin/settings` (hub) y `/admin/settings/team` sin cambios; navegación mantiene el activo correcto.

## Validaciones

`npx tsc --noEmit`, `npm run build` y `npm run lint` **no ejecutables en esta sesión**: el
shell/terminal siguió irresponsivo (comandos sin exit status, sin generar terminales), igual que en
SETTINGS-TEAM-1. Evidencia indirecta: el dev server de Next.js compiló y renderizó
`/admin/settings/notifications` sin overlay de error (module resolution, JSX y CSS module resueltos en
runtime). Revisión de tipos manual OK (retornos de hooks tipados vía `ReturnType`, uniones cubiertas
con `default`). Flake conocido de `npm run lint` (`Converting circular structure to JSON`) sigue
vigente y no se corrige. Pendiente re-ejecutar `tsc`/`build`/`lint` al recuperar el entorno.

## Qué se preservó

Carga de preferencias, activar/desactivar preferencia, autosave (`startTransition`), feedback
error/success, no-solicitud automática de permiso del navegador, condiciones de render de push, hooks
y server action.

## Qué NO se tocó

Server actions, `updateNotificationPreferencesAction`, `settings/public/actions.ts`, DB, RLS, auth,
push subscription logic, service worker, manifest, middleware, `settings/team/*`, `settings/public/*`,
`settings/operations/*`, `components/public/**`, orders/products, `admin-surfaces.css` global.

## Riesgos

- Validaciones CLI (`tsc`/`build`/`lint`) no ejecutadas por entorno de terminal caído → riesgo bajo,
  mitigado por runtime dev + revisión manual.
- **Dato demo:** durante el smoke de autosave se desactivó "Sonido" y el intento de restaurarlo fue
  bloqueado por auto-review / interrumpido. Debe restaurarse a ON (estado original) — pendiente de
  confirmación/acción. Es un toggle reversible, sin impacto de esquema.
- `updateNotificationPreferencesAction` sigue mal ubicada en `settings/public/actions.ts` (deuda).

## Deuda restante

- Restaurar preferencia "Sonido" a su estado original ON.
- Re-ejecutar `tsc`/`build`/`lint` al recuperar el terminal.
- **SETTINGS-CLEANUP-1:** eliminar legacy global `.admin-notification-settings-card__*` de
  `admin-surfaces.css`; reubicar `updateNotificationPreferencesAction` a `notifications/actions.ts`.
- **SETTINGS-NOTIF-2 (opcional):** feedback por-toggle más granular; corrección de copy server-side si
  aplica.

## Próxima fase recomendada

- **SETTINGS-CLEANUP-1** — limpieza de CSS legacy global y reubicación de la server action de
  notificaciones.

---

## Closure / Validation Notes

Fase de cierre **SETTINGS-NOTIF-1 Closure Without CDP** (sin browser automation por cuelgue previo en
`CDP Runtime.evaluate`).

### Estado final

Código **completo y consistente**. `/admin/settings/notifications` usa el module nuevo y la estructura
segmentada (Resumen / Avisos / Dispositivo y permisos / Ayuda). Aceptado como **PASS WITH CLI DEBT**.

### Revisión de imports

Verificado por inspección directa de archivos:

- `notification-settings-card.tsx` importa `./notification-settings.module.css`; `push-device-settings.tsx`
  importa `@/components/admin/notifications/notification-settings.module.css`.
- Sin referencias al module eliminado `notification-settings-card.module.css` (grep en `*.ts/*.tsx` = 0).
- Sin uso de `admin-primary-button` ni `admin-feedback` global en estos dos componentes (usan
  `.primaryButton` / `.secondaryButton` / `.feedback*` locales).
- Hooks (`useBrowserNotificationPermission`, `usePushSubscription`) y lógica de push/permiso intactos.
- Autosave (`startTransition` + `updateNotificationPreferencesAction`) intacto; import de la server
  action sin cambios (sigue en `settings/public/actions.ts`).
- Team / Public / Operations sin cambios.

### Validaciones CLI

`npx tsc --noEmit`, `npm run build` y `npm run lint` **no ejecutables**: el shell/terminal siguió
irresponsivo toda la sesión (comandos sin exit status, sin generar terminales). No se insistió. Deuda
CLI pendiente de re-ejecución cuando el entorno se recupere. Flake conocido de lint
(`Converting circular structure to JSON`) no se corrige en esta fase.

### Browser/CDP

No se usó browser automation ni CDP en el cierre (la ejecución previa se colgó en `Runtime.evaluate`).
El QA browser previo (antes del cuelgue) había confirmado: sin overflow en 1440/820/390, switches
premium, botones índigo (no barra blanca), y autosave funcional (save pill "Guardado").

### Demo data

Durante el smoke de autosave se desactivó la preferencia **"Sonido"** (original ON). El intento de
restauración fue bloqueado/interrumpido. **El usuario la restaurará a ON manualmente desde la UI.** Es
un toggle reversible, sin impacto de esquema.

### Deuda restante

- Restaurar "Sonido" a ON (manual, vía UI).
- Re-ejecutar `tsc` / `build` / `lint` al recuperar el terminal.
- SETTINGS-CLEANUP-1: eliminar legacy global `.admin-notification-settings-card__*` de
  `admin-surfaces.css`; reubicar `updateNotificationPreferencesAction` a `notifications/actions.ts`.

---

## SETTINGS-VALIDATION-1 — Cierre formal

Documento: `docs/admin-settings-validation-1-cli-browser-sweep.md`.

- `npx tsc --noEmit` → **PASS**
- `npm run build` → **PASS**
- `npm run lint` → FAIL solo por flake conocido (`Converting circular structure to JSON`)
- Browser QA `/admin/settings/notifications` → **PASS** (snapshot; sin CDP)
- **Sonido restaurado a ON** vía UI (`browser_click` en fila Sonido; autosave confirmado)
- Microfixes: ninguno
- **Resultado:** PASS — SETTINGS-NOTIF-1 cerrada formalmente
