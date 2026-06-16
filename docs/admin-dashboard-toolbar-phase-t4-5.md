# Admin Dashboard Toolbar Phase T4.5 — Session/Sync QA Pass

## Objetivo

Validar y cerrar el sub-bloque funcional de sesión/sync post-T4.4: abrir/cerrar contra `store_sessions`, reload, toolbar vs top section, sync manual hydrate-only, pending/error states, y no regresión en search/filtros/scanning.

## Contexto

- **T4.2** eliminó scope label redundante bajo `Pedidos en curso`.
- **T4.3** convirtió sync en icon-only con dot (`synced` / `syncing` / `error`).
- **T4.4** cableó open/close a `openStoreSessionAction` / `closeStoreSessionAction` y `hasActiveStoreSession` en el view model.
- **T4.5** es QA dirigido + fixes mínimos solo si hay bugs reales.

## Archivos modificados

- Ninguno

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t4-5.md`

## QA ejecutado

Se realizó **QA estático de código** (auditoría de wiring, state machine, SSR, hydration, realtime fallback, view models, error paths). **QA manual en browser con DB viva** queda pendiente en este entorno (requiere sesión autenticada + verificación SQL en Supabase).

Metodología:

1. Trazado end-to-end de open/close/hydrate/sync/realtime.
2. Verificación de alineación toolbar ↔ top section vía `activeStoreSessionState` / `operationalWindow`.
3. Revisión de guards, pending `finally`, error handling sin updates optimistas.
4. Confirmación de que sync manual no invoca `refreshOrdersSilently`.
5. Validaciones `tsc` + `build`.

## Estado inicial sin sesión

**Verificado (código):**

| Check | Resultado |
|-------|-----------|
| SSR `getActiveStoreSession` → `initialActiveStoreSession` | `page.tsx` carga sesión open real o `null` |
| `hasActiveStoreSession === false` sin fila open | Deriva de `activeStoreSessionState.status === "open" && closedAt == null` |
| Toolbar `sessionStatusLabel` | `"Sin sesión activa"` si `canManageStoreSession` |
| Botón primario | `"Abrir sesión"` |
| No timestamp de sesión en toolbar | `operationalWindow.source !== "store-session"` → label jornada, no `formatSessionStartLabel` |
| Top section | `buildDashboardTopSectionViewModel` usa `operationalWindow.source`; sin sesión → `"Jornada actual"` |
| Contradicción toolbar/top | **No esperada**: ambos dependen de `activeStoreSessionState`, no de `onDemandModeActive` |

**Pendiente (manual):** confirmar en `/admin/dashboard` con `store_sessions` sin fila open y `on_demand_mode_active = false`.

## Abrir sesión

**Verificado (código):**

| Check | Wiring |
|-------|--------|
| Handler | `openStoreSessionAction()` — no `toggleBusinessStatus` |
| Pending | `"opening"` → label `"Abriendo..."`; `finally` limpia |
| Success | `setActiveStoreSessionState(result.session)` inmediato (sin F5) |
| Flag | `setOnDemandModeActive(true)` + helper `syncOnDemandModeActive(true)` |
| DB | `openStoreSession` insert o reuse + unique index `one_open_per_business` |
| Timestamp | `formatSessionStartLabel(operationalWindow.start)` ← `opened_at` |
| Post-action | `hydrateStoreSession("manual-action")` + route refresh throttled |
| Error | No setea session/flag; `storeSessionError` visible |

**Pendiente (manual):** click real, comparar `opened_at` DB vs HH:MM local, consola sin errores.

## Reload con sesión abierta

**Verificado (código):**

| Check | Wiring |
|-------|--------|
| SSR | `page.tsx` → `getActiveStoreSession` → `initialActiveStoreSession` |
| Init state | `useState(initialActiveStoreSession)` |
| Sync prop | `useEffect` alinea cuando `initialActiveStoreSession` cambia post-refresh |
| Toolbar | `hasActiveStoreSession` true → `"Sesión activa · desde HH:MM"` |
| Top section | `operationalWindow.source === "store-session"` → meta `"Sesión activa"` |

**Riesgo documentado:** flash leve posible entre paint client y convergencia si SSR cachea valor stale; mitigado por `revalidatePath` en actions. No corregido — no reproducido en código.

**Pendiente (manual):** hard reload con sesión open activa.

## Cerrar sesión

**Verificado (código):**

| Check | Wiring |
|-------|--------|
| Confirm | Preservado si `hasActiveOrdersInProgress` |
| Handler | `closeStoreSessionAction(activeStoreSessionState.id)` |
| Pending | `"closing"` → `"Cerrando..."`; `finally` limpia |
| Success | `setActiveStoreSessionState(null)` inmediato |
| Flag | `setOnDemandModeActive(false)` + helper sync false |
| DB | `closeStoreSession` setea `status='closed'`, `closed_at`, sync flag |
| Error | No limpia session si action falla |
| Post-action | `hydrateStoreSession("manual-action")` |

**Pendiente (manual):** verificar fila closed + `closed_at` en DB.

## Reload con sesión cerrada

**Verificado (código):**

| Check | Wiring |
|-------|--------|
| SSR | `getActiveStoreSession` query `status='open' AND closed_at IS NULL` → `null` |
| Toolbar | `"Sin sesión activa"` + `"Abrir sesión"` |
| Top section | `"Jornada actual"` |
| Timestamp viejo | No debe aparecer: sin `activeStoreSessionState` open, `getOperationalWindow` usa jornada |

**Pendiente (manual):** hard reload post-cierre.

## Sync manual

**Verificado (código):**

| Check | Resultado |
|-------|-----------|
| Handler | `handleManualStoreSessionResync` → `hydrateStoreSession("manual-resync")` |
| Refetch pedidos | **No** — no llama `refreshOrdersSilently` |
| Filtros/search | Sin cambios en handler |
| Syncing UI | `isStoreSessionHydrating` → `syncState: "syncing"`, botón disabled |
| Tooltip/aria | View model T4.3 intacto |
| Stale | No implementado (deuda T4.3) |

**Pendiente (manual):** click sync y confirmar network solo hydration action.

## Realtime / multi-tab

**Verificado (código):**

| Escenario | Convergencia |
|-----------|--------------|
| Tab A abre | Local state inmediato; Tab B: INSERT realtime → hydrate o payload fallback open |
| Tab A cierra | Local null; Tab B: UPDATE realtime → hydrate o fallback `null` |
| Throttle hydrate | 2s realtime; fallback aplica si hydrate throttled |
| Flag alignment | Payload fallback + hydrate actualizan `onDemandModeActive` |

**Pendiente (manual):** dos pestañas mismo negocio, abrir/cerrar en Tab A, observar Tab B sin F5.

## Error handling

**Verificado (código):**

| Check | Resultado |
|-------|-----------|
| Open error | Early return; no `setActiveStoreSessionState` / no flag optimista |
| Close error | No `setActiveStoreSessionState(null)` en fallo |
| `storeSessionError` | Render en `DashboardToolbar` (`role="alert"`) |
| Pending cleanup | `finally { setPendingStoreSessionAction(null) }` en open/close |
| Sync error state | Solo si `storeSessionError != null && !hydrating` (T4.3) |

**No simulado:** error forzado en browser (requiere mock/fallo DB controlado). Documentado como QA pendiente.

## Permisos

**Verificado (código):**

| Rol | Comportamiento |
|-----|----------------|
| `canManageStoreSession` (managePublicSettings) | Open/close + `"Sin sesión activa"` / session label |
| Sin permiso | Sin botón open/close; `sessionStatusLabel = operationalWindowLabel` (jornada fallback) |

**Pendiente (manual):** usuario sin `managePublicSettings` si existe en entorno QA.

## No regresión

**Verificado (código — sin cambios en T4.5):**

| Área | Estado |
|------|--------|
| Search T5 | `OperationalSearch` + view model placeholders intactos |
| Filtros / URL `?filter=` | Handlers `handleFilterChange` sin tocar |
| Estados del flujo T6 | Filter buttons en `DashboardToolbar` |
| Empty/context | Sin cambios en `DashboardContextPanel` |
| Top section | `buildDashboardTopSectionViewModel` sin cambios |
| Order cards/modal | Sin cambios en handlers open/close session |
| Sync visual T4.3 | `DashboardToolbar` sync icon-only intacto |

**Pendiente (manual):** smoke visual en `/admin/dashboard`.

## Fixes aplicados

- **Ninguno.** QA pass documentado. El wiring T4.4 cumple el contrato revisado; no se detectaron bugs bloqueantes en auditoría estática.

Observaciones no bloqueantes (deuda, no fix en T4.5):

- `onDemandModeActive` en `admin-dashboard-orders.tsx` se escribe pero ya no se lee tras T4.4 (estado muerto; cleanup T9).
- `syncOnDemandModeActive` usa update directo vs RPC `set_business_on_demand_status` (deuda T4.4).
- Hydrate failures manuales no setean `storeSessionError` (deuda T4.3).
- `router.refresh()` post-action puede throttle 12s; UI local no depende de ello gracias a state inmediato + hydrate.

## Qué se preservó

- confirm al cerrar con pedidos activos
- pending labels
- sync indicator T4.3
- search behavior
- filter URL sync
- scanning behavior
- empty/context behavior
- top section
- order cards/modal

## Qué NO se tocó

- search/filtros
- scanning
- empty/context T7
- sync visual T4.3
- order cards/modal
- realtime orders internals
- DB schema/migrations
- audio unlock
- theme bootstrap

## Riesgos encontrados

1. **QA manual incompleto** en este entorno — validación DB/browser pendiente.
2. **Settings operations** (`/admin/settings/operations`) puede seguir usando `toggleBusinessStatus` sin `store_sessions` — fuera de scope toolbar; posible desalineación si se usa en paralelo.
3. **Flash SSR** teórico si `revalidatePath` no converge antes de refresh — bajo riesgo.

## Deuda técnica restante

- QA manual browser + SQL checklist (§18 prompt)
- Remover `onDemandModeActive` dead state (T9)
- Unificar `syncOnDemandModeActive` con RPC si se requiere paridad exacta
- Sync `stale` / hydrate error surfacing (T4.3 deuda)
- Operations settings reconciliation con `store_sessions`

## Validaciones ejecutadas

- `npx tsc --noEmit`: pass
- `npm run lint`: no configurado — `next lint` abre setup interactivo de ESLint
- `npm run build`: pass

## QA pendiente

Checklist manual mínimo (requiere entorno autenticado + Supabase):

```txt
Sin sesión:
[ ] Toolbar dice Sin sesión activa
[ ] Botón dice Abrir sesión
[ ] No aparece timestamp viejo
Abrir:
[ ] Click Abrir sesión
[ ] Pending Abriendo...
[ ] store_sessions open real
[ ] opened_at correcto
[ ] on_demand_mode_active true
[ ] UI cambia sin F5
[ ] Reload conserva activa
Cerrar:
[ ] Click Cerrar sesión
[ ] Confirm si hay pedidos activos
[ ] Pending Cerrando...
[ ] store_sessions closed real
[ ] closed_at seteado
[ ] on_demand_mode_active false
[ ] UI cambia sin F5
[ ] Reload conserva cerrada
Sync:
[ ] Icon sync compact
[ ] Click ejecuta hydrate session only
[ ] No refetch pedidos
[ ] No doble click durante hydrating
Multi-tab:
[ ] Tab B converge al abrir
[ ] Tab B converge al cerrar
No regresión:
[ ] Search
[ ] Filtros/URL
[ ] Estados del flujo
[ ] Empty/context
[ ] Top section
[ ] Lanes/cards
[ ] Order modal
```

## Próxima fase recomendada

**T7** — empty/context polish del execution block, o completar QA manual pendiente antes de avanzar. Opcional: reconciliar `/admin/settings/operations` con `store_sessions` en fase futura fuera del toolbar.
