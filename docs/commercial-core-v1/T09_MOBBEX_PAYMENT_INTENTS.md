# T09 — Intentos sintéticos de Mobbex

Fecha: 17 de octubre de 2026.

Alcance ejecutado: T09-1, T09-2 y T09-3. No hay alta real, listener ni cobro confirmado.

## Qué queda

`commercial.provider_payment_intents` reserva una referencia comercial de Mobbex en `sandbox`. El propósito es `setup_checkout` o `subscription`. `checkout_id` y `subscription_id` tienen índices únicos parciales distintos. Una fila `created` lleva solo el identificador de su propósito. `response_ambiguous` no acepta después un alta automática.

`commercial.provider_payment_events` guarda eventos sintéticos en `pending_unverified`. La clave `synthetic:<delivery>:<nombre-logico>` identifica el evento: la misma clave es una repetición y otro nombre u otra entrega es otro evento. Hay un índice parcial para eventos con intento y otro para `intent_id` nulo. Un evento no cambia el estado del intento ni crea uno nuevo.

El adaptador `observeMobbexFixture` traduce fixtures locales de T06-A. El identificador remoto no fue conservado en ese informe, así que el fixture usa `fixture-checkout-290000` y `fixture-subscription-55000`. ARS 290.000 y ARS 55.000 salen del informe. Una lista vacía de cupones o una operación ausente no registra un pago.

## Permisos

Escriben cuentas internas con `collection.write`. En el catálogo vigente ese permiso corresponde a Finanzas. Un checkout iniciado por el negocio queda para un lote posterior: este permiso no representa a ese actor y T09 no crea un rol nuevo.

## Límites

No se modifican los vínculos ni los recibos de Talo, ni `record_collection`, `reverse_collection` o `impute_provider_receipt`. No hay neto, firma, suscriptor, período diferido, reintento remoto, devolución, contracargo ni imputación. La alta real sigue bloqueada hasta decidir la cuenta de Mobbex. Las credenciales públicas de Demo no son la cuenta de OrderOps.

## Pruebas

| Prueba | Resultado |
| --- | --- |
| `phase09_mobbex_payment_intents.sql` en `ROLLBACK` | PASS |
| `mobbex-synthetic.verify.ts` | PASS, sin red |
| `tsc --noEmit --incremental false` | PASS |
| ESLint de `mobbex-synthetic.ts` y `mobbex-synthetic.verify.ts` | PASS |
| `verify-all` | PASS, 27 archivos, 49 tablas |

`COMMERCIAL_V1_T09_SYNTHETIC: PASS` para T09-1, T09-2 y T09-3 en el QA `orderops-phase06-qa`. La migración es `20261018003000`. La alta real, la recepción real y la confirmación de cobro quedan fuera. No hay commit.
