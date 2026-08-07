# PUBLIC-CATALOG-POST-ADD-UPSELL-ROW-COMPOSITION-FOLLOWUP-1

## Estado

PASS WITH BROWSER/ANDROID QA DEBT - POST-ADD UPSELL ROW COMPOSITION SOURCE VERIFIED

## Problema corregido

Cada item mostraba la accion debajo de todo el contenido y repetia el precio en el boton, lo que hacia que el CTA se percibiera desconectado.

## Decision visual

La lista vertical se conserva, pero cada candidate ahora usa una row horizontal: imagen 1:1 a la izquierda y contenido con accion integrada a la derecha.

## Row composition

La miniatura ocupa 80px (76px en viewport muy estrecho). Nombre y precio quedan arriba a la derecha; la accion se ancla al borde inferior derecho del mismo bloque.

## Image 1:1

Imagen, placeholder, loader, alt decorativo y origen de datos no cambian. La miniatura conserva object-fit cover, border y surface tokenizada.

## CTA simplification

El texto visible pasa de `Agregar · importe` a `Agregar`; el importe se muestra una vez en la row. `aria-label` conserva producto e importe. `Agregado`, pending, disabled y error mantienen sus ramas.

## Accessibility

Se preservan dialog, focus trap, Escape, backdrop, scroll lock, aria-busy, error association, foco inicial y targets de 44px. Return focus sigue como deuda por la transicion directa a CartSheet.

## Light/Dark

Se preservan los tokens `--post-add-*`, superficies solidas, backdrop, X y jerarquia Add/Skip.

## Contratos preservados

Created-only, candidates DB/admin, orden, attach multiple, parent/child, signatures, estados idempotentes, dismiss a CartSheet y checkout no cambian.

## QA visual

BROWSER/ANDROID QA DEBT - source/build verified. Pendiente validar rows, attached, footer y dark/light sobre Android real.

## QA funcional

Sin cambios en candidate map, keys, disabled/pending logic, attach flow, attachedCount, finishOnce ni CatalogClient.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-INTERACTION-QA-FIX-1 = ALLOWED
