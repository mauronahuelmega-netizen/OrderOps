# HOTFIX-SETTINGS-1G-A — useActionState Transition Fix

## Problema

Tras **SETTINGS-PAGE-1G**, al guardar en `/admin/settings/public/landing` aparecía en consola:

```txt
An async function with useActionState was called outside of a transition.
```

Stack observado:

```txt
PublicSettingsForm → handleSubmit → dispatchActionState
```

## Causa raíz

`PublicSettingsForm` usa `useActionState` para `updatePublicBusinessSettingsAction`, pero el submit no delegaba en el mecanismo nativo de React.

El flujo en PAGE-1G sube assets pendientes (logo/portada) a Storage **antes** de persistir vía server action. Para eso se intercepta el submit con `preventDefault()`, se construye `FormData` manualmente y se invocaba:

```tsx
formAction(formData);
```

Esa llamada directa desde un event handler async queda **fuera de una transición de React**, lo que dispara el warning en React 19 / Next 16.

## Patrón incorrecto encontrado

```tsx
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  // ... uploads ...
  const formData = new FormData(currentForm);
  formData.set("logo_url", nextLogoUrl);
  formData.set("cover_image_url", nextCoverUrl);
  formAction(formData); // ← fuera de transition
}
```

```tsx
<form onSubmit={handleSubmit}>
```

Sin `action={formAction}` y con invocación manual de la función devuelta por `useActionState`.

## Solución aplicada

Se mantiene el flujo de upload previo (requerido por negocio) y se envuelve la invocación de `formAction` en `startTransition`:

```tsx
startTransition(() => {
  formAction(formData);
});
```

**Por qué no `<form action={formAction}>` puro:** el submit debe esperar uploads async a Supabase Storage y actualizar URLs en `FormData` antes de la server action. Eso obliga a interceptar el submit; `startTransition` es el patrón aprobado por React para este caso.

**Alternativa descartada sin cambio de scope:** `requestSubmit()` tras uploads — requeriría sincronizar hidden inputs al DOM antes del submit nativo; el `FormData` explícito actual es más fiable y ya estaba probado en 1G.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-settings-form.tsx` | Import `startTransition`; wrap `formAction(formData)` |

## Qué se preservó

- Dirty state (`hasPendingChanges`, labels, pending notice)
- Upload flow (logo/portada a Storage antes de save)
- Server action `updatePublicBusinessSettingsAction` (sin cambios)
- `router.refresh()` post-success
- Botones: Sin cambios / Guardar cambios / Guardando... / Subiendo imágenes... / Guardado
- Checklist, preview, brand palette
- UI visual

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint 9 circular config flake preexistente (`Converting circular structure to JSON`) |

## QA manual

En `/admin/settings/public/landing`:

1. Abrir sin warnings en consola — PASS
2. Editar descripción e Instagram — dirty state activo (`Guardar cambios`) — PASS
3. Guardar → `Guardando...` → `Guardado` — PASS
4. Mensaje `Cambios publicados correctamente.` — PASS
5. Sin warning `useActionState` / React / Next en submit — PASS (hooks de consola sin capturas del warning)
6. Refresh → descripción e Instagram persisten — PASS

## Resultado

Hotfix mínimo: una línea de comportamiento + import. Restaura el contrato de React 19 para acciones de `useActionState` invocadas manualmente tras lógica previa al submit, sin alterar funcionalidad de SETTINGS-PAGE-1G.
