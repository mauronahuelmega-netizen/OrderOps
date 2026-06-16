# Admin Dashboard Toolbar Phase T4.2 — Remove Redundant Scope Label

## Objetivo

Eliminar el indicador redundante bajo `Pedidos en curso` para que el estado operativo de sesión viva en una sola fuente visual dentro del toolbar: el cluster derecho.

## Contexto

- **T4** aplicó session controls polish con `scopeLabel` en `titleCluster` y `sessionStatusLabel` en cluster derecho.
- **T4.1** auditó que ambos pueden contradecirse (`activeStoreSessionState` vs `onDemandModeActive`).
- **T4.2** elimina solo el render duplicado; T4.4 reconciliará fuentes de sesión.

## Archivos modificados

- `components/admin/orders/DashboardToolbar.tsx`
- `components/admin/orders/dashboard-toolbar.module.css`
- `lib/orders/dashboard-execution-view-model.ts` (comentario en tipo `scopeLabel` únicamente)

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t4-2.md`

## Problema detectado

`scopeLabel` podía mostrar `Sesión activa · desde HH:MM` bajo el título mientras el cluster derecho podía mostrar `Sin sesión activa`, porque derivaban de reglas distintas (`operationalWindowLabel` / `activeStoreSessionState` vs `onDemandModeActive`).

Además duplicaba macro contexto del top section y no ofrecía acción directa.

## Cambio principal

Dejar de renderizar `viewModel.scopeLabel` en el `titleCluster`. El título muestra solo `Pedidos en curso`.

## DOM change

**Antes:**

```tsx
<div className={titleCluster}>
  <h2>{viewModel.title}</h2>
  <div className={scopeIndicator}>
    <strong>{viewModel.scopeLabel}</strong>
  </div>
</div>
```

**Después:**

```tsx
<div className={titleCluster}>
  <h2>{viewModel.title}</h2>
</div>
```

## CSS adjustment

- `.titleCluster`: `display: flex; align-items: center` (sin gap reservado para scope).
- `.scopeIndicator` / `.scopeIndicator strong`: conservadas sin uso en JSX (cleanup **T9**).

## View model decision

- `scopeLabel` se preservó en el view model pero ya no se renderiza en el `titleCluster`.
- Comentario JSDoc en el tipo documenta la decisión para fases futuras (T4.4 / jornada).

## Qué se preservó

- sessionStatusLabel
- open/close session behavior
- sync behavior
- search behavior
- filter URL sync
- scanning behavior
- empty/context behavior
- top section

## Qué NO se tocó

- DB/Supabase
- server actions
- toggleBusinessStatus
- store_sessions reconciliation
- sync indicator model T4.3
- real timestamp reconciliation T4.4
- search/filtros
- scanning
- empty/context
- order cards/modal
- realtime internals
- audio unlock
- theme bootstrap
- `admin-dashboard-orders.tsx`

## Comportamiento preservado

Handlers, hydration, filtros, search, session cluster copy y sync sin cambios.

## Riesgos encontrados

- Operadores sin permiso de sesión ya no ven jornada bajo el título; jornada sigue disponible en cluster cuando aplica (`sessionStatusLabel` rama sin permiso).

## Deuda técnica restante

- **T4.3:** sync indicator model.
- **T4.4:** reconciliación `store_sessions` + timestamp + reglas unificadas.
- **T9:** eliminar CSS `.scopeIndicator` muerto.

## Validaciones ejecutadas

- `npx tsc --noEmit`: **pass** (exit 0)
- `npm run lint`: **no configurado** — `next lint` abre setup interactivo de ESLint; no se completó para evitar alterar configuración del proyecto
- `npm run build`: **pass** (Next.js 15.3.0, compiled successfully)

## QA manual recomendado

Ver checklist T4.2 §13 (desktop, sesión activa/inactiva, mobile, no regresión).

## Próxima fase recomendada

**T4.3 — Manual Sync Indicator Model**.
