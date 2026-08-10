# PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-VALIDATION-SPEC-1

## Estado

**SPEC COMPLETE — ADDRESS MAPS VALIDATION MODEL A APPROVED**

Fase solo documentación. Sin runtime, CSS, actions, RPC, DB, payload, validaciones, Places behavior, commit, push ni deploy.

Fuentes: `docs/public-catalog-checkout-address-maps-validation-forensic-audit-1.md` + `docs/public-catalog-checkout-address-autocomplete-spec-1.md` (contrato V1).

## Contexto

OrderOps ya tiene Autocomplete Places (Data API) en checkout delivery. El contrato V1 persiste **solo texto** `address`. El forensic audit confirmó:

- no hay `place_id` / lat / lng en client state ni DB;
- manual address es válida;
- fallback Maps es helper, no error;
- admin opera con texto + Maps search URL;
- Delivery Mode geográfico **no** está activo.

Esta SPEC congela cómo evolucionar **sin** romper conversión ni `create_order` text-only.

## Decisión principal

```text
Modelo A — Metadata opcional con dirección manual permitida.
```

Definición congelada:

```text
- Dirección manual sigue siendo válida.
- Seleccionar sugerencia Places es opcional.
- Si el usuario selecciona sugerencia, capturamos metadata cuando esté disponible.
- Si no selecciona, el pedido continúa con address text no vacío.
- No se exige place_id.
- No se exige lat/lng.
- No se hace geocoding server-side.
- No se bloquea submit por ausencia de sugerencia / metadata.
```

Justificación:

| Factor | Por qué Modelo A |
|--------|------------------|
| Conversión | Estricto (B) fricción alta cuando Maps falla o key/quota cae |
| Maps availability | Audit QA: fallback frecuente; manual debe seguir |
| Fallback UX | Ya suavizado (“Podés escribir la dirección manualmente.”) |
| Contrato V1 | Autocomplete SPEC: texto suficiente; sin placeId/coords persistidos |
| DB/RPC | Solo `p_address text` / `orders.address text` |
| Delivery Mode | Sin routing geo aún → coords no desbloquean producto hoy |
| Submit surprises | Geocode server (C) introduce errores tardíos y costo/PII |

## Estado actual congelado

### AddressAutocomplete

```text
- value: string-only
- onChange: (value: string) => void
- no onSelect
- Places Data API (AutocompleteSuggestion + sessionToken)
- al seleccionar: fetchFields(["formattedAddress"]) → onChange(formattedAddress)
- no guarda place_id / placeId
- no guarda lat/lng
- no guarda address_components
- providerStatus: idle | loading | ready | unavailable
- fallback: “Podés escribir la dirección manualmente.” (helper, no alert)
- loading: “Cargando sugerencias...”
```

### Checkout / payload / DB

```text
- formState.address: string
- delivery: requiere address.trim() no vacío (client + action + RPC)
- pickup: payload address null (state local puede conservar texto)
- CreatePublicCheckoutOrderInput.address?: string | null
- create_order p_address: text | null
- orders.address: text | null
- success: no consume address
- admin: muestra/copia texto; buildOrderMapsUrl(address) = search query
```

## Modelo elegido: Metadata opcional

Places **mejora calidad** del texto y prepara futuro Delivery Mode; **no** es gate de submit.

Compatible con:

- Autocomplete SPEC V1 (manual always valid);
- Address fallback polish;
- Preview safety (sin pedidos reales);
- Backward compatibility de `create_order`.

## Modelos descartados por ahora

### Modelo B — Validación estricta

Exigir place_id / selección de sugerencia para delivery.

**Rechazado:** baja conversión; Maps down = checkout bloqueado; contradice V1 y fallback; API key/quota/referrer como SPOF.

### Modelo C — Geocoding server-side

Geocodificar al submit.

**Rechazado:** latency/costo; errores sorpresa; proxy key; logs PII; complejidad sin Delivery Mode listo.

## Metadata conceptual

Tipo **conceptual para la SPEC**. No implementar en esta fase.

```ts
type CheckoutAddressMetadata = {
  source: "manual" | "places";
  inputValue: string;
  formattedAddress?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  provider?: "google_places";
  selectedAt?: string; // ISO — opcional / debug
};
```

| Campo | Rol | MVP client | Future |
|-------|-----|------------|--------|
| `source` | manual vs places | **Sí** | — |
| `inputValue` | Texto visible aceptado | **Sí** (siempre si delivery) | — |
| `formattedAddress` | Normalizado Places | **Sí** si selección | — |
| `placeId` | ID Places si accesible sin request complejo extra | **Sí si trivial** | — |
| `latitude` / `longitude` | Location fields | No | **Sí** (Delivery Mode) |
| `address_components` | Desglose | No | Opcional |
| `provider` | `google_places` si places | **Sí** con places | — |
| `selectedAt` | Debug | Opcional / omitir si no aporta | — |

Reglas de transición de `source`:

```text
typing / edit after select → source = "manual" (metadata places invalidada o downgrade)
select suggestion → source = "places" + fields disponibles
pickup submit → ignorar metadata; address null
```

## Reglas MVP no negociables

```text
1. Delivery requiere address text no vacío.
2. Pickup envía address null.
3. Manual address sigue siendo válida.
4. Places selection mejora calidad; no desbloquea submit.
5. No bloquear pedidos si Maps falla.
6. No exigir place_id.
7. No geocoding server-side en submit.
8. No registrar API keys, cookies, tokens ni PII en logs/docs.
9. Preview nunca crea pedido real (UI + server).
10. create_order sigue funcionando con address text-only.
```

## UX states

### Manual

Usuario escribió (o editó post-selección). Sin warning. Submit OK si address no vacío.

### Places selected

Usuario eligió sugerencia. Hint opcional discreto: “Dirección seleccionada” (o check suave). Sin celebración ruidosa.

### Places unavailable

Fallback actual helper: “Podés escribir la dirección manualmente.” **No** `role="alert"`.

### Places loading

“Cargando sugerencias...” — puede permanecer igual.

### Pickup

Oculta address / autocomplete / hints metadata. Payload `address: null`. Metadata local **ignorada** en submit.

## Client-only metadata phase

**Próxima implementación autorizada:** `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-METADATA-CAPTURE-1`

```text
Nivel 1 — Client-only:
- sin server payload changes
- sin DB / RPC / types DB
- sin bloqueo de submit
- onChange string se conserva
- onSelect opcional para metadata
- objetivo: capturar + preparar UX
```

Archivos probables:

```text
components/public/checkout/address-autocomplete.tsx
components/public/checkout/checkout-client.tsx
docs/public-catalog-checkout-address-maps-metadata-capture-1.md
```

## Payload / DB persistence options

**Nivel 2 — Persisted metadata:** fase separada; no en METADATA-CAPTURE.

### Columnas additive

```text
orders.address_place_id text null
orders.address_latitude double precision null
orders.address_longitude double precision null
orders.address_formatted text null
orders.address_source text null
```

Pros: consultable; Delivery Mode.
Contras: migration + RPC + types.

### JSONB

```text
orders.address_metadata jsonb null
```

Pros: un campo flexible.
Contras: menos tipado; validación en app.

### No persistir todavía

Client-only.
**Recomendación inmediata:** esta opción hasta `PAYLOAD-CONTRACT-SPEC`.

Decisión de persistencia: en `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-PAYLOAD-CONTRACT-SPEC-1` (JSONB vs columnas), no en capture.

## Seguridad y privacidad

```text
- address es PII
- no loguear address completo en console/docs
- no copiar API keys
- no registrar network bodies con datos personales
- no guardar más metadata de la necesaria
- lat/lng aumentan sensibilidad → solo future + propósito documentado
- si se persiste metadata: documentar propósito operativo (entrega / Maps admin)
- preview: block client + server intacto
- QA: datos ficticios; create_order: 0 en fases de captura/UX
```

## Impacto futuro

### Admin

Hoy: texto + `buildOrderMapsUrl(text)`.
Con coords persistidas: link preciso; sin coords: fallback search.

### WhatsApp

Seguir con texto de dirección; metadata no requerida en templates MVP.

### Delivery Mode

lat/lng opcionales habilitan routing/geofence futuro sin reescribir checkout core.

### Success

Sin consumo de address hoy; no exigir metadata en success MVP.

## Fases posteriores propuestas

| # | Fase | Alcance |
|---|------|---------|
| 1 | `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-METADATA-CAPTURE-1` | Client onSelect + metadata; sin payload/DB; sin bloquear |
| 2 | `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-UX-POLISH-1` | Hint selected/manual; fallback intacto |
| 3 | `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-PAYLOAD-CONTRACT-SPEC-1` | Decidir persistencia JSONB vs columnas; impacto RPC/admin |
| 4 | `PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-PERSISTENCE-1` | Solo si se aprueba: migration additive + RPC + action + types |
| 5 | `PUBLIC-CATALOG-ORDER-ADDRESS-MAPS-CONSUMPTION-1` | Admin Maps por coords si hay; fallback texto |

Fuera de alcance inmediato: Modelo B/C; map rendering; server proxy Places; geocode al submit.

## Criterios de aceptación

Esta SPEC es PASS si:

```text
- Modelo A congelado
- Modelo B/C rechazados por ahora
- metadata conceptual definida (MVP vs future)
- fases posteriores separadas
- reglas MVP no negociables listadas
- UX states definidos
- payload/DB no tocados en esta fase
- próxima fase = client-only metadata capture
- gate a METADATA-CAPTURE claro
```

## Gate

```
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-METADATA-CAPTURE-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FORENSIC-AUDIT-1 = PAUSED
```
