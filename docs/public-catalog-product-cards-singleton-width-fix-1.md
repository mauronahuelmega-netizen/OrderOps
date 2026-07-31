# PUBLIC-CATALOG-PRODUCT-CARDS-SINGLETON-WIDTH-FIX-1 — Keep Single-Product Categories at Grid Card Width

## 1. Estado

**PASS WITH PREVIEW QA DEBT**

## 2. Resumen ejecutivo

Se eliminó el override CSS `:has(> :only-child)` que forzaba 1 columna full-width en categorías con un solo producto. Bebidas (Coca Cola) ahora conserva el ancho de columna de la grilla 2-col (~175px en 390), alineada a la izquierda. Multi-producto y última card impar no se estiran. Solo CSS. `tsc`/`build` PASS. Preview admin deep no re-smoke.

## 3. Contexto de entrada

- Previa: `PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1` → PASS WITH PREVIEW QA DEBT
- Deuda: `.catalog-product-list:has(> :only-child) { grid-template-columns: 1fr; }`
- Deploy base: `fb19a3a`

## 4. Preflight

| Campo | Valor |
| ----- | ----- |
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty tree | shell/cart + cards + docs esperados |
| Runtime dirty inesperado | **no** |

## 5. Source audit

| Ítem | Hallazgo |
| ---- | -------- |
| Grid | `.catalog-product-list` → `repeat(2, minmax(0, 1fr))` |
| Fallback angosto | `@media (max-width: 359px)` → 1 col |
| Override problema | `.catalog-product-list:has(> :only-child)` → `1fr` (mobile+todos) |

## 6. Implementación

Removido el bloque:

```css
.catalog-product-list:has(> :only-child) {
  grid-template-columns: minmax(0, 1fr);
}
```

en `app/globals.css`. Sin JS, sin cambios de card markup.

## 7. Single-product category behavior

390×844 Bebidas (1 producto):

| Métrica | Valor |
| ------- | ----- |
| `grid-template-columns` | `175px 175px` |
| card width | **175px** (no full ~362) |
| `left` | **14px** (izquierda) |

## 8. Multi-product category regression

| Categoría | Count | Resultado |
| --------- | ----- | --------- |
| COMBOS | 5 | 2 cols; última card **175px** left 14 (no stretch) |
| EMPANADAS | 2 | 175 + 175 |
| PIZZAS | 3 | última 175 left 14 |

## 9. Runtime/browser QA

| Check | Resultado |
| ----- | --------- |
| Bebidas ancho normal | PASS |
| Combos 2-col | PASS |
| Última impar no stretch | PASS |
| + simple (Coca Cola) | PASS (FAB 2→3) |
| FAB icon+qty | PASS |
| Checkout boundary | PASS — Enviar pedido visible, no submit |
| Preview deep | UNVERIFIED |

## 10. Performance sanity

Solo CSS · sin server calls · sin fetch · sin JS · sin memo/loader/sizes changes.

## 11. Seguridad / no-regression

No DB/RLS/RPC/checkout/create_order/cart schema/customization/cache/image/env/CSP/PWA/deps/deploy/commit.

## 12. Resultado de comandos

| Comando | Resultado |
| ------- | --------- |
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** (Compiled successfully) |
| lint | no ejecutado |

## 13. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P3 | Preview deep UNVERIFIED | sin auth smoke | Deuda |
| Info | `<360px` sigue 1 col | responsive previo | OK |

## 14. Deuda residual actualizada

1. Preview admin deep smoke
2. Real device Android
3. **PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1**
4. previousSlug uncommitted / Image Transforms / upsell roadmap

## 15. Rollback plan

Reintroducir solo el bloque `:has(> :only-child)` en `app/globals.css`. No revertir Product Cards Grid completo ni Shell/Cart.

## 16. Próximo paso

**PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1**
