# ADMIN-CATALOG-PREVIEW-LAYOUT-FINAL-DEPLOY-1 — Controlled Deploy for Final Preview Layout Polish

## 1. Estado

**DEPLOYED WITH NON-BLOCKING QA DEBT**

Fecha: 2026-07-28  
Commit layout: `0dce5b3`  
Branch: `main`  
Deploy URL: https://orderops.vercel.app

## 2. Resumen ejecutivo

Se desplegó a producción el polish final de layout (`LAYOUT-QA-FIX-2` + `WIDTH-PARITY-FIX-1`): header en columna izquierda, rail 560px, shell sin `max-width: 1360px` (paridad operational 1600px con Products). Smoke prod crítico PASS. Deuda P3 residual conocida.

## 3. Commit / deploy

| Campo | Valor |
|-------|-------|
| Commit | `0dce5b3` — Polish admin catalog preview layout |
| Parent | `311568b` (docs mobile-feel deploy) |
| Mobile-feel ya live | `5843fd9` (no re-incluido) |
| Branch | `main` |
| Push | `311568b..0dce5b3` → `origin/main` |
| Deploy URL | https://orderops.vercel.app |
| Vercel status | LIVE (`shellMaxNone`, `headerInsideContent`, sin 1360) |
| Hora aprox. | 2026-07-28 ~17:35–17:50 UTC |

## 4. Archivos incluidos

### Código

- `components/admin/products/catalog-preview-shell.module.css`
- `components/admin/products/catalog-preview-shell.tsx`
- `app/admin/(protected)/products/preview/page.tsx`

### Docs

- `docs/admin-catalog-preview-shell-layout-qa-fix-2.md`
- `docs/admin-catalog-preview-shell-width-parity-fix-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

### Stats

7 files, +311 / −19

### Excluido (fuera de scope)

- `docs/admin-catalog-preview-mobile-feel-deploy-1.md` (nota local menor)
- `tsconfig.tsbuildinfo`
- docs product-customization / stock / tmp

## 5. Validación local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL preexistente (ESLint circular) |

## 6. Source release checklist

| Ítem | Estado |
|------|--------|
| Shell `max-width: none` / sin 1360 | PASS |
| Header dentro contentColumn | PASS |
| content max-width 560px | PASS |
| Phone top Δ0 / centrado / sticky | PASS |
| Sin tocar mobile-feel / clear-cart / CSP / DB | PASS |

## 7. Smoke producción

Tenant `demohamburgueseria` · sin pedidos creados.

## 8. Products width comparison

@1440 prod:

| Métrica | Products | Preview |
|---------|----------|---------|
| container maxW | 1600px | 1600px |
| layout/shell left | 104 | 104 |
| shell fills layout | — | yes (`max-width: none`) |

```txt
Preview usa el mismo ancho útil que /admin/products.
Header alineado.
Ritmo horizontal consistente.
```

## 9. Admin preview producción

PASS — título, Modo seguro, Vaciar/Copiar, checklist, iframe preview, sin Recargar.

## 10. Layout producción

```txt
Phone alineado con header. (Δ=0)
Phone centrado en derecha. (Δ=0)
Phone no pegado al borde.
Frame/viewport alineados. (pad 16/16)
Sin overflowX.
```

Sticky desktop PASS. Cursor + pan en iframe PASS.

## 11. Clear cart producción

```txt
Vaciar → preview keys [].
Public keys intactas.
Toast / flow PASS.
```

(Agregar 1 producto → Vaciar → keys vacías)

## 12. Mobile-feel regression

```txt
Cursor: presente en iframe.
Pan enabled: true.
Anti-selection CSS intacta (no regresada por layout).
```

Momentum flick sintético no re-probado en detalle (P3 automation); código ya live desde `5843fd9`.

## 13. Checkout guard producción

```txt
Confirmación deshabilitada.
Sin Enviar pedido.
Top-level /admin/products/preview.
Sin pedido / success.
```

## 14. Público normal producción

```txt
/catalogo: sin pan/cursor.
/checkout: Enviar pedido.
```

## 15. Product Customization / Settings smoke

PASS — `/admin/products/customizations` y `/admin/settings/public/catalogo`.

## 16. Deuda residual

| ID | Sev | Nota |
|----|-----|------|
| Device touch real | P3 | Pendiente FINAL-QA-DEVICE |
| Clipboard toast automation | P3 | Preexistente |
| Press feedback | P3 | Preexistente |
| Momentum synthetic flake | P3 | Preexistente |
| Lint ESLint circular | P3 | Histórico |
| mobile-feel-deploy-1.md dirty local | P3 | Nota docs no staged |

## 17. Rollback

No ejecutado.

```bash
git revert 0dce5b3
git push origin main
```

## 18. Próximo paso

**ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1**
