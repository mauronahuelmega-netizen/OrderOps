# Admin Settings Public Landing — SETTINGS-PAGE-1E Brand Palette Control UX

## Objetivo

Reemplazar la selección libre de color por una **paleta curada de 16 colores seguros** en `/admin/settings/public/landing`, preservando el contrato `primary_color` y la preview admin sincronizada.

## Contexto

- Fases previas: overflow (1A), editor+preview (1B), responsive (1C), asset upload (1D), interaction QA (1D-QA).
- Iteración previa 1E (color libre + picker + HEX) fue reemplazada por decisión de producto V1.

## Decisión de producto

Se eliminó la selección libre visible de color para V1 y se reemplazó por una paleta curada, evitando combinaciones con bajo contraste o inconsistentes con la experiencia pública.

Motivo: el color libre aumenta riesgo de bajo contraste, botones ilegibles, combinaciones visuales pobres y mayor complejidad de soporte.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-settings-form.tsx` | Integra `BrandPaletteControl`, preview con color válido |
| `components/admin/settings/public-settings.css` | Paleta full-width en grid Identidad (≥720px) |
| `docs/admin-settings-public-landing-forensic-audit-page-1a.md` | Follow-up 1E actualizado |
| `docs/admin-settings-v1-final-handoff.md` | Nota paleta segura |

## Archivos creados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/brand-palette.ts` | Definición paleta + helpers |
| `components/admin/settings/brand-palette-control.tsx` | UI de paleta |
| `components/admin/settings/brand-palette-control.module.css` | Estilos |
| `docs/admin-settings-public-landing-page-1e-brand-palette-control-ux.md` | Este documento |

## Archivos eliminados

| Archivo | Motivo |
|---------|--------|
| `components/admin/settings/brand-color-control.tsx` | Reemplazado por paleta |
| `components/admin/settings/brand-color-control.module.css` | Reemplazado por paleta |

## Cambio principal aplicado

`BrandPaletteControl` muestra 16 swatches seleccionables + opción legacy si el color publicado no está en paleta. Un único `input[type="hidden"][name="primary_color"]` envía el HEX al submit.

## Brand color contract preservation

| Aspecto | Preservado |
|---------|------------|
| Field name | `primary_color` |
| Server action | `updatePublicBusinessSettingsAction` (sin cambios) |
| Validación server | `#RRGGBB` |
| DB column | `businesses.primary_color` |
| Upload logic | Sin cambios |
| Un solo input con `name` | `hidden` único |

## Palette definition

16 colores V1 en `brand-palette.ts`: Naranja fuego, Rojo parrilla, Bordó, Rosa intenso, Violeta, Índigo, Azul, Azul profundo, Teal, Verde, Oliva, Ámbar tostado, Dorado profundo, Marrón, Grafito, Negro suave.

## Legacy color handling

Si `publishedValue` no está en paleta (ej. `#2563EB` de configuración anterior):

- Se muestra card **Color actual** con HEX visible (solo lectura, no editable).
- Aparece seleccionada al cargar si el valor local coincide.
- Copy: *Este color viene de una configuración anterior…*
- Al elegir color de paleta, el valor queda restringido a paleta.
- Sin migración automática.

## Palette UI

- Grid `auto-fit minmax(130px, 1fr)` desktop/tablet.
- 2 columnas en mobile ≤719px.
- Sin input HEX visible ni `input[type="color"]`.
- Estado activo: `aria-pressed`, borde/fondo destacado.

## Accessibility

- Cada color: `type="button"`, `aria-pressed`, `aria-label` con nombre del color.
- `focus-visible` con `--focus-ring`.
- Touch targets ≥44px (48–52px mobile).

## Preview sync

`--preview-brand` usa `normalizeHexColor(primaryColor)` con fallback a color publicado y `var(--accent-primary)`.

Validado: click en **Naranja fuego** → hidden `#C2410C` + preview `#C2410C`.

## Mobile/tablet UX

| Breakpoint | Resultado |
|------------|-----------|
| Desktop 1440px | Paleta full-width bajo logo, sin overflow |
| Tablet 820px | Grilla usable, sin overflow |
| Mobile 390px | 2 columnas, touch targets amplios, sin overflow |

## Browser QA desktop

| Check | Resultado |
|-------|-----------|
| Paleta visible (16 + legacy si aplica) | ✅ |
| Sin input HEX visible | ✅ |
| Sin color picker visible | ✅ |
| Hidden `primary_color` único | ✅ |
| Legacy `#2563EB` preservado | ✅ |
| Click paleta → preview sync | ✅ |
| Sin overflow horizontal | ✅ |

## Browser QA tablet

820px — paleta presente, sin overflow ✅

## Browser QA mobile

390px — grilla 2 col, sin overflow ✅

## Save smoke test

**Pendiente** — preview y hidden input validados; save + refresh no re-ejecutado en esta sesión.

## No regression checks

| Ruta | HTTP |
|------|------|
| `/admin/settings/public/catalogo` | 200 ✅ |
| `/admin/settings/public` | 200 ✅ |
| `/admin/settings` | 200 ✅ |
| `/admin/settings/public/landing` | 200 ✅ |

## Qué se preservó

- `updatePublicBusinessSettingsAction`
- Form action y field name `primary_color`
- Upload logic (1D)
- Bucket `business-assets`
- DB/RLS
- Permissions y rutas
- Validación server-side HEX
- Landing pública y catálogo
- `SettingsShell` / `SettingsNavigation`

## Qué NO se cambió

- No server action changes
- No DB changes
- No RLS changes
- No storage policy changes
- No upload behavior changes
- No public landing real redesign
- No checkout changes
- No products changes
- No `theme-tokens.css` / `globals.css`

## Riesgos

- Colores legacy persisten hasta que el usuario elija de paleta (comportamiento deseado).
- Negocios con muchos colores legacy distintos no se migran automáticamente.

## Deuda restante

- Save smoke + refresh de color
- SETTINGS-PAGE-1D-QA: save/refresh assets pendiente
- SETTINGS-PAGE-1F — Preview Accuracy & Publish Confidence

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9 circular `plugins.react` |

## Próxima fase recomendada

**SETTINGS-PAGE-1F — Preview Accuracy & Publish Confidence**
