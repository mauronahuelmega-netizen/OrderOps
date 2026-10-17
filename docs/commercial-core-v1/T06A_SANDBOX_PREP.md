# T06-A — Preparación sandbox Mobbex y Talo Pay

Fecha: 17 de octubre de 2026.

Rama: `cursor/commercial-core-v1-integration`.

CC-C19 está en el HEAD `0001ea79cf96c3804689dda04ac5d86693a6dea8`. Esta preparación no modifica el calendario ni el motor económico.

## Acceso

| Proveedor | Estado |
| --- | --- |
| Mobbex, credenciales públicas de prueba | Autenticación comprobada contra `https://api.mobbex.com`. No son la cuenta comercial de OrderOps. |
| Mobbex, cuenta comercial propia | `BLOCKED_BY_CREDENTIALS`. No hay variables en `.env.local`. |
| Talo sandbox | `BLOCKED_BY_CREDENTIALS`. El host `https://sandbox-api.talo.com.ar` respondió 401 sin token. No se creó un cliente ni se simuló una transferencia. |

Las credenciales públicas de Mobbex están publicadas por el proveedor para su cuenta Demo. No se copian a este repositorio ni a variables `NEXT_PUBLIC_*`.

## Credenciales que faltan cargar

Servidor solamente:

- `MOBBEX_API_KEY`
- `MOBBEX_ACCESS_TOKEN`
- `MOBBEX_TEST_MODE` con valor `true`
- `TALO_SANDBOX_API_URL` con origen `https://sandbox-api.talo.com.ar`
- `TALO_USER_ID`
- `TALO_CLIENT_ID`
- `TALO_CLIENT_SECRET`
- `COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL`, HTTPS, sin usuario, query ni fragmento

Talo emite el token con `POST /users/{user_id}/tokens`. El `alias_prefix` se configura en el panel o con `PATCH` al usuario. Sin ese prefijo, Customers API responde `user.alias.prefix.not.set`.

## Lo que respondió Mobbex

Con las credenciales públicas y `test: true`:

- Sin cabeceras, el checkout responde 401.
- Con cabeceras, el listado de suscripciones responde `result: true`.
- Un checkout de ARS 290.000 responde `result: true`, moneda ARS y ese total. La respuesta trae un identificador. No se pagó.
- Una suscripción dynamic de ARS 55.000, intervalo `1m`, `trial: 1`, `limit: 12`, `initialDay: 10`, `startOnInitialDay: true` y `features: ["no_retry"]` se creó en modo test. La consulta posterior por uid confirmó total, intervalo, trial, límite, `no_retry`, `embed: true` y `test: true`.
- El alta de la suscripción devolvió `initialDay: 10`. La consulta posterior no lo repitió en el primer nivel.
- No se creó un suscriptor ni se ejecutó un cobro. El inicio diferido quedó aceptado como campo, no observado como una ejecución.
- `no_retry` quedó guardado en la suscripción. No se comprobó que frene un reintento ya lanzado.
- `GET /2.0/transactions/coupons/{id}` de un checkout impago devolvió `result: true` y una lista vacía. `GET /p/operations/{id}` no devolvió la operación. La consulta de una operación pagada sigue sin verificar.
- El checkout aceptó `options.embed`, pero su respuesta no devolvió esa opción. El SDK embebido 1.0.23 está documentado. El modal no se abrió en esta preparación.

## Talo, solo documentación y host

Customers API de sandbox: `POST /customers/` con `user_id`, `alias`, `customer_id` y `name`. La respuesta documentada trae un CVU y un alias estables. `GET /customers/?user_id=` lista clientes. `GET /customers/{customer_id}/transactions/{transaction_id}` confirma una transacción. El simulador es `POST /cvu/{cvu}/faucet`. Nada de eso se ejecutó.

El webhook de Customers trae `message`, `transactionId` y `customerId`. El de un pago único trae `paymentId` y `externalId`. Hay que responder 200 y confirmar con el GET autenticado. `X-Talo-Signature` sigue anunciada como pendiente. El cuerpo del webhook no alcanza para marcar una obligación pagada.

## Arquitectura que queda para el adaptador

Una obligación por concepto y período sigue siendo la de `platform_obligations`. Mobbex y Talo no crean el contrato. La activación, la mensualidad, el medio, el identificador externo, la acreditación y la comisión quedan separados. La interfaz ofrecerá tarjeta Mobbex y CVU Talo. Mobbex conserva la tarjeta. Talo muestra el CVU. Cerrar el checkout no salda la obligación.

## Callbacks

Mobbex documenta `webhook` y `return_url` al crear checkout o suscripción. El webhook de suscriptores sale como `application/x-www-form-urlencoded`. La vuelta agrega `reference`, `status`, `uid` y `sid`. Un status de cancelación no es un cobro.

Talo necesita una URL HTTPS pública. En local hace falta un túnel. El worker consulta el recurso con el token de sandbox y solo entonces puede imputar, por el flujo económico ya existente.

## Restricciones

No usar `https://api.talo.com.ar` ni credenciales productivas. No completar un pago del checkout de prueba. No guardar PAN ni CVV. No crear obligaciones ni cobros en OrderOps desde esta preparación. `BLK-ECO-01`, `BLK-ECO-02`, `BLK-ECO-03` y `BLK-PRIV-01` siguen abiertos.

## Dependencias de los lotes siguientes

T06-B, T07 y T08 no empiezan con este documento. Antes de un adaptador hacen falta la cuenta sandbox de Talo, una URL pública de webhooks, y una decisión sobre si la cuenta Demo pública de Mobbex alcanza o si OrderOps espera su propia entidad. También falta ver un cobro de prueba consultado por identificador, un suscriptor con el primer período realmente diferido, y un reintento ya iniciado que `no_retry` detenga. La firma HMAC de Talo no está disponible.
