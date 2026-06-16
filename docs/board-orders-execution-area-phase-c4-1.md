# Board / Orders Execution Area — Phase C4.1 — Review Mode Copy Consistency

## Objetivo

Corregir copy del top section para que una sesión cerrada no muestre “En vivo”.

## Contexto

C2–C4 establecieron review mode, action policy y server guard. El top section seguía usando `liveLabel` de realtime para todos los scopes.

## Problema detectado

La UI mostraba “Última sesión cerrada · En vivo”, lo cual era semánticamente incorrecto porque una sesión cerrada está en modo revisión, no en operación activa.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/orders/analytics.ts` | `scopeStatusLabel`, `resolveDashboardTopSectionMetaStatus` |
| `lib/orders/dashboard-top-section-view-model.ts` | Meta scope-aware (`statusLabel`, `scopeIndicator`, dot) |
| `components/admin/orders/DashboardOverview.tsx` | Render condicional del meta line |
| `components/admin/orders/DashboardMobileOverview.tsx` | Mismo render en mobile |
| `components/admin/orders/DashboardOverview.module.css` | Dot neutral en review mode |
| `components/admin/orders/DashboardMobileOverview.module.css` | Dot neutral en review mode |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-c4-1.md` | Este documento |

## Cambio aplicado

El suffix del header ya no reutiliza siempre el label de realtime. Se resuelve por `operationalWindow.source` vía `resolveDashboardTopSectionMetaStatus`.

## Scope copy matrix

| Source | Header |
|--------|--------|
| `store-session` | Sesión activa · En vivo |
| `last-closed-store-session` | Última sesión cerrada · Modo revisión |
| `business-window` | Jornada actual |

## Top section label behavior

- `liveLabel` de realtime sólo alimenta `statusLabel` en sesión activa.
- Review mode usa “Modo revisión”.
- Jornada actual sin suffix ni dot.

## Toolbar consistency

Sin cambios. Sigue mostrando “Sin sesión activa” + “Modo revisión” en review mode (C3).

## Context panel consistency

Sin cambios. Mantiene hint de modo revisión (C3).

## Visual indicator behavior

- Dot verde pulsante: sólo `store-session` (live).
- Dot neutral sin pulse: `last-closed-store-session` (review).
- Sin dot: `business-window`.

## Comportamiento preservado

- C2 Last Closed Session Review Mode intacto.
- C3 UI Action Policy intacta.
- C4 Server-Side Session Mutation Guard intacto.
- KPIs/insights intactos.
- Board/kanban/cards intactos.
- Search/filter intactos.
- Realtime/hydration intactos.
- Manual sync intacto.

## Qué NO se cambió

- DB/schema
- server actions
- realtime
- hydration scope
- optimistic callbacks
- status/assignment workflow
- quick actions behavior
- card/kanban/modal layout
- theme tokens/global CSS

## Riesgos encontrados

- Realtime labels distintos de “En vivo” (ej. reconexión) siguen mostrándose sólo en sesión activa.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Pass — compilación y typecheck Next OK |
| `npx tsc --noEmit` | Pass — exit 0 |
| `npm run lint` | Pass — 0 errors, 16 warnings (`no-img-element`, preexistentes) |

## QA manual recomendado

Ver checklist prompt C4.1.

**Estado:** pendiente.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
