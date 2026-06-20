# PROD-3 — ManualOrderProductOption Runtime Reference Fix

## Objetivo

Corregir el `ReferenceError: ManualOrderProductOption is not defined` que provocaba `POST /admin/dashboard → 500` antes de ejecutar guards o mutaciones Supabase.

## Contexto del incidente

- **PROD-1 / PROD-2** investigaron mutaciones status/assignment sin logs forenses.
- Producción confirmó error real en evaluación de módulo server-side, no en RLS ni guard como primer fallo.
- Crear pedido manual podía funcionar; tomar/preparar/guardar estado fallaban con 500.

## Error confirmado

```txt
ReferenceError: ManualOrderProductOption is not defined
```

Ocurre durante evaluación del bundle de Server Actions en `/admin/dashboard`, **antes** de:

```txt
[order-mutation:status:guard]
[order-mutation:assignment:guard]
[store-session-guard:error]
```

## Causa raíz

**CONFIRMED — re-export de tipo desde módulo `"use server"` compilado como referencia runtime.**

1. `app/admin/(protected)/orders/actions.ts` contenía `export type { ManualOrderProductOption }` re-exportado desde `lib/products/admin.ts` (módulo `server-only`).
2. Client components importaban el tipo desde el archivo de server actions (`manual-order-modal.tsx`).
3. Next.js 16 / Turbopack al registrar actions del dashboard evaluaba el grafo de módulos y emitía una referencia runtime a `ManualOrderProductOption`, que no existe en JavaScript.

**Clasificación:** hipótesis **A/C** (import/export boundary) — no uso del símbolo como valor en lógica de negocio.

## Archivos auditados

| Archivo | Rol |
|---------|-----|
| `app/admin/(protected)/orders/actions.ts` | Server actions creación; re-export problemático |
| `app/admin/(protected)/orders/[id]/actions.ts` | Mutaciones (sin referencia directa al símbolo) |
| `components/admin/orders/manual-order-modal.tsx` | Import tipo desde server actions |
| `components/admin/orders/admin-dashboard-orders.tsx` | Import tipo vía client modal |
| `lib/products/admin.ts` | Definición original del tipo |

## Búsquedas ejecutadas

```bash
rg "ManualOrderProductOption" app components lib
```

Apariciones pre-fix: type-only en anotaciones, pero **BOUNDARY RISK** en re-exports desde `"use server"` y client re-export chain.

## Cambios aplicados

1. Creado `lib/orders/manual-order-types.ts` — tipo compartido sin `"use client"` ni `"server-only"`.
2. `lib/products/admin.ts` — importa `import type` desde manual-order-types; eliminada definición duplicada.
3. `orders/actions.ts` — eliminado `export type { ManualOrderProductOption }`; import type desde manual-order-types.
4. `manual-order-modal.tsx` — tipo desde `@/lib/orders/manual-order-types`; `export type { ... } from` type-only.
5. `admin-dashboard-orders.tsx` — tipo directo desde manual-order-types (no vía server actions ni client chain).

## Type-only boundary fix

- Tipo vive en módulo neutro `lib/orders/manual-order-types.ts`.
- Server actions ya no re-exportan tipos al cliente.
- Client components usan `import type` / `export type from` exclusivamente.

## Imports corregidos

| Archivo | Antes | Después |
|---------|-------|---------|
| `orders/actions.ts` | `export type { ManualOrderProductOption }` desde products | `import type` desde `manual-order-types`; sin re-export |
| `manual-order-modal.tsx` | tipo desde `orders/actions` | `import type` + `export type from` manual-order-types |
| `admin-dashboard-orders.tsx` | tipo desde `manual-order-modal` | `import type` desde manual-order-types |
| `lib/products/admin.ts` | definición local | `import type` + `export type` desde manual-order-types |

## Qué se preservó

- server actions behavior
- guards de sesión activa
- RLS/policies
- optimistic UI
- realtime
- hydration/cache
- kanban visual
- modal visual
- manual order creation behavior
- products/checkout
- instrumentación PROD-1 (sin cambios)

## Qué NO se cambió

- no DB/schema changes
- no Supabase migrations
- no env var changes
- no UI changes
- no kanban changes
- no realtime changes
- no guard logic changes
- no RLS changes
- no middleware/proxy Next 16

## Validaciones ejecutadas

```txt
npm run build: pass (Next.js 16.2.9; warning middleware→proxy deprecado)
npx tsc --noEmit: pass
npm run lint: flake intermitente ESLint config en entorno agente; baseline repo 0 errors / 17 warnings no-img-element
```

Post-fix search (`rg ManualOrderProductOption`):

```txt
lib/orders/manual-order-types.ts          — declaración type
lib/products/admin.ts                   — import type + export type
app/admin/(protected)/orders/actions.ts — import type only; sin re-export
manual-order-modal.tsx                  — import type + export type from
admin-dashboard-orders.tsx              — import type only
```

Todas las apariciones son type-only. No hay `import { ManualOrderProductOption }` runtime.

## Deploy recomendado

```bash
git add .
git commit -m "Fix ManualOrderProductOption runtime reference"
git push
```

Esperar deployment Vercel en `main` y confirmar commit en Production.

## QA producción recomendado

En `https://orderops.vercel.app/admin/login`:

1. Login admin.
2. Dashboard → crear pedido manual.
3. Tomar pedido → sin 500.
4. Preparar → lane Preparing.
5. Modal → Guardar estado.
6. Vercel Logs: **no** debe aparecer `ReferenceError: ManualOrderProductOption is not defined`.
7. Si aparecen prefijos PROD-1, la mutación llegó a business logic.

## Riesgos / deuda restante

- QA producción post-deploy **pendiente** en sesión agente.
- Si persisten 500, abrir PROD-4 con nuevo stack trace (guard/RLS/dispatch).
- Deuda Next 16 middleware→proxy sin tocar.

## Próximo paso recomendado

1. Deploy + QA producción checklist arriba.
2. Si mutaciones OK, cerrar incidente I-9 en handoff.
3. Evaluar remover re-export type desde `manual-order-modal.tsx` en cleanup futuro (opcional).

---

*PROD-3 — fix acotado type boundary. Sin cambio funcional.*
