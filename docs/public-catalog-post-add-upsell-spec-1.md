# PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1

## Post-Add Upsell — Product, Domain & Technical Specification

**Fase:** SPEC-ONLY · AUDIT-ONLY · DOCS-ONLY  
**Fecha:** 2026-07-31  
**Branch:** `main` @ `5dd9b41`  
**Veredicto:** **GO WITH DOMAIN PREREQUISITE**

No se implementó superficie post-add. No se modificó runtime, DB, RLS, RPC, actions, payloads, cart schema, pricing ni Product Customization.

---

## 1. Estado / veredicto

| Campo | Valor |
|-------|--------|
| Veredicto | **GO WITH DOMAIN PREREQUISITE** |
| ¿GO puro con modelo actual? | **No** |
| ¿NO-GO absoluto? | **No** — el modelo V2 parent/child + checkout ya soportan el *resultado* del upsell; falta **placement** y un **contrato de mutación** explícito |
| Prerrequisito bloqueante | Placement administrativo explícito (recomendado: **group-level**) + retorno estable del parent `cartLineId` post-merge + helper de attach child |
| Próxima fase de producto | Domain/admin placement (o fase combinada domain+cart+UI acotada) |
| Feature distinta (no confundir) | `CART-LEVEL-CROSS-SELL` (roots independientes) |

**SUBMIT / pedidos reales:** no aplica (spec-only).

---

## 2. Resumen ejecutivo

Los Plus in-modal (`upsell_groups` / `upsell_group_items`) ya existen y alimentan children V2 vía `buildCartLinesFromCustomizationSelection` + `mergeCustomizedSelectionIntoCart`. **No existe placement** (`in_modal` / `post_add` / `both`). Reutilizar todos los Plus no seleccionados post-add (**Opción A**) viola el principio de no insistir y no distingue superficies.

El MVP seguro preferido es:

- solo parents V2 **nuevos** (no edit, no merge, no qty, no legacy);
- candidatos desde config **ya en cache** (0 POST extra);
- placement **distinto** de in-modal;
- child ligado al `cartLineId` real post-mutación;
- count root-only; dismiss no destructivo; máx. candidatos pequeño.

Eso **no** es implementable de forma segura hoy → **GO WITH DOMAIN PREREQUISITE**, no rebajar a GO mostrando los mismos Plus del modal.

---

## 3. Preflight

| Item | Valor |
|------|-------|
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty | Catálogo / modal / cart sheet / checkout / `lib/cart/local.ts` / business header / globals / super-admin actions / docs / tmp — **no limpiado** |
| Esta fase modifica runtime/DB/deps? | **No** |
| `checkout/actions.ts` / `create_order` / migrations / package.json | Intactos (no tocados) |

---

## 4. Source audit — Product Customization público

### 4.1 Tipos y tablas reales

| Concepto | Implementación real |
|----------|---------------------|
| Group | `upsell_groups` → `PublicUpsellGroupView` `{ id, name, description, products[] }` |
| Item | `upsell_group_items.product_id` → `PublicUpsellSuggestedProduct` `{ id, name, price, imageUrl }` |
| Precio | `products.price` (no en fila upsell) |
| Enabled | `is_available` (group + item) |
| Orden | `sort_order` |
| Target | `target_type` + `target_id` (`product` \| `category`); **1 group por target** |
| Resolver | `resolveUpsellForProduct` — product-target gana sobre category |
| Max picks upsell | **No existe** |
| **Placement** | **No existe** (DB, types, admin, public) |

Archivos: `lib/product-customization/public.ts`, `public-shared.ts`, `types/database.ts`, migración schema v1.

### 4.2 Admin Plus sugeridos

UI: `components/admin/product-customization/plus-suggestions/*`  
Actions: `create/update/toggle` group + item.

El owner **puede** hoy: crear grupo por producto/categoría, ranking, hide vía `is_available`, copy name/description (parcialmente overrideada en público por `upsell-copy.ts`).

El owner **no puede** expresar: solo modal / solo post-add / ambas / ranking de superficie / límite de picks post-add.

Copy admin actual implica aparición **en el modal del catálogo público**.

### 4.3 Add / edit parent

| Helper | Rol |
|--------|-----|
| `buildCartLinesFromCustomizationSelection` | Crea parent V2 + children; genera `cartLineId` provisional |
| `mergeCustomizedSelectionIntoCart(items, parent, children, { replaceCartLineId? })` | Merge por **signature** o append; retorna **solo** `LocalCartItem[]` |
| `buildCartConfigurationSignature` | Incluye `upsells:{ids}` — los Plus **forman parte** de la identidad de merge |

Caller (`catalog-client` `handleConfirmCustomizationSelection`):

- no recibe `outcome` (`created` \| `merged` \| `replaced`);
- no recibe el `cartLineId` **final** del parent sobreviviente;
- abre cart sheet siempre tras confirm.

**Implicación post-add:** asociar un child “al parent que el usuario acaba de agregar” es **ambiguo** si hubo merge (el `cartLineId` provisional del modal se descarta).

### 4.4 Add child

Children solo se construyen **junto** al parent en el build inicial.  
Existen: `removeSingleCartLine`, `setV2ParentQuantity` (escala children), remove parent con children.

**No existe** helper `attachUpsellChildToParent` / equivalente.

### 4.5 Productos simples / legacy

- Quick-add: `setLegacyProductQuantity` cuando `!productNeedsCustomizationModal`.
- `productNeedsCustomizationModal` = `hasCustomizations || hasUpsell`.
- Legacy **no** tiene `cartLineId` / `parentCartLineId` / `itemKind` → **no puede** ser parent de upsell V2.
- No hay conversión v1→v2.
- Forzar post-add en simples implicaría promoción silenciosa a V2 y/o POST de config → **fuera del MVP**.

### 4.6 Superficies UI

| Superficie | z-index | Nota |
|------------|---------|------|
| Customization modal | ~80 | Cerrar **antes** de post-add |
| Cart sheet | ~70 | Patrón bottom-sheet reutilizable |
| Cart FAB | ~9 | No host |
| Product detail modal | ~20 | No host post-add |
| Toasts/portals públicos | Ausentes | No depender |

Evitar: modal-in-modal, doble backdrop, abrir cart sheet y post-add a la vez.

---

## 5. Inventario del modelo actual

| Área | Implementación real | Capacidad | Gap |
|------|---------------------|-----------|-----|
| Upsell groups | `upsell_groups` + `PublicUpsellGroupView` | In-modal multi-select | Placement; max picks |
| Upsell items | `upsell_group_items` + suggested product | Precio vía producto; sort; toggle | Placement por item (no recomendado MVP) |
| Placement | **Inexistente** | Solo hide (`is_available`) | Enum/flags de superficie |
| Public loader | `getPublicProductCustomizationConfig` + corpus | Cache client `slug:productId` | Filtrar por placement |
| Modal cache | `customization-config-cache` / CatalogClient | Reopen 0 POST | Post-add debe reutilizar cache |
| Parent add result | `merge…` → `LocalCartItem[]` | Merge/dedupe por signature | Outcome + `parentCartLineId` final |
| Child add helper | Solo co-build | Hierarchy/remove/scale OK | Attach post-add + rebuild signature |
| Simple products | Legacy v1 paralelo | Quick-add 0 POST | No parent upsell sin conversión |
| Preview | Storage aislado + CTA bloqueado | Misma cart V2 | Debe heredar post-add o excluirlo explícitamente |
| Checkout | Valida children / snapshots | Parent/child prices | Sin cambio de contrato si child es V2 upsell |

---

## 6. Evaluación de arquitecturas

### Opción A — Reutilizar todos los Plus in-modal no seleccionados

| Pros | Contras |
|------|---------|
| Cero DB | Repite candidatos recién vistos/rechazados |
| Cache ya tiene lista | Fatiga / sensación de insistencia |
| Fácil técnicamente | Viola principio 3.3 |

**Veredicto local:** **Rechazada como MVP** salvo que el negocio marque explícitamente esos items como `both` y el usuario **no** los haya visto en el modal (casi nunca) o no los haya tenido disponibles in-modal. No emitir GO con A sola.

### Opción B — Placement explícito

Comparación de nivel:

| Nivel | Pros | Contras | Recomendación |
|-------|------|---------|---------------|
| **Group** | Simple; título/límites/candidatos viajan juntos; admin claro; 1 group/target ya existe | No parte items del mismo grupo entre superficies | **MVP recomendado** |
| Item | Máxima flexibilidad | UI densa; reglas contradictorias group vs item | Diferir |
| Assignment | Contextual | Overrides/prioridad complejos; upsells **no** usan assignment table hoy | No |

**Enum recomendado (group-level):**

```text
placement = 'in_modal' | 'post_add' | 'both'
default = 'in_modal'   -- backward compatible: comportamiento actual
```

Alternativa flags (`show_in_modal` + `show_post_add`) es equivalente; preferir **enum único** para evitar estados inválidos (`false/false` = hide ya cubierto por `is_available`).

Filtros públicos:

- Modal: `placement ∈ {in_modal, both}`
- Post-add: `placement ∈ {post_add, both}` **y** productId ∉ selectedUpsellProductIds del add
- `is_available=false` → ninguna superficie

### Opción C — Cross-sell cart-level (roots independientes)

Concepto comercial distinto (“¿querés también X?” como línea propia). Infla count; no es “Plus del combo”.

**Documentar como futura feature:** `CART-LEVEL-CROSS-SELL`. **No** es el MVP post-add Plus.

### Opción D — Solo productos simples

Requiere V2 conversion o POST post-add. Rompe presupuesto 0 POST y contrato legacy.

**Rechazada para MVP.**

### Opción E — Solo parents configurables V2 nuevos + cache

| Pros | Contras |
|------|---------|
| 0 fetch si config en cache | Sin placement → cae en A |
| `cartLineId` conocible si se expone outcome | Merge/edit deben excluirse |
| Menor riesgo técnico | Alcance limitado (aceptable) |

**Base técnica del MVP** — **solo** con Opción B (placement). Sin B → no GO.

---

## 7. Decisión de MVP preferida (cerrada)

### 7.1 Alcance IN

1. Productos con modal de personalización (config V2) ya cargada en cache.
2. Tras **crear** una línea parent **nueva** (`outcome === "created"`).
3. Candidatos: items del `upsellGroup` con `placement ∈ {post_add, both}`, disponibles, ≠ self, no seleccionados en el add.
4. Máximo **3** candidatos visibles (ordenar por `sort_order`; truncar).
5. Aceptar 0..N (recomendado: 1 tap = 1 child; multi-aceptar secuencial o checkboxes con CTA “Agregar” — ver UX).
6. Child V2 `itemKind: "upsell"` con `parentCartLineId` = id **final**.
7. Count root-only; precios `lineTotal` separados; total vía `getCartItemsTotal`.
8. Dismiss: “Ahora no” / X / backdrop — 0 fetch, sin child vacío.
9. Tras dismiss o completar: opcional abrir cart sheet (no obligatorio; no ambas a la vez).

### 7.2 Alcance OUT

- Edit parent / `replaceCartLineId`
- Merge con signature existente
- Quantity stepper del parent
- Legacy simple quick-add
- Prefetch / POST extra post-add
- Carousel infinito / redirect checkout
- Convertir Plus en selection de grupo obligatorio
- Embutir Plus en `displaySummary`
- Cross-sell root (Opción C)
- Pedidos reales / cambios `create_order`

### 7.3 Condiciones que hoy fallan → prerequisite

| Condición MVP | Estado hoy |
|---------------|------------|
| Placement distinto de in-modal | **Falta** |
| Identificar parent nuevo vs merge | **Falta** outcome en merge |
| Attach child post-facto + signature | **Falta** helper |
| 0 POST | OK si solo cache-hit configurables |
| Root-only count | OK (ya existe) |
| Dismiss no destructivo | Diseño OK |

---

## 8. Placement — decisión obligatoria

### 8.1 Enum

```text
upsell_groups.placement: 'in_modal' | 'post_add' | 'both'
DEFAULT 'in_modal'
NOT NULL
```

### 8.2 Nivel

**Group level** (única recomendación MVP).

### 8.3 Semántica

| Valor | Modal | Post-add |
|-------|-------|----------|
| `in_modal` | Sí | No |
| `post_add` | No | Sí |
| `both` | Sí | Sí (si no seleccionado in-modal) |

### 8.4 Migración de datos

Backfill: todas las filas existentes → `in_modal` (preserva comportamiento actual; **cero** post-add hasta que el owner configure).

### 8.5 Admin UX (prerrequisito)

En create/edit Plus group: control segmented o select “Dónde mostrar”: Modal / Después de agregar / Ambas.  
Helper copy: post-add solo aparece si el cliente **no** eligió ese producto en el modal (cuando `both`).

### 8.6 Public types

Extender `PublicUpsellGroupView` con `placement`.  
Loader puede devolver el grupo completo; **presenters** filtran por superficie (modal vs post-add) para no forzar dos fetches.

---

## 9. Contrato de carrito (prerrequisito de implementación)

### 9.1 Resultado de mutación parent

Cambiar (fase implementación, no esta) el contrato de merge para exponer:

```ts
type MergeCustomizedSelectionResult = {
  items: LocalCartItem[];
  parentCartLineId: string;
  outcome: "created" | "merged" | "replaced";
};
```

Reglas:

- `created` → candidato a post-add.
- `merged` | `replaced` → **no** mostrar post-add.
- Post-add **solo** usa `parentCartLineId` retornado (nunca el provisional del build si divergió).

### 9.2 Attach child

Helper nuevo (nombre tentativo):

```ts
attachUpsellChildToParent(
  items: LocalCartItem[],
  parentCartLineId: string,
  suggested: PublicUpsellSuggestedProduct,
  categoryId: string
): LocalCartItem[]
```

Debe:

1. Validar parent V2 `itemKind === "product"` existe.
2. No-op / idempotencia si ya hay child con mismo `productId` bajo ese parent.
3. Crear child con `quantity = parent.quantity`.
4. Rebuild `configurationSignature` del parent incluyendo el nuevo upsell id (crítico: signature hoy incluye upsells).
5. No crear root independiente.
6. No tocar `displaySummary` del parent (seguir mostrando solo grupos; child visible en hierarchy).

### 9.3 Riesgo de signature

Agregar Plus post-add **cambia** la signature del parent. Eso es correcto para dedupe futuro, pero:

- dos burgers idénticas en opciones pero una con Plus post-add **no** mergean;
- documentar en QA: no es bug.

### 9.4 Quantity

Child qty siempre = parent qty (`setV2ParentQuantity` ya escala). Post-add no introduce qty independiente del child en MVP.

---

## 10. Flujo de producto cerrado

```text
Usuario confirma “Agregar · $X”
  → modal cierra
  → mergeCustomizedSelectionIntoCart → { items, parentCartLineId, outcome }
  → si outcome !== "created" → abrir cart sheet (comportamiento actual) END
  → filtrar candidatos post_add|both desde config en cache
  → si candidatos.length === 0 → cart sheet / seguir END
  → mostrar PostAddUpsellSheet (opcional, no bloquea)
       ├─ “Ahora no” / X → dismiss → opcional cart sheet
       └─ Aceptar producto(s) → attachUpsellChildToParent → FAB/count/total
  → persistencia localStorage (keys actuales)
  → cart sheet / checkout ven parent + children
```

Invariantes:

- Add principal **ya ocurrió** antes del sheet.
- Cerrar post-add no revierte parent.
- 1 parent + N Plus = count del parent.
- 0 requests en dismiss / accept (si precios vienen de cache).

---

## 11. UX de superficie

### 11.1 Patrón

**Bottom sheet** (mismo lenguaje que cart sheet), z-index entre FAB y modal (p. ej. 75), **después** de cerrar customization modal.

No: toast; no: full-screen modal segundo; no: inline en card.

### 11.2 Contenido

- Título corto: “¿Sumás algo más?” (o copy del group name vía `getUpsellGroupCopy` si aplica).
- Lista compacta: imagen opcional, nombre, precio propio (`formatPublicCatalogCurrency`).
- CTA por ítem “Agregar · $Y” **o** lista + “Agregar seleccionados”.
- Secondary: “Ahora no”.
- Total resultante: mostrar solo si aporta claridad (“Tu pedido: $T”) — preferible **después** de accept en FAB/sheet, no como mini-checkout.

### 11.3 Focus / a11y

- Focus trap en sheet; Escape = dismiss.
- No scroll-lock doble con cart sheet abierto.
- Preview: misma UI o flag off explícito; CTA checkout sigue bloqueado en preview.

### 11.4 Interacción con cart sheet

Hoy el confirm abre cart sheet inmediatamente. MVP debe **elegir una** política:

**Política recomendada:**  
Si hay candidatos post-add → **no** abrir cart sheet hasta dismiss/complete del post-add.  
Si no hay candidatos → abrir cart sheet como hoy.

Documentar para no sorprender: el usuario ve primero upsell, luego puede abrir pedido.

---

## 12. Elegibilidad — checklist implementable

Mostrar post-add iff **todas**:

1. Feature flag producto/tenant (si se introduce; default off hasta backfill placement).
2. `outcome === "created"`.
3. Config en memoria/cache para ese `productId`.
4. `upsellGroup != null` tras filtro `post_add|both`.
5. Al menos 1 candidato no seleccionado in-modal.
6. Negocio abierto / preview rules existentes (no inventar).
7. No hay otro overlay de personalización abierto.

---

## 13. Pricing & count

| Superficie | Regla |
|------------|-------|
| Precio candidato | `PublicUpsellSuggestedProduct.price` |
| Tras accept | parent.lineTotal intacto; child.lineTotal = price × parent.qty |
| Total | `getCartItemsTotal` |
| Count | `getCartItemCount` root-only (sin cambio semántico) |
| Prohibido | Reintroducir `groupTotal` ambiguo junto al parent |

---

## 14. Persistencia & checkout

- Keys: `orderops-cart` / `orderops-cart-v2` **sin cambio**.
- Payload checkout: mismo shape V2 parent + upsell children (ya validado en QA integrada).
- Server validation / snapshots: sin cambio de contrato si child se construye igual que in-modal.
- **No** ejecutar pedidos en implementación QA inicial.

---

## 15. Performance

| Regla | Valor |
|-------|--------|
| POST post-add | **0** (solo cache-hit) |
| Si cache miss | **No** abrir post-add (fail closed); no disparar fetch solo para upsell |
| First open modal | Sigue 1 POST |
| Reopen | 0 POST |

---

## 16. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Insistencia / duplicar modal | Placement + default `in_modal`; post_add separado |
| Child al parent equivocado | Solo `outcome===created` + id retornado |
| Signature merge raro | Documentar; rebuild signature en attach |
| Legacy silent V2 | Fuera de MVP |
| Modal + sheet + post-add | Secuencia estricta; una superficie |
| Orphans | Reusar `removeCartLineWithChildren`; QA E2E remove parent |
| Preview orders | CTA bloqueado; storage aislado |

---

## 17. Plan de fases posteriores (recomendado)

### Fase D1 — Domain prerequisite

- Migración: `upsell_groups.placement` + backfill `in_modal`
- Types + admin UI + public view field + filter helpers
- RLS: sin cambio de política de acceso (misma tabla)
- Docs + smoke admin

### Fase C1 — Cart contract

- `MergeCustomizedSelectionResult`
- `attachUpsellChildToParent`
- Tests/fixtures signature + qty scale + idempotencia
- **Sin UI post-add aún** (opcional)

### Fase U1 — Post-add UI MVP

- Sheet + elegibilidad + wiring catalog-client
- QA matrix (ver §18)
- Preview: heredar o disable flag

No fusionar D1+U1 sin C1: riesgo de child huérfano / parent incorrecto.

---

## 18. Matriz QA mínima (fase U1)

| Caso | Esperado |
|------|----------|
| Add parent nuevo + candidatos post_add | Sheet aparece; parent ya en cart |
| Dismiss | Parent intacto; 0 POST; 0 children nuevos |
| Accept 1 | +1 child; count estable; total +price×qty |
| Accept ya seleccionado in-modal | No listado |
| Merge same signature | Sin post-add |
| Edit parent | Sin post-add |
| Qty change | Sin post-add |
| Simple legacy | Sin post-add |
| Remove child | Parent queda |
| Remove parent | Children gone |
| Checkout summary | Precios separados; count root-only |
| Cache miss | Sin sheet; sin fetch oportunista |
| Preview | Sin order real |

---

## 19. Comparación veredictos

| Veredicto | Cuándo |
|-----------|--------|
| **GO** | Placement ya existe + merge expone parent id + attach helper — **hoy no** |
| **GO WITH DOMAIN PREREQUISITE** | Modelo V2/checkout OK; falta placement (+ cart contract) — **hoy** |
| **NO-GO** | Si se insistiera en Opción A sin placement o en convertir legacy silenciosamente |

---

## 20. Veredicto final

### **GO WITH DOMAIN PREREQUISITE**

**Prerrequisitos obligatorios antes de UI post-add:**

1. **Placement group-level** `in_modal | post_add | both` (default `in_modal`).
2. **Contrato de merge** con `outcome` + `parentCartLineId` final.
3. **Helper** `attachUpsellChildToParent` con rebuild de signature.

**MVP de producto (post-prerrequisitos):** Opción **E + B** — solo V2 parent nuevo, cache-only, placement filtrado, sheet descartable, hierarchy V2, count root-only.

**Explicitamente no GO:** reutilizar ciegamente Plus in-modal (Opción A).  
**Explicitamente no es este MVP:** cross-sell root (Opción C) ni simples legacy (Opción D).

---

## 21. Deuda / fuera de alcance

- E2E signature-change dedicado (deuda QA previa).
- Max selections en upsell.
- Placement item-level.
- Copy comercial post-add dedicada.
- Analytics de accept/dismiss.
- `CART-LEVEL-CROSS-SELL`.

---

## 22. Rollback

N/A — docs-only. Fases futuras: feature flag off + placement default `in_modal` = comportamiento actual.

---

## 23. Próximo paso recomendado

**`PUBLIC-CATALOG-POST-ADD-UPSELL-DOMAIN-1`** — migración placement + admin + public filter (sin UI post-add),  
o fase empaquetada **DOMAIN+CART** si se quiere desbloquear U1 en un solo tramo controlado.

No iniciar UI post-add sin cerrar placement.
