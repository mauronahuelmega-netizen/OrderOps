# PUBLIC-CATALOG-BURGER-MENU-DARK-SURFACE-TOKEN-POLISH-1
## Dark surface token polish for public full-height burger menu

## Estado

PARTIAL — BURGER MENU DARK QA INCOMPLETE

## Causa encontrada

La cascada dark previa combinaba superficies `rgba(...)` del drawer con reglas globales de sheet/backdrop. Esa mezcla podia hacer que filas y utilidades parecieran vidrio aunque el backdrop era la unica capa que debia ser translúcida.

## Correccion aplicada

- `html[data-catalog-theme="dark"]` consolida el sheet sobre `--business-header-bg` con `opacity: 1` y sin `backdrop-filter`.
- `--business-drawer-surface` se deriva como color solido con `color-mix`, reutilizando tokens del header dark.
- Enlaces, preferencias, activo y track del ThemeToggle usan superficies y bordes del drawer; no dependen de transparencia.
- El backdrop conserva su selector separado y su transparencia propia.

## Baseline light y accesibilidad

No se modificaron selectores light ni el lifecycle de dialogo: foco inicial, trap Tab/Shift+Tab, Escape, retorno al trigger, scroll lock y backdrop permanecen intactos por source.

## QA

- Dark/light visual, browser, Android, teclado, console y network: UNVERIFIED IN THIS RUN. Playwright no tiene Chromium local y no se instalaron binarios.
- TypeScript: PASS.
- Build: PASS (`next build`, 179s).
- HTTP local: PASS para catalogo, checkout y success (`200`).
- `git diff --check`: PASS.

## Gate

QUEUE_GATE: PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1 = BLOCKED

Se requiere browser real para verificar que el sheet no permite leer el catalogo de fondo, que el backdrop es separado y que light/dark conservan legibilidad.

## Reopened fix

### Causa real

`public-business-header__portal` y su sheet son hermanos del `header`. Las variables `--business-header-*` y `--business-primary` se definian sobre el header, por lo que el portal no las heredaba. En dark, `--business-drawer-bg: var(--business-header-bg)` quedaba sin resolver y el fondo visual del sheet podia caer a transparente.

### Correccion

- El portal recibe `headerStyles`, para heredar el accent y foreground del negocio.
- `html[data-catalog-theme="dark"] .public-business-header__portal` declara el scope de tokens dark que necesita el sheet hermano.
- El sheet conserva el fondo opaco `--business-drawer-bg`; backdrop, rows y ThemeToggle permanecen en selectores separados.

### QA y gate

- Source: VERIFIED. El selector y elemento DOM afectados quedan reconciliados.
- Dark/light visual, keyboard, console y network: UNVERIFIED IN THIS RUN por falta de browser con Chromium.
- TypeScript: PASS.
- Build: PASS (`next build`, 145s).
- HTTP local: PASS para catalogo, checkout y success (`200`).
- `git diff --check`: PASS.
- KEYBOARD QA DEBT — source lifecycle unchanged.

QUEUE_GATE: PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1 = BLOCKED
