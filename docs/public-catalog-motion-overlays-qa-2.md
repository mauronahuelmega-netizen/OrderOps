# PUBLIC-CATALOG-MOTION-OVERLAYS-QA-2

## Estado

QA COMPLETE — PUBLIC CATALOG MOTION OVERLAYS QA-2 PASSED

## Contexto

Cierra la deuda visual de `PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-2` (Customization, Post-add upsell, Product detail) sin modificar runtime, CSS, DB ni datos.

Deuda IMPL-2 recibida:

- P3 — Post-add upsell visual enter/exit no observado (confirm Customization → CartSheet directo en ese run).

Gate recibido: QA-2 ALLOWED; COMMIT-DEPLOY-2 PAUSED_UNTIL_QA.

## Preflight

| Check | Result |
|-------|--------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD short | `e682568` |
| HEAD full | `e6825684f03e98f42b17f113c3a710577401acde` |
| Tip commit | `feat(public-catalog): add cart sheet overlay motion` |
| Working tree | Solo diffs IMPL-2 (+ `tsconfig.tsbuildinfo` restaurado) |

Diff aceptado al inicio (IMPL-2):

- `M` customization-modal.tsx / .module.css
- `M` post-add-upsell-sheet.tsx / .module.css
- `M` product-detail-modal.tsx
- `M` app/globals.css
- `??` public-overlay-motion.ts
- `??` docs/public-catalog-motion-overlays-impl-2.md

Confirmado desde IMPL-2 doc + código:

- Customization enter/exit + dismiss delayed; confirm `closeImmediate`
- Upsell enter/exit + finish delayed; attach inmediato
- Product detail enter/exit + dismiss delayed; save `closeImmediate`
- Helper puro `public-overlay-motion.ts`
- CartSheet / catalog-client sin diff

## Technical validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS (exit 0) |
| `npm run build` | PASS (preflight QA-2 / TECH_OK) |
| `git diff --check` | PASS (exit 0) |
| `npm run lint` | P3 tooling — ESLint 9 circular JSON/config-validator (no bloquea) |
| `tsconfig.tsbuildinfo` | Restaurado tras tsc |

## Browser environment

| Item | Value |
|------|--------|
| URL | `http://localhost:3000/b/demohamburgueseria/catalogo` |
| Tenant title | La Burguesía |
| Automation | cursor-ide-browser + CDP (`Emulation.setEmulatedMedia`) |
| Cart storage | Solo `localStorage` keys `orderops-cart*` del business demo (cleared cuando se necesitaba) |
| PRM | Emulado `no-preference` y `reduce` vía CDP |

Productos / cart states usados:

- Product detail: Clásica
- Customization: Doble Smash (Papas chicas), BBQ Bacon (caso sin upsell)
- Upsell: Coca Cola 500ml / Sprite 500ml candidatos tras Doble Smash `created`
- Cart vacío → custom → upsell; cart con lineas existentes → merge/skip upsell; simple + Clásica

## Customization modal QA

| Caso | Resultado |
|------|-----------|
| Open (+ custom Doble Smash) | PASS — options, precio/CTA, sin layout shift grave |
| Close X / Escape / backdrop | PASS — exit delayed (`data-closing` / unmount ~180ms), scroll unlock |
| Option select + press feedback | PASS — Papas chicas habilita CTA; sin reset inesperado |
| Confirm/add | PASS — `closeImmediate`; agrega a carrito; handoff a upsell o cart según negocio; **no** `create_order` |
| CTA price | PASS — `Agregar · $ 12.500,00` coherente |

## Product detail modal QA

| Caso | Resultado |
|------|-----------|
| Reachability | PASS — `Ver Clásica` abre detail |
| Enter | PASS — backdrop/modal fade/slide bajo `no-preference` |
| Close X / Escape / backdrop | PASS — delayed exit, unmount, scroll unlock, sin overlay fantasma |
| Controles qty / save path | PASS — qty visible; no doble add observado; CartSheet no roto |

## Post-add upsell QA

### Condición de apertura (solo lectura)

`lib/cart/post-add-upsell.ts` → `decidePostAddOverlay`:

- Abre upsell solo si `outcome === "created"` **y** hay candidatos elegibles de `config.upsellGroup.products`
- Si `merged` / `replaced` o sin candidatos → `openCart: true` (explica BBQ / merges → CartSheet directo)

### Observación visual (objetivo central)

| Caso | Resultado |
|------|-----------|
| Empty cart → Doble Smash (Papas chicas) confirm | PASS — sheet “¿Sumás algo más?” con Coca/Sprite |
| Enter anim (`no-preference`) | PASS — `catalogUpsellBackdropIn` / `catalogUpsellSheetIn` |
| Escape / finish delayed | PASS — `pointer-events: none` durante close; handoff CartSheet |
| Attach Sprite (CTA sheet `Agregar Sprite 500ml por $…`) | PASS — estado `Agregado` inmediato; CTA → `Listo`; sin doble add |
| Listo delayed finish | PASS — unmount ≤~180ms → CartSheet con ADICIONAL Sprite |
| BBQ Bacon con cart no vacío / sin candidatos | Esperado → CartSheet (no es fallo motion) |

**Upsell reachability debt IMPL-2: CERRADA** en este run.

## Reduced motion QA

Emulación CDP: `prefers-reduced-motion: reduce`.

| Overlay | Resultado |
|---------|-----------|
| Product detail | PASS — `animation: none` / `0s`; close inmediato (~40ms); scroll unlock |
| Customization | PASS — sin keyframes activos; sin transform press; close inmediato; body overflow libera |
| Post-add upsell | PASS — opened; `activeAnims: []`; finish X ~36ms → CartSheet |

`no-preference` (Customization / Detail / Upsell): animations reales, exit visible, sin loop/bounce teatral — PASS.

## Regression QA

| Surface | Resultado |
|---------|-----------|
| CartSheet FAB open / X / Escape | PASS |
| CartSheet qty + | PASS (1→2) |
| Checkout CTA visible sin submit | PASS — `Continuar al checkout` (button); URL permanece en catálogo |
| ProductCard + simple (Clásica) | PASS — FAB badge 2→3 productos |
| Root `/` title | PASS — OrderOps |
| Admin `/admin/login` title | PASS — OrderOps |
| Tenant catalog title | PASS — La Burguesía |

## Network / safety

| Metric | Count |
|--------|------:|
| create_order | 0 |
| pedidos reales | 0 |
| WhatsApp real | 0 |
| checkout submit | 0 |
| DB writes / RPC / actions / packages changes | 0 |
| secrets / tokens logged | 0 |

Solo se limpió `localStorage` de carrito público demo.

## Findings

1. **P0/P1/P2:** ninguno confirmado.
2. **Upsell motion:** observado enter/exit + attach inmediato + handoff cart (cierra P3 IMPL-2).
3. **Negocio:** upsell no aparece en merges/`outcome !== created` o sin candidatos — esperado por contrato, no bug de motion.
4. **Lint:** P3 tooling ESLint 9 circular config (conocido).
5. **Nota automation:** el browser embebido a veces reporta PRM reduce; QA forzó ambos estados vía CDP.
6. Hydration warning preexistente en página pública (fuera de scope).

## Risks / Debt

| ID | Severity | Note |
|----|----------|------|
| Lint tooling | P3 | ESLint 9 circular JSON — no bloquea COMMIT-DEPLOY-2 |
| Upsell tenant-dependent | Info | Reachable en demohamburgueseria vía Doble Smash + cart vacío / line `created` |

Sin deuda P3 de reachability upsell pendiente para gate de commit.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-COMMIT-DEPLOY-2 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-QA-2 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-2 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2 = SUPERSEDED
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

## Git status final (esperado)

```text
M app/globals.css
M components/public/catalog/customization-modal.module.css
M components/public/catalog/customization-modal.tsx
M components/public/catalog/post-add-upsell-sheet.module.css
M components/public/catalog/post-add-upsell-sheet.tsx
M components/public/catalog/product-detail-modal.tsx
?? components/public/catalog/public-overlay-motion.ts
?? docs/public-catalog-motion-overlays-impl-2.md
?? docs/public-catalog-motion-overlays-qa-2.md
```

Sin commit. Sin push. Sin deploy. Sin cambios DB/RPC/packages.
