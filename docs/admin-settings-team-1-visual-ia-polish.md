# SETTINGS-TEAM-1 — Team Visual & IA Polish

## Objetivo

Elevar `/admin/settings/team` al estándar visual/IA actual de Settings (alineado con Presencia
pública V1 y Operación), sin tocar server actions, DB, RLS, auth, permisos, roles ni validaciones
de negocio. Fase estrictamente de **polish visual, jerarquía y UX**.

## Estado anterior

Auditoría de referencia: `docs/admin-settings-notifications-team-alignment-audit.md`.

- **Componente principal:** `components/admin/team/admin-team-settings-view.tsx` (Server Component),
  re-exportado por `app/admin/(protected)/settings/team/page.tsx`.
- **Sub-componentes client:** `create-team-member-form.tsx` (`useActionState` + `router.refresh`),
  `team-member-role-form.tsx` (`useActionState` + `useState` + `router.refresh`).
- **Server actions:** `createTeamMemberAction`, `updateTeamMemberRoleAction`
  (`app/admin/(protected)/team/actions.ts`).
- **Data access:** `getBusinessTeamMembers(businessId)` en `lib/admin/team.ts` →
  `BusinessTeamMember { id, business_id, email, role, created_at }`.
- **Roles gestionables:** `manager | operator | viewer` (`isManageableTeamRole`). `owner/admin/super_admin`
  no editables desde Team; regla server-side de no auto-degradación en `updateBusinessTeamMemberRole`.
- **CSS:** dependencia total de `admin-surfaces.css` global (`admin-team-layout`, `admin-form-card`,
  `admin-team-row`, `admin-team-role-chip`, `admin-field`, `admin-primary-button`, `admin-empty-state`,
  `admin-inline-feedback`, `admin-feedback--error/--success`).

Problemas detectados:

- El formulario "Nuevo usuario interno" dominaba la página; "Usuarios internos" quedaba secundario.
- Sin summary superior de equipo/roles.
- Control de rol desacoplado del usuario (select al extremo derecho).
- `admin-primary-button` se renderizaba como barra blanca dominante en dark mode, incluso disabled
  (usa `background: var(--text-primary)`, que en dark es casi blanco).
- Copy sin tildes: "Contrasena", "Crea", "podes", "valido".

## Estado nuevo

Jerarquía nueva de la pantalla:

1. Header de página (`SettingsShell` → eyebrow "Configuración" + "Equipo").
2. **Resumen del equipo** (overview compacto con stats + usuario actual).
3. **Usuarios internos** (sección principal, card con lista y control de rol asociado a cada persona).
4. **Nuevo usuario interno** (card secundaria, compacta, copy corregido, botón local no invasivo).

Todo el layout nuevo vive en un CSS module propio de Team.

## Archivos modificados

- `components/admin/team/admin-team-settings-view.tsx` — reescrito: `SettingsShell` + summary +
  reorden de jerarquía + lista de usuarios con metadata y chips de rol. Sigue siendo Server Component;
  misma fuente de datos (`getBusinessTeamMembers`), sin nuevas queries.
- `components/admin/team/create-team-member-form.tsx` — migrado a CSS module, copy con tildes, form
  más compacto (grid email/contraseña), botón local, feedback con `aria-live`.
- `components/admin/team/team-member-role-form.tsx` — migrado a CSS module, rol + "Guardar rol"
  agrupados, `label`↔`select` con `useId`, feedback con `aria-live`. Bindings de action intactos.

## Archivos creados

- `components/admin/team/team-settings.module.css` — CSS module encapsulado de Team (summary, cards,
  lista de usuarios, chips de rol, inputs/select, botones locales, feedback, empty state, responsive).
- `docs/admin-settings-team-1-visual-ia-polish.md` — esta doc.

## Arquitectura preservada

- Server actions sin cambios (`createTeamMemberAction`, `updateTeamMemberRoleAction`).
- `lib/admin/team.ts`, RLS, auth, permisos y roles sin cambios.
- `name` de inputs intactos: `email`, `password`, `role`, `user_id` (hidden).
- `useActionState` + `router.refresh()` en ambos forms.
- Resolución de tenant server-side (`requireAdminPermission("manageTeam")` + `adminContext.businessId`).

## Cambios de IA

- Introducción de overview ejecutivo ("Resumen del equipo") antes de la gestión.
- "Usuarios internos" pasa a ser la sección principal; "Nuevo usuario interno" queda como card
  secundaria (superficie soft, sin sombra, título compacto) al final.
- El control de rol dejó de estar al extremo derecho desacoplado: ahora vive dentro de cada fila de
  usuario, con "Guardar rol" contiguo al select.

## Summary de equipo

Bloque superior con datos ya cargados (sin queries nuevas):

- Total de usuarios internos.
- Managers / Operators / Viewers (conteo por rol).
- Usuario actual (email + rol desde `adminContext.profile.role`).
- Capacidad de gestión: "Podés gestionar roles de manager, operator y viewer."

No se inventaron estados ("activo" no existe en el modelo, no se usó).

## Usuarios internos

Cada fila muestra:

- Email (encabezado).
- Chip de rol (variante visual admin/manager/neutral, valor técnico real preservado).
- Fecha de creación (`created_at`, formateada `es-AR`).
- Indicador "Tu usuario actual" cuando aplica.
- Nota de restricción cuando el rol no es editable (usuario actual o rol elevado).
- Control de rol + "Guardar rol" contiguos, solo para roles gestionables distintos del actual.

Layout responsive: desktop en 2 columnas (usuario | control), mobile apilado
(usuario → select → guardar).

## Nuevo usuario interno

- Card secundaria y compacta al final de la pantalla.
- Copy corregido: "Contraseña temporal", "Creá", "podés".
- Campos: Email, Contraseña temporal, Rol (grid 2-col en ≥640px para email/contraseña).
- Helper de roles: "En esta fase podés crear manager, operator o viewer. Owner y transferencia de
  ownership quedan fuera de alcance."
- Roles técnicos (`manager/operator/viewer`) preservados como valores reales del sistema.

## Botones y dark mode

- Se crearon clases locales de Team (`.primaryButton`) en vez de tocar `admin-primary-button` global.
- Enabled: `background: var(--accent-primary)` (índigo de marca) + texto blanco — CTA claro pero no
  invasivo.
- Disabled: superficie muteada (`--bg-surface-hover`) + `--text-tertiary` + `cursor: not-allowed`;
  ya no parece una barra blanca activa en dark mode.
- `:focus-visible` con `--focus-ring`.
- No se modificó `admin-primary-button` global → no hay regresión en otras pantallas.

## Accesibilidad

- Headings jerárquicos: `SettingsShell` (h1) → `h2` (Resumen, Usuarios internos, Nuevo usuario) →
  `h3` (email de cada usuario).
- `label`↔control conectados (create form vía `<label>` envolvente; role form vía `htmlFor`+`useId`).
- Botones `disabled` semánticos (atributo real, no solo estilo).
- `:focus-visible` en inputs, select y botones.
- Feedback success/error en contenedores `aria-live="polite"`.
- Secciones con `aria-labelledby` apuntando a sus títulos.
- Estados textuales visibles (no solo color): "Creando...", "Guardando...", notas de restricción.

## Responsive

Breakpoints del module:

- `<640px`: summary y form en 1 columna; role form apila select y botón.
- `≥640px`: statGrid a 4 columnas; email/contraseña del create form en 2 columnas.
- `≥900px`: fila de usuario en 2 columnas (usuario | control) y role form select+botón en línea.

Objetivo: sin overflow horizontal en 1440 / 820 / 390; summary apila; rol/guardar no se desacoplan.

## QA

QA manual con browser tools **no ejecutado en esta sesión**: el entorno de terminal/servidor quedó
irresponsivo (los comandos no devolvían estado y no se pudo abrir el flujo de browser de forma
confiable). Pendiente re-ejecutar smoke en `/admin/settings/team` (1440/820/390) y confirmar:

- summary visible; Usuarios internos por encima del form; form no domina el primer fold;
- copy con tildes; rol/guardar asociados; botones disabled no parecen CTAs activos;
- `document.documentElement.scrollWidth === clientWidth` en los tres viewports;
- sin warnings nuevos de consola.

## Validaciones

`npx tsc --noEmit`, `npm run build` y `npm run lint` **no pudieron ejecutarse** en esta sesión por un
entorno de terminal irresponsivo (los comandos retornaban "no exit status" y no se generaban
terminales nuevas). Revisión manual realizada:

- `Record<ProfileRole, string>` exhaustivo (admin, owner, manager, operator, viewer, super_admin).
- Firmas de contexto/data confirmadas (`adminContext.profile.role`, `.permissions.*`, `.user.id`,
  `.businessId`; `getBusinessTeamMembers`).
- Todas las clases del module referenciadas en TSX existen; tokens usados existen en
  `theme-tokens.css` (con fallbacks en `--danger/--success/--color-ready/--motion-fast`).

Pendiente: correr `tsc`/`build`/`lint` al restablecerse el entorno. Nota: `npm run lint` tiene un
flake conocido (`Converting circular structure to JSON`, ESLint 9) que no se corrige en esta fase.

## Qué se preservó

- Creación de usuario interno (email/password/role) y sus validaciones server-side.
- Cambio de rol de usuarios gestionables + regla de no auto-degradación (server-side).
- `router.refresh()` post-éxito; `useActionState`.
- Nombres de inputs y binding de server actions.

## Qué NO se tocó

- `app/admin/(protected)/team/actions.ts`, `lib/admin/team.ts`, auth, RLS, DB, migrations, middleware.
- `admin-surfaces.css` global (sin cambios; clases legacy de Team quedan intactas).
- `settings/public/*`, `settings/notifications/*`, `components/public/**`, orders/products.
- Roles permitidos, permisos, rutas.

## Riesgos encontrados

- Validaciones automáticas (`tsc`/`build`/`lint`) y QA browser no ejecutadas por entorno de terminal
  caído → riesgo de error de compilación no detectado (mitigado con revisión manual, bajo riesgo).
- Mensajes de error server-side aún sin tildes ("contrasena temporal", "podes", "valido"), pero viven
  en `actions.ts`/`lib/admin/team.ts` (fuera de scope de esta fase).
- Clases globales `admin-team-*` en `admin-surfaces.css` quedan huérfanas (no eliminadas por scope).

## Deuda restante

- Re-ejecutar `tsc`/`build`/`lint` + browser QA responsive al recuperar el entorno.
- Corregir copy de errores server-side de Team (SETTINGS-TEAM-2 o cleanup dedicado).
- Limpiar clases `admin-team-*` huérfanas de `admin-surfaces.css` (cleanup separado).
- Feedback más robusto (toasts / dirty state) si se decide en fase posterior.

## Próxima fase recomendada

- **SETTINGS-NOTIF-1** — aplicar el mismo estándar visual/IA a `/admin/settings/notifications`.
- Luego cleanup de copy server-side y clases globales huérfanas de Team.

---

## Validation Pass

Fase **SETTINGS-TEAM-1-QA — Validation & Microfix Pass**.

### TypeScript

`npx tsc --noEmit` **no ejecutable** en esta sesión: el shell/terminal siguió irresponsivo
(comandos sin exit status, sin generar terminales). Evidencia indirecta: el dev server de Next.js
compiló y renderizó `/admin/settings/team` sin overlay de error (module resolution, JSX y CSS
module resueltos correctamente en runtime). Revisión de tipos manual OK. Pendiente correr `tsc` al
recuperar el entorno.

### Build

`npm run build` **no ejecutable** (mismo motivo). Runtime dev PASS como proxy parcial.

### Lint

`npm run lint` **no ejecutable** (mismo motivo). Flake conocido `Converting circular structure to
JSON` sigue vigente y no se corrige.

### Browser QA

Ejecutado vía browser MCP contra el dev server (`localhost:3000`). Resultados:

| Viewport | scrollWidth | clientWidth | Overflow |
|----------|-------------|-------------|----------|
| 1440px | 1440 | 1440 | No |
| 820px | 805 | 805 | No |
| 390px | 390 | 390 | No |

- `/admin/settings/team` carga OK; sin overlay de error de Next.js.
- Summary superior visible (2 usuarios internos · 0 managers · 1 operator · 0 viewers).
- "Usuarios internos" con jerarquía principal; "Nuevo usuario interno" como card secundaria al final.
- Rol + "Guardar rol" asociados al usuario (desktop en línea; mobile apilado).
- Botón "Crear usuario" índigo (no barra blanca) en dark mode.
- Copy con tildes visible (Administrá, Gestioná, Revisá, Creá, Contraseña, Podés).
- DOM funcional intacto: `input[name=user_id][hidden]` (1), `email`/`password` required, dos
  `select[name=role]`, botones "Guardar rol" / "Crear usuario", 4 regiones `aria-live`, label del
  role form conectada vía `useId`.
- `/admin/settings/notifications` carga OK y sin cambios (sigue usando el botón blanco global →
  confirma que el botón local de Team no filtró a otras pantallas).
- `/admin/settings` (hub) carga OK; card "Equipo" y sidebar linkean a `/admin/settings/team`;
  Equipo queda activo en el sidebar al entrar.

### Microfixes aplicados

Ninguno. La implementación de SETTINGS-TEAM-1 pasó el browser QA sin cambios.

### Estado final

Aceptada a nivel runtime/browser QA. Validaciones CLI (`tsc`/`build`/`lint`) quedan pendientes de
re-ejecución cuando el entorno de terminal se restablezca; no se detectaron problemas en revisión
manual ni en runtime dev.

---

## SETTINGS-VALIDATION-1 — Cierre formal

Documento: `docs/admin-settings-validation-1-cli-browser-sweep.md`.

- `npx tsc --noEmit` → **PASS**
- `npm run build` → **PASS**
- `npm run lint` → FAIL solo por flake conocido (`Converting circular structure to JSON`)
- Browser QA `/admin/settings/team` → **PASS** (snapshot; sin CDP)
- Microfixes: ninguno
- **Resultado:** PASS — SETTINGS-TEAM-1 cerrada formalmente
