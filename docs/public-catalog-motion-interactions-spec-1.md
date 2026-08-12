# PUBLIC-CATALOG-MOTION-INTERACTIONS-SPEC-1

## Estado

```text
SPEC COMPLETE — PUBLIC CATALOG MOTION READY FOR IMPL-1
```

Branch: `cursor-handoff-public-catalog-ui-redesign` @ `0a71675`
Prerrequisito: `docs/public-catalog-motion-interactions-audit-1.md`
Scope: especificación congelada — sin implementación CSS/runtime.

## Contexto

El catálogo público está visualmente sólido; el motion está disperso (FAB enter, CTA price bump, header drawer). Las superficies P1 más secas son:

```text
ProductCard + / badge · Cart FAB/count · category active pill · scroll smooth sin PRM
```

Esta SPEC congela **IMPL-1** táctil premium — sin overlays, sin librerías, sin checkout.

## Decisiones cerradas

Aprobadas por Product Owner — **congeladas** para IMPL-1:

| ID | Decisión |
|----|----------|
| **1A** | IMPL-1: ProductCard `+`, badge, Cart FAB/count, category transition, reduced-motion |
| **2A** | Personalidad: premium sutil — rápido, corto, elegante |
| **3C** | Add simple: press `+` + badge pop + FAB/count pulse |
| **4A** | Badge aparece/cambia con pop suave |
| **5A** | FAB: pulse corto + pop del número al sumar |
| **6A** | Categorías: transición suave color/fondo/borde del active pill |
| **7A** | Reduced motion: sin pops/pulse; scroll `auto` |
| **8A** | Sin librerías nuevas — CSS Modules + keyframes + estado React mínimo |
| **9A** | CartSheet + customization modal → IMPL-2 |
| **10A** | Sin confetti, loops, checkout/`create_order`, ni animar precio/total de forma llamativa |

Clave dependencia:

```text
Framer Motion NO entra en IMPL-1.
Re-evaluación solo en overlays (IMPL-2/3) si se justifica.
```

## Scope IMPL-1

### IN

| Ítem | Descripción |
|------|-------------|
| ProductCard `+` press | Scale press en quick-add |
| Quantity badge pop | Pop al cambiar cantidad visible efectiva |
| Cart FAB pulse | Pulse corto cuando root cart count **aumenta** |
| Cart count pop | Pop del número al cambiar count (priorizar increment) |
| Category active | Transition suave de estilos del chip `--active` |
| Reduced-motion baseline | Off de pops/pulse/press bounce; scroll gate |
| Scroll-to-category | `smooth` solo si no reduced-motion; else `auto` |

### OUT

Ver **Out of scope**.

## Out of scope

```text
- CartSheet open/close / rows / qty buttons
- Customization modal open / options / CTA / price bump changes
- Post-add upsell sheet
- Product detail modal
- Search polish / empty state fade / image micro-zoom
- Checkout submit / create_order / WhatsApp / success page
- Confetti / loops / animaciones permanentes
- Nuevas dependencias (Framer, GSAP, spring, auto-animate)
- Cambios de lógica de carrito / payload / pricing
- Toasts de “agregado”
```

## Motion personality

```text
Premium sutil.
No infantil. No teatral. No confetti. No loops. No permanentes.
```

Sensación objetivo: el catálogo **responde al dedo** — no “celebra” el add.

## Motion principles

```text
1. Feedback inmediato (< ~160ms al press).
2. Solo transform + opacity.
3. Escalas pequeñas (press 0.96–0.98; pop 1.04–1.08; FAB ≤ 1.05).
4. Un momento primario por acción (evitar sensación de doble add).
5. Causa → efecto: tap + → badge y/o FAB responden solo si el add es real.
6. Reutilizar --motion-* / --transition-* de theme-tokens.css.
7. Mobile-first; hover desktop opcional, no requisito.
8. prefers-reduced-motion = estado instantáneo + focus/labels intactos.
```

## ProductCard quick-add contract

Evidencia actual: `handleQuickAdd` en `product-card.tsx` — inline increment si `!requiresCustomization && quantity > 0`; else `onAddProduct` (simple add o abre custom vía parent).

### Producto simple (no requiere customización)

Al tocar `+` **y** el add/increment es efectivo:

```text
1. Press scale en .plus (CSS :active y/o clase breve).
2. Badge quantity pop (0→1 aparece con pop; n→n+1 pop).
3. Cart FAB / count pulse+pop (vía count root que sube).
```

### Producto custom (`requiresCustomization === true`)

```text
1. Press scale en .plus: SÍ.
2. Abre customization modal como hoy (sin cambiar routing).
3. Badge pop: NO (no hubo add).
4. Cart FAB pulse: NO (count no subió).
5. Feedback post-add desde modal: IMPL-2.
```

### Límites

```text
- No cambiar lógica de add / increment / cart payload.
- No cambiar pricing ni labels de precio.
- No modificar customization modal.
- No toast / confetti / haptic APIs nuevas.
- No animar .hit open en IMPL-1 (opcional IMPL-2).
```

## Quantity badge contract

```text
Cuando quantity visible (prop quantity) cambia hacia arriba, o 0→1:
- pop suave scale 1.04–1.08
- duración 140–180ms (prefer --motion-fast / normal corto)
- transform/opacity only
- no layout shift (badge absolute ya)
- no bounce repetido / no loop
```

Casos:

| Caso | Comportamiento IMPL-1 |
|------|------------------------|
| `0 → 1` | Badge mount + pop |
| `n → n+1` (simple +) | Pop |
| Baja desde CartSheet | Preferir update instantáneo o pop **muy** suave; no obligatorio pulse FAB (count down ≠ pulse add) |
| `→ 0` | Unmount sin animación compleja |

Implementación sugerida (sin código ahora): clase efímera `is-popping` / `data-pop` al detectar `prevQty !== qty` en efecto o durante render con key controlada — **local a ProductCard**, no re-animar toda la grilla.

## Cart FAB / count contract

Componente: `cart-bar.tsx` — `null` si `count <= 0`; enter `catalogCartFabIn` 200ms al montar.

### Cuando root cart count **aumenta**

```text
- Pulse corto del FAB (scale max 1.03–1.05)
- Pop corto del .count
- Solo transform/opacity
- No animar width/height/posición fixed
- No animar box-shadow/halo pesado
- No bajar contraste / no cambiar CTA copy
- No pulse en loop / permanente
```

### Count **disminuye**

```text
- Actualizar número; pop opcional mínimo o ninguno
- No pulse de “éxito”
```

### Primer item (`0 → >0`)

```text
- Mantener enter animation existente (catalogCartFabIn).
- Si enter + pulse se superponen: PRIORIZAR enter; omitir pulse en el frame de mount.
- Count puede aparecer sin pop extra en primer mount, o pop una sola vez si no compite visualmente.
```

Señal recomendada: `CatalogClient` pasa `count` (ya lo hace); CartBar detecta incremento vs prevCount con state local — **no** tocar `lib/cart/local.ts`.

## Category transition contract

Estilos actuales viven en **`app/globals.css`** (`.catalog-category-chip`, `--active`); markup en `category-nav.tsx` (clases globales, sin module).

```text
Active pill:
- transition suave de background / color / border (y box-shadow si ya existe estático)
- duración 160–220ms (--motion-fast/normal)
- NO sliding underline/indicator nuevo
- NO layout shift / width animado
- NO scroll hijacking
```

### Scroll-to-category

Hoy (`catalog-client.tsx` ~621–629):

```ts
scrollIntoView({ behavior: "smooth", ... })
```

Contrato IMPL-1:

```text
prefers-reduced-motion: reduce → behavior: "auto"
else → behavior: "smooth" (como hoy)
```

Usar `window.matchMedia("(prefers-reduced-motion: reduce)")` (o helper local mínimo) solo para este gate (y opcionalmente para saltar clases pop).

Search clear scroll ya usa `behavior: "auto"` — no cambiar.

## Reduced motion contract

**Obligatorio** en IMPL-1:

```text
Si prefers-reduced-motion: reduce:
- sin badge pop
- sin FAB pulse / count pop
- sin press bounce ( :active scale off o transition none )
- scroll category: auto
- cambios de estado instantáneos (qty/count/labels)
- mantener focus-visible
- mantener aria-labels existentes
```

CSS:

```css
@media (prefers-reduced-motion: reduce) {
  /* nuevas clases motion IMPL-1 → animation/transition: none */
}
```

JS: matchMedia solo donde CSS no alcanza (scroll behavior / skip state class).

## Dependency policy

```text
NO Framer Motion
NO GSAP
NO react-spring
NO auto-animate
NO nuevas entradas en package.json / lockfiles
```

Justificación: IMPL-1 = CSS Modules + keyframes + estado React mínimo; menos bundle y riesgo.

Backlog opcional (no IMPL-1):

```text
PUBLIC-CATALOG-MOTION-OVERLAYS-LIB-EVAL-1
```

solo si IMPL-2/3 demuestran necesidad real de overlays complejos.

## Tokens / timing

Reutilizar `app/theme-tokens.css`:

| Uso | Target | Token preferido |
|-----|--------|-----------------|
| Press | 120–160ms | `--motion-fast` + `--transition-press` |
| Badge pop | 140–180ms | `--motion-fast` / corto de `--motion-normal` |
| FAB pulse | 180–220ms | `--motion-normal` |
| Category | 160–220ms | `--motion-fast` / `--motion-normal` |

Escalas:

```text
press: 0.96–0.98
badge pop: 1.04–1.08
FAB pulse max: 1.03–1.05
```

Reglas físicas:

```text
transform + opacity only
NO width/height/top/left
NO blur/filter
NO box-shadow animado pesado
```

## Component boundaries

### Archivos probablemente permitidos en IMPL-1

```text
components/public/catalog/product-card.tsx
components/public/catalog/product-card.module.css
components/public/catalog/cart-bar.tsx
components/public/catalog/cart-bar.module.css
components/public/catalog/category-nav.tsx   (solo si hace falta data-attr; prefer CSS)
components/public/catalog/catalog-client.tsx (scroll PRM gate; opcional señal count)
app/globals.css  — SOLO rules .catalog-category-chip* (ya viven allí; no hay module local)
```

Preferencia: CSS Modules para ProductCard/CartBar; globals **solo** category chips existentes.

Opcional doc IMPL: `docs/public-catalog-motion-interactions-impl-1.md` si la fase lo pide.

### Archivos prohibidos en IMPL-1

```text
cart-sheet.* / customization-modal.* / post-add-upsell-sheet.* / product-detail-modal.*
app/b/[slug]/checkout/* / success/* / layout.tsx
app/layout.tsx / app/admin/*
lib/cart/local.ts (preferencia: no tocar)
package.json / lockfiles / supabase/* / types/database.ts
theme-tokens.css — solo si SPEC/IMPL introduce token semántico nuevo reutilizable; preferencia: reutilizar existentes
```

## QA plan for IMPL-1

### Browser local

```text
http://localhost:3000/b/demohamburgueseria/catalogo
```

| Acción | Expectativa |
|--------|-------------|
| Tap `+` producto simple | Press + badge pop + FAB/count pulse |
| Tap `+` varias veces | Pop por incremento; sin loop permanente |
| Tap `+` producto custom | Press; abre modal; **sin** badge/FAB falso |
| Abrir Cart FAB | Sheet abre (sin cambios motion sheet); **no** submit |
| Cambiar categoría | Active transition suave; scroll smooth o auto según PRM |
| Reduced motion ON | Sin pops/pulse; scroll auto; estado correcto |
| `/` y `/admin/login` | Sin regresiones visuales/motion |

### Prohibido en QA

```text
checkout submit · create_order · pedido real · WhatsApp real
```

### Checks técnicos

```text
tsc --noEmit
npm run build
git diff --check
npm run lint  (P3 ESLint 9 circular = no bloquea)
create_order: 0
```

## Risks

| Riesgo | Severidad | Mitigación | En scope IMPL-1 |
|--------|-----------|------------|-----------------|
| Feedback = doble add percibido | P1 | Un press + un pop badge; FAB pulse sutil; no toast | Prevenir |
| Re-render global + animar grilla | P1 | Pop local en card/FAB; respetar `memo` ProductCard | Prevenir |
| Layout shift | P1 | Solo transform/opacity; badge absolute | Prevenir |
| Reduced motion ignorado | P1 | CSS + scroll gate obligatorios | Sí |
| Animar checkout/`create_order` | P0 | Fuera de boundaries | Prohibido |
| Conflicto FAB enter vs pulse | P2 | Priorizar enter en primer mount | Sí |
| Pulse/glow dark exagerado | P2 | Sin shadow animado; scale only | Sí |
| Exceso infantil | P2 | Escalas/duraciones de esta SPEC | Sí |
| Perf mobile | P2 | Sin animar lista completa | Sí |
| Globals CSS sprawl | P2 | Globals solo category chips existentes | Sí |

**Blockers para IMPL-1:** ninguno.

## Recommended implementation plan

Fase siguiente: **PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-1**

Checklist (sin implementar ahora):

1. ProductCard: press en `.plus` + clase pop en `.quantityBadge` cuando `quantity` sube / 0→1.
2. Custom path: press only; no pop/pulse si no hubo add.
3. CartBar: detectar `count` increment; pulse FAB + pop `.count`; skip pulse en mount 0→N si enter animation corre.
4. Category: `transition` en `.catalog-category-chip` / `--active` en `globals.css` (mínimo).
5. `handleCategorySelect`: `behavior` smooth|auto según `prefers-reduced-motion`.
6. PRM media queries en modules tocados.
7. Sin packages; sin overlays; sin `lib/cart/local.ts`; sin checkout.

## Future phases

```text
1. PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-1   ← siguiente (ALLOWED tras esta SPEC)
2. PUBLIC-CATALOG-MOTION-INTERACTIONS-COMMIT-DEPLOY-1  (tras IMPL QA PASS)
3. PUBLIC-CATALOG-MOTION-OVERLAYS-SPEC-1
   o PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2
   → CartSheet open/close + rows
   → Customization modal
   → Post-add upsell
   → Product detail modal
4. PUBLIC-CATALOG-MOTION-OVERLAYS-LIB-EVAL-1  (opcional, solo si hace falta)
```

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-COMMIT-DEPLOY-1 = PAUSED_UNTIL_IMPL
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2 = PAUSED
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

```text
SPEC COMPLETE — PUBLIC CATALOG MOTION READY FOR IMPL-1
```
