# Board / Orders Execution Area — Product Contract & Scope Freeze

## Objetivo

Congelar el contrato de producto del **Board / Orders Execution Area** antes de implementar B2–B9. B1 define qué representa cada parte del board, qué decisiones quedan diferidas y qué reglas gobiernan las próximas fases — **sin modificar código**.

## Contexto

- **Toolbar** cerrado (T4.2–T10, DEVX-1/2): controles de vista, sesión/sync, search/filters.
- **B0** auditó el board y detectó ambigüedades de producto: context panel atado a `filteredOrders`, empty redundante con `Estados del flujo`, lanes hardcoded, componentes alternativos huérfanos, search local sin URL.
- **B1** resuelve definición; **B2+** implementan.

## Fuentes revisadas

| Documento / código | Uso en B1 |
|--------------------|-----------|
| `docs/board-orders-execution-area-audit.md` | Hallazgos P0–P3, arquitectura, riesgos |
| `docs/admin-dashboard-toolbar-phase-t10.md` | Límites toolbar; integración search/filter/sync |
| `docs/devx-lint-baseline-cleanup.md` | Baseline lint; no bloquea épica board |
| `admin-dashboard-orders.tsx` | Estado actual: empty branching, derivaciones, render |
| `DashboardKanbanBoard.tsx`, `DashboardContextPanel.tsx` | Superficies presentacionales |
| `lane-navigation-scanning.tsx`, `lib/orders/lane-navigation-scanning.ts` | Flow navigation |
| `order-card.tsx` | Contrato actual de card |
| CSS modules board/context/kanban/lanes | Responsive y tokens legacy |
| `lib/orders/delivery-workflow-lanes.ts`, `priority-risk-lanes.ts` | Modelos alternativos no cableados |
| `operational-summaries.ts`, `business-insights.ts`, `operational-feed.ts` | Context panel data |

---

## Decisiones principales

| Tema | Decisión B1 | Fase de implementación |
|------|-------------|------------------------|
| Context panel scope | **Vista actual del Board** con labeling explícito | B3 |
| Empty global | **No** mostrar `Estados del flujo` | B3 |
| Empty sesión/jornada | **No** mostrar flow nav; copy explicativo; context liviano | B3 |
| Empty filtrado/search | Empty filtrado; context refleja 0 resultados o compacto | B3 |
| Flow navigation | Solo si hay lanes reales navegables | B3 / B4 |
| Lanes principal | **Status kanban** (MVP transitorio) | B4 |
| Completed/cancelled | **Decisión diferida** (Opciones A/B/C documentadas) | B4 |
| Alt lane components | Evaluar wire / delete / experimental | B4 |
| Search URL | **Diferido** (local-only mantenido) | B8 o post-B9 |
| Assignment lock | **Requerido** (paridad con status) | B6 |
| DELETE policy | Confirmar con política DB | B6 |
| View model extraction | Permitido sin cambiar UX | B2 |
| Mobile board UX | **Diferido** | B7 |
| Token cleanup | **Diferido** | B8 |
| Tests automatizados | No bloquean B2–B5; mínimo en B6 | B6 / B9 |

---

## Definición del Board

```txt
Board / Orders Execution Area =
zona operativa donde el equipo lee, prioriza y actúa sobre pedidos vivos.
```

El board es el **resultado operativo** de los controles del toolbar aplicados al scope operativo (sesión/jornada + pedidos cargados).

---

## Qué pertenece al Board

| Pertenece | Componentes / superficies |
|-----------|---------------------------|
| Resultado principal | Kanban lanes, filtered list, order cards |
| Estados vacíos operativos | Empty global, empty sesión/jornada, empty filtrado/search |
| Navegación secundaria | `Estados del flujo` (flow navigation) — condicional |
| Contexto secundario | Resumen de la vista, insights operativos, actividad reciente |
| Integración de entrada | Recibe `filteredOrders`, filter state, search state desde container (toolbar controls) |
| Acciones rápidas en card | Cambios de status acotados (sin sustituir modal) |

---

## Qué NO pertenece al Board

| No pertenece | Dónde vive |
|--------------|------------|
| Controles de vista (search, filtros, sync, sesión) | **Toolbar** (cerrado) |
| KPIs ejecutivos compactos | **Top section** (`DashboardOverview` / mobile) |
| Operación profunda (items, notas, assignment completo, timeline) | **Modal / detail** |
| Estado de conexión / sync / stale | **Toolbar** sync indicator |
| Realtime subscription logic | Container hooks (B6 hardening, no UX B3) |
| Server actions / DB | Backend (fuera de épica UI board) |
| Audio unlock / notificaciones globales | Infra notificaciones (container, no board UX) |

**Regla:** el board no absorbe responsabilidades del toolbar ni del top section.

---

## Anatomía del Board

```txt
Board / Orders Execution Area
├─ Flow Navigation / Estados del flujo          [secundario, condicional]
├─ Main Result Area                             [primario]
│  ├─ Kanban lanes (filter = all)
│  ├─ Filtered list (filter ≠ all)
│  ├─ Operational empty (sin pedidos)
│  ├─ Day/session empty (scope sin pedidos)
│  └─ Filter/search empty (subset vacío)
├─ Context Panel                                [secundario]
│  ├─ Resumen de la vista
│  ├─ Insights operativos
│  └─ Actividad reciente
└─ Order Cards                                  [primario, unidad de acción]
   ├─ Estado
   ├─ Cliente / items
   ├─ Método delivery/retiro
   ├─ Assignment
   ├─ Riesgo / prioridad
   ├─ Elapsed / last activity
   └─ Acciones rápidas
```

### Jerarquía de atención

| Nivel | Elementos |
|-------|-----------|
| **Primario** | Lanes, cards, empty principal del resultado |
| **Secundario** | Flow navigation, context panel, activity feed |
| **Profundo** | Modal / detail (fuera del board surface) |

---

## Scope del Context Panel

### Decisión B1 (aceptada)

**El Context Panel refleja la vista actual del Board** — el mismo subconjunto que el operador ve en lanes/list, derivado de scope operativo + `activeFilter` + `searchQuery`.

**No** se adopta la alternativa “siempre scope operativo completo ignorando filter/search”, porque contradice la vista visible y genera desconfianza operativa.

### Comunicación en UI (contrato B3)

| Condición | Título sugerido | Subtítulo / contexto |
|-----------|-----------------|------------------------|
| Sin filtro ni search | **Resumen de la vista** | Pedidos dentro de la sesión/jornada actual |
| Solo filtro activo | **Resumen de la vista** | Vista filtrada por {filterLabel} |
| Solo search activo | **Resumen de la vista** | Resultados de búsqueda |
| Filtro + search | **Resumen de la vista** | Vista filtrada + búsqueda |

**Regla:** nunca debe leerse como resumen global del negocio cuando refleja un subconjunto.

### Comportamiento por empty (B3)

| Empty type | Context panel |
|------------|---------------|
| Global / day-session | Ocultar o **compactar** — no métricas vacías confusas |
| Filter/search empty | Reflejar **0 resultados** de la vista actual o compactar |

### Estado actual vs contrato

Hoy el panel deriva de `filteredOrders` pero **sin labeling** — operadores pueden malinterpretar KPIs. B3 implementa copy/estructura; B1 congela la semántica.

---

## Empty States Contract

### 1. Empty operacional global

**Condición:** `optimisticOrders.length === 0` — no hay pedidos cargados en absoluto.

**UI contrato:**

- **No** mostrar `Estados del flujo`
- Mostrar empty principal con copy “Todavía no hay pedidos”
- CTA: Ver catálogo / Gestionar productos (según permisos)
- Context panel: ocultar o compactar

### 2. Empty por sesión/jornada

**Condición:** hay pedidos en sistema pero ninguno dentro del scope operativo actual (sesión activa o jornada).

**UI contrato:**

- **No** mostrar `Estados del flujo` (no hay lanes reales)
- Copy: sesión activa vs jornada actual (según `operationalWindow.source`)
- Context panel: estado liviano, sin strips vacíos que parezcan errores

### 3. Empty filtrado / search

**Condición:** hay pedidos en scope operativo pero filter/search no devuelve resultados.

**UI contrato:**

- **No** ocultar toolbar ni controles
- Mostrar empty filtrado dedicado
- CTA: limpiar búsqueda o volver a “Todos”
- Context panel: 0 resultados de vista actual o compacto

### Regla transversal (congelada)

```txt
Estados del flujo sólo aparece si hay lanes/cards navegables reales.
```

**No** en empty global ni day/session empty.

**Estado actual (deuda):** empty operacional renderiza shell `Estados del flujo` vacío — **viola contrato**; fix en B3.

---

## Flow Navigation Contract

### Definición

```txt
Estados del flujo = navegación secundaria del resultado operativo.
```

**No** comunica: conexión, sync, freshness, realtime (toolbar).

### Cuándo aparece

| Condición | Requerido |
|-----------|-----------|
| `activeFilter === "all"` | Sí |
| Al menos una lane con pedidos | Sí |
| Más de una lane visible **o** scroll horizontal significativo del kanban | Sí (al menos una) |

### Cuándo NO aparece

| Condición | Ocultar |
|-----------|---------|
| Board empty (global / day-session) | Sí |
| Vista filtered list (filter ≠ all) | Sí |
| Una sola lane visible y sin valor de salto | Sí (evaluar en B4) |

### Función

- Saltar entre lanes visibles (`scrollIntoView`)
- Mostrar conteo por lane
- Opcional: foco sugerido por rol (modelo actual en `lane-navigation-scanning.ts`)

**Implementación:** visibilidad en B3; refinamiento de reglas “una lane” en B4.

---

## Lanes / Workflow Contract

### MVP transitorio (hasta B4)

**Modelo principal:** Kanban por **status**.

| Lane | Rol |
|------|-----|
| `pending` | Core — flujo vivo |
| `preparing` | Core — flujo vivo |
| `ready` | Core — flujo vivo |
| `completed` | Secondary — histórico reciente en sesión |
| `cancelled` | Secondary — histórico reciente en sesión |

Lanes se muestran solo si tienen pedidos (comportamiento actual).

### Completed / cancelled — decisión diferida (B4)

| Opción | Descripción | Trade-off |
|--------|-------------|-----------|
| **A** | Mantener como lanes si tienen pedidos | Menor cambio; compite con flujo vivo |
| **B** | Colapsar en sección secundaria | Más limpio; requiere IA visual |
| **C** | Ocultar del kanban; acceso vía filtros/search | Máximo foco operativo; menos visibilidad de cerrados |

**B1:** no implementar. **B4** elige con input operativo.

### Filtros delivery/retiro

- **No** son lanes del kanban
- Cambian a **filtered list** + lane metrics
- Contrato alineado con toolbar (cerrado)

### Modelos alternativos

| Módulo | Estado B1 |
|--------|-----------|
| `DeliveryWorkflowLanes` | No cableado — **experimental / B4** |
| `PriorityRiskLanes` | No cableado — **experimental / B4** |

**B1:** no borrar, no cablear. B4 decide: integrar, documentar como experimento, o eliminar.

---

## Order Cards Contract

B1 no rediseña cards (B5). Define obligaciones.

### Preguntas que la card debe responder (< 3 s)

- ¿Qué pedido es?
- ¿Quién es el cliente?
- ¿Qué hay que hacer ahora?
- ¿Qué tan urgente/riesgoso es?
- ¿Quién lo tiene asignado?
- ¿Es delivery o retiro?
- ¿Cuál es el próximo paso?

### Información

| Prioridad | Campos |
|-----------|--------|
| **Primaria** | customer, status, item summary, delivery/pickup, assignment, risk/priority, elapsed/last activity, quick action |
| **Secundaria** | notes preview, total, item count, timeline compacta |

### Acciones

| Tipo | Contrato |
|------|----------|
| **Primaria** | Abrir workspace/modal del pedido (click card / Enter / Space) |
| **Rápidas** | Cambios de status seguros y acotados por estado actual (sin nuevos botones en B1) |

**B5** decide: jerarquía visual, mobile density, risk priority, duplicación con modal.

---

## Search / Filters Integration Contract

Toolbar cerrado; board consume outputs del container.

| Control | Contrato |
|---------|----------|
| `activeFilter` | Persistido en URL `?filter=`; cambia board + context (vista actual) |
| `searchQuery` | **Local-only** en esta épica; cambia board + context (vista actual) |

### Search en URL

| Decisión | Detalle |
|----------|---------|
| **No implementar** en B1, B2, B3 | Evita reabrir toolbar/routing |
| **Evaluar** en B8 o post-B9 | Solo si producto lo exige |

### Interacciones preservadas (de toolbar T10)

- Manual operational sync **no** resetea search/filter
- Session open/close cambia scope operativo (`visibleOperationalOrders`), no URL filter
- Offline/stale sync state **no** es estado del board

---

## Realtime / Hydration Contract

Congelado; implementación/hardening en B6.

```txt
Realtime           = vía principal de convergencia
Manual sync T4.7   = fallback / reconciliación explícita
Silent refresh     = recovery (reconnect | visibility | online | conflict)
Optimistic UX      = respuesta inmediata del operador
Server / DB        = fuente final de verdad
```

### Reglas

| Regla | Obligatorio |
|-------|-------------|
| Manual sync no reemplaza realtime | Sí |
| Manual sync no resetea search/filter | Sí |
| Silent refresh preserva optimistic pending (status) | Sí |
| Realtime echo de mutación propia no pisa optimistic | Sí |
| Assignment: protección similar a status | B6 |
| DELETE policy confirmada con DB | B6 |

### Silent refresh reasons (referencia)

`reconnect`, `visibility`, `online`, `conflict`, `manual-operational-resync` (bypass cooldown).

Endpoint: `GET /admin/dashboard/orders`.

---

## Optimistic UX Contract

| Acción | Optimistic | Pending lock | Rollback |
|--------|------------|--------------|----------|
| Status change (card/modal) | Sí | Sí (hoy) | Sí |
| Assignment (modal) | Sí | **No (hoy — fix B6)** | Sí |

**B6:** assignment lock + tests/checklist.

---

## Responsive Contract

Congelado; implementación B7.

| Viewport | Contrato |
|----------|----------|
| **Desktop 1366+** | Kanban horizontal aceptado; context panel integrado visualmente al board |
| **Tablet** | Kanban puede mantener scroll horizontal; context legible; flow nav solo si aporta |
| **Mobile** | Cards legibles y táctiles; lanes 320px = deuda conocida; empty sin nav redundante; context compacto o reubicado |

---

## Tokens / CSS Contract

| Regla | Alcance |
|-------|---------|
| No introducir nuevos colores hardcoded en fases board | B3–B7 |
| Nuevas superficies usan tokens existentes (`var(--...)`) | B3+ |
| Migración CSS legacy | **B8** |

### Módulos legacy (referencia B0)

- `dashboard-filters.module.css`
- `delivery-workflow-lanes.module.css`
- `dashboard-analytics-surfaces.module.css`
- `dashboard-kanban.module.css` (parcial: rgba, min-width)

**B3/B4:** CSS mínimo solo dentro de su scope (empty/context/flow nav/lanes).

---

## Testing / QA Contract

| Regla | Detalle |
|-------|---------|
| B1–B5 | No bloqueados por ausencia de tests |
| B6 | Introducir cobertura mínima **o** checklist fuerte realtime/optimistic |
| B9 | QA final board completo |

### QA manual obligatoria (fases futuras)

- [ ] Status optimistic + rollback
- [ ] Assignment optimistic + race (post-B6)
- [ ] Realtime insert/update
- [ ] Manual sync preserving search/filter
- [ ] Empty states (3 niveles)
- [ ] Flow navigation hidden/shown
- [ ] Card modal open during silent refresh
- [ ] Mobile card actions
- [ ] Context panel labeling por filter/search

---

## Decisiones diferidas

| Tema | Fase | Notas |
|------|------|-------|
| Completed/cancelled lane IA | B4 | Opciones A/B/C |
| Alt lane components | B4 | Wire / delete / experimental |
| Search URL persistence | B8+ | Requiere acuerdo producto + toolbar |
| Assignment realtime lock | B6 | Paridad con status |
| DELETE realtime handler | B6 | Depende política DB |
| Card visual hierarchy | B5 | Density, mobile, risk |
| Mobile/tablet board layout | B7 | Context placement, lane width |
| Token migration | B8 | Legacy CSS modules |
| Virtualización listas | B8+ | Si volumen crece |

---

## Riesgos aceptados (transitorios hasta implementación)

1. Context panel sin labeling — misinterpretación de KPIs (**mitigación B3**)
2. Empty muestra `Estados del flujo` vacío — ruido UX (**mitigación B3**)
3. Assignment sin pending lock — race realtime (**mitigación B6**)
4. Kanban 320px lanes en mobile — scroll denso (**mitigación B7**)
5. Container monolítico — regresiones (**mitigación B2**)
6. Cero tests — regresiones silenciosas (**mitigación B6/B9**)

---

## Reglas para próximas fases

| Fase | Permitido | Prohibido |
|------|-----------|-----------|
| **B2** | Extraer view model/hooks; reducir container | Cambiar UX visible |
| **B3** | Empty/context/flow nav visibility; labeling context | Cambiar lanes/cards |
| **B4** | Lanes IA; completed/cancelled; alt components | Cambiar cards/modal |
| **B5** | Cards UX operacional | Cambiar realtime/lanes IA |
| **B6** | Realtime/hydration/optimistic hardening; tests mínimos | Rediseño board layout |
| **B7** | Mobile/tablet board | Reabrir toolbar |
| **B8** | Tokens/a11y/performance; evaluar search URL | Cambiar contrato B1 sin revisión |
| **B9** | QA final | Nuevas features |

**Global:** no reabrir toolbar ni top section sin épica explícita.

---

## Roadmap actualizado

```txt
B0 ✅ Forensic audit
B1 ✅ Product contract & scope freeze (este documento)
B2 → View model boundary + hook extraction (sin UX change)
B3 → Empty + context panel integration + flow nav visibility
B4 → Lanes IA: completed/cancelled + alt components decision
B5 → Order cards operational UX pass
B6 → Realtime / hydration / optimistic hardening + QA/tests mínimos
B7 → Mobile / tablet board UX
B8 → Tokens / accessibility / performance (+ search URL eval)
B9 → Final QA
```

---

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | **Pass** |
| `npx tsc --noEmit` | **Pass** (post-build) |
| `npm run lint` | **Pass with warnings** — 0 errors / 16 warnings (`@next/next/no-img-element`) |

No se modificó código en B1.

---

## Próxima fase recomendada

**B2 — Board View Model Boundary**

Extraer derivaciones del board (`filteredOrders`, empty flags, context scope labels, flow nav visibility inputs) a view model/hooks **sin cambiar UX**, preparando B3 para implementar contrato empty/context/flow nav con diff acotado.
