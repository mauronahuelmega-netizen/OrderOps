# PRODUCT-CUSTOMIZATION-FLAG-1 — Tenant Rollout Guard

## Objetivo

Exponer un helper server-side único y fail-closed para consultar el rollout de Product Customization V1 por tenant, sin activar la feature ni integrarla en UI/catálogo/checkout.

```ts
isProductCustomizationEnabled(businessId: string): Promise<boolean>
```

**Fecha:** 2026-07-12  
**Estado:** PASS

---

## Contexto

| Fase | Resultado |
|------|-----------|
| AUDIT-1 | PASS |
| SPEC-1 | PASS |
| DB-1 | PASS WITH DEBT — columna `product_customization_enabled` en migración |

La columna vive en `business_settings` (migración `20260712090000_product_customization_v1_schema.sql`), default **false**.

---

## Decisión D8

| Aspecto | Spec |
|---------|------|
| Flag | `business_settings.product_customization_enabled` |
| Default | `false` (negocios existentes y nuevos) |
| Scope | Capability de negocio — **no** roles/permisos |
| Rollout | Controlado por tenant |
| UI toggle | Fuera de esta fase |

---

## Archivos modificados

| Archivo | Acción |
|---------|--------|
| `lib/product-customization/flags.ts` | Creado |
| `docs/product-customization-flag-1-tenant-rollout-guard.md` | Creado |
| `docs/CURRENT_PHASE.md` | Nota de fase |
| `ORDEROPS_LIVING_MEMORY.md` | Changelog |

**Sin cambios** en `app/`, `components/`, cart, catalog, orders, migrations, RPC.

---

## Helper creado

```ts
export async function isProductCustomizationEnabled(
  businessId: string,
): Promise<boolean>
```

### Ubicación

```txt
lib/product-customization/flags.ts
```

- `import "server-only"` — no usable desde Client Components.
- Sin barrel `index.ts` (el repo no usa barrels en `lib/`).
- Sin helpers `require*` / `getRolloutState` — mínimo V1.

---

## Comportamiento

| Caso | Retorno |
|------|---------|
| `businessId` vacío / solo whitespace | `false` |
| Row `business_settings` ausente | `false` |
| `product_customization_enabled === false` | `false` |
| `product_customization_enabled` null/undefined | `false` |
| Error de query / excepción (env, red, columna ausente) | `false` |
| `product_customization_enabled === true` | `true` |

```txt
true  → solo si product_customization_enabled === true
false → cualquier otro caso
```

---

## Cliente Supabase usado

**Opción A — service client server-only**

```ts
createSupabaseServiceClient() // lib/supabase/service.ts
```

Justificación (alineada a `lib/business/public.ts` y `lib/store-sessions/public.server.ts`):

- El helper debe poder usarse luego en catálogo/checkout **sin sesión**.
- Lee solo `product_customization_enabled`.
- Service role **nunca** se expone al cliente (`server-only` + módulo service).

Query:

```ts
.from("business_settings")
.select("product_customization_enabled")
.eq("business_id", businessId)
.maybeSingle()
```

---

## Fail-closed behavior

- No lanza hacia callers futuros de catálogo/checkout.
- Ante error DB o excepción: log + `return false`.
- No cache agresivo en V1.
- No depende de `auth.uid()` ni roles.

---

## Logging

Patrón del repo (`console.error` con scope + `businessId` + `code`/`message`):

```txt
[product-customization] Failed to read feature flag
```

Sin secretos ni PII de cliente.

---

## Tests / validaciones

| Validación | Resultado |
|------------|-----------|
| Test framework (vitest/jest) | **No existe** en `package.json` — tests unitarios no agregados |
| `npx tsc --noEmit` | PASS |
| Columna en `types/database.ts` | Presente (DB-1) |
| Integración runtime | No — helper no wired aún |

---

## Qué NO se integró

```txt
- product_customization_enabled sigue default off
- no se activó ningún tenant
- no hay UI para togglearlo todavía
- helper no se usa en catálogo / carrito / checkout / dashboard / admin products
- no se tocó create_order
- no se tocó middleware
- no se crearon migraciones
- no se modificó RLS
```

---

## Backward compatibility

Con flag off (estado actual post-migración):

- Helper retorna `false` para todos los tenants.
- App visible sin cambios (helper no consumido).
- Si la migración DB-1 aún no está aplicada en un entorno, la query falla → fail-closed `false`.

---

## Deuda / riesgos

| Riesgo | Notas |
|--------|-------|
| Migración DB-1 no aplicada en staging/prod | Helper falla closed hasta aplicar migración |
| Sin UI de toggle | Activación vía SQL/admin manual hasta settings fase futura |
| Sin tests unitarios | Repo sin runner; validado por TypeScript + review |
| Service role dependency | Requiere `SUPABASE_SERVICE_ROLE_KEY` en server; si falta → false |

---

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-ADMIN-1 — Groups & Options Admin**

Usar `isProductCustomizationEnabled` solo cuando se decida gatear UI admin (opcional en ADMIN-1) o dejar el gate para CATALOG-1 / ORDER-1.

Antes: aplicar migración DB-1 en staging si aún no está.
