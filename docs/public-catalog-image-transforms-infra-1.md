# PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1 — Enable Supabase Image Transformations & Verify Real Bytes

## 1. Estado

```txt
PASS WITH INFRA AUTH DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD: `9fae258`  
Modo: **A — QA sin acceso/autoridad Supabase**  
Sin `AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes` → no se habilitó infra.

## 2. Resumen ejecutivo

Se reconfirmó que el código del catálogo intenta `render/image` con widths correctos (cover 1080, logo 64, thumbs 128) y cae a `object/public` vía `PublicStorageImage` onError. Supabase sigue respondiendo **403 FeatureNotEnabled** en todas las variantes render. Object public **200** con full-res (logo ~918 KB, cover ~1.8 MB, thumb ~338 KB). Sin cambios de código. Acción externa pendiente: habilitar Image Transformations con autorización de billing.

## 3. Problema atacado

```txt
P2 — Supabase Image Transformations 403 FeatureNotEnabled
```

## 4. Modo ejecutado

```txt
Modo A — QA sin acceso/autoridad Supabase
```

Motivo: no se proveyó `AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes`.  
Supabase MCP: `needsAuth` (no usado para mutar config).

## 5. Infra / Supabase status

| Item | Valor |
|------|-------|
| Project ref | `pkrsedmwxekbhlohhqds` |
| Host | `pkrsedmwxekbhlohhqds.supabase.co` |
| Buckets | `business-assets`, `product-images` |
| `render/image` | **403 FeatureNotEnabled** |
| `object/public` | **200** |
| FeatureNotEnabled | **sí** |
| Plan/auth/billing | **no autorizado a habilitar** en esta fase |
| Habilitación realizada | **no** |

Acción externa requerida:

```txt
Owner: AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes
Dashboard Supabase → Storage → Image Transformations (plan/feature)
Luego re-ejecutar Modo B/C de esta fase
```

## 6. Archivos revisados

- `lib/supabase/image-loader.ts`
- `components/public/catalog/public-storage-image.tsx`
- `components/public/catalog/product-card.tsx`
- `components/public/catalog/product-detail-modal.tsx`
- `components/public/business/public-business-header.tsx`
- `next.config.ts`
- `docs/public-catalog-image-transforms-qa-fix-1.md` (contexto)

## 7. Archivos modificados

**código:** ninguno  
**infra:** ninguno  
**docs:** este doc + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`

## 8. URL/status matrix

| Asset | Object status | Render status | Render size | Error | Resultado |
| ----- | ------------: | ------------: | ----------: | ----- | --------- |
| Logo | 200 · 940521 B | **403** · 123 B JSON | n/a | FeatureNotEnabled | infra |
| Cover | 200 · 1838445 B | **403** · 123 B JSON | n/a | FeatureNotEnabled | infra |
| Thumb (Coca) | 200 · 346446 B | **403** · 123 B JSON | n/a | FeatureNotEnabled | infra |
| Detail w=640 | (same object) | **403** | n/a | FeatureNotEnabled | infra |

Render variants probadas: `width=64&quality=75`, `width=1080&quality=75`, `width=228&height=216&resize=cover&quality=75`, `width=640&quality=80` — todas 403.

## 9. Browser currentSrc QA

Producción `https://orderops.vercel.app/b/demohamburgueseria/catalogo`:

| Asset | currentSrc | naturalW×H | rendered | loading |
|-------|------------|------------|----------|---------|
| Logo | **object** | 1254×1254 | ~58–60 | lazy |
| Cover | **object** | 1672×941 | ~1040×584 | auto |
| Thumbs | **object** | ~1122–1254 | ~114×108 | lazy |

Resource log: **primero** `render/image?...width=1080|64|128&quality=80`, luego fallback `object/public`.  
Código de URL: **PASS**. Infra: **FAIL (403)**.

## 10. Bytes reales

| Asset | Object KB | Render KB | Delta | Método |
| ----- | --------: | --------: | ----: | ------ |
| Logo | 918 | n/a (403) | — | curl `size_download` |
| Cover | 1795 | n/a (403) | — | curl |
| Thumb Coca | 338 | n/a (403) | — | curl |
| Browser transferSize | 0 | 0 | — | unavailable (CORS/cache); curl authoritative |

```txt
measured (curl object sizes)
render bytes unavailable until FeatureNotEnabled cleared
```

## 11. Fallback behavior

```txt
PublicStorageImage: loader render primary
onError → object/public + unoptimized
src change resets fallback (useEffect) — intacto
no unoptimized global
next.config remotePatterns object + render — OK
```

## 12. Runtime QA público

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| 16 productos · 2× Desde | PASS |
| Cover/logo/thumbs visibles | PASS (object full-res) |
| Pedido real | **NO** |

## 13. Checkout boundary

| Check | Resultado |
|-------|-----------|
| **Enviar pedido** visible | PASS |
| Pedido enviado | **NO** |

## 14. Preview regression

```txt
UNVERIFIED — auth unavailable
preview logic untouched
```

## 15. Source checklist

| Check | Resultado |
|-------|-----------|
| next/image activo | PASS |
| PublicStorageImage + loader | PASS |
| loader → `/storage/v1/render/image/public` | PASS |
| fallback object onError | PASS |
| no unoptimized global | PASS |
| remotePatterns sin wildcard peligroso | PASS (`**.supabase.co` storage paths) |
| no dangerouslyAllowSVG | PASS |
| no CSP/checkout/cache/corpus/scroll touched | PASS |

## 16. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No checkout action
No carrito schema
No cache strategy changes
No corpus changes
No scroll CSS changes
No preview admin logic
No CSP changes
No pedidos reales
No commit/push/deploy
No Image Transformations enable (sin auth)
```

## 17. Resultado de comandos

| Check | Resultado |
|-------|-----------|
| git | `main` @ `9fae258` · dirty scroll/corpus docs+code previos |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint circular histórico |
| curl render | 403 FeatureNotEnabled |
| curl object | 200 |

## 18. Deuda residual

| ID | Deuda | Severidad |
|----|-------|-----------|
| — | Habilitar Image Transformations (auth/billing owner) | **P2 infra** |
| — | Re-medir render bytes / currentSrc tras enable | P2 follow-up |
| — | Preview auth smoke | P3 |
| P2 | Scroll polish + corpus overfetch deploy pendientes | P2 |
| P2 | slug rename / flag toggle UI | P2 |
| P3 | mutation cache QA · lint circular | P3 |

## 19. Rollback

QA/infra-only: no hay rollback funcional de repo.  
Solo revertir docs si se desea.

Si más adelante se habilita y hay que revertir por costo:

```txt
Deshabilitar Image Transformations en Supabase Dashboard (si el plan lo permite)
o ajustar spend cap según UI
```

## 20. Próximo paso

```txt
PUBLIC-CATALOG-ROADMAP-DEPLOY-1
```

(Tras auth de transforms, reabrir esta fase en Modo B/C antes o junto al roadmap deploy.)
