# PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-SPEC-1
## Provider, Security, UX and Integration Contract

## 1. Estado

SPEC COMPLETE — ADDRESS AUTOCOMPLETE CONTRACT FROZEN

Esta fase es exclusivamente de especificacion. No introduce runtime, CSS, migraciones, cambios de RPC, cambios de checkout action, configuracion de proveedor, commit, push ni deploy.

QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-IMPL-1 = ALLOWED

QUEUE_GATE: PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1 = BLOCKED

## 2. Resumen ejecutivo

OrderOps incorporara autocompletado de direccion solamente en el checkout publico y solamente cuando el cliente elija envio. La fuente de sugerencias V1 sera Google Maps JavaScript API, mediante Place Autocomplete Data API y una lista de resultados propia y accesible; el campo manual sigue siendo siempre valido y suficiente para completar el pedido.

La integracion conserva el contrato actual: se persiste unicamente el texto final de `address`. No se almacenan `placeId`, coordenadas, predicciones, consultas, datos de geocodificacion ni metadatos del proveedor.

## 3. Arquitectura actual auditada

| Area | Archivo auditado | Hecho actual |
| --- | --- | --- |
| Estado del checkout | `components/public/checkout/checkout-client.tsx` | `CheckoutFormState` conserva `deliveryMethod` y `address` como string local. |
| Campo de direccion | `components/public/checkout/checkout-client.tsx` | Input de texto con `autoComplete="street-address"`, visible y requerido solo para `delivery`. |
| Submit publico | `components/public/checkout/checkout-client.tsx` | Envia `address.trim()` para envio y `null` para retiro. |
| Validacion server-side | `app/b/[slug]/checkout/actions.ts` | Requiere direccion no vacia para envio y pasa texto a `p_address`. |
| Persistencia | `app/b/[slug]/checkout/actions.ts` | El RPC existente recibe solamente `p_address`; no hay entidad de lugar. |
| Operacion posterior | `components/admin/orders/order-external-actions.tsx` | Admin muestra/copia el texto y construye el enlace de mapas desde ese texto. |
| CSP en codigo | `next.config.*`, `middleware.*` | No se encontro una politica CSP gestionada por la aplicacion. |

Conclusion: el componente nuevo reemplaza visualmente el input de direccion en el cliente; no cambia `CheckoutFormState`, `createPublicCheckoutOrderAction`, `create_order` ni el esquema de datos.

## 4. Proveedor y API elegidos

**Proveedor V1:** Google Maps Platform.

**API concreta:** Maps JavaScript API con su biblioteca `places`, usando **Place Autocomplete Data API** programatica. La implementacion llamara `AutocompleteSuggestion.fetchAutocompleteSuggestions()` y, solo al elegir una sugerencia, ejecutara `placePrediction.toPlace().fetchFields({ fields: ["formattedAddress"] })`.

Se elige la Data API, no el widget legacy y no una API REST propia, porque permite una lista que respeta el sistema visual y el contrato de accesibilidad de OrderOps sin introducir un backend proxy ni una dependencia nueva. Google documenta el flujo de sugerencias, `toPlace`, `fetchFields` y el uso de sesiones en su guia oficial de [Place Autocomplete Data API](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data).

Decisiones congeladas:

```text
PROVIDER = Google Maps Platform
AUTOCOMPLETE_API = Place Autocomplete Data API via Maps JavaScript API places library
IMPLEMENTATION_STYLE = custom React accessible combobox over official data API
LEGACY_AUTOCOMPLETE = NOT ALLOWED
SERVER_PROXY = NOT USED
MAP_RENDERING = NOT USED
NEW_DEPENDENCY = NOT ALLOWED
```

## 5. Google Cloud, facturacion y cuota

Antes de habilitar la feature, el responsable de infraestructura debe:

1. Crear o usar un proyecto de Google Cloud exclusivo para OrderOps production.
2. Asociar una cuenta de facturacion activa a ese proyecto.
3. Habilitar **Maps JavaScript API** y **Places API (New)**, y restringir la clave a esas APIs; no habilitar APIs de Maps no requeridas.
4. Configurar cuota de Place Autocomplete y alertas de presupuesto en Google Cloud. La cuota debe ser inicialmente conservadora y revisada tras el QA; no se fija una cifra en codigo ni se confia en limites por defecto.
5. Mantener una clave separada para desarrollo local si se necesita; production no reutiliza una clave sin restricciones.

Las sesiones son obligatorias por costo: se crea `AutocompleteSessionToken` al primer query elegible, se adjunta a cada consulta de esa sesion y se termina mediante `fetchFields` al seleccionar una direccion. Luego se descarta y se crea uno nuevo para una nueva busqueda. Google explica que el token agrupa consultas y la seleccion para facturacion, y que reutilizarlo entre sesiones invalida el agrupamiento. Vease [sesiones de Place Autocomplete](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data#session_tokens) y [uso y facturacion de Places](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing).

```text
QUERY_MINIMUM_LENGTH = 3 non-whitespace characters
DEBOUNCE = 250 ms
MAX_VISIBLE_SUGGESTIONS = 5
SESSION_TOKEN = one fresh token per user search session
SESSION_END = successful fetchFields, delivery mode exit, component unmount, or 3 minutes idle
```

Una falla de cuota, billing, red o proveedor no bloquea el checkout: se limpia la lista, se muestra un mensaje no invasivo y se mantiene la entrada manual.

## 6. Clave publica, restricciones y CSP

La clave se expone deliberadamente al navegador bajo `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; una clave de Maps JavaScript API no es un secreto de servidor, pero debe limitarse por origen y por API. No se agregara su valor a documentacion, logs, errores, analytics ni repositorio.

```text
PRODUCTION HTTP REFERRER = https://orderops.vercel.app/*
CUSTOM DOMAIN REFERRER = each verified production catalog origin explicitly, if introduced
LOCAL DEVELOPMENT REFERRERS = http://localhost:*/* and http://127.0.0.1:*/* only on a separate development key
VERCEL PREVIEW KEY = disabled by default; manual fallback is the preview behavior
API RESTRICTIONS = Maps JavaScript API + Places API (New) only
KEY ROTATION = documented Google Cloud operation; never committed
```

Google recomienda aplicar restricciones de aplicacion y API a cada clave; la implementacion debe verificar esas restricciones antes de activar el feature. Fuente: [Google Maps Platform security guidance](https://developers.google.com/maps/api-security-best-practices).

La carga usa el patron oficial del [loader de Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/load-maps-js-api), una sola vez por documento, con `v=weekly` y carga posterior de `google.maps.importLibrary("places")`. Se inicia solo al entrar a envio y enfocar o editar el campo. En un checkout que comienza y permanece en retiro no se inserta script ni se hace request al proveedor. Si el usuario alterna de envio a retiro despues de cargarlo, se descartan token, lista y listeners; el script ya cargado puede permanecer cacheado, pero no se realizan nuevas llamadas.

`CSP CURRENT STATE = no app-managed CSP found in next config or middleware.` Antes de activar production, IMPL-1 debe inspeccionar los headers efectivos del hosting. Si hay CSP de plataforma o reverse proxy, debe permitir exclusivamente los orígenes que Google requiere para la API seleccionada, siguiendo la [guia oficial de CSP de Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/content-security-policy). Como minimo para este flujo sin mapa:

```text
script-src: https://maps.googleapis.com https://maps.gstatic.com
connect-src: https://maps.googleapis.com https://places.googleapis.com https://*.googleapis.com
img-src: https://maps.gstatic.com https://*.gstatic.com data:
```

La implementacion no agregara `unsafe-eval`, no ampliara `connect-src` a comodines ajenos a Google y no relajara directivas existentes. Si la politica efectiva exige dominios adicionales documentados por Google para la version cargada, se agregaran solo esos dominios con evidencia de red; de no poder hacerlo, la feature queda desactivada y el fallback manual permanece.

## 7. Contrato funcional

```text
SURFACE = public checkout only
DELIVERY = autocomplete enabled
PICKUP = autocomplete absent and no provider request
INPUT = editable manual address field at all times
COUNTRY = Argentina
LANGUAGE = Spanish
QUERY_REQUEST = normalized visible input after debounce and minimum length
SUGGESTION_SELECTION = writes formattedAddress to formState.address
SUBMIT = unchanged; existing delivery validation accepts non-empty text
```

La request de sugerencias usa `input`, `sessionToken`, `language: "es"`, `region: "AR"` e `includedRegionCodes: ["ar"]`. V1 no usa `locationRestriction`, geolocalizacion, coordenadas de tienda, sesgo por ubicacion, tipo de lugar ni ranking propio. Esto evita pedir permiso de ubicacion y mantiene el alcance nacional argentino.

El usuario puede ignorar sugerencias, escribir una direccion completa, editar una direccion elegida o borrar el campo. Una seleccion reemplaza el valor actual por `formattedAddress`; despues de la seleccion, cualquier edicion vuelve el campo a modo manual sin efectuar una nueva consulta hasta que haya otra entrada elegible.

Los resultados se cancelan visualmente ante una respuesta antigua: cada query recibe un contador local y solo puede pintar la respuesta correspondiente al ultimo input. No se envian requests en cada pulsacion: aplica el debounce definido y se omiten valores vacios o menores a tres caracteres.

## 8. Datos almacenados y compatibilidad

```text
PERSISTED_ADDRESS = formattedAddress selected by the user, or manually typed text
NOT_PERSISTED = place ID, latitude, longitude, prediction list, query history, session token, provider metadata
DB MIGRATION = none
RPC CHANGE = none
SERVER ACTION CHANGE = none
ORDER ADMIN COMPATIBILITY = preserved
```

El valor persistido sigue siendo el string `address` que hoy consume `create_order` y el panel de pedidos. La sugerencia no prueba cobertura de reparto, exactitud de piso/departamento ni validez operativa; esos datos siguen siendo responsabilidad de la operacion del negocio y del texto que el cliente puede editar.

## 9. Arquitectura propuesta para IMPL-1

IMPL-1 agregara un componente cliente aislado, por ejemplo `components/public/checkout/address-autocomplete.tsx`, consumido por `CheckoutClient` solamente dentro de la rama `delivery`. El componente recibe `value`, `onChange`, `disabled` y el identificador accesible del campo; no conoce carrito, RPC, tenant, orden ni datos administrativos.

Responsabilidades del componente:

1. Renderizar el input existente o un wrapper semantico equivalente conservando `name="address"`, `autoComplete="street-address"`, `required` y el valor controlado.
2. Cargar Google de forma diferida y deduplicada a nivel documento.
3. Mantener query, sugerencias, indice activo, request sequence, estado de proveedor y token en memoria del componente.
4. Transformar una seleccion en `formattedAddress` y llamar al `onChange` existente.
5. Mostrar atribucion requerida por Google para resultados provenientes de la Data API, usando el recurso/markup oficial aplicable; no inventar marca ni ocultarla.

El loader, las declaraciones TypeScript globales y la normalizacion de errores del proveedor deben vivir en modulo cliente separado. No se agrega fetch server-side, route handler, server action ni cache tag. El unico request externo permitido pertenece a Google Maps Platform desde el navegador del cliente.

## 10. UX, teclado y accesibilidad

El control usa el patron ARIA combobox: input con `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` y `aria-activedescendant` cuando hay opcion activa. La lista usa `role="listbox"`; cada sugerencia usa `role="option"` y refleja `aria-selected`.

| Interaccion | Comportamiento congelado |
| --- | --- |
| Escribir | Conserva texto manual; busca luego de 250 ms si hay 3 caracteres validos. |
| Flecha abajo/arriba | Abre o recorre sugerencias sin mover el foco fuera del input. |
| Enter | Selecciona solo la sugerencia activa; sin opcion activa preserva el submit normal del formulario. |
| Escape | Cierra la lista sin borrar el texto. |
| Tab / Shift+Tab | Cierra la lista y conserva la navegacion normal del formulario. |
| Click/tap fuera | Cierra la lista sin borrar el texto. |
| Click/tap sugerencia | Selecciona y devuelve foco al input. |
| Error de proveedor | Expone mensaje breve con `aria-live="polite"`; el input manual permanece operativo. |

No habra foco atrapado, modal, mapa, geolocalizacion ni bloqueo de submit. La lista se posiciona bajo el input, permanece dentro del contexto del checkout y su `z-index` queda por encima del formulario pero debajo de overlays ya existentes (CartSheet, modal de producto y post-add). En mobile debe evitar tap targets menores a 44 px y no quedar cubierta por el teclado; la pagina puede desplazar el input al viewport, sin scroll lock.

## 11. Privacidad, seguridad y observabilidad

Solo se transmite a Google el texto de direccion que el usuario empieza a escribir al cumplir el minimo, junto con los parametros de idioma, region y sesion necesarios. No se transmiten nombre, telefono, notas, carrito, slug, identificadores de pedido, datos admin ni eventos de checkout.

```text
RAW_ADDRESS_QUERY_LOGGING = prohibited
SUGGESTION_PAYLOAD_LOGGING = prohibited
PLACE_ID_PERSISTENCE = prohibited
ANALYTICS = aggregate operational counters only
ALLOWED COUNTERS = loader success/failure, autocomplete request count, selection count, provider fallback count
```

Los eventos agregados no incluyen texto, IDs de lugar, token, direccion ni identificadores personales. Los errores de Google se muestran como estado genérico y no exponen clave, URL firmada, payload ni detalles internos.

## 12. Scope de implementacion aprobado

IMPL-1 puede modificar solamente superficies necesarias para:

1. Crear el componente cliente y sus estilos locales de autocomplete.
2. Integrarlo en el campo de direccion de envio de `CheckoutClient`.
3. Declarar la variable documentada en `.env.example` sin valor real: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=`.
4. Agregar CSP solo si existe una politica aplicable y tras confirmar headers efectivos, con el alcance minimo definido en esta spec.
5. Añadir tests unitarios del reducer/estado y QA del control, sin requests reales de Google durante pruebas automatizadas.

Fuera de alcance:

```text
address validation API
service-area enforcement
geocoding persistence
coordinates or place IDs
map display
geolocation
database migration
RPC or create_order changes
admin address changes
checkout submit behavior changes
server-side provider proxy
new dependency
```

## 13. Matriz de QA y aceptacion

| Caso | Resultado requerido |
| --- | --- |
| Retiro desde carga inicial | No script, no request ni UI de Google. |
| Envio, menos de 3 caracteres | Input manual, sin request. |
| Envio, query elegible | Una consulta debounced por valor estable; maximo 5 opciones. |
| Respuesta tardia | No reemplaza sugerencias de una query mas nueva. |
| Seleccion | `formattedAddress` completa el input; token termina; no cambia submit. |
| Entrada manual | Direccion escrita se envia como hoy aunque proveedor falle. |
| Alternar a retiro | Lista y token se eliminan; no hay llamadas posteriores. |
| Teclado | Flechas, Enter, Escape, Tab y Shift+Tab respetan el contrato. |
| Screen reader | Etiqueta, expansion, opciones y error son anunciables; QA manual obligatorio. |
| Mobile 320/390/430 px | Sin overflow horizontal, lista visible y targets >= 44 px. |
| CSP/clave restringida | Carga en production permitida solo desde origen y APIs autorizados. |
| Submit delivery | `address` sigue siendo string no vacio; no hay cambios de RPC ni pedido de prueba. |
| Observabilidad | No aparecen queries, direcciones, tokens ni datos personales en logs. |

Criterios de aceptacion para cerrar IMPL-1:

```text
MANUAL_FALLBACK = PASS
PICKUP_NO_PROVIDER_REQUEST = PASS
DELIVERY_SELECTION_WRITES_ADDRESS = PASS
KEYBOARD_COMBOBOX = PASS
NO_ADDRESS_DATA_MODEL_CHANGE = PASS
KEY_RESTRICTIONS_VERIFIED = PASS
CSP_EFFECTIVE_HEADERS_VERIFIED = PASS or NOT APPLICABLE
NO_PII_PROVIDER_LOGGING = PASS
```

## 14. Riesgos y requisitos externos

| Riesgo o requisito | Resolucion / owner |
| --- | --- |
| Billing o APIs no habilitadas | Google Cloud owner antes de habilitar la variable en production. |
| Clave sin restricciones | Bloquea activacion; aplicar referrer y API restrictions. |
| CSP externa desconocida | Release owner valida headers de production y ajusta solo allowlist minima. |
| Cuota agotada o proveedor caido | Fallback manual, sin bloqueo de checkout; revisar alertas y cuota. |
| Direccion sugerida no apta para delivery | No se interpreta como cobertura; operacion conserva su verificacion actual. |
| Atribucion requerida | IMPL-1 usa y valida la atribucion oficial de la Data API. |
| Cobertura real de teclado/screen reader | QA manual con navegador y lector real; no se declara por emulacion. |

## 15. Fuentes oficiales

1. Google, [Place Autocomplete Data API](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data): sugerencias, `fetchFields`, sesiones y muestra TypeScript.
2. Google, [Load the Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/load-maps-js-api): carga dinamica e `importLibrary`.
3. Google, [Places API Usage and Billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing): facturacion, cuotas y presupuesto.
4. Google, [Google Maps Platform security guidance](https://developers.google.com/maps/api-security-best-practices): restriccion de claves por aplicacion y API.
5. Google, [Content Security Policy Guide](https://developers.google.com/maps/documentation/javascript/content-security-policy): directivas y dominios requeridos por Maps JavaScript API.

## 16. Gate y proximo paso

```text
SPEC COMPLETE — ADDRESS AUTOCOMPLETE CONTRACT FROZEN
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-IMPL-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1 = BLOCKED
NEXT STEP = PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-IMPL-1
```

IMPL-1 implementara este contrato sobre la rama del residual roadmap. No se publica ni se despliega funcionalmente hasta `PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1`.
