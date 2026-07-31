# PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1

## Controlled Package Audit, Atomic Git Release, Production Deployment, Read-Only Smoke & Safe Revert Rollback

**Fecha:** 2026-07-31  
**Branch:** `main`  
**Estado:** **DEPLOYED WITH NON-BLOCKING QA DEBT — SINGLE-GROUP POST-ADD UPSELL LIVE**

Flags:

```text
MODE — CONTROLLED PRODUCTION DEPLOY
AUTHORIZED GIT COMMIT
AUTHORIZED PUSH TO ORIGIN/MAIN
AUTHORIZED VERCEL PRODUCTION DEPLOY
AUTHORIZED READ-ONLY PRODUCTION SMOKE
AUTHORIZED AUTOMATIC GIT-REVERT ROLLBACK
NO DATABASE CHANGES
NO MIGRATIONS
NO PRODUCTION ADMIN MUTATIONS
NO CHECKOUT ACTION CHANGES
NO CHECKOUT SUBMIT
NO REAL ORDERS
NO FORCE PUSH
SINGLE UPSELL GROUP ONLY
```

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1 = ALLOWED
```

---

## 1. Estado

Single-group post-add upsell + C1 + quantity preservation + QA-2 fixes publicados y verificados en producción.

## 2. Resumen ejecutivo

Paquete funcional atómico (44 files) committeado y pusheado a `origin/main`. Vercel production deployment **Ready**. Smoke productivo: modal sin Plus, post-add tras `created`, attach local, quantity/edit preservados, remove reconstruye signature, checkout sin submit. Commit documental posterior.

## 3. Autorizaciones

`AUTORIZO_PUBLIC_CATALOG_POST_ADD_UPSELL_DEPLOY=yes` (+ commit/push/deploy/smoke/revert).

## 4. Gate previo

| Fase | Estado |
|------|--------|
| Cleanup | PASS — D1 REMOVED… |
| IMPL-1 | PASS WITH NON-BLOCKING QA DEBT |
| QA-2 | PASS WITH NON-BLOCKING QA DEBT · READY FOR HUMAN DEPLOY REVIEW |
| Quantity fix | PASS — CUSTOMIZED CART EDIT PRESERVES… · READY FOR HUMAN DEPLOY REVIEW |
| Queue | `…DEPLOY-1 = HUMAN_REVIEW_REQUIRED` → satisfecho por este prompt |

Arquitectura: single `upsellGroup`; sin placement runtime; modal sin Plus; post-add solo `created`; `preservedQuantity`; remove signature rebuild; focus trap.

## 5. Preflight

- Branch: `main`
- Pre-deploy HEAD / origin/main: `5dd9b419ce0da953eeca42d657b1fb653b75f847`
- Dirty tree amplio; no `git add .`
- Upstream sync: `0 0` left-right

## 6. Remote synchronization

```text
PRE_DEPLOY_REMOTE_SHA=5dd9b419ce0da953eeca42d657b1fb653b75f847
LOCAL_HEAD=5dd9b419ce0da953eeca42d657b1fb653b75f847
```

## 7. Previous production SHA

`5dd9b41` (pre-release production).

## 8. Deploy mechanism

Histórico confirmado: `git push origin main` → Vercel Git integration → `https://orderops.vercel.app`  
Proyecto linked: `order-ops` (`prj_HgaxUFOGIF29Oy6LQ3H7KMTg1JiH`). CLI `vercel` 50.37.0. Sin relink.

## 9–13. Working tree / manifest / dependency closure

### Included (functional commit) — 44 paths

| Path | Razón | Fase |
|------|-------|------|
| `components/public/catalog/post-add-upsell-sheet.tsx` (+css) | Post-add UI | IMPL-1 |
| `components/public/catalog/catalog-client.tsx` | Orchestration created→post-add | IMPL-1 |
| `components/public/catalog/customization-modal.tsx` (+css) | Modal sin Plus | IMPL-1/Cleanup |
| `components/public/catalog/cart-sheet.tsx` (+css) | Hierarchy/qty/edit | Cart sheet + C1 |
| `components/public/catalog/cart-bar.tsx` (+css) | FAB root-only | Shell polish |
| `components/public/catalog/product-card.tsx` (+css) | Grid/quick-add | Cards polish |
| `components/public/catalog/catalog-shell.module.css` | Shell layout | Shell polish |
| `components/public/catalog/customization-config-cache.ts` | Modal cache | Perf fix |
| `components/public/business/*` | Header hide-on-scroll | Shell polish |
| `components/public/checkout/checkout-client.tsx` (+css) | Presentational conversion | Checkout polish |
| `lib/cart/local.ts` | C1 merge/attach/qty preserve/remove sig | C1 + qty fix |
| `lib/cart/signature.ts` / `types.ts` | Signature contract | C1 |
| `lib/cart/post-add-upsell.ts` + verify fixtures | Domain + C1/U1/EDIT-QTY | IMPL/QA |
| `lib/product-customization/public.ts` (+ shared/resolve/safe-error) | Single upsell + logging | Cleanup |
| `components/product-customization/shared/*` | Shared UI cleanup | Cleanup |
| `components/admin/.../plus-suggestions/*` | Admin single-group copy | Cleanup |
| `app/admin/.../customizations/actions.ts` | Admin upsell messages | Cleanup |
| `app/super-admin/.../actions.ts` | Catalog cache on slug change | Cache callers |
| `app/globals.css` | Styles moved to modules | Shell polish |

### Excluded

| Path | Why |
|------|-----|
| `docs/*`, `CURRENT_PHASE`, Living Memory | Docs commit |
| `components/admin/orders/admin-dashboard-orders.tsx` | Unrelated indent churn |
| `next-env.d.ts`, `tsconfig.tsbuildinfo`, `tmp/` | Temporary |
| Migrations / `.env*` / `package*` / `types/database.ts` | Forbidden / no net diff |

## 14–16. Migration / DB / checkout gates

```text
STAGED_MIGRATIONS = 0
STAGED_DB_SCHEMA_CHANGES = 0
STAGED_RLS_CHANGES = 0
STAGED_RPC_CHANGES = 0
CHECKOUT ACTION CHANGES — NONE
CREATE_ORDER CHANGES — NONE
ENV CHANGES — NONE
placement migration file — DOES NOT EXIST
```

## 17–19. Fixtures / TypeScript / Build

| Check | Result |
|-------|--------|
| safe-error-details.verify | PASS |
| upsell-resolution.verify | PASS |
| post-add-upsell-contract (C1+EDIT-QTY) | PASS |
| post-add-upsell-ui-contract (U1) | PASS |
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --cached --check` | PASS |

Exact package: todo runtime requerido staged; unstaged = docs/unrelated/temp only.

## 20. Local browser smoke

`http://localhost:3000/b/demohamburgueseria/catalogo` · 390×844

- Modal sin Plus; post-add tras created; attach; qty 2; edit preserve pq/cq=2; no post-add on edit — **PASS**

## 21–22. Functional commit / push

```text
FUNCTIONAL_COMMIT_SHA=6d138a617f99add0620ae9ff6cc8c037d5c0b10a
```

Message: `feat(public-catalog): add single-group post-add upsell flow`  
Push: `5dd9b41..6d138a6  main -> main`  
`git ls-remote origin refs/heads/main` = functional SHA.

## 23–26. Deployment

| Field | Value |
|-------|-------|
| DEPLOYMENT_ID | `dpl_6Z7qqAG3a8uJHbpm4HSBqow4zcAR` |
| DEPLOYMENT_URL | `https://order-1dzzv4hmd-mauro-s-projects-f82304ad.vercel.app` |
| PRODUCTION_ALIAS | `https://orderops.vercel.app` |
| BUILD_STATUS | **Ready** |
| TARGET | production |

## 27–38. Production smoke

URL: `https://orderops.vercel.app/b/demohamburgueseria/catalogo` · 390×844

| Case | Evidence | Result |
|------|----------|--------|
| Health | HTTP 200 | PASS |
| Modal | Papas/Salsas/Agregados; Coca ausente | PASS |
| Created→post-add | `¿Sumás algo más?` + Coca | PASS |
| Attach | Agregado/Listo; 0 fetch | PASS |
| Qty | pq=2 cq=2 pt=25000 ct=6000 | PASS |
| Edit | pq=2 cq=2 mayo; no post-add; 0 fetch | PASS |
| Remove/signature | n=1 pq=2 sigChanged=true | PASS |
| Checkout | `/checkout` · 2 productos · 2 × · Total $25.000 · CTA · modality 0 fetch | PASS |
| Simple Coca | quick-add sin modal/post-add (verificado en flujo local + contrato) | PASS / parcial prod |

```text
SUBMIT REAL — NOT EXECUTED BY SCOPE
REAL ORDERS — 0
```

## 39–40. Network / Console

Attach/stepper/edit/modality: 0 fetch adicionales. Sin P0/P1/P2 de consola en smoke core.

## 41–42. Security / Orders

```text
DATABASE CHANGES — NONE
MIGRATIONS — NONE
PRODUCTION ADMIN MUTATIONS — NONE
RLS CHANGES — NONE
RPC CHANGES — NONE
CHECKOUT ACTION CHANGES — NONE
CREATE_ORDER CHANGES — NONE
CHECKOUT SUBMIT — NONE
REAL ORDERS — 0
SECRETS EXPOSED — NONE
FORCE PUSH — NONE
```

## 43–46. Findings / Rollback

- P0/P1/P2: ninguno abierto  
- Rollback: **NO EJECUTADO** (no requerido)  
- Estrategia documentada: `git revert 6d138a6` + push (sin DB)

## 47–50. Documentation commit / SHAs

Ver commit documental posterior a este archivo.

```text
FUNCTIONAL_COMMIT_SHA=6d138a617f99add0620ae9ff6cc8c037d5c0b10a
DOCUMENTATION_COMMIT_SHA=<filled after docs push>
FINAL_PRODUCTION_SHA=<docs SHA if redeployed, else functional>
```

## 51. Remaining debt

Preview auth, real-device, screen reader, closed-store (P3 / non-blocking).

## 52. Próximo paso

`PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1` (read-only; no ejecutar ahora).
