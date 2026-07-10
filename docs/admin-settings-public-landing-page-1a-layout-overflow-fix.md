# Admin Settings Public Landing — SETTINGS-PAGE-1A Layout & Overflow Fix

## Objetivo

Corregir los dos hallazgos **P1** del audit forense en `/admin/settings/public/landing`:

- **L-01** — overflow horizontal por `input[type="file"]` heredando `width: 100%` desde `.admin-field input`.
- **L-02** — campo "Color de marca" estirado por `align-items: stretch` en grid identidad.

## Contexto

- Audit: `docs/admin-settings-public-landing-forensic-audit-page-1a.md`
- Form: `PublicSettingsForm` en `public-settings.css` (import global en admin layout)
- Sin cambios en data-flow, actions, uploads ni preview

## Hallazgos corregidos

- **L-01** — File inputs vuelven a patrón sr-only accesible (1×1px, clip, sin ancho de layout).
- **L-02** — Color de marca compacto (~46px) en desktop/tablet ≥720px.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-settings.css` | Override file input + `align-items: start` en grid identidad |

## Archivos creados

- `docs/admin-settings-public-landing-page-1a-layout-overflow-fix.md` (este documento)

## Fix 1 — File input overflow

**Problema:** `.admin-field input { width: 100% }` en `admin-surfaces.css` ganaba sobre `.admin-settings-upload__input`.

**Solución (local, sin tocar `admin-surfaces.css`):**

1. `position: relative` en `.admin-settings-upload` para contener el input absoluto.
2. Selector más específico:
   - `.admin-field .admin-settings-upload__input`
   - `.admin-settings-upload .admin-settings-upload__input`
3. Restaurar patrón sr-only: `width/height: 1px`, `clip-path: inset(50%)`, reset de `min-height`, `padding`, `border`, `background`, `box-shadow`.

## Fix 2 — Color field stretch

**Problema:** `.admin-settings-public-assets` en `@media (min-width: 720px)` estiraba la columna color a la altura del logo (~315px → input ~118px).

**Solución:** `align-items: start` en el media query del grid identidad.

## CSS selectors touched

```css
.admin-settings-upload { position: relative; }

.admin-field .admin-settings-upload__input,
.admin-settings-upload .admin-settings-upload__input { /* sr-only overrides */ }

@media (min-width: 720px) {
  .admin-settings-public-assets {
    align-items: start;
  }
}
```

## Qué se preservó

- data-flow de `businesses`
- `updatePublicBusinessSettingsAction`
- bucket `business-assets`
- upload logic (`handleAssetUpload`)
- validations (client/server)
- DB/RLS
- permissions
- route structure
- preview actual
- `SettingsShell`
- `SettingsNavigation`

## Qué NO se cambió

- no server action changes
- no DB changes
- no RLS changes
- no storage changes
- no upload behavior changes
- no preview redesign
- no public landing redesign
- no routes changed
- no `admin-surfaces.css` global
- no `globals.css` / theme tokens

## Browser QA desktop

**Viewport:** 1440×900 (CDP)

| Métrica | Antes (audit) | Después |
|---------|---------------|---------|
| `scrollWidth` vs `clientWidth` | 1553 vs 1425 (+128px) | **1440 vs 1440** |
| File input bbox | ~1425×44 px | **1×1 px** |
| Color input height | ~118 px | **46 px** |
| Horizontal scrollbar | Sí | **No** |

## Browser QA tablet

**Viewport:** 820×1024 (CDP, `clientWidth` ≈ 805)

| Métrica | Antes | Después |
|---------|-------|---------|
| Page overflow | +48px | **0** |
| Color height | ~118px | **46px** |
| File inputs | ancho excesivo | **1×1px** |

## Browser QA mobile

**Viewport:** 390×844 (CDP)

| Métrica | Antes | Después |
|---------|-------|---------|
| Page `scrollWidth` | 422 (+32px) | **390 (= clientWidth)** |
| Color height | 46px (ya OK) | **46px** |
| Settings nav internal scroll | 606px rail | Sin cambio (contenido interno) |

## Upload smoke test

- `label[for="logo-file"]` y `label[for="cover-file"]` presentes y asociados a `input[type="file"]`.
- Inputs no visibles en layout (bbox 1×1, `position: absolute`).
- Labels "Cambiar logo" / "Cambiar portada" mantienen `htmlFor` correcto para abrir file picker.
- No se ejecutó upload real ni guardado (entorno seguro).

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake conocido ESLint 9 circular config (`plugins.react`) |

## Riesgos

- Bajo: overrides locales en `public-settings.css` solo afectan forms que usan clases `admin-settings-upload__*`.
- Catálogo settings no usa file uploads; sin impacto esperado.

## Deuda restante

- **L-03** — layout monolítico / preview enterrada
- **L-04** — preview aproximada vs `BusinessLandingPage`
- **L-05** — tabs mobile affordance (scroll interno sin fade)
- **L-06** — Guardar cambios no sticky
- **L-07** — nombre preview vía DOM scrape

## Próxima fase recomendada

**SETTINGS-PAGE-1B — Landing Preview & Form Hierarchy Polish**
