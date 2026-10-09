# LANDING-V1.2 — implementation report

Fecha: 2026-10-05. Implementación local y pasada visual posterior completadas. Revisión: http://localhost:3000/.
Las limitaciones verificables de QA están detalladas abajo; no se afirma una mejora de conversión medida.

## Implementation summary

V1.2 refina composición, jerarquía, escala y superficies sobre V1.1. Conserva exactamente las diez secciones y su orden, la identidad azul/oscura/blanca, ambos tipos de letra, todos los argumentos comerciales y el recorrido catálogo → pedido registrado → operación → comunicación.

Journey es un flujo abierto; la comparación da más anchura y contraste al ticket; ProductStory conserva la tarjeta gastronómica pero abre la personalización; Operación agrupa las etapas y los pedidos dentro de una única superficie; Comunicación concentra el peso en el mensaje preparado; Beneficios pasa de tres feature cards a tres siluetas editoriales; 0% funciona como statement; FAQ ocupa menos espacio y el cierre recupera escala.

No hay nuevos argumentos, secciones, CTAs, assets, dependencias ni funcionalidades. No se modificaron fixtures, precios ilustrativos, configuración comercial, metadata, sitemap, infraestructura ni producto operacional.

## Archivos modificados y creados

Modificados respecto del baseline de esta ejecución, todos en `components/marketing/`:

- `marketing-landing.tsx`: orden DOM de Comunicación, eliminación del párrafo redundante de estados en Beneficios y espacio explícito en el cierre al ocultarse el `<br>`.
- `marketing-landing.module.css`: roles tipográficos, superficies, comparación, beneficios, 0%, FAQ, cierre y CTA del header.
- `marketing-journey.module.css`: espina continua, conectores y jerarquía de referencia.
- `product-story.module.css`: tarjeta de producto autónoma, configurador abierto y disclosures con separadores.
- `product-preview.module.css`: espacio del FAB, proporción de imagen y altura de escena; retiro de estilos antiguos del ticket reemplazado en V1.1 por MarketingOrderCard.
- `order-flow-demo.tsx`: los tres fixtures secundarios en la escena focalizada, sin el rótulo explicativo anterior ni el selector de un único pedido contextual.
- `order-flow-demo.module.css`: superficie única, contexto por breakpoint y acción operacional neutral.
- `contact-preview.tsx`: Copiar resumen dentro del grupo de utilidades.
- `contact-preview.module.css`: escena abierta, mensaje protagonista y utilidades secundarias.

Creado: `docs/landing-v1.2-implementation-report.md`.

`marketing-journey.tsx` no necesitó cambios: sus nodos existentes permitieron construir el recorrido con CSS. Tampoco se tocaron ProductStory/ProductPreview TSX, MarketingOrderCard, OrderDetailPreview, contenido, configuración/acciones comerciales, header/mobile-navigation TSX, assets, page/layout/sitemap, tokens globales, middleware, ESLint, package.json ni lockfile. Los informes V1/V1.1 se conservaron.

Baseline, imágenes, resultados y diff contra V1.1 están en `tmp/landing-v1.2/`; son artefactos locales de QA, no código de producción.

## Decisiones finalmente aplicadas

| Área | Decisión y resultado |
| --- | --- |
| Hero | Headline, eyebrow, cuerpo y reaseguro intactos. Espacio real entre + y FAB; foto completa; altura de escena suficiente para que el teléfono no tape su caption. La notificación se eleva en mobile para dejar visibles ambos controles ilustrativos. No se crea una nueva composición. |
| Journey | Línea horizontal continua a partir de 768; espina lateral con puntos/flechas en mobile. Icono y número juntos. Primer y tercer fragmento sin caja. La referencia central adquiere escala, acento lateral y un fondo parcial, diferenciando la transformación. |
| WhatsApp | Seis mensajes intactos. Chat sin borde exterior, sombra ni rotación; proporción .85 frente a 1.15 del ticket. Ticket blanco, etiqueta azul y referencia mantienen mayor peso. Se conserva la aclaración de origen en catálogo; no hay interpretación automática de mensajes. |
| Catálogo | Se elimina el marco de toda la escena, no la tarjeta real del producto. Configuración abierta, líneas entre grupos y complementario crema sin otro borde. Summaries de al menos 48 px; filas de opciones legibles. Papas continúa abierto inicialmente. |
| Operación | Marco único en flow; columnas internas abiertas con línea de estado. Resumen duplicado oculto en desktop, donde títulos y conteos de columnas transmiten las cuatro etapas. Tablet coloca protagonista y tres secundarios al lado. Mobile conserva resumen 2×2, protagonista y contexto debajo. |
| Acción operacional | Fondo oscuro, borde neutral y target de 46 px. Mantiene exactamente Preparar → Marcar listo → Completar → Volver a empezar. Se distingue de Solicitar demo azul. |
| Comunicación | Texto primero en DOM y a la izquierda en desktop. Escena sin gran caja ni rotación. Mensaje verde con mayor cuerpo; apertura manual en WhatsApp inmediatamente debajo; Copiar resumen/telefono/Llamar comparten banda secundaria. Siguen siendo ilustraciones no funcionales. |
| Beneficios | Sin tres marcos equivalentes. Elecciones en chips escalonados; referencia grande con barra azul y campos 2×2; estados con puntos de color y distribución propia. Separadores y alineación diferenciada mantienen tres siluetas reconocibles. Se conserva rubros y mensaje de encaje. |
| 0% | Sin divisoria de pricing. Numeral dominante, porcentaje menor y alineación derecha. Suscripción y condiciones en demo intactas; no se agregan importes ni planes. |
| FAQ | Padding de sección de 56 px en desktop y 40 en mobile, gaps internos menores y summaries de 16 px de padding vertical. Siete preguntas, orden y respuestas sin cambios. |
| Cierre/header | Cierre con mayor escala relativa, 18 px hacia invitación y 24 hacia CTAs. Header mobile de 64 px más borde, CTA compacto de 44 px y aproximadamente 112 px de ancho, con relleno. No se introduce variante outline ni bottom bar. |

### Jerarquía de superficies

Se conservan contenedores cuando representan interfaces: teléfono, dashboard del hero, ticket OrderOps, tarjeta gastronómica y superficie única de operación. Se conservan burbujas, selección azul, mensaje preparado y chips como unidades significativas.

Se retiran marcos equivalentes de los fragmentos Journey, envoltorio de ProductStory, grupos de opciones, tablero dentro del tablero, escena de Comunicación y artículos de Beneficios. Las líneas siguen articulando lectura y la solución conserva profundidad donde corresponde.

Los bloques sustituidos de CSS se consolidaron por selector/breakpoint. Se retiraron selectores de ticket/catalogBar sin referencias en ProductPreview y reglas antiguas de tamaño de foto que chocaban con el aspecto definido en V1.1. La expansión del CSS antes minificado explica gran parte del aumento de líneas del diff.

## Comportamiento por breakpoint

| Viewport | Composición |
| --- | --- |
| 360 | Journey vertical con espina continua; chat 84% y ticket completo; producto/configuración apilados; operación 2×2 y un secundario; comunicación texto → mensaje; beneficios en secuencia abierta; CTA header 44 px; cierre/FAQ sin colisiones. |
| 390 | Mismo recorrido mobile; dos secundarios caben con jerarquía limpia. No se contrata una combinación Sam+Cris: se utiliza el orden del fixture, manteniendo los cuatro pedidos en conteos. |
| 768 | Journey en tres columnas. Catálogo en dos áreas legibles. Operación con cuatro indicadores y escena focalizada: protagonista a la izquierda y los tres secundarios a la derecha. Comunicación mantiene dos áreas; estados de Beneficios en lista vertical. |
| 1024 | Operación en cuatro columnas y sus tres secundarios distribuidos por etapa. WhatsApp adopta texto arriba y comparación amplia debajo para evitar un chat angosto/alto. Catálogo y Comunicación mantienen composición desktop. |
| 1440 | Shell de 1240 px; relaciones completas entre demos. WhatsApp vuelve a texto y comparación lado a lado. Beneficios tiene tres áreas diferentes; 0% y cierre alcanzan el nivel de statement comercial. |

Las mediciones de scrollWidth/clientWidth fueron respectivamente 345/345, 375/375, 753/753, 1009/1009 y 1425/1425: el viewport solicitado incluye la barra vertical de 15 px del navegador integrado. Ningún caso tuvo scroll horizontal.

Escalas finales de referencia, sin convertirlas en contratos: Hero 45/42/57/70.56; cierre 40/40/52/64; Beneficios 40/40/48/60; 0% headline 38/40/46/56; demostraciones 34/36/40/48; explicación 30/32/34/36. Valores agrupados como mobile/tablet/entrada desktop/desktop amplio. No se redujo el texto para resolver la colisión de 1024: se cambió layout.

## Pasada visual severa posterior

Se capturaron páginas completas y se inspeccionaron secciones por separado en los cinco tamaños. Evidencia final: `final-360.png` hasta `final-1440.png`, sus recortes por sección y `hero-reviewed-*` en tmp/landing-v1.2.

- Journey se lee como recorrido por línea, nodos y referencia central; no como tres cajas sin fondo.
- El pedido tiene mayor ancho, blanco/azul y referencia definida frente al chat más retraído; los seis mensajes siguen legibles.
- ProductStory gana aire y conserva reconocimiento de producto, opciones, selección, nota, complementario y total.
- Operación muestra contexto sin miniaturizar cuatro columnas en mobile/tablet. Sus secundarios tienen menos peso que #J3E54J.
- La acción operacional mantiene foco/accionabilidad y ya no utiliza el botón comercial azul.
- Comunicación concentra la escena en el mensaje y su apertura manual; las tres utilidades son secundarias.
- Beneficios distingue elecciones, referencia y estados antes de leer su cuerpo; no reintroduce tres cajas equivalentes.
- 0% domina como numeral editorial; FAQ mantiene aire entre preguntas; el cierre recupera contraste y escala.

Ajustes derivados de esta pasada: layout de comparación a 1024; espacio entre llegar/así al ocultar br; retiro del límite antiguo de foto del hero; aumento del espacio de su escena y desplazamiento de notificación mobile para liberar +/FAB. La altura del hero aumenta donde fue necesario; no se optimizó por menos scroll.

## Movimiento, arquitectura y accesibilidad

Se conserva CSS/nativo: entrada inicial del hero, desplazamiento breve de 4 px/180 ms al avanzar manualmente el pedido e iconos de disclosures. Se eliminan las rotaciones estáticas de chat y Comunicación. No hay animación de mensajes hacia ticket, animaciones de scroll, loops, autoplay, observers nuevos ni librerías.

`app/page.tsx` sigue siendo Server Component. Exactamente dos archivos de marketing contienen use client: mobile-navigation y order-flow-demo. No hay nuevo estado, effects ni timers. La progresión sigue utilizando la actualización funcional existente; sus cuatro pedidos son fixtures aislados. Se revisó la lista de React Best Practices: límites cliente, claves estables, estado funcional y ausencia de I/O operacional preservados.

Se mantienen es-AR, landmarks, headings, skip link, orden DOM lógico, foco de 3 px, aria-live, FAQ/disclosures nativos y contenido SSR. La demo inicial describe completamente el recorrido; el botón de prueba sigue deshabilitado antes de hidratarse.

## Checks y resultados

| Verificación | Resultado |
| --- | --- |
| TypeScript: npx --no-install tsc --noEmit --incremental false | PASS; también pasa la comprobación TypeScript del build final. |
| npm run build | PASS final; 24 páginas estáticas generadas. / conserva prerender estático. Se utilizó permiso de red únicamente para fuentes existentes del build. |
| Lint acotado mediante API ESLint y presets flat instalados, sin modificar configuración | PASS: 17 archivos, 0 errores, 0 warnings. |
| npm run lint | BLOCKED preexistente; detalle exacto abajo. |
| node scripts/landing-v1/verify.cjs | PASS: configuración, referencia, WhatsApp público/contextual/estructurado, upsell/cart y preparación de opciones. Siete verifies existentes. |
| node scripts/landing-v1/verify.cjs components/marketing/marketing-presentation.verify.ts | PASS: totales, referencias únicas y conteos contextuales de las cuatro etapas. Runner intacto. |
| SSR real de MarketingAction con contacto ausente/inválido/válido | PASS: button disabled sin href/fallback, links seguros cuando corresponde y mensajes distintos. Número sintético solo en proceso de QA, sin navegación externa ni cambio de env. |
| Sitemap condicional / metadata | PASS: sitemap vacío sin dominio; un root comercial en caso sintético configurado. HTML actual es-AR, sin canonical absoluto ni og:url inventados. |
| Cinco viewports / diez secciones / overflow | PASS. Capturas finales y mediciones guardadas. |
| Veinte estados de demo por teclado | PASS: cuatro estados y reinicio en los cinco tamaños. Conteos 1/2/1/0 → 0/3/1/0 → 0/2/2/0 → 0/2/1/1; siempre total 4. aria-live describe cada estado. |
| Menú / Escape / skip link / anchors | PASS con JS: Enter abre menú; Escape cierra y devuelve foco a summary. Skip link enfoca contenido. Los cuatro anchors quedan alrededor de top 100, debajo del header de 65; menú cierra tras navegar. |
| FAQ / catálogo / detalle | PASS: siete FAQ y tres disclosures de catálogo por teclado; detalle abierto; opciones/precios/referencia intactos. Targets observados >=44 px. |
| Foco y contraste | Foco visible verificado en acción operacional; auditoría DOM de texto/color sobre fondos opacos: 295 muestras mobile y 326 desktop, cero incumplimientos detectados. No reemplaza una auditoría WCAG completa. |
| Consola / assets | Sin errores ni warnings capturados en snapshot de producción. Los cuatro img cargan al abrir disclosures, incluidos burger.svg y lemonade.svg. |
| Progressive enhancement | PASS parcial: HTML de producción servido sin scripts conserva las diez secciones, estado inicial, botón disabled y menú/FAQ/disclosures nativos. No es un cambio de la preferencia global de JavaScript del navegador. |
| Reduced motion | PASS de reglas: servidor QA activa las media queries existentes y computed animationName resulta none. No se pudo cambiar la preferencia OS del navegador integrado. |
| Zoom 200% | Limitación real: el atajo de zoom no altera el viewport en IAB; no se certifica zoom real al 200%. Reflow a 720 px verificado sin overflow, como comprobación complementaria. |
| Regresión operacional | Login local 200; dashboard sin sesión 307 a /admin/login. Rutas catálogo/checkout/success/dashboard compilan y sus contratos relevantes pasan. No se usaron tenants, clientes ni datos privados ni se ejecutó un checkout autenticado real. |
| git diff --check | PASS con configuración actual del repositorio. Diff específico V1.2 --no-index --check sin diagnósticos de whitespace. |
| Protección de estado | PASS: baseline de 1406 archivos no ignorados; ningún archivo anterior ausente y solo los nueve archivos autorizados difieren. HEAD e índice mantienen sus hashes. |

## Problemas preexistentes y límites reales

El lint general termina con ESLint 9.39.4:

```text
TypeError: Converting circular structure to JSON
--> starting at object with constructor 'Object'
property 'configs' -> object with constructor 'Object'
property 'flat' -> object with constructor 'Object'
...
property 'plugins' -> object with constructor 'Object'
--- property 'react' closes the circle
at @eslint/eslintrc/lib/shared/config-validator.js:308:45
```

Es el bloqueo de FlatCompat previamente identificado. eslint.config.mjs y dependencias permanecen intactos. El build también conserva el warning preexistente de convención middleware deprecada frente a proxy. No se corrigen en esta fase.

El navegador integrado permite viewport/teclado/capturas y lectura de consola, pero no certificación de zoom 200% ni control de preferencias OS. Las comprobaciones sin scripts/reduced motion son escenarios locales controlados y se reportan como tales. No se ejecutó QA en múltiples motores, lector de pantalla ni dispositivos físicos.

No hay tenant de prueba aislado/autenticado para E2E operacional en este alcance. Se preservó el código por hash, se compiló y se ejecutaron contratos, sin operar infraestructura hosted ni generar pedidos. Queda disponible para una futura prueba en un entorno expresamente autorizado.

## Contacto comercial y dominio

En la configuración efectiva local ambos siguen ausentes. Solicitar demo y Hablar por WhatsApp continúan deshabilitados y no navegables; la explicación breve permanece en hero/cierre y no se generan URLs ficticias. Ver cómo funciona es anchor; login permanece /admin/login.

No hay canonical/og:url absoluto dependiente de un origen no confirmado, ni entrada de sitemap inventada. Contacto comercial y dominio siguen siendo blockers de publicación productiva, no de implementación/revisión local.

## Diferencias justificadas respecto del plan

- El secundario mobile se resuelve con el orden existente del fixture: uno a 360 y dos a 390, no una combinación obligatoria de clientes. Tablet muestra los tres; conteos siempre representan cuatro pedidos.
- El CTA mobile mantiene relleno. Reducción de padding/gap/peso bastó para equilibrar logo, CTA y menú con target de 44 px; no fue necesario outline.
- A 1024, la comparación se dispone debajo del texto para evitar UI estrecha; no se reduce su tipografía. A 1440 vuelve al layout lateral.
- La escena del hero utiliza mayor altura que V1.1 para resolver solapamientos reales. El numeral 0% usa 160/190/220/280 px y la jerarquía tipográfica se ajusta por rol, sin tratarlos como valores contractuales.
- Journey no requiere modificar su TSX. Se elimina solo el párrafo que repetía literalmente los cuatro estados en Beneficios, sin reescribir el copy aprobado.
- No se crean verifies nuevos: el verify de presentación existente cubre datos y conteos; la composición se valida visualmente.

No hay desviaciones de producto, identidad, alcance comercial ni arquitectura. QA de zoom/OS y E2E operacional tiene los límites indicados.

## Diff específico V1.2 y preservación

Como marketing ya era contenido local sin seguimiento al inicio, git diff contra HEAD no separa V1/V1.1/V1.2. Se utiliza el snapshot byte a byte de esta ejecución y git diff --no-index para el alcance de código:

```text
 {before => after}/contact-preview.module.css   |   40 +-
 {before => after}/contact-preview.tsx          |    2 +-
 {before => after}/marketing-journey.module.css |   57 +-
 {before => after}/marketing-landing.module.css | 1723 +++++++++++++++++++++---
 {before => after}/marketing-landing.tsx        |    6 +-
 {before => after}/order-flow-demo.module.css   |  104 +-
 {before => after}/order-flow-demo.tsx          |    3 +-
 {before => after}/product-preview.module.css   |  897 ++++++++++--
 {before => after}/product-story.module.css     |  404 +++++-
 9 files changed, 2823 insertions(+), 413 deletions(-)
```

Se agrega este informe como décimo archivo de entrega. El volumen de líneas incluye formateo y consolidación de CSS antes minificado, no nuevas secciones. Patch: tmp/landing-v1.2/scope.diff. Stat: tmp/landing-v1.2/scope-stat.txt. Baseline y preservación: baseline.json/preservation.json en la misma carpeta.

El git diff --stat general mantiene las modificaciones anteriores respecto de HEAD: 54 archivos, 9802 inserciones y 1574 eliminaciones. Se guardó completo en tmp/landing-v1.2/git-diff-stat.txt; no es el diff de V1.2 y no atribuye a esta fase cambios de producto/dependencias.

HEAD preservado: 5f5e78dace3ca1e24327eb29614e367746da557f. Índice preservado por SHA-256. Ningún cambio preexistente fuera de estos nueve archivos fue alterado, revertido ni removido.

## Estado de entrega

Implementación local lista para revisión visual, con pasada posterior en 360/390/768/1024/1440 realizada. No se realizaron staging, commit, push, deploy ni operaciones hosted. El servidor de QA temporal se detiene al terminar; el servidor local de desarrollo preexistente se conserva.

Pendientes externos a esta entrega: contacto/dominio antes de publicar; certificación de zoom 200% y preferencias nativas en navegador compatible; E2E operacional únicamente con un entorno de pruebas autorizado. No se amplía el alcance para reparar FlatCompat ni middleware.
