# PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-METADATA-CAPTURE-1

## Estado

**PASS WITH MAPS QA DEBT — ADDRESS MAPS METADATA CAPTURE CLIENT-ONLY**

Implementación client/source correcta. Browser no pudo probar selección real de Places (API key/env → fallback). Manual / pickup / preview / fallback / sticky / dark OK. `create_order`: 0.

## Contexto

Modelo A (SPEC): metadata opcional; manual válida; sin payload/DB/RPC; sin exigir place_id.

## Cambios aplicados

### `address-autocomplete.tsx`

- Export `CheckoutAddressMetadata` (`source`, `inputValue`, `formattedAddress?`, `placeId?`, `provider?`).
- Prop opcional `onSelect?: (metadata) => void`.
- `onChange(string)` preservado.
- En `selectSuggestion`: `onChange(formattedAddress)` luego `onSelect({ source: "places", ... })`.
- Typing: solo `onChange` (parent marca manual).
- Debounce / query / sessionToken / ARIA / fallback: sin cambios.

### `checkout-client.tsx`

- State `addressMetadata` client-only.
- `handleAddressInputChange` → address + metadata `manual` (o `null` si vacío).
- `handleAddressSelect` → metadata `places`.
- Pickup (`deliveryMethod === "pickup"`) limpia metadata; address string se conserva al volver a Envío.
- Submit payload **sin** metadata (solo `address` text / null).
- `data-address-source` / `data-address-has-place-id` en wrapper (QA, sin copy visible).

## AddressAutocomplete metadata contract

```ts
onChange: (value: string) => void; // required, unchanged
onSelect?: (metadata: CheckoutAddressMetadata) => void; // additive
```

Select path: formattedAddress → onChange → onSelect(places).

## Checkout client metadata state

| Evento | address string | addressMetadata |
|--------|----------------|-----------------|
| Typing | actualizado | `{ source: "manual", inputValue }` o null |
| Select Places | formattedAddress | `{ source: "places", ... }` |
| Pickup | preservado en state (UI oculta) | `null` |
| Submit delivery | trim → action | **no enviado** |
| Submit pickup | `null` → action | ignorado |

## placeId availability

| Resultado | **No garantizado / undefined si no expuesto** |
|-----------|-----------------------------------------------|
| Estrategia | Lectura trivial de `prediction.placeId` o `place.id` sin request extra ni `fetchFields` adicional |
| Tipos locales | Narrowing sin `any` / sin cambiar `google-maps-loader` |
| QA browser | No medible sin Places ready → documentado como debt |

## Manual vs places transitions

1. Manual type → `data-address-source="manual"` (verificado browser).
2. Select → places (source path; browser select diferido).
3. Edit after select → `handleAddressInputChange` downgrade a manual (source path).
4. onChange→onSelect order: estado final places tras select.

## Payload / DB / RPC

```text
DB changes: 0
RPC/action changes: 0
CreatePublicCheckoutOrderInput: sin metadata
create_order p_address: text-only intacto
geocoding: 0
persisted metadata: 0
```

## Browser QA

### Manual address

PASS — value conservado; `data-address-source=manual`; sin exigir sugerencia.

### Edit after selected

PASS (source) / QA browser diferido — sin options en sesión.

### Select suggestion

**QA debt** — `mapsScript: false`, 0 options, fallback visible. Path source implementado.

### Pickup

PASS — address UI/metadata host ocultos; payload previsto `address: null`.

### Preview

PASS — CTA disabled; create_order 0.

### Fallback / dark regression

PASS — helper “Podés escribir la dirección manualmente.”; sticky compacto gap 12; dark input lift intacto.

## Console / network QA

- create_order: **0**
- Submit real: no
- Maps script: no cargó (env)
- API keys / PII: no registradas

## Validación

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- HTTP catalogo/checkout/success: **200**
- `tsconfig.tsbuildinfo`: restaurado si dirty

## Contratos preservados

- Manual address / fallback / preview / phone / totals / sticky / dark inputs
- Action / RPC / DB / validation order — **0 cambios de contrato**

## Deuda aceptada

- Browser select Places no verificado por API key/env.
- `placeId` puede quedar `undefined` si la runtime no expone id trivialmente.
- UX hints selected/manual → fase `UX-POLISH-1`.

## Gate

```
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-UX-POLISH-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-PAYLOAD-CONTRACT-SPEC-1 = PAUSED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FORENSIC-AUDIT-1 = PAUSED
```
