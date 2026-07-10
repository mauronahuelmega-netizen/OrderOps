# STAGING-QA-1 — Admin Settings V1 Browser QA

## Objetivo

Validar en browser real **Admin Settings V1** (responsive, navegación, dark/light, regresiones) sobre entorno local antes de deploy.

## Contexto

SETTINGS-7 cerró code audit + docs. STAGING-QA-1 completa QA browser con sesión owner de prueba en Cursor browser (`localhost:3000`).

## Entorno probado

| Campo | Valor |
|-------|-------|
| URL | `http://localhost:3000` |
| Browser | Cursor embedded browser |
| Cuenta | Owner demo (La Burguesía) |
| Tema probado | Dark + Light toggle |
| Viewports | Desktop (~1440), Tablet (820×1024), Mobile (390×844) vía DevTools CDP |

## Rutas validadas

| Ruta | Estado |
|------|--------|
| `/admin/settings` | ✅ |
| `/admin/settings/public/landing` | ✅ |
| `/admin/settings/operations` | ✅ |
| `/admin/settings/notifications` | ✅ |
| `/admin/settings/team` | ✅ |
| `/admin/team` → redirect | ✅ |
| `/admin/dashboard` | ✅ regresión |
| `/admin/products` | ✅ navegación OK (carga breve) |
| `/b/demohamburgueseria/catalogo` | ✅ regresión |
| `/admin/settings/public` | ⏭ no visitada explícitamente (cubierta por landing + hub) |
| `/admin/settings/public/catalogo` | ⏭ no visitada explícitamente |
| `/b/demohamburgueseria/checkout` | ⏭ pendiente E2E |

## Desktop QA

- Sidebar: Pedidos · Productos · Configuración ✅
- Configuración activo en hub ✅
- Hub sin tabs redundantes ✅
- Grupos Presencia pública · Operación · Administración ✅
- Grid 3 columnas ✅
- Filas clickeables con acciones visibles ✅
- Badge Notificaciones "Activas" ✅
- Footer al fondo del viewport (contenido corto) ✅
- Sin overflow horizontal ✅

## Tablet QA

- Topbar + drawer button visibles (<900px) ✅
- Hub root sin tabs ✅
- Lista compacta / cards legibles ✅
- Footer visible ✅
- SettingsNavigation en subpáginas usable ✅
- Nota: a 820px el hub mostró 1 columna (esperado 2 desde 640px) — posible limitación de emulación CDP; revisar en device real si hace falta

## Mobile QA

- Viewport 390px ✅
- Hub como lista de configuración ✅
- Sin tabs en root ✅
- Grupos compactos, chevrons ✅
- Drawer button presente ✅
- Footer visible ✅
- Sin overflow horizontal de página ✅

## Dark/light QA

| Ruta | Dark | Light |
|------|------|-------|
| `/admin/settings` | ✅ | ✅ toggle OK |
| `/admin/settings/public/landing` | ✅ | ⏭ no re-capturado |
| `/admin/settings/operations` | ✅ | ⏭ |
| `/admin/settings/notifications` | ✅ | ⏭ |
| `/admin/settings/team` | ✅ | ⏭ |

Contraste, surfaces, acciones y footer legibles en ambos modos en hub (light verificado post-toggle).

## Navigation QA

| Origen | Destino | Estado |
|--------|---------|--------|
| Hub → Landing pública | `/admin/settings/public/landing` | ✅ |
| Hub → items | links con aria-label | ✅ |
| `/admin/team` | redirect `/admin/settings/team` | ✅ |
| Team page | tab Equipo activa | ✅ |
| Landing | tab Landing activa | ✅ |
| Operations | tab Operaciones activa | ✅ |
| Notifications | tab Notificaciones activa | ✅ |
| Settings routes | sidebar Configuración activo | ✅ |

## Functional QA

| Área | Resultado |
|------|-----------|
| Landing — datos cargan | ✅ (descripción, color marca, preview) |
| Landing — guardar sin cambios | ⏭ no ejecutado |
| Catálogo admin | ⏭ no visitado |
| Operaciones — datos/copy ES | ✅ |
| Operaciones — guardar | ⏭ no ejecutado |
| Notificaciones — toggles | ✅ visibles (4 activos, no toggled) |
| Equipo — listado | ✅ (2 usuarios) |
| Equipo — acciones destructivas | ⏭ no ejecutadas |

## Permissions QA

| Rol | Resultado |
|-----|-----------|
| Owner (laburguesia@demo.com) | ✅ acceso completo Settings + Team |
| Viewer / Operator sin permiso | ⏭ pendiente — sin credenciales multi-rol |

## Public checkout regression QA

| Paso | Resultado |
|------|-----------|
| Catálogo público `/b/demohamburgueseria/catalogo` | ✅ productos, categorías, Agregar |
| Checkout anónimo + pedido + dashboard | ⏭ pendiente |

## Findings

| Hallazgo | Ruta | Breakpoint | Severidad | Estado | Nota |
|----------|------|------------|-----------|--------|------|
| Flash "Cargando configuración..." en cada navegación Settings | `/admin/settings/*` | All | P2 | Abierto | AdminShell `useBusinessSettings` client fetch |
| Copy "Contrasena temporal" sin tilde | `/admin/settings/team` | All | P2 | Abierto | Preexistente team forms |
| Hub 1 col a 820px en emulación | `/admin/settings` | Tablet | P3 | Observación | Verificar en iPad real |
| Checkout E2E no ejecutado | `/b/.../checkout` | — | P2 | Pendiente | Fuera de scope Settings; PROD-4 |
| Permisos multi-rol no probados | — | — | P2 | Pendiente | Sin cuentas viewer/operator |
| Guardar sin cambios no probado | landing/operations | — | P3 | Pendiente | Opcional pre-deploy |

## Microfixes aplicados

Ninguno en STAGING-QA-1 (sin P0/P1 bloqueantes dentro de scope permitido).

## Issues pendientes

- P2: AdminShell loading flash entre páginas Settings
- P2: Team copy tildes
- P2: Checkout E2E anónimo
- P2: Multi-rol permissions QA
- P3: Tablet grid confirmación en device real

## Resultado

**PASS WITH P2 DEBT — Ready for production deploy QA**

No hay P0/P1 bloqueantes en Settings V1. Deuda P2 documentada no impide deploy inicial con QA owner; recomendar checkout E2E y multi-rol en staging.

## Recomendación final

1. Deploy a staging/production con cuenta owner.
2. Ejecutar checkout anónimo E2E en staging (`demohamburgueseria`).
3. Opcional: credenciales viewer/operator para cerrar permissions QA.
4. Siguiente roadmap: DEVX-2 middleware→proxy o TEAM-1 performance.
