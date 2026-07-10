# Admin Settings & Team — SETTINGS-1 Forensic Audit

## Objetivo

Auditar integralmente **Configuración** y **Equipo** para preparar una consolidación premium alineada a Dashboard/Products, sin implementar cambios en esta fase.

## Contexto

- Sidebar actual: Pedidos, Productos (según rol), **Equipo**, **Configuracion**.
- Usuario objetivo: Equipo dentro de Configuración; `/admin/settings` como hub premium vendible.
- Referencias leídas: `board-orders-execution-area-v1-final-handoff.md`, `admin-products-v1-visual-handoff.md`, `public-checkout-anonymous-order-fix-prod-4.md`, `admin-sidebar-collapsed-theme-active-icon-s1-2.md`, `admin-mobile-header-drawer-final-handoff.md`.
- Ausentes (no bloqueante): `admin-sidebar-enterprise-polish-s1-1.md` (existe `s1.md` y `s1-1.md`).

## Captura / QA visual inicial

Observaciones de código + captura referida en brief:

```txt
- Configuración menos premium que Dashboard/Products.
- Tabs pill en public-settings.css con colores hardcoded (#1f1a14, #dfd4c8).
- Cards admin-form-card genéricas vs DashboardShell/products operational.
- Header sin variant="operational" en settings.
- Mezcla Resumen (notificaciones + links) + Landing + Catálogo + Operaciones en rutas dispares.
- Equipo como entrada sidebar separada con layout wide simple.
```

## Rutas auditadas

| Ruta | Existe | Notas |
|------|--------|-------|
| `/admin/settings` | **No** | No hay `page.tsx` ni redirect |
| `/admin/settings/public` | Sí | Hub actual = “Resumen” |
| `/admin/settings/public/landing` | Sí | Landing pública |
| `/admin/settings/public/catalogo` | Sí | Hero catálogo |
| `/admin/settings/operations` | Sí | Fuera de `/public/` |
| `/admin/team` | Sí | Entrada sidebar propia |
| `/admin/settings/team` | **No** | — |
| `/admin/settings/users` | **No** | — |
| `/admin/settings/members` | **No** | — |
| `/admin/settings/notifications` | **No** | Vive en overview |
| `/admin/settings/business` | **No** | — |
| `/admin/settings/catalog` | **No** | — |

## Archivos auditados

### App routes

- `app/admin/(protected)/settings/public/page.tsx`
- `app/admin/(protected)/settings/public/landing/page.tsx`
- `app/admin/(protected)/settings/public/catalogo/page.tsx`
- `app/admin/(protected)/settings/public/actions.ts`
- `app/admin/(protected)/settings/operations/page.tsx`
- `app/admin/(protected)/settings/operations/actions.ts`
- `app/admin/(protected)/settings/operations/operations-settings-client.tsx`
- `app/admin/(protected)/settings/operations/operations-settings.module.css`
- `app/admin/(protected)/team/page.tsx`
- `app/admin/(protected)/team/actions.ts`

**No existen:** `settings/page.tsx`, `settings/layout.tsx`, `settings/actions.ts` raíz.

### Components

- `components/admin/settings/public-settings-nav.tsx`
- `components/admin/settings/public-settings-form.tsx`
- `components/admin/settings/public-catalog-settings-form.tsx`
- `components/admin/settings/public-settings.css`
- `components/admin/team/create-team-member-form.tsx`
- `components/admin/team/team-member-role-form.tsx`
- `components/admin/notifications/notification-settings-card.tsx`
- `components/admin/notifications/push-device-settings.tsx`
- `components/admin/admin-nav-config.ts`
- `components/admin/admin-shell.tsx`
- `components/admin/admin-page-header.tsx`
- `components/admin/admin-page-layout.tsx`
- `components/admin/admin-surfaces.css`

### Lib

- `lib/admin/permissions.ts`
- `lib/admin/team.ts`
- `lib/business/use-business-settings.ts`
- `lib/notifications/preferences.ts`
- `lib/notifications/push.ts`
- `lib/notifications/web-push.server.ts`

## Búsquedas ejecutadas

```bash
rg "/admin/team|Equipo|manageTeam" app components lib docs
rg "/admin/settings|settings/public|settings/operations" app components lib
rg "Configuracion|publica|catalogo|Mostra|Reproduci" app components
rg "AdminPageLayout|admin-form-card|DashboardShell|variant=\"operational\"" app components
rg "use server|revalidatePath|noStore" app/admin/(protected)/settings app/admin/(protected)/team
rg "VAPID|push_subscriptions|notification_preferences" app components lib
rg "legacy|TODO|FIXME" components/admin/settings components/admin/team
```

## Arquitectura de información actual

```txt
Sidebar (admin-nav-config.ts):
├── Pedidos          → /admin/dashboard        (viewOrders)
├── Cocina           → /admin/kitchen          (feature flag, viewOrders)
├── Productos        → /admin/products         (manageProducts)
├── Equipo           → /admin/team             (manageTeam = owner only)
└── Configuracion    → /admin/settings/public  (manageNotifications)

Dentro de “Configuración” (tabs PublicSettingsNav):
├── Resumen          → /admin/settings/public
├── Landing          → /admin/settings/public/landing
├── Catálogo         → /admin/settings/public/catalogo
└── Operaciones      → /admin/settings/operations  (ruta hermana, no bajo /public)

Equipo: aislado, sin tab ni link desde settings.
No hay /admin/settings hub raíz.
```

**Problemas IA:**

| ID | Problema | Severidad |
|----|----------|-----------|
| IA-1 | Equipo como nav principal separado | P1 producto |
| IA-2 | Label sidebar “Configuracion” sin tilde; permiso `manageNotifications` para toda la sección | P2 |
| IA-3 | Operaciones fuera de jerarquía `/public/` | P2 |
| IA-4 | Notificaciones mezcladas en “Resumen” de presencia pública | P1 |
| IA-5 | Sin landing `/admin/settings` | P2 |

## Arquitectura de información recomendada

```txt
Sidebar principal (V1 vendible):
├── Pedidos
├── Productos
└── Configuración          → /admin/settings  (hub)

/admin/settings            → Resumen / overview
/admin/settings/public     → redirect o alias a landing hub “Presencia pública”
/admin/settings/public/landing
/admin/settings/public/catalogo
/admin/settings/operations
/admin/settings/notifications   (nuevo tab)
/admin/settings/team            (migración desde /admin/team)

/admin/team                → redirect 308 a /admin/settings/team (fase SETTINGS-6)
```

**Tabs internas sugeridas:**

| Tab | Rol mínimo | Frecuencia |
|-----|------------|------------|
| Resumen | operator+ (notificaciones) / manager+ (cards públicas) | Diaria |
| Presencia → Landing | owner, manager | Ocasional |
| Presencia → Catálogo | owner, manager | Ocasional |
| Operaciones | owner, manager (edit); operator read-only opcional | Diaria |
| Notificaciones | owner, manager, operator | Diaria |
| Equipo | owner | Ocasional |

## Sidebar actual vs sidebar recomendado

| Actual | Recomendado |
|--------|-------------|
| Equipo (owner) | **Eliminar** del sidebar |
| Configuracion → `/admin/settings/public` | **Configuración** → `/admin/settings` |
| matchPrefixes settings public + operations | `/admin/settings` prefix único |
| Permiso nav: `manageNotifications` | Permiso nav: `canAccessSettings` compuesto o `viewSettings` |

## Flujo de datos actual

| Ruta | Datos leídos | Mutaciones | Tablas/RPC | Auth/permiso | Revalidation | Riesgo |
|------|--------------|------------|------------|--------------|--------------|--------|
| `/admin/settings/public` | `profiles.notification_preferences` (context); `businesses.name` (si manager+) | — | `businesses`, `profiles` | `manageNotifications`; cards públicas `managePublicSettings` | — | Mezcla módulos |
| `/admin/settings/public/landing` | `businesses` (logo, cover, color, etc.) | `updatePublicBusinessSettingsAction` | `businesses` UPDATE | `managePublicSettings` | public paths + `/b/[slug]` | Upload client → storage |
| `/admin/settings/public/catalogo` | `businesses` (hero fields) | `updateCatalogHeroSettingsAction` | `businesses` UPDATE | `managePublicSettings` | catalogo público | OK |
| `/admin/settings/operations` | `business_settings` vía **client** `useBusinessSettings` | `updateScheduledSettings`; `toggleBusinessStatus` (dashboard action) | `business_settings`; RPC `set_business_on_demand_status` | **`requireAdminContext` only** (viewer OK) | `/admin/settings/operations` | Permiso laxo; toggle legacy |
| `/admin/team` | `profiles` + `auth.admin.listUsers` (service) | `createTeamMemberAction`; `updateTeamMemberRoleAction` | `profiles`; auth admin API | `manageTeam` (owner) | `/admin/team` | listUsers 1000 |

### Mapa de flujo ideal (target)

```txt
/admin/settings (SSR hub)
  ├─ parallel: profile prefs + business name + flags summary
  ├─ tabs layout (settings shell)
  │
  ├─ /notifications → NotificationSettingsCard + PushDeviceSettings
  ├─ /public/landing → businesses + storage upload (server actions)
  ├─ /public/catalogo → businesses hero fields
  ├─ /operations → business_settings SSR + store_sessions aware toggle
  └─ /team → getBusinessTeamMembers (paginated emails)

Mutations: sin cambiar contratos; revalidate paths centralizados bajo /admin/settings/*
```

## Permisos y roles

Fuente: `lib/admin/permissions.ts`, guards por página.

| Módulo | Owner | Manager | Operator | Viewer | Riesgo actual |
|--------|-------|---------|----------|--------|---------------|
| Ver nav Configuración | ✓ | ✓ | ✓ | ✓* | *viewer tiene viewOrders; nav usa manageNotifications → viewer **no** ve settings |
| Resumen / notificaciones | ✓ | ✓ | ✓ | ✗ | OK |
| Landing / catálogo público | ✓ | ✓ | ✗ | ✗ | OK |
| Operaciones (página) | ✓ | ✓ | ✓ | ✓ | **P1:** `requireAdminContext` — viewer puede entrar por URL |
| Operaciones (editar tienda/reglas) | ✓ | ✓ | ✗ UI | ✗ | Toggle gated `canManagePublicSettings` |
| Equipo | ✓ | ✗ | ✗ | ✗ | OK (owner only) |
| Crear usuarios team | ✓ | ✗ | ✗ | ✗ | Password temporal en form |

**Nota:** Nav “Configuracion” requiere `manageNotifications`, no `managePublicSettings` — operadores ven settings pero no landing cards.

## Performance audit

| Ruta | Riesgo | Evidencia | Impacto | Recomendación |
|------|--------|-----------|---------|---------------|
| `/admin/settings/public` | Bajo | 0–1 query SSR + client NotificationSettingsCard | Bajo | Mover prefs read al SSR hub |
| `/admin/settings/public/landing` | Medio | Client form + image upload + preview DOM | Medio | Lazy load upload; keep |
| `/admin/settings/operations` | **Alto** | `useBusinessSettings` client fetch en shell; **duplicate** con AdminShell load; `toggleBusinessStatus` + refresh | Medio-alto | SSR `business_settings` en page; dedupe shell fetch |
| `/admin/team` | **Alto** | `listUsers({ perPage: 1000 })` + all profiles each page load | Alto escala | Paginar auth users o join emails on-demand |
| Team create | Medio | Service role auth.admin + profile insert | Bajo | OK server-side |
| Push setup | Medio | SW register + upsert push_subscriptions | Bajo | Defer heavy until notifications tab |

**Queries secuenciales evitables:**

- Overview: business name query solo si `canManagePublicSettings` — OK.
- Operations: settings ya cargados en `AdminShell` → página vuelve a esperar mismo hook.

## Visual/design-system audit

Comparación vs `/admin/dashboard` (operational) y `/admin/products` (operational + DashboardShell).

| Elemento | Dashboard/Products | Settings/Team | Clasificación |
|----------|-------------------|---------------|---------------|
| Layout size | `operational` | `default` / `wide` | **REWORK** |
| Header variant | `operational` + actions | default | **REWORK** |
| Toolbar/shell | DashboardShell, tokens | admin-form-card sueltas | **REWORK** |
| Tabs | N/A (dashboard) | pill hardcoded light | **REWORK** |
| Operations sections | token-based CSS module | ✓ alineado | **KEEP/POLISH** |
| Public settings CSS | — | hardcoded #hex, light-only feel | **REWORK** |
| Team layout | — | admin-surfaces.css global | **POLISH** |
| Dark theme | tokens | public-settings.css no usa `--bg-*` | **REWORK** |
| Mobile tabs | — | horizontal scroll pills | **POLISH** |

## Legacy CSS audit

| Archivo | Clase/selector | Problema | Severidad | Recomendación |
|---------|----------------|----------|-----------|---------------|
| `public-settings.css` | `.admin-context-nav__link` | `#dfd4c8`, `#1f1a14` hardcoded | P1 | Migrar a `--border-subtle`, `--text-*`, `--bg-surface` |
| `public-settings.css` | `.admin-settings-preview*` | palette fija #fffdf9 | P2 | Tokenizar o scope preview |
| `public-settings.css` | active pill | `box-shadow` legacy | P2 | Usar `--shadow-sm` |
| `admin-surfaces.css` | `.admin-form-card` | shared global, no module | P2 | Settings shell module |
| `operations-settings.module.css` | — | usa tokens | — | **KEEP** como referencia |
| `public-settings-nav.tsx` | — | mezcla clases global + CSS file | P2 | Unificar en settings shell |

## Mojibake/copy audit

No se encontró mojibake UTF-8 (`Ã`, `�`) en código settings/team. Sí **copy sin tildes / inconsistente**:

| Archivo | Texto actual | Problema | Propuesta |
|---------|--------------|----------|-----------|
| `admin-nav-config.ts` | `Configuracion` | Sin tilde | `Configuración` |
| `settings/public/page.tsx` | `Configuracion`, `publica`, `Catalogo publico` | Sin tildes | Estandarizar ES-AR |
| `settings/public/page.tsx` | `Resumen` + notificaciones | IA confusa | Separar “Notificaciones” tab |
| `notification-settings-card.tsx` | `Mostra`, `Reproduci` | Verbo incorrecto | `Muestra`, `Reproduce` |
| `operations-settings-client.tsx` | `On-Demand`, `Scheduled`, `Kitchen` | EN mezclado | Etiquetas ES o glosario |
| `team/page.tsx` | `Todavia`, `contrasena`, `podes` | Sin tildes | QA copy pass |
| `public-settings-form.tsx` | `Configuracion guardada` | Sin tilde | `Configuración guardada` |
| `landing/page.tsx` | `Gestión`, `Configuración pública` | ✓ correcto | Usar como estándar |

## Notifications settings audit

**Ubicación actual:** `NotificationSettingsCard` en `/admin/settings/public` (Resumen).

**Lógica:**

- Preferencias: `profiles.notification_preferences` (JSON).
- Actions: `updateNotificationPreferencesAction`, `savePushSubscriptionAction`, `revokePushSubscriptionAction` en `settings/public/actions.ts`.
- Push: `use-push-subscription.ts`, `registerPushServiceWorker`, VAPID env (`NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`).
- Browser permission hook compartido con dashboard.

**Clasificación:** **MOVE to `/admin/settings/notifications` tab** (SETTINGS-5).

**Estado push:** preparación base; copy dice “Todavia no enviamos pedidos por push” — **DEFER** envío real V1.

**Riesgo:** operadores configuran notificaciones en “Resumen” junto a presencia pública — confuso para V1 vendible.

## Team module audit

**Ruta:** `/admin/team` — owner only.

**Features:**

- Crear manager/operator/viewer (email + password temporal).
- Editar rol (manager/operator/viewer); owner/admin no editables inline.
- No invitaciones email; no delete user.
- Roles mostrados en inglés raw (`manager`, `operator`).

**Visual:** `admin-team-*` en `admin-surfaces.css`; wide layout; sin header actions; sin operational shell.

**Migración propuesta (futuro):**

```txt
/admin/team → /admin/settings/team
- redirect 308 temporal
- sidebar: quitar item Equipo
- PublicSettingsNav → SettingsNav con tab Equipo
- revalidatePath updates
- active route: matchPrefixes /admin/settings
```

## Qué está bien

- Separación landing vs catálogo hero (campos distintos en `businesses`).
- Operations module CSS alineado a tokens.
- Server actions con permisos explícitos en landing/catalogo/team.
- Team mutations vía service role (auth.admin) — patrón correcto.
- Push subscription upsert server-side con service role.
- PublicSettingsNav reusable entre subpáginas.

## Qué está mal

- No hay hub `/admin/settings`; entrada directa a `/public`.
- Equipo desconectado de Configuración en IA y navegación.
- `public-settings.css` legacy hardcoded — rompe dark/premium.
- Operaciones accesible con `requireAdminContext` (viewer).
- Operaciones usa `toggleBusinessStatus` (flag only) no alineado con `store_sessions` (deuda conocida dashboard).
- Notificaciones en “Resumen” de presencia pública.
- Nav permission `manageNotifications` para label “Configuración”.
- Team performance: listUsers 1000.

## Qué se puede mejorar

- Settings shell `operational` + header variant como products.
- Tab “Notificaciones” dedicado.
- SSR operations data (eliminar double client fetch).
- Copy ES-AR consistente.
- Team role chips localizados.
- Paginación/búsqueda team.
- Redirect `/admin/settings` → overview.

## Qué se debería quitar

- Entrada sidebar **Equipo** (post-migración).
- Cards landing/catálogo del overview una vez tabs claros (opcional — links pueden quedar en resumen manager).
- Duplicación fetch `business_settings` en operations client.

## Qué se debería conservar

- Server actions existentes (contratos).
- Rutas públicas `/b/[slug]` revalidation paths.
- Permisos owner-only team.
- Push/VAPID infra (preparación).
- PublicSettingsNav pattern (renombrar SettingsNav).

## Qué se debería mover

| De | A |
|----|---|
| `/admin/team` | `/admin/settings/team` |
| NotificationSettingsCard en overview | `/admin/settings/notifications` |
| Nav item Equipo | Tab Equipo |
| Entry `Configuracion` → `/settings/public` | `/admin/settings` hub |

## Riesgos técnicos

| ID | Riesgo | Prioridad |
|----|--------|-----------|
| T-1 | Redirect team rompe bookmarks | P2 — redirect 308 |
| T-2 | Active nav state al cambiar matchPrefixes | P1 |
| T-3 | Operator accede operations URL | P1 — tighten guard |
| T-4 | CSS legacy dark mode rotas al tokenizar | P2 |
| T-5 | listUsers scale en team | P2 |
| T-6 | toggleBusinessStatus vs store_sessions desync | P1 (ya documentado PROD/checkout) |

## Riesgos de producto

| ID | Riesgo | Prioridad |
|----|--------|-----------|
| P-1 | V1 no vendible si settings se ve “MVP legacy” | P0 |
| P-2 | Operador confundido (notificaciones vs presencia) | P1 |
| P-3 | Owner no encuentra Equipo tras mover | P2 — UX tab + redirect |

## Roadmap recomendado

| Fase | Objetivo | Alcance | Prioridad | Riesgo |
|------|----------|---------|-----------|--------|
| **SETTINGS-2** | IA & Team consolidation plan | Nav, redirects spec, permissions matrix, route map | **P0** | Bajo (doc+nav) |
| **SETTINGS-3** | Settings shell premium | Hub `/admin/settings`, layout, header operational, SettingsNav | **P0** | Medio |
| **SETTINGS-4** | Public presence polish | Tokenizar `public-settings.css`, landing/catalogo visual | **P1** | Medio |
| **SETTINGS-5** | Operations & notifications | Tab notifications; SSR operations; guard viewer; copy ES | **P1** | Medio |
| **SETTINGS-6** | Team migration | `/admin/settings/team`, redirect, remove sidebar Equipo | **P1** | Medio |
| **SETTINGS-7** | Responsive QA & handoff | Mobile tabs, drawer nav, regression matrix | **P2** | Bajo |

### SETTINGS-2 — detalle (próximo prompt quirúrgico)

```txt
Objetivo: consolidar IA sin rediseño total.
- Crear /admin/settings page (redirect o overview).
- Renombrar nav → Configuración; matchPrefixes unificados.
- Agregar SettingsNav tab Equipo (link a /admin/team provisional).
- Quitar Equipo del sidebar O dejar disabled con flag.
- NO mover rutas team aún.
Archivos probables: admin-nav-config.ts, settings/page.tsx, public-settings-nav.tsx.
NO tocar: server actions, DB, forms.
```

## Validaciones ejecutadas

```txt
npm run build: pass (2026-06-06; 18 routes incl. settings/* + /admin/team)
npx tsc --noEmit: pass
npm run lint: fail — ESLint 9.39.4 TypeError circular structure (config env flake; doc-only, no code changes)
```

## Próximo paso recomendado

Ejecutar **SETTINGS-2 — Settings IA & Team Consolidation** (nav + hub route + tabs structure, sin migrar team route).

---

*SETTINGS-1 — auditoría forense. Sin cambios funcionales.*
