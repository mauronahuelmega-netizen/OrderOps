# ADMIN-CATALOG-PREVIEW-SHELL-WIDTH-PARITY-FIX-1 — Products Page Width Parity

## 1. Estado

**PASS**

Fecha: 2026-07-28  
Branch: `main` @ `311568b` (dirty tree local; sin commit/push de esta fase)

## 2. Resumen ejecutivo

Se eliminó el `max-width: 1360px` del shell de preview para que ocupe el mismo ancho operacional que `/admin/products` (`AdminPageLayout size="operational"` → `admin-shell__page-container` **1600px**). El rail izquierdo sigue en 560px; el phone permanece centrado en la columna derecha.

## 3. Bug visual detectado

Preview se sentía más angosta/centrada que Productos porque `.shell` imponía `max-width: 1360px; margin-inline: auto` por encima del contenedor operational de 1600px.

## 4. Patrón de ancho de Products

| Capa | Regla |
|------|--------|
| `AdminPageLayout size="operational"` | `max-width: none; width: 100%` |
| `.admin-shell__page-container:has(.admin-page-layout--operational)` | `max-width: 1600px` |
| Default page-container (no operational) | `max-width: 1280px` |

Products y Preview ya usaban `size="operational"`. El cuello de botella era solo el shell interno.

## 5. Cambios realizados

Solo CSS (`catalog-preview-shell.module.css`):

- `.shell`: `max-width: none; margin-inline: 0; width: 100%`
- Desktop grid gap: `clamp(48px, 6vw, 96px)` (1440+: hasta 96px)
- Se mantiene `.contentColumn { max-width: 560px }`, centrado de phone, sticky, frame padding

Sin cambios TSX / lógica.

## 6. Paridad visual Products / Preview

Medido @1440:

| Métrica | Products | Preview |
|---------|----------|---------|
| container max-width | 1600px | 1600px |
| layout left | 104 | 104 |
| layout / shell width | 1289 | 1289 |
| header left | 104 | 104 |

```txt
Preview usa el mismo ancho útil que /admin/products.
Header alineado con Products.
Mismo ritmo horizontal del admin.
```

## 7. Layout desktop

@1440 tras el fix:

| Métrica | Valor |
|---------|-------|
| header↔phone top Δ | 0 |
| content max-width | 560px |
| phone centered Δ | 0 |
| frame/pad | 422 / 16/16 |
| sticky | sticky |
| overflowX | false |
| gap viewport right | ~140px |

```txt
Phone centrado en derecha.
Phone no pegado al borde.
Phone alineado con header.
Frame/viewport alineados.
```

## 8. Responsive QA

| Viewport | Resultado |
|----------|-----------|
| 1440 | paridad Products; grid; sticky |
| 390 | flex column; sticky static; sin overflowX |

## 9. Regression funcional

| Check | Resultado |
|-------|-----------|
| Vaciar carrito (toast) | PASS |
| Toasts | PASS |
| postMessage / mobile-feel / checkout / público | No tocados |

## 10. Deuda residual

| ID | Sev | Nota |
|----|-----|------|
| LAYOUT-FIX-2 + WIDTH-PARITY aún no en prod | P2 | Requieren commit/push autorizado |
| Clipboard / device touch / press / lint | P3 | Preexistentes |

## 11. Rollback

Revertir solo `catalog-preview-shell.module.css` al estado pre WIDTH-PARITY (restaurar `max-width: 1360px; margin-inline: auto` si se desea el shell más estrecho).

## 12. Próximo paso

**ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1** (tras autorizar commit/push del polish acumulado de layout)

---

## CLI

- `npx tsc --noEmit` → PASS  
- `npm run build` → PASS  
- `npm run lint` → FAIL preexistente (ESLint circular)
