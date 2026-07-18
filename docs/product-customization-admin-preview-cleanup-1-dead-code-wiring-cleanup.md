# PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 — Admin Preview Dead Code & Wiring Cleanup

## Objetivo

Eliminar deuda técnica dejada por la preview placeholder admin tras
`PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1`, sin cambiar comportamiento ni diseño visible.

## Contexto

La preview válida es la sandbox interactiva:

```txt
/admin/products/customizations
→ AdminCustomizationLivePreview
→ shared presentational components
→ estado local sandbox
```

`CustomerPreviewPanel` (`customer-preview-panel.tsx`) era la preview placeholder anterior
(“Vista previa orientativa · no agrega al carrito”).

Overrides en mapper admin quedan **fuera** de esta fase.

## Alcance

- Auditoría de referencias a `CustomerPreviewPanel` / CSS del placeholder
- Eliminación del archivo muerto si 0 imports
- Limpieza CSS huérfana del preview anterior
- Docs + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`
- Validación local admin + pública
- Deploy (autorizado)

## Fuera de scope

- Overrides en mapper
- Cambios de comportamiento sandbox / modal público
- DB / RLS / migrations / cart / checkout / stock / flags / pedidos QA

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_CLEANUP_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_CLEANUP_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_CLEANUP_TO_VERCEL=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status --short` | OK (docs tmp previos + working tree) |
| `npx tsc --noEmit` | PASS (`EXIT:0`) |
| `npm run build` | PASS (`EXIT:0`) |

## Auditoría de referencias

### CustomerPreviewPanel

| Ubicación | Estado |
|-----------|--------|
| `components/admin/product-customization/customer-preview-panel.tsx` | Definición única (sin consumers) |
| `app/`, `lib/`, imports TS/TSX | **0** imports activos |
| Barrel / dynamic import / tests runtime | No encontrado |
| Docs históricas | Solo menciones de deuda (no runtime) |

### Preview nueva (activa)

| Símbolo | Uso |
|---------|-----|
| `AdminCustomizationLivePreview` | `owner-customization-builder.tsx` |
| `admin-preview-mapper` | live preview |
| `preview-selection` | live preview + modal público |

### CSS placeholder (solo en panel viejo)

```txt
previewProductCard, previewModalCard, previewModalTitle
previewSection, previewSectionTitle
previewOptionList, previewOptionRow
previewRadio, previewCheck, previewDelta
previewMuted, previewFoot
```

### CSS retenido (usado por sandbox)

```txt
previewPanel, previewHeader, previewSummary, previewBody, previewNote
previewEmpty, previewProductName, previewProductPrice
previewLiveShell, previewLiveHeader, previewLiveEyebrow
previewLiveBody, previewLiveFooter
previewDesktop, previewMobile
```

## Archivos eliminados

| Archivo | Motivo |
|---------|--------|
| `components/admin/product-customization/customer-preview-panel.tsx` | 0 imports; reemplazado por `AdminCustomizationLivePreview` |

## Imports / wiring limpiado

- No había imports muertos residuales en builder (ya cableado a live preview).
- No se tocó el modal público (sin imports al panel viejo).

## CSS limpiado

En `product-customization-admin.module.css` se eliminaron únicamente las clases del
placeholder listadas arriba. Sin cleanup masivo ni cambios a tokens globales.

## Tipos / helpers revisados

| Símbolo | Acción |
|---------|--------|
| `PreviewProduct` / `CustomerPreview` / `PreviewOption` types dedicados al panel viejo | No existían fuera del componente eliminado |
| `PublicProductCustomizationConfig` | Conservado (público + mapper) |
| `admin-preview-mapper` / `preview-selection` | Conservados |
| `types/database.ts` | No tocado |

## Validación local admin

`http://localhost:3000/admin/products/customizations`

| Check | Resultado |
|-------|-----------|
| Pantalla carga | OK |
| Seleccionar Doble Smash | OK |
| Preview interactiva | OK (Papas / Salsas / Agregados / Sumá una bebida / Coca) |
| Single / multi / plus toggle | OK (CDP) |
| Total estimado | OK (`$ 16.450,00` = base + papas medianas + Coca) |
| CTA no operativo | OK (`Agregar al pedido` disabled) |
| Tabs Secciones / Plus / Por producto | OK |
| Console críticos | No observados |

## Validación local pública

`http://localhost:3000/b/demohamburgueseria/catalogo`

| Check | Resultado |
|-------|-----------|
| Catálogo carga | OK |
| Modal Doble Smash | OK |
| Papas / Salsas / Agregados / Sumá una bebida / Coca | OK |
| CTA `Agregar al carrito` presente | OK (disabled hasta requeridos) |
| Confirmar pedido | No realizado (fuera de scope) |

## No side effects

- Admin preview no escribe localStorage / carrito / pedidos
- Sin migrations nuevas
- Sin cambios DB / RLS / server actions de cart-checkout
- Sin writes en QA

## Deploy

Pendiente en el momento de redactar este archivo; se completa tras commit push a `main`.

## Browser QA

Autorizado y ejecutado en localhost (admin + público). Ver secciones de validación.

## Compatibilidad

- Sandbox admin: sin cambio de comportamiento
- Modal público: sin cambio de comportamiento
- Shared presentational components: intactos

## Qué NO se tocó

- Overrides en mapper
- Cart / checkout / `create_order`
- DB / schema / RLS / migrations
- Stock / restock / flags
- `admin-surfaces.css` / CSS globales de dominio

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | Opcional / no requerido |

## Riesgos / deuda

| Deuda | Notas |
|-------|-------|
| Overrides no en mapper admin V1 | Fuera de scope (ya documentado en polish) |
| Hint de max también en público | Minor UX; fuera de scope |
| Menciones históricas en docs/spec | Intencionales (historial); no runtime |

## Rollback plan

1. Restaurar `customer-preview-panel.tsx` desde git si se necesitara el placeholder.
2. Revertir el commit de cleanup CSS en `product-customization-admin.module.css`.
3. Redeploy. La sandbox live preview no depende del panel eliminado.

## Resultado final

**PASS** (local + deploy autorizado; ver CURRENT_PHASE tras push).

Se eliminó la preview placeholder y CSS huérfano asociado. La sandbox interactiva y el
modal público siguen operativos.

## Próxima fase recomendada

Opcional: incluir overrides en `admin-preview-mapper` para alinear preview admin con
excepciones por producto; o monitor piloto sin más cleanup.
