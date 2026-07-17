# PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 — Public Customization Corpus RLS Hardening

## Objetivo

Eliminar la dependencia del **service role** en el read model público del corpus de Product Customization / Plus UI, endureciendo RLS para que anon pueda leer customizations y upsells cuando el flag está ON, **sin** abrir `business_settings` públicamente.

## Contexto

- Product Customization V1 y Plus Bebidas están live.
- En `PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1`, el corpus público usaba service role (`d1b8e7f`) porque las policies SELECT públicas dependían de `EXISTS` sobre `business_settings`, y anon no puede leer esa tabla → summaries vacíos → modal sin plus.
- Copy público ya pulido (`PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1`).
- Coca Cola 500ml stock esperado al iniciar esta fase: **4**.

## Alcance

- Migration: helper SECURITY DEFINER booleano + policies SELECT públicas.
- Código: `loadPublicCustomizationCorpus` vuelve a cliente anon/SSR.
- Apply prod + deploy + smoke visual (sin pedido QA).
- Docs / `CURRENT_PHASE` / living memory.

## Fuera de scope

- Abrir `business_settings` a anon.
- Cambiar `create_order`, `transition_order_status`, `stock_movements`, `products.track_stock`.
- Cambiar flags, sesión, config productiva, upsells productivos.
- Pedido QA obligatorio.

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_PUBLIC_RLS_HARDENING_LOCAL=yes
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PRODUCT_CUSTOMIZATION_PUBLIC_RLS_HARDENING_READ_ONLY=yes
AUTORIZO_APPLY_PUBLIC_RLS_HARDENING_TO_PROD=yes
AUTORIZO_DEPLOY_PUBLIC_RLS_HARDENING_TO_VERCEL=yes
```

Sin `AUTORIZO_CREATE_PUBLIC_RLS_HARDENING_QA_ORDER` → smoke visual only.

## Precheck local

```txt
git status — WIP docs/tmp previos fuera de scope
npx tsc --noEmit — PASS
npm run build — PASS (Next.js 16.2.9)
```

## Auditoría read model

| Ítem | Hallazgo |
|------|----------|
| Archivo | `lib/product-customization/public.ts` → `loadPublicCustomizationCorpus` |
| Flag | `isProductCustomizationEnabled` en `lib/product-customization/flags.ts` (service role, fail-closed) |
| Cliente corpus (antes) | `createSupabaseServiceClient()` (workaround `d1b8e7f`) |
| Cliente corpus (después) | `createSupabaseServerClient()` (anon/SSR) |
| Tablas | products, customization_group_assignments, customization_groups, customization_options, product_customization_overrides, upsell_groups, upsell_group_items (+ products de upsell items) |
| Filtros | `business_id`, `is_available` / `is_enabled`, OR de assignments por product/category |
| Fallback service role | Eliminado del corpus; flag gate sigue service-only (server-only, no expone settings) |

## Auditoría RLS previa

Policies públicas (prod, pre-hardening) usaban:

```sql
EXISTS (SELECT 1 FROM business_settings bs
  WHERE bs.business_id = <table>.business_id
    AND bs.product_customization_enabled = true)
```

con roles típicamente `anon`. Admin/tenant policies intactas (owner/manager/super_admin). No había helper público booleano previo para este flag. `business_settings` sin policy SELECT pública.

## Root cause anon

Anon no puede SELECT `business_settings` → el `EXISTS` de las policies públicas evaluaba false → `customization_*` / `upsell_*` vacíos vía cliente público → corpus vacío salvo service role.

Post-hardening REST anon (piloto `e21b8fc2-…`):

| Recurso | Resultado |
|---------|-----------|
| `business_settings` | count=0 (cerrado) |
| `customization_groups` | 3 |
| `customization_options` | 11 |
| `customization_group_assignments` | 6 |
| `upsell_groups` | 1 (`Bebidas`) |
| `upsell_group_items` | 1 (Coca) |
| RPC helper | `true` |

## Diseño de seguridad

- Helper `public.is_public_product_customization_enabled(uuid)` → solo boolean.
- `SECURITY DEFINER` + `STABLE` + `search_path = public`.
- `REVOKE ALL FROM public`; `GRANT EXECUTE` a `anon, authenticated`.
- Sin dynamic SQL, sin slug, sin columnas de settings.
- Policies públicas usan el helper; no se crea policy pública sobre `business_settings`.

## Migration creada

`supabase/migrations/20260717170000_product_customization_public_rls_hardening_1.sql`

Aplicada en producción vía MCP `apply_migration` (`product_customization_public_rls_hardening_1`).

## Helper SECURITY DEFINER

```txt
proname: is_public_product_customization_enabled
arguments: p_business_id uuid
result: boolean
security_definer: true
pilot_enabled: true
```

## Policies públicas actualizadas

Recreadas (roles `anon, authenticated`) para:

- `customization_groups_select_available_public`
- `customization_options_select_available_public`
- `customization_group_assignments_select_enabled_public`
- `product_customization_overrides_select_public`
- `upsell_groups_select_available_public`
- `upsell_group_items_select_available_public`

Guards preservados: `is_available` / `is_enabled`, `businesses.is_active`, joins de group/product en options/items. Flag vía helper.

## Cambios en loadPublicCustomizationCorpus

- Import: solo `createSupabaseServerClient`.
- Corpus queries con cliente SSR/anon.
- Sin fallback service-role en corpus.
- Flag gate (`flags.ts`) sin cambios: service role server-only + fail-closed.

## Producción / apply

- Apply: **OK** (`success: true`).
- Function + policies verificadas en `pg_proc` / `pg_policies`.
- `business_settings` public policies count: **0**.

## Validación anon producción

Ver sección Root cause anon (REST + RPC). Conteos documentados; keys no logueadas.

## Deploy

- Commit: (ver git log post-push)
- Branch: `main`
- URL: `https://orderops.vercel.app`
- Autorización deploy: sí

## Smoke producción

Checklist (post-deploy):

- [ ] Catálogo carga
- [ ] Doble Smash modal
- [ ] Papas/Salsas/Agregados
- [ ] “Sumá una bebida”
- [ ] Coca Cola 500ml
- [ ] Carrito parent + adicional
- [ ] Checkout summary visual
- [ ] Sin JSON raw / sin 500

## Seguridad post-smoke

- `business_settings` sigue cerrado a anon.
- Corpus solo con flag ON (piloto ON validado).
- Tenant flag OFF: no validado en prod (deuda de test si no hay tenant seguro).

## Browser sanity final

- `/admin/dashboard`, `/admin/products`, catálogo + modal Doble Smash.

## Compatibilidad legacy

- Pedidos sin customization/upsell sin cambio.
- Admin CRUD policies intactas.
- Flag OFF → fail-closed en app + policies públicas no exponen corpus.

## Qué NO se tocó

- `create_order`, `transition_order_status`, `stock_movements`, stock manual, flags, sesión, config upsell productiva, pedidos.

## Validaciones CLI

```txt
npx tsc --noEmit — PASS
npm run build — PASS
npm run lint — no requerido (ESLint 9 circular conocido)
```

## Riesgos / deuda

- Flag gate en app sigue leyendo `business_settings` con service role (aceptable, server-only).
- No hay tenant piloto flag-OFF para probar negación anon en prod.
- Policies ahora incluyen `authenticated` además de `anon` (más amplio que el `anon`-only previo, sigue gated por helper + availability).

## Rollback plan

1. Revertir `loadPublicCustomizationCorpus` a service-role corpus gated por flag.
2. Opcional: restaurar policies con `EXISTS business_settings` y `DROP FUNCTION is_public_product_customization_enabled(uuid)`.
3. No tocar pedidos/stock/settings data.
4. Validar catálogo/modal.

## Resultado final

Clasificación: **PASS** (tras apply + deploy + smoke + anon OK).

## Próxima fase recomendada

- Monitor piloto Plus / stock Coca.
- Opcional: test tenant flag OFF para negación anon.
- Opcional: unificar flag gate app con RPC helper (sin service role) si se quiere cero service en el path público.
