# PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1 — Pass previousSlug Through Public Catalog Cache Invalidation Callers

## 1. Estado

```txt
PASS WITH RUNTIME SLUG QA DEBT
```

Fecha: 2026-07-30  
Branch: `main`  
HEAD: `5dd9b41` (+ working tree patch, no commit)  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`

```txt
Runtime slug rename QA: NOT RUN — missing AUTORIZO_SLUG_RENAME_CACHE_QA_PROD=yes
tsc: PASS
build: PASS
Deploy/commit/push: no
```

## 2. Resumen ejecutivo

El helper `revalidatePublicCatalogCache` ya soportaba `previousSlug`. Ningún server action de **admin tenant** cambia `businesses.slug`; el único caller slug-capable es `updateBusinessAction` en **super-admin**. Se capturó el slug previo antes del update y se pasa `previousSlug` al helper solo si difiere del `nextSlug`. Callers de products/categories/settings/customizations/operations no se contaminaron. Runtime slug rename en producción no se ejecutó (sin auth). Smoke read-only catálogo/checkout 200.

## 3. Contexto de entrada

```txt
PUBLIC-CATALOG-CACHE-STRATEGY-1 → helper/tags implementados
PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2 → previousSlug callers deuda P2
PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP → BLOCKED mutation auth
PUBLIC-CATALOG-REAL-DEVICE-QA-1 → BLOCKED hardware (sin relación)
```

## 4. Preflight

```txt
branch: main
HEAD: 5dd9b41
dirty tree: docs previos + residuales out-of-scope + tsbuildinfo
runtime dirty inesperado: no
AUTORIZO_SLUG_RENAME_CACHE_QA_PROD: ausente
```

## 5. Helper audit

`lib/catalog/public-cache-tags.ts` — `revalidatePublicCatalogCache`

```txt
acepta businessId / slug / scope / previousSlug PASS
tags por businessId (catalog + customization) PASS
updateTag public-business:{slug} cuando touchBusiness PASS
previousSlug ≠ slug → updateTag + revalidatePath catalogo + /b/{previous} PASS
dedupe previousSlug === slug PASS
sin query preview / sin datos cliente PASS
API backward-compatible (no cambios de firma) PASS
```

Helper **no modificado** en esta fase (ya correcto).

## 6. Caller matrix

| Caller | Puede cambiar slug | Tiene slug actual | Puede capturar previousSlug | Pasa previousSlug | Acción |
| ------ | -----------------: | ----------------: | --------------------------: | ----------------: | ------ |
| `products/actions.ts` create/update/availability | no | adminContext | N/A | no (correcto) | ninguna |
| `categories/actions.ts` create/update | no | adminContext | N/A | no (correcto) | ninguna |
| `products/customizations/actions.ts` | no | adminContext | N/A | no (correcto) | ninguna |
| `settings/operations/actions.ts` | no | adminContext | N/A | no (correcto) | ninguna |
| `settings/public/actions.ts` branding/hero | **no** (no updatea `slug`) | adminContext | N/A | no (correcto) | ninguna |
| `super-admin/.../actions.ts` `updateBusinessAction` | **sí** | load pre-update | **sí** | **sí** (fix) | wired |
| `super-admin` createBusiness / createClient | create only | N/A | N/A | no | N/A (sin previous) |
| `dashboard/actions.ts` store session | no | slug paths only | N/A | n/a (revalidatePath) | ninguna |

## 7. Slug source of truth

```txt
tabla/campo: businesses.slug
UI tenant admin: display-only (public settings forms) — no action de update slug
server action que actualiza: updateBusinessAction (super-admin)
validación: requireSuperAdmin + slug requerido + toLowerCase trim
normalización: getTrimmedString(...).toLowerCase()
```

## 8. Implementación

Archivo: `app/super-admin/(protected)/actions.ts`

```txt
1. Import revalidatePublicCatalogCache
2. Antes del update: select id, slug del business (tenant-safe por id)
3. previousSlug = current.slug normalizado
4. nextSlug = input slug ya normalizado
5. Update name/slug/whatsapp/is_active
6. revalidatePublicCatalogCache({ businessId, slug: nextSlug, previousSlug si cambió, scope: "all" })
7. revalidatePath super-admin (+ businesses)
```

Sin cambios en callers tenant. Sin cambios en helper/tags/TTL.

## 9. Seguridad / tenant invariants

```txt
requireSuperAdmin preservado PASS
update filtrado por business id PASS
sin anon / sin service role nuevo en update PASS
sin ampliar permisos admin tenant PASS
sin cambiar validación slug copy PASS
```

## 10. Paths invalidated

Vía helper existente (sin rediseño):

```txt
public-business:{nextSlug} (scope all/business)
public-catalog:{businessId}
public-customization:{businessId}
/b/{nextSlug}/catalogo
/b/{nextSlug} (touchBusiness)
si previousSlug distinto:
  public-business:{previousSlug}
  /b/{previousSlug}/catalogo
  /b/{previousSlug}
```

Checkout/success: no añadidos (helper histórico no los revalida en rename; tags businessId cubren data).

## 11. Validation local

```txt
tsc: PASS (exit 0) → tmp/previous-slug-tsc.txt
build: PASS (exit 0) → tmp/previous-slug-build.txt
lint: no ejecutado
grep previousSlug: helper + updateBusinessAction only
grep revalidatePublicCatalogCache: callers previos + super-admin update
```

## 12. Runtime smoke read-only

```txt
/b/demohamburgueseria/catalogo → 200, categorías/CTAs visibles, cart vacío
/b/demohamburgueseria/checkout → abierto read-only (sin submit / sin pedido)
no slug change
no save admin/super-admin
```

## 13. Runtime slug rename QA

```txt
NOT RUN — missing AUTORIZO_SLUG_RENAME_CACHE_QA_PROD=yes
```

## 14. Resultado de comandos

```txt
npx tsc --noEmit → PASS
npm run build → PASS
AUTORIZO_SLUG_RENAME_CACHE_QA_PROD= (empty)
git: main @ 5dd9b41, patch local sin commit
```

## 15. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| — | Deuda previousSlug callers cerrada en source | super-admin updateBusinessAction wired | Deploy/commit pendiente auth separada |
| P2 | Runtime slug rename UNVERIFIED | sin AUTORIZO_SLUG_RENAME… | FOLLOWUP con token |
| P3 | Helper no revalida /checkout en rename | diseño histórico | Opcional followup menor |
| Info | Admin tenant no edita slug | public/actions no updatea slug | documentado |

## 16. Deuda residual actualizada

```txt
P2 — Runtime slug rename QA (auth) — esta fase deja debt
P2 — Cache mutation runtime QA (auth)
P2 — Observability prod enable (auth)
P2 — Image Transforms FeatureNotEnabled (auth)
P3 — Real device QA
P3 — previousSlug callers admin tenant: CERRADA (no hay caller slug-capable tenant; super-admin fixed)
```

## 17. Rollback plan

```txt
revertir únicamente el patch en app/super-admin/(protected)/actions.ts
no revertir cache strategy
no tocar DB
no tocar data productiva
```

No ejecutado.

## 18. Próximo paso

```txt
PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP
```

(o slug rename runtime cuando exista `AUTORIZO_SLUG_RENAME_CACHE_QA_PROD=yes` + restore plan)
