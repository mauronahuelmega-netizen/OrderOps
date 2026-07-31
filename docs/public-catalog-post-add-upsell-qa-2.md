# PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2

## Integrated Single-Group Post-Add Upsell QA, Authorized Local Fixes & Human-Reviewed Deploy Readiness

**Fecha:** 2026-07-31  
**Branch:** `main` @ `5dd9b41`  
**Estado:** **PASS WITH NON-BLOCKING QA DEBT — SINGLE-GROUP POST-ADD UPSELL VERIFIED AND READY FOR HUMAN DEPLOY REVIEW**

Flags:

- `MODE B — QA + AUTHORIZED LOCAL FIXES`
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
- `QUEUE ENDS AFTER THIS PHASE`
- `SUBMIT REAL — NOT EXECUTED BY SCOPE`

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED
```

**Deploy readiness:** `READY FOR HUMAN DEPLOY REVIEW`

---

## 1. Estado

QA-2 integral sobre IMPL-1 + Cleanup. Un defecto P1 de signature tras remove de child Plus fue corregido y revalidado. Flujo público core PASS. Deudas no bloqueantes: preview auth, real-device, screen reader, closed-store.

---

## 2. Resumen ejecutivo

Se revalidó Cleanup (single `upsellGroup`, sin placement), C1, U1 fixtures, TypeScript y build. Browser en `demohamburgueseria`: modal sin Plus → created → post-add → attach → CartSheet → edit preserve → remove child (signature rebuild) → merge sin post-add → checkout summary sin submit. Fix P1 en `removeSingleCartLine`. Focus trap Tab añadido al sheet.

---

## 3. Veredicto

**PASS WITH NON-BLOCKING QA DEBT**  
**READY FOR HUMAN DEPLOY REVIEW**  
Cola nocturna termina aquí — sin commit/push/deploy automático.

---

## 4. Gate IMPL-1

Doc: `docs/public-catalog-post-add-upsell-impl-1.md`  
Estado: `PASS WITH NON-BLOCKING QA DEBT — SIMPLIFIED SINGLE-GROUP POST-ADD UPSELL IMPLEMENTED`  
Gate: `QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2 = ALLOWED`  
Source confirmado: sheet, CSS, helpers, `created` wiring, `parentCartLineId`, `attachUpsellChildToParent`, modal sin Plus.

---

## 5. Preflight

- Branch: `main`
- HEAD: `5dd9b41`
- Dirty tree: Cleanup/C1/U1 + docs + cambios ajenos previos (no limpios)
- Sin comandos destructivos

---

## 6. Arquitectura verificada

Único `config.upsellGroup`. Sin `placement` / `postAddUpsellGroup`. Modal = personalizaciones. Post-add solo `created` + candidatos. Attach vía C1. Simple = quick-add.

---

## 7. Source inventory

| Área | Path |
|------|------|
| Resolver | `lib/product-customization/resolve-upsell.ts` |
| Public config/summaries | `lib/product-customization/public.ts`, `public-shared.ts` |
| Modal | `components/public/catalog/customization-modal.tsx` |
| Trigger | `productNeedsCustomizationModal` → `hasCustomizations` |
| Sheet | `post-add-upsell-sheet.tsx` + `.module.css` |
| Candidates | `lib/cart/post-add-upsell.ts` |
| Wiring | `catalog-client.tsx` |
| C1 | `lib/cart/local.ts`, `signature.ts` |
| Cart sheet | `cart-sheet.tsx` |
| Checkout | `checkout-client.tsx` (no mutado en QA-2) |
| Order validation | `order-validation.ts` allowlist `upsellGroup.products` |
| Fixtures | `safe-error-details.verify.ts`, `upsell-resolution.verify.ts`, `post-add-upsell-contract.verify.ts`, `post-add-upsell-ui-contract.verify.ts` |

Una sola implementación — sin paralelo placement.

---

## 8. Search gate

Runtime `ts/tsx`: cero funcionales de `postAddUpsellGroup` / `UpsellPlacement` / `parseUpsellPlacement` / migration placement.  
Presentes: `outcome === "created"`, `parentCartLineId`, `attachUpsellChildToParent`, `getEligiblePostAddUpsellCandidates`, `PostAddUpsell`, `upsellGroup`.

---

## 9. Test data (read-only)

Tenant: `demohamburgueseria`  
- **A:** Doble Smash — customizations + Plus (Coca)  
- **B:** BBQ Bacon — customizations (Plus absence en modal verificado; grupos específicos UNVERIFIED en un intento de carga parcial)  
- **C:** Coca Cola 500ml — simple quick-add  
- **D/E:** misma config Doble Smash para merge / edit+child  

Sin mutaciones admin/productivas.

---

## 10–11. Modal QA / Plus absence

| ID | Result |
|----|--------|
| MODAL-01 | **BROWSER PASS** — Papas/Salsas/Agregados; sin Coca/Sumá una |
| MODAL-04 | **BROWSER PASS** — CTA disabled + required copy |
| MODAL-05 | **BROWSER PASS** — CTA `$15.000` con papas grandes+bacon |
| MODAL-02 | **PARTIAL** — BBQ abrió; sin Plus; detalle grupos UNVERIFIED en un sample |
| MODAL-03 | **BROWSER PASS** vía Coca simple (quick-add) |
| MODAL-06 | **BROWSER PASS** reopen fetch config ≈ 0 |

---

## 12–13. Trigger created / Suppression

| ID | Result |
|----|--------|
| TRIGGER-01 | **PASS** — persist parent → post-add; cart cerrado; Coca candidate |
| SUPPRESS-01 merged | **PASS** (post-fix) — qty 2, no post-add, cart |
| SUPPRESS-02 replaced | **PASS** — edit → cart, no post-add |
| SUPPRESS-05 simple | **PASS** |
| Failures | **FIXTURE PASS** (C1/U1) |

---

## 14. Candidate filtering

**FIXTURE PASS** U1-06…12. Browser: Coca visible desde `upsellGroup`, máx. candidatos respetado en helper.

---

## 15–17. Sheet / Attach / Multi-add

| ID | Result |
|----|--------|
| SHEET-01..05 | **PASS** — header/desc/CTA/Ahora no→Listo |
| ATTACH-01 | **PASS** — child qty1 lineTotal 3000; roots unchanged; Agregado |
| ATTACH-05 double tap | **PASS** — 1 child, +3000 una vez |
| ATTACH-04 | **PASS** — disabled, total igual |
| Multi-candidate | **FIXTURE PASS** U1-14; browser demo 1 candidate visible |

---

## 18–20. Already attached / Late conflict / Parent missing

FIXTURE PASS (U1-15/16/17 + C1). Browser already_attached visual PASS.

---

## 21–22. Dismiss / Frequency

Escape → CartSheet **PASS**. Listo **PASS** (IMPL). Opportunity memoria-only **SOURCE PASS**. Reload no reconstruye **SOURCE PASS**.

---

## 23–25. Quantity / Count / Totals

| Case | Evidence |
|------|----------|
| VALUE-01 | parent 14000 + child 3000 = 17000; roots 1 |
| VALUE-06 stepper | parent qty2 → child qty2 lineTotal 6000; total 34000; roots 1 |
| Checkout | Total `$25.000` con qty2 papas chicas (sin Plus); “2 productos” root-only |

---

## 26–27. Edit / Remove

| ID | Result |
|----|--------|
| EDIT-01 | **PASS** — Plus no en modal; child preservado; no post-add |
| REMOVE-01 | **PASS** — child gone; parent kept; no post-add |
| REMOVE signature | **PASS** post-fix — `upsells:` vacío; merge posterior ok |
| REMOVE-02 parent | **FIXTURE PASS** C1 |

Edit reset quantity→1 al Actualizar: deuda preexistente del builder modal (P3).

---

## 28–29. Cart sheet / Checkout boundary

CartSheet jerarquía/ADICIONAL/total/CTA **PASS**.  
Checkout `/b/demohamburgueseria/checkout` — resumen parent visible, total correcto, modalidad Envío/Retiro **0 fetch**.  
**SUBMIT REAL — NOT EXECUTED BY SCOPE**

---

## 30. Order-validation security

SOURCE: allowlist `config.upsellGroup.products`; rechaza self / fuera de grupo / etc. Sin pedido real.

---

## 31–33. Cache / Network / Performance

- Confirm+post-add: sin config POST adicional atribuible al sheet (attach 0 fetch).  
- Simple quick-add: 0 fetch.  
- Modalidad checkout: 0 fetch.  
- Transición modal→post-add inmediata; un overlay.

---

## 34–35. Accessibility / Responsive

Dialog semantics, Escape, close name, disabled CTAs, scroll lock **PASS**.  
Focus trap Tab **PASS** (fix QA-2).  
SCREEN READER — **UNVERIFIED**.  
Responsive: CSS + viewport browser; REAL-DEVICE — **UNVERIFIED**.

---

## 36–38. Preview / Closed-store / Stale

PREVIEW AUTH — **UNVERIFIED**  
CLOSED-STORE — **UNVERIFIED**  
Stale parent_missing / conflict — **FIXTURE PASS**

---

## 39–40. Race / Console

Double-tap attach **PASS**. Sin P0/P1/P2 de console en smoke principal.

---

## 41–42. Fixtures / Commands

| Command | Result |
|---------|--------|
| safe-error-details | ALL_PASS |
| upsell-resolution | ALL_PASS |
| post-add-upsell-contract | ALL_PASS |
| post-add-upsell-ui-contract | ALL_PASS |
| tsc --noEmit | PASS |
| npm run build | PASS |
| git diff --check (scoped U1/C1) | PASS |

---

## 43–45. Findings / Severity / Fixes

| Sev | Finding | Fix |
|-----|---------|-----|
| P1 | Remove child Plus no rebuild signature → merge fallaba / second parent | `removeSingleCartLine` rebuild via `buildParentConfigurationSignature` + C1 assertions |
| P2 | Focus trap Tab ausente en post-add | Trap Tab/Shift+Tab en sheet |
| P3 | Edit Actualizar resetea quantity a 1 | Documentado (builder modal preexistente) |
| P3 | Preview/real-device/SR/closed-store | Debt no bloqueante |

P0/P1/P2 abiertos: **ninguno**.

---

## 46. No-regression

Catálogo, modal, FAB, CartSheet, C1, Cleanup, checkout boundary, logging — intactos.

---

## 47. Remaining debt

- SCREEN READER — UNVERIFIED  
- REAL-DEVICE / iOS/PWA — UNVERIFIED  
- PREVIEW AUTH — UNVERIFIED  
- CLOSED-STORE — UNVERIFIED  
- Edit quantity preservation (P3)  
- Q1 histórica permanece BLOCKED en docs (histórico)

---

## 48. Deploy readiness

**READY FOR HUMAN DEPLOY REVIEW**  
No automatic deploy. No commit/push en esta fase.

---

## 49. Human review gate

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED
```

Revisar: reporte, diff (`local.ts` remove signature, sheet focus trap), fixtures, tsc/build, evidencia browser.

---

## 50. Rollback

Retirar sheet/wiring U1; restaurar Plus en modal; mantener single `upsellGroup` + C1 (incl. fix signature remove) + logging. Sin rollback DB. No restaurar D1/placement.

---

## 51. Próximo paso

Revisión humana → posible **PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1**.  
No preparar/ejecutar deploy en esta fase. **QUEUE ENDS HERE.**
