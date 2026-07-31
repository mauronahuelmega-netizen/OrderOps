# PUBLIC-CATALOG-POST-ADD-UPSELL-DOMAIN-1

## Placement Domain, Admin Configuration & Public Surface Resolution

**Fecha:** 2026-07-31  
**Branch:** `main` @ `5dd9b41`  
**Estado:** **PASS WITH LOCAL DB MIGRATION QA DEBT** · **PASS WITH ADMIN RUNTIME QA DEBT**  
**Flags:** `NO POST-ADD UI IMPLEMENTED` · `NO CART CONTRACT CHANGES` · `NO REMOTE MIGRATION` · `NO REAL ORDERS`

---

## 1. Estado

Dominio de `placement` implementado en código + migración versionada. DB local no corrió (Docker ausente). Admin/public runtime contra schema con columna: UNVERIFIED. `tsc`/`build`/fixtures PASS.

---

## 2. Resumen ejecutivo

Se introdujo `upsell_groups.placement` (`in_modal` | `post_add`, default/backfill `in_modal`), unicidad `(business_id, target_type, target_id, placement)`, admin create/edit/cards, validación server-side, y resolución pública independiente por superficie. El modal sigue usando solo `upsellGroup` (in_modal). La config/cache incluye `postAddUpsellGroup` para U1 sin UI. `hasUpsell` / apertura de modal = solo in_modal. Sin `both`, sin cart contract, sin sheet post-add.

---

## 3. Preflight

| Item | Valor |
|------|-------|
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty ajeno | Catálogo/cart/checkout polish, globals, super-admin, docs, tmp — no limpiado |
| Cart / checkout actions / package.json | No tocados por D1 (cart local dirty preexistente) |

---

## 4. Source audit

| Área | Hecho |
|------|-------|
| Constraint previo | `upsell_groups_one_per_target_unique (business_id, target_type, target_id)` |
| También | `upsell_groups_id_business_id_unique (id, business_id)` — intacto |
| Actions | `createUpsellGroupAction`, `updateUpsellGroupAction`, `toggleUpsellGroupAction` |
| UI | `plus-edit-modal.tsx`, `plus-suggestion-card.tsx`, `plus-suggestions-tab.tsx` |
| Resolver | Era singular sin placement; product > category; unavailable product → category fallback |
| `hasUpsell` | `productNeedsCustomizationModal = hasCustomizations \|\| hasUpsell` |

---

## 5. Constraint anterior

`upsell_groups_one_per_target_unique` → **dropped** en migración nueva.

---

## 6. Migración

`supabase/migrations/20260731233000_post_add_upsell_group_placement.sql`

Orden: add column → backfill `in_modal` → default NOT NULL → check → drop old unique → add `upsell_groups_one_per_target_placement_unique`.

---

## 7. Placement DB representation

`text` + `upsell_groups_placement_check (placement in ('in_modal','post_add'))`. Sin enum PG.

---

## 8. Backfill

`UPDATE … SET placement = 'in_modal' WHERE placement IS NULL`. Ninguna fila convertida a `post_add`.

---

## 9. Check constraint

`upsell_groups_placement_check`

---

## 10. Unique constraint

`upsell_groups_one_per_target_placement_unique (business_id, target_type, target_id, placement)`

---

## 11. Database types

`types/database.ts` → `upsell_groups` Row/Insert/Update incluyen `placement`. Regenerar tras apply local.

---

## 12. Shared placement domain

`lib/product-customization/upsell-placement.ts`  
`UPSELL_PLACEMENTS`, labels, helpers, `parseUpsellPlacementInput`, `upsellTargetPlacementKey`. Sin `both`.

---

## 13. Server validation

`parseUpsellGroupInput` → placement; create default `in_modal` si omitido; update sin campo → preserve; `both`/unknown → error customer-facing.

---

## 14. Create action

Insert incluye `placement`. Pre-check + 23505: “Ya existe un grupo para este destino en esa ubicación.”

---

## 15. Update action

Update placement si `placementProvided`; conflict check por target+placement; 23505 mismo copy.

---

## 16. Duplicate handling

Mismo target + distinto placement = OK. Mismo target + mismo placement = bloqueado (pre-check + constraint).

---

## 17. Admin create UI

Radios fieldset “Dónde mostrar” · default “En el modal” · helpers + disclaimer post-add pending.

---

## 18. Admin edit UI

Carga placement real; permite cambiar si no hay colisión; target sigue read-only.

---

## 19. Admin cards

Badge En el modal / Después de agregar; post_add + “Configurado · superficie pública pendiente”. Keys por `group.id`.

---

## 20. Resolver por placement

`lib/product-customization/resolve-upsell.ts` → `resolveUpsellForProduct(..., placement)`.

---

## 21. Product/category precedence

Dentro del placement: product-target disponible gana; si no, category; unavailable product no bloquea category (RESOLVE-E preservado).

---

## 22. Public types

`PublicUpsellGroupView.placement: UpsellPlacement`

---

## 23. Public config shape

```ts
upsellGroup: PublicUpsellGroupView | null        // in_modal
postAddUpsellGroup: PublicUpsellGroupView | null // post_add
```

---

## 24. `upsellGroup` in-modal

Modal / summaries / `hasUpsell` usan solo resolución `in_modal`.

---

## 25. `postAddUpsellGroup`

Rellenado en la misma carga de config; cache `slug:productId` lo almacena; **no render** en D1.

---

## 26. Modal trigger semantics

`hasUpsell` = upsell efectivo **in_modal**. Solo `post_add` → producto simple / sin modal por upsell (SUMMARY-B).

---

## 27. Simple legacy boundary

Sin conversión V2. Quick-add 0 POST si no hay customizations ni in_modal upsell.

---

## 28. Corpus/cache

Select de `upsell_groups` incluye `placement`. Un POST first-open carga ambos efectivos. Sin segundo action. Invalidación existente (`revalidateCustomizationPaths`) sin tags nuevos.

---

## 29. Preview boundary

Admin preview mapper resuelve ambos; UI preview del builder sigue el modal (`upsellGroup` in_modal). Sin simulación post-add.

---

## 30. Cache invalidation

Create/update/toggle group (incl. cambio de placement) → mismo helper previo. **RLS CHANGES: NONE**.

---

## 31. RLS/tenancy

Sin policies nuevas. Placement no es input público.

---

## 32. Performance/network

Presupuesto: first configurable 1 POST; reopen 0. Sin UI → sin fetch de imágenes post_add.

---

## 33. Admin QA

| Caso | Resultado |
|------|-----------|
| ADMIN-A..G | **UNVERIFIED** (sin DB local + sin auth smoke en esta corrida) |

---

## 34. Public QA

| Caso | Resultado |
|------|-----------|
| PUBLIC-A..G | **UNVERIFIED** runtime (schema local sin apply) |
| Fixtures resolver/summary | **PASS** |

---

## 35. Migration runtime

**LOCAL DB MIGRATION RUNTIME — UNVERIFIED** (Docker/Supabase local no disponible). SQL revisado manualmente. **NO REMOTE MIGRATION**.

---

## 36. Tests

`npx tsx lib/product-customization/upsell-placement.verify.ts` → **ALL_PASS** (parser, FormData, identities, RESOLVE-A..E, SUMMARY triggers).

---

## 37. Resultado de comandos

| Comando | Resultado |
|---------|-----------|
| `npx tsx …upsell-placement.verify.ts` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` (paths D1) | PASS |
| `supabase status` | FAIL — Docker down |

---

## 38. Hallazgos y severidad

| Sev | Hallazgo |
|-----|----------|
| — | P0/P1 ninguno en código |
| Debt | Migration local no aplicada |
| Debt | Admin/public runtime QA pendiente post-apply |

---

## 39. Seguridad/no-regression

- Tenant-scoped mutations  
- Placement solo admin  
- Modal no muestra post_add  
- Cart/signature/checkout/`create_order` sin cambios D1  
- Order validation accepta product ids de ambos grupos (prep U1, sin attach)

---

## 40. Deuda residual

1. Apply migration local + SQL invariants  
2. Admin browser QA A–G  
3. Public regression A–G  
4. Regenerar types desde DB tras apply  

---

## 41. Deploy order (futuro)

1. Aplicar migración DB  
2. Verificar backfill + constraints  
3. Desplegar código Domain  
Migración es compatible con código viejo (ignora columna). Código nuevo **requiere** columna → migración primero.

---

## 42. Rollback

- Código: revertir D1; DB migrada sigue con default in_modal.  
- DB: solo si no hay filas `post_add`; no ejecutar en esta fase.

---

## 43. Próximo paso

**PUBLIC-CATALOG-POST-ADD-UPSELL-CART-CONTRACT-1**  
No U1 sheet hasta D1 apply + C1.
