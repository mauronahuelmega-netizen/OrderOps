# PUBLIC CATALOG UI REDESIGN — CURSOR HANDOFF 2026-08-06

## 1. Estado Git

| Campo | Valor |
|-------|-------|
| Branch actual | `cursor-handoff-public-catalog-ui-redesign` |
| Commit WIP local | `cc1deb8` — `wip: public catalog ui redesign codex handoff` |
| Base previa | `3b6160d` — `docs(public-catalog): record residual roadmap deployment` |
| Working tree al retomar | Limpio (sin staged/unstaged/untracked al confirmar estado) |
| Push | No |
| Deploy | No |
| Main remoto | Intacto |
| Backup local previo | `.handoff-backups/codex-public-catalog-ui-20260806-205708` |

## 2. Contexto general

Codex completó una etapa intensiva de UX/UI polish sobre el catálogo público mobile-first, trabajando directamente sobre el código real del repo local (no un sandbox aislado del working tree productivo).

El trabajo quedó consolidado en el commit WIP local `cc1deb8` sobre la branch `cursor-handoff-public-catalog-ui-redesign`. Esos cambios **no** están en remoto y **no** fueron desplegados.

Cursor retoma desde ese commit WIP local para la próxima fase de polish (CartSheet), con las mismas reglas de no-push / no-deploy / no-touch de backend.

## 3. Alcance congelado

Esta etapa **NO tocó** ni **debe tocar** en fases siguientes de este handoff:

- DB / schema
- Migrations
- RLS
- RPC
- Server actions
- Packages / lockfiles
- Checkout payload / checkout action
- Orders / admin dashboard
- Pricing / cart helpers salvo los ya existentes y usados por el polish visual
- Deploy

## 4. Fases completadas durante la etapa Codex

Fases cerradas (en orden de registro del roadmap de polish):

1. `PUBLIC-CATALOG-UX-UI-REDESIGN-FORENSIC-AUDIT-1`
2. `PUBLIC-CATALOG-UX-UI-REDESIGN-SPEC-CLOSURE-1`
3. `PUBLIC-CATALOG-SHELL-HEADER-HERO-SEARCH-POLISH-1`
4. `PUBLIC-CATALOG-CATEGORIES-GRID-CARDS-POLISH-1`
5. `PUBLIC-CATALOG-MOBILE-DENSITY-CORRECTIVE-PASS-1`
6. `PUBLIC-CATALOG-MOBILE-DENSITY-CORRECTIVE-PASS-1-FOLLOWUP`
7. `PUBLIC-CATALOG-HERO-RAIL-ALIGNMENT-FIX-1`
8. `PUBLIC-CATALOG-HERO-ASPECT-RATIO-16X9-FIX-1`
9. `PUBLIC-CATALOG-HERO-COPY-HIERARCHY-POLISH-1`
10. `PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1`
11. `PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1-FOLLOWUP`
12. `PUBLIC-CATALOG-BURGER-MENU-FULL-HEIGHT-NAV-POLISH-1`
13. `PUBLIC-CATALOG-BURGER-MENU-DARK-SURFACE-TOKEN-POLISH-1`
14. `PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-FORENSIC-AUDIT-1`
15. `PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1`
16. `PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-BACKDROP-COPY-FOLLOWUP-1`
17. `PUBLIC-CATALOG-OVERLAY-SCROLL-LOCK-HEADER-FREEZE-1`
18. `PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FORENSIC-AUDIT-1`
19. `PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FLAT-POLISH-1`
20. `PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-DARK-TOKEN-FOLLOWUP-1`
21. `PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-STICKY-DENSITY-COPY-FOLLOWUP-1`
22. `PUBLIC-CATALOG-POST-ADD-UPSELL-FORENSIC-AUDIT-1`
23. `PUBLIC-CATALOG-POST-ADD-UPSELL-SURFACE-TOKEN-A11Y-POLISH-1`
24. `PUBLIC-CATALOG-POST-ADD-UPSELL-LIST-DENSITY-POLISH-1`
25. `PUBLIC-CATALOG-PRODUCT-CARD-QUICK-ADD-DENSITY-FOLLOWUP-1`
26. `PUBLIC-CATALOG-PRODUCT-CARD-PRICE-NOWRAP-QUICK-ADD-CENTER-FIX-1`
27. `PUBLIC-CATALOG-PRODUCT-CARD-PRICE-FROM-VISUAL-SIMPLIFY-1`
28. `PUBLIC-CATALOG-PRODUCT-CARD-FOOTER-ANCHOR-ALIGNMENT-FIX-1`
29. `PUBLIC-CATALOG-POST-ADD-UPSELL-ROW-COMPOSITION-FOLLOWUP-1`

## 5. Decisiones UX/UI cerradas

- Sistema visual **flat**.
- Superficies **tokenizadas** light/dark.
- **Sin sombras estáticas**.
- Header flat.
- Hero compacto con imagen **16:9**.
- Product cards mobile-first en **2 columnas**.
- Product card **sin `Desde` visible** en card; precio **nowrap**.
- Product card footer estable con precio y plus alineados.
- Product detail con imagen **1:1** y copy simplificado.
- Customization modal con opciones/extras tokenizadas, sticky footer y dark parity.
- Overlay scroll lock compartido con freeze de header.
- Burger menu full-height dark/light.
- Post-add upsell con sheet tokenizado, rows horizontales, imagen 1:1, precio único y CTA `Agregar`.

## 6. QA realizado

- QA visual Android real para catálogo mobile.
- QA light/dark en ProductCards.
- QA light/dark en Post-add Upsell.
- QA de row composition del Post-add.
- Validaciones TypeScript / build / HTTP reportadas por Codex.
- Browser/network profundo del Post-add: aceptado como **no bloqueante**.
- No se crearon pedidos reales.
- No hubo deploy.

## 7. Estado del Post-add Upsell

### PASS — POST-ADD UPSELL READY TO CLOSE

Validado / preservado:

- Permite agregar más de un producto plus.
- Candidate pasa a `Agregado`.
- Sheet sigue abierto.
- Footer cambia a `Listo`.
- Dismiss abre CartSheet.
- Created-only preservado.
- Cart / signatures preservados.
- DB / admin content preservado.

### Deuda aceptada (no bloqueante)

| Prioridad | Deuda |
|-----------|-------|
| P3 | Botón `Agregar` puede tener demasiado peso visual |
| P3 | Rows podrían compactarse levemente |
| P3 | Estado `Agregado` podría refinarse visualmente |

Estas deudas **no bloquean** la siguiente fase.

## 8. Gate actual

```
QUEUE_GATE: PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1 = ALLOWED
```

Registro explícito:

`PUBLIC-CATALOG-POST-ADD-UPSELL-INTERACTION-QA-FIX-1` queda **SKIPPED / MERGED INTO CART QA** porque el flujo principal del upsell ya fue validado visualmente con múltiples plus y llegada al CartSheet.

## 9. Próxima fase

### `PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1`

Objetivo preliminar:

- Pulir CartSheet para alinearlo con el nuevo sistema visual del catálogo.
- Revisar parent + extras.
- Indentación visual de adicionales.
- Quantity controls.
- Remove / edit.
- Totals.
- Footer checkout.
- Dark / light parity.
- Mobile density.
- Safe-area.
- Scroll lock.
- **Sin cambios funcionales** en checkout / cart persistence.

## 10. Restricciones para la próxima fase

- No tocar DB / RPC / actions / packages.
- No cambiar checkout payload.
- No cambiar creación de órdenes.
- No cambiar helpers de signatures salvo bug probado.
- No romper preview cart isolation.
- No romper plus / upsell children.
- No tocar ProductCard salvo regresión visual directa.
- No tocar Product Detail ni Customization salvo regresión directa.
- No deploy.

## 11. Archivos probablemente relevantes para la próxima fase

Inspección futura (no modificar en este handoff):

- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/cart-sheet.module.css`
- `components/public/catalog/catalog-client.tsx`
- `lib/cart/local.ts`
- `lib/cart/signature.ts` (singular; no `signatures.ts`)
- Docs relacionados existentes, entre otros:
  - `docs/public-catalog-cart-sheet-usability-1.md`
  - `docs/public-catalog-shell-cart-surfaces-polish-1.md`
  - `docs/public-catalog-post-add-upsell-cart-contract-1.md`
  - `docs/public-catalog-cart-edit-quantity-preservation-fix-1.md`
  - `docs/product-customization-cart-1-cart-signature-pricing-display.md`
  - docs post-add upsell en `docs/public-catalog-post-add-upsell-*.md`

## 12. Handoff operativo para Cursor

Antes de cualquier fase futura, Cursor debe:

1. Confirmar branch (`cursor-handoff-public-catalog-ui-redesign`).
2. Confirmar status (working tree).
3. Revisar diff desde `3b6160d` si necesita contexto del polish Codex.
4. **No asumir** que remoto contiene estos cambios.
5. **No** usar pull / reset / restore / clean.
6. Trabajar de forma incremental.
7. Documentar cada fase en `docs/`.

---

**Documento creado:** 2026-08-06  
**Scope de este archivo:** solo registro de handoff; sin cambios de código.
