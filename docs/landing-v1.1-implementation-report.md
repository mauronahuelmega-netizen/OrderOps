# LANDING-V1.1 — implementation report

Fecha: 2026-10-05. Implementación local completada, con las limitaciones de QA indicadas abajo.
Revisión: http://localhost:3000/.

## Implementation summary

Se refinaron las diez secciones existentes sin eliminarlas, fusionarlas ni reordenarlas. Se conservaron identidad, headline, hero oscuro, azul OrderOps, composición catálogo/operación, suscripción y 0%, FAQ y límites técnicos.

Los cuatro ajustes finales fueron aplicados: eyebrow original intacto; nuevo cuerpo y reaseguro del hero; confirmación posterior por WhatsApp siempre posible, no obligatoria; operación comprensible desde el estado inicial; verify integrado al runner existente sin modificarlo.

Marketing sigue aislado de Supabase, cookies, carrito, Realtime, clientes y tenants. No se incorporaron dependencias, analytics, backend comercial ni capacidades futuras. Todos los datos y assets de las escenas siguen siendo ficticios/originales.

## Archivos modificados y creados

Todos los componentes siguientes están en components/marketing/.

Modificados (13 archivos existentes respecto del baseline de esta sesión):

- marketing-landing.tsx y marketing-landing.module.css.
- marketing-content.ts.
- product-preview.tsx y product-preview.module.css.
- product-story.tsx y product-story.module.css.
- order-flow-demo.tsx y order-flow-demo.module.css.
- order-detail-preview.tsx y order-detail-preview.module.css.
- contact-preview.tsx y contact-preview.module.css.

Creados (6 archivos de implementación/documentación):

- marketing-journey.tsx y marketing-journey.module.css.
- marketing-order-card.tsx y marketing-order-card.module.css.
- marketing-presentation.verify.ts.
- docs/landing-v1.1-implementation-report.md.

Artefactos de QA y baseline están en tmp/landing-v1.1/. No son código de producción.

Permanecen intactos: app/page.tsx, app/layout.tsx, sitemap, tokens globales, metadata, configuración/acciones comerciales, header y navegación, assets de marketing, código operacional, middleware, ESLint, package.json y package-lock.json. El informe de V1 también se conservó.

## Decisiones finalmente aplicadas

- Hero: conserva “MENOS IDA Y VUELTA. MÁS PEDIDOS.” y el headline. Cuerpo: “Tu cliente completa el pedido en tu catálogo. Vos lo recibís claro, con productos, opciones y datos reunidos.” Reaseguro: “Por suscripción. 0% de comisión por pedido.”
- Recorrido: tres fragmentos pequeños muestran elecciones del catálogo, pedido registrado #J3E54J y columna de pendientes. El paso 2 dice: “El pedido queda registrado con una referencia. Después, el cliente puede confirmarlo por WhatsApp.”
- Comparación: se conservan los seis mensajes. Los rótulos “El mismo pedido. Dos formas de recibirlo.” y “El cliente completa el catálogo” evitan atribuir interpretación automática del chat. El ticket muestra también mayonesa y la nota.
- Catálogo: card delimitada, precio y + circular; FAB ilustrativo con contador dentro del dispositivo. La personalización conserva selecciones fijas/disclosures nativos; la nota y la sugerencia de limonada se distinguen de las opciones.
- Operación: pedidos secundarios del hero centralizados y usados como contexto. Conteos derivados solo de fixtures. Un único estado local y una acción: Preparar → Marcar listo → Completar → Volver a empezar. Las cuatro etapas, referencia, datos, contexto e instrucción son visibles inicialmente.
- Detalle: personalizaciones bajo BBQ Bacon, subtotal $15.450, limonada adicional $2.500, total $17.950 e indicación independiente “Sin cebolla”. Teléfono enmascarado.
- Comunicación: saludo y mensaje siguen la plantilla real inspeccionada; Copiar resumen separado de utilidades; Maps retirado de la escena de retiro. Las acciones representadas no envían, copian ni navegan.
- Beneficios: tres paneles editoriales con elecciones, referencia/campos y estados. Se conservan cuatro rubros, sin comercializar Programado.
- Suscripción: concepto intacto; se retira una reiteración del porcentaje. FAQ conserva siete preguntas con respuestas breves, permisos/configuración precisos y WhatsApp posterior opcional.
- Cierre: “Tus pedidos pueden llegar así de claros.” y “Mirá cómo funcionaría OrderOps en tu negocio.” Ambos CTAs permanecen.

## Arquitectura y movimiento

Dos islas cliente: mobile-navigation y order-flow-demo. Journey, escenas, copy y FAQ siguen renderizados en servidor; tarjeta compartida es presentación pura, utilizable dentro de la isla cliente sin imports operacionales.

Se conserva entrada CSS del hero y disclosures nativos. Se retira el hover decorativo de la hamburguesa. La tarjeta entra en 180 ms y 4 px tras una acción manual. No hay timers, observers, loops, nuevas suscripciones ni librerías. El estado inicial servidor es determinista; la acción permanece deshabilitada antes de hidratar o sin JS.

## Desktop, tablet y mobile

- 1440: composición editorial completa; recorrido en tres columnas; comparación paralela; catálogo en dos áreas; operación en cuatro columnas con pedidos secundarios; síntesis en tres paneles.
- 1024: mantiene cuatro columnas operacionales con menor padding; texto y tarjetas envuelven sin overflow.
- 768: operación focalizada en una columna activa, con resumen de las cuatro etapas y otro pedido contextual. No se miniaturizan cuatro columnas. Recorrido y beneficios permanecen en tres áreas.
- 360/390: recorrido vertical conectado; comparación escalonada; imagen de producto reducida a 160 px; personalización y sugerencia en disclosures; etapas operacionales 2×2, tarjeta dentro de su columna y contexto secundario. CTA contextual y CTAs comerciales legibles. Beneficios verticales y cierre apilado.
- No hay carrusel obligatorio, barra comercial sticky adicional ni scroll horizontal de página.

Se condensaron párrafos, reaseguros, detalle y FAQ, con padding específico de explicación/síntesis. La nueva evidencia visual ocupa espacio: no se afirma reducción global de altura. Se priorizó progresión narrativa y diferenciación de bloques sobre una cifra de scroll.

## Checks y QA

| Verificación | Resultado |
|---|---|
| TypeScript independiente: npx --no-install tsc --noEmit --incremental false | PASS |
| Build final de producción | PASS. / y sitemap prerenderizados; rutas operacionales conservadas |
| Lint acotado mediante API ESLint con presets flat instalados | PASS: 0 errores, 0 warnings |
| npm run lint | BLOCKED por FlatCompat preexistente; configuración intacta |
| Siete verifies existentes: node scripts/landing-v1/verify.cjs | PASS |
| Verify de presentación mediante argumento explícito al runner | PASS: importes, referencia, unicidad y conteos de cuatro etapas |
| 360, 390, 768, 1024 y 1440 | PASS: clientWidth = scrollWidth; diez secciones, un h1 y anchors válidos |
| Disclosures abiertos en mobile | PASS: extras, bebida, detalle y FAQ sin overflow |
| Progresión y reinicio | PASS: cuatro acciones, conteos correctos, aria-live y foco conservado en la acción |
| Menú por teclado | PASS: Enter, Escape devuelve foco; navegación cierra el menú |
| Skip link y anchor Producto | PASS: foco en contenido y título por debajo del sticky header |
| Contraste acotado de textos visibles | PASS: 189 textos, cero fallas después de ajustar dos labels sobre superficie cálida |
| CTAs sin configuración | PASS: botones deshabilitados sin href |
| Render real de MarketingAction con contacto ausente, inválido y válido de prueba | PASS: destinos/mensajes distintos y atributos seguros; no se abrió WhatsApp ni se enviaron mensajes |
| Snapshot de producción con todos los scripts retirados | PASS: diez secciones, acción deshabilitada y disclosures de FAQ/detalle operables |
| Regla reduced motion efectiva | PASS: cero animaciones/transiciones computadas al hacer coincidir el media query en el helper temporal |
| Temas operacionales dark en snapshot | PASS: marketing conserva su fondo oscuro propio y superficies independientes |
| Reflow equivalente a 1440 al 200% (720 px) | PASS: sin overflow |
| Consola durante QA | Sin errores de aplicación |
| Login/protección smoke | / 200; login 200 con form; dashboard 307 a login; variante invalid_credentials 200 con form |
| Whitespace del diff contra baseline | PASS: sin diagnósticos; git diff --no-index retorna 1 por diferencias existentes |
| Preservación de archivos fuera de alcance, HEAD e índice | PASS |

El primer build falló al descargar Inter y Plus Jakarta Sans por conectividad restringida. El build con acceso de red autorizado pasó, sin modificar fuentes o configuración. Se repitió build después del ajuste visual/estado; el final pasó.

### Límites de la evidencia

- Los atajos del navegador integrado no cambiaron el zoom nativo. Se comprobó reflow a 720 px; no se presenta como zoom nativo certificado.
- La prueba sin scripts usa HTML real del build con scripts retirados. No se cambió una preferencia global de JavaScript del navegador; no se certifica la visualización de noscript con scripting globalmente deshabilitado.
- Reduced motion se verificó haciendo coincidir la regla CSS existente en un snapshot; no se cambió la preferencia del sistema operativo.
- La auditoría de contraste es acotada a texto HTML visible, no una certificación WCAG integral.
- No se realizó E2E autenticado de catálogo → checkout → confirmación → dashboard: no existe un tenant de prueba autorizado aportado para esta sesión. No se crearon pedidos ni se usaron capturas/datos privados. La regresión se cubrió con preservación de archivos, build, verifies relevantes y smoke de autenticación.
- No se incorporó analytics ni se afirma un incremento medido de conversión.

## Bloqueos y problemas preexistentes

ESLint 9.39.4, lint general:

```text
TypeError: Converting circular structure to JSON
Object → configs → flat → plugins → react closes the circle
@eslint/eslintrc/lib/shared/config-validator.js:308:45
```

No se modificó eslint.config.mjs ni se corrigió FlatCompat. El lint acotado usa configuración en memoria, sin archivos nuevos de configuración.

Next advierte que la convención middleware está deprecada a favor de proxy. No se migró.

## Estado comercial y SEO

La configuración local sigue sin contacto comercial habilitado y sin origen canónico confirmado. Los CTAs comerciales están deshabilitados con explicación breve; no existe fallback al login, número ficticio ni URL vacía.

Con contacto válido: Solicitar demo y Hablar por WhatsApp usan el mismo contacto con mensajes diferentes. La prueba usó solo un proceso temporal, sin guardar configuración ni enviar mensajes.

Sin origen: canonical absoluto ausente y contrato condicional de sitemap/OG preservado. Metadata comercial, es-AR y assets sociales siguen intactos.

Contacto y dominio son blockers para publicación productiva, no para revisión local de V1.1.

## Diferencias respecto del plan

- Se aplicaron los cuatro ajustes finales del usuario, incluido WhatsApp opcional en FAQ además del paso 2.
- La foto editorial del catálogo dentro del pequeño dispositivo conserva una proporción ligeramente horizontal en mobile para preservar la composición del hero; desktop usa superficie cuadrada. No se replica pixel-perfect el catálogo.
- Los datos agrupados del detalle y el contexto son editorialmente estáticos. No se agregó configuración ni selector funcional para mensajes/opciones.
- Los CTAs configurados se comprobaron renderizando el componente real en procesos temporales, en lugar de producir varios builds con variables comerciales distintas.
- QA de zoom/JS/reduced motion tiene las limitaciones concretas descritas arriba.

## Diff del alcance y preservación

El baseline registra hashes de 1400 archivos no ignorados, excluyendo tmp. Solo cambiaron los 13 archivos de marketing inventariados. Se crearon cinco archivos nuevos de código y este informe.

La familia marketing era parte de cambios locales previos sin staging. Por eso git diff --stat ordinario contra HEAD no distingue V1 de V1.1. Se generó un diff --no-index contra copias de bytes exactos del baseline, sin tocar índice ni historial:

```text
18 files changed, 255 insertions(+), 122 deletions(-)
```

Este stat cubre los 18 archivos de código; el informe nuevo se entrega por separado. Evidencia: tmp/landing-v1.1/scope.diff y scope-stat.txt. Los cambios previos ajenos a marketing no se incluyeron en ese diff.

No hubo staging, commit, push, deploy ni operaciones hosted. HEAD e índice coinciden con el baseline. Ningún archivo operacional, ESLint, dependencias, configuración comercial o documento preexistente ajeno fue modificado.

El servidor local original se conservó. El helper temporal de snapshot fue detenido y su pestaña cerrada. La landing real permanece abierta para revisión.

## Evidencia local y pendientes

- viewport-360.png, viewport-390.png, viewport-768.png, viewport-1024.png y viewport-1440.png.
- hero-desktop.png, operation-desktop.png y operation-mobile.png.
- responsive.json, contrast-final.json, cta-render.json, no-js-reduced.json, smoke.json, lint-scoped.json y preservation.json.
- contracts.txt y presentation.txt.

Todos están en tmp/landing-v1.1/.

Antes de publicación: contacto/origen reales, E2E con tenant autorizado y revisión de zoom nativo/JS globalmente deshabilitado en un navegador que exponga esos controles. La revisión humana de estética continúa disponible en localhost:3000. Precios, prueba social, legales, analytics y capacidades futuras siguen fuera de esta fase.
