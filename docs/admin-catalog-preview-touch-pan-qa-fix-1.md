# ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 — Prevent Text Selection During Preview Pan

## 1. Estado

**PASS WITH PUBLIC QA ONLY**

Public preview path (`/b/{slug}/catalogo?orderopsPreview=1`) confirma: drag sobre texto scrollea sin selección; drag sobre imagen no arrastra fantasma; clicks normales OK. Admin iframe `/admin/products/preview` **UNVERIFIED** (redirige a `/admin/login` sin sesión). Checkout browser smoke no re-ejecutado en esta sesión (source intacto). Sin commit/push/deploy.

## 2. Resumen ejecutivo

Se corrigió el bug de selección de texto durante mouse-pan en preview. El gesto entra en fase `candidate` en `pointerdown` válido y bloquea selección de inmediato (`user-select: none`, `selectstart`/`dragstart` prevent, cleanup de selection). El threshold 8px sigue distinguiendo click vs pan. Causa secundaria: cards con `role="button"` se trataban como interactivos y el pan nunca arrancaba sobre nombre/precio/imagen.

## 3. Bug reproducido

| Superficie | Antes |
|------------|-------|
| Nombre / descripción / precio | Selección de texto + toolbar del navegador |
| Imagen | Drag fantasma / selección |
| Card body no interactivo | Selección o pan inconsistente |
| Botón real (`Agregar`, `Ver detalle`) | No debía panear (OK) |

Repro autenticado previo a esta fase en `/admin/products/preview` (iframe). Reconfirmación runtime de esta fase: path público preview en `:3014`.

## 4. Causa

1. `user-select: none` / grabbing solo al activar drag (tarde).
2. Sin `selectstart` / `dragstart` prevent en candidate.
3. `preventDefault` insuficiente en `pointermove` antes/durante pan.
4. `[role="button"]` en el hit de card bloqueaba el pan → el browser hacía selección nativa sobre texto.

## 5. Cambios realizados

| Archivo | Cambio |
|---------|--------|
| `use-preview-pointer-pan-scroll.ts` | Fases `idle` → `candidate` → `active`; `html[data-preview-pan-state]`; listeners capture `selectstart`/`dragstart`; `pointermove` `{passive:false}` + `preventDefault`; `removeAllRanges` en candidate/active/end; omit `[role="button"]` del ignore interactivo; sin `preventDefault` en `pointerdown` (preserva click card) |
| `catalog-preview-pan.module.css` | `user-select: none` mientras preview pan enabled; `-webkit-user-drag: none` en imgs; grabbing + `:global(html[data-preview-pan-state=…])` |
| Docs | este doc + `CURRENT_PHASE` + living memory |

No se tocaron carrito, cookie, checkout guard, CSP, DB/RLS/RPC.

## 6. Activación

```txt
Solo isCatalogPreview / ?orderopsPreview=1
Solo pointerType === "mouse" + botón primario
No público normal
No touch/pen nativo
```

## 7. Interacciones protegidas

Ignore real: `button`, `a`, inputs, `label`, `summary`, `[role="link"]`, `contenteditable`, `[data-preview-pan-ignore]`.

Overlays con ignore: category nav, cart bar/sheet, product modal, customization modal.

Controles reales (`Agregar`, `Ver detalle`, categorías) siguen clickables. Superficie de card (texto/imagen) puede panear a propósito.

## 8. QA

| Área | Resultado |
|------|-----------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL preexistente — ESLint 9 circular `TypeError: Converting circular structure to JSON` |
| Source | PASS — solo preview + mouse; candidate/active anti-selection; threshold 8px; suppress click solo tras pan |
| Public preview path (`:3014`) | PASS — scroll texto 40→90; `selectionMid/After=""`; `selectBlocked`; `imageDragBlocked`; `webkit-user-drag:none`; Agregar escribe `orderops-preview-cart*`; Ver detalle abre dialog; categorías scrollean |
| Público normal | PASS — `data-preview-pan-enabled` null; `user-select: auto` |
| Admin iframe | UNVERIFIED (login redirect) |
| Checkout browser | UNVERIFIED esta sesión; source guard intacto (`shouldBlockCatalogPreviewOrder`, UI “Confirmación deshabilitada”) |
| Responsive | Source: touch no afectado; pan solo mouse |

Preflight: cambios uncommitted de TOUCH-PAN-POLISH-1 + handoff docs seguían presentes; no limpiados / no stash.

## 9. Deuda residual

| Ítem | Severidad |
|------|-----------|
| Admin iframe QA autenticado pendiente | P2 AUTH |
| Checkout browser smoke re-run pendiente | P3 |
| ESLint circular preexistente | P3 histórico |
| Pan horizontal no implementado | P3 aceptado |

## 10. Rollback

1. Revertir cambios en hook + CSS module a POLISH-1 (o remover pan por completo).
2. Revertir docs/registros de esta fase.
3. Sin DB.

## 11. Próximo paso

Tras auth smoke en admin iframe (y opcional checkout smoke):

**ADMIN-CATALOG-PREVIEW-TOUCH-PAN-DEPLOY-1**

Solo si el estado sube a `PASS` con iframe verificado. Con el estado actual (`PASS WITH PUBLIC QA ONLY`), deploy queda **bloqueado** hasta auth QA.
