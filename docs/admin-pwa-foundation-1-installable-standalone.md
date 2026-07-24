# ADMIN-PWA-FOUNDATION-1 — Installable Standalone PWA (/admin)

## 1. Identificador de fase

**ADMIN-PWA-FOUNDATION-1** — Fundación PWA instalable standalone exclusiva del panel `/admin`.

## 2. Objetivo

Permitir que operadores instalen OrderOps Admin como aplicación standalone (Add to Home Screen / Install app) con alcance `/admin`, sin service worker, sin offline cache y sin PWA pública en catálogo.

## 3. Contexto

OrderOps es SaaS multi-tenant; el panel operativo vive bajo `/admin`. Se requiere manifest + metadata + iconos de marca admin (indigo/slate) alineados al design system, sin datos de tenant en el manifest.

## 4. Alcance

- `lib/admin/pwa-manifest.ts` — constantes estáticas + builder JSON
- `app/admin/manifest.webmanifest/route.ts` — GET público sin auth
- `app/admin/layout.tsx` — `metadata` + `viewport` PWA
- Iconos `public/icons/orderops-admin-*.png`
- `scripts/generate-admin-pwa-icons.mjs` (regeneración)
- Documentación de fase y registro en memoria viva

## 5. Fuera de alcance

- Service worker / offline / push PWA
- Cambios de auth, middleware redirects o lógica admin
- PWA en rutas públicas `/b/[slug]/*`
- Service worker en `public/sw.js` (sin cambios intencionales)

## 6. Decisión de auth y scope

- Login: `/admin/login` (dentro de `/admin`)
- `start_url`, `scope`, `id`: `/admin` — login queda dentro del scope instalado
- Middleware: solo `updateSession`; **no** redirige; `/admin/manifest.webmanifest` recibe refresh de cookies y responde **200**
- Rutas protegidas: `requireAdminContext` en layouts/páginas admin

## 7. Limpieza PUBLIC-PWA (no ship)

Verificado/ausente en repo al cierre:

| Artefacto | Estado |
|-----------|--------|
| `app/b/[slug]/manifest.webmanifest/` | No presente |
| `lib/public/pwa-manifest.ts` | No presente |
| `scripts/generate-pwa-icons.mjs` | No presente |
| `docs/public-pwa-foundation-1-*.md` | No presente |
| `public/icons/orderops-pwa-*.png` (nombres legacy públicos) | No presente |

Cache `.next` con referencia stale a manifest público: eliminar `.next/types` o `.next` completo cuando dev no bloquee archivos.

## 8. Constantes manifest (`lib/admin/pwa-manifest.ts`)

| Constante | Valor |
|-----------|-------|
| name | OrderOps Admin |
| short_name | OrderOps |
| description | Panel operativo de OrderOps |
| start_url / scope / id | /admin |
| display | standalone |
| theme_color | #4f46e5 |
| background_color | #0f172a |

## 9. Builder

`buildAdminWebAppManifest()` retorna objeto tipado `AdminWebAppManifest` con tres iconos: 192 any, 512 any, 512 maskable. Sin DB, sesión ni `business_id`.

## 10. Route handler

Ruta: `/admin/manifest.webmanifest` → `app/admin/manifest.webmanifest/route.ts`

- `Content-Type: application/manifest+json; charset=utf-8`
- `Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=86400`
- Try/catch → 500 JSON `{ error: "manifest_unavailable" }` sin stack trace
- `dynamic = "force-dynamic"`

## 11. Layout admin metadata

`app/admin/layout.tsx`:

- `applicationName`, `title` template, `description`
- `manifest: "/admin/manifest.webmanifest"`
- `appleWebApp`: capable, title, `black-translucent`
- `icons.apple`: `/icons/orderops-admin-apple-180.png`
- `viewport.themeColor`: #4f46e5

Children siguen siendo passthrough (`<>{children}</>`).

## 12. Iconografía

Generados con `node scripts/generate-admin-pwa-icons.mjs` (sharp):

| Archivo | Tamaño | Notas |
|---------|--------|-------|
| orderops-admin-pwa-192.png | 192 | Marca indigo + anillo "O" |
| orderops-admin-pwa-512.png | 512 | Idem |
| orderops-admin-maskable-512.png | 512 | Safe zone ~80% |
| orderops-admin-apple-180.png | 180 | apple-touch |

Fondo #0f172a, marca #4f46e5 — OrderOps Admin, no branding tenant.

## 13. Middleware

Sin cambios. Matcher `/admin/:path*` incluye manifest; solo refresh de sesión Supabase.

## 14. Multi-tenant

Manifest global de plataforma admin; no expone slug ni business. Aislamiento operativo sigue en server context + RLS.

## 15. Seguridad

Manifest e iconos son assets públicos de marketing/instalación; no contienen secretos. Panel sigue protegido por auth server-side.

## 16. Validación TypeScript

Comando: `npx tsc --noEmit` — ver registro de fase en `docs/CURRENT_PHASE.md`.

## 17. Validación build

Comando: `npm run build` — debe incluir ruta dinámica `/admin/manifest.webmanifest`.

## 18. QA local — manifest

GET `http://localhost:3000/admin/manifest.webmanifest` → 200, JSON con `name`, `scope`, `display: standalone`.

## 19. QA local — iconos

GET `/icons/orderops-admin-pwa-192.png` (y 512, maskable, apple) → 200 `image/png`.

## 20. QA local — admin entry

GET `/admin` → redirect login o dashboard según sesión; metadata manifest link en HTML admin.

## 21. QA local — catálogo público

GET `/b/demohamburgueseria/catalogo` → carga; **sin** manifest público `/b/.../manifest.webmanifest`.

## 22. QA producción (post-deploy)

GET `https://orderops.vercel.app/admin/manifest.webmanifest` — verificar tras push `main`.

## 23. Device QA debt

**PASS WITH DEVICE QA DEBT** — instalación real en iOS/Android/desktop no verificada por agente en este cierre.

## 24. Rollback

Revertir commit; opcional borrar iconos admin. No hay migraciones DB.

## 25. Riesgos

Usuarios pueden instalar shortcut a `/admin` sin sesión → login normal. Sin SW no hay cache stale de pedidos.

## 26. Invariantes preservadas

Reconciliación defensiva pedidos, RLS, pending mutations, sin polling global — sin tocar.

## 27. Archivos creados

- `lib/admin/pwa-manifest.ts`
- `app/admin/manifest.webmanifest/route.ts`
- `scripts/generate-admin-pwa-icons.mjs`
- `public/icons/orderops-admin-*.png` (×4)
- `docs/admin-pwa-foundation-1-installable-standalone.md`

## 28. Archivos modificados

- `app/admin/layout.tsx`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 29. Próximos pasos opcionales

- DEVICE-QA-1: validar install iOS Safari + Android Chrome + desktop PWA
- Futuro: SW solo si producto exige offline (fuera de scope)

## 30. Clasificación final

**PASS WITH DEVICE QA DEBT** — fundación admin PWA entregada; manifest + metadata + iconos + CLI green; instalación en dispositivo pendiente de QA manual.