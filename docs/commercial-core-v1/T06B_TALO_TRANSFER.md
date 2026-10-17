# T06-B — Transferencia ficticia Talo Sandbox

Fecha: 17 de octubre de 2026.

Cliente existente: `orderops-qa-burger-house`. No se creó otro cliente ni otro CVU. No hubo escrituras en OrderOps.

## Resultado

`COMMERCIAL_V1_T06B_TALO_TRANSFER: PASS`

`POST /cvu/{cvu}/faucet` se envió una sola vez a `https://sandbox-api.talo.com.ar`, por ARS 290.000. El listado autenticado de transacciones muestra una sola operación de ese cliente: bruto ARS 290.000, neto ARS 286.491, moneda ARS, estado `PROCESSED`. El saldo del cliente quedó en ARS 290.000. El neto corresponde a la comisión que Talo informa en la transacción; no se creó una comisión de OrderOps.

`GET /customers/orderops-qa-burger-house/transactions/{transaction_id}` confirmó la misma operación. Una segunda ejecución de la sonda no envió otro faucet. Después del movimiento, el listado sigue devolviendo el mismo CVU y el mismo alias. Esos números no se guardan en el repositorio.

## Webhook

El cliente no tiene `webhook_url`. No se creó otro cliente para simular una entrega. Un webhook real se probará después, contra una URL pública HTTPS. El aviso trae `transactionId` y `customerId`; la acreditación se confirma con el GET autenticado. El webhook no alcanza para marcar una obligación pagada.

## Integración pendiente

Falta vincular esta transacción a una obligación de Commercial Core, separar el bruto de ARS 290.000 del neto, y recibir el webhook en un endpoint propio. No se inicia esa integración en este lote.
