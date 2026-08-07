# DEPLOY-QA-2 — Upload & Fresh Login Production QA

## Objetivo

Cerrar las deudas P1 de `DEPLOY-REDEPLOY-QA-1`:
- Login fresco desde sesión limpia
- Upload E2E real de logo y portada en producción
- Persistencia admin + reflejo en rutas públicas
- Restauración de assets demo

## Entorno auditado

| Campo | Valor |
|-------|-------|
| URL | `https://orderops.vercel.app` |
| Entorno | Production |
| Fecha/hora QA | 2026-07-09 (UTC-3) |
| Browser/contexto | Cursor IDE Browser — pestaña nueva (`fdddf3`); logout previo + login fresco (cookies compartidas en perfil, no incógnito real) |
| Deploy accesible | PASS — sin pantalla blanca ni 500 inicial |

## Deployment / commit

| Campo | Valor |
|-------|-------|
| Commit esperado | `97321ba` — `chore(settings): finalize settings v1 and notification actions` |
| Verificación remota SHA | No disponible (sin Vercel CLI/dashboard en entorno) |
| Marcador funcional | Settings V1 activo (hub "Resumen de configuración") — coherente con `97321ba` |

## Usuario / rol usado

- **Usuario demo admin** (`laburguesia@demo.com`) — rol **owner**, tenant **La Burguesía** (slug `demohamburgueseria`)
- Contraseña no documentada (credenciales demo conocidas del proyecto)

## Fresh login QA

| Paso | Resultado |
|------|-----------|
| Logout (`Cerrar sesión`) | PASS |
| `/admin/login` muestra formulario | PASS |
| Login con usuario demo admin | PASS |
| Redirección a `/admin/dashboard` | PASS |
| Sin auth loop / 500 | PASS |
| `/admin/settings` accesible post-login | PASS |

**Nota:** No se usó incógnito real; se simuló sesión limpia vía logout + login en pestaña nueva del mismo perfil browser.

## Settings access QA

Desde sesión fresca:

| Ruta | Resultado |
|------|-----------|
| `/admin/settings` | PASS — hub V1 carga |
| `/admin/settings/public/landing` | PASS — editor shell, uploads, readiness, guardar |
| Permisos edición (owner) | PASS — sin 401/403 |
| Server action errors visibles | Ninguno |

`/admin/settings/public` (index) no re-auditado explícitamente en esta fase; landing editor validado como proxy de acceso a Presencia pública.

## Estado inicial de assets

Antes de upload QA (registrado vía inspección DOM):

| Asset | Estado |
|-------|--------|
| Logo | Presente — badge "Listo" / "Logo guardado" |
| Portada | Presente — badge "Listo" / "Portada guardada" |
| Preview admin | Visible en dropzones y vista previa dual |
| Cancelar selección | Disponible cuando hay archivo pendiente |
| URLs pre-QA (paths) | `.../logo/1778043063468-988ce359-...png`, `.../cover/1778043296241-83135490-...png` |

Backup local descargado para restauración: `tmp/qa-assets/original-logo.png` (~918 KB), `tmp/qa-assets/original-cover.png` (~1.8 MB).

## Assets QA usados

| Archivo | Tipo | Peso | Origen |
|---------|------|------|--------|
| `qa-logo.png` | PNG 1×1 (pixel QA) | ~70 B | `tmp/qa-assets/valid-logo.png` |
| `qa-cover.jpg` | JPG mínimo | ~264 B | `tmp/qa-assets/valid-cover.jpg` |

Inyección vía `DataTransfer` + evento `change` en `#logo-file` / `#cover-file` (CDP `DOM.setFileInputFiles` bloqueado por política del browser MCP).

## Logo upload E2E

| Paso | Resultado |
|------|-----------|
| Selección `qa-logo.png` | PASS — preview local, badge "Seleccionado", readiness "Pendiente de guardar" |
| Guardar | PASS — "Subiendo imágenes..." → "Guardado" |
| Feedback | PASS — "Cambios publicados correctamente." / "Logo guardado." |
| Refresh admin | PASS — logo persistido (nueva URL storage generada) |
| Landing pública | PASS — logo reflejado en `/b/demohamburgueseria` |
| Storage errors | Ninguno |

URL post-upload (nuevo objeto storage): path `.../logo/1783648215349-061ce3c6-...png`.

## Portada upload E2E

| Paso | Resultado |
|------|-----------|
| Selección `qa-cover.jpg` | PASS — preview, dirty state |
| Guardar | PASS — "Subiendo portada..." → "Portada guardada." |
| Feedback | PASS — "Cambios publicados correctamente." |
| Refresh admin | PASS |
| Landing + catálogo público | PASS — portada reflejada en `/b/demohamburgueseria` y `/b/demohamburgueseria/catalogo` |
| Layout | PASS — sin rotura visible |

URL post-upload: path `.../cover/1783648356405-92c12e44-...jpg`.

## Public routes after upload

| Ruta | Resultado |
|------|-----------|
| `/b/demohamburgueseria` | PASS — carga, logo QA visible |
| `/b/demohamburgueseria/catalogo` | PASS — logo + cover QA, productos OK |
| 404/500 | No observado |
| Imágenes rotas | No observado |

## Storage / Network / Errors

| Check | Resultado |
|-------|-----------|
| Supabase storage denied | No |
| 403 / RLS denied | No |
| File too large | No (assets < 5 MB) |
| MIME unsupported | No |
| Server action error | No |
| Timeout upload | No (logo ~instant; cover ~instant; restore ~3s con archivos ~2.7 MB) |

Uploads exitosos a bucket `business-assets` vía flujo server action existente.

## Responsive QA

| Viewport | Ruta | Resultado |
|----------|------|-----------|
| 390px | `/admin/settings` | PASS — sin overflow horizontal |
| 1440px | Smoke desktop (sesión) | PASS |
| 390px | `/admin/settings/public/landing` | No medido programáticamente |
| 390px | Rutas públicas | No medido programáticamente |

## Datos demo modificados/restaurados

### Durante QA (temporal)

1. Logo reemplazado por pixel QA (`qa-logo.png`)
2. Portada reemplazada por JPG mínimo QA (`qa-cover.jpg`)

### Restauración final

1. Logo y portada restaurados re-subiendo los archivos originales (fetch desde URLs pre-QA públicas)
2. Guardado exitoso — "Cambios publicados correctamente." / Logo y Portada "Listo"
3. **Nota técnica:** La restauración genera **nuevos paths** en storage (comportamiento esperado del upload); el contenido visual vuelve al asset demo original (~918 KB logo, ~1.8 MB cover)

### Sin cambios

- Descripción landing (`...QA test`)
- Textos catálogo
- Roles/usuarios
- Notificaciones
- Pedidos

## Bugs encontrados

Ninguno crítico.

## Resultado final

**PASS**

- Fresh login OK (logout + login)
- Settings access OK
- Logo upload E2E OK
- Portada upload E2E OK
- Persistencia + rutas públicas OK
- Assets demo restaurados (contenido original)
- Sin errores storage/server action

## Deuda restante

1. Incógnito real no usado (logout+login como proxy)
2. SHA remoto Vercel no verificado
3. Responsive 390px parcial en landing editor y rutas públicas
4. `/admin/settings/public` index no re-auditado explícitamente

## Próxima fase recomendada

- Cerrar epic Settings con handoff post-deploy actualizado
- Continuar roadmap operativo (orders/dashboard) con Settings V1 + upload prod validados
- Opcional: QA upload con archivo >5 MB en staging para validar mensaje de error (fuera de prod demo)
