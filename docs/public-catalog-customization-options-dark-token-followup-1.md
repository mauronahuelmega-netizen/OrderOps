# PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-DARK-TOKEN-FOLLOWUP-1

## Estado

PASS WITH BROWSER/ANDROID QA DEBT - CUSTOMIZATION OPTIONS DARK SOURCE VERIFIED

## Problema corregido

En dark, el modal de personalizacion resolvia los tokens globales `--bg-*` y `--text-*`, que corresponden al baseline light, en lugar de la familia `--catalog-*` del catalogo publico.

## Causa encontrada

`CustomizationModal` se renderiza dentro de `.catalog-page[data-theme]`, pero sus CSS Modules usaban variables globales sin derivarlas desde el scope del catalogo. Sheet, header, footer y rows podian conservar una superficie light en dark.

## Selectores/tokens usados

`.catalog-page[data-theme="dark"]` alcanza directamente al modal. El modal define `--customization-sheet-bg`, `--customization-row-bg`, `--customization-border`, `--customization-text` y variantes muted derivadas de `--catalog-surface-strong`, `--catalog-bg`, `--catalog-border`, `--catalog-text` y `--catalog-muted`.

## Dark theme

Backdrop oscuro separado; sheet, header, body y footer usan una superficie dark solida. Rows, badges, estados selected/disabled y controles heredan el mismo scope sin transparencia ni glass.

## Light baseline

Light sigue derivando las mismas variables desde los tokens light de `.catalog-page`; no se modificaron layout, spacing, datos ni handlers.

## Contratos preservados

No se tocaron contenido DB/admin, required/min/max, selection type, pricing, validacion, signatures, cart lines, post-add, cache/in-flight, focus trap, Escape, return focus ni scroll lock.

## QA visual

BROWSER/ANDROID VISUAL QA DEBT - source/build verified. Pendiente comprobar Doble Smash en light/dark, rows selected/disabled, error, footer sticky y scroll interno en dispositivo real.

## Console/Network

UNVERIFIED BY ENVIRONMENT. El cambio es solo de superficies CSS y no agrega requests, actions ni payloads.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-FLAT-POLISH-1 = ALLOWED
