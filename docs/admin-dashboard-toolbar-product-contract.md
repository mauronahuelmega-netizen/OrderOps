# Admin Dashboard Toolbar Product Contract

## 1. Executive Summary

Este documento congela el contrato de producto del bloque **Dashboard Execution Toolbar** en `/admin/dashboard`, derivado del audit forense T0.

**Decisión central:** El toolbar es una **consola de acción operacional** — no un segundo top section, no una zona analítica. Controla consulta, filtrado, búsqueda y administración inmediata de pedidos en curso.

**Decisiones críticas cerradas:**

| Tema | Contrato |
|------|----------|
| Refresh | **Sincronizar sesión** (hydrate), no refetch de pedidos |
| Context panel | Refleja **vista filtrada actual** (`filteredOrders`) |
| Scanning | **Adjacent** — copy final: **Estados del flujo** |
| Session label | Una sola frase de estado — **no** duplicar "Negocio abierto" |
| Search | Client-side, instantáneo, no afecta top section |
| Tabs | IDs congelados, URL sync, sin nuevos tabs |

Implementación pendiente en T2–T10. **T1 no modifica código.**

---

## 2. Context

- Top section (D0–D10.1) cerrado: KPIs macro, insights de sesión, mobile/desktop alineados.
- Experience base (A0–A2.1) cerrado: loading theme-safe, modal audio interaction gate.
- T0 identificó: orquestador monolítico, copy sin acentos, refresh misleading, scanning técnico, dead code filter panel, legacy CSS warm.

T1 responde las **10 open questions** de T0 y congela reglas para fases posteriores.

---

## 3. Contract Scope

**Nombre de trabajo:** Dashboard Execution Toolbar

**Definición:**

> La zona de control operacional inmediata para consultar, filtrar, buscar y administrar el estado de ejecución de pedidos en curso.

**No es:**
- Segundo top section
- Duplicación de KPIs de negocio u operación macro
- Zona analítica primaria

**Es:**
- Consola de acción para el operador
- Puente entre lectura macro (top section) y ejecución (lanes/cards)

---

## 4. Product Definition

### Propósito

Permitir al operador:

1. Entender **qué pedidos ve** (scope de sesión/jornada)
2. **Filtrar y buscar** dentro de ese scope
3. **Abrir/cerrar sesión** operativa del negocio
4. **Sincronizar estado de sesión** cuando haya duda
5. Navegar hacia lanes/resultados y contexto local

### Usuario objetivo

Owner, manager, operator con permisos de operación — no viewer analítico pasivo.

### Éxito operativo

El operador puede actuar sobre pedidos sin confundir sesión vs pedidos vs filtros vs refresh.

---

## 5. In Scope / Adjacent / Out of Scope

### IN SCOPE (core toolbar)

| Elemento | Componente actual |
|----------|-------------------|
| Título `Pedidos en curso` | `DashboardToolbar` |
| Search operacional | `OperationalSearch` |
| Tabs/filtros rápidos | `DashboardToolbar` + `FILTER_OPTIONS` |
| Metadata de scope operativo | `operationalWindowLabel` |
| Session controls (abrir/cerrar) | `DashboardToolbar` scope row |
| Refresh/resync de sesión | `handleManualStoreSessionResync` |

### ADJACENT / CONNECTED (execution area, no core toolbar)

| Elemento | Relación |
|----------|----------|
| Scanning / navegación por lanes | Nivel 4 — debajo del toolbar |
| Empty state inmediato | Nivel 5 — resultado de ejecución |
| Kanban / lista filtrada | Nivel 5 |
| Context panel (resumen, actividad, insights secundarios) | Nivel 6 |

### OUT OF SCOPE

- Top section presenter/viewModel y CSS
- KPIs de negocio y operación del top section
- Order cards internals
- Order modal internals
- Realtime subscription internals
- Server actions / DB / Supabase
- Audio unlock modal / gate
- AdminShell / theme bootstrap A1
- Public catalog / product settings pages

---

## 6. Visual Hierarchy Contract

Niveles congelados (de arriba hacia abajo en execution area):

| Nivel | Contenido | Rol |
|-------|-----------|-----|
| **1 — Sección** | `Pedidos en curso` | Ancla de la consola |
| **2 — Herramientas** | Search + filtros rápidos | Consulta y recorte |
| **3 — Scope / sesión** | Estado sesión + abrir/cerrar + sincronizar | Acción operativa inmediata |
| **4 — Navegación secundaria** | Estados del flujo (scanning) | Saltos entre lanes |
| **5 — Resultado** | Kanban / lista / empty | Trabajo principal |
| **6 — Contexto secundario** | Resumen de la vista / Actividad reciente | Lectura local |

**Principio:** El toolbar (niveles 1–3) debe leerse como **una unidad de control**, no piezas dispersas.

---

## 7. Desktop Layout Contract

Dirección conceptual congelada (implementación T3):

```
Fila 1:
[ Pedidos en curso + scope breve ]          [ Search ]

Fila 2:
[ Tabs / filtros rápidos ]                  [ Session controls + Sincronizar sesión ]
```

**Reglas:**

- Search visualmente asociado a `Pedidos en curso` (misma banda superior)
- Session controls agrupados con estado de sesión y acción de sync
- Refresh/sync **no** como icono aislado sin label accesible (T4)
- Scope breve puede vivir junto al título (Fila 1) o integrarse en cluster de sesión (Fila 2) — T3 elige layout final sin romper agrupación lógica

**Alternativa aceptable** (documentada, no preferida):

```
Bloque izquierdo: Título + scope + tabs
Bloque derecho: Search + session controls
```

Preferencia de producto: **Fila 1 / Fila 2** por claridad search↔título.

---

## 8. Mobile Layout Contract

Orden congelado (implementación T8):

1. Título
2. Search full-width
3. Tabs horizontales scrollables
4. Session controls compactos (estado + acciones)
5. Estados del flujo / scanning
6. Empty / lista / kanban

**Reglas mobile:**

- Search **siempre** full-width
- Tabs: scroll horizontal OK, sin wrap caótico
- Session controls no compiten visualmente con tabs (separación vertical clara)
- **No** horizontal overflow del bloque (preservar D10 containment)
- Touch targets razonables (mínimo ~44px donde sea acción primaria)
- No esconder abrir/cerrar sesión ni sync detrás de menús ocultos

---

## 9. Search Contract

### Semántica

**Search = búsqueda operacional client-side sobre pedidos visibles en el scope operativo actual** (`visibleOperationalOrders` → luego filtro tab → luego search).

### Campos / capacidades (vía `natural-search`)

- Cliente
- Estado (términos naturales)
- Método de entrega (delivery/retiro)
- Señales de riesgo (si parser lo soporta)
- Asignación (si parser lo soporta)
- Términos naturales ya implementados en `lib/orders/natural-search.ts`

### Alcance de efectos

| Área | ¿Afectada? |
|------|------------|
| Top section | **NO** |
| Kanban / lista | **SÍ** |
| Empty state filtrado | **SÍ** |
| Context panel | **SÍ** (vista filtrada) |
| Scanning model | **SÍ** indirecto (searchActive en lane nav) |

### Copy congelado

| Uso | Texto |
|-----|-------|
| Placeholder | `Buscar por cliente, estado o situación...` |
| Section aria | `Búsqueda operacional` |
| Input aria | `Buscar por cliente, estado o situación` |
| Clear button | `Limpiar búsqueda` |
| Clear aria | `Limpiar búsqueda` |

**Regla:** Todos los textos con acentos correctos en implementación T5+.

### Debounce

**Congelado:** Mantener **instantáneo** (comportamiento actual).

Evaluar debounce **150–250 ms** en T5 **solo** si profiling demuestra problema real. No implementar en T1.

---

## 10. Filter Tabs Contract

### Tabs congelados

| Label | ID |
|-------|-----|
| Todos | `all` |
| Pendientes | `pending` |
| Preparando | `preparing` |
| Listos | `ready` |
| Delivery | `delivery` |
| Retiro | `pickup` |

### Reglas

- Sincronización URL: `?filter=` (excepto `all` → param omitido)
- Filtran vista de ejecución (status o `delivery_method`)
- **NO** afectan top section
- **SÍ** afectan context panel (vista filtrada)
- **No agregar** nuevos tabs en T2–T10 salvo nueva fase producto

### Semántica

- `all` → kanban por grupos de estado
- Otros → lista + lane metrics del filtro activo

### A11y target (T5)

- **Mantener** button group + `aria-pressed` como baseline
- Evaluar `role="tablist"` **solo** si mejora teclado sin regresión visual — **DEFERRED** decisión de patrón final

---

## 11. Session Controls Contract

Session controls **pertenecen al toolbar** — acción operacional inmediata.

### Deben agrupar

1. **Una frase de estado** operativo
2. **Acción primaria** abrir o cerrar sesión (según estado)
3. **Acción secundaria** sincronizar sesión

### Estrategia de copy (congelada)

**Eliminar redundancia** entre `Sesión activa · desde…`, `Negocio abierto`, `Jornada actual`.

#### Con sesión operativa activa (`onDemandModeActive` + scope store-session cuando aplique)

| Elemento | Copy |
|----------|------|
| Estado | `Sesión activa · desde HH:MM` |
| Acción | `Cerrar sesión` |
| Pending | `Cerrando...` |

#### Sin sesión operativa activa

| Elemento | Copy |
|----------|------|
| Estado | `Sin sesión activa` |
| Acción (si permiso) | `Abrir sesión` |
| Pending | `Abriendo...` |

#### Fallback jornada (sin store session, ventana de negocio)

| Elemento | Copy |
|----------|------|
| Estado | `Jornada actual · HH:MM–HH:MM` |

**No usar** `Negocio abierto` como label paralelo — la frase de estado ya comunica apertura.

**Regla:** Una sola frase explica el estado operativo visible.

### Permisos

- Abrir/cerrar: `canManageStoreSession` (sin cambio)
- Operadores sin permiso: ven estado, no botones de mutación

---

## 12. Open / Close Session Contract

### Semántica

| Acción | Significado |
|--------|-------------|
| Abrir sesión | Iniciar sesión operativa del negocio (on-demand mode activo) |
| Cerrar sesión | Cerrar sesión operativa actual |

### Comportamiento congelado (no cambiar sin fase dedicada)

- Server action: `toggleBusinessStatus`
- Confirm al cerrar si hay pedidos activos in-progress
- Permission gating intacto
- Pending states: `Abriendo...` / `Cerrando...`
- Realtime + hydration post-acción intactos
- `router.refresh()` tras éxito (actual)

### Visual

- Cerrar sesión: variante danger **moderada** — clara pero no alarmista
- Abrir sesión: secondary estándar

---

## 13. Refresh / Resync Contract

### Respuesta explícita (Open Question #1)

**¿Refresh actualiza sesión, pedidos o ambos?**

→ **Solo sesión** en comportamiento actual. **Contrato congela esto hasta fase futura explícita.**

### Semántica congelada

La acción **no** es "Actualizar pedidos". Es:

| Copy recomendado | Uso |
|------------------|-----|
| `Sincronizar sesión` | Label visible / tooltip preferido |
| `Actualizar sesión` | Alternativa aceptable |
| `Sincronizando sesión...` | Estado pending |

**Comportamiento:** `hydrateStoreSession` → `getActiveStoreSessionHydrationAction` — sin cambio en T1–T4 salvo copy/affordance.

### T4 deliverables

- Reemplazar inline SVG por `RefreshCw` (lucide-react)
- Label accesible claro (no solo icono)
- Tooltip/`title` coherente con copy congelado
- Disabled state durante `isStoreSessionHydrating`

### Futuro (fuera de contrato actual)

**Refresh de pedidos** = fase separada — toca data refresh, realtime reconcile, expectativas de operador. Marcar como **DEFERRED**.

---

## 14. Scanning / Lane Navigation Contract

### Respuesta explícita (Open Question #3)

**¿Scanning pertenece al toolbar?**

→ **NO** es core toolbar. Es **navegación secundaria adjacent** (Nivel 4).

### Semántica

**Scanning = navegación auxiliar por lanes/estados visibles** dentro de vista `Todos` (kanban).

- No reemplaza tabs
- No filtra — hace scroll/foco a secciones
- Visible solo cuando hay pedidos y filtro `all`

### Copy congelado (Open Questions #4, #5)

Reemplazos aprobados para T6:

| Actual | Contrato final |
|--------|----------------|
| `Scanning operacional` | **`Estados del flujo`** |
| `Saltos rapidos entre lanes visibles` | **`Salto rápido entre columnas visibles`** (subtitle opcional, T6) |
| `Sin pedidos` | **`Sin pedidos`** (mantener) |
| `Panel en escucha` | **`Esperando ingresos`** |

Empty variant header: **`Estados del flujo`** (mismo título que con pedidos — dedupe markup en T6).

### Visual (T6)

- Tipografía legible — **no** micro 0.5rem como estado final
- Tokens dark/light
- Sin copy técnico EN ("scanning", "lanes" hacia usuario)

---

## 15. Empty State Contract

Empty state = **resultado de ejecución** (Nivel 5), no parte del toolbar.

### Cuándo aparece

| Condición | Tipo |
|-----------|------|
| Sin pedidos en sistema | Operacional empty |
| Pedidos fuera de scope/jornada | Day scope empty |
| Filtro/search → 0 resultados | Filtered empty |

### Copy congelado — operacional

| Elemento | Texto |
|----------|-------|
| Título (default) | `Todavía no hay pedidos` |
| Título (sesión activa vacía) | `No hay pedidos en la sesión activa` |
| Título (jornada vacía) | `No hay pedidos en la jornada actual` |
| Detalle | `Los nuevos ingresos aparecerán acá automáticamente.` |
| CTA catálogo | `Ver catálogo` |
| CTA productos | `Gestionar productos` |

### Copy congelado — filtrado

| Elemento | Texto |
|----------|-------|
| Con búsqueda | `No hay pedidos que coincidan con esta búsqueda` |
| Hint búsqueda | `Probá con otra combinación de filtros o búsqueda.` |
| Solo filtro | `No hay pedidos en este filtro` |
| Hint filtro | `Cambiá el filtro o volvé a Todos para ver el tablero completo.` |

### Visual

- Guía acción sin competir con toolbar
- Tokenizado — eliminar legacy warm en T9

---

## 16. Context Panel Contract

### Respuesta explícita (Open Question #2)

**¿Context panel sigue filtros/search o muestra toda la sesión?**

→ **Vista filtrada actual** (`filteredOrders` + derivados). **Congelado.**

### Justificación

Si el operador filtra "Listos" o busca un cliente, resumen y actividad deben ayudar a entender **ese subconjunto visible**.

### Roles diferenciados

| Zona | Rol |
|------|-----|
| Top section | Lectura **macro** de la sesión |
| Toolbar | **Acción** sobre pedidos |
| Context panel | Lectura **local** de la vista actual |

### Labels congelados para T7

| Actual | Contrato |
|--------|----------|
| `RESUMEN OPERATIVO` | **`Resumen de la vista`** |
| `ACTIVIDAD RECIENTE` | **`Actividad reciente`** |

- Sentence case, no uppercase shout
- Business insights strip: mantener en panel pero revisar redundancia con top en T7

### Prohibido

- Duplicar KPIs macro del top section en context panel
- Convertir context panel en segundo dashboard analítico

---

## 17. Relationship With Top Section

```
Top section     →  ¿Cómo va la sesión? (macro, KPIs, insights)
Toolbar         →  ¿Qué hago con los pedidos? (buscar, filtrar, sesión)
Execution body  →  ¿Qué pedidos veo? (kanban/lista/empty)
Context panel   →  ¿Qué más importa en ESTA vista? (resumen local)
```

**Prioridad en redundancia:**

1. Top section gana para señales macro
2. Toolbar gana para acciones
3. Context panel gana para detalle local filtrado

**Search y tabs NO propagan al top section viewModel.**

---

## 18. Copy & Tone Contract

### Principios

- Español rioplatense operativo, claro, no técnico
- **Acentos correctos** obligatorios en strings nuevos/corregidos
- Sentence case — evitar UPPERCASE decorativo
- No jerga de desarrollo ("scanning", "hydrate", "lanes" hacia usuario)
- Verbos de acción concretos: Abrir, Cerrar, Sincronizar, Limpiar
- Coherencia con top section D7/D10.1 (insights humanos)

### Prohibido

- `situacion`, `catalogo`, `Todavia`, `Busqueda`, `Operacion` sin acento
- Duplicar la misma señal con dos labels distintos
- Prometer refresh de pedidos cuando solo sync sesión

---

## 19. Iconography Contract

**Estándar:** `lucide-react` para iconos del toolbar cuando se usen.

| Acción | Fase | Icono |
|--------|------|-------|
| Sincronizar sesión | T4 | `RefreshCw` |
| Search (opcional) | T5 | `Search` |
| Session open/close | — | Text-only OK |

**Eliminar:** inline SVG refresh en `DashboardToolbar` (T4/T9).

No cambiar iconos en T1.

---

## 20. Accessibility Contract

### Baseline actual (preservar/mejorar)

| Control | Target |
|---------|--------|
| Search | `aria-label` + placeholder (no placeholder-only) |
| Filtros | `role="group"`, `aria-pressed` |
| Sync sesión | `aria-label` descriptivo con copy congelado |
| Session buttons | Texto visible claro |
| Empty states | `aria-live="polite"` donde aplique |
| Scanning chips | `aria-pressed` |

### Targets por fase

| Mejora | Fase |
|--------|------|
| Tab keyboard nav eval | T5 |
| Scanning legibilidad/contrast | T6 |
| Focus visible audit | T10 |
| Tablist pattern (si aplica) | T5 — DEFERRED |

---

## 21. Performance Contract

| Regla | Contrato |
|-------|----------|
| Search | Instantáneo OK; debounce solo si profiling HIGH |
| Filtros | Client-side sobre scope actual — aceptado |
| Re-renders | T2 debe facilitar memo boundaries sin cambiar lógica |
| `now` tick 60s | Preservar — necesario para métricas stalled |
| Scanning IO | Preservar — cleanup obligatorio |

No optimizar prematuramente en T2–T3.

---

## 22. Architecture Contract For T2

### Objetivo T2

Reducir responsabilidad de `admin-dashboard-orders.tsx` **sin cambiar comportamiento**.

### Opciones aprobadas

**Opción A — View model (preferida, alineada a top section D3):**

```
lib/orders/dashboard-execution-view-model.ts
```

Construye presentación para:

- Toolbar labels y session display model
- Filter options (referencia constants)
- Search metadata / chips
- Empty state copy keys
- Scanning display labels
- Context panel section titles

**Opción B — Hook de controles:**

```
components/admin/orders/use-dashboard-execution-controls.ts
```

Agrupa:

- `searchQuery`, `activeFilter`
- Handlers + URL sync
- Derived filter/search state

### Reglas T2

- T2 elige A, B o A+B según menor riesgo
- Realtime, notifications, modal — **permanecen** en container por ahora
- No mover server actions
- Props de `DashboardToolbar` deben reducirse hacia viewModel slice

---

## 23. Frozen Decisions

| Decision | Final contract | Reason | Applies from phase |
|----------|----------------|--------|--------------------|
| Toolbar definition | Consola de acción operacional inmediata | Evitar duplicar top section | T2+ |
| Search scope | Client-side sobre scope operativo; no top section | Separación macro/micro | T5 copy; behavior frozen |
| Search debounce | Instantáneo; evaluar 150–250ms solo con evidencia | UX responsive | T5 eval |
| Filter tab IDs | `all|pending|preparing|ready|delivery|pickup` | Estabilidad URL | T2+ |
| Filter URL sync | `?filter=` preserved | Deep link operador | T2+ |
| Session label strategy | Una frase; no "Negocio abierto" duplicado | Claridad | T4 |
| Session active copy | `Sesión activa · desde HH:MM` | Operador entiende scope | T4 |
| Session inactive copy | `Sin sesión activa` | Estado claro | T4 |
| Open/close semantics | toggleBusinessStatus unchanged | Estabilidad ops | All |
| Refresh semantics | **Sincronizar sesión** only (hydrate) | T0 finding — no misleading | T4 |
| Refresh copy | `Sincronizar sesión` / `Sincronizando sesión...` | Honest affordance | T4 |
| Scanning ownership | Adjacent Nivel 4, not core toolbar | Jerarquía producto | T6 |
| Scanning header copy | `Estados del flujo` | Humano, no técnico | T6 |
| Empty pill copy | `Esperando ingresos` | Reemplaza "Panel en escucha" | T6 |
| Empty state copy | Acentos + textos congelados §15 | Consistencia | T7 |
| Context panel scope | **Filtered view** (`filteredOrders`) | Coherencia operador | T7 labels |
| Context panel labels | `Resumen de la vista` / `Actividad reciente` | No shout uppercase | T7 |
| Top section relationship | Macro vs acción vs local | Anti-duplicación | All |
| Icon standard | lucide-react | Sistema admin | T4/T9 |
| Copy/accent rules | Acentos obligatorios | Premium ES | T5–T7 |
| Desktop layout | Fila1 title+search / Fila2 tabs+session | Unidad visual | T3 |
| Mobile layout | Title→search→tabs→session→body | D10 compatible | T8 |
| Dead code removal | Permitido en T9 | T0 audit | T9 |
| No new filter tabs | Frozen set | Scope control | T1–T10 |

---

## 24. Deferred Decisions

| Decision | Why deferred | Owner phase | Risk |
|----------|--------------|-------------|------|
| Debounce exact timing (150 vs 250ms) | Needs profiling data | T5 | LOW |
| Full orders refetch button | Toca refresh/realtime contract | Future phase | MEDIUM |
| Tablist vs button group | A11y vs UX tradeoff | T5 | LOW |
| Search icon in field | Visual polish optional | T5 | LOW |
| Focus trap / deep a11y pass | Out of toolbar MVP | T10 | LOW |
| Business insights strip redesign | Overlap with top TBD | T7 | MEDIUM |
| Scope label placement (Fila 1 vs 2) | Layout T3 decision | T3 | LOW |
| Subtitle scanning "Salto rápido..." | Optional microcopy | T6 | LOW |
| Consolidate `operationalSummaries` logic with top insights | Product analytics decision | Post-T7 | MEDIUM |
| Orders refresh + session sync combined action | New behavior scope | Future | HIGH |

---

## 25. Recommended Roadmap Adjustments

Roadmap base **confirmado** con ajustes menores:

| Phase | Ajuste T1 |
|-------|-----------|
| **T1** | ✅ Este contrato |
| **T2** | Prefer view model A; no behavior change |
| **T3** | Implement Fila1/Fila2 desktop contract |
| **T4** | **Prioridad alta** — sync sesión copy + lucide + session label unification |
| **T5** | Search accents + optional debounce eval |
| **T6** | `Estados del flujo` + legibility + dedupe empty header |
| **T7** | Context labels + empty copy + insights overlap review |
| **T8** | Mobile order contract §8 |
| **T9** | Dead filter panel code + warm CSS removal |
| **T10** | Enterprise QA checklist |

**No subdividir T2** salvo emergencia — un solo PR presenter/hook es suficiente.

**T4 antes de T3** es aceptable si se quiere quick win de refresh honesty; orden recomendado sigue T2 → T3 → T4 para no polish sobre monolito.

---

## 26. Acceptance Criteria For Future Phases

### T2

- [ ] View model o hook extraído
- [ ] `DashboardToolbar` props simplificadas
- [ ] Cero cambio comportamiento search/filter/session/sync
- [ ] tsc + build pass

### T3

- [ ] Desktop layout Fila1/Fila2 según §7
- [ ] Search asociado visualmente a título
- [ ] Session cluster agrupado

### T4

- [ ] No "Negocio abierto" redundante
- [ ] `Sincronizar sesión` visible
- [ ] lucide `RefreshCw`
- [ ] Comportamiento hydrate unchanged

### T5

- [ ] Copy search con acentos §9
- [ ] A11y baseline §20

### T6

- [ ] `Estados del flujo` reemplaza scanning copy
- [ ] `Esperando ingresos` pill
- [ ] Font size legible

### T7

- [ ] Context labels §16
- [ ] Empty copy §15
- [ ] Filtered empty copy §15

### T8

- [ ] Mobile stack §8
- [ ] No horizontal overflow regression

### T9

- [ ] Dead code removed
- [ ] `dashboard-filters` warm eliminated or scoped

### T10

- [ ] Dark/light QA
- [ ] Operator UAT signed
- [ ] No refresh misleading
- [ ] Top section untouched regression

---

## 27. What Not To Touch

- Top section presenter/viewModel (`dashboard-top-section-view-model.ts`)
- Top section CSS (`DashboardOverview`, `DashboardMobileOverview`)
- Audio unlock modal / gate
- Theme bootstrap A1 (`app/layout.tsx`, `AdminThemeToggle`)
- AdminShell loading
- Realtime subscriptions (`use-admin-orders-realtime`, store session realtime)
- Supabase DB/schema
- Server actions (`toggleBusinessStatus`, hydration actions) — behavior frozen
- Order cards internals
- Order modal internals
- Public catalog
- Product settings pages

---

## Appendix — Open Questions Resolution (T0 → T1)

| # | Pregunta | Respuesta congelada |
|---|----------|---------------------|
| 1 | ¿Refresh sesión, pedidos o ambos? | **Sesión only** — copy honesto; pedidos = fase futura |
| 2 | ¿Context panel filtros o sesión? | **Vista filtrada actual** |
| 3 | ¿Scanning en toolbar? | **No** — adjacent Nivel 4 |
| 4 | ¿Copy reemplazo scanning? | **`Estados del flujo`** |
| 5 | ¿Copy reemplazo panel escucha? | **`Esperando ingresos`** |
| 6 | ¿Negocio abierto vs Sesión activa? | **Unificar** — solo frase de §11; eliminar "Negocio abierto" |
| 7 | ¿Search instantáneo o debounce? | **Instantáneo**; debounce eval T5 |
| 8 | ¿Button group o tablist? | **Button group** baseline; tablist eval T5 DEFERRED |
| 9 | ¿Borrar dead code T9? | **Sí permitido** en T9 |
| 10 | ¿Estilo visual T3? | **Fila1/Fila2**, clusters lógicos, §17 principles |

---

**Phase T1 — Product Contract complete.**

No se modificó código funcional.  
No se modificó CSS.  
No se modificaron tokens.  
No se requiere tsc/build para esta fase.
