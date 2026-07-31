# PUBLIC-CATALOG-UPSELL-REALIGNMENT-CLEANUP-1

## Remove Unnecessary Placement Domain, Restore Single Plus Group, Recover Public Customization & Preserve Safe Cart Foundations

**Fecha:** 2026-07-31  
**Branch:** `main` @ `5dd9b41`  
**Estado:** **PASS — D1 REMOVED, SINGLE-UPSELL BASELINE RESTORED, CATALOG RECOVERED**

Flags:

- `NO DATABASE MUTATIONS`
- `NO PRODUCTION ADMIN MUTATIONS`
- `NO CHECKOUT SUBMIT`
- `NO REAL ORDERS`
- `NO DEPLOY`
- `NO COMMIT`
- `NO PUSH`
- `NO POST-ADD UI IMPLEMENTED`
- `SUBMIT REAL — NOT EXECUTED BY SCOPE`

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 = ALLOWED
```

---

## 1. Estado

Cleanup completo. Placement D1 retirado. Un solo `upsellGroup`. Catálogo y modal recuperados. C1 conservado y generalizado. Logging seguro conservado. U1 no implementada.

---

## 2. Resumen ejecutivo

Se descartó la arquitectura de `placement` / `postAddUpsellGroup`. El código vuelve a consultar el schema productivo (sin columna `placement`). Summaries cargan; modal muestra Plus in-modal temporalmente. C1 (`MergeCustomizedSelectionResult`, `attachUpsellChildToParent`) permanece.

---

## 3. Decisión de producto

Un único grupo Plus por target (producto o categoría). La superficie post-add es solo presentación futura (IMPL-1) sobre el mismo grupo — no un segundo grupo ni columna DB.

---

## 4. Arquitectura descartada

D1: `placement`, `in_modal|post_add`, migración, admin radios, `postAddUpsellGroup`, resolver por superficie.

**D1 placement architecture — SUPERSEDED BY UPSELL REALIGNMENT**

---

## 5. Arquitectura final

`resolveUpsellForProduct` sin placement · product > category · un `upsellGroup` · modal muestra Plus · trigger `hasCustomizations || hasUpsell`.

**C1 cart safety — RETAINED AND GENERALIZED**

---

## 6. Preflight

`main` @ `5dd9b41` · dirty D1+C1+catalog previos · migration D1 untracked no aplicada.

---

## 7–8. Error previo / PostgREST

**ROOT CAUSE CONFIRMED**

```text
code: 42703
message: column upsell_groups.placement does not exist
```

Capturado vía logging enriquecido (Corpus query failed / Failed to load public summaries).

---

## 9–10. Source audit / Manifest

| Símbolo/path | Origen | Acción |
|--------------|--------|--------|
| migration `20260731233000_…placement.sql` | D1 | eliminada |
| `upsell-placement.ts` | D1 | eliminado |
| `upsell-placement.verify.ts` | D1 | eliminado |
| `postAddUpsellGroup` | D1 | retirado |
| `placement` selects/admin | D1 | retirado |
| `resolve-upsell.ts` | D1→generic | simplificado sin placement |
| `attachUpsellChildToParent` | C1 | conservado |
| `MergeCustomizedSelectionResult` | C1 | conservado |
| `eligibleAttachedUpsellProductIds` | C1 renamed | generalizado |
| `safe-error-details` | runtime fix | conservado |

---

## 11–12. Migration

Gate A: **nunca aplicada** (prod sin columna; error 42703). Archivo eliminado del working tree. Sin migration inversa.

---

## 13–21. Types / domain / admin / public

- `types/database.ts` — sin `placement` en `upsell_groups`
- `public-shared` — solo `upsellGroup`
- Admin create/update — unicidad por target; copy “máximo 1 por destino”
- Constraint handling: `23505` → copy admin; sin `…placement_unique`
- Summaries select sin `placement`
- Modal: Plus visible (`Sumá una bebida` / Coca)
- Trigger: `hasCustomizations \|\| hasUpsell` (sin adelantar IMPL-1)

---

## 22–23. C1

Conservado: outcomes, attach, signature, count/totals.  
Generalizado: `eligibleAttachedUpsellProductIds` desde `config.upsellGroup.products`.

---

## 24–27. Order validation / preview / cache / logging

Allowlist = único `upsellGroup`. Preview mapper single-group. Cache/perf intactos. Logging `safe-error-details` presente.

---

## 28–30. Files

**Created:** `upsell-resolution.verify.ts`, este doc.  
**Deleted:** migration D1, `upsell-placement.ts`, `upsell-placement.verify.ts`.  
**Modified:** public/shared/admin/actions/cart/catalog/modal/types/docs/memory.

---

## 31. Search gate

Runtime `*.{ts,tsx,sql}`: cero `postAddUpsellGroup` / `UpsellPlacement` / `eligiblePostAdd` / selects `placement`. Solo menciones en fixtures de serialización / asserts de ausencia.

---

## 32–33. Fixtures / commands

| Comando | Resultado |
|---------|-----------|
| safe-error-details.verify | ALL_PASS |
| upsell-resolution.verify | ALL_PASS |
| post-add-upsell-contract.verify | ALL_PASS |
| tsc --noEmit | PASS |
| npm run build | PASS |

---

## 34–37. Catalog / runtime / network / console

| Caso | Resultado |
|------|-----------|
| BASE-01 catálogo | PASS — HTTP 200, productos/categorías |
| BASE-02 configurable | PASS — modal Doble Smash |
| BASE-03 Plus in modal | PASS — “Sumá una bebida” + Coca |
| Post-add sheet | ABSENT (PASS) |
| Summaries error | AUSENTE post-fix |
| Viewport | ~mobile catalog |

Network: sin failed placement queries post-fix.  
`PREVIEW AUTH QA — UNVERIFIED` (no bloqueante).

---

## 38. Checkout boundary

`SUBMIT REAL — NOT EXECUTED BY SCOPE`

---

## 39–40. Security / no-regression

`DATABASE MUTATIONS — NONE` · `RLS/RPC/CHECKOUT — NONE` · C1 helpers presentes · polish modal intacto.

---

## 41–42. Findings / severity

Sin P0/P1/P2 abiertos. CSS muerto `.placement*` en admin module — P3 residual.

---

## 43. Remaining debt

IMPL-1: mover Plus fuera del modal visualmente; sheet post-add; trigger `hasCustomizations` only. Q1 re-run. Preview auth. Dead CSS cleanup opcional.

---

## 44. Queue gate

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 = ALLOWED
```

---

## 45. Rollback

Source: reintroducir D1 desde historial git si hiciera falta. DB: N/A (nunca aplicada). Conservar C1 + logging.

---

## 46. Próximo paso

**PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1**
