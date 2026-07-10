# SETTINGS-NT-AUDIT-1 — Notifications & Team Alignment Audit

## Objetivo

Auditar en profundidad `/admin/settings/notifications` y `/admin/settings/team` para determinar qué falta para alinearlos visual, estructural y funcionalmente con el estándar de Settings tras el cierre de **Presencia pública V1**. Salida: documento técnico con hallazgos, riesgos, deuda, archivos y roadmap quirúrgico. **No se modificó código.**

## Alcance

- **Auditoría pura.** Cero cambios de código, CSS, server actions, DB, RLS, auth, permisos, rutas.
- Rutas auditadas a fondo: Notificaciones, Equipo.
- Rutas usadas solo como referencia de estándar (no tocadas): `/admin/settings`, `/admin/settings/public`, `/public/landing`, `/public/catalogo`, `/admin/settings/operations`.

## Contexto visual

Estándar elevado por Presencia pública V1: overview ejecutivo, shell consistente, cards compactas y segmentadas, jerarquía clara, readiness/status, dirty state visible, save flow explícito, responsive cuidado, copy de producto y CSS modular por componente.

Observaciones del usuario (confirmadas en browser smoke):

- **Notificaciones:** card única larga y poco segmentada; checkboxes nativos pequeños al extremo derecho; botón muy blanco/prominente; estado "No configuradas" poco jerarquizado; falta estructura resumen + configuración + canales; se siente menos premium.
- **Equipo:** título pegado arriba; formulario "Nuevo usuario interno" domina la página; lista "Usuarios internos" poco refinada; control de rol muy separado del usuario; botón muy blanco/prominente; falta resumen de equipo/roles/permisos; falta jerarquía crear vs gestionar.

## Rutas auditadas

| Ruta | Estado | Método |
|------|--------|--------|
| `/admin/settings` | Referencia (hub OK) | Código + browser |
| `/admin/settings/notifications` | Auditada | Código + browser 1440/390 |
| `/admin/settings/team` | Auditada | Código + browser 1440/390 |
| `/admin/settings/operations` | Referencia estándar | Código |
| `/admin/settings/public*` | Referencia estándar | Código (V1 cerrado) |

## Mapa de archivos

### Settings general / shared

| Archivo | Responsabilidad | Tipo | Estado local | Server action | CSS | Estado |
|---------|-----------------|------|-------------|---------------|-----|--------|
| `components/admin/settings/settings-shell.tsx` | Layout header + nav interna + content | Server | No | No | `settings-shell.module.css` | Activo (estándar) |
| `components/admin/settings/settings-navigation.tsx` | Tabs internas Settings | Client | `usePathname` | No | `settings-navigation.module.css` | Activo |
| `components/admin/settings/settings-card.tsx` | Card enlace overview | Server | No | No | `settings-card.module.css` | Activo |
| `components/admin/settings/settings-hub-index.tsx` | Índice hub `/admin/settings` | Server | No | No | `settings-hub-index.module.css` | Activo |
| `app/admin/(protected)/settings/page.tsx` | Hub root | Server | — | No | módulos | Activo |

### Notifications

| Archivo | Responsabilidad | Tipo | Estado local | Server action | CSS | Estado |
|---------|-----------------|------|-------------|---------------|-----|--------|
| `app/admin/(protected)/settings/notifications/page.tsx` | Page; envuelve card en `SettingsShell` | Server | No | No | — | Activo |
| `components/admin/notifications/notification-settings-card.tsx` | Card principal: status, meta, toggles, feedback | Client | `useState`/`useTransition` | `updateNotificationPreferencesAction` | `notification-settings-card.module.css` | Activo |
| `components/admin/notifications/push-device-settings.tsx` | Sub-bloque push del navegador | Client | vía hook | No (usa hook) | **reusa** `notification-settings-card.module.css` | Activo |
| `components/admin/notifications/use-browser-notification-permission.ts` | Permiso Notification API | Hook | Sí | No | — | Activo |
| `components/admin/notifications/use-push-subscription.ts` | Estado suscripción push | Hook | Sí | (push endpoints) | — | Activo |
| `components/admin/notifications/audio-unlock-gate.tsx` / `audio-unlock-modal.tsx` | Desbloqueo de audio (dashboard) | Client | Sí | No | `audio-unlock-modal.module.css` | Activo (fuera de la ruta Settings) |
| `lib/notifications/preferences.ts` | Normalización + selectores de preferencias | Lib | — | — | — | Activo |

### Team

| Archivo | Responsabilidad | Tipo | Estado local | Server action | CSS | Estado |
|---------|-----------------|------|-------------|---------------|-----|--------|
| `app/admin/(protected)/settings/team/page.tsx` | Re-export `export default AdminTeamSettingsView` | Server | — | — | — | Activo (patrón atípico) |
| `app/admin/(protected)/team/page.tsx` | Redirect legacy → `/admin/settings/team` | Server | — | — | — | Activo |
| `components/admin/team/admin-team-settings-view.tsx` | Vista: shell + form crear + lista usuarios | Server | No | `getBusinessTeamMembers` (lee) | **global** `admin-surfaces.css` | Activo |
| `components/admin/team/create-team-member-form.tsx` | Form alta usuario | Client | `useActionState` | `createTeamMemberAction` | **global** `admin-surfaces.css` | Activo |
| `components/admin/team/team-member-role-form.tsx` | Form cambio de rol por fila | Client | `useState`/`useActionState` | `updateTeamMemberRoleAction` | **global** `admin-surfaces.css` | Activo |
| `app/admin/(protected)/team/actions.ts` | Server actions crear/rol | Server | — | Sí | — | Activo (sensible) |
| `lib/admin/team.ts` | Data access equipo (service client) | Lib server-only | — | — | — | Activo (sensible) |

### Server actions relacionadas

| Action | Ubicación | Notas |
|--------|-----------|-------|
| `updateNotificationPreferencesAction` | `app/admin/(protected)/settings/public/actions.ts` | **Deuda de ubicación:** acción de notificaciones vive en el archivo de acciones de *public*. Input tipado (no FormData). Valida `canManageNotifications`. Usa service client. |
| `createTeamMemberAction` | `app/admin/(protected)/team/actions.ts` | Crea auth user + profile. `requireAdminPermission("manageTeam")`. |
| `updateTeamMemberRoleAction` | `app/admin/(protected)/team/actions.ts` | Cambia rol. Valida tenant + rol manejable. |
| `getBusinessTeamMembers` | `lib/admin/team.ts` | `auth.admin.listUsers({ perPage: 1000 })` — deuda de escala. |

## Auditoría de Notificaciones

### Arquitectura

- `page.tsx` (server) resuelve `requireAdminPermission("manageNotifications")` y pasa `initialPreferences` + `canManage` a `NotificationSettingsCard`.
- Card client con `useTransition`; persiste cada toggle inmediatamente vía `updateNotificationPreferencesAction` (autosave por toggle, sin botón guardar).
- Permiso de navegador vía `useBrowserNotificationPermission`; push vía `usePushSubscription`.
- Preferencias persistidas en `profiles.notificationPreferences` (JSON) normalizadas por `lib/notifications/preferences.ts`.
- Push: estado preparatorio ("Todavía no enviamos pedidos por push") — feature futura declarada.

### UX

- **Un solo bloque largo** (`section.card`) con: header, status, meta, actions condicionales, sección "Nuevos pedidos" con 4 toggles, y sub-bloque "Push del navegador". Poca segmentación jerárquica.
- **Toggles = checkboxes nativos** 18px alineados a la derecha (`grid-template-columns: minmax(0,1fr) auto`). Estéticamente por debajo del estándar (no hay switch component).
- **Autosave sin feedback de estado por control**: feedback global `admin-feedback` al final; no hay "Guardando…"/"Guardado" por fila.
- Status copy contextual bien resuelto (activadas/pausadas/bloqueadas/no configuradas/solo lectura), pero visualmente compite con "meta" en texto plano.
- Botón "Activar notificaciones" y "Preparar este dispositivo" usan `admin-primary-button` global → en dark mode se ven **blancos/muy prominentes**.

### CSS

- Módulo propio `notification-settings-card.module.css` (bien) con tokens semánticos.
- **Reuso cross-component:** `push-device-settings.tsx` importa el módulo de la card (`cardStyles`) — acoplamiento entre dos componentes vía un mismo módulo.
- Botones/feedback dependen de clases **globales** (`admin-primary-button`, `admin-secondary-link`, `admin-feedback`).
- **CSS legacy muerto:** `admin-surfaces.css` conserva el bloque `.admin-notification-settings-card__*` (status, meta, actions, section, list, item, copy…) que **ningún TSX usa** (la card migró a módulo). Candidato a limpieza.

### Estado funcional

- Funciona: toggles persisten, permiso de navegador solicitado correctamente, push preparatorio.
- `manageNotifications` gating correcto (solo lectura si no puede).
- Responsive: sin overflow en 1440/390; card se apila bien en mobile.

### Riesgos

- Autosave por toggle: cualquier rediseño a "switches" debe preservar `handleToggle` + `startTransition` (evitar warning useActionState/uncontrolled).
- `updateNotificationPreferencesAction` recibe **objeto tipado**, no FormData — no convertir a `<form action>` sin ajustar.
- Push: no romper `usePushSubscription` ni la copia "feature futura".

## Auditoría de Equipo

### Arquitectura

- `page.tsx` = `export default AdminTeamSettingsView` (re-export directo de server component async). Atípico pero válido.
- Vista server carga `getBusinessTeamMembers(businessId)` y renderiza: `CreateTeamMemberForm` + sección "Usuarios internos" con filas y `TeamMemberRoleForm` por usuario editable.
- Alta y cambio de rol vía server actions con `useActionState` + `router.refresh()`.
- Roles manejables: manager/operator/viewer. Owner/admin/super_admin no editables desde Equipo.

### UX

- **Jerarquía invertida:** el form "Nuevo usuario interno" (full width, inputs grandes) **domina** y empuja "Usuarios internos" bajo el fold. Crear pesa más que gestionar.
- **Control de rol desacoplado:** en desktop la fila usa `grid 1.4fr / 0.8fr`; el `select` de rol queda al **extremo derecho**, visualmente separado del email/rol-chip a la izquierda.
- **Botón "Crear usuario"** full-width con `admin-primary-button` → en dark mode barra **blanca muy prominente**.
- **Falta resumen de equipo** (conteo por rol, tu usuario actual, permisos). No hay overview tipo Presencia.
- Chips de rol simples (texto plano en píldora gris), sin diferenciación por rol.
- Copy con **falta de tildes** ("Contrasena", "Crea", "podes", "email valido") — inconsistente con copy de producto de Presencia/Operación.
- Empty state correcto cuando no hay usuarios.

### CSS

- **100% CSS global** (`components/admin/admin-surfaces.css`): `admin-team-layout`, `admin-team-row*`, `admin-team-role-chip`, `admin-form-card`, `admin-field`, `admin-primary-button`, `admin-feedback`, `admin-empty-state`. Compartido con orders/products.
- No hay módulo CSS de Team — **mayor divergencia** respecto al estándar (Presencia/Operación usan módulos por componente).
- Inputs `admin-field` con `min-height:44px` full width → campos muy anchos y planos en desktop.

### Estado funcional

- Alta de usuario, cambio de rol y guardas de tenant funcionan (validación en action + `lib/admin/team.ts`).
- No permite auto-degradarse (actor ≠ target).
- Responsive: sin overflow en 1440/390; en mobile apila form y filas correctamente.

### Riesgos

- **Server actions sensibles:** creación de usuarios (auth admin) y cambios de rol. Cualquier polish visual **no debe** tocar `actions.ts`, `lib/admin/team.ts`, ni los `name`/estructura de los forms.
- `useActionState` + `router.refresh()` + `formRef.reset()` deben preservarse (feedback y limpieza post-alta).
- `getBusinessTeamMembers` usa `listUsers({ perPage: 1000 })` — deuda de escala (no abordar en polish visual).

## Comparación contra estándar actual de Settings

| Dimensión | Presencia pública / Operación (estándar) | Notificaciones | Equipo |
|-----------|------------------------------------------|----------------|--------|
| Shell | `SettingsShell` + nav interna | ✅ igual | ✅ igual |
| CSS | Módulos por componente | ⚠️ módulo + globals (botones/feedback) | ❌ 100% global `admin-surfaces.css` |
| Overview/summary | Sí (`PublicPresenceSummary`) | ❌ no | ❌ no |
| Segmentación en cards | Secciones claras | ⚠️ una card larga | ⚠️ form domina + lista |
| Status/readiness | Readiness dedicado | ⚠️ status en texto plano | ❌ ninguno |
| Save flow | Explícito (Sin cambios/Guardar/Guardado) | ⚠️ autosave sin feedback por control | ✅ botón con pending (pero estilo plano) |
| Botones | `Button` UI (Operación) / tokens | ❌ `admin-primary-button` blanco | ❌ `admin-primary-button` blanco |
| Controles | Palette/preview refinados | ⚠️ checkboxes nativos | ⚠️ select nativo desacoplado |
| Copy | Producto, con tildes | ✅ correcto | ❌ sin tildes en varios strings |
| Responsive | Cuidado | ✅ sin overflow | ✅ sin overflow |
| Documentación por fase | Sí | Parcial (SETTINGS-5) | Parcial (SETTINGS-6) |

Nota: **Operación** es el techo de calidad de código (módulo propio + `Button`/`Input` UI). **Equipo** es el más rezagado.

## Auditoría responsive

Browser smoke (dev localhost:3000, owner demo):

| Ruta | 1440px | 390px | Overflow horizontal |
|------|--------|-------|---------------------|
| Notificaciones | ✅ | ✅ | No (`scrollWidth === clientWidth`) |
| Equipo | ✅ | ✅ | No |

820px no medido explícitamente pero el layout es de una columna (content) sin grid multi-columna que rompa entre 768–1099; riesgo bajo. Registrar como verificación ligera pendiente.

Observaciones responsive:

- Notificaciones: toggles quedan pegados al borde derecho de la card en todas las anchuras.
- Equipo: en desktop el select de rol viaja al extremo derecho por el grid 2-col; en mobile colapsa a 1 col (mejor).

## Auditoría de accesibilidad

- **Headings:** jerarquía correcta (h1 shell, h2 cards, h3 filas usuario). Team h2 "Nuevo usuario interno" y "Usuarios internos" OK.
- **Labels:** inputs con `<label><span>` (Team) y `<label>` envolvente en toggles (Notificaciones) → checkbox accesible por nombre compuesto.
- **Checkboxes:** nativos con `accent-color` y `:focus-visible` (box-shadow focus-ring) — accesibles, pero small target (~18px) por debajo de 24px recomendado.
- **Selects:** nativos, accesibles; el de rol tiene `<label>Rol</label>`.
- **Botones disabled:** `admin-primary-button:disabled { opacity: .45 }` — contraste del texto puede bajar; en dark mode el botón blanco al 45% sigue prominente.
- **Feedback:** `admin-feedback` no tiene `aria-live` → cambios de "Usuario creado"/"Rol actualizado"/"Preferencias actualizadas" no se anuncian a lectores de pantalla. **Deuda a11y.**
- **Focus-visible:** presente en inputs, checkboxes y botones globales.
- **Links vs buttons:** correcto (acciones = `<button>`).
- **Contraste:** botón primario blanco sobre superficie oscura tiene contraste alto (ok); chips de rol gris sobre surface-soft — contraste aproximado moderado, revisar en polish.

## CSS y deuda visual

- **Global compartido (`admin-surfaces.css`)**: fuente de casi todo el estilo de Team y de los botones/feedback de Notificaciones. Tocarlo afecta orders/products → **alto riesgo** de regresión cross-módulo.
- **CSS legacy muerto:** `.admin-notification-settings-card__*` (≈ líneas 451–531 de `admin-surfaces.css`) sin consumidores TSX. Candidato de limpieza segura (verificar con `rg` antes).
- **Acoplamiento de módulo:** `push-device-settings.tsx` reusa el módulo de la card.
- **Botón blanco prominente:** `admin-primary-button { background: var(--text-primary); color:#fff }` — en dark mode se ve como barra blanca; principal causa de la percepción "poco premium".
- **Candidatos a CSS modules:** Team completo (`team.module.css`), y extraer botones/estado a componentes/módulos en vez de globals.
- **Duplicación de patrón toggle-list:** existe en módulo (Notificaciones) y en legacy global (muerto) — consolidar al migrar.

## Server actions y comportamiento sensible

**No tocar en fases de polish visual:**

- `createTeamMemberAction`, `updateTeamMemberRoleAction` (`app/admin/(protected)/team/actions.ts`)
- `getBusinessTeamMembers`, `createBusinessTeamMember`, `updateBusinessTeamMemberRole` (`lib/admin/team.ts`)
- `updateNotificationPreferencesAction` (`app/admin/(protected)/settings/public/actions.ts`)
- Contratos: `name` de inputs, forma del input tipado de notificaciones, `useActionState` + `router.refresh()`.
- Permisos: `manageNotifications`, `manageTeam`; guardas de tenant y auto-degradación.

## Hallazgos principales

1. **Equipo es el módulo más rezagado**: sin summary, jerarquía invertida (crear domina gestionar), rol desacoplado, 100% CSS global, copy sin tildes.
2. **Notificaciones se siente plano**: card monolítica, checkboxes nativos, botones blancos, autosave sin feedback por control.
3. **Botón primario blanco** (`admin-primary-button` en dark) es la causa transversal de "poco premium" en ambos.
4. **CSS de Team acoplado a global compartido** con orders/products → riesgo de regresión.
5. **CSS legacy muerto** `.admin-notification-settings-card__*` en `admin-surfaces.css`.
6. **`updateNotificationPreferencesAction` mal ubicada** en el archivo de acciones de *public*.
7. **Falta `aria-live`** en feedback de guardado (a11y).
8. **`page.tsx` de Team** re-exporta el view (patrón atípico, no bloqueante).
9. Responsive OK en ambos (sin overflow 1440/390).
10. `getBusinessTeamMembers` con `perPage: 1000` — deuda de escala conocida.

## Recomendaciones

- Introducir **summary/status block** en ambos (equipo por rol; notificaciones estado consolidado).
- Migrar Team a **módulo CSS propio**; extraer botón primario a componente/estilo con variante menos "blanca" (o usar `Button` UI como Operación).
- Segmentar Notificaciones en **resumen + canales + push** con controles tipo switch.
- Añadir **feedback de guardado con `aria-live`**.
- Limpiar CSS legacy muerto y reubicar la acción de notificaciones (fase cleanup, con cuidado).
- Corregir copy (tildes) en Team como microfix de bajo riesgo dentro de la fase visual.

## Roadmap quirúrgico propuesto

### SETTINGS-NT-1 — Notifications Visual & IA Polish
- **Objetivo:** segmentar en resumen + canales + push; switches; botón menos prominente; feedback con `aria-live`.
- **Scope:** `notification-settings-card.tsx` (+ módulo), `push-device-settings.tsx` (+ módulo propio para desacoplar).
- **Fuera de scope:** `updateNotificationPreferencesAction`, permisos, push endpoints, autosave logic.
- **Archivos candidatos:** los dos componentes + nuevos `*.module.css`.
- **QA:** toggles persisten; permiso navegador; responsive 1440/820/390; sin warning useActionState.
- **Riesgos:** romper autosave/`startTransition`.
- **Aceptación:** sin cambios de comportamiento; UI segmentada; a11y feedback.

### SETTINGS-TEAM-1 — Team Visual & IA Polish
- **Objetivo:** jerarquía "gestionar > crear", summary de equipo, fila de usuario con rol integrado, botón refinado, copy con tildes.
- **Scope:** `admin-team-settings-view.tsx`, `create-team-member-form.tsx`, `team-member-role-form.tsx` + nuevo `team.module.css`.
- **Fuera de scope:** `actions.ts`, `lib/admin/team.ts`, permisos, creación de usuarios.
- **Archivos candidatos:** los 3 componentes + módulo CSS nuevo.
- **QA:** alta usuario, cambio rol, empty state, responsive, tenant guards intactos.
- **Riesgos:** tocar `name` de inputs o server actions.
- **Aceptación:** mismo comportamiento; IA mejorada; CSS modular.

### SETTINGS-NT-2 — Notifications Save/Status UX Parity
- **Objetivo:** feedback de guardado por control + estado consolidado tipo readiness.
- **Scope:** solo UI/estado del componente de notificaciones.
- **Fuera de scope:** persistencia/acción.

### SETTINGS-TEAM-2 — Role Management UX Parity
- **Objetivo:** explicación compacta de roles/permisos; badges por rol; confirmación de cambio.
- **Fuera de scope:** transfer ownership, invitaciones por email, escala `listUsers`.

### SETTINGS-CLEANUP-1 — Settings CSS & Action Placement Cleanup
- **Objetivo:** eliminar `.admin-notification-settings-card__*` legacy; evaluar reubicar `updateNotificationPreferencesAction` a un `notifications/actions.ts`; reducir dependencia de `admin-surfaces.css`.
- **Riesgos:** `admin-surfaces.css` es compartido con orders/products → auditar `rg` exhaustivo antes de borrar.

### SETTINGS-HANDOFF-1 — Settings V1 Final Handoff
- **Objetivo:** cierre formal de Settings V1 (incluye Presencia, Operación, Notificaciones, Equipo) con QA y deuda priorizada.

## Fuera de scope recomendado

- Transfer ownership / invitaciones por email.
- Push notifications real E2E.
- Escala `getBusinessTeamMembers` (paginación/búsqueda).
- Refactor de `admin-surfaces.css` global (solo cleanup acotado y verificado).
- Migración middleware→proxy, ESLint flat config.

## Próxima fase sugerida

**SETTINGS-TEAM-1 — Team Visual & IA Polish** (mayor brecha vs estándar y mayor impacto percibido), seguida de **SETTINGS-NT-1**. Ejecutar `SETTINGS-CLEANUP-1` solo tras ambas, con auditoría previa de `admin-surfaces.css`.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** (estado base) |
| `npm run build` | No ejecutado (fase auditoría) |
| `npm run lint` | No ejecutado; flake conocido `Converting circular structure to JSON` (ESLint 9) documentado en fases previas |

**Código de producto:** sin cambios.
