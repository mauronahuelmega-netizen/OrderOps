# LANDING-V1 — implementation report

Fecha: 2026-10-04 (America/Buenos_Aires).

## Implementation summary

Fases 1–5 completadas para implementación y revisión local. La raíz pública ahora presenta una propuesta comercial completa: hero, catálogo/dashboard, tres pasos, comparación con el chat, personalización, recorrido operativo, detalle del pedido, comunicación, beneficios, rubros, suscripción, FAQ y cierre. Son diez secciones principales.

La landing se genera estáticamente. No consulta negocios, sesiones, carrito ni Supabase. Las dos pequeñas islas cliente son navegación mobile y exploración de estados. La personalización, el detalle y las FAQ usan disclosures nativos.

Revisión local: http://localhost:3000/. Se mantuvo abierto el tab de la aplicación real. El servidor de desarrollo ya estaba activo; no se reemplazó ni detuvo. El servidor temporal de QA de producción fue detenido al terminar.

## Archivos creados y modificados

Raíz del workspace: `C:\Users\Oasis Desktop\Desktop\Full Stack Developer\Projects\OrderOps`.

Modificados (cuatro):

- `.env.example`: dos variables opcionales de marketing y documentación de reconstrucción.
- `app/page.tsx`: composición comercial y metadata propia.
- `app/layout.tsx`: exclusivamente el idioma HTML, de `en` a `es-AR`.
- `app/theme-tokens.css`: nuevos tokens semánticos prefijados; valores existentes intactos.

Creados (25 archivos de implementación, assets, verificación e informe):

- `app/sitemap.ts`.
- `components/marketing/marketing-config.ts` y `marketing-config.verify.ts`.
- `components/marketing/marketing-content.ts`.
- `components/marketing/marketing-action.tsx`.
- `components/marketing/marketing-header.tsx`.
- `components/marketing/mobile-navigation.tsx`.
- `components/marketing/marketing-landing.tsx` y `marketing-landing.module.css`.
- `components/marketing/product-preview.tsx` y `product-preview.module.css`.
- `components/marketing/product-story.tsx` y `product-story.module.css`.
- `components/marketing/order-flow-demo.tsx` y `order-flow-demo.module.css`.
- `components/marketing/order-detail-preview.tsx` y `order-detail-preview.module.css`.
- `components/marketing/contact-preview.tsx` y `contact-preview.module.css`.
- `public/marketing/burger.svg`, `lemonade.svg`, `orderops-social.svg` y `orderops-social.png`.
- `scripts/landing-v1/verify.cjs`.
- `docs/landing-v1-implementation-report.md` (este informe).

En `tmp/landing-v1/` se guardaron artefactos locales de QA: baseline de hashes, capturas, resultados JSON, estadísticas Git, copias de artefactos de Next y helpers temporales. No son parte del código de producción.

## Decisiones visuales

- Hero oscuro con azul OrderOps, Inter/Plus Jakarta Sans, título grande y composición superpuesta de catálogo mobile y tablero.
- Catálogo gastronómico ficticio con identidad cálida y dos ilustraciones vectoriales originales. No se usaron capturas privadas, nombres de clientes ni assets operacionales.
- Datos del pedido `J3E54J` consistentes entre escenas: BBQ Bacon $13.500, papas medianas +$950, bacon +$1.000 y limonada $2.500; total $17.950. El teléfono del detalle se representa enmascarado y no tiene enlace externo.
- Una identificación discreta del conjunto de vistas ilustrativas en el hero. Las cifras del tablero representan exclusivamente los pedidos de esa escena, no métricas comerciales.
- Secciones claras para explicación/configuración, sección oscura para operación, franja azul de suscripción y cierre oscuro. Los beneficios se presentan editorialmente, sin grilla de cards genéricas.
- Estados explorables manualmente; los mensajes de WhatsApp son representaciones de apertura y envío manual. No se promete automatización ni edición del contenido de pedidos.
- Movimiento breve mediante CSS; sin dependencias nuevas ni bucles. El CSS de reduced motion desactiva animaciones y transiciones de toda la familia.

## Desktop, tablet y mobile

- Desktop: hero en dos áreas; composición de dispositivos, comparación paralela, configuración en dos columnas y tablero de cuatro columnas.
- Tablet: dispositivo y tablero más compactos, navegación disclosure y columnas ajustadas.
- Mobile: título y catálogo protagonistas, representación enfocada del pedido; tablero sustituido por tarjeta legible y controles de progreso en dos filas. Comparación y secciones cambian de composición; no se miniaturiza toda la interfaz desktop.
- Navegación mobile se cierra al elegir un enlace con JS y soporta Escape con devolución de foco. Sin JS mantiene el comportamiento nativo del disclosure.
- No se agregó barra inferior persistente. Demo está disponible visualmente en el header sticky, hero y cierre.

## CTAs y configuración comercial

`ORDEROPS_MARKETING_WHATSAPP` y `ORDEROPS_MARKETING_SITE_ORIGIN` son opcionales para revisión local y se evalúan al construir. Después de configurarlas se debe reconstruir la aplicación.

Sin número: Solicitar demo y Hablar por WhatsApp son botones deshabilitados, no navegables, con explicación y descripción accesible. No utilizan el número de soporte, números ficticios ni fallback al login.

Con número válido: ambos enlaces apuntan a WhatsApp con mensajes distintos de demo y consulta, usando codificación URL y atributos seguros de nueva pestaña. La verificación pura cubre los dos mensajes y los valores inválidos; no se abrió ni envió ningún mensaje externo.

Iniciar sesión conserva `/admin/login`. Ver cómo funciona utiliza un anchor interno.

Sin origen confirmado: no se genera canonical ni URL absoluta social inventada; el sitemap queda vacío y las imágenes sociales no se anuncian en metadata. El PNG 1200×630 está preparado para habilitarse con el origen confirmado.

**Blockers antes de publicación productiva:** configurar y comprobar el WhatsApp comercial y confirmar el origen HTTPS canónico. No bloquean la V1 local.

## Verificaciones y resultados

| Verificación | Resultado |
|---|---|
| Typecheck independiente, `npx --no-install tsc --noEmit --incremental false` | PASS |
| Build final, `npm run build` | PASS. `/` y `/sitemap.xml` prerenderizados; rutas operativas conservadas |
| Lint general, `npm run lint` | BLOCKED por FlatCompat preexistente; configuración intacta |
| Lint acotado mediante API de ESLint y presets flat ya instalados, sin modificar configuración | PASS: 0 errores, 0 warnings en marketing y páginas afectadas |
| Siete verificaciones puras mediante `node scripts/landing-v1/verify.cjs` | PASS: configuración, referencias, WhatsApp público/contextual/estructurado, complementarios y preparación |
| Navegador en 360, 390, 768, 1024 y 1440 px | PASS: sin overflow horizontal, un h1 y anchors válidos |
| Reflow en 720 px, equivalente geométrico de viewport 1440 px al 200% | PASS: sin overflow. No se afirma haber cambiado el zoom nativo del navegador |
| Menú mobile con teclado, navegación y Escape | PASS |
| Skip link | PASS: foco en `main#contenido` |
| Exploración de estados, opciones, bebida, detalle y FAQ | PASS |
| CTAs sin configurar | PASS: todos deshabilitados y sin href ficticio |
| HTML de producción sin scripts | PASS: diez secciones y disclosures nativos; controles JS deshabilitados con explicación |
| Reduced motion | PASS de regla efectiva: en QA se hizo coincidir el media query existente; cero animaciones/transiciones computadas. No se cambió la preferencia del sistema |
| Temas persistidos | PASS: snapshot con atributos de catálogo/dashboard dark mantiene superficies propias de marketing |
| Contraste HTML visible | PASS: 183 textos comprobados, cero fallas detectadas. Auditoría acotada; no constituye certificación integral WCAG |
| Consola de landing | Sin errores de aplicación en la revisión |
| Smoke HTTP | `/` 200; login 200; dashboard sin sesión 307 a login; error de credenciales conserva su texto |
| `git diff --check` sobre archivos existentes afectados | PASS |
| Preservación por SHA-256 | PASS: los 1760 archivos del baseline permanecen iguales salvo los cuatro cambios autorizados |
| HEAD e índice | Idénticos al baseline |

La medición del snapshot final de producción, servida localmente y sin throttling, dio **LCP 1072 ms, CLS 0 y TTFB 8,1 ms**. El helper de instrumentación fue exclusivamente temporal y no forma parte de la landing. No hay datos de campo ni certificación de INP.

El catálogo, checkout y dashboard autenticados no se recorrieron contra un negocio real: no se proporcionó una cuenta/tenant de prueba autorizado. No se crearon pedidos. La evidencia de preservación combina hashes de los componentes operativos, el build, smoke de protección y las verificaciones existentes; no se presenta como un E2E autenticado completo.

## Problemas preexistentes y limitaciones

Error exacto del lint general (ESLint 9.39.4):

```text
TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'Object'
    |     property 'configs' -> object with constructor 'Object'
    |     property 'flat' -> object with constructor 'Object'
    |     ...
    |     property 'plugins' -> object with constructor 'Object'
    --- property 'react' closes the circle
Referenced from:
    .../@eslint/eslintrc/lib/shared/config-validator.js:308:45
```

No se modificó `eslint.config.mjs`. El lint aislado fue una verificación adicional en memoria, no una reparación del lint del repositorio.

El build advierte que la convención `middleware` está deprecada en favor de `proxy`. No se migró.

El primer build no pudo descargar Inter y Plus Jakarta Sans por conectividad restringida. Con acceso de red autorizado para el build, la compilación final pasó sin cambiar las fuentes.

El intento de usar `tsx` temporal desde npm fue bloqueado por EACCES a registry.npmjs.org. El runner de QA utiliza TypeScript ya instalado, resuelve los aliases y transpila los verifies únicamente en memoria; no instala dependencias ni emite archivos.

Los artefactos tracked regenerados por Next (`next-env.d.ts` y los archivos de configuración/build comprobados) fueron restituidos a sus bytes de baseline. Los cambios locales previos en `tsconfig.tsbuildinfo` se preservaron.

## Desviaciones respecto del plan

- Se mantuvo la configuración ESLint intacta, conforme al ajuste obligatorio. Se añadió lint acotado sin archivos de configuración nuevos.
- `agent-browser` no estaba instalado. La inspección visual y las interacciones se realizaron con el navegador integrado y CUA; no se instaló una herramienta nueva.
- Las escenas de personalización se exploran con disclosures nativos, sin duplicar un configurador interactivo. El recorrido de estados sí tiene interacción cliente.
- Para evitar URLs absolutas ficticias y warnings, las imágenes sociales se anuncian solo con dominio configurado.
- Pruebas sin JS, temas persistidos, reduced motion y métricas usaron un snapshot local temporal del build. El zoom se verificó mediante reflow equivalente, no mediante una preferencia persistente del navegador.
- No se realizó E2E autenticado ni se usaron datos reales de negocios.

## Pendientes V1.1

- Revisión humana de dirección estética, copy y ajustes finos de composición.
- Fotos o capturas de producto sanitizadas y aprobadas, si aportan más evidencia que las ilustraciones.
- Ajustes de movimiento basados en esa revisión; sin introducir complejidad antes de validar la narrativa.
- Incorporar precios, prueba social y textos legales únicamente cuando existan datos aprobados.
- Elegir un proveedor de medición comercial en una fase explícita; los atributos de eventos actuales son inertes.
- E2E autenticado con negocio de prueba autorizado y una auditoría accesible más amplia antes de publicación.

## Git y operaciones

No hubo staging, commit, push, deploy ni operaciones hosted. HEAD e índice son idénticos al estado inicial; se verificó por comparación.

`git diff --stat` completo incluye los numerosos cambios previos. Su resumen es:

```text
54 files changed, 9802 insertions(+), 1574 deletions(-)
```

El diff de los únicos cuatro archivos tracked modificados por LANDING-V1 es:

```text
.env.example         |   7 ++
app/layout.tsx       |   2 +-
app/page.tsx         | 322 +++------------------------------------------------
app/theme-tokens.css |  43 +++++++
4 files changed, 69 insertions(+), 305 deletions(-)
```

Git no incluye los 25 archivos nuevos sin staging en `git diff --stat`. Están inventariados arriba. Las estadísticas completas se conservan en `tmp/landing-v1/git-diff-stat.txt`; el subset tracked está en `tmp/landing-v1/landing-tracked-diff-stat.txt`.

## Evidencia visual

Capturas del build final:

- `tmp/landing-v1/hero-production-desktop.jpg`.
- `tmp/landing-v1/hero-production-mobile.jpg`.
- `tmp/landing-v1/viewport-1440.jpg`, `viewport-768.jpg`, `viewport-390.jpg` (recorrido completo durante QA).
- `tmp/landing-v1/order-detail-desktop.jpg`.
- `tmp/landing-v1/no-js-reduced-dark.jpg`.

Resultados estructurados: `responsive.json`, `contrast.json`, `lab-metrics.json` y `final-check.json` en la misma carpeta temporal.
