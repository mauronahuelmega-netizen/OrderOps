# DEVX-2 — Lint Baseline Cleanup

## Objetivo

Reducir el baseline de lint expuesto por DEVX-1 de forma segura, alcanzando **0 errors** sin cambiar runtime ni comportamiento de producto.

## Contexto

DEVX-1 configuró ESLint CLI (`eslint .`) con baseline inicial:

```txt
34 problems — 14 errors / 20 warnings
```

DEVX-2 corrige errors y warnings seguros; difiere migraciones riesgosas de `<img>`.

## Baseline inicial

| Tipo | Count | Reglas |
|------|-------|--------|
| Errors | 14 | `@typescript-eslint/no-unused-vars` (12), `react/no-unescaped-entities` (2) |
| Warnings | 20 | `@next/next/no-img-element` (16), `react-hooks/exhaustive-deps` (4) |

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/order-assignment-controls.tsx`
- `components/admin/orders/order-card-quick-actions.tsx`
- `components/admin/orders/order-external-actions.tsx`
- `components/admin/orders/order-detail-page-client.tsx`
- `components/admin/orders/status-form.tsx`
- `components/admin/admin-toast-provider.tsx`
- `lib/admin/permissions.ts`
- `lib/orders/metrics.ts`
- `lib/supabase/middleware.ts`

## Archivos creados

- `docs/devx-lint-baseline-cleanup.md`

## Errors corregidos (14/14)

### `@typescript-eslint/no-unused-vars` (12)

| Archivo | Acción |
|---------|--------|
| `admin-dashboard-orders.tsx` | Removido `isPresenceHealthy` del destructuring |
| `admin-dashboard-orders.tsx` | Removido parámetro `_previousAssignment` no usado |
| `admin-dashboard-orders.tsx` | Eliminado dead code: `isFilterPanelOpen`, `filterMenuRef`, `handleFilterMenuToggle`, `filterTriggerLabel`, `hasActiveCompactFilter`, `activeFilterLabel`, effect de panel compacto (nunca abrible tras T4.8) |
| `order-assignment-controls.tsx` | `catch (_error)` → `catch` |
| `order-card-quick-actions.tsx` | `catch (_error)` → `catch` |
| `order-external-actions.tsx` | `catch (_error)` → `catch` |
| `status-form.tsx` | `catch (_error)` → `catch` |
| `lib/admin/permissions.ts` | `canViewOrders`: `void role` (API pública conserva firma) |
| `lib/orders/metrics.ts` | Removido parámetro `now` no usado + caller actualizado |
| `lib/supabase/middleware.ts` | Destructuring sin `options` en `request.cookies.set` |

### `react/no-unescaped-entities` (2)

| Archivo | Acción |
|---------|--------|
| `admin-dashboard-orders.tsx:2420` | `"Todos"` → `&quot;Todos&quot;` en JSX |

## Warnings evaluados

| Regla | Inicial | Final | Acción |
|-------|---------|-------|--------|
| `react-hooks/exhaustive-deps` | 4 | 0 | Corregidos (patrones seguros) |
| `@next/next/no-img-element` | 16 | 16 | Diferidos |

## Warnings corregidos (4)

| Archivo | Fix |
|---------|-----|
| `admin-toast-provider.tsx` | Copiar `timersRef.current` a variable local en effect cleanup |
| `admin-dashboard-orders.tsx` | `void syncFreshnessTick` en `isOperationalSyncStale` useMemo (tick intencional) |
| `admin-dashboard-orders.tsx` | Copiar refs a variables locales en cleanup de arrival timers |
| `order-detail-page-client.tsx` | `handleOptimisticStatusRollback`: deps `[]` (no usa `order.id`); `handleOptimisticStatusChange`: mantiene `order.id` |

## Warnings diferidos (16)

Todos `@next/next/no-img-element` — imágenes admin/public con URLs dinámicas (Supabase), previews, logos. Migración a `next/image` requiere decisiones de layout, `remotePatterns`, y posible cambio visual.

## Decisiones sobre no-img-element

**Clasificación:** mayoría categoría **C** (preview/admin/public intencional) y **B** (remotas dinámicas).

**Decisión DEVX-2:** no migrar. Épica futura opcional **DEVX-3 — Image optimization audit** con criterios por superficie.

Archivos afectados:

- `components/admin/layout/admin-brand.tsx` (2)
- `components/admin/orders/order-product-modal.tsx` (1)
- `components/admin/products/create-product-form.tsx` (1)
- `components/admin/products/edit-product-form.tsx` (1)
- `components/admin/settings/public-settings-form.tsx` (4)
- `components/public/business/business-landing-page.tsx` (2)
- `components/public/business/public-business-header.tsx` (2)
- `components/public/catalog/catalog-client.tsx` (1)
- `components/public/catalog/product-card.tsx` (1)
- `components/public/catalog/product-detail-modal.tsx` (1)

## Decisiones sobre exhaustive-deps

- **Stale sync tick:** `syncFreshnessTick` es trigger intencional cada 60s; `void syncFreshnessTick` documenta uso sin alterar lógica.
- **Ref cleanup:** patrón React recomendado (copiar `.current` al inicio del effect).
- **Order detail rollback:** `setOrder` functional update no requiere `order.id` en deps.

No se agregaron deps que provoquen loops en dashboard/realtime.

## ESLint config changes

Ninguno. `eslint.config.mjs` sin modificar.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | **Pass** |
| `npx tsc --noEmit` | **Pass** (post-build) |
| `npm run lint` | **Pass with warnings** — 0 errors / 16 warnings (exit 0) |

## Resultado final de npm run lint

```txt
Pass with warnings — 0 errors / 16 warnings
```

Meta principal (0 errors): **cumplida**.

## Qué se preservó

- Next.js 15.3.0
- React 19.0.0
- Runtime y build
- Comportamiento dashboard/toolbar (filtros URL, search, sync, sesión)
- APIs públicas (`canViewOrders(role)` firma intacta)
- Optimistic UX y handlers

## Qué NO se tocó

- Next.js version
- React version
- runtime
- DB/Supabase
- server actions
- realtime
- dashboard UX
- toolbar behavior
- Board Area
- product logic
- `eslint.config.mjs`
- `package.json` / `package-lock.json`

## Riesgos encontrados

1. **Dead code filter panel:** removido código del panel compacto legacy (nunca conectado post-T4.8); riesgo nulo — no había UI que abriera `isFilterPanelOpen`.
2. **`canViewOrders`:** `void role` satisface lint sin cambiar contrato.
3. **`buildOperationalDashboardInsights`:** parámetro `now` era dead; removido sin efecto (función no lo usaba).

## Deuda técnica restante

- **16 warnings `@next/next/no-img-element`** — diferidos a DEVX-3 o épica de imagen pública/admin.
- CI puede usar `npm run lint` como gate de errors; warnings opcionales hasta DEVX-3.

## Próxima fase recomendada

- **Board / Orders Execution Area** — puede continuar (lint ya no bloquea con errors).
- Opcional: **DEVX-3 — Image optimization / no-img-element audit** si se busca 0 warnings.
