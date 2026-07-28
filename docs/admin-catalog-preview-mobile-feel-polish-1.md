# ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1 — Mobile Feel Implementation

## 1. Estado

**PASS WITH AUTH QA DEBT**

Public preview path confirma cursor circular, momentum vertical, scrollbar sutil y clicks/cart/modal OK. Admin iframe `/admin/products/preview` **UNVERIFIED** (sin sesión). Checkout browser smoke no re-corrido esta sesión (guard source intacto). Press feedback **diferido** (P2). Sin commit/push/deploy.

## 2. Resumen ejecutivo

Se implementó el polish mobile-feel sobre touch-pan: inercia vertical al soltar (RAF + friction), cursor circular tipo touch (`pointer-events: none`) y scrollbar más sutil, solo con `isCatalogPreview` + mouse. Público normal y touch nativo intactos. No se tocó carrito/cookie/checkout guard/CSP/DB.

## 3. Implementación

| Pieza | Archivo |
|-------|---------|
| Momentum | `use-preview-pointer-pan-scroll.ts` |
| Cursor | `use-preview-touch-cursor.ts` (hook separado) |
| CSS cursor/scrollbar | `catalog-preview-mobile-feel.module.css` |
| Wire | `catalog-client.tsx` — ambos hooks con `enabled: isCatalogPreview` |
| Pan base CSS | `catalog-preview-pan.module.css` (sin cambios funcionales mayores) |

## 4. Momentum

* Muestras de pointer (últimas ≤5 / ventana 100ms) durante pan activo.
* Al `pointerup` tras pan real: `velocityY` → RAF `scrollTop += v*dt`, `v *= 0.93`.
* Caps: min 0.15 / max 2.2 px/ms · stop 0.02 · max duration 900ms.
* Cancela en: nuevo `pointerdown` mouse, `pointercancel`, unmount, tope sin avance, umbrales.
* Race fix: `resetGesture` antes de `releasePointerCapture` para que `lostpointercapture` no mate la inercia.

## 5. Cursor circular

* Div fijo 22px, `pointer-events: none`, sigue mouse dentro de `<main>`.
* Pressed: escala/opacidad menor.
* Hide en `pointerleave` / non-mouse.
* `cursor: none` solo mientras `data-preview-touch-cursor-active` en superficie preview; controles reales mantienen `cursor: pointer`.

## 6. Scrollbar sutil

* `html[data-preview-pan-enabled="true"]`: `scrollbar-width: thin` + webkit thumb 6px.
* No ocultación total · no global permanente · no admin shell.

## 7. Feedback táctil

**Diferido (P2).** No implementado para no ampliar blast radius en cards. Próxima fase opcional.

## 8. Activación

```txt
Solo isCatalogPreview
Solo pointerType === "mouse"
No público normal
No touch/pen nativo
```

## 9. Interacciones protegidas

Ignore interactivos/overlays preservado. Threshold 8px + suppress click solo tras pan real. Momentum no se aplica a cart/modal scrolleables.

## 10. QA

| Área | Resultado |
|------|-----------|
| `tsc` | PASS |
| `build` | PASS |
| `lint` | FAIL preexistente (ESLint circular) |
| Source | PASS |
| Public preview (`:3015`) | PASS — cursor visible + `pointer-events:none`; flick → inertia Δ≈−75px tras release; Agregar/detalle OK; scrollbar `thin` |
| Público normal | PASS — sin cursor / sin `data-preview-pan-enabled` en html del pan hook |
| Admin iframe | UNVERIFIED |
| Checkout browser | UNVERIFIED esta sesión; source guard intacto |
| Responsive | Source: touch no afectado; polish solo mouse |

## 11. Deuda residual

| Ítem | Severidad |
|------|-----------|
| Admin iframe auth QA | P2 |
| Checkout browser re-smoke | P3 |
| Press feedback diferido | P2/P3 |
| ESLint circular | P3 histórico |
| Tuning visual velocity/friction | P3 |

## 12. Rollback

1. Remover `use-preview-touch-cursor.ts` + `catalog-preview-mobile-feel.module.css`.
2. Revertir momentum en pan hook / wire en `catalog-client`.
3. Remover docs/registros de esta fase.

Sin DB.

## 13. Próximo paso

**ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1**

(Deploy solo tras auth smoke PASS.)
