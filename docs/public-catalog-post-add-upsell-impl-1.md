# PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1

## Move the Existing Single Plus Group from the Customization Modal to a Safe Post-Add Sheet

**Fecha:** 2026-07-31  
**Branch:** `main` @ `5dd9b41`  
**Estado:** **PASS WITH NON-BLOCKING QA DEBT — SIMPLIFIED SINGLE-GROUP POST-ADD UPSELL IMPLEMENTED**

Flags:

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
- `SUBMIT REAL — NOT EXECUTED BY SCOPE`

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2 = ALLOWED
```

---

## 1. Estado

Implementación U1 completa sobre baseline Cleanup: un solo `config.upsellGroup`, Plus retirado del modal, sheet post-add para `outcome === "created"` con candidatos, attach vía C1, cart sheet al finalizar.

---

## 2. Resumen ejecutivo

El grupo Plus ya no se renderiza en `CustomizationModal`. Tras confirmar personalizaciones, si el merge es `created` y hay candidatos elegibles (máx. 3), se abre `PostAddUpsellSheet` (“¿Sumás algo más?”). Attach usa `attachUpsellChildToParent`. `merged`/`replaced` abren CartSheet directo. Productos simples / Plus-only usan quick-add sin modal ni post-add.

---

## 3. Queue gate previo

Cleanup report: `docs/public-catalog-upsell-realignment-cleanup-1.md`

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 = ALLOWED
```

Revalidado: sin `placement`/`postAddUpsellGroup` en runtime; fixtures Cleanup + C1 PASS; catálogo 200.

---

## 4. Decisión de producto

Un único `config.upsellGroup`. Sin placement, sin segundo grupo, sin admin surface selector, sin migración. Misma allowlist alimenta post-add.

---

## 5. Alcance MVP

Incluido: productos con personalizaciones reales + Plus en config; `created`; attach individual; máx. 3 candidatos; CartSheet posterior.

Excluido: quick-add simple; producto solo-Plus; prefetch; analytics; batch CTA; DB/checkout/create_order.

---

## 6. Preflight

`main` @ `5dd9b41` · dirty tree amplio (Cleanup/C1/U1 + docs previos). Sin limpieza destructiva.

---

## 7. Source audit

1. Modal: `openCustomizationModal` desde card/detail cuando `productNeedsCustomizationModal(summary)`.
2. Config: cache on-demand `customizationConfigCacheRef` + server action.
3. Confirm: `CustomizationModal.handleConfirm` → `onConfirmSelection`.
4. Merge: `mergeCustomizedSelectionIntoCart` en CatalogClient.
5. Persist: `persistUnifiedCartItems` effect.
6. CartSheet: `setIsCartSheetOpen(true)`.
7. Plus (antes): `UpsellSuggestionGroup` en modal — retirado.
8. Edit: `selectionStateFromCartParent` + `eligibleAttachedUpsellProductIds`.
9. Preview: `cartScope: "preview"` aislado; opportunity solo en memoria.
10. Overlay: backdrop + `role="dialog"` (mismo patrón CartSheet).

---

## 8. Paths reales

| Área | Path |
|------|------|
| Catalog | `components/public/catalog/catalog-client.tsx` |
| Modal | `components/public/catalog/customization-modal.tsx` |
| Post-add sheet | `components/public/catalog/post-add-upsell-sheet.tsx` |
| Sheet CSS | `components/public/catalog/post-add-upsell-sheet.module.css` |
| Helpers | `lib/cart/post-add-upsell.ts` |
| C1 | `lib/cart/local.ts` |
| Trigger | `lib/product-customization/public-shared.ts` → `productNeedsCustomizationModal` |
| Fixture U1 | `lib/cart/post-add-upsell-ui-contract.verify.ts` |
| Fixture C1 | `lib/cart/post-add-upsell-contract.verify.ts` |

---

## 9. Trigger del modal

`productNeedsCustomizationModal` = `summary.hasCustomizations` únicamente.  
Plus-only → quick-add; configurable+Plus → modal + config cache conserva `upsellGroup`.

---

## 10. Plus retirado del modal

Markup/`UpsellSuggestionGroup` eliminados. Confirm usa `selectedUpsellProductIds: []`.  
`config.upsellGroup` permanece en config; se pasa `suggestedUpsellProducts` al caller.

---

## 11. Config single-group

Sin `placement` / `postAddUpsellGroup`. Un `upsellGroup` efectivo (product > category).

---

## 12. Opportunity state

```ts
type PostAddUpsellOpportunity = {
  parentCartLineId: string;
  candidates: PublicUpsellSuggestedProduct[];
};
```

Solo React state. Sin localStorage.

---

## 13. Trigger created

`mergeResult.outcome === "created"` + candidatos → post-add; cart cerrado.

---

## 14. Merged / replaced suppression

`merged` / `replaced` → `setIsCartSheetOpen(true)`; sin opportunity.

---

## 15–17. Candidate helper / rules / signature

`getEligiblePostAddUpsellCandidates` + `wouldUpsellAttachmentConflict` + `decidePostAddOverlay` en `lib/cart/post-add-upsell.ts`.  
Excluye self, dupes, invalid price, already attached, signature conflict. Máx. 3. Orden preservado. Disponibilidad prefiltrada por public config.

---

## 18–19. Sheet component / design

`PostAddUpsellSheet`: título “¿Sumás algo más?”, descripción, close, candidatos (imagen/nombre/precio/CTA), footer Ahora no / Listo. Tokens semánticos. z-index 75 > cart 70.

---

## 20–24. Attach orchestration

`attachUpsellChildToParent` por candidato.  
`attached` → persist + Agregado.  
`already_attached` → Agregado idempotente.  
`signature_conflict` → inline error, sin mutar.  
`parent_missing` → cierra opportunity, CartSheet + notice.

---

## 25. Double tap / concurrency

Pending por candidate + `mutationLockRef` serializa attaches.

---

## 26. Persistence

Solo carrito vía helpers unificados existentes. Preview aislado.

---

## 27. Dismiss paths

X / backdrop / Escape / Ahora no / Listo → `finishOnce` → limpiar opportunity → CartSheet. Parent/children permanecen.

---

## 28. Frequency / suppression

Una vez por `created`. Fail-closed sin candidatos / sin products. Sin flags persistentes.

---

## 29. Edit preservation

Modal sin Plus UI; `eligibleAttachedUpsellProductIds` desde `upsellGroup.products`; C1 preserve; no post-add en `replaced`.

---

## 30. CartSheet

Sin rediseño. Notice opcional para parent_missing. Jerarquía parent/child intacta.

---

## 31. Checkout

Sin cambios. Submit no ejecutado.

---

## 32. Order validation

Allowlist sigue siendo `config.upsellGroup`. Sin validación paralela.

---

## 33–34. Cache / Network

Post-add: 0 Next-Action adicionales. Attach: 0 fetch. Simple quick-add: 0 config POST (resourceDelta 0 medido en smoke).

---

## 35. Performance

Sin loading artificial, sin refetch, un solo overlay activo.

---

## 36. Accessibility

Dialog + aria-modal + labelledby/describedby + Escape + scroll lock + disabled real.  
**SCREEN READER — UNVERIFIED** (deuda no bloqueante).

---

## 37. Responsive

CSS + emulación browser. **REAL-DEVICE — UNVERIFIED**.

---

## 38. Preview

Mismo wiring; opportunity en memoria; storage preview aislado.  
**PREVIEW AUTH QA — UNVERIFIED**.

---

## 39–40. Files created / modified

**Created**

- `components/public/catalog/post-add-upsell-sheet.tsx`
- `components/public/catalog/post-add-upsell-sheet.module.css`
- `lib/cart/post-add-upsell.ts`
- `lib/cart/post-add-upsell-ui-contract.verify.ts`
- `docs/public-catalog-post-add-upsell-impl-1.md`

**Modified**

- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/cart-sheet.tsx` (+ notice)
- `components/public/catalog/cart-sheet.module.css`
- `lib/product-customization/public-shared.ts`
- `lib/product-customization/upsell-resolution.verify.ts`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

**Deleted:** ninguno en esta fase.

---

## 41. Fixtures

`npx tsx lib/cart/post-add-upsell-ui-contract.verify.ts` → **PASS** (U1-01…U1-20)  
`npx tsx lib/cart/post-add-upsell-contract.verify.ts` → **PASS**  
`npx tsx lib/product-customization/safe-error-details.verify.ts` → **PASS**  
`npx tsx lib/product-customization/upsell-resolution.verify.ts` → **PASS**

---

## 42. Commands

| Command | Result |
|---------|--------|
| U1 fixture | PASS |
| C1 fixture | PASS |
| Cleanup fixtures | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | trailing whitespace histórico en docs ajenos (`CURRENT_PHASE.md`) — no limpio |

---

## 43. Browser smoke

URL: `http://localhost:3000/b/demohamburgueseria/catalogo`  
Producto: Doble Smash (+ Coca Plus)

| Case | Result |
|------|--------|
| IMPL-01 Modal sin Plus | PASS |
| IMPL-02 Created → post-add | PASS (Coca $3000) |
| IMPL-03 Dismiss → CartSheet | PASS |
| IMPL-04 Attach uno | PASS (child, Agregado, total +3000, count root-only 1) |
| IMPL-05/06 Finish hierarchy | PASS ($15.500) |
| IMPL-07 Merged | PASS (qty 2, no post-add, cart) |
| IMPL-08 Edit | PASS (Plus oculto, no post-add, cart) |
| IMPL-09 Simple quick-add | PASS (Coca, no modal/post-add, 0 resource delta) |
| IMPL-10 Configurable sin Plus | UNVERIFIED (no fixture product en demo sin Plus) |

---

## 44. Console

Sin P0/P1/P2 observados en smoke principal. Sin hydration errors atribuibles a U1.

---

## 45–46. Findings / Severity

| Sev | Finding | Status |
|-----|---------|--------|
| P2 | `setCartItems` holder podía devolver null → error falso | Fixed: merge síncrono fuera del updater |
| P3 | Screen reader / real-device / preview auth | Debt |
| P3 | IMPL-10 product sin Plus no hallado en demo | Debt |

P0/P1/P2 abiertos: **ninguno**.

---

## 47. Fixes applied

1. Trigger modal → `hasCustomizations` only.  
2. Retiro render Plus del modal.  
3. Helpers + sheet + wiring created-only.  
4. Merge confirm síncrono (evitar holder null).  
5. CartSheet `notice` para parent_missing.  
6. Fixture REALIGN trigger actualizado.

---

## 48. No-regression

Catálogo, modal (obligatorios/opcionales/extras), cache, FAB, CartSheet, C1, Cleanup single-group, checkout intacto.

---

## 49. Remaining debt

- SCREEN READER — UNVERIFIED  
- REAL-DEVICE — UNVERIFIED  
- PREVIEW AUTH QA — UNVERIFIED  
- IMPL-10 demo product sin Plus  
- Q1 histórica sigue documentada como BLOCKED (superada por esta impl + QA-2)

---

## 50. Queue gate

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2 = ALLOWED
```

---

## 51. Rollback

Sin ejecutar: retirar wiring/sheet U1; restaurar Plus visual en modal; mantener single `upsellGroup` + C1 + logging; sin DB.

---

## 52. Próximo paso

**PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2** — QA integrada, responsive/a11y/network, deploy readiness. No ejecutar en esta tarea.
