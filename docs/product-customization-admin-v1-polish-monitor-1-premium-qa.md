# PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 — Enterprise Premium QA & UX/UI Polish Audit

## Objetivo

Auditar críticamente el módulo admin de Product Customization V1 (`/admin/products/customizations`) como producto final usable por un dueño no técnico, midiendo claridad, jerarquía, densidad, copy, responsive, accesibilidad básica, preview admin y no regresión pública — sin implementar fixes runtime.

## Contexto

Product Customization V1 está funcionalmente cerrado (admin → catálogo → cart → order). Las pestañas **Secciones reutilizables** y **Plus sugeridos** ya fueron compactadas (cards + ⋮ + modales). **Por producto** / **Por categoría** / excepciones / assignments siguen en un patrón más denso e inline. El piloto `demohamburgueseria` tiene personalización activa con Doble Smash + Papas/Salsas/Agregados + Plus Bebidas (Coca Cola 500ml).

Preguntas guía:

1. ¿Un dueño no técnico puede entender, confiar y usar esta pantalla sin asistencia?
2. ¿Se siente SaaS premium o herramienta interna en desarrollo?

## Alcance

- Admin: `/admin/products/customizations` — tabs Por producto, Por categoría, Secciones reutilizables, Plus sugeridos, Preview admin, excepciones (`?product=`).
- Público (no regresión, sin confirmar pedido): `/b/demohamburgueseria/catalogo` — caso Doble Smash.
- Documentación + backlog priorizado + scoring.

## Fuera de scope

- Fixes visuales / refactors / DB / migrations / RLS / server actions / cart / checkout / create_order / stock / flags / deploy funcional / pedidos QA / cambios de datos productivos.

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_V1_POLISH_MONITOR_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_V1_POLISH_MONITOR_BROWSER_QA=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_V1_POLISH_MONITOR_DOCS=yes
```

Sin autorización para runtime fixes ni deploy funcional.

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status --short` | Working tree con docs/tmp previos; sin bloqueo para auditoría |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0) |
| Dev server | `localhost:3000` (Next.js ya en ejecución) |

Baseline: sin fallos de compilación. No se corrigió nada fuera de scope.

## Arquitectura auditada

| Pieza | Ubicación |
|-------|-----------|
| Página | `app/admin/(protected)/products/customizations/page.tsx` |
| Shell / tabs | `OwnerCustomizationBuilder` |
| Preview | `AdminCustomizationLivePreview` + shared public components |
| Assignments | `CustomizationAssignmentsSection` + `SortableReorderList` |
| Overrides / excepciones | `ProductCustomizationOverridesPanel` (embed si `?product=`) |
| Secciones compact | `reusable-sections/*` + `reusable-sections.module.css` |
| Plus compact | `plus-suggestions/*` + `plus-suggestions.module.css` |
| CSS shared denser | `product-customization-admin.module.css` |
| Actions menu | `reusable-sections/actions-menu.tsx` (`<details>` + Escape) |

Tabs actuales: Por producto · Por categoría · Secciones reutilizables · Plus sugeridos.

Modales (native `<dialog>`): section edit, options management, option edit, plus edit, suggested products, suggested product edit.

Zonas de mayor riesgo visual/UX: Por producto (3 columnas + avanzado), Por categoría (forms inline), panel de excepciones (“Desactivar”), responsive mobile del builder.

Copy técnico todavía visible (ejemplos): `Desactivar`, `Herencia`, `Origen: Producto`, `Preview` (EN), `Orden de aparición`, `builder` en aria-label, chips `Min`/`Máx`.

## Rutas auditadas

| Ruta | Resultado |
|------|-----------|
| `/admin/products/customizations` | Carga OK, tabs OK |
| `/admin/products/customizations?product=<id>` | Embed de excepciones OK |
| `/b/demohamburgueseria/catalogo` | Catálogo + modal + cart OK (sin checkout) |

## Estándar premium aplicado

Criterios: Claridad · Jerarquía · Densidad · Confianza · Copy · UI premium · UX intuitiva · Responsive · A11y básica · Confianza operacional.

## Browser QA

| Viewport / tema | Observación |
|-----------------|-------------|
| Desktop ancho grande | Shell usable; preview útil con Doble Smash |
| Desktop ancho medio | Preview puede sentirse apretada / column balance imperfecto |
| Mobile ~390px | Tabs con scroll horizontal; contenido del builder no ocupa todo el ancho (espacio vacío lateral); preview colapsable |
| Light | Contraste y superficies OK |
| Dark | Contraste OK; badges/chips legibles; sin roturas graves |

Consola: sin errores críticos bloqueantes observados durante la sesión.

## QA funcional crítico

| Check | Estado |
|-------|--------|
| Página carga | PASS |
| Tabs cambian | PASS |
| Layout shift grave | No observado |
| Overflow horizontal (desktop/mobile medido) | No (`overflowX: false` en 390px) |
| Primer pantallazo explica módulo | PASS WITH DEBT (banner + tabs claros; empty state redundante hasta elegir producto) |

## Auditoría Por producto

**Veredicto tab:** PASS WITH UX DEBT (funcional + preview fuerte; densidad/excepciones/avanzado todavía técnicos).

- Elegir producto: claro (lista + meta “con opciones / plus”).
- Secciones asignadas: resumen legible (Papas/Salsas/Agregados + Visible).
- Preview acompaña: Papas/Salsas/Agregados + Sumá una bebida + Coca; total estimado; CTA deshabilitado.
- CTAs: “Agregar sección…”, “Gestionar excepciones”, “Configurar plus” — comprensibles.
- Deuda: excepciones requieren `?product=`; panel avanzado de assignments denso; copy “Preview” EN; CTAs secundarios compiten.

## Auditoría Por categoría

**Veredicto tab:** NEEDS POLISH (claridad de impacto).

- Se entiende el propósito (“aplicar a todos los productos”).
- **Problema P1:** `HAMBURGUESAS` muestra “sin secciones / todavía ninguna” aunque Doble Smash y BBQ Bacon tienen opciones a nivel producto. Un owner puede creer que hamburguesas no están configuradas.
- Form “Agregar sección” siempre visible (patrón denso vs compact de otras tabs).
- Sin preview de impacto por categoría.
- Empty state “Nada aparece todavía” OK, pero no menciona opciones por producto.

## Auditoría Secciones reutilizables

**Veredicto tab:** PASS WITH MINOR UX DEBT (más cercana a premium).

- Cards compactas, chips, ⋮, modales crear/editar/gestionar opciones: claros.
- Visible/Oculta, Requerida/Opcional, Única/Múltiple, precios: OK.
- Reorder ↑↓ / drag: presente.
- Deuda: demasiados chips (Min/Máx redundantes con Única+Requerida); menú ⋮ expone menuitems en a11y tree aunque cerrado; intro duplicada con tab hint.

## Auditoría Plus sugeridos

**Veredicto tab:** PASS WITH MINOR UX DEBT.

- Card Bebidas clara; Coca +$3.000; Visible; destino Doble Smash.
- Modales crear/editar/gestionar productos: claros; “Ocultar plus/producto” mejor que “Desactivar”.
- Deuda: chips duplicados (“Aparece en Doble Smash” + “Producto · Doble Smash”); título tab repetido; stock/contexto catálogo aún limitado en rows.

## Auditoría Preview admin

**Veredicto:** PASS WITH MINOR UX DEBT.

- Ayuda real a comprender el resultado.
- “Total estimado” + “no agrega al carrito” + CTA disabled: claro que es sandbox.
- Overrides contemplados conceptualmente (copy cuando hay excepciones).
- Deuda: mezcla EN/ES (“Preview”); validación requerida siempre visible puede sentirse “error” agresivo; preview desktop+mobile duplicada en DOM.

## Auditoría pública no regresión

Caso Doble Smash en `/b/demohamburgueseria/catalogo`:

| Check | Estado |
|-------|--------|
| Catálogo carga | PASS |
| Modal abre | PASS |
| Papas / Salsas / Agregados | PASS |
| Requeridos entendibles | PASS |
| Extras con precio | PASS |
| Sumá una bebida + Coca | PASS |
| Total cambia (base 12.500 + Coca 3.000 → 15.500 en cart) | PASS |
| Agregar al carrito | PASS |
| Carrito parent + Adicional Coca | PASS |
| Confirmar pedido | **No ejecutado** (prohibido) |

Sin INCIDENT CANDIDATE en público.

## Evaluación visual premium

| Área | Nota |
|------|------|
| Secciones / Plus | Cercanas a enterprise; spacing y cards consistentes |
| Por producto | Buena narrativa 3 columnas; CTAs y avanzado aumentan ruido |
| Por categoría | Sparse + form grande; menos premium |
| Excepciones | Lista densa de “Desactivar”; aspecto herramienta interna |
| Mobile | Tabs scrolleables OK; ancho útil incompleto |
| Dark/Light | Superficies y contraste razonables |

## Evaluación de copy

| Actual | Problema | Propuesta |
|--------|----------|-----------|
| Desactivar / Desactivar para este producto | Suena destructivo | Ocultar para este producto / Ocultar opción aquí |
| Herencia por categoría y asignaciones directas | Técnico | Qué se muestra en este producto |
| Origen: Producto | Interno | Solo en este producto / Desde la categoría |
| Preview interactiva… | Mezcla EN | Vista previa interactiva… |
| Orden de aparición | Avanzado OK, pero demasiado presente | Mantener solo bajo “Opciones avanzadas” |
| Min 1 / Máx 1 | Ruido con Única+Requerida | Simplificar chips |
| aria “Navegación del builder” | Interno | Navegación de personalización |
| plus: Bebidas (meta producto) | Aceptable | Plus sugerido: Bebidas |

## Evaluación de intuitividad

### First-time owner test

| # | Pregunta | Resultado |
|---|----------|-----------|
| 1 | ¿Qué hacer primero? | PASS WITH MINOR UX DEBT — tabs + hint; empty state pide elegir producto |
| 2 | ¿Qué es sección reutilizable? | PASS — copy + ejemplos claros |
| 3 | ¿Qué es plus sugerido? | PASS — copy comercial claro |
| 4 | ¿Impacto Por producto vs Por categoría? | PASS WITH UX DEBT — categoría no refleja opciones por producto |
| 5 | ¿Qué verá el cliente? | PASS — preview fuerte en Por producto |
| 6 | ¿Visible vs oculto? | PASS WITH MINOR UX DEBT — chips claros; excepciones “Desactivar” confunden |
| 7 | ¿Preview reduce incertidumbre? | PASS |

**Clasificación intuitividad global:** PASS WITH UX DEBT

## Evaluación de estados

| Estado | ¿Existe? | Nota |
|--------|----------|------|
| Loading | Parcial | Pending en forms (`Guardando…`); sin skeleton de página |
| Empty | Sí | Producto/categoría/secciones/plus |
| Error | Sí | `admin-feedback` en actions |
| Saving | Sí | disabled + Guardando |
| Disabled | Sí | CTA preview; botones pending |
| Success feedback | Débil | `router.refresh` sin toast/affirmation clara |
| Destructive confirmation | No | Toggle hide sin confirm (aceptable soft-hide) |
| Invalid form | Parcial | required HTML; poca guía inline premium |
| No options / no plus | Sí | Empty states |
| No product selected | Sí | |

## Evaluación responsive

| Check | Estado |
|-------|--------|
| Tabs accesibles (scroll) | PASS WITH DEBT (truncados visualmente) |
| Cards no se rompen | PASS (Secciones/Plus) |
| Chips wrap | PASS |
| Modales usables | PASS (desktop); mobile no stress-testeado exhaustivo en todos |
| Footer modal usable | PASS |
| Menú ⋮ usable | PASS |
| Preview no ahoga | PASS (collapsible mobile) |
| Overflow horizontal | PASS |
| Ancho útil mobile del builder | **FAIL polish** — contenido no full-bleed / espacio lateral vacío |

## Evaluación accesibilidad básica

| Check | Estado |
|-------|--------|
| Botones reales | PASS |
| Labels inputs | PASS en forms principales |
| aria-label acciones compactas | PASS (⋮) |
| Foco visible | Razonable |
| Escape cierra menú/dialog | PASS (menu Escape; dialog nativo) |
| No solo color | PASS (chips + texto) |
| Contraste | PASS razonable light/dark |
| Tab order | Lógico en general |
| Dialog bloquea fondo | PASS (`showModal`) |
| Menuitems en DOM cerrado | DEBT — a11y tree expone items de menús cerrados |
| Radios preview a veces “on” sin nombre rico en mobile tree | DEBT menor |

## Matriz de hallazgos

| ID | Área | Pantalla/Tab | Severidad | Categoría | Hallazgo | Evidencia | Impacto | Recomendación | Fase sugerida |
|----|------|--------------|-----------|-----------|----------|-----------|---------|---------------|---------------|
| PC-POLISH-001 | Admin | Por categoría | P1 | UX | Categoría con productos configurados a nivel ítem aparece “sin secciones” | HAMBURGUESAS → “sin secciones / todavía ninguna” pese a Doble Smash/BBQ Bacon | Owner cree que no hay config | Mostrar hint “N productos con opciones propias” + link a Por producto | PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 |
| PC-POLISH-002 | Admin | Excepciones | P1 | Copy | “Desactivar” / “Desactivar para este producto” suena destructivo | Overrides panel BBQ Bacon `?product=` | Reduce confianza | “Ocultar para este producto” / “Ocultar opción aquí” | PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 |
| PC-POLISH-003 | Admin | Por producto / Por categoría | P1 | UX/UI | Inconsistencia de patrón: Secciones/Plus compactos vs assignments densos inline | Forms “Agregar sección” + “Orden de aparición” siempre en flujo | No se siente un solo producto premium | Compactar assignments/excepciones al patrón cards+modales | PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 |
| PC-POLISH-004 | Admin | Responsive | P1 | Responsive | Mobile: contenido del builder no usa el ancho completo | Viewport 390px — espacio vacío lateral | Usabilidad tablet/phone baja | Revisar grid/padding del shell operational en narrow | PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 |
| PC-POLISH-005 | Admin | Por producto | P1 | UX | Excepciones solo aparecen con `?product=` (link navigation) | “Gestionar excepciones” cambia URL; cambiar producto sin query oculta panel | Flujo frágil / poco discoverable | Embed excepciones al seleccionar producto (sin depender solo del query) | PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 |
| PC-POLISH-006 | Admin | Plus sugeridos | P2 | UI | Chips duplicados destino | “Aparece en Doble Smash” + “Producto · Doble Smash” | Ruido visual | Un solo chip de destino | PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 |
| PC-POLISH-007 | Admin | Secciones | P2 | UI | Demasiados chips (Min/Máx redundantes) | Papas: Única+Requerida+Min 1+Máx 1 | Densidad innecesaria | Colapsar chips a essentials | PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 |
| PC-POLISH-008 | Admin | Preview | P2 | Copy | Mezcla EN/ES “Preview” | Subtítulo preview panel | Menos premium localizado | “Vista previa…” consistente | PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 |
| PC-POLISH-009 | Admin | Excepciones | P2 | Copy | “Herencia… Solo desactivar / restaurar” | Overrides intro | Lenguaje interno | Copy owner-friendly | PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 |
| PC-POLISH-010 | Admin | Global | P2 | UX | Feedback de éxito débil tras guardar | Solo refresh | Confianza incompleta | Toast/affirmation breve | PRODUCT-CUSTOMIZATION-ADMIN-EMPTY-STATES-1 |
| PC-POLISH-011 | Admin | Global | P2 | Accessibility | Menús ⋮ exponen menuitems con menú cerrado | A11y tree siempre muestra items | Lectores de pantalla ruidosos | Montar panel solo cuando `open` o `inert`/hidden | PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 |
| PC-POLISH-012 | Admin | Por producto | P2 | UI | Empty state redundante (“Elegí un producto” x2) | Estado inicial sin selección | Menos polish | Un título + una línea de ayuda | PRODUCT-CUSTOMIZATION-ADMIN-EMPTY-STATES-1 |
| PC-POLISH-013 | Admin | Layout | P2 | Responsive | Preview apretada en anchos medios | 3 columnas en desktop medio | Jerarquía comprimida | Breakpoint: stack preview debajo antes | PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 |
| PC-POLISH-014 | Admin | Tabs | P3 | Copy | Hint tab + H2 de tab repiten mensaje | Plus/Secciones | Ruido menor | Acortar uno de los dos | PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 |
| PC-POLISH-015 | Admin | A11y | P3 | Accessibility | aria-label “builder” | tablist | Interno | “personalización” | PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 |
| PC-POLISH-016 | Admin | Preview | P3 | Technical debt | Preview desktop + mobile montadas a la vez | DOM duplicado | Costo a11y/perf menor | Un solo preview con CSS/collapsible | PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 |
| PC-POLISH-017 | Admin | Modales | P3 | UI | Footer modal solo “Cerrar” (sin CTA primario contextual) | Options/suggested products | Aceptable; puede sentirse incompleto | Mantener; opcional “Listo” | PRODUCT-CUSTOMIZATION-ADMIN-MODAL-POLISH-1 |
| PC-POLISH-018 | Público | Catálogo | — | Functional | No regresión Doble Smash + Coca + cart | Cart: parent + Adicional Coca $15.500 | Confianza V1 runtime | Monitoreo piloto continuo | (ninguna fix admin) |

**Conteos:** P0=0 · P1=5 · P2=8 · P3=4 · Público sin regresión.

## Scoring premium

| Dimensión | Score (1–5) |
|-----------|-------------|
| Claridad | 3.5 |
| Jerarquía visual | 3.0 |
| Densidad | 3.0 |
| Consistencia | 2.5 |
| Copy | 3.0 |
| Intuitividad | 3.5 |
| Responsive | 2.5 |
| Accesibilidad básica | 3.5 |
| Confianza operacional | 3.5 |
| Premium feel | 3.0 |

**Enterprise Readiness Score: 3.1 / 5**

Justificación: el módulo es usable y el público piloto está sano; Secciones/Plus ya se sienten premium, pero Por producto/categoría/excepciones todavía revelan herramienta interna (densidad, “Desactivar”, inconsistencia de patrón, mobile width). No hay bloqueo P0, pero varios P1 impiden declarar enterprise-ready.

## Riesgos / deuda

1. Confusión categoría vs producto en adopción de owners.
2. Excepciones poco descubribles / frágiles vía query.
3. Deuda de compactación pendiente en assignments.
4. Mobile admin no listo para uso diario del dueño.
5. Copy de overrides erosiona confianza (“Desactivar”).

## Qué NO se tocó

- Ningún componente runtime, CSS de producto, actions, DB, RLS, flags, cart/checkout (salvo QA local de carrito sin confirmar pedido), stock, deploy funcional.
- Solo documentación + CURRENT_PHASE + living memory.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | No ejecutado (opcional) |

## Resultado final

**NEEDS POLISH**

- Sin P0 / sin INCIDENT CANDIDATE.
- Público Doble Smash + Coca + carrito parent/adicional: PASS.
- Admin usable, pero no consistentemente enterprise-premium (5× P1 + deuda de consistencia tabs).
- Documentación y backlog quirúrgico listos.

## Próximas fases recomendadas

1. **PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1** — Desactivar→Ocultar; Herencia; Preview ES; aria labels.
2. **PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1** — hints categoría↔producto; chips; empty states.
3. **PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1** — excepciones sin depender solo de `?product=`.
4. **PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1** — alinear Por producto/categoría al patrón cards+modales.
5. **PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1** — full-width mobile; breakpoints preview.
6. **PRODUCT-CUSTOMIZATION-ADMIN-EMPTY-STATES-1** — success feedback + empty states premium.
7. **PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1** — menús ⋮ / focus / hidden content.
8. **PRODUCT-CUSTOMIZATION-ADMIN-MODAL-POLISH-1** — consistencia footers/scroll/CTAs (si queda deuda tras compact).

Orden sugerido: Copy → Hierarchy/Exceptions → Assignments compact → Responsive → Empty/A11y.
