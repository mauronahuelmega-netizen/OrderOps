# Admin Dashboard Toolbar Session / Sync Audit

## 1. Executive Summary

Phase **T4.1** audita tres problemas de QA post-T4 en el `Dashboard Execution Toolbar` de `/admin/dashboard`:

1. **Scope label redundante** bajo `Pedidos en curso` (`Sesión activa · desde HH:MM`) que duplica el cluster de sesión y puede contradecirlo.
2. **Sync button demasiado protagónico** (`Sincronizar sesión` / `Sincronizando sesión...` como texto permanente) sin modelo de estado `synced/stale/error`.
3. **Hora de sesión potencialmente incorrecta** porque el label mezcla fuentes distintas (`store_sessions.opened_at` vs `on_demand_mode_active`) y el toolbar **no usa** las server actions que crean/cierran filas en `store_sessions`.

**Hallazgo crítico:** Abrir/cerrar sesión en el toolbar ejecuta `toggleBusinessStatus` → RPC `set_business_on_demand_status`, que **solo** actualiza `business_settings.on_demand_mode_active`. **No** inserta/cierra filas en `store_sessions`. Existen `openStoreSession` / `closeStoreSession` en `lib/store-sessions/admin.ts` y actions dedicadas, pero **no están cableadas** al toolbar.

**Recomendación principal:** Unificar fuente de verdad de sesión operativa; eliminar `scopeLabel` del `titleCluster`; introducir indicador sync icon-only con estados derivados; reconciliar open/close con `store_sessions.opened_at` real (T4.4).

**Esta fase no modificó código, CSS ni tokens.**

---

## 2. Reported QA Issues

| # | Observación QA | Impacto |
|---|----------------|---------|
| A | Bajo `Pedidos en curso` aparece `Sesión activa · desde 00:36` sin acción directa; duplica top section / cluster derecho; puede decir sesión activa mientras el cluster dice `Sin sesión activa`. | Confusión operacional, falta de confianza en el estado. |
| B | `Sincronizando sesión...` como label visible permanente durante hydrate; sync se siente como CTA textual pesado, no indicador sutil. | Ruido visual; affordance ambigua (¿está roto? ¿debo esperar?). |
| C | `desde 00:36` no parece la hora real de apertura desde DB; posible mock, fallback o confusión duración vs hora. | Datos no confiables para el operador. |

---

## 3. Scope Audited

- Presentación: `scopeLabel`, `sessionStatusLabel`, sync labels, `DashboardToolbar` layout T3/T6.1.
- Derivación: `operationalWindowLabel`, `getOperationalWindow`, `formatSessionStartLabel`.
- Estado client: `activeStoreSessionState`, `onDemandModeActive`, `isStoreSessionHydrating`, `storeSessionError`.
- Hydration/realtime: `hydrateStoreSession`, `useAdminStoreSessionRealtime`, `getActiveStoreSessionHydrationAction`.
- Server: `toggleBusinessStatus`, `openStoreSessionAction`, `closeStoreSessionAction`, `getActiveStoreSession`.
- DB: `store_sessions` (`opened_at`, `closed_at`, `status`), `business_settings.on_demand_mode_active`.
- Top section macro label (`Sesión activa` / `Jornada actual`) vía `dashboard-top-section-view-model.ts`.

**Fuera de scope T4.1:** search, filtros, scanning, empty/context T7, order cards/modal, CSS changes.

---

## 4. Files Audited

| Archivo | Rol |
|---------|-----|
| `lib/orders/dashboard-execution-view-model.ts` | Copy y lógica presentacional toolbar (`scopeLabel`, `sessionStatusLabel`, sync labels). |
| `components/admin/orders/DashboardToolbar.tsx` | Render `titleCluster.scopeLabel`, `sessionCluster`, sync button (`RefreshCw` + span). |
| `components/admin/orders/dashboard-toolbar.module.css` | Layout sync button (`.syncButton`, `.syncIconSpinning`). |
| `components/admin/orders/admin-dashboard-orders.tsx` | Fuente de datos, handlers, `operationalWindowLabel`, open/close/hydrate. |
| `lib/orders/analytics.ts` | `StoreSession`, `getOperationalWindow`, `OperationalWindow`. |
| `lib/orders/dashboard-top-section-view-model.ts` | Macro `sessionLabel` top section. |
| `app/admin/(protected)/dashboard/actions.ts` | `toggleBusinessStatus`, hydration, open/close actions (no usadas por toolbar handlers). |
| `lib/store-sessions/admin.ts` | CRUD `store_sessions`, `getActiveStoreSession`. |
| `components/admin/orders/use-admin-store-session-realtime.ts` | Realtime + interval hydration + payload fallback. |
| `app/admin/(protected)/dashboard/page.tsx` | SSR `initialActiveStoreSession`. |
| `supabase/migrations/20260604143000_v63_store_sessions.sql` | Schema `store_sessions`. |
| `supabase/migrations/20260608150000_rpc_set_business_on_demand_status.sql` | RPC usada por toolbar open/close. |
| `types/database.ts` | Tipos `store_sessions`, `business_settings`. |
| Docs T0–T6, T6.1 | Contrato y fases previas. |

**Lucide en repo:** `RefreshCw` usado en `DashboardToolbar.tsx`. `RefreshCcw` y `RefreshCwOff` **no** importados en el proyecto hoy; disponibles en `lucide-react` (misma librería que `RefreshCw`, `Moon`, `Sun`, etc.).

---

## 5. Current Session Label Flow

```
SSR page.tsx
  └─ getActiveStoreSession(businessId)
       └─ initialActiveStoreSession → activeStoreSessionState

useAdminBusinessSettings()
  └─ on_demand_mode_active → onDemandModeActive (state + effect sync)

getOperationalWindow(liveOperationalNow, BUSINESS_WINDOW_CONFIG, activeStoreSessionState)
  ├─ if activeStoreSession open → source: "store-session", start = openedAt (DB)
  └─ else → source: "business-window", start/end = jornada config

operationalWindowLabel (admin-dashboard-orders.tsx)
  ├─ store-session → formatSessionStartLabel(start)
  │     → "Sesión activa · desde HH:MM" (toLocaleTimeString es-AR, 24h)
  └─ business-window → "Jornada actual · HH:MM–HH:MM"

buildDashboardExecutionToolbarViewModel(...)
  ├─ scopeLabel = operationalWindowLabel          → titleCluster (siempre)
  └─ sessionStatusLabel:
        ├─ onDemandModeActive → operationalWindowLabel
        ├─ !onDemand && canManage → "Sin sesión activa"
        └─ !onDemand && !canManage → operationalWindowLabel (jornada)
```

**Render:**

| Ubicación | Campo | Fuente |
|-----------|-------|--------|
| Título `Pedidos en curso` (debajo) | `viewModel.scopeLabel` | `operationalWindowLabel` ← `activeStoreSessionState` |
| Cluster derecho | `viewModel.sessionStatusLabel` | Mezcla `onDemandModeActive` + `operationalWindowLabel` |
| Top section meta | `sessionLabel` | `operationalWindow.source === "store-session"` → `"Sesión activa"` / `"Jornada actual"` |

**Respuestas auditoría Problema A:**

| Pregunta | Respuesta |
|----------|-----------|
| ¿De dónde sale `scopeLabel`? | `operationalWindowLabel` vía view model (`scopeLabel: input.operationalWindowLabel`). |
| ¿Misma fuente que `sessionStatusLabel`? | **Parcialmente.** Ambos usan `operationalWindowLabel` cuando sesión/jornada aplica, pero `sessionStatusLabel` también depende de `onDemandModeActive` (puede forzar `"Sin sesión activa"`). |
| ¿Puede quedar stale? | Sí: `activeStoreSessionState` puede desincronizarse de `onDemandModeActive` tras toggle sin hydration inmediata o con fila `store_sessions` huérfana abierta. |
| ¿Se muestra sin sesión activa real? | Sí: si hay fila `store_sessions` abierta pero `onDemandModeActive === false`, `scopeLabel` puede mostrar sesión activa mientras cluster muestra `Sin sesión activa`. |
| ¿Eliminar del titleCluster? | **Recomendado sí** (T4.2). |
| ¿Ocultar cuando `sessionStatusLabel` informa? | **Recomendado sí** — una sola frase en cluster derecho. |
| ¿Depender estrictamente de active store session? | Hoy `scopeLabel` ya depende de `activeStoreSessionState`, no de `onDemandModeActive`; el cluster usa `onDemandModeActive` → **inconsistencia de reglas**. |

---

## 6. Current Sync Flow

```
Click sync → handleManualStoreSessionResync
  └─ setStoreSessionError(null)
  └─ hydrateStoreSession("manual-resync")
        ├─ setIsStoreSessionHydrating(true)
        ├─ getActiveStoreSessionHydrationAction() → getActiveStoreSession
        ├─ setActiveStoreSessionState(result.session)
        └─ finally setIsStoreSessionHydrating(false)

Triggers adicionales (use-admin-store-session-realtime.ts):
  realtime INSERT/UPDATE, focus, visibility, interval 60s, pageshow, online, resume
  (throttled; manual-resync bypasses interactive throttle)
```

**Estado expuesto al view model:**

| Estado | Existe | Uso UI actual |
|--------|--------|----------------|
| `isStoreSessionHydrating` | Sí | `isSyncingSession`; disabled sync; label `Sincronizando sesión...`; spin icon |
| `storeSessionError` | Sí | Alert `<p>` bajo toolbar (open/close errors); **no** seteado por fallo de hydrate |
| `lastStoreSessionHydratedAt` | **No** | — |
| `lastSynced` / `lastHydrated` | **No** | — |
| `storeSessionLastEventAt` | **No** | — |
| `synced` / `stale` / `error` enum | **No** | Solo boolean hydrating + error string opcional |

**View model sync copy (T4):**

```ts
syncSessionLabel = isStoreSessionHydrating ? "Sincronizando sesión..." : "Sincronizar sesión";
syncSessionAriaLabel = isStoreSessionHydrating ? "Sincronizando sesión" : "Sincronizar sesión";
```

**UI:** `DashboardToolbar` renderiza `<RefreshCw />` + `<span>{syncSessionLabel}</span>` — texto siempre visible.

**Hydrate failure:** `catch` en `hydrateStoreSession` solo loguea en dev; **no** actualiza `storeSessionError` ni estado stale.

**Throttle:** hydrate puede retornar `false` sin cambiar UI (usuario no ve por qué no sincronizó).

---

## 7. Current Store Session Timestamp Flow

**DB (`store_sessions`):**

| Campo | Tipo | Uso |
|-------|------|-----|
| `opened_at` | `timestamptz NOT NULL DEFAULT now()` | **Fuente de verdad** para inicio de sesión en código |
| `closed_at` | `timestamptz` nullable | Cierre |
| `status` | `'open' \| 'closed'` | Filtro sesión activa |
| `opened_by` / `closed_by` | uuid | Auditoría |
| **No existe** `started_at` | — | — |

**Client type (`StoreSession`):** `openedAt: string | Date` mapeado desde `opened_at`.

**Label time:**

```ts
formatSessionStartLabel(start: Date) {
  return `Sesión activa · desde ${start.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", hour12: false
  })}`;
}
```

- **Semántica actual:** hora de reloj de apertura (`desde HH:MM`), **no** duración transcurrida (`hace 36 min`) ni elapsed compacto (`Activa · 00:36`).
- **`start`** = `new Date(activeStoreSession.openedAt)` cuando `getOperationalWindow` usa store-session.
- **No hay interval** que actualice el label de hora; `now` tick cada 60s (`LIVE_PRESSURE_TICK_MS`) recalcula `liveOperationalNow` / window end, **no** reformatea la hora mostrada salvo cambio de sesión.

**Por qué QA ve `00:36` “incorrecto”:**

| Hipótesis | Evidencia |
|-----------|-----------|
| Hora real DB pero confundida con duración | Copy dice `desde HH:MM` (hora), operador puede leer como elapsed. |
| Sesión DB antigua aún `open` | Open toolbar no crea sesión nueva; `getActiveStoreSession` devuelve última fila open → `opened_at` de sesión previa. |
| Toggle on-demand sin fila nueva | `toggleBusinessStatus` no escribe `store_sessions`; label puede reflejar sesión residual o jornada. |
| Fallback jornada | Muestra `Jornada actual · 00:00–24:00` (DEFAULT_BUSINESS_WINDOW), no `00:36`. |
| Timezone | `opened_at` timestamptz → `toLocaleTimeString("es-AR")` convierte a local; posible shift si QA compara con UTC manual. |

**Open/close toolbar vs DB session:**

| Acción UI | Handler | Efecto DB sesión | Efecto on-demand flag |
|-----------|---------|------------------|------------------------|
| Abrir sesión | `toggleBusinessStatus(true)` | **Ninguno** en `store_sessions` | `on_demand_mode_active = true` |
| Cerrar sesión | `toggleBusinessStatus(false)` | **Ninguno** en `store_sessions` | `on_demand_mode_active = false` |
| Acciones disponibles no usadas | `openStoreSessionAction` / `closeStoreSessionAction` | Insert/update `store_sessions` + sync flag | Sí |

---

## 8. Data Source Map

| UI text/state | Current source | File | Derived from | Problem | Recommendation |
|---------------|----------------|------|--------------|---------|----------------|
| `scopeLabel` bajo título | `operationalWindowLabel` | `dashboard-execution-view-model.ts` → `DashboardToolbar.tsx` | `activeStoreSessionState` → `getOperationalWindow` → `formatSessionStartLabel` o jornada | Duplica cluster; puede contradecir `onDemandModeActive` | **T4.2:** eliminar render en `titleCluster`; opcional jornada-only si se mantiene scope macro |
| `sessionStatusLabel` cluster | View model branches | `dashboard-execution-view-model.ts` | `onDemandModeActive` + `operationalWindowLabel` | Reglas distintas a `scopeLabel`; `Sin sesión activa` vs scope con sesión DB | **T4.2/T4.4:** una regla unificada basada en sesión reconciliada |
| Open button label | View model | `dashboard-execution-view-model.ts` | `pendingStoreSessionAction` | OK copy | Preservar |
| Close button label | View model | idem | idem | OK copy | Preservar |
| Sync label visible | `isStoreSessionHydrating` | `dashboard-execution-view-model.ts` | Hydrate in-flight only | Texto protagónico; no distingue synced/stale/error | **T4.3:** icon-only + tooltip; ocultar span en idle |
| Sync pending state | `isStoreSessionHydrating` | `admin-dashboard-orders.tsx` | `hydrateStoreSession` | Solo syncing; no stale | **T4.3:** extender view model |
| Sync error state | `storeSessionError` | Container + toolbar alert | Open/close `toggleBusinessStatus` errors | Hydrate errors no surfaced; no icon state | **T4.3:** mapear hydrate failure a ERROR/STALE |
| Active session object | `activeStoreSessionState` | `admin-dashboard-orders.tsx` | SSR + hydrate + realtime fallback | Desincronizado de toggle on-demand | **T4.4:** alinear open/close con `store_sessions` |
| Session start/open timestamp | `store_sessions.opened_at` | `lib/store-sessions/admin.ts` → analytics | DB timestamptz | Toolbar open no crea fila; label puede ser stale/wrong session | **T4.4:** usar `opened_at` de sesión vinculada al toggle actual |
| Top section `sessionLabel` | `operationalWindow.source` | `dashboard-top-section-view-model.ts` | Misma window que toolbar scope | Macro duplicado (aceptable en top) | No mover en T4.2; documentar jerarquía |

---

## 9. Root Cause Hypothesis

### A — Scope label redundancy

| Tag | Aplica | Justificación |
|-----|--------|---------------|
| **DUPLICATED_SCOPE_LABEL** | Sí | T4 asignó `scopeLabel` y `sessionStatusLabel` el mismo `operationalWindowLabel` cuando `onDemandModeActive`; T3 colocó scope en `titleCluster`. |
| **MIXED_WINDOW_AND_SESSION_STATE** | Sí | `scopeLabel` sigue `activeStoreSessionState`; `sessionStatusLabel` sigue `onDemandModeActive` → contradicción posible. |
| **STALE_SCOPE_SOURCE** | Sí | Hydration/realtime async; toggle no actualiza `activeStoreSessionState` inmediatamente (solo `router.refresh` en open/close). |
| UNKNOWN | Parcial | — |

### B — Sync indicator

| Tag | Aplica | Justificación |
|-----|--------|---------------|
| **MISLEADING_VISIBLE_LABEL** | Sí | T4 añadió span con `Sincronizar sesión` / `Sincronizando sesión...` siempre visible. |
| **NO_SYNC_STATE_MODEL** | Sí | Solo `isStoreSessionHydrating`; no `lastHydratedAt`, synced/stale. |
| **MISSING_STALE_STATE** | Sí | Throttled/failed hydrate invisible al operador. |
| **ICON_AFFORDANCE_GAP** | Sí | Un solo icono `RefreshCw`; sin `RefreshCwOff` / dot / tooltip diferenciado. |

### C — Session start time

| Tag | Aplica | Justificación |
|-----|--------|---------------|
| **WRONG_SOURCE_FIELD** | Parcial | Campo correcto es `opened_at`, pero **sesión mostrada puede no ser la del toggle actual**. |
| **MOCK_OR_FALLBACK_LABEL** | No literal mock | No hay mock; hay **desalineación** toggle vs `store_sessions`. |
| **HYDRATION_DATA_MISSING** | Sí | Tras abrir, `onDemandModeActive` true pero `activeStoreSessionState` puede seguir null/hasta refresh/hydrate. |
| **TIMEZONE_FORMATTING_ISSUE** | Posible | `toLocaleTimeString("es-AR")` vs expectativa manual del operador. |
| UNKNOWN | Parcial | Confusión semántica `desde HH:MM` (hora) vs duración (`00:36` elapsed). |

**Clasificación copy time:** El producto muestra **hora de apertura**, no duración. QA que espera “hace 36 min” o hora de click actual indica **gap de producto + wiring**, no necesariamente bug de formato solo.

---

## 10. Product Decisions Recommended

### Scope label

**Recomendación:** Eliminar `scopeLabel` visible bajo `Pedidos en curso` en desktop y mobile.

- Mantener **una sola frase de estado operativo** en el **cluster derecho** (`sessionStatusLabel`).
- Top section conserva macro `Sesión activa` / `Jornada actual` (Nivel 1); no duplicar en toolbar título (Nivel 3).
- **Alternativa documentada:** Mostrar scope bajo título **solo** cuando `operationalWindow.source === "business-window"` y no hay controles de sesión — útil para operadores sin permiso. Requiere regla explícita en view model; preferencia menor vs eliminar siempre.

### Sync indicator

**Recomendación:** Convertir sync en control **icon-only compacto** con tooltip/aria; quitar span visible en estado idle/synced.

| Estado | Icono (lucide) | Dot | Tooltip (orientativo) |
|--------|----------------|-----|------------------------|
| SYNCED | `RefreshCcw` | verde estable / breathing CSS | “Sesión sincronizada. Click para actualizar manualmente.” |
| SYNCING | `RefreshCcw` + spin | azul/verde breathing | “Sincronizando sesión...” |
| STALE | `RefreshCwOff` | ámbar/gris | “No se pudo confirmar la sincronización. Click para actualizar manualmente.” |
| ERROR | `RefreshCwOff` | rojo/ámbar | “No se pudo sincronizar la sesión. Click para reintentar.” |

**STALE hoy:** No determinable con precisión — requiere `lastSuccessfulHydrationAt` + opcional comparación con realtime event time (**T4.3**). Diferir STALE automático si no hay señal; ERROR solo cuando `storeSessionError` o hydrate `ok: false` explícito.

**Lucide:** `RefreshCcw`, `RefreshCwOff`, `RefreshCw` disponibles en `lucide-react` (proyecto ya usa la librería).

### Time label

**Recomendación:**

1. **Producto:** Congelar semántica — **hora de apertura real** (`Sesión activa · desde 12:36`), no duración, salvo decisión explícita contraria en T4.4.
2. **Técnica:** Fuente = `store_sessions.opened_at` de la sesión **activa reconciliada** con `on_demand_mode_active`.
3. **T4.4:** Cablear toolbar open/close a `openStoreSession` / `closeStoreSession` (o RPC unificada) en lugar de solo `toggleBusinessStatus`, **o** documentar fallback cuando tabla ausente.
4. Tras open exitoso: actualizar `activeStoreSessionState` desde respuesta action + hydrate, no solo `setOnDemandModeActive(true)`.

---

## 11. Proposed Fix Plan

### T4.2 — Remove Redundant Scope Label

**Objetivo:** Eliminar duplicación visual; una frase de estado en cluster derecho.

**Archivos probables:** `DashboardToolbar.tsx`, `dashboard-execution-view-model.ts` (opcional: dejar `scopeLabel` derivado pero no renderizado, o condicionar).

**Cambios permitidos:** Ocultar/eliminar render `scopeIndicator` en `titleCluster`; ajustar CSS spacing T3 si queda gap vacío.

**Qué NO tocar:** Handlers, filtros, search, session open/close semantics (aún).

**Validaciones:** tsc, build, QA visual desktop/mobile, verificar cluster sigue mostrando estado.

**Riesgos:** Operadores sin permiso pierden scope bajo título — mitigar mostrando jornada en cluster (ya existe rama).

**Criterios de aceptación:** No aparece `Sesión activa · desde…` bajo título; cluster único para estado; sin contradicción scope vs cluster en escenario desincronizado (mejora parcial hasta T4.4).

---

### T4.3 — Manual Sync Indicator Model

**Objetivo:** Sync icon-only con estados synced/syncing/stale/error; tooltips; sin label permanente.

**Archivos probables:** `dashboard-execution-view-model.ts`, `DashboardToolbar.tsx`, `dashboard-toolbar.module.css`, `admin-dashboard-orders.tsx` (tracking `lastSuccessfulHydrationAt`, hydrate errors).

**Cambios permitidos:** Nuevos campos view model (`syncVisualState`, `syncTooltip`, icon kind); CSS dot/spin; aria-label por estado.

**Qué NO tocar:** `hydrateStoreSession` behavior core (solo exponer resultado); no refetch orders.

**Validaciones:** Manual sync click; throttle visible como stale opcional; `prefers-reduced-motion`; focus-visible.

**Riesgos:** STALE heurístico sin timestamp fiable; empezar con SYNCED/SYNCING/ERROR mínimo.

**Criterios de aceptación:** No span `Sincronizar sesión` en idle; icon cambia en error; spin solo syncing; tooltip accesible.

---

### T4.4 — Real Store Session Start Time Reconciliation

**Objetivo:** Hora `desde HH:MM` refleje apertura real y estado coherente con toggle.

**Archivos probables:** `admin-dashboard-orders.tsx` (handlers → `openStoreSessionAction`/`closeStoreSessionAction` o wrapper unificado), `actions.ts`, `dashboard-execution-view-model.ts`, posible migración/RPC si se unifica on-demand + session row.

**Cambios permitidos:** Wiring server actions; actualizar state post-action; reglas unificadas `sessionStatusLabel`; documentar fallback si `store_sessions` missing.

**Qué NO tocar:** Search/filtros/scanning; top section analytics scope.

**Validaciones:** Abrir sesión → nueva fila `opened_at` ≈ now; cerrar → fila closed; label actualizado; reload consistente.

**Riesgos:** Breaking change si negocios dependían de toggle sin tabla; migración no aplicada.

**Criterios de aceptación:** `opened_at` visible coincide con DB; `onDemandModeActive` y `activeStoreSessionState` alineados; no `Sin sesión activa` + scope sesión activa simultáneo.

---

### T4.5 — QA Session/Sync Final Pass

**Objetivo:** QA checklist completo post T4.2–T4.4; regresión toolbar/T6/T6.1.

**Archivos probables:** docs QA; ningún código salvo fixes menores.

**Validaciones:** Desktop 1366+, wide, tablet, mobile; consola sin errores; realtime hydration; open/close confirm dialog.

**Criterios de aceptación:** Checklist §16 T4.1 equivalente verde; documentar known limits.

---

## 12. Accessibility Considerations

| Tema | Estado actual | Recomendación T4.3 |
|------|---------------|---------------------|
| aria-label sync | `Sincronizar sesión` / `Sincronizando sesión` | Mantener por estado; icon-only **requiere** aria-label completo |
| title/tooltip | `title={syncSessionTitle}` | Tooltip nativo o componente accesible; no depender solo de color dot |
| icon-only name | Span visible hoy provee nombre accesible redundante | Al quitar span, aria-label obligatorio |
| disabled/pending | Disabled while hydrating | Preservar; anunciar syncing en aria-live opcional (bajo prioridad) |
| color not sole indicator | Dot propuesto | Dot + icon shape change (`RefreshCwOff`) |
| focus-visible | Existe en filtros/search T5 | Añadir/verificar en sync icon button |
| reduced motion | `syncIconSpinning` respeta `prefers-reduced-motion` | Igual para breathing dot CSS |

---

## 13. Performance Considerations

| Tema | Estado actual | Recomendación |
|------|---------------|---------------|
| Interval `now` | `LIVE_PRESSURE_TICK_MS` = 60s | No añadir tick para label hora; hora estática OK |
| Re-renders hydrate | `setIsStoreSessionHydrating` toggle | Aceptable; evitar state granular excesivo |
| Breathing dot | No existe | CSS-only animation; `@media (prefers-reduced-motion: reduce) { animation: none }` |
| Hydration interval | 60s + realtime | STALE puede usar `lastSuccessfulHydrationAt` sin nuevo interval |
| Tooltip | `title` attribute | Sin dependencia JS pesada |

**Debounce:** No aplicar a search; no relevante aquí.

---

## 14. Risks

1. **Unificar open/close con `store_sessions`** puede cambiar comportamiento operativo real vs solo flag on-demand (T4.4 — requiere decisión producto explícita).
2. **Eliminar scopeLabel** puede reducir contexto jornada para roles sin permiso — mitigable en cluster.
3. **STALE sin timestamp** — riesgo de falso positivo/negativo si se implementa antes de T4.4.
4. **Dos APIs paralelas** (`toggleBusinessStatus` vs `openStoreSessionAction`) — deuda arquitectónica confirmada.
5. **Realtime fallback** construye session con `opened_at` del payload — correcto si payload correcto; incorrecto si hydration throttled.

---

## 15. What Not To Touch

- Search parser / `natural-search.ts`
- Filter IDs / URL `?filter=`
- Scanning / lane navigation (T6)
- Empty/context copy principal (T7)
- Top section presenters (salvo documentar jerarquía)
- Order cards / modal internals
- Realtime orders hooks
- CSS layout T6.1 (salvo spacing mínimo post T4.2)
- Theme bootstrap / audio unlock
- Dead code cleanup (T9)

---

## 16. Open Questions

1. **¿Producto quiere que “Abrir sesión” cree fila `store_sessions` siempre**, o mantener solo on-demand flag en entornos sin migración?
2. **¿Copy final: hora de apertura vs duración activa?** (`desde 12:36` vs `hace 36 min`)
3. **¿STALE debe mostrarse si hydrate throttled**, o solo si fallo explícito?
4. **¿Eliminar `scopeLabel` del view model** o solo del render (dejar campo para T7/jornada)?
5. **¿Unificar `toggleBusinessStatus` y `openStoreSession`** en una sola server action** para evitar regresiones futuras?
6. **¿`storeSessionError` debe incluir errores de hydrate manual**, no solo open/close?
7. **¿Top section debe seguir mostrando macro sesión** sin timestamp mientras toolbar muestra `desde HH:MM` en cluster?

---

*Phase T4.1 — audit only. No code, CSS, or token changes.*
