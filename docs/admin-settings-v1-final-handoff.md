# Admin Settings V1 — Final Handoff

**Estado:** CERRADO — SETTINGS-HANDOFF-1 (2026-07-09)

Documento canónico del epic **Admin Settings V1**. Complementa Presencia pública V1 (`docs/admin-settings-public-v1-final-handoff.md`).

---

## Estado

| Módulo | Estado V1 |
|--------|-----------|
| Settings Hub | ✅ Cerrado |
| Presencia pública | ✅ Cerrado (PUBLIC-HANDOFF-1) |
| Operación | ✅ Smoke validado |
| Equipo | ✅ SETTINGS-TEAM-1 + validation PASS |
| Notificaciones | ✅ SETTINGS-NOTIF-1 + ACTIONS-1/2 PASS |

**Fases del epic Settings (post-hub):**

| Fase | Título | Estado |
|------|--------|--------|
| PUBLIC-HANDOFF-1 | Public Presence V1 Final Handoff | ✅ |
| SETTINGS-NT-AUDIT-1 | Notifications & Team Alignment Audit | ✅ |
| SETTINGS-TEAM-1 | Team Visual & IA Polish | ✅ |
| SETTINGS-NOTIF-1 | Notifications Visual & IA Polish | ✅ |
| SETTINGS-VALIDATION-1 | CLI & Browser Validation Sweep | ✅ |
| SETTINGS-CLEANUP-1 | Legacy CSS Cleanup | ✅ |
| SETTINGS-ACTIONS-1 | Notifications Action Relocation | ✅ |
| SETTINGS-ACTIONS-2 | Push Subscription Action Relocation | ✅ |
| SETTINGS-HANDOFF-1 | Settings V1 Final Handoff | ✅ |

---

## Resumen ejecutivo

Admin Settings V1 entrega una sección de configuración consolidada bajo `/admin/settings`, con IA enterprise (hub agrupado), shell compartido (`SettingsShell` + `SettingsNavigation`), subpáginas polish por módulo, Presencia pública unificada, Team y Notificaciones elevados al estándar visual Settings, cleanup de CSS legacy y consolidación de server actions de Notificaciones en `notifications/actions.ts`.

No hay dependencia semántica Notificaciones → `public/actions.ts`. `public/actions.ts` queda exclusivamente para Presencia pública.

---

## Alcance de Settings V1

**Incluido:**

- Hub `/admin/settings` con cards agrupadas (Presencia pública · Operación · Administración)
- Navegación Settings unificada (tabs filtradas por permiso)
- Presencia pública: overview + editores Landing/Catálogo con shell, readiness, preview dual
- Operación: reglas y modo de trabajo (store sessions)
- Equipo: vista canónica en `/admin/settings/team` + redirect `/admin/team`
- Notificaciones: pantalla dedicada segmentada + autosave por toggle
- CSS modules locales Team/Notificaciones; cleanup legacy en `admin-surfaces.css`
- Server actions Notificaciones consolidadas

**Excluido (deuda documentada):**

- Sticky save bar / dirty global transversal
- Nuevos canales de notificación (email, SMS, WhatsApp)
- Push delivery real (solo foundations + device prep)
- ESLint 9 fix
- Upload/save E2E en deploy staging

---

## Rutas finales

| Ruta | Rol |
|------|-----|
| `/admin/settings` | Hub índice enterprise |
| `/admin/settings/public` | Overview presencia pública (`PublicPresenceSummary`) |
| `/admin/settings/public/landing` | Editor Landing (identidad, presentación, Brand Palette) |
| `/admin/settings/public/catalogo` | Editor catálogo hero |
| `/admin/settings/operations` | Modo de trabajo y reglas operativas |
| `/admin/settings/notifications` | Preferencias de avisos + dispositivo/permisos |
| `/admin/settings/team` | Equipo canónico |
| `/admin/team` | Redirect → `/admin/settings/team` |

**SettingsNavigation tabs** (filtradas por permiso):

| Tab | Ruta | Requiere |
|-----|------|----------|
| Resumen | `/admin/settings` | — |
| Presencia pública | `/admin/settings/public` | `managePublicSettings` |
| Operación | `/admin/settings/operations` | — |
| Notificaciones | `/admin/settings/notifications` | — |
| Equipo | `/admin/settings/team` | `manageTeam` |

Editores Landing/Catálogo viven bajo `/admin/settings/public/*` — no son tabs de `SettingsNavigation`.

---

## Arquitectura por módulo

```
Sidebar / Drawer
  Configuración → /admin/settings

/admin/settings (hub)
  SettingsShell [showNavigation=false, anchorViewport=true]
    SettingsHubIndex

/admin/settings/* (subpáginas)
  SettingsShell [showNavigation=true]
    SettingsNavigation
    Page content
```

**Componentes clave:**

| Componente | Ubicación | Rol |
|------------|-----------|-----|
| `SettingsShell` | `components/admin/settings/settings-shell.tsx` | Layout + header + nav opcional |
| `SettingsNavigation` | `components/admin/settings/settings-navigation.tsx` | Tabs horizontales |
| `SettingsHubIndex` | `components/admin/settings/settings-hub-index.tsx` | Índice agrupado (solo hub) |
| `PublicPresenceEditorShell` | `components/admin/settings/public-presence-editor-shell.tsx` | Shell editores públicos |
| `PublicPresenceSummary` | `components/admin/settings/public-presence-summary.tsx` | Overview ejecutivo |
| `AdminTeamSettingsView` | `components/admin/team/admin-team-settings-view.tsx` | Equipo |
| `NotificationSettingsCard` | `components/admin/notifications/notification-settings-card.tsx` | Notificaciones |
| `OperationsSettingsClient` | `app/admin/(protected)/settings/operations/operations-settings-client.tsx` | Operación |

---

## Settings Hub

- Una sola card **Presencia pública** (sin cards Landing/Catálogo separadas)
- Grupos: Presencia pública · Operación · Administración
- Grid responsive 3/2/1; footer anclado al viewport en contenido corto
- Estado Notificaciones derivado de profile prefs (sin fetch extra)

---

## Presencia pública

Epic cerrado en PUBLIC-HANDOFF-1. Documento: `docs/admin-settings-public-v1-final-handoff.md`.

- IA unificada bajo tab **Presencia pública**
- Readiness unificado (`public-presence-readiness-model.ts`)
- Preview dual (`PublicPresencePreview`) sin iframe
- Dirty state parity Landing/Catálogo
- Brand Palette curada (16 colores)
- Uploads logo/portada con validación local

---

## Operación

- `/admin/settings/operations`
- `requireAdminPermission("manageNotifications")` en page
- Store sessions: abrir/cerrar tienda, modos suscripción (lectura)
- Layout consistente con SettingsShell

---

## Equipo

- Canónico: `/admin/settings/team`
- `requireAdminPermission("manageTeam")` (owner)
- Jerarquía: Resumen → Usuarios internos → Nuevo usuario interno
- CSS module: `team-settings.module.css`
- Forms: create + role change (sin cambios de lógica server en polish)

---

## Notificaciones

- `/admin/settings/notifications` (dedicada)
- Secciones: Resumen · Avisos · Dispositivo y permisos · Ayuda
- Autosave por toggle (`startTransition` + `updateNotificationPreferencesAction`)
- Push device prep vía `usePushSubscription` (feature futura documentada)
- CSS module: `notification-settings.module.css`

---

## Server actions finales

### `app/admin/(protected)/settings/notifications/actions.ts`

| Action | Consumidor |
|--------|------------|
| `updateNotificationPreferencesAction` | `notification-settings-card.tsx` |
| `savePushSubscriptionAction` | `use-push-subscription.ts` |
| `revokePushSubscriptionAction` | `use-push-subscription.ts` |

**Sin re-export deprecated.** SETTINGS-ACTIONS-1 comprobó que `export { ... } from` en archivos `"use server"` mixtos rompe el bundler.

### `app/admin/(protected)/settings/public/actions.ts`

| Action | Consumidor |
|--------|------------|
| `updatePublicBusinessSettingsAction` | `public-settings-form.tsx` |
| `updateCatalogHeroSettingsAction` | `public-catalog-settings-form.tsx` |

**No contiene lógica de Notificaciones ni push.**

### Deuda cosmética (no bloqueante)

- `logActionFailure` keys de notificaciones aún usan prefijo `settings.public.*`
- `revalidatePath("/admin/settings/public")` en actions de notificaciones/push (histórico)

---

## CSS y estilos

| Área | Estrategia |
|------|------------|
| Settings shell/hub | `settings-*.module.css` |
| Presencia pública | `public-presence-*.module.css` + `public-settings.css` |
| Team | `team-settings.module.css` |
| Notificaciones | `notification-settings.module.css` |
| Legacy removido | `.admin-team-*`, `.admin-notification-settings-card__*` de `admin-surfaces.css` |

**Regla:** no agregar estilos de componente a `admin-surfaces.css` ni `globals.css`.

---

## Responsive

- Hub: grid 3/2/1, `overflow-x: clip`
- Subpáginas: `SettingsNavigation` scroll horizontal en mobile
- SETTINGS-7 + STAGING-QA-1: 1440/820/390 validados históricamente
- SETTINGS-HANDOFF-1: inspección visual/snapshot en viewport actual (mobile menu visible); sin CDP por riesgo de cuelgue

---

## Accesibilidad

- Regions con `aria-label` en Team y Notificaciones
- Switch rows con checkbox real + labels asociados
- `aria-live` en feedback de autosave Notificaciones
- Navegación Settings con estados `current`

---

## QA final

**SETTINGS-HANDOFF-1** — `localhost:3000`, owner demo (La Burguesía), 2026-07-09.

| Ruta | Resultado |
|------|-----------|
| `/admin/settings` | PASS — cards Presencia/Operación/Notificaciones/Equipo; links correctos |
| `/admin/settings/public` | PASS — overview, readiness, accesos rápidos |
| `/admin/settings/public/landing` | PASS — shell, readiness, preview dual, save, Brand Palette |
| `/admin/settings/public/catalogo` | PASS — shell, fields, preview Catálogo activo, save |
| `/admin/settings/operations` | PASS — secciones modos, tienda abierta/cerrada |
| `/admin/settings/team` | PASS — resumen, usuarios, nuevo usuario, rol+guardar |
| `/admin/settings/notifications` | PASS — 4 switches ON (Sonido ON), dispositivo/permisos, ayuda |

**Console QA:** sin overlay de error runtime visible; sin module not found; sin hydration mismatch observable. CDP/DevTools no usado — validación por snapshot + ausencia de error overlay.

---

## Validaciones

| Comando | SETTINGS-HANDOFF-1 |
|---------|-------------------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9: `Converting circular structure to JSON` (deuda DEVX) |

---

## Qué se preservó

- Rutas, redirects, permisos y modelo de roles
- Server action contracts (solo reubicación ACTIONS-1/2)
- DB, RLS, auth, middleware, service worker, manifest
- Push client logic (`usePushSubscription`, `requestPermission`, SW)
- Dashboard, products, checkout público, realtime orders
- Theme tokens semánticos

---

## Qué NO se tocó

- DB / RLS / auth / permisos / roles
- Service worker / manifest / middleware
- Lógica push en cliente
- Uploads / Brand Palette (solo QA visual)
- `components/public/**`
- Orders / products / dashboard

---

## Deuda restante

| Prioridad | Item |
|-----------|------|
| DEVX P1 | Resolver ESLint 9 circular JSON flake |
| DEVX P2 | Next 16 middleware → proxy migration |
| P2 | Sticky save bar / unsaved changes UX transversal |
| P2 | Upload E2E logo/portada en deploy QA |
| P2 | Save catálogo E2E en deploy QA |
| P2 | Re-evaluar `revalidatePath` de notification actions → `/admin/settings/notifications` |
| P3 | Sweep docs históricos con rutas antiguas de actions |
| P3 | `logActionFailure` keys → `settings.notifications.*` |
| P3 | Team performance (`listUsers perPage: 1000`) |
| P3 | Flash "Cargando configuración..." entre páginas Settings |

---

## Riesgos conocidos

- **Bajo:** epic cerrado con build PASS y QA browser completo
- **Lint flake:** no bloquea deploy; no corregir sin fase DEVX dedicada
- **Docs históricos:** citan `public/actions.ts` para notificaciones — registro no funcional
- **Re-export en `"use server"`:** prohibido por bundler actual

---

## Próximas fases recomendadas

1. **Deploy/staging QA** — upload E2E + save catálogo + multi-rol permisos
2. **DEVX-1** — ESLint 9 circular config
3. **SETTINGS-UX-1** (opcional) — sticky save bar / dirty global
4. **SETTINGS-ACTIONS-3** (opcional) — alinear `revalidatePath` + `logActionFailure` keys

---

## Criterios de cierre

- [x] Hub + 6 subrutas Settings cargan sin error
- [x] Presencia pública V1 cerrada (PUBLIC-HANDOFF-1)
- [x] Team y Notificaciones polish + validation PASS
- [x] CSS legacy Team/Notif removido de `admin-surfaces.css`
- [x] Actions Notificaciones en `notifications/actions.ts`; `public/actions.ts` solo Presencia
- [x] Sin re-export deprecated
- [x] `tsc` + `build` PASS
- [x] Documentación canónica + completion report
- [ ] Deploy QA E2E uploads/save (pendiente staging)
- [ ] Multi-rol permisos browser QA (pendiente staging)

---

## Referencias documentales

| Documento | Contenido |
|-----------|-----------|
| `docs/admin-settings-public-v1-final-handoff.md` | Presencia pública V1 |
| `docs/admin-settings-v1-completion-report.md` | Reporte SETTINGS-HANDOFF-1 |
| `docs/admin-settings-notifications-team-alignment-audit.md` | Auditoría NT |
| `docs/admin-settings-team-1-visual-ia-polish.md` | Team polish |
| `docs/admin-settings-notif-1-visual-ia-polish.md` | Notif polish |
| `docs/admin-settings-validation-1-cli-browser-sweep.md` | Validation sweep |
| `docs/admin-settings-cleanup-1-legacy-css-cleanup.md` | CSS cleanup |
| `docs/admin-settings-actions-1-notifications-action-relocation.md` | ACTIONS-1 |
| `docs/admin-settings-actions-2-push-subscription-action-relocation.md` | ACTIONS-2 |
| `docs/admin-settings-staging-qa-1-browser-qa.md` | STAGING-QA-1 histórico |
