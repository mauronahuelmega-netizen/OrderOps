# ADMIN-MANUAL-ORDER-MODAL-FORM-VALIDATION-UX-DECISION-1

**Fecha:** 2026-09-07
**Tipo:** Targeted validation-UX alignment — manual order modal only
**Branch:** `main` · **HEAD:** `3e418bb056f7cd5eabe0e79a6218ec7b825a8684`
**Resultado:** PASS — P1-2 CLOSED (CTA READINESS ALINEADO CON `validateForm`)

---

## 1. Objective

Cerrar el P1-2 del audit visual: `Crear pedido` podía quedar **habilitado** y anunciando
`Crear pedido · $ X` mientras Nombre, Teléfono o (en Delivery) Dirección estaban vacíos.
El servidor ya estaba protegido y `validateForm` ya bloqueaba el submit, pero la UI
comunicaba "listo para crear" cuando no lo estaba: el operador sólo descubría el problema
al pulsar.

Esta fase **no agrega reglas de validación**. Alinea la lectura visual de readiness con las
reglas obligatorias que `validateForm` ya definía.

---

## 2. Product decision — locked

**OPTION A — GATE CTA BY EXISTING REQUIRED FORM RULES.**

`canSubmit` incorpora la readiness de los campos **ya obligatorios**. Nada más: ni formato
de teléfono, ni longitud mínima de nombre, ni normalización de dirección, ni reglas nuevas
de ningún tipo.

---

## 3. Audit of current rules

Lo que `validateForm` exigía antes de esta fase (y sigue exigiendo, sin cambios):

| RULE | CURRENT `validateForm` | CURRENT `canSubmit` (antes) | TARGET `canSubmit` (ahora) |
|------|------------------------|------------------------------|-----------------------------|
| `customerName` no vacío (`.trim()`) | requerido siempre | **ignorado** | **requerido** |
| `phone` no vacío (`.trim()`) | requerido siempre | **ignorado** | **requerido** |
| `address` no vacío (`.trim()`) | requerido **sólo** si `deliveryMethod === "delivery"` | **ignorado** | **requerido sólo en Delivery** |
| ticket no vacío | requerido | requerido (`hasSelectedItems`) | requerido (sin cambios) |
| cantidad > 0 por línea | requerido | requerido (`ticketSubmitReady`) | requerido (sin cambios) |
| producto configurable con selección válida | requerido | requerido (`ticketSubmitReady`) | requerido (sin cambios) |
| upsell sin principal | requerido | requerido (`ticketSubmitReady`) | requerido (sin cambios) |

Ninguna regla de `validateForm` resultó inapropiada para readiness en tiempo real: las tres
de cliente/entrega son comprobaciones de "no vacío" puras, sin I/O, sin async y sin
dependencia del submit. No hubo motivo para detener la fase.

---

## 4. Single source of truth

Se extrajo un helper **puro y local** en `manual-order-modal.tsx`:

```ts
function getManualOrderRequiredFieldErrors(input: {
  customerName: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  address: string;
}): ManualOrderFieldErrors {
  const requiredErrors: ManualOrderFieldErrors = {};
  if (!input.customerName.trim()) requiredErrors.customerName = "El nombre del cliente es obligatorio.";
  if (!input.phone.trim()) requiredErrors.phone = "El teléfono es obligatorio.";
  if (input.deliveryMethod === "delivery" && !input.address.trim())
    requiredErrors.address = "La dirección es obligatoria para delivery.";
  return requiredErrors;
}
```

Es **el mismo cuerpo** que `validateForm` tenía inline, movido sin alterar orden, mensajes
ni condiciones. Ahora lo consumen los dos lados:

- `requiredFormReady` (readiness del CTA) → `Object.keys(...).length === 0`;
- `validateForm` → publica esos mismos errores en `fieldErrors` al enviar.

No se creó `lib/orders/manual-order-form-validation.ts`: la implementación local era
suficiente y evita un archivo compartido innecesario.

---

## 5. `canSubmit` target

```ts
const canSubmit =
  canCreateOrder &&
  !isSubmitting &&
  products.length > 0 &&
  hasSelectedItems &&
  ticketSubmitReady &&
  requiredFormReady;   // ← único término añadido
```

Guards preservados exactamente: permiso/sesión (`canCreateOrder`), catálogo cargado
(`products.length > 0`), ticket no vacío (`hasSelectedItems`), readiness por línea
(`ticketSubmitReady`) y bloqueo durante el envío (`!isSubmitting`). El early return del
handler (`if (!canSubmit || submitLockRef.current) return;`) y el `submitLockRef` siguen
intactos, igual que `validateForm()` como autoridad final antes de llamar a la action.

---

## 6. Blocking-reason UX

El CTA de compose pasa a tener tres estados legibles, derivados **de los mismos booleanos
que controlan `disabled`** (sin una tercera fuente de verdad):

| Estado | Copy | `disabled` |
|--------|------|-----------|
| Ticket vacío | `Agregá productos` | sí |
| Ticket válido, requeridos incompletos | `Completá los datos obligatorios` | sí |
| Todo listo | `Crear pedido · $ X` | no |
| Enviando | `Creando pedido...` | sí |

El copy no identifica campos específicos y no se añadió helper text adicional: el motivo
("faltan datos obligatorios") ya es accionable porque los campos requeridos están marcados
con `*` y a la vista en la misma columna.

Nota de limpieza colateral: la variante `Crear pedido` sin monto para mobile
(`__submit-label-desktop` / `__submit-label-mobile`) quedó sin uso al colapsar el estado
"ticket válido pero sin datos" en su propio copy; ahora el estado listo usa una sola
etiqueta con monto en todos los anchos, que es el contrato que la fase de CTA/footer
había fijado (`P3-8` cerrado de hecho para compose).

---

## 7. Field error behavior

Sin cambios:

- los errores por campo se publican **al enviar** (`setFieldErrors` en `validateForm`);
- escribir en un campo sólo **limpia** su propio error (`{ ...errors, campo: undefined }`);
- no se agregó validación agresiva en tiempo real, ni `aria-invalid` nuevo, ni texto rojo
  en estado pristine, ni resumen de errores, ni `scrollIntoView` a errores.

En estado pristine con requeridos vacíos, medido en runtime: **0** nodos
`__field-error` renderizados. El único cambio de lectura es el CTA.

---

## 8. Delivery conditional

`Retiro` **no** exige dirección; `Delivery` sí, exactamente por la regla preexistente. La
dirección se marca requerida en **un solo lugar** (la rama de delivery del helper), y el
campo conserva su condición de render `deliveryMethod === "delivery"`.

Cambiar de método **no borra** lo tipeado: los handlers de los radios sólo llaman
`setDeliveryMethod`. Verificado en runtime — `Delivery` con `Av Siempre Viva 742` →
`Retiro` (habilitado, dirección oculta) → `Delivery` → el valor sigue siendo
`Av Siempre Viva 742`.

---

## 9. Phone / customer rules

- Teléfono: sigue siendo `!input.phone.trim()`. **Sin regex, sin longitud mínima, sin
  formato, sin normalización, sin import nuevo.**
- Nombre: sigue siendo `!input.customerName.trim()`. **Sin endurecer.**

Assertion de refuerzo en el verify: el cuerpo del helper no puede contener `RegExp`,
`.test(`, `.match(`, `.replace(` ni comparaciones de `length`.

---

## 10. CTA regression guard

| Contrato de la fase CTA/footer | Estado |
|--------------------------------|--------|
| Disabled primario neutral/scoped (`opacity: 1`, cursor `not-allowed`) | **PRESERVED** (medido: `opacity: 1`) |
| Sin `pointer-events: none` simulando disabled | **PRESERVED** |
| Enabled primario azul | **PRESERVED** |
| Monto visible en el estado listo, sin wrap (`white-space: nowrap`) | **PRESERVED** (overflow medido = 0) |
| Footer sticky + sombra ascendente + fade de borde | **PRESERVED** |
| Copy del configurador `Completá las opciones` | **PRESERVED** |

Sin mezcla entre validación de compose y de configurador: `configureDraftValid` no lee
`requiredFormReady` y `canSubmit` no lee `configureDraftValid`. Verificado en runtime con
el peor caso —compose **listo** y configurador **inválido**—: el CTA del subpaso siguió
`disabled` con `Completá las opciones`.

---

## 11. P1-3 / P1-4 / single-scroll guards

- **P1-3:** entrada al configurador en `scrollTop: 0` (390 dark y 390 light), retorno a
  compose restaurando el offset exacto (**281 → 0 → 281**), owner único vía `bodyRef`.
  Sin `window.scrollTo`, sin `scrollIntoView`, sin `querySelector` para el scroller.
- **P1-4:** 900 light → overlap medido por intersección de rects = **0** en las 4 filas de
  producto; grid workstation `247.98px / 300px`; sin scroll horizontal.
- **Single-scroll:** ≤899 → `owners: ["manual-order-modal__body"]` (uno solo). Sin scroll
  anidado, sin overlay fijo del CTA, sin auto-navegación a errores. ≥900 conserva el owner
  `__products-scroll` de la estructura workstation.

---

## 12. Runtime QA — focalizada

Local autenticado `http://localhost:3000/admin/dashboard`, tenant La Burguesía.
Viewports: **390 light (FULL)**, **390 dark (FULL)**, **900 light (smoke)**. Sin matriz completa.

| Caso | Escenario | CTA | `disabled` | Resultado |
|------|-----------|-----|-----------|-----------|
| **A** | ticket vacío + cliente vacío | `Agregá productos` | sí | **PASS** |
| **B** | ticket válido + cliente vacío | `Completá los datos obligatorios` | sí | **PASS** (antes: habilitado con monto) |
| **C** | + sólo Nombre | `Completá los datos obligatorios` | sí | **PASS** |
| **D** | + Teléfono (Retiro) | `Crear pedido · $ 3.000,00` | no | **PASS** (Retiro no pide dirección) |
| **E** | cambio a Delivery (dirección vacía) | `Completá los datos obligatorios` | sí | **PASS** |
| **E'** | Delivery + dirección | `Crear pedido · $ 3.000,00` | no | **PASS** |
| **F** | vuelta a Retiro | `Crear pedido · $ 3.000,00` | no | **PASS** (dirección preservada) |
| **G** | configurador con compose listo | `Completá las opciones` | sí | **PASS** (sin mezcla) |
| **H** | 900 light | ready y blocked | correcto | **PASS** (sin overlap, sin hScroll) |

Ambos temas cubiertos en los estados ready y blocked; el copy bloqueado no desborda el
botón en ningún ancho probado (`scrollWidth - clientWidth = 0`).

**Órdenes creadas: 0.** El CTA habilitado nunca se pulsó; el lane Pendientes terminó con el
mismo `#3EMZ8G` externo/preexistente que ya estaba antes de la QA.

---

## 13. Verifies

Nuevo: `lib/orders/admin-manual-order-modal-form-validation-ux-decision.verify.ts` — **PASS**
(helper puro como fuente única; `requiredFormReady` derivado de ese helper y no
reimplementado; ticket/submitting/sesión/catálogo preservados en `canSubmit`; dirección
requerida en una sola rama condicionada a Delivery; nombre/teléfono no endurecidos y sin
regex/longitud/normalización; `validateForm` con mismas reglas, mensajes y contrato de
retorno; copy en tres estados derivado de los mismos booleanos; sin mezcla con el
configurador; pricing/payload/action/servidor intactos; P1-3, P1-4, CTA/footer,
single-scroll y globals/tokens/Button/shell intactos).

Set ejecutado (sólo el autorizado) — **6/6 PASS**:

`admin-manual-order-modal-form-validation-ux-decision` ·
`admin-manual-order-modal-configurator-context-polish` ·
`admin-manual-order-modal-breakpoint-overflow-fix` ·
`admin-manual-order-modal-cta-footer-states-polish` ·
`admin-manual-order-modal-mobile-single-scroll` ·
`admin-manual-order-customization-flow-ui`

### Scope exception (autorizada)

**Three prior verifies updated only to retire the obsolete P1-2-deferred assertions and
replace them with P1-2-aware readiness guards.**

Archivos:

- `lib/orders/admin-manual-order-modal-cta-footer-states-polish.verify.ts`
- `lib/orders/admin-manual-order-modal-breakpoint-overflow-fix.verify.ts`
- `lib/orders/admin-manual-order-modal-configurator-context-polish.verify.ts`

Los tres afirmaban `canSubmit` byte-identical y "customer field validity must stay out of
`canSubmit`" ("P1-2 debe permanecer diferido"). Ese contrato era correcto en sus fases y
quedó **stale** desde que esta fase cierra P1-2 por objetivo explícito. Las assertions no
se borraron: se reemplazaron por guards que verifican **positivamente** (1) que `canSubmit`
incorpora la readiness de los campos ya obligatorios, (2) que la readiness de ticket sigue
exigida, (3) que `isSubmitting` sigue bloqueando, (4) que la dirección se exige en una sola
rama de Delivery —o sea, Retiro no exige campos exclusivos de Delivery—, (5) que no se
introdujo regex/longitud/normalización, (6) que `customerName` no se endureció, (7) que
`validateForm` conserva reglas, mensajes y semántica vía el helper compartido, y (8) que la
validez del configurador no se mezcla con la de compose. Las secciones de P1-1, P1-3, P1-4
y single-scroll de cada archivo quedaron intactas.

**No se modificó runtime para satisfacer un test histórico.** No apareció ninguna otra
assertion stale fuera de estos tres archivos.

---

## 14. Static checks

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `git diff --check` | **PASS** (exit 0; sólo warnings CRLF conocidos) |
| `npm run build` | **NO EJECUTADO** (fuera de alcance por instrucción: no cambian archivos compartidos/globales/servidor) |
| `npm run lint` | **NO EJECUTADO** (misma razón; además deuda conocida de ESLint) |
| Full dashboard regression suite | **NO EJECUTADA** (misma razón) |

---

## 15. Files changed

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/manual-order-modal.tsx` | **CHANGED** — helper puro `getManualOrderRequiredFieldErrors`, `requiredFormReady`, término añadido a `canSubmit`, `validateForm` consumiendo el helper, copy del CTA en tres estados |
| `components/admin/orders/manual-order-modal.module.css` | **NONE** (no fue necesario) |
| `components/admin/orders/manual-order-customization-panel.*` | **NONE** |
| `components/admin/orders/admin-order-modal-shell.*` | **NONE** |
| `app/globals.css` · `app/theme-tokens.css` · `components/ui/Button.tsx` | **NONE** |
| `app/admin/(protected)/orders/actions.ts` | **NONE** |
| SQL / migraciones / `types/database.ts` | **NONE** |
| `lib/orders/admin-manual-order-modal-form-validation-ux-decision.verify.ts` | **NEW** |
| 3 verifies previos | **CHANGED** — excepción de scope autorizada (§13) |
| Docs | este archivo (nuevo) + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md` + changelog del living audit |
| Inesperados | **ninguno** (`tsconfig.tsbuildinfo` es artefacto generado) |

---

## 16. P0–P3 findings

**P0:** ninguno.

**P1:**
- P1-1 CTA disabled hierarchy — **CLOSED** (fase previa, preservado)
- P1-2 form validation UX — **CLOSED (esta fase)**
- P1-3 configurator context/scroll — **CLOSED** (fase previa, preservado)
- P1-4 900–1023 overlap — **CLOSED** (fase previa, preservado)

**Los cuatro P1 del audit del modal quedan cerrados.**

**P2 que siguen abiertos:** P2-1 affordance de la lista de productos, P2-7 contraste de
`--text-tertiary`, tap targets globales (34×34), materialidad de superficies, jerarquía del
ticket summary, P2-18 QA autenticada en producción.

**P3:**
- P3-8 copy del CTA bloqueado en compose — **CLOSED de hecho** (tres estados explícitos).
- Focus trap completo del modal — **diferido**.
- Indicación por campo del motivo de bloqueo (más allá del `*`) — **no implementada por
  decisión**: el objetivo era alinear readiness, no construir navegación de errores.
- Endurecimiento de teléfono/dirección (formato, longitud, normalización) — **fuera de
  alcance por decisión de producto**; requeriría su propia fase con criterio explícito.

---

## 17. Hard boundaries

| Boundary | Estado |
|----------|--------|
| Reglas de validación nuevas | NINGUNA |
| `validateForm` (reglas/mensajes/semántica) | UNCHANGED (misma lógica, ahora compartida) |
| Reglas de `configureDraftValid` | UNCHANGED |
| Pricing | UNCHANGED |
| Ticket payload | UNCHANGED |
| `createManualOrderAction` | UNCHANGED |
| `create_order` RPC | UNCHANGED |
| DB schema / migraciones | UNCHANGED |
| Public checkout / catalog | UNCHANGED |
| Dashboard / workspace / drawer / toolbar / admin footer | UNCHANGED |
| CSS global / theme tokens / Button compartido / shell | UNCHANGED |
| Single-scroll | FROZEN |
| Auto-scroll a errores / resumen de errores | NO INTRODUCIDOS |
| Órdenes creadas | 0 |
| Mutaciones de estado | 0 |
| Envíos de WhatsApp | 0 |
| commit / push / deploy | NINGUNO |
| Excepción de scope | 3 verifies previos, autorizada explícitamente (§13) |

---

## 18. Gate

**ADMIN-MANUAL-ORDER-MODAL-FORM-VALIDATION-UX-DECISION-1 = PASS**

- P1-2 form validation UX: **CLOSED**
- `canSubmit` ↔ `validateForm`: **ALINEADOS SOBRE UNA FUENTE ÚNICA**
- Reglas nuevas o endurecidas: **NINGUNA**
- CTA copy: **TRES ESTADOS COHERENTES CON `disabled`**
- Retiro/Delivery: **CONDICIONAL CORRECTO, SIN PÉRDIDA DE DATOS**
- P1-1 · P1-3 · P1-4: **CLOSED y preservados** → los 4 P1 del modal cerrados
- CTA/footer: **PRESERVED** · Single-scroll: **FROZEN**
- `create_order` / DB: **UNCHANGED** · Órdenes creadas: **0**

No commit. No push. No deploy.
