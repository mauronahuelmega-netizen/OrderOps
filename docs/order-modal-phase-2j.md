# Order Modal Phase 2J — Modal Interaction Performance Hardening

## Objetivo

Reducir la lentitud percibida del modal workstation en hover, selects, quick actions y scroll de la consola operacional — fixes CSS/GPU de bajo riesgo, sin cambiar lógica ni layout.

Referencia: `docs/order-modal-performance-audit.md`.

## Archivos modificados

- `components/admin/orders/admin-order-modal.module.css`
- `components/admin/orders/order-detail-surfaces.module.css`
- `components/admin/orders/status-form.module.css`

## Archivos creados

- `docs/order-modal-phase-2j.md`

## Cambio principal aplicado

Hardening de interacción **CSS-first** scoped al modal panel:

1. Overlay sin `backdrop-filter` (scrim 74%).
2. `isolation: isolate` en panel; `contain: paint` en `commandColumn`.
3. Overrides contextuales: sin `transform` hover, sin `box-shadow` hover en accent, transiciones acotadas a bg/border/color.
4. Quick actions hover flat con tokens estáticos.
5. Selects con transición liviana (border/background/color).

## Hallazgos atendidos del performance audit

| ID | Hallazgo | Fix |
|----|----------|-----|
| P0-1 | `backdrop-filter: blur(2px)` en overlay | Eliminado; scrim ligeramente más opaco |
| P0-2 | Recomposite dashboard detrás del blur | Resuelto al quitar blur |
| P1 | `transform: translateY(-1px)` en botones | Override `transform: none` dentro de `.admin-order-modal-shell__panel` |
| P1 | `box-shadow` hover en `ui-button--accent` | Override `box-shadow: none` en hover accent dentro del panel |
| P1 | `--transition-hover` anima transform + shadow | Transición acotada a 120ms bg/border/color en panel |
| P1 | Quick actions `color-mix` en hover | Hover flat con `--bg-surface-hover` / `--border-subtle` |
| P1 | Select perceived lag | Transición liviana; overlay sin blur reduce costo de dropdown nativo |

**No atendidos en esta fase (documentados como pendientes):**

- P1-7 / P1-8: re-renders React por realtime / tick 60s — requiere memo/dashboard scope aparte.
- P1-6: densidad estática de `color-mix` en superficies command column — sin cambio visual en esta fase.

## Fixes CSS aplicados

### `admin-order-modal.module.css`

- Overlay: `backdrop-filter: none`, `-webkit-backdrop-filter: none`, `background color-mix(black 74%)`.
- Panel: `isolation: isolate`.
- `commandColumn`: `contain: paint`.
- Bloque Phase 2J: overrides `:global(.ui-button)`, `.admin-primary-button`, accent hover, product row buttons, selects.
- Close button: transición acotada bg/border/color.

### `order-detail-surfaces.module.css`

- `.toolButtonSecondary`: background estático; hover flat sin transform/shadow/color-mix.
- `.toolButtonPrimary`: transición acotada; hover sin transform/shadow.
- `.whatsappField select`: transición border/background/color.

### `status-form.module.css`

- Select modal: transición border/background/color 120ms.

## Fixes React aplicados

**Ninguno.** Prioridad CSS-first; memoización diferida hasta confirmar con Profiler post-fix.

## Qué se preservó

- Layout desktop 54/46 y orden de secciones.
- Focus-visible accesible (rings en close, selects, quick actions).
- Variants accent/primary/secondary; handlers y textos.
- Hydration Phase 2I/2I-B (sr-only background refresh).
- Apariencia premium general (scrim oscuro, superficies existentes).

## Qué NO se tocó

- hydration/cache
- `useOrderWorkspaceHydration`
- server actions
- workspace route
- realtime
- DB
- optimistic callbacks
- status logic
- assignment logic
- WhatsApp builders/templates/URLs
- clipboard/share/maps/tel logic
- risk detection
- timeline builders
- products/notes logic
- layout desktop general
- mobile/tablet redesign
- `app/globals.css` / `app/theme-tokens.css`
- Componentes TSX (lógica intacta)

## Validaciones ejecutadas

- `npx tsc --noEmit` — ✅ exit 0
- `npm run lint` — ⚠️ ESLint no configurado; Next.js abre setup interactivo
- `npm run build` — ✅ exit 0, compiled successfully

## QA manual recomendado

1. `/admin/dashboard` → abrir pedido.
2. Hover columna derecha: Tomar pedido, Guardar estado, WhatsApp, quick actions — debe sentirse más instantáneo.
3. Abrir selects Estado y WhatsApp — menor delay.
4. Scroll `commandColumn` — más fluido.
5. Overlay oscuro sin blur; fondo no distrae.
6. Tab: focus-visible visible en botones y selects.
7. Flujos operativos: estado, asignación, WhatsApp, copiar, maps.
8. Background hydration: sin skeleton visible (2I-B).
9. DevTools opcional: menos Paint/Composite en hover.

## Riesgos / tradeoffs

- **Scrim sin blur:** overlay ligeramente más plano; compensado con opacidad 74%.
- **`contain: paint` en commandColumn:** podría recortar sombras/focus en edge cases — validar focus rings en QA.
- **Overrides en `order-detail-surfaces`:** también afectan page detail `/admin/orders/[id]` — cambio de hover flat consistente.
- **React re-renders:** realtime sigue pudiendo re-renderizar modal; fuera de scope 2J.

## Próxima fase recomendada

**Phase 3 — Mobile/tablet layout redesign** del modal workstation.

Opcional posterior: memo selectivo (`OrderExternalActions`, `OrderActionsSection`) si Profiler muestra commits residuales tras validar mejora CSS.
