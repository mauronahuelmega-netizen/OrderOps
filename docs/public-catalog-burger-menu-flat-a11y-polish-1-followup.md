# PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1-FOLLOWUP
## Soften active state and close real browser/keyboard QA

## Estado

PARTIAL — BURGER MENU FOLLOWUP QA INCOMPLETE

## Defecto corregido

El estado activo ya no usa el rail inset ni el borde mezclado con `--business-primary`, que para un tenant con accent oscuro podia percibirse como un borde negro dominante. Ahora usa un borde neutro suave, fondo surface con 5% del accent e indicador circular pequeno; el anillo de `focus-visible` sigue reservado al foco por teclado.

## Accesibilidad preservada por source

- Dialogo con `role="dialog"`, `aria-modal="true"` y nombre accesible.
- Foco inicial en `Cerrar menu`.
- Trap de `Tab` / `Shift+Tab`, cierre con `Escape`, retorno al trigger y scroll lock existentes de la fase anterior.
- Backdrop fuera del orden de tabulacion y clickable.

## QA

- Browser y teclado: UNVERIFIED IN THIS RUN. Playwright no puede iniciar por falta del binario Chromium local; no se instalaron dependencias ni binarios.
- Viewports `384x824`, `390x844`, `412x914`, `430x932`, `768px` y `1440x900`: pendientes de browser real.
- Console y network: UNVERIFIED IN THIS RUN.
- TypeScript: PASS.
- Build: PASS (`next build`, 151s).
- HTTP local: PASS para catalogo, checkout y success (`200`).
- `git diff --check`: PASS.

## Gate

QUEUE_GATE: PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1 = BLOCKED

El gate requiere QA browser real de light/dark, estado activo, foco inicial, Tab, Shift+Tab, Escape, retorno al trigger, backdrop y scroll lock.
