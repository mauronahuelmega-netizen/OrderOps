# ADMIN-MANUAL-ORDER-MODAL-VERIFY-RECONCILIATION-1

## Result

**PASS** — 2026-09-08. Relevant verify suite **15/15 PASS**. Test-only: runtime and CSS
byte-unchanged, P2-QA1 **CLOSED**.

Se reconciliaron **7** assertions stale, no 5. Las 2 extra estaban **enmascaradas**: cada verify
aborta en su primera assertion fallida, así que `breakpoint` L538 y `form-validation` L438 nunca se
habían ejecutado en Final QA. Ambas viven en archivos ya autorizados por esta fase y tienen las
mismas dos causas raíz (focus containment certificado + microcopy aprobado), así que se trataron
dentro de scope; no se tocó ningún archivo fuera de los 5 autorizados.

## Stale assertions reconciled

| verify | old assertion | new durable intent | result |
|--------|---------------|--------------------|--------|
| `admin-manual-order-modal-breakpoint-overflow-fix` | `querySelector` prohibido file-wide | La **única** query DOM del modal debe ser `container.querySelectorAll`, debe vivir en `getManualOrderFocusableElements` y recibir el nodo `dialog` — nada de resolver el scroller por DOM. `getElementById`, scroll de window/document y `scrollIntoView` siguen prohibidos, y todo write de `.scrollTop` sigue apuntando a `bodyRef.current`/`body` | PASS |
| `admin-manual-order-modal-breakpoint-overflow-fix` *(enmascarada)* | `/tabIndex/` prohibido file-wide | **Leer** `tabIndex` está permitido (el filtro descarta nodos inalcanzables); prohibido **asignarlo**, `setAttribute`/`removeAttribute("tabindex")` y cualquier `tabIndex` positivo en markup. Se exige que el filtro siga descartando `tabindex=-1` | PASS |
| `admin-manual-order-modal-cta-footer-states-polish` | `querySelector` prohibido file-wide | Igual guard de ownership: el trabajo de CTA/footer no introduce DOM lookup para scrolling; la única query sigue siendo el helper de focusables scopeado al diálogo | PASS |
| `admin-manual-order-modal-form-validation-ux-decision` | literal `"Hay un adicional sin producto principal. Revisá el ticket."` | Se retiró el literal de la lista exacta y se pinnea la **condición** (`!parent \|\| parent.kind !== "customized"` → `nextFieldErrors.items`) más la **terminología** (dice `pedido`, no `ticket`) | PASS |
| `admin-manual-order-modal-form-validation-ux-decision` *(enmascarada)* | `querySelector` prohibido en su propia lista | Mismo guard de ownership de query | PASS |
| `admin-manual-order-modal-mobile-single-scroll` | aceptaba `Usá el catálogo...` **o** `Tocá + ...` | Se pinnea la **estructura** del hint: el bloque `product-blocked-hint` ramifica por `canConfigure`, ambas ramas traen copy, y ninguna nombra un gesto ni un control (`Tocá`/`Hacé clic`/`+`) | PASS |
| `admin-manual-order-customization-flow-domain` | los mismos 2 literales de presentación | Verify de dominio/safety: se desacopla del microcopy y se pinnea el **gate** — `!product.isManualOrderAvailable → openConfigure(productId); return;` (sin quick-add de producto configurable) y que el hint de bloqueo siga existiendo | PASS |

Nada quedó comentado, `skip`, `todo`, `|| true` ni envuelto en catch. Ningún guard se relajó a
"cualquier implementación pasa": los 3 guards de ownership de query usan `deepEqual` contra
`["container.querySelectorAll"]`, así que fallan tanto si aparece `document.querySelector` como si
desaparece la query legítima.

## Suite

**15/15 PASS.** Targeted (los 5 archivos reparados): **5/5 PASS**. Nuevas fallas: **0**.
Inventario idéntico al de Final QA.

## Static

tsc **PASS** · `git diff --check` **PASS**
build **NOT RUN** — runtime sin cambios, ya PASS en Final QA.
lint **NOT RUN** — deuda de tooling conocida ya certificada.

## Boundaries

runtime **NONE** (hash del diff de runtime idéntico al inicio de fase:
`9BA3B67C23AB870E3FE54879BAAB214C5FE77C2ADC7968CB5F0F5D9E0E49F5D6`; stat 5 archivos, 1061/216) ·
CSS **NONE** · orders **0** · sin browser/CDP/screenshots · sin mutación de status/WhatsApp/DB/RPC ·
sin commit/push/deploy · nada staged.

Cambios de esta fase: los 5 verifies autorizados + este doc + `docs/CURRENT_PHASE.md`.
`ORDEROPS_LIVING_MEMORY.md` y `docs/admin-dashboard-forensic-living-audit.md`: **sin tocar**.

## Remaining product debt

- **P2-QA2** — cerrar el modal descarta el ticket cargado sin confirmación, y el overlay del shell es un `button` a pantalla completa en el primer tab stop: existe un camino de teclado para perder trabajo. Aceptado no bloqueante.
- **P3-QA1** — `Requiere personalización` vs vocabulario "Configurar" (constante de dominio).
- **P3-QA2** — `Opcional · máx. 5` y `Opcional · máx. 5 opciones` visibles a la vez (helper compartido con checkout público).
- **QA autenticada en producción** — pendiente, requiere sesión del owner.

## Gate

**PASS.** P2-QA1 CLOSED · 15/15 PASS · runtime UNCHANGED · visual/UX block FROZEN.
Next: **ADMIN-MANUAL-ORDER-MODAL-COMMIT-PUSH-DEPLOY-1**. No commit. No push. No deploy.
