## Registro — ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 — Two-Column Centering & Phone Frame Alignment  
**Estado:** PASS  
**Resumen:** Layout desktop en dos mitades (`1fr`/`1fr`); teléfono centrado en mitad derecha (sin `justify-self: end`); frame envuelve viewport con padding simétrico 16/16 y ancho 422; sticky ≥1024; mobile una columna sin overflowX. Solo CSS/markup shell.

- Doc: `docs/admin-catalog-preview-shell-layout-qa-fix-1.md`
- Código: `catalog-preview-shell.tsx`, `catalog-preview-shell.module.css`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1
- **Sin:** commit, push, deploy, DB, cookie, CSP, guard, carrito público, mobile-feel logic

---

## Registro — ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 — Preview Shell UX Polish Before Deploy  
**Estado:** PASS WITH NON-BLOCKING UX DEBT  
**Resumen:** Shell premium sin panel izquierdo: acciones jerarquizadas, checklist, Modo seguro, phone sticky, toasts admin, clear-cart via postMessage+ACK+remount. Vaciar refleja 0 en iframe. Clipboard success toast automation = deuda P3.

- Doc: `docs/admin-catalog-preview-shell-premium-polish-1.md`
- Código: `catalog-preview-shell.*`, `catalog-client.tsx`, `catalog-preview-shared.ts`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 → luego MOBILE-FEEL-DEPLOY-1
- **Sin:** commit, push, deploy, pedidos, panel izquierdo, estado carrito shell

---

## Registro — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1 — Authenticated Iframe QA for Mobile Feel  
**Estado:** READY WITH NON-BLOCKING QA DEBT  
**Resumen:** QA autenticado en `/admin/products/preview`: cursor + momentum + anti-selection + storage aislado + checkout bloqueado PASS dentro del iframe. Público normal intacto. Sin código. Próximo: MOBILE-FEEL-DEPLOY-1 (pausado por shell polish).

- Doc: `docs/admin-catalog-preview-mobile-feel-auth-qa-1.md`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 → luego DEPLOY
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1 — Mobile Feel Implementation  
**Estado:** PASS WITH AUTH QA DEBT  
**Resumen:** Cursor circular + momentum vertical RAF + scrollbar sutil solo en preview/mouse. Press feedback diferido. Public preview PASS; admin iframe UNVERIFIED. Sin tocar carrito/cookie/guard/CSP/DB.

- Doc: `docs/admin-catalog-preview-mobile-feel-polish-1.md`
- Código: `use-preview-pointer-pan-scroll.ts`, `use-preview-touch-cursor.ts`, `catalog-preview-mobile-feel.module.css`, `catalog-client.tsx`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1
- **Sin:** commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-SPEC-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-SPEC-1 — Mobile Feel UX Specification  
**Estado:** SPEC READY FOR IMPLEMENTATION  
**Resumen:** Se definió el polish mobile-feel para la preview: cursor circular tipo touch, momentum/inertia vertical, feedback táctil sutil y scrollbars menos protagonistas, siempre solo en preview desktop/mouse. Sin código funcional. Próximo: MOBILE-FEEL-POLISH-1.

- Doc: `docs/admin-catalog-preview-mobile-feel-spec-1.md`
- **Próximo:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 — Prevent Text Selection During Preview Pan  
**Estado:** PASS WITH PUBLIC QA ONLY  
**Resumen:** Anti-selección en mouse-pan preview: fase `candidate` inmediata, `user-select: none`, `selectstart`/`dragstart` prevent, cleanup de selection. Cards `role="button"` ya no bloquean pan sobre texto/imagen. Público preview PASS; admin iframe UNVERIFIED. Deploy sigue bloqueado hasta auth smoke.

- Doc: `docs/admin-catalog-preview-touch-pan-qa-fix-1.md`
- Código: `use-preview-pointer-pan-scroll.ts`, `catalog-preview-pan.module.css`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente (si corre)
- **Próximo (tras auth iframe):** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-DEPLOY-1
- **Sin:** commit, push, deploy, pedidos, carrito/cookie/guard/CSP/DB

---

## Registro — ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1 — Mouse Drag Touch-Scroll Polish  
**Estado:** PASS WITH AUTH QA DEBT  
**Resumen:** Mouse drag vertical scrollea el catálogo solo en preview (`isCatalogPreview` + pointer mouse). Hook aislado, threshold 8px, ignore interactivos/overlays. Público/touch/cookie/guard/CSP intactos. Admin iframe UNVERIFIED.

- Doc: `docs/admin-catalog-preview-touch-pan-polish-1.md`
- Código: `use-preview-pointer-pan-scroll.ts`, `catalog-preview-pan.module.css`, `catalog-client.tsx` + ignore attrs
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 (bloqueó deploy por selección de texto)
- **Sin:** commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-HANDOFF-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-HANDOFF-1 — Final Technical & Product Handoff  
**Estado:** FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT  
**Resumen:** Se consolidó el cierre técnico/producto de Vista previa del catálogo desplegada en producción. Feature en `/admin/products/preview` con iframe real, carrito preview aislado, checkout bloqueado UI+server, cookie 300s, clear al vaciar y CSP self. Sin DB/RLS/RPC/pedidos. Quedan deudas P2/P3 no bloqueantes.

- Doc: `docs/admin-catalog-preview-handoff-1.md`
- Commits: feature `c4b3e18` · docs deploy `84c0c48`
- **Próximo opcional:** TOUCH-PAN-POLISH-1 o AUTH-SMOKE-1
- **Sin:** código, deploy, rollback, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-DEPLOY-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-DEPLOY-1 — Controlled Deploy & Production Smoke  
**Estado:** DEPLOYED WITH NON-BLOCKING QA DEBT  
**Resumen:** Commit `c4b3e18` pushed a `main`; producción live en https://orderops.vercel.app con CSP `frame-ancestors 'self'`. Smoke público: carrito preview aislado + checkout bloqueado; público normal “Enviar pedido”. Admin auth / cookie DevTools UNVERIFIED. Sin pedidos / DB / RLS / RPC.

- Doc: `docs/admin-catalog-preview-deploy-1.md`
- **Próximo:** ADMIN-CATALOG-PREVIEW-HANDOFF-1
- **Sin:** migraciones, pedidos reales, rollback

---

## Registro — ADMIN-CATALOG-PREVIEW-RE-QA-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-RE-QA-1 — Authenticated Re-QA After Cookie Polish  
**Estado:** READY WITH NON-BLOCKING QA DEBT  
**Resumen:** Source confirma Max-Age 300 + clear cookie + vaciar wiring. Runtime `:3012`: carrito aislado, checkout preview bloqueado, público normal con “Enviar pedido”, CSP OK. Admin auth / cookie DevTools / clear al vaciar UNVERIFIED sin E2E. Sin P0/P1 nuevos.

- Doc: `docs/admin-catalog-preview-re-qa-1.md`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-DEPLOY-1
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1 — Preview Cookie Lifetime & Cleanup Polish  
**Estado:** PASS WITH AUTH QA DEBT  
**Resumen:** Cookie `orderops-admin-catalog-preview` pasa de Max-Age 3600 → **300**. “Vaciar carrito de prueba” limpia keys preview y expira cookie vía Server Action (`manageProducts` + tenant match). Checkout guard UI+server intacto. Sin DB/RLS/RPC ni botón nuevo.

- Doc: `docs/admin-catalog-preview-cookie-polish-1.md`
- Código: `catalog-preview-shared.ts`, `catalog-preview.ts`, `preview/actions.ts`, `catalog-preview-shell.tsx`
- **Próximo:** ADMIN-CATALOG-PREVIEW-RE-QA-1
- **Sin:** commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-QA-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-QA-1 — Authenticated Browser QA & Release Readiness  
**Estado:** READY AFTER COOKIE POLISH  
**Resumen:** Source/headers PASS. Path público `?orderopsPreview=1` confirma carrito aislado (preview cambia, public no) y checkout con submit deshabilitado + mensaje de bloqueo; sin pedidos/success. Admin autenticado UNVERIFIED (sin sesión E2E). Cookie preview 1h clasificada **P1** (afecta admin same-browser, no customers anónimos).

- Doc: `docs/admin-catalog-preview-qa-1.md`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-IMPL-SAFE-V1-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-IMPL-SAFE-V1-1 — Implementación segura V1  
**Estado:** PASS WITH DEBT  
**Resumen:** Se implementó `/admin/products/preview` (`manageProducts`) con iframe del catálogo real, cookie httpOnly de preview, carrito aislado `orderops-preview-cart*`, checkout visual con bloqueo UI+server (sin `create_order`), CTA dual en Productos y CSP `frame-ancestors 'self'`. Sin DB/RLS/RPC/sidebar/recargar/pedidos.

- Doc: `docs/admin-catalog-preview-impl-safe-v1-1.md`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- Headers local: CSP `frame-ancestors 'self'` OK
- **Deuda:** browser QA autenticado + cookie 1h bloquea pedidos reales en mismo browser/path
- **Próximo:** ADMIN-CATALOG-PREVIEW-QA-1
- **Sin:** commit, push, deploy

---

## Registro — ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 — Product & Technical Spec Closure  
**Estado:** PRODUCT SPEC DECISIONS CLOSED · READY FOR IMPLEMENTATION  
**Resumen:** Se congelaron las decisiones P0/P1 del Product Owner para la Vista previa del catálogo en `/admin/products/preview`: iframe same-origin, carrito aislado (`orderops-preview-cart*`), checkout visual sin confirmación (UI+server), sin success, `manageProducts`, CTA dual (preview + copiar link), CSP `frame-ancestors 'self'`, sin recargar/sidebar/device selector. Preview mode debe ser verificable server-side (no solo query).

- Doc: `docs/admin-catalog-preview-spec-closure-1.md`
- Audit base: `docs/admin-catalog-preview-audit-1-forensic-architecture.md`
- **Próximo paso:** implementación (IMPL foundation / cart / checkout-guard) — **no iniciada**
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-AUDIT-1 (2026-07-26)

**Fase:** ADMIN-CATALOG-PREVIEW-AUDIT-1 — Forensic Architecture & Product Audit  
**Estado:** READY WITH TECHNICAL CONDITIONS  
**Resumen:** Auditoría forense (solo docs) de la futura vista previa móvil del catálogo público en admin vía iframe same-origin. Confirmado: ruta `/b/[slug]/catalogo`, auth por layout, carrito `localStorage` por `businessId` compartido same-origin, checkout → `create_order` real sin `preview_mode`, sin XFO/CSP framing en repo ni prod. Iframe **VIABLE WITH CONDITIONS**.

- Doc: `docs/admin-catalog-preview-audit-1-forensic-architecture.md`
- Hallazgos: P0 pedidos/carrito/tenant/CTA/framing · P1 PWA/naming/responsive · P2 a11y/perf
- Recomendación preliminar: híbrido (E) o iframe+guards (B); no iframe naive (A)
- CLI baseline: `tsc` PASS · `build` PASS · lint FAIL preexistente (ESLint config)
- **Próximo paso:** ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 (decisiones P0 del PO)
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-PWA-ICON-CONSISTENCY-1 (2026-07-24)

**Fase:** ADMIN-PWA-ICON-CONSISTENCY-1 — Admin PWA icon real branding alignment  
**Estado:** PASS WITH ICON SOURCE RESOLUTION AND DEVICE QA DEBT  
**Resultado:** Los iconos PWA admin se regeneraron desde `public/icon.png` (misma marca que la pestaña /icon.png), eliminando el fallback SVG con texto **Ops**. Nombre **OrderOps** y start_url/scope/id /admin sin cambio. Sin SW/offline ni cambios auth/admin/catálogo.

- Doc: `docs/admin-pwa-icon-consistency-1-real-branding.md`
- Fuente: `public/icon.png` 192×192 (Caso B — upscale a 512)
- **Usuario:** desinstalar PWA admin anterior y reinstalar para ver icono en launcher
- CLI: `tsc` PASS → `build` PASS
- **Deuda:** resolución master ≥512 px + DEVICE QA manual

---

## Registro — ADMIN-PWA-BRANDING-POLISH-1 (2026-07-24)

**Fase:** ADMIN-PWA-BRANDING-POLISH-1 â€” Admin PWA app name & icon polish  
**Estado:** PASS WITH BRAND ASSET AND DEVICE QA DEBT  
**Resultado:** Se unificÃ³ el nombre instalado a **OrderOps** y se reemplazÃ³ el icono tipo "O" aislada por una marca compuesta (checklist + anillos + **Ops**) en iconos admin PWA. `start_url`/`scope`/`id` permanecen en `/admin`. Sin SW/offline ni cambios auth/admin/catÃ¡logo.

- Doc: `docs/admin-pwa-branding-polish-1-app-name-icon.md`
- Asset: `public/icon.png` existe pero es marca parcial; se usÃ³ fallback SVG compuesto en script
- **Usuario:** desinstalar PWA admin anterior y reinstalar para ver nombre/icono en launcher
- CLI: `tsc` PASS â†’ `build` PASS
- **Deuda:** DEVICE QA manual + asset corporativo master opcional

---
## Registro â€” ADMIN-PWA-FOUNDATION-1 (2026-07-24)

**Fase:** ADMIN-PWA-FOUNDATION-1 â€” Installable Standalone PWA (/admin only)  
**Estado:** PASS WITH DEVICE QA DEBT  
**Resultado:** Se aÃ±adiÃ³ manifest web app, metadata/viewport e iconos de marca para instalar OrderOps Admin como standalone en `/admin`, sin service worker, sin offline cache y sin PWA pÃºblica en catÃ¡logo.

- Doc: `docs/admin-pwa-foundation-1-installable-standalone.md`
- Auth/scope: login en `/admin/login`; `start_url`/`scope`/`id` = `/admin`; middleware solo `updateSession`
- CLI: `tsc` PASS Â· `build` PASS
- Smoke: manifest JSON + iconos 200 Â· `/admin` Â· catÃ¡logo pÃºblico sin manifest tenant
- **Deuda:** instalaciÃ³n real en dispositivo no verificada por agente (DEVICE QA)
- **Fuera de scope:** SW, offline, cambios auth, PWA pÃºblica `/b/[slug]`

---
# OrderOps: Estado de Desarrollo y Fase Actual (6 de Junio)

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-FINAL-HANDOFF-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-V1-FINAL-HANDOFF-1 â€” Product Customization Admin V1 Final Technical & Product Handoff  
**Estado:** PASS  
**Resultado:** Product Customization Admin V1 quedÃ³ formalmente cerrado y documentado como premium-ready para piloto. El mÃ³dulo conserva Enterprise Readiness 4.3/5, P0=0 y P1=0. El handoff consolida arquitectura, datos, permisos, actions, flujos admin/pÃºblico, pricing, cart, checkout, snapshots, stock, QA, invariantes, rollback y deuda residual aceptada.

- Doc: `docs/product-customization-admin-v1-final-handoff-1.md`
- Deploy: commit `6731a16` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS Â· **docs-only**
- Smoke: admin 4 tabs + a11y menÃºs Â· pÃºblico Doble Smash parent+ADICIONAL (sin pedido)
- **PrÃ³xima obligatoria:** ninguna  
- **Opcionales:** DND-TOUCH-POLISH-1 Â· PILOT-MONITOR-3

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 â€” Accessible Menus, Focus & Keyboard Polish  
**Estado:** PASS WITH DND TOUCH DEBT  
**Resultado:** Se corrigiÃ³ la accesibilidad de los menÃºs y dialogs del admin de Product Customization. Los menuitems cerrados ya no permanecen en el accessibility tree, los triggers exponen estado y contexto, Escape/click fuera cierran correctamente y el foco vuelve al control de origen, sin modificar lÃ³gica operativa.

- Doc: `docs/product-customization-admin-a11y-polish-1-menus-focus-keyboard.md`
- Deploy: commit `128fac2` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- A11y tree: cerrado `menuitems=0` Â· Escape/click fuera Â· foco al trigger Â· confirm remove accesible
- Deuda: drag handle ~32px â†’ DND-TOUCH-POLISH-1
- **PrÃ³xima:** DND-TOUCH-POLISH-1 (opcional) Â· V1-FINAL-HANDOFF-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-PREMIUM-RESCORE-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-V1-PREMIUM-RESCORE-1 â€” Enterprise Premium Rescore & Residual Handoff  
**Estado:** PASS WITH RESIDUAL POLISH DEBT  
**Resultado:** Se re-auditÃ³ el admin de Product Customization V1 despuÃ©s de las fases de polish principales. Los P1 del monitor original quedaron cerrados, el score enterprise mejorÃ³ y solo queda deuda residual P2/P3 para handoff.

- Doc: `docs/product-customization-admin-v1-premium-rescore-1-enterprise-readiness.md`
- Score: **4.3/5** (antes 3.1 Â· Î” +1.2) Â· P0=0 Â· P1=0 Â· P2=5 Â· P3=3
- P1 originales: CLOSED (categorÃ­a ciega Â· Desactivar Â· compact vs dense Â· mobile width Â· excepciones query)
- CLI: `tsc` PASS Â· `build` PASS Â· audit/docs-only (sin runtime)
- Browser QA: 390â€“1440 Â· light/dark Â· 4 tabs Â· preview Â· pÃºblico Doble Smash parent+ADICIONAL
- **PrÃ³xima:** A11Y-POLISH-1 / DND-TOUCH-POLISH-1 (opcionales) Â· V1-FINAL-HANDOFF-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 â€” Responsive Premium Polish  
**Estado:** PASS  
**Resultado:** Se corrigiÃ³ el responsive del admin de Product Customization, mejorando ancho Ãºtil mobile, tabs, cards, chips, modales, menÃºs y vista previa sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-admin-responsive-polish-1-mobile-layout.md`
- Deploy: commit `fa8265e` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA: 390/414/768/1024/1440 Â· light/dark Â· 4 tabs Â· modales Â· preview Â· pÃºblico Doble Smash parent+ADICIONAL
- Shell: padding scoped `:has(.admin-page-layout--customizations-mobile)` â‰¤719px
- **PrÃ³xima:** monitor re-score / handoff residual opcional

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 â€” Safe Assignment Unassign Action & UX  
**Estado:** PASS  
**Resultado:** Se implementÃ³ una action segura para quitar asignaciones de secciones en Por producto y Por categorÃ­a, con validaciones tenant/permiso, confirmaciÃ³n owner-friendly y QA controlado, sin eliminar secciones/opciones ni modificar lÃ³gica pÃºblica.

- Doc: `docs/product-customization-admin-assignments-remove-1-safe-unassign-action.md`
- Deploy: commit `e8383e0` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA: Mozzarella temp assign/unassign Â· Secciones intactas Â· pÃºblico Doble Smash
- **PrÃ³xima:** RESPONSIVE-POLISH-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 â€” Product & Category Assignments Compact UI  
**Estado:** PASS WITH REMOVE DEBT  
**Resultado:** Se compactÃ³ la UX de asignaciones en Por producto y Por categorÃ­a, reemplazando bloques densos por cards/rows resumidas, modales de agregado y acciones secundarias mÃ¡s claras, sin cambiar lÃ³gica operativa. No existe action segura de quitar asignaciÃ³n (solo Ocultar/Mostrar).

- Doc: `docs/product-customization-admin-assignments-compact-1-product-category-assignments.md`
- Deploy: commit `4f6ebfe` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA: Por producto compacto Â· Por categorÃ­a empty/CTA Â· Secciones/Plus Â· preview Â· pÃºblico Doble Smash parent+adicional
- Deuda: sin remove/unassign seguro â†’ fase REMOVE opcional
- **PrÃ³xima:** ASSIGNMENTS-REMOVE-1 (opcional) Â· RESPONSIVE-POLISH-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 â€” Product Exceptions Guided UX  
**Estado:** PASS  
**Resultado:** Se mejorÃ³ la UX de Excepciones del producto, presentÃ¡ndolas como ajustes propios guiados para el producto seleccionado, con empty states, resumen y acciones owner-friendly, sin cambiar la lÃ³gica de overrides ni el modelo de datos.

- Doc: `docs/product-customization-admin-exceptions-ux-1-guided-product-exceptions.md`
- Deploy: commit `f4d5260` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA: panel por selecciÃ³n Â· hide/restore BBQ Â· preview Â· pÃºblico Doble Smash
- **PrÃ³xima:** ASSIGNMENTS-COMPACT-1 Â· RESPONSIVE-POLISH-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 (2026-07-19)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 â€” Product & Category Hierarchy Premium Polish  
**Estado:** PASS WITH HIERARCHY DEBT  
**Resultado:** Se mejorÃ³ la jerarquÃ­a visual y comprensiÃ³n de los tabs Por producto y Por categorÃ­a, reforzando headers, agrupaciÃ³n, empty states, presentaciÃ³n de excepciones y consistencia visual con las secciones compactas, sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-admin-hierarchy-polish-1-product-category-hierarchy.md`
- Deploy: commit `a16de09` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA local admin + pÃºblico Doble Smash PASS
- Deuda: assignments densos Â· excepciones vÃ­a `?product=` Â· responsive estructural â†’ fases posteriores
- **PrÃ³xima:** EXCEPTIONS-UX-1 Â· ASSIGNMENTS-COMPACT-1 Â· RESPONSIVE-POLISH-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 (2026-07-19)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 â€” Owner-Friendly Premium Copy Polish  
**Estado:** PASS  
**Resultado:** Se puliÃ³ el copy owner-facing del admin de Product Customization, reemplazando lenguaje tÃ©cnico o ambiguo por tÃ©rminos claros y premium como â€œVista previaâ€, â€œMostrar/Ocultar para clientesâ€, â€œAplicado desdeâ€, â€œExcepciones del productoâ€ y â€œOrden de apariciÃ³nâ€, sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-admin-copy-polish-1-owner-friendly-copy.md`
- Deploy: commit `40d4cd1` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Deuda menor: mensajes de success en actions con â€œHerenciaâ€¦â€ (actions no tocadas por scope)
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 Â· EXCEPTIONS-UX-1 Â· ASSIGNMENTS-COMPACT-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 (2026-07-19)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 â€” Enterprise Premium QA & UX/UI Polish Audit  
**Estado:** NEEDS POLISH  
**Resultado:** Se auditÃ³ crÃ­ticamente el mÃ³dulo admin de Product Customization V1 con foco enterprise/premium, revisando funcionalidad, copy, jerarquÃ­a, UX/UI, responsive, accesibilidad bÃ¡sica, preview admin y no regresiÃ³n pÃºblica. Se generÃ³ una matriz priorizada de hallazgos y prÃ³ximas fases quirÃºrgicas.

- Doc: `docs/product-customization-admin-v1-polish-monitor-1-premium-qa.md`
- Enterprise Readiness Score: **3.1/5**
- Hallazgos: P0=0 Â· P1=5 Â· P2=8 Â· P3=4 Â· pÃºblico sin regresiÃ³n
- CLI: `tsc` PASS Â· `build` PASS
- Sin cambios runtime / DB / actions / deploy funcional
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 â†’ HIERARCHY / EXCEPTIONS â†’ ASSIGNMENTS-COMPACT â†’ RESPONSIVE

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 (2026-07-19)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 â€” Plus Suggestions Legacy Cleanup  
**Estado:** PASS  
**Resultado:** Se eliminÃ³ el componente legacy del flujo inline anterior de Plus sugeridos y se limpiaron referencias/CSS obsoletos donde fue seguro hacerlo. La UI compacta sigue funcionando y no se modificÃ³ lÃ³gica operativa.

- Eliminado: `upsell-groups-section.tsx` (0 imports)
- CSS huÃ©rfano: `.plusWorkspace`, `.optionsSection` (compartido assignments/overrides conservado)
- Doc: `docs/product-customization-plus-suggestions-cleanup-1-legacy-cleanup.md`
- Deploy: commit `6b0e153` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** monitor piloto Â· opcional densificar Por producto / Por categorÃ­a

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 â€” Compact Plus Suggestions UI  
**Estado:** PASS  
**Resultado:** La pestaÃ±a Plus sugeridos fue compactada: las ventas sugeridas ahora se muestran como cards resumidas, la ediciÃ³n ocurre en modales y los productos sugeridos se gestionan en un modal dedicado sin tocar la lÃ³gica operativa.

- Components: `plus-suggestions/*` Â· wired en `owner-customization-builder`
- Actions reutilizadas (create/update/toggle group + add/update/toggle item; â†‘â†“ vÃ­a update item)
- Doc: `docs/product-customization-plus-suggestions-compact-1-compact-plus-suggestions-ui.md`
- Deploy: commit `a2a9b26` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 (hecho) Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 â€” Plus Suggestions Compact UX Specification  
**Estado:** PASS  
**Resultado:** Se definiÃ³ la UX compacta para Plus sugeridos, reemplazando formularios inline extensos por cards resumidas, menÃºs de acciones y modales de ediciÃ³n para ventas sugeridas y productos sugeridos, sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-plus-suggestions-ux-spec-1-compact-plus-suggestions.md`
- Principio: lista = lectura; modal = ediciÃ³n / gestionar productos
- Actions existentes reutilizables; sin delete/remove; sin reorder RPC (â†‘â†“ vÃ­a update item)
- PatrÃ³n alineado a Secciones reutilizables compact
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 â€” Reusable Sections Legacy Cleanup  
**Estado:** PASS  
**Resultado:** Se eliminaron componentes legacy e imports/CSS obsoletos del flujo inline anterior de Secciones reutilizables. La UI compacta sigue funcionando y no se modificÃ³ lÃ³gica operativa.

- Eliminados: `create-group-form.tsx`, `customization-group-card.tsx`, `sortable-groups-list.tsx`
- CSS huÃ©rfano sections-only removido del module admin (compartido Plus/assignments conservado)
- Doc: `docs/product-customization-reusable-sections-cleanup-1-legacy-cleanup.md`
- Deploy: commit `5819460` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 (tras UX-SPEC)

---

## Registro â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 â€” Compact Reusable Sections UI  
**Estado:** PASS  
**Resultado:** La pestaÃ±a Secciones reutilizables fue compactada: las secciones ahora se muestran como cards resumidas, la ediciÃ³n ocurre en modales, las opciones se gestionan en un modal dedicado y se eliminaron los formularios inline extensos sin tocar la lÃ³gica operativa.

- Components: `reusable-sections/*` Â· wired en `owner-customization-builder`
- Actions reutilizadas (create/update/toggle/reorder)
- Doc: `docs/product-customization-reusable-sections-compact-1-compact-reusable-sections-ui.md`
- Deploy: commit `a124459` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** cleanup legacy forms Â· opcional compact Plus tab

---

## Registro â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 â€” Reusable Sections Compact UX Specification  
**Estado:** PASS  
**Resultado:** Se definiÃ³ la UX compacta para Secciones reutilizables, reemplazando formularios inline extensos por cards resumidas, menÃºs de acciones y modales de ediciÃ³n para secciones y opciones, sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-reusable-sections-ux-spec-1-compact-reusable-sections.md`
- Principio: lista = lectura/orden; modal = ediciÃ³n
- Actions existentes reutilizables; sin delete/duplicate en V1
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 â€” Admin Preview Product Overrides Fidelity  
**Estado:** PASS WITH DATA QA DEBT  
**Resultado:** La preview sandbox de `/admin/products/customizations` ahora refleja overrides/excepciones del producto seleccionado. Los grupos u opciones ocultos por override no aparecen en la vista previa, los grupos propios se mantienen y la selecciÃ³n local se limpia cuando cambian las opciones efectivas.

- Loader: `getCustomizationOverridesForAdmin` en corpus admin
- Mapper: `resolveAdminEffectivePreviewConfig` / overrides filter alineado a pÃºblico
- Sandbox: prune de selection ids invisibles
- Piloto sin overrides `is_enabled=false` â†’ browser hide N/A (in-memory rules OK)
- Doc: `docs/product-customization-admin-preview-overrides-1-preview-overrides-fidelity.md`
- Deploy: commit `dee486a` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** QA opcional con override disable real autorizado Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 â€” Admin Preview Dead Code & Wiring Cleanup  
**Estado:** PASS  
**Resultado:** Se eliminÃ³ la preview placeholder anterior y se limpiÃ³ wiring/imports/CSS obsoleto relacionado. La preview sandbox interactiva sigue funcionando y el modal pÃºblico conserva su comportamiento.

- Eliminado: `customer-preview-panel.tsx` (0 imports)
- CSS huÃ©rfano del placeholder removido del module admin
- Sandbox `AdminCustomizationLivePreview` + modal pÃºblico smoke OK
- Doc: `docs/product-customization-admin-preview-cleanup-1-dead-code-wiring-cleanup.md`
- Deploy: commit `34b0b55` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** opcional overrides en mapper admin Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 â€” Interactive Admin Preview Sandbox  
**Estado:** PASS  
**Resultado:** La preview admin de Product Customization ahora es interactiva y sandbox. Permite probar selecciÃ³n single/multi, plus/adicionales y total estimado reutilizando componentes presentacionales del modal pÃºblico, sin agregar al carrito, sin localStorage, sin checkout y sin writes.

- Shared: option-group/row Â· upsell Â· price-summary Â· \`preview-selection.ts\`
- Admin: \`admin-customization-live-preview.tsx\` + \`admin-preview-mapper.ts\`
- PÃºblico: modal refactorizado sin cambio de comportamiento (smoke Papas/Salsas/Plus OK)
- Doc: \`docs/product-customization-admin-preview-polish-1-interactive-preview-sandbox.md\`
- **PrÃ³xima:** opcional overrides en mapper Â· cleanup CustomerPreviewPanel

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 â€” Interactive Admin Preview Architecture Spec  
**Estado:** PASS  
**Resultado:** Se auditÃ³ el modal pÃºblico y la preview admin actual. Se definiÃ³ una arquitectura segura para una preview interactiva en modo sandbox, reutilizando componentes presentacionales sin arrastrar carrito, checkout, localStorage ni side effects.

- Veredicto: **no** importar `CustomizationModal` completo
- RecomendaciÃ³n: extraer presentacionales shared + estado local sandbox + mapper adminâ†’`PublicProductCustomizationConfig`
- Reutilizar: `validateCustomizationSelection`, `computeVisualCustomizationTotal`, `upsell-copy`
- Doc: `docs/product-customization-admin-preview-spec-1-interactive-admin-preview-architecture.md`
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 (implementaciÃ³n)

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 â€” Admin Customizations Button Theme Polish  
**Estado:** PASS  
**Resultado:** Los botones y controles interactivos de `/admin/products/customizations` quedaron alineados con los tokens de theme del admin. Dark/light se ven consistentes, los disabled states son claros y la pantalla conserva la lÃ³gica operativa intacta.

- Primary: accent (`--accent-primary`) en lugar de ink `text-primary` (evita blanco crudo en dark)
- Secondary / DnD tokenizados Â· overrides scoped bajo `.builderShell` para `admin-primary-button`
- Sin layout/DB/RLS/actions Â· tsc/build PASS
- Doc: `docs/product-customization-admin-button-theme-polish-1-button-theme-polish.md`
- **PrÃ³xima:** opcional primary global admin-wide Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 â€” Admin Customizations Layout & Theme Polish  
**Estado:** PASS  
**Resultado:** La pantalla `/admin/products/customizations` quedÃ³ alineada visualmente con el resto del admin. Usa mejor el ancho disponible, elimina estilos legacy/hardcoded relevantes y mantiene compatibilidad dark/light sin tocar lÃ³gica operativa.

- Shell: `AdminPageLayout size="operational"` + header operational (mismo ancho efectivo que Products / 1600px)
- CSS module: grid 3-col â‰¥1200px Â· tabs strip Â· surfaces tokenizadas Â· selected con accent
- Sin DB/RLS/actions/checkout/stock Â· tsc/build PASS
- Doc: `docs/product-customization-admin-visual-polish-1-layout-theme-polish.md`
- **PrÃ³xima:** monitor piloto Â· opcional preview mÃ¡s fiel al modal pÃºblico

---

## Registro â€” PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 â€” Flag OFF Corpus Fixture Negative QA  
**Estado:** PASS  
**Resultado:** Se creÃ³ un fixture no piloto con Product Customization flag OFF y corpus real. La lectura privilegiada confirma que existen filas, pero anon no puede leerlas por RLS. El piloto flag ON sigue funcionando y business_settings permanece cerrado para anon.

- Fixture: `qa-rls-flag-off-customization` / `59db34de-â€¦` Â· flag OFF Â· corpus 1/1/1/1/1 + override
- Anon fixture corpus **0** Â· piloto groups=3 options=11 upsell=1 Â· Plus UI OK Â· KEEP fixture
- Doc: `docs/product-customization-flag-off-rls-fixture-qa-1-flag-off-corpus-fixture-negative-qa.md`
- **PrÃ³xima:** reusar fixture en regresiones Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 â€” Flag OFF Public RLS Negative QA  
**Estado:** PASS WITH FIXTURE DEBT  
**Resultado:** El helper y business_settings cerrado fueron validados, y el control positivo del piloto ON pasÃ³. No se encontrÃ³ tenant flag OFF con corpus real para probar negaciÃ³n completa; queda deuda de fixture.

- Helper false: `roticeriajuan` / `majopasteleria` (sin settings) Â· piloto helper true Â· anon settings=0
- Piloto Plus UI OK Â· browser flag-OFF N/A (404) Â· sin writes
- Doc: `docs/product-customization-flag-off-rls-qa-1-flag-off-public-rls-negative-qa.md`
- **PrÃ³xima:** fixture flag-OFF con corpus (auth) Â· o monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 â€” Plus UI + Stock + Public RLS Live Monitoring  
**Estado:** PASS  
**Resultado:** El piloto live se mantiene estable luego de Plus UI, copy polish, inventario tracked y public RLS hardening. CatÃ¡logo, modal, carrito, checkout, dashboard, stock Coca, ledger y corpus anon fueron validados sin writes.

- Flags ON Â· sesiÃ³n abierta Â· Coca stock **4** Â· anon corpus OK Â· `business_settings` count=0
- Modal â€œSumÃ¡ una bebidaâ€ + Coca Â· carrito/checkout â€œAdicionalâ€ Â· Pendientes QA=0
- Doc: `docs/product-customization-pilot-monitor-2-plus-ui-stock-public-rls-live-monitoring.md`
- **PrÃ³xima:** monitor operaciÃ³n real Â· opcional reconciliaciÃ³n `#9632` (auth) Â· opcional flag-OFF test

---

## Registro â€” PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 â€” Public Customization Corpus RLS Hardening  
**Estado:** PASS  
**Resultado:** El corpus pÃºblico de Product Customization / Plus UI dejÃ³ de depender del service role directo. RLS pÃºblica ahora usa un helper SECURITY DEFINER que expone solo el booleano del flag y permite leer customizations/upsells disponibles cuando Product Customization estÃ¡ activo.

- Helper: `public.is_public_product_customization_enabled(uuid)` Â· policies public SELECT actualizadas
- CÃ³digo: `loadPublicCustomizationCorpus` â†’ `createSupabaseServerClient()` (sin service role en corpus)
- Apply prod OK Â· anon REST: groups=3 options=11 upsell Bebidas/Coca Â· `business_settings` count=0
- Doc: `docs/product-customization-public-rls-hardening-1-public-corpus-rls-hardening.md`
- **PrÃ³xima:** monitor piloto Â· opcional test flag-OFF Â· opcional flag gate vÃ­a RPC

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 â€” Customer-facing Plus Copy Alignment  
**Estado:** PASS  
**Resultado:** El copy pÃºblico de Plus Bebidas quedÃ³ alineado para clientes. La secciÃ³n del modal comunica la venta sugerida como una bebida adicional al pedido, manteniendo intacta la lÃ³gica de parent+upsell, checkout, stock y restock.

- Helper: `lib/product-customization/upsell-copy.ts` Â· modal â€œSumÃ¡ una bebidaâ€ Â· carrito/checkout â€œAdicionalâ€
- Sin pedido QA Â· sin DB/RPC/stock
- Doc: `docs/product-customization-plus-copy-polish-1-customer-facing-plus-copy-alignment.md`
- **PrÃ³xima:** opcional RLS public hardening Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 â€” Deploy Plus Suggestions UI  
**Estado:** PASS  
**Resultado:** Plus Bebidas quedÃ³ desplegado y validado en la UI pÃºblica productiva. El cliente puede agregar Coca Cola 500ml como plus dentro del modal de Doble Smash; checkout, dashboard, decremento de stock, ledger y restock al cancelar funcionan end-to-end.

- Deploy: `a284a23` Plus UI + `d1b8e7f` service-role public corpus (fix RLS/anon gap) â†’ `https://orderops.vercel.app`
- Smoke: Doble Smash modal Â· Papas/Salsas/Agregados Â· plus Coca Â· carrito parent+plus
- QA: `#76D4` `8508feb5-â€¦` Coca **4â†’3** `order_decrement` upsell Â· cancel UI **3â†’4** `order_restock` Â· idempotencia OK
- Doc: `docs/product-customization-plus-ui-deploy-1-deploy-plus-suggestions-ui.md`
- **PrÃ³xima:** opcional hardening RLS public/`business_settings` Â· copy Plus Â· monitor piloto

---

## Registro â€” PRODUCT-STOCK-QA-ORDER-CLEANUP-1 (2026-07-17)

**PRODUCT-STOCK-QA-ORDER-CLEANUP-1 â€” Controlled QA Orders Cleanup** â†’ **PASS WITH DEBT**.

- Cancel UI: `#9632` + `#9B25` pendingâ†’cancelled Â· 0 deletes Â· Coca stock **4**
- `#9632` sin `order_restock` (pre-ledger, correcto) Â· deuda histÃ³rica 1 Coca documentada
- Dashboard: Pendientes vacÃ­os Â· QA en Cancelados
- Doc: `docs/product-stock-qa-order-cleanup-1-controlled-qa-orders-cleanup.md`
- **PrÃ³xima:** opcional reconciliaciÃ³n manual pre-ledger (auth) Â· deploy WIP customization

---

## Registro â€” PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 (2026-07-17)

**PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 â€” Deploy Status Action Wiring & UI Cancel Smoke** â†’ **PASS**.

- Deploy: commit `b0bfddb` â†’ `origin/main` â†’ Vercel `https://orderops.vercel.app`
- UI create: `#754A` `21064f2b-â€¦` Coca tracked Â· stock **4â†’3** + `order_decrement`
- UI cancel admin: pendingâ†’cancelled Â· Coca **3â†’4** + `order_restock` (`source=transition_order_status`)
- Idempotencia UI: â€œNo hubo cambiosâ€ Â· restock count=1 Â· timeline `status_changed` OK
- Doc: `docs/product-stock-restock-action-deploy-smoke-1-deploy-status-action-wiring-ui-cancel-smoke.md`
- **PrÃ³xima:** deploy WIP customization (Plus UI) Â· cleanup QA `#9632` opcional

---

## Registro â€” PRODUCT-STOCK-RESTOCK-CANCEL-1 (2026-07-17)

**PRODUCT-STOCK-RESTOCK-CANCEL-1 â€” Idempotent Cancel Restock via stock_movements** â†’ **PASS WITH DEBT**.

- RPC `transition_order_status` restockea solo con `order_decrement` previo (TX + idempotente)
- `updateOrderStatusAction` llama al RPC (cÃ³digo local); **deploy Vercel pendiente** (deuda)
- QA: `#8B9A` `4ef1169a-â€¦` pendingâ†’cancelled Â· Coca **3â†’4** Â· `order_restock` +1
- Idempotencia: re-cancel no-op Â· legacy `#503E` cancel sin movements Â· `#9632`/`#8C2F` sin restock
- Migration: `20260717140000_product_stock_restock_cancel_1.sql` Â· apply prod OK
- Doc: `docs/product-stock-restock-cancel-1-idempotent-cancel-restock-stock-movements.md`
- **PrÃ³xima:** deploy action wiring â†’ smoke UI cancel Â· opcional cleanup `#9632`

---

## Registro â€” PRODUCT-STOCK-DECREMENT-LEDGER-1 (2026-07-17)

**PRODUCT-STOCK-DECREMENT-LEDGER-1 â€” Record Order Decrement Movements in create_order** â†’ **PASS**.

- `create_order` inserta `stock_movements.order_decrement` por order_item tracked (misma TX)
- QA: `4ef1169a-â€¦` Doble Smash + Coca Â· Coca **4â†’3** Â· movement before=4 after=3 delta=-1
- Legacy `c9721e63-â€¦` ClÃ¡sica Â· 0 movements Â· #9632 sin backfill
- Migration: `20260717130000_product_stock_decrement_ledger_1.sql`
- Doc: `docs/product-stock-decrement-ledger-1-record-order-decrement-movements-create-order.md`
- **PrÃ³xima:** PRODUCT-STOCK-RESTOCK-CANCEL-1

---

## Registro â€” PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 (2026-07-16)

**PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 â€” Stock Movements Ledger & Idempotency Schema** â†’ **PASS**.

- Tabla `public.stock_movements` + constraints (tipo, signo, math, nonneg, order context)
- Unique parciales: un `order_decrement` / un `order_restock` por `order_item_id`
- RLS SELECT tenant + super_admin; sin writes client
- Apply prod vÃ­a `apply_migration` Â· tabla vacÃ­a Â· Coca stock=4 intacto
- Types: `types/database.ts`
- Doc: `docs/product-stock-movements-schema-1-stock-movements-ledger-idempotency-schema.md`
- **PrÃ³xima:** PRODUCT-STOCK-DECREMENT-LEDGER-1

---

## Registro â€” PRODUCT-STOCK-RESTOCK-DESIGN-1 (2026-07-16)

**PRODUCT-STOCK-RESTOCK-DESIGN-1 â€” Cancel Restock Contract & Idempotency** â†’ **PASS**.

- Cancel debe restockear solo stock previamente descontado (`track_stock` + evidencia ledger)
- Transiciones V1: pending/preparing/ready â†’ cancelled; **no** completedâ†’cancelled automÃ¡tico
- RecomendaciÃ³n: `stock_movements` con unique `(order_item_id, movement_type)` antes de tocar cancel
- HistÃ³ricos (#8C2F) y QA pending (#9632 / legacy) sin restock retroactivo en esta fase
- `updateOrderStatusAction` auditado: solo status + event; sin stock hoy
- Doc: `docs/product-stock-restock-design-1-cancel-restock-contract-idempotency.md`
- **PrÃ³xima:** PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 â†’ DECREMENT-LEDGER-1 â†’ RESTOCK-CANCEL-1

---

## Registro â€” PRODUCT-STOCK-DECREMENT-ORDER-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-ORDER-1 â€” Transactional Stock Consumption in create_order** â†’ **PASS**.

- `create_order` valida/descuenta stock solo si `track_stock=true` (FOR UPDATE + demanda agregada product/upsell)
- Legacy `track_stock=false` intacto (ClÃ¡sica stock=0 vendible, sin descuento)
- QA tracked: order `f34118c6-â€¦` Doble Smash + Coca upsell Â· Coca **5â†’4** Â· total 15500
- QA insufficient: qty 99 â†’ `INSUFFICIENT_STOCK`, sin order, Coca sigue 4
- Migration: `20260717010500_product_stock_decrement_order_1.sql` Â· error map checkout/admin
- Restock cancel **fuera de scope**
- Doc: `docs/product-stock-decrement-order-1-transactional-stock-consumption-create-order.md`
- **PrÃ³xima:** PRODUCT-STOCK-RESTOCK-CANCEL-1 / STOCK-MOVEMENTS

---

## Registro â€” PRODUCT-STOCK-ADMIN-UX-1 (2026-07-16)

**PRODUCT-STOCK-ADMIN-UX-1 â€” Stock Tracking Controls in Product Admin** â†’ **PASS**.

- Create/edit product: switch **Controlar stock automÃ¡ticamente** â†’ `products.track_stock`
- Actions create/update persisten boolean; default false; Disponible/stock intactos
- QA: Coca Cola 500ml â†’ `track_stock=true` (stock 5 / available / price 3000 sin cambio)
- Legacy intacto: `create_order` sin tocar; sin decremento runtime
- Doc: `docs/product-stock-admin-ux-1-stock-tracking-controls-product-admin.md`
- **PrÃ³xima:** PRODUCT-STOCK-DECREMENT-ORDER-1

---

## Registro â€” PRODUCT-STOCK-TRACKING-SCHEMA-1 (2026-07-16)

**PRODUCT-STOCK-TRACKING-SCHEMA-1 â€” Add Product Stock Tracking Flag** â†’ **PASS**.

- Columna `products.track_stock boolean NOT NULL DEFAULT false`
- Migration: `20260716224005_product_stock_tracking_schema_1.sql` Â· aplicada en prod
- 17 productos existentes con `track_stock=false` Â· legacy intacto
- Tipos: `types/database.ts` actualizado Â· create_order/UI sin cambios
- Doc: `docs/product-stock-tracking-schema-1-add-product-track-stock-flag.md`
- **PrÃ³xima:** PRODUCT-STOCK-ADMIN-UX-1

---

## Registro â€” PRODUCT-STOCK-DECREMENT-DESIGN-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-DESIGN-1 â€” Inventory Consumption Contract** â†’ **PASS**.

- Contrato hÃ­brido: `track_stock` default **false**
- Tracking ON â†’ validar + descontar en `create_order` (product + upsell), FOR UPDATE
- Restock en cancel â†’ fase posterior (ledger/idempotencia)
- Legacy `stock=0`+available intacto; opciones/customizations no inventarian en V1
- Doc: `docs/product-stock-decrement-design-1-inventory-consumption-contract.md`
- **PrÃ³xima:** PRODUCT-STOCK-TRACKING-SCHEMA-1

---

## Registro â€” PRODUCT-STOCK-DECREMENT-AUDIT-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-AUDIT-1 â€” Order Stock Consumption For Product/Upsell Items** â†’ **PASS WITH DEBT**.

- Read-only: `create_order` **no** toca `products.stock` (ni parent ni upsell); solo valida `is_available`
- Trigger `tr_auto_suspend_out_of_stock` solo en INSERT/UPDATE OF stock â†’ availability
- CancelaciÃ³n (`updateOrderStatusAction`) no restaura stock
- Evidencia `#8C2F` / Coca Cola: stock 5â†’5; catÃ¡logo vive con stock=0 + available=true
- HipÃ³tesis: **H1** (stock = control manual de disponibilidad)
- Doc: `docs/product-stock-decrement-audit-1-order-stock-consumption-product-upsell-items.md`
- **PrÃ³xima:** PRODUCT-STOCK-DECREMENT-DESIGN-1 (polÃ­tica + create_order)

---

## Registro â€” Product Customization QA-ORDER-CLEANUP-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-QA-ORDER-CLEANUP-1 â€” Cancel QA Orders Safely** â†’ **PASS WITH DEBT**.

- Pedido `#8C2F` (`30c1b498-â€¦`) cancelado vÃ­a UI admin (`updateOrderStatusAction` â†’ `cancelled`)
- Items/snapshot/upsell intactos Â· total `$15750` Â· Pendientes limpio Â· lane Cancelados
- Flags/sesiÃ³n intactos Â· stock Coca Cola sin cambio (sigue 5)
- Doc: `docs/product-customization-qa-order-cleanup-1-cancel-qa-orders-safely.md`

---

## Registro â€” Product Customization PLUS-BEBIDAS-QA-1 Retry (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 â€” Retry / Real Order Snapshot & Dashboard Validation** â†’ **PASS WITH DEBT**.

- Pedido UI: `#8C2F` (`30c1b498-â€¦`) QA Plus Bebidas Retry Â· `$15750` Â· pending Â· pickup
- Parent Doble Smash `item_kind=product` + snapshot v1 (Papas chicas + Salsa Big Mac)
- Child Coca Cola `item_kind=upsell` + `parent_order_item_id` correcto Â· `$3000`
- Total SQL coincide Â· dashboard detalle sin JSON raw
- Deuda: stock Coca Cola no decrementa (sigue 5) Â· pedido QA queda pending
- Doc: `docs/product-customization-plus-bebidas-qa-1-retry-real-order-snapshot-dashboard-validation.md`

---

## Registro â€” Product Customization PLUS-BEBIDAS-AVAILABILITY-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-AVAILABILITY-1 â€” Reactivate Beverage Product for Upsell QA** â†’ **PASS WITH DEBT**.

- Audit: `products.stock` + trigger `tr_auto_suspend_out_of_stock` (`stock<=0` â†’ `is_available=false`)
- Al auditar, Coca Cola ya estaba `is_available=true` / `stock=5` (reactivada entre QA-1 y esta fase) â†’ **sin write SQL**
- Browser: Plus â€œTambiÃ©n podÃ©s sumarâ€ + Coca Cola Â· cart V2 padre+bebida Â· checkout pre-submit PASS
- Pedido QA **no creado**
- Doc: `docs/product-customization-plus-bebidas-availability-1-reactivate-beverage-product-for-upsell-qa.md`
- **PrÃ³xima:** PLUS-BEBIDAS-QA-1 Retry (pedido real)

---

## Registro â€” Product Customization PLUS-BEBIDAS-QA-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 â€” Real Order Snapshot & Dashboard Validation** â†’ **BLOCKED**.

- Auth de crear pedido presente, pero **Coca Cola 500ml** estÃ¡ `is_available=false`
- Public Plus filtra productos disponibles â†’ modal sin â€œTambiÃ©n podÃ©s sumarâ€
- **No se creÃ³ pedido** (no se reactivÃ³ producto: fuera de scope)
- Live: customization/on_demand/session intactos
- Doc: `docs/product-customization-plus-bebidas-qa-1-real-order-snapshot-dashboard-validation.md`
- **PrÃ³xima:** reactivar Coca Cola (auth) + retry QA order

---

## Registro â€” PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 (2026-07-16)

**PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 â€” Client-Safe Image Upload ID Fallback** â†’ **PASS WITH DEBT**.

- Crash `crypto.randomUUID is not a function` en crop/upload (LAN/HTTP) corregido
- Helper: `lib/client/safe-random-id.ts` â†’ usado en create/edit product + public assets
- CLI: `tsc`/`build` PASS Â· smoke helper fallback PASS Â· QA LAN fÃ­sica pendiente
- Doc: `docs/product-image-randomuuid-hotfix-1-client-safe-image-upload-id-fallback.md`

---

## Registro â€” Product Customization PLUS-BEBIDAS-2 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-2 â€” Create Beverage Products & Enable Upsell** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Writes: categorÃ­a **Bebidas** Â· producto **Coca Cola 500ml** `$3000` Â· upsell item en grupo Bebidas (target Doble Smash)
- Browser: modal Plus Â· cart V2 padre+bebida Â· checkout pre-submit PASS
- Deuda: mÃ¡s bebidas Â· upsell solo Doble Smash Â· sin pedido QA
- Doc: `docs/product-customization-plus-bebidas-2-create-beverage-products-enable-upsell.md`
- **PrÃ³xima:** QA order plus / ampliar targets / assignments / ADMIN-UX-2

---

## Registro â€” Product Customization PLUS-BEBIDAS-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-1 â€” Real Beverage Upsell Setup** â†’ **BLOCKED**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Hallazgo: upsell group **Bebidas** existe (`3ef90826-â€¦`, target Doble Smash) pero `upsell_group_items` vacÃ­o
- Bloqueo: **0 productos bebida** en `products` (Coca Cola histÃ³rica eliminada; order_items con `product_id=null`)
- Sin `AUTORIZO_CREATE_BEVERAGE_PRODUCTS` â†’ no writes
- Browser: modal OK sin secciÃ³n Plus; dashboard histÃ³ricos OK
- Doc: `docs/product-customization-plus-bebidas-1-real-beverage-upsell-setup.md`
- **PrÃ³xima:** crear productos bebida + poblar items (retry/PLUS-BEBIDAS-2)

---

## Registro â€” Product Customization GROUP-DESCRIPTIONS-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-GROUP-DESCRIPTIONS-1 â€” Customer-Facing Group Description Polish** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Writes: descriptions Papas / Salsas / Agregados extra alineadas al copy comercial
- Browser: modal muestra descriptions nuevas; cart/checkout usan nombres de grupo; histÃ³ricos (`#7D0A`) intactos
- Deuda: Plus Bebidas vacÃ­o Â· assignments limitados Â· sin pedido QA nuevo
- Doc: `docs/product-customization-group-descriptions-1-customer-facing-descriptions.md`
- **PrÃ³xima:** poblar Plus / expandir assignments / ADMIN-UX-2 / OPTION-IMAGES-1

---

## Registro â€” Product Customization GROUP-NAMING-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-GROUP-NAMING-1 â€” Customer-Facing Group Naming Polish** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Writes: `Aderezos`â†’**Salsas** Â· `Extras`â†’**Agregados extra** Â· Papas sin cambios
- Browser: modal/cart/checkout muestran nombres nuevos; histÃ³ricos (`#7D0A`) conservan snapshot viejo
- Deuda: descriptions de grupo aÃºn â€œaderezos/extrasâ€ Â· Plus Bebidas vacÃ­o Â· assignments limitados
- Doc: `docs/product-customization-group-naming-1-customer-facing-group-names.md`
- **PrÃ³xima:** descriptions polish / poblar Plus / expandir assignments / ADMIN-UX-2

---

## Registro â€” Product Customization REAL-CONFIG-POLISH-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-REAL-CONFIG-POLISH-1 â€” Owner Config Copy & Commercial Cleanup** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Writes: `Chedar`â†’**Cheddar** Â· `Big Mac`â†’**Salsa Big Mac** Â· hero/public copy sin â€œQAâ€
- No renombres de grupos / precios / upsell / pedido nuevo
- Browser: catÃ¡logo/modal/cart/checkout pre-submit PASS con nombres nuevos
- Dashboard: histÃ³ricos (`#7D0A`) conservan snapshot viejo (esperado)
- Deuda: Plus Bebidas sin items Â· Aderezos/Extras naming opcional Â· assignments limitados Â· imÃ¡genes
- Doc: `docs/product-customization-real-config-polish-1-owner-config-copy-commercial-cleanup.md`
- **PrÃ³xima:** poblar Plus / decidir group naming / expandir assignments / ADMIN-UX-2

---

## Registro â€” Product Customization PILOT-MONITOR-1 (2026-07-15)

**PRODUCT-CUSTOMIZATION-PILOT-MONITOR-1 â€” Live Pilot Monitoring & Real Config Readiness** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria`
- Estado live: `product_customization_enabled=true` Â· store session **open** Â· `on_demand_mode_active=true`
- Config activa: **Papas / Aderezos / Extras** (demo/comercial inicial; stamp QA ADMIN-2 ausente)
- Pedidos: `#213F` SQL PASS Â· `#7D0A` real Doble Smash snapshot v1 PASS Â· sin inconsistencias 48h
- Browser: catÃ¡logo/modal/cart V2/checkout pre-submit/dashboard PASS
- Deuda: copy (`Chedar`, `Big Mac`), hero pÃºblico â€œQAâ€, sin upsell Plus, assignments solo 2 productos
- Sin writes / sin rollback / sin cÃ³digo
- Doc: `docs/product-customization-pilot-monitor-1-live-pilot-monitoring-real-config-readiness.md`
- **PrÃ³xima:** owner polish copy/config â†’ opcional ADMIN-UX-2 / OPTION-IMAGES-1

---

## Registro â€” Product Customization ROLLOUT-PILOT-1 Modo C Retry 2 (2026-07-14 / 2026-07-15 UTC)

**PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 â€” Modo C Live Activation Retry 2** â†’ **PASS WITH DEBT â€” PILOT LIVE**.

- Tenant: `demohamburgueseria`
- Flag final: `product_customization_enabled=true` (activaciÃ³n `2026-07-14 23:00:16 UTC`)
- Gate operativo: store session **open** + `on_demand_mode_active=true`
- Config final: QA customization **active** (autorizaciÃ³n leave-on)
- Pedido QA live retry 2: `#213F` / `d5573074-8c14-4fa1-af5f-6e3a2209213f` â€” BBQ+Plus+Coca `$16.750`
- SQL parent snapshot v1 + upsell child `parent_order_item_id`: **PASS**
- Dashboard summary + badge Plus: **PASS**
- Rollback SQL: documentado, **no ejecutado**
- Deuda menor: sticky cart CTA en automation (navegaciÃ³n directa a `/checkout`); dedup cart no smokeado
- Doc: `docs/product-customization-rollout-pilot-1-controlled-tenant-rollout.md`
- **PrÃ³xima:** monitoreo piloto / config real owner / ADMIN-UX-2 polish

---

## Registro â€” LIVE-OPS-GATE-1 (2026-07-14)

**LIVE-OPS-GATE-1 â€” Store Session / On-Demand Acceptance Reconciliation** â†’ **PASS**.

- ReconciliaciÃ³n: open/close admin deja `store_sessions` y `on_demand_mode_active` alineados (SQL smoke PASS).
- Gate pÃºblico + `create_order`: pedido legacy UI `1ef8a30a-â€¦` (QA Live Ops Gate) **PASS** â€” sin rechazo por negocio cerrado.
- Product Customization **no** modificado; flag off.
- Estado recomendado para Modo C Retry 2:
  - session **open** (`a01252b0-â€¦`)
  - `on_demand_mode_active=true`
  - `product_customization_enabled=false`
  - QA customization soft-disabled
- Doc: `docs/live-ops-gate-1-store-session-on-demand-reconciliation.md`
- **Cerrado por:** Modo C Live Activation Retry 2 â†’ **PASS WITH DEBT â€” PILOT LIVE**

---

## Registro â€” Product Customization ROLLOUT-PILOT-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 â€” Modo C Live Activation Retry** â†’ **ROLLBACK EXECUTED**.

- Tenant: `demohamburgueseria`
- Flag final: **false** (rollback `16:08:29 UTC`; activaciÃ³n previa `15:21:41 UTC`)
- Config final: QA soft-disabled
- Causa: checkout submit rechazado â€” UI/sesiÃ³n `open` pero RPC `create_order` exige `on_demand_mode_active=true` (columna seguÃ­a **false**; desync ops)
- CatÃ¡logo/modal/cart V2 flag-on: PASS ($16.750 BBQ+Plus+Coca); pedido live retry: **no creado**
- Modo A: PASS READINESS Â· Modo B: PASS WITH FLAG OFF (`#8C9E`) Â· Modo C #1: ROLLBACK EXECUTED
- Doc: `docs/product-customization-rollout-pilot-1-controlled-tenant-rollout.md`
- **PrÃ³xima:** abrir sesiÃ³n vÃ­a admin (sync on-demand) â†’ verificar **ambos** gates â†’ re-intentar Modo C leave-ON

---

## Registro â€” Product Customization CHECKOUT-UI-SMOKE-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1** â†’ **PASS WITH DEBT**.

- Primer pedido V2 desde **checkout UI real** (no RPC): `#5C7C` / `3b9f87a2-â€¦`
- Flujo validado: catÃ¡logo â†’ modal â†’ cart V2 â†’ checkout â†’ server action â†’ `create_order` â†’ SQL snapshot/upsell child â†’ dashboard
- SQL: parent snapshot v1 `unit_price=13750` + upsell Coca Cola `parent_order_item_id` OK
- Cleanup: flag **false**; datos QA soft-disabled
- Deuda menor: dedup cart / config distinta no probados; automatizaciÃ³n browser frÃ¡gil
- Doc: `docs/product-customization-checkout-ui-smoke-1-browser-checkout-validation.md`
- **Deudas P1 D1/D2 cerradas.** V1 listo para rollout pilot controlado.
- **PrÃ³xima recomendada:** rollout pilot por tenant **o** ADMIN-UX-2 (polish)

---

## Registro â€” Product Customization ADMIN-UX-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ADMIN-UX-1** â†’ **PASS WITH DEBT**.

- Shell owner-friendly en `/admin/products/customizations`: tabs Por producto (default) / Por categorÃ­a / Secciones reutilizables / Plus sugeridos
- Layout product-first 3 zonas + preview placeholder; copy de negocio; actions/DnD intactos
- Sin DB/RPC/cart/checkout/catÃ¡logo/dashboard; flag no activado
- Doc: `docs/product-customization-admin-ux-1-owner-friendly-builder-shell.md`
- Deuda: preview orientativo (sin overrides), formularios internos densos, mobile polish
- **PrÃ³xima recomendada:** `PRODUCT-CUSTOMIZATION-ADMIN-UX-2` (polish forms/preview) o rollout pilot V1

---

## Registro â€” Product Customization ADMIN-UX-SPEC-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ADMIN-UX-SPEC-1** â†’ **PASS**.

- Spec owner-friendly para `/admin/products/customizations` (product-first, lenguaje de negocio, preview, venta sugerida)
- Sin implementaciÃ³n UI/cÃ³digo/DB; capa UX sobre modelo V1 existente
- Doc: `docs/product-customization-admin-ux-spec-1-owner-friendly-builder.md`
- **Implementada parcialmente por:** `PRODUCT-CUSTOMIZATION-ADMIN-UX-1`
- V1 funcional PASS WITH DEBT (flag off; CHECKOUT-UI-SMOKE-1 cerrÃ³ D1/D2)

---

## MÃ³dulo â€” Product Customization V1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-V1-HANDOFF-1** â†’ **PASS WITH DEBT** (V1 cerrado).

- Handoff: `docs/product-customization-v1-final-handoff.md`
- Flag `demohamburgueseria`: **off** (default fail-closed)
- Evidencia runtime: pedido V2 `#8E6F` / `d3e5c903-â€¦` (SQL + dashboard)
- Deudas P1 D1/D2: **cerradas** por CHECKOUT-UI-SMOKE-1 (pedido `#5C7C` desde UI)
- Deuda menor: dedup cart / browser automation polish
- **No hay fase funcional activa** hasta rollout pilot o roadmap V1.1
- PrÃ³xima recomendada: **rollout pilot controlado** por tenant

---

## Registro â€” Product Customization E2E-QA-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-E2E-QA-1** â†’ **PASS WITH DEBT**.

- Flag-on temporal + datos QA reactivados; pedido V2 real `d3e5c903-â€¦` (#8E6F)
- SQL: parent snapshot v1 `unit_price=13750` + upsell child Coca Cola con `parent_order_item_id`
- Dashboard: summary + Plus indentado; legacy `#2C00` intacto
- Cleanup: flag **false**; QA data soft-disabled
- Deuda: browser catÃ¡logoâ†’checkout UI no cerrado (pedido vÃ­a RPC autorizado)
- Doc: `docs/product-customization-e2e-qa-1-flag-on-full-runtime-smoke.md`
- PrÃ³xima: opcional UI checkout smoke, o handoff V1 / roadmap V1.1

---

## Registro â€” Product Customization DASHBOARD-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-DASHBOARD-1** â†’ **PASS WITH DEBT**.

- Parser/normalizer client-safe `order-dashboard.ts` (snapshot v1 + Ã¡rbol parent/upsell)
- Panel Productos: summary debajo del parent; upsell indentado + badge Plus; orphan seguro
- Selects read-only incluyen `item_kind` / `parent_order_item_id` / `customization_snapshot`
- Legacy smoke: dashboard + workspace QA Legacy ORDER-1 se ven normales; sin JSON raw
- Flag sigue **off**; sin checkout/RPC/DB; `tsc` + `build` PASS
- Deuda: QA V2 real en dashboard pendiente (no hay pedido V2 persistido)
- Doc: `docs/product-customization-dashboard-1-render-snapshot-upsell-children.md`
- PrÃ³xima: cerrar ORDER-1 V2 assert **o** QA dashboard V2 cuando exista dato

---

## Registro â€” Product Customization ORDER-1-DB-APPLY-QA (2026-07-13)

**PRODUCT-CUSTOMIZATION-ORDER-1-DB-APPLY-QA** â†’ **PASS WITH DEBT** (cleanup cerrado).

- RPC `create_order` ORDER-1 aplicada en `pkrsedmwxekbhlohhqds` (MCP directed; no mass `db push`)
- Markers post-apply OK; legacy order QA PASS
- Flag-on temporal + catÃ¡logo â€œDesdeâ€ + modal + cart V2 jerÃ¡rquico PASS
- Cleanup `AUTORIZO_FLAG_OFF_CLEANUP=yes`: flag demo **false**; grupo/options/assignments/upsell QA soft-disabled
- Deuda restante: QA 4â€“5 pedido V2 persistido + SQL assert
- Doc: `docs/product-customization-order-1-db-apply-qa-runtime-smoke.md`
- PrÃ³xima: **DASHBOARD-1**

---

## Registro â€” Product Customization ORDER-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-ORDER-1** â†’ **PASS WITH DEBT**.

- ValidaciÃ³n server-side + snapshot v1; checkout V2 desbloqueado
- MigraciÃ³n `create_order` con parents/upsell/`customization_snapshot` (backward-compatible)
- Flag sigue **off**; sin `db push` remoto; sin dashboard UI
- `tsc` + `build` PASS
- Deuda: migraciÃ³n no aplicada en remoto; flag-on/SQL QA pendientes
- Doc: `docs/product-customization-order-1-rpc-server-validation-snapshot.md`
- PrÃ³xima: apply autorizado + **DASHBOARD-1**

---

## Registro â€” Product Customization CART-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-CART-1** â†’ **PASS WITH DEBT**.

- `LocalCartItemV2` + signature dedup; storage dual legacy/v2
- Modal confirma â†’ carrito; cart sheet jerÃ¡rquico; edit/remove parent/upsell
- Checkout guard client-side (no `create_order`/RPC/actions server)
- Flag sigue **off**; `tsc` + `build` PASS
- Doc: `docs/product-customization-cart-1-cart-signature-pricing-display.md`
- Deuda: browser QA flag-on pendiente de autorizaciÃ³n
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ORDER-1**

---

## Registro â€” Product Customization CATALOG-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-CATALOG-1** â†’ **PASS WITH DEBT**.

- Read model pÃºblico (`lib/product-customization/public.ts` + `public-shared.ts`)
- Summaries / â€œDesde $Xâ€, intercept add-to-cart, modal lazy + total visual + upsell
- CTA â€œContinuarâ€ = seam CART-1 (no escribe carrito legacy ni checkout)
- Flag sigue **off**; sin migraciones/dashboard/`create_order`/cart schema
- Doc: `docs/product-customization-catalog-1-public-customization-modal.md`
- Deuda: browser QA con flag on pendiente de autorizaciÃ³n
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-CART-1**

---

## Registro â€” Product Customization ADMIN-DND-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-DND-1** â†’ **PASS WITH DEBT**.

- DnD nativo + â†‘/â†“ para grupos, opciones (intra-grupo) y assignments (intra-target)
- Actions: `reorderCustomizationGroups/Options/AssignmentsAction`; `sort_order` 10/20/30â€¦
- Sin dependencia DnD nueva; flag off; sin pÃºblico/DB/deploy
- `tsc` + `build` PASS
- Deuda: touch HTML5 DnD; keyboard ARIA avanzado; upsell items fuera de scope; atomicidad sin RPC
- Doc: `docs/product-customization-admin-dnd-1-sortable-groups-options.md`
- PrÃ³xima: **PUBLIC-1** (detrÃ¡s del flag) o DND-2 upsell items

---

## Registro â€” Product Customization ADMIN-2-QA (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-2-QA** â†’ **PASS WITH DEBT**.

- Smoke browser autenticado en `localhost:3000` (owner La BurguesÃ­a)
- Assignments categorÃ­a/producto, overrides restore, upsell + regla 1/target: PASS
- Flag sigue **off**; catÃ¡logo/dashboard sin UI customization
- Datos QA `20260712-1726` soft-desactivados; overrides restaurados
- Doc: `docs/product-customization-admin-2-qa-authenticated-browser-smoke.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-PUBLIC-1** (detrÃ¡s del flag; sin activar aÃºn)

---

## Registro â€” Product Customization ADMIN-2 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-2** â†’ **PASS WITH DEBT**.

- Extiende `/admin/products/customizations`: assignments, upsell, herencia
- Panel overrides en edit product (disable/restore grupo y opciÃ³n)
- Flag sigue **off**; sin catÃ¡logo/carrito/checkout/dashboard/`create_order`
- `tsc` PASS; build verificado en fase; sin deploy
- Deuda: unique upsell = 1 fila/target (no solo 1 activo); smoke autenticado â†’ ver ADMIN-2-QA
- Doc: `docs/product-customization-admin-2-assignments-overrides-upsell.md`
- PrÃ³xima: conectar pÃºblico detrÃ¡s del flag (**PUBLIC-1**) cuando se autorice

---

## Registro â€” Product Customization ADMIN-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-1** â†’ **PASS WITH DEBT**.

- Ruta: `/admin/products/customizations` (CRUD grupos + opciones)
- Flag sigue **off**; aviso preparatorio visible
- Link desde header Productos: â€œOpcionales y extrasâ€
- `tsc` + `build` PASS; sin deploy
- Deuda: smoke CRUD autenticado pendiente (redirect login verificado)
- Doc: `docs/product-customization-admin-1-groups-options-admin.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ADMIN-2** (assignments / overrides / upsell)

---

## Registro â€” Product Customization DB-APPLY-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-DB-APPLY-1** â†’ **PASS WITH DEBT** (producciÃ³n autorizada; sin staging).

- Project ref: `pkrsedmwxekbhlohhqds` (OrderOps) â€” autorizado por usuario
- Schema customization **ya presente** en remoto; smoke PASS; `enabled_count = 0`
- `db push` **no** re-ejecutado (falta `supabase_migrations.schema_migrations` â€” riesgo de reaplicar historial)
- App smoke flag off PASS (`orderops.vercel.app`)
- Doc: `docs/product-customization-db-apply-1-staging-migration-schema-smoke.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ADMIN-1**

---

## Registro â€” Product Customization FLAG-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-FLAG-1** completada (helper server-only; sin UI ni activaciÃ³n).

- Helper: `lib/product-customization/flags.ts` â†’ `isProductCustomizationEnabled(businessId)`
- Fail-closed; service client; flag sigue default **off**
- Doc: `docs/product-customization-flag-1-tenant-rollout-guard.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ADMIN-1** (tras aplicar DB-1 en staging)

---

## Registro â€” Product Customization DB-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-DB-1** completada (schema/RLS/types; sin UI ni RPC).

- MigraciÃ³n: `supabase/migrations/20260712090000_product_customization_v1_schema.sql`
- Flag: `business_settings.product_customization_enabled` default **false**
- Doc: `docs/product-customization-db-1-schema-rls-types.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ADMIN-1** (o aplicar migraciÃ³n en staging)

---

## Registro QA ProducciÃ³n â€” Orders Flow (2026-07-09)

**ORDERS-FLOW-QA-1** ejecutado en `https://orderops.vercel.app`. Resultado: **PASS WITH DEBT**.

- Dashboard operativo, pedido manual #A323, tomar pedido y transiciones hasta Completado: **PASS**
- Realtime single-tab (apariciÃ³n + cambio de lane): **PASS**
- Checkout pÃºblico E2E y multi-tab realtime: **NOT TESTED**
- Doc: `docs/orders-flow-qa-1-production-smoke.md`

---

## 1. MÃ³dulo en Desarrollo Activo

### Pantalla / Componente Principal

**Dashboard Principal Operacional (Orders Dashboard / Workflow Lanes Engine)**

Este mÃ³dulo representa el centro operacional del sistema y concentra:

* gestiÃ³n de pedidos en tiempo real;
* lanes dinÃ¡micas por workflow;
* ownership colaborativo;
* snapshots operacionales;
* mÃ©tricas compactas;
* sesiones vivas;
* scanning operacional;
* insights automÃ¡ticos;
* actividad reciente.

### Funcionalidad Actualmente Bajo IteraciÃ³n

La fase actual estÃ¡ enfocada en estabilizar la ejecuciÃ³n operacional multioperador sobre estados vivos.

Flujo operativo principal:

```text
Pending
   â†“
Preparing
   â†“
Ready
   â†“
Completed

Cualquier estado:
â†’ Cancelled
```

Objetivos funcionales activos:

* sincronizaciÃ³n visual consistente entre operadores simultÃ¡neos;
* evitar desincronizaciÃ³n entre pestaÃ±as;
* convergencia rÃ¡pida entre estado optimista y estado persistido;
* preservar ownership y contexto operacional;
* reducir fricciÃ³n visual durante cambios de estado.

### TecnologÃ­as Involucradas

Frontend:

* Next.js App Router
* React
* TypeScript
* Component Architecture
* Client Components + Hooks

Backend:

* Supabase Postgres
* Supabase Realtime Channels
* Supabase Presence
* Supabase Auth
* Supabase RLS

Estado / Render:

* useMemo
* useEffect
* optimistic state updates
* defensive hydration
* realtime reconciliation

Estilos:

* CSS componentizado
* Mobile-first
* Dashboard styles altamente especializados

Archivos de alta criticidad:

```text
components/admin/orders/admin-dashboard-orders.tsx
components/admin/orders-admin.css
components/admin/admin-shell.css
app/admin/(protected)/dashboard/page.tsx
```

---

## 2. LÃ³gica Visual e Iteraciones en Curso

### Objetivo Visual Actual

Prioridad absoluta:

```text
Estabilidad operacional > fidelidad visual
```

El dashboard debe permanecer estable bajo:

* scroll continuo;
* actualizaciones realtime;
* sesiones largas;
* mÃºltiples operadores;
* dispositivos Android modestos.

### Trabajo Visual Activo

### Dashboard Mobile-First

Se estÃ¡ iterando sobre:

* cards operacionales;
* overview superior;
* snapshots KPI;
* compactaciÃ³n visual;
* spacing adaptativo;
* densidad informativa.

### Empty States Operacionales

Estados vacÃ­os actualmente optimizados para:

* jornada sin pedidos;
* sesiÃ³n cerrada;
* panel en escucha;
* ausencia de actividad;
* filtros sin resultados.

### Renderer Mobile Alternativo

Actualmente existe una bifurcaciÃ³n controlada:

```text
Desktop Overview
â†“
Renderer histÃ³rico intacto

Mobile Overview
â†“
Renderer simplificado y separado
```

MotivaciÃ³n:

* reducir complejidad de render;
* desacoplar mobile del overview histÃ³rico;
* aislar bugs especÃ­ficos de Chrome Android.

### PreparaciÃ³n Future-Proof

El sistema visual sigue preparÃ¡ndose para:

* Dark Theme
* Kitchen Mode
* Delivery Mode
* Role-specific layouts
* visual tokens reutilizables

### Hallazgo CrÃ­tico Visual Actual

Existe un bug de render altamente especÃ­fico:

```text
Chrome Android
âœ“ reproduce bug

Opera Mini
âœ— NO reproduce bug

Desktop
âœ— NO reproduce bug
```

Esto indica:

```text
problema probablemente asociado a:
GPU compositor
rasterization path
viewport rendering
Chrome Android rendering pipeline
```

No existe evidencia fuerte de:

* problema de lÃ³gica;
* problema de datos;
* problema de realtime;
* problema de CSS chunking actual.

---

## 3. Estado de la SincronizaciÃ³n y Realtime (Bloqueo Actual)

### Estado Actual del Realtime

El realtime ya opera sobre:

* channels de Supabase;
* hydration defensiva;
* presencia;
* reconciliaciÃ³n;
* optimistic updates.

### Problema HistÃ³rico Detectado

Hubo evidencia previa de:

* pestaÃ±as que perdÃ­an convergencia;
* operadores viendo sesiones desactualizadas;
* dashboards sin refresco automÃ¡tico;
* dependencia excesiva del refresh manual.

### Estrategia Actual de ReconciliaciÃ³n

PatrÃ³n implementado:

```text
Realtime Event
      â†“
Patch optimista
      â†“
Hydration defensiva
      â†“
Re-fetch / reconcile
      â†“
Estado convergente
```

### Riesgos Actuales

Problemas que todavÃ­a deben vigilarse:

* duplicated optimistic patches;
* stale closures en hooks;
* race conditions entre realtime y hydration;
* order snapshots incompletos;
* payloads parciales.

### Optimistic UX

Objetivo:

```text
feedback inmediato
+
consistencia eventual
```

Reglas:

* la UI responde instantÃ¡neamente;
* el backend sigue siendo la fuente de verdad;
* los fallos deben reconciliarse automÃ¡ticamente.

### Cadena de DerivaciÃ³n Esperada

```text
orders
â†“
hydratedOrders
â†“
optimisticOrders
â†“
windowScopedOrders
â†“
filteredOrders
â†“
lanes
metrics
insights
activity
```

Toda derivaciÃ³n debe depender de la misma fuente.

---

## 4. Bloqueo Activo Actual (Highest Priority)

### Problema Principal

Bug visual severo en:

```text
Chrome Android
Moto G13
```

SÃ­ntomas:

* bandas horizontales;
* ghost rendering;
* cards duplicadas visualmente;
* corrupciÃ³n parcial del viewport;
* repaint inconsistente;
* artefactos durante scroll.

### HipÃ³tesis Ya Descartadas

Descartado o debilitado:

* CSS chunk corruption;
* HMR parcial;
* translateZ hacks;
* forced layer promotion;
* nested grid overview;
* overview histÃ³rico;
* rgba/shadows;
* 100dvh;
* layout mobile previo;
* GPU promotion manual;
* overview renderer antiguo.

### HipÃ³tesis MÃ¡s Fuertes Ahora

```text
1. Chrome Android raster pipeline
2. compositor GPU especÃ­fico
3. assets / imÃ¡genes / SVG
4. primitives visuales globales
5. bug especÃ­fico del device GPU path
```

### Regla Importante

NO seguir haciendo microfixes aislados.

Usar:

```text
aislamiento binario
```

---

## 5. Tareas Pendientes Inmediatas (Next Steps para Cursor)

### Paso 1 â€” Resolver DesincronizaciÃ³n / Convergencia

Auditar:

* hooks realtime;
* subscriptions duplicadas;
* stale references;
* hydration ordering.

Validar:

```text
multi-tab
multi-operator
network fluctuation
```

---

### Paso 2 â€” Estabilizar HidrataciÃ³n Inicial

Objetivos:

* eliminar CLS;
* reducir saltos visuales;
* evitar flashes de mÃ©tricas.

Revisar:

* loading boundaries;
* skeleton strategy;
* hydration sequence.

---

### Paso 3 â€” Fortalecer Tenant Isolation

Verificar:

```text
tenant_id
â†“
query
â†“
mutation
â†“
optimistic update
â†“
RLS
```

Ninguna mutaciÃ³n local debe ejecutarse sin contexto tenant.

---

### Paso 4 â€” Continuar InvestigaciÃ³n Chrome Android

NO hacer mÃ¡s tuning fino.

Hacer pruebas binarias:

```text
RF14A
quitar logos / imÃ¡genes

RF14B
quitar SVGs

RF14C
header mÃ­nimo

RF14D
render-test page incremental
```

Objetivo:

```text
aislar trigger exacto
```

---

## 6. Restricciones Actuales de Desarrollo

NO tocar sin necesidad:

* mÃ©tricas;
* lÃ³gica de pedidos;
* ownership;
* Supabase schema;
* workflow machine;
* RLS;
* realtime base.

Priorizar:

```text
estabilidad
consistencia
convergencia
```

por encima de:

```text
micro mejoras visuales
```

---

## 7. DefiniciÃ³n de Done para Esta Fase

La fase se considera cerrada cuando:

* realtime converge entre tabs;
* realtime converge entre operadores;
* hydration deja de producir estados inconsistentes;
* mobile Android Chrome deja de corromper render;
* dashboard mantiene estabilidad en sesiones largas;
* renderer mobile queda desacoplado y robusto;
* tenant isolation queda validado extremo a extremo.
