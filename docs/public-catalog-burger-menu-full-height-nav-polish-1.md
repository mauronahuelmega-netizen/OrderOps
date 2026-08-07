# PUBLIC-CATALOG-BURGER-MENU-FULL-HEIGHT-NAV-POLISH-1
## Full-height public navigation sheet with bottom utilities

## Estado

PARTIAL — BURGER MENU FULL HEIGHT QA INCOMPLETE

## Cambios

- El sheet usa el alto disponible de `100dvh`, respeta safe areas y organiza su contenido con flex column.
- Home y Catalogo permanecen en la zona superior; redes cuando existan, modo visual y Staff se agrupan como utilidades al fondo.
- El contenido tiene scroll interno solo cuando excede la altura disponible.
- El estado activo conserva fondo sutil, borde neutro e indicador pequeno, sin borde oscuro dominante ni sombra.
- `ThemeToggle` conserva su persistencia y `data-catalog-theme`; los emojis se reemplazaron por SVGs decorativos inline porque `lucide-react` no existe en este proyecto.

## Accesibilidad preservada por source

- Dialogo nombrado con `role="dialog"` y `aria-modal="true"`.
- Foco inicial, trap Tab/Shift+Tab, Escape, retorno al trigger, backdrop clickable y scroll lock permanecen en el mismo lifecycle del menu.

## QA

- Browser, teclado, Android, console y network: UNVERIFIED IN THIS RUN. Playwright no dispone del binario Chromium local y no se instalaron binarios.
- TypeScript: PASS.
- Build: PASS (`next build`, 146s).
- HTTP local: PASS para catalogo, checkout y success (`200`).
- `git diff --check`: PASS.

## Gate

QUEUE_GATE: PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1 = BLOCKED

Se requiere browser real para validar alto del sheet, utilidades inferiores, light/dark, Tab, Shift+Tab, Escape, retorno de foco, backdrop y scroll lock.
