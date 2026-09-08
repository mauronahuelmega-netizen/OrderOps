# ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1

## 1. Result

**PASS WITH ACCEPTED NON-BLOCKING DEBT** — 2026-09-08.

P0: **0** · P1: **0** · P2: **2 accepted non-blocking** · P3: **2 documented**.
Los 4 P1 del modal siguen cerrados y verificados en runtime. Runtime tocado en esta fase:
**NINGUNO**. Pedidos creados: **0**.

## 2. Scope

Certificación integrada del modal manual tras 9 microfases (visual hierarchy audit, CTA/footer,
breakpoint overflow, configurator context, form validation UX, ticket summary hierarchy, surface
materiality, accessibility/interaction, microcopy). QA-first: observar, medir, clasificar,
documentar — **no reparar**.

## 3. Runtime environments

| Entorno | Estado |
|---------|--------|
| Local `localhost:3000` | **PASS** — admin autenticado, tenant **La Burguesía** |
| Producción `orderops.vercel.app/admin/dashboard` | **UNAVAILABLE** — redirige a `/admin/login`; no se pidieron ni adivinaron credenciales |

Preflight: `main` @ `3e418bb056f7cd5eabe0e79a6218ec7b825a8684`, nada staged, dirty esperado.
La sesión local había expirado al iniciar la fase; el owner autenticó y recién entonces se corrió la
matriz. Tema ejercido con el **toggle real** (`aria-label="Cambiar a modo claro/oscuro"` →
`html[data-dashboard-theme]`), nunca con `prefers-color-scheme`.

## 4. Evidence matrix

| # | Estado | Resultado |
|---|--------|-----------|
| 1 | 390 light — compose vacío | screenshot + medición |
| 2 | 390 dark — ticket configurado | screenshot + medición |
| 3 | 390 light — configurador incompleto | screenshot + medición |
| 4 | 390 dark — configurador con selecciones | screenshot + medición |
| 5 | 719 light — fondo/ticket/footer | screenshot + medición |
| 6 | 900 light — workstation | screenshot + medición |
| 7 | 1023 dark — límite product row | screenshot (recortado) + medición |
| 8 | 1440 dark — composición desktop | screenshot escalado + medición |

Widths medidos: **360, 390, 412, 719, 899, 900, 1023, 1024, 1440**. Temas: light + dark.

Limitación de método: el webview embebido tiene ~384 CSS px, así que los screenshots ≥719 se
recortan. Se resolvió con `Emulation.setDeviceMetricsOverride.scale` (el layout sigue midiéndose a
ancho real: `innerWidth` confirmado 719/900/1023/1024/1440). Para los anchos grandes la evidencia
primaria es **numérica**, no visual.

## 5. Compose QA

390 light + dark. Header: un solo `h2` "Nuevo pedido", subtítulo `Cargá un pedido tomado
manualmente.`, badge `Pedido manual` (×1, sin duplicar), close **44×44**. Jerarquía de headings
limpia: `h2` + 3 `h3` (Cliente / Entrega, Productos, Pedido), sin heading duplicado.

Cliente/Entrega: section card level 1 (light `rgb(255,255,255)`), inputs **recessed** a
`srgb(0.968,0.977,0.986)` — un campo ya no se lee como focused. Segmented Retiro/Delivery legible,
activo levantado, ambas opciones **44×88**.

Productos: helper legible, search **44** de alto, filas simples y configurables comparten el mismo
sistema material (level 2 sobre level 1); la configurable sólo añade el hint accent, sin dominar.
Precio legible, `+` **44×44**.

Pedido: `Resumen del pedido`, empty state `Todavía no agregaste productos` +
`Agregá productos para armar el pedido.`, `Total estimado` + nota. **`Ticket` no aparece** en copy
visible; **`Tocá +` no aparece**.

CTA vacío: `Agregá productos`, disabled neutro, claramente distinto del azul enabled.

## 6. Configurator QA

**P1-3 verificado con evidencia real** (el primer intento fue inválido porque el selector
`[class*="__body"]` matcheaba el wrapper del shell; se repitió contra
`[class*="manual-order-modal__body"]`):

- compose scrolleado a **338** (de 398 máx) → configurador entra en **0**;
- `Volver` restaura compose a **338 exacto**;
- reabrir otro producto configurable vuelve a entrar en **0**.

Entrada: header `Configurar Doble Smash`, subtítulo `Elegí las opciones para este producto.`,
close `Cerrar configuración de Doble Smash`, identidad + `Precio base $ 12.500,00` + `Cantidad`
`1–99` visibles, grupo obligatorio `Papas` primero (top 226).

Pristine: `0` cues `data-missing`, sin error duplicado agresivo; CTA disabled `Completá las
opciones`; razón bloqueante `Elegí una opción en "Papas".` con `data-tone="quiet"` en el área de
acción.

Selecciones: `Papas grandes` (obligatorio), `Mayonesa` + `BBQ` (opcional), `Bacon ×4` y
`Cheddar ×4` (cantidad), `Adicional Coca Cola 500ml`. Precio estable y correcto en cada paso:
14.250 → 15.250 → 15.750 → 18.750 → 20.250 → **23.250**. Selected usa **una sola familia accent**
(borde `srgb(0.140,0.370,0.876)/0.59` + fondo accent tenue) contra unselected neutro. Steppers
del configurador **44×44**. Sin overflow horizontal. `Volver` descarta el draft sin agregar
(total del ticket intacto).

Base price: **no se recorta** — right 378 sobre viewport 390, dentro del gutter de 12px de la
propia fila.

## 7. Ticket QA

Estado de estrés: 2 líneas root + producto configurado con 4 grupos + 2 extras con cantidad +
1 Adicional.

- Root: `1 × Coca Cola 500ml` $3.000,00 · `1 × Doble Smash` $20.250,00 — formato `{qty} × producto`, subtotal en columna propia, identidad del producto como elemento más fuerte de la línea.
- Grupos: `PAPAS` / `SALSAS` / `AGREGADOS EXTRA` con label propio y una fila por opción — **no es párrafo**. Delta de precio en columna propia, sin colisión texto↔precio.
- Cantidad de extras: `Bacon ×4 +$ 4.000,00`, `Cheddar ×4 +$ 2.000,00` — `×N` explícito.
- `Adicional`: micro-superficie anidada con indent + borde izquierdo accent, subtotal hijo propio `$ 3.000,00`. **Sin fugas técnicas**: `parentClientLineId` / `item_kind` / `clientLineId` / `snapshot` no aparecen (chequeado sobre el texto renderizado).
- Controles: stepper agrupado por proximidad, `Quitar` al borde opuesto, targets ≥44.
- Total: `TOTAL ESTIMADO $ 26.250,00` como figura más fuerte, sin jerarquía de precio duplicada.

Aritmética coherente: 12.500 + 1.500 + 250 + 4.000 + 2.000 = 20.250; + 3.000 (Adicional) + 3.000
(línea simple) = 26.250.

Root quantity 1 → 2: línea `2 × Doble Smash`, subtotal 20.250 → **40.500**, el Adicional sigue la
semántica existente (`×1 → ×2`, 3.000 → **6.000**), total → **49.500**. Jerarquía intacta (4 group
labels + upsell anidado), sin clipping ni overflow.

## 8. Materiality

Escala de 3 niveles legible como sistema, en ambos temas.

| | Light | Dark |
|---|---|---|
| Level 1 section | `rgb(255,255,255)` | `rgb(23,24,29)` |
| Level 2 row/input | `srgb(0.968,0.977,0.986)` | `srgb(0.111,0.115,0.134)` |
| Hairline | `srgb(0.631,0.631,0.667)/0.20` | accent-tinted `/0.25` |

Light: sin aplanamiento blanco-sobre-blanco, bordes de sección visibles, inputs distinguibles,
product rows claras. Dark: **no colapsa en un slab gris uniforme** — section ≠ canvas ≠ row son
distintos (`sectionVsCanvas: true`, `rowVsSection: true`), hairlines visibles, micro-superficie
`Adicional` separada, selected legible. Compose y configurador comparten la misma familia material
(group cards = section cards, option rows = inner rows).

## 9. Contrast

| Texto | Light (vs section) | Dark (vs section) |
|-------|--------------------|-------------------|
| Nombre de producto | `rgb(9,9,11)` | **16.94:1** |
| Nombre de opción | — | **11.94:1** |
| Group label del ticket | — | **10.79:1** |
| Nota del total / subtítulo | `rgb(82,82,91)` | **11.94:1** |
| Helper de producto (`--mo-text-aux`) | `srgb(0.384,0.384,0.419)` ≈ `rgb(98,98,107)` | — |

Todo el texto informativo medido supera AA (4.5:1) con amplio margen. P2-7 se confirma mejorado:
el helper usa `--mo-text-aux` (mezcla hacia `--text-secondary`), no el `--text-tertiary` tenue.
**Ningún texto informativo quedó ilegible.**

## 10. Accessibility

900 light, sobre el modal real:

| Check | Resultado |
|-------|-----------|
| Focusables en el diálogo | 20 |
| `tabindex` positivo | **0** |
| Tab desde el último | `preventDefault` → primero (`Salir del pedido manual`), foco dentro |
| Shift+Tab desde el primero | `preventDefault` → último (`Crear pedido · $ 49.500,00`), foco dentro |
| Tab en el medio | **no interceptado** (orden nativo preservado) |
| Foco escapa al dashboard | **NO** |
| Escape | cierra |
| Return focus | vuelve a `Crear nuevo pedido manual` |
| Disabled incluidos en focusables | 0 (selector `:not([disabled])`) |

Nota de método: `browser_press_key` no reproduce navegación por Tab de forma fiable en este webview
(devolvía siempre el close). La evidencia válida vino de despachar `keydown` real y leer
`defaultPrevented` + `document.activeElement`. Por la misma razón `:focus-visible` no se puede
disparar programáticamente (Chrome no marca modalidad teclado), así que la cobertura se verificó por
regla CSS: segmented (`:has(input:focus-visible)`), search, add, `Quitar`, stepper del ticket,
`optionButton`/`qtyOptionToggle`/`stepperButton` del configurador, `.admin-order-modal-shell__close`
y `.ui-button`. Sin `:focus` genérico y sin `outline: none` sin reemplazo (`outline-width: 3px`
declarado, `style: none` sólo mientras no matchea).

## 11. Responsive / breakpoints

| Width | Tema | Workstation | Row grid | Colisiones | Overflow |
|-------|------|-------------|----------|------------|----------|
| 360 | light | 1 col | apilada | 0 | no |
| 390 | light+dark | 1 col | apilada | 0 | no |
| 412 | light+dark | `388px` | apilada | 0 | no |
| 719 | light | `695px` | apilada | 0 | no |
| 899 | dark | `552px` | apilada | 0 | no |
| 900 | light+dark | `247.98px 300px` | **`135.98px 44px`** | 0 | no |
| 1023 | dark | `247.98px 300px` | **`135.98px 44px`** | 0 | no |
| 1024 | light | `580.5px 340.30px` | `388.08px 80.42px 44px` | 0 | no |
| 1440 | light+dark | `723.73px 424.27px` | `531.31px 80.42px 44px` | 0 | no |

**P1-4 (900–1023) — GATE PASS.** En 900 light, 900 dark y 1023 dark: identidad, categoría y helper
**contenidos**, precio `nowrap`, add **44×44**, cero colisión texto→precio y precio→botón, cero
`rowScrollOverflow`, cero scroll horizontal. El grid intermedio `135.98px 44px` se conserva y
1024 sale correctamente a la grilla de 3 columnas.

## 12. Single-scroll

**FROZEN.** En 360 / 390 / 412 / 719 / 899 el único elemento que scrollea es
`manual-order-modal__body` (`scrollOwnerCount: 1`), en compose y en configurador. Los wrappers del
shell (`panel--workstation`, `admin-order-modal__body--workstation`) son `overflow: hidden` — son el
marco, no scrollers; esto explica una lectura inicial confusa que se descartó midiendo los tres
contenedores.

En 900+ los dos panes (`__products-scroll`, `__summary-scroll`) scrollean por separado: es el diseño
workstation, no una regresión — el invariante de scroll único aplica a ≤899.

Footer `position: sticky` en todos los anchos, **no cubre contenido** (719: footer top 831 vs total
block bottom 820). Sin `position: fixed` nuevo, sin `scrollIntoView`, sin scroll de window.

## 13. Microcopy

Verificado sobre el DOM renderizado: `Tocá +` **ausente**, `Ticket` **ausente** del copy visible,
`Pedido` como término único. Presentes y correctos: `Configurá las opciones antes de agregarlo.`,
`Resumen del pedido`, `Todavía no agregaste productos`, `Agregá productos para armar el pedido.`,
`Elegí las opciones para este producto.`, `Cerrar configuración de {producto}`. Preservados:
`Cerrar nuevo pedido manual` + `Salir del pedido manual` (distintos entre sí).

Deferidos, **no contados como regresión**: `Requiere personalización` y
`Opcional · máx. N opciones`.

## 14. CTA/footer

| Estado | Copy | Aspecto |
|--------|------|---------|
| Compose vacío | `Agregá productos` | disabled neutro |
| Ticket válido / datos faltantes | `Completá los datos obligatorios` | disabled neutro |
| Listo | `Crear pedido · $ 49.500,00` | enabled azul, acción más fuerte |
| Configurador incompleto | `Completá las opciones` | disabled neutro |
| Configurador válido | `Agregar · $ 23.250,00` | enabled azul |

Footer sticky, sin solapamiento, contenido no cortado en seco, monto sin wrap. El primario enabled
es la acción dominante sólo cuando está enabled.

**P1-2 (form readiness) — PASS**, 6/6 pasos:

| Paso | Esperado | Observado |
|------|----------|-----------|
| A ticket, sin nombre/teléfono | disabled | `Completá los datos obligatorios` |
| B sólo nombre | disabled | `Completá los datos obligatorios` |
| C nombre+teléfono, Retiro | enabled | `Crear pedido · $ 3.000,00` |
| D → Delivery | dirección exigida | disabled, campo dirección aparece |
| E dirección completa | enabled | `Crear pedido · $ 3.000,00` |
| F → Retiro | dirección no bloquea | enabled, valor tipeado **preservado** (`Av. Siempreviva 742`) |

Nunca se pulsó `Crear pedido`.

## 15. Production smoke

**UNAVAILABLE.** `https://orderops.vercel.app/admin/dashboard` redirige a `/admin/login`; no existe
sesión previa. No se pidieron ni adivinaron credenciales, no se mutó producción, no se creó ningún
pedido de prueba. Deuda de cobertura aceptada.

Independientemente: el working tree local tiene 5 archivos runtime sin commitear, así que producción
**no** contiene este paquete. No se usó producción para evaluar cambios locales no desplegados.

## 16. Verify suite

15 verifies relevantes, una corrida, **sin editar ninguno**: **10 PASS / 5 FAIL**.

PASS: `customization-flow-server-payload`, `customization-flow-ui`, `customization-safety-gate`,
`modal-accessibility-interaction-polish`, `modal-configurator-context-polish`,
`modal-microcopy-consistency`, `modal-surface-materiality-polish`,
`modal-ticket-summary-hierarchy-polish`, `manual-order-customization-safety`,
`manual-order-customization-ticket`.

Los 5 FAIL son **clasificación B — assertion stale**. Cero clase A (regresión de runtime), cero
clase C (error de harness):

| Verify | Assertion stale | Por qué no es regresión |
|--------|-----------------|-------------------------|
| `modal-breakpoint-overflow-fix` | prohibición file-wide de `querySelector` | Protegía que la entrada de scroll (P1-3) no use lookups DOM. La entrada sigue usando `bodyRef`; la única ocurrencia es `container.querySelectorAll` dentro de `getManualOrderFocusableElements`, el focus trap **scopeado al diálogo** que exigió la fase de accesibilidad. P1-3 verificado en runtime arriba. |
| `modal-cta-footer-states-polish` | misma prohibición | Misma causa. |
| `modal-form-validation-ux-decision` | fija `"...Revisá el ticket."` | La fase de microcopy cambió sólo la frase a `Revisá el pedido.`; la regla de `Adicional` huérfano y su condición están intactas. |
| `modal-mobile-single-scroll` | fija `Usá el catálogo...` / `Tocá + ...` | Literales reemplazados deliberadamente en microcopy. El hint de producto bloqueado existe con texto nuevo. |
| `customization-flow-domain` | los mismos 2 literales | Misma causa. Sus otras assertions del safety gate (`isManualOrderAvailable`, `Requiere personalización`) siguen pasando. |

Limitación importante: cada archivo aborta en su primera assertion fallida, así que **el resto de
las assertions de esos 5 archivos quedó sin ejecutar** en esta corrida. La cobertura efectiva se
apoya en los 10 verifies que pasan más la QA de runtime de esta fase.

## 17. Static/build/lint

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `git diff --check` | **PASS** |
| `npm run build` | **PASS** — Next 16.2.9 Turbopack, compilado en 22.4s, TypeScript OK, 23/23 páginas estáticas |
| `npm run lint` | **FAIL — deuda de tooling conocida, idéntica**: `TypeError: Converting circular structure to JSON`, ESLint 9.39.4, ciclo del plugin React vía `@eslint/eslintrc/config-validator`. Sin diferencia material → no es hallazgo nuevo. |

## 18. Diff audit

`HEAD` sin cambios (`3e418bb`), **nada staged**, y el stat de runtime es **idéntico** al de
preflight (5 archivos, 1061 inserciones / 216 eliminaciones) → **cero cambios de runtime durante
esta fase de QA**.

| Clase | Archivos |
|-------|----------|
| A. runtime manual-order intencional | `manual-order-modal.tsx`, `manual-order-modal.module.css`, `manual-order-customization-panel.tsx`, `manual-order-customization-panel.module.css`, `admin-order-modal-shell.tsx` |
| B. verifies intencionales | 8 nuevos `admin-manual-order-modal-*.verify.ts` |
| C. docs intencionales | 9 docs de fase nuevos + `docs/CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md` + `docs/admin-dashboard-forensic-living-audit.md` |
| D. dirty pre-existente no relacionado | ninguno |
| E. ruido generado | `tsconfig.tsbuildinfo` |
| F. inesperado | **ninguno** |

## 19. Findings P0/P1/P2/P3

**P0 — 0.**

**P1 — 0.** P1-1, P1-2, P1-3 y P1-4 verificados cerrados en runtime en esta fase.

**P2 — 2, aceptados no bloqueantes:**

- **P2-QA1 · 5 assertions stale en verifies históricos.** Deuda sólo de tests: ninguna corresponde a un defecto de runtime, y las conductas que protegían están verificadas por otros medios (§16). Bloquea la señal verde del suite, no el producto. Requiere una fase de reconciliación quirúrgica; explícitamente **no** se tocó aquí (regla anti-loop).
- **P2-QA2 · pérdida de trabajo al cerrar, sin confirmación.** Un ticket completo ($49.500: 2 líneas, producto configurado con 4 grupos, cantidad root 2, datos de cliente) se descarta con Escape sin confirmación; al reabrir el formulario está reseteado (`$ 0,00`, `Agregá productos`, campos vacíos). Se agrava porque el overlay del shell es un `button` a pantalla completa y por eso es el **primer** tab stop: un Shift+Tab desde el foco inicial más Enter cierra y descarta. No hay pérdida en base de datos y es recuperable retipeando, pero es una trampa real de teclado. El brief prohíbe inventar confirmación acá.

**P3 — 2, documentados:**

- **P3-QA1 · vocabulario `Requiere personalización` vs "Configurar".** El badge dice "personalización" mientras el resto del flujo dice "Configurar". Deferido con causa: el texto real es `MANUAL_ORDER_CUSTOMIZATION_UNAVAILABLE_REASON` en `lib/orders/manual-order-customization-eligibility.ts`, fijado por su safety verify.
- **P3-QA2 · dos formatos de badge de límite visibles a la vez.** `Salsas` muestra `Opcional · máx. 5` y `Agregados extra` muestra `Opcional · máx. 5 opciones`. Semánticamente correcto (`opciones` = grupo con cantidad por opción) pero se lee inconsistente. Lo genera `formatQuantityGroupMeta` en `lib/product-customization/selection-v2.ts`, **compartido con el checkout público**.

## 20. Remaining debt

1. **P2-QA1** — reconciliar las 5 assertions stale (fase quirúrgica dedicada).
2. **P2-QA2** — confirmación al cerrar con ticket cargado, y/o sacar el overlay del tab order.
3. **P3-QA1 / P3-QA2** — unificar vocabulario y formato de límites; ambos tocan archivos compartidos.
4. **QA autenticada en producción** — no disponible sin sesión del owner.
5. Screenshots de anchos grandes limitados por el webview (~384 CSS px); evidencia ancha es numérica.

## 21. Product verdict

- **A. ¿Parece una aplicación pulida y no un formulario plano?** Sí. Tres niveles materiales medibles en ambos temas, secciones con borde y sombra propios, filas interactivas hundidas respecto de su card, segmented con activo levantado.
- **B. ¿Jerarquía clara modal → secciones → controles → selecciones → ticket → CTA?** Sí. Un `h2` y tres `h3`, group labels quietos sobre opciones legibles, total como figura más fuerte, primario azul sólo cuando está enabled.
- **C. ¿Compose y configurador son un solo sistema visual?** Sí. Group cards comparten familia con las section cards y las option rows con las inner rows; una sola familia accent para selected.
- **D. ¿El operador siempre sabe qué falta, qué eligió, qué se agrega y qué bloquea el submit?** Sí. Badges `Obligatorio`/`Opcional`, selected accent-tinted, `Agregar · $ X` con monto, y el CTA nombra el bloqueo (`Completá los datos obligatorios` / `Completá las opciones`) con la razón puntual junto a la acción.
- **E. ¿Dark conserva jerarquía?** Sí. Sin slab uniforme; contrastes de 10.8:1 a 16.9:1.
- **F. ¿La densidad mobile es apropiada tras los targets de 44px?** Sí. Filas de 76–87px a 360–412 con `min-height: 52px` preservado; nada se siente inflado.
- **G. ¿Desktop/workstation estable?** Sí, en 900 / 1023 / 1024 / 1440, con la banda intermedia intacta.
- **H. ¿Alguna deuda bloquea el envío de este paquete?** **No.** Las dos P2 son de tests y de una salvaguarda de UX pre-existente; ninguna rompe el flujo principal ni toca dominio, pricing, payload o servidor.

## 22. Hard boundaries

Runtime modificado durante esta QA: **NINGUNO** (probado por diff idéntico al preflight).
CSS: ninguno · verifies: ninguno · dominio/pricing/payload/actions/RPC/DB/migraciones: sin tocar ·
público/dashboard/workspace: sin tocar · globals/theme-tokens/Button-Input-Card: sin tocar.

Pedidos creados: **0** (los 7 códigos del dashboard son idénticos al baseline: 3EMZ8G, G96QN4,
8DBT8G, TJK9R5, 3ZYV8A, ACWXPE, 9E8Y45; ningún dato de QA persistió).
Mutaciones de estado: **0** · envíos de WhatsApp: **0** · commit/push/deploy: **NO**.

Archivos cambiados en esta fase: sólo los 4 docs autorizados.

## 23. Gate

**ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1 = PASS WITH ACCEPTED NON-BLOCKING DEBT**

Bloque visual/UX del modal manual: **CERRADO**. Todos los P1: **CLOSED**. Visual hierarchy, ticket
hierarchy, surface materiality, accessibility interaction, microcopy y single-scroll: **FROZEN**.
Validación: **FROZEN**. Pricing/dominio/payload/servidor: **UNCHANGED**.

Siguiente: **ADMIN-MANUAL-ORDER-MODAL-VERIFY-RECONCILIATION-1** (cerrar P2-QA1) y luego
**ADMIN-MANUAL-ORDER-MODAL-COMMIT-PUSH-DEPLOY-1**. La reconciliación se recomienda **antes** del
commit para que el paquete entre con el suite en verde.

No commit. No push. No deploy.
