# PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1

## 1. Estado

**PASS WITH PREVIEW QA DEBT** · **PASS WITH DEVICE QA DEBT** · **SUBMIT REAL NOT EXECUTED BY SCOPE**

Fecha: 2026-07-31  
Branch: `main` @ `5dd9b41`  
Modo: **QA-only (Modo A)** — sin fixes de código  
Runtime: `http://localhost:3000/b/demohamburgueseria/*`  
Viewport: emulado ~390×844  
Deploy base (referencia): `fb19a3a` · Live: `https://orderops.vercel.app`

---

## 2. Resumen ejecutivo

QA integrado del funnel público catálogo → modal → FAB → cart sheet → checkout **sin pedidos reales**. Se validó conteo customer-facing root-only, precios parent/child separados, Plus remove/edit/qty/mix, remove parent sin orphans, cache modal (1 POST first / 0 reopen), checkout delivery/pickup con 0 fetch, y empty states. Preview admin y closed-store runtime quedan en deuda. CLI `tsc`/`build` PASS. `createPublicCheckoutOrderAction` / `create_order` / payload / cart schema **intactos**.

---

## 3. Modo final: QA-only o QA + fix

**QA-only (Modo A).** Ningún P0/P1/P2 reprodujo necesidad de Mode B. Sin cambios de código en esta fase.

---

## 4. Preflight

| Item | Valor |
|------|-------|
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty previo | Catálogo/cart/checkout polish + docs + tmp + super-admin actions + globals — **no limpiado** |
| `app/b/[slug]/checkout/actions.ts` | sin diff |
| `lib/cart/types.ts` / `package.json` / `supabase/` | sin cambios de esta fase |
| Tenant | `demohamburgueseria` · `business_id=e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |

---

## 5. Source audit

| Superficie | Archivos clave | Rol |
|------------|----------------|-----|
| Catálogo | `catalog-client.tsx` | cards, quick-add, modal open, FAB, cache `slug:productId` |
| Modal | customization modal + config fetch | required gate, Plus, CTA total |
| Cart FAB/sheet | `cart-sheet.tsx` + module CSS | hierarchy, qty, remove, checkout CTA |
| Count/pricing UI | `lib/cart/local.ts` (`getCartItemCount`, `buildHierarchicalCartRows`, `getCartItemsTotal`) | root-only count; totals unchanged |
| Checkout | `checkout-client.tsx` + module CSS | summary, modality, sticky CTA |
| Header | `public-business-header.tsx` | checkout static vs catalog sticky |
| Action | `app/b/[slug]/checkout/actions.ts` | no tocar / no ejecutar submit real |

---

## 6. Arquitectura integrada

```
catalogo → product card / quick add → (detail) → customization modal
  → localStorage cart (v1 legacy + v2 hierarchical)
  → FAB (root count) → cart sheet → checkout summary/CTA
```

Conteo UI: Σ quantity(roots). Plus children billable/visibles, no inflan count. Totals: `getCartItemsTotal` (todas las líneas).

---

## 7. Entorno

- Browser IDE MCP · localhost:3000  
- Network monkeypatch `window.__qaNet` (Next-Action POST)  
- Prefer UI real sobre seed sintético (salvo clear storage para empty/cache reset)

---

## 8. Storage scope

| Key | Uso |
|-----|-----|
| `orderops-cart-v2:e21b8fc2-…` | V2 parents + linked upsells |
| `orderops-cart:e21b8fc2-…` | Legacy simples (Coca independiente) |

Preview isolation: no auditada en runtime (sin auth).

---

## 9. Baseline vacío

**PASS.** FAB ausente; sheet “Sin productos” / Seguir comprando (fase previa + reconfirmado tras clear).

---

## 10. Producto simple

**E2E-01 PASS (UI).** Quick-add Coca · 0 config POST · FAB 1→2 · sheet “2 productos” / $6.000 · checkout alineado.

---

## 11. Parent sin Plus

**E2E-02 PASS (parcial integrado).** Modal; alert Papas; CTA disabled hasta required; first open **1 POST**.

---

## 12. Parent con Plus

**E2E-03 PASS.** Papas grandes + Big Mac + Bacon + Coca Plus · modal **$ 18.250** · FAB **1 producto** · sheet parent **$ 15.250** / child **$ 3.000**.

---

## 13. Remove Plus runtime

**E2E-04 PASS (UI).** Remove child only · count sigue **1** · customizations intactas · child gone · sin orphan.

---

## 14. Edit/re-add Plus

**E2E-05 PASS.** Edit cache-hit **0 POST** · selections restauradas (CDP) · re-add Coca · Actualizar **$ 18.250** · **1 producto** / un child.

---

## 15. Quantity parent

**E2E-06 PASS.** Qty 1→2→3 · FAB/sheet **2** luego **3** (no 4/6) · child `lineTotal` escala (qty 3: parent **$ 45.750**, child **$ 9.000**).

---

## 16. Carrito mixto

**E2E-07 PASS.** Parent×3 + Plus + Coca independiente×2 → FAB/sheet **5 productos**. Precios sheet: parent **$ 45.750**, Plus **$ 9.000**, Coca indep. **2 × $ 3.000 = $ 6.000**.

---

## 17. Edit/signature

**E2E-08 PARTIAL.** Edit restore/re-add validado en E2E-05 sin duplicar línea. Cambio deliberado de opción (merge/dedupe signature) **no** re-ejecutado como caso dedicado → deuda menor no bloqueante.

---

## 18. Remove parent

**E2E-09 PASS.** Eliminar Doble Smash → Plus child desaparece · FAB **2** (solo Coca indep.×2) · v2 `[]` · sin orphans.

---

## 19. Modal cache/network

**E2E-10 PASS.** First open A (Doble Smash) **1 POST** · reopen A **0** · open B (BBQ Bacon) **+1** (total 2) · reopen B **0** · Ver Coca simple **0**.

---

## 20. Checkout

**E2E-11 PASS (sin submit).** Mix: **3 productos** · Coca **$ 6.000** · parent **$ 14.000** · Plus **$ 3.000** · Total/CTA **$ 23.000** · header `headerCheckout` static · toggle Envío/Retiro **0** Next-Action · address hide en pickup · **SUBMIT REAL NOT EXECUTED BY SCOPE**.

---

## 21. Preview

**E2E-13 UNVERIFIED** — sin sesión admin. → **PASS WITH PREVIEW QA DEBT**.

---

## 22. Closed-store

**E2E-14 UNVERIFIED runtime** (no mutar sesión). Gate por source audit previo intacto. → deuda documentada.

---

## 23. Count matrix

| Escenario | Raw lines (aprox.) | Roots count UI | Resultado |
|-----------|--------------------|----------------|-----------|
| Simple Coca×2 | 1 legacy qty2 | 2 | PASS |
| Parent+Plus | 2 (parent+child) | 1 | PASS |
| Parent qty3+Plus | 2 lines qty3 | 3 | PASS |
| Mix parent3+Coca2 | v2 parent+child + legacy | 5 | PASS |
| Remove parent | legacy Coca×2 | 2 | PASS |
| Empty | 0 | FAB hidden | PASS |

---

## 24. Total matrix

| Escenario | Parent | Child Plus | Indep. | Total UI |
|-----------|--------|------------|--------|----------|
| E2E-03 | 15250 | 3000 | — | 18250 |
| E2E-06 qty3 | 45750 | 9000 | — | 54750 |
| E2E-07 mix | 45750 | 9000 | 6000 | 60750 (sheet) |
| E2E-11 checkout mix | 14000 | 3000 | 6000 | **23000** |

---

## 25. Storage integrity

Tras remove parent: v2 vacío; v1 Coca×2. Tras clear+reload: ambos `[]`. Linked upsell siempre con `parentCartLineId`. Sin orphans observados.

---

## 26. Network

| Acción | Next-Action POST |
|--------|------------------|
| Quick-add simple | 0 |
| First open configurable A/B | 1 cada uno |
| Reopen / edit cache-hit | 0 |
| Qty / remove / modality toggle | 0 |
| Submit real | **no ejecutado** |

---

## 27. Console

Sin errores de aplicación bloqueantes observados en flujos UI. Logging de harness QA (`__qaNet`) solo en página.

---

## 28. Responsive

Emulación mobile ~390×844 **PASS**. Hardware real **UNVERIFIED** → **PASS WITH DEVICE QA DEBT**.

---

## 29. Accessibility

Radios/checkboxes/labels y aria-labels de FAB/steppers presentes. Snapshot a11y a veces lag vs CDP (nota de tooling, no defecto producto). Radios checkout `readonly` en tree a11y — interacción vía label/parent OK.

---

## 30. Defectos encontrados

| Sev | Defecto | Estado |
|-----|---------|--------|
| — | P0/P1/P2 | **ninguno** |
| P3 | E2E-08 signature-change dedicado no corrido | deuda QA |
| P3 | Preview / closed-store / device real | deuda conocida |
| Tooling | A11y snapshot lag vs DOM | documentado |

---

## 31. Fixes aplicados, si existen

Ninguno (Modo A).

---

## 32. Resultado de comandos

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0) |
| `git diff --stat app/b/[slug]/checkout/actions.ts` | limpio |
| `git diff --check` (superficies cart/checkout) | sin issues reportados |

---

## 33. Seguridad/no-regression

- Sin pedidos reales / sin success navigation por submit  
- Action/payload/`create_order`/schema/pricing domain intactos  
- Tenancy storage keyed por `business_id`  
- Preview isolation no regresionada por source (runtime UNVERIFIED)

---

## 34. Deuda residual

1. Preview admin autenticado  
2. Device hardware real  
3. Closed-store runtime sin mutar sesión  
4. E2E-08 signature-change dedicado  
5. Post-add upsell (fuera de alcance — próxima fase spec)

---

## 35. Rollback, si hubo cambios

N/A — sin cambios de código en esta fase.

---

## 36. Próximo paso

**PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1** (spec-only).  
Alternativa si se prioriza integridad: `PUBLIC-CART-HIERARCHY-INTEGRITY-AUDIT-1`.

---

## Apéndice — mapa E2E

| ID | Resultado |
|----|-----------|
| E2E-01 | PASS |
| E2E-02 | PASS |
| E2E-03 | PASS |
| E2E-04 | PASS (UI) |
| E2E-05 | PASS |
| E2E-06 | PASS |
| E2E-07 | PASS |
| E2E-08 | PARTIAL |
| E2E-09 | PASS |
| E2E-10 | PASS |
| E2E-11 | PASS · SUBMIT NOT EXECUTED |
| E2E-12 | PASS |
| E2E-13 | UNVERIFIED |
| E2E-14 | UNVERIFIED runtime / source OK |
