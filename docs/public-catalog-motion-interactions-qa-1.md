# PUBLIC-CATALOG-MOTION-INTERACTIONS-QA-1

## Estado

```text
QA COMPLETE — PUBLIC CATALOG MOTION VISUAL QA PASSED
```

Commit prod: `ebfa5b2c541cb2af40d6ff263ebd18feb6a966f8`
Production: `https://orderops.vercel.app` (`dpl_7QEjEfGodS3giM1BnttFRi8Pk7LA`)
Scope: QA + doc only — sin runtime/CSS/commit/push/deploy.

## Contexto

Cierra la deuda P3 del COMMIT-DEPLOY: automation tenía `prefers-reduced-motion: reduce === true` y no observaba pops/pulses. Esta QA fuerza `no-preference` vía CDP `Emulation.setEmulatedMedia` y valida motion visual + reduced-motion + branding.

## Preflight

| Check | Resultado |
|-------|-----------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `ebfa5b2` |
| Working tree | limpio |
| Runtime/CSS diffs | ninguno |

## Production HTTP smoke

| URL | Status |
|-----|--------|
| `/b/demohamburgueseria/catalogo` | 200 |
| `/b/demohamburgueseria/checkout` | 200 |
| `/b/demohamburgueseria/success?order_id=invalid` | 200 |
| `/` | 200 |
| `/admin/login` | 200 |

## Browser environment

| Ítem | Valor |
|------|-------|
| Surface | Cursor IDE browser (CDP) sobre producción |
| Viewport | automation default + interacción mobile-first |
| Hard refresh | navigate a catalogo tras clear local cart keys |
| Cart clear | solo `localStorage` keys `orderops-cart*` (no DB) |
| PRM no-preference | `Emulation.setEmulatedMedia` → `reduce: false`, `noPreference: true` |
| PRM reduce | misma API → `reduce: true` |

## Visual QA — no-preference

`matchMedia('(prefers-reduced-motion: reduce)').matches === false`

| Caso | Resultado |
|------|-----------|
| Estado inicial (carrito vacío) | Title `La Burguesía`; FAB oculto; favicon tenant Supabase |
| Primer add Coca Cola | Press `transform` transition; badge `animationName = catalogQuantityBadgePop`; FAB enter `catalogCartFabIn`; count = 1; sin pulse extra (correcto) |
| Segundo increment | FAB `fabPulse`; surface `catalogCartFabPulse`; count `catalogCartCountPop`; badge pop; count = 2; +1 exacto |
| Custom BBQ | Dialog abierto; FAB count **sin cambio**; sin pulse falso |
| Categoría | Chip `transition: background-color, color, border-color, transform`; active existe |
| Cart FAB open | Sheet visible (“Tu pedido” / cerrar); sin submit |

## Reduced-motion QA

`matchMedia('(prefers-reduced-motion: reduce)').matches === true`

| Check | Resultado |
|-------|-----------|
| Badge / FAB / surface anim | `animationName: none` |
| Plus / chip transition | `none` |
| Count increment | Sí (estado correcto: 2→3) |
| Focus/labels | Intactos |

## Root / admin regression QA

| URL | title | icons |
|-----|-------|-------|
| `/` | OrderOps | `/favicon.ico?v=2`, `/icon.png?v=2` |
| `/admin/login` | OrderOps | apple-touch admin |
| `/b/.../catalogo` | La Burguesía | logo Supabase tenant |

## Network / safety

```text
create_order: 0
pedidos reales: 0
WhatsApp real: 0
DB writes: 0
checkout submit: 0
secrets: 0
deploy/commit: 0
```

Solo lectura + localStorage clear de carrito público.

## Findings

- Motion visual **PASS** bajo no-preference (keyframes observados en computed style).
- Reduced-motion **PASS** (animaciones off, estado on).
- Custom sin false add **PASS**.
- Branding tenant + OrderOps root/admin **PASS**.
- Deuda P3 visual del deploy **cerrada**.

## Risks / Debt

| Item | Sev | Notas |
|------|-----|-------|
| Automation requiere CDP para no-preference | P3 | Documentado; no bloquea |
| Overlays motion | — | IMPL-2 / overlays SPEC |

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-QA-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-COMMIT-DEPLOY-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2 = PAUSED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-SPEC-1 = OPTIONAL_NEXT
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

```text
QA COMPLETE — PUBLIC CATALOG MOTION VISUAL QA PASSED
```
