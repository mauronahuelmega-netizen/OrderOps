# PUBLIC-CATALOG-CHECKOUT-SUMMARY-VISUAL-QA-FIX-1

## 1. Estado

**PASS WITH PREVIEW QA DEBT** · **PASS WITH DEVICE QA DEBT** · **SUBMIT REAL NOT EXECUTED BY SCOPE**

Fecha: 2026-07-30  
Branch: `main` @ `5dd9b41`  
Runtime: `http://localhost:3000/b/demohamburgueseria/*`

---

## 2. Resumen ejecutivo

Microfix visual/presentacional:

1. **Conteo customer-facing**: `getCartItemCount` ahora suma solo quantities de roots jerárquicos (legacy + V2 parents); upsell children vinculados **no** inflan el contador.
2. **Precios parent/child**: checkout summary y cart sheet muestran `parent.lineTotal` y `child.lineTotal` por separado (ya no `groupTotal` junto al parent).
3. **Header comercial**: sticky real sobre el form en checkout → variante checkout-specific `position: static` + hide-on-scroll desactivado.
4. **CTA sticky**: `scroll-padding-bottom` / `scroll-margin-bottom` reforzados; foco en Dirección/Nombre/Notas sin cobertura del footer (CDP).

Payload, action, `create_order`, pricing formula (`getCartItemsTotal`), cart schema: **intactos**.

---

## 3. Preflight

| Item | Valor |
|------|-------|
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty previo | Catálogo/cart/checkout polish + docs + tmp + super-admin actions + globals — no limpiado |
| `app/b/[slug]/checkout/actions.ts` | sin diff |
| `lib/cart/types.ts` / package.json | sin diff |
| `lib/cart/local.ts` | limpio pre-fase → modificado en esta fase |

---

## 4. Source audit

| Área | Hallazgo |
|------|----------|
| `getCartItemCount` | Sumaba `item.quantity` de **todas** las líneas (incl. upsells) |
| Callsites | Solo visual: `catalog-client.tsx`, `cart-sheet.tsx`, `checkout-client.tsx` → **Alternativa A** |
| `buildHierarchicalCartRows` | Roots = legacy + `itemKind==="product"`; orphans upsell **ignorados** |
| Checkout summary | Mostraba `parent.lineTotal + childrenTotal` a la derecha del parent |
| Cart sheet | Mostraba `groupTotal` a la derecha del parent + child con `formatUpsellAssociatedLine` (`+$`) |
| Header | `.public-business-header` globals: `position: sticky; top: 0; z-index: 18` |
| CTA | `position: sticky; bottom: 0` en module checkout |

---

## 5. Problema visual original

Parent + Plus aparentaba doble cobro: precio derecho del parent = group total, mientras el child listaba `+$X`. Contador: parent+child → “2 productos” en lugar de “1”.

---

## 6. Regla customer-facing de conteo

`customerFacingCount = Σ quantity(root)` donde root ∈ hierarchical rows (legacy | V2 parent). Children upsell no cuentan.

---

## 7. Helper encontrado o creado

**Alternativa A** — se corrigió `getCartItemCount` en `lib/cart/local.ts` (exclusivamente visual). Documentado cambio semántico en JSDoc.

Antes: `Σ quantity(all lines)`  
Después: `Σ quantity(hierarchical roots)`

---

## 8. Callsites auditados

| Callsite | Uso | Acción |
|----------|-----|--------|
| `catalog-client.tsx` → CartBar | FAB badge + aria-label | hereda fix |
| `cart-sheet.tsx` | “N producto(s)” | hereda fix |
| `checkout-client.tsx` | summary meta | hereda fix |

Sin otros callers. Sin tests unitarios previos; fixtures `tsx` ejecutados.

---

## 9. Root / child semantics

- Legacy independiente: root  
- V2 `itemKind: "product"`: root  
- V2 `itemKind: "upsell"` con `parentCartLineId`: child, excluido del count  
- Remove child: count estable; total baja  
- Qty parent: count sigue quantity del parent  

---

## 10. Orphan behavior

`buildHierarchicalCartRows` **ignora** upsells sin parent presente. No se reparentan ni reparan. Orphan-only cart: count 0 pero `getCartItemsTotal` podría > 0 (preexistente). Documentado; sin cambio de schema.

---

## 11. Parent own price

Fuente: **`parent.lineTotal`** (explícito). Unit hint `N × finalUnitPrice` solo si `quantity > 1`.

---

## 12. Upsell child price

Fuente: **`child.lineTotal`**. UI: nombre + importe propio (sin embeber en texto `+$` junto a un groupTotal parent).

---

## 13. Total general

Sin cambios: `getCartItemsTotal` + `formatPublicCatalogCurrency`. Runtime ejemplo: parent 15250 + child 3000 = **18250**.

---

## 14. Cart FAB

Runtime COUNT-A: aria-label `Ver pedido, 1 producto` tras agregar Coca simple. COUNT-C/E vía helper fixtures + checkout seed (mismo helper).

---

## 15. Cart sheet

Misma regla de precios (parent `lineTotal`, child `lineTotal`). Runtime simple: header “1 producto”. Parent+Plus precio: mismo markup que checkout (fix aplicado).

---

## 16. Checkout summary

Runtime seed: “1 producto”; Doble Smash `$ 15.250,00`; Coca `$ 3.000,00`; CTA Total `$ 18.250,00`.

---

## 17. Singular / plural

`1 producto` / `N productos` / empty “Sin productos” (cart sheet). Sin “1 productos”.

---

## 18. Header overlap audit

| Prop | Valor |
|------|-------|
| Selector | `.public-business-header` |
| Owner | `PublicBusinessHeader` + globals |
| Antes | `position: sticky; top: 0; z-index: 18` |
| Problema | Sticky real: contenido del form scrollea debajo del header |

No era solo stitching full-page.

---

## 19. Resultado header

Checkout-specific: `styles.headerCheckout` → `position: static` (especificidad sobre globals); `useHideOnScroll({ disabled: … \|\| isCheckoutRoute })`; `data-checkout-static="true"`. Catálogo permanece sticky (`data-checkout-static="false"`).

CDP checkout mid-scroll: `position: static`, header sale del viewport (top negativo). Address vs header: **no intersect**.

---

## 20. Sticky CTA / focus audit

`--checkout-sticky-footer-space` + `scroll-padding-bottom` + `scroll-margin-bottom` en sections/textarea. CDP 390×844: Nombre/Notas/Dirección **not coveredByFooter**.

---

## 21. Responsive

390: overflowX false. 320: no regresiones esperadas (CSS previo apila segmented). Desktop: sticky footer `static`, space var 0.

---

## 22. Accessibility

FAB aria-label usa count corregido; children subordinados; precios distinguibles; remove child aria intacto. Sin VO/TalkBack PASS.

---

## 23. Performance / network

Helper puro O(n). Sin fetch/actions/deps. Submit no ejecutado.

---

## 24. Preview boundary

Mismo helper + storage scope preview. Runtime iframe auth: **UNVERIFIED**.

---

## 25. Runtime count matrix

| Caso | Resultado |
|------|-----------|
| COUNT-A simple Coca | PASS FAB+sheet “1 producto” |
| COUNT-B parent alone | PASS (tsx / source) |
| COUNT-C parent+Plus | PASS checkout “1 producto” + tsx |
| COUNT-D multi Plus | PASS tsx (same algorithm) |
| COUNT-E qty 3 + Plus | PASS tsx count=3 |
| COUNT-F mixto 3+2 | PASS tsx count=5 |
| COUNT-G remove Plus | source: count unchanged |
| COUNT-H/I | source: parent qty drives count |
| COUNT-J preview | UNVERIFIED |

---

## 26. Runtime price matrix

| Caso | Resultado |
|------|-----------|
| PRICE-A parent+child | PASS 15250 / 3000 / total 18250 |
| PRICE-B multi | PASS algorithm (own lineTotals) |
| PRICE-C qty>1 | PASS unit hint only when qty>1 |
| PRICE-D simple | PASS no regression |
| PRICE-E cart sheet | PASS fix aplicado (misma ambigüedad) |

---

## 27. Resultado de comandos

| Command | Exit |
|---------|------|
| `npx tsc --noEmit` | 0 |
| `npm run build` | 0 |
| `git diff --check` (scoped) | 0 |
| tsx fixtures COUNT/PRICE | ALL_PASS |

---

## 28. Hallazgos

| Sev | Hallazgo |
|-----|----------|
| Fixed | Contador inflado por upsells |
| Fixed | groupTotal ambiguo en parent |
| Fixed | Header sticky sobre checkout |
| Info | Orphans excluidos de rows/count (preexistente) |
| Debt | Preview auth / device real |

---

## 29. Seguridad / no-regression

Sin DB/RLS/RPC/migration; sin checkout `actions.ts`; sin schema/types; sin `getCartItemsTotal` formula change; sin localStorage keys; sin Places/phone/deps; sin order real; sin deploy/commit/push.

---

## 30. Deuda residual

Preview QA · Device QA · COUNT-G/H/I solo source (remove/qty UI exhaustivo en fase integrada).

---

## 31. Rollback plan

Revertir:

- `lib/cart/local.ts` (`getCartItemCount`)
- `components/public/checkout/checkout-client.tsx` + `.module.css`
- `components/public/catalog/cart-sheet.tsx` + `.module.css`
- `components/public/business/public-business-header.tsx` + `.module.css`
- docs de esta fase

---

## 32. Próximo paso

**PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1**  
Luego **PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1**.
