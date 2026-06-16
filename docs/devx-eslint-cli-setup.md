# DEVX-1 — ESLint CLI Setup

## Objetivo

Configurar ESLint CLI explícito para que `npm run lint` ejecute ESLint sin el setup interactivo de `next lint`.

## Contexto

En fases T4–T10 y DEVX previo, `npm run lint` ejecutaba `next lint` sin configuración ESLint en el repo, lo que abría el wizard interactivo de Next/ESLint. DEVX-1 establece tooling estable para CI y desarrollo local.

## Versión de Next

**Next.js 15.3.0** — no se actualizó en DEVX-1.

React permanece en **19.0.0**.

## Archivos modificados

- `package.json` — scripts `lint` / `lint:fix` y `devDependencies`
- `package-lock.json` — lockfile tras instalación de dependencias ESLint

## Archivos creados

- `eslint.config.mjs` — flat config con `FlatCompat` + presets Next
- `docs/devx-eslint-cli-setup.md`

## Configuración aplicada

Se creó `eslint.config.mjs` (ESLint 9 flat config) usando `@eslint/eslintrc` `FlatCompat` para extender:

- `next/core-web-vitals`
- `next/typescript`

Ignores explícitos:

- `.next/**`, `out/**`, `build/**`, `dist/**`, `node_modules/**`, `next-env.d.ts`

No existía `.eslintrc*` ni `eslint.config.*` previo.

## Dependencias agregadas

| Paquete | Versión instalada | Notas |
|---------|-------------------|-------|
| `eslint` | ^9.39.4 | ESLint 9 flat config |
| `eslint-config-next` | **15.3.0** (pinned) | Alineado con Next 15.3.0; npm inicialmente resolvió 16.x y se corrigió |
| `@eslint/eslintrc` | ^3.3.5 | `FlatCompat` para presets legacy |

## Scripts actualizados

| Script | Antes | Después |
|--------|-------|---------|
| `lint` | `next lint` | `eslint .` |
| `lint:fix` | — | `eslint . --fix` |

Scripts preservados: `dev`, `build`, `start`.

## Resultado de npm run lint

**Caso B — ESLint corre correctamente; reporta deuda existente.**

```txt
✖ 34 problems (14 errors, 20 warnings)
Exit code: 1
```

No se abre setup interactivo. ESLint CLI recorre el proyecto completo.

## Baseline de lint

### Errors (14)

| Regla | Count | Áreas principales |
|-------|-------|-------------------|
| `@typescript-eslint/no-unused-vars` | 12 | `admin-dashboard-orders.tsx`, order components, `lib/admin/permissions.ts`, `lib/orders/metrics.ts`, `lib/supabase/middleware.ts` |
| `react/no-unescaped-entities` | 2 | `admin-dashboard-orders.tsx` (comillas en copy JSX) |

### Warnings (20)

| Regla | Count | Áreas principales |
|-------|-------|-------------------|
| `@next/next/no-img-element` | 16 | Admin/public components con `<img>` |
| `react-hooks/exhaustive-deps` | 4 | Toast provider, dashboard orders, order detail |

**No corregido en DEVX-1** — deuda preexistente expuesta por ESLint por primera vez.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | **Pass** |
| `npx tsc --noEmit` | **Pass** (post-build) |
| `npm run lint` | **Ejecuta ESLint CLI** — 14 errors, 20 warnings (exit 1) |

## Qué se preservó

- Next.js 15.3.0
- React 19.0.0
- Runtime y build sin cambios
- Todo el código de producto (app, components, lib, supabase, middleware)

## Qué NO se tocó

- Next.js version
- React version
- runtime
- DB/Supabase
- server actions
- realtime
- dashboard UX
- toolbar
- Board Area
- product logic
- `next.config.*`, `tsconfig.json`

## Riesgos encontrados

1. **`eslint-config-next` semver:** `npm install eslint-config-next` sin pin instaló inicialmente v16.x; se corrigió a `15.3.0` para alinear con Next del proyecto.
2. **Exit code 1 en CI:** pipelines que traten `npm run lint` como gate fallarán hasta DEVX-2 o ajuste de CI (`continue-on-error` / baseline).

## Deuda técnica restante

- **DEVX-2 — Lint Baseline Cleanup:** resolver 14 errors + evaluar 20 warnings.
- Categorías prioritarias sugeridas:
  1. `@typescript-eslint/no-unused-vars` (unused vars / dead code)
  2. `react/no-unescaped-entities` (2 fixes triviales en JSX)
  3. `@next/next/no-img-element` (decisión producto: migrar a `next/image` o regla off por área)
  4. `react-hooks/exhaustive-deps` (revisión caso a caso)

## Próxima fase recomendada

**DEVX-2 — Lint Baseline Cleanup** (lint corre pero hay deuda: 14 errors / 20 warnings).

Board / Orders Execution Area puede continuar en paralelo; DEVX-2 no bloquea producto pero mejora CI/dev experience.
