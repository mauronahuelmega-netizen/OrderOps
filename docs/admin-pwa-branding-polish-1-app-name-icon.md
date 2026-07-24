# ADMIN-PWA-BRANDING-POLISH-1 — App name & icon polish (/admin)

## 1. Objetivo

Pulir el branding de la PWA admin instalable para que el nombre mostrado en el launcher sea **OrderOps** (no "OrderOps Admin") y el icono represente una marca OrderOps más completa y legible (no una "O" aislada), manteniendo `start_url` / `scope` / `id` en `/admin` sin service worker ni cambios operativos.

## 2. Contexto

La fase ADMIN-PWA-FOUNDATION-1 entregó manifest, metadata e iconos bajo `/admin`. En dispositivos Android el nombre "OrderOps Admin" y un glifo tipo "O" (anillo/círculo) se leían mal en el cajón de apps. Esta fase corrige solo naming de instalación e iconografía estática.

## 3. Alcance

- `lib/admin/pwa-manifest.ts` — `name` y coherencia con `short_name`
- `app/admin/layout.tsx` — metadata de instalación (vía constantes manifest)
- `scripts/generate-admin-pwa-icons.mjs` — diseño de marca compuesto
- Regeneración de `public/icons/orderops-admin-*.png` (192, 512, maskable 512, apple 180)
- Documentación de fase, `CURRENT_PHASE`, `ORDEROPS_LIVING_MEMORY`

## 4. Fuera de scope

- Service worker, offline cache, push PWA
- Auth, middleware, lógica admin, catálogo público, carrito, checkout
- Pricing, stock, DB, RLS, actions, pedidos / Realtime
- PWA en rutas `/b/[slug]/*`
- Nuevas dependencias npm

## 5. Autorizaciones

Commit y push a `origin/main` autorizados al cierre de validaciones CLI y smoke local.

## 6. Permisos operativos usados

Shell PowerShell con `Set-Location` al repo y `required_permissions: ["all"]` en comandos de agente.

## 7. Precheck

| Check | Resultado |
|-------|-----------|
| Branch | `main` |
| HEAD (pre) | `23abdd1` |
| `git status` | `M tsconfig.tsbuildinfo`; múltiples `docs/*` y `tmp/` sin relación — **no staged** |
| `npx tsc --noEmit` | PASS (exit 0) |
| `npm run build` | PASS — Next.js 16.2.9, rutas admin + manifest OK |

## 8. Auditoría inicial

| Artefacto | Hallazgo |
|-----------|----------|
| `lib/admin/pwa-manifest.ts` | `name`: OrderOps Admin; `short_name`: OrderOps; scope/start/id `/admin` correctos |
| `app/admin/layout.tsx` | `applicationName`, `appleWebApp.title`, `title.default` usaban `ADMIN_PWA_NAME` |
| `app/admin/manifest.webmanifest/route.ts` | Builder JSON sin auth; cache 300s |
| `scripts/generate-admin-pwa-icons.mjs` | SVG: panel índigo + **un solo anillo blanco** (percibido como "O") |
| `docs/admin-pwa-foundation-1-installable-standalone.md` | Fundación documentada; DEVICE QA debt |
| `public/icon.png` | 192×192 PNG oficial del sitio (`app/layout.tsx`); **no** incluye wordmark completo — tile/marca parcial |
| `public/icons/orderops-admin-*.png` | Generados por script anterior |

Búsqueda de assets: solo `public/icon.png`, `public/favicon.ico`, iconos admin PWA; sin SVG logo corporativo dedicado en repo.

## 9. Decisión de producto

- Nombre instalado unificado: **OrderOps** (`name` + `short_name` + metadata Apple/application).
- Icono: **fallback compuesto** generado en repo (checklist + anillos enlazados + wordmark **Ops**), no reutilizar `icon.png` como único elemento (sigue siendo marca parcial tipo "O").
- Usuario debe **desinstalar** la PWA admin previa y **reinstalar** para ver nombre/icono nuevos en Android/iOS.

## 10. Cambios de nombre

- `ADMIN_PWA_NAME` → `"OrderOps"`
- `ADMIN_PWA_SHORT_NAME` → `"OrderOps"` (sin cambio semántico)
- `ADMIN_PWA_DESCRIPTION` sin cambio: Panel operativo de OrderOps

## 11. Cambios de icono

Script actualizado: fondo slate `#0f172a`, panel índigo `#4f46e5`, tres líneas (motivo operativo/checklist), dos anillos enlazados (marca "OO" geométrica), texto **Ops** centrado en zona inferior. Maskable: inset ~10% (contenido en ~80% central).

## 12. Manifest admin

Sin cambios de URLs ni colores: `start_url` / `scope` / `id` = `/admin`; `theme_color` `#4f46e5`; `background_color` `#0f172a`; rutas de iconos unchanged.

## 13. Metadata admin

`app/admin/layout.tsx` sigue importando constantes; con `ADMIN_PWA_NAME = OrderOps` quedan alineados `applicationName`, `appleWebApp.title`, `title.default` y template `%s | OrderOps`. Link manifest `/admin/manifest.webmanifest` sin cambio.

## 14. Iconos generados

| Archivo | Dimensiones |
|---------|-------------|
| `orderops-admin-pwa-192.png` | 192×192 |
| `orderops-admin-pwa-512.png` | 512×512 |
| `orderops-admin-maskable-512.png` | 512×512 (maskable) |
| `orderops-admin-apple-180.png` | 180×180 |

Verificados con `sharp.metadata()` post-generación.

## 15. QA local

Ejecutar tras build: GET manifest JSON; HEAD/GET iconos 200; inspección `<head>` en `/admin/login`; smoke catálogo público; confirmar ausencia de SW nuevo en scope admin.

## 16. QA producción

Tras push: `https://orderops.vercel.app/admin/manifest.webmanifest`, iconos bajo `/icons/orderops-admin-*.png`.

## 17. QA dispositivo / device debt

Instalación real Add to Home Screen / Install app **no verificada por agente**. Requiere QA manual: desinstalar PWA vieja, reinstalar, validar launcher name + icono.

## 18. No side effects

Sin modificaciones a `public/sw.js` comportamiento admin, sin manifest público tenant, sin cambios en rutas protegidas más allá de metadata estática.

## 19. Seguridad

Manifest admin sigue siendo JSON estático sin datos de tenant ni sesión. Sin ampliación de superficie auth.

## 20. Limitaciones

OS pueden cachear iconos/nombres de instalaciones previas hasta reinstalar. `public/icon.png` sigue siendo favicon global del marketing root, no sustituido por esta fase.

## 21. Deuda residual

- DEVICE QA manual post-reinstall
- Asset de marca vectorial oficial unificado (wordmark + símbolo) fuera de repo — futuro diseño si marketing entrega master

## 22. Validaciones CLI

| Comando | Post-cambio |
|---------|-------------|
| `npx tsc --noEmit` | (ejecutado en cierre de fase) |
| `npm run build` | (ejecutado en cierre de fase) |

## 23. Deploy

Commit en `main` + push → Vercel production.

## 24. Rollback

Revert commit de fase; regenerar iconos previos desde commit anterior del script PNG; usuarios reinstalan si ya habían instalado build intermedio.

## 25. Resultado final

Branding PWA admin alineado a **OrderOps** con icono compuesto legible; alcance `/admin` preservado; sin SW/offline ni cambios operativos.

## 26. Próxima fase recomendada

**ADMIN-PWA-DEVICE-QA-1** — checklist instalación iOS Safari + Android Chrome + desktop; opcional entrega asset SVG master desde diseño.
