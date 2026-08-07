# PUBLIC-CATALOG-POST-ADD-UPSELL-SURFACE-TOKEN-A11Y-POLISH-1

## Estado

PASS WITH BROWSER/ANDROID QA DEBT - POST-ADD UPSELL SURFACE SOURCE VERIFIED

## Problemas corregidos

El sheet dejaba resolver superficies globales light en dark, el cierre era textual y la CTA de footer competia con los botones de upsell.

## Causa dark/tokens

El sheet vive dentro de `.catalog-page[data-theme]`, pero usaba `--bg-*`, `--text-*` y `--accent-*` globales. Esos tokens no expresan la superficie dark del catalogo publico.

## Surface tokens

El scope local `--post-add-*` deriva sheet, row, border, texto y muted desde `--catalog-*`; el selector dark refuerza sheet/rows solidos y backdrop separado sin afectar otros overlays.

## Cierre X

El boton conserva `finishOnce` y foco inicial, pero ahora usa X decorativa con `aria-label="Cerrar sugerencias"` y target de 44px. Return focus se mantiene como deuda: el cierre transiciona directamente a CartSheet.

## CTA hierarchy

`Agregar` usa el accent de negocio. `Agregado` y `Ahora no`/`Listo` usan superficies neutrales, preservando labels, handlers, attachedCount y la lista vertical.

## Light/Dark

Light conserva superficies claras tokenizadas. Dark usa sheet, header, body, footer y rows dark solidos; no hay glass ni opacidad sobre el sheet.

## Accesibilidad

Se preservan dialog, `aria-modal`, title/description, foco inicial, trap Tab/Shift+Tab, Escape, backdrop close, scroll lock, `aria-busy` y asociacion de errores. No se altero lifecycle ni transicion a CartSheet.

## Contratos preservados

Created-only, candidatos DB/admin, orden, attach de multiples children, signatures, parent/child, quantity heredada, recursion, notices, CartSheet y checkout no cambian.

## QA visual

BROWSER/ANDROID QA DEBT - source/build verified. Pendiente validar dark/light, attached, footer hierarchy, backdrop y Cart FAB en dispositivo real.

## Console/Network

UNVERIFIED BY ENVIRONMENT. El cambio no agrega requests, actions ni payloads.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-LIST-DENSITY-POLISH-1 = ALLOWED
