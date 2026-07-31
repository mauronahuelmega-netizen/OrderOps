# PUBLIC-CATALOG-POST-ADD-UPSELL-CART-CONTRACT-1

## Deterministic Parent Mutation Outcomes, Child Attachment, Signature Safety & Edit Preservation

**Fecha:** 2026-07-31  
**Branch:** `main` @ `5dd9b41`  
**Estado:** **PASS WITH CART RUNTIME QA DEBT** · **D1 LOCAL DB MIGRATION QA DEBT — INHERITED**  

Flags:

- `NO POST-ADD UI IMPLEMENTED`
- `NO DATABASE CHANGES`
- `NO CHECKOUT CHANGES`
- `NO REAL ORDERS`
- `BROWSER RUNTIME — NOT RUN, D1 SCHEMA UNAVAILABLE`

---

## 1. Estado

Contrato puro de carrito cerrado. Helpers, callsites, fixtures, `tsc` y `build` PASS. Runtime browser no ejecutado por schema D1 no aplicado.

---

## 2. Resumen ejecutivo

C1 cambia `mergeCustomizedSelectionIntoCart` a un resultado discriminado con `parentCartLineId` definitivo; extrae `buildUpsellChildCartLine`; agrega `attachUpsellChildToParent`, `preserveAttachedUpsellsForEdit`, y helpers de signature hipotética. Fallos no mutan. Callsites del catálogo/modal manejan error sin abrir sheet ni fingir éxito. Sin UI post-add. Sin cambios de DB/checkout/`create_order`/keys.

---

## 3. Preflight

| Item | Valor |
|------|-------|
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty previo | D1 + polish catálogo/cart; `lib/cart/local.ts` ya dirty |
| D1 migration | versionada; no aplicada local; no remota |
| Checkout / create_order / package.json / keys | sin cambios C1 |
| Acciones destructivas | ninguna |

---

## 4. Source audit

- Merge previo: `LocalCartItem[]` solamente; replace remove-then-append podía colisionar signatures.
- Children: co-built en `buildCartLinesFromCustomizationSelection` vía suggested products del `upsellGroup` in-modal.
- Signature: `product:{id}|groups:...|upsells:{sorted ids}` — sin quantity/precios/nombres.
- Count: root-only (`getCartItemCount` intacto).
- Edit: modal restaura options + in-modal upsells; post-add no está en modal.
- Order-validation D1: allowlist = productos de grupos efectivos in_modal **y** post_add del producto — scope por config, no all-business.

---

## 5. Tipos reales del carrito

`LocalCartLegacyItem` · `LocalCartItemV2` (`schemaVersion: 2`, `cartLineId`, `itemKind: "product" | "upsell"`, `parentCartLineId`, `selectedGroups`, `configurationSignature`, `finalUnitPrice`, `lineTotal`, `displaySummary`, …) · `LocalCartItem` union · guards `isV2ParentCartItem` / `isUpsellChildForParent`.

---

## 6. Contrato anterior

```ts
mergeCustomizedSelectionIntoCart(...) → LocalCartItem[]
```

---

## 7. Nuevo MergeCustomizedSelectionResult

```ts
export type MergeCustomizedSelectionResult =
  | { outcome: "created" | "merged" | "replaced"; items: LocalCartItem[]; parentCartLineId: string }
  | { outcome: "signature_conflict"; items: LocalCartItem[]; parentCartLineId: string; conflictingParentCartLineId: string }
  | { outcome: "parent_missing"; items: LocalCartItem[]; parentCartLineId: string };
```

Éxitos de spec: `created | merged | replaced`. Fallos explícitos evitan mutaciones inseguras.

---

## 8. Created semantics

Sin root con misma signature y sin `replaceCartLineId` → append parent+children; `parentCartLineId = parent.cartLineId`.

---

## 9. Merged semantics

Misma signature, no edit → qty suma sobre root existente; children remapeados al ID sobreviviente; `parentCartLineId` = ID preexistente (no el provisional del builder).

---

## 10. Replaced semantics

Con `replaceCartLineId` válido → conserva ID; preserve post-add elegibles; rebuild signature; sin merge silencioso. Nunca habilita post-add UI (U1).

---

## 11. Failure outcomes

`signature_conflict` / `parent_missing` → `items` = carrito original; sin mutación.

---

## 12. Final parentCartLineId

Siempre el ID definitivo del root afectado (creado, sobreviviente o replace id). Caller no debe usar IDs provisionales del builder tras `merged`.

---

## 13. Callsite migration

- `components/public/catalog/catalog-client.tsx` — `handleConfirmCustomizationSelection`
- `components/public/catalog/customization-modal.tsx` — pasa `eligiblePostAddProductIds` en edit; no cierra si `ok:false`

UX éxito: persist `items`, abrir cart sheet. Fallo: error customer-facing, modal abierto, sin sheet.

Copy: conflicto → “Ya tenés esta combinación en tu pedido.” · missing → “No pudimos actualizar este producto. Volvé a intentarlo.”

---

## 14. Child builder compartido

`buildUpsellChildCartLine({ suggested, parentCartLineId, categoryId, quantity, ... })` usado por builder inicial y attach. Equivalencia cubierta en fixtures (salvo IDs nuevos).

---

## 15. Attach input

```ts
attachUpsellChildToParent({
  items: LocalCartItem[];
  parentCartLineId: string;
  suggestedProduct: PublicUpsellSuggestedProduct;
})
```

No acepta child prearmado ni precio arbitrario separado.

---

## 16. Attach result

```ts
export type AttachUpsellChildResult =
  | { outcome: "attached"; items; parentCartLineId }
  | { outcome: "already_attached"; items; parentCartLineId }
  | { outcome: "signature_conflict"; items; parentCartLineId; conflictingParentCartLineId }
  | { outcome: "parent_missing"; items };
```

---

## 17. Idempotencia

Mismo `parentCartLineId + suggested.productId` ya presente → `already_attached`, sin dup/qty/total/signature change.

---

## 18. Parent validation

Solo `isV2ParentCartItem`. Legacy / child / id inexistente → `parent_missing`.

---

## 19. Self-product behavior

`suggested.id === parent.productId` → fail-safe `already_attached` (no-op). Sin quinto outcome público.

---

## 20. Hypothetical signature

`buildParentConfigurationSignature` · `buildCartConfigurationSignatureWithUpsell` → delegan a `buildCartConfigurationSignature` (dedupe + sort). Sin concatenación manual.

---

## 21. Signature conflict

Attach/edit calculan signature hipotética; si otro root V2 coincide → `signature_conflict`, sin mutar, sin merge de quantities.

---

## 22. Atomicity

Fallos fallan completo; no drop parcial de children inválidos en conflicto de edit.

---

## 23. Quantity

`child.quantity = parent.quantity`; `lineTotal = unitPrice × parent.quantity`. `setV2ParentQuantity` escala children (sin cambio de contrato).

---

## 24. Count

`getCartItemCount` root-only; attach no cambia count.

---

## 25. Totals

Attach suma `suggested.price × parent.quantity` vía `getCartItemsTotal`. `already_attached`/conflict/missing: total intacto.

---

## 26. Line ordering

Child insertado tras parent + siblings existentes. Roots no relacionados no se reordenan.

---

## 27. Edit flow

Cart sheet Editar → modal → Actualizar → build → merge(replace) con `eligiblePostAddProductIds` desde `config.postAddUpsellGroup`.

---

## 28. Post-add child identification

Allowlist = product IDs de `postAddUpsellGroup.products` (caller). No asumir “ausente del modal” = post-add.

---

## 29. Edit preservation

`preserveAttachedUpsellsForEdit` mantiene elegibles; sync qty; modal children ganan por productId.

---

## 30. Invalid child removal

No elegible / self / no allowlist → drop; IDs en `removedIneligibleProductIds` (tests); sin orphan/root.

---

## 31. Edit collision

Tras combine modal+preserved, conflict → no mutar; estado original intacto.

---

## 32. Remove hierarchy

`removeCartLineWithChildren` / remove child — fixtures confirman; sin cambio de contrato C1.

---

## 33. Order-validation security

**Source PASS (D1).** Allowlist = grupos efectivos del producto (in_modal + post_add). No ampliación C1. No `itemKind === "upsell"` solo.

---

## 34. Preview boundary

Helpers puros; storage preview aislado en caller; sin keys nuevas; sin lógica iframe en `lib/cart`.

---

## 35. Performance

O(n) sobre carrito; 0 fetch/actions/listeners. Requests C1: **0**.

---

## 36. Runtime QA

**BROWSER RUNTIME — NOT RUN, D1 SCHEMA UNAVAILABLE**

---

## 37. Fixtures

`lib/cart/post-add-upsell-contract.verify.ts` — merge/attach/signature/qty/count/total/edit preserve/remove/equivalencia.  
D1: `lib/product-customization/upsell-placement.verify.ts`.

---

## 38. Resultado de comandos

| Comando | Resultado |
|---------|-----------|
| `npx tsx lib/cart/post-add-upsell-contract.verify.ts` | ALL_PASS |
| `npx tsx lib/product-customization/upsell-placement.verify.ts` | ALL_PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` (archivos C1) | PASS |
| `git diff --check` (CURRENT_PHASE histórico D1+) | residual trailing whitespace markdown — preexistente; entrada C1 sin trailing WS |

---

## 39. Hallazgos y severidad

Sin P0/P1. Deuda: browser runtime + D1 migration local.

---

## 40. Seguridad / no-regression

Sin schema/checkout/RPC/keys. Fallos no mutan. IDs no expuestos en copy. Precios desde suggested validado, no client arbitrary.

---

## 41. D1 debt inherited

`D1 LOCAL DB MIGRATION QA DEBT` · `ADMIN RUNTIME QA DEBT` · no remote migration.

---

## 42. Deuda residual

U1 sheet · browser QA post D1 apply · (opcional) E2E signature-change dedicado previo.

---

## 43. Rollback

Revertir: merge result, attach, preserve, signature helpers, callsites, fixtures, docs C1. **No** revertir D1 placement/migration/resolver/admin.

---

## 44. Próximo paso

**PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1** usando `outcome === "created"`, `parentCartLineId`, `config.postAddUpsellGroup`, `attachUpsellChildToParent`.
