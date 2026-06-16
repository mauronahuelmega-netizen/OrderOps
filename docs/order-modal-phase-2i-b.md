# Order Modal Phase 2I-B — Background Hydration Indicator Fix

## Objetivo

Corregir el indicador visual de background hydration introducido en Phase 2I: eliminar skeleton flotante debajo del header y mantener solo accesibilidad silenciosa cuando ya hay `displayOrder`.

Referencias: Phase 2I, Phase 1A–1B.

## Problema detectado

Background hydration renderizaba `OrderModalRefreshSkeleton` (dos barras shimmer) en `OrderModalWorkspaceToolbar`, debajo del header:

- No pertenecía a ninguna superficie
- Generaba ruido visual y línea extra sin contexto
- Peor percepción que el texto `"Actualizando..."` original
- Layout shift al desaparecer (`padding-bottom` del toolbar)

## Cambio aplicado

| Estado | Comportamiento |
|--------|----------------|
| `loading && !displayOrder` | `OrderModalWorkspaceSkeleton` (sin cambios) |
| `loading && displayOrder` | Sin indicador visible; `sr-only` con `role="status"` / `aria-live="polite"` |
| `!loading && displayOrder` | Toolbar solo con `OperatorPresencePill` si aplica (sin cambios) |

Se eliminó `OrderModalRefreshSkeleton` y estilos `.refreshSkeleton` / `.refreshPill` / `.refreshLine`.

## Antes

```txt
Background hydration renderizaba skeleton visible como barras flotantes debajo del header.
```

Toolbar durante loading:

```txt
[ shimmer pill ] [ shimmer line ]   [presence?]
────────────────────────────────────
Productos
...
```

## Después

```txt
Background hydration no ocupa espacio visual; initial loading sin displayOrder mantiene skeleton completo.
```

Toolbar durante loading sin presence: solo `sr-only` (cero altura).

Toolbar durante loading con presence: `sr-only` + pill de presencia (sin barras).

## Qué se preservó

- Gate `loading && !displayOrder` → `OrderModalWorkspaceSkeleton`
- Gate `loading && displayOrder` → contenido seed visible e interactivo
- `useOrderWorkspaceHydration` sin cambios
- `OperatorPresencePill` cuando hay presencia durante loading
- Error state y skeleton completo inicial

## Qué NO se tocó

- hydration/cache
- `useOrderWorkspaceHydration`
- fetch workspace
- server actions
- optimistic callbacks
- realtime
- DB
- status logic
- assignment logic
- WhatsApp logic
- risk logic
- timeline logic
- products logic
- notes logic
- layout desktop general
- mobile/tablet redesign
- `admin-order-workspace-modal.tsx` (mismos props/gates)

## Accesibilidad

Background hydration mantiene anuncio para lectores de pantalla:

```tsx
<span className="sr-only" role="status" aria-live="polite">
  Actualizando pedido
</span>
```

Sin indicador visual que compita con el header o el contenido.

## Validaciones ejecutadas

- `npx tsc --noEmit` — ✅ exit 0
- `npm run lint` — ⚠️ ESLint no configurado; Next.js abre setup interactivo
- `npm run build` — ✅ exit 0, compiled successfully

## QA manual recomendado

1. Abrir `/admin/dashboard` → abrir pedido
2. No aparece `"Actualizando..."`
3. No aparecen barras skeleton debajo del header
4. `Productos` no se desplaza al terminar hidratación
5. Contenido seed visible de inmediato
6. Modal usable durante background hydration
7. Initial loading sin seed: skeleton completo (si simulable)
8. Error state OK
9. Status/assignment/WhatsApp/risk/timeline sin cambios

## Próxima fase recomendada

**Phase 3 — Mobile/tablet layout redesign** del modal workstation.
