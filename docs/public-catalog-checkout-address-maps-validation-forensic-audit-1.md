# PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-VALIDATION-FORENSIC-AUDIT-1

## Estado

**AUDIT COMPLETE — ADDRESS MAPS VALIDATION READY FOR SPEC**

Sin blockers P0 que impidan escribir un SPEC. Hay constraints de contrato V1 ya congelados (solo texto `address`) y deuda de entorno QA (Maps no cargó en esta sesión → fallback). Submit real **no ejecutado**.

## Git preflight

| Campo | Valor |
|-------|-------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `b2321b0` — `docs(public-catalog): audit checkout before flat polish` |
| Working tree | Dirty por fases Checkout previas (CSS/TSX + docs untracked) |
| Push / Deploy / Commit | no |
| Acciones destructivas | ninguna |

## Documentos revisados

| Documento | Estado |
|-----------|--------|
| `docs/public-catalog-checkout-forensic-audit-1.md` | Leído |
| `docs/public-catalog-checkout-flat-polish-1.md` | Leído |
| `docs/public-catalog-checkout-sticky-footer-safe-area-followup-1.md` | Leído |
| `docs/public-catalog-checkout-scroll-room-calibration-1.md` | Leído |
| `docs/public-catalog-checkout-copy-density-polish-1.md` | Leído |
| `docs/public-catalog-checkout-address-fallback-ux-1.md` | Leído |
| `docs/public-catalog-checkout-sticky-total-simplify-1.md` | Leído |
| `docs/public-catalog-checkout-dark-input-surface-tuning-1.md` | Leído |
| `docs/public-catalog-ui-redesign-cursor-handoff-2026-08-06.md` | Referenciado |
| `docs/public-catalog-ux-ui-redesign-spec-closure-1.md` | Referenciado |
| `docs/public-catalog-checkout-address-autocomplete-spec-1.md` | **Leído — contrato V1 congelado** |
| Docs Maps/Places adicionales en `docs/` | Varios admin-preview / dashboard; no hay spec de validación estricta de dirección |

## Archivos inspeccionados

| Archivo | Rol |
|---------|-----|
| `components/public/checkout/address-autocomplete.tsx` | Combobox Places |
| `components/public/checkout/address-autocomplete.module.css` | Estilos fallback/listbox |
| `components/public/checkout/checkout-client.tsx` | State + submit |
| `components/public/checkout/checkout-client.module.css` | UI (no lógica) |
| `lib/maps/google-maps-loader.ts` | Loader JS API + places |
| `app/b/[slug]/checkout/actions.ts` | Server action |
| `app/b/[slug]/checkout/page.tsx` | Preview flag |
| `app/b/[slug]/success/page.tsx` | Sin uso de address |
| `types/database.ts` | `orders.address`, `create_order` Args |
| `supabase/migrations/20260426221000_t3_orders_order_items.sql` | Columna `address text` + constraint delivery |
| `supabase/migrations/*create_order*` | `p_address text` |
| `lib/whatsapp/admin.ts` | `buildOrderMapsUrl(address)` |
| `components/admin/orders/order-delivery-section.tsx` | Display address |
| `components/admin/orders/order-external-actions.tsx` | Copy + Maps link desde texto |
| `lib/cart/local.ts` / `lib/checkout/argentine-phone.ts` / preview libs | Scope cart/preview (sin address geo) |

## AddressAutocomplete actual

**Componente:** `components/public/checkout/address-autocomplete.tsx`

**Props:**

```ts
value: string;
onChange: (value: string) => void;
disabled?: boolean;
inputId?: string; // default "address"
```

**No existe** prop `onSelect`.

| Pregunta | Evidencia |
|----------|-----------|
| Value type | `string` solamente |
| `onChange` dispara | Typing (`handleChange`) y selección (`selectSuggestion` → `onChange(formattedAddress)`) |
| `onSelect` | **No implementado** |
| Datos de sugerencia | `placePrediction.text` (display); `toPlace()` interno |
| `place_id` / `placeId` | **No se lee ni se guarda** |
| `formattedAddress` | Sí, solo al seleccionar: `fetchFields({ fields: ["formattedAddress"] })` |
| lat/lng / geometry | **No** — fields no incluyen location |
| `address_components` | **No** |
| `sessionToken` | Sí — `AutocompleteSessionToken`; se limpia tras selección / unmount |
| API | Place Autocomplete Data API vía `AutocompleteSuggestion.fetchAutocompleteSuggestions` (no AutocompleteService legacy) |
| Carga Maps | `loadGooglePlacesLibrary` → script `maps.googleapis.com/maps/api/js` + `importLibrary("places")` |
| Key | `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (no documentar valor) |
| Fallback si falla | `providerStatus = "unavailable"` |
| `providerStatus` | `idle` \| `loading` \| `ready` \| `unavailable` |
| Copy loading | “Cargando sugerencias...” (`role="status"`) |
| Copy fallback | “Podés escribir la dirección manualmente.” (`role="status"`, helper) |
| ARIA | `role="combobox"`, `aria-autocomplete="list"`, listbox/options, keyboard ↑↓/Enter/Escape |

Constantes: min query 3, debounce 250ms, max 5 sugerencias; `language: "es"`, `region: "AR"`, `includedRegionCodes: ["ar"]`.

## Checkout address state

| Hecho | Evidencia |
|-------|-----------|
| State | `CheckoutFormState.address: string` en `checkout-client.tsx` |
| Update | `handleFieldChange("address", value)` — merge plano; **no limpia** address al pasar a pickup |
| UI delivery | Muestra `AddressAutocomplete` |
| UI pickup | Oculta address; muestra `pickupInfo` |
| Payload delivery | `address: formState.address.trim()` |
| Payload pickup | `address: null` (texto puede quedar en state local) |
| Validación client | Delivery + `!formState.address.trim()` → “Ingresá la dirección de entrega.” |
| Manual | Siempre válida si no vacía |
| Selección sugerencia | Reemplaza string por `formattedAddress`; metadata no se conserva |

## Payload / server action / RPC

**Action input** (`CreatePublicCheckoutOrderInput`):

- `address?: string | null`
- Sin campos place/geo

**Orden server (relevante):** preview block → accepting orders → name → phone → deliveryMethod → **address trim required if delivery** → scheduled date → cart validate → RPC.

**RPC** `create_order`:

```
p_address?: string | null
```

(junto a business_id, customer_name, phone, delivery_date, delivery_method, notes, items)

**Persistencia:** `orders.address` = text trimmed o null.
**No hay** columnas `place_id`, `latitude`, `longitude`, ni jsonb de metadata de dirección en schema actual (`rg` migrations: 0 hits).

**Consumidores:**

- Admin delivery section: muestra `order.address`
- Admin external actions: copy + `buildOrderMapsUrl(address)` = Google Maps search query por texto
- Success page: **no** usa address
- WhatsApp admin templates: incluyen dirección como texto

## DB / order model

| Elemento | Estado |
|----------|--------|
| `orders.address` | `text` nullable |
| Constraint | Delivery requiere `char_length(trim(address)) > 0` |
| `create_order` | Valida address no vacío si delivery; inserta `nullif(trim(p_address),'')` |
| Geo columns | **Ausentes** |
| Migración para Model A persistido | Requeriría nueva columna(s) o jsonb + firma RPC + types + action |
| RLS | Orders ya multi-tenant por `business_id`; nuevos campos seguirían mismo patrón |

## Preview safety

| Capa | Comportamiento |
|------|----------------|
| Storage | `orderops-preview-cart:{businessId}` separado de public |
| Client | CTA disabled + early return en submit si `isCatalogPreview` |
| Server | `shouldBlockCatalogPreviewOrder` **antes** de accepting / validation / `create_order` |
| Maps en preview | Misma UI address; no crea pedido aunque autocomplete funcione |
| Riesgo pedido real al probar Maps | Bajo si se usa preview o no se hace submit; **no** probar submit real en público |

## Browser QA

Viewport primario **390×844**. Submit real: **no**. `create_order`: **0**.

### Manual address

- Valor conservado en input tras escribir (“Calle QA Manual…” / “Av Corrientes 1234”).
- Sin exigir sugerencia.

### Suggestions available

- **No observado en esta sesión:** `mapsScriptPresent: false`, `googleGlobal: false`, 0 options.
- Causa probable: key ausente/restringida/fallo de carga → `unavailable` inmediato.
- Path de selección auditado en source (no en browser).

### Suggestions unavailable / fallback

- Copy: **“Podés escribir la dirección manualmente.”**
- Manual usable.
- Sin `role="alert"`.

### Pickup

- Address/autocomplete ocultos.
- Payload previsto: `address: null` (source).
- Al volver a Envío, valor local de address **persiste** en el campo.

### Preview

- `?orderopsPreview=1`: CTA **Confirmación deshabilitada**, `disabled: true`, banner preview.
- `create_order`: 0.

### Empty cart

- Empty state; **sin** form/address/sticky.

## Console / network QA

| Ítem | Resultado |
|------|-----------|
| Scripts Maps | No insertados en esta sesión |
| Requests maps.googleapis / places | 0 observados |
| API key en docs | **No copiada** (redactada si apareciera) |
| Hydration | Sin hallazgos bloqueantes en smoke |
| `create_order` | 0 |
| Submit real | no |

## UX actual

- Dirección manual = flujo principal válido (alineado a SPEC V1 y fallback polish).
- Sugerencias = ayuda opcional cuando Places está ready.
- **No hay validación Maps** sin place_id (porque place_id no existe en el contrato).
- Cualquier texto no vacío pasa client/server/RPC para delivery.
- Confianza MVP: suficiente para operatoría con texto + link Maps search en admin; insuficiente para routing/geofence futuro sin metadata.

## Modelos de validación posibles

### Modelo A — Metadata opcional

Manual permitida; si hay selección, capturar place_id / formatted / lat/lng; **no bloquear** sin place_id.

| Dimensión | Evaluación |
|-----------|------------|
| Cambios | Client state + opcional payload/DB |
| Conversión | Baja fricción — **mejor para MVP** |
| Técnico | Medio si se persiste; bajo si solo client |
| DB/RPC | Necesario solo para persistir |
| UX | Compatible con fallback actual |
| Admin/delivery | Mejora Maps link / futuro routing |
| QA | Fallback + selección + pickup + preview |
| Rec. | **Recomendado** |

### Modelo B — Validación estricta

Delivery exige place_id/sugerencia.

| Dimensión | Evaluación |
|-----------|------------|
| Conversión | **Alta** fricción (key down, quota, typos AR) |
| Técnico | Medio |
| UX | Contradice SPEC V1 (“manual always valid”) y fallback polish |
| Rec. | **No ahora** |

### Modelo C — Geocoding server-side

Manual OK; server geocodifica al submit.

| Dimensión | Evaluación |
|-----------|------------|
| Técnico | Alto (proxy key, latency, quota, PII logs) |
| Conversión | Media (errores sorpresa al submit) |
| Rec. | **No ahora** |

## Recomendación

**Modelo A — metadata opcional**, en fases, **sin** exigir place_id.

Sostén:

1. SPEC V1 congelado: solo texto `address` es suficiente para pedido.
2. Fallback UX ya trata sugerencias como opcionales.
3. Schema/RPC solo aceptan `p_address text`.
4. Admin ya opera con texto + search URL.
5. Modelo B/C aumentan riesgo de conversión y complejidad sin Delivery Mode listo.

**Fases pequeñas propuestas:**

1. Client metadata capture (selected vs manual) — sin RPC.
2. UX hint selected/manual.
3. Payload/action contract (campos opcionales).
4. DB/RPC columns si se decide persistir.
5. Admin/success/dashboard consumption.

**No recomendado ahora:** bloquear manual; exigir place_id; geocode server en submit; cambiar `create_order` sin SPEC.

## Riesgos

| Área | Riesgo | Severidad | Evidencia | Recomendación |
|------|--------|-----------|-----------|---------------|
| Google Maps availability | Fallback permanente si key/quota falla | P1 | QA: script no cargó; fallback visible | Mantener manual; alertas quota |
| API key/referrer | Key mal restringida o ausente | P1 | `NEXT_PUBLIC_*`; SPEC seguridad | Keys separadas local/prod; no loguear |
| Manual fallback | Direcciones ambiguas/incorrectas | P2 | Cualquier string no vacío pasa | Modelo A; no Modelo B |
| place_id capture | Hoy se descarta en `fetchFields` | P2 | Solo `formattedAddress` | Capture opcional en fase metadata |
| lat/lng capture | No existe | P2 | Source + schema | Solo si Delivery Mode lo pide |
| Server payload | Solo string | P2 | `actions.ts` | Extender solo con SPEC |
| RPC `create_order` | Firma estable `p_address text` | P1 si se rompe | Migrations + types | Additive columns/params |
| DB schema | Sin geo | P2 | `orders.address` text | Migración dedicada |
| Preview safety | Bajo si se respeta preview | P1 mitigado | UI+server block | Probar Maps en preview; no submit público |
| Delivery conversion | Estricto baja conversión | P1 | SPEC V1 | Evitar Modelo B |
| Admin visibility | Solo texto | P3 | order-delivery-section | Mejorar tras metadata |
| Future delivery mode | Sin coords no hay routing | P2 | Roadmap | Modelo A prepara camino |
| Privacy/PII | Address es PII | P1 | Orders + WhatsApp | Mínimo necesario; no loguear bodies |
| Rate limits/quota | Costos Places | P1 | Session tokens ya usados | Conservar sesiones; alertas GCP |
| Offline/failure | Ya degradado a manual | P2 | `unavailable` | Preservar copy suave |
| A11y combobox | Ya implementado | P3 | ARIA presente | No romper en polish |

## Plan de implementación propuesto

Sin implementar en esta fase:

| Fase | Alcance |
|------|---------|
| `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-VALIDATION-SPEC-1` | Congelar Modelo A + campos opcionales + no-bloqueos |
| `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-METADATA-CAPTURE-1` | Client: placeId/lat/lng/formatted al select; flag manual vs selected |
| `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-PAYLOAD-CONTRACT-1` | Action/RPC/DB solo si SPEC lo exige |
| `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-UX-POLISH-1` | Hint selected/manual; sin exigir place |
| `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-QA-1` | Light/dark, fallback, preview, pickup, 0 pedidos reales |

### Permitido en metadata capture (sin DB)

- Estado client para suggestion metadata
- Hint visual selected/manual
- Sin payload server todavía

### Requiere DB/RPC/action

- Persistir place_id/lat/lng
- Validación server fuerte
- Admin maps por coords
- Delivery mode geográfico

### No recomendado ahora

- Bloquear manual / exigir place_id
- Geocoding server-side en submit
- Cambio grande de `create_order` sin SPEC

## Gate

```
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-VALIDATION-SPEC-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FORENSIC-AUDIT-1 = PAUSED
```
