# PUBLIC-CATALOG-MOBILE-DENSITY-CORRECTIVE-PASS-1
## Corrective Visual Pass for Mobile Fold, Category State and Compact Cards

## Estado

PARTIAL — BROWSER VISUAL QA REQUIRED

La densidad visual fue verificada por captura en Chrome local, pero la sesion de desarrollo preexistente no permitio cerrar la interaccion completa: HMR fallo y los recursos externos fueron bloqueados por el sandbox. El build tampoco finalizo antes del timeout de 120 segundos. Esta fase no habilita el siguiente gate.

## Defectos y causa

- La regla activa ya usaba el accent, pero no tenia una regla final suficientemente explicita para asegurar `color`, `background`, borde y opacidad frente a estilos globales acumulados.
- `ProductCard` mantenia media cuadrada y el hit area con `flex: 1`; ese estiramiento dejaba espacio vacio entre la descripcion y el footer en filas de altura desigual.
- Header, hero, categorias y search conservaban separaciones y tamanos mayores que los objetivos del fold mobile.

## Correcciones

- Header mobile: inner de 72px, logo de 56px y hamburger de 44px.
- Hero: gap reducido y media limitada a 184px en mobile; copy con line-height compacto.
- Categorias: chips de 42px, gap reducido, scrollbar oculto y estado activo explicito con `--business-primary` y `--business-primary-foreground`.
- Search: campo de 48px, con menor margen y padding vertical.
- Headings: titulo de 21px, contador de 14px y gaps reducidos.
- ProductCard: media `4 / 3` en mobile, body/footer de 10px, texto compacto y flujo sin `flex: 1` en el hit area/body. Desktop conserva media cuadrada.

## Evidencia visual

- `390x844`: header, hero, copy, categorias, search, heading y una primera card util aparecen en el primer viewport.
- `430x932`: misma jerarquia compacta, sin overflow horizontal observado.
- `1440x900`: shell y hero conservan su escala; la imagen se observo mediante Chrome local.
- El servidor local devolvio HTTP 200 para catalogo, checkout y success.

## Interaccion y consola

- Los callbacks, `aria-pressed`, scroll-spy, quick add, personalizacion, carrito y checkout no fueron modificados.
- La sesion local no hidrato el input para cerrar pruebas interactivas. La consola no informo `pageerror` ni errores React; registro fallos de HMR y recursos externos bloqueados por el sandbox, no atribuibles a este correctivo.
- Active chip runtime, quick add, configurable, Cart FAB, dark mode y network funcional: UNVERIFIED en esta corrida.

## Validacion tecnica

| Control | Resultado |
| --- | --- |
| TypeScript | PASS - `tsc.cmd --noEmit` |
| Build | TIMEOUT - `npm.cmd run build` excedio 120s |
| Catalogo | PASS - HTTP 200 en Chrome local |
| Checkout | PASS - HTTP 200 en Chrome local |
| Success | PASS - HTTP 200 en Chrome local |
| `git diff --check` | PASS |

## Seguridad y alcance

- Solo se modificaron estilos de header, hero, discovery controls, categorias, headings, grid y ProductCard.
- DB changes: 0. RPC/action changes: 0. Package changes: 0. Real orders: 0.
- Commit: no. Push: no. Deploy: no. Temporary QA artifacts: 0.

## Gate siguiente

```text
QUEUE_GATE: PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1 = BLOCKED
```

Requiere una corrida posterior con build finalizado y browser local sin bloqueo de HMR/recursos para comprobar active chip, quick add, configurable, Cart FAB y dark mode.
