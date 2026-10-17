# T06-B — Preparación del webhook de Customers API

Fecha: 17 de octubre de 2026.

`COMMERCIAL_V1_T06B_TALO_WEBHOOK_PREP: READY_WITH_DEPENDENCIES`

No se creó un cliente, no se cambió un CVU y no se envió otro faucet. No hay ruta pública montada. El receptor no reconoce activaciones, mensualidades ni comisiones.

## URL del cliente actual

Customers API documenta `webhook_url` solo en `POST /customers/`, al crear el cliente. El único cambio documentado de un cliente existente es `PATCH /customers/{customer_id}/alias`. Ese llamado cambia el alias y puede liberar el CVU actual. No documenta `webhook_url`.

El SDK `talo-pay` 1.2.0 expone `customers.create`, `customers.get` y `customers.getTransaction`. No expone una actualización del cliente. El handler `createWebhookHandler` cubre el evento de un pago único (`paymentId`, `externalId`), no el de Customers API.

`orderops-qa-burger-house` sigue sin `webhook_url`. No hay un mecanismo oficial para agregársela sin crear otro cliente. Una entrega real exige, con autorización posterior, un segundo cliente ficticio de sandbox creado ya con la URL. Ese alta asigna otro CVU. No se usa `PATCH` de alias sobre el cliente actual.

## Receptor local

`receiveTaloCustomerWebhook` acepta solo `POST` con `application/json` de hasta 4096 bytes. Exige `message`, `transactionId` y `customerId`. Rechaza el evento de pago único, identificadores fuera de un alfabeto acotado y un `customerId` distinto del esperado. No registra el cuerpo ni el valor de `X-Talo-Signature`. La firma HMAC sigue anunciada por Talo como pendiente, así que la cabecera no autentica el aviso.

La confirmación es `GET /customers/{customerId}/transactions/{transactionId}` mediante un lector inyectado. El resultado separa `gross_amount`, `amount` y su diferencia, en centavos. Si falta uno de los dos importes, la lectura queda `unconfirmed`: un solo `amount` no se copia como bruto y neto. Los campos bancarios de la respuesta no salen del resultado. `economicRecognition` queda en `false`.

Un aviso ya observado con la misma pareja de identificadores responde duplicado y no vuelve a consultar la transacción. Una lectura fallida no se recuerda, para que un reintento pueda confirmarla. La memoria es local al proceso. No escribe en Supabase ni en la base principal.

## Qué falta para una entrega real

1. Autorización explícita para crear un segundo cliente ficticio con `webhook_url` en el alta.
2. Revisión de seguridad y un túnel HTTPS temporal hacia el receptor local. La base de `COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL` debe ser HTTPS, sin usuario, query ni fragmento. El túnel no apunta a Supabase ni al puerto de la base.
3. Montar el receptor recién después de esa revisión. Hoy no hay ruta en `app/api`.
4. Un almacén durable de avisos ya observados. La memoria de esta preparación no sobrevive un reinicio.
5. La firma `X-Talo-Signature`, cuando Talo la publique. Hasta entonces, el GET autenticado sigue siendo la confirmación.
6. No ejecutar faucet ni otra transferencia para forzar el aviso. El webhook no alcanza para dar un pago por acreditado.
