# Admin Dashboard Toolbar Phase T4.8 — Toolbar Information Architecture Alignment

## Objetivo

Reorganizar visualmente el toolbar en dos filas semánticas para eliminar el zigzag entre search, filtros y sesión/sync, sin cambiar lógica funcional.

## Contexto

- **T4.3–T4.7** refinan sync, sesión y resync operativo.
- **T4.8** sólo reordena la UI para que esa semántica se lea correctamente.

## Archivos modificados

- `components/admin/orders/DashboardToolbar.tsx`
- `components/admin/orders/dashboard-toolbar.module.css`

## Archivos creados

- `docs/admin-dashboard-toolbar-phase-t4-8.md`

## Problema detectado

La toolbar generaba zigzag visual: search arriba derecha, filtros abajo izquierda, sesión/sync abajo derecha. El operador tenía que cruzar la vista para entender estado vs control de vista.

## Decisión de producto

- Sesión + sync = estado operativo (fila 1).
- Filtros + búsqueda = control de vista (fila 2).
- `Estados del flujo`, empty y context panel quedan fuera del toolbar (épica tablero).

## Nueva arquitectura visual

```txt
Fila 1 — operationalRow
  [ Pedidos en curso ]                    [ sessionStatus ] [ Abrir/Cerrar ] [ sync ]

Fila 2 — viewControlsRow
  [ Todos | Pendientes | ... | Retiro ]                    [ Buscar... ]
```

## Cambios en JSX

- `primaryRow` + `controlRow` reemplazados por `operationalRow` + `viewControlsRow`.
- `sessionCluster` movido de fila 2 a fila 1 (junto al título).
- `searchCluster` movido de fila 1 a fila 2 (junto a filtros).
- `filtersWrapper` renombrado a `filterCluster` (mismo markup de botones).
- Props, callbacks y viewModel sin cambios.

## Cambios en CSS

- Desktop `operationalRow`: flex `space-between`, session alineado a la derecha.
- Desktop `viewControlsRow`: grid `minmax(0,1fr) minmax(18rem,28rem)`.
- Mobile: filas en columna; search full-width; filtros con scroll horizontal.
- Eliminado CSS muerto: `.scopeIndicator`, `.primaryRow`, `.controlRow`, `.filtersWrapper`.

## Desktop behavior

Validado en CSS para ≥769px:

- Título izquierda, sesión/sync derecha.
- Filtros izquierda, search derecha (18–28rem).
- Sin overflow horizontal esperado en 1366–1920px.

## Responsive-safe behavior

- Tablet angosto: columnas de grid reducidas (16–22rem search).
- Mobile ≤768px: stack vertical; session cluster full width; filtros scroll; sync 2.25rem touch target.
- Polish mobile/tablet profundo diferido a **T8**.

## Accesibilidad / tab order

Orden DOM (y foco) top-to-bottom:

1. Abrir/cerrar sesión (si visible)
2. Sync manual
3. Botones de filtro
4. Campo de búsqueda

Coherente con fila operativa arriba y controles de vista abajo.

## Qué se preservó

- Manual operational resync T4.7
- Offline-aware sync T4.6
- open/close session T4.4
- search behavior T5
- filter URL sync
- realtime
- optimistic UX
- scanning
- empty/context
- top section
- order cards/modal

## Qué NO se tocó

- DB/Supabase
- server actions
- hydrate/refresh handlers
- refreshOrdersSilently
- search parser
- filters logic
- URL sync
- Estados del flujo
- empty/context
- top section
- order cards/modal
- mobile/tablet final polish (T8)

## Riesgos encontrados

- Session cluster largo en viewports estrechos puede wrap en fila 1 (aceptable).
- Tab order prioriza sesión antes que filtros (documentado).

## Deuda técnica restante

- T8: polish responsive profundo
- T9: cleanup global `.scopeIndicator` en docs si aplica
- QA manual desktop + smoke mobile

## Validaciones ejecutadas

- `npx tsc --noEmit`: pass
- `npm run lint`: no configurado — `next lint` abre setup interactivo de ESLint
- `npm run build`: pass

## QA manual recomendado

Ver checklist §17 del prompt T4.8 en `/admin/dashboard`.

## Próxima fase recomendada

**T8** — mobile/tablet polish del execution block, o **T10** QA final del toolbar.
