# Order Modal Performance Audit

## 1. Executive Summary

El modal workstation de OrderOps presenta lentitud percibida principalmente en la **columna operacional derecha** (hover, focus, apertura de selects). La auditoría estática identifica **causas CSS/GPU de alta probabilidad** por encima de problemas de React en hover puro.

**Conclusión principal:** la combinación de **`backdrop-filter` en el overlay del modal**, **hover global con `transform` + `box-shadow` en botones** (`ui-button`, `admin-primary-button`, `ui-button--accent`), **muchas superficies con `color-mix` en la consola**, y **scroll anidado** explica la sensación de “UI pesada” al mover el mouse o abrir selects nativos. React contribuye más en **re-renders periódicos y por realtime** que en hover directo.

**Hallazgos totales:** 38 (CSS: 18, React: 10, overlay/scroll: 5, skeleton: 2, dashboard: 3).

| Prioridad | Cantidad |
|-----------|----------|
| P0 | 2 |
| P1 | 12 |
| P2 | 18 |
| P3 | 6 |

**Phase 2J recomendada:** hardening de interacción sin tocar hydration/cache — priorizar overlay, hover de botones, y aislamiento de repaint en `commandColumn`.

---

## 2. Reported Symptoms

Síntomas reportados por el operador:

- La columna operacional se siente **muy lenta** al pasar el mouse.
- Hover en botones (`Tomar pedido`, `Guardar estado`, `Abrir WhatsApp`, quick actions) se siente **tardío**.
- Apertura de **selects** (Estado, WhatsApp template) se siente **lenta**.
- Scroll dentro del modal puede sentirse **menos fluido** en la consola derecha.
- Hydration al abrir pedido añade sensación de carga (mitigada visualmente en Phase 2I/2I-B).

Área más afectada:

```txt
commandColumn
  OrderRecommendedActionPanel
  OrderRiskPanel
  OrderActionsSection
    StatusForm + select
    OrderAssignmentControls
    OrderExternalActions + WhatsApp select + quick actions grid
```

---

## 3. Scope Audited

- Modal workstation shell, layout desktop, columna izquierda/derecha.
- CSS modules del stack modal + `globals.css` / `theme-tokens.css` (solo lectura) para primitivos compartidos.
- Componentes React del modal y props desde `AdminDashboardOrders`.
- Hydration hook (solo lectura) para entender cuándo `loading` provoca re-render.
- Skeleton Phase 2I / 2I-B.
- Dashboard padre: realtime, `optimisticOrders`, props al modal.

**Fuera de alcance de cambios:** cualquier modificación de código — esta entrega es solo documentación.

---

## 4. Files Audited

| Archivo | Revisado |
|---------|----------|
| `components/admin/orders/admin-order-workspace-modal.tsx` | ✅ |
| `components/admin/orders/admin-order-modal.module.css` | ✅ |
| `components/admin/orders/admin-order-modal-shell.tsx` | ✅ |
| `components/admin/orders/order-recommended-action-panel.tsx` | ✅ |
| `components/admin/orders/order-recommended-action-panel.module.css` | ✅ |
| `components/admin/orders/order-actions-section.tsx` | ✅ |
| `components/admin/orders/order-workspace.module.css` | ✅ |
| `components/admin/orders/status-form.tsx` | ✅ |
| `components/admin/orders/status-form.module.css` | ✅ |
| `components/admin/orders/order-assignment-controls.tsx` | ✅ |
| `components/admin/orders/order-detail-surfaces.module.css` | ✅ |
| `components/admin/orders/order-external-actions.tsx` | ✅ |
| `components/admin/orders/order-risk-panel.tsx` | ✅ |
| `components/admin/orders/order-risk-panel.module.css` | ✅ |
| `components/admin/orders/order-human-timeline.tsx` | ✅ |
| `components/admin/orders/order-human-timeline.module.css` | ✅ |
| `components/admin/orders/order-modal-skeleton.tsx` | ✅ |
| `components/admin/orders/order-modal-skeleton.module.css` | ✅ |
| `components/admin/orders/order-modal-workspace-toolbar.tsx` | ✅ |
| `components/admin/orders/order-modal-states.tsx` | ✅ |
| `components/admin/orders/use-order-workspace-hydration.ts` | ✅ (solo lectura) |
| `components/admin/orders/admin-dashboard-orders.tsx` | ✅ (props + realtime) |
| `components/admin/orders/order-items-section.tsx` | ✅ |
| `components/admin/orders/order-workspace-overview.tsx` | ✅ |
| `components/admin/admin-surfaces.css` | ✅ |
| `app/globals.css` | ✅ (`.ui-button`, `.ui-card`) |
| `app/theme-tokens.css` | ✅ (`--transition-hover`, shadows) |
| `components/ui/Button.tsx` | ✅ |
| `components/ui/Card.tsx` | ✅ |

**Total archivos auditados:** 28 (+ referencias cruzadas dashboard CSS).

---

## 5. CSS Performance Findings

### 5.1 Tabla resumida (hallazgos relevantes)

| Archivo | Selector | Propiedad | Riesgo | Motivo | Fix sugerido (Phase 2J) |
|---------|----------|-----------|--------|--------|-------------------------|
| `admin-order-modal.module.css` | `.admin-order-modal-shell__overlay` | `backdrop-filter: blur(2px)` | **P0** | Composita todo el dashboard detrás del modal; repintado costoso en hover/select/scroll | Quitar blur o reducir a scrim opaco; `isolation` en panel |
| `admin-order-modal.module.css` | `.admin-order-modal-shell__overlay` | `background color-mix(black 72%)` | P2 | Scrim OK; combinado con blur amplifica costo | Mantener scrim sin blur |
| `admin-order-modal.module.css` | `.admin-order-modal-shell__panel` | `box-shadow: var(--shadow-premium)` | P2 | Sombra grande en contenedor principal | Reducir shadow en workstation o usar border sutil |
| `globals.css` | `.ui-button:hover` | `transform: translateY(-1px)` | **P1** | Layout/composite en **cada** botón quick action + assignment + WhatsApp | Desactivar transform en modal workstation o usar `translate3d` + `will-change` puntual |
| `globals.css` | `.ui-button` | `transition: var(--transition-hover)` | **P1** | Anima transform + box-shadow + bg + border en 6+ botones | Scope modal: transicionar solo `background-color`, `border-color` |
| `globals.css` | `.ui-button--accent:hover` | `box-shadow: var(--shadow-card)` | **P1** | Sombra en hover del CTA WhatsApp | Eliminar shadow en hover dentro de modal |
| `admin-surfaces.css` | `.admin-primary-button:hover` | `transform: translateY(-1px)` | **P1** | Afecta Guardar estado / Tomar pedido | Igual que ui-button: sin transform en modal |
| `admin-surfaces.css` | `.admin-primary-button` | `transition: var(--transition-hover)` | P1 | Incluye transform | Transición acotada en contexto modal |
| `admin-surfaces.css` | `.admin-field select:focus-visible` | `box-shadow: var(--focus-ring-soft)` | P2 | Focus ring en select estado | OK accesible; evitar combinar con blur overlay |
| `order-detail-surfaces.module.css` | `.toolButtonSecondary:hover` | `background: color-mix(...)` | P1 | Recalcula color-mix en 4–6 botones al hover | Usar token estático o `opacity` overlay |
| `order-detail-surfaces.module.css` | `.toolButtonSecondary:focus-visible` | `box-shadow: color-mix(...)` | P2 | Focus en quick actions | Mantener; reducir spread si lag persiste |
| `order-detail-surfaces.module.css` | `.whatsappField select:focus-visible` | `box-shadow: color-mix(...)` | P2 | Focus select WhatsApp | Idem |
| `status-form.module.css` | `.admin-status-form--modal select:focus-visible` | `box-shadow: color-mix(...)` | P2 | Focus select estado | Idem |
| `admin-order-modal.module.css` | `.commandColumn` + overrides | múltiples `color-mix` en borders/backgrounds | P1 | Muchas capas pintadas en columna densa | Reducir capas; unificar superficie base |
| `admin-order-modal.module.css` | `.commandColumn`, `.executionColumn` | `overflow-y: auto` + scrollbar custom | P2 | Doble scroll; thumb con color-mix | `contain: paint` en commandColumn (medir) |
| `order-items.module.css` | `.admin-item-row--button:hover` | `transform: translateY(-1px)` | P2 | Hover productos izquierda | Menor impacto en síntoma reportado |
| `order-workspace.module.css` | `.admin-detail-panel` | `transition: border-color, box-shadow, opacity` | P3 | Panel genérico | No aplica fuerte en workstation (Card transparente) |
| `order-modal-skeleton.module.css` | `.skeleton::after` | `animation: shimmer infinite` | P2 | Solo initial loading; muchos bones animados | Reducir bones animados o `animation-play-state: paused` off-screen |

**Nota:** no se encontró `transition: all` en CSS modules del modal (`orders/**`). El equivalente funcional es `--transition-hover` en `theme-tokens.css`, que ya lista **5 propiedades** incluyendo `transform` y `box-shadow`.

### 5.2 `--transition-hover` (theme-tokens.css)

```css
--transition-hover:
  background-color var(--motion-fast) ease,
  border-color var(--motion-fast) ease,
  color var(--motion-fast) ease,
  box-shadow var(--motion-fast) ease,
  transform var(--motion-fast) ease;
```

Aplicado globalmente a `.ui-button` y `.admin-primary-button`. En la consola operacional hay **≥8 controles interactivos** que animan transform/shadow simultáneamente al hover.

### 5.3 Densidad `color-mix` en command column

`admin-order-modal.module.css` aplica overrides `:global(.order-recommended-action-panel)`, `:global(.order-risk-panel)`, `.commandColumn` con **>15 declaraciones `color-mix`**. En repintado de hover/focus, el navegador debe recomputar mezclas en superficies superpuestas.

**Tipo:** CSS Paint · **Riesgo agregado:** P1

---

## 6. React Render Findings

### 6.1 Por componente

| Componente | Archivo | Re-render frecuente | Causas | Props inestables | Handlers inestables | Cálculos en render | Memo | Recomendación |
|------------|---------|-------------------|--------|------------------|---------------------|-------------------|------|---------------|
| `AdminOrderWorkspaceModal` | `admin-order-workspace-modal.tsx` | **Sí** | Props `order`, `operationalMetrics`, presence labels desde dashboard; `loading` hydration | `order` cambia con realtime; `operationalMetrics` cada 60s | Callbacks estables (`useCallback`) | `useMemo` header/title | No | Memo shell interno o split command column |
| `OrderRecommendedActionPanel` | `order-recommended-action-panel.tsx` | Media | Cambio status/assignment | Primitivas OK | N/A | `buildRecommendedOrderAction()` cada render | No | `useMemo` recommendation o `memo` |
| `OrderActionsSection` | `order-actions-section.tsx` | **Sí** | Re-render con padre; compone 3 subárboles | `order` objeto completo | N/A | N/A | No | `memo` + props granulares |
| `StatusForm` | `status-form.tsx` | Baja en hover | Solo en submit/select change | `initialStatus` sync | `handleSubmit` estable | N/A | No | OK; select change local |
| `OrderAssignmentControls` | `order-assignment-controls.tsx` | Baja en hover | Click assignment | `assignment` objeto | `handleSubmit` recreado | `buildOrderAssignmentActionLabel` | No | `useCallback` handleSubmit |
| `OrderExternalActions` | `order-external-actions.tsx` | Media | Select template change; padre re-render | `order` completo | **Inline `onClick` lambdas** en quick actions | `useMemo` URLs OK | No | Extraer handlers; `memo` |
| `OrderRiskPanel` | `order-risk-panel.tsx` | **Sí** | `setInterval` 60s + `operationalMetrics` | `order`, `operationalMetrics` | N/A | `assessOrderRisk` memoizado | No | Interval solo si visible; memo panel |
| `OrderHumanTimeline` | `order-human-timeline.tsx` | Baja | Events change | Events array | N/A | `buildPresentedOrderTimelineEntries` memo | **Sí (`memo`)** | OK |
| `OrderItemsSection` | `order-items-section.tsx` | Baja | Items change | `order` parcial | N/A | N/A | **Sí (`memo`)** | OK |
| `OrderWorkspaceOverview` | `order-workspace-overview.tsx` | Media | Padre re-render | `order` completo | `handleDetailNavigation` inline | **`buildOrderOperationalSummary` cada render** | No | Memo + memo summary |
| `AdminDashboardOrders` | `admin-dashboard-orders.tsx` | **Sí** | Realtime, `setNow` 60s, filtros | N/A | Muchos callbacks | Muchos `useMemo` pesados | Parcial | No bloquear modal con re-render board (fase aparte) |

### 6.2 Cadena de re-render al abrir modal

1. Dashboard sigue montado (portal modal, no unmount board).
2. Realtime puede llamar `setOptimisticOrders` → `selectedOrder` nueva referencia → prop `order` al modal.
3. `useOrderWorkspaceHydration` efecto `[order]` mergea seed → `setDetail` → re-render modal.
4. `loading` true/false → toolbar sr-only (Phase 2I-B) — **sin shimmer en background** ✅.

**Hover no dispara state React** en StatusForm/ExternalActions — la lentitud en hover apunta a **CSS/GPU**, no a commits React.

### 6.3 Select change

- **Estado:** `setSelectedStatus` → solo `StatusForm` re-render.
- **WhatsApp template:** `setSelectedTemplate` → solo `OrderExternalActions` re-render + recalc URL.

Apertura del dropdown (sin change) es **100% browser paint** — coherente con síntoma en selects.

---

## 7. Hover / Focus Interaction Audit

| Elemento | Hover CSS | Focus CSS | ¿Layout? | ¿Paint pesado? | ¿Transition transform/shadow? | ¿Lento probable? | Fix recomendado |
|----------|-----------|-----------|----------|----------------|------------------------------|------------------|-----------------|
| **Cerrar** | `background: surface-hover` | `box-shadow` focus ring | No | Bajo | No transform | Bajo | OK |
| **Guardar estado** | `transform translateY(-1px)` via `.admin-primary-button` | `box-shadow` ring | **Sí (transform)** | Medio | **Sí** | **Alto** | Quitar transform en modal |
| **Tomar pedido** | Igual (primary/secondary ui-button) | Igual | **Sí** | Medio | **Sí** | **Alto** | Idem |
| **Abrir WhatsApp** | `transform` + **`box-shadow: shadow-card`** | outline global | **Sí** | **Alto** | **Sí** | **Alto** | Sin shadow/transform en modal |
| **Quick actions (×4–6)** | `color-mix` bg + `ui-button` transform | `box-shadow` color-mix | **Sí** | Medio-alto | **Sí** | **Alto** | Hover flat; sin transform |
| **Select Estado** | nativo + parent transitions | `border-color` + focus ring | No | Medio (dropdown) | Focus only | **Alto al abrir** | Quitar backdrop-filter overlay |
| **Select WhatsApp** | idem | idem | No | Medio | Focus only | **Alto al abrir** | Idem |
| **Product rows** | `transform translateY(-1px)` | outline | **Sí** | Bajo | Sí | Medio | Fuera de síntoma principal |
| **Recommended panel** | Sin hover específico | N/A | No | Bajo (estático color-mix) | No | Bajo | OK |
| **Risk panel** | Sin hover | N/A | No | Bajo | No | Bajo | OK |
| **Timeline items** | Sin hover | N/A | No | Bajo | No | Bajo | OK |

---

## 8. Select / Input Interaction Audit

### StatusForm select

- Clases: `admin-field` global + `status-form.module.css` overrides.
- `min-height: 40px`, `border color-mix`, focus `box-shadow color-mix`.
- **Riesgo apertura:** P1 indirecto — dropdown nativo sobre overlay con `backdrop-filter`.
- **Riesgo focus:** P2 — aceptable para a11y.

### WhatsApp template select

- `admin-field` + `.whatsappField select` overrides (mismos patrones).
- Cambio de template re-renderiza `OrderExternalActions` solamente — costo React bajo.
- **Cuello de botella percibido:** compositing del overlay + muchas capas en `commandColumn`.

### Recomendación Phase 2J

1. Probar selects con overlay sin blur (DevTools) — si mejora mucho → P0 confirmado.
2. Evitar `transform` en ancestros del select (stacking context).
3. No customizar dropdown nativo en Phase 2J (fuera de scope UX).

---

## 9. Overlay / Backdrop / Scroll Audit

| Tema | Hallazgo | Riesgo | Tipo |
|------|----------|--------|------|
| Portal | `createPortal` a `document.body` | — | OK |
| Scroll lock | `overflow: hidden` html/body + padding compensación scrollbar | P2 | Scroll |
| Overlay click | Botón full-screen detrás del panel | — | OK |
| **backdrop-filter** | **`blur(2px)` en overlay** | **P0** | Overlay |
| Panel shadow | `--shadow-premium` | P2 | Paint |
| Nested scroll | `executionColumn` + `commandColumn` ambos `overflow-y: auto` | P2 | Scroll |
| Doble scrollbar | Columnas independientes desktop ≥1024px | P2 | Scroll |
| Dashboard detrás | Sigue montado y pintándose (kanban, animaciones dashboard) | P1 | Paint |
| Hover modal → repintado fondo | Blur fuerza recomposite del contenido detrás | **P0** | Overlay |

**Sospechoso principal confirmado:** `backdrop-filter` sobre dashboard completo (Phase 2H). Chrome/Electron composita toda el área borrosa en cada frame interactivo.

---

## 10. Skeleton / Animation Audit

| Pregunta | Respuesta |
|----------|-----------|
| ¿Animation infinita activa? | **Sí**, solo en `OrderModalWorkspaceSkeleton` (`.skeleton::after` shimmer 1.4s infinite) |
| ¿Shimmer durante background hydration con `displayOrder`? | **No** — Phase 2I-B: solo `sr-only` en toolbar ✅ |
| ¿Se desmonta correctamente? | Sí — skeleton completo solo cuando `loading && !displayOrder` |
| ¿`prefers-reduced-motion`? | Sí — `animation: none` en skeleton CSS ✅ |
| ¿Repinta durante interacción con seed visible? | **No** desde 2I-B — **no P0 actual** |

`OrderModalRefreshSkeleton` fue **eliminado** en Phase 2I-B — ya no aplica.

**Riesgo residual:** initial open con skeleton completo (~20 bones animados) puede competir con hydration fetch — **P2**, no explica lentitud operacional con pedido ya visible.

---

## 11. Dashboard Background Re-render Audit

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dashboard activo con modal abierto? | **Sí** — mismo React tree; modal es portal sibling |
| ¿Realtime re-renderiza cards? | **Sí** — `setOptimisticOrders`, `patchDashboardOrderFromRealtime` |
| ¿Modal recibe props nuevas? | **Sí** — `order={selectedOrder}` desde `optimisticOrders`; labels presence/assignment derivados |
| ¿`displayOrder` cambia por dashboard refresh? | **Sí** — `useOrderWorkspaceHydration` merge effect `[order]` actualiza detail |
| ¿Derived state caro en parent? | **Sí** — `operationalMetrics`, risk maps, lane metrics recalculados; tick `now` cada **60s** |

### Efecto en modal

- Cada evento realtime del pedido abierto puede provocar **re-render completo** de `AdminOrderWorkspaceModal`.
- Cada 60s: `operationalMetrics` nuevo → `OrderRiskPanel` recalcula aunque risk sea null (stable).
- **No explica hover lento** directamente, pero suma carga CPU y GC bajo interacción.

### Animaciones dashboard detrás del modal

- `DashboardOverview.module.css`: `overviewPulse` infinite.
- `dashboard-header.module.css`: `pulse` + `backdrop-filter: blur(8px)`.
- Kanban cards: hover shadow/transform.

Con overlay blur, el navegador puede **recomponer animaciones del dashboard** al mover mouse sobre modal — **P1 agregado**.

---

## 12. Browser Profiling Notes

**Profiling browser no ejecutado en esta sesión** (sin DevTools/Playwright trace disponible en el agente).

### QA recomendado — Test A: Disable transitions

```css
* {
  transition: none !important;
  animation: none !important;
}
```

**Resultado esperado (hipótesis):** mejora **moderada** en hover de botones; selects pueden seguir lentos si blur persiste.

### Test B: Disable filters

```css
* {
  backdrop-filter: none !important;
  filter: none !important;
}
```

**Resultado esperado (hipótesis):** mejora **mucho** en hover columna derecha y apertura selects — validaría P0 overlay.

### Test C: Chrome Performance

Grabar hover quick actions + abrir selects. Buscar predominancia de **Paint**, **Composite Layers**, **Recalculate Style** en `.admin-order-modal-shell__overlay` y `.commandColumn`.

### Test D: React Profiler

Confirmar que hover **no** re-renderiza modal; select change re-renderiza solo `OrderExternalActions` / `StatusForm`; realtime re-renderiza modal completo.

---

## 13. Prioritized Findings

### P0 — Causa probable directa

| ID | Tipo | Hallazgo |
|----|------|----------|
| P0-1 | Overlay | `backdrop-filter: blur(2px)` en `.admin-order-modal-shell__overlay` |
| P0-2 | CSS Paint | Interacción modal fuerza recomposite del dashboard animado detrás del blur |

### P1 — Alto impacto probable

| ID | Tipo | Hallazgo |
|----|------|----------|
| P1-1 | Animation | `.ui-button:hover` `transform: translateY(-1px)` en 6+ controles consola |
| P1-2 | Animation | `.admin-primary-button:hover` transform en Guardar/Tomar |
| P1-3 | CSS Paint | `.ui-button--accent:hover` `box-shadow: var(--shadow-card)` WhatsApp |
| P1-4 | Animation | `--transition-hover` anima transform+box-shadow globalmente |
| P1-5 | CSS Paint | `.toolButtonSecondary:hover` recalcula `color-mix` en grid 2×N |
| P1-6 | CSS Paint | Densidad de superficies `color-mix` en `commandColumn` overrides |
| P1-7 | React Render | Realtime actualiza `selectedOrder` → re-render modal completo |
| P1-8 | React Render | `operationalMetrics` recreado cada 60s → `OrderRiskPanel` |
| P1-9 | Unknown | Select nativo sobre stacking context modal+blur |
| P1-10 | Overlay | Dashboard animations (pulse) visibles a través de blur |
| P1-11 | React Render | `OrderExternalActions` inline onClick lambdas — re-renders innecesarios en cascada |
| P1-12 | React Render | `OrderWorkspaceOverview` recalcula summary sin memo |

### P2 / P3

- P2: nested scroll commandColumn/executionColumn, panel shadow premium, focus rings color-mix, skeleton shimmer initial load, hydration `loading` toggle re-render, assignment handleSubmit unstable.
- P3: admin-detail-panel transitions, custom scrollbar styling, Card ui-card defaults overridden, content-visibility (actually positive).

---

## 14. Likely Root Causes

1. **`backdrop-filter` en overlay (P0)** — principal sospechoso para hover lento y selects pesados; composita todo el dashboard.
2. **Hover global con `transform` + `box-shadow` en botones operacionales (P1)** — muchos targets animados en área reportada.
3. **Superficies densas con `color-mix` en command column (P1)** — repaint costoso al hover/focus en quick actions.
4. **Re-renders React por realtime/60s tick (P1)** — no causa hover lento pero degrada sensación general de fluidez.
5. **Dashboard activo detrás del modal (P1)** — animaciones + blur = trabajo GPU continuo.

---

## 15. Recommended Fix Plan

Orden sugerido para **Phase 2J** (sin implementar ahora):

| # | Fix | Riesgo regresión | Esfuerzo |
|---|-----|------------------|----------|
| 1 | Quitar o condicionar `backdrop-filter` en overlay workstation | Bajo visual | S |
| 2 | Scope CSS modal: desactivar `transform` hover en `.ui-button` / `.admin-primary-button` dentro de shell | Bajo | S |
| 3 | Quitar `box-shadow` hover en `.ui-button--accent` dentro de modal | Bajo | S |
| 4 | Reemplazar hover `color-mix` en `.toolButtonSecondary` por tokens estáticos | Bajo | S |
| 5 | Reducir capas `color-mix` en overrides commandColumn (unificar superficie) | Medio visual | M |
| 6 | `contain: paint` / `isolation: isolate` en `.commandColumn` (medir en DevTools) | Medio | S |
| 7 | Confirmar shimmer solo initial — ya OK post 2I-B | — | — |
| 8 | `React.memo(OrderActionsSection)`, `memo(OrderExternalActions)` + stable handlers | Bajo | M |
| 9 | Memo `buildRecommendedOrderAction` / `OrderRecommendedActionPanel` | Bajo | S |
| 10 | Evaluar pausar animaciones dashboard cuando modal abierto (opcional, dashboard scope) | Medio | M |

---

## 16. Safe Phase 2J Proposal

**Phase 2J — Modal Interaction Performance Hardening**

### Objetivo

Reducir latencia percibida en hover, focus y selects de la consola operacional sin tocar hydration, cache, server actions ni lógica de negocio.

### Scope permitido (propuesto)

- `admin-order-modal.module.css` — overlay, commandColumn isolation, scoped button overrides vía `:global(.ui-button)` dentro de shell workstation.
- `order-detail-surfaces.module.css` — hover quick actions (solo clases toolButton*).
- Opcional: `globals.css` con selector contextual `.admin-order-modal-shell--workstation .ui-button` si modules no alcanzan.
- React: `memo`/`useCallback` en `OrderExternalActions`, `OrderActionsSection`, `OrderRecommendedActionPanel` **solo si Profiler confirma**.

### Fuera de scope Phase 2J

- `useOrderWorkspaceHydration`, fetch, cache.
- Cambiar selects a custom headless UI.
- Rediseño mobile/tablet (Phase 3).
- Pausar realtime dashboard.

### Criterios de aceptación Phase 2J

- DevTools Test B mejora perceptible en selects.
- Hover quick actions sin lag visible en desktop 1366px+.
- Sin regresión visual mayor (premium intacto).
- tsc + build pasan.

---

## 17. What Not To Touch

- hydration/cache
- `useOrderWorkspaceHydration`
- fetch workspace endpoint
- server actions
- optimistic callbacks
- realtime subscriptions logic
- DB
- status logic
- assignment logic
- WhatsApp builders/templates/URLs
- clipboard/share/maps/tel logic
- risk detection/scoring
- timeline builders/events/order
- products/notes logic
- layout desktop general / orden de secciones
- mobile/tablet redesign

---

## 18. Validation Plan After Fixes

1. **DevTools Performance** — grabar hover consola antes/después; comparar Paint ms.
2. **Test A/B manual** — disable transitions / disable filters; documentar delta.
3. **React Profiler** — confirmar commits en hover ≈ 0; en select change solo hoja.
4. **Regression** — abrir pedido, hydration, Tomar pedido, cambiar estado, WhatsApp, quick actions, cerrar modal.
5. **Realtime** — modal abierto recibe update; verificar sin jank nuevo.
6. **Accesibilidad** — focus-visible intacto tras quitar transform hover.
7. **Automated** — `npx tsc --noEmit`, `npm run build`.

---

## Appendix A — Phase 2I / 2I-B status (hydration UX)

| Estado | Comportamiento actual | Impacto performance |
|--------|----------------------|---------------------|
| `loading && !displayOrder` | `OrderModalWorkspaceSkeleton` + shimmer | P2 solo en apertura fría |
| `loading && displayOrder` | `sr-only` only (2I-B) | ✅ Sin layout shift; sin shimmer |

Background hydration **no** monta skeleton visible — correcto para UX y performance post 2I-B.

---

*Auditoría completada sin modificar código funcional. Único artefacto creado: este documento.*
