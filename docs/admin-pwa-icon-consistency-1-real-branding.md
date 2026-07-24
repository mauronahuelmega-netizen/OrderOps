# ADMIN-PWA-ICON-CONSISTENCY-1 - Real web branding alignment (/admin PWA icons)

## 1. Objetivo

Alinear los iconos de la PWA admin instalable con la marca visible en la pestaña del navegador (`public/icon.png` / `/icon.png`), eliminando el tile compuesto indigo con wordmark **Ops** que contradecía la identidad circular azul/blanco OO, manteniendo nombre **OrderOps** y `start_url` / `scope` / `id` en `/admin` sin service worker ni cambios operativos.

## 2. Contexto

Tras ADMIN-PWA-BRANDING-POLISH-1 el launcher mostraba un icono generado por SVG (panel índigo + texto **Ops**) mientras la pestaña admin y el sitio usan el PNG circular de anillos enlazados en `public/icon.png` (referenciado en `app/layout.tsx`). Esa inconsistencia confundía a operadores al instalar la app.

## 3. Alcance

- `scripts/generate-admin-pwa-icons.mjs` — derivar PNG admin desde `public/icon.png` (sharp resize + canvas blanco)
- Regeneración de `public/icons/orderops-admin-*.png` (192, 512, maskable 512, apple 180)
- Documentación de fase, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`

## 4. Fuera de scope

- Service worker, offline cache, push PWA
- Auth, middleware, lógica admin, catálogo público, carrito, checkout
- Pricing, stock, DB, RLS, actions, pedidos / Realtime
- PWA en rutas `/b/[slug]/*`
- Sustituir o rediseñar `public/icon.png` (sigue siendo fuente 192×192)
- Nuevas dependencias npm

## 5. Autorizaciones

Commit y push a `origin/main` autorizados al cierre de validaciones CLI y smoke local/producción.

## 6. Permisos operativos usados

Shell PowerShell con `Set-Location` al repo y `required_permissions: ["all"]` en comandos de agente.

## 7. Precheck

| Check | Resultado |
|-------|-----------|
| Branch | `main` |
| HEAD (pre) | `de71cb5` |
| `git status` | `M scripts/generate-admin-pwa-icons.mjs`; `M tsconfig.tsbuildinfo` y otros docs/tmp **no staged** |
| `npx tsc --noEmit` | PASS (exit 0) |

## 8. Auditoría inicial

| Artefacto | Hallazgo |
|-----------|----------|
| `public/icon.png` | 192×192 PNG — anillos OO azul/blanco; metadata root `/icon.png` |
| `scripts/generate-admin-pwa-icons.mjs` (pre) | Fallback SVG con panel índigo y texto **Ops** |
| `public/icons/orderops-admin-*.png` (pre) | Generados desde SVG compuesto — launcher ≠ pestaña |
| `lib/admin/pwa-manifest.ts` | `name` / `short_name` **OrderOps**; rutas iconos sin cambio |
| `app/admin/layout.tsx` | Manifest link + metadata OrderOps |

## 9. Decisión de producto

- **Caso B:** reutilizar `public/icon.png` como única fuente de marca para iconos PWA admin (coherencia pestaña ↔ instalador).
- Aceptar **ICON SOURCE RESOLUTION DEBT:** fuente 192 px upscaled a 512 con Lanczos3 (sin master vector 512+ en repo).
- Mantener nombre instalado **OrderOps**; URLs manifest sin cambio.
- Usuario debe **desinstalar** PWA admin previa y **reinstalar** para refrescar icono cacheado por OS.

## 10. Cambios de nombre

Sin cambios en esta fase: `ADMIN_PWA_NAME` y `ADMIN_PWA_SHORT_NAME` permanecen **OrderOps**.

## 11. Cambios de icono

Script reescrito: lee `public/icon.png`, compone sobre canvas blanco cuadrado, padding 6% (any/apple) o 14% inset (maskable safe zone). **No** dibuja fallback SVG **Ops** ni panel índigo compuesto.

## 12. Manifest admin

Sin cambios: `start_url` / `scope` / `id` = `/admin`; `theme_color` `#4f46e5`; `background_color` `#0f172a`; paths `/icons/orderops-admin-pwa-192.png`, `-512`, `-maskable-512`, `-apple-180`.

## 13. Metadata admin

Sin cambios de código en esta fase; sigue enlazando `/admin/manifest.webmanifest` y títulos OrderOps desde layout existente.

## 14. Iconos generados

| Archivo | Dimensiones | Fuente |
|---------|-------------|--------|
| `orderops-admin-pwa-192.png` | 192×192 | `public/icon.png` |
| `orderops-admin-pwa-512.png` | 512×512 | upscale desde 192 source |
| `orderops-admin-maskable-512.png` | 512×512 maskable | mismo mark, inset mayor |
| `orderops-admin-apple-180.png` | 180×180 | mismo mark |

Verificación CLI post-`node scripts/generate-admin-pwa-icons.mjs`: dimensiones OK; `source public/icon.png 192 192 png`.

## 15. QA local

Tras `npm run build`: manifest JSON en `/admin/manifest.webmanifest` con `name`/`short_name` OrderOps e icon paths unchanged; GET iconos 200; `/admin` head OrderOps + manifest link; smoke `/b/demohamburgueseria/catalogo` 200; sin manifest público tenant; sin nuevo SW en scope admin.

## 16. QA producción

Post-push: `https://orderops.vercel.app/admin/manifest.webmanifest` y `https://orderops.vercel.app/icons/orderops-admin-pwa-192.png` (y resto admin icons) HTTP 200.

## 17. QA dispositivo / device debt

Instalación real no verificada por agente. Requiere desinstalar PWA admin anterior, reinstalar desde `/admin`, validar icono circular OO alineado a pestaña (no tile **Ops**).

## 18. No side effects

Sin SW/offline; sin cambios auth, catálogo, carrito, checkout, pricing, stock, DB, RLS, actions, pedidos.

## 19. Seguridad

Manifest admin sigue JSON estático sin datos de tenant; sin ampliación de superficie auth.

## 20. Limitaciones

OS cachean iconos de instalaciones previas hasta reinstalar. Upscale 192→512 puede verse ligeramente soft en launchers de alta densidad hasta exista master ≥512 px.

## 21. Deuda residual

- **ICON SOURCE RESOLUTION DEBT** — master raster/vector ≥512 px no disponible; fuente tab 192 px
- **DEVICE QA DEBT** — validación manual post-reinstall iOS/Android

## 22. Validaciones CLI

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` (pre/post) | PASS |
| `npm run build` | (ejecutado en cierre de fase) |

## 23. Deploy

Commit en `main` + push → Vercel production.

## 24. Rollback

Revert commit; restaurar script SVG + iconos del commit anterior; usuarios reinstalan si instalaron build intermedio.

## 25. Resultado final

Iconografía PWA admin alineada a la marca web en `public/icon.png`; eliminado wordmark **Ops** del pipeline de generación; alcance `/admin` y naming OrderOps preservados.

## 26. Clasificación final

**PASS WITH ICON SOURCE RESOLUTION AND DEVICE QA DEBT**

## 27. Archivos modificados

- `scripts/generate-admin-pwa-icons.mjs`
- `public/icons/orderops-admin-pwa-192.png`
- `public/icons/orderops-admin-pwa-512.png`
- `public/icons/orderops-admin-maskable-512.png`
- `public/icons/orderops-admin-apple-180.png`
- `docs/admin-pwa-icon-consistency-1-real-branding.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 28. Commit y evidencia HEAD

Mensaje: `Align OrderOps Admin PWA icon with web branding`. HEAD pre-fase: `de71cb5`; HEAD post documentado en cierre de agente.

## 29. Próxima fase recomendada

**ADMIN-PWA-DEVICE-QA-1** — checklist instalación iOS/Android post-reinstall; opcional entrega asset master ≥512 px desde diseño para cerrar resolución de fuente.
