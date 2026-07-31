# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1 — Compact Premium UX for Public Customization Modal

## 1. Estado

**PASS WITH PREVIEW QA DEBT**

## 2. Resumen ejecutivo

Se pulió el modal público de personalización: header más compacto, grupos obligatorios full-width, grupos opcionales (y Plus) en grilla 2 columnas, opciones densas pero tocables (≥44px), CTA sticky `Agregar · $X` con micro-animación CSS del precio al cambiar el total (`prefers-reduced-motion` respetado). Se preservó PERF-FIX-1 (cache `slug:productId`, dedupe, reopen 0 POST). Sin post-add upsell, sin deps nuevas, sin tocar server/checkout/cart schema.

## 3. Contexto de entrada

`PERF-AUDIT-1` → fix recommended · `PERF-FIX-1` → PASS WITH PREVIEW QA DEBT. Deploy base `fb19a3a`.

## 4. Preflight

| Campo | Valor |
| ----- | ----- |
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty esperado | shell/cards/modal perf/docs |
| Dirty previo no-bloqueante | `app/super-admin/(protected)/actions.ts` (prior) |
| Dirty inesperado checkout/create_order/migrations | **no** |

## 5. Source audit

| Ítem | Hallazgo |
| ---- | -------- |
| Modal | `customization-modal.tsx` + module CSS; `loadState` controlado por CatalogClient |
| Groups | `CustomizationOptionGroup` shared (`isRequired` / minSelections) |
| Total | `computeVisualCustomizationTotal` (sin cambio de fórmula) |
| CTA prev | “Agregar al pedido” + `CustomizationPriceSummary` total row |
| Plus | `UpsellSuggestionGroup` in-modal (flujo intacto) |
| Footer | flex sticky en `.footer` del modal |

## 6. Implementación

1. `optionLayout` `list` \| `compact-grid` en option group / upsell / row compact styles.
2. Public modal: required → list; optional/Plus → compact-grid.
3. CTA embebe total; `showTotalRow={false}` en summary.
4. Price bump via class + keyframes 180ms; reduced-motion off.
5. Header/footer spacing + safe-area-bottom.

## 7. Modal header polish

Eyebrow “Armá tu pedido” · título producto · “Precio base $X” compacto · Cerrar `aria-label` + min 44px.

## 8. Required groups full-width

Papas `list` + badge “Obligatorio” · gate CTA intacto.

## 9. Optional groups compact grid

Salsas / Agregados / Plus: `grid` 2 cols (≥ ≥360px; 1 col ≤359px.

## 10. Option row/card compactness

`.optionRowCompact` padding menor, `min-height: 2.75rem`, label tocable completa.

## 11. CTA total final

| Check | Resultado |
| ----- | --------- |
| Label | `Agregar · $ 13.500,00` / con extra `$ 13.750,00` |
| Disabled sin Papas | sí |
| Enabled tras Papas | sí |
| Cálculo | mismo `computeVisualCustomizationTotal` |

## 12. Price micro-interaction

CSS-only `ctaPriceBump` 180ms · solo cuando cambia total · reduced-motion disables · sin fetch al seleccionar.

## 13. Footer sticky / safe area

`.footer` sticky (flex) · `padding-bottom: calc(... + env(safe-area-inset-bottom))`.

## 14. Existing Plus/upsell boundary

Plus sigue in-modal · compact grid visual only · **no** post-add upsell · cart parent+children igual.

## 15. PERF-FIX-1 regression check

| Caso | POSTs |
| ---- | ----: |
| First open A | **1** |
| Reopen A | **0** (no loading) |
| Simple Coca | **0** |
| Select option | **0** nuevos |

## 16. Product behavior QA

Papas gate → BBQ salsa +$250 → total 13.750 → add → cart `Papas` + `Salsas: BBQ (+$250)` · FAB 6→7.

## 17. Preview admin boundary

**UNVERIFIED** (sin auth). PASS WITH PREVIEW QA DEBT.

## 18. Checkout boundary

`/checkout`: **Enviar pedido** visible · NO submit · NO pedido real.

## 19. Runtime/browser QA

Local `demohamburgueseria/catalogo` · screenshot confirma header, Papas list, Salsas 2-col, CTA total. Viewports multi-device: emulación browser; Android real = DEVICE QA deuda menor (no bloquea).

## 20. Accessibility

`role=dialog` · close aria · option labels · CTA aria con total · disabled state · focus-visible · reduced-motion.

## 21. Performance sanity

Sin fetch page-load nuevos · sin fetch por selección · cache reopen 0 · sin framer-motion/deps · CSS-only anim.

## 22. Seguridad / no-regression

No DB/RLS/RPC/migrations · No checkout/create_order · No cart schema/localStorage · No server validation/`noStore`/cache tags · No image/env/CSP/PWA · No post-add upsell · No deploy/commit.

## 23. Resultado de comandos

| Command | Result |
| ------- | ------ |
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| lint | no ejecutado |

## 24. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| Info | Preview admin deep no validado | sin auth | deuda |
| Info | Android real no medido | browser only | DEVICE debt menor |
| Resuelto | CTA sin total / densidades | `Agregar · $X` + grids | shipped |

## 25. Deuda residual actualizada

1. Preview admin QA.
2. Post-add upsell (próxima spec).
3. Cart sheet usability polish.
4. Dirty tree acumulado + super-admin actions prior.

## 26. Rollback plan

Revertir solo CSS/layout modal + optionLayout props + CTA/bump + docs. **No** revertir PERF-FIX-1 cache/dedupe.

## 27. Próximo paso

**PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1** (alternativa: `PUBLIC-CATALOG-CART-SHEET-USABILITY-1`)
