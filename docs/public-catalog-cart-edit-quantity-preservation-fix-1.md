# PUBLIC-CATALOG-CART-EDIT-QUANTITY-PRESERVATION-FIX-1

## Preserve Parent and Child Quantity Through Customized Cart Editing Without Reopening Post-Add

**Fecha:** 2026-07-31  
**Branch:** `main` @ `5dd9b41`  
**Estado:** **PASS — CUSTOMIZED CART EDIT PRESERVES ROOT AND CHILD QUANTITY**

Flags:

- `MODE B — TARGETED FIX + AUTHORIZED REGRESSION QA`
- `NO DATABASE CHANGES`
- `NO MIGRATIONS`
- `NO PRODUCTION ADMIN MUTATIONS`
- `NO CHECKOUT CHANGES`
- `NO CHECKOUT SUBMIT`
- `NO REAL ORDERS`
- `NO DEPLOY`
- `NO COMMIT`
- `NO PUSH`
- `SINGLE UPSELL GROUP ONLY`

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED
```

**Deploy readiness:** `READY FOR HUMAN DEPLOY REVIEW`

---

## 1. Estado

P1 de integridad quantity/total corregido en dominio C1 (`mergeCustomizedSelectionIntoCart` replaced branch). Edit de parent V2 con quantity N preserva N en parent y children válidos; totals y root-only count correctos; `replaced` no abre post-add. Fixtures EDIT-QTY-01…15 + Cleanup/C1/U1 + tsc/build + browser core PASS.

---

## 2. Resumen ejecutivo

Durante QA-2 se observó que editar un parent personalizado con quantity > 1 reseteaba quantity a 1 (y children). La causa: el modal siempre construye `quantity: 1` y el branch `replaced` reutilizaba ese payload sin leer `existingParent.quantity`. Fix mínimo en `lib/cart/local.ts`: cuando `replaceCartLineId` apunta a un parent existente, `preservedQuantity = existingParent.quantity` antes de lineTotals, children y signature. `created`/`merged` intactos.

---

## 3. Severidad

| Hallazgo | Severidad | Estado |
|----------|-----------|--------|
| Edit reset quantity N→1 (parent + children + totals) | **P1 — QUANTITY / TOTAL INTEGRITY** | **FIXED** |

No se reclasifica como P3.

---

## 4. Gate previo

Confirmado:

- `docs/public-catalog-post-add-upsell-qa-2.md`
- `docs/public-catalog-post-add-upsell-impl-1.md`
- `docs/public-catalog-upsell-realignment-cleanup-1.md`
- QA-2: `QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED`
- Single `upsellGroup`; sin `placement` / `postAddUpsellGroup` en runtime público
- Post-add sheet; `created` abre; `replaced` no abre
- C1: `MergeCustomizedSelectionResult`, `parentCartLineId`, `attachUpsellChildToParent`
- Remove-child signature rebuild presente
- Focus trap post-add presente

---

## 5. Preflight

- Branch: `main`
- HEAD: `5dd9b41`
- Dirty tree: sí (fases previas + este fix); no se limpió
- Archivos tocados esta fase: `lib/cart/local.ts`, `lib/cart/post-add-upsell-contract.verify.ts`, docs

---

## 6. Reproducción

URL: `http://localhost:3000/b/demohamburgueseria/catalogo` · viewport `390×844`

1. Agregar Doble Smash (Papas chicas)
2. Post-add: adjuntar Coca Cola 500ml → Listo
3. CartSheet: parent qty 1 → stepper a 2 (child escala a 2)
4. Editar → Mayonesa → Actualizar

**Antes del fix (QA-2 histórico):** qty → 1  
**Después del fix:** qty permanece 2

Evidencia runtime post-fix:

| Campo | Antes edit (qty 2) | Después Actualizar |
|-------|--------------------|--------------------|
| parent unit | 12500 | 12500 |
| parent qty | 2 | **2** |
| parent lineTotal | 25000 | **25000** |
| child unit | 3000 | 3000 |
| child qty | 2 | **2** |
| child lineTotal | 6000 | **6000** |
| cart total | 31000 | **31000** |
| root count | 2 productos | **2 productos** |
| outcome UI | — | CartSheet (no post-add) |
| summary | Papas chicas | Papas chicas + Mayonesa |

---

## 7. Source flow

```text
CartSheet Edit
→ CatalogClient (editingCartLineId / replaceCartLineId)
→ selectionStateFromCartParent (opciones; no quantity)
→ CustomizationModal buildCartLinesFromCustomizationSelection({ quantity: 1 })
→ mergeCustomizedSelectionIntoCart(..., { replaceCartLineId })
→ replaced branch
→ [FIX] preservedQuantity = existingParent.quantity
→ preserveAttachedUpsellsForEdit (children × N)
→ signature / conflict / persist
→ CatalogClient: replaced → CartSheet (no post-add)
```

---

## 8. Root cause

**Hipótesis A confirmada.**

- Modal builder emite siempre `quantity: 1` (válido para `created`).
- Branch `replaced` hacía spread de `parent` y solo forzaba `cartLineId` / `createdAt`, **sin** sobrescribir quantity.
- Children se escalaban desde `nextParent.quantity` → también quedaban en 1.

Hipótesis B/C/D/E/F: B parcial (selection no incluye qty — esperado); C verdadero pre-fix; D efecto colateral; E no; F no requerido tras fix de dominio.

---

## 9. Fix design

En `mergeCustomizedSelectionIntoCart` cuando existe `existingParent`:

```ts
const preservedQuantity = Math.max(existingParent.quantity, 1);
const nextParentBase = {
  ...parent,
  cartLineId: replaceCartLineId,
  quantity: preservedQuantity,
  lineTotal: parent.finalUnitPrice * preservedQuantity,
  createdAt: existingParent.createdAt,
  updatedAt: nowIso()
};
```

Garantía en dominio del carrito (no depende de UI). Modal sigue emitiendo 1 para creates.

---

## 10. Autoridad de quantity

Fuente autoritativa en `replaced`: **existing parent** localizado por `replaceCartLineId`.  
No: default modal, payload de creación, estado visual.

---

## 11. Created behavior

Sin cambio: nuevo parent → quantity inicial 1 (fixture EDIT-QTY-10).

---

## 12. Merged behavior

Sin cambio: qty 2 + idéntico qty 1 → merged 3 (EDIT-QTY-11).

---

## 13. Replaced behavior

Preserva `cartLineId`, quantity N, children Plus válidos.  
Reconstruye opciones, unit price, summaries, signature.  
No abre post-add.

---

## 14–18. Parent/child quantity, totals, root-only count

Tras edit qty 2: parent/child qty 2; lineTotals = unit × 2; cart total suma; FAB/sheet/checkout count root-only (children no inflan).

---

## 19. Signature

Quantity no define identidad de configuración. Edit reconstruye signature con nuevas opciones + upsells preservados. Remove child sigue rebuild (EDIT-QTY-12).

---

## 20. Conflict atomicity

`signature_conflict` no muta items ni quantities (EDIT-QTY-08).

---

## 21. Parent missing

`parent_missing` no crea línea qty 1 (EDIT-QTY-09).

---

## 22–23. Stepper

Antes: 1→2→edit→2 PASS.  
Después: edit→2→stepper→3 PASS (child 3, totals ×3).

---

## 24. Persistence

localStorage `orderops-cart-v2:{businessId}` conserva qty 2 tras replace. Misma key; sin duplicar roots.

---

## 25. Post-add suppression

`replaced` → CartSheet; sheet “¿Sumás algo más?” no aparece (EDIT-QTY-15 + browser).

---

## 26. Files created

- `docs/public-catalog-cart-edit-quantity-preservation-fix-1.md`

## 27. Files modified

- `lib/cart/local.ts` — preserve quantity on replace
- `lib/cart/post-add-upsell-contract.verify.ts` — EDIT-QTY-01…15
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 28. Files eliminated

Ninguno.

---

## 29. Fixtures

`lib/cart/post-add-upsell-contract.verify.ts`:

- EDIT-QTY-01…03 qty 1/2/3
- EDIT-QTY-04 parent total
- EDIT-QTY-05/06 child valid + total
- EDIT-QTY-07 child invalid drop, parent qty kept
- EDIT-QTY-08 conflict atomic
- EDIT-QTY-09 parent_missing
- EDIT-QTY-10 created unaffected
- EDIT-QTY-11 merged unaffected
- EDIT-QTY-12 remove child signature retained
- EDIT-QTY-13 root-only count
- EDIT-QTY-14 multiple valid children
- EDIT-QTY-15 replaced ≠ created (no post-add decision)

U1: re-run PASS sin cambio de dominio quantity.

---

## 30. Commands

```text
npx tsx lib/product-customization/safe-error-details.verify.ts → PASS
npx tsx lib/product-customization/upsell-resolution.verify.ts → PASS
npx tsx lib/cart/post-add-upsell-contract.verify.ts → PASS (incl. EDIT-QTY)
npx tsx lib/cart/post-add-upsell-ui-contract.verify.ts → PASS
npx tsc --noEmit → PASS (0)
npm run build → PASS (0)
```

---

## 31. Browser QA

| Case | Result |
|------|--------|
| BROWSER-QTY-01 parent sin child (cubierto vía fixture + flujo con child) | PASS |
| BROWSER-QTY-02 parent+child qty 2 edit | **PASS** |
| BROWSER-QTY-03 qty 3 post-edit stepper | **PASS** |
| BROWSER-QTY-04 edit con cambio (Mayonesa) | **PASS** |
| BROWSER-QTY-05 stepper posterior 2→3 | **PASS** |
| BROWSER-QTY-06 remove child; parent qty 3 | **PASS** |
| BROWSER-QTY-07 checkout sin submit | **PASS** — 3 productos, 3×12500=37500, CTA visible |

---

## 32. Network

- Confirm edit Actualizar: **0 fetch**
- Stepper: **0 fetch**
- Checkout modality Envío→Retiro: **0 fetch**
- Edit open cache-hit: config ya cargada (sin POST adicional observado en confirm)

---

## 33. Console

Sin errores nuevos P1/P2 observados en flujo core (hydration/duplicate key/unhandled rejection no detectados en automation).

---

## 34. Checkout boundary

Checkout summary: qty 3, root-only count 3, total $37.500, CTA `Enviar pedido · $37.500,00`.  
`SUBMIT REAL — NOT EXECUTED BY SCOPE`

---

## 35. Preview

`PREVIEW AUTH QA — UNVERIFIED` (no bloqueante).

---

## 36–37. Findings / Fixes

| ID | Sev | Fix |
|----|-----|-----|
| EDIT-QTY-RESET | P1 | `preservedQuantity` from `existingParent` in replaced branch |

---

## 38. No-regression

Single upsell group; post-add created-only; merge; attach; remove-child signature; focus trap; root-only count; checkout unchanged; modal Plus ausente.

---

## 39. Remaining debt

- Preview auth QA
- Real-device
- Screen reader
- Closed-store

---

## 40. Deploy readiness

`READY FOR HUMAN DEPLOY REVIEW`

---

## 41. Queue gate

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED
```

Nunca `ALLOWED` automático.

---

## 42. Rollback

Sin ejecutar. Revertir únicamente hunk quantity en `lib/cart/local.ts` (~líneas preservedQuantity / nextParentBase). Mantener single upsellGroup, post-add U1, C1 restante, remove signature fix, focus trap. Sin rollback DB.

---

## 43. Próximo paso

`PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1` tras revisión humana de reporte, diff, fixtures, browser evidence, tsc, build. **No deploy en esta fase.**
