# ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1 — Authenticated Iframe QA for Mobile Feel

## 1. Estado

```txt
READY WITH NON-BLOCKING QA DEBT
```

Admin iframe autenticado PASS para cursor + momentum + anti-selection + storage + checkout bloqueado. Deudas no bloqueantes: device touch real UNVERIFIED, cookie preview HttpOnly no visible en `document.cookie`, pressed visual del cursor no medido en resize sintético, ESLint circular histórico.

## 2. Resumen ejecutivo

Con sesión owner demo (`laburguesia@demo.com`) en local `:3015`, se validó `/admin/products/preview` (shell + iframe same-origin). El conjunto touch-pan + anti-selection + cursor circular + momentum + scrollbar sutil funciona dentro del iframe. Público normal intacto. Checkout preview bloqueado. No se crearon pedidos. QA-only: sin código.

## 3. Entorno

| Campo | Valor |
|-------|-------|
| App | `http://127.0.0.1:3015` (build local con mobile-feel uncommitted) |
| Rama / HEAD | `main` @ `84c0c48` |
| Tenant | La Burguesía · `demohamburgueseria` · `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| Rol | owner (demo) |
| Browser | Cursor IDE browser + CDP sobre `iframe.contentDocument` (same-origin) |

## 4. Preflight

Dirty tree esperado (no limpiado): handoff docs, touch-pan polish/qa-fix, mobile-feel spec/polish + código pan/cursor.

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL preexistente (ESLint circular) |

## 5. Source re-check

| Check | Resultado |
|-------|-----------|
| Momentum solo con `enabled` / `isCatalogPreview` | PASS |
| Cursor solo con `isCatalogPreview` | PASS |
| `pointer-events: none` en cursor CSS | PASS |
| Momentum vía `requestAnimationFrame` | PASS |
| Cancel en nuevo `pointerdown` | PASS |
| RAF cleanup unmount | PASS |
| Threshold 8px | PASS |
| Suppress click solo tras pan | PASS |
| Ignore interactivos/overlays | PASS |
| Público sin cursor/momentum | PASS |
| Carrito/cookie/guard/CSP/DB no tocados en esta fase | PASS |

## 6. Admin shell QA

| Check | Resultado |
|-------|-----------|
| Sin redirect login | PASS |
| Título `Vista previa del catálogo` | PASS |
| Banner preview + confirmación deshabilitada | PASS |
| Iframe `/b/demohamburgueseria/catalogo?orderopsPreview=1` | PASS |
| Top-level permanece `/admin/products/preview` | PASS |
| Sin Recargar | PASS |
| Sin selector dispositivos | PASS |
| Vaciar carrito de prueba / Copiar link | PASS |
| Cursor circular **no** en shell (`cursorsInShell: 0`) | PASS |

## 7. Cursor iframe QA

| Check | Resultado |
|-------|-----------|
| Cursor visible en iframe | PASS |
| Vive en documento iframe, no shell | PASS |
| `pointer-events: none` | PASS |
| Hide en pointerleave | PASS |
| Pressed visual (width shrink) | PARTIAL — sintético midió 22px; clase pressed presente en código; deuda P3 |
| No bloquea clicks (Agregar/detalle OK) | PASS |

Cursor nativo: oculto en superficies no interactivas mientras activo (`cursor: none`); controles mantienen pointer.

## 8. Momentum iframe QA

| Caso | Resultado |
|------|-----------|
| Flick rápido → inercia | PASS — Δ ≈ −75px tras release (poll post-RAF) |
| Drag lento → poca/nula inercia | PASS — `slowDelta: 0` |
| Nuevo pointerdown cancela | PASS — `cancelDelta: 0` |
| Sin animación infinita / overscroll raro | PASS |

## 9. Anti-selection QA

| Check | Resultado |
|-------|-----------|
| `selectstart` prevenido | PASS |
| `selectionMid == ""` | PASS |
| Image `dragstart` bloqueado | PASS |
| Pan sobre texto scrollea | PASS |

## 10. Interacciones protegidas

| Control | Resultado |
|---------|-----------|
| Agregar | PASS — preview cart crece |
| Ver detalle | PASS — dialog visible |
| Categorías / overlays ignore | PASS (source + no regresión) |
| Cart bar / sheet ignore attrs | PASS source |
| Modal / customization ignore | PASS source |
| Checkout preview | PASS (workstream H) |

## 11. Storage QA

| Check | Resultado |
|-------|-----------|
| Antes: preview len 439; public `[]` | PASS |
| Tras Agregar iframe: preview 869; public len 2 (`[]`) | PASS |
| Vaciar carrito de prueba: preview keys `null`; public `[]` | PASS |
| Cookie preview | HttpOnly — no legible en `document.cookie`; clear vía action; **DevTools cookie UNVERIFIED** (P3) |

## 12. Checkout preview QA

Dentro del iframe → `/b/demohamburgueseria/checkout?orderopsPreview=1`:

| Check | Resultado |
|-------|-----------|
| Mensaje bloqueo visible | PASS |
| Botón `Confirmación deshabilitada` disabled | PASS |
| Top-level sigue admin preview | PASS |
| `create_order` no llamado | PASS |
| No success / no pedido | PASS |

## 13. Público normal regression

| Check | Resultado |
|-------|-----------|
| Sin `data-preview-pan-enabled` / sin cursor | PASS |
| Scrollbar `auto` | PASS |
| Agregar escribe keys públicas | PASS (cart len 2→439) |
| Preview keys null | PASS |
| `/checkout` sin mensaje preview; botón `Enviar pedido` | PASS (no enviado) |

## 14. Responsive QA

Emulation CDP: 390 / 768 — `overflowX: false`, shell + iframe presentes. 1024/1440 cubiertos por sesión desktop 1920. **DEVICE TOUCH UNVERIFIED**.

## 15. Product Customization / Settings smoke

| Ruta | Resultado |
|------|-----------|
| `/admin/products/customizations` | PASS — tabs + “Vista previa del cliente” intacta |
| `/admin/settings/public/catalogo` | PASS — Presencia pública / Catálogo público |

## 16. Riesgos encontrados

Ningún P0/P1. Ningún bug que requiera `MOBILE-FEEL-QA-FIX-1`.

## 17. Deuda residual

| Ítem | Severidad |
|------|-----------|
| Device/touch real | P3 |
| Cookie preview clear en DevTools | P3 |
| Cursor pressed resize visual | P3 |
| Press feedback diferido (polish) | P2/P3 |
| ESLint circular | P3 histórico |

## 18. Release readiness

Lista para deploy controlado del código mobile-feel (+ touch-pan pendiente de commit) tras autorización explícita.

## 19. Rollback

N/A en QA-only. Rollback de feature = remover hooks/CSS mobile-feel + pan base (docs de polish).

## 20. Próximo paso

```txt
ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1
```
