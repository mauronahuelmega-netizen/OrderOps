# ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1 — Mouse Drag Touch-Scroll Polish

## 1. Estado

**PASS WITH AUTH QA DEBT**

Touch-pan mouse drag funciona en path público preview. Admin iframe UNVERIFIED sin sesión. Sin regresiones en guard/carrito/cookie/CSP.

## 2. Resumen ejecutivo

Se agregó scroll vertical simulado por mouse drag (click sostenido + arrastrar) solo cuando el catálogo corre en preview (`isCatalogPreview` / `?orderopsPreview=1`) y el pointer es mouse. Público normal, touch nativo, carrito, cookie, checkout guard y CSP quedan intactos.

## 3. Objetivo UX

En desktop, dentro de la preview, el admin puede scrollear el catálogo “como con el dedo” sin overlay encima del iframe.

## 4. Alcance

**Dentro:** pan vertical mouse-only en catálogo preview; cursor grab/grabbing; ignore interactivos y overlays.

**Fuera:** touch/pen, público normal, checkout, cookie, carrito scope, CSP, DB, deploy.

## 5. Implementación

| Pieza | Detalle |
|-------|---------|
| Hook | `components/public/catalog/use-preview-pointer-pan-scroll.ts` |
| CSS | `catalog-preview-pan.module.css` (grab/grabbing; no globals) |
| Integración | `CatalogClient` → `ref` en `<main>`, `enabled: isCatalogPreview` |
| Scroll target | `document.scrollingElement` del documento (incluye iframe) |
| Threshold | 8px antes de activar pan |
| Click protect | tras pan, suppress click capture one-shot |

Overlays marcados `data-preview-pan-ignore`: category nav, cart bar, cart sheet, product modal, customization modal.

## 6. Contrato de activación

```txt
Solo preview (isCatalogPreview).
Solo pointerType === "mouse" + botón primario.
No público normal.
No touch/pen nativo.
```

## 7. Interacciones protegidas

Ignore vía `closest` + `data-preview-pan-ignore`:

Productos (botones) · Categorías · Links · Inputs · Modal · Cart sheet · Cart bar · Checkout (no integrado).

## 8. QA

| Área | Resultado |
|------|-----------|
| `tsc` | PASS |
| `build` | PASS |
| `lint` | FAIL preexistente (ESLint circular) |
| Source | PASS |
| Browser public preview (`:3013`) | PASS — pointer pan scroll 0→120; Agregar OK; checkout bloqueado |
| Browser público sin query | PASS — `data-preview-pan-enabled` null; pan no scrollea |
| Admin iframe | UNVERIFIED |
| Responsive | Source: touch no afectado; pan solo mouse |

Preflight: handoff docs (`docs/admin-catalog-preview-handoff-1.md` + CURRENT_PHASE/memory) seguían uncommitted; no tocados salvo registros de esta fase.

## 9. Riesgos residuales

| Riesgo | Severidad |
|--------|-----------|
| Admin iframe pan no verificado | P2 AUTH QA |
| Pan horizontal no implementado | P3 aceptado |
| Product cards no-button surface puede iniciar pan | P3 menor (área no interactiva intencional) |

## 10. Rollback

1. Remover hook + CSS module.
2. Revertir integración en CatalogClient / ignore attrs.
3. Remover docs/registros.

Sin DB.

## 11. Próximo paso

**ADMIN-CATALOG-PREVIEW-TOUCH-PAN-DEPLOY-1** (o AUTH-SMOKE-1 si se prioriza cookie DevTools).
