# PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1

## 1. Estado

**PASS WITH PREVIEW QA DEBT** · **PASS WITH DEVICE QA DEBT** · **SUBMIT REAL NOT EXECUTED BY SCOPE**

Fecha: 2026-07-30  
Branch: `main` @ `5dd9b41`  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`  
Runtime QA: `http://localhost:3000/b/demohamburgueseria/checkout`

---

## 2. Resumen ejecutivo

Se reorganizó el checkout público mobile/desktop en secciones claras (modalidad segmentada, datos, entrega/retiro condicional, notas, resumen, CTA sticky) sin tocar payload, `createPublicCheckoutOrderAction`, `create_order`, cart schema, pricing ni preview guard. Labels customer-facing: “Finalizá tu pedido”, segmented **Envío** / **Retiro** con values internos `delivery` / `pickup`, CTA `Enviar pedido · $X`. Forma de pago: **NOT APPLICABLE** (no existía UI de pago). Preview admin iframe: **UNVERIFIED** (sin auth). Submit real: **no ejecutado**.

---

## 3. Preflight

| Check | Resultado |
|-------|-----------|
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty previos | Acumulado catálogo/cart/modal/docs/tmp + `app/super-admin/(protected)/actions.ts` + `app/globals.css` — **no limpiados** |
| Checkout action / create_order / migrations / lib/cart | Sin cambios en esta fase |
| package.json / deps | Sin cambios |

Comandos: `git status --short`, `git branch --show-current`, `git rev-parse --short HEAD`, `git diff --stat` / `--name-only`. Sin reset/restore/stash/commit/push.

---

## 4. Source audit

| Área | Implementación actual | Riesgo | Decisión |
|------|-----------------------|--------|----------|
| Checkout route | `app/b/[slug]/checkout/page.tsx` → `CheckoutClient` | — | preservar |
| Cart hydration | `loadUnifiedCartItems` / keys public\|preview | — | preservar |
| Fulfillment values | `"delivery" \| "pickup"` | alto | no renombrar |
| Payment values | **ninguno en UI** | — | no inventar |
| Payload | `CreatePublicCheckoutOrderInput` | crítico | congelado |
| Validation | client early returns + action + RPC | crítico | conservar |
| Submit action | `createPublicCheckoutOrderAction` | crítico | no modificar |
| Preview guard | cookie + `isPreview` + UI disabled | crítico | no modificar |
| Success cleanup | removeItem legacy+v2 → `/success` | crítico | no modificar |
| UI/CSS | globals `.checkout-*` legacy; nuevo module | bajo | alcance principal |

---

## 5. Checkout architecture

```
/b/[slug]/checkout (RSC)
  └─ CheckoutClient (client)
       ├─ loadUnifiedCartItems(businessId, public|preview)
       ├─ buildHierarchicalCartRows → OrderSummary
       ├─ form #checkout-form → handleSubmit
       └─ createPublicCheckoutOrderAction(slug, payload)  // untouched
            └─ validateCheckoutCartForCreateOrder → create_order RPC
```

Styles: `components/public/checkout/checkout-client.module.css` (tokens). Legacy `.checkout-*` en `globals.css` queda muerto; no se extendió globals.

---

## 6. Form fields inventory

| Visible | HTML name | Inicial | Tipo | Required | Client validation | Server | Enviado | Condición | autocomplete / inputMode |
|---------|-----------|---------|------|----------|-------------------|--------|---------|-----------|--------------------------|
| Nombre | `customer_name` | `""` | text | sí | trim vacío → “Ingresá tu nombre.” | igual | `customerName` | siempre | `name`, capitalize words |
| Teléfono | `phone` | `""` | tel | sí | trim vacío | igual | `phone` | siempre | `tel`, `inputMode=tel` |
| Dirección | `address` | `""` | text | si delivery | trim si delivery | igual | `address` o `null` | `deliveryMethod==="delivery"` | `street-address` |
| Fecha entrega | `delivery_date` | min scheduled | date | si scheduled | rules helper | igual | `deliveryDate` o today | `scheduledModeActive` | — |
| Modalidad | `delivery_method` | `delivery` | radio | sí | enum | enum | `deliveryMethod` | siempre (ambas opts) | — |
| Notas | `notes` | `""` | textarea | no | — | optional null | `notes` o `null` | siempre | — |

Errores: superficie `role="alert"` (mismo set de mensajes; sin schema Zod nuevo).

---

## 7. Fulfillment model

| Interno | Label UI | Default | Condicional |
|---------|----------|---------|-------------|
| `delivery` | Envío (+ Bike) | **sí** | muestra Dirección |
| `pickup` | Retiro (+ Store) | no | oculta Dirección; copy “Retiro en {business.name}…” |

Ambas opciones siempre habilitadas en UI (sin flag de modalidad única en source audit). Pricing/disponibilidad no cambian al alternar. 0 fetch al cambiar.

---

## 8. Payment model

**NOT APPLICABLE.** No hay campos ni opciones de pago en el checkout actual. No se agregaron métodos.

---

## 9. Payload contract

`createPublicCheckoutOrderAction(slug, { customerName, phone, deliveryDate, deliveryMethod, address, notes, cart, isPreview: false })`

- `cart` vía `buildCheckoutCartPayload(latestUnified)`
- Sin campos nuevos; sin renombres.

---

## 10. Submit boundary

| Item | Valor |
|------|-------|
| Archivo action | `app/b/[slug]/checkout/actions.ts` |
| Función | `createPublicCheckoutOrderAction` |
| Handler UI | `handleSubmit` en `checkout-client.tsx` |
| Loading | `isSubmitting` → “Enviando…” |
| Preview | early return + CTA disabled + `CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE` |
| Closed store | `!onDemandModeActive` → mensaje + disabled |
| Success | clear localStorage keys + `router.push(/b/{slug}/success?order_id=…)` |
| QA | **SUBMIT REAL NOT EXECUTED BY SCOPE** |

---

## 11. Preview boundary

- Page: `isCatalogPreviewQueryFlag(orderopsPreview)`
- Storage scope: `preview`
- UI + server block intactos
- Runtime iframe auth: **UNVERIFIED**

---

## 12. Archivos creados

- `components/public/checkout/checkout-client.module.css`
- `docs/public-catalog-checkout-conversion-polish-1.md`

---

## 13. Archivos modificados

- `components/public/checkout/checkout-client.tsx`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

**No modificados:** `actions.ts`, `create_order`, migrations, `lib/cart/*`, cart sheet, customization modal, package.json.

---

## 14. Layout

Mobile: header → modality → contact → notes → summary → sticky CTA.  
Desktop ≥900px: form + sticky summary column; footer CTA `position: static`.

---

## 15. Header / navigation

- Back: `Link` → `catalogHref` (`/b/{slug}/catalogo` o preview path)
- Title: “Finalizá tu pedido”
- Sub: “Completá tus datos para enviarlo al negocio.”
- Target 44×44, `aria-label="Volver al catálogo"`, focus-visible
- Sin `router.back()`

---

## 16. Segmented control

`fieldset` + `legend` (sr-only) + radios reales `delivery`/`pickup`. Labels estilizados, min-height 2.75rem. En ≤359px apila a 1 columna.

---

## 17. Contact fields

Sección “Tus datos”; labels persistentes vía `Input`; autocomplete semántico; **sin** máscara/normalización AR.

---

## 18. Delivery / pickup

- Delivery: “¿Dónde lo entregamos?” + Dirección
- Pickup: info compacta con `business.name` (sin mapa/horarios inventados)
- Scheduled date: solo si `scheduled_mode_active` (misma lógica previa)

---

## 19. Payment methods

NOT APPLICABLE.

---

## 20. Notes

Textarea “Notas”; sección “Notas para el pedido”; hint “Aclaraciones…”; opcional; sin contador (sin límite conocido).

---

## 21. Order summary

`OrderSummary` + `buildHierarchicalCartRows` + `displaySummary` + `UPSELL_ASSOCIATED_LABEL` / `formatUpsellAssociatedLine`. Link “Editar pedido” → catálogo. Sin steppers.

---

## 22. Pricing and totals

Solo **Total** vía `getCartItemsTotal` + `formatPublicCatalogCurrency`. Runtime V2+upsell: **$ 12.000,00** (9000+3000). Sin filas ficticias.

---

## 23. CTA / footer

Sticky mobile: Total + submit del mismo form. Copy: `Enviar pedido · $X`. Preview: “Confirmación deshabilitada”. Loading: “Enviando…”. Un solo handler.

---

## 24. Validation UX

Reglas previas; errores en `role="alert"`. Runtime: submit vacío → “Ingresá tu nombre.” **antes** de action (0 create_order). Sin touched-state nuevo. Focus-to-first-invalid: no afirmado (no implementado).

---

## 25. Error handling

Alert accesible; mensajes customer-facing existentes; carrito/datos no se limpian en error client.

---

## 26. Empty cart

Sin form enviable; “Tu pedido está vacío” / “Agregá productos…” / “Volver al catálogo”. PASS runtime.

---

## 27. Store availability

`onDemandModeActive` gate + mensaje; CTA disabled. Runtime closed-store mutation: **UNVERIFIED** (no mutar sesión).

---

## 28. Responsive

| Viewport | Resultado |
|----------|-----------|
| 320×568 | segmented 1-col; overflowX false (CDP) |
| 390×844 | layout OK (snapshot) |
| 1280 desktop | summary `display:block`; sticky `static`; overflowX false |
| 360/412/430/tablet | emulación parcial; sin overflow reportado en 320/390/1280 |

Screenshots MCP: varios timeouts; evidencia vía snapshot + CDP metrics.

---

## 29. Accessibility

Headings lógicos; fieldset/legend; radios reales; labels; back aria-label; alert; focus-visible; targets ≥44px; reduced-motion CSS. **No** VoiceOver/TalkBack PASS afirmado.

---

## 30. Performance / network

| Interacción | Requests nuevos |
|-------------|-----------------|
| Cambiar modalidad | **0** (`resourceDelta: 0`) |
| Escribir nombre/teléfono | **0** |
| Cambiar pago | N/A |
| Validación client | **0** (sin Next-Action) |
| Submit | **NO EJECUTADO** |

Sin deps nuevas, Places, geocoding, Framer, blur costoso.

---

## 31. Runtime / browser QA

| Caso | Estado |
|------|--------|
| A Simple (Coca Cola) | PASS (pre-seed legacy) |
| B V2 Doble Smash + displaySummary | PASS (seed localStorage) |
| C V2 + upsell | PASS ($12.000; Adicional + Coca) |
| D Modalidad delivery | PASS |
| E Modalidad pickup | PASS; address hidden; 0 fetch |
| F Payment | NOT APPLICABLE |
| G Errores client | PASS (“Ingresá tu nombre.”); submit real NOT EXECUTED |
| H Loading visual | source-only (isSubmitting copy) |
| I Empty cart | PASS |
| J Preview admin | UNVERIFIED |
| K Negocio cerrado | UNVERIFIED runtime / source PASS |
| L Back → catálogo | PASS (`/b/demohamburgueseria/catalogo`) |

---

## 32. Resultado de comandos

| Command | Exit |
|---------|------|
| `npx tsc --noEmit` | **0** |
| `npm run build` | **0** |
| `git diff --check` (checkout) | **0** |

Lint: no ejecutado (deuda histórica).

---

## 33. Hallazgos

| Sev | Hallazgo |
|-----|----------|
| Info | Legacy `.checkout-*` en globals sin borrar (rollback/no scope cleanup) |
| Info | MCP screenshot timeouts; evidencia snapshot/CDP |
| Info | Sticky CTA puede cubrir campos al foco; mitigación `scroll-padding-bottom` en `.page` |
| Debt | Preview auth QA |
| Debt | Device real Android/iOS |
| Debt | Closed-store runtime |

Sin P0/P1 de payload/total/submit duplicado.

---

## 34. Seguridad / no-regression

Confirmado por diff: no DB/RLS/RPC/migration; no `actions.ts`; no cart schema/localStorage keys; no pricing formula; no Product Customization server; no CSP/PWA/env; no Google Places; no phone AR; no deps; no order real; no deploy/commit/push.

---

## 35. Deuda residual

- Preview iframe auth QA  
- Device QA hardware  
- Closed-store runtime  
- Submit real (fuera de scope)  
- Opcional: retirar CSS legacy `.checkout-*` en fase de cleanup  

---

## 36. Rollback plan

Revertir únicamente:

- `components/public/checkout/checkout-client.tsx`
- `components/public/checkout/checkout-client.module.css`
- docs (`public-catalog-checkout-conversion-polish-1.md`, entradas CURRENT_PHASE / LIVING_MEMORY)

No tocar action / create_order / cart / preview guard.

---

## 37. Próximo paso

**PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1** — funnel catálogo → modal → carrito → checkout sin pedido real.

Después: **PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1** (spec only).
