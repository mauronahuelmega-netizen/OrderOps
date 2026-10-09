# ORDEROPS — LANDING-V1.2.1
## Mobile Density & Final Responsive Polish — Implementation Report

Fecha: 2026-10-05. Revisión local: http://localhost:3000/.

## A. RESULT

**PASS dentro del alcance LANDING-V1.2.1.** Se completaron las verificaciones visuales/responsive y funcionales pertinentes. El lint general sigue bloqueado por FlatCompat preexistente; no es un PASS del comando lint general y no se corrigió su configuración.

360/390 ganan densidad exclusivamente en Comparación, Operación y Beneficios. Journey y CTA final se inspeccionaron sin cambios. Las páginas completas de 768/1024/1440 son idénticas a sus capturas before, con **cero píxeles diferentes** al comparar imágenes decodificadas.

No se modificó TSX, contenido, assets, tipografías, colores, arquitectura, estado de la demo ni configuración comercial. Los diez bloques y su secuencia permanecen.

## B. DIAGNOSIS

| Target | Causa encontrada | Cambio realizado / decisión |
| --- | --- | --- |
| Comparación | Padding de sección de 58 px por extremo; gap de 40 entre copy/demo; márgenes de 20 en párrafos; varios gaps acumulados entre caption, chat, transición y pedido. | Solo mobile: padding 46; gap copy/demo 28; márgenes de párrafos 14; gap de comparación 8; chat 14 px verticales; transición 4; structured gap 10. Los seis mensajes, todo el copy y la card permanecen. No se reduce tipografía ni padding de burbujas. |
| Operación | Padding de sección/panel; overview y resumen con márgenes heredados; spacing acumulado de secundarios, instrucciones y remate. La descripción reservaba 62 px aun cuando el texto ocupaba dos líneas. | Solo mobile: sección 48/36; panel 14 y margin-top 22; overview/resumen 16; secundarios con padding 10 y gap 4; interacción con margin/padding 16; descripción min-height 42 y margin 12. Disclosure margin 18 y target mínimo 48. Remate margin 24/padding 18/gap 12. Se conserva íntegra la card principal y el número de secundarios existente. |
| Journey | La espina y las flechas ya son absolutas y no agregan altura al flujo. Separan correctamente los tres pasos y la referencia. | **Inspected — no change required.** Acortarlas sería una mejora marginal y arriesgaría continuidad; numeración, iconos, conectores, copy y spacing intactos. |
| Beneficios | Gaps de 28 entre áreas, padding de 26 sobre separadores y varias separaciones de 16–35 alrededor de demostraciones/categorías. | Solo mobile: sección 48; gap de áreas 22, margin inicial 28, separadores 20; cuerpo 12; visuales 16/16/18; estados gap 20/padding 6; categorías margin 28/padding 20/gap 20. Siluetas, pills, referencia, estados, rubros y encaje conservados. |
| CTA final | Ambos botones ya presentan labels de una línea y una caja de 290×53 px a 360/390, con iconos alineados. | **Inspected — no change required.** No hay wrapping/clipping demostrado. Copy, botones, cierre/footer y spacing intactos. |
| Micro-polish de referencia inferior | El remate usa 22 px también en mobile, con peso próximo al encabezado de la card. | Se ajusta únicamente esa referencia a 20 px en mobile. Sigue claramente visible. Desktop/tablet conservan 22 px. |

No se ocultan pedidos adicionales, no se elimina ningún estado ni dato, no se introduce scroll horizontal ni se usa overflow hidden como parche. El pedido registrado continúa originándose en el catálogo; WhatsApp es comunicación posterior posible.

## C. FILES CHANGED

Archivos de producción modificados, respecto del baseline de esta ejecución:

1. components/marketing/marketing-landing.module.css: valores y reglas locales dentro de la media query existente max-width: 767px para Comparación, wrapper/remate/disclosure de Operación y Beneficios. No se cambiaron primitives comunes ni reglas fuera de mobile.
2. components/marketing/order-flow-demo.module.css: spacing del panel focalizado, estados, contexto e instrucciones dentro de su media query existente max-width: 767px. No se cambió ningún selector de ocultación, tipografía de la card, lógica ni estilo tablet/desktop.

Documento nuevo: docs/landing-v1.2.1-implementation-report.md (este informe).

Evidencia y scripts de QA locales: tmp/landing-v1.2.1/. No son dependencias ni infraestructura de tests de producción. Se reutilizaron navegador y sharp instalados; no se añadió ningún paquete.

Intactos: hero, ProductPreview, ProductStory, ContactPreview, MarketingOrderCard, Journey TSX/CSS, OrderDetailPreview TSX/CSS, marketing-content/config/action, navegación, page/layout/sitemap, tokens, todos los archivos operacionales y los informes anteriores.

## D. RESPONSIVE EVIDENCE

| Viewport nominal | Layout | Overflow | Wrapping/targets | Targets de fase | Secciones congeladas |
| --- | --- | --- | --- | --- | --- |
| 360 | PASS, landing completa | 345 <= 345 | PASS; CTA final 290×53, acción 46, disclosure 48 | Comparación -70 px; Operación -152; Beneficios -95 aprox. Journey intacto | Geometría interna idéntica a before en Hero, Journey, Catálogo, Comunicación, Pricing, FAQ y cierre. |
| 390 | PASS, landing completa | 375 <= 375 | PASS; CTA final 290×53, acción 46, disclosure 48 | Comparación -70 px; Operación -158; Beneficios -95 aprox. Journey intacto | Mismas siete secciones con geometría interna idéntica. |
| 768 | PASS, landing completa | 753 <= 753 | PASS, sin diferencias | Sin compactación filtrada | Geometría de todas las secciones y página completa idénticas; 0 píxeles diferentes. |
| 1024 | PASS, landing completa | 1009 <= 1009 | PASS, sin diferencias | Journey/comparación horizontales; cuatro columnas operacionales intactas | Página completa idéntica; 0 píxeles diferentes. |
| 1440 | PASS, landing completa | 1425 <= 1425 | PASS, sin diferencias | Shell, escala y composición intactos | Página completa idéntica; 0 píxeles diferentes. |

Viewport de captura fijo: width solicitado y height 1000, sin cambios de zoom. IAB ocupa 15 px con la barra vertical; por eso el ancho capturado/clientWidth es menor que el viewport nominal. Las reducciones son mediciones DOM comparadas bajo las mismas condiciones, no objetivos porcentuales impuestos.

Todas las secciones mantienen el mismo textContent. En mobile las secciones siguientes se desplazan hacia arriba como consecuencia de la reducción anterior; su composición interna permanece idéntica. Footer y geometría de CTAs permanecen intactos.

Regresión registrada en regression.json: se compararon dimensiones, coordenadas relativas a cada sección, font-size/line-height, padding, margin, gap y display de sus elementos visibles. Una comprobación separada con PostCSS confirma equivalencia byte a byte del CSS fuera de la media query de 767 px, incluyendo reduced motion.

### Interacción y lectura

- Pendiente → Preparando → Listo → Completado → reinicio probado por Enter en 360/390.
- Conteos 1/2/1/0 → 0/3/1/0 → 0/2/2/0 → 0/2/1/1, siempre cuatro pedidos.
- Se mantienen uno y dos secundarios visibles a 360 y 390 respectivamente, exactamente como V1.2. No se modifica el fixture ni su filtrado responsive.
- aria-live conserva las cuatro explicaciones. Todas caben en su altura automática/reserva mínima de 42 px; no hay clipping.
- Detalle probado por teclado en ambos tamaños: cliente, productos, opciones, notas, modalidad, precios y total disponibles; sin overflow al expandirlo.
- Escape cierra el menú y devuelve foco a summary; foco de 3 px visible; skip link enfoca contenido; FAQ nativa abre/cierra por teclado.
- Consola inspeccionada: sin errores/warnings capturados.

## E. BEFORE / AFTER

Todas las capturas before se conservaron antes de editar. No fue necesario reconstruir la baseline ni descartar/revertir archivos para generarlas. Son capturas completas del mismo viewport/zoom; los recortes de las tres secciones usan los límites de sus superficies y conservan escala 1:1. Las franjas comparativas añaden únicamente títulos de QA fuera de la captura.

| Evidencia | Archivos en tmp/landing-v1.2.1/ |
| --- | --- |
| Comparación 360 | before-360-problem-title.png / after-360-problem-title.png / compare-360-problem-title.png |
| Operación 360 | before-360-operation-title.png / after-360-operation-title.png / compare-360-operation-title.png |
| Beneficios 360 | before-360-benefits-title.png / after-360-benefits-title.png / compare-360-benefits-title.png |
| Landing completa 390 | before-390.png / after-390.png |
| Regresión completa 768 | before-768.png / after-768.png; 753×7463, cero píxeles distintos |
| Regresión completa 1024 | before-1024.png / after-1024.png; 1009×7395, cero píxeles distintos |
| Regresión completa 1440 | before-1440.png / after-1440.png; 1425×7231, cero píxeles distintos |

También hay before/after completos a 360 y recortes de targets a 390. Datos: before-layout.json, after-layout.json, regression.json, interaction.json y a11y.json.

Limitaciones reales: navegador integrado único, no dispositivos físicos/múltiples motores. Las capturas son full-page con scrollbar desktop de IAB, no una simulación del chrome de un teléfono. Esto no impidió verificar ningún criterio de aceptación propio de V1.2.1. No se reabrió QA operacional ni preferencias de zoom/OS fuera de esta fase.

## F. AUTOMATED CHECKS

| Comando / comprobación | Resultado |
| --- | --- |
| npm run lint | Bloqueo preexistente, exit 2: ESLint 9.39.4, TypeError: Converting circular structure to JSON; configs.flat.plugins.react closes the circle, @eslint/eslintrc/lib/shared/config-validator.js:308:45. Evidencia: lint-general.txt. |
| ESLint API por stdin: overrideConfigFile true + presets instalados core-web-vitals/typescript; components/marketing, app/page y sitemap | PASS: 17 archivos, 0 errores y 0 warnings. No se modificó eslint.config.mjs ni configuración/dependencias. |
| npx --no-install tsc --noEmit --incremental false | PASS, exit 0. |
| node scripts/landing-v1/verify.cjs | PASS: los siete verifies existentes de configuración, referencia, WhatsApp, upsell/cart y preparación de opciones. contracts.txt. |
| node scripts/landing-v1/verify.cjs components/marketing/marketing-presentation.verify.ts | PASS: totales, referencias y cuatro conteos contextuales. |
| npm run build | PASS, exit 0; compilación y TypeScript correctos; 24 páginas estáticas; raíz prerenderizada. Solo conserva el warning preexistente de convención middleware deprecada frente a proxy. |
| PostCSS: equivalencia fuera de max-width 767px | PASS; no diferencias de reglas base/tablet/desktop/reduced motion. |
| node tmp/landing-v1.2.1/regression.cjs | PASS: contenido y secciones congeladas iguales; cero diferencias de pixels en tres páginas completas. |
| git diff --check | PASS, exit 0. |
| git diff --no-index --check before after | Sin errores de whitespace; solo avisos preexistentes de conversión LF/CRLF del entorno Git. |

No hay failures nuevos atribuibles a V1.2.1. FlatCompat y la deprecación de middleware se documentan sin reparación fuera de alcance. El build utiliza las fuentes existentes; no se agregan servicios ni dependencias.

## G. DIFF AUDIT

Baseline registrado antes de editar: 1407 archivos anteriores no ignorados, contenido de marketing, HEAD, hash SHA-256 del índice y git status --short. Marketing coincidía byte a byte con la V1.2 entregada, sin solapamientos desconocidos.

Diff de implementación contra ese baseline:

~~~text
 .../{before => after}/marketing-landing.module.css | 67 +++++++++++++++-------
 .../{before => after}/order-flow-demo.module.css   | 12 ++--
 2 files changed, 52 insertions(+), 27 deletions(-)
~~~

Name-only de implementación: exclusivamente components/marketing/marketing-landing.module.css y components/marketing/order-flow-demo.module.css. Se agrega este informe aparte.

El repositorio ya tenía numerosas modificaciones y marketing sin tracking al inicio. Por eso git diff contra HEAD incluye trabajo anterior y no muestra los cambios internos de la carpeta marketing untracked. No se hizo staging para alterar esa condición.

Salidas exactas guardadas:

- git diff --check: git-diff-check.txt (exit 0).
- git diff --stat: git-diff-stat.txt (54 archivos, 9802 inserciones, 1574 eliminaciones preexistentes; no atribuibles a esta fase).
- git diff --name-only: git-diff-names.txt (estado global anterior).
- git status --short: status-before.txt y status-after.txt (incluyen modificaciones anteriores y los artefactos/documentación nuevos).
- Diff específico: scope.diff, scope-stat.txt, scope-names.txt y scope-check.txt.
- Protección: baseline.json y preservation.json.

Solo los dos CSS Modules autorizados difieren respecto de los archivos anteriores; ninguno fue removido. Todos los demás archivos y documentos previos conservan sus bytes. HEAD e índice mantienen sus hashes originales.

Confirmación explícita: no se tocó backend, DB, Supabase, auth, routing, SEO/metadata, analytics/tracking, deploy, dependencias, lockfile ni configuración operacional. No hubo staging, commit, push, deploy ni operaciones hosted.

## H. REMAINING ISSUES

**None within LANDING-V1.2.1 scope.**

Fuera de esta fase persisten el lint general bloqueado por FlatCompat, el warning de middleware y la ausencia de contacto/dominio comerciales antes de publicación. No bloquean la revisión local y no se cambian aquí. No se abre una nueva ronda estética.

La landing local queda disponible. No se inició ni alteró infraestructura hosted, ni se detuvo el servidor de desarrollo preexistente.
