# T06-B — WH02 webhook real de Talo Sandbox

Fecha: 17 de octubre de 2026.

`COMMERCIAL_V1_T06B_WH02: PASS`

No se reconoció un pago de Commercial Core. `economicRecognition` quedó en `false`. No hubo escrituras en `platform_collections`, obligaciones, comisiones ni suscripciones. El cliente `orderops-qa-burger-house` sigue en el listado, sin cambios.

## Cliente

Se creó una sola vez `orderops-qa-webhook-burger`, nombre `Burger Webhook QA`. La respuesta y dos lecturas del listado trajeron CVU y alias, y la segunda lectura coincidió con la primera. Esos datos no se guardan en el repositorio. `webhook_url` se envió en el alta. La URL era la del túnel temporal y ya quedó inactiva al cerrarlo. Customers API no documenta cómo cambiarla después.

## Transferencia

`POST /cvu/{cvu}/faucet` se envió una sola vez, por ARS 55.000, y respondió 200. El listado inmediato todavía no mostraba la operación. No se repitió el faucet. Una consulta posterior mostró una sola transacción de ese cliente: bruto ARS 55.000, neto ARS 54.334,50, diferencia ARS 665,50, estado `PROCESSED`.

## Webhook

El receptor no recibió de nosotros el identificador de esa transacción. Después del faucet, Talo entregó un `POST` al listener y el receptor lo confirmó con el GET autenticado, completando el bruto desde el listado autenticado porque el detalle trae el neto. Resultado: cliente `orderops-qa-webhook-burger`, bruto 5.500.000 centavos, neto 5.433.450 centavos, diferencia 66.550 centavos, estado `PROCESSED`, `economicRecognition: false`.

Una repetición sintética posterior, hecha por nosotros contra `127.0.0.1`, respondió `duplicate` y no volvió a leer importes. La memoria de ese duplicado muere con el proceso. T08–T09 necesita una tabla única por proveedor, cliente y transacción, con estados `received`, `pending_review` y `confirmed`, sin abrir una cobranza. La firma `X-Talo-Signature` sigue sin verificación.

## Cierre

El túnel y el listener quedaron detenidos. El puerto 3210 no escucha. La URL temporal no se versiona.
