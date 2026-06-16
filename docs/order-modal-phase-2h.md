# Order Modal Phase 2H — Desktop Enterprise Visual Hardening

## Objetivo

Elevar la percepción del modal workstation desktop de “modal funcional refinado” a **SaaS enterprise premium**, corrigiendo detalles visuales finos detectados después de Phase 2G — sin cambiar lógica, datos ni comportamiento.

Referencias: Phase 1A–2G, `docs/order-modal-audit.md`.

## Archivos modificados

- `components/admin/orders/admin-order-modal.module.css`
- `components/admin/orders/order-modal-header.tsx`
- `components/admin/orders/order-recommended-action-panel.module.css`
- `components/admin/orders/order-detail-surfaces.module.css`
- `components/admin/orders/status-form.module.css`
- `components/admin/orders/order-workspace.module.css`
- `components/admin/orders/order-human-timeline.module.css`
- `components/admin/orders/order-risk-panel.module.css`
- `components/admin/orders/order-workspace-overview.module.css`
- `components/admin/orders/order-items.module.css`

## Archivos creados

- `docs/order-modal-phase-2h.md`

## Cambio principal aplicado

Pasada visual enterprise desktop: focus/overlay/header, jerarquía de superficies, tipografía de headings, timeline como bloque intencional, balance operación > WhatsApp, polish de selects/quick actions — todo CSS (+ label de tiempo en header).

## Problemas visuales atacados

- Focus ring de Cerrar demasiado fuerte post-click mouse
- Header técnico (`Tiempo: Hace X`, peso alto)
- Actividad reciente débil (texto suelto, solo border-top)
- WhatsApp compitiendo con CTA operativo
- Quick actions duras / sistema
- Headings uppercase/bold excesivos
- Selects nativos/pesados
- Bordes/superficies con intensidad similar
- Overlay/background compitiendo con el modal

## Fixes aplicados

| Área | Fix |
|------|-----|
| Cerrar | `:focus { outline: none }` + `:focus-visible` con box-shadow suave |
| Header | `Hace X` sin prefijo; elapsed más secundario; ref/cliente con pesos más equilibrados |
| Overlay | Scrim 72% + blur 2px |
| Timeline | Card sutil en columna izquierda (padding, border/radius, bg) |
| CTA | Primary operativo más alto/pesado; WhatsApp accent más bajo |
| Quick actions | Menor peso, bg/border suaves, hover/focus-visible |
| Headings | Sin uppercase; peso 600; color tertiary |
| Selects | Altura/border/radius/bg homogéneos; focus-visible suave |
| Surfaces | Bordes color-mix más tenues; backgrounds diferenciados por capa |

## Header hardening

- `OrderModalHeaderMeta`: `Tiempo: {elapsed}` → `{elapsed}`
- Meta elapsed: `text-secondary`, weight 500, 0.78rem
- Workstation title: gap 12px; ref 650 / cliente 500

## Focus / overlay hardening

- Overlay: `color-mix(black 72%)` + `backdrop-filter: blur(2px)`
- Close: ring solo en `:focus-visible` vía `box-shadow` con `var(--focus)` al 30%

## Timeline / left column hardening

- Panel bare en `executionColumn` ≥1024px: card con padding, border suave, bg surface-soft mezclado
- Heading “Actividad reciente”: sentence case, weight 600, tertiary
- Event titles/metadata más secundarios en modo bare

## Console / CTA hardening

- `admin-primary-button` en command column: min-height 2.625rem, weight 650
- `ui-button--accent` (WhatsApp): min-height 2.125rem, weight 550, font-size reducido
- Quick actions: grid intacto; botones secundarios más premium
- WhatsApp select polish en `.whatsappField`

## Typography / surface hardening

- Recommended eyebrow, risk eyebrow, actions group titles, quick actions title: sin uppercase
- Command column: border/bg suaves
- Recommended/risk/overview/items: bordes menos intensos
- Assignment separator más tenue

## Qué se preservó

- Layout 54/46 desktop (Phase 2G)
- Orden de bloques izquierda/derecha
- Props y render de timeline, risk, actions, overview, products, notes
- Handlers, URLs, templates, builders
- Max 5 eventos compact, orden, fallback timeline
- Risk null si stable (sin gap fantasma — flex gap existente)
- Mobile/tablet stack sin rediseño
- Breakpoints y `commandColumn order: -1` intactos

## Qué NO se tocó

- hydration/cache
- optimistic callbacks
- workspace route
- server actions
- realtime
- DB
- status logic
- assignment logic
- WhatsApp builders/templates/URLs
- clipboard/share/maps/tel logic
- risk detection/scoring/signals
- timeline builders/events/order/fallback
- products logic
- notes logic
- mobile/tablet redesign
- `app/theme-tokens.css` / `app/globals.css`

## Ajustes CSS realizados

Ver archivos modificados. Cambio TSX mínimo: solo label elapsed en header.

## Desktop QA notes

Verificar en ≥1366px: focus Cerrar, overlay, timeline card, jerarquía CTA, headings, selects, risk integrado, page detail no roto.

## Deuda técnica restante

- Phase 3: mobile/tablet layout y responsive polish
- ESLint no configurado en repo (setup interactivo)
- QA manual visual pendiente si no hay sesión local activa
- Unified badge system global (fuera de scope)
- Iconos en quick actions (Phase futura)

## Validaciones ejecutadas

- `npx tsc --noEmit` — ✅ exit 0
- `npm run lint` — ⚠️ no configurado; Next.js abre setup interactivo (Strict/Base/Cancel) — no se inventó resultado
- `npm run build` — ✅ exit 0, compiled successfully

## QA manual recomendado

1. Abrir `/admin/dashboard`, modal de pedido (desktop 1366px+)
2. Cerrar: sin ring agresivo post-click; Tab muestra focus
3. Header: `Hace X` sin “Tiempo:”; badge y ref legibles
4. Overlay atenúa dashboard
5. Actividad reciente en card sutil (izquierda)
6. Tomar pedido domina sobre Abrir WhatsApp
7. Quick actions premium secundarias
8. Headings sin gritar
9. Selects estado/WhatsApp consistentes
10. Risk compacto integrado (si aplica)
11. Flujos: estado, asignación, WhatsApp, copiar, maps, tel
12. Timeline/risk signals iguales
13. Cerrar botón/Escape/overlay
14. `/admin/orders/[id]` sin regresiones por CSS compartido

## Próxima fase recomendada

**Phase 3 — Mobile/tablet layout redesign** del modal workstation, manteniendo la arquitectura y lógica intactas.
