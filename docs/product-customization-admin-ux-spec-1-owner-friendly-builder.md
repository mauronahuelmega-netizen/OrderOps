# PRODUCT-CUSTOMIZATION-ADMIN-UX-SPEC-1 — Owner-Friendly Builder Specification

## 1. Resumen ejecutivo

La pantalla actual de Product Customization Admin (`/admin/products/customizations`) debe evolucionar desde un panel técnico basado en **grupos / asignaciones / upsell groups** hacia un **builder orientado al dueño de negocio**, centrado en productos, categorías y la experiencia final del cliente.

**Esta spec no cambia funcionalidad ni modelo de datos.** Propone una nueva capa de UX sobre la arquitectura Product Customization V1 existente (PASS WITH DEBT; flag default `false`).

**Fecha spec:** 2026-07-14  
**Estado:** APROBADA para implementación incremental  
**Próxima implementación:** `PRODUCT-CUSTOMIZATION-ADMIN-UX-1 — Owner-Friendly Builder Shell`

---

## 2. Contexto

| Hecho | Estado |
|-------|--------|
| Product Customization V1 | Cerrado documentalmente (`docs/product-customization-v1-final-handoff.md`) |
| Core funcional | Validado (admin → catálogo → cart → order → dashboard) |
| Pantalla admin actual | Funciona técnicamente |
| Flag default | `false` (fail-closed) |
| Desafío actual | **Adopción**: que un dueño mantenga opcionales/extras/plus sin conocer el modelo |

UI auditada (read-only): `app/admin/(protected)/products/customizations/page.tsx` + `components/admin/product-customization/*`.

Layout actual (vertical, entity-first):

1. Notice flag (“Preparación interna”)  
2. Overrides panel (si `?product=`)  
3. Form crear grupo (siempre visible)  
4. Cards “Grupos y opciones” (densas, edit in-place)  
5. Sección “Asignaciones” (target categoría/producto + sort_order)  
6. Sección “Plus sugeridos” (copy técnico: “máximo 1 grupo por…”)

---

## 3. Problema UX actual

1. **Organizada por entidades técnicas**, no por intención (“¿qué puede elegir el cliente en BBQ Bacon?”).  
2. Copy interno: *grupos, asignaciones, target, sort_order, plus group, disponible*.  
3. **Demasiados formularios visibles a la vez** (create group + edit cards + assignments + upsell).  
4. Cards **grandes, densas y repetitivas**.  
5. Falta relación visual producto ↔ opciones ↔ plus ↔ vista cliente.  
6. **Sin preview** “así lo verá el cliente”.  
7. Sin progressive disclosure: avanzado aparece demasiado pronto.  
8. Plus sugeridos se siente configuración técnica, no herramienta comercial.  
9. Falta narrativa: *“Cuando compre este producto, puede elegir… y le sugerimos…”*.  
10. Fotos de opcionales inexistentes (clave tipo fast food; futura fase).  
11. Empty state solo en grupos; assignments/upsell no guían al owner.  
12. Descripción de página habla de “preparación interna” → refuerza mentalidad de desarrollador.

---

## 4. Usuario objetivo

**Dueño / encargado gastronómico**, no técnico. Necesita cambios rápidos:

- agregar extra bacon (+$)  
- cambiar precio de papas grandes  
- ocultar una opción  
- hacer que una hamburguesa sugiera Coca  
- aplicar opciones a toda una categoría  
- ver cómo lo verá el cliente  

**No** diseñar para developers. Power users avanzados pueden acceder a “Avanzado”, pero no es el default.

---

## 5. Principios de diseño

1. **Product-first** — empezar por producto/categoría, no por grupo.  
2. **Lenguaje cotidiano** — evitar términos de dominio interno.  
3. **Progressive disclosure** — esencial primero; avanzado colapsado.  
4. **Preview permanente** — config ↔ resultado.  
5. **Minimalismo funcional** — menos cards, más listas.  
6. **Reutilización invisible** — el sistema reusa secciones; el owner no sufre el modelo.  
7. **Seguridad** — cambios reversibles; soft hide, no delete destructivo por default.  
8. **Mobile-aware** — usable en tablet/teléfono.  
9. **Comercial** — plus = vender más ticket promedio.  
10. **Consistencia OrderOps** — tokens zinc + índigo; module CSS; no CSS global.

---

## 6. Cambio conceptual

```txt
De:
“Administrar grupos, asignaciones y upsell groups”

A:
“Configurar qué puede elegir el cliente en cada producto”
```

### Mapeo mental

| Modelo interno | Mental model del owner |
|----------------|------------------------|
| Grupo | Sección de opciones |
| Opción | Opción del cliente |
| Assignment | Aparece en |
| Override | Excepción para este producto |
| Upsell group | Plus sugerido / Venta sugerida |
| sort_order | Orden de aparición |
| is_available | Visible para el cliente |
| target | Producto o categoría |
| required / single / multiple | Debe elegir / Elige una / Puede elegir varias |

---

## 7. Nuevo lenguaje de producto

| Término técnico actual | Término visible recomendado |
|------------------------|-----------------------------|
| Grupo | Sección de opciones |
| Opción | Opción |
| Assignment / Asignaciones | Aparece en |
| Override | Excepción para este producto |
| Upsell group | Plus sugerido / Venta sugerida |
| Target | Producto o categoría |
| Sort order / Orden | Orden de aparición |
| Disponible | Visible para el cliente |
| Required | Obligatorio |
| Multiple | Puede elegir varias |
| Single | Elige una |
| Preparación interna | Configuración del menú (o quitar) |
| Máximo 1 grupo por target | Cada producto o categoría puede tener una venta sugerida activa |

### Ejemplos de copy

- “Esta sección aparece en Hamburguesas.”  
- “El cliente debe elegir una opción.”  
- “El cliente puede elegir hasta 3.”  
- “Este plus se ofrecerá antes de agregar al carrito.”  
- “Configurá qué puede elegir el cliente antes de agregar este producto al carrito.”  
- “Este producto hereda opciones de su categoría.”  
- “Ocultar solo en este producto.”  
- “Así lo verá el cliente.”  
- “Ofrecé productos extra para aumentar el ticket promedio.”

---

## 8. Arquitectura de información propuesta

### Opción recomendada (IA A)

```txt
Opcionales y extras
├─ Por producto          ← DEFAULT
├─ Por categoría
├─ Secciones reutilizables
├─ Plus sugeridos
└─ (Preview embebido — no tab separado en desktop)
```

**Por qué:** el dueño piensa primero en el plato (“BBQ Bacon”), luego en la categoría, y solo después mantiene bibliotecas reutilizables. Preview no es un silo: vive junto a la config.

### Alternativa descartada como default (IA B)

```txt
Builder
├─ Qué puede elegir el cliente
├─ Dónde aparece
├─ Plus sugeridos
└─ Vista previa
```

Útil como narrativa, pero “Dónde aparece” vuelve a oler a assignments. Mejor embeber “Aparece en” dentro del drawer de cada sección.

---

## 9. Navegación propuesta

Segmented control / tabs:

```txt
[Por producto] [Por categoría] [Secciones reutilizables] [Plus sugeridos]
```

| Tab | Rol |
|-----|-----|
| **Por producto** (default) | Config inmediata del ítem de menú |
| Por categoría | Herencia masiva |
| Secciones reutilizables | Biblioteca (secundaria) |
| Plus sugeridos | Comercial / ticket |

Header propuesto:

- Eyebrow: `Catálogo`  
- Title: `Opcionales y extras`  
- Description: `Configurá qué puede elegir el cliente y qué le sugerís para sumar al pedido.`  
- Badge flag: `Visible en catálogo` / `Solo preparación (apagado)` — sin “rollout técnico”.

---

## 10. Vista principal product-first

### Desktop — 3 columnas

```txt
Columna 1 — Lista de productos (buscable)
Columna 2 — Configuración del producto seleccionado
Columna 3 — Vista previa del cliente (sticky)
```

Columna 2 secciones:

1. **Qué puede elegir el cliente** — lista accordion de secciones (heredadas + propias).  
2. **Venta sugerida** — 0..1 plus activo.  
3. **Excepciones** — solo si hay herencia.  
4. **Avanzado** (colapsado) — IDs internos / debug solo si hace falta.

### Mobile

- Columna 1 = selector (sheet / list first).  
- Columna 2 = contenido full-width.  
- Preview = botón **“Ver como cliente”** → bottom sheet / fullscreen.

---

## 11. Vista por categorías

Permitir:

- seleccionar categoría;  
- ver secciones que aplican a todos sus productos;  
- agregar sección a toda la categoría;  
- entender herencia.

Copy:

> “Todo lo que configures acá aparecerá en los productos de esta categoría. Después podés ocultar algo solo en un producto.”

Lista hija: “Productos afectados (N)” colapsable.

---

## 12. Grupos reutilizables → Secciones reutilizables

**No es la primera vista.**

Uso: opciones que se repiten (tamaño de papas, aderezos, extras, pan, punto de cocción).

### UI

Accordion / lista editable, **no** cards gigantes.

```txt
▾ Tamaño de papas
  Obligatorio · El cliente elige 1 · Aparece en Hamburguesas
  Papas chicas       Incluido
  Papas medianas     +$500
  Papas grandes      +$900
```

### Edición: drawer lateral (desktop) / fullscreen (mobile)

**Editar sección**

- Nombre  
- Regla de selección (elige una / varias; min–max; obligatorio)  
- Opciones (lista compacta + reordenar ↑↓ / DnD)  
- Dónde aparece (chips producto/categoría)  
- Avanzado (colapsado)

Create form: **no** siempre visible → CTA “Nueva sección”.

---

## 13. Plus sugeridos → Venta sugerida

Replanteo comercial:

> “Ofrecé productos extra antes de agregar al carrito.”

UI mental:

```txt
Cuando el cliente compre:
[Hamburguesas]
Sugerir:
[foto] Coca Cola 500ml
```

Copy del límite (ocultar “máximo 1 grupo por target”):

> “Cada producto o categoría puede tener una venta sugerida activa.”

Vista previa embebida: bloque “También podés sumar” del modal público (solo lectura).

---

## 14. Overrides → Excepciones para este producto

No mostrar como “overrides” en la IA principal.

Solo cuando hay herencia:

```txt
BBQ Bacon hereda “Aderezos” desde Hamburguesas.
[Ocultar solo en este producto]
```

Copy:

> “Este producto usa las opciones de su categoría. Podés ocultar una sección u opción solo para este producto.”

Restaurar = “Volver a mostrar (usar la de la categoría)”.

---

## 15. Vista previa del cliente

**Parte central de la UX**, no accesorio.

Incluye:

- card producto;  
- precio “Desde $X” si aplica;  
- preview del modal (grupos/opciones/total visual);  
- plus “También podés sumar”.

| Viewport | Comportamiento |
|----------|----------------|
| Desktop | Panel sticky derecha |
| Mobile | “Ver como cliente” colapsable |

Reglas:

- **read-only** — no escribe carrito ni pedidos;  
- debe reflejar config **guardada** (o draft claramente marcado “Sin guardar”);  
- estados: sin secciones / con secciones / con plus / flag apagado (“El cliente aún no lo ve en catálogo”).

---

## 16. Opcionales con imágenes (fase posterior)

No implementar en UX-1…UX-5. Specificar UX:

Cada opción puede tener imagen opcional.

Fila compacta:

```txt
[thumb] Bacon              +$900       Visible
[thumb] Cheddar extra      +$700       Visible
[placeholder] Sin cebolla  Incluido    Visible
```

Fallback: placeholder neutro / ícono.

### Fase futura: `PRODUCT-CUSTOMIZATION-OPTION-IMAGES-1`

Requiere: migration DB; storage bucket/policies; upload UI; thumbnails admin; thumbnails modal público; fallback; QA.  
**Prohibido** implementar en esta spec.

---

## 17. Estados vacíos

### Sin secciones (producto)

> “Todavía no configuraste opciones para este producto.”  
> [Agregar opciones obligatorias] [Agregar extras] [Agregar plus sugerido]

### Sin plus

> “Todavía no estás sugiriendo productos extra.”  
> [Agregar plus sugerido]

### Sin productos en catálogo

> “Primero necesitás cargar productos en tu catálogo.”  
> [Ir a productos]

### Secciones reutilizables vacías

> “Creá secciones que puedas reusar en varios productos (por ejemplo ‘Aderezos’ o ‘Tamaño de papas’).”  
> [Nueva sección]

---

## 18. Estados de error y validación

### Mensajes humanos

- “Elegí al menos una opción.”  
- “Este producto ya tiene una venta sugerida activa.”  
- “Esta sección ya aparece en esta categoría.”  
- “No podés ocultar todas las opciones de una sección obligatoria.”  
- “Guardamos los cambios.”  
- “No pudimos guardar. Intentá de nuevo.”

### Evitar en UI

`constraint violation`, `duplicate key`, `target_id`, `assignment`, stack traces, JSON.

---

## 19. Accesibilidad y mobile

- Labels claros; botones ≥ 44px táctiles.  
- Foco visible.  
- **No depender solo de DnD** — mantener ↑/↓ (ya existe en DND-1).  
- Preview colapsable en mobile.  
- Edición en drawer / fullscreen.  
- `aria-live` para toasts de guardado.  
- Keyboard: Tab a filas; Enter abre drawer; Esc cierra.

---

## 20. Componentes propuestos (futuros)

| Componente | Rol |
|------------|-----|
| `OwnerCustomizationBuilder` | Shell tabs + layout 3 columnas |
| `ProductCustomizationSidebar` | Lista/buscador productos |
| `CategoryCustomizationSidebar` | Lista categorías |
| `CustomizationSectionList` | Accordion secciones del producto |
| `CustomizationSectionRow` | Resumen sección |
| `CustomizationOptionRow` | Opción compacta (+ imagen futura) |
| `CustomizationSectionDrawer` | CRUD sección |
| `ProductPreviewPanel` | Preview cliente |
| `UpsellSuggestionBuilder` | Venta sugerida |
| `ExceptionPanel` | Excepciones herencia |
| `OptionImageUploader` | Fase imágenes |

No implementar en esta fase.

---

## 21. Wireframes textuales

### Wireframe A — Por producto

```txt
┌────────────────┬──────────────────────────┬─────────────────────┐
│ Productos      │ BBQ Bacon                 │ Así lo verá cliente │
│ 🔍 Buscar      │                          │                     │
│                │ Qué puede elegir          │ [Card producto]     │
│ BBQ Bacon  ●   │ ▾ Tamaño de papas         │ Desde $13.500       │
│ Clásica        │ ▾ Extras                  │                     │
│ Doble Smash    │ Plus sugerido: Coca Cola  │ [Modal preview]     │
│                │ Excepciones (1)           │ También podés sumar │
│                │ [+ Agregar sección]       │ Coca Cola 500ml     │
└────────────────┴──────────────────────────┴─────────────────────┘
Tabs: [Por producto] [Por categoría] [Secciones] [Plus sugeridos]
```

### Wireframe B — Secciones reutilizables

```txt
Secciones reutilizables                    [Nueva sección]

▾ Tamaño de papas
  Obligatorio · Elige 1 · Aparece en Hamburguesas
  Papas chicas       Incluido
  Papas medianas     +$500
  Papas grandes      +$900

▸ Extras
▸ Aderezos
```

### Wireframe C — Plus sugeridos

```txt
Venta sugerida
“Ofrecé productos extra antes de agregar al carrito.”

Cuando el cliente compre:  [Hamburguesas ▼]
Sugerir:                   [Coca Cola 500ml ×]

Vista previa:
  “También podés sumar”
  + Coca Cola 500ml  $3.000
```

---

## 22. Copy recomendado

| Contexto | Copy |
|----------|------|
| Page description | Configurá qué puede elegir el cliente y qué le sugerís para sumar al pedido. |
| Product panel | Qué puede elegir el cliente |
| Preview | Así lo verá el cliente |
| Reusable | Secciones reutilizables |
| Reusable help | Usá secciones reutilizables para repetir las mismas opciones en varios productos. |
| Upsell | Venta sugerida |
| Upsell help | Ofrecé productos extra para aumentar el ticket promedio. |
| Exceptions | Excepciones para este producto |
| Soft hide | Ocultar para el cliente / Visible para el cliente |
| Flag off | Solo preparación — el catálogo aún no muestra estas opciones. |
| Flag on | Visible en el catálogo público. |
| Save | Guardamos los cambios. |
| Inherit | Este producto hereda opciones de su categoría. |

---

## 23. Qué se mantiene del modelo actual

Sin cambios de schema ni reglas de negocio:

- `customization_groups` / `customization_options`  
- `customization_group_assignments`  
- `product_customization_overrides`  
- `upsell_groups` / `upsell_group_items`  
- `sort_order`, `is_available`, selection rules  
- feature flag `product_customization_enabled`  
- snapshot / order / cart / checkout / dashboard flows  
- server actions existentes (wrappers adaptados a nueva UI)

La UX nueva es **capa de presentación** sobre V1.

---

## 24. Qué se oculta al usuario

Relegar a “Avanzado” o no mostrar:

- UUIDs / IDs  
- `target_type` / `target_id` crudos  
- palabras “assignment”, “override”, “upsell group”  
- `sort_order` numérico crudo (usar “orden de aparición” + ↑↓)  
- constraints SQL / errores técnicos  
- internals grupo/ítem  
- JSON / snapshots  

---

## 25. Roadmap de implementación

| Fase | Nombre |
|------|--------|
| ADMIN-UX-1 | Owner-Friendly Builder Shell |
| ADMIN-UX-2 | Product-first Configuration Panel |
| ADMIN-UX-3 | Customer Preview Panel |
| ADMIN-UX-4 | Reusable Sections Drawer |
| ADMIN-UX-5 | Plus Suggestions Redesign |
| OPTION-IMAGES-1 | Option Images |
| ADMIN-WIZARD-1 | Guided Setup Templates |

---

## 26. Fases sugeridas

### PRODUCT-CUSTOMIZATION-ADMIN-UX-1 — Owner-Friendly Builder Shell (**primera**)

| | |
|--|--|
| **Objetivo** | Reorganizar layout y lenguaje; navegación product-first; esconder técnico. |
| **Scope** | Tabs/segmented; shell 3 columnas; copy; relocar formularios create detrás de CTA; empty states básicos; sin DB. |
| **Fuera** | Preview real; drawer completo; imágenes; cambios actions/schema. |
| **Riesgos** | Romper discoverability de power users → tab “Secciones” + “Avanzado”. |
| **Validación** | Owner encuentra config de un producto sin preguntar “qué es un assignment”. |

### PRODUCT-CUSTOMIZATION-ADMIN-UX-2 — Product-first Configuration Panel

| | |
|--|--|
| **Objetivo** | Panel producto con secciones heredadas/propias + excepciones. |
| **Scope** | Sidebars producto/categoría; accordion; excepciones copy; wiring actions existentes. |
| **Fuera** | Preview fidelidad modal; imágenes. |
| **Riesgos** | Desync product-first ↔ biblioteca reutilizable. |
| **Validación** | Ocultar sección heredada solo en un producto. |

### PRODUCT-CUSTOMIZATION-ADMIN-UX-3 — Customer Preview Panel

| | |
|--|--|
| **Objetivo** | Preview read-only card + modal + plus. |
| **Scope** | Sticky desktop; sheet mobile; “Desde $X”; estado flag off. |
| **Fuera** | Escribir cart; pedidos. |
| **Riesgos** | Parecer editable → watermark “Solo vista”. |
| **Validación** | Preview refleja sección/opción/plus visibles. |

### PRODUCT-CUSTOMIZATION-ADMIN-UX-4 — Reusable Sections Drawer

| | |
|--|--|
| **Objetivo** | CRUD secciones en drawer; lista accordion. |
| **Scope** | Migrar edits de cards densas a drawer; “Aparece en” chips. |
| **Fuera** | Wizard templates. |
| **Validación** | Crear sección + opciones + asignar sin formularios siempre visibles. |

### PRODUCT-CUSTOMIZATION-ADMIN-UX-5 — Plus Suggestions Redesign

| | |
|--|--|
| **Objetivo** | Venta sugerida comercial. |
| **Scope** | Copy; UI “cuando compre X sugerir Y”; límite humano. |
| **Fuera** | Múltiples plus activos (sigue regla V1: 1 por target). |
| **Validación** | Owner configura plus sin leer “target/assignment”. |

### PRODUCT-CUSTOMIZATION-OPTION-IMAGES-1

Ver §16. DB + storage + UI + público + QA.

### PRODUCT-CUSTOMIZATION-ADMIN-WIZARD-1

Templates guiados (“Hamburguesería”: tamaño, extras, bebidas plus). Solo después del builder estable.

---

## 27. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Esconder demasiado lo avanzado | Tab Secciones + drawer Avanzado |
| Desync product-first ↔ reusable | Misma fuente de verdad; deep-link producto ↔ sección |
| Preview confundido con editor | “Solo vista” + no inputs |
| Imágenes → storage/perf | Fase dedicada; lazy thumbs; límites size |
| Migrar UI sin romper actions | Wrappers; no cambiar contrato actions en UX-1 |
| Densidad residual | Listas compactas, no cards legacy |

---

## 28. Criterios de aceptación para implementación futura

- Un dueño entiende dónde configurar opciones de un producto.  
- Puede ver dónde aparece una sección.  
- Distingue obligatorio / opcional.  
- Previsualiza el modal público.  
- Agrega plus sin términos técnicos.  
- Oculta una opción/sección heredada solo para un producto.  
- No se pierde capacidad avanzada (sections + avanzado).  
- Flag notice claro sin jerga “rollout”.  
- Mobile usable sin DnD obligatorio.  
- Sin cambios de DB en UX-1…UX-5 (salvo fase imágenes).

---

## 29. Qué NO se implementa en esta spec

- código / componentes React / CSS  
- DB / storage / `image_url`  
- checkout / cart / catálogo público / `create_order` / dashboard  
- activar flag / pedidos / deploy  

---

## 30. Resultado final

**Spec UX/UI creada.** Lista para iniciar implementación incremental en:

**`PRODUCT-CUSTOMIZATION-ADMIN-UX-1 — Owner-Friendly Builder Shell`**

Clasificación de esta fase de documentación: **PASS**.
