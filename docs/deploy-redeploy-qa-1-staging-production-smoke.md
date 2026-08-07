# DEPLOY-REDEPLOY-QA-1 — Redeploy Then Staging/Production Smoke

## Objetivo

Confirmar que Settings V1 (incluyendo relocation de notification actions) está desplegado en producción y ejecutar smoke QA end-to-end contra el deployment nuevo — no contra el build legacy que mostraba 404 en `/admin/settings`.

## Contexto

- Fase anterior `DEPLOY-QA-1` quedó **bloqueada** porque producción seguía en build pre–Settings V1 (`/admin/settings` → 404).
- Settings V1 cerrado formalmente en `SETTINGS-HANDOFF-1`.
- Cambios desplegados: hub unificado, presencia pública V1, team/notifications polish, CSS legacy cleanup, actions en `settings/notifications/actions.ts`.

## Pre-deploy check

| Item | Resultado |
|------|-----------|
| Rama | `main` |
| Commit local/push | `97321ba` — `chore(settings): finalize settings v1 and notification actions` |
| SHA completo | `97321ba5662d6ee1425e92f7ffffd8c15b3991bd` |
| Archivos pendientes post-commit | Solo `tmp/qa-assets/*`, `tsconfig.tsbuildinfo` (fuera de scope) |
| `npx tsc --noEmit` | PASS (validado pre-push en sesión anterior) |
| `npm run build` | PASS (validado pre-push en sesión anterior) |
| `npm run lint` | No re-ejecutado; histórico FAIL por flake ESLint 9 (`Converting circular structure to JSON`) |
| Cambios fuera de scope | No detectados (sin migrations, RLS, auth, middleware, env) |

## Commit / Push / Redeploy

| Item | Detalle |
|------|---------|
| Mecanismo | Vercel auto-deploy vía push a `origin/main` (GitHub) |
| Push | `7144006..97321ba` → `origin/main` SUCCESS |
| Vercel CLI / `gh` | No disponible / no autenticado en entorno QA |
| Config modificada | Ninguna (sin env, sin proyecto nuevo) |

## Deployment auditado

| Campo | Valor |
|-------|-------|
| URL | `https://orderops.vercel.app` |
| Entorno | Production |
| Estado | **READY** (inferido por rutas Settings V1 activas post-push) |
| Commit desplegado | `97321ba` (confirmado localmente; SHA remoto no verificado vía dashboard/CLI) |
| Marcador nuevo vs viejo | `/admin/settings` carga **"Resumen de configuración"** (V1) vs 404 legacy |
| Hora QA | 2026-07-09 (sesión nocturna UTC-3) |

## Usuario/rol usado

- **Usuario demo admin** (`laburguesia@demo.com`) — rol **owner** del tenant demo **La Burguesía** (slug `demohamburgueseria`).
- Sesión ya activa al iniciar QA post-deploy; flujo login fresco no re-auditado en esta sesión.

## Rutas auditadas

### Admin

- `/admin/dashboard`
- `/admin/settings`
- `/admin/settings/public`
- `/admin/settings/public/landing`
- `/admin/settings/public/catalogo`
- `/admin/settings/operations`
- `/admin/settings/team`
- `/admin/settings/notifications`

### Público

- `/b/demohamburgueseria`
- `/b/demohamburgueseria/catalogo`

## Login/session QA

| Check | Resultado |
|-------|-----------|
| Deploy accesible | PASS |
| Sesión admin activa | PASS (sesión preexistente) |
| Redirección a admin | PASS |
| Loop auth / pantalla blanca / 500 | No observado |
| Login fresco (email + password + redirect) | **No ejecutado** — deuda menor |

## Admin Dashboard QA

| Check | Resultado |
|-------|-----------|
| Ruta carga | PASS |
| Lanes (Pendientes, Preparando, Listos, Completados) | PASS |
| Cards de pedidos visibles | PASS |
| Navegación a Configuración | PASS |
| Overlays Next / 500 | No observado |

## Settings Hub QA

| Check | Resultado |
|-------|-----------|
| Hub carga (`/admin/settings`) | PASS |
| "Resumen de configuración" visible | PASS |
| Presencia pública única (sin cards legacy Landing/Catálogo) | PASS |
| Operación, Notificaciones, Equipo visibles | PASS |
| Links de navegación funcionan | PASS |
| Overflow obvio | No observado |

## Public Presence QA

| Check | Resultado |
|-------|-----------|
| Overview (`/admin/settings/public`) | PASS |
| Estado general + readiness compact | PASS |
| Secciones Identidad / Landing / Catálogo / Publicación | PASS |
| Accesos rápidos (Editar Landing, Editar catálogo, Ver landing/catálogo) | PASS |
| Links públicos con slug demo | PASS |

## Landing Settings E2E

| Paso | Resultado |
|------|-----------|
| Shell V1 (editor, readiness, dual preview, Brand Palette, uploads UI) | PASS |
| Dirty state al editar descripción | PASS ("Pendiente de guardar") |
| Guardar con sufijo `DEPLOY-QA` | PASS — "Cambios publicados correctamente." |
| Persistencia post-guardado | PASS |
| Restaurar valor original (`...QA test`) | PASS — "Guardado" + feedback success |
| Upload logo/portada E2E | **No ejecutado** — deuda (riesgo de modificar assets demo sin restauración segura) |

## Catalog Settings E2E

| Paso | Resultado |
|------|-----------|
| Shell + readiness + preview dual Catálogo | PASS |
| Campos headline / badge / microcopy | PASS |
| Dirty state + preview actualiza al editar headline | PASS |
| Guardar con sufijo `DEPLOY-QA` | PASS — "Cambios publicados correctamente." |
| Persistencia tras refresh | PASS |
| Restaurar headline original | PASS (confirmado en UI pública sin sufijo) |

## Upload E2E

**No ejecutado.** Motivo: reemplazo de logo/portada en tenant demo de producción sin garantía de restauración automática del asset anterior. Documentado como deuda explícita.

## Public Routes QA

| Ruta | Resultado |
|------|-----------|
| `/b/demohamburgueseria` | PASS — landing carga, descripción refleja config |
| `/b/demohamburgueseria/catalogo` | PASS — headline/microcopy reflejan config demo |
| 404 / 500 | No observado |
| Mobile 390px overflow horizontal | PASS (sin overflow en landing pública) |

## Operations QA

| Check | Resultado |
|-------|-----------|
| Ruta carga | PASS |
| Suscripción de modos (solo lectura) | PASS |
| Bajo demanda / estado tienda | PASS |
| Modo programado (no activo) | PASS — copy informativo |
| Overflow / runtime errors | No observado |
| Config modificada | No |

## Team QA

| Check | Resultado |
|-------|-----------|
| Resumen superior | PASS |
| Usuarios internos listados | PASS (owner + `operador@test.com`) |
| Select rol + botón "Guardar rol" | PASS |
| Sección "Nuevo usuario interno" | PASS |
| Copy con tildes | PASS |
| Crear usuario / cambiar roles reales | No ejecutado |

## Notifications QA

| Check | Resultado |
|-------|-----------|
| Página dedicada `/admin/settings/notifications` | PASS (antes 404 en deploy viejo) |
| Resumen superior | PASS |
| Switches visibles (navegador, sonido, toast, highlight) | PASS |
| Sonido ON al inicio | PASS |
| Toggle reversible + autosave | PASS — "Preferencias de notificaciones actualizadas." |
| Restaurar toggle original (Sonido ON) | PASS |
| Dispositivo y permisos visible | PASS |
| Permiso navegador automático | No solicitado |
| Push UI / actions reubicadas | PASS — sin errores de action |

## Responsive QA

| Viewport | Rutas verificadas | Resultado |
|----------|-------------------|-----------|
| 390px | `/admin/settings`, `/admin/settings/notifications`, `/b/demohamburgueseria` | PASS — `scrollWidth === clientWidth`, sin overflow horizontal |
| 1440px | Smoke visual en rutas admin (sesión desktop) | PASS — layout usable |
| 390px en `/admin/settings/public`, `/admin/settings/team`, catálogo público | Parcial — no medido programáticamente en esta sesión |

## Console/Network/Logs

| Check | Resultado |
|-------|-----------|
| Consola navegador (CDP spot check) | Sin errores capturados en rutas públicas |
| Network tab completo | No auditado |
| Vercel deployment logs | No accesible (sin CLI/dashboard en entorno) |
| 500 / action not found / RLS denied | No observado durante QA |

## Bugs encontrados

Ninguno crítico bloqueante en el deployment nuevo.

## Datos demo modificados/restaurados

| Campo | Acción | Estado final |
|-------|--------|--------------|
| Landing — descripción | Sufijo `DEPLOY-QA` temporal → restaurado | `Smash burgers caseras con ingredientes frescos y entrega rápida - QA test` |
| Catálogo — headline | Sufijo ` DEPLOY-QA` temporal → restaurado | `Listo para pedir online - QA PUBLIC-3 QA` |
| Notificaciones — Sonido | Toggle OFF temporal → restaurado ON | ON |
| Logo / portada | Sin cambios | Sin modificación |

## Validaciones locales

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | PASS (pre-deploy) |
| `npm run build` | PASS (pre-deploy) |
| `npm run lint` | FAIL conocido (flake ESLint 9) — no bloqueante para deploy |

## Resultado final

**PASS WITH DEBT**

Criterios críticos cumplidos: deploy nuevo activo, Settings V1 visible, saves landing/catálogo OK, notifications autosave OK, rutas públicas OK, datos demo restaurados.

## Deuda restante

1. ~~Upload E2E logo/portada no probado en producción~~ — **Cerrado en `DEPLOY-QA-2`** (`docs/deploy-qa-2-upload-fresh-login-production-qa.md`).
2. ~~Login fresco no re-auditado~~ — **Cerrado en `DEPLOY-QA-2`**.
3. SHA remoto Vercel no confirmado vía CLI/dashboard.
4. Responsive 390px no medido en todas las rutas del checklist.
5. Network tab y Vercel logs no auditados.
6. `npm run lint` flake ESLint 9 sin resolver.

## Próxima fase recomendada

- **SETTINGS-POST-DEPLOY-1** (opcional): upload E2E en entorno staging dedicado o con snapshot de assets demo.
- Continuar roadmap operativo (orders/dashboard) con confianza de que Settings V1 está live en producción.
- Resolver flake ESLint 9 en fase de tooling separada si se desea gate CI estricto.
