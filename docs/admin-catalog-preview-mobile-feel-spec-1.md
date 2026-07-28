# ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-SPEC-1 — Mobile Feel UX Specification

## 1. Estado

```txt
SPEC READY FOR IMPLEMENTATION
```

No se detectaron bloqueos técnicos que impidan implementar cursor circular + momentum vertical sobre el touch-pan actual. Dependencias de proceso (no bloquean la spec):

* touch-pan polish + QA-fix siguen uncommitted / no deployados (`PASS WITH PUBLIC QA ONLY`);
* admin iframe auth QA sigue pendiente (obligatorio antes de cualquier deploy mobile-feel).

## 2. Resumen ejecutivo

Esta spec define una mejora UX sobre el touch-pan existente de Vista previa del catálogo.

```txt
No se trata de seguridad, carrito ni checkout.
Es una mejora de sensación mobile para desktop preview.
```

Objetivo: pasar de “iframe mobile + drag-scroll básico” a una experiencia más cercana a DevTools/mobile (cursor táctil, inercia al soltar, feedback sutil), sin romper clicks, carrito, checkout ni catálogo público normal. Esta fase es **docs-only**; no hay código funcional.

## 3. Problema UX

Estado actual (TOUCH-PAN-QA-FIX-1):

* drag vertical funciona;
* texto/imagen ya no se seleccionan ni arrastran como ghost;
* threshold 8px + suppress click tras pan real.

Falta de sensación:

```txt
El drag-scroll actual funciona, pero al soltar se detiene de golpe.
El cursor sigue sintiéndose como mouse de escritorio.
La preview aún se percibe como iframe scrolleable, no como mobile real.
```

En mobile real, un gesto rápido deja el contenido desplazándose con desaceleración natural. En DevTools mobile, el cursor se percibe como punto/círculo táctil, no como flecha de escritorio.

## 4. Objetivo de producto

```txt
Permitir que owner/manager pruebe el catálogo en una experiencia visual y gestual más cercana a cómo lo ven sus clientes en celular, sin DevTools y sin riesgo operativo.
```

Complementa el handoff de feature (`FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT`) y el polish touch-pan, sin ampliar blast radius a carrito/cookie/guard/CSP/DB.

## 5. Alcance V1

Incluir:

```txt
cursor circular tipo touch
momentum/inertia vertical
tap/press feedback sutil
scrollbars menos protagonistas solo en preview desktop
QA admin iframe antes de deploy
```

Prioridad sugerida dentro de V1:

| Pieza | Prioridad |
|-------|-----------|
| Momentum vertical | P1 |
| Cursor circular | P1 |
| Scrollbar sutil | P2 |
| Press feedback en cards/buttons | P2 (solo si no aumenta riesgo) |
| Home/status indicator en phone frame | P3 diferido |

## 6. Fuera de scope

```txt
emulación real de user-agent mobile
conversión mouse events → touch events reales
device presets
selector de dispositivos
postMessage complejo
landscape mode
analytics
cambios en checkout
cambios en carrito
cambios en cookie
cambios en CSP
DB/RLS/RPC
PWA
pedidos reales
```

También fuera: pan horizontal, librerías de inertia externas, animaciones CSS para física de scroll, `setInterval` para momentum.

## 7. Contrato de activación

La mejora debe activarse solo si:

```txt
isCatalogPreview === true
pointerType === "mouse"
viewport desktop/tablet con mouse
```

No activar en:

```txt
catálogo público normal
touch real
pen
checkout
admin shell fuera del iframe
Product Customization preview
```

Mismo gate base que touch-pan (`enabled: isCatalogPreview` en `CatalogClient`). Cursor y momentum son capas encima del pan, no un segundo sistema paralelo en público.

## 8. Cursor circular tipo touch

Comportamiento:

```txt
mostrar círculo flotante dentro del catálogo preview
seguir coordenadas del mouse
ocultar cursor nativo solo dentro del área preview si es seguro
círculo reduce escala/opacidad en pointerdown
círculo vuelve a estado normal en pointerup
ocultar al salir del área
no capturar eventos
pointer-events: none
```

Requisitos:

```txt
no overlay bloqueante
no interferir con clicks
no visible en público normal
no visible en touch real
no visible en checkout
```

Notas de implementación:

* elemento DOM ligero (div) o pseudo-capa bajo el scroller preview;
* `cursor: none` solo en la superficie preview gated (`data-preview-pan-enabled` / clase module);
* no aplicar `cursor: none` global al `html` del admin shell;
* no usar canvas ni librería de cursores.

## 9. Momentum / inertia scroll

Comportamiento esperado:

```txt
drag lento → poca o ninguna inercia
drag rápido → continúa scroll con desaceleración
nuevo pointerdown → cancela inercia
wheel/trackpad → siguen nativos
no overscroll artificial extremo
```

Modelo técnico recomendado:

```txt
medir últimos movimientos del pointer
calcular velocityY
requestAnimationFrame para continuar scroll
aplicar friction
detener cuando velocidad cae bajo umbral
clamp implícito por scrollTop min/max
```

Reglas:

* no librerías externas;
* no animaciones CSS para scroll físico;
* no `setInterval`;
* cancelar RAF en `pointerdown`, unmount y al llegar a tope/fondo;
* no aplicar momentum a overlays (`data-preview-pan-ignore`) ni scrolleables internos de modal/cart.

## 10. Feedback táctil en cards

Definido como **P2** dentro de la fase de polish:

```txt
press feedback sutil en card/button cuando pointerdown válido
scale 0.99 o background sutil
duración corta
no afectar layout
no aplicarlo a público normal
```

No hacerlo si complica la fase de momentum. Si hay trade-off, diferir feedback y cerrar P1 (momentum + cursor) primero.

## 11. Scrollbars en preview

Opciones:

```txt
A. reducir protagonismo del scrollbar
B. ocultar scrollbar solo en preview desktop
C. mantener visible para debug
```

**Recomendación:** A como default (scrollbar más sutil vía module CSS scoped a preview). B opcional si QA confirma que no afecta usabilidad. C solo como flag temporal de debug, no default.

No ocultar scrollbars globalmente ni en público normal.

## 12. Indicadores visuales de dispositivo

Opcional / **P3**:

```txt
home indicator inferior
status/speaker más realista
micro ajuste del phone frame
```

Vive en el **shell admin** (`/admin/products/preview`), no dentro del catálogo iframe. No mezclar con momentum/cursor si aumenta blast radius. Diferir a fase posterior si el polish P1 ya es suficiente.

## 13. Interacciones protegidas

Debe proteger:

```txt
Agregar
Ver detalle
Categorías
Menú
Cart bar
Cart sheet
Product detail modal
Customization modal
Inputs
Links
Checkout preview
```

Reglas:

```txt
click normal menor a threshold sigue siendo click
drag real suprime click solo si hubo pan
interactivos no inician pan
overlays no reciben momentum externo
```

Reutilizar el contrato actual de ignore (`button`/`a`/inputs/`data-preview-pan-ignore`) y la omisión intencional de `[role="button"]` en el hit de card para permitir pan sobre texto/imagen.

## 14. Arquitectura técnica recomendada

Evolucionar el hook existente:

```txt
components/public/catalog/use-preview-pointer-pan-scroll.ts
```

Opciones:

```ts
usePreviewPointerPanScroll({
  enabled,
  targetRef,
  momentum: true,
  cursor: true,
})
```

o dividir:

```txt
usePreviewPointerPanScroll
usePreviewTouchCursor
```

**Recomendación:** mantener separado el cursor visual del motor de scroll (hooks distintos o módulos internos claros). No convertirlo en un sistema genérico global. No crear dependencia nueva.

CSS:

* ampliar `catalog-preview-pan.module.css`, **o**
* crear `catalog-preview-mobile-feel.module.css` si mejora separación (cursor + scrollbar + press feedback).

Integración sigue en `CatalogClient` con `enabled: isCatalogPreview` y `ref` en `<main>`.

## 15. Parámetros iniciales recomendados

```txt
threshold: 8px
minMomentumVelocity: 0.15 px/ms
maxMomentumVelocity: 2.2 px/ms
friction: 0.92–0.95 por frame
stopVelocity: 0.02 px/ms
maxMomentumDuration: 900ms
cursorSize: 20–24px
cursorPressedScale: 0.72–0.85
```

Estos valores son punto de partida; deben ajustarse por QA visual en iframe admin y path público preview. Cap de duración y velocity evita inercia excesiva (P2).

## 16. QA requerido

### Source QA

```txt
solo preview
solo mouse
no público normal
no touch real
momentum cancela en nuevo pointerdown
cursor pointer-events none
sin listeners leaks
sin carrito/cookie/checkout/CSP
```

### Browser QA public preview

```txt
/b/{slug}/catalogo?orderopsPreview=1
```

Validar:

```txt
cursor circular visible
drag rápido genera inercia
drag lento casi sin inercia
click producto funciona
Agregar funciona
Ver detalle funciona
cart sheet funciona
modal funciona
checkout bloqueado
```

### Browser QA admin iframe

```txt
/admin/products/preview
```

**Obligatorio antes de deploy.**

### Público normal

```txt
/b/{slug}/catalogo
```

Debe quedar sin cursor circular ni momentum custom.

### CLI

```txt
npx tsc --noEmit
npm run build
```

Lint: reportar deuda ESLint circular preexistente si falla.

## 17. Riesgos y mitigaciones

| Riesgo                    | Severidad | Mitigación                          |
| ------------------------- | --------: | ----------------------------------- |
| momentum rompe clicks     |        P1 | threshold + suppress solo tras pan  |
| momentum mueve modal/cart |        P1 | ignore overlays                     |
| cursor bloquea clicks     |        P1 | `pointer-events:none`               |
| público normal afectado   |        P1 | gate `isCatalogPreview`             |
| inercia demasiado fuerte  |        P2 | cap velocity/duration               |
| animación con leaks       |        P2 | cancel RAF en unmount               |
| admin iframe no validado  |        P2 | auth smoke obligatorio antes deploy |

## 18. Criterios de aceptación

La implementación futura pasa si:

```txt
1. cursor circular visible solo en preview desktop
2. cursor no bloquea clicks
3. drag rápido genera momentum
4. drag lento no genera momentum excesivo
5. nuevo drag corta momentum anterior
6. click normal sigue funcionando
7. Agregar funciona
8. Ver detalle funciona
9. cart sheet funciona
10. modal funciona
11. checkout preview sigue bloqueado
12. público normal no cambia
13. touch real no cambia
14. no carrito/cookie/checkout/CSP
15. no DB/RLS/RPC
16. tsc/build PASS
17. admin iframe QA PASS antes deploy
```

## 19. Rollback

Rollback futuro debe ser:

```txt
remover hooks/cursor/momentum CSS
volver al touch-pan base o remover touch-pan completo
sin DB
sin Supabase
sin pedidos
```

Sin tocar cookie, guard, CSP ni migraciones.

## 20. Roadmap de implementación

Próxima fase:

```txt
ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1
```

Scope sugerido:

```txt
P1 momentum vertical
P1 cursor circular
P2 scrollbar sutil
P2 press feedback si no aumenta riesgo
P3 status/home indicator diferido
```

No incluir deploy en esa fase.

Luego:

```txt
ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1
ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1
```

Nota de secuencia: touch-pan aún no está en `PASS` admin iframe. El polish mobile-feel puede construirse sobre el código local uncommitted; el deploy mobile-feel exige auth QA del conjunto (pan + feel).

## 21. Próximo paso

```txt
Próximo: ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1
```

---

### Preflight de esta fase (docs-only)

* Rama/HEAD y dirty tree registrados al ejecutar la fase.
* Cambios uncommitted esperados: handoff docs, touch-pan polish, touch-pan qa-fix (no limpiados / no stash / no revert).
* `npx tsc --noEmit` al cierre (docs-only no debe romper tipos).
* Sin `build` obligatorio · lint no obligatorio (circular histórico = deuda P3).
* Sin código · sin commit · sin push · sin deploy.
