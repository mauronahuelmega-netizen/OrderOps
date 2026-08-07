# ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1 — Real Device Final QA for Admin Catalog Preview

## 1. Estado

**READY WITH DEVICE QA DEBT**

Fecha: 2026-07-28  
Branch: `main`  
HEAD local: `4dd5dce`  
Producción: https://orderops.vercel.app  
Layout live: `0dce5b3`  
Mobile-feel live: `5843fd9`

## 2. Resumen ejecutivo

QA-only en producción tras el deploy de layout final. Desktop smoke crítico PASS: admin preview carga con shell final, iframe, clear-cart, checkout bloqueado, público normal intacto, CSP `frame-ancestors 'self'`, Products / Customizations / Settings sin regresión, sin pedidos reales.

**Android Chrome real, Android PWA standalone e iOS Safari** no se ejecutaron en esta sesión (dispositivo no disponible en el entorno del agente). Quedan documentados como **UNVERIFIED — device unavailable** (P2 deuda de cobertura, no bug observado). El código de mobile-feel sigue gated a `pointerType === "mouse"`, lo que soporta el criterio de touch nativo, pero no sustituye evidencia en dispositivo real.

## 3. Entorno

| Campo | Valor |
|-------|-------|
| Branch | `main` |
| HEAD | `4dd5dce` — docs: record LAYOUT-FINAL-DEPLOY-1 |
| Layout commit | `0dce5b3` |
| Mobile-feel commit | `5843fd9` |
| Deploy URL | https://orderops.vercel.app |
| Tenant demo | `demohamburgueseria` / La Burguesía |
| Working tree | Dirty menor: `docs/admin-catalog-preview-mobile-feel-deploy-1.md`, `tsconfig.tsbuildinfo`, docs product-customization/stock untracked, `tmp/` |
| CLI | `npx tsc --noEmit` → PASS (exit 0) |
| Build / lint | No ejecutados (opcionales) |
| Agente | Cursor browser (desktop) + curl headers |
| Android / iOS | No disponibles en esta sesión |

No clean / stash / revert. No código, CSS, deploy, commit ni push.

## 4. Producción baseline

URL: `https://orderops.vercel.app/admin/products/preview`

| Check | Resultado |
|-------|-----------|
| Admin preview carga | PASS |
| Layout final live (header + phone + acciones) | PASS (DOM + screenshot left rail; iframe `388×702` @ x≈895) |
| Header alineado / phone centrado | PASS (medición previa deploy + iframe presente derecha) |
| Clear-cart visible | PASS — `Vaciar carrito de prueba` |
| Copiar link visible | PASS |
| Modo seguro visible | PASS |
| Checklist visible | PASS |
| Iframe catálogo | PASS — `/b/demohamburgueseria/catalogo?orderopsPreview=1` |
| Overflow X desktop | PASS — `scrollWidth === clientWidth` (1440) |

Público:

| URL | Resultado |
|-----|-----------|
| `/b/demohamburgueseria/catalogo` | PASS — sin mensaje preview; sin pan/cursor classes |
| `/b/demohamburgueseria/checkout` | PASS — botón **Enviar pedido**; sin bloqueo preview |

No se envió pedido.

## 5. Headers / CSP

```txt
curl.exe catalogo  → Content-Security-Policy: frame-ancestors 'self'  (200)
curl.exe checkout  → Content-Security-Policy: frame-ancestors 'self'  (200)
curl.exe preview   → Content-Security-Policy: frame-ancestors 'self'  (307 → /admin/login sin cookie curl)
```

| Check | Resultado |
|-------|-----------|
| `frame-ancestors 'self'` | PASS |
| `X-Frame-Options: DENY` | AUSENTE (OK) |
| `frame-ancestors *` | AUSENTE (OK) |

## 6. Android Chrome QA

**UNVERIFIED — device unavailable**

No hubo Android físico en esta sesión. Criterios C1–C5 no se midieron en touch real.

Código de soporte (no sustituye QA device):

- `use-preview-pointer-pan-scroll.ts`: pan solo si `event.pointerType === "mouse"`
- `use-preview-touch-cursor.ts`: cursor solo si `event.pointerType === "mouse"`

| Sub-check | Estado |
|-----------|--------|
| C1 Shell mobile | UNVERIFIED |
| C2 Touch nativo / sin cursor circular | UNVERIFIED |
| C3 Interacciones tap | UNVERIFIED |
| C4 Clear cart device | UNVERIFIED |
| C5 Checkout preview bloqueado device | UNVERIFIED |

## 7. Android PWA QA

**UNVERIFIED — device/time constraint**

PWA admin standalone no instalada ni probada en esta sesión. Scope `/admin` / manifest no tocados (QA-only).

## 8. iOS Safari QA

**UNVERIFIED — no device**

Sin iPhone/iPad disponible.

## 9. Público normal device QA

**Desktop / browser automation PASS; Android/iOS device UNVERIFIED**

Desktop top-level:

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| Sin preview mode | PASS |
| Sin cursor / pan custom | PASS (`hasCursorEl: false`, `hasPanClass: false`) |
| Cart público intacto tras clear preview | PASS (checkout público seguía con ítems; clear no vació público) |
| Checkout **Enviar pedido** | PASS |
| Pedido enviado | NO |

Device Android/iOS público: UNVERIFIED.

## 10. Desktop regression

| Check | Resultado |
|-------|-----------|
| `/admin/products/preview` layout final | PASS |
| Cursor / pan en iframe preview (mouse) | PASS — elemento cursor presente en preview iframe (esperado desktop) |
| Clear-cart | PASS — de `2 productos` → cart bar `0 productos$ 0,00`; top-level sigue `/admin/products/preview`; toast “Vaciando…” |
| Checkout preview bloqueado | PASS — mensaje *“La confirmación de pedidos está deshabilitada…”*; botón **Confirmación deshabilitada** `disabled`; URL iframe `…/checkout?orderopsPreview=1`; sin success |
| `/admin/products` | PASS — header Productos, tabla, CTAs *Vista previa* + *Copiar link* + *Nuevo producto* |

Anti-selection / momentum mouse: no re-medidos con PointerEvent sintético en esta fase (deuda P3 histórica aceptada).

## 11. Product Customization / Settings smoke

| URL | Resultado |
|-----|-----------|
| `/admin/products/customizations` | PASS — tabs, lista productos, *Vista previa del cliente* intacta |
| `/admin/settings/public/catalogo` | PASS — hero fields, estado presencia, sin error |

## 12. No-pedidos / seguridad

| Check | Resultado |
|-------|-----------|
| Pedido real creado | NO |
| Navegación a success desde preview | NO |
| `create_order` desde preview | NO observable (submit disabled) |
| Migraciones | NO |
| Comandos Supabase | NO |
| Commit / push / deploy | NO |

## 13. Hallazgos

1. **P2 — Device coverage gap:** Android Chrome / PWA / iOS no verificados en hardware real. No es un bug de producción observado; es deuda de evidencia.
2. **P3 — Clipboard success toast:** no re-probado en esta fase (deuda previa de automation).
3. **P3 — Momentum / press feedback:** automation flaky histórica; no bloquea.
4. **P3 — Lint ESLint circular:** histórico; no ejecutado aquí.
5. Clear-cart en desktop: toast de progreso visible; cart bar a 0; público no limpiado — PASS.
6. Preview iframe en desktop mantiene cursor circular (correcto para mouse-feel).

## 14. Deuda residual

| ID | Severidad | Descripción |
|----|-----------|-------------|
| D1 | P2 | Android Chrome real touch QA (C1–C5) |
| D2 | P2 | Android PWA admin standalone |
| D3 | P2 | iOS Safari / iOS PWA |
| D4 | P3 | Clipboard success toast en device |
| D5 | P3 | Momentum / press visual (automation) |
| D6 | P3 | ESLint circular histórico |
| D7 | P3 | Dirty local `docs/admin-catalog-preview-mobile-feel-deploy-1.md` / `tsconfig.tsbuildinfo` |

Ningún P1/BLOCKED observado en desktop producción.

## 15. Release readiness

**READY WITH DEVICE QA DEBT**

Criterios desktop/prod de aceptación (1–2 parcial, 9–20) PASS donde aplican a este entorno. Criterios 2–8 (Android touch) y device-specific quedan UNVERIFIED.

No se recomienda `READY FOR FINAL HANDOFF` hasta al menos un PASS Android Chrome real, salvo aceptación explícita de deuda P2 de cobertura.

Handoff documental de feature + mobile-feel sigue viable marcando device debt.

## 16. Rollback

No necesario. Fase QA/docs-only; sin cambios de código ni deploy.

## 17. Próximo paso

**ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1**

Alternativa si se prioriza cerrar evidencia hardware antes del handoff:

**ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-2** (Android Chrome real obligatorio; iOS/PWA deseable).

No aplica `FINAL-QA-FIX-1` (sin bug corregible bloqueante hallado).
