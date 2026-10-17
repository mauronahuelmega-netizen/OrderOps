# T06-B — Receptor HTTPS de prueba para Talo Sandbox

Fecha: 17 de octubre de 2026.

`COMMERCIAL_V1_T06B_WEBHOOK_HTTPS_PREP: READY_WITH_DEPENDENCIES`

No se inició un túnel, no se creó `orderops-qa-webhook-burger` y no se envió otro faucet. El cliente `orderops-qa-burger-house` no se modificó. No se reconocieron pagos.

El antecedente de la transferencia ya confirmada sigue siendo el de [T06B_TALO_TRANSFER.md](T06B_TALO_TRANSFER.md): bruto ARS 290.000, neto ARS 286.491, estado `PROCESSED`. Esta preparación no vuelve a leer ni a mover esa operación.

## Ruta

`POST /api/commercial/talo/sandbox-customer-webhook`

El archivo de Next existe y reutiliza `receiveTaloCustomerWebhook`. No hay un segundo validador. Con el entorno normal responde 404. También responde 404 si `NODE_ENV` es `production` o si `TALO_SANDBOX_API_URL` no es `https://sandbox-api.talo.com.ar`.

Para habilitarla hacen falta, a la vez, `COMMERCIAL_TALO_WEBHOOK_SANDBOX=true` y `COMMERCIAL_TALO_WEBHOOK_LISTENER=1`. Esas variables no van en el repositorio. El listener dedicado agrega la segunda solo cuando se lo ejecuta con `--listen`. No se ejecutó.

El único `customerId` aceptado por esta ruta es `orderops-qa-webhook-burger`. Un aviso de `orderops-qa-burger-house` se rechaza. La consulta autenticada usa únicamente el origen de sandbox. `X-Talo-Signature` no autentica. `economicRecognition` queda en `false`.

La respuesta separa `rejected`, `pending_review`, `confirmed` y `duplicate`. No imprime importes ni datos bancarios. Un 403 de Talo queda como `confirmation_forbidden`, un 404 como `transaction_not_found` y un 5xx o un corte de red como `temporary_confirmation_failure`. Esos casos responden 502 y no se recuerdan. Un aviso fuera de orden se confirma por su propio identificador, sin tapar a otro.

## Idempotencia

La memoria del proceso evita repetir un GET ya observado. No es durable: después de reiniciar, el mismo aviso vuelve a consultarse. Un fallo de verificación no queda marcado como procesado. En T08–T09 hace falta una tabla de avisos, única por proveedor, cliente y transacción, con estados `received`, `pending_review` y `confirmed`, aislada por `business_id`. Esa tabla no abre obligaciones ni escribe `platform_collections`.

## Túnel propuesto

Herramienta: `cloudflared`, apuntando solo al listener de un puerto. No se instala ni se inicia en este lote.

```text
cloudflared tunnel --url http://127.0.0.1:3210 --no-autoupdate
```

El listener, cuando se autorice, escucha en `127.0.0.1:3210` y solo en la ruta de arriba. Cualquier otro path responde 404. El comando sin `--listen` no abre el puerto:

```text
npx tsx scripts/commercial-core/talo-sandbox-webhook-listener.ts
```

La URL pública la imprime `cloudflared` al arrancar y cambia en cada ejecución. No se reserva ahora. Para detenerlo, terminar ese proceso y comprobar que el puerto 3210 quedó cerrado. Antes de usarlo: el túnel no puede apuntar a 3000, a Docker ni a PostgreSQL o Supabase. Llegar a la URL no prueba que el aviso sea de Talo.

Exponer `next dev` publicaría el resto de la aplicación. Por eso el túnel previsto no usa el puerto de Next.

## Segundo cliente

Cuando haya autorización y una URL HTTPS ya verificada, el alta sería `POST /customers/` con `customer_id` `orderops-qa-webhook-burger` y `webhook_url` igual a `https://<host-del-tunel>/api/commercial/talo/sandbox-customer-webhook`. Ese alta crea otro CVU. No se hace ahora. No se usa `PATCH` de alias sobre el cliente existente.

## Dependencias

Falta autorizar el túnel, crear ese segundo cliente y guardar los avisos en un almacén durable. La firma HMAC de Talo sigue pendiente. El webhook no acredita un pago de Commercial Core.
