# PUBLIC-CATALOG-POST-ADD-UPSELL-LIST-DENSITY-POLISH-1

## Estado

PASS WITH BROWSER/ANDROID QA DEBT - POST-ADD UPSELL LIST DENSITY SOURCE VERIFIED

## Problemas corregidos

Las filas tenian demasiado padding y el boton de cada adicional ocupaba todo el ancho, dando a la lista una densidad innecesariamente pesada.

## List density

Se redujeron padding, gaps y espaciado del header, body y footer. La lista sigue siendo vertical y conserva su scroll interno.

## Item composition

Cada candidate mantiene thumbnail, nombre, precio, estado/error y CTA; `Agregar`/`Agregado` ahora se alinean al final del item con ancho de contenido y target de 44px.

## Thumbnail polish

El thumbnail pasa a 64px, con borde, radius y superficie tokenizada existentes. Imagen, placeholder, loader y alt decorativo no cambian.

## Add/attached states

Agregar conserva el accent de negocio. Agregado conserva su superficie secundaria; pending, disabled y error mantienen sus ramas y atributos existentes.

## Footer density

Ahora no/Listo conserva ancho completo y target tactil, pero usa padding y radius mas contenidos para permanecer secundario.

## Light/Dark preservation

Se preserva el scope `--post-add-*`: sheet, rows, backdrop y jerarquia dark/light no fueron retokenizados.

## Accesibilidad

Se preservan dialog, foco inicial, Tab/Shift+Tab trap, Escape, backdrop close, scroll lock, aria-busy, errores asociados, focus-visible y targets minimos de 44px. Return focus sigue como deuda por la transicion directa a CartSheet.

## Contratos preservados

Created-only, candidates DB/admin, order, attach multiple, signatures, parent/child, cantidad heredada, estados idempotentes, dismiss hacia CartSheet y checkout no cambian.

## QA visual

BROWSER/ANDROID QA DEBT - source/build verified. Pendiente validar densidad, estados attached y footer en dark/light sobre Android real.

## Console/Network

UNVERIFIED BY ENVIRONMENT. Esta fase no agrega requests, actions ni payloads.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-INTERACTION-QA-FIX-1 = ALLOWED
