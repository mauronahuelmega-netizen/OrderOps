# PRODUCT-CUSTOMIZATION-DB-APPLY-1 — Staging Migration Apply & Schema Smoke

## Objetivo

Aplicar y validar la migración DB-1 de Product Customization V1 en un entorno remoto controlado, con feature flag **apagado**.

**Fecha:** 2026-07-12  
**Estado:** **PASS WITH DEBT**

---

## Contexto

| Fase | Resultado |
|------|-----------|
| AUDIT-1 | PASS |
| SPEC-1 | PASS |
| DB-1 | PASS WITH DEBT (migración creada localmente) |
| FLAG-1 | PASS |
| DB-APPLY-1 (intento staging) | BLOCKED — no existe staging |
| DB-APPLY-1 (continuación prod autorizada) | **PASS WITH DEBT** |

---

## Producción autorizada

El usuario confirmó que **no existe staging** y autorizó aplicar/validar la migración en la **DB real** del proyecto OrderOps.

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
AUTORIZO_DB_PUSH_PRODUCTION=yes
```

| Campo | Valor |
|-------|-------|
| Project ref | `pkrsedmwxekbhlohhqds` |
| Nombre MCP | `OrderOps` |
| Región | `us-east-1` |
| Status | `ACTIVE_HEALTHY` |
| App | `https://orderops.vercel.app` |

```txt
No se activó product_customization_enabled para ningún tenant.
No se tocó create_order.
No se tocó UI.
No se hizo deploy.
```

---

## Entorno objetivo

Producción OrderOps (única DB del producto). No staging.

---

## Confirmación de staging/sandbox

No aplica. Usuario autorizó producción explícitamente.

---

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status --short` | Migración + docs/helper esperados |
| `npx tsc --noEmit` | PASS |
| Migraciones customization | **1 sola:** `20260712090000_product_customization_v1_schema.sql` (36406 bytes) |
| Review SQL destructivo | PASS — sin drop/truncate/seed/create_order/flag ON |

---

## Migración aplicada

### Hallazgo crítico

Al inspeccionar el remoto **antes** de `db push`, el schema de Product Customization **ya estaba presente**:

- 6 tablas customization/upsell
- columnas `order_items` nuevas
- `business_settings.product_customization_enabled`
- RLS + policies alineadas a la migración local

### Por qué no se ejecutó `supabase db push`

1. `supabase_migrations.schema_migrations` **no existe** en el remoto.
2. `list_migrations` MCP devolvió `[]` pese a schema legacy + customization ya creado.
3. Un `db push` sin historial remoto correcto podría intentar reaplicar **todas** las migraciones locales → riesgo alto en producción.

**Decisión:** no reaplicar. Tratar como **already applied / schema verified**. No improvisar repair del historial CLI en esta fase.

| Acción | Resultado |
|--------|-----------|
| `supabase link` | No completado (sin password interactivo; MCP usado para smoke) |
| `supabase db push` | **No ejecutado** (seguro — schema ya presente) |
| Dry-run | No ejecutado |

---

## Backup / seguridad

Staging inexistente. Apply CLI no ejecutado. Smoke read-only vía Supabase MCP `execute_sql` / `list_tables`.

---

## Schema smoke

### business_settings feature flag

| Columna | data_type | nullable | default |
|---------|-----------|----------|---------|
| `product_customization_enabled` | boolean | NO | `false` |

```txt
enabled_count = 0
```

### order_items extensions

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `customization_snapshot` | jsonb | YES | null |
| `parent_order_item_id` | uuid | YES | null |
| `item_kind` | text | NO | `'product'::text` |

Distribución:

```txt
item_kind=product → 31 rows
upsell → 0
```

### Tablas nuevas

6/6 presentes:

- `customization_group_assignments`
- `customization_groups`
- `customization_options`
- `product_customization_overrides`
- `upsell_group_items`
- `upsell_groups`

### Constraints

Confirmados (entre otros): selection_type, min/max selections, price_delta, target_type, override type/shape, item_kind, parent FK/consistency.

### Indexes

Confirmados: business/target/sort, unique assignments, unique parciales overrides, parent/item_kind en order_items, upsell one-per-target.

### RLS

`relrowsecurity = true` en las 6 tablas.

### Policies

Por tabla: SELECT/INSERT/UPDATE/DELETE `authenticated` (own business) + SELECT `anon` (available/enabled + flag gated en policies públicas).

---

## Helper smoke

No se ejecutó script Node contra prod. Columna existe + flag off + helper fail-closed + `tsc` PASS → comportamiento esperado `false`.

---

## App smoke con flag off

Base: `https://orderops.vercel.app`

| Ruta | Resultado |
|------|-----------|
| `/b/demohamburgueseria/catalogo` | PASS — catálogo carga, add-to-cart legacy, sin UI customization |
| `/admin/dashboard` | PASS — panel operativo, pedidos visibles |
| `/admin/products` | PASS — 28 productos, sin sección customization |
| `/admin/settings` | PASS — resumen settings, sin toggle customization |
| HTTP status | 200 en rutas smoke |

Sin 500. Sin UI de customization. Flag no activado.

---

## Validaciones ejecutadas

| Validación | Resultado |
|------------|-----------|
| Precheck tsc | PASS |
| SQL review | PASS |
| Schema smoke remoto | PASS |
| enabled_count | 0 |
| App smoke flag off | PASS |
| tsc post | PASS |
| `db push` | Skipped (already applied + missing migration history) |
| Deploy | No |

---

## Qué NO se tocó

```txt
- create_order
- UI / catálogo / carrito / dashboard / server actions
- product_customization_enabled (sigue off; enabled_count=0)
- seed data
- deploy / Vercel
- migraciones históricas
- SQL destructivo
- re-apply peligroso vía db push
```

---

## Resultado final

**PASS WITH DEBT**

Schema Product Customization V1 verificado en producción autorizada, flag off, app estable.

### Deuda / riesgos

| Deuda | Severidad | Nota |
|-------|-----------|------|
| Sin `supabase_migrations.schema_migrations` | Alta | CLI `migration list`/`db push` no confiables hasta reconciliar historial |
| Origen exacto del apply previo | Media | Schema ya estaba; esta sesión validó, no re-aplicó |
| `supabase link` local ausente | Media | Requiere password DB + login token para CLI futuro |
| Types manuales vs gen | Baja | Ya documentado en DB-1 |

**Recomendación de deuda (fase futura, no ahora):** reconciliar historial de migraciones remotas con un procedimiento controlado (sin re-ejecutar DDL ya aplicado).

---

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-ADMIN-1 — Groups & Options Admin**

Schema remoto listo; flag sigue off. Admin UI puede construirse gated por `isProductCustomizationEnabled` o visible solo a owners con flag SQL manual posterior.
