# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-ESCAPE-REGRESSION-FIX-1
## Restore Escape Close, Focus Trap and Trigger Focus Return

## Estado

PARTIAL — CUSTOMIZATION MODAL BROWSER QA INCOMPLETE

## Reproducción y causa raíz

- `Doble Smash` abría el modal y el botón `Cerrar` funcionaba, pero `Escape` no cerraba el diálogo.
- `CustomizationModal` solo gestionaba scroll lock: no tenía listener de `keydown`, foco inicial, trap de `Tab` ni restauración del trigger.

## Fix

- Se agregó un único listener de `keydown` en captura durante el ciclo de apertura.
- `Escape` previene propagación y ejecuta un cierre idempotente.
- El foco inicial entra en `Cerrar personalización`.
- `Tab` y `Shift+Tab` envuelven los controles dentro del diálogo.
- Al desmontar, el foco vuelve de forma diferida al trigger conectado, evitando interferencia del replay de efectos de Strict Mode.
- Backdrop y botones de cierre usan el mismo cierre idempotente.

## Dev local QA

- `BROWSER QA ENVIRONMENT = NEXT DEV LOCAL`.
- URL: `http://localhost:3000/b/demohamburgueseria/catalogo`.
- Mobile light, config `ready`: foco inicial dentro del diálogo; 12 controles tabulables; Tab/Shift+Tab atrapados; Escape desde radio cierra; foco restaurado a `Elegir opciones para Doble Smash`.
- Desktop light, config `ready`: Escape desde checkbox cierra y devuelve foco al mismo trigger.
- El botón `Cerrar` mantiene el cierre y la restauración. Backdrop conserva su handler compartido.
- La corrida mobile dark no pudo completarse antes del timeout de automation Dev. No se declara validada.

## Network y consola

- Primer open on-demand: un POST esperado.
- Cierre por Escape: cero requests.
- Sin `pageerror`, React ni hydration errors en las corridas completas.
- `ERR_NETWORK_ACCESS_DENIED` de recursos externos se clasifica como ruido del sandbox.

## Validación

- TypeScript: PASS.
- Build: PASS (`npm.cmd run build`, 260.1s).
- No se modificaron opciones, precios, selección, cache, Plus, post-add, carrito ni checkout.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1 = BLOCKED
```

Completar mobile dark del modal (contraste, focus-visible, Escape y restauración) con una sesión Dev estable antes de habilitar el siguiente gate.
