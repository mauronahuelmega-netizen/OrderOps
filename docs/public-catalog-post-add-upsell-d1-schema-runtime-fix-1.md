# PUBLIC-CATALOG-POST-ADD-UPSELL-D1-SCHEMA-RUNTIME-FIX-1

## Active Database Identification, Placement Schema Alignment, Safe Diagnostics & Public Catalog Recovery

**Fecha:** 2026-07-31  
**Branch:** `main` @ `5dd9b41`  
**Estado:** **BLOCKED — PRODUCTION MIGRATION OUT OF SCOPE**  
**Sub-estados:** `SAFE LOCAL TARGET UNAVAILABLE` · `REMOTE DEV MIGRATION NOT AUTHORIZED` · `DIAGNOSTICS IMPROVED` · `CATALOG NOT RECOVERED` · `NO POST-ADD UI` · `NO PRODUCTION MIGRATION` · `NO DEPLOY` · `NO COMMIT` · `NO PUSH` · `NO REAL ORDERS`

---

## 1. Estado

`next dev` apunta a **producción** Supabase. Docker local caído. Tokens remotos de migración ausentes. **No se aplicó D1.** Se mejoró el logging para no ocultar PostgREST. Catálogo **no** recuperado.

---

## 2. Resumen ejecutivo

El select de `upsell_groups` incluye `placement` (código D1). El target activo es `pkrsedmwxekbhlohhqds` (documentado como **producción**). Migrar ahí está fuera de alcance. Local no arranca (Docker engine pipe missing). El catch previo descartaba el error PostgREST (`throw new Error(...)` genérico → overlay `{}` / message genérico). Ahora se loguea `code`/`message`/`details`/`hint` vía `getSafeErrorDetails` + `JSON.stringify`.

---

## 3. Preflight

| Item | Valor |
|------|-------|
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty | D1+C1+Q1 docs + catalog polish previos |
| Migration D1 file | presente, no aplicada a target activo |
| Tokens remote migrate | ABSENT |
| Acciones destructivas | ninguna |

---

## 4. Error observado

```text
[product-customization] Failed to load public summaries {}
```

Origen: `loadPublicCustomizationSummariesForProducts` → catch → fail-closed empty summaries.

---

## 5. Hipótesis inicial

Código D1 selecciona `placement`; DB activa sin migración D1 → PostgREST column missing. **No confirmar sin evidencia PostgREST.**

---

## 6. Source audit

| Paso | Hallazgo |
|------|----------|
| Query | `upsell_groups.select(..., placement)` |
| Error path | `upsellGroupsError` → `throw new Error("No pudimos...")` **descarta** objeto PostgREST |
| Catch | solo `error instanceof Error ? message : "unknown"` |
| Failure return | map de summaries vacíos (fail-closed) |
| Caller | `public-cached-data` / page catálogo |

---

## 7–9. Target activo / clasificación / seguridad

| Campo | Valor |
|-------|-------|
| Target type | **remote** |
| Host class | `*.supabase.co` |
| Project ref | `pkrsedmw...` → **`pkrsedmwxekbhlohhqds`** |
| Classification | **production** (docs: `PRODUCTION_PROJECT_REF`) |
| Local Docker | **unavailable** (engine pipe missing) |
| `supabase status` | FAIL |
| Remote migrate tokens | **ABSENT** |
| Mutaciones DB | **BLOQUEADAS** |

---

## 10–11. Error Supabase real / Root cause

**PostgREST code/message — NOT CAPTURED PREVIOUSLY** (descartado en throw).

**ROOT CAUSE — LIKELY, NOT CONFIRMED:** mismatch schema D1 (`placement` in select) vs DB producción sin migración D1.

Tras logging fix, el próximo fallo en terminal server debe exponer `code`/`message`/`details`/`hint`.

---

## 12–14. Logging

**Antes:** objeto no serializado + message genérico → `{}` / “No pudimos…”.

**Después:**

- `lib/product-customization/safe-error-details.ts`
- `throwLoggedCorpusError` loguea causa PostgREST antes del throw
- catch summaries: `JSON.stringify({ businessId, ...getSafeErrorDetails(error) })`

**Excluidos:** keys, tokens, headers, cookies, connection strings, PII.

---

## 15–18. Migration

| Item | Resultado |
|------|-----------|
| File | `supabase/migrations/20260731233000_post_add_upsell_group_placement.sql` |
| Strategy | **NOT APPLIED** — production out of scope; local unavailable; remote tokens absent |
| Command | **NONE** |
| Result | **BLOCKED** |

---

## 19–26. Schema checks / cache / catalog

**UNVERIFIED / NOT RUN** — sin target seguro.

**Catalog recovery:** **FAIL / NOT RECOVERED** (schema no alineado).

---

## 27–31. Smokes / network / console

| Check | Resultado |
|-------|-----------|
| D1 browser smoke | **NOT RUN** |
| C1 fixture | **ALL_PASS** |
| D1 fixture | **ALL_PASS** |
| Network catalog | **UNVERIFIED** (catálogo sigue fail-closed en summaries) |
| Console post-fix | requiere restart `next dev` + reload |

---

## 32–33. Fixtures / commands

| Comando | Resultado |
|---------|-----------|
| `safe-error-details.verify.ts` | ALL_PASS |
| `upsell-placement.verify.ts` | ALL_PASS |
| `post-add-upsell-contract.verify.ts` | ALL_PASS |
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |

---

## 34. Hallazgos

| ID | Sev | Hallazgo |
|----|-----|----------|
| D1-FIX-01 | **BLOCKER** | `next dev` → DB **producción**; migración D1 fuera de alcance |
| D1-FIX-02 | P1 | Logging ocultaba PostgREST (mitigado en código) |
| D1-FIX-03 | Debt | Docker/Supabase local unavailable |
| D1-FIX-04 | Debt | Sin project remoto no-prod autorizado |

---

## 35. Seguridad

`RLS CHANGES — NONE` · sin service-role en client · sin secrets en docs · sin pedidos · sin checkout changes.

---

## 36. No-regression

Sin query legacy sin `placement`. Sin fallback silencioso. Sin U1. Fixtures/tsc/build PASS.

---

## 37. Remaining debt

1. Arrancar Docker + Supabase local **o** proveer remoto no-prod con tokens exactos  
2. Aplicar D1 en target seguro  
3. Verificar constraints/backfill  
4. Recuperar catálogo  
5. Luego U1 → Q1  

---

## 38. Deploy restriction

**NOT READY** · **NO PRODUCTION MIGRATION** en esta fase.

---

## 39. Rollback

Logging: revertir `safe-error-details` + cambios en `public.ts` si molesta. DB: N/A (no mutada).

---

## 40. Próximo paso

1. Restaurar Docker/Supabase local **o** autorizar remoto no-prod (`AUTORIZO_POST_ADD_UPSELL_D1_REMOTE_DEV_MIGRATION=yes` + `PROJECT_REF` exacto ≠ prod).  
2. Re-ejecutar esta fase hasta PASS schema.  
3. **No** iniciar U1 mientras summaries fallen.  
4. Tras recovery: `PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1`.
