# PUBLIC-CATALOG-CUSTOMIZATION-POLISH — Handoff 2026-08-14

## Executive summary

Bloque **PUBLIC CATALOG + CUSTOMIZATION MODAL** cerrado en branch `cursor-handoff-public-catalog-ui-redesign`.

Entregables principales:

- **Catalog chrome:** header document-flow; categories único sticky `top: 0`; full-bleed surface; hairlines; elevación downward-only.
- **Product detail modal:** mobile full-width; radii top-only; imagen 1:1 edge-to-edge; jerarquía precio/copy.
- **Customization modal:** spinner/viewport polish; **P1 quantity preservation V2**; Papas radio; Salsas checkbox circular; Extras 2-row cards; motion micro-interactions; information hierarchy simplificada.

Sin cambios DB/migrations en este bloque de polish. Sin pedidos reales en QA.

---

## Architecture decisions

| Decisión | Detalle |
|----------|---------|
| Header | `position: relative` — normal document flow, no hide-on-scroll |
| Categories | Único sticky chrome (`top: 0`), full-bleed opaque band |
| Customization state | `CustomizationSelectionStateV2` — qty por optionId |
| Papas/Salsas handlers | **Group-scoped V2** — no legacy round-trip en modal público |
| Max display | Visual simplificado en tiles/grupos opcionales; lógica + `sr-only` + disabled states intactos |
| Modal boundaries | Product description oculta en customization; preservada en product detail / DB |

---

## Functional fixes

### EXTRA QUANTITY RESET (P1)

- **Root cause:** `onSelectOption` hacía `selectionV2ToLegacyOptionIds` → `normalizeLegacySelectionToV2`, forzando `qty=1` en todos los grupos al cambiar Papas/Salsas.
- **Fix:** `selectSingleOptionInV2` / `toggleMultipleOptionInV2` en `selection-v2.ts` — patch solo del grupo objetivo + `normalizeSelectionToV2`.
- **Regression:** `order-qty-helpers.verify.ts` cross-group cases + runtime Doble Smash PASS.

---

## Visual polish final

| Área | Estado |
|------|--------|
| Catalog header/categories | Static header + sticky categories + elevation |
| Product detail modal | Full-width mobile shell polish |
| Customization controls | Radio/checkbox congruence; extras 2-row; compaction |
| Extras motion | Card transition, entrance, press, qty bump; reduced-motion |
| Information hierarchy | Product desc hidden; optional badges/helpers hidden; Papas required preserved |

---

## Files / areas affected

**Public catalog chrome:** `public-business-header.tsx`, `.module.css`, `app/globals.css` (categories)

**Customization modal:** `customization-modal.tsx`, `customization-modal.module.css`

**Shared customization UI:** `customization-option-group.tsx`, `customization-option-row` CSS module, `customization-shared.module.css`

**Selection V2:** `selection-v2.ts`, `order-qty-helpers.verify.ts`, related public-shared/snapshot helpers

**Deleted legacy:** `use-hide-on-scroll.ts`, `public-header-visibility.ts`

**Docs:** phase docs under `docs/public-catalog-*` + `docs/customization-modal-*`

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `order-qty-helpers.verify.ts` | PASS |
| `npm run lint` | FAIL — ESLint 9 circular JSON (known debt) |

Local browser smoke: catalog load, modal open, Papas required, Salsa toggle, Bacon×3 cross-group preservation, extras max `+` disable, CTA pricing — PASS.

---

## Device QA

**ANDROID REAL-DEVICE FINAL SMOKE = PENDING**

No hay confirmación explícita del product owner sobre build final en Android Chrome real para este cierre. Local browser + unit verify PASS.

---

## Known debt

- ESLint 9 circular JSON config (`plugins.react` closes circle)
- Historical micro-phase docs: algunos chrome-elevation followups referenciados solo en `CURRENT_PHASE` / living memory
- Android real-device final smoke pendiente antes de production deploy

---

## Next recommended starting point

1. Android Chrome final smoke en `/b/demohamburgueseria/catalogo` (customization cross-group qty + sticky categories).
2. Si PASS → merge PR `cursor-handoff-public-catalog-ui-redesign` → production path Vercel.
3. No reabrir P1 handler path con legacy round-trip.

Primary handoff doc for new chats: **this file**.
